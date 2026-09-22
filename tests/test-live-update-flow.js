// tests/test-live-update-flow.js
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runLiveUpdateTests() {
  console.log('================================================================');
  console.log('TESTING LIVE UPDATE & ENGINE SYNCHRONIZATION (PORT 3001)');
  console.log('================================================================\n');

  // 1. Test /api/version
  console.log('--- 1. Testing GET /api/version ---');
  const verRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/version?_t=' + Date.now(),
    method: 'GET'
  });
  console.log('  Status:', verRes.status);
  console.log('  Build ID:', verRes.body.buildId);
  console.log('  App Version:', verRes.body.version);
  console.log('  Learned Documents Count:', verRes.body.learnedCount);
  if (verRes.status !== 200 || !verRes.body.buildId) {
    throw new Error('Failed GET /api/version');
  }
  console.log('  ✓ /api/version responsive and valid.\n');

  // 2. Test GET /api/library/sync
  console.log('--- 2. Testing GET /api/library/sync ---');
  const syncGetRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/library/sync',
    method: 'GET'
  });
  console.log('  Status:', syncGetRes.status);
  console.log('  Total Synced Documents:', syncGetRes.body.total);
  if (syncGetRes.status !== 200 || !Array.isArray(syncGetRes.body.learned_documents)) {
    throw new Error('Failed GET /api/library/sync');
  }
  console.log('  ✓ /api/library/sync GET responsive and returned active clinical documents.\n');

  // 3. Test POST /api/library/sync (simulating engine learning new discovery from internet)
  console.log('--- 3. Testing POST /api/library/sync (Internet Self-Learning Discovery) ---');
  const uniqueId = 'pubmed-2026-neuroplasticity-' + Date.now();
  const newClinicalDoc = {
    id: uniqueId,
    name: 'Self-Directed Neuroplasticity in Somatic Grounding',
    category: 'neuroscience',
    condition: 'anxiety',
    clinical_summary: 'Clinical trials demonstrate that 90-second slow-paced diaphragmatic exhalations with ocular grounding stimulate vagal tone and downregulate amygdala hyperactivity.',
    source_platform: 'PubMed Central PMC9841203',
    learned_timestamp: new Date().toISOString(),
    solutions: {
      cbt: {
        reframe: 'Physiological arousal is nervous system energy that can be downshifted within 90 seconds.',
        exercise: 'Extended 4-7-8 exhalation cycle.'
      },
      gita: {
        verse: '2.70',
        teaching: 'A person who remains undisturbed by the incessant flow of desires and sensations attains peace.'
      },
      tratak: {
        focus_object: 'Steady blue light dot or open space',
        duration_seconds: 60,
        technique: 'Wide peripheral gaze grounding to induce parasympathetic brake.'
      }
    }
  };

  const postRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/library/sync',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { document: newClinicalDoc });

  console.log('  Status:', postRes.status);
  console.log('  Response:', postRes.body);
  if (postRes.status !== 200 || !postRes.body.success) {
    throw new Error('Failed POST /api/library/sync');
  }
  console.log('  ✓ New clinical discovery successfully submitted to cloud sync.\n');

  // 4. Verify the new document is now returned in GET /api/library/sync
  console.log('--- 4. Verifying Synced Discovery in Catalog ---');
  const verifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/library/sync',
    method: 'GET'
  });
  const found = verifyRes.body.learned_documents.find(d => d.id === uniqueId);
  console.log('  New doc found in synced library:', !!found);
  console.log('  Total documents in library:', verifyRes.body.total);
  if (!found) {
    throw new Error('Newly synced document not found in /api/library/sync response');
  }
  console.log('  ✓ Confirmed: Newly learned clinical discovery is immediately available to all connected engines!\n');

  console.log('================================================================');
  console.log('🎉 ALL LIVE UPDATE & ENGINE SYNC TESTS PASSED (100%)');
  console.log('================================================================');
}

runLiveUpdateTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
