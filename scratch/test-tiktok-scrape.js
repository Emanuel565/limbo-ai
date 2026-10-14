async function testTikTokScrape() {
    const handle = 'limboinpink';
    console.log(`[TikTok Scrape Test] Testando scraping para @${handle}...`);

    try {
        const res = await fetch(`https://www.tiktok.com/@${handle}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });
        console.log('HTTP Status:', res.status);
        const html = await res.text();
        console.log('HTML length:', html.length);

        const rehydMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (rehydMatch) {
            console.log('Encontrou __UNIVERSAL_DATA_FOR_REHYDRATION__!');
            const parsed = JSON.parse(rehydMatch[1]);
            const userDetail = parsed.__DEFAULT_SCOPE__?.['webapp.user-detail'];
            console.log('User stats:', JSON.stringify(userDetail?.userInfo?.stats, null, 2));
            console.log('User info:', JSON.stringify({
                uniqueId: userDetail?.userInfo?.user?.uniqueId,
                nickname: userDetail?.userInfo?.user?.nickname,
            }, null, 2));

            // Procura lista de vídeos e playCounts
            const itemList = parsed.__DEFAULT_SCOPE__?.['webapp.user-detail']?.itemList || [];
            console.log('Total de itens na lista reidratada:', itemList.length);
        } else {
            console.log('Rehydration script não encontrado diretamente no HTML');
            // Tenta achar SIGI_STATE ou outros scripts
            const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
            if (sigiMatch) console.log('Encontrou SIGI_STATE!');
            
            // Procura meta tags
            const metaDesc = html.match(/<meta name="description" content="([^"]+)"/i);
            if (metaDesc) console.log('Meta description:', metaDesc[1]);
        }
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

testTikTokScrape();
