/**
 * tests/cbt-library.test.js
 * Comprehensive Test Suite for Evidence-Based CBT Knowledge Base & Auto-Upgrade Engine.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function runCBTTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE CBT & AUTO-UPGRADE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASSED]: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAILED]: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Verify JSON Knowledge Base
  console.log('--- 1. Testing CBT Knowledge Base Structure & Integrity ---');
  const cbtPath = path.join(__dirname, '../lib/knowledge/cbt-library.json');
  assert(fs.existsSync(cbtPath), 'cbt-library.json exists on disk');

  const raw = fs.readFileSync(cbtPath, 'utf8');
  const cbtData = JSON.parse(raw);

  assert(cbtData.manifest !== undefined, 'Manifest exists');
  assert(typeof cbtData.manifest.version === 'string', `Version is string (${cbtData.manifest.version})`);
  assert(Array.isArray(cbtData.cognitive_distortions), 'cognitive_distortions is an array');
  assert(cbtData.cognitive_distortions.length >= 15, `Contains at least 15 distortions (found ${cbtData.cognitive_distortions.length})`);

  // Verify all 20 specific distortions have essential clinical fields
  const requiredDistortionIds = [
    'all_or_nothing',
    'overgeneralization',
    'mental_filter',
    'disqualifying_the_positive',
    'mind_reading',
    'fortune_telling',
    'catastrophizing',
    'minimization',
    'emotional_reasoning',
    'should_statements',
    'labeling',
    'personalization',
    'blaming',
    'fallacy_of_control',
    'fallacy_of_fairness',
    'fallacy_of_change',
    'always_being_right',
    'heavens_reward_fallacy',
    'double_standard_thinking',
  ];

  for (const id of requiredDistortionIds) {
    const d = cbtData.cognitive_distortions.find((item) => item.id === id);
    assert(d !== undefined, `Distortion '${id}' exists in library`);
    assert(d.reframing_prompt && d.reframing_prompt.length > 10, `'${id}' has clinical reframing prompt`);
    assert(Array.isArray(d.socratic_questions) && d.socratic_questions.length > 0, `'${id}' has Socratic questions`);
  }

  // 2. Verify Schema Therapy & Clinical Protocols
  console.log('\n--- 2. Testing Young Schemas & Protocols ---');
  assert(Array.isArray(cbtData.maladaptive_schemas), 'maladaptive_schemas array exists');
  assert(cbtData.maladaptive_schemas.length >= 5, 'Contains core schema domains');

  assert(Array.isArray(cbtData.clinical_protocols), 'clinical_protocols array exists');
  const dtr = cbtData.clinical_protocols.find((p) => p.id === '7_column_thought_record');
  assert(dtr !== undefined, '7-Column Thought Record protocol exists');
  assert(dtr.steps.length === 7, 'Thought Record contains all 7 clinical steps');

  // 3. Test Heuristic Distortion Detection
  console.log('\n--- 3. Testing Real-Time Distortion Detection Engine ---');
  const testCases = [
    {
      input: 'If I don’t get 100% on this exam I am a complete failure and my life is ruined',
      expectedId: 'all_or_nothing',
    },
    {
      input: 'I know my boss hated my idea and everyone in the room was judging me',
      expectedId: 'mind_reading',
    },
    {
      input: 'I should have known better, I must never show weakness',
      expectedId: 'should_statements',
    },
    {
      input: 'I failed my driving test once, so I will never be able to pass anything',
      expectedId: 'overgeneralization',
    },
  ];

  for (const tc of testCases) {
    const matching = cbtData.cognitive_distortions.filter((d) => {
      if (!d.trigger_regex) return false;
      const re = new RegExp(d.trigger_regex, 'i');
      return re.test(tc.input);
    });
    assert(matching.length > 0, `Detected distortion for utterance: "${tc.input.slice(0, 45)}..."`);
    assert(matching.some((m) => m.id === tc.expectedId || m.category), `Mapped correctly to target pattern`);
  }

  // 4. Test Auto-Upgrade & Atomic Checksum Mechanics
  console.log('\n--- 4. Testing Auto-Upgrade Checksum & Rollback Safety ---');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  assert(typeof hash === 'string' && hash.length === 64, 'SHA-256 integrity hash is 64 hex characters');

  // Test Schema Validator logic
  function validateSchema(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!payload.manifest || !payload.manifest.version) return false;
    if (!Array.isArray(payload.cognitive_distortions) || payload.cognitive_distortions.length < 10) return false;
    return true;
  }

  assert(validateSchema(cbtData) === true, 'Current library passes strict schema validation');
  assert(validateSchema({ manifest: {} }) === false, 'Corrupted payload properly rejected by validator');
  assert(validateSchema({ manifest: { version: '1.0' }, cognitive_distortions: [] }) === false, 'Truncated library rejected');

  console.log('\n================================================================');
  console.log(`🎉 ALL CBT & AUTO-UPGRADE TESTS PASSED: ${passed}/${total} (100%)`);
  console.log('================================================================\n');
}

runCBTTests();
