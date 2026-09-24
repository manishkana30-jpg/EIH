/**
 * lib/wellness-flow/confirm-intent-parser.ts
 *
 * Robust Multilingual Yes/No Intent Parser for Phase 1 Confirmation Step.
 * Evaluates spoken or typed user input in English and Hindi.
 *
 * Handles:
 * - Case-insensitivity, trimmed whitespace, and stripped punctuation.
 * - Matching inside conversational sentences (e.g. "haan bilkul sahi hai", "yes that's right").
 * - Multi-word Hindi & English affirmative and negative phrases.
 * - Contradiction detection (if both or neither match, returns 'unclear').
 */

export type ConfirmationIntent = 'yes' | 'no' | 'unclear';

export interface ParseIntentResult {
  intent: ConfirmationIntent;
  matchedYes: string[];
  matchedNo: string[];
  confidence: number;
  raw: string;
  normalized: string;
}

// ─── Debug Log Toggle ───
export const DEBUG_CONFIRM_VOICE = true;

export function logConfirmDebug(
  tag: 'TTS' | 'STT' | 'RESULT' | 'INTENT' | 'TRANSITION' | 'GUARD' | 'ERROR',
  message: string,
  data?: any
): void {
  if (!DEBUG_CONFIRM_VOICE) return;
  const time = new Date().toISOString().substring(11, 23);
  if (data !== undefined) {
    console.log(`[CONFIRM-VOICE:${tag} ${time}] ${message}`, data);
  } else {
    console.log(`[CONFIRM-VOICE:${tag} ${time}] ${message}`);
  }
}

// ─── Phrase & Keyword Lexicons ───

// Multi-word negative phrases checked first (to avoid false affirmative match on compound phrases like "bilkul nahi" or "not quite right")
const NO_MULTI_WORD_PHRASES: string[] = [
  "that's not right",
  "thats not right",
  "that is not right",
  "that's not correct",
  "thats not correct",
  "that is not correct",
  "not quite right",
  "not really right",
  "not that right",
  "not right",
  "not correct",
  "not really",
  "not quite",
  "bilkul nahi",
  "bilkul nahin",
  "nahi ji",
  "nahin ji",
  "ji nahi",
  "ji nahin",
  "बिल्कुल नहीं",
  "जी नहीं",
  "सही नहीं",
  "गलत है",
];

// Single negative words
const NO_SINGLE_KEYWORDS: string[] = [
  'no',
  'nope',
  'wrong',
  'incorrect',
  'differently',
  'nahi',
  'nahin',
  'na',
  'galat',
  'नहीं',
  'ना',
  'गलत',
];

// Multi-word affirmative phrases
const YES_MULTI_WORD_PHRASES: string[] = [
  "that's right",
  "thats right",
  "that is right",
  "that's correct",
  "thats correct",
  "that is correct",
  "haan ji",
  "han ji",
  "ji haan",
  "ji han",
  "theek hai",
  "thik hai",
  "sahi hai",
  "bilkul sahi",
  "haan bilkul",
  "जी हाँ",
  "जी हां",
  "ठीक है",
  "सही है",
  "बिल्कुल सही",
];

// Single affirmative words
const YES_SINGLE_KEYWORDS: string[] = [
  'yes',
  'yeah',
  'yep',
  'yup',
  'correct',
  'right',
  'exactly',
  'sure',
  'ok',
  'okay',
  'agree',
  'true',
  'haan',
  'ha',
  'han',
  'bilkul',
  'sahi',
  'हाँ',
  'हां',
  'बिल्कुल',
  'सही',
  'ठीक',
];

/**
 * Normalizes user transcript:
 * - Lowercases Latin characters.
 * - Replaces curly apostrophes with standard single quotes.
 * - Removes non-Devanagari / non-Latin punctuation (commas, periods, exclamation, question marks).
 * - Collapses multiple spaces.
 */
