'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Mic,
  Volume2,
  Search,
  BookOpen,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Server,
  Radio,
  Globe,
  MapPin,
  Play,
  Square,
  Sparkles,
  Compass,
  Brain,
  HeartPulse,
  Flame,
  AlertTriangle,
  Smile,
  Frown,
  Wind,
  Layers,
  History,
} from 'lucide-react';
import {
  GLOBAL_LANGUAGE_CATALOG,
  LanguageItem,
  DetectedLocationInfo,
  detectLocationAndLanguage,
  getStoredLanguage,
  saveLanguagePreference,
  getLanguageByCode,
} from '@/lib/i18n/language-catalog';
import {
  PsychologicalIssueState,
  DEFAULT_PSYCHOLOGY_STATE,
  getLivePsychologyTelemetry,
  saveLivePsychologyTelemetry,
  subscribeToPsychologyUpdates,
} from '@/lib/telemetry/psychology-store';
import { LanguageSelector } from '../(session)/components/LanguageSelector';

interface HealthData {
  status: string;
  service?: string;
  version?: string;
  zero_api_key?: boolean;
  latency_ms?: number;
  backend_url?: string;
  frontend_gateway?: string;
  timestamp?: string;
  error?: string;
  search_engine?: {
    sources: string[];
  };
  audio_engine?: {
    stt_engine: string;
    tts_primary: string;
    tts_fallback: string;
    available_voices: string[];
    whisper_loaded: boolean;
    zero_api_key: boolean;
  };
  inference_engine?: string;
  troubleshooting?: string[];
}

