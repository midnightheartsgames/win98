const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SIM_FILES, gameModules, loadGame, compute, render } = require('../tools/hsr-net-simver.cjs');

console.log('--- Testing the deterministic arena ---');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = loadGame(), HD = H.HD, N = HD.N;

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const short = sc => Object.assign({}, sc, { ticks: Math.min(sc.ticks, 600) });

function play(sc, seen) {
  const S = HD.goldenStart(sc);
  while (!S.A.over && S.A.tick < sc.ticks) HD.goldenTick(S, seen);
  return S;
}

test('the sim modules use only exact math and no clocks', () => {
  const banned = /Math\.(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|pow|exp|expm1|log|log2|log10|log1p|cbrt|hypot|random|fround)\b|\*\*|Date\.now|new Date|performance\./;
  for (const f of SIM_FILES) {
    const text = fs.readFileSync(path.join(DIR, f + '.js'), 'utf8');
    text.split('\n').forEach((line, i) => assert.ok(!banned.test(line), f + '.js:' + (i + 1) + ' uses inexact math or a clock: ' + line.trim().slice(0, 100)));
  }
});

test('own math stays close to the built-in functions', () => {
  let sin = 0, cos = 0, atan2 = 0, hypot = 0, asin = 0;
  for (let i = -20000; i <= 20000; i++) {
    const x = i * 0.00173, y = (i * 7 % 3001) * 0.0137 - 20.3;
    sin = Math.max(sin, Math.abs(N.sin(x) - Math.sin(x)));
    cos = Math.max(cos, Math.abs(N.cos(x) - Math.cos(x)));
    atan2 = Math.max(atan2, Math.abs(N.atan2(y, x) - Math.atan2(y, x)));
    hypot = Math.max(hypot, Math.abs(N.hypot(x, y) - Math.hypot(x, y)));
    const v = i / 20000;
    asin = Math.max(asin, Math.abs(N.asin(v) - Math.asin(v)));
  }
  for (const [name, err] of Object.entries({ sin, cos, atan2, hypot, asin })) assert.ok(err < 1e-12, name + ' is off by ' + err);
  assert.equal(N.atan2(0, 0), 0);
  assert.equal(N.atan2(1, 0), Math.PI / 2);
  assert.equal(N.atan2(-1, 0), -Math.PI / 2);
  assert.ok(Math.abs(N.atan2(0, -1) - Math.PI) < 1e-15);
  assert.ok(Math.abs(N.asin(1) - Math.PI / 2) < 1e-15);
  assert.equal(N.hypot(3, 4), 5);
});

test('the golden run matches the stored value and the version is fresh', () => {
  const now = compute(H);
  assert.equal(HD.GOLDEN, now.golden, 'golden run changed. If the arena changed on purpose run: node tools/hsr-net-simver.cjs');
  assert.equal(HD.SIM, now.sim, 'arena version is stale, run: node tools/hsr-net-simver.cjs');
  assert.equal(fs.readFileSync(path.join(DIR, 'hsr-hd-simver.js'), 'utf8').replace(/\r\n/g, '\n'), render(now));
  assert.match(HD.SIM, /^[0-9a-f]{8}$/);
});

test('the golden run covers heroes, abilities, traces, bosses and goods', () => {
  const job = HD.goldenRun(), heroes = Object.keys(HD.HEROES);
  assert.equal(job.parts.length, heroes.length * 2);
  for (const hero of heroes) {
    const casts = ['q', 'e', 'r'].filter(s => job.seen.has('cast:' + hero + ':' + s));
    assert.equal(casts.length, 3, hero + ' cast only ' + casts.join());
    assert.ok(job.seen.has('pick:' + hero + ':10') && job.seen.has('pick:' + hero + ':20'), hero + ' made no trace or eidolon pick');
  }
  const bosses = new Set(Object.values(HD.THREATS).flatMap(T => [T.small, T.big]));
  for (const b of bosses) assert.ok(job.seen.has('boss:' + b), 'boss ' + b + ' never came out');
  const kinds = [...job.seen];
  assert.ok(kinds.includes('buy:relic') && kinds.includes('buy:cone'), 'relics and cones are bought');
  for (const id of Object.keys(HD.DEVICES)) assert.ok(kinds.includes('buy:' + id), 'device ' + id + ' never bought');
  for (const id of Object.keys(HD.SUPPLIES)) assert.ok(kinds.includes('buy:' + id), 'supply ' + id + ' never bought');
});

test('two arenas with one seed match while a third one runs between them', () => {
  const [sa, sb] = HD.goldenScenarios().map(short);
  const solo = play(sa).A.stateHash();
  const A = HD.goldenStart(sa), B = HD.goldenStart(sa), other = HD.goldenStart(sb);
  while (A.A.tick < sa.ticks && !A.A.over) {
    HD.goldenTick(A);
    HD.goldenTick(other);
    HD.goldenTick(B);
    if (A.A.tick % 60 === 0) assert.equal(A.A.stateHash(), B.A.stateHash(), 'split on tick ' + A.A.tick);
  }
  assert.equal(A.A.stateHash(), solo);
});

test('a run can be replayed from its journal', () => {
  for (const sc of HD.goldenScenarios().filter((x, i) => i % 7 === 0).map(short)) {
    const S = HD.goldenStart(sc), log = HD.recordCmds(S.A), marks = {};
    while (!S.A.over && S.A.tick < sc.ticks) {
      HD.goldenTick(S);
      if (S.A.tick % 60 === 0) marks[S.A.tick] = S.A.stateHash();
    }
    assert.ok(log.length > 20, sc.hero + ' wrote a journal');
    const wire = JSON.parse(JSON.stringify(log)), R = HD.setupArena(sc);
    HD.replayLog(R, wire, sc.ticks, A => { if (marks[A.tick]) assert.equal(A.stateHash(), marks[A.tick], sc.hero + ' split on tick ' + A.tick); });
    assert.equal(R.stateHash(), S.A.stateHash(), sc.hero + ' final state');
  }
});

test('voice lines do not touch the battle', () => {
  const sc = short(HD.goldenScenarios()[2]), base = play(sc).A.stateHash(), saved = H.INFO;
  H.INFO = null;
  const silent = play(sc).A.stateHash();
  H.INFO = saved;
  assert.equal(silent, base, 'the state depends on the voice line table');
  const more = {};
  for (const [id, info] of Object.entries(saved)) more[id] = Object.assign({}, info, { battle: (info.battle || []).concat(info.battle || []) });
  H.INFO = more;
  const doubled = play(sc).A.stateHash();
  H.INFO = saved;
  assert.equal(doubled, base, 'the state depends on the number of voice lines');
});

test('the state hash sees a small change', () => {
  const sc = short(HD.goldenScenarios()[0]), A = play(sc).A, base = A.stateHash(), h = A.heroes[0], x = h.x;
  h.x = x + 1e-9;
  assert.notEqual(A.stateHash(), base);
  h.x = x;
  assert.equal(A.stateHash(), base);
  const r = A.rng;
  r();
  assert.notEqual(A.stateHash(), base);
});

test('a solo run and its save data stay the same shape', () => {
  const g = new H.Game({ fresh: true, seed: 5 }), run = g.hdNew({ hero: 'himeko', seed: 41, diff: 'hard' }), same = HD.newRun({ hero: 'himeko', seed: 41, diff: 'hard' });
  assert.deepEqual(JSON.parse(JSON.stringify(run)), JSON.parse(JSON.stringify(same)));
  assert.equal(g.hd().run, run);
  assert.equal(g.hd().hero, 'himeko');
  const auto = new H.Game({ fresh: true, seed: 5 }).hdNew({});
  assert.ok(auto.seed > 0 && auto.phase === 'draft' && auto.draft.cards.length === 3 && auto.threats.length === 2);
});

test('the new modules load in the same order everywhere', () => {
  const need = ['hsr-hd-data', 'hsr-hd-math', 'hsr-hd-arena', 'hsr-hd-heroes', 'hsr-hd-foes', 'hsr-hd-shop', 'hsr-hd', 'hsr-hd-net', 'hsr-hd-simver', 'hsr-gfx'];
  assert.deepEqual(gameModules().concat('hsr-gfx').filter(f => need.includes(f)), need);
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const listed = [...index.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]).filter(f => need.includes(f));
  assert.deepEqual(listed, need);
});

const TS = 32, TUN = HD.TUN;
const crewArena = (heroes, o) => HD.setupArena(Object.assign({ heroes, seed: 77, threats: ['legion', 'silvermane'], diff: 'normal' }, o || {}));
const toWave = A => { A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; return A; };
const stepN = (A, n) => { for (let i = 0; i < n; i++) A.step(); };

