/**
 * lib/wellness-flow/confirm-intent-parser.ts
 *
 * Robust Advanced Multilingual Yes/No Intent & Stage Navigation Parser.
 * Evaluates spoken or typed user input across 20+ global languages:
 * English, Hindi (Devanagari & Hinglish), Spanish, French, German, Italian, Portuguese,
 * Russian, Arabic, Japanese, Chinese, Korean, Marathi, Bengali, Tamil, Telugu, Gujarati, etc.
 *
 * Handles:
 * - Case-insensitivity, trimmed whitespace, and Unicode script normalization.
 * - Non-ASCII Unicode script matching (doesn't fail with ASCII-only \b regexes).
 * - Matching inside conversational sentences (e.g. "haan bilkul sahi hai", "yes that's right", "हां सही है").
 * - Multi-word affirmative and negative phrases across all languages.
 * - Contradiction detection (if both or neither match, returns 'unclear').
 * - Sequential Stage Progression & Navigation Intents ("next", "continue", "आगे", "cbt", "trataka", "repeat").
 * - Culturally attuned, localized empathetic clarification prompts.
 */

export type ConfirmationIntent = 'yes' | 'no' | 'unclear';

export interface ParseIntentResult {
  intent: ConfirmationIntent;
  matchedYes: string[];
  matchedNo: string[];
  confidence: number;
  raw: string;
  normalized: string;
}

export type StageNavigationIntent =
  | 'next'
  | 'gita'
  | 'cbt'
  | 'trataka'
  | 'repeat'
  | 'none';

// ─── Debug Log Toggle ───
export const DEBUG_CONFIRM_VOICE = true;

export function logConfirmDebug(
  tag: 'TTS' | 'STT' | 'RESULT' | 'INTENT' | 'TRANSITION' | 'GUARD' | 'ERROR',
  message: string,
  data?: any
): void {
  if (!DEBUG_CONFIRM_VOICE) return;
  const time = new Date().toISOString().substring(11, 23);
  if (data !== undefined) {
    console.log(`[CONFIRM-VOICE:${tag} ${time}] ${message}`, data);
  } else {
    console.log(`[CONFIRM-VOICE:${tag} ${time}] ${message}`);
  }
}

// ─── Phrase & Keyword Lexicons ───

// Multi-word negative phrases checked first
const NO_MULTI_WORD_PHRASES: string[] = [
  // English
  "that's not right",
  "thats not right",
  "that is not right",
  "that's not correct",
  "thats not correct",
  "that is not correct",
  "not quite right",
  "not really right",
  "not that right",
  "not right",
  "not correct",
  "not really",
  "not quite",
  "not at all",
  "no it's not",
  "no it is not",
  "no it isnt",
  // Hindi / Hinglish
  "bilkul nahi",
  "bilkul nahin",
  "nahi ji",
  "nahin ji",
  "ji nahi",
  "ji nahin",
  "sahi nahi",
  "sahi nahi hai",
  "galat hai",
  "thoda alag hai",
  "aisa nahi hai",
  "बिल्कुल नहीं",
  "जी नहीं",
  "सही नहीं",
  "गलत है",
  "ऐसा नहीं है",
  "थोड़ा अलग है",
  "गलत बात है",
  "सही नहीं है",
  // Spanish
  "no es correcto",
  "no es verdad",
  "no es asi",
  "no es así",
  "para nada",
  "de ninguna manera",
  // French
  "ce n'est pas ca",
  "ce n'est pas ça",
  "pas du tout",
  "pas vraiment",
  "c'est faux",
  "cest faux",
  // German
  "stimmt nicht",
  "uberhaupt nicht",
  "überhaupt nicht",
  "gar nicht",
  "nicht richtig",
  "das ist falsch",
  // Italian
  "non e cosi",
  "non è così",
  "per niente",
  "non e vero",
  "non è vero",
  "e sbagliato",
  "è sbagliato",
  // Portuguese
  "nao esta certo",
  "não está certo",
  "de jeito nenhum",
  "esta errado",
  "está errado",
  // Russian
  "не так",
  "совсем не так",
  "это ошибка",
  // Arabic
  "ليس صحيحا",
  "ليس كذلك",
  "غير صحيح",
  // Japanese
  "違います",
  "そうではありません",
  // Chinese
  "不是这样",
  "完全不对",
  // Marathi / Bengali / Gujarati
  "नाही चूक",
  "बरोबर नाही",
  "ঠিক না",
  "ভুল হয়েছে",
  "સાચું નથી",
  "ખોટું છે",
];

