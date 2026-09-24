/**
 * lib/wellness-flow/wellness-state-machine.ts
 *
 * Full 4-Phase Guided Wellness Conversation State Machine:
 * MOOD_INPUT → CONFIRM → CLARIFY_LOOP → GITA → CBT → TRATAKA → SUMMARY.
 *
 * Features:
 * - Deterministic transitions with complete branching logic (Yes/No branches).
 * - Clarification loop capped at 5 questions or confidence >= 0.75.
 * - Auto-progression between phases with read-aloud TTS scripts.
 * - Persistent encrypted state for resuming sessions.
 * - Pause / Skip / Back / Reset controls.
 * - Language toggle (EN / HI) & Mute / Text-only fallback.
 * - Immediate safety crisis lockdown.
 */

import gitaVersesData from '../../data/wellness_flow/gita_verses.json' with { type: 'json' };
import cbtScriptsData from '../../data/wellness_flow/cbt_scripts.json' with { type: 'json' };
import { emotionEngine } from './emotion-engine.ts';
import { tratakaSelector, getTimeOfDay } from './trataka-selector.ts';
import {
  saveEncryptedWellnessSession,
  loadEncryptedWellnessSession,
  clearEncryptedWellnessSession,
} from './storage-encryption.ts';
import type { VoiceAcousticState } from '../types/emotions';
import type {
  WellnessFlowState,
  WellnessLanguage,
  MoodProfile,
  ClarificationTurn,
  GitaWisdomItem,
  CBTMiniFlowScript,
  CBTUserResponses,
  TratakaSelectionResult,
  PersistentSessionData,
} from './types';

export interface StateMachineListener {
  (state: WellnessFlowState, session: PersistentSessionData): void;
}

export class WellnessStateMachine {
  private currentState: WellnessFlowState = 'MOOD_INPUT';
  private language: WellnessLanguage = 'en';
  private moodProfile: MoodProfile | null = null;
  private initialUtterance = '';
  private confirmationStatement = '';
  private clarificationTurns: ClarificationTurn[] = [];
  private selectedGitaVerse: GitaWisdomItem | null = null;
  private cbtResponses: CBTUserResponses = {
    automatic_thought: '',
    distortion_acknowledged: false,
    evidence_challenge_response: '',
    replacement_thought: '',
    committed_action_step: '',
  };
  private cbtCurrentStep: 1 | 2 | 3 | 4 = 1;
  private selectedTrataka: TratakaSelectionResult | null = null;
  private initialIntensity = 6;
  private postSessionMoodRating: number | null = null;
  private isMuted = false;
  private consentGranted = false;
  private sessionId = '';
  private startedAt = 0;
  private isPaused = false;
  private listeners: StateMachineListener[] = [];

  constructor() {
    this.sessionId = `wellness-${Date.now()}`;
    this.startedAt = Date.now();
  }

