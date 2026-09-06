import assert from 'node:assert';
import {
  isGreetingMessage,
  isTestMessage,
  GREETING_RESPONSE,
  TEST_RESPONSE,
  queryPsychologyLibrary,
} from '../lib/knowledge/psychology-library-rag.ts';
import { generateTherapeuticResponse } from '../lib/services/therapist-engine.ts';

console.log('=== Running Greeting and Mic Test Fast-Path Verification ===');

// 1. Test Greeting Interception
const greetingSamples = [
  'hello',
  'Hello',
  'HELLO',
  'hello!',
  'hi',
  'Hi',
  'hey',
  'Hey',
  'good morning',
  'Good Morning',
  'namaste',
  'Namaste',
  'hello there',
  'hi there',
  'hey there',
  'hello how are you',
];

for (const sample of greetingSamples) {
  assert.strictEqual(isGreetingMessage(sample), true, `isGreetingMessage should be true for "${sample}"`);
  assert.strictEqual(queryPsychologyLibrary(sample), null, `queryPsychologyLibrary should be null for "${sample}"`);
}
console.log('✓ Verified: isGreetingMessage and RAG null return for all greeting variants');

// 2. Test Mic Test Interception
const testSamples = [
  'test',
  'Test',
  'TEST',
  'testing',
  'Testing',
  'mic test',
  'Mic test',
  'testing mic',
  'is mic working',
  'can you hear me',
  'sound check',
  'mic check',
  'test 123',
  'testing 1 2 3',
];

for (const sample of testSamples) {
  assert.strictEqual(isTestMessage(sample), true, `isTestMessage should be true for "${sample}"`);
  assert.strictEqual(queryPsychologyLibrary(sample), null, `queryPsychologyLibrary should be null for "${sample}"`);
}
console.log('✓ Verified: isTestMessage and RAG null return for all test variants');

// 3. Test End-to-End generateTherapeuticResponse
async function runE2ETests() {
  // Test Greeting E2E
  const greetingRes = await generateTherapeuticResponse('hello');
  assert.strictEqual(greetingRes.reply, GREETING_RESPONSE, 'Greeting reply must be exactly "Hello, how can I help you?"');
  assert.strictEqual(greetingRes.reply, 'Hello, how can I help you?');
  assert.strictEqual(greetingRes.recommended_trataka, undefined, 'Greeting must not prescribe Trataka');
  console.log(`✓ E2E Greeting response verified: "${greetingRes.reply}" (Trataka: ${greetingRes.recommended_trataka})`);

  // Test Mic Test E2E
  const testRes = await generateTherapeuticResponse('mic test');
  assert.strictEqual(testRes.reply, TEST_RESPONSE, 'Test reply must be exactly "Mic is running fine."');
  assert.strictEqual(testRes.reply, 'Mic is running fine.');
  assert.strictEqual(testRes.recommended_trataka, undefined, 'Mic test must not prescribe Trataka');
  console.log(`✓ E2E Mic Test response verified: "${testRes.reply}" (Trataka: ${testRes.recommended_trataka})`);

  // Test Clinical E2E (ensure clinical triggers are not broken)
  const clinicalRes = await generateTherapeuticResponse('I feel panic and my heart is racing');
  assert.ok(clinicalRes.reply.length > 30, 'Clinical response should provide therapeutic grounding');
  console.log(`✓ E2E Clinical response verified (length: ${clinicalRes.reply.length})`);

  console.log('\n🎉 ALL GREETING AND MIC TEST VERIFICATION TESTS PASSED (100%)\n');
}

runE2ETests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
