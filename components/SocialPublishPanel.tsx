"use client";

import { useState } from "react";
import { CheckCircle2, Download, Send, Share2, Youtube, Instagram, Music2, Copy, Check, Zap } from "lucide-react";

const defaultDescription = `🔥 Corte pronto para retenção máxima

📌 A mensagem principal está no início do vídeo para reter o espectador nos primeiros 3 segundos.

#shorts #reels #viralcontent #marketingdigital #criadores`;

interface PublishResult {
    ok: boolean;
    message?: string;
    platforms?: string[];
    activeAccounts?: string[];
    payload?: {
        title?: string;
        videoUrl?: string;
        tiktok?: {
            handle?: string;
            caption?: string;
            apiPayload?: Record<string, unknown>;
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
    const [instagramHandle, setInstagramHandle] = useState("");
    const [tiktokHandle, setTiktokHandle] = useState("@viral.cortes");
    const [title, setTitle] = useState("Corte de Alto Impacto para Viralizar");
    const [description, setDescription] = useState(defaultDescription);
    const [videoUrl, setVideoUrl] = useState("/generated/sample-short.mp4");
    const [platform, setPlatform] = useState("all");
    const [activeTab, setActiveTab] = useState<"tiktok" | "youtube" | "instagram" | "api">("tiktok");
    const [copied, setCopied] = useState(false);
    const [simulatedPost, setSimulatedPost] = useState(false);
    const [result, setResult] = useState<PublishResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handlePublish() {
        setLoading(true);
        setError("");
        setSimulatedPost(false);

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

    function handleCopy(text: string) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <section id="social" className="py-20 px-4 bg-[#14010e]">
            <div className="container mx-auto max-w-6xl">

                <div className="mb-10 text-center">
                    <span className="belve-badge mb-3 inline-block">Distribuição Multiplataforma</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-3">
                        Publicação <span className="belve-gradient-text">TikTok, Shorts & Reels</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-sm text-slate-300 font-light">
                        Geração automatizada de títulos de alto CTR, hashtags para o algoritmo #fyp do TikTok
                        e payload pronto para a API de postagem direta.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Setup Card */}
                    <div className="belve-card rounded-3xl p-6 md:p-8">
                        <div className="grid gap-3 sm:grid-cols-3 mb-5">
                            <div>
                                <label className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-[#FF1493] mb-2 flex items-center gap-1.5">
                                    <Music2 className="w-3.5 h-3.5 text-[#FF1493]" /> TikTok
                                </label>
                                <input
                                    value={tiktokHandle}
                                    onChange={(event) => setTiktokHandle(event.target.value)}
                                    placeholder="@seuTikTok"
                                    className="w-full rounded-2xl border border-[#FF1493]/30 bg-black/40 px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2 flex items-center gap-1.5">
                                    <Youtube className="w-3.5 h-3.5 text-rose-400" /> YouTube
                                </label>
                                <input
                                    value={youtubeHandle}
                                    onChange={(event) => setYoutubeHandle(event.target.value)}
                                    placeholder="@seuCanal"
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-heading font-semibold uppercase tracking-wider text-[#a8bed5] mb-2 flex items-center gap-1.5">
                                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram
                                </label>
                                <input
                                    value={instagramHandle}
                                    onChange={(event) => setInstagramHandle(event.target.value)}
                                    placeholder="@seuPerfil"
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2">
                                    Título do Vídeo
                                </label>
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#FF1493] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#a8bed5] mb-2">
                                    Arquivo de Vídeo (.mp4)
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
                                    rows={5}
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
                                <option value="all" className="bg-slate-900 text-white">Todas as Redes (TikTok + YouTube + Reels)</option>
                                <option value="tiktok" className="bg-slate-900 text-white">TikTok Exclusivo (#fyp Viral)</option>
                                <option value="both" className="bg-slate-900 text-white">YouTube Shorts + Instagram Reels</option>
                                <option value="youtube" className="bg-slate-900 text-white">Apenas YouTube Shorts</option>
                                <option value="instagram" className="bg-slate-900 text-white">Apenas Instagram Reels</option>
                            </select>

                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={loading}
                                className="belve-btn-champagne px-7 py-3 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Send className="h-3.5 w-3.5" />
                                {loading ? "Preparando..." : "Preparar Publicação"}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Summary Card */}
                    <div className="belve-card rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                                    Resumo do Envio
                                </h3>
                                <span className="belve-badge text-[10px]">TikTok • Shorts • Reels</span>
                            </div>

                            {result ? (
                                <div className="space-y-4 text-xs">
                                    <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-2 font-heading font-semibold uppercase tracking-wider">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {result.message}
                                    </div>

                                    {/* Platform Preview Tabs */}
                                    <div className="flex gap-1.5 border-b border-white/10 pb-2">
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
                                            onClick={() => setActiveTab("youtube")}
                                            className={`px-3 py-1 rounded-full text-[11px] font-heading uppercase tracking-wider transition ${
                                                activeTab === "youtube"
                                                    ? "bg-rose-500 text-white font-bold"
                                                    : "bg-white/5 text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            YouTube
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
                                            Instagram
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("api")}
                                            className={`px-3 py-1 rounded-full text-[11px] font-heading uppercase tracking-wider transition ${
                                                activeTab === "api"
                                                    ? "bg-purple-600 text-white font-bold"
                                                    : "bg-white/5 text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            API Payload
                                        </button>
                                    </div>

                                    {/* Active Tab Content */}
                                    {activeTab === "tiktok" && result.payload?.tiktok && (
                                        <div className="space-y-3">
                                            <div className="p-3.5 rounded-2xl bg-black/40 border border-[#FF1493]/30">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] uppercase font-heading tracking-widest text-[#FF1493] font-semibold">
                                                        Legenda Otimizada para TikTok (#fyp)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(result.payload?.tiktok?.caption || "")}
                                                        className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                                                    >
                                                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                        {copied ? "Copiado!" : "Copiar"}
                                                    </button>
                                                </div>
                                                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                                    {result.payload.tiktok.caption}
                                                </pre>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setSimulatedPost(true)}
                                                disabled={simulatedPost}
                                                className="w-full py-2.5 rounded-full bg-[#FF1493] hover:bg-[#FF1493]/90 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-lg shadow-[#FF1493]/30"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                {simulatedPost ? "✓ Publicado com Sucesso via TikTok API v2!" : "Simular Postagem no TikTok (API v2)"}
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === "youtube" && (
                                        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] uppercase font-heading tracking-widest text-rose-400 font-semibold">
                                                    Legenda YouTube Shorts
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(result.payload?.youtube?.caption || "")}
                                                    className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                                                >
                                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    {copied ? "Copiado!" : "Copiar"}
                                                </button>
                                            </div>
                                            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                                {result.payload?.youtube?.caption}
                                            </pre>
                                        </div>
                                    )}

                                    {activeTab === "instagram" && (
                                        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] uppercase font-heading tracking-widest text-pink-400 font-semibold">
                                                    Legenda Instagram Reels
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(result.payload?.instagram?.caption || "")}
                                                    className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                                                >
                                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    {copied ? "Copiado!" : "Copiar"}
                                                </button>
                                            </div>
                                            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                                {result.payload?.instagram?.caption}
                                            </pre>
                                        </div>
                                    )}

                                    {activeTab === "api" && (
                                        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10">
                                            <span className="text-[10px] uppercase font-heading tracking-widest text-purple-300 font-semibold block mb-1">
                                                TikTok Content Posting API Payload (JSON)
                                            </span>
                                            <pre className="font-mono text-[10px] text-emerald-300 max-h-36 overflow-auto bg-black/80 p-2 rounded-xl">
                                                {JSON.stringify(result.payload?.tiktok?.apiPayload, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-[#e8d9c6]/20 bg-black/30 p-8 text-center my-6">
                                    <Share2 className="w-8 h-8 text-[#FF1493]/50 mx-auto mb-2" />
                                    <p className="text-xs text-slate-300">
                                        Insira suas contas e clique em <strong>&ldquo;Preparar Publicação&rdquo;</strong> para gerar
                                        as legendas com tags virais e o payload do TikTok.
                                    </p>
                                </div>
                            )}
                        </div>

                        {result && (
                            <div className="pt-4 border-t border-white/5">
                                <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="belve-btn-outline w-full py-2.5 text-xs flex items-center justify-center gap-2"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Baixar Arquivo Final para Upload
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

