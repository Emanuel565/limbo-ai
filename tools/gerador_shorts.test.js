import test from 'node:test';
import assert from 'node:assert/strict';
import { processValorantVodShorts } from './gerador_shorts.js';

test('processValorantVodShorts validates input source and options', async () => {
    await assert.rejects(
        () => processValorantVodShorts(''),
        /Fonte de vídeo ou URL é obrigatória/
    );
});

test('processValorantVodShorts dryRun executes full orchestration pipeline without crashing', async () => {
    const result = await processValorantVodShorts('https://youtube.com/watch?v=mock_vod', {
        dryRun: true,
        cuts: [
            {
                id: 'val_cut_1_4k_100s',
                clipType: '4K',
                startSec: 96,
                endSec: 122,
                duration: 26,
                killTimes: [100, 105, 112, 119],
            }
        ],
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.cutsProcessed, 1);
    assert.ok(result.outputFiles.length === 1);
});
