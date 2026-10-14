import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { loadGameData, dialogueKeys, stringKeys } from '../src/avatar98/data/loader.ts';

const ROOT = new URL('../content/avatar98/', import.meta.url);
const read = async (p) => readFileSync(new URL(p, ROOT), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) passed++;
  else {
    failed++;
    failures.push(msg);
  }
}

let data;
try {
  data = await loadGameData(read);
  ok(true, 'data loads');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const onlyValidate = process.argv.includes('--validate');
if (onlyValidate) {
  console.log(`data OK: ${Object.keys(data.maps).length} maps, ${Object.keys(data.events).length} events`);
  process.exit(0);
}

const mod = await import('./avatar98-cases.mjs');
await mod.run(data, { ok, read, ROOT, dialogueKeys, stringKeys, readFileSync, readdirSync, existsSync });

console.log(`avatar98: ${passed} passed, ${failed} failed`);
if (failed) {
  for (const f of failures.slice(0, 60)) console.log('  FAIL: ' + f);
  process.exit(1);
}
