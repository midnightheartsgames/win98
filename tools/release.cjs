const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execFileSync, spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KEY_FILE = process.env.WIN98_RELEASE_KEY || path.join(os.homedir(), '.win98-release.key');
const SSH_HOST = process.env.WIN98_RELEASE_HOST || 'mini-pc';
const REMOTE_DIR = '/srv/www/site/web98/update';
const REMOTE_SITE = '/srv/www/site/web98';
const REMOTE_INCOMING = 'release-incoming';
const PUBLIC_URL = 'https://pennygachi.men/web98/update';
const RELEASE_FILE = 'resources/app/release.json';
const VERSION_PATTERN = /^\d+\.\d+(\.\d+)?$/;
const WORK = path.join(ROOT, 'dist', 'release');
const BLOBS = path.join(WORK, 'blobs');
const PACKED_CACHE = path.join(WORK, 'packed.json');
const GZIP_LIMIT = 64 * 1048576;
const NO_GZIP = /\.(jpe?g|png|gif|webp|mp3|mp4|m4a|ogg|webm|avi|mkv|zip|7z|gz|apk|woff2?)$/i;
const FORBIDDEN_NAMES = /\b(Microsoft|MICROSOFT|Windows|WINDOWS)\b/;
const FIXED_TITLE = 'Исправлено по отчётам игроков';
const BSDTAR = fs.existsSync('C:\\Windows\\System32\\tar.exe') ? 'C:\\Windows\\System32\\tar.exe' : 'tar';

const PRODUCTS = {
  win98: {
    dist: path.join(ROOT, 'dist', 'Win98-win32-x64'), exe: 'Win98.exe', channels: ['exe', 'browser', 'browser-dev'], notes: path.join(ROOT, 'releases', 'win98'),
    smoke: {
      launcher: url => /^http:\/\/127\.0\.0\.1:\d+\/electron\/launcher\//.test(url),
      game: url => /^http:\/\/127\.0\.0\.1:\d+\//.test(url) && !url.includes('/electron/launcher/'),
      ready: "!!(window.winManager && document.getElementById('taskbar') && !(document.getElementById('bios-post-screen') || {classList:{contains:()=>false}}).classList.contains('active') && (document.getElementById('boot-screen') || {style:{}}).style.display === 'none')",
      build: "fetch('build.json').then(r => r.json())",
      what: 'the desktop'
    }
  },
  sr98: {
    dist: path.join(ROOT, 'dist', 'StarRail98-win32-x64'), exe: 'StarRail98.exe', channels: ['sr98-web', 'sr98-apk', 'sr98-pc'], notes: path.join(ROOT, 'releases', 'sr98'),
    smoke: {
      launcher: url => url.startsWith('file:') && url.includes('/launcher/'),
      game: url => url.startsWith('file:') && url.includes('/play/index.html'),
      ready: "!!(window.hsrui && hsrui.mode === 'title')",
      build: 'window.Win98Build',
      what: 'the title screen'
    }
  }
};

const EXE_EXCLUDED = [
  /^\/dist($|\/)/,
  /^\/node_modules($|\/)/,
  /^\/tests($|\/)/,
  /^\/tools($|\/)/,
  /^\/web98-site($|\/)/,
  /^\/review($|\/)/,
  /^\/bugreports($|\/)/,
  /^\/releases($|\/)/,
  /^\/src($|\/)/,
  /^\/tmp($|\/)/,
  /^\/[^/]+\.md$/,
  /^\/[^/]+\.log$/,
  /^\/[^/]+\.test\.js$/,
  /^\/transcript[^/]*\.jsonl$/,
  /^\/techies\.txt$/,
  /^\/tsconfig\.json$/,
  /^\/content\/Legion Arena($|\/)/,
  /^\/content\/Another War($|\/)/,
  /^\/content\/Fallout\/(Manual|Extras|DATA\/SAVEGAME)($|\/)/,
  /^\/content\/Fallout\/[^/]+\.(exe|dll|rtf|log|ini|cfg|ico|txt)$/i
];

const pad = n => String(n).padStart(2, '0');
const buildDate = (d = new Date()) => pad(d.getDate()) + pad(d.getMonth() + 1) + d.getFullYear();
const isoDate = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const displayVersion = info => !info || !info.version ? '' : info.version + (info.build ? ' (' + info.build + ')' : '');
const mb = n => (n / 1048576).toFixed(1) + ' MB';
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { return fallback; } };
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const blobPath = sha => sha.slice(0, 2) + '/' + sha + '.bin';

function listFiles(dir, prefix = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...listFiles(path.join(dir, e.name), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    fs.createReadStream(file).on('error', reject).on('data', chunk => hash.update(chunk)).on('end', () => resolve(hash.digest('hex')));
  });
}

async function hashTree(dir, skip = []) {
  const files = listFiles(dir).filter(f => !skip.includes(f)).sort();
  const out = [];
  for (const rel of files) {
    const full = path.join(dir, rel);
    out.push([rel, fs.statSync(full).size, await hashFile(full)]);
  }
  return out;
}

async function writeRelease(installDir, info) {
  const release = Object.assign({ format: 'win98-release', v: 1 }, info, { files: await hashTree(installDir, [RELEASE_FILE]) });
  fs.writeFileSync(path.join(installDir, RELEASE_FILE), JSON.stringify(release));
  return release;
}

function publicKeyText(privatePem) {
  const raw = crypto.createPublicKey(privatePem).export({ format: 'der', type: 'spki' });
  return raw.subarray(raw.length - 32).toString('base64');
}

