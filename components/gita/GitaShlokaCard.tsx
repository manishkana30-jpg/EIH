"use client";

import React, { useState } from "react";
import { GITA_LIBRARY, GitaShlokaItem } from "@/lib/knowledge/gita-library";
import { getLocalizedGitaItem } from "@/lib/i18n/clinical-localization";

export interface GitaShlokaCardProps {
  item?: GitaShlokaItem;
  shlokaContent?: string;
  chapterVerse?: string;
  languageCode?: string;
  onSelect?: (item: GitaShlokaItem) => void;
  className?: string;
}

export function parseGitaShloka(text: string): {
  isGita: boolean;
  shlokaBlock: string | null;
  remainingText: string;
} {
  if (!text) return { isGita: false, shlokaBlock: null, remainingText: text };

  // Check for [GITA_SHLOKA] ... [/GITA_SHLOKA]
  const match = text.match(/\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i);
  if (match) {
    const shlokaBlock = match[1].trim();
    const remainingText = text.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/i, "").trim();
    return { isGita: true, shlokaBlock, remainingText };
  }

  // Fallback: check for "1. THE SHLOKA:" or "THE SHLOKA:"
  const shlokaSectionMatch = text.match(/(?:1\.\s*)?THE SHLOKA:?\s*([\s\S]*?)(?=(?:2\.\s*)?THE MEANING:|$)/i);
  if (shlokaSectionMatch && /[\u0900-\u097F]/.test(shlokaSectionMatch[1])) {
    const shlokaBlock = shlokaSectionMatch[1].trim();
    const remainingText = text.replace(/(?:1\.\s*)?THE SHLOKA:?\s*[\s\S]*?(?=(?:2\.\s*)?THE MEANING:|$)/i, "").trim();
    return { isGita: true, shlokaBlock, remainingText };
  }

  return { isGita: false, shlokaBlock: null, remainingText: text };
}

/**
 * 100% Text-Only Semantic Gita Shloka Card.
 * Adheres strictly to text typography, subtle text borders, and clean contrast.
 * Completely free of <img>, thumbnails, background picture cards, and SVG illustrations.
 */
export const GitaShlokaCard: React.FC<GitaShlokaCardProps> = ({
  item,
  shlokaContent,
  chapterVerse,
  languageCode,
  onSelect,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  // If item not provided directly, try finding it in GITA_LIBRARY
  const resolvedItem = React.useMemo(() => {
    if (item) return item;
    if (!shlokaContent) return null;

    const lower = shlokaContent.toLowerCase();
    return (
      GITA_LIBRARY.find((s) => {
        if (lower.includes(`chapter ${s.chapter}`) && lower.includes(`verse ${s.verse}`)) return true;
        if (lower.includes(`${s.chapter}.${s.verse}`)) return true;
        if (lower.includes(s.id)) return true;
        if (s.shloka_roman && lower.includes(s.shloka_roman.slice(0, 20).toLowerCase())) return true;
        return false;
      }) || null
    );
  }, [item, shlokaContent]);

  if (!resolvedItem && !shlokaContent) return null;

  // Extract Devanagari and Roman lines
  const lines = (shlokaContent || (resolvedItem ? `${resolvedItem.shloka_sanskrit}\n\n${resolvedItem.shloka_roman}` : ""))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const devanagariLines = resolvedItem
    ? resolvedItem.shloka_sanskrit.split("\n").map((l) => l.trim()).filter(Boolean)
    : lines.filter((l) => /[\u0900-\u097F]/.test(l) && !l.startsWith("—"));

  const romanLines = resolvedItem
    ? resolvedItem.shloka_roman.split("\n").map((l) => l.trim()).filter(Boolean)
    : lines.filter((l) => !/[\u0900-\u097F]/.test(l) && !l.startsWith("—"));

  const referenceHeader =
    resolvedItem?.reference_header ||
    chapterVerse ||
    (resolvedItem ? `BG ${resolvedItem.chapter}.${resolvedItem.verse}` : "BG VEDIC ANCHOR");

  const localized = resolvedItem ? getLocalizedGitaItem(resolvedItem, languageCode) : null;
  const translationText = localized?.meaning || resolvedItem?.philosophical_meaning;
  const clinicalMapping = resolvedItem?.psychological_somatic_mapping;
  const tags = resolvedItem?.cognitive_tags || ["#Sattva", "#Detachment", "#CognitiveReframing"];

  const handleCopy = async () => {
    const fullText = [
      referenceHeader,
      devanagariLines.join("\n"),
      romanLines.join("\n"),
      translationText ? `Translation: ${translationText}` : "",
      clinicalMapping ? clinicalMapping : "",
      tags.join(" "),
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <article
      className={`p-5 sm:p-6 rounded-xl bg-slate-950/80 border border-amber-500/20 text-slate-100 shadow-sm transition-all duration-200 hover:border-amber-500/40 text-left ${className}`}
    >
      {/* Top Header: Reference & Plain Text Actions */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/15">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
            {referenceHeader}
          </span>
          {resolvedItem?.theme && (
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              — {resolvedItem.theme}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy verse text"
            className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 hover:border-amber-400/50 text-slate-400 hover:text-amber-300 transition-colors"
          >
            {copied ? "[Copied]" : "[Copy]"}
          </button>
          {onSelect && resolvedItem && (
            <button
              type="button"
              onClick={() => onSelect(resolvedItem)}
              className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              [Reflect]
            </button>
          )}
        </div>
      </div>

      {/* Sanskrit Devanagari (Legible Serif Font) */}
      <div className="my-4 space-y-1 text-center sm:text-left">
        {devanagariLines.map((line, idx) => (
          <p
            key={idx}
            className="font-serif text-base sm:text-lg font-medium text-amber-100 leading-relaxed tracking-wide"
          >
            {line}
          </p>
        ))}
      </div>

      {/* Romanized IAST Transliteration */}
      {romanLines.length > 0 && (
        <div className="my-3 space-y-0.5 text-center sm:text-left">
          {romanLines.map((line, idx) => (
            <p key={idx} className="font-sans text-xs sm:text-sm text-amber-200/80 italic leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Plain Language Translation */}
      {translationText && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <span className="font-medium text-amber-300/90 mr-1.5 font-sans">Translation:</span>
          <span>{translationText}</span>
        </div>
      )}

      {/* Psychological / Somatic Mapping */}
      {clinicalMapping && (
        <div className="mt-3 text-xs text-amber-400/95 font-sans font-medium bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          {clinicalMapping}
        </div>
      )}

      {/* Cognitive Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-3.5 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono font-medium text-amber-300/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

export default GitaShlokaCard;
