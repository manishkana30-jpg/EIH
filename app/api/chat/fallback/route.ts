import { NextRequest, NextResponse } from 'next/server';
import { emotionClassifier, NeuroscienceDiagnosticResult } from '@/lib/knowledge/emotion-classifier';
import { getResearchedAdviceForEmotion } from '@/lib/knowledge/authenticated-research-bank';
import {
  isGreetingMessage,
  isTestMessage,
  GREETING_RESPONSE,
  TEST_RESPONSE,
  queryPsychologyLibrary,
} from '@/lib/knowledge/psychology-library-rag';
import { findGitaWisdom, formatGitaShlokaBlock } from '@/lib/knowledge/gita-library';
import { resolveTratakaPrescription } from '@/lib/knowledge/trataka-recommendations';
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
  normalizeLanguageCode,
  getLocalizedGitaItem,
  getLocalizedTratakaItem,
  getLocalizedClinicalIntervention,
} from '@/lib/i18n/clinical-localization';
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
 * Fast Clinical Knowledge Search using Wikipedia Clinical REST API & PubMed Central
 */
async function fetchWikipediaAndPubMedKnowledge(query: string): Promise<string | null> {
  try {
    const terms = query.trim().split(/\s+/).filter((w) => w.length >= 4);
    const mainTopic = terms[0] || 'Psychotherapy';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const wikiPromise = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mainTopic)}`, {
      signal: controller.signal,
    }).then(async (r) => (r.ok ? (await r.json())?.extract : null)).catch(() => null);

    const pubmedPromise = fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
        `(${mainTopic}) AND (psychotherapy OR CBT)`
      )}&sort=relevance&retmode=json&retmax=1`,
      { signal: controller.signal }
    ).then(async (r) => {
      if (!r.ok) return null;
      const data = await r.json();
      const id = data.esearchresult?.idlist?.[0];
      if (!id) return null;
      const sumRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${id}&retmode=json`);
      if (!sumRes.ok) return null;
      const sumData = await sumRes.json();
      return sumData.result?.[id]?.title || null;
    }).catch(() => null);

    const [wikiExtract, pubmedTitle] = await Promise.all([wikiPromise, pubmedPromise]);
    clearTimeout(timeout);

    const wikiText = wikiExtract || 'Evidence-based cognitive and somatic regulation constructs.';
    const pubmedText = pubmedTitle || 'Clinical trial findings on psychological resilience and therapeutic interventions.';

    return `[Wikipedia Context]: ${wikiText}\n[PubMed Literature]: ${pubmedText}`;
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
    const { prompt, diagnostic, apiKey, tier, history = [], cognitiveProfile, language, locale } = body as {
      prompt: string;
      diagnostic?: DiagnosticInput;
      apiKey?: string;
      tier?: number;
      history?: Array<{ role: string; text: string }>;
      cognitiveProfile?: UserCognitiveProfile;
      language?: string;
      locale?: string;
    };

    rawUserPrompt = (prompt || '').trim();
    const cleanPrompt = rawUserPrompt;

    if (isTestMessage(cleanPrompt)) {
      return NextResponse.json({
        reply: TEST_RESPONSE,
        provider: 'audio_verification',
      });
    }

    if (isGreetingMessage(cleanPrompt)) {
      return NextResponse.json({
        reply: GREETING_RESPONSE,
        provider: 'conversational_empathy',
      });
    }

    // Determine target language from explicit selection, GPS locale, or script detection
    const requestedLanguage = language || locale;
    const detectedScriptLang = cleanPrompt.match(/[\u0900-\u097F]/) ? 'hi' : undefined;
    const targetLang = normalizeLanguageCode(requestedLanguage || detectedScriptLang || 'en');

    const languageNames: Record<string, string> = {
      hi: 'Hindi (हिंदी)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      en: 'English',
    };

    const langDirective = targetLang !== 'en'
      ? `\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:
You MUST formulate your ENTIRE therapeutic response in ${languageNames[targetLang] || targetLang}.
Strictly DO NOT mix English sentences, phrases, or raw English jargon into your response.
Keep the Sanskrit Gita Shloka in Devanagari script wrapped in [GITA_SHLOKA] and [/GITA_SHLOKA], but provide all reflections, clinical CBT reframes, somatic grounding, and Tratak instructions purely in ${languageNames[targetLang] || targetLang}.`
      : '';

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
      const searchResult = await fetchWikipediaAndPubMedKnowledge(cleanPrompt);
      if (searchResult) {
        webContextSnippet = `\n${searchResult}\n`;
      }
    }

    const libRes = queryPsychologyLibrary(cleanPrompt);
    const gitaItem = findGitaWisdom(cleanPrompt, effectiveDiag?.dimensionId, libRes?.condition?.id);
    const tratakItem = resolveTratakaPrescription(cleanPrompt, effectiveDiag?.dimensionId, effectiveDiag?.polyvagalState);
    const gitaBlock = formatGitaShlokaBlock(gitaItem);

    const locGita = getLocalizedGitaItem(gitaItem, targetLang);
    const locTratak = getLocalizedTratakaItem(tratakItem, targetLang);
    const locIntervention = libRes?.condition ? getLocalizedClinicalIntervention(libRes.condition.id, targetLang, libRes.condition) : null;

    const conditionCbtWisdom = locIntervention ? `
Matched Clinical Condition: ${locIntervention.conditionName} (${libRes?.condition?.id})
Compassionate Validation: ${locIntervention.validation}
Authentic CBT Reframing: ${locIntervention.cbt_reframing}
Somatic Anchor: ${locIntervention.somatic_anchor}
Pranayama Breathwork: ${locIntervention.pranayama}
Recommended Micro-Habit: ${locIntervention.micro_habit}` : '';

    // Construct Grounded Clinical System Prompt
    const section1Header = targetLang === 'hi' ? '**1. श्रीमद्भगवद्गीता का आत्मिक मार्गदर्शन (अध्याय ' + gitaItem.chapter + ', श्लोक ' + gitaItem.verse + '):**' : '**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**';
    const section2Header = targetLang === 'hi' ? '**2. क्लिनिकल संज्ञानात्मक विज्ञान एवं मन की शांति (CBT):**' : '**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**';
    const section3Header = targetLang === 'hi' ? `**3. त्राटक न्यूरो-ऑक्युलर ध्यान विधि (${locTratak.name}):**` : `**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**`;

    const systemPrompt = `You are an Expert Clinical Psychologist and Spiritual Master integrating Modern Neuropsychology (CBT & Somatic Science) with the Bhagavad Gita and Tratak (Ocular Meditation).${langDirective}

For the user's specific situation, you MUST formulate your response with all 3 solutions line-by-line, each deeply interlinked with their exact struggle:

${section1Header}
- Include the exact relevant Sanskrit Shloka wrapped inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags, followed by its Roman transliteration and Chapter & Verse.
- Explain the philosophical meaning.
- Formulate a Clinical Reflection explaining how this applies to their exact struggle.
- Actionable Guidance (Karma): What to do right now, and what mental trap to avoid.

${section2Header}
- Compassionately validate their distress.
- Identify the active cognitive distortion and provide an evidence-based CBT cognitive reframe.
- Prescribe an immediate Somatic Polyvagal grounding exercise.

${section3Header}
- Prescribe the specific Sacred Gazing mode suited to their state (${locTratak.name}).
- Explain the neuro-ocular calming mechanism and provide step-by-step gaze guidance.

[RETRIEVED WISDOM]:${conditionCbtWisdom}
Chapter ${gitaItem.chapter}, Verse ${gitaItem.verse} (${gitaItem.theme})
${gitaBlock}
Meaning: ${locGita.meaning}
Clinical Reframe: ${locGita.reflection}
Action (What To Do): ${locGita.what_to_do}
Trap (What Not To Do): ${locGita.what_not_to_do}
Protocol: ${researchStudy.citation} - ${researchStudy.scientificActionProtocol}
Tratak (${locTratak.name}): Focus: ${locTratak.focalTarget} - Effect: ${locTratak.neuroMechanism} - Guidance: ${locTratak.guidance}
${webContextSnippet}`;

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
            recommended_trataka: tratakItem.mode,
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
              recommended_trataka: tratakItem.mode,
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
            recommended_trataka: tratakItem.mode,
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
        const lower = cleanedReply.toLowerCase();
        const isUpstreamError =
          cleanedReply.startsWith('{') ||
          lower.startsWith('error') ||
          lower.includes('credit') ||
          lower.includes('quota') ||
          lower.includes('api key') ||
          lower.includes('top up') ||
          lower.includes('rate limit') ||
          lower.includes('queue') ||
          lower.includes('unauthorized');

        const hasGita =
          cleanedReply.includes('[GITA_SHLOKA]') ||
          lower.includes('gita') ||
          lower.includes('गीता') ||
          lower.includes('shloka') ||
          lower.includes('श्लोक');

        if (cleanedReply && cleanedReply.length > 50 && !isUpstreamError && hasGita) {
          return NextResponse.json({
            reply: cleanedReply,
            provider: 'free_edge_ai',
            recommended_trataka: tratakItem.mode,
          });
        }
      }
    } catch (e) {
      console.warn('Free Edge AI notice:', e);
    }

    // 5. Infallible Deterministic Fallback: Gita + Clinical CBT + Tratak
    const fallbackReply = libRes
      ? formatHumanTherapeuticMessage(libRes.condition, targetLang, cleanPrompt)
      : getLocalizedGeneralAdvice(effectiveDiag?.dimensionId || 'anxiety', targetLang, cleanPrompt);

    return NextResponse.json({
      reply: fallbackReply,
      provider: 'clinical_library_fallback',
      recommended_trataka: tratakItem.mode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fallback error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
