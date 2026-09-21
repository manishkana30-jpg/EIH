"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Shield, Radio, Sparkles } from "lucide-react";
import { browserSpeechController } from "@/lib/audio/browser-speech";

export interface VoiceRouterProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  onToggleListening?: () => void;
  onCancelSpeech?: () => void;
  className?: string;
}

export const VoiceRouter: React.FC<VoiceRouterProps> = ({
  isListening = false,
  isSpeaking = false,
  onToggleListening,
  onCancelSpeech,
  className = "",
}) => {
  const [echoGuardActive, setEchoGuardActive] = useState(true);
  const [activeSpeechLocale, setActiveSpeechLocale] = useState("en-US");

  useEffect(() => {
    // Sync active speech controller state
    if (typeof window !== "undefined") {
      setActiveSpeechLocale(navigator.language || "en-US");
    }
  }, []);

  const handleToggleMic = () => {
    if (onToggleListening) {
      onToggleListening();
    } else {
      if (isListening) {
        browserSpeechController.stopListening();
      } else {
        browserSpeechController.startRecognition();
      }
    }
  };

  const handleMuteSpeech = () => {
    if (onCancelSpeech) {
      onCancelSpeech();
    } else {
      browserSpeechController.cancelSpeech();
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-lg flex items-center justify-between gap-4 ${className}`}
    >
      {/* Voice Status Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`relative p-2.5 rounded-xl border transition-all ${
            isSpeaking
              ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              : isListening
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              : "bg-zinc-900 border-zinc-800 text-zinc-500"
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="w-5 h-5 animate-pulse" />
          ) : isListening ? (
            <Radio className="w-5 h-5 animate-spin" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}

          {/* Glowing Ping */}
          {(isSpeaking || isListening) && (
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${
                isSpeaking ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-200">
              {isSpeaking ? "Assistant Speaking" : isListening ? "Listening Actively" : "Voice Engine Idle"}
            </span>
            <Sparkles className="w-3 h-3 text-amber-400/80" />
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            {echoGuardActive ? "Echo Cancellation Active (2.4s Window)" : "Standard Capture"} • {activeSpeechLocale}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEchoGuardActive((prev) => !prev)}
          className={`p-2.5 rounded-xl border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
            echoGuardActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          title={echoGuardActive ? "Echo Guard: Enabled" : "Echo Guard: Disabled"}
          aria-label={echoGuardActive ? "Echo Guard Enabled" : "Echo Guard Disabled"}
        >
          <Shield className="w-4 h-4" />
        </button>

        {isSpeaking && (
          <button
            onClick={handleMuteSpeech}
            className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-300 hover:bg-amber-500/30 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500/50"
            title="Silence Assistant Speech"
            aria-label="Silence Assistant Speech"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleToggleMic}
          className={`px-4 py-2.5 rounded-xl border font-medium text-xs transition-all min-h-[44px] flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
            isListening
              ? "bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30"
              : "bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400"
          }`}
          title={isListening ? "Stop Microphone" : "Activate Microphone"}
          aria-label={isListening ? "Stop Microphone" : "Activate Microphone"}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 fill-current" />
              <span>Start Voice</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceRouter;
