import path from 'node:path';
import { analyzeAndGenerateCutsForGameplay } from '../tools/gameplay-ai-analyzer.js';

async function main() {
    const videoPath = path.join(process.cwd(), 'raw_gameplays', '_processados', '2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4');
    console.log('[Test AI Cuts] Analisando gameplay de 2 horas:', videoPath);

    const result = await analyzeAndGenerateCutsForGameplay({
        filePath: videoPath,
        cutsCount: 'auto',
        renderClips: false, // apenas metadados e títulos para validação rápida
    });

    console.log('\n--- RESULTADO DA ANÁLISE IA ---');
    console.log('Duração detectada:', result.fileInfo.durationMinutes, 'minutos');
    console.log('Total de cortes ótimos gerados:', result.cutsCount);
    console.log('\nPrimeiros 6 cortes gerados pela IA:');
    result.cuts.slice(0, 6).forEach((c, idx) => {
        console.log(`[Corte ${idx + 1}] Start: ${c.startSec}s | Título: ${c.title} | Headline: ${c.headline}`);
        console.log(`   Hook: ${c.hookText}`);
    });
    console.log('\nÚltimos 3 cortes (Rounds finais / Overtime):');
    result.cuts.slice(-3).forEach((c, idx) => {
        console.log(`[Corte final ${idx + 1}] Start: ${c.startSec}s | Título: ${c.title} | Headline: ${c.headline}`);
        console.log(`   Hook: ${c.hookText}`);
    });
}

main().catch(console.error);