function loadKey() {
  if (!fs.existsSync(KEY_FILE)) throw new Error('No signing key ' + KEY_FILE + ': run npm run release -- keygen');
  const pem = fs.readFileSync(KEY_FILE, 'utf8');
  const { PUBLIC_KEY } = require('../electron/updater.js');
  if (publicKeyText(pem) !== PUBLIC_KEY) throw new Error('The key in ' + KEY_FILE + ' does not match PUBLIC_KEY in electron/updater.js');
  return crypto.createPrivateKey(pem);
}

const signBytes = (data, key) => crypto.sign(null, data, key).toString('base64');

function verifyBytes(data, sigText) {
  const { PUBLIC_KEY } = require('../electron/updater.js');
  const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(PUBLIC_KEY, 'base64')]), format: 'der', type: 'spki' });
  try { return crypto.verify(null, data, key, Buffer.from(String(sigText).trim(), 'base64')); } catch (err) { return false; }
}

function checkNames(text, where) {
  const m = FORBIDDEN_NAMES.exec(text);
  if (m) throw new Error(where + ': write Microslop or Win instead of "' + m[0] + '" (AGENTS.md, Naming)');
}

function parseNotes(md, file) {
  checkNames(md, file);
  const lines = md.replace(/\r/g, '').split('\n');
  const out = { title: '', summary: '', build: '', date: '', sections: [], fixed: [] };
  let section = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('# ')) { out.title = line.slice(2).trim(); continue; }
    if (line.startsWith('## ')) { section = { title: line.slice(3).trim(), items: [] }; out.sections.push(section); continue; }
    const meta = /^(Кратко|Сборка|Дата):\s*(.*)$/.exec(line);
    if (meta && !section) {
      if (meta[1] === 'Кратко') out.summary = meta[2].trim();
      if (meta[1] === 'Сборка') out.build = meta[2].trim();
      if (meta[1] === 'Дата') out.date = meta[2].trim();
      continue;
    }
    if (!section) throw new Error(file + ': text before the first "## " section: ' + line);
    if (/^- /.test(line)) section.items.push(line.slice(2).trim());
    else if (section.items.length) section.items[section.items.length - 1] += ' ' + line.trim();
    else throw new Error(file + ': items start with "- ": ' + line);
  }
  if (!out.title) throw new Error(file + ': the first line must be "# Заголовок"');
  if (!out.summary) throw new Error(file + ': add a line "Кратко: ..."');
  const fixedSection = out.sections.find(s => s.title === FIXED_TITLE);
  if (fixedSection) {
    out.sections = out.sections.filter(s => s !== fixedSection);
    out.fixed = fixedSection.items.map(item => {
      const m = /^(BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}):\s*(.*)$/.exec(item);
      return m ? { id: m[1], text: m[2] } : { id: '', text: item };
    });
  }
  return out;
}

function versionMd(notes, version, build, date, fixed) {
  const lines = ['# ' + notes.title, '', 'Кратко: ' + notes.summary, 'Сборка: ' + build, 'Дата: ' + date, ''];
  for (const s of notes.sections) lines.push('## ' + s.title, ...s.items.map(i => '- ' + i), '');
  const all = notes.fixed.concat(fixed);
  if (all.length) lines.push('## ' + FIXED_TITLE, ...all.map(f => '- ' + (f.id ? f.id + ': ' : '') + f.text), '');
  return lines.join('\n');
}

function compareVersions(a, b) {
  return require('../electron/updater.js').compareVersions(a, b);
}

function notesJson(product, dir, extra) {
  const versions = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const m = /^(\d+\.\d+(?:\.\d+)?)\.md$/.exec(name);
      if (!m) continue;
      const n = parseNotes(fs.readFileSync(path.join(dir, name), 'utf8'), name);
      versions.push({ version: m[1], build: n.build, date: n.date, title: n.title, summary: n.summary, sections: n.sections, fixed: n.fixed });
    }
  }
  if (extra) versions.push(extra);
  versions.sort((a, b) => compareVersions(b.version, a.version));
  return { format: 'win98-notes', v: 1, product, versions };
}

function siteNews() {
  const file = path.join(ROOT, 'web98-site', 'sr98', 'news.js');
  if (!fs.existsSync(file)) return [];
  const ctx = { window: {} };
  require('vm').runInNewContext(fs.readFileSync(file, 'utf8'), ctx);
  return (ctx.window.SR98_NEWS || []).map(n => {
    checkNames(JSON.stringify(n), 'web98-site/sr98/news.js');
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(n.date || '');
    return { id: 'site-' + n.id, date: m ? m[3] + '-' + m[2] + '-' + m[1] : '', dateText: n.date, tag: n.tag || '', title: n.title, lead: n.lead || '', body: (n.body || []).slice(), image: '' };
  });
}

