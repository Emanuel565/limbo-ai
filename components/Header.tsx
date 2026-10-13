"use client";

import Link from "next/link";
import AgentPulse from "./AgentPulse";
import { Sparkles, TrendingUp, Scissors, Share2 } from "lucide-react";

function Header() {
  return (
    <header className="sticky top-4 z-50 px-4 md:px-8 mb-6">
      <div className="max-w-6xl mx-auto belve-pill-nav rounded-full px-5 py-3 flex items-center justify-between transition-all duration-300">
        {/* Brand & Status */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#e8d9c6]/10 border border-[#e8d9c6]/30 group-hover:border-[#e8d9c6] transition-colors">
            <AgentPulse size="small" color="blue" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-[0.14em] text-white uppercase group-hover:text-[#e8d9c6] transition-colors">
              Limbo<span className="text-[#e8d9c6]">.</span>AI
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#a8bed5]/80">
              Estética & Inteligência
            </span>
          </div>
        </Link>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-[#e8d9c6]/90 hover:text-white hover:bg-white/5 transition-all"
          >
            Início
          </Link>

          <Link
            href="/#trend-hunter"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-[#a8bed5] hover:text-white hover:bg-white/5 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#e8d9c6]" />
            Trend Hunter
          </Link>

          <Link
            href="/#shorts"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Scissors className="w-3.5 h-3.5 text-[#a8bed5]" />
            Cortes 9:16
          </Link>

          <Link
            href="/manage-plan"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            Publicação
          </Link>
        </nav>

        {/* CTA Button & Hardware Status */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#e8d9c6]/20 text-[11px] font-heading uppercase tracking-[0.15em] text-[#e8d9c6]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            RTX 3060 Ti • NVENC
          </div>

          <Link
            href="/#trend-hunter"
            className="belve-btn-champagne px-5 py-2 text-xs flex items-center gap-1.5"
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
