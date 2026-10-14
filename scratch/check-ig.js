async function checkInstagram(handle) {
    // 1. Direct page
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });
    const html = await res.text();
    console.log('IG HTML length:', html.length);
    
    // Check all meta tags
    const metas = html.match(/<meta[^>]+>/g) || [];
    for (const m of metas) {
        if (m.includes('description') || m.includes('followers') || m.includes('Followers') || m.includes('title')) {
            console.log('META:', m);
        }
    }

    // Check shared data script or JSON-LD
    const jsonLd = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLd) {
        console.log('JSON-LD:', jsonLd[1]);
    }

    // 2. Check Graph API with user token in .env.local!
    const env = await import('node:fs').then(fs => fs.readFileSync('.env.local', 'utf8'));
    const tokenMatch = env.match(/INSTAGRAM_ACCESS_TOKEN=([^\r\n]+)/);
    const accountIdMatch = env.match(/INSTAGRAM_BUSINESS_ACCOUNT_ID=([^\r\n]+)/);
    if (tokenMatch) {
        const token = tokenMatch[1].trim();
        console.log('Testing Graph API token (length', token.length, 'starts with', token.slice(0, 10), ')...');
        // Try /me
        const graphRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`);
        console.log('Graph /me:', graphRes.status, await graphRes.text());
        
        // Try business graph API if token works for facebook graph
        if (accountIdMatch) {
            const accId = accountIdMatch[1].trim();
            const fbRes = await fetch(`https://graph.facebook.com/v19.0/${accId}?fields=id,username,followers_count,media_count&access_token=${token}`);
            console.log('Graph /accountId:', fbRes.status, await fbRes.text());
        }
    }
}

checkInstagram('limboinpink');
