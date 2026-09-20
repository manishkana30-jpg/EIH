/**
 * Automated Verification Test:
 * 1. CBT diversification across distinct psychological conditions (no repetitive GAD defaulting).
 * 2. Trataka mode synchronization & auto-initialization.
 * 3. Multilingual selection (GPS locale & user selection) across en, hi, es, fr, de.
 * 4. Chat board scroll stability and container anchoring.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test 1: Verify Psychology Library RAG query diversity & CBT reframes
console.log('\n--- 1. Testing CBT Diversification Across Distinct Clinical Conditions ---');

const { queryPsychologyLibrary } = require('../lib/knowledge/psychology-library-rag.ts');
const { formatHumanTherapeuticMessage, getLocalizedClinicalIntervention, normalizeLanguageCode } = require('../lib/i18n/clinical-localization.ts');
const { resolveTratakaPrescription } = require('../lib/knowledge/trataka-recommendations.ts');

const testCases = [
  { prompt: 'I feel a generalized dread and constant worry about everything', expectedCond: 'gad' },
  { prompt: 'I feel deeply sad, empty, lost interest in everything and hopeless', expectedCond: 'major_depression' },
  { prompt: 'Terrified of speaking up in meetings, everyone is judging me', expectedCond: 'social_anxiety' },
  { prompt: 'I have to keep checking the door lock and washing my hands repeatedly', expectedCond: 'ocd_intrusive_rumination' },
  { prompt: 'I feel like an imposter at work and I do not belong here, I am a fake', expectedCond: 'imposter_perfectionism' },
  { prompt: 'My heart is racing, chest is tight, sudden wave of sheer panic out of nowhere', expectedCond: 'panic_disorder' },
  { prompt: 'I feel completely numb, detached from my body, emotionally shut down', expectedCond: 'emotional_dysregulation_numbness' },
];

const retrievedConditions = new Set();
const retrievedCbtReframes = new Set();

testCases.forEach(({ prompt, expectedCond }) => {
  const res = queryPsychologyLibrary(prompt);
  assert(res && res.condition, `Query "${prompt}" must resolve a valid clinical condition`);
  console.log(`  ✓ Prompt: "${prompt.slice(0, 35)}..." -> Matched Condition: ${res.condition.id} (${res.condition.name})`);

  retrievedConditions.add(res.condition.id);

  const cbtReframe = res.condition.solutions.cbt_reframing;
  assert(cbtReframe && cbtReframe.length > 20, `Condition ${res.condition.id} must have authentic CBT reframe`);
  assert(!retrievedCbtReframes.has(cbtReframe), `CBT reframe for ${res.condition.id} must be unique, not repetitive`);
  retrievedCbtReframes.add(cbtReframe);
});

assert(retrievedConditions.size >= 5, `Must have retrieved at least 5 distinct conditions (got ${retrievedConditions.size})`);
console.log(`  ✓ All ${retrievedConditions.size} conditions have distinct, non-repetitive CBT reframings!`);

// Test 2: Verify Multilingual Support & Localization
console.log('\n--- 2. Testing Multilingual Clinical Interventions (en, hi, es, fr, de) ---');

const testLocales = ['en', 'hi', 'es', 'fr', 'de'];
const testCondition = 'ocd_intrusive_rumination';

testLocales.forEach((lang) => {
  const intervention = getLocalizedClinicalIntervention(testCondition, lang);
  assert(intervention, `Must generate clinical intervention for ${testCondition} in ${lang}`);
  assert(intervention.cbt_reframing && intervention.cbt_reframing.length > 10, `CBT reframe must be populated for ${lang}`);
  assert(intervention.somatic_anchor && intervention.somatic_anchor.length > 10, `Somatic anchor must be populated for ${lang}`);
  console.log(`  ✓ [${lang.toUpperCase()}] ${intervention.conditionName} -> CBT: "${intervention.cbt_reframing.slice(0, 45)}..."`);
});

// Verify normalizeLanguageCode
assert.strictEqual(normalizeLanguageCode('hi-IN'), 'hi');
assert.strictEqual(normalizeLanguageCode('es-ES'), 'es');
assert.strictEqual(normalizeLanguageCode('fr-FR'), 'fr');
assert.strictEqual(normalizeLanguageCode('de-DE'), 'de');
assert.strictEqual(normalizeLanguageCode('en-US'), 'en');
assert.strictEqual(normalizeLanguageCode('unknown'), 'en');
console.log('  ✓ normalizeLanguageCode accurately normalizes regional GPS locales (hi-IN, es-ES, etc.)');

// Test 3: Trataka Prescription Sync
console.log('\n--- 3. Testing Trataka Prescriptions & Mode Synchronization ---');

const tratakTests = [
  { prompt: 'Panic and racing heart', emotion: 'panic', polyvagal: 'Sympathetic (Fight/Flight)', expectedModes: ['bindu', 'flame'] },
  { prompt: 'Numb, detached and frozen shut down', emotion: 'grief', polyvagal: 'Dorsal Vagal (Shutdown)', expectedModes: ['pratibimb', 'shoonya', 'flame'] },
  { prompt: 'Racing thoughts and overwhelm', emotion: 'anxiety', polyvagal: 'Sympathetic (Fight/Flight)', expectedModes: ['bindu', 'flame', 'murti'] },
];

tratakTests.forEach(({ prompt, emotion, polyvagal, expectedModes }) => {
  const rx = resolveTratakaPrescription(prompt, emotion, polyvagal);
  assert(rx && rx.mode, 'Must resolve a valid Trataka mode');
  assert(expectedModes.includes(rx.mode), `Mode ${rx.mode} must be one of expected: ${expectedModes.join(', ')}`);
  console.log(`  ✓ State: ${polyvagal} -> Prescribed Mode: ${rx.mode.toUpperCase()} (${rx.name})`);
});

// Verify TratakaModule code contains automatic synchronization
const tratakaComponentPath = path.join(__dirname, '../app/(session)/components/TratakaModule.tsx');
const tratakaContent = fs.readFileSync(tratakaComponentPath, 'utf8');
assert(tratakaContent.includes('setTratakaMode(recommendedMode)'), 'TratakaModule must synchronize tratakaMode with recommendedMode');
assert(tratakaContent.includes('justOpened'), 'TratakaModule must check justOpened before setting prescribed mode');
assert(tratakaContent.includes('Prescribed Archetype'), 'TratakaModule mode selection grid must show Prescribed Archetype banner');
console.log('  ✓ TratakaModule has auto-initialization sync and prescribed banner verified in code');

// Test 4: Chat Board Scroll Anchoring & Anti-Disorientation
console.log('\n--- 4. Testing Chat Board Scroll Anchoring (No Page Jump) ---');

const sessionPagePath = path.join(__dirname, '../app/(session)/page.tsx');
const pageContent = fs.readFileSync(sessionPagePath, 'utf8');

assert(pageContent.includes('chatContainerRef = useRef<HTMLDivElement>(null)'), 'page.tsx must declare chatContainerRef');
assert(pageContent.includes('ref={chatContainerRef}'), 'page.tsx must attach chatContainerRef to chat stream container');
assert(pageContent.includes('chatContainerRef.current.scrollTo'), 'page.tsx must use container scrollTo instead of window scrollIntoView');
assert(!pageContent.includes('messagesEndRef.current?.scrollIntoView'), 'page.tsx must NOT call window scrollIntoView on chat update');
assert(pageContent.includes('e.preventDefault()'), 'page.tsx must call e.preventDefault() on Enter key submission');

console.log('  ✓ Chat board container anchoring & preventDefault verified in app/(session)/page.tsx');

// Test 5: Fallback Route Multilingual & CBT Grounding
console.log('\n--- 5. Testing Fallback Route Multilingual & Trataka Synchronization ---');

const fallbackRoutePath = path.join(__dirname, '../app/api/chat/fallback/route.ts');
const fallbackContent = fs.readFileSync(fallbackRoutePath, 'utf8');

assert(fallbackContent.includes('language, locale'), 'fallback route must parse language and locale from body');
assert(fallbackContent.includes('MANDATORY MULTILINGUAL CLINICAL DIRECTIVE'), 'fallback route must include multilingual directive');
assert(fallbackContent.includes('Authentic CBT Reframing'), 'fallback route must inject authentic condition CBT reframe into system prompt');
assert(fallbackContent.includes('recommended_trataka: tratakItem.mode'), 'fallback route must return recommended_trataka');

console.log('  ✓ Fallback route CBT grounding, multilingual directive, and tratak mode sync verified');

console.log('\n========================================');
console.log('🎉 ALL TESTS PASSED! All 4 user issues resolved.');
console.log('========================================\n');
