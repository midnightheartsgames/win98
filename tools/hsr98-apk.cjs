'use strict';
const fs = require('fs');
const path = require('path');
const { build, gameVersion } = require('./hsr98-standalone.cjs');
const { findTools, packApk, minutesSince2026, homeKey } = require('./android-apk.cjs');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(__dirname, 'hsr98-standalone', 'android');
const KEY = { file: process.env.HSR98_KEYSTORE || homeKey('hsr98.keystore'), alias: 'hsr98', pass: 'hsr98-android', dname: 'CN=Star Rail 98, O=win98-clone' };

function buildApk(out, version = 'dev') {
  const work = path.join(ROOT, 'dist', 'hsr98-apk-work');
  fs.rmSync(work, { recursive: true, force: true });
  const site = build(path.join(work, 'assets', 'www'), 'apk', version);
  const versionName = version === 'dev' ? gameVersion() : version;
  const versionCode = minutesSince2026();
  const manifest = fs.readFileSync(path.join(ANDROID, 'AndroidManifest.xml'), 'utf8').replace('{{versionCode}}', versionCode).replace('{{versionName}}', versionName);
  const apk = packApk({
    work, manifest, out: path.resolve(out), key: KEY,
    icon: path.join(ANDROID, 'icon.png'),
    java: [path.join(ANDROID, 'MainActivity.java')],
    packageDir: path.join('com', 'win98clone', 'hsr98')
  });
  fs.rmSync(work, { recursive: true, force: true });
  return { out: apk.out, versionName, versionCode, size: apk.size, scripts: site.scripts, music: site.music.length, keystore: apk.keystore };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const v = args.indexOf('--version');
  const version = v >= 0 ? args.splice(v, 2)[1] : 'dev';
  const out = path.resolve(args[0] || path.join(ROOT, 'dist', 'StarRail98.apk'));
  const r = buildApk(out, version);
  console.log('Honkai: Star Rail 98 APK -> ' + r.out);
  console.log('  ' + (r.size / 1048576).toFixed(1) + ' MB, versionName ' + r.versionName + ', versionCode ' + r.versionCode + ', ' + r.scripts + ' scripts, ' + r.music + ' music packs');
  console.log('  signed with ' + r.keystore);
}

module.exports = { buildApk, findTools };
