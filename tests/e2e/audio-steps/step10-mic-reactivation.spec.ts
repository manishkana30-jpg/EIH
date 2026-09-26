import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 10: Mic Reactivation After TTS Test', () => {
  test('asserts mic cleanly reactivates and audio signal captures a second time in the same session after TTS finishes', async ({ page }) => {
    await openWellnessModal(page, { grantStorageConsent: true });

    // Cycle 1: First activation in Phase 1
    await ensureMicListening(page);

    const audioMeter = page.locator('[data-testid="live-audio-meter"]');
    await expect(audioMeter).toBeVisible({ timeout: 3000 });
    console.log('[STEP 10] Cycle 1 Mic active and capturing audio');

    // Deliver speech to transition to confirmation
    await page.evaluate(() => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript('I feel stressed out', true, {
          rmsEnergy: 0.05,
          pitchHz: 160,
          pauseRatio: 0.1,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    });

    const yesBtn = page.locator('[data-testid="confirm-yes-btn"]');
    await yesBtn.waitFor({ state: 'visible', timeout: 6000 });

    // Transition to Phase 2 (Gita) where TTS plays
    await yesBtn.click();
    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 8000 });

    // Wait for TTS to complete or cancel it to simulate turn-taking completion
    const ttsIndicator = page.locator('[data-testid="tts-play-indicator"]');
    // Ensure TTS was either played or finishes
    await page.evaluate(() => {
      if (window.browserSpeechController) {
        window.browserSpeechController.cancelSpeech();
      }
    });
    await expect(ttsIndicator).toHaveAttribute('data-speaking', 'false', { timeout: 3000 });
    console.log('[STEP 10] Assistant speech ended; attempting Cycle 2 Mic Activation...');

    // Advance to Phase 3 (CBT) where user mic input is enabled
    const advanceCbtBtn = page.locator('[data-testid="gita-skip-btn"]');
    await advanceCbtBtn.click();
    const cbtCard = page.locator('[data-testid="cbt-card"]');
    await cbtCard.waitFor({ state: 'visible', timeout: 6000 });

    // Cycle 2: Reactivate Microphone in the same session!
    await ensureMicListening(page);
    console.log('[STEP 10] Cycle 2 Mic activated successfully (data-state=listening)');

    // Re-verify Step 3: Audio signal received on the re-opened mic stream
    await expect(audioMeter).toBeVisible({ timeout: 3000 });
    await expect.poll(async () => {
      const level = parseFloat((await audioMeter.getAttribute('data-audio-level')) || '0');
      return level;
    }, {
      message: 'Expected Cycle 2 microphone to capture non-zero audio signal',
      timeout: 5000,
    }).toBeGreaterThan(0);

    const reActivatedLevel = await audioMeter.getAttribute('data-audio-level');
    console.log(`[STEP 10] Cycle 2 Audio signal verified: level=${reActivatedLevel}`);

    await captureStepSnapshot(page, 'step10-mic-reactivation-passed');
  });
});
