#!/usr/bin/env python3
"""
Motor de Visão Computacional para detecção de abates no Killfeed do Valorant.
Analisa streams ou vídeos locais a 2 FPS, rastreando a caixa destacada do seu Nickname (verde-água/ciano).
Suporta Template Matching e Fallback por Máscara HSV tolerante a compressão (720p).
Agrupa linhas verticais (18px) e aplica cooldown de 4.8s por linha.
"""

import sys
import os
import json
import argparse
import subprocess
import numpy as np

try:
    import cv2
except ImportError:
    # Se OpenCV não estiver instalado no ambiente atual, informa via JSON
    print(json.dumps({"error": "opencv-python não está instalado no ambiente Python."}))
    sys.exit(0)

# Constantes de Calibração (Escala 720p: 1280x720)
ROI_X = 910
ROI_Y = 40
ROI_W = 360
ROI_H = 220
ALTURA_MINIMA_LINHA = 18  # pixels de separação entre linhas no Killfeed
COOLDOWN_RENOVACAO_SEG = 4.8  # tempo que o card de abate permanece na tela
LIMIAR_MATCH_PADRAO = 0.76

# Faixa HSV para o verde-água/ciano do Nickname próprio no Valorant
# Tolerante a artefatos de compressão de lives (YouTube/Twitch 720p)
HSV_TEAL_LOWER = np.array([76, 110, 110], dtype=np.uint8)
HSV_TEAL_UPPER = np.array([104, 255, 255], dtype=np.uint8)


def iter_frames(video_path, max_seconds=None, debug=False):
    """
    Gera (tempo_atual_seg, roi_frame) a 2 FPS.
    Tenta primeiro via FFmpeg Pipe com aceleração de hardware CUDA (14x mais rápido em streams HLS/MP4).
    Fallback automático para cv2.VideoCapture se FFmpeg não estiver disponível.
    """
    ffmpeg_bin = os.environ.get("FFMPEG_PATH", "ffmpeg")
    ffmpeg_cmd = [
        ffmpeg_bin,
        '-hide_banner', '-loglevel', 'error',
        '-hwaccel', 'cuda',
    ]
    if max_seconds:
        ffmpeg_cmd.extend(['-t', str(max_seconds)])
    ffmpeg_cmd.extend([
        '-i', str(video_path),
        '-vf', f'fps=2,scale=1280:720,crop={ROI_W}:{ROI_H}:{ROI_X}:{ROI_Y}',
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        'pipe:1'
    ])

    frame_bytes = ROI_W * ROI_H * 3
    frames_yielded = 0
    try:
        proc = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        while True:
            raw = proc.stdout.read(frame_bytes)
            if not raw or len(raw) < frame_bytes:
                break
            roi = np.frombuffer(raw, dtype=np.uint8).reshape((ROI_H, ROI_W, 3))
            timestamp = round(frames_yielded * 0.5, 2)
            yield timestamp, roi
            frames_yielded += 1
        proc.stdout.close()
        proc.wait()
        if frames_yielded > 0:
            return
    except Exception as e:
        if debug:
            print(f"[FFMPEG PIPE FALLBACK] {e}", file=sys.stderr)

    # 2. Fallback para cv2.VideoCapture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        if debug:
            print(f"[ERRO] Não foi possível abrir o vídeo: {video_path}", file=sys.stderr)
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 30.0

    frame_step = max(1, int(round(fps / 2.0)))
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_step != 0:
            frame_idx += 1
            continue

        tempo_atual_seg = round(frame_idx / fps, 2)
        if max_seconds and tempo_atual_seg > max_seconds:
            break

        h, w = frame.shape[:2]
        if w != 1280 or h != 720:
            frame = cv2.resize(frame, (1280, 720), interpolation=cv2.INTER_AREA)

        roi = frame[ROI_Y:ROI_Y + ROI_H, ROI_X:ROI_X + ROI_W]
        yield tempo_atual_seg, roi
        frame_idx += 1

    cap.release()


