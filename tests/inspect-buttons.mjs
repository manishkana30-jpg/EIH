// tests/inspect-buttons.mjs
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, ['--remote-debugging-port=9226', '--headless=new', 'http://localhost:3001']);

async function run() {
  await new Promise(r => setTimeout(r, 2500));
  const res = await fetch('http://127.0.0.1:9226/json');
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
  await new Promise(r => setTimeout(r, 2000));

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.innerText.trim(),
          title: b.getAttribute('title') || '',
          html: b.outerHTML.substring(0, 100)
        }));
      })()
    `,
    returnByValue: true
  });

  console.log('PAGE BUTTONS:', JSON.stringify(evalRes.result.value, null, 2));

  // Now click the Guided Wellness button
  const openModalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('4-Phase Guided Flow') || b.getAttribute('title')?.includes('Guided'));
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.innerText };
        }
        return { clicked: false, availableButtons: btns.map(b => b.innerText.trim()) };
      })()
    `,
    returnByValue: true
  });

  console.log('OPEN MODAL RESULT:', JSON.stringify(openModalRes.result.value, null, 2));
  await new Promise(r => setTimeout(r, 1200));

  const modalButtons = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.innerText.trim(),
          title: b.getAttribute('title') || '',
          ariaLabel: b.getAttribute('aria-label') || '',
          html: b.outerHTML.substring(0, 100)
        }));
      })()
    `,
    returnByValue: true
  });

  console.log('MODAL BUTTONS:', JSON.stringify(modalButtons.result.value, null, 2));

  ws.close();
  p.kill();
}

run().catch(e => {
  console.error(e);
  p.kill();
});
