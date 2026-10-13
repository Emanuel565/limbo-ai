import test from 'node:test';
import assert from 'node:assert/strict';

import {
    selectBestClip,
    buildFfmpegCommand,
    buildSubtitle,
    buildAssSubtitle,
    formatAssTimestamp,
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

test('buildFfmpegCommand includes crop, NVENC, and optional loudnorm / headlines', () => {
    const baseCommand = buildFfmpegCommand({
        inputPath: 'video.mp4',
        outputPath: 'clip.mp4',
        start: 18,
        duration: 42,
    });

    assert.ok(baseCommand.includes('-ss'));
    assert.ok(baseCommand.includes('scale=1080:1920'));
    assert.ok(baseCommand.includes('-t'));
    assert.ok(baseCommand.includes('clip.mp4'));
    assert.ok(baseCommand.includes('h264_nvenc'));

    const fullEditCommand = buildFfmpegCommand({
        inputPath: 'video.mp4',
        outputPath: 'viral-full.mp4',
        start: 0,
        duration: 30,
        hookHeadline: 'O SEGREDO DA IA EM 2026',
        subtitlePath: 'subs.ass',
        normalizeAudio: true,
    });

    assert.ok(fullEditCommand.includes('drawbox=y=140'));
    assert.ok(fullEditCommand.includes('drawtext=text='));
    assert.ok(fullEditCommand.includes("subtitles='subs.ass'"));
    assert.ok(fullEditCommand.includes('loudnorm=I=-14'));
});

test('buildSubtitle converts transcript to SRT format', () => {
    const subtitle = buildSubtitle([
        { start: 0, end: 2, text: 'Olá' },
        { start: 2, end: 5, text: 'Tudo bem?' },
    ]);

    assert.match(subtitle, /1\s*\n00:00:00,000/);
    assert.match(subtitle, /Tudo bem\?/);
});

test('buildAssSubtitle generates styled ASS with Deep Pink keyword highlights', () => {
    const ass = buildAssSubtitle([
        { start: 0, end: 2.5, text: 'Você precisa ver isso AGORA!' },
        { start: 2.5, end: 6.0, text: 'Essa revelação surpreendente muda tudo.' },
    ], { maxSeconds: 60, hookTitle: 'GANCHO VIRAL' });

    assert.ok(ass.includes('[Script Info]'));
    assert.ok(ass.includes('PlayResX: 1080'));
    assert.ok(ass.includes('PlayResY: 1920'));
    assert.ok(ass.includes('Style: ViralHormozi'));
    assert.ok(ass.includes('Dialogue: 0,0:00:00.00,0:00:02.50'));
    // Contém a cor BGR do Deep Pink #FF1493 (&H009314FF) destacando a palavra com exclamação
    assert.ok(ass.includes('&H009314FF&'));
});

test('formatAssTimestamp formats accurately for ASS centiseconds', () => {
    assert.equal(formatAssTimestamp(0), '0:00:00.00');
    assert.equal(formatAssTimestamp(65.25), '0:01:05.25');
    assert.equal(formatAssTimestamp(3661.5), '1:01:01.50');
});
