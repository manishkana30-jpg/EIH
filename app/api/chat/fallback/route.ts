import { NextRequest, NextResponse } from 'next/server';
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
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
  getLocalizedClinicalIntervention,
  normalizeLanguageCode,
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

    const languageNames: Record<string, string> = {
      hi: 'Hindi (हिंदी)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      en: 'English',
    };

    const _langDirective = targetLang !== 'en'
      ? `\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:
You MUST formulate your ENTIRE therapeutic response in ${languageNames[targetLang] || targetLang}.
Strictly DO NOT mix English sentences, phrases, or raw English jargon into your response.`
      : '';

    const locIntervention = libRes?.condition ? getLocalizedClinicalIntervention(libRes.condition.id, targetLang, libRes.condition) : null;
    const _conditionCbtWisdom = locIntervention ? `
Matched Clinical Condition: ${locIntervention.conditionName}
Authentic CBT Reframing: ${locIntervention.cbt_reframing}` : '';

    // Infallible Deterministic Clinical Engine: Gita + Clinical CBT + Tratak (100% Keyless & Offline)
    const isFollowUp = Boolean(history && history.length >= 2);
    const fallbackReply = libRes
      ? formatHumanTherapeuticMessage(libRes.condition, targetLang, cleanPrompt, citedGitaIds, isFollowUp)
      : getLocalizedGeneralAdvice(effectiveDiag?.dimensionId || 'anxiety', targetLang, cleanPrompt, citedGitaIds, isFollowUp);

    return NextResponse.json({
      reply: fallbackReply,
      provider: 'keyless_healer_deterministic',
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
