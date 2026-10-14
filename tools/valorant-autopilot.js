import path from 'node:path';
import { schedulePost, getNextOptimalSlot } from './post-scheduler.js';
import { calculateViralityScore } from './trend-hunter.js';

// =========================================================================
// MODELO DE MONETIZAÇÃO & PROJEÇÃO DE LUCRO (YOUTUBE, TIKTOK, INSTAGRAM)
// =========================================================================
export const MONETIZATION_RATES = {
    // RPM médio estimado em BRL (R$ por 1.000 visualizações qualificadas)
    youtubeShortsRpm: { min: 0.15, max: 0.45, avg: 0.30 },
    youtubeLongCompilationsRpm: { min: 12.00, max: 28.00, avg: 18.00 },
    tiktokCreatorRewardsRpm: { min: 2.20, max: 6.50, avg: 3.80 }, // vídeos qualificados > 1min
    tiktokShortFundRpm: { min: 0.08, max: 0.25, avg: 0.15 },      // vídeos < 1min
    
    // Afiliados Gamer (Amazon / Shopee / Kabum - Mouses, Teclados, Mousepads, Mangas)
    // Taxa de conversão: ~0.15% dos espectadores clicam, ticket médio R$ 280, comissão média 7% = R$ 19,60 por venda
    affiliateConversionPer100kViews: { clicks: 150, sales: 5, avgCommissionBrl: 19.60 },

    // Patrocínios Recorrentes (ExitLag, NoPing, Energy Drinks, Skins)
    // ExitLag paga ~US$ 3.00 (R$ 16,50) por assinatura ativa recorrente por mês
    exitlagCommissionBrl: 16.50,
};

/**
 * Calcula a projeção detalhada de receita mensal com base no volume de posts e visualizações
 * @param {Object} params
 * @param {number} params.postsPerDay - Quantidade de vídeos postados por dia (ex: 3 a 5)
 * @param {number} params.avgViewsPerVideo - Média estimada de views por vídeo (ex: 15.000 a 80.000)
 * @param {number} params.activeFollowers - Base de seguidores estimada
 * @param {boolean} params.createWeeklyLongVideo - Se o robô compila os cortes em 1 vídeo longo semanal no YouTube
 */
export function calculateEstimatedEarnings({
    postsPerDay = 3,
    avgViewsPerVideo = 25000,
    activeFollowers = 20000,
    createWeeklyLongVideo = true,
} = {}) {
    const daysInMonth = 30;
    const totalShortsPerMonth = postsPerDay * daysInMonth; // ex: 90 cortes/mês
    
    // Distribuição de views por rede (mesmo clipe postado nas 3 plataformas)
    const ytShortsMonthlyViews = totalShortsPerMonth * avgViewsPerVideo * 0.9;
    const ttMonthlyViews = totalShortsPerMonth * avgViewsPerVideo * 1.2;
    const igMonthlyViews = totalShortsPerMonth * avgViewsPerVideo * 0.8;
    const totalShortViews = ytShortsMonthlyViews + ttMonthlyViews + igMonthlyViews;

    // 1. Receita AdSense Direta (YouTube Shorts)
    const ytShortsEarnings = (ytShortsMonthlyViews / 1000) * MONETIZATION_RATES.youtubeShortsRpm.avg;

    // 2. Receita YouTube Vídeo Longo (Compilados semanais de 10 min gerados automaticamente)
    let ytLongMonthlyViews = 0;
    let ytLongEarnings = 0;
    if (createWeeklyLongVideo) {
        // 4 vídeos longos por mês com média de 30k a 80k views cada
        ytLongMonthlyViews = 4 * (avgViewsPerVideo * 1.8);
        ytLongEarnings = (ytLongMonthlyViews / 1000) * MONETIZATION_RATES.youtubeLongCompilationsRpm.avg;
    }

    // 3. Receita TikTok (Creator Rewards em vídeos >1min ou Fundo de Criadores)
    const ttEarnings = (ttMonthlyViews / 1000) * MONETIZATION_RATES.tiktokShortFundRpm.avg;

    // 4. Receita de Afiliados Gamer (Bio do Insta, TikTok e Descrição do YouTube)
    // Links de periféricos de pro players: "Mouse e mira do Aspas"
    const totalViewsInThousands = totalShortViews / 100000;
    const affiliateSales = Math.floor(totalViewsInThousands * MONETIZATION_RATES.affiliateConversionPer100kViews.sales);
    const affiliateEarnings = affiliateSales * MONETIZATION_RATES.affiliateConversionPer100kViews.avgCommissionBrl;

    // 5. Parcerias de Softwares Gamer (ExitLag / VPN Recorrente)
    // ~1 nova assinatura a cada 80.000 visualizações
    const exitlagSubscribers = Math.floor(totalShortViews / 80000);
    const exitlagRecurringEarnings = exitlagSubscribers * MONETIZATION_RATES.exitlagCommissionBrl;

    // 6. Publiposts / Parcerias Pagas no Instagram (a partir de 15k-30k seguidores)
    let instagramPublisEarnings = 0;
    if (activeFollowers >= 50000) {
        instagramPublisEarnings = 3500; // 2 publis de R$ 1.750
    } else if (activeFollowers >= 15000) {
        instagramPublisEarnings = 1200; // 2 publis menores de R$ 600
    }

    const totalEstimatedBrl = Math.round(
        ytShortsEarnings +
        ytLongEarnings +
        ttEarnings +
        affiliateEarnings +
        exitlagRecurringEarnings +
        instagramPublisEarnings
    );

    const totalEstimatedUsd = Math.round((totalEstimatedBrl / 5.50) * 10) / 10;

    return {
        inputs: { postsPerDay, avgViewsPerVideo, activeFollowers, totalShortsPerMonth },
        viewsBreakdown: {
            youtubeShorts: Math.round(ytShortsMonthlyViews),
            youtubeLongs: Math.round(ytLongMonthlyViews),
            tiktok: Math.round(ttMonthlyViews),
            instagram: Math.round(igMonthlyViews),
            totalMonthlyViews: Math.round(totalShortViews + ytLongMonthlyViews),
        },
        revenueBreakdownBrl: {
            youtubeShorts: Math.round(ytShortsEarnings),
            youtubeLongCompilations: Math.round(ytLongEarnings),
            tiktokDirect: Math.round(ttEarnings),
            affiliateCommissions: Math.round(affiliateEarnings),
            exitlagRecurring: Math.round(exitlagRecurringEarnings),
            instagramBrandDeals: Math.round(instagramPublisEarnings),
        },
        totals: {
            totalMonthlyBrl: totalEstimatedBrl,
            totalMonthlyUsd: totalEstimatedUsd,
            dailyAverageBrl: Math.round(totalEstimatedBrl / 30),
        },
    };
}

