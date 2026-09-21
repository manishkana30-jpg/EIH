const fs = require('fs');
const path = require('path');

const pageHtmlPath = path.join(__dirname, '..', '.next', 'server', 'app', 'index.html');
if (!fs.existsSync(pageHtmlPath)) {
  console.error('FAIL: index.html not found at', pageHtmlPath);
  process.exit(1);
}

const html = fs.readFileSync(pageHtmlPath, 'utf-8');

console.log('================================================================');
console.log('🧪 SEO VERIFICATION SUITE: HOME PAGE (https://eih-chi.vercel.app/)');
console.log('================================================================\n');

let passCount = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ [PASSED]: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAILED]: ${message}`);
  }
}

// 1. Title Tag Check
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
const rawTitle = titleMatch ? titleMatch[1] : '';
const title = rawTitle.replace(/&amp;/g, '&');
console.log('Title detected:', title);
assert(title.length > 0, 'Title tag exists');
assert(title.length < 60, `Title tag is under 60 characters (actual: ${title.length})`);
assert(title.startsWith('AI Somatic Therapy & Neuro-Vedantic Healing'), 'Title contains primary keyword near beginning');

// 2. Meta Description Check
const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
const rawDesc = descMatch ? descMatch[1] : '';
const desc = rawDesc.replace(/&amp;/g, '&');
console.log('\nMeta description detected:', desc);
assert(desc.length > 0, 'Meta description exists');
assert(desc.length < 155, `Meta description is under 155 characters (actual: ${desc.length})`);
assert(desc.toLowerCase().includes('ai somatic therapy & neuro-vedantic healing'), 'Description contains primary keyword');
assert(desc.toLowerCase().includes('polyvagal state tracker'), 'Description contains secondary keyword: polyvagal state tracker');
assert(desc.toLowerCase().includes('clinical trataka protocol'), 'Description contains secondary keyword: clinical trataka protocol');
assert(desc.toLowerCase().includes('zero-knowledge encrypted'), 'Description contains secondary keyword: zero-knowledge encrypted');
assert(desc.toLowerCase().includes('emotion telemetry'), 'Description contains secondary keyword: emotion telemetry');

// 3. Canonical Tag Check
const canonMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
const canon = canonMatch ? canonMatch[1] : '';
console.log('\nCanonical URL detected:', canon);
assert(canon === 'https://eih-chi.vercel.app', 'Explicit self-referential canonical URL enforced (https://eih-chi.vercel.app)');

// 4. OpenGraph Declarations
const rawOgTitle = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
const ogTitle = rawOgTitle ? rawOgTitle.replace(/&amp;/g, '&') : '';
const ogDesc = (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1];
const ogUrl = (html.match(/<meta property="og:url" content="([^"]+)"/) || [])[1];
const ogImg = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];

assert(ogTitle === 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH', 'OpenGraph Title matches specification');
assert(ogDesc && ogDesc.length < 160, 'OpenGraph Description is valid');
assert(ogUrl === 'https://eih-chi.vercel.app', 'OpenGraph URL is explicit canonical');
assert(ogImg && ogImg.includes('opengraph-image'), 'OpenGraph dynamic image declaration present');

// 5. Twitter Card Declarations
const twCard = (html.match(/<meta name="twitter:card" content="([^"]+)"/) || [])[1];
const rawTwTitle = (html.match(/<meta name="twitter:title" content="([^"]+)"/) || [])[1];
const twTitle = rawTwTitle ? rawTwTitle.replace(/&amp;/g, '&') : '';
const twDesc = (html.match(/<meta name="twitter:description" content="([^"]+)"/) || [])[1];
const twImg = (html.match(/<meta name="twitter:image" content="([^"]+)"/) || [])[1];

assert(twCard === 'summary_large_image', 'Twitter card is summary_large_image');
assert(twTitle === 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH', 'Twitter title matches specification');
assert(twDesc && twDesc.length > 0, 'Twitter description is present');
assert(twImg && twImg.includes('opengraph-image'), 'Twitter dynamic image preview card present');

// 6. Schema.org Structured Data
assert(html.includes('application/ld+json'), 'Schema.org JSON-LD structured data is present');
assert(html.includes('WebApplication'), 'JSON-LD includes WebApplication entity');
assert(html.includes('MedicalWebPage'), 'JSON-LD includes MedicalWebPage entity');

// 7. Topical Editorial Content Engine
assert(html.includes('id="clinical-guide"'), '<article id="clinical-guide"> exists in pre-rendered DOM');
assert(html.includes('How to Use the EIH Workspace Effectively'), 'Section 1 (Workspace usage) is present');
assert(html.includes('The Neuro-Vedantic Calibration Principle'), 'Section 2 (Neuro-Vedantic calibration) is present');
assert(html.includes('Real-World Somatic &amp; Cognitive Applications') || html.includes('Real-World Somatic & Cognitive Applications'), 'Section 3 (Real-world applications) is present');
assert(html.includes('Session Calibration &amp; Troubleshooting') || html.includes('Session Calibration & Troubleshooting'), 'Section 4 (Calibration & troubleshooting) is present');

// 8. All Target Keywords Grounded
const requiredKeywords = [
  'AI Somatic Therapy & Neuro-Vedantic Healing',
  'polyvagal state tracker',
  'clinical trataka protocol',
  'triguna equilibrium gauge',
  'cognitive distortion detector',
  'real-time emotion telemetry',
  'zero-knowledge encrypted mental health',
];

for (const kw of requiredKeywords) {
  assert(html.toLowerCase().includes(kw.toLowerCase()), `Keyword grounded in editorial DOM: "${kw}"`);
}

console.log('\n================================================================');
console.log(`Results: ${passCount}/${totalChecks} checks passed (${((passCount / totalChecks) * 100).toFixed(1)}%)`);
console.log('================================================================');

if (passCount === totalChecks) {
  console.log('🎉 ALL SEO CHECKS PASSED WITH 100% COMPLIANCE!');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
