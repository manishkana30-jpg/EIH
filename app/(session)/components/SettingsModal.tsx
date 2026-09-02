'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Key,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Cloud,
  Radio,
  Cpu,
  Globe,
  RefreshCw,
  Sliders,
  AlertCircle,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Server,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VoiceTier } from '@/lib/audio/voice-router';
import {
  saveEncryptedApiKey,
  clearUserApiKey,
  hasStoredApiKey,
  getKeyMetadata,
  KeyMetadata,
} from '@/lib/crypto/key-store';
import { localSocketClient } from '@/lib/audio/local-socket-client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: VoiceTier;
  onSelectTier: (tier: VoiceTier) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
}) => {
  // Expanded card for configuration
  const [expandedTier, setExpandedTier] = useState<VoiceTier | null>(null);

  // Input states for tier credentials (never pre-filled with plaintext)
  const [tier1KeyInput, setTier1KeyInput] = useState<string>('');
  const [tier2Input, setTier2Input] = useState<string>('');
  const [tier3UrlInput, setTier3UrlInput] = useState<string>('ws://127.0.0.1:8765');

  // Security & visibility states
  const [showTier1Password, setShowTier1Password] = useState<boolean>(false);
  const [showTier2Password, setShowTier2Password] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  const [hasExistingTier2, setHasExistingTier2] = useState<boolean>(false);
  const [key1Meta, setKey1Meta] = useState<KeyMetadata>({ exists: false });
  const [key2Meta, setKey2Meta] = useState<KeyMetadata>({ exists: false });

  // Validation & feedback states
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<{ tier: VoiceTier; message: string } | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<'idle' | 'online' | 'offline'>('idle');

  useEffect(() => {
    if (isOpen) {
      // Load stored key metadata without exposing plaintext keys to the UI state
      getKeyMetadata('user_byok_key').then((meta) => {
        setKey1Meta(meta);
        setHasExistingKey(meta.exists);
        setTier1KeyInput(''); // Always clean/zero-plaintext
      });

      getKeyMetadata('tier2_credential').then((meta) => {
        setKey2Meta(meta);
        setHasExistingTier2(meta.exists);
        setTier2Input(''); // Always clean/zero-plaintext
      });

      // Probe local daemon status
      localSocketClient.probe().then((alive) => {
        setDaemonStatus(alive ? 'online' : 'offline');
      });

      setValidationError(null);
      setValidationSuccess(null);
      setExpandedTier(null);
    }
  }, [isOpen]);

  // Handle tier selection or opening its requirements panel
  const handleTierCardClick = (tier: VoiceTier) => {
    setValidationError(null);
    setValidationSuccess(null);

    if (tier === 4) {
      // Tier 4: Free Tier - zero requirements needed!
      setExpandedTier(null);
      onSelectTier(4);
      setValidationSuccess('Free Tier is now active! Zero API keys or local servers required.');
      return;
    }

    // Toggle expansion of requirements panel for Tier 1, 2, or 3
    setExpandedTier((prev) => (prev === tier ? null : tier));
  };

  // Validate and Save Tier 1 (Cloud Premium)
  const handleSaveTier1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(null);

    const cleanKey = tier1KeyInput.trim();
    if (!cleanKey) {
      setValidationError({
        tier: 1,
        message: 'API key cannot be empty. Please provide an authentic OpenAI (sk-...), Anthropic (sk-ant-...), or Gemini (AIzaSy...) key.',
      });
      return;
    }

    const isOpenAi = cleanKey.startsWith('sk-') || cleanKey.startsWith('sk-proj-');
    const isAnthropic = cleanKey.startsWith('sk-ant-');
    const isGemini = cleanKey.startsWith('AIzaSy');
    const isSufficientLength = cleanKey.length >= 20;

    if ((!isOpenAi && !isAnthropic && !isGemini) || !isSufficientLength) {
      setValidationError({
        tier: 1,
        message: 'Invalid key format. Please enter an authentic OpenAI key (starting with sk- or sk-proj-), Anthropic key (sk-ant-), or Gemini key (AIzaSy-) with at least 20 characters.',
      });
      return;
    }

    setIsValidating(true);
    try {
      await saveEncryptedApiKey(cleanKey, 'user_byok_key');
      setTier1KeyInput(''); // Immediately clear from memory
      const meta = await getKeyMetadata('user_byok_key');
      setKey1Meta(meta);
      setHasExistingKey(true);
      onSelectTier(1);
      setValidationSuccess('Authentic API key encrypted (AES-256-GCM) & saved in device vault! Tier 1 (Cloud Premium) is now active.');
      setExpandedTier(null);
    } catch {
      setValidationError({
        tier: 1,
        message: 'Failed to encrypt and store API key. Please check your browser storage or select another tier.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Validate and Save Tier 2 (Cloud Free)
  const handleSaveTier2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(null);

    const cleanInput = tier2Input.trim();
    if (!cleanInput) {
      setValidationError({
        tier: 2,
        message: 'Please provide a valid Groq API Key (starts with gsk_...) or a custom LiveKit WebRTC server URL (wss://...).',
      });
      return;
    }

    const isGroq = cleanInput.startsWith('gsk_') && cleanInput.length >= 20;
    const isLiveKitUrl = (cleanInput.startsWith('wss://') || cleanInput.startsWith('ws://')) && cleanInput.length >= 10;

    if (!isGroq && !isLiveKitUrl) {
      setValidationError({
        tier: 2,
        message: 'Invalid Tier 2 credential. Must be an authentic Groq API key (gsk_...) or a valid WebRTC WebSocket URL (wss://...).',
      });
      return;
    }

    setIsValidating(true);
    try {
      await saveEncryptedApiKey(cleanInput, 'tier2_credential');
      setTier2Input(''); // Immediately clear from memory
      const meta = await getKeyMetadata('tier2_credential');
      setKey2Meta(meta);
      setHasExistingTier2(true);
      onSelectTier(2);
      setValidationSuccess('Tier 2 credential encrypted (AES-256-GCM) & saved! Tier 2 (Cloud Free) is now active.');
      setExpandedTier(null);
    } catch {
      setValidationError({
        tier: 2,
        message: 'Failed to store Tier 2 configuration. Please select another tier.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Validate and Save Tier 3 (Local Python Daemon)
  const handleSaveTier3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(null);

    const cleanUrl = tier3UrlInput.trim();
    if (!cleanUrl.startsWith('ws://') && !cleanUrl.startsWith('wss://')) {
      setValidationError({
        tier: 3,
        message: 'Invalid WebSocket URL format. URL must start with ws:// or wss:// (e.g. ws://127.0.0.1:8765).',
      });
      return;
    }

    setIsValidating(true);
    const isAlive = await localSocketClient.probe(cleanUrl);
    setIsValidating(false);

    if (!isAlive) {
      setDaemonStatus('offline');
      setValidationError({
        tier: 3,
        message: `Local Python Daemon is offline or unreachable at ${cleanUrl}. Please run "python -m server.main" in your terminal first, or select another tier.`,
      });
      return;
    }

    setDaemonStatus('online');
    localSocketClient.setUrl(cleanUrl);
    onSelectTier(3);
    setValidationSuccess(`Local Python Daemon verified online at ${cleanUrl}! Tier 3 (Local Daemon) is now active.`);
    setExpandedTier(null);
  };

  const handlePurgeKey = async () => {
    await clearUserApiKey('user_byok_key');
    setTier1KeyInput('');
    setKey1Meta({ exists: false });
    setHasExistingKey(false);
    setValidationSuccess('BYOK API key permanently purged from device vault.');
  };

  const handlePurgeTier2 = async () => {
    await clearUserApiKey('tier2_credential');
    setTier2Input('');
    setKey2Meta({ exists: false });
    setHasExistingTier2(false);
    setValidationSuccess('Tier 2 credential permanently purged from device vault.');
  };

  const handleSelectAnotherTier = () => {
    setValidationError(null);
    setExpandedTier(null);
  };

  const handleChooseFreeTier = () => {
    setValidationError(null);
    setExpandedTier(null);
    onSelectTier(4);
    setValidationSuccess('Free Tier is active! Complete zero-config emotion healing.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#283c32] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 text-[var(--accent-sage)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-[var(--text-nature-primary)]">
                Voice &amp; Intelligence Tiers
              </h2>
              <p className="text-xs text-[var(--text-nature-secondary)]">
                Select a Tier • View Requirements • Save &amp; Activate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Success Notification */}
        {validationSuccess && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{validationSuccess}</span>
            </div>
            <button
              onClick={() => setValidationSuccess(null)}
              className="text-[11px] underline hover:text-white shrink-0 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4-TIER INTERACTIVE ACCORDION & CARDS */}
        <div className="space-y-3.5 mb-6">
          {/* ========================================================================= */}
          {/* TIER 1: CLOUD PREMIUM */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              currentTier === 1
                ? 'bg-emerald-500/10 border-emerald-500/70 shadow-glow'
                : expandedTier === 1
                ? 'bg-surface-100 border-sky-500/60'
                : 'bg-surface-200 hover:bg-surface-100/70 border-slate-800'
            }`}
          >
            {/* Tier 1 Header Button */}
            <div
              onClick={() => handleTierCardClick(1)}
              className="p-4 flex items-start justify-between cursor-pointer select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-100">Tier 1: Cloud Premium</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      &lt;650ms SLA
                    </span>
                    {hasExistingKey ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono">
                        Key Stored
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                        Requires BYOK
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    LiveKit WebRTC + Deepgram Nova-3 + User BYOK (OpenAI/Anthropic/Gemini) + Cartesia Sonic
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3 mt-1">
                {currentTier === 1 ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium">
                    <span>Configure</span>
                    {expandedTier === 1 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
            </div>

            {/* Tier 1 Expandable Requirements Form */}
            {expandedTier === 1 && (
              <form onSubmit={handleSaveTier1} className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 animate-fade-in">
                {/* Requirements Checklist */}
                <div className="p-3.5 rounded-xl bg-surface-100/90 border border-slate-700/60 space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Requirements Needed to Activate Tier 1:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                    <li>
                      <strong className="text-slate-100">Authentic API Key:</strong> OpenAI (<code className="text-emerald-300 font-mono">sk-proj-...</code>), Anthropic (<code className="text-emerald-300 font-mono">sk-ant-...</code>), or Google Gemini (<code className="text-emerald-300 font-mono">AIzaSy...</code>).
                    </li>
                    <li>
                      <strong className="text-slate-100">Client-Side Vault:</strong> Key is encrypted with WebCrypto AES-GCM-256 in your browser.
                    </li>
                  </ul>
                </div>

                {/* Stored Key Encrypted Badge */}
                {key1Meta.exists && (
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-300">
                        {key1Meta.providerType || 'API'} Key Protected:
                      </span>
                      <span className="font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-slate-700">
                        {key1Meta.maskedPreview}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      AES-256-GCM
                    </span>
                  </div>
                )}

                {/* Input Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-200">
                    {key1Meta.exists ? 'Update / Replace API Key:' : 'Enter API Key:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showTier1Password ? 'text' : 'password'}
                      value={tier1KeyInput}
                      onChange={(e) => setTier1KeyInput(e.target.value)}
                      placeholder={
                        key1Meta.exists
                          ? 'Key is encrypted in vault. Enter new key only to replace...'
                          : 'sk-proj-... or sk-ant-... or AIzaSy...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-200 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                      autoFocus={!key1Meta.exists}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTier1Password(!showTier1Password)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                      title={showTier1Password ? 'Hide Key' : 'Show Key'}
                    >
                      {showTier1Password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {key1Meta.exists && (
                    <p className="text-[10px] text-slate-400 italic">
                      Zero-knowledge security: Plaintext keys are never shown on screen or written unencrypted to storage.
                    </p>
                  )}
                </div>

                {/* Error Banner inside Tier 1 */}
                {validationError?.tier === 1 && (
                  <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs space-y-2.5 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{validationError.message}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-800/40">
                      <button
                        type="button"
                        onClick={handleSelectAnotherTier}
                        className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 text-[11px] font-medium text-slate-200 border border-slate-700"
                      >
                        Select Another Tier
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseFreeTier}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1"
                      >
                        <span>Choose Free Tier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Save and Cancel Buttons */}
                <div className="flex items-center justify-between pt-1">
                  {hasExistingKey ? (
                    <button
                      type="button"
                      onClick={handlePurgeKey}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Key</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">No key stored yet</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedTier(null)}
                      className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isValidating || !tier1KeyInput.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center gap-1.5"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save &amp; Activate Tier 1</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TIER 2: CLOUD FREE */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              currentTier === 2
                ? 'bg-sky-500/10 border-sky-500/70 shadow-glow'
                : expandedTier === 2
                ? 'bg-surface-100 border-sky-500/60'
                : 'bg-surface-200 hover:bg-surface-100/70 border-slate-800'
            }`}
          >
            {/* Tier 2 Header Button */}
            <div
              onClick={() => handleTierCardClick(2)}
              className="p-4 flex items-start justify-between cursor-pointer select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 mt-0.5 shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-100">Tier 2: Cloud Free</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                      Zero-BYOK
                    </span>
                    {hasExistingTier2 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/40 font-mono">
                        Configured
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    LiveKit WebRTC + Groq Llama 3.3 70B + Edge-TTS (Fast Cloud Voice)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3 mt-1">
                {currentTier === 2 ? (
                  <span className="flex items-center gap-1 text-sky-400 font-bold text-xs bg-sky-950/80 px-2.5 py-1 rounded-xl border border-sky-500/40">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium">
                    <span>Configure</span>
                    {expandedTier === 2 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
            </div>

            {/* Tier 2 Expandable Requirements Form */}
            {expandedTier === 2 && (
              <form onSubmit={handleSaveTier2} className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-surface-100/90 border border-slate-700/60 space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Requirements Needed to Activate Tier 2:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                    <li>
                      <strong className="text-slate-100">Free Groq API Key:</strong> Starts with <code className="text-sky-300 font-mono">gsk_...</code> (Free instant tier).
                    </li>
                    <li>
                      <strong className="text-slate-100">OR LiveKit Server URL:</strong> <code className="text-sky-300 font-mono">wss://your-livekit-server.cloud</code>
                    </li>
                  </ul>
                </div>

                {/* Stored Tier 2 Credential Encrypted Badge */}
                {key2Meta.exists && (
                  <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-semibold text-sky-300">
                        {key2Meta.providerType || 'Tier 2'} Credential Protected:
                      </span>
                      <span className="font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-slate-700">
                        {key2Meta.maskedPreview}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
                      AES-256-GCM
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-200">
                    {key2Meta.exists ? 'Update / Replace Groq Key or URL:' : 'Groq Key or LiveKit WebSocket URL:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showTier2Password ? 'text' : 'password'}
                      value={tier2Input}
                      onChange={(e) => setTier2Input(e.target.value)}
                      placeholder={
                        key2Meta.exists
                          ? 'Credential encrypted in vault. Enter new key only to replace...'
                          : 'gsk_... or wss://...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-200 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono pr-10"
                      autoFocus={!key2Meta.exists}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTier2Password(!showTier2Password)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                      title={showTier2Password ? 'Hide Credential' : 'Show Credential'}
                    >
                      {showTier2Password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {key2Meta.exists && (
                    <p className="text-[10px] text-slate-400 italic">
                      Zero-knowledge security: Plaintext credentials are never shown on screen or written unencrypted to storage.
                    </p>
                  )}
                </div>

                {/* Error Banner inside Tier 2 */}
                {validationError?.tier === 2 && (
                  <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs space-y-2.5 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{validationError.message}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-800/40">
                      <button
                        type="button"
                        onClick={handleSelectAnotherTier}
                        className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 text-[11px] font-medium text-slate-200 border border-slate-700"
                      >
                        Select Another Tier
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseFreeTier}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1"
                      >
                        <span>Choose Free Tier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Save, Purge, and Cancel Buttons */}
                <div className="flex items-center justify-between pt-1">
                  {hasExistingTier2 ? (
                    <button
                      type="button"
                      onClick={handlePurgeTier2}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Credential</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">No credential stored yet</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedTier(null)}
                      className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isValidating || !tier2Input.trim()}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center gap-1.5"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save &amp; Activate Tier 2</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TIER 3: LOCAL DAEMON */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              currentTier === 3
                ? 'bg-purple-500/10 border-purple-500/70 shadow-glow'
                : expandedTier === 3
                ? 'bg-surface-100 border-purple-500/60'
                : 'bg-surface-200 hover:bg-surface-100/70 border-slate-800'
            }`}
          >
            {/* Tier 3 Header Button */}
            <div
              onClick={() => handleTierCardClick(3)}
              className="p-4 flex items-start justify-between cursor-pointer select-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 mt-0.5 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-100">Tier 3: Local Daemon</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      ws://127.0.0.1:8765
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                        daemonStatus === 'online'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {daemonStatus === 'online' ? 'Socket Online' : 'Socket Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Local WebSocket + Faster-Whisper + Ollama Llama 3.3 + Kokoro TTS (100% Private)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3 mt-1">
                {currentTier === 3 ? (
                  <span className="flex items-center gap-1 text-purple-400 font-bold text-xs bg-purple-950/80 px-2.5 py-1 rounded-xl border border-purple-500/40">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium">
                    <span>Configure</span>
                    {expandedTier === 3 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
            </div>

            {/* Tier 3 Expandable Requirements Form */}
            {expandedTier === 3 && (
              <form onSubmit={handleSaveTier3} className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-surface-100/90 border border-slate-700/60 space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-purple-400" />
                    <span>Requirements Needed to Activate Tier 3:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                    <li>
                      <strong className="text-slate-100">Local Python Server:</strong> Run <code className="text-purple-300 font-mono bg-purple-950/60 px-1 py-0.5 rounded">python -m server.main</code> in your project terminal.
                    </li>
                    <li>
                      <strong className="text-slate-100">Socket Endpoint:</strong> Default listening on <code className="text-purple-300 font-mono">ws://127.0.0.1:8765</code>.
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-200">
                      WebSocket Server URL:
                    </label>
                    <span className="text-[10px] font-mono text-purple-400">
                      Status: {daemonStatus === 'online' ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={tier3UrlInput}
                    onChange={(e) => setTier3UrlInput(e.target.value)}
                    placeholder="ws://127.0.0.1:8765"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-200 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    autoFocus
                  />
                </div>

                {/* Error Banner inside Tier 3 */}
                {validationError?.tier === 3 && (
                  <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs space-y-2.5 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{validationError.message}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-800/40">
                      <button
                        type="button"
                        onClick={handleSelectAnotherTier}
                        className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 text-[11px] font-medium text-slate-200 border border-slate-700"
                      >
                        Select Another Tier
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseFreeTier}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1"
                      >
                        <span>Choose Free Tier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Save and Cancel */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedTier(null)}
                    className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center gap-1.5"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Probing Socket...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save &amp; Probe Tier 3</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TIER 4: FREE TIER (BROWSER-NATIVE EDGE) */}
          {/* ========================================================================= */}
          <div
            onClick={() => handleTierCardClick(4)}
            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-start justify-between ${
              currentTier === 4
                ? 'bg-emerald-500/15 border-emerald-400/80 shadow-glow ring-2 ring-emerald-400/40'
                : 'bg-surface-200 hover:bg-surface-100/70 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-100">Tier 4: Browser-Native Edge</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold font-mono border border-emerald-400/50 shadow-glow flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>FREE TIER</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  100% Free • No API Key or Server Required • Instant Zero-Config
                </p>
                <p className="text-[10px] text-emerald-400/90 mt-0.5 font-mono">
                  In-Browser Speech Recognition + OS Voice Synthesizer + Clinical Neuroscience Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-3 mt-1">
              {currentTier === 4 ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                  <Check className="w-3.5 h-3.5" /> Free Tier Active
                </span>
              ) : (
                <span className="text-emerald-400 hover:text-emerald-300 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                  <span>Activate Free</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Language & Security Notice */}
        <div className="p-3.5 rounded-2xl bg-[#14201a]/80 border border-[#283c32] flex items-center justify-between text-xs text-[var(--text-nature-secondary)] mb-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
            <span>Real-time Multilingual Mirroring (30+ Languages)</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-nature-muted)]">
            AES-GCM-256 Zero-Knowledge
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#283c32]">
          <div className="text-[11px] text-[var(--text-nature-muted)] font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
            <span>Local WebCrypto Vault Protected</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#588e73] hover:bg-[#81a890] text-xs font-bold text-[#0c1410] transition-all shadow-glow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
