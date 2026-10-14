async function testTiktok(handle) {
    const res = await fetch(`https://www.tiktok.com/@${handle}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('Length:', html.length);
    const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    console.log('Match found:', Boolean(m));
    if (m) {
        const j = JSON.parse(m[1]);
        const stats = j.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
        console.log('Stats:', stats);
    }
}

testTiktok('limboinpink');
