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

