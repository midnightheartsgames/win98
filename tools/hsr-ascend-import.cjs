'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const EXTRACT = path.join(ROOT, 'content/hsr-ascend/extract.json');
const DATA = path.join(ROOT, 'js/apps/hsr98/hsr-ascend-data.js');
const BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new';
const EQUIP = 'https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main/ExcelOutput/EquipmentConfig.json';
const WIKI = 'https://honkai-star-rail.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=Light%20Cone%20EXP';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FILES = ['character_promotions', 'light_cone_promotions', 'items', 'characters', 'light_cones'];

const HEROES = {
  march: '1001', danheng: '1002', himeko: '1003', welt: '1004', natasha: '1105', serval: '1103', asta: '1009', arlan: '1008', herta: '1013', gepard: '1104',
  bronya: '1101', seele: '1102', sampo: '1108', hook: '1109', pela: '1106', ruanmei: '1303', kafka: '1005', silverwolf: '1006', blade: '1205', bailu: '1211',
  yanqing: '1209', clara: '1107', lynx: '1110', luka: '1111', sushang: '1206', xueyi: '1214', tingyun: '1202', hanya: '1215', qingque: '1201', yukong: '1207',
  guinaifen: '1210', jingyuan: '1204', luocha: '1203', imbibitor: '1213', fuxuan: '1208', jingliu: '1212', topaz: '1112', huohuo: '1217', argenti: '1302', ratio: '1305'
};
const TRAILS = { trail: '8001', trail_p: '8003' };
const SHADOWS = {
  110400: ['asc_ecto', null], 110401: ['asc_spike', 'cx_spike'], 110402: ['asc_blaze', 'cx_blaze'], 110403: ['asc_rime', 'cx_rime'], 110404: ['asc_fulm', 'cx_fulmination'],
  110405: ['asc_gust', 'cx_gust'], 110406: ['asc_quanta', 'cx_quanta'], 110407: ['asc_mirage', 'cx_mirage'], 110412: ['asc_scorch', 'cx_scorch'], 110413: ['asc_icicle', 'cx_icicle'],
  110414: ['asc_doom', 'cx_doom'], 110415: ['asc_celestial', 'cx_celestial'], 110416: ['asc_abomination', 'cx_abomination'], 110417: ['asc_puppetry', 'cx_puppetry'], 110411: ['asc_perdition', 'cx_perdition']
};
const COLLAB = {
  miyabi: 'asc_rime', yanagi: 'asc_fulm', billy: 'asc_spike', nicole: 'asc_quanta', anby: 'asc_fulm', phrolova: 'asc_quanta', scar: 'asc_scorch', kazuma: 'asc_gust', aqua: 'asc_rime', megumin: 'asc_scorch',
  darkness: 'asc_spike', yu: 'asc_fulm', yosuke: 'asc_gust', chie: 'asc_rime', yukiko: 'asc_scorch', kanji: 'asc_spike', rise: 'asc_mirage', makoto: 'asc_mirage', amanda: 'asc_gust', talleah: 'asc_quanta'
};
const LINE_OF = id => {
  const n = +id, base = Math.floor(n / 10), row = { 11100: 'core', 11101: 'legion', 11200: 'silver', 11201: 'ancient', 11300: 'scion', 11301: 'artifex' };
  return row[base] || null;
};
const TIER_OF = id => +id % 10;
const PATH_ITEM = id => +id >= 110100 && +id < 110300;
const CONE_LINE_OVERRIDE = { masquerade: 'core', sword_rumor: 'legion', goodluck: 'legion', sneering: 'legion', cccgorilla: 'silver', cccbadge: 'silver', cccstandee: 'silver' };
const OWN_CONE_HERO = {
  shrine: 'miyabi', weaver: 'yanagi', lethe: 'phrolova', lullaby: 'scar', chunchunmaru: 'kazuma', hagoromo: 'aqua', manastaff: 'megumin', adamantite: 'darkness', truth: 'yu', thread: 'kanji',
  junesday: 'yosuke', dragontrial: 'chie', amagiinn: 'yukiko', affection: 'rise', cccletter: 'makoto', cccmagic: 'amanda', cccpratia: 'talleah', starlight: 'billy', vault: 'nicole', battery: 'anby'
};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Referer: 'https://honkai-star-rail.fandom.com/' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve(get(new URL(res.headers.location, url).href)); return; }
      if (res.statusCode !== 200) { reject(new Error(url + ' ' + res.statusCode)); res.resume(); return; }
      const out = [];
      res.on('data', d => out.push(d));
      res.on('end', () => resolve(Buffer.concat(out)));
    }).on('error', reject);
  });
}

