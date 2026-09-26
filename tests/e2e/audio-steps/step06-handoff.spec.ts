import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 6: Audio Handoff Test', () => {
  test('asserts mic transitions to processing and hands off to Phase 1 confirmation logic without skipping', async ({ page }) => {
    // 1. Open modal fresh
    await openWellnessModal(page, { grantStorageConsent: true });

    await ensureMicListening(page);

    const finalUtterance = 'I feel worried about my job security and career future';

    // 2. Deliver final transcript with isFinal=true
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, true, {
          rmsEnergy: 0.052,
          pitchHz: 168,
          pauseRatio: 0.15,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    }, finalUtterance);

    // 3. Assert phase indicator still shows Phase 1 (not skipped to Phase 2/3/4)
    const phaseTracker = page.locator('[data-testid="phase-tracker"]');
    await expect(phaseTracker).toHaveAttribute('data-phase-index', '1', { timeout: 5000 });

    // State machine should transition to CONFIRM within Phase 1
    const phaseState = page.locator('[data-testid="phase-state-indicator"]');
    await expect.poll(async () => {
      const phase = await phaseState.getAttribute('data-phase');
      return phase;
    }, {
      message: 'Expected Phase 1 state to transition to CONFIRM upon speech handoff',
      timeout: 5000
    }).toBe('CONFIRM');

    console.log('[STEP 6] Handoff successful: State transitioned to Phase 1 CONFIRM');

    // 4. Capture screenshot artifact
    await captureStepSnapshot(page, 'step06-handoff-passed');
  });
});
