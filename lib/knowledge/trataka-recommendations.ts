/**
 * lib/knowledge/trataka-recommendations.ts
 * 
 * Neuro-Ocular Trataka (Sacred Gazing) Recommendation Engine.
 * Formulates tailored ocular meditation protocols linked to the user's specific
 * autonomic nervous system state (Sympathetic, Dorsal Vagal, Ventral Vagal).
 */

export type TratakaModeId = 'bindu' | 'flame' | 'murti' | 'pratibimb' | 'shoonya';

export interface TratakaPrescription {
  mode: TratakaModeId;
  name: string;
  sanskritName: string;
  durationMinutes: number;
  focalTarget: string;
  neuroMechanism: string;
  stepByStepGuidance: string[];
}

export const TRATAKA_PRESCRIPTIONS: Record<TratakaModeId, TratakaPrescription> = {
  bindu: {
    mode: 'bindu',
    name: 'Bindu Trataka (Sacred Golden Focal Point)',
    sanskritName: 'बिन्दु त्राटक',
    durationMinutes: 2,
    focalTarget: 'A solitary, luminous golden amber dot at eye level (approx. 2 feet away).',
    neuroMechanism: 'Stabilizing optic flow and holding motionless saccadic fixation signals the superior colliculus and amygdala to down-regulate acute sympathetic hyperarousal and panic.',
    stepByStepGuidance: [
      'Gaze softly at the radiant amber center without straining or blinking forcefully.',
      'Allow peripheral visual stimuli to gently blur into the background.',
      'Synchronize your gaze with a 4-second slow inhale and a 6-second prolonged exhale.',
      'Conclude by rubbing your palms vigorously until warm and cupping them over your closed eyes (Palming).'
    ]
  },
  flame: {
    mode: 'flame',
    name: 'Jyoti Trataka (Candle Flame Gazing)',
    sanskritName: 'ज्योति त्राटक',
    durationMinutes: 3,
    focalTarget: 'The glowing, steady golden-orange tip of a meditative flame.',
    neuroMechanism: 'Gentle luminance stimulating retinal photoreceptors rekindles central dopaminergic and autonomic tone, cutting through dorsal vagal shutdown, depressive inertia, and apathy.',
    stepByStepGuidance: [
      'Rest your gaze on the brightest apex of the flame, relaxing your forehead and facial muscles.',
      'Breathe in warmth through the chest, allowing the steady light to illuminate internal heaviness.',
      'Hold a soft, receptive gaze for 2 minutes until slight natural lacrimation (tearing) occurs, cleansing the ocular channels.',
      'Close your eyes and visualize the residual golden after-image between the eyebrows (Antaranga Trataka).'
    ]
  },
  murti: {
    mode: 'murti',
    name: 'Mandala Trataka (Sacred Geometry Resonance)',
    sanskritName: 'मूर्ति / मण्डल त्राटक',
    durationMinutes: 3,
    focalTarget: 'An intricate, concentric sacred geometric mandala pattern.',
    neuroMechanism: 'Symmetrical geometric visualization stimulates bilateral occipital-parietal integration, breaking chaotic rumination and restoring prefrontal executive coherence.',
    stepByStepGuidance: [
      'Focus gently on the geometric center (Bindu) of the mandala.',
      'Slowly trace the symmetrical concentric petals outward with your peripheral gaze, then return to the center.',
      'Maintain an unbroken, calm breathing cycle to harmonize left and right cerebral hemispheres.',
      'Close your eyes and rest within the ordered spatial harmony created in the mind.'
    ]
  },
  pratibimb: {
    mode: 'pratibimb',
    name: 'Pratibimb Trataka (Sacred Mirror Gazing)',
    sanskritName: 'प्रतिबिम्ब त्राटक',
    durationMinutes: 2,
    focalTarget: 'Your own pupil reflections in a softly lit mirror or reflective front camera.',
    neuroMechanism: 'Engages frontoparietal mirror-neuron circuits and ventral vagal social engagement systems to rewire toxic core shame, imposter syndrome, and self-alienation.',
    stepByStepGuidance: [
      'Look directly into the pupils of your own eyes with compassionate, non-judgmental awareness.',
      'Notice any critical mental dialogue arise, and consciously soften your gaze into unconditional acceptance.',
      'Silently repeat: "I acknowledge you. I accept you. You are safe here in this moment."',
      'Conclude with hands over the heart center, integrating self-compassion.'
    ]
  },
  shoonya: {
    mode: 'shoonya',
    name: 'Shoonya Trataka (Void & Panoramic Space Gazing)',
    sanskritName: 'शून्य त्राटक',
    durationMinutes: 3,
    focalTarget: 'Unbounded empty space, expansive dark blue horizon, or dark void screen.',
    neuroMechanism: 'Shifting from foveal hyper-focus to panoramic peripheral vision immediately deactivates sympathetic adrenergic tone and halts decision-paralysis rumination.',
    stepByStepGuidance: [
      'Soften your gaze so you are not looking AT any object, but rather through the open, spacious void.',
      'Expand your visual field to take in the extreme left, right, ceiling, and floor simultaneously.',
      'Notice how your mental narrative quietens the moment panoramic vision engages.',
      'Breathe naturally into the vast, silent space of pure awareness.'
    ]
  }
};

