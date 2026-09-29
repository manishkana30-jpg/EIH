/**
 * Automated Verification Suite: CBT GPS & Multilingual Localization Engine
 * Tests:
 * 1. 4-Phase Guided Wellness State Machine CBT script resolution across all supported GPS languages (hi, es, fr, de, en)
 * 2. Transition speech & mini-flow step questions/actions dynamic translation
 * 3. Sanctuary Session Chat Card 3 CBT reframe resolution via resolveActiveCbtReframe
 * 4. Karaoke Tokenizer parseTherapeuticStages for Card 3 CBT titles, badges, and fallback speech
 */

const assert = require('assert');

// 1. Test cbt_scripts.json presence and validity
const cbtData = require('../data/wellness_flow/cbt_scripts.json');
assert(cbtData.scripts, 'cbt_scripts.json must contain scripts');

const testMoods = ['anxiety', 'sadness', 'anger', 'stress', 'overthinking', 'guilt', 'calm'];
const supportedLangs = ['hi', 'es', 'fr', 'de', 'en'];

console.log('--- TEST SUITE: CBT JSON Script Translations ---');
for (const mood of testMoods) {
  const script = cbtData.scripts[mood];
  assert(script, `Script must exist for mood: ${mood}`);

  // Distortion Name
  assert(script.distortion_name_en, `${mood} must have distortion_name_en`);
  assert(script.distortion_name_hi, `${mood} must have distortion_name_hi`);
  assert(script.distortion_name_es, `${mood} must have distortion_name_es`);
  assert(script.distortion_name_fr, `${mood} must have distortion_name_fr`);
  assert(script.distortion_name_de, `${mood} must have distortion_name_de`);

  // Step 1 Prompt
  assert(script.step1_prompt_en, `${mood} must have step1_prompt_en`);
  assert(script.step1_prompt_hi, `${mood} must have step1_prompt_hi`);
  assert(script.step1_prompt_es, `${mood} must have step1_prompt_es`);
  assert(script.step1_prompt_fr, `${mood} must have step1_prompt_fr`);
  assert(script.step1_prompt_de, `${mood} must have step1_prompt_de`);

  // Step 2 Name
  assert(script.step2_name_en, `${mood} must have step2_name_en`);
  assert(script.step2_name_hi, `${mood} must have step2_name_hi`);
  assert(script.step2_name_es, `${mood} must have step2_name_es`);
  assert(script.step2_name_fr, `${mood} must have step2_name_fr`);
  assert(script.step2_name_de, `${mood} must have step2_name_de`);

  // Step 3 Challenge Questions (arrays)
  assert(Array.isArray(script.step3_challenge_questions_en) && script.step3_challenge_questions_en.length > 0);
  assert(Array.isArray(script.step3_challenge_questions_hi) && script.step3_challenge_questions_hi.length > 0);
  assert(Array.isArray(script.step3_challenge_questions_es) && script.step3_challenge_questions_es.length > 0);
  assert(Array.isArray(script.step3_challenge_questions_fr) && script.step3_challenge_questions_fr.length > 0);
  assert(Array.isArray(script.step3_challenge_questions_de) && script.step3_challenge_questions_de.length > 0);

  // Step 4 Replacement Thought & Action Step
  assert(script.step4_replacement_thought_en);
  assert(script.step4_replacement_thought_hi);
  assert(script.step4_replacement_thought_es);
  assert(script.step4_replacement_thought_fr);
  assert(script.step4_replacement_thought_de);

  assert(script.step4_action_step_en);
  assert(script.step4_action_step_hi);
  assert(script.step4_action_step_es);
  assert(script.step4_action_step_fr);
  assert(script.step4_action_step_de);

  console.log(`[PASS] Mood "${mood}" has complete 5-language CBT script protocols`);
}

// 2. Test Clinical Localization Interventions
console.log('\n--- TEST SUITE: Clinical Localization Interventions ---');
const clinicalLoc = require('../lib/i18n/clinical-localization.ts');
const { getLocalizedClinicalIntervention } = clinicalLoc;

