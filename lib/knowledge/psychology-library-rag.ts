/**
 * lib/knowledge/psychology-library-rag.ts
 * TypeScript Edge & Client-Side RAG Retrieval Engine for the Clinical & Psychoeducational Library.
 */

import psychologyLibraryData from '@/data/psychology_library.json';

export interface ClinicalSolutions {
  cbt_reframing: string;
  somatic_anchor: string;
  pranayama: string;
  micro_habit: string;
}

export interface PsychologyCondition {
  id: string;
  name: string;
  category: string;
  triguna_balance: string;
  core_symptoms: string[];
  cognitive_distortions: string[];
  solutions: ClinicalSolutions;
  severity_level: string;
  requires_immediate_crisis: boolean;
}

export interface LibraryRAGResult {
  condition: PsychologyCondition;
  matchScore: number;
  matchedKeywords: string[];
  promptSnippet: string;
}

export const PSYCHOLOGY_LIBRARY: PsychologyCondition[] = psychologyLibraryData as PsychologyCondition[];

/**
 * Semantic & Keyword-Weighted Matcher for Clinical Conditions
 */
export function queryPsychologyLibrary(userText: string): LibraryRAGResult | null {
  if (!userText || !userText.trim()) return null;

  const rawLower = userText.toLowerCase();
  const words = rawLower.split(/[\s,.;:!?()]+/).filter((w) => w.length >= 3);

  let bestMatch: PsychologyCondition | null = null;
  let highestScore = 0;
  let matchedTerms: string[] = [];

  for (const condition of PSYCHOLOGY_LIBRARY) {
    let score = 0;
    const currentMatched: string[] = [];

    // 1. Direct ID matching (highest weight)
    if (rawLower.includes(condition.id)) {
      score += 15;
      currentMatched.push(condition.id);
    }

    // 2. Condition Name matching
    const nameWords = condition.name.toLowerCase().split(/\s+/);
    for (const nw of nameWords) {
      if (nw.length > 3 && rawLower.includes(nw)) {
        score += 6;
        currentMatched.push(nw);
      }
    }

    // 3. Category matching
    const catWords = condition.category.toLowerCase().split(/\s+/);
    for (const cw of catWords) {
      if (cw.length > 3 && rawLower.includes(cw)) {
        score += 3;
        currentMatched.push(cw);
      }
    }

    // 4. Core Symptoms matching
    for (const symptom of condition.core_symptoms) {
      const symWords = symptom.toLowerCase().split(/\s+/);
      let symOverlap = 0;
      for (const sw of symWords) {
        if (sw.length > 3 && words.includes(sw)) {
          symOverlap += 1;
        }
      }
      if (symOverlap >= 2) {
        score += 8;
        currentMatched.push(symptom);
      } else if (symOverlap === 1) {
        score += 3;
      }
    }

    // 5. Cognitive Distortions matching
    for (const distortion of condition.cognitive_distortions) {
      if (rawLower.includes(distortion.toLowerCase())) {
        score += 7;
        currentMatched.push(distortion);
      }
    }

    // 6. Domain specific trigger phrases
    if (condition.id === 'gad') {
      if (/worry|worrying|what if|anxious|anxiety|nervous|tense|restless|cannot sleep|insomnia/i.test(rawLower)) {
        score += 6;
      }
    } else if (condition.id === 'burnout_fatigue') {
      if (/burnout|burned out|exhausted|exhaustion|brain fog|tired|lethargy|overworked|depleted|no energy/i.test(rawLower)) {
        score += 6;
      }
    } else if (condition.id === 'panic_dysregulation') {
      if (/panic|heart racing|palpitations|cannot breathe|suffocating|trembling|sweating|doom|shaking/i.test(rawLower)) {
        score += 8;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = condition;
      matchedTerms = currentMatched;
    }
  }

  if (bestMatch && highestScore >= 5) {
    const promptSnippet = `[PSYCHOEDUCATIONAL LIBRARY EVIDENCE: ${bestMatch.name} (${bestMatch.triguna_balance})]
• CBT Reframing: ${bestMatch.solutions.cbt_reframing}
• Somatic Anchor: ${bestMatch.solutions.somatic_anchor}
• Pranayama: ${bestMatch.solutions.pranayama}
• Micro-Habit: ${bestMatch.solutions.micro_habit}`;

    return {
      condition: bestMatch,
      matchScore: highestScore,
      matchedKeywords: matchedTerms,
      promptSnippet,
    };
  }

  return null;
}

/**
 * Gets a condition by its unique ID
 */
export function getConditionById(id: string): PsychologyCondition | undefined {
  return PSYCHOLOGY_LIBRARY.find((c) => c.id === id);
}

/**
 * Returns all available conditions in the library
 */
export function getAllConditions(): PsychologyCondition[] {
  return PSYCHOLOGY_LIBRARY;
}
