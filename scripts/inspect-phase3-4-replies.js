/**
 * scripts/inspect-phase3-4-replies.js
 *
 * Runs Phase 3 (CBT Restructuring) and Phase 4 (Neuro-Ocular Trataka)
 * across diverse clinical test personas, logging all dialogues and TTS replays.
 */

const { WellnessStateMachine } = require('../lib/wellness-flow/wellness-state-machine.ts');

const testCases = [
  {
    category: 'Anxiety & High Autonomic Arousal',
    lang: 'en',
    input: "My heart is pounding and I'm terrified I will fail my performance review tomorrow.",
    thought: "I'm going to get fired and my career is ruined.",
    evidence: "My last two reviews were positive, and my manager said my project was on schedule.",
  },
  {
    category: 'Sadness & Depressive Lethargy',
    lang: 'en',
    input: "I feel completely empty, sad, and like nothing I do matters anymore.",
    thought: "I have no purpose and things will never get better.",
    evidence: "I have felt down before and recovered; small positive steps helped my mood in the past.",
  },
  {
    category: 'Overthinking & Intrusive Loops',
    lang: 'en',
    input: "My mind won't stop racing with a thousand 'what-if' scenarios late at night.",
    thought: "If I don't control every possible outcome, disaster will strike.",
    evidence: "Most of the catastrophic things I worried about in the past never actually happened.",
  },
  {
    category: 'Anger & Frustration',
    lang: 'en',
    input: "I'm furious at how disrespectfully my colleague treated me in front of the team.",
    thought: "They deliberately tried to humiliate me and they deserve to pay for it.",
    evidence: "They might have been stressed or unaware; escalating with rage harms my peace more than theirs.",
  },
  {
    category: 'Stress & Exhaustive Burnout',
    lang: 'en',
    input: "I have 50 deadlines crashing at once, no sleep, and my brain feels like mush.",
    thought: "I must do everything perfectly right now or I am a complete failure.",
    evidence: "I can prioritize the top 2 urgent items, delegate one, and communicate realistic timelines.",
  },
  {
    category: 'Guilt & Self-Blame',
    lang: 'en',
    input: "I feel terrible guilt that I couldn't be there for my family when they needed me.",
    thought: "I am a selfish, terrible person who always lets people down.",
    evidence: "I was dealing with an emergency of my own; one absence does not negate years of care.",
  },
  {
    category: 'Hindi Session: काम का तनाव और घबराहट (Work Stress & Anxiety)',
    lang: 'hi',
    input: "ऑफिस के काम का बहुत भारी तनाव है, घबराहट हो रही है और नींद नहीं आ रही।",
    thought: "मुझसे यह काम नहीं हो पाएगा और सब कुछ बिगड़ जाएगा।",
    evidence: "मैंने पहले भी कठिन प्रोजेक्ट सफलतापूर्वक पूरे किए हैं।",
  },
];

console.log('╔════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║       PHASE 3 (CBT) & PHASE 4 (TRATAKA) DIALOGUE & REPLAY INSPECTION SUITE             ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════════════╝\n');

