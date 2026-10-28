const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/tekken3');
const SIM = ['tk-core', 'tk-skel', 'tk-anim', 'tk-cmd', 'tk-moves', 'tk-fight', 'tk-animator', 'tk-ai', 'tk-roster', 'tk-roster1', 'tk-roster2', 'tk-roster3', 'tk-modes'];
let T;
for (const f of SIM) T = require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };
const { IN } = T;
const F = IN.F, B = IN.B, U = IN.U, D = IN.D, P1 = IN.P1, P2 = IN.P2, K3 = IN.K3, K4 = IN.K4;

const DA = { id: 'ta', name: 'A', short: 'A', stance: 'karate', look: {}, costumes: [{}], moves: [] };
const DB = { id: 'tb', name: 'B', short: 'B', stance: 'boxer', look: {}, costumes: [{}], moves: [] };

function fight(a, b, opts) {
  const m = new T.Match([a || Object.assign({}, DA), b || Object.assign({}, DB)], Object.assign({ skipIntro: true, seed: 3, mimicPool: T.mimicPool() }, opts || {}));
  while (m.phase !== 'fight') m.step([0, 0]);
  return m;
}

function run(m, a, b, n) {
  for (let i = 0; i < (n || 1); i++) {
    const ia = typeof a === 'function' ? a(i) : a || 0;
    const ib = typeof b === 'function' ? b(i) : b || 0;
    m.step([ia, ib]);
  }
}

function place(m, dist) {
  m.fs[0].pos = [-dist / 2, 0, 0]; m.fs[0].yaw = 0;
  m.fs[1].pos = [dist / 2, 0, 0]; m.fs[1].yaw = Math.PI;
}

{
  const p = T.parseCmd('f,n,d,df+2');
  ok(p.motion.join() === '6,5,2' && p.dir === 'df' && p.btn === P2, 'electric parse');
  ok(T.parseCmd('1').anyDir, 'plain button accepts neutral, forward and back');
  ok(T.parseCmd('ws 4').req === 'ws', 'while-standing requirement');
  ok(T.parseCmd('run 1+2').btn === (P1 | P2), 'run 1+2 buttons');
  ok(T.parseCmd('d,df,f+1').motion.join() === '2,3', 'quarter circle motion');
  ok(T.parseCmd('st:lotus 4').req === 'st:lotus', 'stance requirement');
  const h = new T.History();
  for (const b of [F, 0, 0, F, F | P2]) h.push(b);
  ok(T.cmdMatches(h, T.parseCmd('f,f+2'), 0), 'f,f+2 matches a double tap');
  ok(!T.cmdMatches(h, T.parseCmd('df+2'), 0), 'df+2 does not match f,f+2 input');
  const h2 = new T.History();
  for (const b of [0, F, 0, D, D | F | P2]) h2.push(b);
  ok(T.cmdMatches(h2, T.parseCmd('~f,n,d,df+2'), 0), 'just-frame electric on the first df frame');
  const h3 = new T.History();
  for (const b of [0, F, 0, D, D | F, D | F | P2]) h3.push(b);
  ok(!T.cmdMatches(h3, T.parseCmd('~f,n,d,df+2'), 0), 'late button is not a just frame');
  ok(T.cmdMatches(h3, T.parseCmd('f,n,d,df+2'), 0), 'late button still makes the normal version');
  const h4 = new T.History();
  for (const b of [0, P1, P1 | P2]) h4.push(b);
  ok(T.cmdMatches(h4, T.parseCmd('1+2'), 0), '1+2 with one frame of slop');
}

{
  const m = fight();
  place(m, 0.9);
  const a = m.fs[0], b = m.fs[1];
  run(m, i => i === 0 ? P1 : 0, 0, 12);
  ok(b.state === 'block', 'standing guard blocks a jab: ' + b.state);
  let pa = false, pb = false, first = null;
  for (let i = 0; i < 40; i++) {
    const ia = !pa && a.state === 'idle' ? (pa = true, P1) : 0;
    const ib = !pb && b.state === 'idle' ? (pb = true, P1) : 0;
    m.step([ia, ib]);
    for (const e of m.events) if (e.type === 'hit' && first === null) first = e.a.idx;
  }
  ok(first === 0, 'jab is +1 on block and wins the next exchange');
}

