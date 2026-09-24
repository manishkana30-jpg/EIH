/**
 * lib/wellness-flow/types.ts
 *
 * Type definitions for the 4-Phase Guided Wellness Conversation:
 * PHASE 1: Mood Understanding & Clarification Loop
 * PHASE 2: Bhagavad Gita Wisdom
 * PHASE 3: Cognitive Behavioral Therapy (CBT) Mini-Flow
 * PHASE 4: Neuro-Ocular Trataka (Best 1 of 5)
 */

import type { VoiceAcousticState } from '../types/emotions';

export type WellnessFlowState =
  | 'MOOD_INPUT'     // Warm greeting & open question: "How are you feeling right now?"
  | 'CONFIRM'        // App states understanding: "It sounds like... Is that right?" (Yes / No)
  | 'CLARIFY_LOOP'   // 1 to 5 empathetic follow-up questions until confidence >= 0.75 or 5 cap
  | 'GITA'           // Auto-starts: Gita wisdom (60-90s TTS, Sanskrit, Meaning, Practical Solution)
  | 'CBT'            // Auto-starts: Negative thought -> Distortion -> Evidence challenge -> Replacement thought
  | 'TRATAKA'        // Best 1 of 5 Trataka with timer, focus visual, voice cues (begin, blink, close eyes, relax)
  | 'SUMMARY';       // Closing reflection and post-session mood rating (1-10) to store progress

export type WellnessLanguage = 'en' | 'hi';

export interface MoodProfile {
  primary_emotion: string;     // e.g. "anxiety", "sadness", "anger", "stress", "loneliness", "guilt", "fear", "overthinking", "low motivation"
  secondary_emotion?: string;   // e.g. "frustration", "exhaustion", "self-doubt"
  intensity: number;           // 1 to 10 scale
  confidence: number;          // 0.0 to 1.0 scale
  root_theme: string;          // e.g. "future_uncertainty", "perfectionism", "interpersonal_conflict", "loss_of_control"
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  identified_at: number;
  voice_signals?: {
    pitchHz?: number;
    speechRate?: 'rapid' | 'moderate' | 'hesitant_slow';
    rmsEnergy?: number;
    tremorDetected?: boolean;
    pauseRatio?: number;
    vocalState?: string;
  };
}

export interface ClarificationTurn {
  questionNumber: number; // 1 to 5
  questionText: string;
  questionTextHi?: string;
  questionTheme: 'trigger' | 'somatic' | 'duration' | 'sleep_appetite' | 'interpersonal_vs_thoughts';
  userAnswer: string;
  voiceState?: VoiceAcousticState;
  assessedConfidence: number;
}

export interface GitaWisdomItem {
  id: string;
  reference: string;
  reference_code: string;
  sanskrit: string;
  transliteration: string;
  english_meaning: string;
  hindi_meaning: string;
  problem_analysis: string;
  practical_solution: string;
  applicable_emotions: string[];
  root_themes: string[];
  speech_text_en: string;
  speech_text_hi: string;
}

export interface CBTMiniFlowScript {
  mood_key: string;
  distortion_id: string;
  distortion_name_en: string;
  distortion_name_hi: string;
  step1_prompt_en: string;
  step1_prompt_hi: string;
  step2_name_en: string;
  step2_name_hi: string;
  step3_challenge_questions_en: string[];
  step3_challenge_questions_hi: string[];
  step4_replacement_thought_en: string;
  step4_replacement_thought_hi: string;
  step4_action_step_en: string;
  step4_action_step_hi: string;
}

export interface CBTUserResponses {
  automatic_thought: string;
  distortion_acknowledged: boolean;
  evidence_challenge_response: string;
  replacement_thought: string;
  committed_action_step: string;
}

export type TratakaVariantKey =
  | 'candle_flame'
  | 'bindu_dot'
  | 'om_symbol'
  | 'moon_star'
  | 'mirror_reflection';

export interface TratakaVoiceCues {
  begin_en: string;
  begin_hi: string;
  blink_en: string;
  blink_hi: string;
  close_eyes_en: string;
  close_eyes_hi: string;
  relax_en: string;
  relax_hi: string;
}

export interface TratakaVariantData {
  id: TratakaVariantKey;
  mode_key: string;
  name_en: string;
  name_hi: string;
  sanskrit_name: string;
  visual_type: 'candle' | 'bindu' | 'om' | 'moon' | 'mirror';
  focal_target_en: string;
  focal_target_hi: string;
  default_duration_seconds: number;
  min_duration_seconds: number;
  max_duration_seconds: number;
  neuro_mechanism_en: string;
  neuro_mechanism_hi: string;
  selection_rationale_en: string;
  selection_rationale_hi: string;
  voice_cues: TratakaVoiceCues;
  step_by_step_guidance_en: string[];
  step_by_step_guidance_hi: string[];
  closing_reflection_en: string;
  closing_reflection_hi: string;
}

export interface TratakaSelectionResult {
  variant: TratakaVariantData;
  rationale_en: string;
  rationale_hi: string;
  duration_seconds: number;
}

export interface PersistentSessionData {
  sessionId: string;
  currentState: WellnessFlowState;
  language: WellnessLanguage;
  moodProfile: MoodProfile | null;
  initialUtterance: string;
  confirmationStatement: string;
  clarificationTurns: ClarificationTurn[];
  selectedGitaVerse: GitaWisdomItem | null;
  cbtResponses: CBTUserResponses | null;
  selectedTrataka: TratakaSelectionResult | null;
  initialIntensity: number;
  postSessionMoodRating: number | null;
  isMuted: boolean;
  consentGranted: boolean;
  startedAt: number;
  lastUpdatedAt: number;
}
