import { NextResponse } from "next/server";
import { searchYoutubeTrends, selectViralVideoWithOllama } from "@/tools/trend-hunter.js";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const niche = String(body?.niche || "podcast tecnologia").trim();
        const maxResults = Math.min(12, Math.max(3, Number(body?.maxResults || 6)));
        const model = String(body?.model || process.env.OLLAMA_MODEL || "llama3.1:8b").trim();

        if (!process.env.YOUTUBE_API_KEY) {
            return NextResponse.json(
                { ok: false, error: "YOUTUBE_API_KEY não configurada no servidor." },
                { status: 500 }
            );
        }

        console.log(`[TrendHunter] Buscando vídeos virais no nicho: "${niche}"...`);
        const candidates = await searchYoutubeTrends({
            query: niche,
            maxResults,
            apiKey: process.env.YOUTUBE_API_KEY,
        });

        if (!candidates || candidates.length === 0) {
            return NextResponse.json(
                { ok: false, error: `Nenhum vídeo relevante encontrado para o termo: "${niche}".` },
                { status: 404 }
            );
        }

        console.log(`[TrendHunter] Analisando ${candidates.length} vídeos com Ollama (${model})...`);
        const selected = await selectViralVideoWithOllama(candidates, {
            niche,
            model,
            ollamaUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        });

        return NextResponse.json({
            ok: true,
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
