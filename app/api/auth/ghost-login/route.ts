import { NextResponse } from "next/server";
// @ts-ignore
import { openGhostStudioLogin } from "@/tools/ghost-engine.js";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const platform = body?.platform === "tiktok" ? "tiktok" : "youtube";
        const result = await openGhostStudioLogin({ platform });
        return NextResponse.json({
            ok: true,
            message: result.message,
            platform,
        });
    } catch (error: any) {
        return NextResponse.json(
            { ok: false, error: error?.message || "Falha ao iniciar GhostEngine" },
            { status: 500 }
        );
    }
}
