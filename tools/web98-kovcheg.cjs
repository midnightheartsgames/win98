'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'web98-site', 'kovcheg');
const SR98_PLAY = path.join(ROOT, 'web98-site', 'sr98', 'play', 'index.html');
const HOST_DIR = path.join(__dirname, 'web98-kovcheg');
const GENERATOR = '<meta name="generator" content="web98-kovcheg">';

const BRAND = [
  ['Honkai: Star Rail 98', 'Star Rail 98'],
  ['KonoSuba x HSR 98', 'KonoSuba x SR98'],
  ['HSR 98', 'SR98']
];

const EXACT = {
  'kovcheg-data.js': [['игра вышла в Steam, а мы', 'вышло обновление игры, а мы']],
  'kovcheg-hsr.js': [['после выхода игры в Steam', 'после обновления игры']],
  'kovcheg-site.js': [
    ['Её можно скачать с <a data-url="http://hsr.hoyoverse.com">официального сайта</a> или взять в Steam.<br>',
      'В неё можно играть прямо в браузере или поставить на Android, всё есть на <a data-url="http://hsr.hoyoverse.com">сайте игры</a>.<br>'],
    ['data-kv-steam="hsr98">Найти в Steam</button>', 'data-kv-steam="hsr98">Играть в браузере</button>']
  ],
  'kovcheg-site-mine.js': [
    ['Игра записывает каждое сохранение в папку <b>${SAVE_PATH}</b>: SAVE1.SAV, SAVE2.SAV, SAVE3.SAV и AUTOSAVE.SAV. Сайт прочитает файл у вас на компьютере и никуда его не отправит.',
      'Если вы играете в Star Rail 98 в браузере на этом сайте, кнопка «Обзор...» покажет ваши сохранения: три ячейки и автосохранение. Можно выбрать и файл SAVE1.SAV, SAVE2.SAV, SAVE3.SAV или AUTOSAVE.SAV с диска. Сайт прочитает его у вас в браузере и никуда не отправит.'],
    ['Игра не установлена, сохранений пока нет. HSR 98 бесплатна: <button class="win-btn kv-btn" data-kv-steam="hsr98">Открыть в Steam</button>',
      'Сохранений Star Rail 98 в этом браузере пока нет. Игра бесплатная: <button class="win-btn kv-btn" data-kv-steam="hsr98">Играть в браузере</button>']
  ]
};

const mb = n => (n / 1048576).toFixed(1) + ' MB';

function kovchegScripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const list = [...html.matchAll(/<script src="js\/apps\/(kovcheg-[a-z-]+\.js)"><\/script>/g)].map(m => m[1]);
  if (!list.includes('kovcheg-site.js')) throw new Error('kovcheg scripts not found in index.html');
  return list;
}

function gameScripts() {
  if (!fs.existsSync(SR98_PLAY)) throw new Error('web98-site/sr98/play is missing: run node tools/web98-sr98.cjs first');
  const html = fs.readFileSync(SR98_PLAY, 'utf8');
  return [...html.matchAll(/<script src="(game\/[^"]+)"><\/script>/g)].map(m => m[1]).filter(s => s !== 'game/touch.js' && s !== 'game/files.js');
}

function transform(name, src) {
  let out = src;
  for (const [from, to] of EXACT[name] || []) {
    if (!out.includes(from)) throw new Error(name + ': text to replace not found: ' + from.slice(0, 60));
    out = out.split(from).join(to);
  }
  for (const [from, to] of BRAND) out = out.split(from).join(to);
  return out;
}

function gifs() {
  const sandbox = { window: {}, document: { createElement: () => ({ getContext: () => null }) }, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'icons.js'), 'utf8'), sandbox, { filename: 'icons.js' });
  const icons = sandbox.window.Icons || vm.runInContext('typeof Icons !== "undefined" ? Icons : null', sandbox);
  if (!icons) throw new Error('Icons not found in js/icons.js');
  const out = {};
  for (const [k, v] of Object.entries(icons)) if (k.startsWith('gif-') && typeof v === 'string') out[k.slice(4)] = v;
  if (!out.warn || !out.star) throw new Error('gif icons missing');
  return out;
}

function catalog() {
  const sandbox = { localStorage: { getItem: () => null, setItem() {} }, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'game-manager.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'apps', 'kovcheg-data.js'), 'utf8'), sandbox);
  const all = sandbox.gameManager.catalog, out = {};
  for (const g of sandbox.kovchegData.games) {
    if (!all[g.id]) throw new Error('game ' + g.id + ' missing from the catalog');
    out[g.id] = { title: BRAND.reduce((t, [x, y]) => t.split(x).join(y), all[g.id].title) };
  }
  return out;
}

function clean(dir) {
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(dir)) return;
  if (!fs.existsSync(index) || !fs.readFileSync(index, 'utf8').includes(GENERATOR)) throw new Error(dir + ' exists and was not made by this tool');
  fs.rmSync(dir, { recursive: true, force: true });
}

function build(out = OUT) {
  clean(out);
  fs.mkdirSync(path.join(out, 'site'), { recursive: true });
  let bytes = 0;
  const write = (rel, text) => { fs.writeFileSync(path.join(out, rel), text); bytes += Buffer.byteLength(text); };
  const own = kovchegScripts();
  for (const name of own) write(path.join('site', name), transform(name, fs.readFileSync(path.join(ROOT, 'js', 'apps', name), 'utf8')));
  write('kovcheg.css', fs.readFileSync(path.join(ROOT, 'css', 'apps', 'kovcheg.css'), 'utf8'));
  write('host.css', fs.readFileSync(path.join(HOST_DIR, 'host.css'), 'utf8'));
  write('host.js', fs.readFileSync(path.join(HOST_DIR, 'host.js'), 'utf8'));
  write('gifs.js', 'window.kovchegGifs = ' + JSON.stringify(gifs()) + ';\n');
  const game = gameScripts();
  const info = { catalog: catalog() };
  const tags = [
    '  <script>window.Hsr98Standalone = "web";</script>',
    ...game.map(s => `  <script src="../sr98/play/${s}" defer></script>`),
    '  <script src="gifs.js" defer></script>',
    ...own.map(s => `  <script src="site/${s}" defer></script>`),
    '  <script src="host.js" defer></script>'
  ].join('\n');
  const html = fs.readFileSync(path.join(HOST_DIR, 'index.html'), 'utf8')
    .replace('{{generator}}', GENERATOR)
    .replace('{{build}}', JSON.stringify(info))
    .replace('{{scripts}}', tags);
  if (html.includes('{{')) throw new Error('index.html template has unfilled slots');
  write('index.html', html);
  return { out, own: own.length, game: game.length, bytes };
}

if (require.main === module) {
  const r = build(process.argv[2] ? path.resolve(process.argv[2]) : OUT);
  console.log('kovcheg site -> ' + path.relative(ROOT, r.out));
  console.log('  ' + r.own + ' site scripts, ' + r.game + ' game scripts from ../sr98/play, ' + mb(r.bytes) + ' written');
}

module.exports = { build, transform, BRAND };
