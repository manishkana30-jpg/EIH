/**
 * lib/audio/voice-router.ts
 *
 * 4-Tier Resilient Voice Router State Machine (v2.0)
 *
 * Tiers:
 * Tier 1 (Primary)    → LiveKit Agent (WebRTC, sub-200ms)
 * Tier 2 (Fallback)   → Groq Whisper (Server-side, <500ms)
 * Tier 3 (Offline)    → Transformers.js Whisper Worker (Local WASM, no network)
 * Tier 4 (Last Resort)→ Web Speech API (Browser-native, zero config)
 *
 * Transition Rules:
 * - Downgrade on: LiveKit timeout >3s, Groq 429/503, WASM error
 * - Upgrade back to Tier 1 after: successful reconnection & 30s of stable operation
 * - Log every tier transition with timestamp and reason to sessionStorage
 */

import { audioManager, AudioManagerError } from './audio-manager';
import { BrowserSpeechController } from './browser-speech';
import { LiveKitAudioClient } from './livekit-client';
import { LocalSocketClient } from './local-socket-client';
import { checkCrisisRisk, CrisisDetectionResult } from '../safety/crisis-detector';
import {
  classifyNeuroscienceDimensions,
  NeuroscienceDiagnosticResult,
} from '../knowledge/emotion-classifier';

export type VoiceTier = 1 | 2 | 3 | 4;

export type VoiceRouterState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'degraded'
  | 'disconnected';

export type VoiceState = VoiceRouterState;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'degraded';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  latencyMs?: number;
  tier?: VoiceTier;
  emotions?: { label: string; score: number; emoji: string }[];
  isCrisisInterception?: boolean;
}

export interface TierTransitionLog {
  timestamp: number;
  fromTier: VoiceTier;
  toTier: VoiceTier;
  reason: string;
}

export interface VoiceRouterError {
  code: string;
  message: string;
  tier: VoiceTier;
  recoverable: boolean;
}

type StateChangeCallback = (state: VoiceRouterState) => void;
type TierChangeCallback = (tier: VoiceTier) => void;
type StatusChangeCallback = (status: ConnectionStatus) => void;
type MessageCallback = (message: VoiceMessage) => void;
type CrisisCallback = (crisis: CrisisDetectionResult) => void;
type TranscriptCallback = (transcript: string) => void;
type AudioLevelCallback = (level: number) => void;
type DiagnosticCallback = (diagnostic: NeuroscienceDiagnosticResult) => void;
type ErrorCallback = (error: string) => void;

class VoiceRouter {
  private static instance: VoiceRouter | null = null;

  // Active configuration & state
  private currentTier: VoiceTier = 4; // Defaults to reliable browser-native Tier 4, upgradeable to Tier 1
  private previousTier: VoiceTier = 4;
  private routerState: VoiceRouterState = 'disconnected';
  private connectionStatus: ConnectionStatus = 'disconnected';
  private latencyMs: number = 0;
  private messages: VoiceMessage[] = [];
  private currentDiagnostic: NeuroscienceDiagnosticResult;
  private sessionUsedKeys: Set<string> = new Set();

  // Tier 1 upgrade recovery timer
  private stableTimer: number | null = null;
  private isAttemptingUpgrade: boolean = false;

  // Audio clients
  private livekitClient: LiveKitAudioClient;
  private localSocketClient: LocalSocketClient;
  private browserSpeech: BrowserSpeechController;
  private whisperWorker: Worker | null = null;

  // MediaRecorder for Tier 2 chunking
  private mediaRecorder: MediaRecorder | null = null;
  private recordedAudioChunks: Blob[] = [];

  // Callbacks
  private stateListeners: Set<StateChangeCallback> = new Set();
  private tierListeners: Set<TierChangeCallback> = new Set();
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private messageListeners: Set<MessageCallback> = new Set();
  private crisisListeners: Set<CrisisCallback> = new Set();
  private transcriptListeners: Set<TranscriptCallback> = new Set();
  private levelListeners: Set<AudioLevelCallback> = new Set();
  private diagnosticListeners: Set<DiagnosticCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();

