import { ensureBrowser } from '../tools/ghost-engine.js';

async function testChromiumTikTok(handle) {
    const browser = await ensureBrowser();
    const page = await browser.newPage();
    try {
        console.log('Navigating with Chromium to TikTok @' + handle + '...');
        await page.goto(`https://www.tiktok.com/@${handle}`, { waitUntil: 'networkidle2', timeout: 20000 });
        const res = await page.evaluate(() => {
            const folEl = document.querySelector('[data-e2e="followers-count"]');
            const likesEl = document.querySelector('[data-e2e="likes-count"]');
            const vidCount = document.querySelectorAll('[data-e2e="user-post-item"]').length;
            const rehydEl = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
            let rehydStats = null;
            if (rehydEl) {
                try {
                    const parsed = JSON.parse(rehydEl.textContent);
                    rehydStats = parsed.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
                } catch {}
            }
            return {
                title: document.title,
                folText: folEl ? folEl.textContent : null,
                likesText: likesEl ? likesEl.textContent : null,
                vidCount,
                rehydStats,
            };
        });
        console.log('RESULT FROM CHROMIUM:', res);
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await page.close();
    }
}

testChromiumTikTok('limboinpink');
