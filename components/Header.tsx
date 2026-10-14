"use client";

import Link from "next/link";
import AgentPulse from "./AgentPulse";
import { Sparkles, TrendingUp, Scissors, Share2, BarChart3, Clock } from "lucide-react";

function Header() {
  return (
    <header className="sticky top-4 z-50 px-4 md:px-8 mb-6">
      <div className="max-w-7xl mx-auto liquid-glass-pane rounded-full px-5 md:px-7 py-2.5 flex items-center justify-between gap-4 transition-all duration-300 border-white/30 shadow-xl backdrop-blur-2xl">
        {/* Brand & Status */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/25 group-hover:border-[#FF1493] transition-colors shadow-inner">
            <AgentPulse size="small" color="blue" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-[0.14em] text-white uppercase group-hover:text-[#FF1493] transition-colors whitespace-nowrap">
              Limbo<span className="text-[#FF1493]">.</span>AI
            </span>
            <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#ff80bf] whitespace-nowrap">
              Viral Studio • #FF1493
            </span>
          </div>
        </Link>

        {/* Navigation Pills (Anti-Quebra de Linha com whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs shrink-0">
          <Link
            href="/"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold uppercase tracking-wider text-[#ff80bf] hover:text-white hover:bg-white/10 transition-all"
          >
            Início
          </Link>

          <Link
            href="/#pipeline"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold uppercase tracking-wider text-slate-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <Scissors className="w-3.5 h-3.5 text-[#FF1493]" />
            Pipeline 3 Etapas
          </Link>

          <Link
            href="/#trend-hunter"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold uppercase tracking-wider text-slate-200 hover:text-[#FF1493] hover:bg-white/10 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FF1493]" />
            Trend Hunter
          </Link>

          <Link
            href="/manage-plan"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold uppercase tracking-wider text-slate-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-[#ff80bf]" />
            Chaves & Postagens
          </Link>
        </nav>

        {/* CTA Button & Hardware Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-heading uppercase tracking-wider text-[#ff80bf] backdrop-blur-md whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-pulse" />
            RTX 3060 Ti • NVENC
          </div>

          <Link
            href="/#trend-hunter"
            className="liquid-btn-pink px-4.5 py-2 text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/30 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explorar Nicho
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
