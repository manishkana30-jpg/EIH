"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Eye, ShieldAlert, BookOpen, HeartPulse, ExternalLink } from "lucide-react";
import SanctuarySessionPage from "@/app/(session)/page";

export interface SanctuaryUIProps {
  className?: string;
  initialMode?: "sanctuary" | "trataka" | "crisis";
}

export const SanctuaryUI: React.FC<SanctuaryUIProps> = ({
  className = "",
  initialMode = "sanctuary",
}) => {
  const [activeTab, setActiveTab] = useState<"sanctuary" | "trataka" | "crisis">(initialMode);

  return (
    <div className={`relative min-h-screen bg-[#09090b] text-zinc-100 flex flex-col ${className}`}>
      {/* Top Clinical Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-all">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-amber-300 transition-colors">
                  EIH Sanctuary
                </span>
                <span className="hidden sm:inline-block text-[10px] text-amber-500/80 ml-2 font-mono uppercase tracking-wider">
                  Zero-Knowledge AES-256
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/clinical-guide"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Clinical Guide</span>
            </Link>

            <Link
              href="/crisis"
              className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Crisis Helplines</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Center-Stage Experience */}
      <main className="flex-1 flex flex-col">
        <SanctuarySessionPage />
      </main>
    </div>
  );
};

export default SanctuaryUI;
