// tests/test-console-errors.mjs
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, [
  '--remote-debugging-port=9228',
  '--headless=new',
  '--window-size=1280,900',
  'http://localhost:3001'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2500));
  const res = await fetch('http://127.0.0.1:9228/json');
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

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log(`[Console ${data.params.type}]`, data.params.args.map(a => a.value || a.description).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[Exception]', data.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  await new Promise(r => setTimeout(r, 2000));

  console.log('Finding and clicking 4-Phase Guided Flow button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('4-Phase Guided Flow') || b.getAttribute('title')?.includes('Guided'));
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.innerText };
        }
        return { clicked: false, all: btns.map(b => b.innerText) };
      })()
    `,
    returnByValue: true
  });

  console.log('Click result:', clickRes.result.value);

  await new Promise(r => setTimeout(r, 3000));

  // Check state of React or document
  const domInspection = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const allText = document.body.innerText;
        return {
          hasSanctuaryStage: document.querySelectorAll('.fixed.inset-0').length,
          allDialogs: document.querySelectorAll('dialog, [role="dialog"]').length,
          hasMindSanctuaryModal: allText.includes('4-Phase Wellness Sanctuary') || allText.includes('Share how you are feeling') || allText.includes('Awaiting confirmation')
        };
      })()
    `,
    returnByValue: true
  });

  console.log('DOM Inspection:', domInspection.result.value);

  ws.close();
  p.kill();
}

run().catch(e => {
  console.error(e);
  p.kill();
});
