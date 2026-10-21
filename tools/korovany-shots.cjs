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
  window.kvShots = {
    pump(n) {
      cancelAnimationFrame(kvui.raf);
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try { for (let i = 0; i < n; i++) { t = Math.max(t, (kvui.last || 0) * 1000) + 1000 / 60; kvui.frame(t); } }
      finally { window.requestAnimationFrame = raf; }
      return true;
    },
    run(sec) { return kvShots.pump(Math.round(sec * 60)); },
    start(fac, name) { kvui.newGame(fac, name || 'Тест'); return true; },
    g() { return kvui.game; },
    tp(x, z, yaw, pitch) { const g = kvui.game, p = g.player; p.x = x; p.z = z; p.y = g.world.floorAt(x, z, 999, 0); p.vx = p.vz = p.vy = 0; if (yaw != null) { kvui.camYaw = yaw; p.yaw = yaw; g.input.yaw = yaw; } if (pitch != null) kvui.camPitch = pitch; g.updateCells(); return true; },
    hour(h) { const g = kvui.game; g.time = Math.floor(g.time / 1440) * 1440 + h * 60; return true; },
    info() { const g = kvui.game, p = g.player; return kvui.state + ' x=' + p.x.toFixed(1) + ' z=' + p.z.toFixed(1) + ' hp=' + p.hp.toFixed(0) + ' fps=' + kvui.fps + ' ' + JSON.stringify(kvui.renderer.stats || {}); }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'korovany-shots');
  const scriptFile = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kvedge-'));
  const size = process.env.KV_SIZE || '1100,820';
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${size}`, '--mute-audio', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
    const page = process.env.KV_PAGE || 'korovany.html';
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/server.js`)).status) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    let ok = false;
    for (let i = 0; i < 160 && !ok; i++) { await sleep(250); try { ok = await evalJs(process.env.KV_READY || '!!(window.kvui && kvui.state === "title")'); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    if (page === 'korovany.html') await evalJs(HELPERS);
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
        else if (st[0] === 'sleep') await sleep(st[1]);
        else if (st[0] === 'mouse') await send('Input.dispatchMouseEvent', { type: st[1], x: st[2], y: st[3], button: st[4] || 'left', clickCount: 1, buttons: st[5] || 0 });
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
