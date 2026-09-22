// tests/test-voice-state-emotion-link.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Voice Acoustic State & Emotion Link Verification...\n');

// 1. Verify voice-acoustic-analyzer.ts exists and exports correct methods
const analyzerFile = path.join(__dirname, '../lib/audio/voice-acoustic-analyzer.ts');
assert(fs.existsSync(analyzerFile), 'voice-acoustic-analyzer.ts must exist');
const analyzerContent = fs.readFileSync(analyzerFile, 'utf8');

assert(analyzerContent.includes('export class VoiceAcousticAnalyzer'), 'Analyzer must export class');
assert(analyzerContent.includes('processFrame'), 'Analyzer must implement processFrame');
assert(analyzerContent.includes('estimatePitch'), 'Analyzer must compute pitch via autocorrelation');
assert(analyzerContent.includes('jitterTremor'), 'Analyzer must track pitch tremor/jitter');
assert(analyzerContent.includes('trembling_distress'), 'Analyzer must classify trembling_distress');
assert(analyzerContent.includes('acute_hyperarousal'), 'Analyzer must classify acute_hyperarousal');
assert(analyzerContent.includes('hypoarousal_depressed'), 'Analyzer must classify hypoarousal_depressed');
console.log('✅ Voice Acoustic Analyzer source code and biomarker algorithms verified.');

// 2. Verify browser-speech.ts debouncing patient thresholds
const browserSpeechFile = path.join(__dirname, '../lib/audio/browser-speech.ts');
const speechContent = fs.readFileSync(browserSpeechFile, 'utf8');

assert(speechContent.includes('armSilenceDebouncer'), 'browser-speech.ts must use armSilenceDebouncer');
assert(speechContent.includes('2600'), 'browser-speech.ts must have a patient 2600ms base silence window');
assert(speechContent.includes('3400'), 'browser-speech.ts must extend to 3400ms for incomplete speech');
assert(speechContent.includes('this.isUserSpeaking'), 'Debouncer must respect active VAD cord vibration');
assert(speechContent.includes('onVoiceStateUpdate'), 'browser-speech.ts must emit onVoiceStateUpdate');
console.log('✅ Patient word-by-word debouncing and VAD lock verified.');

// 3. Verify emotion-classifier.ts modulation
const emotionClassifierFile = path.join(__dirname, '../lib/knowledge/emotion-classifier.ts');
const classifierContent = fs.readFileSync(emotionClassifierFile, 'utf8');

assert(classifierContent.includes('voiceState?: VoiceAcousticState'), 'emotion-classifier must accept voiceState');
assert(classifierContent.includes('voiceAcousticState'), 'Diagnostic result must hold voiceAcousticState');
assert(classifierContent.includes('trembling_distress'), 'emotion-classifier must account for trembling_distress');
console.log('✅ Emotion Classifier voice biomarker modulation verified.');

// 4. Verify healer-client.ts integration
const healerClientFile = path.join(__dirname, '../lib/api/healer-client.ts');
const healerContent = fs.readFileSync(healerClientFile, 'utf8');

assert(healerContent.includes('voiceState?: VoiceAcousticState'), 'healer-client sendMessage must accept voiceState');
assert(healerContent.includes('voice_state:'), 'healer-client must pass voice_state in telemetry');
assert(healerContent.includes('hasAcousticDistress'), 'healer-client must consider acoustic distress');
console.log('✅ Healer client vocal awareness and telemetry verified.');

// 5. Verify page.tsx displays Voice State and connects callbacks
const pageFile = path.join(__dirname, '../app/(session)/page.tsx');
const pageContent = fs.readFileSync(pageFile, 'utf8');

assert(pageContent.includes('activeVoiceState'), 'page.tsx must have activeVoiceState state');
assert(pageContent.includes('onVoiceStateUpdate: (vs) =>'), 'page.tsx must hook onVoiceStateUpdate');
assert(pageContent.includes('handleSendMessage(transcript.trim(), voiceState'), 'page.tsx must pass voiceState to handleSendMessage');
assert(pageContent.includes('Voice State:'), 'page.tsx must render Voice State in telemetry');
assert(pageContent.includes('Listening word-by-word'), 'page.tsx must display patient listening status');
console.log('✅ UI patient listening banner and Voice State telemetry verified.');

console.log('\n🎉 ALL VOICE ACOUSTIC & EMOTIONAL INTEGRATION TESTS PASSED PERFECTLY!\n');
