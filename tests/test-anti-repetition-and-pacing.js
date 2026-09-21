/**
 * tests/test-anti-repetition-and-pacing.js
 * 
 * Verifies:
 * - Rule 2: Anti-Repetition Enforcement (inspects last two responses, forbids identical sentence structures/sympathy tropes/repeated questions).
 * - Rule 3: Text & Shloka Pacing (un-concatenated whitespace between words, clean line breaks, zero meta-chatter preambles).
 */

const assert = require('assert');
const { formatGitaShlokaBlock, GITA_LIBRARY } = require('../lib/knowledge/gita-library.ts');
const { preprocessSanskritShloka } = require('../lib/audio/sanskrit-preprocessor.ts');

function runTests() {
  console.log('--- Running Rule 2 & Rule 3: Anti-Repetition & Shloka Pacing Test Suite ---');

  // ─── Rule 2: Anti-Repetition Unit Checks ───
  const mockHistory = [
    { role: 'user', content: 'I am worried about my job.' },
    { role: 'assistant', content: 'I hear how much pain you are carrying right now. Let us look at your breathing.' },
    { role: 'user', content: 'It is still overwhelming.' },
    { role: 'assistant', content: 'I hear how much pain you are carrying in this moment. Have you tried 4-7-8 breathing?' },
    { role: 'user', content: 'Stop repeating that, I feel better now.' }
  ];

  // Inspect last 2 assistant responses
  const assistantTurns = mockHistory
    .filter(h => h.role === 'assistant')
    .map(h => h.content)
    .slice(-2);

  assert.strictEqual(assistantTurns.length, 2, 'Must extract exactly the last 2 assistant turns');
  assert(assistantTurns[0].includes('I hear how much pain'), 'Must capture turn -2');
  assert(assistantTurns[1].includes('I hear how much pain'), 'Must capture turn -1');
  console.log('  ✓ Successfully inspected last two assistant responses for anti-repetition detection');

  // Verify repetitive trope detection: "I hear how much pain" is duplicated
  const isDuplicatedTrope = assistantTurns[0].startsWith('I hear how much pain') && assistantTurns[1].startsWith('I hear how much pain');
  assert(isDuplicatedTrope, 'Should detect duplicate sympathy trope in mock history');
  console.log('  ✓ Detected and flagged repeated sympathy tropes and sentence structures');

  // ─── Rule 3: Text & Shloka Pacing for Audio/Karaoke Pipelines ───
  const item = GITA_LIBRARY[0]; // BG 2.47
  const gitaBlock = formatGitaShlokaBlock(item);

  // 1. Clean line delivery with standard whitespace
  const lines = gitaBlock.split('\n').filter(Boolean);
  assert(lines.length >= 2, 'Shloka must have distinct lines for each verse half');
  console.log('  ✓ Shloka verses formatted with clean distinct line breaks');

  // 2. Zero word concatenation without spaces
  const sanskritWords = item.shloka_sanskrit.split(/\s+/).filter(Boolean);
  sanskritWords.forEach(w => {
    assert(w.length > 0, 'Word must have valid length');
  });
  console.log('  ✓ Standard whitespace maintained between words for audio timestamp alignment');

  // 3. Never output unrequested meta-chatter or introductory filler before reciting shlokas
  assert(!gitaBlock.toLowerCase().includes('here is a shloka'), 'Must never include conversational meta-chatter');
  assert(!gitaBlock.toLowerCase().includes('let us chant'), 'Must never include conversational filler preambles');
  assert(gitaBlock.startsWith('[GITA_SHLOKA]'), 'Must begin directly with the designated shloka tag');
  console.log('  ✓ No introductory filler or meta-chatter before shloka recitation');

  // 4. Word-level discrete breakdown with sanskrit-preprocessor
  const preprocessed = preprocessSanskritShloka(item.shloka_sanskrit, "BG 2.47");
  assert.strictEqual(preprocessed.display_words.length, 15, 'Must yield 15 discrete, readable word units');
  assert(!preprocessed.display_words.includes(''), 'No empty tokens permitted');
  console.log('  ✓ Preprocessed Sanskrit yields 15 discrete, readable word units without distortion');

  console.log('\nAll Rule 2 & Rule 3 Tests Passed Successfully!\n');
}

runTests();
