const assert = require('assert');
const { emotionClassifier } = require('../lib/knowledge/emotion-classifier.ts');

const USER_27_DIMENSIONS = [
  'Admiration',
  'Adoration',
  'Aesthetic Appreciation',
  'Amusement',
  'Anger',
  'Anxiety',
  'Awe',
  'Awkwardness',
  'Boredom',
  'Calmness',
  'Confusion',
  'Craving',
  'Disgust',
  'Empathic Pain',
  'Entrancement',
  'Excitement',
  'Fear',
  'Horror',
  'Interest',
  'Joy',
  'Nostalgia',
  'Relief',
  'Romance',
  'Sadness',
  'Satisfaction',
  'Sexual Desire',
  'Surprise'
];

async function testAll27AndCompositeEmotions() {
  console.log('\n================================================================');
  console.log('TEST SUITE: 27-D COWEN-KELTNER EMOTIONS & COMPOSITE STATE ANALYSIS');
  console.log('================================================================\n');

  // 1. Verify 100% Coverage of User Dimensions in Engine
  console.log('--- 1. Verifying 27 Dimensions Coverage ---');
  const engineDims = emotionClassifier.dimensions.map(d => d.name);
  console.log(`Engine loaded ${engineDims.length} Cowen emotional dimensions.`);
  
  for (const dim of USER_27_DIMENSIONS) {
    const match = engineDims.find(e => e.toLowerCase() === dim.toLowerCase());
    assert.ok(match, `Missing dimension in engine: ${dim}`);
    console.log(`  ✓ ${dim.padEnd(25)} -> Registered in modern neuroscience ontology`);
  }

  // 2. Test Single Dimension Detection across various representative inputs
  console.log('\n--- 2. Sample Dimension Utterances ---');
  const testUtterances = [
    { text: "I have so much respect and look up to my mentor", expected: "admiration" },
    { text: "Look at that adorable little baby puppy, so precious", expected: "adoration" },
    { text: "This sunset and symphony painting is visually sublime", expected: "aesthetic_appreciation" },
    { text: "That comedy joke was hilarious, I cannot stop laughing", expected: "amusement" },
    { text: "I am furious, enraged, and boiling with rage", expected: "anger" },
    { text: "My heart is racing, dreading the outcome, constantly panicking", expected: "anxiety" },
    { text: "Staring up at the vast galaxies leaves me completely spellbound", expected: "awe" },
    { text: "That was so embarrassing and cringeworthy, I blushed", expected: "awkwardness" },
    { text: "Nothing to do, everything is so dull, uninspired, and monotonous", expected: "boredom" },
    { text: "My breathing is slow, steady, peaceful, and centered", expected: "calmness" },
    { text: "I am completely baffled, puzzled, and disoriented", expected: "confusion" },
    { text: "I have an intense urge and yearn for chocolate and coffee", expected: "craving" },
    { text: "That was revolting, repulsive, and makes my stomach turn", expected: "disgust" },
    { text: "Seeing them weep in agony hurts my own heart so deeply", expected: "empathic_pain" },
    { text: "I was completely hypnotized and mesmerized by the sacred chant", expected: "entrancement" },
    { text: "I am so thrilled, pumped up, and cannot wait for tomorrow", expected: "excitement" },
    { text: "I am terrified, trembling, and scared of the danger", expected: "fear" },
    { text: "That gruesome sight was horrifying, sickening nightmare", expected: "horror" },
    { text: "I am deeply curious, fascinated, and want to learn more", expected: "interest" },
    { text: "I feel radiant, bursting with happiness, and smiling ear to ear", expected: "joy" },
    { text: "Looking at old childhood photos brings back bittersweet memories", expected: "nostalgia" },
    { text: "The ordeal is finally over, huge weight off my chest", expected: "relief" },
    { text: "I am madly in love with my partner, holding hands under the stars", expected: "romance" },
    { text: "Crying my eyes out, grieving, feeling hopeless and sorrowful", expected: "sadness" },
    { text: "Everything came together smoothly, feeling proud and content", expected: "satisfaction" },
    { text: "Feeling passionate physical longing and sensual attraction", expected: "sexual_desire" },
    { text: "Out of nowhere, totally astonished, caught completely off guard", expected: "surprise" }
  ];

  for (const item of testUtterances) {
    const diag = emotionClassifier.classifyText(item.text);
    console.log(`Utterance: "${item.text.slice(0, 50)}..."`);
    console.log(`  -> Dominant: ${diag.dimensionName} (${diag.dimensionId}) | Valence: ${diag.coreAffect.valence}, Arousal: ${diag.coreAffect.arousal}`);
    assert.ok(diag.dimensionScores[item.expected] > 0.3 || diag.dimensionId === item.expected, `Expected strong signal for ${item.expected}`);
  }

  // 3. Test Nuanced Composite States
  console.log('\n--- 3. Nuanced Composite States (Multi-Dimensional Nervous System) ---');
  const compositeScenarios = [
    {
      name: "Bittersweet Relational Nostalgia & Grief",
      text: "Looking through our old love letters, I feel deep warmth and nostalgia for what we had, but also quiet sadness and heartbreak that it ended.",
      expectedTopEmotions: ['nostalgia', 'sadness', 'romance']
    },
    {
      name: "Catastrophic Career Overwhelm & Angry Injustice",
      text: "I am furious that my boss blamed me unfairly, and simultaneously terrified of losing my job and drowning in debts.",
      expectedTopEmotions: ['anger', 'anxiety', 'fear']
    },
    {
      name: "Sublime Aesthetic Awe & Deep Peace",
      text: "Standing before the ancient temple at sunrise, the sheer architectural majesty leaves me in awe and complete serene stillness.",
      expectedTopEmotions: ['awe', 'aesthetic_appreciation', 'calmness']
    },
    {
      name: "Awkward Social Embarrassment yet Amused",
      text: "I completely tripped on stage and was so embarrassed, but honestly it was hilarious and I couldn't stop laughing at myself.",
      expectedTopEmotions: ['awkwardness', 'amusement']
    }
  ];

  for (const scenario of compositeScenarios) {
    console.log(`\nScenario: ${scenario.name}`);
    console.log(`Input: "${scenario.text}"`);
    const diag = emotionClassifier.classifyText(scenario.text);
    
    // Sort top dimensions
    const topDims = Object.entries(diag.dimensionScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    console.log(`  Dominant State: ${diag.dimensionName} (Score: ${(diag.dimensionScores[diag.dimensionId] * 100).toFixed(1)}%)`);
    console.log(`  Polyvagal/Doshic: ${diag.polyvagalState}`);
    console.log(`  Composite Nuances:`);
    topDims.forEach(([id, sc]) => {
      const dimName = emotionClassifier.getDimensionName(id);
      console.log(`    • ${dimName.padEnd(25)}: ${(sc * 100).toFixed(1)}%`);
    });

    // Check that expected emotions are active in top scores
    const topIds = topDims.map(([id]) => id);
    const hasOverlap = scenario.expectedTopEmotions.some(exp => topIds.includes(exp));
    assert.ok(hasOverlap, `Scenario ${scenario.name} must reflect expected composite emotions`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 27 EMOTIONS & COMPOSITE STATE TESTS PASSED (100%)');
  console.log('================================================================\n');
}

testAll27AndCompositeEmotions().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
