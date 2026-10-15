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

        const startSeconds = Number(body?.startSeconds) > 0 ? Number(body.startSeconds) : 0;
        const maxSeconds = Number(body?.maxSeconds) > 0 ? Number(body.maxSeconds) : null;
        const playerNick = String(body?.playerNick || 'Revenge').trim();
        const filterDeathmatch = body?.filterDeathmatch !== false;

        // Executa o caçador de kills focado no jogador Revenge (apenas Sem Classificação ou Competitivo)
        const cuts = await runKillHunterAnalysis(analysisTarget, {
            playerNick,
            startSeconds,
            maxSeconds,
            filterDeathmatch,
            debug: process.env.NODE_ENV !== 'production',
        } as any);

        return NextResponse.json({
            success: true,
            source: validation.source,
            gameModeFilter: 'COMPETITIVE_OR_UNRATED_ONLY',
            ruleApplied: 'Apenas partidas Competitivas ou Sem Classificação (Mata-Mata bloqueado)',
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
