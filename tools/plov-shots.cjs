const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const HELPERS = `(() => {
  let t = performance.now();
  window.plShots = {
    pump(n, dt) {
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try { for (let i = 0; i < n; i++) { t = Math.max(t, plui.last || 0) + (dt || 1 / 60) * 1000; plui.frame(t); } }
      finally { window.requestAnimationFrame = raf; }
      return true;
    },
    run(sec) { return plShots.pump(Math.round(sec * 60)); },
    reset(save) { localStorage.removeItem('plov98_save'); plui.save = Object.assign(Plov.defaultSave(), save || {}); plui.persist(); return true; },
    play(day) { plui.go('play', { day }); plui.screen.start(); return plui.screen.phase; },
    bot(sec, slow) {
      const s = plui.screen;
      if (!s || !s.game) return 'no game';
      const bot = s.bot || (s.bot = new Plov.Bot(s.game, { slow: slow || 0 }));
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try {
        const n = Math.round(sec * 60);
        for (let i = 0; i < n; i++) { if (s.game.modal) s.game.ack(); bot.tick(1 / 60); t = Math.max(t, plui.last || 0) + 1000 / 60; plui.frame(t); if (s.phase !== 'play') break; }
      } finally { window.requestAnimationFrame = raf; }
      return s.phase + ' t=' + s.game.t.toFixed(1) + ' money=' + s.game.money;
    },
    info() { const s = plui.screen; return plui.screenName + (s && s.game ? ' ' + s.phase + ' ' + s.game.t.toFixed(1) : ''); }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'plov-shots');
  const scriptFile = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pledge-'));
  const size = process.env.PL_SIZE || '1100,860';
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${size}`, '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
    if (process.env.PL_DPR) {
      const [w, h] = (process.env.PL_SIZE || '1100,860').split(',').map(Number);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: +process.env.PL_DPR, mobile: false });
    }
    const page = process.env.PL_PAGE || 'plov.html';
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/server.js`)).status) break; } catch (e) { } await sleep(250); }
    if (process.env.PL_HTML) {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/pl-scratch-blank` });
      await sleep(600);
      const tree = await send('Page.getFrameTree', {});
      await send('Page.setDocumentContent', { frameId: tree.result.frameTree.frame.id, html: fs.readFileSync(process.env.PL_HTML, 'utf8') });
    } else {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    }
    let ok = false;
    for (let i = 0; i < 160 && !ok; i++) { await sleep(250); try { ok = await evalJs(process.env.PL_READY || '!!window.plui'); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    if (!process.env.PL_HTML && page === 'plov.html') await evalJs(HELPERS);
    const shot = async (name, clip) => {
      const params = { format: 'png' };
      if (clip) params.clip = { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: clip[4] || 1 };
      const r = await send('Page.captureScreenshot', params);
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log('shot', name);
    };
    const steps = scriptFile && fs.existsSync(scriptFile) ? require(path.resolve(scriptFile)) : [['shot', 'page']];
    for (const st of steps) {
      const t0 = Date.now();
      try {
        if (st[0] === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 2000));
        else if (st[0] === 'shot') await shot(st[1], st[2]);
        else if (st[0] === 'lshot') {
          const r = JSON.parse(await evalJs('JSON.stringify(plui.cv.getBoundingClientRect())'));
          const k = r.width / 800, c = st[2] || [0, 0, 800, 600];
          await shot(st[1], [r.left + c[0] * k, r.top + c[1] * k, c[2] * k, c[3] * k, st[3] || 1]);
        }
        else if (st[0] === 'sleep') await sleep(st[1]);
        else if (st[0] === 'mouse') await send('Input.dispatchMouseEvent', { type: st[1], x: st[2], y: st[3], button: st[4] || 'left', clickCount: 1, buttons: st[5] || 0 });
        else if (st[0] === 'lclick' || st[0] === 'lmove' || st[0] === 'ldrag') {
          const r = JSON.parse(await evalJs('JSON.stringify(plui.cv.getBoundingClientRect())'));
          const map = (x, y) => [r.left + x / 800 * r.width, r.top + y / 600 * r.height];
          const pt = typeof st[1] === 'string' ? JSON.parse(await evalJs('JSON.stringify(' + st[1] + ')')) : [st[1], st[2]];
          const [x, y] = map(pt[0], pt[1]);
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          if (st[0] === 'lclick') {
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: st[3] || 'left', clickCount: 1, buttons: st[3] === 'right' ? 2 : 1 });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: st[3] || 'left', clickCount: 1 });
          }
          if (st[0] === 'ldrag') {
            const [x2, y2] = map(st[3], st[4]);
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
            for (let k = 1; k <= 6; k++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * k / 6, y: y + (y2 - y) * k / 6, buttons: 1 });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
          }
        }
        else if (st[0] === 'click') {
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: st[1], y: st[2] });
          await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: st[1], y: st[2], button: st[3] || 'left', clickCount: 1, buttons: 1 });
          await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: st[1], y: st[2], button: st[3] || 'left', clickCount: 1 });
        } else if (st[0] === 'kdown' || st[0] === 'kup') {
          await send('Input.dispatchKeyEvent', { type: st[0] === 'kdown' ? 'keyDown' : 'keyUp', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
        } else if (st[0] === 'key') {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
        }
      } catch (e) { console.log('ERR', st[0], String(st[1]).slice(0, 80), e.message.slice(0, 600)); }
      if (Date.now() - t0 > 3000) console.log('  took', Date.now() - t0, 'ms');
    }
    if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n'));
    else console.log('no errors');
  } finally {
    await cleanup();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
