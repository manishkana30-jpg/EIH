"use client";

import React, { useState, useMemo } from "react";
import {
  GITA_LIBRARY,
  GitaShlokaItem,
  GitaCategory,
  searchGitaLibrary,
} from "@/lib/knowledge/gita-library";
import { GitaShlokaCard } from "./GitaShlokaCard";

interface GitaLibraryViewProps {
  onSelectVerse?: (item: GitaShlokaItem) => void;
  className?: string;
}

const CATEGORY_TABS: { id: GitaCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "anxiety_fear", label: "Anxiety & Fear" },
  { id: "burnout_action", label: "Burnout & Action" },
  { id: "clarity_focus", label: "Clarity & Focus" },
  { id: "grief_loss", label: "Grief & Loss" },
];

const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
];

const QUICK_EMOTION_CHIPS: { label: string; query: string }[] = [
  { label: "#Equanimity", query: "equanimity" },
  { label: "#Fear & Threat", query: "fear" },
  { label: "#Burnout & Fatigue", query: "burnout" },
  { label: "#Restless Mind", query: "restless" },
  { label: "#Grief & Heartbreak", query: "grief" },
  { label: "#Anger Surge", query: "anger" },
  { label: "#Comparison", query: "comparison" },
  { label: "#Self-Mastery", query: "mastery" },
];

/**
 * 100% Text-Only Bhagavad Gita Cognitive Therapy & Psychological Wisdom Library.
 * 
 * Clinical Text Architecture:
 * - Pure typographic layout (slate & amber Tailwind tokens)
 * - Zero visual/image assets: no <img>, no picture cards, no SVG illustrations
 * - Instant real-time text search by keyword, emotion, or chapter number
 * - Plain-text category tabs (All, Anxiety & Fear, Burnout & Action, Clarity & Focus, Grief & Loss)
 * - Pure semantic text cards with Devanagari serif, Roman IAST, translations, somatic mappings, and cognitive tags
 */
export const GitaLibraryView: React.FC<GitaLibraryViewProps> = ({
  onSelectVerse,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GitaCategory>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  // Real-time search & filter
  const filteredShlokas = useMemo(() => {
    return searchGitaLibrary(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: GITA_LIBRARY.length,
      anxiety_fear: 0,
      burnout_action: 0,
      clarity_focus: 0,
      grief_loss: 0,
    };
    GITA_LIBRARY.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  }, []);

  return (
    <section className={`w-full text-slate-100 space-y-6 ${className}`}>
      {/* Editorial Text Header */}
      <header className="space-y-3 pb-6 border-b border-amber-500/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs uppercase tracking-wider">
            <span>[Clinical Cognitive Archive]</span>
            <span className="text-slate-500">•</span>
            <span>{GITA_LIBRARY.length} Text-Only Anchors</span>
          </div>

          {/* Language Selector (Plain Text) */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">Language:</span>
            <div className="inline-flex items-center bg-slate-900 border border-amber-500/30 rounded p-0.5">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    selectedLanguage === lang.code
                      ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lang.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 tracking-tight">
          Bhagavad Gita Cognitive Psychology Library
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Pure semantic text-only repository of Vedantic cognitive anchors mapped to contemporary
          neuropsychology, polyvagal down-regulation, and Sattvavajaya Chikitsa. Each card delivers
          Sanskrit Devanagari in readable serif, Romanized IAST, clinical somatic mapping, and cognitive reframing.
        </p>
      </header>

      {/* Real-Time Instant Search & Text Filtering Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, emotion, or chapter number (e.g., 'BG 2.48', 'fear', 'burnout', 'anger', 'detachment')..."
              className="w-full px-4 py-3 bg-slate-950 border border-amber-500/25 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans text-sm shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-mono text-slate-400 hover:text-amber-300"
              >
                [Clear]
              </button>
            )}
          </div>
        </div>

        {/* Plain-Text Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
          {CATEGORY_TABS.map((tab) => {
            const count = categoryCounts[tab.id] ?? 0;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2 rounded-t-lg text-xs font-mono whitespace-nowrap transition-all border-b-2 ${
                  isSelected
                    ? "border-amber-400 text-amber-300 bg-amber-500/10 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                {tab.label} <span className="text-[10px] text-slate-500">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Emotion & Cognitive Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mr-1">
            Quick Filter:
          </span>
          {QUICK_EMOTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setSearchQuery(chip.query)}
              className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 text-[11px] font-mono transition-colors"
            >
              {chip.label}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-mono text-amber-400 hover:underline ml-1"
            >
              Reset Query
            </button>
          )}
        </div>
      </div>

      {/* Results Count & Active Status */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
        <span>
          Showing <strong className="text-amber-300">{filteredShlokas.length}</strong> of{" "}
          {GITA_LIBRARY.length} verses
        </span>
        {searchQuery && (
          <span className="text-amber-400/90">
            Filtered by: &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Verse Grid: 100% Pure Semantic Text Cards */}
      {filteredShlokas.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-amber-500/20 bg-slate-950/60 space-y-3">
          <p className="font-mono text-sm text-slate-400">
            No verses found matching &ldquo;{searchQuery}&rdquo; in category &ldquo;{selectedCategory}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="text-xs font-mono px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          >
            [Reset Search Filters]
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredShlokas.map((item) => (
            <GitaShlokaCard
              key={item.id}
              item={item}
              languageCode={selectedLanguage}
              onSelect={onSelectVerse}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default GitaLibraryView;
