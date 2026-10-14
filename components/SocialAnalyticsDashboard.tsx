"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Clock,
    Sparkles,
    Youtube,
    Instagram,
    Music2,
    DollarSign,
    Users,
    Eye,
    Zap,
    CheckCircle2,
    RefreshCw,
    Sliders,
    Award,
    Flame,
    Share2,
    Target,
    HelpCircle,
} from "lucide-react";

interface AccountData {
    platform: "tiktok" | "instagram" | "youtube";
    handle: string;
    name: string;
    isRealApi: boolean;
    followers: number;
    mediaCount: number;
    engagementRate: string;
    viralityScore: number;
    bestPostingTimes: string[];
    bestDays: string[];
    audienceInsight: {
        topAgeRange: string;
        topFormat: string;
        averageWatchTimePercent: string;
        estimatedRpm?: string;
    };
    recommendedHooks: string[];
    status: string;
}

interface AnalyticsApiResponse {
    ok: boolean;
    analyzedAt: string;
    accounts: {
        tiktok: AccountData;
        instagram: AccountData;
        youtube: AccountData;
    };
    projections: {
        inputs: {
            postsPerDay: number;
            avgViewsPerVideo: number;
            activeFollowers: number;
            totalShortsPerMonth: number;
        };
        viewsBreakdown: {
            youtubeShorts: number;
            youtubeLongs: number;
            tiktok: number;
            instagram: number;
            totalMonthlyViews: number;
        };
        revenueBreakdownBrl: {
            youtubeShorts: number;
            youtubeLongCompilations: number;
            tiktokDirect: number;
            affiliateCommissions: number;
            exitlagRecurring: number;
            instagramBrandDeals: number;
        };
        totals: {
            totalMonthlyBrl: number;
            totalMonthlyUsd: number;
            dailyAverageBrl: number;
        };
    };
    summary: {
        totalAudienceEstimated: number;
        highestRetentionPlatform: string;
        primeTimeToday: string;
        estimatedMonthlyBrl: number;
        estimatedMonthlyUsd: number;
    };
}