function newsJson(product) {
  const dir = path.join(ROOT, 'releases', 'news');
  const items = [];
  const images = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.md')).sort()) {
      const md = fs.readFileSync(path.join(dir, name), 'utf8');
      checkNames(md, 'releases/news/' + name);
      const lines = md.replace(/\r/g, '').split('\n');
      const item = { id: name.slice(0, -3), date: '', title: '', lead: '', body: [], image: '' };
      let products = ['win98'];
      let para = [];
      const flush = () => { if (para.length) { item.body.push(para.join(' ')); para = []; } };
      for (const raw of lines) {
        const line = raw.trim();
        let m;
        if (!item.title && line.startsWith('# ')) { item.title = line.slice(2).trim(); continue; }
        if ((m = /^Дата:\s*(\d{2})\.(\d{2})\.(\d{4})$/.exec(line))) { item.date = m[3] + '-' + m[2] + '-' + m[1]; continue; }
        if ((m = /^Для:\s*(.+)$/.exec(line))) { products = m[1].split(/[,\s]+/).filter(Boolean); continue; }
        if ((m = /^Картинка:\s*(.+)$/.exec(line))) {
          const src = path.join(dir, m[1].trim());
          if (!fs.existsSync(src)) throw new Error('releases/news/' + name + ': no picture ' + m[1]);
          item.image = 'news/' + path.basename(src);
          images.push(src);
          continue;
        }
        if (!line) { flush(); continue; }
        if (line.startsWith('- ')) { flush(); item.body.push('- ' + line.slice(2).trim()); continue; }
        para.push(line);
      }
      flush();
      if (!item.title || !item.date) throw new Error('releases/news/' + name + ': needs "# Заголовок" and "Дата: ДД.ММ.ГГГГ"');
      item.lead = item.body.shift() || '';
      if (products.includes(product)) items.push(item);
    }
  }
  if (product === 'sr98') items.push(...siteNews());
  items.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return { json: { format: 'win98-news', v: 1, product, items }, images: images.filter((src, i) => images.indexOf(src) === i && items.some(it => it.image === 'news/' + path.basename(src))) };
}

async function makeBlob(file, size, sha, cache) {
  const out = path.join(BLOBS, blobPath(sha));
  if (fs.existsSync(out) && cache[sha] !== undefined) return cache[sha];
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let packed = 0;
  if (size < GZIP_LIMIT && !NO_GZIP.test(file)) {
    const data = fs.readFileSync(file);
    const gz = zlib.gzipSync(data, { level: 9 });
    if (gz.length <= size * 0.9) {
      fs.writeFileSync(out + '.tmp', gz);
      packed = gz.length;
    }
  }
  if (!packed) fs.copyFileSync(file, out + '.tmp');
  fs.renameSync(out + '.tmp', out);
  cache[sha] = packed;
  return packed;
}

async function manifestFor(product, release) {
  const dist = PRODUCTS[product].dist;
  const cache = readJson(PACKED_CACHE, {});
  const files = [];
  let n = 0;
  for (const [rel, size, sha] of release.files) {
    files.push([rel, size, sha, await makeBlob(path.join(dist, rel), size, sha, cache)]);
    if (++n % 1000 === 0) console.log('  blobs ' + n + '/' + release.files.length);
  }
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(PACKED_CACHE, JSON.stringify(cache));
  const { format, v, files: _, ...meta } = release;
  return Object.assign({ format: 'win98-manifest', v: 1 }, meta, { files });
}

function ssh(script, opts = {}) {
  return execFileSync('ssh', ['-o', 'BatchMode=yes', SSH_HOST, 'bash -s'], Object.assign({ input: 'set -e\n' + script, encoding: 'utf8', maxBuffer: 256 * 1048576 }, opts));
}

function scp(localFile, remote) {
  const r = spawnSync('scp', ['-o', 'BatchMode=yes', '-q', path.basename(localFile), SSH_HOST + ':' + remote], { cwd: path.dirname(localFile), stdio: 'inherit' });
  if (r.status !== 0) throw new Error('scp failed for ' + localFile);
}

function remoteBlobs() {
  const out = ssh('mkdir -p ' + REMOTE_DIR + '/blobs\ncd ' + REMOTE_DIR + '/blobs && find . -type f -name "*.bin" -printf "%P\\n"');
  return new Set(out.split('\n').map(s => s.trim()).filter(Boolean));
}

function tarFiles(tarFile, cwd, names) {
  const list = tarFile + '.list';
  fs.writeFileSync(list, names.join('\n') + '\n');
  execFileSync(BSDTAR, ['-c', '-f', tarFile, '-C', cwd, '-T', list], { stdio: 'inherit' });
  fs.rmSync(list, { force: true });
}

async function upload(product, metaDir, metaFiles, pointerName, blobs) {
  const have = remoteBlobs();
  const unique = [...new Set(blobs)];
  const missing = unique.filter(b => !have.has(b));
  const upDir = path.join(WORK, 'upload');
  fs.rmSync(upDir, { recursive: true, force: true });
  fs.mkdirSync(upDir, { recursive: true });
  const sums = [];
  for (const b of missing) sums.push((await hashFile(path.join(BLOBS, b))) + '  blobs/' + b);
  for (const f of metaFiles) sums.push((await hashFile(path.join(metaDir, f))) + '  ' + f);
  fs.writeFileSync(path.join(metaDir, 'sums.txt'), sums.join('\n') + '\n');
  const bytes = missing.reduce((s, b) => s + fs.statSync(path.join(BLOBS, b)).size, 0);
  console.log('Upload: ' + missing.length + ' new blobs (' + mb(bytes) + '), ' + (unique.length - missing.length) + ' already on the server, ' + metaFiles.length + ' text files');
  ssh('mkdir -p ~/' + REMOTE_INCOMING + ' && rm -rf ~/' + REMOTE_INCOMING + '/x ~/' + REMOTE_INCOMING + '/*.tar');
  if (missing.length) {
    const blobTar = path.join(upDir, 'blobs.tar');
    tarFiles(blobTar, WORK, missing.map(b => 'blobs/' + b));
    scp(blobTar, REMOTE_INCOMING + '/');
  }
  const metaTar = path.join(upDir, 'meta.tar');
  tarFiles(metaTar, metaDir, metaFiles.concat('sums.txt'));
  scp(metaTar, REMOTE_INCOMING + '/');
  const moves = metaFiles.filter(f => f !== pointerName && f !== pointerName + '.sig');
  ssh([
    'cd ~/' + REMOTE_INCOMING,
    'mkdir x',
    missing.length ? 'tar -xf blobs.tar -C x' : 'true',
    'tar -xf meta.tar -C x',
    'cd x',
    'sha256sum -c --quiet sums.txt',
    'U=' + REMOTE_DIR,
    '[ -d blobs ] && find blobs -type f -name "*.bin" | while read -r f; do mkdir -p "$U/$(dirname "$f")"; chmod 664 "$f"; mv -n "$f" "$U/$f"; done',
    ...moves.map(f => 'mkdir -p "$U/$(dirname "' + f + '")" && chmod 664 "' + f + '" && mv -f "' + f + '" "$U/' + f + '"'),
    'chmod 664 "' + pointerName + '.sig" "' + pointerName + '"',
    'mv -f "' + pointerName + '.sig" "$U/' + pointerName + '.sig"',
    'mv -f "' + pointerName + '" "$U/' + pointerName + '"',
    'cd .. && rm -rf x blobs.tar meta.tar'
  ].join('\n'));
  fs.rmSync(upDir, { recursive: true, force: true });
}

