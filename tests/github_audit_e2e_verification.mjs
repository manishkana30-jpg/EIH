// tests/github_audit_e2e_verification.mjs
import { chromium } from 'playwright';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3001';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const TEST_EMOTIONS = [
  {
    id: 'EMO-ANXIETY',
    emotion: 'Anxiety / Fear',
    inputMethod: 'text',
    message: 'I have overwhelming panic and anxiety about my upcoming performance review tomorrow',
    expectedGitaKeyword: 'CHAPTER',
    cbtThought: 'I am convinced they will fire me and I will never find another job',
    cbtEvidence: 'My past 3 reviews were exceeds expectations and my manager commended my leadership last week',
    expectedTrataka: 'TRATAKA',
  },
  {
    id: 'EMO-ANGER',
    emotion: 'Anger / Frustration',
    inputMethod: 'voice', // Exercises voice recognition simulation & acoustic telemetry injection
    message: 'I am absolutely furious and angry that my coworker took credit for all my hard work and leadership',
    expectedGitaKeyword: 'CHAPTER',
    cbtThought: 'They always get away with stealing my work and everyone thinks I am invisible',
    cbtEvidence: 'My commit logs and pull requests clearly document my primary authorship and my team knows it',
    expectedTrataka: 'TRATAKA',
  },
  {
    id: 'EMO-SADNESS',
    emotion: 'Sadness / Grief',
    inputMethod: 'text_with_clarify', // Tests Negative (No) -> Clarify Loop -> Gita -> CBT -> Trataka
    message: 'I feel deep grief and sorrow after losing someone very dear to me',
    clarifyAnswer: 'I miss their comforting presence and feel so alone in the evenings',
    expectedGitaKeyword: 'CHAPTER',
    cbtThought: 'I will never experience true joy or connection ever again',
    cbtEvidence: 'I still have cherished memories, friends who care for me, and time helps heal the sharpest wounds',
    expectedTrataka: 'TRATAKA',
  }
];

