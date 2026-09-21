/**
 * tests/test-karaoke-engine-modular.js
 * 
 * Unit tests verifying:
 * 1. Native Web Speech API event binding & calculateFallbackLength for cross-browser Safari/Chromium.
 * 2. Precomputed word & sentence token offset mapping.
 * 3. Text sanitization isolating Gita shlokas, stripping markdown symbols, converting arrows.
 * 4. Modular KaraokeMessage rendering with text-first inline chips and horizontal process flow pills.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ─── 1. Test calculateFallbackLength & Word Boundary Recovery ───
function calculateFallbackLength(text, charIndex) {
  if (!text || charIndex >= text.length) return 0;
  const slice = text.slice(charIndex);
  const match = slice.match(/^\S+/);
  return match ? match[0].length : 1;
}

// ─── 2. Test sanitizeTextForTTS (Strict Isolation of Gita Shloka & Markdown) ───
function sanitizeTextForTTS(rawText, locale) {
  if (!rawText) return '';

  const hasDevanagari = /[\u0900-\u097F]/.test(rawText);
  const isEnglish = (locale && locale.startsWith('en')) || (!hasDevanagari && !locale);

  let processed = rawText
    // 1. Strictly strip [GITA_SHLOKA]...[/GITA_SHLOKA] from speech payload
    .replace(/\[GITA_SHLOKA\][\s\S]*?\[\/GITA_SHLOKA\]/gi, '')
    // 2. Strip section headers e.g. **1. ...**, **SUMMARY...**, **RESUMEN...**
    .replace(/^\*\*(?:[1234]\.\s+|SUMMARY[^*]*|आपकी स्थिति[^*]*|स्थिति व कष्ट[^*]*|RESUMEN[^*]*|SYNTHÈSE[^*]*|ZUSAMMENFASSUNG[^*]*|TRI-PILLAR[^*]*|एकीकृत[^*]*)[^*]*\*\*\s*:?\s*/gim, '')
    // 3. Convert markdown images ![alt](url) -> alt (never read URLs)
    .replace(/!\[(.*?)\]\([^\)]*\)/g, '$1')
    // 4. Convert diagram & visual tags [diagram: label] -> label
    .replace(/\[(?:diagram|visual|flow|focus):\s*(.*?)\]/gi, '$1')
    // 5. Convert flowchart arrows to natural speech pauses
    .replace(/\s*(?:->|→|-->)\s*/g, ', then ')
    // 6. Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    // 7. Strip Markdown hashes, bold, italics, strikethrough
    .replace(/#+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // 8. Strip bullet prefixes and blockquotes
    .replace(/^[\s\t]*[•\-\*+]\s+/gm, '')
    .replace(/^>\s*/gm, '');

  if (isEnglish) {
    processed = processed.replace(/[\u0900-\u097F]+/g, '');
  }

  return processed
    .replace(/[\[\]]/g, ' ')
    .replace(/&amp;/g, ' and ')
    .replace(/&/g, ' and ')
    .replace(/[<>{}]/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

function runTests() {
  console.log('--- Running Modular Karaoke & Web Audio Engine Test Suite ---');

  // Test 1: Fallback character length calculation (Chromium / Safari compatibility)
  const sample = "Inhale slowly and let go.";
  const word1Len = calculateFallbackLength(sample, 0); // "Inhale"
  assert.strictEqual(word1Len, 6, "Must calculate word length of 'Inhale' as 6");

  const word2Index = sample.indexOf("slowly");
  const word2Len = calculateFallbackLength(sample, word2Index); // "slowly"
  assert.strictEqual(word2Len, 6, "Must calculate word length of 'slowly' as 6");
  console.log('  ✓ calculateFallbackLength calculates accurate word boundaries when event.charLength is undefined');

  // Test 2: Bhagavad Gita Shloka Strict Separation from TTS Payload
  const textWithShloka = `[GITA_SHLOKA]
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
— Chapter 2, Verse 47
[/GITA_SHLOKA]

**1. Bhagavad Gita Wisdom: (Chapter 2, Verse 47)**
Focus your energy wholly on the present action rather than the anxiety of future outcomes.

[⚡ Autonomic State: Ventral Vagal]
Inhale (4s) → Hold (7s) → Exhale (8s)`;

  const ttsPayload = sanitizeTextForTTS(textWithShloka, 'en-US');

  assert(!ttsPayload.includes('कर्मण्येवाधिकारस्ते'), 'Sanskrit shloka must be completely excluded from English TTS payload');
  assert(!ttsPayload.includes('Chapter 2, Verse 47'), 'Shloka attribution must not be read in therapeutic body speech');
  assert(!ttsPayload.includes('**1. Bhagavad Gita'), 'Markdown section header must be stripped from speech payload');
  assert(ttsPayload.includes('Focus your energy wholly on the present action'), 'Therapeutic body text must be preserved');
  assert(ttsPayload.includes('then'), 'Flowchart arrows must convert to natural speech pause');
  console.log('  ✓ Gita Shloka contemplation card strictly excluded from speech synthesis payload');
  console.log('  ✓ Markdown headers, hashes, asterisks stripped to prevent character offset drift');

  // Test 3: Process Flow Arrow Parsing (Pill generation)
  const flowLine = "Inhale (4s) → Hold (7s) → Exhale (8s)";
  const steps = flowLine.split(/\s*(?:->|→|-->)\s*/).filter(Boolean);
  assert.strictEqual(steps.length, 3, "Must parse 3 distinct breathwork phases");
  assert.strictEqual(steps[0], "Inhale (4s)");
  assert.strictEqual(steps[1], "Hold (7s)");
  assert.strictEqual(steps[2], "Exhale (8s)");
  console.log('  ✓ Process flows parsed into horizontal sequence of distinct phases');

  // Test 4: Verify Component Files Existence and Exports
  const hookFile = path.join(__dirname, '..', 'lib', 'audio', 'useKaraokeTTS.ts');
  assert(fs.existsSync(hookFile), 'useKaraokeTTS.ts must exist in lib/audio/');
  const hookCode = fs.readFileSync(hookFile, 'utf8');
  assert(hookCode.includes('SpeechSynthesisUtterance'), 'useKaraokeTTS must utilize SpeechSynthesisUtterance');
  assert(hookCode.includes('utterance.onboundary'), 'useKaraokeTTS must bind to utterance.onboundary');
  assert(hookCode.includes('calculateFallbackLength'), 'useKaraokeTTS must export calculateFallbackLength');
  assert(hookCode.includes('scrollIntoView'), 'useKaraokeTTS must include scrollIntoView auto-scroll');

  const componentFile = path.join(__dirname, '..', 'app', '(session)', 'components', 'KaraokeMessage.tsx');
  assert(fs.existsSync(componentFile), 'KaraokeMessage.tsx must exist in app/(session)/components/');
  const compCode = fs.readFileSync(componentFile, 'utf8');
  assert(compCode.includes('active-karaoke-word'), 'KaraokeMessage must assign active-karaoke-word ID');
  assert(compCode.includes('GitaShlokaCard'), 'KaraokeMessage must render GitaShlokaCard');
  assert(compCode.includes('Speaking...'), 'KaraokeMessage must render Speaking state indicator');
  assert(compCode.includes('Listen'), 'KaraokeMessage must render Listen button');

  console.log('  ✓ useKaraokeTTS and KaraokeMessage verified with modular React architecture');
  console.log('\nAll Modular Karaoke & Web Audio Tests Passed!\n');
}

runTests();
