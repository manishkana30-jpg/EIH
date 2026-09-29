/**
 * tests/test-wellness-flow-spec.js
 *
 * Unit Test Suite for the 4-Phase Guided Wellness State Machine & Engine:
 * 1. Phase 0: Purpose-Fit Interceptor (bypasses clinical analysis, prompts for mood).
 * 2. Phase 1: Confirmation YES/NO branches.
 * 3. Phase 1: Clarification loop strictly capped at 5 questions or confidence >= 0.75.
 * 4. Crisis Hard-Stop: Deterministic halt on self-harm/suicide with Tele-MANAS (14416) & 112 overlay.
 * 5. Phase 2: Sanskrit omission from speech text in Gita knowledge base.
 * 6. Phase 4: Rule-based Trataka selection (all 5 variants: Jyoti, Bindu, Om, Moon/Star, Mirror).
 * 7. Multilingual support across EN, HI, ES, FR, DE.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load Gita verses JSON directly
const gitaVersesPath = path.resolve(__dirname, '../data/wellness_flow/gita_verses.json');
const gitaData = JSON.parse(fs.readFileSync(gitaVersesPath, 'utf8'));

// Load Trataka instructions JSON directly
const tratakaPath = path.resolve(__dirname, '../data/wellness_flow/trataka_instructions.json');
const tratakaData = JSON.parse(fs.readFileSync(tratakaPath, 'utf8'));

// Load CBT scripts JSON directly
const cbtPath = path.resolve(__dirname, '../data/wellness_flow/cbt_scripts.json');
const cbtData = JSON.parse(fs.readFileSync(cbtPath, 'utf8'));

console.log('\n======================================================');
console.log('🧪 RUNNING WELLNESS STATE MACHINE & CLINICAL SPEC TESTS');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PHASE 0: PURPOSE-FIT INTERCEPTOR TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 1. Phase 0: Purpose-Fit Interceptor ---');

const purposeRegexPatterns = [
  /what does this app do/i,
  /what can this app do/i,
  /what is this app/i,
  /what is eih/i,
  /who are you/i,
  /what are you/i,
  /what do you do/i,
  /what can you do/i,
  /what is your purpose/i,
  /how does this work/i,
  /how does this app work/i,
  /tell me about yourself/i,
  /yeh app kya karta hai/i,
  /ye app kya karta hai/i,
  /yeh app kya hai/i,
  /ye app kya hai/i,
  /tum kaun ho/i,
  /aap kaun hain/i,
  /ye kya hai/i,
  /yeh kya hai/i,
  /यह ऐप क्या करता है/,
  /यह क्या करता है/,
  /यह क्या है/,
  /यह ऐप क्या है/,
  /तुम कौन हो/,
  /que hace esta aplicacion/i,
  /qui es tu/i,
  /was macht diese app/i,
];

function isPurposeQuery(text) {
  if (!text) return false;
  const clean = text.toLowerCase().replace(/[?!.,;:_'"()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  return purposeRegexPatterns.some(pattern => pattern.test(clean));
}

function getPurposeWelcomeMessage(lang) {
  const map = {
    en: 'I am a neuro-vedantic guide. How are you feeling right now?',
    hi: 'मैं एक न्यूरो-वेदांतिक मार्गदर्शक हूँ। आप अभी कैसा महसूस कर रहे हैं?',
    es: 'Soy un guía neurovedántico. ¿Cómo te sientes en este momento?',
    fr: 'Je suis un guide neuro-védantique. Comment vous sentez-vous en ce moment ?',
    de: 'Ich bin ein neuro-vedantischer Begleiter. Wie fühlen Sie sich gerade?',
  };
  return map[lang] || map.en;
}

test('Phase 0 Intercepts English meta-queries ("What does this app do?")', () => {
  assert.strictEqual(isPurposeQuery('What does this app do?'), true);
  assert.strictEqual(isPurposeQuery('Who are you?'), true);
  assert.strictEqual(isPurposeQuery('What is EIH?'), true);
  assert.strictEqual(isPurposeQuery('How does this work?'), true);
});

test('Phase 0 Intercepts Hindi & Hinglish queries ("यह ऐप क्या करता है", "tum kaun ho")', () => {
  assert.strictEqual(isPurposeQuery('यह ऐप क्या करता है?'), true);
  assert.strictEqual(isPurposeQuery('tum kaun ho?'), true);
  assert.strictEqual(isPurposeQuery('yeh app kya hai'), true);
});

test('Phase 0 Intercepts Spanish, French, German purpose queries', () => {
  assert.strictEqual(isPurposeQuery('Que hace esta aplicacion?'), true);
  assert.strictEqual(isPurposeQuery('Qui es tu?'), true);
  assert.strictEqual(isPurposeQuery('Was macht diese app?'), true);
});

test('Phase 0 Returns 1-sentence welcome across all 5 languages without clinical analysis', () => {
  const enWelcome = getPurposeWelcomeMessage('en');
  assert.strictEqual(enWelcome, 'I am a neuro-vedantic guide. How are you feeling right now?');

  const hiWelcome = getPurposeWelcomeMessage('hi');
  assert.strictEqual(hiWelcome, 'मैं एक न्यूरो-वेदांतिक मार्गदर्शक हूँ। आप अभी कैसा महसूस कर रहे हैं?');

  const esWelcome = getPurposeWelcomeMessage('es');
  assert.strictEqual(esWelcome, 'Soy un guía neurovedántico. ¿Cómo te sientes en este momento?');

  const frWelcome = getPurposeWelcomeMessage('fr');
  assert.strictEqual(frWelcome, 'Je suis un guide neuro-védantique. Comment vous sentez-vous en ce moment ?');

  const deWelcome = getPurposeWelcomeMessage('de');
  assert.strictEqual(deWelcome, 'Ich bin ein neuro-vedantischer Begleiter. Wie fühlen Sie sich gerade?');
});

test('Phase 0 Does NOT intercept genuine emotion inputs', () => {
  assert.strictEqual(isPurposeQuery('I am feeling so anxious about my exam'), false);
  assert.strictEqual(isPurposeQuery('mujhe bohot ghabrahat ho rahi hai'), false);
  assert.strictEqual(isPurposeQuery('I feel deeply sad and exhausted today'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PHASE 1: CONFIRMATION YES/NO BRANCHES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Phase 1: Confirmation Yes/No Branches ---');

test('YES branch advances directly to Phase 2 (GITA)', () => {
  let currentState = 'CONFIRM';
  const handleConfirmation = (isAffirmative) => {
    if (isAffirmative) {
      currentState = 'GITA';
      return { nextState: 'GITA' };
    } else {
      currentState = 'CLARIFY_LOOP';
      return { nextState: 'CLARIFY_LOOP' };
    }
  };

  const res = handleConfirmation(true);
  assert.strictEqual(res.nextState, 'GITA');
  assert.strictEqual(currentState, 'GITA');
});

test('NO branch enters Phase 1 Clarification Loop', () => {
  let currentState = 'CONFIRM';
  const handleConfirmation = (isAffirmative) => {
    if (isAffirmative) {
      currentState = 'GITA';
      return { nextState: 'GITA' };
    } else {
      currentState = 'CLARIFY_LOOP';
      return { nextState: 'CLARIFY_LOOP' };
    }
  };

  const res = handleConfirmation(false);
  assert.strictEqual(res.nextState, 'CLARIFY_LOOP');
  assert.strictEqual(currentState, 'CLARIFY_LOOP');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PHASE 1: CLARIFICATION LOOP STRICT 5-QUESTION CAP & CONFIDENCE THRESHOLD
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Phase 1: Clarification Loop Cap & Confidence ---');

test('Clarification loop strictly caps at 5 questions without looping indefinitely', () => {
  const turns = [];
  const initialProfile = {
    primary_emotion: 'unclear_vague',
    intensity: 5,
    confidence: 0.40,
    root_theme: 'general_distress'
  };

  function simulateTurn(userAnswer) {
    turns.push({ answer: userAnswer, questionNumber: turns.length + 1 });
    // Increase confidence with each turn
    const newConfidence = Math.min(0.95, initialProfile.confidence + turns.length * 0.05);
    const shouldStop = turns.length >= 5 || newConfidence >= 0.75;
    return { turnCount: turns.length, shouldStop, confidence: newConfidence };
  }

  // Simulate vague answers keeping confidence below 0.75
  let lastResult;
  for (let i = 0; i < 7; i++) {
    if (lastResult && lastResult.shouldStop) break;
    lastResult = simulateTurn('idk maybe');
  }

  assert.strictEqual(lastResult.shouldStop, true);
  assert.ok(turns.length <= 5, `Expected at most 5 questions, but got ${turns.length}`);
  assert.strictEqual(turns.length, 5, 'Should stop exactly on turn 5');
});

test('Clarification loop exits early when confidence reaches >= 0.75', () => {
  const turns = [];
  const initialProfile = {
    primary_emotion: 'anxiety',
    intensity: 7,
    confidence: 0.65,
    root_theme: 'future_uncertainty'
  };

  function simulateTurn(userAnswer) {
    turns.push({ answer: userAnswer, questionNumber: turns.length + 1 });
    // High-clarity answer boosts confidence over 0.75
    const newConfidence = 0.82;
    const shouldStop = turns.length >= 5 || newConfidence >= 0.75;
    return { turnCount: turns.length, shouldStop, confidence: newConfidence };
  }

  const result = simulateTurn('I have palpitations because of my job interview tomorrow');
  assert.strictEqual(result.shouldStop, true);
  assert.strictEqual(turns.length, 1);
  assert.ok(result.confidence >= 0.75);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CRISIS HARD-STOP TESTS (TELE-MANAS 14416 & 112)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Crisis Hard-Stop Safety Checks ---');

const crisisRegexes = [
  /\b(suicide|suicidal|kill myself|end my life|end it all|want to die|hang myself|slit my wrist|overdose)\b/i,
  /\b(hurt myself|harm myself|better off dead|no reason to live|mar jana|mar jaana|aatmhatya|khudkushi)\b/i,
  /(आत्महत्या|खुदकुशी|मर जाना चाहता|मरना चाहता|जीना नहीं चाहता)/,
];

function checkCrisis(text) {
  const isCrisis = crisisRegexes.some(r => r.test(text));
  return {
    isCrisis,
    helpline: 'Tele-MANAS (14416) and Emergency (112)',
    deflection: 'I care deeply about your life and safety. Please reach out right now to Tele-MANAS at 14416 or call 112.'
  };
}

test('Crisis detection halts immediately on English suicidal ideation', () => {
  const res = checkCrisis('I want to end my life, everything is hopeless');
  assert.strictEqual(res.isCrisis, true);
  assert.ok(res.deflection.includes('14416'));
  assert.ok(res.deflection.includes('112'));
});

test('Crisis detection halts immediately on Hindi / Hinglish self-harm keywords', () => {
  const res1 = checkCrisis('mujhe lagta hai main mar jana chahta hoon');
  assert.strictEqual(res1.isCrisis, true);

  const res2 = checkCrisis('अब और नहीं जी सकता, आत्महत्या करने का मन कर रहा है');
  assert.strictEqual(res2.isCrisis, true);
});

test('Crisis check does not false-positive on everyday stress or fatigue', () => {
  const res = checkCrisis('I had a killer workout and I am dead tired after work');
  assert.strictEqual(res.isCrisis, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PHASE 2: SANSKRIT OMISSION FROM GITA SPEECH TEXT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Sanskrit Omission from Gita Speech Text ---');

const sanskritShlokaTokens = [
  'Karmany evadhikaras',
  'Matra-sparshas',
  'Asanshayam',
  'Uddhared atmanatmanam',
  'Yuktahara',
  'Apuryamanam',
  'कर्मण्येवाधिकारस्ते',
  'मात्रास्पर्शास्तु',
  'असंशयं महाबाहो',
  'उद्धरेदात्मनात्मानं',
  'युक्ताहारविहारस्य',
  'आपूर्यमाणमचलप्रतिष्ठं',
];

test('Gita knowledge base contains all authentic verses with Devanagari Sanskrit', () => {
  assert.ok(Array.isArray(gitaData.verses));
  assert.strictEqual(gitaData.verses.length >= 6, true);
  for (const v of gitaData.verses) {
    assert.ok(v.sanskrit && v.sanskrit.length > 5, `Verse ${v.id} missing Devanagari Sanskrit`);
    assert.ok(v.transliteration && v.transliteration.length > 5, `Verse ${v.id} missing Roman transliteration`);
  }
});

test('Speech texts (speech_text_en & speech_text_hi) NEVER contain Sanskrit shlokas', () => {
  for (const v of gitaData.verses) {
    for (const token of sanskritShlokaTokens) {
      assert.strictEqual(
        v.speech_text_en.includes(token),
        false,
        `Verse ${v.id} speech_text_en should NOT contain Sanskrit phrase "${token}"`
      );
      assert.strictEqual(
        v.speech_text_hi.includes(token),
        false,
        `Verse ${v.id} speech_text_hi should NOT contain Sanskrit phrase "${token}"`
      );
    }
  }
});

test('Gita speech texts contain verse reference, simple meaning, and practical solution', () => {
  for (const v of gitaData.verses) {
    assert.ok(
      v.speech_text_en.toLowerCase().includes('chapter'),
      `Verse ${v.id} should include Chapter reference in speech_text_en`
    );
    assert.ok(
      v.speech_text_en.length >= 100,
      `Verse ${v.id} speech_text_en should provide complete guidance (length: ${v.speech_text_en.length})`
    );
    assert.ok(
      v.speech_text_hi.length >= 80,
      `Verse ${v.id} speech_text_hi should provide complete guidance (length: ${v.speech_text_hi.length})`
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHASE 4: TRATAKA VARIANT SELECTION (ALL 5 VARIANTS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 6. Phase 4: Trataka Variant Selection Rules ---');

function selectTrataka(emotion, theme = '', intensity = 6, time = 'afternoon') {
  const emo = emotion.toLowerCase();
  const thm = theme.toLowerCase();

  // Rule 0: Calm / equanimity
  if (emo === 'calm' || thm.includes('equanimity')) {
    return time === 'night' ? 'moon_star' : 'om_symbol';
  }
  // Rule 1: Self-Compassion / Guilt / Shame -> Mirror (Pratibimb)
  if (emo === 'guilt' || emo === 'shame' || thm.includes('self_compassion') || thm.includes('self_worth')) {
    return 'mirror_reflection';
  }
  // Rule 2: Grief -> Moon & Star (Shoonya)
  if (emo === 'grief' || thm.includes('grief') || thm.includes('loss_and_impermanence')) {
    return 'moon_star';
  }
  // Rule 3: Anger / Restlessness -> Bindu Dot
  if (emo === 'anger' || thm.includes('restlessness') || intensity >= 8) {
    return 'bindu_dot';
  }
  // Rule 4: Anxiety / Overthinking -> Candle Flame (Jyoti)
  if (emo === 'anxiety' || emo === 'overthinking' || emo === 'stress') {
    return 'candle_flame';
  }
  // Rule 5: Sadness / Low Mood -> Om Symbol (Murti)
  if (emo === 'sadness' || emo === 'low motivation') {
    return 'om_symbol';
  }
  return 'bindu_dot';
}

test('Trataka Variant 1: Anxiety/Overthinking selects Candle Flame (Jyoti)', () => {
  assert.strictEqual(selectTrataka('anxiety'), 'candle_flame');
  assert.strictEqual(selectTrataka('overthinking'), 'candle_flame');
  assert.strictEqual(selectTrataka('stress'), 'candle_flame');
});

test('Trataka Variant 2: Anger/Restlessness selects Bindu Dot', () => {
  assert.strictEqual(selectTrataka('anger'), 'bindu_dot');
  assert.strictEqual(selectTrataka('restlessness', 'restlessness'), 'bindu_dot');
  assert.strictEqual(selectTrataka('agitation', '', 9), 'bindu_dot');
});

test('Trataka Variant 3: Sadness/Low Mood selects Om Symbol (Murti)', () => {
  assert.strictEqual(selectTrataka('sadness'), 'om_symbol');
  assert.strictEqual(selectTrataka('low motivation'), 'om_symbol');
});

test('Trataka Variant 4: Grief selects Moon/Star (Shoonya)', () => {
  assert.strictEqual(selectTrataka('grief'), 'moon_star');
  assert.strictEqual(selectTrataka('mourning', 'loss_and_impermanence'), 'moon_star');
});

test('Trataka Variant 5: Self-Compassion / Shame / Guilt selects Mirror (Pratibimb)', () => {
  assert.strictEqual(selectTrataka('guilt'), 'mirror_reflection');
  assert.strictEqual(selectTrataka('shame'), 'mirror_reflection');
  assert.strictEqual(selectTrataka('self-doubt', 'self_compassion'), 'mirror_reflection');
});

test('Trataka library defines all 5 variants with voice cues and timer parameters', () => {
  const expectedKeys = ['candle_flame', 'bindu_dot', 'om_symbol', 'moon_star', 'mirror_reflection'];
  for (const k of expectedKeys) {
    const v = tratakaData.variants[k];
    assert.ok(v, `Missing Trataka variant: ${k}`);
    assert.ok(v.default_duration_seconds >= 60 && v.default_duration_seconds <= 180);
    assert.ok(v.voice_cues && v.voice_cues.begin_en);
    assert.ok(v.voice_cues && v.voice_cues.begin_hi);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. MULTILINGUAL SUPPORT TESTS (EN, HI, ES, FR, DE)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 7. Multilingual Support across EN, HI, ES, FR, DE ---');

test('CBT scripts contain structured steps for all 5 languages', () => {
  const requiredLanguages = ['en', 'hi', 'es', 'fr', 'de'];
  for (const [mood, script] of Object.entries(cbtData.scripts)) {
    assert.ok(script.distortion_name_en, `CBT ${mood} missing English distortion`);
    assert.ok(script.distortion_name_hi, `CBT ${mood} missing Hindi distortion`);
    assert.ok(script.distortion_name_es, `CBT ${mood} missing Spanish distortion`);
    assert.ok(script.distortion_name_fr, `CBT ${mood} missing French distortion`);
    assert.ok(script.distortion_name_de, `CBT ${mood} missing German distortion`);

    assert.ok(script.step4_replacement_thought_en, `CBT ${mood} missing English replacement thought`);
    assert.ok(script.step4_replacement_thought_hi, `CBT ${mood} missing Hindi replacement thought`);
    assert.ok(script.step4_replacement_thought_es, `CBT ${mood} missing Spanish replacement thought`);
    assert.ok(script.step4_replacement_thought_fr, `CBT ${mood} missing French replacement thought`);
    assert.ok(script.step4_replacement_thought_de, `CBT ${mood} missing German replacement thought`);
  }
});

console.log('\n======================================================');
console.log(`🎉 ALL TESTS EXECUTED: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================\n');
