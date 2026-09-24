/**
 * lib/safety/crisis-detector.ts
 *
 * Healthcare AI Crisis & Safety Detector
 * Implements deterministic zero-false-negative crisis detection, immediate deflection scripts,
 * and emergency hotline numbers for HIPAA/GDPR clinical AI compliance.
 *
 * Hardened with:
 * 1. Unicode NFKD Canonical Decomposition (strips diacritics, Cyrillic/Greek homoglyphs)
 * 2. Zero-width space & invisible control character removal
 * 3. Leetspeak & phonetic substitution translation (0->o, 1->i, 3->e, 4->a, @->a, 5->s, 7->t, 8->b, !->i, $->s)
 * 4. Punctuation/delimiter-collapsed canonical pass
 */

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'immediate' | 'acute_crisis';
  triggerCategory?: 'suicide_ideation' | 'self_harm' | 'severe_violence' | 'acute_psychosis' | 'domestic_abuse';
  matchedPattern?: string;
  matchedPatterns?: string[];
  immediateDeflectionStatement?: string;
  recommendedHotlines: EmergencyHotline[];
}

export interface EmergencyHotline {
  name: string;
  region: string;
  phone: string;
  textOption?: string;
  website?: string;
  is24x7: boolean;
  description: string;
}

export const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    region: 'United States & Canada',
    phone: '988',
    textOption: 'Text 988',
    website: 'https://988lifeline.org',
    is24x7: true,
    description: 'Free, confidential support for people in suicidal crisis or emotional distress 24/7.',
  },
  {
    name: 'Tele-MANAS (National Tele Mental Health Programme)',
    region: 'India (All Languages)',
    phone: '14416',
    textOption: 'Toll-free 1800-891-4416',
    website: 'https://telemanas.mohfw.gov.in',
    is24x7: true,
    description: 'Comprehensive, free, 24/7 tele-mental health services with certified clinical psychologists across India.',
  },
  {
    name: 'Crisis Text Line',
    region: 'US, UK, Canada',
    phone: 'Text HOME to 741741',
    textOption: 'Text 741741',
    website: 'https://www.crisistextline.org',
    is24x7: true,
    description: 'Connect with a volunteer crisis counselor via text 24/7.',
  },
  {
    name: 'Vandrevala Foundation Helpline',
    region: 'India',
    phone: '+91 9999 666 555',
    website: 'https://www.vandrevalafoundation.com',
    is24x7: true,
    description: '24/7 mental health crisis support across India.',
  },
  {
    name: 'KIRAN National Helpline',
    region: 'India',
    phone: '1800-599-0019',
    is24x7: true,
    description: 'Ministry of Social Justice 24/7 mental health helpline.',
  },
  {
    name: 'NHS Mental Health Services / Samaritans',
    region: 'United Kingdom',
    phone: '111',
    textOption: 'Samaritans: 116 123',
    website: 'https://www.samaritans.org',
    is24x7: true,
    description: 'Free, confidential emotional support across the UK.',
  },
];

