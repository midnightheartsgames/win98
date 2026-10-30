'use strict';
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const path = require('path');
const http = require('http');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MARK = 'parohod98-game';
const FONT_DIR = path.join(__dirname, 'parohod98', 'fonts');
const EDGE = process.env.WIN98_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const STAMP_LINE = /^<script>window\.Parohod98=.*<\/script>$/m;

const FONT_STAND_INS = {
  'Arial': 'Arimo', 'Tahoma': 'Arimo', 'Segoe UI': 'Arimo', 'Trebuchet MS': 'Arimo', 'Verdana': 'Arimo', 'Helvetica': 'Arimo',
  'Arial Narrow': 'Oswald', 'Impact': 'Oswald', 'Arial Black': 'Montserrat',
  'Courier New': 'Cousine', 'Courier': 'Cousine', 'Consolas': 'Cousine', 'Lucida Console': 'Cousine',
  'Georgia': 'PT Serif', 'Times New Roman': 'PT Serif',
  'Comic Sans MS': 'Neucha', 'Segoe Print': 'Neucha', 'Brush Script MT': 'Neucha'
};
const FONTS_WITHOUT_STAND_IN = ['MS Sans Serif', 'Microsoft Sans Serif', 'Palatino Linotype', 'Book Antiqua', 'Garamond', 'Century Gothic', 'Calibri', 'Cambria',
  'Lucida Sans Unicode', 'Franklin Gothic Medium', 'Rockwell', 'Bahnschrift', 'Candara', 'Constantia', 'Corbel', 'Monaco', 'Menlo', 'Fixedsys', 'Webdings', 'Wingdings', 'Marlett'];

const radioFiles = only => {
  const data = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'gtann', 'nn-data.js'), 'utf8');
  const files = [...data.matchAll(/file: '([A-Za-z0-9_-]+)'/g)].map(m => 'content/radio/' + m[1] + '.mp3');
  return only ? files.filter(f => only.includes(path.basename(f, '.mp3'))) : files;
};

const REPORT_EARLY = ['js/bugreport-core.js'];
const REPORT_LATE = ['js/bugreport-shot.js', 'js/parohod98-report.js'];

const GAMES = {
  serioussam: { page: 'serious-sam.html', title: 'Serious Sam 98', content: () => [], parts: {}, ready: '!!(window.ssui && ssui.renderer && ssui.state === "title" && ssui.menu === "main")', resume: 'ssui.save.cont ? (ssui.startLevel(ssui.save.cont.level, ssui.save.cont.skill, ssui.save.cont.inv), true) : false' },
  forza: { page: 'forza.html', title: 'Forza Horizon: Рига', content: () => [], parts: {}, needs: ['memory'], ready: '!!(window.fzui && fzui.mode === "title")', resume: '(fzui.continueGame(), true)' },
  gtann: {
    page: 'gtann.html', title: 'Grand Theft Auto: Нижний Сити',
    content: edition => radioFiles(edition === 'probe' ? ['EMOTION'] : null),
    parts: { radio: { title: 'Радио в машинах', test: rel => rel.startsWith('content/radio/') } },
    needs: ['webgl2', 'memory'],
    ready: '!!(window.nnui && nnui.state === "menu")',
    resume: '(() => { const s = GtaNN.Game.slots().filter(x => x.s).sort((a, b) => String(b.s.savedAt).localeCompare(String(a.s.savedAt)))[0]; return s ? nnui.loadGame(s.slot) : false; })()'
  }
};

function readPage(id) {
  const html = fs.readFileSync(path.join(ROOT, GAMES[id].page), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
  const boot = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length || !styles.length || boot.length !== 1) throw new Error(GAMES[id].page + ' layout changed: ' + scripts.length + ' scripts, ' + styles.length + ' styles, ' + boot.length + ' inline');
  return { scripts, styles, boot: boot[0] };
}

function buildStamp(version) {
  const git = args => execFileSync('git', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    return { version, commit: git(['rev-parse', '--short', 'HEAD']), date: git(['log', '-1', '--format=%cs']), dirty: git(['status', '--porcelain']).length > 0 };
  } catch (err) {
    return { version };
  }
}

function fontsUsed(files) {
  const names = Object.keys(FONT_STAND_INS).concat(FONTS_WITHOUT_STAND_IN).sort((a, b) => b.length - a.length);
  const used = new Set();
  for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    for (const name of names) {
      const re = new RegExp('((?:["\'`,:]|px)\\s*)' + name.replace(/ /g, '\\s') + '(?=\\s*(?:["\'`,;}]|$))', 'gm');
      if (!re.test(text)) continue;
      if (!FONT_STAND_INS[name]) throw new Error(path.relative(ROOT, file) + ' uses the font "' + name + '": add a stand-in to FONT_STAND_INS in tools/parohod98-game.cjs');
      used.add(name);
      text = text.replace(re, '$1');
    }
  }
  return [...used].sort();
}

function fontFaces() {
  return JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'faces.json'), 'utf8'));
}