function punishTest(adv, expect) {
  const def = Object.assign({}, DA, { id: 'pt' + adv, moves: [T.mv('df+1', 'Тест', 'm', 10, 12, 2, 20, adv, 3, { a: 'body:l', r: 0.9 })] });
  const m = fight(def, Object.assign({}, DB));
  place(m, 1.0);
  const b = m.fs[1];
  m.step([D | F, 0]); m.step([D | F | P1, 0]);
  let blocked = false;
  for (let i = 0; i < 20 && !blocked; i++) { m.step([0, 0]); if (b.state === 'block') blocked = true; }
  let punished = false, pressed = false;
  for (let i = 0; i < 60; i++) {
    const ib = !pressed && b.state === 'block' && b.t >= b.dur - 2 ? (pressed = true, P1) : 0;
    m.step([0, ib]);
    for (const e of m.events) if (e.type === 'hit' && e.a === b) punished = true;
  }
  ok(blocked && punished === expect, `move at ${adv} on block ${expect ? 'is' : 'is not'} punished by a 10-frame jab`);
}
punishTest(-10, true);
punishTest(-9, false);

{
  const m = fight();
  place(m, 1.0);
  const b = m.fs[1];
  let hits = 0, blocks = 0;
  const count = () => { for (const e of m.events) { if (e.type === 'hit') hits++; if (e.type === 'block') blocks++; } };
  for (let i = 0; i < 5; i++) { m.step([0, D | B]); count(); }
  ok(b.state === 'crouch', 'defender crouches');
  m.step([P1, D | B]); count();
  for (let i = 0; i < 20; i++) { m.step([0, D | B]); count(); }
  ok(hits === 0 && blocks === 0, 'high jab whiffs over a crouching defender');
  run(m, 0, D | B, 30);
  blocks = 0;
  m.step([D | K4, D | B]); count();
  for (let i = 0; i < 20; i++) { m.step([D, D | B]); count(); }
  ok(blocks >= 1, 'low kick is blocked by crouch guard');
  run(m, 0, D | B, 30);
  hits = 0;
  m.step([F | D, D | B]); m.step([F | D | P1, D | B]); count();
  for (let i = 0; i < 20; i++) { m.step([0, D | B]); count(); }
  ok(hits >= 1, 'mid hits a crouching defender');
  run(m, 0, 0, 30);
  hits = 0; blocks = 0;
  m.step([D | K4, 0]); count();
  for (let i = 0; i < 20; i++) { m.step([0, 0]); count(); }
  ok(hits >= 1 && blocks === 0, 'low hits a standing defender');
}

{
  const m = fight();
  place(m, 1.3);
  const a = m.fs[0], b = m.fs[1];
  let launched = false, combo = 0;
  m.step([F | D, F]); m.step([F | D | P2, F]);
  for (let i = 0; i < 80; i++) {
    let ia = 0;
    if (b.state === 'air' && a.state !== 'move') ia = P1;
    if (a.state === 'move' && a.move.id === '1' && a.mf === 5) ia = P2;
    m.step([ia, b.state === 'walk' || b.state === 'idle' && !launched ? F : 0]);
    if (b.state === 'air') launched = true;
    combo = Math.max(combo, b.combo.hits);
  }
  ok(launched, 'uppercut launches a walking opponent');
  ok(combo >= 3, 'juggle follow-ups connect: ' + combo);
}

{
  const m = fight();
  place(m, 0.8);
  const a = m.fs[0], b = m.fs[1];
  let grabbed = false;
  for (let i = 0; i < 15; i++) { m.step([P1 | K3, 0]); if (b.state === 'thrown') grabbed = true; }
  ok(grabbed, 'throw grabs a standing defender');
  for (let i = 0; i < 5; i++) m.step([0, P1]);
  ok(b.state === 'tbreak' && a.state === 'tbreak', 'throw 1+3 is broken with 1');
  run(m, 0, 0, 30);
  place(m, 0.8);
  const hp0 = b.hp;
  run(m, P2 | K4, 0, 90);
  ok(b.hp < hp0 && (b.state === 'down' || b.state === 'getup'), 'unbroken throw deals damage and floors: ' + b.state);
  run(m, 0, 0, 200);
  place(m, 0.8);
  let cr = false;
  for (let i = 0; i < 6; i++) m.step([0, D | B]);
  for (let i = 0; i < 20; i++) { m.step([P1 | K3, D | B]); if (b.state === 'thrown') cr = true; }
  ok(!cr, 'high throw whiffs on a crouching defender');
}

