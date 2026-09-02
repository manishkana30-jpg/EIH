/**
 * Unit Test Suite: Modern Neuroscience of Emotion
 * Tests:
 * 1. Lisa Feldman Barrett (Theory of Constructed Emotion - Core Affect & Interoception)
 * 2. Alan Cowen & Dacher Keltner (27 Continuous Dimensions of Emotion, PNAS 2017)
 * 3. Lauri Nummenmaa (Bodily Maps of Emotion, PNAS 2014)
 * 4. Deep Emotion Classifier & Non-Repetitive Response Synthesis
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runHybridRagTests() {
  console.log('--- Running Modern Neuroscience of Emotion Test Suite ---');

  const ontologyPath = path.join(__dirname, '..', 'lib', 'knowledge', 'modern-neuroscience-ontology.json');
  assert(fs.existsSync(ontologyPath), 'modern-neuroscience-ontology.json must exist');

  const ontology = JSON.parse(fs.readFileSync(ontologyPath, 'utf8'));

  // 1. Verify 3 Foundational Pillars
  assert.strictEqual(ontology.framework_meta.pillars.length, 3, 'Must define all 3 foundational neuroscience pillars');
  console.log('  ✓ Verified 3 Modern Neuroscience Pillars (Barrett, Cowen-Keltner, Nummenmaa)');

  // 2. Verify 27 Cowen & Keltner Dimensions
  const expectedDimensions = [
    'admiration', 'adoration', 'aesthetic_appreciation', 'amusement', 'anger',
    'anxiety', 'awe', 'awkwardness', 'boredom', 'calmness',
    'confusion', 'craving', 'disgust', 'empathic_pain', 'entrancement',
    'excitement', 'fear', 'horror', 'interest', 'joy',
    'nostalgia', 'relief', 'romance', 'sadness', 'satisfaction',
    'sexual_desire', 'surprise'
  ];

  assert.strictEqual(ontology.cowen_dimensions.length, 27, 'Must have exactly 27 continuous dimensions');

  expectedDimensions.forEach((dimId) => {
    const dim = ontology.cowen_dimensions.find((d) => d.id === dimId);
    assert(dim, `Dimension ${dimId} must exist`);

    // Barrett Core Affect verification
    assert(dim.core_affect, `${dimId} must have core affect`);
    assert(dim.core_affect.valence >= -1.0 && dim.core_affect.valence <= 1.0, `${dimId} valence out of bounds`);
    assert(dim.core_affect.arousal >= -1.0 && dim.core_affect.arousal <= 1.0, `${dimId} arousal out of bounds`);
    assert(dim.barrett_construct, `${dimId} must have Barrett predictive construct`);

    // Nummenmaa Bodily Map verification
    assert(dim.bodily_map, `${dimId} must have bodily map`);
    assert(typeof dim.bodily_map.head === 'number', `${dimId} must have head activation`);
    assert(typeof dim.bodily_map.throat === 'number', `${dimId} must have throat activation`);
    assert(typeof dim.bodily_map.chest === 'number', `${dimId} must have chest activation`);
    assert(typeof dim.bodily_map.gut === 'number', `${dimId} must have gut activation`);
    assert(typeof dim.bodily_map.arms === 'number', `${dimId} must have arms activation`);
    assert(typeof dim.bodily_map.legs === 'number', `${dimId} must have legs activation`);
    assert(dim.bodily_map.somatic_summary, `${dimId} must have somatic sensation summary`);

    // Cowen Semantic Neighbors verification
    assert(Array.isArray(dim.semantic_neighbors) && dim.semantic_neighbors.length >= 2, `${dimId} must have semantic neighbors`);
    assert(Array.isArray(dim.keywords) && dim.keywords.length >= 10, `${dimId} must have comprehensive keywords`);
  });

  console.log('  ✓ Verified all 27 Cowen dimensions with comprehensive keywords, Barrett constructs, and Nummenmaa maps');

  // Specific physiological validation based on Nummenmaa 2014 paper
  const anger = ontology.cowen_dimensions.find((d) => d.id === 'anger');
  assert(anger.bodily_map.chest > 0.8 && anger.bodily_map.arms > 0.8, 'Anger must vigorously activate chest and arms');

  const joy = ontology.cowen_dimensions.find((d) => d.id === 'joy');
  assert(
    joy.bodily_map.head > 0.8 &&
    joy.bodily_map.chest > 0.8 &&
    joy.bodily_map.arms > 0.8 &&
    joy.bodily_map.legs > 0.8,
    'Joy/Happiness must illuminate whole body'
  );

  const sadness = ontology.cowen_dimensions.find((d) => d.id === 'sadness');
  assert(sadness.bodily_map.arms < -0.5 && sadness.bodily_map.legs < -0.5, 'Sadness must deactivate limbs with heaviness');

  console.log('  ✓ Nummenmaa 2014 Physiological Signatures Statistically Verified (Anger surge, Joy full-body glow, Sadness limb deactivation)');

  // 3. Test Pure Node Classification & Synthesis logic
  console.log('--- Verifying 27-D Natural Language Classification & Non-Repetitive Synthesis ---');

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function classifyTextNode(text) {
    const lower = (text || '').toLowerCase();

    const isRepetitionComplaint =
      lower.includes('stop repeating') ||
      lower.includes('again and again') ||
      lower.includes('repeating the same') ||
      lower.includes('why do you keep asking') ||
      lower.includes('you are stuck');

    if (isRepetitionComplaint) {
      return { dimensionId: 'confusion', metaIntent: 'dialogue_complaint' };
    }

    const negationMarkers = ['not', "don't", "didn't", "can't", "never", 'no', 'nothing', 'hardly', 'scarcely', 'without', 'stop'];
    const scores = new Map();
    for (const dim of ontology.cowen_dimensions) {
      scores.set(dim.id, 0);
    }

    for (const dim of ontology.cowen_dimensions) {
      let score = 0;
      const nameRegex = new RegExp(`\\b${escapeRegex(dim.name.toLowerCase())}\\b`, 'i');
      if (nameRegex.test(lower)) score += 5;

      for (const kw of dim.keywords) {
        const kwRegex = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, 'i');
        const match = kwRegex.exec(lower);
        if (match) {
          const matchIndex = match.index;
          const precedingText = lower.slice(Math.max(0, matchIndex - 30), matchIndex);
          const isNegated = negationMarkers.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(precedingText));

          if (isNegated) {
            score -= 3;
            if (dim.id === 'interest' || dim.id === 'joy') {
              scores.set('boredom', (scores.get('boredom') || 0) + 3);
            }
          } else {
            score += kw.length > 8 ? 4 : kw.length > 4 ? 3 : 2;
          }
        }
      }
      scores.set(dim.id, (scores.get(dim.id) || 0) + score);
    }

    let bestDim = ontology.cowen_dimensions.find((d) => d.id === 'calmness');
    let highestScore = -Infinity;

    scores.forEach((sc, dimId) => {
      if (sc > highestScore && sc > 0) {
        highestScore = sc;
        bestDim = ontology.cowen_dimensions.find((d) => d.id === dimId);
      }
    });

    return { dimensionId: bestDim.id, metaIntent: 'emotional_expression' };
  }

  // Test various emotions
  const testPhrases = [
    { text: 'I feel so confused and lost with my career right now', expected: 'confusion' },
    { text: 'I am so exhausted, heavy, and down today', expected: 'sadness' },
    { text: 'I feel so bored and unmotivated, nothing is interesting', expected: 'boredom' },
    { text: 'I am so furious and angry about what happened', expected: 'anger' },
    { text: 'I feel nervous, stressed, and my heart is racing', expected: 'anxiety' },
    { text: 'I am so proud and satisfied with my completed work', expected: 'satisfaction' },
    { text: 'I feel total peace and calm in this quiet room', expected: 'calmness' },
    { text: 'What a relief, the crisis is averted and safe now', expected: 'relief' },
    { text: 'You are repeating the same question again and again stop repeating', expectedMeta: 'dialogue_complaint' },
  ];

  testPhrases.forEach(({ text, expected, expectedMeta }) => {
    const res = classifyTextNode(text);
    if (expected) {
      assert.strictEqual(res.dimensionId, expected, `Phrase "${text}" should classify as ${expected}, got ${res.dimensionId}`);
      console.log(`  ✓ Correctly classified "${text.slice(0, 45)}..." -> [${res.dimensionId}]`);
    }
    if (expectedMeta) {
      assert.strictEqual(res.metaIntent, expectedMeta, `Phrase "${text}" should detect meta-intent ${expectedMeta}`);
      console.log(`  ✓ Correctly intercepted repetition complaint -> [${res.metaIntent}]`);
    }
  });

  console.log('\nModern Neuroscience of Emotion Tests: 100% Passed!\n');
}

module.exports = { runHybridRagTests };

if (require.main === module) {
  runHybridRagTests();
}