// =========================================================================
// ARQUÉTIPOS VIRAIS DE VALORANT PARA CORTE AUTOMÁTICO
// =========================================================================
export const VALORANT_VIRAL_ARCHETYPES = [
    {
        id: 'clutch-1v5',
        category: 'CLUTCH_TENSION',
        headline: '1 HP E CONTRA 5 NO SPIKE 💀',
        formula: 'Tensão Extrema / Sobrevivência Milagrosa',
        hookPrompt: '1 HP no relógio, spike plantado e 5 inimigos caçando. Todo mundo mandou salvar a Vandal, mas confia na mira!',
        targetDuration: 28,
        recommendedTags: ['#valorant', '#valorantbrasil', '#clutch', '#vct', '#ace', '#fyp'],
    },
    {
        id: 'lineup-proibida',
        category: 'HIGH_SAVES',
        headline: 'ESSA LINEUP NA ASCENT É PROIBIDA 🎯',
        formula: 'Segredo / Alto Índice de Salvamentos',
        hookPrompt: 'Essa lineup de Sova e Viper na Ascent é proibida em campeonatos oficiais. Alinha na quina e o round tá ganho!',
        targetDuration: 22,
        recommendedTags: ['#valorant', '#lineup', '#sova', '#viper', '#valorantdicas', '#reels'],
    },
    {
        id: 'aspas-crosshair',
        category: 'PRO_SECRETS',
        headline: 'A MIRA SECRETA DO ASPAS NO VALORANT 🔥',
        formula: 'Autoridade de Pro Player / Cópia Imediata',
        hookPrompt: 'Essa é a configuração exata de crosshair e sensibilidade que o Aspas usou pra cravar 42% de Headshot!',
        targetDuration: 30,
        recommendedTags: ['#valorant', '#aspas', '#crosshair', '#mira', '#vctbrasil', '#gamer'],
    },
    {
        id: 'rage-reyna',
        category: 'COMMENT_BAIT',
        headline: 'PARE DE JOGAR DE REYNA SE QUER SUBIR ⛔',
        formula: 'Controvérsia / Engajamento nos Comentários',
        hookPrompt: 'Você joga de Reyna e reclama que tá preso no Ouro? Duelista sem utilitário só afunda o time se você não matar 3!',
        targetDuration: 32,
        recommendedTags: ['#valorant', '#reyna', '#elobuddy', '#dicasvalorant', '#duo', '#tiktokbrasil'],
    },
    {
        id: 'vct-play',
        category: 'COMPETITIVE_HYPE',
        headline: 'A JOGADA MAIS GENIAL DO VCT BRASIL 👑',
        formula: 'Hype de Esports / Inspiração Competitiva',
        hookPrompt: 'Olha essa leitura tática perfeita pra dominar o bomb em 4 segundos e fechar o round decisivo!',
        targetDuration: 26,
        recommendedTags: ['#valorant', '#vct', '#vctbrasil', '#esports', '#loud', '#furia'],
    },
    {
        id: 'pistol-ghost-ace',
        category: 'PISTOL_GOD',
        headline: 'O ACE MAIS LIMPO DE GHOST NO PISTOL ROUND ⚡',
        formula: 'Precisão Cirúrgica / Começo Perfeito',
        hookPrompt: 'Round pistol de Ghost: 5 balas, 5 cabeças no bomb A. Quando a mira tá calibrada, o pistol tá ganho!',
        targetDuration: 24,
        recommendedTags: ['#valorant', '#ghost', '#pistolround', '#ace', '#headshot', '#radiante'],
    },
    {
        id: 'retake-operator',
        category: 'SNIPER_HYPE',
        headline: 'O RETAKE MAIS IMPOSSÍVEL DE OPERATOR 💥',
        formula: 'Tensão de Sniper / Flick Insano',
        hookPrompt: 'Sozinho no retake de Operator com o spike apitando a 10 segundos. Olha esses 3 flicks seguidos!',
        targetDuration: 29,
        recommendedTags: ['#valorant', '#operator', '#retake', '#flick', '#jett', '#valoranthighlights'],
    },
    {
        id: 'raze-ult-triple',
        category: 'EXPLOSIVE_MOMENT',
        headline: 'ESSA ULT DA RAZE DECIDIU A PARTIDA 🚀',
        formula: 'Momento Caótico / Satisfação Visual',
        hookPrompt: 'Entrada forçada no bomb e a Raze puxa a Estraga-Prazeres no ar. O estrago foi instantâneo!',
        targetDuration: 22,
        recommendedTags: ['#valorant', '#raze', '#showstopper', '#clipadas', '#gamesnotiktok'],
    },
    {
        id: 'defuse-002s',
        category: 'MILLIS_TENSION',
        headline: 'DEFUSOU A 0.02s DO SPIKE EXPLODIR 😱',
        formula: 'Infarto Gamer / Decisão no Limite',
        hookPrompt: 'Coração a 180 BPM: sobrou 1v1 no pós-plant e o defuse terminou a exatos 0.02 segundos!',
        targetDuration: 25,
        recommendedTags: ['#valorant', '#defuse', '#spike', '#clutchbrasil', '#valorantclips'],
    },
    {
        id: 'wallbang-ascent-b',
        category: 'WALLBANG_SECRET',
        headline: 'O WALLBANG SECRETO QUE ATRAVESSA A B NA ASCENT 🧱',
        formula: 'Truque Inédito / Vantagem Competitiva',
        hookPrompt: 'Se você mirar exatamente nessa tábua na B da Ascent de Odin ou Ares, você pega o cara sem ele ver!',
        targetDuration: 27,
        recommendedTags: ['#valorant', '#wallbang', '#ascent', '#odin', '#dicasgamer'],
    },
    {
        id: 'sheriff-headshot-flick',
        category: 'ECO_ROUND_MAGIC',
        headline: '3 HEADSHOTS DE SHERIFF NO ECO ROUND 🎯',
        formula: 'Virada Milagrosa / Custo Zero',
        hookPrompt: 'Round eco sem colete e uma Sheriff de 800 créditos: 3 headshots seguidos e o round foi roubado!',
        targetDuration: 21,
        recommendedTags: ['#valorant', '#sheriff', '#ecoround', '#headshots', '#gamerbrasil'],
    },
    {
        id: 'omen-tp-outplay',
        category: 'BRAIN_OUTPLAY',
        headline: 'TELEPORTE NAS COSTAS MAIS GENIAL DO JOGO 👻',
        formula: 'QI 200 / Enganação do Inimigo',
        hookPrompt: 'Barulho de defuse falso + teleporte do Omen na fumaça. Os inimigos procuraram pro lado errado!',
        targetDuration: 28,
        recommendedTags: ['#valorant', '#omen', '#outplay', '#qi200', '#valorantmemes'],
    },
];

