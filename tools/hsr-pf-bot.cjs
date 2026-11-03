'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const page = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
for (const m of page.slice(0, page.indexOf('hsr-gfx.js')).matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)) if (m[1] !== 'hsr-core') require(path.join(DIR, m[1] + '.js'));
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/apps/kovcheg-hsr.js'), 'utf8'), box);
const SIM = require(path.join(ROOT, 'js/apps/kovcheg-sim.js')).create(H, box.window.kovchegHsr);

const TEAMS = {
  aoe: ['himeko', 'herta', 'asta', 'natasha'],
  free: ['serval', 'arlan', 'asta', 'natasha'],
  dot: ['kafka', 'sampo', 'guinaifen', 'huohuo'],
  aoe2: ['serval', 'qingque', 'pela', 'bailu'],
  jy: ['jingyuan', 'tingyun', 'argenti', 'luocha'],
  st: ['seele', 'silverwolf', 'bronya', 'lynx'],
  allin: ['himeko', 'herta', 'serval', 'argenti'],
  starter: ['trail', 'march', 'danheng', 'natasha'],
  storm: ['pela', 'sampo', 'march', 'serval'],
  storm2: ['pela', 'guinaifen', 'march', 'natasha']
};
const PAIRS = [['aoe', 'dot'], ['free', 'dot'], ['aoe2', 'starter']];
const BANDS = [
  { n: 1, lvl: 38, relic: 3, cone: 'early', want: [[2], [0], [-1]] },
  { n: 1, lvl: 50, relic: 3, want: [[3], [3], [1]] },
  { n: 2, lvl: 50, relic: 3, want: [[2], [1], [-1, 0]] },
  { n: 2, lvl: 60, relic: 6, want: [[3], [3], [1]] },
  { n: 3, lvl: 70, relic: 9, want: [[2, 3], [1, 2], [-1]] },
  { n: 4, lvl: 70, relic: 9, want: [[2], [1], [-1]] },
  { n: 4, lvl: 80, relic: 12, want: [[3], [1, 2], [0]] }
];

const args = require.main === module ? Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; })) : {};
if (args.shat) H.PF.TUN.shatter = String(args.shat).split(',').map(Number);
for (const pair of String(args.tun || '').split(';').filter(Boolean)) { const [k, v] = pair.split(':'); H.PF.TUN[k] = v.includes('/') ? v.split('/').map(Number) : +v; }
if (args.hpn) { const list = String(args.hpn).split('/').map(Number); for (const st of H.PF.SEASONS[+(args.season || 1) - 1].stages) st.hp = list[st.n - 1]; }
if (args.atkn) { const list = String(args.atkn).split('/').map(Number); for (const st of H.PF.SEASONS[+(args.season || 1) - 1].stages) st.atk = list[st.n - 1]; }

const seasonAt = i => H.PF.SEASONS[i];

function fight(team, node, caco, C) {
  const g = SIM.makeGame(team, C.lvl, C.cone, C.relic), keys = team.map(SIM.keyOf), out = { score: 0, kills: 0, down: 0, cycles: 0, wave: 0, secs: 0, ults: 0, clear: 0, blast: 0, stack: 0, dots: 0 };
  const EV = { act: 0.55, dmg: 0.2, break: 0.75, heal: 0.2, status: 0.1, kill: 0.35, text: 1.1, wave: 0.9, lock: 1.1, recover: 0.3, flee: 0.8, turn: 0.05 };
  g.pf().period = C.season;
  for (let s = 1; s <= C.seeds; s++) {
    const opts = g.pfOpts(C.n, node, keys, s * 7919 + node, caco);
    if (C.hp) opts.foeHp = C.hp;
    if (C.atk) opts.foeAtk = C.atk;
    const b = new H.Battle(opts);
    const count = list => { for (const e of list) { out.secs += e.hold || EV[e.t] || 0; if (e.t === 'act' && e.kind === 'ult') out.ults++; if (e.t === 'dmg' && e.label === 'Раскол') out.blast += e.v; if (e.t === 'dmg' && e.dot) out.dots += e.v; if (e.t === 'pfshat') out.stack++; } };
    count(b.start() || []);
    let guard = 0;
    while (!b.over && guard++ < 5000) {
      if (SIM.fusionPolicy(b)) { count(b.drain()); continue; }
      if (!SIM.step(b)) break;
      count(b.drain());
    }
    const R = g.pfReport(b);
    out.score += R.score; out.kills += R.kills; out.down += R.down; out.cycles += R.cycles; out.wave += R.wave + 1; out.clear += R.end === 'clear' ? 1 : 0;
  }
  for (const k of Object.keys(out)) out[k] = out[k] / C.seeds;
  return out;
}

