/**
 * tests/test-gita-clinical-tratak-trio.js
 * 
 * Verifies that for ANY user situation, the healer generates the 3-pillar solution:
 * 1. Bhagavad Gita Reframing & Shloka (श्रीमद्भगवद्गीता)
 * 2. Clinical Cognitive Neuroscience (CBT & Polyvagal Somatics)
 * 3. Tratak Neuro-Ocular Protocol (त्राटक ध्यान)
 */

const assert = require('assert');
const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');
const { findGitaWisdom } = require('../lib/knowledge/gita-library.ts');
const { resolveTratakaPrescription } = require('../lib/knowledge/trataka-recommendations.ts');
const { isGreetingMessage, isTestMessage } = require('../lib/knowledge/psychology-library-rag.ts');

async function testGitaClinicalTratakTrio() {
  console.log('\n================================================================');
  console.log('TRI-PILLAR THERAPEUTIC ENGINE TEST SUITE (GITA + CLINICAL + TRATAK)');
  console.log('================================================================\n');

  // 1. Verify Fast-Path Greetings and Mic-Tests remain unaffected
  console.log('--- 1. Testing Conversational Fast-Paths (Greetings & Hardware Check) ---');
  const greetingRes = await generateTherapeuticResponse("Namaste! How are you?");
  assert.strictEqual(greetingRes.reply, "Hello, how can I help you?", "Greetings must remain brief fast-path");
  assert.strictEqual(greetingRes.recommended_trataka, undefined, "Greetings should not force Trataka protocol");
  console.log('  ✓ Greeting fast-path verified: zero unnecessary clinical clutter.');

  const micRes = await generateTherapeuticResponse("Testing mic 1 2 3");
  assert.strictEqual(micRes.reply, "Mic is running fine.", "Mic tests must remain brief fast-path");
  console.log('  ✓ Mic verification fast-path verified.\n');

  // 2. Testing Diverse Real-World User Situations
  console.log('--- 2. Testing Diverse Real-World Situations (All 3 Pillars Interlinked) ---');

  const testSituations = [
    {
      label: "Career Outcome Anxiety & Dilemma",
      query: "I have a major interview tomorrow, I am terrified of failing and cannot decide what to study",
      expectedTheme: "Outcome Detachment",
      expectedTrataka: "shoonya"
    },
    {
      label: "Grief & Acute Heartbreak",
      query: "My partner broke up with me and the heartbreak is physically hurting in my chest",
      expectedTheme: "Impermanence of Pain",
      expectedTrataka: "flame"
    },
    {
      label: "Workplace Anger & Gaslighting",
      query: "My toxic boss yelled at me and gaslighted my work in front of everyone, I am furious and shaking with rage",
      expectedTheme: "Anger Cascade",
      expectedTrataka: "bindu"
    },
    {
      label: "Toxic Core Shame & Imposter Syndrome",
      query: "I feel like a complete fake and failure, everyone is better than me and I hate myself",
      expectedTheme: "Self-Mastery",
      expectedTrataka: "pratibimb"
    },
    {
      label: "Mental Chaos & ADHD Overwhelm",
      query: "I have too many tasks, sensory overload, racing thoughts, and my mind feels like a hurricane",
      expectedTheme: "Ocean Equanimity",
      expectedTrataka: "murti"
    }
  ];

  for (const item of testSituations) {
    console.log(`\nTesting Situation: [${item.label}]`);
    console.log(`Query: "${item.query}"`);

    // Verify Gita RAG query resolution
    const gitaWisdom = findGitaWisdom(item.query);
    assert.ok(gitaWisdom, "Must resolve a Bhagavad Gita wisdom item");
    console.log(`  ✓ Gita RAG Matched: BG ${gitaWisdom.chapter}.${gitaWisdom.verse} (${gitaWisdom.theme})`);

    // Verify Trataka prescription resolution
    const tratakPrescription = resolveTratakaPrescription(item.query);
    assert.ok(tratakPrescription, "Must resolve a Trataka prescription");
    console.log(`  ✓ Trataka Prescribed: ${tratakPrescription.name} [${tratakPrescription.mode}]`);

    // Generate full response across cascaded healer
    const response = await generateTherapeuticResponse(item.query);
    assert.ok(response && response.reply, "Response must not be empty");
    assert.ok(response.sources && response.sources.length >= 2, "Must attach Gita and Trataka sources");
    assert.ok(response.recommended_trataka, "Must populate recommended_trataka field");

    const reply = response.reply;

    // Pillar 1 Assertions: Bhagavad Gita Shloka & Wisdom
    const hasGitaShloka = reply.includes('[GITA_SHLOKA]') && reply.includes('[/GITA_SHLOKA]');
    const hasDevanagari = /[\u0900-\u097F]/.test(reply);
    const hasGitaHeader = reply.toLowerCase().includes('gita') || reply.includes('गीता');
    assert.ok(hasGitaShloka, "Response must contain [GITA_SHLOKA] tags");
    assert.ok(hasDevanagari, "Response must contain authentic Sanskrit Devanagari Shloka");
    assert.ok(hasGitaHeader, "Response must reference Bhagavad Gita wisdom");
    console.log('  ✓ Pillar 1 (Bhagavad Gita Wisdom & Shloka) Verified');

    // Pillar 2 Assertions: Clinical Cognitive Neuroscience (CBT & Somatics)
    const hasClinicalHeader =
      reply.toLowerCase().includes('clinical') ||
      reply.toLowerCase().includes('cognitive') ||
      reply.toLowerCase().includes('cbt') ||
      reply.includes('क्लिनिकल');
    assert.ok(hasClinicalHeader, "Response must contain Clinical Cognitive Neuroscience section");
    console.log('  ✓ Pillar 2 (Clinical Cognitive Neuroscience) Verified');

    // Pillar 3 Assertions: Tratak Neuro-Ocular Protocol
    const hasTratakHeader =
      reply.toLowerCase().includes('tratak') ||
      reply.toLowerCase().includes('gazing') ||
      reply.includes('त्राटक');
    assert.ok(hasTratakHeader, "Response must contain Tratak Neuro-Ocular Protocol");
    console.log('  ✓ Pillar 3 (Tratak Neuro-Ocular Protocol) Verified');

    console.log(`  ✓ Provider Used: [${response.providerUsed}]`);
    console.log(`  ✓ Total Character Length: ${reply.length} chars`);
  }

  // 3. Testing Multilingual Hindi Situation
  console.log('\n--- 3. Testing Multilingual Hindi Situation ---');
  const hindiQuery = "मुझे अपने भविष्य को लेकर बहुत ज्यादा डर और असमंजस लग रहा है";
  const hindiRes = await generateTherapeuticResponse(hindiQuery, undefined, "hi", "hi-IN");
  assert.ok(hindiRes.reply.includes('श्रीमद्भगवद्गीता'), "Hindi response must include Bhagavad Gita");
  assert.ok(hindiRes.reply.includes('त्राटक'), "Hindi response must include Tratak in Hindi");
  console.log('  ✓ Multilingual Hindi 3-pillar response verified successfully!');

  console.log('\n================================================================');
  console.log('🎉 ALL TRI-PILLAR (GITA + CLINICAL + TRATAK) TESTS PASSED (100%)');
  console.log('================================================================\n');
}

if (require.main === module) {
  testGitaClinicalTratakTrio().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = { testGitaClinicalTratakTrio };
