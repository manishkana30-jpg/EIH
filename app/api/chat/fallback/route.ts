import { NextRequest, NextResponse } from 'next/server';
import { emotionClassifier, NeuroscienceDiagnosticResult } from '@/lib/knowledge/emotion-classifier';
import { getResearchedAdviceForEmotion } from '@/lib/knowledge/authenticated-research-bank';
import type { UserCognitiveProfile } from '@/lib/memory/cbt-memory-types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface DiagnosticInput {
  dimensionId?: string;
  dimensionName?: string;
  cluster?: string;
  color?: string;
  coreAffect?: { valence: number; arousal: number };
  bodilyMap?: {
    head: number;
    throat: number;
    chest: number;
    gut: number;
    arms: number;
    legs: number;
    somatic_summary: string;
  };
  semanticNeighbors?: string[];
  barrettConstruct?: string;
  somaticIntervention?: string;
  metaIntent?: string;
  intensity?: string;
  doshicState?: string;
}

/**
 * Fast Web Knowledge Search using DuckDuckGo Instant Answers API
 */
async function fetchWebKnowledge(query: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        return data.AbstractText.slice(0, 300);
      }
      if (data.Answer) {
        return data.Answer.slice(0, 300);
      }
    }
    return null;
  } catch {
    return null;
  }
}

