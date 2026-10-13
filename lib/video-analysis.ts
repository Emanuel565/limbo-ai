export type VideoAnalysisReport = {
  score: number;
  title: string;
  channel: string;
  views: string;
  likes: string;
  comments: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  transcriptSummary: string;
  nextContentIdeas: string[];
  summary: string;
};

export type VideoAnalysisInput = {
  videoId: string;
  title: string;
  channel: string;
  views: string | number;
  likes: string | number;
  comments: string | number;
  transcriptText?: string;
};

export function normalizeNumericValue(value: string | number | undefined) {
  const raw = String(value ?? "0").replace(/[^\d]/g, "");
  return Number(raw || 0);
}

export function buildVideoAnalysisReport(
  input: VideoAnalysisInput
): VideoAnalysisReport {
  const views = normalizeNumericValue(input.views);
  const likes = normalizeNumericValue(input.likes);
  const comments = normalizeNumericValue(input.comments);
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

  const recommendations = [
    "Reforce o gancho dos primeiros 10 a 15 segundos para aumentar retenção.",
    "Ajuste a miniatura e o título para despertar curiosidade com maior clareza.",
    "Insira um CTA mais natural no meio e no final para aumentar comentários e compartilhamentos.",
  ];

  const transcriptSummary =
    input.transcriptText && input.transcriptText.trim().length > 0
      ? input.transcriptText
        .split(/\s+/)
        .slice(0, 65)
        .join(" ") + (input.transcriptText.split(/\s+/).length > 65 ? "..." : "")
      : "A transcrição ainda não foi extraída em profundidade, mas o vídeo já tem base sólida para criar cortes e roteiro.";

  const executiveSummary =
    score >= 80
      ? "O vídeo demonstra forte potencial de retenção e relevância, com uma estrutura que já sustenta boa aceitação e espaço para ampliar conversão."
      : score >= 65
        ? "O vídeo tem potencial funcional e audiência sólida, mas ainda pode ser mais impactante com ajustes na retenção e no CTA."
        : "O vídeo precisa de um gancho mais agressivo e uma estrutura mais clara para transformar visualizações em engajamento consistente.";

  const nextContentIdeas = [
    "Expanda o tema principal com uma sequência mais direta e mais específica para o público alvo.",
    "Crie um follow-up em formato de resposta, explicação ou comparação para reforçar autoridade.",
    "Use o melhor momento do vídeo como teaser para um short com hook e CTA forte.",
  ];

  const summary = [
    "### Relatório profissional de análise do vídeo",
    "#### Painel Local AI",
    `- **Score de engajamento:** ${score}/100`,
    `- **Título:** **${input.title}**`,
    `- **Canal:** **${input.channel}**`,
    `- **Visualizações:** **${views.toLocaleString("pt-BR")}**`,
    `- **Curtidas:** **${likes.toLocaleString("pt-BR")}**`,
    `- **Comentários:** **${comments.toLocaleString("pt-BR")}**`,
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
    ...recommendations.map((item) => `- ${item}`),
    "",
    "#### Resumo da transcrição",
    `- ${transcriptSummary}`,
    "",
    "#### Próximos conteúdos",
    ...nextContentIdeas.map((item) => `- ${item}`),
  ].join("\n");

  return {
    score,
    title: input.title,
    channel: input.channel,
    views: views.toLocaleString("pt-BR"),
    likes: likes.toLocaleString("pt-BR"),
    comments: comments.toLocaleString("pt-BR"),
    strengths,
    weaknesses,
    recommendations,
    transcriptSummary,
    nextContentIdeas,
    summary,
  };
}
