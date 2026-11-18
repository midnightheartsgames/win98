const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execFileSync, spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KEY_FILE = process.env.WIN98_RELEASE_KEY || path.join(os.homedir(), '.win98-release.key');
const FTP_HOST = process.env.WIN98_FTP_HOST || 'user896926.web-3.cloud4box.ru';
const FTP_PIN = 'sha256//2jy1fMo/P68ze79RLZ+ieb7Q9Qp01yoE4LWx3m7wDCI=';
const FTP_NETRC = process.env.WIN98_FTP_NETRC || path.join(os.homedir(), '.netrc');
const FTP_SITE = '/www/pennygachi.men';
const FTP_UPDATE = FTP_SITE + '/update';
const FULL_ARCHIVES = {
  win98: { name: 'Win98.zip', tar: ['-a', '-c', '-f'] },
  'win98-linux': { name: 'Win98-linux.tar.gz', tar: ['-z', '-c', '-f'] }
};
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const PUBLIC_URL = 'https://pennygachi.men/web98/update';
const RELEASE_FILE = 'resources/app/release.json';
const VERSION_PATTERN = /^\d+\.\d+(\.\d+){0,2}$/;
const WORK = path.join(ROOT, 'dist', 'release');
const BLOBS = path.join(WORK, 'blobs');
const PACKED_CACHE = path.join(WORK, 'packed.json');
const GZIP_LIMIT = 64 * 1048576;
const NO_GZIP = /\.(jpe?g|png|gif|webp|mp3|mp4|m4a|ogg|webm|avi|mkv|zip|7z|gz|apk|woff2?)$/i;
const FORBIDDEN_NAMES = /\b(Microsoft|MICROSOFT|Windows|WINDOWS)\b/;
const FIXED_TITLE = 'Исправлено по отчётам игроков';
const FIXED_TITLE_EN = 'Fixed from player reports';
const BSDTAR = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'bsdtar';

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
  'win98-linux': {
    dist: path.join(ROOT, 'dist', 'Win98-linux-x64'), exe: 'win98', channels: [], notes: path.join(ROOT, 'releases', 'win98'),
    smoke: null
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
  /^\/content\/music\/[^/]+\.mp4$/i
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
    const meta = /^(Кратко|Сборка|Дата|Summary|Build|Date):\s*(.*)$/.exec(line);
    if (meta && !section) {
      if (meta[1] === 'Кратко' || meta[1] === 'Summary') out.summary = meta[2].trim();
      if (meta[1] === 'Сборка' || meta[1] === 'Build') out.build = meta[2].trim();
      if (meta[1] === 'Дата' || meta[1] === 'Date') out.date = meta[2].trim();
      continue;
    }
    if (!section) throw new Error(file + ': text before the first "## " section: ' + line);
    if (/^- /.test(line)) section.items.push(line.slice(2).trim());
    else if (section.items.length) section.items[section.items.length - 1] += ' ' + line.trim();
    else throw new Error(file + ': items start with "- ": ' + line);
  }
  if (!out.title) throw new Error(file + ': the first line must be "# Заголовок"');
  if (!out.summary) throw new Error(file + ': add a line "Кратко: ..."');
  const fixedSection = out.sections.find(s => s.title === FIXED_TITLE || s.title === FIXED_TITLE_EN);
  if (fixedSection) {
    out.sections = out.sections.filter(s => s !== fixedSection);
    out.fixed = fixedSection.items.map(item => {
      const m = /^(BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}):\s*(.*)$/.exec(item);
      return m ? { id: m[1], text: m[2] } : { id: '', text: item };
    });
  }
  return out;
}

function versionMd(notes, version, build, date, fixed, en) {
  const lines = ['# ' + notes.title, '', (en ? 'Summary: ' : 'Кратко: ') + notes.summary, (en ? 'Build: ' : 'Сборка: ') + build, (en ? 'Date: ' : 'Дата: ') + date, ''];
  for (const s of notes.sections) lines.push('## ' + s.title, ...s.items.map(i => '- ' + i), '');
  const all = notes.fixed.concat(fixed);
  if (all.length) lines.push('## ' + (en ? FIXED_TITLE_EN : FIXED_TITLE), ...all.map(f => '- ' + (f.id ? f.id + ': ' : '') + f.text), '');
  return lines.join('\n');
}

function compareVersions(a, b) {
  return require('../electron/updater.js').compareVersions(a, b);
}

function notesJson(product, dir, extra) {
  const versions = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const m = /^(\d+\.\d+(?:\.\d+){0,2})\.md$/.exec(name);
      if (!m) continue;
      const n = parseNotes(fs.readFileSync(path.join(dir, name), 'utf8'), name);
      const entry = { version: m[1], build: n.build, date: n.date, title: n.title, summary: n.summary, sections: n.sections, fixed: n.fixed };
      const enFile = path.join(dir, m[1] + '.en.md');
      if (fs.existsSync(enFile)) entry.en = notesEn(parseNotes(fs.readFileSync(enFile, 'utf8'), m[1] + '.en.md'));
      versions.push(entry);
    }
  }
  if (extra) versions.push(extra);
  versions.sort((a, b) => compareVersions(b.version, a.version));
  return { format: 'win98-notes', v: 1, product, versions };
}

function notesEn(n, fixed) {
  return { title: n.title, summary: n.summary, sections: n.sections, fixed: n.fixed.concat(fixed || []) };
}

