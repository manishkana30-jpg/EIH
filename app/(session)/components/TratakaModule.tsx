'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Eye,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Heart,
  Brain,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { browserSpeechController } from '@/lib/audio/browser-speech';

export interface TratakaModuleProps {
  isOpen: boolean;
  onClose: () => void;
  activeCbtReframe?: string;
  conditionName?: string;
  userLocale?: string;
}

export type TratakaStageId = 1 | 2 | 3 | 4 | 5 | 'complete';

export interface TratakaStageConfig {
  id: TratakaStageId;
  name: string;
  sanskritName: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  subtitle: string;
  clinicalMechanism: string;
}

export const TRATAKA_STAGES: TratakaStageConfig[] = [
  {
    id: 1,
    name: 'Somatic Preparation',
    sanskritName: 'Sthira Sukham Asanam',
    startSec: 0,
    endSec: 60,
    durationSec: 60,
    subtitle: 'Autonomic Down-Regulation & Box Breathing',
    clinicalMechanism:
      '4-4-4-4 Box Breathing stimulates the vagus nerve, reducing autonomic sympathetic tone before intense visual focus.',
  },
  {
    id: 2,
    name: 'Bahiranga Trataka',
    sanskritName: 'External Gazing (The Digital Bindu)',
    startSec: 60,
    endSec: 180,
    durationSec: 120, // STRICT 2-MINUTE DIGITAL SAFETY LIMIT
    subtitle: 'Unblinking Central Focus • Peripheral Inhibition',
    clinicalMechanism:
      'Fixed focal fixation suppresses saccadic eye movements, quietening involuntary cortical rumination and training working memory bandwidth.',
  },
  {
    id: 3,
    name: 'Antaranga Trataka',
    sanskritName: 'Internal Gazing (Chidakasha)',
    startSec: 180,
    endSec: 240,
    durationSec: 60,
    subtitle: 'After-Image Visualization at the Brow Center',
    clinicalMechanism:
      'Harnesses the retinal after-image in complete visual deprivation to dampen Default Mode Network (DMN) overactivity.',
  },
  {
    id: 4,
    name: 'Neuroplastic Emotional Reframing',
    sanskritName: 'Sattvavajaya Cognitive Imprint',
    startSec: 240,
    endSec: 300,
    durationSec: 60,
    subtitle: 'Cognitive Reframe Implantation in Hypnotic Clarity',
    clinicalMechanism:
      'Delivers targeted CBT cognitive restructuring while cortical resistance and analytical hyper-vigilance are suspended.',
  },
  {
    id: 5,
    name: 'Eye Safety & Palming Protocol',
    sanskritName: 'Ushna Sparsha Palming',
    startSec: 300,
    endSec: 330,
    durationSec: 30,
    subtitle: 'Ocular Nerve Restoration & Photoreceptor Reset',
    clinicalMechanism:
      'Thermic palming blocks all light, relaxing ciliary muscles and preventing digital ocular fatigue / Computer Vision Syndrome.',
  },
];

export const TOTAL_TRATAKA_SECONDS = 330; // 5 minutes 30 seconds

/**
 * Pure Web Audio API gentle chime synthesizer (zero external audio file dependency).
 */
function playSolfeggioTone(freq = 528, duration = 3.0) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Warm overtone for harmonic fullness
    const overtone = ctx.createOscillator();
    const overGain = ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    overGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    overGain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.2);
    overGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    overtone.connect(overGain);
    gain.connect(ctx.destination);
    overGain.connect(ctx.destination);

    osc.start();
    overtone.start();
    osc.stop(ctx.currentTime + duration);
    overtone.stop(ctx.currentTime + duration);
  } catch {
    // Gracefully handle any browser audio policy restrictions
  }
}

