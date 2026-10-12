/**
 * lib/audio/voice-selector.ts
 *
 * Browsers load voices asynchronously. We wrap getVoices in a Promise
 * with timeout safeguards to ensure the OS has finished populating
 * the voice list before scoring them for optimal clinical & therapeutic resonance.
 */

export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    let isResolved = false;
    const finish = () => {
      if (isResolved) return;
      isResolved = true;
      resolve(window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : []);
    };

    window.speechSynthesis.onvoiceschanged = () => {
      finish();
    };

    // Safety timeout in case onvoiceschanged does not fire in some WebKit versions
    setTimeout(finish, 250);
  });
};

const voiceCacheByLang = new Map<string, SpeechSynthesisVoice>();

/**
 * Scores and selects the most natural, therapeutic voice available on the device.
 */
export const getBestTherapeuticVoice = async (targetLang = 'en'): Promise<SpeechSynthesisVoice | null> => {
  const cleanLang = (targetLang || 'en').toLowerCase().replace('_', '-');
  if (voiceCacheByLang.has(cleanLang)) {
    const cached = voiceCacheByLang.get(cleanLang);
    if (cached) return cached;
  }

  const voices = await getAvailableVoices();
  if (!voices.length) return null;

  // 1. Filter for the target language (e.g., "hi-IN", "es-ES", "fr-FR", "de-DE", "en-US")
  const baseLang = cleanLang.split('-')[0];
  const matchedVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === cleanLang || vLang.startsWith(cleanLang) || vLang.startsWith(baseLang);
  });
  const candidates = matchedVoices.length > 0 ? matchedVoices : voices;

  // 2. The Heuristic Scoring Engine - 100% Human-Like Voice Prioritization
  const isRoboticVoice = (voice: SpeechSynthesisVoice): boolean => {
    const name = voice.name.toLowerCase();
    return (
      name.includes('desktop') ||
      name.includes('david') ||
      name.includes('zira') ||
      name.includes('mark') ||
      name.includes('hazel') ||
      name.includes('george') ||
      name.includes('sapi') ||
      (name.includes('android') && !name.includes('google')) ||
      name.includes('espeak') ||
      name.includes('sam')
    );
  };

  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = voice.name.toLowerCase();

    // -- SEVERE PENALTY FOR ROBOTIC / DESKTOP VOICES --
    if (isRoboticVoice(voice)) {
      return -1000;
    }

    // -- MICROSOFT NATURAL & EDGE NEURAL VOICES (100% Human-Like) --
    if (name.includes('natural') || name.includes('online')) score += 300;
    if (name.includes('neural')) score += 250;
    if (name.includes('swara') || name.includes('madhur') || name.includes('kalpana') || name.includes('hemant')) score += 200;
    if (name.includes('aria') || name.includes('jenny') || name.includes('guy') || name.includes('sonia') || name.includes('neerja')) score += 200;
    if (name.includes('elvira') || name.includes('denise') || name.includes('katja')) score += 200;
    if (name.includes('हिन्दी') || name.includes('hindi')) score += 150;

    // -- GOOGLE HIGH-FIDELITY VOICES (Smooth, Human Neural) --
    if (name.includes('google')) score += 180;

    // -- APPLE SIRI / ENHANCED / PREMIUM (100% Human Neural) --
    if (name.includes('siri')) score += 250;
    if (name.includes('premium') || name.includes('enhanced')) score += 200;
    if (name.includes('samantha') || name.includes('daniel') || name.includes('karen') || name.includes('rishi') || name.includes('lekha')) score += 100;

    // Default system priority
    if (voice.default) score += 5;

    return score;
  };

  // 3. Filter out robotic voices if ANY non-robotic alternative exists
  const nonRoboticCandidates = candidates.filter(v => !isRoboticVoice(v));
  const pool = nonRoboticCandidates.length > 0 ? nonRoboticCandidates : candidates;

  // 4. Sort voices by score descending
  pool.sort((a, b) => scoreVoice(b) - scoreVoice(a));

  // Return the highest scoring voice
  const best = pool[0] || null;
  if (best) {
    voiceCacheByLang.set(cleanLang, best);
  }
  return best;
};

export default getBestTherapeuticVoice;