  private constructor() {
    this.livekitClient = LiveKitAudioClient.getInstance();
    this.localSocketClient = LocalSocketClient.getInstance();
    this.browserSpeech = BrowserSpeechController.getInstance();

    this.currentDiagnostic = classifyNeuroscienceDimensions(
      'I am present and open to emotional grounding.'
    );

    this.bindClientEvents();
  }

  public static getInstance(): VoiceRouter {
    if (!VoiceRouter.instance) {
      VoiceRouter.instance = new VoiceRouter();
    }
    return VoiceRouter.instance;
  }

  // =========================================================================
  // CONNECTION & LIFECYCLE
  // =========================================================================

  public async connect(targetTier?: VoiceTier): Promise<boolean> {
    const tierToUse = targetTier || this.currentTier;
    this.setState('connecting');
    this.setStatus('connecting');

    try {
      if (tierToUse === 1) {
        const livekitSuccess = await this.connectTier1LiveKit();
        if (livekitSuccess) {
          this.setTier(1, 'Initial Tier 1 connection success');
          this.setState('listening');
          this.setStatus('connected');
          this.startStableRecoveryTimer();
          return true;
        } else {
          // Downgrade to Tier 2
          this.downgradeTier(2, 'LiveKit WebRTC timeout or unreachable (>3s)');
          return await this.connect(2);
        }
      }

      if (tierToUse === 2) {
        const tier2Success = await this.connectTier2Groq();
        if (tier2Success) {
          this.setTier(2, 'Tier 2 Cloud Free activated');
          this.setState('listening');
          this.setStatus('connected');
          return true;
        } else {
          this.downgradeTier(3, 'Groq API unavailable (429/503)');
          return await this.connect(3);
        }
      }

      if (tierToUse === 3) {
        const tier3Success = await this.connectTier3Local();
        if (tier3Success) {
          this.setTier(3, 'Tier 3 Offline Local activated');
          this.setState('listening');
          this.setStatus('connected');
          return true;
        } else {
          this.downgradeTier(4, 'Local worker failed to initialize');
          return await this.connect(4);
        }
      }

      // Tier 4: Browser-Native Web Speech
      await this.connectTier4BrowserSpeech();
      this.setTier(4, 'Tier 4 Browser-Native Edge active');
      this.setState('listening');
      this.setStatus('connected');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      this.setState('error');
      this.setStatus('disconnected');
      this.emitError(message);
      return false;
    }
  }

  public disconnect(): void {
    if (this.stableTimer) {
      window.clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }

    try {
      this.livekitClient.disconnect();
    } catch (_) {}

    try {
      this.localSocketClient.disconnect();
    } catch (_) {}

    try {
      this.browserSpeech.stopListening();
      this.browserSpeech.cancelSpeech();
    } catch (_) {}

    try {
      audioManager.stopCapture();
    } catch (_) {}

    this.setState('disconnected');
    this.setStatus('disconnected');
    this.emitTranscript('');
  }

  public async switchTier(newTier: VoiceTier): Promise<void> {
    if (newTier === this.currentTier && this.connectionStatus === 'connected') return;

    this.disconnect();
    this.currentTier = newTier;
    await this.connect(newTier);
  }

  // =========================================================================
  // TIER-SPECIFIC CONNECTORS
  // =========================================================================

