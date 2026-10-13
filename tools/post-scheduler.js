import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { executeMultiPlatformPublish, formatSocialCaptions } from './social-publisher.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULE_FILE = path.join(DATA_DIR, 'scheduled-posts.json');

// Horários Nobres Preditivos de Pico de Engajamento para Games / Valorant
export const OPTIMAL_TIMES = {
    tiktok: ['11:30', '17:15', '20:45'],
    instagram: ['12:15', '18:40', '21:00'],
    blended: ['11:30', '12:15', '17:15', '18:40', '20:45', '21:00'],
};

function ensureDataFile() {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!existsSync(SCHEDULE_FILE)) {
        writeFileSync(SCHEDULE_FILE, JSON.stringify({ posts: [] }, null, 2), 'utf8');
    }
}

export function readScheduleQueue() {
    ensureDataFile();
    try {
        const raw = readFileSync(SCHEDULE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.posts) ? parsed.posts : [];
    } catch {
        return [];
    }
}

export function writeScheduleQueue(posts) {
    ensureDataFile();
    writeFileSync(SCHEDULE_FILE, JSON.stringify({ posts, lastUpdated: new Date().toISOString() }, null, 2), 'utf8');
}

/**
 * Calcula o próximo horário nobre disponível para publicação
 * @param {Date} [fromDate=new Date()]
 * @param {'tiktok'|'instagram'|'blended'} [platformPreference='blended']
 */
export function getNextOptimalSlot(fromDate = new Date(), platformPreference = 'blended') {
    const times = OPTIMAL_TIMES[platformPreference] || OPTIMAL_TIMES.blended;
    const now = new Date(fromDate);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    for (const timeStr of times) {
        const [h, m] = timeStr.split(':').map(Number);
        const slotTotalMin = h * 60 + m;

        // Se o horário ainda for acontecer hoje com pelo menos 5 minutos de folga
        if (slotTotalMin > currentTotalMin + 5) {
            const scheduledDate = new Date(now);
            scheduledDate.setHours(h, m, 0, 0);
            return {
                scheduledFor: scheduledDate.toISOString(),
                timeString: timeStr,
                dayLabel: 'Hoje',
                reason: `Pico de audiência no feed de Valorant às ${timeStr}`,
            };
        }
    }

    // Se todos os horários de hoje já passaram, agenda para o primeiro horário nobre de amanhã
    const firstTomorrow = times[0];
    const [th, tm] = firstTomorrow.split(':').map(Number);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(th, tm, 0, 0);

    return {
        scheduledFor: tomorrow.toISOString(),
        timeString: firstTomorrow,
        dayLabel: 'Amanhã',
        reason: `Pico de audiência matinal no feed de Valorant às ${firstTomorrow}`,
    };
}

/**
 * Agenda um vídeo para publicação no horário ideal
 */
export function schedulePost({
    title,
    description,
    videoUrl,
    videoPath,
    platforms = ['tiktok', 'instagram'],
    scheduledFor,
    useNextOptimal = false,
    deleteAfterPublish = true,
    tiktokHandle = '@Limbo',
    instagramHandle = '@limboinpink',
    niche = 'valorant',
}) {
    if (!title) throw new Error('O título do vídeo é obrigatório para o agendamento.');

    let targetTime = scheduledFor;
    let slotMeta = null;

    if (useNextOptimal || !targetTime) {
        slotMeta = getNextOptimalSlot(new Date());
        targetTime = slotMeta.scheduledFor;
    }

    const posts = readScheduleQueue();
    const newPost = {
        id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        scheduledFor: new Date(targetTime).toISOString(),
        timeLabel: slotMeta?.timeString || new Date(targetTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        title,
        description,
        platforms,
        videoUrl: videoUrl || '/generated/short-viral.mp4',
        videoPath: videoPath || (videoUrl ? path.join(process.cwd(), 'public', videoUrl.replace(/^\//, '')) : null),
        deleteAfterPublish: Boolean(deleteAfterPublish),
        tiktokHandle,
        instagramHandle,
        niche,
        status: 'SCHEDULED', // 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'
        deletedFiles: [],
        result: null,
        error: null,
    };

    posts.push(newPost);
    // Ordena do mais próximo para o mais distante
    posts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    writeScheduleQueue(posts);

    return newPost;
}

/**
 * Remove com segurança os arquivos locais após a publicação
 */
export function cleanupPostFiles(videoPath) {
    if (!videoPath) return [];
    const deleted = [];

    const candidates = [
        videoPath,
        `${videoPath}.srt`,
        `${videoPath}.ass`,
        videoPath.replace(/-short\.mp4$/, '-input.mp4'),
        videoPath.replace(/-short\.mp4$/, '-input.mov'),
    ];

    for (const filePath of candidates) {
        try {
            if (existsSync(filePath)) {
                unlinkSync(filePath);
                deleted.push(path.basename(filePath));
            }
        } catch (err) {
            console.error(`Erro ao excluir arquivo ${filePath}:`, err.message);
        }
    }

    return deleted;
}

/**
 * Processa posts vencidos na fila, publica nas APIs oficiais e exclui o arquivo local
 */
export async function processDuePosts({ forceAll = false } = {}) {
    const posts = readScheduleQueue();
    const now = new Date();
    let processedCount = 0;
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of posts) {
        if (post.status !== 'SCHEDULED') continue;

        const scheduledTime = new Date(post.scheduledFor);
        if (!forceAll && scheduledTime > now) continue;

        processedCount++;
        post.status = 'PUBLISHING';
        post.startedAt = new Date().toISOString();
        writeScheduleQueue(posts);

        try {
            // Executa a postagem nas plataformas selecionadas
            const publishResult = await executeMultiPlatformPublish({
                platforms: post.platforms,
                videoUrl: post.videoUrl.startsWith('http')
                    ? post.videoUrl
                    : `http://localhost:3000${post.videoUrl.startsWith('/') ? '' : '/'}${post.videoUrl}`,
                title: post.title,
                description: post.description,
                tiktokHandle: post.tiktokHandle,
                instagramHandle: post.instagramHandle,
                dryRun: false,
            });

            post.status = 'PUBLISHED';
            post.publishedAt = new Date().toISOString();
            post.result = publishResult.results;

            // EXCLUI O VÍDEO DO DISCO LOCAL LOGO EM SEGUIDA
            if (post.deleteAfterPublish && post.videoPath) {
                const deleted = cleanupPostFiles(post.videoPath);
                post.deletedFiles = deleted;
                post.storageFreed = true;
            }

            publishedCount++;
        } catch (err) {
            post.status = 'FAILED';
            post.error = err.message || 'Falha desconhecida no disparo agendado';
            failedCount++;
        }

        writeScheduleQueue(posts);
    }

    return {
        processedCount,
        publishedCount,
        failedCount,
        queueLength: posts.filter((p) => p.status === 'SCHEDULED').length,
    };
}

/**
 * Cancela um post agendado
 */
export function cancelScheduledPost(id) {
    const posts = readScheduleQueue();
    const target = posts.find((p) => p.id === id);
    if (!target) return null;
    target.status = 'CANCELLED';
    target.cancelledAt = new Date().toISOString();
    writeScheduleQueue(posts);
    return target;
}
