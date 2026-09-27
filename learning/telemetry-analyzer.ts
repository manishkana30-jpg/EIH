/**
 * learning/telemetry-analyzer.ts
 *
 * Scheduled Analysis Engine:
 * Processes logged anonymous telemetry events to compute concrete named metrics
 * and detect actionable bottlenecks with exact numbers.
 */

import fs from 'fs';
import path from 'path';
import type { TelemetryEvent, AggregatedMetrics, SessionPhase } from '../lib/telemetry/types.ts';
export type { AggregatedMetrics };

const TELEMETRY_FILE = path.join(process.cwd(), 'data', 'telemetry', 'events.jsonl');

export interface DetectedAnomaly {
  code: string;
  metric: string;
  severity: 'warning' | 'alert';
  currentValue: number;
  threshold: number;
  description: string;
}

export function parseTelemetryEvents(): TelemetryEvent[] {
  if (!fs.existsSync(TELEMETRY_FILE)) {
    return [];
  }
  const content = fs.readFileSync(TELEMETRY_FILE, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const events: TelemetryEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // Ignore corrupted lines
    }
  }
  return events;
}

export function computeAggregatedMetrics(events: TelemetryEvent[]): AggregatedMetrics {
  const sessions = new Set<string>();
  let completedCount = 0;
  let abandonedCount = 0;

  const yesNoStats: Record<string, { total: number; confirmed: number }> = {};
  const clarifyStats: Record<string, { totalQuestions: number; sessionCount: number }> = {};
  const confidenceStats: Record<string, { totalScore: number; count: number }> = {};
  const dropOffStats: Record<string, number> = {};

  let totalSttChecks = 0;
  let totalSttRetries = 0;
  let totalSessionsWithDesync = 0;
  let totalMoodDeltaSum = 0;
  let moodDeltaCount = 0;

  // Track per-session properties
  const sessionDesyncMap: Record<string, number> = {};

  for (const ev of events) {
    sessions.add(ev.sessionId);

    if (ev.type === 'session_end') {
      if (ev.dropOffPhase) {
        abandonedCount++;
        dropOffStats[ev.dropOffPhase] = (dropOffStats[ev.dropOffPhase] || 0) + 1;
      } else {
        completedCount++;
      }
    }

    if (ev.type === 'yes_no_confirmation' && ev.emotion) {
      if (!yesNoStats[ev.emotion]) {
        yesNoStats[ev.emotion] = { total: 0, confirmed: 0 };
      }
      yesNoStats[ev.emotion].total++;
      if (ev.yesNoOutcome === 'yes') {
        yesNoStats[ev.emotion].confirmed++;
      }
    }

    if (ev.type === 'emotion_detected' && ev.emotion && typeof ev.confidenceScore === 'number') {
      if (!confidenceStats[ev.emotion]) {
        confidenceStats[ev.emotion] = { totalScore: 0, count: 0 };
      }
      confidenceStats[ev.emotion].totalScore += ev.confidenceScore;
      confidenceStats[ev.emotion].count++;
    }

    if (ev.type === 'clarify_step' && typeof ev.clarifyQuestionCount === 'number') {
      const em = ev.emotion || 'general';
      if (!clarifyStats[em]) {
        clarifyStats[em] = { totalQuestions: 0, sessionCount: 0 };
      }
      clarifyStats[em].totalQuestions += ev.clarifyQuestionCount;
      clarifyStats[em].sessionCount++;
    }

    if (ev.type === 'voice_stt_stat') {
      totalSttChecks++;
      if (ev.sttRetryCount && ev.sttRetryCount > 0) {
        totalSttRetries += ev.sttRetryCount;
      }
    }

    if (ev.type === 'highlighter_desync_snap') {
      sessionDesyncMap[ev.sessionId] = (sessionDesyncMap[ev.sessionId] || 0) + 1;
    }

    if (ev.type === 'mood_recheck' && typeof ev.moodDelta === 'number') {
      totalMoodDeltaSum += ev.moodDelta;
      moodDeltaCount++;
    }
  }

  const totalSessions = sessions.size;

  // Rate by emotion
  const yesNoRateByEmotion: Record<string, { total: number; confirmed: number; rate: number }> = {};
  for (const [em, st] of Object.entries(yesNoStats)) {
    yesNoRateByEmotion[em] = {
      total: st.total,
      confirmed: st.confirmed,
      rate: st.total > 0 ? Math.round((st.confirmed / st.total) * 100) : 100,
    };
  }

  // Avg clarify questions
  const avgClarifyQuestionsByEmotion: Record<string, number> = {};
  for (const [em, st] of Object.entries(clarifyStats)) {
    avgClarifyQuestionsByEmotion[em] =
      st.sessionCount > 0 ? Math.round((st.totalQuestions / st.sessionCount) * 10) / 10 : 0;
  }

  // Avg confidence
  const avgConfidenceByEmotion: Record<string, number> = {};
  for (const [em, st] of Object.entries(confidenceStats)) {
    avgConfidenceByEmotion[em] =
      st.count > 0 ? Math.round((st.totalScore / st.count) * 100) / 100 : 0;
  }

  // Drop-off rate by phase
  const dropOffRateByPhase: Record<string, number> = {};
  for (const [ph, count] of Object.entries(dropOffStats)) {
    dropOffRateByPhase[ph] = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
  }

  // Sessions with desync
  for (const count of Object.values(sessionDesyncMap)) {
    if (count > 0) totalSessionsWithDesync++;
  }

  return {
    totalSessions,
    completedSessions: completedCount,
    abandonedSessions: abandonedCount,
    yesNoRateByEmotion,
    avgClarifyQuestionsByEmotion,
    sttRetryRate: totalSttChecks > 0 ? Math.round((totalSttRetries / totalSttChecks) * 100) : 0,
    dropOffRateByPhase,
    avgConfidenceByEmotion,
    highlighterDesyncRate:
      totalSessions > 0 ? Math.round((totalSessionsWithDesync / totalSessions) * 100) : 0,
    avgMoodDelta:
      moodDeltaCount > 0 ? Math.round((totalMoodDeltaSum / moodDeltaCount) * 10) / 10 : 0,
  };
}

