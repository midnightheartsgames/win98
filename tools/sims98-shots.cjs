const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CYCLES = 10;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const TRACKER = `(() => {
  const mine = () => /ts-[a-z-]+\\.js|sims98-app\\.js/.test(new Error().stack || '');
  const T = window.tsTrack = { timers: new Set(), rafs: new Set(), gl: [], audio: [], listeners: 0 };
  const { setTimeout: st, setInterval: si, clearTimeout: ct, clearInterval: ci, requestAnimationFrame: raf, cancelAnimationFrame: caf } = window;
  window.setTimeout = (fn, ...rest) => {
    if (!mine()) return st(fn, ...rest);
    const id = st((...a) => { T.timers.delete(id); fn(...a); }, ...rest);
    T.timers.add(id);
    return id;
  };
  window.setInterval = (fn, ...rest) => {
    const id = si(fn, ...rest);
    if (mine()) T.timers.add(id);
    return id;
  };
  window.clearTimeout = id => { T.timers.delete(id); ct(id); };
  window.clearInterval = id => { T.timers.delete(id); ci(id); };
  window.requestAnimationFrame = fn => {
    if (!mine()) return raf(fn);
    const id = raf(ts => { T.rafs.delete(id); fn(ts); });
    T.rafs.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { T.rafs.delete(id); caf(id); };
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const c = getContext.call(this, kind, ...rest);
    if (c && /webgl/.test(kind) && mine()) T.gl.push(c);
    return c;
  };
  const Audio = window.AudioContext;
  if (Audio) window.AudioContext = class extends Audio { constructor(...a) { super(...a); if (mine()) T.audio.push(this); } };
  const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (...a) { if ((this === window || this === document) && mine()) T.listeners++; return add.apply(this, a); };
  EventTarget.prototype.removeEventListener = function (...a) { if ((this === window || this === document) && mine()) T.listeners--; return remove.apply(this, a); };
})()`;

