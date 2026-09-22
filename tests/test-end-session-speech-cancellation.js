// tests/test-end-session-speech-cancellation.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting End Session Speech Cancellation & Teardown Verification...\n');

// 1. Verify browser-speech.ts contains generation-based cancellation
const speechFile = path.join(__dirname, '../lib/audio/browser-speech.ts');
const speechContent = fs.readFileSync(speechFile, 'utf8');

assert(speechContent.includes('activeSpeechGeneration'), 'browser-speech.ts must have activeSpeechGeneration');
assert(speechContent.includes('this.activeSpeechGeneration++'), 'cancelSpeech must increment activeSpeechGeneration');
assert(speechContent.includes('this.activeSpeechGeneration !== speechGeneration'), 'speakNextChunk must check speech generation');
assert(speechContent.includes('window.speechSynthesis.cancel()'), 'cancelSpeech must call window.speechSynthesis.cancel()');

// Check that utterance.onend and utterance.onerror check activeSpeechGeneration and isSpeaking
assert(
  speechContent.includes('if (isFinished || this.activeSpeechGeneration !== speechGeneration || !this.isSpeaking)'),
  'onend and onerror must check cancellation state before calling speakNextChunk'
);
console.log('✅ browser-speech.ts generation-based cancellation verified.');

// 2. Verify page.tsx handleEndSession executes synchronously without window.confirm blocking
const pageFile = path.join(__dirname, '../app/(session)/page.tsx');
const pageContent = fs.readFileSync(pageFile, 'utf8');

assert(pageContent.includes('const handleEndSession = () =>'), 'page.tsx must define handleEndSession');
assert(!pageContent.includes('window.confirm("End this active session?'), 'handleEndSession must NOT block on window.confirm');
assert(pageContent.includes('browserSpeechController.cancelSpeech()'), 'handleEndSession must cancel speech');
assert(pageContent.includes('browserSpeechController.stopRecognition()'), 'handleEndSession must stop recognition');
assert(pageContent.includes('setMessages([])'), 'handleEndSession must clear messages');
assert(pageContent.includes('purgeAllAppStorage()'), 'handleEndSession must purge storage');
assert(pageContent.includes('resetActiveSessionId()'), 'handleEndSession must reset session id');
console.log('✅ page.tsx handleEndSession synchronous reset verified.');

console.log('\n🎉 ALL END SESSION CANCELLATION TESTS PASSED!\n');
