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

import { getBestTherapeuticVoice } from './voice-selector';
import { detectUserSpokenLanguage } from '../i18n/language-catalog';

export interface BrowserSpeechCallbacks {
  onUserSpeech?: (transcript: string, isFinal: boolean) => void;
  onAssistantStart?: () => void;
  onAssistantEnd?: () => void;
  onError?: (error: string) => void;
  onInterimTranscript?: (text: string) => void;
  onRecognitionState?: (isListening: boolean) => void;
  onAudioLevel?: (level: number) => void;
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
  private animFrameId: number | null = null;
  private isUserSpeaking = false;
  private speechSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private processingSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private liveInterimTranscript = '';
  private accumulatedFinalText = '';
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private ttsWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private ttsResumeInterval: ReturnType<typeof setInterval> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  // Adaptive silence threshold (1400ms gives user breathing room to complete paragraphs)
  private silenceTimeoutMs = 1400;
  private currentLanguageLocale = 'en-US';

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

  public setCallbacks(callbacks: BrowserSpeechCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Starts Dual-Engine Voice Capture & Recognition.
   */
  public async startRecognition(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    this.shouldBeListening = true;

    if (this.isSpeaking) {
      return true;
    }

    this.isProcessingUtterance = false;
    this.liveInterimTranscript = '';
    this.accumulatedFinalText = '';

    // 1. Initialize Microphone Audio Stream & RMS VAD Engine
    await this.startMediaStreamAndVAD();

    // 2. Initialize Web Speech Recognition in parallel
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

  private async startMediaStreamAndVAD(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      if (!this.mediaStream || !this.mediaStream.active) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 24000,
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
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      }

      // Initialize MediaRecorder for fail-safe audio chunking
      if (this.mediaStream && typeof MediaRecorder !== 'undefined') {
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

          this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.recordedChunks.push(event.data);
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

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!this.analyser || !this.shouldBeListening || this.isSpeaking) {
        this.animFrameId = requestAnimationFrame(checkAudio);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normalizedLevel = Math.min(1, avg / 128);
      this.callbacks.onAudioLevel?.(normalizedLevel);

      // RMS VAD Threshold (> 14 indicates human voice presence)
      if (avg > 14) {
        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true;
          this.recordedChunks = [];
        }

        // Reset silence debouncer timer while user continues talking
        if (this.speechSilenceTimer) {
          clearTimeout(this.speechSilenceTimer);
          this.speechSilenceTimer = null;
        }
      } else if (this.isUserSpeaking) {
        // User stopped speaking: start adaptive silence debouncer
        if (!this.speechSilenceTimer) {
          this.speechSilenceTimer = setTimeout(() => {
            if (this.isUserSpeaking && !this.isProcessingUtterance) {
              this.handleEndOfUserSpeech();
            }
          }, this.silenceTimeoutMs);
        }
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
      recognition.lang = this.currentLanguageLocale || (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

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
          this.callbacks.onInterimTranscript?.(candidate);
        }

        // INTELLIGENT LONG PAUSE / SILENCE DETECTION:
        // When user pauses for >1400ms after speaking, commit the entire sentence/phrase/paragraph!
        if (this.speechSilenceTimer) {
          clearTimeout(this.speechSilenceTimer);
        }
        this.speechSilenceTimer = setTimeout(() => {
          if (!this.isSpeaking && !this.isProcessingUtterance && this.liveInterimTranscript.trim().length > 0) {
            this.handleEndOfUserSpeech();
          }
        }, this.silenceTimeoutMs);
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
          }, 200);
        }
      };

      recognition.onend = () => {
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
   * Finalizes speech when user completes a sentence/phrase/paragraph after a natural pause.
   */
  private async handleEndOfUserSpeech(): Promise<void> {
    if (this.isProcessingUtterance) return;
    this.isProcessingUtterance = true;
    this.isUserSpeaking = false;

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
          this.startRecognition();
        }
      }
    }, 4500);

    // Stop MediaRecorder and collect blob
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
    }

    this.stopListeningInternals();

    const finalText = this.liveInterimTranscript.trim();
    this.accumulatedFinalText = '';
    this.liveInterimTranscript = '';

    // 1. If Web Speech API captured text, finalize the paragraph immediately!
    if (finalText.length > 0) {
      this.callbacks.onUserSpeech?.(finalText, true);
      setTimeout(() => {
        if (this.isProcessingUtterance && !this.isSpeaking) {
          this.isProcessingUtterance = false;
          if (this.shouldBeListening) {
            this.startRecognition();
          }
        }
      }, 1500);
      return;
    }

    // 2. If Web Speech API was blank, transcribe recorded audio via /api/audio/transcribe fallback
    if (this.recordedChunks.length > 0) {
      try {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        if (audioBlob.size > 2000) {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');

          const res = await fetch('/api/audio/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              this.callbacks.onUserSpeech?.(data.text.trim(), true);
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
      this.startRecognition();
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

  public stopRecognition(): void {
    this.shouldBeListening = false;
    this.isProcessingUtterance = false;
    this.isUserSpeaking = false;
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
    onTranscript?: (transcript: string, isFinal: boolean) => void,
    onError?: (err: string) => void
  ): Promise<boolean> {
    if (onTranscript || onError) {
      this.callbacks = {
        ...this.callbacks,
        onUserSpeech: onTranscript
          ? (text, isFinal) => onTranscript(text, isFinal)
          : this.callbacks.onUserSpeech,
        onInterimTranscript: onTranscript
          ? (text) => onTranscript(text, false)
          : this.callbacks.onInterimTranscript,
        onError: onError || this.callbacks.onError,
      };
    }
    return this.startRecognition();
  }

  public cleanTextForSpeech(text: string): string {
    if (!text) return '';
    return text
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
    onEndCallback?: () => void
  ): Promise<void> {
    const onStart = onEndCallback ? onStartOrEnd : undefined;
    const onEnd = onEndCallback ? onEndCallback : onStartOrEnd;

    const cleanText = this.cleanTextForSpeech(text);
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

    this.stopListeningInternals();
    this.cancelSpeech();
    this.isSpeaking = true;
    this.callbacks.onAssistantStart?.();
    onStart?.();

    // 1. Primary: High-Fidelity Microsoft Edge Neural Voice Streaming (/api/voice or Vercel Backend)
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
            voice: 'en-US-AriaNeural',
            rate: '-4%',
          }),
        });
      } else {
        const voiceParam = encodeURIComponent('en-US-AriaNeural');
        const voiceUrl = `${voiceBase}?text=${encodeURIComponent(cleanText)}&voice=${voiceParam}&rate=-4%`;
        res = await fetch(voiceUrl);
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

        audio.onended = finishSpeech;

        audio.onerror = async () => {
          console.warn('HTMLAudioElement error on blob, trying Web Audio decoding fallback...');
          await this.playWithAudioContext(audioBlob, finishSpeech, () => {
            this.speakWithWebSpeechSynth(cleanText, onStart, onEnd);
          });
        };

        await audio.play();
        return;
      } catch (playError) {
        console.warn('Audio.play() rejected (autoplay constraint), attempting Web Audio API destination...', playError);
        // Method B: Web Audio API AudioBufferSourceNode (Bypasses HTML5 Autoplay restrictions)
        await this.playWithAudioContext(audioBlob, finishSpeech, () => {
          this.speakWithWebSpeechSynth(cleanText, onStart, onEnd);
        });
        return;
      }
    } catch (neuralErr) {
      console.warn('Neural voice stream unreachable, falling back to Web Speech synthesis:', neuralErr);
      this.speakWithWebSpeechSynth(cleanText, onStart, onEnd);
    }
  }

  /**
   * Plays audio through the unlocked AudioContext (immune to browser autoplay restrictions).
   */
  private async playWithAudioContext(
    blob: Blob,
    onEnded: () => void,
    onFallback: () => void
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
      source.onended = () => {
        this.currentSourceNode = null;
        onEnded();
      };

      this.currentSourceNode = source;
      this.isSpeaking = true;
      this.callbacks.onAssistantStart?.();
      source.start(0);
    } catch (err) {
      console.warn('AudioContext playback error:', err);
      onFallback();
    }
  }

  /**
   * Fallback Web Speech Synthesis (Client-side offline fallback)
   */
  private async speakWithWebSpeechSynth(
    cleanText: string,
    onStart?: () => void,
    onEnd?: () => void
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

    try {
      if (this.speechSynth.paused) {
        this.speechSynth.resume();
      }
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.94;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const langInfo = detectUserSpokenLanguage(cleanText);
    const targetLocale = langInfo.speechLocale || this.currentLanguageLocale || 'en-US';
    utterance.lang = targetLocale;

    (window as any).__activeUtterance = utterance;
    this.currentUtterance = utterance;

    try {
      const matchedVoice = await getBestTherapeuticVoice(targetLocale);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (this.cachedVoice) {
        utterance.voice = this.cachedVoice;
      }
    } catch (_) {}

    let isFinished = false;
    const finishSpeech = () => {
      if (isFinished) return;
      isFinished = true;

      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
        this.ttsWatchdogTimer = null;
      }

      this.isSpeaking = false;
      this.isProcessingUtterance = false;
      (window as any).__activeUtterance = null;
      this.currentUtterance = null;

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

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.callbacks.onAssistantStart?.();
      onStart?.();
    };

    utterance.onend = finishSpeech;
    utterance.onerror = () => finishSpeech();

    const wordCount = cleanText.split(/\s+/).length;
    const maxEstimatedDurationMs = Math.max(3000, (wordCount / 2.0) * 1000 + 2500);
    this.ttsWatchdogTimer = setTimeout(() => {
      if (!isFinished && this.isSpeaking) {
        finishSpeech();
      }
    }, maxEstimatedDurationMs);

    try {
      this.speechSynth.speak(utterance);
    } catch (_) {
      finishSpeech();
    }
  }

  public cancelSpeech(): void {
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
    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch (_) {}
    }
    this.isSpeaking = false;
    this.isProcessingUtterance = false;
    this.currentUtterance = null;
    (window as any).__activeUtterance = null;
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