async function launch() {
  const sport = randomPort(8300, 600), dport = randomPort(9600, 300);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore', windowsHide: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sims98-edge-'));
  const gfx = process.argv.includes('--gpu') ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'];
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=2000,1300', ...gfx, '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const close = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(400);
    } catch (e) { }
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch (e) { }
    server.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { }
  };
  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
  }
  if (!target) { await close(); throw new Error('Edge did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map(), errors = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails;
      errors.push(x.exception ? x.exception.description : x.text);
    }
  });
  const send = (method, params) => new Promise(r => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) {
      const x = r.result.exceptionDetails;
      throw new Error(x.exception ? x.exception.description : x.text);
    }
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  await send('Runtime.enable', {});
  await send('Page.enable', {});
  await send('Network.enable', {});
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: TRACKER });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://127.0.0.1:${sport}/sims98.html`)).status === 200) break; } catch (e) { }
    await sleep(250);
  }
  const base = `http://127.0.0.1:${sport}`;
  const cdp = {
    errors, eval: evalJs, send,
    async open(page) {
      await send('Page.navigate', { url: base + page });
      await this.until('location.href === ' + JSON.stringify(base + page) + ' && document.readyState === "complete"', 30000);
    },
    async until(expr, ms) {
      const end = Date.now() + (ms || 15000);
      while (Date.now() < end) {
        try { if (await evalJs(expr)) return true; } catch (e) { }
        await sleep(100);
      }
      throw new Error('timeout: ' + expr);
    },
    async shot(file, selector) {
      let clip;
      if (selector) {
        const r = await evalJs(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; })()`);
        if (r) clip = { ...r, scale: 1 };
      }
      const res = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
      fs.writeFileSync(file, Buffer.from(res.result.data, 'base64'));
      return file;
    }
  };
  return { cdp, close };
}

const quiet = cdp => cdp.eval('(() => { const w = window.tsui && tsui.ready && tsui.scene && tsui.scene.world; if (w) { Sims98.Opps.of(w).next = 1e9; Sims98.Services.of(w).burglar = 1e9; } return true; })()');
const place = async (cdp, w, h) => {
  await cdp.eval(`(() => { document.getElementById('game').style.cssText = 'position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:9'; return true; })()`);
  return quiet(cdp);
};

const SCENES = {
  async boot(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    const info = await cdp.eval('({ loadMs: Math.round(tsui.loadMs), frames: tsui.frames, ticks: tsui.ticks, screen: tsui.screen, world: [tsui.world.width, tsui.world.height], panels: [tsui.panels.width, tsui.panels.height], gl: !!tsui.gl, live: Sims98.live })');
    log.push('boot: ' + JSON.stringify(info));
    if (info.world[0] !== 800 || info.world[1] !== 600 || info.panels[0] !== 800 || info.panels[1] !== 600) throw new Error('layers are not 800x600');
    if (!info.gl) throw new Error('no WebGL 2 context');
    if (info.ticks < 3) throw new Error('the loop does not run');
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.width === 800');
    await cdp.until(`tsui.frames > ${info.frames + 5}`);
    await sleep(600);
    await cdp.shot(path.join(out, 'boot.png'), '#game');
  },
  async pause(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    await place(cdp, 800, 600);
    await cdp.eval('tsui.isActive = () => false, true');
    await sleep(300);
    const a = await cdp.eval('tsui.ticks');
    await sleep(600);
    const b = await cdp.eval('({ ticks: tsui.ticks, frames: tsui.frames, paused: tsui.paused })');
    log.push('pause: ' + JSON.stringify({ a, ...b }));
    if (!b.paused || a !== b.ticks) throw new Error('ticks run during the pause');
    await cdp.shot(path.join(out, 'pause.png'), '#game');
    await cdp.eval('tsui.isActive = () => true, true');
    await cdp.until(`tsui.ticks > ${b.ticks + 3}`);
  },
  async scale(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    const want = [[1600, 1200, 2, true, 0, 0], [1000, 900, 1, true, 100, 150], [400, 300, 0.5, false, 0, 0], [800, 600, 1, true, 0, 0]];
    for (const [w, h, scale, sharp, x, y] of want) {
      await place(cdp, w, h);
      await cdp.until(`tsui.screen.scale === ${scale} && tsui.screen.x === ${x} && tsui.screen.y === ${y}`);
      await sleep(200);
      const r = await cdp.eval(`(() => { const b = tsui.panels.getBoundingClientRect(), c = tsui.world.getBoundingClientRect(); return { w: b.width, h: b.height, sameLayers: b.left === c.left && b.top === c.top && b.width === c.width && b.height === c.height, sharp: tsui.panels.classList.contains('ts-sharp') }; })()`);
      log.push(`scale ${w}x${h}: ` + JSON.stringify(r));
      if (Math.round(r.w) !== Math.round(800 * scale) || Math.round(r.h) !== Math.round(600 * scale)) throw new Error('wrong picture size at ' + w + 'x' + h);
      if (!r.sameLayers) throw new Error('layers do not match at ' + w + 'x' + h);
      if (r.sharp !== sharp) throw new Error('wrong smoothing at ' + w + 'x' + h);
      await cdp.shot(path.join(out, `scale-${w}x${h}.png`), '#game');
    }
  },
  async sprite(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    const info = await cdp.eval('({ loadMs: Math.round(tsui.loadMs), vramMb: Math.round(tsui.gpu.bytes / 1048576), pages: Sims98.SPRITE_INDEX.pages, shadowPages: Sims98.SPRITE_INDEX.shadowPages, live: tsui.atlas.live, packBytes: Sims98.SPRITE_INDEX.packBytes, kinds: Object.fromEntries(Object.entries(Sims98.SPRITE_INDEX.kinds).map(([k, v]) => [k, v.bytes])) })');
    log.push('sprite: ' + JSON.stringify(info));
    await cdp.eval('tsui.setView(2), tsui.settings.debug = false, tsui.settings.dither = false, tsui.camera.setView({ zoom: 0, x: Sims98.Sample.MAIN_X + Sims98.Sample.LAMP[0], z: Sims98.Sample.MAIN_Z + Sims98.Sample.LAMP[1] }), tsui.dirty = true, true');
    await cdp.until('tsui.store.nearLoaded > 0', 15000);
    const nearLoaded = await cdp.eval('tsui.store.nearLoaded');
    log.push('near sprites loaded on demand: ' + nearLoaded);
    await sleep(600);
    await cdp.shot(path.join(out, 'near.png'), '#game');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    await cdp.until('tsui.store.halfLoaded > 0', 15000);
    log.push('half sprites loaded on demand: ' + await cdp.eval('tsui.store.halfLoaded'));
    await sleep(400);
    const depth = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, gl = ui.gl, c = ui.camera, X = S.Sample.MAIN_X, Z = S.Sample.MAIN_Z, L = S.Sample.LAMP, Y = S.House.floorY(ui.scene.world.house, 0);
      ui.time = 1000;
      ui.update = () => {};
      const px = new Uint8Array(4), read = (x, y, z) => { const p = c.toScreen(x, y, z); gl.readPixels(Math.floor(p[0]), c.h - 1 - Math.floor(p[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return [px[0], px[1], px[2]]; };
      const sims = ui.scene.sims, sim = sims[0], chosen = ui.selected;
      ui.selected = sims[1];
      c.setView({ zoom: 1, rot: 0, x: X + L[0], z: Z + L[1] });
      const at = (dx, dz) => { sim.x = X + L[0] + dx; sim.z = Z + L[1] + dz; sim.y = Y; sim.floor = 0; ui.draw(); return read(X + L[0], Y + 1, Z + L[1]); };
      const none = at(3, 3), behind = at(-0.5, -0.5), front = at(0.5, 0.5);
      ui.selected = chosen;
      delete ui.update;
      return { none, behind, front, ok: behind.join() === none.join() && front.join() !== none.join() };
    })()`);
    log.push('depth: ' + JSON.stringify(depth));
    if (!depth.ok) throw new Error('the figure does not change places with the lamp');
    const style = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, gl = ui.gl, c = ui.camera, X = S.Sample.MAIN_X, Z = S.Sample.MAIN_Z, Y = S.House.floorY(ui.scene.world.house, 0);
      ui.update = () => {};
      const px = new Uint8Array(4), read = () => { const p = c.toScreen(X + 18.5, Y + 0.45, Z + 11.4); gl.readPixels(Math.floor(p[0]), c.h - 1 - Math.floor(p[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return [px[0], px[1], px[2]]; };
      c.setView({ zoom: 1, rot: 0, x: X + 18, z: Z + 10 });
      ui.setStyleRow(0);
      ui.draw();
      const plain = read();
      ui.setStyleRow(2);
      ui.draw();
      const red = read();
      ui.setStyleRow(0);
      delete ui.update;
      return { plain, red, ok: red[0] > red[2] + 25 && plain[0] < plain[2] + 25 };
    })()`);
    log.push('style: ' + JSON.stringify(style));
    if (!style.ok) throw new Error('recolouring does not work');
    const shadow = await cdp.eval(`(() => {
      const ui = tsui, gl = ui.gl, c = ui.camera, S = Sims98;
      ui.update = () => {};
      const w = c.w, h = c.h, frame = () => { ui.draw(); const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
      c.setView({ zoom: 2, rot: 0, x: S.Sample.MAIN_X + 6, z: S.Sample.MAIN_Z + 24 });
      const on = frame();
      ui.scene.hasShadows = false;
      const off = frame();
      ui.scene.hasShadows = true;
      let darker = 0, lighter = 0;
      for (let i = 0; i < on.length; i += 4) {
        if (on[i] < off[i] - 2) darker++;
        if (on[i] > off[i] + 2) lighter++;
      }
      delete ui.update;
      return { darker, lighter };
    })()`);
    log.push('sprite shadows: ' + JSON.stringify(shadow));
    if (shadow.darker < 200 || shadow.lighter > 20) throw new Error('sprite shadows do not come from the gray pages');
    await cdp.eval("tsui.setQuality('ultra'), true");
    await cdp.until('tsui.ready', 60000);
    const ultra = await cdp.eval('({ live: tsui.atlas.live, mb: Math.round(tsui.gpu.bytes / 1048576), quality: tsui.settings.quality })');
    await cdp.eval("tsui.setQuality('high'), true");
    await cdp.until('tsui.ready', 60000);
    const high = await cdp.eval('({ live: tsui.atlas.live, mb: Math.round(tsui.gpu.bytes / 1048576), quality: tsui.settings.quality })');
    log.push('quality: ' + JSON.stringify({ ultra, high }));
    if (ultra.quality !== 'ultra' || high.quality !== 'high') throw new Error('the quality setting does not switch');
    await cdp.eval('tsui.settings.debug = true, tsui.settings.dither = true, tsui.stamp = "", true');
  },
  async house(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.game.freeWill = 0, tsui.settings.debug = false, tsui.stamp = "", true');
    const views = await cdp.eval('Sims98.Sample.VIEWS.map(v => v.id)');
    const show = async (name, code) => {
      await cdp.eval('(() => { ' + code + '; tsui.dirty = true; return true; })()');
      await sleep(500);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    for (let i = 0; i < views.length; i++) {
      await show('view-' + views[i], 'tsui.setView(' + i + ')');
    }
    for (const id of ['outside', 'cut0', 'cut1', 'nightcut']) {
      const i = views.indexOf(id);
      for (let rot = 1; rot < 4; rot++) await show('view-' + id + '-rot' + rot, 'tsui.setView(' + i + '); tsui.camera.setView({ rot: ' + rot + ' })');
    }
    const forms = await cdp.eval('Sims98.ROOF_FORMS');
    for (const form of forms) {
      await show('roof-' + form, 'tsui.setView(1); tsui.camera.setView({ rot: 0, zoom: 2, x: Sims98.Sample.MAIN_X + 30, z: Sims98.Sample.MAIN_Z + 1 }); tsui.setRoofForm("' + form + '")');
    }
    await cdp.eval('tsui.setRoofForm("hip"), tsui.scene.houses[1].roof.form = "gable", tsui.render.rebuildHouse(tsui.scene.houses[1]), true');
    for (const [hour, name] of [[7, 'morning'], [15, 'afternoon'], [18, 'evening'], [20.5, 'twilight']]) {
      await show('hour-' + name, 'tsui.setView(1); tsui.setHour(' + hour + ')');
    }
    for (let zoom = 0; zoom < 5; zoom++) await show('zoom-' + zoom, 'tsui.setView(1); tsui.camera.setView({ zoom: ' + zoom + ' })');
    await show('zoom-near-cut', 'tsui.setView(2); tsui.camera.setView({ zoom: 0 })');
    await sleep(800);
    await cdp.shot(path.join(out, 'zoom-near-cut.png'), '#game');
    const r = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, Sa = S.Sample, gl = ui.gl, c = ui.camera, X = Sa.MAIN_X, Z = Sa.MAIN_Z, houses = ui.scene.houses, main = houses[0], Y = S.House.floorY(main, 0), Yn = S.House.floorY(houses[1], 0);
      ui.update = () => {};
      ui.time = 1000;
      ui.settings.dither = false;
      ui.autoCut = false;
      ui.scene.sims.filter(s => !s.free).forEach((s, i) => { s.x = X + 1.5; s.z = Z + 1.5 + i; s.y = main.base; s.floor = 0; });
      for (const door of ui.scene.world.doors) { door.open = false; ui.scene.world.changed.add(door); }
      ui.syncDoors();
      const px = new Uint8Array(4);
      const read = (x, y, z) => {
        const p = c.toScreen(x, y, z);
        if (p[0] < 0 || p[1] < 0 || p[0] >= c.w || p[1] >= c.h) throw new Error('a pixel off the screen: ' + x + ',' + y + ',' + z);
        gl.readPixels(Math.floor(p[0]), c.h - 1 - Math.floor(p[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return [px[0], px[1], px[2]];
      };
      const look = (mode, floor, rot, x, z, zoom) => { ui.wallMode = mode; ui.floor = floor; c.setView({ zoom: zoom === undefined ? 1 : zoom, rot, x: X + x, z: Z + z }); ui.setHour(12); };
      const see = (mode, floor, x, y, z, fx, fz) => { look(mode, floor, 0, fx === undefined ? 16 : fx, fz === undefined ? 11 : fz); ui.draw(); return read(X + x, Y + y, Z + z); };
      const same = (a, b, tol) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= (tol || 6);
      const out = {};
      const near = [15.5, 2, 17], far = [11.5, 2.4, 5, 12, 8], door = [16.5, 1.5, 17];
      out.nearUp = see('up', 1, ...near);
      out.nearCut = see('cut', 0, ...near);
      out.farCut = see('cut', 0, ...far);
      out.farDown = see('down', 0, ...far);
      out.doorUp = see('up', 1, ...door);
      out.doorCut = see('cut', 0, ...door);
      out.doorLowUp = see('up', 1, 16.5, 0.3, 17);
      out.doorLowCut = see('cut', 0, 16.5, 0.3, 17);
      out.roofUp = see('up', 1, 16, 6.2, 8, 16, 2);
      out.roofCut = see('cut', 1, 16, 6.2, 8, 16, 2);
      const shelfRed = rot => { look('cut', 0, rot, 13, 7); ui.draw(); return read(X + 12.41, Y + 1.66, Z + 5.54); };
      out.shelfRot0 = shelfRed(0);
      out.shelfRot3 = shelfRed(3);
      out.bedUpper = see('cut', 1, 18, 3.5, 10.5, 16, 7);
      out.bedLower = see('cut', 0, 18, 3.5, 10.5, 16, 7);
      const stand = ui.scene.sims[0], other = ui.scene.sims[1];
      ui.selected = other;
      const figureAt = (x, z) => { stand.x = X + x; stand.z = Z + z; stand.y = Y; stand.floor = 0; };
      figureAt(1.5, 1.5);
      const noneUp = see('up', 1, 16, 1.2, 10), noneCut = see('cut', 0, 16, 1.2, 10);
      figureAt(16, 10);
      const figUp = see('up', 1, 16, 1.2, 10), figCut = see('cut', 0, 16, 1.2, 10);
      out.figure = { noneUp, figUp, noneCut, figCut };
      figureAt(1.5, 1.5);
      ui.selected = stand;
      const fx = Sa.NEXT_X + 2, fz = Sa.NEXT_Z + 12.1;
      c.setView({ zoom: 2, rot: 0, x: X + 36, z: Z + 16 });
      ui.wallMode = 'cut'; ui.floor = 0;
      ui.draw();
      const nextCut = read(fx + 2.5, Yn + 1.6, fz);
      out.activeFar = ui.render.active ? ui.render.active.house.id : null;
      c.setView({ zoom: 2, rot: 0, x: X + 33, z: Z + 16 });
      ui.draw();
      out.activeMain = ui.render.active ? ui.render.active.house.id : null;
      const nextMainCut = read(fx + 2.5, Yn + 1.6, fz);
      out.next = { nextCut, nextMainCut };
      c.setView({ zoom: 3, rot: 0, x: X + 16, z: Z + 11 });
      ui.draw();
      out.activeZoom3 = ui.render.active ? ui.render.active.house.id : null;
      const lit = (hour, lamps) => { ui.setHour(hour); for (const l of main.lamps) l.on = lamps(l); ui.render.uploadLight(main); };
      c.setView({ zoom: 1, rot: 0, x: X + 14, z: Z + 11 });
      ui.wallMode = 'cut'; ui.floor = 0;
      const room = (x, z) => read(X + x, Y, Z + z), grass = () => read(X + 28, main.base, Z + 14);
      ui.setHour(12); ui.draw();
      out.grassNoon = grass();
      lit(23, l => l.x === Sa.LAMP[0] && l.z === Sa.LAMP[1]);
      ui.lampsOn = true;
      ui.draw();
      out.grassNight = grass();
      out.livingNight = room(14.5, 10.5);
      out.kitchenNight = room(10.6, 10.4);
      out.hallNight = room(15, 15);
      lit(23, l => false);
      ui.lampsOn = true;
      ui.draw();
      out.livingDark = room(14.5, 10.5);
      lit(23, l => true);
      ui.lampsOn = true;
      c.setView({ zoom: 0, rot: 0, x: X + 14, z: Z + 17 });
      ui.wallMode = 'up'; ui.floor = 1;
      ui.draw();
      const pane = (x, y, z) => { const p = c.toScreen(x, y, z), row = []; for (let j = 0; j < 2; j++) { for (let i = 0; i < 4; i++) { gl.readPixels(Math.floor(p[0]) + i, c.h - 1 - Math.floor(p[1]) + j, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); row.push([px[0], px[1], px[2]]); } } return row; };
      out.paneLit = pane(X + 13.3, Y + 1.25, Z + 17);
      lit(23, l => false);
      ui.lampsOn = true;
      ui.draw();
      out.paneDark = pane(X + 13.3, Y + 1.25, Z + 17);
      ui.setHour(12);
      lit(12, l => false);
      ui.lampsOn = false;
      c.setView({ zoom: 1, rot: 0, x: X + 24, z: Z + 8 });
      ui.wallMode = 'up'; ui.floor = 1;
      const w = c.w, h = c.h, frame = () => { ui.draw(); const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
      const withShadow = frame(), realShadows = ui.render.drawHouseShadows;
      ui.render.drawHouseShadows = () => {};
      const without = frame();
      ui.render.drawHouseShadows = realShadows;
      let darker = 0, lighter = 0;
      for (let i = 0; i < withShadow.length; i += 4) {
        if (withShadow[i] < without[i] - 2) darker++;
        if (withShadow[i] > without[i] + 2) lighter++;
      }
      out.houseShadow = { darker, lighter };
      delete ui.update;
      ui.settings.dither = true;
      out.same = { near: same(out.nearUp, out.nearCut), far: same(out.farCut, out.farDown), door: same(out.doorUp, out.doorCut), roof: same(out.roofUp, out.roofCut), bed: same(out.bedUpper, out.bedLower), doorLow: same(out.doorLowUp, out.doorLowCut, 40), figureHidden: same(noneUp, figUp), figureSeen: same(noneCut, figCut), next: same(nextCut, nextMainCut, 40) };
      return out;
    })()`);
    log.push('house pixels: ' + JSON.stringify(r));
    const fail = m => { throw new Error('house: ' + m); };
    const reddish = p => p[0] > p[1] + 40 && p[0] > p[2] + 40;
    if (!reddish(r.shelfRot0) || !reddish(r.shelfRot3)) fail('the bookshelf does not face the room at every camera turn: ' + r.shelfRot0 + ' and ' + r.shelfRot3);
    if (r.same.near) fail('the near wall does not go down in the cut');
    if (r.same.far) fail('the far wall does not go down with the walls down');
    if (r.same.door) fail('the door is not cut in the low wall');
    if (!r.same.doorLow) fail('the lower part of the door is not kept');
    if (r.same.roof) fail('the roof does not go away in the cut');
    if (r.same.bed) fail('the upper floor is not hidden');
    if (!r.same.figureHidden) fail('the figure shows through the walls and the roof');
    if (r.same.figureSeen) fail('the figure does not show in the cut');
    if (!r.same.next) fail('the neighbour house changes when the main house is cut');
    if (r.activeFar !== null && r.activeFar !== 'main') fail('wrong active house');
    if (r.activeMain !== 'main') fail('the house under the camera is not active');
    if (r.activeZoom3 !== null) fail('a far camera still cuts the house');
    if (r.grassNight[1] > r.grassNoon[1] * 0.5) fail('the night is too bright outdoors');
    if (r.livingNight[0] < r.livingDark[0] + 30) fail('a lamp does not light the room');
    if (r.livingNight[0] < r.kitchenNight[0] + 25) fail('lamp light goes through the wall');
    if (r.livingNight[0] < r.hallNight[0] + 15) fail('lamp light goes through the wall into the hall');
    const spread = row => Math.max(...row.map(p => p[0] + p[1] + p[2])) - Math.min(...row.map(p => p[0] + p[1] + p[2]));
    if (spread(r.paneLit) < 12) fail('the glass is not stippled');
    const warm = row => Math.max(...row.map(p => p[0] - p[2])), brightness = row => Math.max(...row.map(p => p[0]));
    if (brightness(r.paneLit) < brightness(r.paneDark) + 20 || warm(r.paneLit) < warm(r.paneDark)) fail('a lit window does not glow at night');
    if (r.houseShadow.darker < 500 || r.houseShadow.lighter > 20) fail('the house casts no shadow');
    await cdp.eval('tsui.setView(1), true');
    const perf = await cdp.eval(`(() => {
      const ui = tsui, gl = ui.gl, px = new Uint8Array(4), S = Sims98, Sa = S.Sample, c = ui.camera, info = gl.getExtension('WEBGL_debug_renderer_info');
      ui.pointer = null;
      const rows = [];
      for (const [name, zoom, mode, floor, hour] of [['near up', 0, 'up', 1, 12], ['near cut', 0, 'cut', 0, 12], ['middle up', 1, 'up', 1, 12], ['middle cut night', 1, 'cut', 0, 23], ['far', 2, 'cut', 0, 12], ['town', 3, 'up', 1, 12], ['district', 4, 'up', 1, 12]]) {
        ui.setView(1);
        c.setView({ zoom, x: Sa.MAIN_X + 16, z: Sa.MAIN_Z + 11 });
        ui.wallMode = mode; ui.floor = floor; ui.setHour(hour);
        for (let k = 0; k < 5; k++) { ui.benchFrame(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
        const all = [];
        for (let k = 0; k < 60; k++) {
          c.pan(Math.sin(k * 0.3) * 3, Math.cos(k * 0.2) * 2);
          const a = performance.now();
          ui.benchFrame();
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          all.push(performance.now() - a);
        }
        all.sort((p, q) => p - q);
        const st = ui.render.stats;
        rows.push({ name, med: +all[30].toFixed(2), p95: +all[57].toFixed(2), draws: st.draws, tris: st.tris, sprites: st.sprites });
      }
      ui.setView(1);
      return { renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vramMb: Math.round(ui.gpu.bytes / 1048576), live: ui.atlas.live, rows };
    })()`);
    log.push('house perf: ' + perf.renderer + ', vram MB ' + perf.vramMb + ', live pages ' + perf.live);
    for (const row of perf.rows) log.push('  ' + JSON.stringify(row));
    fs.writeFileSync(path.join(out, 'house-perf.json'), JSON.stringify(perf, null, 1));
    await cdp.eval('tsui.settings.debug = true, tsui.stamp = "", true');
    await show('stats', 'tsui.setView(2)');
    for (const [mode, w, h] of [['1024', 1024, 768], ['window', 1280, 720]]) {
      await place(cdp, w, h);
      await cdp.eval('tsui.setScreen("' + mode + '"), true');
      await cdp.until('tsui.screen.sw === ' + w + ' && tsui.screen.sh === ' + h);
      await show('mode-' + mode, 'tsui.setView(2)');
    }
    await cdp.eval('tsui.setScreen("800"), true');
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval("window.tsLose = tsui.gl.getExtension('WEBGL_lose_context'), tsui.setView(2), tsLose.loseContext(), true");
    await cdp.until('!tsui.ready');
    await sleep(200);
    await cdp.eval('tsLose.restoreContext(), true');
    await cdp.until('tsui.ready', 120000);
    await sleep(500);
    const back = await cdp.eval('({ ...tsui.render.stats, lost: tsui.gl.isContextLost(), active: tsui.render.active ? tsui.render.active.house.id : null, live: Sims98.live })');
    log.push('house after a lost context: ' + JSON.stringify(back));
    if (back.lost || !back.sprites || !back.tris || back.active !== 'main') throw new Error('the house did not come back after a lost context');
    await cdp.shot(path.join(out, 'lost-house.png'), '#game');
  },
  async sim(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.game.freeWill = 0, tsui.settings.debug = false, tsui.stamp = "", tsui.setView(0), tsui.camera.setView({ rot: 0 }), true');
    const worldPoint = (x, y, z) => cdp.eval('(() => { const S = Sims98, h = tsui.scene.world.house, p = tsui.camera.toScreen(h.x + ' + x + ', S.House.floorY(h, 0) + ' + y + ', h.z + ' + z + '); return [p[0], p[1]]; })()');
    const orderAt = (x, z, floor, extra) => '(Sims98.Acts.dropCurrent(tsui.scene.world, tsui.selected), Sims98.Sim.order(tsui.scene.world, tsui.selected, { x: tsui.scene.world.house.x + ' + x + ', z: tsui.scene.world.house.z + ' + z + ', floor: ' + floor + ', lot: tsui.scene.world.lots[0]' + (extra || '') + ' }))';
    const choosePie = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await click(at[0], at[1]);
    };
    const click = async (x, y, shift) => {
      const mods = shift ? { modifiers: 8 } : {};
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, ...mods });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, ...mods });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, ...mods });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 300 });
    };
    const state = () => cdp.eval('(() => { const s = tsui.selected, h = tsui.scene.world.house; return { id: s.id, x: +(s.x - h.x).toFixed(2), z: +(s.z - h.z).toFixed(2), y: +s.y.toFixed(2), floor: s.floor, state: s.state, seat: s.seat ? s.seat.item.kind : null, note: s.note, view: tsui.viewState ? [tsui.viewState.mode, tsui.viewState.floor] : null }; })()');
    const follow = 'tsui.centerOnSim()';
    await sleep(800);
    await cdp.shot(path.join(out, 'family.png'), '#game');
    const start = await state();
    log.push('start: ' + JSON.stringify(start));
    if (start.view === null || start.view[0] !== 'cut') throw new Error('the camera does not cut the house for a sim indoors');
    const [gx, gy] = await worldPoint(16.5, 0, 9.5);
    await click(gx, gy);
    await choosePie('Идти сюда');
    await cdp.until('tsui.selected.state === "move"', 5000);
    let sawDoor = false;
    for (let i = 0; i < 60 && !sawDoor; i++) {
      sawDoor = await cdp.eval('tsui.scene.world.doors.some(d => d.open)');
      await sleep(80);
    }
    if (!sawDoor) throw new Error('no door opened on the way');
    await cdp.shot(path.join(out, 'through-door.png'), '#game');
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path', 30000);
    const walked = await state();
    log.push('after the click: ' + JSON.stringify(walked));
    if (Math.hypot(walked.x - 16.5, walked.z - 9.5) > 1.2) throw new Error('the sim did not walk to the click');
    await cdp.eval('tsui.camera.setView({ zoom: 0 }), ' + follow + ', true');
    await cdp.until('tsui.store.nearLoaded > 0', 15000);
    await sleep(500);
    await cdp.eval(orderAt(14.5, 6.5, 1) + ', true');
    await cdp.until('tsui.selected.path && tsui.selected.path[tsui.selected.wp] && tsui.selected.path[tsui.selected.wp].slope', 30000);
    await cdp.eval('tsui.camera.setView({ zoom: 0 }), ' + follow + ', true');
    await sleep(900);
    await cdp.eval(follow + ', true');
    await sleep(60);
    await cdp.shot(path.join(out, 'stairs-near.png'), '#game');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), ' + follow + ', true');
    await sleep(200);
    await cdp.shot(path.join(out, 'stairs.png'), '#game');
    await cdp.until('tsui.selected.floor === 1 && tsui.selected.state === "idle"', 30000);
    const upstairs = await state();
    log.push('upstairs: ' + JSON.stringify(upstairs));
    if (!upstairs.view || upstairs.view[1] !== 1) throw new Error('the view does not follow the sim upstairs');
    await cdp.eval(follow + ', true');
    await sleep(300);
    await cdp.shot(path.join(out, 'upstairs.png'), '#game');
    const chair = await cdp.eval('(() => { const h = tsui.scene.world.house; const c = h.items.find(i => i.kind === "m_chair" && i.floor === 0 && i.x === 9.5 && i.z === 7.5); return [c.x, c.z]; })()');
    await cdp.eval(orderAt(10.5, 6.5, 0) + ', true');
    await cdp.until('tsui.selected.floor === 0 && tsui.selected.state === "idle"', 40000);
    await cdp.eval('tsui.camera.setView({ x: tsui.scene.world.house.x + 9, z: tsui.scene.world.house.z + 8, zoom: 1 }), true');
    await sleep(200);
    const [cx, cy] = await worldPoint(chair[0], 0.45, chair[1]);
    await click(cx, cy);
    await choosePie('Посидеть');
    await cdp.until('tsui.selected.state === "sit"', 30000);
    const seated = await state();
    log.push('seated: ' + JSON.stringify(seated));
    if (seated.seat !== 'm_chair') throw new Error('a click on the chair did not seat the sim');
    await sleep(300);
    await cdp.eval('tsui.camera.setView({ zoom: 0 }), ' + follow + ', true');
    await sleep(800);
    await cdp.shot(path.join(out, 'seated.png'), '#game');
    const sheet = async (name, order, count) => {
      await cdp.eval('(() => { const u = tsui, s = u.selected; if (s.seat) { u.scene.world.sims.forEach(() => 0); } return true; })()');
      await cdp.eval(order + ', true');
      await cdp.until('tsui.selected.state === "move"', 20000);
      await cdp.eval('tsui.camera.setView({ zoom: 0 }), true');
      await sleep(300);
      for (let i = 0; i < count; i++) {
        await cdp.eval(follow + ', true');
        await sleep(90);
        await cdp.shot(path.join(out, name + '-' + i + '.png'), '#game');
      }
    };
    await cdp.eval(orderAt(16.5, 15.5, 0) + ', true');
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path', 30000);
    await sheet('walk', orderAt(25.5, 26.5, 0), 8);
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path', 30000);
    await sheet('run', orderAt(5.5, 22.5, 0, ', run: true'), 6);
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path', 30000);
    const pixels = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, gl = ui.gl, c = ui.camera, w = ui.scene.world, h = w.house, sims = ui.scene.sims.filter(s => !s.free), Y = S.House.floorY(h, 0), sel = sims[0];
      ui.selected = sel;
      ui.update = () => {};
      ui.time = 1000;
      ui.settings.dither = false;
      ui.autoCut = false;
      ui.wallMode = 'up';
      ui.floor = 1;
      c.setView({ zoom: 1, rot: 0, x: h.x + 16, z: h.z + 11 });
      sims.forEach((s, i) => { s.x = h.x + 1.5; s.z = h.z + 1.5 + i; s.y = h.base; s.floor = 0; s.state = 'idle'; s.path = null; s.seat = null; s.seatW = 0; s.order = null; });
      const px = new Uint8Array(4), read = (x, y, z) => { const p = c.toScreen(h.x + x, y, h.z + z); if (p[0] < 0 || p[1] < 0 || p[0] >= c.w || p[1] >= c.h) throw new Error('off the screen'); gl.readPixels(Math.floor(p[0]), c.h - 1 - Math.floor(p[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return [px[0], px[1], px[2]]; };
      const place = (s, x, z) => { s.x = h.x + x; s.z = h.z + z; s.y = Y; s.floor = 0; };
      const out = {};
      ui.draw();
      out.empty = read(17.5, Y + 1.1, 15.5);
      place(sel, 17.5, 15.5);
      ui.draw();
      out.hiddenSelected = read(17.5, Y + 1.1, 15.5);
      place(sel, 1.5, 1.5);
      place(sims[1], 17.5, 15.5);
      ui.draw();
      out.hiddenOther = read(17.5, Y + 1.1, 15.5);
      place(sims[1], 1.5, 2.5);
      place(sel, 25.5, 22.5);
      c.setView({ zoom: 1, rot: 0, x: h.x + 25, z: h.z + 22 });
      ui.draw();
      out.seen = read(25.5, h.base + 1.1, 22.5);
      place(sel, 25.5, 22.5);
      sel.y = h.base;
      ui.draw();
      const top = sel.y + S.Body.height(sel.age) + 0.32;
      out.mark = read(25.5, top, 22.5);
      ui.selected = sims[1];
      ui.draw();
      out.noMark = read(25.5, top, 22.5);
      ui.selected = sel;
      const counts = [];
      for (const zoom of [0, 1, 2, 3]) {
        c.setView({ zoom });
        ui.draw();
        counts.push(ui.render.stats.tris);
      }
      c.setView({ zoom: 1 });
      delete ui.update;
      return { out, counts };
    })()`);
    log.push('sim pixels: ' + JSON.stringify(pixels));
    const blue = p => p[2] - p[0];
    if (blue(pixels.out.hiddenSelected) < blue(pixels.out.empty) + 40) throw new Error('the selected sim has no blue silhouette behind the wall');
    if (blue(pixels.out.hiddenOther) > blue(pixels.out.empty) + 8) throw new Error('another sim shows through the wall');
    if (pixels.out.mark[1] < pixels.out.mark[0] + 40) throw new Error('no green mark over the selected sim');
    if (pixels.out.noMark[1] > pixels.out.mark[1] && pixels.out.noMark[0] > pixels.out.mark[0] + 60) throw new Error('the mark does not follow the selection');
    await cdp.eval('tsui.settings.dither = true, tsui.settings.debug = false, tsui.stamp = "", true');
    await cdp.eval(`(() => {
      const S = Sims98, sims = tsui.scene.sims.filter(s => !s.free), h = tsui.scene.world.house, row = [[14.5, 21.5], [15.5, 21.5], [16.5, 21.5], [17.5, 21.5], [18.5, 21.5]];
      sims.forEach((s, i) => { s.x = h.x + row[i][0]; s.z = h.z + row[i][1]; s.y = h.base; s.yaw = 0.8; s.floor = 0; });
      tsui.camera.setView({ zoom: 0, rot: 0, x: h.x + 16.5, z: h.z + 21 });
      tsui.selected = sims[0];
      return true;
    })()`);
    await sleep(600);
    await cdp.shot(path.join(out, 'lineup.png'), '#game');
    const stress = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, gl = ui.gl, world = ui.scene.world, c = ui.camera, h = world.house, px = new Uint8Array(4), base = ui.scene.sims.slice(), syncLevels = S.Town.syncLevels;
      S.Town.syncLevels = () => {};
      const list = [];
      for (let i = 0; i < 40; i++) {
        const p = S.Sample.FAMILY[i % S.Sample.FAMILY.length];
        const s = S.Sim.create(Object.assign({}, p, { id: 'crowd' + i, floor: 0, live: true, x: h.x + 1.5 + (i % 8) * 1.5 + 12, z: h.z + 19.5 + Math.floor(i / 8) * 2, phase: i * 0.13 }));
        s.y = h.base;
        s.lot = world.lots[0];
        list.push(s);
      }
      world.sims = list;
      ui.scene.sims = list;
      world.live = list;
      ui.selected = list[0];
      const rows = [];
      for (const [name, zoom] of [['near', 0], ['middle', 1], ['far', 2]]) {
        c.setView({ zoom, rot: 0, x: h.x + 18, z: h.z + 22 });
        for (let k = 0; k < 44; k++) ui.benchFrame();
        const all = [];
        for (let k = 0; k < 40; k++) {
          const a = performance.now();
          ui.benchFrame();
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          all.push(performance.now() - a);
        }
        all.sort((p, q) => p - q);
        rows.push({ name, med: +all[20].toFixed(2), p95: +all[38].toFixed(2), tris: ui.render.stats.tris, draws: ui.render.stats.draws });
      }
      world.sims = base;
      ui.scene.sims = base;
      world.live = base.filter(s => s.live);
      S.Town.syncLevels = syncLevels;
      ui.selected = base[0];
      return rows;
    })()`);
    log.push('forty sims: ' + JSON.stringify(stress));
    await cdp.eval('tsui.settings.debug = true, tsui.stamp = "", tsui.setView(0), true');
  },
  async town(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.game.freeWill = 0, true');
    const info = await cdp.eval(`(() => {
      const ui = tsui, w = ui.scene.world, gl = ui.gl, d = gl.getExtension('WEBGL_debug_renderer_info');
      return { renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), loadMs: Math.round(ui.loadMs), vramMb: Math.round(ui.gpu.bytes / 1048576), lots: w.lots.length, people: w.sims.length, portals: w.ground.portalX.length, edgesReady: w.ground.clusterEdges.every(Boolean), figures: !!ui.render.figureAtlas, roads: w.roads.nodes.length };
    })()`);
    log.push('town: ' + JSON.stringify(info));
    if (!info.edgesReady) throw new Error('the portal edges are not ready after the start');
    const frames = reset => cdp.eval(`(() => { const T = tsTown, v = T.frames.slice().sort((a, b) => a - b), r = { n: v.length, med: +(v[v.length >> 1] || 0).toFixed(1), p99: +(v[Math.floor(v.length * 0.99)] || 0).toFixed(1), max: +(v[v.length - 1] || 0).toFixed(1), over20: v.filter(x => x > 20).length, over50: v.filter(x => x > 50).length, camGap: +T.camGap.toFixed(1), jump: +T.jump.toFixed(2) }; if (${!!reset}) { T.frames.length = 0; T.camGap = 0; T.jump = 0; } return r; })()`);
    await cdp.eval(`(() => {
      const T = window.tsTown = { frames: [], camGap: 0, jump: 0, last: 0, px: 0, pz: 0, who: null };
      const tick = now => {
        if (T.last) T.frames.push(now - T.last);
        T.last = now;
        const s = tsui.watch || tsui.selected, c = tsui.camera;
        if (s === T.who && !s.inside) T.jump = Math.max(T.jump, Math.hypot(s.x - T.px, s.z - T.pz));
        T.who = s; T.px = s.x; T.pz = s.z;
        if (tsui.follow) T.camGap = Math.max(T.camGap, Math.hypot(s.x - c.fx, s.z - c.fz));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return true;
    })()`);
    const key = async (k, code, vk) => {
      const p = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await sleep(30);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(120);
    };
    const mouseTo = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    const click = async (x, y, button) => {
      const b = button === 'right' ? { button, buttons: 2 } : { button: 'left', buttons: 1 };
      await mouseTo(x, y);
      await sleep(40);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, ...b });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, ...b, buttons: 0 });
      await sleep(40);
      await mouseTo(400, 300);
    };
    const onMap = (x, z) => cdp.eval('(() => { const m = tsui.map, a = m.layout(tsui.screen); return [Math.round(a.x + (' + x + ') * a.k), Math.round(a.y + (' + z + ') * a.k)]; })()');
    const lotDoor = id => cdp.eval('(() => { const l = tsui.scene.world.lots.find(q => q.id === "' + id + '"); return l.doorOut; })()');
    const who = () => cdp.eval('(() => { const s = tsui.watch || tsui.selected, c = tsui.camera; return { id: s.id, name: s.name, x: +s.x.toFixed(1), z: +s.z.toFixed(1), state: s.state, note: s.note, inside: !!s.inside, cx: +c.fx.toFixed(1), cz: +c.fz.toFixed(1), follow: tsui.follow, map: tsui.map.open, hour: +tsui.hour.toFixed(2), live: tsui.scene.world.live.length, cars: tsui.scene.world.cars.length, sims: tsui.render.stats.sims }; })()');
    const shot = async name => {
      await sleep(350);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    await cdp.eval('tsui.settings.debug = false, tsui.stamp = "", tsui.setView(8), true');
    for (let zoom = 0; zoom < 5; zoom++) {
      await cdp.eval('tsui.setView(8), tsui.camera.setView({ zoom: ' + zoom + ' }), true');
      await sleep(zoom < 2 ? 900 : 300);
      await shot('town-zoom-' + zoom);
    }
    await cdp.eval('tsui.camera.setView({ zoom: 4, x: 320, z: 320 }), true');
    await shot('town-whole');
    for (const id of ['shop', 'office', 'park', 'school', 'beach', 'plant', 'lot13', 'lot16']) {
      await cdp.eval('(() => { const l = tsui.scene.world.lots.find(q => q.id === "' + id + '"); tsui.camera.setView({ zoom: 2, x: l.x + l.w / 2, z: l.z + l.d / 2 }); return true; })()');
      await shot('lot-' + id);
    }
    await cdp.eval('(() => { const w = tsui.scene.world; w.day = 2; for (const s of w.family) if (s.age === "child" || s.age === "teen") (s.school = s.school || Sims98.Jobs.freshSchool()).day = 2; tsui.setHour(8); return true; })()');
    await sleep(14000);
    const crowd = await cdp.eval(`(() => {
      const w = tsui.scene.world, out = w.sims.filter(s => !s.inside && s.free), states = {};
      for (const s of w.sims) { const k = s.inside ? 'inside' : s.state; states[k] = (states[k] || 0) + 1; }
      const lead = out.find(s => s.state === 'trip') || out[0];
      if (lead) tsui.camera.setView({ zoom: 3, x: lead.x, z: lead.z });
      return { out: out.length, states, lead: lead ? [lead.x, lead.z] : null };
    })()`);
    log.push('morning: ' + JSON.stringify(crowd));
    if (crowd.out < 8) throw new Error('nobody goes out in the morning: ' + crowd.out);
    await shot('figures-zoom-3');
    const shown3 = await cdp.eval('tsui.render.stats.sims');
    await cdp.eval('tsui.camera.setView({ zoom: 4 }), true');
    await shot('figures-zoom-4');
    const shown4 = await cdp.eval('tsui.render.stats.sims');
    log.push('figures on the screen: ' + JSON.stringify({ shown3, shown4 }));
    if (!shown3 || !shown4) throw new Error('no far figures on the screen');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    await shot('people-zoom-1');
    await cdp.eval('tsui.settings.debug = true, tsui.stamp = "", true');
    await key('m', 'KeyM', 77);
    if (!(await who()).map) throw new Error('M did not open the map');
    await shot('map');
    const hoverAt = await onMap(200, 220);
    await mouseTo(hoverAt[0], hoverAt[1]);
    await shot('map-hover');
    const legend = await cdp.eval('(() => { const r = tsui.map.legendRow(2); return [r.x + 40, r.y + 8]; })()');
    await click(legend[0], legend[1]);
    if (!await cdp.eval('tsui.map.hidden.has("work") && tsui.map.open')) throw new Error('the legend does not hide a kind of lot');
    await shot('map-legend');
    await click(legend[0], legend[1]);
    const indoors = await cdp.eval(`(() => {
      const ui = tsui, s = ui.scene.world.sims.find(q => q.inside && q.free), a = ui.map.layout(ui.screen), [x, z] = ui.map.dotOf(s);
      return [Math.round(a.x + x * a.k), Math.round(a.y + z * a.k)];
    })()`);
    await mouseTo(indoors[0], indoors[1]);
    await shot('map-inside');
    const person = await cdp.eval(`(() => {
      const ui = tsui, world = ui.scene.world, m = ui.map, v = ui.screen, a = m.layout(v);
      for (const s of world.sims) {
        if (!s.free || s.inside) continue;
        const sx = Math.round(a.x + s.x * a.k), sy = Math.round(a.y + s.z * a.k);
        if (m.personAt(v, sx, sy) === s) return { id: s.id, name: s.name, sx, sy };
      }
      return null;
    })()`);
    if (!person) throw new Error('no person to find on the map');
    await click(person.sx, person.sy);
    const watching = await cdp.eval('({ open: tsui.map.open, watch: tsui.watch ? tsui.watch.id : null, follow: tsui.follow, near: tsui.watch ? Math.hypot(tsui.watch.x - tsui.camera.fx, tsui.watch.z - tsui.camera.fz) : 99 })');
    log.push('map: a click on ' + person.name + ': ' + JSON.stringify(watching));
    if (watching.open || !watching.watch || !watching.follow || watching.near > 3) throw new Error('a click on a person does not bring the camera to them');
    await sleep(3000);
    await shot('watch-person');
    const watched = await cdp.eval('Math.hypot(tsui.watch.x - tsui.camera.fx, tsui.watch.z - tsui.camera.fz)');
    if (watched > 6) throw new Error('the camera lost the person: ' + watched);
    await key('Home', 'Home', 36);
    if (await cdp.eval('tsui.watch !== null')) throw new Error('Home did not return the camera to the family');
    await cdp.eval('tsui.camera.setView({ zoom: 2 }), true');
    await frames(true);
    await key('m', 'KeyM', 77);
    const peopleRow = await cdp.eval('(() => { const r = tsui.map.legendRow(6); return [r.x + 40, r.y + 8]; })()');
    await click(peopleRow[0], peopleRow[1]);
    const farDoor = await lotDoor('lot13');
    const farPoint = await onMap(farDoor[0], farDoor[1]);
    await click(farPoint[0], farPoint[1]);
    if ((await who()).map) throw new Error('a click on the map did not close it');
    await cdp.until('tsui.selected.state === "move"', 8000);
    log.push('car trip starts: ' + JSON.stringify(await who()));
    await cdp.until('tsui.selected.state === "board"', 60000);
    await cdp.shot(path.join(out, 'car-board.png'), '#game');
    await cdp.until('tsui.selected.state === "drive"', 8000);
    await shot('car-start');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    await sleep(1500);
    await shot('car-near');
    await cdp.eval('tsui.camera.setView({ rot: 1 }), true');
    await sleep(1000);
    await shot('car-near-rot1');
    await cdp.eval('tsui.camera.setView({ rot: 0, zoom: 3 }), true');
    await sleep(1000);
    await shot('car-zoom-3');
    await cdp.eval('tsui.camera.setView({ zoom: 2 }), true');
    await cdp.until('tsui.selected.state !== "drive"', 120000);
    await cdp.shot(path.join(out, 'car-parked.png'), '#game');
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path && !tsui.selected.order', 60000);
    const carEnd = await who(), carFrames = await frames(true);
    log.push('car trip ends: ' + JSON.stringify(carEnd));
    log.push('car trip frames: ' + JSON.stringify(carFrames));
    if (Math.hypot(carEnd.x - farDoor[0], carEnd.z - farDoor[1]) > 1.5) throw new Error('the car trip did not reach the goal');
    await key('Tab', 'Tab', 9);
    await key('Tab', 'Tab', 9);
    await key('Home', 'Home', 36);
    const walker = await who();
    log.push('walker: ' + JSON.stringify(walker));
    await frames(true);
    await key('m', 'KeyM', 77);
    const walkDoor = await lotDoor('lot16');
    const walkPoint = await onMap(walkDoor[0], walkDoor[1]);
    await click(walkPoint[0], walkPoint[1]);
    await cdp.until('tsui.selected.state === "move"', 8000);
    const walkStart = Date.now();
    await shot('walk-1');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    await sleep(25000);
    await shot('walk-2');
    await cdp.eval('tsui.camera.setView({ zoom: 0 }), true');
    await sleep(25000);
    await shot('walk-3');
    await cdp.eval('tsui.camera.setView({ zoom: 2 }), true');
    await sleep(25000);
    await shot('walk-4');
    await cdp.until('tsui.selected.state === "idle" && !tsui.selected.path && !tsui.selected.order', 280000);
    const walkEnd = await who(), walkFrames = await frames(true);
    log.push('walk ends after ' + Math.round((Date.now() - walkStart) / 1000) + ' s: ' + JSON.stringify(walkEnd));
    log.push('walk frames: ' + JSON.stringify(walkFrames));
    await shot('walk-5');
    if (Math.hypot(walkEnd.x - walkDoor[0], walkEnd.z - walkDoor[1]) > 1.5) throw new Error('the walk did not reach the goal: ' + walkEnd.x + ',' + walkEnd.z + ' want ' + walkDoor);
    if (walkFrames.camGap > 8 || carFrames.camGap > 12) throw new Error('the camera lags behind the sim');
    if (walkFrames.jump > 1 || carFrames.jump > 3) throw new Error('the sim jumps on the way: ' + walkFrames.jump + ' ' + carFrames.jump);
    await key('Tab', 'Tab', 9);
    await key('m', 'KeyM', 77);
    const shop = await cdp.eval('(() => { const l = tsui.scene.world.lots.find(q => q.id === "shop"); return [l.x + l.w / 2, l.z + l.d / 2]; })()');
    const shopPoint = await onMap(shop[0], shop[1]);
    await click(shopPoint[0], shopPoint[1]);
    await cdp.until('!!tsui.selected.inside', 120000);
    log.push('a click on the shop leads inside: ' + JSON.stringify(await who()));
    await shot('inside-shop');
    await cdp.eval('(() => { const w = tsui.scene.world, s = tsui.selected, l = s.inside; Sims98.Sim.order(w, s, { x: l.doorOut[0] + 3, z: l.doorOut[1] - 3, floor: 0 }); return true; })()');
    await sleep(800);
    if (await cdp.eval('!!tsui.selected.inside')) throw new Error('a new order does not bring the sim out of the building');
    await cdp.eval('tsui.follow = false, tsui.camera.setView({ zoom: 2, x: 100, z: 240 }), true');
    await sleep(800);
    await frames(true);
    const hold = async (k, code, vk, ms) => {
      const p = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await sleep(ms);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    };
    await hold('ArrowRight', 'ArrowRight', 39, 6000);
    await hold('ArrowDown', 'ArrowDown', 40, 4000);
    log.push('fast pan, far zoom: ' + JSON.stringify(await frames(true)));
    await cdp.eval('tsui.camera.setView({ zoom: 0, x: 300, z: 250 }), true');
    await sleep(600);
    await frames(true);
    await hold('ArrowDown', 'ArrowDown', 40, 6000);
    await hold('ArrowLeft', 'ArrowLeft', 37, 4000);
    log.push('fast pan, near zoom: ' + JSON.stringify(await frames(true)));
    const lamps = await cdp.eval(`(() => {
      const ui = tsui, a = performance.now();
      ui.setHour(23);
      const on = performance.now() - a, b = performance.now();
      ui.setHour(12);
      return { on: +on.toFixed(1), off: +(performance.now() - b).toFixed(1) };
    })()`);
    log.push('lamps switched in all the houses, ms: ' + JSON.stringify(lamps));
    await cdp.eval('tsui.setHour(23), tsui.setView(6), tsui.camera.setView({ zoom: 2 }), true');
    await shot('town-night');
    await cdp.eval('tsui.setHour(19), tsui.camera.setView({ zoom: 3 }), true');
    await shot('town-dusk-zoom-3');
    await cdp.eval("window.tsLose = tsui.gl.getExtension('WEBGL_lose_context'), tsLose.loseContext(), true");
    await cdp.until('!tsui.ready');
    await sleep(200);
    await cdp.eval('tsLose.restoreContext(), true');
    await cdp.until('tsui.ready', 120000);
    await sleep(800);
    const back = await cdp.eval('({ ...tsui.render.stats, lost: tsui.gl.isContextLost(), people: tsui.scene.world.sims.length })');
    log.push('town after a lost context: ' + JSON.stringify(back));
    if (back.lost || !back.sprites || back.people !== 95) throw new Error('the town did not come back after a lost context');
    await shot('town-lost');
  },
  async save(cdp, out, log) {
    const openGame = async () => {
      await cdp.open('/sims98.html');
      await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
      const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
      if (failed) throw new Error('load failed: ' + failed);
      await place(cdp, 800, 600);
      await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    };
    await openGame();
    const now = () => cdp.eval('(() => { const g = tsui.game, w = g.world; return { day: w.day, clock: +w.clock.toFixed(2), speed: g.speed, note: tsui.note ? tsui.note.text : "", paused: tsui.paused, hash: g.hash(), x: +tsui.camera.fx.toFixed(1), z: +tsui.camera.fz.toFixed(1), files: tsui.saves.open }; })()');
    const key = async (k, code, vk) => {
      const p = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await sleep(30);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(150);
    };
    const clickAt = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
      await sleep(120);
    };
    const shot = async name => {
      await sleep(250);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const box = () => cdp.eval('tsui.saves.box(tsui.screen)');
    const clickRow = async (i, right) => {
      const b = await box();
      await clickAt(right ? b.x + b.w - right : b.x + 20, b.y + 62 + i * 24 + 8);
    };
    const clickTab = async mode => {
      const b = await box();
      await clickAt(b.x + (mode === 'save' ? 40 : b.w - 40), b.y + 10);
    };
    const openFiles = async () => {
      await key('Escape', 'Escape', 27);
      const m = await cdp.eval('tsui.live.menuBox()');
      await clickAt(m.x + 30, m.y + 4 + 12);
      await cdp.until('tsui.saves.open && tsui.saves.rows.length === 14', 5000);
    };
    const redFrame = () => cdp.eval('(() => { const d = tsui.over.getContext("2d").getImageData(3, 300, 1, 1).data; return d[0] > 180 && d[1] < 70 && d[2] < 70; })()');
    await cdp.eval('tsui.game.freeWill = 0, true');
    const start = await now();
    log.push('start of the game: ' + JSON.stringify(start));
    if (start.day !== 1 || start.clock < 480 || start.clock > 500) throw new Error('the game does not start on day 1 at 8:00');
    await cdp.eval('tsui.settings.debug = false, tsui.stamp = "", true');
    await shot('clock');
    const rate = async (k, code, vk, want) => {
      await key(k, code, vk);
      const a = await now();
      await sleep(2000);
      const b = await now(), speed = (b.clock - a.clock) / 2;
      log.push('speed key ' + k + ': ' + speed.toFixed(2) + ' minutes per second');
      if (Math.abs(speed - want) > want * 0.3) throw new Error('speed ' + k + ' runs ' + speed + ', not ' + want);
    };
    await rate('2', 'Digit2', 50, 3);
    await rate('3', 'Digit3', 51, 8);
    await rate('1', 'Digit1', 49, 1);
    await key(' ', 'Space', 32);
    const paused = await now();
    await sleep(500);
    const still = await now();
    if (paused.speed !== 0 || still.clock !== paused.clock) throw new Error('the space key does not stop the clock');
    if (!await redFrame()) throw new Error('no red frame on pause');
    await shot('pause');
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    await sleep(300);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    const moved = await now();
    if (moved.x === still.x && moved.z === still.z) throw new Error('the camera does not move on pause');
    if (moved.clock !== still.clock) throw new Error('the camera key runs the clock on pause');
    await key('p', 'KeyP', 80);
    if ((await now()).speed !== 1) throw new Error('P does not return the speed');
    await sleep(300);
    if (await redFrame()) throw new Error('the red frame stays after the pause');
    await cdp.eval('tsui.isActive = () => false, true');
    await sleep(200);
    const lost = await now();
    await sleep(600);
    const lost2 = await now();
    if (lost.clock !== lost2.clock || !lost2.paused) throw new Error('a lost window does not stop the clock');
    if (!await redFrame()) throw new Error('no red frame when the window is lost');
    await cdp.eval('tsui.isActive = () => true, true');
    await sleep(200);
    const far = await cdp.eval('(() => { const w = tsui.scene.world, hugo = w.sims.find(s => s.id === "hugo"), lot = w.lots.find(l => l.id === "lot16"); tsui.selected = hugo; Sims98.Sim.order(w, hugo, { x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot }); tsui.centerOnSim(); tsui.camera.setView({ zoom: 2 }); return lot.doorOut; })()');
    await key('4', 'Digit4', 52);
    const until = Date.now();
    await sleep(1500);
    await shot('top-speed');
    const running = await now();
    if (running.speed !== 4) throw new Error('key 4 does not hold the top speed while the sim walks: ' + running.speed);
    await cdp.until('tsui.game.speed === 1', 60000);
    const seconds = (Date.now() - until) / 1000, there = await cdp.eval('(() => { const s = tsui.selected; return [s.x, s.z, s.state]; })()');
    log.push('until the end of the action: ' + seconds.toFixed(1) + ' s, at ' + there);
    if (Math.hypot(there[0] - far[0], there[1] - far[1]) > 1.5) throw new Error('the top speed did not bring the sim to the goal');
    if (seconds > 25) throw new Error('the top speed is too slow: ' + seconds);
    await key('4', 'Digit4', 52);
    await sleep(200);
    if ((await now()).speed !== 1) throw new Error('key 4 on a free sim does not return to speed 1');
    await key(' ', 'Space', 32);
    const saved = await now();
    await key('F6', 'F6', 117);
    await cdp.until('tsui.note && /Сохранено/.test(tsui.note.text)', 8000);
    await shot('quick-save');
    await openFiles();
    const quick = await cdp.eval('tsui.saves.rows[0].record && [tsui.saves.rows[0].record.day, tsui.saves.rows[0].record.size]');
    log.push('quick save: ' + JSON.stringify(quick));
    if (!quick) throw new Error('F6 did not write the quick save');
    await shot('files-save');
    await clickRow(1);
    await cdp.until('tsui.saves.rows[1] && tsui.saves.rows[1].record', 8000);
    await clickRow(1);
    if (await cdp.eval('tsui.saves.ask') !== 1) throw new Error('an occupied slot does not ask');
    await shot('files-ask');
    await clickRow(1, 110);
    await cdp.until('tsui.saves.rows[1] && tsui.saves.rows[1].backup', 8000);
    await clickRow(2);
    await cdp.until('tsui.saves.rows[2] && tsui.saves.rows[2].record', 8000);
    await clickTab('load');
    await shot('files-load');
    await key('Escape', 'Escape', 27);
    if ((await now()).files) throw new Error('Esc does not close the file window');
    await key(' ', 'Space', 32);
    await sleep(1500);
    const later = await now();
    if (later.hash === saved.hash) throw new Error('the game did not go on after the save');
    const load = async () => {
      await openFiles();
      await clickTab('load');
      await clickRow(1);
      if (await cdp.eval('tsui.saves.ask') !== 1) throw new Error('loading does not ask');
      await clickRow(1, 110);
      await cdp.until('!tsui.saves.open', 8000);
      return now();
    };
    const back = await load();
    log.push('loaded: ' + JSON.stringify(back));
    if (back.hash !== saved.hash) throw new Error('a loaded game has another hash: ' + back.hash + ', want ' + saved.hash);
    if (back.speed !== 0) throw new Error('a loaded game does not stand on pause');
    if (Math.hypot(back.x - saved.x, back.z - saved.z) > 0.5) throw new Error('the camera did not come back');
    await shot('after-load');
    await openGame();
    const fresh = await now();
    if (fresh.hash === saved.hash) throw new Error('a new page should start a new game');
    const reloaded = await load();
    log.push('loaded after a page reload: ' + JSON.stringify(reloaded));
    if (reloaded.hash !== saved.hash) throw new Error('the file did not survive a page reload');
    await shot('after-reload');
    await cdp.eval(`(async () => {
      const store = await tsui.saveStore(), record = await store.get('slot1'), bad = Uint8Array.from(record.bytes);
      bad[bad.length >> 1] ^= 255;
      bad[(bad.length >> 1) + 1] ^= 255;
      await new Promise((done, fail) => {
        const open = indexedDB.open('sims98', 1);
        open.onsuccess = () => {
          const tx = open.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(Object.assign({}, record, { bytes: bad }));
          tx.oncomplete = () => { open.result.close(); done(); };
          tx.onerror = () => fail(tx.error);
        };
      });
      return true;
    })()`);
    const healed = await load();
    log.push('loaded a damaged file: ' + JSON.stringify(healed));
    if (!/резервная копия/.test(healed.note) || healed.hash !== saved.hash) throw new Error('a damaged file does not fall back to the backup');
    await shot('damaged');
    await cdp.eval(`(() => {
      window.tsRealStore = tsui.savePromise;
      tsui.savePromise = Promise.resolve({ get: async () => undefined, replace: async () => { throw new Error('диск полон'); }, close() {} });
      return true;
    })()`);
    await key('F6', 'F6', 117);
    await cdp.until('tsui.note && /Не удалось сохранить/.test(tsui.note.text)', 8000);
    await shot('save-error');
    await cdp.eval('tsui.savePromise = window.tsRealStore, true');
    const autos = await cdp.eval(`(async () => {
      const S = Sims98, ui = tsui, store = await ui.saveStore();
      ui.game.setSpeed(1);
      S.Town.setClock(ui.game.world, 359.5);
      return !!(await store.get('auto1'));
    })()`);
    if (autos) throw new Error('an autosave exists too early');
    await cdp.until('tsui.note && /Автосохранение 1/.test(tsui.note.text)', 15000);
    await shot('autosave');
    await cdp.eval('Sims98.Town.setClock(tsui.game.world, 359.5), true');
    await cdp.until('tsui.note && /Автосохранение 2/.test(tsui.note.text)', 15000);
    const cost = await cdp.eval(`(async () => {
      const S = Sims98, ui = tsui, a = performance.now(), file = S.Save.file(ui.game, ui.savedView()), packMs = performance.now() - a;
      const b = performance.now(), bytes = await S.Save.encode(file), encodeMs = performance.now() - b, store = await ui.saveStore();
      const c = performance.now();
      await S.Save.write(store, 'slot10', file, Date.now());
      return { packMs: +packMs.toFixed(2), encodeMs: +encodeMs.toFixed(2), writeMs: +(performance.now() - c).toFixed(2), bytes: bytes.length, people: file.state.sims.length, json: JSON.stringify(file).length };
    })()`);
    log.push('cost of a save: ' + JSON.stringify(cost));
    if (cost.packMs > 16) throw new Error('packing a save is a visible stall: ' + cost.packMs);
    await cdp.eval('tsui.settings.debug = true, tsui.stamp = "", true');
    await shot('stats');
  },
  async live(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await sleep(500);
    const shot = async name => {
      await sleep(200);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const clickAt = async (x, y, button) => {
      await moveTo(x, y);
      const b = button === 'right' ? { button, buttons: 2 } : { button: 'left', buttons: 1 };
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, ...b });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, ...b, buttons: 0 });
      await sleep(80);
    };
    const key = async (k, code, vk) => {
      const p = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await sleep(30);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(120);
    };
    const top = await cdp.eval('tsui.live.top');
    await moveTo(500, 200);
    await shot('live-800');
    const faceInk = await cdp.eval('(() => { const d = tsui.panels.getContext("2d").getImageData(296, tsui.live.top - 12, 1, 1).data; return d[3]; })()');
    if (faceInk !== 255) throw new Error('the big portrait is not drawn');
    const state = () => cdp.eval('(() => { const u = tsui, g = u.game, c = u.camera, s = u.selected; return { zoom: c.zoom, rot: c.rot, speed: g.speed, tab: u.live.tab, open: u.live.open, sel: s.id, order: !!s.order, state: s.state, follow: u.follow, menu: u.live.menu, map: u.map.open, files: u.saves.open, wall: u.wallMode, floor: u.floor }; })()');
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(330);
      return cdp.eval('(() => { const h = tsui.live.layer.hover; return h ? (h.tip ? (tsui.live.layer.tip(performance.now(), 0) || {}).title : "solid") : null; })()');
    };
    const hovers = [['dial-up', 61, top + 22], ['dial-right', 83, top + 44], ['dial-home', 61, top + 44], ['map', 16, top + 16], ['money', 73, top + 101], ['mode-buy', 140, top + 58], ['wish', 190, top + 32], ['face', 300, top - 10], ['star', 296, top + 56], ['clock', 296, top + 80], ['speed-4', 324, top + 100], ['mood', 344, top + 50], ['moodlet', 370, top + 20], ['arrow', 447, top + 55], ['tab-3', 459 + 3 * 37 + 18, top - 10], ['face-1', 26, top - 200]];
    const seen = {};
    for (const [name, x, y] of hovers) {
      const title = await tipAt(x, y);
      seen[name] = title;
      if (!title || title === 'solid') throw new Error('no hint on ' + name);
      if (name === 'wish' || name === 'clock' || name === 'dial-right' || name === 'tab-3') await shot('tip-' + name);
    }
    log.push('hints: ' + JSON.stringify(seen));
    const s0 = await state();
    await clickAt(61, top + 22);
    await sleep(250);
    const s1 = await state();
    if (s1.zoom !== s0.zoom - 1) throw new Error('the dial does not zoom in');
    await clickAt(61, top + 66);
    await sleep(250);
    if ((await state()).zoom !== s0.zoom) throw new Error('the dial does not zoom out');
    const wall0 = (await state()).wall;
    await clickAt(105, top + 44);
    const wall1 = (await state()).wall;
    if (wall1 === wall0) throw new Error('the wall button does not change the walls');
    await clickAt(105, top + 44);
    await clickAt(105, top + 44);
    if ((await state()).wall !== wall0) throw new Error('the wall button does not go round');
    await clickAt(83, top + 44);
    await sleep(200);
    if ((await state()).rot !== (s0.rot + 1) % 4) throw new Error('the dial does not turn');
    await clickAt(39, top + 44);
    await sleep(200);
    if ((await state()).rot !== s0.rot) throw new Error('the dial does not turn back');
    for (let i = 1; i <= 4; i++) {
      await clickAt(262 + i * 14 + 7, top + 99);
      const speed = (await state()).speed;
      if (speed !== i && !(i === 4 && speed === 1)) throw new Error('speed button ' + i + ' gave ' + speed);
    }
    await clickAt(262 + 7, top + 99);
    if ((await state()).speed !== 0) throw new Error('the pause button does not stop time');
    await shot('live-pause');
    for (let i = 0; i < 8; i++) {
      await clickAt(459 + i * 37 + 18, top - 10);
      const st = await state();
      if (st.tab !== i) throw new Error('tab ' + i + ' does not open');
      await moveTo(600, 150);
      await shot('tab-' + i);
    }
    await clickAt(447, top + 55);
    if ((await state()).open) throw new Error('the arrow does not close the panel');
    await moveTo(600, 150);
    await shot('live-closed');
    await clickAt(447, top + 55);
    if (!(await state()).open) throw new Error('the arrow does not open the panel');
    await clickAt(459 + 18, top - 10);
    const faces = await cdp.eval('tsui.live.family().length');
    const faceY = i => top - 8 - (faces - i) * 49 + 20;
    await clickAt(26, faceY(2));
    if ((await state()).sel !== 'hugo') throw new Error('a portrait does not select the sim');
    await shot('live-hugo');
    await clickAt(26, faceY(0));
    await clickAt(26, faceY(0));
    const twice = await state();
    if (twice.sel !== 'viktor' || !twice.follow) throw new Error('a double click on a portrait does not bring the camera');
    const blank = await state();
    await clickAt(160, top + 104);
    await clickAt(600, top + 60);
    const afterPanel = await state();
    if (afterPanel.order) throw new Error('a click on the panel orders the sim');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await clickAt(500, 150);
    if (!await cdp.eval('tsui.pie.open')) throw new Error('a click on the world does not open the menu');
    await key('1', 'Digit1', 49);
    await sleep(300);
    const walking = await state();
    const queued = await cdp.eval('Sims98.Acts.list(tsui.selected).some(a => !!a.go)');
    if (walking.state !== 'move' && !walking.order && !queued) throw new Error('a menu item does not order the sim: ' + JSON.stringify(walking));
    await sleep(300);
    await moveTo(600, 150);
    await shot('queue');
    await clickAt(38, 14);
    await sleep(300);
    const cancelled = await state();
    await cdp.until('tsui.selected.state === "idle" && !Sims98.Acts.list(tsui.selected).length', 5000);
    await key('Escape', 'Escape', 27);
    if (!(await state()).menu) throw new Error('Esc does not open the menu');
    await moveTo(40, top - 20);
    await shot('menu');
    const box = await cdp.eval('tsui.live.menuBox()');
    await clickAt(box.x + 30, box.y + 4 + 24 + 12);
    const fromMenu = await state();
    if (!fromMenu.files || fromMenu.menu) throw new Error('the menu does not open the load window');
    await shot('files');
    await key('Escape', 'Escape', 27);
    await clickAt(16, top + 16);
    if (!(await state()).map) throw new Error('the map button does not open the map');
    await sleep(300);
    await shot('map');
    await key('m', 'KeyM', 77);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await sleep(300);
    const idle = await cdp.eval(`(async () => {
      const layer = tsui.live.layer;
      const before = layer.redraws;
      await new Promise(r => setTimeout(r, 1000));
      const still = layer.redraws - before, a = performance.now();
      for (let i = 0; i < 200; i++) layer.update();
      const idleMs = (performance.now() - a) / 200;
      layer.full = true;
      const b = performance.now();
      layer.update();
      const fullMs = performance.now() - b, count = layer.items.length;
      const walls = tsui.live.layer.items.filter(i => i.draw).length;
      return { still, idleMs: +idleMs.toFixed(3), fullMs: +fullMs.toFixed(2), count, walls };
    })()`);
    log.push('panel cost: ' + JSON.stringify(idle));
    if (idle.still) throw new Error('the paused panel redraws: ' + idle.still);
    await cdp.eval('tsui.game.setSpeed(1), true');
    const running = await cdp.eval(`(async () => {
      const layer = tsui.live.layer, before = layer.redraws;
      await new Promise(r => setTimeout(r, 3000));
      return layer.redraws - before;
    })()`);
    log.push('panel redraws in 3 s at speed 1: ' + running);
    if (running > 30) throw new Error('the panel redraws too much: ' + running);
    for (const [mode, w, h] of [['1024', 1024, 768], ['window', 1280, 720]]) {
      await place(cdp, w, h);
      await cdp.eval('tsui.setScreen("' + mode + '"), true');
      await cdp.until('tsui.screen.sw === ' + w + ' && tsui.screen.sh === ' + h);
      await sleep(400);
      const yy = await cdp.eval('tsui.live.top');
      if (yy !== h - 116) throw new Error('the panel does not hold the bottom edge: ' + yy);
      await moveTo(w - 100, 200);
      await shot('mode-' + mode);
      await clickAt(61, yy + 22);
      await sleep(250);
      await clickAt(61, yy + 66);
      await sleep(250);
    }
    await cdp.eval('tsui.setScreen("800"), true');
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
  },
  async pie(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await sleep(500);
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const press = async (x, y, button) => {
      await moveTo(x, y);
      const b = button === 'right' ? { button, buttons: 2 } : { button: 'left', buttons: 1 };
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, ...b });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, ...b, buttons: 0 });
      await sleep(80);
    };
    const shot = async name => {
      await sleep(220);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const objectAt = (kind, floor, up) => cdp.eval(`(() => {
      const ui = tsui, lot = ui.scene.world.lots[0], h = lot.house, it = h.items.find(i => i.kind === 'm_${kind}' && i.floor === ${floor});
      ui.follow = false;
      ui.floor = ${floor};
      ui.wallMode = 'cut';
      ui.autoCut = false;
      ui.camera.setView({ x: lot.x + it.x, z: lot.z + it.z });
      ui.stamp = '';
      const p = ui.camera.toScreen(lot.x + it.x, Sims98.House.floorY(h, ${floor}) + ${up}, lot.z + it.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    const choose = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await press(at[0], at[1]);
    };
    const sim = () => cdp.eval('(() => { const s = tsui.selected; return { id: s.id, state: s.state, clip: s.clip, floor: s.floor, act: s.act ? (s.act.ad || "go") + ":" + s.act.phase : null, queue: s.queue.map(a => a.ad || "go"), needs: Object.fromEntries(Sims98.NEED_ORDER.map(n => [n, Math.round(s.needs[n])])) }; })()');
    const until = (cond, ms) => cdp.until(cond, ms || 40000);
    const use = async (kind, floor, up, label, frame, near) => {
      const [x, y] = await objectAt(kind, floor, up);
      await sleep(250);
      await press(x, y);
      if (!await cdp.eval('tsui.pie.open')) throw new Error('no menu on ' + kind);
      const title = await cdp.eval('tsui.pie.title');
      if (frame) await shot('pie-' + kind);
      for (const one of [].concat(label)) await choose(one);
      await until('tsui.selected.act && tsui.selected.act.phase === "run"');
      await cdp.eval('tsui.game.setSpeed(0), true');
      if (near !== undefined) await cdp.eval('tsui.camera.setView({ zoom: ' + near + ' }), true');
      await sleep(near === 0 ? 900 : 300);
      await shot('act-' + kind);
      const during = await sim();
      await cdp.eval('tsui.camera.setView({ zoom: 1 }), tsui.game.setSpeed(3), true');
      await until('!tsui.selected.act && !tsui.selected.queue.length && tsui.selected.state === "idle"', 120000);
      await cdp.eval('tsui.game.setSpeed(1), true');
      log.push(kind + ' (' + title + '): during ' + JSON.stringify(during) + ', after ' + JSON.stringify((await sim()).needs));
      return during;
    };
    await shot('house-floor-0');
    await cdp.eval('tsui.selected.needs.hunger = 30, tsui.selected.needs.bladder = 25, tsui.selected.needs.hygiene = 30, tsui.selected.needs.energy = 40, true');
    const fridgeAct = await use('fridge', 0, 1.2, 'Перекусить', true, 0);
    if (fridgeAct.clip !== 'use' && fridgeAct.clip !== 'eatStand') throw new Error('the fridge plays no clip: ' + fridgeAct.clip);
    await use('toilet', 0, 0.5, 'Сходить в туалет', true, 0);
    const showerAct = await use('shower', 0, 1.2, 'Принять душ', false, 0);
    if (showerAct.clip !== 'shower') throw new Error('the shower plays no clip: ' + showerAct.clip);
    await use('tv', 0, 0.8, 'Смотреть телевизор', true, 1);
    await use('stove', 0, 0.9, ['Приготовить…', 'Гречка с грибами'], true, 1);
    await use('bookshelf', 0, 1.2, 'Почитать', false, 1);
    await cdp.eval('tsui.setFloor(1), true');
    await sleep(300);
    await shot('house-floor-1');
    const bedAct = await use('bed', 1, 0.6, 'Лечь спать', true, 1);
    if (bedAct.clip !== 'sleep') throw new Error('the bed plays no clip: ' + bedAct.clip);
    await use('computer', 1, 1, 'Поиграть на компьютере', true, 1);
    await use('bathtub', 1, 0.5, 'Принять ванну', false, 1);
    const [gx, gy] = await objectAt('sofa', 0, 0.5);
    await press(gx, gy);
    const shiftMenu = await cdp.eval('tsui.pie.open');
    if (!shiftMenu) throw new Error('no menu on the sofa');
    await press(gx, gy, 'right');
    if (await cdp.eval('tsui.pie.open')) throw new Error('the right button does not close the menu');
    await press(gx, gy);
    const p = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(100);
    if (await cdp.eval('tsui.pie.open')) throw new Error('Esc does not close the menu');
    await press(gx, gy);
    await press(gx - 300, 40);
    if (await cdp.eval('tsui.pie.open')) throw new Error('a click outside does not close the menu');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[2]), tsui.setFloor(0), true');
    const [sx, sy] = await objectAt('stove', 0, 0.9);
    await press(sx, sy);
    const kidMenu = await cdp.eval('tsui.pie.all.map(o => o.label)');
    if (kidMenu.includes('Приготовить…')) throw new Error('a child can cook');
    await shot('pie-child');
    await press(sx - 300, 40);
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[0]), true');
    const top = await cdp.eval('tsui.live.top');
    await press(459 + 7 * 37 + 18, top - 10);
    await shot('tab-needs');
    await cdp.eval('tsui.selected.needs.fun = 20, true');
    const row = await cdp.eval('(() => { const i = Sims98.NEED_ORDER.indexOf("fun"); return [456 + 14 + (i % 2) * 160 + 70, tsui.live.top + 10 + Math.floor(i / 2) * 33 + 18]; })()');
    await press(row[0], row[1]);
    const fromBar = await sim();
    if (!fromBar.act && !fromBar.queue.length) throw new Error('a need bar does not queue an action');
    log.push('fun bar gives: ' + JSON.stringify(fromBar));
    await sleep(600);
    await shot('queue-need');
    const sound = await cdp.eval('({ ctx: tsui.sound.ctx ? tsui.sound.ctx.state : null, buffers: tsui.sound.ctx ? tsui.sound.buffers.size : 0 })');
    log.push('sound: ' + JSON.stringify(sound));
    if (sound.ctx !== 'running') throw new Error('the sound does not run');
    await cdp.eval('Sims98.Acts.cancel(tsui.scene.world, tsui.selected, 0), tsui.game.freeWill = 2, tsui.game.setSpeed(3), tsui.setFloor(0), tsui.setWallMode("cut"), tsui.camera.setView({ x: tsui.scene.world.lots[0].x + 14, z: tsui.scene.world.lots[0].z + 10, zoom: 2 }), true');
    for (let i = 0; i < 4; i++) {
      await sleep(5000);
      await cdp.eval('tsui.settings.debug = false, tsui.stamp = "", true');
      await shot('family-life-' + i);
      log.push('family: ' + JSON.stringify(await cdp.eval('tsui.scene.world.family.map(s => [s.id, s.act ? (s.act.ad || "go") : s.state])')));
    }
    await cdp.eval('tsui.game.setSpeed(1), true');
    const loops = await cdp.eval('[...tsui.sound.loops.keys()]');
    log.push('sound loops: ' + JSON.stringify(loops));
  },
  async mood(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.game.freeWill = 0, tsui.settings.debug = false, tsui.setView(2), tsui.setHour(12), tsui.camera.setView({ rot: 0, zoom: 1 }), tsui.game.setSpeed(1), true');
    await sleep(600);
    const shot = async name => {
      await sleep(220);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const clickAt = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(100);
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const top = await cdp.eval('tsui.live.top');
    const tile = i => [355 + 2 + (i % 3) * 25 + 11, top + 8 + 2 + Math.floor(i / 3) * 32 + 11];
    await cdp.eval(`(() => {
      const s = tsui.selected, w = tsui.scene.world;
      for (const n of Sims98.NEED_ORDER) s.needs[n] = 90;
      s.needs.hunger = 15;
      s.needs.hygiene = 12;
      s.moods = [];
      Sims98.Moods.add(s, 'homeMeal');
      Sims98.Moods.add(s, 'goodShow');
      Sims98.Moods.add(s, 'wokenUp');
      Sims98.Moods.step(w, s, 0);
      tsui.game.setSpeed(0);
      return true;
    })()`);
    await moveTo(600, 200);
    await shot('mood-panel');
    const listed = await cdp.eval('Sims98.Moods.list(tsui.selected).map(e => e.id)');
    log.push('moodlets: ' + JSON.stringify(listed) + ', mood ' + await cdp.eval('Sims98.Moods.mood(tsui.selected)'));
    const hungerAt = listed.indexOf('veryHungry');
    if (hungerAt < 0) throw new Error('no hunger moodlet');
    const tip = await tipAt(...tile(hungerAt));
    if (!tip || tip.title !== 'Очень хочется есть' || !/поесть/.test(tip.keys) || !tip.icon) throw new Error('the moodlet hint is wrong: ' + JSON.stringify(tip));
    await shot('mood-tip');
    const barTip = await tipAt(344, top + 50);
    if (!barTip || !/Настроение/.test(barTip.title) || !/огорчает/.test(barTip.text)) throw new Error('the mood bar hint is wrong: ' + JSON.stringify(barTip));
    await shot('mood-bar-tip');
    log.push('hints: ' + JSON.stringify([tip.title, tip.line, tip.keys, barTip.title, barTip.text]));
    await clickAt(...tile(hungerAt));
    const queued = await cdp.eval('Sims98.Acts.list(tsui.selected).map(a => a.ad || "go")');
    if (!await cdp.eval('Sims98.Acts.list(tsui.selected).some(a => a.ad && Sims98.adGains(Sims98.ADS[a.ad]).hunger > 0)')) throw new Error('a click on hunger queues no food: ' + queued);
    log.push('a click on hunger queues: ' + JSON.stringify(queued));
    await shot('mood-cure');
    await cdp.eval('Sims98.Acts.cancel(tsui.scene.world, tsui.selected, 0), tsui.selected.queue.length = 0, true');
    await cdp.eval(`(() => {
      const s = tsui.selected;
      for (const id of ['wedding', 'kiss', 'gift', 'concert', 'spa', 'firstKiss', 'goodDate', 'raise', 'tan', 'jog']) Sims98.Moods.add(s, id);
      Sims98.Moods.step(tsui.scene.world, s, 0);
      return true;
    })()`);
    const more = await tipAt(...tile(8));
    if (!more || !/Ещё/.test(more.title)) throw new Error('no fold tile: ' + JSON.stringify(more));
    await shot('mood-more');
    const faces = await cdp.eval(`(() => {
      const s = tsui.selected, w = tsui.scene.world, read = () => { const c = tsui.faceOf(s, 72, 70); return c ? c.getContext('2d').getImageData(0, 0, 72, 70).data : null; };
      Sims98.Moods.step(w, s, 0);
      const happy = s.face, a = read();
      s.moods = [];
      for (const id of ['mourning', 'heartbreak']) Sims98.Moods.add(s, id);
      Sims98.Moods.step(w, s, 0);
      const sad = s.face, b = read();
      let differ = 0;
      for (let i = 0; a && b && i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) differ++;
      tsui.stamp = '';
      return { happy, sad, differ };
    })()`);
    log.push('faces: ' + JSON.stringify(faces));
    if (faces.happy !== 1 || faces.sad !== -1 || faces.differ < 4) throw new Error('the face does not follow the mood: ' + JSON.stringify(faces));
    await moveTo(600, 200);
    await shot('mood-sad');
    await clickAt(300, top - 10);
    const tab = await cdp.eval('tsui.live.tab');
    if (tab !== 0) throw new Error('the big portrait does not open Simology');
    const treeTip = await tipAt(611, top + 16);
    if (!treeTip || !/дерево/.test(treeTip.title)) throw new Error('no family tree hint: ' + JSON.stringify(treeTip));
    await shot('simology');
    await cdp.eval('tsui.selected.moods = [], tsui.game.freeWill = 2, tsui.game.setSpeed(3), true');
    await sleep(4000);
    await moveTo(600, 200);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await shot('mood-family');
    const family = await cdp.eval('tsui.scene.world.family.map(s => [s.id, Sims98.Moods.mood(s), Sims98.Moods.list(s).map(e => e.id).join(" ")])');
    log.push('family: ' + JSON.stringify(family));
  },
  async traits(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.settings.debug = false, tsui.setView(2), tsui.setHour(9), tsui.camera.setView({ rot: 0, zoom: 1 }), tsui.game.freeWill = 2, tsui.game.setSpeed(3), true');
    const shot = async name => {
      await sleep(220);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const clickAt = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(120);
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const doing = () => cdp.eval('tsui.scene.world.family.map(s => s.id + ":" + (s.act ? (s.act.ad || "go" + (s.act.mood ? ":" + s.act.mood : "")) : s.state) + (s.bubble ? " [" + s.bubble + "]" : ""))');
    await sleep(9000);
    await moveTo(600, 200);
    await shot('traits-life');
    log.push('the family after a while: ' + JSON.stringify(await doing()));
    await cdp.eval(`(() => {
      const w = tsui.scene.world, a = w.family[1];
      tsui.game.setSpeed(0);
      tsui.camera.setView({ x: a.x, z: a.z, zoom: 1 });
      a.hold = 0;
      Sims98.Traits.hold(a, 3, 'wave', 'talk');
      tsui.stamp = '';
      return true;
    })()`);
    await sleep(400);
    const bubbles = await cdp.eval('tsui.bubbles().length');
    if (!bubbles) throw new Error('a reaction shows no bubble');
    await shot('traits-bubble');
    const top = await cdp.eval('tsui.live.top');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[0]), true');
    await clickAt(300, top - 10);
    if (await cdp.eval('tsui.live.tab') !== 0) throw new Error('the portrait does not open Simology');
    const traitTip = await tipAt(700, top + 24 + 9);
    const want = await cdp.eval('Sims98.Traits.name(tsui.selected.traits[0], tsui.selected.sex)');
    if (!traitTip || traitTip.title !== want || !traitTip.text) throw new Error('the trait hint is wrong: ' + JSON.stringify(traitTip) + ', want ' + want);
    await shot('traits-simology');
    log.push('trait hint: ' + JSON.stringify([traitTip.title, traitTip.text, traitTip.line, traitTip.later]));
    const astridAt = await cdp.eval(`(() => {
      const a = tsui.scene.world.family[1], p = tsui.camera.toScreen(a.x, a.y + 1.2, a.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    await moveTo(600, 200);
    await clickAt(astridAt[0], astridAt[1]);
    const familySub = await cdp.eval('tsui.pie.open ? tsui.pie.sub : null');
    if (!familySub || !/Черты: /.test(familySub) || /\?/.test(familySub) || !/Жена/.test(familySub)) throw new Error('the family menu does not list the relation and known traits: ' + familySub);
    await shot('traits-pie-family');
    await clickAt(40, 40);
    let stranger = null;
    for (let i = 0; i < 40 && !stranger; i++) {
      stranger = await cdp.eval(`(() => {
        const w = tsui.scene.world, me = tsui.selected;
        const list = w.live.filter(s => s.free && !s.inside && !s.car && s.state !== 'trip' && s.floor === 0).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z));
        return list.length ? w.sims.indexOf(list[0]) : null;
      })()`);
      if (stranger === null) {
        await cdp.eval('tsui.game.setSpeed(3), true');
        await sleep(1000);
        await cdp.eval('tsui.game.setSpeed(0), true');
      }
    }
    if (stranger === null) throw new Error('no town person near the family');
    const strangerAt = await cdp.eval(`(() => {
      const s = tsui.scene.world.sims[${stranger}];
      s.hold = 20;
      s.holdClip = 'idle';
      tsui.follow = false;
      tsui.camera.setView({ x: s.x, z: s.z, zoom: 1 });
      tsui.stamp = '';
      return true;
    })()`);
    await sleep(500);
    const at = await cdp.eval(`(() => {
      const s = tsui.scene.world.sims[${stranger}], p = tsui.camera.toScreen(s.x, s.y + Sims98.Body.height(s.age) * 0.6, s.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    await clickAt(at[0], at[1]);
    const strangerSub = await cdp.eval('tsui.pie.open ? tsui.pie.sub : null');
    if (!strangerSub || !/\?/.test(strangerSub)) throw new Error('a stranger shows no unknown traits: ' + strangerSub);
    await shot('traits-pie-stranger');
    const pillAt = label => cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
    const friendly = await pillAt('Дружеское…');
    if (!friendly) throw new Error('no friendly section in the stranger menu');
    await clickAt(friendly[0], friendly[1]);
    const chat = await pillAt('Поболтать');
    if (!chat) throw new Error('no chat in the friendly section');
    await clickAt(chat[0], chat[1]);
    await cdp.eval('tsui.follow = true, tsui.game.setSpeed(3), true');
    await cdp.until(`(() => { const k = tsui.selected.knows[tsui.scene.world.sims[${stranger}].id]; return !!(k && k.length); })()`, 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await shot('traits-learn');
    const learned = await cdp.eval(`(() => { const s = tsui.scene.world.sims[${stranger}]; return { name: s.name, known: Sims98.Traits.known(tsui.selected, s), note: tsui.note ? tsui.note.text : null }; })()`);
    log.push('learned from a stranger: ' + JSON.stringify(learned));
    if (learned.known.filter(Boolean).length !== 1) throw new Error('a chat did not reveal one trait');
  },
  async wishes(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s) && s.wish.offered.length === 3)', 20000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    const shot = async name => {
      await sleep(240);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const clickAt = async (x, y, button) => {
      await moveTo(x, y);
      const b = button === 'right' ? { button, buttons: 2 } : { button: 'left', buttons: 1 };
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, ...b });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, ...b, buttons: 0 });
      await sleep(120);
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const top = await cdp.eval('tsui.live.top');
    await moveTo(600, 200);
    await shot('wish-offers');
    const offerTip = await tipAt(140 + 15, top - 40 + 15);
    if (!offerTip || !/обещать/.test(offerTip.keys || '') || !/счастья/.test(offerTip.line || '')) throw new Error('an offered wish has no proper hint: ' + JSON.stringify(offerTip));
    await shot('wish-tip');
    log.push('offered wish hint: ' + JSON.stringify([offerTip.title, offerTip.text, offerTip.line, offerTip.later]));
    await cdp.eval('(() => { const s = tsui.selected; s.wish.offered[0] = { id: "daily_shower", left: 240 }; s.needs.hygiene = 25; tsui.stamp = ""; return true; })()');
    await sleep(200);
    await clickAt(140 + 15, top - 40 + 15);
    const promised = await cdp.eval('tsui.selected.wish.promised.map(e => e.id)');
    if (!promised.includes('daily_shower')) throw new Error('a click does not promise the wish: ' + promised);
    const wellTip = await tipAt(167 + 22, top + 10 + 22);
    if (!wellTip || !/Совет/.test(wellTip.later || '')) throw new Error('a promised wish gives no advice: ' + JSON.stringify(wellTip));
    await shot('wish-promised');
    const happyBefore = await cdp.eval('tsui.selected.happy');
    await cdp.eval('(() => { const w = tsui.scene.world, s = tsui.selected, lot = w.lots[0]; Sims98.Acts.add(w, s, Sims98.Acts.adAct("shower_take", lot, lot.house.items.find(i => i.kind === "m_shower"))); tsui.game.setSpeed(3); return true; })()');
    await cdp.until('!tsui.selected.wish.promised.some(e => e.id === "daily_shower")', 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(600, 200);
    await shot('wish-done');
    const after = await cdp.eval('({ happy: tsui.selected.happy, note: tsui.note ? tsui.note.text : null, moods: Sims98.Moods.list(tsui.selected).map(e => e.id) })');
    log.push('a kept promise: ' + JSON.stringify(after) + ', before ' + Math.round(happyBefore));
    if (after.happy < happyBefore + 100 || !after.moods.includes('wishDone')) throw new Error('a kept promise gives nothing');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[1]), true');
    await sleep(200);
    await clickAt(296, top + 56);
    if (!await cdp.eval('tsui.live.dreamOpen')) throw new Error('the dream well does not open the choice');
    await moveTo(400, 300);
    await shot('wish-dream');
    const box = await cdp.eval('tsui.live.dreamBox()');
    await clickAt(box.x + 60, box.y + 34 + 18);
    const dream = await cdp.eval('tsui.selected.dream && tsui.selected.dream.id');
    if (!dream) throw new Error('a click does not choose the dream');
    const dreamTip = await tipAt(296, top + 56);
    if (!dreamTip || !/Цель/.test(dreamTip.text)) throw new Error('the dream has no hint: ' + JSON.stringify(dreamTip));
    await shot('wish-dream-tip');
    log.push('dream: ' + dream + ', ' + dreamTip.title);
    await cdp.eval('tsui.selected.happy = 16000, tsui.stamp = "", true');
    const rewardsTab = await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === "rewards")');
    await clickAt(459 + rewardsTab * 37 + 18, top - 10);
    const steel = await cdp.eval('Object.keys(Sims98.REWARDS).indexOf("steelBladder")');
    const sx = 470 + (steel % 8) * 38 + 18, sy = top + 28 + Math.floor(steel / 8) * 21 + 10;
    const rewardTip = await tipAt(sx, sy);
    if (!rewardTip || rewardTip.title !== 'Стальной пузырь') throw new Error('the reward hint is wrong: ' + JSON.stringify(rewardTip));
    await shot('wish-rewards');
    await clickAt(sx, sy);
    await clickAt(sx, sy);
    const bought = await cdp.eval('tsui.selected.rewards.slice()');
    if (!bought.includes('steelBladder')) throw new Error('two clicks do not buy the reward');
    await moveTo(600, 200);
    await shot('wish-bought');
    log.push('bought: ' + bought.join());
  },
  async social(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.selectSim(tsui.scene.world.family[1]), true');
    const shot = async name => {
      await sleep(240);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const clickAt = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(140);
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const pillAt = label => cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
    const choose = async label => {
      const at = await pillAt(label);
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await clickAt(at[0], at[1]);
    };
    const guest = await cdp.eval(`(() => {
      const w = tsui.scene.world, a = tsui.selected, lot = a.lot, s = w.sims.find(o => o.free && o.age === 'adult' && o.sex === 'f' && !o.car);
      let spot = null;
      for (let r = 2; r <= 5 && !spot; r++) {
        for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r]]) {
          const x = a.x + dx, z = a.z + dz;
          if (lot.nav.isFree(a.floor, Math.floor(x - lot.x), Math.floor(z - lot.z))) { spot = [Math.floor(x) + 0.5, Math.floor(z) + 0.5]; break; }
        }
      }
      Object.assign(s, { inside: null, live: true, trip: null, car: null, after: null, order: null, path: null, state: 'idle', day: null, hold: 0, x: spot[0], z: spot[1], floor: a.floor, lot });
      s.y = Sims98.Sim.groundY(w, s.floor, lot, s.x, s.z);
      if (!w.live.includes(s)) w.live.push(s);
      tsui.follow = false;
      tsui.camera.setView({ x: (a.x + s.x) / 2, z: (a.z + s.z) / 2, zoom: 1 });
      tsui.stamp = '';
      return w.sims.indexOf(s);
    })()`);
    const screenOf = index => cdp.eval('(() => { const s = tsui.scene.world.sims[' + index + '], p = tsui.camera.toScreen(s.x, s.y + 1.2, s.z); return [Math.round(p[0]), Math.round(p[1])]; })()');
    await sleep(400);
    let at = await screenOf(guest);
    await clickAt(at[0], at[1]);
    const firstSub = await cdp.eval('tsui.pie.open ? tsui.pie.sub : null');
    if (!firstSub || !/Незнакомка/.test(firstSub)) throw new Error('a stranger is not marked in the menu: ' + firstSub);
    const sections = await cdp.eval('tsui.pie.all.map(o => o.label)');
    if (!sections.includes('Дружеское…') || !sections.includes('Романтика…')) throw new Error('the menu of a person has no sections: ' + sections);
    await shot('social-pie');
    await choose('Дружеское…');
    if (await cdp.eval('tsui.pie.pills[0].option.label') !== 'Назад') throw new Error('a section has no way back');
    await shot('social-section');
    await choose('Представиться');
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('!Sims98.Acts.busy(tsui.selected)', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    const met = await cdp.eval('Sims98.Rel.status(tsui.scene.world, tsui.selected, tsui.scene.world.sims[' + guest + '])');
    if (met !== 'known') throw new Error('introducing did not make them acquainted: ' + met);
    await shot('social-met');
    log.push('after introducing: ' + met + ', note ' + await cdp.eval('tsui.note ? tsui.note.text : null'));
    await cdp.eval('(() => { const r = Sims98.Rel.get(tsui.scene.world, tsui.selected, tsui.scene.world.sims[' + guest + ']); r.v = 45; tsui.stamp = ""; return true; })()');
    at = await screenOf(guest);
    await clickAt(at[0], at[1]);
    await choose('Дружеское…');
    const dots = await cdp.eval('tsui.pie.pills.filter(q => q.option.dot).length');
    if (!dots) throw new Error('a friend shows no chance dots');
    const second = await cdp.eval('(() => { const p = tsui.pie.pills[1]; return [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)]; })()');
    await moveTo(second[0], second[1]);
    await sleep(600);
    const pieTip = await cdp.eval('(() => { const o = tsui.pie.pills[1].option; return o.tip ? o.tip.line : null; })()');
    if (!pieTip || !/Шанс: \d+%/.test(pieTip)) throw new Error('a friend shows no chance in the hint: ' + pieTip);
    await shot('social-dots');
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape' });
    await sleep(200);
    const top = await cdp.eval('tsui.live.top');
    const relTab = await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === "relations")');
    await clickAt(459 + relTab * 37 + 18, top - 10);
    if (await cdp.eval('tsui.live.tab') !== relTab) throw new Error('the relations tab did not open');
    const rows = await cdp.eval('tsui.live.relRows().map(r => r.other.name + ":" + r.word + (r.kinWord ? "/" + r.kinWord : ""))');
    if (!rows.some(r => /Подруга/.test(r)) || !rows.some(r => /Муж/.test(r))) throw new Error('the relations tab misses people: ' + rows);
    await moveTo(600, 200);
    await shot('social-tab');
    const rowTip = await tipAt(560, top + 26 + 12);
    if (!rowTip || !/Отношения: /.test(rowTip.line || '')) throw new Error('a relation row has no hint: ' + JSON.stringify(rowTip));
    await shot('social-tab-tip');
    log.push('relations: ' + rows.join(', ') + '; tip ' + JSON.stringify([rowTip.title, rowTip.text, rowTip.line]));
    await clickAt(466 + 2 * 46 + 22, top + 13);
    const friends = await cdp.eval('tsui.live.relRows().map(r => r.status)');
    if (!friends.length || friends.some(s => !['friend', 'goodFriend', 'best', 'oldFriend'].includes(s))) throw new Error('the friends filter is wrong: ' + friends);
    await moveTo(600, 200);
    await shot('social-friends');
    await clickAt(752 + 10, top + 26 + 3 + 10);
    if (!await cdp.eval('tsui.map.open && !!tsui.map.mark')) throw new Error('the pin does not show the person on the map');
    await shot('social-map');
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape' });
    await sleep(200);
    await clickAt(466 + 22, top + 13);
    await cdp.eval('tsui.selected.rewards.push("partyHost"), true');
    const self = await screenOf(await cdp.eval('tsui.scene.world.sims.indexOf(tsui.selected)'));
    await clickAt(self[0], self[1]);
    const phone = await cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label + (o.closed ? "(x)" : "")) : null');
    if (!phone || !phone.includes('Позвонить…') || !phone.some(l => /^Устроить вечеринку/.test(l))) throw new Error('the own menu is not the phone: ' + phone);
    await shot('social-phone');
    await choose('Устроить вечеринку');
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('!!tsui.scene.world.party', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(600, 200);
    await shot('social-party');
    log.push('party: ' + await cdp.eval('JSON.stringify({ text: tsui.partyText(), guests: tsui.scene.world.party.guests.length, note: tsui.note ? tsui.note.text : null })'));
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[3]), true');
    at = await screenOf(guest);
    await clickAt(at[0], at[1]);
    const teen = await cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label) : null');
    if (!teen || teen.includes('Романтика…')) throw new Error('a teen sees romance with an adult: ' + teen);
    await clickAt(20, 20);
    await cdp.eval('(() => { const w = tsui.scene.world, v = w.family[0], s = w.sims[' + guest + '], r = Sims98.Rel.make(w, v, s); r.f |= Sims98.Rel.F.met; r.v = -40; s.chatLeft = 0; tsui.selectSim(v); return true; })()');
    at = await screenOf(guest);
    await clickAt(at[0], at[1]);
    await choose('Злое…');
    for (let k = 0; k < 4 && !await pillAt('Подраться'); k++) await choose('Ещё…');
    await choose('Подраться');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "fight" && a.phase === "run"); })()', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await sleep(300);
    if (!await cdp.eval('tsui.fights().length')) throw new Error('a fight shows no dust cloud');
    await shot('social-fight');
    await cdp.eval('tsui.askJoin(tsui.scene.world.sims[' + guest + ']), true');
    await sleep(300);
    await moveTo(400, 300);
    await shot('social-ask');
    const box = await cdp.eval('tsui.askBox()');
    await clickAt(box.x + box.w - 16 - 75, box.y + box.h - 22);
    if (await cdp.eval('!!tsui.ask || tsui.scene.world.family.length !== 5')) throw new Error('declining the move does not close the window');
    await moveTo(600, 200);
    await shot('social-after');
  },

  async skills(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.selectSim(tsui.scene.world.family[0]), true');
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const press = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(140);
    };
    const key = async (code, k) => {
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code, key: k, windowsVirtualKeyCode: k.length === 1 ? k.toUpperCase().charCodeAt(0) : 27 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k });
      await sleep(200);
    };
    const shot = async name => {
      await sleep(240);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const objectAt = (kind, up) => cdp.eval(`(() => {
      const ui = tsui, lot = ui.scene.world.lots[0], h = lot.house, it = h.items.find(i => i.kind === 'm_${kind}' && i.floor === 0);
      ui.follow = false;
      ui.floor = 0;
      ui.wallMode = 'cut';
      ui.autoCut = false;
      ui.camera.setView({ x: lot.x + it.x, z: lot.z + it.z });
      ui.stamp = '';
      const p = ui.camera.toScreen(lot.x + it.x, Sims98.House.floorY(h, 0) + ${up}, lot.z + it.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    const choose = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await press(at[0], at[1]);
    };
    await cdp.eval(`(() => {
      const w = tsui.scene.world, v = tsui.selected, K = Sims98.Skills;
      Object.assign(v.skill.xp, { cooking: K.LEVEL_XP[4] + 40, logic: K.LEVEL_XP[2] + 30, athletic: K.LEVEL_XP[1] + 10, charisma: 25 });
      Object.assign(v.skill.stats, { chessGames: 9, chessWins: 4, meals: 14, great: 2, workoutMins: 95, punchMins: 60 });
      Sims98.Food.learnRecipes(w, v);
      w.events.length = 0;
      tsui.stamp = '';
      return true;
    })()`);
    let [x, y] = await objectAt('stove', 0.9);
    await sleep(300);
    await press(x, y);
    if (!await cdp.eval('tsui.pie.open')) throw new Error('no menu on the stove');
    await shot('skills-stove');
    await choose('Приготовить…');
    if (await cdp.eval('tsui.pie.pills[0].option.label') !== 'Назад') throw new Error('the recipe list has no way back');
    const recipes = await cdp.eval('tsui.pie.all.map(o => o.label + (o.closed ? " (" + o.closed + ")" : ""))');
    if (!recipes.some(r => /Нужна готовка/.test(r)) || !recipes.some(r => /Завтрак готовят/.test(r))) throw new Error('the recipe list does not explain closed dishes: ' + recipes);
    await shot('skills-recipes');
    log.push('recipes at noon, cooking 4: ' + recipes.join('; '));
    const onPage = label => cdp.eval('tsui.pie.pills.some(q => q.option.label === ' + JSON.stringify(label) + ')');
    for (let k = 0; k < 5 && !await onPage('Плов'); k++) await choose('Ещё…');
    await shot('skills-recipes-more');
    await choose('Плов');
    await cdp.eval('tsui.game.setSpeed(2), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "cook_meal" && a.phase === "run" && a.step === 1); })()', 60000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.camera.setView({ zoom: 0 }), true');
    await sleep(900);
    await shot('skills-cooking');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), tsui.game.setSpeed(3), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "eat_meal" && a.phase === "run"); })()', 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    const meal = await cdp.eval('({ note: tsui.note ? tsui.note.text : null, kitchen: tsui.scene.world.lots[0].kitchen ? tsui.scene.world.lots[0].kitchen.meals.map(m => m.recipe + ":" + m.quality + "x" + m.left) : null })');
    if (!meal.note || !/Плов/.test(meal.note)) throw new Error('a cooked dish is not announced: ' + JSON.stringify(meal));
    await shot('skills-meal');
    log.push('meal: ' + JSON.stringify(meal));
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('!Sims98.Acts.busy(tsui.selected)', 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await key('KeyJ', 'j');
    if (!await cdp.eval('tsui.journal.open')) throw new Error('J does not open the journal');
    await moveTo(400, 30);
    await shot('skills-journal');
    const row = await cdp.eval('(() => { const j = tsui.journal, b = j.box(), i = j.rows().indexOf("logic"); return [b.x + 80, b.y + 70 + i * 30 + 12]; })()');
    await press(row[0], row[1]);
    if (await cdp.eval('tsui.journal.skill') !== 'logic') throw new Error('a click on a row does not pick the skill');
    await moveTo(400, 30);
    await shot('skills-journal-logic');
    const later = await cdp.eval('(() => { const j = tsui.journal, b = j.box(), i = j.rows().indexOf("guitar"); return [b.x + 80, b.y + 70 + i * 30 + 12]; })()');
    await press(later[0], later[1]);
    await moveTo(400, 30);
    await shot('skills-journal-later');
    const mark = await cdp.eval('(() => { const b = tsui.journal.box(); return [b.x + b.w + 6, b.y + 150]; })()');
    await press(mark[0], mark[1]);
    if (await cdp.eval('tsui.journal.tab') !== 'collections') throw new Error('the collections bookmark does not open collections');
    await key('Escape', 'Escape');
    if (await cdp.eval('tsui.journal.open')) throw new Error('Esc does not close the journal');
    const top = await cdp.eval('tsui.live.top');
    const skillTab = await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === "skills")');
    await press(459 + skillTab * 37 + 18, top - 10);
    if (await cdp.eval('tsui.live.tab') !== skillTab) throw new Error('the skills tab did not open');
    await moveTo(600, 200);
    await shot('skills-tab');
    const cellTip = await tipAt(540, top + 40);
    if (!cellTip || !/уровень/.test(cellTip.title || '')) throw new Error('a skill cell has no hint: ' + JSON.stringify(cellTip));
    await shot('skills-tab-tip');
    log.push('skill cell tip: ' + JSON.stringify([cellTip.title, cellTip.line]));
    await press(692 + 45, top + 14);
    if (!await cdp.eval('tsui.journal.open')) throw new Error('the journal button does not open the journal');
    await key('Escape', 'Escape');
    const away = async () => {
      await cdp.eval('(() => { const w = tsui.scene.world, lot = w.lots[0]; for (const s of w.family) if (s.age !== "toddler") Sims98.Acts.add(w, s, Sims98.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot }, true)); tsui.game.setSpeed(3); return true; })()');
      await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 60000);
      await cdp.eval('tsui.game.setSpeed(0), true');
    };
    await away();
    [x, y] = await objectAt('stove', 0.9);
    await cdp.eval('(() => { const w = tsui.scene.world, lot = w.lots[0]; Sims98.Food.ignite(w, lot, lot.house.items.find(i => i.kind === "m_stove"), null); tsui.game.setSpeed(1); return true; })()');
    await cdp.until('/Пожар/.test(tsui.note ? tsui.note.text : "")', 10000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await sleep(300);
    if (await cdp.eval('tsui.flames().length') !== 1) throw new Error('a fire shows no flames');
    const alarm = await cdp.eval('tsui.note ? tsui.note.text : null');
    if (!/Пожар/.test(alarm || '')) throw new Error('a fire is not announced: ' + alarm);
    await moveTo(700, 40);
    await shot('skills-fire');
    await press(x, y);
    const fireMenu = await cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label) : null');
    if (!fireMenu || fireMenu.join() !== 'Потушить') throw new Error('a burning stove offers more than putting out: ' + fireMenu);
    await choose('Потушить');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('tsui.scene.world.family.some(s => s.act && s.act.ad === "extinguish" && s.act.phase === "run")', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(700, 40);
    await shot('skills-extinguish');
    await cdp.eval('tsui.game.setSpeed(2), true');
    await cdp.until('!Sims98.Food.burning(tsui.scene.world.lots[0])', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    log.push('fire: ' + alarm + ' / ' + await cdp.eval('tsui.note ? tsui.note.text : null'));
    await cdp.until('!Sims98.Acts.busy(tsui.selected)', 30000).catch(() => null);
    await away();
    [x, y] = await objectAt('counter', 0.9);
    await cdp.eval('(() => { const w = tsui.scene.world, lot = w.lots[0], it = lot.house.items.find(i => i.kind === "m_counter"); Sims98.Food.ignite(w, lot, it, null); Sims98.Food.burnOut(w, lot, lot.kitchen.fires.find(f => lot.house.items[f.item] === it)); return true; })()');
    await sleep(500);
    await moveTo(700, 40);
    await shot('skills-burnt');
    await press(x, y);
    const sootMenu = await cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label + (o.closed ? " (x)" : "")) : null');
    if (!sootMenu || sootMenu[0] !== 'Отчистить от копоти') throw new Error('a burnt counter is not offered for cleaning: ' + sootMenu);
    await shot('skills-soot-menu');
    await choose('Отчистить от копоти');
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('!tsui.scene.world.lots[0].house.items.some(i => i.burnt)', 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(700, 40);
    await shot('skills-clean');
    log.push('soot: ' + sootMenu.join(', ') + ' / ' + await cdp.eval('tsui.note ? tsui.note.text : null'));
  },

  async craft(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.selectSim(tsui.scene.world.family[0]), true');
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const press = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(140);
    };
    const key = async (code, k) => {
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code, key: k, windowsVirtualKeyCode: k.length === 1 ? k.toUpperCase().charCodeAt(0) : 27 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k });
      await sleep(200);
    };
    const shot = async name => {
      await sleep(260);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const choose = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + '); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await press(at[0], at[1]);
    };
    const labels = () => cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label + (o.closed ? " (" + o.closed + ")" : "")) : null');
    const objectAt = (base, index, up) => cdp.eval(`(() => {
      const ui = tsui, lot = ui.scene.world.lots[0], h = lot.house, it = h.items.filter(i => Sims98.baseOf(i) === '${base}')[${index}];
      ui.follow = false;
      ui.floor = it.floor;
      ui.wallMode = 'cut';
      ui.autoCut = false;
      ui.camera.setView({ x: lot.x + it.x, z: lot.z + it.z });
      ui.stamp = '';
      const p = ui.camera.toScreen(lot.x + it.x, Sims98.House.floorY(h, it.floor) + ${up}, lot.z + it.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    const away = async () => {
      await cdp.eval('(() => { const w = tsui.scene.world, lot = w.lots[0]; for (const s of w.family) if (s.age !== "toddler") Sims98.Acts.add(w, s, Sims98.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot }, true)); tsui.game.setSpeed(3); return true; })()');
      await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 60000);
      await cdp.eval('tsui.game.setSpeed(0), true');
    };
    await away();
    await cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.lots[0], beds = lot.house.items.filter(i => Sims98.baseOf(i) === 'garden'), [v, a, , l] = w.family, K = Sims98.Skills;
      const plant = (bed, id, grow, extra) => { lot.garden = lot.garden || {}; lot.garden[lot.house.items.indexOf(bed)] = Object.assign({ id, q: 2, grow, water: 80, weeds: false, fed: 0, health: 100, fruit: false, harvests: 0, dead: false, planted: 0, by: v.id }, extra); Sims98.Garden.dress(w, lot, bed); };
      plant(beds[0], 'tomato', 1, { fruit: true });
      plant(beds[1], 'carrot', 0.6, { weeds: true });
      plant(beds[2], 'strawberry', 0.1, { water: 10 });
      plant(beds[3], 'lime', 1, { fruit: true });
      plant(beds[4], 'grapes', 0.5, { dead: true });
      Object.assign(v.skill.xp, { gardening: K.LEVEL_XP[3], fishing: K.LEVEL_XP[5], handiness: K.LEVEL_XP[2] });
      Object.assign(a.skill.xp, { painting: K.LEVEL_XP[4], guitar: K.LEVEL_XP[3] });
      l.skill.xp.writing = K.LEVEL_XP[3];
      const E = Sims98.Econ;
      v.bag.push(E.item('fish', 'bream', { q: 4, w: 2.8, v: 45, at: 1 }), E.item('fish', 'perch', { q: 2, w: 0.9, v: 8, at: 2 }), E.item('seed', 'carrot', { q: 1, v: 3, at: 3 }), E.item('seed', 'carrot', { q: 1, v: 3, at: 3 }), E.item('gem', 'amethyst', { v: 40, at: 4 }), E.item('butterfly', 'swallowtail', { v: 25, at: 5 }), E.item('oddity', 'bottle', { v: 15, at: 6 }));
      v.skill.stats.found = { amethyst: 1, ruby: 1, topaz: 2, garnet: 1, swallowtail: 1, peacock: 1, ladybird: 3, tomato: 1, carrot: 2 };
      w.events.length = 0;
      tsui.stamp = '';
      return true;
    })()`);
    let [x, y] = await objectAt('garden', 1, 0.4);
    await sleep(600);
    await moveTo(700, 40);
    await shot('craft-beds');
    await press(x, y);
    log.push('weedy bed: ' + (await labels()).join('; '));
    await shot('craft-bed-menu');
    await key('Escape', 'Escape');
    [x, y] = await objectAt('garden', 0, 0.4);
    await press(x, y);
    const ripe = await labels();
    if (!ripe || !ripe.includes('Собрать урожай')) throw new Error('a ripe bed offers no harvest: ' + ripe);
    await choose('Собрать урожай');
    await cdp.eval('tsui.game.setSpeed(2), true');
    await cdp.until('!Sims98.Acts.busy(tsui.selected)', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    const harvest = await cdp.eval('tsui.note ? tsui.note.text : null');
    if (!/Урожай/.test(harvest || '')) throw new Error('a harvest is not announced: ' + harvest);
    log.push('harvest: ' + harvest);
    await moveTo(700, 40);
    await shot('craft-harvest');
    const top = await cdp.eval('tsui.live.top');
    const bagTab = await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === "inventory")');
    await press(459 + bagTab * 37 + 18, top - 10);
    if (await cdp.eval('tsui.live.tab') !== bagTab) throw new Error('the inventory tab did not open');
    await moveTo(600, 200);
    await shot('craft-bag');
    const cellTip = await tipAt(470 + 17, top + 28 + 17);
    if (!cellTip || !cellTip.title) throw new Error('an inventory cell has no hint');
    await shot('craft-bag-tip');
    log.push('bag tip: ' + JSON.stringify([cellTip.title, cellTip.text]));
    await press(470 + 17, top + 28 + 17);
    const fishMenu = await labels();
    if (!fishMenu || !fishMenu.some(l => /аквариум/.test(l))) throw new Error('a fish offers no aquarium: ' + fishMenu);
    await shot('craft-bag-menu');
    log.push('fish menu: ' + fishMenu.join('; '));
    await choose('Запустить в аквариум');
    await cdp.eval('tsui.game.setSpeed(2), true');
    await cdp.until('!Sims98.Acts.busy(tsui.selected)', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    const tank = await cdp.eval('(() => { const lot = tsui.scene.world.lots[0], it = lot.house.items.find(i => Sims98.baseOf(i) === "aquarium"); return [it.kind, !!Sims98.Fish.tankOf(lot, it)]; })()');
    if (tank[0] !== 'm_aquarium_fish' || !tank[1]) throw new Error('the fish did not reach the aquarium: ' + tank);
    await away();
    [x, y] = await objectAt('aquarium', 0, 0.8);
    await sleep(800);
    await cdp.eval('tsui.camera.setView({ zoom: 0 }), true');
    await sleep(900);
    await moveTo(700, 40);
    await shot('craft-aquarium');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    [x, y] = await objectAt('pond', 0, 0.1);
    await away();
    [x, y] = await objectAt('pond', 0, 0.1);
    await press(x, y);
    const pondMenu = await labels();
    log.push('pond: ' + pondMenu.join('; '));
    await shot('craft-pond-menu');
    await choose('Рыбачить');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "fish_pond" && a.phase === "run"); })()', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await sleep(400);
    if (!await cdp.eval('tsui.tackle().length')) throw new Error('fishing shows no rod');
    await moveTo(700, 40);
    await shot('craft-fishing');
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('/Улов/.test(tsui.note ? tsui.note.text : "")', 90000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    log.push('catch: ' + await cdp.eval('tsui.note.text'));
    await shot('craft-catch');
    await cdp.eval('(() => { const w = tsui.scene.world; Sims98.Acts.dropCurrent(w, tsui.selected); tsui.selected.queue.length = 0; return true; })()');
    await away();
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[1]), true');
    [x, y] = await objectAt('easel', 0, 1.1);
    await press(x, y);
    await choose('Начать картину…');
    await choose('Средняя…');
    const styles = await labels();
    log.push('styles: ' + styles.join('; '));
    await shot('craft-easel-menu');
    await choose('Портрет');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "paint_canvas" && a.phase === "run"); })()', 60000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await objectAt('easel', 0, 1.1);
    await sleep(900);
    await shot('craft-painting');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), (() => { const w = tsui.scene.world; Sims98.Acts.dropCurrent(w, tsui.selected); tsui.selected.queue.length = 0; return true; })()');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[3]), true');
    [x, y] = await objectAt('computer', 0, 0.9);
    await press(x, y);
    await choose('Писать роман…');
    const genres = await labels();
    log.push('genres: ' + genres.join('; '));
    await shot('craft-novel-menu');
    await key('Escape', 'Escape');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[1]), tsui.setFloor(0), true');
    await away();
    const self = await cdp.eval('(() => { const s = tsui.selected, p = tsui.camera.toScreen(s.x, s.y + 1.2, s.z); tsui.follow = false; tsui.camera.setView({ x: s.x, z: s.z }); tsui.stamp = ""; return true; })()');
    await sleep(500);
    const at = await cdp.eval('(() => { const s = tsui.selected, p = tsui.camera.toScreen(s.x, s.y + 1.2, s.z); return [Math.round(p[0]), Math.round(p[1])]; })()');
    await press(at[0], at[1]);
    const own = await labels();
    if (!own || !own.includes('Играть на гитаре')) throw new Error('the own menu has no guitar: ' + own);
    await choose('Играть на гитаре');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('(() => { const a = tsui.selected.act; return !!(a && a.ad === "guitar_play" && a.phase === "run"); })()', 30000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.camera.setView({ zoom: 0 }), true');
    await sleep(900);
    await shot('craft-guitar');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), (() => { const w = tsui.scene.world; Sims98.Acts.dropCurrent(w, tsui.selected); tsui.selected.queue.length = 0; return true; })()');
    await cdp.eval('tsui.selectSim(tsui.scene.world.family[0]), true');
    await key('KeyJ', 'j');
    const mark = await cdp.eval('(() => { const b = tsui.journal.box(); return [b.x + b.w + 6, b.y + 150]; })()');
    await press(mark[0], mark[1]);
    if (await cdp.eval('tsui.journal.tab') !== 'collections') throw new Error('the collections bookmark does not open');
    await moveTo(400, 30);
    await shot('craft-collections');
    const row = await cdp.eval('(() => { const j = tsui.journal, b = j.box(), i = j.rows().indexOf("butterflies"); return [b.x + 80, b.y + 70 + i * 30 + 12]; })()');
    await press(row[0], row[1]);
    await moveTo(400, 30);
    await shot('craft-collections-butterflies');
    await key('Escape', 'Escape');
    const glint = await cdp.eval(`(() => {
      const w = tsui.scene.world, spots = Sims98.Collect.shown(w), lot = w.lots[0];
      const spot = spots.slice().sort((p, q) => Math.hypot(p.x - lot.x, p.z - lot.z) - Math.hypot(q.x - lot.x, q.z - lot.z))[0];
      tsui.follow = false;
      tsui.camera.setView({ x: spot.x, z: spot.z, zoom: 1 });
      tsui.stamp = '';
      return [spot.x, spot.z, Sims98.Collect.findOf(spot).name];
    })()`);
    await sleep(700);
    await moveTo(700, 40);
    const glints = await cdp.eval('tsui.glints().length');
    if (!glints) throw new Error('no glints near a find');
    await shot('craft-glints');
    const spotAt = await cdp.eval('(() => { const p = tsui.camera.toScreen(' + glint[0] + ', Sims98.Terrain.heightAt(tsui.scene.world.terrain, ' + glint[0] + ', ' + glint[1] + '), ' + glint[1] + '); return [Math.round(p[0]), Math.round(p[1])]; })()');
    await press(spotAt[0], spotAt[1]);
    const findMenu = await labels();
    log.push('find ' + glint[2] + ': ' + findMenu.join('; '));
    if (!findMenu.some(l => /^(Подобрать|Поймать)/.test(l))) throw new Error('a find is not offered: ' + findMenu);
    await shot('craft-find-menu');
    await key('Escape', 'Escape');
    const shop = await cdp.eval(`(() => {
      const w = tsui.scene.world, shop = w.lots.find(l => l.kind === 'shop');
      tsui.camera.setView({ x: shop.x + shop.w / 2, z: shop.z + shop.d / 2, zoom: 1 });
      tsui.stamp = '';
      const p = tsui.camera.toScreen(shop.x + shop.w / 2, shop.base + 2, shop.z + shop.d / 2);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    await sleep(700);
    await press(shop[0], shop[1]);
    const shopMenu = await labels();
    log.push('shop: ' + shopMenu.join('; '));
    if (!shopMenu.some(l => /^Сдать улов/.test(l))) throw new Error('the shop takes nothing: ' + shopMenu);
    await shot('craft-shop-menu');
    await choose('Сдать улов, урожай и находки');
    await cdp.eval('tsui.game.setSpeed(3), true');
    await cdp.until('/сдаёт в магазин/.test(tsui.note ? tsui.note.text : "")', 120000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    log.push('sale: ' + await cdp.eval('tsui.note.text') + ', funds ' + await cdp.eval('tsui.scene.world.funds'));
    await moveTo(700, 40);
    await shot('craft-sale');
    await cdp.eval('(() => { const w = tsui.scene.world, v = tsui.selected, lot = w.lots[0]; v.inside = null; Object.assign(v, { x: lot.doorOut[0], z: lot.doorOut[1], lot, floor: 0, state: "idle", path: null, order: null }); v.y = Sims98.Sim.groundY(w, 0, lot, v.x, v.z); return true; })()');
    [x, y] = await objectAt('stove', 0, 0.9);
    await press(x, y);
    await choose('Улучшить…');
    log.push('upgrades: ' + (await labels()).join('; '));
    await shot('craft-upgrade-menu');
    await key('Escape', 'Escape');
  },

  async work(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.selectSim(tsui.scene.world.family[0]), true');
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const press = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(140);
    };
    const shot = async name => {
      await sleep(260);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const choose = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + ' || q.option.label.startsWith(' + JSON.stringify(label) + ')); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await press(at[0], at[1]);
    };
    const labels = () => cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label + (o.closed ? " (" + o.closed + ")" : "")) : null');
    const Y = await cdp.eval('tsui.live.top');
    const tab = async id => [459 + await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === ' + JSON.stringify(id) + ')') * 37 + 18, Y - 12];
    const lotAt = id => cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.lots.find(l => l.id === '${id}');
      tsui.follow = false;
      tsui.camera.setView({ x: lot.x + lot.w / 2, z: lot.z + lot.d / 2, zoom: 1 });
      tsui.stamp = '';
      const p = tsui.camera.toScreen(lot.x + lot.w / 2, lot.base + 2, lot.z + lot.d / 2);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    const run = async (test, limit) => {
      await cdp.eval('tsui.game.setSpeed(3), true');
      await cdp.until(test, limit || 120000);
      await cdp.eval('tsui.game.setSpeed(0), true');
    };

    const office = await lotAt('office');
    await sleep(700);
    await press(office[0], office[1]);
    const doorMenu = await labels();
    log.push('office door: ' + doorMenu.join('; '));
    if (!doorMenu.some(l => l.startsWith('Устроиться'))) throw new Error('the office offers no jobs: ' + doorMenu);
    await choose('Устроиться');
    log.push('office jobs: ' + (await labels()).join('; '));
    await shot('work-office-jobs');
    await choose('Бизнес');
    await run('!!tsui.selected.job', 180000);
    log.push('joined: ' + await cdp.eval('Sims98.Jobs.describe(tsui.scene.world, tsui.selected)'));
    const [tx, ty] = await tab('job');
    await press(tx, ty);
    await moveTo(700, 40);
    await shot('work-tab-new');
    const perfTip = await tipAt(470 + 140, Y + 54);
    log.push('perf tip: ' + JSON.stringify(perfTip));
    const reqTip = await tipAt(470 + 120, Y + 70);
    log.push('requirement tip: ' + JSON.stringify(reqTip));
    const buttonTip = await tipAt(456 + 14 + 50, Y + 104);
    log.push('ask tip: ' + JSON.stringify(buttonTip));
    await shot('work-tab-tip');

    await cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.lots[0];
      w.family.forEach((s, i) => { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; s.inside = null; Object.assign(s, { x: lot.doorOut[0] + (i % 3) * 0.6, z: lot.doorOut[1] + Math.floor(i / 3) * 0.6, lot, floor: 0, state: 'idle', path: null, order: null }); s.y = Sims98.Sim.groundY(w, 0, lot, s.x, s.z); });
      w.day = 2;
      tsui.setHour(7 + 20 / 60);
      tsui.follow = true;
      tsui.centerOnSim();
      return true;
    })()`);
    await run('!!tsui.selected.car && tsui.selected.ride === "carpool"', 120000);
    log.push('car pool: ' + await cdp.eval('Sims98.timeText(tsui.scene.world.clock)'));
    await cdp.eval('tsui.centerOnSim(), tsui.stamp = "", true');
    await sleep(500);
    await shot('work-carpool');
    const kid = await cdp.eval('tsui.scene.world.family.findIndex(s => s.car && s.ride === "bus")');
    if (kid >= 0) {
      await cdp.eval('(() => { const s = tsui.scene.world.family[' + kid + ']; tsui.follow = false; tsui.camera.setView({ x: s.car.x, z: s.car.z }); tsui.stamp = ""; return true; })()');
      await sleep(500);
      await shot('work-bus');
    }
    log.push('bus seen: ' + (kid >= 0));
    await run('Sims98.Jobs.atWork(tsui.scene.world, tsui.selected)', 120000);
    log.push('at work: ' + await cdp.eval('Sims98.timeText(tsui.selected.job.at)') + ', late ' + await cdp.eval('tsui.selected.job.late'));
    await cdp.eval('(() => { const w = tsui.scene.world; Sims98.Town.setClock(w, 11 * 60); tsui.setHour(11); return true; })()');
    await run('tsui.scene.world.clock >= 11 * 60 + 30', 60000);
    await lotAt('office');
    await moveTo(700, 40);
    await sleep(400);
    await shot('work-rabbit');
    const rabbit = await cdp.eval('(() => { const r = Sims98.Jobs.status(tsui.scene.world, tsui.selected); return r ? { text: r.text, inside: r.inside.map(o => o.name), tone: r.tone } : null; })()');
    log.push('rabbit: ' + JSON.stringify(rabbit));
    if (!rabbit) throw new Error('no rabbit hole panel');
    const ry = await cdp.eval('tsui.live.layer.items.find(i => i.x === 150 && i.parts).y') - 54;
    const toneTip = await tipAt(150 + 6 + 30 + 14, ry + 54 + 13);
    log.push('tone tip: ' + JSON.stringify(toneTip));
    await shot('work-tone-tip');
    await press(150 + 6 + 30 + 14, ry + 54 + 13);
    log.push('tone now: ' + await cdp.eval('tsui.selected.job.tone'));
    const exitTip = await tipAt(150 + 286 - 6 - 31, ry + 54 + 13);
    log.push('exit tip: ' + JSON.stringify(exitTip));
    await press(150 + 286 - 6 - 31, ry + 54 + 13);
    await moveTo(700, 40);
    await shot('work-exit-ask');
    await cdp.eval('tsui.live.leaving = 0, tsui.stamp = "", true');
    await press(tx, ty);
    await moveTo(700, 40);
    await shot('work-tab-shift');
    const [rx, rty] = await tab('relations');
    await press(rx, rty);
    const relTip = await tipAt(470 + 60, Y + 26 + 12);
    log.push('relations tip: ' + JSON.stringify(relTip));
    await shot('work-relations');
    await cdp.eval('tsui.map.toggle(), true');
    await sleep(600);
    await shot('work-map');
    await cdp.eval('tsui.map.toggle(), true');
    await press(tx, ty);
    await cdp.eval('(() => { tsui.selected.job.perf = 99; return true; })()');
    await run('tsui.scene.world.clock >= 17 * 60 + 3', 200000);
    log.push('after shift: ' + JSON.stringify(await cdp.eval('({ job: tsui.selected.job, toast: tsui.note ? tsui.note.text : null, funds: tsui.scene.world.funds })')));
    await moveTo(700, 40);
    await shot('work-promoted');
    const reqAt = await cdp.eval('(() => { const s = tsui.live.reqSlots(tsui.selected.job)[0]; return s ? [Math.round(s.x + s.w / 2), tsui.live.top + 70] : null; })()');
    if (reqAt) {
      await press(reqAt[0], reqAt[1]);
      await sleep(500);
      log.push('point: ' + JSON.stringify(await cdp.eval('tsui.point')) + ', toast ' + await cdp.eval('tsui.note ? tsui.note.text : null'));
      await moveTo(700, 40);
      await shot('work-point');
    }
    await cdp.eval('(() => { const w = tsui.scene.world, kid = w.family.find(s => s.age === "child"); tsui.selectSim(kid); tsui.centerOnSim(); return true; })()');
    await press(tx, ty);
    await moveTo(700, 40);
    await shot('work-school-tab');
    log.push('school: ' + JSON.stringify(await cdp.eval('tsui.selected.school')));
  },

  async chance(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('(() => { const w = tsui.scene.world; tsui.game.freeWill = 0; tsui.settings.debug = false; tsui.setView(2); tsui.setHour(12); tsui.camera.setView({ rot: 0, zoom: 1 }); for (const s of w.family) { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; } Sims98.Opps.of(w).next = 1e9; Sims98.Services.of(w).burglar = 1e9; tsui.game.setSpeed(1); return true; })()');
    await cdp.until('tsui.scene.world.family.every(s => !Sims98.Acts.busy(s))', 20000);
    await cdp.eval('tsui.game.setSpeed(0), tsui.selectSim(tsui.scene.world.family[0]), true');
    const moveTo = async (x, y) => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await sleep(40);
    };
    const press = async (x, y) => {
      await moveTo(x, y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, clickCount: 1, button: 'left', buttons: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, clickCount: 1, button: 'left', buttons: 0 });
      await sleep(140);
    };
    const key = async (code, k) => {
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code, key: k, windowsVirtualKeyCode: k.length === 1 ? k.toUpperCase().charCodeAt(0) : 27 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k });
      await sleep(200);
    };
    const shot = async name => {
      await sleep(260);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    const tipAt = async (x, y) => {
      await moveTo(x, y);
      await sleep(350);
      return cdp.eval('(() => { const L = tsui.live.layer; return L.hover && L.hover.tip ? L.tip(performance.now(), 0) : null; })()');
    };
    const choose = async label => {
      const at = await cdp.eval('(() => { const p = tsui.pie.pills.find(q => q.option.label === ' + JSON.stringify(label) + ' || q.option.label.startsWith(' + JSON.stringify(label) + ')); return p ? [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)] : null; })()');
      if (!at) throw new Error('no menu item: ' + label + ' in ' + await cdp.eval('JSON.stringify(tsui.pie.pills.map(q => q.option.label))'));
      await press(at[0], at[1]);
    };
    const labels = () => cdp.eval('tsui.pie.open ? tsui.pie.all.map(o => o.label + (o.closed ? " (" + o.closed + ")" : "")) : null');
    const Y = await cdp.eval('tsui.live.top');
    const tab = async id => [459 + await cdp.eval('Sims98.LiveView.TABS.findIndex(t => t.id === ' + JSON.stringify(id) + ')') * 37 + 18, Y - 12];
    const run = async (test, limit) => {
      await cdp.eval('tsui.game.setSpeed(3), true');
      await cdp.until(test, limit || 120000);
      await cdp.eval('tsui.game.setSpeed(0), true');
    };
    const itemAt = (base, up) => cdp.eval(`(() => {
      const ui = tsui, lot = ui.scene.world.family[0].home, h = lot.house, it = h.items.find(i => Sims98.baseOf(i) === '${base}' && !i.gone);
      ui.follow = false;
      ui.floor = it.floor || 0;
      ui.wallMode = 'cut';
      ui.autoCut = false;
      ui.camera.setView({ x: lot.x + it.x, z: lot.z + it.z, zoom: 1 });
      ui.stamp = '';
      const p = ui.camera.toScreen(lot.x + it.x, Sims98.House.floorY(h, it.floor || 0) + ${up}, lot.z + it.z);
      return [Math.round(p[0]), Math.round(p[1])];
    })()`);
    const askYes = () => cdp.eval('(() => { const b = tsui.askBox(); return [b.x + 16 + 60, b.y + b.h - 22]; })()');
    const services = () => cdp.eval('JSON.stringify(tsui.scene.world.sims.filter(o => o.duty).map(o => o.duty.kind + ":" + o.duty.phase + (o.car ? "/" + o.ride : "")))');

    await cdp.eval(`(() => {
      const w = tsui.scene.world, s = Sims98.Services.of(w), fam = w.family[0].surname || w.family[0].name;
      w.day = 2;
      s.mail.bills.push({ amount: Sims98.Econ.billAmount(w), day: 1, red: 0 }, { amount: 140, day: 1, red: 0, from: 'Мастер' });
      s.mail.letters.push({ kind: 'refund', amount: 35 });
      s.mail.fresh = 2;
      s.paper = w.day;
      Sims98.News.add(w, 'Полиция задержала вора прямо в доме семьи ' + fam + '. Сигнализация сработала вовремя.');
      Sims98.News.add(w, 'Пожарные потушили пожар в доме на Кленовой улице. Никто не пострадал.');
      Sims98.News.add(w, 'В парке открылся сезон рыбалки. Говорят, в пруду видели золотую рыбку.');
      return true;
    })()`);
    const box = await itemAt('mailbox', 0.5);
    await sleep(600);
    await moveTo(700, 40);
    await shot('chance-mailbox');
    await press(box[0], box[1]);
    const mailMenu = await labels();
    log.push('mailbox: ' + JSON.stringify(mailMenu));
    if (!mailMenu || !mailMenu.some(l => l.startsWith('Оплатить счета'))) throw new Error('the mailbox offers no bills: ' + mailMenu);
    await shot('chance-mailbox-menu');
    await choose('Проверить почту');
    await run('!tsui.scene.world.service.mail.letters.length', 120000);
    log.push('mail read: ' + await cdp.eval('tsui.note ? tsui.note.text : null') + ', funds ' + await cdp.eval('tsui.scene.world.funds'));
    await moveTo(700, 40);
    await shot('chance-mail-read');
    await press(box[0], box[1]);
    await choose('Почитать газету');
    await run('tsui.news.open', 120000);
    await moveTo(700, 40);
    await shot('chance-paper');
    const vac = await cdp.eval('(() => { const t = tsui.news.targets()[0]; return [Math.round(t.x + t.w / 2), Math.round(t.y + t.h / 2)]; })()');
    await moveTo(vac[0], vac[1]);
    await sleep(300);
    await shot('chance-paper-hover');
    const cut = await cdp.eval('(() => { const t = tsui.news.targets().find(t => t.kind === "coupon"); return [Math.round(t.x + t.w / 2), Math.round(t.y + t.h / 2)]; })()');
    await press(cut[0], cut[1]);
    log.push('coupons: ' + await cdp.eval('JSON.stringify(tsui.scene.world.coupons)'));
    await shot('chance-paper-coupon');
    await key('Escape', 'Escape');
    if (await cdp.eval('tsui.news.open')) throw new Error('Escape does not close the paper');

    const plateTip = await tipAt(30 + 43, Y + 92 + 9);
    log.push('money tip: ' + JSON.stringify(plateTip));
    await press(30 + 43, Y + 92 + 9);
    if (!await cdp.eval('tsui.live.cardOpen')) throw new Error('the money plate opens no card');
    await moveTo(700, 40);
    await shot('chance-card');
    const pay = await cdp.eval('(() => { const p = tsui.live.cardPay(); return [Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)]; })()');
    await moveTo(pay[0], pay[1]);
    await shot('chance-card-hover');
    await press(pay[0], pay[1]);
    log.push('after pay: due ' + await cdp.eval('Sims98.Services.due(tsui.scene.world)') + ', funds ' + await cdp.eval('tsui.scene.world.funds'));
    await moveTo(700, 40);
    await shot('chance-card-paid');
    await key('Escape', 'Escape');

    const offered = await cdp.eval(`(() => {
      const w = tsui.scene.world, sim = tsui.selected, row = Sims98.Opps.pick(w, sim, ['special']) || Sims98.Opps.pick(w, sim);
      if (!row) return null;
      Sims98.Opps.offer(w, sim, row, false);
      return row.id;
    })()`);
    log.push('offer: ' + offered);
    if (!offered) throw new Error('no opportunity fits');
    await cdp.eval('tsui.game.setSpeed(1), true');
    await cdp.until('!!tsui.ask', 10000);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(700, 40);
    await shot('chance-call');
    const yes = await askYes();
    await press(yes[0], yes[1]);
    log.push('active: ' + await cdp.eval('JSON.stringify(Sims98.Opps.of(tsui.scene.world).active)'));
    const [cx, cy] = await tab('chance');
    await press(cx, cy);
    await moveTo(700, 40);
    await shot('chance-tab');
    const rowTip = await tipAt(456 + 120, Y + 22 + 14);
    log.push('opp tip: ' + JSON.stringify(rowTip));
    await shot('chance-tab-tip');

    await cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.family[0].home, toilet = lot.house.items.find(i => Sims98.baseOf(i) === 'toilet' && !i.gone), sink = lot.house.items.find(i => Sims98.baseOf(i) === 'bath_sink' && !i.gone), tv = lot.house.items.find(i => Sims98.baseOf(i) === 'tv' && !i.gone);
      Sims98.Upkeep.breakItem(w, lot, toilet);
      if (sink) Sims98.Upkeep.breakItem(w, lot, sink);
      if (tv) Sims98.Upkeep.breakItem(w, lot, tv);
      Sims98.Upkeep.addPuddle(w, lot, lot.x + toilet.x + 0.9, lot.z + toilet.z, toilet.floor || 0, lot.house.items.indexOf(toilet));
      Sims98.Upkeep.addPuddle(w, lot, lot.x + toilet.x + 0.4, lot.z + toilet.z + 0.7, toilet.floor || 0, lot.house.items.indexOf(toilet));
      const u = Sims98.Upkeep.of(lot);
      u.dishes = 3;
      return true;
    })()`);
    const toilet = await itemAt('toilet', 0.5);
    await sleep(600);
    await moveTo(700, 40);
    await shot('chance-broken');
    await press(toilet[0], toilet[1]);
    const brokenMenu = await labels();
    log.push('toilet: ' + JSON.stringify(brokenMenu));
    if (!brokenMenu || !brokenMenu.some(l => l.startsWith('Починить'))) throw new Error('the clogged toilet offers no repair: ' + brokenMenu);
    await shot('chance-repair-menu');
    await key('Escape', 'Escape');

    await cdp.eval('tsui.follow = true, tsui.centerOnSim(), tsui.stamp = "", true');
    await sleep(500);
    const me = await cdp.eval('(() => { const s = tsui.selected, p = tsui.camera.toScreen(s.x, s.y + 0.9, s.z); return [Math.round(p[0]), Math.round(p[1])]; })()');
    await press(me[0], me[1]);
    await choose('Службы');
    const phone = await labels();
    log.push('phone: ' + JSON.stringify(phone));
    await shot('chance-phone');
    await choose('Вызвать мастера');
    await run('Sims98.Services.onDuty(tsui.scene.world, "repair").some(o => o.duty.phase === "work" && o.lot === tsui.scene.world.family[0].home)', 200000);
    log.push('repair: ' + await services());
    await cdp.eval('(() => { const r = Sims98.Services.onDuty(tsui.scene.world, "repair")[0]; tsui.follow = false; tsui.camera.setView({ x: r.x, z: r.z }); tsui.stamp = ""; return true; })()');
    await sleep(500);
    await shot('chance-repairman');
    await run('!Sims98.Services.onDuty(tsui.scene.world, "repair").some(o => o.duty.phase === "work")', 200000);
    log.push('after repair: broken ' + await cdp.eval('Sims98.Upkeep.brokenItems(tsui.scene.world.family[0].home).length') + ', funds ' + await cdp.eval('tsui.scene.world.funds') + ', note ' + await cdp.eval('tsui.note ? tsui.note.text : null'));

    await cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.family[0].home;
      w.family.forEach((s, i) => { Sims98.Acts.dropCurrent(w, s); s.queue.length = 0; });
      Sims98.Town.setClock(w, 2 * 60);
      tsui.setHour(2);
      Sims98.Services.sendBurglar(w);
      tsui.follow = false;
      tsui.camera.setView({ x: lot.x + lot.w / 2, z: lot.z + lot.d / 2, zoom: 1 });
      tsui.stamp = '';
      return true;
    })()`);
    await run('Sims98.Services.onDuty(tsui.scene.world, "burglar").some(o => o.duty.phase !== "go")', 200000);
    log.push('burglar: ' + await services() + ', ' + await cdp.eval('Sims98.timeText(tsui.scene.world.clock)'));
    await cdp.eval('(() => { const b = Sims98.Services.onDuty(tsui.scene.world, "burglar")[0]; tsui.camera.setView({ x: b.x, z: b.z }); tsui.floor = b.floor; tsui.stamp = ""; return true; })()');
    await sleep(500);
    await shot('chance-burglar');
    await run('Sims98.Services.onDuty(tsui.scene.world, "police").some(o => o.duty.phase === "work")', 200000);
    log.push('police: ' + await services());
    await cdp.eval('(() => { const p = Sims98.Services.onDuty(tsui.scene.world, "police")[0]; tsui.camera.setView({ x: p.x, z: p.z }); tsui.stamp = ""; return true; })()');
    await sleep(500);
    await shot('chance-police');
    await run('!Sims98.Services.onDuty(tsui.scene.world, "burglar").some(o => o.duty.phase !== "leave")', 200000);
    log.push('arrest: ' + await cdp.eval('tsui.note ? tsui.note.text : null'));

    await cdp.eval(`(() => {
      const w = tsui.scene.world, lot = w.family[0].home, stove = lot.house.items.find(i => Sims98.baseOf(i) === 'stove' && !i.gone), away = w.lots.find(l => l.kind === 'home' && l !== lot);
      for (const s of w.family) {
        Sims98.Acts.dropCurrent(w, s);
        s.queue.length = 0;
        Object.assign(s, { x: away.doorOut[0], z: away.doorOut[1], lot: null, inside: away, act: null, order: null, path: null, trip: null, state: 'idle' });
      }
      Sims98.Town.setClock(w, 18 * 60);
      tsui.setHour(18);
      Sims98.Food.ignite(w, lot, stove, null);
      return true;
    })()`);
    const stove = await itemAt('stove', 0.6);
    await cdp.eval('tsui.game.setSpeed(1), true');
    await sleep(1500);
    await cdp.eval('tsui.game.setSpeed(0), true');
    await moveTo(700, 40);
    await shot('chance-fire');
    log.push('fire: ' + await services() + ' at ' + JSON.stringify(stove));
    await run('Sims98.Services.onDuty(tsui.scene.world, "fire").some(o => o.duty.phase !== "go")', 200000);
    await cdp.eval('(() => { const f = Sims98.Services.onDuty(tsui.scene.world, "fire")[0]; tsui.camera.setView({ x: f.x, z: f.z }); tsui.floor = f.floor; tsui.stamp = ""; return true; })()');
    await sleep(500);
    await shot('chance-firefighters');
    await run('!Sims98.Food.burning(tsui.scene.world.family[0].home)', 200000);
    log.push('fire out: ' + await cdp.eval('tsui.note ? tsui.note.text : null'));

    await cdp.eval(`(() => {
      const w = tsui.scene.world, sim = tsui.selected, E = Sims98.Econ;
      E.give(w, sim, E.item('oddity', 'bottle'));
      E.give(w, sim, E.item('oddity', 'key'));
      E.give(w, sim, E.item('produce', 'carrot', { q: 3 }));
      E.store(w, sim, 0);
      E.store(w, sim, 0);
      return true;
    })()`);
    const [ix, iy] = await tab('inventory');
    await press(ix, iy);
    await press(456 + 336 - 2 * (52 + 2) - 50 + 54 + 26, Y + 11);
    await moveTo(700, 40);
    await shot('chance-family-bag');
    log.push('family bag: ' + await cdp.eval('JSON.stringify(Sims98.Econ.familyBag(tsui.scene.world))'));
    await cdp.eval('tsui.map.toggle(), true');
    await sleep(600);
    await shot('chance-map');
    await cdp.eval('tsui.map.toggle(), true');
    log.push('news: ' + await cdp.eval('JSON.stringify(Sims98.News.list(tsui.scene.world).map(n => n.text))'));
  },

  async night(cdp, out, log) {
    await cdp.open('/sims98.html');
    await cdp.until('window.tsui && (tsui.ready || tsui.loadError)', 120000);
    const failed = await cdp.eval('tsui.loadError ? String(tsui.loadError.message) : null');
    if (failed) throw new Error('load failed: ' + failed);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    await cdp.eval('tsui.settings.debug = false, tsui.stamp = "", tsui.setView(1), tsui.setHour(23), true');
    for (const [name, x, z, zoom] of [['box', 375, 271, 2], ['street', 345, 275, 3], ['centre', 300, 275, 3], ['district', 320, 300, 4]]) {
      await cdp.eval('tsui.camera.setView({ zoom: ' + zoom + ', x: ' + x + ', z: ' + z + ' }), tsui.setHour(23), true');
      await sleep(500);
      await cdp.shot(path.join(out, 'night-' + name + '.png'), '#game');
    }
    const lit = await cdp.eval('(() => { const built = tsui.scene.world.lots.filter(l => l.kind !== "park"); return { built: built.length, lit: built.filter(l => l.house.lamps.some(q => q.on)).length }; })()');
    log.push('houses with lamps on at night: ' + JSON.stringify(lit));
    if (lit.lit !== lit.built) throw new Error('a house stays dark at night');
  },
  async bench(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    const lot = await cdp.eval('(() => { const l = tsui.scene.lots[20]; return { x: l.x + 15, z: l.z + 15 }; })()');
    const show = async (name, view) => {
      await cdp.eval(`(() => { tsui.camera.setView(${JSON.stringify(view)}); tsui.dirty = true; return true; })()`);
      await sleep(700);
      const st = await cdp.eval('({ ...tsui.render.stats, zoom: tsui.camera.zoom, rot: tsui.camera.rot })');
      log.push(name + ': ' + JSON.stringify(st));
      if (!st.sprites) throw new Error('no sprites in ' + name);
      await cdp.shot(path.join(out, name + '.png'), '#game');
    };
    for (let zoom = 0; zoom < 5; zoom++) await show('zoom-' + zoom, { zoom, rot: 0, ...lot });
    for (let rot = 1; rot < 4; rot++) await show('rot-' + rot, { zoom: 1, rot, ...lot });
    await show('hills', { zoom: 2, rot: 0, x: 300, z: 100 });
    await show('harbour', { zoom: 2, rot: 0, x: 300, z: 540 });
    await show('whole', { zoom: 4, rot: 0, x: 320, z: 320 });
    await cdp.eval('tsui.setting("dither", false), tsui.dirty = true, true');
    await show('zoom-1-32bit', { zoom: 1, rot: 0, ...lot });
    await cdp.eval('tsui.setting("dither", true), true');
  },
  async depth(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    const r = await cdp.eval(`(() => {
      const ui = tsui, S = Sims98, t = ui.scene.terrain, gl = ui.gl;
      let X = 0, Z = 0;
      for (let z = 200; z < 420 && !X; z += 4) {
        for (let x = 200; x < 450 && !X; x += 4) {
          let flat = true;
          for (let i = -8; i <= 8 && flat; i += 2) {
            for (let j = -8; j <= 8 && flat; j += 2) {
              const p = S.Terrain.paintAt(t, x + i, z + j);
              if ((p !== S.PAINT.grass && p !== S.PAINT.meadow) || Math.abs(S.Terrain.heightAt(t, x + i, z + j) - S.Terrain.heightAt(t, x, z)) > 0.5) flat = false;
            }
          }
          if (flat) { X = x; Z = z; }
        }
      }
      const items = [];
      for (let i = -4; i <= 4; i++) items.push(['wall', X + i + 0.5, Z, 0]);
      items.push(['table', X + 3, Z + 3.5, 0], ['lamp', X - 3.5, Z + 3.5, 0], ['fridge', X + 0.5, Z - 3.5, 0], ['sofa', X - 2.5, Z - 3.5, 0]);
      const scene = S.Dummy.pack(t, [], items, { rs: 5 });
      ui.scene = scene;
      ui.render.setScene(scene, ui.render.atlas);
      ui.update = () => {};
      const y = S.Terrain.heightAt(t, X, Z), w = scene.walkers;
      for (const q of w) { q.x = 20; q.z = 300; q.y = -50; q.tone = 0; }
      const px = new Uint8Array(4);
      const read = (cam, wx, wy, wz) => {
        const p = cam.toScreen(wx, wy, wz);
        gl.readPixels(Math.floor(p[0]), cam.h - 1 - Math.floor(p[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px[0] - px[2];
      };
      const rows = [];
      for (let rot = 0; rot < 4; rot++) {
        for (let zoom = 0; zoom < 3; zoom++) {
          const c = ui.camera;
          c.setView({ zoom, rot, x: X, z: Z });
          const side = c.depthAt(X, y, Z + 0.6) < c.depthAt(X, y, Z) ? 1 : -1;
          w[0].x = X; w[0].z = Z + side * 0.6; w[0].y = y;
          w[1].x = X; w[1].z = Z - side * 0.6; w[1].y = y;
          ui.draw();
          const front = read(c, X, y + 1, Z + side * 0.6), back = read(c, X, y + 1, Z - side * 0.6);
          rows.push({ rot, zoom, front, back, ok: front > 60 && back < 60 });
        }
      }
      ui.camera.setView({ zoom: 0, rot: 0, x: X, z: Z });
      w[0].x = X; w[0].z = Z + 0.6;
      w[1].x = X; w[1].z = Z - 0.6;
      w[2].x = X + 3; w[2].z = Z + 4.4; w[2].y = y;
      w[3].x = X + 3; w[3].z = Z + 2.6; w[3].y = y;
      return { X, Z, rows };
    })()`);
    log.push('depth at ' + r.X + ',' + r.Z + ': ' + JSON.stringify(r.rows.map(q => [q.rot, q.zoom, q.front, q.back])));
    if (!r.X) throw new Error('no flat ground for the depth scene');
    if (r.rows.some(q => !q.ok)) throw new Error('a walker is drawn wrongly against the wall');
    await sleep(400);
    await cdp.shot(path.join(out, 'depth-near.png'), '#game');
    await cdp.eval('tsui.camera.setView({ zoom: 1 }), true');
    await sleep(300);
    await cdp.shot(path.join(out, 'depth-middle.png'), '#game');
  },
  async lost(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    await place(cdp, 800, 600);
    await cdp.eval("window.tsLose = tsui.gl.getExtension('WEBGL_lose_context'), tsLose.loseContext(), true");
    await cdp.until('!tsui.ready');
    await sleep(200);
    await cdp.eval('tsLose.restoreContext(), true');
    await cdp.until('tsui.ready', 120000);
    const before = await cdp.eval('tsui.frames');
    await cdp.until('tsui.frames > ' + (before + 5));
    const st = await cdp.eval('({ ...tsui.render.stats, lost: tsui.gl.isContextLost(), live: Sims98.live })');
    log.push('lost and restored: ' + JSON.stringify(st));
    if (st.lost || !st.sprites) throw new Error('the picture did not come back after a lost context');
    if (st.live.gl !== 1) throw new Error('context counter is wrong after a lost context');
    await sleep(300);
    await cdp.shot(path.join(out, 'lost-restored.png'), '#game');
  },
  async modes(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    const want = [['800', 1000, 800, 800, 600, 1], ['1024', 1024, 768, 1024, 768, 1], ['1024', 800, 600, 1024, 768, 0.78], ['window', 1280, 720, 1280, 720, 1], ['window', 1600, 1200, 800, 600, 2], ['window', 500, 400, 800, 600, 0.625]];
    for (const [mode, w, h, sw, sh, scale] of want) {
      await place(cdp, w, h);
      await cdp.eval(`tsui.setScreen('${mode}'), true`);
      await cdp.until(`tsui.screen.sw === ${sw} && tsui.screen.sh === ${sh} && Math.abs(tsui.screen.scale - ${scale}) < 0.01`);
      await sleep(500);
      const r = await cdp.eval('({ world: [tsui.world.width, tsui.world.height], panels: [tsui.panels.width, tsui.panels.height], frame: [tsui.render.w, tsui.render.h], camera: [tsui.camera.w, tsui.camera.h], live: Sims98.live })');
      log.push(`mode ${mode} ${w}x${h}: ` + JSON.stringify(r));
      for (const k of ['world', 'panels', 'frame', 'camera']) if (r[k][0] !== sw || r[k][1] !== sh) throw new Error(k + ' is not ' + sw + 'x' + sh + ' in ' + mode);
      await cdp.shot(path.join(out, `mode-${mode}-${w}x${h}.png`), '#game');
    }
    await cdp.eval("tsui.setScreen('800'), true");
  },
  async input(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    await place(cdp, 800, 600);
    await cdp.until('tsui.screen.scale === 1 && tsui.screen.x === 0');
    const state = () => cdp.eval('({ zoom: tsui.camera.zoom, rot: tsui.camera.rot, x: tsui.camera.fx, z: tsui.camera.fz, anim: !!tsui.zoomAnim, dither: tsui.settings.dither, mode: tsui.settings.screen })');
    const press = async (key, code, kc, hold) => {
      const p = { key, code, windowsVirtualKeyCode: kc, nativeVirtualKeyCode: kc };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await sleep(hold || 30);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(260);
    };
    const mouse = (type, x, y, extra) => cdp.send('Input.dispatchMouseEvent', { type, x, y, ...(extra || {}) });
    const start = await state();
    await press('x', 'KeyX', 88);
    const farther = await state();
    if (farther.zoom !== start.zoom + 1) throw new Error('X did not zoom out');
    await press('z', 'KeyZ', 90);
    const closer = await state();
    if (closer.zoom !== start.zoom) throw new Error('Z did not zoom in');
    await press('.', 'Period', 190);
    if ((await state()).rot !== 1) throw new Error('> did not turn');
    await press(',', 'Comma', 188);
    if ((await state()).rot !== 0) throw new Error('< did not turn back');
    const a = await state();
    await press('ArrowRight', 'ArrowRight', 39, 300);
    const b = await state();
    if (Math.hypot(b.x - a.x, b.z - a.z) < 1) throw new Error('the arrow key did not move the camera');
    await press('w', 'KeyW', 87, 300);
    const c = await state();
    if (Math.hypot(c.x - b.x, c.z - b.z) < 1) throw new Error('W did not move the camera');
    await mouse('mouseMoved', 400, 300);
    await sleep(100);
    const d = await state();
    await mouse('mousePressed', 400, 300, { button: 'right', buttons: 2, clickCount: 1 });
    await mouse('mouseMoved', 300, 250, { button: 'right', buttons: 2 });
    await sleep(100);
    await mouse('mouseReleased', 300, 250, { button: 'right', buttons: 0, clickCount: 1 });
    await sleep(100);
    const e = await state();
    if (Math.hypot(e.x - d.x, e.z - d.z) < 0.5) throw new Error('the right button did not drag the camera');
    await mouse('mouseWheel', 300, 250, { deltaX: 0, deltaY: 120 });
    await sleep(300);
    const f = await state();
    if (f.zoom !== e.zoom + 1) throw new Error('the wheel did not zoom');
    await mouse('mouseMoved', 400, 300);
    await sleep(100);
    const g = await state();
    await mouse('mouseMoved', 795, 300);
    await sleep(400);
    await mouse('mouseMoved', 400, 300);
    const h = await state();
    if (Math.hypot(h.x - g.x, h.z - g.z) < 1) throw new Error('the window edge did not move the camera');
    await press('b', 'KeyB', 66);
    if ((await state()).dither !== false) throw new Error('B did not switch the colour depth');
    await press('b', 'KeyB', 66);
    await press('v', 'KeyV', 86);
    if ((await state()).mode !== '1024') throw new Error('V did not switch the screen');
    await cdp.eval("tsui.setScreen('800'), true");
    await press('Home', 'Home', 36);
    const home = await state();
    if (home.x !== 320 || home.z !== 320) throw new Error('Home did not centre the camera');
    log.push('input: ' + JSON.stringify({ start, farther, closer, home }));
    const free = await cdp.eval(`(() => {
      const fire = (code, ctrl) => { const e = new KeyboardEvent('keydown', { code, key: code, ctrlKey: !!ctrl, bubbles: true, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; };
      return [fire('F10'), fire('F10', true), fire('F9')];
    })()`);
    log.push('free keys: ' + JSON.stringify(free));
    if (free.some(Boolean)) throw new Error('the game takes a key of the bug reports');
  },
  async perf(cdp, out, log) {
    await cdp.open('/sims98.html?bench');
    await cdp.until('window.tsui && tsui.ready', 120000);
    const size = [['800', 800, 600], ['window', 1920, 1190]];
    const report = { rows: [] };
    for (const [mode, w, h] of size) {
      await place(cdp, w, h);
      await cdp.eval(`tsui.setScreen('${mode}'), true`);
      await cdp.until(`tsui.screen.sw === ${w} && tsui.screen.sh === ${h}`);
      await sleep(300);
      const r = await cdp.eval(`(() => {
        const ui = tsui, gl = ui.gl, px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const lots = ui.scene.lots, lot = lots[20], rows = [];
        const views = [];
        for (let zoom = 0; zoom < 5; zoom++) views.push({ name: 'zoom' + zoom + ' lot', zoom, rot: 0, x: lot.x + 15, z: lot.z + 15 });
        views.push({ name: 'zoom2 rot1', zoom: 2, rot: 1, x: lot.x + 15, z: lot.z + 15 });
        views.push({ name: 'zoom3 centre', zoom: 3, rot: 0, x: 320, z: 320 });
        views.push({ name: 'zoom4 centre', zoom: 4, rot: 0, x: 320, z: 320 });
        const stats = v => { v.sort((a, b) => a - b); return { med: +v[v.length >> 1].toFixed(2), p95: +v[Math.floor(v.length * 0.95)].toFixed(2), max: +v[v.length - 1].toFixed(2) }; };
        for (const v of views) {
          ui.camera.setView(v);
          ui.pointer = null;
          for (let k = 0; k < 6; k++) { ui.benchFrame(); sync(); }
          const cpu = [], all = [];
          for (let k = 0; k < 90; k++) {
            ui.camera.pan(Math.sin(k * 0.3) * 6, Math.cos(k * 0.2) * 4);
            const a = performance.now();
            cpu.push(ui.benchFrame());
            sync();
            all.push(performance.now() - a);
          }
          const st = ui.render.stats;
          rows.push({ name: v.name, chunks: st.chunks, sprites: st.sprites, draws: st.draws, tris: st.tris, cpu: stats(cpu), frame: stats(all) });
        }
        const step = [];
        ui.camera.setView({ zoom: 0, rot: 0, x: lot.x + 15, z: lot.z + 15 });
        for (const dir of [1, 1, 1, 1, -1, -1, -1, -1]) {
          ui.zoomStep(dir);
          for (let k = 0; k < 12; k++) { const a = performance.now(); ui.benchFrame(); sync(); step.push(performance.now() - a); }
        }
        const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0;
        return { renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), rows, zoomSweep: stats(step), vramMb: Math.round(ui.gpu.bytes / 1048576), heapMb: heap };
      })()`);
      report.renderer = r.renderer;
      report.vramMb = r.vramMb;
      report.heapMb = r.heapMb;
      report.rows.push({ screen: w + 'x' + h, zoomSweep: r.zoomSweep, views: r.rows });
    }
    await cdp.eval("tsui.setScreen('800'), true");
    log.push('renderer: ' + report.renderer);
    log.push('vram MB: ' + report.vramMb + ', JS heap MB: ' + report.heapMb);
    for (const g of report.rows) {
      log.push('screen ' + g.screen + ', zoom sweep ' + JSON.stringify(g.zoomSweep));
      for (const v of g.views) log.push('  ' + v.name.padEnd(14) + ' chunks ' + String(v.chunks).padStart(3) + ', sprites ' + String(v.sprites).padStart(5) + ', draws ' + String(v.draws).padStart(3) + ', tris ' + String(v.tris).padStart(6) + ', cpu ' + v.cpu.med + ' ms (p95 ' + v.cpu.p95 + '), frame ' + v.frame.med + ' ms (p95 ' + v.frame.p95 + ')');
    }
    fs.writeFileSync(path.join(out, 'perf.json'), JSON.stringify(report, null, 1));
  },
  async cycle(cdp, out, log) {
    await cdp.open('/index.html');
    await cdp.until('!!(window.winManager && window.appSims98 && document.getElementById("boot-screen").style.display === "none" && !document.getElementById("bios-post-screen").classList.contains("active") && document.querySelector("#desktop-icons > *"))', 60000);
    await sleep(1000);
    const first = await cdp.eval(`(async () => {
      appSims98.open();
      for (let i = 0; i < 600 && !appSims98.ui.ready; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 300));
      appSims98.ui.sound.unlock();
      const r = appSims98.ui.root.getBoundingClientRect();
      return { screen: appSims98.ui.screen, client: [r.width, r.height], frames: appSims98.ui.frames, ticks: appSims98.ui.ticks, active: !appSims98.ui.paused, gl: !!appSims98.ui.gl, audio: Sims98.live.audio };
    })()`);
    log.push('window: ' + JSON.stringify(first));
    if (first.screen.scale !== 1) throw new Error('the window does not show the picture 1:1');
    if (first.client[0] !== 800 || first.client[1] !== 600) throw new Error('the window client area is not 800x600');
    if (!first.gl || !first.active || first.ticks < 2) throw new Error('the game does not run in the window');
    if (first.audio !== 1) throw new Error('the sound did not start in the window');
    await cdp.shot(path.join(out, 'window.png'));
    const report = await cdp.eval(`(async () => {
      const T = window.tsTrack, wait = ms => new Promise(r => setTimeout(r, ms)), wm = winManager;
      wm.closeWindow('app_sims98');
      await wait(200);
      const before = { ...Sims98.live };
      let shown = 0;
      for (let i = 0; i < ${CYCLES}; i++) {
        appSims98.open();
        await wait(80);
        if (wm.windows.has('app_sims98') && document.querySelector('.ts-root .ts-world')) shown++;
        appSims98.ui.sound.unlock();
        wm.closeWindow('app_sims98');
        await wait(80);
      }
      await wait(400);
      return {
        shown, before, after: { ...Sims98.live },
        pendingFrames: T.rafs.size, pendingTimers: T.timers.size, listeners: T.listeners,
        glCreated: T.gl.length, glAlive: T.gl.filter(g => !g.isContextLost()).length,
        audioCreated: T.audio.length, audioAlive: T.audio.filter(a => a.state !== 'closed').length,
        windowLeft: wm.windows.has('app_sims98'), domLeft: !!document.querySelector('.ts-root'), uiLeft: !!appSims98.ui
      };
    })()`);
    log.push('cycle: ' + JSON.stringify(report));
    if (report.shown !== CYCLES) throw new Error('the window did not open every time');
    if (report.pendingFrames || report.pendingTimers || report.listeners) throw new Error('frames, timers or listeners are left');
    if (report.audioCreated < CYCLES) throw new Error('the sound was not started in every window');
    if (report.glAlive || report.audioAlive) throw new Error('a graphics or audio context is left');
    if (report.windowLeft || report.domLeft || report.uiLeft) throw new Error('the window left something behind');
    for (const k of Object.keys(report.before)) if (report.before[k] !== 0 || report.after[k] !== 0) throw new Error('live counter is not zero: ' + k);
  }
};

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'sims98-shots');
  const names = process.argv.slice(3).filter(a => !a.startsWith('--'));
  const list = names.length ? names : Object.keys(SCENES);
  for (const n of list) if (!SCENES[n]) throw new Error('unknown scene: ' + n);
  fs.mkdirSync(out, { recursive: true });
  const { cdp, close } = await launch();
  const log = [];
  let failed = null;
  try {
    for (const n of list) {
      await SCENES[n](cdp, out, log);
      log.push('scene ' + n + ' ok');
    }
    if (cdp.errors.length) failed = new Error('page errors:\n' + [...new Set(cdp.errors)].slice(0, 20).join('\n'));
  } catch (e) {
    failed = e;
  } finally {
    await close();
  }
  console.log(log.join('\n'));
  if (failed) throw failed;
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
