// Visual check of the 3ADVANCED site in headless Edge via raw CDP.
// Usage: node server.js (port 8080) running, then: node tests/verify-advanced-site.cjs
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9341;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adv-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--window-size=1280,1000', 'about:blank']);
  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.find(t => t.type === 'page')) break; } catch (e) {}
    await sleep(250);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result.result ? r.result.result.value : r; };
  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(__dirname, name), Buffer.from(r.result.data, 'base64')); };

  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:8080/' });
  await sleep(12000);

  const go = async url => {
    await evalJs(`(() => { window.appIE.open(${JSON.stringify(url)}); const w = document.querySelector('.ie-content-frame').closest('.win-window'); if (w) { w.style.left='0px'; w.style.top='0px'; w.style.width='1100px'; w.style.height='930px'; } return 1; })()`);
    await sleep(2200);
  };
  await go('http://www.3advanced.com');
  await shot('advanced-home.png');
  console.log('home panels:', await evalJs(`document.querySelectorAll('.adv-panel').length`));

  // click the SOFTWARE nav link
  await evalJs(`(() => { const a = [...document.querySelectorAll('.adv-nav-item')].find(x => x.textContent === 'SOFTWARE'); a && a.click(); return !!a; })()`);
  await sleep(600);
  await shot('advanced-software.png');
  console.log('tiles:', await evalJs(`document.querySelectorAll('.adv-tile').length`));

  await evalJs(`document.querySelector('.adv-tile[data-url$="/program/notepad"]').click()`);
  await sleep(500);
  await evalJs(`document.querySelector('.adv-launch').click()`);
  await sleep(800);
  console.log('notepad open:', await evalJs(`[...window.winManager.windows.keys()].join(' | ')`));

  await evalJs(`(() => { const a = [...document.querySelectorAll('.adv-nav-item')].find(x => x.textContent === 'GAMES'); a.click(); return 1; })()`);
  await sleep(600);
  await shot('advanced-games.png');

  console.log('errors:', errors);
  ws.close(); edge.kill();
  process.exit(0);
})();
