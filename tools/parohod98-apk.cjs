'use strict';
const fs = require('fs');
const path = require('path');
const { packApk, minutesSince2026, homeKey } = require('./android-apk.cjs');
const games = require('./parohod98-game.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'parohod98');
const ANDROID = path.join(SRC, 'android');
const JAVA = ['Json.java', 'Ed25519.java', 'Fetch.java', 'Store.java', 'App.java', 'DownloadService.java', 'ApkUpdate.java', 'Web.java', 'Device.java', 'Tilt.java', 'Speech.java', 'LauncherActivity.java', 'GameActivity.java'];
const UPDATE_BASE = process.env.PAROHOD98_UPDATE_BASE || 'https://pennygachi.men/web98/update/';
const LAUNCHER_FILES = ['index.html', 'launcher.css', 'launcher-state.js', 'launcher.js'];
const LAUNCHER_FONTS = ['dejavu-condensed-400.woff2', 'dejavu-condensed-700.woff2', 'dejavu-LICENSE.txt'];
const KEY = { file: process.env.PAROHOD98_KEYSTORE || homeKey('parohod98.keystore'), alias: 'parohod98', pass: 'parohod98-android', dname: 'CN=Parohod 98, O=win98-clone' };

function stamped(html, version) {
  const stamp = '<script>window.Win98Build=' + JSON.stringify(games.buildStamp(version)) + ';</script>';
  if (!html.includes('<script src="../js/bugreport-core.js">')) throw new Error('launcher page must load ../js/bugreport-core.js');
  return html.replace('<script src="../js/bugreport-core.js">', stamp + '<script src="../js/bugreport-core.js">');
}

function stageLauncher(www, probe, version) {
  const dir = path.join(www, 'launcher');
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(SRC, probe ? 'probe' : 'launcher');
  const files = probe ? ['probe.css', 'probe.js'] : LAUNCHER_FILES.filter(f => f !== 'index.html');
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, 'index.html'), stamped(fs.readFileSync(path.join(src, 'index.html'), 'utf8'), version));
  fs.copyFileSync(path.join(ANDROID, 'icon.png'), path.join(dir, 'icon.png'));
  if (!probe) {
    fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
    for (const f of LAUNCHER_FONTS) fs.copyFileSync(path.join(SRC, 'fonts', f), path.join(dir, 'fonts', f));
  }
  fs.mkdirSync(path.join(www, 'js'), { recursive: true });
  for (const f of probe ? ['bugreport-core.js'] : ['bugreport-core.js', 'bugreport-shot.js', 'parohod98-report.js']) fs.copyFileSync(path.join(ROOT, 'js', f), path.join(www, 'js', f));
}

function publicKey() {
  const m = /const PUBLIC_KEY = '([A-Za-z0-9+/=]{44})'/.exec(fs.readFileSync(path.join(ROOT, 'electron', 'updater.js'), 'utf8'));
  if (!m) throw new Error('PUBLIC_KEY not found in electron/updater.js');
  return m[1];
}

function configJava(dir) {
  const file = path.join(dir, 'Config.java');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, [
    'package com.win98clone.parohod98;',
    '',
    'final class Config {',
    '    static final String PUBLIC_KEY = ' + JSON.stringify(publicKey()) + ';',
    '    static final String UPDATE_BASE = ' + JSON.stringify(UPDATE_BASE) + ';',
    '',
    '    private Config() {}',
    '}',
    ''
  ].join('\n'));
  return file;
}

function stageBundle(assets, bundle) {
  if (!bundle) return 0;
  const dir = path.join(assets, 'bundled');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'catalog.json'), bundle.catalog);
  fs.writeFileSync(path.join(dir, 'catalog.json.sig'), bundle.sig);
  for (const [sha, data] of Object.entries(bundle.pictures || {})) {
    if (!/^[0-9a-f]{64}$/.test(sha)) throw new Error('bundled picture name ' + sha);
    fs.writeFileSync(path.join(dir, sha), data);
  }
  return Object.keys(bundle.pictures || {}).length;
}

function stageWww(www, { probe, version }) {
  stageLauncher(www, probe, version);
  const list = [];
  if (probe) for (const id of Object.keys(games.GAMES)) list.push(games.build(id, path.join(www, 'games', id), { edition: 'probe', version }));
  return list;
}

function buildApk(out, opts = {}) {
  const version = opts.version || (opts.probe ? '0.1' : '1.0');
  const work = path.join(ROOT, 'dist', 'parohod98-apk-work');
  fs.rmSync(work, { recursive: true, force: true });
  const staged = stageWww(path.join(work, 'assets', 'www'), { probe: opts.probe, version });
  const bundled = opts.probe ? 0 : stageBundle(path.join(work, 'assets'), opts.bundle);
  const versionCode = minutesSince2026();
  const versionName = opts.probe ? version + ' (замер)' : version;
  const manifest = fs.readFileSync(path.join(ANDROID, 'AndroidManifest.xml'), 'utf8').replace('{{versionCode}}', versionCode).replace('{{versionName}}', versionName);
  const apk = packApk({
    work, manifest, out: path.resolve(out), key: KEY, minApi: 26,
    icon: path.join(ANDROID, 'icon.png'),
    java: JAVA.map(f => path.join(ANDROID, f)).concat(configJava(path.join(work, 'gen'))),
    packageDir: path.join('com', 'win98clone', 'parohod98')
  });
  fs.rmSync(work, { recursive: true, force: true });
  return { out: apk.out, size: apk.size, versionName, versionCode, keystore: apk.keystore, bundled, games: staged.map(g => ({ id: g.id, files: g.files.length, bytes: g.bytes })) };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const probe = args.includes('--probe');
  const v = args.indexOf('--version');
  const version = v >= 0 ? args[v + 1] : undefined;
  const rest = args.filter((a, i) => !a.startsWith('--') && !(v >= 0 && i === v + 1));
  const out = path.resolve(rest[0] || path.join(ROOT, 'dist', probe ? 'Parohod98-probe.apk' : 'Parohod98.apk'));
  const r = buildApk(out, { probe, version });
  console.log('Пароход 98 APK -> ' + r.out);
  console.log('  ' + (r.size / 1048576).toFixed(1) + ' MB, versionName ' + r.versionName + ', versionCode ' + r.versionCode);
  for (const g of r.games) console.log('  ' + g.id + ': ' + g.files + ' files, ' + (g.bytes / 1048576).toFixed(2) + ' MB');
  console.log('  signed with ' + r.keystore);
}

module.exports = { buildApk, stageWww, stageBundle, publicKey, KEY, JAVA, UPDATE_BASE, LAUNCHER_FILES };
