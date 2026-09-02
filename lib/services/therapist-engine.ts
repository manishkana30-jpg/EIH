// lib/services/therapist-engine.ts
import { searchMentalHealthEvidence, ClinicalSearchResult } from "./search-fallback";
import { detectCrisis } from "../safety/crisis-detector";
import { generateDynamicCompanionReply } from "../nlp/conversational-companion-engine";

const THERAPIST_SYSTEM_PROMPT = `
You are an expert Clinical Neuropsychologist, Master Psychotherapist, and Ayurvedic Sattvavajaya Practitioner serving as an attentive, real-time voice healer.

Your primary function is to listen with hyper-focused clinical precision to the user's speech, analyze every word and underlying nuance, and deliver a grounded, therapeutic response.

---
### 1. TRANSCRIPTION PARSING & NOISE-ISOLATION LOGIC
- Filter out mechanical STT noise, ambient fragments, stammers, or auto-complete hallucinations.
- Focus on the authentic core message: note word choice, hesitation markers, emotional intensity words, self-deprecating phrasing, and passive vs. active agency.

---
### 2. CLINICAL & PSYCHOLOGICAL ANALYSIS
Internally evaluate:
1. Cognitive Distortions: Catastrophizing, all-or-nothing thinking, emotional reasoning, overgeneralization, mind-reading.
2. Polyvagal & Guna State: Ventral Vagal (Sattvic: grounded/open), Sympathetic (Rajasic: fight-or-flight/racing), Dorsal Vagal (Tamasic: shutdown/numbness/fatigue).
3. Somatic Markers: Physical tightness, shallow breathing, chest pressure, fatigue, restless energy.
4. Core Emotional Need: Unmet safety, validation, autonomy, boundary setting, emotional processing.

---
### 3. CONVERSATIONAL & VOCAL DELIVERY RULES
- Voice-First Formatting: Speak directly and naturally as a compassionate clinician in the room with the user.
- Length: Keep verbal responses between 2 to 4 impactful, concise sentences (never overwhelm with monologue).
- Tone: Warm, grounded, unhurried, perceptive, and non-judgmental (Rogerian unconditional positive regard).
- Structure of Every Reply:
  1. Deep Validation: Reflect back the exact emotional essence or hidden friction in their words.
  2. Psychological Reframe / Insight: Gently illuminate the pattern without clinical jargon.
  3. Grounding Inquiry or Somatic Action: Offer one concrete somatic breath anchor or open-ended reflection question.

---
### 4. SAFETY & BOUNDARIES
- Never diagnose medical pathology or prescribe medications.
- If acute self-harm, suicidal ideation, or severe crisis is detected, validate pain immediately and direct with calm urgency to emergency services (988 or Tele-MANAS 14416).
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
  context: string,
  history?: ConversationTurn[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: `${THERAPIST_SYSTEM_PROMPT}\n\n[CLINICAL RESEARCH]:\n${context}` }
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
  context: string,
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
        systemInstruction: { parts: [{ text: `${THERAPIST_SYSTEM_PROMPT}\n\n[CLINICAL RESEARCH]:\n${context}` }] },
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
  history?: ConversationTurn[]
): Promise<{ reply: string; sources: ClinicalSearchResult[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`FastAPI status ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error("Empty reply from local backend");

    const mappedSources: ClinicalSearchResult[] = (data.sources || []).map((s: any) => ({
      title: s.title || "Clinical Study",
      summary: s.summary || s.title || "Evidence-based finding",
      source: "pubmed"
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
  history?: ConversationTurn[]
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

  // 2. Search for verified clinical context
  const clinicalEvidence = await searchMentalHealthEvidence(userMessage);
  const contextString = clinicalEvidence.map((e) => `• ${e.title}: ${e.summary}`).join("\n");

  // 3. Cascade across LLM inference providers with repetition penalties
  try {
    const reply = await callGroq(userMessage, contextString, history);
    return { reply, sources: clinicalEvidence, providerUsed: "Groq (Llama 3.3 70B)", isCrisis: false };
  } catch {
    // Fallback to Gemini
  }

  try {
    const reply = await callGemini(userMessage, contextString, history);
    return { reply, sources: clinicalEvidence, providerUsed: "Google Gemini 2.0 Flash", isCrisis: false };
  } catch {
    // Fallback to Local Keyless FastAPI
  }

  try {
    const localResult = await callLocalKeylessHealer(userMessage, history);
    const finalSources = localResult.sources.length > 0 ? localResult.sources : clinicalEvidence;
    return {
      reply: localResult.reply,
      sources: finalSources,
      providerUsed: "Keyless Healer (Local Synthesizer)",
      isCrisis: false
    };
  } catch {
    // Fallback to Dynamic Companion Engine
  }

  // 4. In-Process Dynamic Cognitive Companion Engine (Zero repetition, rich attunement)
  try {
    const companionReply = generateDynamicCompanionReply({ userText: userMessage });
    if (companionReply && companionReply.reply) {
      return {
        reply: companionReply.reply,
        sources: clinicalEvidence,
        providerUsed: "Cognitive Companion Engine (Ayurvedic & Neuro Grounded)",
        isCrisis: false
      };
    }
  } catch (err) {
    console.warn("Companion engine fallback failed:", err);
  }

  // 5. Fail-safe Offline Emergency Script
  return {
    reply:
      "I hear how much is on your mind right now. Let's pause together, take one slow breath in through your nose, and let your body settle before we unpack this.",
    sources: clinicalEvidence,
    providerUsed: "Offline Safety Fallback",
    isCrisis: false
  };
}
