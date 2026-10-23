const path = require('path');
const fs = require('fs');
const vm = require('vm');
const os = require('os');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const OUT = path.join(ROOT, 'js/apps/kovcheg-hsr-bench.js');
const VERSION = 1;
const MODULES = ['hsr-data', 'hsr-battle', 'hsr-inaba', 'hsr-fours', 'hsr-conton', 'hsr-hares', 'hsr-fives', 'hsr-world', 'hsr-story', 'hsr-game', 'hsr-traces-data', 'hsr-traces', 'hsr-echoes', 'hsr-trace-fx', 'hsr-su-data', 'hsr-su-battle', 'hsr-su-story', 'hsr-su', 'hsr-chat', 'hsr-missions', 'hsr-hook', 'hsr-section6', 'hsr-info', 'hsr-fours-info', 'hsr-conton-info', 'hsr-hares-info', 'hsr-fives-info', 'hsr-express', 'hsr-herta', 'hsr-herta-life', 'hsr-seclusion', 'hsr-jarilo-story', 'hsr-jarilo-life', 'hsr-museum', 'hsr-boulder', 'hsr-rivet', 'hsr-settle', 'hsr-restricted', 'hsr-corridor', 'hsr-hill', 'hsr-pillars', 'hsr-memory', 'hsr-elation', 'hsr-messenger', 'hsr-velvet', 'hsr-badge', 'hsr-axel-maps', 'hsr-axel-story'];

const H = require(path.join(DIR, 'hsr-core.js'));
for (const f of MODULES) require(path.join(DIR, f + '.js'));
const K = (() => {
  const box = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/apps/kovcheg-hsr.js'), 'utf8'), box);
  return box.window.kovchegHsr;
})();

const CFG = {
  seeds: 12,
  searchSeeds: 6,
  relic: 9,
  hall: { stages: [11, 12, 13, 14, 15], failCycles: 30 },
  boss: { encs: ['gepard2', 'svarog2', 'cocolia2', 's6_mimic', 'rz_grizzly'], hp: 12, atk: 2, failCycles: 40 },
  survive: { encs: ['gepard2', 'svarog2', 'cocolia2', 's6_mimic', 'rz_grizzly'], hp: 6, atk: 4, core: ['danheng', 'pela', 'asta'] },
  su: { world: 4, lvl: 33, hp: 3.5, atk: 3.5, seeds: 24 },
  start: { encs: ['gepard', 'bp_bronya', 'mine', 'svarog', 'cocolia1'], core: ['march', 'danheng', 'natasha'], susCore: ['danheng', 'arlan', 'herta'], spare: 'serval', hp: 4, atk: 2.5, failCycles: 60 },
  cores: [['danheng', 'march', 'natasha'], ['himeko', 'march', 'natasha'], ['yanqing', 'march', 'natasha']],
  susCores: [['danheng', 'asta', 'pela'], ['himeko', 'bronya', 'pela'], ['yanqing', 'tingyun', 'asta']],
  avail: { free: 1, other: 0.9 }
};

const SIM = require(path.join(ROOT, 'js/apps/kovcheg-sim.js')).create(H, K);
const { keyOf, clash, makeGame, play, step, battle, encWaves, fusionPolicy } = SIM;
const round1 = v => Math.round(v * 10) / 10;
const round2 = v => Math.round(v * 100) / 100;
const limited = id => H.CHARS[id].rarity === 5 && !K.FREE.includes(id) && !H.BANNERS.std.featured.includes(id);

function share(dmg, id) {
  const all = Object.values(dmg).reduce((a, v) => a + v, 0);
  return all ? round2((dmg[id] || 0) / all) : 0;
}

function benchHall(team, cone, seeds) {
  if (clash(team)) return null;
  let cyc = 0, wins = 0, runs = 0, downs = 0;
  const dmg = {};
  for (const n of CFG.hall.stages) {
    const st = H.FH.STAGES[n - 1];
    const g = makeGame(team, st.lvl, cone, CFG.relic);
    for (let s = 1; s <= seeds; s++) {
      let used = 0, ok = true;
      st.nodes.forEach((node, ni) => node.forEach((b0, bi) => {
        if (!ok) return;
        const r = battle(g, team, {
          waves: b0.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl,
          foeHp: H.FH.TUN.hp[n - 1], foeAtk: 1 + (n - 1) * H.FH.TUN.atkRamp,
          fh: { budget: st.budget, used, turb: st.turb, n, node: ni, bi }
        }, s * 7919 + ni * 131 + bi * 17 + n * 1009, dmg);
        if (!r.win) { ok = false; return; }
        used += r.cyc;
        downs += r.down;
      }));
      runs++;
      if (ok) { wins++; cyc += used; } else cyc += CFG.hall.failCycles;
    }
  }
  return { cyc: cyc / seeds, win: wins / runs, downs: downs / runs, share: share(dmg, team[0]) };
}

