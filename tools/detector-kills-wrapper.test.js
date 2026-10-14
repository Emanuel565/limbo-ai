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
});

test('runKillHunterAnalysis returns empty array or falls back when video has no kills', async () => {
    // When called on non-existent or empty dummy input, handles error gracefully
    const result = await runKillHunterAnalysis('non_existent_vod.mp4', { dryRun: true });
    assert.ok(Array.isArray(result));
});
