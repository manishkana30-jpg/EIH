"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Share2 as _Share2, Download as _Download } from "lucide-react";

import {
  healerClient,
  PsychologicalTelemetry,
  ChatHistoryItem,
  TrigunaAnalysis,
} from "@/lib/api/healer-client";
import { AutoUpdateBanner } from "./components/AutoUpdateBanner";
import { tokenizeForKaraoke } from "@/lib/audio/karaoke-tokenizer";
import { LeftNav } from "./components/LeftNav";
import { MobileNav } from "./components/MobileNav";
import { TelemetryPanel } from "./components/TelemetryPanel";
import { ChatArea, ChatMessage } from "./components/ChatArea";
import type { KaraokeState } from "./components/KaraokeMessage";

/* ─── Lazy-loaded modular components (only fetched on demand or below fold) ─── */
const EditorialGuide = dynamic(() => import("@/components/seo/EditorialGuide"), { ssr: false });
const SessionModals = dynamic(() => import("./components/SessionModals"), { ssr: false });
const TratakaModule = dynamic(
  () => import("./components/TratakaModule").then((m) => (m.TratakaModule ? { default: m.TratakaModule } : m)),
  { ssr: false }
);
const PwaInstallModal = dynamic(
  () => import("./components/PwaInstallModal").then((m) => (m.PwaInstallModal ? { default: m.PwaInstallModal } : m)),
  { ssr: false }
);

import { browserSpeechController } from "@/lib/audio/browser-speech";
import { VoiceAcousticState } from "@/lib/types/emotions";
import { getCleanAudioStream } from "@/lib/audio/audio-manager";
import {
  GLOBAL_LANGUAGE_CATALOG,
  LanguageItem,
  detectLocationAndLanguage,
  detectUserLocale,
  getStoredLanguage,
  saveLanguagePreference,
  detectUserSpokenLanguage,
  resolveSpokenLanguageWithGpsOverride,
  getLanguageByCode,
} from "@/lib/i18n/language-catalog";
import { saveLivePsychologyTelemetry, clearPsychologyTelemetry } from "@/lib/telemetry/psychology-store";
import { getConditionById } from "@/lib/knowledge/psychology-library-rag";
import { saveSessionMessage, resetActiveSessionId, purgeAllAppStorage } from "@/lib/db/indexed-db";
import {
  normalizeTratakaMode,
  detectTratakaModeFromText,
  getTratakaModeLabel as _getTratakaModeLabel,
} from "@/lib/knowledge/trataka-recommendations";
import {
  getFormattedTime,
  resolveActiveCbtReframe,
  playBase64AudioFallback,
} from "./utils/session-utils";

