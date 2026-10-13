"use client";

import { useMemo, useState, useEffect } from "react";
import { Play, Sparkles, TestTube, Film, Cpu, CheckCircle2, Scissors } from "lucide-react";

interface ShortPlan {
    title: string;
    duration: number;
    start: number;
    end: number;
    reason: string;
    ffmpegCommand?: string;
}

interface TestResult {
    ok: boolean;
    status: number;
    stdout?: string;
    stderr?: string;
}

const sampleTranscript = `Você precisa ouvir isso agora porque este insight muda completamente a forma como você cria conteúdo.
Este é o momento mais importante da estratégia: captar atenção em poucos segundos e entregar valor imediato.
Quando a mensagem está clara, a retenção sobe e a audiência entende a proposta antes mesmo de clicar em seguir.`;

export default function ShortsPipelinePanel() {
    const [transcript, setTranscript] = useState(sampleTranscript);
    const [videoUrl, setVideoUrl] = useState("");
    const [plan, setPlan] = useState<ShortPlan | null>(null);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [generated, setGenerated] = useState<{ mp4Url?: string; subtitleUrl?: string } | null>(null);
    const [error, setError] = useState("");

    // Ouve eventos disparados pelo Trend Hunter
    useEffect(() => {
        function handleVideoSelected(e: Event) {
            const customEvent = e as CustomEvent<{ url?: string }>;
            if (customEvent.detail?.url) {
                setVideoUrl(customEvent.detail.url);
                setError("");
            }
        }


        window.addEventListener("select-short-video", handleVideoSelected);
        return () => window.removeEventListener("select-short-video", handleVideoSelected);
    }, []);

    const preview = useMemo(() => {
        if (!plan) return null;
        return {
            title: plan.title,
            duration: plan.duration,
            start: plan.start,
            end: plan.end,
            reason: plan.reason,
            ffmpegCommand: plan.ffmpegCommand,
        };
    }, [plan]);

    async function runPlan() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/shorts-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Não foi possível gerar o plano do corte.");
            }

            setPlan(data.plan);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao gerar o plano.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function runTests() {
        setTesting(true);
        setError("");

        try {
            const response = await fetch("/api/shorts-test", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Erro ao executar a validação do pipeline.");
            }

            setTestResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao executar os testes.";
            setError(message);
        } finally {
            setTesting(false);
        }
    }

    async function uploadVideo() {
        if (!videoFile) {
            setError("Selecione um arquivo de vídeo antes de exportar o corte.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("video", videoFile);
            formData.append("transcript", transcript);

            const response = await fetch("/api/shorts-upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Erro ao gerar o corte do vídeo.");
            }

            setGenerated({
                mp4Url: data.mp4Url,
                subtitleUrl: data.subtitleUrl,
            });
            setPlan(data.plan);
            setError("");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao processar o vídeo.";
            setError(message);
        } finally {
            setUploading(false);
        }
    }

    return (
        <section id="shorts" className="py-24 px-4 relative overflow-hidden bg-[#070a10]">
            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="belve-badge flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-[#e8d9c6]" />
                            Editor Vertical 9:16 • GPU NVENC
                        </span>
                    </div>

                    <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">
                        Renderização & <span className="belve-gradient-text">Cortes Virais</span>
                    </h2>

                    <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-light leading-relaxed">
                        Corte de alta precisão com reenquadramento automático 9:16 (1080x1920) e aceleração
                        por hardware na sua placa de vídeo RTX 3060 Ti via FFmpeg NVENC.
                    </p>

                    {/* GPU Badge */}
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-black/60 border border-[#e8d9c6]/30 text-xs font-heading uppercase tracking-wider text-[#e8d9c6]">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aceleração por Hardware: <strong>h264_nvenc (RTX 3060 Ti)</strong></span>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Input Controls Card */}
                    <div className="belve-card rounded-3xl p-6 md:p-8">
                        {videoUrl && (
                            <div className="mb-5 p-3 rounded-2xl bg-[#e8d9c6]/10 border border-[#e8d9c6]/30 flex items-center justify-between">
                                <div className="text-xs">
                                    <span className="text-[10px] font-heading uppercase tracking-wider text-[#e8d9c6] block font-semibold">
                                        Vídeo Alvo Selecionado do Trend Hunter:
                                    </span>
                                    <span className="text-white truncate block max-w-md font-mono">{videoUrl}</span>
                                </div>
                                <button
                                    onClick={() => setVideoUrl("")}
                                    className="text-xs text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-heading font-semibold uppercase tracking-wider text-[#e8d9c6]">
                                Transcrição do Conteúdo (ou Roteiro)
                            </label>
                            <textarea
                                value={transcript}
                                onChange={(event) => setTranscript(event.target.value)}
                                rows={6}
                                className="w-full rounded-2xl border border-[#e8d9c6]/20 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-[#e8d9c6] font-sans leading-relaxed"
                                placeholder="Cole a transcrição do vídeo para o Ollama encontrar o trecho mais forte..."
                            />
                        </div>

                        <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                            <label className="mb-2 block text-xs font-heading font-semibold uppercase tracking-wider text-[#a8bed5]">
                                Arquivo de Vídeo Original (.mp4)
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                                className="block w-full text-xs text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#e8d9c6] file:px-4 file:py-2 file:text-xs file:font-heading file:font-bold file:uppercase file:tracking-wider file:text-black hover:file:bg-[#f4ece1] file:cursor-pointer"
                            />
                            {videoFile && (
                                <p className="mt-2 text-xs text-emerald-400 font-mono">
                                    ✓ Selecionado: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={runPlan}
                                disabled={loading}
                                className="belve-btn-champagne px-6 py-3 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className="h-4 w-4" />
                                {loading ? "Calculando Gancho..." : "Identificar Gancho Viral (Ollama)"}
                            </button>

                            <button
                                type="button"
                                onClick={runTests}
                                disabled={testing}
                                className="belve-btn-outline px-5 py-3 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <TestTube className="h-4 w-4" />
                                {testing ? "Validando..." : "Validar Pipeline"}
                            </button>

                            <button
                                type="button"
                                onClick={uploadVideo}
                                disabled={uploading || !videoFile}
                                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading uppercase tracking-wider text-xs px-6 py-3 font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="h-4 w-4" />
                                {uploading ? "Renderizando na GPU..." : "Renderizar 9:16 (NVENC)"}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Preview / Results Column */}
                    <div className="belve-card rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-white">
                                    Mockup do Corte 9:16
                                </h3>
                                <span className="belve-badge text-[10px]">1080 × 1920</span>
                            </div>

                            {preview ? (
                                <div className="space-y-4">
                                    {/* Smartphone Frame Style Preview */}
                                    <div className="mx-auto w-48 rounded-3xl border-2 border-[#e8d9c6]/40 bg-black/80 p-3 shadow-2xl relative aspect-[9/16] flex flex-col justify-between overflow-hidden">
                                        <div className="flex justify-between items-center text-[9px] text-[#e8d9c6] font-mono">
                                            <span>SHORTS</span>
                                            <span>{preview.duration}s</span>
                                        </div>

                                        <div className="my-auto text-center px-1">
                                            <p className="text-[10px] font-heading font-bold text-white line-clamp-3 mb-1 uppercase tracking-tight">
                                                {preview.title}
                                            </p>
                                            <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/20 text-white inline-block">
                                                {preview.start}s - {preview.end}s
                                            </span>
                                        </div>

                                        <div className="text-center bg-[#e8d9c6]/20 rounded-lg p-1.5 border border-[#e8d9c6]/30">
                                            <span className="text-[8px] text-[#e8d9c6] font-bold block uppercase tracking-wider">
                                                NVENC • 60 FPS
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-[#e8d9c6]/20 bg-black/40 p-4">
                                        <div className="text-[10px] font-heading uppercase tracking-widest text-[#e8d9c6] font-semibold mb-1">
                                            Justificativa do Trecho
                                        </div>
                                        <p className="text-xs text-slate-200 leading-relaxed font-light">
                                            {preview.reason}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-[#e8d9c6]/20 bg-black/30 p-8 text-center my-6">
                                    <Film className="w-8 h-8 text-[#e8d9c6]/50 mx-auto mb-2" />
                                    <p className="text-xs text-slate-300">
                                        Clique em <strong>&ldquo;Identificar Gancho Viral&rdquo;</strong> para visualizar os timestamps
                                        e o reenquadramento recomendado pela IA.
                                    </p>
                                </div>

                            )}

                            {generated && (
                                <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs">
                                    <div className="flex items-center gap-2 font-heading font-bold uppercase tracking-wider text-emerald-300 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Renderizado na RTX 3060 Ti
                                    </div>
                                    <div className="space-y-2">
                                        {generated.mp4Url && (
                                            <a
                                                href={generated.mp4Url}
                                                download
                                                className="block p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 font-semibold transition"
                                            >
                                                📥 Baixar Vídeo Vertical (.mp4)
                                            </a>
                                        )}
                                        {generated.subtitleUrl && (
                                            <a
                                                href={generated.subtitleUrl}
                                                download
                                                className="block p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition"
                                            >
                                                📄 Baixar Legenda Sincronizada (.srt)
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {testResult && (
                                <div className="mt-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs font-mono">
                                    <div className="text-[#a8bed5] font-heading uppercase tracking-wider mb-1 font-bold">
                                        Status do Teste: {testResult.status === 0 ? "SUCESSO (PASSOU)" : "FALHA"}
                                    </div>
                                    <pre className="max-h-24 overflow-auto text-[10px] text-slate-300 bg-black/50 p-2 rounded-lg">
                                        {testResult.stdout || "Testes validados com sucesso."}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
