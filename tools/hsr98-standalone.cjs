'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MARK = 'hsr98-standalone';
const MUSIC_PREFIX = 'content/';
const MEDIA = /'(content\/[^']+\.(?:mid|mp3|ogg|wav))'/g;

const packName = url => url.slice(MUSIC_PREFIX.length).replace(/[^A-Za-z0-9.]+/g, '-') + '.js';

function readPage() {
  const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
  const boot = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length || styles.length !== 1 || boot.length !== 1) throw new Error('hsr98.html layout changed: ' + scripts.length + ' scripts, ' + styles.length + ' styles, ' + boot.length + ' inline');
  return { scripts, style: styles[0], boot: boot[0] };
}

function prepareOut(out) {
  if (!fs.existsSync(out)) { fs.mkdirSync(out, { recursive: true }); return; }
  const entries = fs.readdirSync(out);
  if (!entries.length) return;
  const index = path.join(out, 'index.html');
  const ours = fs.existsSync(index) && fs.readFileSync(index, 'utf8').includes('content="' + MARK + '"');
  if (!ours) throw new Error(out + ' is not empty and was not made by this tool');
  for (const e of entries) fs.rmSync(path.join(out, e), { recursive: true, force: true });
}

function musicUrls(files) {
  const urls = new Set();
  for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(MEDIA)) urls.add(m[1]);
  return [...urls].sort();
}

function pageHtml(scripts, boot, edition) {
  const tags = ['<script>window.Hsr98Standalone=' + JSON.stringify(edition) + ';</script>', ...['game/files.js', ...scripts].map(s => '<script src="' + s + '"></script>')].join('');
  return '<!doctype html>\n' +
    '<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="generator" content="' + MARK + '"><title>Star Rail 98</title>\n' +
    '<link rel="stylesheet" href="game/hsr98.css"><link rel="stylesheet" href="game/touch.css">\n' +
    '<style>html,body{height:100%;margin:0;background:#000;overflow:hidden;touch-action:none;overscroll-behavior:none}#game{width:100vw;height:100vh}</style></head>\n' +
    '<body><div id="game"></div>\n' + tags + '\n<script>' + boot + '</script>\n<script src="game/touch.js"></script>\n</body></html>\n';
}

function build(out, edition = 'web') {
  out = path.resolve(out);
  const page = readPage();
  prepareOut(out);
  fs.mkdirSync(path.join(out, 'game'));
  fs.mkdirSync(path.join(out, 'music'));
  const sources = page.scripts.map(s => path.join(ROOT, s));
  const names = sources.map(s => path.basename(s));
  const twin = names.find((n, i) => names.indexOf(n) !== i);
  if (twin) throw new Error('two hsr98.html scripts share the file name ' + twin);
  const local = [];
  let bytes = 0;
  for (const src of sources) {
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(out, 'game', name));
    bytes += fs.statSync(src).size;
    local.push('game/' + name);
  }
  fs.copyFileSync(path.join(ROOT, page.style), path.join(out, 'game', 'hsr98.css'));
  for (const f of ['files.js', 'touch.js', 'touch.css']) fs.copyFileSync(path.join(__dirname, 'hsr98-standalone', f), path.join(out, 'game', f));
  const urls = musicUrls(sources);
  let musicBytes = 0;
  for (const url of urls) {
    const data = fs.readFileSync(path.join(ROOT, url));
    musicBytes += data.length;
    fs.writeFileSync(path.join(out, 'music', packName(url)), 'Hsr98Files[' + JSON.stringify(url) + ']="' + data.toString('base64') + '";\n');
  }
  fs.writeFileSync(path.join(out, 'index.html'), pageHtml(local, page.boot, edition));
  return { out, scripts: local.length, bytes, music: urls, musicBytes };
}

if (require.main === module) {
  const out = process.argv[2] || path.join(ROOT, 'dist', 'HonkaiStarRail98');
  const r = build(out);
  const mb = n => (n / 1048576).toFixed(1) + ' MB';
  console.log('Honkai: Star Rail 98 standalone -> ' + r.out);
  console.log('  scripts: ' + r.scripts + ' (' + mb(r.bytes) + ')');
  console.log('  music: ' + r.music.length + ' files (' + mb(r.musicBytes) + ')');
  console.log('  open ' + path.join(r.out, 'index.html'));
}

module.exports = { build, packName, MUSIC_PREFIX };
