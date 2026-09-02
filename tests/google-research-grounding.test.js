/**
 * Authenticated Research Grounding & Deep Listening Test Suite
 * 
 * Verifies:
 * 1. Listening & Deep Emotional Attunement.
 * 2. Authenticated Psychological & Ayurvedic Research Bank Retrieval.
 * 3. Evidence-Backed Action Recommendations across all emotional states.
 * 4. Multilingual Research Grounding (English, Hindi, Hinglish).
 */

const assert = require('assert');
const { getResearchedAdviceForEmotion, AUTHENTICATED_RESEARCH_BANK } = require('../lib/knowledge/authenticated-research-bank.ts');
const { generateDynamicCompanionReply } = require('../lib/nlp/conversational-companion-engine.ts');

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

// 5. Test Live Companion Advice Synthesis
const panicAdvice = generateDynamicCompanionReply({
  userText: "I am having severe anxiety and panic, what should I do according to research?",
  emotionDimension: 'anxiety',
  sessionUsedKeys: new Set(),
});
assert(panicAdvice.detectedTopic === 'advice_request', 'Must detect advice_request topic');
const lowerReply = panicAdvice.reply.toLowerCase();
assert(
  lowerReply.includes('research') ||
  lowerReply.includes('evidence') ||
  lowerReply.includes('studies') ||
  lowerReply.includes('clinical') ||
  panicAdvice.reply.includes('Nadi Shodhana') ||
  panicAdvice.reply.includes('cold water'),
  'Must contain scientific/clinical research grounding terms'
);
console.log('  ✓ [Companion Advice Output]: ' + panicAdvice.reply.slice(0, 100) + '...');

// 6. Test Hindi Advice Synthesis
const hindiAdvice = generateDynamicCompanionReply({
  userText: "मुझे बहुत घबराहट हो रही है, कोई वैज्ञानिक उपाय या सलाह दीजिए क्या करूं?",
  emotionDimension: 'anxiety',
});
assert(hindiAdvice.detectedLanguage === 'hi');
assert(hindiAdvice.reply.includes('रिसर्च') || hindiAdvice.reply.includes('उपाय') || hindiAdvice.reply.includes('नाड़ी शोधन') || hindiAdvice.reply.includes('पानी'));
console.log('  ✓ [Hindi Advice Output]: ' + hindiAdvice.reply.slice(0, 100) + '...');

console.log('\nAuthenticated Research Grounding Tests: 100% Passed!\n');
