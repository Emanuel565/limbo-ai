import test from 'node:test';
import assert from 'node:assert/strict';

import {
    selectBestClip,
    createClip,
    buildFfmpegArgs,
    buildFfmpegCommand,
    buildSubtitle,
    buildAssSubtitle,
    formatAssTimestamp,
    toTimedWords,
    VIRAL_EMOJI_MAP,
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

test('buildFfmpegArgs includes crop, NVENC, faststart and progress bar', () => {
    const args = buildFfmpegArgs({ inputPath: 'video.mp4', outputPath: 'clip.mp4', start: 18, duration: 42 });
    const joined = args.join(' ');

    assert.ok(args.includes('-ss'));
    assert.ok(joined.includes('scale=1080:1920'));
    assert.ok(args.includes('h264_nvenc'));
    assert.ok(args.includes('+faststart'));
    assert.ok(joined.includes('0xFF1493'));
    assert.equal(args.at(-1), 'clip.mp4');
});

test('buildFfmpegArgs keeps headlines and paths with spaces as single args (regression)', () => {
    const args = buildFfmpegArgs({
        inputPath: 'meu video.mp4',
        outputPath: 'saida final.mp4',
        start: 0,
        duration: 30,
        hookHeadline: 'O SEGREDO DA IA EM 2026',
        normalizeAudio: true,
    });

    assert.ok(args.includes('meu video.mp4'));
    assert.equal(args.at(-1), 'saida final.mp4');
    const vf = args[args.indexOf('-vf') + 1];
    assert.ok(vf.includes("drawtext=text='O SEGREDO DA IA EM 2026'"));
    assert.ok(args.join(' ').includes('loudnorm=I=-14'));
});

test('buildFfmpegArgs burns the .ass and skips drawtext when subtitles exist', () => {
    const args = buildFfmpegArgs({
        inputPath: 'v.mp4', outputPath: 'o.mp4', start: 0, duration: 10,
        hookHeadline: 'GANCHO', subtitlePath: 'subs.ass',
    });
    const vf = args[args.indexOf('-vf') + 1];
    assert.ok(vf.includes("ass='subs.ass'"));
    assert.ok(!vf.includes('drawtext'));
    assert.ok(buildFfmpegCommand({ inputPath: 'v.mp4', outputPath: 'o.mp4', start: 0, duration: 10 }).startsWith('ffmpeg '));
});

test('buildSubtitle converts transcript to SRT format', () => {
    const subtitle = buildSubtitle([
        { start: 0, end: 2, text: 'Olá' },
        { start: 2, end: 5, text: 'Tudo bem?' },
    ]);

    assert.match(subtitle, /1\s*\n00:00:00,000/);
    assert.match(subtitle, /Tudo bem\?/);
});

test('subtitles are shifted to the clip timeline (regression)', () => {
    const segments = [
        { start: 0, end: 5, text: 'Fora do corte' },
        { start: 20, end: 24, text: 'Dentro do corte agora' },
    ];
    const srt = buildSubtitle(segments, 30, 20);
    assert.ok(!srt.includes('Fora do corte'));
    assert.match(srt, /00:00:00,000 --> 00:00:04,000/);

    const ass = buildAssSubtitle(segments, { maxSeconds: 30, clipStart: 20 });
    assert.ok(!ass.includes('FORA'));
    assert.ok(ass.includes('Dialogue: 0,0:00:00.00'));
});

test('buildAssSubtitle generates TikTok-style pop chunks with Deep Pink emphasis and hook banner', () => {
    const ass = buildAssSubtitle([
        { start: 0, end: 2.5, text: 'Você precisa ver isso AGORA!' },
        { start: 2.5, end: 6.0, text: 'Essa revelação surpreendente muda tudo.' },
    ], { maxSeconds: 60, hookTitle: 'GANCHO VIRAL', hookHeadline: 'Gancho viral' });

    assert.ok(ass.includes('PlayResX: 1080'));
    assert.ok(ass.includes('PlayResY: 1920'));
    assert.ok(ass.includes('Style: ViralHormozi'));
    assert.ok(ass.includes('HookBanner,,0,0,0,,{\\fad(150,0)}GANCHO VIRAL'));
    assert.ok(ass.includes('\\t(0,90,\\fscx108\\fscy108)'));
    assert.ok(ass.includes('&H009314FF&}⏱️ AGORA!'));
    // 5 palavras em blocos de 3 → 2 eventos no primeiro segmento
    const firstSegmentEvents = ass.split('\n').filter((l) => l.startsWith('Dialogue: 0,0:00:0') && /0:00:0[0-2]\./.test(l.split(',')[2]));
    assert.ok(firstSegmentEvents.length >= 2);
});

test('toTimedWords prefers real Whisper word timestamps', () => {
    const words = toTimedWords({ start: 0, end: 2, duration: 2, text: 'oi mundo', words: [
        { word: 'oi', start: 0.1, end: 0.4 }, { word: 'mundo', start: 0.5, end: 1.2 },
    ] });
    assert.deepEqual(words.map((w) => w.start), [0.1, 0.5]);
});

test('formatAssTimestamp formats accurately for ASS centiseconds', () => {
    assert.equal(formatAssTimestamp(0), '0:00:00.00');
    assert.equal(formatAssTimestamp(65.25), '0:01:05.25');
    assert.equal(formatAssTimestamp(3661.5), '1:01:01.50');
});

test('buildAssSubtitle injects viral emojis when autoEmojis is enabled', () => {
    const segments = [
        { start: 0, end: 4, text: 'O segredo para ganhar dinheiro agora muda tudo' },
    ];
    const ass = buildAssSubtitle(segments, { maxSeconds: 10, autoEmojis: true });
    assert.ok(ass.includes(VIRAL_EMOJI_MAP.segredo));
    assert.ok(ass.includes(VIRAL_EMOJI_MAP.dinheiro));
    assert.ok(ass.includes(VIRAL_EMOJI_MAP.agora));
    assert.ok(ass.includes(VIRAL_EMOJI_MAP.muda));

    const assWithoutEmojis = buildAssSubtitle(segments, { maxSeconds: 10, autoEmojis: false });
    assert.ok(!assWithoutEmojis.includes(VIRAL_EMOJI_MAP.segredo));
    assert.ok(!assWithoutEmojis.includes(VIRAL_EMOJI_MAP.dinheiro));
});

test('createClip passes dynamicZoom, progressBar, autoEmojis and hookHeadline down to plan', () => {
    const segments = [
        { start: 0, end: 15, text: 'Aqui está a maior revelação sobre inteligência artificial agora.' },
    ];

    const planZoom = createClip({
        inputPath: 'in.mp4',
        outputPath: 'out.mp4',
        transcriptSegments: segments,
        dynamicZoom: true,
        progressBar: true,
        autoEmojis: true,
        hookHeadline: 'SUPER GANCHO',
    });

    assert.ok(planZoom.ffmpegArgs.join(' ').includes('mod(t,9)'));
    assert.ok(planZoom.ffmpegArgs.join(' ').includes('0xFF1493'));
    assert.ok(planZoom.assSubtitle.includes('SUPER GANCHO'));
    assert.ok(planZoom.assSubtitle.includes(VIRAL_EMOJI_MAP.agora));

    const planStatic = createClip({
        inputPath: 'in.mp4',
        outputPath: 'out.mp4',
        transcriptSegments: segments,
        dynamicZoom: false,
        progressBar: false,
    });

    assert.ok(!planStatic.ffmpegArgs.join(' ').includes('mod(t,9)'));
    assert.ok(!planStatic.ffmpegArgs.join(' ').includes('0xFF1493'));
});
