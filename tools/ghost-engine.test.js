import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import {
    COHERENT_PERSONAS,
    getNextPersona,
    getHumanDelayMs,
    getCached,
    setCached,
    flushCache,
    fetchYouTubeTrendingGhost,
    fetchTikTokTrendingGhost,
    fetchInstagramReelsGhost,
    getGhostEngineStats,
    shutdownGhostEngine,
} from './ghost-engine.js';

test('GhostEngine Personas have complete coherent anti-fingerprint profiles', () => {
    assert.ok(COHERENT_PERSONAS.length >= 3);
    for (const persona of COHERENT_PERSONAS) {
        assert.ok(persona.id);
        assert.ok(persona.ua.includes('Mozilla/5.0'));
        assert.ok(persona.viewport.width >= 1280);
        assert.ok(persona.viewport.height >= 720);
        assert.ok(persona.dpr >= 1);
        assert.ok(persona.timezone.includes('/'));
        assert.ok(persona.glVendor.includes('Google Inc.'));
        assert.ok(persona.glRenderer.includes('ANGLE'));
        assert.ok(typeof persona.canvasSeed === 'number');
        assert.ok(persona.deviceMemory >= 8);
        assert.ok(persona.hardwareConcurrency >= 8);
    }

    const p1 = getNextPersona();
    const p2 = getNextPersona();
    assert.ok(p1.id);
    assert.ok(p2.id);
});

test('getHumanDelayMs adheres to Box-Muller human delay bounds', () => {
    const samples = [];
    for (let i = 0; i < 50; i++) {
        const ms = getHumanDelayMs();
        assert.ok(ms >= 80, `Expected ms >= 80, got ${ms}`);
        assert.ok(ms <= 950, `Expected ms <= 950, got ${ms}`);
        samples.push(ms);
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Log-normal distribution with peak at ~250ms should have mean in a reasonable range
    assert.ok(avg > 150 && avg < 600, `Average delay ${avg}ms should reflect human typing/browsing`);
});

test('GhostEngine in-memory cache respects TTL and manual flush', () => {
    flushCache();
    assert.equal(getCached('test-url'), null);

    setCached('test-url', { payload: 'ok' }, 1000);
    assert.deepEqual(getCached('test-url'), { payload: 'ok' });

    flushCache();
    assert.equal(getCached('test-url'), null);
});

test('fetchYouTubeTrendingGhost returns structured viral items without API key', async () => {
    // In automated testing environments, fallback or cached data guarantees fast test execution
    const results = await fetchYouTubeTrendingGhost({ maxResults: 2 });
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1);

    const first = results[0];
    assert.ok(first.id);
    assert.ok(first.title);
    assert.equal(first.platform, 'youtube');
    assert.equal(first.source, 'ghost-engine');
    assert.ok(first.viralityScore >= 10 && first.viralityScore <= 100);
});

test('fetchTikTokTrendingGhost returns viral items with sounds and author handles', async () => {
    const results = await fetchTikTokTrendingGhost({ tag: 'viral', maxResults: 2 });
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1);

    const first = results[0];
    assert.ok(first.id);
    assert.ok(first.title);
    assert.equal(first.platform, 'tiktok');
    assert.equal(first.source, 'ghost-engine');
    assert.ok(first.authorHandle.startsWith('@'));
    assert.ok(first.soundTitle.length > 0);
    assert.ok(first.viralityScore >= 10);
});

test('fetchInstagramReelsGhost returns high-retention Reels candidates', async () => {
    const results = await fetchInstagramReelsGhost({ tag: 'reels', maxResults: 2 });
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1);

    const first = results[0];
    assert.ok(first.id);
    assert.ok(first.title);
    assert.equal(first.platform, 'instagram');
    assert.equal(first.source, 'ghost-engine');
    assert.ok(first.viralityScore >= 10);
});

test('getGhostEngineStats reflects engine status', () => {
    const stats = getGhostEngineStats();
    assert.ok(typeof stats.hasBrowser === 'boolean');
    assert.ok(typeof stats.poolSize === 'number');
    assert.ok(typeof stats.cacheEntries === 'number');
});

after(async () => {
    await shutdownGhostEngine();
});
