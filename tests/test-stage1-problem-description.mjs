import assert from 'node:assert';
import { generateTherapeuticResponse } from '../lib/services/therapist-engine.ts';
import { parseTherapeuticStages } from '../lib/audio/karaoke-tokenizer.ts';
import { emotionEngine } from '../lib/wellness-flow/emotion-engine.ts';

async function run() {
  console.log('=== TEST 1: Stage 1 Problem Description Extraction & Vocalization ===');

  const testCases = [
    {
      name: 'Housing Crisis (EN)',
      query: 'my landlord is telling to leave the house',
      expectedKeywordsInProblem: /housing|landlord|evict|vacate|leave.*house/i,
    },
    {
      name: 'Housing Crisis (HI)',
      query: 'मकान मालिक घर खाली करने को कह रहा है',
      expectedKeywordsInProblem: /मकान मालिक|घर खाली|बेदखली|आशियाने/i,
    },
    {
      name: 'Job Loss (EN)',
      query: 'i got fired from my job today and have no savings left',
      expectedKeywordsInProblem: /job|livelihood|career/i,
    },
    {
      name: 'Grief / Bereavement (EN)',
      query: 'my father passed away yesterday and I am heartbroken',
      expectedKeywordsInProblem: /grief|bereavement|loss|loved one/i,
    },
  ];

  for (const tc of testCases) {
    console.log(`\nTesting: [${tc.name}] Query: "${tc.query}"`);
    const response = await generateTherapeuticResponse(tc.query);

    const stages = parseTherapeuticStages(response.reply);
    assert.ok(stages.isStructured, 'Response must be structured into 4 stages');
    assert.ok(stages.stages.length >= 3, 'Must have at least 3 stages');

    const stage1 = stages.stages[0];
    assert.strictEqual(stage1.stage, 1, 'Stage 1 must be sanctuary stage');

    console.log('Stage 1 Title/Emotion:', stage1.title);
    console.log('Stage 1 Summary (Problem Description):', stage1.meta.summary);
    console.log('Stage 1 SpeechText (Spoken by TTS):', stage1.speechText);

    assert.ok(stage1.meta.summary, 'Stage 1 meta.summary MUST NOT be empty');
    assert.ok(
      tc.expectedKeywordsInProblem.test(stage1.meta.summary),
      `Stage 1 meta.summary must contain specific problem keywords. Got: "${stage1.meta.summary}"`
    );

    assert.ok(
      tc.expectedKeywordsInProblem.test(stage1.speechText),
      `Stage 1 speechText must vocalize the specific problem description. Got: "${stage1.speechText}"`
    );

    console.log(`  ✓ Passed: Stage 1 explicitly describes the user's specific problem in UI and Voice!`);
  }

  console.log('\n=== TEST 2: Wellness Flow Confirmation Statement ===');
  const wellnessCases = [
    {
      name: 'Housing crisis in wellness flow',
      input: 'my landlord is telling to leave the house',
      expectedPhrase: /housing|eviction|leave.*house|landlord|vacate/i,
    },
    {
      name: 'Job loss in wellness flow',
      input: 'i lost my job yesterday',
      expectedPhrase: /job|livelihood/i,
    },
    {
      name: 'Grief in wellness flow',
      input: 'my mother passed away',
      expectedPhrase: /losing someone dear|loss|grief/i,
    },
  ];

  for (const wc of wellnessCases) {
    const profile = emotionEngine.analyze(wc.input);
    const confirmation = emotionEngine.generateConfirmationStatement(profile, 'en');
    console.log(`\nWellness [${wc.name}]:`);
    console.log(`- Detected Domain: ${profile.trigger_domain}`);
    console.log(`- Confirmation Statement: "${confirmation}"`);

    assert.ok(
      !confirmation.includes('the emotional weight and inner turmoil you are experiencing right now'),
      'Confirmation statement must NOT fall back to generic "emotional weight and inner turmoil"!'
    );

    assert.ok(
      wc.expectedPhrase.test(confirmation),
      `Confirmation statement must describe specific problem. Got: "${confirmation}"`
    );
    console.log('  ✓ Passed: Confirmation describes exact problem to user!');
  }

  console.log('\n🎉 ALL STAGE 1 & CONFIRMATION PROBLEM DESCRIPTION TESTS PASSED 100%!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
