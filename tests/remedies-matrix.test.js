/**
 * Dual-Pathway Somatic & Doshic Healing Remedies Matrix Test Suite
 * 
 * Verifies that the model and ontology are trained with:
 * 1. Panic / Severe Anxiety ➔ Sympathetic Flight / High Prana Vata (Cold water DBT, 5-4-3-2-1 Grounding, Nadi Shodhana, heavy blanket).
 * 2. Rage / Frustration ➔ Sympathetic Fight / High Sadhaka Pitta (Socratic reframing, vigorous exercise, Shitali cooling breath, Karuna compassion).
 * 3. Hopelessness / Numbness ➔ Dorsal Vagal Freeze / High Tarpaka Kapha (Behavioral activation, bilateral tapping, Surya Bhedana, Jnana detachment).
 * 4. Awe / Deep Relief ➔ Ventral Vagal Safe / High Sattva (Gratitude anchoring, prosocial connection, Shanta Rasa, spiritual journaling).
 * 5. Permutations & Combinations across all 27 Cowen dimensions.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ontologyPath = path.join(__dirname, '..', 'lib', 'knowledge', 'modern-neuroscience-ontology.json');
const ontology = JSON.parse(fs.readFileSync(ontologyPath, 'utf8'));

console.log('\n--- Running Dual-Pathway Somatic & Doshic Remedies Matrix Tests ---');

// 1. Verify Top-Level Matrix
assert(ontology.doshic_remedies_matrix, 'Ontology must contain doshic_remedies_matrix');
assert(ontology.doshic_remedies_matrix.panic_severe_anxiety, 'Matrix must contain panic_severe_anxiety');
assert(ontology.doshic_remedies_matrix.rage_frustration, 'Matrix must contain rage_frustration');
assert(ontology.doshic_remedies_matrix.hopelessness_numbness, 'Matrix must contain hopelessness_numbness');
assert(ontology.doshic_remedies_matrix.awe_deep_relief, 'Matrix must contain awe_deep_relief');
console.log('  ✓ Verified 4 Top-Level Doshic & Nervous System Quadrants in Ontology');

// 2. Verify Quadrant 1: Panic / Severe Anxiety
const flight = ontology.doshic_remedies_matrix.panic_severe_anxiety;
assert.strictEqual(flight.doshic_state, "Sympathetic Flight / High Prana Vata");
assert(flight.scientific_remedy.includes("cold water") || flight.scientific_remedy.includes("5-4-3-2-1"));
assert(flight.ayurvedic_remedy.includes("Nadi Shodhana") || flight.ayurvedic_remedy.includes("blanket"));
assert(Array.isArray(flight.permutations) && flight.permutations.length >= 3);
console.log(`  ✓ Panic / Severe Anxiety ➔ [${flight.doshic_state}]`);
console.log(`    • Scientific: "${flight.scientific_remedy}"`);
console.log(`    • Ayurvedic: "${flight.ayurvedic_remedy}"`);

// 3. Verify Quadrant 2: Rage / Frustration
const fight = ontology.doshic_remedies_matrix.rage_frustration;
assert.strictEqual(fight.doshic_state, "Sympathetic Fight / High Sadhaka Pitta");
assert(fight.scientific_remedy.includes("Socratic") || fight.scientific_remedy.includes("exercise"));
assert(fight.ayurvedic_remedy.includes("Shitali") || fight.ayurvedic_remedy.includes("Karuna"));
assert(Array.isArray(fight.permutations) && fight.permutations.length >= 3);
console.log(`  ✓ Rage / Frustration ➔ [${fight.doshic_state}]`);
console.log(`    • Scientific: "${fight.scientific_remedy}"`);
console.log(`    • Ayurvedic: "${fight.ayurvedic_remedy}"`);

// 4. Verify Quadrant 3: Hopelessness / Numbness
const freeze = ontology.doshic_remedies_matrix.hopelessness_numbness;
assert.strictEqual(freeze.doshic_state, "Dorsal Vagal Freeze / High Tarpaka Kapha");
assert(freeze.scientific_remedy.includes("Behavioral activation") || freeze.scientific_remedy.includes("bilateral tapping"));
assert(freeze.ayurvedic_remedy.includes("Surya Bhedana") || freeze.ayurvedic_remedy.includes("Jnana"));
assert(Array.isArray(freeze.permutations) && freeze.permutations.length >= 3);
console.log(`  ✓ Hopelessness / Numbness ➔ [${freeze.doshic_state}]`);
console.log(`    • Scientific: "${freeze.scientific_remedy}"`);
console.log(`    • Ayurvedic: "${freeze.ayurvedic_remedy}"`);

// 5. Verify Quadrant 4: Awe / Deep Relief
const safe = ontology.doshic_remedies_matrix.awe_deep_relief;
assert.strictEqual(safe.doshic_state, "Ventral Vagal Safe / High Sattva");
assert(safe.scientific_remedy.includes("Gratitude") || safe.scientific_remedy.includes("connection"));
assert(safe.ayurvedic_remedy.includes("Shanta Rasa") || safe.ayurvedic_remedy.includes("journaling"));
assert(Array.isArray(safe.permutations) && safe.permutations.length >= 3);
console.log(`  ✓ Awe / Deep Relief ➔ [${safe.doshic_state}]`);
console.log(`    • Scientific: "${safe.scientific_remedy}"`);
console.log(`    • Ayurvedic: "${safe.ayurvedic_remedy}"`);

// 6. Verify Complete Coverage of All 27 Cowen Dimensions
ontology.cowen_dimensions.forEach((dim) => {
  assert(dim.doshic_nervous_system_state, `Dimension ${dim.name} missing doshic state`);
  assert(dim.scientific_remedy, `Dimension ${dim.name} missing scientific remedy`);
  assert(dim.ayurvedic_remedy, `Dimension ${dim.name} missing ayurvedic remedy`);
  assert(dim.combined_remedy_action, `Dimension ${dim.name} missing combined remedy action`);
  assert(Array.isArray(dim.remedy_permutations) && dim.remedy_permutations.length >= 3, `Dimension ${dim.name} missing permutations`);
});
console.log(`  ✓ All ${ontology.cowen_dimensions.length} Cowen Dimensions fully verified with Dual-Pathway Remedies and Permutations`);
console.log('\nDual-Pathway Remedies Matrix Tests: 100% Passed!\n');
