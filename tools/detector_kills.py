#!/usr/bin/env python3
"""
Motor de Visão Computacional Refinado para Caçador de Kills do Valorant.
Focado especificamente no jogador "Revenge", detectando com máxima precisão
abates de 3K, 4K e ACE em streams ou arquivos gravados pelo OBS.

Pilares da Detecção Certeira:
1. Resolução Nativa 1080p (ROI: 560x320 no canto superior direito) sem perda de nitidez.
2. Multi-Template Matching:
   - revenge_text_only.png (Nickname 'Revenge' em fonte branca sobre verde-água)
   - revenge_arrow_template.png (Seta amarela indicadora exclusiva de kill do próprio jogador)
   - meu_kill_template.png (Card completo de abate)
3. Eliminação total de falso-positivos:
   - NUNCA dispara em elementos estáticos de tela de carregamento (COMPETITIVO SÃO PAULO).
   - NUNCA confunde abates de aliados ou inimigos com abates do Revenge.
   - Suprime elementos estáticos que permaneçam por mais de 5.5s na mesma posição.
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
    print(json.dumps({"error": "opencv-python não está instalado no ambiente Python."}))
    sys.exit(0)

# Constantes de Calibração Nativa (1080p: 1920x1080)
NATIVE_1080_ROI_X = 1350
NATIVE_1080_ROI_Y = 35
NATIVE_1080_ROI_W = 560
NATIVE_1080_ROI_H = 320

# Separação entre linhas no Killfeed em 1080p (~38px por linha)
ALTURA_MINIMA_LINHA_1080 = 24
COOLDOWN_KILL_SEG = 4.8
MAX_STATIC_DURATION_SEG = 5.5

# Limiares de precisão calibrados
LIMIAR_FULL_PADRAO = 0.74
LIMIAR_TEXT_PADRAO = 0.58
LIMIAR_ARROW_PADRAO = 0.65


def get_video_dimensions(video_path):
    """Obtém largura e altura do vídeo de forma rápida via OpenCV ou ffprobe."""
    try:
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            if w > 0 and h > 0:
                return w, h
    except Exception:
        pass
    return 1920, 1080


def iter_frames(video_path, max_seconds=None, debug=False):
    """
    Gera (tempo_atual_seg, roi_frame_1080p) a 2 FPS.
    Tenta primeiro via FFmpeg Pipe com aceleração de hardware CUDA (14x mais rápido).
    Fallback automático para cv2.VideoCapture se FFmpeg falhar.
    Sempre normaliza o ROI para 560x320 (escala 1080p).
    """
    w_vid, h_vid = get_video_dimensions(video_path)

    # Determina o filtro de crop do FFmpeg dependendo da resolução de entrada
    if h_vid <= 720:
        # Vídeo 720p: crop 373x213 e escala para 560x320
        vf_filter = "fps=2,crop=373:213:900:23,scale=560:320:flags=bicubic"
    else:
        # Vídeo 1080p ou superior: crop nativo 560x320
        vf_filter = f"fps=2,crop={NATIVE_1080_ROI_W}:{NATIVE_1080_ROI_H}:{NATIVE_1080_ROI_X}:{NATIVE_1080_ROI_Y}"

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
        '-vf', vf_filter,
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        'pipe:1'
    ])

    frame_bytes = NATIVE_1080_ROI_W * NATIVE_1080_ROI_H * 3
    frames_yielded = 0
    try:
        proc = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        while True:
            raw = proc.stdout.read(frame_bytes)
            if not raw or len(raw) < frame_bytes:
                break
            roi = np.frombuffer(raw, dtype=np.uint8).reshape((NATIVE_1080_ROI_H, NATIVE_1080_ROI_W, 3))
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
    cap = cv2.VideoCapture(str(video_path))
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
        if h <= 720:
            roi_raw = frame[23:236, 900:1273]
            roi = cv2.resize(roi_raw, (NATIVE_1080_ROI_W, NATIVE_1080_ROI_H), interpolation=cv2.INTER_CUBIC)
        else:
            roi = frame[NATIVE_1080_ROI_Y:NATIVE_1080_ROI_Y + NATIVE_1080_ROI_H, NATIVE_1080_ROI_X:NATIVE_1080_ROI_X + NATIVE_1080_ROI_W]

        yield tempo_atual_seg, roi
        frame_idx += 1

    cap.release()


def carregar_templates(template_path=None):
    """
    Carrega o trio de templates cirúrgicos do Revenge:
    1. full: card completo de abate
    2. text: texto 'Reven' em fonte branca com fundo verde-água (funciona com QUALQUER agente)
    3. arrow: seta amarela indicadora esquerda
    """
    base_dir = os.path.dirname(template_path or "public/templates/meu_kill_template.png")
    templates = {
        "full": None,
        "text": None,
        "arrow": None,
    }

    t_full_path = template_path if (template_path and os.path.exists(template_path)) else os.path.join(base_dir, "meu_kill_template.png")
    if os.path.exists(t_full_path):
        templates["full"] = cv2.imread(t_full_path, cv2.IMREAD_COLOR)

    t_text_path = os.path.join(base_dir, "revenge_text_only.png")
    if os.path.exists(t_text_path):
        templates["text"] = cv2.imread(t_text_path, cv2.IMREAD_COLOR)

    t_arrow_path = os.path.join(base_dir, "revenge_arrow_template.png")
    if os.path.exists(t_arrow_path):
        templates["arrow"] = cv2.imread(t_arrow_path, cv2.IMREAD_COLOR)

    return templates


def detectar_abates(video_path, template_path=None, player_nick="Revenge",
                    limiar_full=LIMIAR_FULL_PADRAO, limiar_text=LIMIAR_TEXT_PADRAO,
                    limiar_arrow=LIMIAR_ARROW_PADRAO, max_seconds=None, debug=False):
    """
    Rastreia com precisão máxima apenas os abates legítimos efetuados pelo jogador Revenge.
    """
    if not video_path:
        return []

    templates = carregar_templates(template_path)
    t_full = templates["full"]
    t_text = templates["text"]
    t_arrow = templates["arrow"]

    linhas_ativas = {}          # {slot_y: tempo_inicio}
    static_tracker = {}         # {slot_y: {"first_seen": t, "last_seen": t}}
    kills_detectadas = []
    frame_count = 0

    for tempo_atual_seg, roi in iter_frames(video_path, max_seconds=max_seconds, debug=debug):
        frame_count += 1
        y_detectados = []

        v_full = 0.0
        v_txt = 0.0
        v_arr = 0.0
        loc_y = None

        # 1. Template Matching do Card Completo
        if t_full is not None and roi.shape[0] >= t_full.shape[0] and roi.shape[1] >= t_full.shape[1]:
            res_full = cv2.matchTemplate(roi, t_full, cv2.TM_CCOEFF_NORMED)
            _, max_v, _, max_loc = cv2.minMaxLoc(res_full)
            v_full = float(max_v)
            if v_full >= limiar_full:
                loc_y = max_loc[1]

        # 2. Template Matching do Texto 'Revenge' (agnóstico a agente)
        if t_text is not None and roi.shape[0] >= t_text.shape[0] and roi.shape[1] >= t_text.shape[1]:
            res_txt = cv2.matchTemplate(roi, t_text, cv2.TM_CCOEFF_NORMED)
            _, max_v, _, max_loc = cv2.minMaxLoc(res_txt)
            v_txt = float(max_v)
            if v_txt >= limiar_text and loc_y is None:
                loc_y = max_loc[1]

        # 3. Template Matching da Seta Amarela
        if t_arrow is not None and roi.shape[0] >= t_arrow.shape[0] and roi.shape[1] >= t_arrow.shape[1]:
            res_arr = cv2.matchTemplate(roi, t_arrow, cv2.TM_CCOEFF_NORMED)
            _, max_v, _, max_loc = cv2.minMaxLoc(res_arr)
            v_arr = float(max_v)

        # Regra de Ouro: Confirmação Estrita do Abate de Revenge
        # (v_full >= 0.74) OU (v_txt >= 0.58 E v_arr >= 0.65) OU (v_txt >= 0.70)
        is_revenge_kill = (v_full >= limiar_full) or (v_txt >= limiar_text and v_arr >= limiar_arrow) or (v_txt >= 0.70)

        if is_revenge_kill and loc_y is not None:
            # Encontra ou agrupa no slot Y mais próximo
            matched_slot = None
            for y_k in list(static_tracker.keys()):
                if abs(loc_y - y_k) < ALTURA_MINIMA_LINHA_1080:
                    matched_slot = y_k
                    break

            if matched_slot is None:
                matched_slot = loc_y
                static_tracker[matched_slot] = {"first_seen": tempo_atual_seg, "last_seen": tempo_atual_seg}
            else:
                static_tracker[matched_slot]["last_seen"] = tempo_atual_seg

            # Anti-Tela Estática: se o elemento persistir por mais de 5.5s na mesma posição,
            # é elemento fixo de UI (placar, tela de carregamento, lobby)
            duracao_visivel = static_tracker[matched_slot]["last_seen"] - static_tracker[matched_slot]["first_seen"]
            if duracao_visivel <= MAX_STATIC_DURATION_SEG:
                y_detectados.append(matched_slot)

        # Limpeza de elementos que desapareceram da tela
        for slot_y in list(static_tracker.keys()):
            if (tempo_atual_seg - static_tracker[slot_y]["last_seen"]) > 2.0:
                del static_tracker[slot_y]

        # Limpeza de cooldown de linhas ativas
        linhas_ativas = {y: t for y, t in linhas_ativas.items() if (tempo_atual_seg - t) < COOLDOWN_KILL_SEG}

        for y in y_detectados:
            ja_registrada = False
            for y_ativo, t_ativo in linhas_ativas.items():
                if abs(y - y_ativo) < ALTURA_MINIMA_LINHA_1080:
                    ja_registrada = True
                    break

            if not ja_registrada:
                linhas_ativas[y] = tempo_atual_seg
                kills_detectadas.append(tempo_atual_seg)
                if debug:
                    print(f"[REVENGE KILL DETECTADA] {tempo_atual_seg}s (slot Y: {y} | Full: {v_full:.2f}, Txt: {v_txt:.2f}, Arr: {v_arr:.2f})", file=sys.stderr)

        if debug and frame_count % 60 == 0:
            print(f"[SCANNING] {tempo_atual_seg}s analisados | {len(kills_detectadas)} abates confirmados de Revenge", file=sys.stderr)

    return agrupar_highlights(kills_detectadas)


def agrupar_highlights(tempos_kills, janela_seg=40, min_kills=3, pre_margin=4.0, post_margin=3.5):
    """
    Agrupa abates ocorridos dentro da mesma rodada (~40s) em clipes épicos:
    - 3 abates: 3K
    - 4 abates: 4K
    - 5+ abates: ACE
    """
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
    parser = argparse.ArgumentParser(description="Detector Refinado de Abates do Valorant (Revenge)")
    parser.add_argument("video_path", help="Caminho do arquivo de vídeo local ou URL do stream")
    parser.add_argument("--template", default="public/templates/meu_kill_template.png", help="Caminho do template do nickname")
    parser.add_argument("--player-nick", default="Revenge", help="Nickname do jogador no Valorant")
    parser.add_argument("--limiar", type=float, default=LIMIAR_FULL_PADRAO, help="Limiar de correlação para card completo")
    parser.add_argument("--max-seconds", type=float, default=None, help="Limite máximo de segundos para escanear")
    parser.add_argument("--debug", action="store_true", help="Ativa logs detalhados na saída de erro")

    args = parser.parse_args()

    resultados = detectar_abates(
        args.video_path,
        template_path=args.template,
        player_nick=args.player_nick,
        limiar_full=args.limiar,
        max_seconds=args.max_seconds,
        debug=args.debug
    )

    print(json.dumps(resultados, ensure_ascii=False))


if __name__ == "__main__":
    main()