def detectar_abates(video_path, template_path=None, limiar_match=LIMIAR_MATCH_PADRAO, max_seconds=None, debug=False):
    if not video_path:
        return []

    template = None
    if template_path and os.path.exists(template_path):
        try:
            template = cv2.imread(template_path, cv2.IMREAD_COLOR)
        except Exception:
            template = None

    linhas_ativas = {}
    kills_detectadas = []
    frame_count = 0

    for tempo_atual_seg, roi in iter_frames(video_path, max_seconds=max_seconds, debug=debug):
        frame_count += 1
        y_detectados = []

        # 1. Template Matching
        if template is not None:
            th, tw = template.shape[:2]
            if roi.shape[0] >= th and roi.shape[1] >= tw:
                res = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
                loc = np.where(res >= limiar_match)
                for pt in zip(*loc[::-1]):
                    y_detectados.append(pt[1])

        # 2. Fallback por Máscara HSV
        if not y_detectados:
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, HSV_TEAL_LOWER, HSV_TEAL_UPPER)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                cx, cy, cw, ch = cv2.boundingRect(cnt)
                if 40 <= cw <= 220 and 12 <= ch <= 36:
                    y_detectados.append(cy)

        # 3. Limpeza de slots de linhas expiradas
        linhas_ativas = {y: t for y, t in linhas_ativas.items() if (tempo_atual_seg - t) < COOLDOWN_RENOVACAO_SEG}

        # Filtro Anti-Lobby/Placar: No Valorant nunca ocorrem > 2 abates no mesmo 0.5s.
        # Telas de lobby, lista de amigos ou placares geram dezenas de elementos ciano no mesmo frame.
        if len(y_detectados) > 2:
            continue

        for y in y_detectados:
            ja_registrada = False
            for y_ativo, t_ativo in linhas_ativas.items():
                if abs(y - y_ativo) < ALTURA_MINIMA_LINHA:
                    ja_registrada = True
                    break

            if not ja_registrada:
                linhas_ativas[y] = tempo_atual_seg
                kills_detectadas.append(tempo_atual_seg)
                if debug:
                    print(f"[KILL DETECTADA] {tempo_atual_seg}s (slot Y: {y})", file=sys.stderr)

        if debug and frame_count % 60 == 0:
            print(f"[PROGRESS] {tempo_atual_seg}s escaneados | {len(kills_detectadas)} kills detectadas", file=sys.stderr)

    return agrupar_highlights(kills_detectadas)


def agrupar_highlights(tempos_kills, janela_seg=30, min_kills=3, pre_margin=4, post_margin=3):
    if len(tempos_kills) < min_kills:
        return []

    tempos = sorted(list(set(tempos_kills)))
    clusters = []
    cluster_atual = [tempos[0]]

    for i in range(1, len(tempos)):
        t = tempos[i]
        if (t - cluster_atual[-1] <= (janela_seg * 0.75)) and (t - cluster_atual[0] <= (janela_seg * 1.5)):
            cluster_atual.append(t)
        else:
            if len(cluster_atual) >= min_kills:
                clusters.append(cluster_atual)
            cluster_atual = [t]

    if len(cluster_atual) >= min_kills:
        clusters.append(cluster_atual)

    resultados = []
    for idx, c in enumerate(clusters):
        count = len(c)
        tipo = "3K"
        if count == 4:
            tipo = "4K"
        elif count >= 5:
            tipo = "ACE"

        inicio = max(0.0, round(c[0] - pre_margin, 2))
        fim = round(c[-1] + post_margin, 2)
        duracao = round(fim - inicio, 2)

        resultados.append({
            "id": f"val_cut_{idx + 1}_{tipo.lower()}_{int(inicio)}s",
            "tipo": tipo,
            "inicio_seg": inicio,
            "fim_seg": fim,
            "duracao": duracao,
            "tempos_kills_seg": c,
        })

    return resultados


def main():
    parser = argparse.ArgumentParser(description="Detector de Abates do Valorant via Killfeed")
    parser.add_argument("video_path", help="Caminho do arquivo de vídeo local ou URL do stream")
    parser.add_argument("--template", default="public/templates/meu_kill_template.png", help="Caminho do template do nickname")
    parser.add_argument("--limiar", type=float, default=LIMIAR_MATCH_PADRAO, help="Limiar de correlação do template matching")
    parser.add_argument("--max-seconds", type=float, default=None, help="Limite máximo de segundos para escanear")
    parser.add_argument("--debug", action="store_true", help="Ativa logs detalhados na saída de erro")

    args = parser.parse_args()

    resultados = detectar_abates(
        args.video_path,
        template_path=args.template,
        limiar_match=args.limiar,
        max_seconds=args.max_seconds,
        debug=args.debug
    )

    print(json.dumps(resultados, ensure_ascii=False))


if __name__ == "__main__":
    main()
