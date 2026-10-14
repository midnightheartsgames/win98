const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const KEYS = {
  TAB: ['Tab', 'Tab', 9], RET: ['Enter', 'Enter', 13], ESC: ['Escape', 'Escape', 27], SPACE: ['Space', ' ', 32], DEL: ['Delete', 'Delete', 46],
  BACKSPACE: ['Backspace', 'Backspace', 8], HOME: ['Home', 'Home', 36], LEFT: ['ArrowLeft', 'ArrowLeft', 37], RIGHT: ['ArrowRight', 'ArrowRight', 39],
  UP: ['ArrowUp', 'ArrowUp', 38], DOWN: ['ArrowDown', 'ArrowDown', 40], PADPLUS: ['NumpadAdd', '+', 107], PADMINUS: ['NumpadSubtract', '-', 109]
};

function keyDef(k) {
  if (KEYS[k]) return KEYS[k];
  if (/^F\d+$/.test(k)) return [k, k, 111 + +k.slice(1)];
  if (/^PAD\d$/.test(k)) return ['Numpad' + k[3], k[3], 96 + +k[3]];
  if (/^[A-Z]$/.test(k)) return ['Key' + k, k.toLowerCase(), k.charCodeAt(0)];
  if (/^[0-9]$/.test(k)) return ['Digit' + k, k, k.charCodeAt(0)];
  return [k, k, 0];
}

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'b204-shots');
  const scriptFile = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b204edge-'));
  const [W, H] = (process.env.B2_SIZE || '1018,764').split(',').map(Number);
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`, '--mute-audio', '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
  const cleanup = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(300);
    } catch (e) { }
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { }
    server.kill();
  };
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    });
    const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/server.js`)).status) break; } catch (e) { } await sleep(250); }
    const page = process.env.B2_PAGE || 'blender204.html?nosplash';
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    let ok = false;
    for (let i = 0; i < 200 && !ok; i++) { await sleep(250); try { ok = await evalJs(process.env.B2_READY || '!!(window.b204 && window.b204.raster.icons)'); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    await sleep(300);
    const shot = async (name, clip) => {
      const params = { format: 'png' };
      if (clip) params.clip = { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: clip[4] || 1 };
      const r = await send('Page.captureScreenshot', params);
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log('shot', name);
    };
    const mouse = async (type, x, y, button, buttons, mods) => send('Input.dispatchMouseEvent', { type, x, y, button: button || 'none', buttons: buttons || 0, clickCount: 1, modifiers: mods || 0 });
    const btnBits = { left: 1, right: 2, middle: 4 };
    const modBits = m => (m || '').split('+').reduce((s, k) => s | ({ alt: 1, ctrl: 2, shift: 8 }[k] || 0), 0);
    const steps = scriptFile && fs.existsSync(scriptFile) ? require(path.resolve(scriptFile)) : [['shot', 'page']];
    for (const st of steps) {
      try {
        const op = st[0];
        if (op === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 3000));
        else if (op === 'shot') await shot(st[1], st[2]);
        else if (op === 'sleep') await sleep(st[1]);
        else if (op === 'move') await mouse('mouseMoved', st[1], st[2], 'none', 0, modBits(st[3]));
        else if (op === 'click') {
          const b = st[3] || 'left', m = modBits(st[4]);
          await mouse('mouseMoved', st[1], st[2], 'none', 0, m);
          await mouse('mousePressed', st[1], st[2], b, btnBits[b], m);
          await mouse('mouseReleased', st[1], st[2], b, 0, m);
        } else if (op === 'drag') {
          const b = st[5] || 'left', m = modBits(st[6]);
          await mouse('mouseMoved', st[1], st[2], 'none', 0, m);
          await mouse('mousePressed', st[1], st[2], b, btnBits[b], m);
          const n = st[7] || 8;
          for (let k = 1; k <= n; k++) await mouse('mouseMoved', st[1] + (st[3] - st[1]) * k / n, st[2] + (st[4] - st[2]) * k / n, b, btnBits[b], m);
          await mouse('mouseReleased', st[3], st[4], b, 0, m);
        } else if (op === 'down' || op === 'up') {
          const b = st[3] || 'left';
          await mouse(op === 'down' ? 'mousePressed' : 'mouseReleased', st[1], st[2], b, op === 'down' ? btnBits[b] : 0, modBits(st[4]));
        } else if (op === 'key' || op === 'kdown' || op === 'kup') {
          const [code, key, vk] = keyDef(st[1]);
          const m = modBits(st[2]);
          const text = key.length === 1 && !(m & 2) ? ((m & 8) ? key.toUpperCase() : key) : undefined;
          if (op !== 'kup') await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', code, key: text || key, windowsVirtualKeyCode: vk, modifiers: m, text });
          if (op !== 'kdown') await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: text || key, windowsVirtualKeyCode: vk, modifiers: m });
        } else if (op === 'type') {
          for (const ch of st[1]) await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, code: /[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : /\d/.test(ch) ? 'Digit' + ch : '' }), await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
        }
        await sleep(st[0] === 'shot' || st[0] === 'eval' ? 0 : 40);
      } catch (e) { console.log('ERR', st[0], String(st[1]).slice(0, 80), e.message.slice(0, 600)); }
    }
    if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n'));
    else console.log('no errors');
  } finally {
    await cleanup();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
