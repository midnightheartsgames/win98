const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');

const ROOT = path.join(__dirname, '..');
const MODULES = ['ki-core', 'ki-data', 'ki-places', 'ki-terrain', 'ki-flora', 'ki-detail', 'ki-weather', 'ki-edge', 'ki-body', 'ki-combat', 'ki-wounds', 'ki-missile', 'ki-senses', 'ki-move', 'ki-nav', 'ki-beasts', 'ki-ai', 'ki-econ', 'ki-caravan', 'ki-world', 'ki-elves', 'ki-guard', 'ki-villain', 'ki-save', 'ki-tex', 'ki-models', 'ki-trees', 'ki-anim'];
const WEAPONS = ['knife', 'sickle', 'sword', 'axe', 'mace', 'spear', 'bardiche'];
const ARMOR = [
  { share: 0.5, armor: [], head: null },
  { share: 0.3, armor: ['mail'], head: 'nasal' },
  { share: 0.2, armor: ['plate', 'bracers', 'greaves'], head: 'closed' }
];
const LIMIT = 60, DT = 1 / 60;

const arg = (name, fallback) => {
  const a = process.argv.find(x => x.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : fallback;
};

const loadouts = () => {
  const out = [];
  for (const w of WEAPONS) {
    out.push([w, false]);
    if (w !== 'bardiche') out.push([w, true]);
  }
  return out;
};
const label = v => v[0] + (v[1] ? '+shield' : '');

function engine() {
  for (const f of MODULES) require(path.join(ROOT, 'js/apps/kirill98', f + '.js'));
  const K = globalThis.Kirill98, B = K.Body, C = K.Combat;
  const terrain = { heightAt: () => 0, normalAt: () => [0, 1, 0], waterAt: () => -Infinity, flowAt: () => [0, 0], SIZE: 400 };
  const W = { terrain, boxes: [], ladders: [], near: () => [], groundAt: () => 0 };
  const dress = (rnd, armorMode) => {
    if (armorMode === 'none') return ARMOR[0];
    let r = rnd();
    for (const a of ARMOR) { if (r < a.share) return a; r -= a.share; }
    return ARMOR[0];
  };
  function duel(va, vb, seed, armorMode) {
    const rnd = K.rng(seed);
    const mk = (id, [weapon, shield], x, yaw, side) => {
      const kit = B.kit(side, 'm', K.rng(seed * 7 + id)), a = dress(rnd, armorMode);
      kit.armor = a.armor.slice();
      kit.head = a.head;
      kit.pros = {};
      const p = B.person(id, kit, x, 100, yaw, W);
      p.sack = [];
      p.fight = C.fighter({ weapon, shield, exp: 'soldier' });
      return p;
    };
    const a = mk(1, va, 97.8, Math.PI / 2, 'guard'), b = mk(2, vb, 102.2, -Math.PI / 2, 'villain');
    a.fight.hostile = b;
    b.fight.hostile = a;
    const S = { people: [a, b], bodies: [], parts: [], items: [], blood: [], nextId: 100, time: 0, player: null, version: 0 };
    const pose = B.restPose(), tally = { cuts: 0, eyes: 0, blocks: 0, parries: 0, kicks: 0, hits: 0 };
    while (S.time < LIMIT) {
      const r = K.AI.run(S, DT, W, rnd, pose);
      S.time += DT;
      for (const e of r.events) {
        if (e.kind === 'cut') tally.cuts++;
        else if (e.kind === 'eye') tally.eyes++;
        else if (e.kind === 'block') tally.blocks++;
        else if (e.kind === 'parry') tally.parries++;
        else if (e.kind === 'kick') tally.kicks++;
        else if (e.kind === 'hit') tally.hits++;
      }
      const end = r.results.find(x => x.kind === 'down' || x.kind === 'disarmed' || x.kind === 'crippled');
      if (end) return { t: S.time, winner: end.who === a ? 1 : 0, cause: end.kind === 'disarmed' ? 'disarmed' : end.kind === 'crippled' ? 'leg' : end.cause, tally };
    }
    return { t: LIMIT, winner: -1, cause: 'time', tally };
  }
  return { duel };
}

let fieldCache = null;
function battlefield() {
  if (fieldCache) return fieldCache;
  engine();
  const K = globalThis.Kirill98, T = K.Terrain.build(), F = K.Flora.build(T), W = K.Move.world(T, F), spots = { forest: [], field: [] };
  const trunks = (x, z, r) => { let n = 0; F.trunksNear(x, z, r, t => { if (Math.hypot(F.trees.X[t] - x, F.trees.Z[t] - z) < r) n++; }); return n; };
  for (let z = 90; z < 1450; z += 29) for (let x = 90; x < 1450; x += 31) {
    if (T.normalAt(x, z)[1] < 0.985 || T.waterAt(x, z) > T.heightAt(x, z) - 1 || W.near(x, z, 32).some(b => !String(b.id || '').startsWith('prop-'))) continue;
    const zone = T.zoneAt(x, z);
    if (zone === 3 && spots.forest.length < 16 && trunks(x, z, 14) >= 30 && trunks(x, z, 1.5) === 0) { let bush = null; for (let k = 0; k < 40 && !bush; k++) { const bx = x + (k % 7 - 3) * 1.3, bz = z + (Math.floor(k / 7) - 3) * 1.3; if (F.bushAt(bx, bz, 0.4) && trunks(bx, bz, 1.2) === 0) bush = [bx, bz]; } if (bush) spots.forest.push(bush); }
    if (zone === 1 && spots.field.length < 16 && trunks(x, z, 36) === 0) spots.field.push([x, z]);
  }
  fieldCache = { K, T, F, W, spots };
  return fieldCache;
}

function skirmish(kind, seed) {
  const { K, W, spots } = battlefield(), B = K.Body, C = K.Combat, list = spots[kind], at = list[seed % list.length], rnd = K.rng(seed);
  const a = seed * 2.39996, fx = Math.sin(a), fz = -Math.cos(a), rx = Math.cos(a), rz = Math.sin(a);
  const mk = (id, side, x, z, yaw, weapon) => {
    const kit = B.kit(side, 'm', K.rng(seed * 11 + id));
    kit.armor = [];
    kit.pros = {};
    const p = B.person(id, kit, x, z, yaw, W);
    p.sack = [];
    p.fight = C.fighter({ weapon, exp: 'soldier' });
    return p;
  };
  const archer = mk(1, 'elf', at[0], at[1], a, 'knife');
  archer.sack = [{ id: 'bow', n: 1 }, { id: 'arrow', n: 24 }];
  const men = [-1, 1].map((s, i) => mk(2 + i, 'guard', at[0] + fx * 28 + rx * 2.5 * s, at[1] + fz * 28 + rz * 2.5 * s, a + Math.PI, 'sword'));
  for (const m of men) { m.fight.hostile = archer; m.brain = K.AI.brain(); m.brain.last = [at[0] + (rnd() - 0.5) * 50, 0, at[1] + (rnd() - 0.5) * 50]; }
  archer.fight.hostile = men[0];
  archer.mv.crouch = true;
  const S = { people: [archer, ...men], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], nextId: 100, time: 0, hour: 13, player: null, version: 0 };
  const pose = B.restPose(), up = p => S.people.includes(p) && !p.fight.down && K.Wounds.caps(p.kit).stand && (!!p.fight.weapon || K.Missile.modes(p).length > 1);
  let hits = 0;
  while (S.time < 300) {
    const r = K.AI.run(S, 1 / 60, W, rnd, pose);
    S.time += 1 / 60;
    for (const e of r.events) if (e.kind === 'hit' && e.missile) hits++;
    const shots = 24 - K.Missile.count(archer, 'arrow');
    if (!up(archer)) return { win: 0, t: S.time, shots, hits };
    if (!men.some(up)) return { win: 1, t: S.time, shots, hits };
  }
  return { win: -1, t: S.time, shots: 24 - K.Missile.count(archer, 'arrow'), hits };
}

function javelins(seed) {
  engine();
  const K = globalThis.Kirill98, B = K.Body, C = K.Combat, rnd = K.rng(seed);
  const terrain = { heightAt: () => 0, normalAt: () => [0, 1, 0], waterAt: () => -Infinity, flowAt: () => [0, 0], SIZE: 400 };
  const W = { terrain, boxes: [], ladders: [], near: () => [], groundAt: () => 0 };
  const mk = (id, x, yaw, shield) => {
    const kit = B.kit('guard', 'm', K.rng(seed * 7 + id));
    kit.armor = [];
    kit.pros = {};
    const p = B.person(id, kit, x, 100, yaw, W);
    p.sack = shield ? [] : [{ id: 'javelin', n: 2 }];
    p.fight = C.fighter({ weapon: 'sword', shield, exp: 'soldier' });
    return p;
  };
  const a = mk(1, 92.5, Math.PI / 2, false), b = mk(2, 107.5, -Math.PI / 2, true);
  a.fight.hostile = b;
  b.fight.hostile = a;
  const S = { people: [a, b], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], nextId: 100, time: 0, hour: 13, player: null, version: 0 }, pose = B.restPose();
  let inShield = 0, hits = 0;
  while (S.time < 60) {
    const r = K.AI.run(S, 1 / 60, W, rnd, pose);
    S.time += 1 / 60;
    for (const e of r.events) { if (e.kind === 'block' && e.missile === 'javelin') inShield++; if (e.kind === 'hit' && e.missile === 'javelin') hits++; }
    const end = r.results.find(x => x.kind === 'down' || x.kind === 'disarmed' || x.kind === 'crippled');
    if (end) return { win: end.who === b ? 1 : 0, t: S.time, inShield, hits };
  }
  return { win: -1, t: S.time, inShield, hits };
}

const SQUAD_SIDES = { forest: ['elf', 'guard'], field: ['guard', 'villain'], yard: ['guard', 'villain'], fort: ['villain', 'elf'] };

