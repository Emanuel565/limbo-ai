import test from 'node:test';
import assert from 'node:assert/strict';

import {
    formatSocialCaptions,
    createInstagramReelContainer,
    publishTikTokVideo,
    analyzeSocialAccount,
    executeMultiPlatformPublish,
} from './social-publisher.js';
import { shutdownGhostEngine } from './ghost-engine.js';

test('formatSocialCaptions formats captions with viral hashtags for both platforms', () => {
    const result = formatSocialCaptions({
        title: 'Como Viralizar no TikTok em 2026',
        description: 'Dicas práticas de edição com inteligência artificial.',
        tiktokHandle: '@emanuel.cortes',
        instagramHandle: '@emanuel.reels',
    });

    assert.equal(result.tiktok.handle, '@emanuel.cortes');
    assert.ok(result.tiktok.caption.includes('#fyp'));
    assert.ok(result.tiktok.caption.includes('#tiktokbrasil'));
    assert.ok(result.tiktok.caption.includes('Como Viralizar no TikTok em 2026'));

    assert.equal(result.instagram.handle, '@emanuel.reels');
    assert.ok(result.instagram.caption.includes('#reels'));
    assert.ok(result.instagram.caption.includes('#explore'));
});

test('createInstagramReelContainer validates required parameters', async () => {
    await assert.rejects(
        () => createInstagramReelContainer({ accessToken: '', igUserId: '', videoUrl: '' }),
        /requer INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID/
    );

    await assert.rejects(
        () => createInstagramReelContainer({ accessToken: 'token', igUserId: '12345', videoUrl: '' }),
        /É necessário fornecer uma videoUrl pública/
    );
});

test('publishTikTokVideo validates required parameters', async () => {
    await assert.rejects(
        () => publishTikTokVideo({ accessToken: '', videoUrl: 'https://cdn.example.com/video.mp4' }),
        /TikTok Content Posting API requer TIKTOK_ACCESS_TOKEN/
    );

    await assert.rejects(
        () => publishTikTokVideo({ accessToken: 'token_123', videoUrl: '' }),
        /É necessário fornecer uma videoUrl pública/
    );
});

test('analyzeSocialAccount returns predictive engagement analytics and optimal times', async () => {
    const tiktokAnalysis = await analyzeSocialAccount({
        platform: 'tiktok',
        handle: '@emanuel.viral',
    });

    assert.equal(tiktokAnalysis.platform, 'tiktok');
    assert.equal(tiktokAnalysis.handle, '@emanuel.viral');
    assert.ok(tiktokAnalysis.viralityScore > 80);
    assert.ok(Array.isArray(tiktokAnalysis.bestPostingTimes));
    assert.ok(tiktokAnalysis.bestPostingTimes.length >= 2);
    assert.ok(tiktokAnalysis.recommendedHooks.length >= 2);

    const igAnalysis = await analyzeSocialAccount({
        platform: 'instagram',
        handle: 'emanuel.reels',
    });

    assert.equal(igAnalysis.platform, 'instagram');
    assert.equal(igAnalysis.handle, '@emanuel.reels');
    assert.ok(igAnalysis.bestDays.length >= 2);
    assert.ok(igAnalysis.audienceInsight.topFormat.includes('9:16'));

    const ytAnalysis = await analyzeSocialAccount({
        platform: 'youtube',
        handle: '@emanuel.shorts',
    });

    assert.equal(ytAnalysis.platform, 'youtube');
    assert.equal(ytAnalysis.handle, '@emanuel.shorts');
    assert.ok(ytAnalysis.viralityScore >= 90);
    assert.ok(ytAnalysis.bestPostingTimes.includes('18:15'));
    assert.ok(ytAnalysis.audienceInsight.estimatedRpm.includes('0,30'));
});

test('executeMultiPlatformPublish produces dry-run validated payload without crashing', async () => {
    const execution = await executeMultiPlatformPublish({
        platforms: ['tiktok', 'instagram', 'youtube'],
        videoUrl: '/generated/corte-123.mp4',
        title: 'O Segredo que Ninguém Te Conta',
        description: 'Tudo o que você precisa saber para reter a atenção.',
        tiktokHandle: '@meutiktok',
        instagramHandle: '@meuinstagram',
        youtubeHandle: '@limboinpink',
        dryRun: true,
    });

    assert.ok(execution.ok);
    assert.ok(execution.results.tiktok);
    assert.equal(execution.results.tiktok.mode, 'DRY_RUN_VALIDADO');
    assert.ok(execution.results.tiktok.caption.includes('O Segredo que Ninguém Te Conta'));

    assert.ok(execution.results.instagram);
    assert.equal(execution.results.instagram.mode, 'DRY_RUN_VALIDADO');
    assert.ok(execution.results.instagram.caption.includes('#reels'));

    assert.ok(execution.results.youtube);
    assert.equal(execution.results.youtube.mode, 'GHOST_ENGINE_STUDIO');
    assert.ok(execution.results.youtube.caption.includes('#shorts'));

    await shutdownGhostEngine();
});
