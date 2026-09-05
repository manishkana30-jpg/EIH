"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  Wind,
  History,
  ShieldAlert,
  Settings,
  Sliders,
  User,
  Volume2,
  VolumeX,
  Activity,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Sparkles,
  RefreshCw,
  Globe,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

import { healerClient, PsychologicalTelemetry, ClinicalSource, ChatHistoryItem } from "@/lib/api/healer-client";
import { AudioWaveform } from "./components/AudioWaveform";
import { CBTKnowledgeModal } from "./components/CBTKnowledgeModal";
import { PranayamaGuide } from "./components/PranayamaGuide";
import { EncryptedHistoryModal } from "./components/EncryptedHistoryModal";
import { CrisisModal } from "./components/CrisisModal";
import { SettingsModal } from "./components/SettingsModal";
import { LanguageSelector } from "./components/LanguageSelector";
import { BreathingVisualizerOrb } from "./components/BreathingVisualizerOrb";

import { browserSpeechController } from "@/lib/audio/browser-speech";
import { getCleanAudioStream } from "@/lib/audio/audio-manager";
import { VoiceTier } from "@/lib/audio/voice-router";
import {
  GLOBAL_LANGUAGE_CATALOG,
  LanguageItem,
  detectLocationAndLanguage,
  detectUserLocale,
  getStoredLanguage,
  saveLanguagePreference,
} from "@/lib/i18n/language-catalog";
import { saveLivePsychologyTelemetry } from "@/lib/telemetry/psychology-store";
import { getConditionById } from "@/lib/knowledge/psychology-library-rag";
import { saveSessionMessage } from "@/lib/db/indexed-db";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  engine?: string;
  sources?: ClinicalSource[];
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<VoiceTier>(4);

  // ─── Live Clinical Telemetry ───
  const [telemetry, setTelemetry] = useState<PsychologicalTelemetry>({
    dominant_emotion: "Calmness",
    polyvagal_state: "Ventral Vagal (Safe)",
    cbt_distortion: "None",
    percentages: { Calmness: 74, Relief: 58, Anxiety: 18 },
    strategy: "Active reflective listening",
  });

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
      };

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
        }
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
      browserSpeechController.stopRecognition();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      setRecordingStream(null);
      setIsRecording(false);
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
          1. LEFT COLUMN: Tools & Navigation (Flex Column)
      ───────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-16 sm:w-20 md:w-64 shrink-0 flex flex-col justify-between bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/60 p-3 md:p-4 z-20"
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
                  {isBackendHealthy ? "Neural Engine Active" : "Connecting..."}
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
              onClick={() => setIsCrisisModalOpen(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-800/60 transition-all duration-300 group"
              title="Emergency Crisis Support (988)"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-rose-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Crisis Helplines
              </span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-300 group"
              title="Voice Router Tier & BYOK"
            >
              <Sliders className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-amber-400" />
              <span className="hidden md:inline text-xs font-medium tracking-wide">
                Tier &amp; BYOK
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
        className="flex-1 flex flex-col justify-between overflow-hidden relative bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950"
      >
        {/* Psychological / Hypnotic Concentric Visual Anchor (Center Column Only) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden select-none">
          <div
            className="w-[420px] sm:w-[580px] md:w-[700px] h-[420px] sm:h-[580px] md:h-[700px] bg-[url('/hypnotic-circles.png')] bg-center bg-no-repeat bg-[length:50%] sm:bg-[length:60%] md:bg-[length:65%] opacity-15 animate-[spin_120s_linear_infinite] [mask-image:radial-gradient(circle_at_center,black_30%,transparent_70%)]"
            style={{ willChange: "transform" }}
          />
        </div>

        {/* Upper Area: Glowing Breathing Orb / Visualizer */}
        <div className="shrink-0 pt-4 px-4 z-10">
          <BreathingVisualizerOrb
            isRecording={isRecording}
            isPlayingAudio={isPlayingAudio}
            hasMessages={messages.length > 0}
            dominantEmotion={telemetry.dominant_emotion}
            onOrbClick={toggleRecording}
          />
        </div>

        {/* Middle Area: Scrollable Chat Stream with Fade Mask */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-2 space-y-4 [mask-image:linear-gradient(to_bottom,transparent_0%,black_30px,black_calc(100%-30px),transparent_100%)]">
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

                  {/* Render Clinical & Psychoeducational Solution Cards */}
                  {m.sender === "ai" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                      {m.sources.map((src, sIdx) => {
                        const isLibraryProtocol = src.source === "psychology_library";
                        if (isLibraryProtocol) {
                          return (
                            <div
                              key={sIdx}
                              className="bg-slate-950/80 rounded-xl p-3 border border-teal-800/50 shadow-sm space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-1 text-teal-300 font-semibold">
                                <span className="flex items-center gap-1.5">
                                  <span>📚</span>
                                  <span>{src.title}</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-teal-950/90 border border-teal-700/60 text-[10px] text-teal-300 uppercase tracking-wider font-mono">
                                  Verified Protocol
                                </span>
                              </div>

                              {src.summary && (
                                <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px] text-slate-300">
                                  {src.summary.split(" | ").map((part, pIdx) => {
                                    const [label, ...valParts] = part.split(": ");
                                    const val = valParts.join(": ");
                                    const icon = label.includes("CBT")
                                      ? "🧠"
                                      : label.includes("Somatic")
                                      ? "🧘"
                                      : label.includes("Pranayama")
                                      ? "🌬️"
                                      : "⏱️";
                                    return (
                                      <div
                                        key={pIdx}
                                        className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-0.5"
                                      >
                                        <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[10px] uppercase">
                                          <span>{icon}</span> {label}
                                        </span>
                                        <span className="text-slate-200 leading-normal pl-3">
                                          {val}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={sIdx}
                            className="text-[10px] text-slate-400 flex items-center gap-1"
                          >
                            <span className="text-emerald-400">🔬 PubMed Grounding:</span>
                            <span className="text-slate-300 truncate">{src.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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
                <span>Consulting PubMed &amp; Synthesizing clinical response...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Area: Floating Centered Input Dock */}
        <div className="shrink-0 p-4 z-20">
          <div className="max-w-2xl w-full mx-auto">
            <div className="rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl p-1.5 sm:p-2 flex items-center gap-2 shadow-[0_10px_35px_rgba(0,0,0,0.6)] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all">
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
                className={`p-3 rounded-full transition-all shrink-0 ${
                  isRecording
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/60 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : isPlayingAudio || isEchoLocked
                    ? "bg-slate-800/40 text-slate-600 opacity-60 cursor-not-allowed"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isRecording ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isPlayingAudio
                    ? "Healer speaking... (listening will resume shortly)"
                    : isRecording
                    ? "Listening to you in real-time..."
                    : "Speak freely or type what you are experiencing..."
                }
                className="flex-1 bg-transparent px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputVal.trim()}
                className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.main>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT COLUMN: Live Session Status & Telemetry (Flex Column)
      ───────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-16 sm:w-20 md:w-72 shrink-0 flex flex-col justify-between bg-slate-900/40 backdrop-blur-xl border-l border-slate-800/60 p-3 md:p-4 z-20 overflow-y-auto space-y-4"
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
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Sattva (Clarity)</span>
                  <span className="text-emerald-400 font-mono">68%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[68%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Rajas (Arousal)</span>
                  <span className="text-amber-400 font-mono">22%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[22%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tamas (Inertia)</span>
                  <span className="text-slate-400 font-mono">10%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full w-[10%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: End Session Button */}
        <div className="pt-2">
          <button
            onClick={handleEndSession}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/70 border border-rose-900/50 hover:border-rose-700 text-rose-300 hover:text-rose-100 transition-all duration-300 shadow-md text-xs font-semibold"
            title="End Active Clinical Session"
          >
            <PhoneOff className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">End Session</span>
          </button>
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
        crisisData={null}
        onClose={() => setIsCrisisModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentTier={currentTier}
        onSelectTier={(tier) => setCurrentTier(tier)}
      />
    </div>
  );
}
