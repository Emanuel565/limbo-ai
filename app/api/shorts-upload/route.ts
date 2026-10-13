import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClip, renderClip } from "@/tools/viral-short-pipeline.js";

function buildSegmentsFromTranscript(transcript: string) {
    const sentences = transcript
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

    if (sentences.length === 0) {
        return [{ start: 0, end: 12, text: "Momento principal do vídeo para gerar o melhor corte em short." }];
    }

    return sentences.map((text, index) => {
        const start = index * 12;
        const end = start + Math.max(8, Math.min(22, Math.ceil(text.length / 18)));
        return { start, end, text };
    });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("video");
        const transcript = String(formData.get("transcript") || "").trim();

        if (!(file instanceof File) || !file.size) {
            return NextResponse.json({ ok: false, error: "Selecione um vídeo para processar." }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "generated");
        await mkdir(uploadDir, { recursive: true });

        const extension = path.extname(file.name) || ".mp4";
        const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const inputPath = path.join(uploadDir, `${baseName}-input${extension}`);
        const outputPath = path.join(uploadDir, `${baseName}-short.mp4`);
        const subtitlePath = `${outputPath}.srt`;

        const hookHeadline = String(formData.get("hookHeadline") || "").trim();
        const normalizeAudio = formData.get("normalizeAudio") === "true";
        const burnSubtitles = formData.get("burnSubtitles") !== "false";
        const assFileName = `${baseName}-short.mp4.ass`;
        const assSubtitlePath = path.join(uploadDir, assFileName);

        const bytes = await file.arrayBuffer();
        await writeFile(inputPath, Buffer.from(bytes));

        const segments = buildSegmentsFromTranscript(transcript || file.name);
        // FFmpeg roda com cwd = uploadDir, então entrada/saída/legenda vão por nome de arquivo
        const plan = createClip({
            inputPath: path.basename(inputPath),
            outputPath: path.basename(outputPath),
            transcriptSegments: segments,
            maxSeconds: 60,
            hookHeadline: hookHeadline || null,
            subtitlePath: burnSubtitles ? assFileName : null,
            normalizeAudio,
        });

        // Legendas precisam existir ANTES da renderização para serem queimadas no vídeo
        await writeFile(subtitlePath, plan.subtitle || "");
        await writeFile(assSubtitlePath, plan.assSubtitle || "");

        renderClip(plan, { cwd: uploadDir });

        return NextResponse.json({
            ok: true,
            fileName: path.basename(outputPath),
            mp4Url: `/generated/${path.basename(outputPath)}`,
            subtitleUrl: `/generated/${path.basename(subtitlePath)}`,
            assSubtitleUrl: `/generated/${path.basename(assSubtitlePath)}`,
            plan,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao processar o vídeo.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
