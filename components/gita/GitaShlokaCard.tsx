"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, Volume2 } from "lucide-react";

export interface GitaShlokaCardProps {
  shlokaContent: string;
  chapterVerse?: string;
  onSpeak?: (text: string) => void;
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

export const GitaShlokaCard: React.FC<GitaShlokaCardProps> = ({
  shlokaContent,
  chapterVerse,
  onSpeak,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!shlokaContent) return null;

  // Split Devanagari lines and Roman/attribution lines
  const lines = shlokaContent.split("\n").map((l) => l.trim()).filter(Boolean);
  const devanagariLines = lines.filter((l) => /[\u0900-\u097F]/.test(l) && !l.startsWith("—"));
  const romanLines = lines.filter((l) => !/[\u0900-\u097F]/.test(l) && !l.startsWith("—"));
  const attribution =
    chapterVerse ||
    lines.find((l) => l.startsWith("—") || l.toLowerCase().includes("chapter") || l.toLowerCase().includes("bg"));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shlokaContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <blockquote
      className={`my-4 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.12)] font-serif text-center relative overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 mx-auto">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-sans font-bold tracking-widest text-amber-400 uppercase">
            {attribution ? attribution.replace(/^[—\-]\s*/, "") : "श्रीमद्भगवद्गीता • Sacred Cognitive Anchor"}
          </span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-1.5 absolute right-4 top-4">
          {onSpeak && (
            <button
              onClick={() => onSpeak(shlokaContent)}
              title="Speak Verse"
              aria-label="Speak Verse"
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/50"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy Shloka"}
            aria-label="Copy Shloka"
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {devanagariLines.length > 0 ? (
        <div className="space-y-1.5 my-3">
          {devanagariLines.map((line, idx) => (
            <p key={idx} className="text-base sm:text-lg font-medium text-amber-100 leading-relaxed tracking-wide">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-base sm:text-lg font-medium text-amber-100 leading-relaxed tracking-wide my-3">
          {shlokaContent}
        </p>
      )}

      {romanLines.length > 0 && (
        <div className="space-y-0.5 mt-2 pt-2 border-t border-amber-500/20">
          {romanLines.map((line, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-amber-200/80 italic font-sans">
              {line}
            </p>
          ))}
        </div>
      )}
    </blockquote>
  );
};

export default GitaShlokaCard;
