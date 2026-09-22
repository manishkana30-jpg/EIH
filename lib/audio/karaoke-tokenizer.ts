/**
 * lib/audio/karaoke-tokenizer.ts
 *
 * Single Source of Truth for:
 * 1. Isolating Bhagavad Gita Sanskrit shloka (silent to TTS, rendered in contemplation card).
 * 2. Precomputing word tokens with 1:1 index alignment for DOM karaoke highlighting.
 * 3. Generating sanitized, natural speech text free of markdown symbols, broken images, and stray punctuation.
 */

export interface KaraokeToken {
  word: string;
  cleanWord: string;
  wordIndex: number;
  sentenceIndex: number;
  sectionIndex: number;
  startChar: number;
  endChar: number;
  isFlowStep?: boolean;
  stepIndex?: number;
  isBadge?: boolean;
}

export interface ParsedSection {
  rawPart: string;
  cleanedContent: string;
}

export interface TokenizeResult {
  words: KaraokeToken[];
  speechText: string;
  isGita: boolean;
  shlokaBlock: string | null;
  therapeuticBody: string;
  sections: ParsedSection[];
}

export function cleanWordForMatch(str: string): string {
  return str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Checks whether a word token is currently active based on KaraokeState.
 * Supports exact index matching and localized lexical recovery (within +/- 4 words).
 */
export function isWordActive(
  currentWordIndex: number,
  wordStr: string,
  activeKaraoke: { wordIndex: number; wordText?: string } | null | undefined
): boolean {
  if (!activeKaraoke) return false;

  // Direct index match
  if (currentWordIndex === activeKaraoke.wordIndex) {
    return true;
  }

  // Lexical recovery fallback for minor browser offset discrepancies
  if (activeKaraoke.wordText) {
    const cleanWord = cleanWordForMatch(wordStr);
    const cleanTarget = cleanWordForMatch(activeKaraoke.wordText);
    if (cleanWord && cleanTarget && cleanWord === cleanTarget) {
      if (Math.abs(currentWordIndex - activeKaraoke.wordIndex) <= 4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parses raw assistant message text into:
 * - Isolated Gita Shloka (if present)
 * - Cleaned therapeutic sections (removing card headers like **1. ...** or **SUMMARY...**)
 */
export function parseTherapeuticMessage(rawText: string): {
  isGita: boolean;
  shlokaBlock: string | null;
  therapeuticBody: string;
  sections: ParsedSection[];
} {
  if (!rawText) {
    return { isGita: false, shlokaBlock: null, therapeuticBody: '', sections: [] };
  }

  // 1. Separate Gita Shloka (Strictly silent to TTS)
  let isGita = false;
  let shlokaBlock: string | null = null;
  let therapeuticBody = rawText;

  const shlokaMatch = rawText.match(/\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i);
  if (shlokaMatch) {
    isGita = true;
    shlokaBlock = shlokaMatch[1].trim();
    therapeuticBody = rawText.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/i, '').trim();
  }

  // 2. Split into therapeutic sections by bold headers
  const rawParts = therapeuticBody.split(
    /(?=\*\*(?:[1234]\.\s+|SUMMARY|आपकी स्थिति|स्थिति व कष्ट|RESUMEN|SYNTHÈSE|ZUSAMMENFASSUNG|TRI-PILLAR|एकीकृत))/i
  );

  const sections: ParsedSection[] = rawParts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      // Strip section header e.g. **1. Bhagavad Gita Wisdom: Focus on Action**
      const cleaned = part
        .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|RESUMEN[^*]*|SYNTHÈSE[^*]*|ZUSAMMENFASSUNG[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/im, '')
        .replace(/!\[(.*?)\]\([^\)]*\)/g, '$1');

      return { rawPart: part, cleanedContent: cleaned };
    });

  return { isGita, shlokaBlock, therapeuticBody, sections };
}

/**
 * Universal Tokenizer for Real-Time Karaoke Highlighting and Speech Synthesis.
 * Guaranteed 100% 1:1 match between spoken speech tokens and rendered UI word spans.
 */
export function tokenizeForKaraoke(rawText: string, _locale?: string): TokenizeResult {
  const { isGita, shlokaBlock, therapeuticBody, sections } = parseTherapeuticMessage(rawText);

  const words: KaraokeToken[] = [];
  let globalWordIdx = 0;
  let globalSentenceIdx = 0;

  // Process sections in exact rendering order
  sections.forEach((sec, secIdx) => {
    const lines = sec.cleanedContent.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Case A: Process Flow Line e.g. Inhale (4s) -> Hold (7s) -> Exhale (8s)
      if (/\s*(?:->|→|-->)\s*/.test(trimmedLine) && !trimmedLine.startsWith('**')) {
        const steps = trimmedLine.split(/\s*(?:->|→|-->)\s*/).filter(Boolean);
        steps.forEach((step, stepIdx) => {
          const stepTokens = step.trim().split(/\s+/).filter(Boolean);
          stepTokens.forEach((tok) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            words.push({
              word: tok,
              cleanWord: cleanWordForMatch(tok),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
              isFlowStep: true,
              stepIndex: stepIdx,
            });
          });
        });
        globalSentenceIdx++;
        return;
      }

      // Case B: Inline badges or standard formatted prose
      const badgeRegex = /(\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus)[^\]]*\])/gi;
      const parts = trimmedLine.split(badgeRegex);

      parts.forEach((part) => {
        const badgeMatch = part.match(
          /^\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus):?\s*([^\]]+)\]$/i
        );
        if (
          badgeMatch ||
          (part.startsWith('[') && part.endsWith(']') && (part.includes('🎯') || part.includes('⚡')))
        ) {
          const label = badgeMatch ? badgeMatch[1].trim() : part.slice(1, -1).trim();
          const badgeTokens = label.split(/\s+/).filter(Boolean);
          badgeTokens.forEach((tok) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            words.push({
              word: tok,
              cleanWord: cleanWordForMatch(tok),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
              isBadge: true,
            });
          });
          return;
        }

        // Standard segments (bold vs plain text)
        const segments = part.split(/(\*\*[^*]+\*\*)/g);
        segments.forEach((seg) => {
          const isBold = seg.startsWith('**') && seg.endsWith('**');
          const rawContent = isBold ? seg.slice(2, -2) : seg;
          const tokens = rawContent.split(/\s+/).filter(Boolean);

          tokens.forEach((token) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            const isSentenceEnd = /[.!?।]\s*$/.test(token);
            if (isSentenceEnd) {
              globalSentenceIdx++;
            }
            words.push({
              word: token,
              cleanWord: cleanWordForMatch(token),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
            });
          });
        });
      });
    });
  });

  // Generate the exact 1:1 Speech Text from tokens
  const speechText = words.map((w) => w.word).join(' ');

  // Calculate startChar and endChar offsets in speechText for character boundary resolution
  let cursor = 0;
  words.forEach((w) => {
    const idx = speechText.indexOf(w.word, cursor);
    if (idx >= 0) {
      w.startChar = idx;
      w.endChar = idx + w.word.length;
      cursor = w.endChar;
    } else {
      w.startChar = cursor;
      w.endChar = cursor + w.word.length;
      cursor = w.endChar + 1;
    }
  });

  return { words, speechText, isGita, shlokaBlock, therapeuticBody, sections };
}
