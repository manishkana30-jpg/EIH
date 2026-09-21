"use client";

import React, { useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  Brain,
  Eye,
  User,
} from "lucide-react";
import { GitaShlokaCard, parseGitaShloka } from "./GitaShlokaCard";
import { isWordActive, cleanWordForMatch } from "@/lib/audio/karaoke-tokenizer";

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
  isLastMessage?: boolean;
  recommendedTratakaLabel?: string;
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
  isLastMessage = false,
  recommendedTratakaLabel,
}) => {
  const isAi = message.sender === "ai";

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

  // ─── AI Message View ───
  // 1. Separate Gita Shloka from therapeutic body text
  const gitaParsed = parseGitaShloka(message.text);
  const therapeuticBody = gitaParsed.isGita ? gitaParsed.remainingText : message.text;

  // Split into therapeutic sections if formatted with section headers
  const parts = therapeuticBody.split(
    /(?=\*\*(?:[1234]\.\s+|SUMMARY|आपकी स्थिति|स्थिति व कष्ट|RESUMEN|SYNTHÈSE|ZUSAMMENFASSUNG|TRI-PILLAR|एकीकृत))/i
  );
  const counter: RenderCounter = { wordIndex: 0, sentenceIndex: 0 };

  return (
    <div className="flex flex-col items-start w-full group">
      {/* Header Attribution */}
      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium">
        <div className="w-4 h-4 rounded-full bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-[10px]">
          🌿
        </div>
        <span className="text-teal-300 font-semibold">Sanctuary Healer</span>
      </div>

      {/* Therapeutic / Educational Content with Real-Time Karaoke & Inline Plain-Text Shloka */}
      <div className="max-w-[88%] md:max-w-xl p-4 rounded-2xl text-sm leading-relaxed bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/95 border border-slate-800/80 text-slate-100 rounded-tl-sm shadow-xl backdrop-blur-md">
        {parts.length <= 1 ? (
          <div className="space-y-1.5 text-slate-100 text-xs sm:text-sm">
            {gitaParsed.isGita && gitaParsed.shlokaBlock && (
              <div data-tts-silent="true" data-tts-skip="true" className="tts-skip select-text my-2">
                <GitaShlokaCard shlokaContent={gitaParsed.shlokaBlock} variant="inline" />
              </div>
            )}
            {renderFormattedMarkdown(therapeuticBody, isSpeaking, activeKaraoke, activeWordRef, counter)}
          </div>
        ) : (
          <div className="space-y-3.5 my-1">
            {parts.map((part, idx) => {
              const trimmed = part.trim();
              if (!trimmed) return null;

              const isLastCard = idx === parts.length - 1;

              const isDiagnostic =
                !isLastCard &&
                (trimmed.startsWith("**SUMMARY") ||
                  trimmed.toLowerCase().includes("suffering assessment") ||
                  trimmed.includes("स्थिति व कष्ट") ||
                  trimmed.includes("मानसिक पीड़ा") ||
                  trimmed.toLowerCase().includes("diagnostic"));

              const isSynergy =
                isLastCard ||
                (!isDiagnostic &&
                  (trimmed.startsWith("**4.") ||
                    trimmed.toLowerCase().includes("synerg") ||
                    trimmed.toLowerCase().includes("combination") ||
                    trimmed.includes("त्रिवेणी") ||
                    trimmed.includes("समाधान") ||
                    trimmed.toLowerCase().includes("summary")));

              const isTratak =
                !isDiagnostic &&
                !isSynergy &&
                !isLastCard &&
                (trimmed.startsWith("**3.") ||
                  trimmed.toLowerCase().includes("tratak") ||
                  trimmed.includes("त्राटक"));

              const isClinical =
                !isDiagnostic &&
                !isSynergy &&
                !isTratak &&
                !isLastCard &&
                (trimmed.startsWith("**2.") ||
                  trimmed.toLowerCase().includes("clinical") ||
                  trimmed.includes("कॉग्निटिव") ||
                  trimmed.toLowerCase().includes("cbt"));

              const isGita =
                !isDiagnostic &&
                !isSynergy &&
                !isTratak &&
                !isClinical &&
                !isLastCard &&
                (trimmed.startsWith("**1.") ||
                  trimmed.toLowerCase().includes("bhagavad gita") ||
                  (trimmed.includes("गीता") && !trimmed.includes("त्रिवेणी") && !trimmed.startsWith("**4.")));

              const borderClass = isDiagnostic
                ? "border-purple-500/35 bg-gradient-to-br from-purple-950/40 via-purple-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(168,85,247,0.08)]"
                : (isSynergy || isLastCard)
                ? "border-fuchsia-500/35 bg-gradient-to-br from-fuchsia-950/40 via-fuchsia-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(217,70,239,0.08)]"
                : isGita
                ? "border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-amber-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                : isClinical
                ? "border-emerald-500/35 bg-gradient-to-br from-emerald-950/40 via-emerald-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(160,185,129,0.08)]"
                : isTratak
                ? "border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 via-cyan-950/20 to-slate-900/60 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                : "border-slate-800/80 bg-slate-900/60";

              const isHindi = /[\u0900-\u097F]/.test(trimmed) || (message.locale ? message.locale.startsWith("hi") : false);
              const isSpanish = /\b(sabiduría|verso|capítulo|mente|atención|respiración|resumen)\b/i.test(trimmed) || (message.locale ? message.locale.startsWith("es") : false);
              const isFrench = /\b(sagesse|verset|chapitre|respiration|pensée|synthèse)\b/i.test(trimmed) || (message.locale ? message.locale.startsWith("fr") : false);
              const isGerman = /\b(weisheit|kapitel|nervensystem|atmung|gedanken|zusammenfassung)\b/i.test(trimmed) || (message.locale ? message.locale.startsWith("de") : false);

              const badgeText = isDiagnostic
                ? (isHindi ? "📋 स्थिति व मानसिक पीड़ा का मूल्यांकन" : isSpanish ? "📋 Evaluación del Sufrimiento" : isFrench ? "📋 Évaluation de la Souffrance" : isGerman ? "📋 Belastungsanalyse" : "📋 Diagnostic & Suffering Assessment")
                : (isSynergy || isLastCard)
                ? (isHindi ? "✨ सारांश: एकीकृत त्रिवेणी उपचार योजना" : isSpanish ? "✨ Resumen: Resolución Sinérgica Tri-Pilar" : isFrench ? "✨ Synthèse : Résolution Synergique Tri-Piliers" : isGerman ? "✨ Zusammenfassung: Synergistische Dreisäulen-Lösung" : "✨ Summary: Tri-Pillar Synergistic Resolution")
                : isGita
                ? (isHindi ? "🕉️ श्रीमद्भगवद्गीता आत्मिक दर्शन" : isSpanish ? "🕉️ Sabiduría del Bhagavad Gita" : isFrench ? "🕉️ Sagesse de la Bhagavad Gita" : isGerman ? "🕉️ Weisheit der Bhagavad Gita" : "🕉️ Bhagavad Gita Wisdom")
                : isClinical
                ? (isHindi ? "🧠 क्लिनिकल कॉग्निटिव न्यूरोसाइंस (CBT)" : isSpanish ? "🧠 Neurociencia Clínica Cognitiva (TCC)" : isFrench ? "🧠 Neurosciences Cliniques Cognitives (TCC)" : isGerman ? "🧠 Klinische Kognitive Neurowissenschaft (CBT)" : "🧠 Clinical Cognitive Neuroscience (CBT)")
                : isTratak
                ? (isHindi ? "👁️ त्राटक न्यूरो-ऑक्युलर ध्यान विधि" : isSpanish ? "👁️ Protocolo Neuro-Ocular Tratak" : isFrench ? "👁️ Protocole Neuro-Oculaire Tratak" : isGerman ? "👁️ Tratak Neuro-Okulares Protokoll" : "👁️ Tratak Neuro-Ocular Protocol")
                : null;

              const badgeColor = isDiagnostic
                ? "text-purple-300 bg-purple-500/15 border-purple-500/30"
                : (isSynergy || isLastCard)
                ? "text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30"
                : isGita
                ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
                : isClinical
                ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                : isTratak
                ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/30"
                : "text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30";

              const headerMatch = trimmed.match(/^\*\*(?:[1234]\.\s+)?([^:]+):\*\*/i);
              const sectionHeader = headerMatch ? headerMatch[1].replace(/^[1234]\.\s*/, "") : null;

              return (
                <div key={idx} className={`p-3.5 sm:p-4 rounded-xl border ${borderClass} backdrop-blur-md space-y-2`}>
                  {badgeText && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-white/5">
                      <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {badgeText}
                      </span>
                      {sectionHeader && (
                        <span className="text-[11px] font-medium text-slate-300">
                          {sectionHeader}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Shloka in plain text format inside Shreemadh Bhagwatgita Aatam Darshan (Silent to TTS) */}
                  {isGita && gitaParsed.isGita && gitaParsed.shlokaBlock && (
                    <div data-tts-silent="true" data-tts-skip="true" className="tts-skip select-text my-2">
                      <GitaShlokaCard
                        shlokaContent={gitaParsed.shlokaBlock}
                        variant="inline"
                      />
                    </div>
                  )}
                  <div className="leading-relaxed text-slate-100 text-xs sm:text-sm font-sans space-y-1">
                    {renderFormattedMarkdown(trimmed, isSpeaking, activeKaraoke, activeWordRef, counter)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional Interactive Protocol Launchers (Trataka & CBT) */}
      {isLastMessage && onLaunchTrataka && recommendedTratakaLabel && (
        <div className="mt-1.5 max-w-[88%] md:max-w-xl">
          <button
            onClick={() => onLaunchTrataka(message.recommended_trataka || "bindu")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-[0.98]"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Prescribed Trataka Gazing ({recommendedTratakaLabel})</span>
          </button>
        </div>
      )}

      {isLastMessage && onOpenCBT && message.cbt_distortion && (
        <div className="mt-1.5 max-w-[88%] md:max-w-xl">
          <button
            onClick={onOpenCBT}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(16,185,129,0.12)] active:scale-[0.98]"
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Explore CBT Reframe: {message.cbt_distortion} →</span>
          </button>
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
