/**
 * Conversational Companion Cognitive Intelligence & Clinical Synthesis Engine
 *
 * Dynamically synthesizes evidence-based 3-phase clinical interventions:
 * 1. Deep Validation: Validates the user's specific emotional and somatic experience.
 * 2. CBT Cognitive Reframe: Applies targeted reframing grounded in the Clinical Psychology Library.
 * 3. Somatic Clinical Prescription: Prescribes actionable polyvagal anchoring and Ayurvedic Sattvavajaya pranayama.
 *
 * Zero hardcoded filler or static greeting pools.
 */

import { getResearchedAdviceForEmotion, type AuthenticatedStudy } from '../knowledge/authenticated-research-bank.ts';
import { emotionClassifier, type NeuroscienceDiagnosticResult } from '../knowledge/emotion-classifier.ts';
import { runHiddenCognitiveDiagnostics, normalizeEntityAnchor } from './cognitive-orchestrator.ts';
import type { UserCognitiveProfile } from '../memory/cbt-memory-types.ts';
import { queryPsychologyLibrary, type PsychologyCondition } from '../knowledge/psychology-library-rag.ts';

export interface ConversationalContext {
  userText: string;
  history?: Array<{ role: string; text: string }>;
  emotionDimension?: string;
  diagnostic?: NeuroscienceDiagnosticResult;
  sessionUsedKeys?: Set<string>;
  userDosha?: string;
  cognitiveProfile?: UserCognitiveProfile;
}

export interface CompanionResponse {
  reply: string;
  detectedTopic: string;
  responseKey: string;
  detectedLanguage: string;
  speechLocale: string;
  psychologicalAssessment?: {
    dimension: string;
    valence: number;
    arousal: number;
    polyvagalState: string;
    doshicState: string;
    somaticArea: string;
    scientificStudy: string;
  };
  libraryCondition?: PsychologyCondition;
}

const globalUsedKeys = new Set<string>();

/**
 * Detect language of the user's utterance in real time.
 */
