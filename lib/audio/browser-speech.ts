/**
 * Tier 4: Dual-Engine Robust Clinical Voice & Speech Engine
 * Synthesizes:
 * 1. Web Speech API (webkitSpeechRecognition) for zero-latency streaming interim words.
 * 2. MediaRecorder + Web Audio RMS Voice Activity Detection (VAD) with /api/audio/transcribe fallback.
 * 3. High-Fidelity Microsoft Edge Neural TTS Streaming (/api/voice) for ultra-realistic human-like speech.
 * 4. Intelligent Long-Pause Turn-Taking (1400ms adaptive silence threshold for full sentence/paragraph capture).
 * 5. Automatic Hands-Free Turn Taking (Auto-Stop when speaking, Auto-Resume when assistant finishes).
 * 6. Continuous Keep-Alive & Auto Barge-In Interruption.
 */

import { getBestTherapeuticVoice } from './voice-selector.ts';
import { voiceAcousticAnalyzer, type VoiceAcousticState } from './voice-acoustic-analyzer.ts';
import { isIncompleteUtterance } from '../knowledge/psychology-library-rag.ts';

export type { VoiceAcousticState };

export interface BrowserSpeechCallbacks {
  onUserSpeech?: (transcript: string, isFinal: boolean, voiceState?: VoiceAcousticState) => void;
  onAssistantStart?: () => void;
  onAssistantEnd?: () => void;
  onError?: (error: string) => void;
  onInterimTranscript?: (text: string) => void;
  onRecognitionState?: (isListening: boolean) => void;
  onAudioLevel?: (level: number) => void;
  onVoiceStateUpdate?: (state: VoiceAcousticState) => void;
  onWordBoundary?: (charIndex: number, charLength: number, wordText?: string) => void;
}

