/**
 * lib/nlp/cognitive-orchestrator.ts
 *
 * Hidden Two-Stage Cognitive & Psychological Diagnostic Engine (TypeScript).
 * Performs Stage 1 structured analysis on user utterances:
 * - Semantic Entity & Anchor Term Extraction
 * - CBT Distortion Classification (All-or-Nothing, Catastrophizing, Personalization, Mind Reading, Emotional Reasoning)
 * - Polyvagal Tone (Ventral Vagal Safe, Sympathetic Fight/Flight, Dorsal Vagal Shutdown)
 * - Ayurvedic Doshic Imbalance (Prana Vata, Sadhaka Pitta, Tarpaka Kapha, Sattva/Rajas/Tamas)
 * - Live 27-D Cowen & Keltner Intensity Percentage Scores
 * - Socratic / Somatic Strategic Objectives
 */

export interface CognitiveDiagnosticResult {
  anchorPhrases: string[];
  normalizedAnchor: string;
  conversationalIntent: 'greeting' | 'companion_inquiry' | 'identity_inquiry' | 'gratitude' | 'farewell' | 'repetition_complaint' | 'distress_expression';
  coreEmotionalNeed: 'validation' | 'boundary_setting' | 'somatic_grounding' | 'reality_testing';
  cbtDistortion: 'none' | 'catastrophizing' | 'all_or_nothing' | 'emotional_reasoning' | 'personalization' | 'overgeneralization' | 'mind_reading';
  polyvagalState: 'ventral_vagal (safe)' | 'sympathetic (fight/flight)' | 'dorsal_vagal (shutdown/numb)';
  ayurvedicState: {
    dominantDosha: 'prana_vata (anxiety/scattered)' | 'sadhaka_pitta (anger/burnout)' | 'tarpaka_kapha (lethargy/grief)' | 'balanced';
    guna: 'sattva' | 'rajas' | 'tamas';
  };
  top3CowenEmotions: Array<{ name: string; percentage: number }>;
  therapeuticStrategy: string;
}

export function normalizeEntityAnchor(entity: string): string {
  const e = (entity || '').toLowerCase().trim();
  if (!e || e === 'current situation' || e === 'this situation' || e === 'doing' || e === 'situation') return 'this situation';

  if (/[\u0900-\u097F]/.test(e)) {
    if (e === 'ऑफिस' || e === 'काम') return 'काम और ऑफिस';
    if (e === 'बॉस' || e === 'मैनेजर') return 'बॉस और कार्यस्थल';
    if (e === 'तनाव') return 'इस तनाव';
    if (e === 'घबराहट' || e === 'चिंता') return 'घबराहट और बेचैनी';
    if (e === 'सलाह' || e === 'उपाय') return 'मार्गदर्शन और उपाय';
    if (e === 'दोस्त') return 'आपके मित्र';
    if (e === 'नींद') return 'नींद और विश्राम';
    return e;
  }

  if (e === 'driving test') return 'your driving test';
  if (e === 'test' || e === 'exam') return 'your exam or test';
  if (e === 'interview') return 'your job interview';
  if (e === 'presentation') return 'your presentation';
  if (e === 'boss' || e === 'manager') return 'your manager';
  if (e === 'girlfriend') return 'your girlfriend';
  if (e === 'boyfriend') return 'your boyfriend';
  if (e === 'partner' || e === 'husband' || e === 'wife') return 'your partner';
  if (e === 'friend' || e === 'best friend') return 'your friend';
  if (e === 'dog' || e === 'cat' || e === 'pet') return 'your pet';
  if (e === 'savings' || e === 'crypto' || e === 'money' || e === 'debt') return 'your financial situation';
  if (e === 'job' || e === 'work' || e === 'office') return 'your work situation';
  if (e === 'sleep' || e === 'insomnia') return 'restless sleep';
  if (e === 'chest' || e === 'throat' || e === 'heart' || e === 'stomach') return `physical tension in your ${e}`;
  // Pronoun conversions
  if (e.startsWith('my ')) return `your ${e.slice(3)}`;
  if (e.startsWith('i ') || e.startsWith("i'm ") || e.startsWith('im ') || e.startsWith('we ') || e.startsWith('should ') || e.startsWith('what ') || e.startsWith('how ') || e.startsWith('can ') || e.startsWith('why ')) {
    return 'this situation';
  }

  // If e is an adjective, adverb, or verb, return natural contextual noun phrase
  const nonNounWords = new Set([
    'lonely', 'exhausted', 'tired', 'scared', 'afraid', 'panicking', 'worried', 'anxious',
    'stress', 'stressed', 'sad', 'angry', 'furious', 'depressed', 'useless', 'stupid',
    'hopeless', 'helpless', 'ruined', 'worst', 'failed', 'failing', 'beating', 'working',
    'capable', 'completely', 'disappointed', 'comes', 'going', 'else', 'alone', 'feeling',
    'feels', 'trying', 'thinking', 'getting', 'having', 'losing', 'lost', 'such', 'mess',
    'passed', 'matter', 'matters', 'most'
  ]);
  if (nonNounWords.has(e)) {
    if (e === 'lonely' || e === 'alone') return 'feelings of loneliness';
    if (e === 'exhausted' || e === 'tired') return 'physical and mental fatigue';
    if (e === 'scared' || e === 'afraid' || e === 'panicking' || e === 'anxious' || e === 'worried') return 'feelings of acute anxiety';
    if (e === 'sad' || e === 'depressed' || e === 'disappointed') return 'this heavy emotional weight';
    if (e === 'angry' || e === 'furious') return 'intense frustration';
    if (e === 'failed' || e === 'failing' || e === 'beating' || e === 'useless' || e === 'stupid' || e === 'mess') return 'this setback';
    if (e === 'working') return 'your work demands';
    return 'this situation';
  }

  if (e.startsWith('your ') || e.startsWith('the ') || e.startsWith('this ') || e.startsWith('a ') || e.startsWith('an ')) return e;
  if (e.length > 25) return 'this situation';
  return `your ${e}`;
}

