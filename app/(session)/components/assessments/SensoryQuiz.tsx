'use client';

import React, { useState } from 'react';
import { Eye, Headphones, Hand, RotateCcw, Sparkles } from 'lucide-react';

interface SensoryQuestion {
  q: string;
  visual: string;
  auditory: string;
  kinesthetic: string;
}

const SENSORY_QUESTIONS: SensoryQuestion[] = [
  {
    q: 'When feeling intensely stressed, what calms you down fastest?',
    visual: 'Dimming the lights and looking at nature / green leaves',
    auditory: 'Listening to rain sounds, soft ambient music, or silence',
    kinesthetic: 'Wrapping in a heavy blanket, holding a warm cup, or stretching',
  },
  {
    q: 'How do you best process emotional events?',
    visual: 'Writing thoughts on paper or drawing diagrams',
    auditory: 'Talking it through aloud or verbalizing feelings',
    kinesthetic: 'Walking, pacing, or changing physical environments',
  },
  {
    q: 'What triggers sensory overwhelm most easily for you?',
    visual: 'Harsh fluorescent lighting or chaotic clutter',
    auditory: 'Loud sudden noises, overlapping voices, or buzzing',
    kinesthetic: 'Uncomfortable tight clothing or feeling physically trapped',
  },
];

export const SensoryQuiz: React.FC = () => {
  const [answers, setAnswers] = useState<('visual' | 'auditory' | 'kinesthetic')[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const handleChoose = (type: 'visual' | 'auditory' | 'kinesthetic') => {
    const updated = [...answers, type];
    setAnswers(updated);
    if (updated.length === SENSORY_QUESTIONS.length) {
      setIsFinished(true);
    }
  };

  const getDominant = () => {
    const counts = { visual: 0, auditory: 0, kinesthetic: 0 };
    answers.forEach((a) => counts[a]++);
    if (counts.visual >= counts.auditory && counts.visual >= counts.kinesthetic) {
      return {
        type: 'Visual Grounder',
        icon: Eye,
        tip: 'Focus on nature landscapes, dimming screen glare, and visual box-breathing guides.',
      };
    }
    if (counts.auditory >= counts.visual && counts.auditory >= counts.kinesthetic) {
      return {
        type: 'Auditory Grounder',
        icon: Headphones,
        tip: 'Use slow-cadence voice pacing, binaural rain sounds, and vocalized sighing.',
      };
    }
    return {
      type: 'Kinesthetic / Somatic Grounder',
      icon: Hand,
      tip: 'Use ice cubes, weighted blankets, 5-4-3-2-1 physical grounding, and walking movement.',
    };
  };

  const handleReset = () => {
    setAnswers([]);
    setIsFinished(false);
  };

  const currentQIndex = answers.length;
  const currentQ = SENSORY_QUESTIONS[currentQIndex];

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Sensory Regulation Self-Quiz
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Discover your primary somatic de-escalation pathway
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          {isFinished ? 'Complete' : `Q ${currentQIndex + 1}/3`}
        </span>
      </div>

      {!isFinished && currentQ ? (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-[var(--text-nature-primary)]">
            {currentQ.q}
          </span>
          <div className="space-y-2">
            <button
              onClick={() => handleChoose('visual')}
              className="w-full p-3 rounded-2xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-left text-xs text-[var(--text-nature-primary)] flex items-center gap-2.5 transition-all"
            >
              <Eye className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
              <span>{currentQ.visual}</span>
            </button>
            <button
              onClick={() => handleChoose('auditory')}
              className="w-full p-3 rounded-2xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-left text-xs text-[var(--text-nature-primary)] flex items-center gap-2.5 transition-all"
            >
              <Headphones className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
              <span>{currentQ.auditory}</span>
            </button>
            <button
              onClick={() => handleChoose('kinesthetic')}
              className="w-full p-3 rounded-2xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-left text-xs text-[var(--text-nature-primary)] flex items-center gap-2.5 transition-all"
            >
              <Hand className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
              <span>{currentQ.kinesthetic}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {(() => {
            const dominant = getDominant();
            const Icon = dominant.icon;
            return (
              <div className="p-4 rounded-2xl bg-[#14201a] border border-[#283c32] text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)] mx-auto">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-[var(--text-nature-primary)]">
                  Primary Pathway: {dominant.type}
                </div>
                <p className="text-xs text-[var(--text-nature-secondary)] leading-relaxed max-w-sm mx-auto">
                  {dominant.tip}
                </p>
              </div>
            );
          })()}

          <button
            onClick={handleReset}
            className="w-full py-2 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-xs font-semibold text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SensoryQuiz;
