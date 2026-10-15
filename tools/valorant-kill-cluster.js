/**
 * Agrupa abates temporais em clusters de Highlights de alto impacto
 * Regra: >= 3 abates dentro de uma janela de até 30 segundos.
 * Margens: -4s antes do primeiro abate e +3s após o último.
 */
export function aggregateKillHighlights(killTimestamps, {
    windowSec = 30,
    minKills = 3,
    preMarginSec = 4,
    postMarginSec = 3,
    filterDeathmatch = true,
} = {}) {
    if (!Array.isArray(killTimestamps) || killTimestamps.length === 0) {
        return [];
    }

    // Ordena e remove duplicados muito próximos (< 0.2s)
    const sorted = [...killTimestamps]
        .map(Number)
        .filter((t) => Number.isFinite(t) && t >= 0)
        .sort((a, b) => a - b);

    if (sorted.length < minKills) {
        return [];
    }

    // 1. Encontra todos os blocos de abates contíguos onde a distância entre abates consecutivos
    // permite formar um grupo de pelo menos minKills dentro de windowSec
    const clusters = [];
    let currentCluster = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const kill = sorted[i];
        const firstInCluster = currentCluster[0];

        // Se a distância entre abates consecutivos for aceitável para manter a cadeia do round (<= windowSec)
        if (kill - currentCluster[currentCluster.length - 1] <= (windowSec * 0.75) && (kill - firstInCluster) <= (windowSec * 1.5)) {
            currentCluster.push(kill);
        } else {
            if (currentCluster.length >= minKills) {
                clusters.push(currentCluster);
            }
            currentCluster = [kill];
        }
    }

    if (currentCluster.length >= minKills) {
        clusters.push(currentCluster);
    }

    // 2. Filtra mata-mata: no 5v5 (Sem Classificação e Competitivo) há no máximo 5 inimigos (6 com Sage ult).
    // Qualquer sequência contínua com 7+ kills pertence a mata-mata (respawns instantâneos).
    const validClusters = filterDeathmatch
        ? clusters.filter((kills) => kills.length <= 6)
        : clusters;

    // 3. Transforma cada cluster em objeto de highlight formatado
    return validClusters.map((kills, index) => {
        const firstKill = kills[0];
        const lastKill = kills[kills.length - 1];
        const count = kills.length;

        let clipType = '3K';
        if (count === 4) clipType = '4K';
        if (count >= 5) clipType = 'ACE';

        const startSec = Math.max(0, Number((firstKill - preMarginSec).toFixed(2)));
        const endSec = Number((lastKill + postMarginSec).toFixed(2));
        const duration = Number((endSec - startSec).toFixed(2));

        return {
            id: `val_cut_${index + 1}_${clipType.toLowerCase()}_${Math.round(startSec)}s`,
            clipType,
            killsCount: count,
            startSec,
            endSec,
            duration,
            killTimes: kills,
            gameMode: 'COMPETITIVE_OR_UNRATED',
            isCompetitiveOrUnrated: true,
            headline: clipType === 'ACE' ? 'ACE HISTÓRICO NO VALORANT 👑' : `${clipType} INSANO NO ROUND 🔥`,
        };
    });
}
