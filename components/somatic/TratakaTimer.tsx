"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export interface TratakaStage {
  id: number;
  name: string;
  sanskritName: string;
  durationSeconds: number;
  instruction: string;
  neuroMechanism: string;
}

export const DEFAULT_TRATAKA_STAGES: TratakaStage[] = [
  {
    id: 1,
    name: "Alignment & Postural Stillness",
    sanskritName: "Sthira Asana",
    durationSeconds: 45,
    instruction: "Sit upright with your spine elongated. Align your gaze directly level with the focal anchor.",
    neuroMechanism: "Proprioceptive stabilization calms vestibular motor oscillations.",
  },
  {
    id: 2,
    name: "Steady Unblinking Gazing",
    sanskritName: "Bahiranga Trātaka",
    durationSeconds: 120,
    instruction: "Fix your gaze upon the focal center without blinking. Allow involuntary tears to naturally cleanse your eyes.",
    neuroMechanism: "Inhibition of micro-saccadic eye movements downregulates amygdala hyperarousal.",
  },
  {
    id: 3,
    name: "Internal Visualization",
    sanskritName: "Antaranga Trātaka (Chidakasha)",
    durationSeconds: 90,
    instruction: "Gently close your eyes. Observe the after-image glowing within your mind's inner space (eyebrow center).",
    neuroMechanism: "Transitions cortical brainwave activity from Beta stress to Alpha coherence.",
  },
  {
    id: 4,
    name: "Palming & Thermal Absorption",
    sanskritName: "Netra Sparsha",
    durationSeconds: 45,
    instruction: "Vigorously rub your palms together until warm. Cup your warm palms softly over your closed eyes.",
    neuroMechanism: "Thermal stimulation and darkness activate the parasympathetic oculocardiac reflex.",
  },
  {
    id: 5,
    name: "Ventral Vagal Integration",
    sanskritName: "Shanti Samanvaya",
    durationSeconds: 60,
    instruction: "Slowly release your hands, take three deep physiological sighs, and open your eyes with broad peripheral vision.",
    neuroMechanism: "Stabilizes autonomic tone in the social engagement (Ventral Vagal) state.",
  },
];

export interface TratakaTimerProps {
  stages?: TratakaStage[];
  onComplete?: () => void;
  className?: string;
}

export const TratakaTimer: React.FC<TratakaTimerProps> = ({
  stages = DEFAULT_TRATAKA_STAGES,
  onComplete,
  className = "",
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(stages[0].durationSeconds);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionFinished, setSessionFinished] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentStage = stages[currentStageIdx] || stages[0];
  const totalStageSeconds = currentStage.durationSeconds;
  const progressPercent = ((totalStageSeconds - secondsRemaining) / totalStageSeconds) * 100;

  // Beep sound cue for stage transition using Web Audio API
  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528Hz Solfeggio Love/Healing tone
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (_) {}
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      playChime();
      if (currentStageIdx < stages.length - 1) {
        const nextIdx = currentStageIdx + 1;
        setCurrentStageIdx(nextIdx);
        setSecondsRemaining(stages[nextIdx].durationSeconds);
      } else {
        setIsActive(false);
        setSessionFinished(true);
        onComplete?.();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, currentStageIdx, stages, onComplete]);

  const toggleTimer = () => {
    if (sessionFinished) {
      resetTimer();
      setIsActive(true);
      return;
    }
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setCurrentStageIdx(0);
    setSecondsRemaining(stages[0].durationSeconds);
    setSessionFinished(false);
  };

  const jumpToStage = (idx: number) => {
    setIsActive(false);
    setCurrentStageIdx(idx);
    setSecondsRemaining(stages[idx].durationSeconds);
    setSessionFinished(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl backdrop-blur-xl text-zinc-100 max-w-xl mx-auto ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              5-Stage Trātaka Gazing Engine
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Stage {currentStageIdx + 1} of {stages.length} • {currentStage.sanskritName}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500/50"
          title={soundEnabled ? "Mute Chime" : "Enable Chime"}
          aria-label={soundEnabled ? "Mute Chime" : "Enable Chime"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Stage Progression Pills */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStageIdx || sessionFinished;
          const isCurrent = idx === currentStageIdx && !sessionFinished;
          return (
            <button
              key={stage.id}
              onClick={() => jumpToStage(idx)}
              className={`py-2 px-1 text-center rounded-lg border transition-all min-h-[44px] flex flex-col items-center justify-center ${
                isCurrent
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-zinc-900/60 border-zinc-800/60 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">{`S${idx + 1}`}</span>
              <span className="text-[9px] truncate max-w-full font-sans opacity-80">{stage.sanskritName.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Circular Timer Display */}
      <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="text-zinc-800"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="text-amber-500 transition-all duration-1000 ease-linear"
            strokeWidth="6"
            strokeDasharray={263.89}
            strokeDashoffset={263.89 - (263.89 * progressPercent) / 100}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {sessionFinished ? (
            <div className="space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <span className="text-xs font-semibold text-emerald-300">Harmonized</span>
            </div>
          ) : (
            <>
              <span className="text-3xl font-mono font-bold text-zinc-100 tracking-tight">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[11px] text-amber-400/90 uppercase tracking-widest font-sans font-medium mt-1">
                {currentStage.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Instruction Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 my-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Stage Instruction:</span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed pl-5">
          {sessionFinished
            ? "Session Complete. Your ocular motor system is stilled, and vagal tone is anchored."
            : currentStage.instruction}
        </p>
        <div className="pt-2 border-t border-zinc-800/60 pl-5">
          <p className="text-xs text-zinc-400 italic">
            <span className="text-zinc-500 font-semibold not-italic">Neuro-Ocular Mechanism: </span>
            {currentStage.neuroMechanism}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={resetTimer}
          className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500/50"
          title="Reset Protocol"
          aria-label="Reset Protocol"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all min-h-[48px] flex items-center gap-2.5 shadow-lg ${
            isActive
              ? "bg-amber-500/20 border border-amber-500 text-amber-300 hover:bg-amber-500/30"
              : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          } focus-visible:ring-2 focus-visible:ring-amber-500/50`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Gazing</span>
            </>
          ) : sessionFinished ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Restart Protocol</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Begin Trātaka</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TratakaTimer;
