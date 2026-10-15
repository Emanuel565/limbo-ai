import test from 'node:test';
import assert from 'node:assert/strict';
import { runKillHunterAnalysis, parseDetectorOutput } from './detector-kills-wrapper.js';

test('parseDetectorOutput converts python json output to typed highlight objects', () => {
    const rawJson = JSON.stringify([
        {
            inicio_seg: 120.5,
            fim_seg: 148.0,
            duracao: 27.5,
            tipo: '4K',
            tempos_kills_seg: [124.5, 128.0, 134.2, 145.0],
        }
    ]);

    const cuts = parseDetectorOutput(rawJson);
    assert.strictEqual(cuts.length, 1);
    assert.strictEqual(cuts[0].clipType, '4K');
    assert.strictEqual(cuts[0].startSec, 120.5);
    assert.strictEqual(cuts[0].endSec, 148.0);
    assert.strictEqual(cuts[0].killTimes.length, 4);
    assert.strictEqual(cuts[0].gameMode, 'COMPETITIVE_OR_UNRATED');
});

test('parseDetectorOutput filters out Mata-Mata (Deathmatch) cuts', () => {
    const rawJsonWithDeathmatch = JSON.stringify([
        {
            inicio_seg: 100.0,
            fim_seg: 125.0,
            duracao: 25.0,
            tipo: '3K',
            tempos_kills_seg: [105.0, 110.0, 115.0],
            modo: 'COMPETITIVO_OU_SEM_CLASS',
            game_mode: 'COMPETITIVE_OR_UNRATED',
        },
        {
            inicio_seg: 200.0,
            fim_seg: 235.0,
            duracao: 35.0,
            tipo: '4K',
            tempos_kills_seg: [205.0, 210.0, 215.0, 220.0],
            modo: 'MATA_MATA',
            game_mode: 'MATA_MATA',
        },
        {
            inicio_seg: 300.0,
            fim_seg: 340.0,
            duracao: 40.0,
            tipo: 'ACE',
            tempos_kills_seg: [305, 308, 312, 316, 320, 325, 330, 335], // 8 kills (mata-mata respawns)
        }
    ]);

    const filtered = parseDetectorOutput(rawJsonWithDeathmatch, { filterDeathmatch: true });
    assert.strictEqual(filtered.length, 1, 'Only the 5v5 competitive/unrated cut must be kept');
    assert.strictEqual(filtered[0].startSec, 100.0);
    assert.strictEqual(filtered[0].gameMode, 'COMPETITIVE_OR_UNRATED');

    const unfiltered = parseDetectorOutput(rawJsonWithDeathmatch, { filterDeathmatch: false });
    assert.strictEqual(unfiltered.length, 3, 'All cuts must be present when filter is false');
});

test('runKillHunterAnalysis returns empty array or falls back when video has no kills', async () => {
    // When called on non-existent or empty dummy input, handles error gracefully
    const result = await runKillHunterAnalysis('non_existent_vod.mp4', { dryRun: true });
    assert.ok(Array.isArray(result));
});

