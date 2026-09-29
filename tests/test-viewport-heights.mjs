import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = spawn(CHROME_PATH, [
  '--remote-debugging-port=9231',
  '--headless=new',
  'http://localhost:3001'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2500));

  const res = await fetch('http://127.0.0.1:9231/json');
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

  const viewports = [
    { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
    { name: 'iPhone SE (375x667)', width: 375, height: 667 },
    { name: 'Android Small (360x640)', width: 360, height: 640 },
    { name: 'Mobile Virtual Keyboard Open (390x400)', width: 390, height: 400 },
  ];

  console.log('=== MULTI-DEVICE VIEWPORT TEST ===');

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 1200));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const winH = window.innerHeight;
          const input = document.querySelector('[data-testid="main-chat-input"]');
          const mic = document.querySelector('[data-testid="chat-mic-btn"]');
          const sendBtn = document.querySelector('[data-testid="main-chat-send-btn"]');

          const inR = input ? input.getBoundingClientRect() : null;
          const micR = mic ? mic.getBoundingClientRect() : null;
          const sendR = sendBtn ? sendBtn.getBoundingClientRect() : null;

          return {
            windowHeight: winH,
            input: inR ? { top: Math.round(inR.top), bottom: Math.round(inR.bottom), height: Math.round(inR.height), visible: inR.top >= 0 && inR.bottom <= winH } : null,
            mic: micR ? { top: Math.round(micR.top), bottom: Math.round(micR.bottom), height: Math.round(micR.height), visible: micR.top >= 0 && micR.bottom <= winH } : null,
            send: sendR ? { top: Math.round(sendR.top), bottom: Math.round(sendR.bottom), visible: sendR.top >= 0 && sendR.bottom <= winH } : null,
          };
        })()
      `,
      returnByValue: true
    });

    console.log(`\nDevice: ${vp.name}`);
    console.log(JSON.stringify(check.result.value, null, 2));
  }

  ws.close();
  p.kill();
}

run().catch(e => {
  console.error('Error:', e);
  p.kill();
});
