// app/api/version/route.ts
import { NextResponse } from 'next/server';
import { getLearnedDocuments } from '@/lib/knowledge/self-learning-rag';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buildId = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.VERCEL_GIT_COMMIT_SHA || 'local-build';
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || 'dev-main';
    const learnedDocs = getLearnedDocuments();

    return new NextResponse(
      JSON.stringify({
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.2.0',
        buildId,
        commit,
        learnedCount: learnedDocs.length,
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve version manifest' },
      { status: 500 }
    );
  }
}
