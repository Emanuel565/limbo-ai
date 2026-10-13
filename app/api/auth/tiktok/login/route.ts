import { NextResponse } from "next/server";

export async function GET() {
    const clientKey = process.env.TIKTOK_CLIENT_KEY || "sbawes5f6trrwixg9i";
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || "https://emanuel565.github.io/limbo-ai/";
    const scope = "user.info.basic,video.upload,video.publish";
    const state = `limbo_${Date.now()}`;

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return NextResponse.json({
        ok: true,
        authUrl,
    });
}