function squadFight(place, seed, size) {
  const { K, W } = battlefield(), B = K.Body, G = K.Places.GROUNDS[place], sides = SQUAD_SIDES[place], rnd = K.rng(seed), jit = K.rng(seed * 7 + 1);
  const people = [];
  [[0, G.a, G.face], [1, G.b, G.face + Math.PI]].forEach(([t, at, yaw]) => {
    const b = K.basis(yaw, 0), back = (jit() - 0.5) * 4;
    for (let i = 0; i < (size || 5); i++) {
      const col = i % 5, row = Math.floor(i / 5), x = at[0] + b.right[0] * (col - 2) * 1.6 - b.fwd[0] * (back + row * 1.8), z = at[1] + b.right[2] * (col - 2) * 1.6 - b.fwd[2] * (back + row * 1.8);
      const p = B.member(seed * 20 + t * 10 + i, sides[t], x, z, yaw, W);
      p.anim = K.Anim.state();
      people.push(p);
    }
  });
  const S = { seed, day: 1, hour: 13, time: 0, nextId: 900000, version: 0, people, bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null };
  const pose = B.restPose(), cases = new Map(), tally = { crawl: 0, surrender: 0, knife: 0, tied: 0, carried: 0, dead: 0, ko: 0 };
  const standing = s => S.people.filter(p => p.team === s && !p.state && p.fight && !p.fight.down && K.Wounds.caps(p.kit).stand && (p.fight.weapon || K.Missile.modes(p).length > 1)).length;
  const crawled = new Set();
  let npcMin = 0, end = null;
  const free = (team, at, left) => S.people.some(q => { const d = Math.hypot(q.mv.pos[0] - at[0], q.mv.pos[2] - at[2]); const job = (q.brain && q.brain.job && q.brain.job.kind) || 'idle'; return q.team === team && !q.state && !q.fight.down && !q.fight.hostile && !q.fight.binding && !['fight', 'flee', 'crawl', 'retreat'].includes(job) && S.time - ((q.brain && q.brain.foeAt) || -99) > 2 && K.Wounds.caps(q.kit).stand && K.Wounds.caps(q.kit).bindOther && (q.sack || []).some(s => s.id === 'bandage' && s.n > 0) && d < 20 && left > d / 4.5 + K.Wounds.BIND.other + 1; });
  while (S.time < 240) {
    const r = K.AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    npcMin += S.people.filter(p => !p.fight.down).length * DT / 60;
    for (const e of r.events) {
      if (e.kind === 'surrender') tally.surrender++;
      else if (e.kind === 'knife') tally.knife++;
      else if (e.kind === 'tied') tally.tied++;
      else if (e.kind === 'healed' && e.who) tally.carried++;
      else if (e.kind === 'bound' && e.to && e.to.pts && cases.has(e.to)) cases.get(e.to).bound = true;
      else if (e.kind === 'died' && cases.has(e.body)) cases.get(e.body).died = true;
    }
    for (const x of r.results) if (x.kind === 'down') { if (x.cause === 'ko') tally.ko++; else tally.dead++; }
    for (const p of S.people) if (!K.Wounds.caps(p.kit).stand && !crawled.has(p.id)) { crawled.add(p.id); tally.crawl++; }
    for (const b of S.bodies) {
      if (!b.who || !(b.ko > 0) || b.stable) continue;
      const c = cases.get(b) || cases.set(b, { helpable: false, bound: false, died: false }).get(b);
      if (!c.helpable && free(b.who.team, K.Body.anchorOf(b), b.ko)) c.helpable = true;
    }
    if (!end) { const a = standing(sides[0]), b = standing(sides[1]); if (!a || !b) end = { t: S.time, win: a ? 0 : b ? 1 : -1 }; }
    else if (S.time > end.t + 60) break;
  }
  const helpable = [...cases.values()].filter(c => c.helpable);
  return { place, win: end ? end.win : -1, t: end ? end.t : S.time, npcMin, stuck: (S.stats || {}).stuck || 0, cases: helpable.length, helped: helpable.filter(c => c.bound).length, jailed: (S.stats || {}).jailed || 0, tally };
}

function march(seed) {
  const { K, W, spots } = battlefield(), B = K.Body, list = spots.forest, at = list[seed % list.length], nav = K.Nav.of(W);
  let a = seed * 2.39996;
  for (let k = 0; k < 8 && [-1.5, 0, 1.5].some(o => K.Nav.blocked(nav, at[0] + Math.sin(a) * 120 + Math.cos(a) * o, at[1] - Math.cos(a) * 120 + Math.sin(a) * o)); k++) a += Math.PI / 4;
  const f = [Math.sin(a), -Math.cos(a)], r = [Math.cos(a), Math.sin(a)];
  const goal = [at[0] + f[0] * 120, at[1] + f[1] * 120], side = seed % 2 ? 'guard' : 'villain', people = [];
  for (let i = 0; i < 5; i++) {
    const x = at[0] + r[0] * (i - 2) * 1.5, z = at[1] + r[1] * (i - 2) * 1.5;
    const p = B.member(seed * 10 + i, side, x, z, a, W, { kind: 'stand', post: [goal[0] + r[0] * (i - 2) * 1.5, goal[1] + r[1] * (i - 2) * 1.5], face: a });
    p.anim = K.Anim.state();
    people.push(p);
  }
  const S = { seed, day: 1, hour: 13, time: 0, nextId: 900000, version: 0, people, bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null }, pose = B.restPose(), rnd = K.rng(seed);
  const there = p => Math.hypot(p.mv.pos[0] - p.act.post[0], p.mv.pos[2] - p.act.post[1]) < 3.5;
  let done = -1;
  while (S.time < 300) {
    K.AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    if (people.every(there)) { done = S.time; break; }
  }
  return { place: 'march', arrived: people.filter(there).length, t: done, stuck: (S.stats || {}).stuck || 0, npcMin: 5 * S.time / 60 };
}

function nightWalk(variant, seed) {
  const { K, W } = battlefield(), B = K.Body, road = K.Places.ROADS.find(r => r.id === 'forest').pts, start = road[0], end = road[road.length - 1];
  const man = B.member(seed * 10 + 1, 'guard', start[0], start[1], 0, W, { kind: 'stand', post: end.slice(), face: 0 });
  man.fight = K.Combat.fighter({ weapon: 'sword', shield: variant !== 'torch', exp: 'soldier' });
  man.fight.torch = variant === 'torch';
  man.sack = [{ id: 'bandage', n: 2 }];
  man.anim = K.Anim.state();
  const S = { seed, day: 1, hour: variant === 'day' ? 13 : 23, time: 0, nextId: 900000, version: 0, people: [man], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null, focus: man.mv.pos };
  const rnd = K.rng(seed), pose = B.restPose(), hunts = new Set(), out = { variant, attacks: 0, bites: 0, kills: 0, fled: 0, bound: false, reached: false, died: false, t: 0, life: 100 };
  while (S.time < 1500) {
    S.focus = man.mv.pos;
    const r = K.AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    for (const e of r.events) {
      if (e.kind === 'hit' && e.to === man && e.who && e.who.beast === 'wolf') { out.bites++; if (!hunts.has(e.who.group)) { hunts.add(e.who.group); out.attacks++; } }
      else if (e.kind === 'kill' && e.beast && e.beast.beast === 'wolf') out.kills++;
      else if (e.kind === 'packFlees') out.fled++;
      else if (e.kind === 'bound' && e.to === man) out.bound = true;
    }
    if (!S.people.includes(man)) { out.died = true; break; }
    if (Math.hypot(man.mv.pos[0] - end[0], man.mv.pos[2] - end[1]) < 15) { out.reached = true; break; }
  }
  out.t = S.time;
  out.life = man.fight.life;
  return out;
}

function brawl(variant, seed) {
  const { K, W } = battlefield(), B = K.Body, AI = K.AI, folk = B.townsfolk(W, 600), spots = [[845, 1332], [828, 1325], [862, 1338], [880, 1320], [835, 1352]], at = spots[seed % spots.length];
  const trader = B.member(810000 + seed, 'town', at[0], at[1], 0, W, { kind: 'stand', post: at.slice(), face: 0 });
  folk.push(trader);
  const ang = (seed * 2.399) % (Math.PI * 2), x = at[0] + Math.sin(ang) * 3, z = at[1] - Math.cos(ang) * 3;
  const rough = B.member(800000 + seed, variant === 'elf' ? 'elf' : 'villain', x, z, ang + Math.PI, W, { kind: 'stand', post: [x, z], face: ang + Math.PI });
  rough.fight = K.Combat.fighter({ weapon: variant === 'elf' ? 'sickle' : 'axe', shield: false, exp: 'soldier' });
  rough.fight.hostile = trader;
  rough.sack = [{ id: 'bandage', n: 1 }];
  for (const p of [...folk, rough]) p.anim = K.Anim.state();
  const S = { seed, day: 1, hour: 12, time: 0, nextId: 900000, version: 0, people: [...folk, rough], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null, beasts: [], carcasses: [], fauna: Object.fromEntries(K.Beasts.GROUPS.map(G => [G.id, { count: 0, max: 0, lost: 0, day: 999, active: false }])), relations: {} };
  const rnd = K.rng(seed), pose = B.restPose(), out = { variant, firstHit: -1, wanted: -1, engaged: -1, most: 0, end: 'none', t: 0, traderHurt: 0, traderDown: false, watchDown: 0, stuck: 0 };
  const watch = folk.filter(p => p.role === 'watch');
  while (S.time < 120) {
    const r = AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    for (const e of r.events) {
      if (e.kind === 'hit' && e.who === rough && out.firstHit < 0) out.firstHit = S.time;
      if (e.kind === 'offense' && e.who === rough && out.wanted < 0) out.wanted = S.time;
    }
    const on = watch.filter(w => S.people.includes(w) && w.fight.hostile === rough).length;
    if (on && out.engaged < 0) out.engaged = S.time;
    out.most = Math.max(out.most, on);
    if (!S.people.includes(rough)) { out.end = 'down'; break; }
    if (rough.state) { out.end = 'surrender'; break; }
    if (!K.Places.inTown(rough.mv.pos[0], rough.mv.pos[2])) { out.end = 'fled'; break; }
  }
  out.t = S.time;
  out.traderHurt = 100 - (S.people.includes(trader) ? trader.fight.life : 0);
  out.traderDown = !S.people.includes(trader);
  out.watchDown = watch.filter(w => !S.people.includes(w)).length;
  out.stuck = (S.stats && S.stats.stuck) || 0;
  return out;
}

function warRun(seed) {
  const { K, W } = battlefield(), Wo = K.World, S = { day: 1, hour: 6, time: 0, nextId: 5000, people: [], beasts: [], bodies: [], relations: {} }, rnd = K.rng(seed * 31), out = { seed, gone: null, outpost: null };
  K.Caravan.init(S, rnd);
  Wo.state(S);
  const snap = () => { const E = S.world; return { elf: E.sides.elf.people, guard: E.sides.guard.men, villain: E.sides.villain.men, houses: E.sides.elf.houses, posts: Object.fromEntries(['guard', 'elf', 'villain'].map(s => [s, Object.values(E.posts).filter(p => p.side === s).length])) }; };
  out.start = snap();
  for (let t = 0; t < 60 * 24 * 80; t += 4) {
    S.hour += 4 / 80;
    if (S.hour >= 24) { S.hour -= 24; S.day++; }
    S.time += 4;
    const ev = K.Caravan.run(S, 4, W, rnd);
    ev.push(...Wo.run(S, 4, W, rnd));
    Wo.react(S, ev);
    const a = Wo.alive(S);
    for (const k of Object.keys(a)) if (!a[k] && !out.gone) out.gone = [k, S.day];
    if (!out.outpost && S.world.posts.outpost.side === 'villain') out.outpost = S.day;
    if (!out.day3 && S.day === 4) out.day3 = snap();
  }
  const E = S.world;
  return Object.assign(out, { assault: E.assault ? E.assault.day : null, result: E.assault ? E.assault.result : null, korni: E.raidsOn.korni || 0, battles: E.stats.battles, dead: E.stats.dead, houses: E.sides.elf.houses, elves: E.sides.elf.people, guard: E.sides.guard.men, villain: E.sides.villain.men, lost: S.caravans.stats.lost, robbedOre: (S.caravans.stats.lost.ore || 0) + (S.caravans.stats.lost.bread || 0) });
}

