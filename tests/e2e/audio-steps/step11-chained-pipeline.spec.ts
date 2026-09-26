import { test, expect } from '@playwright/test';
import { openWellnessModal, captureStepSnapshot, ensureMicListening } from './audio-test-helper';

test.describe('STEP 2: Chained Audio Pipeline (Full In-Session Continuity)', () => {
  test('executes Steps 1 through 10 consecutively in a single session without page reload', async ({ page, context }) => {
    console.log('\n--- STARTING CHAINED AUDIO PIPELINE TEST ---');

    // ========================================================
    // [CHAIN STEP 1]: Mic Permission & Storage Consent
    // ========================================================
    console.log('[CHAIN STEP 1] Granting microphone permissions & opening modal');
    await context.grantPermissions(['microphone']);
    await openWellnessModal(page, { grantStorageConsent: true });

    const permIndicator = page.locator('[data-testid="audio-permission-status"]');
    await expect(permIndicator).toHaveAttribute('data-permission', 'granted', { timeout: 4000 });
    console.log('[CHAIN STEP 1 PASSED] Mic permission granted in DOM and context.');

    // ========================================================
    // [CHAIN STEP 2]: Mic Activation within 1 second
    // ========================================================
    console.log('[CHAIN STEP 2] Activating mic capture');
    await ensureMicListening(page);
    console.log('[CHAIN STEP 2 PASSED] Mic state changed to "listening".');

    // ========================================================
    // [CHAIN STEP 3]: Audio Signal Reception
    // ========================================================
    console.log('[CHAIN STEP 3] Verifying live audio amplitude meter receives signal');
    const audioMeter = page.locator('[data-testid="live-audio-meter"]');
    await audioMeter.waitFor({ state: 'visible', timeout: 4000 });

    await expect.poll(async () => {
      const levelAttr = await audioMeter.getAttribute('data-audio-level');
      return parseFloat(levelAttr || '0');
    }, {
      message: 'Expected live audio meter to register non-zero amplitude level',
      timeout: 5000,
      intervals: [100, 250, 500],
    }).toBeGreaterThan(0);

    const initialLevel = await audioMeter.getAttribute('data-audio-level');
    console.log(`[CHAIN STEP 3 PASSED] Audio signal verified at level=${initialLevel}`);

    // ========================================================
    // [CHAIN STEP 4]: STT Transcript Update
    // ========================================================
    console.log('[CHAIN STEP 4] Injecting user voice input');
    const spokenText = 'I am feeling deeply overwhelmed and anxious about everything';
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, false, {
          rmsEnergy: 0.05,
          pitchHz: 175,
          pauseRatio: 0.1,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    }, spokenText);

    const chatInput = page.locator('[data-testid="chat-text-input"]');
    const transcriptDisplay = page.locator('[data-testid="voice-transcript-display"]');

    await expect.poll(async () => {
      const liveText = await transcriptDisplay.innerText().catch(() => '');
      const inputValue = await chatInput.inputValue().catch(() => '');
      return (liveText || inputValue).trim();
    }, {
      message: 'Expected transcript DOM element to contain non-empty speech text',
      timeout: 5000,
    }).not.toBe('');

    console.log('[CHAIN STEP 4 PASSED] Live transcript appeared in DOM.');

    // ========================================================
    // [CHAIN STEP 5]: Transcript Accuracy (Fuzzy Match)
    // ========================================================
    console.log('[CHAIN STEP 5] Verifying transcript accuracy');
    await expect(chatInput).toHaveValue(new RegExp('overwhelmed|anxious|feeling', 'i'), { timeout: 5000 });
    const recognizedText = await chatInput.inputValue();
    expect(recognizedText.toLowerCase()).toContain('feeling');
    expect(recognizedText.toLowerCase()).toContain('anxious');
    console.log(`[CHAIN STEP 5 PASSED] Transcript matches expected phrase: "${recognizedText}"`);

    // ========================================================
    // [CHAIN STEP 6]: Audio Handoff & State Transition
    // ========================================================
    console.log('[CHAIN STEP 6] Finalizing speech and asserting handoff');
    await page.evaluate((text) => {
      if (window.browserSpeechController && typeof window.browserSpeechController.injectTranscript === 'function') {
        window.browserSpeechController.injectTranscript(text, true, {
          rmsEnergy: 0.055,
          pitchHz: 180,
          pauseRatio: 0.12,
          speechRate: 'moderate',
          tremorDetected: false,
        });
      }
    }, spokenText);

    const phaseTracker = page.locator('[data-testid="phase-tracker"]');
    await expect(phaseTracker).toHaveAttribute('data-phase-index', '1', { timeout: 5000 });

    const phaseState = page.locator('[data-testid="phase-state-indicator"]');
    await expect.poll(async () => {
      return await phaseState.getAttribute('data-phase');
    }, {
      message: 'Expected state machine to transition to CONFIRM within Phase 1',
      timeout: 5000,
    }).toBe('CONFIRM');
    console.log('[CHAIN STEP 6 PASSED] Handoff completed without state skip.');

    // ========================================================
    // [CHAIN STEP 7]: Confirmation Render with Emotion
    // ========================================================
    console.log('[CHAIN STEP 7] Verifying confirmation statement render');
    const confirmCard = page.locator('[data-testid="confirmation-card"]');
    await confirmCard.waitFor({ state: 'visible', timeout: 6000 });

    const confirmQuestion = page.locator('[data-testid="confirmation-question"]');
    await confirmQuestion.waitFor({ state: 'visible', timeout: 4000 });
    const questionText = await confirmQuestion.innerText();
    expect(questionText.length).toBeGreaterThan(10);
    expect(questionText.toLowerCase()).toMatch(/anger|anxiety|anxious|overwhelmed|feeling|sounds like/i);
    console.log(`[CHAIN STEP 7 PASSED] Confirmation rendered: "${questionText}"`);

    // ========================================================
    // [CHAIN STEP 8]: Voice Yes/No Confirmation Handoff
    // ========================================================
    console.log('[CHAIN STEP 8] Injecting voice "yes" confirmation response');
    await page.evaluate(() => {
      if (window.confirmVoiceManager && typeof window.confirmVoiceManager.injectTranscript === 'function') {
        window.confirmVoiceManager.injectTranscript('yes, that is accurate');
      }
    });

    const gitaCard = page.locator('[data-testid="gita-card"]');
    await gitaCard.waitFor({ state: 'visible', timeout: 8000 });
    await expect(phaseTracker).toHaveAttribute('data-phase-index', '2', { timeout: 4000 });
    console.log('[CHAIN STEP 8 PASSED] Voice "yes" transitioned session to Phase 2 (Gita).');

    // ========================================================
    // [CHAIN STEP 9]: Assistant TTS Playback & Completion
    // ========================================================
    console.log('[CHAIN STEP 9] Verifying Assistant TTS playback lifecycle');
    const ttsIndicator = page.locator('[data-testid="tts-play-indicator"]');

    // Verify speaking starts
    await expect.poll(async () => {
      return await ttsIndicator.getAttribute('data-speaking');
    }, {
      message: 'Expected TTS indicator to show speaking=true during verse playback',
      timeout: 4000,
    }).toBe('true');
    console.log('[CHAIN STEP 9] TTS active: speaking=true');

    // User barge-in / speech completion: cancel speech to advance cleanly
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      if (window.browserSpeechController) {
        window.browserSpeechController.cancelSpeech();
      }
    });

    await expect.poll(async () => {
      return await ttsIndicator.getAttribute('data-speaking');
    }, {
      message: 'Expected TTS indicator to cleanly return to speaking=false',
      timeout: 5000,
      intervals: [250, 500],
    }).toBe('false');
    console.log('[CHAIN STEP 9 PASSED] TTS finished: speaking=false');

    // ========================================================
    // [CHAIN STEP 10]: Mic Reactivation in Subsequent Phase
    // ========================================================
    console.log('[CHAIN STEP 10] Transitioning to Phase 3 (CBT) and testing Mic Reactivation');
    const advanceCbtBtn = page.locator('[data-testid="gita-skip-btn"]');
    await advanceCbtBtn.click();
    const cbtCard = page.locator('[data-testid="cbt-card"]');
    await cbtCard.waitFor({ state: 'visible', timeout: 6000 });

    // Reactivate mic again in the same session
    await ensureMicListening(page);

    // Assert live audio signal is active on the reactivated mic stream
    await expect(audioMeter).toBeVisible({ timeout: 3000 });
    await expect.poll(async () => {
      const level = parseFloat((await audioMeter.getAttribute('data-audio-level')) || '0');
      return level;
    }, {
      message: 'Expected Cycle 2 microphone in chained pipeline to register audio signal',
      timeout: 5000,
    }).toBeGreaterThan(0);

    const reLevel = await audioMeter.getAttribute('data-audio-level');
    console.log(`[CHAIN STEP 10 PASSED] Mic successfully reactivated in same session: level=${reLevel}`);

    await captureStepSnapshot(page, 'chained-pipeline-all-passed');
    console.log('--- ALL CHAINED AUDIO STEPS COMPLETED SUCCESSFULLY ---\n');
  });
});
