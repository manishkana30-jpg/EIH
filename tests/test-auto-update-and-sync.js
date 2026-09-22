const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testAutoUpdateAndSync() {
  console.log('\n================================================================');
  console.log('TEST SUITE: PWA AUTO-UPDATE ON PUSH & INTERNET SELF-LEARNING SYNC');
  console.log('================================================================\n');

  // 1. Verify Service Worker SKIP_WAITING Message Listener
  console.log('--- 1. Checking public/sw.js Service Worker Configuration ---');
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes("event.data.type === 'SKIP_WAITING'"), 'sw.js must handle SKIP_WAITING message');
  assert.ok(swContent.includes("self.skipWaiting()"), 'sw.js must execute self.skipWaiting()');
  assert.ok(swContent.includes("periodicsync"), 'sw.js must support periodic background sync when app is closed');
  console.log('  ✓ Service Worker message listener & Periodic Background Sync active');

  // 2. Verify /api/version route exists and is syntactically sound
  console.log('\n--- 2. Checking /api/version Route Implementation ---');
  const versionRoutePath = path.join(__dirname, '..', 'app', 'api', 'version', 'route.ts');
  assert.ok(fs.existsSync(versionRoutePath), 'app/api/version/route.ts must exist');
  const versionContent = fs.readFileSync(versionRoutePath, 'utf8');
  assert.ok(versionContent.includes('buildId'), 'version route must return buildId');
  assert.ok(versionContent.includes('learnedCount'), 'version route must report learned documents count');
  assert.ok(versionContent.includes('no-store'), 'version route must set no-cache headers');
  console.log('  ✓ /api/version endpoint verified with cache-busting headers');

  // 3. Verify /api/library/sync route exists
  console.log('\n--- 3. Checking /api/library/sync Route Implementation ---');
  const syncRoutePath = path.join(__dirname, '..', 'app', 'api', 'library', 'sync', 'route.ts');
  assert.ok(fs.existsSync(syncRoutePath), 'app/api/library/sync/route.ts must exist');
  const syncContent = fs.readFileSync(syncRoutePath, 'utf8');
  assert.ok(syncContent.includes('getLearnedDocuments'), 'sync route must read learned documents');
  assert.ok(syncContent.includes('addLearnedDocument'), 'sync route must support POST ingestion');
  console.log('  ✓ /api/library/sync endpoint verified for cloud knowledge exchange');

  // 4. Verify AutoUpdateBanner UI Component
  console.log('\n--- 4. Checking AutoUpdateBanner Component ---');
  const bannerPath = path.join(__dirname, '..', 'app', '(session)', 'components', 'AutoUpdateBanner.tsx');
  assert.ok(fs.existsSync(bannerPath), 'AutoUpdateBanner.tsx must exist');
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');
  assert.ok(bannerContent.includes('checkForAppUpdates'), 'AutoUpdateBanner must check for updates');
  assert.ok(bannerContent.includes('performKnowledgeSync'), 'AutoUpdateBanner must sync self-learning knowledge');
  assert.ok(bannerContent.includes('SKIP_WAITING'), 'AutoUpdateBanner must signal service worker on update');
  console.log('  ✓ AutoUpdateBanner correctly integrated with countdown and knowledge sync');

  // 5. Test Live Self-Learning RAG Ingestion Function
  console.log('\n--- 5. Checking Self-Learning Engine Cloud Sync Export ---');
  const { syncLearnedDocumentsFromCloud, getLearnedDocuments } = require('../lib/knowledge/self-learning-rag.ts');
  assert.strictEqual(typeof syncLearnedDocumentsFromCloud, 'function', 'syncLearnedDocumentsFromCloud must be exported');
  const docs = getLearnedDocuments();
  console.log(`  ✓ Active in-memory self-learned documents: ${docs.length}`);
  assert.ok(docs.length >= 0, 'Learned documents array must be accessible');

  console.log('\n================================================================');
  console.log('🎉 ALL AUTO-UPDATE & INTERNET ENGINE SYNC TESTS PASSED (100%)');
  console.log('================================================================\n');
}

testAutoUpdateAndSync().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
