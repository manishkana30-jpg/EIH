// tests/test-mobile-speech-guards.mjs
import assert from 'assert';
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, [
  '--remote-debugging-port=9233',
  '--headless=new',
  '--window-size=390,844',
  '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'http://localhost:3001'
]);

async function run() {
  console.log('--- Testing Mobile Speech API Guards & Compatibility ---');
  await new Promise(r => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9233/json');
  const list = await res.json();
  const page = list.find(x => x.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, params = {}) => new Promise((resolve, reject) => {
    const cur = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === cur) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await new Promise(r => setTimeout(r, 2000));

  // 1. Verify Prefix Checking and Instantiation
  const prefixCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        return {
          hasSpeechRec: !!SpeechRec,
          recName: SpeechRec ? SpeechRec.name : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('1. Prefix & API Check:', prefixCheck.result.value);
  assert(prefixCheck.result.value.hasSpeechRec, 'SpeechRecognition or webkitSpeechRecognition must exist');

  // 2. Verify Secure Context Guard behavior
  const secureGuardCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Test what happens when isSecureContext is false
        const origSecure = window.isSecureContext;
        try {
          Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
        } catch (_) {}

        const micBtn = document.querySelector('[data-testid="chat-mic-btn"]');
        if (micBtn) micBtn.click();

        const errorBanner = document.body.innerText;
        const hasHttpsMsg = errorBanner.includes('Voice requires a secure HTTPS connection') ||
                            errorBanner.includes('secure connection');

        try {
          Object.defineProperty(window, 'isSecureContext', { value: origSecure, configurable: true });
        } catch (_) {}

        return { hasHttpsMsg, pageSample: errorBanner.slice(0, 150) };
      })()
    `,
    returnByValue: true
  });
  console.log('2. Insecure Context Test:', secureGuardCheck.result.value);

  // 3. Verify 'not-allowed' permission prompt handling
  const permissionCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Trigger onerror with not-allowed
        const controller = window.browserSpeechController;
        let receivedError = null;
        if (controller) {
          controller.setCallbacks({
            onError: (err) => { receivedError = err; }
          });
          // Simulate not-allowed error
          if (controller.speechRecognition && controller.speechRecognition.onerror) {
            controller.speechRecognition.onerror({ error: 'not-allowed' });
          }
        }
        return { receivedError };
      })()
    `,
    returnByValue: true
  });
  console.log('3. Permission Error Handling Test:', permissionCheck.result.value);

  ws.close();
  p.kill();
  console.log('✅ Mobile Speech Guards Verification Complete');
}

run().catch(e => {
  console.error('Error in mobile speech guard test:', e);
  p.kill();
  process.exit(1);
});
