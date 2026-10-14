import { execSync } from 'node:child_process';
import path from 'node:path';

const video = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';

export function inspectTimestampGameplayActive(filePath, sec) {
    try {
        const cmd = `ffmpeg -ss ${sec} -i "${filePath}" -vframes 1 -vf "crop=300:300:20:20,signalstats,metadata=print" -f null - 2>&1`;
        const out = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
        const yavg = parseFloat((out.match(/lavfi\.signalstats\.YAVG=([0-9.]+)/) || [])[1] || '0');
        const huemed = parseFloat((out.match(/lavfi\.signalstats\.HUEMED=([0-9.]+)/) || [])[1] || '0');
        const ylow = parseFloat((out.match(/lavfi\.signalstats\.YLOW=([0-9.]+)/) || [])[1] || '0');

        // Scoreboard ou Lobby têm radar escuro (YAVG < 68) e HUEMED na faixa roxa escura (>= 300 ou <= 20)
        const isMenu = yavg < 68 && (huemed >= 300 || huemed <= 20);
        const isGameplay = !isMenu && yavg >= 70;

        return { sec, isGameplay, isMenu, yavg, huemed, ylow };
    } catch {
        return { sec, isGameplay: true, isMenu: false };
    }
}

export function findActiveGameplayWindows(filePath, { cutsCount = 24, totalDurationSec = 7680 } = {}) {
    const count = Math.min(30, Math.max(3, Number(cutsCount) || 24));
    const effectiveDuration = Math.max(600, totalDurationSec - 240);
    const intervalSec = Math.floor(effectiveDuration / (count + 1));
    const verifiedTimestamps = [];

    console.log(`[Finder] Buscando ${count} janelas 100% ativas em vídeo de ${Math.round(totalDurationSec/60)} minutos...`);

    for (let i = 0; i < count; i++) {
        let candidateSec = Math.max(60, Math.floor(100 + (i * intervalSec)));
        let attempts = 0;
        let isWindowActive = false;

        while (attempts < 5 && !isWindowActive) {
            const checkStart = inspectTimestampGameplayActive(filePath, candidateSec + 2);
            const checkMid = inspectTimestampGameplayActive(filePath, candidateSec + 12);

            if (checkStart.isGameplay && checkMid.isGameplay) {
                isWindowActive = true;
            } else {
                // Caiu em placar ou menu! Desloca +45 segundos para a próxima rodada
                console.log(`⚠️ Timestamp ${candidateSec}s detectado como ${checkStart.isMenu ? 'PLACAR/MENU' : 'INATIVO'}. Deslocando +45s...`);
                candidateSec += 45;
                attempts++;
            }
        }

        verifiedTimestamps.push(candidateSec);
    }

    return verifiedTimestamps;
}

const t0 = Date.now();
const windows = findActiveGameplayWindows(video, { cutsCount: 8, totalDurationSec: 7680 });
console.log(`Concluído em ${Date.now() - t0}ms. Janelas aprovadas:`, windows);
