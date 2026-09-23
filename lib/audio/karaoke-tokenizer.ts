/**
 * lib/audio/karaoke-tokenizer.ts
 *
 * Single Source of Truth for:
 * 1. Isolating Bhagavad Gita Sanskrit shloka (silent to TTS, rendered in contemplation card).
 * 2. Precomputing word tokens with 1:1 index alignment for DOM karaoke highlighting.
 * 3. Generating sanitized, natural speech text free of markdown symbols, broken images, and stray punctuation.
 */

export interface KaraokeToken {
  word: string;
  cleanWord: string;
  wordIndex: number;
  sentenceIndex: number;
  sectionIndex: number;
  startChar: number;
  endChar: number;
  isFlowStep?: boolean;
  stepIndex?: number;
  isBadge?: boolean;
}

export interface ParsedSection {
  rawPart: string;
  cleanedContent: string;
}

export interface TokenizeResult {
  words: KaraokeToken[];
  speechText: string;
  isGita: boolean;
  shlokaBlock: string | null;
  therapeuticBody: string;
  sections: ParsedSection[];
}

export function cleanWordForMatch(str: string): string {
  return str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Checks whether a word token is currently active based on KaraokeState.
 * Supports exact index matching and localized lexical recovery (within +/- 4 words).
 */
export function isWordActive(
  currentWordIndex: number,
  wordStr: string,
  activeKaraoke: { wordIndex: number; wordText?: string } | null | undefined
): boolean {
  if (!activeKaraoke) return false;

  // Direct index match
  if (currentWordIndex === activeKaraoke.wordIndex) {
    return true;
  }

  // Lexical recovery fallback for minor browser offset discrepancies
  if (activeKaraoke.wordText) {
    const cleanWord = cleanWordForMatch(wordStr);
    const cleanTarget = cleanWordForMatch(activeKaraoke.wordText);
    if (cleanWord && cleanTarget && cleanWord === cleanTarget) {
      if (Math.abs(currentWordIndex - activeKaraoke.wordIndex) <= 4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parses raw assistant message text into:
 * - Isolated Gita Shloka (if present)
 * - Cleaned therapeutic sections (removing card headers like **1. ...** or **SUMMARY...**)
 */
export function parseTherapeuticMessage(rawText: string): {
  isGita: boolean;
  shlokaBlock: string | null;
  therapeuticBody: string;
  sections: ParsedSection[];
} {
  if (!rawText) {
    return { isGita: false, shlokaBlock: null, therapeuticBody: '', sections: [] };
  }

  // 1. Separate Gita Shloka (Strictly silent to TTS)
  let isGita = false;
  let shlokaBlock: string | null = null;
  let therapeuticBody = rawText;

  const shlokaMatch = rawText.match(/\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i);
  if (shlokaMatch) {
    isGita = true;
    shlokaBlock = shlokaMatch[1].trim();
    therapeuticBody = rawText.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/i, '').trim();
  }

  // 2. Split into therapeutic sections by bold headers
  const rawParts = therapeuticBody.split(
    /(?=\*\*(?:[1234]\.\s+|SUMMARY|आपकी स्थिति|स्थिति व कष्ट|RESUMEN|SYNTHÈSE|ZUSAMMENFASSUNG|TRI-PILLAR|एकीकृत))/i
  );

  const sections: ParsedSection[] = rawParts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      // Strip section header e.g. **1. Bhagavad Gita Wisdom: Focus on Action**
      const cleaned = part
        .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|RESUMEN[^*]*|SYNTHÈSE[^*]*|ZUSAMMENFASSUNG[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/im, '')
        .replace(/!\[(.*?)\]\([^\)]*\)/g, '$1');

      return { rawPart: part, cleanedContent: cleaned };
    });

  return { isGita, shlokaBlock, therapeuticBody, sections };
}

/**
 * Universal Tokenizer for Real-Time Karaoke Highlighting and Speech Synthesis.
 * Guaranteed 100% 1:1 match between spoken speech tokens and rendered UI word spans.
 */
export function tokenizeForKaraoke(rawText: string, _locale?: string): TokenizeResult {
  const { isGita, shlokaBlock, therapeuticBody, sections } = parseTherapeuticMessage(rawText);

  const words: KaraokeToken[] = [];
  let globalWordIdx = 0;
  let globalSentenceIdx = 0;

  // Process sections in exact rendering order
  sections.forEach((sec, secIdx) => {
    const lines = sec.cleanedContent.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Case A: Process Flow Line e.g. Inhale (4s) -> Hold (7s) -> Exhale (8s)
      if (/\s*(?:->|→|-->)\s*/.test(trimmedLine) && !trimmedLine.startsWith('**')) {
        const steps = trimmedLine.split(/\s*(?:->|→|-->)\s*/).filter(Boolean);
        steps.forEach((step, stepIdx) => {
          const stepTokens = step.trim().split(/\s+/).filter(Boolean);
          stepTokens.forEach((tok) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            words.push({
              word: tok,
              cleanWord: cleanWordForMatch(tok),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
              isFlowStep: true,
              stepIndex: stepIdx,
            });
          });
        });
        globalSentenceIdx++;
        return;
      }

      // Case B: Inline badges or standard formatted prose
      const badgeRegex = /(\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus)[^\]]*\])/gi;
      const parts = trimmedLine.split(badgeRegex);

      parts.forEach((part) => {
        const badgeMatch = part.match(
          /^\[(?:🎯\s*Focus Anchor|⚡\s*Autonomic State|diagram|visual|flow|focus):?\s*([^\]]+)\]$/i
        );
        if (
          badgeMatch ||
          (part.startsWith('[') && part.endsWith(']') && (part.includes('🎯') || part.includes('⚡')))
        ) {
          const label = badgeMatch ? badgeMatch[1].trim() : part.slice(1, -1).trim();
          const badgeTokens = label.split(/\s+/).filter(Boolean);
          badgeTokens.forEach((tok) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            words.push({
              word: tok,
              cleanWord: cleanWordForMatch(tok),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
              isBadge: true,
            });
          });
          return;
        }

        // Standard segments (bold vs plain text)
        const segments = part.split(/(\*\*[^*]+\*\*)/g);
        segments.forEach((seg) => {
          const isBold = seg.startsWith('**') && seg.endsWith('**');
          const rawContent = isBold ? seg.slice(2, -2) : seg;
          const tokens = rawContent.split(/\s+/).filter(Boolean);

          tokens.forEach((token) => {
            const thisWordIdx = globalWordIdx++;
            const thisSentenceIdx = globalSentenceIdx;
            const isSentenceEnd = /[.!?।]\s*$/.test(token);
            if (isSentenceEnd) {
              globalSentenceIdx++;
            }
            words.push({
              word: token,
              cleanWord: cleanWordForMatch(token),
              wordIndex: thisWordIdx,
              sentenceIndex: thisSentenceIdx,
              sectionIndex: secIdx,
              startChar: 0,
              endChar: 0,
            });
          });
        });
      });
    });
  });

  // Generate the exact 1:1 Speech Text from tokens
  const speechText = words.map((w) => w.word).join(' ');

  // Calculate startChar and endChar offsets in speechText for character boundary resolution
  let cursor = 0;
  words.forEach((w) => {
    const idx = speechText.indexOf(w.word, cursor);
    if (idx >= 0) {
      w.startChar = idx;
      w.endChar = idx + w.word.length;
      cursor = w.endChar;
    } else {
      w.startChar = cursor;
      w.endChar = cursor + w.word.length;
      cursor = w.endChar + 1;
    }
  });

  return { words, speechText, isGita, shlokaBlock, therapeuticBody, sections };
}

