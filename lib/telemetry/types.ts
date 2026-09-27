/**
 * lib/telemetry/types.ts
 *
 * Privacy-Conscious Telemetry & Quality Event Types.
 * Strictly enforces ZERO verbatim personal text logging by default.
 */

export interface TelemetryPrivacySettings {
  allowDetailedLogging: boolean; // Default false (Categorical/derived metrics only)
  anonymizedSessionId: string;
}

export type SessionPhase =
  | 'phase0_triage'
  | 'phase1_sanctuary'
  | 'phase1_clarify'
  | 'phase2_gita'
  | 'phase3_cbt'
  | 'phase4_tratak'
  | 'session_completed'
  | 'session_abandoned';

export interface TelemetryEvent {
  eventId: string;
  sessionId: string;
  timestamp: number;
  type:
    | 'session_start'
    | 'phase_enter'
    | 'phase_exit'
    | 'emotion_detected'
    | 'yes_no_confirmation'
    | 'clarify_step'
    | 'voice_stt_stat'
    | 'content_selected'
    | 'highlighter_desync_snap'
    | 'mood_recheck'
    | 'session_end';
  phase?: SessionPhase;
  durationMs?: number;

  // Categorical derived metrics (privacy safe)
  emotion?: string;
  confidenceScore?: number; // 0.0 - 1.0
  yesNoOutcome?: 'yes' | 'no' | 'unclear';
  clarifyQuestionCount?: number;
  confidenceImproved?: boolean;

  // Voice vs Text & Error stats
  inputMode?: 'voice' | 'text';
  sttRetryCount?: number;
  sttErrorType?: string;

  // Selected Content Metadata
  selectedGitaVerse?: string;
  selectedCbtScript?: string;
  selectedTratakVariant?: string;

  // Quality & Sync Signals
  highlighterDesyncCount?: number;
  desyncWordIndex?: number;

  // Outcome
  dropOffPhase?: SessionPhase;
  preMoodScore?: number;
  postMoodScore?: number;
  moodDelta?: number;

  // Verbatim text is ONLY logged if user explicitly opted in
  verbatimSnippet?: string;
}

export interface AggregatedMetrics {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  yesNoRateByEmotion: Record<string, { total: number; confirmed: number; rate: number }>;
  avgClarifyQuestionsByEmotion: Record<string, number>;
  sttRetryRate: number;
  dropOffRateByPhase: Record<string, number>;
  avgConfidenceByEmotion: Record<string, number>;
  highlighterDesyncRate: number; // percentage of sessions with >0 desync snaps
  avgMoodDelta: number;
}
