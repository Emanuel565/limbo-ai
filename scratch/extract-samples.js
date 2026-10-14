import { execSync } from 'node:child_process';
import path from 'node:path';

const video = path.join(process.cwd(), 'raw_gameplays', '_processados', '2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4');
const times = [450, 900, 1500, 2100, 3200, 4800, 6000];

times.forEach(t => {
    const out = path.join(process.cwd(), 'scratch', `frame-${t}.jpg`);
    execSync(`ffmpeg -y -ss ${t} -i "${video}" -vframes 1 "${out}"`, { stdio: 'ignore' });
    console.log(`Frame extraído em ${t}s (${Math.floor(t/60)}m): ${out}`);
});
