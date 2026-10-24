const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const mods = [...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
const H = require(path.join(DIR, 'hsr-core.js'));
for (const f of mods.slice(0, mods.indexOf('hsr-gfx'))) if (f !== 'hsr-core') require(path.join(DIR, f + '.js'));
const CW = H.CW, TUN = CW.TUN;

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const RUNS = +(args.runs || 40), POLICY = args.policy || 'bonds', PREP = +(args.prep || 25);
for (const [k, v] of Object.entries(args)) if (typeof TUN[k] === 'number') TUN[k] = +v; else if (Array.isArray(TUN[k])) TUN[k] = v.split(',').map(Number);
const EV = { act: 0.55, dmg: 0.2, break: 0.75, heal: 0.2, shield: 0.12, kill: 0.35, text: 1.1, wave: 0.9, revive: 0.7, summon: 0.45, win: 0.5, lose: 0.6 };

const LINEUP = args.lineup ? CW.LINEUPS.find(L => L.id === args.lineup) : null;
const value = (g, r, id) => {
  const d = CW.UNITS[id], owned = g.cwUnits(r).filter(x => x.u.id === id).length;
  const st = g.cwBonds(r);
  let v = d.cost + owned * 2;
  if (POLICY === 'bonds') for (const k of d.bonds) if (CW.BONDS[k] && st[k].next && !st[k].members.includes(id)) v += 3;
  if (LINEUP && LINEUP.on.concat(LINEUP.off).includes(id)) v += 8;
  if (args.mono && d.bonds.includes(args.mono)) v += 8;
  return v;
};

function gear(g, r) {
  const inv = g.cwInv(r), kind = it => CW.ITEMS[it.id].kind;
  for (let guard = 0; guard < 30; guard++) {
    const i = inv.findIndex(it => CW.ITEMS[it.id].on === 'self');
    if (i < 0) break;
    if (g.cwOpenBox(i) === 'choice') { if (g.cwChoose(0)) g.cwCancelChoice(); } else break;
    if (r.choice) { g.cwCancelChoice(); break; }
  }
  for (let guard = 0; guard < 20; guard++) {
    const a = inv.findIndex(it => kind(it) === 'basic'), b = inv.findIndex((it, n) => n !== a && kind(it) === 'basic');
    if (a < 0 || b < 0) break;
    g.cwInvCombine(a, b);
  }
  const hosts = r.board.on.map((u, i) => u && { z: 'on', i, u }).filter(Boolean).concat(r.board.off.map((u, i) => u && { z: 'off', i, u }).filter(Boolean));
  for (let guard = 0; guard < 20; guard++) {
    const i = inv.findIndex(it => ['adv', 'emblem', 'trash', 'gem'].includes(kind(it)));
    if (i < 0 || !hosts.length) break;
    const host = hosts.slice().sort((x, y) => (x.u.items || []).length - (y.u.items || []).length)[0];
    if (g.cwEquip(i, host.z, host.i)) { const it = inv.splice(i, 1)[0]; inv.push(it); if (guard > 10) break; }
  }
}

const STRAT = args.strat || 'first';
const stratTally = {};
function special(g, r) {
  if (r.envPick) { const opts = r.envPick.opts, i = STRAT === 'mix' ? r.seed % opts.length : 0; stratTally['env:' + opts[i]] = 1; g.cwTakeEnv(i); }
  for (let n = 0; r.stratPick && n < 4; n++) {
    const opts = r.stratPick.opts, i = STRAT === 'mix' ? (r.seed + r.step) % opts.length : 0;
    stratTally[opts[i]] = (stratTally[opts[i]] || 0) + 1;
    g.cwTakeStrat(i);
  }
  if (r.choice && r.choice.kind === 'p1') g.cwChoose(0);
  if (g.cwNumbyCap(r) && !g.cwSpecial(r).numby) g.cwInvest(g.cwNumbyCap(r));
  if (g.cwWildMax(r) && !g.cwSpecial(r).wild.length) {
    const st = g.cwBonds(r), k = CW.DIR_BONDS.slice().sort((a, b) => (st[b].next ? st[b].n - st[b].next : -9) - (st[a].next ? st[a].n - st[a].next : -9))[0];
    g.cwSetWild(k);
  }
  const inv = g.cwInv(r);
  for (let guard = 0; guard < 4 && g.cwPeppySlots(r) > g.cwSpecial(r).peppy.length; guard++) {
    const i = inv.findIndex(it => CW.ITEMS[it.id].bond && !g.cwSpecial(r).peppy.some(x => x.id === it.id));
    if (i < 0 || g.cwPeppyGive(i)) break;
  }
}

function prep(g, r) {
  special(g, r);
  const keep = POLICY === 'greedy' ? 0 : Math.min(30, 10 * Math.floor(r.gold / 10));
  for (let pass = 0; pass < 3; pass++) {
    const order = r.shop.map((id, i) => ({ id, i })).filter(x => x.id).sort((a, b) => value(g, r, b.id) - value(g, r, a.id));
    for (const { id, i } of order) {
      const cost = CW.UNITS[id].cost, pair = g.cwUnits(r).some(x => x.u.id === id);
      if (r.gold - cost < keep && !pair && g.cwDeployed(r).length >= g.cwTeamSize(r)) continue;
      if (!g.cwCanBuy(i)) g.cwBuy(i);
    }
    if (r.gold - TUN.expCost >= keep && r.lvl < 8 && (POLICY === 'greedy' || r.node >= 2)) g.cwBuyExp();
    if (r.gold - TUN.refreshCost >= keep + 2 && pass < 2 && POLICY !== 'econ') g.cwRefresh(); else break;
  }
  if (POLICY !== 'noitems') gear(g, r);
  const units = g.cwUnits(r).map(x => x.u).sort((a, b) => (b.star * 10 + CW.UNITS[b.id].cost) - (a.star * 10 + CW.UNITS[a.id].cost));
  for (const z of ['on', 'off', 'bench']) r.board[z].fill(null);
  const cap = g.cwTeamSize(r);
  let n = 0;
  for (const u of units) {
    const pos = CW.UNITS[u.id].pos, want = pos === 'off' ? ['off', 'on'] : ['on', 'off'];
    let placed = false;
    if (n < cap) for (const z of want) { const at = r.board[z].indexOf(null); if (at >= 0) { r.board[z][at] = u; placed = true; n++; break; } }
    if (placed) continue;
    const at = r.board.bench.indexOf(null);
    if (at >= 0) r.board.bench[at] = u;
    else { r.gold += CW.sellValue(u); r.pool[u.id] += Math.pow(3, u.star - 1); }
  }
}

const MODE = args.mode || 'standard', TIER = +(args.tier || 0), SUB = +(args.sub || 1), REPLAY = +(args.replay || 0);
const out = { runs: 0, cleared: 0, winHp: 0, hp: 0, battleSec: 0, prepSec: 0, nodes: { win: {}, lose: {} }, near: 0, fights: 0, battles: 0, av: 0, lvl: 0, bonds: {}, dead: 0, plane: [0, 0, 0] };
const fight = (g, r, key) => {
  const b = g.battle;
  let sec = 0;
  const tally = ev => { for (const e of ev) sec += EV[e.t] || 0; };
  tally(b.start());
  for (let i = 0; i < 4000 && !b.over; i++) { if (!b.autoStep()) break; tally(b.drain()); }
  tally(b.drain());
  for (const [k, t] of Object.entries(b.cw.tiers)) out.bonds[k] = (out.bonds[k] || 0) + (t + 1);
  out.battleSec += sec;
  out.av += b.cwInfo.t;
  out.battles++;
  return g.endBattle().cw;
};
for (let s = 1; s <= RUNS; s++) {
  const g = new H.Game({ fresh: true, seed: 1000 + s });
  if (args.perks) g.cwPerks().perks.on = args.perks === 'all' ? CW.PERKS.map(p => p.id) : args.perks === 'perm' ? CW.PERKS.filter(p => p.tab === 'p').map(p => p.id) : args.perks.split(',');
  const r = g.cwNew({ mode: MODE, tier: TIER, sub: SUB });
  let guard = 0;
  while (g.cwRun() && guard++ < 80) {
    prep(g, r);
    out.prepSec += PREP;
    const kind = g.cwNodeKind(r), key = (r.plane + 1) + '-' + (r.node + 1) + ':' + kind;
    if (kind === 'reward' && r.harvest && POLICY === 'econ') { g.cwHarvest(); continue; }
    if (g.cwGo() === 'field') { const u = r.board.off.find(Boolean); if (u) { r.board.on[0] = u; r.board.off[r.board.off.indexOf(u)] = null; } g.cwGo(); }
    if (r.phase === 'supply') { const t = g.cwTakeOffer(0); if (!t || t.full) g.cwSkipOffer(); continue; }
    if (r.phase === 'enc') g.cwPickBranch(r.branches.length - 1 === 3 ? 1 : r.hp > 50 ? 1 : 0);
    let res = fight(g, r, key);
    for (let n = 0; res.choice && n < REPLAY; n++) { g.cwReplay(); g.cwGo(); res = fight(g, r, key); }
    if (res.choice) res = g.cwAccept();
    out.near += res.near;
    if (kind !== 'reward') out.fights++;
    out.nodes[res.win ? 'win' : 'lose'][key] = (out.nodes[res.win ? 'win' : 'lose'][key] || 0) + 1;
  }
  const h = g.cw().hist[0];
  out.runs++;
  out.plane[h.plane]++;
  if (h.cleared) { out.cleared++; out.winHp += h.hp; }
  if (h.hp <= 0) out.dead++;
  out.hp += h.hp;
  out.lvl += h.lvl;
}
const f = (v, d = 1) => (v / out.runs).toFixed(d);
console.log('policy ' + POLICY + ', ' + out.runs + ' runs, ' + MODE + ' ' + CW.RANKS[TIER].code + '-' + SUB + (REPLAY ? ', replays ' + REPLAY : ''));
console.log('run won ' + Math.round(100 * out.cleared / out.runs) + '%, win HP ' + (out.winHp / Math.max(1, out.cleared)).toFixed(1) + ', team HP left ' + f(out.hp) + ', runs lost to HP ' + out.dead + ', ended in plane 1/2/3: ' + out.plane.join('/') + ', level at end ' + f(out.lvl));
console.log('battle time x1 ' + f(out.battleSec / 60) + ' min, x3 ' + f(out.battleSec / 180) + ' min, prep ' + f(out.prepSec / 60) + ' min (' + PREP + ' s per stage)');
console.log('run length at x3 with prep: ' + f((out.battleSec / 3 + out.prepSec) / 60) + ' min');
console.log('«О гибели» per fight ' + (out.near / Math.max(1, out.fights)).toFixed(2) + ', action value per battle ' + (out.av / Math.max(1, out.battles)).toFixed(0));
const nodes = [...new Set([...Object.keys(out.nodes.win), ...Object.keys(out.nodes.lose)])].sort();
console.log('node win rate: ' + nodes.map(k => k + ' ' + Math.round(100 * (out.nodes.win[k] || 0) / ((out.nodes.win[k] || 0) + (out.nodes.lose[k] || 0))) + '%').join(', '));
console.log('strategies taken: ' + Object.values(stratTally).reduce((a, b) => a + b, 0) + ' (' + Object.keys(stratTally).length + ' different)');
console.log('average bond step per battle: ' + Object.entries(out.bonds).map(([k, v]) => k + ' ' + (v / Math.max(1, out.battles)).toFixed(2)).join(', '));
