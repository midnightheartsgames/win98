'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const EXTRACT = path.join(ROOT, 'content/hsr-traces/extract.json');
const DATA = path.join(ROOT, 'js/apps/hsr98/hsr-traces-data.js');
const BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new';
const FILES = ['characters', 'character_skill_trees', 'character_skills', 'character_ranks', 'items'];

const IDS = {
  trail: '8001', trail_p: '8003', march: '1001', danheng: '1002', himeko: '1003', welt: '1004', natasha: '1105', serval: '1103', asta: '1009', arlan: '1008', herta: '1013',
  gepard: '1104', bronya: '1101', seele: '1102', sampo: '1108', hook: '1109', pela: '1106', ruanmei: '1303', kafka: '1005', silverwolf: '1006', blade: '1205', bailu: '1211',
  yanqing: '1209', clara: '1107', lynx: '1110', luka: '1111', sushang: '1206', xueyi: '1214', tingyun: '1202', hanya: '1215', qingque: '1201', yukong: '1207', guinaifen: '1210',
  jingyuan: '1204', luocha: '1203', imbibitor: '1213', fuxuan: '1208', jingliu: '1212', topaz: '1112', huohuo: '1217', argenti: '1302', ratio: '1305'
};

const OWN = {
  miyabi: { path: 'hunt', tpl: 'seele', stats: ['critD', 'atkP', 'iceP'], foe: 'ancient', echo: 'echo_doom' },
  yanagi: { path: 'nihility', tpl: 'kafka', stats: ['atkP', 'ehr', 'elecP'], foe: 'ancient', echo: 'echo_doom' },
  billy: { rar: 4, path: 'erudition', tpl: 'himeko', stats: ['physP', 'atkP', 'critR'], foe: 'ancient', echo: 'echo_doom' },
  nicole: { rar: 4, path: 'nihility', tpl: 'kafka', stats: ['atkP', 'ehr', 'defP'], foe: 'ancient', echo: 'echo_doom' },
  anby: { rar: 4, path: 'hunt', tpl: 'seele', stats: ['breakE', 'atkP', 'elecP'], foe: 'ancient', echo: 'echo_doom' },
  phrolova: { path: 'remembrance', tpl: 'seele', stats: ['atkP', 'critD', 'quantP'], foe: 'core', echo: 'echo_lament' },
  scar: { path: 'destruction', tpl: 'blade', stats: ['atkP', 'critR', 'hpP'], foe: 'core', echo: 'echo_lament' },
  kazuma: { rar: 4, path: 'elation', tpl: 'kafka', stats: ['atkP', 'elation', 'spd'], foe: 'legion', echo: 'echo_doom' },
  aqua: { path: 'abundance', tpl: 'luocha', stats: ['hpP', 'res', 'defP'], foe: 'legion', echo: 'echo_doom' },
  megumin: { path: 'erudition', tpl: 'himeko', stats: ['fireP', 'atkP', 'critD'], foe: 'legion', echo: 'echo_doom' },
  darkness: { path: 'preservation', tpl: 'gepard', stats: ['defP', 'hpP', 'res'], foe: 'legion', echo: 'echo_doom' },
  yu: { path: 'hunt', tpl: 'seele', stats: ['atkP', 'critR', 'defP'], foe: 'core', echo: 'echo_lament' },
  yosuke: { rar: 4, path: 'nihility', tpl: 'kafka', stats: ['atkP', 'ehr', 'spd'], foe: 'core', echo: 'echo_lament' },
  chie: { rar: 4, path: 'destruction', tpl: 'blade', stats: ['atkP', 'critD', 'hpP'], foe: 'core', echo: 'echo_lament' },
  yukiko: { rar: 4, path: 'abundance', tpl: 'luocha', stats: ['hpP', 'res', 'spd'], foe: 'core', echo: 'echo_lament' },
  kanji: { path: 'destruction', tpl: 'blade', stats: ['atkP', 'physP', 'hpP'], foe: 'core', echo: 'echo_lament' },
  rise: { path: 'harmony', tpl: 'bronya', stats: ['hpP', 'spd', 'res'], foe: 'core', echo: 'echo_lament' },
  makoto: { path: 'hunt', tpl: 'seele', stats: ['atkP', 'critD', 'imagP'], foe: 'silver', echo: 'echo_lament' },
  amanda: { path: 'preservation', tpl: 'gepard', stats: ['hpP', 'defP', 'res'], foe: 'silver', echo: 'echo_lament' },
  talleah: { path: 'remembrance', tpl: 'seele', stats: ['atkP', 'quantP', 'critR'], foe: 'silver', echo: 'echo_lament' }
};

