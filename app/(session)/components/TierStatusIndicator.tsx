'use client';

import React from 'react';
import { Cloud, Radio, Cpu, Globe, Sliders, ShieldCheck } from 'lucide-react';
import { VoiceTier, ConnectionStatus } from '@/lib/audio/voice-router';

interface TierStatusIndicatorProps {
  currentTier: VoiceTier;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  onOpenSettings: () => void;
}

const TIER_DETAILS = {
  1: {
    name: 'Tier 1: Cloud Premium',
    badge: 'LiveKit WebRTC + Deepgram Nova-3 + BYOK + Cartesia Sonic',
    icon: Cloud,
    color: 'text-[var(--accent-sage)] border-[#588e73]/40 bg-[#588e73]/15',
  },
  2: {
    name: 'Tier 2: Cloud Free',
    badge: 'LiveKit WebRTC + Groq Llama 3.3 70B + Edge-TTS',
    icon: Radio,
    color: 'text-[var(--text-nature-secondary)] border-[#3d584a] bg-[#1b2a23]',
  },
  3: {
    name: 'Tier 3: Local Daemon',
    badge: 'Local WebSocket + Whisper + Ollama + Kokoro TTS (ws://127.0.0.1:8765)',
    icon: Cpu,
    color: 'text-[var(--accent-clay)] border-[#c48b71]/40 bg-[#c48b71]/15',
  },
  4: {
    name: 'Tier 4: Free Tier (Browser-Native Edge)',
    badge: '100% Free Tier • Web Speech + Edge Fallback + Client-Side AI (Zero Config)',
    icon: Globe,
    color: 'text-[var(--accent-sage)] border-[#588e73]/40 bg-[#588e73]/20',
  },
};

export const TierStatusIndicator: React.FC<TierStatusIndicatorProps> = ({
  currentTier,
  connectionStatus,
  latencyMs,
  onOpenSettings,
}) => {
  const current = TIER_DETAILS[currentTier];
  const Icon = current.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#14201a]/90 backdrop-blur-xl border border-[#283c32] text-xs">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl border ${current.color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-nature-primary)]">{current.name}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-[var(--accent-sage)] animate-ping'
                  : connectionStatus === 'connecting'
                  ? 'bg-[var(--accent-amber)] animate-pulse'
                  : connectionStatus === 'degraded'
                  ? 'bg-[var(--accent-clay)]'
                  : 'bg-[#647d70]'
              }`}
            />
          </div>
          <p className="text-[10px] text-[var(--text-nature-muted)] font-mono">{current.badge}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Latency Gauge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1b2a23] border border-[#283c32] text-[11px] font-mono">
          <span className="text-[var(--text-nature-muted)]">Latency:</span>
          <span
            className={`font-bold ${
              latencyMs < 300
                ? 'text-[var(--accent-sage)]'
                : latencyMs < 650
                ? 'text-[var(--text-nature-secondary)]'
                : 'text-[var(--accent-amber)]'
            }`}
          >
            {latencyMs}ms
          </span>
          <span className="text-[9px] text-[var(--text-nature-muted)] font-sans hidden sm:inline">(SLA &lt;650ms)</span>
        </div>

        {/* BYOK / Tier Config Switcher Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] hover:border-[#3d584a] text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all text-xs font-medium"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
          <span className="hidden sm:inline">Tier &amp; BYOK</span>
        </button>
      </div>
    </div>
  );
};

export default TierStatusIndicator;
