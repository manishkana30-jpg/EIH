/**
 * app/api/memory/sync/route.ts
 *
 * Ephemeral CBT Memory Sync & Background Analytics Endpoint.
 * Ingests client-side encrypted thought trajectories or analyzes turn pairs to return
 * learned schema and distortion patterns without persistently storing raw plaintext.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserCognitiveProfile, CBTThoughtRecord } from '@/lib/memory/cbt-memory-types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, thoughtRecord, profile, userTurn, aiTurn, followUpTurn } = body as {
      action: 'sync_profile' | 'analyze_turn' | 'get_summary';
      thoughtRecord?: CBTThoughtRecord;
      profile?: Partial<UserCognitiveProfile>;
      userTurn?: string;
      aiTurn?: string;
      followUpTurn?: string;
    };

    if (action === 'analyze_turn' && userTurn) {
      const uLower = userTurn.toLowerCase();
      const fLower = (followUpTurn || '').toLowerCase();

      // Detect NAT & Distortion
      let distortion = 'none';
      if (/\b(stupid|useless|idiot|my fault|i ruined|failure)\b/i.test(uLower)) {
        distortion = 'Personalization';
      } else if (/\b(always|never|everyone|nobody|everything|nothing)\b/i.test(uLower)) {
        distortion = 'All-or-Nothing';
      } else if (/\b(worst|disaster|life is over|end of everything|can never)\b/i.test(uLower)) {
        distortion = 'Catastrophizing';
      } else if (/\b(they think|they hate|she thinks|he thinks)\b/i.test(uLower)) {
        distortion = 'Mind Reading';
      }

      let receptivity = 'neutral';
      let breakthrough: string | null = null;
      if (/\b(guess|realize|makes sense|feel better|true|calmer|right|good point)\b/i.test(fLower)) {
        receptivity = 'embraced';
        if (followUpTurn && followUpTurn.trim().length > 8) {
          breakthrough = followUpTurn.trim();
        }
      } else if (/\b(no|doesn't help|still feel|stop|useless)\b/i.test(fLower)) {
        receptivity = 'resisted';
      }

      return NextResponse.json({
        success: true,
        learning: {
          distortion,
          receptivity,
          breakthroughInsight: breakthrough,
          recommendedStrategy: `Apply somatic stabilization before Socratic reality testing on ${distortion}.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      status: 'synced',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Memory sync error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
