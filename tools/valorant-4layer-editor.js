import fs from 'node:fs';
import path from 'node:path';
import { resolveFfmpegBinary } from './viral-short-pipeline.js';
import { detectAudioLevel, getOptimalBgmTrack } from './gameplay-ai-analyzer.js';
function getWindowsFontArg() {
    const boldArial = 'C:/Windows/Fonts/arialbd.ttf';
    const regArial = 'C:/Windows/Fonts/arial.ttf';
    if (fs.existsSync(boldArial)) return "fontfile='C\\:/Windows/Fonts/arialbd.ttf':";
    if (fs.existsSync(regArial)) return "fontfile='C\\:/Windows/Fonts/arial.ttf':";
    return '';
}

/**
 * Constrói o filter_complex com 4 camadas verticais (9:16 - 1080x1920):
 * 1. [bg]: Jogo esticado com blur rápido (downscale 360x640 -> boxblur -> upscale 1080x1920)
 * 2. [mira]: Recorte central da mira e banner de abate
 * 3. [mapa]: Minimapa tático ampliado no topo esquerdo (420x420)
 * 4. [killfeed]: Killfeed ampliado no topo direito (620x320)
 *
 * Tratamento de Velocidade & Áudio:
 * - Segmentos 3x Fast-Forward usam setpts e atempo=2.0,atempo=1.5 EXCLUSIVAMENTE na faixa de jogo ([0:a]).
 * - A mixagem e ducking da trilha BGM acontecem APÓS o concat para que a música de fundo nunca seja acelerada.
 */
