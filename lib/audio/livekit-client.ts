/**
 * Tier 1 & Tier 2: LiveKit WebRTC Audio Client
 * Manages low-latency UDP WebRTC bidirectional audio streaming with LiveKit Agents,
 * ephemeral BYOK metadata passing, and barge-in interruption handling.
 */

import { Room, RoomEvent, Track, RemoteTrackPublication, RemoteParticipant, LocalAudioTrack } from 'livekit-client';
import { audioManager } from './audio-manager';

export interface VoiceMessageEvent {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'crisis';
  text: string;
  timestamp: number;
  pillar?: 'Jnana' | 'Vijnana' | 'Dhairya' | 'Smriti' | 'Samadhi';
  isInterrupted?: boolean;
}

export type LiveKitVoiceState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'thinking';
export type VoiceState = LiveKitVoiceState;

export interface LiveKitConnectionOptions {
  serverUrl: string;
  token: string;
  tier: 1 | 2;
}

export class LiveKitAudioClient {
  private static instance: LiveKitAudioClient;
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private state: LiveKitVoiceState = 'disconnected';
  private stateListeners: Set<(state: LiveKitVoiceState) => void> = new Set();
  private messageListeners: Set<(msg: VoiceMessageEvent) => void> = new Set();
  private emotionListeners: Set<(data: Record<string, unknown>) => void> = new Set();
  private errorListeners: Set<(err: Error) => void> = new Set();
  private currentAssistantAudio: HTMLAudioElement | null = null;

  private constructor() {}

  public static getInstance(): LiveKitAudioClient {
    if (!LiveKitAudioClient.instance) {
      LiveKitAudioClient.instance = new LiveKitAudioClient();
    }
    return LiveKitAudioClient.instance;
  }

  public onStateChange(listener: (state: LiveKitVoiceState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public onMessage(listener: (msg: VoiceMessageEvent) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onEmotionUpdate(listener: (data: Record<string, unknown>) => void): () => void {
    this.emotionListeners.add(listener);
    return () => this.emotionListeners.delete(listener);
  }

  public onError(listener: (err: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private setState(newState: LiveKitVoiceState): void {
    this.state = newState;
    this.stateListeners.forEach((fn) => fn(newState));
  }

  private emitMessage(msg: VoiceMessageEvent): void {
    this.messageListeners.forEach((fn) => fn(msg));
  }

  /**
   * Connects to LiveKit server room via WebRTC UDP transport.
   */
  public async connect(options: LiveKitConnectionOptions): Promise<boolean> {
    this.setState('connecting');

    try {
      await audioManager.initialize();

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      this.room.on(RoomEvent.Connected, async () => {
        this.setState('listening');
        // Capture microphone and publish track
        const micStream = await audioManager.startMicrophoneCapture();
        if (micStream && micStream.getAudioTracks().length > 0) {
          this.localAudioTrack = new LocalAudioTrack(micStream.getAudioTracks()[0]);
          await this.room?.localParticipant.publishTrack(this.localAudioTrack);
        }
      });

      this.room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach();
            this.currentAssistantAudio = audioElement;
            this.setState('speaking');

            audioElement.onended = () => {
              this.setState('listening');
            };
          }
        }
      );

      this.room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          if (data.type === 'transcript') {
            this.emitMessage({
              id: `msg-${Date.now()}`,
              role: data.role || 'assistant',
              text: data.text,
              timestamp: Date.now(),
              pillar: data.pillar,
            });
          } else if (data.type === 'EMOTION_UPDATE') {
            this.emotionListeners.forEach((fn) => fn(data));
          }
        } catch (_) {}
      });

      this.room.on(RoomEvent.Disconnected, () => {
        this.setState('disconnected');
      });

      await this.room.connect(options.serverUrl, options.token);
      return true;
    } catch (err: unknown) {
      console.warn(`LiveKit connection error for Tier ${options.tier}:`, err);
      this.errorListeners.forEach((fn) => fn(err instanceof Error ? err : new Error(String(err))));
      this.disconnect();
      return false;
    }
  }

  /**
   * Instantly stops assistant audio output upon user speech onset (Barge-in).
   */
  public handleBargeInInterruption(): void {
    if (this.currentAssistantAudio) {
      this.currentAssistantAudio.pause();
      this.currentAssistantAudio.currentTime = 0;
      this.currentAssistantAudio = null;
    }
    this.setState('listening');
  }

  public disconnect(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    this.currentAssistantAudio = null;
    this.setState('disconnected');
  }

  public getState(): LiveKitVoiceState {
    return this.state;
  }
}

export const liveKitAudioClient = LiveKitAudioClient.getInstance();
export const LiveKitVoiceClient = LiveKitAudioClient;
export default LiveKitAudioClient;
