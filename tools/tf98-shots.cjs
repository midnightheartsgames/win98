const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);
const CYCLES = 10;
const EAST = Math.PI / 2;
const YARD_VIEWS = [
  ['start', -54, 0, -42, EAST, 0],
  ['heights', -30, 0, -40, 0, 0],
  ['stairs', 14, 0, -38, 0.75, 0.05],
  ['pits', -56, 0, -15, EAST, -0.1],
  ['pool', 18, 0, -21, 0, -0.1],
  ['towers', -5, 0, 16, Math.PI, 0.1],
  ['tower-top', 12.5, 10, 4, Math.PI, -0.6],
  ['passages', -32, 0, 5, 0, 0.05],
  ['lineup', 28, 0, 11, 0, 0],
  ['roofs', -30, 0, 22, 0, 0.2],
  ['standing', 44, 0, -14, 0.6, 0]
];

const TRACKER = `(() => {
  const mine = () => /tf-ui\\.js|tf-audio\\.js|tf-render\\.js|tf98-app\\.js/.test(new Error().stack || '');
  const S = window.tfTrack = { timers: new Set(), rafs: new Set(), gl: [], audio: [], listeners: 0 };
  const { setTimeout: st, setInterval: si, clearTimeout: ct, clearInterval: ci, requestAnimationFrame: raf, cancelAnimationFrame: caf } = window;
  window.setTimeout = (fn, ...rest) => {
    if (!mine()) return st(fn, ...rest);
    const id = st((...a) => { S.timers.delete(id); fn(...a); }, ...rest);
    S.timers.add(id);
    return id;
  };
  window.setInterval = (fn, ...rest) => {
    const id = si(fn, ...rest);
    if (mine()) S.timers.add(id);
    return id;
  };
  window.clearTimeout = id => { S.timers.delete(id); ct(id); };
  window.clearInterval = id => { S.timers.delete(id); ci(id); };
  window.requestAnimationFrame = fn => {
    if (!mine()) return raf(fn);
    const id = raf(ts => { S.rafs.delete(id); fn(ts); });
    S.rafs.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { S.rafs.delete(id); caf(id); };
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const c = getContext.call(this, kind, ...rest);
    if (c && /webgl/.test(kind) && mine()) S.gl.push(c);
    return c;
  };
  const Audio = window.AudioContext;
  if (Audio) window.AudioContext = class extends Audio { constructor(...a) { super(...a); if (mine()) S.audio.push(this); } };
  const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (...a) { if ((this === window || this === document) && mine()) S.listeners++; return add.apply(this, a); };
  EventTarget.prototype.removeEventListener = function (...a) { if ((this === window || this === document) && mine()) S.listeners--; return remove.apply(this, a); };
})()`;

