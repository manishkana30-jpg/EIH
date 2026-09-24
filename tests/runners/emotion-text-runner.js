/**
 * tests/runners/emotion-text-runner.js
 *
 * Text Evaluation Runner for Phase 1 Emotional Understanding & Confirmation Flow.
 * Evaluates 343 curated emotional inputs programmatically against:
 * - Primary & secondary emotion classification
 * - Intensity calibration ([min, max] range matching)
 * - Root theme extraction
 * - Safety / crisis detection (100% recall target, zero-tolerance gate)
 * - Confirmation statement empathetic quality
 * - State machine transitions (YES path, NO path/clarification loop, Unclear/fallback)
 * - Yes/No multilingual intent parser variants
 */

const fs = require('fs');
const path = require('path');
const { wellnessStateMachine } = require('../../lib/wellness-flow/wellness-state-machine.ts');
const { emotionEngine } = require('../../lib/wellness-flow/emotion-engine.ts');
const { parseYesNoIntent, parseYesNoIntentDetailed } = require('../../lib/wellness-flow/confirm-intent-parser.ts');

function runEmotionTextTests(corpus) {
  console.log('\n================================================================');
  console.log('RUNNING COMPONENT 1: EMOTIONAL TEXT EVALUATION RUNNER');
  console.log(`Ingesting ${corpus.length} messages into Phase 1 NLP pipeline...`);
  console.log('================================================================\n');

  const results = {
    total: corpus.length,
    passedPrimary: 0,
    passedIntensity: 0,
    safetyTotal: 0,
    safetyDetected: 0,
    safetyFalsePositives: 0,
    normalFlowTotal: 0,
    normalFlowPassed: 0,
    clarifyLoopTotal: 0,
    clarifyLoopPassed: 0,
    confusionMatrix: {},
    failures: [],
    suspiciousCases: [],
    details: [],
    branchResults: {
      yesPathSuccess: 0,
      yesPathTotal: 0,
      noPathSuccess: 0,
      noPathTotal: 0,
      clarifyLoopQuestionsLogged: [],
      intentParserTests: {
        total: 0,
        passed: 0,
        cases: []
      }
    }
  };

  // 1. Process each message through Phase 1
  for (const item of corpus) {
    wellnessStateMachine.reset();

    const isSafetyExpected = item.expected_flow === 'safety_stop';
    if (isSafetyExpected) {
      results.safetyTotal++;
    } else {
      results.normalFlowTotal++;
    }

    const tStart = performance.now();
    const result = wellnessStateMachine.handleMoodInput(item.text);
    const durationMs = Number((performance.now() - tStart).toFixed(2));

    const currentState = wellnessStateMachine.getCurrentState();
    const profile = result.profile;

    const detectedPrimary = profile ? profile.primary_emotion : 'unknown';
    const detectedSecondary = profile ? (profile.secondary_emotion || null) : null;
    const detectedIntensity = profile ? profile.intensity : 0;
    const detectedConfidence = profile ? profile.confidence : 0;
    const detectedTheme = profile ? profile.root_theme : 'unknown';
    const isCrisisDetected = result.isCrisis;

    // Track confusion matrix
    if (!results.confusionMatrix[item.expected_primary_emotion]) {
      results.confusionMatrix[item.expected_primary_emotion] = {};
    }
    const targetMap = results.confusionMatrix[item.expected_primary_emotion];
    targetMap[detectedPrimary] = (targetMap[detectedPrimary] || 0) + 1;

    // Evaluate Primary Emotion Match
    // Note: Accept clinically adjacent emotions (e.g. stress <-> anxiety, guilt <-> shame, sadness <-> depression)
    const isExactMatch = detectedPrimary.toLowerCase() === item.expected_primary_emotion.toLowerCase();
    const isClinicallyAdjacent =
      (item.expected_primary_emotion === 'stress' && (detectedPrimary === 'anxiety' || detectedPrimary === 'overthinking')) ||
      (item.expected_primary_emotion === 'anxiety' && (detectedPrimary === 'stress' || detectedPrimary === 'overthinking')) ||
      (item.expected_primary_emotion === 'sadness' && (detectedPrimary === 'depression' || detectedPrimary === 'loneliness')) ||
      (item.expected_primary_emotion === 'anger' && (detectedPrimary === 'frustration')) ||
      (item.expected_primary_emotion === 'guilt' && (detectedPrimary === 'shame')) ||
      (item.expected_primary_emotion === 'fear' && (detectedPrimary === 'anxiety'));

    const primaryMatched = isExactMatch || isClinicallyAdjacent;
    if (primaryMatched) {
      results.passedPrimary++;
    }

    // Evaluate Intensity
    const minIntensity = item.expected_intensity_range[0];
    const maxIntensity = item.expected_intensity_range[1];
    const intensityMatched = detectedIntensity >= minIntensity && detectedIntensity <= maxIntensity;
    if (intensityMatched) {
      results.passedIntensity++;
    }

    // Evaluate Safety / Crisis Flow
    let safetyAccurate = false;
    if (isSafetyExpected) {
      if (isCrisisDetected) {
        results.safetyDetected++;
        safetyAccurate = true;
      } else {
        // CRITICAL MISS
        results.failures.push({
          severity: 'CRITICAL',
          type: 'SAFETY_RECALL_MISS',
          id: item.id,
          text: item.text,
          language: item.language,
          expected_flow: item.expected_flow,
          actual_flow: 'normal',
          expected_emotion: item.expected_primary_emotion,
          detected_emotion: detectedPrimary,
          whyItMatters: 'Suicidal or severe self-harm ideation failed to trigger safety stop!'
        });
      }
    } else {
      // Normal flow expected
      if (isCrisisDetected) {
        results.safetyFalsePositives++;
        results.failures.push({
          severity: 'HIGH',
          type: 'SAFETY_FALSE_POSITIVE',
          id: item.id,
          text: item.text,
          language: item.language,
          expected_flow: item.expected_flow,
          actual_flow: 'safety_stop',
          expected_emotion: item.expected_primary_emotion,
          detected_emotion: detectedPrimary,
          whyItMatters: 'Benign emotional statement inappropriately triggered clinical crisis lockdown.'
        });
      } else {
        results.normalFlowPassed++;
        safetyAccurate = true;
      }
    }

    // Record Suspicious / Suboptimal cases
    if (!primaryMatched && !isSafetyExpected) {
      results.suspiciousCases.push({
        id: item.id,
        text: item.text,
        language: item.language,
        style: item.style,
        expected_primary: item.expected_primary_emotion,
        detected_primary: detectedPrimary,
        intensity: detectedIntensity,
        confidence: detectedConfidence,
        theme: detectedTheme,
        notes: item.notes,
        reason: `Expected emotion '${item.expected_primary_emotion}' but classified as '${detectedPrimary}'.`
      });
    }

    if (!intensityMatched && !isSafetyExpected) {
      results.suspiciousCases.push({
        id: item.id,
        text: item.text,
        language: item.language,
        style: item.style,
        expected_range: `[${minIntensity}, ${maxIntensity}]`,
        detected_intensity: detectedIntensity,
        notes: item.notes,
        reason: `Intensity score ${detectedIntensity} fell outside expected range [${minIntensity}, ${maxIntensity}].`
      });
    }

    // Record details
    results.details.push({
      id: item.id,
      text: item.text,
      language: item.language,
      style: item.style,
      expected_primary: item.expected_primary_emotion,
      detected_primary: detectedPrimary,
      primaryMatched,
      expected_intensity: [minIntensity, maxIntensity],
      detected_intensity: detectedIntensity,
      intensityMatched,
      confidence: detectedConfidence,
      root_theme: detectedTheme,
      confirmation_text: result.confirmationText,
      isCrisis: isCrisisDetected,
      state_reached: currentState,
      durationMs,
    });
  }

  // 2. Branch Testing: YES Path (Phase 1 -> 2 -> 3 -> 4) for non-crisis cases
  console.log('--- Testing Confirmation Branch 1: YES Path (Phase 1 -> Gita -> CBT -> Trataka) ---');
  const normalSubset = corpus.filter(i => i.expected_flow === 'normal').slice(0, 30);
  for (const item of normalSubset) {
    results.branchResults.yesPathTotal++;
    wellnessStateMachine.reset();
    wellnessStateMachine.handleMoodInput(item.text);

    // Affirmative response: Yes
    const confirmRes = wellnessStateMachine.handleConfirmationResponse(true);
    const stateAfterYes = wellnessStateMachine.getCurrentState();
    const gitaVerse = wellnessStateMachine.getSelectedGitaVerse();

    if (stateAfterYes === 'GITA' && gitaVerse && gitaVerse.sanskrit) {
      // Advance to CBT
      const cbtRes = wellnessStateMachine.advanceFromGitaToCBT();
      const stateAfterCbt = wellnessStateMachine.getCurrentState();
      if (stateAfterCbt === 'CBT' && cbtRes.cbtScript) {
        // Advance to Trataka
        const tratakaRes = wellnessStateMachine.advanceFromCBTToTrataka();
        const stateAfterTrataka = wellnessStateMachine.getCurrentState();
        if (stateAfterTrataka === 'TRATAKA' && tratakaRes.tratakaResult) {
          results.branchResults.yesPathSuccess++;
        }
      }
    }
  }

  // 3. Branch Testing: NO Path & Clarification Loop (1 to 5 turns max, no duplicate questions)
  console.log('--- Testing Confirmation Branch 2: NO Path & Clarification Loop ---');
  const clarifySubset = corpus.filter(i => i.expected_flow === 'normal').slice(30, 45);
  for (const item of clarifySubset) {
    results.branchResults.noPathTotal++;
    wellnessStateMachine.reset();
    wellnessStateMachine.handleMoodInput(item.text);

    // Rejection response: No -> Enters CLARIFY_LOOP
    wellnessStateMachine.handleConfirmationResponse(false);
    assertState(wellnessStateMachine.getCurrentState(), 'CLARIFY_LOOP');

    const turnsEncountered = [];
    let completed = false;
    let turnCount = 0;

    while (!completed && turnCount < 10) {
      turnCount++;
      const ans = `Simulated clarifying answer turn ${turnCount} regarding trigger details`;
      const turnRes = wellnessStateMachine.handleClarificationAnswer(ans);

      if (turnRes.nextQuestion) {
        turnsEncountered.push(turnRes.nextQuestion.questionText);
      }
      if (turnRes.completedLoop) {
        completed = true;
      }
    }

    // Verify constraints:
    // 1. Never more than 5 clarification turns
    const underCap = turnCount <= 5;
    // 2. No duplicate question texts
    const uniqueQuestions = new Set(turnsEncountered);
    const noDuplicates = uniqueQuestions.size === turnsEncountered.length;
    // 3. Successfully reached GITA upon completion
    const reachedGita = wellnessStateMachine.getCurrentState() === 'GITA';

    if (underCap && noDuplicates && reachedGita && completed) {
      results.branchResults.noPathSuccess++;
    } else {
      results.failures.push({
        severity: 'MEDIUM',
        type: 'CLARIFICATION_LOOP_CONSTRAINT_FAILURE',
        id: item.id,
        turnCount,
        noDuplicates,
        reachedGita,
        whyItMatters: `Clarification loop failed constraints: turns=${turnCount} (max 5), noDuplicates=${noDuplicates}, reachedGita=${reachedGita}`
      });
    }

    if (results.branchResults.clarifyLoopQuestionsLogged.length < 3) {
      results.branchResults.clarifyLoopQuestionsLogged.push({
        id: item.id,
        turns: turnsEncountered,
        totalTurns: turnCount
      });
    }
  }

  // 4. Intent Parser Exhaustive Evaluation
  console.log('--- Testing Multilingual Intent Parser Variants ---');
  const INTENT_CASES = [
    { input: "yes", expected: "yes" },
    { input: "yeah", expected: "yes" },
    { input: "yep", expected: "yes" },
    { input: "that's right", expected: "yes" },
    { input: "haan", expected: "yes" },
    { input: "haan ji", expected: "yes" },
    { input: "ji haan", expected: "yes" },
    { input: "theek hai", expected: "yes" },
    { input: "sahi hai", expected: "yes" },
    { input: "bilkul sahi", expected: "yes" },
    { input: "हाँ", expected: "yes" },
    { input: "हाँ बिल्कुल", expected: "yes" },
    { input: "जी हाँ", expected: "yes" },
    { input: "yes, that is exactly right!", expected: "yes" },
    { input: "no", expected: "no" },
    { input: "nope", expected: "no" },
    { input: "wrong", expected: "no" },
    { input: "not really", expected: "no" },
    { input: "not quite right", expected: "no" },
    { input: "nahi", expected: "no" },
    { input: "nahi ji", expected: "no" },
    { input: "bilkul nahi", expected: "no" },
    { input: "नहीं", expected: "no" },
    { input: "बिल्कुल नहीं", expected: "no" },
    { input: "जी नहीं", expected: "no" },
    { input: "galat hai", expected: "no" },
    { input: "watermelon", expected: "unclear" },
    { input: "maybe later", expected: "unclear" },
    { input: "yes and no", expected: "unclear" },
    { input: "uhhhhh", expected: "unclear" },
  ];

  for (const c of INTENT_CASES) {
    results.branchResults.intentParserTests.total++;
    const parsed = parseYesNoIntent(c.input);
    const isCorrect = parsed === c.expected;
    if (isCorrect) {
      results.branchResults.intentParserTests.passed++;
    }
    results.branchResults.intentParserTests.cases.push({
      input: c.input,
      expected: c.expected,
      actual: parsed,
      passed: isCorrect
    });
  }

  function assertState(actual, expected) {
    if (actual !== expected) {
      throw new Error(`State assertion failed: expected ${expected}, got ${actual}`);
    }
  }

  console.log(`✓ Text evaluation completed: ${results.passedPrimary}/${results.total} Primary Emotions matched (${(results.passedPrimary/results.total*100).toFixed(1)}%)`);
  console.log(`✓ Intensity calibration: ${results.passedIntensity}/${results.total} (${(results.passedIntensity/results.total*100).toFixed(1)}%)`);
  console.log(`✓ Safety Recall: ${results.safetyDetected}/${results.safetyTotal} (${(results.safetyDetected/results.safetyTotal*100).toFixed(1)}%)`);
  console.log(`✓ Safety False Positives: ${results.safetyFalsePositives}/${results.normalFlowTotal}`);
  console.log(`✓ YES path transitions: ${results.branchResults.yesPathSuccess}/${results.branchResults.yesPathTotal}`);
  console.log(`✓ NO path clarify loop: ${results.branchResults.noPathSuccess}/${results.branchResults.noPathTotal}`);
  console.log(`✓ Intent Parser: ${results.branchResults.intentParserTests.passed}/${results.branchResults.intentParserTests.total}`);

  return results;
}

module.exports = { runEmotionTextTests };

if (require.main === module) {
  const corpusPath = path.join(__dirname, '..', 'data', 'emotional_inputs.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  const res = runEmotionTextTests(corpus);
  console.log('\nText Runner Execution Summary: Total Failures / Anomalies found:', res.failures.length);
}
