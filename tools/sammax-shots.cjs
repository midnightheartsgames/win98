const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const HELPERS = `(() => {
  const ui = window.smx22 || window.smx21 || window.smx6 || window.smx5 || window.smx4 || window.smx3 || window.smx2 || window.smxui;
  const G = () => ui.g;
  window.smx = ui;
  window.T = {
    step(n) { for (let i = 0; i < n; i++) ui.step(1 / 30); ui.draw(); return T.info(); },
    idle(max) {
      let n = 0;
      while (ui.screen === 'game' && (G().busy || (G().fade > 0.001 && !G().ended) || (G().mode === 'drive' && G().drive && G().drive.kind === 'travel')) && n < (max || 20000)) { ui.step(1 / 30); n++; }
      if (ui.screen === 'game') for (let i = 0; i < 3; i++) ui.step(1 / 30);
      ui.draw();
      return T.info();
    },
    act(verb, target, item) {
      T.idle();
      if (!G().perform(verb, target, item)) return 'FAIL perform ' + verb + ' ' + target + ' ' + (item || '') + ' hot=' + G().hotspots().map(h => h.id).join(',');
      return T.idle();
    },
    ch(id) {
      T.idle();
      if (!G().dialog || !G().optionIds().includes(id)) return 'FAIL choose ' + id + ' ' + T.info();
      G().choose(id);
      return T.idle();
    },
    bye() { return G().dialog && G().optionIds().includes('bye') ? T.ch('bye') : T.info(); },
    mapTo(dest, hot) {
      const a = T.act('use', hot || 'desoto');
      if (!G().drive) return 'FAIL map ' + a;
      G().drive.choose(dest);
      let n = 0;
      while (G().mode !== 'room' && n < 3000) { ui.step(1 / 30); n++; }
      return T.idle();
    },
    until(cond, max) {
      let n = 0;
      while (!cond(G()) && n < (max || 8000)) { ui.step(1 / 30); n++; }
      ui.draw();
      return n + ' ' + T.info();
    },
    info() {
      const g = G();
      if (!g) return 'screen=' + ui.screen;
      const errs = g.log.filter(l => l.startsWith('script error'));
      return g.roomId + ' mode=' + g.mode + ' busy=' + g.busy + ' dlg=' + (g.dialog ? g.dialog.id + '[' + g.optionIds().join(',') + ']' : '-') + ' cu=' + (g.closeup ? g.closeup.kind : '-') + ' inv=' + g.inv.join(',') + ' verb=' + g.verb + ' hover=' + g.hoverLabel() + (errs.length ? ' ERR=' + errs.join('|') : '') + ' screen=' + ui.screen;
    },
    pt(x, y) { const r = ui.cv.getBoundingClientRect(); return [r.left + (x + 0.5) / 320 * r.width, r.top + (y + 0.5) / 200 * r.height]; },
    titlePt(i) {
      for (let y = 0; y < 200; y += 2) for (let x = 0; x < 320; x += 2) if (ui.ep.TITLE.hit(x, y) === i) return T.pt(x + 6, y + 2);
      return null;
    },
    optPt(i) { const n = G().dialogOptions().length; return T.pt(Math.max(6, Math.floor((320 - n * 30) / 2)) + i * 30 + 15, 186); },
    hotPt(id) {
      const g = G(), h = g.hotspots().find(h => h.id === id);
      const p = h.poly || [h.rect[0], h.rect[1], h.rect[0] + h.rect[2], h.rect[1], h.rect[0] + h.rect[2], h.rect[1] + h.rect[3], h.rect[0], h.rect[1] + h.rect[3]];
      let cx = 0, cy = 0;
      for (let i = 0; i < p.length; i += 2) { cx += p[i]; cy += p[i + 1]; }
      return T.pt(Math.round(cx / (p.length / 2) - g.camX), Math.round(cy / (p.length / 2)));
    }
  };
  return 'canvas ' + ui.cv.style.width + ' x ' + ui.cv.style.height;
})()`;

async function main() {
  const out = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'sammax-shots'));
  const planFile = process.argv[3];
  const plan = planFile ? require(path.resolve(planFile)) : {};
  const page = process.argv[4] || plan.page || 'sammax103.html';
  const ready = plan.ready || '!!(window.smx22 || window.smx21 || window.smx6 || window.smx5 || window.smx4 || window.smx3 || window.smx2 || window.smxui)';
  const steps = plan.steps || (Array.isArray(plan) ? plan : [['sleep', 500], ['shot', 'title', '.smx-cv']]);
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smxedge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${plan.size || '1280,900'}`, '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
    }
    if (!target) { console.log('Edge did not start'); return; }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text));
      if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push('CON ' + d.params.args.map(a => a.value || a.description).join(' '));
      if (d.method === 'Network.responseReceived' && d.params.response.status >= 400 && !d.params.response.url.endsWith('/favicon.ico')) errors.push('HTTP ' + d.params.response.status + ' ' + d.params.response.url);
    });
    const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    const mouse = async (x, y, btn) => {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      if (!btn) return;
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: btn, clickCount: 1, buttons: btn === 'right' ? 2 : 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: btn, clickCount: 1 });
    };
    const point = async expr => JSON.parse(await evalJs('JSON.stringify(' + expr + ')'));
    const shot = async (name, sel) => {
      const params = { format: 'png' };
      if (sel) {
        const r = await point(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`);
        params.clip = { x: r[0], y: r[1], width: r[2], height: r[3], scale: 1 };
      }
      const r = await send('Page.captureScreenshot', params);
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log('shot', name);
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    await send('Network.enable', {});
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/index.html`)).status === 200) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${page}` });
    let ok = false;
    for (let i = 0; i < 240 && !ok; i++) { await sleep(250); try { ok = await evalJs(ready); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    if (!plan.noHelpers) console.log(await evalJs(HELPERS));
    for (const st of steps) {
      const t0 = Date.now();
      try {
        if (st[0] === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 2500));
        else if (st[0] === 'shot') await shot(st[1], st[2]);
        else if (st[0] === 'sleep') await sleep(st[1]);
        else if (st[0] === 'move') { const p = await point(st[1]); await mouse(p[0], p[1]); }
        else if (st[0] === 'click') { const p = await point(st[1]); await mouse(p[0], p[1], st[2] || 'left'); }
        else if (st[0] === 'key') {
          const key = st[1], code = st[2] || st[1], vk = st[3] || 0;
          const text = key.length === 1 ? key : undefined;
          await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', code, key, windowsVirtualKeyCode: vk, text });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: vk });
        } else if (st[0] === 'loop') {
          let n = 0, clicks = 0;
          while (n < (st[4] || 3000) && !(await evalJs(st[1]))) {
            n++;
            const p = await point(st[2]);
            if (p) { clicks++; await mouse(p[0], p[1], p.length > 2 ? p[2] : 'left'); }
            await evalJs(st[3]);
          }
          console.log('loop', n, 'iterations', clicks, 'clicks');
        }
      } catch (e) { console.log('ERR', st[0], String(st[1]).slice(0, 90), e.message.slice(0, 700)); }
      if (Date.now() - t0 > 4000) console.log('  took', Date.now() - t0, 'ms');
    }
    console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 40).join('\n') : 'no errors');
  } finally {
    await cleanup();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