// Single negative words
const NO_SINGLE_KEYWORDS: string[] = [
  // English
  'no',
  'nope',
  'wrong',
  'incorrect',
  'differently',
  'false',
  'nah',
  // Hindi / Hinglish
  'nahi',
  'nahin',
  'na',
  'galat',
  'नहीं',
  'ना',
  'गलत',
  // Spanish
  'falso',
  // French
  'non',
  'faux',
  // German
  'nein',
  'falsch',
  // Italian
  'sbagliato',
  'errato',
  // Portuguese
  'não',
  'nao',
  'errado',
  // Russian
  'нет',
  'неверно',
  // Arabic
  'لا',
  'كلا',
  'خطأ',
  // Japanese
  'いいえ',
  '違う',
  // Chinese
  '不是',
  '错',
  // Korean
  '아니요',
  '틀림',
  // Regional Indian
  'नाही',
  'चूक',
  'না',
  'ভুল',
  'சரியில்லை',
  'இல்லை',
  'தவறு',
  'కాదు',
  'ના',
  'ಇಲ್ಲ',
  'ਨਹੀਂ',
];

// Multi-word affirmative phrases
const YES_MULTI_WORD_PHRASES: string[] = [
  // English
  "that's right",
  "thats right",
  "that is right",
  "that's correct",
  "thats correct",
  "that is correct",
  "that's accurate",
  "thats accurate",
  "yes that is right",
  "yes that is",
  "yes it is",
  "yes this is right",
  "yes correct",
  "yes right",
  "yes please",
  "yes i am",
  "sounds right",
  "sounds accurate",
  "you got it",
  "spot on",
  // Hindi / Hinglish
  "haan ji",
  "han ji",
  "ji haan",
  "ji han",
  "theek hai",
  "thik hai",
  "sahi hai",
  "bilkul sahi",
  "haan bilkul",
  "haan sahi",
  "haan sahi hai",
  "bilkul theek",
  "ekdam sahi",
  "sahi baat hai",
  "ji haan bilkul",
  "हाँ सही है",
  "हां सही है",
  "हाँ यह सही है",
  "हां यह सही है",
  "जी हाँ",
  "जी हां",
  "ठीक है",
  "सही है",
  "बिल्कुल सही",
  "बिल्कुल ठीक",
  "एकदम सही",
  "सही बात है",
  "हाँ बिल्कुल",
  "हां बिल्कुल",
  // Spanish
  "es correcto",
  "eso es",
  "esta bien",
  "está bien",
  "asi es",
  "así es",
  "de acuerdo",
  "por supuesto",
  "claro que si",
  "claro que sí",
  // French
  "c'est ca",
  "c'est ça",
  "cest ca",
  "tout a fait",
  "tout à fait",
  "d'accord",
  "daccord",
  "bien sur",
  "bien sûr",
  "c'est exact",
  "cest exact",
  // German
  "das stimmt",
  "stimmt genau",
  "alles klar",
  "in ordnung",
  "ganz genau",
  // Italian
  "e esatto",
  "è esatto",
  "e giusto",
  "è giusto",
  "va bene",
  "d'accordo",
  "proprio cosi",
  "proprio così",
  // Portuguese
  "esta certo",
  "está certo",
  "com certeza",
  "de acordo",
  "isso mesmo",
  "e verdade",
  "é verdade",
  // Russian
  "все верно",
  "всё верно",
  "так и есть",
  "именно так",
  "да точно",
  // Arabic
  "نعم صحيح",
  "هذا صحيح",
  "بالضبط كذلك",
  // Japanese
  "その通りです",
  "その通り",
  "そうです",
  // Chinese
  "是的没错",
  "正是这样",
  "完全正确",
  // Regional Indian
  "अगदी बरोबर",
  "बरोबर आहे",
  "\u098F\u0995\u09A6\u09AE \u09A0\u09BF\u0995",
  "হ্যাঁ ঠিক",
  "சரியாக உள்ளது",
  "மிகவும் சரி",
  "సరిగ్గా చెప్పారు",
  "చాలా నిజం",
  "બરાબર છે",
  "સાચી વાત છે",
];

