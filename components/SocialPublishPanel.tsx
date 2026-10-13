"use client";

import { useState } from "react";
import { CheckCircle2, Download, Send, Share2, Youtube, Instagram } from "lucide-react";

const defaultDescription = `🔥 Corte pronto para rede

📌 A mensagem principal está no início do vídeo para gerar retenção rápida nos primeiros segundos.

#shorts #reels #viralcontent #marketingdigital #criadores`;

interface PublishResult {
    ok: boolean;
    message?: string;
    platforms?: string[];
    payload?: {
        title?: string;
        caption?: string;
        videoUrl?: string;
    };
}

export default function SocialPublishPanel() {
    const [youtubeHandle, setYoutubeHandle] = useState("");
    const [instagramHandle, setInstagramHandle] = useState("");
    const [title, setTitle] = useState("Corte de Alto Impacto para Viralizar");
    const [description, setDescription] = useState(defaultDescription);
    const [videoUrl, setVideoUrl] = useState("/generated/sample-short.mp4");
    const [platform, setPlatform] = useState("both");
    const [result, setResult] = useState<PublishResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handlePublish() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/social-publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeHandle,
                    instagramHandle,
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


    return (
        <section className="py-16 px-4 bg-[#070a10]">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-10 text-center">
                    <span className="belve-badge mb-3 inline-block">Distribuição & Alcance</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-3">
                        Publicação <span className="belve-gradient-text">Shorts & Reels</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-sm text-slate-300 font-light">
                        Formate metadados, títulos com alto CTR e legendas estratégicas prontas para postagem.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Setup Card */}
                    <div className="belve-card rounded-3xl p-6 md:p-8">
                        <div className="grid gap-4 md:grid-cols-2 mb-4">
                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2 flex items-center gap-1.5">
                                    <Youtube className="w-3.5 h-3.5 text-rose-400" /> Canal do YouTube
                                </label>
                                <input
                                    value={youtubeHandle}
                                    onChange={(event) => setYoutubeHandle(event.target.value)}
                                    placeholder="@seuCanal"
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#e8d9c6] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#a8bed5] mb-2 flex items-center gap-1.5">
                                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Perfil do Instagram
                                </label>
                                <input
                                    value={instagramHandle}
                                    onChange={(event) => setInstagramHandle(event.target.value)}
                                    placeholder="@seuPerfil"
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#e8d9c6] transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2">
                                    Título do Short
                                </label>
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#e8d9c6] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#a8bed5] mb-2">
                                    Arquivo de Vídeo (.mp4)
                                </label>
                                <input
                                    value={videoUrl}
                                    onChange={(event) => setVideoUrl(event.target.value)}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-2.5 text-xs text-white outline-none focus:border-[#e8d9c6] transition font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6] mb-2">
                                    Legenda & Hashtags
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={6}
                                    className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-[#e8d9c6] transition leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={platform}
                                onChange={(event) => setPlatform(event.target.value)}
                                className="py-2.5 px-4 rounded-full bg-black/40 border border-[#e8d9c6]/25 text-xs text-[#e8d9c6] font-heading uppercase tracking-wider focus:outline-none"
                            >
                                <option value="both" className="bg-slate-900 text-white">YouTube + Instagram</option>
                                <option value="youtube" className="bg-slate-900 text-white">Apenas YouTube</option>
                                <option value="instagram" className="bg-slate-900 text-white">Apenas Instagram</option>
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
                                <span className="belve-badge text-[10px]">Shorts & Reels</span>
                            </div>

                            {result ? (
                                <div className="space-y-4 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-2 font-heading font-semibold uppercase tracking-wider">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {result.message}
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-[#e8d9c6]/20">
                                        <div className="text-[10px] uppercase font-heading tracking-widest text-[#e8d9c6] mb-1 font-semibold">
                                            Destinos
                                        </div>
                                        <div className="text-white font-medium">{result.platforms?.join(" • ") || platform}</div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                                        <div className="text-[10px] uppercase font-heading tracking-widest text-slate-400 mb-1 font-semibold">
                                            Título
                                        </div>
                                        <div className="text-white font-medium">{result.payload?.title}</div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                                        <div className="text-[10px] uppercase font-heading tracking-widest text-slate-400 mb-1 font-semibold">
                                            Legenda Final
                                        </div>
                                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-h-36 overflow-auto">
                                            {result.payload?.caption}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-[#e8d9c6]/20 bg-black/30 p-8 text-center my-6">
                                    <Share2 className="w-8 h-8 text-[#e8d9c6]/40 mx-auto mb-2" />
                                    <p className="text-xs text-slate-300">
                                        Conecte os identificadores e clique em <strong>&ldquo;Preparar Publicação&rdquo;</strong> para ver a ficha de envio pronta.
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
