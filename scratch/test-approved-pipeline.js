import { analyzeAndGenerateCutsForGameplay } from '../tools/gameplay-ai-analyzer.js';
import { readScheduleQueue } from '../tools/post-scheduler.js';

async function testPipeline() {
    const video = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';
    console.log('=== TESTANDO PIPELINE COM SISTEMA DE APROVAÇÃO IA E ANTI-PLACAR ===');
    const t0 = Date.now();

    const result = await analyzeAndGenerateCutsForGameplay({
        filePath: video,
        cutsCount: 6, // 6 cortes de teste para validação rápida
        renderClips: false, // apenas gera e audita metadados sem re-renderizar vídeo pesado
    });

    console.log(`Análise concluída em ${(Date.now() - t0) / 1000}s!`);
    console.log(`Total de cortes gerados e auditados: ${result.cuts.length}`);

    result.cuts.forEach((cut, i) => {
        console.log(`\n[Corte ${i + 1}]`);
        console.log(`Título: ${cut.title}`);
        console.log(`Headline: ${cut.headline}`);
        console.log(`Timestamp: ${cut.startSec}s -> ${cut.endSec}s (${cut.duration}s)`);
        console.log(`Status de Aprovação: ${cut.aiApproval?.status}`);
        console.log(`Score Viral: ${cut.aiApproval?.viralScore}/100`);
        console.log(`Checklist:`, cut.aiApproval?.checklist);
        console.log(`Veredito: ${cut.aiApproval?.verdict}`);
    });
}

testPipeline();
