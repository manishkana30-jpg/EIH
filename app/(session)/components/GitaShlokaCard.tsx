'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Check, BookOpen } from 'lucide-react';

interface GitaShlokaCardProps {
  rawText: string;
}

export interface ParsedGitaContent {
  sanskrit: string;
  roman: string;
  meaning?: string;
  reflection?: string;
  karma?: string;
  cleanRemainingText: string;
}

/**
 * Extracts and parses [GITA_SHLOKA] tags from LLM response text.
 */
export function parseGitaShloka(text: string): ParsedGitaContent | null {
  if (!text) return null;

  const tagRegex = /\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i;
  const match = text.match(tagRegex);

  if (!match) return null;

  const rawShlokaBlock = match[1].trim();
  const cleanRemainingText = text.replace(tagRegex, '').trim();

  // Parse Sanskrit vs Roman transliteration inside the tag
  // Usually separated by lines or Roman/Devanagari character detection
  const lines = rawShlokaBlock.split('\n').map((l) => l.trim()).filter(Boolean);

  const devanagariLines: string[] = [];
  const romanLines: string[] = [];

  for (const line of lines) {
    if (/[\u0900-\u097F]/.test(line)) {
      devanagariLines.push(line);
    } else {
      romanLines.push(line);
    }
  }

  const sanskrit = devanagariLines.join('\n') || lines[0] || '';
  const roman = romanLines.join('\n') || (lines.length > 1 ? lines.slice(1).join('\n') : '');

  // Extract subsequent sections if tagged or structured in the remaining text
  let meaning: string | undefined;
  let reflection: string | undefined;
  let karma: string | undefined;

  const meaningMatch = cleanRemainingText.match(/(?:Philosophical Meaning|Meaning|अर्थ)[:\s*]+([\s\S]*?)(?=(?:Clinical Reflection|Reflection|Karma|कर्म|$))/i);
  if (meaningMatch) meaning = meaningMatch[1].trim();

  const reflectionMatch = cleanRemainingText.match(/(?:Clinical Reflection|Reflection|चिंतन)[:\s*]+([\s\S]*?)(?=(?:Karma|Action|कर्म|$))/i);
  if (reflectionMatch) reflection = reflectionMatch[1].trim();

  const karmaMatch = cleanRemainingText.match(/(?:Karma Directive|Karma|Actionable Karma|कर्म)[:\s*]+([\s\S]*?)$/i);
  if (karmaMatch) karma = karmaMatch[1].trim();

  return {
    sanskrit,
    roman,
    meaning,
    reflection,
    karma,
    cleanRemainingText,
  };
}

export const GitaShlokaCard: React.FC<GitaShlokaCardProps> = ({ rawText }) => {
  const [copied, setCopied] = useState(false);
  const parsed = parseGitaShloka(rawText);

  if (!parsed || (!parsed.sanskrit && !parsed.roman)) {
    return null;
  }

  const handleCopy = async () => {
    const textToCopy = `${parsed.sanskrit}\n\n${parsed.roman}\n\n${parsed.meaning ? `Meaning: ${parsed.meaning}` : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="my-3 w-full rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-50 shadow-[0_0_25px_rgba(245,158,11,0.12)] p-4 md:p-5 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-sans">
              <span>Bhagavad Gita Cognitive Reframe</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </span>
            <p className="text-[10px] text-amber-200/60 font-mono">
              Sattvavajaya Cognitive Therapy • Ancient Psychotherapy
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs transition-all active:scale-95"
          title="Copy Shloka & Reframe"
          aria-label="Copy Shloka"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Sanskrit Shloka Block */}
      {parsed.sanskrit && (
        <div className="text-center py-2.5 px-3 bg-amber-950/30 rounded-xl border border-amber-500/20 mb-3 shadow-inner">
          <p className="font-serif text-base md:text-lg leading-relaxed text-amber-100 tracking-wide font-medium whitespace-pre-line selection:bg-amber-500/30">
            {parsed.sanskrit}
          </p>
        </div>
      )}

      {/* Roman Transliteration */}
      {parsed.roman && (
        <div className="text-center pb-2">
          <p className="text-xs md:text-sm text-amber-200/80 italic font-serif leading-relaxed tracking-wide whitespace-pre-line">
            {parsed.roman}
          </p>
        </div>
      )}

      {/* Structured Meaning & Karma Reflection if Extracted */}
      {(parsed.meaning || parsed.reflection || parsed.karma) && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2 text-xs text-amber-100/90 leading-relaxed">
          {parsed.meaning && (
            <div>
              <span className="font-semibold text-amber-300 uppercase text-[10px] tracking-wider block">Philosophical Meaning:</span>
              <p className="mt-0.5 text-amber-100/80">{parsed.meaning}</p>
            </div>
          )}

          {parsed.reflection && (
            <div>
              <span className="font-semibold text-emerald-300 uppercase text-[10px] tracking-wider block">Clinical Reflection:</span>
              <p className="mt-0.5 text-slate-200">{parsed.reflection}</p>
            </div>
          )}

          {parsed.karma && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-100">
              <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider block">Karma Directive (Action):</span>
              <p className="mt-0.5 font-medium">{parsed.karma}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GitaShlokaCard;
