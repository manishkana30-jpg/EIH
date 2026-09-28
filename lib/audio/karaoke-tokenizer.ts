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
  activeKaraoke: { wordIndex: number; wordText?: string; stage?: number } | null | undefined,
  cardStage?: number
): boolean {
  if (!activeKaraoke) return false;

  // If cardStage is specified and activeKaraoke specifies stage, they must match
  if (cardStage !== undefined && activeKaraoke.stage !== undefined && activeKaraoke.stage !== cardStage) {
    return false;
  }

  // Direct index match
  if (currentWordIndex === activeKaraoke.wordIndex) {
    return true;
  }

  // Lexical recovery fallback strictly for adjacent word boundary offsets (+/- 1 word)
  // Prevents common words (and, the, का, में) in distant sentences from false-highlighting
  if (activeKaraoke.wordText) {
    if (Math.abs(currentWordIndex - activeKaraoke.wordIndex) <= 1) {
      const cleanWord = cleanWordForMatch(wordStr);
      const cleanTarget = cleanWordForMatch(activeKaraoke.wordText);
      if (cleanWord && cleanTarget && cleanWord === cleanTarget) {
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

  // 1. Extract Gita Shloka if encapsulated in tags
  let shlokaBlock: string | null = null;
  let remainingText = rawText;
  const shlokaMatch = rawText.match(/\[GITA_SHLOKA\]([\s\S]*?)\[\/GITA_SHLOKA\]/i);
  if (shlokaMatch) {
    shlokaBlock = shlokaMatch[1].trim();
    remainingText = rawText.replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/i, '').trim();
  }

  const isExplicitLocale = Boolean(locale && locale.length >= 2);
  const isSpanish = (locale ? locale.startsWith('es') : false) || (!isExplicitLocale && /\b(sabiduría|verso|capítulo|mente|emocional|resumen)\b/i.test(remainingText));
  const isFrench = (locale ? locale.startsWith('fr') : false) || (!isExplicitLocale && /\b(sagesse|verset|chapitre|respiration|émotionnel|résumé)\b/i.test(remainingText));
  const isGerman = (locale ? locale.startsWith('de') : false) || (!isExplicitLocale && /\b(weisheit|kapitel|nervensystem|emotional|zusammenfassung)\b/i.test(remainingText));
  const isHindi = (locale ? locale.startsWith('hi') : false) || (!isSpanish && !isFrench && !isGerman && /[\u0900-\u097F]/.test(remainingText));

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
    const lower = part.toLowerCase();

    // 1. Diagnostic / Emotional Suffering Assessment
    const isDiag = !isLastCard && (
      part.startsWith('**SUMMARY') ||
      lower.includes('suffering assessment') ||
      lower.includes('wellbeing assessment') ||
      lower.includes('diagnostic') ||
      lower.includes('evaluación del estado') ||
      lower.includes('analyse de l\'état') ||
      lower.includes('belastungsanalyse') ||
      lower.includes('klinische zusammenfassung') ||
      part.includes('स्थिति व कष्ट') ||
      part.includes('मानसिक पीड़ा') ||
      part.includes('स्थिति का सारांश') ||
      part.includes('स्थिति एवं') ||
      part.includes('मूल्यांकन')
    );

    // 2. Tratak Neuro-Ocular Gazing
    const isTratak = !isDiag && (
      part.startsWith('**4.') ||
      lower.includes('tratak') ||
      part.includes('त्राटक') ||
      lower.includes('neuro-ocular') ||
      lower.includes('neuro-oculaire') ||
      lower.includes('neuro-okular')
    );

    // 3. Clinical CBT & Somatic Neuro-regulation
    const isClinical = !isDiag && !isTratak && (
      lower.includes('clinical') ||
      lower.includes('clinique') ||
      lower.includes('klinisch') ||
      lower.includes('cbt') ||
      lower.includes('tcc') ||
      lower.includes('cogniti') ||
      lower.includes('kogniti') ||
      lower.includes('reframe') ||
      lower.includes('reestructur') ||
      lower.includes('restructur') ||
      lower.includes('somatic') ||
      lower.includes('somatique') ||
      lower.includes('somatisch') ||
      lower.includes('pranayama') ||
      part.includes('क्लिनिकल') ||
      part.includes('कॉग्निटिव') ||
      part.includes('संज्ञानात्मक') ||
      part.includes('शारीरिक स्थिरता') ||
      part.includes('प्राणायाम') ||
      (part.startsWith('**3.') && !lower.includes('bhagavad') && !part.includes('गीता'))
    );

    // 4. Bhagavad Gita Shloka & Spiritual Wisdom (guaranteed NOT clinical and NOT tratak)
    const isGita = !isDiag && !isTratak && !isClinical && !isLastCard && (
      lower.includes('bhagavad gita') ||
      part.includes('गीता') ||
      part.includes('श्लोक') ||
      lower.includes('shloka') ||
      lower.includes('sabiduría del') ||
      lower.includes('sagesse de la') ||
      lower.includes('weisheit der') ||
      part.startsWith('**2.') ||
      (part.startsWith('**1.') && !part.includes('1. स्थिति') && !part.includes('1. Emotion'))
    );

    // 5. Synergy / Tri-Pillar resolution
    const isSyn = !isDiag && !isGita && !isClinical && !isTratak && (
      isLastCard ||
      part.startsWith('**5.') ||
      (part.includes('**') && (lower.includes('synerg') || part.includes('त्रिवेणी') || part.includes('समाधान')))
    );

    if (isDiag) diagPart = part;
    else if (isGita) gitaPart = part;
    else if (isClinical) cbtPart = part;
    else if (isTratak) tratakPart = part;
    else if (isSyn) synergyPart = part;
  });

  // Strict structured validation:
  // A message is structured ONLY if:
  // 1. It contains an authentic [GITA_SHLOKA] block, OR
  // 2. It contains multiple genuine therapeutic sections (e.g. diagPart/gitaPart + cbtPart/tratakPart) AND rawParts.length >= 2
  const hasMultipleTherapeuticSections = rawParts.length >= 2 && Boolean((diagPart || gitaPart) && (cbtPart || tratakPart || synergyPart));
  const hasValidShlokaBlock = Boolean(shlokaBlock && shlokaBlock.trim().length > 10);

  if (!hasValidShlokaBlock && !hasMultipleTherapeuticSections) {
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
    ? `पहचाना गया मनोभाव: ${emotionName}। ${severity ? `पीड़ा व तंत्रिका तंत्र: ${severity}${autonomicState ? ` ${autonomicState}` : ''}। ` : ''}${bodilyBurden ? `शारीरिक संवेदनाएं: ${bodilyBurden}। ` : ''}${summary ? `${summary} ` : ''}${confirmationPrompt}`
    : `Understood Emotion: ${emotionName}. ${severity ? `Severity and autonomic state: ${severity}${autonomicState ? ` ${autonomicState}` : ''}. ` : ''}${bodilyBurden ? `Bodily sensations: ${bodilyBurden}. ` : ''}${summary ? `${summary} ` : ''}${confirmationPrompt}`;

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
    const mMatch = gitaPart.match(/(?:समझाते हैं कि|पावन संदेश:|nos ilumina:|nous éclaire :|lehrt:|meaning:|Essence:|Teaching:)\s*([^\n]+)/i);
    if (mMatch) meaning = mMatch[1].trim();

    const rMatch = gitaPart.match(/(?:इस संदेश को अपने वर्तमान जीवन में उतारें:|जीवन में उतारें:|Integración:|Application :|reflection:|Reflexion:)\s*([^\n]+)/i);
    if (rMatch) reflection = rMatch[1].trim();

    const dMatch = gitaPart.match(/(?:इस समय आपका कर्तव्य:|वर्तमान कर्तव्य:|कर्तव्य:|orientación de acción:|action juste :|Action:|duty:)\s*([^।\n]+)/i);
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

  const shlokaSep = spokenShloka ? (isHindi ? '। ' : '. ') : '';
  let s2SpeechText = `${spokenShloka}${shlokaSep}${isHindi ? `${meaning ? `भगवान श्रीकृष्ण का पावन संदेश: ${meaning}। ` : ''}${reflection ? `जीवन में उतारें: ${reflection}। ` : ''}${duty ? `वर्तमान कर्तव्य: ${duty}। ` : ''}${avoid ? `विशेष रूप से इस भूल से बचें: ${avoid}।` : ''}` : `${meaning ? `Divine Teaching: ${meaning}. ` : ''}${reflection ? `Spiritual Reflection: ${reflection}. ` : ''}${duty ? `Your Duty Right Now: ${duty}. ` : ''}${avoid ? `Pitfall to Avoid: ${avoid}.` : ''}`}`.trim();
  if (!s2SpeechText.trim()) {
    s2SpeechText = isHindi
      ? 'भगवद्गीता का दिव्य संदेश आपके आंतरिक संतुलन, धैर्य और कर्म-चेतना को जाग्रत करता है।'
      : 'Bhagavad Gita wisdom anchors your mind in purposeful action, equanimity, and inner strength.';
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
  if (!cbtPart || cbtPart.trim().length < 15) {
    if (isHindi) {
      cbtPart = `**3. क्लिनिकल कॉग्निटिव न्यूरोसाइंस (CBT एवं शारीरिक स्थिरता):**
अपने वर्तमान चिंताजनक विचारों की वास्तविकता को परखें। जो विचार इस समय आपके मन में आ रहे हैं, वे केवल अस्थायी मानसिक तरंगे हैं, अंतिम सत्य नहीं।

• **शारीरिक स्थिरता (Somatic Anchor):** अपनी हथेलियों को हृदय और नाभि पर रखें और गहरी सांस लें।
• **अनुलोम-विलोम व संतुलित श्वास:** 4 सेकंड गहरी श्वास लें, 4 सेकंड रोकें और 6 सेकंड में धीरे-धीरे छोड़ें।`;
    } else if (isSpanish) {
      cbtPart = `**3. Neurociencia Clínica Cognitiva (TCC y Anclaje Somático):**
Examine la validez de los pensamientos automáticos. Lo que siente es una señal neurovegetativa temporal, no una fatalidad permanente.

• **Anclaje Somático:** Coloque una mano sobre el pecho y apoye firmemente ambos pies en el suelo.
• **Respiración Reguladora:** Inhale durante 4 segundos, sostenga 4 segundos y exhale suavemente durante 6 segundos.`;
    } else if (isFrench) {
      cbtPart = `**3. Neurosciences Cliniques Cognitives (TCC et Ancrage Somatique) :**
Prenez du recul face aux pensées automatiques anxiogènes. Cette sensation est une réaction neurovégétative passagère, pas une fatalité.

• **Ancrage Somatique :** Posez une main sur le thorax et ancrez vos pieds au sol.
• **Respiration Apaisante :** Inspirez pendant 4 secondes, retenez 4 secondes, puis expirez lentement pendant 6 secondes.`;
    } else if (isGerman) {
      cbtPart = `**3. Klinische Kognitive Neurowissenschaft (CBT & Somatische Erdung):**
Hinterfragen Sie katastrophisierende Gedankenmuster. Was Sie gerade spüren, ist eine vorübergehende autonome Reaktion, keine unveränderliche Realität.

• **Somatische Erdung:** Legen Sie eine Hand auf die Brust und spüren Sie festen Boden unter den Füßen.
• **Beruhigende Atmung:** 4 Sekunden einatmen, 4 Sekunden halten, 6 Sekunden langsam ausatmen.`;
    } else {
      cbtPart = `**3. Clinical Cognitive Neuroscience (CBT & Somatic Grounding):**
Notice and challenge catastrophic thought patterns. What you are experiencing is an autonomic nervous system signal, not a permanent reality.

• **Somatic Anchor:** Place a hand on your heart and feel your feet firmly planted on the ground.
• **Calming Breathwork:** Inhale for 4 seconds, hold for 4 seconds, and exhale slowly for 6 seconds.`;
    }
  }

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
    .replace(/^\*\*(?:[23]\.\s+|CLINICAL[^*]*|क्लिनिकल[^*]*|NEUROCIENCIA[^*]*|NEUROSCIENCES[^*]*|KLINISCHE[^*]*|CBT[^*]*|TCC[^*]*)[^*]*\*\*\s*:?\s*/im, '')
    .trim();

  const s3SpeechText = cbtCleaned || (isHindi
    ? 'अपने मन के नकारात्मक विचारों को पहचानें और गहरी सांस लेकर तंत्रिका तंत्र को शांत करें।'
    : isSpanish
    ? 'Identifique los pensamientos negativos y calme el sistema nervioso con respiraciones profundas.'
    : isFrench
    ? 'Prenez conscience des pensées négatives et apaisez le système nerveux par une respiration posée.'
    : isGerman
    ? 'Erkennen Sie negative Gedankenmuster und beruhigen Sie das Nervensystem mit bewusster Atmung.'
    : 'Notice catastrophic thoughts and anchor your nervous system with measured breathing.');

  const s3Title = isHindi
    ? 'संज्ञानात्मक पुनर्गठन एवं शारीरिक स्थिरता'
    : isSpanish
    ? 'Reestructuración Cognitiva y Somática'
    : isFrench
    ? 'Restructuration Cognitive et Somatique'
    : isGerman
    ? 'Kognitive Umstrukturierung und Somatik'
    : 'Cognitive Restructuring & Somatics';

  stages.push({
    stage: 3,
    stageKey: 'cbt',
    title: s3Title,
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

  const s4SpeechText = tratakCleaned || (isHindi
    ? 'अपनी दृष्टि को एक बिंदु पर स्थिर करें ताकि मस्तिष्क का तनाव केंद्र शांत हो सके। अंत में हथेलियों को रगड़कर आंखों पर रखें।'
    : 'Rest a motionless soft gaze upon the focal target to stop ocular micro-saccades and de-escalate amygdala hyperarousal.');

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

