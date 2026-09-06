import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Try Groq Whisper (Ultra-Fast ~120ms Latency) if key is provided
    if (groqKey) {
      try {
        const groqFormData = new FormData();
        const filename = (file as any).name || (file.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm');
        groqFormData.append('file', file, filename);
        groqFormData.append('model', 'whisper-large-v3-turbo');
        groqFormData.append('language', 'en');
        groqFormData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: groqFormData,
          signal: AbortSignal.timeout(8000),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          if (data.text && data.text.trim()) {
            return NextResponse.json({ text: data.text.trim(), engine: 'groq-whisper' });
          }
        }
      } catch (e) {
        console.warn('Groq whisper notice:', e);
      }
    }

    // 2. Try OpenAI Whisper if key is provided
    if (openaiKey) {
      try {
        const oaiFormData = new FormData();
        const filename = (file as any).name || (file.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm');
        oaiFormData.append('file', file, filename);
        oaiFormData.append('model', 'whisper-1');
        oaiFormData.append('language', 'en');

        const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: oaiFormData,
          signal: AbortSignal.timeout(8000),
        });

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          if (data.text && data.text.trim()) {
            return NextResponse.json({ text: data.text.trim(), engine: 'openai-whisper' });
          }
        }
      } catch (e) {
        console.warn('OpenAI whisper notice:', e);
      }
    }

    // 3. 100% KEYLESS OPTION: Local Faster-Whisper Daemon on FastAPI
    const backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');

    try {
      const backendFormData = new FormData();
      const filename = (file as any).name || (file.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm');
      backendFormData.append('file', file, filename);

      const backendRes = await fetch(`${backendUrl}/api/stt`, {
        method: 'POST',
        body: backendFormData,
        signal: AbortSignal.timeout(15000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        const text = data.transcript || data.transcription || '';
        if (text && text.trim()) {
          return NextResponse.json({ text: text.trim(), engine: 'faster-whisper-keyless' });
        }
      } else {
        console.warn('Backend STT notice, status:', backendRes.status);
      }
    } catch (backendErr) {
      console.warn('Local Faster-Whisper daemon connection notice:', backendErr);
    }

    return NextResponse.json({ text: '', error: 'No speech recognized' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal transcription error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

