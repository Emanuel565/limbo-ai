import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { resolveFfmpegBinary } from './viral-short-pipeline.js';

export function resolveYtdlpBinary() {
    const explicit = process.env.YTDLP_PATH || process.env.YTDLP_BIN;
    const candidates = [
        explicit,
        'yt-dlp',
        'C:/Users/' + (process.env.USERNAME || 'Public') + '/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe',
        'C:/Users/' + (process.env.USERNAME || 'Public') + '/AppData/Local/Microsoft/WinGet/Links/yt-dlp.exe',
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            const { status } = spawnSync(candidate, ['--version'], { stdio: 'ignore', timeout: 5000 });
            if (status === 0) return candidate;
        } catch {
            // try next candidate
        }
    }
    return 'yt-dlp';
}

export function resolvePythonBinary() {
    const explicit = process.env.PYTHON_PATH || process.env.PYTHON_BIN;
    const venvPython = path.join(process.cwd(), 'tools', '.venv', 'Scripts', 'python.exe');
    const localBinPython = 'C:/Users/' + (process.env.USERNAME || 'Public') + '/.local/bin/python.exe';
    const candidates = [
        explicit,
        venvPython,
        'python',
        'py',
        'python3',
        localBinPython,
    ].filter(Boolean);

    for (const py of candidates) {
        try {
            const proc = spawnSync(py, ['-c', 'import sys; print(sys.version)'], { encoding: 'utf8', timeout: 5000 });
            if (proc.status === 0 && !proc.stdout.includes('Python was not found')) {
                return py;
            }
        } catch {
            // try next candidate
        }
    }
    return 'python';
}

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
    const ytdlpBin = resolveYtdlpBinary();
    try {
        const ytdlpProc = spawnSync(ytdlpBin, ['--version'], { encoding: 'utf8', timeout: 5000 });
        if (ytdlpProc.status === 0) {
            ytdlp = true;
        }
    } catch {
        ytdlp = false;
    }

    // 3. Python & OpenCV
    const pyBin = resolvePythonBinary();
    try {
        const pyProc = spawnSync(pyBin, ['-c', 'import sys; print(sys.version)'], { encoding: 'utf8', timeout: 5000 });
        if (pyProc.status === 0 && !pyProc.stdout.includes('Python was not found')) {
            python = true;
            const cvProc = spawnSync(pyBin, ['-c', 'import cv2, numpy; print("CV_OK")'], { encoding: 'utf8', timeout: 5000 });
            if (cvProc.status === 0 && cvProc.stdout && cvProc.stdout.includes('CV_OK')) {
                opencv = true;
            }
        }
    } catch {
        python = false;
        opencv = false;
    }

    return {
        ffmpeg,
        nvenc,
        ytdlp,
        python,
        opencv,
    };
}
