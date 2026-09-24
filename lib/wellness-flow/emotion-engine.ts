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

import { detectCrisis, CrisisDetectionResult } from '../safety/crisis-detector';
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
      'dread', 'tense', 'restless', 'uneasy', 'racing heart', 'chinta', 'ghabrahat',
      'bechaini', 'dar', 'चिंता', 'घबराहट', 'बेचैनी', 'डर'
    ],
    themes: ['future_uncertainty', 'loss_of_control', 'performance_pressure'],
    baseIntensity: 7,
  },
  overthinking: {
    keywords: [
      'overthinking', 'racing thoughts', 'cannot stop thinking', "can't turn off my brain",
      'replay', 'replaying', 'spiral', 'spiraling', 'looping', 'ruminating', 'rumination',
      'mind won\'t stop', 'soch raha hoon', 'dimag ghum raha', 'विचारों का भटकाव', 'अति विचार'
    ],
    themes: ['racing_mind', 'cognitive_overload', 'analysis_paralysis'],
    baseIntensity: 6,
  },
  sadness: {
    keywords: [
      'sad', 'sadness', 'depressed', 'depression', 'down', 'crying', 'weeping',
      'unhappy', 'sorrow', 'heavy heart', 'miserable', 'heartbroken', 'udas', 'dukhi',
      'rona', 'dard', 'उदासी', 'दुख', 'रोना', 'उदास'
    ],
    themes: ['emotional_loss', 'emptiness', 'low_energy'],
    baseIntensity: 6,
  },
  anger: {
    keywords: [
      'angry', 'anger', 'mad', 'furious', 'rage', 'irritated', 'annoyed',
      'frustrated', 'resentful', 'betrayed', 'pissed', 'unfair', 'gussa', 'krodh',
      'naraz', 'क्रोध', 'गुस्सा', 'नाराज', 'चिढ़'
    ],
    themes: ['boundary_violation', 'unmet_expectations', 'interpersonal_conflict'],
    baseIntensity: 8,
  },
  stress: {
    keywords: [
      'stressed', 'stress', 'overwhelmed', 'burnout', 'burnt out', 'too much work',
      'pressure', 'exhausted', 'cannot cope', 'deadline', 'burden', 'tanaav', 'bojh',
      'तनाव', 'बोझ', 'थकान'
    ],
    themes: ['workload_overload', 'time_pressure', 'depleted_capacity'],
    baseIntensity: 7,
  },
  loneliness: {
    keywords: [
      'lonely', 'loneliness', 'alone', 'isolated', 'nobody understands', 'abandoned',
      'no one cares', 'distant', 'alienated', 'akela', 'akelapan', 'अकेलापन', 'अकेला'
    ],
    themes: ['social_disconnection', 'lack_of_belonging', 'isolation'],
    baseIntensity: 6,
  },
  guilt: {
    keywords: [
      'guilty', 'guilt', 'ashamed', 'shame', 'my fault', 'regret', 'should have',
      'let them down', 'failed everyone', 'stupid mistake', 'galti', 'apradh bodh',
      'गलती', 'पछतावा', 'अपराधबोध'
    ],
    themes: ['self_condemnation', 'perceived_failure', 'unforgiven_mistake'],
    baseIntensity: 7,
  },
  fear: {
    keywords: [
      'afraid', 'fear', 'scared', 'terrified', 'frightened', 'horrified',
      'threatened', 'unsafe', 'phobia', 'khauf', 'bhaya', 'भय', 'खौफ'
    ],
    themes: ['threat_response', 'vulnerability', 'safety_crisis'],
    baseIntensity: 8,
  },
  'low motivation': {
    keywords: [
      'unmotivated', 'no motivation', 'lazy', 'cannot start', 'procrastinating',
      'pointless', 'drained', 'apathy', 'stuck', 'don\'t feel like doing anything',
      'mann nahi kar raha', 'alashya', 'मन नहीं लगना', 'आलस्य', 'उदासीनता'
    ],
    themes: ['low_dopamine', 'purpose_deficit', 'action_inertia'],
    baseIntensity: 5,
  },
};

export class DefaultNLPAnalysisProvider implements INLPAnalysisProvider {
  public analyze(text: string): NLPAnalysisResult {
    const lower = text.toLowerCase().trim();
    const scores: Record<string, number> = {};

    for (const [emotion, lexicon] of Object.entries(EMOTION_LEXICONS)) {
      let score = 0;
      for (const kw of lexicon.keywords) {
        if (kw.includes(' ')) {
          if (lower.includes(kw)) score += 3.5;
        } else {
          // Word boundary or substring
          const reg = new RegExp(`(^|[^a-zA-Z0-9_\u0900-\u097F])${kw}([^a-zA-Z0-9_\u0900-\u097F]|$)`, 'i');
          if (reg.test(lower)) score += 2.0;
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
      if (second && second[1] > 1.5) {
        secondary_emotion = second[0];
      }
    } else {
      // General fallbacks if no exact keywords matched
      if (lower.includes('work') || lower.includes('boss') || lower.includes('office') || lower.includes('job')) {
        primary_emotion = 'stress';
        confidence = 0.55;
      } else if (lower.includes('heart') || lower.includes('feel') || lower.includes('crying')) {
        primary_emotion = 'sadness';
        confidence = 0.52;
      } else {
        primary_emotion = 'overthinking';
        confidence = 0.45;
      }
    }

    // Determine Intensity (1 to 10)
    let intensity = EMOTION_LEXICONS[primary_emotion]?.baseIntensity || 6;
    if (/(extremely|unbearable|terrible|horrible|panic|so much|cant take it|can't take it|dying|shaking|very|bahut|zyada)/i.test(lower)) {
      intensity = Math.min(10, intensity + 3);
    } else if (/(a little|somewhat|slightly|mildly|a bit|thoda|halka)/i.test(lower)) {
      intensity = Math.max(1, intensity - 3);
    }

    // Root Theme Extraction
    let root_theme = EMOTION_LEXICONS[primary_emotion]?.themes[0] || 'general_distress';
    if (lower.includes('work') || lower.includes('job') || lower.includes('boss') || lower.includes('career') || lower.includes('exam')) {
      root_theme = 'work_and_career_pressure';
    } else if (lower.includes('partner') || lower.includes('husband') || lower.includes('wife') || lower.includes('friend') || lower.includes('relationship')) {
      root_theme = 'interpersonal_relationship';
    } else if (lower.includes('health') || lower.includes('body') || lower.includes('sick') || lower.includes('sleep')) {
      root_theme = 'somatic_wellbeing';
    } else if (lower.includes('future') || lower.includes('what if') || lower.includes('happen')) {
      root_theme = 'future_uncertainty';
    }

    // Sentiment
    let sentiment: NLPAnalysisResult['sentiment'] = 'negative';
    if (/(happy|peaceful|good|doing fine|great|calm|content)/i.test(lower)) {
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
