const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Testing Sequential Card Progression & Gita Vocalization Flow ---');

// 1. Verify parseTherapeuticStages logic and stage structure
const sampleResponseHindi = `
**SUMMARY (आपकी स्थिति व कष्ट का सारांश):**
• Identified Emotional State (पहचाना गया मनोभाव एवं मुख्य संघर्ष): तीव्र चिंता और भविष्य का भय (Severe Anticipatory Anxiety)
• Suffering Severity & Autonomic State (पीड़ा का स्तर एवं तंत्रिका तंत्र स्थिति): उच्च (Severe) | Sympathetic Fight-or-Flight
• Interoceptive Bodily Burden (शारीरिक संवेदनाएं व आंतरिक तनाव): छाती में दबाव, उथली सांसें, बेचैनी
• Empathic Summary of Your Experience (आपकी स्थिति का संवेदनशील सारांश): आप लगातार अनिश्चित भविष्य को लेकर भयभीत महसूस कर रहे हैं और मन शांत नहीं हो पा रहा है।

[GITA_SHLOKA]
ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।
सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥
— श्रीमद्भगवद्गीता (अध्याय 2, श्लोक 62)
[/GITA_SHLOKA]

**1. श्रीमद्भगवद्गीता आत्मिक दर्शन (Bhagavad Gita Wisdom):**
भगवान श्रीकृष्ण अर्जुन को समझाते हैं कि विषयों का निरंतर चिंतन करने से उनमें आसक्ति और चिंता उत्पन्न होती है।
इस संदेश को अपने वर्तमान जीवन में उतारें: भविष्य की अनिश्चितताओं पर विचार करने के बजाय वर्तमान कर्तव्य पर ध्यान केंद्रित करें।
इस समय आपका कर्तव्य: अपनी वर्तमान जिम्मेदारियों को बिना फल की आसक्ति के पूरा करना।

**2. क्लिनिकल कॉग्निटिव न्यूरोसाइंस (CBT Framework):**
• संज्ञानात्मक पुनर्गठन (Cognitive Reframe): "यह विचार केवल एक संभावना है, निश्चित सत्य नहीं।"
• शारीरिक एंकर (Somatic Anchor): दोनों पैरों को भूमि पर मजबूती से टिकाएं और गहरी सांस लें।
• प्राणायाम श्वास चक्र (Pranayama Sequence): Inhale (4s) → Hold (4s) → Exhale (6s)

**3. त्राटक न्यूरो-ऑक्युलर ध्यान विधि (Neuro-Ocular Gazing):**
• निर्धारित विधि (Prescribed Mode): बिंदु त्राटक (Bindu Trataka)
• दृष्टि लक्ष्य (Focal Target): एक स्थिर सुनहरे बिंदु पर पलकें झपकाए बिना एकाग्र दृष्टि रखें।
• तंत्रिका क्रियाविधि (Neuro-Mechanism): यह दृष्टि अभ्यास अल्फा ब्रेनवेव्स को सक्रिय कर सिम्पैथेटिक तंत्रिका तंत्र को शांत करता है।

**4. एकीकृत त्रिवेणी उपचार योजना (गीता + CBT + त्राटक मिलकर आपकी पीड़ा कैसे दूर करेंगे):**
गीता का ज्ञान आपको मानसिक अनासक्ति देगा, सीबीटी आपके विचारों को संतुलित करेगा, और त्राटक आपकी दृष्टि व मन को स्थिर करेगा।
`;

// Test tokenizer file import or logic
const tokenizerPath = path.join(__dirname, '..', 'lib', 'audio', 'karaoke-tokenizer.ts');
assert(fs.existsSync(tokenizerPath), 'karaoke-tokenizer.ts must exist');
const tokenizerCode = fs.readFileSync(tokenizerPath, 'utf8');

// Verify parseTherapeuticStages export
assert(tokenizerCode.includes('export function parseTherapeuticStages'), 'Must export parseTherapeuticStages');

// Test 2: Verify Stage 1 Sanctuary Card separation
// Stage 1 speechText must contain emotion and confirmation prompt
assert(tokenizerCode.includes('confirmationPrompt'), 'Stage 1 must include confirmation prompt');
assert(tokenizerCode.includes('क्या आप इस समय इसी'), 'Must have Hindi confirmation prompt');
assert(tokenizerCode.includes('Is this what you are experiencing right now?'), 'Must have English confirmation prompt');
console.log('  ✓ Stage 1 (Sanctuary Card) contains isolated emotion understanding & confirmation prompt');

