'use client';

import React from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, Zap } from 'lucide-react';
import { VoiceRouterState, ConnectionStatus } from '@/lib/audio/voice-router';

interface ChatInputDockProps {
  textInput: string;
  onChangeText: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isConnected: boolean;
  isAiSpeaking: boolean;
  voiceState: VoiceRouterState;
  connectionStatus: ConnectionStatus;
  audioLevel: number;
  onToggleVoice: () => void;
  onBargeIn: () => void;
  onOpenHealingTools?: () => void;
  inputPlaceholder?: string;
}

export const ChatInputDock: React.FC<ChatInputDockProps> = ({
  textInput,
  onChangeText,
  onSubmit,
  isConnected,
  isAiSpeaking,
  voiceState,
  audioLevel,
  onToggleVoice,
  onBargeIn,
  onOpenHealingTools,
  inputPlaceholder = 'Share what is on your heart or tap voice...',
}) => {
  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'processing';

  return (
    <div className="w-full relative space-y-2 select-none">
      {/* Top Quick Actions Bar */}
      <div className="flex items-center justify-between px-2 text-[11px]">
        {onOpenHealingTools && (
          <button
            type="button"
            onClick={onOpenHealingTools}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161a22]/80 hover:bg-[#1f2824] border border-white/10 hover:border-[#00f59b]/50 text-[#81a890] hover:text-[#00f59b] transition-all shadow-sm group"
          >
            <Zap className="w-3.5 h-3.5 text-[#00f59b] group-hover:scale-110 transition-transform" />
            <span className="font-semibold tracking-wide">Healing Tools &amp; Clinical Guides ▲</span>
          </button>
        )}

        {isAiSpeaking && (
          <button
            type="button"
            onClick={onBargeIn}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] font-semibold animate-pulse shadow-sm"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Interrupt Voice</span>
          </button>
        )}
      </div>

      {/* Main Luxury Floating Gradient Hero Dock (Template Match) */}
      <div className="dock-gradient-luxury p-3.5 sm:p-4 rounded-[26px] sm:rounded-[30px] transition-all duration-500">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left Context & Text Input Area */}
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
            <div className="hidden sm:flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider text-white/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f59b]" />
              <span>Neuroscience &amp; Somatic Healing</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => onChangeText(e.target.value)}
                placeholder={
                  isThinking
                    ? 'Synthesizing empathetic clinical guidance...'
                    : inputPlaceholder
                }
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-white placeholder:text-white/40 px-1 py-1 focus:ring-0 font-normal leading-relaxed"
                disabled={isThinking}
              />
            </div>

            <p className="hidden sm:block text-[11px] text-white/60 font-light truncate mt-0.5">
              We create lasting calm through evidence-based cognitive &amp; somatic neuroscience.
            </p>
          </div>

          {/* Right Action Cluster Matching the Template's Capsule Button */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* If user typed text, show Send button */}
            {textInput.trim() ? (
              <button
                type="submit"
                disabled={isThinking}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#0c1410] hover:bg-black text-white text-xs font-semibold shadow-xl border border-white/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 text-[#00f59b]" />
              </button>
            ) : null}

            {/* Template Action Capsule Button with Iridescent Metallic Disc */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xl border ${
                isConnected
                  ? isListening
                    ? 'bg-[#0c1410] border-[#00f59b] text-[#00f59b] shadow-[0_0_20px_rgba(0,245,155,0.4)]'
                    : isThinking
                    ? 'bg-[#0c1410] border-amber-400 text-amber-300'
                    : 'bg-[#0c1410] border-white/20 text-white'
                  : 'bg-[#0c1410] hover:bg-black border-white/20 text-white hover:scale-[1.02] active:scale-95'
              }`}
              title={
                isConnected
                  ? isListening
                    ? 'Listening... Tap to stop voice'
                    : 'Active voice session. Tap to disconnect'
                  : 'Start Live Voice Session'
              }
            >
              {/* Iridescent Metallic Disc Icon */}
              <div className="relative w-5 h-5 rounded-full disc-metallic-shimmer flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                {isConnected ? (
                  isListening ? (
                    <Mic className="w-3 h-3 text-[#0c1410] animate-pulse" />
                  ) : isThinking ? (
                    <Sparkles className="w-3 h-3 text-[#0c1410] animate-spin" />
                  ) : (
                    <Mic className="w-3 h-3 text-[#0c1410]" />
                  )
                ) : (
                  <div className="w-2 h-2 rounded-full bg-[#00f59b] shadow-[0_0_8px_#00f59b]" />
                )}

                {/* Pulsing Audio Level Halo */}
                {isConnected && isListening && audioLevel > 0.05 && (
                  <span
                    className="absolute inset-0 rounded-full border border-[#00f59b] animate-ping opacity-75"
                    style={{
                      transform: `scale(${1 + Math.min(0.6, audioLevel * 1.2)})`,
                    }}
                  />
                )}
              </div>

              {/* Button Text */}
              <span className="text-xs font-semibold tracking-tight text-white whitespace-nowrap">
                {isConnected
                  ? isListening
                    ? 'Listening...'
                    : isThinking
                    ? 'Reflecting...'
                    : 'Voice Live'
                  : 'Start Voice →'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInputDock;

