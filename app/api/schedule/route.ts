import { NextResponse } from "next/server";
import {
    readScheduleQueue,
    schedulePost,
    cancelScheduledPost,
    processDuePosts,
    getNextOptimalSlot,
} from "@/tools/post-scheduler.js";

export async function GET() {
    try {
        // Tenta processar qualquer post agendado que já atingiu o horário
        const processResult = await processDuePosts().catch((err) => {
            console.error("Erro no processDuePosts:", err);
            return null;
        });

        const queue = readScheduleQueue();
        const nextSlot = getNextOptimalSlot();

        return NextResponse.json({
            ok: true,
            queue,
            nextOptimalSlot: nextSlot,
            processResult,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao consultar fila de agendamento.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const title = String(body?.title || "").trim();
        const description = String(body?.description || "").trim();
        const videoUrl = String(body?.videoUrl || "").trim();
        const videoPath = body?.videoPath ? String(body.videoPath) : undefined;
        const platforms = Array.isArray(body?.platforms) ? body.platforms : ["tiktok", "instagram"];
        const useNextOptimal = Boolean(body?.useNextOptimal ?? true);
        const scheduledFor = body?.scheduledFor ? String(body.scheduledFor) : undefined;
        const deleteAfterPublish = Boolean(body?.deleteAfterPublish ?? true);

        if (!title) {
            return NextResponse.json({ ok: false, error: "O título do vídeo é obrigatório." }, { status: 400 });
        }

        const newPost = schedulePost({
            title,
            description,
            videoUrl,
            videoPath,
            platforms,
            scheduledFor,
            useNextOptimal,
            deleteAfterPublish,
            tiktokHandle: "@Limbo",
            instagramHandle: "@limboinpink",
            niche: "valorant",
        });

        return NextResponse.json({
            ok: true,
            message: `Vídeo agendado com sucesso para ${newPost.timeLabel} (${newPost.deleteAfterPublish ? "Auto-exclusão após envio ativada" : "Salvar no disco"})!`,
            post: newPost,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao agendar publicação.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ ok: false, error: "ID do agendamento é obrigatório." }, { status: 400 });
        }

        const cancelled = cancelScheduledPost(id);
        if (!cancelled) {
            return NextResponse.json({ ok: false, error: "Agendamento não encontrado." }, { status: 404 });
        }

        return NextResponse.json({
            ok: true,
            message: "Agendamento cancelado com sucesso.",
            post: cancelled,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao cancelar agendamento.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
