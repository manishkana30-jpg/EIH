"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Brain,
  Wind,
  ShieldCheck,
  Share2,
  Check,
  Download,
  User,
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import type { LanguageItem } from "@/lib/i18n/language-catalog";

export interface LeftNavProps {
  isBackendHealthy: boolean | null;
  onOpenWellnessFlow?: () => void;
  onOpenCBT: () => void;
  onOpenPranayama: () => void;
  onOpenHistory: () => void;
  onOpenCrisis?: () => void;
  onShareApp: () => void;
  isCopied: boolean;
  onInstallClick: () => void;
  isAppInstalled: boolean;
  currentLanguage: LanguageItem;
  onLanguageChange: (lang: LanguageItem, isAuto: boolean) => void;
}

export const LeftNav: React.FC<LeftNavProps> = React.memo(({
  isBackendHealthy,
  onOpenWellnessFlow,
  onOpenCBT,
  onOpenPranayama,
  onOpenHistory,
  onOpenCrisis: _onOpenCrisis,
  onShareApp,
  isCopied,
  onInstallClick,
  isAppInstalled,
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="hidden md:flex md:w-64 shrink-0 flex-col justify-between bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/60 p-4 z-20 overflow-y-auto space-y-4 h-full min-h-0"
    >
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
            🌿
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-heading font-bold text-base text-slate-100 tracking-tight leading-tight">
              Emotional Intelligence Healer
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] text-slate-400 font-medium font-mono">
                {isBackendHealthy ? "FastAPI Keyless Engine" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <nav className="space-y-1.5">
          {onOpenWellnessFlow && (
            <button
              onClick={onOpenWellnessFlow}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent hover:from-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold transition-all duration-300 group shadow-sm active:scale-95"
              title="Voice-First 4-Phase Guided Wellness Conversation (Mood -> Gita -> CBT -> Trataka)"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">
                ✨
              </div>
              <span className="hidden md:inline text-xs font-bold tracking-wide">
                4-Phase Guided Flow
              </span>
              <span className="hidden md:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 ml-auto">
                VOICE
              </span>
            </button>
          )}

          <a
            href="#clinical-guide"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("clinical-guide")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group cursor-pointer"
            title="AI Somatic Therapy & Neuro-Vedantic Clinical Guide"
          >
            <Compass className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-amber-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              Clinical Guide
            </span>
          </a>

          <button
            onClick={onOpenCBT}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
            title="CBT Cognitive Restructuring Tools"
          >
            <Brain className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-emerald-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              CBT Protocols (20+)
            </span>
          </button>

          <button
            onClick={onOpenPranayama}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
            title="Somatic Breathwork & Vagal Brake"
          >
            <Wind className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-cyan-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              Somatic Breathwork
            </span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
            title="Zero-Retention Privacy (No History or Cache Stored)"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-emerald-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              Zero-Log Privacy
            </span>
          </button>

          {/* Divider for App Access & Utilities */}
          <div className="pt-2 pb-1">
            <div className="h-[1px] bg-slate-800/80 w-full" />
          </div>

          {/* Share Sanctuary Link */}
          <button
            onClick={onShareApp}
            className="relative flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-transparent hover:border-cyan-500/30 transition-all duration-300 group"
            title="Share EIH Sanctuary Link"
          >
            <Share2 className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-cyan-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              {isCopied ? "Link Copied!" : "Share Sanctuary"}
            </span>
            {isCopied ? (
              <span className="hidden md:inline text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded ml-auto flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                <span>Copied</span>
              </span>
            ) : null}
          </button>

          {/* PWA Installation Link */}
          <button
            onClick={onInstallClick}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-emerald-500/30 transition-all duration-300 group"
            title="Install EIH as Desktop / Mobile App"
          >
            <Download className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-emerald-400" />
            <span className="hidden md:inline text-xs font-medium tracking-wide">
              {isAppInstalled ? "App Installed" : "Install App"}
            </span>
            <span
              className={`hidden md:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ml-auto ${
                isAppInstalled
                  ? "text-emerald-400/80 bg-emerald-950/40 border border-emerald-800/40"
                  : "text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 animate-pulse"
              }`}
            >
              PWA
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Language & User Profile */}
      <div className="space-y-3 pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-center md:justify-start">
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />
        </div>

        <div className="hidden md:flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-slate-200 truncate">
              Client Session
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate">
              Zero-Knowledge AES-256
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
});
LeftNav.displayName = "LeftNav";

export default LeftNav;
