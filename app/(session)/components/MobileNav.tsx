"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Compass,
  Brain,
  Wind,
  ShieldCheck,
  ShieldAlert,
  Share2,
  Check,
  Download,
  User,
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import type { LanguageItem } from "@/lib/i18n/language-catalog";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendHealthy: boolean | null;
  onOpenWellnessFlow?: () => void;
  onOpenCBT: () => void;
  onOpenPranayama: () => void;
  onOpenHistory: () => void;
  onOpenCrisis: () => void;
  onShareApp: () => void;
  isCopied: boolean;
  onInstallClick: () => void;
  isAppInstalled: boolean;
  currentLanguage: LanguageItem;
  onLanguageChange: (lang: LanguageItem, isAuto: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = React.memo(({
  isOpen,
  onClose,
  isBackendHealthy,
  onOpenWellnessFlow,
  onOpenCBT,
  onOpenPranayama,
  onOpenHistory,
  onOpenCrisis,
  onShareApp,
  isCopied,
  onInstallClick,
  isAppInstalled,
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-over Content */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 270 }}
            className="relative w-72 max-w-[85vw] h-full bg-slate-950/95 border-r border-slate-800/90 backdrop-blur-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl"
          >
            <div className="space-y-6">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                    🌿
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-base text-slate-100 tracking-tight leading-tight">
                      Emotional Intelligence Healer
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 font-medium font-mono">
                        {isBackendHealthy ? "Keyless Engine Online" : "Connecting..."}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Action Buttons */}
              <nav className="space-y-2">
                {onOpenWellnessFlow && (
                  <button
                    data-testid="mobile-open-wellness-flow-btn"
                    onClick={() => {
                      onClose();
                      onOpenWellnessFlow();
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent border border-emerald-500/40 text-emerald-300 font-bold transition-all shadow-sm"
                  >
                    <span className="text-base">✨</span>
                    <span className="text-sm tracking-wide">
                      4-Phase Guided Flow
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 ml-auto">
                      VOICE
                    </span>
                  </button>
                )}

                <Link
                  href="/library"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <BookOpen className="w-5 h-5 shrink-0 text-teal-400" />
                  <span className="text-sm font-medium tracking-wide">
                    Clinical Library
                  </span>
                </Link>

                <a
                  href="#clinical-guide"
                  onClick={() => {
                    onClose();
                    document.getElementById("clinical-guide")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <Compass className="w-5 h-5 shrink-0 text-amber-400" />
                  <span className="text-sm font-medium tracking-wide">
                    Clinical Guide
                  </span>
                </a>

                <button
                  onClick={() => {
                    onClose();
                    onOpenCBT();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <Brain className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span className="text-sm font-medium tracking-wide">
                    CBT Protocols (20+)
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenPranayama();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <Wind className="w-5 h-5 shrink-0 text-cyan-400" />
                  <span className="text-sm font-medium tracking-wide">
                    Somatic Breathwork
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span className="text-sm font-medium tracking-wide">
                    Zero-Log Privacy
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenCrisis();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 transition-all duration-200"
                >
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                  <span className="text-sm font-medium tracking-wide">
                    Crisis Helplines
                  </span>
                </button>

                {/* App Utilities Divider */}
                <div className="pt-2 pb-1">
                  <div className="h-[1px] bg-slate-800/80 w-full" />
                </div>

                {/* Share Sanctuary Link */}
                <button
                  onClick={onShareApp}
                  className="flex items-center justify-between w-full p-3 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">
                      {isCopied ? "Link Copied!" : "Share Sanctuary"}
                    </span>
                  </div>
                  {isCopied && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </span>
                  )}
                </button>

                {/* PWA Install Link */}
                <button
                  onClick={() => {
                    onClose();
                    onInstallClick();
                  }}
                  className="flex items-center justify-between w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium">
                      {isAppInstalled ? "App Installed" : "Install App"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
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

            {/* Bottom Section */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <LanguageSelector
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
              />
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
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
        </div>
      )}
    </AnimatePresence>
  );
});
MobileNav.displayName = "MobileNav";

export default MobileNav;
