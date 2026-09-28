const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    permissions: ['microphone']
  });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('HEALER') || text.includes('Voice') || text.includes('stage') || text.includes('STAGE') || text.includes('KARAOKE')) {
      console.log(`[CONSOLE ${msg.type()}]`, text);
    }
  });

  page.on('pageerror', err => console.error('[PAGE ERROR]', err));
  page.on('requestfailed', req => console.error('[REQ FAILED]', req.url(), req.failure()?.errorText));

  console.log('Navigating to http://localhost:3001 ...');
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Dismiss consent if any
  const consentBtn = page.locator('button:has-text("Grant"), button:has-text("स्वीकारें"), button:has-text("Consent"), button:has-text("Accept"), [data-testid="mic-consent-allow-btn"]').first();
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Clicking consent button...');
    await consentBtn.click();
    await page.waitForTimeout(500);
  }

  // Turn 1
  console.log('\n--- SENDING TURN 1: "कुछ अच्छा नहीं लग रहा है" ---');
  const input = page.locator('[data-testid="main-chat-input"]');
  await input.fill('कुछ अच्छा नहीं लग रहा है');
  const sendBtn = page.locator('[data-testid="main-chat-send-btn"]');
  await sendBtn.click();

  console.log('Waiting for AI response (up to 25s)...');
  const sanctuaryHeader = page.locator('[data-testid="sanctuary-healer-title"]').first();
  await sanctuaryHeader.waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForTimeout(2000);

  // Inspect DOM
  const stepBadge = await page.locator('[data-testid="sanctuary-step-badge"]').first().innerText().catch(() => 'NOT FOUND');
  console.log('Step Badge:', stepBadge);

  const card1Text = await page.locator('[data-testid="sanctuary-stage-1-card"]').first().innerText().catch(() => 'NOT FOUND');
  console.log('Card 1 Text (first 120 chars):', card1Text.replace(/\n/g, ' ').slice(0, 120));

  const card2Visible = await page.locator('[data-testid="sanctuary-stage-2-card"]').first().isVisible().catch(() => false);
  console.log('Card 2 Visible?:', card2Visible);

  const card3Visible = await page.locator('[data-testid="sanctuary-stage-3-card"]').first().isVisible().catch(() => false);
  console.log('Card 3 Visible?:', card3Visible);

  const card4Visible = await page.locator('[data-testid="sanctuary-stage-4-card"]').first().isVisible().catch(() => false);
  console.log('Card 4 Visible?:', card4Visible);

  // Check if any error card or generic fallback greeting is visible
  const genericGreeting = await page.locator('text="मैं आपकी पूरी सहायता के लिए यहाँ उपस्थित हूँ"').count();
  console.log('Generic Greeting Count:', genericGreeting);

  const errorCards = await page.locator('.border-red-500').count();
  console.log('Error Cards Count:', errorCards);

  // Turn 2
  console.log('\n--- SENDING TURN 2: "जी हां / टेंशन हो रही है" ---');
  await input.fill('जी हां / टेंशन हो रही है');
  await sendBtn.click();

  console.log('Waiting for Turn 2 response/advancement (up to 15s)...');
  await page.waitForTimeout(4000);

  const stepBadge2 = await page.locator('[data-testid="sanctuary-step-badge"]').first().innerText().catch(() => 'NOT FOUND');
  console.log('Step Badge after Turn 2:', stepBadge2);

  const card2VisibleAfterTurn2 = await page.locator('[data-testid="sanctuary-stage-2-card"]').first().isVisible().catch(() => false);
  console.log('Card 2 Visible after Turn 2?:', card2VisibleAfterTurn2);
  if (card2VisibleAfterTurn2) {
    const card2Text = await page.locator('[data-testid="sanctuary-stage-2-card"]').first().innerText().catch(() => '');
    console.log('Card 2 Text snippet:', card2Text.replace(/\n/g, ' ').slice(0, 160));
  }

  await browser.close();
})().catch(console.error);
