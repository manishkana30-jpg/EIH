/**
 * tests/edge_caching_and_asset_bundle.test.js
 *
 * Automated verification suite for:
 * 1. Edge & CDN Caching Directives in vercel.json
 * 2. Static Asset & API Header Rules in next.config.mjs
 * 3. Self-Hosted Google Fonts via next/font/google in app/layout.tsx
 * 4. Next.js Image Component & Priority Preloading for Hypnotic Spiral
 * 5. Route Segment Revalidation at the Edge
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n================================================================');
console.log('EDGE CACHING, ASSET BUNDLING & PERFORMANCE VERIFICATION');
console.log('================================================================\n');

// 1. Verify vercel.json
console.log('--- 1. Testing vercel.json Edge Caching Rules ---');
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
assert(fs.existsSync(vercelJsonPath), 'vercel.json must exist');

const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
assert(Array.isArray(vercelConfig.headers), 'vercel.json must contain headers array');

const staticVercelHeader = vercelConfig.headers.find((h) =>
  h.source && (h.source.includes('.(jpg|jpeg|png') || h.source.includes('(jpg|jpeg|png'))
);
assert(staticVercelHeader, 'vercel.json must define static asset caching rule for images/css/js');

const staticCacheControl = staticVercelHeader.headers.find(
  (kv) => kv.key.toLowerCase() === 'cache-control'
);
assert(staticCacheControl, 'Static asset rule must define Cache-Control');
assert.strictEqual(
  staticCacheControl.value,
  'public, max-age=31536000, immutable',
  'Static assets must have Cache-Control: public, max-age=31536000, immutable'
);
console.log('  ✓ vercel.json static asset caching rule verified: public, max-age=31536000, immutable');

const apiVercelHeader = vercelConfig.headers.find(
  (h) => h.source && h.source.includes('/api/')
);
assert(apiVercelHeader, 'vercel.json must define API route header rule');

const apiCacheControl = apiVercelHeader.headers.find(
  (kv) => kv.key.toLowerCase() === 'cache-control'
);
assert(apiCacheControl, 'API rule must define Cache-Control');
assert.strictEqual(
  apiCacheControl.value,
  'no-store, max-age=0',
  'API routes must have Cache-Control: no-store, max-age=0'
);
console.log('  ✓ vercel.json API route no-store rule verified: no-store, max-age=0');


// 2. Verify next.config.mjs
console.log('\n--- 2. Testing next.config.mjs Caching & Image Optimization ---');
const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');

assert(
  nextConfigContent.includes('public, max-age=31536000, immutable'),
  'next.config.mjs must contain immutable static cache-control header'
);
assert(
  nextConfigContent.includes('no-store, max-age=0'),
  'next.config.mjs must contain API no-store header'
);
assert(
  nextConfigContent.includes('image/avif') && nextConfigContent.includes('image/webp'),
  'next.config.mjs must configure AVIF and WebP modern image formats'
);
assert(
  nextConfigContent.includes('minimumCacheTTL: 31536000'),
  'next.config.mjs must specify 1-year minimumCacheTTL for optimized images'
);
console.log('  ✓ next.config.mjs immutable headers and AVIF/WebP image formats verified');


// 3. Verify app/layout.tsx Self-Hosted Fonts & Edge Revalidate
console.log('\n--- 3. Testing app/layout.tsx next/font/google & Edge Revalidation ---');
const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

assert(
  layoutContent.includes("from 'next/font/google'"),
  'app/layout.tsx must import fonts from next/font/google'
);
assert(
  layoutContent.includes('Inter(') && layoutContent.includes('Outfit('),
  'app/layout.tsx must configure Inter and Outfit fonts'
);
assert(
  layoutContent.includes('--font-inter') && layoutContent.includes('--font-outfit'),
  'app/layout.tsx must expose --font-inter and --font-outfit CSS variables'
);
assert(
  !layoutContent.includes('fonts.googleapis.com'),
  'app/layout.tsx must not contain runtime external links to fonts.googleapis.com'
);
assert(
  !layoutContent.includes('fonts.gstatic.com'),
  'app/layout.tsx must not contain runtime external links to fonts.gstatic.com'
);
assert(
  layoutContent.includes('export const revalidate = 3600'),
  'app/layout.tsx must export revalidate = 3600 for Edge caching'
);
console.log('  ✓ app/layout.tsx self-hosted fonts and revalidate = 3600 verified');


// 4. Verify Hypnotic Circle Optimization in app/(session)/page.tsx
console.log('\n--- 4. Testing Next.js Image & Priority in app/(session)/page.tsx ---');
const pagePath = path.join(__dirname, '..', 'app', '(session)', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf-8');

assert(
  pageContent.includes("import Image from \"next/image\"") || pageContent.includes("import Image from 'next/image'"),
  'app/(session)/page.tsx must import Image from next/image'
);
assert(
  pageContent.includes('<Image') && pageContent.includes('src="/hypnotic-circles.png"'),
  'app/(session)/page.tsx must render hypnotic-circles.png using <Image>'
);
assert(
  pageContent.includes('priority'),
  'app/(session)/page.tsx hypnotic circle Image must have priority prop for edge preloading'
);
assert(
  pageContent.includes('animation: \'spin 50s linear infinite\''),
  'app/(session)/page.tsx must preserve 50s spin animation'
);
console.log('  ✓ app/(session)/page.tsx <Image priority /> and 50s spin animation verified');


// 5. Verify TratakaModule.tsx Image Optimization
console.log('\n--- 5. Testing Next.js Image in TratakaModule.tsx ---');
const tratakaPath = path.join(__dirname, '..', 'app', '(session)', 'components', 'TratakaModule.tsx');
const tratakaContent = fs.readFileSync(tratakaPath, 'utf-8');

assert(
  tratakaContent.includes("from 'next/image'") || tratakaContent.includes('from "next/image"'),
  'TratakaModule.tsx must import Image from next/image'
);
assert(
  tratakaContent.includes('<Image') && tratakaContent.includes('src="/hypnotic-circles.png"'),
  'TratakaModule.tsx must render hypnotic-circles.png using <Image>'
);
console.log('  ✓ TratakaModule.tsx <Image> component verified');

console.log('\n🎉 ALL EDGE CACHING & ASSET BUNDLING TESTS PASSED (5/5 CHECKS)\n');
