import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    RAW_GAMEPLAYS_DIR,
    scanRawGameplaysFolder,
    isFileStable,
    processGameplayFile,
    readWatcherStats,
    getWatcherDaemonStatus,
    STATS_FILE,
} from './gameplay-watcher.js';
import { shutdownGhostEngine } from './ghost-engine.js';

test('scanRawGameplaysFolder discovers valid videos and ignores temp downloads', () => {
    if (!fs.existsSync(RAW_GAMEPLAYS_DIR)) {
        fs.mkdirSync(RAW_GAMEPLAYS_DIR, { recursive: true });
    }

    const testVideo = path.join(RAW_GAMEPLAYS_DIR, '__test_partida_1.mp4');
    const testTemp = path.join(RAW_GAMEPLAYS_DIR, '__test_download.crdownload');

    fs.writeFileSync(testVideo, Buffer.alloc(1024 * 100)); // 100 KB
    fs.writeFileSync(testTemp, Buffer.alloc(1024 * 50));

    try {
        const files = scanRawGameplaysFolder();
        const foundVideo = files.find((f) => f.name === '__test_partida_1.mp4');
        const foundTemp = files.find((f) => f.name === '__test_download.crdownload');

        assert.ok(foundVideo);
        assert.equal(foundVideo.isReady, true);
        assert.equal(foundVideo.status, 'READY_TO_PROCESS');

        assert.ok(foundTemp);
        assert.equal(foundTemp.isReady, false);
        assert.equal(foundTemp.status, 'DOWNLOADING_OR_RECORDING');
    } finally {
        if (fs.existsSync(testVideo)) fs.unlinkSync(testVideo);
        if (fs.existsSync(testTemp)) fs.unlinkSync(testTemp);
    }
});

test('isFileStable returns true for completed static files and false for non-existent', async () => {
    const testFile = path.join(RAW_GAMEPLAYS_DIR, '__test_stable.mp4');
    fs.writeFileSync(testFile, Buffer.alloc(1024 * 50));

    try {
        const stable = await isFileStable(testFile, 100);
        assert.equal(stable, true);

        const unstable = await isFileStable(path.join(RAW_GAMEPLAYS_DIR, 'non_existent.mp4'), 50);
        assert.equal(unstable, false);
    } finally {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }
});

test('processGameplayFile never schedules unrendered cuts and archives (not deletes) the original', async () => {
    const testVideo = path.join(RAW_GAMEPLAYS_DIR, '__test_gameplay_to_delete.mp4');
    const archived = path.join(RAW_GAMEPLAYS_DIR, '_processados', '__test_gameplay_to_delete.mp4');
    fs.writeFileSync(testVideo, Buffer.alloc(1024 * 500)); // 500 KB

    // Backup dos arquivos de produção: testes NUNCA podem deixar lixo na fila/estatísticas reais
    const dataFiles = [STATS_FILE, path.join(process.cwd(), 'data', 'scheduled-posts.json')];
    const backups = dataFiles.map((f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null));

    try {
        const result = await processGameplayFile(testVideo, {
            cutsCount: 6,
            platforms: ['tiktok', 'instagram', 'youtube'],
        });

        assert.equal(result.ok, true);
        assert.equal(result.cutsCount, 6);
        // Sem clipes renderizados no disco => nada entra na fila
        assert.equal(result.scheduledCount, 0);
        assert.equal(result.pendingRenderCount, 6);
        // Gravação original preservada (arquivada), nunca apagada sem render
        assert.equal(result.deletedOriginal, false);
        assert.equal(fs.existsSync(testVideo), false);
        assert.equal(fs.existsSync(archived), true);

        const stats = readWatcherStats();
        assert.ok(stats.totalGameplaysProcessed >= 1);

        const daemonStatus = getWatcherDaemonStatus();
        assert.ok(daemonStatus.watchDirectory);
    } finally {
        if (fs.existsSync(testVideo)) fs.unlinkSync(testVideo);
        if (fs.existsSync(archived)) fs.unlinkSync(archived);
        dataFiles.forEach((f, i) => {
            if (backups[i] !== null) fs.writeFileSync(f, backups[i], 'utf8');
        });
        await shutdownGhostEngine();
    }
});
