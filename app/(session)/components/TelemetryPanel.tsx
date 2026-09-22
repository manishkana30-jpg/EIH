"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import type { PsychologicalTelemetry, TrigunaAnalysis } from "@/lib/api/healer-client";
import type { VoiceAcousticState } from "@/lib/types/emotions";

export interface TelemetryPanelProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  isSessionActive: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  onToggleRecording: () => void;
  isAiMuted: boolean;
  onToggleAiMuted: () => void;
  telemetry: PsychologicalTelemetry;
  activeVoiceState: VoiceAcousticState | null;
  activeTriguna: TrigunaAnalysis | null;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = React.memo(({
  isMobile = false,
  isOpen = false,
  onClose,
  isSessionActive,
  isRecording,
  isPlayingAudio,
  onToggleRecording,
  isAiMuted,
  onToggleAiMuted,
  telemetry,
  activeVoiceState,
  activeTriguna,
}) => {
  const panelContent = (
    <div className="space-y-4">
      {/* Clinic Active Session Status Pill */}
      <button
        type="button"
        onClick={onToggleRecording}
        className={`w-full text-left cursor-pointer transition-all duration-500 ${
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
            <span className="text-[10px] text-slate-500 font-mono truncate">
              {isRecording
                ? "48kHz Live Audio"
                : isPlayingAudio
                ? "Synthesizing Speech"
                : "Ready for Voice"}
            </span>
          </div>
        </div>

        <div className="flex items-center">
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
      </button>

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
          onClick={onToggleAiMuted}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            isAiMuted
              ? "bg-rose-950/60 text-rose-300 border border-rose-800/80"
              : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/80"
          }`}
        >
          {isAiMuted ? "Muted" : "Active"}
        </button>
      </div>

      {/* Dominant Emotion & Diagnostic Card */}
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

        {/* Composite Emotional Dimensions */}
        {telemetry.percentages &&
          Object.entries(telemetry.percentages).filter(
            ([k]) =>
              k !== telemetry.dominant_emotion &&
              k !== "Relief" &&
              k !== "Grounding" &&
              k !== "Receptivity"
          ).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {Object.entries(telemetry.percentages)
                .filter(
                  ([k]) =>
                    k !== telemetry.dominant_emotion &&
                    k !== "Relief" &&
                    k !== "Grounding" &&
                    k !== "Receptivity"
                )
                .slice(0, 3)
                .map(([emo, pct]) => (
                  <span
                    key={emo}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400/80" />
                    <span>{emo}</span>
                    <span className="text-teal-300 font-semibold">{pct}%</span>
                  </span>
                ))}
            </div>
          )}

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
          <div className="flex items-center justify-between text-slate-400">
            <span>Voice State:</span>
            <span
              className="text-sky-300 font-medium truncate max-w-[140px]"
              title={
                activeVoiceState?.description ||
                telemetry.voice_state ||
                "Stable vocal resonance"
              }
            >
              {activeVoiceState?.description || telemetry.voice_state || "Stable resonance"}
            </span>
          </div>
        </div>
      </div>

      {/* Triguna Autonomic Balance Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Triguna Equilibrium</span>
          </span>
          {activeTriguna?.state && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 truncate max-w-[130px]"
              title={activeTriguna.state}
            >
              {activeTriguna.state.split("(")[0].trim()}
            </span>
          )}
        </div>

        <div className="space-y-2 text-[11px]">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Sattva (Clarity)</span>
              <span className="text-emerald-400 font-mono">
                {activeTriguna?.sattva ?? 68}%
              </span>
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
              <span className="text-amber-400 font-mono">
                {activeTriguna?.rajas ?? 22}%
              </span>
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
              <span className="text-slate-400 font-mono">
                {activeTriguna?.tamas ?? 10}%
              </span>
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
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
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
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Clinical Telemetry
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                  aria-label="Close telemetry menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {panelContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="hidden md:flex md:w-72 shrink-0 flex-col bg-slate-900/40 backdrop-blur-xl border-l border-slate-800/60 p-4 z-20 overflow-y-auto space-y-4 h-full min-h-0"
    >
      {panelContent}
    </motion.aside>
  );
});
TelemetryPanel.displayName = "TelemetryPanel";

export default TelemetryPanel;
