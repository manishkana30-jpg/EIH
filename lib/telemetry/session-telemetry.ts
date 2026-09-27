/**
 * lib/telemetry/session-telemetry.ts
 *
 * Non-intrusive, privacy-conscious event logging client.
 * Strictly adheres to privacy directive: Never log verbatim personal text
 * by default. Logs only categorized/derived data (emotion label, confidence,
 * timing, outcomes, quality signals).
 */

import { TelemetryEvent, SessionPhase } from './types';

const CONSENT_STORAGE_KEY = 'eih_telemetry_detailed_consent';
const EVENT_BUFFER_MAX = 50;

class SessionTelemetryClient {
  private buffer: TelemetryEvent[] = [];
  private activeSessionId: string | null = null;
  private phaseStartTime: number = Date.now();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  public isDetailedConsentAllowed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public setDetailedConsent(allowed: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, allowed ? 'true' : 'false');
    } catch {
      // Ignore storage errors in private modes
    }
  }

  public logEvent(event: Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'sessionId'> & { sessionId?: string }): void {
    const sessionId = event.sessionId || this.activeSessionId || 'anon-' + Date.now();
    const isConsentGiven = this.isDetailedConsentAllowed();

    const fullEvent: TelemetryEvent = {
      eventId: 'evt-' + Math.random().toString(36).substring(2, 9),
      sessionId,
      timestamp: Date.now(),
      ...event,
      // Strip verbatim text unless explicit user opt-in is active
      verbatimSnippet: isConsentGiven ? event.verbatimSnippet : undefined,
    };

    this.buffer.push(fullEvent);
    if (this.buffer.length >= EVENT_BUFFER_MAX) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  public logSessionStart(sessionId: string): void {
    this.activeSessionId = sessionId;
    this.phaseStartTime = Date.now();
    this.logEvent({
      sessionId,
      type: 'session_start',
      phase: 'phase0_triage',
    });
  }

  public logPhaseEnter(phase: SessionPhase, sessionId?: string): void {
    this.phaseStartTime = Date.now();
    this.logEvent({
      sessionId,
      type: 'phase_enter',
      phase,
    });
  }

  public logPhaseExit(phase: SessionPhase, sessionId?: string): void {
    const durationMs = Date.now() - this.phaseStartTime;
    this.logEvent({
      sessionId,
      type: 'phase_exit',
      phase,
      durationMs,
    });
  }

  public logEmotionDetected(params: {
    emotion: string;
    confidenceScore: number;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'emotion_detected',
      emotion: params.emotion,
      confidenceScore: Math.round(params.confidenceScore * 100) / 100,
    });
  }

  public logYesNoConfirmation(params: {
    emotion: string;
    outcome: 'yes' | 'no' | 'unclear';
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'yes_no_confirmation',
      emotion: params.emotion,
      yesNoOutcome: params.outcome,
    });
  }

  public logClarifyStep(params: {
    questionCount: number;
    confidenceImproved: boolean;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'clarify_step',
      clarifyQuestionCount: params.questionCount,
      confidenceImproved: params.confidenceImproved,
    });
  }

  public logVoiceStats(params: {
    inputMode: 'voice' | 'text';
    sttRetryCount?: number;
    sttErrorType?: string;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'voice_stt_stat',
      inputMode: params.inputMode,
      sttRetryCount: params.sttRetryCount || 0,
      sttErrorType: params.sttErrorType,
    });
  }

  public logContentSelection(params: {
    gitaVerse?: string;
    cbtScript?: string;
    tratakVariant?: string;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'content_selected',
      selectedGitaVerse: params.gitaVerse,
      selectedCbtScript: params.cbtScript,
      selectedTratakVariant: params.tratakVariant,
    });
  }

  public logHighlighterDesync(params: {
    phase: SessionPhase;
    wordIndex?: number;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'highlighter_desync_snap',
      phase: params.phase,
      desyncWordIndex: params.wordIndex,
    });
  }

  public logMoodRecheck(params: {
    preScore: number;
    postScore: number;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'mood_recheck',
      preMoodScore: params.preScore,
      postMoodScore: params.postScore,
      moodDelta: params.postScore - params.preScore,
    });
  }

  public logSessionEnd(params: {
    outcome: 'completed' | 'abandoned';
    dropOffPhase?: SessionPhase;
    sessionId?: string;
  }): void {
    this.logEvent({
      sessionId: params.sessionId,
      type: 'session_end',
      dropOffPhase: params.outcome === 'abandoned' ? params.dropOffPhase : undefined,
    });
    this.flush();
    this.activeSessionId = null;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, 4000);
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const eventsToSend = [...this.buffer];
    this.buffer = [];

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/telemetry/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: eventsToSend }),
        });
      } catch {
        // Fallback: save to localStorage buffer if offline
        try {
          const existing = JSON.parse(localStorage.getItem('eih_telemetry_offline') || '[]');
          localStorage.setItem('eih_telemetry_offline', JSON.stringify(existing.concat(eventsToSend).slice(-200)));
        } catch {}
      }
    }
  }
}

export const sessionTelemetry = new SessionTelemetryClient();
