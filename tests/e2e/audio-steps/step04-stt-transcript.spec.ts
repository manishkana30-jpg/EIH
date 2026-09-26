import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 4: STT Transcript Test', () => {
  test('asserts transcript DOM element updates with non-empty text upon user vocalization', async ({ page }) => {
    // 1. Open modal fresh
    await openWellnessModal(page, { grantStorageConsent: true });

    await ensureMicListening(page);

    const testUtterance = 'I am feeling anxious about my upcoming exam';

    // 2. Inject speech recognition event / simulated speech stream into the controller
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, false, {
          rmsEnergy: 0.045,
          pitchHz: 180,
          pauseRatio: 0.1,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    }, testUtterance);

    // 3. Assert transcript DOM element updates with non-empty text
    const transcriptDisplay = page.locator('[data-testid="voice-transcript-display"]');
    const chatInput = page.locator('[data-testid="chat-text-input"]');

    // Either the dedicated transcript container or the synchronized input field receives text
    await expect.poll(async () => {
      const liveText = await transcriptDisplay.innerText().catch(() => '');
      const inputValue = await chatInput.inputValue().catch(() => '');
      return (liveText || inputValue).trim();
    }, {
      message: 'Expected transcript DOM element to contain non-empty speech text',
      timeout: 5000,
    }).not.toBe('');

    const capturedText = (await transcriptDisplay.innerText().catch(() => '')) || (await chatInput.inputValue());
    console.log(`[STEP 4] Live STT transcript captured: "${capturedText}"`);

    // 4. Capture screenshot artifact
    await captureStepSnapshot(page, 'step04-stt-transcript-passed');
  });
});
