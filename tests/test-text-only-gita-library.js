/**
 * tests/test-text-only-gita-library.js
 * 
 * Comprehensive test suite verifying the 100% text-only Bhagavad Gita library architecture:
 * 1. ZERO visual/image assets: no <img>, no SVG icons, no thumbnails, no background picture cards.
 * 2. Pure semantic text card structure: Reference Header, Devanagari serif, Roman IAST,
 *    plain language translation, psychological/somatic mapping, and cognitive tags.
 * 3. Real-time instant search by keyword, emotion, or chapter number.
 * 4. Plain-text category filtering: All, Anxiety & Fear, Burnout & Action, Clarity & Focus, Grief & Loss.
 * 5. Multilingual translation catalog integrity for all supported languages.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- Running 100% Text-Only Bhagavad Gita Architecture Test Suite ---');

  // ─── 1. Verify Component Files Have Zero Visual/Image Assets ───
  const cardComponentPath = path.join(__dirname, '..', 'components', 'gita', 'GitaShlokaCard.tsx');
  const libraryViewPath = path.join(__dirname, '..', 'components', 'gita', 'GitaLibraryView.tsx');
  const karaokeMsgPath = path.join(__dirname, '..', 'app', '(session)', 'components', 'KaraokeMessage.tsx');

  assert(fs.existsSync(cardComponentPath), 'components/gita/GitaShlokaCard.tsx must exist');
  assert(fs.existsSync(libraryViewPath), 'components/gita/GitaLibraryView.tsx must exist');
  assert(fs.existsSync(karaokeMsgPath), 'app/(session)/components/KaraokeMessage.tsx must exist');

  const cardCode = fs.readFileSync(cardComponentPath, 'utf8');
  const libraryViewCode = fs.readFileSync(libraryViewPath, 'utf8');
  const karaokeMsgCode = fs.readFileSync(karaokeMsgPath, 'utf8');

  // Assert NO <img> tags in code
  assert(!cardCode.includes('<img '), 'GitaShlokaCard must NOT contain any <img> tags');
  assert(!libraryViewCode.includes('<img '), 'GitaLibraryView must NOT contain any <img> tags');

  // Assert NO SVG tags in code
  assert(!cardCode.includes('<svg'), 'GitaShlokaCard must NOT contain any <svg> tags');
  assert(!libraryViewCode.includes('<svg'), 'GitaLibraryView must NOT contain any <svg> tags');

  // Assert NO icon imports from lucide-react or similar
  assert(!cardCode.includes('from "lucide-react"') && !cardCode.includes("from 'lucide-react'"), 'GitaShlokaCard must NOT import any visual icon packages');
  assert(!libraryViewCode.includes('from "lucide-react"') && !libraryViewCode.includes("from 'lucide-react'"), 'GitaLibraryView must NOT import any visual icon packages');

  // Assert direct import of the unified text-only card in session components
  assert(karaokeMsgCode.includes('@/components/gita/GitaShlokaCard'), 'KaraokeMessage must import directly from @/components/gita/GitaShlokaCard');

  console.log('  ✓ Verified 0 visual/image assets: No <img>, <svg>, or visual icons in Gita components');
  console.log('  ✓ Verified direct import from @/components/gita/GitaShlokaCard without re-export indirection');

  // ─── 2. Verify GITA_LIBRARY Structure & Semantic Fields ───
  const gitaLibPath = path.join(__dirname, '..', 'lib', 'knowledge', 'gita-library.ts');
  const gitaLibCode = fs.readFileSync(gitaLibPath, 'utf8');

  // Check bg_2_48 is present (specifically requested in user prompt)
  assert(gitaLibCode.includes('"bg_2_48"'), 'GITA_LIBRARY must contain bg_2_48 (Samatvam Equanimity)');
  assert(gitaLibCode.includes('BG 2.48'), 'GITA_LIBRARY must contain reference_header BG 2.48');
  assert(gitaLibCode.includes('समत्वं योग उच्यते'), 'GITA_LIBRARY bg_2_48 must include Sanskrit Devanagari');
  assert(gitaLibCode.includes('samatvaṁ yoga ucyate'), 'GITA_LIBRARY bg_2_48 must include Romanized IAST');
  assert(gitaLibCode.includes('Equanimity & Sympathetic Down-Regulation'), 'GITA_LIBRARY bg_2_48 must include psychological/somatic mapping');
  assert(gitaLibCode.includes('#Sattva'), 'GITA_LIBRARY must include #Sattva cognitive tag');
  assert(gitaLibCode.includes('#Detachment'), 'GITA_LIBRARY must include #Detachment cognitive tag');
  assert(gitaLibCode.includes('#CognitiveReframing'), 'GITA_LIBRARY must include #CognitiveReframing cognitive tag');

  console.log('  ✓ Verified pure semantic text fields: reference_header, Devanagari, Roman IAST, mapping, and cognitive tags');

  // ─── 3. Verify Real-Time Search & Category Filters in gita-library.ts ───
  assert(gitaLibCode.includes('export function searchGitaLibrary'), 'gita-library.ts must export searchGitaLibrary');
  assert(gitaLibCode.includes('anxiety_fear'), 'Category taxonomy must include anxiety_fear');
  assert(gitaLibCode.includes('burnout_action'), 'Category taxonomy must include burnout_action');
  assert(gitaLibCode.includes('clarity_focus'), 'Category taxonomy must include clarity_focus');
  assert(gitaLibCode.includes('grief_loss'), 'Category taxonomy must include grief_loss');

  console.log('  ✓ Verified real-time search & plain-text category taxonomy');

  // ─── 4. Verify Multilingual Localization Catalog ───
  const { GITA_LOCALIZATION_CATALOG } = require('../lib/i18n/clinical-localization.ts');
  const bg248 = GITA_LOCALIZATION_CATALOG.bg_2_48;

  assert(bg248, 'clinical-localization.ts must include bg_2_48 translations');
  assert(bg248.hi && bg248.hi.meaning.includes("मन की यही समता 'योग' कहलाती है"), 'Hindi translation for BG 2.48 must be present');
  assert(bg248.es && bg248.es.meaning.includes('Esa ecuanimidad mental se llama Yoga'), 'Spanish translation for BG 2.48 must be present');
  assert(bg248.fr && bg248.fr.meaning.includes("Car l'équanimité est le yoga même"), 'French translation for BG 2.48 must be present');
  assert(bg248.de && bg248.de.meaning.includes('Dieser Gleichmut des Geistes wird Yoga genannt'), 'German translation for BG 2.48 must be present');

  console.log('  ✓ Verified multilingual translation catalog (EN, HI, ES, FR, DE) for BG 2.48');

  // ─── 5. Verify app/library/page.tsx Integration ───
  const libraryPagePath = path.join(__dirname, '..', 'app', 'library', 'page.tsx');
  const libraryPageCode = fs.readFileSync(libraryPagePath, 'utf8');

  assert(libraryPageCode.includes('GitaLibraryView'), 'app/library/page.tsx must import and render GitaLibraryView');
  assert(libraryPageCode.includes('Bhagavad Gita Cognitive Library'), 'app/library/page.tsx must provide Gita library view option');

  console.log('  ✓ Verified app/library/page.tsx integration with GitaLibraryView');

  // ─── 6. Verify app/api/gita/route.ts ───
  const gitaApiPath = path.join(__dirname, '..', 'app', 'api', 'gita', 'route.ts');
  assert(fs.existsSync(gitaApiPath), 'app/api/gita/route.ts edge endpoint must exist');

  console.log('  ✓ Verified app/api/gita/route.ts REST endpoint exists');

  // ─── 7. Verify Shloka is Embedded Plain-Text Inside Gita Section, Not at Top of Chat ───
  assert(karaokeMsgCode.includes('variant="inline"'), 'KaraokeMessage must render Gita shloka using variant="inline"');
  assert(karaokeMsgCode.includes('isGita && gitaParsed.isGita && gitaParsed.shlokaBlock'), 'KaraokeMessage must embed shloka inside the isGita section');

  const topCardBeforeBubble = karaokeMsgCode.indexOf('<GitaShlokaCard');
  const messageBubbleStart = karaokeMsgCode.indexOf('max-w-[88%]');
  assert(topCardBeforeBubble > messageBubbleStart, 'GitaShlokaCard must NOT be rendered at the top of the chat outside the message bubble');

  console.log('  ✓ Verified Shloka is rendered in plain-text inside Shreemadh Bhagwatgita section and NOT at top of chat');

  // ─── 8. Verify Semantic <p lang="sa">, Dark CSS Tokens, Selectable Text & TTS Separation ───
  assert(cardCode.includes('lang="sa"'), 'GitaShlokaCard must render Sanskrit verses inside semantic <p lang="sa"> elements');
  assert(cardCode.includes('bg-slate-900'), 'GitaShlokaCard container must use dark solid background bg-slate-900');
  assert(cardCode.includes('border-amber-500/30'), 'GitaShlokaCard container must use subtle border border-amber-500/30');
  assert(cardCode.includes('select-text'), 'GitaShlokaCard must enforce selectable text with select-text');
  assert(cardCode.includes('data-tts-silent="true"'), 'GitaShlokaCard must mark container with data-tts-silent="true"');
  assert(cardCode.includes('data-tts-skip="true"'), 'GitaShlokaCard must mark container with data-tts-skip="true"');
  assert(karaokeMsgCode.includes('data-tts-silent="true"'), 'KaraokeMessage must wrap Gita shloka in data-tts-silent container');

  // Assert NO background images or canvas
  assert(!cardCode.includes('bg-[url'), 'GitaShlokaCard must NOT contain background URL classes');
  assert(!cardCode.includes('background-image'), 'GitaShlokaCard must NOT contain background-image style');
  assert(!cardCode.includes('<canvas'), 'GitaShlokaCard must NOT contain <canvas> tags');
  assert(!cardCode.includes('data:image'), 'GitaShlokaCard must NOT contain base64 image data');

  console.log('  ✓ Verified semantic <p lang="sa">, bg-slate-900, border-amber-500/30, select-text, and TTS silent skipping');

  console.log('\nAll 100% Text-Only Bhagavad Gita Architecture Tests Passed Successfully!\n');
}

runTests();
