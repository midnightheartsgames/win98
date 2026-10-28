import { packager } from '@electron/packager';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { EXE_EXCLUDED, VERSION_PATTERN, buildDate, isoDate, displayVersion, writeRelease } = require('./release.cjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const versionArg = process.argv.indexOf('--version');
const version = versionArg > 0 ? process.argv[versionArg + 1] : 'dev';
if (version !== 'dev' && !VERSION_PATTERN.test(version || '')) throw new Error('--version must look like 1.15 or 1.15.1');

const git = args => execFileSync('git', args, { cwd: root }).toString().trim();
const now = new Date();
const stamp = {
  version,
  build: buildDate(now),
  commit: git(['rev-parse', '--short', 'HEAD']),
  date: git(['log', '-1', '--format=%cs']),
  dirty: git(['status', '--porcelain']).length > 0,
  built: now.toISOString()
};
const buildFile = path.join(root, 'build.json');
fs.writeFileSync(buildFile, JSON.stringify(stamp));

const [appPath] = await packager({
  dir: root,
  out: path.join(root, 'dist'),
  name: 'Win98',
  executableName: 'Win98',
  platform: 'win32',
  arch: 'x64',
  icon: path.join(root, 'electron', 'icon.ico'),
  asar: false,
  prune: false,
  overwrite: true,
  ignore: EXE_EXCLUDED,
  win32metadata: {
    ProductName: 'Microslop Win 98',
    FileDescription: 'Microslop Win 98'
  }
}).finally(() => fs.rmSync(buildFile, { force: true }));

const electronVersion = require('electron/package.json').version;
const release = await writeRelease(appPath, {
  product: 'win98',
  version: stamp.version,
  build: stamp.build,
  date: isoDate(now),
  commit: stamp.commit,
  dirty: stamp.dirty,
  runtime: 'electron-' + electronVersion + '-win32-x64'
});

console.log(`Built: ${path.join(appPath, 'Win98.exe')}`);
console.log(`Version ${displayVersion(release)}, ${release.files.length} files in release.json`);
