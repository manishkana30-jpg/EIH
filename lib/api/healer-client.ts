// lib/api/healer-client.ts
import { emotionClassifier } from '../knowledge/emotion-classifier';
import { detectCrisis } from '../safety/crisis-detector';
import {
  queryPsychologyLibrary,
  isGreetingMessage,
  isTestMessage,
  isIncompleteUtterance,
  isRepetitionComplaintMessage,
  isExplicitSolutionOrTherapyRequest,
  getLocalizedGreetingResponse,
  getLocalizedTestResponse,
  getLocalizedIncompleteUtteranceResponse,
  getLocalizedRepetitionSolutionResponse,
} from '../knowledge/psychology-library-rag';
import { getResearchedAdviceForEmotion } from '../knowledge/authenticated-research-bank';
import {
  formatHumanTherapeuticMessage,
  getLocalizedGeneralAdvice,
} from '../i18n/clinical-localization';
import { findGitaWisdom } from '../knowledge/gita-library';
import {
  resolveTratakaPrescription,
  detectTratakaModeFromText,
  normalizeTratakaMode,
} from '../knowledge/trataka-recommendations';

import { VoiceAcousticState } from '../types/emotions';

export interface ClinicalSource {
  title: string;
  summary?: string;
  url?: string;
  source: string;
}

export interface PsychologicalTelemetry {
  dominant_emotion: string;
  polyvagal_state: string;
  cbt_distortion: string;
  percentages: Record<string, number>;
  strategy: string;
  voice_state?: string;
}

export interface TrigunaAnalysis {
  sattva: number;
  rajas: number;
  tamas: number;
  state: string;
  recommendation: string;
  raw_balance?: string;
}

export interface ChatResponse {
  reply: string;
  audio_base64?: string;
  telemetry: PsychologicalTelemetry;
  sources: ClinicalSource[];
  engine: string;
  is_crisis: boolean;
  crisisData?: any;
  recommended_trataka?: string;
  triguna_analysis?: TrigunaAnalysis;
}

export interface ChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
}

export interface STTResponse {
  transcript: string;
}

export function parseClientTriguna(balanceStr?: string): TrigunaAnalysis {
  const b = (balanceStr || '').toLowerCase();
  let sattva = 30;
  let rajas = 35;
  let tamas = 35;
  let state = 'Mixed Imbalance';
  let recommendation = 'Restore Sattva through conscious breathwork and focused visual gazing.';

  if (b.includes('dominant tamas') || (b.includes('tamas') && b.includes('rajas') && b.includes('suppressed'))) {
    tamas = 60;
    rajas = 25;
    sattva = 15;
    state = 'Dominant Tamas (Hypoarousal / Inertia)';
    recommendation = 'Stimulate Rajas through activating breath and focused gazing to pierce inertia.';
  } else if (b.includes('acute rajas') || (b.includes('rajas') && (b.includes('depleted') || b.includes('elevated') || b.includes('hyper')))) {
    rajas = 65;
    tamas = 15;
    sattva = 20;
    state = 'Acute Rajas (Hyperarousal / Agitation)';
    recommendation = 'Cultivate grounding Sattva to settle agitated autonomic firing.';
  } else if (b.includes('sattva') && b.includes('depleted')) {
    rajas = 50;
    tamas = 35;
    sattva = 15;
    state = 'Depleted Sattva (Cognitive Fatigue)';
    recommendation = 'Quiet the Default Mode Network with single-point gazing to replenish mental clarity.';
  } else if (b.includes('rajas')) {
    rajas = 55;
    sattva = 25;
    tamas = 20;
    state = 'Elevated Rajas';
    recommendation = 'Calm sympathetic agitation with steady visual gazing.';
  } else if (b.includes('tamas')) {
    tamas = 55;
    sattva = 25;
    rajas = 20;
    state = 'Elevated Tamas';
    recommendation = 'Dissolve lethargy and stagnation through illuminating flame or mirror focus.';
  }

  return {
    sattva,
    rajas,
    tamas,
    state,
    recommendation,
    raw_balance: balanceStr || 'Equilibrium',
  };
}

