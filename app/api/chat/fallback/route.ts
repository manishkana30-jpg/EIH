import { NextRequest, NextResponse } from 'next/server';
import { emotionClassifier, NeuroscienceDiagnosticResult } from '@/lib/knowledge/emotion-classifier';
import { generateDynamicCompanionReply } from '@/lib/nlp/conversational-companion-engine';
import { getResearchedAdviceForEmotion } from '@/lib/knowledge/authenticated-research-bank';
import { runHiddenCognitiveDiagnostics } from '@/lib/nlp/cognitive-orchestrator';
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

    // Check if user is complaining about repetitive loops
    const lowerPrompt = cleanPrompt.toLowerCase();
    const isRepetitionComplaint =
      effectiveDiag?.metaIntent === 'dialogue_complaint' ||
      lowerPrompt.includes('stop repeating') ||
      lowerPrompt.includes('again and again') ||
      lowerPrompt.includes('same question') ||
      lowerPrompt.includes('repeating the same') ||
      lowerPrompt.includes('same sentences') ||
      lowerPrompt.includes('only 3 4 sentences') ||
      lowerPrompt.includes('in loop') ||
      lowerPrompt.includes('stuck in a loop') ||
      lowerPrompt.includes('why do you keep asking') ||
      lowerPrompt.includes('keep asking about breathing') ||
      lowerPrompt.includes('you are stuck') ||
      lowerPrompt.includes('stop asking');

    if (isRepetitionComplaint) {
      const resetResult = generateDynamicCompanionReply({
        userText: cleanPrompt,
        history,
        diagnostic: effectiveDiag,
        cognitiveProfile,
      });
      return NextResponse.json({
        reply: resetResult.reply,
        provider: 'dialogue_reset',
        psychologicalAssessment: resetResult.psychologicalAssessment,
      });
    }

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

    // 0. Execute Hidden Stage 1 Cognitive Diagnostics
    const cognitiveDiag = runHiddenCognitiveDiagnostics(cleanPrompt);

    // Build Learned Adaptive CBT Context
    let adaptiveCbtContext = '';
    if (cognitiveProfile) {
      const topDistortions = cognitiveProfile.topRecurringDistortions?.map((d) => d.distortion).join(', ') || 'None';
      const effectiveTech = cognitiveProfile.interventionEfficacyMatrix
        ?.filter((m) => m.successRate >= 0.6 && m.totalAttempts > 0)
        ?.map((m) => m.technique)
        ?.join(', ') || 'Somatic grounding + Socratic reframing';
      const avoidTech = cognitiveProfile.interventionEfficacyMatrix
        ?.filter((m) => m.successRate < 0.3 && m.totalAttempts >= 2)
        ?.map((m) => m.technique)
        ?.join(', ') || 'None';
      const pastBreakthroughs =
        cognitiveProfile.breakthroughAnchors
          ?.slice(-3)
          .map((b) => `  * "${b.insightPhrase}" (Trigger: ${b.contextTrigger})`)
          .join('\n') || '  * (First session / no past anchors logged yet)';

      adaptiveCbtContext = `\n[LEARNED USER COGNITIVE PROFILE - HISTORICAL ADAPTIVE MEMORY:
- Known Recurring Cognitive Traps: ${topDistortions}
- Proven Effective Techniques for this User: ${effectiveTech}
- Avoid (Historically Ineffective): ${avoidTech}
- Doshic Grounding Anchor: ${cognitiveProfile.doshicBaseline?.effectiveGroundingPranayama || 'Nadi Shodhana'}
- Past User Breakthrough Insights:
${pastBreakthroughs}]`;
    }

    // Build comprehensive psychological status & clinical ontology context
    const emotionContext = `[HIDDEN CLINICAL COGNITIVE SCRATCHPAD:
- User Specific Anchor Terms: ${JSON.stringify(cognitiveDiag.anchorPhrases)}
- CBT Distortion Detected: ${cognitiveDiag.cbtDistortion}
- Polyvagal Zone: ${cognitiveDiag.polyvagalState}
- Core Emotional Need: ${cognitiveDiag.coreEmotionalNeed}
- Ayurvedic Doshic State: ${JSON.stringify(cognitiveDiag.ayurvedicState)}
- Strategic Objective: ${cognitiveDiag.therapeuticStrategy}
- Cowen 27-D Emotion: ${effectiveDiag.dimensionName || 'Calmness'} (Intensity: ${effectiveDiag.intensity || 'moderate'})
- Core Affect: Valence ${effectiveDiag.coreAffect?.valence?.toFixed(2) ?? '0.00'}, Arousal ${effectiveDiag.coreAffect?.arousal?.toFixed(2) ?? '0.00'}
- Peer-Reviewed Evidence: ${researchStudy.citation} (${researchStudy.institutionOrJournal})
- Scientific Action: ${researchStudy.scientificActionProtocol}
- Ayurvedic Action: ${researchStudy.ayurvedicActionProtocol}]${adaptiveCbtContext}${webContextSnippet}`;

    const systemPrompt = `# SYSTEM INSTRUCTION: CONVERSATIONAL DIVERSITY & ZERO-LOOP CLINICAL PSYCHOLOGIST ENGINE

## 1. IDENTITY, PERSONA & CONVERSATIONAL MANDATES
You are acting as an expert Clinical Psychologist, Cognitive Evaluator, and Conversational Architect. Your objective is to run a natural, deeply responsive therapy dialogue with zero robotic loops, synthesize real-time clinical notes, recommend targeted evidence-based therapeutic modalities, assign actionable homework, and lock in structured follow-up agendas.

${emotionContext}

### STRICT CONVERSATIONAL DIVERSITY RULES (ANTI-LOOP ENGINE):
1. **Zero Canned Empathy:** You are strictly forbidden from opening turns with repetitive filler phrases like *"I hear what you're saying"*, *"That must be really tough"*, *"Thank you for sharing"*, or *"Take a deep breath"*.
2. **Lexical & Syntactic Variety:** Continuously vary sentence length, pacing, question formats (open-ended inquiry vs. gentle reality-testing vs. somatic check-in), and conversational entry points.
3. **Anchor to User Specifics:** Every response must directly latch onto specific verbs, nouns, relationships, and situational details mentioned in the user's latest statement.
4. **No Infinite Exploratory Loops:** Never ask circular "how does that feel?" questions without synthesizing what was already stated. Move the conversation progressively: **Listen & Validate -> Challenge / Explore Underlying Schema -> Frame Therapeutic Insight -> Concrete Action**.
5. REAL-TIME MULTILINGUAL MIRRORING: ALWAYS reply in the EXACT same language the user writes in (Hindi, Hinglish, Spanish, French, German, or English).
6. **No Document/Report Generation During Chat:** DO NOT output markdown lists, clinical reports, or SOAP notes during the conversation. You must act as a human therapist speaking directly to a patient.

---

## 2. INTERACTIVE CLINICAL WORKFLOW

During the session, operate across three distinct operational phases:

### PHASE A: DIVERSE CLINICAL INTAKE & SOCRATIC EXPLORATION (Active Conversation)
- **CURRENT PHASE:** YOU ARE CURRENTLY IN PHASE A.
- Maintain a warm, grounded, professional clinical presence.
- Keep conversational voice turns concise (2 to 4 sentences maximum) to encourage authentic dialogue.
- Actively probe for:
  * Primary Stressor & Trigger Events.
  * Negative Automatic Thoughts (NATs) & Cognitive Distortions (Catastrophizing, Emotional Reasoning, Overgeneralization, Black-and-White Thinking, etc.).
  * Somatic Manifestations (Tension, insomnia, gastrointestinal distress, shallow breathing).
  * Underlying Core Beliefs / Schemas (Defectiveness, Abandonment, Unrelenting Standards, Vulnerability to Harm).

### PHASE B: THERAPY FORMULATION & RECOMMENDATION
Based on the synthesized diagnostic pattern, determine the optimal evidence-based therapeutic pathway (CBT, DBT, ACT, Somatic Experiencing, Psychodynamic). Weave this into natural conversation, NOT a clinical report.

### PHASE C: SESSION CONCLUSION, SOAP NOTES & HOMEWORK PROTOCOL
**CRITICAL INSTRUCTION:** ONLY execute this phase if the user explicitly says "we are done", "end session", or asks for a "clinical summary". Otherwise, you MUST stay in Phase A/B and converse naturally.
When the session concludes (or when the user requests wrap-up / assessment), generate a structured clinical summary consisting of:
1. **Comprehensive Clinical Notes (SOAP Format).**
2. **Primary & Secondary Therapy Modality Recommendation (with clinical justification).**
3. **Targeted Behavioral Homework / Task (Specific, measurable, low-friction).**
4. **Next Session Agenda & Evaluation Metrics (Follow-up plan).**

---

## 3. CLINICAL OUTPUT SPECIFICATION (SESSION REPORT FORMAT)
(DO NOT USE THIS FORMAT UNLESS THE USER EXPLICITLY ENDS THE SESSION OR ASKS FOR THE REPORT)

# 📋 CLINICAL SESSION NOTES & THERAPEUTIC FORMULATION

### 1. CLINICAL INTAKE NOTES (SOAP MODEL)
- **Subjective (S):** Chief complaints, emotional state in user's words, reported stressors.
- **Objective (O):** Observed cognitive patterns, communication cadence, emotional intensity, physical/somatic markers.
- **Assessment (A):** 
  - Primary Cognitive Distortions Identified: [e.g., Catastrophizing, Mind Reading]
  - Core Schema / Underlying Fear: [e.g., Fear of failure, Unrelenting standards]
  - Autonomic State: [Ventral Vagal (Regulated) | Sympathetic (Arousal/Fight-Flight) | Dorsal Vagal (Shutdown)]
- **Plan (P):** Long-term clinical trajectory and short-term inter-session milestones.

---

### 2. RECOMMENDED THERAPY MODALITY
- **Primary Recommended Therapy:** [e.g., Cognitive Behavioral Therapy (CBT) combined with Somatic Grounding]
- **Clinical Rationale:** [2-3 sentences explaining precisely why this therapy fits their cognitive signature]
- **Key Interventions to be Utilized:** [e.g., Socratic Evidence Testing, Behavioral Activation, 4-7-8 Somatic Vagal Brake]

---

### 3. INTER-SESSION HOMEWORK TASK (BEHAVIORAL EXPERIMENT)
- **Task Title:** [e.g., The 3-Column Thought Record & Evening Somatic Reset]
- **Step-by-Step Instructions:**
  1. [Actionable step 1: Specific trigger tracking]
  2. [Actionable step 2: Counter-evidence reality testing]
  3. [Actionable step 3: 5-minute somatic grounding protocol]
- **Success Indicator:** [What measurable shift the user should observe before next session]

---

### 4. NEXT SESSION SCHEDULING & EVALUATION AGENDA
- **Target Timeline:** [e.g., In 3 to 5 days, or after completing 3 logged thought records]
- **Session Evaluation Focus:**
  1. Review of the assigned behavioral task and review of recorded thought records.
  2. Re-assessment of emotional trajectory delta (testing if distress levels have dropped).
  3. Deep-dive into newly emerging stressors or persistent resistance.

---

## 4. CONVERSATIONAL TEST SUITE & BENCHMARKING DIRECTIVES

If asked to run as an automated test evaluator or simulate patient scenarios:
- **Test Case 1 (The Panic / Catastrophizer):** Ensure the model does not offer intellectual debates when the user is in an active sympathetic freeze/flight loop; force somatic de-escalation first.
- **Test Case 2 (The Intellectualizer / Avoidant):** Challenge conversational loops where the user intellectualizes feelings without emotional contact.
- **Test Case 3 (The Defeated / Depressive Inertia):** Ban toxic positivity; prescribe micro-behavioral activation tasks instead of grand lifestyle overhauls.

---

## 5. EXECUTION PROTOCOL
Begin immediately by greeting the user with an open, authentic, non-generic opening question that invites them into a safe, focused therapeutic space. Speak naturally in 2-4 sentences max. DO NOT PRINT THE SOAP NOTES OR CLINICAL REPORT NOW.`;

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
            emotionAnalysis: emotionContext,
          });
        }
      } catch (e) {
        console.warn('Groq edge notice:', e);
      }
    }

    // 2. Prioritize Google Gemini Flash with Search Grounding if available
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
              tools: [{ googleSearch: {} }],
              generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 350,
              },
            }),
          }
        );
        clearTimeout(timeout);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidate = data.candidates?.[0];
          const reply = candidate?.content?.parts?.[0]?.text?.trim();
          const groundingMetadata = candidate?.groundingMetadata;
          if (reply) {
            return NextResponse.json({
              reply,
              provider: 'gemini_google_search_grounded',
              grounding: groundingMetadata || null,
              emotionAnalysis: emotionContext,
            });
          }
        }
      } catch (e) {
        console.warn('Gemini Search Grounded edge notice:', e);
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
            emotionAnalysis: emotionContext,
          });
        }
      } catch (e) {
        console.warn('Groq edge fallback notice:', e);
      }
    }

    // 3. Attempt OpenAI if available
    if (openaiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-4).map((h) => ({
                role: h.role === 'assistant' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: cleanPrompt },
            ],
            temperature: 0.75,
            max_tokens: 300,
          }),
        });
        clearTimeout(timeout);

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json({
              reply,
              provider: 'openai_gpt4o',
              emotionAnalysis: emotionContext,
            });
          }
        }
      } catch (e) {
        console.warn('OpenAI edge fallback notice:', e);
      }
    }

    // 4. Free Edge AI Model (Zero API key required — uses open inference)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
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
        if (cleanedReply && cleanedReply.length > 25 && !cleanedReply.includes('error')) {
          return NextResponse.json({
            reply: cleanedReply,
            provider: 'free_edge_ai',
            emotionAnalysis: emotionContext,
          });
        }
      }
    } catch (e) {
      console.warn('Free Edge AI notice:', e);
    }

    // 5. Generative Psychological Cognitive Synthesis Engine (Guaranteed High-IQ Deep Listening)
    const dynamicResult = generateDynamicCompanionReply({
      userText: cleanPrompt,
      history,
      diagnostic: effectiveDiag,
      cognitiveProfile,
    });

    return NextResponse.json({
      reply: dynamicResult.reply,
      topic: dynamicResult.detectedTopic,
      provider: 'cognitive_psychological_engine',
      emotionAnalysis: emotionContext,
      psychologicalAssessment: dynamicResult.psychologicalAssessment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fallback error';
    const fallbackResult = generateDynamicCompanionReply({
      userText: rawUserPrompt || 'I am listening',
      diagnostic: emotionClassifier.classifyText(rawUserPrompt || ''),
    });
    return NextResponse.json(
      {
        reply: fallbackResult.reply,
        error: message,
      },
      { status: 200 }
    );
  }
}
