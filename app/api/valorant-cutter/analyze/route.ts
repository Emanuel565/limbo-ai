import { NextRequest, NextResponse } from 'next/server';
import { validateAnalyzeRequest } from '../validators.js';
import { extractStreamAnalysisUrl } from '@/tools/ytdlp-ingestion.js';
import { runKillHunterAnalysis } from '@/tools/detector-kills-wrapper.js';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const validation = validateAnalyzeRequest(body);

        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        let analysisTarget = validation.source;

        // Se for URL, extrai o stream 720p direto na nuvem sem baixar nada
        if (validation.isUrl) {
            try {
                analysisTarget = await extractStreamAnalysisUrl(validation.source);
            } catch {
                analysisTarget = validation.source;
            }
        }

        // Executa o caçador de kills a 2 FPS
        const cuts = await runKillHunterAnalysis(analysisTarget, {
            debug: process.env.NODE_ENV !== 'production',
        });

        return NextResponse.json({
            success: true,
            source: validation.source,
            highlightsFound: cuts.length,
            cuts,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Erro interno na análise de kills' },
            { status: 500 }
        );
    }
}