async function getPublic(url) {
  const res = await fetch(url, { cache: 'no-store' });
  return { res, data: res.ok ? Buffer.from(await res.arrayBuffer()) : null };
}

async function getSignedPublic(rel) {
  const q = rel.endsWith('stable.json') || rel.endsWith('test.json') ? '?t=' + Date.now() : '';
  const [a, b] = await Promise.all([getPublic(PUBLIC_URL + '/' + rel + q), getPublic(PUBLIC_URL + '/' + rel + '.sig' + q)]);
  if (a.res.status === 404) return null;
  if (!a.data || !b.data) throw new Error(rel + ': HTTP ' + a.res.status + '/' + b.res.status);
  if (!verifyBytes(a.data, b.data.toString('utf8'))) throw new Error(rel + ': bad signature');
  return JSON.parse(a.data.toString('utf8'));
}

async function pointers(product) {
  return { stable: await getSignedPublic(product + '/stable.json'), test: await getSignedPublic(product + '/test.json') };
}

function nextVersion(ptrs) {
  const known = [ptrs.stable, ptrs.test].filter(Boolean).map(p => p.version).sort(compareVersions);
  if (!known.length) return '1.0';
  const [major, minor] = known[known.length - 1].split('.').map(Number);
  return major + '.' + (minor + 1);
}

function smokeTest(product) {
  const p = PRODUCTS[product];
  const exe = path.join(p.dist, p.exe);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'release-smoke-'));
  const port = 9600 + Math.floor(Math.random() * 300);
  const env = Object.assign({}, process.env);
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(exe, ['--remote-debugging-port=' + port, '--user-data-dir=' + profile], { env, stdio: 'ignore' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const stop = async () => {
    try {
      const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
      const ws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => { ws.onopen = r; setTimeout(r, 2000); });
      ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(1500);
    } catch (err) {}
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 }); } catch (err) {}
  };
  return (async () => {
    const errors = [];
    try {
      let target = null;
      let launcherStarted = false;
      for (let i = 0; i < 160 && !target; i++) {
        await sleep(500);
        let pages = [];
        try { pages = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).filter(t => t.type === 'page'); } catch (err) {}
        target = pages.find(t => p.smoke.game(t.url));
        const launcher = pages.find(t => p.smoke.launcher(t.url));
        if (!target && launcher && !launcherStarted) {
          const lws = new WebSocket(launcher.webSocketDebuggerUrl);
          await new Promise((resolve, reject) => { lws.onopen = resolve; lws.onerror = reject; });
          let lid = 0;
          const lsend = (method, params) => new Promise(r => { const n = ++lid; lws.onmessage = m => { const d = JSON.parse(m.data); if (d.id === n) r(d); }; lws.send(JSON.stringify({ id: n, method, params })); });
          for (let k = 0; k < 40; k++) {
            const r = await lsend('Runtime.evaluate', { expression: "!!(window.win98Launcher && document.getElementById('b-start') && !document.getElementById('b-start').disabled && document.body.dataset.ready)", returnByValue: true });
            if (r.result && r.result.result && r.result.result.value) break;
            await sleep(250);
          }
          await lsend('Runtime.evaluate', { expression: "document.getElementById('b-start').click()" });
          lws.close();
          launcherStarted = true;
        }
      }
      if (!target) throw new Error('smoke test: no page in ' + p.exe);
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
      let id = 0;
      const pending = new Map();
      ws.onmessage = m => {
        const d = JSON.parse(m.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
        if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      };
      const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
      await send('Runtime.enable', {});
      const ready = p.smoke.ready;
      let ok = false;
      for (let i = 0; i < 180 && !ok; i++) {
        await sleep(500);
        const r = await send('Runtime.evaluate', { expression: ready, returnByValue: true });
        ok = !!(r.result && r.result.result && r.result.result.value);
      }
      if (!ok) throw new Error('smoke test: ' + p.smoke.what + ' did not load in 90 s');
      await sleep(3000);
      const build = await send('Runtime.evaluate', { expression: p.smoke.build, awaitPromise: true, returnByValue: true });
      ws.close();
      return { errors, build: build.result && build.result.result ? build.result.result.value : null };
    } finally {
      await stop();
    }
  })();
}

function fixedReports(product) {
  const bugsDir = process.env.WIN98_BUGS_DIR || path.join(ROOT, 'bugreports');
  if (!fs.existsSync(bugsDir)) return [];
  const { loadAll } = require('./bugs.cjs');
  return loadAll(bugsDir).filter(r => r.status.status === 'fixed' && r.status.fixedIn === 'next' && PRODUCTS[product].channels.includes(r.report.channel))
    .map(r => ({ id: r.id, text: r.status.note || (r.report.user && r.report.user.title) || '' }));
}

