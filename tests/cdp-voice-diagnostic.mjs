// tests/cdp-voice-diagnostic.mjs
// Launches real Google Chrome with remote debugging, connects via CDP over native WebSocket,
// and captures empirical console logs, permission states, getUserMedia calls, and STT events.

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
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

async function runDiagnostic() {
  console.log('[CDP Diagnostic] Launching Chrome in headless/remote-debugging mode...');
  
  const userDataDir = path.resolve('scratch_chrome_profile');
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
    console.log('[CDP Diagnostic] Connected to Chrome DevTools WebSocket:', wsUrl);

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
        consoleLogs.push({ type: msg.params.type, text, timestamp: Date.now() });
      }

      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: msg.params.request.url,
          method: msg.params.request.method,
          timestamp: Date.now()
        });
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

    // Enable domains
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    console.log('[CDP Diagnostic] Waiting for page load...');
    await wait(3000);

    // Evaluate step 1: Environment, Origin, Permissions, APIs
    console.log('[CDP Diagnostic] Evaluating Step 1 & 2 environment probes...');
    const envProbe = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const res = {};
          res.origin = window.location.origin;
          res.isSecureContext = window.isSecureContext;
          res.protocol = window.location.protocol;
          
          try {
            const p = await navigator.permissions.query({ name: 'microphone' });
            res.micPermission = p.state;
          } catch(e) {
            res.micPermission = 'error: ' + e.message;
          }

          res.hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
          res.hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
          res.speechRecConstructorName = (window.SpeechRecognition && 'SpeechRecognition') || (window.webkitSpeechRecognition && 'webkitSpeechRecognition') || 'none';
          res.hasSpeechSynthesis = !!(window.speechSynthesis);
          res.speechSynthSpeaking = window.speechSynthesis ? window.speechSynthesis.speaking : false;
          res.speechSynthPending = window.speechSynthesis ? window.speechSynthesis.pending : false;

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            res.getUserMediaSuccess = true;
            res.tracks = stream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled, readyState: t.readyState }));
            stream.getTracks().forEach(t => t.stop());
          } catch (e) {
            res.getUserMediaSuccess = false;
            res.getUserMediaError = e.name + ': ' + e.message;
          }

          return res;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[CDP Diagnostic] Probe Results:', JSON.stringify(envProbe.result.value, null, 2));

    // Evaluate Step 1 reproduction: Test SpeechRecognition instance creation & lifecycle
    console.log('[CDP Diagnostic] Testing native webkitSpeechRecognition lifecycle & errors...');
    const speechRecTest = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const log = [];
          const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!Rec) return { supported: false };

          const rec = new Rec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          let resolved = false;
          return new Promise((resolve) => {
            rec.onstart = () => log.push('onstart');
            rec.onaudiostart = () => log.push('onaudiostart');
            rec.onsoundstart = () => log.push('onsoundstart');
            rec.onspeechstart = () => log.push('onspeechstart');
            rec.onspeechend = () => log.push('onspeechend');
            rec.onsoundend = () => log.push('onsoundend');
            rec.onaudioend = () => log.push('onaudioend');
            rec.onresult = (e) => {
              log.push('onresult: ' + (e.results[0] ? e.results[0][0].transcript : 'empty'));
            };
            rec.onerror = (e) => {
              log.push('onerror: ' + e.error);
              if (!resolved) {
                resolved = true;
                resolve({ log, finalState: 'error', error: e.error });
              }
            };
            rec.onend = () => {
              log.push('onend');
              if (!resolved) {
                resolved = true;
                resolve({ log, finalState: 'ended' });
              }
            };

            try {
              rec.start();
              log.push('rec.start() called');
            } catch (err) {
              log.push('start threw: ' + err.name + ' - ' + err.message);
              resolve({ log, finalState: 'start_threw', error: err.message });
              return;
            }

            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                try { rec.stop(); } catch(_) {}
                resolve({ log, finalState: 'timeout_stopped' });
              }
            }, 3000);
          });
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[CDP Diagnostic] SpeechRecognition Test Result:', JSON.stringify(speechRecTest.result.value, null, 2));

    // Save logs to reports directory
    const reportPath = path.resolve('reports/voice_reproduction_evidence.json');
    const evidence = {
      timestamp: new Date().toISOString(),
      envProbe: envProbe.result.value,
      speechRecTest: speechRecTest.result.value,
      consoleLogs: consoleLogs,
      networkRequests: networkRequests
    };

    fs.writeFileSync(reportPath, JSON.stringify(evidence, null, 2), 'utf-8');
    console.log(`[CDP Diagnostic] Evidence saved successfully to ${reportPath}`);

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runDiagnostic().catch(err => {
  console.error('[CDP Diagnostic] Error:', err);
  process.exit(1);
});