function siteNews() {
  const file = path.join(ROOT, 'web98-site', 'sr98', 'news.js');
  if (!fs.existsSync(file)) return [];
  const ctx = { window: {} };
  require('vm').runInNewContext(fs.readFileSync(file, 'utf8'), ctx);
  return (ctx.window.SR98_NEWS || []).map(n => {
    checkNames(JSON.stringify(n), 'web98-site/sr98/news.js');
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(n.date || '');
    const item = { id: 'site-' + n.id, date: m ? m[3] + '-' + m[2] + '-' + m[1] : '', dateText: n.date, tag: n.tag || '', title: n.title, lead: n.lead || '', body: (n.body || []).slice(), image: '' };
    if (n.en) item.en = { tag: n.en.tag || '', title: n.en.title, lead: n.en.lead || '', body: (n.en.body || []).slice() };
    return item;
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
      if (products.includes(product === 'win98-linux' ? 'win98' : product)) items.push(item);
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

const ftpUrl = remote => 'ftp://' + FTP_HOST + remote.split('/').map(encodeURIComponent).join('/');
const curlQuote = s => '"' + String(s).replace(/\\/g, '/').replace(/"/g, '\\"') + '"';

function curl(args, opts = {}) {
  if (!fs.existsSync(FTP_NETRC)) throw new Error('No FTP login: put "machine ' + FTP_HOST + ' login ... password ..." into ' + FTP_NETRC);
  const base = ['--silent', '--show-error', '--fail', '--ssl-reqd', '--insecure', '--pinnedpubkey', FTP_PIN, '--netrc-file', FTP_NETRC, '--connect-timeout', '30', '--retry', '3'];
  const r = spawnSync(CURL, base.concat(args), Object.assign({ encoding: 'buffer', maxBuffer: 1024 * 1048576 }, opts));
  if (r.error) throw r.error;
  return { status: r.status, out: r.stdout, err: r.stderr ? r.stderr.toString('utf8').trim() : '' };
}

function curlOk(args, what) {
  const r = curl(args);
  if (r.status !== 0) throw new Error('FTP ' + what + ' failed (curl ' + r.status + '): ' + r.err);
  return r.out;
}

function curlConfig(lines, what) {
  const file = path.join(WORK, 'curl-' + process.pid + '.txt');
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
  try {
    return curlOk(['--config', file], what);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function parseList(text) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^([-dl])\S*\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+(.+)$/.exec(line);
    if (m && m[3] !== '.' && m[3] !== '..') entries.push({ name: m[3], size: Number(m[2]), dir: m[1] === 'd' });
  }
  return entries;
}

function ftpList(dir) {
  const r = curl([ftpUrl(dir + '/')]);
  if (r.status === 9) return [];
  if (r.status !== 0) throw new Error('FTP list ' + dir + ' failed (curl ' + r.status + '): ' + r.err);
  return parseList(r.out.toString('utf8'));
}

function ftpRead(file) {
  return curlOk([ftpUrl(file)], 'read ' + file);
}

function ftpPut(pairs, what) {
  if (!pairs.length) return;
  const lines = ['ftp-create-dirs'];
  for (const [local, remote] of pairs) lines.push('upload-file = ' + curlQuote(local), 'url = ' + curlQuote(ftpUrl(remote)));
  curlConfig(lines, what);
}

function ftpCommands(commands, what) {
  for (let i = 0; i < commands.length; i += 200) {
    const lines = commands.slice(i, i + 200).map(c => 'quote = ' + curlQuote(c));
    lines.push('list-only', 'output = ' + curlQuote(process.platform === 'win32' ? 'NUL' : '/dev/null'), 'url = ' + curlQuote(ftpUrl(FTP_SITE + '/')));
    curlConfig(lines, what);
  }
}

function ftpRename(from, to) {
  ftpCommands(['RNFR ' + from, 'RNTO ' + to], 'rename ' + from);
}

function remoteNames(dir, pattern) {
  return ftpList(dir).filter(e => !e.dir && pattern.test(e.name)).map(e => e.name);
}

function remoteBlobs() {
  const dirs = ftpList(FTP_UPDATE + '/blobs').filter(e => e.dir).map(e => e.name);
  const sizes = new Map();
  if (!dirs.length) return sizes;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'release-blobs-'));
  try {
    const lines = [];
    for (const d of dirs) lines.push('url = ' + curlQuote(ftpUrl(FTP_UPDATE + '/blobs/' + d + '/')), 'output = ' + curlQuote(path.join(tmp, d + '.txt')));
    curlConfig(lines, 'blob list');
    for (const d of dirs) {
      for (const e of parseList(fs.readFileSync(path.join(tmp, d + '.txt'), 'utf8'))) if (!e.dir && e.name.endsWith('.bin')) sizes.set(d + '/' + e.name, e.size);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return sizes;
}

async function upload(product, metaDir, metaFiles, pointerName, blobs) {
  const have = remoteBlobs();
  const unique = [...new Set(blobs)];
  const sizeOf = b => fs.statSync(path.join(BLOBS, b)).size;
  const missing = unique.filter(b => have.get(b) !== sizeOf(b));
  const bytes = missing.reduce((s, b) => s + sizeOf(b), 0);
  console.log('Upload: ' + missing.length + ' new blobs (' + mb(bytes) + '), ' + (unique.length - missing.length) + ' already on the server, ' + metaFiles.length + ' text files');
  ftpPut(missing.map(b => [path.join(BLOBS, b), FTP_UPDATE + '/blobs/' + b]), 'blob upload');
  if (missing.length) {
    const now = remoteBlobs();
    const bad = missing.filter(b => now.get(b) !== sizeOf(b));
    if (bad.length) throw new Error(bad.length + ' blobs did not arrive whole, first ' + bad[0] + '. Run the release again: it uploads only what is missing.');
  }
  const pointerFiles = [pointerName + '.sig', pointerName];
  const rest = metaFiles.filter(f => !pointerFiles.includes(f));
  ftpPut(rest.map(f => [path.join(metaDir, f), FTP_UPDATE + '/' + f]), 'text upload');
  ftpPut(pointerFiles.map(f => [path.join(metaDir, f), FTP_UPDATE + '/' + f + '.new']), 'pointer upload');
  for (const f of pointerFiles) ftpRename(FTP_UPDATE + '/' + f + '.new', FTP_UPDATE + '/' + f);
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
  const p = Object.assign({}, PRODUCTS[product], { smoke: PRODUCTS[product].smoke || PRODUCTS.win98.smoke });
  const exe = path.join(p.dist, p.exe);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'release-smoke-'));
  const port = 9600 + Math.floor(Math.random() * 300);
  const env = Object.assign({}, process.env);
  delete env.ELECTRON_RUN_AS_NODE;
  const exeArgs = ['--remote-debugging-port=' + port, '--user-data-dir=' + profile];
  const onWin = process.platform === 'win32';
  const wine = !onWin && exe.endsWith('.exe');
  const child = onWin ? spawn(exe, exeArgs, { env, stdio: 'ignore' }) : spawn(wine ? 'wine' : exe, (wine ? [exe] : []).concat(exeArgs), { env, stdio: 'ignore', detached: true });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const stop = async () => {
    try {
      const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
      const ws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => { ws.onopen = r; setTimeout(r, 2000); });
      ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(1500);
    } catch (err) {}
    if (onWin) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else {
      try { process.kill(-child.pid, 'SIGKILL'); } catch (err) {}
      if (wine) spawnSync('wineserver', ['-k'], { stdio: 'ignore' });
    }
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

function checkArenaVersion() {
  const res = spawnSync(process.execPath, [path.join(ROOT, 'tools/hsr-net-simver.cjs'), '--check'], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error((res.stderr || res.stdout || 'Arena version check failed').trim());
}

async function releaseWin98(args) {
  checkArenaVersion();
  const products = args['no-linux'] ? ['win98'] : ['win98', 'win98-linux'];
  const key = loadKey();
  const channel = args.channel || 'test';
  if (!['test', 'stable'].includes(channel)) throw new Error('--channel is test or stable');
  const git = gitState();
  if (git.dirty && !(args.dirty && channel === 'test')) throw new Error('Uncommitted changes. Commit first, or use --dirty for the test channel.');
  const notesDir = PRODUCTS.win98.notes;
  const nextFile = path.join(notesDir, 'next.md');
  if (!fs.existsSync(nextFile)) throw new Error('Write ' + path.relative(ROOT, nextFile) + ' first (what is new, for players)');
  const notes = parseNotes(fs.readFileSync(nextFile, 'utf8'), 'releases/win98/next.md');
  const ptrsOf = {};
  for (const product of products) ptrsOf[product] = await pointers(product);
  const version = args.version || nextVersion(ptrsOf.win98);
  if (!VERSION_PATTERN.test(version)) throw new Error('version must look like 1.15 or 1.15.1');
  for (const product of products) {
    for (const ptr of [ptrsOf[product].stable, ptrsOf[product].test]) if (ptr && compareVersions(version, ptr.version) <= 0) throw new Error(product + ' version ' + version + ' is not newer than ' + ptr.channel + ' ' + ptr.version);
  }
  console.log('Win 98 ' + version + ' (' + products.join(', ') + ') → channel ' + channel + (git.dirty ? ' (dirty)' : ''));

  const releases = {};
  for (const product of products) {
    const p = PRODUCTS[product];
    if (!args['skip-build']) {
      const extra = product === 'win98-linux' ? ['--platform', 'linux'] : [];
      const r = spawnSync(process.execPath, [path.join(__dirname, 'build-exe.mjs'), '--version', version].concat(extra), { cwd: ROOT, stdio: 'inherit' });
      if (r.status !== 0) throw new Error('build:exe failed for ' + product);
    }
    const release = readJson(path.join(p.dist, RELEASE_FILE), null);
    if (!release || release.version !== version) throw new Error(path.relative(ROOT, p.dist) + ' has no release.json for ' + version);
    releases[product] = release;
    if (!args['no-smoke']) {
      console.log('Smoke test: ' + p.exe + ' with a temporary profile');
      const smoke = await smokeTest(product);
      if (!smoke.build || smoke.build.version !== version) throw new Error('smoke test: build.json says ' + JSON.stringify(smoke.build));
      if (smoke.errors.length && !args['ignore-errors']) throw new Error('smoke test: exceptions:\n' + smoke.errors.join('\n'));
      console.log('  desktop loaded, ' + smoke.errors.length + ' exceptions');
    }
  }

  const fixed = fixedReports('win98');
  const first = releases.win98;
  const date = first.date.split('-').reverse().join('.');
  const entry = { version, build: first.build, date, title: notes.title, summary: notes.summary, sections: notes.sections, fixed: notes.fixed.concat(fixed) };
  for (const product of products) {
    console.log('Blobs and manifest: ' + product);
    const release = releases[product];
    const manifest = await manifestFor(product, release);
    const news = newsJson(product);
    const out = path.join(WORK, 'out-' + product + '-' + version);
    fs.rmSync(out, { recursive: true, force: true });
    const metaFiles = [];
    metaFiles.push(...writeSigned(out, product + '/manifest-' + version + '.json', manifest, key));
    metaFiles.push(...writeSigned(out, product + '/notes.json', notesJson(product, notesDir, entry), key));
    metaFiles.push(...writeSigned(out, product + '/news.json', news.json, key));
    for (const img of news.images) {
      fs.mkdirSync(path.join(out, product, 'news'), { recursive: true });
      fs.copyFileSync(img, path.join(out, product, 'news', path.basename(img)));
      metaFiles.push(product + '/news/' + path.basename(img));
    }
    const ptrs = ptrsOf[product];
    const old = ptrs[channel] || ptrs.stable || ptrs.test;
    let full = old && old.full ? old.full : null;
    if (args.full) full = await uploadFull(product, version);
    const pointer = { format: 'win98-update', v: 1, product, channel, version, build: release.build, date: release.date, commit: release.commit, manifest: 'manifest-' + version + '.json', blobs: '../blobs/', runtime: release.runtime, full };
    const pointerName = product + '/' + channel + '.json';
    metaFiles.push(...writeSigned(out, pointerName, pointer, key));
    await upload(product, out, metaFiles, pointerName, manifest.files.map(f => blobPath(f[2])));
  }
  fs.writeFileSync(path.join(notesDir, version + '.md'), versionMd(notes, version, first.build, date, fixed));
  fs.rmSync(nextFile);
  console.log('Notes: releases/win98/' + version + '.md (next.md removed)');
  if (channel === 'stable') await markFixed('win98', displayVersion(first), entry.fixed.map(f => f.id).filter(Boolean));
  for (const product of products) await verify(product, channel);
}

function nextSr98Version(ptrs, base) {
  const known = [ptrs.stable, ptrs.test].filter(p => p && p.version.startsWith(base + '.')).map(p => Number(p.version.slice(base.length + 1).split('.')[0]));
  return base + '.' + (known.length ? Math.max(...known) + 1 : 0);
}

async function releaseSr98(args) {
  checkArenaVersion();
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
  const nextEnFile = path.join(p.notes, 'next.en.md');
  const notesEnNext = fs.existsSync(nextEnFile) ? parseNotes(fs.readFileSync(nextEnFile, 'utf8'), 'releases/sr98/next.en.md') : null;
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
  if (notesEnNext) entry.en = notesEn(notesEnNext, fixed);
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
  if (notesEnNext) {
    fs.writeFileSync(path.join(p.notes, version + '.en.md'), versionMd(notesEnNext, version, '', date, fixed, true));
    fs.rmSync(nextEnFile);
  }
  console.log('Notes: releases/sr98/' + version + '.md' + (notesEnNext ? ' and ' + version + '.en.md' : '') + ' (next removed). Upload web98-site/sr98 (play/) as usual.');
  if (channel === 'stable') await markFixed(product, version, entry.fixed.map(f => f.id).filter(Boolean));
  await verify(product, channel);
}

const PAROHOD = { product: 'parohod98', notes: path.join(ROOT, 'releases', 'parohod98'), minApk: '1.0', credit: 'Игра проекта Win 98 · фанатский проект Midnight Hearts' };

function packageDigest(dir, files) {
  const games = require('./parohod98-game.cjs');
  const lines = files.slice().sort().map(rel => rel + ' ' + sha256(games.digestText(rel, fs.readFileSync(path.join(dir, rel)))));
  return sha256(lines.join('\n'));
}

async function gameManifest(built, meta) {
  const cache = readJson(PACKED_CACHE, {});
  const files = [];
  for (const rel of built.files.slice().sort()) {
    const full = path.join(built.out, rel);
    const size = fs.statSync(full).size;
    const sha = await hashFile(full);
    const row = [rel, size, sha, await makeBlob(full, size, sha, cache)];
    if (built.parts[rel]) row.push(built.parts[rel]);
    files.push(row);
  }
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(PACKED_CACHE, JSON.stringify(cache));
  return Object.assign({ format: 'win98-manifest', v: 1, product: PAROHOD.product }, meta, { files });
}

function sumFiles(files, part) {
  const rows = files.filter(f => (f[4] || '') === part);
  return { files: rows.length, bytes: rows.reduce((s, f) => s + f[1], 0), download: rows.reduce((s, f) => s + (f[3] || f[1]), 0) };
}

async function storeBlob(file, cache) {
  const size = fs.statSync(file).size;
  const sha = await hashFile(file);
  await makeBlob(file, size, sha, cache);
  return sha;
}

async function gameEntry(id, manifest, digest) {
  const games = require('./parohod98-game.cjs');
  const info = games.storeInfo(id);
  checkNames(JSON.stringify([info.title, info.subtitle, info.genre, info.tags, info.desc, info.shots.map(s => s.caption)]), 'js/game-manager.js ' + id);
  const cache = readJson(PACKED_CACHE, {});
  const iconFile = path.join(WORK, 'parohod98-icons', id + '.png');
  fs.mkdirSync(path.dirname(iconFile), { recursive: true });
  fs.writeFileSync(iconFile, info.icon);
  const icon = await storeBlob(iconFile, cache);
  const shots = [];
  for (const s of info.shots) shots.push({ sha256: await storeBlob(s.file, cache), caption: s.caption });
  fs.writeFileSync(PACKED_CACHE, JSON.stringify(cache));
  const parts = {};
  for (const [name, part] of Object.entries(games.GAMES[id].parts)) {
    const sum = sumFiles(manifest.files, name);
    if (sum.files) parts[name] = Object.assign({ title: part.title }, sum);
  }
  return Object.assign({
    version: manifest.version, date: manifest.date, minApk: PAROHOD.minApk,
    manifest: id + '/manifest-' + manifest.version + '.json', notes: id + '/notes.json', digest
  }, sumFiles(manifest.files, ''), {
    title: info.title, subtitle: info.subtitle, genre: info.genre, tags: info.tags, desc: info.desc, credit: PAROHOD.credit,
    icon, shots, parts, needs: games.GAMES[id].needs || []
  });
}

function emptyCatalog(channel) {
  return { format: 'win98-update', v: 1, product: PAROHOD.product, channel, date: '', commit: '', blobs: '../blobs/', games: {} };
}

async function releaseParohodGames(args, ids) {
  const games = require('./parohod98-game.cjs');
  const key = loadKey();
  const channel = args.channel || 'test';
  if (!['test', 'stable'].includes(channel)) throw new Error('--channel is test or stable');
  const all = Object.keys(games.GAMES);
  ids = ids.length ? ids : all;
  for (const id of ids) if (!all.includes(id)) throw new Error('unknown game ' + id + ': ' + all.join(', '));
  const git = gitState();
  if (git.dirty && !(args.dirty && channel === 'test')) throw new Error('Uncommitted changes. Commit first, or use --dirty for the test channel.');
  const ptrs = await pointers(PAROHOD.product);
  const catalog = JSON.parse(JSON.stringify(ptrs[channel] || emptyCatalog(channel)));
  const now = new Date();
  const out = path.join(WORK, 'out-parohod98-' + Date.now());
  const metaFiles = [];
  const blobs = [];
  const released = [];
  for (const id of ids) {
    const prev = (ptrs.test && ptrs.test.games[id]) || (ptrs.stable && ptrs.stable.games[id]) || null;
    const dir = path.join(ROOT, 'dist', 'parohod98-games', id);
    const draft = games.build(id, dir, { edition: 'apk', version: prev ? prev.version : '1.0' });
    const digest = packageDigest(dir, draft.files);
    if (prev && prev.digest === digest) {
      console.log(games.GAMES[id].title + ': no changes since ' + prev.version);
      continue;
    }
    const nextFile = path.join(PAROHOD.notes, id, 'next.md');
    if (!fs.existsSync(nextFile)) throw new Error(games.GAMES[id].title + ' changed: write ' + path.relative(ROOT, nextFile) + ' first (what is new, for players)');
    const notes = parseNotes(fs.readFileSync(nextFile, 'utf8'), path.relative(ROOT, nextFile));
    const version = nextVersion({ stable: ptrs.stable && ptrs.stable.games[id], test: ptrs.test && ptrs.test.games[id] });
    console.log(games.GAMES[id].title + ' ' + version + ' → channel ' + channel + (git.dirty ? ' (dirty)' : ''));
    const built = games.build(id, dir, { edition: 'apk', version });
    if (!args['no-check']) {
      const check = await games.checkPackage(id, dir);
      console.log('  main menu in Edge, ' + check.requests + ' requests, no exceptions');
    }
    const manifest = await gameManifest(built, { game: id, version, date: isoDate(now), commit: git.commit });
    const entry = await gameEntry(id, manifest, digest);
    const date = isoDate(now).split('-').reverse().join('.');
    const notesEntry = { version, build: '', date, title: notes.title, summary: notes.summary, sections: notes.sections, fixed: notes.fixed };
    metaFiles.push(...writeSigned(out, PAROHOD.product + '/' + entry.manifest, manifest, key));
    metaFiles.push(...writeSigned(out, PAROHOD.product + '/' + entry.notes, notesJson(PAROHOD.product + '/' + id, path.join(PAROHOD.notes, id), notesEntry), key));
    blobs.push(...manifest.files.map(f => blobPath(f[2])), blobPath(entry.icon), ...entry.shots.map(s => blobPath(s.sha256)));
    catalog.games[id] = entry;
    released.push({ id, version, notes, date, nextFile });
    console.log('  ' + entry.files + ' files, ' + mb(entry.bytes) + ', download ' + mb(entry.download) + Object.entries(entry.parts).map(([n, p]) => ', part ' + n + ' ' + mb(p.download)).join(''));
  }
  if (!released.length) {
    console.log('Nothing to release.');
    return;
  }
  Object.assign(catalog, { channel, date: isoDate(now), commit: git.commit });
  const pointerName = PAROHOD.product + '/' + channel + '.json';
  metaFiles.push(...writeSigned(out, pointerName, catalog, key));
  await upload(PAROHOD.product, out, metaFiles, pointerName, blobs);
  fs.rmSync(out, { recursive: true, force: true });
  for (const r of released) {
    fs.writeFileSync(path.join(PAROHOD.notes, r.id, r.version + '.md'), versionMd(r.notes, r.version, '', r.date, []));
    fs.rmSync(r.nextFile);
    console.log('Notes: ' + path.relative(ROOT, path.join(PAROHOD.notes, r.id, r.version + '.md')) + ' (next.md removed)');
  }
  await verifyParohod(channel);
}

async function parohodBundle(channel) {
  const rel = PAROHOD.product + '/' + channel + '.json';
  const q = '?t=' + Date.now();
  const [a, b] = await Promise.all([getPublic(PUBLIC_URL + '/' + rel + q), getPublic(PUBLIC_URL + '/' + rel + '.sig' + q)]);
  if (!a.data || !b.data) return null;
  const sig = b.data.toString('utf8').trim();
  if (!verifyBytes(a.data, sig)) throw new Error(rel + ': bad signature');
  const catalog = JSON.parse(a.data.toString('utf8'));
  const pictures = {};
  for (const g of Object.values(catalog.games || {})) {
    for (const sha of [g.icon].concat((g.shots || []).map(s => s.sha256))) {
      const { data } = await getPublic(PUBLIC_URL + '/blobs/' + blobPath(sha));
      if (!data) throw new Error('picture ' + sha + ' is missing on the server');
      const raw = data[0] === 0x1f && data[1] === 0x8b ? zlib.gunzipSync(data) : data;
      if (sha256(raw) !== sha) throw new Error('picture ' + sha + ' does not match');
      pictures[sha] = raw;
    }
  }
  return { catalog: a.data, sig, pictures };
}

async function releaseParohodApk(args) {
  const key = loadKey();
  const channel = args.channel || 'test';
  if (!['test', 'stable'].includes(channel)) throw new Error('--channel is test or stable');
  const git = gitState();
  if (git.dirty && !(args.dirty && channel === 'test')) throw new Error('Uncommitted changes. Commit first, or use --dirty for the test channel.');
  const nextFile = path.join(PAROHOD.notes, 'next.md');
  if (!fs.existsSync(nextFile)) throw new Error('Write ' + path.relative(ROOT, nextFile) + ' first (what is new in the launcher, for players)');
  const notes = parseNotes(fs.readFileSync(nextFile, 'utf8'), path.relative(ROOT, nextFile));
  const ptrs = await pointers(PAROHOD.product);
  const known = { stable: ptrs.stable && ptrs.stable.apk && { version: ptrs.stable.apk.versionName }, test: ptrs.test && ptrs.test.apk && { version: ptrs.test.apk.versionName } };
  const version = args.version || nextVersion(known);
  if (!/^\d+\.\d+$/.test(version)) throw new Error('launcher versions are 1.N, not ' + version);
  for (const k of [known.stable, known.test]) if (k && compareVersions(version, k.version) <= 0) throw new Error('version ' + version + ' is not newer than ' + k.version);
  console.log('Пароход 98 ' + version + ' → channel ' + channel + (git.dirty ? ' (dirty)' : ''));
  const apkFile = path.join(ROOT, 'dist', 'Parohod98.apk');
  const bundle = await parohodBundle(channel);
  const apk = require('./parohod98-apk.cjs').buildApk(apkFile, { version, bundle });
  console.log('  APK ' + mb(apk.size) + ', versionCode ' + apk.versionCode + ', catalog copy with ' + Object.keys(bundle ? JSON.parse(bundle.catalog).games : {}).length + ' games and ' + apk.bundled + ' pictures');
  const now = new Date();
  const date = isoDate(now).split('-').reverse().join('.');
  const out = path.join(WORK, 'out-parohod98-apk-' + version);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, PAROHOD.product), { recursive: true });
  const apkName = 'Parohod98-' + version + '.apk';
  fs.copyFileSync(apkFile, path.join(out, PAROHOD.product, apkName));
  const metaFiles = [PAROHOD.product + '/' + apkName];
  const entry = { version, build: '', date, title: notes.title, summary: notes.summary, sections: notes.sections, fixed: notes.fixed };
  metaFiles.push(...writeSigned(out, PAROHOD.product + '/notes.json', notesJson(PAROHOD.product, PAROHOD.notes, entry), key));
  const catalog = JSON.parse(JSON.stringify(ptrs[channel] || emptyCatalog(channel)));
  catalog.apk = { url: apkName, versionName: version, versionCode: apk.versionCode, bytes: apk.size, sha256: await hashFile(apkFile) };
  Object.assign(catalog, { channel, date: isoDate(now), commit: git.commit });
  const pointerName = PAROHOD.product + '/' + channel + '.json';
  metaFiles.push(...writeSigned(out, pointerName, catalog, key));
  await upload(PAROHOD.product, out, metaFiles, pointerName, []);
  fs.rmSync(out, { recursive: true, force: true });
  fs.writeFileSync(path.join(PAROHOD.notes, version + '.md'), versionMd(notes, version, '', date, []));
  fs.rmSync(nextFile);
  console.log('Notes: releases/parohod98/' + version + '.md (next.md removed)');
  console.log('Link: ' + PUBLIC_URL + '/' + PAROHOD.product + '/' + apkName);
  await verifyParohod(channel);
}

async function promoteParohod(id, version) {
  const key = loadKey();
  const ptrs = await pointers(PAROHOD.product);
  const stable = JSON.parse(JSON.stringify(ptrs.stable || emptyCatalog('stable')));
  if (id === 'apk') {
    const apk = ptrs.test && ptrs.test.apk;
    if (!apk || apk.versionName !== version) throw new Error('test channel has launcher ' + (apk ? apk.versionName : 'nothing') + ', not ' + version);
    if (stable.apk && compareVersions(version, stable.apk.versionName) <= 0) throw new Error('stable already has launcher ' + stable.apk.versionName);
    stable.apk = apk;
  } else {
    const entry = ptrs.test && ptrs.test.games[id];
    if (!entry || entry.version !== version) throw new Error('test channel has ' + id + ' ' + (entry ? entry.version : 'nothing') + ', not ' + version);
    if (stable.games[id] && compareVersions(version, stable.games[id].version) <= 0) throw new Error('stable already has ' + id + ' ' + stable.games[id].version);
    stable.games[id] = entry;
  }
  Object.assign(stable, { channel: 'stable', date: isoDate(), commit: gitState().commit });
  const out = path.join(WORK, 'promote-parohod98');
  fs.rmSync(out, { recursive: true, force: true });
  const pointerName = PAROHOD.product + '/stable.json';
  await upload(PAROHOD.product, out, writeSigned(out, pointerName, stable, key), pointerName, []);
  await verifyParohod('stable');
}

async function checkBlobs(files, count) {
  const pool = files.slice();
  const sample = [];
  for (let i = 0; i < count && pool.length; i++) sample.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  let bytes = 0;
  for (const [rel, size, sha, packed] of sample) {
    const { res, data } = await getPublic(PUBLIC_URL + '/blobs/' + blobPath(sha));
    if (!data) throw new Error(rel + ': HTTP ' + res.status);
    const raw = packed ? zlib.gunzipSync(data) : data;
    if (raw.length !== size || sha256(raw) !== sha) throw new Error(rel + ': blob does not match the manifest');
    bytes += data.length;
  }
  return { sample, bytes };
}

async function verifyParohod(channel) {
  const ptr = await getSignedPublic(PAROHOD.product + '/' + channel + '.json');
  if (!ptr) throw new Error(PAROHOD.product + '/' + channel + '.json is missing');
  if (ptr.apk) {
    const notes = await getSignedPublic(PAROHOD.product + '/notes.json');
    if (!notes || !notes.versions.some(v => v.version === ptr.apk.versionName)) throw new Error('launcher notes have no ' + ptr.apk.versionName);
    const { res, data } = await getPublic(PUBLIC_URL + '/' + PAROHOD.product + '/' + ptr.apk.url);
    if (!data || data.length !== ptr.apk.bytes || sha256(data) !== ptr.apk.sha256) throw new Error(ptr.apk.url + ': HTTP ' + res.status + ', does not match the catalog');
    const head = await fetch(PUBLIC_URL + '/' + PAROHOD.product + '/' + ptr.apk.url, { method: 'HEAD' });
    console.log('Verified parohod98 ' + channel + ' launcher ' + ptr.apk.versionName + ': ' + ptr.apk.url + ' ' + mb(data.length) + ' sha256 ok, versionCode ' + ptr.apk.versionCode + ', type ' + head.headers.get('content-type'));
  }
  for (const [id, g] of Object.entries(ptr.games)) {
    const manifest = await getSignedPublic(PAROHOD.product + '/' + g.manifest);
    if (!manifest || manifest.version !== g.version || manifest.game !== id) throw new Error(id + ': manifest does not match the catalog');
    const notes = await getSignedPublic(PAROHOD.product + '/' + g.notes);
    if (!notes || !notes.versions.some(v => v.version === g.version)) throw new Error(id + ': notes have no ' + g.version);
    const pictures = [g.icon].concat(g.shots.map(s => s.sha256));
    for (const sha of pictures) {
      const { res, data } = await getPublic(PUBLIC_URL + '/blobs/' + blobPath(sha));
      if (!data || sha256(data) !== sha) throw new Error(id + ': picture ' + sha + ' HTTP ' + res.status);
    }
    const { sample, bytes } = await checkBlobs(manifest.files, 12);
    const radio = manifest.files.find(f => f[4]);
    let range = '';
    if (radio) {
      const r = await fetch(PUBLIC_URL + '/blobs/' + blobPath(radio[2]), { headers: { Range: 'bytes=0-99' } });
      await r.arrayBuffer();
      if (r.status !== 206) throw new Error(id + ': Range request gave ' + r.status);
      range = ', Range ' + r.status;
    }
    console.log('Verified parohod98 ' + channel + ' ' + id + ' ' + g.version + ': signatures ok, ' + sample.length + ' blobs ok (' + mb(bytes) + '), ' + pictures.length + ' pictures' + range);
  }
}

async function uploadFull(product, version) {
  const p = PRODUCTS[product];
  const archive = FULL_ARCHIVES[product];
  const remote = FTP_SITE + '/files/' + archive.name;
  const local = path.join(ROOT, 'dist', 'new-' + archive.name);
  fs.rmSync(local, { force: true });
  console.log('Full archive: ' + archive.name);
  execFileSync(BSDTAR, archive.tar.concat([local, path.basename(p.dist)]), { cwd: path.dirname(p.dist), stdio: 'inherit' });
  const bytes = fs.statSync(local).size;
  ftpPut([[local, remote + '.new']], 'full archive upload');
  const sent = ftpList(path.posix.dirname(remote)).find(e => e.name === archive.name + '.new');
  if (!sent || sent.size !== bytes) throw new Error(archive.name + ' did not arrive whole: ' + (sent ? sent.size : 0) + ' of ' + bytes + ' bytes');
  ftpRename(remote + '.new', remote);
  fs.renameSync(local, path.join(ROOT, 'dist', archive.name));
  return { url: '../../../files/' + archive.name, version, bytes };
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
  if (product !== 'win98-linux') {
    const notes = await getSignedPublic(product + '/notes.json');
    const entry = notes && notes.versions.find(v => v.version === version);
    await markFixed(product, displayVersion(pointer), entry ? entry.fixed.map(f => f.id).filter(Boolean) : []);
  }
  await verify(product, 'stable');
  if (product === 'win98') {
    const linux = await pointers('win98-linux');
    if (linux.test && linux.test.version === version) await promote('win98-linux', version);
  }
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
  const { sample, bytes } = await checkBlobs(manifest.files, 20);
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
  const ptrs = await pointers(PAROHOD.product);
  for (const ch of ['stable', 'test']) {
    const p = ptrs[ch];
    const games = p ? Object.entries(p.games).map(([id, g]) => id + ' ' + g.version).join(', ') : '';
    console.log('parohod98 ' + ch.padEnd(7) + (p ? (p.apk ? 'apk ' + p.apk.versionName + '  ' : '') + (games || 'no games') + '  ' + p.date + '  ' + p.commit : '—'));
  }
  const blobs = [...remoteBlobs().values()];
  console.log('blobs: ' + blobs.length + ' files, ' + mb(blobs.reduce((s, n) => s + n, 0)));
}

async function gc(args) {
  const keep = Number(args.keep || 5);
  const referenced = new Set();
  const dropFiles = [];
  for (const product of Object.keys(PRODUCTS)) {
    const ptrs = await pointers(product);
    const live = [ptrs.stable, ptrs.test].filter(Boolean).map(p => p.manifest);
    const names = remoteNames(FTP_UPDATE + '/' + product, /^manifest-.*\.json$/)
      .sort((a, b) => compareVersions(b.replace(/^manifest-|\.json$/g, ''), a.replace(/^manifest-|\.json$/g, '')));
    const kept = names.filter((n, i) => i < keep || live.includes(n));
    for (const n of names.filter(n => !kept.includes(n))) dropFiles.push(product + '/' + n, product + '/' + n + '.sig');
    const liveApk = [ptrs.stable, ptrs.test].filter(p => p && p.apk).map(p => p.apk.url);
    const apks = remoteNames(FTP_UPDATE + '/' + product, /^StarRail98-.*\.apk$/)
      .sort((a, b) => compareVersions(b.replace(/^StarRail98-|\.apk$/g, ''), a.replace(/^StarRail98-|\.apk$/g, '')));
    for (const n of apks.filter((n, i) => i >= keep && !liveApk.includes(n))) dropFiles.push(product + '/' + n);
    for (const n of kept) {
      const m = JSON.parse(ftpRead(FTP_UPDATE + '/' + product + '/' + n).toString('utf8'));
      for (const f of m.files) referenced.add(blobPath(f[2]));
    }
  }
  const pp = await pointers(PAROHOD.product);
  const liveLauncher = [pp.stable, pp.test].filter(p => p && p.apk).map(p => p.apk.url);
  const launcherApks = remoteNames(FTP_UPDATE + '/' + PAROHOD.product, /^Parohod98-[0-9.]+\.apk$/)
    .sort((a, b) => compareVersions(b.replace(/^Parohod98-|\.apk$/g, ''), a.replace(/^Parohod98-|\.apk$/g, '')));
  for (const n of launcherApks.filter((n, i) => i >= keep && !liveLauncher.includes(n))) dropFiles.push(PAROHOD.product + '/' + n);
  const liveGames = [pp.stable, pp.test].filter(Boolean).flatMap(p => Object.entries(p.games));
  for (const [, g] of liveGames) for (const sha of [g.icon].concat(g.shots.map(s => s.sha256))) referenced.add(blobPath(sha));
  for (const id of [...new Set(liveGames.map(([id]) => id))]) {
    const live = liveGames.filter(([gid]) => gid === id).map(([, g]) => path.posix.basename(g.manifest));
    const names = remoteNames(FTP_UPDATE + '/' + PAROHOD.product + '/' + id, /^manifest-.*\.json$/)
      .sort((a, b) => compareVersions(b.replace(/^manifest-|\.json$/g, ''), a.replace(/^manifest-|\.json$/g, '')));
    const kept = names.filter((n, i) => i < keep || live.includes(n));
    for (const n of names.filter(n => !kept.includes(n))) dropFiles.push(PAROHOD.product + '/' + id + '/' + n, PAROHOD.product + '/' + id + '/' + n + '.sig');
    for (const n of kept) {
      const m = JSON.parse(ftpRead(FTP_UPDATE + '/' + PAROHOD.product + '/' + id + '/' + n).toString('utf8'));
      for (const f of m.files) referenced.add(blobPath(f[2]));
    }
  }
  const unused = [...remoteBlobs().keys()].filter(b => !referenced.has(b));
  console.log('Unused blobs: ' + unused.length + ', old manifests and APKs: ' + dropFiles.length);
  if (!args.yes) {
    console.log('Nothing deleted. Run again with --yes to delete them.');
    return;
  }
  const list = unused.map(b => 'blobs/' + b).concat(dropFiles);
  ftpCommands(list.map(f => 'DELE ' + FTP_UPDATE + '/' + f), 'delete');
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
  const probe = path.join(WORK, 'ping.json');
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(probe, JSON.stringify({ ok: true }) + '\n');
  ftpPut([[probe, FTP_UPDATE + '/ping.json']], 'ping upload');
  fs.rmSync(probe, { force: true });
  console.log('ftp ' + FTP_HOST + ': ' + FTP_UPDATE + ' writable, ' + ftpList(FTP_UPDATE).length + ' entries');
  const res = await fetch(PUBLIC_URL + '/ping.json', { cache: 'no-store' });
  console.log('GET ' + PUBLIC_URL + '/ping.json: ' + res.status + ', cf-cache-status ' + res.headers.get('cf-cache-status'));
  if (!res.ok) process.exitCode = 1;
}

const USAGE = [
  'npm run release -- <command>',
  '  win98 [--channel test|stable] [--version 1.N] [--full] [--no-linux] [--dirty] [--skip-build] [--no-smoke] [--ignore-errors]',
  '  news [win98|sr98]',
  '  sr98 [--channel test|stable] [--version 1.6.N] [--full] [--no-pc] [--dirty] [--no-smoke] [--ignore-errors]',
  '  parohod98 [--channel test|stable] [--version 1.N] [--dirty]',
  '  parohod98 games [serioussam forza gtann] [--channel test|stable] [--no-check] [--dirty]',
  '  promote win98|sr98 <version> | promote parohod98 apk|<game> <version>',
  '  status',
  '  verify win98|sr98|parohod98 [--channel test|stable]',
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
  if (cmd === 'news' && (a1 || 'win98') === 'win98') return uploadNews('win98').then(() => uploadNews('win98-linux'));
  if (cmd === 'news') return uploadNews(a1);
  if (cmd === 'parohod98' && a1 === 'games') return releaseParohodGames(args, args._.slice(2));
  if (cmd === 'parohod98' && !a1) return releaseParohodApk(args);
  if (cmd === 'promote' && a1 === PAROHOD.product && a2 && args._[3]) return promoteParohod(a2, args._[3]);
  if (cmd === 'promote' && PRODUCTS[a1] && a2) return promote(a1, a2);
  if (cmd === 'status') return status();
  if (cmd === 'verify' && a1 === PAROHOD.product) return verifyParohod(args.channel || 'test');
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

module.exports = { packageDigest, gameManifest, gameEntry, emptyCatalog, parohodBundle, PAROHOD, nextSr98Version,EXE_EXCLUDED, RELEASE_FILE, VERSION_PATTERN, PRODUCTS, buildDate, isoDate, displayVersion, listFiles, hashTree, writeRelease, publicKeyText, parseNotes, versionMd, notesJson, newsJson, checkNames, nextVersion, fixedReports };
