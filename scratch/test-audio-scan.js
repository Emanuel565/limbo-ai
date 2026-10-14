import { execSync } from 'node:child_process';

const video = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';
const timestamps = [100, 500, 1000, 2000, 3000, 4000, 5000, 6000];

for (const sec of timestamps) {
    try {
        const cmd = `ffmpeg -ss ${sec} -t 5 -i "${video}" -af volumedetect -f null - 2>&1`;
        const out = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
        const mean = (out.match(/mean_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
        const max = (out.match(/max_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
        console.log(`Timestamp ${sec}s -> Mean: ${mean} dB | Max: ${max} dB`);
    } catch (err) {
        console.log(`Erro no timestamp ${sec}s:`, err.message);
    }
}
