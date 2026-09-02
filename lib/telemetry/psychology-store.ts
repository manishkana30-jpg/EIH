/**
 * Real-Time Psychological Telemetry & Live Issue Sync Store
 * Tracks the user's active emotional state, cognitive distortions, polyvagal status,
 * and clinical interventions across session pages and the Diagnostic Dashboard.
 */

import { PsychologicalTelemetry } from '@/lib/api/healer-client';

export interface PsychologicalIssueTurn {
  timestamp: number;
  trigger: string;
  emotion: string;
  distortion: string;
  polyvagal: string;
  severity: 'High' | 'Moderate' | 'Mild' | 'Regulated';
}

export interface PsychologicalIssueState {
  lastUpdated: number;
  dominantEmotion: string;
  cbtDistortion: string;
  distortionSeverity: 'High' | 'Moderate' | 'Mild' | 'Regulated';
  polyvagalState: string;
  emotionBreakdown: Record<string, number>;
  primaryTrigger: string;
  somaticAnchor: string;
  clinicalStrategy: string;
  recommendedPranayama: string;
  recentTurns: PsychologicalIssueTurn[];
  totalAssessments: number;
}

const STORAGE_KEY = 'eih_active_psychology_profile';
const CHANNEL_NAME = 'eih_psychology_channel';

export const DEFAULT_PSYCHOLOGY_STATE: PsychologicalIssueState = {
  lastUpdated: Date.now(),
  dominantEmotion: 'Anxiety & Overwhelm',
  cbtDistortion: 'Catastrophizing / All-or-Nothing',
  distortionSeverity: 'High',
  polyvagalState: 'Sympathetic (Fight/Flight Arousal)',
  emotionBreakdown: {
    'Anxiety & Stress': 78,
    'Cognitive Fatigue': 64,
    'Self-Doubt': 52,
    'Calmness & Safety': 22,
  },
  primaryTrigger: 'Workplace Burnout & High-Stakes Evaluation',
  somaticAnchor: 'Chest tightening & shallow breathing',
  clinicalStrategy: 'Socratic reality testing & vagal brake stimulation (4:6 slow breathing)',
  recommendedPranayama: 'Nadi Shodhana (Alternate Nostril 4:4:4:4)',
  recentTurns: [
    {
      timestamp: Date.now() - 1000 * 60 * 12,
      trigger: 'Heavy workload and boss expectations',
      emotion: 'Stress & Burnout',
      distortion: 'Catastrophizing',
      polyvagal: 'Sympathetic (Fight/Flight)',
      severity: 'High',
    },
    {
      timestamp: Date.now() - 1000 * 60 * 6,
      trigger: 'Fear of failing upcoming performance review',
      emotion: 'Anxiety',
      distortion: 'Fortune Telling / Mind Reading',
      polyvagal: 'Sympathetic (Fight/Flight)',
      severity: 'Moderate',
    },
    {
      timestamp: Date.now() - 1000 * 60 * 1,
      trigger: 'Somatic grounding and breath regulation',
      emotion: 'Relief',
      distortion: 'None',
      polyvagal: 'Ventral Vagal (Regulating)',
      severity: 'Mild',
    },
  ],
  totalAssessments: 3,
};

/**
 * Deduce severity based on emotion percentages and distortion
 */
function calculateSeverity(distortion: string, percentages: Record<string, number>): 'High' | 'Moderate' | 'Mild' | 'Regulated' {
  if (distortion === 'None' || distortion === 'None Detected') {
    return 'Regulated';
  }
  const maxIntensity = Math.max(...Object.values(percentages || { Calmness: 70 }), 50);
  if (maxIntensity >= 75) return 'High';
  if (maxIntensity >= 50) return 'Moderate';
  return 'Mild';
}

/**
 * Deduce Pranayama technique from polyvagal autonomic state
 */
function deducePranayama(polyvagalState: string): string {
  const p = (polyvagalState || '').toLowerCase();
  if (p.includes('sympathetic') || p.includes('fight') || p.includes('flight')) {
    return 'Nadi Shodhana (Alternate Nostril 4:4:4:4) & 4:6 Extended Exhale';
  }
  if (p.includes('dorsal') || p.includes('shutdown') || p.includes('freeze')) {
    return 'Bhramari Pranayama (Humming Bee Breath for Vagal Awakening)';
  }
  return 'Sama Vritti (Balanced Box Breathing 4:4:4:4)';
}

/**
 * Saves live psychological telemetry from user interaction and broadcasts in real time
 */
export function saveLivePsychologyTelemetry(
  telemetry: PsychologicalTelemetry,
  userMessage?: string
): PsychologicalIssueState {
  if (typeof window === 'undefined') return DEFAULT_PSYCHOLOGY_STATE;

  const current = getLivePsychologyTelemetry();
  const severity = calculateSeverity(telemetry.cbt_distortion, telemetry.percentages);
  const pranayama = deducePranayama(telemetry.polyvagal_state);

  const newTurn: PsychologicalIssueTurn = {
    timestamp: Date.now(),
    trigger: userMessage ? userMessage.slice(0, 75) : current.primaryTrigger,
    emotion: telemetry.dominant_emotion || current.dominantEmotion,
    distortion: telemetry.cbt_distortion || current.cbtDistortion,
    polyvagal: telemetry.polyvagal_state || current.polyvagalState,
    severity,
  };

  const updated: PsychologicalIssueState = {
    lastUpdated: Date.now(),
    dominantEmotion: telemetry.dominant_emotion || current.dominantEmotion,
    cbtDistortion: telemetry.cbt_distortion || current.cbtDistortion,
    distortionSeverity: severity,
    polyvagalState: telemetry.polyvagal_state || current.polyvagalState,
    emotionBreakdown: telemetry.percentages && Object.keys(telemetry.percentages).length > 0
      ? telemetry.percentages
      : current.emotionBreakdown,
    primaryTrigger: userMessage ? userMessage.slice(0, 90) : current.primaryTrigger,
    somaticAnchor: severity === 'High' ? 'Elevated autonomic arousal & muscle bracing' : 'Gentle somatic centering',
    clinicalStrategy: telemetry.strategy || current.clinicalStrategy,
    recommendedPranayama: pranayama,
    recentTurns: [newTurn, ...(current.recentTurns || []).slice(0, 9)],
    totalAssessments: (current.totalAssessments || 0) + 1,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Broadcast live across tabs
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(updated);
      channel.close();
    }
  } catch (e) {
    console.warn('Failed to persist psychology telemetry:', e);
  }

  return updated;
}

/**
 * Retrieves the active psychological state from localStorage or default baseline
 */
export function getLivePsychologyTelemetry(): PsychologicalIssueState {
  if (typeof window === 'undefined') return DEFAULT_PSYCHOLOGY_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PsychologicalIssueState;
    }
  } catch (_) {}

  return DEFAULT_PSYCHOLOGY_STATE;
}

/**
 * Subscribes to live psychological updates across browser tabs and sessions
 */
export function subscribeToPsychologyUpdates(
  callback: (state: PsychologicalIssueState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. BroadcastChannel Listener
  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data) {
        callback(event.data);
      }
    };
  }

  // 2. Storage Event Listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed);
      } catch (_) {}
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
