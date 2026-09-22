/**
 * lib/knowledge/psychology-library-rag.ts
 * TypeScript Edge & Client-Side RAG Retrieval Engine for the Clinical & Psychoeducational Library.
 * Grounded in Evidence-Based CBT, Polyvagal Theory & Ayurvedic Sattvavajaya Chikitsa.
 */

import psychologyLibraryData from '../../data/psychology_library.json' with { type: 'json' };
import { emotionClassifier } from './emotion-classifier.ts';
import {
  DYNAMIC_LEARNED_DOCUMENTS,
  learnAndIndexQuery,
  addLearnedDocument,
  getLearnedDocuments,
  type LearnedPsychologyDocument,
} from './self-learning-rag.ts';

export interface ClinicalSolutions {
  cbt_reframing: string;
  somatic_anchor: string;
  pranayama: string;
  micro_habit: string;
}

export interface PsychologyCondition {
  id: string;
  name: string;
  category: string;
  triguna_balance: string;
  core_symptoms: string[];
  cognitive_distortions: string[];
  solutions: ClinicalSolutions;
  severity_level: string;
  recommended_trataka_mode?: string;
  requires_immediate_crisis: boolean;
}

export interface BreathCadence {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause: number;
  description: string;
}

export interface LibraryRAGResult {
  condition: PsychologyCondition;
  matchScore: number;
  matchedKeywords: string[];
  promptSnippet: string;
  structuredCard: {
    title: string;
    category: string;
    triguna: string;
    cbtReframing: string;
    somaticAnchor: string;
    pranayama: string;
    microHabit: string;
    breathCadence?: BreathCadence;
    sourceUrl?: string;
    sourcePlatform?: string;
    isLearnedDocument?: boolean;
    recommendedTratakaMode?: string;
  };
}

export const PSYCHOLOGY_LIBRARY: PsychologyCondition[] = psychologyLibraryData as PsychologyCondition[];

/**
 * Domain-specific regex triggers mapped to condition IDs for rapid, high-accuracy clinical matching.
 * Includes English, Devanagari Hindi, Hinglish, Spanish, French, and German clinical keywords.
 */