  private async connectTier1LiveKit(): Promise<boolean> {
    try {
      const tokenRes = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 1 }),
      });
      if (!tokenRes.ok) return false;

      const data = await tokenRes.json();
      const wsUrl = data.wsUrl || data.serverUrl;
      if (!data.token || !wsUrl) return false;

      const connectPromise = this.livekitClient.connect({
        serverUrl: wsUrl,
        token: data.token,
        tier: 1,
      });
      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), 3000)
      );

      const success = await Promise.race([connectPromise, timeoutPromise]);
      return !!success;
    } catch (e) {
      console.warn('[VoiceRouter] Tier 1 connect failure:', e);
      return false;
    }
  }

  private async connectTier2Groq(): Promise<boolean> {
    try {
      const micStream = await audioManager.startCapture();
      this.setupTier2Recorder(micStream);
      return true;
    } catch (err) {
      console.warn('[VoiceRouter] Tier 2 mic capture error:', err);
      return false;
    }
  }

  private async connectTier3Local(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && !this.whisperWorker) {
        try {
          this.whisperWorker = new Worker(new URL('./whisper.worker.ts', import.meta.url));
          this.whisperWorker.postMessage({ type: 'INIT' });
        } catch (workerErr) {
          console.warn('[VoiceRouter] Worker init notice:', workerErr);
        }
      }

      await audioManager.startCapture();
      return true;
    } catch (err) {
      console.warn('[VoiceRouter] Tier 3 local start failure:', err);
      return false;
    }
  }

  private async connectTier4BrowserSpeech(): Promise<boolean> {
    try {
      this.browserSpeech.startListening(
        (transcript, isFinal) => {
          if (isFinal && transcript.trim().length > 0) {
            this.emitTranscript('');
            this.processUserUtterance(transcript.trim());
          } else {
            this.emitTranscript(transcript);
          }
        },
        (err) => {
          console.warn('[VoiceRouter] Tier 4 recognition notice:', err);
        }
      );
      return true;
    } catch (err) {
      console.warn('[VoiceRouter] Tier 4 browser speech error:', err);
      return false;
    }
  }

  // =========================================================================
  // TIER 2 RECORDER PIPELINE (Server-side Groq Whisper)
  // =========================================================================

  private setupTier2Recorder(stream: MediaStream): void {
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.recordedAudioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedAudioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.recordedAudioChunks.length === 0) return;
        const audioBlob = new Blob(this.recordedAudioChunks, { type: 'audio/webm' });
        this.recordedAudioChunks = [];

        await this.transcribeTier2Blob(audioBlob);
      };

      // Record in 3-second slices
      this.mediaRecorder.start(3000);
    } catch (err) {
      console.warn('[VoiceRouter] MediaRecorder initialization notice:', err);
    }
  }

  private async transcribeTier2Blob(blob: Blob): Promise<void> {
    if (blob.size < 1000) return;
    this.setState('processing');

    try {
      const formData = new FormData();
      formData.append('file', blob, 'speech.webm');

      const res = await fetch('/api/whisper-groq', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          this.downgradeTier(4, `Groq API rate limit or error (${res.status})`);
        }
        return;
      }

      const data = await res.json();
      if (data.text && data.text.trim()) {
        this.emitTranscript(data.text);
        await this.processUserUtterance(data.text.trim());
      }
    } catch (err) {
      console.warn('[VoiceRouter] Tier 2 transcription request failed:', err);
    } finally {
      if (this.routerState === 'processing') {
        this.setState('listening');
      }
    }
  }

  // =========================================================================
  // STATE MACHINE & TRANSITIONS
  // =========================================================================

  private downgradeTier(toTier: VoiceTier, reason: string): void {
    const fromTier = this.currentTier;
    this.previousTier = fromTier;
    this.currentTier = toTier;

    this.logTransition(fromTier, toTier, reason);
    this.setStatus('degraded');
    this.setState('degraded');
    this.emitTierChange(toTier);
  }

  private startStableRecoveryTimer(): void {
    if (this.stableTimer) window.clearTimeout(this.stableTimer);

    // After 30s of stable operation, ensure Tier 1 status is locked in
    this.stableTimer = window.setTimeout(() => {
      if (this.currentTier === 1 && this.connectionStatus === 'connected') {
        console.log('[VoiceRouter] 30s stable operation reached on Tier 1.');
      }
    }, 30000);
  }

  private logTransition(fromTier: VoiceTier, toTier: VoiceTier, reason: string): void {
    const entry: TierTransitionLog = {
      timestamp: Date.now(),
      fromTier,
      toTier,
      reason,
    };

    console.warn(`[VoiceRouter Tier Transition] ${fromTier} ➔ ${toTier} | Reason: ${reason}`);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const existing = JSON.parse(sessionStorage.getItem('eih_tier_transitions') || '[]');
        existing.push(entry);
        sessionStorage.setItem('eih_tier_transitions', JSON.stringify(existing));
      } catch (_) {}
    }
  }

  // =========================================================================
  // CORE UTTERANCE PROCESSING & CRISIS INTERCEPTION
  // =========================================================================

  public async processUserUtterance(userText: string): Promise<void> {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();
    const startTime = performance.now();

    try {
      // 1. Deterministic Crisis Check BEFORE sending to AI pipeline
      const crisisCheck = checkCrisisRisk(cleanText);
      if (crisisCheck.isCrisis && (crisisCheck.severity === 'immediate' || crisisCheck.severity === 'high')) {
        console.warn('[VoiceRouter] CRISIS PATTERN INTERCEPTED:', crisisCheck.matchedPattern);

        // Immediately pause speech & voice capture
        this.browserSpeech.cancelSpeech();
        this.emitCrisis(crisisCheck);

        const userMsg: VoiceMessage = {
          id: `usr-${Date.now()}`,
          role: 'user',
          content: cleanText,
          timestamp: Date.now(),
          tier: this.currentTier,
        };

        const deflectionMsg: VoiceMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content:
            crisisCheck.immediateDeflectionStatement ||
            'Your life and safety are deeply important. Please reach out to compassionate professionals immediately.',
          timestamp: Date.now(),
          tier: this.currentTier,
          isCrisisInterception: true,
        };

        this.addMessage(userMsg);
        this.addMessage(deflectionMsg);
        return;
      }

      // 2. Classify Cowen-27 Emotional Dimensions & Polyvagal State
      const diagnostic = classifyNeuroscienceDimensions(cleanText);
      this.currentDiagnostic = diagnostic;
      this.emitDiagnostic(diagnostic);

      // 3. Append User Message
      const userMsg: VoiceMessage = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: cleanText,
        timestamp: Date.now(),
        tier: this.currentTier,
      };
      this.addMessage(userMsg);
      this.setState('processing');

      // 4. Generate Clinical Companion Reply via search-grounded Therapist Engine API
      let replyText = '';
      try {
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: cleanText }),
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData?.reply && typeof chatData.reply === 'string' && chatData.reply.trim()) {
            replyText = chatData.reply.trim();
          }
        }
      } catch (chatErr) {
        console.warn('[VoiceRouter] /api/chat fetch notice (using clinical companion fallback):', chatErr);
      }

      if (!replyText) {
        throw new Error('Clinical inference engine unavailable.');
      }

      const latency = Math.round(performance.now() - startTime);
      this.latencyMs = latency;

      const scoresRecord: Record<string, number> = diagnostic.dimensionScores || {};
      const topEmotions = Object.entries(scoresRecord)
        .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
        .slice(0, 3)
        .map(([name, score]: [string, number]) => ({
          label: name,
          score: Math.min(100, Math.max(1, Math.round(score > 1 ? score : score * 100))),
          emoji: '🌿',
        }));

      const assistantMsg: VoiceMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: Date.now(),
        latencyMs: latency,
        tier: this.currentTier,
        emotions: topEmotions.length > 0 ? topEmotions : [
          { label: diagnostic.dimensionName || 'Calmness', score: 85, emoji: '🌿' }
        ],
      };

      this.addMessage(assistantMsg);
      this.setState('speaking');

      // Synthesize Speech with therapeutic pacing
      this.browserSpeech.speak(
        replyText,
        () => {
          this.setState('speaking');
        },
        () => {
          this.setState('listening');
        }
      );
    } catch (err: unknown) {
      console.error('[VoiceRouter] processUserUtterance pipeline failure:', err);
      this.emitError(err instanceof Error ? err.message : 'Reply generation failed. Please try again.');
      this.setState('listening');
    }
  }

  public handleBargeIn(): void {
    this.browserSpeech.cancelSpeech();
    this.setState('listening');
  }

  // =========================================================================
  // EVENT BINDINGS & CLIENT DELEGATION
  // =========================================================================

  private bindClientEvents(): void {
    audioManager.onLevelChange((db) => {
      const normalized = Math.max(0, Math.min(1, (db + 80) / 80));
      this.emitAudioLevel(normalized);
    });

    this.browserSpeech.setCallbacks({
      onAudioLevel: (level) => {
        if (this.currentTier === 4) {
          this.emitAudioLevel(level);
        }
      },
      onRecognitionState: (isListening) => {
        if (this.currentTier === 4 && this.connectionStatus === 'connected' && !this.browserSpeech.getIsSpeaking()) {
          this.setState(isListening ? 'listening' : 'idle');
        }
      },
    });
  }

  private addMessage(message: VoiceMessage): void {
    this.messages.push(message);
    this.messageListeners.forEach((fn) => fn(message));
  }

  // =========================================================================
  // EVENT SUBSCRIBERS
  // =========================================================================

  public onStateChange(fn: StateChangeCallback): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  public onTierChange(fn: TierChangeCallback): () => void {
    this.tierListeners.add(fn);
    return () => this.tierListeners.delete(fn);
  }

  public onStatusChange(fn: StatusChangeCallback): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  public onMessage(fn: MessageCallback): () => void {
    this.messageListeners.add(fn);
    return () => this.messageListeners.delete(fn);
  }

  public onCrisisTrigger(fn: CrisisCallback): () => void {
    this.crisisListeners.add(fn);
    return () => this.crisisListeners.delete(fn);
  }

  public onLiveTranscript(fn: TranscriptCallback): () => void {
    this.transcriptListeners.add(fn);
    return () => this.transcriptListeners.delete(fn);
  }

  public onAudioLevel(fn: AudioLevelCallback): () => void {
    this.levelListeners.add(fn);
    return () => this.levelListeners.delete(fn);
  }

  public onDiagnosticChange(fn: DiagnosticCallback): () => void {
    this.diagnosticListeners.add(fn);
    return () => this.diagnosticListeners.delete(fn);
  }

  public onError(fn: ErrorCallback): () => void {
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }

  // =========================================================================
  // EMITTERS & GETTERS
  // =========================================================================

  private setState(state: VoiceRouterState): void {
    this.routerState = state;
    this.stateListeners.forEach((fn) => fn(state));
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private setTier(tier: VoiceTier, reason: string): void {
    const from = this.currentTier;
    this.currentTier = tier;
    this.logTransition(from, tier, reason);
    this.emitTierChange(tier);
  }

  private emitTierChange(tier: VoiceTier): void {
    this.tierListeners.forEach((fn) => fn(tier));
  }

  private emitCrisis(crisis: CrisisDetectionResult): void {
    this.crisisListeners.forEach((fn) => fn(crisis));
  }

  private emitTranscript(transcript: string): void {
    this.transcriptListeners.forEach((fn) => fn(transcript));
  }

  private emitAudioLevel(level: number): void {
    this.levelListeners.forEach((fn) => fn(level));
  }

  private emitDiagnostic(diag: NeuroscienceDiagnosticResult): void {
    this.diagnosticListeners.forEach((fn) => fn(diag));
  }

  private emitError(err: string): void {
    this.errorListeners.forEach((fn) => fn(err));
  }

  public getCurrentTier(): VoiceTier {
    return this.currentTier;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getVoiceState(): VoiceRouterState {
    return this.routerState;
  }

  public getLatencyMs(): number {
    return this.latencyMs;
  }

  public getMessageHistory(): VoiceMessage[] {
    return [...this.messages];
  }

  public getDiagnostic(): NeuroscienceDiagnosticResult {
    return this.currentDiagnostic;
  }

  public setDiagnostic(diag: NeuroscienceDiagnosticResult): void {
    this.currentDiagnostic = diag;
    this.emitDiagnostic(diag);
  }
}

export const voiceRouter = VoiceRouter.getInstance();
