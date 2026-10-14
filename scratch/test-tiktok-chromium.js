import { ensureBrowser } from '../tools/ghost-engine.js';

async function testChromiumTikTok() {
    console.log('[GhostEngine] Testando raspagem stealth do TikTok no Chromium...');
    const browser = await ensureBrowser();
    const page = await browser.newPage();
    try {
        await page.goto('https://www.tiktok.com/@limboinpink', { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(r => setTimeout(r, 4000));
        const title = await page.title();
        console.log('Page Title:', title);

        const data = await page.evaluate(() => {
            const folEl = document.querySelector('[data-e2e="followers-count"]');
            const likesEl = document.querySelector('[data-e2e="likes-count"]');
            const followEl = document.querySelector('[data-e2e="following-count"]');
            const userSub = document.querySelector('[data-e2e="user-subtitle"]')?.textContent || '';
            const userBio = document.querySelector('[data-e2e="user-bio"]')?.textContent || '';

            // Pega métricas dos vídeos visíveis
            const videoCards = Array.from(document.querySelectorAll('[data-e2e="user-post-item"]'));
            const videoStats = videoCards.map(card => {
                const viewsEl = card.querySelector('[data-e2e="video-views"]') || card.querySelector('strong');
                return viewsEl?.textContent?.trim() || '0';
            });

            const rehydEl = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
            let rehydJson = null;
            if (rehydEl) {
                try {
                    rehydJson = JSON.parse(rehydEl.textContent);
                } catch {}
            }

            return {
                followers: folEl?.textContent || null,
                likes: likesEl?.textContent || null,
                following: followEl?.textContent || null,
                userSub,
                userBio,
                videoStats,
                rehydStats: rehydJson?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats || null,
                itemList: rehydJson?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.itemList?.length || 0,
            };
        });

        console.log('Dados capturados pelo GhostEngine no TikTok:');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await page.close();
    }
}

testChromiumTikTok().then(() => process.exit(0)).catch(console.error);
