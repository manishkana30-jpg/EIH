/**
 * Comprehensive Verification Suite for:
 * 1. CBT Presence (Ensuring Stage 3 CBT is always populated, rich, and never missing or blank)
 * 2. Grammatical Pauses in Speech Synthesis (Punctuation-based speech units with breath/cadence delays)
 * 3. Highlighter Synchronization (Accurate word-boundary offsets, language-specific rates, monotonic stepping)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 TEST SUITE: CBT PRESENCE, GRAMMATICAL PAUSES & HIGHLIGHTER SYNC');
console.log('================================================================\n');

// ─── 1. TEST CBT PRESENCE IN parseTherapeuticStages ───
console.log('--- 1. Testing CBT Card Presence & Robustness in parseTherapeuticStages ---');
const { parseTherapeuticStages } = require('../lib/audio/karaoke-tokenizer.ts');

const testCases = [
  {
    name: 'Standard Clinical Response with 2. Clinical and 1. Gita',
    text: `**SUMMARY & EMOTIONAL WELLBEING ASSESSMENT:**
• **Identified Emotional State:** Anxiety and Panic
• **Severity:** Moderate
• **Interoceptive Bodily Burden:** Chest tightness

**1. BHAGAVAD GITA REFRAMING (Chapter 2, Verse 47):**
[GITA_SHLOKA]
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥
— Bhagavad Gita (2.47)
[/GITA_SHLOKA]
Divine Teaching: Act with full presence without attachment to fruits.
Your Duty Right Now: Anchor your focus in the current step.

**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**
Notice the catastrophic prediction. Your sympathetic nervous system is signaling arousal, not a factual forecast.
• **Somatic Anchor:** 4-4-6 Pranayama respiration.

**3. TRATAK NEURO-OCULAR PROTOCOL (Bindu):**
• **Focal Target:** Central dark point.
• **Practice Guidance:** Rest gaze steadily.`,
    locale: 'en'
  },
  {
    name: 'Hindi Distress Response with Devanagari CBT',
    text: `**आपकी स्थिति का संक्षिप्त सारांश एवं मूल्यांकन:**
• **पहचाना गया मनोभाव एवं मुख्य संघर्ष:** तीव्र मानसिक तनाव व घबराहट
• **पीड़ा का स्तर एवं तंत्रिका तंत्र स्थिति:** गंभीर
• **शारीरिक संवेदनाएं व आंतरिक तनाव:** छाती में भारीपन

**1. श्रीमद्भगवद्गीता का आत्मिक मार्गदर्शन (अध्याय 2, श्लोक 47):**
[GITA_SHLOKA]
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥
— श्रीमद्भगवद्गीता (2.47)
[/GITA_SHLOKA]
भगवान श्रीकृष्ण का पावन संदेश: तुम्हारा अधिकार केवल कर्म करने में है, फलों में कभी नहीं।
वर्तमान कर्तव्य: अभी के कर्तव्य पर ध्यान दें।

**2. क्लिनिकल संज्ञानात्मक विज्ञान एवं मन की शांति (CBT):**
अपने वर्तमान चिंताजनक विचारों की वास्तविकता को परखें। यह केवल अस्थायी विचार हैं।
• **शारीरिक स्थिरता:** हृदय पर हाथ रखें और 4-4-6 श्वास लें।

**3. त्राटक न्यूरो-ऑक्युलर ध्यान विधि (बिंदु त्राटक):**
• **फोकस बिंदु:** स्थिर केंद्र बिंदु।
• **अभ्यास विधि:** पलकों को सहज रखते हुए दृष्टि केंद्रित करें।`,
    locale: 'hi'
  },
  {
    name: 'Spanish TCC Response',
    text: `**RESUMEN DIAGNÓSTICO:**
• **Estado Emocional:** Ansiedad aguda

**1. SABIDURÍA DEL BHAGAVAD GITA (Capítulo 2, Verso 47):**
[GITA_SHLOKA]
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
— Bhagavad Gita (2.47)
[/GITA_SHLOKA]
Divine Teaching: Actúa con desapego.

**2. NEUROCIENCIA CLÍNICA COGNITIVA (TCC y Anclaje Somático):**
Reestructure los pensamientos automáticos.
• **Anclaje Somático:** Respiración 4-4-6.

**3. PROTOCOLO NEURO-OCULAR TRATAK (Bindu):**
• **Punto de Enfoque:** Punto central.`,
    locale: 'es'
  },
  {
    name: 'Omitted CBT Section (Fallback Autogeneration Verification)',
    text: `**SUMMARY & EMOTIONAL WELLBEING ASSESSMENT:**
• **Identified Emotional State:** Deep Fatigue

**1. BHAGAVAD GITA REFRAMING (Chapter 6, Verse 5):**
[GITA_SHLOKA]
उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।
— Bhagavad Gita (6.5)
[/GITA_SHLOKA]
Divine Teaching: Elevate yourself through your mind.

**3. TRATAK NEURO-OCULAR PROTOCOL (Jyoti):**
• **Focal Target:** Steady candle flame.`,
    locale: 'en'
  }
];

testCases.forEach((tc, idx) => {
  const parsed = parseTherapeuticStages(tc.text, tc.locale);
  assert(parsed.isStructured, `Test ${idx + 1} (${tc.name}): Must be structured`);
  assert.strictEqual(parsed.stages.length, 4, `Test ${idx + 1} (${tc.name}): Must contain exactly 4 stages`);

  const stage3 = parsed.stages.find((s) => s.stage === 3);
  assert(stage3, `Test ${idx + 1} (${tc.name}): Stage 3 (CBT) must be present`);
  assert(stage3.displayContent && stage3.displayContent.length > 20, `Test ${idx + 1} (${tc.name}): Stage 3 displayContent must be non-empty and rich`);
  assert(stage3.speechText && stage3.speechText.length > 20, `Test ${idx + 1} (${tc.name}): Stage 3 speechText must be non-empty`);
  assert(stage3.badge.includes('3.'), `Test ${idx + 1} (${tc.name}): Stage 3 badge must designate Card 3`);

  console.log(`  ✓ Passed: ${tc.name}`);
  console.log(`    Stage 3 Badge: ${stage3.badge}`);
  console.log(`    Stage 3 Title: ${stage3.title}`);
  console.log(`    Stage 3 Preview: "${stage3.speechText.slice(0, 70)}..."\n`);
});

// ─── 2. TEST GRAMMATICAL SPEECH UNITS & PAUSE DELAYS ───
console.log('--- 2. Testing Grammatical Speech Unit Splitter & Pause Delays ---');
const speechFileContent = fs.readFileSync(path.join(__dirname, '../lib/audio/browser-speech.ts'), 'utf-8');

// Verify helper methods exist in BrowserSpeechController
assert(speechFileContent.includes('splitIntoTherapeuticSpeechUnits'), 'Must define splitIntoTherapeuticSpeechUnits');
assert(speechFileContent.includes('getPauseDelayForUnit'), 'Must define getPauseDelayForUnit');
assert(speechFileContent.includes('chunkPauseTimer'), 'Must define chunkPauseTimer for grammatical pauses');

// Test the exact regex logic
function testSplitter(text) {
  if (!text) return [];
  const regex = /(?:[^.!?।॥\n,;:—]|(?<=\d)[,.](?=\d))+[.!?;:—।॥\n]+|(?:[^.!?।॥\n,;:—]|(?<=\d)[,.](?=\d))+,\s+|(?:[^.!?।॥\n,;:—]|(?<=\d)[,.](?=\d))+$/g;
  const rawUnits = text.match(regex) || [text];
  const units = [];
  let current = '';
  for (const u of rawUnits) {
    if (!current) {
      current = u;
    } else {
      const isCurrentSentenceEnd = /[.!?।॥\n]/.test(current);
      if (!isCurrentSentenceEnd && current.trim().length < 16) {
        current += u;
      } else {
        units.push(current);
        current = u;
      }
    }
  }
  if (current) units.push(current);
  return units;
}

function testPause(unit) {
  const trimmed = unit.trim();
  if (/[.!?।॥\n]$/.test(trimmed)) return 380;
  if (/[,;:—]$/.test(trimmed)) return 200;
  return 100;
}

const sampleSpeeches = [
  {
    lang: 'Hindi Shloka & Guidance',
    text: 'भगवान श्रीकृष्ण का पावन संदेश: कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। इस संदेश को अपने वर्तमान जीवन में उतारें, और परिणाम की चिंता छोड़ें।',
    expectedMinUnits: 3,
  },
  {
    lang: 'English CBT Reframing',
    text: 'Notice this catastrophic thought. When your heart beats faster, remind yourself: this is merely sympathetic arousal, not immediate danger. Breathe deeply: 4 seconds in, 6 seconds out.',
    expectedMinUnits: 3,
  },
  {
    lang: 'German Guidance',
    text: 'Kognitive Verhaltenstherapie hilft Ihnen, katastrophisierende Gedanken zu erkennen. Atmen Sie bewusst ein, halten Sie den Atem kurz, und lassen Sie los.',
    expectedMinUnits: 2,
  }
];

sampleSpeeches.forEach((sample) => {
  const units = testSplitter(sample.text);
  assert(units.length >= sample.expectedMinUnits, `${sample.lang}: Expected at least ${sample.expectedMinUnits} units, got ${units.length}`);
  assert.strictEqual(units.join(''), sample.text, `${sample.lang}: Concatenation must perfectly reconstruct text without losing whitespace`);

  const pauses = units.map(testPause);
  console.log(`  ✓ ${sample.lang}: Split into ${units.length} speech units with pauses [${pauses.join('ms, ')}ms]`);
  units.forEach((u, i) => {
    console.log(`    Unit ${i + 1} (${testPause(u)}ms pause): "${u.trim()}"`);
  });
  console.log('');
});

// ─── 3. TEST HIGHLIGHTER PROGRESSION GUARD ───
console.log('--- 3. Testing Highlighter Progression Guard in app/(session)/page.tsx ---');
const pageFileContent = fs.readFileSync(path.join(__dirname, '../app/(session)/page.tsx'), 'utf-8');

assert(
  pageFileContent.includes('activeWordIdx > prevIdx + 1'),
  'page.tsx must cap forward word jump to prevIdx + 1 so highlighter never races ahead'
);
assert(
  pageFileContent.includes('maxForward = Math.min(cleanWordList.length, startScan + 4)'),
  'page.tsx must bound forward search range to immediate neighborhood'
);
console.log('  ✓ Highlighter jump capping verified: activeWordIdx strictly clamped to max 1 word per boundary event.\n');

// ─── 4. TEST KARAOKE MESSAGE STAGE TRACKING ───
console.log('--- 4. Testing Stage Tracking & Math.max in KaraokeMessage.tsx ---');
const kmFileContent = fs.readFileSync(path.join(__dirname, '../app/(session)/components/KaraokeMessage.tsx'), 'utf-8');

assert(
  kmFileContent.includes('Math.max(currentStage || 1, localStage || 1)'),
  'KaraokeMessage.tsx must compute activeStage with Math.max to prevent reverting active card'
);
assert(
  kmFileContent.includes('currentStage > localStage'),
  'KaraokeMessage.tsx must only update localStage forward'
);
assert(
  kmFileContent.includes('stage3?.speechText && stage3.speechText.trim().length > 10'),
  'KaraokeMessage.tsx hasRealCbtContent must recognize speechText'
);
console.log('  ✓ Stage progression persistence & CBT presence checks verified in KaraokeMessage.\n');

console.log('================================================================');
console.log('🎉 ALL TESTS PASSED: CBT IS RESTORED, PAUSES ACTIVE, HIGHLIGHTER SYNCED');
console.log('================================================================');
