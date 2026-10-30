'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

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

function keystore(t, key) {
  const ks = key.file;
  if (!fs.existsSync(ks)) {
    fs.mkdirSync(path.dirname(ks), { recursive: true });
    run(t.keytool, ['-genkeypair', '-keystore', ks, '-alias', key.alias, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-storepass', key.pass, '-keypass', key.pass, '-dname', key.dname]);
  }
  return ks;
}

const minutesSince2026 = () => Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);

function packApk({ work, manifest, icon, java, packageDir, out, key, minApi = 24 }) {
  const t = findTools();
  const res = path.join(work, 'res', 'mipmap-xxxhdpi');
  fs.mkdirSync(res, { recursive: true });
  fs.copyFileSync(icon, path.join(res, 'ic_launcher.png'));
  const manifestFile = path.join(work, 'AndroidManifest.xml');
  fs.writeFileSync(manifestFile, manifest);
  const resZip = path.join(work, 'res.zip');
  run(t.aapt2, ['compile', '--dir', path.join(work, 'res'), '-o', resZip]);
  const unsigned = path.join(work, 'unsigned.apk');
  run(t.aapt2, ['link', '-o', unsigned, '-I', t.androidJar, '--manifest', manifestFile, resZip]);
  if (fs.existsSync(path.join(work, 'assets'))) run(t.aapt, ['add', unsigned, ...listFiles(path.join(work, 'assets')).map(f => 'assets/' + f)], { cwd: work });
  const classes = path.join(work, 'classes');
  run(t.javac, ['--release', '11', '-nowarn', '-encoding', 'UTF-8', '-classpath', t.androidJar, '-d', classes, ...java]);
  const dex = path.join(work, 'dex');
  fs.mkdirSync(dex);
  const classFiles = fs.readdirSync(path.join(classes, packageDir)).map(f => path.join(classes, packageDir, f));
  run(t.java, ['-cp', t.d8, 'com.android.tools.r8.D8', '--release', '--min-api', String(minApi), '--lib', t.androidJar, '--output', dex, ...classFiles]);
  run(t.aapt, ['add', unsigned, 'classes.dex'], { cwd: dex });
  const aligned = path.join(work, 'aligned.apk');
  run(t.zipalign, ['-f', '-p', '4', unsigned, aligned]);
  const ks = keystore(t, key);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run(t.java, ['-jar', t.apksigner, 'sign', '--ks', ks, '--ks-key-alias', key.alias, '--ks-pass', 'pass:' + key.pass, '--key-pass', 'pass:' + key.pass, '--out', out, aligned]);
  run(t.java, ['-jar', t.apksigner, 'verify', out]);
  fs.rmSync(out + '.idsig', { force: true });
  return { out, size: fs.statSync(out).size, keystore: ks };
}

function apkEntries(apk) {
  return run(findTools().aapt, ['list', apk]).split(/\r?\n/).filter(Boolean).sort();
}

function apkBadging(apk) {
  return run(findTools().aapt, ['dump', 'badging', apk]);
}

module.exports = { findTools, packApk, apkEntries, apkBadging, minutesSince2026, homeKey: name => path.join(os.homedir(), '.android', name) };
