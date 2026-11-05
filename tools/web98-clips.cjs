'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { stamp } = require('./web98-stamp.cjs');
const { gifs } = require('./web98-kovcheg.cjs');

const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web98-site');
const LANDING = path.join(WEB, 'index.html');

const BRAND = [
  ['Honkai: Star Rail 98', 'Star Rail 98'],
  ['HSR 98', 'SR98']
];

const SITES = {
  youvid: {
    dir: 'youvid',
    host: 'web98-youvid',
    css: 'youvid-site.css',
    before: ['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js'],
    pattern: /<script src="(js\/apps\/youvid\/[a-z0-9-]+\.js)"><\/script>/g,
    main: 'js/apps/youvid-site.js',
    exact: {
      'youvid-site.js': [
        ["site: 'hsr.hoyoverse.com'", "site: 'pennygachi.men/web98/sr98'"],
        ['Официальный сайт: hsr.hoyoverse.com', 'Сайт игры: pennygachi.men/web98/sr98'],
        ['· <a href="mailto:feedback@youvid.com">feedback@youvid.com</a>', '· <a href="../">Win 98 Web Edition</a>']
      ]
    },
    media: youvidMedia,
    noun: ['ролик', 'ролика', 'роликов']
  },
  poligon: {
    dir: 'poligon',
    host: 'web98-poligon',
    css: 'poligon-site.css',
    before: [],
    pattern: /<script src="(js\/apps\/poligon\/[a-z0-9-]+\.js)"><\/script>/g,
    main: 'js/apps/poligon-site.js',
    exact: {
      'poligon-site.js': [
        ['Заявки на клипы: <a href="mailto:poligon@poligon3d.ru">poligon@poligon3d.ru</a>', 'Сайт из <a href="../">Win 98 Web Edition</a>']
      ]
    },
    media: poligonMedia,
    noun: ['музыкальный клип', 'музыкальных клипа', 'музыкальных клипов']
  }
};

const MEDIA_EXACT = {
  'content/YouVid/banners/HSR98.svg': [
    [`<text x="26" y="34" font-family="Georgia, 'Times New Roman', serif" font-size="17" font-style="italic" letter-spacing="6" fill="#ebe4cc">Honkai:</text>`, ''],
    ['>hsr.hoyoverse.com<', '>pennygachi.men/web98/sr98<']
  ]
};

const mb = n => (n / 1048576).toFixed(1) + ' MB';

function scriptsOf(spec) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const list = [...html.matchAll(spec.pattern)].map(m => m[1]);
  if (!list.length) throw new Error(spec.dir + ': scripts not found in index.html');
  return [...spec.before, ...list, spec.main];
}

function evaluate(files) {
  const store = {};
  const sandbox = {
    console,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    addEventListener() {},
    removeEventListener() {}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const rel of files) vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
  return sandbox;
}

function youvidMedia(w) {
  const site = w.youvidSite;
  const files = new Set();
  const used = new Set();
  for (const v of site.videos) {
    const clip = site.clipFor(v.id);
    if (!clip) throw new Error('youvid: video ' + v.id + ' has no clip');
    files.add(clip.audio);
    site.thumbs(v).forEach(t => files.add(t));
    used.add(v.channel);
  }
  for (const id of used) {
    const ch = site.channels[id];
    files.add(site.avatar(ch));
    files.add(site.banner(ch));
  }
  return { files: [...files], count: site.videos.length };
}

function poligonMedia(w) {
  const clips = w.poligonSite.clips();
  return { files: clips.map(c => c.audio), count: clips.length };
}

function replaceAll(name, src, swaps) {
  let out = src;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(name + ': text to replace not found: ' + from.slice(0, 60));
    out = out.split(from).join(to);
  }
  return out;
}

function transform(spec, name, src) {
  let out = replaceAll(name, src, spec.exact[name] || []);
  for (const [from, to] of BRAND) out = out.split(from).join(to);
  return out;
}

function clean(dir, generator) {
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(dir)) return;
  if (!fs.existsSync(index) || !fs.readFileSync(index, 'utf8').includes(generator)) throw new Error(dir + ' exists and was not made by this tool');
  for (const e of fs.readdirSync(dir)) if (e !== 'content') fs.rmSync(path.join(dir, e), { recursive: true, force: true });
}