const conditions = ['acute_anxiety', 'burnout_stress', 'existential_dread', 'overthinking'];
for (const cond of conditions) {
  for (const lang of supportedLangs) {
    const intervention = getLocalizedClinicalIntervention(cond, lang);
    assert(intervention, `Intervention must exist for ${cond} in ${lang}`);
    assert(intervention.cbt_reframing, `cbt_reframing must exist for ${cond} in ${lang}`);
    assert(intervention.cbt_reframing.length > 10, `cbt_reframing must be substantive for ${cond} in ${lang}`);
    if (lang === 'hi') {
      assert(/[\u0900-\u097F]/.test(intervention.cbt_reframing), `Hindi cbt_reframing must contain Devanagari`);
    }
    console.log(`[PASS] Condition "${cond}" in "${lang}" has localized CBT reframe (${intervention.cbt_reframing.substring(0, 30)}...)`);
  }
}

// 3. Test resolveActiveCbtReframe in session-utils
console.log('\n--- TEST SUITE: resolveActiveCbtReframe with GPS/Locale ---');
const sessionUtils = require('../app/(session)/utils/session-utils.ts');
const { resolveActiveCbtReframe } = sessionUtils;

const sampleTelemetry = {
  dominant_emotion: "Anxiety",
  polyvagal_state: "Sympathetic",
  cbt_distortion: "Catastrophizing",
  percentages: { Anxiety: 85 },
  strategy: "Box Breathing"
};

// Hindi GPS
const reframeHi = resolveActiveCbtReframe([], sampleTelemetry, 'hi');
assert(reframeHi, 'Should resolve Hindi reframe');
assert(/[\u0900-\u097F]/.test(reframeHi), `Hindi reframe must contain Devanagari: ${reframeHi}`);
console.log('[PASS] resolveActiveCbtReframe(hi) -> Devanagari reframe:', reframeHi.substring(0, 50));

// Spanish GPS
const reframeEs = resolveActiveCbtReframe([], sampleTelemetry, 'es');
assert(reframeEs, 'Should resolve Spanish reframe');
assert(/\b(mente|cat[aá]strof|real|evidencias|objetiv)/i.test(reframeEs), `Spanish reframe should contain Spanish words: ${reframeEs}`);
console.log('[PASS] resolveActiveCbtReframe(es) -> Spanish reframe:', reframeEs.substring(0, 50));

// French GPS
const reframeFr = resolveActiveCbtReframe([], sampleTelemetry, 'fr');
assert(reframeFr, 'Should resolve French reframe');
assert(/\b(pens[eé]e|dramatis|r[eé]alit[eé]|faits|objective|tendance)/i.test(reframeFr), `French reframe should contain French words: ${reframeFr}`);
console.log('[PASS] resolveActiveCbtReframe(fr) -> French reframe:', reframeFr.substring(0, 50));

// German GPS
const reframeDe = resolveActiveCbtReframe([], sampleTelemetry, 'de');
assert(reframeDe, 'Should resolve German reframe');
assert(/\b(gedanken|katastroph|realit[aä]t|fakten|objektiv)/i.test(reframeDe), `German reframe should contain German words: ${reframeDe}`);
console.log('[PASS] resolveActiveCbtReframe(de) -> German reframe:', reframeDe.substring(0, 50));

// English GPS
const reframeEn = resolveActiveCbtReframe([], sampleTelemetry, 'en');
assert(reframeEn, 'Should resolve English reframe');
console.log('[PASS] resolveActiveCbtReframe(en) -> English reframe:', reframeEn.substring(0, 50));

// 4. Test Wellness State Machine Phase 3 CBT Dynamic Translations
console.log('\n--- TEST SUITE: Wellness State Machine Phase 3 CBT Dynamic Translations ---');
const { wellnessStateMachine } = require('../lib/wellness-flow/wellness-state-machine.ts');

const script = wellnessStateMachine.getCbtScript();

// Test Hindi state machine CBT
wellnessStateMachine.setLanguage('hi');
assert.strictEqual(wellnessStateMachine.getLanguage(), 'hi');
const step1Hi = wellnessStateMachine.getCbtStep1Prompt(script);
const step2Hi = wellnessStateMachine.getCbtStep2Name(script);
const step3Hi = wellnessStateMachine.getCbtStep3ChallengeQuestions(script);
const step4Hi = wellnessStateMachine.getCbtStep4ReplacementThought(script);
const step4ActHi = wellnessStateMachine.getCbtStep4ActionStep(script);
assert(/[\u0900-\u097F]/.test(step1Hi), 'Hindi Step 1 must have Devanagari');
assert(/[\u0900-\u097F]/.test(step2Hi), 'Hindi Step 2 must have Devanagari');
assert(/[\u0900-\u097F]/.test(step3Hi[0]), 'Hindi Step 3 must have Devanagari');
assert(/[\u0900-\u097F]/.test(step4Hi), 'Hindi Step 4 must have Devanagari');
assert(/[\u0900-\u097F]/.test(step4ActHi), 'Hindi Action Step must have Devanagari');
console.log('[PASS] Wellness State Machine: Complete Hindi Devanagari CBT Mini-Flow');

