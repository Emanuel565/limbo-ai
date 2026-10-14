import { google } from 'googleapis';
import {
    fetchYouTubeTrendingGhost,
    fetchTikTokTrendingGhost,
    fetchInstagramReelsGhost,
    getGhostEngineStats,
} from './ghost-engine.js';

export {
    fetchYouTubeTrendingGhost,
    fetchTikTokTrendingGhost,
    fetchInstagramReelsGhost,
    getGhostEngineStats,
};

export function parseIsoDuration(isoDuration) {
    if (!isoDuration) return 0;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return 0;
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function calculateViralityScore({ views = 0, likes = 0, comments = 0 }) {
    const v = Number(views) || 0;
    const l = Number(likes) || 0;
    const c = Number(comments) || 0;

    if (v === 0) return 0;

    // Taxa de engajamento base (likes + comentários ponderados)
    const engagementRate = ((l + c * 2.5) / v) * 100;
    
    // Fator de escala logarítmica de visualizações (1k views até 1M+ views)
    const viewScale = Math.min(50, Math.log10(Math.max(10, v)) * 10);
    
    // Pontuação final normalizada de 0 a 100
    const rawScore = engagementRate * 8 + viewScale;
    return Math.min(99.9, Math.max(10, Math.round(rawScore * 10) / 10));
}

export async function fetchTopTrendingGlobal({
    regionCode = 'BR',
    maxResults = 8,
    apiKey = process.env.YOUTUBE_API_KEY,
    useGhostEngine = false,
} = {}) {
    if (useGhostEngine || (!apiKey && process.env.USE_GHOST_ENGINE === 'true')) {
        console.log(`[TrendHunter] 👻 Roteando para GhostEngine v2 (Zero API Key, Region: ${regionCode})...`);
        return await fetchYouTubeTrendingGhost({ regionCode, maxResults });
    }

    if (!apiKey) {
        throw new Error('YOUTUBE_API_KEY não configurada no ambiente.');
    }

    const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
    });

    // 1. Busca os vídeos mais populares (Top Trending Charts) da região
    const response = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        chart: 'mostPopular',
        regionCode,
        maxResults: Math.min(25, maxResults * 2),
    });

    const detailedItems = response.data.items || [];

    const candidates = detailedItems
        .map((video) => {
            const stats = video.statistics || {};
            const snippet = video.snippet || {};
            const contentDetails = video.contentDetails || {};

            const views = Number(stats.viewCount || 0);
            const likes = Number(stats.likeCount || 0);
            const comments = Number(stats.commentCount || 0);
            const durationSeconds = parseIsoDuration(contentDetails.duration);

            const engagementRate = views > 0
                ? Math.round(((likes + comments * 2) / views) * 10000) / 100
                : 0;

            const viralityScore = calculateViralityScore({ views, likes, comments });

            return {
                id: video.id,
                title: snippet.title || 'Sem título',
                channelTitle: snippet.channelTitle || 'Canal Desconhecido',
                publishedAt: snippet.publishedAt,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
                views,
                likes,
                comments,
                durationSeconds,
                durationFormatted: formatDuration(durationSeconds),
                engagementRate,
                viralityScore,
                url: `https://www.youtube.com/watch?v=${video.id}`,
            };
        })
        .filter((v) => v.durationSeconds >= 30)
        .sort((a, b) => b.viralityScore - a.viralityScore)
        .slice(0, maxResults);

    return candidates;
}

export async function searchYoutubeTrends({
    query = 'podcast tecnologia',
    maxResults = 8,
    apiKey = process.env.YOUTUBE_API_KEY,
} = {}) {
    if (!apiKey) {
        throw new Error('YOUTUBE_API_KEY não configurada no ambiente.');
    }

    const youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
    });

    // 1. Busca vídeos ordenados por relevância e visualizações para o nicho
    const searchResponse = await youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        order: 'viewCount',
        maxResults: Math.min(25, maxResults * 2), // busca mais para filtrar vídeos muito curtos
    });

    const items = searchResponse.data.items || [];
    const videoIds = items.map((item) => item.id?.videoId).filter(Boolean);

    if (videoIds.length === 0) {
        return [];
    }

    // 2. Extrai métricas detalhadas (views, likes, comentários, duração)
    const videoDetailsResponse = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
    });

    const detailedItems = videoDetailsResponse.data.items || [];

    const candidates = detailedItems
        .map((video) => {
            const stats = video.statistics || {};
            const snippet = video.snippet || {};
            const contentDetails = video.contentDetails || {};

            const views = Number(stats.viewCount || 0);
            const likes = Number(stats.likeCount || 0);
            const comments = Number(stats.commentCount || 0);
            const durationSeconds = parseIsoDuration(contentDetails.duration);

            const engagementRate = views > 0
                ? Math.round(((likes + comments * 2) / views) * 10000) / 100
                : 0;

            const viralityScore = calculateViralityScore({ views, likes, comments });

            return {
                id: video.id,
                title: snippet.title || 'Sem título',
                channelTitle: snippet.channelTitle || 'Canal Desconhecido',
                publishedAt: snippet.publishedAt,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
                views,
                likes,
                comments,
                durationSeconds,
                durationFormatted: formatDuration(durationSeconds),
                engagementRate,
                viralityScore,
                url: `https://www.youtube.com/watch?v=${video.id}`,
            };
        })
        // Filtra vídeos muito curtos (< 30s) para garantir que há conteúdo para corte
        .filter((v) => v.durationSeconds >= 30)
        // Ordena por viralityScore decrescente
        .sort((a, b) => b.viralityScore - a.viralityScore)
        .slice(0, maxResults);

    return candidates;
}