export interface TherapeuticStageData {
  stage: 1 | 2 | 3 | 4;
  stageKey: 'sanctuary' | 'gita' | 'cbt' | 'tratak';
  title: string;
  badge: string;
  badgeColor: string;
  rawText: string;
  displayContent: string;
  speechText: string;
  meta: {
    emotionName?: string;
    severity?: string;
    autonomicState?: string;
    bodilyBurden?: string;
    summary?: string;
    confirmationPrompt?: string;
    shlokaBlock?: string;
    shlokaDevanagari?: string[];
    shlokaRoman?: string[];
    chapterVerse?: string;
    meaning?: string;
    reflection?: string;
    duty?: string;
    avoid?: string;
    cbtReframe?: string;
    somaticAnchor?: string;
    pranayama?: string;
    tratakMode?: string;
    tratakName?: string;
    focalTarget?: string;
    neuroMechanism?: string;
    guidance?: string;
  };
}

export interface StructuredTherapyResponse {
  isStructured: boolean;
  stages: TherapeuticStageData[];
  defaultSpeechText: string;
}

/**
 * Parses any therapeutic response into 4 distinct sequential cards:
 * Stage 1: Sanctuary Emotion Understanding & User Confirmation
 * Stage 2: Bhagavad Gita Shloka & Spiritual Gyan
 * Stage 3: Clinical Cognitive Neuroscience (CBT) & Somatic Pranayama
 * Stage 4: Tratak Neuro-Ocular Gazing Meditation Protocol
 */
