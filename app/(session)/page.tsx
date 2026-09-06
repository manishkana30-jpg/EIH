"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  Wind,
  History,
  ShieldAlert,
  User,
  Volume2,
  VolumeX,
  Activity,
  PhoneOff,
  Mic,
  Send,
  Sparkles,
  AlertTriangle,
  Eye,
  Share2,
  Download,
  Check,
  Menu,
  X,
} from "lucide-react";

import { healerClient, PsychologicalTelemetry, ClinicalSource, ChatHistoryItem, TrigunaAnalysis } from "@/lib/api/healer-client";
import { AudioWaveform } from "./components/AudioWaveform";
import { CBTKnowledgeModal } from "./components/CBTKnowledgeModal";
import { PranayamaGuide } from "./components/PranayamaGuide";
import { EncryptedHistoryModal } from "./components/EncryptedHistoryModal";
import { CrisisModal } from "./components/CrisisModal";
import { LanguageSelector } from "./components/LanguageSelector";
import { TratakaModule } from "./components/TratakaModule";
import { PwaInstallModal } from "./components/PwaInstallModal";

import { browserSpeechController } from "@/lib/audio/browser-speech";
import { getCleanAudioStream } from "@/lib/audio/audio-manager";
import {
  GLOBAL_LANGUAGE_CATALOG,
  LanguageItem,
  detectLocationAndLanguage,
  detectUserLocale,
  getStoredLanguage,
  saveLanguagePreference,
} from "@/lib/i18n/language-catalog";
import { saveLivePsychologyTelemetry } from "@/lib/telemetry/psychology-store";
import { getConditionById, queryPsychologyLibrary } from "@/lib/knowledge/psychology-library-rag";
import { saveSessionMessage } from "@/lib/db/indexed-db";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  engine?: string;
  sources?: ClinicalSource[];
  recommended_trataka?: string;
  triguna_analysis?: TrigunaAnalysis;
}

const getFormattedTime = () => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

