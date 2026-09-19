"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface GitaShlokaCardProps {
  shlokaContent: string;
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

export const GitaShlokaCard: React.FC<GitaShlokaCardProps> = ({ shlokaContent }) => {
  if (!shlokaContent) return null;

  // Split Devanagari lines and Roman/attribution lines
  const lines = shlokaContent.split("\n").map((l) => l.trim()).filter(Boolean);
  const devanagariLines = lines.filter((l) => /[\u0900-\u097F]/.test(l) && !l.startsWith("—"));
  const romanLines = lines.filter((l) => !/[\u0900-\u097F]/.test(l) && !l.startsWith("—"));
  const attribution = lines.find((l) => l.startsWith("—") || l.toLowerCase().includes("chapter") || l.toLowerCase().includes("bg"));

  return (
    <blockquote className="my-4 p-6 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.1)] font-serif text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-[11px] font-sans font-bold tracking-widest text-amber-400 uppercase">
          {attribution ? attribution.replace(/^[—\-]\s*/, "") : "श्रीमद्भगवद्गीता • Sacred Cognitive Anchor"}
        </span>
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>

      {devanagariLines.length > 0 ? (
        <div className="space-y-1 my-2">
          {devanagariLines.map((line, idx) => (
            <p key={idx} className="text-base sm:text-lg font-medium text-amber-100 leading-relaxed tracking-wide">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-base sm:text-lg font-medium text-amber-100 leading-relaxed whitespace-pre-wrap">
          {shlokaContent}
        </p>
      )}

      {romanLines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-1">
          {romanLines.map((line, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-amber-200/80 italic font-sans leading-normal">
              {line}
            </p>
          ))}
        </div>
      )}
    </blockquote>
  );
};
