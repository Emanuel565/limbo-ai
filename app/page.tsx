import ShortsPipelinePanel from "@/components/ShortsPipelinePanel";
import TrendHunterPanel from "@/components/TrendHunterPanel";
import YoutubeVideoForm from "@/components/YoutubeVideoForm";
import {
  Brain,
  Image as ImageIcon,
  MessageSquare,
  Scissors,
  TrendingUp,
  Cpu,
  Share2,
  CheckCircle2,
} from "lucide-react";


const steps = [
  {
    step: "01",
    title: "Trend Hunter com IA Local",
    description: "Pesquise os tópicos mais virais do seu nicho no YouTube com cálculo em tempo real de visualizações e taxa de engajamento.",
    icon: TrendingUp,
  },
  {
    step: "02",
    title: "Identificação de Ganchos",
    description: "O Ollama (Llama 3.1 / Gemma 2) analisa as transcrições e isola o trecho de maior retenção de até 55 segundos.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Renderização 9:16 na RTX 3060 Ti",
    description: "O FFmpeg NVENC processa o reenquadramento vertical com aceleração por hardware sem travar seu PC.",
    icon: Scissors,
  },
];

const features = [
  {
    title: "Buscador de Tendências",
    description:
      "Descubra quais vídeos e assuntos estão em ascensão antes de planejar sua linha editorial, com filtros inteligentes de métricas.",
    icon: TrendingUp,
    badge: "API v3 + IA",
  },
  {
    title: "Gancho Viral com Ollama",
    description:
      "A IA local lê a transcrição e detecta quebras de padrão e revelações contraintuitivas ideais para os primeiros 3 segundos.",
    icon: Brain,
    badge: "100% Local na VRAM",
  },
  {
    title: "Render NVENC Acelerado",
    description:
      "Exportação em 1080x1920 acelerada por hardware na GeForce RTX 3060 Ti com legendas sincronizadas e alto bitrate.",
    icon: Cpu,
    badge: "RTX 3060 Ti",
  },
  {
    title: "Geração de Miniaturas",
    description:
      "Crie miniaturas de alta resolução visualmente impactantes para aumentar o CTR em cada nova publicação.",
    icon: ImageIcon,
    badge: "Design de Luxo",
  },
  {
    title: "Títulos com Alto CTR",
    description:
      "Gere variações de títulos com fórmulas comprovadas de curiosidade, autoridade e retenção para o algoritmo.",
    icon: MessageSquare,
    badge: "SEO & Copywriting",
  },
  {
    title: "Publicação Multiplataforma",
    description:
      "Prepare os metadados finais e exporte legendas e hashtags prontas para YouTube Shorts e Instagram Reels.",
    icon: Share2,
    badge: "Shorts & Reels",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#14010e] text-slate-100 selection:bg-[#FF1493] selection:text-white">
      {/* Hero Section com Estética Deep Pink #FF1493 */}
      <section className="relative pt-16 pb-28 px-4 overflow-hidden">
        {/* Ambient Deep Pink #FF1493 Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-[#FF1493]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-32 right-10 w-[350px] h-[350px] bg-[#FF1493]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="belve-badge flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-ping" />
              Inteligência Viral • Deep Pink Edition
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-6 leading-[1.08]">
            Domine o Algoritmo com <br />
            <span className="belve-gradient-text">IA Local & Tendências</span>
          </h1>


          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Descubra os vídeos mais virais do seu nicho, isole ganchos de alta retenção no Ollama
            e renderize cortes verticais 9:16 acelerados por hardware na sua RTX 3060 Ti.
          </p>

          {/* Quick Action Navigation Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <a
              href="#trend-hunter"
              className="belve-btn-champagne px-7 py-3 text-xs flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Trend Hunter (Pesquisar Nicho)
            </a>

            <a
              href="#shorts"
              className="belve-btn-outline px-6 py-3 text-xs flex items-center gap-2"
            >
              <Scissors className="w-4 h-4 text-[#a8bed5]" />
              Cortador 9:16 NVENC
            </a>

            <a
              href="/manage-plan"
              className="belve-badge-blue px-6 py-3 text-xs flex items-center gap-2 hover:bg-[#2e3188]/40 transition"
            >
              <Share2 className="w-4 h-4" />
              Publicar Redes
            </a>
          </div>

          {/* Direct URL Form Box */}
          <div className="belve-card rounded-3xl p-6 md:p-8 max-w-3xl mx-auto border-[#e8d9c6]/20">
            <p className="text-xs font-heading uppercase tracking-widest text-[#e8d9c6] font-semibold mb-3">
              Já tem um vídeo específico em mente?
            </p>
            <YoutubeVideoForm />
          </div>
        </div>
      </section>

      {/* 1. TREND HUNTER PANEL (NOVO MÓDULO) */}
      <TrendHunterPanel />

      {/* 2. SHORTS & REELS NVENC PIPELINE */}
      <ShortsPipelinePanel />

      {/* 3. RECURSOS PREMIUM (Estilo Editorial Deep Pink #FF1493) */}
      <section className="py-24 px-4 bg-[#1a0213] relative border-t border-b border-[#FF1493]/15">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="belve-badge mb-3 inline-block">Tecnologia & Sofisticação</span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">
              Arquitetura de <span className="belve-gradient-text">Alta Performance</span>
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-light">
              Tudo o que você precisa para automatizar sua linha editorial sem custos de nuvem recorrentes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="belve-card rounded-3xl p-7 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF1493]/15 border border-[#FF1493]/35 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-5 h-5 text-[#FF1493]" />
                      </div>
                      <span className="text-[10px] font-heading font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-2 group-hover:text-[#ff80bf] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-heading uppercase tracking-wider text-[#FF1493]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pronto para uso</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FLUXO EM 3 PASSOS SIMPLES */}
      <section className="py-24 px-4 bg-[#14010e]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="belve-badge mb-3 inline-block">Workflow Otimizado</span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-3">
              Como a Automação Opera
            </h2>
            <p className="text-sm text-slate-400">Do nicho ao short vertical em minutos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, index) => {
              const Icon = s.icon;
              return (
                <div
                  key={index}
                  className="belve-card rounded-3xl p-8 text-center relative flex flex-col justify-between"
                >
                  <div>
                    <span className="font-heading text-4xl font-extrabold text-[#FF1493]/20 block mb-4">
                      {s.step}
                    </span>
                    <div className="w-14 h-14 rounded-full bg-[#FF1493]/15 border border-[#FF1493]/35 flex items-center justify-center mx-auto mb-5">
                      <Icon className="w-6 h-6 text-[#FF1493]" />
                    </div>
                    <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-white mb-3">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      {s.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Luxury CTA */}
      <footer className="py-16 px-4 bg-[#0e0108] border-t border-[#FF1493]/20 text-center">
        <div className="container mx-auto max-w-4xl">
          <span className="font-heading text-2xl font-bold tracking-[0.18em] uppercase text-white block mb-2">
            Limbo<span className="text-[#FF1493]">.</span>AI
          </span>
          <p className="text-xs text-[#ff80bf] tracking-[0.2em] uppercase font-semibold mb-6">
            Inteligência de Conteúdo Local • RTX 3060 Ti & Ollama
          </p>
          <div className="flex justify-center gap-4 text-xs text-slate-400 font-heading uppercase tracking-wider">
            <a href="#trend-hunter" className="hover:text-[#FF1493] transition">Trend Hunter</a>
            <span>•</span>
            <a href="#shorts" className="hover:text-[#FF1493] transition">Shorts 9:16</a>
            <span>•</span>
            <a href="/manage-plan" className="hover:text-[#FF1493] transition">Publicação</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

