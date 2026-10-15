import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { aggregateKillHighlights } from './valorant-kill-cluster.js';
import { resolvePythonBinary } from './system-env-check.js';
import { generateViralHookTitle, auditCutWithSocialMediaAI } from './social-media-agent.js';

/**
 * Converte a saída JSON do detector em objetos de Highlights tipados
 */
export function parseDetectorOutput(rawOutput, { filterDeathmatch = true, playerNick = 'Revenge' } = {}) {
    if (!rawOutput) return [];

    let parsed;
    try {
        parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
    } catch {
        return [];
    }

    if (!Array.isArray(parsed)) return [];

    const mapped = parsed.map((item, idx) => {
        const approval = auditCutWithSocialMediaAI({ cut: item, playerNick });
        return {
            id: item.id || `val_cut_${idx + 1}_${(item.tipo || '3k').toLowerCase()}_${Math.round(item.inicio_seg || 0)}s`,
            clipType: item.tipo || item.clipType || '3K',
            killsCount: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg.length : 3,
            startSec: Number(item.inicio_seg ?? 0),
            endSec: Number(item.fim_seg ?? 30),
            duration: Number(item.duracao ?? ((item.fim_seg ?? 30) - (item.inicio_seg ?? 0))),
            killTimes: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg : [],
            gameMode: item.game_mode || item.modo || 'COMPETITIVE_OR_UNRATED',
            isCompetitiveOrUnrated: item.is_competitive_or_unrated !== false,
            thumbnail: item.thumbnail || null,
            aiApproval: approval,
            viralScore: approval.viralScore,
            isApproved: approval.status === 'APPROVED',
            headline: generateViralHookTitle({
                playerNick,
                clipType: item.tipo,
                killsCount: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg.length : 3,
                killTimes: Array.isArray(item.tempos_kills_seg) ? item.tempos_kills_seg : [],
                startSec: Number(item.inicio_seg ?? 0),
                endSec: Number(item.fim_seg ?? 30),
                duration: Number(item.duracao ?? ((item.fim_seg ?? 30) - (item.inicio_seg ?? 0))),
                index: idx,
            }),
        };
    });

    if (filterDeathmatch) {
        return mapped.filter((cut) => {
            const isDm = cut.gameMode === 'MATA_MATA' || cut.gameMode === 'DEATHMATCH' || cut.killsCount > 6;
            return !isDm;
        });
    }

    return mapped;
}

/**
 * Executa o detector em Python sobre o arquivo de vídeo ou stream
 * @param {string} videoSource
 * @param {object} [options]
 * @param {string} [options.templatePath]
 * @param {number} [options.limiar]
 * @param {number|null} [options.maxSeconds]
 * @param {boolean} [options.filterDeathmatch]
 * @param {boolean} [options.dryRun]
 * @param {boolean} [options.debug]
 */
export async function runKillHunterAnalysis(videoSource, {
    templatePath = path.join(process.cwd(), 'public', 'templates', 'meu_kill_template.png'),
    playerNick = 'Revenge',
    limiar = 0.76,
    limiarText = 0.755,
    startSeconds = 0.0,
    maxSeconds = null,
    filterDeathmatch = true,
    dryRun = false,
    debug = false,
} = {}) {
    if (dryRun || !videoSource) {
        return [];
    }

    let resolvedSource = String(videoSource).trim();
    if (!/^https?:\/\//i.test(resolvedSource) && !path.isAbsolute(resolvedSource)) {
        const rawPath = path.join(process.cwd(), 'raw_gameplays', resolvedSource);
        const tempPath = path.join(process.cwd(), 'temp_cuts', resolvedSource);
        const rootPath = path.join(process.cwd(), resolvedSource);
        if (fs.existsSync(rawPath)) {
            resolvedSource = rawPath;
        } else if (fs.existsSync(tempPath)) {
            resolvedSource = tempPath;
        } else if (fs.existsSync(rootPath)) {
            resolvedSource = rootPath;
        }
    }

    const scriptPath = path.join(process.cwd(), 'tools', 'detector_kills.py');
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script detector_kills.py não encontrado em: ${scriptPath}`);
    }

    const resolvedPy = resolvePythonBinary();
    const pythonCandidates = [resolvedPy, 'python', 'py', 'python3'].filter(Boolean);
    let stdout = '';
    let executed = false;

    for (const py of pythonCandidates) {
        try {
            const args = [
                scriptPath,
                String(resolvedSource),
                '--player-nick', String(playerNick),
                '--limiar', String(limiar),
                '--limiar-text', String(limiarText),
            ];
            if (fs.existsSync(templatePath)) {
                args.push('--template', templatePath);
            }
            if (startSeconds && Number(startSeconds) > 0) {
                args.push('--start-seconds', String(startSeconds));
            }
            if (maxSeconds && Number(maxSeconds) > 0) {
                args.push('--max-seconds', String(maxSeconds));
            }
            if (filterDeathmatch) {
                args.push('--filter-deathmatch');
            } else {
                args.push('--no-filter-deathmatch');
            }
            if (debug) {
                args.push('--debug');
            }

            const proc = spawnSync(py, args, { encoding: 'utf8', timeout: 600000 });
            if (proc.status === 0 && proc.stdout) {
                stdout = proc.stdout.trim();
                executed = true;
                break;
            } else if (debug || proc.status !== 0) {
                if (proc.stderr) {
                    console.error(`[KILL HUNTER STDERR (${py})]:`, proc.stderr);
                }
            }
        } catch (err) {
            if (debug) {
                console.error(`[KILL HUNTER SPAWN ERROR (${py})]:`, err);
            }
        }
    }

    if (!executed || !stdout) {
        return [];
    }

    return parseDetectorOutput(stdout, { filterDeathmatch, playerNick });
}
