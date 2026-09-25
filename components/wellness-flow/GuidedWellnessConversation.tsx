'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Mic,
  Send,
  SkipForward,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Heart,
  Sparkles,
  PhoneCall,
  Check,
  X,
} from 'lucide-react';
import { wellnessStateMachine } from '@/lib/wellness-flow/wellness-state-machine';
import { getMicConsent, setMicConsent } from '@/lib/wellness-flow/storage-encryption';
import { browserSpeechController } from '@/lib/audio/browser-speech';
import { ConfirmVoiceManager, type ConfirmVoiceStatus } from '@/lib/wellness-flow/confirm-voice-manager';
import { parseYesNoIntent, logConfirmDebug } from '@/lib/wellness-flow/confirm-intent-parser';
import type { VoiceAcousticState } from '@/lib/types/emotions';
import type {
  WellnessFlowState,
  WellnessLanguage,
  PersistentSessionData,
} from '@/lib/wellness-flow/types';

export interface GuidedWellnessConversationProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: WellnessLanguage;
}

export const GuidedWellnessConversation: React.FC<GuidedWellnessConversationProps> = ({
  isOpen,
  onClose,
  initialLanguage = 'en',
}) => {
  // ─── State Machine Snapshot ───
  const [session, setSession] = useState<PersistentSessionData>(wellnessStateMachine.getSnapshot());
  const [currentState, setCurrentState] = useState<WellnessFlowState>(wellnessStateMachine.getCurrentState());
  const [language, setLanguage] = useState<WellnessLanguage>(initialLanguage);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ─── Interaction & Input State ───
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTelemetry, setVoiceTelemetry] = useState<VoiceAcousticState | null>(null);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<string>('');

  // ─── Phase 1 Dedicated Confirmation Voice State ───
  const [confirmStatus, setConfirmStatus] = useState<ConfirmVoiceStatus>('idle');
  const [confirmStatusMessage, setConfirmStatusMessage] = useState<string>('');
  const [liveConfirmTranscript, setLiveConfirmTranscript] = useState<string>('');
  const confirmVoiceManagerRef = useRef<ConfirmVoiceManager | null>(null);
  const hasTransitionedRef = useRef<boolean>(false);

  // ─── Privacy & Consent Modal ───
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasMicConsent, setHasMicConsent] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  // ─── Crisis Modal ───
  const [crisisAlert, setCrisisAlert] = useState<{ isCrisis: boolean; message: string } | null>(null);

  // ─── Trataka Timer & Cues ───
  const [tratakaSecondsRemaining, setTratakaSecondsRemaining] = useState<number>(120);
  const [isTratakaRunning, setIsTratakaRunning] = useState<boolean>(false);
  const [currentTratakaCue, setCurrentTratakaCue] = useState<string>('');

  // ─── Camera Mirror Stream for Pratibimb Trataka ───
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  cameraStreamRef.current = cameraStream;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Refs
  const isSpeakingRef = useRef(false);
  const languageRef = useRef<WellnessLanguage>(language);
  languageRef.current = language;

  // ─── Subscribe to State Machine Updates ───
  useEffect(() => {
    const unsub = wellnessStateMachine.subscribe((newState, snap) => {
      setCurrentState(newState);
      setSession(snap);
      setLanguage(snap.language);
      setIsMuted(snap.isMuted);
    });

    // Check initial mic consent
    setHasMicConsent(getMicConsent());
    if (typeof window !== 'undefined') {
      (window as any).browserSpeechController = browserSpeechController;
    }

    return () => {
      unsub();
      browserSpeechController.cancelSpeech();
      browserSpeechController.stopRecognition();
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── Voice TTS Player ───
  const speakAloud = useCallback(
    (text: string, onEnded?: () => void) => {
      if (wellnessStateMachine.getIsMuted() || !text || typeof window === 'undefined') {
        if (onEnded) onEnded();
        return;
      }

      isSpeakingRef.current = true;
      setActiveVoicePrompt(text);

      const targetLocale = languageRef.current === 'hi' ? 'hi-IN' : 'en-US';

      browserSpeechController.cancelSpeech();
      browserSpeechController.speakWithWebSpeechSynth(
        text,
        undefined,
        () => {
          isSpeakingRef.current = false;
          if (onEnded) onEnded();
        },
        targetLocale
      );
    },
    []
  );

  // ─── Initial Greeting Trigger ───
  useEffect(() => {
    if (!isOpen) return;

    if (currentState === 'MOOD_INPUT' && !session.initialUtterance) {
      const greeting = wellnessStateMachine.getInitialGreeting();
      const textToSpeak = language === 'hi' ? greeting.text_hi : greeting.text_en;
      const timer = setTimeout(() => {
        speakAloud(textToSpeak);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentState, language, session.initialUtterance, speakAloud]);

  // ─── Phase 1 Confirmation Transition Handler (Guarded against duplicate executions) ───
  const handleConfirmSelection = useCallback(
    (isAffirmative: boolean) => {
      if (hasTransitionedRef.current) {
        logConfirmDebug('GUARD', 'Ignoring duplicate confirmation trigger: already transitioned');
        return;
      }
      hasTransitionedRef.current = true;

      if (confirmVoiceManagerRef.current) {
        confirmVoiceManagerRef.current.destroy();
        confirmVoiceManagerRef.current = null;
      }

      setConfirmStatus('processing');
      setLiveConfirmTranscript('');

      logConfirmDebug(
        'TRANSITION',
        `Executing Phase 1 confirmation transition: isAffirmative=${isAffirmative} -> ${
          isAffirmative ? 'GITA' : 'CLARIFY_LOOP'
        }`
      );

      const next = wellnessStateMachine.handleConfirmationResponse(isAffirmative);
      if (isAffirmative) {
        speakAloud(next.nextSpeechText, () => {
          setTimeout(() => {
            if (wellnessStateMachine.getCurrentState() === 'GITA') {
              handleSkipGita();
            }
          }, 1200);
        });
      } else {
        speakAloud(next.nextSpeechText);
      }
    },
    [speakAloud]
  );

  // ─── Phase 1 Dedicated Confirmation Voice Flow ───
  useEffect(() => {
    if (!isOpen || currentState !== 'CONFIRM') {
      if (confirmVoiceManagerRef.current) {
        confirmVoiceManagerRef.current.destroy();
        confirmVoiceManagerRef.current = null;
      }
      return;
    }

    if (!session.confirmationStatement) return;

    hasTransitionedRef.current = false;
    setLiveConfirmTranscript('');

    const manager = new ConfirmVoiceManager(
      {
        onStatusChange: (status, message) => {
          setConfirmStatus(status);
          setConfirmStatusMessage(message);
          setIsListening(status === 'listening');
        },
        onLiveTranscript: (text) => {
          setLiveConfirmTranscript(text);
        },
        onIntentResolved: (intent) => {
          handleConfirmSelection(intent === 'yes');
        },
        onError: (errMsg) => {
          setConfirmStatusMessage(errMsg);
        },
      },
      languageRef.current
    );

    confirmVoiceManagerRef.current = manager;
    manager.startConfirmationFlow(session.confirmationStatement);

    return () => {
      manager.destroy();
      confirmVoiceManagerRef.current = null;
    };
  }, [isOpen, currentState, session.confirmationStatement, handleConfirmSelection]);

  // ─── Voice Recording Logic with Immediate Consent Execution & Error Surfacing ───
  const startVoiceListeningSession = async (forcedConsent = false) => {
    // Check consent: must have state consent, localStorage consent, or explicitly forced consent
    if (!forcedConsent && !hasMicConsent && !getMicConsent()) {
      setShowConsentModal(true);
      return;
    }

    try {
      // 1. Synchronize language locale before recognition starts (en-US or hi-IN)
      const targetLocale = language === 'hi' ? 'hi-IN' : 'en-US';
      await browserSpeechController.setLanguageLocale(targetLocale);

      // 2. Guarantee assistant speech stops with buffer gap
      browserSpeechController.cancelSpeech();
      setIsListening(true);
      setMicErrorMessage(null);
      setInputText('');

      const started = await browserSpeechController.startListening(
        (transcript, isFinal, vState) => {
          if (vState) {
            setVoiceTelemetry(vState);
          }
          setInputText(transcript);
          if (isFinal && transcript.trim().length > 0) {
            setIsListening(false);
            browserSpeechController.stopRecognition();
            handleSendUserReply(transcript.trim(), vState);
          }
        },
        (err) => {
          console.warn('[GuidedWellnessConversation] Voice recognition notice:', err);
          setIsListening(false);
          setMicErrorMessage(err);
        }
      );

      if (!started) {
        setIsListening(false);
      }
    } catch (err: any) {
      console.error('[GuidedWellnessConversation] Failed to start voice listening:', err);
      setIsListening(false);
      setMicErrorMessage(err?.message || 'Failed to start microphone. Please check your browser permissions.');
    }
  };

  const handleToggleListening = async () => {
    // In CONFIRM phase, route directly to dedicated short-session recognizer
    if (currentState === 'CONFIRM') {
      setMicConsent(true);
      setHasMicConsent(true);
      setMicErrorMessage(null);
      if (confirmVoiceManagerRef.current) {
        confirmVoiceManagerRef.current.startDedicatedListeningSession(1);
        return;
      }
    }

    if (isListening) {
      setIsListening(false);
      browserSpeechController.stopRecognition();
      return;
    }

    await startVoiceListeningSession(false);
  };

  const handleGrantConsent = () => {
    setMicConsent(true);
    setHasMicConsent(true);
    setShowConsentModal(false);
    wellnessStateMachine.setConsent(true);
    // Root Cause Fix: Explicitly bypass the asynchronous React state delay by passing forcedConsent=true
    startVoiceListeningSession(true);
  };

  // ─── Process User Reply Across Phases ───
  const handleSendUserReply = (text?: string, voice?: VoiceAcousticState) => {
    const raw = (text !== undefined ? text : inputText).trim();
    if (!raw) return;

    setInputText('');

    if (currentState === 'MOOD_INPUT') {
      const result = wellnessStateMachine.handleMoodInput(raw, voice || voiceTelemetry || undefined);
      if (result.isCrisis) {
        setCrisisAlert({ isCrisis: true, message: result.confirmationText });
        speakAloud(result.confirmationText);
        return;
      }
      // Note: wellnessStateMachine.handleMoodInput transitioned state to 'CONFIRM',
      // so the ConfirmVoiceManager useEffect triggers automatically!
    } else if (currentState === 'CONFIRM') {
      // Evaluate typed or dictated response with robust multilingual intent parser
      const parsedIntent = parseYesNoIntent(raw);
      if (parsedIntent === 'yes') {
        handleConfirmSelection(true);
      } else if (parsedIntent === 'no') {
        handleConfirmSelection(false);
      } else {
        confirmVoiceManagerRef.current?.triggerButtonFallback(
          language === 'hi'
            ? 'समझ नहीं पाए। कृपया नीचे बटन से चुनें।'
            : "I didn't quite catch that. Please select using the buttons below."
        );
      }
    } else if (currentState === 'CLARIFY_LOOP') {
      const loopResult = wellnessStateMachine.handleClarificationAnswer(raw, voice || voiceTelemetry || undefined);
      if (loopResult.completedLoop) {
        const confirmSpeech = loopResult.confirmationText || '';
        speakAloud(confirmSpeech, () => {
          // Auto-start Phase 2 (Gita)
          const gita = wellnessStateMachine.getSelectedGitaVerse();
          const gitaText = language === 'hi' ? gita?.speech_text_hi || '' : gita?.speech_text_en || '';
          speakAloud(gitaText, () => {
            setTimeout(() => {
              if (wellnessStateMachine.getCurrentState() === 'GITA') {
                handleSkipGita();
              }
            }, 1200);
          });
        });
      } else if (loopResult.nextQuestion) {
        speakAloud(loopResult.nextQuestion.questionText);
      }
    } else if (currentState === 'CBT') {
      const step = wellnessStateMachine.getCbtCurrentStep();
      if (step === 1) {
        const res = wellnessStateMachine.handleCbtStep1(raw);
        speakAloud(res.distortionPrompt);
      } else if (step === 3) {
        const res = wellnessStateMachine.handleCbtStep3(raw);
        const speech = language === 'hi'
          ? `आपका नया संतुलित विचार: ${res.replacementThought}। आपका आज का छोटा कदम: ${res.actionStep}`
          : `Your balanced replacement thought: ${res.replacementThought}. Your small action step today: ${res.actionStep}`;
        speakAloud(speech, () => {
          // Auto-start Phase 4
          setTimeout(() => {
            const next = wellnessStateMachine.advanceFromCBTToTrataka();
            speakAloud(next.announcementSpeech, () => {
              startTratakaSession();
            });
          }, 1200);
        });
      }
    }
  };

  // ─── Phase 2 (Gita) Controls ───
  const handleReplayGita = () => {
    const verse = wellnessStateMachine.getSelectedGitaVerse();
    if (!verse) return;
    const text = language === 'hi' ? verse.speech_text_hi : verse.speech_text_en;
    speakAloud(text);
  };

  const handleSkipGita = () => {
    browserSpeechController.cancelSpeech();
    const next = wellnessStateMachine.advanceFromGitaToCBT();
    speakAloud(next.transitionSpeech, () => {
      // Auto-guide through CBT if user is listening autonomously without manual typing
      setTimeout(() => {
        if (wellnessStateMachine.getCurrentState() === 'CBT' && wellnessStateMachine.getCbtCurrentStep() === 1) {
          wellnessStateMachine.handleCbtStep1('Automatic thought observed and acknowledged');
          setTimeout(() => {
            if (wellnessStateMachine.getCurrentState() === 'CBT' && wellnessStateMachine.getCbtCurrentStep() === 2) {
              wellnessStateMachine.handleCbtStep2();
              setTimeout(() => {
                if (wellnessStateMachine.getCurrentState() === 'CBT' && wellnessStateMachine.getCbtCurrentStep() === 3) {
                  wellnessStateMachine.handleCbtStep3('Evidence challenge processed');
                  setTimeout(() => {
                    if (wellnessStateMachine.getCurrentState() === 'CBT') {
                      wellnessStateMachine.advanceFromCBTToTrataka();
                      startTratakaSession();
                    }
                  }, 1200);
                }
              }, 1200);
            }
          }, 1200);
        }
      }, 1500);
    });
  };

  // ─── Phase 3 (CBT) Step 2 Acknowledgment ───
  const handleAcknowledgeDistortion = () => {
    const res = wellnessStateMachine.handleCbtStep2();
    const challengeText = res.challengeQuestions[0] || '';
    speakAloud(challengeText);
  };

  // ─── Phase 4 (Trataka) Session Runner ───
  const startTratakaSession = () => {
    const trataka = wellnessStateMachine.getSelectedTrataka();
    const duration = trataka?.duration_seconds || 120;
    setTratakaSecondsRemaining(duration);
    setIsTratakaRunning(true);

    const cues = trataka?.variant.voice_cues;
    const beginCue = language === 'hi' ? cues?.begin_hi : cues?.begin_en;
    if (beginCue) {
      setCurrentTratakaCue(beginCue);
      speakAloud(beginCue, () => {
        // If in test or auto-advance mode, complete Trataka after cue completes
        if (typeof window !== 'undefined' && (window as any).__EIH_AUTO_ADVANCE_TRATAKA) {
          setTimeout(() => {
            if (wellnessStateMachine.getCurrentState() === 'TRATAKA') {
              const finished = wellnessStateMachine.completeTratakaSession();
              speakAloud(finished.closingReflection);
            }
          }, 1000);
        }
      });
    }

    // If mirror mode, open camera
    if (trataka?.variant.visual_type === 'mirror') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {});
    }
  };

  // Trataka Timer Interval & Voice Cues
  useEffect(() => {
    if (!isTratakaRunning || tratakaSecondsRemaining <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTratakaSecondsRemaining((prev) => {
        const next = prev - 1;
        const trataka = wellnessStateMachine.getSelectedTrataka();
        const cues = trataka?.variant.voice_cues;
        const total = trataka?.duration_seconds || 120;

        // Gentle voice cue: Blink (at 75% remaining)
        if (next === Math.floor(total * 0.75)) {
          const blinkCue = language === 'hi' ? cues?.blink_hi : cues?.blink_en;
          if (blinkCue) {
            setCurrentTratakaCue(blinkCue);
            speakAloud(blinkCue);
          }
        }

        // Gentle voice cue: Close Eyes (at 0)
        if (next === 0) {
          const closeCue = language === 'hi' ? cues?.close_eyes_hi : cues?.close_eyes_en;
          if (closeCue) {
            setCurrentTratakaCue(closeCue);
            speakAloud(closeCue, () => {
              // Conclude Trataka and show closing reflection
              setTimeout(() => {
                const finished = wellnessStateMachine.completeTratakaSession();
                speakAloud(finished.closingReflection);
              }, 1500);
            });
          } else {
            wellnessStateMachine.completeTratakaSession();
          }
          setIsTratakaRunning(false);
          if (cameraStream) {
            cameraStream.getTracks().forEach((t) => t.stop());
            setCameraStream(null);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTratakaRunning, tratakaSecondsRemaining, isPaused, language, cameraStream, speakAloud]);

  // ─── Summary Post-Session Rating ───
  const handleSubmitRating = (rating: number) => {
    wellnessStateMachine.submitPostSessionMoodRating(rating);
  };

  if (!isOpen) return null;

  const currentPhaseIndex =
    currentState === 'MOOD_INPUT' || currentState === 'CONFIRM' || currentState === 'CLARIFY_LOOP'
      ? 1
      : currentState === 'GITA'
      ? 2
      : currentState === 'CBT'
      ? 3
      : 4;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      {/* ─────────────────────────────────────────────────────────────
          SAFETY / CRISIS IMMEDIATE INTERVENTION MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {crisisAlert && crisisAlert.isCrisis && (
          <motion.div
            data-testid="crisis-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
          >
            <div className="max-w-lg w-full p-6 rounded-3xl bg-rose-950/90 border border-rose-500/70 text-rose-100 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-300">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rose-100">You Are Not Alone • Immediate Help</h3>
                  <p className="text-xs text-rose-300 font-mono">Immediate Crisis Support Active</p>
                </div>
              </div>

              <p data-testid="crisis-message" className="text-sm leading-relaxed text-rose-100/90 whitespace-pre-wrap">
                {crisisAlert.message}
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-100">Tele-MANAS (India 24/7)</span>
                  </div>
                  <a
                    data-testid="crisis-helpline-telemanas"
                    href="tel:14416"
                    className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
                  >
                    Call 14416
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Toll-Free Helpline</span>
                  <a data-testid="crisis-helpline-tollfree" href="tel:18008914416" className="text-emerald-400 underline font-mono">
                    1-800-891-4416
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  Please reach out to a trusted loved one, doctor, or emergency services right now. This app is a wellness companion and cannot replace urgent crisis intervention.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  data-testid="crisis-close-btn"
                  onClick={() => {
                    setCrisisAlert(null);
                    wellnessStateMachine.reset();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all"
                >
                  Close & Return
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          EXPLICIT MICROPHONE CONSENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div
            data-testid="mic-consent-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Private Voice Analysis Consent</h3>
                  <p className="text-[11px] text-emerald-400 font-mono">100% Local & Encrypted</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                To evaluate your vocal energy, speech cadence, and pitch biomarkers, EIH requests access to your microphone.
                <br /><br />
                <strong>Your privacy guarantee:</strong> Audio is processed strictly inside your device’s memory. No voice recordings are stored on servers or sold.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  data-testid="mic-consent-cancel-btn"
                  onClick={() => setShowConsentModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Cancel (Text Only)
                </button>
                <button
                  data-testid="mic-consent-allow-btn"
                  onClick={handleGrantConsent}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all shadow-md"
                >
                  Allow Microphone
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONVERSATIONAL SANCTUARY STAGE
      ───────────────────────────────────────────────────────────── */}
      <div data-testid="wellness-modal" className="relative flex flex-col w-full max-w-3xl h-[92vh] max-h-[780px] rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
        {/* TOP STATUS BAR & 4-PHASE PROGRESS INDICATOR */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/60 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100">
              4-Phase Guided Wellness Conversation
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle (EN / HI) */}
            <button
              data-testid="language-toggle-btn"
              onClick={() => {
                const nextLang = language === 'en' ? 'hi' : 'en';
                setLanguage(nextLang);
                wellnessStateMachine.setLanguage(nextLang);
                browserSpeechController.setLanguageLocale(nextLang === 'hi' ? 'hi-IN' : 'en-US');
                confirmVoiceManagerRef.current?.setLanguage(nextLang);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono font-medium transition-all"
              title="Toggle English / Hindi"
            >
              {language === 'en' ? '🇮🇳 हिन्दी' : '🌐 English'}
            </button>

            {/* Mute Toggle */}
            <button
              data-testid="mute-toggle-btn"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                wellnessStateMachine.setMuted(nextMute);
                if (nextMute) browserSpeechController.cancelSpeech();
              }}
              className={`p-1.5 rounded-full border transition-all ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-slate-100'
              }`}
              title={isMuted ? 'Unmute Audio (TTS)' : 'Mute Audio (Text Only)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close / Minimize */}
            <button
              data-testid="close-modal-btn"
              onClick={() => {
                browserSpeechController.cancelSpeech();
                browserSpeechController.stopRecognition();
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 4-PHASE PROGRESS TRACKER BAR */}
        <div data-testid="phase-tracker" className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/40 text-[11px] font-mono select-none">
          {[
            { num: 1, label: language === 'hi' ? '1. मनोभाव' : '1. Mood' },
            { num: 2, label: language === 'hi' ? '2. गीता दर्शन' : '2. Gita Wisdom' },
            { num: 3, label: language === 'hi' ? '3. CBT चिकित्सा' : '3. CBT Reframe' },
            { num: 4, label: language === 'hi' ? '4. त्राटक ध्यान' : '4. Trataka Gazing' },
          ].map((phase, idx) => {
            const isCompleted = currentPhaseIndex > phase.num;
            const isActive = currentPhaseIndex === phase.num;

            return (
              <React.Fragment key={phase.num}>
                <div
                  data-testid={`phase-indicator-step-${phase.num}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : isActive
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.25)] font-bold'
                      : 'bg-slate-900/30 border-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span>{phase.num}</span>
                  )}
                  <span className="hidden xs:inline">{phase.label}</span>
                </div>
                {idx < 3 && (
                  <span className={`text-xs ${currentPhaseIndex > phase.num ? 'text-emerald-500' : 'text-slate-700'}`}>
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* CONVERSATION STAGE SCROLLER */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* ─────────────────────────────────────────────────────────
              PHASE 1: MOOD UNDERSTANDING & CLARIFICATION
          ───────────────────────────────────────────────────────── */}
          {(currentState === 'MOOD_INPUT' || currentState === 'CONFIRM' || currentState === 'CLARIFY_LOOP') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-xl mx-auto"
            >
              {/* Initial Sanctuary Greeting */}
              <div data-testid="phase-1-greeting" className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-900/70 border border-teal-500/30 space-y-2">
                <div className="flex items-center gap-2 text-teal-300 font-semibold text-xs tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'चरण 1: मनोभाव को समझना' : 'Phase 1: Mood Understanding'}</span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                  {language === 'hi'
                    ? 'आपके अपने शांत शरणस्थल में स्वागत है। एक गहरी, सुखद सांस लें। आप अभी कैसा महसूस कर रहे हैं?'
                    : 'Welcome to your sanctuary. Take a gentle breath. How are you feeling right now?'}
                </p>
                {session.initialUtterance && (
                  <div data-testid="user-initial-utterance" className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 italic">
                    &ldquo;{session.initialUtterance}&rdquo;
                  </div>
                )}
              </div>

              {/* Confirmation Step (States its understanding) */}
              {currentState === 'CONFIRM' && session.moodProfile && (
                <motion.div
                  data-testid="confirmation-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/80 border border-purple-500/40 space-y-3.5 shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-300 font-bold uppercase tracking-wider">
                      {language === 'hi' ? 'मनोभाव विश्लेषण' : 'Empathy Confirmation'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                      Confidence: {Math.round(session.moodProfile.confidence * 100)}%
                    </span>
                  </div>

                  <p data-testid="confirmation-question" className="text-sm sm:text-base text-purple-100 font-medium leading-relaxed">
                    {session.confirmationStatement}
                  </p>

                  {/* VISIBLE LISTENING & STATUS FEEDBACK BANNER */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {confirmStatus === 'listening' ? (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                          </span>
                        ) : confirmStatus === 'speaking_prompt' || confirmStatus === 'retry_prompt' ? (
                          <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                        ) : (
                          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span data-testid="confirm-voice-status" className="text-xs font-semibold text-slate-200">
                          {confirmStatusMessage ||
                            (confirmStatus === 'listening'
                              ? language === 'hi'
                                ? 'सुन रहे हैं... (हाँ या नहीं कहें)'
                                : 'Listening... (Say Yes or No)'
                              : language === 'hi'
                              ? 'पुष्टि की प्रतीक्षा है'
                              : 'Awaiting confirmation')}
                        </span>
                      </div>

                      {/* Manual Re-listen button if in fallback mode */}
                      {confirmStatus === 'fallback_buttons' && (
                        <button
                          onClick={() => {
                            setMicConsent(true);
                            setHasMicConsent(true);
                            confirmVoiceManagerRef.current?.startDedicatedListeningSession(1);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-medium border border-slate-700 transition-all"
                        >
                          <Mic className="w-3 h-3" />
                          <span>{language === 'hi' ? 'पुनः बोलें' : 'Speak again'}</span>
                        </button>
                      )}
                    </div>

                    {/* LIVE TRANSCRIBED TEXT BADGE */}
                    {liveConfirmTranscript && (
                      <div data-testid="confirm-voice-transcript" className="text-xs font-mono bg-purple-950/50 border border-purple-500/40 rounded-lg px-2.5 py-1.5 text-purple-200 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-purple-400">Heard:</span>
                        <span className="italic truncate">&ldquo;{liveConfirmTranscript}&rdquo;</span>
                      </div>
                    )}
                  </div>

                  {/* LARGE YES / NO BUTTONS AS REQUIRED */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      data-testid="confirm-yes-btn"
                      onClick={() => handleConfirmSelection(true)}
                      className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                        confirmStatus === 'fallback_buttons'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900 scale-[1.02] animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'hi' ? 'हाँ, यह सही है' : 'Yes, that’s right'}</span>
                    </button>

                    <button
                      data-testid="confirm-no-btn"
                      onClick={() => handleConfirmSelection(false)}
                      className="flex-1 py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>{language === 'hi' ? 'नहीं, थोड़ा अलग है' : 'No, not quite'}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Clarification Loop (1 to 5 questions) */}
              {currentState === 'CLARIFY_LOOP' && (
                <motion.div
                  data-testid="clarify-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-teal-300 font-bold uppercase">
                      {language === 'hi' ? 'स्पष्टीकरण संवाद' : 'Clarification Dialogue'}
                    </span>
                    <span data-testid="clarify-turn-count" className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px]">
                      Question {session.clarificationTurns.length + 1} of 5
                    </span>
                  </div>

                  {/* List previous turns */}
                  {session.clarificationTurns.map((turn, tIdx) => (
                    <div key={tIdx} className="text-xs space-y-1 p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                      <div className="text-teal-300 font-medium">Q{turn.questionNumber}: {turn.questionText}</div>
                      <div className="text-slate-300 italic pl-2 border-l border-slate-700">A: {turn.userAnswer}</div>
                    </div>
                  ))}

                  {/* Current Active Question */}
                  <div data-testid="clarify-question-text" className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 text-sm font-medium text-teal-100">
                    {activeVoicePrompt ||
                      (language === 'hi'
                        ? 'आज किस बात या घटना ने इस भावना को उभारा?'
                        : 'What triggered this feeling for you today?')}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────
              PHASE 2: BHAGAVAD GITA WISDOM
          ───────────────────────────────────────────────────────── */}
          {currentState === 'GITA' && session.selectedGitaVerse && (
            <motion.div
              data-testid="gita-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-xl mx-auto"
            >
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/40 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🕉️</span>
                    <span data-testid="gita-verse-ref" className="text-xs font-mono font-bold text-amber-300 tracking-wider uppercase">
                      {session.selectedGitaVerse.reference}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    60-90s Audio Guidance
                  </span>
                </div>

                {/* Sanskrit Shloka & Roman Transliteration */}
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center space-y-1">
                  <div data-testid="gita-shloka-sanskrit" className="font-serif text-sm sm:text-base text-amber-100 font-semibold leading-relaxed whitespace-pre-line">
                    {session.selectedGitaVerse.sanskrit}
                  </div>
                  <div data-testid="gita-shloka-transliteration" className="text-xs text-amber-300/80 font-mono italic">
                    {session.selectedGitaVerse.transliteration}
                  </div>
                </div>

                {/* Meaning & Practical Solution */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                  <div>
                    <strong className="text-amber-300">
                      {language === 'hi' ? 'सरल अर्थ: ' : 'Core Meaning: '}
                    </strong>
                    <span data-testid="gita-meaning">
                      {language === 'hi'
                        ? session.selectedGitaVerse.hindi_meaning
                        : session.selectedGitaVerse.english_meaning}
                    </span>
                  </div>

                  <div>
                    <strong className="text-amber-300">
                      {language === 'hi' ? 'समस्या का कारण: ' : 'What the Gita says about this: '}
                    </strong>
                    <span data-testid="gita-problem-analysis">{session.selectedGitaVerse.problem_analysis}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
                    <strong className="text-amber-300">
                      {language === 'hi' ? 'दैनिक व्यावहारिक समाधान: ' : 'Practical Solution: '}
                    </strong>
                    <span data-testid="gita-practical-solution">{session.selectedGitaVerse.practical_solution}</span>
                  </div>
                </div>

                {/* Audio Controls: Replay and Skip */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-amber-500/20">
                  <button
                    data-testid="gita-replay-btn"
                    onClick={handleReplayGita}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'पुनः सुनें 🔊' : 'Replay 🔊'}</span>
                  </button>

                  <button
                    data-testid="gita-skip-btn"
                    onClick={handleSkipGita}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <span>{language === 'hi' ? 'अगला: CBT →' : 'Skip to CBT →'}</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────
              PHASE 3: CBT MINI-FLOW
          ───────────────────────────────────────────────────────── */}
          {currentState === 'CBT' && (
            <motion.div
              data-testid="cbt-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-xl mx-auto"
            >
              {(() => {
                const script = wellnessStateMachine.getCbtScript();
                const step = wellnessStateMachine.getCbtCurrentStep();

                return (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-emerald-950/30 border border-emerald-500/40 space-y-3.5 shadow-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-xs">
                      <span className="font-mono font-bold text-emerald-300 uppercase">
                        {language === 'hi' ? 'चरण 3: CBT संज्ञानात्मक पुनर्गठन' : 'Phase 3: Cognitive Behavioral Therapy'}
                      </span>
                      <span data-testid="cbt-step-badge" className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                        Step {step} of 4
                      </span>
                    </div>

                    {/* Step 1: Identify Automatic Negative Thought */}
                    <div data-testid="cbt-automatic-thought" className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <div className="text-xs font-semibold text-emerald-400">
                        {language === 'hi' ? '1. नकारात्मक स्वचालित विचार:' : '1. Automatic Negative Thought:'}
                      </div>
                      <p className="text-sm text-slate-100">
                        {language === 'hi' ? script.step1_prompt_hi : script.step1_prompt_en}
                      </p>
                      {session.cbtResponses?.automatic_thought && (
                        <div className="text-xs text-emerald-200 italic pt-1 border-t border-slate-800">
                          &ldquo;{session.cbtResponses.automatic_thought}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Step 2: Name Cognitive Distortion */}
                    {step >= 2 && (
                      <div data-testid="cbt-distortion-name" className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                        <div className="text-xs font-semibold text-purple-400">
                          {language === 'hi' ? '2. संज्ञानात्मक भ्रम (Cognitive Distortion):' : '2. Cognitive Distortion:'}
                        </div>
                        <p className="text-sm text-purple-100 font-medium">
                          {language === 'hi' ? script.step2_name_hi : script.step2_name_en}
                        </p>
                        {step === 2 && (
                          <button
                            data-testid="cbt-distortion-ack-btn"
                            onClick={handleAcknowledgeDistortion}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                          >
                            {language === 'hi' ? 'विचार को चुनौती दें →' : 'Challenge Thought →'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 3: Challenge with Evidence Questions */}
                    {step >= 3 && (
                      <div data-testid="cbt-evidence-challenge" className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                        <div className="text-xs font-semibold text-cyan-400">
                          {language === 'hi' ? '3. साक्ष्य-आधारित प्रश्न:' : '3. Evidence-Based Challenge:'}
                        </div>
                        <ul className="text-xs sm:text-sm text-slate-200 space-y-1 list-disc list-inside">
                          {(language === 'hi' ? script.step3_challenge_questions_hi : script.step3_challenge_questions_en).map((q, qIdx) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                        {session.cbtResponses?.evidence_challenge_response && (
                          <div className="text-xs text-cyan-200 italic pt-1 border-t border-slate-800">
                            &ldquo;{session.cbtResponses.evidence_challenge_response}&rdquo;
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Balanced Replacement Thought & Action Step */}
                    {step >= 4 && (
                      <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                        <div className="text-xs font-semibold text-emerald-400">
                          {language === 'hi' ? '4. संतुलित विचार व कार्य-कदम:' : '4. Balanced Thought & Action Step:'}
                        </div>
                        <div data-testid="cbt-balanced-thought" className="text-sm text-emerald-100 font-medium">
                          {language === 'hi' ? script.step4_replacement_thought_hi : script.step4_replacement_thought_en}
                        </div>
                        <div data-testid="cbt-action-step" className="p-2 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-xs text-emerald-300">
                          <strong>{language === 'hi' ? 'एक छोटा कदम: ' : 'Small Action Step: '}</strong>
                          {language === 'hi' ? script.step4_action_step_hi : script.step4_action_step_en}
                        </div>
                      </div>
                    )}
                    {/* CBT Transition Controls */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-500/20">
                      <button
                        data-testid="cbt-skip-btn"
                        onClick={() => {
                          wellnessStateMachine.advanceFromCBTToTrataka();
                          startTratakaSession();
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        <span>{language === 'hi' ? 'अगला: त्राटक ध्यान →' : 'Next: Trataka Gazing →'}</span>
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────
              PHASE 4: TRATAKA GAZING (BEST 1 OF 5)
          ───────────────────────────────────────────────────────── */}
          {currentState === 'TRATAKA' && session.selectedTrataka && (
            <motion.div
              data-testid="trataka-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-xl mx-auto flex flex-col items-center text-center"
            >
              <div className="w-full p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/40 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span data-testid="trataka-variant-name" className="text-cyan-300 font-bold uppercase">
                    {session.selectedTrataka.variant.name_en}
                  </span>
                  <span data-testid="trataka-timer" className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    {formatTimer(tratakaSecondsRemaining)}
                  </span>
                </div>

                {/* Selection Rationale */}
                <p className="text-xs text-slate-300 italic bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-500/20">
                  {language === 'hi' ? session.selectedTrataka.rationale_hi : session.selectedTrataka.rationale_en}
                </p>

                {/* VISUAL FOCUS OBJECT (Candle, Bindu, Om, Moon, Mirror) */}
                <div data-testid="trataka-visual-container" className="relative my-4 w-full h-56 sm:h-64 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Mode 1: Candle Flame */}
                  {session.selectedTrataka.variant.visual_type === 'candle' && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-12 h-20 flex items-center justify-center">
                        <div className="absolute w-24 h-24 rounded-full bg-amber-500/20 blur-2xl animate-pulse" />
                        <div className="w-8 h-16 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 animate-bounce shadow-[0_0_35px_rgba(251,191,36,0.8)]" />
                        <div className="absolute w-3 h-8 rounded-full bg-white blur-[1px]" />
                      </div>
                      <div className="w-1.5 h-10 bg-slate-400 rounded-sm mt-1" />
                    </div>
                  )}

                  {/* Mode 2: Bindu Dot */}
                  {session.selectedTrataka.variant.visual_type === 'bindu' && (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-40 h-40 rounded-full border border-amber-500/20 animate-ping opacity-40" />
                      <div className="absolute w-24 h-24 rounded-full border border-amber-500/40" />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.9)]" />
                    </div>
                  )}

                  {/* Mode 3: Om Symbol */}
                  {session.selectedTrataka.variant.visual_type === 'om' && (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-48 h-48 rounded-full bg-purple-500/10 blur-2xl animate-pulse" />
                      <div className="text-7xl sm:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-purple-200 via-purple-300 to-teal-200 shadow-2xl">
                        ॐ
                      </div>
                    </div>
                  )}

                  {/* Mode 4: Moon & Stars */}
                  {session.selectedTrataka.variant.visual_type === 'moon' && (
                    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950">
                      <div className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <div className="absolute bottom-10 right-16 w-1 h-1 rounded-full bg-cyan-200 animate-pulse" />
                      <div className="absolute top-12 right-20 w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
                      <div className="w-20 h-20 rounded-full bg-slate-100 shadow-[0_0_40px_rgba(226,232,240,0.8)] relative overflow-hidden">
                        <div className="absolute -top-1 -right-2 w-16 h-16 rounded-full bg-slate-950/90" />
                      </div>
                    </div>
                  )}

                  {/* Mode 5: Mirror / Pratibimb */}
                  {session.selectedTrataka.variant.visual_type === 'mirror' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100 rounded-2xl opacity-75"
                      />
                      <div className="absolute inset-0 bg-cyan-950/20 border-2 border-cyan-400/40 rounded-2xl pointer-events-none" />
                      <div className="absolute w-24 h-24 rounded-full border border-cyan-400/60 pointer-events-none animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Voice Cue Display */}
                {currentTratakaCue && (
                  <p data-testid="trataka-voice-cue" className="text-xs font-medium text-cyan-200 animate-fadeIn">
                    {currentTratakaCue}
                  </p>
                )}

                {/* Controls */}
                <div className="flex items-center justify-between gap-3 w-full">
                  {!isTratakaRunning && (
                    <button
                      data-testid="trataka-start-btn"
                      onClick={startTratakaSession}
                      className="flex-1 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
                    >
                      {language === 'hi' ? 'ध्यान अभ्यास शुरू करें (प्रारंभ)' : 'Begin Gazing Practice'}
                    </button>
                  )}
                  <button
                    data-testid="trataka-skip-btn"
                    onClick={() => {
                      wellnessStateMachine.completeTratakaSession();
                      setIsTratakaRunning(false);
                      if (cameraStream) {
                        cameraStream.getTracks().forEach((t) => t.stop());
                        setCameraStream(null);
                      }
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-xs border border-cyan-500/30 transition-all shadow-md active:scale-95"
                  >
                    {language === 'hi' ? 'समापन व सारांश →' : 'Complete to Summary →'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────
              PHASE 4: SUMMARY & POST-SESSION MOOD CHECK
          ───────────────────────────────────────────────────────── */}
          {currentState === 'SUMMARY' && (
            <motion.div
              data-testid="summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-xl mx-auto"
            >
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/40 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400 flex items-center justify-center mx-auto text-teal-300">
                  <Heart className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-semibold text-slate-100">
                  {language === 'hi' ? 'सत्र समापन एवं अनुभव' : 'Session Reflection & Progress'}
                </h3>

                {session.selectedTrataka && (
                  <p data-testid="summary-closing-reflection" className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                    &ldquo;
                    {language === 'hi'
                      ? session.selectedTrataka.variant.closing_reflection_hi
                      : session.selectedTrataka.variant.closing_reflection_en}
                    &rdquo;
                  </p>
                )}

                {/* Post-Session Mood Rating (1 to 10) */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-teal-300">
                    {language === 'hi'
                      ? 'अब आप कैसा महसूस कर रहे हैं? (1 = अत्यंत शांत, 10 = अत्यधिक तनाव)'
                      : 'How is your distress level now? (1 = Deeply calm, 10 = High distress)'}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        data-testid={`distress-rating-btn-${num}`}
                        onClick={() => handleSubmitRating(num)}
                        className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                          session.postSessionMoodRating === num
                            ? 'bg-teal-400 text-slate-950 shadow-md scale-110'
                            : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {session.postSessionMoodRating !== null && (
                    <div className="text-xs text-emerald-400 font-medium pt-1">
                      {language === 'hi' ? 'प्रगति दर्ज की गई: ' : 'Progress Recorded: '}
                      Initial Intensity {session.initialIntensity} → Current {session.postSessionMoodRating}
                      {' '}(Improvement: {Math.max(0, session.initialIntensity - session.postSessionMoodRating)} pts)
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    data-testid="session-complete-btn"
                    onClick={() => {
                      wellnessStateMachine.reset();
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
                  >
                    {language === 'hi' ? 'सत्र पूरा करें एवं शरणस्थल पर लौटें' : 'Complete Session & Return'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* BOTTOM INPUT BAR (Speech-to-Text & Text Input) */}
        {currentState !== 'SUMMARY' && currentState !== 'GITA' && currentState !== 'TRATAKA' && (
          <footer data-testid="bottom-chat-footer" className="px-4 py-3 bg-slate-950/90 border-t border-slate-800/60 flex flex-col gap-2 shrink-0">
            {/* User-Visible Mic Error / Blocked Alert Banner */}
            {micErrorMessage && (
              <div data-testid="mic-error-banner" className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 shadow-md">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="truncate">{micErrorMessage}</span>
                </div>
                <button
                  data-testid="mic-retry-btn"
                  onClick={() => {
                    setMicErrorMessage(null);
                    handleToggleListening();
                  }}
                  className="ml-3 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 transition-all shadow"
                >
                  Retry Mic
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 w-full">
              {/* Mic Toggle Button with explicit status styling */}
              <button
                data-testid="mic-toggle-btn"
                onClick={handleToggleListening}
                className={`p-2.5 rounded-full transition-all shrink-0 ${
                  isListening
                    ? 'bg-rose-500/25 text-rose-400 border border-rose-500/70 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.45)]'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 active:scale-95'
                }`}
                title={isListening ? 'Stop listening' : 'Speak your reply (voice input)'}
              >
                {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input (Always accessible as fallback) */}
              <input
                data-testid="chat-text-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendUserReply();
                  }
                }}
                placeholder={
                  isListening
                    ? (language === 'hi' ? 'बोलें, हम सुन रहे हैं...' : 'Listening in real-time... speak your reply')
                    : language === 'hi'
                    ? 'अपनी भावनाएं बताएं या बोलकर कहें...'
                    : 'Share how you are feeling or reply by voice...'
                }
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/60"
              />

              {/* Send Button */}
              <button
                data-testid="chat-send-btn"
                onClick={() => handleSendUserReply()}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold transition-all shadow-md shrink-0 active:scale-95"
                title="Send reply"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}

        {/* PERSISTENT PAUSE / SKIP / BACK / RESET CONTROLS FOOTER */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <button
              data-testid="session-back-btn"
              onClick={() => wellnessStateMachine.back()}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              title="Go Back to Previous Phase"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>

            <span>•</span>

            <button
              data-testid="session-pause-btn"
              onClick={() => {
                const nextPause = !isPaused;
                setIsPaused(nextPause);
                if (nextPause) {
                  wellnessStateMachine.pause();
                  browserSpeechController.cancelSpeech();
                } else {
                  wellnessStateMachine.resume();
                }
              }}
              className="hover:text-slate-200 transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="session-skip-btn"
              onClick={() => wellnessStateMachine.skip()}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              title="Skip to Next Phase"
            >
              <span>Skip Phase</span>
              <SkipForward className="w-3 h-3" />
            </button>

            <span>•</span>

            <button
              data-testid="session-reset-btn"
              onClick={() => wellnessStateMachine.reset()}
              className="hover:text-rose-400 transition-colors"
              title="Reset Session"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedWellnessConversation;
