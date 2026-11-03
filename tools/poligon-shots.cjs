const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SCRIPTS = [
  'js/apps/poligon/p3d.js',
  'js/apps/poligon/figure.js',
  'js/apps/poligon/clip-never-gonna.js',
  'js/apps/poligon/clip-paranoia.js',
  'js/apps/poligon/clip-vladik.js',
  'js/apps/poligon/clip-tarakan.js',
  'js/apps/poligon/clip-neck-hurts.js',
  'js/apps/poligon/clip-war-song.js',
  'js/apps/poligon/ccc-cast.js',
  'js/apps/poligon/clip-ccc.js',
  'js/apps/poligon/gk-cast.js',
  'js/apps/poligon/clip-god-knows.js',
  'js/apps/poligon/uts-cast.js',
  'js/apps/poligon/clip-uhn-tiss.js',
  'js/apps/poligon/step-cast.js',
  'js/apps/poligon/clip-step.js',
  'js/apps/poligon/radio-cast.js',
  'js/apps/poligon/clip-radio-star.js',
  'js/apps/poligon/rc-cast.js',
  'js/apps/poligon/clip-romeo.js',
  'js/apps/poligon/hello-cast.js',
  'js/apps/poligon/clip-hello.js'
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

async function open() {
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,900', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let ws = null, target = null;
  const close = async () => {
    try {
      const info = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(info.webSocketDebuggerUrl);
      await new Promise(resolve => {
        bws.onopen = () => bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        bws.onclose = resolve;
        bws.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    } catch {}
    try { if (ws) ws.close(); } catch {}
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    server.kill();
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }, 500);
  };
  try {
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch {}
    }
    if (!target) throw new Error('Edge did not start');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  } catch (e) {
    await close();
    throw e;
  }
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const base = `http://127.0.0.1:${sport}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/index.html`)).status === 200) break; } catch {}
    await sleep(250);
  }
  await send('Page.navigate', { url: base + '/tools/' });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await ev('document.readyState === "complete"')) break; } catch {}
  }
  return { ev, close, errors };
}

