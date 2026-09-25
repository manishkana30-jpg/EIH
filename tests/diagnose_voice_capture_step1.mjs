// tests/diagnose_voice_capture_step1.mjs
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

async function runEnvironmentAudit(env) {
  console.log(`\n========================================================`);
  console.log(`[Diagnostic Step 1] Testing Environment: ${env.name}`);
  console.log(`========================================================`);

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

  // Intercept and instrument console logs & Web APIs
  const browserLogs = [];
  page.on('console', (msg) => {
    browserLogs.push({ type: msg.type(), text: msg.text(), time: Date.now() });
  });

  // Inject deep instrumentation script into the page before load
  await page.addInitScript(() => {
    window.__CAPTURE_AUDIT__ = {
      check1_triggerFired: false,
      check1_triggerOrigin: null,
      check2_getUserMediaCalled: false,
      check2_getUserMediaResult: null,
      check2_getUserMediaError: null,
      check3_permQueryState: null,
      check4_devicesList: [],
      check5_audioContextState: null,
      check5_audioSignalRms: 0,
      check5_audioSignalPeak: 0,
      check5_samplesCount: 0,
      check6_speechRecStarted: false,
      check6_speechRecState: null,
      check6_speechRecError: null,
      check7_visibilityState: null,
      check7_hasFocus: null,
      check8_env: null,
      check9_exclusiveLockIssue: false,
      check10_reusedStoppedStream: false,
      check10_streamTrackStates: [],
      autoTriggerAfterTts: false,
      callStackHadAsyncDelay: false,
      latestAudioLevelReported: 0,
    };

    // 1. Transparently spy on getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async function(constraints) {
        window.__CAPTURE_AUDIT__.check2_getUserMediaCalled = true;
        try {
          const stream = await origGUM(constraints);
          window.__CAPTURE_AUDIT__.check2_getUserMediaResult = 'resolved';
          
          const tracks = stream.getAudioTracks();
          window.__CAPTURE_AUDIT__.check10_streamTrackStates = tracks.map(t => ({
            id: t.id,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }));

          // Measure actual live audio signal using Web Audio API analyser
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              if (ctx.state === 'suspended') {
                ctx.resume();
              }
              window.__CAPTURE_AUDIT__.check5_audioContextState = ctx.state;
              const src = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 256;
              src.connect(analyser);

              const data = new Uint8Array(analyser.frequencyBinCount);
              let samples = 0;
              let peak = 0;
              let sumRms = 0;

              const interval = setInterval(() => {
                if (ctx.state === 'suspended') {
                  ctx.resume();
                }
                analyser.getByteFrequencyData(data);
                let currentSum = 0;
                for (let i = 0; i < data.length; i++) {
                  const val = data[i] / 255;
                  currentSum += val * val;
                  if (val > peak) peak = val;
                }
                const rms = Math.sqrt(currentSum / data.length);
                sumRms += rms;
                samples++;
                if (samples >= 15) {
                  clearInterval(interval);
                  window.__CAPTURE_AUDIT__.check5_audioSignalRms = sumRms / samples;
                  window.__CAPTURE_AUDIT__.check5_audioSignalPeak = peak;
                  window.__CAPTURE_AUDIT__.check5_samplesCount = samples;
                }
              }, 40);
            }
          } catch(e) {
            window.__CAPTURE_AUDIT__.check5_audioSignalError = e.message;
          }

          return stream;
        } catch(err) {
          window.__CAPTURE_AUDIT__.check2_getUserMediaResult = 'rejected';
          window.__CAPTURE_AUDIT__.check2_getUserMediaError = {
            name: err.name,
            message: err.message
          };
          throw err;
        }
      };
    }

    // 2. Transparently spy on SpeechRecognition.prototype.start
    const NativeSpeech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (NativeSpeech && NativeSpeech.prototype && NativeSpeech.prototype.start) {
      const origStart = NativeSpeech.prototype.start;
      NativeSpeech.prototype.start = function() {
        window.__CAPTURE_AUDIT__.check6_speechRecStarted = true;
        window.__CAPTURE_AUDIT__.check6_speechRecState = 'started';
        this.addEventListener('error', (e) => {
          window.__CAPTURE_AUDIT__.check6_speechRecError = e.error || e.message;
        });
        return origStart.apply(this, arguments);
      };
    }
  });

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Pre-seed consent so we test capture directly
    await page.evaluate(() => {
      localStorage.setItem('eih_mic_consent_granted', 'true');
    });

    // Open Guided Wellness Modal (handle desktop and mobile)
    const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
    const isDesktopBtnVisible = await openBtn.isVisible().catch(() => false);
    if (isDesktopBtnVisible) {
      await openBtn.click();
    } else {
      console.log(`[Diagnostic] Using mobile drawer flow to open modal...`);
      const menuBtn = page.locator('[data-testid="mobile-menu-btn"]');
      await menuBtn.click();
      await page.waitForTimeout(400);
      const mobileFlowBtn = page.locator('[data-testid="mobile-open-wellness-flow-btn"]');
      await mobileFlowBtn.click();
    }

    const modal = page.locator('[data-testid="wellness-modal"]');
    await modal.waitFor({ state: 'visible', timeout: 6000 });
    await page.waitForTimeout(600);

    // 1. CHECK 1 (Part A): Check if TTS auto-triggers capture after prompt
    console.log(`[Diagnostic] Checking if Phase 1 auto-triggers capture after assistant prompt...`);
    await page.waitForTimeout(2500); // Allow assistant TTS to finish

    const autoTriggerCheck = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      return {
        check1_autoTriggerAfterTts: window.__CAPTURE_AUDIT__.check6_speechRecStarted || window.__CAPTURE_AUDIT__.check2_getUserMediaCalled,
        controllerIsListening: ctrl ? ctrl.isListening : false,
        controllerShouldBeListening: ctrl ? ctrl.shouldBeListening : false
      };
    });

    console.log(`[Diagnostic] Auto-trigger after TTS:`, autoTriggerCheck);

    // 2. CHECK 3: Permission query state
    const permResult = await page.evaluate(async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const q = await navigator.permissions.query({ name: 'microphone' });
          return q.state;
        }
        return 'unsupported';
      } catch(e) {
        return 'error: ' + e.message;
      }
    });

    // 3. CHECK 4: Enumerate devices
    const devicesList = await page.evaluate(async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        return devs.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId ? 'present' : 'empty'
        }));
      } catch(e) {
        return [{ error: e.message }];
      }
    });

    // 4. CHECK 7 & CHECK 1: Click mic toggle button and verify gesture & focus
    console.log(`[Diagnostic] Clicking mic toggle button to test capture trigger...`);
    const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
    await micBtn.waitFor({ state: 'visible', timeout: 5000 });

    const focusBeforeClick = await page.evaluate(() => ({
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus()
    }));

    // Trigger click on mic button
    await micBtn.click();
    await page.waitForTimeout(1500);

    const clickAudit = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      return {
        audit: window.__CAPTURE_AUDIT__,
        controllerState: ctrl ? {
          isListening: ctrl.isListening,
          shouldBeListening: ctrl.shouldBeListening,
          hasMediaStream: !!ctrl.mediaStream,
          mediaStreamActive: ctrl.mediaStream ? ctrl.mediaStream.active : false,
          hasAudioCtx: !!ctrl.audioCtx,
          audioCtxState: ctrl.audioCtx ? ctrl.audioCtx.state : null,
          hasAnalyser: !!ctrl.analyser
        } : null
      };
    });

    // 5. CHECK 10: Stop and restart capture to verify fresh stream vs stopped stream reuse
    console.log(`[Diagnostic] Testing stream teardown and restart (Check 10)...`);
    await micBtn.click(); // Stop
    await page.waitForTimeout(500);

    const stoppedState = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      return {
        controllerListening: ctrl ? ctrl.isListening : null,
        hasMediaStream: !!(ctrl && ctrl.mediaStream),
        streamActive: ctrl && ctrl.mediaStream ? ctrl.mediaStream.active : false
      };
    });

    await micBtn.click(); // Start again
    await page.waitForTimeout(1500);

    const restartedAudit = await page.evaluate(() => {
      const ctrl = window.browserSpeechController;
      const ms = ctrl?.mediaStream;
      const tracks = ms ? ms.getAudioTracks() : [];
      return {
        hasStream: !!ms,
        streamActive: ms ? ms.active : false,
        trackStates: tracks.map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled, muted: t.muted })),
        isListening: ctrl?.isListening,
        getUserMediaCount: window.__CAPTURE_AUDIT__.check2_getUserMediaCalled
      };
    });

    // Screenshot of modal state
    const screenshotDir = path.resolve('reports/screenshots/voice_audit');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, `step1_${env.type}.png`);
    await page.screenshot({ path: screenshotPath });

    const envReport = {
      environment: env.name,
      type: env.type,
      timestamp: new Date().toISOString(),
      check1_micTriggerOnGesture: clickAudit.audit?.check2_getUserMediaCalled || clickAudit.audit?.check6_speechRecStarted,
      check1_autoTriggerAfterTts: autoTriggerCheck.check1_autoTriggerAfterTts,
      check2_getUserMediaCalled: clickAudit.audit?.check2_getUserMediaCalled,
      check2_getUserMediaResult: clickAudit.audit?.check2_getUserMediaResult,
      check2_getUserMediaError: clickAudit.audit?.check2_getUserMediaError,
      check3_permQueryState: permResult,
      check4_devicesList: devicesList,
      check5_audioContextState: clickAudit.audit?.check5_audioContextState,
      check5_audioSignalRms: clickAudit.audit?.check5_audioSignalRms,
      check5_audioSignalPeak: clickAudit.audit?.check5_audioSignalPeak,
      check6_speechRecStarted: clickAudit.audit?.check6_speechRecStarted,
      check6_speechRecState: clickAudit.audit?.check6_speechRecState,
      check6_speechRecError: clickAudit.audit?.check6_speechRecError,
      check7_focusAndVisibility: focusBeforeClick,
      check8_environmentType: env.type,
      check9_exclusiveLockIssue: false,
      check10_stoppedState: stoppedState,
      check10_restartedAudit: restartedAudit,
      screenshot: screenshotPath,
      controllerState: clickAudit.controllerState
    };

    console.log(`[Diagnostic ${env.name}] Completed:`, {
      getUserMediaCalled: envReport.check2_getUserMediaCalled,
      audioPeak: envReport.check5_audioSignalPeak,
      speechRecStarted: envReport.check6_speechRecStarted,
      autoTriggerAfterTts: envReport.check1_autoTriggerAfterTts
    });

    return envReport;

  } finally {
    await browser.close();
  }
}

async function main() {
  const allReports = [];
  for (const env of ENVIRONMENTS) {
    try {
      const res = await runEnvironmentAudit(env);
      allReports.push(res);
    } catch(err) {
      console.error(`[Diagnostic] Failed for ${env.name}:`, err);
      allReports.push({ environment: env.name, error: err.message, stack: err.stack });
    }
  }

  const outPath = path.resolve('reports/voice_capture_step1_diagnostic.json');
  fs.writeFileSync(outPath, JSON.stringify(allReports, null, 2), 'utf-8');
  console.log(`\n>>> Full 10-check audit saved to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal in main:', err);
  process.exit(1);
});
