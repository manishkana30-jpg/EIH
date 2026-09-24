"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Eye,
  Wind,
  Brain,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Mic,
  AlertTriangle,
  ArrowDown,
  PhoneOff,
  Send,
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import type { LanguageItem } from "@/lib/i18n/language-catalog";
import { AudioWaveform } from "./AudioWaveform";
import { KaraokeMessage, KaraokeState } from "./KaraokeMessage";
import { getTratakaModeLabel, normalizeTratakaMode, detectTratakaModeFromText } from "@/lib/knowledge/trataka-recommendations";
import type { PsychologicalTelemetry } from "@/lib/api/healer-client";
import type { VoiceAcousticState } from "@/lib/types/emotions";

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp?: string;
  engine?: string;
  recommended_trataka?: string;
  cbt_distortion?: string;
  locale?: string;
}

export interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  isSessionActive: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isEchoLocked: boolean;
  recordingStream: MediaStream | null;
  activeVoiceState: VoiceAcousticState | null;
  speakingMessageId: string | null;
  activeKaraoke: KaraokeState | null;
  activeWordRef: React.RefObject<HTMLSpanElement>;
  recommendedTrataka?: string;
  telemetry: PsychologicalTelemetry;
  currentLanguage: LanguageItem;
  onLanguageChange: (lang: LanguageItem, isAuto: boolean) => void;
  onOpenMobileNav: () => void;
  onOpenMobileTelemetry: () => void;
  onOpenWellnessFlow?: () => void;
  onOpenTrataka: (mode?: string) => void;
  onOpenPranayama: () => void;
  onOpenCBT: () => void;
  onOpenCrisis: () => void;
  onOpenHistory: () => void;
  onOpenGita: () => void;
  onToggleRecording: () => void;
  onEndSession: () => void;
  onSendMessage: (text?: string) => void;
  onPlayVoice: (text: string, locale?: string, messageId?: string) => void;
  onPauseVoice: () => void;
  onResumeVoice: () => void;
  onStopVoice: () => void;
  onToggleVoice: (messageId: string, text: string) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  showScrollBottom: boolean;
  onChatScroll: () => void;
  inputVal: string;
  setInputVal: (val: string) => void;
  messageStages?: Record<string, number>;
  onConfirmStage1?: (messageId: string) => void;
  onAdvanceStage?: (messageId: string, nextStage: number) => void;
  onPlayStageVoice?: (messageId: string, stageNum: number, speechText: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  errorMessage,
  onClearError,
  isSessionActive,
  isRecording,
  isPlayingAudio,
  isEchoLocked,
  recordingStream,
  activeVoiceState,
  speakingMessageId,
  activeKaraoke,
  activeWordRef,
  recommendedTrataka,
  telemetry,
  currentLanguage,
  onLanguageChange,
  onOpenMobileNav,
  onOpenMobileTelemetry,
  onOpenWellnessFlow,
  onOpenTrataka,
  onOpenPranayama,
  onOpenCBT,
  onOpenCrisis,
  onOpenHistory,
  onOpenGita,
  onToggleRecording,
  onEndSession,
  onSendMessage,
  onPlayVoice,
  onPauseVoice,
  onResumeVoice,
  onStopVoice,
  onToggleVoice,
  chatContainerRef,
  messagesEndRef,
  showScrollBottom,
  onChatScroll,
  inputVal,
  setInputVal,
  messageStages,
  onConfirmStage1,
  onAdvanceStage,
  onPlayStageVoice,
}) => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 relative flex flex-col h-full min-h-0 overflow-hidden z-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950"
    >
      {/* TOP STATUS & PERSISTENT LANGUAGE SELECTOR HEADER */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Navigation Drawer Trigger */}
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 active:scale-95 transition-all"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide">
              Emotional Intelligence Healer
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Cognitive Neuro-Psychology &amp; Somatic Resilience
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Live Telemetry Trigger */}
          <button
            onClick={onOpenMobileTelemetry}
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
            onLanguageChange={onLanguageChange}
            variant="header"
          />
        </div>
      </header>

      {/* MOBILE QUICK PROTOCOL CHIPS (< md) */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-800/40 bg-slate-950/60 backdrop-blur-md overflow-x-auto no-scrollbar shrink-0 z-20">
        <button
          onClick={() => onOpenTrataka()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
        >
          <Eye className="w-3 h-3 text-amber-400" />
          <span>{recommendedTrataka ? `${getTratakaModeLabel(recommendedTrataka)}` : "Trataka"}</span>
        </button>

        <button
          onClick={onOpenPranayama}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
        >
          <Wind className="w-3 h-3 text-cyan-400" />
          <span>Breathwork</span>
        </button>

        <button
          onClick={onOpenCBT}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
        >
          <Brain className="w-3 h-3 text-emerald-400" />
          <span>CBT Tools</span>
        </button>

        <button
          onClick={onOpenCrisis}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>Crisis</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
          title="Zero-Retention Privacy: 0 Records Stored"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>0-Retention</span>
        </button>
      </div>

      {/* AMBIENT BACKGROUND GLOW & AUDIO WAVEFORM */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none" aria-hidden="true">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] bg-gradient-to-b from-emerald-500/10 via-teal-600/5 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[550px] sm:w-[700px] h-[350px] bg-gradient-to-t from-emerald-950/20 via-teal-900/10 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl opacity-30" />

        <AudioWaveform
          stream={recordingStream}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          isEchoLocked={isEchoLocked}
        />
      </div>

      {/* CHAT STREAM CONTAINER */}
      <div
        ref={chatContainerRef}
        onScroll={onChatScroll}
        className={`flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 relative z-10 overscroll-contain ${
          messages.length === 0 ? "flex flex-col items-center justify-center" : "space-y-6"
        }`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#334155 transparent",
        }}
      >
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
              onClick={onClearError}
              className="text-rose-400 hover:text-rose-200 font-bold px-2 py-1 rounded hover:bg-rose-900/50 transition-all"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Empty State: Presence Orb */}
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="my-auto py-8 px-4 flex flex-col items-center text-center max-w-md mx-auto select-none"
          >
            {/* Interactive Pulsing Presence Orb */}
            <button
              onClick={onToggleRecording}
              disabled={isPlayingAudio || isEchoLocked}
              className="relative group mb-4 p-3 rounded-full focus:outline-none transition-transform active:scale-95"
              title={isRecording ? "Stop voice listening" : "Click to speak with EIH"}
              aria-label="Interactive voice activator"
            >
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl transition-all duration-500 border ${
                  isRecording
                    ? "bg-rose-500/20 border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.4)] animate-pulse"
                    : "bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-emerald-400/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.25)] group-hover:border-emerald-400/70 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                }`}
              >
                {isRecording ? (
                  <Mic className="w-7 h-7 text-rose-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-7 h-7 text-emerald-300 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <span
                className={`absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full border-2 border-slate-950 transition-colors duration-300 ${
                  isRecording ? "bg-rose-500 animate-ping" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                }`}
              />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 tracking-tight mb-1.5">
              {isRecording ? "Listening to your voice..." : "How can I support your calm today?"}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
              {isRecording
                ? "Speak freely. Your session is private and grounded in clinical care."
                : "Tap the mic, choose an interactive protocol, or type below."}
            </p>

            {/* Direct Protocol Launchers */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {onOpenWellnessFlow && (
                <button
                  onClick={onOpenWellnessFlow}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-500/15 hover:from-emerald-500/35 border border-emerald-400/60 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 group"
                  title="Voice-first guided journey: Mood -> Gita -> CBT -> Trataka"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition-transform animate-pulse" />
                  <span>4-Phase Guided Flow</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-400 text-slate-950 ml-0.5">
                    VOICE
                  </span>
                </button>
              )}

              <button
                onClick={onOpenPranayama}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 hover:border-teal-400/60 text-teal-300 text-xs font-medium transition-all shadow-sm active:scale-95 group"
              >
                <Wind className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span>Pranayama</span>
              </button>

              <button
                onClick={() => onOpenTrataka()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 text-xs font-medium transition-all shadow-sm active:scale-95 group"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Trataka Gazing</span>
              </button>

              <button
                onClick={onOpenCBT}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 text-xs font-medium transition-all shadow-sm active:scale-95 group"
              >
                <Brain className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>CBT Tools</span>
              </button>
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {[
                "Ground racing thoughts",
                "Calm chest tightness",
                "Reframe self-doubt",
                "Gita wisdom on peace",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(chip)}
                  className="px-3 py-1 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-all duration-200 active:scale-95"
                >
                  {chip} →
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Messages List */
          <div className="max-w-3xl w-full mx-auto space-y-5 pt-2 pb-16">
            {messages.map((m, index) => {
              const isLastMessage = index === messages.length - 1;
              const detectedTratak = m.sender === "ai" ? detectTratakaModeFromText(m.text) : null;
              const activeTratakMode =
                detectedTratak ||
                (m.recommended_trataka ? normalizeTratakaMode(m.recommended_trataka) : null) ||
                (recommendedTrataka ? normalizeTratakaMode(recommendedTrataka) : "bindu");

              const isCurrentlySpeaking =
                (speakingMessageId === m.id || activeKaraoke?.messageId === m.id) && isPlayingAudio;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col w-full ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <KaraokeMessage
                    message={m}
                    isSpeaking={isCurrentlySpeaking}
                    isPaused={false}
                    activeKaraoke={activeKaraoke?.messageId === m.id ? activeKaraoke : null}
                    activeWordRef={activeWordRef}
                    onPlay={() => onPlayVoice(m.text, undefined, m.id)}
                    onPause={onPauseVoice}
                    onResume={onResumeVoice}
                    onStop={onStopVoice}
                    onToggle={() => onToggleVoice(m.id, m.text)}
                    onLaunchTrataka={() => onOpenTrataka(activeTratakMode)}
                    onOpenCBT={onOpenCBT}
                    onOpenGita={onOpenGita}
                    isLastMessage={isLastMessage}
                    recommendedTratakaLabel={getTratakaModeLabel(activeTratakMode)}
                    currentStage={messageStages?.[m.id]}
                    onConfirmStage1={onConfirmStage1}
                    onAdvanceStage={onAdvanceStage}
                    onPlayStageVoice={onPlayStageVoice}
                  />
                </motion.div>
              );
            })}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-slate-300 px-3.5 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md w-fit shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Synthesizing empathetic response...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Latest Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-20 sm:bottom-24 right-4 sm:right-8 z-30"
          >
            <button
              onClick={() => {
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                } else if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs font-medium shadow-xl backdrop-blur-md transition-all active:scale-95"
              aria-label="Scroll to latest message"
            >
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Latest messages</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Input Dock */}
      <div className="px-2.5 sm:px-6 py-2.5 sm:py-3.5 shrink-0 flex justify-center bg-slate-950/95 border-t border-slate-800/60 backdrop-blur-2xl relative z-30 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl w-full mx-auto">
          {/* Voice Status Pill */}
          <div className="h-6 flex items-center justify-center pointer-events-none mb-1 text-center select-none" aria-live="polite">
            <AnimatePresence mode="wait">
              {isPlayingAudio ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-300 text-[11px] font-medium backdrop-blur-md shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>Assistant Speaking • Mic Suspended</span>
                </motion.div>
              ) : isEchoLocked ? (
                <motion.div
                  key="echolock"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-[11px] font-medium backdrop-blur-md shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Echo Shield Active (200ms)</span>
                </motion.div>
              ) : isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium backdrop-blur-md shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    {activeVoiceState && activeVoiceState.state === "trembling_distress"
                      ? "Attuned listening • Vocal tremor detected, take your time"
                      : activeVoiceState && activeVoiceState.state === "acute_hyperarousal"
                      ? "Active listening • Elevated vocal tension, breathe softly"
                      : activeVoiceState && activeVoiceState.state === "hypoarousal_depressed"
                      ? "Gentle listening • Flat vocal energy, no hurry at all"
                      : "Listening word-by-word • Speak freely at your own pace"}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 shadow-[0_10px_35px_rgba(0,0,0,0.6)] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all">
            {/* Pulsing Mic Button */}
            <button
              onClick={onToggleRecording}
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
                  ? "bg-rose-500/25 text-rose-400 border border-rose-500/70 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.45)]"
                  : isPlayingAudio || isEchoLocked
                  ? "bg-slate-800/40 text-slate-600 opacity-60 cursor-not-allowed"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 active:scale-95"
              }`}
              aria-label={isRecording ? "Stop voice listening" : "Start continuous voice"}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* End Session Button Near Mic */}
            <button
              onClick={onEndSession}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder={
                isPlayingAudio
                  ? "Healer speaking..."
                  : isRecording
                  ? "Listening in real-time..."
                  : "Share what's on your heart or speak freely..."
              }
              className="flex-1 bg-transparent px-2 sm:px-3 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none min-w-0"
            />

            {/* Send Button */}
            <button
              onClick={() => onSendMessage()}
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 sm:px-3.5 sm:py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shrink-0 active:scale-95 flex items-center gap-1.5"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Send</span>
            </button>
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default ChatArea;
