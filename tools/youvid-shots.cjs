const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SCRIPTS = ['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js', 'js/apps/youvid/kit.js', 'js/apps/youvid/zoo.js', 'js/apps/youvid/hayato-cast.js', 'js/apps/youvid/hayato-sets.js', 'js/apps/youvid/hayato-ui.js', 'js/apps/youvid/hayato-script.js', 'js/apps/youvid/hayato-script-a.js', 'js/apps/youvid/hayato-script-b.js', 'js/apps/youvid/hayato.js', 'js/apps/youvid/rig.js', 'js/apps/youvid/vlad-cast.js', 'js/apps/youvid/vlad-room.js', 'js/apps/youvid/vlad-motion.js', 'js/apps/youvid/vlad-script.js', 'js/apps/youvid/vlad.js', 'js/apps/youvid/nice-cast.js', 'js/apps/youvid/nice-room.js', 'js/apps/youvid/nice-overlay.js', 'js/apps/youvid/nice-motion.js', 'js/apps/youvid/nice.js', 'js/apps/youvid/slay-street.js', 'js/apps/youvid/slay-cast.js', 'js/apps/youvid/slay-motion.js', 'js/apps/youvid/slay-script.js', 'js/apps/youvid/slay.js'];
const SOURCES = {
  jNQXAC9IVRw: 'content/YouVid/Me at the zoo.mp4',
  hayato: 'content/YouVid/Смогу ли Я пройти ХСР только ГАРМОНИСТАМИ.mp4',
  i9AyI356ye4: 'content/video/Влад Савельев ложится спать.mp4',
  vEryN1ceGdN: 'content/video/verynicegoodnice.mp4',
  eXtr3meSlay: 'content/video/Теперь я extremely slay, меньше волос.mp4'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

async function open(width, height) {
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yv-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
  const navigate = async (url, ready) => {
    await send('Page.navigate', { url: base + url });
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try { if (await ev(ready)) return; } catch {}
    }
    throw new Error('page did not load: ' + url);
  };
  const capture = async (clip) => Buffer.from((await send('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { clip: Object.assign({ scale: 1 }, clip) } : {}))).data, 'base64');
  return { ev, send, navigate, close, errors, capture, base };
}

const BENCH = `(async (scripts) => {
  document.body.style.margin = '0';
  document.body.style.background = '#000';
  for (const s of scripts) {
    await new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = '/' + s + '?v=' + Date.now();
      el.onload = resolve;
      el.onerror = resolve;
      document.head.appendChild(el);
    });
  }
  window.yvBench = {
    scenes: {},
    frame(id, t, w, h) {
      const clip = window.youvidClips.find(c => c.id === id);
      const key = id + ':' + w + 'x' + h;
      if (!this.scenes[key]) {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const r = new P3D.Renderer(cv);
        this.scenes[key] = { cv, scene: clip.create(r) };
      }
      const s = this.scenes[key];
      const info = s.scene.render(t);
      return { url: s.cv.toDataURL('image/png'), polys: info.polys };
    },
    still(spec) {
      const clip = window.youvidClips.find(c => c.id === spec.id);
      const key = spec.id + ':' + spec.w + 'x' + spec.h;
      if (!this.scenes[key]) {
        const cv = document.createElement('canvas');
        cv.width = spec.w;
        cv.height = spec.h;
        const r = new P3D.Renderer(cv);
        this.scenes[key] = { cv, scene: clip.create(r) };
      }
      const s = this.scenes[key];
      s.scene.render(spec.t);
      const c = spec.crop || [0, 0, 1, 1];
      const out = document.createElement('canvas');
      out.width = spec.size[0];
      out.height = spec.size[1];
      const ctx = out.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.cv, c[0] * spec.w, c[1] * spec.h, c[2] * spec.w, c[3] * spec.h, 0, 0, out.width, out.height);
      if (spec.lasers) {
        ctx.fillStyle = 'rgba(200, 30, 40, 0.35)';
        ctx.fillRect(0, 0, out.width, out.height);
        spec.lasers.forEach(([x0, y0, x1, y1]) => {
          [[18, 'rgba(140,0,10,0.8)'], [8, 'rgba(255,70,70,0.95)'], [3, 'rgba(255,235,235,1)']].forEach(([lw, col]) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.shadowColor = 'rgba(255,40,40,0.9)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(x0 * out.width, y0 * out.height);
            ctx.lineTo(x1 * out.width, y1 * out.height);
            ctx.stroke();
          });
        });
      }
      return out.toDataURL('image/png');
    }
  };
  return window.youvidClips.map(c => c.id);
})`;

function ffmpegFrame(src, t, w, h, out) {
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', path.join(ROOT, src), '-frames:v', '1', '-vf', `scale=${w}:${h}`, out]);
}

function sideBySide(a, b, out) {
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', a, '-i', b, '-filter_complex', '[0:v][1:v]hstack=inputs=2', out]);
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const outDir = process.env.YV_OUT || path.join(os.tmpdir(), 'youvid-shots');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await open(1280, 900);
  try {
    if (mode === 'site') {
      await b.navigate('/index.html', 'typeof window.appIE === "object" && !!window.youvidSite');
      await sleep(12000);
      const script = rest[0] ? JSON.parse(fs.readFileSync(rest[0], 'utf8')) : [{ url: 'http://www.youvid.com', name: 'home' }];
      for (const step of script) {
        if (step.url) {
          await b.ev(`(() => { const old = document.querySelector('.ie-content-frame'); if (old && window.appIE.navigate) { const w = [...window.winManager.windows.values()].find(x => x.element && x.element.querySelector('.ie-content-frame')); if (w) { window.appIE.navigate(w, ${JSON.stringify(step.url)}); return 1; } } window.appIE.open(${JSON.stringify(step.url)}); const el = document.querySelector('.ie-content-frame').closest('.win-window'); if (el) { el.style.left = '0px'; el.style.top = '0px'; el.style.width = '1100px'; el.style.height = '860px'; } return 1; })()`);
        }
        if (step.js) console.log(step.name || 'js', JSON.stringify(await b.ev(step.js)));
        await sleep(step.wait || 2500);
        if (step.name && (!step.js || step.shot)) {
          const file = path.join(outDir, `site-${step.name}.png`);
          fs.writeFileSync(file, await b.capture());
          console.log(file);
        }
      }
      if (b.errors.length) console.log(`page errors: ${b.errors.join(' | ')}`);
      return;
    }
    await b.navigate('/tools/', 'document.readyState === "complete"');
    const ids = await b.ev(`${BENCH}(${JSON.stringify(SCRIPTS)})`);
    if (mode === 'frames' || mode === 'compare') {
      const [id, ...times] = rest;
      const clipId = ids.find(x => x === id || (id === 'hayato' && x === 'hArMoNy_hsr'));
      const w = +(process.env.YV_W || 480), h = +(process.env.YV_H || 360);
      for (const t of times.map(Number)) {
        const res = await b.ev(`yvBench.frame(${JSON.stringify(clipId)}, ${t}, ${w}, ${h})`);
        const file = path.join(outDir, `${id}-${t.toFixed(2)}.png`);
        fs.writeFileSync(file, Buffer.from(res.url.split(',')[1], 'base64'));
        if (mode === 'compare') {
          const src = path.join(outDir, `${id}-${t.toFixed(2)}-src.png`);
          const aspect = id === 'jNQXAC9IVRw' ? [w, h] : [w, Math.round(w * 9 / 16)];
          ffmpegFrame(SOURCES[id], t, aspect[0], aspect[1], src);
          const pad = path.join(outDir, `${id}-${t.toFixed(2)}-pad.png`);
          spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`, pad]);
          sideBySide(pad, file, path.join(outDir, `${id}-${t.toFixed(2)}-cmp.png`));
          fs.rmSync(src, { force: true });
          fs.rmSync(pad, { force: true });
        }
        console.log(file, res.polys);
      }
    } else if (mode === 'scan') {
      const [id, step] = rest;
      const w = +(process.env.YV_W || 480), h = +(process.env.YV_H || 270);
      const res = await b.ev(`(() => { const clip = window.youvidClips.find(c => c.id === ${JSON.stringify(id)}); const out = []; const cv = document.createElement('canvas'); cv.width = ${w}; cv.height = ${h}; const r = new P3D.Renderer(cv); const sc = clip.create(r); const t0 = performance.now(); sc.warm(); const warm = performance.now() - t0; let slow = 0, worst = 0, worstT = 0; for (let t = ${Number(process.env.YV_FROM || 0)}; t < Math.min(clip.duration, ${Number(process.env.YV_TO || 1e9)}); t += ${Number(step || 0.5)}) { const a = performance.now(); try { sc.render(t); } catch (e) { out.push(t.toFixed(2) + ': ' + (e && e.stack ? e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : e)); } const d = performance.now() - a; if (d > worst) { worst = d; worstT = t; } if (d > 50) slow++; } return { errors: out.slice(0, 40), count: out.length, warm: Math.round(warm), worst: Math.round(worst), worstT, slow }; })()`);
      console.log(JSON.stringify(res, null, 1));
    } else if (mode === 'stills') {
      const plan = JSON.parse(fs.readFileSync(rest[0] || path.join(__dirname, 'youvid-stills.json'), 'utf8'));
      for (const s of plan) {
        const url = await b.ev(`yvBench.still(${JSON.stringify(s)})`);
        const file = path.join(ROOT, s.out);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
        console.log(s.out);
      }
    }
    if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
  } finally {
    await b.close();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
