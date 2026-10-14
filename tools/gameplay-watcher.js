import fs from 'node:fs';
import path from 'node:path';
import { generateValorantBatchCuts, scheduleValorantBatchFactory } from './valorant-autopilot.js';
import { analyzeAndGenerateCutsForGameplay } from './gameplay-ai-analyzer.js';

export const RAW_GAMEPLAYS_DIR = path.join(process.cwd(), 'raw_gameplays');
export const STATS_FILE = path.join(process.cwd(), 'data', 'watcher-stats.json');

const VALID_EXTENSIONS = new Set(['.mp4', '.mkv', '.mov', '.avi', '.webm']);
const TEMP_EXTENSIONS = new Set(['.crdownload', '.part', '.tmp', '.download', '.aria2']);

function ensureDirectories() {
    if (!fs.existsSync(RAW_GAMEPLAYS_DIR)) {
        fs.mkdirSync(RAW_GAMEPLAYS_DIR, { recursive: true });
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

export function readWatcherStats() {
    ensureDirectories();
    if (!fs.existsSync(STATS_FILE)) {
        return {
            totalGameplaysProcessed: 0,
            totalCutsGenerated: 0,
            totalBytesFreed: 0,
            lastProcessedAt: null,
            history: [],
        };
    }
    try {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {
            totalGameplaysProcessed: 0,
            totalCutsGenerated: 0,
            totalBytesFreed: 0,
            lastProcessedAt: null,
            history: [],
        };
    }
}

export function saveWatcherStats(stats) {
    ensureDirectories();
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
}

/**
 * Verifica se o arquivo parou de ser gravado pelo OBS ou baixado pelo navegador
 */
export async function isFileStable(filePath, checkIntervalMs = 1200) {
    try {
        if (!fs.existsSync(filePath)) return false;

        const stat1 = fs.statSync(filePath);
        if (stat1.size === 0) return false;

        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));

        if (!fs.existsSync(filePath)) return false;
        const stat2 = fs.statSync(filePath);

        // Se o tamanho permaneceu o mesmo, o arquivo está estável
        if (stat1.size !== stat2.size) return false;

        // Tenta abrir o arquivo para leitura (se o OBS estiver com lock exclusivo de escrita, vai falhar)
        const fd = fs.openSync(filePath, 'r');
        fs.closeSync(fd);
        return true;
    } catch {
        return false;
    }
}

/**
 * Escaneia a pasta raw_gameplays e lista arquivos
 */
export function scanRawGameplaysFolder() {
    ensureDirectories();
    const entries = fs.readdirSync(RAW_GAMEPLAYS_DIR, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (TEMP_EXTENSIONS.has(ext)) {
            files.push({
                name: entry.name,
                path: path.join(RAW_GAMEPLAYS_DIR, entry.name),
                sizeBytes: 0,
                status: 'DOWNLOADING_OR_RECORDING',
                isReady: false,
            });
            continue;
        }

        if (!VALID_EXTENSIONS.has(ext)) continue;

        const fullPath = path.join(RAW_GAMEPLAYS_DIR, entry.name);
        let sizeBytes = 0;
        let birthtime = new Date().toISOString();
        try {
            const st = fs.statSync(fullPath);
            sizeBytes = st.size;
            birthtime = st.birthtime.toISOString();
        } catch {}

        files.push({
            name: entry.name,
            path: fullPath,
            sizeBytes,
            sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(1)),
            birthtime,
            status: 'READY_TO_PROCESS',
            isReady: sizeBytes > 0,
        });
    }

    return files;
}

/**
 * Processa uma única gameplay:
 * 1. Análise de arquétipos virais
 * 2. Geração dos 10 a 20 cortes verticais 9:16
 * 3. Agendamento nas 3 redes (TikTok, Instagram, YouTube)
 * 4. Auto-exclusão segura do arquivo original
 */