export async function selectViralVideoWithOllama(candidates, {
    niche = 'conteúdo geral',
    model = process.env.OLLAMA_MODEL || 'llama3.1:8b',
    ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
} = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('Nenhum vídeo fornecido para análise do Ollama.');
    }

    const compactList = candidates.map((v) => ({
        id: v.id,
        titulo: v.title,
        canal: v.channelTitle,
        views: v.views,
        likes: v.likes,
        comentarios: v.comments,
        taxa_engajamento_pct: v.engagementRate,
        score_viral: v.viralityScore,
        duracao: v.durationFormatted,
        url: v.url,
    }));

    const cleanBaseUrl = ollamaUrl.endsWith('/v1') ? ollamaUrl.replace(/\/v1$/, '') : ollamaUrl;
    const apiUrl = `${cleanBaseUrl}/api/chat`;

    const prompt = `Você é o estrategista-chefe de conteúdo viral e especialista em retenção para TikTok (#fyp), YouTube Shorts e Instagram Reels.
Analise os ${candidates.length} vídeos abaixo sobre o nicho "${niche}". Identifique qual deles possui o MAIOR POTENCIAL VIRAL para extrair cortes curtos de até 60 segundos com alto impacto emocional, quebra de padrão ou valor explosivo.

Lista de candidatos com métricas reais:
${JSON.stringify(compactList, null, 2)}

Responda ESTRITAMENTE em formato JSON válido, sem texto adicional, com a seguinte estrutura:
{
  "videoId": "ID do vídeo escolhido",
  "url": "URL completa do vídeo",
  "title": "Título do vídeo",
  "viralScore": 95,
  "curiosityGapScore": 92,
  "patternInterruptScore": 88,
  "emotionalResonance": 90,
  "shareabilityFactor": 94,
  "viralHookFormula": "Gatilho Contraintuitivo / Quebra de Expectativa",
  "suggestedHeadline": "O SEGREDO QUE NINGUÉM TE CONTOU",
  "hookAnalysis": "Explicação de por que este tema prende a atenção nos primeiros 3 segundos",
  "whyViral": "Justificativa detalhada cruzando engajamento alto, audiência e apelo do assunto",
  "recommendedClipAngle": "Instrução para o editor de qual trecho/assunto focar no corte de 60s"
}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                stream: false,
                format: 'json',
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Falha no Ollama (status ${response.status})`);
        }

        const data = await response.json();
        const content = data?.message?.content || data?.content || '';
        const parsed = JSON.parse(content);

        // Valida se o ID escolhido existe na lista
        const matched = candidates.find((c) => c.id === parsed.videoId) || candidates[0];

        return {
            ...parsed,
            videoId: matched.id,
            url: matched.url,
            title: matched.title,
            channelTitle: matched.channelTitle,
            thumbnail: matched.thumbnail,
            curiosityGapScore: Number(parsed.curiosityGapScore) || 88,
            patternInterruptScore: Number(parsed.patternInterruptScore) || 85,
            emotionalResonance: Number(parsed.emotionalResonance) || 90,
            shareabilityFactor: Number(parsed.shareabilityFactor) || 92,
            viralHookFormula: parsed.viralHookFormula || "Quebra de Padrão & Revelação",
            suggestedHeadline: parsed.suggestedHeadline || "REVELAÇÃO QUE MUDA TUDO",
            modelUsed: model,
            isAiSelected: true,
        };
    } catch (error) {
        console.warn('Ollama offline ou indisponível, usando seleção heurística inteligente:', error.message);
        
        // Fallback heurístico inteligente
        const top = candidates[0];
        return {
            videoId: top.id,
            url: top.url,
            title: top.title,
            channelTitle: top.channelTitle,
            thumbnail: top.thumbnail,
            viralScore: top.viralityScore,
            curiosityGapScore: Math.min(98, Math.round(top.viralityScore * 0.95)),
            patternInterruptScore: Math.min(96, Math.round(top.viralityScore * 0.92)),
            emotionalResonance: Math.min(99, Math.round(top.viralityScore * 0.94)),
            shareabilityFactor: Math.min(97, Math.round(top.viralityScore * 0.96)),
            viralHookFormula: "Quebra de Padrão & Curiosidade Contraintuitiva",
            suggestedHeadline: "ISSO MUDA SEU JOGO AGORA",
            hookAnalysis: `Alta densidade de engajamento com ${top.likes.toLocaleString()} likes e taxa de ${top.engagementRate}% em relação a ${top.views.toLocaleString()} views.`,
            whyViral: `Este conteúdo gerou mais interesse relativo no nicho de "${niche}", indicando forte ressonância emocional e gatilhos de retenção ideais para TikTok e Shorts.`,
            recommendedClipAngle: 'Identificar o ápice do raciocínio ou revelação contraintuitiva no primeiro terço do vídeo.',
            modelUsed: 'heuristic-fallback',
            isAiSelected: false,
        };
    }
}