function syncMedia(out, files) {
  const keep = new Set(files.map(f => path.normalize(f)));
  let copied = 0, bytes = 0;
  for (const rel of files) {
    const from = path.join(ROOT, rel);
    const to = path.join(out, rel);
    if (!fs.existsSync(from)) throw new Error('missing media file: ' + rel);
    const st = fs.statSync(from);
    bytes += st.size;
    const swaps = MEDIA_EXACT[rel];
    if (!swaps && fs.existsSync(to) && fs.statSync(to).size === st.size && fs.statSync(to).mtimeMs >= st.mtimeMs) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (swaps) fs.writeFileSync(to, replaceAll(rel, fs.readFileSync(from, 'utf8'), swaps));
    else fs.copyFileSync(from, to);
    copied++;
  }
  let removed = 0;
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); if (!fs.readdirSync(p).length) fs.rmdirSync(p); }
      else if (!keep.has(path.relative(out, p))) { fs.rmSync(p); removed++; }
    }
  };
  walk(path.join(out, 'content'));
  return { copied, removed, bytes };
}

function plural(n, [one, few, many]) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

function fillLanding(key, text) {
  if (!fs.existsSync(LANDING)) return false;
  const html = fs.readFileSync(LANDING, 'utf8');
  const re = new RegExp(`(data-fill="${key}">)[^<]*`, 'g');
  const found = re.test(html);
  const next = html.replace(re, `$1${text}`);
  if (next !== html) fs.writeFileSync(LANDING, next);
  return found;
}

function build(key) {
  const spec = SITES[key];
  const out = path.join(WEB, spec.dir);
  const hostDir = path.join(__dirname, spec.host);
  const generator = `<meta name="generator" content="${spec.host}">`;
  const scripts = scriptsOf(spec);
  const media = spec.media(evaluate(scripts));
  clean(out, generator);
  fs.mkdirSync(path.join(out, 'site'), { recursive: true });
  let bytes = 0;
  const write = (rel, text) => { fs.writeFileSync(path.join(out, rel), text); bytes += Buffer.byteLength(text); };
  const bundle = scripts.map(rel => transform(spec, path.basename(rel), fs.readFileSync(path.join(ROOT, rel), 'utf8')));
  write(path.join('site', key + '.js'), bundle.join('\n;\n'));
  write(spec.css, fs.readFileSync(path.join(ROOT, 'css', 'apps', spec.css), 'utf8'));
  write('host.css', fs.readFileSync(path.join(hostDir, 'host.css'), 'utf8'));
  write('host.js', fs.readFileSync(path.join(hostDir, 'host.js'), 'utf8'));
  write('gifs.js', 'window.webGifs = ' + JSON.stringify(gifs()) + ';\n');
  const tags = [
    '  <script src="gifs.js" defer></script>',
    `  <script src="site/${key}.js" defer></script>`,
    '  <script src="host.js" defer></script>'
  ].join('\n');
  const html = fs.readFileSync(path.join(hostDir, 'index.html'), 'utf8')
    .replace('{{generator}}', generator)
    .replace('{{scripts}}', tags);
  if (html.includes('{{')) throw new Error(spec.host + '/index.html template has unfilled slots');
  write('index.html', html);
  const synced = syncMedia(out, media.files);
  const filled = fillLanding(key, media.count + ' ' + plural(media.count, spec.noun));
  return { out, scripts: scripts.length, bytes, media: synced, files: media.files.length, count: media.count, filled };
}

if (require.main === module) {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SITES);
  for (const key of keys) {
    if (!SITES[key]) throw new Error('unknown site: ' + key + ' (use ' + Object.keys(SITES).join(', ') + ')');
    const r = build(key);
    console.log(key + ' site -> ' + path.relative(ROOT, r.out));
    console.log('  ' + r.scripts + ' scripts in site/' + key + '.js, ' + mb(r.bytes) + ' written; ' + r.files + ' media files, ' + mb(r.media.bytes) + ' (' + r.media.copied + ' copied, ' + r.media.removed + ' removed)');
    console.log('  ' + r.count + (key === 'youvid' ? ' videos' : ' clips') + (r.filled ? ', landing updated' : ', no data-fill="' + key + '" on the landing'));
  }
  stamp();
}

module.exports = { build, transform, SITES };