async function markFixed(product, version, ids) {
  if (!ids.length) return;
  const bugs = require('./bugs.cjs');
  const config = bugs.loadConfig();
  for (const id of ids) {
    try {
      await bugs.setStatus(config, id, 'fixed', { in: version });
      console.log('  ' + id + ': fixed in ' + version);
    } catch (err) {
      console.warn('  ' + id + ': status not changed: ' + err.message);
    }
  }
}

function writeSigned(dir, name, value, key) {
  const data = Buffer.from(JSON.stringify(value));
  fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
  fs.writeFileSync(path.join(dir, name), data);
  fs.writeFileSync(path.join(dir, name + '.sig'), signBytes(data, key));
  return [name, name + '.sig'];
}

function gitState() {
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  return { commit: git(['rev-parse', '--short', 'HEAD']), dirty: git(['status', '--porcelain']).length > 0 };
}

async function releaseWin98(args) {
  const product = 'win98';
  const p = PRODUCTS[product];
  const key = loadKey();
  const channel = args.channel || 'test';
  if (!['test', 'stable'].includes(channel)) throw new Error('--channel is test or stable');
  const git = gitState();
  if (git.dirty && !(args.dirty && channel === 'test')) throw new Error('Uncommitted changes. Commit first, or use --dirty for the test channel.');
  const nextFile = path.join(p.notes, 'next.md');
  if (!fs.existsSync(nextFile)) throw new Error('Write ' + path.relative(ROOT, nextFile) + ' first (what is new, for players)');
  const notes = parseNotes(fs.readFileSync(nextFile, 'utf8'), 'releases/win98/next.md');
  const news = newsJson(product);
  const ptrs = await pointers(product);
  const version = args.version || nextVersion(ptrs);
  if (!VERSION_PATTERN.test(version)) throw new Error('version must look like 1.15 or 1.15.1');
  for (const ptr of [ptrs.stable, ptrs.test]) if (ptr && compareVersions(version, ptr.version) <= 0) throw new Error('version ' + version + ' is not newer than ' + ptr.channel + ' ' + ptr.version);
  console.log('Win 98 ' + version + ' → channel ' + channel + (git.dirty ? ' (dirty)' : ''));

  if (!args['skip-build']) {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'build-exe.mjs'), '--version', version], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('build:exe failed');
  }
  const release = readJson(path.join(p.dist, RELEASE_FILE), null);
  if (!release || release.version !== version) throw new Error('dist has no release.json for ' + version);

  if (!args['no-smoke']) {
    console.log('Smoke test: ' + p.exe + ' with a temporary profile');
    const smoke = await smokeTest(product);
    if (!smoke.build || smoke.build.version !== version) throw new Error('smoke test: build.json says ' + JSON.stringify(smoke.build));
    if (smoke.errors.length && !args['ignore-errors']) throw new Error('smoke test: exceptions:\n' + smoke.errors.join('\n'));
    console.log('  desktop loaded, ' + smoke.errors.length + ' exceptions');
  }

  console.log('Blobs and manifest');
  const manifest = await manifestFor(product, release);
  const fixed = fixedReports(product);
  const date = release.date.split('-').reverse().join('.');
  const entry = { version, build: release.build, date, title: notes.title, summary: notes.summary, sections: notes.sections, fixed: notes.fixed.concat(fixed) };
  const notesAll = notesJson(product, p.notes, entry);

  const out = path.join(WORK, 'out-' + product + '-' + version);
  fs.rmSync(out, { recursive: true, force: true });
  const metaFiles = [];
  metaFiles.push(...writeSigned(out, product + '/manifest-' + version + '.json', manifest, key));
  metaFiles.push(...writeSigned(out, product + '/notes.json', notesAll, key));
  metaFiles.push(...writeSigned(out, product + '/news.json', news.json, key));
  for (const img of news.images) {
    fs.mkdirSync(path.join(out, product, 'news'), { recursive: true });
    fs.copyFileSync(img, path.join(out, product, 'news', path.basename(img)));
    metaFiles.push(product + '/news/' + path.basename(img));
  }
  const old = ptrs[channel] || ptrs.stable || ptrs.test;
  let full = old && old.full ? old.full : null;
  if (args.full) full = await uploadFull(product, version);
  const pointer = { format: 'win98-update', v: 1, product, channel, version, build: release.build, date: release.date, commit: release.commit, manifest: 'manifest-' + version + '.json', blobs: '../blobs/', runtime: release.runtime, full };
  const pointerName = product + '/' + channel + '.json';
  metaFiles.push(...writeSigned(out, pointerName, pointer, key));

  await upload(product, out, metaFiles, pointerName, manifest.files.map(f => blobPath(f[2])));
  fs.writeFileSync(path.join(p.notes, version + '.md'), versionMd(notes, version, release.build, date, fixed));
  fs.rmSync(nextFile);
  console.log('Notes: releases/win98/' + version + '.md (next.md removed)');
  if (channel === 'stable') await markFixed(product, displayVersion(release), entry.fixed.map(f => f.id).filter(Boolean));
  await verify(product, channel);
}

function nextSr98Version(ptrs, base) {
  const known = [ptrs.stable, ptrs.test].filter(p => p && p.version.startsWith(base + '.')).map(p => Number(p.version.slice(base.length + 1).split('.')[0]));
  return base + '.' + (known.length ? Math.max(...known) + 1 : 0);
}

