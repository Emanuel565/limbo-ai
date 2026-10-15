#!/usr/bin/env python3
"""
Motor de Visão Computacional de Alta Performance para Caçador de Kills do Valorant.
Focado especificamente no jogador "Revenge", detectando com máxima precisão
abates de 3K, 4K e ACE em streams ou arquivos gravados pelo OBS.

Características:
1. Resolução Nativa 1080p (ROI: 560x320 no canto superior direito).
2. Template Matching em escala de cinza normalizada para o texto 'Revenge':
   - 100% agnóstico a agente (Astra, Killjoy, Reyna, Jett, etc.)
   - 100% agnóstico a cor de time (Ataque/Defesa, daltonismo)
   - Valida que o jogador é o assassino (X < 280) e não a vítima.
3. Anti-Tela Estática:
   - Suprime elementos estáticos que permaneçam por mais de 5.5s na mesma posição.
4. Escaneamento Paralelo Inteligente para VODs e Streams:
   - Divide streams longos em chunks processados concorrentemente via FFmpeg Pipe.
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
LIMIAR_TEXT_PADRAO = 0.755
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


def get_video_duration(video_path):
    """Obtém a duração total do vídeo ou stream em segundos."""
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            str(video_path)
        ]
        out = subprocess.check_output(cmd, timeout=10, stderr=subprocess.DEVNULL)
        d = float(out.strip())
        if d > 0:
            return d
    except Exception:
        pass
    try:
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            cap.release()
            if frames > 0:
                return float(frames / fps)
    except Exception:
        pass
    return None


def iter_frames(video_path, start_seconds=0.0, max_seconds=None, debug=False):
    """
    Gera (tempo_atual_seg, roi_frame_1080p) a 2 FPS.
    Tenta primeiro via FFmpeg Pipe com busca rápida (-ss).
    Fallback automático para cv2.VideoCapture se FFmpeg falhar.
    Sempre normaliza o ROI para 560x320 (escala 1080p).
    """
    w_vid, h_vid = get_video_dimensions(video_path)

    # Determina o filtro de crop do FFmpeg dependendo da resolução de entrada
    if h_vid <= 720:
        vf_filter = "fps=2,crop=373:213:900:23,scale=560:320:flags=bicubic"
    else:
        vf_filter = f"fps=2,crop={NATIVE_1080_ROI_W}:{NATIVE_1080_ROI_H}:{NATIVE_1080_ROI_X}:{NATIVE_1080_ROI_Y}"

    ffmpeg_bin = os.environ.get("FFMPEG_PATH", "ffmpeg")
    ffmpeg_cmd = [
        ffmpeg_bin,
        '-hide_banner', '-loglevel', 'error',
        '-hwaccel', 'cuda',
    ]
    if str(video_path).startswith(('http://', 'https://')):
        ffmpeg_cmd.extend(['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5'])
    if start_seconds and float(start_seconds) > 0:
        ffmpeg_cmd.extend(['-ss', str(start_seconds)])
    if max_seconds and float(max_seconds) > 0:
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
    base_time = float(start_seconds or 0.0)
    try:
        proc = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        while True:
            raw = proc.stdout.read(frame_bytes)
            if not raw or len(raw) < frame_bytes:
                break
            roi = np.frombuffer(raw, dtype=np.uint8).reshape((NATIVE_1080_ROI_H, NATIVE_1080_ROI_W, 3))
            timestamp = round(base_time + (frames_yielded * 0.5), 2)
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

    if base_time > 0:
        cap.set(cv2.CAP_PROP_POS_MSEC, base_time * 1000.0)

    frame_step = max(1, int(round(fps / 2.0)))
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_step != 0:
            frame_idx += 1
            continue

        tempo_atual_seg = round(base_time + (frame_idx / fps), 2)
        if max_seconds and (tempo_atual_seg - base_time) > float(max_seconds):
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
    Carrega o conjunto de templates calibrados para detecção de abates:
    1. text_gray: Texto limpo 'Revenge' em escala de cinza normalizada (agnóstico a agente, time e cor)
    2. full: Card completo de abate (opcional)
    3. arrow: Seta amarela indicadora esquerda
    """
    base_dir = os.path.dirname(template_path or "public/templates/meu_kill_template.png")
    templates = {
        "full": None,
        "text": None,
        "text_gray": None,
        "arrow": None,
    }

    t_full_path = template_path if (template_path and os.path.exists(template_path)) else os.path.join(base_dir, "meu_kill_template.png")
    if os.path.exists(t_full_path):
        templates["full"] = cv2.imread(t_full_path, cv2.IMREAD_COLOR)

    t_clean_path = os.path.join(base_dir, "revenge_text_clean.png")
    t_text_path = os.path.join(base_dir, "revenge_text_only.png")
    chosen_path = t_clean_path if os.path.exists(t_clean_path) else t_text_path
    if os.path.exists(chosen_path):
        t_img = cv2.imread(chosen_path, cv2.IMREAD_COLOR)
        templates["text"] = t_img
        templates["text_gray"] = cv2.cvtColor(t_img, cv2.COLOR_BGR2GRAY)

    t_arrow_path = os.path.join(base_dir, "revenge_arrow_template.png")
    if os.path.exists(t_arrow_path):
        templates["arrow"] = cv2.imread(t_arrow_path, cv2.IMREAD_COLOR)

    return templates


