'use client';

import { useState, useEffect, useCallback } from 'react';
import { voiceRouter, VoiceTier, ConnectionStatus, VoiceState, VoiceMessage } from '../audio/voice-router';
import { CrisisDetectionResult } from '../safety/crisis-detector';
import { NeuroscienceDiagnosticResult } from '../knowledge/emotion-classifier';

export function useVoiceRouter() {
  const [currentTier, setCurrentTier] = useState<VoiceTier>(voiceRouter.getCurrentTier());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(voiceRouter.getConnectionStatus());
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceRouter.getVoiceState());
  const [latencyMs, setLatencyMs] = useState<number>(voiceRouter.getLatencyMs());
  const [messages, setMessages] = useState<VoiceMessage[]>(() => voiceRouter.getMessageHistory());
  const [crisisData, setCrisisData] = useState<CrisisDetectionResult | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [activeDiagnostic, setActiveDiagnostic] = useState<NeuroscienceDiagnosticResult>(voiceRouter.getDiagnostic());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubState = voiceRouter.onStateChange((s) => setVoiceState(s));
    const unsubTier = voiceRouter.onTierChange((t) => setCurrentTier(t));
    const unsubStatus = voiceRouter.onStatusChange((st) => setConnectionStatus(st));
    const unsubMsg = voiceRouter.onMessage((m) =>
      setMessages((prev) => {
        if (prev.some((existing) => existing.id === m.id)) {
          return prev;
        }
        return [...prev, m];
      })
    );
    const unsubCrisis = voiceRouter.onCrisisTrigger((c) => setCrisisData(c));
    const unsubLive = voiceRouter.onLiveTranscript((t) => setLiveTranscript(t));
    const unsubLvl = voiceRouter.onAudioLevel((lvl) => setAudioLevel(lvl));
    const unsubDiag = voiceRouter.onDiagnosticChange((d) => setActiveDiagnostic(d));
    const unsubErr = voiceRouter.onError((err) => setErrorMessage(err));

    return () => {
      unsubState();
      unsubTier();
      unsubStatus();
      unsubMsg();
      unsubCrisis();
      unsubLive();
      unsubLvl();
      unsubDiag();
      unsubErr();
    };
  }, []);

  const connect = useCallback(async (tier?: VoiceTier) => {
    setErrorMessage(null);
    return await voiceRouter.connect(tier);
  }, []);

  const disconnect = useCallback(() => {
    voiceRouter.disconnect();
    setLiveTranscript('');
  }, []);

  const switchTier = useCallback(async (tier: VoiceTier) => {
    await voiceRouter.switchTier(tier);
  }, []);

  const selectDiagnostic = useCallback((diag: NeuroscienceDiagnosticResult) => {
    voiceRouter.setDiagnostic(diag);
  }, []);

  const handleBargeIn = useCallback(() => {
    voiceRouter.handleBargeIn();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    await voiceRouter.processUserUtterance(text);
  }, []);

  const clearCrisis = useCallback(() => {
    setCrisisData(null);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    currentTier,
    connectionStatus,
    voiceState,
    latencyMs,
    messages,
    crisisData,
    liveTranscript,
    audioLevel,
    activeDiagnostic,
    errorMessage,
    connect,
    disconnect,
    switchTier,
    selectDiagnostic,
    handleBargeIn,
    sendMessage,
    clearCrisis,
    clearError,
    isConnected: connectionStatus === 'connected',
    isAiSpeaking: voiceState === 'speaking',
  };
}
