'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const line = fs.readFileSync(path.join(ROOT, 'tests/hsr98.test.js'), 'utf8').split('\n').find(l => l.startsWith("for (const f of ['hsr-data'"));
for (const f of line.match(/\[(.*?)\]/)[1].split(',').map(s => s.trim().replace(/'/g, ''))) require(path.join(DIR, f + '.js'));

const RUNS = +(process.env.RUNS || 40);
const DOMAINS = [['cx_exp', 1], ['cx_credits', 1], ['cx_hunt', 1], ['cx_spike', 1]];
const PARTY = ['march', 'danheng', 'himeko'];

function game(seed) {
  const g = new H.Game({ seed });
  Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true });
  for (const id of PARTY) g.addChar(id, 60);
  g.state.roster.trail.lvl = 60;
  g.state.party = ['trail'].concat(PARTY);
  g.state.inv.items.fuelv = 1000;
  return g;
}

function tally(sum, d, cost) {
  sum.power += cost;
  sum.credits += d.credits;
  sum.items += Object.values(d.items).reduce((a, n) => a + n, 0);
  sum.relics += d.relics.length;
}

function manual(id, tier) {
  const g = game(11), c = H.CALYX.find(x => x.id === id), sum = { power: 0, credits: 0, items: 0, relics: 0, wins: 0 };
  for (let i = 0; i < RUNS; i++) {
    g.powerSync(); g.state.power = 600;
    for (const k of Object.keys(g.state.roster)) g.state.roster[k].hp = null;
    const before = g.invSnap();
    if (!g.startCalyx(id, tier, 1)) break;
    g.battle.start(); g.battle.runAuto(800);
    if (!g.battle.over) { g.battle = null; g.battleCtx = null; continue; }
    const out = g.endBattle();
    if (!out || !out.win) { g.battleCtx = null; continue; }
    sum.wins++;
    tally(sum, g.invDelta(before), c.cost);
  }
  return sum;
}

function quick(id, tier) {
  const g = game(12), c = H.CALYX.find(x => x.id === id), sum = { power: 0, credits: 0, items: 0, relics: 0, wins: 0 };
  for (let i = 0; i < RUNS; i++) {
    g.powerSync(); g.state.power = 600; g.state.inv.items.fuelv = 1000;
    const r = g.quickFarm(id, tier, 1, { target: false });
    if (!r.ok) break;
    sum.wins++;
    tally(sum, r.delta, c.cost);
  }
  return sum;
}

const per10 = (s, k) => (s.power ? s[k] * 10 / s.power : 0);
let bad = 0;
console.log('domain'.padEnd(14) + 'mode'.padEnd(8) + 'runs'.padStart(6) + 'credits/10'.padStart(12) + 'items/10'.padStart(10) + 'relics/10'.padStart(11));
for (const [id, tier] of DOMAINS) {
  const m = manual(id, tier), q = quick(id, tier);
  for (const [name, s] of [['manual', m], ['quick', q]]) console.log(id.padEnd(14) + name.padEnd(8) + String(s.wins).padStart(6) + per10(s, 'credits').toFixed(1).padStart(12) + per10(s, 'items').toFixed(2).padStart(10) + per10(s, 'relics').toFixed(2).padStart(11));
  for (const k of ['credits', 'items', 'relics']) if (per10(m, k) + 1e-9 < per10(q, k) * 0.9) { bad++; console.log('  ! manual gives less ' + k + ' than Quick Farm for ' + id); }
}
console.log(bad ? 'FAIL: Quick Farm beats manual fights' : 'OK: manual fights yield at least as much as Quick Farm (10% noise allowed)');
process.exit(bad ? 1 : 0);
