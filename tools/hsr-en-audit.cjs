const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'hsr98');
const CYR = /[Ѐ-ӿ]/;
const EXTRA_TABLES = ['BREAK_EFFECT'];

function htmlModules() {
  const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  return [...new Set([...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]))];
}

function loadGame() {
  const H = require(path.join(DIR, 'hsr-core.js'));
  const skipped = [];
  for (const f of htmlModules()) {
    if (f === 'hsr-core') continue;
    try { require(path.join(DIR, f + '.js')); } catch (e) { skipped.push(f + ': ' + e.message.split('\n')[0]); }
  }
  return { H, skipped };
}

const CODE_KEYS = new Set(['at', 'goto', 'id', 'key', 'map', 'from', 'to', 'tile']);

function stillRussian(H, v) {
  return CYR.test(v) && CYR.test(H.tr(v));
}

function collect(H, node, where, out, seen) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  const isArr = Array.isArray(node);
  for (const k of Object.getOwnPropertyNames(node)) {
    if (!isArr && (CODE_KEYS.has(k) || k === 'length')) continue;
    const desc = Object.getOwnPropertyDescriptor(node, k);
    if (!desc || !('value' in desc)) continue;
    const v = desc.value;
    const at = isArr ? where + '[' + k + ']' : where + '.' + k;
    if (typeof v === 'string') {
      if (stillRussian(H, v)) out.push([at, v]);
    } else if (v && typeof v === 'object') {
      collect(H, v, at, out, seen);
    }
  }
}

function audit(H) {
  const tables = [...new Set([...H.EN_DATA_TABLES, ...EXTRA_TABLES])];
  H.setLang('en', {});
  const seen = new Set();
  const found = {};
  for (const t of tables) {
    if (!H[t] || typeof H[t] !== 'object') continue;
    const out = [];
    collect(H, H[t], t, out, seen);
    if (out.length) found[t] = out;
  }
  H.setLang('ru', {});
  return found;
}

const SUSPECT_RULES = [
  ['marker', (ru, en) => /\{SPACE\}|█|^\^|◆|\{[A-Z_]+\}/.test(en)],
  ['ellipsis', (ru, en) => /(\.\.\.|…)\s*["»]?$/.test(en) && !/(\.\.\.|…)\s*["»]?$/.test(ru)],
  ['question', (ru, en) => /\?["»]?$/.test(en) && !/\?["»]?$/.test(ru)],
  ['exclaim', (ru, en) => /!["»]?$/.test(en) && !/!["»]?$/.test(ru)],
  ['quote', (ru, en) => /^["«]/.test(en) && !/^["«]/.test(ru)],
  ['longer', (ru, en) => ru.split(/\s+/).length <= 2 && en.split(/\s+/).length >= ru.split(/\s+/).length + 3],
  ['fragment', (ru) => /^[,.·:;|)]\s|[«(:,·]\s*$|^\s|\s$/.test(ru)]
];

function dictEntries() {
  const files = fs.readdirSync(DIR).filter(f => /^hsr-en-.*\.js$/.test(f)).sort();
  const rows = [];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$/);
      if (!m) return;
      let ru, en;
      try { ru = JSON.parse(m[1]); en = JSON.parse(m[2]); } catch (e) { return; }
      if (CYR.test(ru)) rows.push({ file: f, line: i + 1, ru, en });
    });
  }
  return rows;
}

function auditDict() {
  const rows = dictEntries();
  const byKey = new Map();
  for (const r of rows) {
    if (!byKey.has(r.ru)) byKey.set(r.ru, new Set());
    byKey.get(r.ru).add(r.en);
  }
  const suspects = [];
  for (const r of rows) {
    const why = SUSPECT_RULES.filter(([, fn]) => fn(r.ru, r.en)).map(([n]) => n);
    if (byKey.get(r.ru).size > 1) why.push('conflict');
    if (why.length) suspects.push(Object.assign({ why }, r));
  }
  return suspects;
}

function printDict(opts) {
  const suspects = auditDict().filter(s => !opts.rule || s.why.includes(opts.rule));
  if (opts.json) {
    process.stdout.write(JSON.stringify(suspects, null, 1) + '\n');
    return;
  }
  const count = {};
  for (const s of suspects) for (const w of s.why) count[w] = (count[w] || 0) + 1;
  for (const s of suspects.slice(0, opts.limit)) console.log(s.file + ':' + s.line + ' [' + s.why.join(',') + '] ' + JSON.stringify(s.ru) + ' -> ' + JSON.stringify(s.en));
  console.log(Object.entries(count).map(([k, v]) => k + ' ' + v).join(', ') + ', total ' + suspects.length);
}

function parseArgs(argv) {
  const opts = { tables: null, json: false, limit: 8, dict: false, rule: null };
  for (const a of argv) {
    if (a === '--json') opts.json = true;
    else if (a === '--dict') opts.dict = true;
    else if (a.startsWith('--rule=')) opts.rule = a.slice(7);
    else if (a.startsWith('--limit=')) opts.limit = +a.slice(8) || 0;
    else if (a.startsWith('--table=')) opts.tables = a.slice(8).split(',');
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.dict) return printDict(opts);
  const { H, skipped } = loadGame();
  let found = audit(H);
  if (opts.tables) found = Object.fromEntries(Object.entries(found).filter(([t]) => opts.tables.includes(t)));
  if (opts.json) {
    process.stdout.write(JSON.stringify({ skipped, found }, null, 1) + '\n');
    return;
  }
  for (const s of skipped) console.log('skipped module ' + s);
  const rows = Object.entries(found).sort((a, b) => b[1].length - a[1].length);
  let total = 0;
  for (const [t, list] of rows) {
    total += list.length;
    console.log(t + ': ' + list.length);
    for (const [at, v] of list.slice(0, opts.limit)) console.log('  ' + at + ' = ' + v.replace(/\s+/g, ' ').slice(0, 100));
  }
  console.log('total: ' + total);
}

if (require.main === module) main();

module.exports = { loadGame, audit, auditDict };
