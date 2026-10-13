import test from 'node:test';
import assert from 'node:assert/strict';

import {
    selectBestClip,
    buildFfmpegCommand,
    buildSubtitle,
} from './viral-short-pipeline.js';

test('selectBestClip chooses the strongest segment under 60 seconds', () => {
    const segments = [
        { start: 0, end: 8, text: 'Bem-vindo ao vídeo' },
        { start: 15, end: 32, text: 'Aqui está a estratégia secreta que vai mudar tudo e você precisa ver isso agora!' },
        { start: 35, end: 47, text: 'Depois eu explico como isso funciona' },
        { start: 50, end: 110, text: 'Essa informação é muito boa para você entender a diferença entre os dois métodos' },
    ];

    const result = selectBestClip(segments, 60);

    assert.ok(result.start >= 0);
    assert.ok(result.end - result.start <= 60);
    assert.ok(result.reason.includes('segredo') || result.reason.includes('agora'));
    assert.ok(result.title.length > 0);
});

test('buildFfmpegCommand includes crop and max duration rule', () => {
    const command = buildFfmpegCommand({
        inputPath: 'video.mp4',
        outputPath: 'clip.mp4',
        start: 18,
        duration: 42,
    });

    assert.ok(command.includes('-ss'));
    assert.ok(command.includes('scale=1080:1920'));
    assert.ok(command.includes('-t'));
    assert.ok(command.includes('clip.mp4'));
});

test('buildSubtitle converts transcript to SRT format', () => {
    const subtitle = buildSubtitle([
        { start: 0, end: 2, text: 'Olá' },
        { start: 2, end: 5, text: 'Tudo bem?' },
    ]);

    assert.match(subtitle, /1\s*\n00:00:00,000/);
    assert.match(subtitle, /Tudo bem\?/);
});
