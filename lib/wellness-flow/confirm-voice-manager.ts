/**
 * lib/wellness-flow/confirm-voice-manager.ts
 *
 * Dedicated Sequential Audio & Short-Session Voice Recognizer for Phase 1 Confirmation.
 *
 * Guarantees:
 * 1. Strict Sequential Audio: TTS completes -> 400ms delay -> STT begins.
 *    TTS and STT never run simultaneously. Immediate barge-in support.
 * 2. Dedicated Short-Session Recognizer: Fresh instance every time (clears old listeners),
 *    6-8s window, reacts immediately to partial/interim results without waiting for final silence.
 * 3. Retry & Fallback: Re-asks once on silence/unclear ("Sorry, I didn't catch that. Please say Yes or No."),
 *    falls back to manual buttons after 2 attempts or 20s overall timeout.
 * 4. Single-Transition Guard: Guarantees state change fires exactly once.
 * 5. Diagnostic Debug Logging: Enabled with DEBUG_CONFIRM_VOICE toggle.
 */

import { browserSpeechController } from '../audio/browser-speech';
import { getMicConsent } from './storage-encryption';
import { parseYesNoIntentDetailed, logConfirmDebug, ConfirmationIntent } from './confirm-intent-parser';
import type { WellnessLanguage } from './types';

export type ConfirmVoiceStatus =
  | 'idle'
  | 'speaking_prompt'
  | 'delay_gap'
  | 'listening'
  | 'processing'
  | 'retry_prompt'
  | 'fallback_buttons';

export interface ConfirmVoiceCallbacks {
  onStatusChange: (status: ConfirmVoiceStatus, statusText: string) => void;
  onLiveTranscript: (text: string) => void;
  onIntentResolved: (intent: 'yes' | 'no') => void;
  onError: (errorMessage: string) => void;
}

export class ConfirmVoiceManager {
  private language: WellnessLanguage = 'en';
  private callbacks: ConfirmVoiceCallbacks;

  // Recognizer state
  private recognizer: any = null;
  private isListening = false;
  private currentAttempt = 0;
  private transitionFired = false;
  private isDestroyed = false;