async function releaseSr98(args) {
  const product = 'sr98';
  const p = PRODUCTS[product];
  const key = loadKey();
  const channel = args.channel || 'test';
  if (!['test', 'stable'].includes(channel)) throw new Error('--channel is test or stable');
  const git = gitState();
  if (git.dirty && !(args.dirty && channel === 'test')) throw new Error('Uncommitted changes. Commit first, or use --dirty for the test channel.');
  const nextFile = path.join(p.notes, 'next.md');
  if (!fs.existsSync(nextFile)) throw new Error('Write ' + path.relative(ROOT, nextFile) + ' first (what is new, for players)');
  const notes = parseNotes(fs.readFileSync(nextFile, 'utf8'), 'releases/sr98/next.md');
  const news = newsJson(product);
  const ptrs = await pointers(product);
  const { gameVersion, checkVersion } = require('./hsr98-standalone.cjs');
  const version = args.version || nextSr98Version(ptrs, gameVersion());
  checkVersion(version);
  for (const ptr of [ptrs.stable, ptrs.test]) if (ptr && compareVersions(version, ptr.version) <= 0) throw new Error('version ' + version + ' is not newer than ' + ptr.channel + ' ' + ptr.version);
  console.log('Star Rail 98 ' + version + ' → channel ' + channel + (git.dirty ? ' (dirty)' : ''));

  const apkFile = path.join(ROOT, 'dist', 'StarRail98.apk');
  const apk = require('./hsr98-apk.cjs').buildApk(apkFile, version);
  console.log('  APK ' + mb(apk.size) + ', versionCode ' + apk.versionCode);
  const play = spawnSync(process.execPath, [path.join(__dirname, 'web98-sr98.cjs'), '--no-apk', '--version', version], { cwd: ROOT, stdio: 'inherit' });
  if (play.status !== 0) throw new Error('web98-sr98.cjs failed');
  let pc = null;
  let manifest = null;
  if (!args['no-pc']) {
    pc = await require('./sr98-pc.cjs').buildPc(version, { noZip: !args.full });
    console.log('  PC ' + pc.release.files.length + ' files' + (pc.zip ? ', archive ' + mb(pc.zipBytes) : ''));
    if (!args['no-smoke']) {
      console.log('Smoke test: ' + p.exe + ' with a temporary profile');
      const smoke = await smokeTest(product);
      if (!smoke.build || smoke.build.version !== version) throw new Error('smoke test: Win98Build says ' + JSON.stringify(smoke.build));
      if (smoke.errors.length && !args['ignore-errors']) throw new Error('smoke test: exceptions:\n' + smoke.errors.join('\n'));
      console.log('  title screen loaded, ' + smoke.errors.length + ' exceptions');
    }
    manifest = await manifestFor(product, pc.release);
  }

  const now = new Date();
  const date = isoDate(now).split('-').reverse().join('.');
  const fixed = fixedReports(product);
  const entry = { version, build: '', date, title: notes.title, summary: notes.summary, sections: notes.sections, fixed: notes.fixed.concat(fixed) };
  const out = path.join(WORK, 'out-' + product + '-' + version);
  fs.rmSync(out, { recursive: true, force: true });
  const apkName = 'StarRail98-' + version + '.apk';
  fs.mkdirSync(path.join(out, product), { recursive: true });
  fs.copyFileSync(apkFile, path.join(out, product, apkName));
  const metaFiles = [product + '/' + apkName];
  if (manifest) metaFiles.push(...writeSigned(out, product + '/manifest-' + version + '.json', manifest, key));
  let full = (ptrs[channel] || ptrs.stable || ptrs.test || {}).full || null;
  if (pc && pc.zip) {
    const zipName = 'StarRail98-PC-' + version + '.zip';
    fs.copyFileSync(pc.zip, path.join(out, product, zipName));
    metaFiles.push(product + '/' + zipName);
    full = { url: zipName, version, bytes: pc.zipBytes };
  }
  metaFiles.push(...writeSigned(out, product + '/notes.json', notesJson(product, p.notes, entry), key));
  metaFiles.push(...writeSigned(out, product + '/news.json', news.json, key));
  for (const img of news.images) {
    fs.mkdirSync(path.join(out, product, 'news'), { recursive: true });
    fs.copyFileSync(img, path.join(out, product, 'news', path.basename(img)));
    metaFiles.push(product + '/news/' + path.basename(img));
  }
  const pointer = {
    format: 'win98-update', v: 1, product, channel, version, date: isoDate(now), commit: git.commit,
    apk: { url: apkName, versionName: version, versionCode: apk.versionCode, bytes: apk.size, sha256: await hashFile(apkFile) }
  };
  if (manifest) Object.assign(pointer, { build: '', manifest: 'manifest-' + version + '.json', blobs: '../blobs/', runtime: manifest.runtime, full });
  const pointerName = product + '/' + channel + '.json';
  metaFiles.push(...writeSigned(out, pointerName, pointer, key));
  await upload(product, out, metaFiles, pointerName, manifest ? manifest.files.map(f => blobPath(f[2])) : []);
  fs.writeFileSync(path.join(p.notes, version + '.md'), versionMd(notes, version, '', date, fixed));
  fs.rmSync(nextFile);
  console.log('Notes: releases/sr98/' + version + '.md (next.md removed). Upload web98-site/sr98 (play/) as usual.');
  if (channel === 'stable') await markFixed(product, version, entry.fixed.map(f => f.id).filter(Boolean));
  await verify(product, channel);
}

