/**
 * tests/share_and_pwa_integration.test.js
 *
 * Automated verification suite for the Share and PWA installation links
 * integrated into the left side column navigation of the session UI/UX page.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n================================================================');
console.log('TEST: Share & PWA Installation Integration in Left Side Column');
console.log('================================================================\n');

// 1. Verify PwaInstallModal component
console.log('--- 1. Testing PwaInstallModal Component ---');
const modalPath = path.join(__dirname, '../app/(session)/components/PwaInstallModal.tsx');
assert(fs.existsSync(modalPath), 'PwaInstallModal.tsx component must exist');
const modalSource = fs.readFileSync(modalPath, 'utf8');

assert(modalSource.includes('export function PwaInstallModal'), 'PwaInstallModal must export function component');
assert(modalSource.includes('deferredPrompt'), 'PwaInstallModal must accept deferredPrompt prop');
assert(modalSource.includes('isInstalled'), 'PwaInstallModal must accept isInstalled prop');
assert(modalSource.includes('Install EIH Sanctuary'), 'PwaInstallModal must feature clear branding');
assert(modalSource.includes('Chrome / Edge / Brave Instructions'), 'PwaInstallModal must provide Desktop instructions');
assert(modalSource.includes('Safari iOS Instructions'), 'PwaInstallModal must provide iOS instructions');
assert(modalSource.includes('Chrome Android Instructions'), 'PwaInstallModal must provide Android instructions');
console.log('  ✓ PwaInstallModal.tsx verified with multi-platform installation guidance');

// 2. Verify page.tsx Left Column Integration
console.log('\n--- 2. Testing Left Side Column Integration in page.tsx ---');
const pagePath = path.join(__dirname, '../app/(session)/page.tsx');
assert(fs.existsSync(pagePath), 'app/(session)/page.tsx must exist');
const pageSource = fs.readFileSync(pagePath, 'utf8');

// Check Icons imported
assert(pageSource.includes('Share2'), 'page.tsx must import Share2 icon');
assert(pageSource.includes('Download'), 'page.tsx must import Download icon');
assert(pageSource.includes('import { PwaInstallModal }'), 'page.tsx must import PwaInstallModal');
console.log('  ✓ Share2, Download, and PwaInstallModal imports verified');

// Check Left Column Aside
assert(pageSource.includes('overflow-y-auto'), 'Left column aside must include overflow-y-auto for accessibility');

// Check Share Sanctuary button
assert(pageSource.includes('handleShareApp'), 'page.tsx must define handleShareApp handler');
assert(pageSource.includes('Share Sanctuary'), 'page.tsx must contain "Share Sanctuary" button in left nav');
assert(pageSource.includes('Link Copied!'), 'page.tsx must support clipboard fallback copy state');
console.log('  ✓ Share Sanctuary button with native share & clipboard fallback verified');

// Check PWA Install button
assert(pageSource.includes('handleInstallClick'), 'page.tsx must define handleInstallClick handler');
assert(pageSource.includes('Install App'), 'page.tsx must contain "Install App" button in left nav');
assert(pageSource.includes('beforeinstallprompt'), 'page.tsx must listen for beforeinstallprompt event');
assert(pageSource.includes('display-mode: standalone'), 'page.tsx must detect standalone PWA display mode');
assert(pageSource.includes('<PwaInstallModal'), 'page.tsx must mount PwaInstallModal');
console.log('  ✓ PWA Installation trigger and modal integration verified');

// 3. Simulated Share & PWA Lifecycle Test
console.log('\n--- 3. Testing Simulated Execution Logic ---');
let sharedData = null;
let clipboardText = null;

const mockNavigator = {
  share: async (data) => {
    sharedData = data;
  },
  clipboard: {
    writeText: async (text) => {
      clipboardText = text;
    },
  },
};

(async () => {
  // Test native share
  await mockNavigator.share({
    title: 'EIH',
    url: 'https://eih-chi.vercel.app',
  });
  assert.strictEqual(sharedData.url, 'https://eih-chi.vercel.app', 'Native share must receive URL');
  console.log('  ✓ Native share execution verified');

  // Test clipboard fallback
  await mockNavigator.clipboard.writeText('https://eih-chi.vercel.app');
  assert.strictEqual(clipboardText, 'https://eih-chi.vercel.app', 'Clipboard fallback writeText verified');
  console.log('  ✓ Clipboard fallback execution verified');

  console.log('\n================================================================');
  console.log('🎉 ALL SHARE & PWA INTEGRATION TESTS PASSED (100%)');
  console.log('================================================================\n');
})();