export default function SanctuarySessionPage() {
  // ─── Core State ───
  const [currentLanguage, setCurrentLanguage] = useState<LanguageItem>(GLOBAL_LANGUAGE_CATALOG[0]);
  const [userLocale, setUserLocale] = useState<string>("en-US");
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isAiMuted, setIsAiMuted] = useState(false);

  // ─── Modal Visibility States ───
  const [isCBTModalOpen, setIsCBTModalOpen] = useState(false);
  const [isPranayamaOpen, setIsPranayamaOpen] = useState(false);
  const [isTratakaOpen, setIsTratakaOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [activeCrisisData, setActiveCrisisData] = useState<any>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileTelemetryOpen, setIsMobileTelemetryOpen] = useState(false);

  // ─── Live Clinical Telemetry ───
  const [telemetry, setTelemetry] = useState<PsychologicalTelemetry>({
    dominant_emotion: "Calmness",
    polyvagal_state: "Ventral Vagal (Safe)",
    cbt_distortion: "None",
    percentages: { Calmness: 74, Relief: 58, Anxiety: 18 },
    strategy: "Active reflective listening",
  });
  const [recommendedTrataka, setRecommendedTrataka] = useState<string>("bindu");
  const [activeTriguna, setActiveTriguna] = useState<TrigunaAnalysis | null>(null);

  // Dynamically resolve active CBT Reframe for Trataka Neuroplastic Phase
  const activeCbtReframe = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "ai" && msg.sources && msg.sources.length > 0) {
        const cbtSource = msg.sources.find((s) => s.summary?.includes("CBT:") || s.title?.toLowerCase().includes("cbt"));
        if (cbtSource && cbtSource.summary) {
          const match = cbtSource.summary.match(/CBT:\s*([^|]+)/i);
          if (match && match[1]) return match[1].trim();
          return cbtSource.summary;
        }
      }
    }
    const match = queryPsychologyLibrary(telemetry.cbt_distortion !== "None" ? telemetry.cbt_distortion : telemetry.dominant_emotion);
    if (match && match.condition.solutions.cbt_reframing) {
      return match.condition.solutions.cbt_reframing.split("[Wikipedia Context]")[0].trim();
    }
    return undefined;
  }, [messages, telemetry]);

  // ─── PWA Lifecycle & Installation Detection ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is running in standalone PWA window
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // ─── Share Sanctuary Handler ───
  const handleShareApp = useCallback(async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.origin;
    const shareData = {
      title: "EIH - Emotional Intelligence & Healing Sanctuary",
      text: "Autonomous clinical neuropsychological companion & Ayurvedic healing sanctuary.",
      url: shareUrl,
    };

    if (navigator.share && typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: Copy URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      window.prompt("Copy Sanctuary URL:", shareUrl);
    }
  }, []);

  // ─── PWA Install Trigger ───
  const handleInstallClick = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice
        .then((choice: any) => {
          if (choice.outcome === "accepted") {
            setIsAppInstalled(true);
          }
          setDeferredPrompt(null);
        })
        .catch(() => {
          setIsPwaModalOpen(true);
        });
    } else {
      setIsPwaModalOpen(true);
    }
  }, [deferredPrompt]);

  // ─── Voice, Audio Playback & Echo Avoidance ───
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isEchoLocked, setIsEchoLocked] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  // ─── Refs for Thread Safety ───
  const activeStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const isPlayingAudioRef = useRef(false);
  const isEchoLockedRef = useRef(false);
  const isVoiceModeActiveRef = useRef(false);
  const isAiMutedRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitializedRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);
  const currentLanguageRef = useRef<LanguageItem>(currentLanguage);
  const userLocaleRef = useRef<string>("en-US");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    userLocaleRef.current = userLocale;
  }, [userLocale]);

  useEffect(() => {
    isAiMutedRef.current = isAiMuted;
    if (isAiMuted) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      browserSpeechController.cancelSpeech();
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
    }
  }, [isAiMuted]);

  // ─── Geo-Location & Auto Language Detection ───
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialLocale = detectUserLocale();
    setUserLocale(initialLocale);

    healerClient.checkHealth().then((healthy) => setIsBackendHealthy(healthy));

    detectLocationAndLanguage().then((loc) => {
      const { code, isAuto } = getStoredLanguage();
      const targetCode = isAuto && loc.defaultLanguageCode ? loc.defaultLanguageCode : code;
      const matchedLang =
        GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === targetCode) || GLOBAL_LANGUAGE_CATALOG[0];

      setCurrentLanguage(matchedLang);
      setUserLocale(matchedLang.speechLocale);
      browserSpeechController.setLanguageLocale(matchedLang.speechLocale);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const focusId = params.get("focus") || params.get("condition");
        if (focusId) {
          const matchedCond = getConditionById(focusId);
          if (matchedCond) {
            setTelemetry({
              dominant_emotion: matchedCond.name,
              polyvagal_state: matchedCond.triguna_balance,
              cbt_distortion: matchedCond.cognitive_distortions[0] || "None",
              percentages: { [matchedCond.name]: 80, Relief: 45, Grounding: 70 },
              strategy: matchedCond.solutions.somatic_anchor,
            });
          }
        }
      }
    });

    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      browserSpeechController.stopRecognition();
      browserSpeechController.cancelSpeech();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ─── Voice Playback with Echo Avoidance ───
  const playVoice = useCallback((text: string, audioBase64?: string) => {
    if (isAiMutedRef.current) return;

    const cleanText = browserSpeechController.cleanTextForSpeech(text);
    if (!cleanText && !audioBase64) return;

    browserSpeechController.stopRecognition();
    setIsRecording(false);

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch (_) {}
      activeAudioRef.current = null;
    }
    browserSpeechController.cancelSpeech();

    isPlayingAudioRef.current = true;
    isEchoLockedRef.current = true;
    setIsPlayingAudio(true);
    setIsEchoLocked(true);

    const handleAudioEnd = () => {
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
      activeAudioRef.current = null;

      setTimeout(() => {
        isEchoLockedRef.current = false;
        setIsEchoLocked(false);
        if (isVoiceModeActiveRef.current) {
          startContinuousVoiceListening();
        }
      }, 200);
    };

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        activeAudioRef.current = audio;

        audio.onended = handleAudioEnd;
        audio.onerror = (e) => {
          console.warn("Direct base64 audio failed, fallback to browser speech:", e);
          browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio autoplay blocked, fallback to browser speech:", err);
            browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
          });
        }
        return;
      } catch (err) {
        console.error("Base64 audio init error:", err);
      }
    }

    browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
  }, []);

  // ─── Send Message Handler ───
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!messageText || isSendingRef.current) return;

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch (_) {}
      activeAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
    }
    browserSpeechController.cancelSpeech();

    setErrorMessage(null);
    isSendingRef.current = true;
    setIsLoading(true);
    setInputVal("");

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: messageText,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    saveSessionMessage("user", messageText);

    const historyPayload: ChatHistoryItem[] = messagesRef.current
      .filter((m) => m.text.trim())
      .slice(-8)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    try {
      const response = await healerClient.sendMessage(
        messageText,
        historyPayload,
        true,
        currentLanguageRef.current.code,
        userLocaleRef.current
      );

      const aiMsg: Message = {
        id: `${Date.now()}-ai`,
        sender: "ai",
        text: response.reply,
        timestamp: getFormattedTime(),
        engine: response.engine,
        sources: response.sources,
        recommended_trataka: response.recommended_trataka,
        triguna_analysis: response.triguna_analysis,
      };

      if (response.recommended_trataka) {
        setRecommendedTrataka(response.recommended_trataka);
      }
      if (response.triguna_analysis) {
        setActiveTriguna(response.triguna_analysis);
      }
      if (response.is_crisis) {
        setActiveCrisisData(response.crisisData || null);
        setIsCrisisModalOpen(true);
      }

      setMessages((prev) => [...prev, aiMsg]);
      saveSessionMessage("assistant", response.reply);

      if (response.telemetry) {
        setTelemetry({
          ...response.telemetry,
          percentages: response.telemetry.percentages || {
            [response.telemetry.dominant_emotion || "Calmness"]: 75,
          },
        });
        saveLivePsychologyTelemetry(response.telemetry, messageText);
      }

      playVoice(response.reply, response.audio_base64);
    } catch (error) {
      console.error("Chat communication notice:", error);
      setErrorMessage("Unable to reach the clinical reasoning engine. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // ─── Continuous Voice Capture ───
  const startContinuousVoiceListening = async () => {
    if (isPlayingAudioRef.current || isEchoLockedRef.current) return;

    try {
      const stream = await getCleanAudioStream();
      activeStreamRef.current = stream;
      setRecordingStream(stream);
      setIsRecording(true);
      isVoiceModeActiveRef.current = true;

      await browserSpeechController.startListening(
        (transcript, isFinal) => {
          if (isFinal && transcript.trim().length > 0) {
            setInputVal("");
            handleSendMessage(transcript.trim());
          } else if (transcript.trim().length > 0) {
            setInputVal(transcript);
          }
        },
        (err) => {
          console.warn("Speech recognition notice:", err);
        },
        stream
      );
    } catch (err) {
      console.error("Voice capture start error:", err);
      setIsRecording(false);
    }
  };

  const toggleRecording = async () => {
    if (isPlayingAudioRef.current || isEchoLockedRef.current) {
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
    }
    browserSpeechController.cancelSpeech();

    if (isRecording) {
      isVoiceModeActiveRef.current = false;
      setIsRecording(false);
      await browserSpeechController.finishCurrentUtterance();
      browserSpeechController.stopRecognition();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      setRecordingStream(null);
      return;
    }

    await startContinuousVoiceListening();
  };

  const handleLanguageChange = (lang: LanguageItem, isAuto: boolean) => {
    setCurrentLanguage(lang);
    setUserLocale(lang.speechLocale);
    saveLanguagePreference(lang.code, isAuto);
    browserSpeechController.setLanguageLocale(lang.speechLocale);
  };

  const handleEndSession = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    browserSpeechController.cancelSpeech();
    browserSpeechController.stopRecognition();
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    setIsRecording(false);
    setIsPlayingAudio(false);
    isVoiceModeActiveRef.current = false;

    if (messages.length > 0) {
      if (window.confirm("End this active session and clear stage? Session is saved to your encrypted local vault.")) {
        setMessages([]);
      }
    }
  };

  const isSessionActive = isRecording || isPlayingAudio || isVoiceModeActiveRef.current;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────
          MOBILE NAVIGATION DRAWER (Slide-over from left)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide-over Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 270 }}
              className="relative w-72 max-w-[85vw] h-full bg-slate-950/95 border-r border-slate-800/90 backdrop-blur-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl"
            >
              <div className="space-y-6">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                      🌿
                    </div>
                    <div className="flex flex-col">
                      <span className="font-heading font-bold text-base text-slate-100 tracking-tight leading-tight">
                        EIH Sanctuary
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-medium font-mono">
                          {isBackendHealthy ? "Keyless Engine Online" : "Connecting..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                    aria-label="Close navigation menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Action Buttons */}
                <nav className="space-y-2">
                  <Link
                    href="/library"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5 shrink-0 text-teal-400" />
                    <span className="text-sm font-medium tracking-wide">
                      Clinical Library
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setIsCBTModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <Brain className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span className="text-sm font-medium tracking-wide">
                      CBT Protocols (20+)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setIsPranayamaOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <Wind className="w-5 h-5 shrink-0 text-cyan-400" />
                    <span className="text-sm font-medium tracking-wide">
                      Somatic Breathwork
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setIsHistoryOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <History className="w-5 h-5 shrink-0 text-slate-300" />
                    <span className="text-sm font-medium tracking-wide">
                      Encrypted History
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setActiveCrisisData(null);
                      setIsCrisisModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 transition-all duration-200"
                  >
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                    <span className="text-sm font-medium tracking-wide">
                      Crisis Helplines
                    </span>
                  </button>

                  {/* Trataka Module Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900/95 border border-amber-500/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Clinical Trataka</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full capitalize">
                        {recommendedTrataka ? `${recommendedTrataka} Prescribed` : '5-Stage'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      Neuroplastic attention training: 2-min safe gazing, DMN quieting &amp; active CBT reframe.
                    </p>
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        setIsTratakaOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-[0.98]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Begin {recommendedTrataka ? `${recommendedTrataka.toUpperCase()} Gazing` : 'Gazing Session'}</span>
                    </button>
                  </div>

                  {/* App Utilities Divider */}
                  <div className="pt-2 pb-1">
                    <div className="h-[1px] bg-slate-800/80 w-full" />
                  </div>

                  {/* Share Sanctuary Link */}
                  <button
                    onClick={handleShareApp}
                    className="flex items-center justify-between w-full p-3 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm font-medium">
                        {isCopied ? "Link Copied!" : "Share Sanctuary"}
                      </span>
                    </div>
                    {isCopied && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </span>
                    )}
                  </button>

                  {/* PWA Install Link */}
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleInstallClick();
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border border-slate-800/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">
                        {isAppInstalled ? "App Installed" : "Install App"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isAppInstalled
                          ? "text-emerald-400/80 bg-emerald-950/40 border border-emerald-800/40"
                          : "text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 animate-pulse"
                      }`}
                    >
                      PWA
                    </span>
                  </button>
                </nav>
              </div>

              {/* Bottom Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      Client Session
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate">
                      Zero-Knowledge AES-256
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          1. LEFT COLUMN: Tools & Navigation (Flex Column)
      ───────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="hidden md:flex md:w-64 shrink-0 flex-col justify-between bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/60 p-4 z-20 overflow-y-auto space-y-4"
      >
        {/* Top Header & Brand */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
              🌿
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-heading font-bold text-base text-slate-100 tracking-tight leading-tight">
                EIH Sanctuary
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="text-[11px] text-slate-400 font-medium font-mono">
                  {isBackendHealthy ? "FastAPI Keyless Engine" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <nav className="space-y-1.5">
            <Link
              href="/library"
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
              title="Clinical Knowledge Library"
            >
              <BookOpen className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-teal-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Clinical Library
              </span>
            </Link>

            <button
              onClick={() => setIsCBTModalOpen(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
              title="CBT Cognitive Restructuring Tools"
            >
              <Brain className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-emerald-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                CBT Protocols (20+)
              </span>
            </button>

            <button
              onClick={() => setIsPranayamaOpen(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
              title="Somatic Breathwork & Vagal Brake"
            >
              <Wind className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-cyan-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Somatic Breathwork
              </span>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
              title="Encrypted Session Vault (AES-GCM)"
            >
              <History className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-slate-300" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Encrypted History
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCrisisData(null);
                setIsCrisisModalOpen(true);
              }}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-800/60 transition-all duration-300 group"
              title="Emergency Crisis Support & Local Care Locator"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-rose-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Crisis Helplines
              </span>
            </button>

            {/* Clinical Trataka (Gazing) Focus Module Card - Left Side Column */}
            <div className="p-2.5 md:p-3 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900/70 to-slate-900/90 border border-amber-500/40 hover:border-amber-400/70 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.12)] group mt-1">
              {/* Desktop Full Card */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Clinical Trataka</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full capitalize">
                    {recommendedTrataka ? `${recommendedTrataka} Prescribed` : '5-Stage'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug mb-2">
                  Neuroplastic attention training: 2-min safe gazing, DMN quieting &amp; active CBT reframe.
                </p>
                <button
                  onClick={() => setIsTratakaOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Begin {recommendedTrataka ? `${recommendedTrataka.toUpperCase()} Gazing` : 'Gazing Session'}</span>
                </button>
              </div>

              {/* Compact / Mobile Icon Button */}
              <button
                onClick={() => setIsTratakaOpen(true)}
                className="md:hidden flex flex-col items-center justify-center w-full p-1.5 rounded-xl text-amber-400 hover:text-amber-200 hover:bg-amber-950/40 transition-all"
                title={`Clinical Trataka (${recommendedTrataka}) Module`}
              >
                <Eye className="w-5 h-5" />
                <span className="text-[9px] font-mono font-bold mt-1 text-amber-400/90">Trataka</span>
              </button>
            </div>

            {/* Divider for App Access & Utilities */}
            <div className="pt-2 pb-1">
              <div className="h-[1px] bg-slate-800/80 w-full" />
            </div>

            {/* Share Sanctuary Link */}
            <button
              onClick={handleShareApp}
              className="relative flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-transparent hover:border-cyan-500/30 transition-all duration-300 group"
              title="Share EIH Sanctuary Link"
            >
              <Share2 className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-cyan-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                {isCopied ? "Link Copied!" : "Share Sanctuary"}
              </span>
              {isCopied ? (
                <span className="hidden md:inline text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded ml-auto flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  <span>Copied</span>
                </span>
              ) : null}
            </button>

            {/* PWA Installation Link */}
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-emerald-500/30 transition-all duration-300 group"
              title="Install EIH as Desktop / Mobile App"
            >
              <Download className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-emerald-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                {isAppInstalled ? "App Installed" : "Install App"}
              </span>
              <span
                className={`hidden md:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ml-auto ${
                  isAppInstalled
                    ? "text-emerald-400/80 bg-emerald-950/40 border border-emerald-800/40"
                    : "text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 animate-pulse"
                }`}
              >
                PWA
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Language & User Profile */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
          <div className="flex items-center justify-center md:justify-start">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          <div className="hidden md:flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-200 truncate">
                Client Session
              </span>
              <span className="text-[10px] text-slate-500 font-mono truncate">
                Zero-Knowledge AES-256
              </span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER COLUMN: The Therapy Stage (Main Focus)
      ───────────────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 relative flex flex-col h-full h-screen max-h-screen overflow-hidden z-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950"
      >
        {/* TOP STATUS & PERSISTENT LANGUAGE SELECTOR HEADER */}
        <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile Navigation Drawer Trigger */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 active:scale-95 transition-all"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide">
                EIH Clinical Sanctuary
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Cognitive Neuro-Psychology &amp; Somatic Resilience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Live Telemetry Trigger */}
            <button
              onClick={() => setIsMobileTelemetryOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-[11px] text-slate-300 font-medium active:scale-95 transition-all"
              title="View Live Clinical Telemetry"
              aria-label="Open Clinical Telemetry"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSessionActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              <span className="font-mono text-[10px] text-emerald-400">
                {telemetry.percentages?.[telemetry.dominant_emotion] || 75}%
              </span>
            </button>

            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              variant="header"
            />
          </div>
        </header>

        {/* MOBILE QUICK PROTOCOL CHIPS (< md) */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-800/40 bg-slate-950/60 backdrop-blur-md overflow-x-auto no-scrollbar shrink-0 z-20">
          <button
            onClick={() => setIsTratakaOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          >
            <Eye className="w-3 h-3 text-amber-400" />
            <span>Trataka</span>
          </button>

          <button
            onClick={() => setIsPranayamaOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          >
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>Breathwork</span>
          </button>

          <button
            onClick={() => setIsCBTModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          >
            <Brain className="w-3 h-3 text-emerald-400" />
            <span>CBT Tools</span>
          </button>

          <button
            onClick={() => {
              setActiveCrisisData(null);
              setIsCrisisModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Crisis</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          >
            <History className="w-3 h-3 text-slate-400" />
            <span>Vault</span>
          </button>
        </div>

        {/* HYPNOTIC SPIRAL — ADAPTIVE CIRCULAR ANCHOR */}
        <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center p-4 sm:p-6 md:p-8 [container-type:size]">
          {/*
            Adaptive Responsive Circle:
            Uses min(76cqmin, 76vmin, 680px) and max-w/max-h constraints so when the
            screen gets short (laptop/mobile/landscape) or narrow, it automatically
            scales down smoothly to fit the visible stage without any clipping or cutting.
          */}
          <div
            className="relative rounded-full overflow-hidden opacity-65 aspect-square shrink-0 transition-all duration-300"
            style={{
              width: 'min(76cqmin, 76vmin, 680px)',
              height: 'min(76cqmin, 76vmin, 680px)',
              maxWidth: 'calc(100% - 2rem)',
              maxHeight: 'calc(100% - 2rem)',
              maskImage: 'radial-gradient(circle at center, black 80%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 80%, transparent 100%)',
            }}
          >
            <Image
              src="/hypnotic-circles.png"
              alt="Hypnotic Circle Anchor"
              aria-hidden="true"
              width={680}
              height={680}
              priority
              className="w-full h-full object-contain contrast-[1.15] brightness-105 select-none"
              style={{ animation: 'spin 50s linear infinite' }}
            />
          </div>
        </div>

        {/* CHAT STREAM — DIRECTLY ON MAIN STAGE LAYER */}
        <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth px-4 sm:px-6 py-4 space-y-6 relative z-10">
          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs shadow-lg max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 font-bold px-2 py-1 rounded hover:bg-rose-900/50 transition-all"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Messages List */}
          <div className="max-w-3xl w-full mx-auto space-y-4 pt-2 pb-6">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] md:max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-gradient-to-br from-emerald-900/60 to-teal-950/70 border border-emerald-500/30 text-emerald-50 rounded-br-sm shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                      : "bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-slate-800/80 text-slate-100 rounded-bl-sm shadow-xl backdrop-blur-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {m.sender === "ai" && m.recommended_trataka && (
                  <div className="mt-1.5 max-w-[88%] md:max-w-xl">
                    <button
                      onClick={() => {
                        setRecommendedTrataka(m.recommended_trataka!);
                        setIsTratakaOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Launch Prescribed Trataka Gazing ({m.recommended_trataka.toUpperCase()})</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1 px-1">
                  {m.timestamp && (
                    <span className="text-[10px] text-slate-500" suppressHydrationWarning>
                      {m.timestamp}
                    </span>
                  )}
                  {m.engine && (
                    <span className="text-[9px] text-emerald-400/70 font-mono">[{m.engine}]</span>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 w-fit"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Synthesizing response...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Area: Floating Centered Input Dock */}
        <div className="px-2.5 sm:px-6 pt-2 pb-3 sm:pb-6 shrink-0 flex justify-center bg-transparent relative z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl w-full mx-auto">
            <div className="rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 shadow-[0_10px_35px_rgba(0,0,0,0.6)] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all">
              {/* Pulsing Mic Button */}
              <button
                onClick={toggleRecording}
                disabled={isPlayingAudio || isEchoLocked}
                title={
                  isPlayingAudio
                    ? "Healer speaking (listening resumes automatically)"
                    : isEchoLocked
                    ? "Grace period (200ms echo lock)"
                    : isRecording
                    ? "Stop listening"
                    : "Continuous Voice (48kHz Noise Suppressed)"
                }
                className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 ${
                  isRecording
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/60 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : isPlayingAudio || isEchoLocked
                    ? "bg-slate-800/40 text-slate-600 opacity-60 cursor-not-allowed"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
                aria-label={isRecording ? "Stop voice listening" : "Start continuous voice"}
              >
                {isRecording ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* End Session Button Near Mic */}
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full bg-rose-950/40 hover:bg-rose-900/70 border border-rose-900/50 hover:border-rose-700 text-rose-300 hover:text-rose-100 transition-all duration-300 shadow-sm shrink-0 active:scale-95 group"
                title="End Active Clinical Session"
                aria-label="End session"
              >
                <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400 shrink-0" />
                <span className="hidden sm:inline text-xs font-semibold">End Session</span>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isPlayingAudio
                    ? "Healer speaking..."
                    : isRecording
                    ? "Listening in real-time..."
                    : "Speak freely or type..."
                }
                className="flex-1 bg-transparent px-2 sm:px-3 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none min-w-0"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputVal.trim()}
                className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shrink-0 active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.main>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE TELEMETRY DRAWER (Slide-over from right)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileTelemetryOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileTelemetryOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide-over Content */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 270 }}
              className="absolute inset-y-0 right-0 w-80 max-w-[88vw] h-full bg-slate-950/95 border-l border-slate-800/90 backdrop-blur-2xl p-4 flex flex-col justify-start overflow-y-auto space-y-4 z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Clinical Telemetry
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileTelemetryOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                  aria-label="Close telemetry menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Pill Card */}
              <div
                onClick={toggleRecording}
                className={`cursor-pointer transition-all duration-500 ${
                  isSessionActive
                    ? "relative flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400"
                    : "relative flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isSessionActive ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                    />
                    {isSessionActive && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isSessionActive ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      {isSessionActive ? "Clinic Active" : "Session Standby"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {isRecording
                        ? "48kHz Live Audio"
                        : isPlayingAudio
                        ? "Synthesizing Speech"
                        : "Tap to Start Voice"}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold ${
                    isSessionActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isSessionActive ? "Live" : "Idle"}
                </span>
              </div>

              {/* AI Voice Speech Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  {isAiMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-slate-300 font-medium">AI Voice Speech</span>
                </div>
                <button
                  onClick={() => setIsAiMuted(!isAiMuted)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    isAiMuted
                      ? "bg-rose-950/60 text-rose-300 border border-rose-800/80"
                      : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/80"
                  }`}
                >
                  {isAiMuted ? "Muted" : "Active"}
                </button>
              </div>

              {/* Waveform */}
              <div className="p-1 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                <AudioWaveform
                  stream={recordingStream}
                  isRecording={isRecording}
                  isPlayingAudio={isPlayingAudio}
                  isEchoLocked={isEchoLocked}
                />
              </div>

              {/* Emotion Telemetry */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Emotion Telemetry</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">
                    {telemetry.percentages?.[telemetry.dominant_emotion] || 75}%
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{telemetry.dominant_emotion}</span>
                  <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-800/60">
                    Primary
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Polyvagal:</span>
                    <span className="text-emerald-300 font-medium truncate max-w-[150px]">
                      {telemetry.polyvagal_state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Distortion:</span>
                    <span className="text-amber-300 font-medium truncate max-w-[150px]">
                      {telemetry.cbt_distortion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Triguna Equilibrium */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    <span>Triguna Equilibrium</span>
                  </span>
                  {activeTriguna?.state && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 truncate max-w-[130px]" title={activeTriguna.state}>
                      {activeTriguna.state.split('(')[0].trim()}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Sattva (Clarity)</span>
                      <span className="text-emerald-400 font-mono">{activeTriguna?.sattva ?? 68}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${activeTriguna?.sattva ?? 68}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Rajas (Arousal)</span>
                      <span className="text-amber-400 font-mono">{activeTriguna?.rajas ?? 22}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${activeTriguna?.rajas ?? 22}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Tamas (Inertia)</span>
                      <span className="text-slate-400 font-mono">{activeTriguna?.tamas ?? 10}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full transition-all duration-500"
                        style={{ width: `${activeTriguna?.tamas ?? 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {activeTriguna?.recommendation && (
                  <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800/80">
                    {activeTriguna.recommendation}
                  </p>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT COLUMN: Live Session Status & Telemetry (Flex Column)
      ───────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="hidden md:flex md:w-72 shrink-0 flex-col bg-slate-900/40 backdrop-blur-xl border-l border-slate-800/60 p-4 z-20 overflow-y-auto space-y-4"
      >
        <div className="space-y-4">
          {/* THE "CLINIC ACTIVE SESSION" COMPACT STATUS PILL FIX */}
          <div
            onClick={toggleRecording}
            className={`cursor-pointer transition-all duration-500 ${
              isSessionActive
                ? "relative flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400"
                : "relative flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSessionActive ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                />
                {isSessionActive && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                )}
              </div>
              <div className="hidden md:flex flex-col">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isSessionActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {isSessionActive ? "Clinic Active" : "Session Standby"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate">
                  {isRecording
                    ? "48kHz Live Audio"
                    : isPlayingAudio
                    ? "Synthesizing Speech"
                    : "Ready for Voice"}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                  isSessionActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {isSessionActive ? "Live" : "Idle"}
              </span>
            </div>
          </div>

          {/* AI Audio Mute & Speaker Controller */}
          <div className="hidden md:flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              {isAiMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-slate-300 font-medium">AI Voice Speech</span>
            </div>
            <button
              onClick={() => setIsAiMuted(!isAiMuted)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                isAiMuted
                  ? "bg-rose-950/60 text-rose-300 border border-rose-800/80"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/80"
              }`}
            >
              {isAiMuted ? "Muted" : "Active"}
            </button>
          </div>

          {/* Real-Time Audio Volume Waveform */}
          <div className="hidden md:block">
            <AudioWaveform
              stream={recordingStream}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              isEchoLocked={isEchoLocked}
            />
          </div>

          {/* Dominant Emotion & Diagnostic Card */}
          <div className="hidden md:block p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emotion Telemetry</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">
                {telemetry.percentages?.[telemetry.dominant_emotion] || 75}%
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{telemetry.dominant_emotion}</span>
              <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-800/60">
                Primary
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Polyvagal:</span>
                <span className="text-emerald-300 font-medium truncate max-w-[140px]">
                  {telemetry.polyvagal_state}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Distortion:</span>
                <span className="text-amber-300 font-medium truncate max-w-[140px]">
                  {telemetry.cbt_distortion}
                </span>
              </div>
            </div>
          </div>

          {/* Triguna Autonomic Balance Card */}
          <div className="hidden md:block p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Triguna Equilibrium</span>
              </span>
              {activeTriguna?.state && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 truncate max-w-[130px]" title={activeTriguna.state}>
                  {activeTriguna.state.split('(')[0].trim()}
                </span>
              )}
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Sattva (Clarity)</span>
                  <span className="text-emerald-400 font-mono">{activeTriguna?.sattva ?? 68}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeTriguna?.sattva ?? 68}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Rajas (Arousal)</span>
                  <span className="text-amber-400 font-mono">{activeTriguna?.rajas ?? 22}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeTriguna?.rajas ?? 22}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tamas (Inertia)</span>
                  <span className="text-slate-400 font-mono">{activeTriguna?.tamas ?? 10}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeTriguna?.tamas ?? 10}%` }}
                  />
                </div>
              </div>
            </div>

            {activeTriguna?.recommendation && (
              <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800/80">
                {activeTriguna.recommendation}
              </p>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ─────────────────────────────────────────────────────────────
          4. CLINICAL MODALS (ZERO ABSOLUTE OVERLAY IN FLOW)
      ───────────────────────────────────────────────────────────── */}
      <CBTKnowledgeModal
        isOpen={isCBTModalOpen}
        onClose={() => setIsCBTModalOpen(false)}
      />

      <PranayamaGuide
        isOpen={isPranayamaOpen}
        onClose={() => setIsPranayamaOpen(false)}
      />

      <EncryptedHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <CrisisModal
        isOpen={isCrisisModalOpen}
        crisisData={activeCrisisData}
        onClose={() => {
          setIsCrisisModalOpen(false);
          setActiveCrisisData(null);
        }}
      />

      {/* 5-Stage Clinical Trataka Neuro-Cognitive Gazing Module */}
      <TratakaModule
        isOpen={isTratakaOpen}
        onClose={() => setIsTratakaOpen(false)}
        activeCbtReframe={activeCbtReframe}
        conditionName={telemetry.dominant_emotion}
        userLocale={userLocale}
        recommendedMode={recommendedTrataka as any}
      />

      {/* PWA Installation Guidance & Action Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        deferredPrompt={deferredPrompt}
        isInstalled={isAppInstalled}
        onInstallSuccess={() => setIsAppInstalled(true)}
      />
    </div>
  );
}