export async function processGameplayFile(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const originalSizeBytes = stat.size;
    const cutsCount = options.cutsCount === 'auto' || !options.cutsCount
        ? 'auto'
        : Math.min(30, Math.max(3, Number(options.cutsCount)));
    const platforms = options.platforms || ['tiktok', 'instagram', 'youtube'];
    const tiktokHandle = options.tiktokHandle || '@limboinpink';
    const instagramHandle = options.instagramHandle || '@limboinpink';
    const youtubeHandle = options.youtubeHandle || '@limboinpink';
    const renderClips = Boolean(options.renderClips);

    // 1. Executa a análise inteligente com GhostEngine (Trends) + Heurísticas de Retenção
    const aiAnalysis = await analyzeAndGenerateCutsForGameplay({
        filePath,
        cutsCount,
        platforms,
        tiktokHandle,
        instagramHandle,
        youtubeHandle,
        renderClips,
    });

    const cuts = aiAnalysis.cuts;
    const scheduled = aiAnalysis.scheduledPosts;

    // 2. Só exclui a gameplay original se TODOS os cortes foram renderizados e agendados.
    //    Caso contrário, arquiva em raw_gameplays/_processados/ para não perder a gravação
    //    nem reprocessá-la a cada varredura do daemon.
    let deletedSuccess = false;
    let deleteError = null;
    let archivedPath = null;
    const allCutsRendered = cuts.length > 0 && scheduled.length === cuts.length;
    try {
        if (allCutsRendered) {
            fs.unlinkSync(filePath);
            deletedSuccess = true;
        } else {
            const archiveDir = path.join(RAW_GAMEPLAYS_DIR, '_processados');
            fs.mkdirSync(archiveDir, { recursive: true });
            archivedPath = path.join(archiveDir, fileName);
            fs.renameSync(filePath, archivedPath);
        }
    } catch (err) {
        deleteError = err.message;
        console.warn(`[Watcher] Aviso ao excluir/arquivar gameplay original ${fileName}:`, err.message);
    }

    // 4. Atualiza as estatísticas globais
    const stats = readWatcherStats();
    stats.totalGameplaysProcessed += 1;
    stats.totalCutsGenerated += cuts.length;
    if (deletedSuccess) {
        stats.totalBytesFreed += originalSizeBytes;
    }
    stats.lastProcessedAt = new Date().toISOString();
    stats.history.unshift({
        fileName,
        processedAt: new Date().toISOString(),
        originalSizeMb: Number((originalSizeBytes / (1024 * 1024)).toFixed(1)),
        cutsGenerated: cuts.length,
        cutsScheduled: scheduled.length,
        deletedSuccess,
        archivedPath,
        platforms,
    });

    // Mantém no máximo 50 registros no histórico
    if (stats.history.length > 50) stats.history.length = 50;
    saveWatcherStats(stats);

    return {
        ok: true,
        fileName,
        originalSizeMb: Number((originalSizeBytes / (1024 * 1024)).toFixed(1)),
        cutsCount: cuts.length,
        scheduledBatchId: scheduled[0]?.id || scheduled[0]?.jobId,
        scheduledJobs: scheduled,
        scheduledCount: scheduled.length,
        pendingRenderCount: cuts.length - scheduled.length,
        deletedOriginal: deletedSuccess,
        archivedPath,
        deleteError,
    };
}

/**
 * Varre a pasta e processa todos os vídeos estáveis encontrados
 */
export async function scanAndProcessAll(options = {}) {
    const files = scanRawGameplaysFolder();
    const readyFiles = files.filter((f) => f.isReady);
    const results = [];

    for (const file of readyFiles) {
        const stable = await isFileStable(file.path, 1000);
        if (!stable) {
            results.push({ fileName: file.name, skipped: true, reason: 'Arquivo ainda em gravação/download ativo.' });
            continue;
        }

        try {
            const res = await processGameplayFile(file.path, options);
            results.push(res);
        } catch (err) {
            results.push({ fileName: file.name, error: err.message });
        }
    }

    return {
        scannedCount: files.length,
        processedCount: results.filter((r) => r.ok).length,
        results,
    };
}

// -------------------------------------------------------------
// Watcher Daemon em segundo plano
// -------------------------------------------------------------
let watcherTimer = null;
let isWatcherActive = false;
let isProcessingBatch = false;

export function startWatcherDaemon(intervalSeconds = 15, options = {}) {
    if (isWatcherActive) return { active: true, message: 'Daemon já está rodando.' };

    isWatcherActive = true;
    const intervalMs = Math.max(5, intervalSeconds) * 1000;

    watcherTimer = setInterval(async () => {
        if (isProcessingBatch) return;
        isProcessingBatch = true;
        try {
            await scanAndProcessAll(options);
        } catch (err) {
            console.error('[Watcher Daemon] Erro no ciclo de varredura:', err.message);
        } finally {
            isProcessingBatch = false;
        }
    }, intervalMs);

    return { active: true, intervalSeconds, message: `Watcher ativo: verificando raw_gameplays/ a cada ${intervalSeconds}s.` };
}

export function stopWatcherDaemon() {
    if (watcherTimer) {
        clearInterval(watcherTimer);
        watcherTimer = null;
    }
    isWatcherActive = false;
    isProcessingBatch = false;
    return { active: false, message: 'Watcher daemon finalizado.' };
}

export function getWatcherDaemonStatus() {
    const files = scanRawGameplaysFolder();
    const stats = readWatcherStats();
    return {
        isActive: isWatcherActive,
        isProcessing: isProcessingBatch,
        watchDirectory: RAW_GAMEPLAYS_DIR,
        filesWaiting: files,
        filesWaitingCount: files.length,
        stats: {
            totalGameplaysProcessed: stats.totalGameplaysProcessed,
            totalCutsGenerated: stats.totalCutsGenerated,
            totalGbFreed: Number((stats.totalBytesFreed / (1024 * 1024 * 1024)).toFixed(2)),
            lastProcessedAt: stats.lastProcessedAt,
            recentHistory: stats.history.slice(0, 5),
        },
    };
}
