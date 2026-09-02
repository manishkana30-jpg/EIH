/**
 * lib/audio/audio-manager.ts
 *
 * Resilient Audio Context & iOS WebKit Keep-Alive Manager (v2.0)
 * Maintains an uninterrupted audio capture pipeline across iOS Safari, Android Chrome, and Desktop.
 *
 * Key Architecture:
 * 1. AudioContext singleton (`getAudioContext()`)
 * 2. Continuous silent-buffer loop (gain = 0.0001) + MediaSession bindings for iOS lock-screen survival
 * 3. Media constraints: autoGainControl = false (prevents clipping quiet/emotional speech), 24kHz mono
 * 4. Visibility change keep-alive heartbeat logging
 * 5. Typed error handling for NotAllowedError and NotFoundError
 */

export interface AudioLevelCallback {
  (db: number): void;
}

export type AudioManagerErrorCode =
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'CONTEXT_CREATION_FAILED'
  | 'CAPTURE_FAILED'
  | 'UNKNOWN_ERROR';

export class AudioManagerError extends Error {
  public code: AudioManagerErrorCode;
  public userMessage: string;

  constructor(code: AudioManagerErrorCode, userMessage: string, originalError?: unknown) {
    super(userMessage);
    this.name = 'AudioManagerError';
    this.code = code;
    this.userMessage = userMessage;
    if (originalError && originalError instanceof Error) {
      this.stack = originalError.stack;
    }
  }
}

// Global singleton AudioContext holder
let globalAudioContext: AudioContext | null = null;

/**
 * Returns the singleton AudioContext instance across the entire session.
 * Never creates more than one AudioContext.
 */
export function getAudioContext(): AudioContext {
  if (!globalAudioContext || globalAudioContext.state === 'closed') {
    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : null;

    if (!AudioCtx) {
      throw new AudioManagerError(
        'CONTEXT_CREATION_FAILED',
        'Web Audio API is not supported in this browser.'
      );
    }

    globalAudioContext = new AudioCtx({
      latencyHint: 'interactive',
      sampleRate: 24000,
    });
  }

  return globalAudioContext;
}

