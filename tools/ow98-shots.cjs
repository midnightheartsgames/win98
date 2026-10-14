const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const SHEET = `async (o) => {
  const O = Ow98;
  const W = o.w || 150, H = o.h || 220;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const R = new O.Renderer(c, { alpha: true, preserve: true });
  R.resize(W, H);
  const rows = [];
  for (const hero of o.heroes) {
    const kinds = o.kind === 'both' ? ['pose', 'emote'] : [o.kind];
    for (const kind of kinds) {
      for (const [key, clip] of O.Clips.list(hero, kind)) {
        if (o.only && !o.only.includes(key)) continue;
        const n = kind === 'pose' ? 1 : (o.frames || 8);
        const len = clip.loop ? clip.loop[1] + (clip.loop[1] - clip.loop[0]) * 0.5 : clip.len;
        const times = kind === 'pose' ? [O.Clips.iconT(clip)] : Array.from({ length: n }, (_, i) => len * (i + 0.5) / n);
        rows.push({ hero, kind, key, name: clip.n, times });
      }
    }
  }
  const perRow = o.kind === 'pose' ? (o.cols || 7) : 0;
  let cells = [];
  if (o.kind === 'pose') {
    for (const r of rows) cells.push({ r, t: r.times[0], label: r.hero + ' ' + r.key });
  }
  const cols = o.kind === 'pose' ? perRow : (o.frames || 8);
  const nRows = o.kind === 'pose' ? Math.ceil(cells.length / cols) : rows.length;
  const S = document.createElement('canvas'); S.width = cols * W; S.height = nRows * (H + 14);
  const g = S.getContext('2d');
  g.fillStyle = '#2a2f3a'; g.fillRect(0, 0, S.width, S.height);
  g.font = '11px monospace';
  const draw = (hero, pose, t, x, y, yaw) => {
    R.showcase({ hero, skin: o.skin || 'classic', pose, t, yaw: yaw === undefined ? (o.yaw === undefined ? -0.35 : o.yaw) : yaw, still: true, zoom: o.zoom || 1.15 });
    g.drawImage(c, x, y + 14);
  };
  if (o.kind === 'pose') {
    cells.forEach((cell, i) => {
      const x = (i % cols) * W, y = Math.floor(i / cols) * (H + 14);
      draw(cell.r.hero, 'pose:' + cell.r.key, cell.t, x, y);
      g.fillStyle = '#ffe070'; g.fillText(cell.r.key + ' ' + cell.r.name, x + 3, y + 11);
    });
  } else {
    rows.forEach((r, j) => {
      r.times.forEach((t, i) => {
        draw(r.hero, r.kind + ':' + r.key, t, i * W, j * (H + 14));
        g.fillStyle = i ? '#cfd6e4' : '#ffe070';
        g.fillText(i ? t.toFixed(2) : r.key + ' ' + t.toFixed(2), i * W + 3, j * (H + 14) + 11);
      });
    });
  }
  return S.toDataURL('image/png');
}`;

const HELP = `(() => {
  window.owPump = (n, dt) => {
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0;
    try { let t = owui.last || performance.now(); for (let i = 0; i < n; i++) { t += (dt || 1 / 60) * 1000; owui.frame(t); } }
    finally { window.requestAnimationFrame = raf; }
    return owui.mode;
  };
  window.owHero = id => { const g = owui.game, p = g.player; g.requestHero(p, id); p.pendingHero = id; g.setHero(p, id, true); owui.closeOverlayOnly(); return p.heroId; };
  window.owShots = [];
  window.owGrab = (label) => { const c = owui.renderer.canvas; const k = 0.5; const w = Math.round(c.width * k), h = Math.round(c.height * k); const s = document.createElement('canvas'); s.width = w; s.height = h; s.getContext('2d').drawImage(c, 0, 0, w, h); owShots.push([label, s]); return owShots.length; };
  window.owTP = (dist, ang, h, target) => {
    const g = owui.game, p = target || g.player, R = owui.renderer;
    const a = p.yaw + Math.PI + (ang || 0), d = dist || 3.2;
    const cam = { x: p.pos.x + Math.sin(a) * d, y: p.pos.y + (h === undefined ? 1.3 : h), z: p.pos.z + Math.cos(a) * d, yaw: a + Math.PI, pitch: -0.18, fovH: 1.2 };
    R.render(Object.assign(owui.matchScene(g), { cam, viewer: null, fp: false }));
    return true;
  };
  window.owSheet = (cols) => {
    const list = owShots; owShots = [];
    const w = list[0][1].width, h = list[0][1].height; cols = cols || 4;
    const S = document.createElement('canvas'); S.width = cols * w; S.height = Math.ceil(list.length / cols) * (h + 16);
    const x = S.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, S.width, S.height); x.font = '13px monospace';
    list.forEach(([l, c], i) => { const px = (i % cols) * w, py = Math.floor(i / cols) * (h + 16); x.drawImage(c, px, py + 16); x.fillStyle = '#ffe070'; x.fillText(l, px + 4, py + 12); });
    return S.toDataURL('image/png');
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'ow98-shots');
  const mode = process.argv[3] || 'pose';
  const rest = process.argv.slice(4);
  const opts = {};
  const heroes = [];
  for (const a of rest) { const m = a.match(/^--(\w+)=(.*)$/); if (m) opts[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; else heroes.push(a); }
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'owedge-'));
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
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/ow98.html`)).status === 200) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/ow98.html` });
    let ok = false;
    for (let i = 0; i < 160 && !ok; i++) { await sleep(250); try { ok = await evalJs('!!(window.owui && window.Ow98 && Ow98.Clips)'); } catch (e) { } }
    if (!ok) { console.log('page not ready'); console.log(errors.join('\n')); return; }
    if (mode === 'steps') {
      await evalJs(HELP);
      const steps = require(path.resolve(heroes[0]));
      for (const st of steps) {
        try {
          if (st[0] === 'eval') console.log('eval', String(await evalJs(st[1])).slice(0, 400));
          else if (st[0] === 'sleep') await sleep(st[1]);
          else if (st[0] === 'shot') { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, st[1] + '.png'), Buffer.from(r.result.data, 'base64')); console.log('shot', st[1]); }
          else if (st[0] === 'sheet') { const url = await evalJs(st[2]); fs.writeFileSync(path.join(out, st[1] + '.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('sheet', st[1]); }
        } catch (e) { console.log('ERR', st[0], String(st[1]).slice(0, 60), e.message.slice(0, 400)); }
      }
      if (errors.length) console.log('ERRORS: ' + [...new Set(errors)].slice(0, 20).join(' | '));
      return;
    }
    await evalJs('cancelAnimationFrame(owui.raf); owui.dead = true; true');
    const list = heroes.length ? heroes : await evalJs('Ow98.HERO_ORDER');
    for (const hero of list) {
      const o = Object.assign({ heroes: [hero], kind: mode === 'emote' ? 'emote' : 'pose' }, opts);
      if (opts.only) o.only = String(opts.only).split(',');
      const url = await evalJs(`(${SHEET})(${JSON.stringify(o)})`);
      const file = path.join(out, `${hero}-${o.kind}${opts.tag ? '-' + opts.tag : ''}.png`);
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      console.log('saved', file);
    }
    if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
  } finally {
    await cleanup();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
