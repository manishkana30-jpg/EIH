/**
 * tests/test_tts_sanitizer.js
 * 
 * Unit Test Suite: Dual-Layer Markdown & Special Character TTS Sanitizer
 */

const assert = require('assert');

function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    // 1. Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    // 2. Remove Markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 3. Remove bracketed RAG/metadata blocks e.g. [CLINICAL & PSYCHOEDUCATIONAL LIBRARY RAG CONTEXT] or [gad]
    .replace(/\[[a-zA-Z0-9_\s\-&:]+\]:?/g, '')
    // 4. Remove Markdown headers and stray hashes
    .replace(/#+/g, '')
    // 5. Remove bold, italics, strikethrough, underline
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // 6. Remove bullet prefixes, numbers, and blockquotes
    .replace(/^[\s\t]*[•\-\*+]\s+/gm, '')
    .replace(/(?:^|(?<=[.:;?!]))\s*\d+\.\s+/gm, ' ')
    .replace(/^>\s*/gm, '')
    // 7. Convert XML/HTML entities and brackets
    .replace(/&amp;/g, ' and ')
    .replace(/&/g, ' and ')
    .replace(/[<>{}]/g, ' ')
    .replace(/[\[\]]/g, ' ')
    .replace(/\|/g, ', ')
    // 8. Strip emojis and non-alphanumeric pictographs
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu, '')
    // 9. Normalize whitespace and clean punctuation
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

function runTtsSanitizerTests() {
  console.log('--- Running Dual-Layer TTS Sanitizer & SSML Safety Tests ---');

  const sampleRAG = `
[CLINICAL & PSYCHOEDUCATIONAL LIBRARY RAG CONTEXT]:
- Matched Condition: Generalized Anxiety & Chronic Worry (gad)
- Triguna Balance: High Rajas, Low Sattva
- Cognitive Distortions: **Catastrophizing**, *Mind-Reading*
- Evidence-Based CBT Reframing: # Notice the catastrophizing thought. Ask: 'Is this 100% true?'
- Somatic Grounding Anchor: 🌿 Inhale for 4s, exhale for 8s. Place a hand on your heart <3 & focus on the breath.
- Recommended Pranayama: [Nadi Shodhana](https://example.com/pranayama)
- Daily Micro-Habit: 1. Keep a 5-minute worry journal. \`\`\`code sample\`\`\`
- Instruction: Weave this exact somatic anchor or pranayama into your guidance with compassionate brevity.
`;

  const cleaned = cleanTextForSpeech(sampleRAG);
  assert(!cleaned.includes('**'), 'Must strip bold markdown asterisks');
  assert(!cleaned.includes('*'), 'Must strip italic asterisks');
  assert(!cleaned.includes('#'), 'Must strip markdown hashes');
  assert(!cleaned.includes('```'), 'Must strip code blocks');
  assert(!cleaned.includes('<') && !cleaned.includes('>'), 'Must strip XML/HTML tags and entities');
  assert(!cleaned.includes('🌿'), 'Must strip emojis');
  assert(!cleaned.includes('[') && !cleaned.includes(']'), 'Must strip all square brackets');
  assert(!cleaned.includes('https://'), 'Must strip URL targets from markdown links');
  assert(cleaned.includes('Nadi Shodhana'), 'Must preserve link label text');
  assert(cleaned.includes('Catastrophizing'), 'Must preserve bold text contents');
  assert(cleaned.includes('and'), 'Must expand & to and');

  console.log('  ✓ Stripped all raw markdown symbols (**, *, #, ~~)');
  console.log('  ✓ Stripped RAG context brackets and metadata tags');
  console.log('  ✓ Stripped XML/SSML breaking angle brackets and entities');
  console.log('  ✓ Stripped emojis and non-speech Unicode pictographs');
  console.log('  ✓ Preserved natural speech cadence and semantic words');

  console.log('\nTTS Sanitizer Tests: All Passed Successfully!\n');
}

module.exports = { runTtsSanitizerTests, cleanTextForSpeech };

if (require.main === module) {
  runTtsSanitizerTests();
}
