import { NextResponse } from "next/server";
import {
    getTrendingValorantHashtags,
    buildOptimalHashtags,
    VALORANT_TRENDING_HASHTAGS,
} from "@/tools/social-media-agent.js";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const hashtags = getTrendingValorantHashtags({ limit: 30 });

        const clusters = {
            ace: {
                title: "Cluster ACE / 1v5 (Retenção Máxima)",
                description: "Otimizado para jogadas de 5 kills com gancho explosivo",
                tags: buildOptimalHashtags({ clipType: "ACE", platform: "all", playerNick: "Revenge" }),
            },
            fourK: {
                title: "Cluster 4K / Quadra Kill (Velocidade)",
                description: "Otimizado para spray transfer e eliminações rápidas",
                tags: buildOptimalHashtags({ clipType: "4K", platform: "all", playerNick: "Revenge" }),
            },
            clutch: {
                title: "Cluster Clutch / 1vX (Tensão & Emoção)",
                description: "Otimizado para rounds ganhos no limite com alta taxa de comentários",
                tags: buildOptimalHashtags({ clipType: "CLUTCH", platform: "all", playerNick: "Revenge" }),
            },
            threeK: {
                title: "Cluster 3K / Defesa & Pixel",
                description: "Otimizado para rounds táticos e mira cravada",
                tags: buildOptimalHashtags({ clipType: "3K", platform: "all", playerNick: "Revenge" }),
            },
        };

        return NextResponse.json({
            ok: true,
            niche: "Valorant (Brasil & Global)",
            totalViewsTracked: "98.5B+",
            hashtags,
            clusters,
            algorithmInsights: {
                idealTagCount: "5 a 8 hashtags por vídeo",
                ruleOfThumb: "2 Tags Amplas + 2 Tags de Comunidade BR + 2 Tags da Jogada Específica + 1 Tag de Criador",
                expectedRetentionBoost: "+35% a +65% de alcance no feed FYP e aba Explorar",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar hashtags em alta.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const clipType = String(body?.clipType || "3K").toUpperCase();
        const platform = String(body?.platform || "all").toLowerCase();
        const playerNick = String(body?.playerNick || "Revenge").trim();
        const maxTags = Number(body?.maxTags || 8);

        const tags = buildOptimalHashtags({ clipType, platform, playerNick, maxTags });

        return NextResponse.json({
            ok: true,
            clipType,
            platform,
            playerNick,
            tags,
            tagString: tags.join(" "),
            totalTags: tags.length,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao gerar cluster de hashtags.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
