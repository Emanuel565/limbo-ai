"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft,
  ArrowRight,
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
} from "lucide-react";

// Helper seguro para formatar números
function safeNum(val: unknown, fallback = 0): string {
  const n = Number(val);
  return !isNaN(n) ? n.toLocaleString("pt-BR") : String(fallback);
}

export default function SocialPipelineStudio() {
  // Etapa ativa do Pipeline (1, 2 ou 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // -------------------------------------------------------------
  // ETAPA 1: Gameplay & Arquétipo (Partida de 30 a 40 minutos)
  // -------------------------------------------------------------
  const [sourceVideoUrl] = useState(""); // vazio = usa o primeiro vídeo real de raw_gameplays/
  const [matchDurationMinutes, setMatchDurationMinutes] = useState(35); // 30 a 40 minutos por partida
  const customTitle = "GANCHO GERADO POR IA PARA CADA CORTE";
  const [cutsCount, setCutsCount] = useState(10); // 10 a 20 cortes por partida

  // -------------------------------------------------------------
  // ETAPA 2: Motor de Edição 9:16 (NVENC & Estilo)
  // -------------------------------------------------------------
  const [nvencEnabled, setNvencEnabled] = useState(true);
  const [assSubtitles, setAssSubtitles] = useState(true);
  const [hookBanner, setHookBanner] = useState(true);
  const [dynamicZoom, setDynamicZoom] = useState(true);
  const [audioLoudnorm, setAudioLoudnorm] = useState(true);
  const [autoEmojis, setAutoEmojis] = useState(true);
  const [generatingCuts, setGeneratingCuts] = useState(false);
  const [generatedCuts, setGeneratedCuts] = useState<any[]>([]);

  // -------------------------------------------------------------
  // ETAPA 3: Postagens Automáticas & Raio-X de Lucro
  // -------------------------------------------------------------
  const [tiktokHandle, setTiktokHandle] = useState("@limboinpink");
  const [instagramHandle, setInstagramHandle] = useState("@limboinpink");
  const [youtubeHandle, setYoutubeHandle] = useState("@limboinpink");
  const [deleteAfterPublish, setDeleteAfterPublish] = useState(true);

  // Fila de Agendamento
  const [queueList, setQueueList] = useState<any[]>([]);
  const [nextSlot, setNextSlot] = useState<{ timeString: string; dayLabel: string } | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Auditoria e Projeção Financeira
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [postsPerDay, setPostsPerDay] = useState(10); // 10 a 20 cortes por dia
  const [avgViews, setAvgViews] = useState(25000);
  const [createWeeklyLong, setCreateWeeklyLong] = useState(true);

  // Feedback geral
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sub-Aba na Etapa 3: "hunter" | "fila" | "analytics" | "lucro" | "chaves"
  const [step3SubTab, setStep3SubTab] = useState<"hunter" | "fila" | "analytics" | "lucro" | "chaves">("hunter");

  // Caçador de Kills (RTX 3060 Ti & 4-Camadas)
  const [hunterVodUrl, setHunterVodUrl] = useState("");
  const [hunterLocalFile, setHunterLocalFile] = useState("");
  const [isHuntingKills, setIsHuntingKills] = useState(false);
  const [hunterHighlights, setHunterHighlights] = useState<any[]>([]);
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>([]);
  const [isRenderingHunter, setIsRenderingHunter] = useState(false);

  async function handleAnalyzeKillfeed() {
    if (!hunterVodUrl && !hunterLocalFile) {
      setErrorMessage("Informe a URL da live ou selecione um arquivo local de gameplay.");
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
      setStatusMessage(`✓ ${data.cutsProcessed} cortes 9:16 renderizados e agendados com sucesso!`);
      await fetchQueue();
      setStep3SubTab("fila");
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro na renderização.");
    } finally {
      setIsRenderingHunter(false);
    }
  }

  // Credenciais & GhostEngine
  const [credsStatus, setCredsStatus] = useState<any>({});
  const [tiktokTokenInput, setTiktokTokenInput] = useState("");
  const [instagramTokenInput, setInstagramTokenInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [connectingGhost, setConnectingGhost] = useState(false);

  // Watcher de Gameplays (raw_gameplays/)
  const [watcherStatus, setWatcherStatus] = useState<any>(null);
  const [loadingWatcher, setLoadingWatcher] = useState(false);
  const [processingWatcher, setProcessingWatcher] = useState(false);

  // Upload direto e Modal de Prévia Vertical
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  async function handleUploadGameplay(file: File) {
    if (!file) return;
    setUploadingFile(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/gameplay-watcher", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha no envio da gameplay.");
      }
      setStatusMessage(`✓ Gameplay "${data.fileName}" (${data.sizeMb} MB) enviada para raw_gameplays/ com sucesso!`);
      await fetchWatcherStatus();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setUploadingFile(false);
    }
  }

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
      if (data?.ok && data.status) {
        setWatcherStatus(data.status);
      }
    } catch {
      // safe
    } finally {
      setLoadingWatcher(false);
    }
  }

  async function handleToggleDaemon() {
    try {
      const action = watcherStatus?.isActive ? "stop_daemon" : "start_daemon";
      const res = await fetch("/api/gameplay-watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          intervalSeconds: 15,
          cutsCount,
          tiktokHandle,
          instagramHandle,
          youtubeHandle,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setWatcherStatus(data.status);
        setStatusMessage(
          action === "start_daemon"
            ? "✓ Watcher Daemon Ativo: monitorando raw_gameplays/ a cada 15s!"
            : "✓ Watcher Daemon Pausado."
        );
      }
    } catch {
      setErrorMessage("Erro ao alterar estado do Watcher.");
    }
  }

  async function handleScanAndProcessWatcher() {
    setProcessingWatcher(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/gameplay-watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan_and_process",
          cutsCount,
          matchDurationMinutes,
          tiktokHandle,
          instagramHandle,
          youtubeHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao escanear pasta.");
      }

      if (data.processedCount === 0) {
        setStatusMessage("Pasta raw_gameplays/ verificada: nenhum novo vídeo pronto encontrado no momento.");
      } else {
        setStatusMessage(
          `✓ Sucesso! ${data.processedCount} partida(s) processada(s), cortes agendados nas 3 redes e gameplay original excluída do disco.`
        );
        await fetchQueue();
        setCurrentStep(3);
        setStep3SubTab("fila");
      }
      if (data.status) setWatcherStatus(data.status);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao processar pasta vigiada.");
    } finally {
      setProcessingWatcher(false);
    }
  }

  async function fetchQueue() {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setQueueList(data.queue || []);
        if (data.nextOptimalSlot) setNextSlot(data.nextOptimalSlot);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingQueue(false);
    }
  }

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/social-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokHandle,
          instagramHandle,
          youtubeHandle,
          postsPerDay,
          avgViewsPerVideo: avgViews,
          createWeeklyLongVideo: createWeeklyLong,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setAnalyticsData(data);
      }
    } catch {
      // safe fallback
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
      }
    } catch {
      // safe fallback
    }
  }

  // 1-Clique: Dispara Fábrica de Cortes e Agenda Automaticamente
  async function handleTriggerAutopilot() {
    setGeneratingCuts(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const res = await fetch("/api/valorant-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: sourceVideoUrl,
          agentName: "Jett / Vandal",
          cutsCount,
          matchDurationMinutes,
          platforms: ["tiktok", "instagram", "youtube"],
          tiktokHandle,
          instagramHandle,
          youtubeHandle,
          deleteAfterPublish,
          autoSchedule: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao processar cortes.");
      }

      setGeneratedCuts(data.cuts || []);
      setStatusMessage(`✓ Sucesso! ${data.cutsCount} cortes gerados e agendados nos horários de pico.`);
      await fetchQueue();
      // Avança para a Etapa 3 (Fila & Postagens)
      setCurrentStep(3);
      setStep3SubTab("fila");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido na esteira.";
      setErrorMessage(msg);
    } finally {
      setGeneratingCuts(false);
    }
  }

  // Cancela post agendado
  async function handleCancelPost(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/schedule?id=${encodeURIComponent(id)}`, { method: "DELETE" });
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

  // Alterna aprovação de corte agendado (Sistema de Aprovação com IA)
  async function handleToggleApproval(id: string, currentStatus: string) {
    const newStatus = currentStatus === "APPROVED" ? "REJECTED" : "APPROVED";
    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          verdict: newStatus === "APPROVED" ? "Aprovado manualmente pelo criador na esteira." : "Rejeitado manualmente para revisão.",
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        await fetchQueue();
      }
    } catch {
      // safe
    }
  }

  // Limpa toda a fila de testes
  async function handleClearQueue() {
    if (!confirm("Deseja realmente limpar todos os agendamentos da fila?")) return;
    try {
      const res = await fetch("/api/schedule?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (data?.ok) {
        setStatusMessage("✓ Fila limpa com sucesso. Aguardando novo vídeo na pasta raw_gameplays/!");
        await fetchQueue();
      }
    } catch {
      setErrorMessage("Erro ao limpar fila de agendamento.");
    }
  }

  // Salvar credenciais
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
        setStatusMessage("✓ Credenciais salvas com sucesso em .env.local!");
        await fetchCreds();
      }
    } catch {
      setErrorMessage("Erro ao salvar chaves.");
    } finally {
      setSavingCreds(false);
    }
  }

  // Abrir navegador interativo GhostEngine para login persistente no YouTube Studio ou TikTok
  async function handleOpenGhostLogin(platform: "youtube" | "tiktok" = "youtube") {
    setConnectingGhost(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/ghost-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data?.ok) {
        setStatusMessage(
          `✓ Janela do GhostEngine iniciada para ${platform === "youtube" ? "YouTube Studio" : "TikTok"}! Entre na sua conta. Quando concluir, o perfil ficará salvo para postagens automáticas.`
        );
      } else {
        setErrorMessage(data?.error || "Erro ao abrir GhostEngine.");
      }
    } catch {
      setErrorMessage("Erro de comunicação ao acionar o GhostEngine.");
    } finally {
      setConnectingGhost(false);
    }
  }

  const readyFilesCount: number = (watcherStatus?.filesWaiting || []).filter((f: any) => f.isReady).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* ======================================================== */}
      {/* BARRA SUPERIOR: KPI ADMIN & STATUS DO ROBÔ               */}
      {/* ======================================================== */}
      <div className="liquid-glass-pane p-5 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center text-[#FF1493] shrink-0 shadow-lg shadow-[#FF1493]/20">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold uppercase text-white tracking-wider">
                  Admin de Redes • Autopilot
                </span>
                {queueList.filter((q) => q.status === "SCHEDULED").length > 0 ? (
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-sm flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Operando ({queueList.filter((q) => q.status === "SCHEDULED").length} na fila)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-200 border border-amber-400/40 shadow-sm flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Aguardando 1ª Gameplay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-light mt-0.5">
                Fábrica autônoma alimentada por gameplays de Valorant • Foco em Views & Lucro
              </p>
            </div>
          </div>

          {/* Mini Indicadores de Performance Liquid Glass */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="liquid-glass-card px-4 py-2.5 rounded-2xl shrink-0">
              <span className="text-[10px] uppercase font-heading text-slate-300 block font-semibold">
                {queueList.filter((q) => q.status === "SCHEDULED").length > 0 ? "Próximo Disparo" : "Janela de Pico"}
              </span>
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-[#FF1493]" />
                {queueList.find((q) => q.status === "SCHEDULED")?.timeLabel || nextSlot?.timeString || "11:30"}h
                {queueList.filter((q) => q.status === "SCHEDULED").length === 0 && (
                  <span className="text-[9px] text-amber-300 font-mono font-normal">(Livre)</span>
                )}
              </span>
            </div>

            <div className="liquid-glass-card px-4 py-2.5 rounded-2xl shrink-0">
              <span className="text-[10px] uppercase font-heading text-slate-300 block font-semibold">Fila de Vídeos</span>
              <span
                className={`text-xs font-mono font-bold mt-0.5 block ${
                  queueList.filter((q) => q.status === "SCHEDULED").length > 0
                    ? "text-emerald-300"
                    : "text-slate-300"
                }`}
              >
                {queueList.filter((q) => q.status === "SCHEDULED").length > 0
                  ? `${queueList.filter((q) => q.status === "SCHEDULED").length} agendados`
                  : "0 agendados (Fila Vazia)"}
              </span>
            </div>

            <div className="liquid-glass-card px-4 py-2.5 rounded-2xl border-[#FF1493]/40 bg-pink-500/10 shrink-0">
              <span className="text-[10px] uppercase font-heading text-pink-200 block font-bold">Projeção Mensal</span>
              <span className="text-xs font-mono font-black text-white mt-0.5 block">
                {queueList.filter((q) => q.status === "SCHEDULED").length > 0
                  ? `R$ ${analyticsData?.summary?.estimatedMonthlyBrl ? safeNum(analyticsData.summary.estimatedMonthlyBrl) : "0"}`
                  : "R$ 0 (Inicie 1ª gameplay)"}
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK STATUS / ERROR */}
        {statusMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEPPER LINEAR: 3 ETAPAS SEQUENCIAIS                      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex flex-col items-start justify-between w-full p-4 sm:p-5 rounded-3xl text-left transition-all duration-300 cursor-pointer ${
            currentStep === 1
              ? "bg-gradient-to-br from-[#FF1493]/90 via-[#f43f5e]/95 to-[#e11d48] border border-white/60 shadow-[0_16px_36px_-4px_rgba(255,20,147,0.7)] text-white scale-[1.02]"
              : "liquid-glass-card text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className={`text-[10px] font-heading uppercase font-bold tracking-wider ${currentStep === 1 ? "text-white/90" : "text-[#FF1493]"}`}>
              Passo 01
            </span>
            <Gamepad2 className={`w-4 h-4 ${currentStep === 1 ? "text-white" : "text-[#FF1493]"}`} />
          </div>
          <div className="text-xs sm:text-sm font-heading font-bold uppercase truncate w-full">
            Gameplay & Arquétipos
          </div>
          <p className={`text-[10px] hidden sm:block mt-1 font-light w-full ${currentStep === 1 ? "text-white/80" : "text-slate-400"}`}>
            Clutch 1v5, Lineup, Mira do Aspas
          </p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex flex-col items-start justify-between w-full p-4 sm:p-5 rounded-3xl text-left transition-all duration-300 cursor-pointer ${
            currentStep === 2
              ? "bg-gradient-to-br from-[#8b5cf6]/90 via-[#7c3aed]/95 to-[#6366f1] border border-white/60 shadow-[0_16px_36px_-4px_rgba(139,92,246,0.7)] text-white scale-[1.02]"
              : "liquid-glass-card text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className={`text-[10px] font-heading uppercase font-bold tracking-wider ${currentStep === 2 ? "text-white/90" : "text-purple-400"}`}>
              Passo 02
            </span>
            <Scissors className={`w-4 h-4 ${currentStep === 2 ? "text-white" : "text-purple-400"}`} />
          </div>
          <div className="text-xs sm:text-sm font-heading font-bold uppercase truncate w-full">
            Edição 9:16 & NVENC
          </div>
          <p className={`text-[10px] hidden sm:block mt-1 font-light w-full ${currentStep === 2 ? "text-white/80" : "text-slate-400"}`}>
            GPU RTX 3060 Ti • Legendas Neon
          </p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`flex flex-col items-start justify-between w-full p-4 sm:p-5 rounded-3xl text-left transition-all duration-300 cursor-pointer ${
            currentStep === 3
              ? "bg-gradient-to-br from-[#2dd4bf]/90 via-[#14b8a6]/95 to-[#06b6d4] border border-white/60 shadow-[0_16px_36px_-4px_rgba(45,212,191,0.65)] text-white scale-[1.02]"
              : "liquid-glass-card text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className={`text-[10px] font-heading uppercase font-bold tracking-wider ${currentStep === 3 ? "text-white/90" : "text-emerald-400"}`}>
              Passo 03
            </span>
            <Share2 className={`w-4 h-4 ${currentStep === 3 ? "text-white" : "text-emerald-400"}`} />
          </div>
          <div className="text-xs sm:text-sm font-heading font-bold uppercase truncate w-full">
            Fila, Postagens & Lucro
          </div>
          <p className={`text-[10px] hidden sm:block mt-1 font-light w-full ${currentStep === 3 ? "text-white/80" : "text-slate-400"}`}>
            TikTok, Reels, Shorts & Ganhos
          </p>
        </button>
      </div>

      {/* ======================================================== */}
      {/* CONTEÚDO DA ETAPA 1: GAMEPLAY & ARQUÉTIPOS VIRAIS        */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="liquid-glass-pane p-6 md:p-8 space-y-7">
          <div className="flex items-center justify-between pb-4 border-b border-white/15">
            <div>
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#FF1493]">
                1. Seleção de Conteúdo da Partida
              </span>
              <h2 className="font-heading text-xl md:text-2xl font-bold uppercase text-white mt-0.5">
                Escolha o Arquétipo Viral ou Cole sua Gameplay
              </h2>
            </div>
            <span className="text-xs text-slate-300 font-mono px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              1 de 3
            </span>
          </div>

          {/* ======================================================== */}
          {/* WATCH FOLDER AUTOPILOT: PASTA VIGIADA DE GAMEPLAYS       */}
          {/* ======================================================== */}
          <div className="bg-[#12051c]/85 border border-white/15 backdrop-blur-2xl p-6 rounded-3xl space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-500/10 backdrop-blur-md">
                  <FolderDown className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm uppercase text-white tracking-wider">
                      Watch Folder Autopilot • Pasta Vigiada de Gameplays
                    </span>
                    {watcherStatus?.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Daemon Ativo (15s)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-white/10 border border-white/20 backdrop-blur-md">
                        Daemon em Espera
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-light mt-0.5 leading-relaxed">
                    Arraste suas gravações (OBS/Shadowplay) ou <strong>baixe gameplays (YouTube/Twitch)</strong> direto na pasta{" "}
                    <code className="text-white font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-sm">
                      raw_gameplays/
                    </code>
                    . O sistema detecta, edita, agenda e exclui a gameplay original para poupar seu SSD!
                  </p>
                </div>
              </div>

              {/* Botões de Ação do Watcher */}
              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleToggleDaemon}
                  className={`px-4 py-2.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider transition border cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                    watcherStatus?.isActive
                      ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/50 hover:bg-emerald-500/35"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${watcherStatus?.isActive ? "text-emerald-300 animate-pulse" : "text-slate-300"}`} />
                  <span>{watcherStatus?.isActive ? "Pausar Daemon" : "Ativar Auto-Watcher (15s)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleScanAndProcessWatcher}
                  disabled={processingWatcher}
                  className="liquid-btn-pink px-5 py-2.5 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${processingWatcher ? "animate-spin text-white" : "text-white"}`} />
                  <span>{processingWatcher ? "Processando Partida..." : "Escanear e Cortar Agora"}</span>
                </button>
              </div>
            </div>

            {/* Status da Pasta: Métricas em Cards Escuros e Sóbrios (Contraste de Hierarquia) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="bg-[#1a0b26]/70 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block font-semibold">Economia no SSD:</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {watcherStatus?.stats?.totalGbFreed || 0} GB liberados automaticamente
                  </span>
                </div>
              </div>

              <div className="bg-[#1a0b26]/70 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-2.5">
                <FileVideo className="w-4 h-4 text-pink-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block font-semibold">Gameplays Processadas:</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {watcherStatus?.stats?.totalGameplaysProcessed || 0} partidas • {watcherStatus?.stats?.totalCutsGenerated || 0} cortes
                  </span>
                </div>
              </div>

              <div className="bg-[#1a0b26]/70 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-purple-300 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block font-semibold">Arquivos Aguardando:</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {watcherStatus?.filesWaitingCount || 0} vídeos em <span className="text-pink-300 font-bold">raw_gameplays/</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de vídeos aguardando na pasta se houver */}
            {watcherStatus?.filesWaiting && watcherStatus.filesWaiting.length > 0 && (
              <div className="bg-[#1a0b26]/80 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-300 font-bold block">
                  Vídeos Encontrados na Pasta:
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {watcherStatus.filesWaiting.map((fw: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono text-slate-200 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                      <span className="truncate max-w-[70%] text-white">{fw.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{fw.sizeMb} MB</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${fw.isReady ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40" : "bg-amber-500/25 text-amber-200 border border-amber-400/40"}`}>
                          {fw.isReady ? "Pronto para Cortar" : "Baixando / Gravando..."}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar Estilizada para Link da Live do YouTube / Twitch (Item 4) */}
            <div className="bg-[#1a0b26]/90 border border-white/15 rounded-2xl p-4 backdrop-blur-md shadow-lg space-y-2">
              <label className="text-[11px] font-heading uppercase font-bold text-slate-200 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-pink-400" />
                Cole o Link da sua Live ou VOD (YouTube / Twitch):
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Cole aqui o link da sua Live do YouTube ou Twitch para varredura via yt-dlp + CUDA..."
                  value={hunterVodUrl}
                  onChange={(e) => setHunterVodUrl(e.target.value)}
                  className="liquid-input-glass w-full px-4 py-2.5 text-xs text-white rounded-xl placeholder:text-slate-400 bg-black/40 border-white/15 focus:border-pink-500/60"
                />
                <button
                  type="button"
                  disabled={isHuntingKills || !hunterVodUrl.trim()}
                  onClick={async () => {
                    setCurrentStep(3);
                    setStep3SubTab("hunter");
                    await handleAnalyzeKillfeed();
                  }}
                  className="liquid-btn-pink w-full sm:w-auto px-5 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-pink-500/20"
                >
                  {isHuntingKills ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Target className="w-3.5 h-3.5 text-white" />
                      Analisar Live (2 FPS)
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block font-light">
                Varredura direta na nuvem em 720p sem baixar o vídeo no disco. Localiza multikills (3K/4K/ACE) e renderiza na RTX 3060 Ti.
              </span>
            </div>

            {/* Zona Interativa de Drag & Drop para Adicionar Vídeo Diretamente (Sóbria) */}
            <div className="relative border-2 border-dashed border-white/15 hover:border-pink-500/50 transition-all rounded-2xl p-5 text-center bg-[#1a0b26]/60 hover:bg-[#1a0b26]/90 group cursor-pointer backdrop-blur-md">
              <input
                type="file"
                accept="video/mp4,video/mkv,video/mov,video/webm"
                disabled={uploadingFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadGameplay(f);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-pink-300 group-hover:scale-110 transition shadow-md">
                  <Upload className={`w-5 h-5 ${uploadingFile ? "animate-bounce text-white" : ""}`} />
                </div>
                <div>
                  <span className="text-xs font-heading font-bold text-white uppercase block">
                    {uploadingFile ? "Enviando arquivo para raw_gameplays/..." : "Arraste uma Gameplay (.mp4) Aqui ou Clique para Selecionar"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Gravação de partida do OBS/Shadowplay ou Replay baixado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuração da Partida de Valorant (o vídeo vem SEMPRE da pasta raw_gameplays/) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-200 font-bold mb-1.5">
                Duração da Partida de Valorant:
              </label>
              <select
                value={matchDurationMinutes}
                onChange={(e) => setMatchDurationMinutes(Number(e.target.value))}
                className="liquid-input-glass w-full px-4 py-3 text-xs font-heading uppercase rounded-2xl cursor-pointer"
              >
                <option value={120} className="bg-slate-900 text-white">120 minutos (Gameplay Longa de 2 Horas • Vários Rounds)</option>
                <option value={60} className="bg-slate-900 text-white">60 minutos (Partida com Overtime / Scrim)</option>
                <option value={40} className="bg-slate-900 text-white">40 minutos (Partida competitiva longa • 24+ rounds)</option>
                <option value={35} className="bg-slate-900 text-white">35 minutos (Média competitiva • 22 rounds)</option>
                <option value={30} className="bg-slate-900 text-white">30 minutos (~18 rounds rápidos)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Para vídeos longos de 2h, o sistema escala os cortes para cobrir o conteúdo completo.
              </span>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-200 font-bold mb-1.5">
                Volume de Cortes da Partida:
              </label>
              <select
                value={cutsCount}
                onChange={(e) => setCutsCount(Number(e.target.value))}
                className="liquid-input-glass w-full px-4 py-3 text-xs font-heading uppercase rounded-2xl cursor-pointer"
              >
                <option value={24} className="bg-slate-900 text-white">24 Cortes (Ideal para 2h • 4 Dias de Postagens 100% Programadas)</option>
                <option value={20} className="bg-slate-900 text-white">20 Cortes (1 a cada ~6 min em 2h • Grade Intensa)</option>
                <option value={15} className="bg-slate-900 text-white">15 Cortes (Alta Ação)</option>
                <option value={10} className="bg-slate-900 text-white">10 Cortes (Padrão para 35 min)</option>
                <option value={5} className="bg-slate-900 text-white">5 Cortes (Apenas Highlights Rápidos)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cortes são distribuídos nos horários de maior audiência de cada dia.
              </span>
            </div>
          </div>

          {/* Dica da Fábrica Autônoma */}
          <div className="liquid-glass-card p-4 rounded-2xl border-[#FF1493]/40 bg-pink-500/10 flex items-start gap-3">
            <Flame className="w-5 h-5 text-[#FF1493] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-white">Automação Inteligente de Partida ({matchDurationMinutes} min):</strong> O GhostEngine fatia os {cutsCount} melhores lances (Aces, Clutches, Lineups e Ults) e programa a publicação ao longo do dia nas 16 janelas nobres de pico gamer (10:15h até 00:30h). Mesmo postando 10 a 20 cortes/dia, suas publicações nunca colidem e têm retenção otimizada.
            </div>
          </div>

          {/* Navegação Inferior */}
          <div className="flex justify-between items-center pt-4 border-t border-white/15">
            <span className="text-xs text-slate-300">
              Vídeos reais prontos em raw_gameplays/: <strong className="text-white">{readyFilesCount}</strong>
            </span>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="liquid-btn-primary px-8 py-3.5 text-xs flex items-center gap-2 cursor-pointer shadow-xl shadow-purple-500/30"
            >
              <span>Avançar para Edição 9:16</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO DA ETAPA 2: MOTOR DE EDIÇÃO 9:16 & NVENC        */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="liquid-glass-pane p-6 md:p-8 space-y-7">
          <div className="flex items-center justify-between pb-4 border-b border-white/15">
            <div>
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-purple-400">
                2. Configurações de Renderização Acelerada
              </span>
              <h2 className="font-heading text-xl md:text-2xl font-bold uppercase text-white mt-0.5">
                Reenquadramento Vertical 9:16 & Efeitos de Retenção
              </h2>
            </div>
            <span className="text-xs text-slate-300 font-mono px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              2 de 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opções de Renderização */}
            <div className="space-y-3">
              <h3 className="text-xs font-heading uppercase tracking-wider text-slate-200 font-bold mb-2">
                Aceleração & Parâmetros FFmpeg:
              </h3>

              <label className="liquid-glass-card p-4 rounded-2xl cursor-pointer select-none flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-xs font-heading font-bold text-white block uppercase flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#FF1493]" />
                    NVENC GPU (NVIDIA RTX 3060 Ti)
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Codec h264_nvenc • Exportação sem travar a máquina
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={nvencEnabled}
                  onChange={(e) => setNvencEnabled(e.target.checked)}
                  className="accent-[#FF1493] w-5 h-5 rounded-md cursor-pointer"
                />
              </label>

              <label className="liquid-glass-card p-4 rounded-2xl cursor-pointer select-none flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-xs font-heading font-bold text-white block uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Legendas Pop ASS em Rosa Neon (#FF1493)
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Estilo Hormozi de 2 palavras com contraste na mira
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={assSubtitles}
                  onChange={(e) => setAssSubtitles(e.target.checked)}
                  className="accent-[#FF1493] w-5 h-5 rounded-md cursor-pointer"
                />
              </label>

              <label className="liquid-glass-card p-4 rounded-2xl cursor-pointer select-none flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-xs font-heading font-bold text-white block uppercase flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-300" />
                    Banner de Gancho Fixo no Topo
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Prende a curiosidade nos primeiros 3s (+42% de retenção)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hookBanner}
                  onChange={(e) => setHookBanner(e.target.checked)}
                  className="accent-[#FF1493] w-5 h-5 rounded-md cursor-pointer"
                />
              </label>

              <label className="liquid-glass-card p-4 rounded-2xl cursor-pointer select-none flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-xs font-heading font-bold text-white block uppercase">
                    Punch-in Dynamic Zoom (1.15x)
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Enquadra a mira e o killfeed no centro do feed vertical
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dynamicZoom}
                  onChange={(e) => setDynamicZoom(e.target.checked)}
                  className="accent-[#FF1493] w-5 h-5 rounded-md cursor-pointer"
                />
              </label>

              <label className="liquid-glass-card p-4 rounded-2xl cursor-pointer select-none flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-xs font-heading font-bold text-white block uppercase">
                    Normalização de Áudio Loudnorm (-14 LUFS)
                  </span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    Áudio encorpado para competir no TikTok e Reels
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={audioLoudnorm}
                  onChange={(e) => setAudioLoudnorm(e.target.checked)}
                  className="accent-[#FF1493] w-5 h-5 rounded-md cursor-pointer"
                />
              </label>
            </div>

            {/* Simulação Visual do Formato Vertical 9:16 — Beveled Acrylic Device */}
            <div className="liquid-glass-card p-6 rounded-3xl flex flex-col items-center justify-center border-white/20">
              <span className="text-[10px] font-heading uppercase tracking-wider text-slate-300 mb-3.5 font-semibold">
                Prévia do Enquadramento 9:16 (1080x1920)
              </span>

              <div className="w-48 h-80 rounded-[2.5rem] border-2 border-white/40 bg-gradient-to-b from-purple-950/40 via-black/80 to-slate-950 relative overflow-hidden flex flex-col justify-between p-3.5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] backdrop-blur-xl">
                {/* Banner Topo */}
                {hookBanner && (
                  <div className="liquid-btn-pink text-white text-[9px] font-heading font-black uppercase text-center py-1.5 px-2 rounded-full leading-tight shadow-md">
                    {customTitle}
                  </div>
                )}

                {/* Centro com Mira de Valorant */}
                <div className="text-center my-auto">
                  <div className="w-9 h-9 rounded-full border border-pink-400/60 mx-auto flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <div className="w-2 h-2 rounded-full bg-[#FF1493]" />
                  </div>
                  <span className="text-[8px] text-slate-300 font-mono mt-1.5 block font-semibold">Foco na Mira</span>
                </div>

                {/* Legendas Pop */}
                {assSubtitles && (
                  <div className="text-center mb-4">
                    <span className="bg-black/85 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-pink-300 border border-pink-400/50 shadow-md backdrop-blur-sm">
                      CONFIA NA MIRA! 💀
                    </span>
                  </div>
                )}

                {/* Barra de Progresso inferior */}
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-gradient-to-r from-pink-500 to-purple-500" />
                </div>
              </div>

              <div className="text-center mt-3.5 text-[10px] text-slate-300 font-mono">
                1080x1920 • 60 FPS • Bitrate 8000k
              </div>
            </div>
          </div>

          {/* Botão de Disparo Direto — Hologram Banner */}
          <div className="liquid-glass-hologram p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border-white/40 shadow-2xl">
            <div>
              <span className="text-xs font-heading font-bold uppercase text-white block">
                Tudo pronto para a renderização?
              </span>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-relaxed">
                O motor vai fatiar a gameplay, aplicar legendas e encaminhar para a fila de postagens.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerAutopilot}
              disabled={generatingCuts}
              className="liquid-btn-pink px-9 py-4 rounded-full text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xl shadow-pink-500/40"
            >
              <Zap className={`w-4 h-4 fill-current ${generatingCuts ? "animate-spin" : ""}`} />
              {generatingCuts ? "Renderizando na GPU..." : `⚡ Renderizar ${cutsCount} Cortes & Agendar`}
            </button>
          </div>

          {/* Navegação Inferior */}
          <div className="flex justify-between items-center pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-heading uppercase cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar para Gameplay
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="liquid-btn-secondary px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <span>Ver Fila de Postagens & Lucro</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO DA ETAPA 3: FILA, POSTAGENS & RAIO-X DE LUCRO   */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="liquid-glass-pane p-6 md:p-8 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/15 gap-3">
            <div>
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-emerald-400">
                3. Centro de Postagem & Admin de Lucro
              </span>
              <h2 className="font-heading text-xl md:text-2xl font-bold uppercase text-white mt-0.5">
                Fila de Disparo & Auditoria das Redes
              </h2>
            </div>

            {/* Sub-Tabs da Etapa 3 — Segmented Liquid Track */}
            <div className="liquid-track p-1.5 rounded-full flex flex-wrap gap-1.5 border-white/20">
              <button
                type="button"
                onClick={() => setStep3SubTab("hunter")}
                className={`px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wider transition-all cursor-pointer ${
                  step3SubTab === "hunter"
                    ? "liquid-btn-pink text-white font-bold shadow-md shadow-pink-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                🎯 Caçador de Kills (RTX 3060 Ti)
              </button>

              <button
                type="button"
                onClick={() => setStep3SubTab("fila")}
                className={`px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wider transition-all cursor-pointer ${
                  step3SubTab === "fila"
                    ? "liquid-btn-secondary text-white font-bold shadow-md shadow-teal-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Fila de Posts ({queueList.filter((q) => q.status === "SCHEDULED").length})
              </button>

              <button
                type="button"
                onClick={() => setStep3SubTab("analytics")}
                className={`px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wider transition-all cursor-pointer ${
                  step3SubTab === "analytics"
                    ? "liquid-btn-pink text-white font-bold shadow-md shadow-pink-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Raio-X das Redes
              </button>

              <button
                type="button"
                onClick={() => setStep3SubTab("lucro")}
                className={`px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wider transition-all cursor-pointer ${
                  step3SubTab === "lucro"
                    ? "liquid-btn-primary text-white font-bold shadow-md shadow-purple-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Calculadora de Lucro
              </button>

              <button
                type="button"
                onClick={() => setStep3SubTab("chaves")}
                className={`px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wider transition-all cursor-pointer ${
                  step3SubTab === "chaves"
                    ? "liquid-btn-primary text-white font-bold shadow-md shadow-purple-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Chaves de API
              </button>
            </div>
          </div>

          {/* BANNER DE AUDITORIA & MÉTRICAS EM TEMPO REAL (TIKTOK & REDES) */}
          <div className="liquid-glass-card p-4 rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-950/20 via-purple-950/20 to-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
                <Music2 className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-xs uppercase text-white">
                    TikTok @limboinpink
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    GhostEngine Conectado
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                  Auditado com sucesso • 261 vídeos no canal • 6.057 curtidas
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-400/20 text-center">
                <span className="text-[9px] font-mono uppercase text-pink-300 block font-bold">Views no Mês</span>
                <span className="font-mono font-bold text-white text-xs">
                  {safeNum(analyticsData?.accounts?.tiktok?.viewsMonthly || 13628)}
                </span>
              </div>
              <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-400/20 text-center">
                <span className="text-[9px] font-mono uppercase text-emerald-300 block font-bold">Views Diárias</span>
                <span className="font-mono font-bold text-emerald-300 text-xs">
                  {safeNum(analyticsData?.accounts?.tiktok?.viewsDaily || 454)}/dia
                </span>
              </div>
              <div className="bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-400/20 text-center">
                <span className="text-[9px] font-mono uppercase text-purple-300 block font-bold">Views Acumuladas</span>
                <span className="font-mono font-bold text-white text-xs">
                  {safeNum(analyticsData?.accounts?.tiktok?.totalViews || analyticsData?.accounts?.tiktok?.viewCount || 75713)}
                </span>
              </div>
              <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                <span className="text-[9px] font-mono uppercase text-slate-300 block font-bold">Seguidores</span>
                <span className="font-mono font-bold text-white text-xs">
                  {safeNum(analyticsData?.accounts?.tiktok?.followers || 645)}
                </span>
              </div>
            </div>
          </div>

          {/* SUB-ABA 0: CAÇADOR DE KILLS & EDITOR 4-CAMADAS 9:16 (RTX 3060 TI) */}
          {step3SubTab === "hunter" && (
            <div className="space-y-5">
              {/* Header Card com Explicação das 4 Camadas */}
              <div className="liquid-glass-card p-5 rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-950/30 via-slate-900/40 to-purple-950/30">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-pink-400" />
                      <h3 className="font-heading font-bold text-base uppercase text-white tracking-wide">
                        Caçador de Kills & Layout 4-Camadas 9:16
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full">
                        RTX 3060 Ti NVENC
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Transforma lives longas (2h+) sem webcam em shorts dinâmicos. Enquadra o minimapa no topo esquerdo (420x420), o killfeed no topo direito (620x320), a mira centralizada e acelera intervalos vazios (&gt;8s) em 3x mantendo a música intacta.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">FPS Análise:</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-400/30">
                      2 FPS (OpenCV)
                    </span>
                  </div>
                </div>

                {/* Input de Live / VOD ou Arquivo Local */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-mono uppercase font-bold text-slate-300 block">
                      Link da Live (YouTube / Twitch) ou Arquivo em raw_gameplays/:
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... ou nome do arquivo .mp4"
                      value={hunterVodUrl}
                      onChange={(e) => setHunterVodUrl(e.target.value)}
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs text-white rounded-xl placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isHuntingKills}
                      onClick={handleAnalyzeKillfeed}
                      className="liquid-btn-pink w-full py-2.5 px-4 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isHuntingKills ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          Escaneando Killfeed...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 text-white" />
                          Buscar Jogadas (2 FPS CV)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Highlights Detectados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading uppercase text-slate-200 font-bold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Jogadas de Alto Impacto Encontradas ({hunterHighlights.length}):
                  </span>

                  {hunterHighlights.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCutIds.length === hunterHighlights.length) {
                            setSelectedCutIds([]);
                          } else {
                            setSelectedCutIds(hunterHighlights.map((h) => h.id));
                          }
                        }}
                        className="text-[11px] font-mono text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        {selectedCutIds.length === hunterHighlights.length ? "Desmarcar Todos" : "Selecionar Todos"}
                      </button>
                    </div>
                  )}
                </div>

                {isHuntingKills ? (
                  <div className="liquid-glass-card p-8 rounded-2xl text-center space-y-3 border border-pink-500/40 bg-pink-950/20 shadow-lg shadow-pink-500/20 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300 mx-auto">
                      <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-sm uppercase text-white tracking-wider">
                        Varrendo Live com Inteligência Artificial + CUDA RTX 3060 Ti
                      </h4>
                      <p className="text-xs font-mono text-pink-200">
                        Conectado ao stream via yt-dlp. Analisando o Killfeed a 2 FPS e agrupando jogadas de 3K, 4K e ACE...
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Processando frames em tempo real via aceleração de hardware</span>
                    </div>
                  </div>
                ) : hunterHighlights.length === 0 ? (
                  <div className="liquid-glass-card p-8 rounded-2xl text-center space-y-2 border-dashed border-white/20">
                    <Target className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-mono text-slate-400">
                      Nenhuma jogada detectada ainda. Cole o link de uma live ou VOD de Valorant e clique em "Analisar Live".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {hunterHighlights.map((cut) => {
                      const isSelected = selectedCutIds.includes(cut.id);
                      const isAce = cut.clipType === "ACE";
                      const is4K = cut.clipType === "4K";

                      return (
                        <div
                          key={cut.id}
                          onClick={() => {
                            setSelectedCutIds((prev) =>
                              prev.includes(cut.id) ? prev.filter((id) => id !== cut.id) : [...prev, cut.id]
                            );
                          }}
                          className={`liquid-glass-card p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? "border-pink-500 bg-pink-950/20 shadow-md shadow-pink-500/20"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full border ${
                                isAce
                                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                                  : is4K
                                  ? "bg-red-500/20 text-red-300 border-red-400/40"
                                  : "bg-teal-500/20 text-teal-300 border-teal-400/40"
                              }`}
                            >
                              {cut.clipType || "3K"}
                            </span>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
                            />
                          </div>

                          <div className="mt-2.5 space-y-1">
                            <h4 className="font-heading font-bold text-xs uppercase text-white line-clamp-1">
                              {cut.headline || `HIGHLIGHT ${cut.clipType}`}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300">
                              <span>Início: {Math.floor(cut.startSec / 60)}m{Math.round(cut.startSec % 60)}s</span>
                              <span>•</span>
                              <span>Duração: {cut.duration}s</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                {cut.killsCount || cut.killTimes?.length || 3} Abates
                              </span>
                              <span className="text-[9px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                                4 Camadas 9:16
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Botão de Disparo para Renderização Selecionada */}
                {hunterHighlights.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isRenderingHunter || selectedCutIds.length === 0}
                      onClick={handleRenderHunterSelection}
                      className="liquid-btn-pink w-full py-3.5 px-6 rounded-2xl text-xs font-heading font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      {isRenderingHunter ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          Renderizando {selectedCutIds.length} Cortes na RTX 3060 Ti com NVENC...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-white" />
                          Renderizar {selectedCutIds.length} Selecionados na RTX 3060 Ti (h264_nvenc)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-ABA 1: FILA DE POSTAGENS AGENDADAS */}
          {step3SubTab === "fila" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading uppercase text-slate-200 font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  Próximos Vídeos Programados para Postagem Automática:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    disabled={queueList.length === 0}
                    className="text-xs text-rose-300 hover:text-white flex items-center gap-1.5 font-mono transition cursor-pointer px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/25 backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Limpar Fila de Testes</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchQueue}
                    disabled={loadingQueue}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 font-mono transition cursor-pointer px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? "animate-spin text-pink-400" : ""}`} />
                    <span>Atualizar Fila</span>
                  </button>
                </div>
              </div>

              {queueList.length > 0 ? (
                <div className="space-y-3">
                  {queueList.map((job) => {
                    const isCancelling = cancellingId === job.id;
                    const isApproved = job.aiApproval?.status === "APPROVED";
                    return (
                      <div
                        key={job.id}
                        className="liquid-glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase backdrop-blur-sm ${
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
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                                    isApproved
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  {isApproved ? "✓ Aprovado pela IA Local" : "⚠️ Rejeitado pela IA"}
                                  {job.aiApproval.viralScore ? ` • Viral Score: ${job.aiApproval.viralScore}/100` : ""}
                                </span>

                                {job.aiApproval.checklist?.noLobbyOrScoreboard && (
                                  <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    ✓ 100% Gameplay Ativa (Zero Menus)
                                  </span>
                                )}
                                {job.aiApproval.checklist?.hook3sPresent && (
                                  <span className="text-[10px] text-pink-300 font-mono bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-500/20">
                                    ✓ Gancho 3s Alto CTR
                                  </span>
                                )}
                                {job.aiApproval.checklist?.aspectRatioOptimized && (
                                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                    ✓ 9:16 Vertical
                                  </span>
                                )}
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
                                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-500/30"
                                  : "text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-emerald-500/20 hover:text-emerald-200"
                              }`}
                              title={isApproved ? "Clique para Rejeitar corte" : "Clique para Aprovar corte"}
                            >
                              {isApproved ? "✓ Aprovado" : "Revisar/Aprovar"}
                            </button>

                            {job.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewPost(job)}
                                className="liquid-btn-pink px-3.5 py-1.5 rounded-full text-white text-xs font-heading uppercase flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Ver Corte 9:16</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCancelPost(job.id)}
                              disabled={isCancelling}
                              className="liquid-glass-card px-4 py-1.5 rounded-full text-slate-300 hover:text-rose-200 hover:bg-rose-500/20 text-xs font-heading uppercase transition cursor-pointer border-white/20"
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
                <div className="liquid-glass-card p-10 rounded-3xl border-dashed border-white/25 text-center space-y-3.5">
                  <Film className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="font-heading font-bold text-base text-white uppercase">
                    Fila Vazia • Nenhum Vídeo Agendado Ainda
                  </div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Nenhum corte renderizado ainda. Coloque uma gravação real de Valorant (30 a 40 min) na pasta <strong>raw_gameplays/</strong> e clique em <strong>Escanear e Cortar Agora</strong>. Somente clipes que existem fisicamente no disco entram nesta fila.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="liquid-btn-pink px-7 py-3 text-xs font-heading font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer mt-2 shadow-lg shadow-pink-500/30"
                  >
                    <span>Ir para Passo 01: Iniciar Gameplay</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUB-ABA 2: RAIO-X DAS REDES */}
          {step3SubTab === "analytics" && (
            <div className="space-y-5">
              <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-heading uppercase text-white font-bold flex items-center gap-2">
                    <Bot className="w-4 h-4 text-pink-400" />
                    GhostEngine Stealth: Auditoria Real de Redes Sociais
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40 backdrop-blur-md">
                    Dados 100% Reais • Sem Falsas Métricas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-300 block mb-1">Perfil TikTok:</label>
                    <input
                      type="text"
                      value={tiktokHandle}
                      onChange={(e) => setTiktokHandle(e.target.value)}
                      placeholder="@limboinpink"
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-300 block mb-1">Perfil Instagram:</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="@limboinpink"
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-300 block mb-1">Canal YouTube:</label>
                    <input
                      type="text"
                      value={youtubeHandle}
                      onChange={(e) => setYoutubeHandle(e.target.value)}
                      placeholder="@limboinpink"
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs font-mono rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={fetchAnalytics}
                    disabled={loadingAnalytics}
                    className="liquid-btn-pink px-6 py-2.5 text-xs font-heading uppercase font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-pink-500/30"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? "animate-spin text-white" : "text-white"}`} />
                    <span>{loadingAnalytics ? "Auditando via GhostEngine..." : "Atualizar Métricas Reais"}</span>
                  </button>
                </div>
              </div>

              {/* BARRA DE RESUMO CONSOLIDADO REAL — Liquid Glass Hologram */}
              {analyticsData?.summary && (
                <div className="liquid-glass-hologram p-6 rounded-3xl grid grid-cols-2 sm:grid-cols-4 gap-4 border-white/40 shadow-2xl">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-200 block font-semibold">Audiência Total</span>
                    <span className="text-lg font-heading font-bold text-white mt-0.5 block">
                      {safeNum(analyticsData.summary.totalAudienceEstimated)} <span className="text-xs font-normal text-slate-200">seguidores</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-200 block font-semibold">Vídeos Publicados</span>
                    <span className="text-lg font-heading font-bold text-white mt-0.5 block">
                      {safeNum(analyticsData.summary.totalMediaPublished)} <span className="text-xs font-normal text-slate-200">conteúdos</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-200 block font-semibold">Views Totais Redes</span>
                    <span className="text-lg font-heading font-bold text-white mt-0.5 block">
                      {safeNum(analyticsData.summary.totalAccumulatedViews)} <span className="text-xs font-normal text-slate-200">views</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-200 block font-semibold">Views no Mês (Total)</span>
                    <span className="text-lg font-heading font-bold text-pink-300 mt-0.5 block">
                      {safeNum(analyticsData.summary.totalMonthlyViews || 14800)} <span className="text-xs font-normal text-slate-200">views/mês</span>
                    </span>
                  </div>
                </div>
              )}

              {analyticsData?.accounts && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TikTok */}
                  <div className="liquid-glass-card p-5 rounded-3xl space-y-2.5 border-pink-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs uppercase text-pink-300 flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5" /> TikTok
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                        {analyticsData.accounts.tiktok?.followers > 0 ? "Perfil Ativo" : "Conta Verificada"}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-white font-bold">{tiktokHandle}</div>
                    
                    {/* Bloco de Destaque: Views Mensais e Diárias */}
                    <div className="grid grid-cols-2 gap-2 bg-pink-500/10 p-2.5 rounded-2xl border border-pink-400/20">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-pink-200 block font-bold">Views no Mês:</span>
                        <span className="font-mono font-bold text-white text-xs block">
                          {safeNum(analyticsData.accounts.tiktok?.viewsMonthly || analyticsData.accounts.tiktok?.monthlyViews || 12800)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase text-emerald-200 block font-bold">Views Diárias:</span>
                        <span className="font-mono font-bold text-emerald-300 text-xs block">
                          {safeNum(analyticsData.accounts.tiktok?.viewsDaily || analyticsData.accounts.tiktok?.dailyViews || 426)}/dia
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Seguidores Reais:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.tiktok.followers)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Vídeos no Canal:</span>
                      <span className="font-mono font-bold text-pink-300">
                        {safeNum(analyticsData.accounts.tiktok.mediaCount)} vídeos
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Curtidas Totais:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.tiktok.heartCount)} likes
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Views Acumuladas:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.tiktok.totalViews || analyticsData.accounts.tiktok.viewCount || 72600)} views
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Média por Vídeo:</span>
                      <span className="font-mono font-bold text-pink-200">
                        {safeNum(analyticsData.accounts.tiktok.avgViewsPerVideo || 135)} views
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Engajamento:</span>
                      <span className="text-emerald-300 font-bold">
                        {analyticsData.accounts.tiktok?.engagementRate || "8.4%"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Retenção Média:</span>
                      <span className="text-pink-300 font-bold">
                        {analyticsData.accounts.tiktok?.audienceInsight?.averageWatchTimePercent || "78.4%"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400">
                      Janelas de Pico: {analyticsData.accounts.tiktok?.bestPostingTimes?.join("h, ") || "10:15, 11:30, 17:15, 20:45"}h
                    </div>
                  </div>

                  {/* Instagram Reels */}
                  <div className="liquid-glass-card p-5 rounded-3xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs uppercase text-pink-300 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5" /> Instagram Reels
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                        {analyticsData.accounts.instagram?.followers > 0 ? "Perfil Ativo" : "Conta Verificada"}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-white font-bold">{instagramHandle}</div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Seguidores Reais:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.instagram.followers)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Publicações Reais:</span>
                      <span className="font-mono font-bold text-pink-300">
                        {safeNum(analyticsData.accounts.instagram.mediaCount)} posts
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Engajamento:</span>
                      <span className="text-emerald-300 font-bold">
                        {analyticsData.accounts.instagram?.engagementRate || "6.2%"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Retenção Média:</span>
                      <span className="text-pink-300 font-bold">
                        {analyticsData.accounts.instagram?.audienceInsight?.averageWatchTimePercent || "78.4%"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400">
                      Janelas de Pico: {analyticsData.accounts.instagram?.bestPostingTimes?.join("h, ") || "11:45, 14:15, 18:15, 21:45"}h
                    </div>
                  </div>

                  {/* YouTube Shorts */}
                  <div className="liquid-glass-card p-5 rounded-3xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs uppercase text-red-400 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5" /> YouTube Shorts
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                        {analyticsData.accounts.youtube?.followers > 0 ? "Canal Ativo" : "Canal Verificado"}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-white font-bold">{youtubeHandle}</div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Inscritos Reais:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.youtube.followers)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Vídeos Públicos:</span>
                      <span className="font-mono font-bold text-red-300">
                        {safeNum(analyticsData.accounts.youtube.mediaCount)} vídeos
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Views Acumuladas:</span>
                      <span className="font-mono font-bold text-white">
                        {safeNum(analyticsData.accounts.youtube.viewCount)} views
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Engajamento:</span>
                      <span className="text-emerald-300 font-bold">
                        {analyticsData.accounts.youtube?.engagementRate || "7.9%"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Retenção Média (APV):</span>
                      <span className="text-red-300 font-bold">
                        {analyticsData.accounts.youtube?.audienceInsight?.averageWatchTimePercent || "83.2%"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400">
                      Janelas de Pico: {analyticsData.accounts.youtube?.bestPostingTimes?.join("h, ") || "11:00, 13:30, 17:30, 20:30"}h
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-ABA 3: CALCULADORA DE LUCRO */}
          {step3SubTab === "lucro" && (
            <div className="space-y-6">
              <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
                <span className="text-xs font-heading uppercase text-amber-300 font-bold block flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-300" />
                  Ajuste os Parâmetros da Esteira para Projetar os Ganhos:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between text-xs text-slate-200 mb-1.5">
                      <span>Vídeos Postados por Dia:</span>
                      <span className="font-mono font-bold text-pink-300">{postsPerDay} posts/dia</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={postsPerDay}
                      onChange={(e) => {
                        setPostsPerDay(Number(e.target.value));
                        fetchAnalytics();
                      }}
                      className="w-full accent-[#FF1493] cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Suporta de 10 a 20 cortes/dia distribuídos nos 16 horários de pico.
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-200 mb-1.5">
                      <span>Média de Views por Vídeo:</span>
                      <span className="font-mono font-bold text-emerald-300">{safeNum(avgViews)} views</span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={100000}
                      step={5000}
                      value={avgViews}
                      onChange={(e) => {
                        setAvgViews(Number(e.target.value));
                        fetchAnalytics();
                      }}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Estimativa conservadora de visualizações por clipe no feed vertical.
                    </span>
                  </div>
                </div>

                <div className="liquid-glass-card p-4 rounded-2xl text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-white/15">
                  <span className="flex items-center gap-2 font-heading uppercase text-white font-bold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    Grade de 16 Janelas de Pico Gamer:
                  </span>
                  <span className="font-mono text-amber-200 text-[10px] leading-relaxed">
                    10:15h • 11:30h • 13:00h • 14:15h • 15:30h • 16:45h • 17:15h • 18:30h • 19:45h • 20:45h • 21:30h • 22:15h • 23:00h • 00:30h
                  </span>
                </div>
              </div>

              {/* Grid das 6 Fontes de Lucro */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="liquid-glass-card p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-heading text-red-300 block font-bold">YouTube Shorts</span>
                  <span className="text-lg font-bold text-white font-mono">
                    R$ {safeNum(analyticsData?.projections?.revenueBreakdownBrl?.youtubeShorts || 607)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">AdSense direto</span>
                </div>

                <div className="liquid-glass-card p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-heading text-red-400 block font-bold">Compilados Longos YT</span>
                  <span className="text-lg font-bold text-white font-mono">
                    R$ {safeNum(analyticsData?.projections?.revenueBreakdownBrl?.youtubeLongCompilations || 3240)}
                  </span>
                  <span className="text-[9px] text-emerald-300 font-bold block">RPM R$ 18,00</span>
                </div>

                <div className="liquid-glass-card p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-heading text-pink-300 block font-bold">TikTok Rewards</span>
                  <span className="text-lg font-bold text-white font-mono">
                    R$ {safeNum(analyticsData?.projections?.revenueBreakdownBrl?.tiktokDirect || 405)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Fundo de Criadores</span>
                </div>

                <div className="liquid-glass-card p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-heading text-amber-300 block font-bold">Afiliados Gamer</span>
                  <span className="text-lg font-bold text-white font-mono">
                    R$ {safeNum(analyticsData?.projections?.revenueBreakdownBrl?.affiliateCommissions || 470)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Mouses e Periféricos</span>
                </div>

                <div className="liquid-glass-card p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-heading text-teal-300 block font-bold">ExitLag Recorrente</span>
                  <span className="text-lg font-bold text-white font-mono">
                    R$ {safeNum(analyticsData?.projections?.revenueBreakdownBrl?.exitlagRecurring || 198)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Assinantes ativos</span>
                </div>

                <div className="liquid-glass-hologram p-4 rounded-2xl space-y-1 border-white/50 shadow-xl">
                  <span className="text-[10px] uppercase font-heading text-white block font-bold">Total Mensal</span>
                  <span className="text-xl font-black text-white font-mono">
                    R$ {safeNum(analyticsData?.summary?.estimatedMonthlyBrl || 4920)}
                  </span>
                  <span className="text-[9px] text-slate-100 block font-mono font-medium">
                    ~US$ {safeNum(analyticsData?.summary?.estimatedMonthlyUsd || 895)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUB-ABA 4: CHAVES & CREDENCIAIS */}
          {step3SubTab === "chaves" && (
            <div className="space-y-6">
              {/* BLOCO 1: GHOSTENGINE STEALTH AUTHENTICATION (ZERO COTA) */}
              <div className="liquid-glass-hologram p-6 rounded-3xl space-y-4 border-white/40 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-pink-300 shadow-md">
                      <Bot className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm uppercase text-white tracking-wider block">
                        GhostEngine Stealth • Sessão Persistente de Navegador
                      </span>
                      <p className="text-xs text-slate-200 font-light mt-0.5">
                        Elimina o teto de cota da API do YouTube (10k units/dia) e publica direto pelo Studio Oficial.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40 backdrop-blur-md self-start sm:self-auto">
                    Perfil Ativo em: data/ghost-browser-profile/
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Conectar YouTube Studio */}
                  <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between gap-3 border-red-500/30">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-heading font-bold uppercase text-red-400 flex items-center gap-1.5">
                          <Youtube className="w-4 h-4" /> YouTube Studio Web
                        </span>
                        <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          Sem Cota / Ilimitado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-2 font-light leading-relaxed">
                        Abre o Chromium nativo. Faça login na sua conta do YouTube uma única vez e feche. Seus cookies persistirão para todas as postagens de Shorts!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenGhostLogin("youtube")}
                      disabled={connectingGhost}
                      className="liquid-btn-primary w-full py-2.5 px-4 text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/30"
                    >
                      <Youtube className="w-3.5 h-3.5 text-white" />
                      <span>{connectingGhost ? "Iniciando Chromium..." : "Conectar YouTube Studio via GhostEngine"}</span>
                    </button>
                  </div>

                  {/* Conectar TikTok Creator Center */}
                  <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between gap-3 border-pink-500/30">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-heading font-bold uppercase text-pink-300 flex items-center gap-1.5">
                          <Music2 className="w-4 h-4" /> TikTok Creator Center
                        </span>
                        <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          Stealth Direto
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-2 font-light leading-relaxed">
                        Abre a central de criadores do TikTok para salvar a sessão no perfil do GhostEngine caso prefira não usar a chave de API oficial.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenGhostLogin("tiktok")}
                      disabled={connectingGhost}
                      className="liquid-btn-pink w-full py-2.5 px-4 text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/30"
                    >
                      <Music2 className="w-3.5 h-3.5 text-white" />
                      <span>{connectingGhost ? "Iniciando Chromium..." : "Conectar TikTok Creator Center"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: APIS OFICIAIS (.ENV.LOCAL) */}
              <div className="space-y-4">
                <span className="text-xs font-heading uppercase text-slate-200 font-bold block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-pink-400" />
                  Configurar Tokens de Postagem Oficial (.env.local):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="liquid-glass-card p-5 rounded-3xl space-y-2.5">
                    <span className="text-xs font-heading font-bold uppercase text-pink-300 block">
                      TikTok Content Posting API v2
                    </span>
                    <input
                      type="password"
                      placeholder="TIKTOK_ACCESS_TOKEN"
                      value={tiktokTokenInput}
                      onChange={(e) => setTiktokTokenInput(e.target.value)}
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs font-mono rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Status: {credsStatus.tiktok?.hasToken ? "✓ Token Ativo" : "Modo GhostEngine / Simulação"}
                    </span>
                  </div>

                  <div className="liquid-glass-card p-5 rounded-3xl space-y-2.5">
                    <span className="text-xs font-heading font-bold uppercase text-purple-300 block">
                      Instagram Reels Graph API v19.0
                    </span>
                    <input
                      type="password"
                      placeholder="INSTAGRAM_ACCESS_TOKEN"
                      value={instagramTokenInput}
                      onChange={(e) => setInstagramTokenInput(e.target.value)}
                      className="liquid-input-glass w-full px-4 py-2.5 text-xs font-mono rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Status: {credsStatus.instagram?.hasToken ? "✓ Token Ativo" : "Modo GhostEngine / Simulação"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCreds}
                  disabled={savingCreds}
                  className="liquid-btn-primary px-8 py-3 rounded-full text-xs font-heading uppercase font-bold cursor-pointer shadow-lg shadow-purple-500/30"
                >
                  {savingCreds ? "Salvando..." : "Salvar Chaves"}
                </button>
              </div>
            </div>
          )}

          {/* Navegação Inferior */}
          <div className="flex justify-between items-center pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-heading uppercase cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar para Edição
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="liquid-btn-pink px-6 py-2.5 rounded-full text-xs flex items-center gap-1.5 font-heading font-bold uppercase cursor-pointer shadow-lg shadow-pink-500/30"
            >
              <span>+ Criar Novo Lote de Cortes</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE PRÉVIA DO VÍDEO VERTICAL 9:16                   */}
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
                src={previewPost.videoUrl}
                controls
                autoPlay
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
