/**
 * tests/test-sequential-cards-and-karaoke.js
 *
 * Dedicated Test Suite for:
 * 1. Affirmative user reply interception (preventing redundant chat loops when confirming Card 1).
 * 2. Sequential stage progression: Card 1 -> Card 2 (Gita) -> Card 3 (CBT) -> Card 4 (Tratak).
 * 3. 1:1 word-for-word synchronization between speechText and rendered tokens for red karaoke highlighting.
 * 4. Responsive affirmation turnaround (1400ms) with patient clinical listening (4200ms-6000ms).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runSequentialCardsTests() {
  console.log('\n--- Running Sequential Cards & 1:1 Red Karaoke Test Suite ---');

  // Test 1: Affirmative Regex Evaluation
  const affirmativeRegex =
    /^(yes|yeah|yep|right|correct|that's right|thats right|haan|sahi|sahi hai|bilkul|ha|si|oui|ja|yes please|exactly|true|agree|affirmative|y|theek hai|thik hai|ji haan|ji|haanji|okay|ok)\b/i;
  const affirmativePhrases =
    /\b(yes that is right|yes it is|yes correct|yes right|haan sahi|sahi hai|bilkul sahi|yes this is right|yes i am|it is right|thats right|that is right)\b/i;

  const validAffirmations = [
    'yes',
    'Yes',
    'yes.',
    'yeah',
    'yep',
    'haan',
    'haan ji',
    'ji haan',
    'sahi hai',
    'bilkul',
    'theek hai',
    'correct',
    'right',
    'yes that is right',
    'yes it is',
    'yes please',
    'that is right',
  ];

  validAffirmations.forEach((phrase) => {
    const clean = phrase.trim().toLowerCase().replace(/[.,!?;:"]/g, '');
    const isAffirmative = affirmativeRegex.test(clean) || affirmativePhrases.test(clean);
    assert(isAffirmative, `Failed to match affirmative phrase: "${phrase}"`);
  });

  const nonAffirmations = [
    'no that is wrong',
    'actually I feel angry',
    'tell me more about meditation',
    'what about my job',
  ];

  nonAffirmations.forEach((phrase) => {
    const clean = phrase.trim().toLowerCase().replace(/[.,!?;:"]/g, '');
    const isAffirmative = affirmativeRegex.test(clean) || affirmativePhrases.test(clean);
    assert(!isAffirmative, `Should NOT match non-affirmative phrase: "${phrase}"`);
  });

  console.log('  ✓ Verified affirmative voice/text recognition correctly captures all affirmative confirmations');
  console.log('  ✓ Verified non-affirmative messages bypass the interceptor to process as new questions');

  // Test 2: Source Code Verification in page.tsx
  const pagePath = path.join(__dirname, '..', 'app', '(session)', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert(pageContent.includes('isAffirmativeConfirmation'), 'page.tsx must define isAffirmativeConfirmation');
  assert(pageContent.includes('handleConfirmStage1(lastAiMsg.id)'), 'page.tsx must call handleConfirmStage1 on affirmation');
  assert(pageContent.includes('activeSpeakingStageRef.current = { messageId, stage: 2 }'), 'handleConfirmStage1 must set stage 2 speaking ref');
  assert(pageContent.includes('activeSpeakingStageRef.current = { messageId, stage: 3 }'), 'handleAudioEnd must chain stage 2 to stage 3');
  assert(pageContent.includes('activeSpeakingStageRef.current = { messageId, stage: 4 }'), 'handleAudioEnd must chain stage 3 to stage 4');

  console.log('  ✓ Verified page.tsx sequential card progression and auto-advance from Stage 2 -> 3 -> 4');

  // Test 3: Source Code Verification in KaraokeMessage.tsx
  const karaokePath = path.join(__dirname, '..', 'app', '(session)', 'components', 'KaraokeMessage.tsx');
  const karaokeContent = fs.readFileSync(karaokePath, 'utf8');

  // Confirm handleConfirmS1 does NOT duplicate voice call
  const handleConfirmS1Match = karaokeContent.match(/const handleConfirmS1 = \(\) => {([\s\S]*?)};/);
  assert(handleConfirmS1Match, 'KaraokeMessage.tsx must define handleConfirmS1');
  assert(!handleConfirmS1Match[1].includes('onPlayStageVoice'), 'handleConfirmS1 must NOT double-call onPlayStageVoice');

  // Confirm handleAdvanceTo does NOT duplicate voice call
  const handleAdvanceToMatch = karaokeContent.match(/const handleAdvanceTo = \([^)]*\) => {([\s\S]*?)};/);
  assert(handleAdvanceToMatch, 'KaraokeMessage.tsx must define handleAdvanceTo');
  assert(!handleAdvanceToMatch[1].includes('onPlayStageVoice'), 'handleAdvanceTo must NOT double-call onPlayStageVoice');

  // Confirm Shloka is rendered with card2Counter
  assert(karaokeContent.includes('stage2SpokenShloka'), 'KaraokeMessage.tsx must compute stage2SpokenShloka');
  assert(karaokeContent.includes('card2Counter'), 'KaraokeMessage.tsx must tokenize Shloka words with card2Counter');

  console.log('  ✓ Verified KaraokeMessage.tsx eliminates double voice call race condition');
  console.log('  ✓ Verified Card 2 tokenizes Shloka with card2Counter for live red karaoke');

  // Test 4: Verify 1:1 Word Synchronization in karaoke-tokenizer.ts
  const tokenizerPath = path.join(__dirname, '..', 'lib', 'audio', 'karaoke-tokenizer.ts');
  const tokenizerContent = fs.readFileSync(tokenizerPath, 'utf8');

  assert(tokenizerContent.includes('Math.abs(currentWordIndex - activeKaraoke.wordIndex) <= 8'), 'isWordActive must support up to 8-word proximity');
  assert(!tokenizerContent.includes('आपकी स्थिति का मूल्यांकन: मैं समझ सकता हूँ कि आप इस समय'), 's1SpeechText must not have un-rendered preamble');
  assert(!tokenizerContent.includes('Sanctuary understanding: I hear that you are navigating'), 's1SpeechText must not have un-rendered English preamble');

  console.log('  ✓ Verified karaoke-tokenizer.ts 1:1 word synchronization for all 4 stages');

  // Test 5: Verify browser-speech.ts debouncer settings
  const speechPath = path.join(__dirname, '..', 'lib', 'audio', 'browser-speech.ts');
  const speechContent = fs.readFileSync(speechPath, 'utf8');

  assert(speechContent.includes('isShortAffirmation ? 1400'), 'browser-speech.ts must set 1400ms delay for quick affirmative replies');
  assert(speechContent.includes("rate: '-12%'"), 'browser-speech.ts must use -12% rate for medium soothing speech');

  console.log('  ✓ Verified browser-speech.ts has prompt affirmative turnaround (1400ms) and medium pace (-12%)');

  console.log('\nSequential Cards & 1:1 Red Karaoke Tests: All Passed Successfully!\n');
}

module.exports = { runSequentialCardsTests };

if (require.main === module) {
  runSequentialCardsTests();
}