function benchBoss(team, cone, seeds, conf) {
  if (clash(team)) return null;
  const c = conf || CFG.boss;
  let cyc = 0, wins = 0, runs = 0, downs = 0;
  const dmg = {};
  for (const id of c.encs) {
    const r = SIM.bossRun(team, id, seeds, cone, CFG.relic, c, dmg);
    cyc += r.cyc; wins += r.wins; runs += r.runs; downs += r.down;
  }
  return { cyc: cyc / seeds, win: wins / runs, downs: downs / runs, share: share(dmg, team[0]) };
}

function benchSurvive(id, cone, seeds) {
  const team = CFG.survive.core.concat([id]);
  const r = benchBoss(team, cone, seeds, CFG.survive);
  return { win: r.win, downs: r.downs, surv: r.win - 0.02 * r.downs * CFG.survive.encs.length };
}

function benchStart(id, cone, seeds) {
  const core = (K.CHARS[id].cols.includes('sus') ? CFG.start.susCore : CFG.start.core).map(x => (x === id ? CFG.start.spare : x));
  const team = [id].concat(core);
  if (clash(team)) return null;
  let cyc = 0, wins = 0, runs = 0;
  for (const encId of CFG.start.encs) {
    const e = encWaves(encId);
    const g = makeGame(team, e.lvl, 'early', Math.floor(e.lvl / 3));
    for (let s = 1; s <= seeds; s++) {
      const r = battle(g, team, { waves: e.waves, lvl: e.lvl, boss: e.boss, foeHp: CFG.start.hp, foeAtk: CFG.start.atk, extra: e.extra }, s * 6151 + encId.length * 17);
      runs++;
      if (r.win) { wins++; cyc += r.cyc; } else cyc += CFG.start.failCycles;
    }
  }
  return { cyc: cyc / seeds, win: wins / runs };
}

