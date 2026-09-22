"use client";

import React, { useState } from "react";
import { X, BookOpen, Sparkles } from "lucide-react";
import { GitaLibraryView } from "@/components/gita/GitaLibraryView";
import { GitaShlokaCard } from "@/components/gita/GitaShlokaCard";
import { GITA_LIBRARY, GitaShlokaItem } from "@/lib/knowledge/gita-library";

export interface GitaContemplationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShlokaId?: string;
  userLocale?: string;
}

/**
 * GitaContemplationModal:
 * Dedicated interactive portal for Bhagavad Gita contemplation and spiritual reframing.
 * Provides immediate reflection on prescribed verses and seamless exploration of the cognitive wisdom library.
 */
export const GitaContemplationModal: React.FC<GitaContemplationModalProps> = ({
  isOpen,
  onClose,
  activeShlokaId = "bg_2_47",
  userLocale = "en-US",
}) => {
  const [selectedShloka, setSelectedShloka] = useState<GitaShlokaItem | null>(() => {
    return GITA_LIBRARY.find((item) => item.id === activeShlokaId) || GITA_LIBRARY[0];
  });
  const [activeTab, setActiveTab] = useState<"contemplate" | "explore">("contemplate");

  if (!isOpen) return null;

  const currentItem = selectedShloka || GITA_LIBRARY[0];
  const isHindi = userLocale.startsWith("hi");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bhagavad Gita Cognitive Contemplation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🕉️</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
                <span>{isHindi ? "श्रीमद्भगवद्गीता आत्मिक दर्शन" : "Bhagavad Gita Wisdom & Contemplation"}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Tri-Solution Pillar 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isHindi
                  ? "प्राचीन दार्शनिक समत्व भाव और वर्तमान कर्म योग द्वारा मानसिक शांति"
                  : "Detached present-moment action and philosophical equanimity for autonomic regulation"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("contemplate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "contemplate"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "आत्मिक चिंतन (Contemplation)" : "Active Contemplation"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "explore"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "ज्ञान पुस्तकालय (Explore Library)" : "Explore Wisdom Library"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === "contemplate" ? (
            <div className="space-y-4">
              {/* Prescribed Shloka Card */}
              <GitaShlokaCard item={currentItem} />

              {/* Contemplation Prompt & Integration */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/20 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {isHindi ? "दैनिक जीवन में अभ्यास" : "Daily Svadhyaya & Somatic Integration"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentItem.clinical_reframe || currentItem.philosophical_meaning}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <span className="font-semibold text-emerald-400">
                    {isHindi ? "कर्तव्य कर्म:" : "Actionable Step:"}
                  </span>
                  <span>{currentItem.actionable_guidance?.what_to_do}</span>
                </div>
              </div>
            </div>
          ) : (
            <GitaLibraryView
              onSelectVerse={(verse) => {
                setSelectedShloka(verse);
                setActiveTab("contemplate");
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <span>
            {isHindi ? "त्रिवेणी उपचार: गीता (दृष्टि) + CBT (विचार) + त्राटक (एकाग्रता)" : "Tri-Solution: Gita (Vision) + CBT (Thought) + Tratak (Focus)"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitaContemplationModal;
