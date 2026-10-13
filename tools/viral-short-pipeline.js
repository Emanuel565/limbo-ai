#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const DEFAULT_MAX_CLIP_SECONDS = 60;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma4:9b';

export function resolveFfmpegBinary() {
    const explicit = process.env.FFMPEG_PATH || process.env.FFMPEG_BIN || process.env.FFMPEG;
    const candidates = [
        explicit,
        'ffmpeg',
        'C:/Program Files/ffmpeg/bin/ffmpeg.exe',
        'C:/Program Files/Gyan/ffmpeg/bin/ffmpeg.exe',
        'C:/Users/' + (process.env.USERNAME || 'Public') + '/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe',
        'C:/Users/' + (process.env.USERNAME || 'Public') + '/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe',
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (!candidate) continue;
        try {
            const { status } = spawnSync(candidate, ['-version'], { stdio: 'ignore' });
            if (status === 0) return candidate;
        } catch {
            // ignore and try next candidate
        }
    }

    return 'ffmpeg';
}

function toTimecode(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}

function formatTimestamp(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const ms = Math.floor((total - Math.floor(total)) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function normalizeSegment(segment, index) {
    const start = Number(segment?.start ?? 0);
    const end = Number(segment?.end ?? start);
    const text = String(segment?.text ?? '').trim();

    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
    }

    return {
        index,
        start,
        end,
        duration: end - start,
        text,
    };
}

function scoreSegment(segment) {
    const text = segment.text.toLowerCase();
    const keywords = [
        'secreto', 'mistério', 'surpresa', 'revelante', 'importante', 'você precisa',
        'agora', 'nunca', 'verdade', 'máximo', 'grave', 'alerta', 'melhor', 'ganho',
        'dica', 'passo', 'porque', 'por que', 'mais', 'você', 'não pode', 'simples'
    ];

    const keywordBoost = keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 4 : 0), 0);
    const punctuationBoost = (text.match(/!|\?/g) || []).length * 6;
    const lengthBoost = Math.min(20, text.length / 8);
    return keywordBoost + punctuationBoost + lengthBoost + segment.duration * 0.5;
}

export function selectBestClip(segments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS) {
    if (!Array.isArray(segments) || segments.length === 0) {
        throw new Error('Transcript segments are required to select a viral clip.');
    }

    const normalized = segments
        .map(normalizeSegment)
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

    if (normalized.length === 0) {
        throw new Error('No valid transcript segments were found.');
    }

    let best = {
        start: normalized[0].start,
        end: Math.min(normalized[0].end, normalized[0].start + maxSeconds),
        score: -Infinity,
        text: normalized[0].text,
        reason: 'Primeiro trecho disponível',
        title: 'Momento-chave do vídeo',
    };

    for (let index = 0; index < normalized.length; index += 1) {
        let windowStart = normalized[index].start;
        let windowText = '';
        let windowEnd = normalized[index].end;
        let totalScore = 0;

        for (let j = index; j < normalized.length; j += 1) {
            const segment = normalized[j];
            const candidateEnd = segment.end;
            const windowDuration = candidateEnd - windowStart;

            if (windowDuration > maxSeconds) {
                break;
            }

            windowEnd = candidateEnd;
            windowText += `${segment.text} `;
            totalScore += scoreSegment(segment);
        }

        const candidateStart = windowStart;
        const candidateEnd = Math.min(windowEnd, windowStart + maxSeconds);
        const duration = candidateEnd - candidateStart;

        if (duration <= 0) continue;

        const titleSeed = windowText.trim().replace(/\s+/g, ' ');
        const title = titleSeed.length > 0
            ? titleSeed.split(' ').slice(0, 10).join(' ') + (titleSeed.split(' ').length > 10 ? '...' : '')
            : 'Momento chave do vídeo';

        const reason = titleSeed.length > 0 ? titleSeed.slice(0, 120) : 'Trecho forte para retenção';

        if (totalScore > best.score) {
            best = {
                start: candidateStart,
                end: candidateEnd,
                score: totalScore,
                text: windowText.trim(),
                reason,
                title: title.length > 60 ? title.slice(0, 57).trim() + '...' : title,
            };
        }
    }

    const description = `🔥 ${best.title}\n\n📌 Melhor corte do vídeo para YouTube Shorts e Instagram Reels.\n#shorts #reels #videoeditor #viralcontent #marketingdigital`;

    return {
        start: Math.round(best.start),
        end: Math.round(best.end),
        duration: Math.max(1, Math.round(best.end - best.start)),
        title: best.title || 'Momento chave do vídeo',
        description,
        hashtags: ['#shorts', '#reels', '#viralcontent', '#marketingdigital'],
        reason: best.reason,
        transcript: best.text,
    };
}

