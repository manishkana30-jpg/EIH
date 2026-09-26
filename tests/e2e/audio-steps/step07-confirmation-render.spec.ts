import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 7: Confirmation Render Test', () => {
  test('asserts confirmation-question DOM element renders empathetic text referencing user emotion', async ({ page }) => {
    // 1. Open modal fresh
    await openWellnessModal(page, { grantStorageConsent: true });

    await ensureMicListening(page);

    const testUtterance = 'I feel angry and frustrated because my project was cancelled';

    // 2. Deliver final transcript
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, true, {
          rmsEnergy: 0.065,
          pitchHz: 195,
          pauseRatio: 0.08,
          speechRate: 'rapid',
          tremorDetected: true,
        });
      }
    }, testUtterance);

    // 3. Assert confirmation card appears
    const confirmCard = page.locator('[data-testid="confirmation-card"]');
    await confirmCard.waitFor({ state: 'visible', timeout: 6000 });

    // 4. Assert confirmation question has non-empty text referencing emotion
    const confirmQuestion = page.locator('[data-testid="confirmation-question"]');
    await confirmQuestion.waitFor({ state: 'visible', timeout: 4000 });
    const questionText = await confirmQuestion.innerText();
    console.log(`[STEP 7] Confirmation statement rendered: "${questionText}"`);

    expect(questionText.trim().length).toBeGreaterThan(10);
    // Emotion reference check (e.g. 'anger', 'frustrated', 'sounds like', 'feeling')
    expect(questionText.toLowerCase()).toMatch(/anger|frustrat|feeling|sounds like/i);

    // 5. Capture screenshot artifact
    await captureStepSnapshot(page, 'step07-confirmation-render-passed');
  });
});