function adj(g, e) {
  for (const [dx, dy, dir] of [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']]) {
    const x = e.x + dx, y = e.y + dy;
    if (!g.blocked(x, y)) { g.placePlayer(x, y); g.player.dir = dir; return true; }
  }
  return false;
}

function suDrive(g, acc) {
  let n = 0;
  while (n++ < 4000) {
    if (g.battle) {
      const b = g.battle;
      if (!b.ev.length && b.phase === 'run' && !b.over) b.start();
      play(b);
      acc.clock += b.clock || 0;
      acc.fights++;
      const out = g.endBattle();
      if (out && out.lost) return out;
      g.afterBattle();
      continue;
    }
    const p = g.pending;
    if (p) { if (p.type === 'choice') g.resume(0); else g.resume(); continue; }
    if (g.script) { g.advanceScript(); continue; }
    return null;
  }
  return { stuck: true };
}

function suDomain(g, acc) {
  const dom = g.state.su.dom;
  if (['combat', 'elite', 'boss'].includes(dom.type)) {
    for (const ch of ['2', '1']) {
      const e = g.map.ents.find(x => x.kind === 'enemy' && x.ch === ch && g.visible(x));
      if (!e) continue;
      g.encounter(e, 'player');
      const lost = suDrive(g, acc);
      if (lost) return lost;
      if (!g.state.su) return null;
    }
  } else if (dom.type === 'respite') {
    for (const obj of g.map.ents.filter(x => (x.kind === 'su_heal' || x.kind === 'su_tp') && g.visible(x))) { adj(g, obj); g.interact(); }
    const herta = g.map.ents.find(x => x.kind === 'npc' && x.def.who === 'herta');
    if (herta) { adj(g, herta); g.interact(); suDrive(g, acc); }
    for (const it of g.suShop()) if (!it.off && it.id !== 'enhance' && g.state.su.frag >= it.cost) { g.suShopBuy(it.id); suDrive(g, acc); }
  } else {
    const fr = g.map.ents.find(x => x.kind === 'su_frame');
    if (fr) { adj(g, fr); g.interact(); }
    const lost = suDrive(g, acc);
    if (lost) return lost;
  }
  if (g.state.su) for (const d of g.map.ents.filter(x => x.kind === 'destr' && g.visible(x))) g.breakDestr(d);
  return null;
}

function benchSu(team, pathId, cone, seeds) {
  if (clash(team)) return null;
  let wins = 0, clock = 0, hp = 0;
  for (let s = 1; s <= seeds; s++) {
    const g0 = makeGame(team, CFG.su.lvl, cone, CFG.relic);
    const st = g0.state;
    for (const f of ['intro', 'asta_met', 'hs_power', 'arlan_met', 'doom', 'express_intro', 'events_note', 'su_open', 'su_beta_done', 'su_clear_1', 'su_clear_2', 'su_clear_3', 'first_gepard', 'first_svarog', 'ending']) st.flags[f] = true;
    st.suPaths = Object.keys(H.SU.PATHS);
    Object.assign(st, { map: 'hs_office', x: null, y: null });
    const g = new H.Game({ state: st, seed: s * 31 + 4 });
    const start = g.startBattle.bind(g);
    g.startBattle = o => start(Object.assign({}, o, { foeHp: (o.foeHp || 1) * CFG.su.hp, foeAtk: (o.foeAtk || 1) * CFG.su.atk }));
    const keys = team.map(keyOf);
    if (!g.suStart(CFG.su.world, pathId, keys)) return null;
    const acc = { clock: 0, fights: 0 };
    let lost = null, guard = 0;
    while (g.state.su && guard++ < 20) {
      lost = suDomain(g, acc);
      if (lost || !g.state.su) break;
      const portal = g.map.ents.find(x => x.kind === 'portal' && g.visible(x));
      if (!portal) { lost = { stuck: true }; break; }
      g.placePlayer(portal.x, portal.y);
      g.onStep();
      suDrive(g, acc);
    }
    if (!lost) { wins++; clock += acc.clock; }
  }
  return { win: wins / seeds, clock: wins ? clock / wins : null };
}

function partners(carry) {
  return new Set(Object.values(H.FUSIONS).filter(f => f.members.includes(carry)).flatMap(f => f.members).filter(x => x !== carry));
}

function pool(constraint, carry) {
  const all = Object.keys(H.CHARS).filter(id => id !== carry);
  const ok = id => constraint === 'free' ? K.FREE.includes(id) : constraint === 'std' ? !limited(id) : true;
  const dot = K.CHARS[carry].build === 'dot';
  const fus = partners(carry);
  const cols = id => K.CHARS[id].cols;
  const mate = id => (cols(id).includes('amp') || (dot && cols(id).includes('sub')) || fus.has(id)) && (!cols(id).includes('dps') || (dot && cols(id).includes('sub')));
  const strict = all.filter(id => ok(id) && mate(id) && !K.CHARS[id].cols.includes('sus'));
  return {
    mates: strict.length >= 3 ? strict : all.filter(id => ok(id) && !K.CHARS[id].cols.includes('sus')),
    sus: all.filter(id => ok(id) && K.CHARS[id].cols.includes('sus'))
  };
}

function objective(team, cone, seeds, mode) {
  if (clash(team)) return Infinity;
  return mode === 'boss' ? benchBoss(team, cone, seeds).cyc : benchHall(team, cone, seeds).cyc;
}

function searchTeam(carry, constraint, cone, mode) {
  const p = pool(constraint, carry);
  const pick = (list, prefer, skip) => prefer.find(x => list.includes(x) && !skip.includes(x)) || list.find(x => !skip.includes(x));
  const m1 = pick(p.mates, ['bronya', 'hanya', 'asta', 'arlan'], []);
  const isSub = x => K.CHARS[x].cols.includes('sub');
  const m2 = pick(p.mates, ['silverwolf', 'pela', 'tingyun', 'serval', 'herta'], [m1].concat(isSub(m1) ? p.mates.filter(isSub) : []));
  let team = [carry, m1, m2, pick(p.sus, ['lynx', 'natasha', 'march'], [])];
  let best = objective(team, cone, CFG.searchSeeds, mode);
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const slot of [3, 1, 2]) {
      const list = slot === 3 ? p.sus : p.mates;
      for (const cand of list) {
        if (team.includes(cand)) continue;
        const t = team.slice();
        t[slot] = cand;
        if (t.slice(1).filter(x => K.CHARS[x].cols.includes('sub')).length > 1) continue;
        const v = objective(t, cone, CFG.searchSeeds, mode);
        if (v < best - 1e-9) { best = v; team = t; moved = true; }
      }
    }
    if (!moved) break;
  }
  return team;
}

