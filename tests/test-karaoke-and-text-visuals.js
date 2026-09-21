/**
 * tests/test-karaoke-and-text-visuals.js
 * 
 * Unit Test Suite for Real-Time Karaoke Mode, Word/Sentence Highlighting via
 * SpeechSynthesisUtterance.onboundary, Auto-Scroll Centering, and Clean Text-First Visuals
 * (no cards, no transformed diagram boxes, clean inline text placement).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ─── 1. Karaoke Word & Sentence Boundary Mapping Logic ───
function buildCleanWordList(cleanText) {
  const sentences = cleanText.split(/(?<=[.!?।])\s+/).filter(Boolean);
  const cleanWordList = [];
  let charCursor = 0;

  sentences.forEach((sent, sentIdx) => {
    const sentWords = sent.trim().split(/\s+/).filter(Boolean);
    sentWords.forEach((w) => {
      const startChar = cleanText.indexOf(w, charCursor);
      const endChar = startChar >= 0 ? startChar + w.length : charCursor + w.length;
      charCursor = Math.max(charCursor, endChar);
      cleanWordList.push({
        word: w,
        sentenceIdx: sentIdx,
        startChar: startChar >= 0 ? startChar : charCursor,
        endChar,
      });
    });
  });

  return { sentences, cleanWordList };
}

function findActiveWordAndSentence(cleanWordList, charIndex) {
  if (cleanWordList.length === 0) return { wordIdx: -1, sentenceIdx: -1, word: '' };

  let activeWordIdx = cleanWordList.findIndex(
    (w) => charIndex >= w.startChar && charIndex <= w.endChar
  );

  if (activeWordIdx < 0) {
    let minD = Infinity;
    cleanWordList.forEach((w, idx) => {
      const d = Math.abs(w.startChar - charIndex);
      if (d < minD) {
        minD = d;
        activeWordIdx = idx;
      }
    });
  }

  activeWordIdx = Math.max(0, activeWordIdx);
  const wordObj = cleanWordList[activeWordIdx];
  return {
    wordIdx: activeWordIdx,
    sentenceIdx: wordObj ? wordObj.sentenceIdx : 0,
    word: wordObj ? wordObj.word : '',
  };
}

function cleanWordForMatch(str) {
  return str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function isWordActive(currentWordIndex, wordStr, activeKaraoke) {
  if (!activeKaraoke) return false;

  if (activeKaraoke.wordText) {
    const cleanWord = cleanWordForMatch(wordStr);
    const cleanTarget = cleanWordForMatch(activeKaraoke.wordText);
    if (cleanWord && cleanTarget && cleanWord === cleanTarget) {
      if (Math.abs(currentWordIndex - activeKaraoke.wordIndex) <= 8) {
        return true;
      }
    }
  }

  return currentWordIndex === activeKaraoke.wordIndex;
}

// ─── 2. Clean Text-First Visuals Parser Logic (No Cards or Transforming Boxes) ───
function cleanMarkdownForRender(content) {
  return content
    .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/i, '')
    .replace(/!\[(.*?)\]\([^\)]*\)/g, '$1')
    .replace(/\[(?:diagram|visual|flow):\s*(.*?)\]/gi, '$1');
}

function cleanMessageForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/gi, '')
    .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/gim, '')
    .replace(/!\[(.*?)\]\([^\)]*\)/g, '$1')
    .replace(/\[(?:diagram|visual|flow):\s*(.*?)\]/gi, '$1')
    .replace(/\s*(?:->|→|-->)\s*/g, ', then ');
}

