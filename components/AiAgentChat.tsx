"use client";

import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { FeatureFlag } from "@/features/flags";
import { getVideoDetails } from "@/actions/getVideoDetails";
import { BotIcon, ImageIcon, LetterText, PenIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AnalysisReport = {
  score: number;
  title: string;
  channel: string;
  views: string;
  likes: string;
  comments: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

function parseAnalysisReport(content: string): AnalysisReport | null {
  if (!content.includes("Score de engajamento")) {
    return null;
  }

  const toSection = (heading: string) => {
    const pattern = new RegExp(`#### ${heading}\\s*[\\s\\S]*?(?=\\n#### |$)`, "i");
    const match = content.match(pattern);
    if (!match) return [];

    return match[0]
      .replace(new RegExp(`^#### ${heading}\\s*`, "i"), "")
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);
  };

  const score = Number(
    content.match(/Score de engajamento:\*\*\s*(\d+)\/100/i)?.[1] ?? "0"
  );

  return {
    score,
    title: content.match(/\*\*Título:\*\*\s*\*\*(.+?)\*\*/i)?.[1]?.trim() ?? "",
    channel:
      content.match(/\*\*Canal:\*\*\s*\*\*(.+?)\*\*/i)?.[1]?.trim() ?? "",
    views: content.match(/\*\*Visualizações:\*\*\s*\*\*(.+?)\*\*/i)?.[1]?.trim() ?? "",
    likes: content.match(/\*\*Curtidas:\*\*\s*\*\*(.+?)\*\*/i)?.[1]?.trim() ?? "",
    comments:
      content.match(/\*\*Comentários:\*\*\s*\*\*(.+?)\*\*/i)?.[1]?.trim() ?? "",
    strengths: toSection("Pontos fortes"),
    weaknesses: toSection("Pontos fracos"),
    recommendations: toSection("Recomendação de melhoria"),
  };
}

function AiAgentChat({ videoId }: { videoId: string }) {
  const hasSchematicProvider = Boolean(
    process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY
  );

  if (!hasSchematicProvider) {
    return <AiAgentChatLocal videoId={videoId} />;
  }

  return <AiAgentChatWithSchematic videoId={videoId} />;
}

function AiAgentChatLocal({ videoId }: { videoId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "ready" | "error">("idle");
  const [isSending, setIsSending] = useState(false);

  const isScriptGenerationEnabled = true;
  const isImageGenerationEnabled = true;
  const isTitleGenerationEnabled = true;
  const isVideoAnalysisEnabled = true;

  useEffect(() => {
    if (messages.length > 0) return;

    const loadInitialAnalysis = async () => {
      try {
        const detail = await getVideoDetails(videoId);
        if (!detail) return;

        const parseNumber = (value: string | number | undefined) => {
          const raw = String(value ?? "0").replace(/[^\d]/g, "");
          return Number(raw || 0);
        };

        const views = parseNumber(detail.views);
        const likes = parseNumber(detail.likes);
        const comments = parseNumber(detail.comments);
        const likeRate = views > 0 ? (likes / views) * 100 : 0;
        const commentRate = views > 0 ? (comments / views) * 100 : 0;
        const score = Math.min(
          99,
          Math.max(45, Math.round(likeRate * 650 + commentRate * 9500 + 42))
        );

        const strengths = [
          "A base de audiência e a proposta clara do conteúdo ajudam a manter reconhecimento imediato.",
          "O canal tem sinal forte de autoridade e o tema do vídeo é facilmente compreensível para o público.",
          likes > 0
            ? "O número de curtidas indica que o vídeo tem boa aceitação na prática, com potencial para continuar gerando engajamento."
            : "O vídeo tem boa chance de crescimento se o gancho inicial e a miniatura forem reforçados.",
        ];

        const weaknesses = [
          "O gancho inicial pode ser melhorado para elevar retenção nos primeiros segundos.",
          "A proposta de valor ainda pode ficar mais clara para transformar visualização em ação e conversão.",
          "A estrutura do conteúdo pede um CTA mais direto para incentivar comentário e compartilhamento.",
        ];

        const executiveSummary =
          score >= 80
            ? "O vídeo demonstra forte potencial de retenção e relevância, com uma estrutura que já sustenta boa aceitação e espaço para ampliar conversão."
            : score >= 65
              ? "O vídeo tem potencial funcional e audiência sólida, mas ainda pode ser mais impactante com ajustes na retenção e no CTA."
              : "O vídeo precisa de um gancho mais agressivo e uma estrutura mais clara para transformar visualizações em engajamento consistente.";

        const summary = [
          "### Relatório profissional de análise do vídeo",
          "#### Painel Local AI",
          `- **Score de engajamento:** ${score}/100`,
          `- **Título:** **${detail.title}**`,
          `- **Canal:** **${detail.channel.title}**`,
          `- **Visualizações:** **${detail.views}**`,
          `- **Curtidas:** **${detail.likes}**`,
          `- **Comentários:** **${detail.comments}**`,
          "",
          "#### Resumo executivo",
          `- ${executiveSummary}`,
          "",
          "#### Pontos fortes",
          ...strengths.map((item) => `- ${item}`),
          "",
          "#### Pontos fracos",
          ...weaknesses.map((item) => `- ${item}`),
          "",
          "#### Recomendação de melhoria",
          "- Reforce o gancho dos primeiros 10 a 15 segundos para aumentar retenção.",
          "- Ajuste a miniatura e o título para despertar curiosidade com maior clareza.",
          "- Insira um CTA mais natural no meio e no final para aumentar comentários e compartilhamentos.",
        ].join("\n");

        setMessages([
          {
            id: `analysis-${videoId}`,
            role: "assistant",
            content: summary,
          },
        ]);
      } catch (error) {
        console.error("Initial video analysis failed:", error);
      }
    };

    loadInitialAnalysis();
  }, [messages.length, videoId]);

  const submitPrompt = async (prompt: string) => {
    if (isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setStatus("submitted");
    setInput("");
    setIsSending(true);

    try {
      const requestMessages = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, messages: requestMessages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao consultar a IA");
      }

      setMessages((current) => {
        const last = current[current.length - 1];
        if (last && last.role === "assistant") {
          last.content = data.text || "";
        }
        return [...current];
      });
      setStatus("ready");
    } catch (error) {
      console.error("Chat failed:", error);
      setStatus("error");
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "A IA demorou demais para responder. Tente novamente ou use um modelo mais leve."
          : error instanceof Error
            ? error.message
            : "Erro ao consultar a IA";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (bottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let toastId: string | number | undefined;

    switch (status) {
      case "submitted":
        toastId = toast("Agente está pensando...", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "streaming":
        toastId = toast("Agente está respondendo...", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "error":
        toastId = toast("Ops! Algo deu errado, tente novamente.", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "ready":
        toast.dismiss(toastId);
        break;
    }
  }, [status]);

  const generateScript = async () => {
    await submitPrompt(
      "Gere um roteiro de gravação passo a passo para este vídeo, para eu usar no meu canal, sem fazer outras ações como gerar imagem. Só gere o roteiro."
    );
  };

  const generateImage = async () => {
    await submitPrompt("Gere uma miniatura para este vídeo");
  };

  const generateTitle = async () => {
    await submitPrompt("Gere um título para este vídeo");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSending) return;
    await submitPrompt(input.trim());
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      <div className="hidden lg:block px-4 pb-3 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Agente IA</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" ref={messagesContainerRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-slate-100">Bem-vindo ao chat do agente IA</h3>
                <p className="text-sm text-slate-400">Pergunte qualquer coisa sobre o seu vídeo!</p>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const report = m.role === "assistant" ? parseAnalysisReport(m.content) : null;

            if (report) {
              const executive =
                report.score >= 80
                  ? "Excelente potencial de retenção e profundidade de valor para o público."
                  : report.score >= 65
                    ? "Potencial saudável, com espaço para melhorar retenção e conversão."
                    : "Há boa base de audiência, mas o vídeo precisa de um gancho mais forte.";

              return (
                <div key={m.id} className="flex justify-start">
                  <div className="w-full max-w-[95%] rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">Local AI</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Relatório profissional</h3>
                      </div>

                      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-right">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">Score</div>
                        <div className="text-2xl font-bold text-white">
                          {report.score}
                          <span className="ml-1 text-xs text-slate-300">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Views</p>
                        <p className="mt-1 text-sm font-semibold text-white">{report.views}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Likes</p>
                        <p className="mt-1 text-sm font-semibold text-white">{report.likes}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Comments</p>
                        <p className="mt-1 text-sm font-semibold text-white">{report.comments}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Resumo executivo</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{executive}</p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <h4 className="text-sm font-semibold text-emerald-300">Pontos fortes</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-200">
                          {report.strengths.slice(0, 3).map((item, index) => (
                            <li key={`${item}-${index}`} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                        <h4 className="text-sm font-semibold text-amber-300">Pontos fracos</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-200">
                          {report.weaknesses.slice(0, 3).map((item, index) => (
                            <li key={`${item}-${index}`} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                      <h4 className="text-sm font-semibold text-blue-300">Recomendação de melhoria</h4>
                      <ul className="mt-2 space-y-2 text-sm text-slate-200">
                        {report.recommendations.slice(0, 3).map((item, index) => (
                          <li key={`${item}-${index}`} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] ${m.role === "user" ? "bg-blue-600" : "bg-slate-900 border border-slate-700"} rounded-2xl px-4 py-3`}
                >
                  <div className="prose prose-sm max-w-none text-white">
                    <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 text-sm border border-slate-700 bg-slate-900 text-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              type="text"
              placeholder={
                !isVideoAnalysisEnabled
                  ? "Atualize para perguntar sobre o vídeo..."
                  : "Pergunte sobre o seu vídeo..."
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button
              type="submit"
              disabled={status === "submitted" || isSending || !isVideoAnalysisEnabled}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitted" || isSending ? "IA pensando..." : "Enviar"}
            </Button>
          </form>

          <div className="flex gap-2">
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateScript}
              type="button"
              disabled={!isScriptGenerationEnabled || isSending}
            >
              <LetterText className="w-4 h-4" />
              {isScriptGenerationEnabled ? <span>Gerar roteiro</span> : <span>Atualize para gerar roteiro</span>}
            </button>

            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateTitle}
              type="button"
              disabled={!isTitleGenerationEnabled || isSending}
            >
              <PenIcon className="w-4 h-4" />
              Gerar título
            </button>

            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateImage}
              type="button"
              disabled={!isImageGenerationEnabled || isSending}
            >
              <ImageIcon className="w-4 h-4" />
              Gerar imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiAgentChatWithSchematic({ videoId }: { videoId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "ready" | "error">("idle");
  const [isSending, setIsSending] = useState(false);

  const isScriptGenerationEnabled = useSchematicFlag(FeatureFlag.SCRIPT_GENERATION);
  const isImageGenerationEnabled = useSchematicFlag(FeatureFlag.IMAGE_GENERATION);
  const isTitleGenerationEnabled = useSchematicFlag(FeatureFlag.TITLE_GENERATIONS);
  const isVideoAnalysisEnabled = useSchematicFlag(FeatureFlag.ANALYSE_VIDEO);

  useEffect(() => {
    if (messages.length > 0) return;

    const loadInitialAnalysis = async () => {
      try {
        const detail = await getVideoDetails(videoId);
        if (!detail) return;

        const parseNumber = (value: string | number | undefined) => {
          const raw = String(value ?? "0").replace(/[^\d]/g, "");
          return Number(raw || 0);
        };

        const views = parseNumber(detail.views);
        const likes = parseNumber(detail.likes);
        const comments = parseNumber(detail.comments);
        const likeRate = views > 0 ? (likes / views) * 100 : 0;
        const commentRate = views > 0 ? (comments / views) * 100 : 0;
        const score = Math.min(
          99,
          Math.max(45, Math.round(likeRate * 650 + commentRate * 9500 + 42))
        );

        const strengths = [
          "A base de audiência e a proposta clara do conteúdo ajudam a manter reconhecimento imediato.",
          "O canal tem sinal forte de autoridade e o tema do vídeo é facilmente compreensível para o público.",
          likes > 0
            ? "O número de curtidas indica que o vídeo tem boa aceitação na prática, com potencial para continuar gerando engajamento."
            : "O vídeo tem boa chance de crescimento se o gancho inicial e a miniatura forem reforçados.",
        ];

        const weaknesses = [
          "O gancho inicial pode ser melhorado para elevar retenção nos primeiros segundos.",
          "A proposta de valor ainda pode ficar mais clara para transformar visualização em ação e conversão.",
          "A estrutura do conteúdo pede um CTA mais direto para incentivar comentário e compartilhamento.",
        ];

        const executiveSummary =
          score >= 80
            ? "O vídeo demonstra forte potencial de retenção e relevância, com uma estrutura que já sustenta boa aceitação e espaço para ampliar conversão."
            : score >= 65
              ? "O vídeo tem potencial funcional e audiência sólida, mas ainda pode ser mais impactante com ajustes na retenção e no CTA."
              : "O vídeo precisa de um gancho mais agressivo e uma estrutura mais clara para transformar visualizações em engajamento consistente.";

        const summary = [
          "### Relatório profissional de análise do vídeo",
          "#### Painel Local AI",
          `- **Score de engajamento:** ${score}/100`,
          `- **Título:** **${detail.title}**`,
          `- **Canal:** **${detail.channel.title}**`,
          `- **Visualizações:** **${detail.views}**`,
          `- **Curtidas:** **${detail.likes}**`,
          `- **Comentários:** **${detail.comments}**`,
          "",
          "#### Resumo executivo",
          `- ${executiveSummary}`,
          "",
          "#### Pontos fortes",
          ...strengths.map((item) => `- ${item}`),
          "",
          "#### Pontos fracos",
          ...weaknesses.map((item) => `- ${item}`),
          "",
          "#### Recomendação de melhoria",
          "- Reforce o gancho dos primeiros 10 a 15 segundos para aumentar retenção.",
          "- Ajuste a miniatura e o título para despertar curiosidade com maior clareza.",
          "- Insira um CTA mais natural no meio e no final para aumentar comentários e compartilhamentos.",
        ].join("\n");

        setMessages([
          {
            id: `analysis-${videoId}`,
            role: "assistant",
            content: summary,
          },
        ]);
      } catch (error) {
        console.error("Initial video analysis failed:", error);
      }
    };

    loadInitialAnalysis();
  }, [messages.length, videoId]);

  const submitPrompt = async (prompt: string) => {
    if (isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setStatus("submitted");
    setInput("");
    setIsSending(true);

    try {
      const requestMessages = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, messages: requestMessages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao consultar a IA");
      }

      setMessages((current) => {
        const last = current[current.length - 1];
        if (last && last.role === "assistant") {
          last.content = data.text || "";
        }
        return [...current];
      });
      setStatus("ready");
    } catch (error) {
      console.error("Chat failed:", error);
      setStatus("error");
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "A IA demorou demais para responder. Tente novamente ou use um modelo mais leve."
          : error instanceof Error
            ? error.message
            : "Erro ao consultar a IA";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (bottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let toastId: string | number | undefined;

    switch (status) {
      case "submitted":
        toastId = toast("Agente está pensando...", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "streaming":
        toastId = toast("Agente está respondendo...", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "error":
        toastId = toast("Ops! Algo deu errado, tente novamente.", {
          icon: <BotIcon className="w-4 h-4" />,
        });
        break;
      case "ready":
        toast.dismiss(toastId);
        break;
    }
  }, [status]);

  const generateScript = async () => {
    await submitPrompt(
      "Gere um roteiro de gravação passo a passo para este vídeo, para eu usar no meu canal, sem fazer outras ações como gerar imagem. Só gere o roteiro."
    );
  };

  const generateImage = async () => {
    await submitPrompt("Gere uma miniatura para este vídeo");
  };

  const generateTitle = async () => {
    await submitPrompt("Gere um título para este vídeo");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSending) return;
    await submitPrompt(input.trim());
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-500/10 p-2 text-blue-400">
            <BotIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Agente de IA</h2>
            <p className="text-xs text-slate-400">Assistente para o vídeo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.map((m, index) => {
            const report = m.role === "assistant" ? parseAnalysisReport(m.content) : null;

            if (report) {
              const executive =
                report.score >= 80
                  ? "Excelente potencial de retenção e profundidade de valor para o público."
                  : report.score >= 65
                    ? "Potencial saudável, com espaço para melhorar retenção e conversão."
                    : "Há boa base de audiência, mas o vídeo precisa de um gancho mais forte.";

              return (
                <div key={`${m.id ?? index}`} className="space-y-2">
                  <div className="flex justify-start">
                    <div className="w-full max-w-[95%] rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">Local AI</p>
                          <h3 className="mt-2 text-lg font-semibold text-white">Relatório profissional</h3>
                        </div>

                        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-right">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">Score</div>
                          <div className="text-2xl font-bold text-white">
                            {report.score}
                            <span className="ml-1 text-xs text-slate-300">/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Views</p>
                          <p className="mt-1 text-sm font-semibold text-white">{report.views}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Likes</p>
                          <p className="mt-1 text-sm font-semibold text-white">{report.likes}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Comments</p>
                          <p className="mt-1 text-sm font-semibold text-white">{report.comments}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Resumo executivo</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{executive}</p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <h4 className="text-sm font-semibold text-emerald-300">Pontos fortes</h4>
                          <ul className="mt-2 space-y-2 text-sm text-slate-200">
                            {report.strengths.slice(0, 3).map((item, itemIndex) => (
                              <li key={`${item}-${itemIndex}`} className="flex gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                          <h4 className="text-sm font-semibold text-amber-300">Pontos fracos</h4>
                          <ul className="mt-2 space-y-2 text-sm text-slate-200">
                            {report.weaknesses.slice(0, 3).map((item, itemIndex) => (
                              <li key={`${item}-${itemIndex}`} className="flex gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                        <h4 className="text-sm font-semibold text-blue-300">Recomendação de melhoria</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-200">
                          {report.recommendations.slice(0, 3).map((item, itemIndex) => (
                            <li key={`${item}-${itemIndex}`} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={`${m.id ?? index}`} className="space-y-2">
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === "user" ? "bg-blue-500 text-white" : "bg-slate-900 text-slate-100 border border-slate-800"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none text-slate-100">
                      <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 text-sm border border-slate-700 bg-slate-900 text-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              type="text"
              placeholder={
                !isVideoAnalysisEnabled
                  ? "Atualize para perguntar sobre o vídeo..."
                  : "Pergunte sobre o seu vídeo..."
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button
              type="submit"
              disabled={status === "submitted" || isSending || !isVideoAnalysisEnabled}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitted" || isSending ? "IA pensando..." : "Enviar"}
            </Button>
          </form>

          <div className="flex gap-2">
            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateScript}
              type="button"
              disabled={!isScriptGenerationEnabled || isSending}
            >
              <LetterText className="w-4 h-4" />
              {isScriptGenerationEnabled ? <span>Gerar roteiro</span> : <span>Atualize para gerar roteiro</span>}
            </button>

            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateTitle}
              type="button"
              disabled={!isTitleGenerationEnabled || isSending}
            >
              <PenIcon className="w-4 h-4" />
              Gerar título
            </button>

            <button
              className="text-xs xl:text-sm w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateImage}
              type="button"
              disabled={!isImageGenerationEnabled || isSending}
            >
              <ImageIcon className="w-4 h-4" />
              Gerar imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAgentChat;
