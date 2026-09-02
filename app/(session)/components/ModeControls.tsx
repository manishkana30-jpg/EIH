'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Hand, MessageSquare, Wind, Settings, Square, Power, Radio } from 'lucide-react';
import { browserSpeechController } from '@/lib/audio/browser-speech';
import { VoiceState } from '@/lib/audio/voice-router';

interface ModeControlsProps {
  voiceState: VoiceState;
  isTextMode: boolean;
  audioLevel?: number;
  liveTranscript?: string;
  onToggleTextMode: () => void;
  onBargeIn: () => void;
  onOpenSettings?: () => void;
  onOpenBreathwork?: () => void;
  onConnectVoice?: () => void;
  onDisconnect?: () => void;
}

export const ModeControls: React.FC<ModeControlsProps> = ({
  voiceState,
  isTextMode,
  audioLevel = 0,
  liveTranscript = '',
  onToggleTextMode,
  onBargeIn,
  onOpenSettings,
  onOpenBreathwork,
  onConnectVoice,
  onDisconnect,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);

  const handleMicClick = async () => {
    if (voiceState === 'disconnected') {
      onConnectVoice?.();
      return;
    }
    if (isMuted) {
      setIsMuted(false);
      await browserSpeechController.startRecognition();
    } else {
      setIsMuted(true);
      browserSpeechController.stopRecognition();
    }
  };

  const handleStopListening = () => {
    browserSpeechController.stopRecognition();
    browserSpeechController.cancelSpeech();
    setIsMuted(false);
    onDisconnect?.();
  };

  const isLiveListening = voiceState === 'listening' && !isMuted;
  const isSpeaking = voiceState === 'speaking';
  const isConnected = voiceState !== 'disconnected';

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      {/* Live State & Interim Transcript Banner */}
      {(liveTranscript || isLiveListening || isSpeaking || isMuted) && isConnected && (
        <div className="w-full max-w-lg px-4 py-2 rounded-2xl glass-panel border border-slate-700/80 shadow-xl flex items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isMuted ? 'bg-amber-400' : isSpeaking ? 'bg-sky-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isMuted ? 'bg-amber-500' : isSpeaking ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <div className="truncate font-medium text-slate-200">
              {liveTranscript ? (
                <span className="text-emerald-300 font-mono italic font-semibold">"{liveTranscript}"</span>
              ) : isMuted ? (
                <span className="text-amber-300">Microphone Paused (Click Mic to Resume)</span>
              ) : isSpeaking ? (
                <span className="text-sky-300">Speaking... (Speak to Barge-in)</span>
              ) : (
                <span className="text-emerald-300">Listening to your voice...</span>
              )}
            </div>
          </div>

          {/* Real-Time Audio Level VU Meter */}
          {isLiveListening && (
            <div className="flex items-center gap-1 shrink-0" title="Microphone Input Amplitude">
              <div
                className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                style={{ height: `${Math.max(4, audioLevel * 18)}px` }}
              />
              <div
                className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                style={{ height: `${Math.max(6, audioLevel * 24)}px` }}
              />
              <div
                className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                style={{ height: `${Math.max(4, audioLevel * 16)}px` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Bottom Dock */}
      <div className="w-full bg-[#14201a]/90 backdrop-blur-xl rounded-2xl p-3 md:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl border border-[#283c32]">
        {/* Left Quick Action Modals */}
        <div className="flex items-center gap-1.5">
          {onOpenBreathwork && (
            <button
              onClick={onOpenBreathwork}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-xs font-medium text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all hover:border-[#588e73]/50 shadow-sm"
              title="Somatic Breath Regulation Coach"
            >
              <Wind className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
              <span className="hidden sm:inline">Breath</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-xs font-medium text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all hover:border-[#588e73]/50 shadow-sm"
              title="Tiers &amp; BYOK Configuration"
            >
              <Settings className="w-3.5 h-3.5 text-[var(--text-nature-muted)]" />
              <span className="hidden sm:inline">Tiers</span>
            </button>
          )}
        </div>

        {/* Center Audio Controls */}
        <div className="flex items-center gap-3 mx-auto">
          {/* Barge-in Interruption Button */}
          {isConnected && (
            <button
              onClick={onBargeIn}
              disabled={!isSpeaking}
              title="Barge-in: Interrupt assistant speech immediately"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-[#d4a373]/20 text-[#d4a373] border border-[#d4a373]/50 hover:bg-[#d4a373]/30 animate-pulse shadow-glow'
                  : 'bg-[#14201a]/50 text-[var(--text-nature-muted)] border border-[#283c32] cursor-not-allowed opacity-50'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barge-in</span>
            </button>
          )}

          {/* Primary Reactive Mic Button / Connect Button */}
          <button
            onClick={handleMicClick}
            title={
              voiceState === 'disconnected'
                ? 'Start Voice Session (Click to Listen)'
                : isMuted
                ? 'Unmute Microphone (Resume Listening)'
                : 'Pause Microphone (Mute Listening)'
            }
            className={`relative px-4 py-3 md:py-3.5 rounded-2xl transition-all duration-150 flex items-center gap-2 font-bold text-xs shadow-lg ${
              voiceState === 'disconnected'
                ? 'bg-[#588e73] text-[#0c1410] hover:bg-[#81a890] shadow-glow ring-4 ring-[#588e73]/30 animate-pulse px-6 py-3.5'
                : isMuted
                ? 'bg-[#d4a373]/20 border border-[#d4a373]/50 text-[#d4a373] hover:bg-[#d4a373]/30'
                : isLiveListening
                ? 'bg-[#588e73] text-[#0c1410] hover:bg-[#81a890] shadow-glow'
                : 'bg-[#81a890] text-[#0c1410] hover:bg-[#588e73]'
            }`}
            style={{
              transform: isLiveListening ? `scale(${1 + Math.min(0.2, audioLevel * 0.3)})` : 'scale(1)',
              boxShadow: isLiveListening
                ? `0 0 ${12 + audioLevel * 25}px rgba(88, 142, 115, ${0.5 + audioLevel * 0.5})`
                : undefined,
            }}
          >
            {voiceState === 'disconnected' ? (
              <>
                <Mic className="w-5 h-5" />
                <span>Start Listening</span>
              </>
            ) : isMuted ? (
              <>
                <MicOff className="w-4 h-4 text-[#d4a373]" />
                <span>Unmute Mic</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{isLiveListening ? 'Listening...' : 'Active'}</span>
              </>
            )}
          </button>

          {/* Dedicated Red Stop / Disconnect Button */}
          {isConnected && (
            <button
              onClick={handleStopListening}
              title="Stop Listening & End Voice Session"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white text-xs font-semibold shadow-sm transition-all hover:border-red-600"
            >
              <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
              <span>Stop</span>
            </button>
          )}

          {/* Text Mode Toggle */}
          <button
            onClick={onToggleTextMode}
            className={`p-2.5 md:p-3 rounded-xl transition-all border ${
              isTextMode
                ? 'bg-[#22382c] border-[#81a890] text-[var(--accent-sage)]'
                : 'bg-[#1b2a23] hover:bg-[#22382c] border-[#283c32] text-[var(--text-nature-secondary)]'
            }`}
            title={isTextMode ? 'Switch to Voice View' : 'Open Text Input'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Right Telemetry / Output Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsSpeakerMuted(!isSpeakerMuted);
              if (!isSpeakerMuted) {
                browserSpeechController.cancelSpeech();
              }
            }}
            className="p-2 rounded-lg text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
            title={isSpeakerMuted ? 'Unmute Audio Speaker' : 'Mute Audio Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b2a23] border border-[#283c32] text-[10px] font-mono text-[var(--text-nature-muted)]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                voiceState === 'disconnected'
                  ? 'bg-[#647d70]'
                  : isMuted
                  ? 'bg-[#d4a373]'
                  : isLiveListening
                  ? 'bg-[var(--accent-sage)] animate-ping'
                  : 'bg-[var(--accent-sage)]'
              }`}
            />
            <span>
              {voiceState === 'disconnected'
                ? 'Offline'
                : isMuted
                ? 'Mic Paused'
                : isLiveListening
                ? 'Live Voice'
                : voiceState}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeControls;
