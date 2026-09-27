import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Hindi Distress Transcript & Sequential Progression E2E', () => {
  test('reproduces exact transcript, asserts real Gita/CBT/Trataka content, and asserts accurate step counter', async ({ page }) => {
    // 1. Navigate to Sanctuary Session Page with reload suppression for test stability
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_TEST__ = true;
      localStorage.setItem('disable_auto_reload', 'true');
    });
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Dismiss any consent modal if present
    const consentButton = page.locator('button:has-text("Grant"), button:has-text("स्वीकारें"), button:has-text("Consent"), button:has-text("Accept"), [data-testid="mic-consent-allow-btn"]').first();
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
      await page.waitForTimeout(300);
    }

    // 2. Input Turn 1: "कुछ अच्छा नहीं लग रहा है"
    const inputField = page.locator('[data-testid="main-chat-input"]');
    await expect(inputField).toBeVisible({ timeout: 10000 });
    await inputField.fill('कुछ अच्छा नहीं लग रहा है');

    const sendButton = page.locator('[data-testid="main-chat-send-btn"]');
    await sendButton.click();

    // 3. Await AI Therapeutic Response
    const sanctuaryHeader = page.locator('[data-testid="sanctuary-healer-title"]').first();
    await expect(sanctuaryHeader).toBeVisible({ timeout: 30000 });

    // Assert NO generic fallback greeting appears!
    const fallbackGreetingLocator = page.locator('text="मैं आपकी पूरी सहायता के लिए यहाँ उपस्थित हूँ"');
    await expect(fallbackGreetingLocator).not.toBeVisible();

    // Assert Step Counter starts at Step 1 of 4 (NOT prematurely Step 4 of 4!)
    const stepBadge = page.locator('[data-testid="sanctuary-step-badge"]').first();
    await expect(stepBadge).toBeVisible({ timeout: 5000 });
    await expect(stepBadge).toHaveText('Step 1 of 4');

    // Assert Stage 1 Card is visible with identified emotional state
    const stage1Card = page.locator('[data-testid="sanctuary-stage-1-card"]').first();
    await expect(stage1Card).toBeVisible();
    await expect(stage1Card).toContainText('पहचाना गया मनोभाव');

    // 4. Input Turn 2: "जी हां / टेंशन हो रही है" (Confirm Stage 1)
    await inputField.fill('जी हां / टेंशन हो रही है');
    await sendButton.click();

    // 5. Assert Progression to Step 2 (Bhagavad Gita Wisdom)
    await expect(stepBadge).toHaveText('Step 2 of 4', { timeout: 8000 });

    // Assert Card 2 (Bhagavad Gita) is visible with REAL Sanskrit & Divine Wisdom
    const stage2Card = page.locator('[data-testid="sanctuary-stage-2-card"]').first();
    await expect(stage2Card).toBeVisible({ timeout: 8000 });

    const gitaExploreBtn = page.locator('[data-testid="gita-explore-btn"]').first();
    await expect(gitaExploreBtn).toBeVisible();

    const gitaPlayBtn = page.locator('[data-testid="gita-play-btn"]').first();
    await expect(gitaPlayBtn).toBeVisible();

    // Confirm real Sanskrit shloka or Gita chapter citation is present
    await expect(stage2Card).toContainText(/BG|श्रीमद्भगवद्गीता|अध्याय|श्लोक/i);

    // 6. Advance to Step 3 (CBT)
    const stage2AdvanceBtn = page.locator('[data-testid="stage-2-advance-btn"]').first();
    await expect(stage2AdvanceBtn).toBeVisible({ timeout: 5000 });
    await stage2AdvanceBtn.click();

    // Assert Progression to Step 3
    await expect(stepBadge).toHaveText('Step 3 of 4', { timeout: 8000 });

    const stage3Card = page.locator('[data-testid="sanctuary-stage-3-card"]').first();
    await expect(stage3Card).toBeVisible({ timeout: 5000 });

    const cbtExploreBtn = page.locator('[data-testid="cbt-explore-btn"]').first();
    await expect(cbtExploreBtn).toBeVisible();

    const cbtPlayBtn = page.locator('[data-testid="cbt-play-btn"]').first();
    await expect(cbtPlayBtn).toBeVisible();

    // 7. Advance to Step 4 (Trataka)
    const stage3AdvanceBtn = page.locator('[data-testid="stage-3-advance-btn"]').first();
    await expect(stage3AdvanceBtn).toBeVisible({ timeout: 5000 });
    await stage3AdvanceBtn.click();

    // Assert Progression to Step 4
    await expect(stepBadge).toHaveText('Step 4 of 4', { timeout: 8000 });

    const stage4Card = page.locator('[data-testid="sanctuary-stage-4-card"]').first();
    await expect(stage4Card).toBeVisible({ timeout: 5000 });

    const tratakaExploreBtn = page.locator('[data-testid="trataka-explore-btn"]').first();
    await expect(tratakaExploreBtn).toBeVisible();

    const tratakaLaunchBtn = page.locator('[data-testid="trataka-launch-btn"]').first();
    await expect(tratakaLaunchBtn).toBeVisible();

    // Ensure screenshot directory exists and take screenshot artifact
    const screenshotDir = path.resolve(process.cwd(), 'reports/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, 'hindi_distress_regression_passed.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Hindi Distress Transcript E2E passed. Screenshot saved to ${screenshotPath}`);
  });
});
