"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBestTherapeuticVoice } from "./voice-selector";

export type KaraokeStatus = "idle" | "speaking" | "paused";

export interface KaraokeWordToken {
  word: string;
  charStart: number;
  charEnd: number;
  wordIndex: number;
  sentenceIndex: number;
}

export interface KaraokeState {
  messageId: string;
  wordIndex: number;
  sentenceIndex: number;
  wordText: string;
  charRange: { start: number; end: number };
}

export interface UseKaraokeTTSOptions {
  onStart?: (messageId: string) => void;
  onEnd?: (messageId: string) => void;
  onError?: (err: unknown) => void;
  autoScroll?: boolean;
}

export interface UseKaraokeTTSReturn {
  status: KaraokeStatus;
  activeMessageId: string | null;
  activeKaraoke: KaraokeState | null;
  activeCharRange: { start: number; end: number } | null;
  activeWordRef: React.RefObject<HTMLSpanElement>;
  play: (messageId: string, text: string, locale?: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggle: (messageId: string, text: string, locale?: string) => void;
  isSpeakingMessage: (messageId: string) => boolean;
  isPausedMessage: (messageId: string) => boolean;
}

/**
 * Calculates fallback character length to next whitespace boundary for browsers
 * where event.charLength is undefined (e.g. older Chromium / Safari).
 */
export function calculateFallbackLength(text: string, charIndex: number): number {
  if (!text || charIndex >= text.length) return 0;
  const slice = text.slice(charIndex);
  const match = slice.match(/^\S+/);
  return match ? match[0].length : 1;
}

/**
 * Sanitizes raw Markdown, bracketed metadata, and diagram tags before passing
 * to SpeechSynthesisUtterance. Guarantees the voice engine speaks ONLY the
 * direct therapeutic content, preventing character offset drift.
 */
export function sanitizeTextForTTS(rawText: string, locale?: string): string {
  if (!rawText) return "";

  const hasDevanagari = /[\u0900-\u097F]/.test(rawText);
  const isEnglish = (locale && locale.startsWith("en")) || (!hasDevanagari && !locale);

  let processed = rawText
    // 1. Strictly strip [GITA_SHLOKA]...[/GITA_SHLOKA] from speech payload
    .replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/gi, "")
    // 2. Strip section headers e.g. **1. ...**, **SUMMARY...**, **RESUMEN...**
    .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|RESUMEN[^*]*|SYNTHÈSE[^*]*|ZUSAMMENFASSUNG[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/gim, "")
    // 3. Convert markdown images ![alt](url) -> alt (never read URLs)
    .replace(/!\[(.*?)\]\([^\)]*\)/g, "$1")
    // 4. Convert diagram & visual tags [diagram: label] -> label
    .replace(/\[(?:diagram|visual|flow|focus):\s*(.*?)\]/gi, "$1")
    // 5. Convert flowchart arrows to natural speech pauses
    .replace(/\s*(?:->|→|-->)\s*/g, ", then ")
    // 6. Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`.*?`/g, "")
    // 7. Strip Markdown hashes, bold, italics, strikethrough
    .replace(/#+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    // 8. Strip bullet prefixes and blockquotes
    .replace(/^[\s\t]*[•\-\*+]\s+/gm, "")
    .replace(/^>\s*/gm, "");

  if (isEnglish) {
    // If English speech, strip Devanagari characters so English voices do not choke
    processed = processed.replace(/[\u0900-\u097F]+/g, "");
  }

  return processed
    .replace(/[\[\]]/g, " ")
    .replace(/&amp;/g, " and ")
    .replace(/&/g, " and ")
    .replace(/[<>{}]/g, " ")
    // Remove emojis & non-verbal pictographs
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu, "")
    // Normalize spacing and clean punctuation
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

/**
 * Precomputes sentence and word character boundaries for accurate karaoke mapping.
 */
