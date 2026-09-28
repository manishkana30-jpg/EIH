/**
 * scripts/diagnose_problem2_latency.mjs
 *
 * Measures precise timestamps (performance.now()) for:
 * 1. Session start (page load complete -> app ready -> first greeting prompt)
 * 2. Yes/No confirmation prompt (TTS prompt start -> TTS prompt end -> STT start -> STT ready/listening -> audio captured -> result)
 * 3. Attempt 1 vs Attempt 2 side-by-side comparison in the same session.
 */

import { chromium } from 'playwright';

const APP_URL = 'http://localhost:3001';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function measureLatency() {
  console.log('================================================================================');
  console.log('DIAGNOSTIC REPORT: STEP 1 OF PROBLEM 2 — SESSION START & YES/NO TIMESTAMPS');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Inject performance instrumentations into the window before any script runs
  await page.addInitScript(() => {
    window.__LATENCY_LOGS__ = [];

    const record = (event, details = {}) => {
      const ts = performance.now();
      const entry = { event, timeMs: Number(ts.toFixed(2)), ...details };
      window.__LATENCY_LOGS__.push(entry);
      console.log(`[PERF_TIMESTAMP] ${entry.timeMs}ms: ${event}`, details);
    };

    window.__recordPerfEvent = record;

    record('navigation_start');

    // Instrument SpeechSynthesis
    if (window.speechSynthesis) {
      const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (utterance) {
        record('tts_speak_called', { text: utterance.text?.slice(0, 40) });

        const origOnStart = utterance.onstart;
        utterance.onstart = function (e) {
          record('tts_prompt_starts', { text: utterance.text?.slice(0, 40) });
          if (origOnStart) origOnStart.call(this, e);
        };

        const origOnEnd = utterance.onend;
        utterance.onend = function (e) {
          record('tts_prompt_ends', { text: utterance.text?.slice(0, 40) });
          if (origOnEnd) origOnEnd.call(this, e);
        };

        return origSpeak(utterance);
      };
    }

    // Instrument SpeechRecognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const origStart = SpeechRec.prototype.start;
      SpeechRec.prototype.start = function () {
        record('stt_start_called', { attempt: window.__CURRENT_CONFIRM_ATTEMPT__ || 1 });
        const self = this;

        const origOnStart = self.onstart;
        self.onstart = function (e) {
          record('stt_ready_listening', { attempt: window.__CURRENT_CONFIRM_ATTEMPT__ || 1 });
          if (origOnStart) origOnStart.call(this, e);
        };

        const origOnResult = self.onresult;
        self.onresult = function (e) {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          record('stt_result_received', { transcript, attempt: window.__CURRENT_CONFIRM_ATTEMPT__ || 1 });
          if (origOnResult) origOnResult.call(this, e);
        };

        return origStart.call(this);
      };
    }
  });

  // 1. Measure Session Start (Page load -> Modal Open -> First Greeting)
  const navStart = Date.now();
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.__recordPerfEvent('page_load_complete'));

  const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
  await openBtn.waitFor({ state: 'visible', timeout: 8000 });
  await page.evaluate(() => window.__recordPerfEvent('app_ready_state'));

  await openBtn.click();
  const modal = page.locator('[data-testid="wellness-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  await page.evaluate(() => window.__recordPerfEvent('wellness_modal_opened'));

  // Wait for initial greeting TTS to start and end
  await page.waitForTimeout(2500);

  // 2. Submit initial mood to trigger Phase 1 Confirmation prompt
  await page.evaluate(() => {
    window.__recordPerfEvent('mood_submitted_start_confirm_flow');
    window.__CURRENT_CONFIRM_ATTEMPT__ = 1;
  });

  const chatInput = page.locator('[data-testid="chat-text-input"]');
  await chatInput.fill('I feel anxious about my job interview tomorrow');
  const sendBtn = page.locator('[data-testid="chat-send-btn"]');
  await sendBtn.click();

  // Wait for Confirmation card
  const confirmCard = page.locator('[data-testid="confirmation-card"]');
  await confirmCard.waitFor({ state: 'visible', timeout: 6000 });
  await page.evaluate(() => window.__recordPerfEvent('confirmation_card_visible'));

  // Wait through Confirmation Prompt TTS & Attempt 1 listen window (7s)
  console.log('Observing Attempt 1 listen window (7s)...');
  await page.waitForTimeout(8000);

  // Mark Attempt 2 in browser context
  await page.evaluate(() => {
    window.__CURRENT_CONFIRM_ATTEMPT__ = 2;
    window.__recordPerfEvent('attempt_2_initiated');
  });

  // Inject a voice result during Attempt 2 using ConfirmVoiceManager or mock
  await page.evaluate(() => {
    if (window.confirmVoiceManager) {
      window.__recordPerfEvent('injecting_voice_result_attempt_2');
      window.confirmVoiceManager.injectTranscript('yes, that is right');
    }
  });

  await page.waitForTimeout(1500);

  // Collect all latency logs from browser
  const logs = await page.evaluate(() => window.__LATENCY_LOGS__);

  console.log('\n--- EXTRACTED TIMESTAMPS (performance.now() in ms) ---');
  logs.forEach((log) => {
    console.log(`  ${String(log.timeMs).padStart(8, ' ')} ms : ${log.event}`, log.text ? `("${log.text}")` : log.transcript ? `(transcript: "${log.transcript}")` : log.attempt ? `(Attempt ${log.attempt})` : '');
  });

  // Calculate Intervals
  const findTime = (ev, filter) => {
    const item = logs.find(l => l.event === ev && (!filter || filter(l)));
    return item ? item.timeMs : null;
  };

  const navTime = findTime('navigation_start') || 0;
  const pageLoadTime = findTime('page_load_complete');
  const appReadyTime = findTime('app_ready_state');
  const modalOpenedTime = findTime('wellness_modal_opened');
  const firstTtsStart = findTime('tts_prompt_starts');
  const firstTtsEnd = findTime('tts_prompt_ends');

  console.log('\n================================================================================');
  console.log('LATENCY METRICS TABLE: SESSION START (First Phase Load)');
  console.log('================================================================================');
  console.log(`  Page Navigation -> DOM Content Loaded: ${(pageLoadTime - navTime).toFixed(1)} ms`);
  console.log(`  DOM Content Loaded -> App Ready (Nav buttons visible): ${(appReadyTime - pageLoadTime).toFixed(1)} ms`);
  console.log(`  App Ready -> Modal Opened: ${(modalOpenedTime - appReadyTime).toFixed(1)} ms`);
  if (firstTtsStart) {
    console.log(`  Modal Opened -> First Greeting TTS Start: ${(firstTtsStart - modalOpenedTime).toFixed(1)} ms`);
    if (firstTtsEnd) {
      console.log(`  First Greeting TTS Duration: ${(firstTtsEnd - firstTtsStart).toFixed(1)} ms`);
    }
  }

  // Attempt 1 vs Attempt 2 comparison
  const sttCalls = logs.filter(l => l.event === 'stt_start_called');
  const sttReady = logs.filter(l => l.event === 'stt_ready_listening');

  console.log('\n================================================================================');
  console.log('ATTEMPT 1 VS ATTEMPT 2 SIDE-BY-SIDE DIAGNOSTIC');
  console.log('================================================================================');
  console.log(`  STT .start() calls recorded: ${sttCalls.length}`);
  console.log(`  STT onstart (ready/listening) events recorded: ${sttReady.length}`);

  if (sttCalls.length > 0 && sttReady.length > 0) {
    const a1Call = sttCalls[0]?.timeMs;
    const a1Ready = sttReady[0]?.timeMs;
    console.log(`  Attempt 1: .start() called at ${a1Call}ms -> onstart ready at ${a1Ready}ms (Startup delta: ${(a1Ready - a1Call).toFixed(1)} ms)`);
  }

  if (sttCalls.length > 1 && sttReady.length > 1) {
    const a2Call = sttCalls[1]?.timeMs;
    const a2Ready = sttReady[1]?.timeMs;
    console.log(`  Attempt 2: .start() called at ${a2Call}ms -> onstart ready at ${a2Ready}ms (Startup delta: ${(a2Ready - a2Call).toFixed(1)} ms)`);
  }

  await browser.close();
  console.log('\nDiagnostic execution completed successfully.\n');
}

measureLatency().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
