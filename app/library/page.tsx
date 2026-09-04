"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PSYCHOLOGY_LIBRARY,
  PsychologyCondition,
  CLINICAL_BREATHWORK_PACERS,
  BreathCadence,
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

  // Modal States
  const [activePacerCondition, setActivePacerCondition] = useState<PsychologyCondition | null>(null);
  const [activeSomaticCondition, setActiveSomaticCondition] = useState<PsychologyCondition | null>(null);

  // Breathwork Pacer Engine State
  const [pacerPhase, setPacerPhase] = useState<"inhale" | "hold" | "exhale" | "pause">("inhale");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const [pacerCycleCount, setPacerCycleCount] = useState<number>(0);
  const [isPacerRunning, setIsPacerRunning] = useState<boolean>(true);

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

  const openBreathworkModal = (condition: PsychologyCondition) => {
    setActivePacerCondition(condition);
    const cadence = CLINICAL_BREATHWORK_PACERS[condition.id] || {
      name: "Coherent Diaphragmatic Breath",
      inhale: 4,
      hold: 2,
      exhale: 5,
      pause: 1,
      description: "Standard parasympathetic coherence breathing.",
    };
    setPacerPhase("inhale");
    setSecondsRemaining(cadence.inhale);
    setPacerCycleCount(0);
    setIsPacerRunning(true);
  };

  const openSomaticModal = (condition: PsychologyCondition) => {
    setActiveSomaticCondition(condition);
  };

  // Breathwork Pacer Timer Loop
  useEffect(() => {
    if (!activePacerCondition || !isPacerRunning) return;

    const cadence: BreathCadence = CLINICAL_BREATHWORK_PACERS[activePacerCondition.id] || {
      name: "Coherent Diaphragmatic Breath",
      inhale: 4,
      hold: 2,
      exhale: 5,
      pause: 1,
      description: "Standard parasympathetic coherence breathing.",
    };

    const interval = setInterval(() => {
      setSecondsRemaining((prevSec) => {
        if (prevSec > 1) {
          return prevSec - 1;
        }

        // Transition to next phase
        if (pacerPhase === "inhale") {
          if (cadence.hold > 0) {
            setPacerPhase("hold");
            return cadence.hold;
          } else {
            setPacerPhase("exhale");
            return cadence.exhale;
          }
        } else if (pacerPhase === "hold") {
          setPacerPhase("exhale");
          return cadence.exhale;
        } else if (pacerPhase === "exhale") {
          if (cadence.pause > 0) {
            setPacerPhase("pause");
            return cadence.pause;
          } else {
            setPacerPhase("inhale");
            setPacerCycleCount((c) => c + 1);
            return cadence.inhale;
          }
        } else {
          // pause -> inhale
          setPacerPhase("inhale");
          setPacerCycleCount((c) => c + 1);
          return cadence.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePacerCondition, isPacerRunning, pacerPhase]);

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
              <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Clinical Knowledge (20 Conditions)</span>
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
              Evidence-Based CBT, Polyvagal Theory & Sattvavajaya Chikitsa
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Clinical & Psychoeducational Library
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-400 leading-relaxed">
              Explore 20 peer-reviewed neuropsychological condition maps, cognitive trap reframings, interactive pranayama breathwork pacers, and somatic grounding anchors.
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
                placeholder="Search 20 conditions (e.g., anxiety, ghabrahat, ocd, burnout, chronic pain)..."
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
                  {cat === "all" ? `All (${PSYCHOLOGY_LIBRARY.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Quick Search:</span>
            {[
              { label: "GAD & Worry", term: "worry" },
              { label: "Intrusive Thoughts (OCD)", term: "intrusive" },
              { label: "Burnout", term: "burnout" },
              { label: "Caregiver Strain", term: "caregiver" },
              { label: "Toxic Shame", term: "shame" },
              { label: "Chronic Pain", term: "pain" },
              { label: "Hindi (Ghabrahat)", term: "ghabrahat" },
            ].map((pill) => (
              <button
                key={pill.term}
                onClick={() => setSearchQuery(pill.term)}
                className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 text-slate-400 hover:text-teal-300 text-[11px] transition-colors"
              >
                {pill.label}
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
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 min-h-[120px] flex flex-col justify-between">
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
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                  Polyvagal Sensory Grounding
                                </span>
                                <button
                                  onClick={() => openSomaticModal(condition)}
                                  className="text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                                >
                                  <span>Guide Me</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {condition.solutions.somatic_anchor}
                              </p>
                            </div>
                          )}
                          {activeTab === "pranayama" && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                  Sattvavajaya Vagal Brake Protocol
                                </span>
                                <button
                                  onClick={() => openBreathworkModal(condition)}
                                  className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse"
                                >
                                  <span>▶ Launch Visual Pacer</span>
                                </button>
                              </div>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openBreathworkModal(condition)}
                            title="Interactive Breathwork"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
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
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Interactive Breathwork Pacer Modal */}
      {activePacerCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Ambient Background Pulse */}
            <div
              className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
                pacerPhase === "inhale"
                  ? "bg-teal-500/10"
                  : pacerPhase === "hold"
                  ? "bg-indigo-500/10"
                  : pacerPhase === "exhale"
                  ? "bg-emerald-500/10"
                  : "bg-slate-500/10"
              }`}
            />

            {/* Close Button */}
            <button
              onClick={() => setActivePacerCondition(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800/40 mb-2">
              Pranayama Vagal Pacer
            </span>
            <h3 className="text-xl font-bold text-white mb-1">
              {CLINICAL_BREATHWORK_PACERS[activePacerCondition.id]?.name || "Coherent Pranayama"}
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              {CLINICAL_BREATHWORK_PACERS[activePacerCondition.id]?.description || activePacerCondition.solutions.pranayama}
            </p>

            {/* Visual Breathing Ring */}
            <div className="relative w-56 h-56 flex items-center justify-center my-4">
              {/* Pulsing Animated Circle */}
              <div
                className={`absolute inset-0 rounded-full border-4 transition-all ease-in-out ${
                  pacerPhase === "inhale"
                    ? "scale-100 border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.4)]"
                    : pacerPhase === "hold"
                    ? "scale-100 border-indigo-400 shadow-[0_0_40px_rgba(129,140,248,0.4)]"
                    : pacerPhase === "exhale"
                    ? "scale-75 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                    : "scale-75 border-slate-500 opacity-60"
                }`}
                style={{
                  transitionDuration: `${secondsRemaining}s`,
                }}
              />

              {/* Inner Circle Glow */}
              <div
                className={`w-40 h-40 rounded-full flex flex-col items-center justify-center bg-slate-950/90 border border-slate-800 transition-colors ${
                  pacerPhase === "inhale"
                    ? "text-teal-300"
                    : pacerPhase === "hold"
                    ? "text-indigo-300"
                    : pacerPhase === "exhale"
                    ? "text-emerald-300"
                    : "text-slate-400"
                }`}
              >
                <span className="text-3xl font-extrabold font-mono tracking-tight">
                  {secondsRemaining}s
                </span>
                <span className="text-xs font-bold uppercase tracking-widest mt-1">
                  {pacerPhase === "inhale"
                    ? "Inhale Gently"
                    : pacerPhase === "hold"
                    ? "Hold Still"
                    : pacerPhase === "exhale"
                    ? "Smooth Exhale"
                    : "Gentle Pause"}
                </span>
              </div>
            </div>

            {/* Cycle Counter & Controls */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs text-slate-400">
                Completed Cycles: <strong className="text-white font-mono">{pacerCycleCount}</strong>
              </span>
              <button
                onClick={() => setIsPacerRunning(!isPacerRunning)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {isPacerRunning ? "Pause" : "Resume"}
              </button>
            </div>

            <button
              onClick={() => {
                setActivePacerCondition(null);
                handleStartSessionWithCondition(activePacerCondition);
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-semibold text-xs transition-colors"
            >
              Continue to Sanctuary Session with this Cadence →
            </button>
          </div>
        </div>
      )}

      {/* Interactive Somatic Grounding Modal */}
      {activeSomaticCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setActiveSomaticCondition(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/40 mb-2 inline-block">
              Somatic Anchor Protocol
            </span>
            <h3 className="text-xl font-bold text-white mb-2">{activeSomaticCondition.name}</h3>
            <p className="text-xs text-slate-400 mb-6">
              Follow this step-by-step physical anchor to disengage amygdala threat arousal and re-anchor into safety.
            </p>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/20 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Physiological Instruction</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {activeSomaticCondition.solutions.somatic_anchor}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveSomaticCondition(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  const cond = activeSomaticCondition;
                  setActiveSomaticCondition(null);
                  handleStartSessionWithCondition(cond);
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-semibold text-xs transition-colors"
              >
                Open in Session →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
