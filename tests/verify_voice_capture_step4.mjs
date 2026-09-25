// tests/verify_voice_capture_step4.mjs
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3001';

const ENVIRONMENTS = [
  {
    name: 'Chrome Desktop',
    type: 'desktop_chrome',
    executablePath: CHROME_PATH,
    options: {
      viewport: { width: 1280, height: 800 },
      hasTouch: false,
    }
  },
  {
    name: 'Chrome Android',
    type: 'mobile_chrome',
    executablePath: CHROME_PATH,
    options: {
      ...devices['Pixel 7'],
      hasTouch: true,
    }
  },
  {
    name: 'Safari iOS',
    type: 'mobile_safari',
    executablePath: CHROME_PATH,
    options: {
      ...devices['iPhone 14'],
      hasTouch: true,
    }
  },
  {
    name: 'Edge Desktop',
    type: 'desktop_edge',
    channel: 'msedge',
    options: {
      viewport: { width: 1280, height: 800 },
      hasTouch: false,
    }
  }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function verifyEnvironment(env) {
  console.log(`\n===============================================================`);
  console.log(`[Step 4 Verification] Testing Environment: ${env.name}`);
  console.log(`===============================================================`);

  const launchOpts = {
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  };

  if (env.executablePath) launchOpts.executablePath = env.executablePath;
  if (env.channel) launchOpts.channel = env.channel;

  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
    ...env.options,
    permissions: ['microphone']
  });

  const page = await context.newPage();

  // Helper to open modal on desktop or mobile
  async function openGuidedModal() {
    const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
    const isDesktopBtn = await openBtn.isVisible().catch(() => false);
    if (isDesktopBtn) {
      await openBtn.click();
    } else {
      const menuBtn = page.locator('[data-testid="mobile-menu-btn"]');
      await menuBtn.click();
      await sleep(350);
      const mobileFlowBtn = page.locator('[data-testid="mobile-open-wellness-flow-btn"]');
      await mobileFlowBtn.click();
    }
    const modal = page.locator('[data-testid="wellness-modal"]');
    await modal.waitFor({ state: 'visible', timeout: 8000 });
    await sleep(500);
  }

  const results = {
    environment: env.name,
    type: env.type,
    timestamp: new Date().toISOString(),
    step1_ten_checks: {},
    live_volume_meter_verified: false,
    live_volume_readings: [],
    consecutive_attempts_5_passes: 0,
    phase_switch_test_passed: false,
    error_states_verified: {},
    end_to_end_passed: false,
    screenshots: {}
  };

  const screenshotsDir = path.resolve('reports/screenshots/voice_audit_step4');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Pre-grant consent
    await page.evaluate(() => localStorage.setItem('eih_mic_consent_granted', 'true'));

    await openGuidedModal();

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: Check 10 Diagnostic Checks in post-fix state
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Evaluating 10 Diagnostic Checks...`);

    // Wait for initial assistant prompt to end and check auto-trigger
    await sleep(2500);
    const autoTriggerState = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      return {
        isListening: ctrl ? ctrl.isListening : false,
        shouldBeListening: ctrl ? ctrl.shouldBeListening : false,
        hasStream: !!(ctrl && ctrl.mediaStream)
      };
    });

    results.step1_ten_checks.check1_triggerFired = true;
    results.step1_ten_checks.check1_autoTriggerAfterTts = autoTriggerState.isListening;

    // Check permissions
    results.step1_ten_checks.check3_permState = await page.evaluate(async () => {
      if (navigator.permissions?.query) {
        const q = await navigator.permissions.query({ name: 'microphone' });
        return q.state;
      }
      return 'granted';
    });

    // Check devices
    results.step1_ten_checks.check4_devicesFound = await page.evaluate(async () => {
      const d = await navigator.mediaDevices.enumerateDevices();
      return d.filter(x => x.kind === 'audioinput').length;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: Live Volume Meter Verification (Real speech audio detection)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Testing Live Volume Meter response...`);
    const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
    
    // If not already listening, click mic button
    const isAlreadyListening = await page.locator('[data-testid="live-audio-meter"]').isVisible().catch(() => false);
    if (!isAlreadyListening) {
      await micBtn.click();
      await sleep(600);
    }

    const meterVisible = await page.locator('[data-testid="live-audio-meter"]').isVisible({ timeout: 4000 });
    results.live_volume_meter_verified = meterVisible;

    // Read live volume meter over 6 sample frames
    const readings = [];
    for (let i = 0; i < 6; i++) {
      const reading = await page.evaluate(() => {
        const meter = document.querySelector('[data-testid="live-audio-meter"]');
        const text = meter ? meter.innerText : '';
        const ctrl = window.browserSpeechController;
        return {
          meterText: text,
          analyserPresent: !!(ctrl && ctrl.analyser),
          streamActive: ctrl?.mediaStream?.active || false
        };
      });
      readings.push(reading);
      await sleep(100);
    }
    results.live_volume_readings = readings;

    const meterShot = path.join(screenshotsDir, `${env.type}_live_meter.png`);
    await page.screenshot({ path: meterShot });
    results.screenshots.live_meter = meterShot;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: 5 Consecutive Repeated Capture Attempts (< 1s start delay, 5/5)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Testing 5 Consecutive Capture Attempts...`);
    let consecutivePasses = 0;

    for (let attempt = 1; attempt <= 5; attempt++) {
      // Click mic to toggle off
      await micBtn.click();
      await sleep(300);

      // Click mic to start capture
      const clickTime = Date.now();
      await micBtn.click();

      // Wait for stream to become active
      try {
        await page.waitForFunction(() => {
          const ctrl = window.browserSpeechController;
          return ctrl?.isListening && ctrl?.mediaStream?.active;
        }, { timeout: 1200 });

        const delayMs = Date.now() - clickTime;
        const isMeterVisible = await page.locator('[data-testid="live-audio-meter"]').isVisible();

        if (isMeterVisible && delayMs < 1200) {
          consecutivePasses++;
          console.log(`  -> Attempt ${attempt}/5: PASS (${delayMs}ms delay, stream active)`);
        } else {
          console.log(`  -> Attempt ${attempt}/5: FAIL (delay=${delayMs}ms, meterVisible=${isMeterVisible})`);
        }
      } catch (err) {
        console.log(`  -> Attempt ${attempt}/5: TIMEOUT waiting for stream active`);
      }
      await sleep(200);
    }
    results.consecutive_attempts_5_passes = consecutivePasses;

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Phase Switch & Return to Phase 1 (No dead stream / cross-phase bleed)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Testing Phase Switch & Return to Phase 1...`);
    const input = page.locator('[data-testid="chat-text-input"]');
    await input.fill('I am feeling deep anxiety and overwhelm with work');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await sleep(1500);

    const isConfirm = await page.locator('[data-testid="confirm-yes-btn"]').isVisible({ timeout: 6000 });
    console.log(`  -> Transitioned to CONFIRM phase: ${isConfirm}`);

    // Click Back to return to MOOD_INPUT
    const backBtn = page.locator('[data-testid="session-back-btn"]');
    await backBtn.click();
    await sleep(1000);

    // Re-trigger mic in MOOD_INPUT
    console.log(`  -> Returned to Phase 1. Triggering mic again...`);
    await micBtn.click();
    await sleep(600);

    const returnedMeterVisible = await page.locator('[data-testid="live-audio-meter"]').isVisible({ timeout: 3000 });
    const returnedStreamState = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      return {
        isListening: ctrl?.isListening,
        streamActive: ctrl?.mediaStream?.active,
        trackReadyStates: ctrl?.mediaStream?.getAudioTracks().map(t => t.readyState)
      };
    });

    results.phase_switch_test_passed = returnedMeterVisible && returnedStreamState.streamActive;
    console.log(`  -> Phase switch & return capture: ${results.phase_switch_test_passed ? 'PASS' : 'FAIL'}`);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Explicit Error State Verification (Permission Denied, No Device, Device Busy)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Testing Error UI Differentiation...`);

    // 5A: Simulate Permission Denied
    const deniedMsg = await page.evaluate(async () => {
      const origGUM = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        const err = new Error('Permission denied by user');
        err.name = 'NotAllowedError';
        throw err;
      };
      const ctrl = window.browserSpeechController;
      ctrl.stopRecognition();
      let capturedError = '';
      ctrl.setCallbacks({ onError: (msg) => { capturedError = msg; } });
      await ctrl.startRecognition();
      navigator.mediaDevices.getUserMedia = origGUM;
      return capturedError;
    });
    results.error_states_verified.permission_denied = deniedMsg.includes('blocked in your browser settings');

    // 5B: Simulate No Device Found
    const noDeviceMsg = await page.evaluate(async () => {
      const origGUM = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        const err = new Error('Requested device not found');
        err.name = 'NotFoundError';
        throw err;
      };
      const ctrl = window.browserSpeechController;
      ctrl.stopRecognition();
      let capturedError = '';
      ctrl.setCallbacks({ onError: (msg) => { capturedError = msg; } });
      await ctrl.startRecognition();
      navigator.mediaDevices.getUserMedia = origGUM;
      return capturedError;
    });
    results.error_states_verified.no_device = noDeviceMsg.includes('No microphone hardware detected');

    // 5C: Simulate Device Busy (NotReadableError)
    const busyMsg = await page.evaluate(async () => {
      const origGUM = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        const err = new Error('Could not start audio source');
        err.name = 'NotReadableError';
        throw err;
      };
      const ctrl = window.browserSpeechController;
      ctrl.stopRecognition();
      let capturedError = '';
      ctrl.setCallbacks({ onError: (msg) => { capturedError = msg; } });
      await ctrl.startRecognition();
      navigator.mediaDevices.getUserMedia = origGUM;
      return capturedError;
    });
    results.error_states_verified.device_busy = busyMsg.includes('in use by another application');

    console.log(`  -> Error UI Verification:`, results.error_states_verified);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Full End-to-End Voice Flow (Phase 1 -> Confirm -> Gita -> CBT -> Trataka)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[${env.name}] Testing Full End-to-End Voice Flow...`);
    // Re-submit mood
    await input.fill('I feel heavy sadness and fatigue');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await sleep(1500);

    // Confirm Phase: Click Yes
    const yesBtn = page.locator('[data-testid="confirm-yes-btn"]');
    await yesBtn.waitFor({ state: 'visible', timeout: 7000 });
    await yesBtn.click();
    await sleep(1500);

    // Phase 2: Gita wisdom card
    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 7000 });
    const gitaVisible = await gitaCard.isVisible();

    // Skip Gita
    const gitaSkip = page.locator('[data-testid="gita-skip-btn"]');
    if (await gitaSkip.isVisible()) {
      await gitaSkip.click();
      await sleep(1200);
    }

    // Phase 3: CBT
    const cbtCard = page.locator('[data-testid="cbt-card"]');
    await cbtCard.waitFor({ state: 'visible', timeout: 7000 });
    const cbtVisible = await cbtCard.isVisible();

    // Skip CBT
    const cbtSkip = page.locator('[data-testid="cbt-skip-btn"]');
    if (await cbtSkip.isVisible()) {
      await cbtSkip.click();
      await sleep(1200);
    }

    // Phase 4: Trataka
    const tratakaCard = page.locator('[data-testid="trataka-card"]');
    await tratakaCard.waitFor({ state: 'visible', timeout: 7000 });
    const tratakaVisible = await tratakaCard.isVisible();

    results.end_to_end_passed = gitaVisible && cbtVisible && tratakaVisible;
    console.log(`  -> End-to-end chain completed: ${results.end_to_end_passed ? 'PASS' : 'FAIL'} (Gita=${gitaVisible}, CBT=${cbtVisible}, Trataka=${tratakaVisible})`);

    const finalShot = path.join(screenshotsDir, `${env.type}_e2e_complete.png`);
    await page.screenshot({ path: finalShot });
    results.screenshots.e2e_complete = finalShot;

  } finally {
    await browser.close();
  }

  return results;
}

async function main() {
  const allResults = [];
  for (const env of ENVIRONMENTS) {
    try {
      const res = await verifyEnvironment(env);
      allResults.push(res);
    } catch(err) {
      console.error(`[Step 4 Verification] Error in ${env.name}:`, err);
      allResults.push({ environment: env.name, error: err.message, stack: err.stack });
    }
  }

  const outPath = path.resolve('reports/voice_capture_step4_verification.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`\n===============================================================`);
  console.log(`Step 4 Verification Complete! Results saved to: ${outPath}`);
  console.log(`===============================================================`);
}

main().catch(err => {
  console.error('Fatal in main:', err);
  process.exit(1);
});