// Test Spanish state machine CBT
wellnessStateMachine.setLanguage('es');
assert.strictEqual(wellnessStateMachine.getLanguage(), 'es');
const step1Es = wellnessStateMachine.getCbtStep1Prompt(script);
const step2Es = wellnessStateMachine.getCbtStep2Name(script);
const step3Es = wellnessStateMachine.getCbtStep3ChallengeQuestions(script);
assert(/\b(pensamiento|peor|mente)/i.test(step1Es), `Spanish Step 1 check: ${step1Es}`);
assert(/\b(Catastrof|Sobregeneraliz|Filtro|Pensamiento)/i.test(step2Es), `Spanish Step 2 check: ${step2Es}`);
assert(step3Es.length > 0, 'Spanish Step 3 questions must exist');
console.log('[PASS] Wellness State Machine: Complete Spanish CBT Mini-Flow');

// Test French state machine CBT
wellnessStateMachine.setLanguage('fr');
assert.strictEqual(wellnessStateMachine.getLanguage(), 'fr');
const step1Fr = wellnessStateMachine.getCbtStep1Prompt(script);
const step2Fr = wellnessStateMachine.getCbtStep2Name(script);
assert(/\b(pens[eé]e|pire|esprit)/i.test(step1Fr), `French Step 1 check: ${step1Fr}`);
assert(/\b(Catastroph|Dramatis|G[eé]n[eé]ralis|Filtre|Pens[eé]e)/i.test(step2Fr), `French Step 2 check: ${step2Fr}`);
console.log('[PASS] Wellness State Machine: Complete French CBT Mini-Flow');

// Test German state machine CBT
wellnessStateMachine.setLanguage('de');
assert.strictEqual(wellnessStateMachine.getLanguage(), 'de');
const step1De = wellnessStateMachine.getCbtStep1Prompt(script);
const step2De = wellnessStateMachine.getCbtStep2Name(script);
assert(/\b(Gedanke|Schlimmste|Kopf)/i.test(step1De), `German Step 1 check: ${step1De}`);
assert(/\b(Katastroph|Verallgemeiner|Filter|Alles-oder-Nichts)/i.test(step2De), `German Step 2 check: ${step2De}`);
console.log('[PASS] Wellness State Machine: Complete German CBT Mini-Flow');

// Test English state machine CBT
wellnessStateMachine.setLanguage('en');
assert.strictEqual(wellnessStateMachine.getLanguage(), 'en');
const step1En = wellnessStateMachine.getCbtStep1Prompt(script);
const step2En = wellnessStateMachine.getCbtStep2Name(script);
assert(/\b(thought|worst|mind)/i.test(step1En), `English Step 1 check: ${step1En}`);
assert(/\b(Catastroph|Overgeneraliz|Filter|All-or-Nothing)/i.test(step2En), `English Step 2 check: ${step2En}`);
console.log('[PASS] Wellness State Machine: Complete English CBT Mini-Flow');

// 5. Test Karaoke Tokenizer parseTherapeuticStages for Stage 3 CBT
console.log('\n--- TEST SUITE: parseTherapeuticStages Card 3 CBT Localization ---');
const tokenizer = require('../lib/audio/karaoke-tokenizer.ts');
const { parseTherapeuticStages } = tokenizer;

