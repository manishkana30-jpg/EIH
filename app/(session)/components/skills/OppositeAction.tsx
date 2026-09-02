'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';

interface UrgeAction {
  id: string;
  urge: string;
  emoji: string;
  oppositeAction: string;
  instruction: string;
}

const URGE_ACTIONS: UrgeAction[] = [
  {
    id: 'withdraw',
    urge: 'Withdraw / Hide in Bed',
    emoji: '🛌',
    oppositeAction: 'Stand Up & Open Curtains',
    instruction: 'Stand upright, open a window or curtains, and look at the furthest visible point outside for 2 minutes.',
  },
  {
    id: 'avoid',
    urge: 'Avoid / Procrastinate',
    emoji: '🙈',
    oppositeAction: 'Engage for 120 Seconds',
    instruction: 'Open the dreaded task or document and work on it for exactly 2 minutes without expecting perfection.',
  },
  {
    id: 'isolate',
    urge: 'Isolate / Cut Off Connection',
    emoji: '🚪',
    oppositeAction: 'Send a Short Neutral Note',
    instruction: 'Send a simple warm greeting or emoji to a trusted contact or friend right now.',
  },
  {
    id: 'ruminate',
    urge: 'Ruminate / Obsessive Loop',
    emoji: '🌀',
    oppositeAction: 'Engage Sensory Motor Action',
    instruction: 'Splash cold water on your face or do 10 slow wall pushups to ground attention back into sensory reality.',
  },
];

export const OppositeAction: React.FC = () => {
  const [selectedUrge, setSelectedUrge] = useState<UrgeAction>(URGE_ACTIONS[0]);
  const TOTAL_SECONDS = 120;
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
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([100, 50, 100]);
              } catch (_) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining]);

  const handleSelectUrge = (action: UrgeAction) => {
    setSelectedUrge(action);
    setIsActive(false);
    setIsFinished(false);
    setSecondsRemaining(TOTAL_SECONDS);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setSecondsRemaining(TOTAL_SECONDS);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Behavioral Opposite Action Launcher
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Break emotional inertia with 2-minute counter-action (DBT)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          2m Timer
        </span>
      </div>

      {/* Urge Selection Chips */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[var(--text-nature-secondary)]">
          Select what your distress is urging you to do:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {URGE_ACTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectUrge(item)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2 ${
                selectedUrge.id === item.id
                  ? 'bg-[#22382c] border-[#81a890] text-[var(--text-nature-primary)] shadow-glow ring-1 ring-[#81a890]/30'
                  : 'bg-[#14201a] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="truncate">{item.urge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Opposite Micro-Action Card */}
      <div className="p-3.5 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-[var(--accent-sage)]">
            Prescribed Opposite Action:
          </span>
          <span className="text-sm font-bold font-heading text-[var(--text-nature-primary)]">
            {formatTime(secondsRemaining)}
          </span>
        </div>
        <h4 className="text-xs font-bold text-[var(--text-nature-primary)]">
          {selectedUrge.oppositeAction}
        </h4>
        <p className="text-[11px] text-[var(--text-nature-secondary)] leading-relaxed">
          {selectedUrge.instruction}
        </p>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all"
          title="Reset Timer"
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
              <span>Pause Timer</span>
            </>
          ) : isFinished ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Restart 2m Action</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start 2-Minute Action</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OppositeAction;