export function parseTherapeuticStages(rawText: string, locale?: string): StructuredTherapyResponse {
  if (!rawText || typeof rawText !== 'string') {
    return { isStructured: false, stages: [], defaultSpeechText: '' };
  }

  const isHindi = /[\u0900-\u097F]/.test(rawText) || (locale ? locale.startsWith('hi') : false);
  const isSpanish = (locale ? locale.startsWith('es') : false) || /\b(sabiduría|verso|capítulo|mente)\b/i.test(rawText);
  const isFrench = (locale ? locale.startsWith('fr') : false) || /\b(sagesse|verset|chapitre|respiration)\b/i.test(rawText);
  const isGerman = (locale ? locale.startsWith('de') : false) || /\b(weisheit|kapitel|nervensystem)\b/i.test(rawText);

  // 1. Extract Gita Shloka if encapsulated in tags
  let shlokaBlock: string | null = null;
  let remainingText = rawText;
  const shlokaMatch = rawText.match(/\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i);
  if (shlokaMatch) {
    shlokaBlock = shlokaMatch[1].trim();
    remainingText = rawText.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/i, '').trim();
  }

  // 2. Split into section parts
  const rawParts = remainingText.split(
    /(?=\*\*(?:[1234]\.\s+|SUMMARY|आपकी स्थिति|स्थिति व कष्ट|RESUMEN|SYNTHÈSE|ZUSAMMENFASSUNG|TRI-PILLAR|एकीकृत))/i
  ).map(p => p.trim()).filter(Boolean);

  let diagPart = '';
  let gitaPart = '';
  let cbtPart = '';
  let tratakPart = '';
  let synergyPart = '';

  rawParts.forEach((part, idx) => {
    const isLastCard = idx === rawParts.length - 1;
    const isDiag = !isLastCard && (
      part.startsWith('**SUMMARY') ||
      part.toLowerCase().includes('suffering assessment') ||
      part.includes('स्थिति व कष्ट') ||
      part.includes('मानसिक पीड़ा') ||
      part.includes('स्थिति का सारांश') ||
      part.toLowerCase().includes('diagnostic')
    );
    const isTratak = !isDiag && (part.startsWith('**3.') || part.toLowerCase().includes('tratak') || part.includes('त्राटक'));
    const isClinical = !isDiag && !isTratak && (part.startsWith('**2.') || part.toLowerCase().includes('clinical') || part.includes('कॉग्निटिव') || part.toLowerCase().includes('cbt'));
    const isGita = !isDiag && !isTratak && !isClinical && !isLastCard && (part.startsWith('**1.') || part.toLowerCase().includes('bhagavad gita') || part.includes('गीता'));
    const isSyn = !isDiag && !isGita && !isClinical && !isTratak && (isLastCard || part.startsWith('**4.') || part.toLowerCase().includes('synerg') || part.includes('त्रिवेणी') || part.includes('समाधान'));

    if (isDiag) diagPart = part;
    else if (isGita) gitaPart = part;
    else if (isClinical) cbtPart = part;
    else if (isTratak) tratakPart = part;
    else if (isSyn) synergyPart = part;
  });

  // If we don't have structured parts, treat as normal conversational reply
  if (!diagPart && !gitaPart && !cbtPart && !tratakPart && !shlokaBlock) {
    return { isStructured: false, stages: [], defaultSpeechText: rawText };
  }

  const stages: TherapeuticStageData[] = [];

  // ─── STAGE 1: SANCTUARY EMOTION UNDERSTANDING ───
  let emotionName = '';
  let severity = '';
  let autonomicState = '';
  let bodilyBurden = '';
  let summary = '';

  if (diagPart) {
    const emotionMatch = diagPart.match(/(?:Identified Emotional State|पहचाना गया मनोभाव एवं मुख्य संघर्ष|Estado Emocional|État Émotionnel|Erkannter Zustand)\s*:\s*([^\n•]+)/i);
    if (emotionMatch) emotionName = emotionMatch[1].trim();

    const sevMatch = diagPart.match(/(?:Suffering Severity & Autonomic State|पीड़ा का स्तर एवं तंत्रिका तंत्र स्थिति|Severidad|Sévérité|Belastungsgrad)\s*:\s*([^\n•|]+)/i);
    if (sevMatch) severity = sevMatch[1].trim();

    const autoMatch = diagPart.match(/\|\s*([^\n•]+)/);
    if (autoMatch) autonomicState = autoMatch[1].trim();

    const bodyMatch = diagPart.match(/(?:Interoceptive Bodily Burden|शारीरिक संवेदनाएं व आंतरिक तनाव|Carga Corporal|Charge Corporelle|Körperliche Empfindungen)\s*:\s*([^\n•]+)/i);
    if (bodyMatch) bodilyBurden = bodyMatch[1].trim();

    const sumMatch = diagPart.match(/(?:Empathic Summary of Your Experience|आपकी स्थिति का संवेदनशील सारांश|Resumen Empático|Résumé Empathique|Einfühlsame Zusammenfassung)\s*:\s*([^\n•]+)/i);
    if (sumMatch) summary = sumMatch[1].trim();
  }

  if (!emotionName) {
    emotionName = isHindi ? "तीव्र मानसिक तनाव एवं बेचैनी" : "Emotional Strain & Inner Turbulence";
  }

  const confirmationPrompt = isHindi
    ? "क्या आप इस समय इसी मनोदशा और आंतरिक तनाव का अनुभव कर रहे हैं?"
    : isSpanish
    ? "¿Es esto exactamente lo que estás experimentando en este momento?"
    : isFrench
    ? "Est-ce bien ce que vous ressentez en cet instant précis ?"
    : isGerman
    ? "Beschreibt dies genau das, was Sie in diesem Moment durchleben?"
    : "Is this what you are experiencing right now?";

  const s1Badge = isHindi
    ? "📋 1. आपकी स्थिति एवं पीड़ा का मूल्यांकन"
    : isSpanish
    ? "📋 1. Evaluación del Estado Emocional"
    : isFrench
    ? "📋 1. Analyse de l'État Émotionnel"
    : isGerman
    ? "📋 1. Emotionale Belastungsanalyse"
    : "📋 1. Sanctuary Emotion Understanding";

  const s1SpeechText = isHindi
    ? `आपकी स्थिति का मूल्यांकन: मैं समझ सकता हूँ कि आप इस समय ${emotionName} से जूझ रहे हैं। ${summary || 'आपका मन और शरीर इस आंतरिक दबाव से अत्यधिक थके हुए हैं।'} ${confirmationPrompt}`
    : `Sanctuary understanding: I hear that you are navigating ${emotionName}. ${summary || 'You are carrying a burden of emotional strain.'} ${confirmationPrompt}`;

  stages.push({
    stage: 1,
    stageKey: 'sanctuary',
    title: emotionName,
    badge: s1Badge,
    badgeColor: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
    rawText: diagPart || rawText,
    displayContent: diagPart || rawText,
    speechText: s1SpeechText,
    meta: {
      emotionName,
      severity,
      autonomicState,
      bodilyBurden,
      summary,
      confirmationPrompt,
    },
  });

  // ─── STAGE 2: BHAGAVAD GITA CARD & GYAN ───
  let devanagariLines: string[] = [];
  let romanLines: string[] = [];
  let chapterVerse = '';

  if (shlokaBlock) {
    const sLines = shlokaBlock.split('\n').map(l => l.trim()).filter(Boolean);
    devanagariLines = sLines.filter(l => /[\u0900-\u097F]/.test(l) && !l.startsWith('—'));
    romanLines = sLines.filter(l => !/[\u0900-\u097F]/.test(l) && !l.startsWith('—'));
    const refMatch = shlokaBlock.match(/—\s*([^)\n]+)/);
    if (refMatch) chapterVerse = refMatch[1].trim();
  }

  let meaning = '';
  let reflection = '';
  let duty = '';
  let avoid = '';

  if (gitaPart) {
    const mMatch = gitaPart.match(/(?:समझाते हैं कि|nos ilumina:|nous éclaire :|lehrt:|meaning:|Essence:)\s*([^\n]+)/i);
    if (mMatch) meaning = mMatch[1].trim();

    const rMatch = gitaPart.match(/(?:इस संदेश को अपने वर्तमान जीवन में उतारें:|जीवन में उतारें:|Integración:|Application :|reflection:|Reflexion:)\s*([^\n]+)/i);
    if (rMatch) reflection = rMatch[1].trim();

    const dMatch = gitaPart.match(/(?:इस समय आपका कर्तव्य:|कर्तव्य:|orientación de acción:|action juste :|Action:|duty:)\s*([^।\n]+)/i);
    if (dMatch) duty = dMatch[1].trim();

    const aMatch = gitaPart.match(/(?:विशेष रूप से इस भूल से बचें:|evitar:|éviter :|avoid:)\s*([^\n]+)/i);
    if (aMatch) avoid = aMatch[1].trim();
  }

  const s2Badge = isHindi
    ? "🕉️ 2. श्रीमद्भगवद्गीता आत्मिक दर्शन"
    : isSpanish
    ? "🕉️ 2. Sabiduría del Bhagavad Gita"
    : isFrench
    ? "🕉️ 2. Sagesse de la Bhagavad Gita"
    : isGerman
    ? "🕉️ 2. Weisheit der Bhagavad Gita"
    : "🕉️ 2. Bhagavad Gita Wisdom & Gyan";

  // Build spoken text for Gita stage: VOCALIZES SHLOKA FIRST!
  const spokenShloka = isHindi && devanagariLines.length > 0
    ? devanagariLines.join('। ')
    : (romanLines.length > 0 ? romanLines.join('. ') : devanagariLines.join('. '));

  let s2SpeechText = '';
  if (isHindi) {
    s2SpeechText = `${spokenShloka}। भगवान श्रीकृष्ण का अमर उपदेश: ${meaning || 'अपने कर्तव्य पर एकाग्र हों, फलों की चिंता छोड़ें।'} ${reflection || 'वर्तमान क्षण में स्थित रहें।'} आपका कर्तव्य: ${duty || 'सच्चे मन से अपना कर्म करें।'}`;
  } else {
    s2SpeechText = `${spokenShloka}. Bhagavad Gita wisdom: ${meaning || 'Dedicate your focus entirely to your present duty rather than fearing future outcomes.'} ${reflection || 'Step out of anxiety into present action.'} Your duty: ${duty || 'Take the highest-integrity action in front of you.'}`;
  }

  stages.push({
    stage: 2,
    stageKey: 'gita',
    title: chapterVerse ? `Bhagavad Gita (${chapterVerse})` : 'Bhagavad Gita Wisdom',
    badge: s2Badge,
    badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    rawText: gitaPart || '',
    displayContent: gitaPart || '',
    speechText: s2SpeechText.trim(),
    meta: {
      shlokaBlock: shlokaBlock || undefined,
      shlokaDevanagari: devanagariLines,
      shlokaRoman: romanLines,
      chapterVerse,
      meaning,
      reflection,
      duty,
      avoid,
    },
  });

  // ─── STAGE 3: CLINICAL COGNITIVE NEUROSCIENCE (CBT) & BREATHWORK ───
  const s3Badge = isHindi
    ? "🧠 3. क्लिनिकल कॉग्निटिव न्यूरोसाइंस (CBT)"
    : isSpanish
    ? "🧠 3. Neurociencia Clínica Cognitiva (TCC)"
    : isFrench
    ? "🧠 3. Neurosciences Cliniques Cognitives (TCC)"
    : isGerman
    ? "🧠 3. Klinische Kognitive Neurowissenschaft (CBT)"
    : "🧠 3. Clinical Cognitive Neuroscience (CBT)";

  const cbtCleaned = cbtPart
    .replace(/^\*\*(?:[2]\.\s+|CLINICAL[^*]*|क्लिनिकल[^*]*)[^*]*\*\*\s*:?\s*/im, '')
    .trim();

  const s3SpeechText = isHindi
    ? `क्लिनिकल कॉग्निटिव न्यूरोसाइंस और श्वसन अभ्यास: ${cbtCleaned || 'अपने मन के नकारात्मक विचारों को पहचानें और गहरी सांस लेकर तंत्रिका तंत्र को शांत करें।'}`
    : `Clinical cognitive neuroscience and breathwork: ${cbtCleaned || 'Notice catastrophic thoughts and anchor your nervous system with measured breathing.'}`;

  stages.push({
    stage: 3,
    stageKey: 'cbt',
    title: 'Cognitive Restructuring & Somatics',
    badge: s3Badge,
    badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    rawText: cbtPart || '',
    displayContent: cbtPart || '',
    speechText: s3SpeechText.trim(),
    meta: {
      cbtReframe: cbtCleaned,
    },
  });

  // ─── STAGE 4: TRATAK NEURO-OCULAR PROTOCOL ───
  const s4Badge = isHindi
    ? "👁️ 4. त्राटक न्यूरो-ऑक्युलर ध्यान विधि"
    : isSpanish
    ? "👁️ 4. Protocolo Neuro-Ocular Tratak"
    : isFrench
    ? "👁️ 4. Protocole Neuro-Oculaire Tratak"
    : isGerman
    ? "👁️ 4. Tratak Neuro-Okulares Protokoll"
    : "👁️ 4. Tratak Neuro-Ocular Protocol";

  let tratakCombined = tratakPart;
  if (synergyPart) {
    tratakCombined += `\n\n${synergyPart}`;
  }

  const tratakCleaned = tratakPart
    .replace(/^\*\*(?:[3]\.\s+|TRATAK[^*]*|त्राटक[^*]*)[^*]*\*\*\s*:?\s*/im, '')
    .trim();

  const s4SpeechText = isHindi
    ? `त्राटक न्यूरो-ऑक्युलर दृष्टि ध्यान विधि: ${tratakCleaned || 'अपनी दृष्टि को एक बिंदु पर स्थिर करें ताकि मस्तिष्क का तनाव केंद्र शांत हो सके। अंत में हथेलियों को रगड़कर आंखों पर रखें।'}`
    : `Tratak neuro-ocular protocol: ${tratakCleaned || 'Rest a motionless soft gaze upon the focal target to stop ocular micro-saccades and de-escalate amygdala hyperarousal.'}`;

  stages.push({
    stage: 4,
    stageKey: 'tratak',
    title: 'Neuro-Ocular Gazing Meditation',
    badge: s4Badge,
    badgeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    rawText: tratakCombined || '',
    displayContent: tratakCombined || '',
    speechText: s4SpeechText.trim(),
    meta: {
      guidance: tratakCleaned,
    },
  });

  return {
    isStructured: true,
    stages,
    defaultSpeechText: s1SpeechText,
  };
}

