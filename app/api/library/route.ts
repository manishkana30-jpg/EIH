// app/api/library/route.ts
import { NextResponse } from 'next/server';
import { getAllConditions, queryPsychologyLibrary, getConditionById } from '@/lib/knowledge/psychology-library-rag';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const query = searchParams.get('q');

    if (id) {
      const condition = getConditionById(id);
      if (!condition) {
        return NextResponse.json({ error: 'Condition not found' }, { status: 404 });
      }
      return NextResponse.json({ condition });
    }

    if (query) {
      const match = queryPsychologyLibrary(query);
      return NextResponse.json({
        query,
        matched: match ? match.condition : null,
        score: match ? match.matchScore : 0,
        snippet: match ? match.promptSnippet : null,
      });
    }

    const conditions = getAllConditions();
    return NextResponse.json({
      total: conditions.length,
      conditions,
    });
  } catch (error) {
    console.error('Library API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