function measureTeam(team, cone) {
  const a = benchHall(team, cone, CFG.seeds), b = benchBoss(team, cone, CFG.seeds);
  return { hall: { cyc: round1(a.cyc), win: round2(a.win), share: a.share }, boss: { cyc: round1(b.cyc), win: round2(b.win), downs: round2(b.downs), share: b.share } };
}

function cores(id) {
  return K.CHARS[id].cols.includes('sus') ? CFG.susCores : CFG.cores;
}

function uplift(id, cone) {
  let uh = 0, ub = 0;
  const list = cores(id);
  for (const c of list) {
    const h0 = benchHall(c, cone, CFG.seeds).cyc, b0 = benchBoss(c, cone, CFG.seeds).cyc;
    const t = [c[0], id, c[1], c[2]];
    const h1 = benchHall(t, cone, CFG.seeds).cyc, b1 = benchBoss(t, cone, CFG.seeds).cyc;
    uh += 1 - h1 / h0;
    ub += 1 - b1 / b0;
  }
  return { hall: round2(uh / list.length), boss: round2(ub / list.length) };
}

function suUplift(id, cone) {
  let w = 0, sc = 0, n = 0;
  for (const c of cores(id)) {
    const r = benchSu([c[0], id, c[1], c[2]], K.CHARS[c[0]].su || 'preservation', cone, CFG.su.seeds);
    if (r) { w += r.win; sc += r.clock ? r.win * 1000 / r.clock : 0; n++; }
  }
  return { win: n ? round2(w / n) : 0, score: n ? Math.round(1e5 * sc / n) / 1e5 : 0 };
}

const JOBS = {
  search: (carry, constraint, cone, mode) => searchTeam(carry, constraint, cone, mode),
  team: (team, cone) => measureTeam(team, cone),
  su: (team, pathId, cone) => { const r = benchSu(team, pathId, cone, CFG.su.seeds); return r && { win: round2(r.win), clock: r.clock == null ? null : Math.round(r.clock) }; },
  uplift: (id, cone) => uplift(id, cone),
  suUplift: (id, cone) => suUplift(id, cone),
  survive: (id, cone) => { const r = benchSurvive(id, cone, CFG.seeds); return { win: round2(r.win), downs: round2(r.downs), surv: round2(r.surv) }; },
  sp: id => spOf(id),
  arch: id => archTeam(id),
  stageTeam: (team, n) => H.FH.STAGES[n - 1].nodes.map((_, ni) => benchNode(team, n, ni, CFG.seeds)),
  start: (id) => { const r = benchStart(id, 'early', CFG.seeds); return r && { cyc: round1(r.cyc), win: round2(r.win) }; },
  control: () => control()
};

function spOf(id) {
  const team = [id, 'march', 'natasha', 'asta'].filter((x, i, a) => a.indexOf(x) === i && !clash([id, x]));
  for (const x of ['pela', 'hanya', 'tingyun']) if (team.length < 4 && !team.includes(x)) team.push(x);
  const g = makeGame(team, 45, 'sig', CFG.relic), keys = team.map(keyOf);
  let delta = 0, turns = 0, own = 0, follow = 0;
  for (let s = 1; s <= CFG.seeds; s++) {
    const b = new H.Battle({ party: g.fhSpecs(keys), seed: s * 999, waves: [['svarog_b:45', 'hound:43'], ['cocolia2:45', 'iceedge:43', 'iceedge:43']], lvl: 45, techs: [], noFlee: true, noContact: true, boss: true, foeHp: 3, fh: { budget: 999, used: 0, turb: null } });
    b.start();
    let guard = 0;
    while (!b.over && guard++ < 4000) {
      const cur = b.current, sp0 = b.sp;
      if (!step(b)) break;
      for (const e of b.drain()) if (e.t === 'act' && e.u && e.u.charId === id) { own++; if (e.kind === 'follow' || e.kind === 'chain') follow++; }
      if (cur && cur.charId === id) { delta += b.sp - sp0; turns++; }
    }
  }
  return { turn: turns ? round2(delta / turns) : 0, follow: own ? round2(follow / own) : 0 };
}

