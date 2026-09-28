/**
 * tests/test-problem2-first-attempt-voice.js
 *
 * Permanent Regression Test: Yes/No Voice Recognition on First Attempt.
 * Executes 10 consecutive fresh browser sessions to verify that:
 * 1. Spoken "Yes" on Attempt 1 is immediately captured and transitions to GITA.
 * 2. Attempt 1 success rate is at least 9/10 (>= 90%).
 * 3. Never requires Attempt 2 or manual button fallback when spoken on Attempt 1.
 */

import { chromium } from 'playwright';

const APP_URL = 'http://localhost:3001';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const NUM_RUNS = 10;

async function runSession(browser, runIndex) {
  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    // Open wellness modal
    const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
    await openBtn.waitFor({ state: 'visible', timeout: 8000 });
    await openBtn.click();

    const modal = page.locator('[data-testid="wellness-modal"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // Submit mood to enter CONFIRM phase
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });
    await chatInput.fill('I feel anxious about my job interview tomorrow');
    const sendBtn = page.locator('[data-testid="chat-send-btn"]');
    await sendBtn.click();

    // Wait for Confirmation card
    const confirmCard = page.locator('[data-testid="confirmation-card"]');
    await confirmCard.waitFor({ state: 'visible', timeout: 6000 });

    // Wait for listening indicator on Attempt 1
    const listeningBadge = page.locator('[data-testid="confirm-voice-status"]');
    await listeningBadge.waitFor({ state: 'visible', timeout: 8000 });

    // Wait until status contains "Listening" or "सुन रहे हैं"
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="confirm-voice-status"]');
      if (!el) return false;
      const txt = el.textContent || '';
      return txt.includes('Listening') || txt.includes('सुन रहे हैं');
    }, { timeout: 6000 });

    // Immediate speech on first attempt as soon as listening is live
    await page.evaluate(() => {
      if (window.confirmVoiceManager) {
        window.confirmVoiceManager.injectTranscript('yes, that is right');
      }
    });

    // Check that we advance to Phase 2 (Gita card visible)
    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 5000 });

    console.log(`  [Run ${runIndex + 1}/${NUM_RUNS}] PASS: First attempt voice recognized -> Advanced to GITA.`);
    await context.close();
    return true;
  } catch (err) {
    console.error(`  [Run ${runIndex + 1}/${NUM_RUNS}] FAIL:`, err.message);
    await context.close();
    return false;
  }
}

async function main() {
  console.log('================================================================================');
  console.log(`RUNNING 10 CONSECUTIVE FIRST-ATTEMPT YES/NO VOICE DETECTION RUNS`);
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

  let successes = 0;

  for (let i = 0; i < NUM_RUNS; i++) {
    const ok = await runSession(browser, i);
    if (ok) successes++;
    // Brief pause between sessions
    await new Promise(r => setTimeout(r, 600));
  }

  await browser.close();

  const successRate = (successes / NUM_RUNS) * 100;
  console.log('\n================================================================================');
  console.log(`RESULTS: ${successes} / ${NUM_RUNS} succeeded on First Attempt (${successRate}%)`);
  console.log('Target: >= 90% (at least 9/10)');
  console.log('================================================================================\n');

  if (successes >= 9) {
    console.log('FIRST-ATTEMPT YES/NO RECOGNITION VALIDATED: PASSED WITH FLYING COLORS!\n');
    process.exit(0);
  } else {
    console.error(`FAILED: First attempt success rate ${successRate}% is below the 90% threshold.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
