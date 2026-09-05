/**
 * lib/knowledge/psychology-library-rag.ts
 * TypeScript Edge & Client-Side RAG Retrieval Engine for the Clinical & Psychoeducational Library.
 * Grounded in Evidence-Based CBT, Polyvagal Theory & Ayurvedic Sattvavajaya Chikitsa.
 */

import psychologyLibraryData from '../../data/psychology_library.json' with { type: 'json' };
import { emotionClassifier } from './emotion-classifier.ts';
import {
  DYNAMIC_LEARNED_DOCUMENTS,
  learnAndIndexQuery,
  addLearnedDocument,
  getLearnedDocuments,
  type LearnedPsychologyDocument,
} from './self-learning-rag.ts';

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
    sourceUrl?: string;
    sourcePlatform?: string;
    isLearnedDocument?: boolean;
  };
}

export const PSYCHOLOGY_LIBRARY: PsychologyCondition[] = psychologyLibraryData as PsychologyCondition[];

/**
 * Domain-specific regex triggers mapped to condition IDs for rapid, high-accuracy clinical matching.
 * Includes English, Devanagari Hindi, Hinglish, Spanish, French, and German clinical keywords.
 */
const CLINICAL_TRIGGER_PATTERNS: Record<string, RegExp> = {
  gad: /(?:\b(worry|worrying|worried|what if|anxious|anxiety|nervous|nervousness|tense|tension|restless|racing mind|cannot relax|dread|on edge|stress|stressed|stressing|overwhelmed|overthinking|overthink|pressure|ghabrahat|chinta|bechaini|tanaav|ansiedad|inquietude|angst)\b|तनाव|चिंता|बेचैनी|घबराहट|परेशानी|दबाव)/i,
  burnout_fatigue: /(?:\b(burnout|burned out|burnt out|exhausted|exhaustion|brain fog|lethargy|overworked|depleted|no energy|drained|tired of working|work fatigue|worn out|thak gaya|thakan|agotamiento|epuisement|erschopfung)\b|थकान|थक गया|ऊर्जा नहीं|बहुत थक|सुस्ती|निढाल)/i,
  panic_dysregulation: /(?:\b(panic|panic attack|heart racing|palpitations|cannot breathe|suffocating|trembling|cold chills|hot flashes|doom|shaking|chest pounding|loss of control|gasping|hyperventilating|saas nahi|ghutan|ataque de panico|panique)\b|घबराहट का दौरा|सांस नहीं|घुटन|दिल तेजी से|कांप रहा)/i,
  major_depressive_inertia: /(?:\b(depressed|depression|low mood|feeling down|empty|emptiness|hopeless|hopelessness|despair|anhedonia|unmotivated|no point|cannot get out of bed|worthless|useless|numb|sad|sadness|sorrow|crying|weep|weeping|tears|gloom|gloomy|downhearted|miserable|udaas|udaasi|depresion|tristesse)\b|उदास|उदासी|निराशा|रोना|रो रहा|कुछ अच्छा नहीं|मन उदास)/i,
  imposter_perfectionism: /(?:\b(imposter|impostor|fraud|failure|failed|failing|perfectionist|perfectionism|not good enough|incompetent|will be exposed|cheat|mess up|messing up|fear of failing|kabil nahi)\b|काबिल नहीं|नाकाबिल|असफल|असफलता का डर)/i,
  relationship_heartbreak: /(?:\b(breakup|broke up|ex-|ex boyfriend|ex girlfriend|partner|husband|wife|fight|argument|heartbreak|broken heart|rejection|unloved|abandoned|abandonment|cheated|divorce|infidelity|betrayed by|dil toot|rupture)\b|दिल टूट|ब्रेकअप|रिश्ता टूट|धोखा दिया|झगड़ा हुआ)/i,
  existential_loneliness: /(?:\b(lonely|loneliness|all alone|isolated|isolation|nobody cares|no friends|alienated|alienation|empty world|disconnected|no one to talk to|solitary|friendless|akela|akelepan|soledad|solitude|einsamkeit)\b|अकेला|अकेलापन|कोई नहीं है|तनहाई|अलग-थलग)/i,
  anger_frustration_dysregulation: /(?:\b(angry|anger|furious|fury|rage|raging|mad|irritated|irritation|annoyed|annoyance|frustrated|frustration|unfair|unfairness|hate them|screaming|boss yelled|yelled at me|injustice|betrayed|temper|resentment|gussa|krodh|colere|wut)\b|गुस्सा|क्रोध|चिड़चिड़ाहट|नाराज|क्रोधित|गुस्सा आ रहा)/i,
  grief_bereavement: /(?:\b(grief|grieving|bereavement|loss of|died|passed away|mourning|sorrow|funeral|lost my dog|lost my cat|lost my parent|lost my loved one|passed on|deceased|weeping for|shok|duelo|deuil|trauer)\b|शोक|मौत|गुजर गए|खो दिया|शोकग्रस्त)/i,
  social_evaluative_threat: /(?:\b(social anxiety|shy|shyness|embarrassed|embarrassment|judging me|public speaking|awkward|crowds|humiliated|presentation|speech anxiety|people staring|stage fear|stage fright|sharm|timide)\b|शर्म|झिझक|स्टेज का डर|लोग क्या सोचेंगे|मंच का डर)/i,
  adhd_executive_overwhelm: /(?:\b(adhd|procrastinate|procrastinating|procrastination|task paralysis|cannot start|overwhelmed with tasks|distract|distracted|distraction|executive dysfunction|frozen|stuck on tasks|can't focus|cannot focus|unable to focus)\b|ध्यान नहीं लग रहा|टालमटोल|काम शुरू नहीं|फोकस नहीं)/i,
  insomnia_hyperarousal: /(?:\b(insomnia|cannot sleep|cant sleep|waking up|sleep trouble|sleepless|sleeplessness|staying awake|lying in bed|midnight|toss and turn|tossing and turning|bedtime racing|sleep anxiety|wakeful|neend nahi|insomnio|insomnie|schlaflosigkeit)\b|नींद नहीं|सो नहीं पा रहा|अनिद्रा|जाग रहा)/i,
  health_somatic_anxiety: /(?:\b(health anxiety|hypochondria|illness|disease|cancer|heart attack|checking pulse|medical symptoms|sick|tumor|body sensation|googling symptoms|bimaari)\b|बीमारी का डर|सेहत की चिंता|रोग|लक्षण)/i,
  trauma_hypervigilance: /(?:\b(trauma|traumatic|ptsd|flashback|flashbacks|triggered|hypervigilant|hypervigilance|abuse|assault|startled|safe space|nightmares|visceral reaction)\b|सदमा|पुराना सदमा|डरावने सपने|आघात)/i,
  ocd_intrusive_rumination: /(?:\b(ocd|intrusive thought|intrusive thoughts|pure o|pure-o|bad thoughts|disturbing thought|unwanted thought|mental check|reassurance seeking|thought action fusion|compulsion|compulsive|rumination|ruminating|bure vichar)\b|बुरे विचार|अवांछित विचार|बार बार वही सोच)/i,
  compassion_fatigue_caregiver: /(?:\b(caregiver|caregiving|taking care of my|caring for sick|caring for elderly|caregiver burnout|caregiver fatigue|secondary trauma|empathic strain|empathy burnout|caretaker)\b|देखभाल का तनाव|मरीज की देखभाल|केयरगिवर)/i,
  decision_paralysis_ambivalence: /(?:\b(decision paralysis|cannot decide|cant decide|hard to choose|choice overload|too many options|analysis paralysis|paralyzed by choice|afraid of making wrong choice|indecisive|indecision|dilemma)\b|फैसला नहीं कर पा रहा|असमंजस|क्या चुनूं|निर्णय नहीं)/i,
  shame_core_defectiveness: /(?:\b(shame|ashamed|toxic shame|deeply flawed|defective|fundamentally broken|unworthy|hate myself|disgusted with myself|want to disappear|sharmindagi|vergüenza|honte|scham)\b|शर्मिंदगी|खुद से नफरत|अपराधबोध|खामी)/i,
  workplace_mobbing_toxic_culture: /(?:\b(toxic workplace|toxic boss|toxic manager|gaslighting boss|workplace mobbing|workplace harassment|coworker sabotage|hostile workplace|sunday dread|corporate politics|office politics)\b|ऑफिस का तनाव|बॉस की डांट|कार्यस्थल)/i,
  somatic_chronic_pain_amplification: /(?:\b(chronic pain|neuroplastic pain|back pain|fibromyalgia|pain reprocessing|tension headache|pain flare|somatic tracking|central sensitization|migraine|body ache|neck pain|muscle ache|dard)\b|दर्द|सिरदर्द|पीठ दर्द|बदन दर्द|माइग्रेन)/i,
  cognitive_memory_brain_fog: /(?:\b(memory|memories|weak memory|week memory|bad memory|poor memory|loose memory|lose memory|losing memory|forget|forgetful|forgetfulness|forgetting|forgot|cannot remember|cant remember|hard to remember|recall|short term memory|working memory|brain fog|mental fog|cloudy head|absent minded|cognitive fatigue|mental exhaustion|yaad nahi|yaaddasht|bhool|bhul gaya|bhul jata|memoria|oubli|gedachtnis|vergesslich)\b|याददाश्त|याद नहीं|भूल जाता|भूलना|कमजोर याददाश्त|दिमागी धुंध)/i,
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
  cognitive_memory_brain_fog: {
    name: 'Bhramari Cranial Resonance Breath',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 1,
    description: 'Humming sound vibrations stimulate cerebral nitric oxide production, clearing mental fog and soothing cognitive fatigue.',
  },
};

/**
 * Semantic & Keyword-Weighted Matcher for Clinical Conditions
 */
export function queryPsychologyLibrary(userText: string): LibraryRAGResult | null {
  if (!userText || !userText.trim()) return null;

  // Autonomous background self-learning: retrieve and index free clinical documents for new queries
  try {
    learnAndIndexQuery(userText).catch(() => {});
  } catch {
    // Non-blocking background task
  }

  let rawLower = userText.toLowerCase();
  // Pre-normalize common phonetic typos and transliterations
  rawLower = rawLower
    .replace(/\bweek\s+memory\b/g, 'weak memory')
    .replace(/\bloose\s+memory\b/g, 'lose memory')
    .replace(/\bpanick\b/g, 'panic')
    .replace(/\btierd\b/g, 'tired')
    .replace(/\bdepresed\b/g, 'depressed')
    .replace(/\bforgoting\b/g, 'forgetting');

  const words = rawLower.split(/[\s,.;:!?()]+/).filter((w) => w.length >= 3);

  let bestMatch: PsychologyCondition | null = null;
  let highestScore = 0;
  let matchedTerms: string[] = [];

  const allConditions: PsychologyCondition[] = [...PSYCHOLOGY_LIBRARY, ...DYNAMIC_LEARNED_DOCUMENTS];

  for (const condition of allConditions) {
    let score = 0;
    const currentMatched: string[] = [];

    // 1. Direct Trigger Pattern Matching (Massive weight +12)
    const triggerRegex = CLINICAL_TRIGGER_PATTERNS[condition.id];
    if (triggerRegex && triggerRegex.test(rawLower)) {
      score += 12;
      currentMatched.push(`pattern:${condition.id}`);
    }

    // 1b. Dynamic Learned Document Trigger match (+12)
    const learnedTrigger = (condition as LearnedPsychologyDocument).query_trigger;
    if (learnedTrigger && (rawLower.includes(learnedTrigger.toLowerCase()) || learnedTrigger.toLowerCase().includes(rawLower))) {
      score += 12;
      currentMatched.push(`learned_trigger:${condition.id}`);
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

  // Fallback to Neuroscience Emotion Classifier when lexical/trigger threshold is not reached
  if (!bestMatch || highestScore < 4) {
    try {
      const diag = emotionClassifier.classifyText(userText);
      const dimId = diag.dimensionId || '';

      const dimensionToConditionMap: Record<string, string> = {
        anxiety: 'gad',
        fear: 'panic_dysregulation',
        horror: 'trauma_hypervigilance',
        sadness: 'major_depressive_inertia',
        anger: 'anger_frustration_dysregulation',
        disgust: 'shame_core_defectiveness',
        boredom: 'burnout_fatigue',
        awkwardness: 'social_evaluative_threat',
        confusion: 'cognitive_memory_brain_fog',
        craving: 'adhd_executive_overwhelm',
        empathic_pain: 'compassion_fatigue_caregiver',
        entrancement: 'existential_loneliness',
        excitement: 'panic_dysregulation',
        interest: 'adhd_executive_overwhelm',
        joy: 'major_depressive_inertia',
        nostalgia: 'grief_bereavement',
        pride: 'imposter_perfectionism',
        relief: 'burnout_fatigue',
        romance: 'relationship_heartbreak',
        satisfaction: 'imposter_perfectionism',
        surprise: 'panic_dysregulation',
        calmness: 'burnout_fatigue',
        admiration: 'imposter_perfectionism',
        adoration: 'relationship_heartbreak',
        aesthetic_appreciation: 'existential_loneliness',
        amusement: 'burnout_fatigue',
        sexual_desire: 'relationship_heartbreak',
      };

      const mappedId =
        dimensionToConditionMap[dimId] ||
        (rawLower.includes('memory') || rawLower.includes('fog') || rawLower.includes('recall') || rawLower.includes('forget')
          ? 'cognitive_memory_brain_fog'
          : 'burnout_fatigue');
      const fallbackCondition = getConditionById(mappedId) || getConditionById('cognitive_memory_brain_fog') || PSYCHOLOGY_LIBRARY[0];
      if (fallbackCondition) {
        bestMatch = fallbackCondition;
        highestScore = 4;
        matchedTerms = [`emotion:${dimId}`];
      }
    } catch {
      bestMatch = getConditionById('cognitive_memory_brain_fog') || PSYCHOLOGY_LIBRARY[0];
      highestScore = 4;
      matchedTerms = ['fallback_cognitive'];
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

    const learnedDoc = bestMatch as LearnedPsychologyDocument;
    const isLearned = Boolean(learnedDoc.source_url);

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
        sourceUrl: learnedDoc.source_url,
        sourcePlatform: learnedDoc.source_platform,
        isLearnedDocument: isLearned,
      },
    };
  }

  return null;
}

/**
 * Gets a condition by its unique ID (searches bundled conditions and learned documents)
 */
export function getConditionById(id: string): PsychologyCondition | undefined {
  return (
    PSYCHOLOGY_LIBRARY.find((c) => c.id === id) ||
    DYNAMIC_LEARNED_DOCUMENTS.find((c) => c.id === id)
  );
}

/**
 * Returns all available conditions in the library (bundled + dynamically learned)
 */
export function getAllConditions(): PsychologyCondition[] {
  return [...PSYCHOLOGY_LIBRARY, ...DYNAMIC_LEARNED_DOCUMENTS];
}

/**
 * Returns all dynamically self-learned psychology documents
 */
export function getAllLearnedDocuments(): LearnedPsychologyDocument[] {
  return getLearnedDocuments();
}

/**
 * Manually adds a newly learned condition to the active library
 */
export function addLearnedCondition(doc: LearnedPsychologyDocument): void {
  addLearnedDocument(doc);
}