interface ChatPayloadMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callGroqWithFallback(groqKey: string, messagesPayload: ChatPayloadMessage[]): Promise<string | null> {
  const candidateModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'];
  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: messagesPayload,
          temperature: 0.75,
          max_tokens: 300,
        }),
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return reply;
      }
    } catch (_) {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  let rawUserPrompt = '';
  try {
    const body = await req.json();
    const { prompt, diagnostic, apiKey, tier, history = [], cognitiveProfile } = body as {
      prompt: string;
      diagnostic?: DiagnosticInput;
      apiKey?: string;
      tier?: number;
      history?: Array<{ role: string; text: string }>;
      cognitiveProfile?: UserCognitiveProfile;
    };

    rawUserPrompt = (prompt || '').trim();
    const cleanPrompt = rawUserPrompt;
    const effectiveDiag: NeuroscienceDiagnosticResult = (diagnostic as any) || emotionClassifier.classifyText(cleanPrompt);
    const researchStudy = getResearchedAdviceForEmotion(effectiveDiag?.dimensionId || 'calmness');

    const userKey = apiKey?.trim() || '';
    const groqKey = userKey.startsWith('gsk_') ? userKey : process.env.GROQ_API_KEY;
    const geminiKey = userKey.startsWith('AIza') ? userKey : process.env.GEMINI_API_KEY;
    const openaiKey = userKey.startsWith('sk-') ? userKey : process.env.OPENAI_API_KEY;

    const lowerPrompt = cleanPrompt.toLowerCase();

    // Optional Live Web Search Grounding for factual, clinical, or open-ended inquiries
    let webContextSnippet = '';
    const needsSearch =
      lowerPrompt.includes('what is') ||
      lowerPrompt.includes('how to') ||
      lowerPrompt.includes('research') ||
      lowerPrompt.includes('study') ||
      lowerPrompt.includes('why') ||
      lowerPrompt.includes('meaning') ||
      cleanPrompt.endsWith('?');

    if (needsSearch) {
      const searchResult = await fetchWebKnowledge(cleanPrompt);
      if (searchResult) {
        webContextSnippet = `\n[Live Web Search Grounding Context: "${searchResult}"]\n`;
      }
    }

    // Construct Grounded Clinical System Prompt
    const systemPrompt = `You are an Expert Clinical Psychologist and Emotional Resilience Trainer integrating Modern Neuropsychology with Ayurvedic Sattvavajaya Chikitsa.

You MUST NEVER use generic greetings, repetitive platitudes, or filler phrases. Respond directly with profound clinical insight.

### PHASE 1: DIAGNOSTIC ANALYSIS (Internalize, do not output this phase directly)
Analyze the user's input to identify:
1. Core Emotional Struggle & Unmet Needs.
2. Active Cognitive Distortions (e.g., Catastrophizing, Black-and-White Thinking).
3. Triguna Nervous System Balance (Sattva: Grounded / Rajas: Hyperaroused / Tamas: Hypoaroused).

### PHASE 2: CLINICAL GROUNDING
You must ground your intervention strictly in the following retrieved clinical protocol:
[RETRIEVED_PROTOCOL]: ${researchStudy.citation} - ${researchStudy.scientificActionProtocol} | Ayurvedic: ${researchStudy.ayurvedicActionProtocol}

### PHASE 3: THE INTERVENTION (Your Output)
Formulate a highly empathetic, actionable response that trains the user's emotional resilience based strictly on the best psychological theory. Your output must follow this exact structure:
1. DEEP VALIDATION: In one sentence, deeply validate their exact emotion and somatic experience without trying to "fix" it immediately. 
2. CBT REFRAME: Apply the specific cognitive reframe from the retrieved protocol to shift their perspective.
3. CLINICAL PRESCRIPTION: Prescribe the exact somatic anchor or psychological exercise from the protocol.

RULES: Keep your response concise (3-4 sentences). Do not use Markdown formatting, asterisks, or bullet points, as your response will be synthesized into human speech.`;

    // 1. If Groq Key is provided or on Tier 2, prioritize Groq Llama 3.3 70B
    if (groqKey && (userKey.startsWith('gsk_') || tier === 2)) {
      try {
        const messagesPayload: ChatPayloadMessage[] = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((h): ChatPayloadMessage => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.text,
          })),
          { role: 'user', content: cleanPrompt },
        ];

        const reply = await callGroqWithFallback(groqKey, messagesPayload);
        if (reply) {
          return NextResponse.json({
            reply,
            provider: 'groq_llama_70b',
            tier: 2,
          });
        }
      } catch (e) {
        console.warn('Groq edge notice:', e);
      }
    }

    // 2. Prioritize Google Gemini Flash if available
    if (geminiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemPrompt },
                    ...history.slice(-4).map((h) => ({ text: `${h.role}: ${h.text}` })),
                    { text: `User: ${cleanPrompt}` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
              },
            }),
          }
        );
        clearTimeout(timeout);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidate = data.candidates?.[0];
          const reply = candidate?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return NextResponse.json({
              reply,
              provider: 'gemini_flash',
            });
          }
        }
      } catch (e) {
        console.warn('Gemini edge notice:', e);
      }
    }

    // 3. Fallback Groq if not already called
    if (groqKey) {
      try {
        const messagesPayload: ChatPayloadMessage[] = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((h): ChatPayloadMessage => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.text,
          })),
          { role: 'user', content: cleanPrompt },
        ];

        const reply = await callGroqWithFallback(groqKey, messagesPayload);
        if (reply) {
          return NextResponse.json({
            reply,
            provider: 'groq_llama_70b',
          });
        }
      } catch (e) {
        console.warn('Groq edge fallback notice:', e);
      }
    }

    // 4. Free Edge AI Model (Zero API key required)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const pollinationsMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4).map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text,
        })),
        { role: 'user', content: cleanPrompt },
      ];

      const pollinationsRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: pollinationsMessages,
          model: 'openai',
          seed: Math.floor(Math.random() * 100000),
        }),
      });
      clearTimeout(timeout);

      if (pollinationsRes.ok) {
        const text = await pollinationsRes.text();
        const cleanedReply = text.trim();
        if (cleanedReply && cleanedReply.length > 25 && !cleanedReply.toLowerCase().startsWith('error')) {
          return NextResponse.json({
            reply: cleanedReply,
            provider: 'free_edge_ai',
          });
        }
      }
    } catch (e) {
      console.warn('Free Edge AI notice:', e);
    }

    return NextResponse.json(
      { error: 'Clinical inference engines unavailable.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fallback error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
