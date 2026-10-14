import { NextResponse } from "next/server";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
    RAW_GAMEPLAYS_DIR,
    getWatcherDaemonStatus,
    scanAndProcessAll,
    startWatcherDaemon,
    stopWatcherDaemon,
} from "@/tools/gameplay-watcher.js";

export async function GET() {
    try {
        const status = getWatcherDaemonStatus();
        return NextResponse.json({ ok: true, status });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // 1. Upload direto de arquivo de gameplay arrastado na interface via streaming em chunks
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file");

            if (!(file instanceof File) || file.size === 0) {
                return NextResponse.json(
                    { ok: false, error: "Nenhum arquivo de vídeo foi enviado." },
                    { status: 400 }
                );
            }

            const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const targetPath = path.join(RAW_GAMEPLAYS_DIR, cleanName);
            
            // Grava via stream de chunks sem estourar o limite de memória do V8/Node.js
            const nodeStream = Readable.fromWeb(file.stream() as any);
            const fileStream = createWriteStream(targetPath);
            await pipeline(nodeStream, fileStream);

            return NextResponse.json({
                ok: true,
                uploaded: true,
                fileName: cleanName,
                sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
                message: `Gameplay "${cleanName}" recebida e salva em raw_gameplays/ com sucesso!`,
                status: getWatcherDaemonStatus(),
            });
        }

        const body = await request.json().catch(() => ({}));
        const action = String(body?.action || "scan_and_process").trim();

        if (action === "start_daemon") {
            const intervalSeconds = Number(body?.intervalSeconds || 15);
            const res = startWatcherDaemon(intervalSeconds, {
                cutsCount: Number(body?.cutsCount || 10),
                tiktokHandle: String(body?.tiktokHandle || "@limboinpink"),
                instagramHandle: String(body?.instagramHandle || "@limboinpink"),
                youtubeHandle: String(body?.youtubeHandle || "@limboinpink"),
            });
            return NextResponse.json({ ok: true, ...res, status: getWatcherDaemonStatus() });
        }

        if (action === "stop_daemon") {
            const res = stopWatcherDaemon();
            return NextResponse.json({ ok: true, ...res, status: getWatcherDaemonStatus() });
        }

        // Ação padrão: Escanear e processar imediatamente (com renderização NVENC ativada)
        const processResult = await scanAndProcessAll({
            cutsCount: body?.cutsCount ? Number(body.cutsCount) : 'auto',
            matchDurationMinutes: Number(body?.matchDurationMinutes || 35),
            renderClips: body?.renderClips !== false,
            platforms: ["tiktok", "instagram", "youtube"],
            tiktokHandle: String(body?.tiktokHandle || "@limboinpink"),
            instagramHandle: String(body?.instagramHandle || "@limboinpink"),
            youtubeHandle: String(body?.youtubeHandle || "@limboinpink"),
        });

        return NextResponse.json({
            ok: true,
            action: "scan_and_process",
            ...processResult,
            status: getWatcherDaemonStatus(),
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