const CYCLE = `(async () => {
  const S = window.tfTrack;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let shown = 0;
  for (let i = 0; i < ${CYCLES}; i++) {
    appTf98.open();
    await wait(60);
    if (document.querySelector('.tf98 .tf98-gl')) shown++;
    if (i % 2) { appTf98.ui.start(i === 5 ? 'arena' : undefined, 'worker'); await wait(60); }
    if (i === 3) { appTf98.ui.pickMerc('diver'); appTf98.ui.keys.Enter = true; await wait(200); appTf98.ui.keys.Enter = false; }
    winManager.closeWindow('app_tf98');
    await wait(60);
  }
  await wait(400);
  return {
    opens: ${CYCLES},
    shown,
    pendingFrames: S.rafs.size,
    pendingTimers: S.timers.size,
    listeners: S.listeners,
    glCreated: S.gl.length,
    glAlive: S.gl.filter(g => !g.isContextLost()).length,
    audioAlive: S.audio.filter(a => a.state !== 'closed').length,
    windowLeft: winManager.windows.has('app_tf98'),
    domLeft: !!document.querySelector('.tf98'),
    uiLeft: !!appTf98.ui
  };
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'tf98-shots');
  const scene = process.argv[3] || 'menu';
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tfedge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,860', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
  let failed = false;
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
    });
    const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    const shot = async name => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(out, name + '.png');
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      console.log('saved', file);
    };
    const waitFor = async (expr, tries) => {
      for (let i = 0; i < tries; i++) { await sleep(250); try { if (await evalJs(expr)) return true; } catch (e) { } }
      return false;
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: TRACKER });
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/tf98.html`)).status === 200) break; } catch (e) { } await sleep(250); }
    if (scene === 'menu') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await sleep(800);
      await shot('menu');
    } else if (scene === 'yard') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await evalJs('tfui.start(); true');
      for (const [name, x, y, z, yaw, pitch] of YARD_VIEWS) {
        await evalJs(`(() => { const p = tfui.game.player; p.pos.x = p.prev.x = ${x}; p.pos.y = p.prev.y = ${y}; p.pos.z = p.prev.z = ${z}; p.vel.x = p.vel.y = p.vel.z = 0; tfui.yaw = ${yaw}; tfui.pitch = ${pitch}; tfui.acc = 0; tfui.drawFrame(); return true; })()`);
        await sleep(120);
        await shot('yard-' + name);
      }
    } else if (scene === 'input') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await evalJs('addEventListener("keydown", e => { window.tfLastKey = [e.code, e.defaultPrevented]; }); tfui.start(); true');
      const key = (type, code, name, vk, modifiers = 0) => send('Input.dispatchKeyEvent', { type, code, key: name, windowsVirtualKeyCode: vk, modifiers });
      const tap = async (code, name, vk, modifiers) => { await key('keyDown', code, name, vk, modifiers); await key('keyUp', code, name, vk, modifiers); };
      const read = expr => evalJs(expr);
      const checks = {};
      const x0 = await read('tfui.game.player.pos.x');
      await key('keyDown', 'KeyW', 'w', 87);
      await sleep(1000);
      await key('keyUp', 'KeyW', 'w', 87);
      await sleep(300);
      const walked = await read('tfui.game.player.pos.x') - x0;
      console.log('walked', walked.toFixed(2));
      checks.walks = walked > 4;
      await key('keyDown', 'Enter', 'Enter', 13);
      await sleep(200);
      await key('keyUp', 'Enter', 'Enter', 13);
      checks.fires = await read('tfui.game.player.arms[0].clip < 6');
      await tap('Digit2', '2', 50);
      await sleep(60);
      checks.digitSlots = await read('tfui.game.player.slot === 1');
      await tap('KeyQ', 'q', 81);
      await sleep(60);
      checks.qLast = await read('tfui.game.player.slot === 0');
      await sleep(700);
      await tap('KeyR', 'r', 82);
      await sleep(120);
      checks.reloadStarts = await read('tfui.game.player.reloading || tfui.game.player.arms[0].clip === 6');
      await tap('KeyB', 'b', 66);
      checks.critBoost = await read('tfui.game.player.critT > 0');
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 400, button: 'left', buttons: 1, clickCount: 1 });
      checks.mouseDown = await read('tfui.mouse.b0');
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 640, y: 400, button: 'left', buttons: 0, clickCount: 1 });
      checks.mouseUp = await read('!tfui.mouse.b0');
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: 120 });
      await sleep(120);
      checks.wheelSlots = await read('tfui.game.player.slot === 1');
      await key('keyDown', 'ShiftLeft', 'Shift', 16, 8);
      await tap('Digit5', '%', 53, 8);
      await key('keyUp', 'ShiftLeft', 'Shift', 16);
      checks.digitPicks = await read('tfui.game.player.merc === "strongman" && tfui.game.player.hp === 300');
      await tap('Comma', ',', 188);
      checks.commaNext = await read('tfui.game.player.merc === "plumber"');
      await tap('Period', '.', 190);
      checks.periodSide = await read('tfui.game.player.team === "cold" && tfui.game.player.pos.x > 0');
      await tap('Space', ' ', 32);
      await sleep(120);
      checks.spaceJumps = await read('tfui.game.player.pos.y > 0.3');
      await sleep(1200);
      await tap('KeyP', 'p', 80);
      checks.resetReturns = await read('tfui.game.player.pos.y === 0 && tfui.game.player.pos.x > 50');
      await tap('F10', 'F10', 121);
      checks.keepsF10 = await read('tfLastKey[0] === "F10" && !tfLastKey[1]');
      await tap('F10', 'F10', 121, 2);
      checks.keepsCtrlF10 = await read('tfLastKey[0] === "F10" && !tfLastKey[1]');
      await tap('Escape', 'Escape', 27);
      checks.escapePauses = await read('tfui.mode === "pause" && !tfui.panel.hidden');
      const frozen = await read('tfui.game.tickN');
      await sleep(300);
      checks.pauseFreezes = await read('tfui.game.tickN') === frozen;
      await shot('pause');
      await tap('Escape', 'Escape', 27);
      checks.escapeResumes = await read('tfui.mode === "play" && tfui.panel.hidden');
      console.log(JSON.stringify(checks));
      failed = Object.values(checks).some(v => !v);
      if (failed) console.log('a key does not work');
    } else if (scene === 'weapons') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await evalJs('tfui.start(); true');
      const at = (merc, x, y, z, yaw, pitch) => evalJs(`(() => { tfui.pickMerc('${merc}'); const p = tfui.game.player; p.pos.x = p.prev.x = ${x}; p.pos.y = p.prev.y = ${y}; p.pos.z = p.prev.z = ${z}; p.vel.x = p.vel.y = p.vel.z = 0; tfui.yaw = ${yaw}; tfui.pitch = ${pitch}; tfui.acc = 0; return true; })()`);
      const run = (ticks, fire) => evalJs(`(() => { tfui.keys.Enter = ${fire}; for (let i = 0; i < ${ticks}; i++) tfui.simulate(1 / 60); tfui.keys.Enter = false; tfui.clock += ${ticks} / 60; tfui.drawFrame(); return true; })()`);
      await at('diver', 4, 0, 36, EAST, 0);
      await sleep(600);
      await run(8, true);
      await shot('weapons-rocket');
      await run(9, false);
      await shot('weapons-boom');
      await sleep(900);
      await at('runner', 6, 0, 36, EAST, 0);
      await sleep(600);
      await run(1, true);
      await shot('weapons-sawn');
      await sleep(800);
      await run(4, false);
      await at('diver', 10, 0, 33, EAST, 0.2);
      await evalJs('tfui.game.debugBoost(tfui.game.player, "crit"); true');
      await sleep(600);
      await run(1, true);
      await run(16, false);
      await shot('weapons-crit');
      await sleep(600);
      await at('welder', 7, 0, 36, EAST, 0);
      await sleep(600);
      await run(40, true);
      await evalJs('tfui.keys.Enter = true; true');
      await sleep(250);
      await shot('weapons-torch');
      await evalJs('tfui.keys.Enter = false; true');
      await at('miner', 5, 0, 30, EAST, -0.5);
      await sleep(600);
      await run(4, false);
      await evalJs('tfui.pending.slot = 2; true');
      await run(40, false);
      await run(6, true);
      await run(40, false);
      await run(6, true);
      await run(50, false);
      await shot('weapons-mines');
      await at('vet', 2, 0, 16, EAST, -0.05);
      await sleep(600);
      await evalJs('tfui.pending.slot = 2; true');
      await run(40, false);
      await run(12, true);
      await evalJs('tfui.keys.Enter = true; true');
      await sleep(250);
      await shot('weapons-hose');
      await evalJs('tfui.keys.Enter = false; true');
      await at('hunter', 4, 0, 36, EAST, 0.03);
      await sleep(600);
      await evalJs('tfui.mouse.b2 = true; tfui.simulate(1 / 60); tfui.mouse.b2 = false; true');
      await run(120, false);
      await shot('weapons-scope');
      await evalJs('tfui.game.player.scoped = false; true');
      await at('strongman', 4, 0, 36, EAST, 0);
      await sleep(600);
      await run(70, true);
      await evalJs('tfui.keys.Enter = true; true');
      await sleep(250);
      await shot('weapons-carousel');
      await evalJs('tfui.keys.Enter = false; true');
      await at('plumber', 8, 0, 20, 0, -0.1);
      await sleep(300);
      await evalJs('(() => { const g = tfui.game, p = g.player; p.hp = p.maxHp; tfui.pending.slot = 4; return true; })()');
      await sleep(700);
      await evalJs('tfui.pending.pick = 1; true');
      await sleep(200);
      await shot('weapons-ghost');
      await evalJs('tfui.pending.fire = true; true');
      await sleep(200);
      await evalJs('(() => { const b = tfui.game.buildings[0]; b.buildLeft = 0; b.hp = b.maxHp; return !!b; })()');
      await sleep(1500);
      await shot('weapons-hydrant');
      await at('inspector', 18, 0, 25.5, Math.PI, 0);
      await sleep(500);
      await evalJs('tfui.pending.slot = 3; true');
      await sleep(700);
      await shot('weapons-stab');
      await evalJs('tfui.pending.slot = 4; true');
      await sleep(700);
      await shot('weapons-forms');
      await evalJs('tfui.mouse.b2 = true; true');
      await sleep(60);
      await evalJs('tfui.mouse.b2 = false; tfui.pending.slot = 1; true');
      await sleep(700);
      await evalJs('tfui.mouse.b2 = true; true');
      await sleep(60);
      await evalJs('tfui.mouse.b2 = false; true');
      await sleep(1200);
      await shot('weapons-cloak');
      await at('knight', -20, 0, -42, EAST, 0);
      await sleep(500);
      await evalJs('tfui.mouse.b2 = true; true');
      await sleep(80);
      await evalJs('tfui.mouse.b2 = false; true');
      await sleep(950);
      await shot('weapons-charge');
      await sleep(1000);
      await at('diver', 14, 0, 42, 0, -0.1);
      await sleep(400);
      await run(1, false);
      await shot('weapons-supplies');
    } else if (scene === 'map') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await evalJs('tfui.start("2fort", "novice"); tfui.game.player.hp = tfui.game.player.maxHp = 1e6; true');
      const views = [
        ['fort-bridge', 12, 0, 0, -1.57, 0], ['fort-facade', 6, 0, 0, 1.57, 0.08], ['fort-canal', 0, -3.4, 8, 2.4, 0.1],
        ['fort-lobby', 20.5, 0, -7, 1.2, 0], ['fort-stem', 34.5, 0, 0, -1.57, 0], ['fort-corridor', 40.3, 0, 13, 3.14, 0],
        ['fort-side', 35.5, 0, 5, -0.8, 0], ['fort-yard', 36, 0, 27.5, 2.2, 0.05], ['fort-hall', 35.5, 3.4, 5, -0.8, 0],
        ['fort-grate', 28, 3.4, 2, 2.03, -0.3], ['fort-bastion', 20.5, 3.4, 0, -1.57, -0.02], ['fort-ledge', 21, 3.4, 13, -1.8, -0.05],
        ['fort-spiral', 38, 3.4, 9.2, 1.57, -0.05], ['fort-spiral2', 45.2, 3.2, 7, 3.14, -0.2], ['fort-stairs', 51.5, 0, 25.2, 1.57, -0.15],
        ['fort-basement', 53.5, -5, 15, 1.57, 0], ['fort-corridor2', 73.7, -5, 11, 3.14, 0], ['fort-control', 59.2, -5, -5.8, 1.57, -0.05],
        ['fort-window', 64.5, -5, -3.5, 3.14, 0.05], ['fort-tunnel', 12.5, -3.2, -6, -1.57, 0], ['fort-shower', 29, 0, 38.5, 3.14, 0],
        ['fort-side-shower', 36, 3.4, -30, 0.4, 0]
      ];
      for (const [name, x, y, z, yaw, pitch] of views) {
        await evalJs(`(() => { const p = tfui.game.player; p.hp = 1e6; p.pos.x = p.prev.x = ${x}; p.pos.y = p.prev.y = ${y}; p.pos.z = p.prev.z = ${z}; p.vel.x = p.vel.y = p.vel.z = 0; tfui.yaw = ${yaw}; tfui.pitch = ${pitch}; return true; })()`);
        await sleep(350);
        await shot(name);
      }
    } else if (scene === 'arena') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/tf98.html` });
      if (!await waitFor('!!window.tfui', 80)) { console.log('page not ready'); failed = true; return; }
      await evalJs('tfui.start("arena", "worker"); true');
      await sleep(600);
      await shot('arena-start');
      await sleep(9000);
      await shot('arena-fight');
      const state = await evalJs('(() => { const g = tfui.game; return { score: g.score, alive: g.heroes.filter(h => h.alive).length, stuck: g.aiStuck || 0 }; })()');
      console.log(JSON.stringify(state));
      await evalJs('(() => { const p = tfui.game.player; p.pos.x = p.prev.x = 0; p.pos.y = p.prev.y = 3.4; p.pos.z = p.prev.z = -8; tfui.yaw = 0; tfui.pitch = -0.2; return true; })()');
      await sleep(300);
      await shot('arena-bridge');
    } else if (scene === 'cycle') {
      await send('Page.navigate', { url: `http://127.0.0.1:${sport}/index.html` });
      if (!await waitFor('!!(window.winManager && window.appTf98 && document.getElementById("boot-screen").style.display === "none" && !document.getElementById("bios-post-screen").classList.contains("active") && document.querySelector("#desktop-icons > *"))', 240)) { console.log('system not ready'); failed = true; return; }
      await sleep(1000);
      await evalJs('appTf98.open(); true');
      await sleep(800);
      await shot('window');
      await evalJs('winManager.closeWindow("app_tf98"); true');
      await sleep(200);
      const report = await evalJs(CYCLE);
      console.log(JSON.stringify(report));
      failed = report.shown !== CYCLES || report.pendingFrames || report.pendingTimers || report.listeners || report.glAlive || report.audioAlive || report.windowLeft || report.domLeft || report.uiLeft;
      if (failed) console.log('leak or missing window');
    } else {
      console.log('unknown scene: ' + scene);
      failed = true;
    }
    if (errors.length) { console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 20).join('\n')); }
  } finally {
    await cleanup();
  }
  if (failed) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exit(1); });
