/**
 * tests/test-diverse-shloka-selection.js
 * 
 * Verifies that the Gita Cognitive Therapy Engine accurately understands
 * the user's specific mental problem and emotional distress, matching it
 * to the appropriate Shloka out of the 12 psychological archetypes,
 * rather than getting stuck on just one Shloka (BG 2.47).
 */

const assert = require('assert');
const { findGitaWisdom, GITA_LIBRARY } = require('../lib/knowledge/gita-library.ts');
const { resolveTratakaPrescription } = require('../lib/knowledge/trataka-recommendations.ts');

const DIVERSE_TEST_CASES = [
  {
    name: "Heartbreak & Emotional Loss (English)",
    input: "My girlfriend broke up with me yesterday and my heart feels crushed and broken, I cannot stop crying",
    expectedShlokaId: "bg_2_14",
    expectedThemeContains: "Heartbreak",
    expectedTratakaMode: "flame"
  },
  {
    name: "Heartbreak & Grief (Hindi)",
    input: "मेरा दिल टूट गया है, उसने मुझे धोखा देकर छोड़ दिया, बहुत दर्द हो रहा है",
    expectedShlokaId: "bg_2_14",
    expectedThemeContains: "Impermanence of Pain",
    expectedTratakaMode: "flame"
  },
  {
    name: "Rage & Toxic Betrayal (English)",
    input: "I was betrayed by my closest business partner who stole my clients, I am furious and shaking with anger",
    expectedShlokaId: "bg_2_62_63",
    expectedThemeContains: "Anger Cascade",
    expectedTratakaMode: "murti"
  },
  {
    name: "Intense Anger & Conflict (Hindi)",
    input: "मुझे उस पर बहुत ज्यादा गुस्सा आ रहा है, मेरा खून खौल रहा है",
    expectedShlokaId: "bg_2_62_63",
    expectedThemeContains: "Anger Cascade",
    expectedTratakaMode: "murti"
  },
  {
    name: "Core Shame & Imposter Syndrome (English)",
    input: "I feel like a total imposter and failure at work, I hate myself and feel completely worthless",
    expectedShlokaId: "bg_6_5",
    expectedThemeContains: "Self-Mastery",
    expectedTratakaMode: "pratibimb"
  },
  {
    name: "Core Shame & Self-Criticism (Hindi)",
    input: "मैं खुद से नफरत करता हूँ, मुझे अपने आप पर शर्म आती है, मैं किसी काम का नहीं हूँ",
    expectedShlokaId: "bg_6_5",
    expectedThemeContains: "Self-Mastery",
    expectedTratakaMode: "pratibimb"
  },
  {
    name: "Sensory Overload & ADHD Chaos (English)",
    input: "Too many notifications, sensory overload, my brain feels like a hurricane and I am completely overwhelmed",
    expectedShlokaId: "bg_2_70",
    expectedThemeContains: "Ocean Equanimity",
    expectedTratakaMode: "murti"
  },
  {
    name: "Racing Thoughts & Insomnia (English)",
    input: "I have been lying awake in bed for 4 hours with racing intrusive thoughts and ruminating over every mistake",
    expectedShlokaId: "bg_6_26",
    expectedThemeContains: "Restless Mind",
    expectedTratakaMode: "shoonya"
  },
  {
    name: "Insomnia & Overthinking (Hindi)",
    input: "दिमाग में विचार बंद ही नहीं हो रहे हैं, रात भर नींद नहीं आती, बहुत ज्यादा सोच रहा हूँ",
    expectedShlokaId: "bg_6_26",
    expectedThemeContains: "Restless Mind",
    expectedTratakaMode: "shoonya"
  },
  {
    name: "Acute Panic Attack & Trembling (English)",
    input: "I am having a massive panic attack, my heart is pounding out of my chest and I am terrified",
    expectedShlokaId: "bg_2_56",
    expectedThemeContains: "Freedom from Fear",
    expectedTratakaMode: "bindu"
  },
  {
    name: "Social Anxiety & People-Pleasing (English)",
    input: "I obsess over what people think of me, terrified of being judged or criticized at social gatherings",
    expectedShlokaId: "bg_12_15",
    expectedThemeContains: "Social Anxiety",
    expectedTratakaMode: "bindu"
  },
  {
    name: "Comparison Envy & Feeling Behind (English)",
    input: "Looking at everyone else succeeding on LinkedIn while I feel left behind in my career and full of jealousy",
    expectedShlokaId: "bg_3_35",
    expectedThemeContains: "Svadharma",
    expectedTratakaMode: "bindu"
  },
  {
    name: "Urge Surfing & Addictive Craving (English)",
    input: "I have an overwhelming urge to relapse into my addiction, the craving feels irresistible",
    expectedShlokaId: "bg_5_23",
    expectedThemeContains: "Urge Surfing",
    expectedTratakaMode: "murti"
  },
  {
    name: "Severe Burnout & Giving Up (English)",
    input: "I am in deep despair and exhaustion, carry a heavy burden alone, ready to surrender and give up",
    expectedShlokaId: "bg_18_66",
    expectedThemeContains: "Surrender",
    expectedTratakaMode: "flame"
  },
  {
    name: "Career Outcome Paralysis & Dilemma (English)",
    input: "I have an important interview tomorrow, cannot decide what to study, agonizing over whether I will pass or fail and terrified of the result",
    expectedShlokaId: "bg_2_47",
    expectedThemeContains: "Outcome Detachment",
    expectedTratakaMode: "shoonya"
  }
];