const CLINICAL_TRIGGER_PATTERNS: Record<string, RegExp> = {
  gad: /(?:\b(worry|worrying|worried|what if|anxious|anxiety|nervous|nervousness|tense|tension|restless|racing mind|cannot relax|dread|on edge|stress|stressed|stressing|overwhelmed|overthinking|overthink|pressure|ghabrahat|chinta|bechaini|tanaav|ansiedad|inquietude|angst)\b|तनाव|चिंता|बेचैनी|घबराहट|परेशानी|दबाव)/i,
  burnout_fatigue: /(?:\b(burnout|burned out|burnt out|exhausted|exhaustion|brain fog|lethargy|overworked|depleted|no energy|drained|tired of working|work fatigue|worn out|thak gaya|thakan|agotamiento|epuisement|erschopfung)\b|थकान|थक गया|ऊर्जा नहीं|बहुत थक|सुस्ती|निढाल)/i,
  panic_dysregulation: /(?:\b(panic|panic attack|heart racing|palpitations|cannot breathe|suffocating|trembling|cold chills|hot flashes|doom|shaking|chest pounding|loss of control|gasping|hyperventilating|saas nahi|ghutan|ataque de panico|panique)\b|घबराहट का दौरा|सांस नहीं|घुटन|दिल तेजी से|कांप रहा)/i,
  major_depressive_inertia: /(?:\b(depressed|depression|low mood|feeling down|empty|emptiness|hopeless|hopelessness|despair|anhedonia|unmotivated|no point|cannot get out of bed|worthless|useless|numb|sad|sadness|sorrow|crying|weep|weeping|tears|gloom|gloomy|downhearted|miserable|udaas|udaasi|depresion|tristesse)\b|उदास|उदासी|निराशा|रोना|रो रहा|कुछ अच्छा नहीं|मन उदास)/i,
  imposter_perfectionism: /(?:\b(imposter|impostor|fraud|failure|failed|failing|fake|not belong|don't belong|dont belong|perfectionist|perfectionism|not good enough|incompetent|will be exposed|cheat|mess up|messing up|fear of failing|kabil nahi)\b|काबिल नहीं|नाकाबिल|असफल|असफलता का डर)/i,
  relationship_heartbreak: /(?:\b(breakup|broke up|ex-|ex boyfriend|ex girlfriend|partner|husband|wife|fight|argument|heartbreak|broken heart|rejection|unloved|abandoned|abandonment|cheated|divorce|infidelity|betrayed by|dil toot|rupture)\b|दिल टूट|ब्रेकअप|रिश्ता टूट|धोखा दिया|झगड़ा हुआ)/i,
  existential_loneliness: /(?:\b(lonely|loneliness|all alone|isolated|isolation|nobody cares|no friends|alienated|alienation|empty world|disconnected|no one to talk to|solitary|friendless|akela|akelepan|soledad|solitude|einsamkeit)\b|अकेला|अकेलापन|कोई नहीं है|तनहाई|अलग-थलग)/i,
  anger_frustration_dysregulation: /(?:\b(angry|anger|furious|fury|rage|raging|mad|irritated|irritation|annoyed|annoyance|frustrated|frustration|unfair|unfairness|hate them|screaming|boss yelled|yelled at me|injustice|betrayed|temper|resentment|gussa|krodh|colere|wut)\b|गुस्सा|क्रोध|चिड़चिड़ाहट|नाराज|क्रोधित|गुस्सा आ रहा)/i,
  grief_bereavement: /(?:\b(grief|grieving|bereavement|loss of|died|passed away|mourning|sorrow|funeral|lost my dog|lost my cat|lost my parent|lost my loved one|passed on|deceased|weeping for|shok|duelo|deuil|trauer)\b|शोक|मौत|गुजर गए|खो दिया|शोकग्रस्त)/i,
  social_evaluative_threat: /(?:\b(social anxiety|shy|shyness|embarrassed|embarrassment|judging me|public speaking|awkward|crowds|humiliated|presentation|speech anxiety|people staring|stage fear|stage fright|sharm|timide)\b|शर्म|झिझक|स्टेज का डर|लोग क्या सोचेंगे|मंच का डर)/i,
  adhd_executive_overwhelm: /(?:\b(adhd|procrastinate|procrastinating|procrastination|task paralysis|cannot start|overwhelmed with tasks|distract|distracted|distraction|executive dysfunction|frozen|stuck on tasks|can't focus|cannot focus|unable to focus)\b|ध्यान नहीं लग रहा|टालमटोल|काम शुरू नहीं|फोकस नहीं)/i,
  insomnia_hyperarousal: /(?:\b(insomnia|cannot sleep|cant sleep|waking up|sleep trouble|sleepless|sleeplessness|staying awake|lying in bed|midnight|toss and turn|tossing and turning|bedtime racing|sleep anxiety|wakeful|neend nahi|insomnio|insomnie|schlaflosigkeit)\b|नींद नहीं|सो नहीं पा रहा|अनिद्रा|जाग रहा)/i,
  health_somatic_anxiety: /(?:\b(health anxiety|hypochondria|illness|disease|cancer|heart attack|checking pulse|medical symptoms|sick|tumor|body sensation|googling symptoms|bimaari)\b|बीमारी का डर|सेहत की चिंता|रोग|लक्षण)/i,
  trauma_hypervigilance: /(?:\b(trauma|traumatic|ptsd|flashback|flashbacks|triggered|hypervigilant|hypervigilance|abuse|assault|startled|safe space|nightmares|visceral reaction)\b|सदमा|पुराना सदमा|डरावने सपने|आघात)/i,
  ocd_intrusive_rumination: /(?:\b(ocd|intrusive thought|intrusive thoughts|pure o|pure-o|bad thoughts|disturbing thought|unwanted thought|mental check|reassurance seeking|thought action fusion|compulsion|compulsive|rumination|ruminating|washing hands|washing my hands|wash hands|wash my hands|checking locks|checking the locks|checking if i locked|checking the door|cleanliness|contamination|counting|repeat things|checking again|bure vichar)\b|बुरे विचार|अवांछित विचार|बार बार वही सोच|हाथ धोना|ताला चेक)/i,
  compassion_fatigue_caregiver: /(?:\b(caregiver|caregiving|taking care of my|caring for sick|caring for elderly|caregiver burnout|caregiver fatigue|secondary trauma|empathic strain|empathy burnout|caretaker)\b|देखभाल का तनाव|मरीज की देखभाल|केयरगिवर)/i,
  decision_paralysis_ambivalence: /(?:\b(decision paralysis|cannot decide|cant decide|hard to choose|choice overload|too many options|analysis paralysis|paralyzed by choice|afraid of making wrong choice|indecisive|indecision|dilemma)\b|फैसला नहीं कर पा रहा|असमंजस|क्या चुनूं|निर्णय नहीं)/i,
  shame_core_defectiveness: /(?:\b(shame|ashamed|toxic shame|deeply flawed|defective|fundamentally broken|unworthy|hate myself|disgusted with myself|want to disappear|sharmindagi|vergüenza|honte|scham)\b|शर्मिंदगी|खुद से नफरत|अपराधबोध|खामी)/i,
  workplace_mobbing_toxic_culture: /(?:\b(toxic workplace|toxic boss|toxic manager|gaslighting boss|workplace mobbing|workplace harassment|coworker sabotage|hostile workplace|sunday dread|corporate politics|office politics)\b|ऑफिस का तनाव|बॉस की डांट|कार्यस्थल)/i,
  somatic_chronic_pain_amplification: /(?:\b(chronic pain|neuroplastic pain|back pain|fibromyalgia|pain reprocessing|tension headache|pain flare|somatic tracking|central sensitization|migraine|body ache|neck pain|muscle ache|dard)\b|दर्द|सिरदर्द|पीठ दर्द|बदन दर्द|माइग्रेन)/i,
  cognitive_memory_brain_fog: /(?:\b(memory|memories|weak memory|week memory|bad memory|poor memory|loose memory|lose memory|losing memory|forget|forgetful|forgetfulness|forgetting|forgot|cannot remember|cant remember|hard to remember|recall|short term memory|working memory|brain fog|mental fog|cloudy head|absent minded|cognitive fatigue|mental exhaustion|yaad nahi|yaaddasht|bhool|bhul gaya|bhul jata|memoria|oubli|gedachtnis|vergesslich)\b|याददाश्त|याद नहीं|भूल जाता|भूलना|कमजोर याददाश्त|दिमागी धुंध)/i,
  emotional_dysregulation_numbness: /(?:\b(emotional|emotion|emotions|emanation|numb|numbness|emotionally numb|feeling nothing|cant feel|cannot feel|blunted|dissociat|dissociation|alexithymia|emotional flooding|emotional overwhelm|overwhelmed with emotions|emotional swing|emotional problem|mood swings|shut down|bhavna|bhavnayein|sunn|jazbaat)\b|भावना|भावनाएं|सुन्न|जज्बात|भावनाहीन)/i,
};

/**
 * Pre-configured breathwork pacing presets for clinical interventions.
 */
export const CLINICAL_BREATHWORK_PACERS: Record<string, BreathCadence> = {
  gad: {
    name: 'Nadi Shodhana (Alternate Nostril)',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 2,
    description: 'Harmonizes sympathetic and parasympathetic branches of the autonomic nervous system.',
  },
  burnout_fatigue: {
    name: 'Bhramari (Humming Bee Resonance)',
    inhale: 4,
    hold: 1,
    exhale: 6,
    pause: 1,
    description: 'Generates cranial micro-vibrations stimulating nitric oxide release and vagal tone.',
  },
  panic_dysregulation: {
    name: 'Extended Exhale Vagal Brake',
    inhale: 4,
    hold: 0,
    exhale: 7,
    pause: 1,
    description: 'Long exhalations activate the cardiac vagal brake, reducing heart rate rapidly.',
  },
  major_depressive_inertia: {
    name: 'Surya Bhedana (Solar Activation)',
    inhale: 4,
    hold: 2,
    exhale: 4,
    pause: 0,
    description: 'Activates right-nostril solar pingala nadi to disperse lethargy and tamasic inertia.',
  },
  imposter_perfectionism: {
    name: 'Sitali Cooling Breathwork',
    inhale: 4,
    hold: 2,
    exhale: 5,
    pause: 1,
    description: 'Cools physiological overheating, lowers autonomic agitation and perfectionist drive.',
  },
  social_evaluative_threat: {
    name: 'Sama Vritti (Box Breathing 4-4-4-4)',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4,
    description: 'Stabilizes anterior cingulate cortex and restores focused prefrontal working memory.',
  },
  insomnia_hyperarousal: {
    name: "Dr. Weil's 4-7-8 Somnolence Protocol",
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 0,
    description: 'Forces oxygenation and shifts central autonomic balance into deep sleep readiness.',
  },
  ocd_intrusive_rumination: {
    name: 'Viloma Interrupted Breathwork',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 2,
    description: 'Stepwise breathing breaks hyper-fixated mental looping and compulsion urgency.',
  },
  shame_core_defectiveness: {
    name: 'Chandra Bhedana (Lunar Soothing)',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 1,
    description: 'Stimulates left-nostril ida nadi to foster deep self-soothing and parasympathetic warmth.',
  },
  decision_paralysis_ambivalence: {
    name: 'Ujjayi (Oceanic Centering)',
    inhale: 5,
    hold: 2,
    exhale: 5,
    pause: 1,
    description: 'Throat-constricted audible breath stabilizes prefrontal cortical decision circuits.',
  },
  cognitive_memory_brain_fog: {
    name: 'Bhramari Cranial Resonance Breath',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 1,
    description: 'Humming sound vibrations stimulate cerebral nitric oxide production, clearing mental fog and soothing cognitive fatigue.',
  },
  emotional_dysregulation_numbness: {
    name: 'Viloma Pranayama (Interrupted Inhalation)',
    inhale: 4,
    hold: 2,
    exhale: 6,
    pause: 2,
    description: 'Steadily awakens emotional somatic tone without sympathetic flooding.',
  },
};

/**
 * Detects if user input is a greeting message
 */
export function isGreetingMessage(text: string): boolean {
  if (!text || !text.trim()) return false;
  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;

  const exactGreetings = new Set([
    'hello',
    'hi',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'namaste',
    'greetings',
    'howdy',
    'hola',
    'bonjour',
    'hallo',
    'hi there',
    'hello there',
    'hey there',
    'hello how are you',
    'hi how are you',
    'hey how are you',
    'how are you',
    'how are you doing',
    'whats up',
    'what s up',
  ]);
  if (exactGreetings.has(clean)) return true;

  const words = clean.split(' ');
  if (words.length <= 4) {
    if (['hello', 'hi', 'hey', 'namaste', 'greetings', 'howdy', 'hola'].includes(words[0])) {
      return true;
    }
  }
  return false;
}

/**
 * Detects if user input is a microphone / audio test message
 */
export function isTestMessage(text: string): boolean {
  if (!text || !text.trim()) return false;
  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;

  const exactTests = new Set([
    'test',
    'testing',
    'mic test',
    'test mic',
    'testing mic',
    'mic testing',
    'is mic working',
    'can you hear me',
    'can you hear me now',
    'audio test',
    'sound check',
    'mic check',
    'test 123',
    'test 1 2 3',
    'testing 123',
    'testing 1 2 3',
    'check mic',
    'check',
    'microphone test',
    'hello test',
  ]);
  if (exactTests.has(clean)) return true;

  const words = clean.split(' ');
  if (words.length <= 5) {
    if (
      (clean.includes('mic') || clean.includes('microphone') || clean.includes('sound') || clean.includes('audio')) &&
      (clean.includes('test') || clean.includes('check') || clean.includes('working') || clean.includes('fine') || clean.includes('hear'))
    ) {
      return true;
    }
    if (words[0] === 'test' || words[0] === 'testing') {
      return true;
    }
  }
  return false;
}

export const GREETING_RESPONSE = 'Hello, how can I help you?';
export const TEST_RESPONSE = 'Mic is running fine.';

export function getLocalizedGreetingResponse(text?: string, lang?: string, locale?: string): string {
  const isHi = (text && /[\u0900-\u097F]/.test(text)) || lang === 'hi' || locale?.toLowerCase().startsWith('hi');
  if (isHi) return 'नमस्ते! मैं आपकी कैसे सहायता कर सकता हूँ?';
  const isEs = lang === 'es' || locale?.toLowerCase().startsWith('es');
  if (isEs) return '¡Hola! ¿Cómo puedo ayudarte hoy?';
  const isFr = lang === 'fr' || locale?.toLowerCase().startsWith('fr');
  if (isFr) return 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?';
  const isDe = lang === 'de' || locale?.toLowerCase().startsWith('de');
  if (isDe) return 'Hallo! Wie kann ich Ihnen heute helfen?';
  return GREETING_RESPONSE;
}

export function getLocalizedTestResponse(text?: string, lang?: string, locale?: string): string {
  const isHi = (text && /[\u0900-\u097F]/.test(text)) || lang === 'hi' || locale?.toLowerCase().startsWith('hi');
  if (isHi) return 'माइक्रोफ़ोन बिल्कुल सही तरीके से काम कर रहा है।';
  const isEs = lang === 'es' || locale?.toLowerCase().startsWith('es');
  if (isEs) return 'El micrófono está funcionando perfectamente.';
  const isFr = lang === 'fr' || locale?.toLowerCase().startsWith('fr');
  if (isFr) return 'Le microphone fonctionne parfaitement.';
  const isDe = lang === 'de' || locale?.toLowerCase().startsWith('de');
  if (isDe) return 'Das Mikrofon funktioniert einwandfrei.';
  return TEST_RESPONSE;
}

/**
 * Detects meta-conversational user feedback complaining about repetition,
 * robotic scripts, or feeling stuck without solutions.
 */
export function isRepetitionComplaintMessage(userMessage: string): boolean {
  if (!userMessage || !userMessage.trim()) return false;
  const lower = userMessage.toLowerCase().trim();
  const repetitionPatterns = [
    "repeat",
    "repeating",
    "repetitive",
    "repetative",
    "replay",
    "replays",
    "same script",
    "same thing",
    "again and again",
    "stop repeating",
    "you keep saying the same",
    "not providing solution",
    "no solution",
    "give me solution",
    "give solution",
    "provide solution",
    "only saying",
    "share your feeling",
    "share your feelings",
    "i am with you",
    "stuck in",
    "stuck",
    "loop",
    "phir wahi",
    "wahi bol rahe ho",
    "wahi baat",
    "baar baar",
    "ek hi cheez",
    "kuch naya",
    "kuch alag",
    "not listening",
    "sun nahi rahe",
    "sun nahi raha",
    "you are not listening",
    "why are you repeating",
    "stop saying",
    "give me actual solution",
    "where is the solution",
    "only saying i am with you",
    "बार बार",
    "वही बोल रहे हो",
    "वही बात",
    "एक ही बात",
    "एक ही चीज़",
    "दोहरा",
    "समाधान नहीं",
    "समाधान दो",
    "समाधान बताओ",
    "कोई समाधान",
    "भावनाएं बताओ",
    "भावना बताओ",
    "सिर्फ कह रहे हो",
    "कुछ नया",
    "कुछ अलग",
    "सुन नहीं रहे",
    "सुन नहीं रहा",
    "मैं आपके साथ हूँ",
  ];
  return repetitionPatterns.some((p) => lower.includes(p));
}

/**
 * Detects explicit demands for solutions, interventions, or actions,
 * ensuring they are never misclassified as casual/neutral inquiries.
 */
export function isExplicitSolutionOrTherapyRequest(userMessage: string): boolean {
  if (!userMessage || !userMessage.trim()) return false;
  const lower = userMessage.toLowerCase().trim();
  if (isRepetitionComplaintMessage(userMessage)) return true;

  // Informational inquiries about assistant capabilities or functions are NOT clinical distress solutions
  if (/(what can you help|how can you help|what you can help|what do you do|how do you help|how does.*work|what is this app)/i.test(lower)) {
    return false;
  }

  const solutionPatterns = [
    /\b(solution|solutions|solve|how to solve|what to do|what should i do|cure|treatment|action plan|actionable|steps|give me steps|give solution|provide solution|not providing solution|no solution|stuck|fix this|advise me|need advice|repetition|repetitive|repetative|share your feeling|i am with you)\b/i,
    /\b(help me please|please help me|need help|help me out)\b/i,
    /(\b(उपाय|समाधान|मदद करो|क्या करूँ|क्या करूं|क्या करना चाहिए|रास्ता बताओ|हल बताओ|हल|सॉल्यूशन)\b)/i,
  ];
  return solutionPatterns.some((rx) => rx.test(lower));
}

export interface RepetitionSolutionResponse {
  reply: string;
  sources: Array<{ title: string; summary: string; source: string; url?: string }>;
  providerUsed: string;
  recommended_trataka: string;
}

export function getLocalizedRepetitionSolutionResponse(text?: string, lang?: string, locale?: string): RepetitionSolutionResponse {
  const isHi = (text && /[\u0900-\u097F]/.test(text)) || lang === 'hi' || locale?.toLowerCase().startsWith('hi');
  const isEs = lang === 'es' || locale?.toLowerCase().startsWith('es');
  const isFr = lang === 'fr' || locale?.toLowerCase().startsWith('fr');
  const isDe = lang === 'de' || locale?.toLowerCase().startsWith('de');

  let reply = '';
  if (isHi) {
    reply =
      "मैं आपकी बात पूरी स्पष्टता से समझ रहा हूँ। बार-बार अपनी भावनाएँ दोहराने या निष्क्रिय सहानुभूति के बजाय, आइए इस मानसिक चक्रव्यूह को तोड़ने के लिए सीधे ठोस त्रि-स्तरीय समाधान (Tri-Pillar Solution) पर कार्य करते हैं:\n\n" +
      "**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता - अध्याय 6, श्लोक 26):**\n" +
      "[GITA_SHLOKA]\n" +
      "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\n" +
      "ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥\n" +
      "[/GITA_SHLOKA]\n" +
      "• सार: जहाँ-जहाँ भी यह चंचल और अस्थिर मन भटके या बार-बार एक ही विचार चक्र में उलझे, इसे वहीं से रोककर विवेक और आत्मा के नियंत्रण में लाना चाहिए।\n" +
      "• व्यावहारिक दृष्टि: 'साक्षी भाव' अपनाएं—यह पहचानें कि विचारों का यह दोहराव केवल मन की तरंगे हैं, आप स्वयं इससे परे शांत और स्थिर हैं।\n\n" +
      "**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**\n" +
      "• संज्ञानात्मक रीफ्रेम: दोहराते विचारों को 'न्यूरोकेमिकल लूप' के रूप में पहचानें। तुरंत विचार-विराम (Thought-Stopping) करें—मन में दृढ़ता से कहें 'रुकें / रिसेट'।\n" +
      "• सोमैटिक एंकर (5-4-3-2-1): अपने तंत्रिका तंत्र को स्थिर करें—आसपास 5 वस्तुएं देखें, 4 को स्पर्श करें, 3 ध्वनियां सुनें, 2 गहरी सांसें नाभि से लें, और 1 घूंट पानी पिएं।\n\n" +
      "**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**\n" +
      "• विधि: बिंदु त्राटक (Bindu Trataka) — स्क्रीन के केंद्रीय स्वर्ण बिंदु पर 3 मिनट तक बिना पलक झपकाए स्थिर दृष्टि रखें।\n" +
      "• न्यूरो-मैकेनिज्म: आँखों की सूक्ष्म गतियों (Micro-saccades) को स्थिर करने से मस्तिष्क का तनाव केंद्र (Amygdala) शांत होता है और वेंट्रल वैगल तंत्र सक्रिय होता है।\n\n" +
      "**4. तात्कालिक व्यावहारिक कदम:**\n" +
      "• अगले 2 मिनट में अपनी शारीरिक मुद्रा बदलें: उठकर कमरे में टहलें, रीढ़ की हड्डी सीधी करें और केवल 1 छोटे कार्य को अभी पूरा करने का संकल्प लें।";
  } else if (isEs) {
    reply =
      "Te escucho con total claridad. En lugar de pedirte que repitas tus sentimientos o darte empatía pasiva, pasemos de inmediato a nuestro protocolo terapéutico de tres pilares para romper este bucle:\n\n" +
      "**1. BHAGAVAD GITA REFRAMING (Bhagavad Gita - Capítulo 6, Verso 26):**\n" +
      "[GITA_SHLOKA]\n" +
      "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\n" +
      "ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥\n" +
      "[/GITA_SHLOKA]\n" +
      "• Esencia: Dondequiera que la mente inquieta y errante se desvíe o quede atrapada en bucles repetitivos, uno debe refrenarla con paciencia y devolverla a la presencia del Ser.\n" +
      "• Acción: Practica Sakshi Bhava (la conciencia testigo): observa los pensamientos repetitivos como oleaje mental transitorio sin identificarte con ellos.\n\n" +
      "**2. CLINICAL COGNITIVE NEUROSCIENCE (TCC y Anclaje Somático):**\n" +
      "• Reestructuración cognitiva: Etiqueta la rumiación como un 'bucle neuroquímico'. Aplica la detención del pensamiento: di internamente 'Alto / Reiniciar'.\n" +
      "• Anclaje somático (5-4-3-2-1): Nombra 5 objetos que veas, 4 texturas que toques, 3 sonidos, haz 2 respiraciones diafragmáticas lentas y bebe 1 sorbo de agua.\n\n" +
      "**3. TRATAK NEURO-OCULAR PROTOCOL (Trataka Ocular):**\n" +
      "• Modo: Bindu Trataka (Punto Dorado Focal) durante 3 minutos.\n" +
      "• Neuro-mecanismo: Fijar la mirada sin parpadear detiene los micro-sacádicos oculares, reduciendo la noradrenalina y desactivando la hiperactivación de la amígdala.\n\n" +
      "**4. ACCIÓN PRÁCTICA INMEDIATA:**\n" +
      "• Rompe la inercia ahora mismo: levántate por 2 minutos, estira la espalda o escribe una única tarea concreta para los próximos 10 minutos.";
  } else if (isFr) {
    reply =
      "Je vous entends parfaitement. Plutôt que de vous demander de répéter vos ressentis ou de rester dans une empathie passive, passons immédiatement à notre protocole d'action à trois piliers pour briser cette boucle :\n\n" +
      "**1. BHAGAVAD GITA REFRAMING (Bhagavad-Gita - Chapitre 6, Verset 26):**\n" +
      "[GITA_SHLOKA]\n" +
      "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\n" +
      "ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥\n" +
      "[/GITA_SHLOKA]\n" +
      "• Essence : Partout où l'esprit agité et instable s'égare ou s'enferme dans des pensées répétitives, il convient de le ramener doucement sous la maîtrise du Soi.\n" +
      "• Action : Adoptez la posture de Sakshi Bhava (le témoin silencieux) : observez les boucles mentales sans vous y identifier.\n\n" +
      "**2. CLINICAL COGNITIVE NEUROSCIENCE (TCC & Ancrage Somatique):**\n" +
      "• Recadrage cognitif : Identifiez la rumination comme une 'boucle neurochimique'. Utilisez l'arrêt de la pensée : dites fermement 'Stop / Réinitialiser'.\n" +
      "• Ancrage somatique (5-4-3-2-1) : Observez 5 objets visibles, touchez 4 textures, écoutez 3 sons, prenez 2 respirations profondes et buvez 1 gorgée d'eau.\n\n" +
      "**3. TRATAK NEURO-OCULAR PROTOCOL (Méditation Trataka):**\n" +
      "• Mode : Bindu Trataka (Point Focal Doré) pendant 3 minutes.\n" +
      "• Neuro-mécanisme : Fixer le regard sans cligner des yeux apaise les micro-saccades oculaires, réduisant la noradrénaline et désactivant l'amygdale cérébrale.\n\n" +
      "**4. ACTION CONCRÈTE IMMÉDIATE:**\n" +
      "• Brisez l'inertie dès maintenant : levez-vous 2 minutes, étirez votre colonne vertébrale ou notez 1 tâche simple à accomplir dans les 10 prochaines minutes.";
  } else if (isDe) {
    reply =
      "Ich verstehe Sie vollkommen. Anstatt Sie aufzufordern, Ihre Gefühle erneut zu wiederholen oder bei passiver Empathie zu verharren, aktivieren wir sofort unser konkretes Drei-Säulen-Aktionsprotokoll, um diese Gedankenschleife zu durchbrechen:\n\n" +
      "**1. BHAGAVAD GITA REFRAMING (Bhagavad Gita - Kapitel 6, Vers 26):**\n" +
      "[GITA_SHLOKA]\n" +
      "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\n" +
      "ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥\n" +
      "[/GITA_SHLOKA]\n" +
      "• Essenz: Wo immer der ruhelose, flatterhafte Geist abschweift oder sich in Wiederholungen verfängt, führe ihn sanft unter die Führung des Selbst zurück.\n" +
      "• Handlung: Nehmen Sie die Haltung des Sakshi Bhava (Beobachter-Bewusstsein) ein: Betrachten Sie Gedankenschleifen als biochemisches Rauschen.\n\n" +
      "**2. CLINICAL COGNITIVE NEUROSCIENCE (KVT & Somatische Erdung):**\n" +
      "• Kognitiver Reframe: Benennen Sie das Grübeln als 'neurochemische Schleife' und stoppen Sie es aktiv: Sagen Sie innerlich 'Stopp / Reset'.\n" +
      "• Somatische Erdung (5-4-3-2-1): Nennen Sie 5 sichtbare Dinge, berühren Sie 4 Texturen, hören Sie 3 Geräusche, nehmen Sie 2 tiefe Atemzüge und trinken Sie einen Schluck Wasser.\n\n" +
      "**3. TRATAK NEURO-OCULAR PROTOCOL (Trataka-Augenmeditation):**\n" +
      "• Modus: Bindu Trataka (Goldener Fokuspunkt) für 3 Minuten.\n" +
      "• Neuro-Mechanismus: Das Fixieren des Blickes hemmt okuläre Mikrosakkaden, senkt Noradrenalin und beruhigt die Amygdala nachhaltig.\n\n" +
      "**4. SOFORTIGE HANDLUNG:**\n" +
      "• Durchbrechen Sie die Trägheit: Stehen Sie für 2 Minuten auf, lockern Sie die Schultern und erledigen Sie eine einzige kleine Aufgabe.";
  } else {
    reply =
      "I hear you completely. Instead of asking you to repeat your feelings or offering passive empathy, let us immediately shift to our concrete, actionable Tri-Pillar protocol to break this loop:\n\n" +
      "**1. BHAGAVAD GITA REFRAMING (Bhagavad Gita - Chapter 6, Verse 26):**\n" +
      "[GITA_SHLOKA]\n" +
      "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\n" +
      "ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥\n" +
      "[/GITA_SHLOKA]\n" +
      "• Essence: From wherever the restless, looping mind wanders or fixates on frustration, gently restrain it and bring it back under the steady mastery of the Self.\n" +
      "• Action: Shift into Sakshi Bhava (witness awareness). Acknowledge that the repetitive mental cycle is just cognitive noise, not your true identity.\n\n" +
      "**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**\n" +
      "• Reframe: Label repetitive rumination as a 'neurochemical feedback loop'. Interrupt the loop immediately with thought-stopping: say aloud or inwardly 'Reset / Stop'.\n" +
      "• Somatic Anchor (5-4-3-2-1): Ground your autonomic nervous system right now: name 5 things you see, 4 physical textures you can touch, 3 sounds you hear, take 2 deep diaphragmatic breaths, and take 1 sip of water.\n\n" +
      "**3. TRATAK NEURO-OCULAR PROTOCOL (Trataka Gazing):**\n" +
      "• Mode: Bindu Trataka (Sacred Golden Focal Point) for 3 minutes.\n" +
      "• Practice: Fix your gaze steadily upon the golden center point without blinking for 30–45 seconds. Halting ocular micro-saccades down-regulates locus coeruleus norepinephrine release, directly deactivating amygdala hyper-arousal.\n\n" +
      "**4. IMMEDIATE ACTION DIRECTIVE:**\n" +
      "• Break behavioural inertia now: step away from the screen for 2 minutes, stretch your spine, or write down 1 concrete, tangible task you will finish in the next 10 minutes.";
  }

  const sources = [
    {
      title: "Bhagavad Gita: Ch. 6, Verse 26 (Restless Mind & Mental Reining)",
      summary: "Reining in the wandering, agitated mind back to the Self through detached witness consciousness.",
      source: "Bhagavad Gita Library",
    },
    {
      title: "Clinical CBT: Cognitive Defusion & Thought-Stopping",
      summary: "Disrupting rumination loops via cognitive pattern interrupts and 5-4-3-2-1 sensory grounding.",
      source: "Clinical & Psychoeducational Library",
    },
    {
      title: "Tratak Neuro-Ocular: Bindu Trataka (Sacred Golden Focal Point)",
      summary: "Fixed focal gaze inhibiting ocular micro-saccades to downregulate autonomic hyper-arousal.",
      source: "Trataka Sacred Gazing Protocol",
    },
  ];

  return {
    reply,
    sources,
    providerUsed: "Tri-Pillar Active Solution Protocol",
    recommended_trataka: "bindu",
  };
}

/**
 * Detects if user input is an incomplete speech fragment, dangling pronoun, or cut-off utterance.
 * In a therapeutic setting, responding with full clinical diagnoses, Gita shlokas, and Trataka
 * to isolated fragments (e.g. "mein", "I...", "actually", "and then") is completely invalid.
 * The system must instead gently acknowledge what was heard and invite the user to finish their thought.
 */
export function isIncompleteUtterance(text: string): boolean {
  if (!text || !text.trim()) return false;
  const clean = text.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;

  // Greetings and test messages are handled by their respective dedicated fast paths
  if (isGreetingMessage(text) || isTestMessage(text)) return false;

  // Common conversational affirmations/negations that are complete short answers
  const validShortAnswers = new Set([
    'yes', 'no', 'yeah', 'yep', 'nope', 'ok', 'okay', 'sure', 'fine',
    'thanks', 'thank you', 'bye', 'goodbye', 'done', 'stop', 'help', 'help me',
    'haan', 'ha', 'nahi', 'theek hai', 'shukriya', 'dhanyawad', 'alvida',
    'si', 'sí', 'non', 'oui', 'merci', 'ja', 'nein', 'danke'
  ]);
  if (validShortAnswers.has(clean)) return false;

  const words = clean.split(' ').filter((w) => w.length > 0);

  // Single word utterances that are dangling pronouns, conjunctions, or non-substantive words
  const danglingSingleWords = new Set([
    // Hindi / Hinglish pronouns & particles
    'mein', 'main', 'mai', 'hum', 'ham', 'me', 'mujhe', 'mera', 'meri', 'mere',
    'apna', 'apni', 'apne', 'aap', 'tum', 'tu', 'woh', 'yeh', 'kuch', 'koi',
    'aur', 'lekin', 'par', 'kyunki', 'kyuki', 'toh', 'to', 'ya', 'ki', 'jaise',
    'sirf', 'bas', 'bhi', 'hi', 'ab', 'tab', 'jab', 'phir', 'fir', 'kya', 'kyun', 'kaise',
    // Devanagari Hindi
    'मैं', 'हम', 'मुझे', 'मेरा', 'मेरी', 'मेरे', 'अपना', 'अपनी', 'अपने', 'आप', 'तुम', 'तू', 'वह', 'यह', 'कुछ', 'कोई',
    'और', 'लेकिन', 'पर', 'क्योंकि', 'तो', 'या', 'कि', 'जैसे', 'सिर्फ', 'बस', 'भी', 'ही', 'अब', 'तब', 'जब', 'फिर', 'क्या', 'क्यों', 'कैसे',
    // English pronouns, conjunctions & fillers
    'i', 'im', 'i\'m', 'me', 'my', 'mine', 'myself',
    'we', 'us', 'our', 'ours',
    'you', 'your', 'yours',
    'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
    'and', 'or', 'but', 'so', 'then', 'because', 'cause', 'cuz', 'actually', 'well',
    'just', 'like', 'really', 'also', 'too', 'very', 'somewhat', 'maybe',
    'the', 'a', 'an', 'that', 'this', 'there', 'here',
    'when', 'where', 'why', 'how', 'what', 'who',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    // Spanish / French / German fragments
    'yo', 'mi', 'me', 'y', 'pero', 'je', 'moi', 'mon', 'et', 'mais', 'ich', 'mich', 'mir', 'und', 'aber'
  ]);

  // If 1 word and in dangling words list OR under 4 chars (e.g. "a", "um", "uh")
  if (words.length === 1) {
    if (danglingSingleWords.has(words[0]) || words[0].length < 4) {
      return true;
    }
  }

  // Two-word dangling phrases like "mein toh", "i was", "actually i", "and then", "mujhe laga"
  if (words.length === 2) {
    const isFirstDangling = danglingSingleWords.has(words[0]);
    const isSecondDangling = danglingSingleWords.has(words[1]);
    if (isFirstDangling && isSecondDangling) {
      return true;
    }
    const danglingVerbs = new Set([
      'feel', 'am', 'was', 'were', 'have', 'had', 'think', 'thought', 'want', 'wanted',
      'laga', 'lagaa', 'lagi', 'lage', 'lag', 'raha', 'rahi', 'rahe',
      'chahta', 'chahti', 'chahte', 'hoon', 'hun', 'tha', 'thi', 'the',
      'gaya', 'gayi', 'gaye', 'hua', 'hui', 'hue', 'karta', 'karti',
      'लगा', 'लगी', 'लगे', 'रहा', 'रही', 'रहे', 'चाहता', 'चाहती', 'हूँ', 'था', 'थी', 'थे', 'गया', 'गई', 'हुआ'
    ]);
    if (isFirstDangling && danglingVerbs.has(words[1])) {
      return true;
    }
  }

  // Any phrase with 0 substantive words (words length >= 3 not in dangling list) and total words <= 3
  const substantiveWords = words.filter((w) => w.length >= 3 && !danglingSingleWords.has(w));
  if (substantiveWords.length === 0 && words.length <= 3) {
    return true;
  }

  return false;
}

export function getLocalizedIncompleteUtteranceResponse(text?: string, lang?: string, locale?: string): string {
  const cleanSnippet = (text || '').trim().slice(0, 30);
  const isHi =
    (text && /[\u0900-\u097F]/.test(text)) ||
    (text && /\b(mein|main|mai|hum|mujhe|mera|meri|mere|aur|lekin|toh|kya|kyun|kaise)\b/i.test(text)) ||
    lang === 'hi' ||
    locale?.toLowerCase().startsWith('hi');

  if (isHi) {
    return cleanSnippet
      ? `मैंने केवल "${cleanSnippet}" सुना, शायद आपकी बात अधूरी रह गई या माइक जल्दी रुक गया। कृपया थोड़ा विस्तार से बताएं कि आप क्या महसूस कर रहे हैं, मैं ध्यान से सुन रहा हूँ।`
      : 'शायद आपकी बात अधूरी रह गई। कृपया थोड़ा विस्तार से बताएं कि आप क्या महसूस कर रहे हैं, मैं ध्यान से सुन रहा हूँ।';
  }

  const isEs = lang === 'es' || locale?.toLowerCase().startsWith('es');
  if (isEs) {
    return cleanSnippet
      ? `Solo alcancé a escuchar "${cleanSnippet}", parece que la frase quedó incompleta o el micrófono se detuvo. Cuéntame un poco más sobre lo que estás experimentando, te escucho con atención.`
      : 'Parece que tu mensaje quedó incompleto. Cuéntame con más detalle lo que sientes, te escucho con atención.';
  }

  const isFr = lang === 'fr' || locale?.toLowerCase().startsWith('fr');
  if (isFr) {
    return cleanSnippet
      ? `Je n'ai capté que "${cleanSnippet}", votre phrase semble avoir été interrompue. Pourriez-vous m'en dire un peu plus sur ce que vous ressentez ? Je vous écoute attentivement.`
      : 'Votre message semble incomplet. Dites-m\'en un peu plus sur ce que vous ressentez, je vous écoute attentivement.';
  }

  const isDe = lang === 'de' || locale?.toLowerCase().startsWith('de');
  if (isDe) {
    return cleanSnippet
      ? `Ich habe nur "${cleanSnippet}" gehört, anscheinend wurde der Satz unterbrochen. Könnten Sie mir ein wenig mehr darüber erzählen, was Sie fühlen? Ich höre aufmerksam zu.`
      : 'Ihre Nachricht scheint unvollständig zu sein. Erzählen Sie mir gerne mehr darüber, was Sie empfinden, ich höre aufmerksam zu.';
  }

  return cleanSnippet
    ? `I only caught "${cleanSnippet}", before the audio paused. Could you tell me a little more about what you're experiencing or feeling? I am listening attentively.`
    : `It seems your thought was cut off. Could you share a bit more about what you're experiencing or going through? I am listening attentively.`;
}

const STOP_WORDS = new Set([
  'what', 'this', 'that', 'with', 'from', 'your', 'have', 'they', 'will',
  'more', 'about', 'into', 'some', 'when', 'make', 'like', 'just', 'know',
  'take', 'than', 'them', 'their', 'there', 'here', 'were', 'been', 'being',
  'help', 'good', 'well', 'much', 'very', 'even', 'also', 'most', 'only',
  'does', 'doing', 'done', 'should', 'would', 'could', 'which', 'where',
  'work', 'works', 'working'
]);

/**
 * Semantic & Keyword-Weighted Matcher for Clinical Conditions
 */
export function queryPsychologyLibrary(userText: string): LibraryRAGResult | null {
  if (!userText || !userText.trim()) return null;

  // Immediate interceptor: greetings, test messages, and incomplete utterances do not warrant clinical therapy or trataka
  if (isGreetingMessage(userText) || isTestMessage(userText) || isIncompleteUtterance(userText)) {
    return null;
  }

  // Autonomous background self-learning: retrieve and index free clinical documents for new queries
  try {
    learnAndIndexQuery(userText).catch(() => {});
  } catch {
    // Non-blocking background task
  }

  let rawLower = userText.toLowerCase();
  // Pre-normalize common phonetic typos and transliterations
  rawLower = rawLower
    .replace(/\bweek\s+memory\b/g, 'weak memory')
    .replace(/\bloose\s+memory\b/g, 'lose memory')
    .replace(/\bpanick\b/g, 'panic')
    .replace(/\btierd\b/g, 'tired')
    .replace(/\bdepresed\b/g, 'depressed')
    .replace(/\bforgoting\b/g, 'forgetting');

  const words = rawLower.split(/[\s,.;:!?()]+/).filter((w) => w.length >= 3);

  let bestMatch: PsychologyCondition | null = null;
  let highestScore = 0;
  let matchedTerms: string[] = [];

  const allConditions: PsychologyCondition[] = [...PSYCHOLOGY_LIBRARY, ...DYNAMIC_LEARNED_DOCUMENTS];

  for (const condition of allConditions) {
    let score = 0;
    const currentMatched: string[] = [];

    // 1. Direct Trigger Pattern Matching (Massive weight +12)
    const triggerRegex = CLINICAL_TRIGGER_PATTERNS[condition.id];
    if (triggerRegex && triggerRegex.test(rawLower)) {
      score += 12;
      currentMatched.push(`pattern:${condition.id}`);
    }

    // 1b. Dynamic Learned Document Trigger match (+12)
    const learnedTrigger = (condition as LearnedPsychologyDocument).query_trigger;
    if (
      learnedTrigger &&
      (rawLower.includes(learnedTrigger.toLowerCase()) ||
        (rawLower.length >= 25 &&
          learnedTrigger.length >= 25 &&
          learnedTrigger.toLowerCase().includes(rawLower)))
    ) {
      score += 12;
      currentMatched.push(`learned_trigger:${condition.id}`);
    }

    // 2. Direct ID matching (+10)
    if (rawLower.includes(condition.id.replace(/_/g, ' '))) {
      score += 10;
      currentMatched.push(condition.id);
    }

    // 3. Condition Name matching (+4)
    const nameWords = condition.name.toLowerCase().split(/[\s,&]+/);
    for (const nw of nameWords) {
      if (nw.length >= 4 && !STOP_WORDS.has(nw) && words.includes(nw)) {
        score += 4;
        currentMatched.push(nw);
      }
    }

    // 4. Category matching (+3)
    const catWords = condition.category.toLowerCase().split(/[\s,&]+/);
    for (const cw of catWords) {
      if (cw.length >= 4 && !STOP_WORDS.has(cw) && words.includes(cw)) {
        score += 3;
        currentMatched.push(cw);
      }
    }

    // 5. Core Symptoms matching (+3 to +8)
    for (const symptom of condition.core_symptoms) {
      const symWords = symptom.toLowerCase().split(/\s+/);
      let symOverlap = 0;
      for (const sw of symWords) {
        if (sw.length >= 4 && !STOP_WORDS.has(sw) && words.includes(sw)) {
          symOverlap += 1;
        }
      }
      if (symOverlap >= 2) {
        score += 8;
        currentMatched.push(symptom);
      } else if (symOverlap === 1) {
        score += 3;
      }
    }

    // 6. Cognitive Distortions matching (+7)
    for (const distortion of condition.cognitive_distortions) {
      const distLower = distortion.toLowerCase();
      if (!STOP_WORDS.has(distLower) && rawLower.includes(distLower)) {
        score += 7;
        currentMatched.push(distortion);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = condition;
      matchedTerms = currentMatched;
    }
  }

  // Fallback to Neuroscience Emotion Classifier ONLY when there is actual emotional distress and sufficient context
  const hasDistressSignal = /(?:distress|anxious|anxiety|depress|sad|fear|scared|panic|stress|overwhelm|worry|worried|grief|pain|burnout|lonely|loneliness|angry|anger|trauma|shame|guilt|fail|terrif|crying|tears|breakup|heartbreak|chinta|tanaav|udas|gussa|troubled|need help|please help|help me|दर्द|रोना|रो |रोने|रोऊ|दुःख|दुख|तनाव|चिंता|उदासी|डर|घबराहट|घबरा|ब्रेकअप|परेशान|पीड़ा|कष्ट|क्रोध|अकेला|हार|असफल|टूटा)/i.test(rawLower);

  if ((!bestMatch || highestScore < 4) && words.length >= 3 && hasDistressSignal) {
    try {
      const diag = emotionClassifier.classifyText(userText);
      const dimId = diag.dimensionId || '';

      const dimensionToConditionMap: Record<string, string> = {
        anxiety: 'gad',
        fear: 'panic_dysregulation',
        horror: 'trauma_hypervigilance',
        sadness: 'major_depressive_inertia',
        anger: 'anger_frustration_dysregulation',
        disgust: 'shame_core_defectiveness',
        boredom: 'burnout_fatigue',
        awkwardness: 'social_evaluative_threat',
        confusion: 'cognitive_memory_brain_fog',
        craving: 'adhd_executive_overwhelm',
        empathic_pain: 'compassion_fatigue_caregiver',
        nostalgia: 'grief_bereavement',
      };

      const mappedId = dimensionToConditionMap[dimId];
      if (mappedId) {
        const fallbackCondition = getConditionById(mappedId);
        if (fallbackCondition) {
          bestMatch = fallbackCondition;
          highestScore = 4;
          matchedTerms = [`emotion:${dimId}`];
        }
      }
    } catch {
      // Non-matching input remains null
    }
  }

  // Threshold >= 4 enables high precision matching
  if (bestMatch && highestScore >= 4) {
    const promptSnippet = `[PSYCHOEDUCATIONAL LIBRARY EVIDENCE: ${bestMatch.name} (${bestMatch.triguna_balance})]
• Clinical CBT Reframing: ${bestMatch.solutions.cbt_reframing}
• Somatic Grounding Anchor: ${bestMatch.solutions.somatic_anchor}
• Ayurvedic Pranayama Protocol: ${bestMatch.solutions.pranayama}
• Daily Micro-Habit: ${bestMatch.solutions.micro_habit}
• Recommended Trataka Gazing Mode: ${bestMatch.recommended_trataka_mode || 'bindu'}
• Required Clinician Delivery: Acknowledge the user's emotional state, gently weave this exact CBT reframe into your response, and guide them through the somatic anchor, Trataka gazing, or pranayama breathwork.`;

    const pacer = CLINICAL_BREATHWORK_PACERS[bestMatch.id] || {
      name: 'Coherent Diaphragmatic Breath',
      inhale: 4,
      hold: 2,
      exhale: 5,
      pause: 1,
      description: 'Standard parasympathetic coherence breathing.',
    };

    const learnedDoc = bestMatch as LearnedPsychologyDocument;
    const isLearned = Boolean(learnedDoc.source_url);

    return {
      condition: bestMatch,
      matchScore: highestScore,
      matchedKeywords: matchedTerms,
      promptSnippet,
      structuredCard: {
        title: bestMatch.name,
        category: bestMatch.category,
        triguna: bestMatch.triguna_balance,
        cbtReframing: bestMatch.solutions.cbt_reframing,
        somaticAnchor: bestMatch.solutions.somatic_anchor,
        pranayama: bestMatch.solutions.pranayama,
        microHabit: bestMatch.solutions.micro_habit,
        breathCadence: pacer,
        sourceUrl: learnedDoc.source_url,
        sourcePlatform: learnedDoc.source_platform,
        isLearnedDocument: isLearned,
        recommendedTratakaMode: bestMatch.recommended_trataka_mode || 'bindu',
      },
    };
  }

  return null;
}

/**
 * Gets a condition by its unique ID (searches bundled conditions and learned documents)
 */
export function getConditionById(id: string): PsychologyCondition | undefined {
  return (
    PSYCHOLOGY_LIBRARY.find((c) => c.id === id) ||
    DYNAMIC_LEARNED_DOCUMENTS.find((c) => c.id === id)
  );
}

/**
 * Returns all available conditions in the library (bundled + dynamically learned)
 */
export function getAllConditions(): PsychologyCondition[] {
  return [...PSYCHOLOGY_LIBRARY, ...DYNAMIC_LEARNED_DOCUMENTS];
}

/**
 * Returns all dynamically self-learned psychology documents
 */
export function getAllLearnedDocuments(): LearnedPsychologyDocument[] {
  return getLearnedDocuments();
}

/**
 * Manually adds a newly learned condition to the active library
 */
export function addLearnedCondition(doc: LearnedPsychologyDocument): void {
  addLearnedDocument(doc);
}