{
  const m = fight();
  place(m, 1.2);
  let hits = 0;
  m.step([F | P2, 0]);
  run(m, 0, i => i === 1 ? U : 0, 3);
  for (let i = 0; i < 25; i++) { m.step([0, 0]); for (const e of m.events) if (e.type === 'hit' || e.type === 'block') hits++; }
  ok(hits === 0, 'sidestep makes the linear f+2 whiff');
}

{
  const m = fight();
  place(m, 1.2);
  let hit = 0;
  m.step([K4, 0]);
  run(m, 0, i => i === 1 ? U : 0, 3);
  for (let i = 0; i < 25; i++) { m.step([0, 0]); for (const e of m.events) if (e.type === 'hit' || e.type === 'block') hit++; }
  ok(hit >= 1, 'tracking high kick catches the sidestep');
}

{
  const m = fight();
  place(m, 1.3);
  const b = m.fs[1];
  m.step([F | D, F]); m.step([F | D | P2, F]);
  let teched = false;
  for (let i = 0; i < 90; i++) {
    const tech = b.state === 'air' && b.vy < 0 && b.pos[1] < 0.4 ? K3 : 0;
    m.step([0, b.state === 'walk' ? F : tech]);
    if (b.state === 'roll' && b.rollKind === 'tech') teched = true;
  }
  ok(teched, 'pressing a button on landing makes a tech roll');
}

{
  const m = fight();
  place(m, 1.0);
  m.fs[1].hp = 3;
  m.step([F, F]); m.step([F | P2, F]);
  run(m, 0, F, 20);
  run(m, 0, 0, 400);
  ok(m.wins[0] === 1 && m.round === 2, 'KO gives a round and the next round starts');
  for (let r = 0; r < 3 && m.phase !== 'over'; r++) {
    while (m.phase !== 'fight') m.step([0, 0]);
    m.fs[1].hp = 1;
    place(m, 1.0);
    m.step([F, F]); m.step([F | P2, F]);
    run(m, 0, F, 20); run(m, 0, 0, 500);
  }
  ok(m.phase === 'over' && m.matchWinner === 0, 'two round wins end the match');
}

{
  const m = fight(null, null, { time: 3 });
  run(m, 0, 0, 400);
  ok(m.round >= 2 && m.wins[0] === 1 && m.wins[1] === 1, 'time up with equal health is a draw for both');
}