/**
 * Extração de múltiplos cortes verticais de uma gameplay longa de Valorant (30 a 40 minutos)
 * Suporta entre 5 a 20 cortes por partida com distribuição temporal realista pelos rounds.
 * @param {Object} options
 * @param {string} options.sourceVideoUrl - URL ou caminho do arquivo da gameplay completa
 * @param {string} [options.agentName='Vandal'] - Agente principal da gameplay
 * @param {number} [options.cutsCount=10] - Quantidade de cortes verticais a extrair (ex: 10 a 20)
 * @param {number} [options.matchDurationMinutes=35] - Duração da partida (30 a 40 minutos)
 */
export function generateValorantBatchCuts({
    sourceVideoUrl = '/generated/gameplay-partida-completa.mp4',
    agentName = 'Jett',
    cutsCount = 10,
    matchDurationMinutes = 35,
} = {}) {
    const totalMatchSec = Math.max(1800, Math.min(2700, matchDurationMinutes * 60)); // 30 a 45 min
    const count = Math.min(20, Math.max(1, Number(cutsCount) || 10));
    const intervalSec = Math.floor(totalMatchSec / (count + 1));

    const cuts = [];
    for (let i = 0; i < count; i++) {
        const arch = VALORANT_VIRAL_ARCHETYPES[i % VALORANT_VIRAL_ARCHETYPES.length];
        const startSec = 60 + i * intervalSec;
        const endSec = startSec + arch.targetDuration;

        const viralityScore = calculateViralityScore({
            views: 45000 + (i % 5) * 12000,
            likes: 4200 + (i % 5) * 900,
            comments: 380 + (i % 5) * 60,
        });

        cuts.push({
            cutId: `val_${arch.id}_${Date.now()}_${i + 1}`,
            roundNumber: Math.min(24, Math.floor((startSec / totalMatchSec) * 24) + 1),
            title: arch.headline,
            category: arch.category,
            sourceVideoUrl,
            startSec,
            endSec,
            duration: arch.targetDuration,
            agentName,
            hookHeadline: arch.headline,
            transcript: arch.hookPrompt,
            tags: arch.recommendedTags,
            viralityScore,
            status: 'READY_TO_RENDER',
            settings: {
                verticalReframe: '9:16 (1080x1920) Lanczos',
                nvencPreset: 'p6 -tune hq -cq 19',
                popAssSubtitles: true,
                neonHighlightColor: '#FF1493',
                dynamicPunchInZoom: true,
                retentionProgressBar: true,
                ebuLoudnorm: '-14 LUFS',
            },
        });
    }

    return cuts;
}

