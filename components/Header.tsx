"use client";

import Link from "next/link";
import AgentPulse from "./AgentPulse";
import { Button } from "./ui/button";

function Header() {
  return (
    <header className="sticky top-0 left-0 right-0 px-4 md:px-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-4">
              <AgentPulse size="small" color="blue" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Limbo AI
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/manage-plan">
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              >
                Gerenciar plano
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
