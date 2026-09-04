const { runSafetyTests } = require('./safety-crisis.test.js');
const { runCryptoAndAudioTests } = require('./audio-crypto.test.js');
const { runHybridRagTests } = require('./hybrid-rag.test.js');
const { runConversationalDiversityTests } = require('./conversational-diversity.test.js');
const { runTtsSanitizerTests } = require('./test_tts_sanitizer.js');
require('./language-catalog.test.js');
require('./remedies-matrix.test.js');
require('./google-research-grounding.test.js');
require('./api_key_encryption.test.js');
require('./audit_remediation.test.js');
require('./cbt_self_learning.test.js');
require('./geo-crisis-locator.test.js');
require('./search-fallback.test.js');
require('./therapist-engine.test.js');
require('./audit_fix_verification.test.js');
require('./cbt-library.test.js');
require('./test-psychology-library-rag.js');


console.log('================================================================');
console.log('EMOTIONAL INTELLIGENCE HEALER (EIH) - MASTER TEST VERIFICATION');
console.log('================================================================\n');

try {
  runSafetyTests();
  runCryptoAndAudioTests();
  runHybridRagTests();
  runConversationalDiversityTests();
  runTtsSanitizerTests();
  console.log('================================================================');
  console.log('🎉 ALL SYSTEM TESTS PASSED WITH 100% SUCCESS RATE');
  console.log('================================================================');
} catch (err) {
  console.error('\n❌ TEST VERIFICATION FAILED:', err);
  process.exit(1);
}
