import { execSync } from 'node:child_process';
import path from 'node:path';

export function isGameplayFrame(framePath) {
    try {
        const cmd = `ffmpeg -v info -i "${framePath}" -vf "crop=300:300:20:20,signalstats,metadata=print" -f null - 2>&1`;
        const out = execSync(cmd, { encoding: 'utf8', timeout: 4000 });
        
        const ylowMatch = out.match(/lavfi\.signalstats\.YLOW=([0-9.]+)/);
        const yavgMatch = out.match(/lavfi\.signalstats\.YAVG=([0-9.]+)/);
        const huemedMatch = out.match(/lavfi\.signalstats\.HUEMED=([0-9.]+)/);

        const ylow = ylowMatch ? parseFloat(ylowMatch[1]) : 0;
        const yavg = yavgMatch ? parseFloat(yavgMatch[1]) : 0;
        const huemed = huemedMatch ? parseFloat(huemedMatch[1]) : 0;

        // No lobby/menu/scoreboard (frame-2100): YLOW <= 25, YAVG < 65, HUEMED > 270 (fundo escuro azul/roxo sem minimapa)
        // Na gameplay (frame-300, frame-900): YLOW >= 35, YAVG >= 75 (minimapa claro com traçados e radar)
        const isMenu = ylow < 28 && yavg < 65 && huemed > 270;
        const isGameplay = !isMenu && yavg > 40;

        return {
            frame: path.basename(framePath),
            isGameplay,
            isMenu,
            ylow,
            yavg,
            huemed,
            verdict: isGameplay ? '✅ GAMEPLAY ATIVA (MINIMAPA DETECTADO)' : '❌ LOBBY/MENU/SCOREBOARD DESCARTADO'
        };
    } catch (err) {
        return { isGameplay: true, error: err.message };
    }
}

console.log(isGameplayFrame('scratch/frame-300.jpg'));
console.log(isGameplayFrame('scratch/frame-900.jpg'));
console.log(isGameplayFrame('scratch/frame-2100.jpg'));
