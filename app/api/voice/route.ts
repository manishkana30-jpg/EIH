import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const REGIONAL_VOICE_MAP: Record<string, string> = {
  'hi': 'hi-IN-SwaraNeural',
  'hi-in': 'hi-IN-SwaraNeural',
  'es': 'es-ES-ElviraNeural',
  'es-es': 'es-ES-ElviraNeural',
  'fr': 'fr-FR-DeniseNeural',
  'fr-fr': 'fr-FR-DeniseNeural',
  'de': 'de-DE-KatjaNeural',
  'de-de': 'de-DE-KatjaNeural',
  'en': 'en-US-AriaNeural',
  'en-us': 'en-US-AriaNeural',
  'en-gb': 'en-GB-SoniaNeural',
  'en-in': 'en-IN-NeerjaNeural',
};

function resolveVoice(text: string, voice?: string, locale?: string): string {
  const hasHindi = /[\u0900-\u097F]/.test(text);
  if (hasHindi && (!voice || voice === 'en-US-AriaNeural')) {
    return 'hi-IN-SwaraNeural';
  }
  if (voice && voice !== 'en-US-AriaNeural') {
    return voice;
  }
  if (locale) {
    const clean = locale.toLowerCase().replace('_', '-');
    const base = clean.split('-')[0];
    if (REGIONAL_VOICE_MAP[clean]) return REGIONAL_VOICE_MAP[clean];
    if (REGIONAL_VOICE_MAP[base]) return REGIONAL_VOICE_MAP[base];
  }
  return voice || 'en-US-AriaNeural';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || '';
  const rawVoice = searchParams.get('voice') || '';
  const locale = searchParams.get('locale') || '';
  const rate = searchParams.get('rate') || '-14%';

  if (!text.trim()) {
    return new NextResponse('Missing text query parameter', { status: 400 });
  }

  const voice = resolveVoice(text, rawVoice, locale);
  const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  try {
    const targetUrl = `${backendUrl}/api/voice?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&locale=${encodeURIComponent(locale)}&rate=${encodeURIComponent(rate)}`;
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'audio/mpeg' },
    });

    if (!backendRes.ok) {
      return new NextResponse(`TTS backend error: ${backendRes.status}`, { status: backendRes.status });
    }

    const audioBuffer = await backendRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: any) {
    console.error('[Voice Route Error]:', error);
    return new NextResponse(`Voice synthesis failed: ${error.message}`, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text || '';
    const rawVoice = body.voice;
    const locale = body.locale || '';
    const rate = body.rate || '-14%';

    if (!text.trim()) {
      return new NextResponse('Missing text in request body', { status: 400 });
    }

    const voice = resolveVoice(text, rawVoice, locale);
    const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const backendRes = await fetch(`${backendUrl}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text, voice, locale, rate }),
    });

    if (!backendRes.ok) {
      return new NextResponse(`TTS backend error: ${backendRes.status}`, { status: backendRes.status });
    }

    const audioBuffer = await backendRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: any) {
    console.error('[Voice Route Error]:', error);
    return new NextResponse(`Voice synthesis failed: ${error.message}`, { status: 500 });
  }
}
