import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
    groupPostsByWeek,
    cleanupPublishedVideos,
    schedulePost,
    readScheduleQueue,
    writeScheduleQueue,
} from './post-scheduler.js';
import { executeMultiPlatformPublish } from './social-publisher.js';

test('groupPostsByWeek groups posts by week with dates, times, and day labels', () => {
    const mockPosts = [
        {
            id: 'post_1',
            title: '3K Impecável do Revenge',
            scheduledFor: '2026-10-12T18:00:00.000Z',
            timeLabel: '15:00',
            status: 'SCHEDULED',
            platforms: ['tiktok', 'instagram', 'youtube'],
            aiApproval: { status: 'APPROVED', viralScore: 94 },
        },
        {
            id: 'post_2',
            title: 'Ace Histórico no Round Decisivo',
            scheduledFor: '2026-10-14T21:30:00.000Z',
            timeLabel: '18:30',
            status: 'PUBLISHED',
            platforms: ['tiktok', 'instagram', 'youtube'],
            aiApproval: { status: 'APPROVED', viralScore: 98 },
        },
        {
            id: 'post_3',
            title: 'Clutch 1v3 no Overtime',
            scheduledFor: '2026-10-21T20:00:00.000Z',
            timeLabel: '17:00',
            status: 'SCHEDULED',
            platforms: ['tiktok', 'instagram', 'youtube'],
            aiApproval: { status: 'APPROVED', viralScore: 91 },
        },
    ];

    const weeks = groupPostsByWeek(mockPosts);

    assert.ok(Array.isArray(weeks));
    assert.equal(weeks.length, 2);

    // Primeira semana: 12/10 a 18/10
    const week1 = weeks[0];
    assert.equal(week1.posts.length, 2);
    assert.equal(week1.stats.total, 2);
    assert.equal(week1.stats.scheduled, 1);
    assert.equal(week1.stats.published, 1);
    assert.ok(week1.posts[0].dayOfWeek);
    assert.ok(week1.posts[0].formattedDate);

    // Segunda semana: 19/10 a 25/10
    const week2 = weeks[1];
    assert.equal(week2.posts.length, 1);
    assert.equal(week2.stats.total, 1);
    assert.equal(week2.stats.scheduled, 1);
});

test('cleanupPublishedVideos unlinks published video files while retaining records in database', () => {
    const tmpDir = path.join(process.cwd(), 'data', 'temp_test_cleanup');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const testVideoPath = path.join(tmpDir, 'test_cleanup_video.mp4');
    fs.writeFileSync(testVideoPath, Buffer.alloc(1024 * 1024 * 2)); // 2MB dummy file

    const testPost = {
        id: `test_cleanup_${Date.now()}`,
        title: 'Vídeo para Teste de Limpeza',
        status: 'PUBLISHED',
        videoPath: testVideoPath,
        scheduledFor: new Date().toISOString(),
        platforms: ['tiktok', 'instagram', 'youtube'],
        aiApproval: { status: 'APPROVED' },
    };

    writeScheduleQueue([testPost]);

    assert.ok(fs.existsSync(testVideoPath), 'Arquivo físico deve existir antes da limpeza');

    const result = cleanupPublishedVideos({ cleanOrphaned: false });

    assert.ok(result.ok);
    assert.ok(result.freedMb >= 1.9, `Esperado ~2MB liberados, obteve ${result.freedMb}`);
    assert.ok(!fs.existsSync(testVideoPath), 'Arquivo físico deve ser removido para liberar SSD');

    // O registro no banco de dados deve permanecer intacto!
    const queueAfter = readScheduleQueue();
    const retained = queueAfter.find((p) => p.id === testPost.id);
    assert.ok(retained, 'O registro do post deve permanecer no banco de dados');
    assert.equal(retained.fileCleanedUp, true);
    assert.equal(retained.status, 'PUBLISHED');

    // Cleanup temp dir
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

test('executeMultiPlatformPublish supports YouTube Shorts via GhostEngine', async () => {
    const publishResult = await executeMultiPlatformPublish({
        platforms: ['tiktok', 'instagram', 'youtube'],
        title: 'Jogada Épica do Revenge',
        description: 'Melhor clutch do ano no Valorant #shorts',
        dryRun: true,
    });

    assert.ok(publishResult.ok);
    assert.ok(publishResult.results.youtube);
    assert.equal(publishResult.results.youtube.mode, 'GHOST_ENGINE_STUDIO');
    assert.ok(publishResult.results.youtube.caption.includes('#shorts'));
});