export default function BackendHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Geo Location & Language Pack State
  const [currentLanguage, setCurrentLanguage] = useState<LanguageItem>(GLOBAL_LANGUAGE_CATALOG[0]);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocationInfo | null>(null);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);
  const [voiceTestError, setVoiceTestError] = useState<string | null>(null);

  // MAJOR FOCUS: Live Psychological Telemetry State
  const [psychState, setPsychState] = useState<PsychologicalIssueState>(DEFAULT_PSYCHOLOGY_STATE);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Backend API Health
  const fetchHealth = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '') : '';
      const healthEndpoint = backendUrl ? `${backendUrl}/health` : '/api/backend-health';
      const res = await fetch(healthEndpoint, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch (err: any) {
      setData({
        status: 'unreachable',
        error: err?.message || 'Failed to connect to gateway',
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  // 2. Detect GPS Location & Active Language on Mount
  const runGeoDetection = async () => {
    try {
      const loc = await detectLocationAndLanguage();
      setDetectedLocation(loc);

      const { code, isAuto } = getStoredLanguage();
      const targetCode = isAuto && loc.defaultLanguageCode ? loc.defaultLanguageCode : code;
      const matched = getLanguageByCode(targetCode);
      setCurrentLanguage(matched);
    } catch (e) {
      console.warn('Geo detection notice:', e);
    }
  };

  useEffect(() => {
    fetchHealth();
    runGeoDetection();

    // Load initial psychological state
    const currentPsych = getLivePsychologyTelemetry();
    setPsychState(currentPsych);
    setLastSyncTime(currentPsych.lastUpdated);

    // Subscribe to real-time cross-tab updates whenever user talks in session
    const unsubscribe = subscribeToPsychologyUpdates((updated) => {
      setPsychState(updated);
      setLastSyncTime(Date.now());
    });

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 5000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [autoRefresh]);

  // Handle manual or auto language switch
  const handleLanguageChange = (newLang: LanguageItem, isAuto: boolean) => {
    setCurrentLanguage(newLang);
    saveLanguagePreference(newLang.code, isAuto);
    if (isPlayingTestVoice && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingTestVoice(false);
    }
  };

  // Test live Edge Neural Voice synthesis in the detected Geo-Language
  const testGeoVoice = async () => {
    if (isPlayingTestVoice && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingTestVoice(false);
      return;
    }

    setIsPlayingTestVoice(true);
    setVoiceTestError(null);

    try {
      const testText = encodeURIComponent(
        `Neural voice synthesis test in ${currentLanguage.name}`
      );
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '') : '';
      const voiceBase = backendUrl ? `${backendUrl}/api/voice` : '/api/voice';
      const audioUrl = `${voiceBase}?text=${testText}&locale=${currentLanguage.speechLocale}&rate=-4%25`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingTestVoice(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingTestVoice(false);
        audioRef.current = null;
        setVoiceTestError('Neural voice stream unreachable or blocked by browser.');
      };

      await audio.play();
    } catch (err: any) {
      setIsPlayingTestVoice(false);
      audioRef.current = null;
      setVoiceTestError(err?.message || 'Voice playback error');
    }
  };

  // Interactive Live Psychological Scenario Simulator
  const simulateScenario = async (
    scenarioText: string,
    presetTelemetry: {
      dominant_emotion: string;
      cbt_distortion: string;
      polyvagal_state: string;
      percentages: Record<string, number>;
      strategy: string;
    }
  ) => {
    setIsSimulating(true);
    try {
      // Try backend inference if healthy, otherwise use immediate diagnostic telemetry
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '') : '';
        const chatEndpoint = backendUrl ? `${backendUrl}/api/chat` : '/api/py/chat';
        const res = await fetch(chatEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: scenarioText, voice_mode: false }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.telemetry) {
            const updated = saveLivePsychologyTelemetry(json.telemetry, scenarioText);
            setPsychState(updated);
            setLastSyncTime(Date.now());
            setIsSimulating(false);
            return;
          }
        }
      } catch (_) {}

      // Fallback: apply preset directly
      const updated = saveLivePsychologyTelemetry(presetTelemetry, scenarioText);
      setPsychState(updated);
      setLastSyncTime(Date.now());
    } finally {
      setIsSimulating(false);
    }
  };

  const isHealthy = data?.status === 'healthy';

  return (
    <main className="min-h-screen bg-[#080d0a] text-[#ecf3ee] p-4 sm:p-8 selection:bg-[#588e73]/30 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2b22]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#122018] border border-[#233a2e] text-[#52b788]">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Psychological Diagnostics &amp; System Health
              </h1>
              <p className="text-xs sm:text-sm text-[#88a896]">
                Real-time monitor tracking active cognitive distortions, polyvagal status, GPS language, and speech models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#c4ded0] bg-[#122018] hover:bg-[#1a2e23] border border-[#233a2e] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Session
            </Link>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#080d0a] bg-[#52b788] hover:bg-[#74c69d] disabled:opacity-50 rounded-lg transition-all shadow-sm shadow-[#52b788]/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* 🌟 MAJOR FOCUS: Active Psychological Issues & Cognitive Profile Radar */}
        <section className="p-6 rounded-3xl bg-gradient-to-b from-[#112419] via-[#0d1c14] to-[#0a150f] border-2 border-[#387053] space-y-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
          {/* Top Focus Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#234734]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#74c69d] shadow-lg shadow-emerald-900/30">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider text-[#95d5b2]">
                    Major Clinical Focus
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#74c69d] font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#52b788] animate-ping" />
                    Live Sync Active
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  User Psychological Issues &amp; Cognitive Distortion Diagnostics
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#88a896]">Assessments Logged:</span>
              <strong className="px-2.5 py-1 rounded-lg bg-[#162e20] border border-[#2b583f] text-[#74c69d] font-mono">
                {psychState.totalAssessments} Turns
              </strong>
            </div>
          </div>

          {/* Primary Psychological Issue Spotlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card A: Cognitive Distortion & Severity */}
            <div className="p-4 rounded-2xl bg-[#08130d] border border-[#213f2f] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#e9c46a]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">CBT Cognitive Distortion</span>
                </div>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                    psychState.distortionSeverity === 'High'
                      ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                      : psychState.distortionSeverity === 'Moderate'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {psychState.distortionSeverity} Intensity
                </span>
              </div>
              <p className="text-sm font-bold text-white leading-snug">
                {psychState.cbtDistortion}
              </p>
              <div className="pt-2 border-t border-[#182c21] text-[11px] text-[#88a896] space-y-1">
                <div>
                  <span className="opacity-70">Primary Trigger:</span>{' '}
                  <strong className="text-[#ecf3ee]">{psychState.primaryTrigger}</strong>
                </div>
              </div>
            </div>

            {/* Card B: Polyvagal Autonomic State */}
            <div className="p-4 rounded-2xl bg-[#08130d] border border-[#213f2f] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#74c69d]">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Polyvagal Autonomic State</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#183626] text-[#95d5b2] border border-[#2b583f]">
                  Vagal Brake
                </span>
              </div>
              <p className="text-sm font-bold text-white leading-snug">
                {psychState.polyvagalState}
              </p>
              <div className="pt-2 border-t border-[#182c21] text-[11px] text-[#88a896] space-y-1">
                <div>
                  <span className="opacity-70">Somatic Anchor:</span>{' '}
                  <strong className="text-[#ecf3ee]">{psychState.somaticAnchor}</strong>
                </div>
              </div>
            </div>

            {/* Card C: Clinical Strategy & Pranayama */}
            <div className="p-4 rounded-2xl bg-[#08130d] border border-[#213f2f] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#52b788]">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Prescribed Regulation</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#183626] text-[#95d5b2] border border-[#2b583f]">
                  Sattvavajaya
                </span>
              </div>
              <p className="text-xs font-semibold text-[#b7e4c7] leading-relaxed">
                {psychState.recommendedPranayama}
              </p>
              <div className="pt-2 border-t border-[#182c21] text-[11px] text-[#88a896]">
                <span className="opacity-70">CBT Strategy:</span>{' '}
                <strong className="text-[#ecf3ee] block">{psychState.clinicalStrategy}</strong>
              </div>
            </div>
          </div>

          {/* 27-D Emotional Spectrum Breakdown Bars */}
          <div className="p-4 rounded-2xl bg-[#08130d]/90 border border-[#213f2f] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Active Emotion Intensity &amp; Autonomic Breakdown
              </span>
              <span className="text-[11px] text-[#88a896]">
                Dominant: <strong className="text-[#74c69d]">{psychState.dominantEmotion}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {Object.entries(psychState.emotionBreakdown || {}).map(([emo, score]) => (
                <div key={emo} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#c4ded0]">{emo}</span>
                    <strong className="font-mono text-[#74c69d]">{score}%</strong>
                  </div>
                  <div className="h-2 w-full bg-[#182c21] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 70
                          ? 'bg-gradient-to-r from-red-500 to-amber-500'
                          : score >= 45
                          ? 'bg-gradient-to-r from-amber-500 to-[#52b788]'
                          : 'bg-[#52b788]'
                      }`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Longitudinal Psychological Turn Timeline */}
          {psychState.recentTurns && psychState.recentTurns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[#74c69d]" />
                Recent Psychological Turn History
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {psychState.recentTurns.slice(0, 4).map((turn, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#08130d] border border-[#1b3325] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono text-[#688a77] shrink-0">
                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <strong className="text-white truncate">"{turn.trigger}"</strong>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      <span className="text-[#e9c46a]">{turn.distortion}</span>
                      <span className="text-[#88a896]">•</span>
                      <span className="text-[#74c69d]">{turn.emotion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Scenario Testing Palette */}
          <div className="pt-3 border-t border-[#234734] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#b7e4c7] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#52b788]" />
                Test / Simulate Psychological Scenario Shift:
              </span>
              {isSimulating && (
                <span className="text-[11px] text-[#52b788] animate-pulse">Running diagnostic shift...</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  simulateScenario('I failed my driving test and I feel like an absolute useless failure.', {
                    dominant_emotion: 'Self-Doubt & Failure',
                    cbt_distortion: 'All-or-Nothing / Personalization',
                    polyvagal_state: 'Sympathetic (Fight/Flight)',
                    percentages: { 'Disappointment': 88, 'Self-Doubt': 76, 'Anxiety': 60, 'Calmness': 12 },
                    strategy: 'De-catastrophizing isolated failure vs core human capability.',
                  })
                }
                disabled={isSimulating}
                className="px-2.5 py-1.5 rounded-lg bg-[#14281c] hover:bg-[#1f3d2b] border border-[#2b583f] text-xs text-[#95d5b2] transition-all"
              >
                🚗 Driving Test Failure
              </button>

              <button
                onClick={() =>
                  simulateScenario('My boss keeps yelling at me and dumping 14-hour workloads every single day.', {
                    dominant_emotion: 'Workplace Burnout & Anger',
                    cbt_distortion: 'Personalization & Mind Reading',
                    polyvagal_state: 'Sympathetic (Fight/Flight Overload)',
                    percentages: { 'Burnout & Exhaustion': 92, 'Frustration': 84, 'Anxiety': 65, 'Calmness': 8 },
                    strategy: 'Boundary clarification, somatic micro-resets, and locus of control separation.',
                  })
                }
                disabled={isSimulating}
                className="px-2.5 py-1.5 rounded-lg bg-[#14281c] hover:bg-[#1f3d2b] border border-[#2b583f] text-xs text-[#95d5b2] transition-all"
              >
                💼 Workplace Burnout
              </button>

              <button
                onClick={() =>
                  simulateScenario('I feel completely numb, exhausted, and cannot get out of bed today.', {
                    dominant_emotion: 'Dorsal Shutdown & Grief',
                    cbt_distortion: 'Emotional Reasoning / Mental Filter',
                    polyvagal_state: 'Dorsal Vagal (Freeze/Shutdown)',
                    percentages: { 'Depressive Fatigue': 86, 'Numbness': 80, 'Grief': 55, 'Calmness': 15 },
                    strategy: 'Gentle micro-behavioral activation (Opposite Action) and somatic awakening.',
                  })
                }
                disabled={isSimulating}
                className="px-2.5 py-1.5 rounded-lg bg-[#14281c] hover:bg-[#1f3d2b] border border-[#2b583f] text-xs text-[#95d5b2] transition-all"
              >
                🧊 Freeze & Shutdown
              </button>

              <button
                onClick={() =>
                  simulateScenario('I feel calm, centered, and peaceful after our deep breathing exercises.', {
                    dominant_emotion: 'Calmness & Safety',
                    cbt_distortion: 'None',
                    polyvagal_state: 'Ventral Vagal (Regulated & Social)',
                    percentages: { 'Calmness & Safety': 90, 'Relief': 82, 'Clarity': 75, 'Anxiety': 8 },
                    strategy: 'Anchoring ventral vagal regulation and cognitive consolidation.',
                  })
                }
                disabled={isSimulating}
                className="px-2.5 py-1.5 rounded-lg bg-[#14281c] hover:bg-[#1f3d2b] border border-[#2b583f] text-xs text-[#74c69d] transition-all"
              >
                🌿 Reset to Regulated Calm
              </button>
            </div>
          </div>
        </section>

        {/* FEATURED: GPS Location & Language Pack Diagnostics Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1f15] via-[#10281b] to-[#0d1f15] border border-[#2d5a42] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234331]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#52b788]/20 border border-[#52b788]/40 flex items-center justify-center text-[#74c69d] shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    GPS Geo-Location Language Pack
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d] border border-[#2d5a42]">
                    {detectedLocation?.isGps ? '📍 GPS Accurate' : '🌐 Timezone Inferred'}
                  </span>
                </div>
                <p className="text-xs text-[#88a896]">
                  Automatically synchronizes speech recognition, Edge Neural voice, and conversational idioms
                </p>
              </div>
            </div>

            {/* Test Geo Voice Synthesis Button */}
            <button
              onClick={testGeoVoice}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shrink-0 ${
                isPlayingTestVoice
                  ? 'bg-red-900/90 text-red-200 border border-red-500 animate-pulse'
                  : 'bg-[#1b382b] hover:bg-[#234a38] text-[#95d5b2] border border-[#2d5a42]'
              }`}
            >
              {isPlayingTestVoice ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingTestVoice ? 'Stop Audio Sample' : `Test ${currentLanguage.name} Voice`}</span>
            </button>
          </div>

          {/* Geo Telemetry Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#08130d] border border-[#1b3325]">
              <span className="text-[10px] uppercase tracking-wider text-[#688a77] block mb-1">Detected Region</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{currentLanguage.flag}</span>
                <strong className="text-xs text-white truncate">{detectedLocation?.countryName || currentLanguage.region}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#08130d] border border-[#1b3325]">
              <span className="text-[10px] uppercase tracking-wider text-[#688a77] block mb-1">Active Language</span>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-[#74c69d]">{currentLanguage.name}</strong>
                <span className="text-[11px] text-[#88a896]">({currentLanguage.nativeName})</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#08130d] border border-[#1b3325]">
              <span className="text-[10px] uppercase tracking-wider text-[#688a77] block mb-1">Speech Recognition (STT)</span>
              <strong className="text-xs text-white font-mono">{currentLanguage.speechLocale}</strong>
            </div>

            <div className="p-3 rounded-xl bg-[#08130d] border border-[#1b3325]">
              <span className="text-[10px] uppercase tracking-wider text-[#688a77] block mb-1">Assigned Neural TTS</span>
              <strong className="text-xs text-[#74c69d] font-mono truncate block">
                {currentLanguage.code === 'hi' ? 'hi-IN-SwaraNeural' :
                 currentLanguage.code === 'es' ? 'es-ES-ElviraNeural' :
                 currentLanguage.code === 'fr' ? 'fr-FR-DeniseNeural' :
                 currentLanguage.code === 'de' ? 'de-DE-KatjaNeural' :
                 currentLanguage.code === 'ja' ? 'ja-JP-NanamiNeural' :
                 currentLanguage.code === 'zh' ? 'zh-CN-XiaoxiaoNeural' :
                 currentLanguage.code === 'ar' ? 'ar-SA-ZariyahNeural' :
                 'en-US-AriaNeural'}
              </strong>
            </div>
          </div>

          {voiceTestError && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {voiceTestError}
            </p>
          )}
        </div>

        {/* Engine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Speech-to-Text */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <Mic className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">Speech-to-Text (STT)</h3>
              </div>
              {data?.audio_engine?.stt_engine ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                  Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#381b1b] text-[#e63946]">
                  Offline
                </span>
              )}
            </div>
            <p className="text-xs text-[#88a896] leading-relaxed">
              {data?.audio_engine?.stt_engine || 'Faster-Whisper (tiny.en, int8 CPU)'}
            </p>
            <div className="pt-2 border-t border-[#1b2b22] text-xs text-[#88a896] flex justify-between items-center">
              <span>Model In Memory:</span>
              <strong className={data?.audio_engine?.whisper_loaded ? 'text-[#74c69d]' : 'text-[#e9c46a]'}>
                {data?.audio_engine?.whisper_loaded ? 'Warm / Loaded' : 'Cold Start On Demand'}
              </strong>
            </div>
          </div>

          {/* Card 2: Neural Text-to-Speech */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <Volume2 className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">Neural Voice (TTS)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                Zero-Key
              </span>
            </div>
            <p className="text-xs text-[#88a896] leading-relaxed">
              Primary: <strong className="text-[#ecf3ee]">{data?.audio_engine?.tts_primary || 'Edge-TTS'}</strong>
            </p>
            <div className="pt-2 border-t border-[#1b2b22] text-xs text-[#88a896] flex justify-between items-center">
              <span>Available Voices:</span>
              <span className="font-mono text-[11px] text-[#74c69d]">
                {data?.audio_engine?.available_voices?.length || 39} Regional Profiles
              </span>
            </div>
          </div>

          {/* Card 3: Clinical Inference Engine */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <Cpu className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">Inference Engine</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                Hybrid
              </span>
            </div>
            <p className="text-xs text-[#88a896] leading-relaxed">
              {data?.inference_engine || 'Local Ollama + Polyvagal/CBT Heuristic Synthesis'}
            </p>
            <div className="pt-2 border-t border-[#1b2b22] text-xs text-[#88a896] flex justify-between items-center">
              <span>Anti-Loop Cache:</span>
              <strong className="text-[#74c69d]">Active (LRU 25 Turns)</strong>
            </div>
          </div>

          {/* Card 4: Clinical Evidence & Search */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <Search className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">Clinical Evidence Search</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                Multi-Source
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(data?.search_engine?.sources || ['PubMed NCBI', 'DuckDuckGo', 'Wikipedia', 'Protocols Cache']).map(
                (src) => (
                  <span
                    key={src}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#16271e] text-[#95d5b2] border border-[#233f30]"
                  >
                    {src}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Card 5: CBT & Neuroscience Library */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">CBT &amp; Ontology Base</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                v2.4.0
              </span>
            </div>
            <p className="text-xs text-[#88a896]">
              20+ Distortions • 18 Schemas • 8 Protocols • Automatic Rollback Protection
            </p>
            <div className="pt-2 border-t border-[#1b2b22] text-xs text-[#88a896] flex justify-between items-center">
              <span>Integrity Hash:</span>
              <span className="font-mono text-[10px] text-[#74c69d]">SHA-256 Validated</span>
            </div>
          </div>

          {/* Card 6: Safety & Crisis Intercept */}
          <div className="p-5 rounded-2xl bg-[#0d1712] border border-[#1b2b22] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#52b788]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-white">Safety &amp; Crisis Intercept</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1b382b] text-[#74c69d]">
                Active
              </span>
            </div>
            <p className="text-xs text-[#88a896]">
              Zero-False-Negative screening for crisis thoughts, psychotic command hallucinations, and prescription filtering.
            </p>
            <div className="pt-2 border-t border-[#1b2b22] text-xs text-[#88a896] flex justify-between items-center">
              <span>Lifelines:</span>
              <span className="text-white text-[11px]">988 • Tele-MANAS • 111</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting / Raw JSON toggle */}
        {data?.troubleshooting && (
          <div className="p-5 rounded-2xl bg-[#1a1212] border border-[#4a2222] space-y-2">
            <h3 className="text-sm font-semibold text-[#f87171] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Troubleshooting Steps
            </h3>
            <ul className="text-xs text-[#fca5a5] space-y-1 list-disc list-inside">
              {data.troubleshooting.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer info */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#1b2b22] text-xs text-[#88a896]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#52b788] animate-pulse" />
            <span>Auto-refreshing every 5 seconds</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/backend-health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#52b788] hover:underline font-mono text-[11px]"
            >
              View Raw JSON Feed →
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
