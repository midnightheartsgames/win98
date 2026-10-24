'use strict';
const fs = require('fs');
const path = require('path');
const { stamp } = require('./web98-stamp.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'web98-site', 'sr98wiki');
const SR98_PLAY = path.join(ROOT, 'web98-site', 'sr98', 'play', 'index.html');
const HOST_DIR = path.join(__dirname, 'web98-astralwiki98');
const GENERATOR = '<meta name="generator" content="web98-astralwiki98">';
const SCRIPTS = ['hsr-wiki-data.js', 'hsr-wiki-cones.js', 'hsr-wiki-site.js'];

const BRAND = [
  ['Honkai: Star Rail 98', 'Star Rail 98'],
  ['KonoSuba x HSR 98', 'KonoSuba x SR98'],
  ['HSR 98', 'SR98']
];

const EXACT = {
  'hsr-wiki-site.js': [
    ["${A('http://hsr.hoyoverse.com/download', 'Скачать с hsr.hoyoverse.com', 'hwk-btn hwk-btn-hi')} <button type=\"button\" class=\"hwk-btn\" data-aw-steam=\"hsr98\">Открыть в Steam</button>",
      "<button type=\"button\" class=\"hwk-btn hwk-btn-hi\" data-aw-steam=\"hsr98\">Играть в браузере</button> ${A('http://hsr.hoyoverse.com/download', 'Android-версия', 'hwk-btn')}"],
    ['Сохранение игры на этом компьютере не найдено. Игра бесплатна.', 'Сохранение игры в этом браузере не найдено. Игра бесплатна.'],
    ['<button type="button" class="hwk-btn" data-aw-steam="hsr98">В Steam</button>', '<button type="button" class="hwk-btn" data-aw-steam="hsr98">Играть</button>'],
    ['Официальный сайт игры: ${A(\'http://hsr.hoyoverse.com\', \'hsr.hoyoverse.com\')}', 'Сайт игры: ${A(\'http://hsr.hoyoverse.com\', \'Star Rail 98\')}'],
    ["${A('http://hsr.hoyoverse.com', '&lt;&lt; hsr.hoyoverse.com')}", "${A('http://hsr.hoyoverse.com', '&lt;&lt; сайт Star Rail 98')}"],
    ['делают поклонники игры, официальный сайт: hsr.hoyoverse.com.', 'делают поклонники игры, сайт игры: pennygachi.men/web98/sr98.'],
    ['Правка хранится в вашем браузере и видна только на этом компьютере.', 'Правка хранится в вашем браузере и видна только вам.'],
    ['Ваши правки на этом компьютере', 'Ваши правки в этом браузере'],
    ['data-aw-export-title="${esc(title)}">Сохранить в Блокнот<', 'data-aw-export-title="${esc(title)}">Скачать как .txt<']
  ]
};

const mb = n => (n / 1048576).toFixed(1) + ' MB';

function gameScripts() {
  if (!fs.existsSync(SR98_PLAY)) throw new Error('web98-site/sr98/play is missing: run node tools/web98-sr98.cjs first');
  const html = fs.readFileSync(SR98_PLAY, 'utf8');
  return [...html.matchAll(/<script src="(game\/[^"?]+)(?:\?v=[0-9a-f]*)?"><\/script>/g)].map(m => m[1]).filter(s => s !== 'game/touch.js' && s !== 'game/files.js');
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
  for (const name of SCRIPTS) write(path.join('site', name), transform(name, fs.readFileSync(path.join(ROOT, 'js', 'apps', name), 'utf8')));
  write('hsr-wiki.css', fs.readFileSync(path.join(ROOT, 'css', 'apps', 'hsr-wiki.css'), 'utf8'));
  write('host.css', fs.readFileSync(path.join(HOST_DIR, 'host.css'), 'utf8'));
  write('host.js', fs.readFileSync(path.join(HOST_DIR, 'host.js'), 'utf8'));
  const game = gameScripts();
  const tags = [
    '  <script>window.Hsr98Standalone = "web";</script>',
    ...game.map(s => `  <script src="../sr98/play/${s}" defer></script>`),
    ...SCRIPTS.map(s => `  <script src="site/${s}" defer></script>`),
    '  <script src="host.js" defer></script>'
  ].join('\n');
  const html = fs.readFileSync(path.join(HOST_DIR, 'index.html'), 'utf8')
    .replace('{{generator}}', GENERATOR)
    .replace('{{scripts}}', tags);
  if (html.includes('{{')) throw new Error('index.html template has unfilled slots');
  write('index.html', html);
  return { out, own: SCRIPTS.length, game: game.length, bytes };
}

if (require.main === module) {
  const r = build(process.argv[2] ? path.resolve(process.argv[2]) : OUT);
  stamp();
  console.log('astralwiki98 site -> ' + path.relative(ROOT, r.out));
  console.log('  ' + r.own + ' site scripts, ' + r.game + ' game scripts from ../sr98/play, ' + mb(r.bytes) + ' written');
}

module.exports = { build, transform, BRAND };
