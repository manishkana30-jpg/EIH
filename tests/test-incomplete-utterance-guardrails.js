import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  isIncompleteUtterance,
  getLocalizedIncompleteUtteranceResponse,
  isGreetingMessage,
  isTestMessage,
  queryPsychologyLibrary,
} from '../lib/knowledge/psychology-library-rag.ts';

import { learnAndIndexQuery } from '../lib/knowledge/self-learning-rag.ts';
import { generateTherapeuticResponse } from '../lib/services/therapist-engine.ts';

console.log('=== Running Incomplete Utterance & Active Listening Guardrails Test ===\n');

// 1. Verify Incomplete Utterance Detection
console.log('--- 1. Testing isIncompleteUtterance Detection ---');

const incompleteFragments = [
  'mein',
  'Mein',
  'MEIN',
  'main',
  'mai',
  'hum',
  'mujhe',
  'mera',
  'meri',
  'mere',
  'aur',
  'lekin',
  'toh',
  'mein toh',
  'mujhe laga',
  'मैं',
  'मुझे',
  'हम',
  'और',
  'लेकिन',
  'i',
  'I',
  'me',
  'my',
  'im',
  'i\'m',
  'and',
  'actually',
  'and then',
  'i was',
  'well',
  'so',
];

for (const frag of incompleteFragments) {
  assert.strictEqual(
    isIncompleteUtterance(frag),
    true,
    `isIncompleteUtterance should be true for speech fragment: "${frag}"`
  );
}
console.log(`  ✓ All ${incompleteFragments.length} incomplete speech fragments correctly identified as incomplete!`);

// 2. Verify Valid Non-Incomplete Messages (Greetings, Tests, Affirmations, Real Issues)
console.log('\n--- 2. Testing Non-Incomplete Exceptions ---');

const completeInputs = [
  { text: 'hello', reason: 'greeting' },
  { text: 'namaste', reason: 'greeting' },
  { text: 'mic test', reason: 'mic test' },
  { text: 'testing 123', reason: 'mic test' },
  { text: 'yes', reason: 'affirmation' },
  { text: 'no', reason: 'negation' },
  { text: 'ok', reason: 'affirmation' },
  { text: 'haan', reason: 'affirmation' },
  { text: 'nahi', reason: 'negation' },
  { text: 'depression', reason: 'clinical condition' },
  { text: 'I feel deeply sad and lost', reason: 'clinical problem' },
  { text: 'my heart is racing and I cannot breathe', reason: 'panic problem' },
  { text: 'mujhe bahut ghabrahat ho rahi hai', reason: 'Hindi clinical problem' },
];

for (const item of completeInputs) {
  assert.strictEqual(
    isIncompleteUtterance(item.text),
    false,
    `isIncompleteUtterance should be false for: "${item.text}" (${item.reason})`
  );
}
console.log(`  ✓ All ${completeInputs.length} complete/greeting/test inputs correctly excluded from incomplete!`);

// 3. Verify Localized Clarification Messages
console.log('\n--- 3. Testing Localized Clarification Messages ---');

const hiClarification = getLocalizedIncompleteUtteranceResponse('mein', 'hi', 'hi-IN');
assert.ok(hiClarification.includes('mein'), 'Hindi clarification must cite the caught snippet "mein"');
assert.ok(hiClarification.includes('अधूरी') || hiClarification.includes('विस्तार'), 'Hindi clarification must be empathetic');
console.log(`  ✓ Hindi clarification for "mein":\n    "${hiClarification}"`);

const enClarification = getLocalizedIncompleteUtteranceResponse('I was', 'en', 'en-US');
assert.ok(enClarification.includes('I was'), 'English clarification must cite the caught snippet');
assert.ok(enClarification.includes('listening attentively'), 'English clarification must reassure active listening');
console.log(`  ✓ English clarification for "I was":\n    "${enClarification}"`);

