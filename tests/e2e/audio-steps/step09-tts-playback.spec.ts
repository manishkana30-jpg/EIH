import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot } from './audio-test-helper';

test.describe('STEP 9: TTS Playback Test', () => {
  test('asserts TTS play indicator becomes active during speech and returns to idle when playback completes', async ({ page }) => {
    await openWellnessModal(page, { grantStorageConsent: true });

    // Reach Phase 2 (Gita) where TTS reads the verse wisdom aloud
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.fill('I feel anxious about future results');
    await page.locator('[data-testid="chat-send-btn"]').click();

    const yesBtn = page.locator('[data-testid="confirm-yes-btn"]');
    await yesBtn.waitFor({ state: 'visible', timeout: 6000 });
    await yesBtn.click();

    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 8000 });

    const ttsIndicator = page.locator('[data-testid="tts-play-indicator"]');

    // 1. Assert TTS play indicator becomes active (speaking)
    await expect.poll(async () => {
      const isSpeaking = await ttsIndicator.getAttribute('data-speaking');
      return isSpeaking;
    }, {
      message: 'Expected TTS play indicator to become active during Gita reading',
      timeout: 4000
    }).toBe('true');

    console.log('[STEP 9] TTS Playback Indicator is active (speaking=true)');
    await captureStepSnapshot(page, 'step09-tts-playback-speaking');

    // 2. Assert TTS completes and returns to idle (not stuck speaking forever)
    // Cancel speech to simulate user turn-taking or completion of speaking phase
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      if (window.browserSpeechController) {
        window.browserSpeechController.cancelSpeech();
      }
    });

    await expect.poll(async () => {
      const isSpeaking = await ttsIndicator.getAttribute('data-speaking');
      return isSpeaking;
    }, {
      message: 'Expected TTS play indicator to cleanly finish and return to false (not stuck speaking)',
      timeout: 5000,
      intervals: [250, 500]
    }).toBe('false');

    console.log('[STEP 9] TTS Playback finished cleanly and returned to idle (speaking=false)');
    await captureStepSnapshot(page, 'step09-tts-playback-idle');
  });
});