def processar_chunk_frames(video_path, templates, start_seconds=0.0, max_seconds=None,
                           limiar_full=LIMIAR_FULL_PADRAO, limiar_text=LIMIAR_TEXT_PADRAO,
                           limiar_arrow=LIMIAR_ARROW_PADRAO, debug=False):
    """
    Processa um trecho do vídeo frame a frame extraindo timestamps de abates confirmados.
    """
    t_full = templates.get("full")
    t_text_gray = templates.get("text_gray")
    t_arrow = templates.get("arrow")

    linhas_ativas = {}
    static_tracker = {}
    kills_detectadas = []
    frame_count = 0

    for tempo_atual_seg, roi in iter_frames(video_path, start_seconds=start_seconds, max_seconds=max_seconds, debug=debug):
        frame_count += 1
        y_detectados = []

        v_full = 0.0
        v_txt = 0.0
        v_arr = 0.0
        loc_y = None

        # 1. Template Matching em escala de cinza para o texto 'Revenge' (agnóstico a agente e cores de ataque/defesa)
        if t_text_gray is not None and roi.shape[0] >= t_text_gray.shape[0] and roi.shape[1] >= t_text_gray.shape[1]:
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            res_txt = cv2.matchTemplate(roi_gray, t_text_gray, cv2.TM_CCOEFF_NORMED)
            _, max_v, _, max_loc = cv2.minMaxLoc(res_txt)
            # O assassino fica no lado esquerdo do card (X < 340 na ROI de 560px, antes do ícone de arma)
            if max_loc[0] < 340:
                v_txt = float(max_v)
                if v_txt >= limiar_text:
                    loc_y = max_loc[1]

        # REQUISITO CRÍTICO: A kill DEVE ser estritamente de Revenge!
        # NUNCA contar abates de outros jogadores por semelhança de arma ou ruído de seta.
        is_revenge_kill = (v_txt >= limiar_text and loc_y is not None)

        if is_revenge_kill and loc_y is not None:
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

            duracao_visivel = static_tracker[matched_slot]["last_seen"] - static_tracker[matched_slot]["first_seen"]
            if duracao_visivel <= MAX_STATIC_DURATION_SEG:
                y_detectados.append(matched_slot)

        for slot_y in list(static_tracker.keys()):
            if (tempo_atual_seg - static_tracker[slot_y]["last_seen"]) > 2.0:
                del static_tracker[slot_y]

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
                    print(f"[REVENGE KILL DETECTADA] {tempo_atual_seg}s (slot Y: {y} | Txt: {v_txt:.2f}, Full: {v_full:.2f})", file=sys.stderr)

    return kills_detectadas


