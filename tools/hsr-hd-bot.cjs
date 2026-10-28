const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const mods = [...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
const H = require(path.join(DIR, 'hsr-core.js'));
for (const f of mods.slice(0, mods.indexOf('hsr-gfx'))) if (f !== 'hsr-core') require(path.join(DIR, f + '.js'));
const HD = H.HD, TUN = HD.TUN, TS = 32;

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const RUNS = +(args.runs || 40), DIFF = args.diff || 'normal', WAVES = +(args.waves || HD.WAVES.length);
const HEROES = args.hero ? args.hero.split(',') : Object.keys(HD.HEROES);
for (const [k, v] of Object.entries(args)) if (typeof TUN[k] === 'number') TUN[k] = +v; else if (Array.isArray(TUN[k])) TUN[k] = v.split(',').map(Number);
if (WAVES < HD.WAVES.length) HD.WAVES.length = WAVES;
for (const [k, v] of Object.entries(args)) if (k.startsWith('amp_') && HD.HEROES[k.slice(4)]) HD.HEROES[k.slice(4)].amp = +v;
for (const [k, v] of Object.entries(args)) if (k.startsWith('hamp_') && HD.HEROES[k.slice(5)]) HD.HEROES[k.slice(5)].ampHard = +v;
for (const [k, v] of Object.entries(args)) { const m = /^d_(\w+?)_(\w+)$/.exec(k); if (m && HD.DIFFS[m[1]] && typeof HD.DIFFS[m[1]][m[2]] === 'number') HD.DIFFS[m[1]][m[2]] = +v; }
for (const [k, v] of Object.entries(args)) { const m = /^(hpK|dmgK)_(\w+)$/.exec(k); if (m && (HD.THREATS[m[2]] || HD.FOES[m[2]])) (HD.THREATS[m[2]] || HD.FOES[m[2]])[m[1]] = +v; }

const MOUTH = { n: { x: 29.5 * TS, y: 18 * TS }, w: { x: 16 * TS, y: 24.5 * TS }, e: { x: 43 * TS, y: 24.5 * TS } };
const laneOf = u => (u.x < 18 * TS ? 'w' : u.x > 42 * TS ? 'e' : u.y < 20 * TS ? 'n' : 'p');
const BUY = ['revive', 'medkit', 'medkit', 'thermos'];
const NOBUILD = !!args.nobuild;
const ELEM_SET = { phys: 'champion', fire: 'firesmith', ice: 'glacial', elec: 'thunder', wind: 'eagle', quant: 'genius', imag: 'wastelander' };
const PATH_SET = { harmony: 'musketeer', preservation: 'knight', abundance: 'passerby' };
const SUPPORT = { harmony: 1, preservation: 1, abundance: 1 };
const CONES = {
  trail: ['underthesky', 'brighter'], blade: ['cccstandee', 'unreachable'], clara: ['sword_rumor', 'unreachable'],
  seele: ['swordplay', 'night'], danheng: ['river', 'shrine'], topaz: ['battery', 'blissful'],
  himeko: ['geniuses', 'milkyway'], herta: ['geniuses', 'milkyway'], jingyuan: ['starlight', 'beforedawn'],
  bronya: ['pastfuture', 'butthebattle'], asta: ['cccbadge', 'butthebattle'], ruanmei: ['memories', 'mirror'],
  kafka: ['goodnight', 'patience'], silverwolf: ['vault', 'rain'], welt: ['goodnight', 'rain'],
  march: ['trend', 'moment'], gepard: ['trend', 'moment'], fuxuan: ['trend', 'shuteyes'],
  natasha: ['postop', 'hagoromo'], bailu: ['postop', 'fright'], luocha: ['postop', 'coffin']
};
const PIECES = ['head', 'hands', 'body', 'feet'], PLANAR = ['sphere', 'rope'];

function buildSteps(h) {
  const C = H.CHARS[h.key], [c4, c5] = CONES[h.key];
  const set = PATH_SET[C.path] || ELEM_SET[C.elem], planar = SUPPORT[C.path] ? 'vonwacq' : 'station';
  const relic = (st, slot) => ({ cost: HD.RELIC.price, slot: true, done: () => h.items.some(it => it && it.id === 'relic' && it.slot === slot), cmd: { t: 'buy', id: 'relic', set: st, slot } });
  const ups = lvl => ({ each: true, lvl });
  const cone = id => ({ cost: HD.CONE_PRICE[H.CONES[id].rarity], done: () => !!h.cone && (h.cone.id === id || (id === c4 && h.cone.id === c5)), cmd: { t: 'buy', id: 'cone', cone: id } });
  const sup = n => ({ cost: Math.round(HD.CONE_PRICE[5] * 0.5), done: () => !h.cone || h.cone.id !== c5 || h.cone.sup >= n, cmd: { t: 'upgrade', i: 'cone' } });
  return [cone(c4)].concat(PIECES.map(p => relic(set, p)), PLANAR.map(p => relic(planar, p)), [ups(2), cone(c5), ups(4), sup(2), sup(3), ups(5), sup(4), sup(5)]);
}

function nextBuy(h) {
  for (const st of buildSteps(h)) {
    if (st.each) {
      const i = h.items.findIndex(it => it && it.id === 'relic' && (it.up || 0) < st.lvl);
      if (i >= 0) return { cost: HD.upgradeCost(h.items[i]), cmd: { t: 'upgrade', i } };
      continue;
    }
    if (!st.done()) return st;
  }
  return null;
}

function shopping(A, h) {
  const step = NOBUILD ? null : nextBuy(h);
  if (step && h.gold >= step.cost) {
    if (step.slot && !h.items.includes(null)) {
      const i = h.items.findIndex(it => it && HD.SUPPLIES[it.id]);
      if (i >= 0) A.cmd({ t: 'sell', i });
      return;
    }
    A.cmd(step.cmd);
    return;
  }
  const relics = h.items.filter(it => it && it.id === 'relic').length;
  if (!NOBUILD && relics >= 4) return;
  const want = BUY.find(id => h.gold >= HD.SUPPLIES[id].price + 60 && !(id === 'revive' && h.items.some(it => it && it.id === 'revive')) && h.items.filter(it => it && it.id === id).reduce((a, it) => a + it.n, 0) < (id === 'medkit' ? (A.phase === 'break' ? 3 : 1) : 1));
  if (want && (!step || A.phase === 'break' || want === 'medkit')) A.cmd({ t: 'buy', id: want });
}
const PICK = { 10: +(args.tr || 0), 20: +(args.ei || 0) };
const SELF = {
  trail: { e: { heal: true } }, seele: { e: { r: 150, n: 2 } }, blade: { q: { r: 140, n: 1, hp: 0.6 }, r: { r: 96, n: 1 } },
  clara: { q: { r: 160, n: 2 }, e: { r: 120, n: 2 }, r: { r: 220, n: 3 } }, danheng: { e: { r: 200, n: 1 } },
  topaz: { e: { r: 400, n: 1 }, r: { r: 400, n: 2 } }, herta: { q: { r: 140, n: 2 }, e: { r: 300, n: 2 }, r: { r: 260, n: 3 } },
  jingyuan: { q: { r: 140, n: 2 }, e: { r: 260, n: 2 }, r: { r: 220, n: 3 } },
  bronya: { r: { r: 300, n: 2 } }, asta: { r: { r: 300, n: 2 } }, ruanmei: { q: { r: 300, n: 2 } }, kafka: { r: { r: 260, n: 2 } }, welt: { e: { r: 160, n: 2 } },
  gepard: { e: { r: 220, n: 1 }, r: { r: 200, n: 2 } }, fuxuan: { q: { r: 400, n: 2 }, r: { r: 240, n: 2 } }, natasha: { r: { heal: true } },
  bailu: { e: { r: 300, n: 2 }, r: { heal: true } }, luocha: { e: { r: 220, n: 2 }, r: { r: 240, n: 2 } }
};
const ALLY = { bronya: 'buff', march: 'shield', natasha: 'heal', bailu: 'heal', luocha: 'heal' };

function think(A, B) {
  const h = A.hero, foes = A.foes();
  if (h.dead) { if (A.phase === 'wave' && A.base.hp < A.base.hpMax * 0.5) A.cmd({ t: 'buyback' }); return; }
  for (const s of ['r'].concat(HD.HEROES[h.key].order, ['q', 'e', 't'])) if (A.canUp(h, s)) { A.cmd({ t: 'up', slot: s }); break; }
  const pk = A.needPick(h);
  if (pk) A.cmd({ t: 'pick', i: PICK[pk] });
  if (A.nearShop(h)) shopping(A, h);
  const low = h.hp < h.hpMax * 0.3;
  if (low && !B.retreat) B.retreat = true;
  if (B.retreat && h.hp > h.hpMax * 0.85) B.retreat = false;
  if (B.retreat) {
    const med = h.items.findIndex(it => it && it.id === 'medkit');
    if (med >= 0 && !h.fx.some(f => f.n === 'Аптечка')) A.cmd({ t: 'use', i: med });
    if (!A.inPlaza(h)) {
      if (h.recallCd <= 0 && h.recall <= 0 && !foes.some(f => Math.hypot(f.x - h.x, f.y - h.y) < 160)) A.cmd({ t: 'recall' });
      else if (h.recall <= 0 && !h.path) A.cmd({ t: 'goto', x: (A.M.spawn[0] + 0.5) * TS, y: (A.M.spawn[1] + 0.5) * TS });
    }
    return;
  }
  if (h.en < h.enMax * 0.3) { const th = h.items.findIndex(it => it && it.id === 'thermos'); if (th >= 0 && A.phase === 'wave') A.cmd({ t: 'use', i: th }); }
  if (A.phase === 'break') {
    if (A.breakT < 3 || B.lastBreak === A.breakNo) return;
    const W = HD.WAVES[A.wave - 1];
    const lane = W ? W.rifts[0] : 'n';
    const step = NOBUILD ? null : nextBuy(h);
    if (step && h.gold >= step.cost && A.breakT > 8 && !A.nearShop(h)) { if (!h.path) A.cmd({ t: 'goto', x: A.M.shop[0] * TS, y: A.M.shop[1] * TS + 48 }); return; }
    if (!h.path && Math.hypot(h.x - MOUTH[lane].x, h.y - MOUTH[lane].y) > 48) {
      if (A.breakT > 10 && h.hp < h.hpMax && !A.inPlaza(h)) return void A.cmd({ t: 'goto', x: 30 * TS, y: 26 * TS });
      if (h.hp >= h.hpMax * 0.95) A.cmd({ t: 'goto', x: MOUTH[lane].x, y: MOUTH[lane].y });
    }
    return;
  }
  const threat = { n: 0, w: 0, e: 0, p: 0 };
  for (const f of foes) { if (f.pig) continue; const d = Math.max(64, A.gap(f, A.base)); threat[laneOf(f)] += f.hp / d; }
  threat.p *= 3;
  const lane = Object.keys(threat).sort((a, b) => threat[b] - threat[a])[0];
  const pool = foes.filter(f => threat[lane] > 0 ? laneOf(f) === lane : f.pig);
  const tgt = pool.sort((a, b) => A.gap(a, A.base) - A.gap(b, A.base))[0] || foes[0];
  if (tgt && (h.forced !== tgt.uid || B.reT-- <= 0)) { A.cmd({ t: 'attack', id: tgt.uid }); B.reT = 15; }
  const K = HD.KITS[h.key];
  for (const s of ['r', 'q', 'e']) {
    const k = K[s];
    if (!h.abil[s] || A.cdLeft(h, s) > 0 || h.en < A.costOf(h, s)) continue;
    if (k.aim === 'ally') {
      const kind = ALLY[h.key], range = k.range || 300, close = foes.some(f => Math.hypot(f.x - h.x, f.y - h.y) < 300);
      if (kind === 'heal') {
        const v = A.units.filter(x => !x.dead && x.side === 'ally' && x.hp < x.hpMax * 0.8 && A.gap(h, x) <= range).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
        if (v) A.cmd({ t: 'cast', slot: s, id: v.uid }); else if (h.key === 'bailu' && close) A.cmd({ t: 'cast', slot: s });
      } else if (kind === 'shield') {
        const hurt = foes.some(f => A.gap(f, A.base) < 120);
        if (hurt && A.gap(h, A.base) <= range) A.cmd({ t: 'cast', slot: s, id: A.base.uid }); else if (close) A.cmd({ t: 'cast', slot: s, id: h.uid });
      } else if (close) A.cmd({ t: 'cast', slot: s, id: h.uid });
      continue;
    }
    if (k.aim === 'self') {
      const c = (SELF[h.key] || {})[s] || { r: 200, n: 1 };
      if (c.heal) { if (h.hp < h.hpMax * 0.7 || A.base.hp < A.base.hpMax * 0.9) A.cmd({ t: 'cast', slot: s }); continue; }
      const around = foes.filter(f => Math.hypot(f.x - h.x, f.y - h.y) < c.r);
      if ((around.length >= c.n || around.some(f => f.elite || f.kind === 'boss')) && (!c.hp || h.hp > h.hpMax * c.hp)) A.cmd({ t: 'cast', slot: s });
      continue;
    }
    const range = (k.range || 260) + 40;
    const near = foes.filter(f => Math.hypot(f.x - h.x, f.y - h.y) < range);
    if (!near.length) continue;
    let best = null, bn = 0;
    for (const c of near) { const n = near.filter(f => Math.hypot(f.x - c.x, f.y - c.y) < 90).length + (c.elite || c.kind === 'boss' ? 3 : 0); if (n > bn) { bn = n; best = c; } }
    const single = k.aim === 'target';
    if (single ? (best.elite || best.kind === 'boss' || h.en > h.enMax * 0.6 || s === 'q') : bn >= 3 || (s === 'e' && bn >= 2)) A.cmd({ t: 'cast', slot: s, x: best.x, y: best.y, id: best.uid });
  }
}

const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const DIAG = args.diag ? {} : null;
if (DIAG) {
  const hit0 = HD.Arena.prototype.hit;
  HD.Arena.prototype.hit = function (src, tgt, o) {
    const d = hit0.call(this, src, tgt, o);
    if (src && src.side === 'foe' && tgt && tgt.side === 'ally') { const k = src.key + '>' + tgt.kind, r = DIAG[k] = DIAG[k] || { n: 0, d: 0 }; r.n++; r.d += d; }
    return d;
  };
}

function play(hero, seed) {
  const g = new H.Game({ fresh: true, seed });
  g.hdNew({ hero, diff: DIFF, seed, threats: args.threats ? args.threats.split(',') : null });
  const A = g.hdArena(), B = { reT: 0 }, out = { lvl10: 0, waveLen: [], boss: 0, steps: 0, ms: 0 };
  let ws = 0;
  const live = {};
  out.bosses = {};
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < TUN.hz * 60 * 40 && !A.over; i++) {
    if (i % 6 === 0) think(A, B);
    A.step(); out.steps++;
    for (const e of A.events) {
      if (e.t === 'wave') { ws = A.time; if (e.n === WAVES) out.lvl10 = A.hero.lvl; }
      if (e.t === 'cleared') out.waveLen.push(A.time - ws);
      if (e.t === 'cleared' && DIAG) { const r = DIAG['wave ' + String(e.n).padStart(2, '0')] = DIAG['wave ' + String(e.n).padStart(2, '0')] || { n: 0, d: 0, lvl: 0, len: 0, gold: 0 }; r.n++; r.d += A.base.hp / A.base.hpMax; r.lvl += A.hero.lvl; r.len += A.time - ws; r.gold += A.stats.gold; }
      if (e.t === 'boss') { const b = A.units.find(u => u.uid === e.uid); live[e.uid] = { key: b ? b.key : '?', t: A.time, wave: A.wave }; }
    }
    A.events.length = 0;
    if (!out.six && A.hero.items.filter(it => it && it.id === 'relic').length >= 6) out.six = A.wave;
    if (!out.c5 && A.hero.cone && H.CONES[A.hero.cone.id].rarity === 5) out.c5 = A.wave;
    for (const [uid, r] of Object.entries(live)) if (!A.units.some(u => u.uid === +uid && !u.dead)) { const won = A.wave > r.wave || A.over === 'win'; if (won || !A.over) out.bosses[r.key + (r.wave === 20 ? '@20' : '@10')] = A.time - r.t; if (r.wave === 10) out.boss = A.time - r.t; else out.boss20 = A.time - r.t; delete live[uid]; }
  }
  out.ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const sum = g.hdFinish(A);
  const rel = A.hero.items.filter(it => it && it.id === 'relic');
  out.up = rel.length ? avg(rel.map(it => 3 * (it.up || 0))) : 0;
  out.sup = A.hero.cone ? A.hero.cone.sup : 0;
  return Object.assign(out, sum, { won: A.over === 'win', timeAll: A.time });
}