// Cadeia de áudio "voz de podcast": corta graves inúteis, reduz ruído, comprime e normaliza para -14 LUFS (padrão TikTok/Shorts/Reels)
export const VIRAL_AUDIO_CHAIN = 'highpass=f=80,afftdn=nf=-25,acompressor=threshold=-18dB:ratio=3:attack=5:release=60:makeup=2,loudnorm=I=-14:LRA=7:TP=-1.5';

function sanitizeDrawtext(text) {
    return String(text).replace(/['":\\%,;]/g, ' ').replace(/\s+/g, ' ').slice(0, 50).trim();
}

/**
 * Monta os argumentos do FFmpeg como ARRAY (sem shell), evitando quebra com espaços em caminhos e textos.
 * @param {Object} params
 * @param {string} params.inputPath
 * @param {string} params.outputPath
 * @param {number} params.start
 * @param {number} params.duration
 * @param {boolean} [params.useNvenc]
 * @param {string|null} [params.subtitlePath] Caminho do .ass (de preferência relativo ao cwd do processo)
 * @param {string|null} [params.hookHeadline] Usado via drawtext somente quando não há .ass (o .ass já desenha a tarja)
 * @param {boolean} [params.normalizeAudio]
 * @param {boolean} [params.progressBar]
 * @param {boolean} [params.dynamicZoom] Alterna enquadramento entre normal e punch-in (1.15x) a cada 4.5s
 */
export function buildFfmpegArgs({
    inputPath,
    outputPath,
    start,
    duration,
    useNvenc = true,
    subtitlePath = null,
    hookHeadline = null,
    normalizeAudio = false,
    progressBar = true,
    dynamicZoom = true,
}) {
    const safeDuration = Math.max(1, Number(duration) || 1);

    const filters = [
        'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos',
    ];

    if (dynamicZoom) {
        // Pattern Interrupt: alternância rítmica a cada 4.5s entre plano geral (1.0x) e punch-in de foco (1.15x)
        filters.push("crop='w=if(between(mod(t,9),4.5,9),1080*0.87,1080):h=if(between(mod(t,9),4.5,9),1920*0.87,1920):x=(iw-ow)/2:y=(ih-oh)/2'");
        filters.push('scale=1080:1920:flags=lanczos');
    } else {
        filters.push('crop=1080:1920:(iw-1080)/2:(ih-1920)/2');
    }

    filters.push('setsar=1');
    filters.push('fps=30');

    if (hookHeadline && !subtitlePath) {
        filters.push('drawbox=y=140:color=black@0.65:width=iw:height=130:t=fill');
        filters.push(`drawtext=text='${sanitizeDrawtext(hookHeadline)}':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=180`);
    }

    if (subtitlePath) {
        const cleanPath = String(subtitlePath).replace(/\\/g, '/').replace(/:/g, '\\:');
        filters.push(`ass='${cleanPath}'`);
    }

    if (progressBar) {
        // Barra de progresso rosa #FF1493 no rodapé: aumenta a retenção (o espectador vê que falta pouco)
        filters.push(`drawbox=x=0:y=ih-14:w='iw*t/${safeDuration}':h=14:color=0xFF1493@0.95:t=fill`);
    }

    const videoCodecArgs = useNvenc
        ? ['-c:v', 'h264_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '19',
            '-b:v', '10M', '-maxrate', '16M', '-bufsize', '20M', '-profile:v', 'high', '-g', '60']
        : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-g', '60'];

    const args = [
        '-y',
        '-ss', String(start),
        '-i', String(inputPath),
        '-t', String(safeDuration),
        '-vf', filters.join(','),
        ...videoCodecArgs,
        '-pix_fmt', 'yuv420p',
    ];

    if (normalizeAudio) {
        args.push('-af', VIRAL_AUDIO_CHAIN);
    }

    args.push(
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        '-movflags', '+faststart',
        String(outputPath),
    );

    return args;
}

/** Versão legível (apenas para exibição/log). Para executar, use buildFfmpegArgs. */
export function buildFfmpegCommand(params) {
    const quote = (arg) => (/[\s'"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);
    return ['ffmpeg', ...buildFfmpegArgs(params).map(quote)].join(' ');
}

export function formatAssTimestamp(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const centis = Math.floor((total - Math.floor(total)) * 100);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

const EMPHASIS_WORDS = new Set([
    'nunca', 'sempre', 'segredo', 'secreto', 'verdade', 'agora', 'dinheiro', 'grátis', 'erro', 'pare',
    'ninguém', 'todos', 'milhões', 'mil', 'rápido', 'simples', 'importante', 'cuidado', 'tudo', 'muda',
]);

export const VIRAL_EMOJI_MAP = {
    dinheiro: '💰',
    grátis: '🎁',
    lucro: '💰',
    segredo: '🤫',
    secreto: '🤫',
    revelação: '🤫',
    agora: '⏱️',
    rápido: '⚡',
    erro: '❌',
    pare: '🛑',
    nunca: '🛑',
    cuidado: '⚠️',
    atenção: '⚠️',
    alerta: '⚠️',
    verdade: '💡',
    importante: '💎',
    tudo: '🔥',
    muda: '🚀',
    milhões: '📈',
    mil: '💸',
};

function isEmphasisWord(word) {
    const clean = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    return EMPHASIS_WORDS.has(clean) || /[!?]/.test(word) || /\d/.test(word) || clean.length >= 9;
}

function escapeAssText(text) {
    return String(text).replace(/[{}]/g, '').replace(/\\/g, '');
}

/**
 * Converte um segmento em palavras com tempo. Usa `segment.words` (timestamps reais do Whisper) quando existir;
 * caso contrário, distribui o tempo do segmento proporcionalmente ao tamanho de cada palavra.
 */
export function toTimedWords(segment) {
    if (Array.isArray(segment.words) && segment.words.length) {
        return segment.words
            .map((w) => ({ word: String(w.word ?? w.text ?? '').trim(), start: Number(w.start), end: Number(w.end) }))
            .filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start);
    }

    const words = segment.text.split(/\s+/).filter(Boolean);
    const weights = words.map((w) => Math.max(2, w.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let cursor = segment.start;
    return words.map((word, i) => {
        const span = (segment.duration * weights[i]) / totalWeight;
        const item = { word, start: cursor, end: cursor + span };
        cursor += span;
        return item;
    });
}

/**
 * Gera legendas .ass estilo TikTok: blocos de 2–3 palavras, animação "pop", palavra de ênfase em rosa #FF1493
 * e tarja de gancho fixa no topo. Tempos são deslocados para a linha do tempo do corte (clipStart → 0).
 */
export function buildAssSubtitle(segments, {
    maxSeconds = DEFAULT_MAX_CLIP_SECONDS,
    hookTitle = 'VIRAL SHORT',
    clipStart = 0,
    hookHeadline = null,
    wordsPerChunk = 3,
    autoEmojis = true,
} = {}) {
    const normalized = segments
        .map((segment, index) => normalizeSegment(segment, index))
        .filter(Boolean)
        .slice(0, 200)
        .sort((a, b) => a.start - b.start);

    const header = `[Script Info]
Title: ${escapeAssText(hookTitle)}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ViralHormozi,Montserrat Black,88,&H00FFFFFF,&H009314FF,&H00000000,&H96000000,-1,0,0,0,100,100,1,0,1,7,3,2,60,60,560,1
Style: HookBanner,Montserrat Black,62,&H00FFFFFF,&H00FFFFFF,&H009314FF,&H009314FF,-1,0,0,0,100,100,1,0,3,18,0,8,70,70,190,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = [];
    const clipEnd = clipStart + maxSeconds;

    if (hookHeadline) {
        const headline = escapeAssText(hookHeadline).toUpperCase().slice(0, 60);
        events.push(`Dialogue: 1,${formatAssTimestamp(0)},${formatAssTimestamp(maxSeconds)},HookBanner,,0,0,0,,{\\fad(150,0)}${headline}`);
    }

    for (const segment of normalized) {
        if (segment.end <= clipStart || segment.start >= clipEnd) continue;

        const timed = toTimedWords(segment).filter((w) => w.end > clipStart && w.start < clipEnd);
        for (let i = 0; i < timed.length; i += wordsPerChunk) {
            const chunk = timed.slice(i, i + wordsPerChunk);
            const start = Math.max(0, chunk[0].start - clipStart);
            const end = Math.min(maxSeconds, chunk[chunk.length - 1].end - clipStart);
            if (end <= start) continue;

            const text = chunk
                .map(({ word }) => {
                    const safe = escapeAssText(word).toUpperCase();
                    const clean = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
                    const emoji = autoEmojis && VIRAL_EMOJI_MAP[clean] ? `${VIRAL_EMOJI_MAP[clean]} ` : '';
                    return isEmphasisWord(word) ? `{\\c&H009314FF&}${emoji}${safe}{\\c&H00FFFFFF&}` : safe;
                })
                .join(' ');

            // Pop: entra a 80%, estoura para 108% e assenta em 100%
            const pop = '{\\fscx80\\fscy80\\t(0,90,\\fscx108\\fscy108)\\t(90,160,\\fscx100\\fscy100)}';
            events.push(`Dialogue: 0,${formatAssTimestamp(start)},${formatAssTimestamp(end)},ViralHormozi,,0,0,0,,${pop}${text}`);
        }
    }

    return header + events.join('\n') + '\n';
}

export function buildSubtitle(segments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS, clipStart = 0) {
    const clipEnd = clipStart + maxSeconds;
    const normalized = segments
        .map((segment, index) => normalizeSegment(segment, index))
        .filter(Boolean)
        .filter((segment) => segment.end > clipStart && segment.start < clipEnd)
        .slice(0, 200)
        .sort((a, b) => a.start - b.start);

    if (!normalized.length) return '';

    const lines = normalized.map((segment, index) => {
        const start = Math.max(0, segment.start - clipStart);
        const end = Math.min(maxSeconds, segment.end - clipStart);
        return [
            String(index + 1),
            `${formatTimestamp(start)} --> ${formatTimestamp(end)}`,
            segment.text,
            '',
        ].join('\n');
    });

    return lines.join('\n');
}


export async function getLocalOllamaCutPlan(transcriptSegments, { model = DEFAULT_MODEL, url = process.env.OLLAMA_BASE_URL || 'http://localhost:11434' } = {}) {
    const apiUrl = new URL('/api/chat', url.endsWith('/v1') ? url.replace(/\/v1$/, '') : url).toString();
    const transcript = transcriptSegments
        .map((segment) => `[${segment.start}s-${segment.end}s] ${segment.text}`)
        .join('\n');

    const payload = {
        model,
        stream: false,
        messages: [
            {
                role: 'user',
                content: `Você é um editor profissional de vídeos para YouTube Shorts e Instagram Reels. Identifique o melhor trecho com duração máxima de 60 segundos.

Retorne somente JSON válido com as chaves:
{
  "start": 0,
  "end": 30,
  "title": "título vibrante",
  "description": "descrição com hashtags"
}

Transcrição:
${transcript}`,
            },
        ],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed with status ${response.status}`);
        }

        const data = await response.json();
        const raw = data?.message?.content || data?.content || '';
        const jsonText = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.warn('Falling back to local heuristic selection because Ollama is unavailable:', error.message);
        return selectBestClip(transcriptSegments, DEFAULT_MAX_CLIP_SECONDS);
    }
}

/**
 * @param {Object} params
 * @param {string} params.inputPath
 * @param {string} params.outputPath
 * @param {Array<any>} params.transcriptSegments
 * @param {number} [params.maxSeconds]
 * @param {string|null} [params.subtitlePath] .ass a ser queimado (relativo ao cwd do FFmpeg)
 * @param {string|null} [params.hookHeadline]
 * @param {boolean} [params.normalizeAudio]
 * @param {boolean} [params.useNvenc]
 * @param {boolean} [params.progressBar]
 * @param {boolean} [params.dynamicZoom]
 * @param {boolean} [params.autoEmojis]
 */
export function createClip({
    inputPath,
    outputPath,
    transcriptSegments,
    maxSeconds = DEFAULT_MAX_CLIP_SECONDS,
    subtitlePath = null,
    hookHeadline = null,
    normalizeAudio = false,
    useNvenc = true,
    progressBar = true,
    dynamicZoom = true,
    autoEmojis = true,
}) {
    const plan = selectBestClip(transcriptSegments, maxSeconds);
    const resolvedHookHeadline = hookHeadline || plan.title;

    const ffmpegParams = {
        inputPath,
        outputPath,
        start: plan.start,
        duration: plan.duration,
        subtitlePath,
        hookHeadline: resolvedHookHeadline,
        normalizeAudio,
        useNvenc,
        progressBar,
        dynamicZoom,
    };

    // Legendas na linha do tempo do CORTE (o trecho começa em plan.start no vídeo original)
    const subtitle = buildSubtitle(transcriptSegments, plan.duration, plan.start);
    const assSubtitle = buildAssSubtitle(transcriptSegments, {
        maxSeconds: plan.duration,
        clipStart: plan.start,
        hookTitle: plan.title,
        hookHeadline: resolvedHookHeadline,
        autoEmojis,
    });

    return {
        ...plan,
        hookHeadline: resolvedHookHeadline,
        subtitle,
        assSubtitle,
        ffmpegArgs: buildFfmpegArgs(ffmpegParams),
        ffmpegCommand: buildFfmpegCommand(ffmpegParams),
    };
}

/**
 * Executa o FFmpeg com os args do plano. Rodar com `cwd` = pasta de saída permite passar o .ass por nome
 * de arquivo, evitando o escape de "C:" no filtro ass do Windows.
 * @param {{ ffmpegArgs: string[] }} plan
 * @param {{ cwd?: string }} [options]
 */
export function renderClip(plan, { cwd } = {}) {
    const ffmpeg = spawnSync(resolveFfmpegBinary(), plan.ffmpegArgs, {
        cwd,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
    });

    if (ffmpeg.status !== 0) {
        const tail = String(ffmpeg.stderr || ffmpeg.error?.message || '').split('\n').slice(-12).join('\n');
        throw new Error(`FFmpeg falhou (status ${ffmpeg.status}):\n${tail}`);
    }

    return plan;
}

export function runClipPipeline({ inputPath, outputPath, transcriptSegments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS }) {
    const plan = createClip({ inputPath, outputPath, transcriptSegments, maxSeconds });
    return renderClip(plan);
}

if (process.argv[1] && process.argv[1].endsWith('viral-short-pipeline.js')) {
    const inputPath = process.argv[2] || 'video.mp4';
    const outputPath = process.argv[3] || 'short-viral.mp4';
    const segments = [
        { start: 0, end: 10, text: 'Olá, aqui está a informação mais importante que você precisa saber agora.' },
        { start: 15, end: 28, text: 'Você precisa ver isso porque isso vai mudar completamente sua estratégia.' },
        { start: 30, end: 42, text: 'Este é o momento crucial para aplicar a dica e acelerar os resultados.' },
    ];

    const result = createClip({ inputPath, outputPath, transcriptSegments: segments, maxSeconds: 60 });
    console.log(JSON.stringify(result, null, 2));
}
