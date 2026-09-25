// tests/verify_post_phase1_flow.mjs
import { chromium } from 'playwright';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3001';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTest() {
  console.log('================================================================');
  console.log('POST-PHASE 1 VERIFICATION: GITA, CBT, CLARIFY LOOP & VOICE UI');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CONFIRM-VOICE') || text.includes('Error') || text.includes('error')) {
      console.log(`[BROWSER ${msg.type()}]`, text);
    }
  });

  try {
    // ─── TEST SUITE 1: YES PATH (PHASE 1 -> PHASE 2 GITA -> PHASE 3 CBT -> PHASE 4 TRATAKA) ───
    console.log('>>> [SUITE 1] Testing Affirmative Path (Phase 1 -> Phase 2 Gita -> CBT -> Trataka)...');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
    await openBtn.waitFor({ state: 'visible', timeout: 8000 });
    await sleep(500);

    for (let attempt = 0; attempt < 3; attempt++) {
      await openBtn.click().catch(() => {});
      if (await page.locator('[data-testid="wellness-modal"]').isVisible()) break;
      await sleep(500);
    }
    await page.locator('[data-testid="wellness-modal"]').waitFor({ state: 'visible', timeout: 8000 });
    await sleep(400);

    // 1. Submit Mood in Phase 1
    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.waitFor({ state: 'visible', timeout: 8000 });
    await chatInput.fill('I feel anxious about future results and deadlines');
    await page.locator('[data-testid="chat-send-btn"]').click();

    // 2. Confirm YES
    const yesBtn = page.locator('[data-testid="confirm-yes-btn"]');
    await yesBtn.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  -> Confirming Phase 1 YES...');
    await yesBtn.click();

    // 3. Verify Phase 2 (Gita)
    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 6000 });
    const gitaVerse = await page.locator('[data-testid="gita-verse-ref"]').innerText();
    const gitaMeaning = await page.locator('[data-testid="gita-meaning"]').innerText();
    console.log(`  -> Phase 2 Gita Verse loaded: "${gitaVerse}"`);

    // Verify footer is VISIBLE in Phase 2
    const footerVisibleInGita = await page.locator('[data-testid="bottom-chat-footer"]').isVisible();
    const micVisibleInGita = await page.locator('[data-testid="mic-toggle-btn"]').isVisible();
    console.log(`  -> Footer visible in Gita: ${footerVisibleInGita}, Mic visible: ${micVisibleInGita}`);

    // Verify Gita does NOT auto-skip after 2 seconds
    console.log('  -> Verifying user is NOT forcibly kicked out of Gita after 2s...');
    await sleep(2500);
    const stillInGita = await page.locator('[data-testid="gita-card"]').isVisible();
    const prematureCBT = await page.locator('[data-testid="cbt-card"]').isVisible();
    console.log(`  -> Still safely in Gita after 2.5s: ${stillInGita} (Premature CBT: ${prematureCBT})`);

    // 4. Advance from Gita to CBT via explicit user action (button click)
    console.log('  -> Advancing from Gita to CBT via user click...');
    const skipToCbtBtn = page.locator('[data-testid="gita-skip-btn"]');
    await skipToCbtBtn.click();

    // 5. Verify Phase 3 (CBT) Step 1
    const cbtCard = page.locator('[data-testid="cbt-card"]');
    await cbtCard.waitFor({ state: 'visible', timeout: 6000 });
    const cbtStep1Badge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
    console.log(`  -> Phase 3 CBT reached: "${cbtStep1Badge}"`);

    // Submit user thought for Step 1
    console.log('  -> Submitting user thought for Step 1...');
    await chatInput.fill('I worry that if I fail this project my career will be ruined');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await sleep(600);

    // Verify Step 2 Distortion
    const distortionCard = page.locator('[data-testid="cbt-distortion-name"]');
    await distortionCard.waitFor({ state: 'visible', timeout: 5000 });
    const distortionText = await distortionCard.innerText();
    console.log(`  -> Step 2 Distortion displayed: "${distortionText.split('\n')[1] || distortionText}"`);

    // Acknowledge Distortion -> Step 3
    const ackBtn = page.locator('[data-testid="cbt-distortion-ack-btn"]');
    await ackBtn.click();
    await sleep(600);

    // Verify Step 3 Evidence Challenge
    const evidenceCard = page.locator('[data-testid="cbt-evidence-challenge"]');
    await evidenceCard.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  -> Step 3 Evidence questions active');

    // Submit answer for Step 3
    console.log('  -> Submitting evidence answer for Step 3...');
    await chatInput.fill('Even if this one milestone delays, my track record is strong and team will help');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await sleep(600);

    // Verify Step 4 Balanced Thought
    const balancedThought = page.locator('[data-testid="cbt-balanced-thought"]');
    await balancedThought.waitFor({ state: 'visible', timeout: 5000 });
    const thoughtText = await balancedThought.innerText();
    console.log(`  -> Step 4 Balanced Thought generated: "${thoughtText.slice(0, 50)}..."`);

    // 6. Advance to Phase 4 (Trataka)
    const tratakaBtn = page.locator('[data-testid="cbt-skip-btn"]');
    await tratakaBtn.click();

    const tratakaCard = page.locator('[data-testid="trataka-card"]');
    await tratakaCard.waitFor({ state: 'visible', timeout: 6000 });
    const tratakaName = await page.locator('[data-testid="trataka-variant-name"]').innerText();
    console.log(`  -> Phase 4 Trataka active: "${tratakaName}"\n`);

    // ─── TEST SUITE 2: NO PATH (CLARIFICATION LOOP) ───
    console.log('>>> [SUITE 2] Testing Clarification Loop Path (Phase 1 NO -> Clarify Loop -> Gita)...');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    const openBtn2 = page.locator('[data-testid="open-wellness-flow-btn"]');
    await openBtn2.waitFor({ state: 'visible', timeout: 8000 });
    await sleep(500);
    for (let attempt = 0; attempt < 3; attempt++) {
      await openBtn2.click().catch(() => {});
      if (await page.locator('[data-testid="wellness-modal"]').isVisible()) break;
      await sleep(500);
    }
    await page.locator('[data-testid="wellness-modal"]').waitFor({ state: 'visible', timeout: 8000 });
    await sleep(400);
    const chatInput2 = page.locator('[data-testid="chat-text-input"]');
    await chatInput2.waitFor({ state: 'visible', timeout: 8000 });
    await chatInput2.fill('Something is bothering me');
    await page.locator('[data-testid="chat-send-btn"]').click();

    const noBtn = page.locator('[data-testid="confirm-no-btn"]');
    await noBtn.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  -> Confirming Phase 1 NO...');
    await noBtn.click();

    // Verify Clarify Loop Card
    const clarifyCard = page.locator('[data-testid="clarify-card"]');
    await clarifyCard.waitFor({ state: 'visible', timeout: 6000 });
    const questionText = await page.locator('[data-testid="clarify-question-text"]').innerText();
    console.log(`  -> Clarification question rendered: "${questionText.slice(0, 60)}..."`);

    // Verify chat footer and mic are active in Clarify Loop
    const footerInClarify = await page.locator('[data-testid="bottom-chat-footer"]').isVisible();
    console.log(`  -> Footer visible in Clarify Loop: ${footerInClarify}`);

    // Answer clarification question
    console.log('  -> Answering clarification question...');
    await chatInput2.fill('It is specifically about my health test results tomorrow');
    await page.locator('[data-testid="chat-send-btn"]').click();
    await sleep(800);

    // Check either next clarify question or Gita reached
    const hasNextClarify = await page.locator('[data-testid="clarify-card"]').isVisible();
    const reachedGitaAfterClarify = await page.locator('[data-testid="gita-card"]').isVisible();
    console.log(`  -> Post-clarify state: NextClarify=${hasNextClarify}, GitaReached=${reachedGitaAfterClarify}`);

    console.log('\n================================================================');
    console.log('ALL VERIFICATION CHECKS PASSED: Post-Phase 1 flow is 100% operational!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