// Sample structured Spanish message
const spanishMsg = `[GITA_SHLOKA]
BG 2.47
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
Karmanye vadhikaraste ma phaleshu kadachana.
Significado: Tienes derecho a realizar tu deber prescrito, pero no a los frutos de la acción.
[/GITA_SHLOKA]

**SUMMARY: Evaluación del Estado Emocional**
• Estado Emocional: Ansiedad Anticipatoria
• Severidad: Moderada | Simpático
• Carga Corporal: Opresión torácica
• Resumen Empático: Se observa tensión ante la incertidumbre.

**2. SABIDURÍA DEL BHAGAVAD GITA**
El Gita nos invita a centrarnos en la acción correcta aquí y ahora.

**3. NEUROCIENCIA CLÍNICA COGNITIVA (TCC)**
Reconozca la distorsión de magnificación. Examine la evidencia objetiva y practique respiraciones profundas.

**4. PROTOCOLO NEURO-OCULAR TRATAK**
Fije su mirada en un punto central para estabilizar el sistema nervioso.`;

const parsedEs = parseTherapeuticStages(spanishMsg, 'es-ES');
assert(parsedEs.isStructured, 'Spanish message should be parsed as structured');
const stage3Es = parsedEs.stages.find(s => s.stage === 3);
assert(stage3Es, 'Stage 3 CBT must be present');
assert.strictEqual(stage3Es.stageKey, 'cbt');
assert.strictEqual(stage3Es.title, 'Reestructuración Cognitiva y Somática', `Expected Spanish title, got: ${stage3Es.title}`);
assert(stage3Es.badge.includes('TCC'), `Expected TCC in badge, got: ${stage3Es.badge}`);
assert(stage3Es.speechText.includes('Reconozca la distorsión'), `Expected Spanish speechText, got: ${stage3Es.speechText}`);
console.log('[PASS] Spanish Card 3 CBT parsed accurately:', stage3Es.title, '| Badge:', stage3Es.badge);

// Sample structured French message
const frenchMsg = `[GITA_SHLOKA]
BG 2.47
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
Karmanye vadhikaraste ma phaleshu kadachana.
Signification: Vous avez le droit d'accomplir vos devoirs, mais pas d'en revendiquer les fruits.
[/GITA_SHLOKA]

**SUMMARY: Analyse de l'État Émotionnel**
• État Émotionnel: Anxiété aiguë
• Sévérité: Élevée | Sympathique

**2. SAGESSE DE LA BHAGAVAD GITA**
La Gita invite au discernement et à l'action désintéressée.

**3. NEUROSCIENCES CLINIQUES COGNITIVES (TCC)**
Identifiez les pensées catastrophiques et ancrez votre respiration.

**4. PROTOCOLE NEURO-OCULAIRE TRATAK**
Fixez un point central avec douceur.`;

const parsedFr = parseTherapeuticStages(frenchMsg, 'fr-FR');
assert(parsedFr.isStructured, 'French message should be parsed as structured');
const stage3Fr = parsedFr.stages.find(s => s.stage === 3);
assert(stage3Fr, 'Stage 3 CBT must be present');
assert.strictEqual(stage3Fr.title, 'Restructuration Cognitive et Somatique', `Expected French title, got: ${stage3Fr.title}`);
assert(stage3Fr.badge.includes('TCC'), `Expected TCC in badge, got: ${stage3Fr.badge}`);
console.log('[PASS] French Card 3 CBT parsed accurately:', stage3Fr.title, '| Badge:', stage3Fr.badge);

// Sample structured German message
const germanMsg = `[GITA_SHLOKA]
BG 2.47
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
Karmanye vadhikaraste ma phaleshu kadachana.
Bedeutung: Du hast ein Recht auf die Tat, aber niemals auf die Früchte.
[/GITA_SHLOKA]

**SUMMARY: Emotionale Belastungsanalyse**
• Erkannter Zustand: Akute Angst

**2. WEISHEIT DER BHAGAVAD GITA**
Die Gita lehrt Gelassenheit im Handeln.

**3. KLINISCHE KOGNITIVE NEUROWISSENSCHAFT (CBT)**
Erkennen Sie automatische Katastrophengedanken und regulieren Sie das Nervensystem.

**4. TRATAK NEURO-OKULARES PROTOKOLL**
Fixieren Sie einen ruhigen Punkt.`;

const parsedDe = parseTherapeuticStages(germanMsg, 'de-DE');
assert(parsedDe.isStructured, 'German message should be parsed as structured');
const stage3De = parsedDe.stages.find(s => s.stage === 3);
assert(stage3De, 'Stage 3 CBT must be present');
assert.strictEqual(stage3De.title, 'Kognitive Umstrukturierung und Somatik', `Expected German title, got: ${stage3De.title}`);
assert(stage3De.badge.includes('CBT'), `Expected CBT in badge, got: ${stage3De.badge}`);
console.log('[PASS] German Card 3 CBT parsed accurately:', stage3De.title, '| Badge:', stage3De.badge);