export function detectAnomalies(metrics: AggregatedMetrics): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // 1. Check for high clarify questions (> 2.0 turns indicates ambiguous emotion vocabulary)
  for (const [emotion, avgTurns] of Object.entries(metrics.avgClarifyQuestionsByEmotion)) {
    if (avgTurns > 2.0) {
      anomalies.push({
        code: 'ANOM-CLARIFY-OVERLOAD',
        metric: `clarify_turns_${emotion}`,
        severity: 'warning',
        currentValue: avgTurns,
        threshold: 2.0,
        description: `Average clarify-loop turns for emotion "${emotion}" is ${avgTurns} (threshold: 2.0 turns).`,
      });
    }
  }

  // 2. Check for low Yes/No confirmation rate (< 75%)
  for (const [emotion, stats] of Object.entries(metrics.yesNoRateByEmotion)) {
    if (stats.total >= 5 && stats.rate < 75) {
      anomalies.push({
        code: 'ANOM-LOW-CONFIRMATION',
        metric: `confirmation_rate_${emotion}`,
        severity: 'warning',
        currentValue: stats.rate,
        threshold: 75,
        description: `Yes/No confirmation rate for "${emotion}" dropped to ${stats.rate}% (threshold: 75%).`,
      });
    }
  }

  // 3. STT retry spike (> 20%)
  if (metrics.sttRetryRate > 20) {
    anomalies.push({
      code: 'ANOM-STT-RETRY-SPIKE',
      metric: 'stt_retry_rate',
      severity: 'alert',
      currentValue: metrics.sttRetryRate,
      threshold: 20,
      description: `STT retry rate spiked to ${metrics.sttRetryRate}% (threshold: 20%).`,
    });
  }

  // 4. Highlighter desync rate (> 0%)
  if (metrics.highlighterDesyncRate > 0) {
    anomalies.push({
      code: 'ANOM-DESYNC-DETECTED',
      metric: 'highlighter_desync_rate',
      severity: 'warning',
      currentValue: metrics.highlighterDesyncRate,
      threshold: 0,
      description: `Highlighter max-drift safeguard triggered in ${metrics.highlighterDesyncRate}% of sessions.`,
    });
  }

  return anomalies;
}
