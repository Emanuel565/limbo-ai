import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalyzeRequest, validateRenderRequest } from './validators.js';

test('validateAnalyzeRequest rejects empty payloads and accepts valid URL or local file', () => {
    assert.strictEqual(validateAnalyzeRequest({}).valid, false);
    assert.strictEqual(validateAnalyzeRequest({ sourceUrl: 'https://youtube.com/watch?v=123' }).valid, true);
    assert.strictEqual(validateAnalyzeRequest({ localFile: 'raw_gameplays/vod.mp4' }).valid, true);
});

test('validateRenderRequest requires source and an array of selected cuts', () => {
    assert.strictEqual(validateRenderRequest({}).valid, false);
    assert.strictEqual(validateRenderRequest({ sourceUrl: 'https://youtube.com' }).valid, false);
    assert.strictEqual(validateRenderRequest({
        sourceUrl: 'https://youtube.com',
        selectedCuts: [{ id: 'cut_1', startSec: 10, endSec: 35 }]
    }).valid, true);
});
