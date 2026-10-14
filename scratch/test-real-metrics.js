import { fetchSocialProfileGhost } from '../tools/ghost-engine.js';
import { analyzeSocialAccount } from '../tools/social-publisher.js';

async function testAll() {
    console.log('Testing GhostEngine for @limboinpink on 3 networks:');
    const tt = await fetchSocialProfileGhost({ platform: 'tiktok', handle: 'limboinpink' });
    console.log('TIKTOK GHOST:', tt);

    const ig = await fetchSocialProfileGhost({ platform: 'instagram', handle: 'limboinpink' });
    console.log('IG GHOST:', ig);

    const yt = await fetchSocialProfileGhost({ platform: 'youtube', handle: 'limboinpink' });
    console.log('YT GHOST:', yt);
}

testAll();
