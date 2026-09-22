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

  // Adaptive silence threshold (2800ms gives user generous breathing room to complete thoughts)
  private silenceTimeoutMs = 2800;
  private currentLanguageLocale = 'en-US';
  private activeSpeechGeneration = 0;

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
   * Starts Dual-Engine Voice Capture & Recognition.
   */
  public async startRecognition(existingStream?: MediaStream): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    this.shouldBeListening = true;

    if (this.isSpeaking) {
      return true;
    }

    this.isProcessingUtterance = false;
    this.liveInterimTranscript = '';
    this.accumulatedFinalText = '';

    const hasSpeechRec =
      typeof window !== 'undefined' &&
      !!(
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition
      );

    const isMobile =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (hasSpeechRec && isMobile) {
      // On mobile browsers, avoid Web Audio / MediaRecorder contention so the OS dictation engine has clean mic access
      this.initWebSpeechRecognition();
    } else {
      // 1. Initialize Microphone Audio Stream & RMS VAD Engine
      await this.startMediaStreamAndVAD(existingStream);

      // 2. Initialize Web Speech Recognition in parallel
      this.initWebSpeechRecognition();
    }

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
      } else if (!this.mediaStream || !this.mediaStream.active) {
        if (!navigator.mediaDevices?.getUserMedia) return;
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

      if (this.audioCtx && this.mediaStream && !this.analyser) {
        const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 1024;
        source.connect(this.analyser);
      }

      // Initialize MediaRecorder for fail-safe audio chunking
      if (this.mediaStream && typeof MediaRecorder !== 'undefined') {
        try {
          const supportedType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

          this.mediaRecorderMimeType = supportedType;
          this.mediaRecorder = supportedType
            ? new MediaRecorder(this.mediaStream, { mimeType: supportedType })
            : new MediaRecorder(this.mediaStream);

          this.recordedChunks = [];
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.recordedChunks.push(event.data);
              // Prevent unbounded memory growth if user stays silent
              if (!this.isUserSpeaking && this.recordedChunks.length > 50) {
                this.recordedChunks.splice(0, this.recordedChunks.length - 15);
              }
            }
          };
          this.mediaRecorder.start(250);
        } catch (recorderError) {
          console.warn('MediaRecorder VAD backup notice:', recorderError);
        }
      }

      // Start RMS Amplitude VAD Loop
      this.startVADLoop();
    } catch (err) {
      console.warn('Microphone stream initialization notice:', err);
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

      // VAD voiced indicator: user is actively vibrating vocal cords or speaking
      this.isUserSpeaking = frameResult.isVoiced || avg > 14;

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
   * Web Speech Recognition initialization with full sentence & paragraph buffering.
   */
  private initWebSpeechRecognition(): void {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    if (this.speechRecognition) {
      try {
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
      const preferredLang =
        this.currentLanguageLocale ||
        (typeof navigator !== 'undefined' && navigator.language) ||
        'en-US';
      recognition.lang = preferredLang;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (this.isSpeaking) {
          this.cancelSpeech();
        }
        if (this.isProcessingUtterance) return;

        let interimText = '';
        let newFinalText = '';

        for (let i = event.resultIndex || 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            const transcript = res[0].transcript || '';
            if (res.isFinal) {
              newFinalText += transcript + ' ';
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
          // Zero-latency word-by-word interim transcript streaming
          this.callbacks.onInterimTranscript?.(candidate);
        }

        // Clinical turn-taking debouncer (never interrupts while user is speaking)
        this.armSilenceDebouncer(candidate);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Web Speech API note:', e.error);
        }
        if (this.shouldBeListening && !this.isSpeaking) {
          setTimeout(() => {
            if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
              this.initWebSpeechRecognition();
            }
          }, 300);
        }
      };

      recognition.onend = () => {
        // Critical Fix: Do NOT prematurely terminate user speech if continuous listening is active.
        // Web Speech engines (Chrome desktop & mobile) trigger onend during short 500ms breath pauses.
        // If the user explicitly stopped listening (!this.shouldBeListening), finalize immediately.
        // Otherwise, restart recognition to keep buffering so the user can complete their sentence!
        if (!this.isSpeaking && !this.isProcessingUtterance && !this.shouldBeListening && (this.liveInterimTranscript.trim().length > 0 || this.accumulatedFinalText.trim().length > 0)) {
          this.handleEndOfUserSpeech();
          return;
        }

        this.isListening = false;
        if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
          setTimeout(() => {
            if (this.shouldBeListening && !this.isSpeaking && !this.isProcessingUtterance) {
              this.initWebSpeechRecognition();
              this.isListening = true;
              this.callbacks.onRecognitionState?.(true);
            }
          }, 150);
        }
      };

      recognition.start();
      this.speechRecognition = recognition;
      this.isListening = true;
      this.callbacks.onRecognitionState?.(true);
    } catch (err) {
      console.warn('SpeechRecognition startup notice:', err);
    }
  }

  /**
   * Adaptive clinical turn-taking silence debouncer:
   * 1. Grants 2600ms base silence delay to allow natural breathing and formulation of thoughts.
   * 2. Automatically detects incomplete clauses, trailing conjunctions ("and", "because", "but", "so", "aur", "kyunki"),
   *    or dangling pronouns and extends the delay to 3400ms.
   * 3. VAD Voice Activity Guard: As long as the user's vocal cords produce acoustic energy (isUserSpeaking = true),
   *    the debouncer re-arms and NEVER cuts off the user mid-thought!
   */
  private armSilenceDebouncer(candidateText: string): void {
    if (this.speechSilenceTimer) {
      clearTimeout(this.speechSilenceTimer);
      this.speechSilenceTimer = null;
    }

    const clean = candidateText.trim();
    if (!clean) return;

    // Check for trailing conjunctions, prepositions, or dangling phrases
    const isTrailingConjunction = /\b(and|or|but|because|cause|cuz|so|if|when|then|like|that|with|to|for|about|i|my|me|mein|main|mai|aur|lekin|par|kyunki|ki|toh|jaise|kuch|kya|kyun)\s*$/i.test(clean);
    const isIncomplete = isTrailingConjunction || isIncompleteUtterance(clean);
    const silenceDelay = isIncomplete ? 3400 : this.silenceTimeoutMs;

    this.speechSilenceTimer = setTimeout(() => {
      // VAD Voice Activity Guard: if microphone detects vocal energy, do NOT cut off!
      if (this.isUserSpeaking) {
        this.armSilenceDebouncer(this.liveInterimTranscript);
        return;
      }

      if (!this.isSpeaking && !this.isProcessingUtterance && this.liveInterimTranscript.trim().length > 0) {
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

    // Always strictly strip [GITA_SHLOKA]...[/GITA_SHLOKA] from speech payload in all languages
    // The Gita contemplation card is rendered silently in the UI
    processed = processed.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/gi, '');
    if (isEnglish) {
      processed = processed.replace(/[\u0900-\u097F]+/g, '');
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
            rate: '-4%',
          }),
          signal: AbortSignal.timeout(3000),
        });
      } else {
        const voiceParam = encodeURIComponent(selectedVoice);
        const localeParam = encodeURIComponent(effectiveLocale);
        const voiceUrl = `${voiceBase}?text=${encodeURIComponent(cleanText)}&voice=${voiceParam}&locale=${localeParam}&rate=-4%`;
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

    const speechGeneration = ++this.activeSpeechGeneration;
    let isFinished = false;
    const finishSpeech = () => {
      if (isFinished) return;
      isFinished = true;

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
        }, 200);
      }
    };

    const wordCount = cleanText.split(/\s+/).length;
    const maxEstimatedDurationMs = Math.max(6000, (wordCount / 1.8) * 1000 + 8000);
    this.ttsWatchdogTimer = setTimeout(() => {
      if (!isFinished) {
        finishSpeech();
      }
    }, maxEstimatedDurationMs);

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
      utterance.rate = 0.94;
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
    this.shouldBeListening = false;
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
