import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
    calculateEstimatedEarnings,
    generateValorantBatchCuts,
    scheduleValorantBatchFactory,
    VALORANT_VIRAL_ARCHETYPES,
} from "@/tools/valorant-autopilot.js";
import { readScheduleQueue } from "@/tools/post-scheduler.js";
import { scanRawGameplaysFolder, processGameplayFile } from "@/tools/gameplay-watcher.js";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const postsPerDay = Number(searchParams.get("postsPerDay") || 3);
        const avgViews = Number(searchParams.get("avgViews") || 25000);
        const followers = Number(searchParams.get("followers") || 20000);
        const weeklyLong = searchParams.get("weeklyLong") !== "false";

        const projection = calculateEstimatedEarnings({
            postsPerDay,
            avgViewsPerVideo: avgViews,
            activeFollowers: followers,
            createWeeklyLongVideo: weeklyLong,
        });

        const currentQueue = readScheduleQueue();
        const valorantJobs = currentQueue.filter((p: any) => p.niche === "valorant");

        return NextResponse.json({
            ok: true,
            projection,
            archetypes: VALORANT_VIRAL_ARCHETYPES,
            factoryStatus: {
                totalScheduled: valorantJobs.length,
                pendingExecution: valorantJobs.filter((p: any) => p.status === "SCHEDULED").length,
                publishedSuccess: valorantJobs.filter((p: any) => p.status === "PUBLISHED").length,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const sourceVideoUrl = String(body?.videoUrl || "").trim();
        const cutsCount = Math.min(20, Math.max(1, Number(body?.cutsCount || 10)));
        const matchDurationMinutes = Number(body?.matchDurationMinutes || 35);
        const platforms = Array.isArray(body?.platforms) ? body.platforms : ["tiktok", "instagram", "youtube"];
        const autoSchedule = body?.autoSchedule !== false;

        // 1. REGRA ESTRITA: A fila de disparos só pode ser gerada a partir de uma gameplay real na pasta!
        const rawFolderFiles = scanRawGameplaysFolder();
        const readyFiles = rawFolderFiles.filter((f) => f.isReady);

        // Se informou um arquivo específico, verifica se existe fisicamente
        let physicalVideoPath = null;
        if (sourceVideoUrl) {
            const rawFileName = sourceVideoUrl.replace(/^\/raw_gameplays\//, "");
            const testPath = path.join(process.cwd(), "raw_gameplays", rawFileName);
            if (fs.existsSync(testPath)) {
                physicalVideoPath = testPath;
            }
        }

        // Se não informou ou não existe, mas tem arquivo pronto na pasta, pega o primeiro
        if (!physicalVideoPath && readyFiles.length > 0) {
            physicalVideoPath = readyFiles[0].path;
        }

        if (autoSchedule && !physicalVideoPath) {
            return NextResponse.json({
                ok: false,
                error: "A fila de disparos só pode ser gerada quando tem algum vídeo real na pasta raw_gameplays/. Arraste sua gravação para a pasta antes de acionar os cortes!",
                emptyFolder: true,
            }, { status: 400 });
        }

        // Se tem arquivo físico na pasta, usa o processador autônomo com GhostEngine + IA + FFmpeg
        if (physicalVideoPath) {
            const result = await processGameplayFile(physicalVideoPath, {
                cutsCount,
                matchDurationMinutes,
                platforms,
                tiktokHandle: String(body?.tiktokHandle || "@limboinpink"),
                instagramHandle: String(body?.instagramHandle || "@limboinpink"),
                youtubeHandle: String(body?.youtubeHandle || "@limboinpink"),
                renderClips: true,
            });

            return NextResponse.json({
                ok: true,
                cutsCount: result.cutsCount,
                scheduled: result.scheduledJobs,
                deletedOriginal: result.deletedOriginal,
                message: `Gameplay analisada com GhostEngine: ${result.cutsCount} cortes gerados e agendados nos horários de pico da @limboinpink!`,
            });
        }

        // Caso de simulação sem agendamento (somente preview)
        const cuts = generateValorantBatchCuts({
            sourceVideoUrl,
            cutsCount,
            matchDurationMinutes,
        });

        return NextResponse.json({
            ok: true,
            cutsCount: cuts.length,
            cuts,
            scheduled: null,
            message: `Prévia dos cortes gerada sem agendamento na fila.`,
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

