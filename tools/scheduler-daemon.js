import { processDuePosts, getNextOptimalSlot } from './post-scheduler.js';

const CHECK_INTERVAL_MS = 60 * 1000; // 60 segundos

console.log('--------------------------------------------------');
console.log('🤖 LIMBO AI - AGENDADOR AUTOMÁTICO DE PUBLICAÇÃO');
console.log('Horários Nobres Monitorados (TikTok @Limbo & Insta @limboinpink)');
console.log('Auto-Exclusão de Arquivos: ATIVADA (libera SSD pós-envio)');
console.log('--------------------------------------------------');

const nextSlot = getNextOptimalSlot();
console.log(`⏰ Próximo Pico de Audiência Identificado: ${nextSlot.dayLabel} às ${nextSlot.timeString}`);

async function tick() {
    try {
        const result = await processDuePosts();
        if (result.processedCount > 0) {
            console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ✓ Processados: ${result.processedCount} | Publicados: ${result.publishedCount} | Fila restante: ${result.queueLength}`);
        }
    } catch (err) {
        console.error(`[${new Date().toLocaleTimeString('pt-BR')}] Erro no agendador:`, err.message);
    }
}

// Executa imediatamente na inicialização
tick();

// Executa a cada 60 segundos
setInterval(tick, CHECK_INTERVAL_MS);