function logBattle(team, seed) {
  const st = H.FH.STAGES[14], b0 = st.nodes[0][0];
  const g = makeGame(team, st.lvl, 'sig', CFG.relic), keys = team.map(keyOf);
  const b = new H.Battle({
    party: g.fhSpecs(keys), seed, waves: b0.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl,
    techs: keys.map(k => ({ charId: g.kitOf(k), fx: H.CHARS[g.kitOf(k)].tech.fx })), noFlee: true, noContact: true,
    foeHp: H.FH.TUN.hp[14], foeAtk: 1 + 14 * H.FH.TUN.atkRamp, fh: { budget: st.budget, used: 0, turb: st.turb, n: 15, node: 0, bi: 0 }
  });
  return { b, first: b.start() || [] };
}

function teamLog(team) {
  const { b, first } = logBattle(team, 1);
  const log = [];
  let cycle = 1, extra = false, done = false;
  const eat = list => {
    for (const e of list) {
      if (done) return;
      if (e.t === 'cycle') { cycle = e.n; if (cycle > 2) { done = true; return; } log.push(['cycle', cycle]); }
      else if (e.t === 'turn' && e.u && e.u.side === 'ally') extra = !!e.extra;
      else if (e.t === 'fusion') log.push(['fusion', e.name]);
      else if (e.t === 'act' && e.u && e.u.side === 'ally' && e.kind !== 'fusion') { log.push([e.u.charId, e.name, e.kind, extra ? 1 : 0]); extra = false; }
      if (log.length >= 40) done = true;
    }
  };
  eat(first);
  let guard = 0;
  while (!b.over && !done && guard++ < 2000) {
    if (fusionPolicy(b)) { eat(b.drain()); continue; }
    if (!step(b)) break;
    eat(b.drain());
  }
  return log;
}

function starve(team) {
  let turns = 0, empty = 0;
  for (let s = 1; s <= CFG.seeds; s++) {
    const { b, first } = logBattle(team, s * 7919 + 15 * 1009);
    const look = list => { for (const e of list) if (e.t === 'turn' && e.u && e.u.side === 'ally') { turns++; if (b.sp === 0) empty++; } };
    look(first);
    let guard = 0;
    while (!b.over && guard++ < 4000) {
      if (fusionPolicy(b)) { b.drain(); continue; }
      if (!step(b)) break;
      look(b.drain());
    }
  }
  return turns ? round2(empty / turns) : 0;
}

function archTeam(id) {
  const t = K.TEAMS.find(x => x.id === id);
  const base = measureTeam(t.members, 'sig');
  const alts = {};
  for (const [slot, list] of Object.entries(t.alts || {})) {
    alts[slot] = list.map(a => {
      const m = t.members.slice();
      m[+slot] = a;
      if (clash(m)) return null;
      const r = measureTeam(m, 'sig');
      return { id: a, hall: r.hall.cyc, boss: r.boss.cyc, bossWin: r.boss.win };
    }).filter(Boolean);
  }
  return Object.assign(base, { alts, log: teamLog(t.members), starve: starve(t.members) });
}

function benchNode(team, n, ni, seeds) {
  const r = SIM.hallRun(team, n, ni, seeds, 'sig', CFG.relic);
  return r && { cyc: round1(r.cyc), win: round2(r.win) };
}

function stageCandidates(R) {
  const seen = new Set(), out = [];
  const add = team => { const k = team.slice().sort().join(','); if (!seen.has(k) && !clash(team)) { seen.add(k); out.push(team.slice()); } };
  for (const t of K.TEAMS) add(t.members);
  for (const c of Object.values(R.chars)) if (c.teams) for (const v of ['best', 'std', 'free']) add(c.teams[v].sig.hall.team);
  return out;
}

function teamClass(team) {
  if (team.every(id => K.FREE.includes(id))) return 'free';
  if (team.every(id => !limited(id))) return 'std';
  return 'best';
}