const R = T.rosterOrder();
ok(R.length === 17, 'roster has 16 fighters and the second boss form');
ok(R.filter(d => !d.hidden).length === 10, 'ten fighters are available from the start');
ok(new Set(R.map(d => d.id)).size === R.length, 'fighter ids are unique');
ok(T.UNLOCK_ORDER.every(id => T.FIGHTER[id] && T.FIGHTER[id].hidden), 'unlock order lists the hidden fighters');
const STAGE_IDS = ['dojo', 'docks', 'garden', 'beach', 'factory', 'seoul', 'roof', 'forest', 'harbor', 'bangkok', 'circus', 'mountain', 'lab', 'castle', 'temple', 'temple2', 'training'];
for (const d of R) {
  ok(d.name && d.short && d.bio && d.quote && d.style && d.country && d.en, 'fighter card is complete: ' + d.id);
  ok(STAGE_IDS.includes(d.stage), 'home stage exists: ' + d.id);
  ok(d.costumes.length >= 2, 'fighter has costumes: ' + d.id);
  const ms = T.compileMoves(d);
  d.compiled = ms;
  ok(ms.cmds.length >= 30, 'moveset is large enough: ' + d.id + ' ' + ms.cmds.length);
  const ids = new Set();
  for (const m of ms.list) {
    ok(!ids.has(m.id), 'unique move id ' + d.id + ':' + m.id); ids.add(m.id);
    ok(m.total === m.st + m.act + m.rec && m.st >= 1 && m.act >= 1, 'frame data ' + d.id + ':' + m.id);
    if (m.l === 't') ok(T.THROWS[m.throw], 'throw script ' + d.id + ':' + m.id);
    if (m.nx) for (const n of m.nx) ok(ms.byId[n.id], 'chain target ' + d.id + ':' + m.id + '->' + n.id);
    if (m.p && m.p.req && m.p.req.startsWith('st:')) ok(d.stances && d.stances[m.p.req.slice(3)], 'stance defined ' + d.id + ':' + m.id);
    if (m.stance) ok(d.stances && d.stances[m.stance], 'entered stance defined ' + d.id + ':' + m.id);
  }
  const mm = new T.Match([d, R[0]], { skipIntro: true, seed: 1, mimicPool: T.mimicPool() });
  const an = new T.Animator(mm.fs[0]);
  let finite = true;
  for (const m of ms.list) {
    const keys = m.l === 't' ? an.grabTrack(m) : an.track(m);
    for (let f = 0; f <= m.total; f += 2) {
      const j = T.solve(T.evalTrack(keys, f, an.S), an.B);
      for (const k of ['head', 'anL', 'anR', 'fiL', 'fiR', 'knL', 'P']) if (!j[k].every(Number.isFinite)) finite = false;
    }
  }
  ok(finite, 'every animation frame is finite: ' + d.id);
}
for (const k of Object.keys(T.THROWS)) {
  const s = T.THROWS[k];
  ok(s.dur > 0 && s.v.length >= 2 && s.a.length >= 1 && s.end && s.dmg.length >= 1, 'throw script is complete: ' + k);
  ok(s.dmg.reduce((a, x) => a + x[1], 0) > 0.99 && s.dmg.reduce((a, x) => a + x[1], 0) < 1.01, 'throw damage parts add up: ' + k);
  const endBp = s.v[s.v.length - 1][2];
  const lying = Math.abs(Math.abs(T.wrapAngle(endBp)) - Math.PI / 2) < 0.2;
  ok(lying, 'throw victim ends lying: ' + k);
}

{
  let errors = 0, kos = 0, matches = 0, tooLong = 0;
  for (let i = 0; i < R.length; i++) {
    const a = R[i], b = R[(i + 5) % R.length];
    try {
      const m = new T.Match([a, b], { skipIntro: true, seed: 100 + i, mimicPool: T.mimicPool() });
      m.fs[0].brain = new T.Brain(3, i * 7 + 1);
      m.fs[1].brain = new T.Brain(3, i * 11 + 2);
      const an = m.fs.map(f => new T.Animator(f));
      let n = 0;
      while (m.phase !== 'over' && n < 60 * 60 * 6) {
        m.step([0, 0]); n++;
        if (n % 4 === 0) for (const x of an) x.update();
        for (const e of m.events) if (e.type === 'ko') kos++;
      }
      if (m.phase !== 'over') tooLong++;
      for (const f of m.fs) if (!f.pos.every(Number.isFinite)) errors++;
      matches++;
    } catch (e) { errors++; log(e.stack); }
  }
  ok(errors === 0, 'AI matches for every fighter run without errors');
  ok(matches === R.length && tooLong === 0, 'every AI match finishes');
  ok(kos >= R.length, 'AI matches end with knockouts');
}

{
  const wins = [0, 0];
  for (let s = 0; s < 8; s++) {
    const m = new T.Match([R[0], R[1]], { skipIntro: true, seed: 500 + s });
    m.fs[0].brain = new T.Brain(4, s * 3 + 1); m.fs[1].brain = new T.Brain(0.5, s * 5 + 2);
    let n = 0;
    while (m.phase !== 'over' && n < 20000) { m.step([0, 0]); n++; }
    if (m.matchWinner >= 0) wins[m.matchWinner]++;
  }
  ok(wins[0] >= 7, 'hardest AI beats the easiest AI: ' + wins);
}

{
  const K = T.FIGHTER.kenta;
  const m = fight(K, Object.assign({}, DB));
  place(m, 1.1);
  let jf = null;
  for (const b of [0, F, 0, D, D | F | P2]) { m.step([b, 0]); if (m.fs[0].move) jf = m.fs[0].move; }
  ok(jf && jf.p && jf.p.jf, 'Kenta: just-frame input gives the perfect uppercut');
  const m2 = fight(K, Object.assign({}, DB));
  place(m2, 1.1);
  let nm = null;
  for (const b of [0, F, 0, D, D | F, D | F | P2]) { m2.step([b, 0]); if (m2.fs[0].move) nm = m2.fs[0].move; }
  ok(nm && nm.id === 'f,n,d,df+2', 'Kenta: late button gives the normal uppercut');
  const m3 = fight(K, Object.assign({}, DB));
  place(m3, 1.6);
  let cd = null;
  for (const b of [0, F, 0, D, D | F, 0]) { m3.step([b, 0]); if (m3.fs[0].move) cd = m3.fs[0].move; }
  ok(cd && cd.id === 'f,n,d,df', 'Kenta: motion alone makes the crouch dash');
}

