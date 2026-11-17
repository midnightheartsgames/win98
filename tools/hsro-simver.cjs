const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SIM_FILES = [
  'js/apps/hsro/ho-core.js',
  'js/apps/hsro/ho-data.js',
  'js/apps/hsro/ho-hero.js',
  'js/apps/hsro/ho-items.js',
  'js/apps/hsro/ho-quests.js',
  'js/apps/hsro/ho-quests-city.js',
  'js/apps/hsro/ho-zones.js',
  'js/apps/hsro/ho-zones-start.js',
  'js/apps/hsro/ho-zones-city.js',
  'js/apps/hsro/ho-zones-seclusion.js',
  'js/apps/hsro/ho-zones-incubator.js',
  'js/apps/hsro/ho-zones-echo.js',
  'js/apps/hsro/ho-quests-seclusion.js',
  'js/apps/hsro/ho-nav.js',
  'js/apps/hsro/ho-sim.js',
  'js/apps/hsro/ho-combat.js',
  'js/apps/hsro/ho-world.js',
  'js/apps/hsro/ho-trials.js',
  'js/apps/hsro/ho-party.js',
  'js/apps/hsr98/hsr-hd-math.js'
];
const OUT = 'js/apps/hsro/ho-simver.js';

function simHash(root) {
  const h = crypto.createHash('sha256');
  for (const f of SIM_FILES) h.update(f + '\n' + fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n'));
  return h.digest('hex').slice(0, 8);
}

function moduleText(hash) {
  return "(function (HO) {\n  'use strict';\n  HO.SIM = '" + hash + "';\n  if (typeof module !== 'undefined') module.exports = HO;\n})(globalThis.HO = globalThis.HO || {});\n";
}

if (require.main === module) {
  const hash = simHash(ROOT);
  fs.writeFileSync(path.join(ROOT, OUT), moduleText(hash));
  console.log('HO.SIM = ' + hash);
}

module.exports = { SIM_FILES, OUT, simHash, moduleText };
