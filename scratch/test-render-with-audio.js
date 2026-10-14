import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const inputVideo = 'raw_gameplays/_processados/2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4';
const bgmPath = path.join(process.cwd(), 'public', 'audio', 'bgm', 'gamer-hype-1.mp3');
const outputPath = path.join(process.cwd(), 'scratch', 'test-audio-render.mp4');

const duration = 15;
const startSec = 145;

const fontPrefix = fs.existsSync('C:/Windows/Fonts/arialbd.ttf') ? "fontfile='C\\:/Windows/Fonts/arialbd.ttf':" : '';

const filters = [
    'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos',
    "crop='w=if(between(mod(t,8),4,8),1080*0.88,1080):h=if(between(mod(t,8),4,8),1920*0.88,1920):x=(iw-ow)/2:y=(ih-oh)/2'",
    'scale=1080:1920:flags=lanczos',
    'setsar=1',
    'fps=30',
    'drawbox=y=130:color=black@0.70:width=iw:height=125:t=fill',
    `drawtext=${fontPrefix}text='ROUND 1 PISTOL GOD DE GHOST':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=170`,
    `drawbox=x=0:y=ih-14:w='iw*t/${duration}':h=14:color=0xFF1493@0.95:t=fill`
];

const audioFilters = [
    'volume=0.95',
    'afade=t=in:st=0:d=0.4',
    `afade=t=out:st=${duration - 1.5}:d=1.5`
];

const args = [
    '-y',
    '-ss', String(startSec),
    '-i', inputVideo,
    '-stream_loop', '-1',
    '-i', bgmPath,
    '-t', String(duration),
    '-vf', filters.join(','),
    '-af', audioFilters.join(','),
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'h264_nvenc',
    '-preset', 'p5',
    '-tune', 'hq',
    '-b:v', '8M',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    outputPath
];

console.log('Iniciando renderização com -map 0:v:0 e -map 1:a:0...');
const t0 = Date.now();
const res = spawnSync('ffmpeg', args, { encoding: 'utf8', timeout: 30000 });

console.log(`Renderizado em ${Date.now() - t0}ms, status: ${res.status}`);
if (res.status === 0 && fs.existsSync(outputPath)) {
    const volCheck = execSync(`ffmpeg -i "${outputPath}" -af volumedetect -f null - 2>&1`, { encoding: 'utf8' });
    const mean = (volCheck.match(/mean_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
    const max = (volCheck.match(/max_volume:\s*([-0-9.]+)\s*dB/) || [])[1];
    console.log(`✅ ÁUDIO GERADO COM SUCESSO! Mean: ${mean} dB | Max: ${max} dB | Tamanho: ${(fs.statSync(outputPath).size / (1024*1024)).toFixed(2)} MB`);
} else {
    console.error('Erro na renderização:', res.stderr?.slice(-400));
}
