"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    Download,
    Send,
    Share2,
    Youtube,
    Instagram,
    Music2,
    Copy,
    Check,
    Zap,
    BarChart3,
    Clock,
    TrendingUp,
    ShieldCheck,
    Sparkles,
    KeyRound,
    ExternalLink,
    Lock,
} from "lucide-react";

const defaultDescription = `🔥 Corte pronto para retenção máxima

📌 A mensagem principal está no início do vídeo para reter o espectador nos primeiros 3 segundos.

#shorts #reels #viralcontent #marketingdigital #criadores`;

interface AccountAnalysis {
    platform: "tiktok" | "instagram";
    handle: string;
    name: string;
    isRealApi: boolean;
    followers: number;
    mediaCount: number;
    engagementRate: string;
    viralityScore: number;
    bestPostingTimes: string[];
    bestDays: string[];
    audienceInsight?: {
        topAgeRange: string;
        topFormat: string;
        averageWatchTimePercent: string;
    };
    recommendedHooks: string[];
    status: string;
}

interface AnalyticsResponse {
    ok: boolean;
    analyzedAt: string;
    accounts: {
        tiktok: AccountAnalysis;
        instagram: AccountAnalysis;
    };
    summary: {
        totalAudienceEstimated: number;
        highestRetentionPlatform: string;
        primeTimeToday: string;
    };
}

interface PublishResult {
    ok: boolean;
    action?: string;
    message?: string;
    platforms?: string[];
    activeAccounts?: string[];
    results?: {
        tiktok?: {
            ok: boolean;
            mode?: string;
            publishId?: string;
            status?: string;
            caption?: string;
            error?: string;
            message?: string;
            missingCredentials?: string[];
        };
        instagram?: {
            ok: boolean;
            mode?: string;
            mediaId?: string;
            permalink?: string;
            status?: string;
            caption?: string;
            error?: string;
            message?: string;
            missingCredentials?: string[];
        };
    };
    payload?: {
        title?: string;
        videoUrl?: string;
        tiktok?: {
            handle?: string;
            caption?: string;
        };
        youtube?: {
            handle?: string;
            caption?: string;
        };
        instagram?: {
            handle?: string;
            caption?: string;
        };
    };
}

