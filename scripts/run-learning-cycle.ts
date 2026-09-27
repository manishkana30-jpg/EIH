/**
 * scripts/run-learning-cycle.ts
 *
 * Scheduled Analysis & Auto-Improvement Runner.
 * Executes:
 * 1. Telemetry event parsing & aggregation.
 * 2. Anomaly & bottleneck detection.
 * 3. Loop-prevention checks and safe Tier 1 auto-improvements.
 * 4. Tier 2 review proposal generation.
 * 5. Weekly learning summary markdown output.
 */

import { parseTelemetryEvents, computeAggregatedMetrics, detectAnomalies } from '../learning/telemetry-analyzer';
import { loadImprovementLog, processAnomalies } from '../learning/auto-improver';
import { generateWeeklySummary } from '../learning/weekly-summary-generator';

async function main() {
  console.log('=== Starting EIH Self-Learning & Auto-Improvement Cycle ===');

  const events = parseTelemetryEvents();
  console.log(`[1/4] Parsed ${events.length} telemetry events.`);

  const metrics = computeAggregatedMetrics(events);
  console.log(`[2/4] Computed Aggregated Metrics:`, {
    totalSessions: metrics.totalSessions,
    completedSessions: metrics.completedSessions,
    sttRetryRate: `${metrics.sttRetryRate}%`,
    highlighterDesyncRate: `${metrics.highlighterDesyncRate}%`,
  });

  const anomalies = detectAnomalies(metrics);
  console.log(`[3/4] Detected ${anomalies.length} metric anomalies.`);

  const result = processAnomalies(anomalies, metrics);
  console.log(`[4/4] Processed Auto-Improvements:`, {
    tier1Applied: result.tier1Applied.length,
    tier2Proposed: result.tier2Proposed.length,
    skippedDueToLoopPrevention: result.skippedDueToLoopPrevention.length,
  });

  const log = loadImprovementLog();
  const summary = generateWeeklySummary(metrics, anomalies, log);
  console.log(`\n✓ Generated reports/weekly_learning_summary.md successfully!`);
}

main().catch((err) => {
  console.error('Error running learning cycle:', err);
  process.exit(1);
});