function pickStage(n, rows) {
  const st = H.FH.STAGES[n - 1];
  const ok = (v, t) => v === 'best' || (v === 'std' ? teamClass(t) !== 'best' : teamClass(t) === 'free');
  const keyset = t => new Set(t.map(keyOf));
  const out = {};
  for (const v of ['best', 'std', 'free']) {
    const pool = rows.filter(r => ok(v, r.team));
    if (st.nodes.length === 1) {
      const b = pool.slice().sort((x, y) => y.res[0].win - x.res[0].win || x.res[0].cyc - y.res[0].cyc)[0];
      out[v] = b ? { teams: [b.team], res: [b.res[0]], total: b.res[0].cyc } : null;
      continue;
    }
    const a = pool.slice().sort((x, y) => y.res[0].win - x.res[0].win || x.res[0].cyc - y.res[0].cyc).slice(0, 25);
    const c = pool.slice().sort((x, y) => y.res[1].win - x.res[1].win || x.res[1].cyc - y.res[1].cyc).slice(0, 25);
    let best = null;
    for (const x of a) for (const y of c) {
      const kx = keyset(x.team);
      if (y.team.some(id => kx.has(keyOf(id)))) continue;
      const win = Math.min(x.res[0].win, y.res[1].win), total = x.res[0].cyc + y.res[1].cyc;
      if (!best || win > best.win || (win === best.win && total < best.total)) best = { win, total, x, y };
    }
    out[v] = best ? { teams: [best.x.team, best.y.team], res: [best.x.res[0], best.y.res[1]], total: round1(best.total) } : null;
  }
  return out;
}

function control() {
  const team = ['seele', 'bronya', 'silverwolf', 'lynx'];
  const st = H.FH.STAGES[14], g = makeGame(team, st.lvl, 'sig', CFG.relic), b0 = st.nodes[0][0];
  const r = battle(g, team, { waves: b0.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl, foeHp: H.FH.TUN.hp[14], foeAtk: 1 + 14 * H.FH.TUN.atkRamp, fh: { budget: st.budget, used: 0, turb: st.turb, n: 15, node: 0, bi: 0 } }, 7919 + 15 * 1009);
  return { team, stage: 15, cyc: r.cyc, clock: Math.round(r.clock * 1000) / 1000, win: r.win };
}

