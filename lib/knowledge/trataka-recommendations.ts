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
 * Maps any user query and psychological state to the optimal Trataka mode and instructions.
 */
export function resolveTratakaPrescription(
  query: string,
  dominantEmotion?: string,
  polyvagalState?: string
): TratakaPrescription {
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
    q.includes('रोना') ||
    q.includes('उदासी') ||
    q.includes('थकान') ||
    q.includes('अकेलापन') ||
    q.includes('दिल टूट') ||
    q.includes('दर्द') ||
    q.includes('दुख') ||
    q.includes('शोक')
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