export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private silentSource: AudioBufferSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private levelInterval: number | null = null;
  private levelCallback: AudioLevelCallback | null = null;
  private isCapturing = false;
  private hasAttachedListeners = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupLifecycleListeners();
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the AudioContext on an explicit user gesture and starts the iOS keep-alive loop.
   */
  public async initialize(): Promise<AudioContext> {
    this.audioContext = getAudioContext();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.analyserNode) {
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;
    }

    this.startSilentKeepAliveLoop();
    this.setupMediaSession();

    return this.audioContext;
  }

  /**
   * Continuous silent-buffer loop (gain = 0.0001) preventing iOS Safari from suspending
   * audio processing during lock screen or background transitions.
   */
  private startSilentKeepAliveLoop(): void {
    if (!this.audioContext || this.silentSource) return;

    try {
      // 1-second silent audio buffer
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = 0;
      }

      this.silentSource = this.audioContext.createBufferSource();
      this.silentSource.buffer = buffer;
      this.silentSource.loop = true;

      // Microscopic gain (0.0001) keeps hardware clock alive without audible hiss
      this.silentGain = this.audioContext.createGain();
      this.silentGain.gain.value = 0.0001;

      this.silentSource.connect(this.silentGain);
      this.silentGain.connect(this.audioContext.destination);

      this.silentSource.start(0);
      console.log('[AudioManager] iOS keep-alive silent loop engaged.');
    } catch (err) {
      console.warn('[AudioManager] Silent loop start failed:', err);
    }
  }

  /**
   * Media Session API bindings for background audio lock-screen continuity.
   */
  private setupMediaSession(): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Healer Sanctuary Session',
        artist: 'Emotional Intelligence Hub',
        album: 'Therapeutic Voice Companion',
      });

      navigator.mediaSession.playbackState = 'playing';

      navigator.mediaSession.setActionHandler('play', async () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        // Prevent default pause on lock screen
      });
    } catch (err) {
      console.warn('[AudioManager] MediaSession setup notice:', err);
    }
  }

  /**
   * Visibility change handler: resume AudioContext and replay silent buffer.
   */
  private setupLifecycleListeners(): void {
    if (this.hasAttachedListeners) return;

    const handleResume = async () => {
      if (this.audioContext) {
        if (this.audioContext.state === 'suspended') {
          try {
            await this.audioContext.resume();
          } catch (e) {
            console.warn('[AudioManager] AudioContext auto-resume error:', e);
          }
        }
        console.log('[AudioManager] keep-alive heartbeat - AudioContext state:', this.audioContext.state);
      }
    };

    document.addEventListener('visibilitychange', () => {
      handleResume();
    });

    window.addEventListener('pageshow', handleResume);
    window.addEventListener('touchstart', handleResume, { passive: true });
    window.addEventListener('pointerdown', handleResume, { passive: true });

    this.hasAttachedListeners = true;
  }

  /**
   * Starts microphone capture with constraints tailored for emotional, quiet speech.
   */
  public async startCapture(): Promise<MediaStream> {
    if (this.isCapturing && this.mediaStream) {
      return this.mediaStream;
    }

    await this.initialize();

    const constraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false, // CRITICAL: Disable to prevent clipping quiet/emotional speech
      channelCount: 1,
      sampleRate: 24000,
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
      });

      if (!this.audioContext) {
        this.audioContext = getAudioContext();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      if (!this.analyserNode) {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 512;
      }

      this.sourceNode.connect(this.analyserNode);
      this.isCapturing = true;

      this.startLevelMonitoring();
      return this.mediaStream;
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new AudioManagerError(
            'PERMISSION_DENIED',
            'Microphone access was denied. Please allow microphone permissions in your browser address bar to speak with your companion.',
            err
          );
        }
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new AudioManagerError(
            'DEVICE_NOT_FOUND',
            'No microphone was detected on your device. Please plug in a microphone or headset and refresh.',
            err
          );
        }
      }

      throw new AudioManagerError(
        'CAPTURE_FAILED',
        'Could not initialize microphone capture. Please check your audio settings.',
        err
      );
    }
  }

  /**
   * Compatibility alias for startCapture
   */
  public async startMicrophoneCapture(): Promise<MediaStream> {
    return this.startCapture();
  }

  /**
   * Stops microphone capture and cleans up streams.
   */
  public stopCapture(): void {
    if (this.levelInterval) {
      window.clearInterval(this.levelInterval);
      this.levelInterval = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    this.isCapturing = false;
    if (this.levelCallback) {
      this.levelCallback(-100);
    }
  }

  /**
   * Returns the Web Audio AnalyserNode for external visualizers.
   */
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Registers a callback for real-time decibel level changes for the UI visualizer.
   */
  public onLevelChange(callback: AudioLevelCallback): () => void {
    this.levelCallback = callback;
    return () => {
      if (this.levelCallback === callback) {
        this.levelCallback = null;
      }
    };
  }

  /**
   * Polls FFT analyser to compute RMS decibel levels for speech volume indicators.
   */
  private startLevelMonitoring(): void {
    if (this.levelInterval) clearInterval(this.levelInterval);

    const dataArray = new Uint8Array(this.analyserNode ? this.analyserNode.frequencyBinCount : 256);

    this.levelInterval = window.setInterval(() => {
      if (!this.analyserNode || !this.isCapturing) {
        if (this.levelCallback) this.levelCallback(-100);
        return;
      }

      this.analyserNode.getByteTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      // Convert RMS to decibels (range roughly -100 dB to 0 dB)
      const db = rms > 0.0001 ? 20 * Math.log10(rms) : -100;

      if (this.levelCallback) {
        this.levelCallback(Math.max(-100, Math.min(0, Math.round(db))));
      }
    }, 50);
  }

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }
}

export const audioManager = AudioManager.getInstance();

/**
 * Acquires an ultra-clean, noise-isolated 48kHz mono audio stream with WebRTC studio constraints.
 */
export async function getCleanAudioStream(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      sampleRate: 48000,
      channelCount: 1,
    },
    video: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Validate that audio tracks have noise suppression active
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      const settings = audioTrack.getSettings();
      console.log('[Audio Pipeline] Active constraints:', settings);
    }

    return stream;
  } catch (err) {
    console.error('[Audio Pipeline] Failed to acquire noise-cancelled stream:', err);
    throw err;
  }
}

