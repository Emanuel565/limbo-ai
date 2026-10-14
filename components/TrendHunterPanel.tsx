/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Search,
  Eye,
  ThumbsUp,
  Play,
  ArrowRight,
  Flame,
  Cpu,
} from "lucide-react";


interface CandidateVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt?: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  durationSeconds: number;
  durationFormatted: string;
  engagementRate: number;
  viralityScore: number;
  url: string;
  platform?: "youtube" | "tiktok" | "instagram";
  soundTitle?: string;
  authorHandle?: string;
  source?: string;
  tags?: string[];
}

interface OllamaDecision {
  videoId: string;
  url: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  viralScore: number;
  curiosityGapScore?: number;
  patternInterruptScore?: number;
  emotionalResonance?: number;
  shareabilityFactor?: number;
  viralHookFormula?: string;
  suggestedHeadline?: string;
  hookAnalysis: string;
  whyViral: string;
  recommendedClipAngle: string;
  modelUsed: string;
  isAiSelected: boolean;
}

const PRESET_NICHES_BY_PLATFORM = {
  youtube: [
    "podcast tecnologia",
    "inteligência artificial",
    "negócios e investimentos",
    "clínica estética premium",
    "desenvolvimento pessoal",
  ],
  tiktok: [
    "#viral",
    "#corte",
    "#marketing",
    "#ia",
    "#podcast",
    "#investimentos",
  ],
  instagram: [
    "#reels",
    "#crescimento",
    "#marketingdigital",
    "#videoeditor",
    "#podcastbrasil",
  ],
};

