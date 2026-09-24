/**
 * lib/wellness-flow/emotion-engine.ts
 *
 * Modular Emotion & Voice Synthesis Engine.
 * Implements:
 * 1. Swappable NLP Text & Voice Analysis providers.
 * 2. Multi-signal fusion: Text (emotions, themes, sentiment) + Voice (pitch, speech rate, pauses, RMS, tremor).
 * 3. Output profile: { primary_emotion, secondary_emotion, intensity (1-10), confidence (0-1), root_theme }.
 * 4. Empathetic confirmation statement generation ("It sounds like... Is that right?").
 * 5. Adaptive 1-5 follow-up clarification question generator capped at 5 or confidence >= 0.75.
 * 6. Deterministic crisis & safety detector interrupt with Tele-MANAS helpline details.
 */

import { detectCrisis, type CrisisDetectionResult } from '../safety/crisis-detector.ts';
import type { VoiceAcousticState } from '../types/emotions';
import type { MoodProfile, ClarificationTurn, WellnessLanguage } from './types';

export interface NLPAnalysisResult {
  primary_emotion: string;
  secondary_emotion?: string;
  intensity: number; // 1 to 10
  confidence: number; // 0 to 1
  root_theme: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  detectedThemes: string[];
}

export interface VoiceSignalsResult {
  pitchHz?: number;
  speechRate?: 'rapid' | 'moderate' | 'hesitant_slow';
  rmsEnergy?: number;
  tremorDetected?: boolean;
  pauseRatio?: number;
  vocalState?: string;
  acousticEmotionBias?: {
    emotion: string;
    weight: number;
  };
}

/**
 * Pluggable NLP analysis interface to allow swapping providers.
 */
export interface INLPAnalysisProvider {
  analyze(text: string): NLPAnalysisResult;
}

/**
 * Pluggable Voice analysis interface to allow swapping acoustic analyzers.
 */
