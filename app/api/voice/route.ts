import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || '';
  const voice = searchParams.get('voice') || '';
  const locale = searchParams.get('locale') || '';
  const rate = searchParams.get('rate') || '-4%';

  if (!text.trim()) {
    return new NextResponse('Missing text query parameter', { status: 400 });
  }

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
    const voice = body.voice || 'en-US-AriaNeural';
    const locale = body.locale || '';
    const rate = body.rate || '-4%';

    if (!text.trim()) {
      return new NextResponse('Missing text in request body', { status: 400 });
    }

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
