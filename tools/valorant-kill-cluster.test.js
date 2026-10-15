import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateKillHighlights } from './valorant-kill-cluster.js';

test('aggregateKillHighlights clusters 3 or more kills within 30s with proper margins', () => {
    const rawKills = [100.5, 104.2, 108.0, 115.0]; // 4 kills within 15 seconds
    const highlights = aggregateKillHighlights(rawKills, {
        windowSec: 30,
        minKills: 3,
        preMarginSec: 4,
        postMarginSec: 3,
    });

    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, '4K');
    assert.strictEqual(highlights[0].startSec, 96.5); // 100.5 - 4s
    assert.strictEqual(highlights[0].endSec, 118.0);   // 115.0 + 3s
    assert.strictEqual(highlights[0].killTimes.length, 4);
});

test('aggregateKillHighlights classifies 5 kills as ACE', () => {
    const aceKills = [200, 203, 207, 212, 218];
    const highlights = aggregateKillHighlights(aceKills);
    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, 'ACE');
});

test('aggregateKillHighlights classifies exactly 3 kills as 3K', () => {
    const tripleKills = [300, 305, 310];
    const highlights = aggregateKillHighlights(tripleKills);
    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, '3K');
});

test('aggregateKillHighlights ignores isolated kills (< 3 kills in 30s)', () => {
    const sparseKills = [50, 120, 240, 500];
    const highlights = aggregateKillHighlights(sparseKills);
    assert.strictEqual(highlights.length, 0);
});

test('aggregateKillHighlights deduplicates overlapping clusters into maximum kill highlight', () => {
    // 5 kills spanning 22 seconds: [400, 404, 408, 414, 422]
    // A naive sliding window might find [400..408] (3K) and [404..414] (3K) and [408..422] (3K).
    // The aggregator must merge them into a single 5K / ACE!
    const kills = [400, 404, 408, 414, 422];
    const highlights = aggregateKillHighlights(kills, { windowSec: 30 });
    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, 'ACE');
    assert.strictEqual(highlights[0].startSec, 396);
    assert.strictEqual(highlights[0].endSec, 425);
    assert.strictEqual(highlights[0].gameMode, 'COMPETITIVE_OR_UNRATED');
});

test('aggregateKillHighlights filters out continuous Mata-Mata deathmatch streaks (> 6 kills in a round)', () => {
    // Em mata-mata os inimigos renascem a cada 3s e é comum ter 7 ou 8 abates seguidos
    const deathmatchStreak = [500, 503, 507, 511, 516, 521, 526, 532]; // 8 kills seguidas
    const highlights = aggregateKillHighlights(deathmatchStreak, { filterDeathmatch: true });
    assert.strictEqual(highlights.length, 0, 'Cluster de mata-mata com 8 kills deve ser descartado');

    const withoutFilter = aggregateKillHighlights(deathmatchStreak, { filterDeathmatch: false });
    assert.strictEqual(withoutFilter.length, 1, 'Sem filtro, cluster pode ser retornado');
});

