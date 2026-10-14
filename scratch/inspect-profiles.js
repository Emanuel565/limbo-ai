async function inspectProfile(platform, handle) {
    try {
        if (platform === 'tiktok') {
            const res = await fetch(`https://www.tiktok.com/@${handle}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            });
            const html = await res.text();
            const rehydMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
            if (rehydMatch) {
                const data = JSON.parse(rehydMatch[1]);
                const userDetail = data.__DEFAULT_SCOPE__?.['webapp.user-detail'];
                const stats = userDetail?.userInfo?.stats;
                const user = userDetail?.userInfo?.user;
                return { platform, handle, user: user?.uniqueId || user?.nickname, followerCount: stats?.followerCount, videoCount: stats?.videoCount, heartCount: stats?.heartCount };
            }
            return { platform, handle, notFound: true, htmlSnippet: html.slice(0, 300) };
        }
        if (platform === 'instagram') {
            const res = await fetch(`https://www.instagram.com/${handle}/`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            const html = await res.text();
            const meta = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/i);
            return { platform, handle, metaContent: meta ? meta[1] : null, status: res.status };
        }
    } catch (e) {
        return { platform, handle, error: e.message };
    }
}

async function main() {
    console.log('TIKTOK limbo:', await inspectProfile('tiktok', 'Limbo'));
    console.log('TIKTOK limboinpink:', await inspectProfile('tiktok', 'limboinpink'));
    console.log('INSTAGRAM limboinpink:', await inspectProfile('instagram', 'limboinpink'));
}

main();
