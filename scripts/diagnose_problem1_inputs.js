/**
 * scripts/diagnose_problem1_inputs.js
 *
 * Diagnoses the exact tokenization, emotion classification, decision path,
 * and confirmation reply generation across 16 varied emotional inputs.
 */

const { emotionEngine } = require('../lib/wellness-flow/emotion-engine.ts');
const { wellnessStateMachine } = require('../lib/wellness-flow/wellness-state-machine.ts');
const { emotionClassifier } = require('../lib/knowledge/emotion-classifier.ts');
const { buildDiagnosticSufferingAssessment } = require('../lib/i18n/clinical-localization.ts');

const TEST_MESSAGES = [
  { id: 1, type: 'Short Hindi anger', text: 'मुझे बहुत गुस्सा आ रहा है', lang: 'hi' },
  { id: 2, type: 'Specific Hindi work', text: 'मुझे काम को लेकर बहुत गुस्सा आ रहा है, बॉस ने सबके सामने बेइज्जत किया', lang: 'hi' },
  { id: 3, type: 'Specific Hindi loneliness', text: 'मुझे अकेलापन महसूस हो रहा है, कोई मुझसे बात नहीं करता', lang: 'hi' },
  { id: 4, type: 'Short English specific', text: 'I feel anxious about my job interview tomorrow', lang: 'en' },
  { id: 5, type: 'Specific English relationship', text: 'My partner broke up with me after 5 years and I cannot stop crying', lang: 'en' },
  { id: 6, type: 'Long English mixed', text: 'I am feeling completely overwhelmed by work deadlines, but also guilty because I snapped at my kids yesterday, and I haven\'t slept in three days', lang: 'en' },
  { id: 7, type: 'Hinglish future uncertainty', text: 'bohot zyada tension ho rahi hai future ko lekar, samajh nahi aa raha kya karu', lang: 'hi' },
  { id: 8, type: 'Hinglish work burnout', text: 'office me itna overload hai ki burnout ho gaya hai, zero energy bachi hai', lang: 'en' },
  { id: 9, type: 'Vague English', text: 'I don\'t know, just feeling off', lang: 'en' },
  { id: 10, type: 'Vague Hindi', text: 'बस ऐसे ही, कुछ समझ नहीं आ रहा', lang: 'hi' },
  { id: 11, type: 'English self-worth/imposter', text: 'I feel like a total failure and imposter at my new job', lang: 'en' },
  { id: 12, type: 'Hindi financial stress', text: 'कर्ज का बोझ बहुत बढ़ गया है, रात को नींद नहीं आती', lang: 'hi' },
  { id: 13, type: 'English grief/loss', text: 'I lost my grandmother last week and the house feels completely empty', lang: 'en' },
  { id: 14, type: 'English health anxiety', text: 'My heart has been beating irregularly and I am terrified it is something serious', lang: 'en' },
  { id: 15, type: 'Mild English stress', text: 'I am a little bit stressed about the presentation', lang: 'en' },
  { id: 16, type: 'Severe panic/devastation', text: 'I am completely devastated, having panic attacks and my chest is suffocating', lang: 'en' }
];

console.log('================================================================================');
console.log('DIAGNOSTIC REPORT: STEP 1 OF PROBLEM 1 — INPUT TOKENIZATION & REPLY GENERATION');
console.log('================================================================================\n');

const results = [];

TEST_MESSAGES.forEach((item) => {
  // 1. Emotion Engine (Guided Wellness Flow)
  const profile = emotionEngine.analyze(item.text);
  const confirmationReply = emotionEngine.generateConfirmationStatement(profile, item.lang);

  // 2. State Machine handleMoodInput
  wellnessStateMachine.reset();
  wellnessStateMachine.setLanguage(item.lang);
  const smResult = wellnessStateMachine.handleMoodInput(item.text);

  // 3. Clinical Emotion Classifier (Neuroscience Classifier for Session Chat)
  const neuroDiag = emotionClassifier.classifyText(item.text);
  const assessment = buildDiagnosticSufferingAssessment(item.text, neuroDiag.dimensionId, undefined, item.lang);

  results.push({
    id: item.id,
    type: item.type,
    text: item.text,
    lang: item.lang,
    wellnessFlow: {
      primary_emotion: profile.primary_emotion,
      secondary_emotion: profile.secondary_emotion || 'none',
      intensity: profile.intensity,
      confidence: profile.confidence,
      root_theme: profile.root_theme,
      confirmationReply: smResult.confirmationText
    },
    neuroscienceClassifier: {
      dimensionId: neuroDiag.dimensionId,
      dimensionName: neuroDiag.dimensionName,
      valence: neuroDiag.coreAffect?.valence,
      arousal: neuroDiag.coreAffect?.arousal,
      intensity: neuroDiag.intensity,
      polyvagalState: neuroDiag.polyvagalState,
      assessmentFocus: assessment.inputSummary
    }
  });

  console.log(`[#${item.id}] Type: ${item.type} | Lang: ${item.lang.toUpperCase()}`);
  console.log(`  Raw Input: "${item.text}"`);
  console.log(`  -> WellnessFlow Profile: Emotion="${profile.primary_emotion}" (Int:${profile.intensity}, Conf:${profile.confidence}), Theme="${profile.root_theme}"`);
  console.log(`  -> Generated Confirmation Statement: "${smResult.confirmationText}"`);
  console.log(`  -> Neuro Classifier: Dim="${neuroDiag.dimensionName}" (Val:${neuroDiag.coreAffect?.valence}, Ar:${neuroDiag.coreAffect?.arousal}, Int:${neuroDiag.intensity})`);
  console.log(`  -> Assessment Focus: "${assessment.inputSummary}"`);
  console.log('--------------------------------------------------------------------------------');
});

// Analyze diversity of Wellness Flow confirmation statements
const replies = results.map(r => r.wellnessFlow.confirmationReply);
const uniqueReplies = new Set(replies);
console.log(`\nSUMMARY STATS:`);
console.log(`Total inputs tested: ${TEST_MESSAGES.length}`);
console.log(`Unique confirmation statements produced: ${uniqueReplies.size} / ${TEST_MESSAGES.length}`);

// Check for generic greeting fallback occurrence
const hasGreetingFallback = replies.some(r => r.includes('मैं आपकी सहायता') || r.includes('आप किस समस्या का समाधान'));
console.log(`Generic greeting fallback detected? ${hasGreetingFallback ? 'YES (BUG DETECTED)' : 'NO'}`);
