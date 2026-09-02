import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'degraded',
          http_status: res.status,
          latency_ms: latencyMs,
          backend_url: backendUrl,
          message: `FastAPI responded with HTTP status ${res.status}`,
          timestamp: new Date().toISOString(),
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      latency_ms: latencyMs,
      backend_url: backendUrl,
      frontend_gateway: 'Next.js App Router',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'unreachable',
        error: error?.name === 'AbortError' ? 'Connection timed out (>3.5s)' : error?.message,
        latency_ms: latencyMs,
        backend_url: backendUrl,
        frontend_gateway: 'Next.js App Router',
        troubleshooting: [
          'Ensure Python virtual environment is active (.venv)',
          'Verify FastAPI daemon is running: python -m uvicorn keyless_healer.app:app --host 127.0.0.1 --port 8000',
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