{
  const K = T.FIGHTER.kenta;
  const m = fight(Object.assign({}, DB), K);
  place(m, 0.9);
  const a = m.fs[0], b = m.fs[1];
  for (let i = 0; i < 4; i++) m.step([0, B | P1 | P2]);
  let rev = false;
  for (let i = 0; i < 30; i++) { m.step([i === 0 ? P1 : 0, 0]); if (a.state === 'thrown' && b.state === 'throw') rev = true; }
  ok(rev, 'Kenta: parry catches a jab and reverses it');
}

{
  const V = T.FIGHTER.volkov;
  const m = fight(V, Object.assign({}, DB));
  place(m, 1.2);
  const a = m.fs[0], b = m.fs[1];
  const hp0 = b.hp;
  for (const x of [F, 0, F, F | P1 | P2, F | P1 | P2]) m.step([x, 0]);
  let parts = 0;
  for (let i = 0; i < 400; i++) {
    let x = 0;
    const S = m.throwS;
    if (S && S.a === a && S.script.chain) {
      const c = S.script.chain[0];
      if (S.t === c.w[0] + 2 || S.t === c.w[0] + 3) x = c.bits;
    }
    m.step([x, 0]);
    for (const e of m.events) if (e.type === 'chain') parts = Math.max(parts, e.part);
  }
  ok(parts === 3, 'Volkov: chain throw reaches the third part: ' + parts);
  ok(hp0 - b.hp >= 90, 'Volkov: full chain throw deals heavy damage: ' + (hp0 - b.hp));
}

{
  const Y = T.FIGHTER.yalan;
  const m = fight(Y, Object.assign({}, DB));
  place(m, 1.0);
  const a = m.fs[0], b = m.fs[1];
  m.step([D | P1 | P2, 0]);
  run(m, 0, 0, 14);
  ok(a.state === 'stance' && a.stance === 'lotus', 'Yalan: d+1+2 enters the lotus stance');
  let hitsH = 0;
  m.step([0, P1]);
  for (let i = 0; i < 16; i++) { m.step([0, 0]); for (const e of m.events) if (e.type === 'hit' && e.d === a) hitsH++; }
  ok(hitsH === 0 && a.state === 'stance', 'Yalan: highs whiff over the lotus stance');
  place(m, 1.0);
  m.step([K4, F]);
  let launched = false;
  for (let i = 0; i < 40; i++) { m.step([0, b.state === 'walk' || b.state === 'idle' ? F : 0]); if (b.state === 'air') launched = true; }
  ok(launched, 'Yalan: lotus 4 launches');
}

{
  const C = T.FIGHTER.churban;
  const pool = T.mimicPool();
  const m = new T.Match([C, T.FIGHTER.kenta], { skipIntro: true, seed: 42, mimicPool: pool });
  const styles = new Set([m.fs[0].sd.id]);
  for (let r = 0; r < 4; r++) { m.startRound(); styles.add(m.fs[0].sd.id); }
  ok(m.fs[0].sd !== C && pool.includes(m.fs[0].sd), 'Churban fights with a borrowed style');
  ok(styles.size >= 2, 'Churban changes style between rounds');
  ok(!pool.includes(C) && !pool.some(d => d.boss), 'mimic pool excludes Churban and bosses');
}

