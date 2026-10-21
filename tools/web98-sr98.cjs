'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { build } = require('./hsr98-standalone.cjs');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'web98-site', 'sr98');
const PLAY = path.join(SITE, 'play');
const APK_NAME = 'StarRail98.apk';
const DIST_APK = path.join(ROOT, 'dist', APK_NAME);
const mb = n => (n / 1048576).toFixed(1) + ' MB';

function apkVersion() {
  const m = fs.readFileSync(path.join(__dirname, 'hsr98-apk.cjs'), 'utf8').match(/const VERSION_NAME = '([^']+)'/);
  if (!m) throw new Error('VERSION_NAME not found in tools/hsr98-apk.cjs');
  return m[1];
}

function buildPlay() {
  const r = build(PLAY);
  const html = fs.readFileSync(path.join(PLAY, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="(game\/[^"]+)"><\/script>/g)].map(m => m[1]).filter(s => s !== 'game/touch.js');
  const gameBytes = scripts.reduce((sum, s) => sum + fs.statSync(path.join(PLAY, s)).size, 0);
  return { r, scripts, gameBytes };
}

function buildApk(skip) {
  if (!skip) {
    const run = spawnSync(process.execPath, [path.join(__dirname, 'hsr98-apk.cjs')], { cwd: ROOT, stdio: 'inherit' });
    if (run.status !== 0) console.warn('APK build failed, using the existing ' + path.relative(ROOT, DIST_APK));
  }
  if (!fs.existsSync(DIST_APK)) throw new Error(DIST_APK + ' is missing: run npm run build:hsr98-apk');
  fs.copyFileSync(DIST_APK, path.join(SITE, APK_NAME));
  return fs.statSync(DIST_APK).size;
}

function copyShots() {
  fs.mkdirSync(path.join(SITE, 'img'), { recursive: true });
  for (const n of [1, 2]) fs.copyFileSync(path.join(ROOT, 'content', 'steam', `hsr98-${n}.jpg`), path.join(SITE, 'img', `hsr98-${n}.jpg`));
}

function writeIndex(scripts, info) {
  const file = path.join(SITE, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const tags = scripts.map(s => `  <script src="play/${s}" defer></script>\n`).join('');
  const json = JSON.stringify(info);
  const re = /(  <script type="application\/json" id="sr98-build">)[^<]*(<\/script>\n)(?:  <script src="play\/game\/[^"]+" defer><\/script>\n)*(  <script src="site\.js" defer><\/script>)/;
  if (!re.test(html)) throw new Error('sr98/index.html layout changed');
  html = html.replace(re, (all, open, close, site) => open + json + close + tags + site);
  fs.writeFileSync(file, html);
}

function main() {
  const skipApk = process.argv.includes('--no-apk');
  const play = buildPlay();
  const apkBytes = buildApk(skipApk);
  copyShots();
  const info = { version: apkVersion(), apk: APK_NAME, apkBytes, gameBytes: play.gameBytes };
  writeIndex(play.scripts, info);
  console.log('sr98 site -> ' + path.relative(ROOT, SITE));
  console.log('  play: ' + play.r.scripts + ' scripts (' + mb(play.r.bytes) + '), music ' + play.r.music.length + ' packs (' + mb(play.r.musicBytes) + ')');
  console.log('  apk: ' + APK_NAME + ' ' + mb(apkBytes) + ', version ' + info.version);
}

main();
