import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 3: Audio Signal Test', () => {
  test('asserts volume/amplitude indicator DOM element receives signal and changes value', async ({ page }) => {
    // 1. Open modal fresh
    await openWellnessModal(page, { grantStorageConsent: true });

    // 2. Wait for mic to be actively listening
    await ensureMicListening(page);

    // 3. Locate live audio meter
    const audioMeter = page.locator('[data-testid="live-audio-meter"]');
    await audioMeter.waitFor({ state: 'visible', timeout: 4000 });

    // 4. Assert volume / amplitude indicator visibly registers signal (> 0)
    // The fake audio device in Chromium produces a 1kHz tone with non-zero amplitude
    await expect.poll(async () => {
      const levelAttr = await audioMeter.getAttribute('data-audio-level');
      const level = parseFloat(levelAttr || '0');
      return level;
    }, {
      message: 'Expected live audio meter to register non-zero amplitude level from virtual audio stream',
      timeout: 5000,
      intervals: [100, 250, 500]
    }).toBeGreaterThan(0);

    const capturedLevel = await audioMeter.getAttribute('data-audio-level');
    const capturedPct = await audioMeter.getAttribute('data-audio-percentage');
    console.log(`[STEP 3] Live audio signal captured: level=${capturedLevel} (${capturedPct}%)`);

    // 5. Capture screenshot artifact
    await captureStepSnapshot(page, 'step03-audio-signal-passed');
  });
});
