"use client";

import React from "react";
import { Mic, MicOff, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { useVoiceRouter } from "@/lib/hooks/useVoiceRouter";

interface VoiceRouterProps {
  onCrisisTrigger?: (crisisText: string) => void;
  className?: string;
}

export const VoiceRouter: React.FC<VoiceRouterProps> = ({
  onCrisisTrigger,
  className = "",
}) => {
  const {
    currentTier,
    connectionStatus,
    voiceState,
    latencyMs,
    audioLevel,
    crisisData,
    errorMessage,
    connect,
    disconnect,
  } = useVoiceRouter();

  React.useEffect(() => {
    if (crisisData && onCrisisTrigger) {
      onCrisisTrigger(crisisData.triggerCategory || crisisData.immediateDeflectionStatement || "Acute crisis detected");
    }
  }, [crisisData, onCrisisTrigger]);

  const isConnected = connectionStatus === "connected";
  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md text-xs ${className}`}
    >
      <button
        onClick={() => (isConnected ? disconnect() : connect())}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
          isConnected
            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
        }`}
        title={isConnected ? "Disconnect Neural Voice" : "Connect Neural Voice"}
      >
        {isConnected ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span>Connect Voice</span>
          </>
        )}
      </button>

      {isConnected && (
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? "bg-amber-400 animate-ping"
                  : isListening
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            <span className="capitalize">{voiceState}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-500">
            <span>Tier: {currentTier}</span>
            {latencyMs > 0 && <span>• {latencyMs}ms</span>}
          </div>

          {audioLevel > 0.05 && (
            <div className="flex items-center gap-0.5 h-3">
              <span
                className="w-1 bg-emerald-400 rounded-full transition-all"
                style={{ height: `${Math.min(100, audioLevel * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <span className="text-rose-400 text-[10px] truncate max-w-[140px]" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default VoiceRouter;
