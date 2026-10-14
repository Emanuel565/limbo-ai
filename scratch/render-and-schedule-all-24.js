import path from 'node:path';
import { analyzeAndGenerateCutsForGameplay } from '../tools/gameplay-ai-analyzer.js';
import { readScheduleQueue } from '../tools/post-scheduler.js';

async function main() {
    const videoPath = path.join(process.cwd(), 'raw_gameplays', '_processados', '2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4');
    console.log('[Render 24 Cuts] Iniciando renderização completa de 24 cortes acelerados via NVENC...');
    const start = Date.now();

    const result = await analyzeAndGenerateCutsForGameplay({
        filePath: videoPath,
        cutsCount: 24,
        platforms: ['tiktok', 'instagram', 'youtube'],
        tiktokHandle: '@limboinpink',
        instagramHandle: '@limboinpink',
        youtubeHandle: '@limboinpink',
        renderClips: true,
        onProgress: (p) => {
            console.log(`[NVENC Render] (${p.current}/${p.total}) Renderizando: ${p.title}`);
        },
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Renderização e agendamento concluídos em ${elapsed}s!`);
    console.log('Cortes renderizados com sucesso:', result.renderedCount);
    console.log('Posts agendados na fila:', result.scheduledPosts.length);

    const queue = readScheduleQueue();
    console.log('Fila total atual no disco (scheduled-posts.json):', queue.length);
    console.log('\nPrimeiros 3 posts da fila:');
    console.log(JSON.stringify(queue.slice(0, 3).map(p => ({
        id: p.id,
        scheduledFor: p.scheduledFor,
        timeLabel: p.timeLabel,
        title: p.title,
        videoUrl: p.videoUrl
    })), null, 2));
}

main().catch(console.error);