async function uploadFull(product, version) {
  const p = PRODUCTS[product];
  const zip = path.join(ROOT, 'dist', 'Win98.new.zip');
  fs.rmSync(zip, { force: true });
  console.log('Full archive: ' + path.basename(zip));
  execFileSync(BSDTAR, ['-a', '-c', '-f', zip, path.basename(p.dist)], { cwd: path.dirname(p.dist), stdio: 'inherit' });
  const bytes = fs.statSync(zip).size;
  scp(zip, REMOTE_INCOMING + '/');
  ssh('chmod 644 ~/' + REMOTE_INCOMING + '/Win98.new.zip && mv -f ~/' + REMOTE_INCOMING + '/Win98.new.zip ' + REMOTE_SITE + '/Win98.zip');
  fs.renameSync(zip, path.join(ROOT, 'dist', 'Win98.zip'));
  return { url: '../../Win98.zip', version, bytes };
}

async function promote(product, version) {
  const key = loadKey();
  const ptrs = await pointers(product);
  if (!ptrs.test || ptrs.test.version !== version) throw new Error('test channel has ' + (ptrs.test ? ptrs.test.version : 'nothing') + ', not ' + version);
  if (ptrs.stable && compareVersions(version, ptrs.stable.version) <= 0) throw new Error('stable already has ' + ptrs.stable.version);
  const out = path.join(WORK, 'promote-' + product);
  fs.rmSync(out, { recursive: true, force: true });
  const pointer = Object.assign({}, ptrs.test, { channel: 'stable' });
  const pointerName = product + '/stable.json';
  const files = writeSigned(out, pointerName, pointer, key);
  await upload(product, out, files, pointerName, []);
  const notes = await getSignedPublic(product + '/notes.json');
  const entry = notes && notes.versions.find(v => v.version === version);
  await markFixed(product, displayVersion(pointer), entry ? entry.fixed.map(f => f.id).filter(Boolean) : []);
  await verify(product, 'stable');
}

async function verify(product, channel) {
  const ptr = await getSignedPublic(product + '/' + channel + '.json');
  if (!ptr) throw new Error(product + '/' + channel + '.json is missing');
  if (ptr.apk) {
    await getSignedPublic(product + '/notes.json');
    const { res, data } = await getPublic(PUBLIC_URL + '/' + product + '/' + ptr.apk.url);
    if (!data || data.length !== ptr.apk.bytes || sha256(data) !== ptr.apk.sha256) throw new Error(ptr.apk.url + ': HTTP ' + res.status + ', does not match the pointer');
    const again = await fetch(PUBLIC_URL + '/' + product + '/' + ptr.apk.url, { method: 'HEAD' });
    console.log('Verified ' + product + ' ' + channel + ' ' + ptr.version + ': signatures ok, ' + ptr.apk.url + ' ' + mb(data.length) + ' sha256 ok, versionCode ' + ptr.apk.versionCode + ', type ' + again.headers.get('content-type') + ', cache ' + again.headers.get('cf-cache-status'));
    if (!ptr.manifest) return;
  }
  const manifest = await getSignedPublic(product + '/' + ptr.manifest);
  if (!manifest || manifest.version !== ptr.version) throw new Error('manifest does not match the pointer');
  await getSignedPublic(product + '/notes.json');
  await getSignedPublic(product + '/news.json');
  const files = manifest.files.slice();
  const sample = [];
  for (let i = 0; i < 20 && files.length; i++) sample.push(files.splice(Math.floor(Math.random() * files.length), 1)[0]);
  let bytes = 0;
  for (const [rel, size, sha, packed] of sample) {
    const url = PUBLIC_URL + '/blobs/' + blobPath(sha);
    const { res, data } = await getPublic(url);
    if (!data) throw new Error(rel + ': HTTP ' + res.status);
    const raw = packed ? zlib.gunzipSync(data) : data;
    if (raw.length !== size || sha256(raw) !== sha) throw new Error(rel + ': blob does not match the manifest');
    bytes += data.length;
  }
  const one = sample.find(f => (f[3] || f[1]) > 200) || sample[0];
  const range = await fetch(PUBLIC_URL + '/blobs/' + blobPath(one[2]), { headers: { Range: 'bytes=0-99' } });
  await range.arrayBuffer();
  const again = await fetch(PUBLIC_URL + '/blobs/' + blobPath(one[2]), { method: 'HEAD' });
  console.log('Verified ' + product + ' ' + channel + ' ' + displayVersion(ptr) + ': signatures ok, ' + sample.length + ' blobs ok (' + mb(bytes) + '), Range ' + range.status + ', cache ' + again.headers.get('cf-cache-status'));
  if (range.status !== 206) throw new Error('Range request gave ' + range.status);
}

async function status() {
  for (const product of Object.keys(PRODUCTS)) {
    const ptrs = await pointers(product);
    for (const ch of ['stable', 'test']) {
      const p = ptrs[ch];
      console.log(product.padEnd(6) + ch.padEnd(7) + (p ? displayVersion(p) + '  ' + p.date + '  ' + p.commit + (p.full ? '  full ' + p.full.version : '') : '—'));
    }
  }
  console.log(ssh('cd ' + REMOTE_DIR + ' && du -sh . blobs 2>/dev/null | tr "\\t" " "; echo "$(find blobs -type f | wc -l) blobs"').trim());
}