// 4. Verify RAG Query Interception for "mein"
console.log('\n--- 4. Testing RAG Interception for "mein" ---');
const ragResult = queryPsychologyLibrary('mein');
assert.strictEqual(ragResult, null, 'queryPsychologyLibrary("mein") MUST return null (no clinical diagnosis)');
console.log('  ✓ queryPsychologyLibrary("mein") cleanly returned null');

// 5. Verify Self-Learning RAG Guardrail for "mein"
console.log('\n--- 5. Testing Self-Learning RAG Guardrails ---');
async function testSelfLearningGuardrail() {
  const learnedResult = await learnAndIndexQuery('mein');
  assert.strictEqual(learnedResult, null, 'learnAndIndexQuery("mein") MUST return null and never learn single words');

  const learnedShort = await learnAndIndexQuery('and then i');
  assert.strictEqual(learnedShort, null, 'learnAndIndexQuery("and then i") MUST return null (< 15 chars / fragment)');
  console.log('  ✓ learnAndIndexQuery guardrail verified (blocks single words, pronouns, fragments)');
}

// 6. Verify End-to-End Therapist Engine for "mein"
console.log('\n--- 6. Testing End-to-End generateTherapeuticResponse for "mein" ---');
async function testE2ETherapist() {
  const res = await generateTherapeuticResponse('mein', undefined, 'hi', 'hi-IN');
  assert.strictEqual(res.providerUsed, 'Active Listening & Clarification Interceptor');
  assert.strictEqual(res.sources.length, 0, 'Must not return clinical sources for "mein"');
  assert.strictEqual(res.recommended_trataka, undefined, 'Must not prescribe Trataka for "mein"');
  assert.ok(!res.reply.includes('[GITA_SHLOKA]'), 'Must not recite Gita Shloka for "mein"');
  assert.ok(!res.reply.includes('CBT'), 'Must not give clinical CBT diagnosis for "mein"');
  assert.ok(res.reply.includes('mein'), 'Must acknowledge what was heard');
  console.log(`  ✓ E2E Response verified for "mein":\n    "${res.reply}"`);
  console.log(`  ✓ Provider: ${res.providerUsed}`);
  console.log(`  ✓ Trataka: ${res.recommended_trataka}`);
  console.log(`  ✓ Sources count: ${res.sources.length}`);

  // Test that a REAL clinical query still receives full 3-pillar therapy
  console.log('\n--- 7. Verifying Real Clinical Problem Still Receives Full Therapy ---');
  const clinicalRes = await generateTherapeuticResponse('I feel overwhelming panic and anxiety', undefined, 'en');
  assert.ok(clinicalRes.reply.length > 200, 'Real problem must receive complete therapeutic response');
  assert.ok(clinicalRes.sources.length > 0, 'Real problem must receive clinical sources');
  assert.ok(clinicalRes.recommended_trataka, 'Real problem must receive Trataka recommendation');
  console.log(`  ✓ Clinical query verified (Length: ${clinicalRes.reply.length}, Sources: ${clinicalRes.sources.length}, Trataka: ${clinicalRes.recommended_trataka})`);
}

// 7. Verify data/learned_psychology_documents.json Integrity
console.log('\n--- 8. Verifying Disk Data Integrity ---');
const dbPath = path.join(__dirname, '..', 'data', 'learned_psychology_documents.json');
const rawDb = fs.readFileSync(dbPath, 'utf-8');
const parsedDb = JSON.parse(rawDb);
assert.ok(Array.isArray(parsedDb), 'Database must be valid JSON array');
const meinFound = parsedDb.find((d) => d.id === 'learned_mein' || d.query_trigger === 'mein');
assert.strictEqual(meinFound, undefined, '"learned_mein" must not exist in data/learned_psychology_documents.json');
console.log(`  ✓ Database verified: ${parsedDb.length} documents, "learned_mein" is 100% purged!`);

async function run() {
  await testSelfLearningGuardrail();
  await testE2ETherapist();
  console.log('\n🎉 ALL INCOMPLETE UTTERANCE & ACTIVE LISTENING GUARDRAIL TESTS PASSED (100%)\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
