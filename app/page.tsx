import AgentPulse from "@/components/AgentPulse";
import YoutubeVideoForm from "@/components/YoutubeVideoForm";
import {
  Brain,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Video,
} from "lucide-react";

const steps = [
  {
    title: "1. Conecte seu conteúdo",
    description: "Compartilhe a URL do seu vídeo e deixe seu agente trabalhar.",
    icon: Video,
  },
  {
    title: "2. Análise com IA",
    description: "Seu agente analisa cada detalhe do seu conteúdo.",
    icon: Brain,
  },
  {
    title: "3. Receba inteligência",
    description: "Obtenha insights práticos e recomendações estratégicas.",
    icon: MessageSquare,
  },
];

const features = [
  {
    title: "Análise com IA",
    description:
      "Entenda melhor o desempenho do seu vídeo com inteligência artificial para métricas, engajamento e qualidade do conteúdo.",
    icon: Brain,
    iconBg: "bg-blue-900/60",
    iconColor: "text-blue-300",
  },
  {
    title: "Transcrição inteligente",
    description:
      "Gere transcrições precisas para criar legendas, posts, artigos e reaproveitamento de conteúdo.",
    icon: MessageSquare,
    iconBg: "bg-emerald-900/60",
    iconColor: "text-emerald-300",
  },
  {
    title: "Geração de miniaturas",
    description:
      "Crie miniaturas visualmente fortes com IA e aumente seu CTR com imagens que chamam atenção.",
    icon: ImageIcon,
    iconBg: "bg-violet-900/60",
    iconColor: "text-violet-300",
  },
  {
    title: "Geração de títulos",
    description:
      "Crie títulos SEO-friendly e impactantes para seu canal, com foco em alcance e retenção.",
    icon: MessageSquare,
    iconBg: "bg-amber-900/60",
    iconColor: "text-amber-300",
  },
  {
    title: "Roteiro de gravação",
    description:
      "Receba instruções detalhadas para reproduzir vídeos virais com técnicas, ângulos e estrutura de edição.",
    icon: Video,
    iconBg: "bg-rose-900/60",
    iconColor: "text-rose-300",
  },
  {
    title: "Converse com sua IA",
    description:
      "Faça perguntas, brainstorms e estratégias de conteúdo em uma conversa natural com seu agente de IA.",
    icon: Sparkles,
    iconBg: "bg-orange-900/60",
    iconColor: "text-orange-300",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-10 text-center mb-12">
            <AgentPulse size="large" color="blue" />

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Seu agente pessoal de IA para
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                conteúdo do YouTube
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Transforme seus vídeos em estratégia, com análise, transcrição e
              insights inteligentes em poucos segundos.
            </p>

            <YoutubeVideoForm />
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Recursos poderosos para criadores
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 hover:border-blue-500 transition-all duration-300 shadow-lg shadow-slate-950/30"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900/80">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Seu agente em 3 passos simples
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {step.title}
                  </h3>
                  <p className="text-slate-300">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-0 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para conhecer seu agente de IA?
          </h2>
          <p className="text-xl text-blue-50">
            Criadores usam IA para transformar conteúdo em vantagem competitiva.
          </p>
        </div>
      </section>
    </div>
  );
}
