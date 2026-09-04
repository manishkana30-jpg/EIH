/**
 * lib/knowledge/psychology-library-rag.ts
 * TypeScript Edge & Client-Side RAG Retrieval Engine for the Clinical & Psychoeducational Library.
 * Grounded in Evidence-Based CBT, Polyvagal Theory & Ayurvedic Sattvavajaya Chikitsa.
 */

import psychologyLibraryData from '../../data/psychology_library.json' with { type: 'json' };

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

export interface BreathCadence {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause: number;
  description: string;
}

export interface LibraryRAGResult {
  condition: PsychologyCondition;
  matchScore: number;
  matchedKeywords: string[];
  promptSnippet: string;
  structuredCard: {
    title: string;
    category: string;
    triguna: string;
    cbtReframing: string;
    somaticAnchor: string;
    pranayama: string;
    microHabit: string;
    breathCadence?: BreathCadence;
  };
}

export const PSYCHOLOGY_LIBRARY: PsychologyCondition[] = psychologyLibraryData as PsychologyCondition[];

/**
 * Domain-specific regex triggers mapped to condition IDs for rapid, high-accuracy clinical matching.
 * Includes English and Multi-lingual (Hindi/Hinglish, Spanish, French, German) clinical keywords.
 */
const CLINICAL_TRIGGER_PATTERNS: Record<string, RegExp> = {
  gad: /\b(worry|worrying|worried|what if|anxious|anxiety|nervous|nervousness|tense|restless|racing mind|cannot relax|dread|on edge|ghabrahat|chinta|bechaini|tanaav|ansiedad|inquietude|angst)\b/i,
  burnout_fatigue: /\b(burnout|burned out|burnt out|exhausted|exhaustion|brain fog|lethargy|overworked|depleted|no energy|drained|tired of working|work fatigue|thak gaya|thakan|agotamiento|epuisement|erschopfung)\b/i,
  panic_dysregulation: /\b(panic|panic attack|heart racing|palpitations|cannot breathe|suffocating|trembling|cold chills|hot flashes|doom|shaking|chest pounding|loss of control|saas nahi|ghutan|ataque de panico|panique)\b/i,
  major_depressive_inertia: /\b(depressed|depression|low mood|feeling down|empty|emptiness|hopeless|hopelessness|despair|anhedonia|unmotivated|no point|cannot get out of bed|worthless|useless|numb|udaas|udaasi|depresion)\b/i,
  imposter_perfectionism: /\b(imposter|impostor|fraud|failure|failed|failing|perfectionist|perfectionism|not good enough|incompetent|will be exposed|cheat|mess up|messing up|fear of failing|kabil nahi)\b/i,
  relationship_heartbreak: /\b(breakup|broke up|ex-|ex boyfriend|ex girlfriend|partner|husband|wife|fight|argument|heartbreak|broken heart|rejection|unloved|abandoned|abandonment|cheated|dil toot|rupture)\b/i,
  existential_loneliness: /\b(lonely|loneliness|all alone|isolated|isolation|nobody cares|no friends|alienated|alienation|empty world|disconnected|no one to talk to|akela|akelepan|soledad|solitude|einsamkeit)\b/i,
  anger_frustration_dysregulation: /\b(angry|anger|furious|fury|rage|raging|mad|irritated|irritation|annoyed|unfair|unfairness|hate them|screaming|boss yelled|yelled at me|injustice|betrayed|gussa|krodh|colere|wut)\b/i,
  grief_bereavement: /\b(grief|grieving|bereavement|loss of|died|passed away|mourning|sorrow|funeral|lost my dog|lost my cat|lost my parent|lost my loved one|weeping|shok|duelo|deuil|trauer)\b/i,
  social_evaluative_threat: /\b(social anxiety|shy|shyness|embarrassed|embarrassment|judging me|public speaking|awkward|crowds|humiliated|presentation|speech anxiety|people staring|sharm|timide)\b/i,
  adhd_executive_overwhelm: /\b(adhd|procrastinate|procrastinating|procrastination|task paralysis|cannot start|overwhelmed with tasks|distract|distracted|executive dysfunction|frozen|stuck on tasks)\b/i,
  insomnia_hyperarousal: /\b(insomnia|cannot sleep|cant sleep|waking up|sleep trouble|staying awake|lying in bed|midnight|toss and turn|tossing and turning|bedtime racing|sleep anxiety|neend nahi|insomnio|insomnie|schlaflosigkeit)\b/i,
  health_somatic_anxiety: /\b(health anxiety|hypochondria|illness|disease|cancer|heart attack|checking pulse|medical symptoms|sick|tumor|body sensation|googling symptoms|bimaari)\b/i,
  trauma_hypervigilance: /\b(trauma|traumatic|ptsd|flashback|flashbacks|triggered|hypervigilant|hypervigilance|abuse|assault|startled|safe space|nightmares|visceral reaction)\b/i,
  ocd_intrusive_rumination: /\b(ocd|intrusive thought|intrusive thoughts|pure o|pure-o|bad thoughts|disturbing thought|unwanted thought|mental check|reassurance seeking|thought action fusion|compulsion|compulsive|bure vichar)\b/i,
  compassion_fatigue_caregiver: /\b(caregiver|caregiving|taking care of my|caring for sick|caring for elderly|caregiver burnout|caregiver fatigue|secondary trauma|empathic strain|empathy burnout|caretaker)\b/i,
  decision_paralysis_ambivalence: /\b(decision paralysis|cannot decide|cant decide|hard to choose|choice overload|too many options|analysis paralysis|paralyzed by choice|afraid of making wrong choice|indecisive|indecision)\b/i,
  shame_core_defectiveness: /\b(shame|ashamed|toxic shame|deeply flawed|defective|fundamentally broken|unworthy|hate myself|disgusted with myself|want to disappear|sharmindagi|vergüenza|honte|scham)\b/i,
  workplace_mobbing_toxic_culture: /\b(toxic workplace|toxic boss|toxic manager|gaslighting boss|workplace mobbing|workplace harassment|coworker sabotage|hostile workplace|sunday dread|corporate politics)\b/i,
  somatic_chronic_pain_amplification: /\b(chronic pain|neuroplastic pain|back pain|fibromyalgia|pain reprocessing|tension headache|pain flare|somatic tracking|central sensitization|dard)\b/i,
};

