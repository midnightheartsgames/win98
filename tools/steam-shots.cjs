const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const RECIPES = require('./steam-shots-recipes.cjs');

const ROOT = path.join(__dirname, '..');
const STEAM_SHOTS = path.join(ROOT, 'content', 'steam');
const DEMO_SHOTS = path.join(ROOT, 'content', 'igromania', 'demos');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SHOT_W = 640;
const SHOT_H = 480;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const PAGE_HELPERS = `window.__shots = window.__shots || {
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  async until(test, ms) {
    const end = Date.now() + (ms || 15000);
    while (Date.now() < end) {
      try { if (test()) return true; } catch (e) { }
      await new Promise(r => setTimeout(r, 50));
    }
    throw new Error('timeout: ' + String(test).slice(0, 120));
  },
  clickText(text) {
    const want = text.toLowerCase();
    const els = [...document.querySelectorAll('button, a, div, span, li, td, p, h1, h2, h3')].filter(e => e.getClientRects().length && e.textContent.trim().toLowerCase() === want);
    const el = els[els.length - 1];
    if (!el) return false;
    const r = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) el.dispatchEvent(new (type.startsWith('pointer') ? PointerEvent : MouseEvent)(type, o));
    return true;
  }
};`;

function parseArgs(argv) {
  const opts = { ids: [], out: null, debug: null };
  for (const a of argv) {
    if (a.startsWith('--out=')) opts.out = path.resolve(a.slice(6));
    else if (a.startsWith('--debug=')) opts.debug = path.resolve(a.slice(8));
    else opts.ids.push(a);
  }
  if (!opts.ids.length) opts.ids = Object.keys(RECIPES);
  return opts;
}

async function launch() {
  const sport = randomPort(8200, 700);
  const dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'steamshots-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,900', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const close = async () => {
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
  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
  }
  if (!target) { await close(); throw new Error('Edge did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails;
      errors.push(x.exception ? x.exception.description : x.text);
    }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
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
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://127.0.0.1:${sport}/index.html`)).status === 200) break; } catch (e) { }
    await sleep(250);
  }
  return { send, evalJs, errors, close, base: `http://127.0.0.1:${sport}` };
}

async function elementRect(cdp, selector) {
  return cdp.evalJs(`(() => {
    const sel = ${JSON.stringify(selector)};
    const list = [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 40; });
    const el = list.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; })[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  })()`);
}

function cropRect(rect, crop) {
  const aspect = SHOT_W / SHOT_H;
  let x = rect.x;
  let y = rect.y;
  let width = rect.width;
  let height = width / aspect;
  if (crop) {
    x += rect.width * crop[0];
    y += rect.height * crop[1];
    width = rect.width * crop[2];
    height = width / aspect;
  } else {
    if (height > rect.height) { height = rect.height; width = height * aspect; }
    x += (rect.width - width) / 2;
    y += (rect.height - height) / 2;
  }
  const snapped = Math.floor(width / 4) * 4;
  return { x: Math.round(x + (width - snapped) / 2), y: Math.round(y + (height - snapped / aspect) / 2), width: snapped, height: snapped / aspect };
}

function jpegSize(buffer) {
  let i = 2;
  while (i < buffer.length) {
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xc2) return [buffer.readUInt16BE(i + 7), buffer.readUInt16BE(i + 5)];
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return [0, 0];
}

async function runStep(cdp, step) {
  const value = await cdp.evalJs(`(async () => { ${step} })()`);
  if (value !== undefined && process.env.SHOTS_LOG) console.log('  =>', JSON.stringify(value).slice(0, 400));
}

async function shootGame(cdp, id, recipe, opts) {
  const [vw, vh] = recipe.viewport || [1280, 900];
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 1, mobile: false });
  cdp.errors.length = 0;
  await cdp.send('Page.navigate', { url: `${cdp.base}/${recipe.page}` });
  await sleep(600);
  let ready = false;
  const end = Date.now() + (recipe.timeout || 40000);
  while (!ready && Date.now() < end) {
    await sleep(250);
    try { ready = await cdp.evalJs(recipe.ready); } catch (e) { }
  }
  if (!ready) throw new Error(`${id}: page not ready (${cdp.errors.slice(0, 3).join(' | ')})`);
  await cdp.evalJs(PAGE_HELPERS);
  if (recipe.frame !== false) {
    const [fw, fh] = recipe.size || [800, 600];
    const frameSel = recipe.frameEl || '#game';
    await cdp.evalJs(`(() => {
      const s = document.createElement('style');
      s.textContent = ${JSON.stringify(`${frameSel}{position:fixed!important;left:0!important;top:0!important;width:${fw}px!important;height:${fh}px!important;max-width:none!important;max-height:none!important;flex:none!important;margin:0!important;z-index:2147483000!important}`)};
      document.head.appendChild(s);
      window.dispatchEvent(new Event('resize'));
      return true;
    })()`);
    await sleep(500);
  }
  for (const step of recipe.setup || []) await runStep(cdp, step);
  const saved = [];
  for (let i = 0; i < recipe.shots.length; i++) {
    const shot = recipe.shots[i];
    const selector = shot.el || recipe.el || '#game';
    for (const step of shot.steps || []) await runStep(cdp, step);
    const rect = await elementRect(cdp, selector);
    if (!rect) throw new Error(`${id}: no element ${selector}`);
    if (opts.debug) {
      fs.mkdirSync(opts.debug, { recursive: true });
      const full = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(opts.debug, `${id}-${i + 1}-full.png`), Buffer.from(full.result.data, 'base64'));
    }
    const clip = cropRect(rect, shot.crop || recipe.crop);
    const scale = SHOT_W / clip.width;
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, clip: Object.assign({ scale }, clip) });
    if (!r.result || !r.result.data) throw new Error(`${id}: capture failed ${JSON.stringify(r.error || r)}`);
    const image = Buffer.from(r.result.data, 'base64');
    const size = jpegSize(image);
    if (size[0] !== SHOT_W || size[1] !== SHOT_H) throw new Error(`${id}: screenshot ${i + 1} is ${size.join('x')}, expected ${SHOT_W}x${SHOT_H}`);
    const outDir = opts.out || (id.endsWith('_demo') ? DEMO_SHOTS : STEAM_SHOTS);
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${id}-${i + 1}.jpg`);
    fs.writeFileSync(file, image);
    saved.push(path.basename(file));
  }
  return saved;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const unknown = opts.ids.filter(id => !RECIPES[id]);
  if (unknown.length) throw new Error(`no recipe for ${unknown.join(', ')}`);
  const cdp = await launch();
  let failed = 0;
  try {
    for (const id of opts.ids) {
      const t0 = Date.now();
      try {
        const saved = await shootGame(cdp, id, RECIPES[id], opts);
        console.log(`${id}: ${saved.join(', ')} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      } catch (e) {
        failed++;
        console.log(`${id}: FAILED ${e.message.slice(0, 400)}`);
      }
      const errs = [...new Set(cdp.errors)].slice(0, 5);
      if (errs.length) console.log(`  page errors: ${errs.map(e => String(e).split('\n')[0]).join(' | ')}`);
    }
  } finally {
    await cdp.close();
  }
  if (failed) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
