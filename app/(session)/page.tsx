"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  getStoredLanguage,
  saveLanguagePreference,
} from "@/lib/i18n/language-catalog";
import { saveLivePsychologyTelemetry } from "@/lib/telemetry/psychology-store";
import { generateDynamicCompanionReply } from "@/lib/nlp/conversational-companion-engine";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "I am here with you. Take a slow breath and share whatever has been weighing on you.",
      timestamp: "",
    },
  ]);
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

  // Keep refs in sync for safe access inside callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  // Automatic Geo-Location & Language Pack Detection on Launch
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    healerClient.checkHealth().then((healthy) => setIsBackendHealthy(healthy));

    detectLocationAndLanguage().then((loc) => {
      const { code, isAuto } = getStoredLanguage();
      const targetCode = isAuto && loc.defaultLanguageCode ? loc.defaultLanguageCode : code;
      const matchedLang = GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === targetCode) || GLOBAL_LANGUAGE_CATALOG[0];
      
      setCurrentLanguage(matchedLang);
      browserSpeechController.setLanguageLocale(matchedLang.speechLocale);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === "init"
            ? { ...msg, text: matchedLang.companionGreeting, timestamp: getFormattedTime() }
            : msg
        )
      );
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

  // 2. VAD & ECHO AVOIDANCE: Automatic mic detachment & 200ms grace period on playback completion
  const playBase64Audio = useCallback((audioBase64: string, fallbackText?: string) => {
    try {
      // Pause active listening during speech synthesis to prevent echo feedback
      browserSpeechController.stopRecognition();
      setIsRecording(false);

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      activeAudioRef.current = audio;
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

      audio.onended = handleAudioEnd;
      audio.onerror = () => {
        console.warn("Direct HTML5 base64 audio failed, using browser speech fallback...");
        if (fallbackText) {
          browserSpeechController.speak(fallbackText, undefined, handleAudioEnd);
        } else {
          handleAudioEnd();
        }
      };

      audio.play().catch((err) => {
        console.warn("Audio autoplay blocked, using browser speech fallback:", err);
        if (fallbackText) {
          browserSpeechController.speak(fallbackText, undefined, handleAudioEnd);
        } else {
          handleAudioEnd();
        }
      });
    } catch (err) {
      console.error("Audio playback error:", err);
      isPlayingAudioRef.current = false;
      isEchoLockedRef.current = false;
      setIsPlayingAudio(false);
      setIsEchoLocked(false);
      if (fallbackText) {
        browserSpeechController.speak(fallbackText);
      }
    }
  }, []);

  // Dispatch message with State Mutex & History Packaging
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!messageText || isSendingRef.current) return;

    // Stop active audio if user speaks/sends
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
    }
    browserSpeechController.cancelSpeech();

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
      .filter((m) => m.id !== "init" && m.text.trim())
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
        currentLanguageRef.current.code
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
      if (response.audio_base64) {
        playBase64Audio(response.audio_base64, response.reply);
      } else {
        // Direct neural streaming fallback via /api/voice
        setIsPlayingAudio(true);
        isPlayingAudioRef.current = true;
        isEchoLockedRef.current = true;
        setIsEchoLocked(true);
        browserSpeechController.speak(
          response.reply,
          undefined,
          () => {
            setIsPlayingAudio(false);
            isPlayingAudioRef.current = false;
            setTimeout(() => {
              setIsEchoLocked(false);
              isEchoLockedRef.current = false;
              if (isVoiceModeActiveRef.current) {
                startContinuousVoiceListening();
              }
            }, 200);
          }
        );
      }
    } catch (error) {
      console.error("Chat communication notice:", error);
      const companion = generateDynamicCompanionReply({
        userText: messageText,
      });
      const fallbackReply = companion.reply || "I am here with you. Take a steady breath and let's explore this step by step.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai-fallback`,
          sender: "ai",
          text: fallbackReply,
          timestamp: getFormattedTime(),
          engine: "Cognitive Companion Engine (Ayurvedic & Neuro Grounded)",
        },
      ]);

      setIsPlayingAudio(true);
      isPlayingAudioRef.current = true;
      isEchoLockedRef.current = true;
      setIsEchoLocked(true);
      browserSpeechController.speak(fallbackReply, undefined, () => {
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        setTimeout(() => {
          setIsEchoLocked(false);
          isEchoLockedRef.current = false;
          if (isVoiceModeActiveRef.current) {
            startContinuousVoiceListening();
          }
        }, 200);
      });
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

  // Handle language switch (manual or auto GPS)
  const handleLanguageChange = (lang: LanguageItem, isAuto: boolean) => {
    setCurrentLanguage(lang);
    saveLanguagePreference(lang.code, isAuto);
    browserSpeechController.setLanguageLocale(lang.speechLocale);

    // If pristine session, localize the initial greeting
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === "init" && prev.length === 1
          ? { ...msg, text: lang.companionGreeting }
          : msg
      )
    );
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

          <button
            onClick={() => setIsCBTModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/60 text-xs text-emerald-300 font-medium transition-all shadow-sm"
          >
            <span>🧠</span>
            <span className="hidden sm:inline">CBT Library (20+)</span>
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
              {m.text}
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

          {/* 5. LOCALIZED GEO-LANGUAGE STARTER PROMPTS */}
          {messages.length <= 2 && currentLanguage.companionPrompts && currentLanguage.companionPrompts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-fade-in">
              {currentLanguage.companionPrompts.slice(0, 4).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={isLoading || isPlayingAudio}
                  className="px-2.5 py-1 rounded-full bg-[#17241d] hover:bg-[#22382c] border border-[#283c32] hover:border-[#3d584a] text-xs text-[#9cb5a6] hover:text-[#ecf3ee] transition-all shrink-0 whitespace-nowrap shadow-sm flex items-center gap-1.5"
                >
                  <span className="text-[11px]">{currentLanguage.flag}</span>
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>
          )}

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