test('the simulation does not reach for one hero', () => {
  for (const f of ['hsr-hd-arena', 'hsr-hd-heroes', 'hsr-hd-foes', 'hsr-hd-shop']) {
    const text = fs.readFileSync(path.join(DIR, f + '.js'), 'utf8');
    text.split('\n').forEach((line, i) => assert.ok(!/\b(A\d?|this)\.hero\b/.test(line), f + '.js:' + (i + 1) + ' uses A.hero'));
  }
  const A = crewArena(['trail', 'himeko']);
  assert.equal(A.hero, A.heroes[0]);
});

test('a crew starts with its own heroes, places and money', () => {
  const A = crewArena(['trail', 'himeko', 'seele', 'bailu']);
  assert.deepEqual(A.heroes.map(h => h.key), ['trail', 'himeko', 'seele', 'bailu']);
  assert.deepEqual(A.heroes.map(h => h.pl), [0, 1, 2, 3]);
  assert.equal(new Set(A.heroes.map(h => h.x + ',' + h.y)).size, 4, 'heroes stand apart');
  assert.ok(A.heroes.every(h => h.gold === TUN.startGold && h.lvl === 1 && !A.solidAt(h.x, h.y)));
  const solo = HD.setupArena({ hero: 'trail', seed: 77 }), S = solo.M.spawn;
  assert.equal(solo.heroes[0].x, S[0] * TS + 16);
  assert.equal(solo.heroes[0].y, S[1] * TS + 16);
  assert.equal(crewArena(['trail', 'trail2', 'himeko', 'seele', 'bailu', 'kafka']).heroes.length, 4, 'wrong ids drop and the crew holds four');
});

test('commands go to the hero of their place', () => {
  const A = crewArena(['trail', 'himeko']), [a, b] = A.heroes, ax = a.x, bx = b.x;
  A.cmd({ p: 1, t: 'move', dx: 1, dy: 0 });
  stepN(A, 10);
  assert.equal(a.x, ax);
  assert.ok(b.x > bx + 20);
  A.cmd({ p: 7, t: 'move', dx: 1, dy: 0 });
  stepN(A, 1);
});

test('a kill pays every hero the same without a race', () => {
  const A = toWave(crewArena(['trail', 'himeko', 'seele'])), [a, b, c] = A.heroes, f = A.spawnFoe('reaver', 'n');
  f.x = a.x + 30; f.y = a.y;
  for (const h of A.heroes) h.gold = 0;
  const hp = f.hp;
  A.waveN = 3;
  A.hit(b, f, { amt: hp * 100, type: 'divine', noCrit: true });
  assert.ok(f.dead);
  assert.ok(a.gold > 0);
  assert.ok(a.gold === b.gold && b.gold === c.gold, 'gold ' + [a.gold, b.gold, c.gold]);
  assert.equal(b.st.kills, 1);
  assert.equal(a.st.kills, 0);
  assert.equal(A.stats.kills, 1);
  assert.equal(a.st.gold, a.gold);
  assert.ok(a.exp > 0 && b.exp > 0, 'heroes nearby get experience');
  const raid = toWave(crewArena(['trail', 'himeko'])), r = raid.rift('n');
  raid.heroes[0].gold = 0; raid.heroes[1].gold = 0;
  const v = raid.spawnFoe('reaver', 'n');
  v.x = r.x; v.y = r.y;
  raid.hit(raid.heroes[0], v, { amt: 1e9, type: 'divine', noCrit: true });
  assert.ok(raid.heroes[0].gold > raid.heroes[1].gold, 'a raid bonus goes only to the killer');
  const far = toWave(crewArena(['trail', 'himeko']));
  far.heroes[1].x = far.heroes[1].px = 2 * TS; far.heroes[1].y = far.heroes[1].py = 2 * TS;
  const w = far.spawnFoe('reaver', 'e');
  w.x = far.heroes[0].x + 20; w.y = far.heroes[0].y;
  far.hit(far.heroes[0], w, { amt: 1e9, type: 'divine', noCrit: true });
  assert.ok(far.heroes[0].exp > 0);
  assert.equal(far.heroes[1].exp, 0, 'a far hero gets no experience');
  const tur = toWave(crewArena(['trail', 'himeko']));
  tur.heroes[0].gold = 0; tur.heroes[1].gold = 0;
  const x = tur.spawnFoe('reaver', 'e');
  tur.hit(tur.turrets[0], x, { amt: 1e9, type: 'divine', noCrit: true });
  assert.ok(tur.heroes[0].gold > 0 && tur.heroes[0].gold === tur.heroes[1].gold, 'a turret kill pays the share to everyone');
  assert.equal(tur.stats.kills, 0);
});

test('wave money goes to every hero', () => {
  const A = toWave(crewArena(['trail', 'himeko']));
  for (const h of A.heroes) h.gold = 0;
  A.waveT = 0; A.secT = 0;
  stepN(A, 31);
  assert.deepEqual(A.heroes.map(h => h.gold), [TUN.goldSec, TUN.goldSec]);
  A.sched = [];
  stepN(A, 1);
  assert.equal(A.phase, 'break');
  assert.ok(A.heroes[0].gold > TUN.goldSec && A.heroes[0].gold === A.heroes[1].gold);
  assert.ok(A.heroes[0].exp > 0 && A.heroes[0].exp === A.heroes[1].exp);
});

test('the early wave needs every voice', () => {
  const A = crewArena(['trail', 'himeko', 'seele']), g0 = A.heroes[0].gold;
  A.cmd({ p: 0, t: 'early' });
  stepN(A, 1);
  assert.equal(A.phase, 'break');
  assert.deepEqual(A.earlyVotes(), { n: 1, of: 3 });
  assert.ok(A.events.some(e => e.t === 'vote' && e.n === 1 && e.of === 3));
  A.cmd({ p: 0, t: 'early' });
  stepN(A, 1);
  assert.deepEqual(A.earlyVotes(), { n: 1, of: 3 }, 'one voice counts once');
  A.cmd({ p: 1, t: 'early' });
  A.cmd({ p: 2, t: 'early' });
  stepN(A, 1);
  assert.equal(A.phase, 'wave');
  assert.ok(A.heroes.every(h => h.gold > g0 && h.gold === A.heroes[0].gold && !h.vote));
  const solo = HD.setupArena({ hero: 'trail', seed: 77 });
  solo.cmd({ t: 'early' });
  stepN(solo, 1);
  assert.equal(solo.phase, 'wave', 'alone the wave starts at once');
});

test('away and idle players do not count in the next wave', () => {
  const A = crewArena(['trail', 'himeko', 'seele']);
  A.cmd({ p: 2, t: 'away', on: true });
  A.cmd({ p: 0, t: 'early' }); A.cmd({ p: 1, t: 'early' });
  stepN(A, 1);
  assert.equal(A.phase, 'wave', 'the away player has no voice');
  assert.equal(A.waveN, 2);
  const B = crewArena(['trail', 'himeko', 'seele']);
  B.time = TUN.coop.idle + 1;
  B.cmd({ p: 0, t: 'stop' }); B.cmd({ p: 1, t: 'stop' });
  stepN(B, 1);
  B.startWave();
  assert.equal(B.waveN, 2, 'a silent player does not count');
  const C = crewArena(['trail', 'himeko']);
  C.heroes.forEach(h => { h.away = true; });
  C.startWave();
  assert.equal(C.waveN, 2, 'nobody online still means a valid wave');
  const D = crewArena(['trail', 'himeko']);
  D.heroes[1].away = true;
  D.cmd({ p: 1, t: 'away', on: false });
  stepN(D, 1);
  assert.equal(D.heroes[1].away, false);
});

test('foes grow with the crew and stay the same alone', () => {
  const at = (heroes, wave, id, key, o) => { const A = heroes.length > 1 ? crewArena(heroes, { wave }) : HD.setupArena({ hero: heroes[0], seed: 77, threats: ['legion', 'silvermane'], wave }); A.phase = 'wave'; return A.spawnFoe(id, key, o || {}).hpMax; };
  const one = at(['trail'], 1, 'reaver', 'n'), two = at(['trail', 'himeko'], 1, 'reaver', 'n'), four = at(['trail', 'himeko', 'seele', 'bailu'], 1, 'reaver', 'n');
  assert.equal(two, Math.round(one * TUN.coop.hp[1]));
  assert.equal(four, Math.round(one * TUN.coop.hp[3]));
  const late1 = at(['trail'], 20, 'reaver', 'n'), late2 = at(['trail', 'himeko'], 20, 'reaver', 'n');
  assert.ok(Math.abs(late2 / late1 - TUN.coop.hpEnd[1]) < 0.01, 'late foes follow the end of the table');
  const boss1 = at(['trail'], 10, 'doomsday', 'n'), boss4 = at(['trail', 'himeko', 'seele', 'bailu'], 10, 'doomsday', 'n');
  const kBoss = TUN.coop.bossHp[3] + (TUN.coop.bossEnd[3] - TUN.coop.bossHp[3]) * 9 / 19;
  assert.ok(Math.abs(boss4 / boss1 - kBoss) < 0.01);
  const count = heroes => { const A = heroes.length > 1 ? crewArena(heroes, { wave: 9 }) : HD.setupArena({ hero: heroes[0], seed: 77, threats: ['legion', 'silvermane'], wave: 9 }); A.startWave(); return A.sched.reduce((n, g) => n + g.ids.length, 0); };
  assert.ok(count(['trail', 'himeko', 'seele', 'bailu']) > count(['trail']) * 1.4, 'a full crew meets more foes');
  for (const name of ['hp', 'hpEnd', 'bossHp', 'bossEnd', 'groups', 'gold', 'exp']) assert.equal(TUN.coop[name][0], 1, name + ' keeps solo as it was');
});