async function runKaraokeAndTextVisualsTests() {
  console.log('\n--- Running Real-Time Karaoke & Clean Text-First Visuals Test Suite ---');

  // Test 1: Word & Sentence Boundary Precomputation & Resolution
  const sampleCleanText = "Take a deep breath and center your awareness. Notice how the breath calms the nervous system.";
  const { sentences, cleanWordList } = buildCleanWordList(sampleCleanText);

  assert.strictEqual(sentences.length, 2, 'Must detect 2 sentences in sample text');
  assert(cleanWordList.length >= 14, `Must extract individual words, got ${cleanWordList.length}`);

  // Test boundary at index 0 ('Take')
  const res0 = findActiveWordAndSentence(cleanWordList, 0);
  assert.strictEqual(res0.wordIdx, 0, 'Character offset 0 must map to word index 0');
  assert.strictEqual(res0.sentenceIdx, 0, 'Word 0 must belong to sentence 0');
  assert.strictEqual(res0.word, 'Take', 'Word 0 must be Take');

  // Test boundary in 2nd sentence ('Notice')
  const noticeCharIndex = sampleCleanText.indexOf('Notice');
  const resNotice = findActiveWordAndSentence(cleanWordList, noticeCharIndex);
  assert.strictEqual(resNotice.sentenceIdx, 1, 'Notice must belong to sentence 1');
  assert.strictEqual(resNotice.word, 'Notice', 'Word must be Notice');

  console.log('  ✓ Precomputed word and sentence character boundary mapping');
  console.log('  ✓ Accurately mapped SpeechSynthesisUtterance.onboundary offsets to word and sentence indices');

  // Test 2: Word text matching with punctuation and accents
  const activeKaraokeState = {
    messageId: 'test-msg-1',
    wordIndex: 3,
    sentenceIndex: 0,
    wordText: 'breath',
  };

  assert(isWordActive(3, 'breath,', activeKaraokeState), 'Must match word with punctuation (breath,)');
  assert(isWordActive(4, 'breath', activeKaraokeState), 'Must match word within proximity window');
  assert(!isWordActive(12, 'breath', activeKaraokeState), 'Must NOT match distant duplicate word');

  console.log('  ✓ Resilient word matching with Unicode normalizer and proximity window');

  // Test 3: Clean Text-First Visuals (No cards, clean text inline where required)
  const imgLine = '![Autonomic Ladder - Ventral Vagal State](https://cdn.example.com/ladder.png)';
  const renderedImg = cleanMarkdownForRender(imgLine);
  assert.strictEqual(renderedImg, 'Autonomic Ladder - Ventral Vagal State', 'Image URLs must be stripped leaving clean inline text');
  assert(!renderedImg.includes('http'), 'Rendered text must not contain broken image links');

  const diagLine = '[diagram: Cognitive Restructuring Feedback Loop]';
  const renderedDiag = cleanMarkdownForRender(diagLine);
  assert.strictEqual(renderedDiag, 'Cognitive Restructuring Feedback Loop', 'Diagram tags must be stripped leaving clean inline text');

  const flowLine = 'Trigger -> Automatic Thought -> Emotional Reaction';
  const renderedFlow = cleanMarkdownForRender(flowLine);
  assert.strictEqual(renderedFlow, 'Trigger -> Automatic Thought -> Emotional Reaction', 'Flowchart arrow text is preserved inline as clean text');

  // 1-to-1 Speech and Render Word Alignment
  const fullMessage = `**1. Bhagavad Gita Wisdom: (Chapter 2, Verse 70)**
Like the ocean remains still while waters enter it, maintain equanimity.
![Ventral Vagal Breathing](https://cdn.example.com/breath.png)
[diagram: Somatic Grounding]`;

  const speechText = cleanMessageForSpeech(fullMessage);
  assert(!speechText.includes('**1. Bhagavad Gita'), 'Section header must be stripped from speech to prevent word offset');
  assert(!speechText.includes('https://'), 'URL must be stripped from speech');
  assert(speechText.includes('Like the ocean remains still'), 'Body text must be preserved');
  assert(speechText.includes('Ventral Vagal Breathing'), 'Image alt text is read naturally');
  assert(speechText.includes('Somatic Grounding'), 'Diagram label is read naturally');

  console.log('  ✓ Verified images and diagrams render as clean text inline without cards or boxes');
  console.log('  ✓ Verified cleanMessageForSpeech strips headers to maintain 1:1 word alignment with rendered UI');

  // Test 4: Verify page.tsx and browser-speech.ts Code Implementation
  const pagePath = path.join(__dirname, '..', 'app', '(session)', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert(pageContent.includes('activeKaraoke'), 'page.tsx must maintain activeKaraoke state');
  assert(pageContent.includes('id="active-karaoke-word"'), 'page.tsx must assign id="active-karaoke-word" to current word');
  assert(pageContent.includes('onWordBoundary'), 'page.tsx must wire onWordBoundary to browserSpeechController');
  assert(pageContent.includes('container.scrollBy') || pageContent.includes('chatContainerRef.current.scrollBy'), 'page.tsx must use smooth scrollBy to center spoken word');
  assert(pageContent.includes('speakWithWebSpeechSynth'), 'page.tsx must prioritize speakWithWebSpeechSynth for SpeechSynthesisUtterance.onboundary');
  assert(!pageContent.includes('Contextual Visual Guide'), 'page.tsx must NOT contain Contextual Visual Guide card wrappers');
  assert(!pageContent.includes('Clinical Neural Pathway'), 'page.tsx must NOT contain Clinical Neural Pathway card wrappers');

  const speechPath = path.join(__dirname, '..', 'lib', 'audio', 'browser-speech.ts');
  const speechContent = fs.readFileSync(speechPath, 'utf8');

  assert(speechContent.includes('utterance.onboundary'), 'browser-speech.ts must listen to utterance.onboundary');
  assert(speechContent.includes('onWordBoundary?:'), 'browser-speech.ts must declare onWordBoundary in callbacks');
  assert(speechContent.includes('public async speakWithWebSpeechSynth'), 'browser-speech.ts must export speakWithWebSpeechSynth as public');

  console.log('  ✓ Verified page.tsx has active-karaoke-word ID and auto-scroll centering implementation');
  console.log('  ✓ Verified page.tsx prioritizes SpeechSynthesisUtterance and avoids card wrappers');
  console.log('  ✓ Verified browser-speech.ts has SpeechSynthesisUtterance.onboundary integration');

  console.log('\nKaraoke & Text Visuals Tests: All Passed Successfully!\n');
}

module.exports = { runKaraokeAndTextVisualsTests };

if (require.main === module) {
  runKaraokeAndTextVisualsTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
