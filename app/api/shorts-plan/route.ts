import { NextResponse } from "next/server";
import { createClip } from "@/tools/viral-short-pipeline.js";

function buildSegmentsFromTranscript(transcript: string) {
    const sentences = transcript
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

    if (sentences.length === 0) {
        throw new Error("Informe uma transcrição válida para gerar o corte do short.");
    }

    return sentences.map((text, index) => {
        const start = index * 12;
        const end = start + Math.max(8, Math.min(22, Math.ceil(text.length / 18)));
        return { start, end, text };
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const transcript = String(body?.transcript || "").trim();

        if (!transcript) {
            return NextResponse.json(
                { ok: false, error: "A transcrição do vídeo é obrigatória." },
                { status: 400 },
            );
        }

        const segments = buildSegmentsFromTranscript(transcript);
        const plan = createClip({
            inputPath: "video.mp4",
            outputPath: "short-viral.mp4",
            transcriptSegments: segments,
            maxSeconds: 60,
        });

        return NextResponse.json({ ok: true, plan });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao gerar o plano do short.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
