/**
 * Clinical Localization Engine & Human-Crafted Explanations
 * Provides:
 * 1. 100% Human-crafted, culturally fluent CBT reframings, somatic anchors, and pranayama breathwork.
 * 2. Complete absence of mixed-language jargon (e.g. pure Hindi, pure Spanish, pure French, pure German).
 * 3. Guaranteed, robust fallback to English (en/en-US) whenever a language is unsupported.
 * 4. On-demand per-language JSON chunk loading with in-memory caching.
 * 5. Human-like paragraph formulation designed for direct conversational speech synthesis.
 */

import { findGitaWisdom, formatGitaShlokaBlock } from "../knowledge/gita-library.ts";
import { resolveTratakaPrescription, TRATAKA_PRESCRIPTIONS, type TratakaModeId } from "../knowledge/trataka-recommendations.ts";
import { getConditionById } from "../knowledge/psychology-library-rag.ts";
import { emotionClassifier } from "../knowledge/emotion-classifier.ts";

function getNodeRequire() {
  if (typeof process !== "undefined" && process.env && process.env.NEXT_RUNTIME === "edge") {
    return null;
  }
  if (typeof window !== "undefined") {
    return null;
  }
  try {
    const proc = (globalThis as any).process;
    if (proc && typeof proc.getBuiltinModule === "function") {
      return proc.getBuiltinModule("module")?.createRequire?.(import.meta.url) ?? null;
    }
  } catch (_) {}
  return null;
}

const nodeRequire = getNodeRequire();

export interface LocalizedIntervention {
  conditionName: string;
  validation: string;
  cbt_reframing: string;
  somatic_anchor: string;
  pranayama: string;
  micro_habit: string;
}

export type SupportedLocaleKey = 'hi' | 'es' | 'fr' | 'de' | 'en';

export function normalizeLanguageCode(code?: string): SupportedLocaleKey {
  if (!code) return 'en';
  const c = code.toLowerCase().trim().split('-')[0].split('_')[0];
  if (c === 'hi' || c === 'hindi') return 'hi';
  if (c === 'es' || c === 'spanish') return 'es';
  if (c === 'fr' || c === 'french') return 'fr';
  if (c === 'de' || c === 'german') return 'de';
  return 'en'; // Strict universal fallback to English
}

export interface LocalizedGitaWisdom {
  meaning: string;
  reflection: string;
  what_to_do: string;
  what_not_to_do: string;
}

export interface LocalizedTratakaWisdom {
  name: string;
  focalTarget: string;
  neuroMechanism: string;
  guidance: string;
}

export interface SufferingAssessmentData {
  emotionId: string;
  emotionName: string;
  severityLabel: string;
  distressScore: number;
  nervousSystem: string;
  bodilyMarkers: string;
  inputSummary: string;
  markdown: string;
}

export interface LocaleData {
  interventions: Record<string, LocalizedIntervention>;
  generalAdvice: Record<string, string>;
  gita: Record<string, LocalizedGitaWisdom>;
  trataka: Record<string, LocalizedTratakaWisdom>;
  assessment: {
    emotions: Record<string, string>;
    severity: {
      positive: string;
      severe: string;
      moderate: string;
      mild: string;
    };
    nervousSystem: {
      positive: string;
      sympathetic: string;
      dorsal: string;
    };
    bodilyMarkers: {
      positive: string;
      sympathetic: string;
      dorsal: string;
    };
    inputSummaries: {
      positive: string;
      debt: string;
      lonely: string;
      family: string;
      hopeless: string;
      interview: string;
      breakup: string;
      boss: string;
      fake: string;
      overwhelm: string;
      defaultTemplate: string;
    };
    markdownTemplates: {
      positive: {
        title: string;
        stateLabel: string;
        autonomicLabel: string;
        somaticLabel: string;
        summaryLabel: string;
      };
      distress: {
        title: string;
        stateLabel: string;
        focusLabel: string;
      };
    };
  };
  synergyResolution: {
    template: string;
  };
  messagePillars: {
    gitaTitle: string;
    gitaSpeaker: string;
    gitaAction: string;
    cbtTitle: string;
    cbtSomaticAnchor: string;
    tratakaTitle: string;
    tratakaFocalTarget: string;
    tratakaPractice: string;
  };
  generalAdviceSpeakers: {
    gitaSpeaker: string;
    gitaReflection: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ON-DEMAND LOCALE CHUNK LOADER & IN-MEMORY CACHE
// ─────────────────────────────────────────────────────────────────────────────

const localeCache: Partial<Record<SupportedLocaleKey, LocaleData>> = {};

/**
 * Synchronously loads a per-language locale chunk on demand and caches it.
 */
export function getLocaleData(locale?: string): LocaleData {
  const norm = normalizeLanguageCode(locale);
  if (localeCache[norm]) {
    return localeCache[norm]!;
  }
  let data: LocaleData;
  switch (norm) {
    case 'hi':
      data = (nodeRequire ? nodeRequire('./locales/hi.json') : require('./locales/hi.json'));
      break;
    case 'es':
      data = (nodeRequire ? nodeRequire('./locales/es.json') : require('./locales/es.json'));
      break;
    case 'fr':
      data = (nodeRequire ? nodeRequire('./locales/fr.json') : require('./locales/fr.json'));
      break;
    case 'de':
      data = (nodeRequire ? nodeRequire('./locales/de.json') : require('./locales/de.json'));
      break;
    case 'en':
    default:
      data = (nodeRequire ? nodeRequire('./locales/en.json') : require('./locales/en.json'));
      break;
  }
  localeCache[norm] = data;
  return data;
}

/**
 * Asynchronously preloads a per-language locale chunk for code-splitting.
 */
export async function loadLocaleAsync(locale?: string): Promise<LocaleData> {
  const norm = normalizeLanguageCode(locale);
  if (localeCache[norm]) return localeCache[norm]!;
  let data: LocaleData;
  switch (norm) {
    case 'hi':
      data = (await import('./locales/hi.json')).default as LocaleData;
      break;
    case 'es':
      data = (await import('./locales/es.json')).default as LocaleData;
      break;
    case 'fr':
      data = (await import('./locales/fr.json')).default as LocaleData;
      break;
    case 'de':
      data = (await import('./locales/de.json')).default as LocaleData;
      break;
    case 'en':
    default:
      data = (await import('./locales/en.json')).default as LocaleData;
      break;
  }
  localeCache[norm] = data;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE PROXIES FOR LEGACY CATALOG EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const ALL_SHLOKA_KEYS = [
  "bg_2_47", "bg_2_48", "bg_2_14", "bg_2_62_63", "bg_6_5", "bg_2_70",
  "bg_6_26", "bg_18_63", "bg_2_56", "bg_12_15", "bg_3_35", "bg_5_23", "bg_18_66"
];

const ALL_TRATAKA_MODES = ['bindu', 'flame', 'murti', 'pratibimb', 'shoonya'];

const ALL_CONDITION_KEYS = [
  'gad', 'burnout_fatigue', 'panic_dysregulation', 'major_depressive_inertia',
  'imposter_perfectionism', 'relationship_heartbreak', 'existential_loneliness',
  'anger_frustration_dysregulation', 'grief_bereavement', 'adhd_executive_overwhelm',
  'insomnia_hyperarousal', 'social_evaluative_threat', 'health_somatic_anxiety',
  'trauma_hypervigilance', 'ocd_intrusive_rumination', 'compassion_fatigue_caregiver',
  'decision_paralysis_ambivalence', 'shame_core_defectiveness',
  'workplace_mobbing_toxic_culture', 'somatic_chronic_pain_amplification',
  'cognitive_memory_brain_fog', 'emotional_dysregulation_numbness'
];

const ALL_LOCALES: SupportedLocaleKey[] = ['en', 'hi', 'es', 'fr', 'de'];

function makeGitaShlokaProxy(shlokaId: string) {
  return new Proxy({} as Partial<Record<SupportedLocaleKey, LocalizedGitaWisdom>>, {
    ownKeys() {
      return ALL_LOCALES;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey)) {
        const norm = normalizeLanguageCode(prop);
        const val = getLocaleData(norm).gita?.[shlokaId];
        return { enumerable: true, configurable: true, writable: false, value: val };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      const norm = normalizeLanguageCode(prop);
      return getLocaleData(norm).gita?.[shlokaId];
    }
  });
}

export const GITA_LOCALIZATION_CATALOG: Record<string, Partial<Record<SupportedLocaleKey, LocalizedGitaWisdom>>> = new Proxy(
  {} as Record<string, Partial<Record<SupportedLocaleKey, LocalizedGitaWisdom>>>,
  {
    ownKeys() {
      return ALL_SHLOKA_KEYS;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_SHLOKA_KEYS.includes(prop)) {
        return { enumerable: true, configurable: true, writable: false, value: makeGitaShlokaProxy(prop) };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_SHLOKA_KEYS.includes(prop);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string' || !ALL_SHLOKA_KEYS.includes(prop)) return undefined;
      return makeGitaShlokaProxy(prop);
    }
  }
);

function makeTratakaModeProxy(modeId: string) {
  return new Proxy({} as Partial<Record<SupportedLocaleKey, LocalizedTratakaWisdom>>, {
    ownKeys() {
      return ALL_LOCALES;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey)) {
        const norm = normalizeLanguageCode(prop);
        const val = getLocaleData(norm).trataka?.[modeId];
        return { enumerable: true, configurable: true, writable: false, value: val };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      const norm = normalizeLanguageCode(prop);
      return getLocaleData(norm).trataka?.[modeId];
    }
  });
}

export const TRATAKA_LOCALIZATION_CATALOG: Record<string, Partial<Record<SupportedLocaleKey, LocalizedTratakaWisdom>>> = new Proxy(
  {} as Record<string, Partial<Record<SupportedLocaleKey, LocalizedTratakaWisdom>>>,
  {
    ownKeys() {
      return ALL_TRATAKA_MODES;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_TRATAKA_MODES.includes(prop)) {
        return { enumerable: true, configurable: true, writable: false, value: makeTratakaModeProxy(prop) };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_TRATAKA_MODES.includes(prop);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string' || !ALL_TRATAKA_MODES.includes(prop)) return undefined;
      return makeTratakaModeProxy(prop);
    }
  }
);

function makeConditionProxy(condId: string) {
  return new Proxy({} as Partial<Record<SupportedLocaleKey, LocalizedIntervention>>, {
    ownKeys() {
      return ALL_LOCALES;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey)) {
        const norm = normalizeLanguageCode(prop);
        const val = getLocaleData(norm).interventions?.[condId];
        return { enumerable: true, configurable: true, writable: false, value: val };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      const norm = normalizeLanguageCode(prop);
      return getLocaleData(norm).interventions?.[condId];
    }
  });
}

