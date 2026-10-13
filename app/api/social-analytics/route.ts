import { NextResponse } from "next/server";
import { analyzeSocialAccount } from "@/tools/social-publisher.js";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const tiktokHandle = String(body?.tiktokHandle || "@seu_tiktok").trim();
        const instagramHandle = String(body?.instagramHandle || "@seu_instagram").trim();

        const [tiktokData, instagramData] = await Promise.all([
            analyzeSocialAccount({
                platform: "tiktok",
                handle: tiktokHandle,
                accessToken: process.env.TIKTOK_ACCESS_TOKEN,
            }),
            analyzeSocialAccount({
                platform: "instagram",
                handle: instagramHandle,
                accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
                accountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
            }),
        ]);

        return NextResponse.json({
            ok: true,
            analyzedAt: new Date().toISOString(),
            accounts: {
                tiktok: tiktokData,
                instagram: instagramData,
            },
            summary: {
                totalAudienceEstimated: tiktokData.followers + instagramData.followers,
                highestRetentionPlatform: tiktokData.viralityScore >= instagramData.viralityScore ? "TikTok" : "Instagram",
                primeTimeToday: tiktokData.bestPostingTimes[1] || "18:30",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao analisar as contas sociais.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