function runDiversityTests() {
  console.log('\n================================================================');
  console.log('TESTING DIVERSE SHLOKA SELECTION & ANTI-LOOPING GUARANTEE');
  console.log('================================================================\n');

  assert.strictEqual(GITA_LIBRARY.length, 13, "Gita library must contain exactly 13 psychological Shlokas");
  console.log(`✓ Verified full library of ${GITA_LIBRARY.length} distinct clinical Shlokas.\n`);

  const matchedShlokas = new Set();
  const matchedTratakas = new Set();

  for (const testCase of DIVERSE_TEST_CASES) {
    const wisdom = findGitaWisdom(testCase.input);
    const trataka = resolveTratakaPrescription(testCase.input);

    matchedShlokas.add(wisdom.id);
    matchedTratakas.add(trataka.mode);

    assert.strictEqual(
      wisdom.id,
      testCase.expectedShlokaId,
      `[${testCase.name}] Expected Shloka ${testCase.expectedShlokaId} but got ${wisdom.id}`
    );

    assert.ok(
      wisdom.theme.toLowerCase().includes(testCase.expectedThemeContains.toLowerCase()),
      `[${testCase.name}] Theme '${wisdom.theme}' should include '${testCase.expectedThemeContains}'`
    );

    assert.strictEqual(
      trataka.mode,
      testCase.expectedTratakaMode,
      `[${testCase.name}] Expected Trataka mode ${testCase.expectedTratakaMode} but got ${trataka.mode}`
    );

    console.log(`  ✓ ${testCase.name}`);
    console.log(`     -> Shloka: [${wisdom.id}] Ch ${wisdom.chapter}, Verse ${wisdom.verse} (${wisdom.theme})`);
    console.log(`     -> Trataka: [${trataka.mode}] ${trataka.name}`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Total Unique Shlokas triggered in test: ${matchedShlokas.size} / 12`);
  console.log(`Total Unique Trataka modes triggered in test: ${matchedTratakas.size} / 5`);
  console.log('----------------------------------------------------------------');

  assert.ok(matchedShlokas.size >= 10, "At least 10 different Shlokas must be dynamically triggered across diverse inputs");
  assert.strictEqual(matchedTratakas.size, 5, "All 5 Trataka modes must be dynamically triggered across diverse inputs");

  console.log('\n🎉 ALL DIVERSE SHLOKA & TRATAKA MATCHING TESTS PASSED (100% ANTI-LOOPING VERIFIED)\n');
}

runDiversityTests();
module.exports = { runDiversityTests };
