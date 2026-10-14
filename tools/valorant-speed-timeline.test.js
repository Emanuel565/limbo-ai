import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpeedSegments } from './valorant-speed-timeline.js';

test('calculateSpeedSegments accelerates intervals > 8s between kills to 3x', () => {
    // Highlight from 96s to 119s
    // Kill 1 at 100s, Kill 2 at 116s (interval = 16s > 8s)
    const highlight = {
        startSec: 96,
        endSec: 119,
        killTimes: [100, 116],
    };

    const segments = calculateSpeedSegments(highlight, {
        minDeadTimeSec: 8,
        postKillNormalSec: 1.5,
        preKillNormalSec: 2.5,
        fastForwardSpeed: 3,
    });

    // Segment 1: 96s -> 101.5s (1x)
    // Segment 2: 101.5s -> 113.5s (3x fast-forward)
    // Segment 3: 113.5s -> 119s (1x)
    assert.strictEqual(segments.length, 3);
    assert.strictEqual(segments[0].speed, 1);
    assert.strictEqual(segments[0].start, 96);
    assert.strictEqual(segments[0].end, 101.5);

    assert.strictEqual(segments[1].speed, 3);
    assert.strictEqual(segments[1].isFastForward, true);
    assert.strictEqual(segments[1].start, 101.5);
    assert.strictEqual(segments[1].end, 113.5);

    assert.strictEqual(segments[2].speed, 1);
    assert.strictEqual(segments[2].start, 113.5);
    assert.strictEqual(segments[2].end, 119);
});

test('calculateSpeedSegments keeps entire clip at 1x if all kill intervals are <= 8s', () => {
    const highlight = {
        startSec: 96,
        endSec: 112,
        killTimes: [100, 104, 109],
    };
    const segments = calculateSpeedSegments(highlight, { minDeadTimeSec: 8 });
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].speed, 1);
    assert.strictEqual(segments[0].isFastForward, false);
    assert.strictEqual(segments[0].start, 96);
    assert.strictEqual(segments[0].end, 112);
});

test('calculateSpeedSegments handles multiple fast-forward intervals in 4K/ACE rounds', () => {
    // 3 kills: 100s, 115s (gap 15s > 8), 130s (gap 15s > 8)
    const highlight = {
        startSec: 96,
        endSec: 133,
        killTimes: [100, 115, 130],
    };
    const segments = calculateSpeedSegments(highlight);
    // Should produce 5 segments:
    // 1x [96..101.5]
    // 3x [101.5..112.5]
    // 1x [112.5..116.5]
    // 3x [116.5..127.5]
    // 1x [127.5..133]
    assert.strictEqual(segments.length, 5);
    const ffSegments = segments.filter((s) => s.isFastForward);
    assert.strictEqual(ffSegments.length, 2);
    assert.ok(ffSegments.every((s) => s.speed === 3));
});