async function gc(args) {
  const keep = Number(args.keep || 5);
  const referenced = new Set();
  const dropFiles = [];
  for (const product of Object.keys(PRODUCTS)) {
    const ptrs = await pointers(product);
    const live = [ptrs.stable, ptrs.test].filter(Boolean).map(p => p.manifest);
    const names = ssh('cd ' + REMOTE_DIR + ' && ls ' + product + '/ 2>/dev/null | grep -E "^manifest-.*\\.json$" || true').split('\n').filter(Boolean)
      .sort((a, b) => compareVersions(b.replace(/^manifest-|\.json$/g, ''), a.replace(/^manifest-|\.json$/g, '')));
    const kept = names.filter((n, i) => i < keep || live.includes(n));
    for (const n of names.filter(n => !kept.includes(n))) dropFiles.push(product + '/' + n, product + '/' + n + '.sig');
    const liveApk = [ptrs.stable, ptrs.test].filter(p => p && p.apk).map(p => p.apk.url);
    const apks = ssh('cd ' + REMOTE_DIR + ' && ls ' + product + '/ 2>/dev/null | grep -E "^StarRail98-.*\\.apk$" || true').split('\n').filter(Boolean)
      .sort((a, b) => compareVersions(b.replace(/^StarRail98-|\.apk$/g, ''), a.replace(/^StarRail98-|\.apk$/g, '')));
    for (const n of apks.filter((n, i) => i >= keep && !liveApk.includes(n))) dropFiles.push(product + '/' + n);
    for (const n of kept) {
      const m = JSON.parse(ssh('cat ' + REMOTE_DIR + '/' + product + '/' + n));
      for (const f of m.files) referenced.add(blobPath(f[2]));
    }
  }
  const unused = [...remoteBlobs()].filter(b => !referenced.has(b));
  console.log('Unused blobs: ' + unused.length + ', old manifests and APKs: ' + dropFiles.length);
  if (!args.yes) {
    console.log('Nothing deleted. Run again with --yes to delete them.');
    return;
  }
  const list = unused.map(b => 'blobs/' + b).concat(dropFiles);
  if (list.length) ssh('cd ' + REMOTE_DIR + '\nxargs -r rm -f <<"EOF"\n' + list.join('\n') + '\nEOF');
  console.log('Deleted ' + list.length + ' files');
}

async function uploadNews(product) {
  const key = loadKey();
  const news = newsJson(product);
  const out = path.join(WORK, 'news-' + product);
  fs.rmSync(out, { recursive: true, force: true });
  const files = writeSigned(out, product + '/news.json', news.json, key);
  for (const img of news.images) {
    fs.mkdirSync(path.join(out, product, 'news'), { recursive: true });
    fs.copyFileSync(img, path.join(out, product, 'news', path.basename(img)));
    files.push(product + '/news/' + path.basename(img));
  }
  await upload(product, out, files, product + '/news.json', []);
  console.log('News: ' + news.json.items.length + ' items for ' + product);
}

function keygen(force) {
  if (fs.existsSync(KEY_FILE) && !force) {
    console.log('Key already exists: ' + KEY_FILE);
    console.log('Public key: ' + publicKeyText(fs.readFileSync(KEY_FILE, 'utf8')));
    return;
  }
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = privateKey.export({ format: 'pem', type: 'pkcs8' });
  fs.writeFileSync(KEY_FILE, pem, { mode: 0o600 });
  console.log('Private key: ' + KEY_FILE);
  console.log('Public key: ' + publicKeyText(pem));
  console.log('Keep a copy of the private key outside this PC. Without it existing installs get no updates.');
}

async function ping() {
  const remote = execFileSync('ssh', ['-o', 'BatchMode=yes', SSH_HOST, 'test -w ' + REMOTE_DIR + ' && df -h --output=avail ' + REMOTE_DIR + ' | tail -1'], { encoding: 'utf8' }).trim();
  console.log('ssh ' + SSH_HOST + ': ' + REMOTE_DIR + ' writable, free ' + remote);
  const res = await fetch(PUBLIC_URL + '/ping.json', { cache: 'no-store' });
  console.log('GET ' + PUBLIC_URL + '/ping.json: ' + res.status + ', cf-cache-status ' + res.headers.get('cf-cache-status'));
  if (!res.ok) process.exitCode = 1;
}

const USAGE = [
  'npm run release -- <command>',
  '  win98 [--channel test|stable] [--version 1.N] [--full] [--dirty] [--skip-build] [--no-smoke] [--ignore-errors]',
  '  news [win98|sr98]',
  '  sr98 [--channel test|stable] [--version 1.6.N] [--full] [--no-pc] [--dirty] [--no-smoke] [--ignore-errors]',
  '  promote win98|sr98 <version>',
  '  status',
  '  verify win98|sr98 [--channel test|stable]',
  '  gc [--keep 5] [--yes]',
  '  keygen [--force] | ping'
].join('\n');

async function main(argv) {
  const { parseArgs } = require('./bugs.cjs');
  const args = parseArgs(argv);
  const [cmd, a1, a2] = args._;
  if (cmd === 'keygen') return keygen(!!args.force);
  if (cmd === 'ping') return ping();
  if (cmd === 'win98') return releaseWin98(args);
  if (cmd === 'sr98') return releaseSr98(args);
  if (cmd === 'news') return uploadNews(a1 || 'win98');
  if (cmd === 'promote' && PRODUCTS[a1] && a2) return promote(a1, a2);
  if (cmd === 'status') return status();
  if (cmd === 'verify' && PRODUCTS[a1]) return verify(a1, args.channel || 'test');
  if (cmd === 'gc') return gc(args);
  console.log(USAGE);
  process.exitCode = 1;
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(err => {
    console.error(err.message || err);
    process.exitCode = 1;
  });
}

module.exports = { nextSr98Version, EXE_EXCLUDED, RELEASE_FILE, VERSION_PATTERN, PRODUCTS, buildDate, isoDate, displayVersion, listFiles, hashTree, writeRelease, publicKeyText, parseNotes, versionMd, notesJson, newsJson, checkNames, nextVersion, fixedReports };
