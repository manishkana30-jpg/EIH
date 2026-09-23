"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Volume2,
  Play,
  Pause,
  Square,
  Brain,
  Eye,
  User,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { GitaShlokaCard, parseGitaShloka } from "@/components/gita/GitaShlokaCard";
import { isWordActive, parseTherapeuticStages } from "@/lib/audio/karaoke-tokenizer";

export interface KaraokeState {
  messageId: string;
  wordIndex: number;
  sentenceIndex: number;
  wordText?: string;
  charRange?: { start: number; end: number };
}

export interface KaraokeMessageProps {
  message: {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp?: string;
    engine?: string;
    locale?: string;
    recommended_trataka?: string;
    cbt_distortion?: string;
  };
  isSpeaking?: boolean;
  isPaused?: boolean;
  activeKaraoke?: KaraokeState | null;
  activeWordRef?: React.RefObject<HTMLSpanElement>;
  onPlay?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onToggle?: () => void;
  onLaunchTrataka?: (mode: string) => void;
  onOpenCBT?: () => void;
  onOpenGita?: () => void;
  isLastMessage?: boolean;
  recommendedTratakaLabel?: string;
  currentStage?: number;
  onConfirmStage1?: (messageId: string) => void;
  onAdvanceStage?: (messageId: string, nextStage: number) => void;
  onPlayStageVoice?: (messageId: string, stageNum: number, speechText: string) => void;
}

interface RenderCounter {
  wordIndex: number;
  sentenceIndex: number;
}

/**
 * Renders process flow arrows (e.g. Inhale (4s) → Hold (7s) → Exhale (8s))
 * as horizontal text pills with arrows instead of graphic diagrams.
 */
