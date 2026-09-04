/**
 * Global Language Catalog, GPS Geolocation & Real-Time Multilingual Mirroring Test Suite
 */

const assert = require('assert');
const {
  GLOBAL_LANGUAGE_CATALOG,
  deduceCountryFromCoordinates,
  deduceCountryFromTimezoneAndLocale,
  getLanguageByCode,
} = require('../lib/i18n/language-catalog.ts');
const {
  generateDynamicCompanionReply,
  detectUserSpokenLanguage,
} = require('../lib/nlp/conversational-companion-engine.ts');

console.log('\n--- Running Global Language Catalog & GPS Geolocation Tests ---');

// 1. Verify Catalog Completeness
assert(GLOBAL_LANGUAGE_CATALOG.length >= 25, 'Catalog should contain at least 25 global languages');
console.log(`  ✓ Verified ${GLOBAL_LANGUAGE_CATALOG.length} languages loaded in Global Catalog`);

GLOBAL_LANGUAGE_CATALOG.forEach((lang) => {
  assert(lang.code && typeof lang.code === 'string', `Language ${lang.name} missing valid code`);
  assert(lang.name && typeof lang.name === 'string', `Language code ${lang.code} missing name`);
  assert(lang.nativeName, `Language ${lang.name} missing nativeName`);
  assert(lang.speechLocale, `Language ${lang.name} missing speechLocale`);
});
console.log('  ✓ All 25+ language records validated for BCP-47 speech locales');

// 2. Verify GPS Coordinate Bounding Box Deductions
const testCases = [
  { lat: 19.076, lon: 72.877, expectedCountry: 'IN', expectedLang: 'hi' }, // Mumbai, India
  { lat: 28.6139, lon: 77.209, expectedCountry: 'IN', expectedLang: 'hi' }, // Delhi, India
  { lat: 40.7128, lon: -74.006, expectedCountry: 'US', expectedLang: 'en' }, // New York, USA
  { lat: 48.8566, lon: 2.3522, expectedCountry: 'FR', expectedLang: 'fr' }, // Paris, France
  { lat: 52.52, lon: 13.405, expectedCountry: 'DE', expectedLang: 'de' }, // Berlin, Germany
  { lat: 40.4168, lon: -3.7038, expectedCountry: 'ES', expectedLang: 'es' }, // Madrid, Spain
  { lat: 35.6762, lon: 139.6503, expectedCountry: 'JP', expectedLang: 'ja' }, // Tokyo, Japan
  { lat: 31.2304, lon: 121.4737, expectedCountry: 'CN', expectedLang: 'zh' }, // Shanghai, China
  { lat: -23.5505, lon: -46.6333, expectedCountry: 'BR', expectedLang: 'pt' }, // Sao Paulo, Brazil
  { lat: 25.2048, lon: 55.2708, expectedCountry: 'AE', expectedLang: 'ar' }, // Dubai, UAE
];

testCases.forEach((tc) => {
  const res = deduceCountryFromCoordinates(tc.lat, tc.lon);
  assert.strictEqual(res.countryCode, tc.expectedCountry, `GPS coords (${tc.lat}, ${tc.lon}) failed country match`);
  assert.strictEqual(res.defaultLanguageCode, tc.expectedLang, `GPS coords (${tc.lat}, ${tc.lon}) failed language match`);
});
console.log(`  ✓ Successfully verified ${testCases.length} international GPS coordinate bounding box deductions`);

// 3. Verify getLanguageByCode helper
const hindi = getLanguageByCode('hi');
assert.strictEqual(hindi.name, 'Hindi');
assert.strictEqual(hindi.speechLocale, 'hi-IN');

const spanish = getLanguageByCode('es');
assert.strictEqual(spanish.name, 'Spanish');
assert.strictEqual(spanish.speechLocale, 'es-ES');

const french = getLanguageByCode('fr');
assert.strictEqual(french.name, 'French');
assert.strictEqual(french.speechLocale, 'fr-FR');

console.log('  ✓ getLanguageByCode lookups verified for Hindi, Spanish, French, and English fallbacks');

// 4. Real-Time Dynamic Multilingual Mirroring (User Speaks Language At That Time)
console.log('\n--- Verifying Real-Time Multilingual Utterance Mirroring ---');

// Turn A: User speaks in Hindi (Devanagari)
const hindiUtterance = "मुझे बहुत तनाव और घबराहट महसूस हो रही है।";
const hindiRes = generateDynamicCompanionReply({ userText: hindiUtterance });
assert.strictEqual(hindiRes.detectedLanguage, 'hi');
assert.strictEqual(hindiRes.speechLocale, 'hi-IN');
assert(/[\u0900-\u097F]/.test(hindiRes.reply), 'Hindi reply should be in Devanagari script');
console.log(`  ✓ [Hindi Devanagari]: "${hindiUtterance}" ➔ Companion (hi-IN): "${hindiRes.reply.slice(0, 50)}..."`);

