// lib/services/therapist-engine.ts
import { searchMentalHealthEvidence, type ClinicalSearchResult } from "./search-fallback.ts";
import { detectCrisis } from "../safety/crisis-detector.ts";
import {
  queryPsychologyLibrary,
  isGreetingMessage,
  isTestMessage,
  isIncompleteUtterance,
  isRepetitionComplaintMessage,
  isExplicitSolutionOrTherapyRequest,
  getLocalizedRepetitionSolutionResponse,
  GREETING_RESPONSE,
  TEST_RESPONSE,
  getLocalizedIncompleteUtteranceResponse,
} from "../knowledge/psychology-library-rag.ts";
import { resolveSpokenLanguageWithGpsOverride } from "../i18n/language-catalog.ts";
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
  getLocalizedClinicalIntervention,
  normalizeLanguageCode,
  buildDiagnosticSufferingAssessment,
} from "../i18n/clinical-localization.ts";
import { findGitaWisdom, formatGitaShlokaBlock, GITA_LIBRARY } from "../knowledge/gita-library.ts";
import {
  resolveTratakaPrescription,
  detectTratakaModeFromText,
  normalizeTratakaMode,
} from "../knowledge/trataka-recommendations.ts";
import { emotionClassifier } from "../knowledge/emotion-classifier.ts";


export interface ConversationTurn {
  role?: "user" | "assistant" | "system";
  sender?: "user" | "ai";
  content?: string;
  text?: string;
}

/**
 * Local Keyless Healer FastAPI Backend (Zero API Key, Local LLM/Heuristics Daemon)
 */