function renderProcessFlowLine(
  line: string,
  isSpeaking: boolean,
  activeKaraoke: KaraokeState | null | undefined,
  activeWordRef: React.RefObject<HTMLSpanElement> | undefined,
  counter: RenderCounter
) {
  // Matches "A -> B -> C" or "A → B → C" or "A --> B"
  const arrowRegex = /\s*(?:->|→|-->)\s*/;
  const steps = line.split(arrowRegex).filter(Boolean);

  if (steps.length <= 1) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 my-1.5 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
      {steps.map((step, idx) => {
        const stepWords = step.trim().split(/\s+/).filter(Boolean);
        const renderedWords = stepWords.map((word, wIdx) => {
          const thisWordIdx = counter.wordIndex++;
          const activeWord = isSpeaking && isWordActive(thisWordIdx, word, activeKaraoke);

          if (activeWord) {
            return (
              <span
                key={wIdx}
                id="active-karaoke-word"
                ref={activeWordRef}
                className="karaoke-word active"
              >
                {word}
              </span>
            );
          }
          return (
            <span key={wIdx} className="karaoke-word">
              {word}
            </span>
          );
        });

        return (
          <React.Fragment key={idx}>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono font-medium">
              {renderedWords}
            </span>
            {idx < steps.length - 1 && (
              <span className="text-emerald-400 font-bold text-xs">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Parses and renders inline badges like [🎯 Focus Anchor: ...] or [⚡ Autonomic State: ...]
 * or [diagram: ...] into semantic inline chips.
 */
function renderInlineBadgesAndText(
  text: string,
  isSpeaking: boolean,
  activeKaraoke: KaraokeState | null | undefined,
  activeWordRef: React.RefObject<HTMLSpanElement> | undefined,
  counter: RenderCounter
) {
  // Regex to detect [tag: text] or [🎯 ...] or [⚡ ...]
  const badgeRegex = /(\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus)[^\]]*\])/gi;
  const parts = text.split(badgeRegex);

  return parts.map((part, pIdx) => {
    // Check if this part is an inline focus badge
    const badgeMatch = part.match(/^\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus):?\s*([^\]]+)\]$/i);
    if (badgeMatch || (part.startsWith("[") && part.endsWith("]") && (part.includes("🎯") || part.includes("⚡")))) {
      const label = badgeMatch ? badgeMatch[1].trim() : part.slice(1, -1).trim();
      const isAutonomic = part.includes("⚡") || /vagal|autonomic/i.test(part);
      const isFocus = part.includes("🎯") || /focus|anchor|trataka/i.test(part);

      const colorClass = isAutonomic
        ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
        : isFocus
        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
        : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";

      const badgeWords = label.split(/\s+/).filter(Boolean);
      const renderedBadge = badgeWords.map((word, bIdx) => {
        const thisWordIdx = counter.wordIndex++;
        const activeWord = isSpeaking && isWordActive(thisWordIdx, word, activeKaraoke);

        if (activeWord) {
          return (
            <span
              key={bIdx}
              id="active-karaoke-word"
              ref={activeWordRef}
              className="karaoke-word active"
            >
              {word}
            </span>
          );
        }
        return (
          <span key={bIdx} className="karaoke-word">
            {word}
          </span>
        );
      });

      return (
        <span
          key={pIdx}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shadow-sm ${colorClass}`}
        >
          {part.includes("🎯") ? "🎯 " : part.includes("⚡") ? "⚡ " : "🏷️ "}
          <span>{renderedBadge}</span>
        </span>
      );
    }

    // Standard markdown segments: bold vs normal text
    const segments = part.split(/(\*\*[^*]+\*\*)/g);

    return (
      <React.Fragment key={pIdx}>
        {segments.map((seg, sIdx) => {
          const isBold = seg.startsWith("**") && seg.endsWith("**");
          const rawText = isBold ? seg.slice(2, -2) : seg;

          if (!isSpeaking) {
            if (isBold) {
              return (
                <strong key={sIdx} className="font-semibold text-slate-50">
                  {rawText}
                </strong>
              );
            }
            return <React.Fragment key={sIdx}>{rawText}</React.Fragment>;
          }

          // Active Karaoke Mode: Tokenize into words and whitespace
          const tokens = rawText.split(/(\s+)/);
          const renderedTokens = tokens.map((token, tIdx) => {
            if (/^\s+$/.test(token)) {
              return <React.Fragment key={tIdx}> </React.Fragment>;
            }
            if (!token) return null;

            const thisWordIdx = counter.wordIndex++;
            const thisSentenceIdx = counter.sentenceIndex;
            const isSentenceEnd = /[.!?।]\s*$/.test(token);
            if (isSentenceEnd) {
              counter.sentenceIndex++;
            }

            const activeWord = isWordActive(thisWordIdx, token, activeKaraoke);
            const activeSentence = activeKaraoke ? thisSentenceIdx === activeKaraoke.sentenceIndex : false;

            if (activeWord) {
              return (
                <span
                  key={tIdx}
                  id="active-karaoke-word"
                  ref={activeWordRef}
                  className="karaoke-word active"
                >
                  {token}
                </span>
              );
            }

            if (activeSentence) {
              return (
                <span
                  key={tIdx}
                  className="karaoke-word text-red-100 bg-red-500/15 font-medium"
                >
                  {token}
                </span>
              );
            }

            if (activeKaraoke && thisWordIdx < activeKaraoke.wordIndex) {
              return (
                <span key={tIdx} className="karaoke-word text-slate-100">
                  {token}
                </span>
              );
            }

            return (
              <span key={tIdx} className="karaoke-word text-slate-300/80">
                {token}
              </span>
            );
          });

          if (isBold) {
            return (
              <strong key={sIdx} className="font-semibold text-slate-50">
                {renderedTokens}
              </strong>
            );
          }

          return <React.Fragment key={sIdx}>{renderedTokens}</React.Fragment>;
        })}
      </React.Fragment>
    );
  });
}

/**
 * Formats Markdown text into clean lines with text-first visuals and real-time karaoke.
 */
function renderFormattedMarkdown(
  content: string,
  isSpeaking: boolean,
  activeKaraoke: KaraokeState | null | undefined,
  activeWordRef: React.RefObject<HTMLSpanElement> | undefined,
  counter: RenderCounter
) {
  // 1. Strip leading header line if present e.g. **1. ...** or **SUMMARY ...**
  // 2. Convert markdown images to clean text: ![alt](url) -> alt (never broken images)
  const cleaned = content
    .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|RESUMEN[^*]*|SYNTHÈSE[^*]*|ZUSAMMENFASSUNG[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/im, "")
    .replace(/!\[(.*?)\]\([^\)]*\)/g, "$1");

  const lines = cleaned.split("\n");

  return lines.map((line, lIdx) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <span key={lIdx} className="block h-2" />;

    // Check if line is a process flow (e.g. Inhale (4s) → Hold (7s) → Exhale (8s))
    if (/\s*(?:->|→|-->)\s*/.test(trimmedLine) && !trimmedLine.startsWith("**")) {
      const flowElement = renderProcessFlowLine(trimmedLine, isSpeaking, activeKaraoke, activeWordRef, counter);
      if (flowElement) {
        return (
          <span key={lIdx} className="block my-1">
            {flowElement}
          </span>
        );
      }
    }

    return (
      <span key={lIdx} className="block leading-relaxed">
        {renderInlineBadgesAndText(trimmedLine, isSpeaking, activeKaraoke, activeWordRef, counter)}
      </span>
    );
  });
}

/**
 * KaraokeMessage Component
 *
 * Implements:
 * 1. Real-time word and sentence boundary karaoke highlighting.
 * 2. Viewport auto-scroll DOM ref binding.
 * 3. Text-first inline visuals (badges, horizontal process pills, no broken images).
 * 4. Bhagavad Gita Shloka contemplation card isolation at the top.
 * 5. Explicit Play / Pause / Stop TTS control with state indicators.
 */
export const KaraokeMessage: React.FC<KaraokeMessageProps> = ({
  message,
  isSpeaking = false,
  isPaused = false,
  activeKaraoke,
  activeWordRef,
  onPlay,
  onPause,
  onResume,
  onStop,
  onToggle,
  onLaunchTrataka,
  onOpenCBT,
  onOpenGita,
  isLastMessage = false,
  recommendedTratakaLabel,
  currentStage,
  onConfirmStage1,
  onAdvanceStage,
  onPlayStageVoice,
}) => {
  const isAi = message.sender === "ai";

  // ─── AI Message State & Hooks (Must execute unconditionally in every render) ───
  const [localStage, setLocalStage] = useState<number>(currentStage || 1);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [selectedAdjustEmotion, setSelectedAdjustEmotion] = useState<string>("");

  useEffect(() => {
    if (currentStage && currentStage !== localStage) {
      setLocalStage(currentStage);
    }
  }, [currentStage, localStage]);

  const activeStage = currentStage || localStage;

  // Parse into structured 4-stage therapeutic protocol
  const parsedStages = useMemo(
    () => (isAi ? parseTherapeuticStages(message.text, message.locale) : { isStructured: false, stages: [], defaultSpeechText: "" }),
    [isAi, message.text, message.locale]
  );
  const isStructured = parsedStages.isStructured && parsedStages.stages.length >= 3;

  // ─── User Message View ───
  if (!isAi) {
    return (
      <div className="flex flex-col items-end w-full group">
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium">
          <span className="text-emerald-400/90">You</span>
          <div className="w-4 h-4 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[9px] text-emerald-300">
            <User className="w-2.5 h-2.5" />
          </div>
        </div>
        <div className="max-w-[88%] md:max-w-xl p-4 rounded-2xl text-sm leading-relaxed bg-gradient-to-br from-emerald-900/50 to-teal-950/60 border border-emerald-500/30 text-emerald-50 rounded-tr-sm shadow-[0_4px_20px_rgba(16,185,129,0.12)] backdrop-blur-sm">
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        {message.timestamp && (
          <span className="text-[10px] text-slate-500 mt-1 px-1" suppressHydrationWarning>
            {message.timestamp}
          </span>
        )}
      </div>
    );
  }

  // Fallback parsing for legacy/non-structured messages
  const gitaParsed = parseGitaShloka(message.text);
  const therapeuticBody = gitaParsed.isGita ? gitaParsed.remainingText : message.text;
  const parts = therapeuticBody.split(
    /(?=\*\*(?:[1234]\.\s+|SUMMARY|आपकी स्थिति|स्थिति व कष्ट|RESUMEN|SYNTHÈSE|ZUSAMMENFASSUNG|TRI-PILLAR|एकीकृत))/i
  );
  const counter: RenderCounter = { wordIndex: 0, sentenceIndex: 0 };

  const isHindi = /[\u0900-\u097F]/.test(message.text) || (message.locale ? message.locale.startsWith("hi") : false);
  const isSpanish = (message.locale ? message.locale.startsWith("es") : false) || /\b(sabiduría|verso)\b/i.test(message.text);

  const stage1 = parsedStages.stages.find(s => s.stage === 1);
  const stage2 = parsedStages.stages.find(s => s.stage === 2);
  const stage3 = parsedStages.stages.find(s => s.stage === 3);
  const stage4 = parsedStages.stages.find(s => s.stage === 4);

  const handleConfirmS1 = () => {
    setLocalStage(2);
    if (onConfirmStage1) {
      onConfirmStage1(message.id);
    } else if (onAdvanceStage) {
      onAdvanceStage(message.id, 2);
    }
    if (onPlayStageVoice && stage2?.speechText) {
      onPlayStageVoice(message.id, 2, stage2.speechText);
    }
  };

  const handleAdvanceTo = (nextStage: number) => {
    setLocalStage(nextStage);
    if (onAdvanceStage) {
      onAdvanceStage(message.id, nextStage);
    }
    const targetStageData = parsedStages.stages.find(s => s.stage === nextStage);
    if (onPlayStageVoice && targetStageData?.speechText) {
      onPlayStageVoice(message.id, nextStage, targetStageData.speechText);
    }
  };

  return (
    <div className="flex flex-col items-start w-full group">
      {/* Header Attribution */}
      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium">
        <div className="w-4 h-4 rounded-full bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-[10px]">
          🌿
        </div>
        <span className="text-teal-300 font-semibold">Sanctuary Healer</span>
        {isStructured && (
          <span className="text-[10px] text-slate-400 font-mono ml-2">
            Step {Math.min(activeStage, 4)} of 4
          </span>
        )}
      </div>

      {/* Sequential Card Container */}
      <div className="max-w-[92%] md:max-w-xl w-full p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 border border-slate-800/80 text-slate-100 rounded-tl-sm shadow-xl backdrop-blur-md space-y-3.5">
        
        {isStructured ? (
          <>
            {/* Step Progression Bar */}
            <div className="flex items-center justify-between gap-1 pb-2 border-b border-white/5 text-[10px] sm:text-[11px] font-mono select-none">
              {[
                { num: 1, label: isHindi ? "1. स्थिति" : "1. Emotion" },
                { num: 2, label: isHindi ? "2. गीता" : "2. Gita" },
                { num: 3, label: isHindi ? "3. CBT" : "3. CBT" },
                { num: 4, label: isHindi ? "4. त्राटक" : "4. Tratak" },
              ].map((step, idx) => {
                const isPassed = activeStage > step.num;
                const isCurrent = activeStage === step.num;
                return (
                  <React.Fragment key={step.num}>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                        isPassed
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : isCurrent
                          ? "bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse"
                          : "bg-slate-900/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <span>{step.num}</span>
                      )}
                      <span className="hidden xs:inline font-medium">{step.label}</span>
                    </div>
                    {idx < 3 && (
                      <span className={`text-[10px] ${activeStage > step.num ? "text-emerald-500" : "text-slate-700"}`}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ─── CARD 1: SANCTUARY EMOTION UNDERSTANDING (ALWAYS DISPLAYED) ─── */}
            {stage1 && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-purple-500/35 bg-gradient-to-br from-purple-950/40 via-purple-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(168,85,247,0.08)] backdrop-blur-md space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-purple-500/15">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border text-purple-300 bg-purple-500/15 border-purple-500/30">
                    {stage1.badge}
                  </span>
                  {activeStage > 1 ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isHindi ? "अनुमोदित" : "Confirmed by you"}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-purple-300/80 animate-pulse">
                      ● {isHindi ? "आपकी सहमति प्रतीक्षित..." : "Awaiting your confirmation..."}
                    </span>
                  )}
                </div>

                {/* Emotion Identification & Assessment */}
                <div className="space-y-1.5 text-slate-100 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <span className="text-slate-400 text-xs">
                        {isHindi ? "पहचाना गया मनोभाव:" : "Understood Emotion:"}{" "}
                      </span>
                      <strong className="text-purple-200 text-sm font-semibold">
                        {selectedAdjustEmotion || stage1.meta.emotionName || stage1.title}
                      </strong>
                    </div>
                  </div>

                  {stage1.meta.severity && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-purple-400 font-bold">•</span>
                      <span className="text-slate-300">
                        <strong className="text-slate-400 font-medium">
                          {isHindi ? "पीड़ा व तंत्रिका तंत्र:" : "Severity & Autonomic State:"}
                        </strong>{" "}
                        {stage1.meta.severity} {stage1.meta.autonomicState ? `| ${stage1.meta.autonomicState}` : ""}
                      </span>
                    </div>
                  )}

                  {stage1.meta.bodilyBurden && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-purple-400 font-bold">•</span>
                      <span className="text-slate-300">
                        <strong className="text-slate-400 font-medium">
                          {isHindi ? "शारीरिक संवेदनाएं:" : "Bodily Sensations:"}
                        </strong>{" "}
                        {stage1.meta.bodilyBurden}
                      </span>
                    </div>
                  )}

                  {stage1.meta.summary && (
                    <p className="mt-1 text-slate-200 italic bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20 leading-relaxed text-xs sm:text-sm">
                      &ldquo;{stage1.meta.summary}&rdquo;
                    </p>
                  )}
                </div>

                {/* Step 1 Interactive Confirmation Prompt */}
                {activeStage === 1 && (
                  <div className="pt-2 border-t border-purple-500/20 space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-purple-200 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{stage1.meta.confirmationPrompt || (isHindi ? "क्या आप इस समय इसी मानसिक स्थिति का अनुभव कर रहे हैं?" : "Is this what you're experiencing right now?")}</span>
                    </p>

                    {!isAdjusting ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmS1}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isHindi ? "हाँ, यह सही है (अगला: गीता दर्शन)" : "Yes, that's right (Next: Gita Wisdom)"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAdjusting(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                        >
                          <span>{isHindi ? "नहीं, थोड़ा अलग है" : "Not quite / Adjust"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                        <span className="text-[11px] text-slate-400">
                          {isHindi ? "कृपया अपनी मुख्य भावना चुनें:" : "Choose the feeling that best matches:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Anxiety / Worry",
                            "Depression / Sadness",
                            "Overwhelm / Burnout",
                            "Acute Panic",
                            "Anger / Betrayal",
                            "Toxic Shame / Guilt",
                            "Decision Paralysis",
                          ].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setSelectedAdjustEmotion(em)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                selectedAdjustEmotion === em
                                  ? "bg-purple-500 text-slate-950 font-bold border-purple-400 shadow-md"
                                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleConfirmS1}
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 active:scale-95 transition-all"
                          >
                            {isHindi ? "संशोधन स्वीकारें →" : "Confirm Emotion →"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAdjusting(false)}
                            className="text-xs text-slate-400 hover:text-slate-200 underline"
                          >
                            {isHindi ? "रद्द करें" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── CARD 2: BHAGAVAD GITA CARD & GYAN (REVEALED IN STEP 2) ─── */}
            {activeStage >= 2 && stage2 && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-amber-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(245,158,11,0.08)] backdrop-blur-md space-y-2.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-amber-500/15">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border text-amber-400 bg-amber-500/15 border-amber-500/30">
                    {stage2.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    {onOpenGita && (
                      <button
                        type="button"
                        onClick={onOpenGita}
                        className="text-[10px] font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Explore Shloka →
                      </button>
                    )}
                  </div>
                </div>

                {/* Shloka in plain text format inside Shreemadh Bhagwatgita Aatam Darshan */}
                {stage2.meta.shlokaBlock && (
                  <div data-tts-silent="true" data-tts-skip="true" className="tts-skip select-text my-2">
                    <GitaShlokaCard shlokaContent={stage2.meta.shlokaBlock} variant="inline" />
                  </div>
                )}

                {/* Gita Spiritual Wisdom & Actionable Duty */}
                <div className="space-y-1.5 text-slate-100 text-xs sm:text-sm">
                  {stage2.meta.meaning && (
                    <div className="text-slate-200 leading-relaxed">
                      <strong className="text-amber-300">
                        {isHindi ? "भगवान श्रीकृष्ण का पावन संदेश:" : "Divine Teaching:"}{" "}
                      </strong>
                      {stage2.meta.meaning}
                    </div>
                  )}
                  {stage2.meta.reflection && (
                    <div className="text-slate-300 leading-relaxed">
                      <strong className="text-amber-400/90">
                        {isHindi ? "जीवन में उतारें:" : "Spiritual Reflection:"}{" "}
                      </strong>
                      {stage2.meta.reflection}
                    </div>
                  )}
                  {stage2.meta.duty && (
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/25 text-amber-200 leading-relaxed">
                      <strong>{isHindi ? "वर्तमान कर्तव्य (निष्काम कर्म):" : "Your Duty Right Now:"} </strong>
                      {stage2.meta.duty}
                    </div>
                  )}
                </div>

                {/* Stage 2 Advance Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/15">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPlayStageVoice) {
                        onPlayStageVoice(message.id, 2, stage2.speechText);
                      } else if (onPlay) {
                        onPlay();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? "श्लोक एवं गीता उपदेश सुनें 🔊" : "Listen Shloka & Wisdom 🔊"}</span>
                  </button>

                  {activeStage === 2 && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceTo(3)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
                    >
                      <span>{isHindi ? "अगला: CBT व प्राणायाम →" : "Next: CBT & Breathwork →"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── CARD 3: CLINICAL CBT & SOMATIC BREATHWORK (REVEALED IN STEP 3) ─── */}
            {activeStage >= 3 && stage3 && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/40 via-emerald-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(16,185,129,0.08)] backdrop-blur-md space-y-2.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-emerald-500/15">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/15 border-emerald-500/30">
                    {stage3.badge}
                  </span>
                  {onOpenCBT && (
                    <button
                      type="button"
                      onClick={onOpenCBT}
                      className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Interactive CBT →
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-slate-100 text-xs sm:text-sm">
                  {renderFormattedMarkdown(stage3.displayContent, isSpeaking, activeKaraoke, activeWordRef, counter)}
                </div>

                {/* Stage 3 Advance Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/15">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPlayStageVoice) {
                        onPlayStageVoice(message.id, 3, stage3.speechText);
                      } else if (onPlay) {
                        onPlay();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? "CBT तकनीक सुनें 🔊" : "Listen CBT Guidance 🔊"}</span>
                  </button>

                  {activeStage === 3 && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceTo(4)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
                    >
                      <span>{isHindi ? "अगला: त्राटक ध्यान विधि →" : "Next: Tratak Gazing →"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── CARD 4: TRATAK NEURO-OCULAR GAZING PROTOCOL (REVEALED IN STEP 4) ─── */}
            {activeStage >= 4 && stage4 && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 via-cyan-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(6,182,212,0.08)] backdrop-blur-md space-y-2.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-cyan-500/15">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border text-cyan-400 bg-cyan-500/15 border-cyan-500/30">
                    {stage4.badge}
                  </span>
                  {onLaunchTrataka && (
                    <button
                      type="button"
                      onClick={() => onLaunchTrataka(message.recommended_trataka || "bindu")}
                      className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Launch Gazing →
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-slate-100 text-xs sm:text-sm">
                  {renderFormattedMarkdown(stage4.displayContent, isSpeaking, activeKaraoke, activeWordRef, counter)}
                </div>

                {/* Launch Trataka Button */}
                <div className="pt-2 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onPlayStageVoice) {
                        onPlayStageVoice(message.id, 4, stage4.speechText);
                      } else if (onPlay) {
                        onPlay();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? "त्राटक विधि सुनें 🔊" : "Listen Tratak Guidance 🔊"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchTrataka?.(message.recommended_trataka || "bindu")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer ml-auto"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isHindi ? "त्राटक ध्यान सत्र शुरू करें 👁️" : "Launch Gazing Session 👁️"}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Legacy / Unstructured single message rendering */
          <div className="space-y-3 text-slate-100 text-xs sm:text-sm">
            {parts.map((part, pIdx) => {
              const isLastCard = pIdx === parts.length - 1;
              const isSynergy = isLastCard || (!isLastCard && (part.startsWith("**4.") || part.toLowerCase().includes("synerg")));
              const isDiagnostic = !isLastCard && (part.startsWith("**SUMMARY") || part.includes("स्थिति व कष्ट"));
              const isGitaCard = !isLastCard && !isDiagnostic && !isSynergy && (part.startsWith("**1.") || part.includes("गीता"));

              let badgeLabel = "";
              if (isSynergy) {
                badgeLabel = isHindi
                  ? "✨ सारांश: एकीकृत त्रिवेणी उपचार योजना"
                  : isSpanish
                  ? "✨ Resumen: Resolución Sinérgica Tri-Pilar"
                  : "✨ Summary: Tri-Pillar Synergistic Resolution";
              }

              return (
                <div key={pIdx} className="space-y-1.5">
                  {badgeLabel && (
                    <span className="text-[10px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border text-teal-300 bg-teal-500/15 border-teal-500/30">
                      {badgeLabel}
                    </span>
                  )}
                  {!isLastCard && isGitaCard && gitaParsed.isGita && gitaParsed.shlokaBlock && (
                    <div data-tts-silent="true" data-tts-skip="true" className="tts-skip select-text my-2">
                      <GitaShlokaCard shlokaContent={gitaParsed.shlokaBlock} variant="inline" />
                    </div>
                  )}
                  {renderFormattedMarkdown(part, isSpeaking, activeKaraoke, activeWordRef, counter)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Interactive Tri-Solution Options Bar (🕉️ Gita + 🧠 CBT + 👁️ Tratak) */}
      {isLastMessage && !isStructured && (
        <div className="mt-2.5 max-w-[88%] md:max-w-xl w-full p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/90 shadow-lg backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400">⚡</span>
              <span>Tri-Solution Options (त्रिवेणी समाधान)</span>
            </span>
            <span className="text-[10px] text-teal-400/90 font-mono">3 Interactive Paths</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Gita Wisdom */}
            <button
              type="button"
              onClick={onOpenGita}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-semibold transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] active:scale-[0.98] cursor-pointer"
              title="Open Bhagavad Gita Contemplation"
            >
              <span>🕉️</span>
              <span>Gita Wisdom</span>
            </button>

            {/* 2. CBT Reframe */}
            <button
              type="button"
              onClick={onOpenCBT}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-[0.98] cursor-pointer"
              title="Open Interactive CBT Reframe"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <span>CBT Reframe</span>
            </button>

            {/* 3. Launch Tratak */}
            <button
              type="button"
              onClick={() => onLaunchTrataka?.(message.recommended_trataka || "bindu")}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] active:scale-[0.98] cursor-pointer"
              title="Launch Prescribed Trataka Gazing"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{recommendedTratakaLabel || "Launch Tratak"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Explicit Play / Pause / Stop TTS Controls Bar with Clear Indicators */}
      <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
        {message.timestamp && (
          <span className="text-[10px] text-slate-500" suppressHydrationWarning>
            {message.timestamp}
          </span>
        )}
        {message.engine && (
          <span className="text-[9px] text-emerald-400/70 font-mono">[{message.engine}]</span>
        )}

        {/* TTS State Controls */}
        {isSpeaking ? (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPause || onToggle}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.3)] hover:bg-emerald-500/30 transition-all"
              title="Pause voice playback"
            >
              <Pause className="w-3 h-3 text-emerald-400" />
              <span>Speaking...</span>
            </button>
            <button
              type="button"
              onClick={onStop}
              className="p-1 rounded-full text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-700/60 transition-all"
              title="Stop playback"
              aria-label="Stop audio"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>
          </div>
        ) : isPaused ? (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResume || onToggle}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)] hover:bg-amber-500/30 transition-all"
              title="Resume voice playback"
            >
              <Play className="w-3 h-3 text-amber-400 fill-current" />
              <span>Paused</span>
            </button>
            <button
              type="button"
              onClick={onStop}
              className="p-1 rounded-full text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-700/60 transition-all"
              title="Stop playback"
              aria-label="Stop audio"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPlay || onToggle}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all"
            title="Listen aloud with real-time word highlighting"
          >
            <Volume2 className="w-3 h-3 text-slate-400" />
            <span>Listen</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default KaraokeMessage;