  public subscribe(listener: StateMachineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState, snapshot);
      } catch (err) {
        console.error('Error in state machine listener:', err);
      }
    });
    // Persist snapshot asynchronously
    saveEncryptedWellnessSession(snapshot).catch(() => {});
  }

  public getSnapshot(): PersistentSessionData {
    return {
      sessionId: this.sessionId,
      currentState: this.currentState,
      language: this.language,
      moodProfile: this.moodProfile,
      initialUtterance: this.initialUtterance,
      confirmationStatement: this.confirmationStatement,
      clarificationTurns: [...this.clarificationTurns],
      selectedGitaVerse: this.selectedGitaVerse,
      cbtResponses: { ...this.cbtResponses },
      selectedTrataka: this.selectedTrataka,
      initialIntensity: this.initialIntensity,
      postSessionMoodRating: this.postSessionMoodRating,
      isMuted: this.isMuted,
      consentGranted: this.consentGranted,
      startedAt: this.startedAt,
      lastUpdatedAt: Date.now(),
    };
  }

  public setLanguage(lang: WellnessLanguage): void {
    this.language = lang;
    if (this.moodProfile && this.currentState === 'CONFIRM') {
      this.confirmationStatement = emotionEngine.generateConfirmationStatement(this.moodProfile, this.language);
    }
    this.notify();
  }

  public getLanguage(): WellnessLanguage {
    return this.language;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setConsent(consent: boolean): void {
    this.consentGranted = consent;
    this.notify();
  }

  public getCurrentState(): WellnessFlowState {
    return this.currentState;
  }

  public getCbtCurrentStep(): 1 | 2 | 3 | 4 {
    return this.cbtCurrentStep;
  }

  public getMoodProfile(): MoodProfile | null {
    return this.moodProfile;
  }

  public getSelectedGitaVerse(): GitaWisdomItem | null {
    return this.selectedGitaVerse;
  }

  public getSelectedTrataka(): TratakaSelectionResult | null {
    return this.selectedTrataka;
  }

  public getClarificationTurns(): ClarificationTurn[] {
    return this.clarificationTurns;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: MOOD UNDERSTANDING & CONFIRMATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get initial warm greeting.
   */
  public getInitialGreeting(): { text_en: string; text_hi: string } {
    return {
      text_en: "Welcome to your sanctuary. Take a gentle breath. How are you feeling right now?",
      text_hi: "आपके अपने शांत शरणस्थल में स्वागत है। एक गहरी, सुखद सांस लें। आप अभी कैसा महसूस कर रहे हैं?",
    };
  }

  /**
   * Processes user's initial mood statement.
   * State: MOOD_INPUT -> CONFIRM
   */
  public handleMoodInput(text: string, voiceState?: VoiceAcousticState): {
    isCrisis: boolean;
    confirmationText: string;
    profile: MoodProfile;
  } {
    this.initialUtterance = text;

    // Safety check first
    const crisis = emotionEngine.checkCrisis(text);
    if (crisis.isCrisis) {
      return {
        isCrisis: true,
        confirmationText: crisis.immediateDeflectionStatement || 'I care deeply about your safety. Please reach out to emergency services or Tele-MANAS at 14416.',
        profile: {
          primary_emotion: 'crisis',
          intensity: 10,
          confidence: 1.0,
          root_theme: 'safety_emergency',
          identified_at: Date.now(),
        },
      };
    }

    const profile = emotionEngine.analyze(text, voiceState);
    this.moodProfile = profile;
    this.initialIntensity = profile.intensity;

    this.confirmationStatement = emotionEngine.generateConfirmationStatement(profile, this.language);
    this.currentState = 'CONFIRM';
    this.notify();

    return {
      isCrisis: false,
      confirmationText: this.confirmationStatement,
      profile,
    };
  }

  /**
   * Confirmation Step handler:
   * User answers YES or NO (by voice or button).
   */
  public handleConfirmationResponse(isAffirmative: boolean): {
    nextState: WellnessFlowState;
    nextSpeechText: string;
  } {
    if (this.currentState !== 'CONFIRM') {
      return { nextState: this.currentState, nextSpeechText: '' };
    }

    if (isAffirmative) {
      // YES: Save mood profile and advance directly to PHASE 2: GITA
      this.prepareGitaPhase();
      this.currentState = 'GITA';
      this.notify();

      const gitaSpeech = this.language === 'hi'
        ? this.selectedGitaVerse?.speech_text_hi || ''
        : this.selectedGitaVerse?.speech_text_en || '';

      return {
        nextState: 'GITA',
        nextSpeechText: gitaSpeech,
      };
    } else {
      // NO: Enter the Clarification Loop (at most 5 questions)
      this.currentState = 'CLARIFY_LOOP';
      this.clarificationTurns = [];
      this.notify();

      const nextQ = emotionEngine.getNextClarificationQuestion(0, [], this.language);
      return {
        nextState: 'CLARIFY_LOOP',
        nextSpeechText: nextQ.questionText,
      };
    }
  }

  /**
   * Handles user response inside the Clarification Loop.
   * Auto-generates 1 to 5 short empathetic questions.
   * Stops asking as soon as confidence >= 0.75 or 5 questions reached.
   */
  public handleClarificationAnswer(answer: string, voiceState?: VoiceAcousticState): {
    completedLoop: boolean;
    nextQuestion?: {
      questionNumber: number;
      questionText: string;
    };
    refinedProfile: MoodProfile;
    confirmationText?: string;
  } {
    if (this.currentState !== 'CLARIFY_LOOP' || !this.moodProfile) {
      throw new Error('Not currently in CLARIFY_LOOP state');
    }

    const currentTurnCount = this.clarificationTurns.length;
    const currentQ = emotionEngine.getNextClarificationQuestion(
      currentTurnCount,
      this.clarificationTurns.map((t) => t.userAnswer),
      this.language
    );

    const turn: ClarificationTurn = {
      questionNumber: currentTurnCount + 1,
      questionText: currentQ.questionText,
      questionTheme: currentQ.questionTheme,
      userAnswer: answer,
      voiceState,
      assessedConfidence: 0.6 + (currentTurnCount + 1) * 0.1,
    };
    this.clarificationTurns.push(turn);

    const { refinedProfile, shouldStopClarifying } = emotionEngine.refineMoodProfile(
      this.moodProfile,
      this.clarificationTurns,
      voiceState
    );
    this.moodProfile = refinedProfile;

    if (shouldStopClarifying) {
      // Finished clarification: confirm once more then go to Phase 2 (GITA)
      this.prepareGitaPhase();
      this.currentState = 'GITA';
      this.confirmationStatement = emotionEngine.generateConfirmationStatement(refinedProfile, this.language);
      this.notify();

      return {
        completedLoop: true,
        refinedProfile,
        confirmationText: this.confirmationStatement,
      };
    }

    // Ask next follow-up question
    const nextQ = emotionEngine.getNextClarificationQuestion(
      this.clarificationTurns.length,
      this.clarificationTurns.map((t) => t.userAnswer),
      this.language
    );

    this.notify();

    return {
      completedLoop: false,
      nextQuestion: {
        questionNumber: nextQ.questionNumber,
        questionText: nextQ.questionText,
      },
      refinedProfile,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: BHAGAVAD GITA WISDOM
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Maps mood profile to relevant Gita verse from local JSON knowledge base.
   */
  public prepareGitaPhase(): GitaWisdomItem {
    const verses = (gitaVersesData.verses as GitaWisdomItem[]) || [];
    const emo = (this.moodProfile?.primary_emotion || 'anxiety').toLowerCase();
    const root = (this.moodProfile?.root_theme || '').toLowerCase();

    // Find best matching verse
    let bestVerse = verses[0];
    let highestScore = -1;

    for (const v of verses) {
      let score = 0;
      if (v.applicable_emotions.includes(emo)) score += 3;
      if (v.root_themes.some((t) => root.includes(t) || t.includes(root))) score += 2;
      if (v.applicable_emotions.includes(this.moodProfile?.secondary_emotion || '')) score += 1;

      if (score > highestScore) {
        highestScore = score;
        bestVerse = v;
      }
    }

    this.selectedGitaVerse = bestVerse;
    return bestVerse;
  }

  /**
   * Concludes Phase 2 and automatically transitions to Phase 3: CBT with a transition line.
   */
  public advanceFromGitaToCBT(): {
    nextState: WellnessFlowState;
    transitionSpeech: string;
    cbtScript: CBTMiniFlowScript;
  } {
    this.currentState = 'CBT';
    this.cbtCurrentStep = 1;
    this.notify();

    const script = this.getCbtScript();
    const transitionSpeech = this.language === 'hi'
      ? `गीता के इस पावन संदेश को आत्मसात करते हुए, आइए अब हम आधुनिक मनश्चिकित्सा और CBT की सहायता से अपने विचारों को संतुलित करें। ${script.step1_prompt_hi}`
      : `Holding this timeless Gita wisdom in your heart, let's now integrate practical Cognitive Behavioral Therapy to gently reframe your thinking. ${script.step1_prompt_en}`;

    return {
      nextState: 'CBT',
      transitionSpeech,
      cbtScript: script,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: COGNITIVE BEHAVIORAL THERAPY (CBT) MINI-FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Gets CBT script tailored to mood from cbt_scripts.json.
   */
  public getCbtScript(): CBTMiniFlowScript {
    const scripts = (cbtScriptsData.scripts as Record<string, CBTMiniFlowScript>) || {};
    const emo = (this.moodProfile?.primary_emotion || 'anxiety').toLowerCase();

    return (
      scripts[emo] ||
      scripts['anxiety'] ||
      Object.values(scripts)[0]
    );
  }

  /**
   * Handles user reply for Step 1: Automatic negative thought.
   */
  public handleCbtStep1(thought: string): { nextStep: 2; distortionPrompt: string } {
    this.cbtResponses.automatic_thought = thought;
    this.cbtCurrentStep = 2;
    this.notify();

    const script = this.getCbtScript();
    const distortionPrompt = this.language === 'hi'
      ? `${script.step2_name_hi}`
      : `${script.step2_name_en}`;

    return { nextStep: 2, distortionPrompt };
  }

  /**
   * Handles user acknowledgment for Step 2: Cognitive distortion.
   */
  public handleCbtStep2(): { nextStep: 3; challengeQuestions: string[] } {
    this.cbtResponses.distortion_acknowledged = true;
    this.cbtCurrentStep = 3;
    this.notify();

    const script = this.getCbtScript();
    const challengeQuestions = this.language === 'hi'
      ? script.step3_challenge_questions_hi
      : script.step3_challenge_questions_en;

    return { nextStep: 3, challengeQuestions };
  }

  /**
   * Handles user reply for Step 3: Evidence-based challenge questions.
   */
  public handleCbtStep3(evidenceAnswer: string): {
    nextStep: 4;
    replacementThought: string;
    actionStep: string;
  } {
    this.cbtResponses.evidence_challenge_response = evidenceAnswer;
    this.cbtCurrentStep = 4;
    this.notify();

    const script = this.getCbtScript();
    const replacementThought = this.language === 'hi'
      ? script.step4_replacement_thought_hi
      : script.step4_replacement_thought_en;
    const actionStep = this.language === 'hi'
      ? script.step4_action_step_hi
      : script.step4_action_step_en;

    this.cbtResponses.replacement_thought = replacementThought;
    this.cbtResponses.committed_action_step = actionStep;

    return { nextStep: 4, replacementThought, actionStep };
  }

  /**
   * Concludes Phase 3 and automatically advances to Phase 4: Trataka.
   */
  public advanceFromCBTToTrataka(): {
    nextState: WellnessFlowState;
    tratakaResult: TratakaSelectionResult;
    announcementSpeech: string;
  } {
    const profile = this.moodProfile || {
      primary_emotion: 'anxiety',
      intensity: 6,
      confidence: 0.8,
      root_theme: 'general',
      identified_at: Date.now(),
    };

    const tratakaResult = tratakaSelector.selectBestVariant(profile, getTimeOfDay());
    this.selectedTrataka = tratakaResult;
    this.currentState = 'TRATAKA';
    this.notify();

    const announcementSpeech = this.language === 'hi'
      ? `बहुत सुंदर। अब हम अपने मस्तिष्क और तंत्रिका तंत्र को स्थिर करने के लिए चतुर्थ चरण, त्राटक ध्यान में प्रवेश करेंगे। ${tratakaResult.rationale_hi}`
      : `Wonderful progress. Now, to anchor your prefrontal cortex and settle your autonomic nervous system, we transition into our final phase: Neuro-Ocular Trataka. ${tratakaResult.rationale_en}`;

    return {
      nextState: 'TRATAKA',
      tratakaResult,
      announcementSpeech,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: TRATAKA & SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Completes Trataka meditation and advances to Summary.
   */
  public completeTratakaSession(): {
    nextState: WellnessFlowState;
    closingReflection: string;
  } {
    this.currentState = 'SUMMARY';
    this.notify();

    const reflection = this.language === 'hi'
      ? this.selectedTrataka?.variant.closing_reflection_hi || 'आपका ध्यान सत्र संपन्न हुआ।'
      : this.selectedTrataka?.variant.closing_reflection_en || 'Your meditation session is complete.';

    return {
      nextState: 'SUMMARY',
      closingReflection: reflection,
    };
  }

  /**
   * Stores post-session mood rating (1 to 10 scale).
   */
  public submitPostSessionMoodRating(rating: number): {
    initialIntensity: number;
    finalRating: number;
    improvementDelta: number;
  } {
    const clamped = Math.max(1, Math.min(10, Math.round(rating)));
    this.postSessionMoodRating = clamped;
    this.notify();

    return {
      initialIntensity: this.initialIntensity,
      finalRating: clamped,
      improvementDelta: this.initialIntensity - clamped,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION & SESSION CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────

  public pause(): void {
    this.isPaused = true;
    this.notify();
  }

  public resume(): void {
    this.isPaused = false;
    this.notify();
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Skips current phase forward to next logical phase.
   */
  public skip(): void {
    if (this.currentState === 'CONFIRM' || this.currentState === 'CLARIFY_LOOP') {
      this.prepareGitaPhase();
      this.currentState = 'GITA';
    } else if (this.currentState === 'GITA') {
      this.advanceFromGitaToCBT();
    } else if (this.currentState === 'CBT') {
      this.advanceFromCBTToTrataka();
    } else if (this.currentState === 'TRATAKA') {
      this.completeTratakaSession();
    }
    this.notify();
  }

  /**
   * Steps back to previous phase.
   */
  public back(): void {
    if (this.currentState === 'CONFIRM') {
      this.currentState = 'MOOD_INPUT';
    } else if (this.currentState === 'CLARIFY_LOOP') {
      this.currentState = 'CONFIRM';
    } else if (this.currentState === 'GITA') {
      this.currentState = 'CONFIRM';
    } else if (this.currentState === 'CBT') {
      this.currentState = 'GITA';
    } else if (this.currentState === 'TRATAKA') {
      this.currentState = 'CBT';
    } else if (this.currentState === 'SUMMARY') {
      this.currentState = 'TRATAKA';
    }
    this.notify();
  }

  /**
   * Resets entire session to clean baseline.
   */
  public reset(): void {
    this.currentState = 'MOOD_INPUT';
    this.moodProfile = null;
    this.initialUtterance = '';
    this.confirmationStatement = '';
    this.clarificationTurns = [];
    this.selectedGitaVerse = null;
    this.cbtResponses = {
      automatic_thought: '',
      distortion_acknowledged: false,
      evidence_challenge_response: '',
      replacement_thought: '',
      committed_action_step: '',
    };
    this.cbtCurrentStep = 1;
    this.selectedTrataka = null;
    this.initialIntensity = 6;
    this.postSessionMoodRating = null;
    this.isPaused = false;
    this.sessionId = `wellness-${Date.now()}`;
    this.startedAt = Date.now();
    clearEncryptedWellnessSession();
    this.notify();
  }

  /**
   * Resumes previously persisted session from local encrypted storage.
   */
  public async tryResumeFromStorage(): Promise<boolean> {
    try {
      const data = await loadEncryptedWellnessSession();
      if (!data) return false;

      this.sessionId = data.sessionId;
      this.currentState = data.currentState;
      this.language = data.language;
      this.moodProfile = data.moodProfile;
      this.initialUtterance = data.initialUtterance;
      this.confirmationStatement = data.confirmationStatement;
      this.clarificationTurns = data.clarificationTurns || [];
      this.selectedGitaVerse = data.selectedGitaVerse;
      this.cbtResponses = data.cbtResponses || this.cbtResponses;
      this.selectedTrataka = data.selectedTrataka;
      this.initialIntensity = data.initialIntensity;
      this.postSessionMoodRating = data.postSessionMoodRating;
      this.isMuted = data.isMuted;
      this.consentGranted = data.consentGranted;
      this.startedAt = data.startedAt;

      this.notify();
      return true;
    } catch (err) {
      console.warn('Could not resume wellness session:', err);
      return false;
    }
  }
}

export const wellnessStateMachine = new WellnessStateMachine();
export default wellnessStateMachine;
