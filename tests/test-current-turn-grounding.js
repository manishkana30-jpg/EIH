/**
 * tests/test-current-turn-grounding.js
 * 
 * Verifies Rule 1: CURRENT-TURN EMOTIONAL GROUNDING (NO STICKY EMOTIONS)
 * 1. Emotional state is classified solely on the user's MOST RECENT input.
 * 2. Direct assertions override all prior context ("I am happy" -> JOY/POSITIVE).
 * 3. Previous sadness/distress context is discarded; distress score drops to 1/10 (Ventral Vagal Safe).
 * 4. Multilingual direct assertions (Hindi, Spanish, French, German) properly recognized.
 */

const assert = require('assert');

// Load emotion classifier & clinical localization
const { emotionClassifier } = require('../lib/knowledge/emotion-classifier.ts');
const { buildDiagnosticSufferingAssessment } = require('../lib/i18n/clinical-localization.ts');

function runTests() {
  console.log('--- Running Rule 1: Current-Turn Emotional Grounding Test Suite ---');

  // Test 1: Direct English Assertion "I am happy"
  const diagHappy = emotionClassifier.classifyText("I am happy");
  assert.strictEqual(diagHappy.dimensionId, "joy", "Direct assertion 'I am happy' must classify as joy");
  console.log('  ✓ Direct assertion "I am happy" immediately classified as joy');

  const assessHappy = buildDiagnosticSufferingAssessment("I am happy", undefined, undefined, "en");
  assert.strictEqual(assessHappy.distressScore, 1, "Distress score for 'I am happy' must be 1/10 (regulated)");
  assert(assessHappy.nervousSystem.includes("Ventral Vagal"), "Nervous system must be Ventral Vagal Safe");
  assert(!assessHappy.markdown.includes("EMOTIONAL SUFFERING ASSESSMENT"), "Markdown must not label happiness as suffering");
  assert(assessHappy.markdown.includes("WELLBEING ASSESSMENT"), "Markdown must label happiness as wellbeing assessment");
  console.log('  ✓ Assessment reflects Ventral Vagal Safety & Wellbeing rather than suffering');

  // Test 2: Direct Assertion "I feel calm and peaceful"
  const diagCalm = emotionClassifier.classifyText("I feel calm and peaceful");
  assert.strictEqual(diagCalm.dimensionId, "calmness", "Direct assertion 'I feel calm' must classify as calmness");
  const assessCalm = buildDiagnosticSufferingAssessment("I feel calm and peaceful", undefined, undefined, "en");
  assert.strictEqual(assessCalm.distressScore, 1, "Distress score for calm must be 1/10");
  console.log('  ✓ Direct assertion "I feel calm and peaceful" classified as calmness');

  // Test 3: No Sticky Emotions (Current Turn Overrides Prior Negative Context)
  // Even if user references previous negative words e.g. "I was sad yesterday, but now I am happy"
  const diagShift = emotionClassifier.classifyText("I am happy now, no more sadness");
  assert.strictEqual(diagShift.dimensionId, "joy", "Current turn assertion 'I am happy' must override mention of sadness");
  const assessShift = buildDiagnosticSufferingAssessment("I am happy now, no more sadness", undefined, undefined, "en");
  assert.strictEqual(assessShift.distressScore, 1, "Current turn assertion must drop distress score to 1/10");
  assert(!assessShift.nervousSystem.includes("Fight-or-Flight"), "Must not assign Fight-or-Flight when user declares happiness");
  console.log('  ✓ Mention of past sadness flushed; current declaration of happiness prevails');

  // Test 4: Multilingual Direct Assertions
  // Hindi
  const diagHindi = emotionClassifier.classifyText("मैं बहुत खुश हूँ और सब ठीक है");
  assert.strictEqual(diagHindi.dimensionId, "joy", "Hindi 'मैं बहुत खुश हूँ' must classify as joy");
  const assessHindi = buildDiagnosticSufferingAssessment("मैं बहुत खुश हूँ", undefined, undefined, "hi");
  assert.strictEqual(assessHindi.distressScore, 1);
  assert(assessHindi.nervousSystem.includes("वेन्ट्रल वेगल सुरक्षा"));
  console.log('  ✓ Hindi direct assertion "मैं बहुत खुश हूँ" classified as joy with Ventral Vagal Safety');

  // Spanish
  const diagSpanish = emotionClassifier.classifyText("Estoy muy feliz hoy");
  assert.strictEqual(diagSpanish.dimensionId, "joy", "Spanish 'Estoy muy feliz' must classify as joy");
  console.log('  ✓ Spanish direct assertion "Estoy muy feliz" classified as joy');

  // French
  const diagFrench = emotionClassifier.classifyText("Je suis très heureux");
  assert.strictEqual(diagFrench.dimensionId, "joy", "French 'Je suis très heureux' must classify as joy");
  console.log('  ✓ French direct assertion "Je suis très heureux" classified as joy');

  // German
  const diagGerman = emotionClassifier.classifyText("Ich bin glücklich");
  assert.strictEqual(diagGerman.dimensionId, "joy", "German 'Ich bin glücklich' must classify as joy");
  console.log('  ✓ German direct assertion "Ich bin glücklich" classified as joy');

  console.log('\nAll Rule 1 (Current-Turn Emotional Grounding) Tests Passed Successfully!\n');
}

runTests();