/**
 * Pre-configured breathwork pacing presets for clinical interventions.
 */
export const CLINICAL_BREATHWORK_PACERS: Record<string, BreathCadence> = {
  gad: {
    name: 'Nadi Shodhana (Alternate Nostril)',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 2,
    description: 'Harmonizes sympathetic and parasympathetic branches of the autonomic nervous system.',
  },
  burnout_fatigue: {
    name: 'Bhramari (Humming Bee Resonance)',
    inhale: 4,
    hold: 1,
    exhale: 6,
    pause: 1,
    description: 'Generates cranial micro-vibrations stimulating nitric oxide release and vagal tone.',
  },
  panic_dysregulation: {
    name: 'Extended Exhale Vagal Brake',
    inhale: 4,
    hold: 0,
    exhale: 7,
    pause: 1,
    description: 'Long exhalations activate the cardiac vagal brake, reducing heart rate rapidly.',
  },
  major_depressive_inertia: {
    name: 'Surya Bhedana (Solar Activation)',
    inhale: 4,
    hold: 2,
    exhale: 4,
    pause: 0,
    description: 'Activates right-nostril solar pingala nadi to disperse lethargy and tamasic inertia.',
  },
  imposter_perfectionism: {
    name: 'Sitali Cooling Breathwork',
    inhale: 4,
    hold: 2,
    exhale: 5,
    pause: 1,
    description: 'Cools physiological overheating, lowers autonomic agitation and perfectionist drive.',
  },
  social_evaluative_threat: {
    name: 'Sama Vritti (Box Breathing 4-4-4-4)',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4,
    description: 'Equalizes autonomic arousal and prevents situational speech tremors.',
  },
  insomnia_hyperarousal: {
    name: "Dr. Weil's 4-7-8 Somnolence Protocol",
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 0,
    description: 'Forces oxygenation and shifts central autonomic balance into deep sleep readiness.',
  },
  ocd_intrusive_rumination: {
    name: 'Viloma Interrupted Breathwork',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 2,
    description: 'Stepwise breathing breaks hyper-fixated mental looping and compulsion urgency.',
  },
  shame_core_defectiveness: {
    name: 'Chandra Bhedana (Lunar Soothing)',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 1,
    description: 'Stimulates left-nostril ida nadi to foster deep self-soothing and parasympathetic warmth.',
  },
  decision_paralysis_ambivalence: {
    name: 'Ujjayi (Oceanic Centering)',
    inhale: 5,
    hold: 2,
    exhale: 5,
    pause: 1,
    description: 'Throat-constricted audible breath stabilizes prefrontal cortical decision circuits.',
  },
};

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

    // 1. Direct Trigger Pattern Matching (Massive weight +12)
    const triggerRegex = CLINICAL_TRIGGER_PATTERNS[condition.id];
    if (triggerRegex && triggerRegex.test(rawLower)) {
      score += 12;
      currentMatched.push(`pattern:${condition.id}`);
    }

    // 2. Direct ID matching (+10)
    if (rawLower.includes(condition.id.replace(/_/g, ' '))) {
      score += 10;
      currentMatched.push(condition.id);
    }

    // 3. Condition Name matching (+4)
    const nameWords = condition.name.toLowerCase().split(/[\s,&]+/);
    for (const nw of nameWords) {
      if (nw.length >= 4 && rawLower.includes(nw)) {
        score += 4;
        currentMatched.push(nw);
      }
    }

    // 4. Category matching (+3)
    const catWords = condition.category.toLowerCase().split(/[\s,&]+/);
    for (const cw of catWords) {
      if (cw.length >= 4 && rawLower.includes(cw)) {
        score += 3;
        currentMatched.push(cw);
      }
    }

    // 5. Core Symptoms matching (+3 to +8)
    for (const symptom of condition.core_symptoms) {
      const symWords = symptom.toLowerCase().split(/\s+/);
      let symOverlap = 0;
      for (const sw of symWords) {
        if (sw.length >= 4 && words.includes(sw)) {
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

    // 6. Cognitive Distortions matching (+7)
    for (const distortion of condition.cognitive_distortions) {
      if (rawLower.includes(distortion.toLowerCase())) {
        score += 7;
        currentMatched.push(distortion);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = condition;
      matchedTerms = currentMatched;
    }
  }

  // Threshold >= 4 enables high precision matching
  if (bestMatch && highestScore >= 4) {
    const promptSnippet = `[PSYCHOEDUCATIONAL LIBRARY EVIDENCE: ${bestMatch.name} (${bestMatch.triguna_balance})]
• Clinical CBT Reframing: ${bestMatch.solutions.cbt_reframing}
• Somatic Grounding Anchor: ${bestMatch.solutions.somatic_anchor}
• Ayurvedic Pranayama Protocol: ${bestMatch.solutions.pranayama}
• Daily Micro-Habit: ${bestMatch.solutions.micro_habit}
• Required Clinician Delivery: Acknowledge the user's emotional state, gently weave this exact CBT reframe into your response, and guide them through the somatic anchor or pranayama breathwork.`;

    const pacer = CLINICAL_BREATHWORK_PACERS[bestMatch.id] || {
      name: 'Coherent Diaphragmatic Breath',
      inhale: 4,
      hold: 2,
      exhale: 5,
      pause: 1,
      description: 'Standard parasympathetic coherence breathing.',
    };

    return {
      condition: bestMatch,
      matchScore: highestScore,
      matchedKeywords: matchedTerms,
      promptSnippet,
      structuredCard: {
        title: bestMatch.name,
        category: bestMatch.category,
        triguna: bestMatch.triguna_balance,
        cbtReframing: bestMatch.solutions.cbt_reframing,
        somaticAnchor: bestMatch.solutions.somatic_anchor,
        pranayama: bestMatch.solutions.pranayama,
        microHabit: bestMatch.solutions.micro_habit,
        breathCadence: pacer,
      },
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