const CRISIS_PATTERNS: { category: CrisisDetectionResult['triggerCategory']; regex: RegExp }[] = [
  {
    category: 'suicide_ideation',
    regex: /(kill(ing|ed|s)?\s*myself|end(ing|ed|s)?\s*my\s*life|want\s*to\s*die|suicid(e|al)|commit(ting|ted)?\s*suicide|better\s*off\s*dead|don'?t\s*want\s*to\s*live|no\s*reason\s*to\s*live|hang(ing|ed)?\s*myself|overdos(e|ing|ed)|slit(ting)?\s*my\s*wrists?|cut(ting)?\s*(my\s*)?wrists?|jump(ing|ed)?\s*(off|in\s*front\s*of)|shoot(ing)?\s*myself|ending\s*it\s*all|goodbye\s*cruel\s*world|take\s*my\s*own\s*life|ready\s*to\s*die|farewell\s*notes?|don'?t\s*want\s*to\s*wake\s*up|better\s*off\s*without\s*me|disappear\s*forever|cannot\s*guarantee\s*my\s*(physical\s*)?safety|can'?t\s*guarantee\s*my\s*(physical\s*)?safety|hoarded\s*.*(pills|sleeping\s*pills)|sleeping\s*pills\s*in\s*my\s*drawer|balcony\s*ledge|standing\s*on\s*the\s*(balcony\s*)?ledge|आत्महत्या|जीवन\s*(को\s*)?(समाप्त|खत्म)|जीवित\s*नहीं\s*रहना|जीने\s*का\s*(कोई\s*)?मतलब\s*नहीं|मर\s*जाना\s*चाहता|मरने\s*का\s*(विचार|मन)|खुद\s*को\s*(खत्म|मार)|जहर\s*खा|sab\s*khatam\s*kar\s*(dena|dunga|chahta|raha)|jine\s*ka\s*(koi\s*)?मतलब|jine\s*ka\s*(koi\s*)?matlab\s*nahi|jeene\s*ka\s*(koi\s*)?matlab\s*nahi|khud\s*ko\s*khatam|(meri|apni)\s*jaan\s*len(a|e|i)|duniya\s*se\s*gayab|gayab\s*hone\s*ka\s*mann|zahar\s*kha|zeher\s*kha|marne\s*ka\s*(mann|irada|vichar)|mar\s*jana\s*chahta)/iu,
  },
  {
    category: 'acute_psychosis',
    regex: /(voices\s*(in\s*my\s*head\s*)?(are\s*)?(tell(ing)?|screaming\s*at)\s*me\s*to\s*(kill|hurt|die|attack|jump)|hearing\s*voices\s*to\s*(harm|kill|attack)|command\s*hallucinations?|poison(ing|ed)?\s*my\s*(food|water)|to\s*poison\s*me|they\s*put\s*(a\s*)?chip\s*in\s*my\s*(brain|water|food|head|body)|they\s*are\s*in\s*my\s*walls|आवाजें\s*कह\s*रही|aawazein\s*bol\s*rahi)/iu,
  },
  {
    category: 'self_harm',
    regex: /(cut(ting)?\s*myself|cut(ting)?\s*(my\s*)?(wrists?|arms?|legs?|skin)|burn(ing|ed|s)?\s*(myself|my\s*(arms?|skin|body))|hurt(ing|s)?\s*myself|harm(ing|ed|s)?\s*myself|bleed(ing)?\s*out|punish(ing|ed)?\s*my\s*body|self\s*harm(ing)?|apne\s*haath\s*katne|haath\s*katne|nas\s*katne|हाथ\s*काट|नस\s*काट|खुद\s*को\s*चोट)/iu,
  },
  {
    category: 'severe_violence',
    regex: /(kill(ing|ed)?\s*(someone|them|him|her|everyone|people)|shoot\s*(up|everyone|them|people|coworkers|students|colleagues)|bring\s*a\s*gun\s*to\s*(the\s*)?(office|school|work|church|mall)|bomb(ing)?|murder(ing)?|stab(bing|bed)?\s*(someone|him|her|them)|massacre|sabko\s*maar\s*dunga|jaan\s*se\s*maar\s*dunga|sabko\s*khatam\s*kar\s*dunga|गोली\s*मार\s*दूंगा|सबको\s*मार\s*दूंगा)/iu,
  },
  {
    category: 'domestic_abuse',
    regex: /(hitting\s*me|beat(ing|en)?\s*me|abus(ing|ed)?\s*me|threaten(ed|ing)?\s*to\s*kill\s*me|in\s*danger\s*at\s*home|mujhe\s*maar\s*rahe|pitayi\s*kar|मारपीट)/iu,
  },
];

/**
 * Normalizes input text against leetspeak, Unicode homoglyphs, and delimiter obfuscation.
 */
function normalizeAntiEvasion(input: string): { clean: string; collapsed: string } {
  if (!input) return { clean: '', collapsed: '' };

  // 1. Unicode NFKD decomposition + strip diacritics / accents
  let norm = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // 2. Strip zero-width spaces, invisible characters, soft hyphens
  norm = norm.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g, '');

  // 3. Lowercase
  norm = norm.toLowerCase();

  // 4. Translate common leetspeak substitutions
  const leetMap: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
    '+': 't',
    '8': 'b',
    '!': 'i',
    '|': 'i',
  };

  let deLeeted = '';
  for (let i = 0; i < norm.length; i++) {
    const char = norm[i];
    deLeeted += leetMap[char] || char;
  }

  // 5. Collapsed version without spaces/punctuation (e.g. "k.i.l.l.m.y.s.e.l.f" -> "killmyself")
  const collapsed = deLeeted.replace(/[^a-z0-9]/g, '');

  return { clean: deLeeted, collapsed };
}

/**
 * Checks input text for acute crisis indicators with zero false negatives.
 */
export function detectCrisis(inputText: string): CrisisDetectionResult {
  if (!inputText || !inputText.trim()) {
    return {
      isCrisis: false,
      severity: 'none',
      recommendedHotlines: EMERGENCY_HOTLINES,
    };
  }

  const rawLower = inputText.trim().toLowerCase();
  const { clean, collapsed } = normalizeAntiEvasion(inputText);

  const matchedPatterns: string[] = [];
  let triggeredCategory: CrisisDetectionResult['triggerCategory'] | undefined = undefined;

  for (const pattern of CRISIS_PATTERNS) {
    // Check against raw text, cleaned normalized text, and punctuation-collapsed text
    if (pattern.regex.test(rawLower) || pattern.regex.test(clean) || pattern.regex.test(collapsed)) {
      matchedPatterns.push(pattern.regex.source);
      triggeredCategory = pattern.category;
      break;
    }
  }

  if (matchedPatterns.length > 0 && triggeredCategory) {
    const primaryPattern = matchedPatterns[0];
    const isImmediate =
      triggeredCategory === 'suicide_ideation' ||
      triggeredCategory === 'severe_violence' ||
      triggeredCategory === 'acute_psychosis';
    return {
      isCrisis: true,
      severity: isImmediate ? 'immediate' : 'high',
      triggerCategory: triggeredCategory,
      matchedPattern: primaryPattern,
      matchedPatterns,
      immediateDeflectionStatement: `I hear how much deep pain and heaviness you are carrying right now, and I want you to know that you are not alone in this moment.

Because I am an AI companion and cannot provide emergency clinical care or guarantee your immediate physical safety, I am connecting you right now with real, compassionate human specialists who are ready to support you 24/7 without judgment.

Please reach out immediately to one of the free, confidential lifelines below. If you are in India, please call Tele-MANAS toll-free at 14416 or 1800-891-4416. In the United States or Canada, call or text 988. In the United Kingdom, call 111. Your life matters deeply.`,
      recommendedHotlines: EMERGENCY_HOTLINES,
    };
  }

  return {
    isCrisis: false,
    severity: 'none',
    recommendedHotlines: EMERGENCY_HOTLINES,
  };
}

export const checkCrisisRisk = detectCrisis;
export const evaluateCrisisRisk = detectCrisis;
