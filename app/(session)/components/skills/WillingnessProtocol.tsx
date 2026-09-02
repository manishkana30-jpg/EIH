'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Heart } from 'lucide-react';

interface WillingnessProtocolProps {
  onComplete?: () => void;
}

export const WillingnessProtocol: React.FC<WillingnessProtocolProps> = ({ onComplete }) => {
  const TOTAL_SECONDS = 90;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsFinished(true);
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, onComplete]);

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setSecondsRemaining(TOTAL_SECONDS);
  };

  const progress = ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-5 text-center text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              90-Second Willingness Protocol
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Neurochemical emotion half-life processing (ACT)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          90s Timer
        </span>
      </div>

      {/* Pulsing Ring Container */}
      <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
        {/* Ambient Pulsing Background Ring */}
        <div
          className={`absolute inset-0 rounded-full bg-[#588e73]/10 border border-[#588e73]/20 transition-transform duration-1000 ${
            isActive ? 'animate-pulse scale-105' : 'scale-100'
          }`}
        />

        {/* SVG Progress Ring */}
        <svg className="w-44 h-44 transform -rotate-90">
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#283c32"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#81a890"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          {isFinished ? (
            <div className="flex flex-col items-center animate-fade-in text-[var(--accent-sage)]">
              <CheckCircle2 className="w-8 h-8 mb-1 stroke-[2.5]" />
              <span className="text-xs font-bold font-heading">Wave Processed</span>
            </div>
          ) : (
            <>
              <span className="text-3xl font-heading font-extrabold text-[var(--text-nature-primary)] tracking-tight">
                {secondsRemaining}s
              </span>
              <span className="text-[10px] font-mono text-[var(--text-nature-secondary)] uppercase tracking-wider mt-0.5">
                {isActive ? 'In Sensation' : 'Ready'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Prompts */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-[var(--text-nature-primary)] italic">
          &ldquo;Notice the sensation. Drop the story. Just feel it.&rdquo;
        </p>
        <p className="text-[11px] text-[var(--text-nature-muted)] leading-relaxed max-w-xs mx-auto">
          Adrenaline naturally metabolizes in under 90 seconds when you refrain from re-triggering thoughts.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all"
          title="Reset 90s Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (isFinished) handleReset();
            setIsActive(!isActive);
          }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#588e73] hover:bg-[#81a890] text-[#0c1410] font-bold text-xs shadow-glow transition-all"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{isFinished ? 'Restart Protocol' : 'Begin 90s Wave'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WillingnessProtocol;
