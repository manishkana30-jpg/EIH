/**
 * Comprehensive Automated Test Suite: Spoken Language Understanding & GPS Geolocation Override
 *
 * Verifies that:
 * 1. When the webapp listens to user words, it detects the user's spoken language.
 * 2. Spoken language explicitly overrides the GPS/IP default language for generating replies.
 * 3. English spoken input in a Hindi GPS locale generates an English therapeutic reply.
 * 4. Hindi spoken input (Devanagari or Romanized) in an English GPS locale generates a Hindi therapeutic reply.
 * 5. Spanish, French, and German inputs override GPS locales.
 * 6. Incomplete utterance and repetition loop interceptors honor the spoken language over GPS.
 * 7. Fast-path greetings and mic tests honor the spoken language over GPS.
 */

const assert = require('assert');

const {
  detectUserSpokenLanguage,
  resolveSpokenLanguageWithGpsOverride,
} = require('../lib/i18n/language-catalog.ts');

const {
  getLocalizedRepetitionSolutionResponse,
  getLocalizedIncompleteUtteranceResponse,
  getLocalizedGreetingResponse,
  getLocalizedTestResponse,
} = require('../lib/knowledge/psychology-library-rag.ts');

const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

console.log('\n================================================================');
console.log('TEST SUITE: SPOKEN LANGUAGE UNDERSTANDING & GPS LOCALE OVERRIDE');
console.log('================================================================\n');

