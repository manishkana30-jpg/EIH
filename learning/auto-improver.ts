/**
 * learning/auto-improver.ts
 *
 * Self-Learning, Auto-Improving Engine with Strict Loop-Prevention and Safety Guardrails.
 *
 * Guardrail Directives:
 * 1. ZERO runtime self-editing of production code files.
 * 2. Permanent Exclusions:
 *    - Safety / Crisis detection logic (NEVER automated under any circumstance)
 *    - State machine & phase transitions (NEVER automated)
 *    - Voice capture & STT pipeline (NEVER automated)
 *    - Word highlighter synchronization logic (NEVER automated)
 * 3. Loop Prevention:
 *    - Never identically propose a previously rejected/reverted hypothesis.
 *    - Cap simultaneous active experiments to max 3.
 *    - Auto-revert Tier 1 changes after evaluation window if no improvement is verified.
 */

import fs from 'fs';
import path from 'path';
import type { AggregatedMetrics, DetectedAnomaly } from './telemetry-analyzer.ts';

const IMPROVEMENT_LOG_FILE = path.join(process.cwd(), 'learning', 'improvement-log.json');
const CONFIG_OVERRIDES_FILE = path.join(process.cwd(), 'learning', 'config-overrides.json');
const PENDING_REVIEW_FILE = path.join(process.cwd(), 'learning', 'pending-review.md');

export interface ImprovementLogEntry {
  id: string;
  date: string;
  issue_detected: string;
  hypothesis: string;
  change_proposed: string;
  status: 'applied' | 'rejected' | 'reverted' | 'pending_review' | 'attempted_unresolved';
  applied_date?: string;
  outcome_after_N_days?: string;
  evaluation_window_days: number;
  tier: 1 | 2;
  do_not_retry_reason?: string | null;
  config_diff?: Record<string, any>;
}

// Strictly hard-excluded components
const PERMANENT_EXCLUSIONS = [
  'safety_crisis',
  'state_machine',
  'voice_capture_pipeline',
  'highlighter_sync',
  'phase_transitions',
  'suicide_detection',
  'audio_worklet',
];

export function isComponentHardExcluded(componentName: string): boolean {
  const norm = componentName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return PERMANENT_EXCLUSIONS.some((ex) => norm.includes(ex));
}

