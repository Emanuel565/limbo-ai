# Social Media AI Cockpit & Revenge Kill Hunter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Limbo.AI into an autonomous Social Media Agent for Valorant player **Revenge**, fixing the broken header, resolving empty queue data binding, refining the Kill Hunter to track the "Revenge" nickname across all agents, and making all user interface actions 100% operational with magnetic hooks and viral captions.

**Architecture:** 
1. **Frontend Cockpit:** Single-page reactive dashboard with responsive header pills, instant queue hydration (`data.queue || data.posts`), and smartphone 9:16 modal preview.
2. **Vision Engine (Python):** `detector_kills.py` upgraded with a dedicated "Revenge" player name recognition filter and color thresholding, tracking kills regardless of which agent is played.
3. **Social Media AI Agent:** Intelligent title and caption generator tuned for high-retention TikTok/Reels/Shorts, personalizing copy around player **Revenge** with optimal publishing slots and hashtag clusters.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, Python OpenCV, FFmpeg + NVIDIA NVENC (RTX 3060 Ti), Node.js.

---

## Global Constraints
- Target Hardware: NVIDIA GeForce RTX 3060 Ti with `h264_nvenc` encoding.
- Audio Rule: Strict 100% original gameplay audio (never overlay BGM unless requested).
- Player Identity: Valorant nickname is **Revenge**. All AI copy and killfeed matching must prioritize this identity.
- No Redundant Pages: All primary actions live inside the unified Cockpit dashboard.

---

## Tasks

### Task 1: Fix Header Responsiveness & Prevent Collisions
**Files:**
- Modify: `components/Header.tsx`
- Test: Verify header alignment in browser viewport sizes from 768px to 1440px.

- [x] Optimize navigation pills in `components/Header.tsx`:
  - Change labels to concise, punchy terms: `Estúdio`, `Fila`, `Métricas`, `Trends`.
  - Add live counter badge to the `Fila` pill (`queueList.length`).
  - Set hardware status badge (`RTX 3060 Ti`) to `hidden xl:flex` to prevent tablet and laptop overflow.
- [x] Ensure mobile menu / wrapping behavior maintains `rounded-full` integrity without text collisions.
- [x] Test layout rendering at 768px, 1024px, and 1280px widths.

---

### Task 2: Fix Queue Data Binding & Populate Verified 9:16 Cuts
**Files:**
- Modify: `components/SocialPipelineStudio.tsx:90-120`
- Modify: `data/scheduled-posts.json`
- Test: `curl http://localhost:3000/api/schedule`

- [x] In `SocialPipelineStudio.tsx` (`fetchQueue`), handle both `data.queue` and `data.posts` seamlessly:
  ```typescript
  const list = Array.isArray(data.queue) ? data.queue : (Array.isArray(data.posts) ? data.posts : []);
  setQueueList(list);
  ```
- [x] Populate `data/scheduled-posts.json` with ready, verified cuts from `public/generated/` (e.g., `val_cut_1_4k_169s.mp4`, `val_cut_12_3k_934s.mp4`) so the user immediately sees working clips in the queue upon launch.
- [x] Verify that clicking `▶ VER CORTE 9:16` opens the smartphone preview modal and plays the clip with audio.

---

### Task 3: Upgrade Kill Hunter to Track Nickname "Revenge"
**Files:**
- Create: `public/templates/revenge_name_template.png` (isolated template of the text "Revenge")
- Modify: `tools/detector_kills.py:30-180`
- Modify: `tools/detector-kills-wrapper.js`
- Test: `node scratch/test_revenge_hunter.cjs`

- [x] Crop and save an isolated template for the text `Revenge` from the Killfeed card.
- [x] In `tools/detector_kills.py`:
  - Add `--player-nick` argument (default: `"Revenge"`).
  - Add targeted matching on the killer name region of the killfeed card (offset from agent icon).
  - Add bounding box filter that searches specifically for the player's teal/cyan killfeed tag and name string.
- [x] Run benchmark on user's live stream clip to ensure only kills made by **Revenge** are captured.

---

### Task 4: AI Social Media Manager (Viral Hooks, Captions & Prime Time)
**Files:**
- Create: `tools/social-media-agent.js`
- Modify: `app/api/valorant-cutter/render/route.ts`
- Modify: `tools/gerador_shorts.js`
- Test: Unit test `tools/social-media-agent.test.js`

- [x] Build `tools/social-media-agent.js` with Social Media AI logic:
  - Generate high-CTR titles tailored to **Revenge** (e.g., *"ESSE 4K DO REVENGE CALOU O LOBBY 🔥"*, *"CLUTCH 1V4 IMPOSSÍVEL DO REVENGE 👑"*, *"A MIRA DO REVENGE TÁ EM DIA 🎯"*).
  - Generate full multi-platform captions with hashtags (#valorantbrasil #revenge #clutch #vct).
  - Compute prime time slots (11:30, 15:45, 18:30, 21:15) tailored for Valorant gamers.
  - Audit retention potential (Viral Score based on pacing and hook presence).
- [x] Connect `social-media-agent.js` to the render and scheduling pipeline so all cuts get personalized social media copy automatically.

---

### Task 5: End-to-End User Action Testing & Interface Polish
**Files:**
- Modify: `components/SocialPipelineStudio.tsx`
- Test: Browser interaction testing on all interactive elements.

- [x] Verify all user actions in the Cockpit:
  - Input stream URL or select `raw_gameplays/` file.
  - Click "Rastrear Kills & Destaques" -> renders detected highlight cards.
  - Click "Renderizar Selecionados" -> streams through NVENC and inserts into the queue below.
  - Click "VER CORTE 9:16" -> smartphone modal plays video and audio.
  - Click "Aprovar/Revisar" -> updates AI approval badge.
  - Click "Métricas & Chaves" -> toggles collapsible drawer smoothly.
- [x] Verify console clean of errors and warnings.