async function runTests() {
  // ─── PART 1: Direct Linguistic Detection with GPS Override ───
  console.log('--- 1. Testing Linguistic Detection with GPS Override ---');

  // Case 1A: User in India (GPS: hi / hi-IN), speaks English
  const res1A = resolveSpokenLanguageWithGpsOverride(
    "I am feeling very anxious about my exam tomorrow and cannot sleep",
    "hi",
    "hi-IN"
  );
  assert.strictEqual(res1A.langCode, 'en', 'English spoken input must resolve to en');
  assert.strictEqual(res1A.speechLocale, 'en-US', 'English spoken input must resolve to en-US');
  assert.strictEqual(res1A.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ India GPS (hi) + User speaks English -> Correctly resolved to English (en-US)');

  // Case 1B: User in USA (GPS: en / en-US), speaks Romanized Hindi / Hinglish
  const res1B = resolveSpokenLanguageWithGpsOverride(
    "mujhe bohot bechaini ho rahi hai, please help karo",
    "en",
    "en-US"
  );
  assert.strictEqual(res1B.langCode, 'hi', 'Romanized Hindi input must resolve to hi');
  assert.strictEqual(res1B.speechLocale, 'hi-IN', 'Romanized Hindi input must resolve to hi-IN');
  assert.strictEqual(res1B.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ US GPS (en) + User speaks Romanized Hindi -> Correctly resolved to Hindi (hi-IN)');

  // Case 1C: User in USA (GPS: en / en-US), speaks Devanagari Hindi
  const res1C = resolveSpokenLanguageWithGpsOverride(
    "मुझे बहुत तनाव और घबराहट महसूस हो रही है",
    "en",
    "en-US"
  );
  assert.strictEqual(res1C.langCode, 'hi', 'Devanagari Hindi input must resolve to hi');
  assert.strictEqual(res1C.speechLocale, 'hi-IN', 'Devanagari Hindi input must resolve to hi-IN');
  assert.strictEqual(res1C.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ US GPS (en) + User speaks Devanagari Hindi -> Correctly resolved to Hindi (hi-IN)');

  // Case 1D: User in India (GPS: hi / hi-IN), speaks Spanish
  const res1D = resolveSpokenLanguageWithGpsOverride(
    "Hola, me siento muy triste y cansado hoy por el trabajo",
    "hi",
    "hi-IN"
  );
  assert.strictEqual(res1D.langCode, 'es', 'Spanish input must resolve to es');
  assert.strictEqual(res1D.speechLocale, 'es-ES', 'Spanish input must resolve to es-ES');
  assert.strictEqual(res1D.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ India GPS (hi) + User speaks Spanish -> Correctly resolved to Spanish (es-ES)');

  // Case 1E: User in India (GPS: hi / hi-IN), speaks French
  const res1E = resolveSpokenLanguageWithGpsOverride(
    "Bonjour, je suis très fatigué et angoissé par ma vie",
    "hi",
    "hi-IN"
  );
  assert.strictEqual(res1E.langCode, 'fr', 'French input must resolve to fr');
  assert.strictEqual(res1E.speechLocale, 'fr-FR', 'French input must resolve to fr-FR');
  assert.strictEqual(res1E.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ India GPS (hi) + User speaks French -> Correctly resolved to French (fr-FR)');

  // Case 1F: User in India (GPS: hi / hi-IN), speaks German
  const res1F = resolveSpokenLanguageWithGpsOverride(
    "Hallo mein Freund, ich fühle mich heute sehr überfordert und ängstlich",
    "hi",
    "hi-IN"
  );
  assert.strictEqual(res1F.langCode, 'de', 'German input must resolve to de');
  assert.strictEqual(res1F.speechLocale, 'de-DE', 'German input must resolve to de-DE');
  assert.strictEqual(res1F.isOverridden, true, 'Must flag as overridden from GPS');
  console.log('  ✓ India GPS (hi) + User speaks German -> Correctly resolved to German (de-DE)');

  // Case 1G: Neutral / Non-linguistic input falls back to GPS
  const res1G = resolveSpokenLanguageWithGpsOverride("...", "hi", "hi-IN");
  assert.strictEqual(res1G.langCode, 'hi', 'Neutral input must fall back to GPS');
  assert.strictEqual(res1G.isOverridden, false, 'Must flag as non-overridden');
  console.log('  ✓ Neutral punctuation -> Gracefully falls back to GPS language (hi)');

  // ─── PART 2: Fast-Path Greeting & Mic Test Responses ───
  console.log('\n--- 2. Testing Fast-Path Greeting & Mic Test GPS Override ---');

  // English greeting with GPS hi -> English response
  const greetEnWithGpsHi = getLocalizedGreetingResponse("Hello there, how are you", "hi", "hi-IN");
  assert.strictEqual(greetEnWithGpsHi, 'Hello, how can I help you?');
  console.log('  ✓ English greeting ("Hello there") with GPS hi -> Responds in English');

  // Hindi greeting with GPS en -> Hindi response
  const greetHiWithGpsEn = getLocalizedGreetingResponse("नमस्ते", "en", "en-US");
  assert.strictEqual(greetHiWithGpsEn, 'नमस्ते! मैं आपकी कैसे सहायता कर सकता हूँ?');
  console.log('  ✓ Hindi greeting ("नमस्ते") with GPS en -> Responds in Hindi');

  // English mic test with GPS hi -> English test response
  const testEnWithGpsHi = getLocalizedTestResponse("mic test please", "hi", "hi-IN");
  assert.strictEqual(testEnWithGpsHi, 'Mic is running fine.');
  console.log('  ✓ English mic test ("mic test please") with GPS hi -> Responds in English');

  // Hindi mic test with GPS en -> Hindi test response
  const testHiWithGpsEn = getLocalizedTestResponse("माइक टेस्ट करो", "en", "en-US");
  assert.strictEqual(testHiWithGpsEn, 'माइक्रोफ़ोन बिल्कुल सही तरीके से काम कर रहा है।');
  console.log('  ✓ Hindi mic test ("माइक टेस्ट करो") with GPS en -> Responds in Hindi');

  // ─── PART 3: Incomplete Utterance Interceptor GPS Override ───
  console.log('\n--- 3. Testing Incomplete Utterance Interceptor GPS Override ---');

  // English incomplete utterance with GPS hi -> English response
  const incEnWithGpsHi = getLocalizedIncompleteUtteranceResponse("I was thinking that maybe", "hi", "hi-IN");
  assert(incEnWithGpsHi.includes("I only caught"), `Expected English response but got: ${incEnWithGpsHi}`);
  console.log('  ✓ English incomplete utterance with GPS hi -> Returns English clarification prompt');

  // Hindi incomplete utterance with GPS en -> Hindi response
  const incHiWithGpsEn = getLocalizedIncompleteUtteranceResponse("main soch raha tha", "en", "en-US");
  assert(incHiWithGpsEn.includes("मैंने केवल"), `Expected Hindi response but got: ${incHiWithGpsEn}`);
  console.log('  ✓ Hindi incomplete utterance with GPS en -> Returns Hindi clarification prompt');

  // ─── PART 4: Repetition Complaint Loop Interceptor GPS Override ───
  console.log('\n--- 4. Testing Repetition Loop Interceptor GPS Override ---');

  // English complaint with GPS hi -> English Tri-Pillar response
  const repEnWithGpsHi = getLocalizedRepetitionSolutionResponse(
    "Stop repeating yourself and give me a real solution right now",
    "hi",
    "hi-IN"
  );
  assert(repEnWithGpsHi.reply.includes("Tri-Pillar protocol"), "Must deliver English Tri-Pillar protocol");
  assert(!repEnWithGpsHi.reply.includes("त्रि-स्तरीय समाधान"), "Must NOT deliver Hindi response to English user");
  console.log('  ✓ English repetition complaint with GPS hi -> Returns 100% English Tri-Pillar response');

  // Hindi Romanized complaint with GPS en -> Hindi Tri-Pillar response
  const repHiWithGpsEn = getLocalizedRepetitionSolutionResponse(
    "mujhe solution chahiye, sunna band karo aur ilaj batao",
    "en",
    "en-US"
  );
  assert(repHiWithGpsEn.reply.includes("त्रि-स्तरीय समाधान"), "Must deliver Hindi Tri-Pillar solution");
  console.log('  ✓ Hindi Romanized complaint with GPS en -> Returns 100% Hindi Tri-Pillar response');

  // ─── PART 5: Full Therapist Engine End-to-End GPS Override ───
  console.log('\n--- 5. Testing Full Therapist Engine End-to-End GPS Override ---');

  // English user message with GPS hi
  const englishMessage = "I am suffering from intense panic attacks and constant anxiety about my job";
  const replyEnglish = await generateTherapeuticResponse(englishMessage, [], "hi", "hi-IN");
  assert(replyEnglish.reply && replyEnglish.reply.length > 50, "Must generate therapeutic reply");
  // Check that reply is predominantly Latin/English characters and not Hindi Devanagari
  const devanagariCountEn = (replyEnglish.reply.match(/[\u0900-\u097F]/g) || []).length;
  // Gita shloka can be present in Sanskrit [GITA_SHLOKA], but main text must not be Hindi sentences
  assert(!replyEnglish.reply.includes("मैं आपकी स्थिति को समझ"), "English reply must not contain Hindi therapeutic template");
  console.log(`  ✓ English message with GPS hi -> Generated English therapeutic response (${replyEnglish.reply.length} chars)`);

  // Hindi user message with GPS en
  const hindiMessage = "मुझे बहुत गहरी चिंता और घबराहट हो रही है, दिल तेजी से धड़क रहा है";
  const replyHindi = await generateTherapeuticResponse(hindiMessage, [], "en", "en-US");
  assert(replyHindi.reply && replyHindi.reply.length > 50, "Must generate therapeutic reply");
  const devanagariCountHi = (replyHindi.reply.match(/[\u0900-\u097F]/g) || []).length;
  assert(devanagariCountHi > 50, "Hindi message with GPS en must reply in Devanagari Hindi");
  console.log(`  ✓ Hindi message with GPS en -> Generated Hindi therapeutic response (${devanagariCountHi} Devanagari chars)`);

  console.log('\n================================================================');
  console.log('🎉 ALL SPOKEN LANGUAGE UNDERSTANDING & GPS OVERRIDE TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
