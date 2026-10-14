/**
 * Calcula os segmentos de velocidade para um clipe de Highlight de Valorant
 * Regra: Qualquer intervalo maior que 8 segundos entre dois abates consecutivos é acelerado em 3x.
 * Preserva +1.5s após o abate (som/animação da kill) e -2.5s antes do próximo (peek/mira) em 1x.
 */
export function calculateSpeedSegments(highlight, {
    minDeadTimeSec = 8,
    postKillNormalSec = 1.5,
    preKillNormalSec = 2.5,
    fastForwardSpeed = 3,
} = {}) {
    if (!highlight || !Number.isFinite(highlight.startSec) || !Number.isFinite(highlight.endSec)) {
        return [];
    }

    const startSec = Number(highlight.startSec);
    const endSec = Number(highlight.endSec);
    const kills = Array.isArray(highlight.killTimes)
        ? [...highlight.killTimes].map(Number).filter(Number.isFinite).sort((a, b) => a - b)
        : [];

    if (kills.length < 2) {
        return [{
            start: startSec,
            end: endSec,
            duration: Number((endSec - startSec).toFixed(2)),
            speed: 1,
            isFastForward: false,
        }];
    }

    const segments = [];
    let cursor = startSec;

    for (let i = 0; i < kills.length - 1; i++) {
        const killA = kills[i];
        const killB = kills[i + 1];
        const gap = killB - killA;

        if (gap > minDeadTimeSec) {
            const ffStart = Number((killA + postKillNormalSec).toFixed(2));
            const ffEnd = Number((killB - preKillNormalSec).toFixed(2));

            if (ffEnd > ffStart) {
                // Segmento 1x antes do avanço rápido
                if (ffStart > cursor) {
                    segments.push({
                        start: cursor,
                        end: ffStart,
                        duration: Number((ffStart - cursor).toFixed(2)),
                        speed: 1,
                        isFastForward: false,
                    });
                }

                // Segmento 3x Fast-Forward
                segments.push({
                    start: ffStart,
                    end: ffEnd,
                    duration: Number((ffEnd - ffStart).toFixed(2)),
                    speed: fastForwardSpeed,
                    isFastForward: true,
                });

                cursor = ffEnd;
            }
        }
    }

    // Segmento final em 1x
    if (endSec > cursor) {
        segments.push({
            start: cursor,
            end: endSec,
            duration: Number((endSec - cursor).toFixed(2)),
            speed: 1,
            isFastForward: false,
        });
    }

    return segments.length > 0 ? segments : [{
        start: startSec,
        end: endSec,
        duration: Number((endSec - startSec).toFixed(2)),
        speed: 1,
        isFastForward: false,
    }];
}
