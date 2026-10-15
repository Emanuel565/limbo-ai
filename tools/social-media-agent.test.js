import test from 'node:test';
import assert from 'node:assert/strict';
import {
    generateViralHookTitle,
    generateSocialMediaCaption,
    evaluateViralScore,
    getGamerPrimeTimeSlots,
    REVENGE_TITLES,
} from './social-media-agent.js';

test('generateViralHookTitle generates high-CTR titles mentioning Revenge', () => {
    const title4k = generateViralHookTitle({ playerNick: 'Revenge', clipType: '4K', index: 0 });
    assert.ok(title4k.includes('REVENGE'), 'Must include player nick');
    assert.ok(title4k.includes('4K'), 'Must mention 4K');

    const titleAce = generateViralHookTitle({ playerNick: 'Revenge', clipType: 'ACE', index: 0 });
    assert.ok(titleAce.includes('REVENGE'), 'Must include player nick');
    assert.ok(titleAce.includes('ACE'), 'Must mention ACE');

    const titleCustomNick = generateViralHookTitle({ playerNick: 'Aspas', clipType: '4K', index: 0 });
    assert.ok(titleCustomNick.includes('ASPAS'), 'Must replace with custom player nick');
});

test('generateSocialMediaCaption formats captions with hook, context, CTA and hashtags', () => {
    const caption = generateSocialMediaCaption({
        playerNick: 'Revenge',
        clipType: '3K',
        title: 'ESSE 4K DO REVENGE CALOU O ROUND 🔥',
    });

    assert.ok(caption.includes('ESSE 4K DO REVENGE CALOU O ROUND 🔥'), 'Must include hook');
    assert.ok(caption.includes('#valorantbrasil'), 'Must include #valorantbrasil');
    assert.ok(caption.includes('#revenge'), 'Must include #revenge');
});

test('evaluateViralScore rewards ACEs and 4Ks with scores >= 90', () => {
    const scoreAce = evaluateViralScore({ clipType: 'ACE', duration: 15, hasFastForward: true });
    assert.ok(scoreAce >= 95, 'ACE with 15s and fast-forward must have score >= 95');

    const score3k = evaluateViralScore({ clipType: '3K', duration: 35, hasFastForward: false });
    assert.ok(score3k >= 90, '3K must have score >= 90');
});

test('getGamerPrimeTimeSlots provides peak Brazilian gamer hours', () => {
    const slots = getGamerPrimeTimeSlots();
    assert.equal(slots.length, 4, 'Must provide 4 gamer prime time slots');
    assert.ok(slots.some((s) => s.time === '18:30'));
    assert.ok(slots.some((s) => s.time === '21:15'));
});

test('generateViralHookTitle procedural: adapts to fast multikills (< 4s)', () => {
    const fastCutTitle = generateViralHookTitle({
        playerNick: 'Revenge',
        clipType: '3K',
        killsCount: 3,
        killTimes: [10.2, 11.5, 12.8], // 2.6s total!
        duration: 14,
        index: 0,
    });

    assert.ok(fastCutTitle.includes('REVENGE'), 'Must mention player nick');
    assert.ok(
        fastCutTitle.includes('SPRAY') || fastCutTitle.includes('SEGUNDOS') || fastCutTitle.includes('s') || fastCutTitle.includes('PISCAR'),
        `Fast kill title must mention speed or spray transfer: ${fastCutTitle}`
    );
});

test('generateViralHookTitle procedural: adapts to clutches', () => {
    const clutchTitle = generateViralHookTitle({
        playerNick: 'Revenge',
        clipType: 'CLUTCH',
        killsCount: 3,
        duration: 25,
        isClutch: true,
        index: 0,
    });

    assert.ok(clutchTitle.includes('REVENGE'), 'Must mention player nick');
    assert.ok(
        clutchTitle.includes('CLUTCH') || clutchTitle.includes('1V') || clutchTitle.includes('GELO'),
        `Clutch title must mention clutch context: ${clutchTitle}`
    );
});

test('generateSocialMediaCaption procedural: adapts narrative to fast multikills and ACE', () => {
    const fastCaption = generateSocialMediaCaption({
        playerNick: 'Revenge',
        clipType: '3K',
        killsCount: 3,
        killTimes: [5.0, 6.2, 7.8],
    });
    assert.ok(fastCaption.includes('segundos'), 'Fast multikill caption must mention kill seconds');

    const aceCaption = generateSocialMediaCaption({
        playerNick: 'Revenge',
        clipType: 'ACE',
        killsCount: 5,
    });
    assert.ok(aceCaption.includes('ACE histórico') || aceCaption.includes('5 adversários'), 'ACE caption must mention ACE');
});

