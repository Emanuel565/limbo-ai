import { execSync } from 'node:child_process';

const video = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';

function inspectTimestamp(sec) {
    const t0 = Date.now();
    try {
        // Analisa radar top-left (300x300 em 20,20) e centro da mira (400x400 no centro)
        const cmdRadar = `ffmpeg -ss ${sec} -i "${video}" -vframes 1 -vf "crop=300:300:20:20,signalstats,metadata=print" -f null - 2>&1`;
        const outRadar = execSync(cmdRadar, { encoding: 'utf8', timeout: 5000 });
        const yavgRadar = parseFloat((outRadar.match(/lavfi\.signalstats\.YAVG=([0-9.]+)/) || [])[1] || '0');
        const huemedRadar = parseFloat((outRadar.match(/lavfi\.signalstats\.HUEMED=([0-9.]+)/) || [])[1] || '0');
        const ylowRadar = parseFloat((outRadar.match(/lavfi\.signalstats\.YLOW=([0-9.]+)/) || [])[1] || '0');

        // Scoreboard ou Lobby pós-jogo têm YAVG radar muito baixo (< 68) e HUEMED na faixa roxa escura (>= 300)
        // Gameplay ativa tem mapa claro no radar (YAVG >= 72) ou YLOW >= 45
        const isMenu = yavgRadar < 68 && (huemedRadar >= 300 || huemedRadar <= 20);
        const isGameplay = !isMenu && yavgRadar >= 70;

        return {
            sec,
            elapsedMs: Date.now() - t0,
            isGameplay,
            isMenu,
            yavgRadar,
            huemedRadar,
            ylowRadar,
            verdict: isGameplay ? '✅ GAMEPLAY ATIVA' : '❌ MENU/PLACAR DESCARTADO'
        };
    } catch (err) {
        return { sec, error: err.message, isGameplay: true };
    }
}

console.log('Testando segundo 300 (Gameplay):', inspectTimestamp(300));
console.log('Testando segundo 900 (Gameplay):', inspectTimestamp(900));
console.log('Testando segundo 2100 (Scoreboard):', inspectTimestamp(2100));
console.log('Testando segundo 2200 (Lobby pós-jogo):', inspectTimestamp(2200));
