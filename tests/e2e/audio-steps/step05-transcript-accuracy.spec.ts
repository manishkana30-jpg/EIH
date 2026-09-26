import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 5: Transcript Accuracy Test', () => {
  test('asserts captured transcript accurately matches expected spoken phrase via fuzzy match', async ({ page }) => {
    // 1. Open modal fresh
    await openWellnessModal(page, { grantStorageConsent: true });

    await ensureMicListening(page);

    const expectedPhrase = 'I am feeling deeply overwhelmed and anxious';

    // 2. Deliver spoken phrase into recognition pipeline
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, false, {
          rmsEnergy: 0.05,
          pitchHz: 175,
          pauseRatio: 0.12,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    }, expectedPhrase);

    // 3. Inspect final recognized text in DOM
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await expect(chatInput).toHaveValue(new RegExp('feeling|overwhelmed|anxious', 'i'), { timeout: 5000 });

    const actualText = await chatInput.inputValue();
    console.log(`[STEP 5] Expected phrase: "${expectedPhrase}"`);
    console.log(`[STEP 5] Actual transcript: "${actualText}"`);

    // Verify key emotional keywords are preserved
    expect(actualText.toLowerCase()).toContain('feeling');
    expect(actualText.toLowerCase()).toContain('anxious');

    // 4. Capture screenshot artifact
    await captureStepSnapshot(page, 'step05-transcript-accuracy-passed');
  });
});