const ITEM = {
  110111: 'dest1', 110112: 'dest2', 110113: 'dest3', 110121: 'hunt1', 110122: 'hunt2', 110123: 'hunt3', 110131: 'erud1', 110132: 'erud2', 110133: 'erud3',
  110161: 'harm1', 110162: 'harm2', 110163: 'harm3', 110151: 'nihil1', 110152: 'nihil2', 110153: 'nihil3', 110141: 'pres1', 110142: 'pres2', 110143: 'pres3',
  110171: 'abund1', 110172: 'abund2', 110173: 'abund3', 110251: 'memo1', 110252: 'memo2', 110253: 'memo3',
  111001: 'core1', 111002: 'core2', 111003: 'core3', 111011: 'legion1', 111012: 'legion2', 111013: 'legion3', 112001: 'silver1', 112002: 'silver2', 112003: 'silver3',
  112011: 'ancient1', 112012: 'ancient2', 112013: 'ancient3', 113001: 'scion1', 113002: 'scion2', 113003: 'scion3', 113011: 'artifex1', 113012: 'artifex2', 113013: 'artifex3',
  110501: 'echo_doom', 110502: 'echo_lament', 110503: 'echo_ochema', 110504: 'echo_borehole', 241: 'tracks', 18001: 'shadow_dest', 18003: 'shadow_pres', 2: 'credits'
};

const PATHS = { Warrior: 'destruction', Rogue: 'hunt', Mage: 'erudition', Shaman: 'harmony', Warlock: 'nihility', Knight: 'preservation', Priest: 'abundance', Memory: 'remembrance' };
const PROP = {
  AttackAddedRatio: 'atkP', HPAddedRatio: 'hpP', DefenceAddedRatio: 'defP', CriticalChanceBase: 'critR', CriticalDamageBase: 'critD', StatusProbabilityBase: 'ehr',
  StatusResistanceBase: 'res', BreakDamageAddedRatioBase: 'breakE', SpeedDelta: 'spd', PhysicalAddedRatio: 'physP', FireAddedRatio: 'fireP', IceAddedRatio: 'iceP',
  ThunderAddedRatio: 'elecP', WindAddedRatio: 'windP', QuantumAddedRatio: 'quantP', ImaginaryAddedRatio: 'imagP'
};
const TIERS = { atkP: [0.04, 0.06, 0.08], hpP: [0.04, 0.06, 0.08], ehr: [0.04, 0.06, 0.08], res: [0.04, 0.06, 0.08], defP: [0.05, 0.075, 0.1], critR: [0.027, 0.04, 0.053], critD: [0.053, 0.08, 0.107], breakE: [0.053, 0.08, 0.107], spd: [2, 3, 4] };
for (const k of ['physP', 'fireP', 'iceP', 'elecP', 'windP', 'quantP', 'imagP']) TIERS[k] = [0.032, 0.048, 0.064];
const SKILL_TYPE = { Normal: 'basic', BPSkill: 'skill', Ultra: 'ult', Talent: 'talent', Maze: 'tech' };
const ABIL_NAME = { basic: 'базовой атаки', skill: 'навыка', ult: 'абсолютной техники', talent: 'таланта' };
const ABIL_CAP = { basic: 7, skill: 12, ult: 12, talent: 12 };
const TERMS = [
  ['сверхспособностями', 'абсолютными техниками'], ['сверхспособностях', 'абсолютных техниках'], ['сверхспособностям', 'абсолютным техникам'],
  ['сверхспособностью', 'абсолютной техникой'], ['сверхспособностей', 'абсолютных техник'], ['сверхспособности', 'абсолютной техники'], ['сверхспособность', 'абсолютная техника']
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) { reject(new Error(url + ' ' + res.statusCode)); res.resume(); return; }
      const out = [];
      res.on('data', d => out.push(d));
      res.on('end', () => resolve(Buffer.concat(out)));
    }).on('error', reject);
  });
}

