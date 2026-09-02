'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Wind, Heart, Sparkles, Activity } from 'lucide-react';

interface SomaticBreathworkGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BreathingTechnique {
  id: string;
  name: string;
  category: string;
  targetState: string;
  polyvagalMechanism: string;
  pattern: {
    inhale: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  };
  instruction: string;
}

const TECHNIQUES: BreathingTechnique[] = [
  {
    id: '478_vagal',
    name: '4-7-8 Vagal Brake Breath',
    category: 'Parasympathetic Activation',
    targetState: 'Acute Anxiety & Sympathetic Panic',
    polyvagalMechanism: 'Prolonged 8s exhalation activates the ventral vagal brake, reducing heart rate and amygdala reactivity.',
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    instruction: 'Inhale quietly through your nose for 4s, hold gently for 7s, exhale completely through mouth with a gentle whoosh for 8s.',
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing (4-4-4-4)',
    category: 'Autonomic Equilibrium',
    targetState: 'Mental Overload & Emotional Dysregulation',
    polyvagalMechanism: 'Equalized respiratory intervals balance sympathetic arousal with parasympathetic stability.',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    instruction: 'Inhale 4s, hold full lungs 4s, exhale smoothly 4s, hold empty lungs 4s. Keep rhythm steady.',
  },
  {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    category: 'Rapid De-Escalation',
    targetState: 'Acute Distress & Hyperventilation',
    polyvagalMechanism: 'Double-inhalation re-inflates collapsed alveoli, triggering immediate baroreceptor calming.',
    pattern: { inhale: 4, holdIn: 1, exhale: 6, holdOut: 0 },
    instruction: 'Take a deep inhale through nose, top it off with a quick second inhale, then release a long, slow audible sigh.',
  },
  {
    id: 'coherent_breathing',
    name: 'Coherent 5.5s Resonant Breath',
    category: 'Heart Rate Variability (HRV)',
    targetState: 'Chronic Stress & Brain Fog',
    polyvagalMechanism: '5.5 breaths per minute synchronizes respiratory sinus arrhythmia with cardiovascular rhythms.',
    pattern: { inhale: 5, holdIn: 0, exhale: 6, holdOut: 0 },
    instruction: 'Breathe smoothly in and out through your nose in continuous, relaxed waves with no pauses.',
  },
];

export const PranayamaGuide: React.FC<SomaticBreathworkGuideProps> = ({ isOpen, onClose }) => {
  const [selectedTech, setSelectedTech] = useState<BreathingTechnique>(TECHNIQUES[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [countdown, setCountdown] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) return;

    let currentPhase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest' = 'Inhale';
    let timeLeft = selectedTech.pattern.inhale;
    setPhase('Inhale');
    setCountdown(timeLeft);

    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) {
        if (currentPhase === 'Inhale') {
          if (selectedTech.pattern.holdIn > 0) {
            currentPhase = 'Hold';
            timeLeft = selectedTech.pattern.holdIn;
          } else {
            currentPhase = 'Exhale';
            timeLeft = selectedTech.pattern.exhale;
          }
        } else if (currentPhase === 'Hold') {
          currentPhase = 'Exhale';
          timeLeft = selectedTech.pattern.exhale;
        } else if (currentPhase === 'Exhale') {
          if (selectedTech.pattern.holdOut > 0) {
            currentPhase = 'Rest';
            timeLeft = selectedTech.pattern.holdOut;
          } else {
            currentPhase = 'Inhale';
            timeLeft = selectedTech.pattern.inhale;
            setCycleCount((c) => c + 1);
          }
        } else if (currentPhase === 'Rest') {
          currentPhase = 'Inhale';
          timeLeft = selectedTech.pattern.inhale;
          setCycleCount((c) => c + 1);
        }
        setPhase(currentPhase);
      }
      setCountdown(Math.max(0, timeLeft));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, selectedTech]);

  if (!isOpen) return null;

  const getScaleClass = () => {
    if (!isRunning) return 'scale-100 opacity-60';
    if (phase === 'Inhale') return 'scale-125 opacity-100 transition-transform duration-1000 ease-out';
    if (phase === 'Hold') return 'scale-125 opacity-90 transition-none';
    if (phase === 'Exhale') return 'scale-90 opacity-60 transition-transform duration-1000 ease-in';
    return 'scale-90 opacity-40 transition-none';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#14201a] rounded-3xl p-6 md:p-8 shadow-2xl border border-[#283c32] text-[var(--text-nature-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#283c32] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 text-[var(--accent-sage)]">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-[var(--text-nature-primary)]">
                Somatic Breathwork &amp; Vagal Stabilizer
              </h2>
              <p className="text-xs text-[var(--text-nature-secondary)]">
                Clinical Neuro-Respiratory Autonomic Regulation Coach
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsRunning(false);
              onClose();
            }}
            className="p-2 rounded-xl text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technique Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {TECHNIQUES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => {
                setSelectedTech(tech);
                setIsRunning(false);
                setPhase('Inhale');
                setCountdown(tech.pattern.inhale);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedTech.id === tech.id
                  ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)] shadow-glow'
                  : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
              }`}
            >
              <div className="text-xs font-bold text-[var(--text-nature-primary)] mb-0.5">{tech.name}</div>
              <div className="text-[10px] text-[var(--accent-sage)] font-mono">{tech.category}</div>
            </button>
          ))}
        </div>

        {/* Dynamic Breathing Orb */}
        <div className="relative w-full h-56 flex flex-col items-center justify-center rounded-3xl bg-[#101a15] border border-[#283c32] mb-6 overflow-hidden">
          {/* Animated Glow Ring */}
          <div
            className={`w-36 h-36 rounded-full border-4 border-[#81a890]/50 bg-[#588e73]/20 flex items-center justify-center shadow-glow transition-all duration-700 ${getScaleClass()}`}
          >
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--accent-sage)] block">
                {phase}
              </span>
              <span className="text-3xl font-heading font-extrabold text-[var(--text-nature-primary)]">
                {countdown}s
              </span>
            </div>
          </div>

          <div className="absolute bottom-3 text-center px-4">
            <p className="text-[11px] text-[var(--text-nature-secondary)] italic">{selectedTech.instruction}</p>
          </div>
        </div>

        {/* Autonomic & Vagal Effect Details */}
        <div className="p-4 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32] mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-nature-muted)]">Target State:</span>
            <span className="font-semibold text-[var(--accent-sage)]">{selectedTech.targetState}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-nature-muted)]">Polyvagal Mechanism:</span>
            <span className="font-medium text-[var(--text-nature-secondary)] text-right text-[11px] max-w-[65%]">
              {selectedTech.polyvagalMechanism}
            </span>
          </div>
        </div>

        {/* Play / Pause Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[var(--text-nature-muted)] font-mono">
            Completed Cycles: <span className="text-[var(--accent-sage)] font-bold">{cycleCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsRunning(false);
                setCountdown(selectedTech.pattern.inhale);
                setPhase('Inhale');
                setCycleCount(0);
              }}
              className="p-2.5 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] transition-all"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#588e73] hover:bg-[#81a890] text-[#0c1410] font-bold text-xs shadow-glow transition-all"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause Breath' : 'Begin Paced Breath'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PranayamaGuide;