function fingerprint() {
  const kits = {};
  for (const [id, c] of Object.entries(H.CHARS)) {
    const o = {};
    for (const [k, v] of Object.entries(c)) if (!['look', 'name', 'contact', 'talent', 'fullName', 'studentLook', 'pinkLook', 'lanternLook', 'rangerLook', 'short', 'arcana'].includes(k)) o[k] = v;
    kits[id] = o;
  }
  const strip = v => JSON.parse(JSON.stringify(v, (k, x) => (['text', 'name', 'title', 'look', 'col', 'lines', 'poster', 'tag'].includes(k) ? undefined : x)));
  const data = { VERSION, CFG, kits, T: H.TUNING, FH: strip({ TUN: H.FH.TUN, TURB: H.FH.TURB, STAGES: H.FH.STAGES }), EN: strip(H.ENEMIES), ENC: strip(H.ENCOUNTERS), CONES: strip(H.CONES), RELICS: strip(H.RELIC_SETS), MAIN: H.MAIN_VALUE, ROLL: H.STAT_ROLL, FUS: strip(H.FUSIONS), SITE: { P: K.PRESETS, C: Object.fromEntries(Object.entries(K.CHARS).map(([id, c]) => [id, { cols: c.cols, build: c.build, su: c.su }])), S: K.STD_CONE, E: K.EARLY_CONE, F: K.FREE, T: K.TIERS.map(t => [t.id, t.min]), TM: K.TEAMS.map(t => [t.id, t.members, t.alts]) } };
  return crypto.createHash('sha1').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

module.exports = { H, K, CFG, makeGame, battle, benchHall, benchBoss, benchSurvive, benchStart, benchSu, searchTeam, measureTeam, uplift, control, fingerprint, play, fusionPolicy };

if (!isMainThread) {
  parentPort.on('message', ({ id, fn, args }) => {
    try { parentPort.postMessage({ id, ok: true, v: JOBS[fn](...args) }); }
    catch (e) { parentPort.postMessage({ id, ok: false, err: e.stack || String(e) }); }
  });
} else if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

function runPool(tasks, jobs, label) {
  return new Promise((resolve, reject) => {
    const out = new Array(tasks.length);
    let next = 0, done = 0;
    const t0 = Date.now();
    if (!tasks.length) { resolve(out); return; }
    const workers = [];
    const feed = w => {
      if (next >= tasks.length) { w.terminate(); return; }
      const id = next++;
      w.postMessage({ id, fn: tasks[id][0], args: tasks[id].slice(1) });
    };
    for (let i = 0; i < Math.min(jobs, tasks.length); i++) {
      const w = new Worker(__filename);
      workers.push(w);
      w.on('message', m => {
        if (!m.ok) { workers.forEach(x => x.terminate()); reject(new Error(tasks[m.id].join(' ') + '\n' + m.err)); return; }
        out[m.id] = m.v;
        done++;
        if (done % 10 === 0 || done === tasks.length) process.stdout.write('\r' + label + ' ' + done + '/' + tasks.length + ' ' + Math.round((Date.now() - t0) / 1000) + 's   ');
        if (done === tasks.length) { process.stdout.write('\n'); resolve(out); return; }
        feed(w);
      });
      w.on('error', reject);
      feed(w);
    }
  });
}

function tierOf(score) {
  return K.TIERS.find(t => score >= t.min - 1e-9).id;
}

function scoreAll(R) {
  const ids = Object.keys(H.CHARS);
  const tiers = {}, scores = {};
  for (const mode of ['hall', 'boss', 'su', 'start']) {
    tiers[mode] = {};
    scores[mode] = {};
    for (const cone of ['sig', 'std']) {
      tiers[mode][cone] = {};
      scores[mode][cone] = {};
      for (const col of ['dps', 'sub', 'amp', 'sus']) {
        const T = tiers[mode][cone][col] = {}, S = scores[mode][cone][col] = {};
        const list = ids.filter(id => K.CHARS[id].cols.includes(col));
        const raw = {};
        for (const id of list) {
          const c = R.chars[id];
          if (mode === 'start') raw[id] = c.start ? c.start.win * (1 / Math.max(0.1, c.start.cyc)) * (K.FREE.includes(id) ? CFG.avail.free : CFG.avail.other) : 0;
          else if (col === 'dps') {
            const t = c.teams && c.teams.best && c.teams.best[cone];
            if (!t) { raw[id] = 0; continue; }
            if (mode === 'su') { const s = c.su && c.su[cone]; raw[id] = s && s.clock ? s.win * 1000 / s.clock : 0; }
            else raw[id] = t[mode][mode].win / Math.max(0.1, t[mode][mode].cyc);
          } else if (mode === 'su') raw[id] = c.suUp ? c.suUp[cone].score : 0;
          else {
            const u = c.up ? Math.max(0, c.up[cone][mode]) : 0;
            raw[id] = u;
          }
        }
        if (col === 'sus' && mode !== 'start') {
          const maxU = Math.max(...list.map(id => raw[id]), 1e-9);
          const sv = id => Math.max(0, R.chars[id].survive ? R.chars[id].survive[cone].surv : 0);
          const maxS = Math.max(...list.map(sv), 1e-9);
          for (const id of list) raw[id] = 0.5 * raw[id] / maxU + 0.5 * sv(id) / maxS;
        }
        const top = Math.max(...list.map(id => raw[id]), 1e-9);
        for (const id of list) { S[id] = round2(raw[id] / top); T[id] = tierOf(raw[id] / top); }
      }
    }
  }
  return { tiers, scores };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (k, d) => { const a = args.find(x => x.startsWith('--' + k)); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
  if (flag('check')) {
    const fp = fingerprint();
    console.log(JSON.stringify({ fingerprint: fp, control: control() }));
    return;
  }
  const jobs = +flag('jobs', Math.max(1, os.cpus().length - 2));
  if (flag('quick')) { CFG.seeds = 4; CFG.su.seeds = 3; CFG.searchSeeds = 2; }
  const only = flag('only') ? String(flag('only')).split(',') : null;
  const ids = Object.keys(H.CHARS).filter(id => !only || only.includes(id));
  const dps = ids.filter(id => K.CHARS[id].cols.includes('dps'));
  const others = ids.filter(id => !K.CHARS[id].cols.includes('dps') || K.CHARS[id].cols.length > 1);
  const R = { chars: {} };
  for (const id of Object.keys(H.CHARS)) R.chars[id] = {};
  const t0 = Date.now();

  const searches = [];
  for (const id of dps) for (const c of ['best', 'std', 'free']) for (const cone of ['sig', 'std']) for (const mode of ['hall', 'boss']) searches.push(['search', id, c, cone, mode]);
  const found = await runPool(searches, jobs, 'search');
  searches.forEach(([, id, c, cone, mode], i) => {
    const t = (R.chars[id].teams = R.chars[id].teams || {});
    const tc = ((t[c] = t[c] || {})[cone] = t[c][cone] || {});
    tc[mode] = { team: found[i] };
  });

  const measures = [];
  for (const id of dps) for (const c of ['best', 'std', 'free']) for (const cone of ['sig', 'std']) for (const mode of ['hall', 'boss']) measures.push(['team', R.chars[id].teams[c][cone][mode].team, cone, id, c, mode]);
  const mres = await runPool(measures.map(x => x.slice(0, 3)), jobs, 'teams');
  measures.forEach((m, i) => { Object.assign(R.chars[m[3]].teams[m[4]][m[2]][m[5]], mres[i]); });

  const sus = [];
  for (const id of dps) for (const cone of ['sig', 'std']) sus.push(['su', R.chars[id].teams.best[cone].hall.team, K.CHARS[id].su || 'preservation', cone, id]);
  const sres = await runPool(sus.map(x => x.slice(0, 4)), jobs, 'su');
  sus.forEach((m, i) => { (R.chars[m[4]].su = R.chars[m[4]].su || {})[m[3]] = sres[i]; });

  const ups = [], sups = [], survs = [];
  for (const id of others) for (const cone of ['sig', 'std']) {
    ups.push(['uplift', id, cone]);
    sups.push(['suUplift', id, cone]);
    if (K.CHARS[id].cols.includes('sus')) survs.push(['survive', id, cone]);
  }
  const ures = await runPool(ups, jobs, 'uplift');
  ups.forEach(([, id, cone], i) => { (R.chars[id].up = R.chars[id].up || {})[cone] = ures[i]; });
  const sures = await runPool(sups, jobs, 'su-uplift');
  sups.forEach(([, id, cone], i) => { (R.chars[id].suUp = R.chars[id].suUp || {})[cone] = sures[i]; });
  const vres = await runPool(survs, jobs, 'survive');
  survs.forEach(([, id, cone], i) => { (R.chars[id].survive = R.chars[id].survive || {})[cone] = vres[i]; });

  const sps = ids.map(id => ['sp', id]);
  const spres = await runPool(sps, jobs, 'sp');
  sps.forEach(([, id], i) => { R.chars[id].sp = spres[i]; });

  const archs = K.TEAMS.map(t => ['arch', t.id]);
  const ares = await runPool(archs, jobs, 'teams-db');
  R.teams = {};
  archs.forEach(([, id], i) => { R.teams[id] = ares[i]; });

  const cands = stageCandidates(R);
  const stTasks = [];
  for (let n = 1; n <= H.FH.STAGES.length; n++) for (const t of cands) stTasks.push(['stageTeam', t, n]);
  const stRes = await runPool(stTasks, jobs, 'stages');
  R.stages = {};
  for (let n = 1; n <= H.FH.STAGES.length; n++) {
    const rows = stTasks.map((t, i) => ({ t, r: stRes[i] })).filter(x => x.t[2] === n).map(x => ({ team: x.t[1], res: x.r }));
    R.stages[n] = pickStage(n, rows);
  }

  const starts = ids.map(id => ['start', id]);
  const stres = await runPool(starts, jobs, 'start');
  starts.forEach(([, id], i) => { R.chars[id].start = stres[i]; });

  const ctl = (await runPool([['control']], 1, 'control'))[0];
  const { tiers, scores } = scoreAll(R);
  const result = {
    version: VERSION, fingerprint: fingerprint(), control: ctl,
    conditions: { seeds: CFG.seeds, relic: CFG.relic, hall: CFG.hall, boss: CFG.boss, survive: CFG.survive, su: CFG.su, start: CFG.start, cores: CFG.cores, susCores: CFG.susCores },
    chars: R.chars, teams: R.teams, stages: R.stages, scores, tiers
  };
  if (!flag('dry')) fs.writeFileSync(OUT, 'window.kovchegBench = ' + JSON.stringify(result) + ';\n');
  console.log('done in ' + Math.round((Date.now() - t0) / 1000) + 's' + (flag('dry') ? ' (dry run, file not written)' : ', wrote ' + path.relative(ROOT, OUT)));
  if (flag('print')) printTables(result);
}

function printTables(r) {
  const name = id => (id === 'trail' ? 'Первопроходец-Р' : id === 'trail_p' ? 'Первопроходец-С' : H.CHARS[id].name);
  for (const mode of ['hall', 'boss', 'su', 'start']) for (const cone of ['sig', 'std']) {
    console.log('\n== ' + mode + ' / ' + cone);
    for (const t of K.TIERS) {
      const row = ['dps', 'sub', 'amp', 'sus'].map(col => Object.keys(r.tiers[mode][cone][col]).filter(id => r.tiers[mode][cone][col][id] === t.id).map(name).join(', '));
      console.log(t.name.padEnd(5) + ' | ' + row.join(' | '));
    }
  }
}