function tableOf(names, C, onRow) {
  const season = seasonAt(C.season), st = season.stages[C.n - 1], cacos = C.caco ? [C.caco === 'none' ? null : C.caco] : season.caco.map(c => c.id).concat(C.bare ? [null] : []);
  const table = {}, wins = {};
  for (const name of names) {
    table[name] = st.nodes.map((_, node) => {
      const rows = cacos.map(id => ({ id, r: fight(TEAMS[name], node, id, C) }));
      const top = rows.reduce((a, x) => (x.r.score > a.r.score ? x : a));
      wins[top.id] = (wins[top.id] || 0) + 1;
      if (onRow) onRow(name, node, rows, top);
      return top.r;
    });
  }
  return { table, wins, cacos, season, st };
}

const pairBest = (table, a, b) => Math.max(table[a][0].score + table[b][1].score, table[b][0].score + table[a][1].score);
const rankOf = v => (v < H.PF.TUN.clear ? -1 : H.PF.TUN.stars.filter(s => v >= s).length);
const rankName = r => (r < 0 ? 'ниже порога' : r === 0 ? 'порог' : r + '★');

function bands(season, seeds, teams) {
  const names = teams || [...new Set(PAIRS.flat())], out = [];
  for (const row of BANDS) {
    const C = Object.assign({ season, seeds, cone: 'std' }, row), { table } = tableOf(names, C);
    const sums = PAIRS.map(([a, b]) => pairBest(table, a, b));
    out.push({ n: row.n, lvl: row.lvl, relic: row.relic, sums, ranks: sums.map(rankOf), want: row.want, ok: sums.map((v, i) => row.want[i].includes(rankOf(v))), table });
  }
  return out;
}

const teamSum = table => name => table[name][0].score + table[name][1].score;

function main() {
  const season = +(args.season || 1) - 1, seeds = +(args.seeds || 8);
  if (args.bands) {
    const list = args.teams ? String(args.teams).split(',') : null;
    for (const row of bands(season, seeds, list)) {
      const names = Object.keys(row.table), sum = teamSum(row.table), best = names.slice().sort((a, b) => sum(b) - sum(a));
      console.log('Этап ' + row.n + ', герои ' + row.lvl + ' +' + row.relic + ': ' + PAIRS.map(([a, b], i) => a + '+' + b + ' ' + Math.round(row.sums[i]) + ' ' + rankName(row.ranks[i]) + (row.ok[i] ? '' : ' (цель ' + row.want[i].map(rankName).join('/') + ')')).join('; '));
      console.log('   ' + best.map(k => k + ' ' + Math.round(sum(k))).join('  '));
    }
    return;
  }
  const C = { season, seeds, n: +(args.stage || 1), lvl: +(args.lvl || 50), relic: +(args.relic == null ? 3 : args.relic), cone: args.cone || 'std', hp: +args.hp || 0, atk: +args.atk || 0, caco: args.caco, bare: args.bare };
  const st = seasonAt(season).stages[C.n - 1];
  console.log('Сезон ' + (season + 1) + ', этап ' + C.n + ', враги ' + st.lvl + ', HP ×' + (C.hp || st.hp) + ', ATK ×' + (C.atk || st.atk) + ', циклы ' + st.cycles + ', герои ' + C.lvl + ', реликвии +' + C.relic + ', конусы ' + C.cone + ', зёрен ' + seeds);
  const nameOf = id => (id ? seasonAt(season).caco.find(c => c.id === id).name : 'только Нелепость');
  const names = args.teams ? String(args.teams).split(',') : Object.keys(TEAMS);
  const { table, wins, cacos } = tableOf(names, C, (name, node, rows, top) => {
    console.log(name.padEnd(8) + ' узел ' + (node + 1) + rows.map(x => '  ' + (x === top ? '*' : ' ') + nameOf(x.id).slice(0, 8).padEnd(8) + String(Math.round(x.r.score)).padStart(6)).join('') + '  побед ' + top.r.kills.toFixed(0).padStart(2) + ' волна ' + top.r.wave.toFixed(1) + ' пало ' + top.r.down.toFixed(1) + ' ' + Math.round(top.r.secs) + 'с абс ' + top.r.ults.toFixed(1) + ' ур ' + Math.round(top.r.stack) + ' раскол ' + Math.round(top.r.blast) + ' пер ' + Math.round(top.r.dots));
  });
  for (const [a, b] of PAIRS) {
    if (!table[a] || !table[b]) continue;
    const best = pairBest(table, a, b);
    console.log(a + ' + ' + b + ': ' + Math.round(best) + ' ' + rankName(rankOf(best)));
  }
  console.log('Лучшая Какофония на узле: ' + cacos.map(id => nameOf(id) + ' ' + (wins[id] || 0)).join(', '));
}

if (require.main === module) main();
else module.exports = { H, TEAMS, PAIRS, BANDS, fight, tableOf, bands, pairBest, rankOf };
