// tests/test-safety-modal-e2e.mjs
import { chromium } from 'playwright';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3001';

async function verifySafetyCrisisFlow() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    const openBtn = page.locator('[data-testid="open-wellness-flow-btn"]');
    await openBtn.waitFor({ state: 'visible', timeout: 8000 });
    await openBtn.click();
    await page.locator('[data-testid="wellness-modal"]').waitFor({ state: 'visible', timeout: 8000 });

    const chatInput = page.locator('[data-testid="chat-text-input"]');
    await chatInput.fill('I want to end my life, please help me');
    await page.locator('[data-testid="chat-send-btn"]').click();

    // Verify Crisis Alert Modal is displayed
    const crisisAlert = page.locator('[data-testid="crisis-modal"]');
    await crisisAlert.waitFor({ state: 'visible', timeout: 6000 });
    const modalText = await crisisAlert.innerText();
    console.log('Safety Crisis Modal triggered as required:');
    console.log(modalText.slice(0, 150));

    if (!modalText.includes('14416') && !modalText.includes('Tele-MANAS')) {
      throw new Error('Crisis modal did not render Tele-MANAS helpline details');
    }
    console.log('>>> CRISIS SAFETY INTERRUPT VERIFIED SUCCESSFULLY <<<');
  } finally {
    await browser.close();
  }
}

verifySafetyCrisisFlow();