test('support abilities reach living allies', () => {
  const pair = (who, other) => { const A = crewArena([who, other]), [u, v] = A.heroes; u.abil = { q: 1, e: 1, t: 1, r: 1 }; u.en = u.enMax = 1000; v.x = u.x + 40; v.y = u.y; v.px = v.x; v.py = v.y; return { A, u, v }; };
  {
    const { A, u, v } = pair('natasha', 'trail');
    v.hp = v.hpMax * 0.5;
    const hp0 = v.hp;
    A.cmd({ p: 0, t: 'cast', slot: 'q', id: v.uid });
    stepN(A, 1);
    assert.ok(v.hp > hp0, 'Natasha heals an ally');
    assert.ok(u.st.heal > 0, 'the healer gets the credit');
  }
  {
    const { A, v } = pair('bronya', 'trail');
    A.cmd({ p: 0, t: 'cast', slot: 'q', id: v.uid });
    stepN(A, 1);
    assert.ok(v.fx.some(f => f.n === 'Боевой приказ'), 'Bronya orders an ally');
  }
  {
    const { A, v } = pair('march', 'trail');
    A.cmd({ p: 0, t: 'cast', slot: 'q', id: v.uid });
    stepN(A, 1);
    assert.ok(v.fx.some(f => f.k === 'shield' && f.by === 'march'), 'March shields an ally');
  }
  {
    const { A, u, v } = pair('fuxuan', 'trail');
    toWave(A);
    A.cmd({ p: 0, t: 'cast', slot: 'q' });
    stepN(A, 1);
    const f = A.spawnFoe('reaver', 'n'), hp0 = v.hp, mine = u.hp;
    A.hit(f, v, { amt: 100, type: 'divine', noCrit: true });
    assert.ok(hp0 - v.hp < 100 && mine > u.hp, 'Fu Xuan takes a part of the hit on an ally');
  }
  {
    const { A, u, v } = pair('bailu', 'trail');
    v.hp = 1;
    toWave(A);
    A.die(v, null, {});
    assert.ok(!v.dead && v.hp > 1, 'Bailu saves a falling ally');
    assert.equal(u.tal.saved, 1);
  }
  {
    const { A, v } = pair('luocha', 'trail');
    A.heroes[0].tal.zone = A.time + 5;
    v.hp = v.hpMax * 0.5;
    const hp0 = v.hp, f = toWave(A).spawnFoe('reaver', 'n');
    A.hit(v, f, { amt: 1, kind: 'basic', type: 'divine', noCrit: true });
    assert.ok(v.hp > hp0, 'an ally heals by hitting in the Luocha zone');
  }
});

test('Silver Wolf brings the weakness of her allies', () => {
  const A = toWave(crewArena(['silverwolf', 'himeko'])), [u, v] = A.heroes, f = A.spawnFoe('reaver', 'n');
  u.abil.q = 1; u.en = u.enMax = 1000;
  f.weak = []; f.resist = []; f.hp = f.hpMax = 1e7;
  f.x = u.x + 40; f.y = u.y; f.toughMax = 0;
  const hitFire = () => { const before = f.hp; A.hit(v, f, { amt: 100, type: 'divine', elem: 'fire', noCrit: true, noTough: true }); return before - f.hp; };
  const plain = hitFire();
  A.cmd({ p: 0, t: 'cast', slot: 'q', id: f.uid });
  stepN(A, 1);
  assert.ok(hitFire() > plain * 1.2, 'fire now hits a weakness');
  const solo = toWave(HD.setupArena({ hero: 'silverwolf', seed: 77, threats: ['legion', 'silvermane'] })), g = solo.spawnFoe('reaver', 'n');
  solo.heroes[0].abil.q = 1; solo.heroes[0].en = solo.heroes[0].enMax = 1000;
  g.x = solo.heroes[0].x + 40; g.y = solo.heroes[0].y; g.hp = g.hpMax = 1e7;
  solo.cmd({ t: 'cast', slot: 'q', id: g.uid });
  stepN(solo, 1);
  assert.equal(g.fx.find(x => x.k === 'weakAdd').elems, null, 'alone only the quantum weakness');
});

test('bosses mark the nearest living hero', () => {
  const A = toWave(crewArena(['trail', 'himeko'])), [a, b] = A.heroes, u = A.spawnFoe('reaver', 'n');
  a.x = u.x + 500; b.x = u.x + 100; a.y = b.y = u.y;
  assert.equal(A.nearestHero(u), b);
  b.dead = true;
  assert.equal(A.nearestHero(u), a);
  a.dead = true;
  assert.equal(A.nearestHero(u), A.heroes[0], 'with everyone down the first hero answers');
});

test('personal events carry their owner', () => {
  const A = crewArena(['trail', 'himeko']);
  A.events.length = 0;
  A.cmd({ p: 1, t: 'cast', slot: 'q' });
  stepN(A, 1);
  const deny = A.events.find(e => e.t === 'deny');
  assert.ok(deny && deny.p === 1, 'a refusal belongs to the one who asked');
  A.events.length = 0;
  A.giveGold(A.heroes[1], 50, null);
  assert.equal(A.events.find(e => e.t === 'gold').p, 1);
  A.events.length = 0;
  A.giveExp(A.heroes[0], 1e4);
  assert.ok(A.events.filter(e => e.t === 'level').every(e => e.p === 0));
  const ui = fs.readFileSync(path.join(DIR, 'hsr-ui-hd-arena.js'), 'utf8');
  assert.ok(/MINE_ONLY\.has\(e\.t\)/.test(ui) && /A\.heroes\[me\]/.test(ui), 'the screen filters by its own place');
});

test('a crew saves each player to the run', () => {
  const A = crewArena(['trail', 'himeko']), run = A.run;
  A.heroes[1].gold = 777; A.heroes[1].lvl = 9;
  A.toRun(run);
  assert.equal(run.players[1].gold, 777);
  assert.equal(run.players[1].lvl, 9);
  assert.equal(run.players[0].hero, 'trail');
  assert.deepEqual(Object.keys(run.players[1].st).sort(), ['dmg', 'gold', 'heal', 'kills']);
  const B = new HD.Arena({ run: JSON.parse(JSON.stringify(run)) });
  assert.equal(B.heroes[1].gold, 777);
  assert.equal(B.heroes.length, 2);
});

test('the crew golden run matches, covers bosses and replays from its journal', () => {
  const job = HD.goldenRun(true);
  assert.equal(job.hash, HD.GOLDEN_CREW);
  assert.ok(job.seen.has('boss:doomsday') || job.seen.has('boss:cocolia1'), 'crews met a boss');
  const check = HD.goldenCheck();
  while (!check.step(5000));
  assert.ok(check.same && check.hash === HD.GOLDEN && check.crewHash === HD.GOLDEN_CREW);
  const list = HD.goldenCrewScenarios().filter((x, i) => i % 3 === 0).map(short);
  assert.ok(list.some(sc => sc.heroes.length === 4) || HD.goldenCrewScenarios().some(sc => sc.heroes.length === 4));
  for (const sc of list) {
    const S = HD.goldenStart(sc), log = HD.recordCmds(S.A), marks = {};
    while (!S.A.over && S.A.tick < sc.ticks) {
      HD.goldenTick(S);
      if (S.A.tick % 60 === 0) marks[S.A.tick] = S.A.stateHash();
    }
    const R = HD.setupArena(sc);
    HD.replayLog(R, JSON.parse(JSON.stringify(log)), sc.ticks, A => { if (marks[A.tick]) assert.equal(A.stateHash(), marks[A.tick], sc.heroes + ' split on tick ' + A.tick); });
    assert.equal(R.stateHash(), S.A.stateHash());
  }
});

const CREW_NAMES = n => Array.from({ length: n }, (_, i) => 'P' + (i + 1));