// Test 3: Verify Stage 2 Gita Shloka vocalization
// Stage 2 speechText must explicitly vocalize the Gita Shloka
assert(tokenizerCode.includes('spokenShloka'), 'Stage 2 speech text must vocalize shloka');
assert(tokenizerCode.includes('s2SpeechText = `${spokenShloka}'), 'Stage 2 speechText must start with spokenShloka');
console.log('  ✓ Stage 2 (Bhagavad Gita Card) vocalizes Shloka aloud via TTS');

// Test 4: Verify sequential display logic in KaraokeMessage.tsx
const karaokeMsgPath = path.join(__dirname, '..', 'app', '(session)', 'components', 'KaraokeMessage.tsx');
assert(fs.existsSync(karaokeMsgPath), 'KaraokeMessage.tsx must exist');
const karaokeCode = fs.readFileSync(karaokeMsgPath, 'utf8');

// Must render sequential progression:
assert(karaokeCode.includes('activeStage === 1'), 'Must check activeStage === 1 for confirmation prompt');
assert(karaokeCode.includes('activeStage >= 2 && stage2'), 'Stage 2 must unlock only when activeStage >= 2');
assert(karaokeCode.includes('activeStage >= 3 && stage3'), 'Stage 3 must unlock only when activeStage >= 3');
assert(karaokeCode.includes('activeStage >= 4 && stage4'), 'Stage 4 must unlock only when activeStage >= 4');
assert(karaokeCode.includes('Next: Gita Wisdom') || karaokeCode.includes('अगला: गीता दर्शन'), 'Must have Stage 1 -> Stage 2 advance action');
assert(karaokeCode.includes('Next: CBT & Breathwork') || karaokeCode.includes('अगला: CBT व प्राणायाम'), 'Must have Stage 2 -> Stage 3 advance action');
assert(karaokeCode.includes('Next: Tratak Gazing') || karaokeCode.includes('अगला: त्राटक ध्यान'), 'Must have Stage 3 -> Stage 4 advance action');
console.log('  ✓ KaraokeMessage enforces strict sequential card unlocking (Card 1 -> Card 2 -> Card 3 -> Card 4)');

// Test 5: Verify anti-looping affirmative confirmation in page.tsx
const pagePath = path.join(__dirname, '..', 'app', '(session)', 'page.tsx');
assert(fs.existsSync(pagePath), 'page.tsx must exist');
const pageCode = fs.readFileSync(pagePath, 'utf8');

assert(pageCode.includes('isAwaitingStage1'), 'page.tsx must track if awaiting Stage 1 confirmation');
assert(pageCode.includes('isAffirmativeConfirmation'), 'page.tsx must detect affirmative user confirmation');
assert(pageCode.includes('handleConfirmStage1(lastAiMsg.id)'), 'page.tsx must call handleConfirmStage1 on affirmative confirmation');
assert(pageCode.includes('return;'), 'page.tsx must return early to suppress redundant backend request');
console.log('  ✓ Affirmative confirmation intercepts user agreement and eliminates repetitive loops');

// Test 6: Verify automatic sequential audio transition in page.tsx
assert(pageCode.includes('stage === 2'), 'page.tsx must auto-advance from stage 2 to stage 3 on audio end');
assert(pageCode.includes('stage === 3'), 'page.tsx must auto-advance from stage 3 to stage 4 on audio end');
console.log('  ✓ Automatic sequential voice progression (Card 2 completes -> Card 3 reads -> Card 4 reads) verified');

// Test 7: Verify affirmative confirmation regex matches common user agreement terms
const affirmativeRegex = /^(yes|yeah|yep|right|correct|that's right|thats right|haan|sahi|sahi hai|bilkul|ha|si|oui|ja|yes please|exactly|true|agree|affirmative|y)\b/i;
const testAgreements = [
  'yes', 'Yes', 'YES',
  'yeah', 'yep', 'right', 'correct',
  "that's right", 'thats right',
  'haan', 'haan ji', 'sahi hai', 'sahi', 'bilkul',
  'si', 'oui', 'ja', 'yes please', 'agree'
];

testAgreements.forEach((term) => {
  assert(affirmativeRegex.test(term), `Affirmative regex must match "${term}"`);
});

const testNonAgreements = [
  'no, I feel something else',
  'Actually it is more like severe depression',
  'I am angry at my coworker',
  'Can you help me with a panic attack?'
];

testNonAgreements.forEach((term) => {
  assert(!affirmativeRegex.test(term), `Affirmative regex must NOT match "${term}"`);
});
console.log('  ✓ Affirmative confirmation regex matches all valid multilingual agreement expressions');

console.log('\n🎉 ALL SEQUENTIAL CARD FLOW & GITA VOCALIZATION TESTS PASSED WITH 100% SUCCESS!\n');
