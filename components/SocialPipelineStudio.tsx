"use client";

import { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  Scissors,
  Share2,
  TrendingUp,
  Sparkles,
  Bot,
  Zap,
  Play,
  Film,
  Cpu,
  Clock,
  Trash2,
  DollarSign,
  Users,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Instagram,
  Youtube,
  Music2,
  Lock,
  ExternalLink,
  Flame,
  Target,
  FileVideo,
  Upload,
  FolderDown,
  HardDrive,
  Radio,
  X,
  Volume2,
  Copy,
  Check,
} from "lucide-react";

// Helper seguro para formatar números
function safeNum(val: unknown, fallback = 0): string {
  const n = Number(val);
  return !isNaN(n) ? n.toLocaleString("pt-BR") : String(fallback);
}

export default function SocialPipelineStudio() {
  // Feedback geral
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Ingestão & Caçador de Kills (RTX 3060 Ti)
  const [hunterVodUrl, setHunterVodUrl] = useState("");
  const [hunterLocalFile, setHunterLocalFile] = useState("");
  const [isHuntingKills, setIsHuntingKills] = useState(false);
  const [hunterHighlights, setHunterHighlights] = useState<any[]>([]);
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>([]);
  const [isRenderingHunter, setIsRenderingHunter] = useState(false);

  // Upload direto via Dropzone & Progresso em Tempo Real
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; loadedMb: number; totalMb: number; speedMb: string } | null>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const [rawFilesList, setRawFilesList] = useState<any[]>([]);
  const [rawDirPath, setRawDirPath] = useState<string>("raw_gameplays\\");
  const [copiedPathToast, setCopiedPathToast] = useState(false);

  // Fila de Agendamento
  const [queueList, setQueueList] = useState<any[]>([]);
  const [nextSlot, setNextSlot] = useState<{ timeString: string; dayLabel: string } | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Modal de Prévia Vertical 9:16
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  // Auditoria e Projeção Financeira
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [postsPerDay, setPostsPerDay] = useState(10);
  const [avgViews, setAvgViews] = useState(25000);
  const [createWeeklyLong, setCreateWeeklyLong] = useState(true);

  // Credenciais das Redes
  const [credsStatus, setCredsStatus] = useState<any>({});
  const [tiktokHandle, setTiktokHandle] = useState("@limboinpink");
  const [instagramHandle, setInstagramHandle] = useState("@limboinpink");
  const [youtubeHandle, setYoutubeHandle] = useState("@limboinpink");
  const [tiktokTokenInput, setTiktokTokenInput] = useState("");
  const [instagramTokenInput, setInstagramTokenInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  // Watcher de Gameplays (raw_gameplays/)
  const [watcherStatus, setWatcherStatus] = useState<any>(null);
  const [loadingWatcher, setLoadingWatcher] = useState(false);

  // Painel Recolhível de Admin/Métricas/Chaves
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [adminTab, setAdminTab] = useState<"analytics" | "lucro" | "chaves">("analytics");

  // Carrega fila e dados na montagem
  useEffect(() => {
    fetchQueue();
    fetchAnalytics();
    fetchCreds();
    fetchWatcherStatus();
  }, []);

  async function fetchWatcherStatus() {
    setLoadingWatcher(true);
    try {
      const res = await fetch("/api/gameplay-watcher");
      const data = await res.json();
      if (data?.ok) {
        if (data.status) setWatcherStatus(data.status);
        const files = Array.isArray(data.files) ? data.files : (Array.isArray(data.status?.filesWaiting) ? data.status.filesWaiting : []);
        setRawFilesList(files);
        if (data.rawDir) setRawDirPath(data.rawDir);
        // Se ainda não tem arquivo selecionado e há vídeos na pasta, seleciona o primeiro automaticamente
        if (!hunterLocalFile && files.length > 0) {
          setHunterLocalFile(files[0].name);
        }
      }
    } catch {
      // safe
    } finally {
      setLoadingWatcher(false);
    }
  }

  function handleCopyRawPath() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(rawDirPath);
      setCopiedPathToast(true);
      setTimeout(() => setCopiedPathToast(false), 2500);
    }
  }

  async function fetchQueue() {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      if (data?.ok) {
        const list = Array.isArray(data.queue) ? data.queue : (Array.isArray(data.posts) ? data.posts : []);
        setQueueList(list);
        setNextSlot(data.nextOptimalSlot || data.nextSlot || null);
      }
    } catch {
      // safe
    } finally {
      setLoadingQueue(false);
    }
  }

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/social-analytics");
      const data = await res.json();
      if (data?.ok) {
        setAnalyticsData(data);
      }
    } catch {
      // safe
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function fetchCreds() {
    try {
      const res = await fetch("/api/social-credentials");
      const data = await res.json();
      if (data?.ok && data.credentials) {
        setCredsStatus(data.credentials);
        if (data.credentials.tiktokUsername) setTiktokHandle(data.credentials.tiktokUsername);
        if (data.credentials.instagramUsername) setInstagramHandle(data.credentials.instagramUsername);
      }
    } catch {
      // safe
    }
  }

  function handleUploadGameplay(file: File) {
    if (!file) return;

    // Se o arquivo já estiver na lista da pasta raw_gameplays, seleciona de imediato sem re-upload
    const existing = rawFilesList.find((f: any) => f.name === file.name);
    if (existing) {
      setHunterLocalFile(file.name);
      setHunterVodUrl("");
      setStatusMessage(`✓ Vídeo "${file.name}" já está no SSD em raw_gameplays/ e foi selecionado!`);
      return;
    }

    setUploadingFile(true);
    setUploadProgress({
      percent: 0,
      loadedMb: 0,
      totalMb: Number((file.size / (1024 * 1024)).toFixed(1)),
      speedMb: "0",
    });
    setStatusMessage("");
    setErrorMessage("");

    const xhr = new XMLHttpRequest();
    uploadXhrRef.current = xhr;
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        const elapsedSec = (Date.now() - startTime) / 1000;
        const loadedMb = Number((event.loaded / (1024 * 1024)).toFixed(1));
        const totalMb = Number((event.total / (1024 * 1024)).toFixed(1));
        const speedMb = elapsedSec > 0 ? (loadedMb / elapsedSec).toFixed(1) : "0";
        setUploadProgress({ percent, loadedMb, totalMb, speedMb });
      }
    };

    xhr.onload = async () => {
      setUploadingFile(false);
      setUploadProgress(null);
      uploadXhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.ok) {
            setStatusMessage(`✓ Gameplay "${data.fileName}" (${data.sizeMb} MB) recebida em raw_gameplays/ com sucesso!`);
            setHunterLocalFile(data.fileName);
            setHunterVodUrl("");
            await fetchWatcherStatus();
          } else {
            setErrorMessage(data?.error || "Erro no processamento do arquivo.");
          }
        } catch {
          setErrorMessage("Falha ao interpretar resposta do servidor.");
        }
      } else {
        setErrorMessage(`Erro ao enviar arquivo (Status HTTP: ${xhr.status}).`);
      }
    };

    xhr.onerror = () => {
      setUploadingFile(false);
      setUploadProgress(null);
      uploadXhrRef.current = null;
      setErrorMessage("Erro de rede ao enviar vídeo para o SSD local.");
    };

    xhr.onabort = () => {
      setUploadingFile(false);
      setUploadProgress(null);
      uploadXhrRef.current = null;
      setStatusMessage("Envio cancelado pelo usuário.");
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.open("POST", "/api/gameplay-watcher");
    xhr.send(formData);
  }

  function handleCancelUpload() {
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
    }
  }

  async function handleAnalyzeKillfeed() {
    if (!hunterVodUrl && !hunterLocalFile) {
      setErrorMessage("Informe a URL da live ou selecione um arquivo de gameplay em raw_gameplays/.");
      return;
    }
    setIsHuntingKills(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const res = await fetch("/api/valorant-cutter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: hunterVodUrl || undefined,
          localFile: hunterLocalFile || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Falha na análise visual do Killfeed.");
      }
      setHunterHighlights(data.cuts || []);
      setSelectedCutIds((data.cuts || []).map((c: any) => c.id));
      setStatusMessage(`✓ Detecção concluída! ${data.cuts?.length || 0} jogadas de alto impacto (>= 3K / ACE) localizadas.`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro na análise de abates.");
    } finally {
      setIsHuntingKills(false);
    }
  }

  async function handleRenderHunterSelection() {
    const cutsToRender = hunterHighlights.filter((h) => selectedCutIds.includes(h.id));
    if (cutsToRender.length === 0) {
      setErrorMessage("Selecione pelo menos um clipe para renderizar.");
      return;
    }
    setIsRenderingHunter(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const res = await fetch("/api/valorant-cutter/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: hunterVodUrl || undefined,
          localFile: hunterLocalFile || undefined,
          selectedCuts: cutsToRender,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Falha na renderização via RTX 3060 Ti.");
      }
      setStatusMessage(`✓ ${data.cutsProcessed} cortes 9:16 renderizados com áudio original e agendados com sucesso!`);
      await fetchQueue();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro na renderização.");
    } finally {
      setIsRenderingHunter(false);
    }
  }

  async function handleToggleApproval(postId: string, currentStatus: string) {
    const newStatus = currentStatus === "APPROVED" ? "REJECTED" : "APPROVED";
    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, approvalStatus: newStatus }),
      });
      const data = await res.json();
      if (data?.ok) {
        await fetchQueue();
      }
    } catch {
      // safe
    }
  }

  async function handleCancelPost(postId: string) {
    setCancellingId(postId);
    try {
      const res = await fetch("/api/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data?.ok) {
        await fetchQueue();
      }
    } catch {
      // safe
    } finally {
      setCancellingId(null);
    }
  }

  async function handleClearQueue() {
    if (!confirm("Deseja realmente limpar todos os agendamentos da fila de testes?")) return;
    try {
      const res = await fetch("/api/schedule?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (data?.ok) {
        setStatusMessage("✓ Fila limpa com sucesso.");
        await fetchQueue();
      }
    } catch {
      setErrorMessage("Erro ao limpar fila de agendamento.");
    }
  }

  async function handleSaveCreds() {
    setSavingCreds(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/social-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokAccessToken: tiktokTokenInput || undefined,
          instagramAccessToken: instagramTokenInput || undefined,
          tiktokUsername: tiktokHandle || undefined,
          instagramUsername: instagramHandle || undefined,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setStatusMessage("✓ Credenciais das redes sociais salvas com sucesso!");
        await fetchCreds();
      } else {
        throw new Error(data?.error || "Erro ao salvar chaves.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro ao salvar credenciais.");
    } finally {
      setSavingCreds(false);
    }
  }

  // Cálculos de Lucro
  const rpmValorant = 0.85;
  const totalCutsMonthly = postsPerDay * 30;
  const estimatedCutsViewsMonthly = totalCutsMonthly * avgViews;
  const estimatedCutsRevenueBrl = (estimatedCutsViewsMonthly / 1000) * rpmValorant * 5.7;
  const estimatedWeeklyRevenueBrl = createWeeklyLong ? 4 * 1250 : 0;
  const grandTotalRevenueBrl = estimatedCutsRevenueBrl + estimatedWeeklyRevenueBrl;

  return (
    <div className="container mx-auto max-w-6xl px-4 space-y-8">
      {/* ======================================================== */}
      {/* 1. HEADER DO COCKPIT & STATUS EM TEMPO REAL              */}
      {/* ======================================================== */}
      <div className="liquid-glass-pane p-5 md:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF1493] animate-ping" />
              <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#FF1493]">
                Cockpit Unificado • Painel de Controle Único
              </span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-black uppercase text-white mt-1">
              Fábrica de Cortes 9:16 & Fila de Disparo
            </h1>
          </div>

          {/* Métricas Rápidas */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="liquid-glass-card px-3.5 py-2 rounded-2xl shrink-0">
              <span className="text-[10px] uppercase font-heading text-slate-300 block font-semibold">RTX 3060 Ti</span>
              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-400" /> NVENC Ativo
              </span>
            </div>

            <div className="liquid-glass-card px-3.5 py-2 rounded-2xl shrink-0">
              <span className="text-[10px] uppercase font-heading text-slate-300 block font-semibold">Áudio Nativo</span>
              <span className="text-xs font-mono font-bold text-pink-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-pink-400" /> 100% Original
              </span>
            </div>

            <div className="liquid-glass-card px-3.5 py-2 rounded-2xl shrink-0">
              <span className="text-[10px] uppercase font-heading text-slate-300 block font-semibold">Fila de Disparo</span>
              <span className="text-xs font-mono font-bold text-teal-300">
                {queueList.filter((q) => q.status === "SCHEDULED").length} Vídeos Prontos
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAdminDrawer(!showAdminDrawer)}
              className="liquid-btn-primary px-4 py-2 rounded-2xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-white" />
              <span>{showAdminDrawer ? "Ocultar Métricas" : "Métricas & Chaves"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminDrawer ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS / ERROR */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. PAINEL LATERAL/RECOLHÍVEL: ADMIN, MÉTRICAS & CHAVES   */}
      {/* ======================================================== */}
      {showAdminDrawer && (
        <div id="admin-metricas" className="liquid-glass-pane p-6 rounded-3xl space-y-6 border-[#FF1493]/30 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-pink-400" />
              <h3 className="font-heading font-bold text-base uppercase text-white tracking-wide">
                Gestão das Redes, Métricas & Chaves de API
              </h3>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setAdminTab("analytics")}
                className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wider transition ${
                  adminTab === "analytics" ? "liquid-btn-pink text-white font-bold" : "text-slate-300 hover:text-white"
                }`}
              >
                Raio-X das Redes
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("lucro")}
                className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wider transition ${
                  adminTab === "lucro" ? "liquid-btn-primary text-white font-bold" : "text-slate-300 hover:text-white"
                }`}
              >
                Calculadora de Lucro
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("chaves")}
                className={`px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wider transition ${
                  adminTab === "chaves" ? "liquid-btn-primary text-white font-bold" : "text-slate-300 hover:text-white"
                }`}
              >
                Chaves de API
              </button>
            </div>
          </div>

          {/* Sub-Aba: Raio-X das Redes */}
          {adminTab === "analytics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="liquid-glass-card p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-mono uppercase text-pink-300 block font-bold">Canal TikTok</span>
                  <span className="font-heading font-bold text-white text-sm mt-0.5 block">{tiktokHandle}</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Conectado GhostEngine</span>
                </div>
                <div className="liquid-glass-card p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-mono uppercase text-pink-300 block font-bold">Views no Mês</span>
                  <span className="font-mono font-bold text-white text-base mt-0.5 block">13.628</span>
                  <span className="text-[9px] text-slate-400 font-mono">261 vídeos no canal</span>
                </div>
                <div className="liquid-glass-card p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-mono uppercase text-teal-300 block font-bold">Views Diárias</span>
                  <span className="font-mono font-bold text-teal-300 text-base mt-0.5 block">454/dia</span>
                  <span className="text-[9px] text-teal-400 font-mono">+18% retenção</span>
                </div>
                <div className="liquid-glass-card p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-mono uppercase text-purple-300 block font-bold">Seguidores</span>
                  <span className="font-mono font-bold text-white text-base mt-0.5 block">645</span>
                  <span className="text-[9px] text-purple-300 font-mono">6.057 curtidas</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Aba: Calculadora de Lucro */}
          {adminTab === "lucro" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Cortes Publicados por Dia:</span>
                    <strong className="text-pink-300">{postsPerDay} vídeos/dia</strong>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={postsPerDay}
                    onChange={(e) => setPostsPerDay(Number(e.target.value))}
                    className="w-full accent-[#FF1493] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Média de Visualizações por Corte:</span>
                    <strong className="text-teal-300">{avgViews.toLocaleString("pt-BR")} views</strong>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="150000"
                    step="5000"
                    value={avgViews}
                    onChange={(e) => setAvgViews(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="liquid-glass-card p-5 rounded-2xl flex flex-col justify-between border-pink-500/30 bg-pink-500/10">
                <span className="text-[10px] font-heading uppercase text-pink-300 font-bold block">
                  Projeção Mensal Estimada
                </span>
                <div className="font-mono text-2xl font-black text-white my-2">
                  R$ {grandTotalRevenueBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  Baseado em RPM Valorant R$ 4,85 nas 3 redes
                </span>
              </div>
            </div>
          )}

          {/* Sub-Aba: Chaves de API */}
          {adminTab === "chaves" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-300 block font-bold">
                  TikTok Access Token / Handle:
                </label>
                <input
                  type="text"
                  placeholder="Bearer token do TikTok..."
                  value={tiktokTokenInput}
                  onChange={(e) => setTiktokTokenInput(e.target.value)}
                  className="liquid-input-glass w-full px-4 py-2 text-xs text-white rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-300 block font-bold">
                  Instagram Graph API Token:
                </label>
                <input
                  type="text"
                  placeholder="EAAG... token da Meta..."
                  value={instagramTokenInput}
                  onChange={(e) => setInstagramTokenInput(e.target.value)}
                  className="liquid-input-glass w-full px-4 py-2 text-xs text-white rounded-xl"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  disabled={savingCreds}
                  onClick={handleSaveCreds}
                  className="liquid-btn-pink px-5 py-2 rounded-xl text-xs font-heading font-bold uppercase text-white cursor-pointer"
                >
                  {savingCreds ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TOPO: ESTÚDIO DO CAÇADOR DE KILLS (RTX 3060 TI)       */}
      {/* ======================================================== */}
      <section id="estudio-cortes" className="liquid-glass-pane p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-400" />
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase text-white tracking-wide">
                1. Estúdio do Caçador de Kills (RTX 3060 Ti)
              </h2>
              <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2.5 py-0.5 rounded-full">
                Template Matching + HSV Local
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Detecta abates (4K, ACE, Clutch) em lives ou gravações longas sem webcam. Enquadra o minimapa (420x420) e killfeed (620x320) em 9:16 vertical, acelera trechos vazios em 3x e mantém <strong>100% o áudio nativo do jogo</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Áudio Original Estrito
            </span>
          </div>
        </div>

        {/* Ingestão Unificada: Arquivo Local raw_gameplays/ ou Link da Live */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Opção A: Arrastar para raw_gameplays/ ou Selecionar da Pasta */}
          <div className="liquid-glass-card p-5 rounded-2xl space-y-4 border border-pink-500/30 shadow-lg shadow-pink-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold uppercase text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-pink-400" /> Gravação Local no SSD (Recomendado)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3" /> 0s Transferência
              </span>
            </div>

            {/* Barra de Caminho da Pasta & Ações Rápidas */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FolderDown className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">Pasta OBS:</span>
                  <span className="text-[11px] font-mono text-pink-300 font-bold truncate select-all">
                    {rawDirPath || "raw_gameplays\\"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyRawPath}
                    title="Copiar caminho para colar nas configurações de gravação do OBS"
                    className="text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPathToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                    <span>{copiedPathToast ? "Copiado!" : "Copiar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchWatcherStatus()}
                    disabled={loadingWatcher}
                    title="Atualizar lista de arquivos da pasta"
                    className="text-[10px] font-mono font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingWatcher ? "animate-spin" : ""}`} />
                    <span>Escanear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista Interativa de Vídeos Encontrados em raw_gameplays/ */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="font-bold flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  Vídeos no SSD ({rawFilesList.length}):
                </span>
                {hunterLocalFile && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ Ativo: {hunterLocalFile}
                  </span>
                )}
              </div>

              {rawFilesList.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {rawFilesList.map((f: any) => {
                    const isSelected = hunterLocalFile === f.name;
                    return (
                      <div
                        key={f.name}
                        onClick={() => {
                          setHunterLocalFile(f.name);
                          setHunterVodUrl("");
                          setStatusMessage(`✓ Vídeo "${f.name}" selecionado para análise de abates do Revenge!`);
                        }}
                        className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition border ${
                          isSelected
                            ? "bg-pink-950/40 border-pink-500 shadow-md shadow-pink-500/20 text-white"
                            : "bg-black/30 border-white/10 hover:border-white/30 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileVideo className={`w-4 h-4 shrink-0 ${isSelected ? "text-pink-400" : "text-slate-400"}`} />
                          <div className="min-w-0">
                            <span className="font-mono font-bold block truncate text-[11px]">{f.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {f.sizeMb ? `${f.sizeMb} MB` : "Tamanho N/A"} • Pronto para Análise
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 border ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-white/5 text-slate-400 border-white/10"
                        }`}>
                          {isSelected ? "✓ SELECIONADO" : "SELECIONAR"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono bg-black/20 p-2.5 rounded-xl border border-white/10 text-center">
                  Nenhum arquivo gravado em <code className="text-pink-300">raw_gameplays\</code> no momento.
                  <br />
                  Grave uma partida no OBS para essa pasta ou arraste seu vídeo abaixo.
                </div>
              )}
            </div>

            {/* Dropzone com Progresso em Tempo Real ou Upload por Chunks */}
            {uploadingFile && uploadProgress ? (
              <div className="bg-pink-950/50 border border-pink-500/50 rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-pink-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Enviando para o SSD...
                  </span>
                  <span>{uploadProgress.percent}%</span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{uploadProgress.loadedMb} MB / {uploadProgress.totalMb} MB</span>
                  <span>{uploadProgress.speedMb} MB/s</span>
                </div>

                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 underline cursor-pointer mt-1 block mx-auto"
                >
                  Cancelar Envio
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-white/20 rounded-xl p-3.5 text-center hover:border-pink-500/50 transition bg-black/20">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadGameplay(f);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                <span className="text-xs font-heading text-white block font-bold">
                  Arraste outro arquivo .mp4 para o SSD
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Streaming com barra de progresso e detecção instantânea
                </span>
              </div>
            )}
          </div>

          {/* Opção B: Link de Live / VOD (Twitch ou YouTube) */}
          <div className="liquid-glass-card p-5 rounded-2xl space-y-4 border border-teal-500/30 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold uppercase text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal-400" /> Link da Live / VOD Online
                </span>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  Twitch / YouTube
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cole o link direto da live. O sistema extrai o stream e faz o download cirúrgico dos trechos de abates do Revenge.
              </p>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="https://www.twitch.tv/videos/... ou link do YouTube"
                  value={hunterVodUrl}
                  onChange={(e) => {
                    setHunterVodUrl(e.target.value);
                    if (e.target.value) setHunterLocalFile("");
                  }}
                  className="liquid-input-glass w-full px-4 py-2.5 text-xs text-white rounded-xl placeholder:text-slate-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Dica: VODs com áudio silenciado por copyright na Twitch ficarão sem som caso o arquivo original esteja mudo.
                </span>
              </div>
            </div>

            {/* Status da fonte de stream selecionada */}
            {hunterVodUrl && (
              <div className="text-[11px] text-teal-300 font-mono bg-teal-950/40 p-2.5 rounded-xl border border-teal-500/30">
                ✓ Live/VOD selecionada: <strong className="break-all">{hunterVodUrl}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* BARRA DE AÇÃO PRINCIPAL DO CAÇADOR DE KILLS              */}
        {/* ======================================================== */}
        <div className="liquid-glass-card p-4 rounded-2xl border border-pink-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-pink-950/30 via-black/40 to-teal-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <span className="text-xs font-heading font-bold uppercase text-white block">
                Fonte Ativa para o Caçador:
              </span>
              <span className="text-[11px] font-mono text-pink-300 font-bold">
                {hunterLocalFile
                  ? `[SSD Local] raw_gameplays\\${hunterLocalFile}`
                  : (hunterVodUrl ? `[Stream Online] ${hunterVodUrl}` : "Nenhuma fonte selecionada")}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isHuntingKills || (!hunterVodUrl && !hunterLocalFile)}
            onClick={handleAnalyzeKillfeed}
            className="liquid-btn-pink w-full sm:w-auto py-3.5 px-6 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition disabled:opacity-50"
          >
            {isHuntingKills ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Rastreando Kills de Revenge (RTX 3060 Ti)...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-white" />
                <span>Rastrear Kills do Revenge (2 FPS CV)</span>
              </>
            )}
          </button>
        </div>

        {/* Jogadas Detectadas & Botão de Renderização */}
        {hunterHighlights.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-heading uppercase text-white font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Jogadas de Alto Impacto Encontradas ({hunterHighlights.length}):
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCutIds.length === hunterHighlights.length) setSelectedCutIds([]);
                    else setSelectedCutIds(hunterHighlights.map((h) => h.id));
                  }}
                  className="text-[11px] font-mono text-pink-300 hover:text-white transition px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
                >
                  {selectedCutIds.length === hunterHighlights.length ? "Desmarcar Todos" : "Selecionar Todos"}
                </button>

                <button
                  type="button"
                  disabled={isRenderingHunter || selectedCutIds.length === 0}
                  onClick={handleRenderHunterSelection}
                  className="liquid-btn-pink px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase text-white flex items-center gap-2 shadow-md shadow-pink-500/30 hover:scale-105 transition disabled:opacity-50"
                >
                  {isRenderingHunter ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Renderizando NVENC...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Renderizar Selecionados ({selectedCutIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Grid de Cards de Kills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hunterHighlights.map((cut) => {
                const isSelected = selectedCutIds.includes(cut.id);
                return (
                  <div
                    key={cut.id}
                    onClick={() => {
                      if (isSelected) setSelectedCutIds(selectedCutIds.filter((id) => id !== cut.id));
                      else setSelectedCutIds([...selectedCutIds, cut.id]);
                    }}
                    className={`liquid-glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "border-pink-500/60 bg-pink-500/10 shadow-lg shadow-pink-500/10 scale-[1.01]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {cut.clipType || "HIGHLIGHT"}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Score {cut.viralScore || 92}/100
                      </span>
                    </div>

                    <div className="font-heading font-bold text-xs text-white truncate mb-1">
                      {cut.headline || `${cut.killsCount || 3}K Insano no Round`}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Início: {Math.round(cut.startSec || 0)}s</span>
                      <span>Duração: {Math.round((cut.endSec || 0) - (cut.startSec || 0))}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 4. CENTRO: FILA DE DISPARO & PRÉVIA 9:16 (SEMPRE VISÍVEL)*/}
      {/* ======================================================== */}
      <section id="fila-posts" className="liquid-glass-pane p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-teal-400" />
              <h2 className="font-heading text-lg sm:text-xl font-bold uppercase text-white tracking-wide">
                2. Fila de Disparo & Prévia Vertical 9:16
              </h2>
              <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
                {queueList.filter((q) => q.status === "SCHEDULED").length} Vídeos Prontos
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Todos os cortes renderizados pela RTX 3060 Ti ficam listados aqui. Clique em <strong>&ldquo;VER CORTE 9:16&rdquo;</strong> para assistir à prévia antes da publicação automática.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearQueue}
              disabled={queueList.length === 0}
              className="text-xs text-rose-300 hover:text-white flex items-center gap-1.5 font-mono transition cursor-pointer px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Limpar Fila</span>
            </button>

            <button
              type="button"
              onClick={fetchQueue}
              disabled={loadingQueue}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-mono transition cursor-pointer px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? "animate-spin text-pink-400" : ""}`} />
              <span>Atualizar Fila</span>
            </button>
          </div>
        </div>

        {/* Lista de Cards da Fila */}
        {queueList.length > 0 ? (
          <div className="space-y-3">
            {queueList.map((job) => {
              const isCancelling = cancellingId === job.id;
              const isApproved = job.aiApproval?.status === "APPROVED";
              return (
                <div
                  key={job.id}
                  className="liquid-glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/15 hover:border-pink-500/30 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          job.status === "SCHEDULED"
                            ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                            : job.status === "PUBLISHED"
                            ? "bg-blue-500/20 text-blue-200 border border-blue-400/40"
                            : "bg-rose-500/20 text-rose-200 border border-rose-400/40"
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs font-mono text-pink-300 font-bold">
                        ⏰ {job.timeLabel || "Horário Nobre"}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        ({new Date(job.scheduledFor).toLocaleDateString("pt-BR")})
                      </span>
                    </div>

                    <div className="font-heading font-bold text-sm text-white">{job.title}</div>

                    {/* Selo do Sistema de Aprovação IA Local */}
                    {job.aiApproval && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                              isApproved
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                            }`}
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            {isApproved ? "✓ Aprovado pela IA Local" : "⚠️ Rejeitado"}
                            {job.aiApproval.viralScore ? ` • Viral Score: ${job.aiApproval.viralScore}/100` : ""}
                          </span>

                          <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            ✓ 100% Gameplay Ativa
                          </span>
                          <span className="text-[10px] text-pink-300 font-mono bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-500/20">
                            ✓ Gancho 3s Alto CTR
                          </span>
                          <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                            ✓ 9:16 Vertical
                          </span>
                        </div>

                        {job.aiApproval.verdict && (
                          <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed">
                            &ldquo;{job.aiApproval.verdict}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-300 flex items-center gap-2">
                      <span>Plataformas: {job.platforms?.join(", ").toUpperCase()}</span>
                      {job.deleteAfterPublish && (
                        <span className="text-pink-300 flex items-center gap-1">
                          • <Trash2 className="w-3 h-3 text-pink-400" /> Auto-exclusão do SSD ativa
                        </span>
                      )}
                    </div>
                  </div>

                  {job.status === "SCHEDULED" && (
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Botão de Aprovação Manual */}
                      <button
                        type="button"
                        onClick={() => handleToggleApproval(job.id, job.aiApproval?.status || "APPROVED")}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase transition cursor-pointer border ${
                          isApproved
                            ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-200"
                            : "text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-emerald-500/20 hover:text-emerald-200"
                        }`}
                      >
                        {isApproved ? "✓ Aprovado" : "Revisar"}
                      </button>

                      {job.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPost(job)}
                          className="liquid-btn-pink px-4 py-2 rounded-full text-white text-xs font-heading font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-500/30 hover:scale-105 transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Ver Corte 9:16</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCancelPost(job.id)}
                        disabled={isCancelling}
                        className="liquid-glass-card px-4 py-2 rounded-full text-slate-300 hover:text-rose-200 hover:bg-rose-500/20 text-xs font-heading uppercase transition cursor-pointer border-white/20"
                      >
                        {isCancelling ? "Cancelando..." : "Cancelar"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="liquid-glass-card p-10 rounded-3xl border-dashed border-white/20 text-center space-y-3.5">
            <Film className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="font-heading font-bold text-base text-white uppercase">
              Fila Vazia • Nenhum Vídeo Agendado Ainda
            </div>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Utilize o <strong>Estúdio de Cortes</strong> acima para rastrear jogadas na sua live ou gameplay e renderizar os primeiros cortes verticais!
            </p>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. MODAL DE PRÉVIA DO VÍDEO VERTICAL 9:16                */}
      {/* ======================================================== */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-pane max-w-sm w-full p-5 rounded-3xl relative flex flex-col items-center border-white/40 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewPost(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-white p-2 rounded-full bg-white/10 border border-white/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono uppercase text-pink-300 font-bold mb-2">
              Prévia do Corte Renderizado 9:16
            </span>
            <h3 className="font-heading font-bold text-sm text-white text-center mb-3 line-clamp-1 px-4">
              {previewPost.title}
            </h3>

            <div className="w-full aspect-[9/16] max-h-[60vh] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-inner flex items-center justify-center">
              <video
                key={previewPost.videoUrl}
                src={previewPost.videoUrl}
                controls
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-3.5 w-full text-center space-y-2.5">
              <span className="text-[11px] font-mono text-slate-300 block">
                ⏰ Agendado para: <strong className="text-pink-300">{previewPost.timeLabel}</strong>
              </span>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="liquid-btn-primary w-full py-2.5 text-xs uppercase font-heading font-bold rounded-xl cursor-pointer"
              >
                Fechar Prévia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
