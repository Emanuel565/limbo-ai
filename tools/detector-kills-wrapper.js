import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { aggregateKillHighlights } from './valorant-kill-cluster.js';

/**
 * Converte a saída JSON do detector em objetos de Highlights tipados
 */
export function parseDetectorOutput(rawOutput) {
    if (!rawOutput) return [];

    let parsed;
    try {
        parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
    } catch {
        return [];
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, idx) => ({
        id: item.id || `val_cut_${idx + 1}_${(item.tipo || '3k').toLowerCase()}_${Math.round(item.inicio_seg || 0)}s`,
        clipType: item.tipo || item.clipType || '3K',
        killsCount: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg.length : 3,
        startSec: Number(item.inicio_seg ?? 0),
        endSec: Number(item.fim_seg ?? 30),
        duration: Number(item.duracao ?? ((item.fim_seg ?? 30) - (item.inicio_seg ?? 0))),
        killTimes: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg : [],
        headline: (item.tipo || '3K') === 'ACE' ? 'ACE HISTÓRICO NO VALORANT 👑' : `${item.tipo || '3K'} INSANO NO ROUND 🔥`,
    }));
}

/**
 * Executa o detector em Python sobre o arquivo de vídeo ou stream
 */
export async function runKillHunterAnalysis(videoSource, {
    templatePath = path.join(process.cwd(), 'public', 'templates', 'meu_kill_template.png'),
    limiar = 0.76,
    dryRun = false,
    debug = false,
} = {}) {
    if (dryRun || !videoSource) {
        return [];
    }

    const scriptPath = path.join(process.cwd(), 'tools', 'detector_kills.py');
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script detector_kills.py não encontrado em: ${scriptPath}`);
    }

    const pythonCandidates = ['python', 'py', 'python3'];
    let stdout = '';
    let executed = false;

    for (const py of pythonCandidates) {
        try {
            const args = [scriptPath, String(videoSource), '--limiar', String(limiar)];
            if (fs.existsSync(templatePath)) {
                args.push('--template', templatePath);
            }
            if (debug) {
                args.push('--debug');
            }

            const proc = spawnSync(py, args, { encoding: 'utf8', timeout: 300000 });
            if (proc.status === 0 && proc.stdout) {
                stdout = proc.stdout.trim();
                executed = true;
                break;
            }
        } catch {
            // try next python command
        }
    }

    if (!executed || !stdout) {
        // Fallback gracioso: retorna lista vazia quando Python não estiver disponível no host
        return [];
    }

    return parseDetectorOutput(stdout);
}