function localCrew(n, o = {}) {
  const sent = [], hashes = [];
  const sessions = CREW_NAMES(n).map((_, seat, names) => new HD.NetSession({
    code: 'TEST', seed: o.seed || 777, diff: o.diff || 'normal', seat, ticks: 2, turnMs: 200 / 3, names, clock: () => performance.now(),
    send: c => sent.push(Object.assign({}, c, { p: seat })),
    onHash: (tick, h) => { (hashes[seat] = hashes[seat] || new Map()).set(tick, h); }
  }));
  const crew = { sessions, sent, hashes, turn: 0, journal: [] };
  crew.close = () => {
    crew.turn++;
    const c = sent.splice(0);
    if (c.length) crew.journal.push([crew.turn].concat(c));
    for (const s of sessions) s.feed(c.length ? { op: 't', n: crew.turn, c } : { op: 't', n: crew.turn });
  };
  crew.run = turns => { for (let i = 0; i < turns; i++) { crew.close(); for (const s of sessions) s.advance(1 / 15); } };
  crew.pickAll = () => {
    sessions.forEach(s => s.send({ t: 'take', i: 0 }));
    crew.run(1);
    assert.ok(sessions.every(s => s.A), 'the arena starts when everyone has a hero');
  };
  return crew;
}

function sameHashes(hashes, min) {
  const [first, ...rest] = hashes;
  let common = 0;
  for (const other of rest) for (const [tick, h] of other) if (first.has(tick)) { common++; assert.equal(h, first.get(tick), 'hash at tick ' + tick); }
  assert.ok(common >= min, 'hashes compared: ' + common);
}

test('a command from the journal is cleaned: only known kinds, known fields, sane values', () => {
  const clean = c => HD.netClean(Object.assign({ p: 1 }, c), 4);
  const set = Object.keys(H.RELIC_SETS)[0], slot = Object.keys(H.RELIC_SETS[set].pieces)[0], cone = Object.keys(H.CONES)[0], dev = Object.keys(HD.DEVICES)[0], sup = Object.keys(HD.SUPPLIES)[0];
  assert.deepEqual(clean({ t: 'move', dx: 1, dy: -1, junk: 5 }), { t: 'move', p: 1, dx: 1, dy: -1 });
  assert.deepEqual(clean({ t: 'goto', x: 10.5, y: 20 }), { t: 'goto', p: 1, x: 10.5, y: 20 });
  assert.deepEqual(clean({ t: 'attack', id: 7 }), { t: 'attack', p: 1, id: 7 });
  assert.deepEqual(clean({ t: 'target', id: null }), { t: 'target', p: 1, id: null });
  assert.deepEqual(clean({ t: 'hold' }), { t: 'hold', p: 1 });
  assert.deepEqual(clean({ t: 'cast', slot: 'q', id: 3, x: 1, y: 2 }), { t: 'cast', p: 1, slot: 'q', id: 3, x: 1, y: 2 });
  assert.deepEqual(clean({ t: 'cast', slot: 'r' }), { t: 'cast', p: 1, slot: 'r' });
  assert.deepEqual(clean({ t: 'up', slot: 't' }), { t: 'up', p: 1, slot: 't' });
  assert.deepEqual(clean({ t: 'pick', i: 1 }), { t: 'pick', p: 1, i: 1 });
  assert.deepEqual(clean({ t: 'pick', i: 0, lvl: 10 }), { t: 'pick', p: 1, i: 0, lvl: 10 });
  assert.deepEqual(clean({ t: 'use', i: 5, x: 1, y: 1 }), { t: 'use', p: 1, i: 5, x: 1, y: 1 });
  assert.deepEqual(clean({ t: 'buy', id: 'relic', set, slot }), { t: 'buy', p: 1, id: 'relic', set, slot });
  assert.deepEqual(clean({ t: 'buy', id: 'cone', cone }), { t: 'buy', p: 1, id: 'cone', cone });
  assert.deepEqual(clean({ t: 'buy', id: dev }), { t: 'buy', p: 1, id: dev });
  assert.deepEqual(clean({ t: 'buy', id: sup }), { t: 'buy', p: 1, id: sup });
  assert.deepEqual(clean({ t: 'upgrade', i: 'cone' }), { t: 'upgrade', p: 1, i: 'cone' });
  assert.deepEqual(clean({ t: 'restore', i: 2 }), { t: 'restore', p: 1, i: 2 });
  assert.deepEqual(clean({ t: 'take', i: 2 }), { t: 'take', p: 1, i: 2 });
  for (const bad of [
    { t: 'nothing' }, { t: '__proto__' }, { t: 'constructor' }, {}, { t: 5 },
    { t: 'move', dx: NaN, dy: 0 }, { t: 'move', dx: 5, dy: 0 }, { t: 'move', dx: '1', dy: 0 }, { t: 'move' },
    { t: 'goto', x: 1e9, y: 0 }, { t: 'goto', x: -5, y: 0 }, { t: 'goto', x: 1 },
    { t: 'attack', id: 'x' }, { t: 'attack', id: 1.5 }, { t: 'attack' }, { t: 'target', id: 'x' },
    { t: 'cast', slot: 'x' }, { t: 'cast', slot: '__proto__' }, { t: 'up', slot: 'constructor' }, { t: 'pick', i: 2 }, { t: 'pick' },
    { t: 'use', i: 6 }, { t: 'use', i: -1 }, { t: 'use', i: 'cone' }, { t: 'sell', i: 9 }, { t: 'upgrade', i: 'x' }, { t: 'restore', i: 3 },
    { t: 'buy', id: '__proto__' }, { t: 'buy', id: 'relic', set: '__proto__', slot: 'x' }, { t: 'buy', id: 'relic', set, slot: 'constructor' }, { t: 'buy', id: 'cone', cone: 'toString' }, { t: 'buy' },
    { t: 'refresh', i: 3 }, { t: 'take', i: 'x' }
  ]) assert.equal(clean(bad), null, JSON.stringify(bad));
  assert.equal(HD.netClean({ t: 'stop', p: 4 }, 4), null, 'a seat past the crew');
  assert.equal(HD.netClean({ t: 'stop', p: -1 }, 4), null);
  assert.equal(HD.netClean({ t: 'stop' }, 4), null, 'no seat');
  assert.equal(HD.netClean(null, 4), null);
  const stray = clean({ t: 'cast', slot: 'q', x: 1e9, y: 1, id: -1 });
  assert.deepEqual(stray, { t: 'cast', p: 1, slot: 'q' }, 'a bad aim is dropped, the cast stays');
});

test('every seat rolls its own cards from one table seed, and the threats are shared', () => {
  const { sessions } = localCrew(4);
  const cards = sessions[0].drafts.map(R => R.draft.cards.map(c => c.hero).join());
  assert.ok(new Set(cards).size >= 2, 'seats roll differently');
  for (const s of sessions) {
    assert.deepEqual(s.drafts.map(R => R.draft.cards.map(c => c.hero).join()), cards, 'all clients see the same rolls');
    assert.deepEqual(s.drafts[3].threats, HD.rollThreats(777), 'threats come from the table seed');
  }
  assert.equal(Math.round(sessions[0].draftLeft()), 30);
});

test('a hero taken by one player leaves the other cards for free', () => {
  const crew = localCrew(2), [a] = crew.sessions, cardA = a.drafts[0].draft.cards[0];
  for (const s of crew.sessions) { const c = s.drafts[1].draft.cards[1]; c.hero = cardA.hero; c.path = cardA.path; c.seen = [cardA.hero]; }
  const before = a.drafts[1].draft.cards[1].left;
  a.send({ t: 'take', i: 0 });
  crew.run(1);
  const got = crew.sessions.map(s => s.drafts[1].draft.cards[1]);
  assert.notEqual(got[0].hero, cardA.hero, 'the card changes');
  assert.equal(got[0].hero, got[1].hero, 'the same on every client');
  assert.equal(got[0].left, before, 'and costs nothing');
  assert.equal(a.takes[0], cardA.hero);
  assert.equal(a.A, null, 'the second player still chooses');
  for (let i = 0; i < 2; i++) { crew.sessions[1].send({ t: 'refresh', i: 0 }); crew.run(1); }
  assert.ok(!crew.sessions[0].drafts[1].draft.cards.some(c => c.hero === cardA.hero), 'a refresh never gives a taken hero');
  assert.equal(crew.sessions[0].drafts[1].draft.cards[0].left, 0, 'two refreshes per card');
  crew.sessions[1].send({ t: 'take', i: 0 });
  crew.run(1);
  const heroes = crew.sessions.map(s => s.A.heroes.map(h => h.key).join());
  assert.equal(heroes[0], heroes[1]);
  assert.equal(new Set(crew.sessions[0].A.heroes.map(h => h.key)).size, 2, 'no repeated heroes');
});

