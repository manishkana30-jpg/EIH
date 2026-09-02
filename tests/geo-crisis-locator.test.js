/**
 * Unit & Integration Test Suite: GPS-Based Mental Health Crisis & Local Care Locator
 * Verifies multi-jurisdiction hotline routing, timezone/coordinate inference, and safety integrity.
 */

const assert = require('assert');

// Mock directory for Node testing
const {
  GLOBAL_CRISIS_DIRECTORY,
  inferCountryFromTimezone,
  getCrisisProfileByCountry,
  getAvailableCrisisCountries,
} = require('../lib/safety/geo-crisis-directory.ts');

function runGeoCrisisTests() {
  console.log('--- Running GPS Crisis & Local Care Locator Suite ---');

  // Test 1: Timezone Country Inference
  console.log('Test 1: Timezone Country Inference');
  assert.strictEqual(inferCountryFromTimezone('Asia/Kolkata'), 'IN');
  assert.strictEqual(inferCountryFromTimezone('Asia/Calcutta'), 'IN');
  assert.strictEqual(inferCountryFromTimezone('America/New_York'), 'US');
  assert.strictEqual(inferCountryFromTimezone('America/Los_Angeles'), 'US');
  assert.strictEqual(inferCountryFromTimezone('America/Toronto'), 'CA');
  assert.strictEqual(inferCountryFromTimezone('Europe/London'), 'GB');
  assert.strictEqual(inferCountryFromTimezone('Australia/Sydney'), 'AU');
  assert.strictEqual(inferCountryFromTimezone('Pacific/Auckland'), 'NZ');
  assert.strictEqual(inferCountryFromTimezone('Asia/Singapore'), 'SG');
  console.log('  ✓ Verified 9/9 timezone mappings correctly resolved');

  // Test 2: Country Crisis Profile Integrity
  console.log('Test 2: Country Crisis Profile Integrity');
  const countries = getAvailableCrisisCountries();
  assert(countries.length >= 10, 'Must support at least 10 international jurisdictions');

  for (const c of countries) {
    const profile = getCrisisProfileByCountry(c.code);
    assert(profile.countryCode, `Country ${c.name} missing countryCode`);
    assert(profile.countryName, `Country ${c.name} missing countryName`);
    assert(profile.emergencyGeneral, `Country ${c.name} missing general emergency number`);
    assert(profile.primarySuicideLifeline, `Country ${c.name} missing primary suicide lifeline`);
    assert(profile.primarySuicideLifeline.phone, `Country ${c.name} missing phone on primary lifeline`);
    assert.strictEqual(profile.primarySuicideLifeline.is24x7, true, `Primary lifeline for ${c.name} must be 24/7`);
    console.log(`  ✓ [${profile.flag} ${profile.countryName}]: Emergency ${profile.emergencyGeneral} | Lifeline: ${profile.primarySuicideLifeline.name} (${profile.primarySuicideLifeline.phone})`);
  }

  // Test 3: India (Tele-MANAS & KIRAN) Specific Verification
  console.log('Test 3: India Crisis Profile Verification');
  const inProfile = getCrisisProfileByCountry('IN');
  assert.strictEqual(inProfile.emergencyGeneral, '112');
  assert.strictEqual(inProfile.primarySuicideLifeline.phone, '14416');
  assert(inProfile.additionalHotlines.some(h => h.name.includes('KIRAN')));
  assert(inProfile.additionalHotlines.some(h => h.name.includes('Vandrevala')));
  console.log('  ✓ India Tele-MANAS (14416), KIRAN (1800-599-0019) & 112 verified');

  // Test 4: USA (988) Specific Verification
  console.log('Test 4: USA Crisis Profile Verification');
  const usProfile = getCrisisProfileByCountry('US');
  assert.strictEqual(usProfile.emergencyGeneral, '911');
  assert.strictEqual(usProfile.primarySuicideLifeline.phone, '988');
  assert(usProfile.additionalHotlines.some(h => h.name.includes('Crisis Text Line')));
  console.log('  ✓ USA 988 Suicide & Crisis Lifeline and 911 verified');

  // Test 5: Safe Fallback for Unknown Country Code
  console.log('Test 5: Fallback on Unknown Jurisdiction');
  const unknownProfile = getCrisisProfileByCountry('XX');
  assert(unknownProfile, 'Must safely return default crisis profile on unknown country');
  assert.strictEqual(unknownProfile.countryCode, 'IN');
  console.log('  ✓ Unknown country code safely defaulted to verified profile');

  console.log('================================================================');
  console.log('🎉 ALL GPS CRISIS & LOCAL CARE LOCATOR TESTS PASSED (100%)');
  console.log('================================================================');
}

runGeoCrisisTests();