def detectar_abates(video_path, template_path=None, player_nick="Revenge",
                    limiar_full=LIMIAR_FULL_PADRAO, limiar_text=LIMIAR_TEXT_PADRAO,
                    limiar_arrow=LIMIAR_ARROW_PADRAO, start_seconds=0.0, max_seconds=None,
                    filter_deathmatch=True, debug=False):
    """
    Rastreia com máxima precisão e velocidade os abates de Revenge.
    Suporta escaneamento paralelo inteligente para streams e VODs longos.
    """
    if not video_path:
        return []

    templates = carregar_templates(template_path)
    is_stream = str(video_path).startswith("http://") or str(video_path).startswith("https://")
    total_dur = get_video_duration(video_path)

    # Se for stream ou vídeo longo e não tiver start_seconds explícito, usa escaneamento paralelo em chunks
    use_parallel = is_stream and (total_dur is not None) and (total_dur > 150.0) and (not start_seconds or float(start_seconds) == 0.0)

    if use_parallel:
        scan_limit = float(max_seconds) if (max_seconds and float(max_seconds) > 0) else total_dur
        scan_limit = min(scan_limit, total_dur)
        
        # Para vídeos com mais de meia hora (> 1800s), divide em blocos de 15 a 20 minutos
        # para utilizar os 8 GB de VRAM da placa sem inflar a memória RAM do sistema
        chunk_size = 900.0 if scan_limit > 1800.0 else 400.0
        chunks = []
        cur = 0.0
        while cur < scan_limit:
            dur = min(chunk_size, scan_limit - cur)
            chunks.append((cur, dur))
            cur += dur

        import concurrent.futures
        import gc
        all_kills = []
        # Limita a 2 workers simultâneos na GPU para manter a RAM do sistema abaixo de 150 MB
        max_workers = 2 if len(chunks) > 1 else 1
        if debug:
            print(f"[GPU ACCEL SCAN] Escaneando {scan_limit:.1f}s em {len(chunks)} blocos (CUDA RTX 3060 Ti, {max_workers} threads)...", file=sys.stderr)

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    processar_chunk_frames,
                    video_path,
                    templates,
                    start_seconds=c[0],
                    max_seconds=c[1],
                    limiar_full=limiar_full,
                    limiar_text=limiar_text,
                    limiar_arrow=limiar_arrow,
                    debug=debug
                )
                for c in chunks
            ]
            for f in concurrent.futures.as_completed(futures):
                try:
                    res = f.result()
                    all_kills.extend(res)
                    gc.collect()  # Libera buffers de RAM imediatamente
                except Exception as e:
                    if debug:
                        print(f"[CHUNK ERROR] {e}", file=sys.stderr)

        # Deduplicação pós-merge
        all_kills.sort()
        dedup_kills = []
        for k in all_kills:
            if not dedup_kills or (k - dedup_kills[-1]) >= 1.2:
                dedup_kills.append(k)
        return agrupar_highlights(dedup_kills, video_path=video_path, filter_deathmatch=filter_deathmatch, debug=debug)

    # Modo sequencial (para vídeos curtos ou arquivos locais em SSD)
    kills = processar_chunk_frames(
        video_path,
        templates,
        start_seconds=start_seconds,
        max_seconds=max_seconds,
        limiar_full=limiar_full,
        limiar_text=limiar_text,
        limiar_arrow=limiar_arrow,
        debug=debug
    )
    kills.sort()
    dedup_kills = []
    for k in kills:
        if not dedup_kills or (k - dedup_kills[-1]) >= 1.2:
            dedup_kills.append(k)
    return agrupar_highlights(dedup_kills, video_path=video_path, filter_deathmatch=filter_deathmatch, debug=debug)


