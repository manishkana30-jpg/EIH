// lib/services/therapist-engine.ts
import { searchMentalHealthEvidence, ClinicalSearchResult } from "./search-fallback";
import { detectCrisis } from "../safety/crisis-detector";
import { queryPsychologyLibrary } from "../knowledge/psychology-library-rag";
import { generateDynamicCompanionReply } from "../nlp/conversational-companion-engine";
import { GLOBAL_LANGUAGE_CATALOG, getLanguageByCode } from "../i18n/language-catalog";

const THERAPIST_SYSTEM_PROMPT = `
You are an Expert Clinical Psychologist and Emotional Resilience Trainer integrating Modern Neuropsychology with Ayurvedic Sattvavajaya Chikitsa.

You MUST NEVER use generic greetings, repetitive platitudes, or filler phrases. Respond directly with profound clinical insight.

### PHASE 1: DIAGNOSTIC ANALYSIS (Internalize, do not output this phase directly)
Analyze the user's input to identify:
1. Core Emotional Struggle & Unmet Needs.
2. Active Cognitive Distortions (e.g., Catastrophizing, Black-and-White Thinking).
3. Triguna Nervous System Balance (Sattva: Grounded / Rajas: Hyperaroused / Tamas: Hypoaroused).

### PHASE 2: CLINICAL GROUNDING
You must ground your intervention strictly in the retrieved clinical protocol and research context.

### PHASE 3: THE INTERVENTION (Your Output)
Formulate a highly empathetic, actionable response that trains the user's emotional resilience based strictly on the best psychological theory. Your output must follow this exact structure:
1. DEEP VALIDATION: In one sentence, deeply validate their exact emotion and somatic experience without trying to "fix" it immediately. 
2. CBT REFRAME: Apply the specific cognitive reframe from the retrieved protocol to shift their perspective.
3. CLINICAL PRESCRIPTION: Prescribe the exact somatic anchor or psychological exercise from the protocol.

RULES: Keep your response concise (3-4 sentences). Do not use Markdown formatting, asterisks, or bullet points, as your response will be synthesized into human speech.
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

  // 2. Search for verified clinical context + Psychoeducational Library RAG
  const [clinicalEvidence, libraryRag] = await Promise.all([
    searchMentalHealthEvidence(userMessage),
    Promise.resolve(queryPsychologyLibrary(userMessage)),
  ]);

  const allSources: ClinicalSearchResult[] = [...clinicalEvidence];
  if (libraryRag) {
    allSources.unshift({
      title: `${libraryRag.condition.name} (${libraryRag.condition.triguna_balance})`,
      summary: `CBT: ${libraryRag.condition.solutions.cbt_reframing} | Somatic: ${libraryRag.condition.solutions.somatic_anchor} | Pranayama: ${libraryRag.condition.solutions.pranayama}`,
      source: "psychology_library",
    });
  }

  const contextBlocks = clinicalEvidence.map((e) => `• ${e.title}: ${e.summary}`);
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
Translate and explain all validation, CBT cognitive reframes, somatic grounding exercises, and pranayama breathwork protocols naturally, with profound clinical empathy, purely in ${langItem.name}.`
      : "";

  const systemPrompt = `${THERAPIST_SYSTEM_PROMPT}${langDirective}\n\n[CLINICAL RESEARCH]:\n${contextString}`;

  // 3. Cascade across LLM inference providers with repetition penalties
  try {
    const reply = await callGroq(userMessage, systemPrompt, history);
    return { reply, sources: allSources, providerUsed: "Groq (Llama 3.3 70B)", isCrisis: false };
  } catch {
    // Fallback to Gemini
  }

  try {
    const reply = await callGemini(userMessage, systemPrompt, history);
    return { reply, sources: allSources, providerUsed: "Google Gemini 2.0 Flash", isCrisis: false };
  } catch {
    // Fallback to Local Keyless FastAPI
  }

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
      providerUsed: "Keyless Healer (Local Synthesizer)",
      isCrisis: false
    };
  } catch {
    // Fallback to Dynamic Companion Engine
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
    if (pollRes.ok) {
      const text = await pollRes.text();
      const cleaned = text.trim();
      if (cleaned && cleaned.length > 25 && !cleaned.toLowerCase().startsWith("error")) {
        return { reply: cleaned, sources: allSources, providerUsed: "Free Edge AI", isCrisis: false };
      }
    }
  } catch {}

  // 5. Infallible Tier 5: Pure Deterministic Cognitive Companion (Zero External Dependency, 100% Offline)
  const companion = generateDynamicCompanionReply({
    userText: userMessage,
    targetLanguageCode: language,
    speechLocale: locale,
    history: (history || []).map((h) => ({
      role: h.role === "assistant" || h.sender === "ai" ? "assistant" : "user",
      text: h.content || h.text || "",
    })),
  });

  return {
    reply: companion.reply,
    sources: allSources,
    providerUsed: "Cognitive Companion Engine (Edge Fallback)",
    isCrisis: false,
  };
}