export default function TrendHunterPanel() {
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram">("youtube");
  const [engine, setEngine] = useState<"auto" | "ghost" | "official">("ghost");
  const [mode, setMode] = useState<"search" | "charts">("charts");
  const [regionCode, setRegionCode] = useState("BR");
  const [niche, setNiche] = useState("podcast tecnologia");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateVideo[]>([]);
  const [decision, setDecision] = useState<OllamaDecision | null>(null);
  const [error, setError] = useState("");
  const [model, setModel] = useState("llama3.1:8b");
  const [engineUsedBadge, setEngineUsedBadge] = useState<string>("");

  async function handleSearch(
    targetNiche = niche,
    currentMode = mode,
    currentRegion = regionCode,
    currentPlatform = platform,
    currentEngine = engine
  ) {
    setLoading(true);
    setError("");
    setDecision(null);

    try {
      const response = await fetch("/api/trend-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: currentPlatform,
          engine: currentEngine,
          mode: currentMode,
          regionCode: currentRegion,
          niche: targetNiche,
          maxResults: 6,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível analisar as tendências no momento.");
      }

      setCandidates(data.candidates || []);
      setDecision(data.selected || null);
      setEngineUsedBadge(data.engineUsed || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao conectar ao Trend Hunter.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSendToCutter(url: string, headline?: string, hook?: string) {
    const shortsSection = document.getElementById("shorts");
    if (shortsSection) {
      shortsSection.scrollIntoView({ behavior: "smooth" });
    }
    // Dispara evento com url, headline sugerida e gancho
    const event = new CustomEvent("select-short-video", {
      detail: {
        url,
        headline: headline || decision?.suggestedHeadline,
        hook: hook || decision?.hookAnalysis,
      },
    });
    window.dispatchEvent(event);
  }

  return (
    <section id="trend-hunter" className="py-24 px-4 relative overflow-hidden bg-[#160212]">
      {/* Decorative luxury lighting Deep Pink #FF1493 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF1493]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-[#FF1493]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header with Deep Pink Elegance */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="belve-badge flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF1493]" />
              Módulo de Tendências & IA Local
            </span>
          </div>

          <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">
            Trend Hunter <span className="belve-gradient-text">Viral</span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-light leading-relaxed">
            A IA local vasculha os Top Trending do momento e analisa vídeos no seu nicho, calculando
            métricas de retenção, quebra de padrão e gatilhos psicológicos para viralizar no TikTok, Shorts e Reels.
          </p>

          {/* Platform Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { id: "youtube", label: "YouTube Trends", icon: "🔴" },
              { id: "tiktok", label: "TikTok Viral", icon: "🎵" },
              { id: "instagram", label: "Instagram Reels", icon: "📸" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const newPlatform = p.id as "youtube" | "tiktok" | "instagram";
                  setPlatform(newPlatform);
                  const firstPreset = PRESET_NICHES_BY_PLATFORM[newPlatform][0];
                  setNiche(firstPreset);
                  handleSearch(firstPreset, mode, regionCode, newPlatform, engine);
                }}
                className={`px-5 py-2 rounded-full font-heading text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  platform === p.id
                    ? "bg-[#FF1493] text-white font-bold shadow-lg shadow-[#FF1493]/35 ring-2 ring-[#FF1493]/50"
                    : "bg-black/50 text-slate-300 border border-white/10 hover:border-[#FF1493]/40"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Ghost Engine Toggle & Origin Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                const nextEngine = engine === "ghost" ? "official" : "ghost";
                setEngine(nextEngine);
                handleSearch(niche, mode, regionCode, platform, nextEngine);
              }}
              className={`text-[11px] px-3.5 py-1.5 rounded-full font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                engine === "ghost"
                  ? "bg-[#FF1493]/20 border-[#FF1493] text-white shadow-sm shadow-[#FF1493]/30"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${engine === "ghost" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
              <span>👻 Ghost Engine v2: {engine === "ghost" ? "ATIVO (Zero API Key / Stealth)" : "Desativado (API Oficial)"}</span>
            </button>
            {engineUsedBadge && (
              <span className="text-[10px] font-mono text-[#e8d9c6] px-2.5 py-1 rounded-md bg-black/50 border border-[#e8d9c6]/20">
                Fonte: {engineUsedBadge}
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex justify-center gap-3 mt-5">
            <button
              onClick={() => {
                setMode("charts");
                handleSearch(niche, "charts", regionCode, platform, engine);
              }}
              className={`px-6 py-2.5 rounded-full font-heading text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                mode === "charts"
                  ? "bg-white/15 text-white font-bold border border-white/30"
                  : "bg-black/40 text-slate-300 border border-white/10 hover:border-[#FF1493]/40"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300" />
              🔥 {platform === "tiktok" ? "Top TikTok Virais" : platform === "instagram" ? "Top Reels" : "Top Charts Brasil"}
            </button>

            <button
              onClick={() => setMode("search")}
              className={`px-6 py-2.5 rounded-full font-heading text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                mode === "search"
                  ? "bg-white/15 text-white font-bold border border-white/30"
                  : "bg-black/40 text-slate-300 border border-white/10 hover:border-[#FF1493]/40"
              }`}
            >
              <Search className="w-4 h-4" />
              🎯 Pesquisa por Nicho / Hashtag
            </button>
          </div>

          {/* Quick Preset Pills (Only if in search mode) */}
          {mode === "search" && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {PRESET_NICHES_BY_PLATFORM[platform].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setNiche(preset);
                    handleSearch(preset, "search", regionCode, platform, engine);
                  }}
                  disabled={loading}
                  className={`text-xs px-4 py-1.5 rounded-full font-heading uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    niche === preset
                      ? "bg-[#FF1493] text-white font-bold shadow-md shadow-[#FF1493]/35"
                      : "bg-white/5 text-slate-300 border border-white/10 hover:border-[#FF1493]/40 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>


        {/* Search Bar Capsule */}
        <div className="belve-card rounded-3xl p-4 md:p-6 mb-10 max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(niche, mode, regionCode);
            }}
            className="flex flex-col sm:flex-row items-stretch gap-3"
          >
            {mode === "search" ? (
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e8d9c6]/70" />
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: podcast tecnologia, IA generativa, marketing..."
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#FF1493] transition-colors"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2 px-3">
                <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6]">
                  Região dos Charts:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { code: "BR", label: "🇧🇷 Brasil" },
                    { code: "US", label: "🇺🇸 EUA" },
                    { code: "GB", label: "🇬🇧 Reino Unido" },
                  ].map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => {
                        setRegionCode(r.code);
                        handleSearch(niche, "charts", r.code);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full font-heading font-medium transition ${
                        regionCode === r.code
                          ? "bg-[#FF1493] text-white font-bold"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="py-3 px-4 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-xs text-[#e8d9c6] font-heading uppercase tracking-wider focus:outline-none focus:border-[#FF1493]"
              >
                <option value="llama3.1:8b" className="bg-slate-900 text-white">
                  Llama 3.1 8B (GPU)
                </option>
                <option value="qwen2.5-coder:7b" className="bg-slate-900 text-white">
                  Qwen 2.5 7B (GPU)
                </option>
                <option value="gemma2:9b" className="bg-slate-900 text-white">
                  Gemma 2 9B (GPU)
                </option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="belve-btn-champagne px-7 py-3 text-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {mode === "charts" ? "Escanear Top Charts" : "Descobrir Tendências"}
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="belve-card rounded-3xl p-8 text-center max-w-xl mx-auto my-8">
            <div className="relative w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-[#FF1493]/10 border border-[#FF1493]/40">
              <Cpu className="w-6 h-6 text-[#FF1493] animate-pulse" />
            </div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-white mb-2">
              Processando Métricas de Viralidade & Retenção
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-4">
              Extraindo visualizações, comentários, likes e avaliando quebra de padrão com o modelo local na RTX 3060 Ti...
            </p>
            <div className="w-48 h-1.5 bg-black/50 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF1493] to-amber-300 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* AI Selection Card (Winner Spotlight) */}
        {decision && !loading && (
          <div className="mb-14">
            <div className="text-center mb-6">
              <span className="belve-badge bg-[#FF1493]/20 border-[#FF1493]/60 text-white inline-flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-amber-400" />
                Veredito da IA Local • Campeão de Retenção & Viralidade
              </span>
            </div>

            <div className="belve-card rounded-3xl p-6 md:p-8 border-[#FF1493]/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF1493]/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Thumbnail & Preview */}
                <div className="lg:col-span-5 relative group">
                  <div className="relative rounded-2xl overflow-hidden border border-[#FF1493]/30 aspect-video shadow-lg">
                    {decision.thumbnail ? (
                      <img
                        src={decision.thumbnail}
                        alt={decision.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Play className="w-10 h-10 text-[#FF1493]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                        {decision.channelTitle || "Canal em Alta"}
                      </span>
                      <span className="text-xs font-heading font-bold text-white px-3 py-1 rounded-full bg-[#FF1493] shadow-md shadow-[#FF1493]/40">
                        VIRAL {decision.viralScore || 95}/100
                      </span>
                    </div>
                  </div>

                  {/* Viral Hook Formula Badge */}
                  {decision.viralHookFormula && (
                    <div className="mt-3 p-3 rounded-2xl bg-black/50 border border-[#FF1493]/30 flex items-center justify-between">
                      <span className="text-[10px] font-heading uppercase tracking-wider text-[#FF1493] font-bold">
                        ⚡ Fórmula de Gancho:
                      </span>
                      <span className="text-xs text-white font-medium">
                        {decision.viralHookFormula}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Reasoning Details */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight leading-snug mb-2">
                      {decision.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-3">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        Modelo: <strong className="text-[#FF1493]">{decision.modelUsed}</strong>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300">
                        ✓ Pronto para TikTok (#fyp), Shorts & Reels
                      </span>
                    </div>

                    {/* Viral Psychology Matrix 4-Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 block font-heading uppercase">Curiosidade</span>
                        <span className="text-sm font-bold text-[#FF1493]">
                          {decision.curiosityGapScore || 92}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 block font-heading uppercase">Quebra Padrão</span>
                        <span className="text-sm font-bold text-amber-300">
                          {decision.patternInterruptScore || 88}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 block font-heading uppercase">Emoção</span>
                        <span className="text-sm font-bold text-pink-400">
                          {decision.emotionalResonance || 90}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 block font-heading uppercase">Compartilhar</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {decision.shareabilityFactor || 94}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Suggested Overhead Headline Banner */}
                    {decision.suggestedHeadline && (
                      <div className="p-3.5 rounded-2xl bg-[#FF1493]/15 border border-[#FF1493]/40 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-heading uppercase tracking-widest text-[#FF1493] font-bold mb-0.5">
                            🏷️ Tarja Superior Sugerida (Gancho Visual):
                          </p>
                          <p className="text-xs font-heading font-black uppercase text-white tracking-wide">
                            &ldquo;{decision.suggestedHeadline}&rdquo;
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendToCutter(decision.url, decision.suggestedHeadline, decision.hookAnalysis)}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-[#FF1493] hover:bg-[#FF1493]/80 text-white font-heading font-bold uppercase transition"
                        >
                          Usar no Editor
                        </button>
                      </div>
                    )}

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-[#e8d9c6]/20">
                      <p className="text-[11px] font-heading uppercase tracking-widest text-[#e8d9c6] font-semibold mb-1">
                        🎯 Análise de Gancho (Primeiros 3 segundos):
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {decision.hookAnalysis}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-[#a8bed5]/20">
                      <p className="text-[11px] font-heading uppercase tracking-widest text-[#a8bed5] font-semibold mb-1">
                        💡 Por que vai viralizar:
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {decision.whyViral}
                      </p>
                    </div>

                    {decision.recommendedClipAngle && (
                      <div className="p-3.5 rounded-2xl bg-[#2e3188]/20 border border-[#2e3188]/40">
                        <p className="text-[11px] font-heading uppercase tracking-widest text-violet-300 font-semibold mb-1">
                          ✂️ Ângulo Recomendado para Corte (60s):
                        </p>
                        <p className="text-xs text-violet-100 leading-relaxed">
                          {decision.recommendedClipAngle}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={decision.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="belve-btn-outline px-5 py-2.5 text-xs flex items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Assistir no YouTube
                    </a>

                    <button
                      onClick={() => handleSendToCutter(decision.url, decision.suggestedHeadline, decision.hookAnalysis)}
                      className="belve-btn-champagne px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span>Cortar com NVENC (RTX 3060 Ti)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Ranking List */}
        {candidates.length > 0 && !loading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                  Vídeos Analisados no Nicho
                </h3>
                <p className="text-xs text-slate-400">
                  Comparativo de métricas e taxa de engajamento extraídos em tempo real
                </p>
              </div>
              <span className="text-xs text-[#e8d9c6] font-heading uppercase tracking-wider">
                {candidates.length} vídeos ranqueados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidates.map((c, idx) => (
                <div
                  key={c.id}
                  className={`belve-card rounded-2xl p-4 flex flex-col justify-between group transition-all duration-300 ${
                    decision?.videoId === c.id ? "border-[#e8d9c6] ring-1 ring-[#e8d9c6]/40" : ""
                  }`}
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden aspect-video mb-3 border border-white/10">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-heading font-bold text-white border border-white/10">
                        #{idx + 1}
                      </span>
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {c.platform && (
                          <span className="px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-white border border-white/20">
                            {c.platform === "tiktok" ? "🎵 TikTok" : c.platform === "instagram" ? "📸 Reels" : "🔴 YouTube"}
                          </span>
                        )}
                        {c.source === "ghost-engine" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FF1493]/80 text-[9px] font-mono text-white">
                            👻 Ghost
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] text-white font-mono">
                        {c.durationFormatted}
                      </span>
                    </div>

                    <h4 className="font-heading text-sm font-semibold text-white line-clamp-2 mb-1 group-hover:text-[#e8d9c6] transition-colors">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">{c.channelTitle || c.authorHandle}</p>
                    {c.soundTitle && (
                      <p className="text-[11px] text-[#FF1493] line-clamp-1 mb-3 flex items-center gap-1 font-mono">
                        <span>🎵</span> {c.soundTitle}
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-3 rounded-xl bg-black/40 border border-white/5 mb-3 text-center">
                      <div>
                        <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                          <Eye className="w-3 h-3" /> Views
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {c.views > 1000 ? `${(c.views / 1000).toFixed(0)}k` : c.views}
                        </span>
                      </div>
                      <div>
                        <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                          <ThumbsUp className="w-3 h-3" /> Likes
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {c.likes > 1000 ? `${(c.likes / 1000).toFixed(0)}k` : c.likes}
                        </span>
                      </div>
                      <div>
                        <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                          <Flame className="w-3 h-3 text-amber-400" /> Viral
                        </span>
                        <span className="text-xs font-semibold text-[#e8d9c6]">
                          {c.viralityScore}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Engajamento:{" "}
                        <strong className="text-emerald-300">{c.engagementRate}%</strong>
                      </span>

                      <button
                        onClick={() => handleSendToCutter(c.url)}
                        className="text-[11px] font-heading uppercase tracking-wider text-[#e8d9c6] hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Selecionar <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
