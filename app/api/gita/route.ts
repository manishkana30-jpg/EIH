// app/api/gita/route.ts
import { NextResponse } from 'next/server';
import {
  GITA_LIBRARY,
  searchGitaLibrary,
  getGitaShlokaForEmotion,
  GitaCategory,
} from '@/lib/knowledge/gita-library';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * 100% Text-Only Bhagavad Gita Knowledge API.
 * 
 * Supports:
 * - GET /api/gita -> returns all 13 text-only clinical shloka records
 * - GET /api/gita?q=...&category=... -> real-time filtered search
 * - GET /api/gita?emotion=fear -> emotion-based RAG matching
 * - GET /api/gita?id=bg_2_48 -> exact ID lookup
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const query = searchParams.get('q');
    const category = (searchParams.get('category') as GitaCategory) || 'all';
    const emotion = searchParams.get('emotion');

    if (id) {
      const item = GITA_LIBRARY.find((s) => s.id === id || s.reference_header.toLowerCase() === id.toLowerCase());
      if (!item) {
        return NextResponse.json({ error: 'Shloka not found' }, { status: 404 });
      }
      return NextResponse.json({ item });
    }

    if (emotion) {
      const match = getGitaShlokaForEmotion(emotion);
      return NextResponse.json({
        emotion,
        matched_shloka: match,
      });
    }

    if (query || category !== 'all') {
      const results = searchGitaLibrary(query || undefined, category);
      return NextResponse.json({
        query: query || '',
        category,
        total: results.length,
        results,
      });
    }

    return NextResponse.json({
      total: GITA_LIBRARY.length,
      shlokas: GITA_LIBRARY,
    });
  } catch (error) {
    console.error('Gita API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
