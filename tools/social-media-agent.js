/**
 * Agente de Social Media IA para Valorant
 * Especializado em criar ganchos virais procedurais (alto CTR), legendas dinâmicas com CTA,
 * clusters de hashtags otimizadas e horários nobres de engajamento para o jogador "Revenge".
 * 
 * Agora 100% PROCEDURAL: Analisa a telemetria do corte (intervalo de tempo entre kills,
 * quantidade de abates, clutch, velocidade de disparo, duração e contexto de rodada)
 * para forjar títulos e ganchos únicos e contextuais.
 */

export const REVENGE_TITLES = {
    'ACE': [
        'O ACE HISTÓRICO DO REVENGE QUE VIROU O JOGO 👑',
        'COMO O REVENGE GANHOU ESSE ROUND IMPOSSÍVEL 🏆',
        '1V5 HISTÓRICO: O ACE DEFINITIVO DO REVENGE 👑',
        'A MIRA DO REVENGE TÁ EM DIA: ACE HISTÓRICO 🎯',
        'QUANDO O REVENGE ENTRA EM MODO DEUS NO VALORANT 👑',
    ],
    '4K': [
        'ESSE 4K DO REVENGE CALOU O LOBBY 🔥',
        'O 4K MAIS RÁPIDO DO REVENGE NO COMPETITIVO ⚡',
        'QUANDO O REVENGE ENTRA EM MODO ASPAS 🎯',
        '4K BRUTAL DO REVENGE QUE DESTRUIU O ROUND 🔥',
        'NÃO SOBROU NINGUÉM: 4K DO REVENGE 💥',
    ],
    '3K': [
        'O 3K CIRÚRGICO DO REVENGE NA DEFESA 🎯',
        'SEGUROU O BOMB SOZINHO: 3K DO REVENGE 🔥',
        'ESSA MIRA DO REVENGE TÁ ILLEGAL NO COMPETITIVO 💀',
        '3 TIROS, 3 HEADSHOTS: O REVENGE É OUTRO NÍVEL 🎯',
        'DEFESA PERFEITA DO REVENGE NO VALORANT 🔥',
    ],
    'CLUTCH': [
        'O CLUTCH 1V3 COM 1 HP DO REVENGE 🩸',
        'O CLUTCH MAIS INSANO DA CARREIRA DO REVENGE 👑',
        'COMO O REVENGE CLUTCHOU ESSE ROUND IMPOSSÍVEL 🔥',
        'GELO NAS VEIAS: CLUTCH INACREDITÁVEL DO REVENGE ❄️',
    ],
};

export const HASHTAG_CLUSTERS = [
    '#valorant',
    '#valorantbrasil',
    '#revenge',
    '#valorantclips',
    '#clutchvalorant',
    '#vctbrasil',
    '#valoranthighlights',
    '#gamingbrasil',
    '#gamer',
    '#shorts',
];

/**
 * Matrizes de Vocabulário Gamer e Gatilhos Virais Procedurais
 */
const HOOK_CATALYSTS = [
    'QUANDO O {NICK} ENTRA EM MODO {ARCHETYPE}',
    'A MIRA DO {NICK} TÁ ILLEGAL NO COMPETITIVO',
    'NÃO DÁ PRA TROCAR: {NICK} DESTRUIU O ROUND',
    'O ROUND MAIS ABSURDO DO {NICK} NO VALORANT',
    'COMO O {NICK} RESOLVEU ESSE ROUND IMPOSSÍVEL',
    'AULA DE MIRA DO {NICK} NO BOMBSITE',
    'ESSE {TYPE} DO {NICK} CALOU O LOBBY INTEIRO',
    'ELES NÃO ESPERAVAM POR ESSE {TYPE} DO {NICK}',
];

const ARCHETYPES = ['DEUS', 'ASPAS', 'PRO PLAYER', 'CHEFÃO', 'MÁQUINA', 'DEMÔNIO'];