// Single affirmative words
const YES_SINGLE_KEYWORDS: string[] = [
  // English
  'yes',
  'yeah',
  'yep',
  'yup',
  'correct',
  'right',
  'exactly',
  'sure',
  'ok',
  'okay',
  'agree',
  'true',
  'accurate',
  'affirmative',
  'absolutely',
  'indeed',
  'definitely',
  'perfect',
  // Hindi / Hinglish
  'haan',
  'ha',
  'han',
  'bilkul',
  'sahi',
  'theek',
  'thik',
  'haanji',
  'hanji',
  'हाँ',
  'हां',
  'बिल्कुल',
  'सही',
  'ठीक',
  'हांजी',
  'हाँजी',
  // Spanish
  'sí',
  'si',
  'claro',
  'exacto',
  'vale',
  'verdad',
  // French
  'oui',
  'ouais',
  'exact',
  'vrai',
  'exactement',
  // German
  'ja',
  'genau',
  'stimmt',
  'sicher',
  // Italian
  'giusto',
  'certo',
  // Portuguese
  'sim',
  'certo',
  'exato',
  // Russian
  'да',
  'верно',
  'точно',
  // Arabic
  'أجل',
  'تمام',
  // Japanese
  'はい',
  'ええ',
  // Chinese
  '是',
  '对',
  '好',
  '没错',
  // Korean
  '네',
  '예',
  '맞아요',
  // Regional Indian
  'हो',
  'होय',
  'बरोबर',
  'হ্যাঁ',
  'হ্যা',
  'சரி',
  "\u09A0\u09BF\u0995",
  'ஆம்',
  'ஆமாம்',
  'అవును',
  'હા',
  'સાચું',
  'ಹೌದು',
  'ਹਾਂ',
];

/**
 * Normalizes user transcript:
 * - Lowercases Latin and non-Latin scripts.
 * - Replaces curly apostrophes with standard single quotes.
 * - Removes punctuation while preserving script alphabets and spaces.
 * - Collapses multiple spaces.
 */
