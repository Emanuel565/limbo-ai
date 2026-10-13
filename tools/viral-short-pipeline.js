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

export function buildFfmpegCommand({ inputPath, outputPath, start, duration, useNvenc = true }) {
    const videoCodecArgs = useNvenc
        ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '22', '-b:v', '6M']
        : ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'];

    const command = [
        'ffmpeg', '-y',
        '-ss', String(start),
        '-i', String(inputPath),
        '-t', String(duration),
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)/2:(ih-1920)/2',
        ...videoCodecArgs,
        '-c:a', 'aac',
        '-b:a', '128k',
        String(outputPath),
    ];

    return command.join(' ');
}


export function buildSubtitle(segments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS) {
    const normalized = segments
        .map((segment, index) => normalizeSegment(segment, index))
        .filter(Boolean)
        .slice(0, 100)
        .sort((a, b) => a.start - b.start);

    if (!normalized.length) return '';

    const lines = normalized.map((segment, index) => {
        const start = Math.min(segment.start, maxSeconds);
        const end = Math.min(segment.end, maxSeconds + 1);
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

export function createClip({ inputPath, outputPath, transcriptSegments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS }) {
    const plan = selectBestClip(transcriptSegments, maxSeconds);
    const cmd = buildFfmpegCommand({
        inputPath,
        outputPath,
        start: plan.start,
        duration: plan.duration,
    });

    const subtitle = buildSubtitle(transcriptSegments, maxSeconds);

    const result = {
        ...plan,
        subtitle,
        ffmpegCommand: cmd,
    };

    return result;
}

export function runClipPipeline({ inputPath, outputPath, transcriptSegments, maxSeconds = DEFAULT_MAX_CLIP_SECONDS }) {
    const plan = createClip({ inputPath, outputPath, transcriptSegments, maxSeconds });
    const ffmpegPath = resolveFfmpegBinary();
    const ffmpegArgs = plan.ffmpegCommand.split(' ').slice(1);
    const ffmpeg = spawnSync(ffmpegPath, ffmpegArgs, {
        stdio: 'inherit',
        shell: false,
    });

    if (ffmpeg.status !== 0) {
        throw new Error(`FFmpeg failed with status ${ffmpeg.status}`);
    }

    return plan;
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
