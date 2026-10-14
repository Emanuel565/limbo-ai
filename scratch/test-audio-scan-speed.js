import { spawn } from 'node:child_process';
import path from 'node:path';

async function testScan() {
    const videoPath = path.join(process.cwd(), 'raw_gameplays', '_processados', '2897221667-996465146-0637b3eb-2b66-4fbb-871f-6af53fc60f57.mp4');
    console.log('[Audio Scan Test] Iniciando silencedetect com FFmpeg multithread em 2 horas de áudio...');
    const start = Date.now();

    const proc = spawn('ffmpeg', [
        '-v', 'info',
        '-threads', '8',
        '-vn',
        '-i', videoPath,
        '-af', 'silencedetect=noise=-27dB:d=0.8',
        '-f', 'null',
        '-'
    ]);

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`FFmpeg finalizou em ${elapsed}s com código ${code}!`);
        
        const startRegex = /silence_start:\s*([0-9.]+)/g;
        const endRegex = /silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/g;
        const starts = [];
        let m;
        while ((m = startRegex.exec(stderr)) !== null) starts.push(parseFloat(m[1]));
        const ends = [];
        while ((m = endRegex.exec(stderr)) !== null) ends.push(parseFloat(m[1]));

        console.log(`Total de momentos de silêncio/pausa detectados: ${starts.length}`);
        console.log(`Total de retornos de ação sonora detectados: ${ends.length}`);

        // Janelas de combate ativo
        const activeWindows = [];
        for (let i = 0; i < ends.length; i++) {
            const startAction = ends[i];
            const nextSilence = starts.find(s => s > startAction);
            const endAction = nextSilence || (startAction + 35);
            const duration = endAction - startAction;
            if (duration >= 8) {
                activeWindows.push({ startSec: Math.floor(startAction), duration: Math.floor(duration) });
            }
        }
        console.log(`Total de janelas de combate intenso (>8s de ação contínua): ${activeWindows.length}`);
        console.log('Primeiras 5 janelas de ação:', activeWindows.slice(0, 5));
    });
}

testScan();
