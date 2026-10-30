const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);


async function launch() {
  const sport = randomPort(8300, 600), dport = randomPort(9600, 300);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore', windowsHide: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirill98-edge-'));
  const gfx = process.argv.includes('--gpu') ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'];
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,900', ...gfx, '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore', windowsHide: true });
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
  const pending = new Map(), errors = [], warnings = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails;
      errors.push(x.exception ? x.exception.description : x.text);
    }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    if (d.method === 'Log.entryAdded' && (d.params.entry.level === 'warning' || d.params.entry.level === 'error')) warnings.push(d.params.entry.text);
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
  await send('Log.enable', {});
  await send('Network.enable', {});
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://127.0.0.1:${sport}/kirill98.html`)).status === 200) break; } catch (e) { }
    await sleep(250);
  }
  const base = `http://127.0.0.1:${sport}`;
  const cdp = {
    errors, warnings, eval: evalJs, send,
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
    async key(key, code, keyCode) {
      const p = { key, code: code || key, windowsVirtualKeyCode: keyCode || 0, nativeVirtualKeyCode: keyCode || 0 };
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(120);
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

const VIEWS = [
  { name: 'town', at: [845, 1338], yaw: 0.52, pitch: 0.02, hour: 10 },
  { name: 'town-night', at: [845, 1338], yaw: 0.52, pitch: 0.02, hour: 23 },
  { name: 'korni', at: [425, 706], yaw: -Math.PI / 2, pitch: 0.12, hour: 14 },
  { name: 'korni-night', at: [425, 706], yaw: -Math.PI / 2, pitch: 0.12, hour: 23.5 },
  { name: 'palace', at: [1060, 955], yaw: 0.3, pitch: 0.06, hour: 11 },
  { name: 'pass', at: [650, 200], yaw: 1.27, pitch: 0.14, hour: 15 },
  { name: 'fort-view', at: [962, 148], yaw: Math.PI - 0.35, pitch: -0.32, hour: 17.5 },
  { name: 'fort-night', at: [880, 230], yaw: 0.35, pitch: 0.28, hour: 22 },
  { name: 'ford', at: [700, 742], yaw: 1.25, pitch: 0.02, hour: 12 },
  { name: 'overview', free: [768, 640, 1760], yaw: 0, pitch: -0.62, hour: 12, fogScale: 3 },
  { name: 'overview-night', free: [768, 640, 1760], yaw: 0, pitch: -0.62, hour: 22.5, fogScale: 3 },
  { name: 'third', at: [845, 1338], yaw: 0.52, pitch: -0.05, hour: 10, mode: 'third', player: true }
];

const settle = async cdp => {
  const f = await cdp.eval('kiui.frames');
  await cdp.until('kiui.frames > ' + (f + 3), 20000);
};

const woundKit = `(() => {
  window.kiTest = {
    steps(n) { for (let i = 0; i < n; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); },
    fresh(hour) {
      const S = kiui.state;
      kiui.hold = true;
      kiui.closePanel(false);
      if (kiui.player.chair) kiui.chairUse();
      kiui.testWound('heal');
      kiui.setView({ pos: [845, 1338], yaw: 0.52, pitch: 0.02, mode: 'first', hour });
      this.steps(2);
    }
  };
})()`;
const kiStill = async cdp => { for (let k = 0; k < 2; k++) { const f = await cdp.eval('kiui.dirty = true, kiui.frames'); await cdp.until('kiui.frames > ' + f, 20000); } };

const WORLD = [
  { name: '01-meadow-ford', at: [735, 735], yaw: 1.89, pitch: 0.02, hour: 11 },
  { name: '02-road-mostovica', at: [705, 1265], yaw: -0.3, pitch: 0.0, hour: 10 },
  { name: '03-tract', at: [985, 1110], yaw: 0.44, pitch: 0.0, hour: 13 },
  { name: '04-field-tsarevo', at: [1250, 1080], yaw: 0.79, pitch: 0.02, hour: 15 },
  { name: '05-forest-edge', at: [730, 900], yaw: -Math.PI / 2, pitch: 0.02, hour: 9 },
  { name: '06-thicket', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 11 },
  { name: '07-swamp', at: [260, 1040], yaw: -1.35, pitch: 0.0, hour: 17 },
  { name: '08-river-source', at: [730, 372], yaw: -0.35, pitch: 0.12, hour: 12 },
  { name: '09-pass', at: [650, 215], yaw: 0, pitch: 0.1, hour: 14 },
  { name: '10-palace-wall', free: [1152.2, 39.9, 690], yaw: -Math.PI / 2, pitch: -0.3, hour: 12 },
  { name: '11-valley-corner', free: [1470, 60, 1470], yaw: 2.36, pitch: -0.06, hour: 12 },
  { name: '12-river-night', at: [745, 1000], yaw: Math.PI / 2, pitch: 0.0, hour: 23 }
];

const SCENES = {
  async forest(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const rows = [];
    const shots = [
      { name: 'forest-25', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 11, treeRadius: 25 },
      { name: 'forest-40', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 11, treeRadius: 40 },
      { name: 'forest-60', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 11, treeRadius: 60 },
      { name: 'forest-border', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 11, treeRadius: 40, border: true },
      { name: 'forest-trail', at: [420, 692], yaw: Math.PI / 2 + 0.25, pitch: 0.02, hour: 9, treeRadius: 40 },
      { name: 'forest-elder', at: [356, 717], yaw: -1.03, pitch: 0.5, hour: 15, treeRadius: 40 },
      { name: 'forest-night', at: [480, 640], yaw: 0.2, pitch: 0.05, hour: 23, treeRadius: 40 },
      { name: 'forest-dusk', at: [610, 1150], yaw: -0.4, pitch: 0.04, hour: 20.3, treeRadius: 40 },
      { name: 'forest-overview', free: [330, 150, 900], yaw: 0, pitch: -0.48, hour: 12, treeRadius: 40, fogScale: 1.5 }
    ];
    for (const v of shots) {
      await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)};
        const free = v.free || [v.at[0], kiui.T.heightAt(v.at[0], v.at[1]) + 1.65, v.at[1]];
        kiui.setView({ free, yaw: v.yaw, pitch: v.pitch, hour: v.hour, treeRadius: v.treeRadius, border: !!v.border, fogScale: v.fogScale });
      })()`);
      await settle(cdp);
      await cdp.shot(path.join(out, v.name + '.png'), '#game');
      rows.push({ name: v.name, stats: await cdp.eval('kiui.renderer.stats') });
    }
    await cdp.eval('kiui.setView({ border: false, treeRadius: 40 })');
    return { pass: rows.length === shots.length && rows.every(r => r.stats.draws <= 40), rows };
  },

  async approach(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const tree = await cdp.eval(`(() => {
      const tr = kiui.F.trees;
      let best = -1, bd = 1e9;
      for (let i = 0; i < tr.count; i++) {
        if (kiui.T.zoneAt(tr.X[i], tr.Z[i]) !== 2 || tr.H[i] < 13) continue;
        let alone = true;
        kiui.F.trunksNear(tr.X[i], tr.Z[i] + 30, 32, j => { if (j !== i && tr.Z[j] > tr.Z[i] - 3) alone = false; });
        if (!alone) continue;
        const d = Math.hypot(tr.X[i] - 1200, tr.Z[i] - 840);
        if (d < bd) { bd = d; best = i; }
      }
      return best < 0 ? null : { i: best, x: tr.X[best], z: tr.Z[best], h: tr.H[best], v: tr.V[best] };
    })()`);
    if (!tree) return { pass: false, error: 'no lonely tree in zone 2' };
    const frames = [];
    for (let k = 0; k < 10; k++) {
      const d = 62 - k * 4;
      await cdp.eval(`(() => {
        const x = ${tree.x}, z = ${tree.z} + ${d};
        kiui.setView({ free: [x, kiui.T.heightAt(x, z) + 1.65, z], yaw: 0, pitch: 0.18, hour: 12, treeRadius: 40 });
      })()`);
      await settle(cdp);
      await cdp.shot(path.join(out, 'approach-' + String(k).padStart(2, '0') + '-' + d + 'm.png'), '#game');
      frames.push(d);
    }
    return { pass: true, tree, frames };
  },

  async perf(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const res = await cdp.eval(`(async () => {
      const gl = kiui.gpu.gl, info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const out = { renderer, size: [kiui.width, kiui.height], runs: {} }, px = new Uint8Array(4);
      const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      for (const radius of [25, 40, 60]) {
        kiui.setView({ free: [480, kiui.T.heightAt(480, 640) + 1.65, 640], yaw: 0, pitch: 0.05, hour: 11, treeRadius: radius });
        kiui.draw(); sync();
        const times = [];
        for (let k = 0; k < 90; k++) {
          kiui.yaw = k / 90 * Math.PI * 2;
          const t0 = performance.now();
          kiui.draw();
          sync();
          times.push(performance.now() - t0);
        }
        times.sort((a, b) => a - b);
        out.runs[radius] = { avg: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1), p95: +times[Math.floor(times.length * 0.95)].toFixed(1), tris: kiui.renderer.stats.tris, near: kiui.renderer.stats.trees };
        kiui.draw(); sync();
      }
      return out;
    })()`);
    await cdp.shot(path.join(out, 'perf-last.png'), '#game');
    return { pass: true, ...res };
  },

  async body(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const rows = [];
    const shot = async (name, view) => {
      if (view) await cdp.eval(`kiui.setView(${JSON.stringify(view)})`);
      await settle(cdp);
      await cdp.shot(path.join(out, name + '.png'), '#game');
      rows.push({ name, people: await cdp.eval('kiui.renderer.stats.people') });
    };
    const D = await cdp.eval('Kirill98.Places.DRILL');
    const fx = Math.sin(D.face), fz = -Math.cos(D.face), sx = Math.cos(D.face), sz = Math.sin(D.face);
    const at = (s, b, h) => [D.at[0] + sx * s - fx * b, h, D.at[1] + sz * s - fz * b];
    const look = Math.atan2(-fx, fz) + Math.PI;
    const ground = async (x, z) => cdp.eval(`kiui.T.heightAt(${x}, ${z})`);
    await shot('body-formation', { pos: [845, 1338], yaw: 0.52, pitch: 0.02, hour: 11, mode: 'first' });
    const p0 = at(0, -7, 0);
    p0[1] = await ground(p0[0], p0[2]) + 1.9;
    await shot('body-formation-close', { free: p0, yaw: D.face + Math.PI, pitch: -0.12, hour: 11 });
    for (const [row, side] of D.rows.entries()) {
      for (const c of [-1, 1]) {
        const e = at(c * 0.67, row * 1.9 - 1.7, 0);
        e[1] = await ground(e[0], e[2]) + 1.62;
        await shot('body-side-' + side + (c < 0 ? '-a' : '-b'), { free: e, yaw: D.face + Math.PI, pitch: -0.05, hour: 11 });
      }
    }
    for (const hero of ['elf.m', 'elf.f', 'guard.m', 'guard.f', 'villain']) {
      await shot('body-fp-' + hero, { pos: [845, 1338], yaw: 0.52, pitch: 0.02, hour: 11, mode: 'first', hero });
      const front = [845 + Math.sin(0.52) * 2.6, 0, 1338 - Math.cos(0.52) * 2.6];
      front[1] = await ground(front[0], front[2]) + 1.45;
      await shot('body-hero-' + hero, { pos: [845, 1338], yaw: 0.52, hour: 11, mode: 'third', hero });
      await shot('body-hero-' + hero, { free: front, yaw: 0.52 + Math.PI, pitch: -0.08, hour: 11 });
    }
    await cdp.eval(`kiui.setView({ hero: 'elf.m', mode: 'first' })`);
    const slope = await cdp.eval(`(() => {
      const S = kiui.state, c = Kirill98.Places.DRILL.slope, cx = c.reduce((a, p) => a + p[0], 0) / c.length, cz = c.reduce((a, p) => a + p[1], 0) / c.length;
      const group = S.people.filter(p => Math.hypot(p.mv.pos[0] - cx, p.mv.pos[2] - cz) < 25);
      kiui.setView({ free: [cx + 14, kiui.T.heightAt(cx + 14, cz) + 2.2, cz - 3], yaw: -Math.PI / 2, pitch: -0.2, hour: 11 });
      for (const p of group) kiui.topple(p);
      const t0 = performance.now();
      for (const b of S.bodies) Kirill98.Body.settle(b, kiui.W);
      S.version++;
      return { cx, cz, n: group.length, ms: performance.now() - t0, times: S.bodies.map(b => +b.t.toFixed(2)) };
    })()`);
    const mid = await cdp.eval(`(() => { const B = kiui.state.bodies; return [0, 1, 2].map(k => B.reduce((a, b) => a + b.pts[24 + k], 0) / B.length); })()`);
    await shot('body-slope', { free: [mid[0] + 13, mid[1] + 4.5, mid[2] + 4], yaw: -Math.PI / 2 - 0.3, pitch: -0.3, hour: 11 });
    await shot('body-slope-near', { free: [mid[0] + 5, mid[1] + 2.4, mid[2] + 1.5], yaw: -Math.PI / 2 - 0.25, pitch: -0.42, hour: 11 });
    await shot('body-slope-top', { free: [mid[0], mid[1] + 11, mid[2] + 0.5], yaw: 0, pitch: -1.45, hour: 11 });
    const one = await cdp.eval(`(() => { const B = kiui.state.bodies; return B.map(b => [b.pts[24], b.pts[25], b.pts[26]]); })()`);
    for (const [i, c] of one.slice(0, 4).entries()) await shot('body-slope-one-' + i, { free: [c[0] + 1.6, c[1] + 2.2, c[2] + 1.6], yaw: -Math.PI / 4, pitch: -0.85, hour: 11 });
    const searched = await cdp.eval(`(() => {
      const S = kiui.state, b = S.bodies[0], c = b.pts;
      kiui.setView({ pos: [c[24] + 1.2, c[26] + 0.4], yaw: 0, pitch: -0.6, hour: 11, mode: 'first' });
      kiui.openSearch(b);
      return Kirill98.Body.belongings(b).map(x => x.key);
    })()`);
    await shot('body-search');
    await cdp.eval('kiui.closePanel(false)');
    await shot('body-night', { free: p0, yaw: D.face + Math.PI, pitch: -0.12, hour: 22.5 });
    const pass = rows.length > 10 && rows.every(r => r.people && r.people.draws <= 20) && slope.n === D.slope.length;
    return { pass, slope, searched, rows };
  },

  async bodies(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const res = await cdp.eval(`(async () => {
      const K = Kirill98, S = kiui.state, gl = kiui.gpu.gl, info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const spawn = (cx, cz, r0, r1, n, seed) => {
        const rnd = K.rng(seed), out = [], sides = ['elf', 'guard', 'villain', 'town'];
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, d = r0 + rnd() * (r1 - r0), x = cx + Math.sin(a) * d, z = cz - Math.cos(a) * d;
          const kit = K.Body.kit(sides[i % 4], null, rnd), fr = K.Body.fk(K.Body.figure(kit), K.Body.restPose(), [x, kiui.T.heightAt(x, z), z], rnd() * 6.3);
          out.push(K.Body.settle(K.Body.fall(kit, fr, { id: 5000 + i }), kiui.W));
        }
        return out;
      };
      const t0 = performance.now();
      const near = spawn(480, 640, 5, 45, 150, 11), spread = spawn(768, 768, 0, 700, 150, 12);
      const settleMs = performance.now() - t0;
      const measure = (bodies, frames) => {
        S.bodies = bodies;
        S.version++;
        for (let k = 0; k < 4; k++) { kiui.draw(); sync(); }
        const times = [];
        for (let k = 0; k < frames; k++) {
          kiui.yaw = k / frames * Math.PI * 2;
          const a = performance.now();
          kiui.draw();
          sync();
          times.push(performance.now() - a);
        }
        return times;
      };
      const scenes = {}, views = {
        forest: { free: [480, kiui.T.heightAt(480, 640) + 1.65, 640], pitch: 0.05, hour: 11, treeRadius: 40 },
        town: { free: [845, kiui.T.heightAt(845, 1338) + 1.65, 1338], pitch: 0.02, hour: 11, treeRadius: 40 }
      };
      for (const [name, v] of Object.entries(views)) {
        kiui.setView(Object.assign({ yaw: 0 }, v));
        const sets = { none: [], near: name === 'forest' ? near : spawn(845, 1338, 5, 45, 150, 13), spread };
        const acc = { none: [], near: [], spread: [] };
        for (let rep = 0; rep < 4; rep++) for (const key of ['none', 'near', 'spread']) acc[key].push(...measure(sets[key], 90));
        const stat = list => {
          const s = list.slice().sort((p, q) => p - q);
          return { avg: +(s.reduce((p, q) => p + q, 0) / s.length).toFixed(3), med: +s[Math.floor(s.length / 2)].toFixed(3), p95: +s[Math.floor(s.length * 0.95)].toFixed(3) };
        };
        scenes[name] = { none: stat(acc.none), near: stat(acc.near), spread: stat(acc.spread) };
        S.bodies = sets.near;
        S.version++;
        kiui.yaw = 0.4;
        kiui.draw();
        scenes[name].people = kiui.renderer.stats.people;
      }
      S.bodies = near;
      S.version++;
      return { renderer, size: [kiui.width, kiui.height], settleMs: Math.round(settleMs), scenes };
    })()`);
    await cdp.eval(`kiui.setView({ free: [470, kiui.T.heightAt(470, 652) + 2.4, 652], yaw: 0.6, pitch: -0.25, hour: 11, treeRadius: 40 })`);
    await settle(cdp);
    await cdp.shot(path.join(out, 'bodies-150-forest.png'), '#game');
    const ratio = s => +(s.near.avg / s.none.avg).toFixed(3);
    return { pass: true, ratio: { forest: ratio(res.scenes.forest), town: ratio(res.scenes.town) }, ...res };
  },

  async interact(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const aimAt = async id => cdp.eval(`(() => {
      const p = kiui.state.people.find(q => q.id === ${id}), f = p.mv.yaw, x = p.mv.pos[0] + Math.sin(f) * 2.4, z = p.mv.pos[2] - Math.cos(f) * 2.4;
      for (const q of kiui.state.people) if (q !== p && q.team && Math.hypot(q.mv.pos[0] - p.mv.pos[0], q.mv.pos[2] - p.mv.pos[2]) < 5) { q.mv = Kirill98.Move.body(kiui.W, q.mv.pos[0] + 14, q.mv.pos[2] + 6, q.mv.yaw); if (q.act && q.act.post) q.act.post = [q.mv.pos[0], q.mv.pos[2]]; }
      kiui.setView({ pos: [x, z], yaw: f + Math.PI, pitch: -0.12, mode: 'first', hour: 11 });
      return kiui.target ? null : true;
    })()`);
    const front = await cdp.eval('kiui.state.people.filter(p => p.act.kind === "stand").slice(0, 2).map(p => p.id)');
    const start = await cdp.eval('kiui.state.people.filter(p => !p.convoy).length');
    await aimAt(front[0]);
    await settle(cdp);
    const prompt = await cdp.eval('document.querySelector(".ki-prompt").textContent');
    await cdp.key('F6', 'F6', 117);
    await cdp.until('kiui.state.bodies.length === 1', 5000);
    await cdp.until('kiui.state.bodies[0].frozen', 10000);
    await cdp.eval(`(() => {
      const b = kiui.state.bodies[0], c = kiui.camera().eye, w = [b.pts[24], b.pts[25], b.pts[26]];
      const dx = w[0] - c[0], dy = w[1] - c[1], dz = w[2] - c[2];
      const d = Math.hypot(dx, dz);
      if (d > 1.8) { const x = w[0] - dx / d * 1.2, z = w[2] - dz / d * 1.2; kiui.setView({ pos: [x, z], yaw: Math.atan2(dx, -dz), pitch: -0.9, mode: 'first' }); }
      const e = kiui.camera().eye;
      kiui.yaw = Math.atan2(w[0] - e[0], -(w[2] - e[2]));
      kiui.pitch = Math.atan2(w[1] - e[1], Math.hypot(w[0] - e[0], w[2] - e[2]));
    })()`);
    await settle(cdp);
    const searchPrompt = await cdp.eval('document.querySelector(".ki-prompt").textContent');
    await cdp.shot(path.join(out, 'interact-aim.png'), '#game');
    await cdp.key('e', 'KeyE', 69);
    await cdp.until('!!document.querySelector(".ki-search")', 5000);
    await cdp.shot(path.join(out, 'interact-search.png'), '#game');
    const listed = await cdp.eval('[...document.querySelectorAll(".ki-search-row span")].map(e => e.textContent)');
    await cdp.eval('document.querySelector(".ki-search [data-act=all]").click()');
    await settle(cdp);
    await cdp.shot(path.join(out, 'interact-taken.png'), '#game');
    const bag = await cdp.eval('JSON.stringify(kiui.state.player.bag)');
    await cdp.key('e', 'KeyE', 69);
    await cdp.until('!document.querySelector(".ki-search")', 5000);
    await cdp.key('F5', 'F5', 116);
    await cdp.until('!!kiui.quick', 3000);
    await aimAt(front[1]);
    await settle(cdp);
    await cdp.key('F6', 'F6', 117);
    await cdp.until('kiui.state.bodies.length === 2', 5000);
    await cdp.key('F9', 'F9', 120);
    await cdp.until('kiui.state.bodies.length === 1', 5000);
    const after = await cdp.eval('({ bag: JSON.stringify(kiui.state.player.bag), people: kiui.state.people.filter(p => !p.convoy).length, left: Kirill98.Body.belongings(kiui.state.bodies[0]).length, toast: document.querySelector(".ki-toast").textContent })');
    await cdp.shot(path.join(out, 'interact-loaded.png'), '#game');
    const pass = /Уронить/.test(prompt) && /Обыскать/.test(searchPrompt) && listed.length > 0 && bag.length > 2 && after.bag === bag && after.left === 0 && after.people === start - 1;
    return { pass, prompt, searchPrompt, listed, bag, after };
  },

  async duel(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(`(() => {
      const K = Kirill98;
      window.kiTest = {
        steps(n) { for (let i = 0; i < n; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); },
        hero(weapon, shield, x, z, yaw, pitch, mode) {
          const S = kiui.state, P = S.player;
          kiui.hold = true;
          P.kit = K.Body.copyKit(K.Body.HEROES['guard.m'].kit); P.kit.hero = 'guard.m';
          P.fight = K.Combat.fighter({ weapon, shield });
          kiui.setView({ pos: [x, z], yaw, pitch, mode: mode || 'first', hour: 11 });
          P.mv.yaw = yaw;
        },
        target(side, dist, opts) {
          const S = kiui.state, P = S.player, o = opts || {}, f = Math.sin(kiui.yaw), g = -Math.cos(kiui.yaw);
          for (const p of S.people.filter(q => q.test)) S.people.splice(S.people.indexOf(p), 1);
          const x = P.mv.pos[0] + f * dist, z = P.mv.pos[2] + g * dist, id = S.nextId++;
          const kit = K.Body.kit(side, o.fig || 'm', K.rng(id * 7 + 1));
          kit.armor = o.armor || []; kit.head = o.head === undefined ? null : o.head; kit.pros = {};
          const p = K.Body.person(id, kit, x, z, kiui.yaw + Math.PI, kiui.W, { kind: 'stand', post: [x, z], face: kiui.yaw + Math.PI });
          p.fight = K.Combat.fighter({ weapon: o.weapon || null });
          p.anim = K.Anim.state(); p.frames = new Float32Array(132); p.test = true;
          S.people.push(p);
          this.steps(2);
          return p;
        },
        look(at, back, up, side) {
          const x = at[0] + (side || 0), z = at[2] + (back || 0), y = kiui.T.heightAt(x, z) + (up || 1.6);
          kiui.setView({ free: [x, y, z], yaw: Math.atan2(at[0] - x, -(at[2] - z)), pitch: Math.atan2(at[1] - y, Math.hypot(at[0] - x, at[2] - z)), hour: 11 });
          this.steps(1);
        },
        aimAt(pt) {
          const e = [kiui.player.pos[0], kiui.player.pos[1] + kiui.player.eye, kiui.player.pos[2]];
          kiui.yaw = Math.atan2(pt[0] - e[0], -(pt[2] - e[2]));
          kiui.pitch = Math.atan2(pt[1] - e[1], Math.hypot(pt[0] - e[0], pt[2] - e[2]));
        },
        swing(dir, hold, until) {
          const F = kiui.state.player.fight, mv = kiui.player, events = [];
          const grab = n => { for (let i = 0; i < n; i++) { kiui.update(1 / 60); } };
          K.Combat.press(F);
          if (dir === 'thrust') { grab(4); K.Combat.release(F, mv); }
          else { F.steer = [Math.cos(dir * Math.PI / 4) * 100, Math.sin(dir * Math.PI / 4) * 100]; grab(Math.round(hold * 60)); K.Combat.release(F, mv); }
          grab(Math.round((until || 0) * 60));
          kiui.dirty = true;
          kiui.draw();
        }
      };
    })()`);
    const rows = [];
    const still = async () => { for (let k = 0; k < 2; k++) { const f = await cdp.eval('kiui.dirty = true, kiui.frames'); await cdp.until('kiui.frames > ' + f, 20000); } };
    const shot = async name => { await still(); await cdp.shot(path.join(out, name + '.png'), '#game'); rows.push({ name, stats: await cdp.eval('({ people: kiui.renderer.stats.people, parts: kiui.state.parts.length, items: kiui.state.items.length, blood: kiui.state.blood.length })') }); };
    const S = await cdp.eval('Kirill98.Places.DRILL.straw[1]');
    const DIRS = ['справа', 'справа сверху', 'сверху', 'слева сверху', 'слева', 'слева снизу', 'снизу', 'справа снизу'];
    for (let dir = 0; dir < 8; dir++) {
      await cdp.eval(`kiTest.hero('sword', false, ${S[0]}, ${S[1] - 1.05}, Math.PI, -0.1); kiTest.steps(3); kiTest.swing(${dir}, 0.35, 0.07)`);
      await shot('duel-straw-' + dir);
      await cdp.eval('kiui.hold = true; kiTest.steps(40)');
    }
    await cdp.eval(`kiTest.hero('sword', false, ${S[0]}, ${S[1] - 1.05}, Math.PI, -0.1); kiTest.steps(3); kiTest.swing('thrust', 0, 0.06)`);
    await shot('duel-straw-thrust');
    for (const [w, dist] of [['sword', 1.05], ['spear', 1.9]]) {
      await cdp.eval(`(() => { kiTest.hero('${w}', false, ${S[0]}, ${S[1]} - ${dist}, Math.PI, -0.1); kiTest.steps(3); const F = kiui.state.player.fight; Kirill98.Combat.press(F); kiui.mouse.lmb = true; kiTest.steps(34); })()`);
      await shot('duel-aim-' + w);
      await cdp.eval(`(() => { const F = kiui.state.player.fight; kiui.mouse.lmb = false; Kirill98.Combat.release(F, kiui.player); kiTest.steps(${w === 'spear' ? 9 : 7}); })()`);
      await shot('duel-thrust-' + w);
      await cdp.eval(`(() => { kiui.setView({ free: [${S[0]} + 2.4, kiui.T.heightAt(${S[0]} + 2.4, ${S[1]} - 0.9) + 1.6, ${S[1]} - 0.9], yaw: -Math.PI / 2, pitch: -0.2, hour: 11 }); kiTest.steps(1); })()`);
      await shot('duel-thrust-' + w + '-side');
      await cdp.eval('kiTest.steps(40)');
    }
    for (const [name, mode] of [['duel-kick', 'first'], ['duel-kick-third', 'third']]) {
      await cdp.eval(`(() => { kiTest.hero('sword', false, ${S[0]}, ${S[1]} - 1.0, Math.PI, -0.05, '${mode}'); kiTest.steps(3); Kirill98.Combat.kick(kiui.state.player.fight, kiui.player); kiTest.steps(11); })()`);
      await shot(name);
      await cdp.eval('kiTest.steps(40)');
    }
    await cdp.eval(`kiTest.hero('bardiche', false, ${S[0] - 0.25}, ${S[1] - 1.35}, Math.PI, Math.atan2(1.0 - 1.43, 1.35)); kiTest.steps(3); kiTest.swing(0, 0.7, 0.5)`);
    await cdp.eval(`kiui.setView({ free: [${S[0] + 2.2}, kiui.T.heightAt(${S[0] + 2.2}, ${S[1] - 1.6}) + 1.7, ${S[1] - 1.6}], yaw: -Math.PI / 2 - 0.55, pitch: -0.32, hour: 11 }); kiTest.steps(60)`);
    await shot('duel-straw-cut');
    const R = await cdp.eval('Kirill98.Places.DRILL.ring.at');
    const cut = async (name, weapon, dist, dir, h, side, extra) => {
      const res = await cdp.eval(`(() => {
        kiTest.hero('${weapon}', false, ${R[0]}, ${R[1]}, 0, 0);
        const p = kiTest.target('${side}', ${dist}, ${JSON.stringify(extra || {})});
        const h = ${h === 'neck' ? 'p.frames[10] + 0.03 - kiui.player.pos[1]' : h};
        kiui.pitch = Math.atan2(h - (kiui.player.eye - 0.22), ${dist});
        const known = new Set(kiui.state.parts.map(x => x.id));
        kiTest.swing(${dir}, 0.6, 1.4);
        const at = [${R[0]}, kiui.T.heightAt(${R[0]}, ${R[1] - dist}) + 0.5, ${R[1] - dist}];
        kiTest.look(at, 1.2, 1.5, 2.3);
        return { cut: kiui.state.parts.filter(x => !known.has(x.id)).map(x => x.keep.join('+')), people: kiui.state.people.filter(q => q.test).length, life: p.fight.life };
      })()`);
      await shot(name);
      return res;
    };
    const arm = await cut('duel-cut-arm', 'sword', 1.0, 4, 0.95, 'villain');
    const leg = await cut('duel-cut-leg', 'axe', 0.9, 7, 0.45, 'elf');
    const head = await cut('duel-cut-head', 'bardiche', 1.45, 0, 'neck', 'guard');
    const eye = await cdp.eval(`(() => {
      kiTest.hero('knife', false, ${R[0]}, ${R[1]}, 0, 0);
      const p = kiTest.target('town', 0.55, {});
      const fr = p.frames, fig = Kirill98.Body.figure(p.kit), l = [0.032 * fig.sx, 0.19 * fig.sy, -0.095 * fig.sx];
      const pt = [fr[9] + fr[0] * l[0] + fr[3] * l[1] + fr[6] * l[2], fr[10] + fr[1] * l[0] + fr[4] * l[1] + fr[7] * l[2], fr[11] + fr[2] * l[0] + fr[5] * l[1] + fr[8] * l[2]];
      kiTest.aimAt(pt);
      kiTest.swing('thrust', 0, 0.2);
      const h = p.frames, head = [h[9], h[10] + 0.18, h[11]];
      p.fight.hostile = null;
      kiui.state.player.mv.pos[2] += 3;
      kiui.setView({ free: [head[0] + 0.18, head[1] + 0.02, head[2] + 0.75], yaw: Math.atan2(-0.18, 0.75), pitch: -0.03, hour: 11 });
      kiTest.steps(1);
      return { eyes: p.kit.eyes, life: p.fight.life };
    })()`);
    await shot('duel-eye');
    const corpse = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state;
      kiTest.hero('axe', false, ${R[0]} + 3, ${R[1]}, 0, 0);
      const kit = K.Body.kit('villain', 'm', K.rng(77)), x = ${R[0]} + 3, z = ${R[1]} - 1.2;
      kit.armor = []; kit.head = null; kit.pros = {};
      const body = K.Body.settle(K.Body.fall(kit, K.Body.fk(K.Body.figure(kit), K.Body.restPose(), [x, kiui.T.heightAt(x, z), z], Math.PI), { id: S.nextId++, push: [0, 0, -1.2] }), kiui.W);
      S.bodies.push(body); S.version++;
      const known = new Set(S.parts.map(q => q.id));
      let mid = null;
      for (const part of [9, 10, 5, 6, 7, 8]) {
        const c = K.Body.capsules(body.kit, body.frames).find(q => q[0] === part);
        if (!c) continue;
        mid = [0, 1, 2].map(i => (c[1][i] + c[2][i]) / 2);
        kiui.setView({ pos: [mid[0], mid[2] + 0.6], yaw: 0, pitch: 0, mode: 'first', hour: 11 });
        kiTest.steps(2);
        kiTest.aimAt(mid);
        kiTest.swing(2, 0.6, 0.12);
        const done = () => S.parts.some(q => !known.has(q.id));
        if (done()) break;
        kiTest.steps(40);
        if (done()) break;
      }
      window.kiCorpse = { body, mid };
      return S.parts.filter(q => !known.has(q.id)).map(q => q.keep.join('+'));
    })()`);
    await shot('duel-corpse-chop');
    await cdp.eval(`(() => { const m = kiCorpse.mid; kiTest.steps(60); kiui.setView({ free: [m[0] + 2.2, kiui.T.heightAt(m[0] + 2.2, m[2]) + 1.5, m[2] + 0.4], yaw: -Math.PI / 2 - 0.2, pitch: -0.4, hour: 11 }); kiTest.steps(2); })()`);
    await shot('duel-corpse-cut');
    const guards = [];
    for (const side of ['right', 'left', 'up', 'down']) {
      guards.push(await cdp.eval(`(() => {
        kiTest.hero('sword', true, ${R[0]}, ${R[1]}, 0, 0);
        kiui.mouse.rmb = true;
        Kirill98.Combat.guard(kiui.state.player.fight, true, '${side}');
        kiTest.steps(30);
        const g = kiui.state.player.fight.guard;
        return g ? g.dir : null;
      })()`));
      await shot('duel-shield-' + side);
    }
    await cdp.eval('kiui.mouse.rmb = false; Kirill98.Combat.guard(kiui.state.player.fight, false)');
    await cdp.eval(`(() => {
      const S = kiui.state;
      for (const p of S.people.filter(q => q.test)) S.people.splice(S.people.indexOf(p), 1);
      kiui.hold = true;
      kiui.duelSetup = { me: { weapon: 'sword', shield: true }, foe: { side: 'villain', weapon: 'axe', shield: false, exp: 'veteran' } };
      kiui.startDuel();
      kiui.hold = true;
      kiTest.steps(80);
    })()`);
    await shot('duel-fight');
    await cdp.eval(`(() => { const foe = kiui.state.people.find(p => p.duel), P = kiui.state.player.mv.pos; if (foe) { const m = [(foe.mv.pos[0] + P[0]) / 2, foe.mv.pos[1] + 1.1, (foe.mv.pos[2] + P[2]) / 2]; kiTest.look(m, 0.6, 1.5, 3.2); } kiTest.steps(10); })()`);
    await shot('duel-fight-side');
    await cdp.eval('kiui.openDuel()');
    await shot('duel-yard');
    await cdp.eval('kiui.closePanel(false); kiui.hold = false');
    const pass = arm.cut.some(c => c === '4+6' || c === '3+5' || c === '5' || c === '6') && leg.cut.some(c => /^(7|8|9|10)/.test(c)) && head.cut.includes('0') && !!(eye.eyes.l || eye.eyes.r) && guards.join() === 'right,left,up,down' && corpse.length === 1;
    return { pass, arm, leg, head, eye, guards, corpse, rows };
  },

  async grip(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const R = await cdp.eval('Kirill98.Places.DRILL.ring.at');
    const rows = [];
    const still = async () => { for (let k = 0; k < 2; k++) { const f = await cdp.eval('kiui.dirty = true, kiui.frames'); await cdp.until('kiui.frames > ' + f, 20000); } };
    for (const [w, shield] of [['knife', false], ['sickle', false], ['sword', false], ['axe', false], ['mace', false], ['spear', false], ['bardiche', false], ['sword', true]]) {
      const name = 'grip-' + w + (shield ? '-shield' : '');
      const fist = await cdp.eval(`(() => {
        const K = Kirill98, S = kiui.state, P = S.player;
        kiui.hold = true;
        P.kit = K.Body.copyKit(K.Body.HEROES['guard.m'].kit); P.kit.hero = 'guard.m';
        P.fight = K.Combat.fighter({ weapon: '${w}', shield: ${shield} });
        kiui.setView({ pos: [${R[0]}, ${R[1]}], yaw: 0, pitch: -0.25, mode: 'first', hour: 11 });
        for (let i = 0; i < 20; i++) kiui.update(1 / 60);
        kiui.dirty = true; kiui.draw();
        return kiui.figures(kiui.camera()).hands.fist;
      })()`);
      await still();
      await cdp.shot(path.join(out, name + '.png'), '#game');
      await cdp.eval(`(() => {
        const P = kiui.state.player, e = P.mv.pos;
        const c = [e[0] + 1.3, e[1] + 1.45, e[2] - 1.0], h = [e[0] + 0.25, e[1] + 1.15, e[2] - 0.35];
        kiui.setView({ free: c, yaw: Math.atan2(h[0] - c[0], -(h[2] - c[2])), pitch: Math.atan2(h[1] - c[1], Math.hypot(h[0] - c[0], h[2] - c[2])), hour: 11 });
        for (let i = 0; i < 3; i++) kiui.update(1 / 60);
        kiui.dirty = true; kiui.draw();
      })()`);
      await still();
      await cdp.shot(path.join(out, name + '-side.png'), '#game');
      rows.push({ name, fist });
    }
    await cdp.eval('kiui.hold = false');
    const pass = rows.every(r => r.fist.includes(6)) && rows.filter(r => /spear|bardiche|shield/.test(r.name)).every(r => r.fist.includes(5)) && !rows.find(r => r.name === 'grip-sword').fist.includes(5);
    return { pass, rows };
  },

  async eye(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    const rows = [];
    const shot = async (name, prep) => {
      await cdp.eval(`(() => { kiTest.fresh(${JSON.stringify(prep.hour || 11)}); ${prep.js}; kiTest.steps(6); })()`);
      await kiStill(cdp);
      await cdp.shot(path.join(out, name + '.png'), '#game');
      rows.push({ name, sight: await cdp.eval('JSON.stringify(kiui.sight())') });
    };
    await shot('eye-left', { js: "kiui.testWound('lEye')" });
    await shot('eye-right', { js: "kiui.testWound('rEye')" });
    await shot('eye-glass', { js: "kiui.testWound('lEye'); kiui.testWound('glass')" });
    await shot('eye-resin-night', { hour: 23, js: "kiui.testWound('rEye'); kiui.testWound('resin')" });
    await shot('eye-ruby', { js: "kiui.testWound('lEye'); kiui.testWound('ruby')" });
    await shot('eye-helmet-slit', { js: "kiui.state.player.kit.head = 'closed'; kiui.state.version++" });
    await shot('eye-blind', { js: "kiui.testWound('lEye'); kiui.testWound('rEye'); for (const a of [[2, 0], [-3, 1], [1, 4], [0, -5]]) kiui.hearAt([kiui.player.pos[0] + a[0], 1, kiui.player.pos[2] + a[1]], 0.9)" });
    const pass = rows.find(r => r.name === 'eye-left').sight.includes('"l":"dark"') && rows.find(r => r.name === 'eye-right').sight.includes('"r":"dark"') && rows.find(r => r.name === 'eye-blind').sight.includes('"blind":true');
    return { pass, rows };
  },

  async crawl(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    const snap = async name => { await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), '#game'); };
    const speed = async (key, secs) => cdp.eval(`(() => { const p0 = kiui.player.pos.slice(); kiui.keys.add('${key}'); kiTest.steps(${Math.round(secs * 60)}); kiui.keys.delete('${key}'); const p1 = kiui.player.pos; return Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) / ${secs}; })()`);
    await cdp.eval(`(() => { kiTest.fresh(11); kiui.testWound('lShin'); kiTest.steps(30); })()`);
    const fresh = await speed('KeyW', 2);
    await snap('crawl-fp');
    await cdp.eval(`(() => { kiui.mode = 'third'; kiTest.steps(4); })()`);
    await snap('crawl-third');
    const bind = await cdp.eval(`(() => { kiui.mode = 'first'; kiui.bandage(); const t = kiui.state.player.fight.binding ? kiui.state.player.fight.binding.time : 0; kiTest.steps(30); return t; })()`);
    await snap('crawl-binding');
    await cdp.eval('kiTest.steps(200)');
    const after = await cdp.eval('({ cut: kiui.state.player.kit.cut, heavy: kiui.state.player.fight.bleed.heavy })');
    await cdp.eval(`(() => { kiui.testWound('crutch'); kiTest.steps(20); })()`);
    const crutch = await speed('KeyW', 2);
    await cdp.eval(`(() => { kiui.mode = 'third'; kiui.keys.add('KeyW'); kiTest.steps(20); kiui.keys.delete('KeyW'); kiTest.steps(1); })()`);
    await snap('crutch-third');
    await cdp.eval(`(() => { kiui.mode = 'first'; kiTest.fresh(11); kiui.testWound('rFore'); const F = kiui.state.player.fight; F.bleed.heavy = 0.4; kiTest.steps(60); })()`);
    const ko = await cdp.eval('({ down: kiui.state.player.fight.down, panel: kiui.panelKind })');
    await snap('crawl-ko');
    await cdp.eval(`(() => { kiui.state.player.fight.ko = 0.05; kiTest.steps(10); })()`);
    const fallen = await cdp.eval('kiui.panelKind');
    await snap('crawl-fallen');
    await cdp.eval("kiui.closePanel(false); kiui.rise(); kiui.hold = false");
    const pass = fresh > 0.55 && fresh < 0.8 && bind === 3 && after.cut.lShin === 'bandaged' && after.heavy < 0 && crutch > 1.3 && crutch < 1.75 && ko.down === 'ko' && ko.panel === 'ko' && fallen === 'fallen';
    return { pass, fresh, bind, after, crutch, ko, fallen };
  },

  async wheelchair(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    const snap = async name => { await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), '#game'); };
    const side = async () => cdp.eval(`(() => { const e = kiui.player.pos, f = Kirill98.basis(kiui.player.yaw, 0); const c = [e[0] + f.right[0] * 2.6 + f.fwd[0] * 0.6, e[1] + 1.4, e[2] + f.right[2] * 2.6 + f.fwd[2] * 0.6]; kiui.setView({ free: c, yaw: Math.atan2(e[0] - c[0], -(e[2] - c[2])), pitch: -0.25, hour: 11 }); kiTest.steps(2); })()`);
    const ride = await cdp.eval(`(() => {
      kiTest.fresh(11);
      kiui.testWound('lThigh'); kiui.testWound('rShin');
      Kirill98.Wounds.tie(kiui.state.player);
      const C = Kirill98.Places.DRILL.chair.at, c = kiui.state.chairs[0];
      kiui.setView({ pos: [C[0] + 0.4, C[1]], yaw: 0, pitch: -0.15, mode: 'first', hour: 11 });
      kiui.player.limit = Kirill98.Wounds.caps(kiui.state.player.kit);
      kiTest.steps(10);
      const sat = kiui.chairUse();
      const p0 = kiui.player.pos.slice();
      kiui.keys.add('KeyW'); kiTest.steps(150); kiui.keys.delete('KeyW');
      const p1 = kiui.player.pos;
      return { sat, rider: c.rider, dist: Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), speed: c.speed };
    })()`);
    await snap('wheelchair-fp');
    await cdp.eval(`(() => { kiui.mode = 'third'; kiTest.steps(2); })()`);
    await side();
    await snap('wheelchair-ride');
    const push = await cdp.eval(`(() => {
      kiui.free = null; kiui.mode = 'first';
      kiui.chairUse();
      kiui.testWound('heal');
      const c = kiui.state.chairs[0], f = Kirill98.basis(c.yaw, 0).fwd;
      kiui.setView({ pos: [c.pos[0] - f[0] * 0.8, c.pos[2] - f[2] * 0.8], yaw: c.yaw, pitch: -0.3, mode: 'first', hour: 11 });
      kiTest.steps(5);
      const ok = kiui.chairUse();
      const p0 = c.pos.slice();
      kiui.keys.add('KeyW'); kiTest.steps(120); kiui.keys.delete('KeyW');
      return { ok, pusher: c.pusher, moved: Math.hypot(c.pos[0] - p0[0], c.pos[2] - p0[2]) };
    })()`);
    await snap('wheelchair-push-fp');
    await side();
    await snap('wheelchair-push');
    await cdp.eval("kiui.free = null; kiui.chairUse(); kiui.hold = false");
    const pass = ride.sat && ride.rider === 'player' && ride.dist > 5 && push.ok && push.pusher === 'player' && push.moved > 2;
    return { pass, ride, push };
  },

  async beasts(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    await cdp.eval(`(() => {
      const fr = kiui.frame.bind(kiui); kiui.loop = ts => { try { fr(ts); } catch (e) { window.__err = String(e.stack).slice(0, 900); } };
      window.kiCalm = () => { const S = kiui.state; S.beasts = []; S.carcasses = []; S.fauna = {}; for (const G of Kirill98.Beasts.GROUPS) S.fauna[G.id] = { count: 0, max: 0, lost: 0, day: 999, active: false }; };
      window.kiBeast = (kind, x, z, yaw, o) => { const K = Kirill98, S = kiui.state, b = K.Beasts.make(S.nextId++, kind, x, z, yaw, kiui.W, o); S.beasts.push(b); return b; };
      window.kiPose = (b, speed, secs) => { const K = Kirill98; b.mv.speed = speed; for (let i = 0; i < Math.round(secs * 60); i++) K.Anim.beastUpdate(b.anim, b, 1 / 60); K.Beasts.fk(b, K.Anim.beastPose(b.anim, K.Beasts.SPECIES[b.beast], b), kiui.W); };
      window.kiSide = (b, k) => { const K = Kirill98, D = K.Beasts.SPECIES[b.beast].body, size = D.L + D.neck * 0.6 + D.head + D.fu + D.fl, f = K.basis(b.mv.yaw, 0), mid = [b.mv.pos[0] - f.fwd[0] * D.L * 0.4, b.mv.pos[2] - f.fwd[2] * D.L * 0.4], dist = 0.8 + size * (k || 1.2), c = [mid[0] + f.right[0] * dist, mid[1] + f.right[2] * dist], y = b.mv.pos[1] + (D.fu + D.fl) * 0.75; kiui.setView({ free: [c[0], y, c[1]], yaw: Math.atan2(mid[0] - c[0], -(mid[1] - c[1])), pitch: -0.08, hour: kiui.hour }); kiui.dirty = true; kiui.draw(); };
    })()`);
    const snap = async name => { try { await kiStill(cdp); } catch (e) { throw new Error('stuck before ' + name + ': ' + JSON.stringify(await cdp.eval('({ err: window.__err, frames: kiui.frames, dirty: kiui.dirty, paused: kiui.paused, panel: kiui.panelKind, stop: kiui.stop, active: kiui.isActive(), hidden: document.hidden })'))); } await cdp.shot(path.join(out, name + '.png'), '#game'); };
    const kinds = ['wolf', 'dog', 'fox', 'hare', 'bear', 'boar', 'deer', 'goat', 'cow', 'pig', 'chicken', 'horse', 'ox'];
    const gaits = {};
    for (const k of kinds) {
      for (const [g, i] of [['walk', 0], ['run', 2]]) {
        gaits[k + '-' + g] = await cdp.eval(`(() => {
          const K = Kirill98;
          kiTest.fresh(12);
          kiCalm();
          kiui.hold = true;
          const b = kiBeast('${k}', 872, 1352, -Math.PI / 2, { sex: 'm' }), s = K.Beasts.SPECIES['${k}'];
          kiPose(b, s.speed[${i}], ${i ? 0.37 : 0.55});
          kiSide(b);
          return b.anim.gait;
        })()`);
        await snap('beast-' + k + '-' + g);
      }
    }
    await cdp.eval(`(() => {
      const K = Kirill98;
      kiTest.fresh(12);
      kiCalm();
      kiui.hold = true;
      const T = kiui.T, e = kiBeast('eagle', 650, 200, 0, { alt: 12 });
      e.mv.pos = [650, T.heightAt(650, 200) + 12, 200];
      kiPose(e, 14, 0.3);
      const c = kiBeast('crow', 653.5, 201, 0, { alt: 11 });
      c.mv.pos = [653.5, T.heightAt(650, 200) + 11.4, 201];
      kiPose(c, 9, 0.5);
      kiui.setView({ free: [648.5, T.heightAt(650, 200) + 11.4, 204.5], yaw: 0.25, pitch: 0.04, hour: 12 });
    })()`);
    await snap('beast-birds');
    const pack = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiTest.fresh(23.2);
      kiCalm();
      kiui.setHero('guard.m');
      kiui.rise();
      kiui.hold = true;
      const at = [560, 1210];
      kiui.setView({ pos: at, yaw: 0, pitch: -0.1, mode: 'third', hour: 23.2 });
      S.fauna.pk = { count: 5, max: 5, lost: 0, day: 1, active: true };
      for (let i = 0; i < 5; i++) kiBeast('wolf', at[0] + Math.cos(i * 1.3) * 16, at[1] + Math.sin(i * 1.3) * 16, 0, { group: 'pk', leader: i === 0, home: [580, 1156] });
      P.fight.shield = false;
      P.fight.torch = true;
      let closest = 99;
      for (let i = 0; i < 360; i++) { kiui.update(1 / 60); for (const w of S.beasts) closest = Math.min(closest, Math.hypot(w.mv.pos[0] - P.mv.pos[0], w.mv.pos[2] - P.mv.pos[2])); }
      kiui.yaw = 2.2; kiui.pitch = -0.32; kiTest.steps(1);
      return { closest, hunting: S.beasts.filter(w => w.brain.state === 'hunt').length };
    })()`);
    await snap('beast-pack-torch');
    await cdp.eval(`kiui.mode = 'first'; kiui.pitch = -0.1; kiTest.steps(1)`);
    await snap('beast-torch-fp');
    const bitten = await cdp.eval(`(() => {
      const S = kiui.state, P = S.player;
      P.fight.torch = false;
      kiui.mode = 'third';
      const life = P.fight.life;
      for (let i = 0; i < 300 && P.fight.life > life - 12; i++) kiui.update(1 / 60);
      kiui.yaw = 0.6; kiui.pitch = -0.3; kiTest.steps(1);
      return { lost: life - P.fight.life, bleeding: P.fight.bleed.medium > 0 };
    })()`);
    await snap('beast-pack-bite');
    const bear = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiui.closePanel(false);
      kiTest.fresh(14);
      kiCalm();
      kiui.hold = true;
      const G = K.Beasts.GROUPS.find(g => g.id === 'bear-gully'), b = kiBeast('bear', G.at[0] + 3, G.at[1] + 4, 2.4, { home: G.at.slice() });
      b.groupR = G.r;
      kiui.setView({ pos: [G.at[0] + 18, G.at[1] - 10], yaw: Math.atan2(-15, 14), pitch: -0.12, mode: 'first', hour: 14 });
      kiPose(b, 1.3, 0.5);
      kiTest.steps(30);
      kiSide(b, 2.2);
      return { state: b.brain.state, d: Math.hypot(b.mv.pos[0] - P.mv.pos[0], b.mv.pos[2] - P.mv.pos[2]), place: G.place };
    })()`);
    await snap('beast-bear-gully');
    const carcass = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiTest.fresh(12);
      kiCalm();
      kiui.hold = true;
      const at = [872, 1352], list = [['wolf', 0, 0], ['boar', 2.2, 0.6], ['deer', -2.4, 0.9], ['hare', 0.8, 2]];
      for (const [k, dx, dz] of list) { const b = kiBeast(k, at[0] + dx, at[1] + dz, dx * 1.3, {}); kiPose(b, 0, 0.1); b.fight.life = -1; }
      const legless = kiBeast('wolf', at[0] - 1, at[1] - 2.4, 0.4, {});
      kiPose(legless, 0, 0.1);
      K.Beasts.struck(S, { fight: { weapon: 'axe', act: { power: 1.2 }, exp: 'veteran', aim: { eye: [at[0], 1.6, at[1] - 4] } }, mv: { pos: [at[0], 0, at[1] - 4] } }, legless, { part: 5, tag: 'leg', at: legless.mv.pos.slice(), onBlade: true }, 'chop', [], () => 0.9, P);
      kiTest.steps(2);
      const wolfC = S.carcasses.find(c => c.beast === 'deer');
      if (wolfC) K.Beasts.skin(S, wolfC, P.bag);
      kiui.setView({ free: [at[0] + 1, kiui.T.heightAt(at[0], at[1]) + 2.6, at[1] - 4.6], yaw: Math.PI - 0.1, pitch: -0.5, hour: 12 });
      return { carcasses: S.carcasses.length, pieces: S.carcasses.filter(c => c.piece).length, skinned: S.carcasses.filter(c => c.skinned).length };
    })()`);
    await snap('beast-carcasses');
    const dog = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiTest.fresh(12);
      kiCalm();
      kiui.setHero('villain');
      kiui.rise();
      kiui.hold = true;
      const G = K.Beasts.GROUPS.find(g => g.id === 'dog-mezha'), d = kiBeast('dog', G.at[0], G.at[1], 0, { owner: 'town', home: G.at.slice() });
      d.groupR = G.r;
      kiui.setView({ pos: [G.at[0] + 9, G.at[1] + 2], yaw: -Math.PI / 2 - 0.2, pitch: -0.15, mode: 'first', hour: 12 });
      let barks = 0;
      const orig = kiui.sound.play.bind(kiui.sound);
      kiui.sound.play = (k, o) => { if (k === 'bark') barks++; return orig(k, o); };
      kiTest.steps(150);
      kiui.sound.play = orig;
      return { barks, state: d.brain.state };
    })()`);
    await snap('beast-dog-bark');
    await cdp.eval("kiui.free = null; kiui.hold = false; kiui.mode = 'first'; kiui.setHero('elf.m'); kiui.rise()");
    const gaitOk = kinds.every(k => gaits[k + '-walk'] === 'walk' && gaits[k + '-run'] === 'run');
    const pass = gaitOk && pack.closest > 4.4 && pack.hunting >= 3 && bitten.lost > 5 && bear.state !== undefined && carcass.carcasses >= 5 && carcass.pieces >= 1 && carcass.skinned === 1 && dog.barks > 0;
    return { pass, gaits, pack, bitten, bear, carcass, dog };
  },

  async squad(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    await cdp.eval(`(() => {
      window.kiLook = (at, from, h) => { const T = kiui.T, c = [at[0] + from[0], T.heightAt(at[0] + from[0], at[1] + from[1]) + (h || 1.7), at[1] + from[1]], g = T.heightAt(at[0], at[1]) + 1; kiui.setView({ free: c, yaw: Math.atan2(at[0] - c[0], -(at[1] - c[2])), pitch: Math.atan2(g - c[1], Math.hypot(at[0] - c[0], at[1] - c[2])), hour: 11 }); kiTest.steps(2); };
      window.kiSpawn = (side, x, z, yaw, o) => { const K = Kirill98, S = kiui.state, q = K.Body.member(S.nextId++, side, x, z, yaw, kiui.W); q.test = true; q.anim = K.Anim.state(); q.frames = new Float32Array(132); Object.assign(q, o || {}); S.people.push(q); return q; };
      window.kiClear = () => { const S = kiui.state; kiui.closePanel(false); kiui.dropCarry(); S.people = S.people.filter(q => !q.test); S.bodies.length = 0; S.parts.length = 0; S.items.length = 0; S.rescue = null; kiui.free = null; kiui.rise(); kiui.hold = true; };
    })()`);
    const snap = async name => { await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), '#game'); };
    const line = await cdp.eval(`(() => {
      const K = Kirill98;
      kiTest.fresh(11);
      kiui.setHero('guard.m');
      kiui.rise();
      kiui.startSquad({ place: 'yard', own: 4, foes: 0, foe: 'villain', valued: true, debt: true });
      kiui.hold = true;
      const S = kiui.state, ours = S.people.filter(q => q.squad === 'player');
      K.AI.order(S, 'line');
      kiTest.steps(300);
      const lined = ours.every(q => { const s = K.AI.slotOf(q, S); return Math.hypot(q.mv.pos[0] - s[0], q.mv.pos[2] - s[1]) < 1; });
      const P = S.player, f = K.basis(P.mv.yaw, 0);
      kiLook([P.mv.pos[0] + f.fwd[0] * 2.5, P.mv.pos[2] + f.fwd[2] * 2.5], [f.fwd[0] * 8 + f.right[0] * 3, f.fwd[2] * 8 + f.right[2] * 3], 2.4);
      return { lined, ours: ours.length, can: K.AI.canCommand(S).ok };
    })()`);
    await snap('squad-line');
    await cdp.eval("kiui.free = null; kiui.mode = 'third'; kiui.pitch = -0.1; kiui.toggleOrders(true); kiTest.steps(2)");
    await snap('squad-orders');
    const clash = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, G = K.Places.GROUNDS.yard;
      kiui.toggleOrders(false);
      kiui.mode = 'first';
      K.AI.order(S, 'hold');
      K.AI.order(S, 'fire');
      P.mv.pos = [P.mv.pos[0] - 22, P.mv.pos[1], P.mv.pos[2]];
      for (let i = 0; i < 5; i++) kiSpawn('villain', G.b[0], G.b[1] + (i - 2) * 1.6, G.face + Math.PI);
      kiTest.steps(480);
      kiLook([(G.a[0] + G.b[0]) / 2, G.a[1]], [-4, 13], 5);
      return { fighting: S.people.filter(q => q.test && q.fight && q.fight.hostile).length, bodies: S.bodies.length, heroDown: !!P.fight.down };
    })()`);
    await snap('squad-clash');
    await cdp.eval('kiTest.steps(1800)');
    const after = await cdp.eval(`(() => {
      const S = kiui.state, G = Kirill98.Places.GROUNDS.yard, jobs = {};
      for (const q of S.people) if (q.test) { const k = q.state || (q.brain && q.brain.job && q.brain.job.kind) || '-'; jobs[k] = (jobs[k] || 0) + 1; }
      kiLook([(G.a[0] + G.b[0]) / 2, G.a[1]], [10, 12], 5);
      return { jobs, bodies: S.bodies.length, stable: S.bodies.filter(b => b.stable).length, stuck: (S.stats || {}).stuck || 0, heroDown: !!S.player.fight.down };
    })()`);
    await snap('squad-after');
    const captive = await cdp.eval(`(() => {
      kiClear();
      kiui.setView({ pos: [1250, 676], yaw: Math.PI, pitch: -0.2, mode: 'first', hour: 11 });
      const q = kiSpawn('villain', 1250, 678.2, 0, {});
      q.fight = Kirill98.Combat.fighter({ weapon: null });
      q.state = 'surrender';
      kiTest.steps(60);
      kiui.openCaptive(q);
      kiTest.steps(1);
      return { kneel: q.mv.kneel, panel: kiui.panelKind, name: q.name };
    })()`);
    await snap('squad-surrender');
    const led = await cdp.eval(`(() => {
      const S = kiui.state, q = S.people.find(p => p.test && p.state);
      kiui.captiveAct(q, 'tie');
      kiui.captiveAct(q, 'lead');
      kiui.hold = true;
      kiui.keys.add('KeyW'); kiTest.steps(150); kiui.keys.delete('KeyW'); kiTest.steps(40);
      kiui.mode = 'third'; kiui.yaw = kiui.yaw + 2.6; kiui.pitch = -0.15; kiTest.steps(2);
      return { state: q.state, gap: Math.hypot(q.mv.pos[0] - S.player.mv.pos[0], q.mv.pos[2] - S.player.mv.pos[2]) };
    })()`);
    await snap('squad-led');
    const carry = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiClear();
      kiui.mode = 'first';
      kiui.setView({ pos: [1250, 690], yaw: -Math.PI / 2, pitch: -0.4, mode: 'first', hour: 11 });
      const mate = kiSpawn('guard', 1250, 687, 0), hurt = kiSpawn('guard', 1249.2, 690.5, 0);
      kiTest.steps(2);
      hurt.fight.life = -5;
      kiTest.steps(240);
      const b = S.bodies.find(x => x.id === hurt.id);
      kiui.target = { body: b };
      kiui.carryKey();
      kiTest.steps(10);
      kiui.mode = 'third'; kiui.yaw = -Math.PI / 2 + 0.9; kiui.pitch = -0.12;
      kiui.keys.add('KeyW'); kiTest.steps(40); kiui.keys.delete('KeyW'); kiTest.steps(2);
      return { carried: !!(b && b.carrier === 'player'), speed: P.mv.speed, load: P.mv.load, bound: !!(b && b.stable), prompt: (document.querySelector('.ki-prompt') || {}).textContent };
    })()`);
    await snap('squad-carry-hero');
    const npcCarry = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiui.dropCarry();
      kiTest.steps(120);
      const b = S.bodies[S.bodies.length - 1];
      b.stable = true;
      P.mv.pos = [1290, P.mv.pos[1], 700];
      kiTest.steps(360);
      const c = S.people.find(q => q.carry === b.id);
      if (c) { const e = c.mv.pos, f = K.basis(c.mv.yaw, 0); kiLook([e[0], e[2]], [f.right[0] * 3.2 + f.fwd[0] * 1.2, f.right[2] * 3.2 + f.fwd[2] * 1.2], 1.6); }
      return { carrying: !!c, job: c ? c.brain.job.kind : null };
    })()`);
    await snap('squad-carry-npc');
    const rescue = await cdp.eval(`(() => {
      const S = kiui.state, P = S.player;
      kiClear();
      kiui.mode = 'first';
      kiui.startSquad({ place: 'field', own: 2, foes: 0, foe: 'villain', valued: false, debt: true });
      kiui.hold = true;
      kiTest.steps(30);
      P.fight.life = -5;
      P.fight.bleed.heavy = 30;
      kiTest.steps(2);
      const ko = kiui.panelKind;
      let t = 0;
      while (kiui.panelKind !== 'fallen' && t < 900) { kiTest.steps(10); t += 10; if (t === 60) { kiui.dirty = true; kiui.draw(); } }
      return { ko, panel: kiui.panelKind, secs: t / 60, title: (document.querySelector('.ki-fallen-title') || {}).textContent };
    })()`);
    await snap('squad-rescued');
    const woke = await cdp.eval(`(() => { kiui.afterRescue(); kiui.hold = true; kiTest.steps(5); const P = kiui.state.player, H = Kirill98.Places.HEALERS.guard; return { down: P.fight.down, life: P.fight.life, weapon: P.fight.weapon, shield: P.fight.shield, at: Math.hypot(P.mv.pos[0] - H.at[0], P.mv.pos[2] - H.at[1]), hour: Math.round(kiui.hour), dropped: kiui.state.items.length }; })()`);
    await snap('squad-infirmary');
    const posts = await cdp.eval(`(() => {
      kiClear();
      kiui.setView({ pos: [1100, 700], yaw: Math.PI / 2, pitch: 0.02, mode: 'first', hour: 11 });
      kiTest.steps(30);
      kiLook([1141, 700], [-14, 5], 2.2);
      return kiui.state.people.filter(q => q.team === 'guard' && Math.hypot(q.mv.pos[0] - 1141, q.mv.pos[2] - 700) < 12).length;
    })()`);
    await snap('squad-gate-posts');
    await cdp.eval("kiui.free = null; kiui.hold = false; kiui.mode = 'first'");
    const pass = line.lined && line.can && clash.fighting >= 4 && !clash.heroDown && captive.kneel && captive.panel === 'captive' && led.state === 'led' && led.gap < 4 && carry.carried && carry.load === 'carry' && carry.speed < 2.3 && npcCarry.carrying && rescue.ko === 'ko' && /вынес/.test(rescue.title || '') && woke.down === null && !woke.weapon && woke.at < 3 && posts >= 2;
    return { pass, line, clash, after, captive, led, carry, npcCarry, rescue, woke, posts };
  },

  async shoot(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(woundKit);
    const snap = async name => { await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), '#game'); };
    const D = await cdp.eval('Kirill98.Places.DRILL.straw[1]');
    const shot = async (hero, mode, dist, hold, after) => cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiTest.fresh(11);
      kiui.settings.hero = '${hero}';
      kiui.rise();
      kiui.hold = true;
      kiui.setView({ pos: [${D[0]}, ${D[1]} - ${dist}], yaw: Math.PI, pitch: 0, mode: 'first', hour: 11 });
      kiTest.steps(3);
      K.Missile.setMode(P, '${mode}');
      kiTest.steps(30);
      const straw = S.people.find(p => p.kit.side === 'straw' && Math.hypot(p.mv.pos[0] - ${D[0]}, p.mv.pos[2] - ${D[1]}) < 0.5);
      const c = K.Body.capsules(straw.kit, straw.frames).find(q => q[0] === 1), mid = [0, 1, 2].map(i => (c[1][i] + c[2][i]) / 2);
      const e = [P.mv.pos[0], P.mv.pos[1] + P.mv.eye, P.mv.pos[2]], dh = Math.hypot(mid[0] - e[0], mid[2] - e[2]);
      kiui.yaw = Math.atan2(mid[0] - e[0], -(mid[2] - e[2]));
      const v = K.Data.MISSILES[K.Data.LAUNCHERS['${mode}'].missile].speed[1];
      kiui.pitch = Math.atan2(mid[1] - e[1], dh) + 0.5 * Math.asin(Math.min(1, 9.81 * dh / (v * v)));
      kiTest.steps(2);
      const before = (S.stuck || []).length, items = S.items.length;
      kiui.mouse.press = true; kiTest.steps(1);
      kiTest.steps(Math.round(${hold} * 60));
      const drawing = !!P.fight.draw;
      kiui.mouse.release = true; kiTest.steps(1);
      kiTest.steps(${after});
      return { drawing, flying: (S.missiles || []).length, stuck: (S.stuck || []).length - before, items: S.items.length - items, mode: P.fight.mode, ammo: kiui.ammoLine(P) };
    })()`);
    const bow = await shot('elf.m', 'bow', 12, 0.85, 3);
    await snap('shoot-bow-flight');
    await cdp.eval('kiTest.steps(40)');
    await snap('shoot-bow-hit');
    const xbow = await shot('guard.m', 'crossbow', 20, 0.1, 50);
    await snap('shoot-crossbow');
    const jav = await shot('guard.m', 'javelin', 9, 0.6, 50);
    await snap('shoot-javelin');
    const axe = await shot('villain', 'taxe', 7, 0.5, 50);
    await snap('shoot-axe');
    await cdp.eval(`(() => { kiui.settings.hero = 'elf.m'; kiui.rise(); kiui.mode = 'third'; const P = kiui.state.player; Kirill98.Missile.setMode(P, 'bow'); kiTest.steps(25); kiui.mouse.press = true; kiTest.steps(40); const e = P.mv.pos; kiui.setView({ free: [e[0] + 1.6, e[1] + 1.5, e[2] - 1.2], yaw: -Math.PI / 2 - 0.9, pitch: -0.15, hour: 11 }); kiTest.steps(1); })()`);
    await snap('shoot-bow-draw-side');
    await cdp.eval("kiui.mouse.release = true; kiTest.steps(1); kiui.free = null; kiui.mode = 'first'");
    const hidden = await cdp.eval(`(() => {
      const K = Kirill98, F = kiui.flora || kiui.renderer.flora || null, W = kiui.W, Fl = W.flora;
      let spot = null;
      for (let z = 300; z < 1100 && !spot; z += 7) for (let x = 200; x < 600 && !spot; x += 7) if (kiui.T.zoneAt(x, z) === 3 && Fl.bushAt(x, z, 1.0) && W.near(x, z, 5).length === 0) { let tr = 0; Fl.trunksNear(x, z, 2, t => { if (Math.hypot(Fl.trees.X[t] - x, Fl.trees.Z[t] - z) < 1.5) tr++; }); if (!tr) spot = [x, z]; }
      kiui.settings.hero = 'elf.m'; kiui.rise(); kiui.hold = true;
      kiui.setView({ pos: spot, yaw: 0, pitch: 0, mode: 'third', hour: 11 });
      const P = kiui.state.player; P.mv.crouch = true; K.Missile.setMode(P, 'bow'); kiTest.steps(30);
      const e = P.mv.pos;
      kiui.setView({ free: [e[0] + 5, kiui.T.heightAt(e[0] + 5, e[2] - 4) + 1.7, e[2] - 4], yaw: Math.atan2(-5, -4), pitch: -0.15, hour: 11 });
      kiTest.steps(2);
      return { spot, cover: K.Senses.cover(W, P) };
    })()`);
    await snap('shoot-elf-hidden');
    await cdp.eval("kiui.free = null; kiui.mode = 'first'; kiui.hold = false");
    const pass = hidden.cover === 'hidden' && bow.drawing && (bow.flying + bow.stuck) > 0 && xbow.stuck >= 1 && (jav.stuck + jav.items) >= 1 && (axe.stuck + axe.items) >= 1;
    return { pass, bow, xbow, jav, axe, hidden };
  },

  async war(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(`(() => {
      window.kiRun = n => { for (let i = 0; i < n; i++) kiui.update(1 / 60); };
      window.kiWar = hero => {
        const K = Kirill98, S = kiui.state, E = K.World.state(S);
        kiui.closePanel(false);
        kiui.free = null;
        if (hero) kiui.setHero(hero);
        E.planned = 999;
        E.noon = 999;
        E.groups = [];
        S.people = S.people.filter(p => !p.march && !p.convoy && !p.tell);
        S.beasts = (S.beasts || []).filter(b => !b.hitch);
        S.caravans.list = [];
        for (const k of Object.keys(K.Caravan.KINDS)) for (let d = 0; d < 60; d++) S.caravans.spawned[k + ':' + d] = true;
        S.player.fight.life = 100;
        return E;
      };
      const fr = kiui.frame.bind(kiui); kiui.loop = ts => { try { fr(ts); } catch (e) { window.__err = String(e.stack).slice(0, 900); } };
    })()`);
    const snap = async name => { try { const f = await cdp.eval('kiui.frames'); await cdp.until('kiui.frames > ' + (f + 3), 90000); } catch (e) { throw new Error(name + ' ' + String(await cdp.eval('window.__err || [kiui.panelKind, kiui.state.player.fight.down]')) + ' ' + e.message); } await cdp.shot(path.join(out, 'war-' + name + '.png'), '#game'); };
    const trace = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, E = kiWar('guard.m'), T = kiui.T;
      kiui.hour = 13;
      const at = [641, 900];
      E.traces.push({ id: 'shot-trace', at, day: S.day, time: S.time, dead: [['elf', 3], ['guard', 3]], fire: true, done: false });
      P.mv = K.Move.body(kiui.W, 641, 935, 0);
      kiRun(60 * 40);
      const bodies = S.bodies.filter(b => b.who && Math.hypot(K.Body.anchorOf(b)[0] - at[0], K.Body.anchorOf(b)[2] - at[1]) < 20);
      kiui.setView({ free: [646, T.heightAt(646, 914) + 3.2, 914], yaw: Math.atan2(at[0] - 646, -(at[1] - 914)), pitch: -0.32, hour: 13 });
      return { bodies: bodies.length, frozen: bodies.filter(b => b.frozen).length, crows: (S.beasts || []).filter(b => b.beast === 'crow').length, smokes: (S.smokes || []).length };
    })()`);
    await snap('trace');
    const smoke = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, T = kiui.T;
      S.smokes = (S.smokes || []).concat([{ at: [350, T.heightAt(350, 712), 712], until: S.time + 3000, id: 'korni' }]);
      P.mv = K.Move.body(kiui.W, 640, 760, 0);
      kiui.setView({ free: [640, T.heightAt(640, 760) + 48, 760], yaw: Math.atan2(350 - 640, -(712 - 760)), pitch: 0.05, hour: 13 });
      return { smokes: S.smokes.length };
    })()`);
    await snap('smoke');
    const march = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, E = kiWar('villain'), T = kiui.T;
      const g = K.World.launch(S, 'villain', 'raid', K.World.POSTS.fort.gate, K.World.POSTS.korni.at, 8, { target: 'korni', fire: true });
      const line = K.World.pathOf(kiui.W, g.from, g.to, 'villain');
      g.s = line.length * 0.55;
      const q = K.Terrain.pointAt(line, g.s + 25);
      P.mv = K.Move.body(kiui.W, q.x - q.tz * 6, q.z + q.tx * 6, 0);
      kiRun(60 * 12);
      const lead = K.Terrain.pointAt(line, g.s), ahead = K.Terrain.pointAt(line, g.s + 16), eye = [ahead.x + ahead.tz * 1.2, 0, ahead.z - ahead.tx * 1.2];
      kiui.setView({ free: [eye[0], T.heightAt(eye[0], eye[2]) + 2.6, eye[2]], yaw: Math.atan2(lead.x - eye[0], -(lead.z - eye[2])), pitch: -0.12, hour: 13 });
      const crew = S.people.filter(p => p.march && p.march.id === g.id);
      return { live: g.live, crew: crew.length, s: Math.round(g.s), moved: Math.round(g.s - line.length * 0.55) };
    })()`);
    await snap('march');
    const reports = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, E = kiWar('elf.m');
      K.World.report(S, 'elf', 'Дозор империи у брода: четверо', [778, 0, 760], 1);
      K.World.report(S, 'all', 'Злой идёт на штурм дворца: 64 чел., готовность 100 %', [921, 0, 105], 3);
      K.World.report(S, 'elf', 'Набег на Корни: сгорело домов 1', [350, 0, 712], 3);
      kiui.free = null;
      kiui.openReports();
      return { panel: kiui.panelKind, rows: document.querySelectorAll('.ki-report').length };
    })()`);
    await cdp.eval('kiui.draw()');
    await cdp.shot(path.join(out, 'war-reports.png'), '#game');
    const info = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player;
      kiui.closePanel(false);
      kiui.setHero('guard.m');
      S.player.bag.push({ id: 'silver', n: 100 });
      const q = S.people.find(p => p.role === 'inn');
      P.mv = K.Move.body(kiui.W, q.mv.pos[0] + Math.sin(q.mv.yaw) * 1.6, q.mv.pos[2] - Math.cos(q.mv.yaw) * 1.6, 0);
      kiui.yaw = q.mv.yaw + Math.PI;
      kiui.openTalk(q);
      const said = kiui.buyInfo();
      kiui.panel.remove(); kiui.panel = null; kiui.showPanel(K.Screens.inn(kiui, q), 'inn');
      kiui.panel.querySelector('.ki-ledger-said').textContent = said;
      return { said, panel: kiui.panelKind };
    })()`);
    await snap('info');
    await cdp.eval("kiui.closePanel(false); kiui.free = null; kiui.setHero('elf.m'); kiui.rise()");
    const pass = trace.bodies === 6 && trace.smokes >= 1 && march.live && march.crew === 8 && reports.panel === 'yard' && reports.rows >= 3 && /Казённый корован/.test(info.said);
    return { pass, trace, smoke, march, reports, info };
  },

  async caravan(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    await cdp.eval(`(() => {
      window.kiCv = (kind, s, hour, hero) => {
        const K = Kirill98, S = kiui.state, Cv = K.Caravan;
        kiui.closePanel(false);
        kiui.free = null;
        kiui.hold = false;
        if (hero) kiui.setHero(hero);
        S.people = S.people.filter(p => !p.convoy && !p.tell);
        S.beasts = (S.beasts || []).filter(b => !b.hitch);
        S.caravans = null;
        Cv.state(S);
        for (const k of Object.keys(Cv.KINDS)) for (let d = 0; d < 40; d++) S.caravans.spawned[k + ':' + d] = true;
        kiui.hour = hour;
        const c = Cv.make(S, kind, S.day, s, K.rng(5));
        const p = K.Terrain.pointAt(Cv.routes()[kind].line, s);
        return { c: c.id, at: [p.x, p.z], tx: p.tx, tz: p.tz };
      };
      window.kiRun = n => { for (let i = 0; i < n; i++) kiui.update(1 / 60); };
      const fr = kiui.frame.bind(kiui); kiui.loop = ts => { try { fr(ts); } catch (e) { window.__err = String(e.stack).slice(0, 900); } };
    })()`);
    const snap = async name => { try { const f = await cdp.eval('kiui.frames'); await cdp.until('kiui.frames > ' + (f + 3), 90000); } catch (e) { throw new Error(String(await cdp.eval('window.__err || null')) + ' ' + e.message); } const err = await cdp.eval('window.__err || null'); if (err) throw new Error(err); await cdp.shot(path.join(out, 'caravan-' + name + '.png'), '#game'); };
    const tract = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, r = kiCv('trade', 520, 12, 'guard.m');
      const x = r.at[0] + r.tz * 9 + r.tx * 14, z = r.at[1] - r.tx * 9 + r.tz * 14;
      P.mv = K.Move.body(kiui.W, x, z, 0);
      kiRun(240);
      const c = K.Caravan.byId(S, r.c), lead = c.carts[0].pos;
      kiui.setView({ free: [x, kiui.T.heightAt(x, z) + 2.2, z], yaw: Math.atan2(lead[0] - x, -(lead[2] - z)), pitch: -0.08, hour: 12 });
      return { live: c.live, state: c.state, carts: c.carts.length, crew: K.Caravan.crewOf(S, c).length, beasts: K.Caravan.beastsOf(S, c).length, bales: K.Caravan.bales(c), s: c.s };
    })()`);
    await snap('tract');
    const block = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, Cv = K.Caravan, spot = Cv.sawnSpots().find(sp => K.Terrain.nearest(Cv.routes().ore.line, sp.at[0], sp.at[1]).d < 6 && sp.s > 500);
      const sOre = K.Terrain.nearest(Cv.routes().ore.line, spot.at[0], spot.at[1]).s;
      const r = kiCv('ore', sOre - 25, 12, 'elf.m');
      P.mv = K.Move.body(kiui.W, spot.at[0] - spot.fall[0] * 150, spot.at[1] - spot.fall[1] * 150, 0);
      Cv.fell(S, spot.id);
      for (let i = 0; i < 90 * 60 && !(Cv.byId(S, r.c).state === 'blocked' && Cv.byId(S, r.c).waitT > 2); i++) kiui.update(1 / 60);
      const c = Cv.byId(S, r.c), lead = c.carts[0].pos, mid = [(lead[0] + spot.at[0] + spot.fall[0] * 5.5) / 2, (lead[2] + spot.at[1] + spot.fall[1] * 5.5) / 2], eye = [mid[0] - spot.fall[1] * 11 + spot.fall[0] * 2, 0, mid[1] + spot.fall[0] * 11 + spot.fall[1] * 2];
      kiui.setView({ free: [eye[0], kiui.T.heightAt(eye[0], eye[2]) + 3.2, eye[2]], yaw: Math.atan2(mid[0] - eye[0], -(mid[1] - eye[2])), pitch: -0.2, hour: 12 });
      return { state: c.state, live: c.live, wait: c.waitT, log: S.caravans.sawn[spot.id].state };
    })()`);
    await snap('blockade');
    const rob = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, Cv = K.Caravan, c = S.caravans.list[0];
      for (const q of Cv.crewOf(S, c)) { if (q.convoy.role === 'driver') { q.state = 'surrender'; } else q.fight.life = -1; }
      kiRun(60);
      const cart = c.carts[0], b = K.basis(cart.yaw, 0);
      P.mv = K.Move.body(kiui.W, cart.pos[0] + b.right[0] * 1.9, cart.pos[2] + b.right[2] * 1.9, 0);
      kiui.yaw = Math.atan2(-b.right[0], b.right[2]);
      kiui.pitch = -0.35;
      kiui.mode = 'first';
      kiRun(2);
      kiui.useRoad({ kind: 'cart', c, i: 0 });
      return { state: c.state, why: c.why, panel: kiui.panelKind, bales: cart.bales.length };
    })()`);
    await snap('manifest');
    const took = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, Cv = K.Caravan, c = S.caravans.list[0], cart = c.carts[0];
      const first = cart.bales[0], a = kiui.cartTake(c, 0, first), b = kiui.cartTake(c, 0, cart.bales[0]), bells = kiui.cartTake(c, 0, 'bells');
      kiui.closePanel(false);
      kiui.panel = null;
      kiui.showPanel(K.Screens.cart(kiui, c, 0), 'cart');
      return { a, b, bells, kg: Cv.cargoKg(P.bag), left: cart.bales.length, robbed: c.robbed, seen: c.seen };
    })()`);
    await snap('robbed');
    const camp = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, P = S.player, r = kiCv('bread', 900, 23.5, 'villain');
      const x = r.at[0] + r.tz * 12, z = r.at[1] - r.tx * 12;
      P.mv = K.Move.body(kiui.W, x, z, 0);
      kiRun(200);
      const c = K.Caravan.byId(S, r.c), f = S.fires[0];
      kiui.setView({ free: [x, kiui.T.heightAt(x, z) + 2, z], yaw: Math.atan2(f.at[0] - x, -(f.at[2] - z)), pitch: -0.1, hour: 23.5 });
      return { state: c.state, fires: S.fires.length, live: c.live };
    })()`);
    await snap('camp');
    await cdp.eval("kiui.closePanel(false); kiui.free = null; kiui.setHero('elf.m'); kiui.rise()");
    const pass = tract.live && tract.crew >= 3 && tract.beasts === tract.carts && block.state === 'blocked' && block.log === 'down' && rob.panel === 'cart' && rob.state === 'stopped' && took.robbed && took.kg > 0 && camp.state === 'camp' && camp.fires >= 1;
    return { pass, tract, block, rob, took, camp };
  },

  async town(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const views = [
      ['market', 838, 1330, 3.2, 0, -0.08, 12], ['doctor', 815, 1351, 1.8, Math.PI, -0.05, 12], ['belfry', 786, 1344, 2, 0.46, 0.22, 12],
      ['inn-hall', 840, 1296.6, 1.6, 0, -0.12, 12, true], ['inn-room', 836.5, 1284, 1.6, -Math.PI / 2, -0.25, 12, true], ['doctor-in', 815, 1364, 1.6, Math.PI, -0.15, 12, true],
      ['workshop-in', 870, 1364, 1.6, Math.PI, -0.15, 12, true], ['mill', 1046, 1376, 3, 0.86, 0.05, 12], ['cemetery', 900, 1436, 2.2, Math.PI, -0.2, 12],
      ['hamlet', 524, 1414, 3, 0.35, -0.05, 12], ['night-market', 838, 1330, 3.2, 0, -0.08, 23], ['night-street', 842, 1352, 1.7, 0.2, -0.02, 22], ['night-inn', 840, 1296.6, 1.6, 0, -0.12, 23, true]
    ];
    const rows = [];
    for (const [name, x, z, up, yaw, pitch, hour, inside] of views) {
      const floor = await cdp.eval(`(() => {
        const o = Kirill98.Places.town(kiui.T), rooms = Object.values(o.rooms);
        const room = rooms.find(r => { const dx = ${x} - r.at[0], dz = ${z} - r.at[1], c = Math.cos(r.rot), s = Math.sin(r.rot); return Math.abs(dx * c + dz * s) < r.hw && Math.abs(-dx * s + dz * c) < r.hd; });
        return ${inside ? 'room ? room.floor : kiui.T.heightAt(' + x + ', ' + z + ')' : 'kiui.T.heightAt(' + x + ', ' + z + ')'};
      })()`);
      await cdp.eval(`kiui.setView({ free: [${x}, ${floor + up}, ${z}], yaw: ${yaw}, pitch: ${pitch}, hour: ${hour} }); kiui.hour = ${hour}; kiui.paused = false;`);
      await settle(cdp);
      await cdp.eval('kiui.hour = ' + hour + '; kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'town-' + name + '.png'), '#game');
      rows.push(name);
    }
    const talk = async (role, setup, name, after) => {
      const r = await cdp.eval(`(() => {
        const K = Kirill98, S = kiui.state, P = S.player;
        kiui.closePanel(false);
        kiui.hour = 12;
        kiui.free = null;
        kiui.mode = 'first';
        ${setup || ''}
        const q = S.people.find(p => p.role === '${role}'), o = K.Places.town(kiui.T);
        const door = q.shop && o.doors['stall-' + q.shop] || o.doors[{ inn: 'inn', doctor: 'doctor', master: 'sharnir' }[q.role]];
        const at = q.shop ? door.at : [q.mv.pos[0] + Math.sin(q.mv.yaw) * 1.6, q.mv.pos[2] - Math.cos(q.mv.yaw) * 1.6];
        P.mv = K.Move.body(kiui.W, at[0], at[1], 0);
        kiui.yaw = Math.atan2(q.mv.pos[0] - at[0], -(q.mv.pos[2] - at[1]));
        kiui.pitch = -0.08;
        kiui.openTalk(q);
        ${after || ''}
        kiui.dirty = true;
        return { panel: kiui.panelKind, purse: K.Econ.purse(P.bag) };
      })()`);
      await settle(cdp);
      await cdp.shot(path.join(out, 'town-' + name + '.png'), '#game');
      return r;
    };
    const shop = await talk('shop', "S.player.bag.push({ id: 'wolfHide', n: 2 }, { id: 'sword', n: 1 });", 'shop', "kiui.panel.querySelector('[data-buy=\"bandage\"]') && 0;");
    const bought = await cdp.eval(`(() => { const K = Kirill98, P = kiui.state.player, before = K.Econ.purse(P.bag); const line = kiui.trade('buy', 'arms', 'javelin'); return { before, after: K.Econ.purse(P.bag), line }; })()`);
    const doctor = await talk('doctor', "S.player.kit.cut = { lFore: 'bandaged' }; S.player.fight.life = 55; S.player.bag.push({ id: 'silver', n: 600 });", 'doctor');
    const cured = await cdp.eval(`(() => { const r = kiui.cure('stump'); return { line: r, cut: kiui.state.player.kit.cut.lFore }; })()`);
    const fit = await talk('master', "S.player.kit.cut = { lFore: 'healed', rShin: 'healed' }; S.player.kit.pros = {};", 'fitting', "kiui.fitting.place = 'lFore'; kiui.closePanel(false); kiui.openTalk(S.people.find(p => p.role === 'master')); kiui.fitting.place = 'lFore';");
    await cdp.eval(`(() => { kiui.panel.remove(); kiui.panel = null; kiui.showPanel(Kirill98.Screens.fit(kiui, kiui.state.people.find(p => p.role === 'master')), 'fit'); kiui.fitting = kiui.fitting || {}; kiui.dirty = true; })()`);
    await settle(cdp);
    await cdp.shot(path.join(out, 'town-fitting.png'), '#game');
    const fitted = await cdp.eval(`(() => { const K = Kirill98, P = kiui.state.player; kiui.fitting.place = 'lFore'; const a = kiui.fitPros('hook', 'buy'); kiui.fitting.place = 'rShin'; const b = kiui.fitPros('peg', 'buy'); kiui.panel.remove(); kiui.panel = null; kiui.showPanel(K.Screens.fit(kiui, kiui.fitting.keeper), 'fit'); kiui.dirty = true; return { a, b, pros: P.kit.pros }; })()`);
    await settle(cdp);
    await cdp.shot(path.join(out, 'town-fitted.png'), '#game');
    const inn = await talk('inn', '', 'inn');
    await cdp.eval("kiui.closePanel(false)");
    const pass = rows.length === views.length && shop.panel === 'shop' && bought.before - bought.after > 0 && doctor.panel === 'doctor' && cured.cut === 'healed' && fit.panel === 'fit' && fitted.pros.lFore === 'hook' && fitted.pros.rShin === 'peg' && inn.panel === 'inn';
    return { pass, rows, shop, bought, doctor, cured, fit, fitted, inn };
  },

  async world(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    for (const v of WORLD) {
      await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)};
        kiui.setView({ free: v.free || [v.at[0], kiui.T.heightAt(v.at[0], v.at[1]) + 1.65, v.at[1]], yaw: v.yaw, pitch: v.pitch, hour: v.hour });
        kiui.hour = v.hour;
        kiui.paused = false;
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.hour = ' + v.hour + '; kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'world-' + v.name + '.png'), '#game');
      const perf = await cdp.eval(`(() => {
        const gl = kiui.gpu.gl, px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px), yaw = kiui.yaw, times = [];
        kiui.draw(); sync();
        for (let k = 0; k < 60; k++) { kiui.yaw = yaw + Math.sin(k / 60 * Math.PI * 2) * 0.35; const a = performance.now(); kiui.dirty = true; kiui.draw(); sync(); times.push(performance.now() - a); }
        kiui.yaw = yaw;
        times.sort((a, b) => a - b);
        return { avg: +(times.reduce((s, x) => s + x, 0) / times.length).toFixed(2), p95: +times[Math.floor(times.length * 0.95)].toFixed(2), tris: kiui.renderer.stats.tris };
      })()`);
      rows.push({ name: v.name, perf });
    }
    const size = await cdp.eval('[kiui.width, kiui.height]');
    const info = await cdp.eval('(() => { const gl = kiui.gpu.gl, e = gl.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); })()');
    return { pass: rows.length === WORLD.length && size[1] === 600, size, renderer: info, rows };
  },

  async details(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    for (const kind of ['boulder', 'stump', 'log', 'hay', 'woodpile']) {
      const v = await cdp.eval(`(() => {
        const L = Kirill98.Detail.props(kiui.T).filter(p => p.kind === '${kind}').sort((a, b) => b.size - a.size), p = L[Math.min(L.length - 1, 3)];
        if (!p) return null;
        const a = 0.7, d = p.kind === 'woodpile' ? 5 : p.size * 3 + 3, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        kiui.setView({ free: [x, kiui.T.heightAt(x, z) + 1.7, z], yaw: Math.atan2(p.x - x, -(p.z - z)), pitch: -0.18, hour: 13 });
        kiui.hour = 13; kiui.paused = false;
        return { x: p.x, z: p.z, n: L.length };
      })()`);
      if (!v) continue;
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'details-' + kind + '.png'), '#game');
      rows.push(Object.assign({ kind }, v));
    }
    return { pass: rows.length === 5, rows };
  },

  async sky(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    for (const [name, hour, day, look, pitch] of [['dawn', 6.3, 3, 'sun', 0.12], ['morning', 9, 3, 'sun', 0.35], ['noon', 12.5, 3, 'north', 0.4], ['dusk', 20.4, 3, 'sun', 0.1], ['night-full', 23.5, 1, 'moon', 0.45], ['night-quarter', 23.5, 8, 'moon', 0.45], ['night-stars', 1.5, 15, 'north', 0.7]]) {
      const info = await cdp.eval(`(() => {
        const D = Kirill98.daylight(${hour}, ${day}), dir = '${look}' === 'sun' ? D.sunDir : '${look}' === 'moon' ? D.moonDir : [0, 0, -1];
        kiui.state.day = ${day};
        const yaw = Math.atan2(dir[0], -dir[2]);
        kiui.setView({ free: [1180, kiui.T.heightAt(1180, 1090) + 12, 1090], yaw, pitch: ${pitch}, hour: ${hour} });
        kiui.hour = ${hour}; kiui.paused = false;
        return { moon: +D.moon.toFixed(2), lit: +D.moonLit.toFixed(2) };
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'sky-' + name + '.png'), '#game');
      rows.push(Object.assign({ name }, info));
    }
    return { pass: rows.length === 7, rows };
  },

  async weather(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    const town = { at: [792, 1300], yaw: -Math.PI / 2 + 0.4, pitch: 0.06 }, field = { at: [1180, 1090], yaw: -0.6, pitch: 0.05 };
    const shots = [];
    for (const k of ['clear', 'cloudy', 'overcast', 'rain', 'storm']) {
      shots.push(Object.assign({ name: k + '-day', kind: k, hour: 13 }, town));
      shots.push(Object.assign({ name: k + '-night', kind: k, hour: 23.5 }, town));
    }
    shots.push(Object.assign({ name: 'rain-field', kind: 'rain', hour: 11 }, field));
    shots.push(Object.assign({ name: 'storm-field', kind: 'storm', hour: 16 }, field));
    shots.push(Object.assign({ name: 'fog-dawn', kind: 'fog', hour: 6.2 }, town));
    shots.push(Object.assign({ name: 'fog-field', kind: 'fog', hour: 7 }, field));
    shots.push({ name: 'rain-puddles', kind: 'storm', hour: 12, at: [806, 1300], yaw: Math.PI / 2, pitch: -0.42 });
    shots.push({ name: 'storm-flash', kind: 'storm', hour: 21, at: field.at, flash: true, pitch: 0.12 });
    shots.push({ name: 'snow-peak', kind: 'storm', hour: 12, peak: true, pitch: -0.05 });
    shots.push({ name: 'storm-indoor', kind: 'storm', hour: 13, at: [840, 1292], yaw: 0, pitch: 0, indoor: true });
    for (const v of shots) {
      const info = await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)}, K = Kirill98, S = kiui.state, T = kiui.T;
        S.wxForce = v.kind;
        S.day = 3;
        let at = v.at, yaw = v.yaw, extra = 1.65;
        if (v.peak) { let best = null; for (let x = 20; x < T.SIZE; x += 12) for (let z = 20; z < T.SIZE; z += 12) { const h = T.heightAt(x, z); if (!best || h > best.h) best = { x, z, h }; } at = [best.x, best.z]; yaw = 2.2; }
        if (v.flash) {
          const wx = K.Weather.at(S);
          for (let s = 1000; s < 3000; s += 0.01) { const b = K.Weather.bolt(S.seed || 0, s, wx); if (b && b.age > 0.02 && b.age < 0.04 && b.dist < 1400) { S.time = s; yaw = Math.atan2(b.dir[0], -b.dir[1]); break; } }
        }
        const floor = v.indoor ? K.Places.BUILDINGS.find(b => b.id === 'inn') : null;
        kiui.setView({ free: [at[0], T.heightAt(at[0], at[1]) + extra + (floor ? 0.4 : 0), at[1]], yaw, pitch: v.pitch, hour: v.hour });
        kiui.hour = v.hour;
        S.hour = v.hour;
        kiui.paused = false;
        const wv = kiui.weatherView(kiui.camera().eye);
        return { wx: wv.wx.name, rain: wv.wx.rain, mist: +wv.mist.toFixed(2), flash: +wv.flash.toFixed(2), sheltered: wv.sheltered, eyeY: +kiui.camera().eye[1].toFixed(1) };
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'weather-' + v.name + '.png'), '#game');
      rows.push(Object.assign({ name: v.name }, info, { stats: await cdp.eval('(({ rain, grass, tris }) => ({ rain, grass, tris }))(kiui.renderer.stats)') }));
    }
    await cdp.eval('kiui.state.wxForce = null');
    const indoor = rows.find(r => r.name === 'storm-indoor'), snow = rows.find(r => r.name === 'snow-peak');
    return { pass: rows.length === shots.length && indoor.sheltered && indoor.stats.rain === 0 && rows.find(r => r.name === 'storm-day').stats.rain > 0 && snow.eyeY > 195, rows };
  },

  async water(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    const shots = [
      { name: 'lake', at: [830, 214], lift: 1.5, yaw: -1.3, pitch: -0.1, hour: 11 },
      { name: 'lake-night', at: [830, 214], lift: 1.5, yaw: -1.3, pitch: -0.1, hour: 23.5, day: 1 },
      { name: 'outlet', at: [797, 238], lift: 3, yaw: 0.22, pitch: -0.16, hour: 11 },
      { name: 'cascade-below', at: [716, 337], yaw: 0.62, pitch: 0.26, hour: 14 },
      { name: 'cascade-side', at: [778, 302], lift: 2, yaw: -0.46, pitch: 0.05, hour: 14 },
      { name: 'cascade-top', at: [802, 221], yaw: -2.46, pitch: -0.22, hour: 14 },
      { name: 'ford', at: [776, 744], yaw: -2.36, pitch: -0.12, hour: 10 },
      { name: 'ford-night', at: [776, 744], yaw: -2.36, pitch: -0.12, hour: 23, day: 1 },
      { name: 'bridge', at: [800, 1346], yaw: -0.97, pitch: -0.04, hour: 15 },
      { name: 'bridge-night', at: [800, 1346], yaw: -0.97, pitch: -0.04, hour: 22.5, day: 1 },
      { name: 'swamp', at: [238, 1036], yaw: -1.75, pitch: -0.1, hour: 12 },
      { name: 'swamp-night', at: [238, 1036], yaw: -1.75, pitch: -0.1, hour: 23, day: 1 },
      { name: 'river-glint', river: 1080, face: 'sun', pitch: 0.02, hour: 19.6 },
      { name: 'river-moon', river: 1080, face: 'moon', pitch: 0.1, hour: 1.5, day: 1 },
      { name: 'river-close', at: [770, 980], yaw: Math.PI * 0.95, pitch: -0.35, hour: 12 },
      { name: 'river-air', free: [745, 150, 560], yaw: 0.05, pitch: -0.42, hour: 12 }
    ];
    for (const v of shots) {
      const info = await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)}, K = Kirill98, S = kiui.state, T = kiui.T;
        S.wxForce = 'clear';
        S.day = v.day || 3;
        let yaw = v.yaw, at = v.at;
        if (v.face) {
          const D = K.daylight(v.hour, S.day), d = v.face === 'sun' ? D.sunDir : D.moonDir, l = Math.hypot(d[0], d[2]) || 1;
          yaw = Math.atan2(d[0], -d[2]);
          if (v.river) { const cx = T.riverX(v.river); at = [cx - d[0] / l * 9, v.river - d[2] / l * 9]; }
        }
        const free = v.free || [at[0], Math.max(T.heightAt(at[0], at[1]), T.waterAt(at[0], at[1])) + 1.65 + (v.lift || 0), at[1]];
        kiui.setView({ free, yaw, pitch: v.pitch, hour: v.hour });
        kiui.hour = v.hour;
        S.hour = v.hour;
        kiui.paused = false;
        return { water: +T.waterAt(free[0], free[2]).toFixed(1), ground: +T.heightAt(free[0], free[2]).toFixed(1) };
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'water-' + v.name + '.png'), '#game');
      rows.push(Object.assign({ name: v.name }, info));
    }
    await cdp.eval('kiui.state.wxForce = null');
    return { pass: rows.length === shots.length, rows };
  },

  async edge(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    const shots = [
      { name: 'corner-nw', at: [14, 14], yaw: -0.785, pitch: 0.02 },
      { name: 'corner-ne', free: [1380, 0, 260], lift: 45, yaw: 0.7, pitch: -0.02 },
      { name: 'corner-se', at: [1522, 1522], yaw: 2.356, pitch: 0.02 },
      { name: 'corner-sw', at: [14, 1522], yaw: -2.356, pitch: 0.02 },
      { name: 'edge-north', free: [700, 0, 40], lift: 40, yaw: 0, pitch: 0.08 },
      { name: 'edge-west', at: [44, 800], yaw: -Math.PI / 2, pitch: -0.05 },
      { name: 'edge-east', at: [1524, 900], yaw: Math.PI / 2, pitch: 0 },
      { name: 'edge-south', at: [900, 1524], yaw: Math.PI, pitch: 0 },
      { name: 'river-south', at: [800, 1520], yaw: Math.PI - 0.1, pitch: -0.02 },
      { name: 'peak-north', peak: true, yaw: -0.5, pitch: 0.12 },
      { name: 'peak-south', peak: true, yaw: Math.PI, pitch: -0.1 },
      { name: 'valley-corner', free: [700, 60, 900], yaw: -2.4, pitch: -0.04 },
      { name: 'air-south', free: [768, 420, 1900], yaw: 0, pitch: -0.32, fog: 1.6 },
      { name: 'dusk-west', at: [12, 700], yaw: -Math.PI / 2, pitch: 0.03, hour: 20.2 }
    ];
    for (const v of shots) {
      const info = await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)}, S = kiui.state, T = kiui.T;
        S.wxForce = 'clear';
        S.day = 3;
        let at = v.at;
        if (v.peak) { let best = null; for (let x = 20; x < T.SIZE; x += 12) for (let z = 20; z < 400; z += 12) { const h = T.heightAt(x, z); if (!best || h > best.h) best = { x, z, h }; } at = [best.x, best.z]; }
        const free = v.lift ? [v.free[0], T.heightAt(v.free[0], v.free[2]) + v.lift, v.free[2]] : v.free || [at[0], T.heightAt(at[0], at[1]) + 1.65, at[1]], hour = v.hour || 12;
        kiui.setView({ free, yaw: v.yaw, pitch: v.pitch, hour, fogScale: v.fog });
        kiui.hour = hour;
        S.hour = hour;
        kiui.paused = false;
        return { at: free.map(c => +c.toFixed(0)) };
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'edge-' + v.name + '.png'), '#game');
      rows.push(Object.assign({ name: v.name }, info));
    }
    await cdp.eval('kiui.state.wxForce = null; kiui.setView({ fogScale: 1 })');
    return { pass: rows.length === shots.length, rows };
  },

  async look(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [], spots = [
      { name: 'ford', at: [790, 745], yaw: -1.9, pitch: 0.02 },
      { name: 'town', at: [826, 1340], yaw: 0.6, pitch: 0.02 },
      { name: 'thicket', at: [480, 640], yaw: 0.2, pitch: 0.05 },
      { name: 'pass', at: [650, 214], yaw: 2.6, pitch: -0.08 },
      { name: 'peaks', at: [900, 300], yaw: -0.3, pitch: 0.12 }
    ], times = [['day', 12, false], ['dusk', 20.3, false], ['night', 23.5, false], ['dither', 12, true]];
    for (const s of spots) for (const [tag, hour, dither] of times) {
      await cdp.eval(`(() => {
        const s = ${JSON.stringify(s)}, S = kiui.state, T = kiui.T;
        S.wxForce = 'cloudy';
        S.day = 3;
        kiui.settings.dither = ${dither};
        kiui.setView({ free: [s.at[0], T.heightAt(s.at[0], s.at[1]) + 1.65, s.at[1]], yaw: s.yaw, pitch: s.pitch, hour: ${hour} });
        kiui.hour = ${hour};
        S.hour = ${hour};
        kiui.paused = false;
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'look-' + s.name + '-' + tag + '.png'), '#game');
      rows.push(s.name + '-' + tag);
    }
    await cdp.eval('kiui.state.wxForce = null; kiui.settings.dither = false;');
    return { pass: rows.length === spots.length * times.length, rows };
  },

  async frames(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const rows = [];
    const sides = [['elf', 'elf.m', 'village'], ['guard', 'guard.m', 'book'], ['villain', 'villain', 'warTable']];
    for (const [side, hero, own] of sides) {
      await cdp.eval(`(() => { kiui.closeAll(); kiui.startSetup = { side: '${side}', hero: '${hero}', look: { face: 1, hair: 'crop', hairColor: [0.3, 0.22, 0.15] }, name: ${side === 'villain' ? "'Мрак'" : 'null'} }; kiui.startGame(); kiui.hold = false; kiui.state.campaign.intro = null; kiui.closeAll(); for (let i = 0; i < 20; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return true; })()`);
      const views = [
        ['menu', 'kiui.openMenu()'],
        ['wounds', "kiui.showPanel(Kirill98.Screens.wounds(kiui), 'yard')"],
        ['own', `kiui.showPanel(Kirill98.Screens.${own}(kiui), '${own === 'warTable' ? 'war' : own}')`],
        ['settings', "kiui.showPanel(Kirill98.Screens.settings(kiui), 'settings')"],
        ['wait', "kiui.showPanel(Kirill98.Screens.wait(kiui), 'wait')"],
        ['fallen', "kiui.showPanel(Kirill98.Screens.fallen(kiui, { title: 'Вас некому было вынести', line: 'Вы истекли кровью без сознания.', where: 'Лесная дорога', by: '' }), 'fallen')"]
      ];
      for (const [name, js] of views) {
        const okv = await cdp.eval(`(() => { try { kiui.closeAll(); ${js}; kiui.dirty = true; kiui.draw(); return (document.querySelector('.ki-side-${side}') || document.querySelector('[class*="ki-side-"]') || {}).className || 'none'; } catch (e) { return 'error: ' + e.message; } })()`);
        await sleep(250);
        await cdp.shot(path.join(out, 'frames-' + side + '-' + name + '.png'), '#game');
        rows.push({ side, name, cls: okv });
      }
      await cdp.eval('kiui.closeAll()');
    }
    return { pass: rows.every(r => !/^error|none/.test(r.cls)), rows };
  },

  async steam(cdp, out) {
    await cdp.open('/index.html');
    await cdp.until('!!(window.winManager && window.gameManager && window.appSteam && window.appIE && window.desktop && window.vfs)', 60000);
    await sleep(6000);
    const log = [];
    const ev = js => cdp.eval(`(async () => { ${js} })()`);
    await ev(`const gm = window.gameManager; for (const id of ['kirill98', 'steam']) { if (gm.isInstalled(id)) gm.uninstallGame(id); } gm.state.purchased = gm.state.purchased.filter(x => x !== 'kirill98' && x !== 'steam'); gm.state.downloaded = (gm.state.downloaded || []).filter(x => x !== 'kirill98' && x !== 'steam'); gm.saveState(); if (window.desktop) window.desktop.renderIcons(); return true;`);
    log.push({ step: 'clean', icon: await ev(`return !!document.querySelector('.desktop-icon[data-id="kirill98"]');`), run: await ev(`window.dialogs && 0; return window.gameManager.isInstalled('kirill98');`) });
    await ev(`window.appIE.open('http://www.steampowered.com'); return true;`);
    await cdp.until('!!document.querySelector(\'[data-sps="download"]\')', 30000);
    await cdp.shot(path.join(out, 'steam-1-site.png'));
    await ev(`document.querySelector('[data-sps="download"]').click(); return true;`);
    await cdp.until('window.gameManager.isDownloaded("steam")', 400000);
    await ev(`window.gameManager.openSetupWizard('steam'); return true;`);
    for (let i = 0; i < 40; i++) {
      const done = await ev(`if (window.gameManager.isInstalled('steam')) return true; const w = document.querySelector('[id^="wizard_steam"]') || document.getElementById('wizard_steam'); if (!w) return false; const b = [...w.querySelectorAll('button')].find(x => /Далее|Next|Установить|Install|Готово|Finish|Принимаю|Agree/i.test(x.textContent) && !x.disabled); if (b) b.click(); return false;`);
      if (done) break;
      await sleep(700);
    }
    log.push({ step: 'steam installed', ok: await ev(`return window.gameManager.isInstalled('steam');`) });
    await ev(`window.appSteam.open(); window.appSteam.openBuy('kirill98'); return true;`);
    await cdp.until('!!document.querySelector("[data-buy]")', 20000);
    await ev(`const f = n => document.querySelector('[data-f="' + n + '"]') || document.querySelector('input[name="' + n + '"]'); const set = (n, v) => { const e = f(n); if (e) { e.value = v; e.dispatchEvent(new Event('input')); } }; set('num', '4111 1111 1111 1111'); set('exp', '12/03'); set('cvv', '123'); const d = document.querySelector('[data-dlnow]'); if (d) d.checked = true; return true;`);
    await cdp.shot(path.join(out, 'steam-2-buy.png'));
    await ev(`document.querySelector('[data-buy]').click(); return true;`);
    await cdp.until('window.gameManager.isPurchased("kirill98") && window.appSteam.downloads && window.appSteam.downloads.has("kirill98")', 30000);
    await sleep(1500);
    await cdp.shot(path.join(out, 'steam-3-download.png'));
    await ev(`window.appSteam.completeDownload(window.appSteam.downloads.get('kirill98')); return true;`);
    await cdp.until('window.gameManager.isInstalled("kirill98")', 30000);
    await ev(`if (window.desktop) window.desktop.renderIcons(); return true;`);
    await sleep(800);
    const after = await ev(`const fs = window.vfs.resolvePath(['My Computer', 'C:', 'Games', 'KirillTheGame']); const rd = fs && fs.children && fs.children['README.TXT']; return { icon: !!document.querySelector('.desktop-icon[data-id="kirill98"]'), exe: !!(fs && fs.children && fs.children['KIRILL98.EXE']), readme: !!(rd && /джва года/.test(rd.content || '')) };`);
    log.push(Object.assign({ step: 'installed' }, after));
    await cdp.shot(path.join(out, 'steam-4-desktop.png'));
    await ev(`const el = document.querySelector('.desktop-icon[data-id="kirill98"]'); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return true;`);
    await cdp.until('window.winManager.windows.has("app_kirill98") && window.appKirill98.ui && window.appKirill98.ui.ready', 90000);
    await sleep(3000);
    await cdp.shot(path.join(out, 'steam-5-game.png'));
    log.push({ step: 'opened', ok: await ev(`return window.winManager.windows.has('app_kirill98');`) });
    await ev(`window.winManager.closeWindow('app_kirill98'); window.gameManager.uninstallGame('kirill98'); if (window.desktop) window.desktop.renderIcons(); return true;`);
    await sleep(800);
    const gone = await ev(`const fs = window.vfs.resolvePath(['My Computer', 'C:', 'Games', 'KirillTheGame']); return { icon: !!document.querySelector('.desktop-icon[data-id="kirill98"]'), folder: !!fs, owned: window.gameManager.isPurchased('kirill98') };`);
    log.push(Object.assign({ step: 'uninstalled' }, gone));
    await ev(`const gm = window.gameManager; gm.state.purchased = gm.state.purchased.filter(x => x !== 'kirill98'); gm.saveState(); return true;`);
    const pass = log[0].icon === false && log[1].ok && after.icon && after.exe && after.readme && log[3].ok && !gone.icon && !gone.folder;
    return { pass, log };
  },

  async zones(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 30000);
    const rows = [];
    for (const v of VIEWS) {
      const view = v.free ? { free: v.free, yaw: v.yaw, pitch: v.pitch, hour: v.hour, fogScale: v.fogScale } : null;
      await cdp.eval(`(() => {
        const v = ${JSON.stringify(v)};
        if (v.player) kiui.setView({ pos: v.at, yaw: v.yaw, pitch: v.pitch, hour: v.hour, mode: v.mode });
        else if (v.free) kiui.setView(${JSON.stringify(view)});
        else kiui.setView({ free: [v.at[0], kiui.T.heightAt(v.at[0], v.at[1]) + 1.65, v.at[1]], yaw: v.yaw, pitch: v.pitch, hour: v.hour });
        kiui.hour = v.hour;
        kiui.paused = false;
      })()`);
      await settle(cdp);
      await cdp.eval('kiui.hour = ' + v.hour + '; kiui.dirty = true;');
      await settle(cdp);
      await cdp.shot(path.join(out, 'zone-' + v.name + '.png'), '#game');
      rows.push({ name: v.name, stats: await cdp.eval('kiui.renderer.stats') });
    }
    return { pass: rows.length === VIEWS.length, rows };
  },

  async village(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    const start = await cdp.eval(`(() => { kiui.startSetup = { side: 'elf', hero: 'elf.f', look: { face: 2, hair: 'braid', hairColor: [0.85, 0.75, 0.5] }, name: null }; kiui.startGame(); kiui.hold = false; return { step: Kirill98.Elves.introStep(kiui.state), pos: kiui.state.player.mv.pos.slice() }; })()`);
    await step(120);
    const live = await cdp.eval('kiui.state.people.filter(q => q.villager !== undefined).length');
    await snap('village-dawn');
    const views = [
      ['village-day', { pos: [356, 712], yaw: -Math.PI / 2 - 0.25, pitch: 0.08, hour: 12, mode: 'first' }],
      ['village-oak', { pos: [345, 726], yaw: -Math.PI / 2 - 0.9, pitch: 0.32, hour: 15, mode: 'first' }],
      ['village-nests', { pos: [380, 690], yaw: -0.15, pitch: 0.42, hour: 11, mode: 'first' }],
      ['village-council', { pos: [334, 678], yaw: Math.PI + 0.3, pitch: -0.05, hour: 19.6, mode: 'first' }],
      ['village-night', { pos: [356, 730], yaw: -Math.PI / 2 - 0.4, pitch: 0.12, hour: 23.2, mode: 'first' }],
      ['village-inside', { pos: [363, 735], yaw: Math.PI / 2 - 0.1, pitch: -0.12, hour: 13, mode: 'first' }],
      ['village-training', { pos: [384, 718], yaw: Math.PI / 2 - 0.1, pitch: -0.02, hour: 9, mode: 'first' }],
      ['village-camp', { pos: [560, 312], yaw: -0.4, pitch: 0.05, hour: 14, mode: 'first' }],
      ['village-lesoseka', { pos: [676, 924], yaw: 1.0, pitch: 0.02, hour: 13, mode: 'first' }]
    ];
    for (const [name, v] of views) { await cdp.eval(`kiui.setView(${JSON.stringify(v)})`); await step(240); await snap(name); }
    await cdp.eval(`kiui.setView({ pos: [340, 712], yaw: 0, pitch: 0, hour: 10, mode: 'first' })`);
    await step(60);
    await cdp.eval(`(() => { const S = kiui.state; Kirill98.Elves.state(S).upgrades.tower = 3; Kirill98.Elves.burnFar(S, 2, Kirill98.rng(4)); kiui.showPanel(Kirill98.Screens.village(kiui), 'village'); })()`);
    await snap('village-screen');
    const villageTabs = await cdp.eval('document.querySelectorAll(".ki-village-tabs .ki-opt").length');
    await cdp.eval('kiui.closePanel(false)');
    const talks = await cdp.eval(`(() => { const S = kiui.state, find = r => S.people.find(q => q.role === r); const e = find('elder'); kiui.state.campaign.intro = null; kiui.setView({ pos: [e.mv.pos[0] + 1.6, e.mv.pos[2] + 1.0], yaw: Math.atan2(-1.6, 1.0), pitch: -0.1, hour: 10 }); kiui.openTalk(e); return { panel: kiui.panelKind, tasks: document.querySelectorAll('.ki-council-task').length }; })()`);
    await snap('village-council-panel');
    await cdp.eval('kiui.closePanel(false); kiui.showPanel(Kirill98.Screens.store(kiui), "store")');
    await snap('village-store');
    await cdp.eval(`(() => { kiui.closePanel(false); const S = kiui.state, q = S.people.find(x => x.role === 'carver'); S.player.kit.cut = { lFore: 'healed' }; S.standing.respect = 45; kiui.openTalk(q); })()`);
    await step(30);
    await snap('village-yasen');
    const fit = await cdp.eval('[...document.querySelectorAll(".ki-fit-card .ki-fit-name")].map(e => e.textContent)');
    await cdp.eval('kiui.closePanel(false); kiui.state.player.kit.cut = {}; kiui.fitting = null');
    const pass = start.step === 'wake' && live >= 40 && villageTabs === 4 && talks.panel === 'council' && talks.tasks >= 3 && fit.some(t => /Резная рука/.test(t));
    return { pass, start, live, villageTabs, talks, fit };
  },

  async raid(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    await cdp.eval(`(() => { kiui.startSetup = { side: 'elf', hero: 'elf.m', look: { face: 0, hair: 'long', hairColor: [0.55, 0.38, 0.22] }, name: null }; kiui.startGame(); kiui.state.campaign.intro = null; kiui.state.hour = 21.5; kiui.hold = false; })()`);
    await step(60);
    await cdp.eval(`(() => { const S = kiui.state, L = Kirill98.Elves; L.ignite(S, 'izba-6'); S.village.houses['izba-6'].fire = 0.9; L.ignite(S, 'izba-olha'); S.village.houses['izba-olha'].fire = 0.6; const W = kiui.W; for (let k = 0; k < 4; k++) { const p = Kirill98.Body.member(S.nextId++, 'guard', 300 - k * 2, 690 + k * 2, Math.PI / 2, W); p.role = 'raider'; p.fight.torch = k < 2; p.anim = Kirill98.Anim.state(); p.frames = new Float32Array(132); S.people.push(p); } kiui.setView({ pos: [352, 740], yaw: -0.25, pitch: 0.12, hour: 21.6, mode: 'first' }); })()`);
    await step(180);
    const alarm = await cdp.eval('({ alarm: kiui.state.village.alarm, fire: Kirill98.Elves.burning(kiui.state).length, goal: document.querySelector(".ki-goal").textContent, icons: [...document.querySelectorAll(".ki-alarm b.on")].length })');
    await snap('raid-fire');
    await cdp.eval(`(() => { const S = kiui.state, w = Kirill98.Places.town(kiui.T).wells[0]; kiui.setView({ pos: [w.at[0] + 1.2, w.at[1] + 0.3], yaw: -Math.PI / 2, pitch: -0.25, hour: 21.6, mode: 'first' }); })()`);
    await step(10);
    const prompt = await cdp.eval('document.querySelector(".ki-prompt").textContent');
    await cdp.eval('kiui.useFixture(kiui.fix || kiui.fixture())');
    const bucket = await cdp.eval('kiui.state.player.bucket');
    await snap('raid-well');
    const chain = await cdp.eval(`Kirill98.Elves.call(kiui.state, [340, 0, 748])`);
    await step(600);
    await snap('raid-chain');
    await cdp.eval(`(() => { const S = kiui.state; Object.assign(S.village.houses['izba-7'], { hp: 0, fire: 0, burnt: true }); Kirill98.Elves.sync(S); kiui.setView({ pos: [318, 742], yaw: Math.PI - 0.3, pitch: -0.05, hour: 13, mode: 'first' }); })()`);
    await step(60);
    await snap('raid-burnt');
    await cdp.eval(`(() => { const S = kiui.state, P = S.player; P.bag.push({ id: 'stakes', n: 1 }, { id: 'snare', n: 1 }); kiui.setView({ pos: [420, 692], yaw: Math.PI / 2, pitch: -0.5, hour: 13, mode: 'first' }); Kirill98.Elves.place(S, P, 'pit'); P.mv.yaw = Math.PI / 2 + 1.8; Kirill98.Elves.place(S, P, 'snare'); kiui.yaw = Math.PI / 2 + 0.6; })()`);
    await step(20);
    await snap('raid-traps');
    const traps = await cdp.eval('kiui.state.village.traps.filter(t => t.armed).length');
    await cdp.eval(`(() => { const S = kiui.state, V = S.world.sides.villain; V.ladders = 4; V.ram = 1; kiui.setView({ pos: [566, 306], yaw: 0.73, pitch: -0.25, hour: 14, mode: 'first' }); })()`);
    await step(30);
    await snap('raid-cutters');
    await cdp.eval(`(() => { const S = kiui.state; S.campaign.ending = null; S.campaign.rescues = [{ by: 'Ольха', who: 'вас', day: 12 }, { by: 'вы', who: 'Вереск', day: 20 }]; S.village.oak.push('Терн', 'Ива'); const e = Kirill98.Elves.finish(S); S.village.endingNew = false; kiui.showPanel(Kirill98.Screens.ending(kiui, e), 'ending'); })()`);
    await snap('raid-ending');
    const ending = await cdp.eval('document.querySelector(".ki-ending-name").textContent');
    const pass = alarm.fire >= 1 && alarm.icons >= 1 && /колодц|ведро/i.test(prompt) && bucket === 'full' && chain > 0 && traps === 2 && !!ending;
    return { pass, alarm, prompt, bucket, chain, traps, ending };
  },

  async palace(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    const start = await cdp.eval(`(() => { kiui.startSetup = { side: 'guard', hero: 'guard.m', look: { face: 1, hair: 'crop', hairColor: [0.3, 0.22, 0.15] }, name: null }; kiui.startGame(); kiui.hold = false; return { step: Kirill98.Guard.introStep(kiui.state), hour: kiui.state.hour, goal: Kirill98.Guard.introGoal(kiui.state) }; })()`);
    await step(30);
    const live = await cdp.eval('kiui.state.people.filter(q => q.guardman !== undefined).length');
    await cdp.eval(`kiui.setView({ pos: [1203, 731.2], yaw: Math.PI + 0.35, pitch: -0.08, hour: 6.8, mode: 'first' })`);
    await step(10);
    await snap('palace-barracks');
    await cdp.eval(`(() => { const S = kiui.state, Gd = Kirill98.Guard; S.hour = 6.95; for (const q of S.people) { if (q.guardman === undefined) continue; const s = Gd.spotFor(S, Gd.state(S).people[q.guardman]); q.mv = Kirill98.Move.body(kiui.W, s.at[0], s.at[1], s.face); q.act = { kind: 'stand', post: s.at.slice(), face: s.face }; } kiui.setView({ pos: [1219.5, 709], yaw: 0, pitch: 0.02, hour: 6.95, mode: 'first' }); })()`);
    await step(20);
    await snap('palace-muster');
    const line = await cdp.eval(`kiui.state.people.filter(q => q.guardman !== undefined && Kirill98.Guard.state(kiui.state).people[q.guardman].ten && Math.abs(q.mv.pos[2] - 697) < 1.5).length`);
    await cdp.eval(`(() => { const S = kiui.state, Gd = Kirill98.Guard, PP = Kirill98.Places.PALACE_PTS; S.campaign.intro = null; S.hour = 9; const G = Gd.state(S); G.order = Gd.makeOrder(S, kiui.rnd, 'gate'); kiui.setView({ pos: [PP.gate[0] + 2, PP.gate[1] + 1.5], yaw: -Math.PI / 2 + 0.2, pitch: 0.02, hour: 9, mode: 'first' }); })()`);
    await step(480);
    const queue = await cdp.eval('kiui.state.people.filter(q => q.visitor && q.visitor.state === "queue").length');
    await snap('palace-gate');
    await cdp.eval(`(() => { const S = kiui.state, Gd = Kirill98.Guard, spy = Gd.state(S).visitors.list.find(v => v.spy) || Gd.state(S).visitors.list[0], q = S.people.find(x => x.visitor && x.visitor.state === 'queue'); q.visitor = Object.assign(spy, { state: 'queue', spy: true, fake: true, signs: ['печать', 'сума'], items: ['bread', 'rope'], answer: { from: 'из форта', to: spy.to, why: spy.purpose } }); q.sack = [{ id: 'bread', n: 1 }, { id: 'rope', n: 1 }]; kiui.showPanel(Kirill98.Screens.pass(kiui, q), 'pass'); })()`);
    await cdp.eval('document.querySelector(".ki-pass [data-q]") && document.querySelector(".ki-pass [data-q]").click()');
    await snap('palace-pass');
    const paper = await cdp.eval('({ panel: kiui.panelKind, seals: !!document.querySelector(".ki-pass canvas[data-seal]"), buttons: document.querySelectorAll(".ki-pass-foot .ki-btn").length })');
    await cdp.eval('document.querySelector(".ki-pass-foot [data-how=hold]").click()');
    const held = await cdp.eval('({ service: kiui.state.standing.service, panel: kiui.panelKind || null })');
    await cdp.eval(`(() => { const S = kiui.state, Gd = Kirill98.Guard; Gd.note(S, 2, 'стоял у ворот'); Gd.note(S, -1, 'отбился от строя'); Gd.state(S).order = null; S.day = 3; Gd.note(S, 1, 'дозор пройден'); Gd.state(S).gramota = true; kiui.showPanel(Kirill98.Screens.book(kiui), 'book'); })()`);
    await snap('palace-book');
    const book = await cdp.eval('document.querySelectorAll(".ki-book-day p").length');
    await cdp.eval(`(() => { const S = kiui.state, Gd = Kirill98.Guard; kiui.closePanel(true); Gd.state(S).trophies = { day: 3, rule: 'hand', taken: [['sword', 1]], handed: false }; const q = S.people.find(x => x.role === 'quarter'); kiui.setView({ pos: [1342, 721.6], yaw: Math.PI, pitch: -0.05, hour: 16, mode: 'first' }); kiui.showPanel(Kirill98.Screens.armory(kiui, q), 'armory'); })()`);
    await step(5);
    await snap('palace-armory');
    await cdp.eval(`(() => { kiui.closePanel(true); kiui.setView({ pos: [1292.5, 640], yaw: Math.PI / 2, pitch: 0.06, hour: 12, mode: 'first' }); })()`);
    await step(20);
    await snap('palace-throne');
    await cdp.eval(`kiui.setView({ free: [1172, 62, 778], yaw: 0.71, pitch: -0.34, hour: 11 })`);
    await step(5);
    await snap('palace-yard');
    await cdp.eval(`kiui.setView({ pos: [1298, 1004], yaw: Math.PI / 2 + 0.3, pitch: 0.04, hour: 14, mode: 'first' })`);
    await step(20);
    await snap('palace-tsarevo');
    await cdp.eval(`kiui.setView({ pos: [1232, 414], yaw: Math.PI / 2 - 0.35, pitch: 0.04, hour: 13, mode: 'first' })`);
    await step(20);
    await snap('palace-outpost');
    await cdp.eval(`kiui.setView({ pos: [771, 744], yaw: Math.PI / 2 - 0.25, pitch: 0.2, hour: 16, mode: 'first' })`);
    await step(20);
    await snap('palace-ford');
    const ok = start.step === 'muster' && start.hour === 6.75 && live >= 25 && line >= 8 && queue >= 1 && paper.panel === 'pass' && paper.seals && paper.buttons === 3 && book >= 3 && held.service === 2;
    return { pass: ok, start, live, line, queue, paper, held, book };
  },

  async siege(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    await cdp.eval(`(() => { kiui.startSetup = { side: 'guard', hero: 'guard.m', look: { face: 1, hair: 'crop', hairColor: [0.3, 0.22, 0.15] }, name: null }; kiui.startGame(); kiui.hold = false; const S = kiui.state; S.campaign.intro = null; S.day = 20; S.hour = 15; Kirill98.Guard.state(S).order = null; })()`);
    await step(30);
    const setup = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, W = kiui.W, Wo = K.World, PP = K.Places.PALACE_PTS, E = Wo.state(S), G = K.Guard.state(S);
      Object.assign(E.sides.villain, { ladders: 4, ram: 1, intel: 2 });
      E.assault = { day: 20, n: 46 };
      const g = Wo.launch(S, 'villain', 'assault', [1092, 700], Wo.POSTS.palace.gate, 46, { target: 'palace' });
      kiui.update(1 / 60);
      S.people.filter(q => q.march && q.march.id === g.id).forEach((q, i) => { q.mv = K.Move.body(W, 1112 + Math.floor(i / 8) * 4 + (i % 2), 666 + (i % 8) * 8.5, Math.PI / 2); });
      const alive = () => S.people.filter(q => q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - PP.gate[0], q.mv.pos[2] - PP.gate[1]) < 260).length + 1;
      let k = 0;
      while (alive() < 80) { const w = PP.wall[k % 2], q = K.Body.member(S.nextId++, 'guard', w[0] + 4 + (k % 3) * 1.4, w[1] - 8 + Math.floor(k / 3) * 2.2, -Math.PI / 2, W); q.fight = K.Combat.fighter({ weapon: k % 2 ? 'spear' : 'sword', shield: k % 2 === 0 }); q.anim = K.Anim.state(); q.frames = new Float32Array(132); S.people.push(q); k++; }
      kiui.update(1 / 60);
      return { alive: alive(), all: S.people.length, ladders: G.ladders.length, ram: !!(G.siege && G.siege.ram), lurkers: G.siege ? G.siege.lurkers : 0, gate: W.dyn.some(b => b.id === 'palace-gate-door') };
    })()`);
    await step(120);
    await cdp.eval(`kiui.setView({ free: [1112, 36, 742], yaw: 0.78, pitch: -0.12, hour: 15 })`);
    await step(2);
    await snap('siege-walls');
    await cdp.eval(`kiui.setView({ pos: [1172, 700], yaw: -Math.PI / 2, pitch: 0.06, hour: 15, mode: 'first' })`);
    await step(60);
    await snap('siege-gate');
    const L0 = await cdp.eval('kiui.state.guard.ladders[0].top');
    await cdp.eval(`kiui.setView({ pos: [${L0[0]}, ${L0[1]}], yaw: -Math.PI / 2, pitch: -0.55, hour: 15, mode: 'first' })`);
    await step(3);
    const prompt = await cdp.eval('(document.querySelector(".ki-prompt") || {}).textContent || ""');
    await snap('siege-ladder');
    await cdp.eval('kiui.useFixture(kiui.fix || kiui.fixture())');
    await step(20);
    const down = await cdp.eval('kiui.state.guard.ladders.filter(L => !L.up).length');
    await snap('siege-ladder-down');
    const perf = await cdp.eval(`(async () => {
      const gl = kiui.gpu.gl, info = gl.getExtension('WEBGL_debug_renderer_info'), px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      kiui.setView({ pos: [1172, 700], yaw: -Math.PI / 2, pitch: 0.06, hour: 15, mode: 'first' });
      kiui.state.wxForce = ${process.argv.includes('--storm') ? "'storm'" : 'null'};
      kiui.update(1 / 60); kiui.draw(); sync();
      const frame = [], tick = [];
      for (let k = 0; k < 120; k++) {
        kiui.yaw = -Math.PI / 2 + Math.sin(k / 120 * Math.PI * 2) * 0.9;
        const a = performance.now();
        kiui.update(1 / 60);
        const b = performance.now();
        kiui.dirty = true; kiui.draw(); sync();
        tick.push(b - a); frame.push(performance.now() - a);
      }
      const st = v => { v.sort((x, y) => x - y); return { avg: +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(1), p95: +v[Math.floor(v.length * 0.95)].toFixed(1) }; };
      return { renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), alive: kiui.state.people.filter(q => q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - 1153, q.mv.pos[2] - 704) < 260).length + 1, all: kiui.state.people.length, frame: st(frame), tick: st(tick), people: kiui.renderer.stats.people, tris: kiui.renderer.stats.tris };
    })()`);
    await snap('siege-fight');
    const ok = setup.alive >= 80 && setup.ladders === 4 && setup.ram && setup.lurkers === 2 && setup.gate && /лестниц/i.test(prompt) && down >= 1;
    return { pass: ok, setup, prompt, down, perf };
  },

  async fort(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    const start = await cdp.eval(`(() => { kiui.startSetup = { side: 'villain', hero: 'villain', look: Kirill98.Save.lookOf(Kirill98.Body.HEROES.villain.kit), name: 'Ворон' }; kiui.startGame(); kiui.hold = false; return { step: Kirill98.Villain.introStep(kiui.state), hour: kiui.state.hour, name: kiui.state.player.name, goal: Kirill98.Villain.introGoal(kiui.state) }; })()`);
    await step(40);
    const live = await cdp.eval('kiui.state.people.filter(q => q.soldier !== undefined).length');
    await cdp.eval(`kiui.setView({ pos: [962, 93], yaw: Math.PI - 0.15, pitch: -0.12, hour: 22.1, mode: 'first' })`);
    await step(10);
    await snap('fort-hall');
    await cdp.eval(`(() => { const q = kiui.state.people.find(x => x.role === 'scribe'); kiui.openTalk(q); })()`);
    await snap('fort-gus');
    await cdp.eval('kiui.closePanel(true)');
    const yard = await cdp.eval(`({ step: Kirill98.Villain.introStep(kiui.state), hour: kiui.state.hour })`);
    await cdp.eval(`(() => { const S = kiui.state, V = Kirill98.Villain; for (const q of S.people) { if (q.soldier === undefined) continue; const s = V.spotFor(S, S.army.people[q.soldier]); q.mv = Kirill98.Move.body(kiui.W, s.at[0], s.at[1], s.face); q.act = { kind: 'stand', post: s.at.slice(), face: s.face }; } kiui.setView({ pos: [962, 97], yaw: Math.PI, pitch: 0.02, hour: 7, mode: 'first' }); })()`);
    await step(60);
    await snap('fort-yard');
    await cdp.eval(`(() => { const q = kiui.state.people.find(x => x.soldier === Kirill98.Villain.KEY.length); kiui.openTalk(q); })()`);
    await snap('fort-hvosh');
    const hv = await cdp.eval('kiui.panelKind + (document.querySelectorAll(".ki-vtalk [data-hv]").length === 2 ? ":choice" : "")');
    await cdp.eval('document.querySelector(".ki-vtalk [data-hv=\\"1\\"]") && document.querySelector(".ki-vtalk [data-hv=\\"1\\"]").click()');
    await cdp.eval('kiui.closePanel(true)');
    await step(30);
    await cdp.eval(`kiui.setView({ pos: [975, 106], yaw: Math.PI / 2 + 0.3, pitch: -0.05, hour: 8, mode: 'first' })`);
    await step(30);
    await snap('fort-drill');
    await cdp.eval(`(() => { const S = kiui.state, I = S.campaign.intro; I.step = 'table'; for (const i of I.squad || []) { const q = S.people.find(x => x.soldier === i); if (q) q.squad = null; } S.squad = null; kiui.setView({ pos: [962, 90.8], yaw: Math.PI, pitch: -0.3, hour: 9, mode: 'first' }); })()`);
    await step(5);
    await cdp.eval('kiui.openWar()');
    await snap('fort-table-first');
    const first = await cdp.eval('({ panel: kiui.panelKind, btn: !!document.querySelector(".ki-war [data-act=sortie]") })');
    await cdp.eval('kiui.closePanel(true)');
    await cdp.eval(`(() => { const S = kiui.state, A = S.army; S.campaign.intro = null; A.table = true; const V = Kirill98.Villain; V.order(S, 'krivoy', 'logging', 'cutters', { W: kiui.W }); A.reports.push({ day: 2, squad: 'pen', order: 'raid', target: 'tsarevo', lost: ['Обух'], wounded: ['Лом'], back: 10, loot: { silver: 60, bread: 30, logs: 0, iron: 0 }, intel: 0, recruits: 0 }); A.share = { silver: 30, squad: 'pen', men: [7, 8, 9] }; kiui.war = { squad: 'pen', kind: 'raid', target: 'korni', lead: false, tab: 'map', said: '' }; kiui.openWar(); })()`);
    await snap('fort-war');
    const war = await cdp.eval('({ panel: kiui.panelKind, squads: document.querySelectorAll(".ki-war-squads .ki-opt").length, orders: document.querySelectorAll(".ki-war-orders .ki-opt").length, rows: document.querySelectorAll(".ki-war-row").length })');
    await cdp.eval('document.querySelector(".ki-war [data-act=tab]").click()');
    await snap('fort-army');
    const army = await cdp.eval('document.querySelectorAll(".ki-war-army tr").length');
    await cdp.eval('kiui.closePanel(true)');
    await cdp.eval(`kiui.setView({ pos: [945, 116.5], yaw: Math.PI - 0.2, pitch: -0.1, hour: 12, mode: 'first' })`);
    await step(20);
    await snap('fort-forge');
    await cdp.eval(`(() => { const S = kiui.state, ev = []; S.hour = 23.2; Kirill98.Villain.raid(S, kiui.W, 'arson', ev); kiui.setView({ pos: [956, 110], yaw: -Math.PI / 2 - 0.6, pitch: 0.04, hour: 23.2, mode: 'first' }); })()`);
    await step(40);
    await snap('fort-night');
    const night = await cdp.eval('({ sab: kiui.state.army.saboteurs.length, fire: Kirill98.Villain.flames(kiui.state).length })');
    await cdp.eval(`kiui.setView({ free: [880, 168, 175], yaw: 0.72, pitch: -0.2, hour: 15 })`);
    await step(5);
    await snap('fort-walls');
    await cdp.eval(`kiui.setView({ pos: [1080, 226], yaw: Math.PI + 0.2, pitch: 0.05, hour: 14, mode: 'first' })`);
    await step(20);
    await snap('fort-mines');
    await cdp.eval(`kiui.setView({ pos: [648, 214], yaw: 0.9, pitch: 0.04, hour: 13, mode: 'first' })`);
    await step(20);
    await snap('fort-pass');
    await cdp.eval(`kiui.setView({ pos: [1166, 210], yaw: -Math.PI / 2 - 0.3, pitch: -0.08, hour: 16, mode: 'first' })`);
    await step(20);
    await snap('fort-goat');
    const pass = start.step === 'hall' && start.name === 'Ворон' && live >= 30 && yard.step === 'yard' && hv === 'talk:choice' && first.panel === 'war' && first.btn && war.squads === 4 && war.orders === 7 && army >= 30 && night.sab === 2 && night.fire > 0;
    return { pass, start, live, yard, hv, first, war, army, night };
  },

  async storm(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 2', 60000);
    const step = n => cdp.eval(`(() => { for (let i = 0; i < ${n}; i++) kiui.update(1 / 60); kiui.dirty = true; kiui.draw(); return kiui.frames; })()`);
    const snap = async (name, sel) => { await cdp.eval('kiui.dirty = true; kiui.draw()'); await kiStill(cdp); await cdp.shot(path.join(out, name + '.png'), sel || '#game'); };
    await cdp.eval(`(() => { kiui.startSetup = { side: 'villain', hero: 'villain', look: Kirill98.Save.lookOf(Kirill98.Body.HEROES.villain.kit), name: 'Ворон' }; kiui.startGame(); kiui.hold = false; const S = kiui.state; S.campaign.intro = null; Kirill98.Villain.state(S).table = true; S.day = 24; S.hour = 14; })()`);
    await step(20);
    const setup = await cdp.eval(`(() => {
      const K = Kirill98, S = kiui.state, W = kiui.W, E = K.World.state(S), V = E.sides.villain, PP = K.Places.PALACE_PTS;
      Object.assign(V, { ladders: 3, ram: 1, intel: 2 });
      const ev = [], r = K.Villain.startAssault(S, W, 'forest', ev);
      const g = E.groups.find(x => x.id === r.group.id);
      g.via = null; g.from = [1092, 700]; g.line = null; g.s = 0;
      S.player.mv = K.Move.body(W, 1104, 712, Math.PI / 2);
      kiui.yaw = Math.PI / 2;
      for (let i = 0; i < 3; i++) kiui.update(1 / 60);
      S.people.filter(q => q.march && q.march.id === g.id).forEach((q, i) => { q.mv = K.Move.body(W, 1110 + Math.floor(i / 8) * 4 + (i % 2), 670 + (i % 8) * 8, Math.PI / 2); });
      for (let i = 0; i < 3; i++) kiui.update(1 / 60);
      return { ok: r.ok, n: r.group ? r.group.n : 0, ladders: S.guard && S.guard.ladders.length, siege: !!(S.guard && S.guard.siege), goal: kiui.villainLine() };
    })()`);
    await step(120);
    await cdp.eval(`kiui.setView({ pos: [1100, 716], yaw: Math.PI / 2 - 0.25, pitch: 0.12, hour: 14, mode: 'first' })`);
    await step(30);
    await snap('storm-field');
    const L0 = await cdp.eval('kiui.state.guard.ladders[0].at');
    await cdp.eval(`kiui.setView({ pos: [${L0[0] - 0.8}, ${L0[1]}], yaw: Math.PI / 2, pitch: 0.5, hour: 14, mode: 'first' })`);
    await step(3);
    const climbPrompt = await cdp.eval('(document.querySelector(".ki-prompt") || {}).textContent || ""');
    await snap('storm-ladder');
    await cdp.eval(`(() => { kiui.state.player.mv = Kirill98.Move.body(kiui.W, ${L0[0] - 0.8}, ${L0[1]}, Math.PI / 2); kiui.useFixture({ kind: 'climb' }); })()`);
    await step(10);
    const onWall = await cdp.eval('kiui.state.player.mv.pos[1]');
    await cdp.eval(`kiui.yaw = Math.PI / 2; kiui.pitch = -0.3`);
    await snap('storm-wall');
    await cdp.eval(`(() => { const S = kiui.state; S.guard.gate.hp = 0; kiui.setView({ pos: [1230, 655], yaw: Math.PI, pitch: 0.3, hour: 14, mode: 'first' }); })()`);
    await step(10);
    const bannerPrompt = await cdp.eval('(document.querySelector(".ki-prompt") || {}).textContent || ""');
    await snap('storm-tower');
    await cdp.eval(`(() => { kiui.state.player.mv = Kirill98.Move.body(kiui.W, 1230, 655, Math.PI); kiui.useFixture({ kind: 'banner' }); })()`);
    await step(30);
    const end = await cdp.eval('({ result: Kirill98.World.state(kiui.state).assault && Kirill98.World.state(kiui.state).assault.result, ending: kiui.state.campaign.ending && kiui.state.campaign.ending.id, panel: kiui.panelKind })');
    await snap('storm-ending');
    const pass = setup.ok && setup.siege && /стену/.test(climbPrompt) && onWall > 34 && /знамя/i.test(bannerPrompt) && end.result === 'taken' && !!end.ending && end.panel === 'ending';
    return { pass, setup, climbPrompt, onWall, bannerPrompt, end };
  },

  async screens(cdp, out) {
    await cdp.open('/kirill98.html');
    await cdp.eval(`new Promise(r => { try { localStorage.removeItem('kirill98_settings'); } catch (e) { } const q = indexedDB.deleteDatabase('kirill98'); q.onsuccess = q.onerror = q.onblocked = () => r(true); })`);
    await cdp.open('/kirill98.html?fresh');
    await cdp.until('!!window.kiui && kiui.ready && kiui.panelKind === "title" && !!document.querySelector(".ki-title canvas")', 60000);
    const zoneAt = (sel, verb, z) => cdp.eval(`(() => { const c = document.querySelector(${JSON.stringify(sel)}), r = c.getBoundingClientRect(), p = kiui.mapCache.title.centers[${z}], x = r.left + p[0] / 384 * r.width, y = r.top + (p[1] + 26) / 384 * r.height; c.dispatchEvent(new MouseEvent(${JSON.stringify(verb)}, { clientX: x, clientY: y, bubbles: true })); return (document.querySelector('.ki-title-card') || {}).textContent || ''; })()`);
    const tap = sel => cdp.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
    const card3 = await zoneAt('.ki-title canvas', 'mousemove', 3);
    await sleep(150);
    await cdp.shot(path.join(out, 'screens-title.png'), '#game');
    const card1 = await zoneAt('.ki-title canvas', 'mousemove', 1);
    await zoneAt('.ki-title canvas', 'click', 1);
    const zone1 = await cdp.eval('kiui.panelKind');
    await cdp.shot(path.join(out, 'screens-title-zone1.png'), '#game');
    await zoneAt('.ki-title canvas', 'click', 3);
    await cdp.until('!!document.querySelector(".ki-pond")', 8000);
    for (const s of ['[data-hero="elf.f"]', '[data-face="2"]', '[data-hair="braid"]', '[data-color="3"]']) await tap('.ki-pond ' + s);
    await sleep(200);
    await cdp.shot(path.join(out, 'screens-pond.png'), '#game');
    await tap('.ki-pond [data-act=back]');
    await zoneAt('.ki-title canvas', 'click', 2);
    await cdp.until('!!document.querySelector(".ki-muster")', 8000);
    for (const s of ['[data-hero="guard.f"]', '[data-face="1"]', '[data-color="2"]']) await tap('.ki-muster ' + s);
    await sleep(200);
    await cdp.shot(path.join(out, 'screens-muster.png'), '#game');
    await tap('.ki-muster [data-act=back]');
    await zoneAt('.ki-title canvas', 'click', 4);
    await cdp.until('!!document.querySelector(".ki-chronicle")', 8000);
    await tap('.ki-chronicle [data-act=go]');
    const noName = await cdp.eval('kiui.panelKind === "start" && /впишите/.test(document.querySelector(".ki-chronicle-note").textContent)');
    await cdp.eval(`(() => { const i = document.querySelector('.ki-chronicle input'); i.value = 'Тестов'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await cdp.shot(path.join(out, 'screens-chronicle.png'), '#game');
    await tap('.ki-chronicle [data-act=back]');
    await zoneAt('.ki-title canvas', 'click', 3);
    await cdp.until('!!document.querySelector(".ki-pond")', 8000);
    for (const s of ['[data-hero="elf.f"]', '[data-face="2"]', '[data-hair="braid"]', '[data-color="3"]']) await tap('.ki-pond ' + s);
    await tap('.ki-pond [data-act=go]');
    await cdp.until('kiui.playing && !kiui.panel && !kiui.menu', 8000);
    await settle(cdp);
    const started = await cdp.eval('(() => { const P = kiui.state.player; return { team: P.team, hero: P.kit.hero, face: P.kit.face, hair: P.kit.hair, zone: kiui.zone, hour: Math.floor(kiui.state.hour), visited: kiui.state.visited.slice() }; })()');
    await cdp.shot(path.join(out, 'screens-start-elf.png'), '#game');
    await cdp.eval('kiui.openMenu()');
    await sleep(150);
    await cdp.shot(path.join(out, 'screens-pause.png'), '#game');
    await tap('.ki-menu [data-act=save]');
    await cdp.until('!!document.querySelector(".ki-slots-save .ki-slot")', 5000);
    await tap('.ki-slots [data-slot=slot1]');
    await cdp.until('/Сохранено/.test(document.querySelector(".ki-slots-note").textContent) && !!document.querySelector(".ki-slots [data-slot=slot1] img")', 8000);
    await cdp.shot(path.join(out, 'screens-slots-save.png'), '#game');
    await tap('.ki-slots [data-slot=slot1]');
    const ask = await cdp.eval('!!document.querySelector(".ki-slot.ask")');
    await tap('.ki-slots [data-act=back]');
    await tap('.ki-menu [data-act=settings]');
    await cdp.until('!!document.querySelector(".ki-settings fieldset")', 5000);
    await tap('.ki-settings [data-key=lines][data-val="600"]');
    await tap('.ki-settings [data-key=difficulty][data-val=hard]');
    await cdp.eval('document.querySelector(".ki-settings [data-flag=dither]").click()');
    await sleep(150);
    await cdp.shot(path.join(out, 'screens-settings.png'), '#game');
    const set = await cdp.eval('({ lines: kiui.lines, height: kiui.height, dither: kiui.settings.dither, rules: kiui.rules().heavy, stored: JSON.parse(localStorage.getItem("kirill98_settings")).difficulty })');
    await tap('.ki-settings [data-act=back]');
    await cdp.eval('kiui.closeMenu(false); kiui.setView({ pos: [316, 712], yaw: 1.0, pitch: 0.05, hour: 8 })');
    await settle(cdp);
    await cdp.shot(path.join(out, 'screens-dither.png'), '#game');
    const levels = () => cdp.eval(`(() => { kiui.draw(); const src = document.querySelector('.ki-canvas'), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data, off = (v, n) => Math.abs(v * n / 255 - Math.round(v * n / 255)) > n / 510 + 0.01; let bad = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { n++; if (off(d[i], 31) || off(d[i + 1], 63) || off(d[i + 2], 31)) bad++; } return +(bad / n).toFixed(3); })()`);
    const dithered = await levels();
    await cdp.eval('kiui.setOption("dither", false)');
    const plain = await levels();
    await cdp.eval('kiui.setOption("dither", false); kiui.setOption("lines", 480); kiui.setOption("difficulty", "normal"); kiui.setView({ pos: [850, 1330], yaw: 0.6, pitch: 0, hour: 12 })');
    await settle(cdp);
    await cdp.eval('kiui.openMap()');
    await cdp.until('!!document.querySelector(".ki-map canvas")', 5000);
    const trip = await cdp.eval(`(() => { const c = document.querySelector('.ki-map canvas'), r = c.getBoundingClientRect(), s = Kirill98.Places.SPOTS.find(q => q.id === 'korni'), x = r.left + s.at[0] / 1536 * r.width, y = r.top + s.at[1] / 1536 * r.height; c.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true })); return document.querySelector('.ki-map-trip').textContent; })()`);
    await cdp.shot(path.join(out, 'screens-map.png'), '#game');
    await cdp.key('m', 'KeyM', 77);
    const mapClosed = await cdp.eval('!kiui.panel');
    const saved = await cdp.eval(`kiui.saveTo('slot2').then(why => ({ why, pos: kiui.state.player.mv.pos.slice(), day: kiui.state.day, visited: kiui.state.visited.slice(), hero: kiui.state.player.kit.hero, face: kiui.state.player.kit.face }))`);
    await cdp.open('/kirill98.html?again');
    await cdp.until('!!window.kiui && kiui.ready && kiui.panelKind === "title" && !document.querySelector(".ki-title [data-act=continue]").hidden', 60000);
    await tap('.ki-title [data-act=continue]');
    await cdp.until('kiui.playing && !kiui.panel', 10000);
    const back = await cdp.eval('({ pos: kiui.state.player.mv.pos.slice(), day: kiui.state.day, visited: kiui.state.visited.slice(), hero: kiui.state.player.kit.hero, face: kiui.state.player.kit.face })');
    await cdp.eval('kiui.openTitle()');
    await tap('.ki-title [data-act=load]');
    await cdp.until('document.querySelectorAll(".ki-slots-load .ki-slot img").length >= 2', 8000);
    const loadRows = await cdp.eval('[...document.querySelectorAll(".ki-slots-load .ki-slot:not(.empty)")].map(e => e.dataset.slot)');
    await cdp.shot(path.join(out, 'screens-slots-load.png'), '#game');
    await tap('.ki-slots [data-slot=slot2]');
    await cdp.until('kiui.playing && !kiui.panel', 10000);
    await cdp.eval(`(() => { const S = kiui.state, P = S.player, foe = S.people.find(q => q.team === 'villain' && q.fight) || S.people.find(q => q.fight && q.kit.side !== 'straw'); P.fight.hitBy = foe; P.fight.down = 'dead'; })()`);
    await cdp.until('kiui.panelKind === "fallen"', 8000);
    const fallen = await cdp.eval('document.querySelector(".ki-fallen-plate").textContent');
    await cdp.shot(path.join(out, 'screens-fallen.png'), '#game');
    await tap('.ki-fallen [data-act=load]');
    await cdp.until('kiui.panelKind === "slots"', 5000);
    await tap('.ki-slots [data-act=back]');
    const backToFallen = await cdp.eval('kiui.panelKind === "fallen"');
    await tap('.ki-fallen [data-act=menu]');
    const toTitle = await cdp.eval('kiui.panelKind === "title"');
    const same = saved.why === null && back.day === saved.day && back.pos.every((v, i) => Math.abs(v - saved.pos[i]) < 0.6) && back.visited.join() === saved.visited.join() && back.hero === saved.hero && back.face === saved.face;
    const pass = /Эльфийский лес/.test(card3) && /здесь не воюют/.test(card1) && zone1 === 'title' && noName && started.team === 'elf' && started.hero === 'elf.f' && started.face === 2 && started.hair === 'braid' && started.zone === 3 && started.hour === 6 && ask
      && set.lines === 600 && set.dither && set.rules === 30 && dithered < 0.02 && plain > 0.3 && set.stored === 'hard' && /Путь/.test(trip) && mapClosed && same && loadRows.includes('slot1') && loadRows.includes('slot2') && /Последний удар/.test(fallen) && backToFallen && toTitle;
    return { pass, card3, card1, zone1, noName, started, ask, set, dithered, plain, trip, mapClosed, saved, back, loadRows, fallen, backToFallen, toTitle };
  },

  async boot(cdp, out) {
    await cdp.open('/kirill98.html');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 0 && window.kiui.panelKind === "title"', 30000);
    const info = await cdp.eval('({ frames: kiui.frames, size: [kiui.width, kiui.height], failed: !!kiui.failed, live: Kirill98.Gpu.live })');
    await cdp.shot(path.join(out, 'boot.png'), '#game');
    const pixels = await cdp.eval(`(() => {
      const c = document.createElement('canvas'), src = document.querySelector('.ki-canvas');
      c.width = src.width; c.height = src.height;
      const g = c.getContext('2d');
      kiui.draw();
      g.drawImage(src, 0, 0);
      const at = (fx, fy) => Array.from(g.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data.slice(0, 3));
      return { sky: at(0.5, 0.1), ground: at(0.5, 0.9) };
    })()`);
    const pass = !info.failed && info.frames > 0 && info.live === 1 && info.size[1] <= 480 && pixels.sky[2] > pixels.sky[0] && pixels.ground[1] > pixels.ground[2];
    return { pass, info, pixels };
  },

  async menu(cdp, out) {
    await cdp.open('/kirill98.html?shots');
    await cdp.until('!!window.kiui && window.kiui.ready && window.kiui.frames > 5', 30000);
    await cdp.key('Escape', 'Escape', 27);
    const opened = await cdp.eval('!!document.querySelector(".ki-menu .ki-btn")');
    await cdp.shot(path.join(out, 'menu.png'), '#game');
    const exitShown = await cdp.eval('!!document.querySelector("[data-act=exit]")');
    await cdp.key('Escape', 'Escape', 27);
    const closed = await cdp.eval('!document.querySelector(".ki-menu")');
    return { pass: opened && closed && !exitShown, opened, closed, exitShown };
  },

  async cycles(cdp, out) {
    await cdp.open('/index.html');
    await cdp.until('!!(window.winManager && window.appKirill98 && window.Kirill98)', 30000);
    await sleep(14000);
    const rec = await cdp.eval(`(async () => {
      const wm = window.winManager, rows = [];
      for (let i = 0; i < 10; i++) {
        appKirill98.open();
        const end = Date.now() + 12000;
        while (Date.now() < end && !(appKirill98.ui && appKirill98.ui.ready && appKirill98.ui.frames > 0)) await new Promise(r => setTimeout(r, 100));
        rows.push({ live: Kirill98.Gpu.live, frames: appKirill98.ui ? appKirill98.ui.frames : -1 });
        wm.closeWindow('app_kirill98');
        await new Promise(r => setTimeout(r, 120));
      }
      return { rows, live: Kirill98.Gpu.live, peak: Kirill98.Gpu.peak, windowGone: !wm.windows.has('app_kirill98') };
    })()`);
    await cdp.eval('appKirill98.open()');
    await cdp.until('!!(appKirill98.ui && appKirill98.ui.ready && appKirill98.ui.frames > 0 && appKirill98.ui.panelKind === "title")', 20000);
    const menuInWindow = await cdp.eval('!!document.querySelector("#app_kirill98 .ki-title [data-act=exit]")');
    await cdp.shot(path.join(out, 'window.png'), '#app_kirill98');
    await cdp.eval('document.querySelector("#app_kirill98 [data-act=exit]").click()');
    await sleep(300);
    const closedByExit = await cdp.eval('!window.winManager.windows.has("app_kirill98") && Kirill98.Gpu.live === 0');
    const tooMany = cdp.warnings.filter(w => /too many active webgl contexts/i.test(w));
    const pass = rec.rows.every(r => r.live === 1 && r.frames > 0) && rec.live === 0 && rec.peak === 1 && rec.windowGone && menuInWindow && closedByExit && !tooMany.length;
    return { pass, ...rec, menuInWindow, closedByExit, tooMany: tooMany.length };
  }
};

async function main() {
  const args = process.argv.slice(2);
  const outArg = args.find(a => a.startsWith('--out='));
  const out = outArg ? path.resolve(outArg.slice(6)) : path.join(os.tmpdir(), 'kirill98-shots');
  const names = args.filter(a => !a.startsWith('--'));
  const run = names.length ? names : Object.keys(SCENES);
  fs.mkdirSync(out, { recursive: true });
  const { cdp, close } = await launch();
  const results = {};
  let failed = false;
  try {
    for (const name of run) {
      if (!SCENES[name]) throw new Error('unknown scene ' + name);
      const before = cdp.errors.length;
      try {
        results[name] = await SCENES[name](cdp, out);
      } catch (e) {
        results[name] = { pass: false, error: String(e && e.message || e) };
      }
      const errs = cdp.errors.slice(before).filter(e => !/favicon/i.test(e));
      if (errs.length) results[name].errors = errs;
      if (!results[name].pass || errs.length) failed = true;
    }
  } finally {
    await close();
  }
  console.log(JSON.stringify({ out, results }, null, 2));
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