test('heroes stay unique even when every player takes from one path', () => {
  const crew = localCrew(4), path = HD.draftPaths().find(p => HD.heroesOf(p).length === 3) || HD.draftPaths()[0];
  for (const s of crew.sessions) for (const R of s.drafts) for (const [i, c] of R.draft.cards.entries()) { if (i === 0) { c.path = path; c.hero = HD.heroesOf(path)[0]; c.seen = [c.hero]; } }
  for (let p = 0; p < 4; p++) { crew.sessions[p].send({ t: 'take', i: 0 }); crew.run(1); }
  const keys = crew.sessions[0].A.heroes.map(h => h.key);
  assert.equal(new Set(keys).size, 4, keys.join());
  assert.ok(keys.every(k => HD.HEROES[k]));
  assert.deepEqual(crew.sessions[3].A.heroes.map(h => h.key), keys);
});

test('the draft ends by itself: the first card for those who did not choose', () => {
  const crew = localCrew(2), first = crew.sessions[0].drafts[1].draft.cards[0].hero;
  crew.sessions[0].send({ t: 'take', i: 2 });
  crew.run(crew.sessions[0].draftTurns - 1);
  assert.equal(crew.sessions[0].A, null);
  assert.equal(crew.sessions[0].draftLeft() > 0, true);
  crew.run(1);
  assert.ok(crew.sessions[0].A, 'the arena starts on the last draft turn');
  const keys = crew.sessions[1].A.heroes.map(h => h.key);
  assert.equal(keys[0], crew.sessions[0].takes[0]);
  assert.ok(keys[1] === first || keys[0] === first, keys.join());
  assert.notEqual(keys[0], keys[1]);
});

test('commands wait for the arena and a player lost during the draft starts away', () => {
  const crew = localCrew(2), [a, b] = crew.sessions;
  a.send({ t: 'move', dx: 1, dy: 0 });
  crew.sent.push({ t: 'away', on: true, p: 1 });
  crew.run(1);
  a.send({ t: 'take', i: 0 });
  b.send({ t: 'take', i: 0 });
  crew.run(2);
  for (const s of crew.sessions) {
    assert.equal(s.A.heroes[0].moveDir, null, 'a draft command is not carried over');
    assert.equal(s.A.heroes[1].away, true);
    assert.equal(s.A.heroes[0].away, false);
  }
});

test('commands of a turn land before its first tick, on the seat the server wrote', () => {
  const crew = localCrew(2);
  crew.pickAll();
  const [a, b] = crew.sessions, tick = a.A.tick;
  b.send({ t: 'move', dx: 1, dy: 0, p: 0 });
  crew.close();
  a.advance(0.1);
  assert.ok(a.A.tick > tick);
  assert.equal(a.A.heroes[1].moveDir.x, 1);
  assert.equal(a.A.heroes[0].moveDir, null, 'the seat inside the command does not count, the server wrote its own');
  crew.run(1);
});

test('the pace follows the journal: wait when empty, gentle catching up, a burst when far behind', () => {
  const crew = localCrew(2);
  crew.pickAll();
  const a = crew.sessions[0], A = a.A;
  for (let i = 0; i < 40; i++) a.advance(1 / 60);
  while (a.credit() > 0) a.advance(1 / 60);
  const t0 = A.tick;
  for (let i = 0; i < 30; i++) a.advance(1 / 60);
  assert.equal(A.tick, t0, 'no turns, no ticks');
  assert.ok(a.acc <= HD.DT + 1e-9, 'waiting banks no time');
  crew.close();
  assert.equal(a.credit(), 2);
  let frames = 0;
  while (a.credit() > 0 && frames < 30) { a.advance(1 / 60); frames++; }
  assert.equal(A.tick, t0 + 2);
  assert.ok(frames >= 2 && frames <= 8, 'a turn takes about its time: ' + frames);
  for (let i = 0; i < 6; i++) crew.close();
  assert.equal(a.credit(), 12);
  const t1 = A.tick;
  for (let i = 0; i < 12; i++) a.advance(1 / 60);
  assert.ok(A.tick - t1 >= 7, 'quicker than real time: ' + (A.tick - t1));
  for (let i = 0; i < 400; i++) crew.close();
  const t2 = A.tick;
  a.advance(1 / 60);
  assert.ok(a.catching || a.credit() <= HD.NET.steady, 'far behind means catching up');
  assert.ok(A.tick - t2 > 100, 'a burst covers many ticks at once: ' + (A.tick - t2));
  assert.equal(A.events.length, 0, 'a burst makes no noise');
  let guard = 0;
  while (a.catching && guard++ < 100) a.advance(1 / 60);
  assert.equal(a.catching, false);
  assert.ok(a.credit() <= HD.NET.steady);
  assert.equal(crew.hashes[0], undefined, 'a burst sends no hashes');
});

test('the draft lasts 30 seconds at any turn length', () => {
  const longTurns = localCrew(2).sessions[0];
  assert.equal(longTurns.draftTurns, 450);
  const shortTurns = new HD.NetSession({ code: 'S', seed: 5, diff: 'easy', seat: 0, ticks: 1, turnMs: 100 / 3, names: ['A', 'B'], clock: () => 0, send() {}, onHash() {} });
  assert.equal(shortTurns.draftTurns, 900);
  assert.equal(Math.round(shortTurns.draftLeft()), 30);
});

test('turns of one tick: the arena runs without a reserve, and a message may cover many turns', () => {
  const sent = [];
  const s = new HD.NetSession({ code: 'S', seed: 5, diff: 'easy', seat: 0, ticks: 1, turnMs: 100 / 3, names: ['A', 'B'], clock: () => performance.now(), send: c => sent.push(c), onHash() {} });
  s.feedLog({ upto: 1, turns: [[1, { t: 'take', i: 0, p: 0 }, { t: 'take', i: 0, p: 1 }]] });
  s.advance(1 / 60);
  assert.ok(s.A);
  const t0 = s.A.tick;
  s.feed({ op: 't', n: 3 });
  assert.equal(s.credit(), 2, 'one message opens two turns');
  for (let i = 0; i < 2; i++) s.advance(1 / 60);
  assert.equal(s.A.tick, t0 + 1, 'the first tick goes in about 33 ms');
  for (let i = 0; i < 2; i++) s.advance(1 / 60);
  assert.equal(s.A.tick, t0 + 2);
  assert.equal(s.credit(), 0);
  for (let i = 0; i < 6; i++) s.advance(1 / 60);
  assert.equal(s.A.tick, t0 + 2, 'then it waits');
  s.feed({ op: 't', n: 4, c: [{ t: 'hold', p: 0, seq: 7 }] });
  const acks = [];
  s.onAck = seq => acks.push(seq);
  s.advance(1 / 60);
  assert.equal(s.A.tick, t0 + 3, 'a waiting arena answers on the next frame');
  assert.equal(s.A.heroes[0].hold, true);
  assert.deepEqual(acks, [7], 'my own command is acknowledged when it lands');
  s.feed({ op: 't', n: 5, c: [{ t: 'hold', p: 1, seq: 9 }] });
  s.advance(1 / 15);
  assert.deepEqual(acks, [7], 'a command of another seat is not mine');
  assert.equal(s.A.queue.some(c => c.seq != null), false, 'the arena never sees the number');
});

function leadRig() {
  const sent = [], rig = { now: 100, turn: 1, nextClose: 100, inbox: [], blockUntil: 0 };
  rig.net = new HD.NetSession({ code: 'L', seed: 777, diff: 'normal', seat: 0, ticks: 1, turnMs: 100 / 3, names: ['P1', 'P2'], clock: () => performance.now(), send: c => sent.push({ at: rig.now, c: Object.assign({}, c, { p: 0 }) }), onHash() {} });
  rig.net.feedLog({ upto: 1, turns: [[1, { t: 'take', i: 0, p: 0 }, { t: 'take', i: 0, p: 1 }]] });
  rig.net.advance(1 / 60);
  rig.A = rig.net.A;
  rig.h = rig.A.heroes[0];
  rig.lead = new HD.HeroLead(rig.A, rig.h, () => 150);
  rig.net.onAck = seq => rig.lead.landed(seq);
  rig.send = c => { const seq = rig.lead.nextSeq(); rig.net.send(Object.assign({ seq }, c)); rig.lead.sent(seq, c, rig.now); };
  rig.frames = (ms, delayMs) => {
    const half = delayMs / 2000;
    for (let t = 0; t < ms; t += 1000 / 60) {
      rig.now += 1 / 60;
      while (rig.nextClose <= rig.now) {
        const ready = sent.filter(e => e.at + half <= rig.nextClose).map(e => e.c);
        sent.splice(0, ready.length);
        rig.turn++;
        rig.inbox.push({ at: rig.nextClose + half, m: ready.length ? { op: 't', n: rig.turn, c: ready } : { op: 't', n: rig.turn } });
        rig.nextClose += 1 / 30;
      }
      while (rig.inbox.length && rig.inbox[0].at <= rig.now && rig.now >= rig.blockUntil) rig.net.feed(rig.inbox.shift().m);
      rig.net.advance(1 / 60);
      rig.lead.frame(rig.now, 1 / 60, true, rig.net.acc / HD.DT);
    }
  };
  return rig;
}

