import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot } from './audio-test-helper';

test.describe('STEP 2: Mic Activation Test', () => {
  test('asserts mic button DOM element transitions to listening state within 1s of click', async ({ page }) => {
    // 1. Open modal with clean state & consent pre-granted
    await openWellnessModal(page, { grantStorageConsent: true });

    const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
    await micBtn.waitFor({ state: 'visible', timeout: 5000 });

    // Ensure it begins in idle state
    const initialState = await micBtn.getAttribute('data-state');
    console.log(`[STEP 2] Initial mic button state: "${initialState}"`);

    // If auto-start already placed it in listening, toggle it to idle first so we test user click activation
    if (await micBtn.getAttribute('data-state') === 'listening') {
      await micBtn.click();
      await expect(micBtn).toHaveAttribute('data-state', 'idle', { timeout: 1500 });
    }

    // 2. Perform real DOM click
    const startTime = Date.now();
    await micBtn.click();

    // 3. Assert data-state changes to 'listening' within 1000ms
    await expect(micBtn).toHaveAttribute('data-state', 'listening', { timeout: 1000 });
    const elapsedMs = Date.now() - startTime;
    console.log(`[STEP 2] Mic activation transition verified in ${elapsedMs}ms`);

    // 4. Capture screenshot artifact
    await captureStepSnapshot(page, 'step02-mic-activation-passed');
  });
});