function fontsCss(used) {
  const faces = fontFaces();
  const rules = [];
  const files = new Set();
  for (const name of used) {
    for (const f of faces.filter(x => x.family === FONT_STAND_INS[name])) {
      rules.push('@font-face{font-family:"' + name + '";font-style:' + f.style + ';font-weight:' + f.weight + ';font-display:block;src:url(' + f.name + ') format("woff2");unicode-range:' + f.range + '}');
      files.add(f.name);
    }
  }
  const loads = [];
  for (const name of used) {
    for (const f of faces.filter(x => x.family === FONT_STAND_INS[name] && x.name.endsWith('-cyrillic.woff2'))) {
      for (const w of f.weight.split(' ')) loads.push(f.style + ' ' + w + ' 16px "' + name + '"');
    }
  }
  const licenses = fs.readdirSync(FONT_DIR).filter(n => n.endsWith('-OFL.txt') && [...files].some(f => f.startsWith(n.split('-')[0] + '-')));
  return { css: rules.join('\n') + '\n', files: [...files].sort(), licenses, loads };
}

function prepareOut(out) {
  if (!fs.existsSync(out)) { fs.mkdirSync(out, { recursive: true }); return; }
  const entries = fs.readdirSync(out);
  if (!entries.length) return;
  const index = path.join(out, 'index.html');
  if (!(fs.existsSync(index) && fs.readFileSync(index, 'utf8').includes('content="' + MARK + '"'))) throw new Error(out + ' is not empty and was not made by ' + MARK);
  for (const e of entries) fs.rmSync(path.join(out, e), { recursive: true, force: true });
}

function pageHtml(id, page, extra, flag, stamp, fonts, early) {
  const tag = src => '<script src="' + src + '"></script>';
  const boot = 'Promise.race([Promise.all(' + JSON.stringify(fonts.loads) + '.map(f=>document.fonts.load(f,"Aa\u0416\u044f"))).catch(()=>{}),new Promise(r=>setTimeout(r,4000))]).then(()=>{' + page.boot + '});';
  return '<!doctype html>\n' +
    '<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="generator" content="' + MARK + '"><link rel="icon" href="data:,"><title>' + GAMES[id].title + '</title>\n' +
    '<link rel="stylesheet" href="fonts/fonts.css">' + page.styles.map(s => '<link rel="stylesheet" href="' + s + '">').join('') + '\n' +
    '<style>html,body{height:100%;margin:0;background:#000;overflow:hidden;touch-action:none;overscroll-behavior:none}#game{width:100vw;height:100vh}</style></head>\n' +
    '<body><div id="game"></div>\n' +
    '<script>window.Parohod98=' + JSON.stringify(flag) + ';window.Win98Build=' + JSON.stringify(stamp) + ';</script>\n' +
    (early || []).concat(page.scripts).map(tag).join('') + '\n<script>' + boot + '</script>\n' + extra.map(tag).join('') + '\n</body></html>\n';
}

function partOf(id, rel) {
  for (const [name, part] of Object.entries(GAMES[id].parts)) if (part.test(rel)) return name;
  return '';
}

function build(id, out, opts = {}) {
  if (!GAMES[id]) throw new Error('unknown game ' + id + ': ' + Object.keys(GAMES).join(', '));
  const edition = opts.edition || 'apk';
  const version = opts.version || 'dev';
  out = path.resolve(out);
  const page = readPage(id);
  const code = page.scripts.concat(page.styles);
  const fonts = fontsCss(fontsUsed(code.map(rel => path.join(ROOT, rel))));
  prepareOut(out);
  const files = [];
  const copy = (rel, from) => {
    const dst = path.join(out, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(from || path.join(ROOT, rel), dst);
    files.push(rel);
  };
  for (const rel of code) copy(rel);
  for (const rel of GAMES[id].content(edition)) if (opts.parts !== false || !partOf(id, rel)) copy(rel);
  for (const name of fonts.files.concat(fonts.licenses)) copy('fonts/' + name, path.join(FONT_DIR, name));
  fs.writeFileSync(path.join(out, 'fonts', 'fonts.css'), fonts.css);
  files.push('fonts/fonts.css');
  const early = REPORT_EARLY.slice();
  const extra = REPORT_LATE.slice();
  for (const rel of early.concat(extra)) copy(rel);
  if (edition === 'probe') {
    copy('parohod98/scene.js', path.join(__dirname, 'parohod98', 'probe', 'scene.js'));
    extra.push('parohod98/scene.js');
  }
  fs.writeFileSync(path.join(out, 'index.html'), pageHtml(id, page, extra, { game: id, edition, version }, buildStamp(version), fonts, early));
  files.push('index.html');
  const bytes = files.reduce((a, f) => a + fs.statSync(path.join(out, f)).size, 0);
  const parts = {};
  for (const rel of files) { const p = partOf(id, rel); if (p) parts[rel] = p; }
  return { id, out, edition, version, files, bytes, parts, fonts: fonts.files };
}

function digestText(rel, data) {
  return rel === 'index.html' ? Buffer.from(data.toString('utf8').replace(STAMP_LINE, '')) : data;
}

function loadCatalog() {
  const sandbox = { localStorage: { getItem: () => null, setItem() {} }, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'game-manager.js'), 'utf8'), sandbox);
  return sandbox.window.gameManager.catalog;
}

