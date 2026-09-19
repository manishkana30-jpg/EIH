// lib/services/therapist-engine.ts
import { searchMentalHealthEvidence, formatClinicalContext, type ClinicalSearchResult } from "./search-fallback.ts";
import { detectCrisis } from "../safety/crisis-detector.ts";
import {
  queryPsychologyLibrary,
  isGreetingMessage,
  isTestMessage,
  GREETING_RESPONSE,
  TEST_RESPONSE,
} from "../knowledge/psychology-library-rag.ts";
import { GLOBAL_LANGUAGE_CATALOG, getLanguageByCode } from "../i18n/language-catalog.ts";
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
  getLocalizedClinicalIntervention,
} from "../i18n/clinical-localization.ts";
import { findGitaWisdom, formatGitaShlokaBlock } from "../knowledge/gita-library.ts";
import { resolveTratakaPrescription } from "../knowledge/trataka-recommendations.ts";

const THERAPIST_SYSTEM_PROMPT = `
You are an Expert Clinical Psychologist and Spiritual Master integrating Modern Neuropsychology (CBT & Polyvagal Somatic Science) with the sacred wisdom of the Bhagavad Gita (Sattvavajaya Chikitsa) and Tratak (Ocular Neuro-Meditation).

For ANY situation, emotional struggle, or dilemma presented by the user, you MUST formulate your response with all 3 solutions line-by-line, each deeply and specifically interlinked with the user's situation:

**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**
- Include the exact relevant Sanskrit Shloka wrapped inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags, followed by its Roman transliteration and Chapter & Verse attribution.
- State the profound philosophical meaning.
- Formulate a Clinical Reflection explaining exactly how this timeless wisdom directly dissolves their current struggle or dilemma.
- Give clear Actionable Guidance (Karma Yoga): What to do right now, and what mental trap to avoid.

**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**
- Compassionately validate their bodily and emotional distress without judgment.
- Identify the active cognitive distortion (e.g., Catastrophizing, All-or-Nothing, Personalization, Fortune-Telling).
- Provide an evidence-based CBT cognitive reframe challenging that distortion.
- Prescribe an immediate Somatic Polyvagal grounding anchor (e.g., physiological sigh, vagal brake, 5-4-3-2-1 sensory grounding) linked to their bodily symptoms.

**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**
- Prescribe the specific Sacred Gazing mode suited to their autonomic state (Bindu Trataka, Jyoti Flame, Mandala Geometry, Pratibimb Mirror, or Shoonya Void).
- Explain the neuro-ocular mechanism (how holding still visual fixation de-escalates amygdala hyperactivity and regulates heart-rate variability).
- Provide exact step-by-step guidance (focal target, gaze softness, duration, and warm palming eye relaxation).

Structure your output cleanly with these 3 numbered headers, using line-by-line bullet points so the user can easily absorb and apply each solution.
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
      max_tokens: 300,
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
        generationConfig: { maxOutputTokens: 300, temperature: 0.7, topP: 0.95 }
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
  const timeoutId = setTimeout(() => controller.abort(), 4000);

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

  // 2. Search for verified clinical context + Psychoeducational Library RAG + Gita & Trataka
  const [clinicalEvidence, libraryRag] = await Promise.all([
    searchMentalHealthEvidence(userMessage),
    Promise.resolve(queryPsychologyLibrary(userMessage)),
  ]);

  const gitaItem = findGitaWisdom(userMessage);
  const tratakPrescription = resolveTratakaPrescription(
    userMessage,
    undefined,
    libraryRag?.condition?.triguna_balance
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

  const clinicalGroundingBlock = formatClinicalContext(clinicalEvidence);
  const gitaGroundingBlock = `[BHAGAVAD GITA WISDOM]:
Chapter ${gitaItem.chapter}, Verse ${gitaItem.verse} (${gitaItem.theme})
${gitaBlock}
Meaning: ${gitaItem.philosophical_meaning}
Clinical Reframe: ${gitaItem.clinical_reframe}
What To Do: ${gitaItem.actionable_guidance.what_to_do}
What Not To Do: ${gitaItem.actionable_guidance.what_not_to_do}`;

  const tratakaGroundingBlock = `[TRATAK PROTOCOL]:
Mode: ${tratakPrescription.name} (${tratakPrescription.sanskritName})
Focal Point: ${tratakPrescription.focalTarget}
Neuro Mechanism: ${tratakPrescription.neuroMechanism}
Guidance (${tratakPrescription.durationMinutes} min): ${tratakPrescription.stepByStepGuidance.join(" ")}`;

  const contextBlocks = [gitaGroundingBlock, tratakaGroundingBlock, clinicalGroundingBlock];
  if (libraryRag) {
    contextBlocks.unshift(libraryRag.promptSnippet);
  }
  const contextString = contextBlocks.join("\n\n");

  // Determine Language Instruction for LLMs
  const langItem = language
    ? getLanguageByCode(language) || GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === language)
    : null;

  const langDirective =
    langItem && langItem.code !== "en"
      ? `\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:
You MUST formulate your ENTIRE therapeutic response in ${langItem.name} (${langItem.nativeName}).
Strictly DO NOT mix English sentences, phrases, or raw English jargon into your response.
Keep the Sanskrit Shloka in Devanagari script, and provide all reflections, CBT reframes, and Tratak instructions purely in ${langItem.name}.`
      : "";

  const systemPrompt = `${THERAPIST_SYSTEM_PROMPT}${langDirective}\n\n[CLINICAL RESEARCH & RETRIEVED WISDOM]:\n${contextString}`;

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
      reply: localResult.reply,
      sources: finalSources,
      providerUsed: "Keyless Healer (Local Python Daemon)",
      isCrisis: false,
      recommended_trataka: (localResult as any).recommended_trataka || tratakPrescription.mode,
      triguna_analysis: (localResult as any).triguna_analysis,
    };
  } catch {
    // Fallback to cloud LLMs
  }

  const defaultRecTrataka = tratakPrescription.mode;

  try {
    const reply = await callGroq(userMessage, systemPrompt, history);
    const hasGita = reply && (reply.includes("[GITA_SHLOKA]") || reply.toLowerCase().includes("gita") || reply.includes("गीता"));
    if (reply && reply.length > 50 && hasGita) {
      return { reply, sources: allSources, providerUsed: "Groq (Llama 3.3 70B)", isCrisis: false, recommended_trataka: defaultRecTrataka };
    }
  } catch {
    // Fallback to Gemini
  }

  try {
    const reply = await callGemini(userMessage, systemPrompt, history);
    const hasGita = reply && (reply.includes("[GITA_SHLOKA]") || reply.toLowerCase().includes("gita") || reply.includes("गीता"));
    if (reply && reply.length > 50 && hasGita) {
      return { reply, sources: allSources, providerUsed: "Google Gemini 2.0 Flash", isCrisis: false, recommended_trataka: defaultRecTrataka };
    }
  } catch {
    // Fallback to Free Open Inference / Companion
  }

  // 4. Free Open Inference
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
      body: JSON.stringify({ messages: messagesPayload, model: "openai", seed: 42 }),
      signal: AbortSignal.timeout(3500)
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

      const hasGita = cleaned.includes("[GITA_SHLOKA]") || lower.includes("gita") || lower.includes("गीता");

      if (cleaned && cleaned.length > 50 && !isUpstreamError && hasGita) {
        return { reply: cleaned, sources: allSources, providerUsed: "Free Edge AI", isCrisis: false, recommended_trataka: defaultRecTrataka };
      }
  } catch {}

  // 5. Infallible Tier 5: Pure Deterministic Healer Synthesis (Zero External Dependency, 100% Offline)
  const targetLanguage =
    language ||
    locale ||
    (/[\u0900-\u097F]/.test(userMessage) ? "hi" : "en");

  let fallbackReply = "";

  if (libraryRag) {
    // 100% pure human-crafted clinical explanation in the user's chosen local language
    fallbackReply = formatHumanTherapeuticMessage(
      libraryRag.condition,
      targetLanguage,
      userMessage
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
  } else if (clinicalEvidence.length > 0) {
    const primaryEvidence = clinicalEvidence[0];
    fallbackReply = getLocalizedGeneralAdvice(primaryEvidence.title, targetLanguage, userMessage);
  } else {
    fallbackReply = getLocalizedGeneralAdvice("default", targetLanguage, userMessage);
  }

  return {
    reply: fallbackReply,
    sources: allSources,
    providerUsed: "Keyless Healer (Clinical Library Fallback)",
    isCrisis: false,
    recommended_trataka: defaultRecTrataka,
  };
}
