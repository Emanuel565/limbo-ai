import { NextResponse } from "next/server";
import { analyzeSocialAccount } from "@/tools/social-publisher.js";
import { calculateEstimatedEarnings } from "@/tools/valorant-autopilot.js";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Sanitização e padronização para a marca oficial @limboinpink
        function normalizeHandle(val: unknown): string {
            const raw = String(val || "").trim();
            if (!raw || raw.startsWith("@seu_") || raw === "@Limbo" || raw.startsWith("@emanuel.")) {
                return "@limboinpink";
            }
            return raw.startsWith("@") ? raw : `@${raw}`;
        }

        const tiktokHandle = normalizeHandle(body?.tiktokHandle);
        const instagramHandle = normalizeHandle(body?.instagramHandle);
        const youtubeHandle = normalizeHandle(body?.youtubeHandle);

        const [tiktokData, instagramData, youtubeData] = await Promise.all([
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
            analyzeSocialAccount({
                platform: "youtube",
                handle: youtubeHandle,
                accessToken: process.env.YOUTUBE_API_KEY,
            }),
        ]);

        const totalFollowers = (tiktokData.followers || 0) + (instagramData.followers || 0) + (youtubeData.followers || 0);
        const totalMediaCount = (tiktokData.mediaCount || 0) + (instagramData.mediaCount || 0) + (youtubeData.mediaCount || 0);
        const tiktokTotalViews = Number(tiktokData.totalViews || tiktokData.viewCount || 0);
        const totalViews = (youtubeData.viewCount || 0) + tiktokTotalViews;
        const postsPerDay = Number(body?.postsPerDay) || 3;
        const avgViewsPerVideo = Number(body?.avgViewsPerVideo) || 25000;
        const activeFollowers = Number(body?.activeFollowers) || totalFollowers;

        const projections = calculateEstimatedEarnings({
            postsPerDay,
            avgViewsPerVideo,
            activeFollowers,
            createWeeklyLongVideo: body?.createWeeklyLongVideo !== false,
        });

        // Determina plataforma com maior score de viralidade
        const scores = [
            { name: "TikTok", score: tiktokData.viralityScore },
            { name: "Instagram Reels", score: instagramData.viralityScore },
            { name: "YouTube Shorts", score: youtubeData.viralityScore },
        ].sort((a, b) => b.score - a.score);

        const totalMonthlyViews = Number(tiktokData.viewsMonthly || 0) + Math.round((youtubeData.viewCount || 0) * 0.2);
        const totalDailyViews = Math.round(totalMonthlyViews / 30);

        return NextResponse.json({
            ok: true,
            analyzedAt: new Date().toISOString(),
            accounts: {
                tiktok: tiktokData,
                instagram: instagramData,
                youtube: youtubeData,
            },
            projections,
            summary: {
                totalAudienceEstimated: totalFollowers,
                totalMediaPublished: totalMediaCount,
                totalAccumulatedViews: totalViews,
                totalMonthlyViews,
                totalDailyViews,
                highestRetentionPlatform: scores[0].name,
                primeTimeToday: "18:15",
                estimatedMonthlyBrl: projections.totals.totalMonthlyBrl,
                estimatedMonthlyUsd: projections.totals.totalMonthlyUsd,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao analisar as contas sociais.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

