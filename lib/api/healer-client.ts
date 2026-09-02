// lib/api/healer-client.ts

export interface ClinicalSource {
  title: string;
  url?: string;
  source: string;
}

export interface PsychologicalTelemetry {
  dominant_emotion: string;
  polyvagal_state: string;
  cbt_distortion: string;
  percentages: Record<string, number>;
  strategy: string;
}

export interface ChatResponse {
  reply: string;
  audio_base64?: string;
  telemetry: PsychologicalTelemetry;
  sources: ClinicalSource[];
  engine: string;
  is_crisis: boolean;
}

export interface ChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
}

export interface STTResponse {
  transcript: string;
}

class HealerBackendClient {
  private baseUrl: string;

  constructor() {
    if (typeof window !== 'undefined') {
      const publicUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      this.baseUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/api` : '/api/py';
    } else {
      this.baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/api';
    }
  }

  /**
   * Health check to ensure FastAPI backend is responsive
   */
  async checkHealth(): Promise<boolean> {
    try {
      const healthUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '')}/health` : '/api/health')
        : `${this.baseUrl.replace(/\/api$/, '')}/health`;
      const res = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendMessage(
    message: string,
    history?: ChatHistoryItem[],
    voiceMode: boolean = true,
    language?: string
  ): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        voice_mode: voiceMode,
        language: language || undefined,
      }),
      signal: AbortSignal.timeout(25000), // 25s timeout for search + speech synthesis
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as ChatResponse;
  }

  /**
   * Sends recorded audio blob to Faster-Whisper on FastAPI for transcription
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'speech.wav');

    const res = await fetch(`${this.baseUrl}/stt`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`STT failed with status ${res.status}`);
    }

    const data = (await res.json()) as STTResponse;
    return data.transcript;
  }
}

export const healerClient = new HealerBackendClient();
