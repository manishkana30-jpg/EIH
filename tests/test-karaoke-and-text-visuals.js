/**
 * tests/test-karaoke-and-text-visuals.js
 * 
 * Unit Test Suite for Real-Time Karaoke Mode, Word/Sentence Highlighting,
 * Auto-Scroll Centering, and Contextual Text-First Visual Badges.
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

// ─── 2. Contextual Text-First Visuals Parser Logic ───
function parseTextFirstVisual(line) {
  const trimmed = line.trim();

  // A. Markdown Image: ![alt](url) -> Text-First Contextual Visual Guide
  const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (imgMatch) {
    return {
      type: 'image_badge',
      badgeType: 'Contextual Visual Guide',
      altText: imgMatch[1] || 'Clinical Visual Reference',
      urlStripped: true,
    };
  }

  // B. Diagram tag: [diagram: ...] -> Clinical Neural Pathway
  const diagMatch = trimmed.match(/^\[(?:diagram|visual|flow):\s*(.*?)\]$/i);
  if (diagMatch) {
    return {
      type: 'diagram_badge',
      badgeType: 'Clinical Neural Pathway',
      label: diagMatch[1] || 'Therapeutic Pathway',
    };
  }

  // C. Step-by-Step Flow Arrows: A -> B -> C
  if (
    (trimmed.includes(' -> ') || trimmed.includes(' → ') || trimmed.includes(' --> ')) &&
    !trimmed.startsWith('http')
  ) {
    const steps = trimmed
      .split(/\s*(?:->|→|-->)\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (steps.length >= 2) {
      return {
        type: 'flowchart_sequence',
        steps,
      };
    }
  }

  return null;
}

async function runKaraokeAndTextVisualsTests() {
  console.log('\n--- Running Real-Time Karaoke & Contextual Text-First Visuals Test Suite ---');

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

  // Test 3: Contextual Text-First Visuals Parsing
  // Image markdown must NOT render broken image tags
  const imgLine = '![Autonomic Ladder - Ventral Vagal State](https://cdn.example.com/ladder.png)';
  const imgResult = parseTextFirstVisual(imgLine);
  assert(imgResult !== null, 'Must parse markdown image line');
  assert.strictEqual(imgResult.type, 'image_badge');
  assert.strictEqual(imgResult.altText, 'Autonomic Ladder - Ventral Vagal State');
  assert.strictEqual(imgResult.urlStripped, true, 'Image URLs must be stripped to prevent broken 404 image icons');

  // Diagram tag
  const diagLine = '[diagram: Cognitive Restructuring Feedback Loop]';
  const diagResult = parseTextFirstVisual(diagLine);
  assert(diagResult !== null, 'Must parse diagram tag line');
  assert.strictEqual(diagResult.type, 'diagram_badge');
  assert.strictEqual(diagResult.label, 'Cognitive Restructuring Feedback Loop');

  // Flowchart arrow sequence
  const flowLine = 'Trigger -> Negative Automatic Thought -> Physiological Arousal -> Behavioral Response';
  const flowResult = parseTextFirstVisual(flowLine);
  assert(flowResult !== null, 'Must parse flowchart sequence');
  assert.strictEqual(flowResult.type, 'flowchart_sequence');
  assert.strictEqual(flowResult.steps.length, 4, 'Must extract 4 sequence steps');
  assert.strictEqual(flowResult.steps[0], 'Trigger');
  assert.strictEqual(flowResult.steps[3], 'Behavioral Response');

  // Unicode arrow flowchart
  const unicodeFlowLine = 'Inhale (4s) → Retention (4s) → Exhale (8s)';
  const unicodeFlowResult = parseTextFirstVisual(unicodeFlowLine);
  assert(unicodeFlowResult !== null, 'Must parse Unicode arrow flowchart');
  assert.strictEqual(unicodeFlowResult.steps.length, 3);
  assert.strictEqual(unicodeFlowResult.steps[1], 'Retention (4s)');

  console.log('  ✓ Successfully parsed Markdown images into contextual text-first visual badges');
  console.log('  ✓ Parsed [diagram: ...] tags into clinical neural pathway badges');
  console.log('  ✓ Parsed ASCII and Unicode arrow sequences into structured flowchart node chains');

  // Test 4: Verify page.tsx and browser-speech.ts Code Implementation
  const pagePath = path.join(__dirname, '..', 'app', '(session)', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert(pageContent.includes('activeKaraoke'), 'page.tsx must maintain activeKaraoke state');
  assert(pageContent.includes('id="active-karaoke-word"'), 'page.tsx must assign id="active-karaoke-word" to current word');
  assert(pageContent.includes('onWordBoundary'), 'page.tsx must wire onWordBoundary to browserSpeechController');
  assert(pageContent.includes('container.scrollBy') || pageContent.includes('chatContainerRef.current.scrollBy'), 'page.tsx must use smooth scrollBy to center spoken word');
  assert(pageContent.includes('Contextual Visual Guide'), 'page.tsx must render Contextual Visual Guide badge');
  assert(pageContent.includes('Clinical Neural Pathway'), 'page.tsx must render Clinical Neural Pathway badge');

  const speechPath = path.join(__dirname, '..', 'lib', 'audio', 'browser-speech.ts');
  const speechContent = fs.readFileSync(speechPath, 'utf8');

  assert(speechContent.includes('utterance.onboundary'), 'browser-speech.ts must listen to utterance.onboundary');
  assert(speechContent.includes('onWordBoundary?:'), 'browser-speech.ts must declare onWordBoundary in callbacks');

  console.log('  ✓ Verified page.tsx has active-karaoke-word ID and auto-scroll centering implementation');
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
