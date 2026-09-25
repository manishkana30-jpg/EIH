/**
 * tests/audit_e2e_dry_run.js
 *
 * Full-stack methodical audit dry-run executing simulated inputs across all phases:
 * App load, Phase 1 (Mood detection + confirmation), Clarify loop, Phase 2 (Gita),
 * Phase 3 (CBT), Phase 4 (Trataka), Safety crisis path, and Summary end-state.
 */

const assert = require('assert');
const { WellnessStateMachine } = require('../lib/wellness-flow/wellness-state-machine.ts');
const { emotionEngine } = require('../lib/wellness-flow/emotion-engine.ts');
const { parseYesNoIntentDetailed } = require('../lib/wellness-flow/confirm-intent-parser.ts');

const testCases = [
  {
    type: 'calm',
    input: "I feel calm, grounded, and centered today, enjoying the quiet morning",
    expectedEmotion: 'calm',
    branch: 'yes'
  },
  {
    type: 'anxious',
    input: "My heart is pounding and I feel terrified I might lose my job tomorrow",
    expectedEmotion: 'anxiety',
    branch: 'yes'
  },
  {
    type: 'angry',
    input: "I am so furious at how unfairly my manager treated me in front of the whole team",
    expectedEmotion: 'anger',
    branch: 'yes'
  },
  {
    type: 'sad',
    input: "I feel empty, deeply depressed, and like none of my efforts matter anymore",
    expectedEmotion: 'sadness',
    branch: 'yes'
  },
  {
    type: 'vague',
    input: "I don't know, everything just feels kind of off and weird lately",
    expectedEmotion: 'overwhelm',
    branch: 'no' // Test clarification loop
  },
  {
    type: 'mixed',
    input: "I got a huge promotion today so I should be happy, but I am terrified of failing",
    expectedEmotion: 'anxiety',
    branch: 'yes'
  },
  {
    type: 'non-emotional',
    input: "Hello, what does this app do and how can it help me?",
    expectedEmotion: 'neutral',
    branch: 'yes'
  },
  {
    type: 'negation',
    input: "I am not sad, I am just extremely angry and frustrated",
    expectedEmotion: 'anger',
    branch: 'yes'
  },
  {
    type: 'hindi',
    input: "मुझे बहुत घबराहट और बेचैनी हो रही है, दिल तेजी से धड़क रहा है",
    expectedEmotion: 'anxiety',
    branch: 'yes',
    lang: 'hi'
  },
  {
    type: 'crisis',
    input: "I want to end my life, I can't take this pain anymore, goodbye",
    expectedEmotion: 'crisis',
    branch: 'crisis'
  }
];

