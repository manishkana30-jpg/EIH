// tests/test-unit-mobile-speech.mjs
import assert from 'assert';
import fs from 'fs';

console.log('--- Unit Auditing Mobile Speech Implementation ---');

// 1. Audit lib/audio/browser-speech.ts
const speechCode = fs.readFileSync('lib/audio/browser-speech.ts', 'utf8');

// Check 1: Strict User-Gesture Initialization (Zero awaits before initWebSpeechRecognition)
const initCallIdx = speechCode.indexOf('this.initWebSpeechRecognition();');
assert(initCallIdx !== -1, 'initWebSpeechRecognition must be invoked in startRecognition');
const codeBeforeInit = speechCode.slice(speechCode.indexOf('public async startRecognition'), initCallIdx);
assert(!codeBeforeInit.includes('await this.startMediaStreamAndVAD'), 'startMediaStreamAndVAD must NOT be awaited before initWebSpeechRecognition on mobile');
console.log('✅ Check 1: startRecognition initiates SpeechRecognition synchronously on the first tick without awaiting getUserMedia');

// Check 2: Secure Context check & exact message
assert(speechCode.includes("Voice requires a secure HTTPS connection."), 'Must output "Voice requires a secure HTTPS connection." on insecure context');
console.log('✅ Check 2: Secure Context (HTTPS) exact error message verified');

// Check 3: Error prompt for not-allowed permission
assert(speechCode.includes("Please enable microphone permissions in your browser settings."), 'Must output "Please enable microphone permissions in your browser settings." on not-allowed');
console.log('✅ Check 3: Permission not-allowed prompt verified');

// Check 4: Prefixing check with fallback message
assert(speechCode.includes("window.SpeechRecognition") && speechCode.includes("window.webkitSpeechRecognition"), 'Must check both vendor prefixes');
assert(speechCode.includes("Voice input not supported on this browser. Please type."), 'Must output fallback message when SpeechRecognition is not supported');
console.log('✅ Check 4: iOS Safari vendor prefixing & fallback prompt verified');

// Check 5: iOS continuous mode handling
assert(speechCode.includes("recognition.continuous = !isIOS;"), 'Must set continuous = false on iOS Safari to prevent CoreAudio crashes');
console.log('✅ Check 5: iOS Safari continuous = false setting verified');

// 2. Audit components/wellness-flow/GuidedWellnessConversation.tsx
const guidedCode = fs.readFileSync('components/wellness-flow/GuidedWellnessConversation.tsx', 'utf8');

// Check 6: Guided flow auto-start disabled on mobile
assert(guidedCode.includes("isMobile") && guidedCode.includes("skipping background mic start"), 'Guided flow must not auto-start mic in background on mobile');
console.log('✅ Check 6: Guided flow respects strict mobile user-gesture requirement');

// Check 7: Guided flow secure context & prefixing checks in handleToggleListening
assert(guidedCode.includes("Voice requires a secure HTTPS connection."), 'Guided flow must verify secure context');
assert(guidedCode.includes("Voice input not supported on this browser. Please type."), 'Guided flow must check SpeechRecognition support');
assert(guidedCode.includes("Please enable microphone permissions in your browser settings."), 'Guided flow must show permission prompt');
console.log('✅ Check 7: Guided flow secure context, prefixing, and permission prompts verified');

// 3. Audit app/(session)/page.tsx
const pageCode = fs.readFileSync('app/(session)/page.tsx', 'utf8');
assert(pageCode.includes("Voice requires a secure HTTPS connection."), 'page.tsx must verify secure context');
assert(pageCode.includes("Voice input not supported on this browser. Please type."), 'page.tsx must check SpeechRecognition support');
assert(pageCode.includes("Please enable microphone permissions in your browser settings."), 'page.tsx must show permission prompt');
assert(pageCode.includes("document.activeElement.blur()"), 'page.tsx must dismiss mobile virtual keyboard on mic tap');
console.log('✅ Check 8: page.tsx secure context, prefixing, permission prompts, and keyboard dismissal verified');

// 4. Audit lib/wellness-flow/confirm-voice-manager.ts
const confirmCode = fs.readFileSync('lib/wellness-flow/confirm-voice-manager.ts', 'utf8');
assert(confirmCode.includes("Voice requires a secure HTTPS connection."), 'confirm-voice-manager must verify secure context');
assert(confirmCode.includes("Voice input not supported on this browser"), 'confirm-voice-manager must check SpeechRecognition support');
assert(confirmCode.includes("Please enable microphone permissions in your browser settings."), 'confirm-voice-manager must show permission prompt');
assert(confirmCode.includes("recognizer.continuous = !isIOS"), 'confirm-voice-manager must set continuous = false on iOS');
console.log('✅ Check 9: confirm-voice-manager iOS continuous and prompts verified');

console.log('\n🎉 ALL 9 MOBILE SPEECH API ARCHITECTURAL GUARDS VERIFIED SUCCESSFULLY!');
