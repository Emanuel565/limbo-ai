import { NextResponse } from "next/server";
import {
    searchYoutubeTrends,
    fetchTopTrendingGlobal,
    selectViralVideoWithOllama,
    fetchYouTubeTrendingGhost,
    fetchTikTokTrendingGhost,
    fetchInstagramReelsGhost,
    getGhostEngineStats,
} from "@/tools/trend-hunter.js";

export async function GET() {
    try {
        const stats = getGhostEngineStats();
        return NextResponse.json({
            ok: true,
            ghostEngine: {
                ...stats,
                status: stats.hasBrowser ? "ACTIVE" : "STANDBY",
                antiDetection: "COHERENT_PERSONAS_V2",
                interceptors: ["youtube", "tiktok", "instagram"],
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const platform = String(body?.platform || "youtube").trim().toLowerCase();
        const engine = String(body?.engine || "auto").trim().toLowerCase(); // 'auto' | 'ghost' | 'official'
        const mode = String(body?.mode || "search").trim();
        const niche = String(body?.niche || "podcast tecnologia").trim();
        const regionCode = String(body?.regionCode || "BR").trim().toUpperCase();
        const maxResults = Math.min(12, Math.max(3, Number(body?.maxResults || 6)));
        const model = String(body?.model || process.env.OLLAMA_MODEL || "llama3.1:8b").trim();

        let candidates: any[] = [];
        let usedEngine = "official";

        if (platform === "tiktok") {
            console.log(`[TrendHunter] 👻 Coletando tendências do TikTok via GhostEngine (${niche})...`);
            candidates = await fetchTikTokTrendingGhost({
                tag: niche.replace(/^#/, ""),
                maxResults,
            });
            usedEngine = "ghost-engine-v2";
        } else if (platform === "instagram") {
            console.log(`[TrendHunter] 👻 Coletando tendências do Instagram Reels via GhostEngine (${niche})...`);
            candidates = await fetchInstagramReelsGhost({
                tag: niche.replace(/^#/, ""),
                maxResults,
            });
            usedEngine = "ghost-engine-v2";
        } else {
            // YouTube
            const shouldForceGhost = engine === "ghost" || !process.env.YOUTUBE_API_KEY;

            if (shouldForceGhost) {
                console.log(`[TrendHunter] 👻 Executando YouTube Trending via GhostEngine v2 (Zero API Key)...`);
                candidates = await fetchYouTubeTrendingGhost({ regionCode, maxResults });
                usedEngine = "ghost-engine-v2";
            } else {
                try {
                    if (mode === "charts" || mode === "top-trending") {
                        console.log(`[TrendHunter] Buscando Top Trending Charts via API Oficial (${regionCode})...`);
                        candidates = await fetchTopTrendingGlobal({
                            regionCode,
                            maxResults,
                            apiKey: process.env.YOUTUBE_API_KEY,
                        });
                    } else {
                        console.log(`[TrendHunter] Buscando vídeos virais no nicho "${niche}" via API Oficial...`);
                        candidates = await searchYoutubeTrends({
                            query: niche,
                            maxResults,
                            apiKey: process.env.YOUTUBE_API_KEY,
                        });
                    }
                    usedEngine = "youtube-data-api-v3";
                } catch (apiError: any) {
                    console.warn(`[TrendHunter] API Oficial falhou (${apiError.message}). Ativando GhostEngine fallback...`);
                    candidates = await fetchYouTubeTrendingGhost({ regionCode, maxResults });
                    usedEngine = "ghost-engine-fallback";
                }
            }
        }

        if (!candidates || candidates.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: `Nenhuma tendência localizada para ${platform.toUpperCase()} (${niche || regionCode}).`,
                },
                { status: 404 }
            );
        }

        console.log(`[TrendHunter] Analisando ${candidates.length} conteúdos com IA Ollama (${model})...`);
        const selected = await selectViralVideoWithOllama(candidates, {
            niche: `${platform.toUpperCase()} - ${mode === "charts" ? `Top Charts (${regionCode})` : niche}`,
            model,
            ollamaUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        });

        return NextResponse.json({
            ok: true,
            platform,
            engineUsed: usedEngine,
            mode,
            regionCode,
            niche,
            candidates,
            selected,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido ao pesquisar tendências.";
        console.error("[TrendHunter Error]:", error);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
