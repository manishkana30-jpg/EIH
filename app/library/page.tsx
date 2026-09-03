"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PSYCHOLOGY_LIBRARY,
  PsychologyCondition,
} from "@/lib/knowledge/psychology-library-rag";

export default function PsychologyLibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTriguna, setSelectedTriguna] = useState<string>("all");
  const [activeTabMap, setActiveTabMap] = useState<Record<string, "cbt" | "somatic" | "pranayama" | "habit">>({
    gad: "cbt",
    burnout_fatigue: "cbt",
    panic_dysregulation: "cbt",
  });

  const categories = useMemo(() => {
    const set = new Set(PSYCHOLOGY_LIBRARY.map((c) => c.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredConditions = useMemo(() => {
    return PSYCHOLOGY_LIBRARY.filter((condition) => {
      const matchesCategory =
        selectedCategory === "all" || condition.category === selectedCategory;

      const matchesTriguna =
        selectedTriguna === "all" ||
        condition.triguna_balance.toLowerCase().includes(selectedTriguna.toLowerCase());

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        condition.name.toLowerCase().includes(query) ||
        condition.category.toLowerCase().includes(query) ||
        condition.core_symptoms.some((s) => s.toLowerCase().includes(query)) ||
        condition.cognitive_distortions.some((d) => d.toLowerCase().includes(query)) ||
        condition.solutions.cbt_reframing.toLowerCase().includes(query) ||
        condition.solutions.somatic_anchor.toLowerCase().includes(query) ||
        condition.solutions.pranayama.toLowerCase().includes(query);

      return matchesCategory && matchesTriguna && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedTriguna]);

  const handleSetTab = (conditionId: string, tab: "cbt" | "somatic" | "pranayama" | "habit") => {
    setActiveTabMap((prev) => ({ ...prev, [conditionId]: tab }));
  };

  const handleStartSessionWithCondition = (condition: PsychologyCondition) => {
    router.push(`/?focus=${condition.id}`);
  };

  const getTrigunaBadgeStyle = (triguna: string) => {
    if (triguna.includes("Acute Rajas")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (triguna.includes("High Rajas")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    if (triguna.includes("Tamas")) {
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation & Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Sanctuary Session
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Clinical Knowledge</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/backend-health"
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60 transition-colors"
              >
                System Telemetry
              </Link>
              <Link
                href="/analytics"
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60 transition-colors"
              >
                Emotional Insights
              </Link>
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Verified Clinical & Ayurvedic Ontology
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Clinical & Psychoeducational Library
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-400 leading-relaxed">
              Explore evidence-based neuropsychology, cognitive distortion maps, and ancient Sattvavajaya Chikitsa
              somatic anchors designed for real-time nervous system regulation.
            </p>
          </div>
        </header>

        {/* Search & Filter Controls */}
        <section className="mb-10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conditions, symptoms (worry, racing heart, brain fog), or techniques..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10"
                      : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Triguna Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Triguna State:</span>
            {["all", "Rajas", "Tamas"].map((tri) => (
              <button
                key={tri}
                onClick={() => setSelectedTriguna(tri)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedTriguna === tri
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tri === "all" ? "All Gunas" : tri}
              </button>
            ))}
          </div>
        </section>

        {/* Condition Grid */}
        <main>
          {filteredConditions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/80">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-300">No matching conditions found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search keywords or clearing the category filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedTriguna("all");
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredConditions.map((condition) => {
                const activeTab = activeTabMap[condition.id] || "cbt";

                return (
                  <article
                    key={condition.id}
                    className="flex flex-col bg-slate-900/70 rounded-2xl border border-slate-800/90 hover:border-slate-700/80 transition-all duration-300 shadow-xl overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-4 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/90 to-slate-900/40">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/40">
                          {condition.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${getTrigunaBadgeStyle(
                              condition.triguna_balance
                            )}`}
                          >
                            {condition.triguna_balance}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                            {condition.severity_level}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                        {condition.name}
                      </h2>

                      {/* Core Symptoms */}
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Core Physiological & Cognitive Symptoms
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {condition.core_symptoms.map((symptom, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-950/80 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md"
                            >
                              • {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Cognitive Distortions */}
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Identified Cognitive Traps
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {condition.cognitive_distortions.map((distortion, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-amber-500/10 text-amber-300/90 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-medium"
                            >
                              ⚡ {distortion}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Solutions Matrix Tabs */}
                    <div className="p-6 pt-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center border-b border-slate-800 mb-4 overflow-x-auto">
                          <button
                            onClick={() => handleSetTab(condition.id, "cbt")}
                            className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                              activeTab === "cbt"
                                ? "border-teal-400 text-teal-300"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            🧠 CBT Reframing
                          </button>
                          <button
                            onClick={() => handleSetTab(condition.id, "somatic")}
                            className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                              activeTab === "somatic"
                                ? "border-teal-400 text-teal-300"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            ⚓ Somatic Anchor
                          </button>
                          <button
                            onClick={() => handleSetTab(condition.id, "pranayama")}
                            className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                              activeTab === "pranayama"
                                ? "border-teal-400 text-teal-300"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            🌬️ Pranayama
                          </button>
                          <button
                            onClick={() => handleSetTab(condition.id, "habit")}
                            className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 ${
                              activeTab === "habit"
                                ? "border-teal-400 text-teal-300"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            ⏱️ Micro-Habit
                          </button>
                        </div>

                        {/* Active Tab Content */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 min-h-[110px] flex items-center">
                          {activeTab === "cbt" && (
                            <div>
                              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                                Socratic Reframing Protocol
                              </span>
                              <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
                                &ldquo;{condition.solutions.cbt_reframing}&rdquo;
                              </p>
                            </div>
                          )}
                          {activeTab === "somatic" && (
                            <div>
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                                Polyvagal Sensory Grounding
                              </span>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {condition.solutions.somatic_anchor}
                              </p>
                            </div>
                          )}
                          {activeTab === "pranayama" && (
                            <div>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                Sattvavajaya Vagal Brake Protocol
                              </span>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {condition.solutions.pranayama}
                              </p>
                            </div>
                          )}
                          {activeTab === "habit" && (
                            <div>
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                                Behavioral Boundary & Habit
                              </span>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {condition.solutions.micro_habit}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          RAG Vector ID: <code className="text-slate-400">{condition.id}</code>
                        </span>
                        <button
                          onClick={() => handleStartSessionWithCondition(condition)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 hover:border-teal-500/60 transition-all shadow-sm"
                        >
                          <span>Practice in Sanctuary</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
