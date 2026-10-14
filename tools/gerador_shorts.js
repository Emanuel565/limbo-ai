#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runKillHunterAnalysis } from './detector-kills-wrapper.js';
import { downloadSurgicalClip } from './ytdlp-ingestion.js';
import { calculateSpeedSegments } from './valorant-speed-timeline.js';
import { build4LayerFfmpegArgs } from './valorant-4layer-editor.js';
import { resolveFfmpegBinary } from './viral-short-pipeline.js';

/**
 * Orquestrador ponta a ponta para geração de cortes verticais 9:16 de Valorant
 */
export async function processValorantVodShorts(vodSource, {
    outputDir = path.join(process.cwd(), 'cortes_prontos'),
    cuts = null,
    useNvenc = true,
    dryRun = false,
    debug = false,
} = {}) {
    if (!vodSource || typeof vodSource !== 'string' || !vodSource.trim()) {
        throw new Error('Fonte de vídeo ou URL é obrigatória.');
    }

    const source = vodSource.trim();
    const isUrl = /^https?:\/\//i.test(source);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Detecção de Destaques (se não foram fornecidos previamente pela UI)
    let highlights = cuts;
    if (!Array.isArray(highlights) || highlights.length === 0) {
        highlights = await runKillHunterAnalysis(source, { debug });
    }

    if (!Array.isArray(highlights) || highlights.length === 0) {
        return {
            success: true,
            message: 'Nenhum highlight com >= 3 abates foi detectado nesta gameplay/live.',
            cutsProcessed: 0,
            outputFiles: [],
            cuts: [],
        };
    }

    const outputFiles = [];
    const ffmpegBin = resolveFfmpegBinary();

    for (const cut of highlights) {
        const cutId = cut.id || `val_cut_${cut.clipType || 'highlight'}_${Math.round(cut.startSec || 0)}s`;
        const finalOutputPath = path.join(outputDir, `${cutId}.mp4`);

        // 2. Cálculo dos segmentos de velocidade (Fast-Forward 3x para intervalos > 8s)
        const segments = calculateSpeedSegments(cut);

        if (dryRun) {
            outputFiles.push(finalOutputPath);
            continue;
        }

        let inputForFfmpeg = source;
        let tempDownloadFile = null;

        try {
            // 3. Download Cirúrgico (--download-sections) se for live/VOD online
            if (isUrl) {
                const tempDir = path.join(process.cwd(), 'temp_cuts');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                tempDownloadFile = path.join(tempDir, `raw_${cutId}.mp4`);
                await downloadSurgicalClip(source, cut.startSec, cut.endSec, tempDownloadFile);
                inputForFfmpeg = tempDownloadFile;

                // Como o arquivo baixado já começa em 0 relativo ao corte, ajusta segmentos
                const offset = cut.startSec;
                const relativeSegments = segments.map((s) => ({
                    ...s,
                    start: Math.max(0, s.start - offset),
                    end: Math.max(0, s.end - offset),
                }));

                // 4. Renderização 4-Camadas 9:16 com NVENC
                const ffmpegArgs = build4LayerFfmpegArgs({
                    inputPath: inputForFfmpeg,
                    outputPath: finalOutputPath,
                    segments: relativeSegments,
                    useNvenc,
                    hookHeadline: cut.headline,
                    showFastForwardBadge: true,
                });

                const renderProc = spawnSync(ffmpegBin, ffmpegArgs, { stdio: 'inherit', timeout: 300000 });
                if (renderProc.status === 0 && fs.existsSync(finalOutputPath) && fs.statSync(finalOutputPath).size > 1000) {
                    cut.id = cutId;
                    cut.rendered = true;
                    cut.renderedPath = finalOutputPath;
                    cut.videoUrl = `/generated/${path.basename(finalOutputPath)}`;
                    outputFiles.push(finalOutputPath);
                } else {
                    cut.rendered = false;
                    console.error(`[gerador_shorts] Falha no FFmpeg para ${cutId}. Status: ${renderProc.status}`);
                }
            } else {
                // Arquivo local em disco (raw_gameplays/)
                const ffmpegArgs = build4LayerFfmpegArgs({
                    inputPath: inputForFfmpeg,
                    outputPath: finalOutputPath,
                    segments,
                    useNvenc,
                    hookHeadline: cut.headline,
                    showFastForwardBadge: true,
                });

                const renderProc = spawnSync(ffmpegBin, ffmpegArgs, { stdio: 'inherit', timeout: 300000 });
                if (renderProc.status === 0 && fs.existsSync(finalOutputPath) && fs.statSync(finalOutputPath).size > 1000) {
                    cut.id = cutId;
                    cut.rendered = true;
                    cut.renderedPath = finalOutputPath;
                    cut.videoUrl = `/generated/${path.basename(finalOutputPath)}`;
                    outputFiles.push(finalOutputPath);
                } else {
                    cut.rendered = false;
                    console.error(`[gerador_shorts] Falha no FFmpeg para ${cutId}. Status: ${renderProc.status}`);
                }
            }
        } finally {
            // Limpa arquivo temporário bruto do download cirúrgico
            if (tempDownloadFile && fs.existsSync(tempDownloadFile)) {
                try {
                    fs.unlinkSync(tempDownloadFile);
                } catch {
                    // ignore
                }
            }
        }
    }

    return {
        success: true,
        cutsProcessed: outputFiles.length,
        outputFiles,
        cuts: highlights,
    };
}

// Execução via terminal CLI (Ex: node tools/gerador_shorts.js "LINK_DA_LIVE")
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
    const inputArg = process.argv[2];
    if (!inputArg) {
        console.log('Uso: node tools/gerador_shorts.js <LINK_DA_LIVE_OU_ARQUIVO_LOCAL>');
        process.exit(0);
    }

    console.log(`[Gerador Shorts] Iniciando processamento de: ${inputArg}`);
    processValorantVodShorts(inputArg)
        .then((res) => {
            console.log(`[Gerador Shorts] Concluído! ${res.cutsProcessed} cortes gerados.`);
            console.log(res.outputFiles);
        })
        .catch((err) => {
            console.error('[Gerador Shorts] Erro:', err.message);
            process.exit(1);
        });
}
