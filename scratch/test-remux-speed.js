import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const cutFile = path.join(process.cwd(), 'public', 'generated', 'cut_1791919843957_1-short.mp4');
const tempOutput = path.join(process.cwd(), 'scratch', 'test-remux-fast.mp4');
const bgmFile = path.join(process.cwd(), 'public', 'audio', 'bgm', 'gamer-hype-1.mp3');

const t0 = Date.now();
const args = [
    '-y',
    '-i', cutFile,
    '-stream_loop', '-1',
    '-i', bgmFile,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'copy',
    '-af', 'volume=0.95,afade=t=in:st=0:d=0.4,afade=t=out:st=23.5:d=1.5',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    tempOutput
];

const res = spawnSync('ffmpeg', args, { encoding: 'utf8' });
console.log(`Remux concluído em ${Date.now() - t0}ms, status: ${res.status}`);

if (res.status === 0) {
    const vol = execSync(`ffmpeg -i "${tempOutput}" -af volumedetect -f null - 2>&1`, { encoding: 'utf8' });
    const mean = (vol.match(/mean_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
    const max = (vol.match(/max_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
    console.log(`✅ Áudio do clipe remuxado: Mean: ${mean} dB | Max: ${max} dB`);
}