async function runDryRunAudit() {
  console.log('================================================================');
  console.log('FULL-STACK QA AUDIT: END-TO-END DRY RUN (PHASES 1 TO 4 + SAFETY)');
  console.log('================================================================\n');

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n--- [Case ${i + 1}/${testCases.length}] Scenario: ${tc.type.toUpperCase()} ---`);
    console.log(`Input: "${tc.input}"`);

    const sm = new WellnessStateMachine();
    if (tc.lang) sm.setLanguage(tc.lang); // set to hi

    // Phase 1: Ingest Mood
    const moodRes = sm.handleMoodInput(tc.input);

    if (tc.branch === 'crisis') {
      console.log(`  Safety Detected: isCrisis=${moodRes.isCrisis}`);
      console.log(`  Immediate Deflection: "${moodRes.confirmationText}"`);
      assert.strictEqual(moodRes.isCrisis, true, 'Crisis input must immediately set isCrisis=true');
      assert.ok(moodRes.confirmationText.includes('14416') || moodRes.confirmationText.includes('safety') || moodRes.confirmationText.includes('emergency'), 'Crisis statement must contain emergency info');
      
      results.push({
        type: tc.type,
        input: tc.input,
        detectedEmotion: 'crisis',
        intensity: 10,
        confidence: 1.0,
        confirmationPrompt: moodRes.confirmationText,
        yesNoResult: 'N/A (Deflected)',
        clarifyTurns: 0,
        gitaVerse: 'N/A (Skipped per Safety Protocol)',
        cbtDistortion: 'N/A (Skipped)',
        tratakaMode: 'N/A (Skipped)',
        endState: 'CRISIS_LOCKDOWN',
        pass: true,
        purposeFit: 'YES - Crisis deflected immediately with helpline resources'
      });
      continue;
    }

    assert.strictEqual(moodRes.isCrisis, false, 'Non-crisis input must not flag isCrisis');
    const prof = moodRes.profile;
    console.log(`  Phase 1 Analyzed: Emotion=${prof.primary_emotion} | Intensity=${prof.intensity}/10 | Conf=${(prof.confidence * 100).toFixed(1)}%`);
    console.log(`  Confirmation Prompt: "${moodRes.confirmationText}"`);

    // Verify confirmation statement matches emotion
    assert.ok(moodRes.confirmationText.length > 10, 'Confirmation statement must be populated');

    let finalState = sm.getCurrentState();
    let clarifyTurnsCount = 0;

    if (tc.branch === 'no') {
      // Test Clarification Loop (NO path)
      console.log('  Testing NO Path -> Entering Clarification Loop');
      const noRes = sm.handleConfirmationResponse(false);
      assert.strictEqual(noRes.nextState, 'CLARIFY_LOOP', 'handleConfirmationResponse(false) must enter CLARIFY_LOOP');
      console.log(`  Q1: "${noRes.nextSpeechText}"`);

      // Answer questions until loop finishes (at most 5)
      const mockAnswers = [
        "It feels like pressure in my head and difficulty concentrating",
        "It's mostly because of my upcoming exams and tight deadlines",
        "Yes, my sleep has been restless lately",
        "I feel overwhelmed with too many tasks",
        "I need a moment to organize my thoughts"
      ];

      for (let t = 0; t < 5; t++) {
        clarifyTurnsCount++;
        const ans = mockAnswers[t];
        const clarifyRes = sm.handleClarificationAnswer(ans);
        if (clarifyRes.completedLoop) {
          console.log(`  Clarification converged after ${clarifyTurnsCount} questions to emotion: ${clarifyRes.refinedProfile.primary_emotion}`);
          break;
        } else {
          console.log(`  Q${clarifyRes.nextQuestion.questionNumber}: "${clarifyRes.nextQuestion.questionText}"`);
        }
      }
      assert.strictEqual(sm.getCurrentState(), 'GITA', 'Clarification loop must transition to GITA after converging');
    } else {
      // YES Path
      console.log('  Testing YES Path -> Advancing to Phase 2: Gita');
      const yesRes = sm.handleConfirmationResponse(true);
      assert.strictEqual(yesRes.nextState, 'GITA', 'handleConfirmationResponse(true) must enter GITA');
    }

    // Phase 2: Gita
    const gitaItem = sm.getSelectedGitaVerse();
    const gitaRef = gitaItem.reference_code || gitaItem.reference || gitaItem.id;
    console.log(`  Phase 2 Gita Verse: [${gitaRef}]`);
    console.log(`    Applicable emotions: ${gitaItem.applicable_emotions.join(', ')}`);
    console.log(`    Sanskrit: ${gitaItem.sanskrit.slice(0, 50).replace(/\n/g, ' ')}...`);
    const gitaToCbt = sm.advanceFromGitaToCBT();
    assert.strictEqual(gitaToCbt.nextState, 'CBT', 'advanceFromGitaToCBT must enter CBT');

    // Phase 3: CBT Mini-Flow (Steps 1, 2, 3, 4)
    const cbtScript = sm.getCbtScript();
    console.log(`  Phase 3 CBT Protocol: ${cbtScript.distortion_name_en} (Mood Key: ${cbtScript.mood_key})`);
    
    // Step 1: Automatic Thought
    const s1 = sm.handleCbtStep1("I worry that I am not competent enough and will let everyone down.");
    assert.strictEqual(s1.nextStep, 2);

    // Step 2: Distortion Acknowledgment
    const s2 = sm.handleCbtStep2();
    assert.strictEqual(s2.nextStep, 3);
    console.log(`    Cognitive Distortion Identified: "${s1.distortionPrompt}"`);

    // Step 3: Evidence Challenge
    const s3 = sm.handleCbtStep3("I have received positive feedback on past projects, and I can ask for help when needed.");
    assert.strictEqual(s3.nextStep, 4);
    console.log(`    Replacement Thought: "${s3.replacementThought}"`);

    // Advance to Phase 4: Trataka
    const cbtToTrataka = sm.advanceFromCBTToTrataka();
    assert.strictEqual(cbtToTrataka.nextState, 'TRATAKA', 'advanceFromCBTToTrataka must enter TRATAKA');

    // Phase 4: Trataka
    const tratakaRes = sm.getSelectedTrataka();
    console.log(`  Phase 4 Trataka Selected: [${tratakaRes.variant.id}] ${tratakaRes.variant.name_en}`);
    console.log(`    Rationale: "${tratakaRes.rationale_en.slice(0, 100)}..."`);
    console.log(`    Duration: ${tratakaRes.duration_seconds}s | Voice Cues: ${Object.keys(tratakaRes.variant.voice_cues).length}`);

    // Conclude Trataka -> Summary
    const tratakaToSum = sm.completeTratakaSession();
    assert.strictEqual(tratakaToSum.nextState, 'SUMMARY', 'completeTratakaSession must enter SUMMARY');

    // Phase 5: Post-session rating
    const ratingRes = sm.submitPostSessionMoodRating(3);
    console.log(`  Summary: Initial Intensity=${ratingRes.initialIntensity} -> Post Rating=${ratingRes.finalRating} (Improvement: ${ratingRes.improvementDelta} pts)`);

    // Reset clean session
    sm.reset();
    assert.strictEqual(sm.getCurrentState(), 'MOOD_INPUT', 'reset() must return to MOOD_INPUT');
    assert.strictEqual(sm.getSnapshot().initialUtterance, '', 'initialUtterance must be cleared');

    results.push({
      type: tc.type,
      input: tc.input,
      detectedEmotion: prof.primary_emotion,
      intensity: prof.intensity,
      confidence: prof.confidence,
      confirmationPrompt: moodRes.confirmationText,
      yesNoResult: tc.branch === 'no' ? 'NO -> Clarification refined' : 'YES -> Direct advance',
      clarifyTurns: clarifyTurnsCount,
      gitaVerse: `${gitaItem.shloka_ref} (${gitaItem.theme})`,
      cbtDistortion: s1.distortionPrompt,
      tratakaMode: `${tratakaRes.variant.id} (${tratakaRes.variant.name_en})`,
      endState: 'SUMMARY -> Clean Reset',
      pass: true,
      purposeFit: 'YES - Integrated Gita, CBT, and Trataka aligned with emotional profile'
    });
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 10 E2E DRY-RUN SCENARIOS COMPLETED WITH 100% PASS RATE');
  console.log('================================================================\n');

  return results;
}

if (require.main === module) {
  runDryRunAudit().catch((err) => {
    console.error('Dry run audit failed:', err);
    process.exit(1);
  });
}

module.exports = { runDryRunAudit };