test('my hero answers at once while the sim comes later, and they meet when I stop', () => {
  const r = leadRig(), { A, h, lead } = r;
  r.frames(1500, 200);
  const x0 = h.x, y0 = h.y;
  assert.ok(Math.abs(lead.x - x0) < 2 && Math.abs(lead.y - y0) < 2, 'standing: on the sim');
  r.send({ t: 'move', dx: 0, dy: -1 });
  r.frames(100, 200);
  assert.equal(h.y, y0, 'the sim has not moved yet');
  assert.ok(lead.y < y0 - 5, 'the screen moved in 100 ms: ' + (y0 - lead.y));
  assert.ok(lead.moving);
  assert.equal(lead.dir, 'up');
  r.frames(500, 200);
  assert.ok(h.y < y0 - 10, 'now the sim moves');
  assert.ok(lead.y < h.y - 5, 'the screen stays ahead: ' + (h.y - lead.y));
  const y1 = lead.y;
  r.send({ t: 'move', dx: 0, dy: 0 });
  r.frames(120, 200);
  assert.ok(Math.abs(lead.y - y1) < 14, 'release stops the hero on screen: ' + (y1 - lead.y));
  r.frames(1000, 200);
  assert.ok(Math.abs(lead.y - h.y) < 2 && Math.abs(lead.x - h.x) < 2, 'and the sim arrives under it');
  assert.ok(Math.abs(lead.y - y1) < 16, 'near the place it stopped: ' + (y1 - lead.y));
  assert.equal(lead.log.length, 0, 'all commands landed');
  assert.equal(A.heroes[1].y !== undefined, true);
});

test('a stall of the link does not stop my hero on screen, and the catching up does not jerk it', () => {
  const r = leadRig(), { h, lead } = r;
  r.frames(1500, 150);
  r.send({ t: 'move', dx: 0, dy: -1 });
  r.frames(500, 150);
  r.blockUntil = r.now + 0.3;
  const tick = r.A.tick, seen = [];
  for (let i = 0; i < 18; i++) { r.frames(1000 / 60, 150); seen.push(lead.y); }
  assert.ok(r.A.tick <= tick + 6, 'the sim stands in the stall');
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] <= seen[i - 1] + 0.01, 'the hero keeps going');
  assert.ok(seen[0] - seen[seen.length - 1] > 30, 'covered ground in the stall: ' + (seen[0] - seen[seen.length - 1]));
  let last = lead.y, worst = 0;
  for (let i = 0; i < 40; i++) { r.frames(1000 / 60, 150); worst = Math.max(worst, Math.abs(lead.y - last)); last = lead.y; }
  assert.ok(worst < 9, 'no jump after the stall, per frame: ' + worst);
  assert.ok(lead.y < h.y, 'still ahead of the sim');
});

test('walls hold my hero on screen as they hold it in the sim', () => {
  const r = leadRig(), { A, h, lead } = r;
  r.frames(1000, 150);
  r.send({ t: 'move', dx: -1, dy: 0 });
  r.frames(12000, 150);
  assert.ok(A.collide, 'the map has walls');
  assert.ok(Math.abs(lead.x - h.x) < 3, 'stopped together at a wall: ' + lead.x + ' / ' + h.x);
  const probe = { x: lead.x, y: lead.y, r: h.r };
  A.collide(probe);
  assert.ok(Math.abs(probe.x - lead.x) < 1 && Math.abs(probe.y - lead.y) < 1, 'not inside a wall');
});

test('a click on the ground is followed on screen before the sim', () => {
  const r = leadRig(), { A, h, lead } = r;
  r.frames(1000, 200);
  const S = A.M.spawn, tx = S[0] * 32 + 16, ty = (S[1] - 6) * 32 + 16, y0 = h.y;
  r.send({ t: 'goto', x: tx, y: ty });
  r.frames(120, 200);
  assert.equal(h.y, y0, 'the sim waits');
  assert.ok(lead.y < y0 - 5, 'the screen walks: ' + (y0 - lead.y));
  r.frames(5000, 200);
  assert.ok(Math.hypot(h.x - tx, h.y - ty) < 3, 'the sim gets there');
  assert.ok(Math.hypot(lead.x - tx, lead.y - ty) < 3, 'and they stand together');
  assert.equal(lead.ahead, false);
});

test('stuns, death and a lost link take the lead away, and a lost command stops counting', () => {
  const r = leadRig(), { A, h, lead } = r;
  r.frames(1000, 150);
  r.send({ t: 'move', dx: 0, dy: -1 });
  r.frames(600, 150);
  assert.ok(lead.y < h.y - 3);
  A.addFx(h, { n: 'Тест', k: 'stun', v: 0, t: 5 });
  r.frames(400, 150);
  assert.ok(Math.abs(lead.y - h.y) < 2, 'a stunned hero stands where the sim says');
  assert.equal(lead.ahead, false);
  h.fx.length = 0;
  r.frames(300, 150);
  lead.frame(r.now, 1 / 60, false, 1);
  assert.equal(lead.skew, null, 'off means the next start measures again');
  const seq = lead.nextSeq();
  lead.sent(seq, { t: 'goto', x: 10, y: 10 }, r.now);
  assert.equal(lead.log.length, 1);
  r.now += 2;
  lead.frame(r.now, 1 / 60, true, 1);
  assert.equal(lead.log.length, 0, 'a command the server dropped is forgotten');
});

test('the lead reads the sim and never changes it', () => {
  const run = withLead => {
    const crew = localCrew(2, { seed: 31, diff: 'easy' }), rng = H.makeRandom(9), sc = { tr: 0, ei: 0 };
    crew.pickAll();
    const A = crew.sessions[0].A, lead = new HD.HeroLead(A, A.heroes[0], () => 150);
    let now = 50;
    for (let i = 0; i < 900; i++) {
      for (let p = 0; p < 2; p++) if (crew.sessions[p].A.tick % 7 === 0) HD.goldenThink(crew.sessions[p].A, rng, sc, p);
      crew.close();
      for (const s of crew.sessions) s.advance(1 / 15);
      now += 1 / 15;
      if (withLead) {
        const c = i % 3 === 0 ? { t: 'goto', x: 400 + i, y: 500 } : { t: 'move', dx: i % 2, dy: -1 }, seq = lead.nextSeq();
        lead.sent(seq, c, now);
        lead.frame(now, 1 / 15, true, 1);
      }
    }
    return A.stateHash();
  };
  assert.equal(run(true), run(false));
});

test('a burst is cut by the clock so a frame stays short', () => {
  const crew = localCrew(2);
  crew.pickAll();
  const a = crew.sessions[0];
  let now = 0;
  a.clock = () => (now += 5);
  for (let i = 0; i < 1000; i++) crew.close();
  const t0 = a.A.tick;
  a.advance(1 / 60);
  assert.ok(a.A.tick - t0 <= 3, 'the burst stops at its budget: ' + (a.A.tick - t0));
  assert.equal(a.catching, true);
});

test('one journal gives one game on all clients, however unevenly they run', () => {
  const crew = localCrew(3, { seed: 4242, diff: 'easy' });
  crew.pickAll();
  const rngs = crew.sessions.map((_, p) => H.makeRandom(100 + p));
  const sc = { tr: 0, ei: 1 };
  const rates = [() => 1 / 15, i => (i % 7 === 0 ? 0.4 : 0.01), i => (i % 50 === 0 ? 2 : 0.03)];
  for (let i = 0; i < 2500; i++) {
    crew.sessions.forEach((s, p) => { if (s.A.tick % 5 === 0 && !s.A.over) HD.goldenThink(s.A, rngs[p], sc, p); });
    crew.close();
    crew.sessions.forEach((s, p) => s.advance(rates[p](i)));
  }
  for (const s of crew.sessions) { let guard = 0; while (s.credit() > 0 && !s.A.over && guard++ < 10000) s.advance(1 / 15); }
  const [a, b, c] = crew.sessions;
  assert.equal(a.A.tick, b.A.tick);
  assert.equal(b.A.tick, c.A.tick);
  assert.equal(a.A.stateHash(), b.A.stateHash());
  assert.equal(b.A.stateHash(), c.A.stateHash());
  assert.ok(a.A.tick > 3000, 'ticks ' + a.A.tick);
  assert.ok(crew.journal.length > 100, 'real commands went through: ' + crew.journal.length);
  sameHashes(crew.hashes.filter(Boolean), 5);
});

