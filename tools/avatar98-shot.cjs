const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function launch(port = 9341) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'av98-edge-'));
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,960', '--autoplay-policy=no-user-gesture-required', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const list = await res.json();
      targets = list.filter((t) => t.type === 'page');
      if (!targets.length) targets = null;
    } catch {}
  }
  if (!targets) throw new Error('edge did not start');
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  const errors = [];
  listeners.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  await send('Runtime.enable');
  await send('Page.enable');
  const api = {
    send,
    errors,
    async goto(url) {
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 800));
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(file, clip) {
      const r = await send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async key(code, key, type = 'both') {
      const params = { code, key, windowsVirtualKeyCode: VK[code] || 0 };
      if (type !== 'up') await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
      if (type !== 'down') await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    },
    async wait(ms) {
      await new Promise((r) => setTimeout(r, ms));
    },
    close() {
      try {
        ws.close();
      } catch {}
      proc.kill();
    }
  };
  return api;
}

const VK = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyX: 88, KeyC: 67, Enter: 13, Escape: 27, ShiftLeft: 16, F9: 120, Space: 32, KeyV: 86 };

module.exports = { launch };

if (require.main === module) {
  (async () => {
    const [url, out, wait = '1500', expr] = process.argv.slice(2);
    const b = await launch();
    try {
      await b.goto(url);
      await b.wait(Number(wait));
      if (expr) console.log(await b.eval(expr));
      await b.shot(out);
      if (b.errors.length) console.log('ERRORS:\n' + b.errors.join('\n'));
    } finally {
      b.close();
    }
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
