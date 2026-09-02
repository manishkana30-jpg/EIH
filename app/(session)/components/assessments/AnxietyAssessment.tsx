'use client';

import React, { useState } from 'react';
import { ShieldCheck, RotateCcw } from 'lucide-react';

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const OPTIONS = [
  { label: 'Not at all', score: 0 },
  { label: 'Several days', score: 1 },
  { label: 'Over half the days', score: 2 },
  { label: 'Nearly every day', score: 3 },
];

export const AnxietyAssessment: React.FC = () => {
  const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1));
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSelect = (qIndex: number, score: number) => {
    const updated = [...answers];
    updated[qIndex] = score;
    setAnswers(updated);
  };

  const totalScore = answers.reduce((sum, val) => (val >= 0 ? sum + val : sum), 0);
  const isComplete = answers.every((a) => a >= 0);

  const getSeverity = (score: number) => {
    if (score <= 4) return { label: 'Minimal Anxiety', color: 'text-emerald-400', desc: 'Normal baseline response to routine daily life.' };
    if (score <= 9) return { label: 'Mild Anxiety', color: 'text-[var(--accent-sage)]', desc: 'Mild nervousness; benefit from breathwork & somatic pacing.' };
    if (score <= 14) return { label: 'Moderate Anxiety', color: 'text-[var(--accent-amber)]', desc: 'Noticeable tension; CBT reframing and willingness exercises recommended.' };
    return { label: 'Severe Anxiety', color: 'text-rose-400', desc: 'Significant distress; consider speaking with a licensed clinician or therapist.' };
  };

  const handleReset = () => {
    setAnswers(new Array(7).fill(-1));
    setIsSubmitted(false);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              GAD-7 Clinical Anxiety Screener
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Standardized 7-item clinical assessment (Local private scoring)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          Zero-Transmission
        </span>
      </div>

      {!isSubmitted ? (
        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          <p className="text-[11px] text-[var(--text-nature-muted)] italic">
            Over the last 2 weeks, how often have you been bothered by the following problems?
          </p>

          {GAD7_QUESTIONS.map((q, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-2">
              <span className="text-xs font-semibold text-[var(--text-nature-primary)]">
                {idx + 1}. {q}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.score}
                    onClick={() => handleSelect(idx, opt.score)}
                    className={`py-1 px-2 rounded-xl text-[11px] font-medium transition-all ${
                      answers[idx] === opt.score
                        ? 'bg-[#588e73] text-[#0c1410] font-bold shadow-sm'
                        : 'bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-[var(--text-nature-secondary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => setIsSubmitted(true)}
            disabled={!isComplete}
            className="w-full py-2.5 rounded-xl bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-bold text-xs shadow-glow transition-all"
          >
            {isComplete ? 'Calculate Score' : `Answer all questions (${answers.filter((a) => a >= 0).length}/7)`}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Result Card */}
          <div className="p-4 rounded-2xl bg-[#14201a] border border-[#283c32] text-center space-y-2">
            <span className="text-[10px] font-mono text-[var(--text-nature-muted)] uppercase">
              GAD-7 Score: {totalScore} / 21
            </span>
            <div className={`text-xl font-heading font-extrabold ${getSeverity(totalScore).color}`}>
              {getSeverity(totalScore).label}
            </div>
            <p className="text-xs text-[var(--text-nature-secondary)] max-w-sm mx-auto">
              {getSeverity(totalScore).desc}
            </p>
          </div>

          <p className="text-[10px] text-[var(--text-nature-muted)] text-center">
            🔒 Privacy guarantee: This score was calculated purely client-side in volatile memory and is never transmitted to any external server.
          </p>

          <button
            onClick={handleReset}
            className="w-full py-2 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-xs font-semibold text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AnxietyAssessment;