  // Timers
  private listenWindowTimer: ReturnType<typeof setTimeout> | null = null;
  private gapTimer: ReturnType<typeof setTimeout> | null = null;
  private overallSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: ConfirmVoiceCallbacks, language: WellnessLanguage = 'en') {
    this.callbacks = callbacks;
    this.language = language;
  }

  public setLanguage(lang: WellnessLanguage): void {
    this.language = lang;
  }

  /**
   * Begins the Phase 1 Confirmation Voice Flow:
   * 1. Plays confirmation prompt via TTS.
   * 2. Waits 400ms after TTS ends.
   * 3. Spawns dedicated Yes/No short-session listener.
   */
  public startConfirmationFlow(confirmationPromptText: string): void {
    this.isDestroyed = false;
    this.transitionFired = false;
    this.currentAttempt = 0;
    this.stopAllAudioAndTimers();

    logConfirmDebug('TRANSITION', 'Initiating Phase 1 Confirmation Voice Flow');

    // 20-Second Overall Safety Timeout (User is never left stuck indefinitely)
    this.overallSafetyTimer = setTimeout(() => {
      if (!this.transitionFired && !this.isDestroyed) {
        logConfirmDebug('GUARD', 'Overall 20s CONFIRM timeout reached -> activating button fallback');
        this.triggerButtonFallback('Please tap Yes or No to continue.');
      }
    }, 20000);

    // Speak the confirmation prompt first
    this.speakPromptWithSequentialControl(
      confirmationPromptText,
      'speaking_prompt',
      this.language === 'hi' ? 'बोल रहे हैं...' : 'Speaking confirmation...',
      () => {
        // TTS Finished -> Wait 400ms gap before opening microphone
        this.callbacks.onStatusChange(
          'delay_gap',
          this.language === 'hi' ? 'तैयार हो रहे हैं...' : 'Preparing microphone...'
        );
        this.gapTimer = setTimeout(() => {
          if (!this.transitionFired && !this.isDestroyed) {
            this.startDedicatedListeningSession(1);
          }
        }, 400);
      }
    );
  }

  /**
   * Speaks prompt with sequential control: guarantees TTS and STT never overlap.
   */
  private speakPromptWithSequentialControl(
    textToSpeak: string,
    status: ConfirmVoiceStatus,
    statusText: string,
    onEnded: () => void
  ): void {
    if (this.isDestroyed || this.transitionFired) return;

    // Guarantee: Stop any listening before speaking
    this.destroyRecognizer();

    this.callbacks.onStatusChange(status, statusText);
    logConfirmDebug('TTS', `onStart: "${textToSpeak.substring(0, 60)}..."`);

    const targetLocale = this.language === 'hi' ? 'hi-IN' : 'en-US';

    browserSpeechController.cancelSpeech();
    browserSpeechController.speakWithWebSpeechSynth(
      textToSpeak,
      () => {
        logConfirmDebug('TTS', 'Native speech onstart fired');
      },
      () => {
        logConfirmDebug('TTS', 'onDone: TTS playback completed cleanly');
        if (!this.isDestroyed && !this.transitionFired) {
          onEnded();
        }
      },
      targetLocale
    );
  }

  /**
   * Starts a fresh short-session recognizer for the CONFIRM state (Attempt 1 or 2).
   */
  public startDedicatedListeningSession(attempt: number): void {
    if (this.transitionFired || this.isDestroyed) {
      logConfirmDebug('GUARD', 'Cannot start listening: flow already resolved or destroyed');
      return;
    }

    this.currentAttempt = attempt;
    logConfirmDebug('STT', `Starting dedicated recognizer session: Attempt ${attempt}/2`);

    // Verify microphone permission & explicit user consent
    const hasConsent = getMicConsent();
    if (!hasConsent) {
      logConfirmDebug('STT', 'Microphone consent not granted -> fallback to buttons');
      this.triggerButtonFallback(
        this.language === 'hi'
          ? 'माइक अनुमति आवश्यक है। कृपया बटन दबाकर चुनें।'
          : 'Microphone permission needed. Please tap Yes or No.'
      );
      return;
    }

    // Stop and clear any existing recognizer or listeners first
    this.destroyRecognizer();

    // Check browser SpeechRecognition availability
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      logConfirmDebug('STT', 'SpeechRecognition not supported in browser environment -> button fallback');
      this.triggerButtonFallback(
        this.language === 'hi' ? 'कृपया बटन दबाकर पुष्टि करें' : 'Please tap Yes or No below'
      );
      return;
    }

    try {
      const recognizer = new SpeechRec();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 1;
      recognizer.lang = this.language === 'hi' ? 'hi-IN' : 'en-IN';

      this.callbacks.onStatusChange(
        'listening',
        this.language === 'hi' ? 'सुन रहे हैं... (हाँ या नहीं कहें)' : 'Listening... (Say Yes or No)'
      );
      this.callbacks.onLiveTranscript('');

      // 6 to 8 second listen window (7 seconds optimal)
      if (this.listenWindowTimer) clearTimeout(this.listenWindowTimer);
      this.listenWindowTimer = setTimeout(() => {
        logConfirmDebug('STT', `Listen window timed out (7s) on attempt ${attempt}`);
        this.handleListenWindowTimeout();
      }, 7000);

      recognizer.onstart = () => {
        this.isListening = true;
        logConfirmDebug('STT', `Recognizer onstart active (lang=${recognizer.lang})`);
      };

      recognizer.onresult = (event: any) => {
        if (this.transitionFired || this.isDestroyed) return;

        let interim = '';
        let finalStr = '';
        let latestConfidence = 0.85;

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            if (res[0].confidence !== undefined && res[0].confidence > 0) {
              latestConfidence = res[0].confidence;
            }
            if (res.isFinal) {
              finalStr += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }
        }

        const candidateText = (finalStr + ' ' + interim).trim();
        if (!candidateText) return;

        logConfirmDebug('RESULT', `Live speech captured: "${candidateText}" (conf=${latestConfidence})`);
        this.callbacks.onLiveTranscript(candidateText);

        // Immediate intent parsing on partial/interim & final results!
        const parsed = parseYesNoIntentDetailed(candidateText);

        if (parsed.intent === 'yes' || parsed.intent === 'no') {
          // Guard against duplicate event execution
          if (this.transitionFired) {
            logConfirmDebug('GUARD', `Ignoring duplicate result: already transitioned`);
            return;
          }
          this.transitionFired = true;

          logConfirmDebug(
            'TRANSITION',
            `Confirmed intent "${parsed.intent.toUpperCase()}" detected! Transitioning immediately.`
          );

          this.callbacks.onStatusChange(
            'processing',
            parsed.intent === 'yes'
              ? (this.language === 'hi' ? 'स्वीकृत: गीता दर्शन की ओर...' : 'Confirmed: Proceeding to Gita...')
              : (this.language === 'hi' ? 'समझ रहे हैं: स्पष्टीकरण...' : 'Refining understanding...')
          );

          // Stop listening and cancel all timers immediately
          this.stopAllAudioAndTimers();

          // Dispatch transition to state machine
          this.callbacks.onIntentResolved(parsed.intent);
        }
      };

      recognizer.onerror = (e: any) => {
        logConfirmDebug('STT', `Recognizer onerror: ${e.error}`);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.triggerButtonFallback(
            this.language === 'hi'
              ? 'माइक की अनुमति नहीं मिली। कृपया नीचे बटन का उपयोग करें।'
              : 'Microphone access blocked. Please use the buttons below.'
          );
        } else if (e.error === 'network') {
          this.triggerButtonFallback(
            this.language === 'hi'
              ? 'नेटवर्क समस्या। कृपया नीचे बटन से चुनें।'
              : 'Network issue. Please choose using the buttons below.'
          );
        }
        // 'no-speech' is naturally handled by the 7s listen window timer
      };

      recognizer.onend = () => {
        logConfirmDebug('STT', 'Recognizer onend event');
        this.isListening = false;
      };

      recognizer.start();
      this.recognizer = recognizer;
    } catch (err: any) {
      logConfirmDebug('STT', 'Exception starting SpeechRecognition', err);
      this.triggerButtonFallback(
        this.language === 'hi' ? 'कृपया बटन दबाकर चुनें' : 'Please select using buttons below'
      );
    }
  }

  /**
   * Handles listen window timeout when no clear Yes or No was heard.
   */
  private handleListenWindowTimeout(): void {
    if (this.transitionFired || this.isDestroyed) return;

    this.destroyRecognizer();

    if (this.currentAttempt === 1) {
      // Re-ask once gently
      logConfirmDebug('STT', 'Attempt 1 failed or unclear. Playing retry prompt...');
      this.callbacks.onStatusChange(
        'retry_prompt',
        this.language === 'hi' ? 'समझ नहीं पाए, पुनः पूछ रहे हैं...' : "Didn't catch that, asking once more..."
      );

      const retrySpeech =
        this.language === 'hi'
          ? 'क्षमा करें, मैं समझ नहीं पाया। कृपया हाँ या नहीं कहें।'
          : "Sorry, I didn't catch that. Please say Yes or No.";

      this.speakPromptWithSequentialControl(
        retrySpeech,
        'retry_prompt',
        this.language === 'hi' ? 'कृपया हाँ या नहीं कहें...' : 'Please say Yes or No...',
        () => {
          // Wait 400ms then start Attempt 2
          this.gapTimer = setTimeout(() => {
            if (!this.transitionFired && !this.isDestroyed) {
              this.startDedicatedListeningSession(2);
            }
          }, 400);
        }
      );
    } else {
      // Attempt 2 failed: Fall back to prominent manual buttons
      logConfirmDebug('GUARD', 'Attempt 2 failed without resolution. Falling back to buttons.');
      this.triggerButtonFallback(
        this.language === 'hi'
          ? 'कृपया नीचे दिए गए "हाँ" या "नहीं" बटन पर टैप करें।'
          : 'Please tap the Yes or No button below to continue.'
      );
    }
  }

  /**
   * Triggers fallback button mode where mic is optional and buttons are emphasized.
   */
  public triggerButtonFallback(noticeText?: string): void {
    this.stopAllAudioAndTimers();
    this.callbacks.onStatusChange(
      'fallback_buttons',
      noticeText ||
        (this.language === 'hi'
          ? 'कृपया हाँ या नहीं बटन चुनें।'
          : 'Please tap Yes or No to proceed.')
    );
  }

  /**
   * Stops recognizer safely and removes event listeners.
   */
  private destroyRecognizer(): void {
    if (this.recognizer) {
      try {
        this.recognizer.onresult = null;
        this.recognizer.onerror = null;
        this.recognizer.onend = null;
        this.recognizer.onstart = null;
        this.recognizer.abort();
      } catch (_) {}
      this.recognizer = null;
    }
    this.isListening = false;
  }

  /**
   * Stops all active audio, speech synthesis, and timers.
   */
  public stopAllAudioAndTimers(): void {
    if (this.listenWindowTimer) {
      clearTimeout(this.listenWindowTimer);
      this.listenWindowTimer = null;
    }
    if (this.gapTimer) {
      clearTimeout(this.gapTimer);
      this.gapTimer = null;
    }
    this.destroyRecognizer();
  }

  /**
   * Clean destruction when leaving the CONFIRM state or unmounting.
   */
  public destroy(): void {
    this.isDestroyed = true;
    if (this.overallSafetyTimer) {
      clearTimeout(this.overallSafetyTimer);
      this.overallSafetyTimer = null;
    }
    this.stopAllAudioAndTimers();
    browserSpeechController.cancelSpeech();
  }

  /**
   * User barge-in: cancel TTS immediately if user speaks or interacts.
   */
  public handleBargeIn(): void {
    logConfirmDebug('GUARD', 'Barge-in triggered: canceling TTS speech');
    browserSpeechController.cancelSpeech();
  }
}
