// tests/test-mobile-debug.mjs
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, [
  '--remote-debugging-port=9229',
  '--headless=new',
  '--window-size=390,844',
  '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'http://localhost:3001'
]);

async function run() {
  console.log('--- Launching Chrome in Mobile Emulation Mode (390x844) ---');
  await new Promise(r => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9229/json');
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

  const consoleLogs = [];
  const exceptions = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const msg = data.params.args.map(a => a.value || a.description).join(' ');
      consoleLogs.push(`[${data.params.type}] ${msg}`);
      console.log(`[Browser Console ${data.params.type}]`, msg);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      exceptions.push(data.params.exceptionDetails);
      console.error('[Browser Exception]', data.params.exceptionDetails.text, data.params.exceptionDetails.exception?.description);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('\n--- Evaluating Mobile DOM & Layout Elements ---');
  const inspection = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const bodyHeight = document.body.offsetHeight;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const isSecure = window.isSecureContext;

        const mainInput = document.querySelector('[data-testid="main-chat-input"]');
        const micBtn = document.querySelector('[data-testid="chat-mic-btn"]');
        const sendBtn = document.querySelector('[data-testid="main-chat-send-btn"]');
        const mobileMenuBtn = document.querySelector('[data-testid="mobile-menu-btn"]');

        let inputRect = null;
        let isInputVisible = false;
        if (mainInput) {
          const r = mainInput.getBoundingClientRect();
          inputRect = { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
          isInputVisible = r.top >= 0 && r.bottom <= windowHeight && r.height > 0;
        }

        let micRect = null;
        let isMicVisible = false;
        if (micBtn) {
          const r = micBtn.getBoundingClientRect();
          micRect = { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
          isMicVisible = r.top >= 0 && r.bottom <= windowHeight && r.height > 0;
        }

        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);

        return {
          viewport: { windowWidth, windowHeight, bodyHeight },
          isSecure,
          hasMainInput: !!mainInput,
          isInputVisible,
          inputRect,
          hasMicBtn: !!micBtn,
          isMicVisible,
          micRect,
          hasMobileMenuBtn: !!mobileMenuBtn,
          totalButtons: buttons.length,
          sampleButtons: buttons.slice(0, 10),
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Mobile Inspection Result:\n', JSON.stringify(inspection.result.value, null, 2));

  console.log('\n--- Testing 4-Phase Guided Flow Modal on Mobile ---');
  const modalClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const guidedBtn = btns.find(b => b.innerText.includes('4-Phase Guided Flow'));
        if (guidedBtn) {
          guidedBtn.click();
          return { success: true, text: guidedBtn.innerText };
        }
        return { success: false, buttons: btns.map(b => b.innerText) };
      })()
    `,
    returnByValue: true
  });
  console.log('Modal Click Result:', modalClick.result.value);

  await new Promise(r => setTimeout(r, 2000));

  const modalInspection = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dialog = document.querySelector('[role="dialog"], .fixed.inset-0');
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.innerText.trim(),
          rect: b.getBoundingClientRect()
        }));

        let dialogRect = null;
        if (dialog) {
          const r = dialog.getBoundingClientRect();
          dialogRect = { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
        }

        const inputs = Array.from(document.querySelectorAll('input, textarea')).map(i => {
          const r = i.getBoundingClientRect();
          return {
            placeholder: i.placeholder,
            rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), visible: r.top >= 0 && r.bottom <= windowHeight && r.height > 0 }
          };
        });

        return {
          windowHeight,
          windowWidth,
          hasDialog: !!dialog,
          dialogRect,
          inputs,
          buttons: buttons.filter(b => b.rect.width > 0 && b.rect.height > 0).slice(0, 10),
          bodyTextSample: document.body.innerText.slice(0, 300)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Guided Modal Inspection:\n', JSON.stringify(modalInspection.result.value, null, 2));

  ws.close();
  p.kill();
}

run().catch(e => {
  console.error('Mobile debug runner error:', e);
  p.kill();
});