async function fetchAll(cache) {
  for (const lang of ['ru', 'en']) {
    fs.mkdirSync(path.join(cache, lang), { recursive: true });
    for (const f of FILES) {
      const file = path.join(cache, lang, f + '.json');
      if (fs.existsSync(file)) continue;
      fs.writeFileSync(file, await get(BASE + '/' + lang + '/' + f + '.json'));
      console.log('fetched', lang, f);
    }
  }
}

function load(cache, lang, f) { return JSON.parse(fs.readFileSync(path.join(cache, lang, f + '.json'), 'utf8')); }

function num(v, fmt, pct) {
  const x = pct ? v * 100 : v;
  if (fmt === 'i') return String(Math.round(x));
  const d = +fmt.slice(1);
  return x.toFixed(d).replace(/\.?0+$/, '').replace('.', ',');
}

function clean(text, params) {
  let s = String(text || '').replace(/#(\d+)\[(i|f\d)\](%?)/g, (m, i, fmt, pct) => num((params || [])[+i - 1] || 0, fmt, !!pct) + pct);
  s = s.replace(/<[^>]+>/g, '').replace(/\{NICKNAME\}/g, '{name}').replace(/\{F#([^}]*)\}\{M#([^}]*)\}/g, '{$2|$1}').replace(/\{M#([^}]*)\}\{F#([^}]*)\}/g, '{$1|$2}').replace(/НР/g, 'HP').replace(/[—–]/g, '-');
  for (const [a, b] of TERMS) {
    s = s.split(a).join(b);
    s = s.split(a[0].toUpperCase() + a.slice(1)).join(b[0].toUpperCase() + b.slice(1));
  }
  return s.trim();
}

function upText(up) {
  return Object.entries(up).map(([k, n]) => 'Уровень ' + ABIL_NAME[k] + ' повышается на ' + n + ', максимальный уровень ' + ABIL_CAP[k] + '.').join(' ');
}

function gateOf(l) { return l.promotion ? 10 + 10 * l.promotion : (l.level || 1); }

function extract(cache) {
  const ch = load(cache, 'ru', 'characters'), tr = load(cache, 'ru', 'character_skill_trees'), sk = load(cache, 'ru', 'character_skills'), rk = load(cache, 'ru', 'character_ranks'), items = load(cache, 'ru', 'items');
  const out = { source: 'Mar-7th/StarRailRes index_new', items: {}, kits: {} };
  const cost = l => l.materials.map(m => [ITEM[m.id] || 'x' + m.id, m.num]);
  for (const [kit, id] of Object.entries(IDS)) {
    const c = ch[id], trees = c.skill_trees.filter(x => x.length <= 7).map(x => tr[x]);
    const kindOf = n => n.level_up_skills.length ? SKILL_TYPE[sk[n.level_up_skills[0].id].type] : null;
    const idOf = new Map();
    let s = 0;
    for (const n of trees) {
      const k = kindOf(n), suf = n.id.slice(-3);
      idOf.set(n.id, k || (suf[0] === '1' ? 'a' + (2 * +suf.slice(1)) : 's' + (++s)));
    }
    const nodes = trees.map(n => {
      const k = kindOf(n), prop = n.levels[0].properties[0];
      return {
        id: idOf.get(n.id), anchor: n.anchor, pre: (n.pre_points || []).map(p => idOf.get(p)), max: n.max_level, gate: k ? null : gateOf(n.levels[0]),
        stat: prop ? [PROP[prop.type], prop.type === 'SpeedDelta' ? prop.value : Math.round(prop.value * 1000) / 1000] : null,
        name: k ? sk[n.level_up_skills[0].id].name : n.name, desc: k ? null : clean(n.desc, (n.params || [])[0]),
        cost: n.levels.map(cost), gates: n.levels.map(gateOf)
      };
    });
    const skills = {};
    for (const n of trees) {
      const k = kindOf(n);
      if (!k) continue;
      const d = sk[n.level_up_skills[0].id];
      skills[k] = { id: d.id, name: d.name, params: d.params, desc: d.desc };
    }
    const eid = c.ranks.map(r => {
      const d = rk[r], up = {};
      for (const u of d.level_up_skills) up[SKILL_TYPE[sk[u.id].type]] = u.num;
      return { name: clean(d.name), desc: d.level_up_skills.length ? upText(up) : clean(d.desc), up, item: ITEM[(d.materials[0] || {}).id] || null };
    });
    out.kits[kit] = { src: id, rarity: c.rarity, path: PATHS[c.path], element: c.element, nodes, skills, eid };
    for (const n of nodes) for (const step of n.cost) for (const [m] of step) if (!out.items[m]) {
      const sid = Object.keys(ITEM).find(k => ITEM[k] === m);
      out.items[m] = sid ? { name: items[sid].name, rarity: items[sid].rarity } : { name: m };
    }
  }
  for (const m of ['shadow_dest', 'shadow_pres', 'scion1', 'scion2', 'scion3', 'artifex1', 'artifex2', 'artifex3', 'memo1', 'memo2', 'memo3', 'echo_ochema', 'echo_borehole', 'tracks']) {
    const sid = Object.keys(ITEM).find(k => ITEM[k] === m);
    out.items[m] = { name: items[sid].name, rarity: items[sid].rarity };
  }
  return out;
}

const LINE_OF = id => id.replace(/\d$/, '');
const q = s => s == null ? 'null' : "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

function linesOf(k) {
  const all = new Set();
  for (const n of k.nodes) for (const step of n.cost) for (const [m] of step) all.add(m);
  const has = p => [...all].find(m => m.startsWith(p));
  const pathLine = ['dest', 'hunt', 'erud', 'harm', 'nihil', 'pres', 'abund', 'memo'].find(p => has(p));
  const foe = ['core', 'legion', 'silver', 'ancient', 'scion', 'artifex'].find(p => has(p));
  const echo = [...all].find(m => m.startsWith('echo_'));
  return [pathLine, foe, echo];
}

function kitBlock(key, k, own) {
  const L = [];
  const stats = k.nodes.filter(n => /^s\d/.test(n.id)), bonus = ['a2', 'a4', 'a6'].map(id => k.nodes.find(n => n.id === id));
  L.push('    ' + key + ': {');
  const head = [own ? 'own: true' : "src: '" + k.src + "'", 'cost: ' + (key.startsWith('trail') ? 4 : k.rarity), 'mats: [' + linesOf(k).map(q).join(', ') + ']'];
  const shadow = k.eid[0] && k.eid[0].item && k.eid[0].item.startsWith('shadow') ? k.eid[0].item : null;
  if (shadow) head.push('shadow: ' + q(shadow));
  L.push('      ' + head.join(', ') + ',');
  L.push('      bonus: [');
  bonus.forEach((b, i) => L.push('        [' + [q(b.name), q(b.desc), b.pre.length ? q(b.pre[0]) : 'null'].join(', ') + ']' + (i < 2 ? ',' : '')));
  L.push('      ],');
  L.push('      stats: [');
  stats.forEach((n, i) => L.push('        [' + [q(n.stat[0]), n.stat[1], n.gate, n.pre.length ? q(n.pre[0]) : 'null'].join(', ') + ']' + (i < stats.length - 1 ? ',' : '')));
  L.push('      ],');
  L.push('      eid: [');
  k.eid.forEach((e, i) => L.push('        [' + q(e.name) + ', ' + q(e.desc) + ']' + (i < 5 ? ',' : '')));
  L.push('      ],');
  const up = k.eid.map((e, i) => [i + 1, e.up]).filter(([, u]) => Object.keys(u).length);
  L.push('      up: { ' + up.map(([n, u]) => n + ': { ' + Object.entries(u).map(([a, b]) => a + ': ' + b).join(', ') + ' }').join(', ') + ' }');
  L.push('    }');
  return L.join('\n');
}

function ownKit(key, o, tpl) {
  const count = {};
  for (const n of tpl.nodes) if (n.stat) count[n.stat[0]] = (count[n.stat[0]] || 0) + 1;
  const order = Object.keys(count).sort((a, b) => count[b] - count[a]);
  const map = Object.fromEntries(order.map((k, i) => [k, o.stats[i]]));
  const pathLine = { destruction: 'dest', hunt: 'hunt', erudition: 'erud', harmony: 'harm', nihility: 'nihil', preservation: 'pres', abundance: 'abund', remembrance: 'memo', elation: 'elat' }[o.path];
  const swap = m => m.startsWith('echo_') ? o.echo : /^(dest|hunt|erud|harm|nihil|pres|abund|memo)\d$/.test(m) ? pathLine + m.slice(-1) : /^(core|legion|silver|ancient|scion|artifex)\d$/.test(m) ? o.foe + m.slice(-1) : m;
  const nodes = tpl.nodes.map(n => {
    const out = Object.assign({}, n, { cost: n.cost.map(step => step.map(([m, c]) => [swap(m), c])) });
    if (n.stat) {
      const tier = TIERS[n.stat[0]].indexOf(n.stat[1]), to = map[n.stat[0]];
      out.stat = [to, TIERS[to][tier]];
    }
    if (/^a\d/.test(n.id)) Object.assign(out, { name: null, desc: null });
    return out;
  });
  return { src: null, rarity: o.rar || 5, nodes, eid: tpl.eid.map(e => ({ name: null, desc: null, up: e.up, item: null })) };
}

function write(ex, force) {
  if (fs.existsSync(DATA) && !force) { console.log('exists, use --force to overwrite', path.relative(ROOT, DATA)); return; }
  const blocks = Object.entries(ex.kits).map(([k, v]) => kitBlock(k, v, false));
  for (const [k, o] of Object.entries(OWN)) {
    const kit = ownKit(k, o, ex.kits[o.tpl]);
    const tplRar = ex.kits[o.tpl].rarity;
    if (tplRar !== 5) throw new Error('template rarity ' + o.tpl);
    blocks.push(kitBlock(k, kit, true));
  }
  const src = "(function (H) {\n  'use strict';\n  H.TRACES = {\n" + blocks.join(',\n') + "\n  };\n  if (typeof module !== 'undefined') module.exports = H;\n})(globalThis.Hsr98 = globalThis.Hsr98 || {});\n";
  fs.writeFileSync(DATA, src);
  console.log('wrote', path.relative(ROOT, DATA), Object.keys(ex.kits).length + Object.keys(OWN).length, 'kits');
}

async function main() {
  const a = process.argv.slice(2), cmd = a[0] || 'check';
  const cacheArg = a.find(x => x.startsWith('--cache='));
  const cache = cacheArg ? cacheArg.slice(8) : path.join(os.tmpdir(), 'hsr-srr');
  if (cmd === 'fetch') {
    await fetchAll(cache);
    const ex = extract(cache);
    fs.mkdirSync(path.dirname(EXTRACT), { recursive: true });
    fs.writeFileSync(EXTRACT, JSON.stringify(ex));
    console.log('wrote', path.relative(ROOT, EXTRACT));
    return;
  }
  const ex = JSON.parse(fs.readFileSync(EXTRACT, 'utf8'));
  if (cmd === 'write') { write(ex, a.includes('--force')); return; }
  if (cmd === 'check') {
    const H = require(path.join(ROOT, 'js/apps/hsr98/hsr-traces-data.js'));
    let bad = 0;
    for (const [k, v] of Object.entries(ex.kits)) {
      const d = H.TRACES[k], stats = v.nodes.filter(n => /^s\d/.test(n.id));
      stats.forEach((n, i) => { const s = d.stats[i]; if (!s || s[0] !== n.stat[0] || s[1] !== n.stat[1] || s[2] !== n.gate) { bad++; console.log(k, n.id, 'stat differs'); } });
      if (d.mats.join() !== linesOf(v).join()) { bad++; console.log(k, 'mats differ'); }
    }
    console.log(bad ? bad + ' differences' : 'data matches extract');
    return;
  }
  console.log('usage: node tools/hsr-traces-import.cjs fetch|write [--force]|check [--cache=dir]');
}

main().catch(e => { console.error(e); process.exit(1); });