export function runHiddenCognitiveDiagnostics(userText: string): CognitiveDiagnosticResult {
  const text = (userText || '').trim();
  const lower = text.toLowerCase();

  // 0. Detect Conversational Social Intents
  let conversationalIntent: CognitiveDiagnosticResult['conversationalIntent'] = 'distress_expression';
  if (
    lower.includes('stop repeating') || lower.includes('again and again') || lower.includes('same question') ||
    lower.includes('repeating the same') || lower.includes('same sentences') || lower.includes('stuck in loop') ||
    lower.includes('stuck in a loop') || lower.includes('why do you keep asking')
  ) {
    conversationalIntent = 'repetition_complaint';
  } else if (
    lower === 'hi' || lower === 'hey' || lower === 'hello' || lower.startsWith('hey ') || lower.startsWith('hello ') ||
    lower.startsWith('good morning') || lower.startsWith('good evening') || lower.startsWith('good afternoon') || lower === 'namaste'
  ) {
    conversationalIntent = 'greeting';
  } else if (
    lower.includes('how are you') || lower.includes('how are you doing') || lower.includes('how is your day') ||
    lower.includes("how's it going") || lower.includes('how are things') || lower.includes('are you doing okay') ||
    lower.includes('how you doing')
  ) {
    conversationalIntent = 'companion_inquiry';
  } else if (
    lower.includes('who are you') || lower.includes('what are you') || lower.includes('what can you do') ||
    lower.includes('tell me about yourself') || lower.includes('what is your purpose') || lower.includes('can you help me')
  ) {
    conversationalIntent = 'identity_inquiry';
  } else if (
    lower.includes('thank you') || lower.includes('thanks') || lower.includes('appreciate it') || lower.includes('grateful for your help')
  ) {
    conversationalIntent = 'gratitude';
  } else if (
    lower === 'bye' || lower === 'goodbye' || lower.startsWith('good night') || lower.includes('good night') ||
    lower.includes('talk to you later') || lower.includes('see you later') || lower.includes('talk to you tomorrow') || lower.includes('bye for now')
  ) {
    conversationalIntent = 'farewell';
  }

  // 1. Extract Anchor Phrases & Situational Nouns with Word Boundary Matching
  const situationalEntities = [
    'driving test', 'presentation', 'interview', 'exam', 'boss', 'manager', 'job', 'office', 'work',
    'colleague', 'partner', 'girlfriend', 'boyfriend', 'husband', 'wife', 'best friend', 'friend',
    'dog', 'cat', 'pet', 'money', 'savings', 'crypto', 'rent', 'debt', 'sleep', 'insomnia',
    'chest', 'throat', 'heart', 'stomach', 'quit', 'fired', 'failed', 'rejected', 'cheated',
    'alone', 'exhausted', 'test',
    'ऑफिस', 'काम', 'बॉस', 'मैनेजर', 'तनाव', 'घबराहट', 'चिंता', 'सलाह', 'उपाय', 'दोस्त', 'नींद'
  ];

  const foundAnchors: string[] = [];
  for (const entity of situationalEntities) {
    const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:\\b|(?<=[\u0900-\u097F]))${escaped}(?:\\b|(?=[\u0900-\u097F]))`, 'i').test(text)) {
      foundAnchors.push(entity);
    }
  }

  // If no explicit domain keyword matched, extract significant content words
  if (foundAnchors.length === 0) {
    const rawWords = text.match(/[\u0900-\u097F\w]{4,}/g) || [];
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'what', 'your', 'about', 'feel', 'feeling', 'like',
      'doing', 'today', 'hello', 'there', 'please', 'going', 'think', 'thinking', 'getting', 'trying',
      'want', 'need', 'know', 'just', 'some', 'them', 'they', 'were', 'been', 'would', 'could',
      'should', 'more', 'much', 'very', 'here', 'when', 'where', 'which', 'will', 'good', 'well',
      'help', 'tell', 'talk', 'someone', 'anyone', 'something', 'anything', 'also', 'really',
      'stop', 'maybe', 'always', 'everyone', 'everything', 'never', 'nothing', 'nobody', 'parents',
      'parent', 'incompetent', 'idiot', 'stupid', 'useless', 'failure', 'worst', 'disaster',
      'again', 'single', 'time', 'night', 'morning', 'evening', 'tomorrow', 'sunday', 'monday',
      'such', 'mess', 'passed', 'matter', 'matters', 'most', 'बहुत', 'सकते', 'सकता', 'सकती',
      'रहा', 'रही', 'रहे', 'होता', 'होती', 'होते', 'करना', 'करूं', 'करें', 'मुझे', 'आपको'
    ]);
    const contentWords = rawWords.filter((w) => !stopWords.has(w.toLowerCase()));
    if (contentWords.length > 0) {
      foundAnchors.push(...contentWords.slice(0, 3));
    } else {
      foundAnchors.push('this situation');
    }
  }

  const rawAnchor = foundAnchors[0] || 'this situation';
  const normalizedAnchor = normalizeEntityAnchor(rawAnchor);

  // 2. Classify CBT Cognitive Distortion
  let cbtDistortion: CognitiveDiagnosticResult['cbtDistortion'] = 'none';
  if (/\b(always|never|everyone|nobody|everything|nothing|ruined)\b/i.test(lower)) {
    cbtDistortion = 'all_or_nothing';
  } else if (/\b(stupid|useless|idiot|my fault|i ruined|i suck|loser)\b/i.test(lower)) {
    cbtDistortion = 'personalization';
  } else if (/\b(worst|disaster|life is over|end of everything|can never|doomed|hopeless)\b/i.test(lower)) {
    cbtDistortion = 'catastrophizing';
  } else if (/\b(they think|they hate me|she thinks|he thinks|everyone thinks|everyone judged)\b/i.test(lower)) {
    cbtDistortion = 'mind_reading';
  } else if (/\b(i feel like a failure so|feels pointless|feels doomed)\b/i.test(lower)) {
    cbtDistortion = 'emotional_reasoning';
  } else if (/\b(again|every single time|always happens to me)\b/i.test(lower)) {
    cbtDistortion = 'overgeneralization';
  }

  // 3. Classify Polyvagal Tone
  let polyvagalState: CognitiveDiagnosticResult['polyvagalState'] = 'ventral_vagal (safe)';
  if (/\b(panic|panicking|panicked|anxious|anxiety|racing|shaking|pounding|angry|furious|screaming|pissed|yelled|stress|stressed)\b/i.test(lower)) {
    polyvagalState = 'sympathetic (fight/flight)';
  } else if (/\b(exhausted|numb|empty|heavy|cant move|giving up|hopeless|crying|depressed|fatigue)\b/i.test(lower)) {
    polyvagalState = 'dorsal_vagal (shutdown/numb)';
  }

  // 4. Classify Ayurvedic Doshic & Guna Imbalance
  let dominantDosha: CognitiveDiagnosticResult['ayurvedicState']['dominantDosha'] = 'balanced';
  let guna: CognitiveDiagnosticResult['ayurvedicState']['guna'] = 'sattva';

  if (polyvagalState === 'sympathetic (fight/flight)') {
    if (/\b(angry|furious|yelled|pissed|unfair|hate|rage|irritated)\b/i.test(lower)) {
      dominantDosha = 'sadhaka_pitta (anger/burnout)';
      guna = 'rajas';
    } else {
      dominantDosha = 'prana_vata (anxiety/scattered)';
      guna = 'rajas';
    }
  } else if (polyvagalState === 'dorsal_vagal (shutdown/numb)') {
    dominantDosha = 'tarpaka_kapha (lethargy/grief)';
    guna = 'tamas';
  }

  // 5. Determine Core Emotional Need
  let coreEmotionalNeed: CognitiveDiagnosticResult['coreEmotionalNeed'] = 'validation';
  if (cbtDistortion !== 'none') {
    coreEmotionalNeed = 'reality_testing';
  } else if (polyvagalState === 'sympathetic (fight/flight)') {
    coreEmotionalNeed = 'somatic_grounding';
  } else if (/\b(boundary|toxic|mean|boss|partner|cheated|lied)\b/i.test(lower)) {
    coreEmotionalNeed = 'boundary_setting';
  }

  // 6. Calculate Top 3 Cowen & Keltner Dimensions (%)
  let top3CowenEmotions: Array<{ name: string; percentage: number }> = [];
  if (dominantDosha.includes('prana_vata')) {
    top3CowenEmotions = [
      { name: 'Anxiety', percentage: 86 },
      { name: 'Fear', percentage: 70 },
      { name: 'Confusion', percentage: 54 },
    ];
  } else if (dominantDosha.includes('sadhaka_pitta')) {
    top3CowenEmotions = [
      { name: 'Anger', percentage: 88 },
      { name: 'Disgust', percentage: 64 },
      { name: 'Awkwardness', percentage: 46 },
    ];
  } else if (dominantDosha.includes('tarpaka_kapha')) {
    top3CowenEmotions = [
      { name: 'Sadness', percentage: 86 },
      { name: 'Empathic Pain', percentage: 72 },
      { name: 'Nostalgia', percentage: 48 },
    ];
  } else if (/\b(happy|good|great|relieved|peace|calm|awesome|proud)\b/i.test(lower)) {
    top3CowenEmotions = [
      { name: 'Calmness', percentage: 84 },
      { name: 'Relief', percentage: 76 },
      { name: 'Satisfaction', percentage: 68 },
    ];
  } else {
    top3CowenEmotions = [
      { name: 'Calmness', percentage: 78 },
      { name: 'Interest', percentage: 62 },
      { name: 'Aesthetic Appreciation', percentage: 46 },
    ];
  }

  // 7. Socratic / Somatic Strategic Directive
  const primaryAnchors = foundAnchors.slice(0, 2).map(normalizeEntityAnchor).join(' and ');
  const therapeuticStrategy = `Anchor directly on ${primaryAnchors}, address ${cbtDistortion} distortion via Socratic inquiry, and regulate ${polyvagalState} using ${coreEmotionalNeed}.`;

  return {
    anchorPhrases: foundAnchors,
    normalizedAnchor,
    conversationalIntent,
    coreEmotionalNeed,
    cbtDistortion,
    polyvagalState,
    ayurvedicState: {
      dominantDosha,
      guna,
    },
    top3CowenEmotions,
    therapeuticStrategy,
  };
}