import { emotionClassifier } from './emotion-classifier.ts';

/**
 * Normalizes any variation, synonym, language, or spelling into a canonical TratakaModeId.
 */
export function normalizeTratakaMode(mode?: string | null): TratakaModeId {
  if (!mode) return 'bindu';
  const clean = mode.toLowerCase().trim();

  // Jyoti / Flame / Candle / Fire
  if (
    clean === 'flame' ||
    clean === 'jyoti' ||
    clean.includes('jyoti') ||
    clean.includes('flame') ||
    clean.includes('candle') ||
    clean.includes('fire') ||
    clean.includes('tejas') ||
    clean.includes('दीपक') ||
    clean.includes('ज्योति') ||
    clean.includes('अग्नि') ||
    clean.includes('दीप')
  ) {
    return 'flame';
  }

  // Mandala / Murti / Sacred Geometry
  if (
    clean === 'murti' ||
    clean === 'mandala' ||
    clean.includes('mandala') ||
    clean.includes('murti') ||
    clean.includes('मंडल') ||
    clean.includes('मण्डल') ||
    clean.includes('मूर्ति') ||
    clean.includes('geometry')
  ) {
    return 'murti';
  }

  // Pratibimb / Mirror / Reflection
  if (
    clean === 'pratibimb' ||
    clean === 'mirror' ||
    clean.includes('pratibimb') ||
    clean.includes('mirror') ||
    clean.includes('reflection') ||
    clean.includes('प्रतिबिंब') ||
    clean.includes('प्रतिबिम्ब') ||
    clean.includes('दर्पण') ||
    clean.includes('आईना')
  ) {
    return 'pratibimb';
  }

  // Shoonya / Void / Horizon / Space
  if (
    clean === 'shoonya' ||
    clean === 'void' ||
    clean.includes('shoonya') ||
    clean.includes('void') ||
    clean.includes('space') ||
    clean.includes('horizon') ||
    clean.includes('शून्य') ||
    clean.includes('आकाश')
  ) {
    return 'shoonya';
  }

  // Bindu / Point / Focal Point
  if (
    clean === 'bindu' ||
    clean === 'point' ||
    clean.includes('bindu') ||
    clean.includes('point') ||
    clean.includes('dot') ||
    clean.includes('बिंदु') ||
    clean.includes('बिन्दु')
  ) {
    return 'bindu';
  }

  return 'bindu';
}

/**
 * Accurately extracts the prescribed Trataka mode from clinical message / remedy text.
 * Prevents UI launch buttons from mismatching the AI's actual textual prescription.
 */
