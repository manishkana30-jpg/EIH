const assert = require('assert');
const {
  parseYesNoIntent,
  parseYesNoIntentDetailed,
  parseStageNavigationIntent,
  getLocalizedClarificationPrompt,
} = require('../lib/wellness-flow/confirm-intent-parser.ts');

console.log('Testing Multilingual Affirmations & Negations...');

const yesCases = [
  'हां सही है',
  'हाँ, यह सही है',
  'हाँ',
  'हां',
  'जी हाँ',
  'बिल्कुल सही',
  'theek hai',
  'sahi hai',
  'bilkul sahi',
  'yes',
  'yes that is right',
  'sí es correcto',
  'oui tout à fait',
  'ja genau',
  'sim está certo',
  'да именно так',
  'نعم صحيح',
  'その通りです',
  '是的没错',
  '네 맞아요',
  'बरोबर आहे',
  'একদম ঠিক',
  'மிகவும் சரி',
  'సరిగ్గా చెప్పారు',
  'સાચી વાત છે'
];

for (const t of yesCases) {
  const intent = parseYesNoIntent(t);
  assert.strictEqual(intent, 'yes', `Expected "${t}" to parse as yes, got ${intent}`);
}
console.log(`✓ All ${yesCases.length} multilingual YES assertions passed!`);

const noCases = [
  'nahi',
  'nahin',
  'nahi ji',
  'bilkul nahi',
  'galat hai',
  'नहीं',
  'ना',
  'गलत है',
  'बिल्कुल नहीं',
  'no',
  'wrong',
  'not right',
  'no es correcto',
  'ce n\'est pas ça',
  'stimmt nicht',
  'non è così',
  'não está certo',
  'не так',
  'ليس كذلك',
  '違います',
  '完全不对',
  'না',
  'சரியில்லை'
];

for (const t of noCases) {
  const intent = parseYesNoIntent(t);
  assert.strictEqual(intent, 'no', `Expected "${t}" to parse as no, got ${intent}`);
}
console.log(`✓ All ${noCases.length} multilingual NO assertions passed!`);

console.log('\nTesting Stage Navigation Commands...');
const navNextCases = ['next', 'आगे', 'agla', 'आगे बढ़ो', 'अगला चरण', 'continue', 'siguiente', 'suivant', 'weiter', 'следующий', '次へ', '下一步', '다음'];
for (const t of navNextCases) {
  const nav = parseStageNavigationIntent(t);
  assert.strictEqual(nav, 'next', `Expected "${t}" to parse as next, got ${nav}`);
}
console.log(`✓ All ${navNextCases.length} navigation NEXT assertions passed!`);

const navGitaCases = ['gita', 'गीता', 'shloka', 'श्लोक', 'wisdom'];
for (const t of navGitaCases) {
  const nav = parseStageNavigationIntent(t);
  assert.strictEqual(nav, 'gita', `Expected "${t}" to parse as gita, got ${nav}`);
}
console.log(`✓ All ${navGitaCases.length} navigation GITA assertions passed!`);

const navCbtCases = ['cbt', 'विचार', 'reframe', 'सीबीटी', 'soch'];
for (const t of navCbtCases) {
  const nav = parseStageNavigationIntent(t);
  assert.strictEqual(nav, 'cbt', `Expected "${t}" to parse as cbt, got ${nav}`);
}
console.log(`✓ All ${navCbtCases.length} navigation CBT assertions passed!`);

const navTratakaCases = ['trataka', 'त्राटक', 'ध्यान', 'meditation', 'eye exercise'];
for (const t of navTratakaCases) {
  const nav = parseStageNavigationIntent(t);
  assert.strictEqual(nav, 'trataka', `Expected "${t}" to parse as trataka, got ${nav}`);
}
console.log(`✓ All ${navTratakaCases.length} navigation TRATAKA assertions passed!`);

const navRepeatCases = ['repeat', 'फिर से', 'दोहराएं', 'phir se', 'say again'];
for (const t of navRepeatCases) {
  const nav = parseStageNavigationIntent(t);
  assert.strictEqual(nav, 'repeat', `Expected "${t}" to parse as repeat, got ${nav}`);
}
console.log(`✓ All ${navRepeatCases.length} navigation REPEAT assertions passed!`);

console.log('\nTesting Localized Clarification Prompts...');
const hiPrompt = getLocalizedClarificationPrompt('hi');
assert(hiPrompt.includes('समझ'), 'Hindi prompt should contain empathetic text');
const esPrompt = getLocalizedClarificationPrompt('es');
assert(esPrompt.includes('entiendo'), 'Spanish prompt should contain empathetic text');
console.log('✓ Localized clarification prompts verified.');

console.log('\n🎉 ALL MULTILINGUAL & INTENT TESTS PASSED (100%)');