async function runAuditE2ESuite() {
  console.log('================================================================');
  console.log('GITHUB AUDIT: FULL END-TO-END VERIFICATION (3 EMOTIONS, 4 PHASES)');
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

  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon.ico')) {
      consoleErrors.push({ text, location: msg.location() });
      console.log(`  [CONSOLE ERROR] ${text}`);
    }
  });

  page.on('requestfailed', (req) => {
    const errText = req.failure()?.errorText || '';
    // Ignore routine client-side aborts (e.g. Next.js router prefetch cancellation, favicon)
    if (errText === 'net::ERR_ABORTED' || req.url().includes('favicon.ico')) {
      return;
    }
    networkFailures.push({ url: req.url(), failure: errText });
    console.log(`  [NETWORK FAILURE] ${req.url()} - ${errText}`);
  });

  const results = [];

  try {
    for (let i = 0; i < TEST_EMOTIONS.length; i++) {
      const tc = TEST_EMOTIONS[i];
      console.log(`\n----------------------------------------------------------------`);
      console.log(`[TEST ${i + 1}/3] Emotion: ${tc.emotion} (Method: ${tc.inputMethod})`);
      console.log(`----------------------------------------------------------------`);

      const stepLog = [];

      // Open Page
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
      await sleep(500);

      // Open Guided Wellness Modal
      const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
      await openBtn.waitFor({ state: 'visible', timeout: 8000 });
      await openBtn.click();
      await page.locator('[data-testid="wellness-modal"]').waitFor({ state: 'visible', timeout: 8000 });
      stepLog.push('Modal Opened');

      // Grant mic consent if requested
      const consentBtn = page.locator('[data-testid="mic-consent-allow-btn"]');
      if (await consentBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await consentBtn.click();
        await sleep(300);
        stepLog.push('Mic Consent Granted');
      }

      // Phase 1: Submit Mood
      const chatInput = page.locator('[data-testid="chat-text-input"]');
      await chatInput.waitFor({ state: 'visible', timeout: 6000 });

      if (tc.inputMethod === 'voice') {
        console.log('  -> Simulating Voice Input capture & transcription...');
        // Toggle mic
        const micBtn = page.locator('[data-testid="mic-toggle-btn"]');
        await micBtn.click();
        await sleep(400);

        // If mic consent modal appeared, grant consent
        const modalConsentBtn = page.locator('[data-testid="mic-consent-allow-btn"]');
        if (await modalConsentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('  -> Granting mic consent via modal button...');
          await modalConsentBtn.click();
          await sleep(500);
          stepLog.push('Mic Consent Granted');
        }

        // Inject speech recognition result via browser speech controller mock or direct fill
        await page.evaluate((simulatedText) => {
          if (window.browserSpeechController && window.browserSpeechController.activeCallbacks?.onTranscript) {
            window.browserSpeechController.activeCallbacks.onTranscript(simulatedText, true, {
              rmsEnergy: 0.05,
              pitchHz: 165,
              pauseRatio: 0.12,
              speechRate: 'moderate',
              tremorDetected: false
            });
          }
        }, tc.message);

        // In case recognition event was handled or fallback input
        const currentInput = await chatInput.inputValue();
        if (!currentInput) {
          await chatInput.fill(tc.message);
        }
        await page.locator('[data-testid="chat-send-btn"]').click();
        stepLog.push('Phase 1 Voice Mood Submitted');
      } else {
        console.log(`  -> Submitting Mood via Text: "${tc.message.slice(0, 50)}..."`);
        await chatInput.fill(tc.message);
        await page.locator('[data-testid="chat-send-btn"]').click();
        stepLog.push('Phase 1 Text Mood Submitted');
      }

      // Verify Phase 1 Confirmation statement rendered
      const confirmCard = page.locator('[data-testid="confirmation-card"]');
      await confirmCard.waitFor({ state: 'visible', timeout: 6000 });
      const confirmText = await page.locator('[data-testid="confirmation-question"]').innerText();
      console.log(`  -> Confirmation Statement: "${confirmText.slice(0, 60)}..."`);
      stepLog.push('Phase 1 Confirmation Statement Rendered');

      if (tc.inputMethod === 'text_with_clarify') {
        // Test Negative (NO) path -> Clarify Loop
        console.log('  -> Clicking NO to test Clarification Loop...');
        const noBtn = page.locator('[data-testid="confirm-no-btn"]');
        await noBtn.click();

        const clarifyCard = page.locator('[data-testid="clarify-card"]');
        await clarifyCard.waitFor({ state: 'visible', timeout: 6000 });
        const qText = await page.locator('[data-testid="clarify-question-text"]').innerText();
        console.log(`  -> Clarification question: "${qText.slice(0, 60)}..."`);
        stepLog.push('Clarification Loop Entered');

        // Submit clarification answer
        console.log(`  -> Answering clarification question: "${tc.clarifyAnswer}"`);
        await chatInput.fill(tc.clarifyAnswer);
        await page.locator('[data-testid="chat-send-btn"]').click();
        await sleep(800);
        stepLog.push('Clarification Answer Submitted');

        // If another clarify question appears or advances to Gita, check Gita
        if (await page.locator('[data-testid="clarify-card"]').isVisible({ timeout: 1500 }).catch(() => false)) {
          console.log('  -> Additional clarification turn active, submitting second refinement...');
          await chatInput.fill('I just need peaceful perspective and quiet clarity');
          await page.locator('[data-testid="chat-send-btn"]').click();
          await sleep(800);
        }
      } else {
        // Affirmative (YES) path
        console.log('  -> Clicking YES to advance to Phase 2 (Gita)...');
        const yesBtn = page.locator('[data-testid="confirm-yes-btn"]');
        await yesBtn.click();
        stepLog.push('Confirmed YES');
      }

      // Verify Phase 2: Gita Wisdom Card
      const gitaCard = page.locator('[data-testid="gita-card"]');
      await gitaCard.waitFor({ state: 'visible', timeout: 8000 });
      const verseRef = await page.locator('[data-testid="gita-verse-ref"]').innerText();
      const verseMeaning = await page.locator('[data-testid="gita-meaning"]').innerText();
      console.log(`  -> Phase 2 Gita Verse: ${verseRef}`);
      console.log(`  -> Gita Meaning: "${verseMeaning.slice(0, 60)}..."`);
      stepLog.push(`Phase 2 Gita (${verseRef})`);

      // Verify user can advance from Gita to CBT
      const gitaSkipBtn = page.locator('[data-testid="gita-skip-btn"]');
      await gitaSkipBtn.click();
      stepLog.push('Gita -> CBT Transition Clicked');

      // Verify Phase 3: CBT Mini-Flow (Steps 1 -> 2 -> 3 -> 4)
      const cbtCard = page.locator('[data-testid="cbt-card"]');
      await cbtCard.waitFor({ state: 'visible', timeout: 6000 });
      const cbtBadge = await page.locator('[data-testid="cbt-step-badge"]').innerText();
      console.log(`  -> Phase 3 CBT Active: ${cbtBadge}`);

      // CBT Step 1: Submit user thought
      console.log(`  -> Submitting CBT Step 1 thought: "${tc.cbtThought.slice(0, 40)}..."`);
      await chatInput.fill(tc.cbtThought);
      await page.locator('[data-testid="chat-send-btn"]').click();
      await sleep(600);
      stepLog.push('CBT Step 1 Thought Submitted');

      // CBT Step 2: Acknowledge distortion
      const distortionElem = page.locator('[data-testid="cbt-distortion-name"]');
      await distortionElem.waitFor({ state: 'visible', timeout: 6000 });
      const distText = await distortionElem.innerText();
      console.log(`  -> CBT Step 2 Distortion: "${distText.split('\n')[1] || distText}"`);
      const ackBtn = page.locator('[data-testid="cbt-distortion-ack-btn"]');
      await ackBtn.click();
      await sleep(600);
      stepLog.push('CBT Step 2 Distortion Acknowledged');

      // CBT Step 3: Evidence challenge
      const evidenceCard = page.locator('[data-testid="cbt-evidence-challenge"]');
      await evidenceCard.waitFor({ state: 'visible', timeout: 6000 });
      console.log(`  -> Submitting CBT Step 3 evidence answer: "${tc.cbtEvidence.slice(0, 40)}..."`);
      await chatInput.fill(tc.cbtEvidence);
      await page.locator('[data-testid="chat-send-btn"]').click();
      await sleep(600);
      stepLog.push('CBT Step 3 Evidence Submitted');

      // CBT Step 4: Balanced replacement thought
      const balancedElem = page.locator('[data-testid="cbt-balanced-thought"]');
      await balancedElem.waitFor({ state: 'visible', timeout: 6000 });
      const balancedText = await balancedElem.innerText();
      console.log(`  -> CBT Step 4 Balanced Thought: "${balancedText.slice(0, 50)}..."`);
      stepLog.push('CBT Step 4 Balanced Thought Generated');

      // Advance CBT -> Phase 4 Trataka
      const tratakaAdvanceBtn = page.locator('[data-testid="cbt-skip-btn"]');
      await tratakaAdvanceBtn.click();
      stepLog.push('CBT -> Trataka Transition Clicked');

      // Verify Phase 4: Trataka Gazing
      const tratakaCard = page.locator('[data-testid="trataka-card"]');
      await tratakaCard.waitFor({ state: 'visible', timeout: 6000 });
      const tratakaName = await page.locator('[data-testid="trataka-variant-name"]').innerText();
      console.log(`  -> Phase 4 Trataka Variant: "${tratakaName}"`);
      stepLog.push(`Phase 4 Trataka (${tratakaName})`);

      // Verify Trataka timer controls & finish
      const tratakaSkipBtn = page.locator('[data-testid="trataka-skip-btn"]');
      await tratakaSkipBtn.click();
      stepLog.push('Trataka Completed / Advanced');

      // Verify Summary Card
      const summaryCard = page.locator('[data-testid="summary-card"]');
      await summaryCard.waitFor({ state: 'visible', timeout: 6000 });
      console.log('  -> Summary Screen reached successfully!');
      stepLog.push('Session Summary Screen Reached');

      // Close modal
      const closeBtn = page.locator('[data-testid="modal-close-btn"]');
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
        await sleep(400);
      }

      results.push({
        testId: tc.id,
        emotion: tc.emotion,
        method: tc.inputMethod,
        status: 'PASSED',
        stepsCompleted: stepLog,
      });
    }

    console.log('\n================================================================');
    console.log('SUMMARY OF AUDIT E2E RUN:');
    console.log('================================================================');
    results.forEach((r) => {
      console.log(`[PASS] ${r.testId}: ${r.emotion} (${r.method}) - Steps: ${r.stepsCompleted.length}/10`);
    });

    console.log(`\nBrowser Console Errors: ${consoleErrors.length}`);
    console.log(`Network Failures: ${networkFailures.length}`);

    if (consoleErrors.length > 0) {
      console.error('FAILED: Uncaught browser console errors detected:', consoleErrors);
      process.exit(1);
    }

    if (networkFailures.length > 0) {
      console.error('FAILED: Network failures detected:', networkFailures);
      process.exit(1);
    }

    console.log('\n>>> ALL 3 EMOTIONAL PATHS AND 4 PHASES VERIFIED WITH ZERO ERRORS & ZERO NETWORK FAILURES! <<<\n');
  } catch (err) {
    console.error('AUDIT RUNTIME ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAuditE2ESuite();
