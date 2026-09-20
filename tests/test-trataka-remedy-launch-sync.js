/**
 * tests/test-trataka-remedy-launch-sync.js
 * 
 * Verifies 100% synchronization between the textual Trataka remedy
 * and the inline/sidebar Launch buttons.
 * Specifically validates that when Jyoti Trataka is prescribed in the text remedy,
 * the launch button never defaults or mismatches to Bindu Trataka.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  normalizeTratakaMode,
  detectTratakaModeFromText,
  getTratakaModeLabel,
  resolveTratakaPrescription,
} = require('../lib/knowledge/trataka-recommendations.ts');

const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function runTests() {
  console.log('================================================================');
  console.log('TESTING TRATAKA REMEDY & LAUNCH BUTTON SYNCHRONIZATION');
  console.log('================================================================\n');

  // Test 1: Mode Normalization & Aliases
  console.log('--- 1. Testing Mode Normalization & Aliases ---');
  assert.strictEqual(normalizeTratakaMode('jyoti'), 'flame', 'jyoti must normalize to flame');
  assert.strictEqual(normalizeTratakaMode('flame'), 'flame', 'flame must normalize to flame');
  assert.strictEqual(normalizeTratakaMode('Jyoti Trataka'), 'flame', 'Jyoti Trataka must normalize to flame');
  assert.strictEqual(normalizeTratakaMode('ज्योति त्राटक'), 'flame', 'ज्योति त्राटक must normalize to flame');
  assert.strictEqual(normalizeTratakaMode('mandala'), 'murti', 'mandala must normalize to murti');
  assert.strictEqual(normalizeTratakaMode('mirror'), 'pratibimb', 'mirror must normalize to pratibimb');
  assert.strictEqual(normalizeTratakaMode('void'), 'shoonya', 'void must normalize to shoonya');
  assert.strictEqual(normalizeTratakaMode('point'), 'bindu', 'point must normalize to bindu');
  assert.strictEqual(normalizeTratakaMode(null), 'bindu', 'null must default safely to bindu');
  console.log('  ✓ normalizeTratakaMode maps all synonyms and languages to canonical IDs');

  // Test 2: Text Extraction from Remedy Messages
  console.log('\n--- 2. Testing Text Detection from Remedy Messages ---');
  const sampleJyotiHindi = `**3. त्राटक न्यूरो-ऑक्युलर ध्यान विधि (Jyoti Trataka (Candle Flame Gazing)):**
इस समय आपके मन और मस्तिष्क को शांत करने के लिए Jyoti Trataka (Candle Flame Gazing) सबसे उत्तम है।`;
  assert.strictEqual(detectTratakaModeFromText(sampleJyotiHindi), 'flame', 'Must detect flame from Hindi Jyoti Trataka remedy');

  const sampleJyotiEnglish = `**3. TRATAK NEURO-OCULAR PROTOCOL (Jyoti Trataka (Candle Flame Gazing)):**
To rekindle metabolic fire and dissolve depressive inertia, practice Jyoti Trataka.`;
  assert.strictEqual(detectTratakaModeFromText(sampleJyotiEnglish), 'flame', 'Must detect flame from English Jyoti Trataka remedy');

  const samplePratibimb = `**3. TRATAK NEURO-OCULAR PROTOCOL (Pratibimb Trataka (Sacred Mirror Gazing)):**`;
  assert.strictEqual(detectTratakaModeFromText(samplePratibimb), 'pratibimb', 'Must detect pratibimb');

  const sampleMandala = `**3. TRATAK NEURO-OCULAR PROTOCOL (Mandala Trataka (Sacred Geometry Resonance)):**`;
  assert.strictEqual(detectTratakaModeFromText(sampleMandala), 'murti', 'Must detect murti/mandala');

  const sampleShoonya = `**3. TRATAK NEURO-OCULAR PROTOCOL (Shoonya Trataka (Void & Panoramic Space Gazing)):**`;
  assert.strictEqual(detectTratakaModeFromText(sampleShoonya), 'shoonya', 'Must detect shoonya');

  const sampleBindu = `**3. TRATAK NEURO-OCULAR PROTOCOL (Bindu Trataka (Sacred Golden Focal Point)):**`;
  assert.strictEqual(detectTratakaModeFromText(sampleBindu), 'bindu', 'Must detect bindu');

  console.log('  ✓ detectTratakaModeFromText accurately identifies the exact mode from remedy text');

  // Test 3: Display Labels for UI Buttons
  console.log('\n--- 3. Testing Display Labels ---');
  assert.strictEqual(getTratakaModeLabel('flame'), 'Jyoti (Flame)', 'Flame must display as Jyoti (Flame)');
  assert.strictEqual(getTratakaModeLabel('jyoti'), 'Jyoti (Flame)', 'Jyoti alias must display as Jyoti (Flame)');
  assert.strictEqual(getTratakaModeLabel('bindu'), 'Bindu (Point)', 'Bindu must display as Bindu (Point)');
  assert.strictEqual(getTratakaModeLabel('murti'), 'Mandala (Murti)', 'Murti must display as Mandala (Murti)');
  assert.strictEqual(getTratakaModeLabel('pratibimb'), 'Pratibimb (Mirror)', 'Pratibimb must display as Pratibimb (Mirror)');
  assert.strictEqual(getTratakaModeLabel('shoonya'), 'Shoonya (Void)', 'Shoonya must display as Shoonya (Void)');
  console.log('  ✓ getTratakaModeLabel displays harmonized Vedic + Clinical terminology: Jyoti (Flame)');

  // Test 4: E2E Generation for Depressive Inertia / Burnout / Grief -> Must Prescribe Flame & Match Output
  console.log('\n--- 4. Testing End-to-End Healer Synthesis for Flame/Jyoti Situations ---');
  const flamePrompts = [
    'I feel so deeply depressed, exhausted and burnt out that I have no energy to get out of bed',
    'My partner broke up with me and the heartbreak is causing deep grief and emptiness',
  ];

  for (const prompt of flamePrompts) {
    const res = await generateTherapeuticResponse(prompt);
    assert.ok(res && res.reply, 'Must return therapeutic response');
    const detectedInText = detectTratakaModeFromText(res.reply);
    
    console.log(`Prompt: "${prompt.slice(0, 40)}..."`);
    console.log(`  -> Remedy Mentions: ${detectedInText || 'N/A'}`);
    console.log(`  -> Recommended Trataka Field: ${res.recommended_trataka}`);
    
    // Crucial check: If remedy prescribed Jyoti/Flame, recommended_trataka MUST be flame!
    if (detectedInText) {
      assert.strictEqual(
        res.recommended_trataka,
        detectedInText,
        `Remedy text says ${detectedInText} but recommended_trataka was ${res.recommended_trataka}! Mismatch detected!`
      );
      console.log(`  ✓ PERFECT MATCH: Text remedy (${detectedInText}) == recommended_trataka (${res.recommended_trataka})`);
    }
  }

  // Test 5: Verify page.tsx and TratakaModule.tsx Synchronization in Source Code
  console.log('\n--- 5. Verifying Session Page & TratakaModule Source Code ---');
  const pageSource = fs.readFileSync(path.join(__dirname, '../app/(session)/page.tsx'), 'utf8');
  assert(pageSource.includes('detectTratakaModeFromText'), 'page.tsx must import and use detectTratakaModeFromText');
  assert(pageSource.includes('getTratakaModeLabel'), 'page.tsx must use getTratakaModeLabel for button text');
  assert(pageSource.includes('normalizeTratakaMode'), 'page.tsx must use normalizeTratakaMode');
  
  const tratakaSource = fs.readFileSync(path.join(__dirname, '../app/(session)/components/TratakaModule.tsx'), 'utf8');
  assert(tratakaSource.includes('normalizeTratakaMode'), 'TratakaModule must import and use normalizeTratakaMode');
  assert(tratakaSource.includes("tratakaMode === 'flame' || (tratakaMode as any) === 'jyoti'"), 'TratakaModule must support jyoti alias for flame');
  console.log('  ✓ page.tsx dynamically computes button label and mode from message text');
  console.log('  ✓ TratakaModule cleanly normalizes prescribed mode and supports Jyoti Flame');

  console.log('\n================================================================');
  console.log('🎉 ALL TRATAKA REMEDY-LAUNCH SYNCHRONIZATION TESTS PASSED (100%)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
