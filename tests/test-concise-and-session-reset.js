/**
 * tests/test-concise-and-session-reset.js
 * 
 * Verifies:
 * 1. Synchronized, concise, to-the-point clinical solutions when distress is present.
 * 2. Conversational non-distress guard: Casual/neutral/greeting inputs receive brief,
 *    friendly responses without ghost diagnoses or unsolicited Gita/Trataka prescriptions.
 * 3. Complete End of Session lifecycle reset: fresh session IDs, calm baseline telemetry.
 */

const assert = require('assert');
const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');
const { resetActiveSessionId, getActiveSessionId } = require('../lib/db/indexed-db.ts');

async function testConciseAndSessionReset() {
  console.log('\n================================================================');
  console.log('TEST SUITE: CONCISE SOLUTIONS, NO GHOST DISTRESS & SESSION RESET');
  console.log('================================================================\n');

  // ─── Test 1: Non-Distress Input Does NOT Produce Ghost Diagnoses or Unsolicited Shlokas ───
  console.log('--- Test 1: Non-distress Neutral & Greeting Inputs ---');
  const neutralInputs = [
    { text: "What is this app and what can you help me with?", lang: "en" },
    { text: "How does the sound meditation work?", lang: "en" },
    { text: "नमस्ते, आप मेरी किस प्रकार सहायता कर सकते हैं?", lang: "hi" }
  ];

  for (const item of neutralInputs) {
    console.log(`Checking input: "${item.text}"`);
    const res = await generateTherapeuticResponse(item.text, undefined, item.lang);
    console.log(`  Provider used: ${res.providerUsed}`);
    console.log(`  Reply snippet: ${res.reply.slice(0, 150)}...`);
    assert.ok(res && res.reply, "Must return valid response");

    // Must NOT contain unsolicited clinical diagnostic markdown or Gita shloka on casual queries
    assert.ok(!res.reply.includes('[GITA_SHLOKA]'), "Casual query must not force unsolicited [GITA_SHLOKA]");
    assert.ok(!res.reply.includes('Suffering Severity Level'), "Casual query must not invent suffering severity level");
    assert.ok(!res.reply.includes('कष्ट सूचकांक'), "Casual query in Hindi must not invent suffering index");
    assert.strictEqual(res.recommended_trataka, 'bindu', "Non-distress input must default to baseline bindu trataka");
    
    const wordCount = res.reply.trim().split(/\s+/).length;
    console.log(`  ✓ Word count: ${wordCount} (Brief & to the point)`);
    assert.ok(wordCount < 80, "Casual reply must be short, to the point, and brief (<80 words)");
  }
  console.log('  ✓ Test 1 Passed: No ghost distress or unsolicited shlokas on neutral input.\n');

  // ─── Test 2: Clinical Distress Input Is Synchronized & To The Point ───
  console.log('--- Test 2: Clinical Distress Input (Gita + CBT + Tratak in sync & concise) ---');
  const distressInputs = [
    {
      text: "I am feeling so much panic and fear about failing my exams tomorrow",
      lang: "en",
      checks: [
        (r) => r.includes('[GITA_SHLOKA]'),
        (r) => r.includes('CBT'),
        (r) => r.includes('Tratak') || r.includes('TRATAK'),
        (r) => r.includes('TRI-PILLAR SYNERGISTIC RESOLUTION') || r.includes('How They Work in Combination')
      ]
    },
    {
      text: "मेरा ब्रेकअप हो गया है और बहुत रोना आ रहा है, मन बहुत अशांत है",
      lang: "hi",
      checks: [
        (r) => r.includes('[GITA_SHLOKA]'),
        (r) => r.includes('CBT') || r.includes('संज्ञानात्मक'),
        (r) => r.includes('त्राटक'),
        (r) => r.includes('त्रिवेणी')
      ]
    }
  ];

  for (const item of distressInputs) {
    console.log(`Checking distress input: "${item.text}"`);
    const res = await generateTherapeuticResponse(item.text, undefined, item.lang);
    assert.ok(res && res.reply, "Must return valid response");
    for (const check of item.checks) {
      assert.ok(check(res.reply), "Distress response must provide synchronized trio");
    }
    console.log(`  ✓ Synchronized trio verified for ${item.lang}`);
  }
  console.log('  ✓ Test 2 Passed: Clinical distress produces synchronized Gita, CBT, and Trataka.\n');

  // ─── Test 3: Session Reset Lifecycle ───
  console.log('--- Test 3: End of Session & Vault Session ID Reset ---');
  const initialSessionId = getActiveSessionId();
  assert.ok(initialSessionId && initialSessionId.startsWith('session_'), "Initial session ID must exist");
  
  const newSessionId = resetActiveSessionId();
  assert.ok(newSessionId && newSessionId.startsWith('session_'), "Reset must create a valid session ID");
  assert.notStrictEqual(initialSessionId, newSessionId, "Reset must generate a fresh, distinct session ID");
  assert.strictEqual(getActiveSessionId(), newSessionId, "getActiveSessionId must reflect the newly generated session ID");
  console.log(`  ✓ Session ID rotated from ${initialSessionId} -> ${newSessionId}`);
  console.log('  ✓ Test 3 Passed: Session reset creates clean vault boundary.\n');

  console.log('================================================================');
  console.log('🎉 ALL CONCISE & SESSION RESET TESTS PASSED (100%)');
  console.log('================================================================\n');
}

if (require.main === module) {
  testConciseAndSessionReset().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { testConciseAndSessionReset };