const rows = [], ALL_RES = [];
for (const hero of HEROES) {
  const res = [];
  for (let r = 0; r < RUNS; r++) res.push(play(hero, 1000 + r * 37));
  ALL_RES.push(...res);
  const wins = res.filter(x => x.won);
  rows.push({
    hero, win: Math.round(100 * wins.length / res.length) + '%',
    loseWave: res.some(x => !x.won) ? avg(res.filter(x => !x.won).map(x => x.wave)).toFixed(1) : '-',
    baseWin: Math.round(100 * avg(wins.map(x => x.base / x.baseMax))) + '%',
    deaths: avg(res.map(x => x.deaths)).toFixed(1),
    lvlLast: avg(res.map(x => x.lvl10)).toFixed(1),
    lvlEnd: avg(res.map(x => x.lvl)).toFixed(1),
    waveLen: avg(res.flatMap(x => x.waveLen)).toFixed(0) + ' с',
    boss: avg(res.filter(x => x.boss).map(x => x.boss)).toFixed(0) + ' с', boss20: avg(res.filter(x => x.boss20).map(x => x.boss20)).toFixed(0) + ' с',
    gold: Math.round(avg(res.map(x => x.gold))),
    six: avg(res.filter(x => x.six).map(x => x.six)).toFixed(1), c5: avg(res.filter(x => x.c5).map(x => x.c5)).toFixed(1), up: '+' + avg(res.map(x => x.up)).toFixed(1), sup: 'S' + avg(res.map(x => x.sup)).toFixed(1),
    game: (avg(res.map(x => x.timeAll)) / 60).toFixed(1) + ' мин',
    tick: (avg(res.map(x => x.ms / x.steps)) * 1000).toFixed(0) + ' мкс'
  });
}
console.table(rows);
if (DIAG) { const B = {}; for (const x of ALL_RES) for (const [k, t] of Object.entries(x.bosses)) (B[k] = B[k] || []).push(t); console.table(Object.entries(B).map(([k, l]) => ({ boss: k, fights: l.length, sec: Math.round(avg(l)) }))); }
if (DIAG) console.table(Object.keys(DIAG).filter(k => k.startsWith('wave')).sort().map(k => { const r = DIAG[k]; return { k, runs: r.n, base: Math.round(100 * r.d / r.n) + '%', lvl: (r.lvl / r.n).toFixed(1), len: Math.round(r.len / r.n), gold: Math.round(r.gold / r.n) }; }));
if (DIAG) console.table(Object.entries(DIAG).filter(([k]) => !k.startsWith('wave')).sort((p, q) => q[1].d - p[1].d).slice(0, 30).map(([k, r]) => ({ k, hits: r.n, dmg: Math.round(r.d / RUNS) })));
