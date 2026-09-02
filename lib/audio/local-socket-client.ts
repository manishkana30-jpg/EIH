/**
 * Tier 3: Local WebSocket Client for Local Daemon
 * Connects to the local Python Voice Server (ws://127.0.0.1:8765) running Faster-Whisper + Ollama + Kokoro TTS.
 */

export interface DaemonMessageEvent {
  type: 'transcript' | 'audio_chunk' | 'assistant_text' | 'error' | 'pong';
  text?: string;
  audioBase64?: string;
  sampleRate?: number;
  latencyMs?: number;
}

export class LocalSocketClient {
  private static instance: LocalSocketClient;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private url: string = 'ws://127.0.0.1:8765';
  private messageListeners: Set<(msg: DaemonMessageEvent) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  public static getInstance(): LocalSocketClient {
    if (!LocalSocketClient.instance) {
      LocalSocketClient.instance = new LocalSocketClient();
    }
    return LocalSocketClient.instance;
  }

  public setUrl(url: string) {
    this.url = url;
  }

  public onMessage(listener: (msg: DaemonMessageEvent) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onStatusChange(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Probes if the local daemon server is alive.
   */
  public async probe(customUrl?: string): Promise<boolean> {
    const targetUrl = customUrl || this.url;
    return new Promise((resolve) => {
      try {
        const testWs = new WebSocket(targetUrl);
        const timeout = setTimeout(() => {
          testWs.close();
          resolve(false);
        }, 1500);

        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };

        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          this.isConnected = true;
          this.statusListeners.forEach((fn) => fn(true));
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data) as DaemonMessageEvent;
              this.messageListeners.forEach((fn) => fn(data));
            } catch (err) {
              console.warn('Error parsing daemon JSON frame:', err);
            }
          } else if (event.data instanceof ArrayBuffer) {
            // Binary audio chunk received from local Kokoro TTS
            this.messageListeners.forEach((fn) =>
              fn({
                type: 'audio_chunk',
                sampleRate: 24000,
              })
            );
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.statusListeners.forEach((fn) => fn(false));
          this.ws = null;
        };

        this.ws.onerror = () => {
          this.isConnected = false;
          this.statusListeners.forEach((fn) => fn(false));
          resolve(false);
        };
      } catch (err) {
        console.warn('Local daemon connection error:', err);
        resolve(false);
      }
    });
  }

  /**
   * Sends raw PCM Int16 buffer over WebSocket for Faster-Whisper transcription.
   */
  public sendAudioChunk(pcmBuffer: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(pcmBuffer);
    }
  }

  /**
   * Sends text prompt to local daemon for Ollama generation.
   */
  public sendText(text: string, context?: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'user_prompt',
          text,
          context,
          timestamp: Date.now(),
        })
      );
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.statusListeners.forEach((fn) => fn(false));
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const localSocketClient = LocalSocketClient.getInstance();
export default localSocketClient;
