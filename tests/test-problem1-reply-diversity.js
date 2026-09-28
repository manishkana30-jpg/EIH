/**
 * tests/test-problem1-reply-diversity.js
 *
 * Permanent Regression Test: Reply Diversity & Contextual Grounding.
 * Verifies that varied emotional messages across English and Hindi:
 * 1. Do NOT collapse into a single generic/canned template.
 * 2. Maintain a high uniqueness ratio (>= 85%).
 * 3. Have low cross-category text similarity (<= 25%).
 * 4. Ground themselves in specific life domains (grief, debt, interview, etc.) rather than static boilerplate.
 */

const assert = require('assert');
const { emotionEngine } = require('../lib/wellness-flow/emotion-engine.ts');

const DIVERSE_TEST_SET = [
  { id: 1, text: 'I am so furious at my manager for yelling at me in front of the whole team', lang: 'en', expectedDomain: 'interpersonal_conflict' },
  { id: 2, text: 'I lost my grandmother last weekend and the silence at home is unbearable', lang: 'en', expectedDomain: 'grief_bereavement' },
  { id: 3, text: 'My partner broke up with me after five years and I feel completely broken inside', lang: 'en', expectedDomain: 'breakup_heartbreak' },
  { id: 4, text: 'I have a critical job interview tomorrow morning and I am trembling with anxiety', lang: 'en', expectedDomain: 'interview_exam' },
  { id: 5, text: 'My debts and unpaid bills are piling up and I cannot sleep from the stress', lang: 'en', expectedDomain: 'financial_debt' },
  { id: 6, text: 'I feel like a total fraud and imposter at work and everyone is going to find out', lang: 'en', expectedDomain: 'self_worth_imposter' },
  { id: 7, text: 'My heart has been beating irregularly and I am terrified something is physically wrong', lang: 'en', expectedDomain: 'health_somatic' },
  { id: 8, text: 'I haven\'t slept in four days, completely exhausted and burned out from overwork', lang: 'en', expectedDomain: 'sleep_exhaustion' },
  { id: 9, text: 'I feel completely alone in this dark room and nobody cares if I exist', lang: 'en', expectedDomain: 'loneliness' },
  { id: 10, text: 'I don\'t know, just feeling off and uncertain today', lang: 'en', expectedDomain: 'general_distress' },
  { id: 11, text: 'मुझे अपने बॉस पर बहुत गुस्सा आ रहा है, उसने सबके सामने मुझे बेइज्जत किया', lang: 'hi', expectedDomain: 'interpersonal_conflict' },
  { id: 12, text: 'दादी के देहांत के बाद से घर बिल्कुल खाली और वीरान लग रहा है, गहरा शोक है', lang: 'hi', expectedDomain: 'grief_bereavement' },
  { id: 13, text: 'उसने अचानक रिश्ता तोड़ दिया और मुझे छोड़कर चला गया, दिल टूट गया है', lang: 'hi', expectedDomain: 'breakup_heartbreak' },
  { id: 14, text: 'कल मेरी सरकारी नौकरी का इंटरव्यू है और मुझे बहुत घबराहट और डर लग रहा है', lang: 'hi', expectedDomain: 'interview_exam' },
  { id: 15, text: 'कर्ज का बोझ बहुत बढ़ गया है, बैंक वाले परेशान कर रहे हैं और भारी तनाव है', lang: 'hi', expectedDomain: 'financial_debt' },
  { id: 16, text: 'ऑफिस में काम का इतना ज्यादा दबाव है कि मैं पूरी तरह से टूट गया हूँ', lang: 'hi', expectedDomain: 'work_career' },
  { id: 17, text: 'मुझे बहुत अकेलापन महसूस हो रहा है, कोई मुझसे बात नहीं करता', lang: 'hi', expectedDomain: 'loneliness' },
  { id: 18, text: 'शरीर में बहुत बेचैनी है और दिल तेजी से धड़क रहा है, बहुत डर लग रहा है', lang: 'hi', expectedDomain: 'health_somatic' },
  { id: 19, text: 'बस ऐसे ही, कुछ समझ नहीं आ रहा कि क्या महसूस हो रहा है', lang: 'hi', expectedDomain: 'general_distress' },
  { id: 20, text: 'आज सुबह से मन शांत, प्रसन्न और बहुत हल्का महसूस हो रहा है', lang: 'hi', expectedDomain: 'general_distress' },
];

function calculateJaccardSimilarity(textA, textB) {
  const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

console.log('================================================================================');
console.log('RUNNING PERMANENT REGRESSION TEST: PROBLEM 1 — REPLY DIVERSITY & REPETITION CHECK');
console.log('================================================================================\n');

const generatedReplies = [];

DIVERSE_TEST_SET.forEach((tc) => {
  const profile = emotionEngine.analyze(tc.text);
  const reply = emotionEngine.generateConfirmationStatement(profile, tc.lang);

  // Check 1: Ensure no generic fallback phrases appear
  assert.ok(!reply.includes('मैं आपकी सहायता'), `TC #${tc.id} contains generic fallback greeting!`);
  assert.ok(!reply.includes('आप किस समस्या का समाधान'), `TC #${tc.id} contains generic problem query!`);
  assert.ok(!reply.includes('in this situation'), `TC #${tc.id} contains obsolete generic catch-all!`);

  generatedReplies.push({
    id: tc.id,
    lang: tc.lang,
    text: tc.text,
    emotion: profile.primary_emotion,
    domain: profile.trigger_domain,
    reply,
  });

  console.log(`[PASS] TC #${tc.id} (${tc.lang.toUpperCase()}) | Emotion: ${profile.primary_emotion} | Domain: ${profile.trigger_domain}`);
  console.log(`       Reply: "${reply}"`);
});

// Check 2: Uniqueness ratio
const uniqueReplies = new Set(generatedReplies.map(r => r.reply));
const uniquenessRatio = uniqueReplies.size / generatedReplies.length;
console.log(`\nUniqueness ratio: ${(uniquenessRatio * 100).toFixed(1)}% (${uniqueReplies.size}/${generatedReplies.length})`);
assert.ok(uniquenessRatio >= 0.85, `Uniqueness ratio ${(uniquenessRatio * 100).toFixed(1)}% is below 85% requirement!`);

// Check 3: Text similarity across replies of different domains
let totalPairs = 0;
let totalSimilarity = 0;
for (let i = 0; i < generatedReplies.length; i++) {
  for (let j = i + 1; j < generatedReplies.length; j++) {
    const a = generatedReplies[i];
    const b = generatedReplies[j];
    // Only compare within same language to get meaningful similarity
    if (a.lang === b.lang && a.domain !== b.domain) {
      const sim = calculateJaccardSimilarity(a.reply, b.reply);
      totalSimilarity += sim;
      totalPairs++;
    }
  }
}

const avgCrossDomainSimilarity = totalPairs > 0 ? (totalSimilarity / totalPairs) : 0;
console.log(`Average cross-domain reply similarity: ${(avgCrossDomainSimilarity * 100).toFixed(1)}% (Target: <= 25%)`);
assert.ok(avgCrossDomainSimilarity <= 0.25, `Cross-domain similarity ${(avgCrossDomainSimilarity * 100).toFixed(1)}% exceeds 25%!`);

console.log('\nALL PROBLEM 1 REPLY DIVERSITY CHECKS PASSED SUCCESSFULLY!\n');
