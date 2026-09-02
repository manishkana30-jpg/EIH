'use client';

import React, { useState } from 'react';
import {
  X,
  Zap,
  Activity,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Heart,
  Wind,
  Brain,
  Calendar,
  ShieldCheck,
  Sparkles,
  Target,
  FileText,
} from 'lucide-react';

import clinicalGuidesData from '@/lib/knowledge/clinical-guides.json';

import { WillingnessProtocol } from './skills/WillingnessProtocol';
import { PhysiologicalSigh } from './skills/PhysiologicalSigh';
import { CognitiveFusion } from './skills/CognitiveFusion';
import { OppositeAction } from './skills/OppositeAction';

import { HabitTracker } from './trackers/HabitTracker';
import { EmotionJournal } from './trackers/EmotionJournal';
import { AnxietyAssessment } from './assessments/AnxietyAssessment';
import { SensoryQuiz } from './assessments/SensoryQuiz';
import { LocusOfControl } from './assessments/LocusOfControl';

interface ClinicalGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  bodyMarkdown: string;
  aiTriggerKeywords: string[];
}

interface HealingSkillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCrisisLocator?: () => void;
  initialTab?: 'skills' | 'trackers' | 'guides';
  recommendedGuideId?: string | null;
}

export const HealingSkillsDrawer: React.FC<HealingSkillsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCrisisLocator,
  initialTab = 'skills',
  recommendedGuideId,
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'trackers' | 'guides'>(initialTab);
  const [selectedSkill, setSelectedSkill] = useState<'willingness' | 'sigh' | 'defusion' | 'opposite'>('willingness');
  const [selectedTracker, setSelectedTracker] = useState<'habits' | 'journal' | 'gad7' | 'sensory' | 'locus'>('habits');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(recommendedGuideId || null);

  if (!isOpen) return null;

  const guides: ClinicalGuide[] = clinicalGuidesData as ClinicalGuide[];

  const filteredGuides = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.aiTriggerKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="healing-drawer-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#0c0f16]/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 flex flex-col text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00f59b]/15 border border-[#00f59b]/30 flex items-center justify-center text-[#00f59b] shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="healing-drawer-title" className="text-base md:text-lg font-heading font-bold text-white">
                Clinical Healing Tools &amp; Library
              </h2>
              <p className="text-xs text-white/60">
                Interactive CBT, ACT, Polyvagal Regulation &amp; Reference Guides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Close Healing Tools Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Category Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#08090d] border border-white/10">
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'skills'
                ? 'bg-[#16202c] text-white border border-[#00f59b]/50 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#00f59b]" />
            <span>Interactive</span>
          </button>

          <button
            onClick={() => setActiveTab('trackers')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trackers'
                ? 'bg-[#16202c] text-white border border-[#00f59b]/50 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#00f59b]" />
            <span>Trackers &amp; Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('guides')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guides'
                ? 'bg-[#16202c] text-white border border-[#00f59b]/50 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#00f59b]" />
            <span>Guides ({guides.length})</span>
          </button>
        </div>

        {/* Tab 1: Interactive Clinical Skills */}
        {activeTab === 'skills' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {/* 4 Skill Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => setSelectedSkill('willingness')}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                  selectedSkill === 'willingness'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span className="truncate">Willingness (90s)</span>
              </button>

              <button
                onClick={() => setSelectedSkill('sigh')}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                  selectedSkill === 'sigh'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Wind className="w-4 h-4" />
                <span className="truncate">Physio Sigh</span>
              </button>

              <button
                onClick={() => setSelectedSkill('defusion')}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                  selectedSkill === 'defusion'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="truncate">Defusion</span>
              </button>

              <button
                onClick={() => setSelectedSkill('opposite')}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                  selectedSkill === 'opposite'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="truncate">Opposite Action</span>
              </button>
            </div>

            {/* Active Skill View */}
            {selectedSkill === 'willingness' && <WillingnessProtocol />}
            {selectedSkill === 'sigh' && <PhysiologicalSigh />}
            {selectedSkill === 'defusion' && <CognitiveFusion />}
            {selectedSkill === 'opposite' && <OppositeAction />}
          </div>
        )}

        {/* Tab 2: Trackers & Assessments */}
        {activeTab === 'trackers' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {/* 5 Tracker Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setSelectedTracker('habits')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTracker === 'habits'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Habit Streaks</span>
              </button>

              <button
                onClick={() => setSelectedTracker('journal')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTracker === 'journal'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Emotion Journal</span>
              </button>

              <button
                onClick={() => setSelectedTracker('gad7')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTracker === 'gad7'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GAD-7 Screener</span>
              </button>

              <button
                onClick={() => setSelectedTracker('sensory')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTracker === 'sensory'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sensory Quiz</span>
              </button>

              <button
                onClick={() => setSelectedTracker('locus')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTracker === 'locus'
                    ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-sm'
                    : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Sphere of Control</span>
              </button>
            </div>

            {/* Active Tracker / Assessment View */}
            {selectedTracker === 'habits' && <HabitTracker />}
            {selectedTracker === 'journal' && <EmotionJournal />}
            {selectedTracker === 'gad7' && <AnxietyAssessment />}
            {selectedTracker === 'sensory' && <SensoryQuiz />}
            {selectedTracker === 'locus' && <LocusOfControl />}
          </div>
        )}

        {/* Tab 3: Searchable Clinical Reference Guides */}
        {activeTab === 'guides' && (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-nature-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides by keyword, topic, symptom..."
                className="w-full bg-[#101a15] border border-[#283c32] focus:border-[#81a890] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
              />
            </div>

            {/* Guides List */}
            <div className="space-y-2.5">
              {filteredGuides.map((guide) => {
                const isExpanded = expandedGuideId === guide.id;
                return (
                  <div
                    key={guide.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-[#1b2a23] border-[#81a890] shadow-sm'
                        : 'bg-[#14201a] hover:bg-[#1b2a23]/60 border-[#283c32]'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                      className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[var(--text-nature-primary)]">
                            {guide.title}
                          </h4>
                          <span className="text-[9px] uppercase font-mono px-2 py-0.2 rounded-full bg-[#101a15] border border-[#283c32] text-[var(--accent-sage)]">
                            {guide.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-nature-secondary)] line-clamp-2">
                          {guide.summary}
                        </p>
                      </div>

                      <button
                        className="p-1 text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] shrink-0 mt-0.5"
                        aria-label={isExpanded ? 'Collapse guide' : 'Expand guide'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-[#283c32] text-xs leading-relaxed text-[var(--text-nature-primary)] space-y-3 animate-fade-in font-sans whitespace-pre-line">
                        {guide.bodyMarkdown}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency Mental Health & Local Care Banner */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-300/80">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>In immediate crisis or feeling unsafe?</span>
          </div>
          {onOpenCrisisLocator && (
            <button
              onClick={() => {
                onClose();
                onOpenCrisisLocator();
              }}
              className="px-3 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-200 text-xs font-semibold hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>🚨 Find Local Care &amp; 24/7 Lifelines via GPS →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealingSkillsDrawer;