/**
 * Calcula a telemetria do corte para guiar o motor procedural
 */
export function extractCutTelemetry(cut = {}) {
    const rawTimes = Array.isArray(cut.killTimes) ? cut.killTimes : (Array.isArray(cut.tempos_kills_seg) ? cut.tempos_kills_seg : []);
    const sortedTimes = [...rawTimes].map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    
    const killsCount = Number(cut.killsCount || sortedTimes.length || (String(cut.clipType).toUpperCase() === 'ACE' ? 5 : String(cut.clipType).toUpperCase() === '4K' ? 4 : 3));
    
    let killIntervalSec = 0;
    if (sortedTimes.length >= 2) {
        killIntervalSec = Math.max(0.5, Math.round((sortedTimes[sortedTimes.length - 1] - sortedTimes[0]) * 10) / 10);
    }

    const duration = Number(cut.duration || (cut.endSec && cut.startSec ? cut.endSec - cut.startSec : 20));
    const startSec = Number(cut.startSec || cut.inicio_seg || 0);

    const isFastMultikill = killIntervalSec > 0 && killIntervalSec <= 4.0;
    const isRapidReaction = killIntervalSec > 0 && killIntervalSec <= 7.0;
    const isLateGame = startSec >= 1200;
    const isClutch = String(cut.clipType).toUpperCase().includes('CLUTCH') || Boolean(cut.isClutch);

    return {
        killsCount,
        killTimes: sortedTimes,
        killIntervalSec,
        duration,
        startSec,
        isFastMultikill,
        isRapidReaction,
        isLateGame,
        isClutch,
        hasFastForward: Boolean(cut.hasFastForward || cut.speed === 3),
    };
}

/**
 * Gera proceduralmente um título de alto CTR adaptado à telemetria real do corte
 */
