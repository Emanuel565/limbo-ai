import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const video = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';

export function detectAudioLevel(inputPath, sampleStartSec = 100) {
    try {
        const cmd = `ffmpeg -ss ${Math.max(1, Math.floor(sampleStartSec))} -t 3 -i "${inputPath}" -af volumedetect -f null - 2>&1`;
        const out = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
        const mean = parseFloat((out.match(/mean_volume:\s*([-0-9.]+)\s*dB/) || [])[1] || '-91');
        const isMuted = mean <= -55;
        return { isMuted, meanVolume: mean };
    } catch {
        return { isMuted: true, meanVolume: -91 };
    }
}

console.log(detectAudioLevel(video, 100));
