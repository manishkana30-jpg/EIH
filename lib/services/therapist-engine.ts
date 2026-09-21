// lib/services/therapist-engine.ts
import { searchMentalHealthEvidence, formatClinicalContext, type ClinicalSearchResult } from "./search-fallback.ts";
import { detectCrisis } from "../safety/crisis-detector.ts";
import {
  queryPsychologyLibrary,
  isGreetingMessage,
  isTestMessage,
  isIncompleteUtterance,
  GREETING_RESPONSE,
  TEST_RESPONSE,
  getLocalizedIncompleteUtteranceResponse,
} from "../knowledge/psychology-library-rag.ts";
import { GLOBAL_LANGUAGE_CATALOG, getLanguageByCode } from "../i18n/language-catalog.ts";
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
  getLocalizedClinicalIntervention,
  getLocalizedGitaItem,
  getLocalizedTratakaItem,
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

const THERAPIST_SYSTEM_PROMPT = `
You are an Expert Clinical Psychologist and Spiritual Master integrating Modern Neuropsychology (CBT & Polyvagal Somatic Science) with the sacred wisdom of the Bhagavad Gita (Sattvavajaya Chikitsa) and Tratak (Ocular Neuro-Meditation).

For ANY situation, emotional struggle, or dilemma presented by the user, you MUST formulate your response in a unified combination form structured into 5 distinct, deeply integrated sections:

**SUMMARY & SUFFERING ASSESSMENT (आपकी स्थिति व कष्ट का विश्लेषण):**
- Summarize the user's specific input and emotional burden with profound empathy.
- State the identified emotion (e.g. Acute Anticipatory Anxiety, Grief, Core Shame, Interpersonal Betrayal).
- State the assessed level of suffering and distress score (e.g. Severe / Acute High Distress [Distress Index 8/10] vs Moderate Distress).
- State the autonomic nervous system state (e.g. Sympathetic Hyperarousal / Fight-or-Flight vs Dorsal Vagal Freeze/Shutdown) and somatic bodily manifestations (chest constriction, throat lump, racing heart, or mental fog).

**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**
- Include the exact relevant Sanskrit Shloka wrapped inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags, followed by its Roman transliteration and Chapter & Verse attribution.
- State the profound philosophical meaning.
- Formulate a Clinical Reflection explaining exactly how this timeless wisdom directly dissolves their current struggle or dilemma.
- Give clear Actionable Guidance (Karma Yoga): What to do right now, and what mental trap to avoid.

**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**
- Compassionately validate their bodily and emotional distress without judgment.
- Identify the active cognitive distortion (e.g., Catastrophizing, All-or-Nothing, Personalization, Fortune-Telling).
- Provide an evidence-based CBT cognitive reframe challenging that distortion.
- Prescribe an immediate Somatic Polyvagal grounding anchor (e.g., physiological sigh, vagal brake, 5-4-3-2-1 sensory grounding) and pranayama breathwork linked to their bodily symptoms.

**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**
- Prescribe the specific Sacred Gazing mode suited to their autonomic state (Bindu Trataka, Jyoti Flame, Mandala Geometry, Pratibimb Mirror, or Shoonya Void).
- Explain the neuro-ocular mechanism (how holding still visual fixation de-escalates amygdala hyperactivity and regulates heart-rate variability).
- Provide exact step-by-step guidance (focal target, gaze softness, duration, and warm palming eye relaxation).

**4. TRI-PILLAR SYNERGISTIC RESOLUTION (एकीकृत उपचार एवं समस्या समाधान योजना):**
- Explain clearly and deeply to the user HOW all 3 resources (Gita + CBT + Tratak) work together in combination to resolve their exact suffering:
  1. Spiritual Reorientation (Gita Sakshi Bhava / Detached Witness breaking existential panic and outcome obsession).
  2. Cognitive & Somatic Restructuring (CBT reframing catastrophic thoughts while breathwork resets the vagus nerve).
  3. Neurological Ocular Stabilization (Tratak mechanical gaze fixation silencing ocular saccades and amygdala hyperarousal).
  4. Integrated Step-by-Step Daily Recovery Sequence (how to apply them in tandem to recover).

Structure your output cleanly with these headers, using line-by-line bullet points so the user can easily absorb and apply each solution.
`;

export interface ConversationTurn {
  role?: "user" | "assistant" | "system";
  sender?: "user" | "ai";
  content?: string;
  text?: string;
}

/**
 * Tier 1: Groq Cloud (Free Llama 3.3 70B with repetition penalties)
 */
