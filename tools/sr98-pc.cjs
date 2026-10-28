const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { build: buildPlay, checkVersion } = require('./hsr98-standalone.cjs');
const { writeRelease, isoDate, displayVersion } = require('./release.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'sr98-pc');
const APP = path.join(ROOT, 'dist', 'sr98-pc-app');
const OUT = path.join(ROOT, 'dist');
const NAME = 'StarRail98';
const ZIP = path.join(OUT, 'StarRail98-PC.zip');
const BSDTAR = fs.existsSync('C:\\Windows\\System32\\tar.exe') ? 'C:\\Windows\\System32\\tar.exe' : 'tar';

function pngIco(pngFile, icoFile) {
  const png = fs.readFileSync(pngFile);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = w >= 256 ? 0 : w;
  entry[1] = h >= 256 ? 0 : h;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  fs.writeFileSync(icoFile, Buffer.concat([header, entry, png]));
}

function gitStamp() {
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  return { commit: git(['rev-parse', '--short', 'HEAD']), dirty: git(['status', '--porcelain']).length > 0 };
}

async function buildPc(version = 'dev', opts = {}) {
  checkVersion(version);
  fs.rmSync(APP, { recursive: true, force: true });
  fs.mkdirSync(APP, { recursive: true });
  fs.copyFileSync(path.join(SRC, 'main.js'), path.join(APP, 'main.js'));
  fs.cpSync(path.join(SRC, 'launcher'), path.join(APP, 'launcher'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'web98-site', 'sr98', 'site.css'), path.join(APP, 'launcher', 'site.css'));
  fs.mkdirSync(path.join(APP, 'launcher', 'img'), { recursive: true });
  for (const n of [1, 2]) fs.copyFileSync(path.join(ROOT, 'content', 'steam', 'hsr98-' + n + '.jpg'), path.join(APP, 'launcher', 'img', 'hsr98-' + n + '.jpg'));
  for (const f of ['updater.js', 'launcher-host.js', 'launcher-preload.js']) fs.copyFileSync(path.join(ROOT, 'electron', f), path.join(APP, f));
  pngIco(path.join(__dirname, 'hsr98-standalone', 'android', 'icon.png'), path.join(APP, 'icon.ico'));
  fs.writeFileSync(path.join(APP, 'package.json'), JSON.stringify({ name: 'starrail98', productName: NAME, version: '1.0.0', main: 'main.js', private: true }, null, 2));
  buildPlay(path.join(APP, 'play'), 'pc', version);
  const electronVersion = require('electron/package.json').version;
  const { packager } = await import('@electron/packager');
  const [appPath] = await packager({
    dir: APP,
    out: OUT,
    name: NAME,
    executableName: NAME,
    platform: 'win32',
    arch: 'x64',
    electronVersion,
    icon: path.join(APP, 'icon.ico'),
    asar: false,
    prune: false,
    overwrite: true,
    win32metadata: { ProductName: 'Star Rail 98', FileDescription: 'Star Rail 98' }
  });
  const git = gitStamp();
  const release = await writeRelease(appPath, { product: 'sr98', version, build: '', date: isoDate(), commit: git.commit, dirty: git.dirty, runtime: 'electron-' + electronVersion + '-win32-x64' });
  let zipBytes = 0;
  if (!opts.noZip) {
    fs.rmSync(ZIP, { force: true });
    execFileSync(BSDTAR, ['-a', '-c', '-f', path.basename(ZIP), path.basename(appPath)], { cwd: OUT, stdio: 'inherit' });
    zipBytes = fs.statSync(ZIP).size;
  }
  return { appPath, release, zip: opts.noZip ? null : ZIP, zipBytes };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const v = args.indexOf('--version');
  buildPc(v >= 0 ? args[v + 1] : 'dev', { noZip: args.includes('--no-zip') }).then(r => {
    console.log('Star Rail 98 for PC -> ' + path.join(r.appPath, NAME + '.exe'));
    console.log('  version ' + (displayVersion(r.release) || 'dev') + ', ' + r.release.files.length + ' files' + (r.zip ? ', ' + path.basename(r.zip) + ' ' + (r.zipBytes / 1048576).toFixed(1) + ' MB' : ''));
  }).catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { buildPc, pngIco };