function war() {
  const per = Math.max(1, +arg('n', 50)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  const seeds = Array.from({ length: per }, (v, i) => i + 1);
  for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'war', seeds: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), n = rows.length, pc = x => (x * 100).toFixed(1) + ' %', hist = (list, step) => { const h = {}; for (const v of list) { const k = v === null ? 'нет' : Math.floor(v / step) * step; h[k] = (h[k] || 0) + 1; } return h; }, avg = f => rows.reduce((s, x) => s + f(x), 0) / n;
    const days = rows.map(r => r.assault).filter(d => d !== null).sort((a, b) => a - b), raids = rows.map(r => r.korni).sort((a, b) => a - b);
    const res = { mode: 'war', n, seconds: Math.round((Date.now() - t0) / 100) / 10, assault: { min: days[0], median: days[Math.floor(days.length / 2)], max: days[days.length - 1], hist: hist(rows.map(r => r.assault), 5), taken: rows.filter(r => r.result === 'taken').length / n }, korni: { min: raids[0], median: raids[Math.floor(n / 2)], max: raids[n - 1], hist: hist(raids, 1) }, gone: rows.filter(r => r.gone).map(r => r.gone), early: rows.filter(r => r.gone && r.gone[1] < 20).length, outpost: { taken: rows.filter(r => r.outpost).length / n, day8: rows.filter(r => r.outpost === 8 || r.outpost === 9).length / n }, battles: avg(r => r.battles), dead: { guard: avg(r => r.dead.guard), elf: avg(r => r.dead.elf), villain: avg(r => r.dead.villain) }, end: { guard: avg(r => r.guard), elves: avg(r => r.elves), villain: avg(r => r.villain), houses: avg(r => r.houses) }, lostOre: avg(r => r.robbedOre) };
    console.log(`${n} worlds of 60 days without the hero in ${res.seconds} s`);
    const keep = s => Math.min(...rows.map(r => r.day3[s] / Math.max(1, r.start[s])));
    res.day3 = { elf: keep('elf'), guard: keep('guard'), villain: keep('villain'), houses: Math.min(...rows.map(r => r.day3.houses)), posts: Object.fromEntries(['guard', 'elf', 'villain'].map(s => [s, Math.min(...rows.map(r => r.day3.posts[s]))])) };
    console.log(`after 3 days at worst: elves keep ${pc(res.day3.elf)} of people and ${res.day3.houses} houses, guards ${pc(res.day3.guard)}, villain ${pc(res.day3.villain)}; posts held at least ${JSON.stringify(res.day3.posts)}`);
    console.log(`storm of the palace: day ${res.assault.min}–${res.assault.max}, median ${res.assault.median}; palace falls in ${pc(res.assault.taken)}; by 5 days ${JSON.stringify(res.assault.hist)}`);
    console.log(`raids on Корни: ${res.korni.min}–${res.korni.max}, median ${res.korni.median}; ${JSON.stringify(res.korni.hist)}`);
    console.log(`the outpost falls to the villain in ${pc(res.outpost.taken)} of worlds, on day 8–9 in ${pc(res.outpost.day8)}; ore and bread caravans lost to elf ambushes ${res.lostOre.toFixed(1)} per world`);
    console.log(`battles ${res.battles.toFixed(1)} per world; dead: guard ${res.dead.guard.toFixed(1)}, elves ${res.dead.elf.toFixed(1)}, villain ${res.dead.villain.toFixed(1)}; at day 60: guards ${res.end.guard.toFixed(0)}, elves ${res.end.elves.toFixed(0)} with ${res.end.houses.toFixed(1)} houses, villain ${res.end.villain.toFixed(0)}; a side gone before day 20 in ${res.early} worlds`);
    res.pass = res.early === 0 && res.day3.elf >= 0.6 && res.day3.guard >= 0.6 && res.day3.villain >= 0.6 && res.day3.houses >= 10 && res.assault.min >= 25 && res.assault.max <= 45 && days.length === n && res.korni.min >= 6 && res.korni.max <= 12;
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: no side gone before day 20 or below 60 % of its people after 3 days, storm on day 25–45, Корни raided 6–12 times`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function campaignRun(seed) {
  const { K, W } = battlefield(), S = { seed: 9, day: 1, hour: 6, time: 0, nextId: 30000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], beasts: [], relations: {}, player: null, squad: null, standing: { service: 0, respect: 0, loyalty: 0 }, campaign: { side: 'elf' } }, rnd = K.rng(seed * 31);
  K.Caravan.init(S, rnd);
  K.World.state(S);
  S.T = W.terrain;
  while (S.day <= 60 && !S.campaign.ending) K.World.skip(S, W, 6, rnd);
  const C = S.campaign, F = C.finales || {};
  return { seed, ending: C.ending ? C.ending.id : null, day: C.ending ? C.ending.day : null, fire: !!F.fire, logs: !!F.logs, ambushed: !!(F.logs && F.logs.ambushed), assault: S.world.assault ? S.world.assault.result : null, houses: K.Elves.intact(S), people: S.world.sides.elf.people, oak: S.village.oak.length, part: C.part || null };
}

function campaign() {
  const per = Math.max(1, +arg('n', 20)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  const seeds = Array.from({ length: per }, (v, i) => i + 1);
  for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'campaign', seeds: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat().sort((a, b) => a.seed - b.seed), n = rows.length, count = f => rows.filter(f).length, avg = f => rows.reduce((s, x) => s + f(x), 0) / n, days = rows.map(r => r.day).filter(Boolean).sort((a, b) => a - b);
    const ends = {};
    for (const r of rows) ends[r.ending || 'нет'] = (ends[r.ending || 'нет'] || 0) + 1;
    const res = { mode: 'campaign', n, seconds: Math.round((Date.now() - t0) / 100) / 10, finished: count(r => r.ending), ends, day: { min: days[0], median: days[Math.floor(days.length / 2)], max: days[days.length - 1] }, fire: count(r => r.fire), logs: count(r => r.logs), ambushed: count(r => r.ambushed), houses: avg(r => r.houses), people: avg(r => r.people), oak: avg(r => r.oak), rows };
    console.log(`${n} worlds of the elf campaign without the hero in ${res.seconds} s`);
    console.log(`finale reached in ${res.finished} of ${n}: day ${res.day.min}–${res.day.max}, median ${res.day.median}; endings ${JSON.stringify(ends)}`);
    console.log(`finale «Огонь» in ${res.fire} worlds, «Брёвна» in ${res.logs} (partisans met the army in ${res.ambushed}); at the end ${res.houses.toFixed(1)} houses, ${res.people.toFixed(1)} elves, ${res.oak.toFixed(1)} names on the oak`);
    res.pass = res.finished === n;
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: the campaign reaches its finale in every world`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function introRun(seed) {
  const { K, W } = battlefield(), L = K.Elves, AI = K.AI, KO = K.Places.KORNI, Cv = K.Caravan;
  const S = K.Save.start(W, { side: 'elf', hero: seed % 2 ? 'elf.f' : 'elf.m' }), P = S.player, rnd = K.rng(seed * 17 + 3), pose = K.Body.restPose(), nav = K.Nav.of(W);
  P.anim = K.Anim.state();
  P.frames = new Float32Array(132);
  const log = [{ step: L.introStep(S), t: 0 }], got = {};
  let path = null, stuck = 0, last = [0, 0, 0], spot = null, fellAt = null;
  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const go = (to, reach) => {
    const at = [P.mv.pos[0], P.mv.pos[2]];
    if (Math.hypot(to[0] - at[0], to[1] - at[1]) < (reach || 1.5)) { path = null; return null; }
    if (!path || Math.hypot(path.to[0] - to[0], path.to[1] - to[1]) > 1 || stuck > 2) { const r = K.Nav.route(nav, at, to, { side: 'elf' }); path = { to: to.slice(), pts: (r && r.pts && r.pts.length ? r.pts : []).concat([to.slice()]), i: 0, at: S.time }; }
    while (path.i < path.pts.length - 1 && Math.hypot(path.pts[path.i][0] - at[0], path.pts[path.i][1] - at[1]) < 1.2) path.i++;
    if (stuck > 2) stuck = 0;
    const q = path.pts[path.i];
    return { fwd: 1, side: 0, yaw: Math.atan2(q[0] - at[0], -(q[1] - at[1])), sprint: true, jump: stuck > 0.6 };
  };
  const nearest = list => list.filter(q => q && q.fight && !q.fight.down && !q.state).sort((a, b) => flat(a.mv.pos, P.mv.pos) - flat(b.mv.pos, P.mv.pos))[0] || null;
  const fight = foe => { P.fight.hostile = foe; const inp = AI.engage(P, DT, rnd, S, W); return inp || go([foe.mv.pos[0], foe.mv.pos[2]], 1.5) || { fwd: 0, side: 0, yaw: P.mv.yaw }; };
  const byName = n => S.people.find(q => q.villager !== undefined && q.name === n);
  while (S.time < 1800 && L.introStep(S) !== 'free') {
    const st = L.introStep(S), I = S.campaign.intro, F = P.fight;
    let inp = { fwd: 0, side: 0, yaw: P.mv.yaw };
    if (F.down) break;
    if (K.Wounds.bleeding(F) && !F.binding && !F.hostile && P.bag.some(s => s.id === 'bandage' && s.n > 0)) K.Wounds.bind(P, P, P.bag);
    if (st !== 'bow' && st !== 'sickle' && st !== 'ambush' && st !== 'smoke' && F.mode !== 'melee') K.Missile.setMode(P, 'melee');
    if (st !== 'bow' && st !== 'sickle' && !P.fight.hostile) { P.mv.crouch = false; P.mv.walk = false; }
    if (st === 'wake') L.talked(S, 'leader', []);
    else if (st === 'bow') {
      const line = KO.training.line, tgt = S.people.filter(q => q.introStraw === 'target')[1];
      inp = go(line, 1.2) || (tgt ? (P.fight.hostile = tgt, AI.engage(P, DT, rnd, S, W)) : null) || inp;
      if (tgt && !K.Missile.ranged(F)) K.Missile.setMode(P, 'bow');
    } else if (st === 'sickle') {
      const d = S.people.find(q => q.introStraw === 'dummy');
      if (F.mode !== 'melee') K.Missile.setMode(P, 'melee');
      inp = d ? (flat(d.mv.pos, P.mv.pos) > 1.8 ? go([d.mv.pos[0], d.mv.pos[2]], 1.4) : (P.fight.hostile = d, AI.think(P, DT, rnd))) || inp : inp;
    } else if (st === 'road' || st === 'fell') {
      P.fight.hostile = null;
      spot = spot || Cv.sawnSpots().slice().sort((a, b) => Math.hypot(a.at[0] - 642, a.at[1] - 715) - Math.hypot(b.at[0] - 642, b.at[1] - 715))[0];
      inp = go([spot.at[0] - spot.fall[0] * 1.5, spot.at[1] - spot.fall[1] * 1.5], 1.5) || inp;
      if (st === 'fell') {
        const c = Cv.byId(S, I.caravan), line = Cv.routes().bread.line, s = K.Terrain.nearest(line, spot.at[0], spot.at[1]).s;
        if (c && s - c.s < 70 && fellAt === null && flat(P.mv.pos, [spot.at[0], 0, spot.at[1]]) < 4) { fellAt = S.time; }
        if (fellAt !== null && S.time - fellAt > 3 && !got.fell) { got.fell = Cv.fell(S, spot.id) || true; }
      }
    } else if (st === 'ambush') {
      const c = Cv.byId(S, I.caravan), foe = c ? nearest(Cv.crewOf(S, c).filter(q => q.role === 'escort')) : null;
      if (foe) inp = fight(foe); else if (c && c.carts[0].pos) inp = go([c.carts[0].pos[0], c.carts[0].pos[2]], 3) || inp;
    } else if (st === 'carry') {
      P.fight.hostile = null;
      const c = Cv.byId(S, I.caravan), load = Cv.cargoKg(P.bag);
      if (load > 0) { inp = go([KO.store.at[0], KO.store.at[1] - 2], 3) || inp; if (flat(P.mv.pos, [345, 0, 688]) < 5.5) Cv.deposit(S, P); }
      else if (c && c.carts[0].pos && c.carts[0].bales.length) {
        inp = go([c.carts[0].pos[0], c.carts[0].pos[2]], 2.2) || inp;
        if (flat(P.mv.pos, c.carts[0].pos) < 2.6) { Cv.take(S, P, c, 0, c.carts[0].bales[0]); Cv.friendsCarry(S, P, c, 0); }
      }
    } else if (st === 'smoke') {
      const foe = nearest((I.patrol || []).map(id => S.people.find(q => q.id === id)));
      if (foe) inp = fight(foe);
    } else if (st === 'fire') {
      P.fight.hostile = null;
      const o = K.Places.town(W.terrain), h = o.doors['izba-moh'];
      if (P.bucket !== 'full') { const w = o.wells[1]; inp = go(w.at, 1.4) || inp; if (Math.hypot(w.at[0] - P.mv.pos[0], w.at[1] - P.mv.pos[2]) < 1.8) P.bucket = 'full'; }
      else { inp = go(h.at, 1.8) || inp; if (Math.hypot(h.at[0] - P.mv.pos[0], h.at[1] - P.mv.pos[2]) < 2.4) { L.pour(S, 'izba-moh', L.POUR); P.bucket = 'empty'; got.pours = (got.pours || 0) + 1; } }
    } else if (st === 'moh') {
      const m = byName('Мох');
      if (m) { inp = go([m.mv.pos[0], m.mv.pos[2]], 1.2) || inp; if (flat(m.mv.pos, P.mv.pos) < 1.6 && !F.binding) K.Wounds.bind(P, m, P.bag); }
    } else if (st === 'elders') { L.talked(S, 'healer', []); L.talked(S, 'carver', []); }
    else if (st === 'council') L.talked(S, 'elder', []);
    if (inp.yaw === undefined) inp.yaw = P.mv.yaw;
    F.aim = F.aim && st === 'bow' ? F.aim : AI.idleAim(P);
    K.Move.step(P.mv, inp, DT, W);
    K.Anim.update(P.anim, P.mv, DT);
    AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    S.hour = (S.hour + DT / 80) % 24;
    stuck = flat(P.mv.pos, last) < DT * 0.5 && inp.fwd ? stuck + DT : 0;
    last = P.mv.pos.slice();
    const now = L.introStep(S);
    if (now !== log[log.length - 1].step) log.push({ step: now, t: Math.round(S.time) });
    if (process.env.KI_TRACE && Math.floor(S.time / 20) !== Math.floor((S.time - DT) / 20)) console.log(Math.round(S.time), now, P.mv.pos.map(v => v.toFixed(1)).join(','), JSON.stringify(inp), P.fight.hostile ? 'hostile' : '', P.fight.act ? P.fight.act.kind : '', P.mv.hold || 0);
  }
  const order = log.map(x => x.step);
  return { seed, done: L.introStep(S) === 'free', t: Math.round(S.time), log, inOrder: order.every((s, i) => i === 0 || L.INTRO.indexOf(s) > L.INTRO.indexOf(order[i - 1])), down: !!P.fight.down, pours: got.pours || 0, respect: S.standing.respect };
}

function guardRun(seed) {
  const { K, W } = battlefield(), Gd = K.Guard, AI = K.AI, PP = K.Places.PALACE_PTS, Cv = K.Caravan;
  const S = K.Save.start(W, { side: 'guard', hero: seed % 2 ? 'guard.f' : 'guard.m' }), P = S.player, rnd = K.rng(seed * 19 + 5), pose = K.Body.restPose(), nav = K.Nav.of(W);
  P.anim = K.Anim.state();
  P.frames = new Float32Array(132);
  const log = [{ step: Gd.introStep(S), t: 0 }], got = { held: 0, passed: 0, spies: 0, blocks: 0 }, help = seed % 2 === 0;
  let path = null, stuck = 0, last = [0, 0, 0];
  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const go = (to, reach) => {
    const at = [P.mv.pos[0], P.mv.pos[2]];
    if (Math.hypot(to[0] - at[0], to[1] - at[1]) < (reach || 1.5)) { path = null; return null; }
    const exit = path && path.exit && path.i < path.pts.length;
    if (exit && Math.hypot(path.pts[path.i][0] - at[0], path.pts[path.i][1] - at[1]) < 1) path.i++;
    if (exit && path.i < path.pts.length) { const q = path.pts[path.i]; return { fwd: 1, side: 0, yaw: Math.atan2(q[0] - at[0], -(q[1] - at[1])), sprint: false, jump: stuck > 0.6 }; }
    if (!path || path.exit || Math.hypot(path.to[0] - to[0], path.to[1] - to[1]) > 1 || stuck > 2) {
      const r = K.Nav.route(nav, at, to, { side: 'guard' }), doors = Object.values(K.Places.town(W.terrain).doors), d = doors.sort((a, b) => Math.hypot(a.inside[0] - at[0], a.inside[1] - at[1]) - Math.hypot(b.inside[0] - at[0], b.inside[1] - at[1]))[0];
      if (!(r && r.ok) && d && Math.hypot(d.inside[0] - at[0], d.inside[1] - at[1]) < 20) { const o = [d.at[0] - Math.sin(d.face) * 3, d.at[1] + Math.cos(d.face) * 3]; path = { to: to.slice(), pts: [d.inside.slice(), d.at.slice(), o], i: 0, exit: true }; stuck = 0; return go(to, reach); }
      path = { to: to.slice(), pts: (r && r.pts || []).concat([to.slice()]), i: 0 };
    }
    while (path.i < path.pts.length - 1 && Math.hypot(path.pts[path.i][0] - at[0], path.pts[path.i][1] - at[1]) < 1.2) path.i++;
    if (stuck > 2) stuck = 0;
    const q = path.pts[path.i];
    return { fwd: 1, side: 0, yaw: Math.atan2(q[0] - at[0], -(q[1] - at[1])), sprint: Math.hypot(to[0] - at[0], to[1] - at[1]) > 6, jump: stuck > 0.6 };
  };
  const nearest = list => list.filter(q => q && q.fight && !q.fight.down && !q.state).sort((a, b) => flat(a.mv.pos, P.mv.pos) - flat(b.mv.pos, P.mv.pos))[0] || null;
  const fight = foe => { P.fight.hostile = foe; const inp = AI.engage(P, DT, rnd, S, W); return inp || go([foe.mv.pos[0], foe.mv.pos[2]], 1.5) || { fwd: 0, side: 0, yaw: P.mv.yaw }; };
  const byName = n => S.people.find(q => q.guardman !== undefined && q.name === n);
  while (S.time < 1800 && Gd.introStep(S) !== 'free') {
    const st = Gd.introStep(S), I = S.campaign.intro, F = P.fight;
    let inp = { fwd: 0, side: 0, yaw: P.mv.yaw };
    if (F.down) break;
    if (K.Wounds.bleeding(F) && !F.binding && !F.hostile && P.bag.some(s => s.id === 'bandage' && s.n > 0)) K.Wounds.bind(P, P, P.bag);
    if (st !== 'drill' && st !== 'ambush') P.fight.hostile = null;
    if (st === 'muster') inp = go(PP.line[PP.hero], 0.8) || inp;
    else if (st === 'gate') {
      inp = go([PP.gate[0] - 1, PP.gate[1]], 1.5) || inp;
      const q = S.people.find(x => x.visitor && x.visitor.state === 'queue' && flat(x.mv.pos, P.mv.pos) < 6);
      if (q) { const ev = [], spy = q.visitor.signs.length > 0; Gd.decide(S, q, spy ? 'hold' : 'pass', ev); Gd.post(S, ev, W, rnd); if (spy) { got.held++; if (q.visitor.spy) got.spies++; } else got.passed++; }
    } else if (st === 'drill') {
      const d = S.people.find(q => q.drillStraw), sg = S.people.find(q => q.trainer);
      if (!I.cut && d) inp = flat(d.mv.pos, P.mv.pos) > 1.8 ? go([d.mv.pos[0], d.mv.pos[2]], 1.4) || inp : (P.fight.hostile = d, AI.think(P, DT, rnd)) || inp;
      else if (sg) inp = fight(sg);
    } else if (st === 'escort') {
      const c = I.caravan && Cv.byId(S, I.caravan);
      if (!c) inp = go([905, 1255], 30) || inp;
      else if (c.carts[0].pos) inp = go([c.carts[0].pos[0], c.carts[0].pos[2]], 6) || inp;
    } else if (st === 'ambush') {
      const ga = S.bodies.find(b => b.who && b.who.name === 'Гаврила' && b.ko > 0 && !b.stable), foe = nearest((I.archers || []).map(id => S.people.find(q => q.id === id)));
      if (help && !I.helped && ga) { P.fight.hostile = null; const at = K.Body.anchorOf(ga); inp = go([at[0], at[2]], 1.2) || inp; if (flat(at, P.mv.pos) < 1.6 && !F.binding) K.Wounds.bind(P, ga, P.bag); }
      else if (foe) inp = fight(foe);
    } else if (st === 'report') {
      const c = byName('Гордей Строгов');
      if (c && !c.fight.down) { inp = go([c.mv.pos[0], c.mv.pos[2]], 2) || inp; if (flat(c.mv.pos, P.mv.pos) < 2.5) Gd.talked(S, 'commander', []); }
      else inp = go(PP.commander, 6) || inp;
    }
    if (inp.yaw === undefined) inp.yaw = P.mv.yaw;
    F.aim = AI.idleAim(P);
    K.Move.step(P.mv, inp, DT, W);
    K.Anim.update(P.anim, P.mv, DT);
    const r = AI.run(S, DT, W, rnd, pose);
    for (const e of r.events) if ((e.kind === 'block' || e.kind === 'parry') && e.to === P && e.who && e.who.trainer) got.blocks++;
    S.time += DT;
    S.hour = (S.hour + DT / 80) % 24;
    stuck = flat(P.mv.pos, last) < DT * 0.5 && inp.fwd ? stuck + DT : 0;
    last = P.mv.pos.slice();
    const now = Gd.introStep(S);
    if (now !== log[log.length - 1].step) log.push({ step: now, t: Math.round(S.time) });
    if (process.env.KI_TRACE && Math.floor(S.time / 20) !== Math.floor((S.time - DT) / 20)) console.log(Math.round(S.time), now, P.mv.pos.map(v => v.toFixed(1)).join(','), JSON.stringify(inp), P.fight.hostile ? 'hostile' : '', P.fight.life.toFixed(0), S.standing.service);
  }
  const order = log.map(x => x.step), done = Gd.introStep(S) === 'free', t = Math.round(S.time), day2 = done && !P.fight.down ? serviceDay(K, W, S, P, rnd, pose, go, () => { stuck = 0; path = null; }) : null;
  return { seed, done, t, log, inOrder: order.every((s, i) => i === 0 || Gd.INTRO.indexOf(s) > Gd.INTRO.indexOf(order[i - 1])), down: !!P.fight.down, service: S.standing.service, gavrila: S.campaign.gavrila || null, help, got, day2 };
}

function serviceDay(K, W, S, P, rnd, pose, go, reset) {
  const Gd = K.Guard, AI = K.AI, PP = K.Places.PALACE_PTS, G = Gd.state(S), sv0 = S.standing.service;
  K.World.skip(S, W, ((24 - S.hour) + 6.7) % 24, rnd);
  const t0 = S.time;
  P.mv = K.Move.body(W, PP.line[PP.hero][0] + 3, PP.line[PP.hero][1] + 4, Math.PI);
  reset();
  let muster = null, o = null, last = P.mv.pos.slice(), stuck = 0;
  while (S.time - t0 < 1500) {
    o = G.order;
    let inp = { fwd: 0, side: 0, yaw: P.mv.yaw };
    if (P.fight.down) break;
    if (!muster) inp = go(PP.line[PP.hero], 0.8) || inp;
    else if (o && o.state === 'given') {
      if (o.pts) inp = go(o.pts[o.i], 8) || inp;
      else if (o.at) inp = go(o.at, o.kind === 'duty' ? 3 : 4) || inp;
      const q = S.people.find(x => x.visitor && x.visitor.state === 'queue' && Math.hypot(x.mv.pos[0] - P.mv.pos[0], x.mv.pos[2] - P.mv.pos[2]) < 6);
      if (q) { const ev = []; Gd.decide(S, q, q.visitor.signs.length ? 'hold' : 'pass', ev); Gd.post(S, ev, W, rnd); }
    } else break;
    P.fight.aim = AI.idleAim(P);
    K.Move.step(P.mv, inp, DT, W);
    K.Anim.update(P.anim, P.mv, DT);
    const r = AI.run(S, DT, W, rnd, pose);
    for (const e of r.events) if (e.kind === 'muster') muster = { late: e.late, pay: e.pay, order: e.order && e.order.kind };
    S.time += DT;
    S.hour = (S.hour + DT / 80) % 24;
    stuck = Math.hypot(P.mv.pos[0] - last[0], P.mv.pos[2] - last[2]) < DT * 0.5 && inp.fwd ? stuck + DT : 0;
    if (stuck > 2) reset();
    last = P.mv.pos.slice();
  }
  return { day: S.day, muster, order: o ? o.kind : null, state: o ? o.state : null, minutes: Math.round((S.time - t0) / 6) / 10, service: Math.round((S.standing.service - sv0) * 10) / 10 };
}

function villainRun(seed) {
  const { K, W } = battlefield(), Vi = K.Villain, AI = K.AI, FP = K.Places.FORT_PTS, Cv = K.Caravan;
  const S = K.Save.start(W, { side: 'villain', name: 'Бот' + seed }), P = S.player, rnd = K.rng(seed * 23 + 7), pose = K.Body.restPose(), nav = K.Nav.of(W);
  P.anim = K.Anim.state();
  P.frames = new Float32Array(132);
  const log = [{ step: Vi.introStep(S), t: 0 }], give = seed % 2 === 1, got = { cut: 0 };
  let path = null, stuck = 0, last = [0, 0, 0];
  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const go = (to, reach) => {
    const at = [P.mv.pos[0], P.mv.pos[2]];
    if (Math.hypot(to[0] - at[0], to[1] - at[1]) < (reach || 1.5)) { path = null; return null; }
    const exit = path && path.exit && path.i < path.pts.length;
    if (exit && Math.hypot(path.pts[path.i][0] - at[0], path.pts[path.i][1] - at[1]) < 1) path.i++;
    if (exit && path.i < path.pts.length) { const q = path.pts[path.i]; return { fwd: 1, side: 0, yaw: Math.atan2(q[0] - at[0], -(q[1] - at[1])), sprint: false, jump: stuck > 0.6 }; }
    if (!path || path.exit || Math.hypot(path.to[0] - to[0], path.to[1] - to[1]) > 1 || stuck > 2) {
      const r = K.Nav.route(nav, at, to, { side: 'villain' }), doors = Object.values(K.Places.town(W.terrain).doors), d = doors.sort((a, b) => Math.hypot(a.inside[0] - at[0], a.inside[1] - at[1]) - Math.hypot(b.inside[0] - at[0], b.inside[1] - at[1]))[0];
      if (!(r && r.ok) && d && Math.hypot(d.inside[0] - at[0], d.inside[1] - at[1]) < 20) {
        const o = [d.at[0] - Math.sin(d.face) * 3, d.at[1] + Math.cos(d.face) * 3], inside = Math.hypot(d.inside[0] - at[0], d.inside[1] - at[1]) < Math.hypot(o[0] - at[0], o[1] - at[1]);
        path = { to: to.slice(), pts: inside ? [d.inside.slice(), d.at.slice(), o] : [o, d.at.slice(), d.inside.slice()], i: 0, exit: true };
        stuck = 0;
        return go(to, reach);
      }
      path = { to: to.slice(), pts: (r && r.pts || []).concat([to.slice()]), i: 0 };
    }
    while (path.i < path.pts.length - 1 && Math.hypot(path.pts[path.i][0] - at[0], path.pts[path.i][1] - at[1]) < 1.2) path.i++;
    if (stuck > 2) stuck = 0;
    const q = path.pts[path.i];
    return { fwd: 1, side: 0, yaw: Math.atan2(q[0] - at[0], -(q[1] - at[1])), sprint: Math.hypot(to[0] - at[0], to[1] - at[1]) > 6, jump: stuck > 0.6 };
  };
  const nearest = list => list.filter(q => q && q.fight && !q.fight.down && !q.state).sort((a, b) => flat(a.mv.pos, P.mv.pos) - flat(b.mv.pos, P.mv.pos))[0] || null;
  const fight = foe => { P.fight.hostile = foe; const inp = AI.engage(P, DT, rnd, S, W); return inp || go([foe.mv.pos[0], foe.mv.pos[2]], 1.5) || { fwd: 0, side: 0, yaw: P.mv.yaw }; };
  let skipped = 0;
  const events = list => { for (const e of list) if (e.kind === 'skip') { const t0 = S.time; K.Econ.pass(S, ((e.to - S.hour) % 24 + 24) % 24, { W, rnd }); skipped += S.time - t0; } };
  while (S.time - skipped < 2400 && Vi.introStep(S) !== 'free') {
    const st = Vi.introStep(S), I = S.campaign.intro, F = P.fight;
    let inp = { fwd: 0, side: 0, yaw: P.mv.yaw };
    if (F.down) break;
    const close = S.people.some(q => q.fight && !q.fight.down && q.fight.hostile === P && flat(q.mv.pos, P.mv.pos) < 5);
    if (K.Wounds.bleeding(F) && !F.binding && !close && P.bag.some(s => s.id === 'bandage' && s.n > 0)) { P.fight.hostile = null; K.Wounds.bind(P, P, P.bag); }
    if (F.binding) { K.Move.step(P.mv, { fwd: 0, side: 0, yaw: P.mv.yaw }, DT, W); K.Anim.update(P.anim, P.mv, DT); events(AI.run(S, DT, W, rnd, pose).events); S.time += DT; S.hour = (S.hour + DT / 80) % 24; continue; }
    if (st !== 'loot' && st !== 'night') P.fight.hostile = null;
    if (st === 'hall') { const g = S.people.find(q => q.role === 'scribe'); if (g) { inp = go([g.mv.pos[0], g.mv.pos[2]], 2) || inp; if (flat(g.mv.pos, P.mv.pos) < 2.5) { const ev = []; Vi.talked(S, 'scribe', ev); events(ev); } } }
    else if (st === 'yard') { inp = go(FP.hero, 1.2) || inp; const hv = S.people.find(q => q.soldier === Vi.KEY.length); if (I.asked && hv && flat(hv.mv.pos, P.mv.pos) < 4) Vi.hvosh(S, give, []); }
    else if (st === 'drill') {
      const d = S.people.find(q => q.drillStraw), c = I.cmds || {};
      if (I.squad && !c.follow) AI.order(S, 'follow');
      else if (c.follow && !c.hold) { if (flat(P.mv.pos, [975, 0, 106]) > 3) inp = go([975, 106], 2) || inp; else AI.order(S, 'hold'); }
      else if (c.hold && !c.attack && d) AI.order(S, 'attack', d);
    } else if (st === 'table') {
      const z = P.mv.pos[2], x = P.mv.pos[0];
      if (z > 94.6 && Math.abs(x - 962) > 0.3) inp = go([962, 96.2], 0.25) || inp;
      else if (z > 92.4) inp = { fwd: 1, side: 0, yaw: Math.atan2(962 - x, -(91 - z)), sprint: false };
      else inp = go([962, 89.8], 0.35) || inp;
      if (flat2(P.mv.pos, FP.table) < 2.8) Vi.startSortie(S, W);
    }
    else if (st === 'sortie' || st === 'home') {
      const foe = nearest(S.people.filter(q => q.fight && q.fight.hostile === P && flat(q.mv.pos, P.mv.pos) < 16));
      if (foe) inp = fight(foe);
      else if (st === 'sortie') inp = go(FP.sortie[Math.min(FP.sortie.length - 1, I.way || 0)], 6) || inp;
      else { const w = FP.sortie[Math.max(0, I.back === undefined ? (I.back = FP.sortie.length - 1) : I.back)]; if (flat2(P.mv.pos, w) < 22 && I.back > 0) I.back--; inp = go(I.back > 0 ? w : FP.yard, 6) || inp; }
    }
    else if (st === 'loot') { const c = Cv.byId(S, I.caravan), foe = nearest(S.people.filter(q => q.fight && q.fight.hostile === P && flat(q.mv.pos, P.mv.pos) < 3.5)) || (c && !c.live ? nearest(Cv.crewOf(S, c).filter(q => q.role === 'escort')) : null); if (foe) inp = fight(foe); else if (c && c.carts[0].pos) inp = go([c.carts[0].pos[0], c.carts[0].pos[2]], 3) || inp; }
    else if (st === 'night') {
      const sab = nearest(S.people.filter(q => q.saboteur));
      if (sab && sab.saboteur.run && flat2(sab.mv.pos, FP.rope) < 4 && flat2(P.mv.pos, FP.rope) < 2.6) { got.cut += Vi.cutRope(S, []); }
      else if (sab && sab.saboteur.run) inp = go(FP.rope, 1.5) || inp;
      else if (sab) inp = fight(sab);
    }
    if (inp.yaw === undefined) inp.yaw = P.mv.yaw;
    F.aim = AI.idleAim(P);
    K.Move.step(P.mv, inp, DT, W);
    K.Anim.update(P.anim, P.mv, DT);
    const r = AI.run(S, DT, W, rnd, pose);
    events(r.events);
    S.time += DT;
    S.hour = (S.hour + DT / 80) % 24;
    stuck = flat(P.mv.pos, last) < DT * 0.5 && inp.fwd ? stuck + DT : 0;
    last = P.mv.pos.slice();
    const now = Vi.introStep(S);
    if (now !== log[log.length - 1].step) log.push({ step: now, t: Math.round(S.time - skipped) });
    if (process.env.KI_TRACE && Math.floor(S.time / 20) !== Math.floor((S.time - DT) / 20)) console.log(Math.round(S.time), now, P.mv.pos.map(v => v.toFixed(1)).join(','), JSON.stringify(inp), P.fight.hostile ? 'hostile' : '', P.fight.life.toFixed(0), Vi.loyalty(S), Vi.fear(S));
  }
  const order = log.map(x => x.step);
  return { seed, done: Vi.introStep(S) === 'free', t: Math.round(S.time - skipped), log, inOrder: order.every((s, i) => i === 0 || Vi.INTRO.indexOf(s) > Vi.INTRO.indexOf(order[i - 1])), down: !!P.fight.down, give, hvosh: S.campaign.hvosh || null, saboteurs: S.campaign.saboteurs || null, loyalty: Vi.loyalty(S), fear: Vi.fear(S), silver: K.World.state(S).sides.villain.stock.silver, cut: got.cut };
}
const flat2 = (p, q) => Math.hypot(p[0] - q[0], p[2] - q[1]);

function stormRun(job) {
  const { K, W } = battlefield(), seed = job.seed, L = job.level, Vi = K.Villain, PP = K.Places.PALACE_PTS;
  const S = K.Save.start(W, { side: 'villain', name: 'Бот', intro: false }), rnd = K.rng(seed * 41 + L.men), pose = K.Body.restPose();
  S.campaign = { side: 'villain' };
  S.day = 25; S.hour = 12;
  const E = K.World.state(S), V = E.sides.villain;
  Object.assign(V, { ladders: L.ladders, ram: L.ram, intel: L.intel });
  Vi.state(S);
  const A = S.army;
  for (const r of A.people) if (r.army) { r.loyalty = L.loyalty; r.fear = 30; }
  while (Vi.soldiers(S).length < L.men) Vi.enlist(S);
  const extra = Vi.soldiers(S).length - L.men;
  if (extra > 0) Vi.soldiers(S).slice(-extra).forEach(r => { r.alive = false; });
  Vi.sync(S);
  const ready = K.World.readiness(S);
  S.focus = [PP.gate[0] - 40, 0, PP.gate[1]];
  const sp = S.player;
  S.player = null;
  sp.mv = K.Move.body(W, 1000, 120, 0);
  const res = Vi.startAssault(S, W, L.route, []);
  if (!res.ok) return { seed, level: L.name, ready, error: res.why };
  const g = E.groups.find(x => x.id === res.group.id);
  g.via = null; g.from = [1090, 700]; g.line = null; g.s = 0;
  let t = 0;
  while (t < 1000 && !(E.assault && E.assault.result)) {
    K.AI.run(S, DT, W, rnd, pose);
    S.time += DT;
    S.hour = Math.min(23.9, S.hour + DT / 80);
    t += DT;
    if (E.assault && !E.assault.result && !E.groups.some(x => x.kind === 'assault' && x.state !== 'done')) { E.assault.result = 'repelled'; break; }
  }
  const G = S.guard;
  return { seed, level: L.name, ready, result: E.assault ? E.assault.result || 'open' : 'repelled', t: Math.round(t), broken: !!(G && G.gate.broken), ladders: G ? G.ladders.length : 0, inside: G && G.siege ? G.siege.inside : 0, lost: res.group.start - (E.groups.find(x => x.id === res.group.id) || { n: 0 }).n };
}

function villain() {
  const per = Math.max(1, +arg('n', 4)), jobsN = Math.max(1, +arg('jobs', Math.min(per, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  const seeds = Array.from({ length: per }, (v, i) => i + 1);
  for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'villain', seeds: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat().sort((a, b) => a.seed - b.seed), n = rows.length;
    console.log(`${n} runs of the villain start by the bot in ${Math.round((Date.now() - t0) / 1000)} s`);
    for (const r of rows) console.log(`seed ${r.seed}: ${r.done ? 'free play' : 'stopped at ' + r.log[r.log.length - 1].step} after ${(r.t / 60).toFixed(1)} min; ${r.log.map(x => x.step + ' ' + (x.t / 60).toFixed(1)).join(', ')}; Хвощ ${r.hvosh}, saboteurs ${r.saboteurs}${r.cut ? ' (rope cut)' : ''}, loyalty ${r.loyalty}, fear ${r.fear}, silver ${r.silver}${r.down ? ', the hero fell' : ''}`);
    const res = { mode: 'villain', n, rows, pass: rows.every(r => r.done && r.inOrder && r.t <= 2400) };
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: every run walks the first night and the first sortie step by step to free play within 40 min`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

const STORM_LEVELS = [
  { name: 'low', men: 30, ladders: 0, ram: 0, intel: 0, loyalty: 40, route: 'forest' },
  { name: 'mid', men: 45, ladders: 2, ram: 1, intel: 1, loyalty: 55, route: 'forest' },
  { name: 'high', men: 60, ladders: 4, ram: 1, intel: 3, loyalty: 70, route: 'forest' }
];

function storms() {
  const per = Math.max(1, +arg('n', 20)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), all = [];
  for (const L of STORM_LEVELS) for (let s = 1; s <= per; s++) all.push({ seed: s, level: L });
  const tasks = [];
  for (let w = 0; w < jobsN; w++) { const part = all.filter((x, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'storms', jobs: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), res = { mode: 'storms', n: rows.length, seconds: Math.round((Date.now() - t0) / 1000), levels: {} };
    console.log(`${rows.length} live assaults on the palace in ${res.seconds} s`);
    for (const L of STORM_LEVELS) {
      const r = rows.filter(x => x.level === L.name), taken = r.filter(x => x.result === 'taken').length, ts = r.map(x => x.t).sort((a, b) => a - b);
      res.levels[L.name] = { n: r.length, ready: r[0] ? r[0].ready : null, taken: taken / r.length, broken: r.filter(x => x.broken).length / r.length, median: ts[Math.floor(ts.length / 2)], errors: r.filter(x => x.error).length };
      console.log(`${L.name}: readiness ${res.levels[L.name].ready}%, ${L.men} men, ladders ${L.ladders}, ram ${L.ram}, intel ${L.intel}: palace taken in ${(taken / r.length * 100).toFixed(0)} %, gate broken in ${(res.levels[L.name].broken * 100).toFixed(0)} %, median ${res.levels[L.name].median} s${res.levels[L.name].errors ? ', errors ' + res.levels[L.name].errors : ''}`);
    }
    const lv = res.levels;
    res.pass = lv.low.taken <= lv.mid.taken && lv.mid.taken <= lv.high.taken && lv.high.taken > lv.low.taken && !rows.some(x => x.error);
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: the higher the readiness, the more often the palace falls`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function guard() {
  const per = Math.max(1, +arg('n', 4)), jobsN = Math.max(1, +arg('jobs', Math.min(per, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  const seeds = Array.from({ length: per }, (v, i) => i + 1);
  for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'guard', seeds: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat().sort((a, b) => a.seed - b.seed), n = rows.length;
    console.log(`${n} runs of the guard start by the bot in ${Math.round((Date.now() - t0) / 1000)} s`);
    for (const r of rows) console.log(`seed ${r.seed}: ${r.done ? 'free play' : 'stopped at ' + r.log[r.log.length - 1].step} after ${(r.t / 60).toFixed(1)} min; ${r.log.map(x => x.step + ' ' + (x.t / 60).toFixed(1)).join(', ')}; held ${r.got.held} (spies ${r.got.spies}), passed ${r.got.passed}, blocks ${r.got.blocks}, Гаврила ${r.gavrila}${r.help ? ' (bandaged by the hero)' : ''}, service ${r.service}${r.down ? ', the hero fell' : ''}${r.day2 ? `; day ${r.day2.day}: muster ${r.day2.muster ? (r.day2.muster.late ? 'late' : 'on time') + ', pay ' + r.day2.muster.pay : 'missed'}, order ${r.day2.order} ${r.day2.state} in ${r.day2.minutes} min, service ${r.day2.service >= 0 ? '+' : ''}${r.day2.service}` : ''}`);
    const res = { mode: 'guard', n, rows, pass: rows.every(r => r.done && r.inOrder && r.t <= 1800 && r.day2 && r.day2.muster && !r.day2.muster.late && r.day2.state === 'done') };
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: every run walks the first 20 minutes of service step by step to free play within 30 min, then stands the next muster and carries out the order`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function elves() {
  const per = Math.max(1, +arg('n', 4)), jobsN = Math.max(1, +arg('jobs', Math.min(per, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  const seeds = Array.from({ length: per }, (v, i) => i + 1);
  for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'elves', seeds: part }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat().sort((a, b) => a.seed - b.seed), n = rows.length;
    console.log(`${n} runs of the elf start by the bot in ${Math.round((Date.now() - t0) / 1000)} s`);
    for (const r of rows) console.log(`seed ${r.seed}: ${r.done ? 'free play' : 'stopped at ' + r.log[r.log.length - 1].step} after ${(r.t / 60).toFixed(1)} min; ${r.log.map(x => x.step + ' ' + (x.t / 60).toFixed(1)).join(', ')}; buckets ${r.pours}, respect ${r.respect}${r.down ? ', the hero fell' : ''}`);
    const res = { mode: 'elves', n, rows, pass: rows.every(r => r.done && r.inOrder && r.t <= 1800) };
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: every run walks the first 20 minutes step by step to free play within 30 min`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function roads() {
  const { K, W } = battlefield(), Cv = K.Caravan, E = K.Econ, seeds = Math.max(1, +arg('n', 10)), out = arg('json', null), t0 = Date.now(), res = { mode: 'roads', shares: {} }, pc = x => (x * 100).toFixed(1) + ' %';
  for (const share of [0, 0.25, 0.5, 1]) {
    const rows = [];
    for (let k = 0; k < seeds; k++) {
      const rnd = K.rng(100 + k), pick = K.rng(900 + k), S = { day: 1, hour: 6, time: 0, nextId: 5000, people: [], beasts: [], relations: {} }, robbed = new Set();
      Cv.init(S, rnd);
      let low = 2, sum = 0, n = 0, dear = 0;
      for (let t = 0; t < 30 * 24 * 80; t++) {
        S.hour += 1 / 80;
        if (S.hour >= 24) { S.hour -= 24; S.day++; const m = E.state(S).stock.medicine; low = Math.min(low, m); sum += m; n++; if (E.doctor(S, { fight: { life: 100, bleed: K.Wounds.bleed() }, kit: { cut: {} } })[0].price > 20) dear++; }
        S.time += 1;
        Cv.run(S, 1, W, rnd);
        for (const c of S.caravans.list) {
          if (c.kind !== 'trade' || c.passed || c.s < 60 || robbed.has(c.id)) continue;
          robbed.add(c.id);
          if (pick() < share) { c.carts.forEach(x => { x.bales = []; }); c.robbed = true; c.crew = c.crew.filter(m => m.role !== 'driver'); }
        }
      }
      rows.push({ arrived: S.caravans.stats.arrived.trade || 0, lost: S.caravans.stats.lost.trade || 0, low, avg: sum / n, dear: dear / n, bandage: E.price(S, 'bandage'), sword: E.price(S, 'sword') });
    }
    const avg = k => rows.reduce((s, x) => s + x[k], 0) / rows.length;
    const v = res.shares[share] = { arrived: avg('arrived'), lost: avg('lost'), low: avg('low'), avg: avg('avg'), dear: avg('dear'), bandage: avg('bandage') };
    console.log(`robbers take ${pc(share)} of trade caravans: ${v.arrived.toFixed(1)} arrive and ${v.lost.toFixed(1)} are lost in 30 days, medicines average ${v.avg.toFixed(2)} (lowest ${v.low.toFixed(2)}), the doctor charges more on ${pc(v.dear)} of days, a bandage costs ${v.bandage.toFixed(1)} at the end`);
  }
  res.seconds = Math.round((Date.now() - t0) / 100) / 10;
  res.pass = res.shares[0].avg > 0.9 && res.shares[1].avg < 0.6 && res.shares[0.5].avg < res.shares[0].avg;
  console.log(`${res.pass ? 'PASS' : 'FAIL'}: calm roads keep the stocks, robbing every trade caravan makes medicine scarce`);
  if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
  process.exit(res.pass ? 0 : 1);
}

function brawls() {
  const per = Math.max(1, +arg('n', 30)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  for (const variant of ['villain', 'elf']) for (let w = 0; w < jobsN; w++) { const seeds = Array.from({ length: per }, (v, i) => 40 + i * 13).filter((s, i) => i % jobsN === w); if (seeds.length) tasks.push({ mode: 'town', variant, seeds }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), pc = x => (x * 100).toFixed(1) + ' %', med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : -1; }, res = { mode: 'town', seconds: Math.round((Date.now() - t0) / 100) / 10, variants: {} };
    for (const variant of ['villain', 'elf']) {
      const r = rows.filter(x => x.variant === variant), n = r.length, share = k => r.filter(x => x.end === k).length / n;
      const v = res.variants[variant] = { n, wanted: r.filter(x => x.wanted >= 0).length / n, react: med(r.filter(x => x.engaged >= 0).map(x => x.engaged - Math.max(0, x.wanted))), most: r.reduce((s, x) => s + x.most, 0) / n, down: share('down'), surrender: share('surrender'), fled: share('fled'), none: share('none'), length: med(r.map(x => x.t)), traderDown: r.filter(x => x.traderDown).length / n, watchDown: r.reduce((s, x) => s + x.watchDown, 0) / n };
      console.log(`${variant === 'elf' ? 'elf with a sickle' : 'villain soldier with an axe'} attacks a townsman on the square: ${n} brawls, the watch marks him in ${pc(v.wanted)}, the watch turns on him after ${v.react.toFixed(1)} s, up to ${v.most.toFixed(1)} watchmen at once; ends: down ${pc(v.down)}, surrendered ${pc(v.surrender)}, fled the town ${pc(v.fled)}, still going after 120 s ${pc(v.none)}; median ${v.length.toFixed(1)} s; the townsman fell ${pc(v.traderDown)}, watchmen fallen ${v.watchDown.toFixed(2)}`);
    }
    const all = Object.values(res.variants);
    res.pass = all.every(v => v.wanted === 1 && v.none <= 0.1 && v.react < 10);
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: every attacker is marked, the watch turns on him within 10 s and no brawl lasts past 120 s in more than 10 %`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function nights() {
  const per = Math.max(1, +arg('n', 24)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  for (const variant of ['shield', 'torch', 'day']) for (let w = 0; w < jobsN; w++) { const seeds = Array.from({ length: per }, (v, i) => 300 + i * 17).filter((s, i) => i % jobsN === w); if (seeds.length) tasks.push({ mode: 'night', variant, seeds }); }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), pc = x => (x * 100).toFixed(1) + ' %', res = { mode: 'night', seconds: Math.round((Date.now() - t0) / 100) / 10, variants: {} };
    for (const variant of ['shield', 'torch', 'day']) {
      const r = rows.filter(x => x.variant === variant), n = r.length, avg = k => r.reduce((s, x) => s + x[k], 0) / n;
      const v = res.variants[variant] = { n, attacked: r.filter(x => x.attacks > 0).length / n, attacks: avg('attacks'), bites: avg('bites'), kills: avg('kills'), fled: avg('fled'), reached: r.filter(x => x.reached).length / n, clean: r.filter(x => x.reached && !x.bound && x.bites === 0).length / n, unbandaged: r.filter(x => x.reached && !x.bound).length / n, died: r.filter(x => x.died).length / n, minutes: avg('t') / 60 };
      console.log(`${variant === 'day' ? 'day road, sword and shield' : variant === 'torch' ? 'night road, sword and torch' : 'night road, sword and shield'}: ${n} walks, attacked by wolves in ${pc(v.attacked)}, packs per walk ${v.attacks.toFixed(2)}, bites ${v.bites.toFixed(1)}, wolves killed ${v.kills.toFixed(2)}, packs fled ${v.fled.toFixed(2)}; reached the fort ${pc(v.reached)}, without bandaging ${pc(v.unbandaged)}, without a bite ${pc(v.clean)}, died ${pc(v.died)}, ${v.minutes.toFixed(1)} min on the road`);
    }
    res.pass = res.variants.shield.attacked > 0.3 && res.variants.torch.bites < res.variants.shield.bites && res.variants.day.attacks < res.variants.shield.attacks;
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: wolves attack a lone walker at night (${pc(res.variants.shield.attacked)}), a torch keeps them off (${res.variants.torch.bites.toFixed(1)} bites against ${res.variants.shield.bites.toFixed(1)}), by day packs sleep (${res.variants.day.attacks.toFixed(2)} attacks against ${res.variants.shield.attacks.toFixed(2)})`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function squads() {
  const size = Math.max(1, Math.min(10, +arg('size', 5))), per = Math.max(1, +arg('n', 50)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now(), tasks = [];
  for (const place of [...Object.keys(SQUAD_SIDES), ...(size > 5 ? [] : ['march'])]) {
    const count = place === 'march' ? Math.max(4, Math.round(per / 2)) : per, seeds = Array.from({ length: count }, (v, i) => 700 + i * 31);
    for (let w = 0; w < jobsN; w++) { const part = seeds.filter((s, i) => i % jobsN === w); if (part.length) tasks.push({ mode: 'squads', place, seeds: part, size }); }
  }
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', res); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), pc = x => (x * 100).toFixed(1) + ' %', res = { mode: 'squads', seconds: Math.round((Date.now() - t0) / 100) / 10, places: {} };
    let stuck = 0, npcMin = 0, cases = 0, helped = 0;
    for (const place of Object.keys(SQUAD_SIDES)) {
      const r = rows.filter(x => x.place === place), n = r.length, ts = r.map(x => x.t).sort((p, q) => p - q), sum = k => r.reduce((s, x) => s + x.tally[k], 0) / n;
      const k = res.places[place] = { n, sides: SQUAD_SIDES[place], win: r.filter(x => x.win === 0).length / n, lose: r.filter(x => x.win === 1).length / n, median: ts[Math.floor(n / 2)], stuck: r.reduce((s, x) => s + x.stuck, 0), npcMin: r.reduce((s, x) => s + x.npcMin, 0), cases: r.reduce((s, x) => s + x.cases, 0), helped: r.reduce((s, x) => s + x.helped, 0), crawl: sum('crawl'), surrender: sum('surrender'), knife: sum('knife'), tied: sum('tied'), carried: sum('carried'), ko: sum('ko'), dead: sum('dead'), jailed: r.reduce((s, x) => s + x.jailed, 0) / n };
      stuck += k.stuck;
      npcMin += k.npcMin;
      cases += k.cases;
      helped += k.helped;
      console.log(`${place} (${k.sides.join(' vs ')}): ${n} fights, ${k.sides[0]} wins ${pc(k.win)}, ${k.sides[1]} wins ${pc(k.lose)}, median ${k.median.toFixed(1)} s, per fight: fell ${(k.ko + k.dead).toFixed(1)} (${k.dead.toFixed(1)} killed outright), crawled ${k.crawl.toFixed(2)}, surrendered ${k.surrender.toFixed(2)}, drew a knife ${k.knife.toFixed(2)}, tied ${k.tied.toFixed(2)}, jailed ${k.jailed.toFixed(2)}, carried to a healer ${k.carried.toFixed(2)}; bandaged ${k.helped} of ${k.cases} fallen with a free friend near, stuck ${k.stuck} in ${k.npcMin.toFixed(0)} NPC-minutes`);
    }
    const m = rows.filter(x => x.place === 'march'), mt = m.filter(x => x.t > 0).map(x => x.t).sort((p, q) => p - q);
    res.size = size;
    res.march = m.length ? { n: m.length, arrived: m.filter(x => x.arrived === 5).length / m.length, median: mt.length ? mt[Math.floor(mt.length / 2)] : -1, stuck: m.reduce((s, x) => s + x.stuck, 0), npcMin: m.reduce((s, x) => s + x.npcMin, 0) } : { n: 0, arrived: 1, median: -1, stuck: 0, npcMin: 0 };
    stuck += res.march.stuck;
    npcMin += res.march.npcMin;
    if (m.length) console.log(`march: ${m.length} squads of 5 through 120 m of thicket, all five arrived in ${pc(res.march.arrived)}, median ${res.march.median.toFixed(1)} s, stuck ${res.march.stuck} in ${res.march.npcMin.toFixed(0)} NPC-minutes`);
    res.stuckPer1000 = stuck / npcMin * 1000;
    res.helpRate = cases ? helped / cases : 1;
    res.pass = res.stuckPer1000 <= 1 && (size > 5 || res.helpRate >= 0.7) && res.march.arrived >= 0.9;
    console.log(`${res.pass ? 'PASS' : 'FAIL'}: stuck ${res.stuckPer1000.toFixed(2)} per 1000 NPC-minutes (limit 1), bandaged ${pc(res.helpRate)} of fallen with a free friend near (limit 70 % in fights of 5 on 5), squads through the thicket ${pc(res.march.arrived)} (limit 90 %)`);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function fights(mode) {
  const per = Math.max(2, +arg('n', mode === 'archer' ? 200 : 1000)), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null), t0 = Date.now();
  const kinds = mode === 'archer' ? ['forest', 'field'] : ['flat'], tasks = [];
  for (const kind of kinds) for (let w = 0; w < jobsN; w++) tasks.push({ mode, kind, seeds: Array.from({ length: Math.ceil(per / jobsN) }, (v, i) => 5000 + w * 997 + i * 13) });
  Promise.all(tasks.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.on('message', r => res(r.map(x => Object.assign(x, { kind: job.kind })))); w.on('error', rej); }))).then(chunks => {
    const rows = chunks.flat(), pc = x => (x * 100).toFixed(1) + ' %', res = { mode, seconds: Math.round((Date.now() - t0) / 100) / 10, kinds: {} };
    for (const kind of kinds) {
      const r = rows.filter(x => x.kind === kind), n = r.length, won = r.filter(x => x.win === 1).length, lost = r.filter(x => x.win === 0).length;
      const ts = r.map(x => x.t).sort((p, q) => p - q);
      const k = res.kinds[kind] = { n, win: won / n, lose: lost / n, open: (n - won - lost) / n, median: ts[Math.floor(n / 2)], shots: r.reduce((s, x) => s + (x.shots || 0), 0) / n, hits: r.reduce((s, x) => s + x.hits, 0) / n, inShield: r.reduce((s, x) => s + (x.inShield || 0), 0) / n };
      const extra = mode === 'archer' ? 'arrows ' + k.shots.toFixed(1) : 'javelins in the shield ' + k.inShield.toFixed(2);
      console.log(mode + ' ' + kind + ': ' + n + ' fights, ' + (mode === 'archer' ? 'archer' : 'thrower') + ' wins ' + pc(k.win) + ', loses ' + pc(k.lose) + ', unfinished ' + pc(k.open) + ', median ' + k.median.toFixed(1) + ' s, ' + extra + ', hits ' + k.hits.toFixed(1) + ' per fight');
    }
    if (mode === 'archer') { res.pass = res.kinds.forest.win > res.kinds.field.win + 0.15; console.log((res.pass ? 'PASS' : 'FAIL') + ': forest ' + pc(res.kinds.forest.win) + ' against field ' + pc(res.kinds.field.win) + ' (forest must win at least 15 points more)'); }
    else res.pass = true;
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}

function play(jobs) {
  const { duel } = engine(), rows = [];
  for (const job of jobs) {
    for (let k = 0; k < job.n; k++) {
      const swap = k % 2 === 1, va = swap ? job.b : job.a, vb = swap ? job.a : job.b;
      const r = duel(va, vb, job.seed + k, job.armor);
      const winner = r.winner < 0 ? -1 : swap ? 1 - r.winner : r.winner;
      rows.push([job.i, job.j, Math.round(r.t * 100) / 100, winner, r.cause, r.tally.cuts, r.tally.eyes, r.tally.blocks, r.tally.parries, r.tally.kicks]);
    }
  }
  return rows;
}

function report(V, rows, armorMode, ms) {
  const wins = new Map(), games = new Map(), vw = new Map(), vg = new Map(), causes = {}, times = [], pairs = new Map();
  let cuts = 0, eyes = 0, withCut = 0, withEye = 0, draws = 0, blocks = 0, parries = 0, kicks = 0;
  const bump = (m, k, n) => m.set(k, (m.get(k) || 0) + n);
  for (const [i, j, t, winner, cause, c, e, bl, pa, ki] of rows) {
    times.push(t);
    const key = i + ':' + j, pair = pairs.get(key) || pairs.set(key, { i, j, a: 0, n: 0, t: 0 }).get(key);
    pair.n++;
    pair.t += t;
    if (winner === 0) pair.a++;
    cuts += c; eyes += e; blocks += bl; parries += pa; kicks += ki;
    if (c) withCut++;
    if (e) withEye++;
    if (winner < 0) draws++;
    causes[cause] = (causes[cause] || 0) + 1;
    for (const [v, side] of [[V[i], 0], [V[j], 1]]) {
      if (v[0] === (side ? V[i] : V[j])[0]) continue;
      bump(games, v[0], 1);
      if (winner === side) bump(wins, v[0], 1);
    }
    for (const [v, side] of [[V[i], 0], [V[j], 1]]) {
      bump(vg, label(v), 1);
      if (winner === side) bump(vw, label(v), 1);
    }
  }
  times.sort((x, y) => x - y);
  const n = rows.length, q = f => times[Math.min(n - 1, Math.floor(n * f))];
  const share = (m, g, k) => (m.get(k) || 0) / (g.get(k) || 1);
  const weapon = WEAPONS.map(w => ({ weapon: w, win: share(wins, games, w), games: games.get(w) || 0 }));
  const loadout = V.map(v => ({ loadout: label(v), win: share(vw, vg, label(v)) }));
  const top = weapon.reduce((m, x) => x.win > m.win ? x : m, weapon[0]);
  const out = {
    duels: n, armor: armorMode, seconds: Math.round(ms / 100) / 10,
    median: q(0.5), p10: q(0.1), p90: q(0.9), draws,
    cutsPerDuel: cuts / n, duelsWithCut: withCut / n, eyesPerDuel: eyes / n, duelsWithEye: withEye / n,
    blocksPerDuel: blocks / n, parriesPerDuel: parries / n, kicksPerDuel: kicks / n,
    causes, weapon, loadout,
    pairs: [...pairs.values()].sort((x, y) => x.i - y.i || x.j - y.j).map(x => ({ a: label(V[x.i]), b: label(V[x.j]), winA: x.a / x.n, length: x.t / x.n })),
    pass: top.win <= 0.65 && q(0.5) >= 6 && q(0.5) <= 20
  };
  const pc = x => (x * 100).toFixed(1) + ' %';
  console.log(`${n} duels, armour ${armorMode}, ${out.seconds} s`);
  console.log(`length: median ${out.median.toFixed(1)} s, 10 % ${out.p10.toFixed(1)} s, 90 % ${out.p90.toFixed(1)} s, unfinished ${draws}`);
  console.log(`cuts per duel ${out.cutsPerDuel.toFixed(2)}, duels with a cut ${pc(out.duelsWithCut)}, eyes per duel ${out.eyesPerDuel.toFixed(3)}, duels with an eye lost ${pc(out.duelsWithEye)}`);
  console.log(`blocks ${out.blocksPerDuel.toFixed(1)}, parries ${out.parriesPerDuel.toFixed(2)}, kicks ${out.kicksPerDuel.toFixed(2)} per duel`);
  console.log('ends: ' + Object.entries(causes).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${pc(v / n)}`).join(', '));
  console.log('weapon wins against other weapons: ' + weapon.map(x => `${x.weapon} ${pc(x.win)}`).join(', '));
  console.log('loadout wins: ' + loadout.map(x => `${x.loadout} ${pc(x.win)}`).join(', '));
  if (process.argv.includes('--pairs')) for (const x of out.pairs) console.log(`  ${x.a} against ${x.b}: ${pc(x.winA)}, ${x.length.toFixed(1)} s`);
  console.log(`${out.pass ? 'PASS' : 'FAIL'}: top weapon ${top.weapon} ${pc(top.win)} (limit 65 %), median ${out.median.toFixed(1)} s (limit 6–20 s)`);
  return out;
}

function money() {
  const { K } = battlefield(), E = K.Econ, Cv = K.Caravan, days = Math.max(10, +arg('days', 30)), out = arg('json', null);
  const S = { seed: 3, day: 1, hour: 12, relations: {}, standing: { service: 0, respect: 0, loyalty: 0 } }, rnd = K.rng(17);
  const buy = id => E.price(S, id, 'buy'), sell = id => E.price(S, id, 'sell');
  const sackSilver = side => { const s = K.Data.SACKS[side].find(x => x[0] === 'silver'); return s[1] + Math.floor(rnd() * (s[2] - s[1] + 1)); }, bodySilver = () => 3 + Math.floor(rnd() * 8);
  const guards = k => Cv.KINDS[k].guards[0] + Math.floor(rnd() * (Cv.KINDS[k].guards[1] - Cv.KINDS[k].guards[0] + 1));
  const bale = k => { const g = Cv.KINDS[k].goods; const id = { bread: 'baleBread', cloth: 'baleCloth', wine: 'baleWine', medicine: 'baleMedicine', ore: 'baleOre', iron: 'baleIron', grain: 'baleGrain' }[g[Math.floor(rnd() * g.length)]]; return sell(id); };
  const hides = ['deerHide', 'wolfHide', 'boarHide', 'deerHide', 'hareFur'];
  const rankPay = service => { let pay = 0; for (const r of K.Guard.RANKS) if (service >= r.at) pay = r.pay; return pay; };
  const sides = {
    elf: { hinge: buy('hingeArm'), how: 'покупает у Шарнира', day: d => ({ herbs: 8 * sell('herbs'), hunt: sell(hides[d % hides.length]), raid: d % 2 === 0 ? Array.from({ length: guards('trade') }, bodySilver).reduce((a, b) => a + b, 0) + bale('trade') + bale('trade') : 0 }) },
    guard: { hinge: Math.round(E.GOODS.hingeArm[0] * E.SIDE_PROS.guard.share), how: 'по казённой грамоте за полцены, когда служба 6', day: (d, st) => { st.service = (st.service || 0) + 1; return { pay: d > 1 ? rankPay(st.service) : 0, spy: d % 5 === 0 ? 50 : 0 }; }, need: st => st.service >= E.SIDE_PROS.guard.need },
    villain: { hinge: buy('hingeArm'), how: 'покупает у Шарнира, дважды берёт из казны', day: d => ({ sortie: d % 2 === 0 ? sackSilver('guard') + sackSilver('guard') + sackSilver('guard') : 0, chest: d === 7 || d === 14 ? K.Villain.TAKE : 0, hunt: d % 3 === 0 ? sell('wolfHide') : 0 }) }
  };
  const res = { mode: 'money', days, sides: {} };
  for (const [side, R] of Object.entries(sides)) {
    let silver = E.START_SILVER, bandages = 3, heals = 0, hingeDay = -1;
    const st = {}, log = [], spent = { bandage: 0, doctor: 0 }, got = {};
    for (let d = 1; d <= days; d++) {
      const inc = R.day(d, st);
      for (const [k, v] of Object.entries(inc)) { silver += v; got[k] = (got[k] || 0) + v; }
      bandages--;
      if (bandages < 2) { const n = 3, c = n * buy('bandage'); silver -= c; spent.bandage += c; bandages += n; }
      if (d % 3 === 0) { silver -= E.DOCTOR.wounds; spent.doctor += E.DOCTOR.wounds; heals++; }
      if (d % 7 === 0) { silver -= E.DOCTOR.stop; spent.doctor += E.DOCTOR.stop; heals++; }
      if (hingeDay < 0 && silver >= R.hinge && (!R.need || R.need(st))) hingeDay = d;
      log.push(silver);
    }
    res.sides[side] = { hinge: R.hinge, how: R.how, hingeDay, heals: heals / days * 7, at: [3, 7, 14, 21, 30].filter(x => x <= days).map(x => log[x - 1]), got, spent };
    console.log(`${side}: hinge arm ${R.hinge} silver (${R.how}), affordable on day ${hingeDay < 0 ? 'never' : hingeDay}; silver on days 3/7/14/21/30: ${res.sides[side].at.join(' / ')}; heals ${res.sides[side].heals.toFixed(1)} a week; income ${Object.entries(got).map(([k, v]) => k + ' ' + v).join(', ')}; spent on bandages ${spent.bandage}, doctor ${spent.doctor}`);
  }
  res.pass = Object.values(res.sides).every(s => s.hingeDay > 0 && s.hingeDay <= 20 && s.at[0] > 0);
  console.log(`${res.pass ? 'PASS' : 'FAIL'}: every side can afford the hinge arm by day 20 (mid-campaign) and is not broke on day 3`);
  if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
  process.exit(res.pass ? 0 : 1);
}

if (isMainThread && require.main === module) {
  const mode = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'duels';
  if (mode === 'archer' || mode === 'javelin') fights(mode);
  else if (mode === 'squads') squads();
  else if (mode === 'night') nights();
  else if (mode === 'town') brawls();
  else if (mode === 'roads') roads();
  else if (mode === 'war') war();
  else if (mode === 'campaign') campaign();
  else if (mode === 'elves') elves();
  else if (mode === 'guard') guard();
  else if (mode === 'villain') villain();
  else if (mode === 'storms') storms();
  else if (mode === 'money') money();
  else if (mode !== 'duels') { console.error('unknown mode ' + mode + ', known: duels, archer, javelin, squads, night, town, roads, war, campaign, elves, guard, villain, storms, money'); process.exit(2); }
  else {
  const per = Math.max(2, +arg('n', 1000)), armorMode = arg('armor', 'mix'), jobsN = Math.max(1, +arg('jobs', Math.min(8, os.cpus().length))), out = arg('json', null);
  const V = loadouts(), jobs = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) jobs.push({ i, j, a: V[i], b: V[j], n: per, seed: 100000 + i * 7919 + j * 104729, armor: armorMode });
  const t0 = Date.now(), parts = Array.from({ length: jobsN }, () => []);
  jobs.forEach((job, k) => parts[k % jobsN].push(job));
  Promise.all(parts.filter(p => p.length).map(list => new Promise((res, rej) => {
    const w = new Worker(__filename, { workerData: list });
    w.on('message', res);
    w.on('error', rej);
  }))).then(chunks => {
    const res = report(V, chunks.flat(), armorMode, Date.now() - t0);
    if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
    process.exit(res.pass ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
  }
} else if (!isMainThread) {
  if (workerData.mode === 'night') parentPort.postMessage(workerData.seeds.map(s => nightWalk(workerData.variant, s)));
  else if (workerData.mode === 'town') parentPort.postMessage(workerData.seeds.map(s => brawl(workerData.variant, s)));
  else if (workerData.mode === 'war') parentPort.postMessage(workerData.seeds.map(warRun));
  else if (workerData.mode === 'campaign') parentPort.postMessage(workerData.seeds.map(campaignRun));
  else if (workerData.mode === 'elves') parentPort.postMessage(workerData.seeds.map(introRun));
  else if (workerData.mode === 'guard') parentPort.postMessage(workerData.seeds.map(guardRun));
  else if (workerData.mode === 'villain') parentPort.postMessage(workerData.seeds.map(villainRun));
  else if (workerData.mode === 'storms') parentPort.postMessage(workerData.jobs.map(stormRun));
  else if (workerData.mode === 'squads') parentPort.postMessage(workerData.seeds.map(s => workerData.place === 'march' ? march(s) : squadFight(workerData.place, s, workerData.size)));
  else if (workerData.mode === 'archer') parentPort.postMessage(workerData.seeds.map(s => skirmish(workerData.kind, s)));
  else if (workerData.mode === 'javelin') parentPort.postMessage(workerData.seeds.map(javelins));
  else parentPort.postMessage(play(workerData));
}

module.exports = { engine, loadouts, label, battlefield, skirmish, javelins, squadFight, march, nightWalk, brawl, campaignRun, introRun, guardRun, villainRun, stormRun };