export function detectTratakaModeFromText(text?: string | null): TratakaModeId | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  // 1. Jyoti / Flame
  if (
    lower.includes('jyoti tratak') ||
    lower.includes('jyoti (the flame)') ||
    lower.includes('jyoti flame') ||
    lower.includes('candle flame') ||
    lower.includes('flame gazing') ||
    lower.includes('jyoti gazing') ||
    lower.includes('ज्योति त्राटक') ||
    lower.includes('दीपक त्राटक') ||
    lower.includes('दीप त्राटक') ||
    lower.includes('ज्योति ध्यान') ||
    lower.includes('flame trataka') ||
    lower.includes('meditación en la llama') ||
    lower.includes('contemplation de la flamme') ||
    lower.includes('kerzenflammen-meditation')
  ) {
    return 'flame';
  }

  // 2. Pratibimb / Mirror
  if (
    lower.includes('pratibimb tratak') ||
    lower.includes('pratibimb (the reflection)') ||
    lower.includes('pratibimb (sacred mirror)') ||
    lower.includes('mirror gazing') ||
    lower.includes('sacred mirror') ||
    lower.includes('प्रतिबिम्ब त्राटक') ||
    lower.includes('प्रतिबिंब त्राटक') ||
    lower.includes('दर्पण त्राटक') ||
    lower.includes('आईना त्राटक')
  ) {
    return 'pratibimb';
  }

  // 3. Shoonya / Void
  if (
    lower.includes('shoonya tratak') ||
    lower.includes('shoonya (the void)') ||
    lower.includes('void gazing') ||
    lower.includes('space gazing') ||
    lower.includes('panoramic space') ||
    lower.includes('शून्य त्राटक') ||
    lower.includes('आकाश त्राटक')
  ) {
    return 'shoonya';
  }

  // 4. Mandala / Murti
  if (
    lower.includes('mandala tratak') ||
    lower.includes('murti tratak') ||
    lower.includes('murti (sacred mandala)') ||
    lower.includes('sacred geometry') ||
    lower.includes('मण्डल त्राटक') ||
    lower.includes('मंडल त्राटक') ||
    lower.includes('मूर्ति त्राटक')
  ) {
    return 'murti';
  }

  // 5. Bindu / Point
  if (
    lower.includes('bindu tratak') ||
    lower.includes('bindu (the point)') ||
    lower.includes('single-pointed') ||
    lower.includes('golden focal point') ||
    lower.includes('digital bindu') ||
    lower.includes('बिन्दु त्राटक') ||
    lower.includes('बिंदु त्राटक')
  ) {
    return 'bindu';
  }

  return null;
}

/**
 * Returns a beautifully formatted human-readable label combining sacred Sanskrit
 * and modern clinical terminology for buttons and telemetry cards.
 */
export function getTratakaModeLabel(mode?: string | null): string {
  const m = normalizeTratakaMode(mode);
  switch (m) {
    case 'flame':
      return 'Jyoti (Flame)';
    case 'bindu':
      return 'Bindu (Point)';
    case 'murti':
      return 'Mandala (Murti)';
    case 'pratibimb':
      return 'Pratibimb (Mirror)';
    case 'shoonya':
      return 'Shoonya (Void)';
    default:
      return 'Sacred Gazing';
  }
}

/**
 * Maps any user query, psychological state, or matched condition to the optimal Trataka mode and instructions.
 */
