import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot } from './audio-test-helper';

test.describe('STEP 1: Mic Permission Grant Test', () => {
  test('asserts microphone permission shows granted in DOM and browser context after grant', async ({ page, context }) => {
    // 1. Grant permission via Playwright API
    await context.grantPermissions(['microphone']);

    // 2. Open modal with clean state
    await openWellnessModal(page, { grantStorageConsent: false });

    // 3. Click mic button (real DOM click)
    const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
    await micBtn.waitFor({ state: 'visible', timeout: 5000 });
    await micBtn.click();

    // If in-app privacy consent modal appears, click allow
    const consentModal = page.locator('[data-testid="mic-consent-modal"]');
    if (await consentModal.isVisible({ timeout: 1500 }).catch(() => false)) {
      const allowBtn = page.locator('[data-testid="mic-consent-allow-btn"]');
      await allowBtn.click();
    }

    // 4. Assert browser context permission state is 'granted'
    const permissionState = await page.evaluate(async () => {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return status.state;
      } catch (err: any) {
        return `error: ${err?.message}`;
      }
    });

    console.log(`[STEP 1] Browser microphone permission query: "${permissionState}"`);
    expect(permissionState).toBe('granted');

    // 5. Assert DOM permission indicator element reflects 'granted'
    const permIndicator = page.locator('[data-testid="audio-permission-status"]');
    await expect(permIndicator).toHaveAttribute('data-permission', 'granted', { timeout: 4000 });

    // 6. Capture screenshot artifact
    await captureStepSnapshot(page, 'step01-mic-permission-passed');
  });
});