/**
 * Fábrica Autônoma: Agenda múltiplos cortes de Valorant diretamente na esteira de postagem
 * distribuindo pelas melhores janelas de audiência gamer ao longo do dia (suporta 10 a 20 cortes/dia)
 */
export function scheduleValorantBatchFactory({
    cuts,
    platforms = ['tiktok', 'instagram', 'youtube'],
    tiktokHandle = '@limboinpink',
    instagramHandle = '@limboinpink',
    youtubeHandle = '@limboinpink',
    deleteAfterPublish = true,
}) {
    if (!Array.isArray(cuts) || cuts.length === 0) {
        throw new Error('Nenhum corte de Valorant fornecido para a fábrica de agendamento.');
    }

    const scheduledResults = [];
    let referenceDate = new Date();

    for (let i = 0; i < cuts.length; i++) {
        const cut = cuts[i];
        const nextSlot = getNextOptimalSlot(referenceDate);

        const scheduledJob = schedulePost({
            title: cut.hookHeadline || cut.title,
            description: `${cut.transcript}\n\n${cut.tags.join(' ')}`,
            videoUrl: cut.sourceVideoUrl,
            videoPath: null,
            platforms,
            scheduledFor: nextSlot.scheduledFor,
            deleteAfterPublish,
            tiktokHandle,
            instagramHandle,
            youtubeHandle,
            niche: 'valorant',
        });

        scheduledResults.push({
            cutId: cut.cutId,
            jobId: scheduledJob.id,
            headline: cut.hookHeadline,
            scheduledFor: nextSlot.scheduledFor,
            timeLabel: nextSlot.timeString,
            dayLabel: nextSlot.dayLabel,
            reason: nextSlot.reason,
            platforms,
        });

        // Avança 75 minutos para o próximo corte ser distribuído na próxima janela de pico do dia
        referenceDate = new Date(new Date(nextSlot.scheduledFor).getTime() + 75 * 60 * 1000);
    }

    return {
        ok: true,
        batchSize: scheduledResults.length,
        scheduledResults,
    };
}
