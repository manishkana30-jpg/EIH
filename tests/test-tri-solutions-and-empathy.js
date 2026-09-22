const assert = require('assert');
const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function testTherapistEngineScenarios() {
  console.log('=== Testing Deep Psychological Understanding & Tri-Solution Integrity ===\n');

  const testCases = [
    {
      name: 'Financial & Debt Burden',
      query: 'test I have financial problems and I have more debts on me which is constantly a burden on my mind',
      expectedDistressKey: 'debt',
      expectedSections: ['**1.', '**2.', '**3.']
    },
    {
      name: 'Relationship Breakup',
      query: 'I broke up with my girl friend and my heart is aching',
      expectedDistressKey: 'breakup',
      expectedSections: ['**1.', '**2.', '**3.']
    },
    {
      name: 'Loneliness & Isolation',
      query: 'I feel completely alone and isolated with no one to talk to',
      expectedDistressKey: 'lonel',
      expectedSections: ['**1.', '**2.', '**3.']
    },
    {
      name: 'Family Conflict',
      query: 'I had a terrible fight and bitter argument with my family',
      expectedDistressKey: 'family',
      expectedSections: ['**1.', '**2.', '**3.']
    }
  ];

  for (const tc of testCases) {
    console.log(`Testing Case: "${tc.name}"`);
    const result = await generateTherapeuticResponse(tc.query, [], 'en', 'en-US');
    
    assert(result && result.reply, `Reply must not be empty for ${tc.name}`);
    console.log(`  ✓ Engine used: ${result.providerUsed}`);
    console.log(`  ✓ Response length: ${result.reply.length} chars`);

    // Verify response is NOT the repetitive listening loop
    assert(!result.reply.includes('I am listening to you with calm awareness. What is on your mind today'),
      `Failed on ${tc.name}: Got repetitive fallback loop!`);

    // Verify it does NOT include raw "Learned: ... Protocol"
    assert(!result.reply.includes('Learned:'),
      `Failed on ${tc.name}: Contained robotic "Learned:" string!`);

    // Verify all 3 Tri-Solution sections are present
    for (const sec of tc.expectedSections) {
      assert(result.reply.includes(sec), `Failed on ${tc.name}: Missing section ${sec}`);
    }
    console.log(`  ✓ All Tri-Solution sections (**1., **2., **3.) present`);

    // Verify Tratak is in the reply
    assert(result.reply.toLowerCase().includes('tratak'), `Failed on ${tc.name}: Missing Tratak in solution!`);
    console.log(`  ✓ Tratak neuro-ocular protocol verified`);

    // Verify Gita wisdom is in the reply
    assert(result.reply.toLowerCase().includes('gita') || result.reply.includes('भगवद्गीता'),
      `Failed on ${tc.name}: Missing Gita wisdom in solution!`);
    console.log(`  ✓ Gita wisdom verified`);

    // Verify CBT is in the reply
    assert(result.reply.toLowerCase().includes('cbt') || result.reply.toLowerCase().includes('cognitive'),
      `Failed on ${tc.name}: Missing CBT in solution!`);
    console.log(`  ✓ CBT cognitive reframe verified\n`);
  }

  console.log('✅ ALL PSYCHOLOGICAL UNDERSTANDING & TRI-SOLUTION TESTS PASSED PERFECTLY!\n');
}

testTherapistEngineScenarios().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
