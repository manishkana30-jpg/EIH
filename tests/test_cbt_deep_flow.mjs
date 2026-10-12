import { chromium } from 'playwright';

async function testFullCbtFlow() {
  console.log('Testing full 4-step CBT interactive flow in GuidedWellnessConversation...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__PLAYWRIGHT_TEST__ = true;
    localStorage.setItem('disable_auto_reload', 'true');
    localStorage.setItem('eih_mic_consent_granted', 'true');
    localStorage.setItem('wellness_mic_consent', 'true');
  });

  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Click start wellness
  const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
  await openBtn.waitFor({ state: 'visible', timeout: 12000 });
  await openBtn.click();

  const modal = page.locator('[data-testid="wellness-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 8000 });

  // Cancel any speaking
  await page.evaluate(() => {
    if (window.browserSpeechController) {
      window.browserSpeechController.cancelSpeech();
    }
  });

  // Step 1: Mood Input
  console.log('1. Submitting Mood Input (Anxiety)...');
  await page.locator('[data-testid="chat-text-input"]').fill("I am experiencing terrible panic and anxiety about failing my presentation tomorrow.");
  await page.locator('[data-testid="chat-send-btn"]').click();

  // Phase 1: Confirmation
  const confirmCard = page.locator('[data-testid="confirmation-card"]');
  await confirmCard.waitFor({ state: 'visible', timeout: 8000 });
  console.log('2. Phase 1 Confirmation visible. Clicking YES...');
  await page.locator('[data-testid="confirm-yes-btn"]').click();

  // Phase 2: Gita Card
  const gitaCard = page.locator('[data-testid="gita-card"]');
  await gitaCard.waitFor({ state: 'visible', timeout: 8000 });
  const gitaVerse = await page.locator('[data-testid="gita-verse-ref"]').innerText();
  console.log(`3. Phase 2 Gita loaded: "${gitaVerse}". Advancing to CBT...`);

  await page.locator('[data-testid="gita-skip-btn"]').click();

  // Phase 3: CBT Card
  const cbtCard = page.locator('[data-testid="cbt-card"]');
  await cbtCard.waitFor({ state: 'visible', timeout: 8000 });
  
  let stepBadge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
  console.log(`4. Phase 3 CBT Active! Initial Step: "${stepBadge}"`);

  // Verify Step 1 Automatic Thought Prompt
  const autoThoughtPrompt = await page.locator('[data-testid="cbt-automatic-thought"]').innerText();
  console.log(`   -> Step 1 Prompt: ${autoThoughtPrompt.replace(/\n/g, ' ')}`);

  // Now, INSTEAD OF SKIPPING, let's actually engage in Step 1!
  console.log('5. User speaks/types Step 1 Automatic Thought...');
  await page.locator('[data-testid="chat-text-input"]').fill("I keep thinking that if I stutter or forget a slide, the whole executive team will think I'm completely incompetent and fire me.");
  await page.locator('[data-testid="chat-send-btn"]').click();
  await page.waitForTimeout(600);

  // Check Step 2
  stepBadge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
  console.log(`6. Step advanced to: "${stepBadge}"`);
  const distortionName = await page.locator('[data-testid="cbt-distortion-name"]').innerText();
  console.log(`   -> Step 2 Distortion: ${distortionName.replace(/\n/g, ' ')}`);

  // Acknowledge Distortion (Step 2 -> Step 3)
  console.log('7. User clicks Challenge Thought button...');
  const ackBtn = page.locator('[data-testid="cbt-distortion-ack-btn"]');
  await ackBtn.click();
  await page.waitForTimeout(600);

  // Check Step 3
  stepBadge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
  console.log(`8. Step advanced to: "${stepBadge}"`);
  const evidenceChallenge = await page.locator('[data-testid="cbt-evidence-challenge"]').innerText();
  console.log(`   -> Step 3 Evidence Challenge: ${evidenceChallenge.replace(/\n/g, ' ')}`);

  // Answer Step 3 Evidence Challenge (Step 3 -> Step 4)
  console.log('9. User speaks/types Step 3 Evidence Response...');
  await page.locator('[data-testid="chat-text-input"]').fill("In reality, I've prepared all the data, my previous two presentations went well, and even if I stumble on one slide, they care about the core numbers.");
  await page.locator('[data-testid="chat-send-btn"]').click();
  await page.waitForTimeout(600);

  // Check Step 4
  stepBadge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
  console.log(`10. Step advanced to: "${stepBadge}"`);
  const balancedThought = await page.locator('[data-testid="cbt-balanced-thought"]').innerText();
  const actionStep = await page.locator('[data-testid="cbt-action-step"]').innerText();
  console.log(`   -> Step 4 Balanced Thought: "${balancedThought}"`);
  console.log(`   -> Step 4 Action Step: "${actionStep}"`);

  // Now advance to Trataka
  console.log('11. Advancing from completed CBT Step 4 to Trataka...');
  await page.locator('[data-testid="cbt-skip-btn"]').click();

  const tratakaCard = page.locator('[data-testid="trataka-card"]');
  await tratakaCard.waitFor({ state: 'visible', timeout: 8000 });
  const tratakaName = await page.locator('[data-testid="trataka-variant-name"]').innerText();
  console.log(`12. Phase 4 Trataka Active: "${tratakaName}"`);

  await browser.close();
  console.log('SUCCESS: Full 4-step CBT interactive flow verified successfully!');
}

testFullCbtFlow().catch(err => {
  console.error('CBT Test Error:', err);
  process.exit(1);
});