export function normalizeTranscript(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses user speech or text for Yes/No confirmation intent.
 */
export function parseYesNoIntent(rawInput: string): ConfirmationIntent {
  const result = parseYesNoIntentDetailed(rawInput);
  return result.intent;
}

/**
 * Detailed intent parser with matched tokens, score, and confidence.
 */
export function parseYesNoIntentDetailed(rawInput: string): ParseIntentResult {
  const normalized = normalizeTranscript(rawInput);

  if (!normalized) {
    const res: ParseIntentResult = {
      intent: 'unclear',
      matchedYes: [],
      matchedNo: [],
      confidence: 0,
      raw: rawInput,
      normalized: '',
    };
    logConfirmDebug('INTENT', 'Empty input parsed as unclear', res);
    return res;
  }

  const matchedYes: string[] = [];
  const matchedNo: string[] = [];

  // Helper: check if a token contains non-ASCII characters (e.g. Devanagari, Cyrillic, CJK, Arabic, accented Latin)
  const isNonAscii = (token: string) => /[^\u0000-\u007F]/.test(token);

  // 1. Check Multi-Word Negative Phrases
  for (const phrase of NO_MULTI_WORD_PHRASES) {
    if (normalized.includes(phrase)) {
      matchedNo.push(phrase);
    }
  }

  // 2. Check Single Negative Keywords
  for (const word of NO_SINGLE_KEYWORDS) {
    if (isNonAscii(word)) {
      if (normalized.includes(word)) {
        matchedNo.push(word);
      }
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedNo.push(word);
      }
    }
  }

  // 3. Check Multi-Word Affirmative Phrases
  for (const phrase of YES_MULTI_WORD_PHRASES) {
    if (normalized.includes(phrase)) {
      matchedYes.push(phrase);
    }
  }

  // 4. Check Single Affirmative Keywords
  for (const word of YES_SINGLE_KEYWORDS) {
    if (isNonAscii(word)) {
      if (normalized.includes(word)) {
        matchedYes.push(word);
      }
    } else {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedYes.push(word);
      }
    }
  }

  // Deduplicate matches
  const uniqueYes = Array.from(new Set(matchedYes));
  const uniqueNo = Array.from(new Set(matchedNo));

  // Substring conflict resolution:
  // e.g., if user said "bilkul nahi", uniqueNo will have ["bilkul nahi", "nahi"] and uniqueYes will have ["bilkul"].
  // Filter out any affirmative match that is strictly a substring of a matched negative phrase.
  const filteredYes = uniqueYes.filter((yesMatch) => {
    return !uniqueNo.some((noMatch) => noMatch.includes(yesMatch) && noMatch !== yesMatch);
  });

  // Filter out any negative match that is strictly a substring of a matched affirmative phrase.
  const filteredNo = uniqueNo.filter((noMatch) => {
    return !uniqueYes.some((yesMatch) => yesMatch.includes(noMatch) && yesMatch !== noMatch);
  });

  let intent: ConfirmationIntent = 'unclear';
  let confidence = 0.5;

  if (filteredYes.length > 0 && filteredNo.length === 0) {
    intent = 'yes';
    confidence = Math.min(0.99, 0.75 + filteredYes.length * 0.1);
  } else if (filteredNo.length > 0 && filteredYes.length === 0) {
    intent = 'no';
    confidence = Math.min(0.99, 0.75 + filteredNo.length * 0.1);
  } else {
    // Both matched (contradictory) or neither matched
    intent = 'unclear';
    confidence = 0.2;
  }

  const result: ParseIntentResult = {
    intent,
    matchedYes: filteredYes,
    matchedNo: filteredNo,
    confidence: Number(confidence.toFixed(2)),
    raw: rawInput,
    normalized,
  };

  logConfirmDebug('INTENT', `Parsed raw="${rawInput}" -> intent=${intent} (conf=${confidence})`, {
    matchedYes: filteredYes,
    matchedNo: filteredNo,
  });

  return result;
}

// ─── Stage Navigation Lexicons ───

const NEXT_COMMANDS = [
  'next',
  'continue',
  'go ahead',
  'next card',
  'next stage',
  'next step',
  'forward',
  'proceed',
  'ahead',
  // Hindi / Hinglish
  'aage',
  'agla',
  'aage badho',
  'jaari rakhein',
  'आगे',
  'अगला',
  'आगे बढ़ो',
  'अगला कदम',
  'अगला चरण',
  'जारी रखें',
  'आगे चलो',
  'नेक्स्ट',
  // Spanish
  'siguiente',
  'continuar',
  'adelante',
  'proximo',
  'próximo',
  // French
  'suivant',
  'continuer',
  'avancer',
  // German
  'weiter',
  'fortfahren',
  'nachster',
  'nächster',
  // Italian
  'avanti',
  'prossimo',
  'continua',
  // Russian
  'следующий',
  'дальше',
  'продолжить',
  // Arabic
  'التالي',
  'تابع',
  'استمر',
  // Japanese & Chinese
  '次へ',
  '進む',
  '下一步',
  '继续',
  '下一个',
  '다음',
  '계속',
];

const GITA_COMMANDS = [
  'gita',
  'geeta',
  'shloka',
  'verse',
  'wisdom',
  'ancient wisdom',
  'bhagavad gita',
  'गीता',
  'श्लोक',
  'उपदेश',
  'ज्ञान',
];

const CBT_COMMANDS = [
  'cbt',
  'reframe',
  'reframing',
  'cognitive',
  'thought',
  'soch',
  'vichar',
  'सीबीटी',
  'विचार',
  'सोच बदलें',
  'संज्ञानात्मक',
];

const TRATAKA_COMMANDS = [
  'trataka',
  'tratak',
  'meditation',
  'eye exercise',
  'somatic',
  'breathwork',
  'exercise',
  'anchor',
  'त्राटक',
  'ध्यान',
  'साधना',
  'नेत्र',
  'व्यायाम',
];

