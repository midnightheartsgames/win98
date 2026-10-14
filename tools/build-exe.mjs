import { packager } from '@electron/packager';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const excluded = [
  /^\/dist($|\/)/,
  /^\/node_modules($|\/)/,
  /^\/tests($|\/)/,
  /^\/tools($|\/)/,
  /^\/web98-site($|\/)/,
  /^\/src($|\/)/,
  /^\/[^/]+\.md$/,
  /^\/[^/]+\.log$/,
  /^\/transcript[^/]*\.jsonl$/,
  /^\/techies\.txt$/,
  /^\/tsconfig\.json$/,
  /^\/content\/Legion Arena($|\/)/,
  /^\/content\/Another War($|\/)/,
  /^\/content\/Fallout\/(Manual|Extras|DATA\/SAVEGAME)($|\/)/,
  /^\/content\/Fallout\/[^/]+\.(exe|dll|rtf|log|ini|cfg|ico|txt)$/i
];

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
  ignore: excluded,
  win32metadata: {
    ProductName: 'Microslop Win 98',
    FileDescription: 'Microslop Win 98'
  }
});

console.log(`Built: ${path.join(appPath, 'Win98.exe')}`);
