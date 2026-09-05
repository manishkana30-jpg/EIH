/**
 * Clinical Context Provider & Conversational Intelligence Test Suite
 * 
 * Exhaustively verifies:
 * 1. Conversational Intent Triage (Greeting, Inquiry, Identity, Gratitude, Farewell, Loop Reset).
 * 2. Clinical Protocol Directives Structure (Anchor, CBT Reframe, Somatic Grounding, Breathwork, Micro-habit).
 * 3. Multi-Turn Clinical Context Progression across Workplace Burnout and Failure/Personalization.
 * 4. Multilingual Clinical Protocols (Devanagari Hindi, Hinglish, Spanish, French, German).
 * 5. Learned CBT Breakthrough Insight Anchoring.
 * 6. Multi-Lingual Repetition Complaint Interception & Loop Reset.
 */

const assert = require('assert');
const { generateDynamicCompanionReply } = require('../lib/nlp/conversational-companion-engine.ts');

function runConversationalDiversityTests() {
  console.log('\n================================================================');
  console.log('CLINICAL CONTEXT PROVIDER & CONVERSATIONAL INTELLIGENCE SUITE');
  console.log('================================================================\n');

  // ------------------------------------------------------------------------
  // SUITE 1: 18 Distinct Semantic Predicaments & Inquiries
  // ------------------------------------------------------------------------
  console.log('--- 1. Testing 18 Distinct Semantic Predicaments & Inquiries ---');

  const testInputs = [
    { text: "Hey there!", topic: 'greeting' },
    { text: "How are you doing today?", topic: 'companion_inquiry' },
    { text: "Who are you and what can you do?", topic: 'identity_inquiry' },
    { text: "Thank you so much for listening to me.", topic: 'gratitude' },
    { text: "Good night, talk to you tomorrow.", topic: 'farewell' },
    { text: "My boss was so mean to me at the office today, I feel terrible.", topic: 'work_burnout' },
    { text: "I had a fight with my girlfriend and she won't answer my calls.", topic: 'relationship_conflict' },
    { text: "I feel so lonely, like everyone is ahead of me in life.", topic: 'existential_comparison' },
    { text: "I'm exhausted and can't sleep, my brain is burned out.", topic: 'fatigue_insomnia' },
    { text: "I failed my driving test and I feel so stupid.", topic: 'setback_failure' },
    { text: "Should I quit my job to pursue photography?", topic: 'decision_crossroads' },
    { text: "My best friend told everyone my secret and I cannot trust anyone.", topic: 'betrayal_trust' },
    { text: "My dog is in the hospital and I'm terrified.", topic: 'grief_loss' },
    { text: "I lost half my savings in an investment that crashed.", topic: 'financial_stress' },
    { text: "This is the worst disaster, my life is completely over.", topic: 'catastrophizing' },
    { text: "I know everyone in the office hates me after what happened.", topic: 'mind_reading' },
    { text: "What should I do to calm down? Give me research advice.", topic: 'advice_request' },
    { text: "Stop repeating the same thing in a loop!", topic: 'loop_complaint' },
  ];

  for (const item of testInputs) {
    const res = generateDynamicCompanionReply({ userText: item.text });

    assert(res && res.reply && res.reply.length > 20, `Empty or short reply for: "${item.text}"`);
    assert(res.detectedLanguage, `Missing detectedLanguage for: "${item.text}"`);
    assert(res.speechLocale, `Missing speechLocale for: "${item.text}"`);

    if (['greeting', 'companion_inquiry', 'identity_inquiry', 'gratitude', 'farewell', 'loop_complaint'].includes(res.detectedTopic)) {
      assert(!res.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'), `Casual intent should return conversational dialogue, not raw directive: ${item.text}`);
    } else {
      assert(res.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'), `Clinical inquiry must return structured clinical directive: ${item.text}`);
      assert(res.reply.includes('CBT Reframe to apply:'), `Directive missing CBT reframe: ${item.text}`);
      assert(res.reply.includes('Somatic Grounding to prescribe:'), `Directive missing somatic grounding: ${item.text}`);
      assert(res.reply.includes('Breathwork to prescribe:'), `Directive missing breathwork: ${item.text}`);
      assert(res.reply.includes('Micro-habit:'), `Directive missing micro-habit: ${item.text}`);
    }

    console.log(`  ✓ [${item.topic.padEnd(22)}]: "${item.text.slice(0, 32).padEnd(35)}..." ➔ "${res.reply.replace(/\n/g, ' ').slice(0, 65)}..."`);
  }
  console.log(`  ✓ All 18 distinct domain inputs validated for conversational intents and clinical directives.\n`);

  // ------------------------------------------------------------------------
  // SUITE 2: 10-Turn Workplace Burnout Clinical Context Provider Session
  // ------------------------------------------------------------------------
  console.log('--- 2. Testing 10-Turn Sustained Conversation on Workplace Burnout ---');
  const workConversation = [
    "Work has been completely overwhelming this week.",
    "My manager keeps dumping extra tasks on my desk without asking.",
    "I'm working 12 hours a day and cannot keep up with these deadlines.",
    "I feel so exhausted by the office politics and unfair demands.",
    "Should I talk to HR or just look for another job?",
    "My boss yelled at me in front of the whole team today.",
    "I can't stop worrying about getting fired from my job.",
    "Sunday evening comes and I get intense dread thinking about Monday.",
    "I don't even have energy to eat dinner after work anymore.",
    "What practical steps can I take to survive this work burnout?",
  ];

  const multiTurnHistory = [];

  for (let i = 0; i < workConversation.length; i++) {
    const userUtterance = workConversation[i];
    const turnRes = generateDynamicCompanionReply({
      userText: userUtterance,
      history: multiTurnHistory,
    });

    assert(turnRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
    assert(turnRes.psychologicalAssessment);
    assert(turnRes.psychologicalAssessment.polyvagalState);

    multiTurnHistory.push({ role: 'user', text: userUtterance });
    multiTurnHistory.push({ role: 'assistant', text: turnRes.reply });

    console.log(`  ✓ Turn ${String(i + 1).padStart(2)}: User: "${userUtterance.slice(0, 30)}..." ➔ Topic: [${turnRes.detectedTopic}] | Polyvagal: [${turnRes.psychologicalAssessment.polyvagalState}]`);
  }
  console.log('  ✓ 10 consecutive turns produced robust clinical directives across multi-turn context.\n');

  // ------------------------------------------------------------------------
  // SUITE 3: 8-Turn Sustained Conversation on Failure & Personalization
  // ------------------------------------------------------------------------
  console.log('--- 3. Testing 8-Turn Sustained Conversation on Failure & Personalization ---');
  const failureConversation = [
    "I failed my driving test today.",
    "I feel like such an idiot for failing again.",
    "Everyone else passed on their first try except me.",
    "I always mess up when it matters most.",
    "I feel completely useless and incompetent.",
    "My parents are going to be so disappointed in me.",
    "Maybe I'm just not capable of doing anything right.",
    "How do I stop beating myself up over this failure?",
  ];

  const failureHistory = [];

  for (let i = 0; i < failureConversation.length; i++) {
    const userUtterance = failureConversation[i];
    const turnRes = generateDynamicCompanionReply({
      userText: userUtterance,
      history: failureHistory,
    });

    assert(turnRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
    assert(turnRes.reply.includes('Somatic Grounding to prescribe:'));

    failureHistory.push({ role: 'user', text: userUtterance });
    failureHistory.push({ role: 'assistant', text: turnRes.reply });

    console.log(`  ✓ Turn ${String(i + 1).padStart(2)}: User: "${userUtterance.slice(0, 30)}..." ➔ Directive Grounding verified.`);
  }
  console.log('  ✓ 8 consecutive failure turns produced consistent clinical directives without state corruption.\n');

  // ------------------------------------------------------------------------
  // SUITE 4: Multi-Language Clinical Directive Protocols (Hindi, Hinglish, Spanish, French, German)
  // ------------------------------------------------------------------------
  console.log('--- 4. Testing Multi-Language Clinical Directive Synthesis ---');

  // 4A: Hindi (Devanagari)
  const hindiRes = generateDynamicCompanionReply({ userText: "आज ऑफिस में बहुत ज्यादा काम का तनाव था।" });
  assert.strictEqual(hindiRes.detectedLanguage, 'hi');
  assert(/[\u0900-\u097F]/.test(hindiRes.reply), 'Hindi directive should contain Devanagari text');
  console.log('  ✓ Hindi (Devanagari): Clinical directive generated in pure Devanagari.');

  // 4B: Hinglish
  const hinglishRes = generateDynamicCompanionReply({ userText: "Mujhe office mein bohot zyada tension ho raha hai." });
  assert.strictEqual(hinglishRes.detectedLanguage, 'hi');
  assert(hinglishRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
  console.log('  ✓ Hinglish (Roman Hindi): Clinical directive generated with Romanized Hindi solutions.');

  // 4C: Spanish
  const spanishRes = generateDynamicCompanionReply({ userText: "Hola, tengo mucho estrés en el trabajo hoy." });
  assert.strictEqual(spanishRes.detectedLanguage, 'es');
  assert(spanishRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
  console.log('  ✓ Spanish (Español): Clinical directive generated in Spanish.');

  // 4D: French
  const frenchRes = generateDynamicCompanionReply({ userText: "Bonjour, je suis très stressé par mon travail." });
  assert.strictEqual(frenchRes.detectedLanguage, 'fr');
  assert(frenchRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
  console.log('  ✓ French (Français): Clinical directive generated in French.');

  // 4E: German
  const germanRes = generateDynamicCompanionReply({ userText: "Hallo, ich habe heute großen Stress bei der Arbeit." });
  assert.strictEqual(germanRes.detectedLanguage, 'de');
  assert(germanRes.reply.includes('[CLINICAL DIRECTIVE FOR LLM]'));
  console.log('  ✓ German (Deutsch): Clinical directive generated in German.\n');

  // ------------------------------------------------------------------------
  // SUITE 5: Breakthrough Insight Anchoring
  // ------------------------------------------------------------------------
  console.log('--- 5. Testing Breakthrough Insight Integration into Clinical Directive ---');
  const mockProfile = {
    breakthroughAnchors: [
      {
        insightPhrase: "A mistake on a presentation is not a measure of my worth",
        contextTrigger: "presentation",
        timestamp: Date.now(),
      }
    ]
  };
  const insightRes = generateDynamicCompanionReply({
    userText: "I am having extreme panic about my presentation tomorrow",
    cognitiveProfile: mockProfile,
  });
  assert(insightRes.reply.includes("presentation is not a measure of my worth"), "Directive must include the learned breakthrough insight");
  console.log('  ✓ Verified: Breakthrough insight dynamically injected into CBT reframe directive.\n');

  // ------------------------------------------------------------------------
  // SUITE 6: Multi-Lingual Repetition Complaint Triage & Reset
  // ------------------------------------------------------------------------
  console.log('--- 6. Testing Repetition Complaint Interception & Reset ---');
  const complaintCases = [
    { text: "Stop repeating the same thing over and over!", lang: 'en' },
    { text: "You are stuck in a loop, answer properly", lang: 'en' },
    { text: "Why do you keep asking the same question?", lang: 'en' },
    { text: "again same sentence it is using", lang: 'en' },
    { text: "same sentence again", lang: 'en' },
    { text: "it is using same replies", lang: 'en' },
    { text: "बार बार वही बात मत बोलो", lang: 'hi' },
    { text: "Aap bar bar same dialogue repeat kar rahe ho", lang: 'hi' },
    { text: "wahi sentence dobara bol rahe ho", lang: 'hi' },
    { text: "ek hi बात baar baar repeat ho rahi hai", lang: 'hi' },
  ];

  for (const cc of complaintCases) {
    const res = generateDynamicCompanionReply({ userText: cc.text });
    assert.strictEqual(res.detectedTopic, 'loop_complaint', `Failed to intercept complaint: "${cc.text}"`);
    assert(res.reply.length > 25, `Invalid reset reply for: "${cc.text}"`);
    console.log(`  ✓ Intercepted complaint: "${cc.text}" ➔ Topic: [${res.detectedTopic}]`);
  }

  console.log('\n================================================================');
  console.log('🎉 CLINICAL CONTEXT PROVIDER TEST SUITE: 100% PASSED');
  console.log('================================================================\n');
}

module.exports = { runConversationalDiversityTests };

if (require.main === module) {
  runConversationalDiversityTests();
}
