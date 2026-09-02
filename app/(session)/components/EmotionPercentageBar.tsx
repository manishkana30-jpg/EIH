'use client';

import React, { useState } from 'react';
import { COWEN_27_DIMENSIONS } from '@/lib/types/emotions';
import { ChevronUp, ChevronDown, ExternalLink, Sparkles, Layers } from 'lucide-react';

export interface EmotionItem {
  label: string;
  score: number;
  emoji: string;
}

export interface EmotionPercentageBarProps {
  emotions?: EmotionItem[];
  dominantEmotion?: string;
  onSelectEmotion?: (emotionName: string) => void;
  onEmotionClick?: (label: string) => void;
  isVisible?: boolean;
}

const DIMENSION_EMOJIS: Record<string, string> = {
  admiration: '🌟',
  adoration: '💖',
  aesthetic_appreciation: '🎨',
  amusement: '😄',
  anger: '🔥',
  anxiety: '😟',
  awe: '🌌',
  awkwardness: '😬',
  boredom: '🥱',
  calmness: '🌿',
  confusion: '❓',
  craving: '🍫',
  disgust: '🤢',
  empathic_pain: '💔',
  entrancement: '✨',
  excitement: '⚡',
  fear: '😨',
  horror: '😱',
  interest: '🔍',
  joy: '☀️',
  nostalgia: '📻',
  relief: '🌊',
  romance: '🌹',
  sadness: '😔',
  satisfaction: '🍵',
  sexual_desire: '🔥',
  surprise: '😲',
};

export const EmotionPercentageBar: React.FC<EmotionPercentageBarProps> = ({
  emotions = [],
  dominantEmotion = 'Calmness',
  onSelectEmotion,
  onEmotionClick,
  isVisible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!isVisible) return null;

  // Build full 27 dimensions list with live updated scores
  const all27Emotions = COWEN_27_DIMENSIONS.map((dim) => {
    const liveMatch = emotions.find(
      (e) => e.label.toLowerCase() === dim.name.toLowerCase() || e.label.toLowerCase() === dim.id.toLowerCase()
    );

    let score = liveMatch ? liveMatch.score : 12;
    if (!liveMatch) {
      if (dim.name.toLowerCase() === dominantEmotion.toLowerCase()) {
        score = 78;
      }
    }

    const emoji = liveMatch?.emoji || DIMENSION_EMOJIS[dim.id] || '🌿';

    return {
      id: dim.id,
      name: dim.name,
      emoji,
      score: Math.min(100, Math.max(1, Math.round(score))),
      cluster: dim.cluster,
      color: dim.color,
    };
  }).sort((a, b) => b.score - a.score);

  // Top 3 dominant emotions
  const top3 = all27Emotions.slice(0, 3);

  const handlePillClick = (label: string) => {
    if (onEmotionClick) {
      onEmotionClick(label);
    } else if (onSelectEmotion) {
      onSelectEmotion(label);
    }
  };

  return (
    <div className="w-full relative z-30 animate-fade-in select-none">
      {/* Top 3 Dock Container */}
      <div className="bg-[#0b0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 md:p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Top 3 Emotion Pills */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-white/50 mr-1 hidden sm:flex">
            <Sparkles className="w-3 h-3 text-[#00f59b]" />
            <span>27-D Affect:</span>
          </div>

          {top3.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handlePillClick(emotion.name)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141a22] hover:bg-[#1a2430] border border-white/10 hover:border-[#00f59b]/50 text-xs font-medium text-white/90 transition-all duration-200 shadow-sm"
              title={`Click to explore ${emotion.name} in conversation`}
              aria-label={`Emotion ${emotion.name} confidence ${emotion.score} percent`}
            >
              <span className="text-[11px]">{emotion.emoji}</span>
              <span className="truncate max-w-[90px] md:max-w-[120px]">{emotion.name}</span>
              <span
                className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#0b0e14] border border-white/10 text-[#00f59b] transition-all duration-200"
              >
                {emotion.score}%
              </span>
            </button>
          ))}
        </div>

        {/* Right: Expand All 27 & Deep Insights */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Drawer Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#141a22] hover:bg-[#1a2430] border border-white/10 text-xs font-medium text-white/70 hover:text-white transition-all"
            aria-expanded={isExpanded}
            aria-label="Toggle all 27 emotion dimensions"
          >
            <Layers className="w-3 h-3 text-[#00f59b]" />
            <span className="hidden sm:inline">All 27</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

          {/* Deep Insights Report Link (Opens in New Tab) */}
          <a
            href="/analytics/session-report"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#588e73]/20 hover:bg-[#588e73]/30 border border-[#588e73]/40 text-xs font-bold text-[var(--accent-sage)] hover:text-[var(--text-nature-primary)] transition-all"
            title="Open comprehensive neuro-report in new tab"
          >
            <span className="hidden sm:inline">Deep Insights</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Expandable Drawer: All 27 Dimensions */}
      {isExpanded && (
        <div className="mt-2 p-3.5 rounded-2xl bg-[#101a15]/95 backdrop-blur-2xl border border-[#283c32] shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#283c32] text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
              <span className="font-bold text-[var(--text-nature-primary)]">
                Cowen &amp; Keltner 27 Continuous Emotion Spectrum
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-nature-muted)]">
              Ranked by Real-Time Neural Intensity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {all27Emotions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handlePillClick(item.name);
                  setIsExpanded(false);
                }}
                className="p-2 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] hover:border-[#3d584a] text-left transition-all relative overflow-hidden group"
              >
                {/* Horizontal Progress Bar Underlay */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#588e73]/15 rounded-xl transition-all duration-200"
                  style={{ width: `${item.score}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs">{item.emoji}</span>
                    <span className="text-[11px] font-medium text-[var(--text-nature-primary)] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-sage)] shrink-0">
                    {item.score}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionPercentageBar;