export function resolveTratakaPrescription(
  query: string,
  dominantEmotion?: string,
  polyvagalState?: string,
  conditionOrMode?: any
): TratakaPrescription {
  // 0. If condition object or explicit mode was provided, prioritize it
  if (conditionOrMode) {
    const rawMode =
      typeof conditionOrMode === 'string'
        ? conditionOrMode
        : conditionOrMode?.recommended_trataka_mode || conditionOrMode?.mode;
    if (rawMode) {
      const canonical = normalizeTratakaMode(rawMode);
      if (TRATAKA_PRESCRIPTIONS[canonical]) {
        return TRATAKA_PRESCRIPTIONS[canonical];
      }
    }
  }

  const q = (query || '').toLowerCase();
  let emo = (dominantEmotion || '').toLowerCase();
  let poly = (polyvagalState || '').toLowerCase();

  // If emotion or polyvagal state not passed, classify dynamically
  if ((!emo || !poly) && query && query.trim()) {
    try {
      const diag = emotionClassifier.classifyText(query);
      if (!emo) emo = (diag.dimensionId || '').toLowerCase();
      if (!poly) poly = (diag.polyvagalState || '').toLowerCase();
    } catch {
      // ignore
    }
  }

  // Explicit user mentions of specific Trataka styles
  if (
    q.includes('jyoti') ||
    q.includes('flame') ||
    q.includes('candle') ||
    q.includes('ज्योति') ||
    q.includes('दीपक')
  ) {
    return TRATAKA_PRESCRIPTIONS.flame;
  }
  if (
    q.includes('mirror') ||
    q.includes('pratibimb') ||
    q.includes('प्रतिबिम्ब') ||
    q.includes('दर्पण')
  ) {
    return TRATAKA_PRESCRIPTIONS.pratibimb;
  }
  if (
    q.includes('mandala') ||
    q.includes('murti') ||
    q.includes('मण्डल') ||
    q.includes('मूर्ति')
  ) {
    return TRATAKA_PRESCRIPTIONS.murti;
  }
  if (
    q.includes('shoonya') ||
    q.includes('void') ||
    q.includes('space') ||
    q.includes('शून्य')
  ) {
    return TRATAKA_PRESCRIPTIONS.shoonya;
  }
  if (
    q.includes('bindu') ||
    q.includes('बिन्दु') ||
    q.includes('बिंदु')
  ) {
    return TRATAKA_PRESCRIPTIONS.bindu;
  }

  // 1. Shame / Imposter / Self-Criticism -> Pratibimb (Mirror)
  if (
    emo === 'disgust' ||
    q.includes('shame') ||
    q.includes('imposter') ||
    q.includes('failure') ||
    q.includes('hate myself') ||
    q.includes('defect') ||
    q.includes('worthless') ||
    q.includes('ugly') ||
    q.includes('not enough') ||
    q.includes('शर्म') ||
    q.includes('हीनभावना') ||
    q.includes('खुद से नफरत') ||
    q.includes('bekar') ||
    q.includes('sharm')
  ) {
    return TRATAKA_PRESCRIPTIONS.pratibimb;
  }

  // 2. Decision paralysis / Existential / Overthinking / Insomnia -> Shoonya (Void)
  if (
    emo === 'confusion' ||
    q.includes('decide') ||
    q.includes('decision') ||
    q.includes('paralysis') ||
    q.includes('existential') ||
    q.includes('meaning') ||
    q.includes('crossroads') ||
    q.includes('overthinking') ||
    q.includes('insomnia') ||
    q.includes('sleep') ||
    q.includes('ruminat') ||
    q.includes('awake') ||
    q.includes('kya karu') ||
    q.includes('soch soch kar') ||
    q.includes('नींद') ||
    q.includes('असमंजस') ||
    q.includes('दुविधा') ||
    q.includes('धर्मसंकट')
  ) {
    return TRATAKA_PRESCRIPTIONS.shoonya;
  }

  // 3. Depressive Inertia / Burnout / Exhaustion / Grief / Heartbreak -> Jyoti (Flame)
  if (
    poly.includes('dorsal') ||
    emo === 'sadness' ||
    emo === 'empathic_pain' ||
    emo === 'boredom' ||
    q.includes('depress') ||
    q.includes('burnout') ||
    q.includes('exhaust') ||
    q.includes('letharg') ||
    q.includes('tired') ||
    q.includes('grief') ||
    q.includes('numb') ||
    q.includes('heartbreak') ||
    q.includes('breakup') ||
    q.includes('dil toot') ||
    q.includes('udas') ||
    q.includes('rona') ||
    q.includes('dard') ||
    q.includes('dukh') ||
    q.includes('gam') ||
    q.includes('empty') ||
    q.includes('hopeless') ||
    q.includes('fatigue') ||
    q.includes('apathy') ||
    q.includes('no energy') ||
    q.includes('रोना') ||
    q.includes('उदासी') ||
    q.includes('थकान') ||
    q.includes('अकेलापन') ||
    q.includes('दिल टूट') ||
    q.includes('दर्द') ||
    q.includes('दुख') ||
    q.includes('शोक') ||
    q.includes('निराशा') ||
    q.includes('आलस्य')
  ) {
    return TRATAKA_PRESCRIPTIONS.flame;
  }

  // 4. Chaotic thoughts / ADHD / Sensory overwhelm / Relationship conflict / Anger -> Murti (Mandala)
  if (
    emo === 'anger' ||
    q.includes('chaos') ||
    q.includes('adhd') ||
    q.includes('relationship') ||
    q.includes('fight') ||
    q.includes('conflict') ||
    q.includes('partner') ||
    q.includes('scattered') ||
    q.includes('overwhelm') ||
    q.includes('gussa') ||
    q.includes('krodh') ||
    q.includes('गुस्सा') ||
    q.includes('क्रोध') ||
    q.includes('लड़ाई')
  ) {
    return TRATAKA_PRESCRIPTIONS.murti;
  }

  // 5. Default / Acute anxiety / Panic / Fear / Sympathetic Spikes -> Bindu (Golden Amber Dot)
  return TRATAKA_PRESCRIPTIONS.bindu;
}

