// tests/cdp-full-voice-suite.mjs
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9229;
const APP_URL = 'http://localhost:3001';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullVoiceSuite() {
  console.log('[Full Voice Suite] Launching Chrome in remote debugging mode...');
  const userDataDir = path.resolve('scratch_chrome_voice_suite');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--window-size=1280,900',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    APP_URL
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        if (res.ok) {
          const list = await res.json();
          const page = list.find(item => item.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch (_) {}
      await wait(300);
    }
    if (!wsUrl) throw new Error('Could not connect to Chrome debugger.');

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pendingPromises = new Map();
    const consoleLogs = [];
    const networkRequests = [];

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

      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: msg.params.request.url,
          method: msg.params.request.method,
          time: Date.now()
        });
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const cur = msgId++;
      pendingPromises.set(cur, { resolve, reject });
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    console.log('[Full Voice Suite] Waiting 2s for page to settle...');
    await wait(2000);

    // 1. Initial Permission & API Probe
    const probeRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const p = await navigator.permissions.query({ name: 'microphone' });
          const hasSpeechRec = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
          const hasGUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
          let gumState = 'untested';
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            gumState = 'success: ' + stream.getAudioTracks().length + ' tracks';
            stream.getTracks().forEach(t => t.stop());
          } catch(e) {
            gumState = 'error: ' + e.name + ' - ' + e.message;
          }
          return {
            origin: window.location.origin,
            isSecureContext: window.isSecureContext,
            micPermission: p.state,
            hasSpeechRec,
            hasGUM,
            gumState,
            speechSynthSpeaking: window.speechSynthesis ? window.speechSynthesis.speaking : false
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('[Full Voice Suite] Initial Probe:', probeRes.result.value);

    // 2. Open 4-Phase Guided Flow Modal
    console.log('[Full Voice Suite] Opening Guided Wellness Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.includes('4-Phase Guided Flow'));
          if (btn) btn.click();
        })()
      `
    });

    await wait(1500);

    // 3. Test Phase 1: MOOD_INPUT voice toggle
    console.log('[Full Voice Suite] Testing MOOD_INPUT Phase voice toggle...');
    const moodPhaseTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = {};
          const micBtn = document.querySelector('footer button[title*="listening"], footer button[title*="reply"]');
          res.foundMicButton = !!micBtn;
          res.initialMicTitle = micBtn?.getAttribute('title');

          if (micBtn) {
            // First click: triggers consent modal if not consented
            micBtn.click();
            await new Promise(r => setTimeout(r, 400));

            const consentModal = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Voice Analysis Consent'));
            res.consentModalAppeared = !!consentModal;

            if (consentModal) {
              const allowBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Allow Microphone'));
              if (allowBtn) {
                allowBtn.click();
                res.grantedConsent = true;
                await new Promise(r => setTimeout(r, 600));
              }
            }

            // Inspect mic state after consent
            const updatedMic = document.querySelector('footer button[title*="listening"], footer button[title*="reply"]');
            res.postConsentMicTitle = updatedMic?.getAttribute('title');
            res.isListeningClass = updatedMic?.className.includes('rose-500');
          }

          return res;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('[Full Voice Suite] MOOD_INPUT Phase Test:', moodPhaseTest.result.value);

    // 4. Advance to CONFIRM Phase by submitting mood
    console.log('[Full Voice Suite] Submitting mood to advance to CONFIRM phase...');
    const confirmAdvanceTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = {};
          const input = document.querySelector('footer input[type="text"]');
          if (!input) {
            res.error = 'Input field not found in modal footer';
            return res;
          }

          // Type mood text
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, 'I am feeling overwhelmed with deadlines and anxiety');
          input.dispatchEvent(new Event('input', { bubbles: true }));

          // Submit
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          await new Promise(r => setTimeout(r, 1200));

          // In CONFIRM phase, check status
          const statusElements = Array.from(document.querySelectorAll('span, div')).map(e => e.innerText);
          res.inConfirmPhase = statusElements.some(t => t.includes('Awaiting confirmation') || t.includes('Speaking confirmation') || t.includes('Listening...') || t.includes('Yes') || t.includes('No'));
          
          const confirmBadge = statusElements.find(t => t.includes('Awaiting confirmation') || t.includes('Speaking confirmation') || t.includes('Listening...') || t.includes('Preparing microphone'));
          res.confirmStatusBadge = confirmBadge || 'unknown';

          res.hasYesNoButtons = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Yes, that’s right') || b.innerText.includes('Yes, that\'s right') || b.innerText.includes('No, not quite'));

          return res;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('[Full Voice Suite] CONFIRM Phase Advance Test:', confirmAdvanceTest.result.value);

    // 5. In CONFIRM phase, test Yes/No intent and short-session voice recognizer
    console.log('[Full Voice Suite] Testing CONFIRM phase voice recognizer and Yes resolution...');
    await wait(1000);
    const confirmResolveTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = {};
          // Look for 'Yes, that’s right' button or trigger selection
          const yesBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Yes, that’s right') || b.innerText.includes('Yes, that\'s right') || b.innerText.trim() === 'Yes');
          res.foundYesButton = !!yesBtn;
          if (yesBtn) {
            yesBtn.click();
            await new Promise(r => setTimeout(r, 1500));
            
            const badges = Array.from(document.querySelectorAll('span, div')).map(e => e.innerText);
            res.transitionedToGita = badges.some(t => t.includes('Gita') || t.includes('Chapter') || t.includes('Shloka') || t.includes('Sacred Gita') || t.includes('Reflection'));
          }
          return res;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('[Full Voice Suite] CONFIRM Resolution Test:', confirmResolveTest.result.value);

    // Save full findings
    const reportData = {
      timestamp: new Date().toISOString(),
      initialProbe: probeRes.result.value,
      moodPhaseTest: moodPhaseTest.result.value,
      confirmAdvanceTest: confirmAdvanceTest.result.value,
      confirmResolveTest: confirmResolveTest.result.value,
      consoleLogs: consoleLogs,
      networkRequests: networkRequests
    };

    fs.writeFileSync(path.resolve('reports/voice_suite_results.json'), JSON.stringify(reportData, null, 2), 'utf-8');
    console.log('[Full Voice Suite] Results saved to reports/voice_suite_results.json');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runFullVoiceSuite().catch(err => {
  console.error('[Full Voice Suite] Error:', err);
  process.exit(1);
});
