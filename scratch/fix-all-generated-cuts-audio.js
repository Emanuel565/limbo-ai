import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { getOptimalBgmTrack } from '../tools/gameplay-ai-analyzer.js';

const generatedDir = path.join(process.cwd(), 'public', 'generated');
const tempDir = path.join(process.cwd(), 'scratch', 'temp_audio_cuts');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

console.log('Iniciando injeção de áudio de alta energia em todos os 24 cortes gerados...');
const t0 = Date.now();
let fixedCount = 0;

for (let i = 1; i <= 24; i++) {
    const fileName = `cut_1791919843957_${i}-short.mp4`;
    const cutPath = path.join(generatedDir, fileName);
    if (!fs.existsSync(cutPath)) continue;

    const bgmPath = getOptimalBgmTrack('', i);
    const tempOutput = path.join(tempDir, fileName);

    const args = [
        '-y',
        '-i', cutPath,
        '-stream_loop', '-1',
        '-i', bgmPath,
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
    if (res.status === 0 && fs.existsSync(tempOutput)) {
        // Substitui com segurança o arquivo original
        fs.copyFileSync(tempOutput, cutPath);
        fs.unlinkSync(tempOutput);
        fixedCount++;
        console.log(`[${i}/24] ✅ Áudio injetado com sucesso em ${fileName} (${path.basename(bgmPath)})`);
    } else {
        console.error(`Erro ao fixar ${fileName}:`, res.stderr?.slice(-200));
    }
}

// Limpa tempDir se vazio
try { fs.rmdirSync(tempDir); } catch {}

console.log(`\n🎉 Concluído com sucesso em ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
console.log(`Total de vídeos com áudio novo e ativo: ${fixedCount}/24`);
