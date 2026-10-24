'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { build } = require('./hsr98-standalone.cjs');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(__dirname, 'hsr98-standalone', 'android');
const PACKAGE_DIR = path.join('com', 'win98clone', 'hsr98');
const VERSION_NAME = '1.6';
const KEY_ALIAS = 'hsr98';
const KEY_PASS = 'hsr98-android';
const exe = process.platform === 'win32' ? '.exe' : '';

const versionNumber = (a, b) => {
  const pa = a.split(/[.-]/).map(Number), pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};
const newest = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(d => /^[\d.]+$/.test(d)).sort(versionNumber).pop() : null;

function unityAndroid() {
  const hub = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Unity', 'Hub', 'Editor');
  if (!fs.existsSync(hub)) return null;
  const editors = fs.readdirSync(hub).sort(versionNumber).reverse();
  for (const e of editors) {
    const p = path.join(hub, e, 'Editor', 'Data', 'PlaybackEngines', 'AndroidPlayer');
    if (fs.existsSync(path.join(p, 'SDK', 'build-tools'))) return p;
  }
  return null;
}

function findTools() {
  const unity = unityAndroid();
  const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, unity && path.join(unity, 'SDK')].find(d => d && fs.existsSync(path.join(d, 'build-tools')));
  if (!sdk) throw new Error('Android SDK not found: set ANDROID_HOME');
  const bt = path.join(sdk, 'build-tools', newest(path.join(sdk, 'build-tools')));
  const platform = fs.readdirSync(path.join(sdk, 'platforms')).filter(p => /^android-\d+$/.test(p) && fs.existsSync(path.join(sdk, 'platforms', p, 'android.jar'))).sort((a, b) => a.slice(8) - b.slice(8)).pop();
  if (!platform) throw new Error('no android-N platform with android.jar in ' + sdk);
  const androidJar = path.join(sdk, 'platforms', platform, 'android.jar');
  const jdk = [process.env.JAVA_HOME, unity && path.join(unity, 'OpenJDK')].find(d => d && fs.existsSync(path.join(d, 'bin', 'javac' + exe)));
  const bin = n => jdk ? path.join(jdk, 'bin', n + exe) : n;
  const t = {
    aapt2: path.join(bt, 'aapt2' + exe), aapt: path.join(bt, 'aapt' + exe), zipalign: path.join(bt, 'zipalign' + exe),
    d8: path.join(bt, 'lib', 'd8.jar'), apksigner: path.join(bt, 'lib', 'apksigner.jar'),
    androidJar, java: bin('java'), javac: bin('javac'), keytool: bin('keytool')
  };
  for (const [k, f] of Object.entries(t)) if (path.isAbsolute(f) && !fs.existsSync(f)) throw new Error(k + ' not found: ' + f);
  return t;
}

const listFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? listFiles(path.join(dir, e.name)).map(f => e.name + '/' + f) : [e.name]);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();

function keystore(t) {
  const ks = process.env.HSR98_KEYSTORE || path.join(os.homedir(), '.android', 'hsr98.keystore');
  if (!fs.existsSync(ks)) {
    fs.mkdirSync(path.dirname(ks), { recursive: true });
    run(t.keytool, ['-genkeypair', '-keystore', ks, '-alias', KEY_ALIAS, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-storepass', KEY_PASS, '-keypass', KEY_PASS, '-dname', 'CN=Star Rail 98, O=win98-clone']);
  }
  return ks;
}

function buildApk(out) {
  const t = findTools();
  const work = path.join(ROOT, 'dist', 'hsr98-apk-work');
  fs.rmSync(work, { recursive: true, force: true });
  const www = path.join(work, 'assets', 'www');
  const site = build(www, 'apk');
  const res = path.join(work, 'res', 'mipmap-xxxhdpi');
  fs.mkdirSync(res, { recursive: true });
  fs.copyFileSync(path.join(ANDROID, 'icon.png'), path.join(res, 'ic_launcher.png'));
  const versionCode = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);
  const manifest = path.join(work, 'AndroidManifest.xml');
  fs.writeFileSync(manifest, fs.readFileSync(path.join(ANDROID, 'AndroidManifest.xml'), 'utf8').replace('{{versionCode}}', versionCode).replace('{{versionName}}', VERSION_NAME));
  const resZip = path.join(work, 'res.zip');
  run(t.aapt2, ['compile', '--dir', path.join(work, 'res'), '-o', resZip]);
  const unsigned = path.join(work, 'unsigned.apk');
  run(t.aapt2, ['link', '-o', unsigned, '-I', t.androidJar, '--manifest', manifest, resZip]);
  run(t.aapt, ['add', unsigned, ...listFiles(path.join(work, 'assets')).map(f => 'assets/' + f)], { cwd: work });
  const classes = path.join(work, 'classes');
  run(t.javac, ['--release', '11', '-nowarn', '-encoding', 'UTF-8', '-classpath', t.androidJar, '-d', classes, path.join(ANDROID, 'MainActivity.java')]);
  const dex = path.join(work, 'dex');
  fs.mkdirSync(dex);
  const classFiles = fs.readdirSync(path.join(classes, PACKAGE_DIR)).map(f => path.join(classes, PACKAGE_DIR, f));
  run(t.java, ['-cp', t.d8, 'com.android.tools.r8.D8', '--release', '--min-api', '24', '--lib', t.androidJar, '--output', dex, ...classFiles]);
  run(t.aapt, ['add', unsigned, 'classes.dex'], { cwd: dex });
  const aligned = path.join(work, 'aligned.apk');
  run(t.zipalign, ['-f', '-p', '4', unsigned, aligned]);
  const ks = keystore(t);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run(t.java, ['-jar', t.apksigner, 'sign', '--ks', ks, '--ks-key-alias', KEY_ALIAS, '--ks-pass', 'pass:' + KEY_PASS, '--key-pass', 'pass:' + KEY_PASS, '--out', out, aligned]);
  run(t.java, ['-jar', t.apksigner, 'verify', out]);
  fs.rmSync(work, { recursive: true, force: true });
  fs.rmSync(out + '.idsig', { force: true });
  return { out, versionCode, size: fs.statSync(out).size, scripts: site.scripts, music: site.music.length, keystore: ks };
}

if (require.main === module) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'StarRail98.apk'));
  const r = buildApk(out);
  console.log('Honkai: Star Rail 98 APK -> ' + r.out);
  console.log('  ' + (r.size / 1048576).toFixed(1) + ' MB, versionName ' + VERSION_NAME + ', versionCode ' + r.versionCode + ', ' + r.scripts + ' scripts, ' + r.music + ' music packs');
  console.log('  signed with ' + r.keystore);
}

module.exports = { buildApk, findTools };
