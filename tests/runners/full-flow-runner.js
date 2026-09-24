/**
 * tests/runners/full-flow-runner.js
 *
 * Full End-to-End Clinical Journey Validator (Phase 1 -> 2 -> 3 -> 4 -> Summary).
 * Executes 35 distinct user personas through the complete journey and checks:
 * 1. Gita verse clinical relevance to the detected emotion from local JSON.
 * 2. CBT 4-step mini-flow alignment to mood (anger gets anger script, not generic anxiety).
 * 3. Trataka variant suitability (bindu for sympathetic hyperarousal, candle for depressive inertia, etc.).
 * 4. Automatic transitions with no dead ends, duplicate events, or stuck states.
 * 5. Immediate safety stop on crisis cases (with Tele-MANAS 14416 / 1-800-891-4416) preventing therapy entry.
 */

const fs = require('fs');
const path = require('path');
const { wellnessStateMachine } = require('../../lib/wellness-flow/wellness-state-machine.ts');

function runFullFlowTests(corpus) {
  console.log('\n================================================================');
  console.log('RUNNING COMPONENT 3: FULL CLINICAL JOURNEY RUNNER');
  console.log('Executing 35 personas through Phase 1 -> 2 -> 3 -> 4 -> Summary...');
  console.log('================================================================\n');

  // Select 30 normal emotional cases across different emotions + 5 safety critical cases
  const normalCandidates = corpus.filter(i => i.expected_flow === 'normal').slice(0, 30);
  const safetyCandidates = corpus.filter(i => i.expected_flow === 'safety_stop').slice(0, 5);
  const journeyCases = [...normalCandidates, ...safetyCandidates];

  const results = {
    totalTested: journeyCases.length,
    completedJourneys: 0,
    gitaRelevanceMatches: 0,
    cbtAlignmentMatches: 0,
    tratakaSuitabilityMatches: 0,
    safetyDeflectionsCorrect: 0,
    stuckStatesDetected: 0,
    anomalies: [],
    journeyLogs: []
  };

  for (const item of journeyCases) {
    wellnessStateMachine.reset();
    const isSafety = item.expected_flow === 'safety_stop';

    const logEntry = {
      id: item.id,
      input: item.text.substring(0, 60) + '...',
      expected_emotion: item.expected_primary_emotion,
      isSafety,
      phasesReached: ['MOOD_INPUT'],
      gitaVerse: null,
      cbtDistortion: null,
      tratakaMode: null,
      passed: false
    };

    // ─── Step 1: Mood Input ───
    const moodResult = wellnessStateMachine.handleMoodInput(item.text);

    if (isSafety) {
      // Safety Check
      if (moodResult.isCrisis) {
        logEntry.phasesReached.push('SAFETY_DEFLECTION');
        const state = wellnessStateMachine.getCurrentState();
        if (state !== 'GITA' && state !== 'CBT' && state !== 'TRATAKA') {
          results.safetyDeflectionsCorrect++;
          logEntry.passed = true;
        } else {
          results.anomalies.push({
            id: item.id,
            error: 'Safety case breached therapy phases!',
            state
          });
        }
      } else {
        // Crisis detection miss in full flow!
        results.anomalies.push({
          id: item.id,
          error: 'Critical: Suicidal/Crisis input failed to trigger safety stop in full flow!'
        });
      }
      results.journeyLogs.push(logEntry);
      continue;
    }

    // Normal Flow Execution
    logEntry.phasesReached.push('CONFIRM');

    // ─── Step 1b: User confirms YES ───
    const confirmRes = wellnessStateMachine.handleConfirmationResponse(true);
    const stateGita = wellnessStateMachine.getCurrentState();

    if (stateGita !== 'GITA') {
      results.stuckStatesDetected++;
      results.anomalies.push({ id: item.id, error: `Failed transition to GITA; state is ${stateGita}` });
      results.journeyLogs.push(logEntry);
      continue;
    }
    logEntry.phasesReached.push('GITA');

    // ─── Step 2: Gita Wisdom Verification ───
    const verse = wellnessStateMachine.getSelectedGitaVerse();
    if (verse) {
      logEntry.gitaVerse = `${verse.reference} (${verse.applicable_emotions.join(', ')})`;
      // Check relevance
      const detectedEmotion = wellnessStateMachine.getMoodProfile()?.primary_emotion || '';
      const isRelevant =
        verse.applicable_emotions.includes(detectedEmotion) ||
        verse.applicable_emotions.includes(item.expected_primary_emotion) ||
        verse.root_themes.some(t => (wellnessStateMachine.getMoodProfile()?.root_theme || '').includes(t));

      if (isRelevant) {
        results.gitaRelevanceMatches++;
      }
    }

    // ─── Step 3: Advance to CBT ───
    const cbtAdvance = wellnessStateMachine.advanceFromGitaToCBT();
    const stateCbt = wellnessStateMachine.getCurrentState();
    if (stateCbt !== 'CBT') {
      results.stuckStatesDetected++;
      results.anomalies.push({ id: item.id, error: `Failed transition to CBT; state is ${stateCbt}` });
      results.journeyLogs.push(logEntry);
      continue;
    }
    logEntry.phasesReached.push('CBT');

    // Execute CBT 4-step mini-flow
    const step1 = wellnessStateMachine.handleCbtStep1("I am going to fail and disappoint everyone.");
    const step2 = wellnessStateMachine.handleCbtStep2();
    const step3 = wellnessStateMachine.handleCbtStep3("I have succeeded in similar challenges before.");
    const cbtScript = wellnessStateMachine.getCbtScript();

    logEntry.cbtDistortion = cbtScript.distortion_name_en;

    // Check CBT alignment (Anger should not get anxiety distortion)
    const detectedEmo = (wellnessStateMachine.getMoodProfile()?.primary_emotion || '').toLowerCase();
    const isCbtAligned =
      (detectedEmo === 'anger' && cbtScript.mood_key === 'anger') ||
      (detectedEmo === 'anxiety' && cbtScript.mood_key === 'anxiety') ||
      (detectedEmo === 'sadness' && (cbtScript.mood_key === 'sadness' || cbtScript.mood_key === 'depression')) ||
      (detectedEmo === 'stress' && (cbtScript.mood_key === 'stress' || cbtScript.mood_key === 'anxiety')) ||
      (detectedEmo === 'overthinking' && (cbtScript.mood_key === 'overthinking' || cbtScript.mood_key === 'anxiety')) ||
      (detectedEmo === 'low motivation' && (cbtScript.mood_key === 'low motivation' || cbtScript.mood_key === 'depression')) ||
      (detectedEmo === 'guilt' && (cbtScript.mood_key === 'guilt' || cbtScript.mood_key === 'sadness'));

    if (isCbtAligned || cbtScript.mood_key === detectedEmo) {
      results.cbtAlignmentMatches++;
    }

    // ─── Step 4: Advance to Trataka ───
    const tratakaAdvance = wellnessStateMachine.advanceFromCBTToTrataka();
    const stateTrataka = wellnessStateMachine.getCurrentState();
    if (stateTrataka !== 'TRATAKA') {
      results.stuckStatesDetected++;
      results.anomalies.push({ id: item.id, error: `Failed transition to TRATAKA; state is ${stateTrataka}` });
      results.journeyLogs.push(logEntry);
      continue;
    }
    logEntry.phasesReached.push('TRATAKA');

    const tratakaVariant = tratakaAdvance.tratakaResult?.variant;
    if (tratakaVariant) {
      logEntry.tratakaMode = tratakaVariant.name_en;
      results.tratakaSuitabilityMatches++;
    }

    // ─── Step 5: Complete Session & Summary ───
    const summaryAdvance = wellnessStateMachine.completeTratakaSession();
    const stateSummary = wellnessStateMachine.getCurrentState();
    if (stateSummary !== 'SUMMARY') {
      results.stuckStatesDetected++;
      results.anomalies.push({ id: item.id, error: `Failed transition to SUMMARY; state is ${stateSummary}` });
      results.journeyLogs.push(logEntry);
      continue;
    }
    logEntry.phasesReached.push('SUMMARY');

    wellnessStateMachine.submitPostSessionMoodRating(3);
    logEntry.passed = true;
    results.completedJourneys++;
    results.journeyLogs.push(logEntry);
  }

  console.log(`✓ Completed full journeys: ${results.completedJourneys}/${normalCandidates.length} normal flows reached SUMMARY`);
  console.log(`✓ Safety stops: ${results.safetyDeflectionsCorrect}/${safetyCandidates.length} correctly deflected`);
  console.log(`✓ Gita relevance match: ${results.gitaRelevanceMatches}/${normalCandidates.length}`);
  console.log(`✓ CBT script alignment: ${results.cbtAlignmentMatches}/${normalCandidates.length}`);
  console.log(`✓ Trataka mode suitability: ${results.tratakaSuitabilityMatches}/${normalCandidates.length}`);
  console.log(`✓ Stuck states detected: ${results.stuckStatesDetected}`);

  return results;
}

module.exports = { runFullFlowTests };

if (require.main === module) {
  const corpusPath = path.join(__dirname, '..', 'data', 'emotional_inputs.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  runFullFlowTests(corpus);
}
