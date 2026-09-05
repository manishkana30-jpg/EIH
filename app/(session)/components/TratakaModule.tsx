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
  ArrowRight,
  Flame,
  Layers,
  Sparkle,
  Camera,
  CameraOff,
  RefreshCw,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { browserSpeechController } from '@/lib/audio/browser-speech';

export type TratakaModeId = 'bindu' | 'flame' | 'murti' | 'pratibimb' | 'shoonya';

export interface TratakaModeOption {
  id: TratakaModeId;
  name: string;
  sanskritName: string;
  tagline: string;
  description: string;
  clinicalBenefit: string;
  element: string;
  accentColor: string;
  borderAccent: string;
  bgAccent: string;
}

export const TRATAKA_MODES: TratakaModeOption[] = [
  {
    id: 'bindu',
    name: 'Bindu (The Point)',
    sanskritName: 'बिन्दु • Single-Pointedness',
    tagline: 'Pure Focus, Working Memory & Grounding',
    description: 'A glowing amber radiant point. Halts scattered cognitive rumination and anchors wandering attention into profound prefrontal stillness.',
    clinicalBenefit: 'Reduces cognitive bandwidth overload and trains voluntary ocular fixation.',
    element: 'Prithvi (Earth / Steadiness)',
    accentColor: 'text-amber-400',
    borderAccent: 'border-amber-500/40 hover:border-amber-400',
    bgAccent: 'from-amber-500/15 to-transparent',
  },
  {
    id: 'flame',
    name: 'Jyoti (The Flame)',
    sanskritName: 'ज्योति • Divine Fire',
    tagline: 'Dynamic Concentration & Warmth',
    description: 'A pure flickering teardrop flame. Cultivates internal metabolic fire (Tejas) to dispel emotional heaviness, lethargy, and stagnation.',
    clinicalBenefit: 'Stimulates dopamine activation and counteracts tamasic depressive inertia.',
    element: 'Tejas (Fire / Illumination)',
    accentColor: 'text-orange-400',
    borderAccent: 'border-orange-500/40 hover:border-orange-400',
    bgAccent: 'from-orange-500/15 to-transparent',
  },
  {
    id: 'murti',
    name: 'Murti (Sacred Mandala)',
    sanskritName: 'मण्डल • Sacred Form',
    tagline: 'Visual Anchoring & Neural Coherence',
    description: 'An intricate geometric sacred mandala. Entrains visual cortex harmonics through balanced radial symmetry and floral geometry.',
    clinicalBenefit: 'Promotes alpha-theta brainwave coherence and dampens hyper-analytical stress.',
    element: 'Vayu (Air / Harmonic Motion)',
    accentColor: 'text-emerald-400',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-400',
    bgAccent: 'from-emerald-500/15 to-transparent',
  },
  {
    id: 'pratibimb',
    name: 'Pratibimb (The Reflection)',
    sanskritName: 'प्रतिबिम्ब • Sacred Mirror',
    tagline: 'Self-Compassion & Front Camera Mirror',
    description: 'A live sacred mirror using your front camera. Invites compassionate gaze into your own eyes for emotional validation, self-acceptance, and shame neutralization.',
    clinicalBenefit: 'Activates ventral vagal self-soothing and dismantles harsh internal criticism.',
    element: 'Jala (Water / Fluid Acceptance)',
    accentColor: 'text-cyan-400',
    borderAccent: 'border-cyan-500/40 hover:border-cyan-400',
    bgAccent: 'from-cyan-500/15 to-transparent',
  },
  {
    id: 'shoonya',
    name: 'Shoonya (The Void)',
    sanskritName: 'शून्य • The Unconditioned Void',
    tagline: 'Wide Cosmic Horizon & Boundless Stillness',
    description: 'A pure pitch-black expanse with an expansive, breathing cosmic event horizon. For profound Default Mode Network quieting and formless open-monitoring.',
    clinicalBenefit: 'Maximizes Default Mode Network (DMN) quieting and down-regulates hyperarousal.',
    element: 'Akasha (Ether / Boundless Space)',
    accentColor: 'text-purple-400',
    borderAccent: 'border-purple-500/40 hover:border-purple-400',
    bgAccent: 'from-purple-500/15 to-transparent',
  },
];

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
  const [tratakaMode, setTratakaMode] = useState<TratakaModeId | null>(null);
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

  const activeModeConfig = TRATAKA_MODES.find((m) => m.id === tratakaMode) || TRATAKA_MODES[0];

  // Determine current stage from elapsed seconds
  const currentStageConfig =
    elapsedSec >= TOTAL_TRATAKA_SECONDS
      ? null
      : TRATAKA_STAGES.find((s) => elapsedSec >= s.startSec && elapsedSec < s.endSec) || TRATAKA_STAGES[0];

  const currentStageId = elapsedSec >= TOTAL_TRATAKA_SECONDS ? 'complete' : currentStageConfig?.id || 1;

  // Front Camera MediaStream State for Pratibimb (Self-Reflection Mirror)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraErrorDetail, setCameraErrorDetail] = useState<'blocked' | 'in_use' | 'not_found' | 'insecure' | 'generic'>('generic');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping camera track:', err);
        }
      });
      streamRef.current = null;
    }
    setCameraStream(null);
    setCameraStatus('idle');
    setCameraError(null);
  }, []);

  const requestCamera = useCallback(async () => {
    // Cross-browser getUserMedia detection with vendor prefix support
    const getMedia =
      navigator?.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
      (navigator as any)?.getUserMedia?.bind(navigator) ||
      (navigator as any)?.webkitGetUserMedia?.bind(navigator) ||
      (navigator as any)?.mozGetUserMedia?.bind(navigator);

    if (!getMedia) {
      console.warn('Camera API (getUserMedia) is not supported in this browser environment.');
      setCameraStatus('idle');
      return;
    }

    setCameraStatus('requesting');
    setCameraError(null);

    // Multi-tier constraint fallback ladder:
    // Tier 1: Direct universal constraint - fastest & 100% reliable on all webcams, virtual cams & laptops
    // Tier 2: Front camera with ideal constraints for high-definition reflection
    // Tier 3: Strict user facingMode for mobile devices
    const constraintTiers: MediaStreamConstraints[] = [
      {
        video: true,
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: { facingMode: 'user' },
        audio: false,
      },
    ];

    let capturedStream: MediaStream | null = null;
    let finalError: any = null;

    for (const constraints of constraintTiers) {
      try {
        capturedStream = await getMedia(constraints);
        if (capturedStream) break;
      } catch (err: any) {
        finalError = err;
        console.warn('Camera constraint tier attempt note:', err?.name, err?.message);
      }
    }

    if (capturedStream) {
      streamRef.current = capturedStream;
      setCameraStream(capturedStream);
      setCameraStatus('granted');
      setCameraError(null);
    } else {
      console.warn('Camera acquisition note:', finalError);
      // Keep in clean idle state with direct CTA so user can retry anytime with zero block screens
      setCameraStatus('idle');
      setCameraError(null);
    }
  }, []);

  // Listen to browser permission state changes dynamically
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return;

    let permStatus: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: 'camera' as any })
      .then((status) => {
        permStatus = status;
        if (status.state === 'granted' && tratakaMode === 'pratibimb' && !streamRef.current) {
          requestCamera();
        }
        const handleChange = () => {
          if (status.state === 'granted' && tratakaMode === 'pratibimb' && !streamRef.current) {
            requestCamera();
          }
        };
        status.addEventListener('change', handleChange);
      })
      .catch(() => {
        // Browser may not support querying 'camera'; graceful fallback
      });

    return () => {
      if (permStatus) {
        try {
          permStatus.removeEventListener('change', () => {});
        } catch {}
      }
    };
  }, [tratakaMode, requestCamera]);

  // Auto-request camera when in Pratibimb mode if not yet active
  useEffect(() => {
    if (
      isOpen &&
      tratakaMode === 'pratibimb' &&
      (currentStageId === 1 || currentStageId === 2) &&
      !cameraStream &&
      cameraStatus === 'idle'
    ) {
      requestCamera();
    }
  }, [isOpen, tratakaMode, currentStageId, cameraStream, cameraStatus, requestCamera]);

  // Stop camera when session is closed, mode is not Pratibimb, or Stage 2 has completed (eyes close in Stage 3)
  useEffect(() => {
    if (
      !isOpen ||
      tratakaMode !== 'pratibimb' ||
      currentStageId === 3 ||
      currentStageId === 4 ||
      currentStageId === 5 ||
      currentStageId === 'complete'
    ) {
      stopCamera();
    }
  }, [isOpen, tratakaMode, currentStageId, stopCamera]);

  // When video element mounts and camera stream is active, bind stream and play
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video playback notice:', err);
        });
      }
    }
  }, [cameraStream, tratakaMode, currentStageId]);

  // Clean up all tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Sound cues on stage transitions
  useEffect(() => {
    if (!isOpen || !isPlaying || !isAudioEnabled || tratakaMode === null) return;

    if (currentStageConfig && lastPlayedStageRef.current !== currentStageConfig.id) {
      lastPlayedStageRef.current = currentStageConfig.id as number;
      if (currentStageConfig.id === 1) playSolfeggioTone(432, 2.5);
      if (currentStageConfig.id === 2) playSolfeggioTone(528, 3.0);
      if (currentStageConfig.id === 3) playSolfeggioTone(639, 3.5); // Internal pitch-black chime
      if (currentStageConfig.id === 4) playSolfeggioTone(741, 2.5);
      if (currentStageConfig.id === 5) playSolfeggioTone(432, 3.0);
    }
  }, [isOpen, isPlaying, isAudioEnabled, currentStageConfig, tratakaMode]);

  // Main Session Timeline Timer (Only runs when a mode is selected)
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSec(0);
      setTratakaMode(null);
      setIsPlaying(true);
      setHasAnnouncedStage4(false);
      lastPlayedStageRef.current = null;
      browserSpeechController.stop();
      stopCamera();
      return;
    }

    if (tratakaMode !== null && isPlaying && elapsedSec < TOTAL_TRATAKA_SECONDS) {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, elapsedSec, tratakaMode, stopCamera]);

  // Box Breathing pacing cycle during Stage 1 (4-4-4-4 cycle = 16s)
  useEffect(() => {
    if (tratakaMode === null || currentStageId !== 1 || !isOpen || !isPlaying) return;
    const cycleSec = elapsedSec % 16;
    if (cycleSec < 4) setBoxBreathStep('inhale');
    else if (cycleSec < 8) setBoxBreathStep('hold-in');
    else if (cycleSec < 12) setBoxBreathStep('exhale');
    else setBoxBreathStep('hold-out');
  }, [currentStageId, elapsedSec, isOpen, isPlaying, tratakaMode]);

  // Stage 4: Voice synthesis of the CBT reframe
  useEffect(() => {
    if (tratakaMode !== null && currentStageId === 4 && isAudioEnabled && !hasAnnouncedStage4 && isOpen) {
      setHasAnnouncedStage4(true);
      if (userLocale) {
        browserSpeechController.setLanguageLocale(userLocale);
      }
      browserSpeechController.speak(defaultReframe);
    }
  }, [currentStageId, isAudioEnabled, hasAnnouncedStage4, isOpen, defaultReframe, userLocale, tratakaMode]);

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
    stopCamera();
    browserSpeechController.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }, [onClose, stopCamera]);

  const handleSelectMode = (modeId: TratakaModeId) => {
    setTratakaMode(modeId);
    setHasAnnouncedStage4(false);
    setIsPlaying(true);
    playSolfeggioTone(432, 2.5);

    if (modeId === 'pratibimb') {
      // In Pratibimb (The Reflection), transition immediately to Stage 2 so the Sacred Mirror opens automatically
      setElapsedSec(60);
      lastPlayedStageRef.current = 2;
      requestCamera();
    } else {
      setElapsedSec(0);
      lastPlayedStageRef.current = 1;
      stopCamera();
    }
  };

  const handleChangeMode = () => {
    stopCamera();
    browserSpeechController.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setTratakaMode(null);
    setElapsedSec(0);
    setIsPlaying(true);
    setHasAnnouncedStage4(false);
    lastPlayedStageRef.current = null;
  };

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
    if (tratakaMode === 'pratibimb') {
      requestCamera();
    }
  };

  const handleJumpToStage = (stageId: TratakaStageId) => {
    browserSpeechController.stop();
    const target = TRATAKA_STAGES.find((s) => s.id === stageId);
    if (target) {
      setElapsedSec(target.startSec);
      setIsPlaying(true);
      if (stageId !== 4) setHasAnnouncedStage4(false);
      if (stageId !== 2 && tratakaMode === 'pratibimb') {
        stopCamera();
      } else if (stageId === 2 && tratakaMode === 'pratibimb' && !cameraStream) {
        requestCamera();
      }
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

  if (tratakaMode === null) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col justify-between overflow-y-auto select-none bg-black/95 backdrop-blur-2xl text-slate-100 font-sans p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Select Trataka Gazing Mode"
      >
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10 max-w-5xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Clinical Trataka Gazing
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Ancient Yogic Science
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ancient Sattvavajaya gazing archetypes calibrated for cognitive restoration
              </p>
            </div>
          </div>

          <button
            onClick={handleForceExit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all group cursor-pointer"
            title="Close Trataka (Press ESC)"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden md:inline-block text-[10px] bg-black/60 px-1.5 py-0.5 rounded border border-white/20 text-slate-400">
              ESC
            </kbd>
          </button>
        </header>

        {/* Center Mode Cards Grid */}
        <main className="flex-1 max-w-5xl mx-auto w-full py-8 flex flex-col justify-center">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Pre-Session Mode Calibration
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Choose Your Gazing Archetype
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Select one of the 5 classical Trataka variations. Each mode activates a distinct autonomic and neuro-cognitive pathway, all operating within the strict 2-minute digital eye safety limit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {TRATAKA_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className={`p-5 rounded-3xl bg-slate-950/70 hover:bg-slate-900/90 border ${mode.borderAccent} text-left transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] cursor-pointer`}
              >
                {/* Ambient Radial Accent */}
                <div
                  className={`absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-bl ${mode.bgAccent} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`}
                />

                <div className="space-y-3 relative z-10">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${mode.accentColor}`}
                    >
                      {mode.sanskritName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {mode.element}
                    </span>
                  </div>

                  {/* Mode Title & Tagline */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors flex items-center gap-2">
                      {mode.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-300 mt-0.5">
                      {mode.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {mode.description}
                  </p>
                </div>

                {/* Bottom Preview Thumbnail & Trigger */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                  {/* Mini Preview Thumbnail */}
                  <div className="w-12 h-12 rounded-2xl bg-black/90 border border-white/10 flex items-center justify-center shrink-0">
                    {mode.id === 'bindu' && (
                      <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_12px_4px_rgba(251,191,36,0.9)]" />
                    )}
                    {mode.id === 'flame' && (
                      <div
                        className="w-3 h-5 rounded-full bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200 blur-[0.5px] shadow-[0_0_10px_3px_rgba(249,115,22,0.8)]"
                        style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}
                      />
                    )}
                    {mode.id === 'murti' && (
                      <div className="w-6 h-6 rounded-full border border-emerald-400/60 flex items-center justify-center text-emerald-400">
                        <Layers className="w-3.5 h-3.5 opacity-90" />
                      </div>
                    )}
                    {mode.id === 'pratibimb' && (
                      <div className="w-5 h-7 rounded-lg border border-cyan-400/50 bg-gradient-to-b from-slate-900 to-black flex items-center justify-center text-cyan-300">
                        <Camera className="w-3 h-3 text-cyan-300 opacity-90" />
                      </div>
                    )}
                    {mode.id === 'shoonya' && (
                      <div className="w-8 h-8 rounded-xl border border-purple-500/40 bg-black flex items-center justify-center overflow-hidden relative shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                        <div className="w-6 h-[1.5px] bg-gradient-to-r from-transparent via-purple-300 to-transparent shadow-[0_0_8px_rgba(192,132,252,0.9)]" />
                        <div className="absolute w-5 h-2 rounded-full bg-purple-600/25 blur-[2px]" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Begin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto w-full pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Eye Safety Certified (2-Min Maximum Screen Gaze)</span>
          </div>
          <span>5-Stage Sattvavajaya Timeline (330s / 5:30)</span>
        </footer>
      </div>
    );
  }

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
        {/* Left: Stage Information & Mode Indicator */}
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
              {/* In-Session Mode Switch Capsule */}
              <button
                onClick={handleChangeMode}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/60 text-slate-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Switch Trataka Gazing Mode"
              >
                <span>Mode: {activeModeConfig.name.split(' ')[0]}</span>
                <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
              </button>
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

              {tratakaMode === 'pratibimb' && (
                <button
                  onClick={() => handleJumpToStage(2)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Pratibimb: Skip breathing &amp; open Sacred Mirror now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
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
              className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${
                tratakaMode === 'shoonya' ? 'bg-black' : ''
              }`}
            >
              {/* Optional Subtle Hypnotic Circle Background (Fades in at 2:00 at 10% opacity) */}
              <AnimatePresence>
                {isHypnoticPeripheralActive && tratakaMode !== 'shoonya' && (
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

              {/* Dynamic Focal Point based on selected Trataka Mode */}
              {/* 1. BINDU: Pure CSS Central Glowing Amber Dot */}
              {tratakaMode === 'bindu' && (
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
              )}

              {/* 2. FLAME (JYOTI): Pure CSS Flickering Flame */}
              {tratakaMode === 'flame' && (
                <div className="relative flex flex-col items-center justify-center">
                  {/* Ambient Tejas radiant heat aura */}
                  <div className="absolute w-64 h-64 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />

                  {/* Animated Flickering Flame Container */}
                  <motion.div
                    animate={{
                      scaleY: [1, 1.05, 0.96, 1.03, 1],
                      scaleX: [1, 0.97, 1.03, 0.98, 1],
                      rotate: [-0.6, 1.0, -0.8, 0.7, 0],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative flex items-center justify-center"
                    aria-label="The Sacred Jyoti Flame Focal Point"
                  >
                    {/* Outer Flame Envelope */}
                    <div
                      className="w-16 h-28 sm:w-20 sm:h-36 bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-300 blur-[2px] shadow-[0_0_55px_18px_rgba(249,115,22,0.85)]"
                      style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}
                    />

                    {/* Middle Luminous Flame */}
                    <div
                      className="absolute w-10 h-20 sm:w-12 sm:h-24 bg-gradient-to-t from-amber-500 via-yellow-300 to-yellow-100 shadow-[0_0_22px_6px_rgba(253,224,71,0.9)]"
                      style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}
                    />

                    {/* Core Pure White Heat */}
                    <div
                      className="absolute bottom-2 sm:bottom-3 w-5 h-12 sm:w-6 sm:h-14 bg-white/95 blur-[1px]"
                      style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}
                    />

                    {/* Base Blue Oxygen Halo */}
                    <div className="absolute -bottom-1 w-8 h-4 sm:w-9 sm:h-5 rounded-full bg-sky-500/70 blur-[2px]" />
                  </motion.div>

                  {/* Candle Wick */}
                  <div className="w-1 h-3.5 bg-neutral-800 rounded-b mt-[-2px] z-10" />
                </div>
              )}

              {/* 3. MURTI (SACRED MANDALA): Sacred Geometry Harmonics */}
              {tratakaMode === 'murti' && (
                <div className="relative flex items-center justify-center">
                  {/* Outer Emerald / Cyan radial glow */}
                  <div className="absolute w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

                  {/* Rotating Outer Sacred Mandala Geometry */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
                    className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center"
                    aria-label="The Sacred Geometry Mandala Focal Point"
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-400/80 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
                      
                      {/* 8 Symmetrical Petals */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                        <g key={angle} transform={`rotate(${angle} 100 100)`}>
                          <ellipse cx="100" cy="46" rx="14" ry="32" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
                          <circle cx="100" cy="24" r="2.5" fill="currentColor" opacity="0.9" />
                        </g>
                      ))}

                      {/* Sacred Octagram Interlocking Squares */}
                      <rect x="52" y="52" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                      <rect x="52" y="52" width="96" height="96" transform="rotate(45 100 100)" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />

                      {/* Inner Floral Core */}
                      <circle cx="100" cy="100" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
                    </svg>
                  </motion.div>

                  {/* Counter-rotating Inner Sri Harmonic Star */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center pointer-events-none"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]">
                      {[0, 60, 120, 180, 240, 300].map((angle) => (
                        <polygon
                          key={angle}
                          points="50,15 62,50 50,85 38,50"
                          transform={`rotate(${angle} 50 50)`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          opacity="0.85"
                        />
                      ))}
                    </svg>
                  </motion.div>

                  {/* Central Luminous Lotus Bindu */}
                  <div className="absolute w-3.5 h-3.5 bg-emerald-300 rounded-full shadow-[0_0_25px_8px_rgba(52,211,153,0.9)] z-30" />
                </div>
              )}

              {/* 4. PRATIBIMB (THE REFLECTION): Front Camera Self-Image Mirror with Permission */}
              {tratakaMode === 'pratibimb' && (
                <div className="relative flex items-center justify-center" aria-label="The Pratibimb Front Camera Mirror Focal Point">
                  {/* Soft Cyan / Aquamarine Halo */}
                  <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

                  {/* Reflective Mirror Frame with Breathing Glow */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 30px 4px rgba(6,182,212,0.25)',
                        '0 0 55px 12px rgba(6,182,212,0.45)',
                        '0 0 30px 4px rgba(6,182,212,0.25)',
                      ],
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-60 h-80 sm:w-72 sm:h-96 rounded-[42px] p-1.5 bg-gradient-to-b from-cyan-400/40 via-slate-700/50 to-cyan-500/25 border border-cyan-300/40 flex items-center justify-center overflow-hidden shadow-2xl"
                  >
                    {/* Interior Mirror Display */}
                    {cameraStream && cameraStatus === 'granted' ? (
                      <div className="w-full h-full rounded-[36px] bg-black flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Live Front Camera Feed (Mirrored via scale-x-[-1]) */}
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) {
                              el.srcObject = cameraStream;
                              el.onloadedmetadata = () => {
                                el.play().catch((err) => console.warn('Video play onloadedmetadata notice:', err));
                              };
                              el.play().catch((err) => console.warn('Video play notice:', err));
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover -scale-x-100 rounded-[36px]"
                        />

                        {/* Gentle Vignette Gradient Overlay */}
                        <div className="absolute inset-0 rounded-[36px] pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.7)] border border-cyan-400/20" />

                        {/* Soft Ambient Cyan Tint */}
                        <motion.div
                          animate={{ opacity: [0.08, 0.2, 0.08] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-950/25 pointer-events-none"
                        />

                        {/* Top Mirror Status Capsule */}
                        <div className="absolute top-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/30 flex items-center gap-1.5 pointer-events-none z-10">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-mono font-semibold tracking-wider text-cyan-200 uppercase">
                            Sacred Mirror • Zero Recording
                          </span>
                        </div>

                        {/* Top-Right Camera Toggle (Privacy Option) */}
                        <button
                          onClick={stopCamera}
                          title="Pause camera reflection"
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-slate-400 hover:text-white transition-all z-20 cursor-pointer"
                        >
                          <CameraOff className="w-3.5 h-3.5" />
                        </button>

                        {/* Bottom Subtle Guidance Capsule */}
                        <div className="absolute bottom-3 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/30 max-w-[88%] text-center pointer-events-none z-10">
                          <span className="text-[10px] font-medium text-cyan-200/90 leading-tight">
                            Only reflection of your image is shown • Zero recording
                          </span>
                        </div>
                      </div>
                    ) : cameraStatus === 'requesting' ? (
                      <div className="w-full h-full rounded-[36px] bg-gradient-to-b from-slate-950 via-black to-slate-900 flex flex-col items-center justify-center relative p-6 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                          <RefreshCw className="w-7 h-7 animate-spin text-cyan-300" />
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                            Opening Camera Session...
                          </span>
                          <span className="text-[11px] text-slate-400 font-light block mt-1">
                            Initializing live mirror reflection
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">
                          100% Private • Live Reflection Only • Zero Recording
                        </span>
                      </div>
                    ) : (
                      /* Idle / Ready State: Clean Sacred Mirror without any Blocked Warnings */
                      <div className="w-full h-full rounded-[36px] bg-gradient-to-b from-slate-950 via-black to-slate-900 flex flex-col items-center justify-center relative p-6 text-center space-y-3.5">
                        <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                          <Camera className="w-7 h-7 text-cyan-300" />
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                            Live Reflection Mirror
                          </span>
                          <p className="text-[11px] text-slate-300 font-light block mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                            No recording is done — only the live reflection of your image will be shown.
                          </p>
                        </div>
                        <button
                          onClick={requestCamera}
                          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Open Camera Session</span>
                        </button>
                        <span className="text-[9px] text-slate-400/80 font-mono">
                          Camera permission: 100% Private • Live Reflection Only • Zero Recording
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

              {/* 5. SHOONYA (THE VOID): Pure Pitch-Black Full Screen with Wide Cosmic Horizon Breathing */}
              {tratakaMode === 'shoonya' && (
                <div
                  className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden select-none z-10"
                  aria-label="The Shoonya Void Wide Cosmic Horizon Focal Point"
                >
                  {/* Distant Micro-Stardust Deep Field (Static Ethereal Cosmic Stars) */}
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-[18%] left-[16%] w-[1.5px] h-[1.5px] bg-purple-200/70 rounded-full" />
                    <div className="absolute top-[26%] right-[22%] w-1 h-1 bg-indigo-200/60 rounded-full blur-[0.5px]" />
                    <div className="absolute bottom-[32%] left-[24%] w-[1px] h-[1px] bg-purple-300/50 rounded-full" />
                    <div className="absolute bottom-[24%] right-[16%] w-[1.5px] h-[1.5px] bg-violet-200/70 rounded-full" />
                    <div className="absolute top-[40%] left-[10%] w-1 h-1 bg-purple-400/50 rounded-full blur-[0.5px]" />
                    <div className="absolute top-[34%] right-[12%] w-[1px] h-[1px] bg-slate-200/60 rounded-full" />
                    <div className="absolute bottom-[40%] right-[28%] w-[1.5px] h-[1.5px] bg-indigo-300/50 rounded-full" />
                    <div className="absolute top-[68%] left-[36%] w-[1px] h-[1px] bg-purple-200/50 rounded-full" />
                  </div>

                  {/* Vast Cosmic Horizon Breathing Architecture (8.5s Parasympathetic Breath Rhythm) */}
                  <div className="relative w-full max-w-6xl h-72 sm:h-96 flex flex-col items-center justify-center">
                    {/* Deep Cosmic Nebula Atmospheric Glow */}
                    <motion.div
                      animate={{
                        scale: [0.85, 1.18, 0.85],
                        opacity: [0.06, 0.26, 0.06],
                      }}
                      transition={{
                        duration: 8.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute w-[88vw] sm:w-[75vw] max-w-5xl h-44 sm:h-60 rounded-[100%] bg-gradient-to-r from-purple-950/0 via-purple-600/25 to-indigo-950/0 blur-3xl pointer-events-none"
                    />

                    {/* Expansive Wide Event Horizon Arc with Breathing Animation */}
                    <motion.div
                      animate={{
                        scaleX: [0.94, 1.08, 0.94],
                        scaleY: [0.88, 1.25, 0.88],
                        opacity: [0.25, 0.75, 0.25],
                      }}
                      transition={{
                        duration: 8.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="relative w-[96vw] sm:w-[85vw] max-w-6xl h-28 sm:h-40 flex flex-col items-center justify-center pointer-events-none"
                    >
                      {/* Panoramic Curved Cosmic Horizon SVG */}
                      <svg
                        viewBox="0 0 1200 140"
                        className="w-full h-full text-purple-400 overflow-visible drop-shadow-[0_0_30px_rgba(168,85,247,0.75)]"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="shoonyaHorizonBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#9333ea" stopOpacity="0" />
                            <stop offset="15%" stopColor="#a855f7" stopOpacity="0.25" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                            <stop offset="85%" stopColor="#a855f7" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="shoonyaAuroraGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
                            <stop offset="30%" stopColor="#a855f7" stopOpacity="0.45" />
                            <stop offset="50%" stopColor="#e9d5ff" stopOpacity="0.85" />
                            <stop offset="70%" stopColor="#a855f7" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Soft Ambient Horizon Aura Path */}
                        <path
                          d="M 0 70 Q 600 0 1200 70"
                          fill="none"
                          stroke="url(#shoonyaAuroraGlow)"
                          strokeWidth="7"
                          className="blur-[5px] opacity-75"
                        />

                        {/* Razor-Sharp Luminous Event Horizon Beam */}
                        <path
                          d="M 0 70 Q 600 0 1200 70"
                          fill="none"
                          stroke="url(#shoonyaHorizonBeam)"
                          strokeWidth="1.8"
                          opacity="0.95"
                        />
                      </svg>
                    </motion.div>

                    {/* Center Void: Infinite Formless Emptiness */}
                  </div>
                </div>
              )}

              {/* Stage 2 gazing canvas remains 100% pristine and distraction-free */}
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
                  {tratakaMode === 'bindu' &&
                    'Observe the glowing optical after-image floating in the space behind your closed eyelids. Anchor your attention directly in the center of your forehead (Chidakasha).'}
                  {tratakaMode === 'flame' &&
                    'Visualize the dancing golden flame imprint in the dark space of your mind\'s eye. Feel its calming, steady warmth radiating through your brow.'}
                  {tratakaMode === 'murti' &&
                    'Trace the lingering sacred geometry of the mandala within your inner visual space. Rest in balanced, symmetrical calm.'}
                  {tratakaMode === 'pratibimb' &&
                    'Hold the feeling of your own warm presence inside your heart and mind. You are safe, validated, and whole in your own awareness.'}
                  {tratakaMode === 'shoonya' &&
                    'Rest in the infinite inner darkness. The mind is a boundless sky; thoughts are merely passing clouds. Abide in pure stillness.'}
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
      <footer className="relative z-50 px-4 sm:px-8 py-2.5 border-t border-white/10 bg-black/90 backdrop-blur-md shrink-0 flex items-center justify-between gap-3 min-h-[44px]">
        {isStage2 ? (
          /* One-Line Deep-Down Edge Instruction for Gazing (Zero Visual Interference) */
          <div className="w-full flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300 min-w-0 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-mono text-[11px] text-amber-300 uppercase tracking-wider shrink-0 hidden sm:inline">
                {activeModeConfig.name}:
              </span>
              <span className="text-xs sm:text-sm text-slate-200 truncate font-light">
                {tratakaMode === 'bindu' &&
                  'Gaze steadily at the center amber Bindu. Soften peripheral focus. Blink gently if eyes tire.'}
                {tratakaMode === 'flame' &&
                  'Fixate steadily on the tip of the golden flame. Feel calm radiant warmth clearing mental fatigue.'}
                {tratakaMode === 'murti' &&
                  'Rest gaze at the sacred mandala center. Allow symmetrical geometry to absorb and quiet thoughts.'}
                {tratakaMode === 'pratibimb' &&
                  'Gaze softly into your own eyes in the mirror. Release self-judgment with unconditional compassion.'}
                {tratakaMode === 'shoonya' &&
                  'Rest gaze into the boundless dark void. Synchronize breath with the wide cosmic horizon in stillness.'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400">Safe Gaze:</span>
              <strong className="text-amber-400 font-bold">{formatTimer(180 - elapsedSec)}</strong>
              <span className="text-[10px] text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/50 hidden md:inline">
                2-Min Limit
              </span>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </footer>
    </div>
  );
};

export default TratakaModule;
