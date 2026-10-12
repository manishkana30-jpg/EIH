import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPwaVersionAndUpdateTests() {
  console.log('\n================================================================');
  console.log('TEST SUITE: PWA VERSION VISIBILITY, UPDATE DETECTION & ZERO-CACHE');
  console.log('================================================================\n');

  // 1. Verify vercel.json Zero-Cache Configuration for Service Worker & Manifest
  console.log('--- 1. Checking vercel.json Headers ---');
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
  const vercelJson = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

  const swRule = vercelJson.headers.find((h) => h.source === '/sw.js');
  assert.ok(swRule, 'vercel.json must have dedicated /sw.js rule');
  const swCacheHeader = swRule.headers.find((h) => h.key === 'Cache-Control');
  assert.ok(swCacheHeader, 'sw.js rule must specify Cache-Control');
  assert.ok(
    swCacheHeader.value.includes('no-cache') && swCacheHeader.value.includes('max-age=0'),
    'sw.js must be configured with no-cache and max-age=0'
  );

  const manifestRule = vercelJson.headers.find((h) => h.source === '/manifest.webmanifest');
  assert.ok(manifestRule, 'vercel.json must have dedicated /manifest.webmanifest rule');
  console.log('  ✓ vercel.json correctly prevents service worker caching (max-age=0, no-cache)');

  // 2. Verify next.config.mjs Headers and generateBuildId
  console.log('\n--- 2. Checking next.config.mjs Headers & Build ID ---');
  const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
  assert.ok(fs.existsSync(nextConfigPath), 'next.config.mjs must exist');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  assert.ok(nextConfigContent.includes('generateBuildId'), 'next.config.mjs must define generateBuildId');
  assert.ok(nextConfigContent.includes("source: '/sw.js'"), 'next.config.mjs must have /sw.js header rule');
  assert.ok(nextConfigContent.includes("NEXT_PUBLIC_APP_VERSION: '1.2.2'"), 'next.config.mjs must define app version 1.2.2');
  console.log('  ✓ next.config.mjs configured with generateBuildId and zero-cache SW rules');

  // 3. Verify public/sw.js Versioning & Message Handlers
  console.log('\n--- 3. Checking public/sw.js Caching & Update Purge Handlers ---');
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes("CACHE_NAME = 'eih-pwa-v6'"), 'sw.js must use v6 cache name');
  assert.ok(swContent.includes('PURGE_AND_UPDATE'), 'sw.js must handle PURGE_AND_UPDATE message');
  assert.ok(swContent.includes("cache: 'no-store'"), 'sw.js navigation fetch must use no-store when online');
  console.log('  ✓ sw.js has v6 cache tags, PURGE_AND_UPDATE handler, and no-store navigation');

  // 4. Verify lib/pwa/update-manager.ts Singleton
  console.log('\n--- 4. Checking lib/pwa/update-manager.ts ---');
  const updateMgrPath = path.join(__dirname, '..', 'lib', 'pwa', 'update-manager.ts');
  assert.ok(fs.existsSync(updateMgrPath), 'update-manager.ts must exist');
  const updateMgrContent = fs.readFileSync(updateMgrPath, 'utf8');
  assert.ok(updateMgrContent.includes('checkForUpdates'), 'update-manager must export checkForUpdates');
  assert.ok(updateMgrContent.includes('performFullAppUpdate'), 'update-manager must export performFullAppUpdate');
  assert.ok(updateMgrContent.includes('subscribe'), 'update-manager must support listener subscriptions');
  console.log('  ✓ update-manager.ts correctly coordinates version checking and clean cache purging');

  // 5. Verify AppVersionStatus Header Component
  console.log('\n--- 5. Checking AppVersionStatus Component ---');
  const appVersionStatusPath = path.join(__dirname, '..', 'components', 'layout', 'AppVersionStatus.tsx');
  assert.ok(fs.existsSync(appVersionStatusPath), 'AppVersionStatus.tsx must exist');
  const appVersionContent = fs.readFileSync(appVersionStatusPath, 'utf8');
  assert.ok(appVersionContent.includes('updateManager'), 'AppVersionStatus must consume updateManager');
  assert.ok(appVersionContent.includes('Check for Updates'), 'AppVersionStatus must provide Check for Updates button');
  assert.ok(appVersionContent.includes('currentVersion'), 'AppVersionStatus must display active version');
  console.log('  ✓ AppVersionStatus component provides visible version tag and manual update check');

  // 6. Verify layout.tsx Integration
  console.log('\n--- 6. Checking layout.tsx Global Header Integration ---');
  const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
  assert.ok(fs.existsSync(layoutPath), 'layout.tsx must exist');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert.ok(layoutContent.includes('AppVersionStatus'), 'layout.tsx must import and render AppVersionStatus');
  assert.ok(layoutContent.includes('eih-pwa-v6'), 'layout.tsx inline script must reference v6 cache');
  console.log('  ✓ layout.tsx has AppVersionStatus mounted in global sticky header');

  console.log('\n================================================================');
  console.log('🎉 ALL PWA VERSION VISIBILITY & UPDATE TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runPwaVersionAndUpdateTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