testCases.forEach((tc, idx) => {
  console.log(`========================================================================================`);
  console.log(`CASE ${idx + 1}: ${tc.category.toUpperCase()} [Language: ${tc.lang.toUpperCase()}]`);
  console.log(`========================================================================================`);

  const sm = new WellnessStateMachine();
  if (tc.lang === 'hi') {
    sm.setLanguage('hi');
  }

  // Phase 1 -> Confirm -> Gita
  const moodRes = sm.handleMoodInput(tc.input);
  console.log(`\n[PHASE 1 - INPUT] User Said: "${tc.input}"`);
  console.log(`[PHASE 1 - CONFIRMATION] App Replied: "${moodRes.confirmationText}"`);

  sm.handleConfirmationResponse(true);
  const verse = sm.getSelectedGitaVerse();
  console.log(`[PHASE 2 - GITA] App Selected: ${verse.reference} (${verse.sanskrit})`);

  // Phase 2 -> Phase 3 Transition
  const cbtTransition = sm.advanceFromGitaToCBT();
  console.log(`\n────────────────────────────────────────────────────────────────────────────────────────`);
  console.log(`▶ PHASE 3: COGNITIVE BEHAVIORAL THERAPY (CBT) REPLIES:`);
  console.log(`────────────────────────────────────────────────────────────────────────────────────────`);
  console.log(`[CBT TRANSITION] App Spoke Aloud:`);
  console.log(`   "${cbtTransition.transitionSpeech}"\n`);

  // Step 1: User provides automatic thought
  console.log(`[STEP 1 - THOUGHT CAPTURE] User Said: "${tc.thought}"`);
  const step1Res = sm.handleCbtStep1(tc.thought);

  // Step 2: Distortion Prompt
  console.log(`\n[STEP 2 - DISTORTION IDENTIFIED] App Replied:`);
  console.log(`   "${step1Res.distortionPrompt}"`);

  // Step 3: Socratic Challenge Questions
  const step2Res = sm.handleCbtStep2();
  console.log(`\n[STEP 3 - SOCRATIC CHALLENGE QUESTIONS] App Asked:`);
  step2Res.challengeQuestions.forEach((q, qIdx) => {
    console.log(`   Q${qIdx + 1}: "${q}"`);
  });

  // Step 4: Rational Replacement Thought & Action Step
  console.log(`\n[STEP 3 - USER EVIDENCE] User Answered: "${tc.evidence}"`);
  const step3Res = sm.handleCbtStep3(tc.evidence);
  console.log(`\n[STEP 4 - RATIONAL REPLACEMENT THOUGHT] App Provided:`);
  console.log(`   "${step3Res.replacementThought}"`);
  console.log(`[STEP 4 - COMMITTED MICRO-ACTION] App Prescribed:`);
  console.log(`   "${step3Res.actionStep}"`);

  // Phase 3 -> Phase 4 Transition
  console.log(`\n────────────────────────────────────────────────────────────────────────────────────────`);
  console.log(`▶ PHASE 4: NEURO-OCULAR TRATAKA REPLIES:`);
  console.log(`────────────────────────────────────────────────────────────────────────────────────────`);
  const tratakaTransition = sm.advanceFromCBTToTrataka();
  console.log(`[TRATAKA TRANSITION] App Spoke Aloud:`);
  console.log(`   "${tratakaTransition.announcementSpeech}"\n`);

  const tratakaResult = tratakaTransition.tratakaResult;
  console.log(`[SELECTED TRATAKA MODE] ${tratakaResult.variant.name_en} (${tratakaResult.variant.name_hi})`);
  console.log(`[PRESCRIBED DURATION]   ${tratakaResult.duration_seconds} seconds (${tratakaResult.duration_seconds / 60} mins)`);
  console.log(`[CLINICAL RATIONALE]    "${tc.lang === 'hi' ? tratakaResult.rationale_hi : tratakaResult.rationale_en}"`);
  console.log(`[NEUROLOGICAL MECHANISM]"${tc.lang === 'hi' ? tratakaResult.variant.neuro_mechanism_hi : tratakaResult.variant.neuro_mechanism_en}"`);

  console.log(`[VOICE CUES (TTS Audio Guidance During Gazing)]`);
  const cues = tratakaResult.variant.voice_cues;
  console.log(`   Begin Gazing: "${tc.lang === 'hi' ? cues.begin_hi : cues.begin_en}"`);
  console.log(`   Blink Cue:    "${tc.lang === 'hi' ? cues.blink_hi : cues.blink_en}"`);
  console.log(`   Close Eyes:   "${tc.lang === 'hi' ? cues.close_eyes_hi : cues.close_eyes_en}"`);
  console.log(`   Deep Relax:   "${tc.lang === 'hi' ? cues.relax_hi : cues.relax_en}"`);

  console.log(`[STEP-BY-STEP GUIDANCE SCRIPT]`);
  const guidanceScript = tc.lang === 'hi' ? tratakaResult.variant.step_by_step_guidance_hi : tratakaResult.variant.step_by_step_guidance_en;
  guidanceScript.slice(0, 3).forEach((line, lIdx) => {
    console.log(`   Step ${lIdx + 1}: "${line}"`);
  });

  // Phase 4 Completion & Summary
  const completionRes = sm.completeTratakaSession();
  console.log(`\n[CLOSING REFLECTION] App Replied:`);
  console.log(`   "${completionRes.closingReflection}"`);

  const summaryRes = sm.submitPostSessionMoodRating(3);
  console.log(`[SESSION INTEGRATION] Initial Distress: ${summaryRes.initialIntensity}/10 -> Post-Session: ${summaryRes.finalRating}/10 (Improvement: +${summaryRes.improvementDelta} points)\n`);
});
