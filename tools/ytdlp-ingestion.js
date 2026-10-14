import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Monta os argumentos para extrair a URL do stream direto em 720p (Modo Leitura Leve)
 * Permite que o detector em Python leia os frames da live direto da nuvem sem baixar o arquivo no disco.
 */
export function buildYtdlpStreamUrlArgs(url) {
    return [
        '-g',
        '-f', 'best[height<=720]/best',
        String(url),
    ];
}

/**
 * Monta os argumentos para o Modo Cirúrgico (--download-sections)
 * Baixa apenas o trecho exato do highlight em resolução máxima (1080p60 / 1440p60)
 */
export function buildYtdlpSectionArgs(url, startSec, endSec, outputPath) {
    const safeStart = Math.max(0, Math.floor(Number(startSec) || 0));
    const safeEnd = Math.max(safeStart + 1, Math.ceil(Number(endSec) || safeStart + 30));

    return [
        '--download-sections', `*${safeStart}-${safeEnd}`,
        '--force-keyframes-at-cuts',
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '-o', String(outputPath),
        String(url),
    ];
}

/**
 * Extrai a URL direta do stream da live para análise visual rápida
 */
export async function extractStreamAnalysisUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL do stream é obrigatória.');
    }

    try {
        const args = buildYtdlpStreamUrlArgs(url);
        const proc = spawnSync('yt-dlp', args, { encoding: 'utf8', timeout: 30000 });
        if (proc.status === 0 && proc.stdout) {
            const lines = proc.stdout.trim().split('\n').map((l) => l.trim()).filter(Boolean);
            if (lines.length > 0) {
                return lines[0]; // Retorna a primeira URL de vídeo encontrada
            }
        }
        return url; // Fallback para a URL original
    } catch {
        return url;
    }
}

/**
 * Baixa cirurgicamente apenas os segundos do highlight aprovado
 */
export async function downloadSurgicalClip(url, startSec, endSec, outputPath) {
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const args = buildYtdlpSectionArgs(url, startSec, endSec, outputPath);
    const proc = spawnSync('yt-dlp', args, { encoding: 'utf8', timeout: 300000 });

    if (proc.status !== 0) {
        throw new Error(`Falha no download cirúrgico via yt-dlp: ${proc.stderr || 'Erro desconhecido'}`);
    }

    return outputPath;
}
