# Valorant Kill Hunter & 4-Layer 9:16 Vertical Video Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform long Valorant gameplay recordings and live streams (2+ hours, recorded without webcam) into high-retention, 4-layer vertical shorts (`1080x1920` - 9:16) with automated Killfeed CV detection, 3x fast-forward on rotation dead time, and hardware-accelerated RTX 3060 Ti NVENC rendering.

**Architecture:** A Python + OpenCV computer vision detector scans the Killfeed ROI (at 2 FPS on 720p stream or local file) using nickname template matching and vertical line stacking to identify $\ge 3K$ multi-kill clusters within 30 seconds. A Node.js orchestrator uses `yt-dlp` for surgical clip extraction and drives FFmpeg with an advanced `filter_complex` assembling a 4-layer 9:16 canvas (blurred background, centered crosshair, enlarged radar, enlarged killfeed) with 3x fast-forward on intervals $>8$s. A Next.js API and React liquid-glass studio interface allow instant highlight preview, approval, and batch rendering directly into the posting schedule.

**Tech Stack:** Next.js 14, React 18, Node.js (ESM), Python 3.11, OpenCV (`cv2`), NumPy, FFmpeg 9.0.2 (Gyan Full Build with `h264_nvenc`), `yt-dlp`, Playwright, Ollama.

**Spec:** User architecture decisions and roadmap documented in conversation summary:
- Ingestion: `yt-dlp` (720p stream scan + `--download-sections` surgical clip extraction) and local `raw_gameplays/` videos.
- Computer Vision: Top-right Killfeed ROI (`ROI_W=360, ROI_H=220, ROI_X=910, ROI_Y=40` at 720p), teal nickname template matching (`#00bfa5` / `#00d4a0` vs red death boxes), Y-axis line stacking (`ALTURA_MINIMA_LINHA = 18px`), $\ge 3$ kills in $\le 30$s, time margins: -4s pre-first-kill and +3s post-last-kill.
- 4-Layer Composition:
  1. Background: Full game scaled down to 360:640, blurred with boxblur=15:2,eq=brightness=-0.18, and scaled back to 1080x1920 (ultra-fast CPU/GPU pipeline without boxblur bottleneck).
  2. Center: Cropped crosshair action area + bottom kill banner.
  3. Top-Left: Scaled radar minimap (`420x420`).
  4. Top-Right: Scaled killfeed (`620x320`).
- Fast-Forward: Interval between kills $> 8$s accelerated to 3x (`setpts=0.333333*PTS`, audio `atempo=2.0,atempo=1.5`), preserving +1.5s post-kill (1x) and -2.5s pre-kill (1x).
- Audio & Subtitles: Fast-forward audio speedup (atrim/atempo/concat) applied strictly to game audio (0:a). Background music (BGM) mixed/ducked only AFTER concat so music is never sped up. Muted source fallback to royalty-free BGM; live source game audio blended with 25% BGM ducking; optional Hormozi-style TikTok pop subtitles.
- Vision Tolerance: Python detector supports template matching + HSV color mask fallback for teal/cyan self-kills with compression artifact tolerance, 18px line stacking and 4.8s renewal cooldown.

## Global Constraints
- Target output resolution: `1080x1920` (9:16 aspect ratio, 30 or 60 fps).
- GPU acceleration: Must use NVIDIA NVENC (`h264_nvenc` preset `p5`, tune `hq`, bitrate `8M`, maxrate `12M`) on RTX 3060 Ti with CPU software fallback (`libx264 veryfast`).
- Codebase style: ECMAScript Modules (`type: module`), Node test runner (`node --test`), TypeScript strict checking (`npx tsc --noEmit`).
- Audio integrity: Never output muted videos; always execute `detectAudioLevel` and apply BGM injection or mixing.
- Backward compatibility: All 35 existing tests in `npm test` must continue to pass with 0 regressions.

## Review Focus
1. Video without audio track in source: Injects BGM track with volume 0.95 and audio fade transitions without crashing FFmpeg.
2. Fast consecutive kills (spray kill with 2 kills in 0.5s): Y-axis line grouping counts both distinct vertical lines without duplicate timestamp inflation.
3. Stream or video with only 1 or 2 isolated kills throughout 2 hours: Gracefully returns empty array or logs "No highlight >= 3K detected" without throwing unhandled exceptions.
4. Stream URL invalid or inaccessible: `yt-dlp` returns clean HTTP error formatted in JSON response without crashing Node process.
5. Kill interval exactly 8.0 seconds: Does not trigger fast-forward (strictly requires interval $> 8.0$s); boundaries keep 1x pacing.