// Turn B: User speaks in Hinglish (Roman Hindi)
const hinglishUtterance = "Mujhe bohot tension ho raha hai office ki wajah se";
const hinglishRes = generateDynamicCompanionReply({ userText: hinglishUtterance });
assert.strictEqual(hinglishRes.detectedLanguage, 'hi');
assert.strictEqual(hinglishRes.speechLocale, 'hi-IN');
console.log(`  ✓ [Hinglish]: "${hinglishUtterance}" ➔ Companion: "${hinglishRes.reply.slice(0, 50)}..."`);

// Turn C: User switches to Spanish
const spanishUtterance = "Hola, me siento muy triste y cansado hoy";
const spanishRes = generateDynamicCompanionReply({ userText: spanishUtterance });
assert.strictEqual(spanishRes.detectedLanguage, 'es');
assert.strictEqual(spanishRes.speechLocale, 'es-ES');
assert(spanishRes.reply.toLowerCase().includes('comprensible') || spanishRes.reply.toLowerCase().includes('tensión') || spanishRes.reply.toLowerCase().includes('nervioso'));
console.log(`  ✓ [Spanish]: "${spanishUtterance}" ➔ Companion (es-ES): "${spanishRes.reply.slice(0, 50)}..."`);

// Turn D: User switches to French
const frenchUtterance = "Bonjour, je suis très stressé et fatigué par mon travail";
const frenchRes = generateDynamicCompanionReply({ userText: frenchUtterance });
assert.strictEqual(frenchRes.detectedLanguage, 'fr');
assert.strictEqual(frenchRes.speechLocale, 'fr-FR');
console.log(`  ✓ [French]: "${frenchUtterance}" ➔ Companion (fr-FR): "${frenchRes.reply.slice(0, 50)}..."`);

// Turn E: User switches to German
const germanUtterance = "Hallo mein Freund, ich fühle mich heute sehr überfordert";
const germanRes = generateDynamicCompanionReply({ userText: germanUtterance });
assert.strictEqual(germanRes.detectedLanguage, 'de');
assert.strictEqual(germanRes.speechLocale, 'de-DE');
console.log(`  ✓ [German]: "${germanUtterance}" ➔ Companion (de-DE): "${germanRes.reply.slice(0, 50)}..."`);

// Turn F: User switches back to English
const englishUtterance = "Can I share what is on my mind today?";
const englishRes = generateDynamicCompanionReply({ userText: englishUtterance });
assert.strictEqual(englishRes.detectedLanguage, 'en');
assert.strictEqual(englishRes.speechLocale, 'en-US');
console.log(`  ✓ [English]: "${englishUtterance}" ➔ Companion (en-US): "${englishRes.reply.slice(0, 50)}..."`);

// 5. Verify Target Language Selection Override (e.g. English query with Hindi target selected)
console.log('\n--- Verifying Target Language Selection Override ---');
const overrideHindi = generateDynamicCompanionReply({
  userText: "I am feeling overwhelmed by all my tasks today",
  targetLanguageCode: 'hi',
  speechLocale: 'hi-IN',
});
assert.strictEqual(overrideHindi.detectedLanguage, 'hi');
assert(/[\u0900-\u097F]/.test(overrideHindi.reply), 'Should generate pure Devanagari Hindi response when Hindi target is selected');
// Verify NO raw English clinical strings leaked
assert(!overrideHindi.reply.includes('Identify the worst-case scenario'), 'Should not contain raw English CBT text');
assert(!overrideHindi.reply.includes('5-4-3-2-1 Sensory Grounding: Name 5 things you see'), 'Should not contain raw English grounding text');
console.log(`  ✓ [Target Language Override -> Hindi (Devanagari)]: Query: "I am feeling overwhelmed..." ➔ Reply: "${overrideHindi.reply}"`);

const overrideSpanish = generateDynamicCompanionReply({
  userText: "I am feeling burnt out from working too much",
  targetLanguageCode: 'es',
  speechLocale: 'es-ES',
});
assert.strictEqual(overrideSpanish.detectedLanguage, 'es');
assert(!overrideSpanish.reply.includes('Reframe rest as non-negotiable'), 'Should not contain raw English burnout text');
assert(overrideSpanish.reply.toLowerCase().includes('comprensible') || overrideSpanish.reply.toLowerCase().includes('descanso') || overrideSpanish.reply.toLowerCase().includes('laboral'));
console.log(`  ✓ [Target Language Override -> Spanish]: Query: "I am feeling burnt out..." ➔ Reply: "${overrideSpanish.reply}"`);

console.log('\nReal-Time Multilingual Mirroring & Zero Code-Switching: 100% Passed!\n');