async function fetchAll(cache) {
  fs.mkdirSync(cache, { recursive: true });
  const put = async (name, url) => {
    const file = path.join(cache, name);
    if (fs.existsSync(file)) return;
    fs.writeFileSync(file, await get(url));
    console.log('fetched', name);
  };
  for (const f of FILES) await put(f + '.json', BASE + '/ru/' + f + '.json');
  await put('EquipmentConfig.json', EQUIP);
  await put('light_cone_exp.json', WIKI);
}

const load = (cache, name) => JSON.parse(fs.readFileSync(path.join(cache, name), 'utf8'));

function heroRow(mats) {
  const row = { cr: 0, foe: null, boss: 0 };
  let shadow = null;
  for (const m of mats) {
    if (+m.id === 2) row.cr = m.num;
    else if (LINE_OF(m.id)) row.foe = [TIER_OF(m.id), m.num];
    else if (SHADOWS[m.id]) { row.boss = m.num; shadow = m.id; }
    else throw new Error('unknown hero material ' + m.id);
  }
  return { row, shadow };
}

function coneRow(mats) {
  const row = { cr: 0, foe: null, path: null };
  let line = null;
  for (const m of mats) {
    if (+m.id === 2) row.cr = m.num;
    else if (PATH_ITEM(m.id)) row.path = [TIER_OF(m.id), m.num];
    else { row.foe = [TIER_OF(m.id), m.num]; line = LINE_OF(m.id); }
  }
  return { row, line };
}

function parseExp(text) {
  const parts = text.split(/===(\d)-Star Rarity===/), out = {};
  for (let i = 1; i < parts.length; i += 2) {
    const rows = [...parts[i + 1].matchAll(/\|'{0,3}(\d+)'{0,3}\|\|([\d,]+)\|\|([\d,]+)/g)].map(m => [+m[1], +m[2].replace(/,/g, '')]).sort((a, b) => a[0] - b[0]);
    if (rows.length !== 79 || rows[0][0] !== 1 || rows[78][0] !== 79) throw new Error('cone exp table for rarity ' + parts[i]);
    out[parts[i]] = rows.map(r => r[1]);
  }
  return out;
}

function extract(cache) {
  const heroP = load(cache, 'character_promotions.json'), coneP = load(cache, 'light_cone_promotions.json'), items = load(cache, 'items.json');
  const chars = load(cache, 'characters.json'), cones = load(cache, 'light_cones.json');
  const out = { source: 'Mar-7th/StarRailRes index_new, Dimbreath/turnbasedgamedata EquipmentConfig, fandom Light Cone EXP', heroCost: {}, coneCost: {}, coneExp: {}, coneFodder: {}, shadows: {}, heroShadow: {}, coneLine: {} };
  const Hg = gameData(), used = new Set(Object.values(Hg.CONES).map(c => String(c.ref)));
  const same = (key, rows, who) => { const a = JSON.stringify(rows); if (out[key.a][key.b] && JSON.stringify(out[key.a][key.b]) !== a) throw new Error('cost differs: ' + who); out[key.a][key.b] = rows; };
  for (const [kit, id] of Object.entries(Object.assign({}, HEROES, TRAILS))) {
    const parsed = heroP[id].materials.slice(0, 6).map(heroRow), shadow = parsed[2].shadow;
    const group = TRAILS[kit] ? 'trail' : String(chars[id].rarity);
    same({ a: 'heroCost', b: group }, parsed.map(p => p.row), kit);
    out.heroShadow[kit] = SHADOWS[shadow][0];
    if (!out.shadows[SHADOWS[shadow][0]]) out.shadows[SHADOWS[shadow][0]] = { name: items[shadow].name, cx: SHADOWS[shadow][1] };
  }
  for (const [id, rec] of Object.entries(coneP)) {
    if (!used.has(id)) continue;
    const parsed = rec.materials.slice(0, 6).map(coneRow);
    same({ a: 'coneCost', b: String(cones[id].rarity) }, parsed.map(p => p.row), id);
    out.coneLine[id] = parsed[0].line;
  }
  out.coneExp = parseExp(Object.values(load(cache, 'light_cone_exp.json').query.pages)[0].revisions[0].slots.main['*']);
  for (const e of load(cache, 'EquipmentConfig.json')) {
    const r = /Rarity(\d)/.exec(e.Rarity)[1];
    if (out.coneFodder[r] == null) out.coneFodder[r] = e.ExpProvide;
    else if (out.coneFodder[r] !== e.ExpProvide) throw new Error('fodder differs: ' + e.EquipmentID);
    if (e.CoinCost * 2 !== e.ExpProvide) throw new Error('fodder credits differ: ' + e.EquipmentID);
  }
  return out;
}