export default function SocialAnalyticsDashboard() {
    const [tiktokHandle, setTiktokHandle] = useState("@limboinpink");
    const [instagramHandle, setInstagramHandle] = useState("@limboinpink");
    const [youtubeHandle, setYoutubeHandle] = useState("@limboinpink");

    // Simulador de Projeção
    const [postsPerDay, setPostsPerDay] = useState(3);
    const [avgViews, setAvgViews] = useState(25000);
    const [createWeeklyLong, setCreateWeeklyLong] = useState(true);

    const [activeTab, setActiveTab] = useState<"overview" | "tiktok" | "instagram" | "youtube" | "simulator">("overview");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<AnalyticsApiResponse | null>(null);

    async function runAnalysis() {
        setLoading(true);
        setError("");
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
            const json = await res.json();
            if (!res.ok || !json.ok) {
                throw new Error(json.error || "Falha ao consultar métricas das redes.");
            }
            setData(json);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro desconhecido na auditoria.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    // Carrega automaticamente a análise inicial na montagem
    useEffect(() => {
        runAnalysis();
    }, []);

    // Atalho para recalcular ao mexer nos sliders do simulador
    function handleSimulatorChange(newPosts: number, newViews: number, newLong: boolean) {
        setPostsPerDay(newPosts);
        setAvgViews(newViews);
        setCreateWeeklyLong(newLong);
    }

    return (
        <section id="social-analytics" className="py-20 px-4 bg-[#14010e] relative overflow-hidden border-t border-[#FF1493]/20">
            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-[#FF1493]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header da Seção */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="belve-badge mb-3 inline-flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-[#FF1493]" />
                        Auditoria & Monetização Multiplataforma
                    </span>
                    <h2 className="font-heading text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
                        Raio-X das suas <span className="belve-gradient-text">Redes Principais</span>
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                        Acompanhe scores de retenção do algoritmo, horários nobres de engajamento e a projeção financeira
                        gerada pela esteira de cortes automáticos no <strong>TikTok</strong>, <strong>Instagram Reels</strong> e <strong>YouTube Shorts</strong>.
                    </p>
                </div>

                {/* Barra Superior de Contas & Botão de Análise */}
                <div className="belve-card rounded-3xl p-5 md:p-6 mb-10 border-[#FF1493]/30 bg-black/60 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                            <label className="block text-[11px] font-heading uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                <Music2 className="w-3.5 h-3.5 text-[#FF1493]" />
                                TikTok Handle
                            </label>
                            <input
                                id="tiktok-handle-input"
                                type="text"
                                value={tiktokHandle}
                                onChange={(e) => setTiktokHandle(e.target.value)}
                                placeholder="@seu_tiktok"
                                className="w-full bg-black/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-[#FF1493] transition"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-heading uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                Instagram Handle
                            </label>
                            <input
                                id="instagram-handle-input"
                                type="text"
                                value={instagramHandle}
                                onChange={(e) => setInstagramHandle(e.target.value)}
                                placeholder="@seu_instagram"
                                className="w-full bg-black/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-pink-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-heading uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                <Youtube className="w-3.5 h-3.5 text-red-500" />
                                Canal YouTube
                            </label>
                            <input
                                id="youtube-handle-input"
                                type="text"
                                value={youtubeHandle}
                                onChange={(e) => setYoutubeHandle(e.target.value)}
                                placeholder="@seu_canal"
                                className="w-full bg-black/70 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-red-500 transition"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                id="btn-run-social-analysis"
                                type="button"
                                onClick={runAnalysis}
                                disabled={loading}
                                className="w-full py-2.5 px-4 rounded-xl bg-[#FF1493] hover:bg-[#FF1493]/90 text-white font-heading font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF1493]/25 cursor-pointer disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                                {loading ? "Auditando Algoritmo..." : "Atualizar Auditoria (IA)"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                            {error}
                        </div>
                    )}
                </div>

                {/* Métricas Principais (Overview Cards) */}
                {data && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-heading uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[#FF1493]" />
                                    Audiência Estimada
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">+12.4% m/m</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                                {data.summary.totalAudienceEstimated.toLocaleString("pt-BR")}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Soma de seguidores nas 3 plataformas</p>
                        </div>

                        <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-heading uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                                    Rede Mais Viral
                                </span>
                                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                                    Pico
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                                {data.summary.highestRetentionPlatform}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Maior taxa de engajamento e entrega orgânica</p>
                        </div>

                        <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-heading uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                    Horário Nobre Hoje
                                </span>
                                <span className="text-[10px] text-blue-400 font-mono">Pico BRT</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                                {data.summary.primeTimeToday}h
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Janela de maior retenção dos espectadores</p>
                        </div>

                        <div className="belve-card rounded-2xl p-5 border-[#FF1493]/30 bg-[#FF1493]/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-heading uppercase tracking-wider text-pink-300 flex items-center gap-1.5 font-bold">
                                    <DollarSign className="w-3.5 h-3.5 text-[#FF1493]" />
                                    Receita Mensal Estimada
                                </span>
                                <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                                    Projeção
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                                R$ {data.summary.estimatedMonthlyBrl.toLocaleString("pt-BR")}
                            </div>
                            <p className="text-[10px] text-pink-200 mt-1 font-mono">
                                ~US$ {data.summary.estimatedMonthlyUsd.toLocaleString("en-US")} / mês
                            </p>
                        </div>
                    </div>
                )}

                {/* Navegação por Abas */}
                <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-white/10 pb-4">
                    <button
                        id="tab-analytics-overview"
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                            activeTab === "overview"
                                ? "bg-white text-black font-extrabold shadow-lg"
                                : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Visão Geral Comparativa
                    </button>

                    <button
                        id="tab-analytics-tiktok"
                        type="button"
                        onClick={() => setActiveTab("tiktok")}
                        className={`px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                            activeTab === "tiktok"
                                ? "bg-[#FF1493] text-white font-extrabold shadow-lg shadow-[#FF1493]/20"
                                : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                    >
                        <Music2 className="w-3.5 h-3.5" />
                        TikTok ({tiktokHandle})
                    </button>

                    <button
                        id="tab-analytics-instagram"
                        type="button"
                        onClick={() => setActiveTab("instagram")}
                        className={`px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                            activeTab === "instagram"
                                ? "bg-pink-600 text-white font-extrabold shadow-lg shadow-pink-600/20"
                                : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                    >
                        <Instagram className="w-3.5 h-3.5" />
                        Instagram Reels ({instagramHandle})
                    </button>

                    <button
                        id="tab-analytics-youtube"
                        type="button"
                        onClick={() => setActiveTab("youtube")}
                        className={`px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                            activeTab === "youtube"
                                ? "bg-red-600 text-white font-extrabold shadow-lg shadow-red-600/20"
                                : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                    >
                        <Youtube className="w-3.5 h-3.5" />
                        YouTube Shorts ({youtubeHandle})
                    </button>

                    <button
                        id="tab-analytics-simulator"
                        type="button"
                        onClick={() => setActiveTab("simulator")}
                        className={`px-4 py-2 rounded-xl text-xs font-heading uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                            activeTab === "simulator"
                                ? "bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-600/20"
                                : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                    >
                        <DollarSign className="w-3.5 h-3.5" />
                        Simulador de Lucro
                    </button>
                </div>

                {/* CONTEÚDO DAS ABAS */}
                {data && (
                    <div>
                        {/* ABA 1: VISÃO GERAL COMPARATIVA */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Card TikTok */}
                                    <div className="belve-card rounded-3xl p-6 border-[#FF1493]/30 bg-black/60 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-[#FF1493]/20 flex items-center justify-center text-[#FF1493]">
                                                    <Music2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-white text-sm">TikTok</h3>
                                                    <p className="text-[11px] text-slate-400 font-mono">{data.accounts.tiktok.handle}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                                Score {data.accounts.tiktok.viralityScore}
                                            </span>
                                        </div>

                                        <div className="space-y-3 py-2 border-t border-b border-white/5 my-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Seguidores:</span>
                                                <span className="font-mono text-white font-bold">{data.accounts.tiktok.followers.toLocaleString("pt-BR")}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Taxa de Engajamento:</span>
                                                <span className="font-mono text-emerald-400 font-bold">{data.accounts.tiktok.engagementRate}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Retenção Média:</span>
                                                <span className="font-mono text-[#FF1493] font-bold">{data.accounts.tiktok.audienceInsight.averageWatchTimePercent}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Faixa Etária Dominante:</span>
                                                <span className="text-white text-[11px]">{data.accounts.tiktok.audienceInsight.topAgeRange}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-heading uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-[#FF1493]" />
                                                Melhores Horários de Pico:
                                            </span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {data.accounts.tiktok.bestPostingTimes.map((time, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#FF1493]/15 text-[#FF1493] font-mono text-[11px] font-bold">
                                                        {time}h
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Instagram */}
                                    <div className="belve-card rounded-3xl p-6 border-pink-500/30 bg-black/60 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                                                    <Instagram className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-white text-sm">Instagram Reels</h3>
                                                    <p className="text-[11px] text-slate-400 font-mono">{data.accounts.instagram.handle}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                                Score {data.accounts.instagram.viralityScore}
                                            </span>
                                        </div>

                                        <div className="space-y-3 py-2 border-t border-b border-white/5 my-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Seguidores:</span>
                                                <span className="font-mono text-white font-bold">{data.accounts.instagram.followers.toLocaleString("pt-BR")}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Taxa de Engajamento:</span>
                                                <span className="font-mono text-emerald-400 font-bold">{data.accounts.instagram.engagementRate}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Retenção Média:</span>
                                                <span className="font-mono text-pink-400 font-bold">{data.accounts.instagram.audienceInsight.averageWatchTimePercent}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Faixa Etária Dominante:</span>
                                                <span className="text-white text-[11px]">{data.accounts.instagram.audienceInsight.topAgeRange}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-heading uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-pink-400" />
                                                Melhores Horários de Pico:
                                            </span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {data.accounts.instagram.bestPostingTimes.map((time, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-300 font-mono text-[11px] font-bold">
                                                        {time}h
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card YouTube */}
                                    <div className="belve-card rounded-3xl p-6 border-red-500/30 bg-black/60 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                                                    <Youtube className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-white text-sm">YouTube Shorts</h3>
                                                    <p className="text-[11px] text-slate-400 font-mono">{data.accounts.youtube.handle}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                                Score {data.accounts.youtube.viralityScore}
                                            </span>
                                        </div>

                                        <div className="space-y-3 py-2 border-t border-b border-white/5 my-4">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Inscritos:</span>
                                                <span className="font-mono text-white font-bold">{data.accounts.youtube.followers.toLocaleString("pt-BR")}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Taxa de Engajamento:</span>
                                                <span className="font-mono text-emerald-400 font-bold">{data.accounts.youtube.engagementRate}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Retenção Média (APV):</span>
                                                <span className="font-mono text-red-400 font-bold">{data.accounts.youtube.audienceInsight.averageWatchTimePercent}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">RPM Estimado:</span>
                                                <span className="text-emerald-400 font-mono font-bold text-[11px]">{data.accounts.youtube.audienceInsight.estimatedRpm}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-heading uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-red-400" />
                                                Melhores Horários de Pico:
                                            </span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {data.accounts.youtube.bestPostingTimes.map((time, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 font-mono text-[11px] font-bold">
                                                        {time}h
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA 2: DETALHES TIKTOK */}
                        {activeTab === "tiktok" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="belve-card rounded-3xl p-6 border-[#FF1493]/30 bg-black/60 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Music2 className="w-6 h-6 text-[#FF1493]" />
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-white uppercase">Diagnóstico do Algoritmo TikTok</h3>
                                            <p className="text-xs text-slate-400 font-mono">Conta: {data.accounts.tiktok.handle} • Status: {data.accounts.tiktok.status}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FF1493]/10 border border-[#FF1493]/30 space-y-2">
                                        <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#FF1493] flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Formato de Maior Entrega no For You (FYP)
                                        </div>
                                        <p className="text-xs text-slate-200">{data.accounts.tiktok.audienceInsight.topFormat}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-heading font-bold uppercase text-slate-300">Dias Mais Fortes da Semana:</h4>
                                        <div className="flex gap-2">
                                            {data.accounts.tiktok.bestDays.map((day, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                                                    {day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="belve-card rounded-3xl p-6 border-white/10 bg-black/60 space-y-4">
                                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                        <Target className="w-4 h-4 text-[#FF1493]" />
                                        Ganchos Recomendados para Reter o Feed
                                    </h3>
                                    <div className="space-y-3">
                                        {data.accounts.tiktok.recommendedHooks.map((hook, idx) => (
                                            <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full bg-[#FF1493] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <span className="leading-relaxed">{hook}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA 3: DETALHES INSTAGRAM */}
                        {activeTab === "instagram" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="belve-card rounded-3xl p-6 border-pink-500/30 bg-black/60 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Instagram className="w-6 h-6 text-pink-400" />
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-white uppercase">Diagnóstico do Instagram Reels</h3>
                                            <p className="text-xs text-slate-400 font-mono">Conta: {data.accounts.instagram.handle} • Status: {data.accounts.instagram.status}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-2">
                                        <div className="text-xs font-heading font-bold uppercase tracking-wider text-pink-300 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Formato de Maior Retenção no Explorar
                                        </div>
                                        <p className="text-xs text-slate-200">{data.accounts.instagram.audienceInsight.topFormat}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-heading font-bold uppercase text-slate-300">Dias com Maior Alcance:</h4>
                                        <div className="flex gap-2">
                                            {data.accounts.instagram.bestDays.map((day, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                                                    {day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="belve-card rounded-3xl p-6 border-white/10 bg-black/60 space-y-4">
                                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                        <Target className="w-4 h-4 text-pink-400" />
                                        Diretrizes do Algoritmo Reels
                                    </h3>
                                    <div className="space-y-3">
                                        {data.accounts.instagram.recommendedHooks.map((hook, idx) => (
                                            <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <span className="leading-relaxed">{hook}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA 4: DETALHES YOUTUBE */}
                        {activeTab === "youtube" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="belve-card rounded-3xl p-6 border-red-500/30 bg-black/60 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Youtube className="w-6 h-6 text-red-500" />
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-white uppercase">Diagnóstico do YouTube Shorts</h3>
                                            <p className="text-xs text-slate-400 font-mono">Canal: {data.accounts.youtube.handle} • Status: {data.accounts.youtube.status}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                                        <div className="text-xs font-heading font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Taxa Média de Visualização (APV Benchmark)
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            {data.accounts.youtube.audienceInsight.averageWatchTimePercent}
                                        </div>
                                        <p className="text-xs text-slate-300">
                                            Shorts com retenção acima de 80% qualificam automaticamente para entrega massiva na estante do YouTube.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-heading font-bold uppercase text-slate-300">Melhores Dias para Postar:</h4>
                                        <div className="flex gap-2">
                                            {data.accounts.youtube.bestDays.map((day, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                                                    {day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="belve-card rounded-3xl p-6 border-white/10 bg-black/60 space-y-4">
                                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                        <Target className="w-4 h-4 text-red-500" />
                                        Recomendações para Maximizar o Algoritmo Shorts
                                    </h3>
                                    <div className="space-y-3">
                                        {data.accounts.youtube.recommendedHooks.map((hook, idx) => (
                                            <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <span className="leading-relaxed">{hook}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA 5: SIMULADOR DE LUCRO & MONETIZAÇÃO */}
                        {activeTab === "simulator" && (
                            <div className="space-y-8">
                                {/* Controles do Simulador */}
                                <div className="belve-card rounded-3xl p-6 md:p-8 border-[#FF1493]/40 bg-black/70 shadow-2xl">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-white uppercase flex items-center gap-2">
                                                <Sliders className="w-5 h-5 text-[#FF1493]" />
                                                Calculadora Preditiva de Lucro (Valorant Autopilot Engine)
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Ajuste o volume diário e a média de visualizações para projetar o faturamento mensal gerado pelas 6 fontes de receita.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-heading uppercase tracking-wider text-slate-300 font-bold">
                                                    Cortes Postados por Dia:
                                                </label>
                                                <span className="text-sm font-mono font-bold text-[#FF1493]">{postsPerDay} vídeos/dia</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={8}
                                                step={1}
                                                value={postsPerDay}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    handleSimulatorChange(val, avgViews, createWeeklyLong);
                                                    runAnalysis();
                                                }}
                                                className="w-full accent-[#FF1493] cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                <span>1 corte</span>
                                                <span>4 cortes</span>
                                                <span>8 cortes/dia</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-heading uppercase tracking-wider text-slate-300 font-bold">
                                                    Média de Views por Vídeo:
                                                </label>
                                                <span className="text-sm font-mono font-bold text-emerald-400">
                                                    {avgViews.toLocaleString("pt-BR")} views
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5000}
                                                max={100000}
                                                step={5000}
                                                value={avgViews}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    handleSimulatorChange(postsPerDay, val, createWeeklyLong);
                                                    runAnalysis();
                                                }}
                                                className="w-full accent-emerald-500 cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                <span>5k</span>
                                                <span>50k</span>
                                                <span>100k views</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center">
                                            <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={createWeeklyLong}
                                                    onChange={(e) => {
                                                        const val = e.target.checked;
                                                        handleSimulatorChange(postsPerDay, avgViews, val);
                                                        runAnalysis();
                                                    }}
                                                    className="w-4 h-4 accent-[#FF1493] rounded"
                                                />
                                                <div>
                                                    <span className="text-xs font-heading font-bold text-white block uppercase">
                                                        Compilado Semanal 10min (YouTube)
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        RPM alto (R$ 18,00 por 1.000 views)
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Discriminativo das 6 Fontes de Lucro */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-red-400 font-bold flex items-center gap-1.5">
                                                <Youtube className="w-3.5 h-3.5" /> AdSense YouTube Shorts
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">RPM R$ 0,30</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.youtubeShorts.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {data.projections.viewsBreakdown.youtubeShorts.toLocaleString("pt-BR")} views/mês
                                        </p>
                                    </div>

                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-red-500 font-bold flex items-center gap-1.5">
                                                <Youtube className="w-3.5 h-3.5" /> Compilados Longos Semanais
                                            </span>
                                            <span className="text-[10px] text-emerald-400 font-mono font-bold">RPM R$ 18,00</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.youtubeLongCompilations.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            4 vídeos semanais de 10 minutos
                                        </p>
                                    </div>

                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-[#FF1493] font-bold flex items-center gap-1.5">
                                                <Music2 className="w-3.5 h-3.5" /> TikTok Creator Rewards
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">Fundo Direto</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.tiktokDirect.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {data.projections.viewsBreakdown.tiktok.toLocaleString("pt-BR")} views/mês
                                        </p>
                                    </div>

                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-amber-300 font-bold flex items-center gap-1.5">
                                                <Award className="w-3.5 h-3.5" /> Afiliados Gamer (Mouses/Pads)
                                            </span>
                                            <span className="text-[10px] text-amber-300 font-mono">Amazon / Shopee</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.affiliateCommissions.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Links na bio &ldquo;Periféricos e Mira do Aspas&rdquo;
                                        </p>
                                    </div>

                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-blue-400 font-bold flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5" /> ExitLag & Softwares Gamer
                                            </span>
                                            <span className="text-[10px] text-blue-400 font-mono">Recorrência</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.exitlagRecurring.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Comissão mensal contínua por assinante ativo
                                        </p>
                                    </div>

                                    <div className="belve-card rounded-2xl p-5 border-white/10 bg-black/60">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-heading uppercase text-pink-400 font-bold flex items-center gap-1.5">
                                                <Instagram className="w-3.5 h-3.5" /> Publiposts Instagram Reels
                                            </span>
                                            <span className="text-[10px] text-pink-400 font-mono">Marcas / Deals</span>
                                        </div>
                                        <div className="text-xl font-heading font-extrabold text-white">
                                            R$ {data.projections.revenueBreakdownBrl.instagramBrandDeals.toLocaleString("pt-BR")}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Patrocínios diretos de marcas de esports
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
