import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateEstimatedEarnings,
    generateValorantBatchCuts,
    scheduleValorantBatchFactory,
    VALORANT_VIRAL_ARCHETYPES,
} from './valorant-autopilot.js';

test('calculateEstimatedEarnings computes realistic multi-platform profits', () => {
    // Cenário conservador: 3 posts/dia, 20.000 views médias
    const earningsConservative = calculateEstimatedEarnings({
        postsPerDay: 3,
        avgViewsPerVideo: 20000,
        activeFollowers: 15000,
        createWeeklyLongVideo: true,
    });

    assert.ok(earningsConservative.totals.totalMonthlyBrl > 1000);
    assert.ok(earningsConservative.totals.totalMonthlyUsd > 200);
    assert.ok(earningsConservative.viewsBreakdown.totalMonthlyViews > 1000000);
    assert.ok(earningsConservative.revenueBreakdownBrl.youtubeLongCompilations > 0);
    assert.ok(earningsConservative.revenueBreakdownBrl.affiliateCommissions > 0);

    // Cenário agressivo: 5 posts/dia, 60.000 views médias
    const earningsAggressive = calculateEstimatedEarnings({
        postsPerDay: 5,
        avgViewsPerVideo: 60000,
        activeFollowers: 70000,
        createWeeklyLongVideo: true,
    });

    assert.ok(earningsAggressive.totals.totalMonthlyBrl > earningsConservative.totals.totalMonthlyBrl);
    assert.ok(earningsAggressive.totals.totalMonthlyBrl >= 15000); // R$ 15k+ mensal
});

test('generateValorantBatchCuts generates 9:16 high-retention cuts with NVENC and ASS settings', () => {
    const cuts = generateValorantBatchCuts({
        sourceVideoUrl: '/videos/partida-completa.mp4',
        agentName: 'Reyna',
        cutsCount: 3,
    });

    assert.equal(cuts.length, 3);
    for (const cut of cuts) {
        assert.ok(cut.cutId.startsWith('val_'));
        assert.ok(cut.title.length > 0);
        assert.ok(cut.duration >= 18 && cut.duration <= 35);
        assert.ok(cut.viralityScore >= 10);
        assert.equal(cut.settings.neonHighlightColor, '#FF1493');
        assert.ok(cut.settings.verticalReframe.includes('9:16'));
        assert.ok(cut.tags.includes('#valorant'));
    }
});

test('scheduleValorantBatchFactory inserts scheduled cuts into queue with optimal slots', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const schedPath = path.join(process.cwd(), 'data', 'scheduled-posts.json');
    const backup = fs.existsSync(schedPath) ? fs.readFileSync(schedPath, 'utf8') : null;

    try {
        const cuts = generateValorantBatchCuts({ cutsCount: 2 });
        const result = scheduleValorantBatchFactory({
            cuts,
            platforms: ['tiktok', 'instagram'],
            tiktokHandle: '@Limbo',
            instagramHandle: '@limboinpink',
        });

        assert.ok(result.ok);
        assert.equal(result.batchSize, 2);
        assert.equal(result.scheduledResults.length, 2);

        const first = result.scheduledResults[0];
        assert.ok(first.jobId.startsWith('sched_'));
        assert.ok(first.timeLabel);
        assert.ok(first.dayLabel);
        assert.deepEqual(first.platforms, ['tiktok', 'instagram']);
    } finally {
        if (backup) {
            fs.writeFileSync(schedPath, backup, 'utf8');
        } else {
            fs.writeFileSync(schedPath, JSON.stringify({ posts: [] }, null, 2), 'utf8');
        }
    }
});