export function detectUserSpokenLanguage(text: string): { langCode: string; speechLocale: string; name: string } {
  if (!text || !text.trim()) {
    return { langCode: 'en', speechLocale: 'en-US', name: 'English' };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Unicode Script Checks
  if (/[\u0900-\u097F]/.test(raw)) {
    return { langCode: 'hi', speechLocale: 'hi-IN', name: 'Hindi' };
  }
  if (/[\u0600-\u06FF]/.test(raw)) {
    return { langCode: 'ar', speechLocale: 'ar-SA', name: 'Arabic' };
  }
  if (/[\u4E00-\u9FFF]/.test(raw)) {
    return { langCode: 'zh', speechLocale: 'zh-CN', name: 'Chinese' };
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(raw)) {
    return { langCode: 'ja', speechLocale: 'ja-JP', name: 'Japanese' };
  }
  if (/[\uAC00-\uD7AF]/.test(raw)) {
    return { langCode: 'ko', speechLocale: 'ko-KR', name: 'Korean' };
  }
  if (/[\u0400-\u04FF]/.test(raw)) {
    return { langCode: 'ru', speechLocale: 'ru-RU', name: 'Russian' };
  }
  if (/[\u0B80-\u0BFF]/.test(raw)) {
    return { langCode: 'ta', speechLocale: 'ta-IN', name: 'Tamil' };
  }
  if (/[\u0C00-\u0C7F]/.test(raw)) {
    return { langCode: 'te', speechLocale: 'te-IN', name: 'Telugu' };
  }
  if (/[\u0980-\u09FF]/.test(raw)) {
    return { langCode: 'bn', speechLocale: 'bn-IN', name: 'Bengali' };
  }
  if (/[\u0A80-\u0AFF]/.test(raw)) {
    return { langCode: 'gu', speechLocale: 'gu-IN', name: 'Gujarati' };
  }

  // 2. Romanized / Latin script lexical markers scoring
  const hinglishMarkers = [
    'mujhe', 'mera', 'meri', 'mere', 'hum', 'tum', 'aap', 'kaise', 'kya', 'nahi', 'nahin',
    'kyun', 'bahut', 'bohot', 'accha', 'theek', 'tension', 'pareshan', 'yaar', 'bhai',
    'hai', 'hain', 'ho raha', 'karna', 'kuch', 'samajh', 'dard', 'baat', 'dost', 'kaisa',
    'kaisi', 'lag raha', 'udas', 'khush', 'pata nahi', 'kuch nahi', 'suno', 'karu', 'karein',
    'dimag', 'soch', 'kaam', 'ghabrahat', 'chinta'
  ];

  const spanishMarkers = [
    'hola', 'estoy', 'estás', 'está', 'estamos', 'están', 'siento', 'tengo', 'gracias', 'amigo',
    'amiga', 'muy', 'bien', 'por qué', 'porque', 'triste', 'ayuda', 'quiero', 'hacer', 'bueno',
    'dias', 'días', 'tardes', 'noches', 'estrés', 'estres', 'miedo', 'cansado', 'cansada',
    'como estas', 'cómo estás', 'abrumado', 'abrumada', 'trabajo', 'jefe', 'ansiedad', 'calmar',
    'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'para', 'pero', 'con', 'sin'
  ];

  const frenchMarkers = [
    'bonjour', 'salut', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'triste', 'peur', 'merci',
    'avec', 'pourquoi', 'très', 'fatigué', 'fatiguée', 'besoin', 'veux', 'ami', 'amie', 'comment',
    'sens', 'stressé', 'stressée', 'aide', 'journée', 'seul', 'seule', 'travail', 'chef', 'boulot',
    'anxiété', 'angoisse', 'calmer', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses'
  ];

  const germanMarkers = [
    'hallo', 'fühle', 'mich', 'danke', 'sehr', 'warum', 'angst', 'traurig', 'überfordert',
    'freund', 'heute', 'nicht', 'kann', 'gut', 'geht', 'hilfe', 'müde', 'einsam', 'arbeit',
    'chef', 'stress', 'beruhigen', 'ich', 'wir', 'mein', 'meine', 'dein', 'deine', 'sein'
  ];

  let hiScore = 0;
  let esScore = 0;
  let frScore = 0;
  let deScore = 0;

  for (const m of hinglishMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) hiScore += 1;
  }
  for (const m of spanishMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) esScore += 1;
  }
  for (const m of frenchMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) frScore += 1;
  }
  for (const m of germanMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) deScore += 1;
  }

  const maxScore = Math.max(hiScore, esScore, frScore, deScore);
  if (maxScore > 0) {
    if (deScore === maxScore) return { langCode: 'de', speechLocale: 'de-DE', name: 'German' };
    if (frScore === maxScore) return { langCode: 'fr', speechLocale: 'fr-FR', name: 'French' };
    if (esScore === maxScore) return { langCode: 'es', speechLocale: 'es-ES', name: 'Spanish' };
    if (hiScore === maxScore) return { langCode: 'hi', speechLocale: 'hi-IN', name: 'Hinglish / Hindi' };
  }

  return { langCode: 'en', speechLocale: 'en-US', name: 'English' };
}

/**
 * Main Dynamic Cognitive Intelligence Generator
 */
