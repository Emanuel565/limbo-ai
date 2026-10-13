import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const youtubeHandle = String(body?.youtubeHandle || "").trim();
        const instagramHandle = String(body?.instagramHandle || "").trim();
        const tiktokHandle = String(body?.tiktokHandle || "").trim();
        const title = String(body?.title || "").trim();
        const description = String(body?.description || "").trim();
        const videoUrl = String(body?.videoUrl || "").trim();
        const platform = String(body?.platform || "all").trim();

        if (!title || !description) {
            return NextResponse.json(
                { ok: false, error: "Título e descrição são obrigatórios para preparar a publicação." },
                { status: 400 },
            );
        }

        let platforms: string[] = [];
        if (platform === "tiktok") {
            platforms = ["TikTok"];
        } else if (platform === "youtube") {
            platforms = ["YouTube Shorts"];
        } else if (platform === "instagram") {
            platforms = ["Instagram Reels"];
        } else if (platform === "both") {
            platforms = ["YouTube Shorts", "Instagram Reels"];
        } else {
            // all
            platforms = ["TikTok", "YouTube Shorts", "Instagram Reels"];
        }

        const activeAccounts = [
            tiktokHandle ? `TikTok: ${tiktokHandle}` : null,
            youtubeHandle ? `YouTube: ${youtubeHandle}` : null,
            instagramHandle ? `Instagram: ${instagramHandle}` : null,
        ].filter(Boolean);

        if (activeAccounts.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Conecte pelo menos um perfil (TikTok, YouTube ou Instagram) para liberar a publicação." },
                { status: 400 },
            );
        }

        // TikTok Viral Optimized Caption
        const tiktokTags = ["#fyp", "#foryou", "#viral", "#tiktokbrasil", "#aprendanotiktok", "#shorts"].join(" ");
        const tiktokCaption = `${title}\n\n${tiktokTags}\n\n${description}`.slice(0, 2200);

        // YouTube Shorts Caption
        const youtubeCaption = `${title}\n\n${description}\n\n#shorts #viralcontent`;

        // Instagram Reels Caption
        const instagramCaption = `${title}\n\n${description}\n\n#reels #viral #explore`;

        // TikTok Content Posting API Spec Payload (v2)
        const tiktokApiPayload = {
            target: "tiktok_direct_post",
            post_info: {
                title: title.slice(0, 150),
                caption: tiktokCaption,
                privacy_level: "PUBLIC_TO_EVERYONE",
                disable_duet: false,
                disable_stitch: false,
                disable_comment: false,
                video_cover_timestamp_ms: 1000,
            },
            source_info: {
                source: "PULL_FROM_URL",
                video_url: videoUrl || "http://localhost:3000/generated/short-viral.mp4",
            },
        };

        return NextResponse.json({
            ok: true,
            message: `Preparado com sucesso para ${platforms.join(" • ")} com algoritmo otimizado para retenção.`,
            platforms,
            activeAccounts,
            payload: {
                title,
                videoUrl,
                tiktok: {
                    handle: tiktokHandle,
                    caption: tiktokCaption,
                    apiPayload: tiktokApiPayload,
                },
                youtube: {
                    handle: youtubeHandle,
                    caption: youtubeCaption,
                },
                instagram: {
                    handle: instagramHandle,
                    caption: instagramCaption,
                },
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao preparar a publicação.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
