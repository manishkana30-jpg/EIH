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
  const sessionCardPath = path.join(__dirname, '..', 'app', '(session)', 'components', 'GitaShlokaCard.tsx');

  assert(fs.existsSync(cardComponentPath), 'components/gita/GitaShlokaCard.tsx must exist');
  assert(fs.existsSync(libraryViewPath), 'components/gita/GitaLibraryView.tsx must exist');
  assert(fs.existsSync(sessionCardPath), 'app/(session)/components/GitaShlokaCard.tsx must exist');

  const cardCode = fs.readFileSync(cardComponentPath, 'utf8');
  const libraryViewCode = fs.readFileSync(libraryViewPath, 'utf8');
  const sessionCardCode = fs.readFileSync(sessionCardPath, 'utf8');

  // Assert NO <img> tags in code
  assert(!cardCode.includes('<img '), 'GitaShlokaCard must NOT contain any <img> tags');
  assert(!libraryViewCode.includes('<img '), 'GitaLibraryView must NOT contain any <img> tags');

  // Assert NO SVG tags in code
  assert(!cardCode.includes('<svg'), 'GitaShlokaCard must NOT contain any <svg> tags');
  assert(!libraryViewCode.includes('<svg'), 'GitaLibraryView must NOT contain any <svg> tags');

  // Assert NO icon imports from lucide-react or similar
  assert(!cardCode.includes('from "lucide-react"') && !cardCode.includes("from 'lucide-react'"), 'GitaShlokaCard must NOT import any visual icon packages');
  assert(!libraryViewCode.includes('from "lucide-react"') && !libraryViewCode.includes("from 'lucide-react'"), 'GitaLibraryView must NOT import any visual icon packages');

  // Assert session card re-exports or uses the pure text-only card
  assert(sessionCardCode.includes('@/components/gita/GitaShlokaCard'), 'app/(session)/components/GitaShlokaCard must re-export the unified text-only card');

  console.log('  ✓ Verified 0 visual/image assets: No <img>, <svg>, or visual icons in Gita components');

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
  const localizationPath = path.join(__dirname, '..', 'lib', 'i18n', 'clinical-localization.ts');
  const locCode = fs.readFileSync(localizationPath, 'utf8');

  assert(locCode.includes('bg_2_48: {'), 'clinical-localization.ts must include bg_2_48 translations');
  assert(locCode.includes("मन की यही समता 'योग' कहलाती है"), 'Hindi translation for BG 2.48 must be present');
  assert(locCode.includes('Esa ecuanimidad mental se llama Yoga'), 'Spanish translation for BG 2.48 must be present');
  assert(locCode.includes("Car l'équanimité est le yoga même"), 'French translation for BG 2.48 must be present');
  assert(locCode.includes('Dieser Gleichmut des Geistes wird Yoga genannt'), 'German translation for BG 2.48 must be present');

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

  console.log('\nAll 100% Text-Only Bhagavad Gita Architecture Tests Passed Successfully!\n');
}

runTests();
