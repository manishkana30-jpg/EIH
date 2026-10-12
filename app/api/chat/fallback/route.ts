import { NextRequest, NextResponse } from 'next/server';
import { generateTherapeuticResponse, type ConversationTurn } from '@/lib/services/therapist-engine';
import { emotionClassifier, NeuroscienceDiagnosticResult } from '@/lib/knowledge/emotion-classifier';
import {
  isGreetingMessage,
  isTestMessage,
  isIncompleteUtterance,
  isRepetitionComplaintMessage,
  getLocalizedRepetitionSolutionResponse,
  getLocalizedGreetingResponse,
  getLocalizedTestResponse,
  getLocalizedIncompleteUtteranceResponse,
  queryPsychologyLibrary,
} from '@/lib/knowledge/psychology-library-rag';
import { resolveSpokenLanguageWithGpsOverride } from '@/lib/i18n/language-catalog';
import { findGitaWisdom, GITA_LIBRARY } from '@/lib/knowledge/gita-library';
import { resolveTratakaPrescription } from '@/lib/knowledge/trataka-recommendations';
import { normalizeLanguageCode } from '@/lib/i18n/clinical-localization';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, diagnostic, history = [], language, locale } = body as {
      prompt: string;
      diagnostic?: DiagnosticInput;
      history?: Array<{ role: string; text: string }>;
      cognitiveProfile?: UserCognitiveProfile;
      language?: string;
      locale?: string;
    };

    const cleanPrompt = (prompt || '').trim();

    // Understand user spoken language and explicitly override GPS language for replying
    const spokenResolution = resolveSpokenLanguageWithGpsOverride(cleanPrompt, language, locale);
    const targetLang = normalizeLanguageCode(spokenResolution.langCode);
    const effectiveLocale = spokenResolution.speechLocale;

    if (isTestMessage(cleanPrompt)) {
      return NextResponse.json({
        reply: getLocalizedTestResponse(cleanPrompt, targetLang, effectiveLocale),
        provider: 'audio_verification',
      });
    }

    if (isGreetingMessage(cleanPrompt)) {
      return NextResponse.json({
        reply: getLocalizedGreetingResponse(cleanPrompt, targetLang, effectiveLocale),
        provider: 'conversational_empathy',
      });
    }

    if (isIncompleteUtterance(cleanPrompt)) {
      const incompleteReply = getLocalizedIncompleteUtteranceResponse(cleanPrompt, targetLang, effectiveLocale);
      return NextResponse.json({
        reply: incompleteReply,
        provider: 'active_listening_interceptor',
      });
    }

    // Anti-repetition check for user expressing frustration with canned or looped scripts
    if (isRepetitionComplaintMessage(cleanPrompt)) {
      const repRes = getLocalizedRepetitionSolutionResponse(cleanPrompt, targetLang, effectiveLocale);
      return NextResponse.json({
        reply: repRes.reply,
        sources: repRes.sources,
        provider: 'tri_pillar_active_solution',
        recommended_trataka: 'bindu',
      });
    }

    // Extract already cited Gita shlokas from history
    const citedGitaIds: string[] = [];
    if (history && history.length > 0) {
      for (const h of history) {
        const text = (h.text || '').toLowerCase();
        for (const sh of GITA_LIBRARY) {
          if (
            text.includes(sh.id.toLowerCase()) ||
            (text.includes(`chapter ${sh.chapter}`) && text.includes(`verse ${sh.verse}`)) ||
            (text.includes(`अध्याय ${sh.chapter}`) && text.includes(`${sh.verse}`)) ||
            text.includes(sh.verse)
          ) {
            if (!citedGitaIds.includes(sh.id)) citedGitaIds.push(sh.id);
          }
        }
      }
    }

    const effectiveDiag: NeuroscienceDiagnosticResult = (diagnostic as any) || emotionClassifier.classifyText(cleanPrompt);

    const libRes = queryPsychologyLibrary(cleanPrompt);
    findGitaWisdom(cleanPrompt, effectiveDiag?.dimensionId, libRes?.condition?.id, citedGitaIds);
    const tratakItem = resolveTratakaPrescription(
      cleanPrompt,
      effectiveDiag?.dimensionId,
      effectiveDiag?.polyvagalState,
      libRes?.condition?.recommended_trataka_mode
    );

    const typedHistory: ConversationTurn[] = (history || []).map((h) => ({
      role: (h.role === 'assistant' || h.role === 'system' ? h.role : 'user') as 'user' | 'assistant' | 'system',
      text: h.text,
      content: h.text,
    }));

    // Infallible Deterministic Clinical Engine: Dynamic Cognitive & Research Synthesis (100% Keyless & Offline)
    const engineRes = await generateTherapeuticResponse(cleanPrompt, typedHistory, targetLang);

    return NextResponse.json({
      reply: engineRes.reply,
      provider: engineRes.providerUsed || 'keyless_healer_deterministic',
      recommended_trataka: engineRes.recommended_trataka || tratakItem.mode,
      sources: engineRes.sources,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fallback error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