export const CLINICAL_LOCALIZATION_CATALOG: Record<string, Partial<Record<SupportedLocaleKey, LocalizedIntervention>>> = new Proxy(
  {} as Record<string, Partial<Record<SupportedLocaleKey, LocalizedIntervention>>>,
  {
    ownKeys() {
      return ALL_CONDITION_KEYS;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_CONDITION_KEYS.includes(prop)) {
        return { enumerable: true, configurable: true, writable: false, value: makeConditionProxy(prop) };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_CONDITION_KEYS.includes(prop);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      return makeConditionProxy(prop);
    }
  }
);

export const GENERAL_LOCALIZED_ADVICE: Record<SupportedLocaleKey, Record<string, string>> = new Proxy(
  {} as Record<SupportedLocaleKey, Record<string, string>>,
  {
    ownKeys() {
      return ALL_LOCALES;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey)) {
        const norm = normalizeLanguageCode(prop);
        const val = getLocaleData(norm).generalAdvice || {};
        return { enumerable: true, configurable: true, writable: false, value: val };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    has(target, prop) {
      return typeof prop === 'string' && ALL_LOCALES.includes(prop as SupportedLocaleKey);
    },
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      const norm = normalizeLanguageCode(prop);
      return getLocaleData(norm).generalAdvice || {};
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC LOCALIZATION API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get human-crafted localized intervention for a clinical condition.
 * Dynamically synthesizes tailored interventions from the psychology library if not bundled in catalog.
 */
function localizeDynamicSolutions(
  sols: any,
  norm: string,
  rawConditionName?: string
): LocalizedIntervention {
  const cleanReframe = sols?.cbt_reframing ? sols.cbt_reframing.split('[Wikipedia Context]')[0].trim() : '';
  const cleanAnchor = sols?.somatic_anchor ? sols.somatic_anchor.trim() : '';
  const cleanPranayama = sols?.pranayama ? sols.pranayama.trim() : '';
  const cleanHabit = sols?.micro_habit ? sols.micro_habit.trim() : '';

  if (norm === 'hi') {
    let conditionName = 'क्लिनिकल न्यूरो-संज्ञानात्मक प्रोटोकॉल';
    if (rawConditionName && /[\u0900-\u097F]/.test(rawConditionName)) {
      conditionName = rawConditionName;
    }

    const validation = 'मैं समझ सकता हूँ कि आप इस समय इस मानसिक चुनौती और भावनात्मक तनाव से जूझ रहे हैं, और यह अनुभव कितना थका देने वाला है।';

    // 1. CBT Reframing in Hindi
    let cbt_reframing = 'इस अनुभव को तंत्रिका तंत्र का एक अस्थायी शारीरिक संकेत मानें। बिना किसी पूर्वाग्रह या निर्णय के अपने विचारों को साक्षी भाव से देखें।';
    if (cleanReframe && /[\u0900-\u097F]/.test(cleanReframe)) {
      cbt_reframing = cleanReframe;
    } else if (/transient|physiological signal|without judgment/i.test(cleanReframe)) {
      cbt_reframing = 'इस अनुभव को तंत्रिका तंत्र का एक अस्थायी शारीरिक संकेत मानें। बिना किसी पूर्वाग्रह या निर्णय के अपने विचारों को साक्षी भाव से देखें।';
    } else if (/adrenaline|8 to 12 minutes|physically safe|panic/i.test(cleanReframe)) {
      cbt_reframing = 'यह लहर केवल एड्रेनालाईन का एक अस्थायी बहाव है जो 8 से 12 मिनट में अपने आप शांत हो जाता है। यह असहज अवश्य है, पर आप पूरी तरह सुरक्षित हैं।';
    } else if (/precedes motivation|1% physical step|neurochemistry/i.test(cleanReframe)) {
      cbt_reframing = 'प्रेरणा काम करने के बाद आती है, पहले नहीं। ऊर्जा महसूस होने का इंतज़ार न करें; केवल 1% का एक छोटा सा कदम भी आपके मस्तिष्क के रसायनों को बदलना शुरू कर देता है।';
    } else if (/cortisol|brain fog|working memory/i.test(cleanReframe)) {
      cbt_reframing = 'तनाव के दौरान मानसिक धुंधलापन और स्मृति में रुकावट केवल अस्थायी कोर्टिसोल वृद्धि के कारण होती है, यह कोई स्थायी मानसिक कमी नहीं है।';
    } else if (/not an identity|helplessness|factually true/i.test(cleanReframe)) {
      cbt_reframing = 'यह समझें कि यह भावना तंत्रिका तंत्र की एक स्वाभाविक शारीरिक प्रतिक्रिया है, आपकी स्थायी पहचान नहीं। असहायता की भविष्यवाणी करने वाले स्वचालित विचारों को पहचानें और वर्तमान वास्तविकता में पुनः स्थिर हों।';
    }

    // 2. Somatic Anchor in Hindi
    let somatic_anchor = 'कंधों को कानों से दूर ढीला छोड़ें, एक हाथ नाभि के निचले हिस्से पर रखें और 30 सेकंड तक अपने पैरों के नीचे ज़मीन की स्थिरता को महसूस करें।';
    if (cleanAnchor && /[\u0900-\u097F]/.test(cleanAnchor)) {
      somatic_anchor = cleanAnchor;
    } else if (/ears|lower abdomen|floor underneath your feet/i.test(cleanAnchor)) {
      somatic_anchor = 'कंधों को कानों से दूर ढीला छोड़ें, एक हाथ नाभि के निचले हिस्से पर रखें और 30 सेकंड तक अपने पैरों के नीचे ज़मीन की स्थिरता को महसूस करें।';
    } else if (/unglue your tongue|ground both feet/i.test(cleanAnchor)) {
      somatic_anchor = 'कंधों को ढीला छोड़ें, अपनी जीभ को तालू से अलग करें और 30 सेकंड के लिए दोनों पैरों को ज़मीन पर मजबूती से टिकाएं।';
    } else if (/sip of cool water|tap temples/i.test(cleanAnchor)) {
      somatic_anchor = 'ठंडे पानी का एक घूंट लें, उसे निगलते समय संवेदना पर ध्यान दें और 30 सेकंड तक उंगलियों से कनपटियों को धीरे-धीरे थपथपाएं।';
    } else if (/barefoot|tap your sternum/i.test(cleanAnchor)) {
      somatic_anchor = 'नंगे पैर फर्श पर खड़े हों, पृथ्वी के सहारे को महसूस करें और 60 सेकंड के लिए अपनी छाती के केंद्र को हल्के से थपथपाएं।';
    } else if (/mammalian|ice cube|damp towel|cheeks/i.test(cleanAnchor)) {
      somatic_anchor = 'डाइव रिफ्लेक्स तकनीक: 20 सेकंड के लिए अपने गालों और आंखों के नीचे ठंडा गीला तौलिया या बर्फ का टुकड़ा हल्के से दबाएं।';
    }

    // 3. Pranayama in Hindi
    let pranayama = 'स्वायत्त तंत्रिका तंत्र को संतुलित करने के लिए 3 मिनट तक 4-4-4-4 समवृत्ति बॉक्स ब्रीदिंग या नाड़ी शोधन प्राणायाम का अभ्यास करें।';
    if (cleanPranayama && /[\u0900-\u097F]/.test(cleanPranayama)) {
      pranayama = cleanPranayama;
    } else if (/box breathing|nadi shodhana|autonomic balance/i.test(cleanPranayama)) {
      pranayama = 'स्वायत्त तंत्रिका तंत्र को संतुलित करने के लिए 3 मिनट तक 4-4-4-4 समवृत्ति बॉक्स ब्रीदिंग या नाड़ी शोधन प्राणायाम का अभ्यास करें।';
    } else if (/sama vritti|alternate nostril|vagal balance/i.test(cleanPranayama)) {
      pranayama = 'वैगल टोन और तंत्रिका तंत्र संतुलन के लिए 3 मिनट तक 4-4-4-4 समवृत्ति बॉक्स ब्रीदिंग या नाड़ी शोधन प्राणायाम करें।';
    } else if (/bhramari|humming bee|nitric oxide/i.test(cleanPranayama)) {
      pranayama = 'कपाल में सूक्ष्म स्पंदन पैदा करने और नाइट्रिक ऑक्साइड प्रवाह बढ़ाने के लिए 4 मिनट तक भ्रामरी प्राणायाम का अभ्यास करें।';
    } else if (/surya bhedana|solar breathing|tamasic/i.test(cleanPranayama)) {
      pranayama = 'मानसिक आलस्य और भारीपन को दूर करने के लिए 3 मिनट तक सूर्य भेदन प्राणायाम (दायीं नासिका से श्वास) करें।';
    } else if (/extended exhale|pursed lips/i.test(cleanPranayama)) {
      pranayama = 'लंबी प्रश्वास प्राणायाम: 4 सेकंड नाक से सांस अंदर लें और होंठों को गोल करके 7 सेकंड में धीरे-धीरे बाहर छोड़ें।';
    }

    // 4. Micro-habit in Hindi
    let micro_habit = 'वर्तमान क्षण में अपने सीधे नियंत्रण में आने वाले अगले सकारात्मक छोटे कदम पर ध्यान केंद्रित करें।';
    if (cleanHabit && /[\u0900-\u097F]/.test(cleanHabit)) {
      micro_habit = cleanHabit;
    } else if (/write down|rumination/i.test(cleanHabit)) {
      micro_habit = 'इस समय अपने सीधे नियंत्रण में आने वाले किसी एक अत्यंत छोटे कार्य को लिखें और बाकी चिंता को छोड़ दें।';
    } else if (/single micro-action|overwhelm/i.test(cleanHabit)) {
      micro_habit = 'दीर्घकालिक तनाव को भूलकर, अभी अपने सीधे नियंत्रण में मौजूद केवल एक छोटे से कदम पर ध्यान दें।';
    } else if (/externalize|paper|working memory/i.test(cleanHabit)) {
      micro_habit = 'कार्यों को मन में रखने के बजाय तुरंत कागज़ पर लिख लें ताकि मस्तिष्क पर अतिरिक्त भार न पड़े।';
    } else if (/2-minute|impossible to fail/i.test(cleanHabit)) {
      micro_habit = 'एक ऐसा अत्यंत छोटा 2 मिनट का कार्य करें जिसमें विफलता असंभव हो (जैसे पानी पीना या खिड़की खोलना)।';
    } else if (/whisper|adrenaline|safe in this room/i.test(cleanHabit)) {
      micro_habit = 'धीमे स्वर में स्वयं से कहें: "मेरा शरीर केवल तनाव मुक्त कर रहा है। मैं यहाँ पूरी तरह सुरक्षित हूँ।"';
    }

    return { conditionName, validation, cbt_reframing, somatic_anchor, pranayama, micro_habit };
  }

  if (norm === 'es') {
    const conditionName = 'Protocolo Clínico Cognitivo (TCC)';
    const validation = 'Comprendo profundamente lo desafiante que resulta afrontar esta situación y lo agotador que se siente ahora mismo.';
    let cbt_reframing = 'Reconozca esta experiencia como una señal fisiológica transitoria. Observe sus pensamientos sin juzgarlos.';
    if (/adrenaline|8 to 12 minutes|panic/i.test(cleanReframe)) {
      cbt_reframing = 'Esta oleada es un pico de adrenalina que se metaboliza de forma natural en 8 a 12 minutos. Es incómodo, pero está físicamente a salvo.';
    } else if (/precedes motivation|1% physical step/i.test(cleanReframe)) {
      cbt_reframing = 'La acción precede a la motivación. No espere a sentirse con energía; dar un paso mínimo del 1% comienza a transformar su neuroquímica.';
    } else if (/cortisol|brain fog/i.test(cleanReframe)) {
      cbt_reframing = 'Los lapsos de memoria y la niebla mental bajo estrés se deben a picos transitorios de cortisol, no a un deterioro neurológico permanente.';
    } else if (/not an identity|helplessness/i.test(cleanReframe)) {
      cbt_reframing = 'Reconozca que este sentimiento es una respuesta fisiológica válida, no su identidad. Identifique pensamientos catastróficos y concéntrese en lo que es objetivamente cierto ahora.';
    }

    let somatic_anchor = 'Baje los hombros lejos de las orejas, apoye una mano sobre el abdomen inferior y sienta el suelo firme bajo sus pies durante 30 segundos.';
    if (/tongue|ground both feet/i.test(cleanAnchor)) {
      somatic_anchor = 'Baje los hombros, despegue la lengua del paladar y apoye firmemente ambos pies sobre el suelo durante 30 segundos.';
    } else if (/water|tap temples/i.test(cleanAnchor)) {
      somatic_anchor = 'Beba un sorbo de agua fresca, preste atención al tragar y golpee suavemente las sienes con las yemas de los dedos durante 30 segundos.';
    } else if (/barefoot|sternum/i.test(cleanAnchor)) {
      somatic_anchor = 'Póngase de pie descalzo sobre el suelo, sienta el apoyo de la tierra y golpee suavemente su esternón durante 60 segundos.';
    } else if (/mammalian|ice cube/i.test(cleanAnchor)) {
      somatic_anchor = 'Reflejo de inmersión: presione una toalla fría y húmeda o hielo sobre sus mejillas durante 20 segundos.';
    }

    let pranayama = 'Practique la respiración cuadrada 4-4-4-4 o Nadi Shodhana durante 3 minutos para restaurar el equilibrio autonómico.';
    if (/bhramari|humming bee/i.test(cleanPranayama)) {
      pranayama = 'Realice Bhramari (respiración del zumbido de abeja) durante 4 minutos para generar microvibraciones craneales calmantes.';
    } else if (/surya bhedana|solar breathing/i.test(cleanPranayama)) {
      pranayama = 'Realice Surya Bhedana (respiración solar por la fosa nasal derecha) durante 3 minutos para disipar el letargo.';
    } else if (/extended exhale/i.test(cleanPranayama)) {
      pranayama = 'Respiración de exhalación prolongada: inhale 4 segundos por la nariz y exhale 7 segundos con los labios entreabiertos.';
    }

    let micro_habit = 'Concéntrese únicamente en la siguiente micro-acción constructiva dentro de su control inmediato.';
    if (/write down|rumination/i.test(cleanHabit)) {
      micro_habit = 'Anote una única micro-tarea que esté bajo su control directo en este momento y suelte la rumiación futura.';
    } else if (/single micro-action/i.test(cleanHabit)) {
      micro_habit = 'Realice una micro-acción inmediata que esté bajo su control directo, ignorando el agobio a largo plazo.';
    } else if (/externalize/i.test(cleanHabit)) {
      micro_habit = 'Escriba las tareas de inmediato en papel físico en lugar de sobrecargar su memoria de trabajo.';
    } else if (/2-minute/i.test(cleanHabit)) {
      micro_habit = 'Comprométase con una micro-tarea de 2 minutos donde sea imposible fallar (beber agua, abrir la ventana).';
    }

    return { conditionName, validation, cbt_reframing, somatic_anchor, pranayama, micro_habit };
  }

  if (norm === 'fr') {
    const conditionName = 'Protocole Clinique Cognitif (TCC)';
    const validation = 'Je mesure pleinement combien il est éprouvant de traverser cette épreuve et à quel point cela est épuisant actuellement.';
    let cbt_reframing = 'Considérez cette expérience comme un signal physiologique transitoire. Observez vos pensées avec bienveillance et sans jugement.';
    if (/adrenaline|8 to 12 minutes|panic/i.test(cleanReframe)) {
      cbt_reframing = 'Cette vague est une montée d\'adrénaline qui se dissipe naturellement en 8 à 12 minutes. C\'est inconfortable, mais vous êtes en sécurité physique.';
    } else if (/precedes motivation|1% physical step/i.test(cleanReframe)) {
      cbt_reframing = 'L\'action précède la motivation. N\'attendez pas d\'avoir de l\'énergie : accomplir ne serait-ce qu\'une micro-action de 1 % commence à modifier votre neurochimie.';
    } else if (/cortisol|brain fog/i.test(cleanReframe)) {
      cbt_reframing = 'Les trous de mémoire et le brouillard mental sous stress résultent de pics temporaires de cortisol, et non d\'un déclin neurologique.';
    } else if (/not an identity|helplessness/i.test(cleanReframe)) {
      cbt_reframing = 'Comprenez que cette sensation est une réaction physiologique passagère et non votre identité. Prenez du recul sur les pensées d\'impuissance et revenez aux faits actuels.';
    }

    let somatic_anchor = 'Relâchez les épaules loin des oreilles, posez une main sur le bas-ventre et ressentez le contact ferme du sol sous vos pieds pendant 30 secondes.';
    if (/tongue|ground both feet/i.test(cleanAnchor)) {
      somatic_anchor = 'Abaissez vos épaules, décollez votre langue du palais et ancrez vos deux pieds fermement au sol pendant 30 secondes.';
    } else if (/water|tap temples/i.test(cleanAnchor)) {
      somatic_anchor = 'Buvez une gorgée d\'eau fraîche en observant la déglutition, puis tapotez doucement vos tempes du bout des doigts pendant 30 secondes.';
    } else if (/barefoot|sternum/i.test(cleanAnchor)) {
      somatic_anchor = 'Tenez-vous pieds nus sur le sol, ressentez l\'ancrage de la terre et tapotez doucement votre sternum pendant 60 secondes.';
    } else if (/mammalian|ice cube/i.test(cleanAnchor)) {
      somatic_anchor = 'Réflexe d\'immersion : appliquez une serviette fraîche et humide ou un glaçon sur le haut de vos joues pendant 20 secondes.';
    }

    let pranayama = 'Pratiquez la respiration carrée 4-4-4-4 ou Nadi Shodhana pendant 3 minutes pour rétablir l\'équilibre autonome.';
    if (/bhramari|humming bee/i.test(cleanPranayama)) {
      pranayama = 'Pratiquez Bhramari (souffle de l\'abeille) pendant 4 minutes pour créer des micro-vibrations crâniennes apaisantes.';
    } else if (/surya bhedana|solar breathing/i.test(cleanPranayama)) {
      pranayama = 'Pratiquez Surya Bhedana (respiration solaire par la narine droite) pendant 3 minutes pour dissiper la léthargie.';
    } else if (/extended exhale/i.test(cleanPranayama)) {
      pranayama = 'Respiration à expiration prolongée : inspirez 4 secondes par le nez et expirez 7 secondes par les lèvres pincées.';
    }

    let micro_habit = 'Concentrez-vous uniquement sur la prochaine micro-action constructive sous votre contrôle immédiat.';
    if (/write down|rumination/i.test(cleanHabit)) {
      micro_habit = 'Notez une seule micro-tâche sous votre contrôle direct dès maintenant et laissez de côté les ruminations.';
    } else if (/single micro-action/i.test(cleanHabit)) {
      micro_habit = 'Posez une seule micro-action sous votre contrôle immédiat, sans vous préoccuper de l\'inconnu futur.';
    } else if (/externalize/i.test(cleanHabit)) {
      micro_habit = 'Notez immédiatement vos tâches sur papier pour désencombrer votre mémoire de travail.';
    } else if (/2-minute/i.test(cleanHabit)) {
      micro_habit = 'Engagez-vous dans une micro-tâche de 2 minutes impossible à rater (boire un verre d\'eau, ouvrir les rideaux).';
    }

    return { conditionName, validation, cbt_reframing, somatic_anchor, pranayama, micro_habit };
  }

  if (norm === 'de') {
    const conditionName = 'Klinisches Kognitives Protokoll (CBT)';
    const validation = 'Ich verstehe gut, wie fordernd die Bewältigung dieser Situation derzeit ist und wie sehr sie erschöpft.';
    let cbt_reframing = 'Betrachten Sie dieses Erleben als ein vorübergehendes physiologisches Signal. Beobachten Sie Ihre Gedanken völlig wertfrei.';
    if (/adrenaline|8 to 12 minutes|panic/i.test(cleanReframe)) {
      cbt_reframing = 'Diese Welle ist ein Adrenalinschub, der sich innerhalb von 8 bis 12 Minuten von selbst abbaut. Es fühlt sich unangenehm an, aber Sie sind vollkommen sicher.';
    } else if (/precedes motivation|1% physical step/i.test(cleanReframe)) {
      cbt_reframing = 'Handlung geht Motivation voraus. Warten Sie nicht auf Energie; selbst ein minimaler Schritt von 1% beginnt bereits, Ihre Neurochemie positiv zu verändern.';
    } else if (/cortisol|brain fog/i.test(cleanReframe)) {
      cbt_reframing = 'Konzentrationslücken und Denkblockaden unter Stress entstehen durch kurzfristige Cortisolspitzen und stellen keinen dauerhaften Abbau dar.';
    } else if (/not an identity|helplessness/i.test(cleanReframe)) {
      cbt_reframing = 'Erkennen Sie, dass dieses Gefühl eine natürliche physiologische Reaktion ist und nicht Ihre Identität. Hinterfragen Sie Ohnmachtsgedanken und verankern Sie sich im gegenwärtigen Moment.';
    }

    let somatic_anchor = 'Lassen Sie die Schultern locker nach unten sinken, legen Sie eine Hand auf den Unterbauch und spüren Sie 30 Sekunden lang den festen Boden unter Ihren Füßen.';
    if (/tongue|ground both feet/i.test(cleanAnchor)) {
      somatic_anchor = 'Senken Sie Ihre Schultern, lösen Sie die Zunge vom Gaumen und stellen Sie beide Füße für 30 Sekunden fest auf den Boden.';
    } else if (/water|tap temples/i.test(cleanAnchor)) {
      somatic_anchor = 'Nehmen Sie einen Schluck kühles Wasser, spüren Sie das Schlucken bewusst und tippen Sie mit den Fingerspitzen 30 Sekunden lang sanft an die Schläfen.';
    } else if (/barefoot|sternum/i.test(cleanAnchor)) {
      somatic_anchor = 'Stellen Sie sich barfuß auf den Boden, spüren Sie den festen Halt und klopfen Sie 60 Sekunden lang sanft auf Ihr Brustbein.';
    } else if (/mammalian|ice cube/i.test(cleanAnchor)) {
      somatic_anchor = 'Tauchreflex-Stimulation: Drücken Sie 20 Sekunden lang ein kühles, feuchtes Tuch oder Eis sanft an Ihre Wangen.';
    }

    let pranayama = 'Praktizieren Sie 3 Minuten lang 4-4-4-4 Box-Atmung oder Nadi Shodhana, um das vegetative Nervensystem auszugleichen.';
    if (/bhramari|humming bee/i.test(cleanPranayama)) {
      pranayama = 'Üben Sie 4 Minuten lang Bhramari (Bienensummen-Atmung), um beruhigende Mikrovibrationen im Kopfbereich zu erzeugen.';
    } else if (/surya bhedana|solar breathing/i.test(cleanPranayama)) {
      pranayama = 'Praktizieren Sie 3 Minuten lang Surya Bhedana (Sonnenatmung durch das rechte Nasenloch), um Trägheit aufzulösen.';
    } else if (/extended exhale/i.test(cleanPranayama)) {
      pranayama = 'Verlängerte Ausatmung: 4 Sekunden durch die Nase einatmen und 7 Sekunden langsam durch die leicht geöffneten Lippen ausatmen.';
    }

    let micro_habit = 'Konzentrieren Sie sich rein auf die nächste konstruktive Mikro-Handlung in Ihrem direkten Einflussbereich.';
    if (/write down|rumination/i.test(cleanHabit)) {
      micro_habit = 'Notieren Sie eine einzige Mikro-Aufgabe, die Sie jetzt direkt kontrollieren können, und lassen Sie Grübeleien los.';
    } else if (/single micro-action/i.test(cleanHabit)) {
      micro_habit = 'Führen Sie eine einzige kleine Handlung aus, die Sie sofort bewältigen können, und ignorieren Sie die Gesamtsituation.';
    } else if (/externalize/i.test(cleanHabit)) {
      micro_habit = 'Bringen Sie Aufgaben sofort auf Papier, anstatt das Arbeitsgedächtnis damit zu überlasten.';
    } else if (/2-minute/i.test(cleanHabit)) {
      micro_habit = 'Führen Sie eine 2-Minuten-Aufgabe aus, die nicht fehlschlagen kann (ein Glas Wasser trinken, das Fenster öffnen).';
    }

    return { conditionName, validation, cbt_reframing, somatic_anchor, pranayama, micro_habit };
  }

  // English default
  return {
    conditionName: rawConditionName || 'Clinical Condition Protocol',
    validation: `I hear what you are navigating with ${rawConditionName || 'this experience'} and understand how exhausting it feels right now.`,
    cbt_reframing: cleanReframe || 'Acknowledge your emotional experience with compassionate, objective awareness.',
    somatic_anchor: cleanAnchor || 'Ground your feet onto the floor, unclench your jaw, and let your shoulders drop.',
    pranayama: cleanPranayama || 'Practice 4-4-4-4 Box Breathing or extended exhalations to settle your nervous system.',
    micro_habit: cleanHabit || 'Focus purely on the single next constructive micro-action within your immediate control.',
  };
}

export function getLocalizedClinicalIntervention(
  conditionId: string,
  languageCode?: string,
  fallbackObject?: any
): LocalizedIntervention {
  const norm = normalizeLanguageCode(languageCode);
  const data = getLocaleData(norm);
  const entry = data.interventions?.[conditionId];

  if (entry) {
    return entry;
  }

  // Dynamic clinical synthesis for psychology library and self-learned conditions
  const conditionObj = fallbackObject || getConditionById(conditionId);
  if (conditionObj && conditionObj.solutions) {
    return localizeDynamicSolutions(conditionObj.solutions, norm, conditionObj.name);
  }

  if (norm !== 'en') {
    const enData = getLocaleData('en');
    const enEntry = enData.interventions?.[conditionId];
    if (enEntry) {
      return localizeDynamicSolutions(
        {
          cbt_reframing: enEntry.cbt_reframing,
          somatic_anchor: enEntry.somatic_anchor,
          pranayama: enEntry.pranayama,
          micro_habit: enEntry.micro_habit,
        },
        norm,
        enEntry.conditionName
      );
    }
  }

  // Universal Default Condition Interventions (GAD / Anxiety Fallback in target locale)
  return data.interventions?.gad || getLocaleData('en').interventions?.gad;
}

export function getLocalizedGitaItem(gitaItem: any, langCode?: string): LocalizedGitaWisdom {
  const norm = normalizeLanguageCode(langCode);
  const data = getLocaleData(norm);
  const entry = data.gita?.[gitaItem?.id];
  if (entry) {
    return entry;
  }
  return {
    meaning: gitaItem?.philosophical_meaning || '',
    reflection: gitaItem?.clinical_reframe || '',
    what_to_do: gitaItem?.actionable_guidance?.what_to_do || '',
    what_not_to_do: gitaItem?.actionable_guidance?.what_not_to_do || '',
  };
}

export function getLocalizedTratakaItem(tratakItem: any, langCode?: string): LocalizedTratakaWisdom {
  const norm = normalizeLanguageCode(langCode);
  const data = getLocaleData(norm);
  const entry = data.trataka?.[tratakItem?.mode];
  if (entry) {
    return entry;
  }
  return {
    name: tratakItem?.name || '',
    focalTarget: tratakItem?.focalTarget || '',
    neuroMechanism: tratakItem?.neuroMechanism || '',
    guidance: tratakItem?.stepByStepGuidance ? tratakItem.stepByStepGuidance.join(' ') : '',
  };
}

/**
 * Assesses the user's emotion, suffering severity level (1-10), autonomic nervous
 * system dysregulation, and generates a compassionate, tailored input summary.
 */
export function buildDiagnosticSufferingAssessment(
  userMessage?: string,
  emotionHint?: string,
  conditionName?: string,
  languageCode?: string
): SufferingAssessmentData {
  const norm = normalizeLanguageCode(languageCode);
  const data = getLocaleData(norm);
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const diag = emotionClassifier.classifyText(text);
  const activeEmotionId = emotionHint || diag.dimensionId || 'anxiety';

  const directPositiveAssertion =
    /\b(i am|i'm|i feel|feeling)\s+(?:very\s+|so\s+|really\s+|quite\s+)?(happy|joyful|great|delighted|ecstatic|wonderful|fantastic|elated|cheerful|calm|peaceful|serene|relaxed)\b|\b(i am|i'm)\s+(good|fine|doing good|so happy|very happy)\b|(?:^|\s)(मैं\s+(?:काफी\s+|बहुत\s+)?(?:खुश|प्रसन्न|शांत|स्थिर)\s+हूँ|सब\s+ठीक\s+है)|(\b(estoy|me siento)\s+(?:muy\s+)?(feliz|bien|contento|alegre|tranquilo)\b)|(\b(je suis|je me sens)\s+(?:très\s+)?(heureux|bien|joyeux|calme)\b)|(\b(ich bin|ich fühle mich)\s+(?:sehr\s+)?(glücklich|gut|froh|ruhig)\b)/i.test(text);

  const hasDistressKeywords =
    !directPositiveAssertion &&
    /(?:distress|anxious|anxiety|depress|sad|fear|scared|panic|stress|overwhelm|worry|worried|grief|pain|burnout|lonely|loneliness|angry|anger|trauma|shame|guilt|fail|terrif|crying|tears|breakup|heartbreak|chinta|tanaav|udas|gussa|troubled|need help|please help me|help me please|someone help me|help me i'm|help me i am|debt|debts|financial|loan|loans|money|broke|bills|burden|hopeless|empty|meaningless|numb|giving up|exhaust|insomnia|insecure|rejection|unmotivated|hurting|conflict|fight|argument|divorce|struggl|suicid|दर्द|रोना|रो |रोने|रोऊ|दुःख|दुख|तनाव|चिंता|उदासी|डर|घबराहट|घबरा|ब्रेकअप|परेशान|पीड़ा|कष्ट|क्रोध|अकेला|हार|असफल|टूटा|कर्ज|पैसे|आर्थिक|झगड़ा|अच्छा नहीं|कुछ अच्छा नहीं|कुछ ठीक नहीं|ठीक नहीं लग|मन नहीं लग|टेंशन|तनावग्रस्त|रोना आ रहा|बुरा लग|उदासी)/i.test(text);

  const isPositive =
    directPositiveAssertion ||
    (!hasDistressKeywords &&
     diag.coreAffect.valence >= 0.2 &&
     (activeEmotionId === 'joy' ||
      activeEmotionId === 'calmness' ||
      activeEmotionId === 'satisfaction' ||
      activeEmotionId === 'relief' ||
      activeEmotionId === 'adoration' ||
      activeEmotionId === 'amusement'));

  // Calculate distress score (1-10) based on valence, arousal and intensity
  let distressScore = 7;
  if (isPositive) {
    distressScore = 1;
  } else if (
    diag.intensity === 'peak' ||
    diag.coreAffect.valence <= -0.8 ||
    lower.includes('terrified') ||
    lower.includes('panic') ||
    lower.includes('heartbreak') ||
    lower.includes('cannot bear') ||
    lower.includes('furious') ||
    lower.includes('ब्रेकअप') ||
    lower.includes('रोना')
  ) {
    distressScore = 8 + (Math.abs(diag.coreAffect.valence) > 0.88 || diag.coreAffect.arousal > 0.8 ? 1 : 0);
  } else if (diag.coreAffect.valence <= -0.55 || diag.coreAffect.arousal >= 0.65) {
    distressScore = 7;
  } else if (diag.coreAffect.valence <= -0.25) {
    distressScore = 5;
  } else {
    distressScore = 4;
  }

  // Determine nervous system state
  const isDorsal =
    !isPositive &&
    (diag.polyvagalState?.toLowerCase().includes('dorsal') ||
      diag.coreAffect.arousal < -0.3 ||
      lower.includes('numb') ||
      lower.includes('hopeless') ||
      lower.includes('empty') ||
      lower.includes('exhaust'));
  const isSympathetic = !isPositive && !isDorsal;

  let matchedKey = 'anxiety';
  if (isPositive) {
    matchedKey = activeEmotionId.includes('calm') || activeEmotionId.includes('relief') ? 'calmness' : 'joy';
  } else if (activeEmotionId.includes('sad') || activeEmotionId.includes('grief') || lower.includes('heartbreak') || lower.includes('broke up') || lower.includes('ब्रेकअप') || lower.includes('रोना') || lower.includes('दर्द')) matchedKey = 'sadness';
  else if (activeEmotionId.includes('ang') || activeEmotionId.includes('rage') || lower.includes('yelled') || lower.includes('furious') || lower.includes('क्रोध') || lower.includes('गुस्सा')) matchedKey = 'anger';
  else if (activeEmotionId.includes('panic') || activeEmotionId.includes('fear') || lower.includes('terrified') || lower.includes('डर') || lower.includes('घबराहट')) matchedKey = 'fear';
  else if (activeEmotionId.includes('sham') || activeEmotionId.includes('guilt') || lower.includes('fake') || lower.includes('imposter') || lower.includes('failure') || lower.includes('हीनभावना')) matchedKey = 'shame';
  else if (activeEmotionId.includes('dilemma') || activeEmotionId.includes('confus') || lower.includes('cannot decide') || lower.includes("can't decide") || lower.includes('असमंजस') || lower.includes('समझ नहीं')) matchedKey = 'confusion';
  else if (activeEmotionId.includes('overwhelm') || activeEmotionId.includes('burnout') || lower.includes('racing thoughts') || lower.includes('hurricane') || lower.includes('तनाव')) matchedKey = 'overwhelm';

  const cleanCondition = (conditionName || '')
    .replace(/^Learned:\s*/i, '')
    .replace(/\s*Protocol$/i, '')
    .trim();

  const emotionName = data.assessment.emotions[matchedKey] || (cleanCondition || diag.dimensionName);

  // Severity Label
  const severityLabel = isPositive
    ? data.assessment.severity.positive
    : (distressScore >= 8
        ? data.assessment.severity.severe
        : (distressScore >= 6
            ? data.assessment.severity.moderate
            : data.assessment.severity.mild));

  // Nervous System State
  const nervousSystem = isPositive
    ? data.assessment.nervousSystem.positive
    : (isSympathetic
        ? data.assessment.nervousSystem.sympathetic
        : data.assessment.nervousSystem.dorsal);

  // Bodily Markers
  const bodilyMarkers = isPositive
    ? data.assessment.bodilyMarkers.positive
    : (isSympathetic
        ? data.assessment.bodilyMarkers.sympathetic
        : data.assessment.bodilyMarkers.dorsal);

  // User input summary
  let inputSummary = "";
  if (isPositive) {
    inputSummary = data.assessment.inputSummaries.positive;
  } else if (lower.includes('debt') || lower.includes('financial') || lower.includes('loan') || lower.includes('money') || lower.includes('bills') || lower.includes('कर्ज') || lower.includes('पैसे') || lower.includes('आर्थिक')) {
    inputSummary = data.assessment.inputSummaries.debt;
  } else if (lower.includes('lonely') || lower.includes('loneliness') || lower.includes('alone') || lower.includes('isolated') || lower.includes('nobody') || lower.includes('अकेला')) {
    inputSummary = data.assessment.inputSummaries.lonely;
  } else if (lower.includes('family') || lower.includes('parents') || lower.includes('argument') || lower.includes('fight') || lower.includes('divorce') || lower.includes('झगड़ा') || lower.includes('लड़ाई')) {
    inputSummary = data.assessment.inputSummaries.family;
  } else if (lower.includes('hopeless') || lower.includes('empty') || lower.includes('meaningless') || lower.includes('numb') || lower.includes('निराश') || lower.includes('उदास')) {
    inputSummary = data.assessment.inputSummaries.hopeless;
  } else if (lower.includes('interview') || lower.includes('exam') || lower.includes('test') || lower.includes('failing') || lower.includes('career')) {
    inputSummary = data.assessment.inputSummaries.interview;
  } else if (lower.includes('breakup') || lower.includes('broke up') || lower.includes('partner') || lower.includes('heartbreak') || lower.includes('grief')) {
    inputSummary = data.assessment.inputSummaries.breakup;
  } else if (lower.includes('boss') || lower.includes('yelled') || lower.includes('gaslight') || lower.includes('rage') || lower.includes('furious')) {
    inputSummary = data.assessment.inputSummaries.boss;
  } else if (lower.includes('fake') || lower.includes('failure') || lower.includes('hate myself') || lower.includes('loser') || lower.includes('imposter')) {
    inputSummary = data.assessment.inputSummaries.fake;
  } else if (lower.includes('overwhelm') || lower.includes('racing') || lower.includes('hurricane') || lower.includes('chaos') || lower.includes('adhd')) {
    inputSummary = data.assessment.inputSummaries.overwhelm;
  } else {
    const hasEnglishLetters = /[a-zA-Z]{3,}/.test(cleanCondition);
    const conditionSnippet = cleanCondition
      ? (norm === 'hi'
          ? (hasEnglishLetters ? ' इस मानसिक चुनौती व भावनात्मक दबाव' : ` जो ${cleanCondition} से जुड़ा है`)
          : norm === 'es'
          ? (hasEnglishLetters ? ' esta situación de sobrecarga emocional' : ` vinculado a ${cleanCondition}`)
          : norm === 'fr'
          ? (hasEnglishLetters ? ' cette épreuve de tension émotionnelle' : ` liée à ${cleanCondition}`)
          : norm === 'de'
          ? (hasEnglishLetters ? ' dieser emotionalen Belastungssituation' : ` im Zusammenhang mit ${cleanCondition}`)
          : ` related to ${cleanCondition}`)
      : '';
    inputSummary = data.assessment.inputSummaries.defaultTemplate.replace('{condition}', conditionSnippet);
  }

  // Full section Markdown
  let markdown = "";
  if (isPositive) {
    const tmpl = data.assessment.markdownTemplates.positive;
    markdown = `${tmpl.title}
• **${tmpl.stateLabel}:** ${emotionName}
• **${tmpl.autonomicLabel}:** ${severityLabel} | ${nervousSystem}
• **${tmpl.somaticLabel}:** ${bodilyMarkers}
• **${tmpl.summaryLabel}:** ${inputSummary}`;
  } else {
    const tmpl = data.assessment.markdownTemplates.distress;
    markdown = `${tmpl.title}
• **${tmpl.stateLabel}:** ${emotionName} (${severityLabel}, ${distressScore}/10) | ${nervousSystem}
• **${tmpl.focusLabel}:** ${inputSummary}`;
  }

  return {
    emotionId: matchedKey,
    emotionName,
    severityLabel,
    distressScore,
    nervousSystem,
    bodilyMarkers,
    inputSummary,
    markdown,
  };
}

/**
 * Explains how Gita + CBT + Tratak work together synergistically to resolve the user's issue.
 */
export function buildTriPillarSynergyResolution(
  languageCode?: string,
  tratakName?: string,
  _gitaTheme?: string,
  _isFollowUp?: boolean
): string {
  const norm = normalizeLanguageCode(languageCode);
  const data = getLocaleData(norm);
  const tName = tratakName || "Tratak Gazing";
  return data.synergyResolution.template.replace(/\{tratakName\}/g, tName);
}

/**
 * Formats a cohesive, compassionate, 100% human-like therapeutic message
 * in the user's local language without mixing English phrases or labels.
 */
export function formatHumanTherapeuticMessage(
  conditionIdOrObject: any,
  languageCode?: string,
  userMessage?: string,
  excludeGitaIds?: string[],
  isFollowUp?: boolean
): string {
  const norm = normalizeLanguageCode(languageCode);
  const data = getLocaleData(norm);

  let condId = 'gad';
  let condObj: any = null;
  if (typeof conditionIdOrObject === 'string') {
    condId = conditionIdOrObject;
  } else if (conditionIdOrObject && typeof conditionIdOrObject === 'object') {
    condId = conditionIdOrObject.id || 'gad';
    condObj = conditionIdOrObject;
  }

  const intervention = getLocalizedClinicalIntervention(condId, norm, condObj);
  const contextText = `${userMessage || ''} ${intervention.conditionName} ${condId}`;
  const gitaItem = findGitaWisdom(contextText, undefined, condId, excludeGitaIds);
  const tratakItem = condObj?.recommended_trataka_mode
    ? (TRATAKA_PRESCRIPTIONS[condObj.recommended_trataka_mode as TratakaModeId] || resolveTratakaPrescription(contextText))
    : resolveTratakaPrescription(contextText);
  const gitaBlock = formatGitaShlokaBlock(gitaItem);

  const locGita = getLocalizedGitaItem(gitaItem, norm);
  const locTratak = getLocalizedTratakaItem(tratakItem, norm);

  const diagnosticAssessment = buildDiagnosticSufferingAssessment(userMessage, condId, intervention.conditionName, norm);
  const synergyResolution = buildTriPillarSynergyResolution(norm, locTratak.name, gitaItem.theme, isFollowUp);

  const p = data.messagePillars;
  const gitaHeader = p.gitaTitle.replace('{chapter}', String(gitaItem.chapter)).replace('{verse}', String(gitaItem.verse));
  const tratakHeader = p.tratakaTitle.replace('{name}', locTratak.name);
  const tratakPractice = p.tratakaPractice.replace('{duration}', String(tratakItem.durationMinutes));

  if (norm === 'en') {
    return `${diagnosticAssessment.markdown}

${gitaHeader}
${gitaBlock}
${p.gitaSpeaker} ${gitaItem.philosophical_meaning}
${p.gitaAction} ${gitaItem.actionable_guidance.what_to_do}

${p.cbtTitle}
${intervention.cbt_reframing}
${p.cbtSomaticAnchor} ${intervention.somatic_anchor} (${intervention.pranayama})

${tratakHeader}
• **${p.tratakaFocalTarget}** ${tratakItem.focalTarget}
• **${tratakPractice}** ${tratakItem.stepByStepGuidance.join(' ')}

${synergyResolution}`;
  }

  return `${diagnosticAssessment.markdown}

${gitaHeader}
${gitaBlock}
${p.gitaSpeaker} ${locGita.meaning}
${p.gitaAction} ${locGita.what_to_do}

${p.cbtTitle}
${intervention.cbt_reframing}
${p.cbtSomaticAnchor} ${intervention.somatic_anchor} (${intervention.pranayama})

${tratakHeader}
• **${p.tratakaFocalTarget}** ${locTratak.focalTarget}
• **${tratakPractice}** ${locTratak.guidance}

${synergyResolution}`;
}

/**
 * Get general supportive advice with full 3-solution structure when no specific condition is matched.
 */
export function getLocalizedGeneralAdvice(
  emotion: string,
  languageCode?: string,
  userMessage?: string,
  excludeGitaIds?: string[],
  isFollowUp?: boolean
): string {
  const norm = normalizeLanguageCode(languageCode);
  const data = getLocaleData(norm);
  const localeTable = data.generalAdvice;
  const key = (emotion || '').toLowerCase();

  let advice = localeTable.default;
  if (key.includes('anxiet') || key.includes('panic') || key.includes('fear') || key.includes('worry')) {
    advice = localeTable.anxiety;
  } else if (key.includes('sad') || key.includes('depress') || key.includes('grief') || key.includes('lonel')) {
    advice = localeTable.sadness;
  } else if (key.includes('ang') || key.includes('frustrat') || key.includes('irrit')) {
    advice = localeTable.anger;
  } else if (key.includes('overwhelm') || key.includes('burnout') || key.includes('fatigue')) {
    advice = localeTable.overwhelm;
  }

  const contextText = `${userMessage || ''} ${emotion}`;
  const gitaItem = findGitaWisdom(contextText, undefined, undefined, excludeGitaIds);
  const tratakItem = resolveTratakaPrescription(contextText);
  const gitaBlock = formatGitaShlokaBlock(gitaItem);

  const locGita = getLocalizedGitaItem(gitaItem, norm);
  const locTratak = getLocalizedTratakaItem(tratakItem, norm);

  const diagnosticAssessment = buildDiagnosticSufferingAssessment(userMessage, emotion, undefined, norm);
  const synergyResolution = buildTriPillarSynergyResolution(norm, locTratak.name, gitaItem.theme, isFollowUp);

  const p = data.messagePillars;
  const s = data.generalAdviceSpeakers;
  const gitaHeader = p.gitaTitle.replace('{chapter}', String(gitaItem.chapter)).replace('{verse}', String(gitaItem.verse));
  const tratakHeader = p.tratakaTitle.replace('{name}', locTratak.name);
  const tratakPractice = p.tratakaPractice.replace('{duration}', String(tratakItem.durationMinutes));

  if (norm === 'en') {
    return `${diagnosticAssessment.markdown}

${gitaHeader}
${gitaBlock}
${s.gitaSpeaker} ${gitaItem.philosophical_meaning}
${s.gitaReflection} ${gitaItem.clinical_reframe}

${p.cbtTitle}
${advice}

${tratakHeader}
• **${p.tratakaFocalTarget}** ${tratakItem.focalTarget}
• **${tratakPractice}** ${tratakItem.stepByStepGuidance.join(' ')}

${synergyResolution}`;
  }

  return `${diagnosticAssessment.markdown}

${gitaHeader}
${gitaBlock}
${s.gitaSpeaker} ${locGita.meaning}
${s.gitaReflection} ${locGita.reflection}

${p.cbtTitle}
${advice}

${tratakHeader}
• **${p.tratakaFocalTarget}** ${locTratak.focalTarget}
• **${tratakPractice}** ${locTratak.guidance}

${synergyResolution}`;
}
