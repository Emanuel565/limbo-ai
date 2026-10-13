"use client";

import { ArrowRight, Sparkles } from "lucide-react";

function AnalyseButton({ pending = false }: { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="belve-btn-champagne px-7 py-3.5 text-xs inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-[#e8d9c6]/20"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>{pending ? "Analisando..." : "Analisar com IA"}</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

export default AnalyseButton;