const BENCH = `(async (scripts) => {
  document.body.style.margin = '0';
  for (const s of scripts) {
    await new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = '/' + s + '?v=' + Date.now();
      el.onload = resolve;
      el.onerror = resolve;
      document.head.appendChild(el);
    });
  }
  const PI2 = () => Math.PI * 2;
  window.pgBench = {
    scenes: {},
    scene(id) {
      if (!this.scenes[id]) {
        const clip = window.poligonClips.find(c => c.id === id);
        const cv = document.createElement('canvas');
        cv.width = 512;
        cv.height = 384;
        const r = new P3D.Renderer(cv);
        const scene = clip.create(r);
        scene.warm();
        this.scenes[id] = { clip, cv, scene };
      }
      return this.scenes[id];
    },
    frame(id, t) {
      const s = this.scene(id);
      const t0 = performance.now();
      const info = s.scene.render(t);
      return { url: s.cv.toDataURL('image/png'), polys: info.polys, ms: performance.now() - t0, shot: info.shot.index, cam: info.shot.cam };
    },
    sheet(id, times, labels, cols) {
      const s = this.scene(id);
      const w = 256, h = 192, lh = 16;
      const rows = Math.ceil(times.length / cols);
      const out = document.createElement('canvas');
      out.width = cols * w;
      out.height = rows * (h + lh);
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#202020';
      ctx.fillRect(0, 0, out.width, out.height);
      const stats = [];
      times.forEach((t, i) => {
        const info = s.scene.render(t);
        const x = (i % cols) * w, y = Math.floor(i / cols) * (h + lh);
        ctx.drawImage(s.cv, x, y + lh, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(labels[i], x + 3, y + 12);
        stats.push(info.polys);
      });
      return { url: out.toDataURL('image/png'), stats };
    },
    studio(w, h) {
      if (!this.st || this.st.w !== w || this.st.h !== h) {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const r = new P3D.Renderer(cv);
        const X = P3DCccCast.makeCast(r);
        const b = new P3D.Builder();
        b.disc(0.55, 24, 0xd8d0e0);
        this.st = { w, h, cv, r, X, floor: r.mesh(b) };
      }
      return this.st;
    },
    shoot(st, form, face, ry, eye, at, fov, rect) {
      const { M4, V3 } = P3D;
      const p = P3DFigure.restPose();
      p.ry = ry;
      p.face = face;
      p.shL = [0.05, 0, 0.2];
      p.shR = [0.05, 0, 0.2];
      p.elL = [0.2, 0, 0];
      p.elR = [0.2, 0, 0];
      const a = { id: 'x', form, pose: p, m: P3DCccCast.solve(form, p) };
      const f = V3.norm(V3.sub(at, eye));
      let rt = V3.norm(V3.cross(f, [0, 1, 0]));
      const sunDir = V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.65, 0]));
      const env = { sunDir, sunColor: [0.75, 0.74, 0.72], ambTop: [0.52, 0.52, 0.56], ambBottom: [0.36, 0.34, 0.38], fogColor: [0.93, 0.92, 0.96], fogNear: 40, fogFar: 90, points: [] };
      st.r.begin(env, { eye, at, fov, up: [0, 1, 0], near: 0.02, far: 50 }, rect);
      st.r.draw(st.floor, null, {});
      P3DCccCast.drawActor(st.r, st.X, a);
      return a;
    },
    turn(form, face, sheetUrl) {
      const s = this.studio(1280, 512);
      s.r.clear([0.93, 0.92, 0.96]);
      [0, -0.8, -PI2() / 4, PI2() / 2].forEach((ry, i) => this.shoot(s, form, face, ry, [0, 0.95, 4.0], [0, 0.85, 0], 26, { x: i * 256, y: 0, w: 256, h: 512 }));
      const hy = P3D.M4.point(P3DCccCast.solve(form, P3DFigure.restPose()).head, [0, 0, 0]);
      this.shoot(s, form, face, 0, [0, hy[1] + 0.02, hy[2] + 0.75], [0, hy[1], hy[2]], 22, { x: 1024, y: 256, w: 256, h: 256 });
      this.shoot(s, form, face, -0.6, [0, hy[1] + 0.02, hy[2] + 0.75], [0, hy[1], hy[2]], 22, { x: 1024, y: 0, w: 256, h: 256 });
      return this.compose(s.cv, sheetUrl);
    },
    faces(form) {
      const s = this.studio(1024, 1024);
      s.r.clear([0.93, 0.92, 0.96]);
      P3DCccCast.FACES.forEach((k, i) => {
        const hy = P3D.M4.point(P3DCccCast.solve(form, P3DFigure.restPose()).head, [0, 0, 0]);
        this.shoot(s, form, k, 0, [0, hy[1] + 0.01, hy[2] + 0.7], [0, hy[1] - 0.01, hy[2]], 22, { x: (i % 4) * 256, y: 768 - Math.floor(i / 4) * 256, w: 256, h: 256 });
      });
      const out = document.createElement('canvas');
      out.width = 1024;
      out.height = 1024;
      const ctx = out.getContext('2d');
      ctx.drawImage(s.cv, 0, 0);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#202020';
      P3DCccCast.FACES.forEach((k, i) => ctx.fillText(k, (i % 4) * 256 + 6, Math.floor(i / 4) * 256 + 18));
      return out.toDataURL('image/png');
    },
    lineup(forms) {
      const n = forms.length;
      const s = this.studio(Math.min(2048, n * 160), 640);
      s.r.clear([0.93, 0.92, 0.96]);
      const w = s.w / n;
      forms.forEach((form, i) => {
        this.shoot(s, form, 'calm', 0, [0, 0.95, 3.6], [0, 0.85, 0], 32, { x: Math.round(i * w), y: 320, w: Math.round(w), h: 320 });
        this.shoot(s, form, 'calm', Math.PI, [0, 0.95, 3.6], [0, 0.85, 0], 32, { x: Math.round(i * w), y: 0, w: Math.round(w), h: 320 });
      });
      const out = document.createElement('canvas');
      out.width = s.w;
      out.height = 660;
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(s.cv, 0, 20);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#202020';
      forms.forEach((f, i) => ctx.fillText(f, Math.round(i * w) + 4, 14));
      return out.toDataURL('image/png');
    },
    pov() {
      const s = this.studio(512, 384);
      const { V3 } = P3D;
      s.r.clear([0.93, 0.92, 0.96]);
      const cam = { eye: [0, 1.5, 1], at: [0, 1.2, -1], fov: 55, up: [0, 1, 0], near: 0.02, far: 50 };
      const f = V3.norm(V3.sub(cam.at, cam.eye));
      const rt = V3.norm(V3.cross(f, [0, 1, 0]));
      const env = { sunDir: V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.65, 0])), sunColor: [0.75, 0.74, 0.72], ambTop: [0.52, 0.52, 0.56], ambBottom: [0.36, 0.34, 0.38], fogColor: [0.93, 0.92, 0.96], fogNear: 40, fogFar: 90, points: [] };
      s.r.begin(env, cam, { x: 0, y: 0, w: 256, h: 384 });
      P3DCccCast.drawPov(s.r, s.X, cam, [{ side: 'L', sleeve: 0x8a8e96, hand: 0xf2d2b6, prop: 'letter' }, { side: 'R', sleeve: 0x8a8e96, hand: 0xf2d2b6, prop: 'phone' }]);
      s.r.begin(env, cam, { x: 256, y: 0, w: 256, h: 384 });
      P3DCccCast.drawPov(s.r, s.X, cam, [{ side: 'R', sleeve: 0xb02028, hand: 0xd02838, prop: 'badge', at: [0.08, -0.32, -0.16], rot: [0.5, 0.15, 0] }]);
      return s.cv.toDataURL('image/png');
    },
    compose(cv, sheetUrl) {
      return new Promise((resolve) => {
        const out = document.createElement('canvas');
        const img = new Image();
        const finish = (ok) => {
          const sh = ok ? Math.round(img.height * (1280 / img.width)) : 0;
          out.width = 1280;
          out.height = cv.height + sh;
          const ctx = out.getContext('2d');
          ctx.drawImage(cv, 0, 0);
          if (ok) ctx.drawImage(img, 0, cv.height, 1280, sh);
          resolve(out.toDataURL('image/png'));
        };
        if (!sheetUrl) return finish(false);
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = sheetUrl;
      });
    },
    duration(id) {
      const clip = window.poligonClips.find(c => c.id === id);
      return new Promise((resolve) => {
        const a = new Audio('/' + clip.audio.split('/').map(encodeURIComponent).join('/'));
        a.preload = 'metadata';
        a.onloadedmetadata = () => resolve(a.duration);
        a.onerror = () => resolve(-1);
      });
    }
  };
  return window.poligonClips.map(c => c.id);
})`;

