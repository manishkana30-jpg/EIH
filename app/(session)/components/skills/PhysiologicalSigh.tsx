'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Wind, CheckCircle2 } from 'lucide-react';

interface PhysiologicalSighProps {
  rounds?: number;
  onComplete?: () => void;
}

export const PhysiologicalSigh: React.FC<PhysiologicalSighProps> = ({
  rounds = 3,
  onComplete,
}) => {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phaseIndex, setPhaseIndex] = useState<number>(0); // 0: Inhale (2500ms), 1: Top-off (1000ms), 2: Exhale (6000ms)
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const PHASES = [
    { name: 'Inhale', duration: 2500, instruction: 'Deep inhale through your nose' },
    { name: 'Top-Off', duration: 1000, instruction: 'Quick second inhale to fill lungs completely' },
    { name: 'Exhale', duration: 6000, instruction: 'Slow, unhurried exhale through pursed lips' },
  ];

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isActive && !isFinished) {
      timer = setTimeout(() => {
        if (phaseIndex === 0) {
          setPhaseIndex(1);
        } else if (phaseIndex === 1) {
          setPhaseIndex(2);
        } else {
          // Completed an exhale
          if (currentRound >= rounds) {
            setIsActive(false);
            setIsFinished(true);
            if (onComplete) onComplete();
          } else {
            setCurrentRound((r) => r + 1);
            setPhaseIndex(0);
          }
        }
      }, currentPhase.duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, isFinished, phaseIndex, currentRound, rounds, currentPhase.duration, onComplete]);

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setCurrentRound(1);
    setPhaseIndex(0);
  };

  // Determine scale class for expanding / contracting circle
  const getCircleTransform = () => {
    if (!isActive) return 'scale-100';
    if (phaseIndex === 0) return 'scale-125 duration-[2500ms]';
    if (phaseIndex === 1) return 'scale-140 duration-[1000ms]';
    if (phaseIndex === 2) return 'scale-90 duration-[6000ms]';
    return 'scale-100';
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-5 text-center text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Physiological Sigh Pacemaker
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Rapid alveolar reinflation &amp; vagal brake activation
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          Round {currentRound} of {rounds}
        </span>
      </div>

      {/* Circle Breathing Visualizer */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center overflow-hidden">
        {/* Outer subtle boundary */}
        <div className="absolute w-44 h-44 rounded-full border border-[#283c32]" />

        {/* Dynamic Expanding/Contracting Circle (No text inside during animation) */}
        <div
          className={`w-28 h-28 rounded-full border-2 border-[#81a890] bg-[#588e73]/20 shadow-glow transition-transform ease-in-out ${getCircleTransform()}`}
        />

        {/* Finished Overlay */}
        {isFinished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1b2a23]/80 rounded-full animate-fade-in text-[var(--accent-sage)]">
            <CheckCircle2 className="w-8 h-8 mb-1 stroke-[2.5]" />
            <span className="text-xs font-bold font-heading">Vagal Brake Active</span>
          </div>
        )}
      </div>

      {/* Phase Instruction Text */}
      <div className="space-y-1 min-h-[44px]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-sage)] font-mono">
          {isActive ? currentPhase.name : isFinished ? 'Completed' : 'Ready'}
        </div>
        <p className="text-xs text-[var(--text-nature-secondary)] italic">
          {isActive ? currentPhase.instruction : isFinished ? 'Notice the immediate reduction in heart rate and tension.' : 'Press Begin to start the 3-phase biological reset.'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all"
          title="Reset Sigh Pacemaker"
          aria-label="Reset Pacemaker"
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
              <span>{isFinished ? 'Restart Sigh' : 'Begin Sigh'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PhysiologicalSigh;
