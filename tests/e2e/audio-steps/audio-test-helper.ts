import { Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'reports/screenshots/audio-steps');

export function ensureScreenshotDir(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

export async function openWellnessModal(page: Page, options: { grantStorageConsent?: boolean } = { grantStorageConsent: true }): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_TEST__ = true;
    localStorage.setItem('disable_auto_reload', 'true');
  });

  if (options.grantStorageConsent) {
    await page.addInitScript(() => {
      localStorage.setItem('eih_mic_consent_granted', 'true');
      localStorage.setItem('wellness_mic_consent', 'true');
    });
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('eih_mic_consent_granted');
      localStorage.removeItem('wellness_mic_consent');
    });
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  if (options.grantStorageConsent) {
    await page.evaluate(() => {
      localStorage.setItem('eih_mic_consent_granted', 'true');
      localStorage.setItem('wellness_mic_consent', 'true');
    });
  } else {
    await page.evaluate(() => {
      localStorage.removeItem('eih_mic_consent_granted');
      localStorage.removeItem('wellness_mic_consent');
    });
  }

  const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
  await openBtn.waitFor({ state: 'visible', timeout: 10000 });
  
  const modal = page.locator('[data-testid="wellness-modal"]');
  for (let i = 0; i < 3; i++) {
    await openBtn.click().catch(() => {});
    if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(400);

  // If consent modal appears and grantStorageConsent is true, click allow
  if (options.grantStorageConsent) {
    const allowBtn = page.locator('[data-testid="mic-consent-allow-btn"]');
    if (await allowBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await allowBtn.click();
      await page.waitForTimeout(400);
    }
  }
}

export async function captureStepSnapshot(page: Page, stepName: string): Promise<string> {
  ensureScreenshotDir();
  const filePath = path.join(SCREENSHOTS_DIR, `${stepName}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

export async function ensureMicListening(page: Page): Promise<void> {
  const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
  await micBtn.waitFor({ state: 'visible', timeout: 5000 });
  const currentState = await micBtn.getAttribute('data-state');
  if (currentState !== 'listening') {
    await micBtn.click();
  }
  // If auto-greeting was canceling speech or transitioning, confirm listening within timeout
  await expect(micBtn).toHaveAttribute('data-state', 'listening', { timeout: 3000 });
}