export function generateViralHookTitle(options = {}) {
    const cut = typeof options === 'object' && options !== null ? options : {};
    const playerNick = String(cut.playerNick || 'Revenge').trim();
    const clipTypeRaw = String(cut.clipType || cut.tipo || '3K').toUpperCase();
    const index = Number(cut.index || 0);
    const mode = cut.mode || 'procedural';

    const nickUpper = playerNick.toUpperCase();
    const telemetry = extractCutTelemetry(cut);
    const kills = telemetry.killsCount;
    const intervalSec = Math.round(telemetry.killIntervalSec) || 3;

    if (mode === 'classic') {
        const list = REVENGE_TITLES[clipTypeRaw] || REVENGE_TITLES['3K'];
        const chosen = list[index % list.length];
        return playerNick.toLowerCase() !== 'revenge'
            ? chosen.replace(/REVENGE/g, nickUpper)
            : chosen;
    }

    // 1. POOL PROCEDURAL: Cortes Ultrarrápidos (< 4s entre primeiro e último abate)
    if (telemetry.isFastMultikill && kills >= 3) {
        const rapidTemplates = [
            `SPRAY TRANSFER INSANO: ${nickUpper} DERRUBOU ${kills} EM ${intervalSec}s 💥`,
            `NÃO DEU NEM TEMPO DE PISCAR: ${kills}K DO ${nickUpper} EM ${intervalSec}s ⚡`,
            `${kills} KILLS EM ${intervalSec} SEGUNDOS: O ${nickUpper} ENLOUQUECEU ⚡`,
            `REACTION TIME DE PRO PLAYER: ${kills}K RELÂMPAGO DO ${nickUpper} ⚡`,
            `COMO O ${nickUpper} FEZ ESSE ${clipTypeRaw} EM APENAS ${intervalSec}s? 🎯`,
            `NO MESMO SPRAY: O ${kills}K MAIS RÁPIDO DO ${nickUpper} 💥`,
        ];
        return rapidTemplates[index % rapidTemplates.length];
    }

    // 2. POOL PROCEDURAL: ACE (5 Kills / 1v5)
    if (clipTypeRaw === 'ACE' || kills >= 5) {
        const aceTemplates = [
            `1V5 HISTÓRICO: O ACE DEFINITIVO DO ${nickUpper} 👑`,
            `O ACE HISTÓRICO DO ${nickUpper} QUE VIROU O JOGO 👑`,
            `QUANDO O ${nickUpper} ENTRA EM MODO DEUS NO VALORANT 👑`,
            `LIMPOU O BOMBSITE SOZINHO: O ACE BRUTAL DO ${nickUpper} 🏆`,
            `5 HEADSHOTS SEGUIDOS: A MIRA DO ${nickUpper} TÁ ILLEGAL 💀`,
            `NÃO SOBROU NINGUÉM: ACE HISTÓRICO DO ${nickUpper} 👑`,
            `A JOGADA PERFEITA: O ACE MAIS INSANO DO ${nickUpper} 🎯`,
        ];
        return aceTemplates[index % aceTemplates.length];
    }

    // 3. POOL PROCEDURAL: 4K (Quadra Kill)
    if (clipTypeRaw === '4K' || kills === 4) {
        const fourKTemplates = [
            `ESSE 4K DO ${nickUpper} CALOU O LOBBY 🔥`,
            `QUANDO O ${nickUpper} ENTRA EM MODO ASPAS 🎯`,
            `4K BRUTAL DO ${nickUpper} QUE DESTRUIU O ROUND 🔥`,
            `NÃO SOBROU NINGUÉM: 4K DO ${nickUpper} 💥`,
            `O 4K MAIS RÁPIDO DO ${nickUpper} NO COMPETITIVO ⚡`,
            `4 TIROS E O ROUND RESOLVIDO: O ${nickUpper} É OUTRO NÍVEL 🎯`,
            `AULA DE RETAKE: 4K CIRÚRGICO DO ${nickUpper} 🔥`,
        ];
        return fourKTemplates[index % fourKTemplates.length];
    }

    // 4. POOL PROCEDURAL: Clutch (1vX)
    if (telemetry.isClutch || clipTypeRaw.includes('CLUTCH')) {
        const clutchVs = kills >= 2 ? `1V${kills}` : '1V3';
        const clutchTemplates = [
            `GELO NAS VEIAS: CLUTCH INACREDITÁVEL DO ${nickUpper} ❄️`,
            `O CLUTCH ${clutchVs} COM 1 HP DO ${nickUpper} 🩸`,
            `COMO O ${nickUpper} CLUTCHOU ESSE ROUND IMPOSSÍVEL 🔥`,
            `SOZINHO CONTRA O TIME: AULA DE CLUTCH DO ${nickUpper} 🧠`,
            `O CLUTCH MAIS INSANO DA CARREIRA DO ${nickUpper} 👑`,
            `PRESSÃO TOTAL: ${nickUpper} GANHOU O ROUND NO LIMITE ⏳`,
        ];
        return clutchTemplates[index % clutchTemplates.length];
    }

    // 5. POOL PROCEDURAL: 3K (Triple Kill / Defesa / Ataque)
    const threeKTemplates = [
        `O 3K CIRÚRGICO DO ${nickUpper} NA DEFESA 🎯`,
        `SEGUROU O BOMB SOZINHO: 3K DO ${nickUpper} 🔥`,
        `ESSA MIRA DO ${nickUpper} TÁ ILLEGAL NO COMPETITIVO 💀`,
        `3 TIROS, 3 HEADSHOTS: O ${nickUpper} É OUTRO NÍVEL 🎯`,
        `DEFESA PERFEITA DO ${nickUpper} NO VALORANT 🔥`,
        `MIRA CRAVADA NO PIXEL: 3K IMPECÁVEL DO ${nickUpper} 🎯`,
        `O 3K QUE SALVOU A PARTIDA PRO ${nickUpper} 🏆`,
    ];

    if (index >= threeKTemplates.length) {
        const archetype = ARCHETYPES[index % ARCHETYPES.length];
        const baseHook = HOOK_CATALYSTS[index % HOOK_CATALYSTS.length]
            .replace(/\{NICK\}/g, nickUpper)
            .replace(/\{TYPE\}/g, clipTypeRaw)
            .replace(/\{ARCHETYPE\}/g, archetype);
        return `${baseHook} 🔥`;
    }

    return threeKTemplates[index % threeKTemplates.length];
}

