// app/api/library/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getLearnedDocuments,
  addLearnedDocument,
  type LearnedPsychologyDocument,
} from '@/lib/knowledge/self-learning-rag';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const docs = getLearnedDocuments();
    return new NextResponse(
      JSON.stringify({
        success: true,
        learned_documents: docs,
        total: docs.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to synchronize learned documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const document = body?.document as LearnedPsychologyDocument | undefined;

    if (!document || !document.id || !document.name) {
      return NextResponse.json(
        { error: 'Invalid learned psychology document payload' },
        { status: 400 }
      );
    }

    await addLearnedDocument(document);
    const updatedDocs = getLearnedDocuments();

    return NextResponse.json({
      success: true,
      message: `Indexed clinical document: ${document.name}`,
      total: updatedDocs.length,
    });
  } catch (error) {
    console.error('Error synchronizing document:', error);
    return NextResponse.json(
      { error: 'Failed to ingest learned document' },
      { status: 500 }
    );
  }
}