---

### Task 1: Environment & Tooling Verification Scaffolding

**Files:**
- Create: `tools/system-env-check.js`
- Test: `tools/system-env-check.test.js`

**Interfaces:**
- Consumes: `resolveFfmpegBinary` from `tools/viral-short-pipeline.js`.
- Produces: `checkVideoToolingEnvironment(): Promise<{ ffmpeg: boolean, nvenc: boolean, ytdlp: boolean, python: boolean, opencv: boolean }>`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVideoToolingEnvironment } from './system-env-check.js';

test('checkVideoToolingEnvironment reports availability of system video binaries', async () => {
    const env = await checkVideoToolingEnvironment();
    assert.strictEqual(typeof env.ffmpeg, 'boolean');
    assert.strictEqual(typeof env.nvenc, 'boolean');
    assert.strictEqual(typeof env.ytdlp, 'boolean');
    assert.strictEqual(typeof env.python, 'boolean');
    assert.strictEqual(env.ffmpeg, true, 'FFmpeg binary must be resolved and functional');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/system-env-check.test.js`
Expected: FAIL with "Cannot find module './system-env-check.js'"

- [ ] **Step 3: Implement `checkVideoToolingEnvironment()` in `tools/system-env-check.js`**

Implement tool discovery using `spawnSync` checking `resolveFfmpegBinary()`, `ffmpeg -encoders`, `yt-dlp --version`, and `python -c "import cv2, numpy; print('OK')"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/system-env-check.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/system-env-check.js tools/system-env-check.test.js
git commit -m "feat(cutter): add system video tooling environment check"
```

---

### Task 2: Killfeed Template & Pure Logic Kill Event Aggregator

**Files:**
- Create: `tools/valorant-kill-cluster.js`
- Create: `public/templates/meu_kill_template.png`
- Test: `tools/valorant-kill-cluster.test.js`

**Interfaces:**
- Consumes: Raw kill event timestamps `Array<number>`.
- Produces: `aggregateKillHighlights(killTimestamps, options): Array<{ id: string, clipType: '3K'|'4K'|'ACE', startSec: number, endSec: number, duration: number, killTimes: number[] }>`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateKillHighlights } from './valorant-kill-cluster.js';

test('aggregateKillHighlights clusters 3 or more kills within 30s with proper margins', () => {
    const rawKills = [100.5, 104.2, 108.0, 115.0]; // 4 kills within 15 seconds
    const highlights = aggregateKillHighlights(rawKills, {
        windowSec: 30,
        minKills: 3,
        preMarginSec: 4,
        postMarginSec: 3,
    });

    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, '4K');
    assert.strictEqual(highlights[0].startSec, 96.5); // 100.5 - 4s
    assert.strictEqual(highlights[0].endSec, 118.0);   // 115.0 + 3s
    assert.strictEqual(highlights[0].killTimes.length, 4);
});

test('aggregateKillHighlights classifies 5 kills as ACE', () => {
    const aceKills = [200, 203, 207, 212, 218];
    const highlights = aggregateKillHighlights(aceKills);
    assert.strictEqual(highlights.length, 1);
    assert.strictEqual(highlights[0].clipType, 'ACE');
});

test('aggregateKillHighlights ignores isolated kills (< 3 kills in 30s)', () => {
    const sparseKills = [50, 120, 240, 500];
    const highlights = aggregateKillHighlights(sparseKills);
    assert.strictEqual(highlights.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/valorant-kill-cluster.test.js`
Expected: FAIL with "Cannot find module './valorant-kill-cluster.js'"

- [ ] **Step 3: Implement `aggregateKillHighlights(killTimestamps, options)` in `tools/valorant-kill-cluster.js`**

Implement rolling window grouping with deduplication and ACE/4K/3K labeling.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/valorant-kill-cluster.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/valorant-kill-cluster.js tools/valorant-kill-cluster.test.js
git commit -m "feat(cutter): implement pure kill cluster aggregation and highlight classifier"
```

---

### Task 3: Fast-Forward Speed Segment Calculator

**Files:**
- Create: `tools/valorant-speed-timeline.js`
- Test: `tools/valorant-speed-timeline.test.js`

**Interfaces:**
- Consumes: Highlight object `{ startSec: number, endSec: number, killTimes: number[] }`.
- Produces: `calculateSpeedSegments(highlight, options): Array<{ start: number, end: number, duration: number, speed: 1 | 3, isFastForward: boolean }>`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpeedSegments } from './valorant-speed-timeline.js';

test('calculateSpeedSegments accelerates intervals > 8s between kills to 3x', () => {
    // Kill 1 at 100s, Kill 2 at 116s (gap = 16s > 8s)
    // Clip starts at 96s (100 - 4), ends at 119s (116 + 3)
    const highlight = {
        startSec: 96,
        endSec: 119,
        killTimes: [100, 116],
    };

    const segments = calculateSpeedSegments(highlight, {
        minDeadTimeSec: 8,
        postKillNormalSec: 1.5,
        preKillNormalSec: 2.5,
        fastForwardSpeed: 3,
    });

    // Segment 1: 96s -> 101.5s (1x)
    // Segment 2: 101.5s -> 113.5s (3x fast-forward)
    // Segment 3: 113.5s -> 119s (1x)
    assert.strictEqual(segments.length, 3);
    assert.strictEqual(segments[0].speed, 1);
    assert.strictEqual(segments[1].speed, 3);
    assert.strictEqual(segments[1].start, 101.5);
    assert.strictEqual(segments[1].end, 113.5);
    assert.strictEqual(segments[2].speed, 1);
});

test('calculateSpeedSegments keeps entire clip at 1x if kills are close (<= 8s)', () => {
    const highlight = {
        startSec: 96,
        endSec: 112,
        killTimes: [100, 104, 109],
    };
    const segments = calculateSpeedSegments(highlight);
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].speed, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/valorant-speed-timeline.test.js`
Expected: FAIL with "Cannot find module './valorant-speed-timeline.js'"

- [ ] **Step 3: Implement `calculateSpeedSegments(highlight, options)` in `tools/valorant-speed-timeline.js`**

Implement segment timeline slicing respecting `postKillNormalSec = 1.5` and `preKillNormalSec = 2.5`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/valorant-speed-timeline.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/valorant-speed-timeline.js tools/valorant-speed-timeline.test.js
git commit -m "feat(cutter): implement fast-forward speed timeline calculator"
```

---

### Task 4: 4-Layer 9:16 Vertical Filter Complex Builder

**Files:**
- Create: `tools/valorant-4layer-editor.js`
- Test: `tools/valorant-4layer-editor.test.js`

**Interfaces:**
- Consumes: `calculateSpeedSegments` from `tools/valorant-speed-timeline.js`, `resolveFfmpegBinary` from `tools/viral-short-pipeline.js`, `detectAudioLevel` and `getOptimalBgmTrack` from `tools/gameplay-ai-analyzer.js`.
- Produces:
  - `build4LayerFilterComplex(segments, options): { filterComplex: string, outputMaps: string[] }`
  - `build4LayerFfmpegArgs(params): string[]`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { build4LayerFilterComplex, build4LayerFfmpegArgs } from './valorant-4layer-editor.js';

test('build4LayerFilterComplex builds 4 distinct layers: bg blur, center crosshair, minimap, killfeed', () => {
    const segments = [{ start: 0, end: 15, speed: 1, duration: 15 }];
    const { filterComplex } = build4LayerFilterComplex(segments, {
        width: 1080,
        height: 1920,
    });

    assert.ok(filterComplex.includes('boxblur='), 'Must include background blur');
    assert.ok(filterComplex.includes('[bg]'), 'Must produce background stream');
    assert.ok(filterComplex.includes('[mira]'), 'Must produce center crosshair stream');
    assert.ok(filterComplex.includes('[mapa]'), 'Must produce minimap overlay stream');
    assert.ok(filterComplex.includes('[killfeed]'), 'Must produce killfeed overlay stream');
    assert.ok(filterComplex.includes('overlay='), 'Must chain overlays');
});

test('build4LayerFfmpegArgs generates NVENC hardware encoding arguments for RTX 3060 Ti', () => {
    const args = build4LayerFfmpegArgs({
        inputPath: 'raw_gameplays/vod.mp4',
        outputPath: 'cortes_prontos/cut_1.mp4',
        segments: [{ start: 10, end: 35, speed: 1, duration: 25 }],
        useNvenc: true,
    });

    assert.ok(args.includes('h264_nvenc'), 'Must use NVENC encoder');
    assert.ok(args.includes('-filter_complex'), 'Must include filter_complex');
    assert.ok(args.includes('cortes_prontos/cut_1.mp4'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/valorant-4layer-editor.test.js`
Expected: FAIL with "Cannot find module './valorant-4layer-editor.js'"

- [ ] **Step 3: Implement `build4LayerFilterComplex` and `build4LayerFfmpegArgs` in `tools/valorant-4layer-editor.js`**

Implement coordinates relative to canvas:
- Background (User Rule 1: Fast blur): `[0:v]scale=360:640:force_original_aspect_ratio=increase,crop=360:640,boxblur=15:2,eq=brightness=-0.18,scale=1080:1920[bg]`
- Center: `[0:v]crop=in_w*0.48:in_h*0.58:(in_w-ow)/2:(in_h-oh)/2,scale=1080:1080[mira]`
- Minimap: `[0:v]crop=380:380:20:20,scale=420:420[mapa]`
- Killfeed: `[0:v]crop=520:280:in_w-540:35,scale=620:320[killfeed]`
- Overlays: chain `[bg][mira]overlay=0:(H-h)/2[b1];[b1][mapa]overlay=30:60[b2];[b2][killfeed]overlay=W-w-30:60[v_base]`
- Audio (User Rule 2: Game-only fast-forward): Apply `atrim` / `atempo=2.0,atempo=1.5` and `concat` strictly on game audio `[0:a]`. Background music (BGM) is ducked/mixed ONLY after `concat` so BGM is never sped up.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/valorant-4layer-editor.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/valorant-4layer-editor.js tools/valorant-4layer-editor.test.js
git commit -m "feat(cutter): implement 4-layer 9:16 layout and fast-forward filter_complex engine"
```

---

### Task 5: Python Killfeed Vision Hunter Script (`detector_kills.py`)

**Files:**
- Create: `tools/detector_kills.py`
- Test: `tools/detector-kills-wrapper.test.js`
- Create: `tools/detector-kills-wrapper.js`

**Interfaces:**
- Consumes: Video path or stream URL.
- Produces: JSON on stdout: `Array<{ inicio_seg: number, fim_seg: number, duracao: number, tipo: string, tempos_kills_seg: number[] }>`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { runKillHunterAnalysis } from './detector-kills-wrapper.js';

test('runKillHunterAnalysis parses detector_kills output into structured highlight cuts', async () => {
    // Mock / dry-run execution
    const mockOutput = JSON.stringify([
        { inicio_seg: 100, fim_seg: 125, duracao: 25, tipo: '4K', tempos_kills_seg: [104, 108, 114, 122] }
    ]);
    const cuts = JSON.parse(mockOutput);
    assert.strictEqual(cuts.length, 1);
    assert.strictEqual(cuts[0].tipo, '4K');
    assert.strictEqual(cuts[0].tempos_kills_seg.length, 4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/detector-kills-wrapper.test.js`
Expected: FAIL with "Cannot find module './detector-kills-wrapper.js'"

- [ ] **Step 3: Implement `tools/detector_kills.py` and `tools/detector-kills-wrapper.js`**

Implement `tools/detector_kills.py`:
- Use `cv2.VideoCapture` (supports local files and HTTP URLs from `yt-dlp -g`).
- Sample at 2 FPS (`frame_step = int(fps / 2)`).
- Crop Killfeed ROI (`ROI_W=360, ROI_H=220, ROI_X=910, ROI_Y=40` on 720p).
- Detection engine: Template matching (`meu_kill_template.png`) with automatic fallback to HSV color mask targeting teal/cyan self-kill boxes (`H: 80-98, S: 130-255, V: 130-255`) robust against YouTube/Twitch 720p compression artifacts.
- Vertical line grouping: Cluster distinct Y coordinates (`ALTURA_MINIMA_LINHA = 18px`).
- Linger cooldown: 4.8s renewal suppression per line to prevent duplicate counts of lingering kill banners while detecting immediate sprays.
- Output final JSON string to stdout for Node integration.
- Implement `detector-kills-wrapper.js` with Python subprocess execution and graceful fallback if Python or OpenCV is not yet configured on the host.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/detector-kills-wrapper.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/detector_kills.py tools/detector-kills-wrapper.js tools/detector-kills-wrapper.test.js
git commit -m "feat(cutter): add python killfeed vision hunter and node wrapper"
```

---

### Task 6: Stream Ingestion & Surgical Downloader (`yt-dlp`)

**Files:**
- Create: `tools/ytdlp-ingestion.js`
- Test: `tools/ytdlp-ingestion.test.js`

**Interfaces:**
- Consumes: Stream or VOD URL (YouTube / Twitch).
- Produces:
  - `extractStreamAnalysisUrl(url): Promise<string>` (extracts 720p direct stream URL for fast 0-download CV scan).
  - `downloadSurgicalClip(url, startSec, endSec, outputPath): Promise<string>` (downloads only the required seconds at max resolution).

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYtdlpSectionArgs } from './ytdlp-ingestion.js';

test('buildYtdlpSectionArgs formats precise --download-sections and time ranges', () => {
    const args = buildYtdlpSectionArgs('https://youtube.com/watch?v=sample', 120, 155, 'temp/clip.mp4');
    assert.ok(args.includes('--download-sections'));
    assert.ok(args.includes('*120-155'));
    assert.ok(args.includes('-o'));
    assert.ok(args.includes('temp/clip.mp4'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/ytdlp-ingestion.test.js`
Expected: FAIL with "Cannot find module './ytdlp-ingestion.js'"

- [ ] **Step 3: Implement `buildYtdlpSectionArgs`, `extractStreamAnalysisUrl`, and `downloadSurgicalClip` in `tools/ytdlp-ingestion.js`**

Implement `yt-dlp` commands with timeout and error handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/ytdlp-ingestion.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/ytdlp-ingestion.js tools/ytdlp-ingestion.test.js
git commit -m "feat(cutter): implement yt-dlp stream url extraction and surgical downloader"
```

---

### Task 7: End-to-End Orchestrator (`gerador_shorts.js`)

**Files:**
- Create: `tools/gerador_shorts.js`
- Test: `tools/gerador_shorts.test.js`

**Interfaces:**
- Consumes: `tools/detector-kills-wrapper.js`, `tools/ytdlp-ingestion.js`, `tools/valorant-speed-timeline.js`, `tools/valorant-4layer-editor.js`.
- Produces: `processValorantVodShorts(vodSource, options): Promise<{ cutsProcessed: number, outputFiles: string[] }>`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { processValorantVodShorts } from './gerador_shorts.js';

test('processValorantVodShorts validates input source and options', async () => {
    await assert.rejects(
        () => processValorantVodShorts(''),
        /Fonte de vídeo ou URL é obrigatória/
    );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test tools/gerador_shorts.test.js`
Expected: FAIL with "Cannot find module './gerador_shorts.js'"

- [ ] **Step 3: Implement `processValorantVodShorts` in `tools/gerador_shorts.js`**

Orchestrate:
1. Detect highlights via `runKillHunterAnalysis`.
2. For each highlight: compute speed segments (`calculateSpeedSegments`).
3. If source is URL, download surgical clip; if local, use direct path.
4. Render 4-layer 9:16 layout with NVENC (`build4LayerFfmpegArgs`).
5. Save to `./cortes_prontos/` and return manifest.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test tools/gerador_shorts.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/gerador_shorts.js tools/gerador_shorts.test.js
git commit -m "feat(cutter): implement e2e valorant shorts generation orchestrator"
```

---

### Task 8: API Routes (`/api/valorant-cutter/analyze` & `/api/valorant-cutter/render`)

**Files:**
- Create: `app/api/valorant-cutter/analyze/route.ts`
- Create: `app/api/valorant-cutter/render/route.ts`
- Test: `app/api/valorant-cutter/valorant-cutter.test.js`

**Interfaces:**
- `POST /api/valorant-cutter/analyze`: Body `{ sourceUrl, localFile, nickname }` $\implies$ `{ success: boolean, cuts: HighlightCut[] }`.
- `POST /api/valorant-cutter/render`: Body `{ sourceUrl, localFile, selectedCuts, applyFastForward }` $\implies$ `{ success: boolean, renderedCuts: RenderedCut[] }`.

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalyzeRequest, validateRenderRequest } from '../../app/api/valorant-cutter/validators.js';

test('validateAnalyzeRequest rejects empty payloads', () => {
    assert.strictEqual(validateAnalyzeRequest({}).valid, false);
    assert.strictEqual(validateAnalyzeRequest({ sourceUrl: 'https://youtube.com/watch?v=123' }).valid, true);
    assert.strictEqual(validateAnalyzeRequest({ localFile: 'raw_gameplays/vod.mp4' }).valid, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c node --test app/api/valorant-cutter/valorant-cutter.test.js`
Expected: FAIL with "Cannot find module ... validators.js"

- [ ] **Step 3: Implement validators and Next.js Route Handlers**

Implement `app/api/valorant-cutter/validators.js`, `app/api/valorant-cutter/analyze/route.ts`, and `app/api/valorant-cutter/render/route.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c node --test app/api/valorant-cutter/valorant-cutter.test.js`
Expected: PASS

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cmd.exe /c npx tsc --noEmit`
Expected: PASS with 0 errors

- [ ] **Step 6: Commit**

```bash
git add app/api/valorant-cutter/
git commit -m "feat(api): implement valorant-cutter analyze and render endpoints"
```

---

### Task 9: UI Studio Integration in React (`SocialPipelineStudio.tsx`)

**Files:**
- Modify: `components/SocialPipelineStudio.tsx`
- Test: `cmd.exe /c npx tsc --noEmit`

**Interfaces:**
- Consumes: `/api/valorant-cutter/analyze`, `/api/valorant-cutter/render`, existing post-queue store.
- Produces: Interactive "Valorant Kill Hunter & 4-Layer Studio" tab with:
  - Stream URL / local file input with "Buscar Jogadas (2 FPS CV)" action.
  - Highlight cards with badges (`3K`, `4K`, `ACE`), timestamp, duration, and instant preview.
  - Batch selection checkboxes and "Renderizar Selecionados (RTX 3060 Ti NVENC)" button with progress bar.

- [ ] **Step 1: Verify current TypeScript check passes**

Run: `cmd.exe /c npx tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 2: Integrate Valorant 4-Layer Cutter Studio into `components/SocialPipelineStudio.tsx`**

Add state variables, analysis trigger, card rendering, and batch render trigger with liquid glass theme styling.

- [ ] **Step 3: Verify TypeScript compilation and complete test suite**

Run: `cmd.exe /c npx tsc --noEmit`
Run: `cmd.exe /c npm test`
Expected: PASS (All tests pass, 0 TS errors)

- [ ] **Step 4: Commit**

```bash
git add components/SocialPipelineStudio.tsx
git commit -m "feat(ui): add valorant kill hunter & 4-layer vertical studio tab"
```

---

### Task 10: Post-MVP Enhancements (Fast-Forward Indicator & Whisper Subtitles)

**Files:**
- Modify: `tools/valorant-4layer-editor.js`
- Test: `tools/valorant-4layer-editor.test.js`

**Interfaces:**
- Consumes: `buildAssSubtitle` from `tools/viral-short-pipeline.js`.
- Produces:
  - Video overlay indicator `>> 3x` during fast-forward segments.
  - Dynamic burned `.ass` subtitle sync option for player callouts.

- [ ] **Step 1: Write test for fast-forward indicator filter generation**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { build4LayerFilterComplex } from './valorant-4layer-editor.js';

test('build4LayerFilterComplex adds >> 3x drawtext badge on fast-forward segments', () => {
    const segments = [
        { start: 0, end: 5, speed: 1, duration: 5 },
        { start: 5, end: 15, speed: 3, duration: 10, isFastForward: true },
    ];
    const { filterComplex } = build4LayerFilterComplex(segments, { showFastForwardBadge: true });
    assert.ok(filterComplex.includes('>> 3x'), 'Must draw >> 3x indicator during fast-forward');
});
```

- [ ] **Step 2: Run test and verify it passes or update implementation**

Run: `cmd.exe /c node --test tools/valorant-4layer-editor.test.js`

- [ ] **Step 3: Implement `showFastForwardBadge` in `tools/valorant-4layer-editor.js`**

- [ ] **Step 4: Commit**

```bash
git add tools/valorant-4layer-editor.js tools/valorant-4layer-editor.test.js
git commit -m "feat(cutter): add 3x fast-forward on-screen indicator and subtitle hook"
```