test('getTrendingValorantHashtags returns curated list with velocity and views', async () => {
    const { getTrendingValorantHashtags } = await import('./social-media-agent.js');
    const allTags = getTrendingValorantHashtags();
    assert.ok(allTags.length >= 15, 'Must provide at least 15 trending tags');
    assert.ok(allTags.some(t => t.tag === '#valorant' && t.views));
    assert.ok(allTags.some(t => t.tag === '#valorantbrasil' && t.tier === 2));

    const tier1 = getTrendingValorantHashtags({ tier: 1 });
    assert.ok(tier1.every(t => t.tier === 1), 'All filtered tags must be tier 1');
});

test('buildOptimalHashtags creates high-reach clusters with player tag and clip context', async () => {
    const { buildOptimalHashtags } = await import('./social-media-agent.js');
    
    // ACE on TikTok
    const tiktokAce = buildOptimalHashtags({ clipType: 'ACE', platform: 'tiktok', playerNick: 'Revenge' });
    assert.ok(tiktokAce.includes('#valorantbrasil'), 'Must include Brazilian valorant community');
    assert.ok(tiktokAce.includes('#revenge'), 'Must include player nick');
    assert.ok(tiktokAce.includes('#valorantace'), 'Must include play type tag');
    assert.ok(tiktokAce.includes('#fyp') || tiktokAce.includes('#foryou'), 'Must include TikTok discovery tag');
    assert.ok(tiktokAce.length >= 5 && tiktokAce.length <= 8, 'Must maintain optimal tag count for algorithmic retention');

    // Clutch on Instagram
    const instaClutch = buildOptimalHashtags({ clipType: 'CLUTCH', platform: 'instagram', playerNick: 'Aspas' });
    assert.ok(instaClutch.includes('#aspas'), 'Must include custom player tag');
    assert.ok(instaClutch.includes('#reelsvalorant') || instaClutch.includes('#reels'), 'Must include Instagram reels tag');
    assert.ok(instaClutch.includes('#valorantclutch'), 'Must include clutch tag');

    // YouTube Shorts 4K
    const yt4k = buildOptimalHashtags({ clipType: '4K', platform: 'youtube', playerNick: 'Revenge' });
    assert.ok(yt4k.includes('#shorts') || yt4k.includes('#valorantshorts'), 'Must include YouTube Shorts tag');
});

test('auditCutWithSocialMediaAI approves high-retention 5v5 cuts (ACE, 4K, 3K) for rendering', async () => {
    const { auditCutWithSocialMediaAI } = await import('./social-media-agent.js');

    const aceCut = {
        clipType: 'ACE',
        startSec: 100,
        endSec: 122,
        duration: 22,
        killsCount: 5,
        killTimes: [104, 108, 112, 116, 120],
        gameMode: 'COMPETITIVE_OR_UNRATED',
    };

    const approval = auditCutWithSocialMediaAI({ cut: aceCut, playerNick: 'Revenge' });
    assert.strictEqual(approval.status, 'APPROVED', 'ACE 5v5 must be approved');
    assert.ok(approval.viralScore >= 90, 'ACE must have viral score >= 90');
    assert.ok(approval.verdict.includes('Aprovado pelo Social Media IA'));
    assert.strictEqual(approval.checklist.highRetentionPlay, true);
    assert.strictEqual(approval.checklist.competitiveModeConfirmed, true);
});

test('auditCutWithSocialMediaAI rejects Mata-Mata cuts and prevents unapproved rendering', async () => {
    const { auditCutWithSocialMediaAI } = await import('./social-media-agent.js');

    // Mata-Mata por modo explícito
    const dmCut = {
        clipType: '3K',
        startSec: 50,
        endSec: 70,
        duration: 20,
        killsCount: 3,
        gameMode: 'MATA_MATA',
    };
    const dmApproval = auditCutWithSocialMediaAI({ cut: dmCut });
    assert.strictEqual(dmApproval.status, 'REJECTED', 'Mata-Mata cut must be rejected');
    assert.ok(dmApproval.verdict.includes('Mata-Mata (Deathmatch)'));
    assert.strictEqual(dmApproval.checklist.competitiveModeConfirmed, false);

    // Mata-Mata por cadência de respawn (> 6 kills em sequência)
    const dmStreakCut = {
        clipType: 'ACE',
        startSec: 10,
        endSec: 45,
        duration: 35,
        killsCount: 8,
    };
    const streakApproval = auditCutWithSocialMediaAI({ cut: dmStreakCut });
    assert.strictEqual(streakApproval.status, 'REJECTED', 'Streak with > 6 kills must be rejected as Mata-Mata');
});