test('a game restarted from the journal arrives at the same state', () => {
  const crew = localCrew(2, { seed: 99, diff: 'easy' });
  crew.pickAll();
  const rng = H.makeRandom(5), sc = { tr: 1, ei: 0 }, [a, b] = crew.sessions;
  for (let i = 0; i < 700; i++) {
    for (let p = 0; p < 2; p++) if (crew.sessions[p].A.tick % 10 === 0) HD.goldenThink(crew.sessions[p].A, rng, sc, p);
    crew.close();
    for (const s of crew.sessions) s.advance(1 / 15);
  }
  while (a.credit() > 0) a.advance(1 / 15);
  while (b.credit() > 0) b.advance(1 / 15);
  const hash = a.A.stateHash(), tick = a.A.tick;
  b.restart();
  assert.equal(b.A, null);
  assert.equal(b.n, 0);
  b.feedLog({ upto: crew.turn, turns: crew.journal });
  b.advance(1 / 60);
  assert.ok(b.A, 'the draft replays at once');
  while (b.credit() > 0) b.advance(1 / 60);
  assert.equal(b.A.tick, tick);
  assert.equal(b.A.stateHash(), hash);
});

test('a journal piece that overlaps the live turns is not applied twice', () => {
  const crew = localCrew(2);
  crew.pickAll();
  const [a, b] = crew.sessions;
  a.send({ t: 'hold' });
  crew.close();
  crew.close();
  const turn = crew.journal[crew.journal.length - 1];
  b.feedLog({ upto: crew.turn, turns: [turn] });
  b.feed({ op: 't', n: crew.turn });
  for (const s of crew.sessions) while (s.credit() > 0) s.advance(1 / 15);
  assert.equal(a.A.heroes[0].hold, true);
  assert.equal(b.A.heroes[0].hold, true, 'hold flips only once');
  assert.equal(a.A.stateHash(), b.A.stateHash());
});

test('live turns before the journal are dropped: the journal covers them and a hole would break the count', () => {
  const crew = localCrew(2), s = crew.sessions[0];
  s.waitLog = true;
  s.message({ op: 't', n: 500 });
  assert.equal(s.last, 0);
  s.message({ op: 'log', upto: 510, turns: [[1, { t: 'take', i: 0, p: 0 }, { t: 'take', i: 0, p: 1 }]] });
  assert.equal(s.waitLog, false);
  assert.equal(s.last, 510);
  s.message({ op: 't', n: 511 });
  assert.equal(s.last, 511);
  s.advance(1 / 60);
  assert.ok(s.A, 'the draft comes from the journal, not from a timer on empty turns');
  assert.equal(s.takes[0], s.drafts[0].draft.cards[0].hero);
  s.restart();
  assert.equal(s.waitLog, false);
});

test('a bad command is skipped by everyone the same way', () => {
  const crew = localCrew(2);
  crew.pickAll();
  crew.sent.push({ t: 'cast', slot: '__proto__', p: 0 }, { t: 'buy', id: 'constructor', p: 1 }, { t: 'use', i: 'x', p: 0 }, { t: 'goto', x: 1e12, y: 5, p: 1 }, { t: 'move', dx: 0, dy: 1, p: 9 }, 'text', null, 7);
  crew.close();
  for (const s of crew.sessions) while (s.credit() > 0) s.advance(1 / 15);
  crew.run(20);
  assert.equal(crew.sessions[0].A.stateHash(), crew.sessions[1].A.stateHash());
});

test('a game at a table pays each player alone and leaves the solo run and table alone', () => {
  const g = new H.Game({ fresh: true }), D = g.hd();
  g.hdNew({ diff: 'normal', hero: Object.keys(HD.HEROES)[0] });
  const solo = JSON.stringify(D.run), asc0 = D.asc.pts;
  const crew = localCrew(2), [a, b] = crew.sessions;
  crew.pickAll();
  a.A.heroes[0].st.kills = 7; a.A.heroes[1].st.kills = 3; a.A.stats.kills = 10;
  a.A.wave = 4;
  const sum = g.hdFinishNet(a, true);
  assert.equal(sum.kills, 7, 'own numbers');
  assert.equal(sum.hero, a.A.heroes[0].key);
  assert.equal(sum.win, false);
  assert.equal(sum.cleared, 3);
  assert.deepEqual(sum.crew, ['P1', 'P2']);
  assert.equal(JSON.stringify(D.run), solo, 'the solo run is untouched');
  assert.ok(D.asc.pts > asc0, 'a quitter gets the reward for the waves done');
  assert.equal(D.hist[0].crew.length, 2);
  assert.equal(D.recs[D.recs.length - 1].crew.length, 2);
  assert.ok(!g.hdRecords('normal').some(r => r.crew), 'the solo table has no crew records');
  assert.equal(sum.meta.place, 0);
  assert.ok(g.events.some(e => e.t === 'autosave'));
  const other = g.hdFinishNet(b, true);
  assert.equal(other.hero, b.A.heroes[1].key);
  b.A.over = 'win';
  const win = g.hdFinishNet(b);
  assert.equal(win.win, true);
  assert.equal(win.wave, HD.WAVES.length);
  assert.equal(g.hdFinishNet(localCrew(2).sessions[0]), null, 'leaving during the draft gives nothing');
});

const netServer = require('../tools/net/server.cjs');
require('../js/net98.js');

async function liveTable(n, o = {}) {
  const clock = { t: 1700000000000 };
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hsr-net-live-'));
  const app = netServer.createServer(Object.assign(netServer.loadConfig({ NET_DATA: dataDir }), { timers: false, rate: 100000, cmdRate: 1000, newPerHour: 100, now: () => clock.t }));
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const url = 'ws://127.0.0.1:' + app.server.address().port + '/api/net';
  const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
  const until = async (cond, what) => { for (let i = 0; i < 4000; i++) { if (cond()) return; await new Promise(resolve => setTimeout(resolve, 2)); } assert.fail('timed out: ' + what); };
  const store = () => { const box = new Map([['net98.url', url]]); return { getItem: k => (box.has(k) ? box.get(k) : null), setItem: (k, v) => box.set(k, String(v)), removeItem: k => box.delete(k) }; };
  const players = [];
  for (let i = 0; i < n; i++) {
    const net = globalThis.createNet98(store());
    net.setConsent(true);
    await until(() => net.state === 'online', 'connect ' + i);
    const pl = { net, hashes: new Map(), desyncs: 0, rng: H.makeRandom(300 + i), session: null };
    net.onNet = m => {
      if (m.op === 'desync') pl.desyncs++;
      if (pl.session && (m.op === 't' || m.op === 'log')) pl.session.message(m);
      if (m.op === 'me' && pl.session) net.send('tableBack', { code: pl.session.code, since: pl.session.last });
    };
    players.push(pl);
  }
  const tableOf = pl => pl.net.table;
  players[0].net.send('tableNew', { name: 'P1', diff: o.diff || 'easy' });
  await until(() => tableOf(players[0]), 'table');
  const code = tableOf(players[0]).code;
  for (let i = 1; i < n; i++) { players[i].net.send('tableJoin', { code, name: 'P' + (i + 1) }); players[i].net.send('tableReady', { on: true }); }
  await until(() => players.every(p => tableOf(p) && tableOf(p).seats.filter(Boolean).length === n), 'all seated');
  await until(() => tableOf(players[0]).seats.slice(1, n).every(s => s.ready), 'all ready');
  players[0].net.send('tableStart');
  await until(() => players.every(p => tableOf(p) && tableOf(p).state === 'run'), 'started');
  const makeSession = pl => {
    const T = tableOf(pl);
    return new HD.NetSession({ code, seed: T.seed, diff: T.diff, seat: pl.net.seat, ticks: T.ticks, turnMs: T.turnMs, names: T.seats.filter(Boolean).map(s => s.name), clock: () => performance.now(), send: c => pl.net.send('cmd', { c }), onHash: (tick, h) => { pl.hashes.set(tick, h); pl.net.send('hash', { n: tick, h }); } });
  };
  for (const pl of players) pl.session = makeSession(pl);
  const sc = { tr: 0, ei: 0 };
  const turn = async (count, think = true) => {
    for (let i = 0; i < count; i++) {
      clock.t += 200 / 3;
      app.pump();
      await flush();
      for (const pl of players) {
        const s = pl.session;
        if (!s || pl.net.state !== 'online') continue;
        s.advance(1 / 15);
        if (!think || !s.A || s.A.over || pl.net.table.paused) continue;
        const beat = Math.floor(s.A.tick / 10);
        if (beat === pl.beat) continue;
        pl.beat = beat;
        HD.goldenThink(s.A, pl.rng, sc, s.seat);
        if (beat % 4 === 0) {
          const h = s.A.heroes[s.seat], foes = s.A.foes().sort((a, b) => HD.N.hypot(a.x - h.x, a.y - h.y) - HD.N.hypot(b.x - h.x, b.y - h.y));
          if (foes.length) s.send({ t: 'attack', id: foes[0].uid });
        }
      }
    }
  };
  for (const pl of players) pl.session.send({ t: 'take', i: 0 });
  await until(() => { app.pump(); clock.t += 70; for (const pl of players) pl.session.advance(1 / 15); return players.every(p => p.session.A); }, 'all heroes taken');
  return { app, clock, code, players, turn, flush, until, makeSession, dataDir, close: async () => { for (const pl of players) pl.net.disconnect('off'); await new Promise(resolve => setTimeout(resolve, 20)); await app.close(); fs.rmSync(dataDir, { recursive: true, force: true }); } };
}

