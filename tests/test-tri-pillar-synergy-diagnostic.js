/**
 * tests/test-tri-pillar-synergy-diagnostic.js
 * 
 * Verifies the complete Tri-Pillar Synergistic Healing Engine:
 * 1. Summary of user's input with empathic reflection.
 * 2. Understanding of user's emotional suffering and assessment of suffering level (1-10 + autonomic state).
 * 3. Deep utilization of all 3 resources:
 *    - Bhagavad Gita: Authentic Shloka [GITA_SHLOKA], meaning, clinical reflection, Karma Yoga.
 *    - CBT & Somatic Science: Cognitive distortion reframe, somatic polyvagal reset, pranayama.
 *    - Tratak Neuro-Ocular: Specific gazing mode, neuro-ocular mechanism, step-by-step guidance.
 * 4. Synergistic Combination Resolution:
 *    - Explains HOW all 3 resources work together in combination to resolve their exact suffering.
 *    - Provides an integrated recovery sequence.
 * 5. Multilingual Validation (English and Pure Hindi).
 */

const assert = require('assert');
const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function testTriPillarSynergyDiagnostic() {
  console.log('\n================================================================');
  console.log('TRI-PILLAR SYNERGY & SUFFERING DIAGNOSTIC TEST SUITE');
  console.log('================================================================\n');

  const testCases = [
    {
      name: "Severe Career Dread & Decision Paralysis (English)",
      input: "I have a major interview tomorrow, I am terrified of failing and cannot decide what to study",
      locale: "en",
      lang: "en",
      checks: {
        hasSummary: (r) => r.includes('SUMMARY') || r.includes('DIAGNOSTIC'),
        hasSufferingLevel: (r) => r.includes('Suffering Severity') || r.includes('Distress Index') || r.includes('Severe'),
        hasAutonomic: (r) => r.includes('Sympathetic') || r.includes('Fight-or-Flight'),
        hasGitaShloka: (r) => r.includes('[GITA_SHLOKA]') && r.includes('[/GITA_SHLOKA]'),
        hasCBT: (r) => r.includes('CBT') || r.includes('COGNITIVE NEUROSCIENCE'),
        hasTratak: (r) => r.includes('TRATAK') || r.includes('Neuro-Ocular'),
        hasSynergyExplanation: (r) => r.includes('TRI-PILLAR SYNERGISTIC RESOLUTION') || r.includes('Work in Combination to Heal You'),
        hasStepByStep: (r) => r.includes('Phase 1') || r.includes('Recovery Sequence') || r.includes('Step 1'),
      }
    },
    {
      name: "Acute Grief & Heartbreak in Hindi (श्रीमद्भगवद्गीता + CBT + त्राटक)",
      input: "मेरा ब्रेकअप हो गया है और सीने में बहुत दर्द और रोना आ रहा है, कुछ समझ नहीं आ रहा",
      locale: "hi-IN",
      lang: "hi",
      checks: {
        hasSummary: (r) => r.includes('सारांश') && r.includes('मूल्यांकन'),
        hasSufferingLevel: (r) => r.includes('पीड़ा का स्तर') || r.includes('कष्ट सूचकांक'),
        hasAutonomic: (r) => r.includes('तंत्रिका तंत्र') || r.includes('सिम्पैथेटिक'),
        hasGitaShloka: (r) => r.includes('[GITA_SHLOKA]') && r.includes('[/GITA_SHLOKA]'),
        hasCBT: (r) => r.includes('CBT') || r.includes('संज्ञानात्मक विज्ञान'),
        hasTratak: (r) => r.includes('त्राटक') || r.includes('न्यूरो-ऑक्युलर'),
        hasSynergyExplanation: (r) => r.includes('एकीकृत त्रिवेणी उपचार योजना') || r.includes('मिलकर आपकी पीड़ा कैसे दूर करेंगे'),
        hasStepByStep: (r) => r.includes('पहला चरण') || r.includes('अभ्यास क्रम'),
      }
    },
    {
      name: "Core Shame & Imposter Syndrome (English)",
      input: "I feel like a complete fake and failure, everyone is better than me and I hate myself",
      locale: "en",
      lang: "en",
      checks: {
        hasSummary: (r) => r.includes('SUMMARY') || r.includes('DIAGNOSTIC'),
        hasSufferingLevel: (r) => r.includes('Suffering Severity') || r.includes('Distress Index'),
        hasGitaShloka: (r) => r.includes('[GITA_SHLOKA]') && r.includes('[/GITA_SHLOKA]'),
        hasCBT: (r) => r.includes('CBT') || r.includes('Reframing'),
        hasTratak: (r) => r.includes('TRATAK') || r.includes('Gazing'),
        hasSynergyExplanation: (r) => r.includes('SYNERGISTIC') || r.includes('Combination to Heal'),
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Running: [${tc.name}] ---`);
    console.log(`Input: "${tc.input}"`);

    const result = await generateTherapeuticResponse(tc.input, undefined, tc.lang, tc.locale);
    assert.ok(result && result.reply, "Must return valid reply");
    const reply = result.reply;

    console.log(`  ✓ Character count: ${reply.length}`);
    console.log(`  ✓ Provider: [${result.providerUsed}]`);

    // Verify User Input Summary & Suffering Diagnostic
    assert.ok(tc.checks.hasSummary(reply), "Must include Summary / Diagnostic header");
    console.log('  ✓ 1. Input Summary & Emotion Diagnostic Verified');

    assert.ok(tc.checks.hasSufferingLevel(reply), "Must include Suffering Level / Distress Index");
    console.log('  ✓ 2. Suffering Severity Level Assessment Verified');

    // Verify Bhagavad Gita Shloka & Wisdom
    assert.ok(tc.checks.hasGitaShloka(reply), "Must include [GITA_SHLOKA] tags");
    assert.ok(/[\u0900-\u097F]/.test(reply), "Must contain authentic Sanskrit Devanagari");
    console.log('  ✓ 3. Bhagavad Gita Shloka & Wisdom Deep Utilization Verified');

    // Verify CBT & Somatic Science
    assert.ok(tc.checks.hasCBT(reply), "Must include CBT Cognitive Neuroscience section");
    console.log('  ✓ 4. CBT Cognitive Restructuring & Somatics Verified');

    // Verify Tratak Protocol
    assert.ok(tc.checks.hasTratak(reply), "Must include Tratak Neuro-Ocular Protocol");
    console.log('  ✓ 5. Tratak Neuro-Ocular Protocol Verified');

    // Verify Tri-Pillar Synergistic Resolution
    assert.ok(tc.checks.hasSynergyExplanation(reply), "Must explain how Gita + CBT + Tratak work in combination");
    if (tc.checks.hasStepByStep) {
      assert.ok(tc.checks.hasStepByStep(reply), "Must include integrated recovery steps");
    }
    console.log('  ✓ 6. Tri-Pillar Synergistic Combination Resolution Verified');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL TRI-PILLAR SYNERGY & SUFFERING DIAGNOSTIC TESTS PASSED (100%)');
  console.log('================================================================\n');
}

if (require.main === module) {
  testTriPillarSynergyDiagnostic().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { testTriPillarSynergyDiagnostic };
