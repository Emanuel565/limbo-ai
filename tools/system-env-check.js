import { spawnSync } from 'node:child_process';
import { resolveFfmpegBinary } from './viral-short-pipeline.js';

/**
 * Verifica o ambiente de ferramentas audiovisuais locais
 * Detecta FFmpeg, acelerador de hardware NVIDIA NVENC, yt-dlp e Python/OpenCV.
 */
export async function checkVideoToolingEnvironment() {
    let ffmpeg = false;
    let nvenc = false;
    let ytdlp = false;
    let python = false;
    let opencv = false;

    // 1. FFmpeg & NVENC
    const ffmpegBin = resolveFfmpegBinary();
    try {
        const { status } = spawnSync(ffmpegBin, ['-version'], { stdio: 'ignore', timeout: 5000 });
        if (status === 0) {
            ffmpeg = true;
            const encodersProc = spawnSync(ffmpegBin, ['-encoders'], { encoding: 'utf8', timeout: 5000 });
            if (encodersProc.stdout && encodersProc.stdout.includes('h264_nvenc')) {
                nvenc = true;
            }
        }
    } catch {
        ffmpeg = false;
    }

    // 2. yt-dlp
    try {
        const ytdlpProc = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8', timeout: 5000 });
        if (ytdlpProc.status === 0) {
            ytdlp = true;
        }
    } catch {
        ytdlp = false;
    }

    // 3. Python & OpenCV
    const pythonCandidates = ['python', 'py', 'python3'];
    for (const py of pythonCandidates) {
        try {
            const pyProc = spawnSync(py, ['-c', 'import sys; print(sys.version)'], { encoding: 'utf8', timeout: 5000 });
            if (pyProc.status === 0 && !pyProc.stdout.includes('Python was not found')) {
                python = true;
                const cvProc = spawnSync(py, ['-c', 'import cv2, numpy; print("CV_OK")'], { encoding: 'utf8', timeout: 5000 });
                if (cvProc.status === 0 && cvProc.stdout && cvProc.stdout.includes('CV_OK')) {
                    opencv = true;
                }
                break;
            }
        } catch {
            // try next candidate
        }
    }

    return {
        ffmpeg,
        nvenc,
        ytdlp,
        python,
        opencv,
    };
}
