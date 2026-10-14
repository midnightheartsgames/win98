import { build } from 'esbuild';
import { statSync } from 'node:fs';

const release = process.argv.includes('--release');
const outfile = 'js/apps/avatar98/avatar98.js';

await build({
  entryPoints: ['src/avatar98/main.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Avatar98',
  target: 'es2020',
  outfile,
  minify: release,
  legalComments: 'none',
  define: { __DEBUG__: release ? 'false' : 'true' },
  logLevel: 'warning'
});

console.log(`avatar98: ${release ? 'release' : 'debug'} build -> ${outfile} (${(statSync(outfile).size / 1024).toFixed(1)} KB)`);