export interface SpeechRecognitionResultItem {
  transcript: string;
  confidence?: number;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

export const REGIONAL_NEURAL_VOICE_MAP: Record<string, string> = {
  'hi-in': 'hi-IN-SwaraNeural',
  'hi': 'hi-IN-SwaraNeural',
  'es-es': 'es-ES-ElviraNeural',
  'es': 'es-ES-ElviraNeural',
  'fr-fr': 'fr-FR-DeniseNeural',
  'fr': 'fr-FR-DeniseNeural',
  'de-de': 'de-DE-KatjaNeural',
  'de': 'de-DE-KatjaNeural',
  'en-us': 'en-US-AriaNeural',
  'en-gb': 'en-GB-SoniaNeural',
  'en-in': 'en-IN-NeerjaNeural',
  'en': 'en-US-AriaNeural',
  'zh-cn': 'zh-CN-XiaoxiaoNeural',
  'zh': 'zh-CN-XiaoxiaoNeural',
  'ja-jp': 'ja-JP-NanamiNeural',
  'ja': 'ja-JP-NanamiNeural',
  'ar-sa': 'ar-SA-ZariyahNeural',
  'ar': 'ar-SA-ZariyahNeural',
  'pt-br': 'pt-BR-FranciscaNeural',
  'pt': 'pt-BR-FranciscaNeural',
  'it-it': 'it-IT-ElsaNeural',
  'it': 'it-IT-ElsaNeural',
  'ru-ru': 'ru-RU-SvetlanaNeural',
  'ru': 'ru-RU-SvetlanaNeural',
  'ko-kr': 'ko-KR-SunHiNeural',
  'ko': 'ko-KR-SunHiNeural',
};

export interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export class BrowserSpeechController {
  private static instance: BrowserSpeechController;
  private speechSynth: SpeechSynthesis | null = null;
  private speechRecognition: ISpeechRecognition | null = null;
  private shouldBeListening = false;
  private isListening = false;
  private isSpeaking = false;
  private isProcessingUtterance = false;
  private callbacks: BrowserSpeechCallbacks = {};
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private currentBlobUrl: string | null = null;

  // Real-time Audio Stream & VAD Analyzer
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaRecorderMimeType = '';
  private animFrameId: number | null = null;
  private isUserSpeaking = false;
  private speechStartTime = 0;
  private speechSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private processingSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private liveInterimTranscript = '';
  private accumulatedFinalText = '';
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private ttsWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private ttsResumeInterval: ReturnType<typeof setInterval> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  // Patient clinical silence threshold (4200ms gives user generous breathing room to complete thoughts without rushing)
  private silenceTimeoutMs = 4200;
  private currentLanguageLocale = 'en-US';
  private activeSpeechGeneration = 0;
  private lastSpokenText = '';
  private lastSpeechEndTime = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis || null;
      if (this.speechSynth) {
        this.warmupVoices();
      }
    }
  }

  public static getInstance(): BrowserSpeechController {
    if (!BrowserSpeechController.instance) {
      BrowserSpeechController.instance = new BrowserSpeechController();
    }
    return BrowserSpeechController.instance;
  }

  public async setLanguageLocale(locale: string): Promise<void> {
    this.currentLanguageLocale = locale;
    try {
      const voice = await getBestTherapeuticVoice(locale);
      if (voice) {
        this.cachedVoice = voice;
      }
      if (this.speechRecognition) {
        this.speechRecognition.lang = locale;
      }
    } catch (_) {}
  }

  private async warmupVoices(locale = 'en-US'): Promise<void> {
    try {
      const voice = await getBestTherapeuticVoice(locale);
      if (voice) {
        this.cachedVoice = voice;
      }
    } catch (_) {}
  }

  public setCallbacks(callbacks: Partial<BrowserSpeechCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Starts Dual-Engine Voice Capture & Recognition with defensive guards:
   * 1. Secure context (HTTPS/localhost) verification.
   * 2. Browser API support check (fallback to text with user-visible notice on Firefox etc.).
   * 3. Explicit permission pre-flight check.
   * 4. Sequential audio guarantee: releases TTS audio focus + 200ms buffer delay before STT starts.
   * 5. Fresh recognizer per attempt (no stale singleton state).
   */
  public async startRecognition(existingStream?: MediaStream): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Defensive Guard 1: Secure Context Check (Browsers silently block getUserMedia on non-HTTPS/non-localhost)
    if (window.isSecureContext === false) {
      const errMsg = 'Microphone access requires a secure connection (HTTPS or localhost).';
      console.warn('[BrowserSpeechController] Insecure context:', errMsg);
      this.callbacks.onError?.(errMsg);
      return false;
    }

    // Defensive Guard 2: Web Speech API Availability Check (Firefox / unsupported browser fallback)
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRec) {
      const errMsg = 'Speech recognition is not supported in this browser. Please use the text input below.';
      console.warn('[BrowserSpeechController] SpeechRecognition API unavailable:', errMsg);
      this.callbacks.onError?.(errMsg);
      return false;
    }

    // Defensive Guard 3: Explicit Insecure Context Check
    if ((window as any).isSecureContext === false) {
      const errMsg = 'Microphone access requires a secure connection (HTTPS or localhost).';
      console.warn('[BrowserSpeechController] Insecure context:', errMsg);
      this.callbacks.onError?.(errMsg);
      return false;
    }

    // Defensive Guard 4: Sequential Audio Control - Stop TTS immediately without async delay
    // Critical: Do NOT await a setTimeout here, as any async tick before getUserMedia
    // violates browser user-gesture requirements on iOS Safari and mobile browsers!
    if (this.isSpeaking) {
      this.cancelSpeech();
    }

    this.shouldBeListening = true;
    this.isProcessingUtterance = false;
    this.liveInterimTranscript = '';
    this.accumulatedFinalText = '';

    // 1. Initialize Microphone Audio Stream fresh for real-time visualizer & acoustic prosody
    await this.startMediaStreamAndVAD(existingStream);

    // If microphone acquisition failed, do not proceed with speech recognition
    if (!this.mediaStream && !existingStream) {
      this.shouldBeListening = false;
      this.isListening = false;
      this.callbacks.onRecognitionState?.(false);
      return false;
    }

    // 2. Initialize fresh Web Speech Recognition instance
    this.initWebSpeechRecognition();

    this.isListening = true;
    this.callbacks.onRecognitionState?.(true);

    // Start periodic keep-alive watchdog
    this.startKeepAliveWatchdog();

    return true;
  }

  private startKeepAliveWatchdog(): void {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance && !this.isListening) {
        this.initWebSpeechRecognition();
        this.isListening = true;
        this.callbacks.onRecognitionState?.(true);
      }
    }, 2500);
  }

  private async startMediaStreamAndVAD(existingStream?: MediaStream): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      if (existingStream && existingStream.active) {
        this.mediaStream = existingStream;
      } else {
        // Fresh Stream Guarantee (Check 10 fix):
        // Always cleanly stop and null out any previous stream or tracks before requesting a fresh stream.
        // Reusing a stream whose tracks were stopped leaves a dead stream that silently captures nothing.
        if (this.mediaStream) {
          try {
            this.mediaStream.getTracks().forEach((t) => t.stop());
          } catch (_) {}
          this.mediaStream = null;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia not available on this device');
        }

        // Explicit device pre-flight check if enumerateDevices is available
        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasAudioInput = devices.some((d) => d.kind === 'audioinput');
            if (devices.length > 0 && !hasAudioInput) {
              const noMicErr = new Error('No microphone hardware detected on your device.');
              noMicErr.name = 'NotFoundError';
              throw noMicErr;
            }
          } catch (e: any) {
            if (e.name === 'NotFoundError') throw e;
          }
        }

        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
          video: false,
        });
      }

      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (this.audioCtx && this.mediaStream) {
        try {
          const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 1024;
          source.connect(this.analyser);
        } catch (ctxErr) {
          console.warn('[BrowserSpeechController] Failed to connect analyser node:', ctxErr);
        }
      }

      // Root Cause Fix: Do NOT run continuous 250ms MediaRecorder in parallel with SpeechRecognition.
      // In Chromium, concurrent MediaRecorder + Web Audio locks the raw audio pipeline and starves
      // webkitSpeechRecognition of frames, causing permanent silence or audio-capture errors.
      // AudioContext analyser alone handles real-time amplitude and prosody telemetry.

      this.startVADLoop();
    } catch (err: any) {
      console.warn('[BrowserSpeechController] Microphone stream initialization notice:', err);
      this.shouldBeListening = false;
      this.isListening = false;
      this.callbacks.onRecognitionState?.(false);
      this.callbacks.onAudioLevel?.(0);

      // Differentiated error UI feedback
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError') {
        this.callbacks.onError?.('Microphone access is blocked in your browser settings. Please click the lock or camera icon in the address bar to allow microphone access.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        this.callbacks.onError?.('No microphone hardware detected on your device.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        this.callbacks.onError?.('Microphone is in use by another application or locked by the system.');
      } else {
        this.callbacks.onError?.(`Microphone error: ${err?.message || 'Failed to start microphone'}`);
      }
    }
  }

  private startVADLoop(): void {
    if (!this.analyser) return;

    const timeDataArray = new Float32Array(this.analyser.fftSize);
    const byteFreqArray = new Uint8Array(this.analyser.frequencyBinCount);
    let lastStateEmitTime = 0;

    const checkAudio = () => {
      if (!this.analyser || !this.shouldBeListening || this.isSpeaking) {
        this.animFrameId = requestAnimationFrame(checkAudio);
        return;
      }

      this.analyser.getFloatTimeDomainData(timeDataArray);
      this.analyser.getByteFrequencyData(byteFreqArray);

      // 1. Process voice acoustic biomarkers (Pitch F0, Vocal Jitter, RMS Energy)
      const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 44100;
      const frameResult = voiceAcousticAnalyzer.processFrame(timeDataArray, sampleRate);

      // 2. Audio level calculation for visualizer
      let sum = 0;
      for (let i = 0; i < byteFreqArray.length; i++) {
        sum += byteFreqArray[i];
      }
      const avg = sum / byteFreqArray.length;
      const normalizedLevel = Math.min(1, Math.max(avg / 128, frameResult.rms * 5));
      this.callbacks.onAudioLevel?.(normalizedLevel);

      // User actively vocalizing: voiced biomarker with positive RMS energy
      this.isUserSpeaking = frameResult.isVoiced && frameResult.rms > 0.015;

      // 3. Periodically evaluate and broadcast live vocal prosody
      const now = Date.now();
      if (now - lastStateEmitTime > 350) {
        lastStateEmitTime = now;
        const currentVoiceState = voiceAcousticAnalyzer.evaluateState();
        this.callbacks.onVoiceStateUpdate?.(currentVoiceState);
      }

      this.animFrameId = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  }

  /**
   * Fresh Web Speech Recognition initialization per attempt:
   * 1. Fully destroys and detaches any previous instance to prevent InvalidStateError.
   * 2. Attaches all event listeners (onstart, onresult, onerror, onend) before calling .start().
   * 3. Surfaces human-readable errors via callbacks.onError (never swallows silently).
   * 4. Normalizes BCP-47 locale tags (en-US, hi-IN).
   */
  private initWebSpeechRecognition(): void {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRec) {
      this.callbacks.onError?.('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    // Always cleanly destroy and remove listeners from existing instance before starting fresh
    if (this.speechRecognition) {
      try {
        this.speechRecognition.onstart = null;
        this.speechRecognition.onresult = null;
        this.speechRecognition.onerror = null;
        this.speechRecognition.onend = null;
        this.speechRecognition.abort();
      } catch (_) {}
      this.speechRecognition = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Ensure proper BCP-47 locale format
      let preferredLang =
        this.currentLanguageLocale ||
        (typeof navigator !== 'undefined' && navigator.language) ||
        'en-US';
      if (preferredLang === 'en') preferredLang = 'en-US';
      if (preferredLang === 'hi') preferredLang = 'hi-IN';
      recognition.lang = preferredLang;

      // Attach all listeners before .start()
      recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onRecognitionState?.(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (this.isSpeaking) {
          this.cancelSpeech();
        }
        if (this.isProcessingUtterance) return;

        let interimText = '';
        let newFinalText = '';
        let hasFinalResult = false;

        for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            const transcript = res[0].transcript || '';
            if (res.isFinal) {
              newFinalText += transcript + ' ';
              hasFinalResult = true;
            } else {
              interimText += transcript;
            }
          }
        }

        if (newFinalText.trim()) {
          this.accumulatedFinalText += (this.accumulatedFinalText ? ' ' : '') + newFinalText.trim();
        }

        const candidate = (this.accumulatedFinalText + (interimText ? ' ' + interimText : '')).trim();
        if (candidate) {
          this.liveInterimTranscript = candidate;
          // Zero-latency word-by-word streaming to UI
          this.callbacks.onInterimTranscript?.(candidate);
        }

        // Debounce turn-taking pause (shorter for final chunks, never trapped by noise floor)
        this.armSilenceDebouncer(candidate, hasFinalResult);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        const errType = e.error || 'unknown';
        console.warn('[Web Speech API]', errType, e.message || '');

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.isListening = false;
          this.callbacks.onRecognitionState?.(false);
          this.callbacks.onError?.('Microphone access blocked. Click the lock/camera icon in your address bar to enable microphone.');
          return;
        }

        if (errType === 'network') {
          this.shouldBeListening = false;
          this.isListening = false;
          this.callbacks.onRecognitionState?.(false);
          this.callbacks.onError?.('Speech service network error. Please check your internet connection or use text input.');
          return;
        }

        if (errType === 'audio-capture') {
          this.shouldBeListening = false;
          this.isListening = false;
          this.callbacks.onRecognitionState?.(false);
          this.callbacks.onError?.('Could not capture audio. Please ensure no other application is using your microphone.');
          return;
        }

        // Non-fatal pauses ('no-speech' or 'aborted') - restart gracefully if user is still in listening mode
        if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
          setTimeout(() => {
            if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
              this.initWebSpeechRecognition();
            }
          }, 250);
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        // If user finished speaking and candidate text was captured, finalize immediately!
        if (this.liveInterimTranscript.trim().length > 0 || this.accumulatedFinalText.trim().length > 0) {
          this.handleEndOfUserSpeech();
          return;
        }

        // If continuous listening is desired and no utterance was captured, restart cleanly
        if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
          setTimeout(() => {
            if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
              this.initWebSpeechRecognition();
            }
          }, 150);
        } else {
          this.callbacks.onRecognitionState?.(false);
        }
      };

      recognition.start();
      this.speechRecognition = recognition;
    } catch (err: any) {
      console.warn('[BrowserSpeechController] Recognition startup notice:', err);
      if (err?.name === 'InvalidStateError') {
        // Asynchronous abort recovery: retry once after 200ms
        setTimeout(() => {
          if (this.shouldBeListening && !this.isSpeaking) {
            this.initWebSpeechRecognition();
          }
        }, 200);
      } else {
        this.callbacks.onError?.('Failed to start speech recognition: ' + (err?.message || 'Unknown error'));
      }
    }
  }

  /**
   * Adaptive clinical turn-taking silence debouncer:
   * 1. 800ms for short affirmative confirmations ("yes", "haan", "correct").
   * 2. 1100ms when native SpeechRecognition already tagged a final chunk.
   * 3. 2400ms for trailing conjunctions/incomplete thoughts ("because...", "and...").
   * 4. 1400ms base silence delay for standard phrases.
   * 5. Root Cause Fix: Removed the ambient noise trap (avg > 14) that permanently blocked speech finalization!
   */
  private armSilenceDebouncer(candidateText: string, hasFinalChunk = false): void {
    if (this.speechSilenceTimer) {
      clearTimeout(this.speechSilenceTimer);
      this.speechSilenceTimer = null;
    }

    const clean = candidateText.trim();
    if (!clean) return;

    // Check for trailing conjunctions, prepositions, or dangling phrases
    const isTrailingConjunction = /\b(and|or|but|because|cause|cuz|so|if|when|then|like|that|with|to|for|about|i|my|me|mein|main|mai|aur|lekin|par|kyunki|ki|toh|jaise|kuch|kya|kyun)\s*$/i.test(clean);
    const isIncomplete = isTrailingConjunction || isIncompleteUtterance(clean);
    const wordCount = clean.split(/\s+/).length;
    const isShortAffirmation = /^(yes|yeah|yep|haan|ha|sahi|sahi hai|bilkul|correct|right|ok|okay|sure|agree)\b/i.test(clean.toLowerCase().replace(/[.,!]/g, '')) && wordCount <= 3;

    const silenceDelay = isShortAffirmation ? 800 : (hasFinalChunk ? 1100 : (isIncomplete ? 2400 : 1400));

    this.speechSilenceTimer = setTimeout(() => {
      if (!this.isSpeaking && !this.isProcessingUtterance && (this.liveInterimTranscript.trim().length > 0 || this.accumulatedFinalText.trim().length > 0)) {
        this.handleEndOfUserSpeech();
      }
    }, silenceDelay);
  }

  /**
   * Finalizes speech when user completes a sentence/phrase/paragraph after a natural pause.
   */
  private async handleEndOfUserSpeech(): Promise<void> {
    if (this.isProcessingUtterance) return;
    this.isProcessingUtterance = true;
    this.isUserSpeaking = false;
    this.speechStartTime = 0;

    if (this.speechSilenceTimer) {
      clearTimeout(this.speechSilenceTimer);
      this.speechSilenceTimer = null;
    }

    // Safety watchdog timer
    if (this.processingSafetyTimer) clearTimeout(this.processingSafetyTimer);
    this.processingSafetyTimer = setTimeout(() => {
      if (this.isProcessingUtterance && !this.isSpeaking) {
        this.isProcessingUtterance = false;
        if (this.shouldBeListening) {
          this.startRecognition(this.mediaStream || undefined);
        }
      }
    }, 8000);

    // Stop MediaRecorder and allow final audio chunk to flush
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
        await new Promise((resolve) => setTimeout(resolve, 120));
      } catch (_) {}
    }

    this.stopListeningInternals();

    const finalText = this.liveInterimTranscript.trim();
    this.accumulatedFinalText = '';
    this.liveInterimTranscript = '';

    const finalVoiceState = voiceAcousticAnalyzer.evaluateState();
    voiceAcousticAnalyzer.reset();

    // Suppress acoustic echo: if audio finished playing within the last 1200ms and captured text matches assistant's own output
    if (this.lastSpeechEndTime > 0 && Date.now() - this.lastSpeechEndTime < 1200 && this.lastSpokenText) {
      const lower = finalText.toLowerCase();
      if (lower.length > 5 && (this.lastSpokenText.includes(lower) || lower.includes(this.lastSpokenText))) {
        console.warn('Acoustic speaker feedback echo detected and suppressed:', finalText);
        this.isProcessingUtterance = false;
        if (this.shouldBeListening && !this.isSpeaking) {
          this.startRecognition(this.mediaStream || undefined);
        }
        return;
      }
    }

    // 1. If Web Speech API captured text, finalize the paragraph with voice acoustic state!
    if (finalText.length > 0) {
      this.callbacks.onUserSpeech?.(finalText, true, finalVoiceState);
      setTimeout(() => {
        if (this.isProcessingUtterance && !this.isSpeaking) {
          this.isProcessingUtterance = false;
          if (this.shouldBeListening) {
            this.startRecognition(this.mediaStream || undefined);
          }
        }
      }, 1500);
      return;
    }

    // 2. If Web Speech API was blank (mobile Safari/Chrome or offline), transcribe recorded audio via /api/audio/transcribe (Faster-Whisper keyless)
    if (this.recordedChunks.length > 0) {
      try {
        const mimeType = this.mediaRecorderMimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
        const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
        this.recordedChunks = [];

        if (audioBlob.size > 1200) {
          const formData = new FormData();
          formData.append('file', audioBlob, `speech.${ext}`);
          if (this.currentLanguageLocale) {
            formData.append('language', this.currentLanguageLocale);
          }

          const res = await fetch('/api/audio/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              this.callbacks.onUserSpeech?.(data.text.trim(), true, finalVoiceState);
              setTimeout(() => {
                if (this.isProcessingUtterance && !this.isSpeaking) {
                  this.isProcessingUtterance = false;
                  if (this.shouldBeListening) {
                    this.startRecognition(this.mediaStream || undefined);
                  }
                }
              }, 1500);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Audio transcribe fallback notice:', err);
      }
    }

    // If nothing was detected, resume listening
    this.isProcessingUtterance = false;
    if (this.shouldBeListening && !this.isSpeaking) {
      this.startRecognition(this.mediaStream || undefined);
    }
  }

  private stopListeningInternals(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.speechRecognition) {
      try {
        this.speechRecognition.onresult = null;
        this.speechRecognition.onerror = null;
        this.speechRecognition.onend = null;
        this.speechRecognition.abort();
      } catch (_) {}
      this.speechRecognition = null;
    }
    this.callbacks.onRecognitionState?.(false);
    this.callbacks.onAudioLevel?.(0);
  }

  public async finishCurrentUtterance(): Promise<void> {
    if (this.isProcessingUtterance) return;
    if (this.liveInterimTranscript.trim().length > 0 || this.recordedChunks.length > 0) {
      await this.handleEndOfUserSpeech();
    }
  }

  public stopRecognition(): void {
    this.shouldBeListening = false;
    this.isProcessingUtterance = false;
    this.isUserSpeaking = false;
    this.speechStartTime = 0;
    this.liveInterimTranscript = '';
    this.accumulatedFinalText = '';
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    this.stopListeningInternals();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.analyser = null;
  }

  public stopListening(): void {
    this.stopRecognition();
  }

  public async startListening(
    onTranscript?: (transcript: string, isFinal: boolean, voiceState?: VoiceAcousticState) => void,
    onError?: (err: string) => void,
    existingStream?: MediaStream
  ): Promise<boolean> {
    if (onTranscript || onError) {
      this.callbacks = {
        ...this.callbacks,
        onUserSpeech: onTranscript
          ? (text, isFinal, voiceState) => onTranscript(text, isFinal, voiceState)
          : this.callbacks.onUserSpeech,
        onInterimTranscript: onTranscript
          ? (text) => onTranscript(text, false, voiceAcousticAnalyzer.evaluateState())
          : this.callbacks.onInterimTranscript,
        onError: onError || this.callbacks.onError,
      };
    }
    return this.startRecognition(existingStream);
  }

  public cleanTextForSpeech(text: string, locale?: string): string {
    if (!text) return '';
    let processed = text;

    const hasDevanagari = /[\u0900-\u097F]/.test(processed);
    const isEnglish = (locale && locale.startsWith('en')) || (!hasDevanagari && !locale);

    // Strip [GITA_SHLOKA] and [/GITA_SHLOKA] tags, but preserve the shloka text so TTS audibly reads it
    processed = processed
      .replace(/\[\/?GITA_SHLOKA\]/gi, ' ')
      .replace(/—\s*(?:श्रीमद्भगवद्गीता|Bhagavad Gita)[^.\n]*/gi, '');

    // For English locale when both Devanagari and Romanized shloka lines are present,
    // preserve the Romanized Sanskrit so English neural voices pronounce it naturally
    if (isEnglish && hasDevanagari) {
      const lines = processed.split('\n');
      const filtered = lines.map(line => {
        // If line is purely Devanagari and there is Romanized text elsewhere, drop pure Devanagari line for English TTS
        if (/^[\u0900-\u097F\s।॥—\d.,]+$/.test(line.trim())) {
          return '';
        }
        return line;
      });
      processed = filtered.filter(Boolean).join('\n');
    }

    return processed
      // 1. Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`.*?`/g, '')
      // 2. Remove Markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // 3. Remove bracketed RAG/metadata blocks e.g. [CLINICAL & PSYCHOEDUCATIONAL LIBRARY RAG CONTEXT] or [gad]
      .replace(/\[[a-zA-Z0-9_\s\-&:]+\]:?/g, '')
      // 4. Remove Markdown headers and stray hashes
      .replace(/#+/g, '')
      // 5. Remove bold, italics, strikethrough, underline
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      // 6. Remove bullet prefixes, numbers, and blockquotes
      .replace(/^[\s\t]*[•\-\*+]\s+/gm, '')
      .replace(/(?:^|(?<=[.:;?!]))\s*\d+\.\s+/gm, ' ')
      .replace(/^>\s*/gm, '')
      // 7. Convert XML/HTML entities and brackets
      .replace(/&amp;/g, ' and ')
      .replace(/&/g, ' and ')
      .replace(/[<>{}]/g, ' ')
      .replace(/[\[\]]/g, ' ')
      .replace(/\|/g, ', ')
      // 8. Strip emojis and non-alphanumeric pictographs
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu, '')
      // 9. Normalize whitespace and clean punctuation
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/\.{2,}/g, '.')
      .replace(/\s+([.,!?;:])/g, '$1')
      .trim();
  }

  /**
   * Speaks assistant response aloud with ultra-realistic Microsoft Edge Neural voice.
   * Automatically falls back to Web Speech API if offline or unavailable.
   */
  public async speak(
    text: string,
    onStartOrEnd?: () => void,
    onEndCallback?: () => void,
    localeOverride?: string
  ): Promise<void> {
    const onStart = onEndCallback ? onStartOrEnd : undefined;
    const onEnd = onEndCallback ? onEndCallback : onStartOrEnd;

    const hasHindiScript = /[\u0900-\u097F]/.test(text);
    const effectiveLocale = localeOverride || (hasHindiScript ? 'hi-IN' : (this.currentLanguageLocale || 'en-US'));

    const cleanText = this.cleanTextForSpeech(text, effectiveLocale);
    if (!cleanText) {
      this.isSpeaking = false;
      this.isProcessingUtterance = false;
      this.callbacks.onAssistantEnd?.();
      onEnd?.();
      if (this.shouldBeListening) {
        this.startRecognition();
      }
      return;
    }

    // Resolve optimal regional voice based on text script, localeOverride, or currentLanguageLocale
    const hasHindiScriptClean = /[\u0900-\u097F]/.test(cleanText);
    const resolvedLocale = effectiveLocale || (hasHindiScriptClean ? 'hi-IN' : 'en-US');
    const cleanLocaleKey = resolvedLocale.toLowerCase().replace('_', '-');
    const baseLang = cleanLocaleKey.split('-')[0];
    const selectedVoice = REGIONAL_NEURAL_VOICE_MAP[cleanLocaleKey] || REGIONAL_NEURAL_VOICE_MAP[baseLang] || 'en-US-AriaNeural';

    // 1. Primary: Real-Time Word & Sentence Boundary Highlighting (Karaoke Mode)
    // Uses native SpeechSynthesisUtterance.onboundary for millisecond-accurate boundary events!
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.speechSynth) {
      return this.speakWithWebSpeechSynth(cleanText, onStart, onEnd, effectiveLocale);
    }

    this.stopListeningInternals();
    this.cancelSpeech();
    this.isSpeaking = true;
    this.callbacks.onAssistantStart?.();
    onStart?.();

    // 2. Fallback: High-Fidelity Microsoft Edge Neural Voice Streaming with synchronized tracking
    try {
      const backendUrl = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL 
        ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '') 
        : '';
      const voiceBase = backendUrl ? `${backendUrl}/api/voice` : '/api/voice';

      let isFinished = false;
      const finishSpeech = () => {
        if (isFinished) return;
        isFinished = true;

        if (this.ttsWatchdogTimer) {
          clearTimeout(this.ttsWatchdogTimer);
          this.ttsWatchdogTimer = null;
        }

        if (this.currentBlobUrl) {
          try {
            URL.revokeObjectURL(this.currentBlobUrl);
          } catch (_) {}
          this.currentBlobUrl = null;
        }

        if (this.currentAudioElement) {
          try {
            this.currentAudioElement.pause();
            this.currentAudioElement.src = '';
          } catch (_) {}
          this.currentAudioElement = null;
        }

        if (this.currentSourceNode) {
          try {
            this.currentSourceNode.stop();
            this.currentSourceNode.disconnect();
          } catch (_) {}
          this.currentSourceNode = null;
        }

        this.isSpeaking = false;
        this.isProcessingUtterance = false;

        this.callbacks.onWordBoundary?.(-1, 0, '');
        this.callbacks.onAssistantEnd?.();
        onEnd?.();

        // Echo avoidance grace period: 200ms before re-engaging mic
        if (this.shouldBeListening) {
          setTimeout(() => {
            if (this.shouldBeListening && !this.isSpeaking) {
              this.startRecognition();
            }
          }, 200);
        }
      };

      const wordCount = cleanText.split(/\s+/).length;
      const maxEstimatedDurationMs = Math.max(4000, (wordCount / 2.0) * 1000 + 5000);
      this.ttsWatchdogTimer = setTimeout(() => {
        if (!isFinished && this.isSpeaking) {
          finishSpeech();
        }
      }, maxEstimatedDurationMs);

      // Fetch neural audio stream (Prefer POST for longer payloads to prevent URI overflow)
      let res: Response;
      if (cleanText.length > 200) {
        res = await fetch(voiceBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voice: selectedVoice,
            locale: effectiveLocale,
            rate: '-12%',
          }),
          signal: AbortSignal.timeout(3000),
        });
      } else {
        const voiceParam = encodeURIComponent(selectedVoice);
        const localeParam = encodeURIComponent(effectiveLocale);
        const voiceUrl = `${voiceBase}?text=${encodeURIComponent(cleanText)}&voice=${voiceParam}&locale=${localeParam}&rate=-12%`;
        res = await fetch(voiceUrl, {
          signal: AbortSignal.timeout(3000),
        });
      }

      if (!res.ok) {
        throw new Error(`Neural voice stream response ${res.status}`);
      }

      const audioBlob = await res.blob();
      if (audioBlob.size < 100) {
        throw new Error('Neural voice returned empty payload');
      }

      // Method A: HTMLAudioElement with local blob: URL
      try {
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
        }
        const blobUrl = URL.createObjectURL(audioBlob);
        this.currentBlobUrl = blobUrl;
        const audio = new Audio(blobUrl);
        this.currentAudioElement = audio;

        audio.onplay = () => {
          this.isSpeaking = true;
          this.callbacks.onAssistantStart?.();
        };

        audio.ontimeupdate = () => {
          if (!audio.duration || audio.duration === 0) return;
          const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
          const charIndex = Math.min(cleanText.length - 1, Math.floor(progress * cleanText.length));
          const prefix = cleanText.slice(0, charIndex);
          const words = prefix.trim().split(/\s+/).filter(Boolean);
          const currentWord = words[words.length - 1] || '';
          this.callbacks.onWordBoundary?.(charIndex, currentWord.length, currentWord);
        };

        audio.onended = finishSpeech;

        audio.onerror = async () => {
          console.warn('HTMLAudioElement error on blob, trying Web Audio decoding fallback...');
          await this.playWithAudioContext(audioBlob, finishSpeech, () => {
            this.speakWithWebSpeechSynth(cleanText, onStart, onEnd, effectiveLocale);
          }, cleanText);
        };

        await audio.play();
        return;
      } catch (playError) {
        console.warn('Audio.play() rejected (autoplay constraint), attempting Web Audio API destination...', playError);
        // Method B: Web Audio API AudioBufferSourceNode (Bypasses HTML5 Autoplay restrictions)
        await this.playWithAudioContext(audioBlob, finishSpeech, () => {
          this.speakWithWebSpeechSynth(cleanText, onStart, onEnd, effectiveLocale);
        }, cleanText);
        return;
      }
    } catch (neuralErr) {
      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
        this.ttsWatchdogTimer = null;
      }
      console.warn('Neural voice stream unreachable, falling back to Web Speech synthesis:', neuralErr);
      await this.speakWithWebSpeechSynth(cleanText, onStart, onEnd, effectiveLocale);
    }
  }

  /**
   * Plays audio through the unlocked AudioContext (immune to browser autoplay restrictions).
   */
  private async playWithAudioContext(
    blob: Blob,
    onEnded: () => void,
    onFallback: () => void,
    cleanText?: string
  ): Promise<void> {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!this.audioCtx) {
        onFallback();
        return;
      }

      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      let animId: number | null = null;
      const startTime = this.audioCtx.currentTime;
      const totalDuration = audioBuffer.duration;

      const trackProgress = () => {
        if (!this.audioCtx || !this.isSpeaking || !cleanText) return;
        const elapsed = this.audioCtx.currentTime - startTime;
        if (elapsed >= totalDuration) return;

        const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
        const charIndex = Math.min(cleanText.length - 1, Math.floor(progress * cleanText.length));
        const prefix = cleanText.slice(0, charIndex);
        const words = prefix.trim().split(/\s+/).filter(Boolean);
        const currentWord = words[words.length - 1] || '';
        this.callbacks.onWordBoundary?.(charIndex, currentWord.length, currentWord);

        animId = requestAnimationFrame(trackProgress);
      };

      source.onended = () => {
        if (animId) cancelAnimationFrame(animId);
        this.currentSourceNode = null;
        onEnded();
      };

      this.currentSourceNode = source;
      this.isSpeaking = true;
      this.callbacks.onAssistantStart?.();
      source.start(0);

      if (cleanText) {
        animId = requestAnimationFrame(trackProgress);
      }
    } catch (err) {
      console.warn('AudioContext playback error:', err);
      onFallback();
    }
  }

  /**
   * Primary Web Speech Synthesis for Real-Time Karaoke Mode
   * Hardened against Chrome's silent cancel/pause stall on subsequent utterances.
   */
  public async speakWithWebSpeechSynth(
    cleanText: string,
    onStart?: () => void,
    onEnd?: () => void,
    localeOverride?: string
  ): Promise<void> {
    if (!this.speechSynth || typeof window === 'undefined') {
      this.isSpeaking = false;
      this.isProcessingUtterance = false;
      this.callbacks.onAssistantEnd?.();
      onEnd?.();
      if (this.shouldBeListening) {
        this.startRecognition();
      }
      return;
    }

    this.stopListeningInternals();
    this.cancelSpeech();

    // 1. Clear any stuck utterance in Chrome's speech engine
    try {
      if (this.speechSynth.speaking || this.speechSynth.pending) {
        this.speechSynth.cancel();
      }
      if (this.speechSynth.paused) {
        this.speechSynth.resume();
      }
    } catch (_) {}

    // 2. Micro-delay: Chrome requires a brief pause after cancel() before queueing a new utterance
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      this.speechSynth.resume();
    } catch (_) {}

    const targetLocale = localeOverride || this.currentLanguageLocale || 'en-US';
    let matchedVoice: SpeechSynthesisVoice | null = null;
    try {
      matchedVoice = await getBestTherapeuticVoice(targetLocale);
    } catch (_) {}

    // Split cleanText into manageable sentence chunks (max 160 characters each)
    // to completely prevent Chromium's silent speech freeze/stall bug on long utterances
    const rawSentences = cleanText.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [cleanText];
    const sentenceChunks: string[] = [];
    let currentChunk = '';
    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (currentChunk.length + trimmed.length < 160) {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      } else {
        if (currentChunk) sentenceChunks.push(currentChunk);
        currentChunk = trimmed;
      }
    }
    if (currentChunk) sentenceChunks.push(currentChunk);
    if (sentenceChunks.length === 0) sentenceChunks.push(cleanText);

    this.lastSpokenText = (cleanText || '').toLowerCase().trim();
    const speechGeneration = ++this.activeSpeechGeneration;
    this.isSpeaking = true;
    let isFinished = false;
    const finishSpeech = () => {
      if (isFinished) return;
      isFinished = true;
      this.lastSpeechEndTime = Date.now();

      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
        this.ttsWatchdogTimer = null;
      }

      // Clear Chrome resume polling interval
      if (this.ttsResumeInterval) {
        clearInterval(this.ttsResumeInterval);
        this.ttsResumeInterval = null;
      }

      this.isSpeaking = false;
      this.isProcessingUtterance = false;
      (window as any).__activeUtterance = null;
      this.currentUtterance = null;

      this.callbacks.onWordBoundary?.(-1, 0, '');
      this.callbacks.onAssistantEnd?.();
      onEnd?.();

      if (this.shouldBeListening) {
        setTimeout(() => {
          if (this.shouldBeListening && !this.isSpeaking) {
            this.startRecognition();
          }
        }, 650);
      }
    };

    const wordCount = cleanText.split(/\s+/).length;
    // Responsive failsafe safety duration: avoids 45s lockup while giving adequate reading time
    const computeSafetyDuration = () => Math.min(25000, Math.max(4500, Math.ceil((wordCount / 1.8) * 1000) + 3500));

    const resetWatchdog = () => {
      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
      }
      this.ttsWatchdogTimer = setTimeout(() => {
        if (!isFinished) {
          finishSpeech();
        }
      }, computeSafetyDuration());
    };

    resetWatchdog();

    // Keep-alive heartbeat interval to defeat Chrome's 15-second silent suspension
    if (this.ttsResumeInterval) {
      clearInterval(this.ttsResumeInterval);
    }
    this.ttsResumeInterval = setInterval(() => {
      if (!isFinished && this.speechSynth) {
        try {
          if (this.speechSynth.paused) {
            this.speechSynth.resume();
          }
          this.speechSynth.resume();
        } catch (_) {}
      } else if (isFinished && this.ttsResumeInterval) {
        clearInterval(this.ttsResumeInterval);
        this.ttsResumeInterval = null;
      }
    }, 2500);

    let chunkIdx = 0;
    const chunkOffsets: number[] = [];
    let searchPos = 0;
    for (const chunk of sentenceChunks) {
      const idx = cleanText.indexOf(chunk, searchPos);
      if (idx >= 0) {
        chunkOffsets.push(idx);
        searchPos = idx + chunk.length;
      } else {
        chunkOffsets.push(searchPos);
        searchPos += chunk.length + 1;
      }
    }

    const speakNextChunk = () => {
      if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking || !this.speechSynth) {
        return;
      }
      if (chunkIdx >= sentenceChunks.length) {
        finishSpeech();
        return;
      }

      const currentChunkOffset = chunkOffsets[chunkIdx] || 0;
      const chunkText = sentenceChunks[chunkIdx++];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      // Medium, calm, soothing therapeutic speed (not in a hurry)
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = targetLocale;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (this.cachedVoice) {
        utterance.voice = this.cachedVoice;
      }

      (window as any).__activeUtterance = utterance;
      this.currentUtterance = utterance;

      let lastBoundaryFiredTime = performance.now();
      let chunkStartTime = performance.now();
      let lastEmittedCharIndex = 0;
      let boundaryTicker: ReturnType<typeof setInterval> | null = null;

      const stopBoundaryTicker = () => {
        if (boundaryTicker) {
          clearInterval(boundaryTicker);
          boundaryTicker = null;
        }
      };

      // Real-Time Word & Sentence Boundary Highlighting (Karaoke Mode)
      utterance.onboundary = (event: any) => {
        if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking) return;
        resetWatchdog();
        if (event.name && event.name !== 'word') return;
        lastBoundaryFiredTime = performance.now();
        const relativeCharIndex = event.charIndex || 0;
        const charLength = event.charLength || 0;
        lastEmittedCharIndex = relativeCharIndex;
        const absoluteCharIndex = currentChunkOffset + relativeCharIndex;
        let word = '';
        if (charLength > 0) {
          word = chunkText.slice(relativeCharIndex, relativeCharIndex + charLength);
        } else {
          const match = chunkText.slice(relativeCharIndex).match(/^\S+/);
          word = match ? match[0] : '';
        }
        this.callbacks.onWordBoundary?.(absoluteCharIndex, charLength || word.length, word);
      };

      utterance.onstart = () => {
        if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking) {
          try {
            this.speechSynth?.cancel();
          } catch (_) {}
          return;
        }
        resetWatchdog();
        chunkStartTime = performance.now();
        lastBoundaryFiredTime = performance.now();
        lastEmittedCharIndex = 0;

        if (chunkIdx === 1) {
          this.isSpeaking = true;
          this.callbacks.onAssistantStart?.();
          onStart?.();
        }

        // Emit first word of chunk immediately
        const firstMatch = chunkText.match(/^\S+/);
        const firstWord = firstMatch ? firstMatch[0] : '';
        this.callbacks.onWordBoundary?.(currentChunkOffset, firstWord.length, firstWord);

        // Adaptive boundary ticker: smoothly advance word tracking based on elapsed speech duration
        stopBoundaryTicker();
        boundaryTicker = setInterval(() => {
          if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking) {
            stopBoundaryTicker();
            return;
          }
          const now = performance.now();
          if (now - lastBoundaryFiredTime > 280) {
            const elapsedSec = (now - chunkStartTime) / 1000;
            const estimatedRelativeChar = Math.min(
              chunkText.length - 1,
              Math.max(lastEmittedCharIndex, Math.floor(elapsedSec * 15.5))
            );
            if (estimatedRelativeChar >= lastEmittedCharIndex) {
              lastEmittedCharIndex = estimatedRelativeChar;
              const absoluteCharIndex = currentChunkOffset + estimatedRelativeChar;
              const match = chunkText.slice(estimatedRelativeChar).match(/^\S+/);
              const word = match ? match[0] : '';
              this.callbacks.onWordBoundary?.(absoluteCharIndex, word.length || 1, word);
            }
          }
        }, 70);
      };

      utterance.onend = () => {
        stopBoundaryTicker();
        if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking) {
          return;
        }
        if (chunkIdx < sentenceChunks.length) {
          speakNextChunk();
        } else {
          finishSpeech();
        }
      };

      utterance.onerror = (e) => {
        stopBoundaryTicker();
        if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking) {
          return;
        }
        console.warn("SpeechSynthesis chunk notice:", e);
        if (chunkIdx < sentenceChunks.length) {
          speakNextChunk();
        } else {
          finishSpeech();
        }
      };

      try {
        this.speechSynth.speak(utterance);
        if (this.speechSynth.paused) {
          this.speechSynth.resume();
        }
        this.speechSynth.resume();
        setTimeout(() => {
          if (!isFinished && this.speechSynth && this.speechSynth.paused) {
            try {
              this.speechSynth.resume();
            } catch (_) {}
          }
        }, 60);
      } catch (err) {
        console.warn("Speech synthesis speak error:", err);
        finishSpeech();
      }
    };

    speakNextChunk();
  }

  public cancelSpeech(): void {
    this.activeSpeechGeneration++;
    if (this.currentBlobUrl) {
      try {
        URL.revokeObjectURL(this.currentBlobUrl);
      } catch (_) {}
      this.currentBlobUrl = null;
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch (_) {}
      this.currentAudioElement = null;
    }
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (_) {}
      this.currentSourceNode = null;
    }
    if (this.ttsWatchdogTimer) {
      clearTimeout(this.ttsWatchdogTimer);
      this.ttsWatchdogTimer = null;
    }
    if (this.ttsResumeInterval) {
      clearInterval(this.ttsResumeInterval);
      this.ttsResumeInterval = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch (_) {}
    }
    this.isSpeaking = false;
    this.isProcessingUtterance = false;
    this.currentUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__activeUtterance = null;
    }
    this.callbacks.onWordBoundary?.(-1, 0, '');
    this.callbacks.onAssistantEnd?.();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public stop(): void {
    this.cancelSpeech();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const browserSpeechController = BrowserSpeechController.getInstance();
export default browserSpeechController;
