/**
 * Modern Neuroscience Emotion Classifier
 * Implements:
 * 1. Lisa Feldman Barrett (Theory of Constructed Emotion - Core Affect Valence x Arousal & Interoceptive Construct)
 * 2. Alan Cowen & Dacher Keltner (27 Continuous Dimensions of Emotion, PNAS 2017)
 * 3. Lauri Nummenmaa (Bodily Maps of Emotion, PNAS 2014)
 */

import neuroscienceData from './modern-neuroscience-ontology.ts';

export interface BodilyMapRegionActivation {
  head: number;
  throat: number;
  chest: number;
  gut: number;
  arms: number;
  legs: number;
  somatic_summary: string;
}

export interface CoreAffectCoordinate {
  valence: number;
  arousal: number;
}

export interface NeuroscienceDiagnosticResult {
  dimensionId: string;
  dimensionName: string;
  cluster: string;
  color: string;
  coreAffect: CoreAffectCoordinate;
  bodilyMap: BodilyMapRegionActivation;
  semanticNeighbors: string[];
  barrettConstruct: string;
  somaticIntervention: string;
  confidence: number;
  intensity: 'mild' | 'moderate' | 'peak';
  metaIntent?: 'dialogue_complaint' | 'breathing_status' | 'general_answer' | 'emotional_expression';
  dimensionScores: Record<string, number>;
  doshicState: string;
  scientificRemedy: string;
  ayurvedicRemedy: string;
  combinedRemedyAction: string;
  remedyPermutations: string[];
  // Legacy aliases for backward-compatibility with UI widgets
  specificEmotion: string;
  axisName: string;
  axisId: string;
  polyvagalState: string;
  ekmanEquivalent: string;
  cowenParallel: string;
  cbtIntervention: string;
  dbtIntervention: string;
}

export type EmotionDiagnosticResult = NeuroscienceDiagnosticResult;

// Affective lexical primitives for continuous Core Affect vector projection
const VALENCE_MAP: Record<string, number> = {
  // Negative
  awful: -0.9, terrible: -0.9, horrible: -0.9, devastated: -0.95, depressed: -0.85,
  sad: -0.8, hopeless: -0.9, miserable: -0.85, weeping: -0.8, crying: -0.75,
  furious: -0.85, enraged: -0.9, angry: -0.7, mad: -0.65, annoyed: -0.4,
  irritated: -0.45, frustrated: -0.6, disgust: -0.7, repulsive: -0.8, sick: -0.6,
  scared: -0.75, terrified: -0.9, afraid: -0.7, panicking: -0.85, anxious: -0.65,
  nervous: -0.5, stressed: -0.6, worried: -0.55, uneasy: -0.45, tense: -0.5,
  guilty: -0.7, ashamed: -0.8, lonely: -0.75, heartbroken: -0.9, exhausted: -0.6,
  hurt: -0.7, grief: -0.85, mourning: -0.8, painful: -0.7, suffering: -0.8,
  failed: -0.85, fail: -0.8, stupid: -0.85, loser: -0.9, rejected: -0.85,
  rejection: -0.85, ruined: -0.85, broken: -0.8, lost: -0.7, messed: -0.75,
  overwhelmed: -0.75, burnout: -0.8, unloved: -0.85, betrayed: -0.9, cheated: -0.9,
  dumped: -0.85, helpless: -0.85, useless: -0.85, yelled: -0.75, tears: -0.75,

  // Positive
  joyful: 0.9, happy: 0.8, ecstatic: 0.95, thrilled: 0.9, delighted: 0.85,
  calm: 0.7, peaceful: 0.8, serene: 0.85, relaxed: 0.75, safe: 0.8,
  hopeful: 0.7, loving: 0.9, loved: 0.85, adore: 0.9, romantic: 0.85,
  grateful: 0.85, proud: 0.75, satisfied: 0.8, amused: 0.7, laughing: 0.8,
  funny: 0.7, inspired: 0.8, awestruck: 0.85, fascinated: 0.75, interested: 0.6,
  relieved: 0.75, healed: 0.8, steady: 0.65, grounded: 0.7, confident: 0.75,
  normal: 0.5, okay: 0.5, fine: 0.5, alright: 0.5, good: 0.6, 'doing well': 0.7,
};

