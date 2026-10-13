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
  publishedAt: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  durationFormatted: string;
  engagementRate: number;
  viralityScore: number;
  url: string;
}

interface OllamaDecision {
  videoId: string;
  url: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  viralScore: number;
  hookAnalysis: string;
  whyViral: string;
  recommendedClipAngle: string;
  modelUsed: string;
  isAiSelected: boolean;
}

const PRESET_NICHES = [
  "podcast tecnologia",
  "inteligência artificial",
  "negócios e investimentos",
  "clínica estética premium",
  "desenvolvimento pessoal",
];

export default function TrendHunterPanel() {
  const [niche, setNiche] = useState("podcast tecnologia");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateVideo[]>([]);
  const [decision, setDecision] = useState<OllamaDecision | null>(null);
  const [error, setError] = useState("");
  const [model, setModel] = useState("llama3.1:8b");

  async function handleSearch(targetNiche = niche) {
    if (!targetNiche.trim()) return;
    setLoading(true);
    setError("");
    setDecision(null);

    try {
      const response = await fetch("/api/trend-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao conectar ao Trend Hunter.";
      setError(message);
    } finally {
      setLoading(false);
    }

  }

  function handleSendToCutter(url: string) {
    const shortsSection = document.getElementById("shorts");
    if (shortsSection) {
      shortsSection.scrollIntoView({ behavior: "smooth" });
    }
    // Dispara evento ou feedback
    const event = new CustomEvent("select-short-video", { detail: { url } });
    window.dispatchEvent(event);
  }

  return (
    <section id="trend-hunter" className="py-24 px-4 relative overflow-hidden">
      {/* Decorative luxury lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#e8d9c6]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-[#2e3188]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header with Belvè Elegance */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="belve-badge flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#e8d9c6]" />
              Módulo de Tendências & IA Local
            </span>
          </div>

          <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">
            Trend Hunter <span className="belve-gradient-text">Viral</span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-light leading-relaxed">
            A IA local vasculha o YouTube no seu nicho, calcula métricas de retenção e seleciona
            estrategicamente o melhor conteúdo para você transformar em cortes verticais de sucesso.
          </p>

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {PRESET_NICHES.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setNiche(preset);
                  handleSearch(preset);
                }}
                disabled={loading}
                className={`text-xs px-4 py-1.5 rounded-full font-heading uppercase tracking-wider transition-all duration-200 ${
                  niche === preset
                    ? "bg-[#e8d9c6] text-[#0a0a0a] font-bold shadow-md shadow-[#e8d9c6]/20"
                    : "bg-white/5 text-slate-300 border border-white/10 hover:border-[#e8d9c6]/40 hover:text-white"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Capsule */}
        <div className="belve-card rounded-3xl p-4 md:p-6 mb-10 max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e8d9c6]/70" />
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex: podcast tecnologia, IA generativa, marketing..."
                className="w-full pl-11 pr-4 py-3 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#e8d9c6] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="py-3 px-4 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-xs text-[#e8d9c6] font-heading uppercase tracking-wider focus:outline-none focus:border-[#e8d9c6]"
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
                    Descobrir Tendências
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
            <div className="relative w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-[#e8d9c6]/10 border border-[#e8d9c6]/40">
              <Cpu className="w-6 h-6 text-[#e8d9c6] animate-pulse" />
            </div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-wider text-white mb-2">
              Processando Métricas de Engajamento
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-4">
              Extraindo dados de visualizações, comentários e taxa de engajamento do YouTube e consultando
              o modelo local na RTX 3060 Ti...
            </p>
            <div className="w-48 h-1.5 bg-black/50 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e8d9c6] to-[#a8bed5] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* AI Selection Card (Winner Spotlight) */}
        {decision && !loading && (
          <div className="mb-14">
            <div className="text-center mb-6">
              <span className="belve-badge bg-[#e8d9c6]/20 border-[#e8d9c6]/60 text-white inline-flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-amber-400" />
                Veredito da IA Local • Maior Potencial de Retenção
              </span>
            </div>

            <div className="belve-card rounded-3xl p-6 md:p-8 border-[#e8d9c6]/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#e8d9c6]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Thumbnail & Preview */}
                <div className="lg:col-span-5 relative group">
                  <div className="relative rounded-2xl overflow-hidden border border-[#e8d9c6]/30 aspect-video shadow-lg">
                    {decision.thumbnail ? (
                      <img
                        src={decision.thumbnail}
                        alt={decision.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Play className="w-10 h-10 text-[#e8d9c6]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                        {decision.channelTitle || "Canal em Alta"}
                      </span>
                      <span className="text-xs font-heading font-bold text-black px-3 py-1 rounded-full bg-[#e8d9c6]">
                        SCORE {decision.viralScore || 95}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Reasoning Details */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight leading-snug mb-2">
                      {decision.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        Modelo: <strong className="text-[#e8d9c6]">{decision.modelUsed}</strong>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300">
                        ✓ Selecionado por Potencial Viral
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
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
                      onClick={() => handleSendToCutter(decision.url)}
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
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] text-white font-mono">
                        {c.durationFormatted}
                      </span>
                    </div>

                    <h4 className="font-heading text-sm font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#e8d9c6] transition-colors">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">{c.channelTitle}</p>
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
