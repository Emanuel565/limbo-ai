async function testIgEndpoints(handle) {
    // 1. web_profile_info
    try {
        const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'X-IG-App-ID': '936619743392459',
                'Accept': '*/*',
            }
        });
        console.log('web_profile_info status:', res.status);
        if (res.ok) {
            const data = await res.json();
            const user = data?.data?.user;
            console.log('IG web_profile_info user:', {
                biography: user?.biography,
                followers: user?.edge_followed_by?.count,
                following: user?.edge_follow?.count,
                posts: user?.edge_owner_to_timeline_media?.count
            });
            return;
        }
    } catch (e) {
        console.log('web_profile_info error:', e.message);
    }

    // 2. oEmbed
    try {
        const oembedRes = await fetch(`https://api.instagram.com/oembed/?url=https://www.instagram.com/${handle}/`);
        console.log('oEmbed status:', oembedRes.status, await oembedRes.text());
    } catch (e) {
        console.log('oEmbed err:', e.message);
    }

    // 3. Try Puppeteer on ghost engine
    const { fetchSocialProfileGhost } = await import('../tools/ghost-engine.js');
    console.log('GhostEngine scrap IG:', await fetchSocialProfileGhost({ platform: 'instagram', handle }));
}

testIgEndpoints('limboinpink');
