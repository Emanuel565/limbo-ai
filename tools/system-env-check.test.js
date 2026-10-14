import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVideoToolingEnvironment } from './system-env-check.js';

test('checkVideoToolingEnvironment reports availability of system video binaries', async () => {
    const env = await checkVideoToolingEnvironment();
    assert.strictEqual(typeof env.ffmpeg, 'boolean');
    assert.strictEqual(typeof env.nvenc, 'boolean');
    assert.strictEqual(typeof env.ytdlp, 'boolean');
    assert.strictEqual(typeof env.python, 'boolean');
    assert.strictEqual(env.ffmpeg, true, 'FFmpeg binary must be resolved and functional');
});