// 5. Test Dynamic & Self-Learned CBT Intervention Translations
console.log('\n--- TEST SUITE: Dynamic & Self-Learned CBT Interventions ---');
const sampleLearnedDoc = {
  id: 'learned_job_stress_and_anxiety',
  name: 'Learned: Job Stress And Anxiety Protocol',
  solutions: {
    cbt_reframing: 'Acknowledge this experience as a transient physiological signal. Notice thoughts without judgment.\n\n[Wikipedia Context] Evidence-based...',
    somatic_anchor: 'Drop shoulders away from ears, place one hand on the lower abdomen, and feel the solid floor underneath your feet for 30 seconds.',
    pranayama: 'Practice 4-4-4-4 Box Breathing or Nadi Shodhana for 3 minutes to restore autonomic balance.',
    micro_habit: 'Write down one single micro-task within your direct control right now and release long-term rumination.',
  }
};

// Hindi Dynamic Translation
const locHi = getLocalizedClinicalIntervention(sampleLearnedDoc.id, 'hi', sampleLearnedDoc);
assert(locHi, 'Must return localized intervention for learned doc in Hindi');
assert(/[\u0900-\u097F]/.test(locHi.cbt_reframing), `Hindi cbt_reframing must contain Devanagari: ${locHi.cbt_reframing}`);
assert(/[\u0900-\u097F]/.test(locHi.somatic_anchor), `Hindi somatic_anchor must contain Devanagari: ${locHi.somatic_anchor}`);
assert(/[\u0900-\u097F]/.test(locHi.pranayama), `Hindi pranayama must contain Devanagari: ${locHi.pranayama}`);
assert(!/Drop shoulders/i.test(locHi.somatic_anchor), 'Hindi somatic_anchor must NOT contain raw English');
console.log('[PASS] Dynamic Learned Condition (Hindi): Devanagari CBT reframe, anchor, and pranayama verified');

// Spanish Dynamic Translation
const locEs = getLocalizedClinicalIntervention(sampleLearnedDoc.id, 'es', sampleLearnedDoc);
assert(locEs, 'Must return localized intervention for learned doc in Spanish');
assert(/\b(Reconozca|fisiol[oó]gica|pensamientos)\b/i.test(locEs.cbt_reframing), `Spanish CBT reframe check failed: ${locEs.cbt_reframing}`);
assert(/\b(hombros|suelo|pies)\b/i.test(locEs.somatic_anchor), `Spanish somatic anchor check failed: ${locEs.somatic_anchor}`);
console.log('[PASS] Dynamic Learned Condition (Spanish): Translated CBT reframe and anchor verified');

// French Dynamic Translation
const locFr = getLocalizedClinicalIntervention(sampleLearnedDoc.id, 'fr', sampleLearnedDoc);
assert(locFr, 'Must return localized intervention for learned doc in French');
assert(/\b(Consid[eé]rez|physiologique|pens[eé]es)\b/i.test(locFr.cbt_reframing), `French CBT reframe check failed: ${locFr.cbt_reframing}`);
assert(/\b([eé]paules|sol|pieds)\b/i.test(locFr.somatic_anchor), `French somatic anchor check failed: ${locFr.somatic_anchor}`);
console.log('[PASS] Dynamic Learned Condition (French): Translated CBT reframe and anchor verified');

// German Dynamic Translation
const locDe = getLocalizedClinicalIntervention(sampleLearnedDoc.id, 'de', sampleLearnedDoc);
assert(locDe, 'Must return localized intervention for learned doc in German');
assert(/\b(Betrachten|physiologisches|Gedanken)\b/i.test(locDe.cbt_reframing), `German CBT reframe check failed: ${locDe.cbt_reframing}`);
assert(/\b(Schultern|Boden|F[uü][sß]en)\b/i.test(locDe.somatic_anchor), `German somatic anchor check failed: ${locDe.somatic_anchor}`);
console.log('[PASS] Dynamic Learned Condition (German): Translated CBT reframe and anchor verified');

console.log('\n=========================================');
console.log('✅ ALL CBT GPS TRANSLATION TESTS PASSED!');
console.log('=========================================');
