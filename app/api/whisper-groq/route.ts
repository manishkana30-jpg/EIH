import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const apiKeyHeader = req.headers.get('x-api-key') || '';
    const groqKey = apiKeyHeader.startsWith('gsk_') ? apiKeyHeader : process.env.GROQ_API_KEY;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!groqKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured for cloud Whisper transcription.' },
        { status: 401 }
      );
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.wav');
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('response_format', 'verbose_json');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqFormData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json(
        { error: `Groq Whisper error: ${errText}` },
        { status: groqRes.status }
      );
    }

    const data = await groqRes.json();
    return NextResponse.json({
      text: data.text ? data.text.trim() : '',
      duration: data.duration || 0,
      language: data.language || 'en',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverless transcription failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
