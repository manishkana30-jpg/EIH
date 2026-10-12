import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  parseTelemetryEvents,
  computeAggregatedMetrics,
  detectAnomalies,
} from '@/learning/telemetry-analyzer';
import {
  loadConfigOverrides,
  loadImprovementLog,
  countActiveExperiments,
} from '@/learning/auto-improver';
import { getLearnedDocuments } from '@/lib/knowledge/self-learning-rag';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const overrides = loadConfigOverrides();
    const improvementLog = loadImprovementLog();
    const activeExperimentsCount = countActiveExperiments(improvementLog);

    // Parse and aggregate telemetry
    let events: any[] = [];
    try {
      events = parseTelemetryEvents();
    } catch (e) {
      console.warn('Telemetry events parse warning:', e);
    }

    const aggregatedMetrics = computeAggregatedMetrics(events);
    const anomalies = detectAnomalies(aggregatedMetrics);

    // Learned clinical documents count
    let learnedDocsCount = 0;
    try {
      learnedDocsCount = getLearnedDocuments().length;
    } catch {
      // Fallback to checking data file directly if needed
      const learnedFile = path.join(process.cwd(), 'data', 'learned_psychology_documents.json');
      if (fs.existsSync(learnedFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(learnedFile, 'utf8'));
          learnedDocsCount = Array.isArray(raw) ? raw.length : 0;
        } catch {
          learnedDocsCount = 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overrides,
      improvementLog,
      activeExperimentsCount,
      metrics: aggregatedMetrics,
      anomalies,
      totalLearnedCount: learnedDocsCount,
      guardrails: {
        zeroRuntimeSelfEditing: true,
        maxSimultaneousExperiments: 3,
        permanentExclusions: [
          'safety_crisis',
          'state_machine',
          'voice_capture_pipeline',
          'highlighter_sync',
          'phase_transitions',
          'suicide_detection',
          'audio_worklet',
        ],
        loopPreventionEnforced: true,
      },
    });
  } catch (error: any) {
    console.error('Learning status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve learning status',
      },
      { status: 500 }
    );
  }
}
