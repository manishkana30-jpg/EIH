/**
 * lib/audio/stt-corrector.ts
 *
 * Client-Side Clinical Speech-to-Text (STT) Auto-Correction Engine.
 * Normalizes phonetic errors, slurred clinical terms, and speech recognition typos
 * before emotion analysis and state machine progression.
 */

export interface STTCorrectionOutput {
  originalText: string;
  correctedText: string;
  wasCorrected: boolean;
  corrections: string[];
}

function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  let v0 = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let v1 = new Array(s2.length + 1).fill(0);

  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    v0 = [...v1];
  }

  return v1[s2.length];
}

const PHRASE_MAPPINGS: Array<[RegExp, string]> = [
  [/\bpoly\s+vagal\b/gi, 'polyvagal'],
  [/\bpoly\s+vagle\b/gi, 'polyvagal'],
  [/\bpolyvagle\b/gi, 'polyvagal'],
  [/\bvegas\s+nerve\b/gi, 'vagus nerve'],
  [/\bvagus\s+nurve\b/gi, 'vagus nerve'],
  [/\bventral\s+vagle\b/gi, 'ventral vagal'],
  [/\bdorsal\s+vagle\b/gi, 'dorsal vagal'],
  [/\bover\s+whelmed\b/gi, 'overwhelmed'],
  [/\bover\s+whelming\b/gi, 'overwhelming'],
  [/\bover\s+thinking\b/gi, 'overthinking'],
  [/\bheart\s+beating\s+fast\b/gi, 'heart racing'],
  [/\bshort\s+of\s+breath\b/gi, 'cannot breathe'],
  [/\bbindu\s+dot\b/gi, 'bindu'],
  [/\bjyoti\s+flame\b/gi, 'jyoti'],
  [/\bweek\s+memory\b/gi, 'weak memory'],
  [/\bloose\s+memory\b/gi, 'lose memory'],
  [/\bcant\s+breathe\b/gi, 'cannot breathe'],
  [/\bcant\s+sleep\b/gi, 'cannot sleep'],
  [/\bcant\s+focus\b/gi, 'cannot focus'],
];

const CLINICAL_DICTIONARY = [
  'trataka', 'pranayama', 'shloka', 'polyvagal', 'somatic', 'interoception',
  'baroreceptor', 'catastrophizing', 'rumination', 'ruminating', 'anxiety',
  'anxious', 'panic', 'panicking', 'palpitations', 'palpitation', 'depression',
  'depressed', 'insomnia', 'exhaustion', 'exhausted', 'burnout', 'overthinking',
  'overwhelmed', 'bereavement', 'grieving', 'hypervigilant', 'dissociation',
  'defusion', 'neuroplasticity', 'meditation', 'breathwork', 'vagus', 'parasympathetic',
  'ghabrahat', 'bechaini', 'tanaav', 'udasi', 'udaas', 'gussa', 'krodh'
];

export class STTTextCorrector {
  private maxEditDistance = 2;

  public correct(text: string): STTCorrectionOutput {
    if (!text || !text.trim()) {
      return {
        originalText: text || '',
        correctedText: text || '',
        wasCorrected: false,
        corrections: [],
      };
    }

    const original = text;
    let current = text;
    const corrections: string[] = [];

    // 1. Multi-word phrase substitutions
    for (const [pattern, replacement] of PHRASE_MAPPINGS) {
      if (pattern.test(current)) {
        current = current.replace(pattern, replacement);
        corrections.push(`phrase: -> '${replacement}'`);
      }
    }

    // 2. Token-level dictionary fuzzy matching
    const tokens = current.split(/(\s+|[.,!?;:()]+)/);
    const reconstructed: string[] = [];

    for (const token of tokens) {
      const cleanWord = token.trim().toLowerCase();
      if (!/^[a-zA-Z]{4,}$/.test(cleanWord) || CLINICAL_DICTIONARY.includes(cleanWord)) {
        reconstructed.push(token);
        continue;
      }

      let bestMatch: string | null = null;
      let bestDist = 999;

      for (const candidate of CLINICAL_DICTIONARY) {
        if (Math.abs(candidate.length - cleanWord.length) > this.maxEditDistance) {
          continue;
        }

        const dist = levenshteinDistance(cleanWord, candidate);
        const allowed = cleanWord.length <= 4 ? 1 : this.maxEditDistance;

        if (dist <= allowed && dist < bestDist) {
          bestDist = dist;
          bestMatch = candidate;
        }
      }

      if (bestMatch && bestDist <= this.maxEditDistance) {
        const isCapitalized = token[0] === token[0].toUpperCase();
        const replacement = isCapitalized ? bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1) : bestMatch;
        reconstructed.push(replacement);
        corrections.push(`word: '${token}' -> '${replacement}'`);
      } else {
        reconstructed.push(token);
      }
    }

    const corrected = reconstructed.join('').replace(/\s+/g, ' ').trim();

    return {
      originalText: original,
      correctedText: corrected,
      wasCorrected: corrections.length > 0,
      corrections,
    };
  }
}

export const sttTextCorrector = new STTTextCorrector();
