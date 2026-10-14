import SocialPipelineStudio from "@/components/SocialPipelineStudio";
import TrendHunterPanel from "@/components/TrendHunterPanel";
import {
  Gamepad2,
  Cpu,
  Brain,
  Zap,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-slate-100 selection:bg-[#FF1493] selection:text-white">
      {/* Hero Section Luxury - Deep Pink #FF1493 Edition */}
      <section className="relative pt-10 pb-8 px-4 overflow-hidden">
        {/* Ambient Deep Pink Glows */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#FF1493]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[350px] h-[350px] bg-[#FF1493]/20 rounded-full blur-[130px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="belve-badge flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-ping" />
              Admin de Redes Sociais • Autopilot Valorant
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-white mb-4 leading-[1.08]">
            Fábrica Autônoma de <br />
            <span className="belve-gradient-text">Cortes & Gestão de Redes</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto mb-6 leading-relaxed">
            Pipeline linear prático em 3 etapas: selecione a jogada de <strong>Valorant</strong>, configure a renderização acelerada por GPU <strong>(RTX 3060 Ti)</strong> e automatize as postagens programadas para faturar no <strong>TikTok</strong>, <strong>Instagram</strong> e <strong>YouTube</strong>.
          </p>

          {/* Badges de Hardware & IA */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-[#FF1493]/30 text-pink-300">
              <Cpu className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>RTX 3060 Ti • NVENC Local</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-purple-500/30 text-purple-300">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Ollama Local • R$ 0 Nuvem</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 text-emerald-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>GhostEngine v2 • Multiplataforma</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 🚀 PIPELINE LINEAR EM 3 ETAPAS: O CORE DO SISTEMA        */}
      {/* ======================================================== */}
      <section id="pipeline" className="pb-16">
        <SocialPipelineStudio />
      </section>

      {/* ======================================================== */}
      {/* 👻 CAÇADOR DE TENDÊNCIAS GHOSTENGINE V2                   */}
      {/* ======================================================== */}
      <section id="trend-hunter" className="border-t border-[#FF1493]/20">
        <TrendHunterPanel />
      </section>

      {/* Footer Luxury */}
      <footer className="py-12 px-4 bg-[#0a0007] border-t border-[#FF1493]/20 text-center relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gamepad2 className="w-5 h-5 text-[#FF1493]" />
            <span className="font-heading text-xl font-bold tracking-[0.18em] uppercase text-white">
              Limbo<span className="text-[#FF1493]">.</span>AI
            </span>
          </div>

          <p className="text-xs text-[#ff80bf] tracking-[0.15em] uppercase font-semibold mb-4">
            Admin de Redes & Automação de Cortes • 100% Acelerado por Hardware
          </p>

          <p className="text-[11px] text-slate-500 font-mono">
            Processamento local em NVIDIA GeForce RTX 3060 Ti & Ollama • Postagens Oficiais Meta & TikTok
          </p>
        </div>
      </footer>
    </div>
  );
}
