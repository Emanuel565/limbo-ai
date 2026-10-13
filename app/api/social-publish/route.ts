import { NextResponse } from "next/server";
import { executeMultiPlatformPublish, formatSocialCaptions } from "@/tools/social-publisher.js";

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
        const action = String(body?.action || "publish").trim(); // "prepare" | "publish"

        if (!title || !description) {
            return NextResponse.json(
                { ok: false, error: "Título e descrição são obrigatórios para preparar ou publicar o vídeo." },
                { status: 400 },
            );
        }

        const activeAccounts = [
            tiktokHandle ? `TikTok: ${tiktokHandle}` : null,
            youtubeHandle ? `YouTube: ${youtubeHandle}` : null,
            instagramHandle ? `Instagram: ${instagramHandle}` : null,
        ].filter(Boolean);

        if (activeAccounts.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Conecte pelo menos um perfil (TikTok ou Instagram) para publicar." },
                { status: 400 },
            );
        }

        // Define quais plataformas serão acionadas
        let targetPlatforms: string[] = [];
        if (platform === "tiktok") targetPlatforms = ["tiktok"];
        else if (platform === "instagram") targetPlatforms = ["instagram"];
        else if (platform === "both") targetPlatforms = ["tiktok", "instagram"];
        else targetPlatforms = ["tiktok", "instagram", "youtube"];

        // Executa ou Prepara via motor multi-plataforma
        const isDryRun = action === "prepare";
        const execution = await executeMultiPlatformPublish({
            platforms: targetPlatforms,
            videoUrl: videoUrl || "http://localhost:3000/generated/short-viral.mp4",
            title,
            description,
            tiktokHandle,
            instagramHandle,
            dryRun: isDryRun,
        });

        const platformLabels = targetPlatforms.map((p) => {
            if (p === "tiktok") return "TikTok";
            if (p === "instagram") return "Instagram Reels";
            return "YouTube Shorts";
        });

        return NextResponse.json({
            ok: true,
            action,
            message: isDryRun
                ? `Pronto para ${platformLabels.join(" • ")} com hashtags de alta retenção.`
                : `Disparo da API executado para ${platformLabels.join(" • ")}.`,
            platforms: platformLabels,
            activeAccounts,
            results: execution.results,
            payload: {
                title,
                videoUrl,
                tiktok: {
                    handle: tiktokHandle,
                    caption: execution.captions.tiktok.caption,
                    status: execution.results.tiktok,
                },
                instagram: {
                    handle: instagramHandle,
                    caption: execution.captions.instagram.caption,
                    status: execution.results.instagram,
                },
                youtube: {
                    handle: youtubeHandle,
                    caption: execution.captions.youtube.caption,
                },
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao processar a publicação social.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
