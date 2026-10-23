const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SLOTS = ['head', 'hands', 'body', 'feet'];
const CAVERN = { passerby: 101, musketeer: 102, knight: 103, glacial: 104, champion: 105, firesmith: 107, genius: 108, thunder: 109, eagle: 110, thief: 111, wastelander: 112 };
const PLANAR = { station: 301, salsotto: 306, vonwacq: 308 };
const ITEMS = {
  dest1: 110111, dest2: 110112, dest3: 110113, hunt1: 110121, hunt2: 110122, hunt3: 110123, erud1: 110131, erud2: 110132, erud3: 110133,
  harm1: 110161, harm2: 110162, harm3: 110163, nihil1: 110151, nihil2: 110152, nihil3: 110153, pres1: 110141, pres2: 110142, pres3: 110143,
  abund1: 110171, abund2: 110172, abund3: 110173, memo1: 110251, memo2: 110252, memo3: 110253,
  core1: 111001, core2: 111002, core3: 111003, legion1: 111011, legion2: 111012, legion3: 111013, silver1: 112001, silver2: 112002, silver3: 112003,
  ancient1: 112011, ancient2: 112012, ancient3: 112013, scion1: 113001, scion2: 113002, scion3: 113003, artifex1: 113011, artifex2: 113012, artifex3: 113013,
  echo_doom: 110501, echo_lament: 110502, echo_ochema: 110503, echo_borehole: 110504, tracks: 241, shadow_dest: 18001, shadow_pres: 18003, remains: 235, resin: 236,
  metal: 180005, basic: 180002, phlog: 180004, seed: 180007, water: 180001, gas: 180006, mech: 181001, rice: 181003, particle: 181002, herbs: 181012,
  exp1: 211, exp2: 212, exp3: 213, fuel: 201, suncake: 408606, friedrice: 401003, hotpot: 402018, revive: 400007, medkit: 402001, soup: 408403,
  pie: 408612, lunch: 400004, thermos: 408408, sbiten: 401015, spark: 408604
};
const CONES = {
  arrows: 20000, cornucopia: 20001, collapsing: 20002, amber: 20003, void: 20004, chorus: 20005, databank: 20006,
  postop: 21000, goodnight: 21001, memories: 21004, swordplay: 21010, trend: 21016, underthesky: 21019, geniuses: 21020,
  sword_rumor: 21058, masquerade: 21052, quid: 21021, fermata: 21022, wildfire: 21023, river: 21024, pastfuture: 21025, woof: 21026, breakfast: 21027,
  milkyway: 23000, butthebattle: 23003, moment: 23005, mirror: 23019, night: 23001, patience: 23006, rain: 23007, unreachable: 23009,
  beforedawn: 23010, coffin: 23008, brighter: 23015, shuteyes: 23011, ownsword: 23014, blissful: 23016, fright: 23017, gaze: 23018, baptism: 23020
};
const CONE_TABLES = ['light_cones', 'light_cone_ranks', 'light_cone_promotions'].flatMap(t => ['ru', 'en'].map(l => 'index_new/' + l + '/' + t + '.json'));
const GROUPS = {
  relic: () => Object.entries(CAVERN).flatMap(([set, id]) => SLOTS.map((sl, i) => [set + ':' + sl, 'icon/relic/' + id + '_' + i + '.png'])),
  planar: () => Object.entries(PLANAR).flatMap(([set, id]) => ['sphere', 'rope'].map((sl, i) => [set + ':' + sl, 'icon/relic/' + id + '_' + i + '.png'])),
  path: () => pick(/^(dest|hunt|erud|harm|nihil|pres|abund|memo)\d$/),
  foe: () => pick(/^(core|legion|silver|ancient|scion|artifex)\d$/),
  echo: () => pick(/^(echo_|tracks|shadow_|remains|resin)/),
  syn: () => pick(/^(metal|basic|phlog|seed|water|gas|mech|rice|particle|herbs)$/),
  food: () => pick(/^(medkit|soup|pie|revive|suncake|hotpot|lunch|friedrice|thermos|sbiten|spark|fuel)$/),
  exp: () => pick(/^exp\d$/),
  cone: () => Object.entries(CONES).map(([k, id]) => [k, 'image/light_cone_portrait/' + id + '.png'])
};
const pick = re => Object.entries(ITEMS).filter(([k]) => re.test(k)).map(([k, id]) => [k, 'icon/item/' + id + '.png']);

async function fetchTo(rel, file) {
  if (fs.existsSync(file)) return true;
  const res = await fetch(BASE + rel);
  if (!res.ok) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

function sheet(cache, group, list, out) {
  const cols = group === 'relic' ? 4 : group === 'planar' ? 2 : group === 'cone' ? 8 : 3, cell = 150, tall = group === 'cone' ? 210 : cell;
  const rows = Math.ceil(list.length / cols);
  const cells = list.map(([k, rel]) => '<div class="c"><img src="' + path.join(cache, rel).replace(/\\/g, '/') + '"><b>' + k + '</b></div>').join('');
  const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#20243a;font:11px Tahoma,sans-serif;color:#e8e0c8}'
    + '.g{display:grid;grid-template-columns:repeat(' + cols + ',' + cell + 'px);gap:4px;padding:4px}.c{position:relative;width:' + cell + 'px;height:' + tall + 'px;background:#2c3150}'
    + 'img{width:' + (cell - 16) + 'px;height:' + (tall - 16) + 'px;margin:2px 8px}b{position:absolute;left:4px;bottom:2px;font-weight:normal}</style><div class="g">' + cells + '</div>';
  const page = path.join(cache, 'sheet-' + group + '.html');
  fs.writeFileSync(page, html);
  const w = 8 + cols * (cell + 4), h = 8 + rows * (tall + 4);
  const r = spawnSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--screenshot=' + out, '--window-size=' + w + ',' + h, 'file:///' + page.replace(/\\/g, '/')], { encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(out)) throw new Error('Edge screenshot failed: ' + (r.stderr || r.status));
}

(async () => {
  const args = process.argv.slice(2);
  const cache = path.join(os.tmpdir(), 'hsr-icon-refs');
  const out = path.resolve(args.find(a => !a.startsWith('--')) || path.join(cache, 'sheets'));
  const only = (args.find(a => a.startsWith('--group=')) || '').slice(8);
  const groups = only ? only.split(',') : Object.keys(GROUPS);
  for (const g of groups) if (!GROUPS[g]) throw new Error('unknown group "' + g + '", use: ' + Object.keys(GROUPS).join(','));
  fs.mkdirSync(out, { recursive: true });
  for (const g of groups) {
    if (g === 'cone') for (const rel of CONE_TABLES) if (!(await fetchTo(rel, path.join(cache, rel)))) console.log('missing ' + rel);
    const list = GROUPS[g]();
    const got = [];
    for (const [k, rel] of list) if (await fetchTo(rel, path.join(cache, rel))) got.push([k, rel]); else console.log('missing ' + k + ' ' + rel);
    const file = path.join(out, 'ref-' + g + '.png');
    sheet(cache, g, got, file);
    console.log(file);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