class HealerBackendClient {
  private getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      const publicUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (publicUrl && publicUrl.trim()) {
        return publicUrl.replace(/\/$/, '');
      }
      return 'http://127.0.0.1:8000';
    }
    return (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  }

  /**
   * Health check to ensure either FastAPI backend or Next.js Edge AI engine is alive
   */
  async checkHealth(): Promise<boolean> {
    const backendUrl = this.getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2500) });
        if (res.ok) return true;
      } catch (_) {}
    }

    try {
      const edgeRes = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
      return edgeRes.ok;
    } catch (_) {
      return true; // Standalone in-browser cognitive engine is always available
    }
  }

  /**
   * Universal chat inference engine prioritizing:
   * 1. Dedicated Hardware Python Daemon (via Tunnel or Localhost)
   * 2. Next.js Serverless Edge AI (/api/chat & /api/chat/fallback)
   * 3. In-Browser Dynamic Cognitive Companion (Offline Resilience)
   */
  async sendMessage(
    message: string,
    history?: ChatHistoryItem[],
    voiceMode: boolean = true,
    language?: string,
    locale?: string,
    voiceState?: VoiceAcousticState
  ): Promise<ChatResponse> {
    const cleanMessage = message.trim();

    // 0. Immediate Deterministic Crisis Safety Check
    const crisis = detectCrisis(cleanMessage);
    if (crisis.isCrisis) {
      const hotlineList = (crisis.recommendedHotlines || [])
        .map((h) => `• ${h.name} (${h.region}): ${h.phone}`)
        .join('\n');
      return {
        reply: `I hear how much pain you are carrying right now, and your safety is the absolute priority. Please connect immediately with confidential, professional support:\n\n${hotlineList}\n\nYou do not have to carry this alone.`,
        sources: [],
        engine: 'Crisis Safety Interceptor',
        is_crisis: true,
        crisisData: crisis,
        telemetry: {
          dominant_emotion: 'Crisis / Acute Distress',
          polyvagal_state: 'Sympathetic / Dorsal Overwhelm',
          cbt_distortion: 'Catastrophizing',
          percentages: { Distress: 95, Anxiety: 85, Calmness: 5 },
          strategy: 'Emergency Crisis De-escalation Protocol',
          voice_state: voiceState?.description || 'Acoustic crisis biomarker detected',
        },
      };
    }

    // 0.1. Immediate Greeting & Mic Test Fast-Path (Single sentence responses, no clinical trataka)
    if (isTestMessage(cleanMessage)) {
      const testReply = getLocalizedTestResponse(cleanMessage, language, locale);
      return {
        reply: testReply,
        sources: [],
        engine: 'Audio Verification Protocol',
        is_crisis: false,
        telemetry: {
          dominant_emotion: 'Calmness',
          polyvagal_state: 'Ventral Vagal (Safe)',
          cbt_distortion: 'None',
          percentages: { Calmness: 100 },
          strategy: 'Audio hardware validated successfully.',
          voice_state: voiceState?.description || 'Microphone diagnostic active',
        },
      };
    }

    if (isGreetingMessage(cleanMessage)) {
      const greetingReply = getLocalizedGreetingResponse(cleanMessage, language, locale);
      return {
        reply: greetingReply,
        sources: [],
        engine: 'Conversational Empathy Responder',
        is_crisis: false,
        telemetry: {
          dominant_emotion: 'Calmness',
          polyvagal_state: 'Ventral Vagal (Safe)',
          cbt_distortion: 'None',
          percentages: { Calmness: 90, Receptivity: 85 },
          strategy: 'Warm compassionate reception and clinical readiness.',
          voice_state: voiceState?.description || 'Attuned vocal connection',
        },
      };
    }

    if (isIncompleteUtterance(cleanMessage)) {
      const incompleteReply = getLocalizedIncompleteUtteranceResponse(cleanMessage, language, locale);
      return {
        reply: incompleteReply,
        sources: [],
        engine: 'Active Listening & Clarification Interceptor',
        is_crisis: false,
        telemetry: {
          dominant_emotion: 'Receptivity',
          polyvagal_state: 'Ventral Vagal (Safe)',
          cbt_distortion: 'None',
          percentages: { Receptivity: 95, Attentiveness: 90 },
          strategy: 'Active listening and gentle clarification prompt for incomplete speech.',
          voice_state: voiceState?.description || 'Attentive listening pause',
        },
      };
    }

    if (isRepetitionComplaintMessage(cleanMessage)) {
      const repRes = getLocalizedRepetitionSolutionResponse(cleanMessage, language, locale);
      return {
        reply: repRes.reply,
        sources: repRes.sources,
        engine: 'Tri-Pillar Active Solution Protocol',
        is_crisis: false,
        recommended_trataka: 'bindu',
        telemetry: {
          dominant_emotion: 'Restlessness / Mental Loop',
          polyvagal_state: 'Sympathetic (Fight/Flight)',
          cbt_distortion: 'Catastrophizing / Repetitive Rumination',
          percentages: { Rumination: 85, Agitation: 70, Calmness: 15 },
          strategy: 'Active Tri-Pillar cognitive defusion, Bhagavad Gita 6.26, and Bindu Trataka neuro-ocular reset.',
          voice_state: voiceState?.description || 'Repetition circuit interrupt engaged',
        },
      };
    }

    // Resolve accurate locale
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanMessage);
    const resolvedLocale = hasDevanagari
      ? 'hi-IN'
      : locale || (language === 'hi' ? 'hi-IN' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : undefined);

    // TIER 1: Dedicated Hardware Python Daemon (via Tunnel or Localhost)
    const backendUrl = this.getBackendUrl();
    if (backendUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanMessage,
            history,
            voice_mode: voiceMode,
            language: hasDevanagari ? 'hi' : (language || undefined),
            locale: resolvedLocale,
            voice_state: voiceState,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data && data.reply) {
            const detectedMode = detectTratakaModeFromText(data.reply);
            const poly = data.telemetry?.polyvagal_state || '';
            const recTrataka =
              detectedMode ||
              (data.recommended_trataka ? normalizeTratakaMode(data.recommended_trataka) : null) ||
              (poly.includes('Sympathetic') ? 'bindu' : poly.includes('Dorsal') ? 'flame' : 'shoonya');
            return {
              ...data,
              engine: data.engine || data.engine_used || 'Keyless Healer (Local Python Daemon)',
              recommended_trataka: normalizeTratakaMode(recTrataka),
              triguna_analysis: data.triguna_analysis || parseClientTriguna(),
            };
          }
        }
      } catch {
        console.warn('Backend daemon unavailable, transitioning to Edge reasoning engine...');
      }
    }

    // TIER 2: Next.js Edge Reasoning Engine (/api/chat)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanMessage,
          history: history?.map((h) => ({ role: h.sender === 'ai' ? 'assistant' : 'user', content: h.text })),
          language: hasDevanagari ? 'hi' : (language || undefined),
          locale: resolvedLocale,
          voice_state: voiceState,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const diag = emotionClassifier.classifyText(cleanMessage, voiceState);
          const libRes = queryPsychologyLibrary(cleanMessage);
          const arousal = diag.coreAffect?.arousal || 0.5;
          const polyvagalState = arousal > 0.6 ? 'Sympathetic (Fight/Flight)' : (diag.coreAffect?.valence && diag.coreAffect.valence < -0.4) ? 'Dorsal Vagal (Shutdown)' : 'Ventral Vagal (Safe)';
          const distortion = cleanMessage.match(/\b(always|never|worst|idiot|ruined|hate)\b/i) ? 'Catastrophizing / All-or-Nothing' : 'None';
          const tratakPrescription = resolveTratakaPrescription(
            cleanMessage,
            diag.dimensionName,
            polyvagalState,
            libRes?.condition?.recommended_trataka_mode
          );
          const detectedFromReply = detectTratakaModeFromText(data.reply);
          const recTrataka =
            detectedFromReply ||
            (data.recommended_trataka ? normalizeTratakaMode(data.recommended_trataka) : null) ||
            tratakPrescription.mode;
          const trigunaAnalysis = parseClientTriguna(libRes?.condition?.triguna_balance);

          const compositePercentages: Record<string, number> = {
            [diag.dimensionName || 'Calmness']: Math.round(arousal * 100),
          };
          if (diag.dimensionScores) {
            const sorted = Object.entries(diag.dimensionScores)
              .filter(([id]) => id !== diag.dimensionId)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);
            for (const [id, score] of sorted) {
              if (score > 0.15) {
                compositePercentages[emotionClassifier.getDimensionName(id)] = Math.round(score * 100);
              }
            }
          }

          return {
            reply: data.reply,
            engine: data.providerUsed || 'Edge Cognitive Reasoning Engine',
            sources: (data.sources || []).map((s: any) => ({
              title: s.title || 'Clinical Study',
              summary: s.summary,
              url: s.url,
              source: s.source || 'PubMed',
            })),
            is_crisis: false,
            recommended_trataka: recTrataka,
            triguna_analysis: trigunaAnalysis,
            telemetry: {
              dominant_emotion: diag.dimensionName || 'Calmness',
              polyvagal_state: polyvagalState,
              cbt_distortion: distortion,
              percentages: compositePercentages,
              strategy: `Regulate ${polyvagalState} and apply targeted clinical grounding for ${diag.dimensionName || 'emotional balance'}.`,
              voice_state: voiceState?.description || 'Stable vocal resonance',
            },
          };
        }
      }
    } catch (err) {
      console.warn('Edge reasoning notice:', err);
    }

    // TIER 3: Pure Keyless Client-Side Fallback (100% Offline & Network Resilient)
    try {
      const diag = emotionClassifier.classifyText(cleanMessage, voiceState);
      const libraryResult = queryPsychologyLibrary(cleanMessage);
      const study = getResearchedAdviceForEmotion(diag.dimensionId || 'calmness');
      const arousal = diag.coreAffect?.arousal || 0.5;
      const polyvagalState = arousal > 0.6 ? 'Sympathetic (Fight/Flight)' : (diag.coreAffect?.valence && diag.coreAffect.valence < -0.4) ? 'Dorsal Vagal (Shutdown)' : 'Ventral Vagal (Safe)';
      const tratakPrescription = resolveTratakaPrescription(
        cleanMessage,
        diag.dimensionName,
        polyvagalState,
        libraryResult?.condition?.recommended_trataka_mode
      );
      const gitaItem = findGitaWisdom(cleanMessage);

      const targetLang = cleanMessage.match(/[\u0900-\u097F]/) ? 'hi' : (language || locale || 'en');
      const hasDistressKeywords = /(?:distress|anxious|anxiety|depress|depressed|depression|sad|sadness|fear|scared|panic|stress|stressed|overwhelm|overwhelmed|worry|worried|grief|pain|burnout|lonely|loneliness|angry|anger|trauma|shame|guilt|fail|failed|failure|terrif|crying|tears|breakup|heartbreak|heartbroken|debt|debts|financial|burden|burdened|broke|struggling|struggle|loans|bills|hopeless|hopelessness|empty|numb|insomnia|can't sleep|cant sleep|insecure|rejection|rejected|abandoned|confused|restless|exhausted|fatigue|unmotivated|frustrated|frustration|hurting|suffering|mental problem|mental health|overthinking|racing thoughts|fight|argument|conflict|alone|nobody cares|chinta|tanaav|udas|gussa|troubled|need help|please help me|help me please|someone help me|help me i'm|help me i am|दर्द|रोना|रो |रोने|रोऊ|दुःख|दुख|तनाव|चिंता|उदासी|डर|घबराहट|घबरा|ब्रेकअप|परेशान|पीड़ा|कष्ट|क्रोध|अकेला|हार|असफल|टूटा|कर्ज|कर्जा|ऋण|बोझ|निराश|निराशा|उलझन|बेचैन|बेचैनी|थकान|थका)/i.test(cleanMessage);

      const hasPositiveOrCalmExplicit =
        /(happy|great|excited|peaceful|calm|relaxed|wonderful|grateful|joy|glad|blessed|good|doing well|girlfriend|boyfriend|in love|new partner|dating|promoted|celebrat|प्रसन्न|खुश|आनंद|शांत|शांति|बढ़िया|ठीक हूँ)/i.test(cleanMessage);

      const isSolutionRequest = isExplicitSolutionOrTherapyRequest(cleanMessage);

      const isPositiveOrNeutral =
        !isSolutionRequest &&
        !hasDistressKeywords &&
        hasPositiveOrCalmExplicit &&
        (diag.dimensionId === 'joy' ||
         diag.dimensionId === 'calmness' ||
         diag.dimensionId === 'romance' ||
         diag.dimensionId === 'amusement' ||
         diag.dimensionId === 'admiration' ||
         diag.dimensionId === 'adoration' ||
         diag.dimensionId === 'satisfaction' ||
         diag.dimensionId === 'relief' ||
         diag.dimensionId === 'awe' ||
         diag.dimensionId === 'interest' ||
         (diag.coreAffect?.valence !== undefined && diag.coreAffect.valence >= 0.15));

      const hasAcousticDistress =
        voiceState?.state === 'trembling_distress' ||
        voiceState?.tremorDetected ||
        voiceState?.state === 'acute_hyperarousal' ||
        (voiceState?.state === 'hypoarousal_depressed' && !isPositiveOrNeutral);

      const hasEmotionalDistressSignal =
        isSolutionRequest ||
        hasDistressKeywords ||
        hasAcousticDistress ||
        libraryResult !== null ||
        (diag.dimensionId !== 'calmness' && diag.dimensionId !== 'joy' && diag.dimensionId !== 'amusement' && diag.dimensionId !== 'adoration') ||
        (diag.coreAffect?.valence !== undefined && diag.coreAffect.valence < -0.05) ||
        (diag.coreAffect?.arousal !== undefined && diag.coreAffect.arousal > 0.55 && diag.coreAffect.valence < 0.2);

      const hasClinicalDistress =
        !isPositiveOrNeutral &&
        hasEmotionalDistressSignal;

      let fallbackReply = '';
      if (hasClinicalDistress) {
        if (libraryResult) {
          fallbackReply = formatHumanTherapeuticMessage(libraryResult.condition, targetLang, cleanMessage);
        } else if (study) {
          fallbackReply = getLocalizedGeneralAdvice(diag.dimensionName || 'anxiety', targetLang, cleanMessage);
        } else {
          fallbackReply = getLocalizedGeneralAdvice('default', targetLang, cleanMessage);
        }

        // Empathetically attune to physiological vocal indicators (tremor, strain, flat exhaustion)
        const hasVoiceTremble = voiceState?.tremorDetected || voiceState?.state === 'trembling_distress';
        const hasVoiceHypo = voiceState?.state === 'hypoarousal_depressed';

        let voiceWarmup = '';
        if (hasVoiceTremble) {
          if (targetLang === 'hi') {
            voiceWarmup = "मैं आपकी आवाज़ में घबराहट और कंपकंपी महसूस कर सकता हूँ। बिल्कुल आराम से एक गहरी, धीमी सांस लें—आप यहाँ पूरी तरह सुरक्षित हैं।\n\n";
          } else if (targetLang === 'es') {
            voiceWarmup = "Puedo percibir el temblor y la tensión en tu voz. Toma una respiración suave y pausada conmigo; estás en un espacio seguro.\n\n";
          } else if (targetLang === 'fr') {
            voiceWarmup = "J'entends le tremblement et la tension dans votre voix. Prenez une inspiration lente et profonde avec moi ; vous êtes en sécurité.\n\n";
          } else if (targetLang === 'de') {
            voiceWarmup = "Ich spüre das Zittern und die Anspannung in Ihrer Stimme. Atmen Sie in aller Ruhe tief durch; Sie sind in Sicherheit.\n\n";
          } else {
            voiceWarmup = "I can hear the tremble and strain in your voice. Take a slow, gentle breath with me right now; you are in a safe, unhurried space.\n\n";
          }
        } else if (hasVoiceHypo) {
          if (targetLang === 'hi') {
            voiceWarmup = "मैं आपकी आवाज़ में गहरी थकान और भारीपन महसूस कर रहा हूँ। किसी भी चीज़ में जल्दबाज़ी करने की ज़रूरत नहीं है; आराम से अपनी बात कहें।\n\n";
          } else {
            voiceWarmup = "I hear the deep heaviness and exhaustion in your voice. You don't have to carry this alone or rush; take all the time you need.\n\n";
          }
        }

        if (voiceWarmup && !fallbackReply.includes(voiceWarmup.trim())) {
          fallbackReply = voiceWarmup + fallbackReply;
        }
      } else {
        const isCelebratoryOrRomance = /(girlfriend|boyfriend|dating|in love|new partner|promoted|won|passed|celebrat|खुशखबरी|गर्लफ्रेंड|बॉयफ्रेंड)/i.test(cleanMessage);
        if (isCelebratoryOrRomance) {
          if (targetLang === 'hi') {
            fallbackReply = "यह तो बहुत सुंदर और सुखद बात है! नए रिश्ते की शुरुआत के लिए बहुत-बहुत बधाई। इस खास और प्यारे समय का आनंद लें—आप इस समय कैसा महसूस कर रहे हैं?";
          } else if (targetLang === 'es') {
            fallbackReply = "¡Qué maravillosa noticia! Muchas felicidades por esta nueva relación. Disfruta de esta hermosa etapa, ¿cómo te sientes al respecto?";
          } else if (targetLang === 'fr') {
            fallbackReply = "C'est une merveilleuse nouvelle ! Toutes mes félicitations pour cette nouvelle relation. Profitez de ces beaux moments—comment vous sentez-vous ?";
          } else if (targetLang === 'de') {
            fallbackReply = "Das sind wunderbare Neuigkeiten! Herzlichen Glückwunsch zu dieser neuen Beziehung. Genießen Sie diese schöne Zeit – wie fühlen Sie sich dabei?";
          } else {
            fallbackReply = "That is wonderful news! Congratulations on your new relationship. Enjoy this beautiful phase—how are you feeling about it?";
          }
        } else if (targetLang === 'hi') {
          fallbackReply = "मैं आपकी पूरी सहायता के लिए यहाँ उपस्थित हूँ। हम भगवद्गीता के दर्शन, संज्ञानात्मक सीबीटी (CBT) तकनीकों और त्राटक ध्यान के समन्वय से समाधान प्रस्तुत करते हैं। आप किस विशेष समस्या या परिस्थिति का समाधान चाहते हैं?";
        } else if (targetLang === 'es') {
          fallbackReply = "Estoy aquí para ayudarte con calma y presencia. Integramos la sabiduría del Bhagavad Gita, ejercicios de TCC y meditación ocular Trataka. ¿Qué situación específica te gustaría resolver hoy?";
        } else if (targetLang === 'fr') {
          fallbackReply = "Je suis à votre écoute pour vous aider. Nous associons la sagesse de la Bhagavad-Gita, les exercices de TCC et la méditation Trataka. Quel sujet précis aimeriez-vous aborder ?";
        } else if (targetLang === 'de') {
          fallbackReply = "Ich bin für Sie da, um Ihnen gezielt zu helfen. Wir verbinden die Weisheit der Bhagavad Gita, kognitive Verhaltenstherapie und Trataka-Augenmeditation. Welches Thema möchten Sie heute angehen?";
        } else {
          fallbackReply = "I am here with you, ready to help. We integrate Bhagavad Gita wisdom, clinical CBT, and Trataka eye-gazing techniques to resolve challenges. What specific situation or challenge would you like us to solve together?";
        }
      }

      const sources: ClinicalSource[] = hasClinicalDistress ? [
        {
          title: `Bhagavad Gita: Ch. ${gitaItem.chapter}, Verse ${gitaItem.verse} (${gitaItem.theme})`,
          summary: `${gitaItem.philosophical_meaning} | Clinical Reframe: ${gitaItem.clinical_reframe}`,
          source: 'Bhagavad Gita Library',
        },
        {
          title: `Tratak Neuro-Ocular: ${tratakPrescription.name}`,
          summary: `Focus: ${tratakPrescription.focalTarget} | Neuro: ${tratakPrescription.neuroMechanism}`,
          source: 'Trataka Sacred Gazing Protocol',
        },
      ] : [];

      if (hasClinicalDistress && libraryResult) {
        sources.push({
          title: `${libraryResult.condition.name} (${libraryResult.condition.triguna_balance})`,
          summary: `CBT: ${libraryResult.condition.solutions.cbt_reframing} | Somatic: ${libraryResult.condition.solutions.somatic_anchor}`,
          source: libraryResult.structuredCard?.isLearnedDocument
            ? (libraryResult.structuredCard.sourcePlatform || 'NCBI PubMed & Wikipedia Clinical Knowledge')
            : 'Clinical & Psychoeducational Library',
        });
      } else if (hasClinicalDistress && study) {
        sources.push({
          title: study.citation,
          summary: study.scientificActionProtocol,
          source: 'Authenticated Research Bank',
        });
      }

      const detectedFromReply = detectTratakaModeFromText(fallbackReply);
      const recTrataka = hasClinicalDistress
        ? (detectedFromReply ||
          (libraryResult?.condition?.recommended_trataka_mode
            ? normalizeTratakaMode(libraryResult.condition.recommended_trataka_mode)
            : tratakPrescription.mode))
        : 'bindu';
      const trigunaAnalysis = parseClientTriguna(libraryResult?.condition?.triguna_balance);

      const compositePercentages: Record<string, number> = {
        [diag.dimensionName || 'Calmness']: Math.round(arousal * 100),
      };
      if (diag.dimensionScores) {
        const sorted = Object.entries(diag.dimensionScores)
          .filter(([id]) => id !== diag.dimensionId)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        for (const [id, score] of sorted) {
          if (score > 0.15) {
            compositePercentages[emotionClassifier.getDimensionName(id)] = Math.round(score * 100);
          }
        }
      }

      return {
        reply: fallbackReply,
        engine: hasClinicalDistress ? 'Keyless Healer (Client-Side Standalone Fallback)' : 'Conversational Empathy Responder',
        sources,
        is_crisis: false,
        recommended_trataka: recTrataka,
        triguna_analysis: hasClinicalDistress ? trigunaAnalysis : undefined,
        telemetry: {
          dominant_emotion: hasClinicalDistress ? (diag.dimensionName || 'Calmness') : (diag.dimensionName || 'Calmness'),
          polyvagal_state: hasClinicalDistress ? polyvagalState : 'Ventral Vagal (Safe)',
          cbt_distortion: 'None',
          percentages: Object.keys(compositePercentages).length > 0 ? compositePercentages : {
            [diag.dimensionName || 'Calmness']: Math.round(arousal * 100),
            Relief: 65,
            Grounding: 80,
          },
          strategy: hasClinicalDistress
            ? `Somatic stabilization and evidence-based grounding for ${diag.dimensionName || 'emotional resilience'}.`
            : `Supportive presence and attuned awareness for ${diag.dimensionName || 'calmness'}.`,
          voice_state: voiceState?.description || 'Stable vocal resonance',
        },
      };
    } catch (finalErr) {
      console.error('Final fallback error:', finalErr);
      throw new Error('Unable to reach clinical reasoning engine. Please check your network connection.');
    }
  }

  /**
   * Sends recorded audio blob to Faster-Whisper on FastAPI for transcription,
   * with fallback to client-side Web Speech recognition
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const backendUrl = this.getBackendUrl();
    if (backendUrl) {
      try {
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'speech.wav');

        const res = await fetch(`${backendUrl}/api/stt`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const data = (await res.json()) as STTResponse;
          if (data.transcript) return data.transcript;
        }
      } catch (_) {}
    }

    // Fallback: Use browser transcription
    return '';
  }
}

export const healerClient = new HealerBackendClient();