{
  const save = T.freshSave();
  ok(save.unlocked.length === 0 && !save.force && !save.ball, 'fresh save has nothing unlocked');
  const L = new T.Ladder('arcade', 'kenta', save, 7);
  ok(L.list.length === 11, 'arcade ladder has 11 fights');
  ok(L.list[8].id === 'genzo' && L.list[9].id === 'colossus' && L.list[10].id === 'colossus2', 'ladder ends with Genzo and both Colossus forms');
  ok(!L.list.slice(0, 8).some(e => e.id === 'kenta'), 'ladder never pits a fighter against itself');
  ok(new Set(L.list.slice(0, 8).map(e => e.id)).size === 8, 'tournament opponents are all different');
  for (let seed = 1; seed < 40; seed++) { const X = new T.Ladder('arcade', 'ray', save, seed); ok(new Set(X.list.slice(0, 8).map(e => e.id)).size === 8 && !X.list.slice(0, 8).some(e => e.id === 'ray'), 'unique opponents for seed ' + seed); }
  const levels = L.list.map((e, i) => { L.stage = i; return L.aiLevel(); });
  ok(levels.every((v, i) => i === 0 || v >= levels[i - 1] - 0.36), 'AI level rises along the ladder');
  ok(levels[10] > levels[0] + 1, 'last fights are much harder than the first');
  const G = new T.Ladder('arcade', 'genzo', save, 7);
  ok(G.list[8].id === 'kenta', 'Genzo meets Kenta instead of himself');
  const unlocked = [];
  for (let i = 0; i < 9; i++) {
    const ev = T.onArcadeClear(save, i < 6 ? 'kenta' : 'colossus');
    ev.filter(e => e.kind === 'fighter').forEach(e => unlocked.push(e.id));
  }
  ok(unlocked.join() === T.UNLOCK_ORDER.join(), 'arcade clears unlock hidden fighters in order: ' + unlocked);
  ok(save.force && save.ball && save.theater, 'arcade clears unlock force, ball and theater');
  ok(T.costumesFor(save, T.FIGHTER.kenta) === T.FIGHTER.kenta.costumes.length, 'clearing arcade unlocks all costumes');
  ok(T.costumesFor(save, T.FIGHTER.ray) === 2, 'other fighters keep two costumes');
  const s2 = T.freshSave();
  const ev = T.onForceClear(s2, 12345, 'ray');
  ok(ev.some(e => e.id === 'liu') && s2.unlocked.includes('liu'), 'force clear unlocks Liu Sheng');
  ok(s2.records.force[0].score === 12345, 'force score recorded');
  const mem = new Map();
  const st = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)) };
  T.writeSave(save, st);
  const back = T.loadSave(st);
  ok(back.clears === save.clears && back.unlocked.join() === save.unlocked.join() && back.opts.rounds === save.opts.rounds, 'save round trip');
  ok(T.loadSave({ getItem: () => '{broken', setItem() {} }).v === 1, 'broken save falls back to defaults');
  const S = new T.Ladder('survival', 'ray', T.freshSave(), 3);
  ok(S.current() && S.matchOpts().keepHp && S.matchOpts().rounds === 1, 'survival fights are single rounds with carried health');
  S.won(100, 180);
  ok(S.hp === 100 + Math.round(180 * 0.12), 'survival restores some health between fights');
  const tm = new T.Team([{ def: R[0] }, { def: R[1] }], [{ def: R[2] }]);
  ok(tm.result(0, 90, 170) === 0 && tm.left(1) === 0, 'team battle ends when a side runs out of fighters');
}

{
  globalThis.Tk3 = T;
  T.SCREENS = T.SCREENS || {};
  T.FONT_H = T.FONT_H || 'sans-serif'; T.FONT_T = T.FONT_T || 'sans-serif';
  const Tb = require(path.join(DIR, 'tk-ball.js'));
  const m = new T.Match([R[3], R[2]], { noRounds: true, skipIntro: true, fixedCam: 0, time: 0, bounds: [-6, 6, -2.6, 2.6], seed: 9 });
  while (m.phase !== 'fight') m.step([0, 0]);
  const a = m.fs[0];
  a.pos = [-1.0, 0, 0]; a.yaw = 0; m.fs[1].pos = [3, 0, 0];
  const ball = new Tb.BallGame(1);
  ball.serve(0);
  ball.pos = [-0.25, 1.35, 0]; ball.vel = [0, 0.8, 0];
  let kicked = false, floor = null;
  m.step([P2, 0]);
  for (let i = 0; i < 240; i++) {
    m.step([0, 0]);
    ball.step(m);
    for (const e of ball.events) { if (e.type === 'kick') kicked = true; if (e.type === 'floor') floor = e; }
    if (floor) break;
  }
  ok(kicked, 'ball mode: a punch hits the ball');
  ok(floor && floor.side === 1 && floor.dmg >= 6, 'ball mode: the ball lands on the other side and hurts');
}

