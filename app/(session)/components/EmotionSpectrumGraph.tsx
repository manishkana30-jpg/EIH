'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, BarChart3, Layers, Sparkles, Compass, HeartHandshake } from 'lucide-react';
import { NeuroscienceDiagnosticResult, emotionClassifier } from '@/lib/knowledge/emotion-classifier';
import neuroscienceData from '@/lib/knowledge/modern-neuroscience-ontology.json';
import { getResearchedAdviceForEmotion, AuthenticatedStudy } from '@/lib/knowledge/authenticated-research-bank';

interface EmotionSpectrumGraphProps {
  activeDiagnostic: NeuroscienceDiagnosticResult;
  onSelectDimension: (diag: NeuroscienceDiagnosticResult) => void;
  messagesCount?: number;
  history?: Array<{ role: string; text: string; diagnostic?: NeuroscienceDiagnosticResult }>;
}

interface EmotionTimelinePoint {
  turnIndex: number;
  topDimension: string;
  color: string;
  scores: Record<string, number>;
}

export const EmotionSpectrumGraph: React.FC<EmotionSpectrumGraphProps> = ({
  activeDiagnostic,
  onSelectDimension,
  messagesCount = 0,
  history = [],
}) => {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'timeline' | 'all27'>('spectrum');
  const [timelineHistory, setTimelineHistory] = useState<EmotionTimelinePoint[]>([]);
  const dimensions = neuroscienceData.cowen_dimensions;
  // Authenticated peer-reviewed clinical research study for active emotion
  const researchedStudy = useMemo(() => {
    return getResearchedAdviceForEmotion(activeDiagnostic.dimensionId, activeDiagnostic.doshicState);
  }, [activeDiagnostic.dimensionId, activeDiagnostic.doshicState]);

  const [showResearchDetails, setShowResearchDetails] = useState(false);

  // Track conversation turns for the live trend line graph
  useEffect(() => {
    const scores = activeDiagnostic.dimensionScores || {};
    const newPoint: EmotionTimelinePoint = {
      turnIndex: timelineHistory.length + 1,
      topDimension: activeDiagnostic.dimensionName,
      color: activeDiagnostic.color || '#38bdf8',
      scores: { ...scores },
    };

    setTimelineHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-12); // Keep last 12 turns for a clean line graph
    });
  }, [activeDiagnostic.dimensionId, activeDiagnostic.intensity, messagesCount]);

  // Top active emotions sorted by current intensity score
  const sortedEmotions = useMemo(() => {
    const scores = activeDiagnostic.dimensionScores || {};
    return [...dimensions]
      .map((dim) => {
        let score = scores[dim.id] || 0.1;
        if (dim.id === activeDiagnostic.dimensionId) {
          score = activeDiagnostic.intensity === 'peak' ? 0.95 : activeDiagnostic.intensity === 'mild' ? 0.70 : 0.85;
        } else if (activeDiagnostic.semanticNeighbors?.includes(dim.name)) {
          score = Math.max(score, 0.45);
        }
        return {
          ...dim,
          currentScore: Math.min(1.0, Math.max(0.05, score)),
          percentage: Math.round(Math.min(1.0, Math.max(0.05, score)) * 100),
          isActive: dim.id === activeDiagnostic.dimensionId,
          isNeighbor: activeDiagnostic.semanticNeighbors?.includes(dim.name),
        };
      })
      .sort((a, b) => b.currentScore - a.currentScore);
  }, [activeDiagnostic, dimensions]);

  // Grouped by 4 primary psychological clusters for "All 27" view
  const clusters = useMemo(() => {
    const map: Record<string, typeof sortedEmotions> = {};
    sortedEmotions.forEach((e) => {
      const c = e.cluster || 'Other';
      if (!map[c]) map[c] = [];
      map[c].push(e);
    });
    return map;
  }, [sortedEmotions]);

  // Key tracked emotion lines for the trajectory graph (e.g. Sadness, Anxiety, Anger, Joy, Calmness)
  const trackedLineKeys = [
    { id: 'sadness', name: 'Sadness', color: '#60a5fa' },
    { id: 'anxiety', name: 'Anxiety', color: '#fb923c' },
    { id: 'anger', name: 'Anger', color: '#f87171' },
    { id: 'joy', name: 'Joy', color: '#facc15' },
    { id: 'calmness', name: 'Calmness', color: '#34d399' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between glass-panel rounded-3xl p-4 md:p-6 border border-slate-800/90 shadow-2xl space-y-4 select-none">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-glow transition-all duration-500"
            style={{
              backgroundColor: `${activeDiagnostic.color}20`,
              borderColor: `${activeDiagnostic.color}60`,
              color: activeDiagnostic.color || '#38bdf8',
            }}
          >
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-heading font-bold text-slate-100">
                Live Emotion Spectrum Graph
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border animate-pulse"
                style={{
                  backgroundColor: `${activeDiagnostic.color}20`,
                  borderColor: `${activeDiagnostic.color}50`,
                  color: activeDiagnostic.color || '#38bdf8',
                }}
              >
                {activeDiagnostic.dimensionName} ({activeDiagnostic.intensity})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Continuous 27-D Real-Time Intensity &amp; Trajectory
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-200 border border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveTab('spectrum')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'spectrum'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Intensity</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trajectory</span>
          </button>

          <button
            onClick={() => setActiveTab('all27')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'all27'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All 27</span>
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col justify-start min-h-[360px] max-h-[460px] overflow-y-auto pr-1">
        {/* TAB 1: Real-Time Dynamic Intensity Bars */}
        {activeTab === 'spectrum' && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>Emotion Dimension</span>
              <span>Live Level &amp; Surge</span>
            </div>

            <div className="space-y-2.5">
              {sortedEmotions.slice(0, 7).map((emotion) => {
                const isSelected = emotion.isActive;
                return (
                  <div
                    key={emotion.id}
                    onClick={() => {
                      const diag = emotionClassifier.getDimensionById(emotion.id, activeDiagnostic.intensity);
                      onSelectDimension(diag);
                    }}
                    className={`p-3 rounded-2xl border transition-all duration-500 cursor-pointer ${
                      isSelected
                        ? 'bg-surface-200/95 border-sky-400/80 shadow-lg ring-1 ring-sky-400/30'
                        : 'bg-surface-100 hover:bg-surface-50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: emotion.color,
                            boxShadow: isSelected ? `0 0 10px ${emotion.color}` : undefined,
                          }}
                        />
                        <span
                          className={`text-xs sm:text-sm font-heading ${
                            isSelected ? 'font-bold text-white' : 'font-medium text-slate-300'
                          }`}
                        >
                          {emotion.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 animate-pulse">
                            Surging
                          </span>
                        )}
                      </div>

                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: isSelected ? '#ffffff' : emotion.color }}
                      >
                        {emotion.percentage}%
                      </span>
                    </div>

                    {/* Animated Intensity Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-900/80 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${emotion.percentage}%`,
                          backgroundColor: emotion.color,
                          boxShadow: isSelected ? `0 0 12px ${emotion.color}` : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Live Turn-by-Turn Trajectory Line Graph */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 animate-fade-in flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Emotion Fluctuations Across Turns</span>
              <span className="text-emerald-400 font-bold">● Live Tracking</span>
            </div>

            {/* SVG Line Graph */}
            <div className="relative w-full h-[220px] bg-slate-950/60 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between">
              {/* Grid Lines */}
              <div className="absolute inset-x-3 inset-y-3 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-slate-400 w-full h-0" />
                <div className="border-b border-slate-400 w-full h-0" />
                <div className="border-b border-slate-400 w-full h-0" />
                <div className="border-b border-slate-400 w-full h-0" />
              </div>

              {/* Multi-Line Plot */}
              <svg viewBox="0 0 400 180" className="w-full h-full overflow-visible">
                {trackedLineKeys.map((tracked) => {
                  const points = timelineHistory.map((pt, idx) => {
                    const totalPts = Math.max(2, timelineHistory.length);
                    const x = (idx / (totalPts - 1)) * 380 + 10;
                    let val = pt.scores[tracked.id] || 0.1;
                    if (pt.topDimension.toLowerCase() === tracked.id) {
                      val = 0.85;
                    }
                    const y = 160 - val * 140;
                    return `${x},${y}`;
                  });

                  if (points.length === 0) return null;

                  const polylinePoints = points.length === 1 ? `10,${160 - 0.1 * 140} 390,${160 - 0.1 * 140}` : points.join(' ');
                  const isTopActive = activeDiagnostic.dimensionId === tracked.id;

                  return (
                    <g key={tracked.id}>
                      <polyline
                        fill="none"
                        stroke={tracked.color}
                        strokeWidth={isTopActive ? 3.5 : 1.8}
                        strokeOpacity={isTopActive ? 1.0 : 0.6}
                        points={polylinePoints}
                        className="transition-all duration-500"
                        style={{
                          filter: isTopActive ? `drop-shadow(0 0 6px ${tracked.color})` : undefined,
                        }}
                      />
                      {/* Current Turn Head Circle */}
                      {points.length > 0 && (
                        <circle
                          cx={Number(points[points.length - 1].split(',')[0])}
                          cy={Number(points[points.length - 1].split(',')[1])}
                          r={isTopActive ? 5 : 3.5}
                          fill={tracked.color}
                          stroke="#ffffff"
                          strokeWidth={isTopActive ? 2 : 1}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
                <span>Start</span>
                <span>Conversation Turns ➔</span>
                <span>Current</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {trackedLineKeys.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-xs font-mono">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={activeDiagnostic.dimensionId === item.id ? 'text-white font-bold' : 'text-slate-400'}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: All 27 Dimensions Grouped by Cluster */}
        {activeTab === 'all27' && (
          <div className="space-y-4 animate-fade-in">
            {Object.entries(clusters).map(([clusterName, emotionList]) => (
              <div key={clusterName} className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-1">
                  {clusterName} ({emotionList.length})
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {emotionList.map((emotion) => {
                    const isSelected = emotion.isActive;
                    return (
                      <button
                        key={emotion.id}
                        onClick={() => {
                          const diag = emotionClassifier.getDimensionById(emotion.id, activeDiagnostic.intensity);
                          onSelectDimension(diag);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-surface-200 border-sky-400 text-white shadow-md'
                            : 'bg-surface-100 hover:bg-surface-50 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: emotion.color }}
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {emotion.percentage}%
                          </span>
                        </div>
                        <span className="text-xs font-heading font-semibold truncate">
                          {emotion.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dual-Pathway Somatic & Doshic Remedies HUD */}
      <div className="p-3.5 rounded-2xl bg-surface-200/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Somatic &amp; Doshic Remedies
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-100 border border-slate-700 text-amber-300">
            {activeDiagnostic.doshicState || 'Ventral Vagal Safe / High Sattva'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Scientific Remedy */}
          <div className="p-2.5 rounded-xl bg-surface-100/80 border border-sky-500/20 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <span>🔬 Scientific Action</span>
            </span>
            <p className="text-[11px] text-slate-200 leading-snug">
              {activeDiagnostic.scientificRemedy || 'Gratitude anchoring, prosocial connection'}
            </p>
          </div>

          {/* Ayurvedic Remedy */}
          <div className="p-2.5 rounded-xl bg-surface-100/80 border border-emerald-500/20 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <span>🕉️ Ayurvedic Action</span>
            </span>
            <p className="text-[11px] text-slate-200 leading-snug">
              {activeDiagnostic.ayurvedicRemedy || 'Cultivating Shanta Rasa, spiritual journaling'}
            </p>
          </div>
        </div>

        {/* Authenticated Research Evidence Card */}
        {researchedStudy && (
          <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  PubMed &amp; Wikipedia Grounded Clinical Advice
                </span>
              </div>
              <button
                onClick={() => setShowResearchDetails(!showResearchDetails)}
                className="text-[10px] font-mono text-sky-400 hover:text-sky-200 underline cursor-pointer"
              >
                {showResearchDetails ? 'Hide Mechanism' : 'View Clinical Study'}
              </button>
            </div>

            <div className="font-medium text-slate-200 text-[11px] leading-tight">
              {researchedStudy.title}
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              📚 <span className="text-slate-300">{researchedStudy.citation}</span> ({researchedStudy.evidenceStrength})
            </div>

            {showResearchDetails && (
              <div className="pt-2 border-t border-sky-900/60 text-[10px] text-slate-300 space-y-1">
                <div>
                  <strong className="text-sky-300">Neurobiological Mechanism: </strong>
                  {researchedStudy.neurobiologicalMechanism}
                </div>
                <div>
                  <strong className="text-emerald-300">Ayurvedic Action: </strong>
                  {researchedStudy.ayurvedicMechanism}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permutation & Combination Chips */}
        {activeDiagnostic.remedyPermutations && activeDiagnostic.remedyPermutations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">Permutations:</span>
            {activeDiagnostic.remedyPermutations.map((perm, idx) => (
              <span
                key={idx}
                className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-surface-100 border border-slate-700/80 text-slate-300 font-mono"
              >
                {perm}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info / Grounding Metric */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-500">Construct:</span>
          <span className="text-slate-300 font-medium truncate max-w-[220px]">
            {activeDiagnostic.barrettConstruct || 'Constructed Affective State'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
          Auto-Calibrated
        </span>
      </div>
    </div>
  );
};

export default EmotionSpectrumGraph;
