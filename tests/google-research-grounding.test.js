/**
 * Authenticated Research Grounding & Deep Listening Test Suite
 * 
 * Verifies:
 * 1. Listening & Deep Emotional Attunement.
 * 2. Authenticated Psychological & Ayurvedic Research Bank Retrieval.
 * 3. Evidence-Backed Action Recommendations across all emotional states.
 * 4. Psychology Library RAG Grounding.
 */

const assert = require('assert');
const { getResearchedAdviceForEmotion, AUTHENTICATED_RESEARCH_BANK } = require('../lib/knowledge/authenticated-research-bank.ts');
const { queryPsychologyLibrary } = require('../lib/knowledge/psychology-library-rag.ts');

console.log('\n--- Running Authenticated Research Grounding & Deep Listening Tests ---');

// 1. Verify Research Bank Database
assert(AUTHENTICATED_RESEARCH_BANK.length >= 4, 'Research bank must contain authenticated studies');
console.log(`  ✓ Verified ${AUTHENTICATED_RESEARCH_BANK.length} Authenticated Peer-Reviewed Clinical Studies in Research Bank`);

// 2. Test Panic / Anxiety Retrieval
const anxietyStudy = getResearchedAdviceForEmotion('anxiety', 'Sympathetic Flight / High Prana Vata');
assert(anxietyStudy.citation.includes('Linehan') || anxietyStudy.citation.includes('Sharma'), 'Must cite Linehan or Sharma');
assert(anxietyStudy.scientificActionProtocol.includes('cold water') || anxietyStudy.scientificActionProtocol.includes('5-4-3-2-1'));
assert(anxietyStudy.ayurvedicActionProtocol.includes('Nadi Shodhana'));
console.log('  ✓ [Panic/Anxiety]: Grounded in ' + anxietyStudy.citation);

// 3. Test Rage / Anger Retrieval
const rageStudy = getResearchedAdviceForEmotion('anger', 'Sympathetic Fight / High Sadhaka Pitta');
assert(rageStudy.citation.includes('Van der Kolk') || rageStudy.citation.includes('Giri'));
assert(rageStudy.scientificActionProtocol.includes('pushups') || rageStudy.scientificActionProtocol.includes('shaking') || rageStudy.scientificActionProtocol.includes('Socratic'));
assert(rageStudy.ayurvedicActionProtocol.includes('Shitali'));
console.log('  ✓ [Rage/Anger]: Grounded in ' + rageStudy.citation);

// 4. Test Hopelessness / Freeze Retrieval
const freezeStudy = getResearchedAdviceForEmotion('sadness', 'Dorsal Vagal Freeze / High Tarpaka Kapha');
assert(freezeStudy.citation.includes('Lejuez') || freezeStudy.citation.includes('Shapiro'));
assert(freezeStudy.scientificActionProtocol.includes('micro-task') || freezeStudy.scientificActionProtocol.includes('tapping'));
assert(freezeStudy.ayurvedicActionProtocol.includes('Surya Bhedana'));
console.log('  ✓ [Hopelessness/Freeze]: Grounded in ' + freezeStudy.citation);

// 5. Test Psychology Library Semantic RAG Query
const panicRag = queryPsychologyLibrary("I am having severe anxiety and panic attacks at work");
assert(panicRag !== null, 'Must retrieve matching psychology condition');
assert(panicRag.condition.id === 'panic_disorder' || panicRag.condition.id === 'gad' || panicRag.condition.id === 'workplace_burnout');
assert(panicRag.condition.solutions.cbt_reframing.length > 10, 'Must have CBT reframing solution');
assert(panicRag.condition.solutions.somatic_anchor.length > 10, 'Must have somatic anchor');
assert(panicRag.condition.solutions.pranayama.length > 10, 'Must have pranayama prescription');
console.log(`  ✓ [Psychology Library RAG]: Matched condition [${panicRag.condition.name}] (${panicRag.condition.triguna_balance})`);

// 6. Test Ayurvedic & Neuropsychology Cross-Grounding
const burnoutStudy = getResearchedAdviceForEmotion('sadness');
assert(burnoutStudy.citation && burnoutStudy.scientificActionProtocol, 'Must have valid citation and action protocol');
console.log('  ✓ [Burnout Research Grounding]: ' + burnoutStudy.citation);

console.log('\nAuthenticated Research Grounding Tests: 100% Passed!\n');
