import test from 'node:test';
import assert from 'node:assert/strict';
import {
    parseIsoDuration,
    formatDuration,
    calculateViralityScore,
    selectViralVideoWithOllama,
} from './trend-hunter.js';

test('parseIsoDuration parses ISO 8601 strings accurately', () => {
    assert.equal(parseIsoDuration('PT15M33S'), 933);
    assert.equal(parseIsoDuration('PT1H2M10S'), 3730);
    assert.equal(parseIsoDuration('PT45S'), 45);
    assert.equal(parseIsoDuration('PT2H'), 7200);
    assert.equal(parseIsoDuration(''), 0);
});

test('formatDuration formats seconds to mm:ss', () => {
    assert.equal(formatDuration(933), '15:33');
    assert.equal(formatDuration(45), '0:45');
    assert.equal(formatDuration(3605), '60:05');
});

test('calculateViralityScore rewards strong engagement rates', () => {
    const highEngagement = calculateViralityScore({ views: 10000, likes: 1200, comments: 200 });
    const lowEngagement = calculateViralityScore({ views: 10000, likes: 50, comments: 5 });

    assert.ok(highEngagement > lowEngagement);
    assert.ok(highEngagement >= 10 && highEngagement <= 99.9);
});

test('selectViralVideoWithOllama provides fallback when Ollama is unreachable', async () => {
    const mockCandidates = [
        {
            id: 'video123',
            title: 'Segredo de IA para 2026',
            channelTitle: 'Tech Insights',
            views: 50000,
            likes: 4500,
            comments: 320,
            engagementRate: 10.2,
            viralityScore: 88.5,
            durationFormatted: '12:40',
            url: 'https://www.youtube.com/watch?v=video123',
            thumbnail: 'https://img.youtube.com/vi/video123/hqdefault.jpg',
        },
    ];

    const result = await selectViralVideoWithOllama(mockCandidates, {
        niche: 'inteligência artificial',
        model: 'non-existent-model',
        ollamaUrl: 'http://localhost:99999', // porta inválida para disparar o fallback
    });

    assert.equal(result.videoId, 'video123');
    assert.ok(result.hookAnalysis.length > 0);
    assert.ok(result.whyViral.length > 0);
    assert.equal(result.modelUsed, 'heuristic-fallback');
});