export const TratakaModule: React.FC<TratakaModuleProps> = ({
  isOpen,
  onClose,
  activeCbtReframe,
  conditionName = 'Working Memory & Attention Restoration',
  userLocale = 'en-US',
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [hasAnnouncedStage4, setHasAnnouncedStage4] = useState(false);
  const [boxBreathStep, setBoxBreathStep] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedStageRef = useRef<number | null>(null);

  const defaultReframe =
    activeCbtReframe ||
    'You are not your racing thoughts; you are the calm, witnessing awareness behind them. Notice how the mind naturally settles into quiet power when anchored in single-pointed focus.';

  // Determine current stage from elapsed seconds
  const currentStageConfig =
    elapsedSec >= TOTAL_TRATAKA_SECONDS
      ? null
      : TRATAKA_STAGES.find((s) => elapsedSec >= s.startSec && elapsedSec < s.endSec) || TRATAKA_STAGES[0];

  const currentStageId = elapsedSec >= TOTAL_TRATAKA_SECONDS ? 'complete' : currentStageConfig?.id || 1;

  // Sound cues on stage transitions
  useEffect(() => {
    if (!isOpen || !isPlaying || !isAudioEnabled) return;

    if (currentStageConfig && lastPlayedStageRef.current !== currentStageConfig.id) {
      lastPlayedStageRef.current = currentStageConfig.id as number;
      if (currentStageConfig.id === 1) playSolfeggioTone(432, 2.5);
      if (currentStageConfig.id === 2) playSolfeggioTone(528, 3.0);
      if (currentStageConfig.id === 3) playSolfeggioTone(639, 3.5); // Internal pitch-black chime
      if (currentStageConfig.id === 4) playSolfeggioTone(741, 2.5);
      if (currentStageConfig.id === 5) playSolfeggioTone(432, 3.0);
    }
  }, [isOpen, isPlaying, isAudioEnabled, currentStageConfig]);

  // Main Session Timeline Timer
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSec(0);
      setIsPlaying(true);
      setHasAnnouncedStage4(false);
      lastPlayedStageRef.current = null;
      browserSpeechController.stop();
      return;
    }

    if (isPlaying && elapsedSec < TOTAL_TRATAKA_SECONDS) {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, elapsedSec]);

  // Box Breathing pacing cycle during Stage 1 (4-4-4-4 cycle = 16s)
  useEffect(() => {
    if (currentStageId !== 1 || !isOpen || !isPlaying) return;
    const cycleSec = elapsedSec % 16;
    if (cycleSec < 4) setBoxBreathStep('inhale');
    else if (cycleSec < 8) setBoxBreathStep('hold-in');
    else if (cycleSec < 12) setBoxBreathStep('exhale');
    else setBoxBreathStep('hold-out');
  }, [currentStageId, elapsedSec, isOpen, isPlaying]);

  // Stage 4: Voice synthesis of the CBT reframe
  useEffect(() => {
    if (currentStageId === 4 && isAudioEnabled && !hasAnnouncedStage4 && isOpen) {
      setHasAnnouncedStage4(true);
      if (userLocale) {
        browserSpeechController.setLanguageLocale(userLocale);
      }
      browserSpeechController.speak(defaultReframe);
    }
  }, [currentStageId, isAudioEnabled, hasAnnouncedStage4, isOpen, defaultReframe, userLocale]);

  // Escape key handler for instantaneous safe force-exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleForceExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleForceExit = useCallback(() => {
    browserSpeechController.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }, [onClose]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    if (isPlaying) {
      browserSpeechController.stop();
    }
  };

  const handleResetSession = () => {
    browserSpeechController.stop();
    setElapsedSec(0);
    setIsPlaying(true);
    setHasAnnouncedStage4(false);
    lastPlayedStageRef.current = null;
  };

  const handleJumpToStage = (stageId: TratakaStageId) => {
    browserSpeechController.stop();
    const target = TRATAKA_STAGES.find((s) => s.id === stageId);
    if (target) {
      setElapsedSec(target.startSec);
      setIsPlaying(true);
      if (stageId !== 4) setHasAnnouncedStage4(false);
    }
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (elapsedSec / TOTAL_TRATAKA_SECONDS) * 100);

  // Stage 2 specific calculations (Strict 2-minute gaze)
  const isStage2 = currentStageId === 2;
  const stage2Elapsed = Math.max(0, elapsedSec - 60);
  const isHypnoticPeripheralActive = isStage2 && stage2Elapsed >= 60; // Fades in at 2:00 (1 min into gazing)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none bg-black text-slate-100 font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Trataka Gazing Session"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / SAFETY CONTROLS HEADER
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 bg-black/80 backdrop-blur-md shrink-0">
        {/* Left: Stage Information */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-100">
                {currentStageConfig ? `Stage ${currentStageConfig.id} of 5: ${currentStageConfig.name}` : 'Protocol Complete'}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 hidden sm:inline">
                {currentStageConfig?.sanskritName || 'Shanti'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {currentStageConfig?.subtitle || 'Session Finished'}
            </span>
          </div>
        </div>

        {/* Center: Live Timer & Visual Stage Pills */}
        <div className="hidden lg:flex flex-col items-center gap-1.5 max-w-xs w-full">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-200">
            <span className="text-amber-400">{formatTimer(elapsedSec)}</span>
            <span className="text-slate-600">/</span>
            <span>{formatTimer(TOTAL_TRATAKA_SECONDS)}</span>
          </div>

          <div className="flex items-center gap-1.5 w-full">
            {TRATAKA_STAGES.map((s) => {
              const isPast = elapsedSec >= s.endSec;
              const isCurrent = elapsedSec >= s.startSec && elapsedSec < s.endSec;
              return (
                <button
                  key={s.id}
                  onClick={() => handleJumpToStage(s.id)}
                  title={`Jump to Stage ${s.id}: ${s.name}`}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    isPast
                      ? 'bg-emerald-500/80'
                      : isCurrent
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Audio Toggle, Pause & FORCE EXIT BUTTON */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              isAudioEnabled
                ? 'bg-white/5 border-white/10 text-slate-300 hover:text-slate-100 hover:bg-white/10'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
            title={isAudioEnabled ? 'Solfeggio Sound Active' : 'Sound Muted'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Pause / Play */}
          {currentStageId !== 'complete' && (
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title={isPlaying ? 'Pause Timer' : 'Resume Timer'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Reset Session */}
          <button
            onClick={handleResetSession}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition-all"
            title="Restart Trataka Protocol from Beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* CRITICAL: FORCE EXIT BUTTON */}
          <button
            onClick={handleForceExit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 hover:border-rose-400 text-rose-200 hover:text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] group"
            title="Safe Force Exit (Press ESC)"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">Exit Trataka</span>
            <kbd className="hidden md:inline-block text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-rose-500/40 text-rose-300">
              ESC
            </kbd>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN IMMERSIVE STAGE CANVAS
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ═════════════════════════════════════════════════════════
              STAGE 1: SOMATIC PREPARATION (0:00 - 1:00)
              Screen dims. Box breathing guidance to down-regulate ANS.
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl w-full flex flex-col items-center text-center space-y-8 z-20"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono tracking-widest text-amber-400 uppercase font-semibold">
                  Phase 1 of 5 • Somatic Alignment
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Prepare Body &amp; Autonomic Balance
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  Sit with a tall, straight spine. Lower your room and screen brightness. Relax your jaw, drop your
                  shoulders, and follow the Box Breathing rhythm below.
                </p>
              </div>

              {/* Smooth Box Breathing Visualizer */}
              <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
                <motion.div
                  animate={{
                    scale: boxBreathStep === 'inhale' ? 1.25 : boxBreathStep === 'exhale' ? 0.85 : 1.15,
                    borderColor:
                      boxBreathStep === 'inhale'
                        ? 'rgba(52, 211, 153, 0.7)'
                        : boxBreathStep === 'hold-in'
                        ? 'rgba(251, 191, 36, 0.7)'
                        : boxBreathStep === 'exhale'
                        ? 'rgba(56, 189, 248, 0.7)'
                        : 'rgba(148, 163, 184, 0.5)',
                  }}
                  transition={{ duration: 3.8, ease: 'easeInOut' }}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-2 border-emerald-400/50 bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                >
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    {boxBreathStep === 'inhale' && 'Inhale (4s)'}
                    {boxBreathStep === 'hold-in' && 'Hold Full (4s)'}
                    {boxBreathStep === 'exhale' && 'Exhale (4s)'}
                    {boxBreathStep === 'hold-out' && 'Hold Empty (4s)'}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-slate-100 capitalize mt-1">
                    {boxBreathStep.replace('-', ' ')}
                  </span>
                </motion.div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 max-w-md text-xs text-slate-400 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-left">
                  <strong>Digital Eye Safety:</strong> Gazing will begin automatically at 1:00 and is strictly limited
                  to 2 minutes to prevent visual strain.
                </span>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STAGE 2: BAHIRANGA TRATAKA - EXTERNAL GAZING (1:00 - 3:00)
              Pure CSS glowing amber Bindu. After 1 min, hypnotic circles fade in.
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20"
            >
              {/* Optional Subtle Hypnotic Circle Background (Fades in at 2:00 at 10% opacity) */}
              <AnimatePresence>
                {isHypnoticPeripheralActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3.0 }}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    <div
                      className="w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] rounded-full overflow-hidden"
                      style={{
                        maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
                      }}
                    >
                      <img
                        src="/hypnotic-circles.png"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover grayscale contrast-[1.2] brightness-125"
                        style={{ animation: 'spin 65s linear infinite' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Central Glowing Digital Bindu (Pure CSS) */}
              <div className="relative flex items-center justify-center">
                {/* Outer radial ambient aura */}
                <div className="absolute w-40 h-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

                {/* Subtle pulsating focus halo */}
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-12 h-12 rounded-full border border-amber-400/40 pointer-events-none"
                />

                {/* Exact Specified Bindu: w-4 h-4 bg-amber-400 rounded-full shadow */}
                <div
                  className="w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_40px_10px_rgba(251,191,36,0.8)] relative z-30"
                  aria-label="The Digital Bindu Focal Point"
                />
              </div>

              {/* Live Instruction Banner at Bottom */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-16 sm:bottom-20 max-w-lg px-6 text-center space-y-2 pointer-events-none z-30"
              >
                <p className="text-xs sm:text-sm font-medium text-amber-200/90 tracking-wide drop-shadow-md">
                  Gaze continuously at the center amber Bindu. Try not to blink. Let your peripheral vision soften.
                  If your eyes water or burn, blink softly.
                </p>
                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    External Gazing Remaining: <strong>{formatTimer(180 - elapsedSec)}</strong> (Strict 2-Min Safe Limit)
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STAGE 3: ANTARANGA TRATAKA - INTERNAL GAZING (3:00 - 4:00)
              Complete visual blackness. Harness optical after-image in Chidakasha.
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 text-center space-y-6 z-20"
            >
              {/* Audio Chime Notification Pulse */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 rounded-full border border-sky-400/20 bg-sky-950/20 flex items-center justify-center text-sky-400 mb-2"
              >
                <Eye className="w-8 h-8 opacity-70" />
              </motion.div>

              <div className="space-y-4 max-w-md">
                <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold">
                  Phase 3 of 5 • Antaranga Trataka
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-snug">
                  Close Your Eyes
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                  Observe the glowing optical after-image floating in the space behind your closed eyelids. Anchor your
                  attention directly in the center of your forehead (Chidakasha).
                </p>
              </div>

              <div className="pt-4 text-xs font-mono text-slate-500">
                Default Mode Network quieting • Retaining inner single-pointedness
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STAGE 4: NEUROPLASTIC COGNITIVE REFRAMING (4:00 - 5:00)
              Screen remains pitch dark. Display active CBT Reframe from RAG.
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 1.0 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 sm:p-12 text-center space-y-8 z-20"
            >
              <div className="max-w-2xl space-y-5">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                    Phase 4 of 5 • Neuroplastic Cognitive Imprint
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Target Condition: <span className="text-slate-200">{conditionName}</span>
                </div>

                {/* The Cognitive Reframe Presentation */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-left space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Evidence-Based Cognitive Reframe</span>
                  </div>
                  <blockquote className="text-base sm:text-xl text-slate-100 font-medium leading-relaxed italic border-l-2 border-emerald-400 pl-4">
                    &ldquo;{defaultReframe}&rdquo;
                  </blockquote>
                </div>

                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  In this state of deep theta focus, your subconscious absorbs this cognitive reframe without
                  analytical resistance. Breathe this perspective into your neuro-circuitry.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STAGE 5: EYE SAFETY & PALMING PROTOCOL (5:00 - 5:30)
              Soft warm ambient light returns. Palming instructions.
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 text-center space-y-8 z-20"
            >
              <div className="max-w-xl space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <Heart className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                    Phase 5 of 5 • Digital Eye Safety &amp; Palming
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                    Warm Palming Recovery
                  </h2>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3 text-left">
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    1. <strong>Rub your palms briskly together</strong> for 10 seconds until they radiate soothing
                    warmth.
                  </p>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    2. <strong>Gently cup your warm palms over closed eyes</strong> without pressing the eyeballs.
                  </p>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    3. <strong>Breathe into the absolute darkness</strong>. Feel the ciliary muscles of your eyes and
                    the optic nerve completely soften and release tension.
                  </p>
                </div>

                <div className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Optical tension neutralizing • Ending session in: {TOTAL_TRATAKA_SECONDS - elapsedSec}s</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STAGE COMPLETE: SESSION SUMMARY & CLEAN RETURN
          ═════════════════════════════════════════════════════════ */}
          {currentStageId === 'complete' && (
            <motion.div
              key="stage-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-lg w-full p-8 rounded-3xl bg-slate-950/90 border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-center space-y-6 z-20"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Trataka Gazing Complete
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You completed the full 5-stage clinical gazing protocol. Your visual cortex has undergone intentional
                  focus training, and the ocular strain has been neutralized with thermic palming.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <span className="text-slate-400 font-mono">Working Memory:</span>
                  <p className="text-emerald-400 font-bold">Sharpened Focus</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <span className="text-slate-400 font-mono">Digital Eye Safety:</span>
                  <p className="text-emerald-400 font-bold">100% Guardrails Met</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleResetSession}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 font-semibold text-xs transition-all"
                >
                  Repeat Protocol
                </button>
                <button
                  onClick={handleForceExit}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Return to Sanctuary
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM TIMELINE SCRUBBER & CLINICAL CITATION FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-50 px-4 sm:px-8 py-3 border-t border-white/10 bg-black/80 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Active Stage Clinical Mechanism Footnote */}
        <div className="flex items-center gap-2 text-xs text-slate-400 max-w-xl truncate">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            {currentStageConfig?.clinicalMechanism ||
              'Clinical Trataka: Neuroplastic attention restoration integrating Hatha Yoga Pradipika with modern ocular saccade dampening.'}
          </span>
        </div>

        {/* Quick Safety Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Eye-Safety Certified (2-Min Max Gaze)</span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default TratakaModule;
