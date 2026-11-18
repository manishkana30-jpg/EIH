import { generateTherapeuticResponse } from '../lib/services/therapist-engine.ts';

const testCases = [
  {
    name: 'Housing crisis (English)',
    query: 'my landlord is telling to leave the house',
    expectedContext: /housing|landlord|evict|vacate|leave.*house/i,
    expectedProvider: /Keyless Healer/i,
  },
  {
    name: 'Housing crisis (Hindi)',
    query: 'मकान मालिक घर खाली करने को कह रहा है',
    expectedContext: /मकान मालिक|घर खाली|बेदखली|आशियाने/i,
    expectedProvider: /Keyless Healer/i,
  },
  {
    name: 'Eviction notice (English)',
    query: 'i received an eviction notice and have nowhere to go',
    expectedContext: /housing|eviction|vacate|leave.*home/i,
    expectedProvider: /Keyless Healer/i,
  },
  {
    name: 'Job loss (English)',
    query: 'i got fired from my job today and have no income',
    expectedContext: /job|livelihood|career/i,
    expectedProvider: /Keyless Healer/i,
  },
  {
    name: 'Casual Greeting (English - should remain conversational)',
    query: 'hello there, how are you today?',
    expectedContext: /help|here with you/i,
    expectedProvider: /Conversational Empathy Responder/i,
  },
];

async function run() {
  console.log('--- RUNNING SITUATIONAL ADAPTABILITY VERIFICATION SUITE ---\n');
  let allPassed = true;

  for (const tc of testCases) {
    console.log(`[TEST] ${tc.name}`);
    console.log(`Query: "${tc.query}"`);
    const res = await generateTherapeuticResponse(tc.query);
    console.log(`Provider: ${res.providerUsed}`);

    const providerMatch = tc.expectedProvider.test(res.providerUsed);
    const contextMatch = tc.expectedContext.test(res.reply);
    const isDeflection = res.reply.includes('What specific situation or challenge would you like us to solve together?');

    console.log(`- Provider matched (${tc.expectedProvider}):`, providerMatch);
    console.log(`- Context matched (${tc.expectedContext}):`, contextMatch);

    if (tc.name.includes('Greeting')) {
      if (!providerMatch) {
        console.error('FAILED: Greeting was not handled by conversational responder!');
        allPassed = false;
      }
    } else {
      if (isDeflection) {
        console.error('FAILED: Real crisis/problem received generic conversational deflection!');
        allPassed = false;
      }
      if (!providerMatch || !contextMatch) {
        console.error('FAILED: Output did not meet expected provider or clinical context!');
        allPassed = false;
      }
      const hasGita = res.reply.includes('[GITA_SHLOKA]') || res.reply.includes('Gita');
      const hasCbt = /CBT|Cognitive/i.test(res.reply);
      const hasTrataka = /Trataka|Tratak|त्राटक/i.test(res.reply);
      console.log(`- Tri-Pillar Complete (Gita: ${hasGita}, CBT: ${hasCbt}, Trataka: ${hasTrataka})`);
      if (!hasGita || !hasCbt || !hasTrataka) {
        console.error('FAILED: Missing Tri-Pillar component in clinical response!');
        allPassed = false;
      }
    }
    console.log('');
  }

  if (allPassed) {
    console.log('>>> ALL VERIFICATION SUITE TESTS PASSED 100%! <<<');
  } else {
    console.error('>>> SOME TESTS FAILED! <<<');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
