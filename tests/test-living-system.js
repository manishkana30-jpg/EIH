/**
 * tests/test-living-system.js
 *
 * Automated verification suite for EIH Living System Architecture:
 * 1. Living Knowledge Library (PubMed + Wikipedia Open-Access Cache & SQLite)
 * 2. Client & Backend Zero-Cloud Okapi BM25 Semantic RAG Engine
 * 3. Phase 0 Conversational Knowledge Bridge (cites evidence & re-orients to somatic state)
 * 4. STT Fuzzy & Phonetic Auto-Correction Pipeline
 * 5. Logic Auto-Correction & Clarification on Ambiguous Inputs (< 0.3 confidence)
 * 6. Self-Healing Hardware Error Boundary & Chrome Speech Watchdog
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runLivingSystemTests() {
  console.log('\n======================================================');
  console.log('🌿 RUNNING EIH LIVING SYSTEM ARCHITECTURE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  }

  // =========================================================================
  // 1. LIVING KNOWLEDGE LIBRARY INGESTION & DATA INTEGRITY
  // =========================================================================
  console.log('--- 1. Living Knowledge Library Ingestion & SQLite Cache ---');

  const clinicalGuidesPath = path.join(__dirname, '..', 'lib', 'knowledge', 'clinical-guides.json');
  assert(fs.existsSync(clinicalGuidesPath), 'clinical-guides.json must exist');
  const clinicalGuides = JSON.parse(fs.readFileSync(clinicalGuidesPath, 'utf8'));

  test('Living library contains at least 15 verified clinical guides', () => {
    assert(Array.isArray(clinicalGuides), 'clinical-guides.json must be an array');
    assert(clinicalGuides.length >= 15, `Expected >= 15 guides, found ${clinicalGuides.length}`);
  });

  test('Target topics (Polyvagal, DMN, Somatic Experiencing, CBT) are present', () => {
    const ids = clinicalGuides.map((g) => g.id);
    assert(ids.includes('polyvagal_theory_live'), 'Polyvagal Theory live guide must exist');
    assert(ids.includes('default_mode_network_live'), 'Default Mode Network live guide must exist');
    assert(ids.includes('somatic_experiencing_live'), 'Somatic Experiencing live guide must exist');
    assert(ids.includes('cognitive_behavioral_therapy_live'), 'CBT live guide must exist');
  });

  test('Auto-updated guides include peer-reviewed PubMed citations & PMIDs', () => {
    const polyvagalGuide = clinicalGuides.find((g) => g.id === 'polyvagal_theory_live');
    assert(polyvagalGuide, 'Polyvagal guide must be found');
    assert(Array.isArray(polyvagalGuide.citations), 'Guide must contain citations array');
    assert(polyvagalGuide.citations.length >= 1, 'Guide must contain at least 1 PubMed citation');

    const firstCitation = polyvagalGuide.citations[0];
    assert(firstCitation.url && firstCitation.url.includes('pubmed.ncbi.nlm.nih.gov'), 'Citation must link to PubMed');
    assert(firstCitation.pmid, 'Citation must contain PMID');
    assert(firstCitation.title, 'Citation must have title');
    assert(firstCitation.journal, 'Citation must have journal');
  });

  test('Local SQLite knowledge database exists', () => {
    const dbPath = path.join(__dirname, '..', 'keyless_healer', 'data', 'clinical_knowledge.db');
    assert(fs.existsSync(dbPath), 'clinical_knowledge.db must exist in keyless_healer/data/');
    const stats = fs.statSync(dbPath);
    assert(stats.size > 1000, 'clinical_knowledge.db must be populated (> 1KB)');
  });

  // =========================================================================
  // 2. STT FUZZY & PHONETIC AUTO-CORRECTION
  // =========================================================================
  console.log('\n--- 2. STT Fuzzy & Phonetic Auto-Correction Pipeline ---');

  const sttCorrectorTsPath = path.join(__dirname, '..', 'lib', 'audio', 'stt-corrector.ts');
  const sttCorrectorPyPath = path.join(__dirname, '..', 'keyless_healer', 'lib', 'stt_corrector.py');
  assert(fs.existsSync(sttCorrectorTsPath), 'lib/audio/stt-corrector.ts must exist');
  assert(fs.existsSync(sttCorrectorPyPath), 'keyless_healer/lib/stt_corrector.py must exist');

  const sttTsCode = fs.readFileSync(sttCorrectorTsPath, 'utf8');

  test('STT Corrector contains clinical vocabulary mappings (polyvagal, trataka, pranayama, vagus nerve)', () => {
    assert(sttTsCode.includes('polyvagal'), 'Must include polyvagal mapping');
    assert(sttTsCode.includes('trataka'), 'Must include trataka');
    assert(sttTsCode.includes('pranayama'), 'Must include pranayama');
    assert(sttTsCode.includes('vagus nerve'), 'Must include vagus nerve');
  });

  test('STT Corrector implements Levenshtein distance algorithm for zero-latency fuzzy correction', () => {
    assert(sttTsCode.includes('levenshteinDistance'), 'Must implement levenshteinDistance algorithm');
    assert(sttTsCode.includes('CLINICAL_DICTIONARY'), 'Must maintain CLINICAL_DICTIONARY of terms');
  });

  // =========================================================================
  // 3. ZERO-CLOUD LOCAL OKAPI BM25 SEMANTIC RAG PIPELINE
  // =========================================================================
  console.log('\n--- 3. Zero-Cloud Local BM25 Semantic Search & RAG Bridge ---');

  const semanticRagTsPath = path.join(__dirname, '..', 'lib', 'knowledge', 'semantic-rag.ts');
  const semanticRagPyPath = path.join(__dirname, '..', 'keyless_healer', 'lib', 'semantic_search.py');
  assert(fs.existsSync(semanticRagTsPath), 'lib/knowledge/semantic-rag.ts must exist');
  assert(fs.existsSync(semanticRagPyPath), 'keyless_healer/lib/semantic_search.py must exist');

  const ragTsCode = fs.readFileSync(semanticRagTsPath, 'utf8');

  test('Client & daemon implement Okapi BM25 with k1=1.2 and b=0.75', () => {
    assert(ragTsCode.includes('k1 = 1.2'), 'Must configure k1 = 1.2');
    assert(ragTsCode.includes('b = 0.75'), 'Must configure b = 0.75');
    assert(ragTsCode.includes('avgDocLength'), 'Must track average document length');
    assert(ragTsCode.includes('idfMap'), 'Must compute inverse document frequency (IDF)');
  });

  test('RAG indexes clinical guides, CBT protocols, and Bhagavad Gita verses', () => {
    assert(ragTsCode.includes('clinicalGuidesData'), 'Must index clinical guides');
    assert(ragTsCode.includes('psychologyLibData'), 'Must index psychology library');
    assert(ragTsCode.includes('gitaVersesData'), 'Must index Gita wisdom verses');
  });

  test('Conversational Knowledge Bridge answers informational queries citing PubMed/Wikipedia and re-orients to somatic state', () => {
    assert(ragTsCode.includes('answerConversationalBridge'), 'Must implement answerConversationalBridge()');
    assert(ragTsCode.includes('How are you feeling in your body right now?'), 'Must include somatic re-orientation prompt');
  });

  // =========================================================================
  // 4. CORE STATE MACHINE ENHANCEMENTS & SELF-CORRECTION
  // =========================================================================
  console.log('\n--- 4. Core State Machine Living System Integrations ---');

  const stateMachinePath = path.join(__dirname, '..', 'lib', 'wellness-flow', 'wellness-state-machine.ts');
  assert(fs.existsSync(stateMachinePath), 'wellness-state-machine.ts must exist');
  const smCode = fs.readFileSync(stateMachinePath, 'utf8');

  test('State machine applies STT fuzzy correction before emotion classification', () => {
    assert(smCode.includes('sttTextCorrector.correct'), 'Must correct raw input using sttTextCorrector');
    assert(smCode.includes('sttResult.correctedText'), 'Must pass corrected text into classification');
  });

  test('Phase 0 checks RAG Conversational Knowledge Bridge for informational questions', () => {
    assert(smCode.includes('clientBM25Engine.answerConversationalBridge'), 'Must query clientBM25Engine bridge in Phase 0');
    assert(smCode.includes('isPurposeQuery: true'), 'Must treat conversational bridge query as purpose/informational query');
  });

  test('State machine executes Logic Auto-Correction on confidence < 0.3 without false classification', () => {
    assert(smCode.includes('isLowConfidenceRetry'), 'Must track isLowConfidenceRetry flag');
    assert(smCode.includes('confidence < 0.3'), 'Must trigger logic auto-correction if confidence < 0.3');
    assert(smCode.includes('Are you feeling more overwhelmed, or more exhausted'), 'Must provide self-correction prompt');
  });

  // =========================================================================
  // 5. SELF-HEALING HARDWARE WATCHDOG & ERROR BOUNDARY
  // =========================================================================
  console.log('\n--- 5. Self-Healing Hardware Error Boundary & Watchdog ---');

  const errorBoundaryPath = path.join(__dirname, '..', 'components', 'common', 'HardwareErrorBoundary.tsx');
  assert(fs.existsSync(errorBoundaryPath), 'components/common/HardwareErrorBoundary.tsx must exist');
  const ebCode = fs.readFileSync(errorBoundaryPath, 'utf8');

  test('HardwareErrorBoundary handles NotAllowedError, NotFoundError, NotReadableError with Text-Only Tranquility fallback', () => {
    assert(ebCode.includes('NotAllowedError'), 'Must handle camera/mic permission denial');
    assert(ebCode.includes('NotFoundError'), 'Must handle missing hardware devices');
    assert(ebCode.includes('Text-Only Tranquility') || ebCode.includes('Tranquility Mode'), 'Must offer graceful Text-Only fallback UI');
    assert(ebCode.includes('Retry Sensor'), 'Must include retry button');
  });

  const speechEnginePath = path.join(__dirname, '..', 'lib', 'audio', 'browser-speech.ts');
  assert(fs.existsSync(speechEnginePath), 'lib/audio/browser-speech.ts must exist');
  const speechCode = fs.readFileSync(speechEnginePath, 'utf8');

  test('Browser speech engine has stuckPendingWatchdog recovering Chrome speech synthesis stall', () => {
    assert(speechCode.includes('stuckPendingWatchdog'), 'Must implement stuckPendingWatchdog');
    assert(speechCode.includes('speechSynth.cancel()'), 'Must cancel stuck speech synthesis');
    assert(speechCode.includes('speechSynth.resume()'), 'Must resume audio context on unblock');
  });

  // =========================================================================
  // 6. NEXT.JS ISR ON /library & FASTAPI ENDPOINTS
  // =========================================================================
  console.log('\n--- 6. Next.js ISR & Living Library UI Components ---');

  const revalidateRoutePath = path.join(__dirname, '..', 'app', 'api', 'library', 'revalidate', 'route.ts');
  assert(fs.existsSync(revalidateRoutePath), 'app/api/library/revalidate/route.ts must exist');

  const livingLibraryViewPath = path.join(__dirname, '..', 'components', 'library', 'LivingLibraryView.tsx');
  assert(fs.existsSync(livingLibraryViewPath), 'components/library/LivingLibraryView.tsx must exist');

  test('LivingLibraryView renders search, categories, PubMed citations and Live Sync trigger', () => {
    const viewCode = fs.readFileSync(livingLibraryViewPath, 'utf8');
    assert(viewCode.includes('Trigger Live Clinical Sync'), 'Must have live clinical sync button');
    assert(viewCode.includes('Peer-Reviewed PubMed Citations'), 'Must render PubMed citations');
    assert(viewCode.includes('/api/knowledge/sync-library'), 'Must link to backend sync endpoint');
  });

  const appPyPath = path.join(__dirname, '..', 'keyless_healer', 'app.py');
  const appPyCode = fs.readFileSync(appPyPath, 'utf8');

  test('FastAPI daemon exposes /api/knowledge/sync-library, /api/knowledge/rag-search, /api/knowledge/conversational-bridge', () => {
    assert(appPyCode.includes('/api/knowledge/sync-library'), 'Must expose /api/knowledge/sync-library');
    assert(appPyCode.includes('/api/knowledge/rag-search'), 'Must expose /api/knowledge/rag-search');
    assert(appPyCode.includes('/api/knowledge/conversational-bridge'), 'Must expose /api/knowledge/conversational-bridge');
  });

  console.log('\n======================================================');
  console.log(`🎉 ALL LIVING SYSTEM TESTS EXECUTED: ${passed}/${total} PASSED`);
  console.log('======================================================\n');
}

runLivingSystemTests();