const save = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));

async function main() {
  const [mode, clipId, ...rest] = process.argv.slice(2);
  const outDir = process.env.PG_OUT || path.join(os.tmpdir(), 'poligon-shots');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await open();
  try {
    const ids = await b.ev(`${BENCH}(${JSON.stringify(SCRIPTS)})`);
    if (mode === 'lineup' || mode === 'pov') {
      const url = mode === 'lineup' ? await b.ev(`pgBench.lineup(${JSON.stringify([clipId, ...rest])})`) : await b.ev('pgBench.pov()');
      const file = path.join(outDir, `${mode}-${clipId || 'arms'}.png`);
      save(file, url);
      console.log(file);
      if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
      return;
    }
    if (mode === 'turn' || mode === 'faces') {
      const form = clipId;
      const sheets = { amanda: 'Amanda Miller.png', makoto: 'Makoto Mine.png', talleah: 'Talleah of Avia and robots.png', gynoid: 'Talleah of Avia and robots.png' };
      const person = await b.ev(`(P3DCccCast.FORMS[${JSON.stringify(form)}] || { person: 'gynoid' }).person`);
      const url = mode === 'turn'
        ? await b.ev(`pgBench.turn(${JSON.stringify(form)}, ${JSON.stringify(rest[0] || 'calm')}, ${JSON.stringify('/content/CCC/' + encodeURIComponent(sheets[person]))})`)
        : await b.ev(`pgBench.faces(${JSON.stringify(form)})`);
      const file = path.join(outDir, `${form}-${mode}.png`);
      save(file, url);
      console.log(file);
      if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
      return;
    }
    if (!ids.includes(clipId)) throw new Error('unknown clip ' + clipId + ', known: ' + ids.join(', '));
    if (mode === 'duration') {
      console.log('audio.duration', await b.ev(`pgBench.duration(${JSON.stringify(clipId)})`));
    } else if (mode === 'frames') {
      for (const t of rest.map(Number)) {
        const res = await b.ev(`pgBench.frame(${JSON.stringify(clipId)}, ${t})`);
        const file = path.join(outDir, `${clipId}-${t.toFixed(2)}.png`);
        save(file, res.url);
        console.log(file, `shot ${res.shot + 1} ${res.cam}`, `${res.polys} polys`, `${res.ms.toFixed(1)} ms`);
      }
    } else if (mode === 'shots' || mode === 'range') {
      let times, labels;
      if (mode === 'shots') {
        const shots = await b.ev(`window.poligonClips.find(c => c.id === ${JSON.stringify(clipId)}).shots.map(s => [s.start, s.end, s.cam, s.loc])`);
        const k = rest[0] === undefined ? 0.5 : +rest[0];
        times = shots.map(([a, e]) => a + (e - a) * k);
        labels = shots.map(([a, , cam, loc], i) => `${i + 1} ${a.toFixed(2)} ${loc}/${cam}`);
      } else {
        const [t0, t1, fps] = rest.map(Number);
        times = [];
        for (let t = t0; t <= t1 + 1e-6; t += 1 / fps) times.push(t);
        labels = times.map(t => t.toFixed(2));
      }
      const cols = +(process.env.PG_COLS || 6);
      const res = await b.ev(`pgBench.sheet(${JSON.stringify(clipId)}, ${JSON.stringify(times)}, ${JSON.stringify(labels)}, ${cols})`);
      const file = path.join(outDir, `${clipId}-${mode}.png`);
      save(file, res.url);
      console.log(file, `max polys ${Math.max(...res.stats)}`);
    } else {
      throw new Error('modes: duration | frames t... | shots [k] | range t0 t1 fps');
    }
    if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
  } finally {
    await b.close();
  }
}

main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