function iconPng(id) {
  const icons = fs.readFileSync(path.join(ROOT, 'js', 'icons.js'), 'utf8');
  const m = new RegExp("'" + id + "': `<svg[^`]*?data:image/png;base64,([A-Za-z0-9+/=]+)").exec(icons);
  if (!m) throw new Error('js/icons.js has no PNG icon for ' + id);
  return Buffer.from(m[1], 'base64');
}

function storeInfo(id) {
  const g = loadCatalog()[id];
  if (!g) throw new Error('js/game-manager.js has no entry ' + id);
  const shots = g.shots.map((caption, i) => ({ file: path.join(ROOT, 'content', 'steam', id + '-' + (i + 1) + '.jpg'), caption }));
  for (const s of shots) if (!fs.existsSync(s.file)) throw new Error('no screenshot ' + path.relative(ROOT, s.file));
  return { title: g.title, subtitle: g.subtitle, genre: g.genre, tags: g.tags.slice(), desc: g.desc, icon: iconPng(id), shots };
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' };

function serveDir(dir) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      const file = path.join(dir, rel);
      if (!file.startsWith(dir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
      const size = fs.statSync(file).size;
      const type = MIME[path.extname(file)] || 'application/octet-stream';
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (m) {
        const a = Number(m[1] || 0), b = m[2] ? Number(m[2]) : size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': 'bytes ' + a + '-' + b + '/' + size, 'Content-Length': b - a + 1 });
        fs.createReadStream(file, { start: a, end: b }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function checkPackage(id, dir, opts = {}) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const srv = await serveDir(path.resolve(dir));
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-check-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--window-size=846,387', 'about:blank'], { stdio: 'ignore' });
  const errors = [];
  const bad = [];
  let requests = 0;
  let ws = null;
  try {
    let page = null;
    for (let i = 0; i < 100 && !page; i++) {
      await sleep(200);
      try { page = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page'); } catch (err) {}
    }
    if (!page) throw new Error('Edge did not start');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let seq = 0;
    const pending = new Map();
    ws.onmessage = m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return; }
      if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception || {}).description || d.params.exceptionDetails.text);
      if (d.method === 'Network.responseReceived' && d.params.response.url.startsWith('http://127.0.0.1')) {
        requests++;
        if (d.params.response.status !== 200 && d.params.response.status !== 206) bad.push(d.params.response.status + ' ' + d.params.response.url);
      }
      if (d.method === 'Network.loadingFailed' && !d.params.canceled) bad.push('failed ' + d.params.errorText);
    };
    const send = (method, params = {}) => new Promise(r => { const n = ++seq; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
    const value = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : undefined; };
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 846, height: 387, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + srv.address().port + '/index.html' });
    const limit = Date.now() + (opts.timeout || 240000);
    let ready = false;
    while (!ready && Date.now() < limit) {
      await sleep(500);
      ready = !!(await value(GAMES[id].ready));
    }
    if (!ready) throw new Error(GAMES[id].title + ': the main menu did not open');
    await sleep(2000);
    const fonts = await value('[...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "")).filter((f, i, a) => a.indexOf(f) === i).sort()');
    if (opts.shot) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(opts.shot, Buffer.from(r.result.data, 'base64'));
    }
    if (bad.length) throw new Error(GAMES[id].title + ': requests failed:\n' + bad.join('\n'));
    if (errors.length) throw new Error(GAMES[id].title + ': exceptions:\n' + errors.join('\n'));
    return { requests, fonts };
  } finally {
    try { if (ws) ws.close(); } catch (err) {}
    try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (err) {}
    srv.close();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (err) {}
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const flag = name => { const i = args.indexOf(name); if (i >= 0) args.splice(i, 1); return i >= 0; };
  const edition = opt('--edition');
  const version = opt('--version');
  const check = flag('--check');
  const id = args[0];
  const out = args[1] || path.join(ROOT, 'dist', 'parohod98-games', id || '');
  const r = build(id, out, { edition, version });
  console.log(GAMES[id].title + ' (' + r.edition + ') -> ' + r.out + ': ' + r.files.length + ' files, ' + (r.bytes / 1048576).toFixed(2) + ' MB, fonts ' + r.fonts.length);
  if (check) {
    checkPackage(id, r.out, { shot: path.join(r.out, '..', id + '-check.png') }).then(c => console.log('Check: main menu, ' + c.requests + ' requests, fonts ' + c.fonts.join(', ')), err => { console.error(err.message); process.exitCode = 1; });
  }
}

module.exports = { build, GAMES, readPage, buildStamp, fontsUsed, fontsCss, FONT_STAND_INS, digestText, storeInfo, loadCatalog, iconPng, checkPackage, partOf, serveDir };