export function loadImprovementLog(): ImprovementLogEntry[] {
  if (!fs.existsSync(IMPROVEMENT_LOG_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(IMPROVEMENT_LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveImprovementLog(entries: ImprovementLogEntry[]): void {
  fs.writeFileSync(IMPROVEMENT_LOG_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

export function loadConfigOverrides(): any {
  if (!fs.existsSync(CONFIG_OVERRIDES_FILE)) {
    return { version: '1.0.0', tier_1_overrides: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_OVERRIDES_FILE, 'utf8'));
  } catch {
    return { version: '1.0.0', tier_1_overrides: {} };
  }
}

export function saveConfigOverrides(overrides: any): void {
  overrides.last_updated = new Date().toISOString();
  fs.writeFileSync(CONFIG_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');
}

/**
 * Loop Prevention: Checks if this exact issue & hypothesis was already attempted.
 */
export function hasHypothesisBeenTried(
  log: ImprovementLogEntry[],
  issueDetected: string,
  hypothesis: string
): { tried: boolean; existingEntry?: ImprovementLogEntry } {
  const normHypothesis = hypothesis.toLowerCase().trim();
  const existing = log.find(
    (e) =>
      e.hypothesis.toLowerCase().trim() === normHypothesis &&
      (e.status === 'reverted' || e.status === 'rejected' || e.status === 'applied')
  );

  return {
    tried: !!existing,
    existingEntry: existing,
  };
}

/**
 * Counts currently running experiments to enforce the cap of 2 to 3 simultaneous experiments.
 */
export function countActiveExperiments(log: ImprovementLogEntry[]): number {
  return log.filter((e) => e.status === 'applied' && !e.outcome_after_N_days).length;
}

/**
 * Processes detected anomalies to propose or safely apply improvements.
 */
export function processAnomalies(
  anomalies: DetectedAnomaly[],
  metrics: AggregatedMetrics
): {
  tier1Applied: ImprovementLogEntry[];
  tier2Proposed: ImprovementLogEntry[];
  skippedDueToLoopPrevention: string[];
} {
  const log = loadImprovementLog();
  const overrides = loadConfigOverrides();
  const tier1Applied: ImprovementLogEntry[] = [];
  const tier2Proposed: ImprovementLogEntry[] = [];
  const skippedDueToLoopPrevention: string[] = [];

  const activeCount = countActiveExperiments(log);
  if (activeCount >= 3) {
    console.log(`[AutoImprover] Maximum simultaneous experiments reached (${activeCount}/3). Deferring new changes.`);
    return { tier1Applied, tier2Proposed, skippedDueToLoopPrevention };
  }

  for (const anom of anomalies) {
    // 1. ANOMALY: Clarify Overload on an emotion (e.g. clarify turns > 2.0)
    if (anom.code === 'ANOM-CLARIFY-OVERLOAD') {
      const match = anom.metric.match(/^clarify_turns_(.*)$/);
      const emotion = match ? match[1] : 'general';

      const hypothesis = `Adding targeted conversational trigger keywords for "${emotion}" reduces clarify turns by improving initial classification match`;
      const check = hasHypothesisBeenTried(log, anom.description, hypothesis);

      if (check.tried) {
        skippedDueToLoopPrevention.push(
          `Skipped identical hypothesis for ${emotion}: previously marked ${check.existingEntry?.status} (${check.existingEntry?.do_not_retry_reason || 'no reason recorded'})`
        );
        continue;
      }

      // Tier 1 Safe Change: Additive keywords into config-overrides
      const nextId = `IMP-${String(log.length + 1).padStart(3, '0')}`;
      const entry: ImprovementLogEntry = {
        id: nextId,
        date: new Date().toISOString().split('T')[0],
        issue_detected: anom.description,
        hypothesis,
        change_proposed: `Additive keyword expansion in config-overrides for emotion: ${emotion}`,
        status: 'applied',
        applied_date: new Date().toISOString(),
        evaluation_window_days: 7,
        tier: 1,
        do_not_retry_reason: null,
      };

      // Add to config-overrides safely (versioned data change, never code rewrite)
      if (!overrides.tier_1_overrides.additive_affirmation_keywords) {
        overrides.tier_1_overrides.additive_affirmation_keywords = [];
      }
      overrides.tier_1_overrides.additive_affirmation_keywords.push(`feel ${emotion}`);
      saveConfigOverrides(overrides);

      log.push(entry);
      tier1Applied.push(entry);
    }

    // 2. ANOMALY: Low Yes/No confirmation (< 75%)
    else if (anom.code === 'ANOM-LOW-CONFIRMATION') {
      const match = anom.metric.match(/^confirmation_rate_(.*)$/);
      const emotion = match ? match[1] : 'general';

      // Verify not touching hard exclusions
      if (isComponentHardExcluded(emotion)) {
        console.warn(`[AutoImprover] Refusing change to hard-excluded component: ${emotion}`);
        continue;
      }

      const hypothesis = `Slightly tuning clarify confidence threshold from 0.72 to 0.76 ensures higher baseline certainty before rendering confirmation`;
      const check = hasHypothesisBeenTried(log, anom.description, hypothesis);

      if (check.tried) {
        skippedDueToLoopPrevention.push(
          `Skipped identical threshold adjustment for ${emotion} (already attempted in ${check.existingEntry?.id})`
        );
        continue;
      }

      // Safe threshold tuning within pre-agreed safe range [0.65, 0.85]
      const currentThresh = overrides.tier_1_overrides.clarify_confidence_threshold || 0.72;
      const safeNewThresh = Math.min(0.85, Math.max(0.65, currentThresh + 0.03));

      const nextId = `IMP-${String(log.length + 1).padStart(3, '0')}`;
      const entry: ImprovementLogEntry = {
        id: nextId,
        date: new Date().toISOString().split('T')[0],
        issue_detected: anom.description,
        hypothesis,
        change_proposed: `Tune clarify_confidence_threshold from ${currentThresh} to ${safeNewThresh} (within safe bounds [0.65, 0.85])`,
        status: 'applied',
        applied_date: new Date().toISOString(),
        evaluation_window_days: 7,
        tier: 1,
        config_diff: {
          clarify_confidence_threshold: safeNewThresh,
        },
      };

      overrides.tier_1_overrides.clarify_confidence_threshold = safeNewThresh;
      saveConfigOverrides(overrides);

      log.push(entry);
      tier1Applied.push(entry);
    }

    // 3. ANOMALY: Content gap or new script request -> STRICTLY TIER 2
    else if (anom.code === 'ANOM-CONTENT-DIVERSITY') {
      const nextId = `PROP-${String(log.length + 1).padStart(3, '0')}`;
      const entry: ImprovementLogEntry = {
        id: nextId,
        date: new Date().toISOString().split('T')[0],
        issue_detected: anom.description,
        hypothesis: 'Propose additional therapeutic script variant for improved resonance',
        change_proposed: 'Add new CBT reframing variant into library',
        status: 'pending_review',
        evaluation_window_days: 14,
        tier: 2,
      };

      log.push(entry);
      tier2Proposed.push(entry);
      appendPendingReview(entry);
    }
  }

  saveImprovementLog(log);
  return { tier1Applied, tier2Proposed, skippedDueToLoopPrevention };
}

function appendPendingReview(entry: ImprovementLogEntry): void {
  const content = `\n### [${entry.id}] ${entry.change_proposed}\n` +
    `- **Date Proposed:** ${entry.date}\n` +
    `- **Detected Issue:** ${entry.issue_detected}\n` +
    `- **Hypothesis:** ${entry.hypothesis}\n` +
    `- **Tier:** Tier 2 (Requires Manual Approval)\n` +
    `- **Status:** Pending Review\n`;

  fs.appendFileSync(PENDING_REVIEW_FILE, content, 'utf8');
}
