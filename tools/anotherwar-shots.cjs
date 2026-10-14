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
  window.awShots = {
    pump(n, dt) {
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try { for (let i = 0; i < n; i++) { t = Math.max(t, awui.last || 0) + (dt || 1 / 30) * 1000; awui.frame(t); } }
      finally { window.requestAnimationFrame = raf; }
      return true;
    },
    run(sec) { return awShots.pump(Math.round(sec * 30)); },
    ff(sec) {
      const g = awui.game;
      for (let i = 0; i < Math.round(sec * 30); i++) {
        if (!g.W || g.assetsBusy || g.paused || awui.screenPause || !g.running) break;
        g.step();
      }
      return awShots.pump(1);
    },
    async waitFF(cond, sec) {
      const end = Date.now() + (sec || 30) * 1000;
      const g = awui.game;
      while (Date.now() < end) {
        if (eval(cond)) { awShots.pump(1); return true; }
        if (g.W && !g.assetsBusy && !g.paused && !awui.screenPause && g.running) {
          for (let i = 0; i < 30 && !eval(cond); i++) { g.step(); if (g.assetsBusy) break; }
        }
        await new Promise(r => setTimeout(r, 15));
      }
      return false;
    },
    async wait(cond, sec) {
      const end = Date.now() + (sec || 20) * 1000;
      while (Date.now() < end) {
        if (eval(cond)) return true;
        awShots.pump(3);
        await new Promise(r => setTimeout(r, 30));
      }
      return false;
    },
    info() {
      const g = awui.game, W = g && g.W;
      if (!W) return 'no world, screen=' + (awui.screen ? awui.screen.kind : '-');
      return W.levelId + ' hero=' + Math.round(W.hero.x) + ',' + Math.round(W.hero.y) + ' ctl=' + W.controlState + ' busy=' + g.assetsBusy + ' dlg=' + (W.dialog ? W.dialog.name + ':' + (W.dialog.node && W.dialog.node.id) : '-') + ' screen=' + (awui.screen ? awui.screen.kind : '-');
    }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'anotherwar-shots');
  const scriptFile = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'awedge-'));
  const size = process.env.AW_SIZE || '1060,840';
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${size}`, '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
    const page = process.env.AW_PAGE || 'anotherwar.html';
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/server.js`)).status) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    let ok = false;
    for (let i = 0; i < 240 && !ok; i++) { await sleep(250); try { ok = await evalJs(process.env.AW_READY || '!!(window.awui && awui.ready)'); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    await evalJs(HELPERS);
    const stageRect = async () => JSON.parse(await evalJs('JSON.stringify(awui.stage.getBoundingClientRect())'));
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
        if (st[0] === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 3000));
        else if (st[0] === 'shot') await shot(st[1], st[2]);
        else if (st[0] === 'sshot') {
          const r = await stageRect();
          const c = st[2] || [0, 0, 800, 600];
          const k = r.width / 800;
          await shot(st[1], [r.left + c[0] * k, r.top + c[1] * k, c[2] * k, c[3] * k, st[3] || 1 / k]);
        }
        else if (st[0] === 'sleep') await sleep(st[1]);
        else if (st[0] === 'sclick' || st[0] === 'smove' || st[0] === 'sdrag') {
          const r = await stageRect();
          const map = (x, y) => [r.left + x / 800 * r.width, r.top + y / 600 * r.height];
          const pt = typeof st[1] === 'string' ? JSON.parse(await evalJs('JSON.stringify(' + st[1] + ')')) : [st[1], st[2]];
          const [x, y] = map(pt[0], pt[1]);
          const btn = st[0] === 'sclick' ? (typeof st[1] === 'string' ? st[2] : st[3]) || 'left' : 'left';
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          if (st[0] === 'sclick') {
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: btn, clickCount: 1, buttons: btn === 'right' ? 2 : 1 });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: btn, clickCount: 1 });
          }
          if (st[0] === 'sdrag') {
            const [x2, y2] = map(st[3], st[4]);
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
            for (let k = 1; k <= 6; k++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * k / 6, y: y + (y2 - y) * k / 6, buttons: 1 });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
          }
        } else if (st[0] === 'key') {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
        } else if (st[0] === 'text') {
          await send('Input.insertText', { text: st[1] });
        }
      } catch (e) { console.log('ERR', st[0], String(st[1]).slice(0, 80), e.message.slice(0, 600)); }
      if (Date.now() - t0 > 3000) console.log('  took', Date.now() - t0, 'ms');
    }
    if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 40).join('\n'));
    else console.log('no errors');
  } finally {
    await cleanup();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
