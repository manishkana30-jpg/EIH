import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
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

    // 1. Try Groq Whisper (Ultra-Fast ~120ms Latency)
    if (groqKey) {
      try {
        const groqFormData = new FormData();
        groqFormData.append('file', file, 'audio.webm');
        groqFormData.append('model', 'whisper-large-v3-turbo');
        groqFormData.append('language', 'en');
        groqFormData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: groqFormData,
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          if (data.text) {
            return NextResponse.json({ text: data.text.trim(), engine: 'groq-whisper' });
          }
        }
      } catch (e) {
        console.warn('Groq whisper notice:', e);
      }
    }

    // 2. Try OpenAI Whisper
    if (openaiKey) {
      try {
        const oaiFormData = new FormData();
        oaiFormData.append('file', file, 'audio.webm');
        oaiFormData.append('model', 'whisper-1');
        oaiFormData.append('language', 'en');

        const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: oaiFormData,
        });

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          if (data.text) {
            return NextResponse.json({ text: data.text.trim(), engine: 'openai-whisper' });
          }
        }
      } catch (e) {
        console.warn('OpenAI whisper notice:', e);
      }
    }

    return NextResponse.json({ text: '', error: 'No cloud whisper API key configured' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal transcription error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
