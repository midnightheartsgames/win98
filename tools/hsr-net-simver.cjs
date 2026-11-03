const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const OUT = path.join(DIR, 'hsr-hd-simver.js');
const SIM_FILES = ['hsr-hd-data', 'hsr-hd-math', 'hsr-hd-arena', 'hsr-hd-heroes', 'hsr-hd-foes', 'hsr-hd-shop', 'hsr-hd', 'hsr-hd-net'];

function gameModules() {
  const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  const mods = [...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  return mods.slice(0, mods.indexOf('hsr-gfx'));
}

function loadGame() {
  const H = require(path.join(DIR, 'hsr-core.js'));
  for (const f of gameModules()) if (f !== 'hsr-core') require(path.join(DIR, f + '.js'));
  return H;
}

const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const lf = text => String(text).replace(/\r\n/g, '\n');

function simData(H) {
  const HD = H.HD, each = (ids, fn) => Object.fromEntries(ids.map(id => [id, fn(id)]));
  return {
    chars: each(Object.keys(HD.HEROES), id => pick(H.CHARS[id], ['base', 'path', 'elem', 'energy'])),
    enemies: each(Object.keys(HD.FOES), id => H.ENEMIES[id]),
    cones: each(Object.keys(HD.CONE_MODE), id => pick(H.CONES[id], ['path', 'rarity', 'p'])),
    relicSets: H.RELIC_SETS,
    relicSlots: H.RELIC_SLOTS.map(s => s.key),
    tiles: each(Object.keys(H.TILES), k => !!H.TILES[k].solid),
    paths: each(Object.keys(H.PATHS), k => H.PATHS[k].aggro),
    elements: each(Object.keys(H.ELEMENTS), k => H.ELEMENTS[k].coef),
    breakEffect: H.BREAK_EFFECT,
    tuning: H.TUNING,
    code: [H.makeRandom, H.breakBase, H.coneParam].map(fn => lf(fn))
  };
}

function simVersion(H) {
  const hash = crypto.createHash('sha256');
  for (const f of SIM_FILES) hash.update(lf(fs.readFileSync(path.join(DIR, f + '.js'), 'utf8')));
  hash.update(JSON.stringify(simData(H)));
  return hash.digest('hex').slice(0, 8);
}

function compute(H) {
  return { sim: simVersion(H), golden: H.HD.goldenRun(false).hash, crew: H.HD.goldenRun(true).hash };
}

function render(values) {
  return [
    '(function (H) {',
    "  'use strict';",
    "  H.HD.SIM = '" + values.sim + "';",
    "  H.HD.GOLDEN = '" + values.golden + "';",
    "  H.HD.GOLDEN_CREW = '" + values.crew + "';",
    "  if (typeof module !== 'undefined') module.exports = H;",
    '})(globalThis.Hsr98 = globalThis.Hsr98 || {});',
    ''
  ].join('\n');
}

function main(argv) {
  const H = loadGame(), values = compute(H);
  if (argv.includes('--check')) {
    if (H.HD.SIM === values.sim && H.HD.GOLDEN === values.golden && H.HD.GOLDEN_CREW === values.crew) { console.log('Arena version is up to date: ' + values.sim); return 0; }
    console.error('Arena version is stale: ' + [H.HD.SIM, H.HD.GOLDEN, H.HD.GOLDEN_CREW].join('/') + ' in the module, ' + [values.sim, values.golden, values.crew].join('/') + ' now. Run: node tools/hsr-net-simver.cjs');
    return 1;
  }
  fs.writeFileSync(OUT, render(values));
  console.log('Arena version ' + values.sim + ', golden run ' + values.golden + ', crew run ' + values.crew);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { SIM_FILES, gameModules, loadGame, simData, simVersion, compute, render };
