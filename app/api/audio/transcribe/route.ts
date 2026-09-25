import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const reqLanguage = formData.get('language') as string | null;
    const requestedLang = reqLanguage && reqLanguage !== 'auto'
      ? reqLanguage.split('-')[0].split('_')[0].toLowerCase()
      : null;

    // 100% KEYLESS: Forward to Local Faster-Whisper Daemon on FastAPI
    const backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_LOCAL_DAEMON_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');

    try {
      const backendFormData = new FormData();
      const filename = (file as any).name || (file.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm');
      backendFormData.append('file', file, filename);
      if (requestedLang) {
        backendFormData.append('language', requestedLang);
      }

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
        console.warn('Local Faster-Whisper daemon returned status:', backendRes.status);
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