async function playToWave(L, wave, cap) {
  let turns = 0;
  while (L.players[0].session.A.wave < wave && !L.players[0].session.A.over && turns < cap) { await L.turn(30); turns += 30; }
  const A = L.players[0].session.A, foes = A.foes().slice(0, 5).map(f => f.key + ' hp ' + Math.round(f.hp) + ' at ' + Math.round(f.x) + ',' + Math.round(f.y) + (f.pig ? ' pig' : ''));
  assert.ok(A.wave >= wave || A.over, 'reached wave ' + A.wave + ' in ' + turns + ' turns, tick ' + A.tick + ', phase ' + A.phase + ', sched ' + A.sched.filter(g => !g.done).length + ', foes ' + A.foes().length + ': ' + foes.join('; ') + ', heroes ' + A.heroes.map(h => h.key + ' ' + (h.dead ? 'dead' : 'lvl' + h.lvl) + ' at ' + Math.round(h.x) + ',' + Math.round(h.y)).join('; '));
}

function assertOneGame(L, minHashes) {
  const list = L.players.map(p => p.hashes);
  sameHashes(list, minHashes);
  assert.ok(L.players.every(p => p.desyncs === 0), 'no desync messages');
  assert.ok(!fs.existsSync(path.join(L.dataDir, 'desync.jsonl')), 'the server saw no desync');
}

for (const n of [2, 4]) {
  test(n + ' clients through the real server play past wave 5 with one and the same game', async () => {
    const L = await liveTable(n);
    await playToWave(L, 6, 12000);
    await L.turn(10, false);
    assert.ok(L.players[0].session.A.wave >= 5 || L.players[0].session.A.over, 'wave ' + L.players[0].session.A.wave);
    assertOneGame(L, 20);
    const A = L.players[0].session.A;
    assert.equal(A.heroes.length, n);
    assert.equal(new Set(A.heroes.map(h => h.key)).size, n);
    assert.ok(A.heroes.every(h => h.st.gold > 0), 'everyone earned');
    assert.equal(A.stateHash().length, 8);
    await L.close();
  });
}

test('a client lost in the middle of a wave returns by the journal, the others do not wait', async () => {
  const L = await liveTable(3);
  await playToWave(L, 2, 6000);
  const [a, b, c] = L.players;
  while (a.session.A.phase !== 'wave') await L.turn(5);
  const n0 = b.session.n;
  c.net.disconnect('off');
  await L.turn(50);
  assert.ok(a.session.n > n0 + 30, 'the table goes on');
  await L.turn(120);
  assert.equal(a.session.A.heroes[2].away, true, 'after 10 s the hero is away for everyone');
  assert.equal(b.session.A.heroes[2].away, true);
  const behind = a.session.n - c.session.n;
  assert.ok(behind > 100, 'the lost client stands: ' + behind);
  c.net.connect();
  await L.until(() => c.net.state === 'online', 'back online');
  await L.flush();
  await L.turn(40, false);
  await L.until(() => { c.session.advance(1 / 60); return c.session.credit() <= HD.NET.steady && !c.session.catching; }, 'caught up');
  await L.turn(30, false);
  assert.equal(a.session.A.heroes[2].away, false, 'back counts for everyone');
  assert.equal(c.session.A.heroes[2].away, false);
  await L.turn(120);
  for (const pl of L.players) while (pl.session.credit() > 0) pl.session.advance(1 / 15);
  assert.equal(a.session.A.tick, c.session.A.tick);
  assert.equal(a.session.A.stateHash(), c.session.A.stateHash());
  assertOneGame(L, 5);
  await L.close();
});

test('a client that lost everything starts over from the journal and joins the same game', async () => {
  const L = await liveTable(2);
  await playToWave(L, 2, 6000);
  const [a, b] = L.players;
  await L.turn(60);
  b.session = L.makeSession(b);
  const fresh = b.session;
  assert.equal(fresh.A, null);
  b.net.send('tableBack', { code: L.code, since: 0 });
  await L.until(() => fresh.last > 0, 'journal');
  await L.until(() => { fresh.advance(1 / 60); return fresh.A && !fresh.catching && fresh.credit() <= HD.NET.steady; }, 'caught up');
  await L.turn(90);
  for (const pl of L.players) while (pl.session.credit() > 0) pl.session.advance(1 / 15);
  assert.equal(a.session.A.tick, fresh.A.tick);
  assert.equal(a.session.A.stateHash(), fresh.A.stateHash());
  await L.close();
});

test('a shared pause in the middle of a wave stops everyone on one tick and resumes together', async () => {
  const L = await liveTable(2);
  await playToWave(L, 2, 6000);
  const [a, b] = L.players;
  while (a.session.A.phase !== 'wave') await L.turn(5);
  a.net.send('pause', { on: true });
  await L.until(() => a.net.table.paused && b.net.table.paused, 'paused');
  await L.turn(5, false);
  for (const pl of L.players) while (pl.session.credit() > 0) pl.session.advance(1 / 15);
  const ta = a.session.A.tick, h = a.session.A.stateHash();
  assert.equal(b.session.A.tick, ta, 'both stop on the same tick');
  assert.equal(b.session.A.stateHash(), h);
  await L.turn(150, false);
  assert.equal(a.session.A.tick, ta, 'nothing moves on pause');
  const held = a.session.A.heroes[0].hold;
  a.session.send({ t: 'hold' });
  a.net.send('pause', { on: false });
  await L.until(() => a.net.table.paused && a.net.table.paused.resume != null, 'countdown');
  await L.turn(46, false);
  await L.until(() => !a.net.table.paused && !b.net.table.paused, 'lifted');
  await L.turn(60, false);
  for (const pl of L.players) while (pl.session.credit() > 0) pl.session.advance(1 / 15);
  assert.ok(a.session.A.tick > ta, 'the game goes on');
  assert.equal(a.session.A.heroes[0].hold, held, 'a command on pause never lands');
  assert.equal(a.session.A.stateHash(), b.session.A.stateHash());
  assertOneGame(L, 3);
  await L.close();
});

test('the table tools and screens have no comments', () => {
  for (const file of ['tools/net/e2e.cjs', 'tools/net/playtest.cjs', 'js/apps/hsr98/hsr-ui-hd-table.js', 'js/apps/hsr98/hsr-hd-net.js', 'js/apps/hsr98/hsr-hd-lead.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(!/^\s*\/\//m.test(code) && !/\/\*/.test(code), file);
  }
});

test('the playtest page gets a quick start that never writes saves', () => {
  const { addQuickStart, QUICK_START, stamp } = require('../tools/net/playtest.cjs');
  assert.ok(addQuickStart('<html><body><b>x</b></body></html>').endsWith(QUICK_START + '</body></html>'));
  assert.ok(addQuickStart('<b>x</b>').endsWith(QUICK_START));
  assert.ok(QUICK_START.includes('ui.writeSave = () => true'), 'a test game must not overwrite the saves of the site');
  assert.equal(stamp(new Date(2026, 10, 1, 9, 5)), 'nettest-1101-0905', 'every build gets a new folder: the CDN keeps old files');
});

test('new sources have no comments', () => {
  for (const f of ['js/apps/hsr98/hsr-hd-math.js', 'js/apps/hsr98/hsr-hd-net.js', 'js/apps/hsr98/hsr-hd-simver.js', 'tools/hsr-net-simver.cjs']) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/^\s*\/\//m.test(text) && !/\/\*/.test(text), f);
  }
});

(async () => {
  let failed = 0;
  for (const t of tests) {
    const t0 = Date.now();
    try { await t.fn(); console.log('ok   ' + t.name + ' (' + (Date.now() - t0) + ' ms)'); }
    catch (err) { failed++; console.error('FAIL ' + t.name + '\n' + (err && err.stack || err)); }
  }
  console.log(failed ? failed + ' failed' : 'All deterministic arena tests passed');
  process.exit(failed ? 1 : 0);
})();