export function buildWordOffsetList(text: string) {
  const sentences = text.split(/(?<=[.!?।])\s+/).filter(Boolean);
  const words: Array<{
    word: string;
    sentenceIndex: number;
    wordIndex: number;
    startChar: number;
    endChar: number;
  }> = [];

  let charCursor = 0;
  let globalWordIdx = 0;

  sentences.forEach((sent, sentIdx) => {
    const sentWords = sent.trim().split(/\s+/).filter(Boolean);
    sentWords.forEach((w) => {
      const startChar = text.indexOf(w, charCursor);
      const endChar = startChar >= 0 ? startChar + w.length : charCursor + w.length;
      charCursor = Math.max(charCursor, endChar);
      words.push({
        word: w,
        sentenceIndex: sentIdx,
        wordIndex: globalWordIdx++,
        startChar: startChar >= 0 ? startChar : charCursor,
        endChar,
      });
    });
  });

  return { sentences, words };
}

/**
 * Custom Hook: useKaraokeTTS
 * Implements real-time word & sentence highlighting via SpeechSynthesisUtterance.onboundary,
 * viewport auto-scroll tracking, and cross-browser safety.
 */
export function useKaraokeTTS(options: UseKaraokeTTSOptions = {}): UseKaraokeTTSReturn {
  const { onStart, onEnd, onError, autoScroll = true } = options;

  const [status, setStatus] = useState<KaraokeStatus>("idle");
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [activeKaraoke, setActiveKaraoke] = useState<KaraokeState | null>(null);
  const [activeCharRange, setActiveCharRange] = useState<{ start: number; end: number } | null>(null);

  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const chromeKeepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop & Clean up on unmount or navigation
  const cleanup = useCallback(() => {
    isCancelledRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (chromeKeepAliveTimerRef.current) {
      clearInterval(chromeKeepAliveTimerRef.current);
      chromeKeepAliveTimerRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setStatus("idle");
    setActiveMessageId(null);
    setActiveKaraoke(null);
    setActiveCharRange(null);
    currentUtteranceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auto-scroll tracking: smoothly centers active spoken word in viewport
  useEffect(() => {
    if (!autoScroll || status !== "speaking" || !activeKaraoke) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const activeEl = activeWordRef.current || document.getElementById("active-karaoke-word");
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 40);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeKaraoke, status, autoScroll]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
        setStatus("paused");
      } catch (_) {}
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.resume();
        setStatus("speaking");
      } catch (_) {}
    }
  }, []);

  const play = useCallback(
    async (messageId: string, text: string, locale?: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // If already playing this message, ignore or toggle
      stop();
      isCancelledRef.current = false;

      const cleanText = sanitizeTextForTTS(text, locale);
      if (!cleanText) return;

      const { words } = buildWordOffsetList(cleanText);

      // Micro-pause to let Chrome engine reset after cancel()
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (isCancelledRef.current) return;

      const targetLocale = locale || (/[\u0900-\u097F]/.test(cleanText) ? "hi-IN" : "en-US");
      let matchedVoice: SpeechSynthesisVoice | null = null;
      try {
        matchedVoice = await getBestTherapeuticVoice(targetLocale);
      } catch (_) {}

      // Split into safe chunks (max 160 characters) to prevent Chromium long-speech freeze
      const rawSentences = cleanText.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [cleanText];
      const sentenceChunks: string[] = [];
      let currentChunk = "";
      for (const s of rawSentences) {
        const trimmed = s.trim();
        if (!trimmed) continue;
        if (currentChunk.length + trimmed.length < 160) {
          currentChunk += (currentChunk ? " " : "") + trimmed;
        } else {
          if (currentChunk) sentenceChunks.push(currentChunk);
          currentChunk = trimmed;
        }
      }
      if (currentChunk) sentenceChunks.push(currentChunk);
      if (sentenceChunks.length === 0) sentenceChunks.push(cleanText);

      let chunkIdx = 0;
      const chunkOffsets: number[] = [];
      let searchPos = 0;
      for (const chunk of sentenceChunks) {
        const idx = cleanText.indexOf(chunk, searchPos);
        if (idx >= 0) {
          chunkOffsets.push(idx);
          searchPos = idx + chunk.length;
        } else {
          chunkOffsets.push(searchPos);
          searchPos += chunk.length + 1;
        }
      }

      let isFinished = false;
      const finishPlayback = () => {
        if (isFinished) return;
        isFinished = true;
        if (chromeKeepAliveTimerRef.current) {
          clearInterval(chromeKeepAliveTimerRef.current);
          chromeKeepAliveTimerRef.current = null;
        }
        setStatus("idle");
        setActiveMessageId(null);
        setActiveKaraoke(null);
        setActiveCharRange(null);
        currentUtteranceRef.current = null;
        onEnd?.(messageId);
      };

      // Keep-alive timer for Chrome 15s suspension defeat
      chromeKeepAliveTimerRef.current = setInterval(() => {
        if (!isFinished && window.speechSynthesis.speaking) {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          } catch (_) {}
        }
      }, 2500);

      const speakNextChunk = () => {
        if (isFinished || isCancelledRef.current || !window.speechSynthesis) return;
        if (chunkIdx >= sentenceChunks.length) {
          finishPlayback();
          return;
        }

        const currentChunkOffset = chunkOffsets[chunkIdx] || 0;
        const chunkText = sentenceChunks[chunkIdx++];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = targetLocale;

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        currentUtteranceRef.current = utterance;

        // ─── Real-Time Word & Sentence Boundary Highlighting (Karaoke Engine) ───
        utterance.onboundary = (event: SpeechSynthesisEvent) => {
          if (event.name && event.name !== "word") return;
          const relativeCharIndex = event.charIndex || 0;
          const charLength = event.charLength || calculateFallbackLength(chunkText, relativeCharIndex);
          const absoluteCharIndex = currentChunkOffset + relativeCharIndex;

          const start = absoluteCharIndex;
          const end = absoluteCharIndex + charLength;
          setActiveCharRange({ start, end });

          // Find matching word token from precomputed list
          let bestWordIdx = words.findIndex(
            (w) => absoluteCharIndex >= w.startChar && absoluteCharIndex <= w.endChar
          );
          if (bestWordIdx < 0) {
            let minDiff = Infinity;
            words.forEach((w, idx) => {
              const diff = Math.abs(w.startChar - absoluteCharIndex);
              if (diff < minDiff) {
                minDiff = diff;
                bestWordIdx = idx;
              }
            });
          }

          const matchedWord = words[Math.max(0, bestWordIdx)];
          const wordText = matchedWord ? matchedWord.word : chunkText.slice(relativeCharIndex, relativeCharIndex + charLength);

          setActiveKaraoke({
            messageId,
            wordIndex: matchedWord ? matchedWord.wordIndex : bestWordIdx,
            sentenceIndex: matchedWord ? matchedWord.sentenceIndex : 0,
            wordText,
            charRange: { start, end },
          });
        };

        utterance.onstart = () => {
          if (chunkIdx === 1) {
            setStatus("speaking");
            setActiveMessageId(messageId);
            onStart?.(messageId);
          }
        };

        utterance.onend = () => {
          if (chunkIdx < sentenceChunks.length) {
            speakNextChunk();
          } else {
            finishPlayback();
          }
        };

        utterance.onerror = (err) => {
          console.warn("SpeechSynthesis utterance notice:", err);
          if (chunkIdx < sentenceChunks.length) {
            speakNextChunk();
          } else {
            finishPlayback();
            onError?.(err);
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (err) {
          console.error("SpeechSynthesis speak error:", err);
          finishPlayback();
          onError?.(err);
        }
      };

      speakNextChunk();
    },
    [stop, onStart, onEnd, onError]
  );

  const toggle = useCallback(
    (messageId: string, text: string, locale?: string) => {
      if (activeMessageId === messageId && status === "speaking") {
        pause();
      } else if (activeMessageId === messageId && status === "paused") {
        resume();
      } else {
        play(messageId, text, locale);
      }
    },
    [activeMessageId, status, pause, resume, play]
  );

  const isSpeakingMessage = useCallback(
    (messageId: string) => activeMessageId === messageId && status === "speaking",
    [activeMessageId, status]
  );

  const isPausedMessage = useCallback(
    (messageId: string) => activeMessageId === messageId && status === "paused",
    [activeMessageId, status]
  );

  return {
    status,
    activeMessageId,
    activeKaraoke,
    activeCharRange,
    activeWordRef,
    play,
    pause,
    resume,
    stop,
    toggle,
    isSpeakingMessage,
    isPausedMessage,
  };
}
