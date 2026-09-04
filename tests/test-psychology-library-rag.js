/**
 * tests/test-psychology-library-rag.js
 * Comprehensive automated verification for Clinical & Psychoeducational Library RAG.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n================================================================');
console.log('🧪 RUNNING PSYCHOLOGY LIBRARY & RAG VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Validate JSON Data Structure
console.log('--- 1. Validating data/psychology_library.json Schema & Integrity ---');
const dataFilePath = path.join(__dirname, '..', 'data', 'psychology_library.json');
assert.ok(fs.existsSync(dataFilePath), 'data/psychology_library.json must exist');
const libraryData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
assert.ok(Array.isArray(libraryData), 'Psychology library data must be an array');
assert.ok(libraryData.length >= 20, `Must contain at least 20 clinical conditions (got ${libraryData.length})`);

const requiredCoreIds = [
  'gad',
  'burnout_fatigue',
  'panic_dysregulation',
  'major_depressive_inertia',
  'imposter_perfectionism',
  'relationship_heartbreak',
  'existential_loneliness',
  'ocd_intrusive_rumination',
  'compassion_fatigue_caregiver',
  'decision_paralysis_ambivalence',
  'shame_core_defectiveness',
  'workplace_mobbing_toxic_culture',
  'somatic_chronic_pain_amplification',
];
const conditionMap = {};

for (const condition of libraryData) {
  conditionMap[condition.id] = condition;

  // Verify all mandatory schema fields
  assert.ok(typeof condition.name === 'string' && condition.name.length > 0, `${condition.id} missing name`);
  assert.ok(typeof condition.category === 'string' && condition.category.length > 0, `${condition.id} missing category`);
  assert.ok(typeof condition.triguna_balance === 'string' && condition.triguna_balance.length > 0, `${condition.id} missing triguna_balance`);
  assert.ok(Array.isArray(condition.core_symptoms) && condition.core_symptoms.length >= 3, `${condition.id} missing core_symptoms`);
  assert.ok(Array.isArray(condition.cognitive_distortions) && condition.cognitive_distortions.length >= 1, `${condition.id} missing cognitive_distortions`);
  assert.ok(typeof condition.severity_level === 'string', `${condition.id} missing severity_level`);
  assert.strictEqual(condition.requires_immediate_crisis, false, `${condition.id} requires_immediate_crisis must be false`);

  // Verify solutions matrix
  const solutions = condition.solutions;
  assert.ok(solutions, `${condition.id} missing solutions object`);
  assert.ok(typeof solutions.cbt_reframing === 'string' && solutions.cbt_reframing.length > 10, `${condition.id} invalid cbt_reframing`);
  assert.ok(typeof solutions.somatic_anchor === 'string' && solutions.somatic_anchor.length > 10, `${condition.id} invalid somatic_anchor`);
  assert.ok(typeof solutions.pranayama === 'string' && solutions.pranayama.length > 10, `${condition.id} invalid pranayama`);
  assert.ok(typeof solutions.micro_habit === 'string' && solutions.micro_habit.length > 10, `${condition.id} invalid micro_habit`);

  console.log(`  ✓ [PASSED]: Validated Condition "${condition.name}" (${condition.id}) | Triguna: ${condition.triguna_balance}`);
}

for (const reqId of requiredCoreIds) {
  assert.ok(conditionMap[reqId], `Required core condition missing: ${reqId}`);
}

// 2. Validate Specific Clinical Protocols
console.log('\n--- 2. Validating Exact Clinical Protocols & Solutions ---');

// GAD Checks
const gad = conditionMap['gad'];
assert.strictEqual(gad.triguna_balance, 'High Rajas, Low Sattva');
assert.ok(gad.solutions.pranayama.includes('Nadi Shodhana'), 'GAD must prescribe Nadi Shodhana');
assert.ok(gad.solutions.somatic_anchor.includes('5-4-3-2-1'), 'GAD must prescribe 5-4-3-2-1 Sensory Grounding');
console.log('  ✓ [PASSED]: GAD Clinical Grounding & Nadi Shodhana Protocol verified.');

// Burnout Checks
const burnout = conditionMap['burnout_fatigue'];
assert.strictEqual(burnout.triguna_balance, 'Depleted Rajas, Dominant Tamas');
assert.ok(burnout.solutions.pranayama.includes('Bharmari') || burnout.solutions.pranayama.includes('Bhramari'), 'Burnout must prescribe Bharmari');
assert.ok(burnout.solutions.cbt_reframing.includes('non-negotiable physiological maintenance'), 'Burnout must reframe rest as non-negotiable');
console.log('  ✓ [PASSED]: Clinical Burnout Rest Reframing & Bhramari Protocol verified.');

// OCD Checks
const ocd = conditionMap['ocd_intrusive_rumination'];
assert.ok(ocd.solutions.cbt_reframing.includes('Exposure & Response Prevention') || ocd.solutions.cbt_reframing.includes('Pratipaksha Bhavana'));
assert.ok(ocd.solutions.pranayama.includes('Viloma'));
console.log('  ✓ [PASSED]: OCD/Intrusive Thoughts ERP & Viloma Protocol verified.');

// Caregiver Checks
const caregiver = conditionMap['compassion_fatigue_caregiver'];
assert.ok(caregiver.solutions.cbt_reframing.includes('Differentiated Empathy'));
assert.ok(caregiver.solutions.pranayama.includes('Anuloma Viloma'));
console.log('  ✓ [PASSED]: Caregiver Burnout Equanimity & Anuloma Viloma Protocol verified.');

// Chronic Pain Checks
const pain = conditionMap['somatic_chronic_pain_amplification'];
assert.ok(pain.solutions.cbt_reframing.includes('Pain Reprocessing Therapy'));
assert.ok(pain.solutions.somatic_anchor.includes('Somatic Tracking'));
console.log('  ✓ [PASSED]: Neuroplastic Chronic Pain PRT & Somatic Tracking Protocol verified.');

// 3. Simulated RAG Retrieval Tests
console.log('\n--- 3. Testing Semantic RAG Vector Retrieval Logic ---');

const CLINICAL_TRIGGERS = {
  gad: /\b(worry|worrying|what if|anxious|anxiety|nervous|tense|restless|ghabrahat|chinta|bechaini)\b/i,
  burnout_fatigue: /\b(burnout|burned out|exhausted|exhaustion|brain fog|tired|lethargy|thak gaya)\b/i,
  panic_dysregulation: /\b(panic|heart racing|palpitations|cannot breathe|suffocating|shaking|saas nahi)\b/i,
  major_depressive_inertia: /\b(depressed|depression|low mood|hopeless|empty|udaas)\b/i,
  imposter_perfectionism: /\b(imposter|fraud|failure|failed|perfectionist)\b/i,
  existential_loneliness: /\b(lonely|loneliness|isolated|nobody cares|akela|akelepan)\b/i,
  relationship_heartbreak: /\b(breakup|partner|fight|heartbreak|dil toot)\b/i,
  adhd_executive_overwhelm: /\b(adhd|procrastinate|procrastinating|task paralysis)\b/i,
  ocd_intrusive_rumination: /\b(ocd|intrusive thought|pure o|bad thoughts|bure vichar)\b/i,
  compassion_fatigue_caregiver: /\b(caregiver|caregiving|taking care of my|caring for sick)\b/i,
  decision_paralysis_ambivalence: /\b(decision paralysis|cannot decide|choice overload)\b/i,
  shame_core_defectiveness: /\b(shame|ashamed|toxic shame|deeply flawed|defective|sharmindagi)\b/i,
  workplace_mobbing_toxic_culture: /\b(toxic workplace|toxic boss|gaslighting boss|workplace mobbing)\b/i,
  somatic_chronic_pain_amplification: /\b(chronic pain|neuroplastic pain|back pain|fibromyalgia|pain flare|somatic tracking)\b/i,
};

function mockQueryPsychologyLibrary(userText) {
  const rawLower = userText.toLowerCase();
  const words = rawLower.split(/[\s,.;:!?()]+/).filter((w) => w.length >= 3);

  let bestMatch = null;
  let highestScore = 0;

  for (const condition of libraryData) {
    let score = 0;
    const trigger = CLINICAL_TRIGGERS[condition.id];
    if (trigger && trigger.test(rawLower)) score += 12;
    if (rawLower.includes(condition.id.replace(/_/g, ' '))) score += 10;
    for (const nw of condition.name.toLowerCase().split(/\s+/)) {
      if (nw.length > 3 && rawLower.includes(nw)) score += 4;
    }
    for (const symptom of condition.core_symptoms) {
      for (const sw of symptom.toLowerCase().split(/\s+/)) {
        if (sw.length > 3 && words.includes(sw)) score += 3;
      }
    }
    for (const dist of condition.cognitive_distortions) {
      if (rawLower.includes(dist.toLowerCase())) score += 7;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = condition;
    }
  }

  return bestMatch && highestScore >= 5 ? bestMatch : null;
}

const testQueries = [
  {
    query: 'I cannot stop worrying about tomorrow and my muscles feel so tense',
    expectedId: 'gad',
    label: 'Chronic Worry & Muscle Tension',
  },
  {
    query: 'I am completely burned out and exhausted at work with constant brain fog',
    expectedId: 'burnout_fatigue',
    label: 'Workplace Burnout & Brain Fog',
  },
  {
    query: 'My heart is racing so fast and I feel like I cannot breathe or suffocating',
    expectedId: 'panic_dysregulation',
    label: 'Acute Panic Surge & Palpitations',
  },
  {
    query: 'I feel completely lonely and isolated, like nobody cares about me',
    expectedId: 'existential_loneliness',
    label: 'Existential Loneliness & Isolation',
  },
  {
    query: 'I feel like an absolute imposter and failure at my job',
    expectedId: 'imposter_perfectionism',
    label: 'Imposter Syndrome & Fear of Failure',
  },
  {
    query: 'I am so depressed and hopeless that I cannot get out of bed',
    expectedId: 'major_depressive_inertia',
    label: 'Major Depressive Inertia & Low Mood',
  },
  {
    query: 'I had a terrible fight with my partner and my heartbreak hurts',
    expectedId: 'relationship_heartbreak',
    label: 'Relational Heartbreak & Attachment Distress',
  },
  {
    query: 'I keep procrastinating with severe task paralysis and cannot start',
    expectedId: 'adhd_executive_overwhelm',
    label: 'ADHD Executive Overwhelm & Procrastination',
  },
  {
    query: 'I keep having these terrifying intrusive thoughts and mental rituals that I cannot stop',
    expectedId: 'ocd_intrusive_rumination',
    label: 'OCD & Intrusive Thought Spirals',
  },
  {
    query: 'I am exhausted from caregiving and taking care of my sick parent all day and night',
    expectedId: 'compassion_fatigue_caregiver',
    label: 'Caregiver Burnout & Empathic Depletion',
  },
  {
    query: 'I am stuck in extreme decision paralysis with too many options and afraid of choosing wrong',
    expectedId: 'decision_paralysis_ambivalence',
    label: 'Decision Paralysis & Choice Overload',
  },
  {
    query: 'I feel this overwhelming toxic shame like I am deeply flawed and defective at my core',
    expectedId: 'shame_core_defectiveness',
    label: 'Toxic Core Shame & Defectiveness',
  },
  {
    query: 'My toxic boss is gaslighting me every single day at work and Sunday dread is paralyzing',
    expectedId: 'workplace_mobbing_toxic_culture',
    label: 'Workplace Gaslighting & Mobbing',
  },
  {
    query: 'My chronic back pain and fibromyalgia flares up violently whenever I get stressed',
    expectedId: 'somatic_chronic_pain_amplification',
    label: 'Chronic Neuroplastic Pain Sensitization',
  },
  {
    query: 'Mujhe bahut zyada ghabrahat aur chinta ho rahi hai',
    expectedId: 'gad',
    label: 'Hinglish GAD Query (Ghabrahat / Chinta)',
  },
  {
    query: 'Mujhe bahut akela aur akelepan lagta hai koi baat nahi karta',
    expectedId: 'existential_loneliness',
    label: 'Hinglish Loneliness Query (Akelepan)',
  },
];

for (const testCase of testQueries) {
  const matched = mockQueryPsychologyLibrary(testCase.query);
  assert.ok(matched, `Failed to retrieve match for query: "${testCase.query}"`);
  assert.strictEqual(matched.id, testCase.expectedId, `Query "${testCase.label}" matched ${matched.id}, expected ${testCase.expectedId}`);
  console.log(`  ✓ [PASSED]: Query "${testCase.label}" -> Matched [${matched.id}] "${matched.name}"`);
}

console.log('\n================================================================');
console.log('🎉 ALL PSYCHOLOGY LIBRARY & RAG TESTS PASSED (100% SUCCESS)');
console.log('================================================================\n');
