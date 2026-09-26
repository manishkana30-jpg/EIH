import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot } from './audio-test-helper';

test.describe('STEP 8: Yes/No Voice Response Test', () => {
  test('Branch 8A: Voice "yes" response transitions session from Phase 1 to Phase 2 (Gita)', async ({ page }) => {
    await openWellnessModal(page, { grantStorageConsent: true });

    // Reach confirmation state
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.fill('I feel anxious about tomorrow');
    await page.locator('[data-testid="chat-send-btn"]').click();

    const confirmCard = page.locator('[data-testid="confirmation-card"]');
    await confirmCard.waitFor({ state: 'visible', timeout: 6000 });

    // Inject voice "yes" response into confirmation recognizer
    console.log('[STEP 8A] Injecting voice "yes" confirmation...');
    await page.evaluate(() => {
      if (window.confirmVoiceManager && typeof window.confirmVoiceManager.injectTranscript === 'function') {
        window.confirmVoiceManager.injectTranscript('yes, that is right');
      }
    });

    // Assert phase transitions to Phase 2 (Gita card visible, phase tracker index = 2)
    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 8000 });

    const phaseTracker = page.locator('[data-testid="phase-tracker"]');
    await expect(phaseTracker).toHaveAttribute('data-phase-index', '2', { timeout: 4000 });

    const gitaVerse = await page.locator('[data-testid="gita-verse-ref"]').innerText();
    console.log(`[STEP 8A] Successfully transitioned to Phase 2: ${gitaVerse}`);

    await captureStepSnapshot(page, 'step08a-voice-yes-passed');
  });

  test('Branch 8B: Voice "no" response diverts session into Clarification Loop', async ({ page }) => {
    await openWellnessModal(page, { grantStorageConsent: true });

    // Reach confirmation state
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.fill('Something feels off today');
    await page.locator('[data-testid="chat-send-btn"]').click();

    const confirmCard = page.locator('[data-testid="confirmation-card"]');
    await confirmCard.waitFor({ state: 'visible', timeout: 6000 });

    // Inject voice "no" response into confirmation recognizer
    console.log('[STEP 8B] Injecting voice "no" clarification diversion...');
    await page.evaluate(() => {
      if (window.confirmVoiceManager && typeof window.confirmVoiceManager.injectTranscript === 'function') {
        window.confirmVoiceManager.injectTranscript('no, not quite');
      }
    });

    // Assert clarification question appears
    const clarifyCard = page.locator('[data-testid="clarify-card"]');
    await clarifyCard.waitFor({ state: 'visible', timeout: 8000 });

    const clarifyQ = page.locator('[data-testid="clarify-question-text"]');
    await clarifyQ.waitFor({ state: 'visible', timeout: 4000 });
    const questionText = await clarifyQ.innerText();
    console.log(`[STEP 8B] Successfully entered Clarify Loop: "${questionText.slice(0, 60)}..."`);

    await captureStepSnapshot(page, 'step08b-voice-no-passed');
  });
});
