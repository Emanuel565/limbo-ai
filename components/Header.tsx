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
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#FF1493]/15 border border-[#FF1493]/40 group-hover:border-[#FF1493] transition-colors">
            <AgentPulse size="small" color="blue" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-[0.14em] text-white uppercase group-hover:text-[#FF1493] transition-colors">
              Limbo<span className="text-[#FF1493]">.</span>AI
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#ff80bf]">
              Viral Studio • #FF1493
            </span>
          </div>
        </Link>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-[#ff80bf] hover:text-white hover:bg-[#FF1493]/10 transition-all"
          >
            Início
          </Link>

          <Link
            href="/#trend-hunter"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-[#FF1493] hover:bg-[#FF1493]/10 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FF1493]" />
            Trend Hunter
          </Link>

          <Link
            href="/#shorts"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white hover:bg-[#FF1493]/10 transition-all"
          >
            <Scissors className="w-3.5 h-3.5 text-[#ff80bf]" />
            Edição 9:16
          </Link>

          <Link
            href="/manage-plan"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white hover:bg-[#FF1493]/10 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-[#ff80bf]" />
            TikTok & Redes
          </Link>
        </nav>

        {/* CTA Button & Hardware Status */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-[#FF1493]/30 text-[11px] font-heading uppercase tracking-[0.15em] text-[#ff80bf]">
            <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-pulse" />
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