/**
 * Gera legenda completa e dinâmica para TikTok, Instagram Reels e YouTube Shorts
 * adaptada ao contexto procedural do corte
 */
export function generateSocialMediaCaption({
    playerNick = 'Revenge',
    clipType = '3K',
    title = '',
    roundContext = null,
    killsCount = null,
    killTimes = null,
    duration = null,
    index = 0,
} = {}) {
    const hook = title || generateViralHookTitle({ playerNick, clipType, killsCount, killTimes, duration, index });
    const telemetry = extractCutTelemetry({ clipType, killsCount, killTimes, duration });

    let contextualNarrative = `Round tenso de alto nível no Valorant. Mira cravada no pixel, leitura perfeita de jogo e zero espaço para erro.`;
    
    if (telemetry.isFastMultikill) {
        contextualNarrative = `Em menos de ${Math.round(telemetry.killIntervalSec) || 3} segundos o ${playerNick} limpou o round com recoil impecável e reação instantânea!`;
    } else if (String(clipType).toUpperCase() === 'ACE') {
        contextualNarrative = `O round parecia completamente perdido até o ${playerNick} puxar esse ACE histórico e derrubar os 5 adversários sozinho!`;
    } else if (telemetry.isClutch) {
        contextualNarrative = `Situação de extrema pressão: 1 contra todos, tempo correndo e mira no pixel. Gelo nas veias do ${playerNick}!`;
    } else if (roundContext) {
        contextualNarrative = `Round disputado no ${roundContext}. O ${playerNick} garantiu a vantagem com posicionamento impecável.`;
    }

    const ctas = [
        '👇 Qual foi a melhor kill desse round? Deixa nos comentários!',
        '📌 Já segue o canal para não perder as melhores jogadas do Revenge!',
        '💬 Você conseguiria segurar esse round? Comenta aqui embaixo!',
        '🎯 Marca aquele duo que precisa calibrar a mira desse jeito!',
        '🔥 De 0 a 10, que nota você dá pra essa jogada?',
    ];
    const cta = ctas[index % ctas.length];

    return `${hook}

${contextualNarrative}

${cta}

${HASHTAG_CLUSTERS.join(' ')}`;
}

/**
 * Avalia o potencial de retenção e viralidade do clipe
 */
export function evaluateViralScore({ clipType = '3K', duration = 15, hasFastForward = false, killTimes = [] } = {}) {
    let score = 90;
    const typeUpper = String(clipType).toUpperCase();

    if (typeUpper === 'ACE') score += 6;
    else if (typeUpper === '4K') score += 4;
    else if (typeUpper === '3K') score += 2;

    if (duration >= 12 && duration <= 25) {
        score += 2;
    }

    if (hasFastForward) {
        score += 1;
    }

    if (Array.isArray(killTimes) && killTimes.length >= 3) {
        const delta = Math.abs(killTimes[killTimes.length - 1] - killTimes[0]);
        if (delta <= 4.0) {
            score += 2;
        }
    }

    return Math.min(99, Math.max(85, score));
}

/**
 * Retorna os horários nobres de publicação de games no Brasil
 */
export function getGamerPrimeTimeSlots() {
    return [
        { time: '11:30', label: 'Almoço Gamer', description: 'Pico de engajamento nos Reels e Shorts' },
        { time: '15:45', label: 'Tarde Competitiva', description: 'Saída da escola/faculdade' },
        { time: '18:30', label: 'Início da Noite', description: 'Horário nobre de streams e lives' },
        { time: '21:15', label: 'Pico Noturno', description: 'Maior volume de visualizações no TikTok' },
    ];
}
