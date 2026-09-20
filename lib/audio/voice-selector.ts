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

/**
 * Scores and selects the most natural, therapeutic voice available on the device.
 */
export const getBestTherapeuticVoice = async (targetLang = 'en'): Promise<SpeechSynthesisVoice | null> => {
  const voices = await getAvailableVoices();
  if (!voices.length) return null;

  // 1. Filter for the target language (e.g., "hi-IN", "es-ES", "fr-FR", "de-DE", "en-US")
  const cleanLang = targetLang.toLowerCase().replace('_', '-');
  const baseLang = cleanLang.split('-')[0];
  const matchedVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === cleanLang || vLang.startsWith(cleanLang) || vLang.startsWith(baseLang);
  });
  const candidates = matchedVoices.length > 0 ? matchedVoices : voices;

  // 2. The Heuristic Scoring Engine
  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = voice.name.toLowerCase();

    // -- REGIONAL & HIGH-FIDELITY NEURAL VOICES --
    if (name.includes('swara') || name.includes('madhur') || name.includes('kalpana') || name.includes('hemant')) score += 100;
    if (name.includes('elvira') || name.includes('alvaro') || name.includes('denise') || name.includes('henri') || name.includes('katja') || name.includes('conrad')) score += 100;
    if (name.includes('हिन्दी') || name.includes('hindi')) score += 85;

    // -- WINDOWS & EDGE TIER --
    // Microsoft's "Natural" voices are cloud-backed neural engines (Highest Quality)
    if (name.includes('natural')) score += 100;
    if (name.includes('aria') || name.includes('jenny') || name.includes('guy') || name.includes('sonia') || name.includes('neerja')) score += 50;

    // -- APPLE (iOS / macOS) TIER --
    // Apple labels their high-fidelity downloaded voices as Premium or Enhanced
    if (name.includes('siri')) score += 90; // Siri voices are natively neural
    if (name.includes('premium') || name.includes('enhanced')) score += 80;
    if (name.includes('samantha') || name.includes('daniel') || name.includes('karen') || name.includes('rishi') || name.includes('lekha')) score += 40;

    // -- ANDROID & CHROME TIER --
    // Google's network voices are vastly superior to local offline processing
    if (name.includes('network') || name.includes('online')) score += 70;
    if (name.includes('google')) score += 30;

    // -- PENALTIES (Avoid Robotic Voices) --
    // "Desktop" voices are legacy Windows 7/10 robotic engines (Zira, David)
    if (name.includes('desktop')) score -= 200; 
    // Old Android fallback voices sound highly synthesized
    if (name.includes('android') && !name.includes('google')) score -= 100;

    // Tie-breaker: If OS explicitly marks a voice as default, give it a slight bump
    if (voice.default) score += 5;

    return score;
  };

  // 3. Sort voices by score descending
  candidates.sort((a, b) => scoreVoice(b) - scoreVoice(a));

  // Return the highest scoring voice
  return candidates[0] || null;
};

export default getBestTherapeuticVoice;