async function callLocalKeylessHealer(
  prompt: string,
  history?: ConversationTurn[],
  language?: string,
  locale?: string
): Promise<{ reply: string; sources: ClinicalSearchResult[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history, language, locale }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`FastAPI status ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error("Empty reply from local backend");

    const mappedSources: ClinicalSearchResult[] = (data.sources || []).map((s: any) => ({
      title: s.title || "Clinical Study",
      summary: s.summary || s.title || "Evidence-based finding",
      source: s.source || "pubmed"
    }));

    return { reply: data.reply, sources: mappedSources };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Scan prior conversation history to identify previously cited Gita Shlokas
 * so that subsequent turns present fresh wisdom instead of repeating the same verse.
 */
function extractCitedGitaIdsFromHistory(history?: ConversationTurn[]): string[] {
  if (!history || history.length === 0) return [];
  const citedIds: string[] = [];
  const allShlokas = GITA_LIBRARY;

  for (const turn of history) {
    const text = (turn.content || turn.text || "").toLowerCase();
    if (!text) continue;

    for (const shloka of allShlokas) {
      if (
        text.includes(shloka.id.toLowerCase()) ||
        (text.includes(`chapter ${shloka.chapter}`) && text.includes(`verse ${shloka.verse}`)) ||
        (text.includes(`अध्याय ${shloka.chapter}`) && text.includes(`${shloka.verse}`)) ||
        text.includes(shloka.verse)
      ) {
        if (!citedIds.includes(shloka.id)) {
          citedIds.push(shloka.id);
        }
      }
    }
  }
  return citedIds;
}


/**
 * Master Conversational Function: Search + Inference with Fallback & Anti-Looping Protection
 */
export async function generateTherapeuticResponse(
  userMessage: string,
  history?: ConversationTurn[],
  language?: string,
  locale?: string
): Promise<{
  reply: string;
  sources: ClinicalSearchResult[];
  providerUsed: string;
  isCrisis?: boolean;
  recommended_trataka?: string;
  triguna_analysis?: any;
}> {
  // 0. Accurately resolve spoken language and explicitly override GPS/locale
  const spokenResolution = resolveSpokenLanguageWithGpsOverride(userMessage, language, locale);
  const normLang = normalizeLanguageCode(spokenResolution.langCode);

  // 1. Instant Crisis Safety Interception (Zero-False-Negative)
  const crisis = detectCrisis(userMessage);
  if (crisis.isCrisis) {
    const hotlineList = (crisis.recommendedHotlines || [])
      .map((h) => `• ${h.name} (${h.region}): ${h.phone}`)
      .join("\n");
    return {
      reply: `I hear how much pain you are carrying right now, and your safety is the absolute priority. Please connect immediately with confidential, professional support:\n\n${hotlineList}\n\nYou do not have to carry this alone.`,
      sources: [],
      providerUsed: "Deterministic Crisis Safety Interceptor",
      isCrisis: true
    };
  }

  // 1b. Conversational Greeting & Mic Test Fast-Path (Single sentence responses, no clinical trataka)
  if (isTestMessage(userMessage)) {
    return {
      reply: TEST_RESPONSE,
      sources: [],
      providerUsed: "Audio Verification Protocol",
      isCrisis: false,
    };
  }

  if (isGreetingMessage(userMessage)) {
    return {
      reply: GREETING_RESPONSE,
      sources: [],
      providerUsed: "Conversational Empathy Responder",
      isCrisis: false,
    };
  }

  if (isIncompleteUtterance(userMessage)) {
    const incompleteReply = getLocalizedIncompleteUtteranceResponse(userMessage, normLang, spokenResolution.speechLocale);
    return {
      reply: incompleteReply,
      sources: [],
      providerUsed: "Active Listening & Clarification Interceptor",
      isCrisis: false,
    };
  }

  // 1c. Repetition & Script Loop Interceptor (Delivers immediate actionable Tri-Pillar solution)
  if (isRepetitionComplaintMessage(userMessage)) {
    const repRes = getLocalizedRepetitionSolutionResponse(userMessage, normLang, spokenResolution.speechLocale);
    return {
      reply: repRes.reply,
      sources: repRes.sources,
      providerUsed: "Tri-Pillar Active Solution Protocol",
      isCrisis: false,
      recommended_trataka: "bindu",
    };
  }

  // 2. Search for verified clinical context + Psychoeducational Library RAG + Gita & Trataka
  const [clinicalEvidence, libraryRag] = await Promise.all([
    searchMentalHealthEvidence(userMessage),
    Promise.resolve(queryPsychologyLibrary(userMessage)),
  ]);

  const emotionDiagnostic = emotionClassifier.classifyText(userMessage);
  const detectedEmotion = emotionDiagnostic.dimensionId;
  const conditionId = libraryRag?.condition?.id;

  const citedShlokaIds = extractCitedGitaIdsFromHistory(history);
  const gitaItem = findGitaWisdom(userMessage, detectedEmotion, conditionId, citedShlokaIds);
  const tratakPrescription = resolveTratakaPrescription(
    userMessage,
    detectedEmotion,
    emotionDiagnostic.polyvagalState || libraryRag?.condition?.triguna_balance,
    libraryRag?.condition?.recommended_trataka_mode
  );
  const gitaBlock = formatGitaShlokaBlock(gitaItem);

  const allSources: ClinicalSearchResult[] = [
    {
      title: `Bhagavad Gita: Ch. ${gitaItem.chapter}, Verse ${gitaItem.verse} (${gitaItem.theme})`,
      summary: `${gitaItem.philosophical_meaning} | Clinical Reframe: ${gitaItem.clinical_reframe}`,
      source: "gita_library" as any,
    },
    {
      title: `Tratak Neuro-Ocular: ${tratakPrescription.name}`,
      summary: `Focus: ${tratakPrescription.focalTarget} | Neuro: ${tratakPrescription.neuroMechanism}`,
      source: "trataka_protocol" as any,
    },
    ...clinicalEvidence,
  ];

  if (libraryRag) {
    allSources.splice(2, 0, {
      title: `${libraryRag.condition.name} (${libraryRag.condition.triguna_balance})`,
      summary: `CBT: ${libraryRag.condition.solutions.cbt_reframing} | Somatic: ${libraryRag.condition.solutions.somatic_anchor} | Pranayama: ${libraryRag.condition.solutions.pranayama}`,
      source: libraryRag.structuredCard?.isLearnedDocument ? "pubmed_wikipedia" : "psychology_library",
      url: libraryRag.structuredCard?.sourceUrl,
    });
  }

  // normLang resolved with full spoken language GPS override at start of handler

  const diagnosticSummary = buildDiagnosticSufferingAssessment(
    userMessage,
    detectedEmotion,
    libraryRag?.condition?.name,
    normLang
  );

  const hasDistressKeywords = /(?:distress|anxious|anxiety|depress|depressed|depression|sad|sadness|fear|scared|panic|stress|stressed|overwhelm|overwhelmed|worry|worried|grief|pain|burnout|lonely|loneliness|angry|anger|trauma|shame|guilt|fail|failed|failure|terrif|crying|tears|breakup|heartbreak|heartbroken|debt|debts|financial|burden|burdened|broke|struggling|struggle|loans|bills|hopeless|hopelessness|empty|numb|insomnia|can't sleep|cant sleep|insecure|rejection|rejected|abandoned|confused|restless|exhausted|fatigue|unmotivated|frustrated|frustration|hurting|suffering|mental problem|mental health|overthinking|racing thoughts|fight|argument|conflict|alone|nobody cares|chinta|tanaav|udas|gussa|troubled|need help|please help me|help me please|someone help me|help me i'm|help me i am|दर्द|रोना|रो |रोने|रोऊ|दुःख|दुख|तनाव|चिंता|उदासी|डर|घबराहट|घबरा|ब्रेकअप|परेशान|पीड़ा|कष्ट|क्रोध|अकेला|हार|असफल|टूटा|कर्ज|कर्जा|ऋण|बोझ|निराश|निराशा|उलझन|बेचैन|बेचैनी|थकान|थका)/i.test(userMessage);

  const hasPositiveOrCalmExplicit =
    /(happy|great|excited|peaceful|calm|relaxed|wonderful|grateful|joy|glad|blessed|good|doing well|girlfriend|boyfriend|in love|new partner|dating|promoted|celebrat|प्रसन्न|खुश|आनंद|शांत|शांति|बढ़िया|ठीक हूँ)/i.test(userMessage);

  const isDirectPositive =
    !hasDistressKeywords &&
    hasPositiveOrCalmExplicit &&
    (emotionDiagnostic.dimensionId === 'joy' ||
     emotionDiagnostic.dimensionId === 'calmness' ||
     emotionDiagnostic.dimensionId === 'romance' ||
     emotionDiagnostic.dimensionId === 'amusement' ||
     emotionDiagnostic.dimensionId === 'admiration' ||
     emotionDiagnostic.dimensionId === 'adoration' ||
     emotionDiagnostic.dimensionId === 'satisfaction' ||
     emotionDiagnostic.dimensionId === 'relief' ||
     emotionDiagnostic.dimensionId === 'awe' ||
     emotionDiagnostic.dimensionId === 'interest' ||
     emotionDiagnostic.coreAffect.valence >= 0.15);

  const isSolutionRequest = isExplicitSolutionOrTherapyRequest(userMessage);

  const isNeutralOrInquiry =
    !isSolutionRequest &&
    !hasDistressKeywords &&
    emotionDiagnostic.coreAffect.valence >= -0.05 &&
    (/^(what|how|why|who|when|where|can you|could you|explain|tell me|is this|how does|what is|नमस्ते|प्रणाम)/i.test(userMessage.trim()) ||
     ['interest', 'aesthetic_appreciation', 'calmness', 'joy', 'amusement', 'adoration', 'satisfaction', 'relief', 'awe', 'entrancement'].includes(emotionDiagnostic.dimensionId));

  const hasEmotionalDistressSignal =
    isSolutionRequest ||
    (!isNeutralOrInquiry &&
    (hasDistressKeywords ||
     (libraryRag !== null && hasDistressKeywords) ||
     emotionDiagnostic.coreAffect.valence < -0.1 ||
     (emotionDiagnostic.coreAffect.arousal > 0.55 && emotionDiagnostic.coreAffect.valence < 0.1)));

  const hasClinicalDistress =
    !isDirectPositive &&
    (isSolutionRequest || (!isNeutralOrInquiry && hasEmotionalDistressSignal));

  // Helper to guarantee [GITA_SHLOKA] tags, authentic Sanskrit shloka, and diagnostic summary only when clinical distress is present
  function ensureDiagnosticAndGita(replyText: string, gitaBlockStr: string, diagnosticMarkdown?: string): string {
    let result = replyText;
    if (hasClinicalDistress && (!result.includes("[GITA_SHLOKA]") || !result.includes("[/GITA_SHLOKA]"))) {
      if (/(\*\*1\.[^*]*\*\*:?\s*)/i.test(result)) {
        result = result.replace(/(\*\*1\.[^*]*\*\*:?\s*)/i, `$1\n${gitaBlockStr}\n`);
      } else {
        result = `${gitaBlockStr}\n\n${result}`;
      }
    }
    const hasDiagnostic =
      result.toLowerCase().includes("diagnostic") ||
      result.toLowerCase().includes("summary") ||
      result.includes("सारांश") ||
      result.includes("मूल्यांकन") ||
      result.includes("resumen") ||
      result.includes("synthèse") ||
      result.includes("zusammenfassung");

    if (hasClinicalDistress && !hasDiagnostic) {
      const diagMd = diagnosticMarkdown || diagnosticSummary.markdown;
      result = `${diagMd}\n\n${result}`;
    }
    return result;
  }

  // 3. Cascade across LLM inference providers prioritizing Local Keyless FastAPI daemon
  try {
    const localResult = await callLocalKeylessHealer(userMessage, history, language, locale);
    const finalSources = [...localResult.sources];
    if (libraryRag && !finalSources.some((s) => s.source === "psychology_library")) {
      finalSources.unshift({
        title: `${libraryRag.condition.name} (${libraryRag.condition.triguna_balance})`,
        summary: `CBT: ${libraryRag.condition.solutions.cbt_reframing} | Somatic: ${libraryRag.condition.solutions.somatic_anchor} | Pranayama: ${libraryRag.condition.solutions.pranayama}`,
        source: "psychology_library",
      });
    }
    return {
      reply: ensureDiagnosticAndGita(localResult.reply, gitaBlock),
      sources: finalSources,
      providerUsed: "Keyless Healer (Local Python Daemon)",
      isCrisis: false,
      recommended_trataka:
        detectTratakaModeFromText(localResult.reply) ||
        normalizeTratakaMode((localResult as any).recommended_trataka || tratakPrescription.mode),
      triguna_analysis: (localResult as any).triguna_analysis,
    };
  } catch {
    // Local daemon offline or unreachable: Immediately use built-in deterministic clinical synthesis (Zero External Dependency, 100% Offline)
  }

  const defaultRecTrataka = tratakPrescription.mode;

  const syncTratakaWithReply = (replyText?: string, fallbackMode?: string): string => {
    return detectTratakaModeFromText(replyText) || normalizeTratakaMode(fallbackMode || defaultRecTrataka);
  };

  // Infallible Deterministic Healer Synthesis (Zero External Dependency, 100% Offline)
  const targetLanguage = normLang;
  const isFollowUp = Boolean(history && history.length >= 2);

  let fallbackReply = "";

  if (hasClinicalDistress && libraryRag) {
    // 100% pure human-crafted clinical explanation in the user's chosen local language
    fallbackReply = formatHumanTherapeuticMessage(
      libraryRag.condition,
      targetLanguage,
      userMessage,
      citedShlokaIds,
      isFollowUp
    );

    // Also update libraryRag source with localized clinical text
    const localizedData = getLocalizedClinicalIntervention(libraryRag.condition.id, targetLanguage);
    if (allSources.length > 0 && allSources[0].source === "psychology_library") {
      allSources[0] = {
        title: `${localizedData.conditionName} (${libraryRag.condition.triguna_balance})`,
        summary: `CBT: ${localizedData.cbt_reframing} | Somatic: ${localizedData.somatic_anchor} | Pranayama: ${localizedData.pranayama}`,
        source: "psychology_library",
      };
    }
  } else if (hasClinicalDistress) {
    fallbackReply = getLocalizedGeneralAdvice(
      detectedEmotion || "anxiety",
      targetLanguage,
      userMessage,
      citedShlokaIds,
      isFollowUp
    );
  } else {
    // Non-distress conversational fallback: Keep it brief, natural, and friendly
    const isCelebratoryOrRomance = /(girlfriend|boyfriend|dating|in love|new partner|promoted|won|passed|celebrat|खुशखबरी|गर्लफ्रेंड|बॉयफ्रेंड)/i.test(userMessage);
    if (isCelebratoryOrRomance) {
      if (targetLanguage === 'hi') {
        fallbackReply = "यह तो बहुत सुंदर और सुखद बात है! नए रिश्ते की शुरुआत के लिए बहुत-बहुत बधाई। इस खास और प्यारे समय का आनंद लें—आप इस समय कैसा महसूस कर रहे हैं?";
      } else if (targetLanguage === 'es') {
        fallbackReply = "¡Qué maravillosa noticia! Muchas felicidades por esta nueva relación. Disfruta de esta hermosa etapa, ¿cómo te sientes al respecto?";
      } else if (targetLanguage === 'fr') {
        fallbackReply = "C'est une merveilleuse nouvelle ! Toutes mes félicitations pour cette nouvelle relation. Profitez de ces beaux moments—comment vous sentez-vous ?";
      } else if (targetLanguage === 'de') {
        fallbackReply = "Das sind wunderbare Neuigkeiten! Herzlichen Glückwunsch zu dieser neuen Beziehung. Genießen Sie diese schöne Zeit – wie fühlen Sie sich dabei?";
      } else {
        fallbackReply = "That is wonderful news! Congratulations on your new relationship. Enjoy this beautiful phase—how are you feeling about it?";
      }
    } else if (targetLanguage === 'hi') {
      fallbackReply = "मैं आपकी पूरी सहायता के लिए यहाँ उपस्थित हूँ। हम भगवद्गीता के दर्शन, संज्ञानात्मक सीबीटी (CBT) तकनीकों और त्राटक ध्यान के समन्वय से समाधान प्रस्तुत करते हैं। आप किस विशेष समस्या या परिस्थिति का समाधान चाहते हैं?";
    } else if (targetLanguage === 'es') {
      fallbackReply = "Estoy aquí para ayudarte con calma y presencia. Integramos la sabiduría del Bhagavad Gita, ejercicios de TCC y meditación ocular Trataka. ¿Qué situación específica te gustaría resolver hoy?";
    } else if (targetLanguage === 'fr') {
      fallbackReply = "Je suis à votre écoute pour vous aider. Nous associons la sagesse de la Bhagavad-Gita, les exercices de TCC et la méditation Trataka. Quel sujet précis aimeriez-vous aborder ?";
    } else if (targetLanguage === 'de') {
      fallbackReply = "Ich bin für Sie da, um Ihnen gezielt zu helfen. Wir verbinden die Weisheit der Bhagavad Gita, kognitive Verhaltenstherapie und Trataka-Augenmeditation. Welches Thema möchten Sie heute angehen?";
    } else {
      fallbackReply = "I am here with you, ready to help. We integrate Bhagavad Gita wisdom, clinical CBT, and Trataka eye-gazing techniques to resolve challenges. What specific situation or challenge would you like us to solve together?";
    }
  }

  return {
    reply: hasClinicalDistress ? ensureDiagnosticAndGita(fallbackReply, gitaBlock) : fallbackReply,
    sources: hasClinicalDistress ? allSources : [],
    providerUsed: hasClinicalDistress ? "Keyless Healer (Clinical Library Fallback)" : "Conversational Empathy Responder",
    isCrisis: false,
    recommended_trataka: hasClinicalDistress ? syncTratakaWithReply(fallbackReply, defaultRecTrataka) : "bindu",
  };
}
