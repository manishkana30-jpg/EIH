'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Brain, RefreshCw } from 'lucide-react';

export const CognitiveFusion: React.FC = () => {
  const [inputThought, setInputThought] = useState<string>('');
  const [defusedThought, setDefusedThought] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleTransform = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputThought.trim()) return;

    setIsAnimating(true);
    setTimeout(() => {
      let cleaned = inputThought.trim();
      cleaned = cleaned.replace(/^(i think that|i feel that|i am having the thought that)\s*/i, '');
      setDefusedThought(`I am having the thought that ${cleaned}`);
      setIsAnimating(false);
    }, 200);
  };

  const handleReset = () => {
    setInputThought('');
    setDefusedThought(null);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Cognitive Defusion Transformer
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Disentangle identity from temporary cognitive events (ACT)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          Defusion
        </span>
      </div>

      {!defusedThought ? (
        <form onSubmit={handleTransform} className="space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-nature-secondary)]">
            Enter an overwhelming or critical thought:
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputThought}
              onChange={(e) => setInputThought(e.target.value)}
              placeholder="e.g. I am going to fail everything / Nobody respects me..."
              className="w-full bg-[#14201a] border border-[#283c32] focus:border-[#81a890] rounded-2xl px-4 py-2.5 text-xs text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!inputThought.trim()}
            className="w-full py-2.5 rounded-xl bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Defuse Thought</span>
          </button>
        </form>
      ) : (
        <div className={`space-y-4 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
          {/* Before & After comparison */}
          <div className="p-3.5 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-2.5">
            <div>
              <span className="text-[10px] uppercase font-mono text-[var(--text-nature-muted)]">
                Fused Identity Belief:
              </span>
              <p className="text-xs text-[var(--text-nature-muted)] line-through decoration-[#c48b71]">
                &ldquo;{inputThought}&rdquo;
              </p>
            </div>

            <div className="pt-2 border-t border-[#283c32]/60">
              <span className="text-[10px] uppercase font-mono text-[var(--accent-sage)]">
                Defused Cognitive Event:
              </span>
              <p className="text-sm font-medium text-[var(--text-nature-secondary)] italic mt-0.5">
                &ldquo;{defusedThought}&rdquo;
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-nature-muted)] leading-relaxed">
            By shifting from <em>&ldquo;I am X&rdquo;</em> to <em>&ldquo;I am noticing the thought that X&rdquo;</em>, you create the psychological distance required to choose your actions freely.
          </p>

          <button
            onClick={handleReset}
            className="w-full py-2 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-xs font-semibold text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Another Thought</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CognitiveFusion;