export default function SocialPublishPanel() {
    const [youtubeHandle, setYoutubeHandle] = useState("");
    const [instagramHandle, setInstagramHandle] = useState("@emanuel.reels");
    const [tiktokHandle, setTiktokHandle] = useState("@emanuel.cortes");
    const [title, setTitle] = useState("O Segredo que Ninguém Te Conta");
    const [description, setDescription] = useState(defaultDescription);
    const [videoUrl, setVideoUrl] = useState("/generated/short-viral.mp4");
    const [platform, setPlatform] = useState("all");
    const [activeTab, setActiveTab] = useState<"tiktok" | "instagram" | "youtube" | "analytics">("tiktok");
    const [copied, setCopied] = useState(false);
    const [result, setResult] = useState<PublishResult | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [publishingApi, setPublishingApi] = useState(false);
    const [error, setError] = useState("");

    // Credenciais Modal / Painel
    const [showCredsModal, setShowCredsModal] = useState(false);
    const [tiktokAccessToken, setTiktokAccessToken] = useState("");
    const [tiktokOpenId, setTiktokOpenId] = useState("");
    const [instagramAccessToken, setInstagramAccessToken] = useState("");
    const [instagramAccountId, setInstagramAccountId] = useState("");
    const [savingCreds, setSavingCreds] = useState(false);
    const [credsSuccessMsg, setCredsSuccessMsg] = useState("");
    const [tiktokAuthCode, setTiktokAuthCode] = useState("");
    const [exchangingCode, setExchangingCode] = useState(false);
    const [credsStatus, setCredsStatus] = useState<{
        tiktok?: { hasToken: boolean; maskedToken: string; username?: string; openId?: string };
        instagram?: { hasToken: boolean; maskedToken: string; username?: string; accountId?: string };
    }>({});

    const [refreshingToken, setRefreshingToken] = useState(false);

    async function handleExchangeCode() {
        if (!tiktokAuthCode.trim()) return;
        setExchangingCode(true);
        setError("");
        try {
            const res = await fetch("/api/auth/tiktok/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: tiktokAuthCode.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || "Erro ao trocar código por token.");
            }
            setCredsSuccessMsg("✓ Token do TikTok gerado e salvo com sucesso em .env.local!");
            setTiktokAuthCode("");
            const fresh = await fetch("/api/social-credentials").then((r) => r.json());
            if (fresh.ok && fresh.credentials) setCredsStatus(fresh.credentials);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Falha na troca de código.";
            setError(message);
        } finally {
            setExchangingCode(false);
        }
    }

    async function handleRefreshTikTokToken() {
        setRefreshingToken(true);
        setError("");
        try {
            const res = await fetch("/api/auth/tiktok/refresh", { method: "POST" });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao renovar token.");
            setCredsSuccessMsg("✓ Token de acesso renovado por mais 24h automaticamente!");
            const fresh = await fetch("/api/social-credentials").then((r) => r.json());
            if (fresh.ok && fresh.credentials) setCredsStatus(fresh.credentials);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Falha ao renovar token.";
            setError(message);
        } finally {
            setRefreshingToken(false);
        }
    }

    // Carrega status das credenciais cadastradas
    useEffect(() => {
        fetch("/api/social-credentials")
            .then((r) => r.json())
            .then((data) => {
                if (data.ok && data.credentials) {
                    setCredsStatus(data.credentials);
                    if (data.credentials.tiktok?.username) setTiktokHandle(data.credentials.tiktok.username);
                    if (data.credentials.instagram?.username) setInstagramHandle(data.credentials.instagram.username);
                    if (data.credentials.tiktok?.openId) setTiktokOpenId(data.credentials.tiktok.openId);
                    if (data.credentials.instagram?.accountId) setInstagramAccountId(data.credentials.instagram.accountId);
                }
            })
            .catch(() => {});
    }, []);

    // Ouve eventos quando um corte for gerado no ShortsPipelinePanel
    useEffect(() => {
        function handleShortGenerated(e: Event) {
            const customEvent = e as CustomEvent<{ mp4Url?: string; title?: string }>;
            if (customEvent.detail?.mp4Url) {
                setVideoUrl(customEvent.detail.mp4Url);
            }
            if (customEvent.detail?.title) {
                setTitle(customEvent.detail.title);
            }
        }

        window.addEventListener("short-generated", handleShortGenerated);
        return () => window.removeEventListener("short-generated", handleShortGenerated);
    }, []);

    // Salvar Credenciais de API
    async function handleSaveCredentials() {
        setSavingCreds(true);
        setCredsSuccessMsg("");
        setError("");

        try {
            const response = await fetch("/api/social-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tiktokAccessToken: tiktokAccessToken || undefined,
                    tiktokOpenId: tiktokOpenId || undefined,
                    tiktokUsername: tiktokHandle || undefined,
                    instagramAccessToken: instagramAccessToken || undefined,
                    instagramAccountId: instagramAccountId || undefined,
                    instagramUsername: instagramHandle || undefined,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Falha ao salvar chaves.");
            }

            setCredsSuccessMsg("✓ Credenciais salvas com sucesso em .env.local!");
            // Recarrega status
            const fresh = await fetch("/api/social-credentials").then((r) => r.json());
            if (fresh.ok && fresh.credentials) setCredsStatus(fresh.credentials);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao salvar credenciais.";
            setError(message);
        } finally {
            setSavingCreds(false);
        }
    }

    // 1. Analisa as contas sociais (TikTok + Instagram)
    async function handleAnalyzeAccounts() {
        setAnalyzing(true);
        setError("");

        try {
            const response = await fetch("/api/social-analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tiktokHandle,
                    instagramHandle,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Não foi possível analisar as contas.");
            }

            setAnalytics(data);
            setActiveTab("analytics");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao analisar perfis sociais.";
            setError(message);
        } finally {
            setAnalyzing(false);
        }
    }

    // 2. Prepara legendas e tags (Dry Run / Otimização)
    async function handlePrepare() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/social-publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeHandle,
                    instagramHandle,
                    tiktokHandle,
                    title,
                    description,
                    videoUrl,
                    platform,
                    action: "prepare",
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Não foi possível preparar a publicação.");
            }

            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao preparar a publicação.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    // 3. Publica diretamente via API (Instagram Reels Graph API + TikTok Content Posting API)
    async function handlePublishApi() {
        setPublishingApi(true);
        setError("");

        try {
            const response = await fetch("/api/social-publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeHandle,
                    instagramHandle,
                    tiktokHandle,
                    title,
                    description,
                    videoUrl,
                    platform,
                    action: "publish",
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Falha no disparo da API.");
            }

            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao disparar publicação via API.";
            setError(message);
        } finally {
            setPublishingApi(false);
        }
    }

    function handleCopy(text: string) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <section id="social" className="py-24 px-4 bg-[#14010e] relative overflow-hidden">
            <div className="container mx-auto max-w-6xl relative z-10">

                <div className="mb-12 text-center">
                    <span className="belve-badge mb-3 inline-block">Distribuição & Inteligência de Algoritmo</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-3">
                        Contas <span className="belve-gradient-text">TikTok & Instagram API</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-sm text-slate-300 font-light leading-relaxed mb-4">
                        Conecte suas contas oficiais, audite métricas de retenção com inteligência artificial e publique seus
                        cortes verticais diretamente via <strong>Meta Graph API (Reels)</strong> e <strong>TikTok Content Posting API v2</strong>.
                    </p>

                    {/* Botão de Configuração de Chaves */}
                    <button
                        type="button"
                        onClick={() => setShowCredsModal((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/60 border border-[#FF1493]/40 text-xs font-heading uppercase tracking-wider text-[#FF1493] hover:bg-[#FF1493]/10 transition cursor-pointer font-bold shadow-md shadow-[#FF1493]/10"
                    >
                        <KeyRound className="w-3.5 h-3.5 text-[#FF1493]" />
                        <span>{showCredsModal ? "Ocultar Chaves de API" : "Configurar Tokens de API (TikTok / Instagram)"}</span>
                    </button>
                </div>

                {/* Painel Expansível de Configuração de Credenciais */}
                {showCredsModal && (
                    <div className="mb-10 belve-card rounded-3xl p-6 md:p-8 border-2 border-[#FF1493]/40 bg-black/70 shadow-2xl">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-[#FF1493]" />
                                    Credenciais Oficiais das Redes Sociais (.env.local)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Insira seus tokens de acesso para habilitar a postagem direta via código.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCredsModal(false)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 mb-6">
                            {/* Bloco TikTok */}
                            <div className="p-4 rounded-2xl bg-black/50 border border-[#FF1493]/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-xs uppercase text-[#FF1493] flex items-center gap-1.5">
                                        <Music2 className="w-3.5 h-3.5" /> TikTok Content Posting API v2
                                    </span>
                                    {credsStatus.tiktok?.hasToken ? (
                                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                            ✓ Token Ativo ({credsStatus.tiktok.maskedToken})
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-amber-400 font-mono">Modo Simulação</span>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl bg-[#FF1493]/10 border border-[#FF1493]/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-heading uppercase tracking-wider text-[#FF1493] font-bold">
                                            Autorização Rápida (OAuth 2.0)
                                        </span>
                                        <span className="text-[9px] text-emerald-400 font-mono">Client Key Ativa</span>
                                    </div>
                                    <a
                                        href={`https://www.tiktok.com/v2/auth/authorize/?client_key=sbawes5f6trrwixg9i&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=${encodeURIComponent('https://emanuel565.github.io/limbo-ai/')}&state=limbo_ai`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-2 px-3 rounded-xl bg-[#FF1493] hover:bg-[#FF1493]/90 text-white text-[11px] font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-[#FF1493]/30 cursor-pointer"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        1. Conectar Conta do TikTok
                                    </a>
                                    <div className="flex gap-2 pt-1">
                                        <input
                                            type="text"
                                            value={tiktokAuthCode}
                                            onChange={(e) => setTiktokAuthCode(e.target.value)}
                                            placeholder="Cole o código (code) se necessário"
                                            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-[#FF1493]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleExchangeCode}
                                            disabled={exchangingCode || !tiktokAuthCode}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-heading uppercase font-bold transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                        >
                                            {exchangingCode ? "Gerando..." : "Gerar Token"}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                        TIKTOK_ACCESS_TOKEN (Manual ou Automático)
                                    </label>
                                    <input
                                        type="password"
                                        value={tiktokAccessToken}
                                        onChange={(e) => setTiktokAccessToken(e.target.value)}
                                        placeholder={credsStatus.tiktok?.hasToken ? "Token salvo (digite para substituir)" : "Cole seu TikTok Access Token"}
                                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#FF1493]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                        TIKTOK_OPEN_ID
                                    </label>
                                    <input
                                        type="text"
                                        value={tiktokOpenId}
                                        onChange={(e) => setTiktokOpenId(e.target.value)}
                                        placeholder="Ex: _000abcdef12345"
                                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#FF1493]"
                                    />
                                </div>

                                {credsStatus.tiktok?.hasToken && (
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                                        <div>
                                            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                                                ✓ Token Ativo (24h) • Auto-Renovação 365d
                                            </div>
                                            <div className="text-[9px] text-slate-400">
                                                Renovação automática sem precisar logar de novo
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRefreshTikTokToken}
                                            disabled={refreshingToken}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition disabled:opacity-50 cursor-pointer whitespace-nowrap border border-emerald-500/30"
                                        >
                                            {refreshingToken ? "Renovando..." : "↻ Renovar"}
                                        </button>
                                    </div>
                                )}

                                <a
                                    href="https://developers.tiktok.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-[#FF1493] hover:underline flex items-center gap-1 pt-1"
                                >
                                    Portal TikTok for Developers <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>

                            {/* Bloco Instagram */}
                            <div className="p-4 rounded-2xl bg-black/50 border border-pink-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-xs uppercase text-pink-400 flex items-center gap-1.5">
                                        <Instagram className="w-3.5 h-3.5" /> Meta Graph API (Reels v19.0)
                                    </span>
                                    {credsStatus.instagram?.hasToken ? (
                                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                            ✓ Token Ativo ({credsStatus.instagram.maskedToken})
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-amber-400 font-mono">Modo Simulação</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                        INSTAGRAM_ACCESS_TOKEN (Graph API)
                                    </label>
                                    <input
                                        type="password"
                                        value={instagramAccessToken}
                                        onChange={(e) => setInstagramAccessToken(e.target.value)}
                                        placeholder={credsStatus.instagram?.hasToken ? "Token salvo (digite para substituir)" : "Cole seu Meta User/System Access Token"}
                                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono outline-none focus:border-pink-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                                        INSTAGRAM_BUSINESS_ACCOUNT_ID
                                    </label>
                                    <input
                                        type="text"
                                        value={instagramAccountId}
                                        onChange={(e) => setInstagramAccountId(e.target.value)}
                                        placeholder="Ex: 17841405309211844"
                                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono outline-none focus:border-pink-400"
                                    />
                                </div>

                                <a
                                    href="https://developers.facebook.com/tools/explorer/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-pink-400 hover:underline flex items-center gap-1 pt-1"
                                >
                                    Gerador de Token (Meta Graph API Explorer) <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-emerald-400 font-mono">
                                {credsSuccessMsg}
                            </span>
                            <button
                                type="button"
                                onClick={handleSaveCredentials}
                                disabled={savingCreds}
                                className="belve-btn-champagne px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                            >
                                {savingCreds ? "Gravando em .env.local..." : "Salvar Chaves no Servidor"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Account Connection & Metric Cards */}
                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                    {/* TikTok Account Card */}
                    <div className="belve-card rounded-3xl p-5 border border-[#FF1493]/30 bg-black/40 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-[#FF1493]/20 flex items-center justify-center border border-[#FF1493]/40">
                                    <Music2 className="w-5 h-5 text-[#FF1493]" />
                                </div>
                                <div>
                                    <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">Conta TikTok</h4>
                                    <span className="text-[10px] text-slate-400 font-mono">Content Posting API v2</span>
                                </div>
                            </div>
                            {credsStatus.tiktok?.hasToken ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-heading uppercase tracking-wider font-semibold border border-emerald-500/30">
                                    ✓ API Conectada
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full bg-[#FF1493]/15 text-[#FF1493] text-[10px] font-heading uppercase tracking-wider font-semibold border border-[#FF1493]/30">
                                    #fyp Viral
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-[#FF1493]">
                                Usuário / Handle (@)
                            </label>
                            <input
                                value={tiktokHandle}
                                onChange={(e) => setTiktokHandle(e.target.value)}
                                placeholder="@seu_tiktok"
                                className="w-full rounded-2xl border border-[#FF1493]/30 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-[#FF1493] transition font-mono font-bold"
                            />
                        </div>
                    </div>

                    {/* Instagram Account Card */}
                    <div className="belve-card rounded-3xl p-5 border border-pink-500/30 bg-black/40 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/40">
                                    <Instagram className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">Conta Instagram</h4>
                                    <span className="text-[10px] text-slate-400 font-mono">Meta Graph API v19.0</span>
                                </div>
                            </div>
                            {credsStatus.instagram?.hasToken ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-heading uppercase tracking-wider font-semibold border border-emerald-500/30">
                                    ✓ API Conectada
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 text-[10px] font-heading uppercase tracking-wider font-semibold border border-pink-500/30">
                                    Reels 9:16
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-pink-300">
                                Perfil / Handle (@)
                            </label>
                            <input
                                value={instagramHandle}
                                onChange={(e) => setInstagramHandle(e.target.value)}
                                placeholder="@seu_instagram"
                                className="w-full rounded-2xl border border-pink-500/30 bg-black/60 px-3.5 py-2 text-xs text-white outline-none focus:border-pink-400 transition font-mono font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Setup & Content Form */}
                    <div className="belve-card rounded-3xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                                Publicação & Parâmetros do Vídeo
                            </h3>
                            <button
                                type="button"
                                onClick={handleAnalyzeAccounts}
                                disabled={analyzing}
                                className="belve-btn-outline px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <BarChart3 className="w-3.5 h-3.5 text-[#FF1493]" />
                                {analyzing ? "Auditando Contas..." : "Analisar Contas (IA)"}
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2">
                                    Título de Alto CTR (Gancho)
                                </label>
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition font-heading font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#a8bed5] mb-2">
                                    URL / Caminho do Vídeo Gerado (.mp4)
                                </label>
                                <input
                                    value={videoUrl}
                                    onChange={(event) => setVideoUrl(event.target.value)}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2">
                                    Legenda Base & Contexto
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={4}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#FF1493] transition leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={platform}
                                onChange={(event) => setPlatform(event.target.value)}
                                className="py-2.5 px-4 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-xs text-[#e8d9c6] font-heading uppercase tracking-wider focus:outline-none focus:border-[#FF1493]"
                            >
                                <option value="all" className="bg-slate-900 text-white">Todas as Redes (TikTok + Reels + Shorts)</option>
                                <option value="both" className="bg-slate-900 text-white">TikTok + Instagram Reels</option>
                                <option value="tiktok" className="bg-slate-900 text-white">Apenas TikTok (#fyp Viral)</option>
                                <option value="instagram" className="bg-slate-900 text-white">Apenas Instagram Reels</option>
                            </select>

                            <button
                                type="button"
                                onClick={handlePrepare}
                                disabled={loading}
                                className="belve-btn-champagne px-5 py-3 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {loading ? "Preparando..." : "Preparar Legendas"}
                            </button>

                            <button
                                type="button"
                                onClick={handlePublishApi}
                                disabled={publishingApi}
                                className="rounded-full bg-[#FF1493] hover:bg-[#FF1493]/90 text-white font-heading uppercase tracking-wider text-xs px-6 py-3 font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#FF1493]/30"
                            >
                                <Zap className="h-4 w-4" />
                                {publishingApi ? "Publicando via API..." : "Publicar via API"}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Output / Analysis / Live Preview Column */}
                    <div className="belve-card rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                                    Auditoria & Resumo API
                                </h3>
                                <span className="belve-badge text-[10px]">Automação Oficial</span>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("tiktok")}
                                    className={`px-3 py-1 rounded-full text-[11px] font-heading uppercase tracking-wider transition ${
                                        activeTab === "tiktok"
                                            ? "bg-[#FF1493] text-white font-bold"
                                            : "bg-white/5 text-slate-300 hover:text-white"
                                    }`}
                                >
                                    TikTok
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("instagram")}
                                    className={`px-3 py-1 rounded-full text-[11px] font-heading uppercase tracking-wider transition ${
                                        activeTab === "instagram"
                                            ? "bg-pink-600 text-white font-bold"
                                            : "bg-white/5 text-slate-300 hover:text-white"
                                    }`}
                                >
                                    Instagram Reels
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("analytics")}
                                    className={`px-3 py-1 rounded-full text-[11px] font-heading uppercase tracking-wider transition ${
                                        activeTab === "analytics"
                                            ? "bg-purple-600 text-white font-bold"
                                            : "bg-white/5 text-slate-300 hover:text-white"
                                    }`}
                                >
                                    Análise de Contas
                                </button>
                            </div>

                            {/* TAB: Analytics */}
                            {activeTab === "analytics" && (
                                <div className="space-y-4 text-xs">
                                    {analytics ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-3 rounded-2xl bg-black/40 border border-[#FF1493]/30">
                                                    <span className="text-[10px] font-heading uppercase tracking-wider text-[#FF1493] block font-bold mb-1">
                                                        TikTok Score
                                                    </span>
                                                    <div className="text-xl font-heading font-black text-white">
                                                        {analytics.accounts.tiktok.viralityScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                                                    </div>
                                                    <span className="text-[10px] text-emerald-400 font-mono">
                                                        Engajamento {analytics.accounts.tiktok.engagementRate}
                                                    </span>
                                                </div>

                                                <div className="p-3 rounded-2xl bg-black/40 border border-pink-500/30">
                                                    <span className="text-[10px] font-heading uppercase tracking-wider text-pink-400 block font-bold mb-1">
                                                        Instagram Score
                                                    </span>
                                                    <div className="text-xl font-heading font-black text-white">
                                                        {analytics.accounts.instagram.viralityScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                                                    </div>
                                                    <span className="text-[10px] text-emerald-400 font-mono">
                                                        Engajamento {analytics.accounts.instagram.engagementRate}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                                                <div className="flex items-center gap-1.5 text-amber-300 font-heading uppercase tracking-wider font-semibold text-[11px] mb-2">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Melhores Horários para Postar Hoje
                                                </div>
                                                <div className="flex gap-2">
                                                    {analytics.accounts.tiktok.bestPostingTimes.map((time, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-mono font-bold text-[11px]">
                                                            {time}h
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30">
                                                <div className="flex items-center gap-1.5 text-purple-300 font-heading uppercase tracking-wider font-semibold text-[11px] mb-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    Recomendações da IA para Reter
                                                </div>
                                                <ul className="space-y-1 text-slate-200 text-[11px] list-disc list-inside">
                                                    {analytics.accounts.tiktok.recommendedHooks.slice(0, 2).map((hook, i) => (
                                                        <li key={i}>{hook}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-black/30 text-center">
                                            <BarChart3 className="w-7 h-7 text-[#FF1493]/60 mx-auto mb-2" />
                                            <p className="text-slate-300">
                                                Clique em <strong>&ldquo;Analisar Contas (IA)&rdquo;</strong> para inspecionar os scores
                                                de retenção e os melhores horários para postar no TikTok e Instagram.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: TikTok */}
                            {activeTab === "tiktok" && (
                                <div className="space-y-3 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-[#FF1493]/30">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] uppercase font-heading tracking-widest text-[#FF1493] font-semibold flex items-center gap-1">
                                                <Music2 className="w-3 h-3 text-[#FF1493]" /> Legenda Otimizada ({tiktokHandle})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(result?.payload?.tiktok?.caption || "")}
                                                className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? "Copiado!" : "Copiar"}
                                            </button>
                                        </div>
                                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                            {result?.payload?.tiktok?.caption || `${title}\n\n${description}\n\n#fyp #foryou #viral #tiktokbrasil #aprendanotiktok`}
                                        </pre>
                                    </div>

                                    {result?.results?.tiktok && (
                                        <div className={`p-3 rounded-2xl border ${
                                            result.results.tiktok.ok
                                                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                                                : "bg-rose-950/20 border-rose-500/40 text-rose-300"
                                        }`}>
                                            <div className="font-heading font-bold uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Status TikTok API: {result.results.tiktok.mode}
                                            </div>
                                            <p className="text-[11px] font-mono">
                                                {result.results.tiktok.status || result.results.tiktok.message || result.results.tiktok.error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: Instagram Reels */}
                            {activeTab === "instagram" && (
                                <div className="space-y-3 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-pink-500/30">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] uppercase font-heading tracking-widest text-pink-400 font-semibold flex items-center gap-1">
                                                <Instagram className="w-3 h-3 text-pink-400" /> Legenda Reels ({instagramHandle})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(result?.payload?.instagram?.caption || "")}
                                                className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? "Copiado!" : "Copiar"}
                                            </button>
                                        </div>
                                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                            {result?.payload?.instagram?.caption || `${title}\n\n${description}\n\n#reels #viral #explore #reelsbrasil`}
                                        </pre>
                                    </div>

                                    {result?.results?.instagram && (
                                        <div className={`p-3 rounded-2xl border ${
                                            result.results.instagram.ok
                                                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                                                : "bg-rose-950/20 border-rose-500/40 text-rose-300"
                                        }`}>
                                            <div className="font-heading font-bold uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Status Meta Reels API: {result.results.instagram.mode}
                                            </div>
                                            <p className="text-[11px] font-mono">
                                                {result.results.instagram.status || result.results.instagram.message || result.results.instagram.error}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-4 border-t border-white/5">
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="belve-btn-outline w-full py-2.5 text-xs flex items-center justify-center gap-2"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Baixar Arquivo 9:16 para Upload Manual
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
