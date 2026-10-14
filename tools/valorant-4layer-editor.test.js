import test from 'node:test';
import assert from 'node:assert/strict';
import { build4LayerFilterComplex, build4LayerFfmpegArgs } from './valorant-4layer-editor.js';

test('build4LayerFilterComplex builds 4 distinct layers: fast-downscaled bg blur, center crosshair, minimap, killfeed', () => {
    const segments = [{ start: 0, end: 15, speed: 1, duration: 15 }];
    const { filterComplex, outputMaps } = build4LayerFilterComplex(segments, {
        width: 1080,
        height: 1920,
    });

    // Rule 1: High performance downscaled blur pipeline
    assert.ok(filterComplex.includes('scale=360:640'), 'Must downscale bg to 360:640 for CPU performance');
    assert.ok(filterComplex.includes('boxblur=15:2') || filterComplex.includes('boxblur='), 'Must include boxblur');
    assert.ok(filterComplex.includes('scale=1080:1920'), 'Must scale bg back to canvas');
    assert.ok(filterComplex.includes('[bg]'), 'Must produce background stream');
    assert.ok(filterComplex.includes('[mira]'), 'Must produce center crosshair stream');
    assert.ok(filterComplex.includes('[mapa]'), 'Must produce minimap overlay stream');
    assert.ok(filterComplex.includes('[killfeed]'), 'Must produce killfeed overlay stream');
    assert.ok(filterComplex.includes('overlay='), 'Must chain overlays');
    assert.ok(outputMaps.includes('[vout]'), 'Must export [vout]');
});

test('build4LayerFilterComplex applies speedup to game audio and keeps BGM ducking untouched after concat', () => {
    const segments = [
        { start: 10, end: 15, speed: 1, duration: 5 },
        { start: 15, end: 27, speed: 3, duration: 12, isFastForward: true },
        { start: 27, end: 32, speed: 1, duration: 5 },
    ];
    const { filterComplex } = build4LayerFilterComplex(segments, {
        hasBgm: true,
        isSourceMuted: false,
    });

    // Rule 2: atrim and atempo applied to game audio [0:a]
    assert.ok(filterComplex.includes('atempo='), 'Must apply atempo to fast-forward segment');
    assert.ok(filterComplex.includes('concat=n=3:v=1:a=1'), 'Must concat video and audio segments');
    // BGM amix happens AFTER concat on concatenated game audio
    assert.ok(filterComplex.includes('amix='), 'Must mix BGM after concat');
});

test('build4LayerFfmpegArgs generates NVENC hardware encoding arguments for RTX 3060 Ti', () => {
    const args = build4LayerFfmpegArgs({
        inputPath: 'raw_gameplays/vod.mp4',
        outputPath: 'cortes_prontos/cut_1.mp4',
        segments: [{ start: 10, end: 35, speed: 1, duration: 25 }],
        useNvenc: true,
    });

    assert.ok(args.includes('h264_nvenc'), 'Must use NVENC encoder');
    assert.ok(args.includes('-filter_complex'), 'Must include filter_complex');
    assert.ok(args.includes('-b:v'));
    assert.ok(args.includes('8M'));
    assert.ok(args.includes('cortes_prontos/cut_1.mp4'));
});

test('build4LayerFfmpegArgs handles muted source by injecting BGM track directly', () => {
    const args = build4LayerFfmpegArgs({
        inputPath: 'raw_gameplays/vod.mp4',
        outputPath: 'cortes_prontos/cut_1.mp4',
        segments: [{ start: 10, end: 35, speed: 1, duration: 25 }],
        useNvenc: true,
        forceMuted: true,
        bgmPath: 'public/audio/bgm/clutch-bass.mp3',
    });

    assert.ok(args.includes('-stream_loop'), 'Must loop BGM when source is muted');
    assert.ok(args.includes('public/audio/bgm/clutch-bass.mp3'));
});
