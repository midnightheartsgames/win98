const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const HELPERS = `(() => {
  window.foShots = {
    pump(n, dt) {
      const g = window.fogame;
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try {
        let t = g.last || performance.now();
        for (let i = 0; i < n; i++) { t += (dt || 1 / 30) * 1000; g.frame(t); }
      } finally { window.requestAnimationFrame = raf; }
      return true;
    },
    async wait(cond, sec) {
      const end = Date.now() + (sec || 20) * 1000;
      while (Date.now() < end) {
        if (eval(cond)) return true;
        await new Promise(r => setTimeout(r, 50));
      }
      return false;
    }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'fallout-shots');
  const scriptFile = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700);
  const dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'foedge-'));
  const size = process.env.FO_SIZE || '1000,780';
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${size}`, '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const cleanup = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(300);
    } catch (e) {
      void e;
    }
    try {
      spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch (e) {
      void e;
    }
    server.kill();
  };
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try {
        target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page');
      } catch (e) {
        void e;
      }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) {
        pending.get(d.id)(d);
        pending.delete(d.id);
      }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    });
    const send = (method, params) => new Promise(r => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    const page = process.env.FO_PAGE || 'fallout.html?map=V13ENT';
    for (let i = 0; i < 40; i++) {
      try {
        if ((await fetch(`http://127.0.0.1:${sport}/server.js`)).status) break;
      } catch (e) {
        void e;
      }
      await sleep(250);
    }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    let ok = false;
    for (let i = 0; i < 240 && !ok; i++) {
      await sleep(250);
      try {
        ok = await evalJs(process.env.FO_READY || '!!(window.fogame && fogame.mode && fogame.mode.w && fogame.mode.w.map && !fogame.mode.busy)');
      } catch (e) {
        void e;
      }
    }
    if (!ok) {
      console.log('page not ready');
      console.log(errors.join('\n'));
      return;
    }
    await evalJs(HELPERS);
    const canvasRect = async () => JSON.parse(await evalJs('JSON.stringify(fogame.canvas.getBoundingClientRect())'));
    const shot = async (name, clip) => {
      const params = { format: 'png' };
      if (clip) params.clip = { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: clip[4] || 1 };
      const r = await send('Page.captureScreenshot', params);
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log('shot', name);
    };
    const toPage = async (x, y) => {
      const r = await canvasRect();
      const [w, h] = JSON.parse(await evalJs('JSON.stringify([fogame.scr.w, fogame.scr.h])'));
      return [r.left + (x + 0.5) * r.width / w, r.top + (y + 0.5) * r.height / h];
    };
    const steps = scriptFile && fs.existsSync(scriptFile) ? require(path.resolve(scriptFile)) : [['gshot', 'page']];
    for (const st of steps) {
      const t0 = Date.now();
      try {
        if (st[0] === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 3000));
        else if (st[0] === 'shot') await shot(st[1], st[2]);
        else if (st[0] === 'gshot') {
          const r = await canvasRect();
          const [w] = JSON.parse(await evalJs('JSON.stringify([fogame.scr.w])'));
          await shot(st[1], [r.left, r.top, r.width, r.height, w / r.width]);
        } else if (st[0] === 'sleep') await sleep(st[1]);
        else if (st[0] === 'move' || st[0] === 'click') {
          const [x, y] = await toPage(st[1], st[2]);
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          if (st[0] === 'click') {
            const btn = st[3] || 'left';
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: btn, clickCount: 1, buttons: btn === 'right' ? 2 : 1 });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: btn, clickCount: 1 });
          }
        } else if (st[0] === 'key') {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', code: st[1], key: st[2] || st[1], windowsVirtualKeyCode: st[3] || 0 });
        } else if (st[0] === 'text') {
          await send('Input.insertText', { text: st[1] });
        }
      } catch (e) {
        console.log('ERR', st[0], String(st[1]).slice(0, 80), e.message.slice(0, 600));
      }
      if (Date.now() - t0 > 3000) console.log('  took', Date.now() - t0, 'ms');
    }
    if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 40).join('\n'));
    else console.log('no errors');
  } finally {
    await cleanup();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