{
  const m = new T.Match([T.FIGHTER.kenta, T.FIGHTER.ray], { noRounds: true, skipIntro: true, fixedCam: 0, time: 0, seed: 4, bounds: [-5, 30, -2.4, 2.4] });
  while (m.phase !== 'fight') m.step([0, 0]);
  const pl = m.fs[0];
  pl.brain = new T.Brain(4, 3);
  pl.maxHp = pl.hp = 900;
  const foes = [];
  for (let i = 0; i < 3; i++) {
    const f = new T.Fighter(T.FIGHTER.ray, i + 1, m, { team: 1, hp: 30, dmgMul: 0.3 });
    f.pos = [2 + i, 0, (i - 1) * 1.2]; f.yaw = Math.PI; f.opp = pl; f.brain = new T.Brain(1, i + 5);
    if (i > 0) m.fs.push(f); else m.fs[1] = f;
    foes.push(f);
  }
  let n = 0;
  while (foes.some(f => f.hp > 0) && n < 60 * 90) {
    const t = foes.find(f => f.hp > 0);
    if (t) pl.opp = t;
    m.step([0, 0, 0]); n++;
  }
  ok(foes.every(f => f.hp <= 0) && m.phase === 'fight', 'force mode: several enemies fall and the match keeps going');
  ok(foes.every(f => f.state === 'ko'), 'force mode: defeated enemies stay down');
}

{
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/tekken3/' + f).concat(['js/apps/tekken3-app.js', 'tests/tekken3.test.js']);
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const noUrls = src => src.split('http:' + LINE).join('').split('https:' + LINE).join('');
  for (const f of files) {
    const src = noUrls(read(f));
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('css/apps/tekken3.css').includes(BLOCK), 'css has no comments');
  ok(!/<!--/.test(read('tekken3.html')), 'page has no comments');
  const html = read('index.html');
  const page = read('tekken3.html');
  const order = ['tk-core', 'tk-skel', 'tk-mesh', 'tk-gl', 'tk-anim', 'tk-cmd', 'tk-moves', 'tk-fight', 'tk-animator', 'tk-ai', 'tk-roster', 'tk-roster1', 'tk-roster2', 'tk-roster3', 'tk-render', 'tk-stages', 'tk-audio', 'tk-modes', 'tk-ui', 'tk-fightscr', 'tk-screens', 'tk-cine', 'tk-force', 'tk-ball', 'tk-flow'];
  let lastA = -1, lastB = -1;
  for (const f of order) {
    const needle = `js/apps/tekken3/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order in index.html and tekken3.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === order.length, 'every module is loaded by the pages');
  ok(html.indexOf('js/apps/tekken3-app.js') > lastA && html.includes('css/apps/tekken3.css'), 'desktop loads the app wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      tekken98_demo: {');
  const entry = gm.slice(at, at + 500);
  ok(at > 0 && /cdDemo: true/.test(entry) && !/steam: true/.test(entry) && /title: 'Tekken 98 Demo'/.test(entry) && /launch: \(\) => window\.appTekken3/.test(gm), 'catalog entry is an Igromania CD demo');
  const defaults = gm.slice(gm.indexOf('    return {\n      purchased:'), gm.indexOf('steamMigrated: true\n    };'));
  ok(defaults.length > 0 && !defaults.includes('tekken98_demo'), 'game is not preinstalled');
  ok(!/tekken3Granted/.test(gm), 'no auto-grant flags');
  ok(read('js/desktop.js').includes("isInstalled('tekken98_demo')") && read('js/taskbar.js').includes("isInstalled('tekken98_demo')") && read('js/filesystem.js').includes("gmInstalled.includes('tekken98_demo')"), 'desktop, Start menu and C:\\Games are gated on installation');
  ok(read('js/taskbar.js').includes("showOnCd('tekken98_demo')") && read('js/apps/explorer.js').includes("showOnCd('tekken98_demo')"), 'missing game points to the Igromania CD');
  ok(read('js/icons.js').includes("'tekken3': `<svg"), 'icon exists');
}

console.log(`tekken3: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