export function normalizeTranscript(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses user speech or text for Yes/No confirmation intent.
 */
export function parseYesNoIntent(rawInput: string): ConfirmationIntent {
  const result = parseYesNoIntentDetailed(rawInput);
  return result.intent;
}

/**
 * Detailed intent parser with matched tokens, score, and confidence.
 */
export function parseYesNoIntentDetailed(rawInput: string): ParseIntentResult {
  const normalized = normalizeTranscript(rawInput);

  if (!normalized) {
    const res: ParseIntentResult = {
      intent: 'unclear',
      matchedYes: [],
      matchedNo: [],
      confidence: 0,
      raw: rawInput,
      normalized: '',
    };
    logConfirmDebug('INTENT', 'Empty input parsed as unclear', res);
    return res;
  }

  const matchedYes: string[] = [];
  const matchedNo: string[] = [];

  // 1. Check Multi-Word Negative Phrases
  for (const phrase of NO_MULTI_WORD_PHRASES) {
    if (normalized.includes(phrase)) {
      matchedNo.push(phrase);
    }
  }

  // 2. Check Single Negative Keywords (Word boundaries for Latin, inclusion for Devanagari)
  for (const word of NO_SINGLE_KEYWORDS) {
    const isDevanagari = /[\u0900-\u097F]/.test(word);
    if (isDevanagari) {
      if (normalized.includes(word)) {
        matchedNo.push(word);
      }
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedNo.push(word);
      }
    }
  }

  // 3. Check Multi-Word Affirmative Phrases
  for (const phrase of YES_MULTI_WORD_PHRASES) {
    if (normalized.includes(phrase)) {
      matchedYes.push(phrase);
    }
  }

  // 4. Check Single Affirmative Keywords
  for (const word of YES_SINGLE_KEYWORDS) {
    const isDevanagari = /[\u0900-\u097F]/.test(word);
    if (isDevanagari) {
      if (normalized.includes(word)) {
        matchedYes.push(word);
      }
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedYes.push(word);
      }
    }
  }

  // Deduplicate matches
  const uniqueYes = Array.from(new Set(matchedYes));
  const uniqueNo = Array.from(new Set(matchedNo));

  // Substring conflict resolution:
  // e.g., if user said "bilkul nahi", uniqueNo will have ["bilkul nahi", "nahi"] and uniqueYes will have ["bilkul"].
  // Here "bilkul" is a component of "bilkul nahi".
  // Filter out any affirmative match that is strictly a substring of a matched negative phrase.
  const filteredYes = uniqueYes.filter((yesMatch) => {
    return !uniqueNo.some((noMatch) => noMatch.includes(yesMatch) && noMatch !== yesMatch);
  });

  // Filter out any negative match that is strictly a substring of a matched affirmative phrase.
  const filteredNo = uniqueNo.filter((noMatch) => {
    return !uniqueYes.some((yesMatch) => yesMatch.includes(noMatch) && yesMatch !== noMatch);
  });

  let intent: ConfirmationIntent = 'unclear';
  let confidence = 0.5;

  if (filteredYes.length > 0 && filteredNo.length === 0) {
    intent = 'yes';
    confidence = Math.min(0.99, 0.75 + filteredYes.length * 0.1);
  } else if (filteredNo.length > 0 && filteredYes.length === 0) {
    intent = 'no';
    confidence = Math.min(0.99, 0.75 + filteredNo.length * 0.1);
  } else {
    // Both matched (contradictory) or neither matched (gibberish/silence/unrelated)
    intent = 'unclear';
    confidence = 0.2;
  }

  const result: ParseIntentResult = {
    intent,
    matchedYes: filteredYes,
    matchedNo: filteredNo,
    confidence: Number(confidence.toFixed(2)),
    raw: rawInput,
    normalized,
  };

  logConfirmDebug('INTENT', `Parsed raw="${rawInput}" -> intent=${intent} (conf=${confidence})`, {
    matchedYes: filteredYes,
    matchedNo: filteredNo,
  });

  return result;
}
