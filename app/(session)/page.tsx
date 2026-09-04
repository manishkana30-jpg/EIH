"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { healerClient, PsychologicalTelemetry, ClinicalSource, ChatHistoryItem } from "@/lib/api/healer-client";
import { AudioWaveform } from "./components/AudioWaveform";
import { CBTKnowledgeModal } from "./components/CBTKnowledgeModal";
import { LanguageSelector } from "./components/LanguageSelector";
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
import { getConditionById } from "@/lib/knowledge/psychology-library-rag";


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
  const [currentLanguage, setCurrentLanguage] = useState<LanguageItem>(GLOBAL_LANGUAGE_CATALOG[0]);
  const [userLocale, setUserLocale] = useState<string>("en-US");
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isCBTModalOpen, setIsCBTModalOpen] = useState(false);

  // Live Clinical Telemetry from Backend
  const [telemetry, setTelemetry] = useState<PsychologicalTelemetry>({
    dominant_emotion: "Calmness",
    polyvagal_state: "Ventral Vagal (Safe)",
    cbt_distortion: "None",
    percentages: { Calmness: 74, Relief: 58, Anxiety: 18 },
    strategy: "Active reflective listening",
  });

  // Voice STT, Audio Playback & VAD Echo Avoidance State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isEchoLocked, setIsEchoLocked] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const isPlayingAudioRef = useRef(false);
  const isEchoLockedRef = useRef(false);
  const isVoiceModeActiveRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitializedRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);
  const currentLanguageRef = useRef<LanguageItem>(currentLanguage);
  const userLocaleRef = useRef<string>("en-US");

  // Keep refs in sync for safe access inside callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    userLocaleRef.current = userLocale;
  }, [userLocale]);

  // Automatic Geo-Location & Language Pack Detection on Launch
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Detect browser locale immediately
    const initialLocale = detectUserLocale();
    setUserLocale(initialLocale);

    healerClient.checkHealth().then((healthy) => setIsBackendHealthy(healthy));

    detectLocationAndLanguage().then((loc) => {
      const { code, isAuto } = getStoredLanguage();
      const targetCode = isAuto && loc.defaultLanguageCode ? loc.defaultLanguageCode : code;
      const matchedLang = GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === targetCode) || GLOBAL_LANGUAGE_CATALOG[0];
      
      setCurrentLanguage(matchedLang);
      setUserLocale(matchedLang.speechLocale);
      browserSpeechController.setLanguageLocale(matchedLang.speechLocale);

      // Check if URL specifies a condition focus (e.g., ?focus=gad)
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

  // 2. VAD & ECHO AVOIDANCE: Unified, bulletproof audio playback with echo cancellation & autoplay recovery
  const playVoice = useCallback((text: string, audioBase64?: string) => {
    const cleanText = browserSpeechController.cleanTextForSpeech(text);
    if (!cleanText && !audioBase64) return;

    // Pause active recognition during speech synthesis to prevent echo feedback
    browserSpeechController.stopRecognition();
    setIsRecording(false);

    // Stop and clean up any previously active audio track
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

      // Re-engage continuous listening with 200ms grace period if in voice mode
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
          console.warn("Direct base64 audio failed, using browser speech fallback:", e);
          browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio autoplay blocked or interrupted, using browser speech fallback:", err);
            browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
          });
        }
        return;
      } catch (err) {
        console.error("Base64 audio initialization error:", err);
      }
    }

    // Direct streaming fallback via browserSpeechController
    browserSpeechController.speak(cleanText || text, undefined, handleAudioEnd);
  }, []);

  const playBase64Audio = useCallback((audioBase64: string, fallbackText?: string) => {
    playVoice(fallbackText || "", audioBase64);
  }, [playVoice]);

  // Dispatch message with State Mutex & History Packaging
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!messageText || isSendingRef.current) return;

    // Stop active audio if user speaks/sends
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
      if (response.telemetry) {
        setTelemetry({
          ...response.telemetry,
          percentages: response.telemetry.percentages || {
            [response.telemetry.dominant_emotion || "Calmness"]: 75,
          },
        });
        saveLivePsychologyTelemetry(response.telemetry, messageText);
      }

      // VOICE RESPONSE PLAYBACK: High-Fidelity Edge Neural Voice
      playVoice(response.reply, response.audio_base64);
    } catch (error) {
      console.error("Chat communication notice:", error);
      setErrorMessage("Unable to reach the clinical reasoning engine. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // Start continuous voice listening with intelligent long-pause completion
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

  // Handle language switch (manual or auto detection)
  const handleLanguageChange = (lang: LanguageItem, isAuto: boolean) => {
    setCurrentLanguage(lang);
    setUserLocale(lang.speechLocale);
    saveLanguagePreference(lang.code, isAuto);
    browserSpeechController.setLanguageLocale(lang.speechLocale);
  };

  // Start/Stop Voice Recognition with Hands-Free Turn Taking
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c1410] text-[#ecf3ee] font-sans overflow-hidden">
      {/* 1. TOP HEADER */}
      <header className="h-14 border-b border-[#283c32] px-4 flex items-center justify-between bg-[#14201a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b2a23] border border-[#283c32] text-xs text-[#9cb5a6]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? "bg-[#81a890] animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="font-medium">
              {isBackendHealthy ? "Backend Connected" : "Connecting..."}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b2a23] border border-[#283c32] text-xs text-[#9cb5a6]">
            <span>🍃</span>
            <span>FastAPI Key-Free</span>
          </div>

          <Link
            href="/library"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/70 hover:bg-teal-900/90 border border-teal-700/60 text-xs text-teal-300 font-medium transition-all shadow-sm"
          >
            <span>📚</span>
            <span className="hidden sm:inline">Clinical Library</span>
          </Link>

          <button
            onClick={() => setIsCBTModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/60 text-xs text-emerald-300 font-medium transition-all shadow-sm"
          >
            <span>🧠</span>
            <span className="hidden sm:inline">CBT Tools (20+)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Automatic Geo-Location Language Pack Selector */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          <span className="px-2.5 py-0.5 rounded-full bg-[#1b2a23] border border-[#283c32] text-[11px] uppercase tracking-wider text-[#81a890] font-bold">
            EIH
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#647d70] font-semibold hidden sm:inline">
            Emotional Intelligence Healer
          </span>
        </div>
      </header>

      {/* 2. CONVERSATION STREAM */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-[#283c32] rounded-2xl bg-[#14201a]/60 backdrop-blur-sm my-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-2xl shadow-inner">
              🌿
            </div>
            <h2 className="text-base font-semibold text-[#ecf3ee]">
              Clinical Session Active
            </h2>
            <p className="text-xs text-[#9cb5a6] max-w-sm leading-relaxed">
              Speak freely using the microphone or type below. Your input will be analyzed with neuropsychological and Ayurvedic grounding.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-bold px-1.5 py-0.5 rounded hover:bg-rose-900/50"
            >
              ✕
            </button>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-md p-4 rounded-2xl text-sm leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#22382c] border border-[#3d584a] text-[#ecf3ee] rounded-br-none"
                  : "bg-[#17241d] border border-[#283c32] text-[#ecf3ee] rounded-bl-none shadow-lg"
              }`}
            >
              <div>{m.text}</div>

              {/* Render Clinical & Psychoeducational Solution Card */}
              {m.sender === "ai" && m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#283c32]/80 space-y-2">
                  {m.sources.map((src, sIdx) => {
                    const isLibraryProtocol = src.source === "psychology_library";
                    if (isLibraryProtocol) {
                      return (
                        <div
                          key={sIdx}
                          className="bg-[#0f1a14]/90 rounded-xl p-3 border border-teal-800/60 shadow-sm space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1 text-teal-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm">📚</span>
                              <span>{src.title}</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-700/50 text-[10px] text-teal-300 uppercase tracking-wider font-mono">
                              Verified Protocol
                            </span>
                          </div>

                          {src.summary && (
                            <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px] text-[#9cb5a6]">
                              {src.summary.split(" | ").map((part, pIdx) => {
                                const [label, ...valParts] = part.split(": ");
                                const val = valParts.join(": ");
                                const icon =
                                  label.includes("CBT") ? "🧠" :
                                  label.includes("Somatic") ? "🧘" :
                                  label.includes("Pranayama") ? "🌬️" : "⏱️";
                                return (
                                  <div
                                    key={pIdx}
                                    className="p-1.5 rounded-lg bg-[#14221a] border border-[#23352b] flex flex-col gap-0.5"
                                  >
                                    <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[10px] uppercase">
                                      <span>{icon}</span> {label}
                                    </span>
                                    <span className="text-gray-200 leading-normal pl-4">{val}</span>
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
                        className="text-[10px] text-[#647d70] flex items-center gap-1"
                      >
                        <span>🔬 Evidence:</span>
                        <span className="text-[#9cb5a6] truncate">{src.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 px-1">
              {m.timestamp && (
                <span className="text-[10px] text-[#647d70]" suppressHydrationWarning>
                  {m.timestamp}
                </span>
              )}
              {m.engine && (
                <span className="text-[9px] text-[#81a890] font-mono">[{m.engine}]</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#9cb5a6] px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81a890] animate-ping" />
            <span>Consulting PubMed & Synthesizing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 3. FLOATING TELEMETRY & INPUT DOCK */}
      <footer className="w-full pb-4 pt-2 bg-gradient-to-t from-[#0c1410] via-[#0c1410] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {/* Live 27-D Emotion Percentage Bar */}
          <div className="bg-[#14201a]/95 backdrop-blur-md border border-[#283c32] rounded-xl p-2 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-[#1b2a23] border border-[#3d584a] text-xs text-[#81a890] font-medium">
                🌿 {telemetry.dominant_emotion} (
                {telemetry.percentages?.[telemetry.dominant_emotion] || 70}%)
              </span>
              <span className="px-2 py-1 rounded-lg bg-[#1b2a23] border border-[#283c32] text-xs text-[#9cb5a6]">
                {telemetry.polyvagal_state}
              </span>
              <span className="px-2 py-1 rounded-lg bg-[#1b2a23] border border-[#283c32] text-xs text-[#c48b71]">
                CBT: {telemetry.cbt_distortion}
              </span>
            </div>
          </div>

          {/* 4. REAL-TIME AUDIO VOLUME WAVEFORM & ECHO INDICATOR */}
          <AudioWaveform
            stream={recordingStream}
            isRecording={isRecording}
            isPlayingAudio={isPlayingAudio}
            isEchoLocked={isEchoLocked}
          />

          {/* Input Bar */}
          <div className="bg-[#14201a] border border-[#283c32] focus-within:border-[#81a890] rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl">
            <button
              onClick={toggleRecording}
              disabled={isPlayingAudio || isEchoLocked}
              title={
                isPlayingAudio
                  ? "Assistant Speaking (Mic Locked)"
                  : isEchoLocked
                  ? "Echo Grace Period (200ms)"
                  : isRecording
                  ? "Stop Recording"
                  : "Voice Input (48kHz Noise Suppressed)"
              }
              className={`p-2.5 rounded-xl transition-all ${
                isRecording
                  ? "bg-red-900/80 text-red-200 border border-red-500 animate-pulse"
                  : isPlayingAudio || isEchoLocked
                  ? "bg-[#1b2a23]/50 text-[#647d70] opacity-50 cursor-not-allowed"
                  : "bg-[#1b2a23] hover:bg-[#283c32] text-[#9cb5a6]"
              }`}
            >
              🎙️
            </button>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                isPlayingAudio
                  ? "Healer speaking... (listening will resume shortly)"
                  : "Speak or type what you are experiencing..."
              }
              className="flex-1 bg-transparent px-2 text-sm text-[#ecf3ee] placeholder-[#647d70] focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputVal.trim()}
              className="px-4 py-2 bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-semibold text-xs rounded-xl transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </footer>

      {/* 4. CBT CLINICAL KNOWLEDGE & AUTO-UPGRADE MODAL */}
      <CBTKnowledgeModal
        isOpen={isCBTModalOpen}
        onClose={() => setIsCBTModalOpen(false)}
      />
    </div>
  );
}