function coneFoe(ex, Hg) {
  const out = {};
  for (const [id, c] of Object.entries(Hg.CONES)) {
    if (CONE_LINE_OVERRIDE[id]) out[id] = CONE_LINE_OVERRIDE[id];
    else if (c.ref) out[id] = ex.coneLine[String(c.ref)];
    else out[id] = Hg.TRACES[OWN_CONE_HERO[id]].mats[1];
    if (!out[id]) throw new Error('no foe line for cone ' + id);
  }
  return out;
}

const js = v => JSON.stringify(v).replace(/"(\w+)":/g, '$1: ').replace(/,(?=\S)/g, ', ').replace(/"/g, "'").replace(/\{/g, '{ ').replace(/\}/g, ' }');

function gameData() {
  const dir = path.join(ROOT, 'js/apps/hsr98');
  const Hg = require(path.join(dir, 'hsr-core.js'));
  const line = fs.readFileSync(path.join(ROOT, 'tests/hsr98.test.js'), 'utf8').split('\n').find(l => l.startsWith("for (const f of ['hsr-data'"));
  for (const f of line.match(/\[(.*?)\]/)[1].split(',').map(x => x.trim().replace(/'/g, ''))) if (f !== 'hsr-ascend-data') require(path.join(dir, f + '.js'));
  return Hg;
}

function write(ex) {
  const Hg = gameData();
  const shadowOf = Object.assign({}, ex.heroShadow, COLLAB);
  const cost = obj => Object.entries(obj).map(([k, rs]) => '      ' + k + ': [\n' + rs.map(r => '        ' + js(r)).join(',\n') + '\n      ]').join(',\n');
  const exp = Object.entries(ex.coneExp).map(([k, a]) => '      ' + k + ': [' + a.join(', ') + ']').join(',\n');
  const src = "(function (H) {\n  'use strict';\n  H.ASC = {\n"
    + '    tl: [0, 15, 20, 30, 40, 50, 60],\n'
    + '    coneLevelK: 0.15,\n'
    + '    coneAdd: [0, 1.2, 2.8, 4.4, 6, 7.6, 9.2],\n'
    + '    heroCredit: 10,\n'
    + '    coneCredit: 2,\n'
    + '    coneFodder: ' + js(ex.coneFodder) + ',\n'
    + '    heroCost: {\n' + cost(ex.heroCost) + '\n    },\n'
    + '    coneCost: {\n' + cost(ex.coneCost) + '\n    },\n'
    + '    coneExp: {\n' + exp + '\n    },\n'
    + '    shadows: ' + js(ex.shadows) + ',\n'
    + '    shadowOf: ' + js(shadowOf) + ',\n'
    + '    coneFoe: ' + js(coneFoe(ex, Hg)) + '\n'
    + "  };\n  if (typeof module !== 'undefined') module.exports = H;\n})(globalThis.Hsr98 = globalThis.Hsr98 || {});\n";
  fs.writeFileSync(DATA, src);
  console.log('wrote', path.relative(ROOT, DATA));
}

function check(ex) {
  const Hg = gameData();
  require(DATA);
  const A = Hg.ASC, sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let bad = 0;
  const say = m => { bad++; console.log(m); };
  if (!sameJson(A.heroCost, ex.heroCost)) say('heroCost differs');
  if (!sameJson(A.coneCost, ex.coneCost)) say('coneCost differs');
  if (!sameJson(A.coneExp, ex.coneExp)) say('coneExp differs');
  for (const k of Object.keys(ex.heroShadow)) if (A.shadowOf[k] !== ex.heroShadow[k]) say(k + ' shadow differs');
  for (const k of Object.keys(Hg.CHARS)) if (!A.shadowOf[k]) say(k + ' has no shadow');
  for (const k of Object.keys(Hg.CONES)) if (!A.coneFoe[k]) say(k + ' has no foe line');
  console.log(bad ? bad + ' differences' : 'data matches extract');
  process.exitCode = bad ? 1 : 0;
}

async function main() {
  const a = process.argv.slice(2), cmd = a[0] || 'check';
  const cacheArg = a.find(x => x.startsWith('--cache='));
  const cache = cacheArg ? cacheArg.slice(8) : path.join(os.tmpdir(), 'hsr-ascend');
  if (cmd === 'fetch') {
    await fetchAll(cache);
    fs.mkdirSync(path.dirname(EXTRACT), { recursive: true });
    fs.writeFileSync(EXTRACT, JSON.stringify(extract(cache)));
    console.log('wrote', path.relative(ROOT, EXTRACT));
    return;
  }
  const ex = JSON.parse(fs.readFileSync(EXTRACT, 'utf8'));
  if (cmd === 'write') { write(ex); return; }
  if (cmd === 'check') { check(ex); return; }
  console.log('usage: node tools/hsr-ascend-import.cjs fetch|write|check [--cache=dir]');
}

main().catch(e => { console.error(e); process.exit(1); });
