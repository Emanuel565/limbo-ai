import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const youtubeHandle = String(body?.youtubeHandle || "").trim();
        const instagramHandle = String(body?.instagramHandle || "").trim();
        const title = String(body?.title || "").trim();
        const description = String(body?.description || "").trim();
        const videoUrl = String(body?.videoUrl || "").trim();
        const platform = String(body?.platform || "youtube").trim();

        if (!title || !description) {
            return NextResponse.json(
                { ok: false, error: "Título e descrição são obrigatórios para preparar a publicação." },
                { status: 400 },
            );
        }

        const platforms = platform === "both"
            ? ["YouTube", "Instagram"]
            : platform === "instagram"
                ? ["Instagram"]
                : ["YouTube"];

        const activeAccounts = [
            youtubeHandle ? `YouTube: ${youtubeHandle}` : null,
            instagramHandle ? `Instagram: ${instagramHandle}` : null,
        ].filter(Boolean);

        if (activeAccounts.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Conecte pelo menos uma conta do YouTube ou do Instagram para liberar a publicação." },
                { status: 400 },
            );
        }

        const caption = `${title}\n\n${description}\n\nVideo final: ${videoUrl || "arquivo local pronto para upload"}`;

        return NextResponse.json({
            ok: true,
            message: "Preparado para publicação com legenda e descrição finalizadas.",
            platforms,
            payload: {
                title,
                caption,
                videoUrl,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao preparar a publicação.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
