// tests/cdp-voice-phases.mjs
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;
const APP_URL = 'http://localhost:3001';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find(item => item.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch (_) {}
    await wait(300);
  }
  throw new Error('Failed to connect to Chrome remote debugging port.');
}

async function runPhasesTest() {
  console.log('[Phase Diagnostic] Launching Chrome...');
  const userDataDir = path.resolve('scratch_chrome_phases_profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    APP_URL
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getDebuggerUrl();
    console.log('[Phase Diagnostic] Connected via CDP:', wsUrl);

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pendingPromises = new Map();
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingPromises.has(msg.id)) {
        const { resolve, reject } = pendingPromises.get(msg.id);
        pendingPromises.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }

      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
        consoleLogs.push({ type: msg.params.type, text, time: Date.now() });
        console.log(`[Browser Console ${msg.params.type}]`, text);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    console.log('[Phase Diagnostic] Waiting for page hydration...');
    await wait(3500);

    // 1. Diagnose Guided Wellness Modal open and initial MOOD_INPUT voice toggle
    console.log('[Phase Diagnostic] Testing MOOD_INPUT phase voice toggle...');
    const moodTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const results = {};
          
          // Click "Guided Wellness Session" button
          const buttons = Array.from(document.querySelectorAll('button'));
          const guidedBtn = buttons.find(b => b.innerText.includes('Guided Wellness') || b.innerText.includes('Start Guided') || b.innerText.includes('Guided'));
          if (!guidedBtn) {
            results.error = 'Guided Wellness button not found';
            return results;
          }
          guidedBtn.click();
          results.modalOpened = true;

          // Wait 500ms for modal animation
          await new Promise(r => setTimeout(r, 600));

          // Look for mic button in modal
          const modalButtons = Array.from(document.querySelectorAll('footer button, div button'));
          const micButton = modalButtons.find(b => b.getAttribute('title')?.includes('listening') || b.getAttribute('title')?.includes('reply') || b.querySelector('svg.lucide-mic'));
          results.foundMicButton = !!micButton;
          
          // Check localStorage consent
          results.storedConsent = localStorage.getItem('eih_mic_consent_granted');

          if (micButton) {
            // Click mic button
            micButton.click();
            await new Promise(r => setTimeout(r, 400));
            
            // Check if consent modal opened
            const consentModal = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Voice Analysis Consent'));
            results.consentModalAppeared = !!consentModal;

            if (consentModal) {
              const allowBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Allow Microphone'));
              if (allowBtn) {
                allowBtn.click();
                results.clickedAllow = true;
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }

          // Check speech controller state
          results.isSpeaking = window.speechSynthesis ? window.speechSynthesis.speaking : false;
          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[Phase Diagnostic] MOOD_INPUT Test Results:', JSON.stringify(moodTest.result.value, null, 2));

    // 2. Advance to CONFIRM phase and test ConfirmVoiceManager
    console.log('[Phase Diagnostic] Typing mood and entering CONFIRM phase...');
    const confirmTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const results = {};
          const input = document.querySelector('footer input[type="text"]');
          if (!input) {
            results.error = 'Input not found';
            return results;
          }

          // Type mood text
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, 'I have been feeling intense anxiety and stress about my exams');
          input.dispatchEvent(new Event('input', { bubbles: true }));

          // Press Enter / click send
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          await new Promise(r => setTimeout(r, 1200));

          // Inspect state in CONFIRM phase
          const badges = Array.from(document.querySelectorAll('span, div')).map(e => e.innerText);
          results.hasConfirmPhaseText = badges.some(t => t.includes('Awaiting confirmation') || t.includes('Listening...') || t.includes('Speaking confirmation') || t.includes('Yes') || t.includes('No'));

          // Check if SpeechRecognition is active
          results.speechSynthSpeaking = window.speechSynthesis ? window.speechSynthesis.speaking : false;

          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[Phase Diagnostic] CONFIRM Phase Results:', JSON.stringify(confirmTest.result.value, null, 2));

    // 3. Test main chat session voice toggle
    console.log('[Phase Diagnostic] Testing main chat session voice toggle...');
    const mainChatVoiceTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const results = {};
          // Close modal if open
          const closeBtn = document.querySelector('button[title="Close Session"]');
          if (closeBtn) closeBtn.click();
          await new Promise(r => setTimeout(r, 600));

          // Look for chat mic button
          const mainMic = document.querySelector('button[title*="voice"], button[title*="Voice"], button[title*="Record"]');
          results.foundMainMic = !!mainMic;
          if (mainMic) {
            mainMic.click();
            await new Promise(r => setTimeout(r, 800));
            results.mainMicClicked = true;
          }

          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[Phase Diagnostic] Main Chat Voice Test Results:', JSON.stringify(mainChatVoiceTest.result.value, null, 2));

    const finalReport = {
      timestamp: new Date().toISOString(),
      moodTest: moodTest.result.value,
      confirmTest: confirmTest.result.value,
      mainChatVoiceTest: mainChatVoiceTest.result.value,
      capturedLogs: consoleLogs
    };

    fs.writeFileSync(path.resolve('reports/voice_phases_evidence.json'), JSON.stringify(finalReport, null, 2), 'utf-8');
    console.log('[Phase Diagnostic] Saved results to reports/voice_phases_evidence.json');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runPhasesTest().catch(err => {
  console.error('[Phase Diagnostic] Error:', err);
  process.exit(1);
});