const AROUSAL_MAP: Record<string, number> = {
  // High Arousal
  panicking: 0.95, terrified: 0.9, frantic: 0.9, screaming: 0.85, racing: 0.8,
  furious: 0.85, enraged: 0.9, ecstatic: 0.95, thrilled: 0.85, energized: 0.8,
  shocked: 0.85, alarmed: 0.8, excited: 0.8, intense: 0.75, pounding: 0.8,
  surprised: 0.75, agitated: 0.7, rushing: 0.7, hyper: 0.75, vibrating: 0.7,

  // Low Arousal
  heavy: -0.6, drained: -0.65, empty: -0.6, lifeless: -0.8, bored: -0.6,
  still: -0.65, quiet: -0.6, calm: -0.7, relaxed: -0.7, peaceful: -0.65,
  grounded: -0.5, resting: -0.7, slow: -0.5, mellow: -0.6, unmotivated: -0.6,
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface CowenDimension {
  id: string;
  name: string;
  cluster: string;
  color: string;
  core_affect: CoreAffectCoordinate;
  bodily_map: BodilyMapRegionActivation;
  semantic_neighbors: string[];
  barrett_construct: string;
  somatic_intervention: string;
  keywords: string[];
  lexical_triggers?: {
    primary?: string[];
    secondary?: string[];
    synonyms?: string[];
  };
  ayurvedic_remedy?: string;
  scientific_remedy?: string;
  doshic_nervous_system_state?: string;
  combined_remedy_action?: string;
  remedy_permutations?: string[];
  [key: string]: any;
}

export class NeuroscienceEmotionClassifier {
  private static instance: NeuroscienceEmotionClassifier;
  private dimensions: CowenDimension[] = neuroscienceData.cowen_dimensions;

  public static getInstance(): NeuroscienceEmotionClassifier {
    if (!NeuroscienceEmotionClassifier.instance) {
      NeuroscienceEmotionClassifier.instance = new NeuroscienceEmotionClassifier();
    }
    return NeuroscienceEmotionClassifier.instance;
  }

  /**
   * Classifies user utterance into exact 27-D Cowen category, Barrett Core Affect vector, and Nummenmaa Bodily Map.
   */
  public classifyText(text: string): NeuroscienceDiagnosticResult {
    if (!text || !text.trim()) {
      return this.getDimensionById('calmness', 'mild');
    }

    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 0. Meta-intent detection
    const isRepetitionComplaint =
      lower.includes('stop repeating') ||
      lower.includes('again and again') ||
      lower.includes('repeating the same') ||
      lower.includes('why do you keep asking') ||
      lower.includes('keep asking about breathing') ||
      lower.includes('you are stuck') ||
      lower.includes('you got stuck') ||
      lower.includes('stop asking') ||
      lower.includes('already told you');

    const isBreathingStatusAnswer =
      lower.includes('breathing is') ||
      lower.includes('breath is') ||
      lower.includes('it is fast') ||
      lower.includes('it is shallow') ||
      lower.includes('it is slow') ||
      lower.includes('it is fine') ||
      lower.includes('it is deep') ||
      lower.includes('it is tight') ||
      lower.includes("can't catch my breath") ||
      lower.includes('short of breath') ||
      lower.includes('heavy breathing');

    // 1. Somatosensory Mentions (Nummenmaa mapping)
    const hasChestTightness = lower.includes('chest') && (lower.includes('tight') || lower.includes('heavy') || lower.includes('pain') || lower.includes('burn') || lower.includes('ache') || lower.includes('constrict'));
    const hasHeartRacing = (lower.includes('heart') && (lower.includes('racing') || lower.includes('pound') || lower.includes('fast') || lower.includes('beat'))) || lower.includes('pulse');
    const hasThroatConstriction = lower.includes('throat') && (lower.includes('tight') || lower.includes('lump') || lower.includes('closed') || lower.includes('chok'));
    const hasGutChurning = (lower.includes('stomach') || lower.includes('gut') || lower.includes('belly')) && (lower.includes('knot') || lower.includes('churn') || lower.includes('sick') || lower.includes('butterfl'));
    const hasLimbHeaviness = (lower.includes('arms') || lower.includes('legs') || lower.includes('body') || lower.includes('limbs')) && (lower.includes('heavy') || lower.includes('lead') || lower.includes('exhaust') || lower.includes('drain') || lower.includes('weak'));
    const hasHeadTension = (lower.includes('head') || lower.includes('temple') || lower.includes('forehead')) && (lower.includes('tight') || lower.includes('pound') || lower.includes('ache') || lower.includes('fog') || lower.includes('spin'));

    // 2. Continuous 27-Dimension Keyword Frequency & Semantic Scoring
    const scores = new Map<string, number>();
    for (const dim of this.dimensions) {
      scores.set(dim.id, 0);
    }

    const words = lower.split(/[^a-zA-Z0-9_']+/).filter((w) => w.length > 2);

    for (const dim of this.dimensions) {
      let score = 0;

      // Match full multi-word keyword phrases
      for (const kw of dim.keywords) {
        const kwLower = kw.toLowerCase();
        if (kwLower.includes(' ')) {
          if (lower.includes(kwLower)) {
            score += 4.0;
          }
        } else {
          const regex = new RegExp(`\\b${escapeRegex(kwLower)}\\b`, 'i');
          if (regex.test(lower)) {
            score += 2.5;
          }
        }
      }

      // Boost from semantic neighbors
      for (const neighborName of dim.semantic_neighbors) {
        const neighborDim = this.dimensions.find((d) => d.name.toLowerCase() === neighborName.toLowerCase());
        if (neighborDim) {
          for (const nKw of neighborDim.keywords.slice(0, 5)) {
            if (lower.includes(nKw.toLowerCase())) {
              score += 0.6;
            }
          }
        }
      }

      scores.set(dim.id, (scores.get(dim.id) || 0) + score);
    }

    // Boost based on somatic maps
    if (hasChestTightness || hasHeartRacing) {
      scores.set('anxiety', (scores.get('anxiety') || 0) + 4);
      scores.set('fear', (scores.get('fear') || 0) + 3);
    }
    if (hasThroatConstriction) {
      scores.set('sadness', (scores.get('sadness') || 0) + 3);
      scores.set('awkwardness', (scores.get('awkwardness') || 0) + 2);
    }
    if (hasGutChurning) {
      if (lower.includes('butterflies') || lower.includes('flutter')) {
        scores.set('romance', (scores.get('romance') || 0) + 3);
        scores.set('excitement', (scores.get('excitement') || 0) + 3);
      } else {
        scores.set('anxiety', (scores.get('anxiety') || 0) + 3);
        scores.set('disgust', (scores.get('disgust') || 0) + 3);
      }
    }
    if (hasLimbHeaviness) {
      scores.set('sadness', (scores.get('sadness') || 0) + 4);
      scores.set('boredom', (scores.get('boredom') || 0) + 2);
    }
    if (hasHeadTension) {
      scores.set('confusion', (scores.get('confusion') || 0) + 3);
      scores.set('anger', (scores.get('anger') || 0) + 2);
      scores.set('anxiety', (scores.get('anxiety') || 0) + 2);
    }

    // Situational semantic boosts
    if (
      lower.includes('fail') || lower.includes('stupid') || lower.includes('loser') ||
      lower.includes('screwed up') || lower.includes('messed up') || lower.includes('rejection') ||
      lower.includes('rejected') || lower.includes('worthless') || lower.includes('useless')
    ) {
      scores.set('sadness', (scores.get('sadness') || 0) + 5);
      scores.set('awkwardness', (scores.get('awkwardness') || 0) + 4);
      scores.set('confusion', (scores.get('confusion') || 0) + 3);
    }
    if (
      lower.includes('cheated') || lower.includes('betrayed') || lower.includes('lied') ||
      lower.includes('fight') || lower.includes('argument') || lower.includes('breakup') ||
      lower.includes('broke up') || lower.includes('yelled')
    ) {
      scores.set('anger', (scores.get('anger') || 0) + 5);
      scores.set('sadness', (scores.get('sadness') || 0) + 4);
      scores.set('empathic_pain', (scores.get('empathic_pain') || 0) + 3);
    }
    if (
      lower.includes('burnout') || lower.includes('overworked') || lower.includes('boss') ||
      lower.includes('office') || lower.includes('workplace') || lower.includes('pressure')
    ) {
      scores.set('anxiety', (scores.get('anxiety') || 0) + 4);
      scores.set('sadness', (scores.get('sadness') || 0) + 3);
    }
    if (
      lower.includes('exhausted') || lower.includes('insomnia') || lower.includes('cant sleep') ||
      lower.includes("can't sleep") || lower.includes('drained') || lower.includes('sleep deprived')
    ) {
      scores.set('sadness', (scores.get('sadness') || 0) + 4);
      scores.set('boredom', (scores.get('boredom') || 0) + 3);
    }

    // 3. Determine Intensity
    let intensity: 'mild' | 'moderate' | 'peak' = 'moderate';
    const peakMarkers = ['extremely', 'unbearable', 'terrified', 'furious', 'overwhelmed', 'ecstatic', 'panic', 'intense', 'rage', 'deepest', 'unbearably', 'desperately', 'devastated'];
    const mildMarkers = ['a bit', 'slightly', 'kind of', 'mildly', 'little', 'somewhat', 'a touch', 'a little', 'sort of', 'maybe'];

    if (peakMarkers.some((m) => lower.includes(m))) {
      intensity = 'peak';
    } else if (mildMarkers.some((m) => lower.includes(m))) {
      intensity = 'mild';
    }

    // 4. Find Highest Scoring Dimension
    let bestDim = this.dimensions[0];
    let highestScore = -Infinity;

    scores.forEach((sc, dimId) => {
      if (sc > highestScore) {
        highestScore = sc;
        const found = this.dimensions.find((d) => d.id === dimId);
        if (found) bestDim = found;
      }
    });

    // 5. Core Affect vector projection fallback if ambiguous
    if (highestScore <= 0) {
      let estValence = 0;
      let estArousal = 0;
      let valenceHits = 0;
      let arousalHits = 0;

      for (const w of words) {
        if (VALENCE_MAP[w] !== undefined) {
          estValence += VALENCE_MAP[w];
          valenceHits++;
        }
        if (AROUSAL_MAP[w] !== undefined) {
          estArousal += AROUSAL_MAP[w];
          arousalHits++;
        }
      }

      if (valenceHits > 0 || arousalHits > 0) {
        const v = valenceHits > 0 ? estValence / valenceHits : 0;
        const a = arousalHits > 0 ? estArousal / arousalHits : 0;

        let minDistance = Infinity;
        let closestDim = this.dimensions[0];

        for (const dim of this.dimensions) {
          const dv = dim.core_affect.valence - v;
          const da = dim.core_affect.arousal - a;
          const dist = Math.sqrt(dv * dv + da * da);
          if (dist < minDistance) {
            minDistance = dist;
            closestDim = dim;
          }
        }

        bestDim = closestDim;
        highestScore = 2;
        scores.set(bestDim.id, 2);
      } else {
        if (isRepetitionComplaint) {
          bestDim = this.dimensions.find((d) => d.id === 'confusion') || bestDim;
        } else if (isBreathingStatusAnswer) {
          bestDim = this.dimensions.find((d) => d.id === 'calmness') || bestDim;
        } else {
          bestDim = this.dimensions.find((d) => d.id === 'calmness') || bestDim;
        }
        scores.set(bestDim.id, 1);
      }
    }

    // Build normalized 0.0 - 1.0 dimensionScores for all 27 dimensions
    const dimensionScores: Record<string, number> = {};
    const maxVal = Math.max(1, highestScore);

    this.dimensions.forEach((d) => {
      const rawSc = scores.get(d.id) || 0;
      if (d.id === bestDim.id) {
        dimensionScores[d.id] = intensity === 'peak' ? 0.95 : intensity === 'mild' ? 0.70 : 0.85;
      } else if (bestDim.semantic_neighbors.includes(d.name)) {
        dimensionScores[d.id] = Math.min(0.65, Math.max(0.35, (rawSc / maxVal) * 0.6 + 0.35));
      } else {
        dimensionScores[d.id] = Math.min(0.30, Math.max(0.05, (rawSc / maxVal) * 0.3));
      }
    });

    const confidence = Math.min(0.98, Math.max(0.65, 0.60 + Math.max(0, highestScore) * 0.08));
    const result = this.buildResult(bestDim, intensity, confidence, dimensionScores);

    if (isRepetitionComplaint) {
      result.metaIntent = 'dialogue_complaint';
    } else if (isBreathingStatusAnswer) {
      result.metaIntent = 'breathing_status';
    } else {
      result.metaIntent = 'emotional_expression';
    }

    return result;
  }

  public getDimensionById(id: string, intensity: 'mild' | 'moderate' | 'peak' = 'moderate'): NeuroscienceDiagnosticResult {
    const dim = this.dimensions.find((d) => d.id === id) || this.dimensions.find((d) => d.id === 'calmness') || this.dimensions[0];
    
    const dimensionScores: Record<string, number> = {};
    this.dimensions.forEach((d) => {
      if (d.id === dim.id) {
        dimensionScores[d.id] = intensity === 'peak' ? 0.95 : intensity === 'mild' ? 0.70 : 0.85;
      } else if (dim.semantic_neighbors.includes(d.name)) {
        dimensionScores[d.id] = 0.45;
      } else {
        dimensionScores[d.id] = 0.10;
      }
    });

    return this.buildResult(dim, intensity, 0.9, dimensionScores);
  }

  public getAllDimensions() {
    return this.dimensions;
  }

  private buildResult(
    dim: typeof neuroscienceData.cowen_dimensions[0],
    intensity: 'mild' | 'moderate' | 'peak',
    confidence: number,
    dimensionScores?: Record<string, number>
  ): NeuroscienceDiagnosticResult {
    const multiplier = intensity === 'peak' ? 1.25 : intensity === 'mild' ? 0.75 : 1.0;

    const scaledValence = Math.max(-1, Math.min(1, dim.core_affect.valence * (intensity === 'mild' ? 0.8 : 1.0)));
    const scaledArousal = Math.max(-1, Math.min(1, dim.core_affect.arousal * multiplier));

    let polyvagal = 'Ventral_Vagal_Safety';
    if (scaledArousal > 0.4 && scaledValence < 0) {
      polyvagal = 'Sympathetic_Hyperarousal';
    } else if (scaledArousal < -0.3 && scaledValence < 0) {
      polyvagal = 'Dorsal_Vagal_Hypoactivation';
    } else if (scaledValence > 0.4) {
      polyvagal = 'Ventral_Vagal_Flourishing';
    }

    const defaultScores: Record<string, number> = {};
    if (!dimensionScores) {
      this.dimensions.forEach((d) => {
        defaultScores[d.id] = d.id === dim.id ? 0.85 : 0.10;
      });
    }

    return {
      dimensionId: dim.id,
      dimensionName: dim.name,
      cluster: dim.cluster,
      color: dim.color,
      coreAffect: {
        valence: Number(scaledValence.toFixed(2)),
        arousal: Number(scaledArousal.toFixed(2)),
      },
      bodilyMap: {
        head: Number(Math.max(-1, Math.min(1, dim.bodily_map.head * multiplier)).toFixed(2)),
        throat: Number(Math.max(-1, Math.min(1, dim.bodily_map.throat * multiplier)).toFixed(2)),
        chest: Number(Math.max(-1, Math.min(1, dim.bodily_map.chest * multiplier)).toFixed(2)),
        gut: Number(Math.max(-1, Math.min(1, dim.bodily_map.gut * multiplier)).toFixed(2)),
        arms: Number(Math.max(-1, Math.min(1, dim.bodily_map.arms * multiplier)).toFixed(2)),
        legs: Number(Math.max(-1, Math.min(1, dim.bodily_map.legs * multiplier)).toFixed(2)),
        somatic_summary: dim.bodily_map.somatic_summary,
      },
      semanticNeighbors: dim.semantic_neighbors,
      barrettConstruct: dim.barrett_construct,
      somaticIntervention: (dim as any).combined_remedy_action || dim.somatic_intervention,
      confidence,
      intensity,
      dimensionScores: dimensionScores || defaultScores,
      doshicState: (dim as any).doshic_nervous_system_state || 'Ventral Vagal Safe / High Sattva',
      scientificRemedy: (dim as any).scientific_remedy || 'Gratitude anchoring, prosocial connection',
      ayurvedicRemedy: (dim as any).ayurvedic_remedy || 'Cultivating Shanta Rasa, spiritual journaling',
      combinedRemedyAction: (dim as any).combined_remedy_action || dim.somatic_intervention,
      remedyPermutations: (dim as any).remedy_permutations || [],

      // Compatibility Aliases
      specificEmotion: dim.name,
      axisName: dim.cluster,
      axisId: dim.id,
      polyvagalState: (dim as any).doshic_nervous_system_state || polyvagal,
      ekmanEquivalent: dim.cluster,
      cowenParallel: dim.semantic_neighbors.join(', '),
      cbtIntervention: (dim as any).scientific_remedy || dim.barrett_construct,
      dbtIntervention: (dim as any).ayurvedic_remedy || dim.somatic_intervention,
    };
  }
}

export const emotionClassifier = NeuroscienceEmotionClassifier.getInstance();
export const classifyNeuroscienceDimensions = (text: string) => emotionClassifier.classifyText(text);
export const classifyEmotion = (text: string) => emotionClassifier.classifyText(text);
export default emotionClassifier;