def extrair_frame_em_segundo(video_path, seg):
    """Extrai um único frame em BGR no segundo especificado para validação de HUD."""
    if not video_path:
        return None
    try:
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_POS_MSEC, float(seg) * 1000.0)
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                return frame
    except Exception:
        pass

    try:
        ffmpeg_bin = os.environ.get("FFMPEG_PATH", "ffmpeg")
        cmd = [
            ffmpeg_bin,
            '-hide_banner', '-loglevel', 'error',
            '-hwaccel', 'cuda',
        ]
        if str(video_path).startswith(('http://', 'https://')):
            cmd.extend(['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5'])
        cmd.extend([
            '-ss', str(seg),
            '-i', str(video_path),
            '-vframes', '1',
            '-f', 'image2pipe',
            '-vcodec', 'png',
            'pipe:1'
        ])
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        raw, _ = proc.communicate(timeout=15)
        if raw:
            arr = np.frombuffer(raw, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is not None:
                return frame
    except Exception:
        pass
    return None


def classificar_modo_hud(frame):
    """
    Classifica se um frame de gameplay de Valorant é de modo 5v5
    (Competitivo / Sem Classificação) ou de Mata-Mata (Deathmatch / TDM).
    
    Critérios Visuais em 1080p:
    1. Card de Jogador Externo (X: 478..502, Y: 24..48):
       - No Mata-Mata: Há 12 a 14 jogadores no topo. O 6º jogador da esquerda fica
         posicionado em X: 420..500 e possui a caixinha preta de pontuação individual.
       - No 5v5: Existem estritamente 5 jogadores por time (X: 590..865). A região X: 478..502
         é mundo aberto/céu e NUNCA contém caixinha preta de jogador.
    2. Barra de Habilidades no rodapé central (X: 800..1120, Y: 960..1070):
       - No 5v5: Habilidades ativas e contornos estruturados.
       - No Mata-Mata: Habilidades 100% desativadas e removidas pela Riot.
    """
    if frame is None:
        return 'UNKNOWN'
    h, w = frame.shape[:2]
    # Se o frame for vertical 9:16 (ex: vídeo já renderizado para Shorts)
    if h > w:
        center_y1 = int(round((h - w) / 2.0))
        center_layer = frame[center_y1:center_y1 + w, 0:w]
        canvas_16_9 = np.zeros((1080, 1920, 3), dtype=np.uint8)
        offset_x = int(round((1920 - w) / 2.0))
        if center_layer.shape[0] != 1080 or center_layer.shape[1] != 1080:
            center_layer = cv2.resize(center_layer, (1080, 1080))
        canvas_16_9[:, offset_x:offset_x + 1080] = center_layer
        frame = canvas_16_9
    elif (w, h) != (1920, 1080):
        frame = cv2.resize(frame, (1920, 1080), interpolation=cv2.INTER_LINEAR)

    # 1. Checa a caixinha preta do 6º jogador externo (só existe no Mata-Mata com 12-14 players)
    sb = frame[24:48, 478:502]
    gray_sb = cv2.cvtColor(sb, cv2.COLOR_BGR2GRAY)
    outer_player_black = np.count_nonzero(gray_sb < 25) / gray_sb.size

    # 2. Checa as habilidades no rodapé central
    cqex_roi = frame[1040:1070, 800:1120]
    gray_cqex = cv2.cvtColor(cqex_roi, cv2.COLOR_BGR2GRAY)
    cqex_white = np.count_nonzero(gray_cqex >= 190)

    qe_roi = frame[920:958, 880:1020]
    gray_qe = cv2.cvtColor(qe_roi, cv2.COLOR_BGR2GRAY)
    qe_white = np.count_nonzero(gray_qe >= 200)

    ab_edges = cv2.Canny(frame[960:1040, 800:1120], 50, 150)
    ab_edge_count = np.count_nonzero(ab_edges)

    # Decisão:
    # Se há o card do 6º jogador (Mata-Mata) ou ausência completa de habilidades -> MATA_MATA
    is_deathmatch = (outer_player_black > 0.20) or (cqex_white < 80 and qe_white < 80 and ab_edge_count < 300)

    return 'MATA_MATA' if is_deathmatch else 'COMPETITIVE_OR_UNRATED'


def agrupar_highlights(tempos_kills, janela_seg=40, min_kills=3, pre_margin=4.0, post_margin=3.5,
                       video_path=None, filter_deathmatch=True, debug=False):
    """
    Agrupa abates ocorridos dentro da mesma rodada (~40s) em clipes épicos:
    - 3 abates: 3K
    - 4 abates: 4K
    - 5+ abates: ACE
    
    Aplica regra de validação de modo de jogo:
    - Descarta automaticamente clipes de Mata-Mata (Deathmatch / TDM).
    - Permite apenas partidas Sem Classificação (Unrated) ou Competitivas (Ranked).
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
        # Deduplica timestamps da mesma kill que desliza no killfeed (< 1.2s)
        dedup_c = []
        for t_k in c:
            if not dedup_c or (t_k - dedup_c[-1]) >= 1.2:
                dedup_c.append(t_k)
        c = dedup_c
        count = len(c)

        if count < min_kills:
            continue
        
        # 1. Regra de Cadência anti Mata-Mata:
        # No 5v5 existem apenas 5 adversários no time inimigo.
        # Mesmo com Ressurreição da Sage, o teto físico é 6 kills por round.
        # Se um cluster tiver 7+ kills em uma única sequência, é 100% mata-mata (respawns contínuos).
        if filter_deathmatch and count > 6:
            if debug:
                print(f"[FILTRO MATA-MATA] Cluster descartado: {count} kills em {c[0]}s (excede limite de 5v5)", file=sys.stderr)
            continue

        inicio = max(0.0, round(c[0] - pre_margin, 2))
        fim = round(c[-1] + post_margin, 2)
        duracao = round(fim - inicio, 2)

        # 2. Validação Visual de HUD do Modo de Jogo por Consenso Multi-Amostras:
        confirmed_frame = None
        if filter_deathmatch and video_path:
            sample_offsets = [inicio + 1.5, c[0], c[-1]]
            dm_votes = 0
            valid_samples = 0

            for s_time in sample_offsets:
                sample_t = max(0.0, float(s_time))
                frame_sample = extrair_frame_em_segundo(video_path, sample_t)
                if frame_sample is not None:
                    valid_samples += 1
                    mode = classificar_modo_hud(frame_sample)
                    if mode == 'MATA_MATA':
                        dm_votes += 1
                    else:
                        confirmed_frame = frame_sample

            # No 5v5 NUNCA existe a barra de 12 jogadores do Mata-Mata.
            # Se houver qualquer voto para Mata-Mata (ou a maioria), o corte é descartado.
            if valid_samples > 0 and dm_votes >= 1:
                if debug:
                    print(f"[FILTRO MATA-MATA] Corte em {inicio}s-{fim}s descartado: HUD identificado como Mata-Mata ({dm_votes}/{valid_samples} frames).", file=sys.stderr)
                continue

        # Gera thumbnail compacto em memória (WebP base64, ~3KB) sem salvar nenhum JPG no disco
        thumb_b64 = None
        if confirmed_frame is not None:
            try:
                import base64
                small_prev = cv2.resize(confirmed_frame, (320, 180), interpolation=cv2.INTER_AREA)
                ok, enc = cv2.imencode('.webp', small_prev, [cv2.IMWRITE_WEBP_QUALITY, 65])
                if ok:
                    thumb_b64 = f"data:image/webp;base64,{base64.b64encode(enc).decode('ascii')}"
            except Exception:
                pass

        tipo = "3K"
        if count == 4:
            tipo = "4K"
        elif count >= 5:
            tipo = "ACE"

        resultados.append({
            "id": f"val_cut_{len(resultados) + 1}_{tipo.lower()}_{int(inicio)}s",
            "tipo": tipo,
            "inicio_seg": inicio,
            "fim_seg": fim,
            "duracao": duracao,
            "tempos_kills_seg": c,
            "modo": "COMPETITIVO_OU_SEM_CLASS",
            "game_mode": "COMPETITIVE_OR_UNRATED",
            "is_competitive_or_unrated": True,
            "thumbnail": thumb_b64,
        })

    return resultados


def main():
    parser = argparse.ArgumentParser(description="Detector Refinado de Abates do Valorant (Revenge)")
    parser.add_argument("video_path", help="Caminho do arquivo de vídeo local ou URL do stream")
    parser.add_argument("--template", default="public/templates/meu_kill_template.png", help="Caminho do template do nickname")
    parser.add_argument("--player-nick", default="Revenge", help="Nickname do jogador no Valorant")
    parser.add_argument("--limiar", type=float, default=LIMIAR_FULL_PADRAO, help="Limiar de correlação para card completo")
    parser.add_argument("--limiar-text", type=float, default=None, help="Limiar de correlação para texto Revenge")
    parser.add_argument("--start-seconds", type=float, default=0.0, help="Segundo inicial para começar a escanear")
    parser.add_argument("--max-seconds", type=float, default=None, help="Limite máximo de segundos para escanear")
    parser.add_argument("--filter-deathmatch", action="store_true", default=True, help="Filtra e descarta clipes de Mata-Mata")
    parser.add_argument("--no-filter-deathmatch", dest="filter_deathmatch", action="store_false", help="Desativa o filtro de Mata-Mata")
    parser.add_argument("--debug", action="store_true", help="Ativa logs detalhados na saída de erro")

    args = parser.parse_args()

    limiar_txt = args.limiar_text if args.limiar_text is not None else min(float(args.limiar), LIMIAR_TEXT_PADRAO)

    resultados = detectar_abates(
        args.video_path,
        template_path=args.template,
        player_nick=args.player_nick,
        limiar_full=args.limiar,
        limiar_text=limiar_txt,
        start_seconds=args.start_seconds,
        max_seconds=args.max_seconds,
        filter_deathmatch=args.filter_deathmatch,
        debug=args.debug
    )

    print(json.dumps(resultados, ensure_ascii=False))


if __name__ == "__main__":
    main()
