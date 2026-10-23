'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const line = fs.readFileSync(path.join(ROOT, 'tests/hsr98.test.js'), 'utf8').split('\n').find(l => l.startsWith("for (const f of ['hsr-data'"));
for (const f of line.match(/\[(.*?)\]/)[1].split(',').map(s => s.trim().replace(/'/g, ''))) require(path.join(DIR, f + '.js'));
const T = H.TUNING;

const BOSSES = {
  tut: [['trail', 1], ['march', 1], ['danheng', 1]],
  doomsday: [['trail', 8], ['march', 8], ['danheng', 8]],
  gepard: [['trail', 16], ['march', 16], ['danheng', 16], ['himeko', 14]],
  bp_bronya: [['trail', 16], ['march', 16], ['danheng', 16]],
  seele: [['trail', 16], ['march', 16], ['danheng', 16], ['hook', 16]],
  mine: [['trail', 19], ['march', 19], ['danheng', 19], ['natasha', 19]],
  svarog: [['trail', 24], ['march', 24], ['natasha', 24], ['hook', 24]],
  gepard2: [['trail', 26], ['march', 26], ['natasha', 26], ['serval', 26]],
  cocolia1: [['trail', 30], ['march', 30], ['natasha', 30], ['serval', 30]],
  cocolia2: [['trail_p', 30], ['march', 30], ['natasha', 30], ['serval', 30]]
};

const plain = (id, lvl) => { const c = H.CHARS[id]; return { charId: id, lvl, stats: { hp: H.statAt(c.base.hp, lvl), atk: H.statAt(c.base.atk, lvl), def: H.statAt(c.base.def, lvl), spd: c.base.spd } }; };

function traced(party) {
  const g = new H.Game({ seed: 5 });
  return party.map(([id, lvl]) => {
    const key = id.startsWith('trail') ? 'trail' : id;
    if (key === 'trail') { if (id === 'trail_p') g.setPath('trail_p'); g.state.roster.trail.lvl = lvl; }
    else { g.addChar(id, lvl); g.state.roster[id].lvl = lvl; }
    g.fillTraces(key, 'cap');
    return { charId: id, key, lvl, stats: g.charStats(key), tr: g.traceSpec(key) };
  });
}

function trial(id, lvl, mode) {
  const s = plain(id, lvl);
  if (mode !== 'old') s.tr = H.tracePreset(id, lvl) && Object.assign({}, H.tracePreset(id, lvl).lv, { on: H.tracePreset(id, lvl).on });
  return s;
}

function rate(enc, mode, n) {
  const e = H.ENCOUNTERS[enc], party = BOSSES[enc];
  let w = 0, acts = 0;
  for (let s = 1; s <= n; s++) {
    const specs = mode === 'old' ? party.map(([id, l]) => plain(id, l)) : traced(party);
    for (const t of e.trials || []) if (!specs.some(p => p.charId === t)) { if (specs.length >= 4) specs.pop(); specs.push(trial(t, party[0][1], mode)); }
    const b = new H.Battle({ party: specs, enemies: e.enemies, waves: e.waves, boss: e.boss, seed: s * 31 });
    b.start();
    let k = 0;
    while (!b.over && k++ < 600) if (!b.autoStep()) break;
    if (b.result && b.result.win) w++;
    acts += k;
  }
  return { win: w / n, acts: Math.round(acts / n) };
}

function balance(n) {
  const save = { lv: T.trLevels, hp: T.trFoeHp };
  const rows = [];
  for (const enc of Object.keys(BOSSES)) {
    T.trLevels = false; const a = rate(enc, 'old', n);
    T.trLevels = true; T.trFoeHp = null; const b = rate(enc, 'new', n);
    T.trFoeHp = save.hp; const c = save.hp ? rate(enc, 'new', n) : { win: NaN, acts: NaN };
    rows.push([enc, a, b, c]);
  }
  T.trLevels = save.lv; T.trFoeHp = save.hp;
  console.log('encounter    old win/acts   traces win/acts   traces+foe win/acts');
  for (const [enc, a, b, c] of rows) console.log(enc.padEnd(12), (a.win.toFixed(2) + '/' + a.acts).padEnd(14), (b.win.toFixed(2) + '/' + b.acts).padEnd(17), c.win.toFixed(2) + '/' + c.acts);
  return rows;
}

if (require.main === module) {
  const a = process.argv.slice(2), n = +(a.find(x => /^\d+$/.test(x)) || 16);
  if (a.includes('balance') || !a.length) balance(n);
  if (a.includes('economy') || !a.length) economy();
}

module.exports = { H, BOSSES, rate, balance };

function probe(lvl, n, foes) {
  const party = [['seele', lvl], ['bronya', lvl], ['natasha', lvl], ['gepard', lvl]], enemies = (foes || ['cocolia2', 'iceedge', 'iceedge']).map(id => id + ':' + lvl);
  const run = mode => {
    let w = 0, acts = 0;
    for (let s = 1; s <= n; s++) {
      const specs = mode === 'old' ? party.map(([id, l]) => plain(id, l)) : traced(party);
      const b = new H.Battle({ party: specs, enemies, boss: true, seed: s * 17 });
      b.start();
      let k = 0;
      while (!b.over && k++ < 900) if (!b.autoStep()) break;
      if (b.result && b.result.win) w++;
      acts += k;
    }
    return (w / n).toFixed(2) + '/' + Math.round(acts / n);
  };
  const lv = T.trLevels;
  T.trLevels = false; const a = run('old');
  T.trLevels = true; const b = run('new');
  T.trLevels = lv;
  console.log('level ' + lvl + ': old ' + a + ', traces+foe ' + b);
}

module.exports.probe = probe;

function needs(kit, lvl) {
  const g = new H.Game({ seed: 1 }), key = kit.startsWith('trail') ? 'trail' : kit;
  if (key === 'trail') { if (kit === 'trail_p') g.setPath('trail_p'); g.state.roster.trail.lvl = lvl; }
  else { g.addChar(kit, lvl); g.state.roster[kit].lvl = lvl; }
  const late = new Set(H.traceNodes(kit).filter(n => n.kind === 'stat' && n.gate >= 75).map(n => n.id));
  for (const id of late) g.traceOf(key).on.push(id);
  g.state.credits = 1e9;
  for (const m of Object.keys(H.ITEMS).filter(m => H.ITEMS[m].kind === 'mat')) g.state.inv.items[m] = 1e6;
  g.autoTraces(key);
  const out = { credits: 1e9 - g.state.credits, path: [0, 0, 0], foe: [0, 0, 0], echo: 0, tracks: 0 };
  for (const [m, n] of Object.entries(g.state.inv.items)) {
    const it = H.ITEMS[m], used = 1e6 - n;
    if (!used || it.kind !== 'mat') continue;
    if (it.mat === 'path') out.path[it.tier - 1] += used;
    else if (it.mat === 'foe') out.foe[it.tier - 1] += used;
    else if (it.mat === 'echo') out.echo += used;
    else if (it.mat === 'tracks') out.tracks += used;
  }
  return out;
}

const mean = r => (r ? (r[0] + r[1]) / 2 : 0);
const eq2 = v => v[0] + 3 * v[1] + 9 * v[2];

function economy() {
  const yieldOf = rows => eq2(rows.map(mean));
  const tiers = H.CALYX_TIERS.map((t, i) => ({ name: t.name, lvl: t.lvl, path: yieldOf(H.TRACE_CALYX_PATH[i]), echo: mean(H.TRACE_ECHO_N[i]), credits: T.treasure ? T.treasure[i] : 1500 + 1500 * i }));
  console.log('Calyx yields per run (2-star equivalents): ' + tiers.map(t => t.name + ' ' + t.path.toFixed(1) + ' path, echo ' + t.echo + ', credits ' + t.credits).join('; '));
  const tl = Object.entries(H.TL_REWARDS).filter(([l]) => +l >= 41).reduce((a, [, r]) => a + (r.credits || 0), 0);
  console.log('Level reward credits from Trailblaze Level 41 to 70: ' + tl + ' (' + (tl / tiers[3].credits).toFixed(1) + ' treasure runs)');
  console.log('\nCost from zero to the level cap (without the level 75 and 80 nodes), credits at trCredit ' + T.trCredit);
  console.log('kit       lvl  credits   path 2/3/4     foe 2/3/4     echo tracks  crimson runs  echo runs  treasure runs  power  hours');
  for (const kit of ['seele', 'march']) for (const lvl of [20, 30, 40, 50, 60, 70, 80]) {
    const n = needs(kit, lvl), tier = tiers[Math.min(3, Math.max(0, Math.floor(lvl / 10) - 1))];
    const crim = Math.ceil(eq2(n.path) / tier.path), echo = Math.ceil(n.echo / tier.echo), cred = Math.ceil(n.credits / tiers[3].credits);
    const power = crim * 10 + echo * 30 + cred * 10;
    console.log(kit.padEnd(9), String(lvl).padEnd(4), String(n.credits).padEnd(9), n.path.join('/').padEnd(14), n.foe.join('/').padEnd(13), String(n.echo).padEnd(5), String(n.tracks).padEnd(7), String(crim).padEnd(13), String(echo).padEnd(10), String(cred).padEnd(14), String(power).padEnd(6), (power * T.powerRegenSec / 3600).toFixed(1));
  }
}

module.exports.needs = needs;
module.exports.economy = economy;
