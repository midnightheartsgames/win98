const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const PAGE = `(() => {
  window.g90Shots = {
    t: 0,
    stub() { if (!this.stubbed) { window.requestAnimationFrame = () => 0; this.stubbed = true; this.t = performance.now(); } },
    pump(n) { this.stub(); for (let i = 0; i < n; i++) { this.t += 1000 / 60; g90ui.frame(this.t); } return true; },
    start(ch) {
      g90ui.newGame(0);
      if (ch) { g90ui.game.prog.chapter = ch; g90ui.game.startChapter(ch, { keepScore: true }); }
      g90ui.startPlay();
      g90ui.game.msgs = []; g90ui.game.brief = null;
      return true;
    },
    go(id, dx, dy, zoom) {
      const g = g90ui.game, w = g.world, c = w.city;
      const p = typeof id === 'string' ? c.places[id] : { x: id[0], y: id[1] };
      const P = w.player;
      if (P.car) { const car = P.car; car.driver = null; P.car = null; }
      P.x = p.x + (dx || 0) * c.M; P.y = p.y + (dy || 0) * c.M;
      g90ui.cam.x = P.x; g90ui.cam.y = P.y;
      if (zoom) { g90ui.zoomMul = zoom; g90ui.cam.zoom = 1.12 * zoom; }
      g.msgs = []; g.brief = null;
      return true;
    },
    geo(lat, lon, zoom) { const c = g90ui.game.world.city; return this.go(c.fromGeo(lat, lon), 0, 0, zoom); },
    car(model) {
      const w = g90ui.game.world, P = w.player;
      const r = w.city.net.nearestLane(P.x, P.y, null, 600, true);
      if (!r) return false;
      const c = w.spawnCar(model || 'gaz24', r.x, r.y, r.a, { parked: true });
      w.enterCar(P, c);
      return true;
    },
    drive(frames) { this.stub(); g90ui.keys = { up: true }; this.pump(frames); g90ui.keys = {}; return true; },
    stats() { const w = g90ui.game ? g90ui.game.world : g90ui.tw; return w ? { cars: w.cars.length, peds: w.peds.length, trams: (w.trams || []).length, zone: g90ui.game ? g90ui.game.zone : '' } : {}; },
    shot() { return g90ui.cv.toDataURL('image/png'); }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'gta90-shots');
  const scenes = (process.argv[3] || 'title,plotinka,sq1905,drive,map').split(',');
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g90edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,820', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  const cleanup = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const b = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => { b.addEventListener('open', r, { once: true }); setTimeout(r, 1500); });
      b.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(400);
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
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    });
    const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/gta90.html`)).status === 200) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/gta90.html` });
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) { await sleep(500); try { ready = await evalJs('!!(window.g90ui && g90ui.city)'); } catch (e) { } }
    if (!ready) { console.log('not ready', errors.join('\n')); return; }
    await evalJs(PAGE);
    const save = async (name, how) => {
      let buf;
      if (how === 'page') { const r = await send('Page.captureScreenshot', { format: 'png' }); buf = Buffer.from(r.result.data, 'base64'); }
      else { const url = await evalJs('g90Shots.shot()'); buf = Buffer.from(url.split(',')[1], 'base64'); }
      fs.writeFileSync(path.join(out, name + '.png'), buf);
      console.log(name, JSON.stringify(await evalJs('g90Shots.stats()')));
    };
    const script = fs.existsSync(process.argv[4] || '') ? fs.readFileSync(process.argv[4], 'utf8') : null;
    let started = false;
    const ensure = async ch => { if (!started || ch) { await evalJs(`g90Shots.start(${ch || 0})`); started = true; } };
    for (const sc of scenes) {
      const t0 = Date.now();
      const [kind, a, b, c] = sc.split(':');
      if (kind === 'title') { await evalJs('g90Shots.pump(90)'); await save('title', 'page'); }
      else if (kind === 'place') { await ensure(); await evalJs(`g90Shots.go('${a}', 0, 0, ${b || 1})`); await evalJs('g90Shots.pump(150)'); await save('place_' + a + (b ? '_' + b : '')); }
      else if (kind === 'geo') { await ensure(); await evalJs(`g90Shots.geo(${a}, ${b}, ${c || 1})`); await evalJs('g90Shots.pump(150)'); await save('geo_' + a + '_' + b); }
      else if (kind === 'drive') { await ensure(); await evalJs(`g90Shots.go('${a || 'rat_start'}', 0, 0, 1)`); await evalJs("g90Shots.car('gaz24')"); await evalJs('g90Shots.drive(' + (b || 150) + ')'); await save('drive_' + (a || 'rat_start')); }
      else if (kind === 'map') { await ensure(); await evalJs('g90ui.showMap(() => g90ui.closeOverlay()); true'); await evalJs('g90Shots.pump(5)'); await save('map', 'page'); await evalJs('g90ui.closeOverlay(); true'); }
      else if (kind === 'script' && script) { await ensure(); const r = await evalJs(script); if (typeof r === 'string' && r.startsWith('data:image')) fs.writeFileSync(path.join(out, (a || 'script') + '.png'), Buffer.from(r.split(',')[1], 'base64')); else console.log('script', JSON.stringify(r)); }
      console.log('  scene', sc, (Date.now() - t0) + 'ms');
    }
    if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 20).join('\n'));
  } finally {
    await cleanup();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