const REPEAT_COMMANDS = [
  'repeat',
  'say again',
  'replay',
  'one more time',
  'again',
  'listen again',
  'phir se',
  'dobara',
  'dohrayen',
  'दोहराएं',
  'फिर से',
  'फिर से बोलो',
  'एक बार फिर',
  'दोबारा',
  'repetir',
  'otra vez',
  'répéter',
  'encore',
  'wiederholen',
  'nochmal',
];

/**
 * Parses user speech or text for explicit stage navigation commands:
 * 'next' | 'gita' | 'cbt' | 'trataka' | 'repeat' | 'none'
 */
export function parseStageNavigationIntent(rawInput: string): StageNavigationIntent {
  const normalized = normalizeTranscript(rawInput);
  if (!normalized) return 'none';

  // 1. Check Repeat
  for (const cmd of REPEAT_COMMANDS) {
    if (normalized.includes(cmd)) return 'repeat';
  }

  // 2. Check Trataka
  for (const cmd of TRATAKA_COMMANDS) {
    if (normalized.includes(cmd)) return 'trataka';
  }

  // 3. Check CBT
  for (const cmd of CBT_COMMANDS) {
    if (normalized.includes(cmd)) return 'cbt';
  }

  // 4. Check Gita
  for (const cmd of GITA_COMMANDS) {
    if (normalized.includes(cmd)) return 'gita';
  }

  // 5. Check Next
  for (const cmd of NEXT_COMMANDS) {
    if (normalized.includes(cmd)) return 'next';
  }

  return 'none';
}

/**
 * Generates an empathetic clarification prompt in the user's localized language
 * when the user indicates the initial emotional summary did not accurately capture their feelings.
 */
export function getLocalizedClarificationPrompt(langCode?: string): string {
  const norm = (langCode || 'en').toLowerCase().split('-')[0];
  switch (norm) {
    case 'hi':
      return "मैं समझ सकता हूँ। कृपया थोड़ा और बताएं कि आप इस समय वास्तव में कैसा महसूस कर रहे हैं, ताकि हम इसे गहराई और सटीकता से समझ सकें।";
    case 'es':
      return "Te entiendo perfectamente. Por favor, cuéntame un poco más sobre lo que estás sintiendo en este momento para que pueda comprenderte con total claridad.";
    case 'fr':
      return "Je comprends tout à fait. S'il vous plaît, dites-moi un peu plus sur ce que vous ressentez en ce moment afin que je puisse vous accompagner au mieux.";
    case 'de':
      return "Ich verstehe Sie vollkommen. Bitte erzählen Sie mir etwas mehr darüber, was Sie gerade fühlen, damit ich Sie genau verstehen kann.";
    case 'it':
      return "Ti capisco perfettamente. Per favore, spiegami un po' di più su ciò che provi in questo momento, così da poterti comprendere a fondo.";
    case 'pt':
      return "Compreendo perfeitamente. Por favor, conte-me um pouco mais sobre o que está sentindo agora, para que eu possa entender você profundamente.";
    case 'ru':
      return "Я понимаю вас. Пожалуйста, расскажите подробнее, что вы чувствуете прямо сейчас, чтобы я мог лучше вас понять.";
    case 'ar':
      return "أنا أتفهمك تماماً. من فضلك، شاركني المزيد عما تشعر به الآن حتى أتمكن من فهمك بعمق ودقة.";
    case 'ja':
      return "よく分かりました。いまのお気持ちをもう少し詳しくお話しいただけますか。より深く理解できるようにサポートいたします。";
    case 'zh':
      return "我完全理解。请再多告诉我一些您此刻真实的感受，让我能够更深刻、准确地理解您。";
    case 'mr':
      return "मला समजते. कृपया आपण सध्या नेमके काय अनुभवत आहात याबद्दल थोडे अधिक सांगा, जेणेकरून मी आपल्याला अधिक चांगल्या प्रकारे समजू शकेन.";
    default:
      return "I understand. Please tell me a little more about what you are truly experiencing right now, so I can understand you deeply and accurately.";
  }
}
