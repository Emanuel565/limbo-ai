import { NextResponse } from "next/server";
import {
    readScheduleQueue,
    schedulePost,
    cancelScheduledPost,
    clearScheduleQueue,
    processDuePosts,
    getNextOptimalSlot,
    updatePostApproval,
    publishPostById,
    groupPostsByWeek,
    cleanupPublishedVideos,
} from "@/tools/post-scheduler.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        // Processa posts agendados vencidos em background sem travar a resposta imediata da UI
        processDuePosts().catch((err) => {
            console.error("Erro no background processDuePosts:", err);
        });

        const queue = readScheduleQueue();
        const nextSlot = getNextOptimalSlot();
        const groupedWeeks = groupPostsByWeek(queue);

        return NextResponse.json(
            {
                ok: true,
                queue,
                posts: queue,
                groupedWeeks,
                nextOptimalSlot: nextSlot,
            },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao consultar fila de agendamento.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Ação de limpeza de disco SSD solicitada pelo usuário
        if (body?.action === "cleanup_disk") {
            const cleanRes = cleanupPublishedVideos({
                cleanOrphaned: body?.cleanOrphaned ?? true,
            });
            return NextResponse.json({
                ...cleanRes,
                message: `SSD liberado: ${cleanRes.freedMb} MB economizados (${cleanRes.filesDeleted.length} arquivos limpos). Todos os posts continuam salvos no banco de dados!`,
            });
        }

        // Disparo imediato manual ("Publicar Agora")
        if (body?.action === "publish_now") {
            const id = String(body?.id || "");
            if (!id) {
                return NextResponse.json({ ok: false, error: "ID do post é obrigatório para publicação imediata." }, { status: 400 });
            }
            const publishRes = await publishPostById(id);
            return NextResponse.json({
                ok: publishRes.ok,
                message: publishRes.ok ? "Publicação realizada nas redes com sucesso!" : "Falha na publicação.",
                result: publishRes,
            });
        }

        const title = String(body?.title || "").trim();
        const description = String(body?.description || "").trim();
        const videoUrl = String(body?.videoUrl || "").trim();
        const videoPath = body?.videoPath ? String(body.videoPath) : undefined;
        const platforms = Array.isArray(body?.platforms) ? body.platforms : ["tiktok", "instagram", "youtube"];
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
        const clearAll = searchParams.get("clearAll") === "true" || id === "all";

        if (clearAll) {
            clearScheduleQueue();
            return NextResponse.json({
                ok: true,
                message: "Fila de agendamentos limpa com sucesso. Pronto para nova gameplay!",
                cleared: true,
            });
        }

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

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const id = String(body?.id || "");
        const status = body?.status === "REJECTED" ? "REJECTED" : "APPROVED";
        const verdict = body?.verdict ? String(body.verdict) : "";

        if (!id) {
            return NextResponse.json({ ok: false, error: "ID do agendamento é obrigatório." }, { status: 400 });
        }

        const updated = updatePostApproval(id, { status, verdict });
        if (!updated) {
            return NextResponse.json({ ok: false, error: "Agendamento não encontrado." }, { status: 404 });
        }

        return NextResponse.json({
            ok: true,
            message: `Status do corte atualizado para ${status}!`,
            post: updated,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar aprovação do agendamento.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}