export default function SanctuarySessionPage() {
  // ─── Core State ───
  const [currentLanguage, setCurrentLanguage] = useState<LanguageItem>(GLOBAL_LANGUAGE_CATALOG[0]);
  const [userLocale, setUserLocale] = useState<string>("en-US");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const [activeKaraoke, setActiveKaraoke] = useState<KaraokeState | null>(null);

  // ─── Modal Visibility States ───
  const [isGitaModalOpen, setIsGitaModalOpen] = useState(false);
  const [isCBTModalOpen, setIsCBTModalOpen] = useState(false);
  const [isPranayamaOpen, setIsPranayamaOpen] = useState(false);
  const [isTratakaOpen, setIsTratakaOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [activeCrisisData, setActiveCrisisData] = useState<any>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileTelemetryOpen, setIsMobileTelemetryOpen] = useState(false);

  // ─── Live Clinical Telemetry ───
  const [telemetry, setTelemetry] = useState<PsychologicalTelemetry>({
    dominant_emotion: "Calmness",
    polyvagal_state: "Ventral Vagal (Safe)",
    cbt_distortion: "None",
    percentages: { Calmness: 74, Relief: 58, Anxiety: 18 },
    strategy: "Active reflective listening",
  });
  const [recommendedTrataka, setRecommendedTrataka] = useState<string>("bindu");
  const [activeTriguna, setActiveTriguna] = useState<TrigunaAnalysis | null>(null);
  const [activeVoiceState, setActiveVoiceState] = useState<VoiceAcousticState | null>(null);
  const activeVoiceStateRef = useRef<VoiceAcousticState | null>(null);
  useEffect(() => {
    activeVoiceStateRef.current = activeVoiceState;
  }, [activeVoiceState]);

  // Dynamically resolve active CBT Reframe for Trataka Neuroplastic Phase
  const activeCbtReframe = React.useMemo(() => {
    return resolveActiveCbtReframe(messages, telemetry);
  }, [messages, telemetry]);

  // ─── PWA Lifecycle & Installation Detection ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is running in standalone PWA window
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // ─── Zero-Retention Ephemeral Lifecycle & Exit Auto-Wipe ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Proactively purge any residual databases or cache items from older versions
    purgeAllAppStorage();

    const handleAppClose = () => {
      purgeAllAppStorage();
      clearPsychologyTelemetry();
    };

    window.addEventListener("beforeunload", handleAppClose);
    window.addEventListener("pagehide", handleAppClose);
    window.addEventListener("unload", handleAppClose);

    return () => {
      window.removeEventListener("beforeunload", handleAppClose);
      window.removeEventListener("pagehide", handleAppClose);
      window.removeEventListener("unload", handleAppClose);
    };
  }, []);

  // ─── Share Sanctuary Handler ───
  const handleShareApp = useCallback(async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.origin;
    const shareData = {
      title: "EIH - Emotional Intelligence & Healing Sanctuary",
      text: "Autonomous clinical neuropsychological companion & Ayurvedic healing sanctuary.",
      url: shareUrl,
    };

    if (navigator.share && typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: Copy URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      window.prompt("Copy Sanctuary URL:", shareUrl);
    }
  }, []);

  // ─── PWA Install Trigger ───
  const handleInstallClick = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice
        .then((choice: any) => {
          if (choice.outcome === "accepted") {
            setIsAppInstalled(true);
          }
          setDeferredPrompt(null);
        })
        .catch(() => {
          setIsPwaModalOpen(true);
        });
    } else {
      setIsPwaModalOpen(true);
    }
  }, [deferredPrompt]);

  // ─── Voice, Audio Playback & Echo Avoidance ───
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isEchoLocked, setIsEchoLocked] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  // ─── Refs for Thread Safety ───
  const activeStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleChatScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  }, []);

  const isSendingRef = useRef(false);
  const isPlayingAudioRef = useRef(false);
  const isEchoLockedRef = useRef(false);
  const isVoiceModeActiveRef = useRef(false);
  const startContinuousVoiceListeningRef = useRef<() => Promise<void>>();
  const isAiMutedRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSpeakingMessageIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const currentLanguageRef = useRef<LanguageItem>(currentLanguage);
  const userLocaleRef = useRef<string>("en-US");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    userLocaleRef.current = userLocale;
  }, [userLocale]);

  useEffect(() => {
    isAiMutedRef.current = isAiMuted;
    if (isAiMuted) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      browserSpeechController.cancelSpeech();
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      setActiveKaraoke(null);
      setSpeakingMessageId(null);
      activeSpeakingMessageIdRef.current = null;
    }
  }, [isAiMuted]);

  // ─── Geo-Location & Auto Language Detection ───
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialLocale = detectUserLocale();
    setUserLocale(initialLocale);

    healerClient.checkHealth().then((healthy) => setIsBackendHealthy(healthy));

    detectLocationAndLanguage().then((loc) => {
      const { code, isAuto } = getStoredLanguage();
      const targetCode = isAuto && loc.defaultLanguageCode ? loc.defaultLanguageCode : code;
      const matchedLang =
        GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === targetCode) || GLOBAL_LANGUAGE_CATALOG[0];

      setCurrentLanguage(matchedLang);
      setUserLocale(matchedLang.speechLocale);
      browserSpeechController.setLanguageLocale(matchedLang.speechLocale);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const focusId = params.get("focus") || params.get("condition");
        if (focusId) {
          const matchedCond = getConditionById(focusId);
          if (matchedCond) {
            setTelemetry({
              dominant_emotion: matchedCond.name,
              polyvagal_state: matchedCond.triguna_balance,
              cbt_distortion: matchedCond.cognitive_distortions[0] || "None",
              percentages: { [matchedCond.name]: 80, Relief: 45, Grounding: 70 },
              strategy: matchedCond.solutions.somatic_anchor,
            });
          }
        }
      }
    });

    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      browserSpeechController.stopRecognition();
      browserSpeechController.cancelSpeech();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, []);

  // ─── Chat Auto-Scroll on Message or Loading (Container Anchored) ───
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // ─── Auto-Scroll Tracking: Center Active Spoken Word (id="active-karaoke-word") ───
  useEffect(() => {
    if (!activeKaraoke || !chatContainerRef.current) return;
    const activeEl = activeWordRef.current || document.getElementById("active-karaoke-word");
    if (!activeEl) return;

    // Smoothly keep current active word centered in viewport without page jumping
    const container = chatContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const wordRect = activeEl.getBoundingClientRect();

    const wordCenter = wordRect.top + wordRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const diff = wordCenter - containerCenter;

    if (Math.abs(diff) > 25) {
      container.scrollBy({
        top: diff,
        behavior: "smooth",
      });
    }
  }, [activeKaraoke]);

  // ─── Voice Playback with Real-Time Karaoke & Echo Avoidance ───
  const playVoice = useCallback((text: string, audioBase64?: string, messageId?: string) => {
    if (isAiMutedRef.current) return;

    const detectedReplyLang = detectUserSpokenLanguage(text);
    const targetLocale =
      detectedReplyLang.speechLocale ||
      currentLanguageRef.current.speechLocale ||
      userLocaleRef.current ||
      "en-US";

    // Precompute words and sentences for 100% exact 1:1 boundary mapping
    const { words: cleanWordList, speechText } = tokenizeForKaraoke(text, targetLocale);
    const effectiveClean = speechText || text;
    if (!effectiveClean && !audioBase64) return;

    activeSpeakingMessageIdRef.current = messageId || null;
    setSpeakingMessageId(messageId || null);

    const handleWordBoundary = (charIndex: number, charLength: number, wordText?: string) => {
      if (charIndex < 0 || !activeSpeakingMessageIdRef.current) {
        setActiveKaraoke(null);
        return;
      }
      if (cleanWordList.length === 0) return;

      let activeWordIdx = cleanWordList.findIndex(
        (w) => charIndex >= w.startChar && charIndex <= w.endChar
      );
      if (activeWordIdx < 0) {
        let minD = Infinity;
        cleanWordList.forEach((w, idx) => {
          const d = Math.abs(w.startChar - charIndex);
          if (d < minD) {
            minD = d;
            activeWordIdx = idx;
          }
        });
      }
      activeWordIdx = Math.max(0, Math.min(cleanWordList.length - 1, activeWordIdx));
      const activeWord = cleanWordList[activeWordIdx];
      const activeSentenceIdx = activeWord ? activeWord.sentenceIndex : 0;

      setActiveKaraoke({
        messageId: activeSpeakingMessageIdRef.current,
        wordIndex: activeWord ? activeWord.wordIndex : activeWordIdx,
        sentenceIndex: activeSentenceIdx,
        wordText: wordText || activeWord?.word,
      });
    };

    browserSpeechController.setCallbacks({
      onWordBoundary: handleWordBoundary,
      onVoiceStateUpdate: (vs) => {
        setActiveVoiceState(vs);
      },
    });

    browserSpeechController.stopRecognition();
    setIsRecording(false);

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch (_) {}
      activeAudioRef.current = null;
    }

    isPlayingAudioRef.current = true;
    isEchoLockedRef.current = true;
    setIsPlayingAudio(true);
    setIsEchoLocked(true);

    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    const handleAudioEnd = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
      activeAudioRef.current = null;
      setActiveKaraoke(null);
      setSpeakingMessageId(null);
      activeSpeakingMessageIdRef.current = null;

      setTimeout(() => {
        isEchoLockedRef.current = false;
        setIsEchoLocked(false);
        if (isVoiceModeActiveRef.current) {
          startContinuousVoiceListeningRef.current?.();
        }
      }, 200);
    };

    // Watchdog timer: ensure audio locks are never permanently stuck
    const wordCount = effectiveClean.split(/\s+/).length;
    const maxSafetyMs = Math.max(6000, (wordCount / 2.0) * 1000 + 5000);
    safetyTimer = setTimeout(() => {
      if (isPlayingAudioRef.current) {
        console.warn("Audio playback safety watchdog fired: unlocking audio state.");
        handleAudioEnd();
      }
    }, maxSafetyMs);

    // 1. Primary Engine: SpeechSynthesisUtterance.onboundary for millisecond-exact word & sentence tracking
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      try {
        browserSpeechController.speakWithWebSpeechSynth(
          effectiveClean,
          undefined,
          handleAudioEnd,
          targetLocale
        );
        return;
      } catch (synthErr) {
        console.warn("SpeechSynthesisUtterance failed, fallback to direct audio/stream:", synthErr);
      }
    }

    // 2. Fallback: Direct base64 MP3 audio playback if SpeechSynthesis is unavailable
    if (audioBase64) {
      playBase64AudioFallback(
        audioBase64,
        effectiveClean,
        targetLocale,
        handleAudioEnd,
        handleWordBoundary,
        (audio) => {
          activeAudioRef.current = audio;
        }
      );
      return;
    }

    // 3. Fallback: Edge Neural Voice API
    browserSpeechController.speak(effectiveClean, undefined, handleAudioEnd, targetLocale);
  }, []);

  // ─── Send Message Handler ───
  const handleSendMessage = async (textToSend?: string, voiceState?: VoiceAcousticState) => {
    const messageText = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!messageText || isSendingRef.current) return;

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch (_) {}
      activeAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
    }
    browserSpeechController.cancelSpeech();
    setActiveKaraoke(null);
    setSpeakingMessageId(null);
    activeSpeakingMessageIdRef.current = null;

    setErrorMessage(null);
    isSendingRef.current = true;
    setIsLoading(true);
    setInputVal("");

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: messageText,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    saveSessionMessage("user", messageText);

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);

    const historyPayload: ChatHistoryItem[] = messagesRef.current
      .filter((m) => m.text.trim())
      .slice(-8)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    // Understand user spoken language and explicitly override GPS language for replying
    const spokenResolution = resolveSpokenLanguageWithGpsOverride(
      messageText,
      currentLanguageRef.current.code,
      userLocaleRef.current
    );

    // If the user spoke in a different language than current active language, adapt session language dynamically
    if (spokenResolution.isOverridden && spokenResolution.langCode !== currentLanguageRef.current.code) {
      const matchedLang =
        GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === spokenResolution.langCode) ||
        getLanguageByCode(spokenResolution.langCode);
      if (matchedLang) {
        setCurrentLanguage(matchedLang);
        setUserLocale(spokenResolution.speechLocale);
        currentLanguageRef.current = matchedLang;
        userLocaleRef.current = spokenResolution.speechLocale;
        browserSpeechController.setLanguageLocale(spokenResolution.speechLocale);
      }
    }

    try {
      const response = await healerClient.sendMessage(
        messageText,
        historyPayload,
        true,
        spokenResolution.langCode,
        spokenResolution.speechLocale,
        voiceState || activeVoiceStateRef.current || undefined
      );

      const detectedTrataka = detectTratakaModeFromText(response.reply);
      const canonicalTrataka =
        detectedTrataka || (response.recommended_trataka ? normalizeTratakaMode(response.recommended_trataka) : undefined);

      const aiMsg: ChatMessage = {
        id: `${Date.now()}-ai`,
        sender: "ai",
        text: response.reply,
        timestamp: getFormattedTime(),
        engine: response.engine,
        recommended_trataka: canonicalTrataka || response.recommended_trataka,
        cbt_distortion:
          response.telemetry?.cbt_distortion && response.telemetry.cbt_distortion !== "None"
            ? response.telemetry.cbt_distortion
            : undefined,
      };

      if (canonicalTrataka) {
        setRecommendedTrataka(canonicalTrataka);
      } else if (response.recommended_trataka) {
        setRecommendedTrataka(normalizeTratakaMode(response.recommended_trataka));
      }
      if (response.triguna_analysis) {
        setActiveTriguna(response.triguna_analysis);
      }
      if (response.is_crisis) {
        setActiveCrisisData(response.crisisData || null);
        setIsCrisisModalOpen(true);
      }

      setMessages((prev) => [...prev, aiMsg]);
      saveSessionMessage("assistant", response.reply);

      if (response.telemetry) {
        setTelemetry({
          ...response.telemetry,
          percentages: response.telemetry.percentages || {
            [response.telemetry.dominant_emotion || "Calmness"]: 75,
          },
        });
        saveLivePsychologyTelemetry(response.telemetry, messageText);
      }

      playVoice(response.reply, response.audio_base64, aiMsg.id);
    } catch (error) {
      console.error("Chat communication notice:", error);
      setErrorMessage("Unable to reach the clinical reasoning engine. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // ─── Continuous Voice Capture ───
  const startContinuousVoiceListening = async () => {
    startContinuousVoiceListeningRef.current = startContinuousVoiceListening;
    if (isPlayingAudioRef.current || isEchoLockedRef.current) return;

    try {
      const isMobile =
        typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      let stream: MediaStream | null = null;
      if (!isMobile) {
        try {
          stream = await getCleanAudioStream();
          activeStreamRef.current = stream;
          setRecordingStream(stream);
        } catch (_) {}
      }

      setIsRecording(true);
      isVoiceModeActiveRef.current = true;

      await browserSpeechController.startListening(
        (transcript, isFinal, voiceState) => {
          if (voiceState) {
            setActiveVoiceState(voiceState);
          }
          if (isFinal && transcript.trim().length > 0) {
            setInputVal("");
            if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            handleSendMessage(transcript.trim(), voiceState || activeVoiceStateRef.current || undefined);
          } else if (transcript.trim().length > 0) {
            setInputVal(transcript);
          }
        },
        (err) => {
          console.warn("Speech recognition notice:", err);
          if (err && (err.includes("not-allowed") || err.includes("permission"))) {
            setErrorMessage("Microphone access denied. Please allow microphone permission in your mobile browser settings.");
          }
        },
        stream || undefined
      );
    } catch (err) {
      console.error("Voice capture start error:", err);
      setIsRecording(false);
    }
  };

  const toggleRecording = async () => {
    if (isPlayingAudioRef.current || isEchoLockedRef.current) {
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
    }
    browserSpeechController.cancelSpeech();

    if (isRecording) {
      isVoiceModeActiveRef.current = false;
      setIsRecording(false);
      const pendingText = inputVal.trim();
      await browserSpeechController.finishCurrentUtterance();
      browserSpeechController.stopRecognition();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      setRecordingStream(null);
      if (pendingText.length > 0) {
        setInputVal("");
        handleSendMessage(pendingText);
      }
      return;
    }

    await startContinuousVoiceListening();
  };

  const handleLanguageChange = (lang: LanguageItem, isAuto: boolean) => {
    setCurrentLanguage(lang);
    setUserLocale(lang.speechLocale);
    saveLanguagePreference(lang.code, isAuto);
    browserSpeechController.setLanguageLocale(lang.speechLocale);
  };

  // ─── End Session Handler ───
  const handleEndSession = () => {
    // 1. Force instant termination of HTML audio
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch (_) {}
      activeAudioRef.current = null;
    }

    // 2. Force instant termination of SpeechSynthesis (browser native voices)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    // 3. Force controller to cancel all chunk generation and ongoing streaming
    browserSpeechController.cancelSpeech();
    browserSpeechController.stopRecognition();

    // 4. Release all active microphone streams and visualizers
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      activeStreamRef.current = null;
    }
    setRecordingStream(null);

    // 5. Instantly clear all session playback and recording states
    setIsRecording(false);
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
    isVoiceModeActiveRef.current = false;
    isEchoLockedRef.current = false;
    setIsEchoLocked(false);
    setActiveKaraoke(null);
    setSpeakingMessageId(null);
    activeSpeakingMessageIdRef.current = null;

    // 6. Reset all clinical dialogues and return to calm sanctuary baseline
    setMessages([]);
    setTelemetry({
      dominant_emotion: "Calmness",
      polyvagal_state: "Ventral Vagal (Safe)",
      cbt_distortion: "None",
      percentages: { Calmness: 100, Receptivity: 90 },
      strategy: "Sanctuary baseline active.",
      voice_state: "Stable vocal resonance",
    });
    setRecommendedTrataka("bindu");
    setActiveTriguna(null);
    setActiveVoiceState(null);
    setActiveCrisisData(null);
    setIsCrisisModalOpen(false);
    setIsCBTModalOpen(false);
    setIsPranayamaOpen(false);
    setIsTratakaOpen(false);
    setIsHistoryOpen(false);
    setInputVal("");
    setErrorMessage(null);

    // 7. Ephemeral session memory zero-retention wipe
    resetActiveSessionId();
    purgeAllAppStorage();
    clearPsychologyTelemetry();
  };

  const isSessionActive = isRecording || isPlayingAudio || isVoiceModeActiveRef.current;

  return (
    <div className="flex flex-col w-full bg-[#09090b] text-slate-100 font-sans select-none">
      <AutoUpdateBanner />

      {/* ─────────────────────────────────────────────────────────────
          1. INTERACTIVE SANCTUARY WORKSPACE (Full Viewport Stage)
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Interactive Mind Sanctuary Workspace"
        className="relative flex w-full h-[calc(100dvh-53px)] min-h-[620px] bg-slate-950 overflow-hidden shrink-0"
      >
        {/* SERENE CLINICAL SANCTUARY BACKGROUND */}
        {/* Mobile Navigation Drawer */}
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          isBackendHealthy={isBackendHealthy}
          onOpenCBT={() => setIsCBTModalOpen(true)}
          onOpenPranayama={() => setIsPranayamaOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenCrisis={() => setIsCrisisModalOpen(true)}
          onShareApp={handleShareApp}
          isCopied={isCopied}
          onInstallClick={handleInstallClick}
          isAppInstalled={isAppInstalled}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />

        {/* Desktop Left Navigation Column: renders LeftNav with overflow-y-auto, Share Sanctuary, Link Copied!, and Install App */}
        <LeftNav
          isBackendHealthy={isBackendHealthy}
          onOpenCBT={() => setIsCBTModalOpen(true)}
          onOpenPranayama={() => setIsPranayamaOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenCrisis={() => setIsCrisisModalOpen(true)}
          onShareApp={handleShareApp}
          isCopied={isCopied}
          onInstallClick={handleInstallClick}
          isAppInstalled={isAppInstalled}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />

        {/* Central Chat & Interaction Stage */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          isSessionActive={isSessionActive}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          isEchoLocked={isEchoLocked}
          recordingStream={recordingStream}
          activeVoiceState={activeVoiceState}
          speakingMessageId={speakingMessageId}
          activeKaraoke={activeKaraoke}
          activeWordRef={activeWordRef}
          recommendedTrataka={recommendedTrataka}
          telemetry={telemetry}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenMobileTelemetry={() => setIsMobileTelemetryOpen(true)}
          onOpenTrataka={(mode?: string) => {
            if (mode) setRecommendedTrataka(normalizeTratakaMode(mode));
            setIsTratakaOpen(true);
          }}
          onOpenPranayama={() => setIsPranayamaOpen(true)}
          onOpenCBT={() => setIsCBTModalOpen(true)}
          onOpenCrisis={() => setIsCrisisModalOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenGita={() => setIsGitaModalOpen(true)}
          onToggleRecording={toggleRecording}
          onEndSession={handleEndSession} // Pinned dock action: onClick={handleEndSession}
          onSendMessage={(text) => handleSendMessage(text)}
          onPlayVoice={(text, locale, msgId) => playVoice(text, undefined, msgId)}
          onPauseVoice={() => {
            if (activeAudioRef.current) activeAudioRef.current.pause();
            browserSpeechController.cancelSpeech();
            setIsPlayingAudio(false);
            isPlayingAudioRef.current = false;
          }}
          onResumeVoice={() => {}}
          onStopVoice={() => {
            if (activeAudioRef.current) {
              activeAudioRef.current.pause();
              activeAudioRef.current = null;
            }
            browserSpeechController.cancelSpeech();
            setIsPlayingAudio(false);
            isPlayingAudioRef.current = false;
            setActiveKaraoke(null);
            setSpeakingMessageId(null);
            activeSpeakingMessageIdRef.current = null;
          }}
          onToggleVoice={(msgId, text) => {
            if (speakingMessageId === msgId) {
              if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
              }
              browserSpeechController.cancelSpeech();
              setIsPlayingAudio(false);
              isPlayingAudioRef.current = false;
              setActiveKaraoke(null);
              setSpeakingMessageId(null);
              activeSpeakingMessageIdRef.current = null;
            } else {
              playVoice(text, undefined, msgId);
            }
          }}
          chatContainerRef={chatContainerRef} /* ref={chatContainerRef} */
          messagesEndRef={messagesEndRef}
          showScrollBottom={showScrollBottom}
          onChatScroll={handleChatScroll}
          inputVal={inputVal}
          setInputVal={setInputVal}
        />

        {/* Mobile Telemetry Slide-over Drawer (renders Voice State: and Listening word-by-word) */}
        <TelemetryPanel
          isMobile={true}
          isOpen={isMobileTelemetryOpen}
          onClose={() => setIsMobileTelemetryOpen(false)}
          isSessionActive={isSessionActive}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          onToggleRecording={toggleRecording}
          isAiMuted={isAiMuted}
          onToggleAiMuted={() => setIsAiMuted((prev) => !prev)}
          telemetry={telemetry}
          activeVoiceState={activeVoiceState}
          activeTriguna={activeTriguna}
        />

        {/* Desktop Right Column Telemetry (renders Voice State: and Listening word-by-word) */}
        <TelemetryPanel
          isMobile={false}
          isSessionActive={isSessionActive}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          onToggleRecording={toggleRecording}
          isAiMuted={isAiMuted}
          onToggleAiMuted={() => setIsAiMuted((prev) => !prev)}
          telemetry={telemetry}
          activeVoiceState={activeVoiceState}
          activeTriguna={activeTriguna}
        />

        {/* ─────────────────────────────────────────────────────────────
            CLINICAL MODALS (SESSION ORCHESTRATION & PROGRESSIVE MODULES)
        ───────────────────────────────────────────────────────────── */}
        <SessionModals
          isGitaModalOpen={isGitaModalOpen}
          onCloseGitaModal={() => setIsGitaModalOpen(false)}
          userLocale={userLocale}
          isCBTModalOpen={isCBTModalOpen}
          onCloseCBTModal={() => setIsCBTModalOpen(false)}
          isPranayamaOpen={isPranayamaOpen}
          onClosePranayama={() => setIsPranayamaOpen(false)}
          isHistoryOpen={isHistoryOpen}
          onCloseHistory={() => setIsHistoryOpen(false)}
          isCrisisModalOpen={isCrisisModalOpen}
          onCloseCrisisModal={() => {
            setIsCrisisModalOpen(false);
            setActiveCrisisData(null);
          }}
          activeCrisisData={activeCrisisData}
        />

        {/* 5-Stage Clinical Trataka Neuro-Cognitive Gazing Module */}
        <TratakaModule
          isOpen={isTratakaOpen}
          onClose={() => setIsTratakaOpen(false)}
          activeCbtReframe={activeCbtReframe}
          conditionName={telemetry.dominant_emotion}
          userLocale={userLocale}
          recommendedMode={recommendedTrataka as any}
        />

        {/* PWA Installation Guidance & Action Modal */}
        <PwaInstallModal
          isOpen={isPwaModalOpen}
          onClose={() => setIsPwaModalOpen(false)}
          deferredPrompt={deferredPrompt}
          isInstalled={isAppInstalled}
          onInstallSuccess={() => setIsAppInstalled(true)}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. TOPICAL EDITORIAL CONTENT ENGINE (<article>)
      ───────────────────────────────────────────────────────────── */}
      <EditorialGuide />
    </div>
  );
}
