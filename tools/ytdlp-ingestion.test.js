import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYtdlpSectionArgs, buildYtdlpStreamUrlArgs } from './ytdlp-ingestion.js';

test('buildYtdlpSectionArgs formats precise --download-sections and time ranges', () => {
    const args = buildYtdlpSectionArgs('https://youtube.com/watch?v=sample', 120, 155, 'temp/clip.mp4');
    assert.ok(args.includes('--download-sections'));
    assert.ok(args.includes('*120-155'));
    assert.ok(args.includes('-o'));
    assert.ok(args.includes('temp/clip.mp4'));
    assert.ok(args.includes('https://youtube.com/watch?v=sample'));
});

test('buildYtdlpStreamUrlArgs requests 720p stream url extraction for fast analysis', () => {
    const args = buildYtdlpStreamUrlArgs('https://twitch.tv/videos/123456');
    assert.ok(args.includes('-g'));
    assert.ok(args.includes('-f'));
    assert.ok(args.some((arg) => arg.includes('720')));
    assert.ok(args.includes('https://twitch.tv/videos/123456'));
});
