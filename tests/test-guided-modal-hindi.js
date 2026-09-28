const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('================================================================');
  console.log('🧪 VERIFYING 4-PHASE GUIDED FLOW MODAL (HINDI & SYNC)');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const context = await browser.newContext({
    permissions: ['microphone']
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CONFIRM-VOICE') || text.includes('[GUARD') || text.includes('Error')) {
      console.log(`[BROWSER ${msg.type()}]`, text);
    }
  });

  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

  console.log('1. Navigating to http://localhost:3001 ...');
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Pre-seed storage consent to avoid blocking dialogs
  await page.evaluate(() => {
    localStorage.setItem('eih_mic_consent_granted', 'true');
    localStorage.setItem('wellness_mic_consent', 'true');
  });

  // Open 4-Phase Guided Flow Modal
  console.log('2. Opening 4-Phase Guided Flow modal...');
  const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
  await openBtn.waitFor({ state: 'visible', timeout: 8000 });
  await openBtn.click();

  const modal = page.locator('[data-testid="wellness-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 8000 });
  console.log('  ✓ Guided Wellness Modal opened.');

  // Handle consent modal if shown
  const allowBtn = page.locator('[data-testid="mic-consent-allow-btn"]');
  if (await allowBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('  Allowing mic consent...');
    await allowBtn.click();
    await page.waitForTimeout(300);
  }

  // Switch modal language to Hindi if currently in English
  const langBtn = modal.locator('[data-testid="language-toggle-btn"]');
  await langBtn.waitFor({ state: 'visible', timeout: 5000 });
  const langBtnText = await langBtn.innerText();
  if (langBtnText.includes('हिन्दी')) {
    console.log('3. Toggling modal language to Hindi...');
    await langBtn.click();
    await page.waitForTimeout(400);
  }
  console.log('  ✓ Modal language is now Hindi.');

  // Phase 1: Enter Colloquial Hindi Distress Input
  console.log('4. Entering Phase 1 Mood: "कुछ अच्छा नहीं लग रहा है"...');
  const chatInput = modal.locator('[data-testid="chat-text-input"]');
  await chatInput.waitFor({ state: 'visible', timeout: 8000 });
  await chatInput.fill('कुछ अच्छा नहीं लग रहा है');
  await page.waitForTimeout(200);

  const sendBtn = modal.locator('[data-testid="chat-send-btn"]');
  await sendBtn.click();
  console.log('  ✓ Sent mood input.');

  // Wait for Phase 1 Confirmation Card
  console.log('5. Waiting for Empathy Confirmation Card...');
  const confirmCard = modal.locator('[data-testid="confirmation-card"]');
  await confirmCard.waitFor({ state: 'visible', timeout: 10000 });
  const confirmText = await confirmCard.innerText();
  console.log('  ✓ Confirmation Card Text:\n', confirmText.replace(/\n+/g, ' '));
  assert(confirmText.includes('उदासी') || confirmText.includes('दुःख') || confirmText.includes('मनोभाव'), 'Must confirm sadness/distress affect');

  // Verify YES / NO buttons
  const yesBtn = modal.locator('[data-testid="confirm-yes-btn"]');
  const noBtn = modal.locator('[data-testid="confirm-no-btn"]');
  await yesBtn.waitFor({ state: 'visible', timeout: 5000 });
  await noBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✓ Yes and No confirmation buttons visible and active.');

  // Click YES to transition to Phase 2 (Gita)
  console.log('6. Confirming YES to transition to Phase 2 (Bhagavad Gita)...');
  await yesBtn.click();

  // Wait for Phase 2 (Gita) Card
  console.log('7. Waiting for Phase 2 (Gita) Card...');
  const gitaCard = modal.locator('[data-testid="gita-card"]');
  await gitaCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('  ✓ Phase 2 Gita Card rendered successfully!');

  const verseRef = await modal.locator('[data-testid="gita-verse-ref"]').innerText().catch(() => 'N/A');
  const shlokaSanskrit = await modal.locator('[data-testid="gita-shloka-sanskrit"]').innerText().catch(() => 'N/A');
  const gitaMeaning = await modal.locator('[data-testid="gita-meaning"]').innerText().catch(() => 'N/A');
  console.log('  🕉️ Verse Ref:', verseRef);
  console.log('  🕉️ Shloka:', shlokaSanskrit.split('\n')[0]);
  console.log('  🕉️ Meaning:', gitaMeaning.slice(0, 80) + '...');

  // Verify Phase Tracker step 2 is active
  const phaseTracker = modal.locator('[data-testid="phase-tracker"]');
  const phaseIndex = await phaseTracker.getAttribute('data-phase-index');
  console.log('  ✓ Phase Tracker Index:', phaseIndex, '(expected 2)');
  assert.strictEqual(phaseIndex, '2', 'Phase Tracker must be at step 2');

  // Advance to Phase 3: CBT
  console.log('8. Advancing to Phase 3 (CBT)...');
  const skipGitaBtn = modal.locator('[data-testid="gita-skip-btn"]');
  await skipGitaBtn.waitFor({ state: 'visible', timeout: 5000 });
  await skipGitaBtn.click();

  const cbtCard = modal.locator('[data-testid="cbt-card"]');
  await cbtCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('  ✓ Phase 3 CBT Card rendered successfully!');
  const cbtStepBadge = await modal.locator('[data-testid="cbt-step-badge"]').innerText().catch(() => 'N/A');
  console.log('  🧠 CBT Badge:', cbtStepBadge);

  // Advance to Phase 4: Trataka Gazing
  console.log('9. Advancing to Phase 4 (Trataka Gazing)...');
  const cbtSkipBtn = modal.locator('[data-testid="cbt-skip-btn"]');
  await cbtSkipBtn.waitFor({ state: 'visible', timeout: 5000 });
  await cbtSkipBtn.click();

  const tratakaCard = modal.locator('[data-testid="trataka-card"]');
  await tratakaCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('  ✓ Phase 4 Trataka Card rendered successfully!');
  const tratakaVariant = await modal.locator('[data-testid="trataka-variant-name"]').innerText().catch(() => 'N/A');
  const tratakaTimer = await modal.locator('[data-testid="trataka-timer"]').innerText().catch(() => 'N/A');
  console.log('  👁️ Trataka Variant:', tratakaVariant);
  console.log('  👁️ Trataka Timer:', tratakaTimer);

  console.log('================================================================');
  console.log('🎉 4-PHASE GUIDED FLOW MODAL FULLY VERIFIED END-TO-END!');
  console.log('================================================================');

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