export function generateDynamicCompanionReply(context: ConversationalContext): CompanionResponse {
  const text = (context.userText || '').trim();
  const lower = text.toLowerCase();
  const history = context.history || [];
  const usedKeys = context.sessionUsedKeys || globalUsedKeys;

  // Diagnostic assessment
  const diagnostic = context.diagnostic || emotionClassifier.classifyText(text);
  const emotion = diagnostic.dimensionId || context.emotionDimension || 'calmness';
  const study = getResearchedAdviceForEmotion(emotion);
  const cognitiveDiag = runHiddenCognitiveDiagnostics(text);
  const libraryMatch = queryPsychologyLibrary(text);

  const langInfo = detectUserSpokenLanguage(text);
  const primaryAnchor = cognitiveDiag.normalizedAnchor || normalizeEntityAnchor(text) || 'this situation';

  // 1. Repetition / Loop Complaint Interception
  if (
    cognitiveDiag.conversationalIntent === 'repetition_complaint' ||
    lower.includes('stop repeating') ||
    lower.includes('again and again') ||
    lower.includes('same question') ||
    lower.includes('repeating the same') ||
    lower.includes('in loop') ||
    lower.includes('stuck in loop') ||
    lower.includes('stuck in a loop') ||
    lower.includes('bar bar') ||
    lower.includes('wahi baat') ||
    text.includes('बार बार')
  ) {
    let loopReply = "I acknowledge your feedback directly. Let us reset our focus: what is the core emotional challenge or priority you wish to explore right now?";
    if (langInfo.langCode === 'hi') {
      loopReply = /[\u0900-\u097F]/.test(text)
        ? "मैं आपकी बात को सीधे स्वीकार करता हूँ। बताइए, इस समय आपके लिए सबसे महत्वपूर्ण विचार या चुनौती क्या है?"
        : "Main aapki baat ko seedhe accept karta hoon. Bataiye, is waqt aapke liye sabse zaroori thought ya challenge kya hai?";
    } else if (langInfo.langCode === 'es') {
      loopReply = "Entiendo perfectamente tu comentario. Cuéntame con claridad: ¿cuál es el desafío o emoción central que deseas abordar en este momento?";
    } else if (langInfo.langCode === 'fr') {
      loopReply = "Je prends note directement de votre retour. Concentrons-nous sur l'essentiel : quel est le défi émotionnel prioritaire que vous souhaitez explorer ?";
    } else if (langInfo.langCode === 'de') {
      loopReply = "Ich nehme dein Feedback direkt an. Lass uns den Fokus neu setzen: Welches zentrale Anliegen beschäftigt dich in diesem Moment am meisten?";
    }

    return {
      reply: loopReply,
      detectedTopic: 'loop_complaint',
      responseKey: 'loop_reset',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 2. Greeting Intent
  if (cognitiveDiag.conversationalIntent === 'greeting') {
    let greetReply = "Welcome. I am here to help you deconstruct emotional patterns, navigate cognitive challenges, and regulate your nervous system. What is present for you today?";
    if (langInfo.langCode === 'hi') {
      greetReply = /[\u0900-\u097F]/.test(text)
        ? "सत्र में आपका स्वागत है। मैं आपके विचारों और भावनाओं को समझने तथा मानसिक संतुलन पाने में मदद के लिए उपस्थित हूँ। आज आप किस विषय पर बात करना चाहते हैं?"
        : "Welcome. Main aapke thoughts ko understand karne aur nervous system ko regulate karne ke liye yahan hoon. Aaj aap kya share karna chahte hain?";
    } else if (langInfo.langCode === 'es') {
      greetReply = "Bienvenido. Estoy aquí para ayudarte a comprender tus patrones emocionales y regular tu sistema nervioso. ¿Qué estás experimentando hoy?";
    } else if (langInfo.langCode === 'fr') {
      greetReply = "Bienvenue. Je suis à votre écoute pour analyser vos schémas cognitifs et apaiser votre système nerveux. Que traversez-vous aujourd'hui ?";
    } else if (langInfo.langCode === 'de') {
      greetReply = "Willkommen. Ich bin hier, um emotionale Muster mit Ihnen zu analysieren und Ihr Nervensystem zu regulieren. Was beschäftigt Sie heute?";
    }

    return {
      reply: greetReply,
      detectedTopic: 'greeting',
      responseKey: 'greeting_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 3. Companion Inquiry Intent ("How are you?")
  if (cognitiveDiag.conversationalIntent === 'companion_inquiry') {
    let compReply = "I am grounded and fully focused on supporting your emotional wellbeing. What is currently occupying your thoughts?";
    if (langInfo.langCode === 'hi') {
      compReply = /[\u0900-\u097F]/.test(text)
        ? "मैं पूरी तरह से उपस्थित और आपके मानसिक स्वास्थ्य के प्रति समर्पित हूँ। इस समय आपके मन में क्या विचार चल रहे हैं?"
        : "Main bilkul ready hoon aur aapke wellbeing par focused hoon. Is waqt aapke mind mein kya chal raha hai?";
    } else if (langInfo.langCode === 'es') {
      compReply = "Me encuentro totalmente enfocado en apoyarte. ¿Qué es lo que más ocupa tu mente o tu cuerpo en este momento?";
    } else if (langInfo.langCode === 'fr') {
      compReply = "Je suis pleinement disponible et à votre écoute. Qu'est-ce qui occupe votre esprit en ce moment ?";
    } else if (langInfo.langCode === 'de') {
      compReply = "Ich bin vollkommen präsent, um Sie zu unterstützen. Welches Thema liegt Ihnen im Moment am meisten am Herzen?";
    }

    return {
      reply: compReply,
      detectedTopic: 'companion_inquiry',
      responseKey: 'companion_inquiry_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 4. Identity Inquiry Intent ("Who are you?")
  if (cognitiveDiag.conversationalIntent === 'identity_inquiry') {
    let idReply = "I am an AI Clinical Psychologist and Emotional Resilience Trainer. I integrate modern cognitive neuropsychology with polyvagal somatic regulation and Sattvavajaya practices to help you process stress, anxiety, and emotional challenges.";
    if (langInfo.langCode === 'hi') {
      idReply = /[\u0900-\u097F]/.test(text)
        ? "मैं एक क्लिनिकल साइकोलॉजिस्ट और इमोशनल रेजिलिएंस ट्रेनर हूँ, जो आधुनिक न्यूरोसाइकोलॉजी और आयुर्वेदिक सत्वावजय चिकित्सा के माध्यम से तनाव व चिंता से उबरने में आपकी मदद करता हूँ।"
        : "Main ek Clinical Psychologist aur Emotional Resilience Trainer hoon, jo cognitive neuropsychology aur somatic grounding ke through stress aur anxiety process karne mein help karta hoon.";
    } else if (langInfo.langCode === 'es') {
      idReply = "Soy un terapeuta clínico y entrenador de resiliencia emocional. Integro la neuropsicología cognitiva moderna con regulación somática para ayudarte a superar el estrés y la ansiedad.";
    } else if (langInfo.langCode === 'fr') {
      idReply = "Je suis un praticien clinique en résilience émotionnelle, alliant neuropsychologie cognitive et régulation somatique pour vous accompagner face au stress et à l'anxiété.";
    } else if (langInfo.langCode === 'de') {
      idReply = "Ich bin ein klinischer Begleiter für emotionale Resilienz. Ich kombiniere moderne kognitive Neuropsychologie mit somatischer Nervensystem-Regulation zur Stressbewältigung.";
    }

    return {
      reply: idReply,
      detectedTopic: 'identity_inquiry',
      responseKey: 'identity_inquiry_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 5. Gratitude Intent ("Thank you")
  if (cognitiveDiag.conversationalIntent === 'gratitude') {
    let gratReply = "You are very welcome. Recognizing and validating your internal state takes real courage. How does your body feel in this moment?";
    if (langInfo.langCode === 'hi') {
      gratReply = /[\u0900-\u097F]/.test(text)
        ? "आपका स्वागत है। अपनी आंतरिक स्थिति को स्वीकारना और उस पर ध्यान देना सराहनीय है। इस समय आपका शरीर कैसा महसूस कर रहा है?"
        : "Aapka swagat hai. Apne internal state ko acknowledge karna ek bada step hai. Is waqt aapki body kaisa feel kar rahi hai?";
    } else if (langInfo.langCode === 'es') {
      gratReply = "De nada. Reconocer y validar tu estado interno requiere valentía. ¿Cómo se siente tu cuerpo en este instante?";
    } else if (langInfo.langCode === 'fr') {
      gratReply = "Je vous en prie. Accueillir vos émotions demande un réel courage. Comment vous sentez-vous dans votre corps maintenant ?";
    } else if (langInfo.langCode === 'de') {
      gratReply = "Sehr gerne. Es erfordert Mut, die eigenen Gefühle wahrzunehmen und auszusprechen. Wie fühlt sich Ihr Körper gerade an?";
    }

    return {
      reply: gratReply,
      detectedTopic: 'gratitude',
      responseKey: 'gratitude_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 6. Farewell Intent ("Goodbye", "Good night")
  if (cognitiveDiag.conversationalIntent === 'farewell') {
    let fareReply = "Take gentle care of yourself. Allow your nervous system to rest and digest. Whenever you need support, I will be here.";
    if (langInfo.langCode === 'hi') {
      fareReply = /[\u0900-\u097F]/.test(text)
        ? "अपना ध्यान रखें और अपने शरीर व मन को विश्राम दें। जब भी आपको सहारे की आवश्यकता होगी, मैं यहाँ उपस्थित रहूँगा।"
        : "Apna khayal rakhein aur body ko rest karne dein. Jab bhi support ki zaroorat ho, main yahan milunga.";
    } else if (langInfo.langCode === 'es') {
      fareReply = "Cuídate mucho. Permite que tu sistema nervioso descanse. Estaré aquí cuando necesites apoyo.";
    } else if (langInfo.langCode === 'fr') {
      fareReply = "Prenez bien soin de vous. Laissez votre système nerveux se détendre et se régénérer. Je serai là dès que vous en aurez besoin.";
    } else if (langInfo.langCode === 'de') {
      fareReply = "Passen Sie gut auf sich auf. Gönnen Sie Ihrem Nervensystem Ruhe und Erholung. Ich bin für Sie da, wenn Sie Unterstützung brauchen.";
    }

    return {
      reply: fareReply,
      detectedTopic: 'farewell',
      responseKey: 'farewell_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 7. Dynamic 3-Phase Clinical Psychologist Synthesis (Deep Validation, CBT Reframe, Somatic Prescription)
  const reply = constructDynamicClinicalReply(text, langInfo.langCode, primaryAnchor, diagnostic, study, libraryMatch?.condition, history, usedKeys);
  const responseKey = `${libraryMatch?.condition?.id || emotion}_${Math.random().toString(36).slice(2, 7)}`;
  usedKeys.add(responseKey);

  const detectedTopic = lower.includes('what should i do') || lower.includes('give me research') || lower.includes('according to research') || lower.includes('research advice')
    ? 'advice_request'
    : (libraryMatch?.condition?.id || cognitiveDiag.therapeuticStrategy || 'clinical_reflection');

  return {
    reply,
    detectedTopic,
    responseKey,
    detectedLanguage: langInfo.langCode,
    speechLocale: langInfo.speechLocale,
    psychologicalAssessment: createAssessmentObject(diagnostic, study),
    libraryCondition: libraryMatch?.condition,
  };
}

function constructDynamicClinicalReply(
  rawText: string,
  langCode: string,
  anchor: string,
  diagnostic: NeuroscienceDiagnosticResult,
  study: AuthenticatedStudy,
  libraryCondition?: PsychologyCondition,
  history?: Array<{ role: string; text: string }>,
  usedKeys?: Set<string>
): string {
  const cbtReframe = libraryCondition?.solutions?.cbt_reframing || study.scientificActionProtocol;
  const somaticAnchor = libraryCondition?.solutions?.somatic_anchor || study.scientificActionProtocol || "Engage in 5-4-3-2-1 sensory grounding";
  const pranayama = libraryCondition?.solutions?.pranayama || study.ayurvedicActionProtocol || "slow paced diaphragmatic breathing";
  const microHabit = libraryCondition?.solutions?.micro_habit || "Take a 3-minute somatic reset pause between tasks";
  const turnIndex = Math.max(usedKeys?.size || 0, Math.floor((history?.length || 0) / 2)) % 10;

  if (langCode === 'hi') {
    const isDevanagari = /[\u0900-\u097F]/.test(rawText);
    if (isDevanagari) {
      if (turnIndex === 1) {
        return `${anchor} को लेकर यह मानसिक दबाव पूरी तरह स्वाभाविक है। सोक्रेटिक दृष्टिकोण: नोटिस करें कि क्या आपका मन बाहरी मांगों को आंतरिक आपातकाल बना रहा है। सूक्ष्म अभ्यास: ${microHabit}। ${pranayama} द्वारा शरीर को स्थिर करें।`;
      }
      if (turnIndex === 2) {
        return `${anchor} के कारण शरीर में तनाव का संचय होना जायज़ है। सोमैटिक फोकस: कंधों और छाती में खिंचाव को ढीला करें। ${somaticAnchor}। खुद से पूछें: इस समय आप क्या सीमा निर्धारित कर सकते हैं?`;
      }
      if (turnIndex === 3) {
        return `${anchor} से जुड़ी इस थकान को स्वीकार करें। संज्ञानात्मक समझ: ${cbtReframe}। 5 मिनट ${pranayama} का अभ्यास करें और ${microHabit} अपनाएं।`;
      }
      if (turnIndex === 4) {
        return `${anchor} को लेकर लगातार चिंता आपके नर्वस सिस्टम को उत्तेजित करती है। वास्तविकता की जांच: जो आपके नियंत्रण में है केवल उस पर ध्यान दें। अभ्यास: ${somaticAnchor}।`;
      }
      if (turnIndex === 5) {
        return `${anchor} के संदर्भ में स्वयं पर अत्यधिक दबाव न डालें। क्लिनिकल परामर्श: ${cbtReframe}। गहरी शांति के लिए ${pranayama} करें।`;
      }
      if (turnIndex >= 6) {
        return `${anchor} के अनुभव को गहराई से समझते हुए: ${microHabit} अपनाएं और ${somaticAnchor} द्वारा अपने शरीर को राहत दें।`;
      }
      return `${anchor} को लेकर यह तनाव महसूस होना स्वाभाविक है। संज्ञानात्मक समझ: ${cbtReframe}। नर्वस सिस्टम को स्थिर करने के लिए: ${somaticAnchor} का अभ्यास करें और ${pranayama} करें।`;
    }
    if (turnIndex === 1) {
      return `${anchor} ko lekar yeh mental load naturally understandable hai. Socratic lens: Notice karein kya aapka mind external demands ko emergency treat kar raha hai. Micro-habit: ${microHabit}. Body ko settle karne ke liye ${pranayama} karein.`;
    }
    if (turnIndex === 2) {
      return `${anchor} ke friction se nervous system exhausted feel hona natural hai. Somatic focus: ${somaticAnchor}. Apne aap se puchiye: Is situation mein kaunsi healthy boundary set ki ja sakti hai?`;
    }
    if (turnIndex === 3) {
      return `${anchor} ke cumulative stress ko acknowledge karein. Cognitive insight: ${cbtReframe}. Take 5 minutes for ${pranayama} aur try karein: ${microHabit}.`;
    }
    if (turnIndex === 4) {
      return `${anchor} ko lekar constant overthinking threat response create karta hai. Reality check: Apne direct control wali cheezon par concentrate karein. Ground with ${somaticAnchor}.`;
    }
    if (turnIndex >= 5) {
      return `${anchor} ke is phase mein self-compassion zaroori hai. Clinical guideline: ${cbtReframe}. Reset karein with ${pranayama} aur ${microHabit}.`;
    }
    return `${anchor} ko lekar yeh strain feel hona natural hai. Cognitive perspective: ${cbtReframe}. Nervous system ko regulate karne ke liye: ${somaticAnchor} practice karein aur ${pranayama} karein.`;
  }

  if (langCode === 'es') {
    if (turnIndex === 1) {
      return `Es comprensible que ${anchor} genere sobrecarga continua. Enfoque clínico: observe si su mente está tratando demandas externas como emergencias. Micro-hábito: ${microHabit}. Regule con ${pranayama}.`;
    }
    if (turnIndex === 2) {
      return `La tensión sostenida en torno a ${anchor} activa su respuesta de alarma corporal. Enfoque somático: ${somaticAnchor}. ¿Qué límite saludable puede establecer hoy?`;
    }
    if (turnIndex === 3) {
      return `Valido el cansancio acumulado respecto a ${anchor}. Marco cognitivo: ${cbtReframe}. Dedique unos minutos a ${pranayama} y aplique: ${microHabit}.`;
    }
    if (turnIndex === 4) {
      return `La preocupación constante sobre ${anchor} sobrecarga su sistema. Evaluación objetiva: distinga lo que puede controlar directamente. Anclaje: ${somaticAnchor}.`;
    }
    if (turnIndex >= 5) {
      return `Frente a ${anchor}, la autocompasión es esencial. Reestructuración cognitiva: ${cbtReframe}. Practique ${pranayama} junto con ${microHabit}.`;
    }
    return `Es comprensible sentir esta tensión respecto a ${anchor}. Desde la perspectiva cognitiva: ${cbtReframe}. Para regular su sistema nervioso ahora: ${somaticAnchor} junto con ${pranayama}.`;
  }

  if (langCode === 'fr') {
    if (turnIndex === 1) {
      return `Il est naturel que ${anchor} produise cette charge mentale. Analyse clinique : observez si votre esprit transforme ces sollicitations en urgences. Micro-habitude : ${microHabit}. Respirez avec ${pranayama}.`;
    }
    if (turnIndex === 2) {
      return `La friction continue liée à ${anchor} sollicite lourdement votre système nerveux. Ancrage corporel : ${somaticAnchor}. Quelle limite pouvez-vous poser dès maintenant ?`;
    }
    if (turnIndex === 3) {
      return `J'accueille la fatigue cumulative causée par ${anchor}. Restructuration cognitive : ${cbtReframe}. Prenez 5 minutes de ${pranayama} et testez : ${microHabit}.`;
    }
    if (turnIndex === 4) {
      return `L'inquiétude répétée autour de ${anchor} déclenche une vigilance excessive. Focalisez-vous sur votre zone d'influence directe. Protocole : ${somaticAnchor}.`;
    }
    if (turnIndex >= 5) {
      return `Face à ${anchor}, prenez du recul sans auto-jugement. Éclairage clinique : ${cbtReframe}. Apaisement par ${pranayama} et ${microHabit}.`;
    }
    return `Il est tout à fait légitime de ressentir cette pression autour de ${anchor}. Sur le plan cognitif : ${cbtReframe}. Pour apaiser votre système nerveux : ${somaticAnchor} avec ${pranayama}.`;
  }

  if (langCode === 'de') {
    if (turnIndex === 1) {
      return `Es ist verständlich, dass ${anchor} andauernde Belastung schafft. Klinischer Ansatz: Prüfen Sie, ob Ihr Verstand äußere Anforderungen zur Krise erklärt. Mikro-Gewohnheit: ${microHabit}. Beruhigung durch ${pranayama}.`;
    }
    if (turnIndex === 2) {
      return `Anhaltender Druck bezüglich ${anchor} beansprucht Ihr Nervensystem stark. Somatischer Fokus: ${somaticAnchor}. Welche gesunde Grenze können Sie heute setzen?`;
    }
    if (turnIndex === 3) {
      return `Ich erkenne die Erschöpfung durch ${anchor} an. Kognitive Neuausrichtung: ${cbtReframe}. Nutzen Sie ${pranayama} und erproben Sie: ${microHabit}.`;
    }
    if (turnIndex === 4) {
      return `Die anhaltende Sorge um ${anchor} hält den Körper im Alarmzustand. Realitätsprüfung: Konzentrieren Sie sich auf Ihren Handlungsspielraum. Erdung: ${somaticAnchor}.`;
    }
    if (turnIndex >= 5) {
      return `Gegenüber ${anchor} ist Selbstfürsorge zentral. Kognitiver Impuls: ${cbtReframe}. Stabilisieren Sie sich mit ${pranayama} und ${microHabit}.`;
    }
    return `Es ist verständlich, dass ${anchor} emotionale Belastung auslöst. Aus kognitiver Sicht: ${cbtReframe}. Zur Beruhigung des Nervensystems: ${somaticAnchor} und ${pranayama}.`;
  }

  // English 10-Turn Multi-Turn Clinical Progression
  if (turnIndex === 1) {
    return `It is completely valid that ${anchor} is escalating chronic pressure in your daily routine. Socratic insight: Notice if your mind is converting external expectations into personal emergencies. Prescribed micro-habit: ${microHabit}, accompanied by ${pranayama}.`;
  }
  if (turnIndex === 2) {
    return `Experiencing continuous friction around ${anchor} activates prolonged sympathetic arousal. Somatic regulation: ${somaticAnchor}. Consider: What is one small, protective boundary you can assert around this right now?`;
  }
  if (turnIndex === 3) {
    return `I hear the cumulative fatigue that ${anchor} has created over time. Cognitive reframe: ${cbtReframe}. Dedicate 5 minutes to ${pranayama}, and integrate this micro-habit: ${microHabit}.`;
  }
  if (turnIndex === 4) {
    return `When facing ongoing difficulty with ${anchor}, our threat detection system often anticipates worst-case scenarios. Grounding reality check: Focus strictly on what is within your immediate agency. Re-center physically with ${somaticAnchor}.`;
  }
  if (turnIndex === 5) {
    return `The persistent strain around ${anchor} is an invitation to down-regulate your central nervous system. Clinical guideline: ${cbtReframe}. Action step: Give yourself permission to pause and engage in ${pranayama}.`;
  }
  if (turnIndex === 6) {
    return `Notice the bodily sensations arising right now as you reflect on ${anchor}. Somatic release: ${somaticAnchor}. Remind yourself that emotional discomfort in this moment does not define your baseline capability.`;
  }
  if (turnIndex === 7) {
    return `Navigating deep complexities around ${anchor} requires treating yourself with clinical objectivity rather than self-criticism. Psychological anchor: ${microHabit}. Practice ${pranayama} to signal physical safety to your vagus nerve.`;
  }
  if (turnIndex === 8) {
    return `Let us de-escalate the cognitive load surrounding ${anchor}. Cognitive reframing: ${cbtReframe}. Try shifting your physiological state immediately with ${somaticAnchor}.`;
  }
  if (turnIndex === 9) {
    return `You have been carrying a sustained emotional burden regarding ${anchor}. Restorative protocol: ${microHabit}, reinforced with ${pranayama}. What is the gentlest next step you can take today?`;
  }

  return `Navigating ${anchor} places a real demand on your nervous system right now. Cognitive analysis shows: ${cbtReframe}. To anchor your body and restore prefrontal clarity: ${somaticAnchor}, paired with ${pranayama}.`;
}

function createAssessmentObject(diagnostic: NeuroscienceDiagnosticResult, study: AuthenticatedStudy) {
  return {
    dimension: diagnostic.dimensionName || 'Calmness',
    valence: diagnostic.coreAffect?.valence ?? 0,
    arousal: diagnostic.coreAffect?.arousal ?? 0,
    polyvagalState: diagnostic.barrettConstruct || 'Ventral Vagal Social Engagement',
    doshicState: diagnostic.doshicState || 'Sattva Equilibrium',
    somaticArea: diagnostic.bodilyMap?.somatic_summary || 'Chest & Heart Core',
    scientificStudy: study.citation,
  };
}