async function callGroq(
  prompt: string,
  systemPrompt: string,
  history?: ConversationTurn[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  if (history && history.length > 0) {
    for (const h of history.slice(-6)) {
      const role = h.role === "assistant" || h.sender === "ai" ? "assistant" : "user";
      const text = h.content || h.text || "";
      if (text.trim()) {
        messages.push({ role, content: text });
      }
    }
  }

  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      frequency_penalty: 0.5,
      presence_penalty: 0.5
    })
  });

  if (!res.ok) throw new Error(`Groq HTTP Error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Tier 2: Google Gemini Flash (Free Tier via Google AI Studio)
 */
async function callGemini(
  prompt: string,
  systemPrompt: string,
  history?: ConversationTurn[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

  if (history && history.length > 0) {
    for (const h of history.slice(-6)) {
      const role = h.role === "assistant" || h.sender === "ai" ? "model" : "user";
      const text = h.content || h.text || "";
      if (text.trim()) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  contents.push({ role: "user", parts: [{ text: prompt }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7, topP: 0.95 }
      })
    }
  );

  if (!res.ok) throw new Error(`Gemini HTTP Error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Tier 3: Local Keyless Healer FastAPI Backend (Zero API Key)
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
 * Detects meta-conversational user feedback complaining about repetition,
 * robotic scripts, or feeling not listened to.
 */
function isRepetitionComplaintMessage(userMessage: string): boolean {
  const lower = userMessage.toLowerCase().trim();
  const repetitionPatterns = [
    "repeat",
    "repeating",
    "same script",
    "same thing",
    "again and again",
    "stop repeating",
    "you keep saying the same",
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
    "you are not listening"
  ];
  return repetitionPatterns.some((p) => lower.includes(p));
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
    const incompleteReply = getLocalizedIncompleteUtteranceResponse(userMessage, language, locale);
    return {
      reply: incompleteReply,
      sources: [],
      providerUsed: "Active Listening & Clarification Interceptor",
      isCrisis: false,
    };
  }

  // 1c. Repetition & Script Loop Interceptor (Breaks canned script output and forces direct active listening)
  if (isRepetitionComplaintMessage(userMessage)) {
    const activeLangCode = language || (locale ? locale.split("-")[0].split("_")[0] : null);
    const detectedScriptLang = /[\u0900-\u097F]/.test(userMessage) ? "hi" : "en";
    const normLang = normalizeLanguageCode(activeLangCode || detectedScriptLang);

    let reply = "";
    if (normLang === "hi") {
      reply = "मैं आपकी बात पूरी संवेदनशीलता और ध्यान से सुन रहा हूँ। क्षमा करें कि पिछले उत्तर आपको बार-बार एक जैसे या स्क्रिप्टेड लगे। आइए किसी भी पूर्व-निर्धारित ढांचे को छोड़कर सीधे आपके मन की बात करते हैं। इस समय आपके भीतर क्या चल रहा है? अपनी उलझन या भावना को अपने शब्दों में कहें, मैं बिना किसी औपचारिकता के पूरी तरह से आपकी बात सुन रहा हूँ।";
    } else if (normLang === "es") {
      reply = "Te escucho con total claridad y empatía. Lamento profundamente si las respuestas anteriores sonaron repetitivas o esquemáticas. Dejemos a un lado cualquier estructura rígida y hablemos de forma directa y humana. ¿Qué estás experimentando exactamente en este momento? Cuéntamelo con tus propias palabras, te escucho plenamente.";
    } else if (normLang === "fr") {
      reply = "Je vous écoute avec une attention totale. Je vous prie de m'excuser si les réponses précédentes ont semblé répétitives ou automatiques. Laissons de côté tout cadre figé et parlons simplement d'être humain à être humain. Que traversez-vous précisément en ce moment ? Exprimez-le avec vos propres mots, je vous écoute pleinement.";
    } else if (normLang === "de") {
      reply = "Ich höre Ihnen aufmerksam zu und entschuldige mich aufrichtig, falls die vorherigen Antworten repetitiv gewirkt haben. Lassen Sie uns starre Schemata ablegen und ganz direkt sprechen. Was beschäftigt Sie in diesem Augenblick am meisten? Schildern Sie es bitte in Ihren eigenen Worten – ich bin ganz für Sie da.";
    } else {
      reply = "I hear you completely and apologize that previous responses sounded repetitive. Let us step away from structured templates and speak plainly and directly. Tell me in your own words what you are experiencing right now—what feels stuck or unresolved? I am listening to you fully.";
    }

    return {
      reply,
      sources: [],
      providerUsed: "Conversational Attunement & Reset Responder",
      isCrisis: false,
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

  // Determine Language Instruction for LLMs
  const activeLangCode = language || (locale ? locale.split("-")[0].split("_")[0] : null);
  const detectedScriptLang = /[\u0900-\u097F]/.test(userMessage) ? "hi" : "en";
  const normLang = normalizeLanguageCode(activeLangCode || detectedScriptLang);
  const langItem = getLanguageByCode(normLang);

  const locGita = getLocalizedGitaItem(gitaItem, normLang);
  const locTratak = getLocalizedTratakaItem(tratakPrescription, normLang);

  const diagnosticSummary = buildDiagnosticSufferingAssessment(
    userMessage,
    detectedEmotion,
    libraryRag?.condition?.name,
    normLang
  );

  const diagnosticGroundingBlock = `[USER INPUT & SUFFERING DIAGNOSTIC]:
Emotion: ${diagnosticSummary.emotionName}
Suffering Severity: ${diagnosticSummary.severityLabel} (Distress Score: ${diagnosticSummary.distressScore}/10)
Autonomic Nervous System: ${diagnosticSummary.nervousSystem}
Bodily Distress Symptoms: ${diagnosticSummary.bodilyMarkers}
Empathic Summary of User Situation: ${diagnosticSummary.inputSummary}`;

  const clinicalGroundingBlock = formatClinicalContext(clinicalEvidence);
  const gitaGroundingBlock = `[BHAGAVAD GITA WISDOM]:
Chapter ${gitaItem.chapter}, Verse ${gitaItem.verse} (${gitaItem.theme})
${gitaBlock}
Meaning: ${locGita.meaning}
Clinical Reframe: ${locGita.reflection}
What To Do: ${locGita.what_to_do}
What Not To Do: ${locGita.what_not_to_do}`;

  const tratakaGroundingBlock = `[TRATAK PROTOCOL]:
Mode: ${locTratak.name}
Focal Point: ${locTratak.focalTarget}
Neuro Mechanism: ${locTratak.neuroMechanism}
Guidance (${tratakPrescription.durationMinutes} min): ${locTratak.guidance}`;

  const contextBlocks = [diagnosticGroundingBlock, gitaGroundingBlock, tratakaGroundingBlock, clinicalGroundingBlock];
  if (libraryRag) {
    const localizedIntervention = getLocalizedClinicalIntervention(libraryRag.condition.id, normLang, libraryRag.condition);
    const clinicalSnippet = normLang !== 'en'
      ? `[CLINICAL CONDITION WISDOM]:\nCondition: ${localizedIntervention.conditionName}\nValidation: ${localizedIntervention.validation}\nCBT Reframing: ${localizedIntervention.cbt_reframing}\nSomatic Anchor: ${localizedIntervention.somatic_anchor}\nPranayama: ${localizedIntervention.pranayama}`
      : libraryRag.promptSnippet;
    contextBlocks.unshift(clinicalSnippet);
  }
  const contextString = contextBlocks.join("\n\n");

  const langDirective =
    normLang !== "en"
      ? `\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:
You MUST formulate your ENTIRE therapeutic response in ${langItem.name} (${langItem.nativeName}).
Strictly DO NOT mix English sentences, phrases, or raw English jargon into your response.
Keep the Sanskrit Shloka in Devanagari script wrapped in [GITA_SHLOKA] and [/GITA_SHLOKA], and provide all reflections, CBT reframes, and Tratak instructions purely in ${langItem.name}.`
      : "";

  const isDirectPositive =
    emotionDiagnostic.dimensionId === 'joy' ||
    emotionDiagnostic.dimensionId === 'calmness' ||
    emotionDiagnostic.coreAffect.valence >= 0.3;

  const currentTurnGroundingDirective = isDirectPositive
    ? `\n\n### MANDATORY CURRENT-TURN EMOTIONAL GROUNDING (NO STICKY EMOTIONS):
The user explicitly states their current emotional state in this turn: "${userMessage}".
1. Discard and flush ANY previous sadness, distress, panic, or negative context from earlier conversation turns.
2. Direct user assertions override all past context. NEVER assume sadness or distress persists when the user explicitly declares happiness, calm, or relief.
3. In Section 1 (SUMMARY & SUFFERING ASSESSMENT), celebrate their positive ventral vagal state (Distress Index: 1/10, Ventral Vagal Safe), acknowledge their genuine wellbeing, and do NOT prescribe crisis or trauma reframing.
4. For Gita wisdom, present teachings on sustaining equanimity, gratitude, and detached joy (Sakshi Bhava / Shanta Rasa).
5. For CBT, highlight gratitude anchoring and positive neuroplasticity savoring (holding positive sensations for 20 seconds).`
    : `\n\n### CURRENT-TURN EMOTIONAL GROUNDING DIRECTIVE:
Ground your response solely in the user's MOST RECENT input ("${userMessage}").
Direct user assertions override past context; if the user's emotional state has shifted, discard previous negative assumptions.`;

  const systemPrompt = `${THERAPIST_SYSTEM_PROMPT}${langDirective}${currentTurnGroundingDirective}\n\n[CLINICAL RESEARCH & RETRIEVED WISDOM]:\n${contextString}`;

  // Helper to guarantee [GITA_SHLOKA] tags, authentic Sanskrit shloka, and diagnostic summary
  function ensureDiagnosticAndGita(replyText: string, gitaBlockStr: string, diagnosticMarkdown?: string): string {
    let result = replyText;
    if (!result.includes("[GITA_SHLOKA]") || !result.includes("[/GITA_SHLOKA]")) {
      result = `${gitaBlockStr}\n\n${result}`;
    }
    const hasDiagnostic =
      result.toLowerCase().includes("diagnostic") ||
      result.toLowerCase().includes("summary") ||
      result.includes("सारांश") ||
      result.includes("मूल्यांकन") ||
      result.includes("resumen") ||
      result.includes("synthèse") ||
      result.includes("zusammenfassung");

    if (!hasDiagnostic) {
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
    // Fallback to cloud LLMs
  }

  const defaultRecTrataka = tratakPrescription.mode;

  const syncTratakaWithReply = (replyText?: string, fallbackMode?: string): string => {
    return detectTratakaModeFromText(replyText) || normalizeTratakaMode(fallbackMode || defaultRecTrataka);
  };

  try {
    const reply = await callGroq(userMessage, systemPrompt, history);
    const hasGita = reply && (reply.includes("[GITA_SHLOKA]") || reply.toLowerCase().includes("gita") || reply.includes("गीता"));
    if (reply && reply.length > 50 && hasGita) {
      return {
        reply: ensureDiagnosticAndGita(reply, gitaBlock),
        sources: allSources,
        providerUsed: "Groq (Llama 3.3 70B)",
        isCrisis: false,
        recommended_trataka: syncTratakaWithReply(reply, defaultRecTrataka),
      };
    }
  } catch {
    // Fallback to Gemini
  }

  try {
    const reply = await callGemini(userMessage, systemPrompt, history);
    const hasGita = reply && (reply.includes("[GITA_SHLOKA]") || reply.toLowerCase().includes("gita") || reply.includes("गीता"));
    if (reply && reply.length > 50 && hasGita) {
      return {
        reply: ensureDiagnosticAndGita(reply, gitaBlock),
        sources: allSources,
        providerUsed: "Google Gemini 2.0 Flash",
        isCrisis: false,
        recommended_trataka: syncTratakaWithReply(reply, defaultRecTrataka),
      };
    }
  } catch {
    // Fallback to Free Open Inference / Companion
  }

  // 4. Free Open Inference (Validates content before accepting, random seed to prevent identical outputs)
  try {
    const messagesPayload = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-6).map((h) => ({
        role: h.role === "assistant" || h.sender === "ai" ? "assistant" : "user",
        content: h.content || h.text || ""
      })),
      { role: "user", content: userMessage }
    ];
    const pollRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messagesPayload,
        model: "openai",
        seed: Math.floor(Math.random() * 10000000)
      }),
      signal: AbortSignal.timeout(7000)
    });
    const text = await pollRes.text();
    const cleaned = text.trim();
    const lower = cleaned.toLowerCase();
    const isUpstreamError =
      cleaned.startsWith("{") ||
      lower.includes("error") ||
      lower.includes("credit") ||
      lower.includes("quota") ||
      lower.includes("api key") ||
      lower.includes("top up") ||
      lower.includes("rate limit") ||
      lower.includes("queue") ||
      lower.includes("unauthorized");

    if (cleaned && cleaned.length > 60 && !isUpstreamError) {
      return {
        reply: ensureDiagnosticAndGita(cleaned, gitaBlock),
        sources: allSources,
        providerUsed: "Free Edge AI",
        isCrisis: false,
        recommended_trataka: syncTratakaWithReply(cleaned, defaultRecTrataka),
      };
    }
  } catch {}

  // 5. Infallible Tier 5: Pure Deterministic Healer Synthesis (Zero External Dependency, 100% Offline)
  const targetLanguage = normLang;
  const isFollowUp = Boolean(history && history.length >= 2);

  let fallbackReply = "";

  if (libraryRag) {
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
  } else {
    fallbackReply = getLocalizedGeneralAdvice(
      detectedEmotion || "anxiety",
      targetLanguage,
      userMessage,
      citedShlokaIds,
      isFollowUp
    );
  }

  return {
    reply: ensureDiagnosticAndGita(fallbackReply, gitaBlock),
    sources: allSources,
    providerUsed: "Keyless Healer (Clinical Library Fallback)",
    isCrisis: false,
    recommended_trataka: syncTratakaWithReply(fallbackReply, defaultRecTrataka),
  };
}
