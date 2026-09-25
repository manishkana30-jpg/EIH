// tests/test-guided-modal-load.mjs
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, ['--remote-debugging-port=9227', '--headless=new', 'http://localhost:3001']);

async function run() {
  await new Promise(r => setTimeout(r, 2500));
  const res = await fetch('http://127.0.0.1:9227/json');
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

  // Click 4-Phase Guided Flow
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('4-Phase Guided Flow'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  console.log('Clicked 4-Phase button:', clickRes.result.value);

  // Poll for modal
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const modalCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mic = document.querySelector('button[title*="listening"], button[title*="reply"]');
          const input = document.querySelector('input[placeholder*="feeling"], input[placeholder*="भावनाएं"]');
          const modalHeader = Array.from(document.querySelectorAll('h2, h3, span')).map(e => e.innerText).find(t => t.includes('Mind Sanctuary') || t.includes('Guided Wellness'));
          return {
            hasModalHeader: !!modalHeader,
            headerText: modalHeader,
            hasMic: !!mic,
            micTitle: mic?.getAttribute('title'),
            hasInput: !!input,
            inputPlaceholder: input?.getAttribute('placeholder')
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`Poll ${i}:`, modalCheck.result.value);
    if (modalCheck.result.value.hasMic && modalCheck.result.value.hasInput) {
      console.log('Modal fully mounted and ready!');
      break;
    }
  }

  ws.close();
  p.kill();
}

run().catch(e => {
  console.error(e);
  p.kill();
});
