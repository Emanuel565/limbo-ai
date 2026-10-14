import { execSync } from 'node:child_process';
import path from 'node:path';

function probeWindowAction(filePath, startSec, durationSec = 25) {
    const probeCmd = `ffmpeg -v error -ss ${startSec} -t ${durationSec} -i "${filePath}" -af "volumedetect" -f null -`;
    try {
        const out = execSync(probeCmd, { encoding: 'utf8', timeout: 5000 });
        return parseVolumeOutput(out);
    } catch (err) {
        // FFmpeg writes volumedetect to stderr
        return parseVolumeOutput(err.stderr || '');
    }
}

function parseVolumeOutput(str) {
    const maxMatch = str.match(/max_volume:\s*(-?[0-9.]+)\s*dB/);
    const meanMatch = str.match(/mean_volume:\s*(-?[0-9.]+)\s*dB/);
    return {
        maxVolumeDb: maxMatch ? parseFloat(maxMatch[1]) : -40,
        meanVolumeDb: meanMatch ? parseFloat(meanMatch[1]) : -40,
    };
}

const video = path.join(process.cwd(), 'raw_gameplays', '_processados', '2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4');
console.log('Testando probe em diferentes janelas da gameplay de 2h:');

const testTimestamps = [60, 105, 300, 707, 1309, 2500, 4000, 6727];
testTimestamps.forEach(ts => {
    const t0 = Date.now();
    const res = probeWindowAction(video, ts, 25);
    const ms = Date.now() - t0;
    const isCombat = res.maxVolumeDb > -12;
    console.log(`[${ts}s (${Math.floor(ts/60)}m)] Max: ${res.maxVolumeDb}dB | Mean: ${res.meanVolumeDb}dB | Ação: ${isCombat ? '🔥 COMBATE INTENSO' : '💤 Silêncio/Buy Phase'} (${ms}ms)`);
});