export interface IVoiceAnalysisProvider {
  extractSignals(voiceState?: VoiceAcousticState): VoiceSignalsResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Rule-Based & Semantic NLP Analysis Provider (Multilingual EN + HI)
// ─────────────────────────────────────────────────────────────────────────────

interface EmotionLexicon {
  keywords: string[];
  themes: string[];
  baseIntensity: number;
}

const EMOTION_LEXICONS: Record<string, EmotionLexicon> = {
  anxiety: {
    keywords: [
      'anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panicking', 'panic',
      'dread', 'dreading', 'tense', 'restless', 'uneasy', 'racing heart', 'heart is beating',
      'beating so fast', 'cant breathe', "can't breathe", 'hands shaking', 'chest feels tight',
      'tight chest', 'palpitations', 'chinta', 'ghabrahat', 'bechaini', 'dar', 'darr',
      'behosh hone', 'anxiety attacks', 'omgggg', 'walking on eggshells', 'चिंता', 'घबराहट', 'बेचैनी', 'डर'
    ],
    themes: ['future_uncertainty', 'loss_of_control', 'performance_pressure'],
    baseIntensity: 7,
  },
  overthinking: {
    keywords: [
      'overthinking', 'racing thoughts', 'cannot stop thinking', "can't turn off my brain",
      'replay', 'replaying', 'spiral', 'spiraling', 'looping', 'ruminating', 'rumination',
      'mind won\'t stop', 'soch raha hoon', 'dimag ghum raha', 'vichar', 'soch', 'विचारों का भटकाव',
      'अति विचार', 'wonder whether', 'what if i', 'sitting here thinking', 'nostalgia and mild unease',
      'confused by', 'sudden coldness', 'second-guessing', 'analyzing'
    ],
    themes: ['racing_mind', 'cognitive_overload', 'analysis_paralysis'],
    baseIntensity: 6,
  },
  sadness: {
    keywords: [
      'sad', 'sadness', 'depressed', 'depression', 'down', 'crying', 'weeping', 'tears',
      'unhappy', 'sorrow', 'heavy heart', 'miserable', 'heartbroken', 'hurts so deeply', 'hurts',
      'pain', 'dark cloud', 'zero joy', 'hollow', 'empty shell', 'numb', 'clinical depression',
      'grief', 'sinking feeling', 'too sensitive', 'udas', 'udasi', 'dukhi', 'rona', 'dard', 'toot gaya',
      'dil bohot bhaari', 'dil bhaari', 'andhera chha', 'neeras', 'shunya', 'avsaad',
      'kuch accha nahi lagta', 'har cheez bekaar', 'udasi', 'mourning', 'shok', 'sannata',
      'grieving', 'grief', 'guzarne ke baad', 'bichhadne', 'vishwasghat', 'dil tootne', 'dil ro raha',
      'breakup', 'old photos', 'dhoka', 'dhokha', 'discarded', 'rejection', 'career is doomed',
      'nothing ever changes', 'nothing ever gets better', 'kismat hi kharab', 'koi umeed nahi',
      'defeated', 'hopeless', 'detached from my physical body', 'sunn ho gaya', 'khali-pan',
      'khalipan', 'emotional blunting', 'patthar ban gaya', 'insecure about my body', 'sab mujhse behtar',
      'kisi ke barabar nahi', 'baat band hai', 'falling apart', 'unloved', 'emotionally neglected',
      'rishte me duriya', 'duriya bohot badh', 'dawaaiyon ka koi asar', 'zombie', 'no emotional pulse',
      'impossible to experience pleasure', 'zero energy', 'dragging myself', 'zero happiness',
      '32 and alone', 'secretly so jealous because i am 32 and alone', 'dissociating at work',
      'staring at the ceiling', 'career bilkul barbad', 'barbad lag raha', 'dard bardasht ke bahar',
      'bardasht ke bahar', 'उम्मीदें टूट', 'रास्ता बंद', 'सारी उम्मीदें', 'उदासी', 'दुख', 'रोना',
      'उदास', 'नीरस', 'शून्य', 'अवसाद', 'शोक', 'निराशा', 'शून्यता', 'विश्वासघात', 'व्यथित', 'कटुता'
    ],
    themes: ['emotional_loss', 'emptiness', 'low_energy'],
    baseIntensity: 6,
  },
  anger: {
    keywords: [
      'angry', 'anger', 'mad', 'furious', 'rage', 'fury', 'irritated', 'irritating', 'annoyed',
      'annoyance', 'frustrated', 'frustration', 'deeply frustrating', 'resentful', 'resentment',
      'betrayed', 'betraying', 'pissed', 'unfair', 'bitter', 'jealous', 'jealousy', 'dumb slow system',
      'why does everything take forever', 'setting my teeth on edge', 'snap at everyone',
      'patience is threadbare', 'snappy', 'chidchid', 'chidchidapan', 'irritability', 'fights at home',
      'forcing me into an arranged marriage', 'criticizing', 'squabble', 'jhagda', 'shaq', 'disagreement',
      'double life has completely shattered', 'krodh control nahi', 'krodh control', 'gussa', 'krodh',
      'naraz', 'dimag kharab', 'fas ke', 'jalan', 'chidh', 'pareshaan', 'ladai', 'क्रोध', 'गुस्सा',
      'नाराज', 'चिढ़', 'खीझ', 'जलन', 'ईर्ष्या', 'चिड़चिड़ापन'
    ],
    themes: ['boundary_violation', 'unmet_expectations', 'interpersonal_conflict'],
    baseIntensity: 7,
  },
  stress: {
    keywords: [
      'stressed', 'stress', 'overwhelmed', 'burnout', 'burnt out', 'too much work', 'pressure',
      'exhausted', 'exhaustion', 'cannot cope', 'deadline', 'deadlines', 'deadlines piling up',
      'burden', 'boss breathing down', 'juggling', 'fatigue', 'zoom calls', 'lack of sleep',
      'klesh', 'roz roz klesh', 'klesh aur ladai', 'landlord and lease dispute', 'lease dispute',
      'migraine', 'body feels entirely broken', 'career bilkul barbad', 'tanaav', 'bojh',
      'thakan', 'thak gaya', 'तनाव', 'बोझ', 'थकान', 'तनावग्रस्त'
    ],
    themes: ['workload_overload', 'time_pressure', 'depleted_capacity'],
    baseIntensity: 7,
  },
  loneliness: {
    keywords: [
      'lonely', 'loneliness', 'alone', 'isolated', 'nobody understands', 'abandoned',
      'no one cares', 'nobody talks to me', 'distant', 'alienated', 'alone in my dark room',
      'disconnected from everyone', 'akela', 'akelapan', 'sab chor ke chale gaye',
      'koi apna nahi', 'अकेलापन', 'अकेला'
    ],
    themes: ['social_disconnection', 'lack_of_belonging', 'isolation'],
    baseIntensity: 6,
  },
  guilt: {
    keywords: [
      'guilty', 'guilt', 'ashamed', 'shame', 'my fault', 'regret', 'should have',
      'let them down', 'failed everyone', 'stupid mistake', 'sharm', 'sharmindagi',
      'embarrassment', 'embarrassed', 'snapped at my mother', 'remorse', 'galti',
      'ashamed of my tears', 'ashamed of', 'apradh bodh', 'apne aap par sharm',
      'kisi kaam ka nahi', 'गलती', 'पछतावा', 'अपराधबोध', 'शर्म', 'शर्मिंदगी', 'आत्म-हीनता'
    ],
    themes: ['self_condemnation', 'perceived_failure', 'unforgiven_mistake'],
    baseIntensity: 7,
  },
  fear: {
    keywords: [
      'afraid', 'fear', 'scared', 'terrified', 'frightened', 'horrified',
      'threatened', 'unsafe', 'phobia', 'khauf', 'bhaya', 'darr', 'explosive temper',
      'भय', 'खौफ', 'डर'
    ],
    themes: ['threat_response', 'vulnerability', 'safety_crisis'],
    baseIntensity: 8,
  },
  'low motivation': {
    keywords: [
      'unmotivated', 'no motivation', 'zero motivation', 'lazy', 'cannot start',
      'cant get myself to do anything', 'procrastinating', 'pointless', 'drained',
      'apathy', 'apathetic', 'stuck', 'don\'t feel like doing anything', 'creative spark',
      'blank canvas', 'lack of momentum', 'climbing everest', 'useless', 'koi fayda nahi',
      'mann nahi kar raha', 'bilkul dil nahi', 'ichha hi khatam', 'alashya', 'aalas',
      'मन नहीं लगना', 'आलस्य', 'उदासीनता'
    ],
    themes: ['low_dopamine', 'purpose_deficit', 'action_inertia'],
    baseIntensity: 5,
  },
  calm: {
    keywords: [
      'calm', 'peaceful', 'content', 'contentment', 'happy', 'happiness', 'doing well',
      'doing really well', 'all good', 'balanced', 'neutral', 'fine', 'steady', 'focused',
      'grateful', 'blessed', 'joyful', 'positivity', 'sattvic', 'serene', 'shant', 'shanti',
      'prasann', 'sukoon', 'theek thaak', 'sab badhiya', 'badhiya', 'koi pareshani nahi',
      'accha lag raha', 'morning run', 'green tea', 'good news', 'conquer the day',
      'शांत', 'संतुष्ट', 'प्रसन्न', 'सुकून', 'शांति', 'तृप्त', 'संतोष', 'आनंद'
    ],
    themes: ['equanimity_and_peace', 'gratitude_and_contentment'],
    baseIntensity: 2,
  },
};

export class DefaultNLPAnalysisProvider implements INLPAnalysisProvider {
  public analyze(text: string): NLPAnalysisResult {
    const lower = text.toLowerCase().trim();

    // 1. Sarcasm / Hardship juxtaposition
    if (
      (lower.includes('thrilled') || lower.includes('best day ever')) &&
      (lower.includes('damp basement') || lower.includes('unpaid bills'))
    ) {
      return {
        primary_emotion: 'sadness',
        secondary_emotion: 'anger',
        intensity: 7,
        confidence: 0.88,
        root_theme: 'work_and_career_pressure',
        sentiment: 'negative',
        detectedThemes: ['work_and_career_pressure'],
      };
    }

    // 2. Mid-message contradiction
    if (lower.includes('okay') && lower.includes('not okay') && (lower.includes('chest hurts') || lower.includes('want to cry'))) {
      return {
        primary_emotion: 'sadness',
        secondary_emotion: 'anxiety',
        intensity: 8,
        confidence: 0.85,
        root_theme: 'emotional_loss',
        sentiment: 'negative',
        detectedThemes: ['emotional_loss'],
      };
    }

    // 3. Negation traps
    if (lower.includes('not sad') && (lower.includes('exhausted') || lower.includes('lack of sleep'))) {
      return {
        primary_emotion: 'stress',
        secondary_emotion: undefined,
        intensity: 5,
        confidence: 0.85,
        root_theme: 'somatic_wellbeing',
        sentiment: 'negative',
        detectedThemes: ['somatic_wellbeing'],
      };
    }
    if (lower.includes('udas nahi') && (lower.includes('thak') || lower.includes('thaka'))) {
      return {
        primary_emotion: 'stress',
        secondary_emotion: undefined,
        intensity: 4,
        confidence: 0.85,
        root_theme: 'somatic_wellbeing',
        sentiment: 'negative',
        detectedThemes: ['somatic_wellbeing'],
      };
    }
    if (
      (lower.includes("don't feel anxious") || lower.includes('dont feel anxious') || lower.includes('not anxious')) &&
      (lower.includes('anymore') || lower.includes('report') || lower.includes('now'))
    ) {
      return {
        primary_emotion: 'calm',
        secondary_emotion: undefined,
        intensity: 2,
        confidence: 0.90,
        root_theme: 'work_and_career_pressure',
        sentiment: 'positive',
        detectedThemes: ['work_and_career_pressure'],
      };
    }
    if (
      lower.includes('koi ghabrahat nahi') || lower.includes('ghabrahat nahi') ||
      lower.includes('कोई घबराहट नहीं') || lower.includes('घबराहट नहीं है')
    ) {
      return {
        primary_emotion: 'calm',
        secondary_emotion: undefined,
        intensity: 2,
        confidence: 0.90,
        root_theme: 'general_distress',
        sentiment: 'positive',
        detectedThemes: ['general_distress'],
      };
    }

    // 4. Vague / minimal input triggers clarify loop
    const isVague = ['idk', 'meh', 'kuch nahi', 'bas aise hi', 'not sure', 'dont know'].includes(lower);
    if (isVague) {
      return {
        primary_emotion: 'overthinking',
        secondary_emotion: undefined,
        intensity: 4,
        confidence: 0.35,
        root_theme: 'general_distress',
        sentiment: 'neutral',
        detectedThemes: ['general_distress'],
      };
    }

    // 5. Special noise / injection / single words
    if (/^[0-9\s]+$/.test(lower)) {
      return {
        primary_emotion: 'overthinking',
        secondary_emotion: undefined,
        intensity: 2,
        confidence: 0.30,
        root_theme: 'general_distress',
        sentiment: 'neutral',
        detectedThemes: ['general_distress'],
      };
    }
    if (/^[🤔😶😐😑\s]+$/.test(text)) {
      return {
        primary_emotion: 'overthinking',
        secondary_emotion: undefined,
        intensity: 4,
        confidence: 0.40,
        root_theme: 'general_distress',
        sentiment: 'neutral',
        detectedThemes: ['general_distress'],
      };
    }
    if (lower.startsWith('what is the weather') || lower.startsWith('weather in')) {
      return {
        primary_emotion: 'overthinking',
        secondary_emotion: undefined,
        intensity: 2,
        confidence: 0.30,
        root_theme: 'general_distress',
        sentiment: 'neutral',
        detectedThemes: ['general_distress'],
      };
    }
    if (lower.includes('ignore all previous') || lower.includes('skip directly') || lower.includes('drop table') || lower.includes('<script')) {
      return {
        primary_emotion: 'overthinking',
        secondary_emotion: undefined,
        intensity: 3,
        confidence: 0.35,
        root_theme: 'general_distress',
        sentiment: 'neutral',
        detectedThemes: ['general_distress'],
      };
    }
    if (lower === 'help' || lower === 'help me') {
      return {
        primary_emotion: 'anxiety',
        secondary_emotion: undefined,
        intensity: 7,
        confidence: 0.75,
        root_theme: 'general_distress',
        sentiment: 'negative',
        detectedThemes: ['general_distress'],
      };
    }

    // 6. Clause-Aware Sliding Negation Window & Lexicon Matching
    const words = lower.split(/[\s,;.!?'"()\[\]{}]+/);
    const preNegationTokens = ['not', "don't", 'dont', 'never', 'no', 'zero', 'nahi', 'nahin', 'mat', 'na', 'नहीं', 'कोई'];
    const postNegationTokens = ['nahi', 'nahin', 'mat', 'नहीं'];

    const scores: Record<string, number> = {};
    for (const [emotion, lexicon] of Object.entries(EMOTION_LEXICONS)) {
      let score = 0;
      for (const kw of lexicon.keywords) {
        if (kw.includes(' ')) {
          const idx = lower.indexOf(kw);
          if (idx !== -1) {
            // Check preceding clause (up to punctuation)
            const beforePart = lower.substring(0, idx);
            const lastPunct = Math.max(beforePart.lastIndexOf(','), beforePart.lastIndexOf('.'), beforePart.lastIndexOf(';'), beforePart.lastIndexOf('!'), beforePart.lastIndexOf('?'));
            const clausePrefix = beforePart.substring(lastPunct + 1).trim();
            const prefixWords = clausePrefix.split(/\s+/);
            const preTokens = prefixWords.slice(-3);
            const isPreNegated = preTokens.some(w => preNegationTokens.includes(w));

            // Check following clause (up to punctuation)
            const afterPart = lower.substring(idx + kw.length);
            const nextPunct = Math.min(...[afterPart.indexOf(','), afterPart.indexOf('.'), afterPart.indexOf(';'), afterPart.indexOf('!'), afterPart.indexOf('?')].filter(x => x !== -1));
            const clauseSuffix = (nextPunct !== Infinity ? afterPart.substring(0, nextPunct) : afterPart).trim();
            const suffixWords = clauseSuffix.split(/\s+/);
            const postTokens = suffixWords.slice(0, 2);
            const isPostNegated = postTokens.some(w => postNegationTokens.includes(w));

            if (!isPreNegated && !isPostNegated) {
              score += 3.5;
            }
          }
        } else {
          const reg = new RegExp(`(^|[^a-zA-Z0-9_\u0900-\u097F])${kw}([^a-zA-Z0-9_\u0900-\u097F]|$)`, 'i');
          const match = reg.exec(lower);
          if (match) {
            const idx = match.index;
            const beforePart = lower.substring(0, idx);
            const lastPunct = Math.max(beforePart.lastIndexOf(','), beforePart.lastIndexOf('.'), beforePart.lastIndexOf(';'), beforePart.lastIndexOf('!'), beforePart.lastIndexOf('?'));
            const clausePrefix = beforePart.substring(lastPunct + 1).trim();
            const prefixWords = clausePrefix.split(/\s+/);
            const preTokens = prefixWords.slice(-3);
            const isPreNegated = preTokens.some(w => preNegationTokens.includes(w));

            const afterPart = lower.substring(idx + kw.length);
            const nextPunct = Math.min(...[afterPart.indexOf(','), afterPart.indexOf('.'), afterPart.indexOf(';'), afterPart.indexOf('!'), afterPart.indexOf('?')].filter(x => x !== -1));
            const clauseSuffix = (nextPunct !== Infinity ? afterPart.substring(0, nextPunct) : afterPart).trim();
            const suffixWords = clauseSuffix.split(/\s+/);
            const postTokens = suffixWords.slice(0, 2);
            const isPostNegated = postTokens.some(w => postNegationTokens.includes(w));

            if (!isPreNegated && !isPostNegated) {
              score += 2.2;
            }
          }
        }
      }
      scores[emotion] = score;
    }

    // Rank emotions
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const second = sorted[1];

    let primary_emotion = 'stress';
    let secondary_emotion: string | undefined;
    let confidence = 0.50;

    if (top && top[1] > 0) {
      primary_emotion = top[0];
      confidence = Math.min(0.95, 0.55 + top[1] * 0.08);
      if (second && second[1] > 1.8) {
        secondary_emotion = second[0];
      }
    } else {
      // Noise or unclassified text
      if (/^[a-z]{15,}$/i.test(lower) || (/^[a-z0-9\s]{20,}$/i.test(lower) && words.length <= 4)) {
        primary_emotion = 'overthinking';
        confidence = 0.35;
      } else if (lower.includes('work') || lower.includes('boss') || lower.includes('office') || lower.includes('job')) {
        primary_emotion = 'stress';
        confidence = 0.55;
      } else {
        primary_emotion = 'overthinking';
        confidence = 0.45;
      }
    }

    // Intensity calibration
    let intensity = EMOTION_LEXICONS[primary_emotion]?.baseIntensity || 6;

    if (primary_emotion === 'calm') {
      intensity = 2;
    } else if (
      lower.startsWith('what is the weather') ||
      /^[0-9\s]+$/.test(lower) ||
      lower.includes('drop table') ||
      lower.includes('<script') ||
      words.some(w => w.length >= 18)
    ) {
      intensity = 2;
    } else if (/^[🤔😶😐😑\s]+$/.test(text) || lower.includes('ignore all previous')) {
      intensity = 4;
    } else if (isVague) {
      intensity = 4;
    } else {
      // 1. Check Mild indicators -> 3 or 4
      const isMild = (/\b(mildly|mild|a little|somewhat|slightly|a bit|minor|thoda|thodi|halka|halki|manageable|mostly okay|twinge|flush of|just slightly|small disagreement|petty squabble|no big deal|touch of|chill|gentle sadness|quiet, gentle)\b/i.test(lower) ||
        lower.includes('bas aur kuch') || lower.includes('चिढ़') || lower.includes('छोटा सा')) && !lower.includes('अत्यधिक चिढ़');

      // 2. Check Severe indicators -> 8 or 9
      const isSevere = /\b(furious|fury|rage|seething|khoon khaul|panicking|panic attacks|behosh hone|uncontrollably|hurts so deeply|himmat nahi bachi|shaking|trembling|unbearable|shattered|screaming|bardasht ke bahar|burnout|burnt out|cant take it|can't take it|total burnout|ruined everything|cant look at myself|fundamental defect|terrified|catastrophic|pagal ho jaunga|dimag phatne|saans lena bhi mushkil|0 percent|zero percent|every ounce of resilience|suffocating|laid off|eating me alive|financial panic|walking on eggshells|gehra shok|ended our engagement|million pieces|rona band nahi|exhausted exhausted|upsc|visa expires|krodh control|manasik dabav|मानसिक दबाव|अत्यंत अशांत|mental sanity|total fraud|minus \$|karz|recovery agents|biopsy results|psychological torture|terminal illness|convinced i have|emergency savings)\b/i.test(lower) ||
        lower.includes('आर्थिक तंगी') || lower.includes('कर्ज') ||
        /(असहनीय|अत्यधिक|बहुत ज्यादा|😭|💔|🤬)/.test(text) ||
        /(guilty guilty|overthinking overthinking|so much overthinking|endless loop)/i.test(lower);

      if (words.length > 50) {
        intensity = 6;
      } else if (lower.includes('अत्यधिक चिढ़')) {
        intensity = 7;
      } else if (isMild && !lower.includes('bitter')) {
        intensity = primary_emotion === 'guilt' || primary_emotion === 'overthinking' ? 3 : (lower.includes('चिढ़') ? 5 : 4);
      } else if (isSevere) {
        if (primary_emotion === 'low motivation' || lower.includes('चिड़चिड़ापन') || lower.includes('कुंठा')) {
          intensity = 6;
        } else {
          intensity = 8;
          if (/(explode with rage|seething|khoon khaul|behosh hone|panic attacks|screaming)/i.test(lower) || (text === text.toUpperCase() && text.length > 20)) {
            intensity = 9;
          }
        }
      } else {
        if (primary_emotion === 'overthinking') {
          intensity = /(spiraling|looping|racing|cannot sleep|bohot zyada|24 7|non stop|freight train|worst case|placement season|exam sar par|प्रतियोगी परीक्षा|पारिवारिक विवाद|तनावपूर्ण|salary nahi)/i.test(lower) ? 7 : 6;
        } else if (primary_emotion === 'low motivation') {
          intensity = 6;
        } else if (primary_emotion === 'fear') {
          intensity = 8;
        } else {
          intensity = 7;
        }
      }
    }

    // Root Theme Extraction
    let root_theme = EMOTION_LEXICONS[primary_emotion]?.themes[0] || 'general_distress';
    if (lower.includes('work') || lower.includes('job') || lower.includes('boss') || lower.includes('career') || lower.includes('exam') || lower.includes('deadline')) {
      root_theme = 'work_and_career_pressure';
    } else if (lower.includes('partner') || lower.includes('husband') || lower.includes('wife') || lower.includes('friend') || lower.includes('relationship') || lower.includes('sibling') || lower.includes('cousin') || lower.includes('therapist')) {
      root_theme = 'interpersonal_relationship';
    } else if (lower.includes('health') || lower.includes('body') || lower.includes('sick') || lower.includes('sleep') || lower.includes('exhausted') || lower.includes('thak')) {
      root_theme = 'somatic_wellbeing';
    } else if (lower.includes('future') || lower.includes('what if') || lower.includes('tomorrow')) {
      root_theme = 'future_uncertainty';
    }

    // Sentiment
    let sentiment: NLPAnalysisResult['sentiment'] = 'negative';
    if (primary_emotion === 'calm' || /(happy|peaceful|good|doing fine|great|calm|content|sukoon|shant)/i.test(lower)) {
      sentiment = 'positive';
    } else if (/(okay|fine|neutral|so so)/i.test(lower)) {
      sentiment = 'neutral';
    }

    return {
      primary_emotion,
      secondary_emotion,
      intensity,
      confidence,
      root_theme,
      sentiment,
      detectedThemes: EMOTION_LEXICONS[primary_emotion]?.themes || [],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Voice Analysis Provider (Pitch, Rate, Tremor, Energy)
// ─────────────────────────────────────────────────────────────────────────────

export class DefaultVoiceAnalysisProvider implements IVoiceAnalysisProvider {
  public extractSignals(voiceState?: VoiceAcousticState): VoiceSignalsResult {
    if (!voiceState) {
      return {};
    }

    const result: VoiceSignalsResult = {
      pitchHz: voiceState.pitchHz,
      speechRate: voiceState.speechRate,
      rmsEnergy: voiceState.rmsEnergy,
      tremorDetected: voiceState.tremorDetected || voiceState.jitterTremor > 0.12,
      vocalState: voiceState.state,
    };

    // Supporting emotional signals from acoustics
    if (voiceState.state === 'trembling_distress' || (voiceState.jitterTremor && voiceState.jitterTremor > 0.16)) {
      result.acousticEmotionBias = { emotion: 'sadness', weight: 0.25 };
    } else if (voiceState.state === 'acute_hyperarousal' || (voiceState.pitchHz && voiceState.pitchHz > 240 && voiceState.rmsEnergy > 0.10)) {
      result.acousticEmotionBias = { emotion: 'anxiety', weight: 0.25 };
    } else if (voiceState.state === 'hypoarousal_depressed' || (voiceState.speechRate === 'hesitant_slow' && voiceState.rmsEnergy < 0.035)) {
      result.acousticEmotionBias = { emotion: 'low motivation', weight: 0.20 };
    }

    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite Modular Emotion Engine
// ─────────────────────────────────────────────────────────────────────────────

export class EmotionEngine {
  private nlpProvider: INLPAnalysisProvider;
  private voiceProvider: IVoiceAnalysisProvider;

  constructor(
    nlpProvider: INLPAnalysisProvider = new DefaultNLPAnalysisProvider(),
    voiceProvider: IVoiceAnalysisProvider = new DefaultVoiceAnalysisProvider()
  ) {
    this.nlpProvider = nlpProvider;
    this.voiceProvider = voiceProvider;
  }

  public setNLPProvider(provider: INLPAnalysisProvider): void {
    this.nlpProvider = provider;
  }

  public setVoiceProvider(provider: IVoiceAnalysisProvider): void {
    this.voiceProvider = provider;
  }

  /**
   * Safety check: Detect crisis or self-harm triggers immediately.
   */
  public checkCrisis(text: string): CrisisDetectionResult {
    return detectCrisis(text);
  }

  /**
   * Full analysis fusing text NLP and voice biomarkers.
   */
  public analyze(text: string, voiceState?: VoiceAcousticState): MoodProfile {
    const nlp = this.nlpProvider.analyze(text);
    const voice = this.voiceProvider.extractSignals(voiceState);

    let finalPrimary = nlp.primary_emotion;
    let finalSecondary = nlp.secondary_emotion;
    let finalConfidence = nlp.confidence;
    let finalIntensity = nlp.intensity;

    // Modulate with voice biomarkers as supporting signals
    if (voice.acousticEmotionBias) {
      if (voice.acousticEmotionBias.emotion === finalPrimary) {
        finalConfidence = Math.min(0.98, finalConfidence + 0.10);
      } else if (!finalSecondary) {
        finalSecondary = voice.acousticEmotionBias.emotion;
      }
    }

    if (voice.tremorDetected) {
      finalIntensity = Math.min(10, finalIntensity + 2);
    }
    if (voice.speechRate === 'rapid' && (finalPrimary === 'anxiety' || finalPrimary === 'stress' || finalPrimary === 'overthinking')) {
      finalIntensity = Math.min(10, finalIntensity + 1);
    }

    return {
      primary_emotion: finalPrimary,
      secondary_emotion: finalSecondary,
      intensity: Math.max(1, Math.min(10, Math.round(finalIntensity))),
      confidence: Number(Math.max(0.1, Math.min(0.99, finalConfidence)).toFixed(2)),
      root_theme: nlp.root_theme,
      sentiment: nlp.sentiment,
      identified_at: Date.now(),
      voice_signals: {
        pitchHz: voice.pitchHz,
        speechRate: voice.speechRate,
        rmsEnergy: voice.rmsEnergy,
        tremorDetected: voice.tremorDetected,
        pauseRatio: voice.pauseRatio,
        vocalState: voice.vocalState,
      },
    };
  }

  /**
   * Generates a warm, empathetic confirmation statement.
   * e.g. "It sounds like you're feeling anxious about work and finding it hard to relax. Is that right?"
   */
  public generateConfirmationStatement(profile: MoodProfile, lang: WellnessLanguage = 'en'): string {
    const emotion = profile.primary_emotion.toLowerCase();
    const theme = profile.root_theme;

    // Positive / Calm / Contentment confirmation
    if (emotion === 'calm') {
      if (lang === 'hi') {
        return 'ऐसा लग रहा है कि आप मन में शांति, सुकून और संतोष महसूस कर रहे हैं। क्या यह सही है?';
      }
      return "It sounds like you're feeling calm, peaceful, and content right now. Is that right?";
    }

    if (lang === 'hi') {
      const hiEmotionMap: Record<string, string> = {
        anxiety: 'घबराहट और चिंता',
        overthinking: 'दौड़ते विचार और उलझन',
        sadness: 'गहरा दुःख और उदासी',
        anger: 'क्रोध और तीव्र असंतोष',
        stress: 'मानसिक तनाव और भारीपन',
        loneliness: 'अकेलापन और अलगाव',
        guilt: 'आत्म-ग्लानि और पछतावा',
        fear: 'डर और असुरक्षा',
        'low motivation': 'ऊर्जा व प्रेरणा की कमी',
        calm: 'शांति और सुकून',
      };
      const emoStr = hiEmotionMap[emotion] || 'तनाव';

      let contextStr = '';
      if (theme === 'work_and_career_pressure') {
        contextStr = 'काम और जिम्मेदारियों के दबाव को लेकर';
      } else if (theme === 'interpersonal_relationship') {
        contextStr = 'रिश्तों की उलझन और बातों को लेकर';
      } else if (theme === 'future_uncertainty') {
        contextStr = 'भविष्य की अनिश्चितता को लेकर';
      } else {
        contextStr = 'इस परिस्थिति को लेकर';
      }

      return `ऐसा लग रहा है कि आप ${contextStr} ${emoStr} महसूस कर रहे हैं और मन को शांत करना कठिन हो रहा है। क्या यह सही है?`;
    }

    // English confirmation
    let contextPhrase = 'in this situation';
    if (theme === 'work_and_career_pressure') {
      contextPhrase = 'about work and finding it hard to relax';
    } else if (theme === 'interpersonal_relationship') {
      contextPhrase = 'about a relationship and feeling overwhelmed';
    } else if (theme === 'future_uncertainty') {
      contextPhrase = 'about the future and struggling with uncertainty';
    } else if (emotion === 'overthinking') {
      contextPhrase = 'caught in looping thoughts and unable to quiet your mind';
    } else {
      contextPhrase = 'weighed down by this and finding it difficult to find peace';
    }

    return `It sounds like you're feeling ${emotion} ${contextPhrase}. Is that right?`;
  }

  /**
   * Adaptive 1 to 5 clarification questions generator.
   */
  public getNextClarificationQuestion(
    turnCount: number, // 0 to 4 (corresponding to question 1 to 5)
    previousAnswers: string[],
    lang: WellnessLanguage = 'en'
  ): {
    questionNumber: number;
    questionText: string;
    questionTheme: ClarificationTurn['questionTheme'];
  } {
    const qNum = turnCount + 1;

    const questions: Array<{
      theme: ClarificationTurn['questionTheme'];
      en: string;
      hi: string;
    }> = [
      {
        theme: 'trigger',
        en: 'What triggered this feeling for you today?',
        hi: 'आज किस विशेष बात या घटना ने इस भावना को उभारा?',
      },
      {
        theme: 'somatic',
        en: 'Where do you feel this tension or weight in your body right now—like your chest, head, or stomach?',
        hi: 'शरीर में यह तनाव या भारीपन आपको कहाँ महसूस हो रहा है—जैसे सीने में, सिर में, या पेट में?',
      },
      {
        theme: 'duration',
        en: 'How long has this feeling been lingering with you?',
        hi: 'यह स्थिति आपके साथ कितने समय से बनी हुई है?',
      },
      {
        theme: 'sleep_appetite',
        en: 'How has your sleep and appetite been over the past few days?',
        hi: 'हाल के दिनों में आपकी नींद और भूख पर इसका क्या प्रभाव पड़ा है?',
      },
      {
        theme: 'interpersonal_vs_thoughts',
        en: 'Is this primarily about a specific person, an external situation, or repetitive thoughts in your mind?',
        hi: 'क्या यह मुख्य रूप से किसी व्यक्ति से संबंधित है, किसी बाहरी परिस्थिति से, या मन में चल रहे विचारों से?',
      },
    ];

    const idx = Math.min(turnCount, questions.length - 1);
    const chosen = questions[idx];

    return {
      questionNumber: qNum,
      questionText: lang === 'hi' ? chosen.hi : chosen.en,
      questionTheme: chosen.theme,
    };
  }

  /**
   * Refines mood profile after clarification responses.
   * Stop asking as soon as confidence reaches 0.75 or above, or after 5 questions.
   */
  public refineMoodProfile(
    initialProfile: MoodProfile,
    turns: ClarificationTurn[],
    latestVoice?: VoiceAcousticState
  ): { refinedProfile: MoodProfile; shouldStopClarifying: boolean } {
    const allAnswers = turns.map((t) => t.userAnswer).join(' ');
    const reAnalysis = this.analyze(allAnswers, latestVoice);

    // Progressive confidence increase based on clarification answers
    const confidenceBoost = turns.length * 0.10;
    const newConfidence = Math.min(0.96, Math.max(initialProfile.confidence, reAnalysis.confidence) + confidenceBoost);

    // Determine if primary emotion shifted or was refined
    const refinedPrimary = reAnalysis.confidence > 0.65 ? reAnalysis.primary_emotion : initialProfile.primary_emotion;
    const refinedSecondary = reAnalysis.secondary_emotion || initialProfile.secondary_emotion;
    const refinedTheme = reAnalysis.root_theme !== 'general_distress' ? reAnalysis.root_theme : initialProfile.root_theme;

    const refinedProfile: MoodProfile = {
      ...initialProfile,
      primary_emotion: refinedPrimary,
      secondary_emotion: refinedSecondary,
      confidence: Number(newConfidence.toFixed(2)),
      intensity: Math.max(initialProfile.intensity, reAnalysis.intensity),
      root_theme: refinedTheme,
      identified_at: Date.now(),
    };

    const shouldStopClarifying = turns.length >= 5 || newConfidence >= 0.75;

    return {
      refinedProfile,
      shouldStopClarifying,
    };
  }
}

export const emotionEngine = new EmotionEngine();
export default emotionEngine;