export function build4LayerFilterComplex(segments, {
    width = 1080,
    height = 1920,
    hasBgm = false,
    isSourceMuted = false,
    hookHeadline = null,
    showFastForwardBadge = false,
    subtitlesAssPath = null,
    totalOutputDuration = 0,
} = {}) {
    const filterParts = [];
    const safeSegments = Array.isArray(segments) && segments.length > 0
        ? segments
        : [{ start: 0, end: 15, speed: 1, duration: 15, isFastForward: false }];

    // 1. Construção das 4 Camadas Visuais Base a partir de [0:v]
    // Camada 1: Background com blur de altíssima performance (Rule 1)
    filterParts.push(`[0:v]scale=360:640:force_original_aspect_ratio=increase,crop=360:640,boxblur=15:2,eq=brightness=-0.18,scale=${width}:${height}[bg]`);

    // Camada 2: Mira e ação central
    filterParts.push(`[0:v]crop=in_w*0.48:in_h*0.58:(in_w-ow)/2:(in_h-oh)/2,scale=${width}:1080[mira]`);

    // Camada 3: Minimapa no topo esquerdo (420x420)
    filterParts.push(`[0:v]crop=380:380:20:20,scale=420:420[mapa]`);

    // Camada 4: Killfeed no topo direito (620x320)
    filterParts.push(`[0:v]crop=520:280:in_w-540:35,scale=620:320[killfeed]`);

    // Composição e sobreposição das camadas
    filterParts.push(`[bg][mira]overlay=0:(H-h)/2[b1]`);
    filterParts.push(`[b1][mapa]overlay=30:60[b2]`);
    filterParts.push(`[b2][killfeed]overlay=W-w-30:60[v_composed]`);

    // 2. Fatiamento de Segmentos de Tempo & Velocidade (Fast-Forward)
    const vInputs = [];
    const aInputs = [];

    safeSegments.forEach((seg, i) => {
        const segStart = Number(seg.start);
        const segEnd = Number(seg.end);
        const isFF = seg.speed === 3 || seg.isFastForward;

        if (isFF) {
            // Vídeo 3x
            let vPipe = `[v_composed]trim=start=${segStart}:end=${segEnd},setpts=0.333333*(PTS-STARTPTS)`;
            if (showFastForwardBadge) {
                vPipe += `,drawtext=${getWindowsFontArg()}text='>> 3x':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=340:box=1:boxcolor=black@0.65:boxborderw=8`;
            }
            filterParts.push(`${vPipe}[v${i}]`);

            // Áudio do jogo acelerado em 3x (atempo 2.0 * 1.5 = 3.0x)
            filterParts.push(`[0:a]atrim=start=${segStart}:end=${segEnd},asetpts=PTS-STARTPTS,atempo=2.0,atempo=1.5[a${i}]`);
        } else {
            // Normal 1x
            filterParts.push(`[v_composed]trim=start=${segStart}:end=${segEnd},setpts=PTS-STARTPTS[v${i}]`);
            filterParts.push(`[0:a]atrim=start=${segStart}:end=${segEnd},asetpts=PTS-STARTPTS[a${i}]`);
        }

        vInputs.push(`[v${i}]`);
        aInputs.push(`[a${i}]`);
    });

    // 3. Concatenação dos Segmentos (Vídeo + Áudio do Jogo)
    const concatInputs = [];
    for (let i = 0; i < safeSegments.length; i++) {
        concatInputs.push(vInputs[i], aInputs[i]);
    }
    filterParts.push(`${concatInputs.join('')}concat=n=${safeSegments.length}:v=1:a=1[v_cat][a_game_cat]`);

    // 4. Efeitos Finais de Vídeo (Barra de Progresso & Headline & Legendas ASS)
    let vFinalFilter = '[v_cat]';
    if (hookHeadline) {
        const cleanHeadline = String(hookHeadline).replace(/['":\\%,;]/g, ' ').slice(0, 48).trim();
        vFinalFilter += `drawbox=y=130:color=black@0.70:width=iw:height=125:t=fill,drawtext=${getWindowsFontArg()}text='${cleanHeadline}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=170,`;
    }
    const safeDur = totalOutputDuration > 0 ? totalOutputDuration : 30;
    let vOutChain = `drawbox=x=0:y=ih-14:w='iw*t/${safeDur}':h=14:color=0xFF1493@0.95:t=fill`;
    if (subtitlesAssPath) {
        const escapedAss = String(subtitlesAssPath).replace(/\\/g, '/').replace(/:/g, '\\:');
        vOutChain += `,ass='${escapedAss}'`;
    }
    filterParts.push(`${vFinalFilter}${vOutChain}[vout]`);

    // 5. Inteligência de Áudio: Ducking ou Injeção de BGM APÓS o concat (Rule 2)
    if (hasBgm && !isSourceMuted) {
        // Áudio original existe: ducking (jogo 100% + música 25%)
        filterParts.push(`[a_game_cat]volume=1.0[a0_norm];[1:a]volume=0.25[a1_norm];[a0_norm][a1_norm]amix=inputs=2:duration=first:dropout_transition=2,volume=1.2[aout]`);
    } else if (hasBgm && isSourceMuted) {
        // Áudio original mudo: consome [a_game_cat] e toca a trilha com volume otimizado
        filterParts.push(`[a_game_cat]volume=0.0[a0_mute];[1:a]volume=0.95,afade=t=in:st=0:d=0.4[a1_norm];[a0_mute][a1_norm]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
    } else {
        // Apenas o áudio original do jogo
        filterParts.push(`[a_game_cat]volume=1.0[aout]`);
    }

    return {
        filterComplex: filterParts.join(';'),
        outputMaps: ['-map', '[vout]', '-map', '[aout]'],
    };
}

/**
 * Monta os argumentos completos da linha de comando do FFmpeg com aceleração NVIDIA NVENC
 */
export function build4LayerFfmpegArgs({
    inputPath,
    outputPath,
    segments = [],
    useNvenc = true,
    bgmPath = null,
    forceMuted = false,
    hookHeadline = null,
    showFastForwardBadge = false,
    subtitlesAssPath = null,
} = {}) {
    // Mantém 100% o áudio original do jogo. Trilha BGM só é adicionada se explicitamente configurada em bgmPath.
    const chosenBgm = bgmPath;
    const hasBgm = Boolean(chosenBgm && fs.existsSync(chosenBgm));
    const audioLevel = forceMuted ? { isMuted: true } : detectAudioLevel(inputPath, segments[0]?.start || 0);
    const isSourceMuted = forceMuted || (hasBgm && audioLevel.isMuted);

    // Calcula duração total de saída estimada (somando segmentos e dividindo os de 3x)
    const totalOutputDuration = segments.reduce((acc, s) => {
        const segDur = s.duration || (s.end - s.start);
        return acc + (s.speed === 3 ? segDur / 3 : segDur);
    }, 0);

    const { filterComplex, outputMaps } = build4LayerFilterComplex(segments, {
        hasBgm,
        isSourceMuted,
        hookHeadline,
        showFastForwardBadge,
        subtitlesAssPath,
        totalOutputDuration: Math.round(totalOutputDuration),
    });

    const vCodec = useNvenc
        ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq', '-b:v', '8M', '-maxrate', '12M', '-bufsize', '16M', '-pix_fmt', 'yuv420p']
        : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p'];

    const args = ['-y', '-i', String(inputPath)];

    if (hasBgm) {
        args.push('-stream_loop', '-1', '-i', String(chosenBgm));
    }

    args.push(
        '-filter_complex', filterComplex,
        ...outputMaps,
        ...vCodec,
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        '-movflags', '+faststart',
        String(outputPath),
    );

    return args;
}
