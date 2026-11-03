const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const page = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const mods = [...page.slice(0, page.indexOf('hsr-gfx.js')).matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]).filter(m => m !== 'hsr-core');
for (const m of mods) if (!m.startsWith('hsr-pf')) require(path.join(DIR, m + '.js'));

const clean = g => { g.script = null; g.pending = null; g.cg = null; g.events.length = 0; return g; };
const plainFight = seed => {
  const g = clean(new H.Game({ seed: 3 }));
  const b = g.startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, seed });
  b.start();
  for (let i = 0; i < 500 && !b.over; i++) { b.autoStep(); b.drain(); }
  return [b.result.win, b.clock, b.allies.map(a => a.hp).join()].join('|');
};
const before = plainFight(42);
for (const m of mods) if (m.startsWith('hsr-pf')) require(path.join(DIR, m + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };
const PF = H.PF, TUN = PF.TUN, T = H.TUNING;
const atDay = (day, hour = 12) => {
  const u = new Date(day * 86400000);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), hour).getTime();
};
const FIRST_SEASON_TIME = atDay(380 * TUN.days + 5);
H.Game.prototype.now = function () { return this.clock ? this.clock() : FIRST_SEASON_TIME; };

eq(plainFight(42), before, 'a battle outside the mode is the same with the modules loaded');

const team = ['himeko', 'herta', 'asta', 'natasha'];
const mk = (keys = team, lvl = 80) => {
  const g = clean(new H.Game({ seed: 11 }));
  for (const k of keys) if (!g.state.roster[k]) g.debugChar(k, lvl, 0, 0);
  return g;
};
const fightOf = (g, node, seed, patch) => {
  const opts = g.pfOpts(1, node, team, seed);
  Object.assign(opts, patch || {});
  return new H.Battle(opts);
};
const run = (b, onStep) => {
  b.start();
  for (let i = 0; i < 6000 && !b.over; i++) { b.autoStep(); b.drain(); if (onStep) onStep(b); }
  return b;
};

{
  for (const s of PF.SEASONS) for (const st of s.stages) {
    eq(st.lvl, H.FH.lvlOf([55, 65, 75, 85][st.n - 1]), 'stage ' + st.n + ' uses the level mapping of the Forgotten Hall');
    st.nodes.forEach((node, ni) => node.waves.forEach((wave, wi) => {
      const tag = s.id + ' ' + st.n + '.' + (ni + 1) + ' wave ' + (wi + 1);
      ok(wave.max === 4 || wave.max === 5, tag + ' keeps 4 or 5 enemies on the field');
      eq(PF.waveSum(wave, wi), TUN.waveValue[wi], tag + ' is worth exactly the value of the wave');
      for (const [id] of wave.pool) {
        const d = H.ENEMIES[id];
        ok(d, tag + ' enemy ' + id);
        ok(!d.lifespan && !d.proto && !d.spoiler && !d.phase2, tag + ' enemy ' + id + ' fits the mode');
      }
      eq(wave.pool.filter(([id]) => H.ENEMIES[id].boss).reduce((a, [, n]) => a + n, 0) <= 1, true, tag + ' has at most one boss');
    }));
    st.nodes.forEach(node => eq(PF.recOf(node).length, 2, 'two recommended types'));
  }
  const pig = H.ENEMIES.pf_trotter;
  eq(pig.id, 'pf_trotter', 'the trotter of the mode is a separate entry');
  eq(pig.name, 'Свинка-копилка последовательности', 'the official name of the trotter');
  eq(H.ENEMIES.trotter.name, 'Свинка-копилка пространства', 'the field trotter did not change');
  eq(pig.flee, TUN.trotterFlee, 'the trotter runs away after its turns');
}

{
  const g = mk();
  for (let node = 0; node < 2; node++) for (const seed of [1, 2, 3, 4]) {
    const b = run(fightOf(g, node, seed, { foeHp: 0.05, foeAtk: 0.1 }));
    const R = g.pfReport(b);
    eq(R.end, 'clear', 'a strong team clears the node, seed ' + seed);
    eq(R.score, 40000, 'a full clear is exactly 40 000, node ' + node + ', seed ' + seed);
    eq(R.kills + b.enemies.filter(u => u.gone).length, R.total, 'every enemy of the node was met');
    eq(R.byWave.join(), TUN.waveValue.join(), 'every wave pays its value');
    ok(b.result.win, 'a clear is a win');
  }
}

{
  const g = mk(team, 30);
  const down = run(fightOf(g, 0, 5, { foeHp: 30, foeAtk: 60 }));
  eq(g.pfReport(down).end, 'wiped', 'a team that falls ends the node');
  ok(g.pfReport(down).down > 0, 'the report counts the fallen');
  const b = run(fightOf(g, 0, 5, { foeHp: 30, foeAtk: 0.1 }), x => {
    const w = x.opts.pf.waves[x.wave];
    ok(x.living.length <= w.max, 'the field holds the cap of the wave');
    ok(x.living.filter(u => PF.special(u.id)).length <= TUN.maxSpecial, 'no more than two special enemies on the field');
    ok(x.pf.score <= 40000.001, 'the score never passes the cap');
  });
  const R = g.pfReport(b);
  eq(R.end, 'cycles', 'a weak team runs out of cycles');
  eq(b.result.win, false, 'cycles out is not a win');
  ok(b.clock >= 150 + 100 * 4, 'five cycles really passed');
  eq(R.cycles, 5, 'the report shows five cycles');
  ok(R.score < 40000, 'the score is partial');
  R.byWave.forEach((v, i) => ok(v <= TUN.waveValue[i], 'wave ' + i + ' stays inside its value'));
}

{
  const g = mk();
  const b = fightOf(g, 0, 9, { foeAtk: 0.01 });
  b.start();
  const slots = b.enemies.map(u => u.pfSlot);
  eq(slots.join(), slots.map((_, i) => i).join(), 'the first line takes the slots in order');
  const a = b.allies[0], u = b.enemies.find(x => !PF.special(x.id)), i = b.enemies.indexOf(u), slot = u.pfSlot;
  b.hit(a, u, 0, { raw: u.maxHp * 2 });
  ok(u.dead, 'the enemy falls');
  b.cleanup();
  const e = b.enemies[i];
  ok(e !== u && !e.dead, 'a new enemy takes the place in the list');
  eq(e.pfSlot, slot, 'and the slot of the fallen one');
  ok(Math.abs(e.maxHp / H.ENEMIES[e.id].hp - u.maxHp / H.ENEMIES[u.id].hp) < 4, 'the replacement keeps the health multiplier');
  eq(e.appear, false, 'the replacement waits for its event');
  const ev = b.drain().find(x => x.t === 'summon' && x.u === e);
  eq(ev && ev.hold, TUN.spawnHold, 'a replacement takes a short time on screen');
  ok(e.av > 0, 'a new enemy waits for its turn');
  ok(u.pfLeft === 0, 'the fallen enemy has nothing left to pay');
}

{
  const g = mk();
  const b = fightOf(g, 0, 9, { foeAtk: 0.01 });
  b.start();
  const a = b.allies[0], u = b.enemies.find(x => !PF.special(x.id));
  u.tough = 1;
  const score0 = b.pf.score, kills0 = b.pf.kills[0], weak = u.weak[0], owed = u.pfLeft + u.pfVal.k;
  b.hit(a, u, 0, { raw: u.maxHp * 2, tough: 50, e: weak });
  ok(u.dead, 'one hit both breaks and kills');
  eq(b.pf.kills[0], kills0 + 1, 'the kill counts once');
  ok(Math.abs(b.pf.score - score0 - owed) < 1e-6, 'and pays the rest of the price once');
  const score1 = b.pf.score;
  b.onZero(u, a);
  eq(b.pf.score, score1, 'a repeated zero does not pay again');
}

{
  const g = mk();
  const b = fightOf(g, 0, 9, { foeAtk: 0.01 });
  b.start();
  const a = b.allies[0], u = b.enemies.find(x => !PF.special(x.id));
  a.energy = 0;
  b.onZero(u, a);
  const got = a.energy;
  const n = mk().startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, seed: 1 });
  n.start();
  const na = n.allies[0];
  na.energy = 0;
  n.gainEnergy(na, T.energyKill);
  ok(got > 0, 'a kill gives energy');
  ok(got < T.energyKill, 'less than a kill outside the mode, ' + got);
  a.energy = 0;
  b.gainEnergy(a, T.energyKill);
  eq(a.energy > got, true, 'only the kill itself is halved');
}

{
  const g = mk(team, 40);
  const wave = PF.SEASONS[0].stages[0].nodes[0].waves[1];
  const opts = g.pfOpts(1, 0, team, 7);
  opts.pf = Object.assign({}, opts.pf, { waves: [wave], cycles: 40, whim: null, caco: null });
  opts.waves = [[]];
  const b = new H.Battle(opts);
  for (const a of b.allies) a.base.atk = 0.01;
  b.start();
  let fled = null;
  for (let i = 0; i < 3000 && !b.over && !fled; i++) {
    b.autoStep();
    b.drain();
    fled = b.enemies.concat(b.pfSeen || []).find(u => u.gone);
    for (const u of b.enemies) if (u.id === 'pf_trotter') { (b.pfSeen = b.pfSeen || []); if (!b.pfSeen.includes(u)) b.pfSeen.push(u); }
    fled = (b.pfSeen || []).find(u => u.gone);
  }
  ok(fled, 'a trotter that nobody kills runs away');
  ok(fled.turnsTaken >= TUN.trotterFlee, 'after its turns');
  ok(fled.pfLeft > 0 || fled.hp < fled.maxHp, 'it keeps the unpaid price');
  eq(fled.data.weak.join(), opts.pf.rec.join(), 'its weaknesses are the recommended types');
  eq(H.ENEMIES.pf_trotter.weak.length, 7, 'the table entry did not change');
  b.cleanup();
  ok(!b.enemies.includes(fled), 'its slot is filled');
}

{
  const g = mk();
  const stage = PF.SEASONS[0].stages[0], w = { max: 4, pool: [['lupus', 4], ['patroller', 4], ['pf_trotter', 2], ['dracolion', 4]] };
  w.vals = PF.valuesOf(stage.nodes[1].waves[1], 1);
  w.vals = Object.assign({ lupus: TUN.normal }, w.vals);
  const opts = g.pfOpts(1, 1, team, 3);
  opts.pf = Object.assign({}, opts.pf, { waves: [w] });
  opts.waves = [[]];
  const b = new H.Battle(opts);
  b.start();
  for (let i = 0; i < 400 && !b.over; i++) { b.autoStep(); b.drain(); for (const u of b.enemies) if (u.id === 'lupus') for (const s of u.data.skills) if (s.t === 'summon') eq(s.max, -1, 'summons are off in the mode'); ok(!b.enemies.some(u => u.pfExtra), 'nobody calls extra enemies'); }
  ok(H.ENEMIES.lupus.skills.filter(s => s.t === 'summon').every(s => s.max !== -1), 'the enemy table did not change');
}

{
  const g = mk();
  const scoreOf = seed => { const b = run(fightOf(g, 0, seed, { foeHp: 8 })); return g.pfReport(b).score; };
  eq(scoreOf(77), scoreOf(77), 'the same seed gives the same score');
}

{
  const g = mk();
  g.state.party = team.slice();
  const snap = () => { const s = JSON.parse(JSON.stringify(g.state)); delete s.time; delete s.pf; return JSON.stringify(s); };
  g.pfTeams(1);
  g.fhSpecs(team);
  const s0 = snap();
  ok(g.pfBegin(1), 'the run starts');
  const b = g.pfFight(55);
  ok(b && g.battle === b, 'the fight starts');
  b.start();
  for (let i = 0; i < 6000 && !b.over; i++) { b.autoStep(); b.drain(); }
  const out = g.endBattle();
  ok(out && out.pf, 'the end of the fight reports the node');
  eq(g.battle, null, 'the fight is closed');
  eq(snap(), s0, 'the fight leaves no trace in the save except the record of the mode');
  eq(g.pfRunTotal(), out.pf.score, 'the run keeps the score of the node');
}

{
  const g = mk(team.concat(['serval', 'bailu', 'kafka', 'pela']), 50);
  g.state.party = team.slice();
  const t = g.pfTeams(1);
  eq(t[0].join(), team.join(), 'the first node takes the active team');
  eq(t[1].length, 4, 'the second node takes the next four');
  ok(!t[1].some(k => t[0].includes(k)), 'no hero stands in both nodes');
  const moved = t[1][0];
  ok(g.pfToggle(1, 0, t[0][0]), 'a hero leaves the node');
  ok(g.pfToggle(1, 0, moved), 'a hero of the other node joins');
  ok(!g.pfTeams(1)[1].includes(moved), 'and leaves the other node');
  ok(!g.pfToggle(1, 0, g.pfTeams(1)[1][0]), 'a full node refuses a fifth hero');
  g.state.roster.kafka.guest = true;
  ok(!g.pfHeroes().includes('kafka'), 'guests stay out of the mode');
  ok(!g.pfTeams(1).flat().includes('kafka'), 'a guest leaves the teams');
  const empty = mk();
  empty.pf().plan[1] = { team: [[], []] };
  eq(empty.pfBegin(1), null, 'an empty node does not start a run');
  eq(empty.pfFight(), null, 'no run, no fight');
}

{
  const S = PF.SEASONS[0], g = mk();
  const fx = (caco, seed, foeHp = 200) => { const o = g.pfOpts(1, 0, team, seed, caco); o.foeAtk = 0.01; o.foeHp = foeHp; const b = new H.Battle(o); b.start(); b.drain(); return b; };
  eq(S.caco.length, 3, 'a season offers three effects');
  for (const it of [S.whim, ...S.caco]) {
    ok(PF.FX[it.id], it.id + ' has its code');
    ok(it.name && it.text.length > 40, it.id + ' has a name and a text');
    ok(!/сверхспособн/.test(it.text), it.id + ' uses the term of the game');
  }
  eq(TUN.shatter.length, 7, 'the table covers six levels');
  TUN.shatter.forEach((v, i) => { if (i) ok(v > TUN.shatter[i - 1], 'level ' + i + ' hits harder than the one before'); });

  let b = fx(null, 9);
  const a = b.allies[0], u = b.enemies[1], other = b.enemies[3];
  ok(b.enemies.every(x => !x.pfShat), 'nobody starts with Shatter without the matching effect');
  b.hit(a, u, 0.1, { kind: 'basic' });
  b.hit(a, u, 0.1, { kind: 'skill' });
  ok(!u.pfShat, 'other attacks add no Shatter');
  b.actSerial = 1;
  b.hit(a, u, 0.1, { kind: 'ult' });
  eq(u.pfShat.n, 1, 'an ultimate adds a level');
  eq(u.pfShat.src, a, 'and remembers the hero');
  b.hit(a, u, 0.1, { kind: 'ult' });
  eq(u.pfShat.n, 1, 'the second hit of one action adds nothing');
  for (let i = 0; i < 9; i++) { b.actSerial++; b.hit(a, u, 0.1, { kind: 'ult' }); }
  eq(u.pfShat.n, 6, 'Shatter stops at six levels');
  b.actSerial++;
  b.hit(a, other, 0.1, { kind: 'fusion' });
  eq(other.pfShat.n, 1, 'a fusion counts as an ultimate');
  const stacks = b.drain().filter(e => e.t === 'pfshat');
  ok(stacks.length === 7 && stacks.every(e => e.n >= 1 && e.n <= 6), 'every new level reaches the screen');

  b = fx('erupt', 9);
  b.actSerial = 1;
  b.hit(b.allies[0], b.enemies[1], 0.1, { kind: 'ult' });
  eq(b.enemies[1].pfShat.n, 2, 'Eruption adds one more level');

  let seen = 0, got = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const x = fx('excite', seed);
    for (const e of x.enemies) { seen++; if (e.pfShat) { got++; eq(e.pfShat.n, 1, 'Excitement gives one level'); eq(e.pfShat.src, null, 'and no hero'); } }
  }
  ok(got / seen > 0.7 && got / seen < 0.9, 'Excitement lands on about 80%: ' + got + ' of ' + seen);
  const ex = fx('excite', 4, 1);
  let replaced = 0, withStack = 0;
  for (let i = 0; i < 12; i++) {
    const v = ex.living.find(x => !PF.special(x.id));
    if (!v) break;
    const at = ex.enemies.indexOf(v);
    ex.hit(ex.allies[0], v, 0, { raw: v.maxHp * 2 });
    ex.cleanup();
    if (ex.enemies[at] !== v) { replaced++; if (ex.enemies[at].pfShat) withStack++; }
  }
  ok(replaced > 3 && withStack > 0, 'replacements get Excitement too');

  b = fx(null, 9);
  const hero = b.allies[0], left = b.enemies[1], mid = b.enemies[2], right = b.enemies[3], far = b.enemies[0];
  const raw = lvl => Math.round(TUN.shatter[lvl] * T.enemyHp * H.grow(mid.lvl) * 200);
  const hp = () => [left, mid, right, far].map(x => x.hp);
  let h0 = hp();
  mid.pfShat = { n: 3, src: hero };
  b.pfShatBlast(mid);
  let lost = hp().map((v, i) => h0[i] - v);
  eq(lost.join(), [raw(3), raw(3), raw(3), 0].join(), 'the blast hits the target and its neighbours for the table value');
  const blasts = b.drain().filter(e => e.t === 'dmg');
  eq(blasts.length, 3, 'one damage event for each');
  ok(blasts.every(e => e.label === 'Раскол' && e.hold === TUN.shatterHold && e.src === hero), 'blast events are short and named');
  eq(mid.pfShat.n, 3, 'the blast keeps the levels');
  hero.dead = true;
  b.pfShatBlast(mid);
  ok(b.drain().filter(e => e.t === 'dmg').every(e => e.src === b.allies[1]), 'a fallen hero passes the blast on');
  hero.dead = false;
  b = fx(null, 9);
  const turnSet = [b.enemies[1], b.enemies[2], b.enemies[3], b.enemies[0]], turnHp = turnSet.map(x => x.hp);
  turnSet[1].pfShat = { n: 3, src: b.allies[0] };
  b.enemyTurn(turnSet[1]);
  b.drain();
  lost = turnSet.map((x, i) => turnHp[i] - x.hp);
  eq(lost.join(), [raw(3), raw(3), raw(3), 0].join(), 'the turn of the target sets off the blast');

  b = fx(null, 10);
  const k = b.enemies[2], ka = b.allies[0], kl = b.enemies[1], kr = b.enemies[3];
  k.pfShat = { n: 2, src: ka };
  k.tough = 1;
  const before = [kl.hp, kr.hp];
  b.hit(ka, k, 0, { raw: k.maxHp * 2, tough: 50, e: k.weak[0] });
  ok(k.dead, 'the target falls');
  eq(before[0] - kl.hp, Math.round(TUN.shatter[2] * T.enemyHp * H.grow(k.lvl) * 200), 'its death sets off one blast, even with a break');
  eq(before[1] - kr.hp, before[0] - kl.hp, 'on both sides');

  b = fx(null, 11);
  const e0 = b.allies[0], lone = b.enemies[0];
  e0.energy = 0;
  b.hit(e0, lone, 0, { raw: lone.maxHp * 2 });
  const single = e0.energy;
  ok(single > 0, 'a kill gives energy');
  b = fx(null, 11);
  const e1 = b.allies[0], c1 = b.enemies[1], c2 = b.enemies[2];
  c1.pfShat = { n: 1, src: e1 };
  c2.hp = 1;
  e1.energy = 0;
  b.hit(e1, c1, 0, { raw: c1.maxHp * 2 });
  ok(c1.dead && c2.dead, 'a blast can finish a neighbour');
  ok(Math.abs(e1.energy - single * 2) < 1e-6, 'both kills give the halved energy: ' + e1.energy + ' and ' + single);

  b = fx('rupture', 12);
  const r0 = b.allies[0], plain = b.enemies[0], marked = b.enemies[3];
  b.hit(r0, plain, 0, { raw: plain.maxHp * 2 });
  eq(b.pf.rupture, 0, 'a kill without Shatter gives no Rupture');
  marked.pfShat = { n: 1, src: r0 };
  b.hit(r0, marked, 0, { raw: marked.maxHp * 2 });
  eq(b.pf.rupture, 1, 'a kill with Shatter gives Rupture');
  for (const x of b.allies) {
    const f = x.buffs.find(w => w.name === 'Раскалывание');
    ok(f && f.s === 'ultP' && f.v === TUN.ruptureStep && f.perm, x.charId + ' gets the bonus for the battle');
  }
  const t2 = b.living[0], u0 = b.dmgCalc(r0, t2, 1, { kind: 'ult' }, false);
  for (let i = 0; i < 25; i++) PF.FX.rupture.kill.call(b, { u: { pfShat: { n: 1 } }, src: r0 });
  eq(b.pf.rupture, TUN.ruptureMax, 'Rupture stops at twenty');
  ok(Math.abs(r0.buffs.find(w => w.name === 'Раскалывание').v - 3) < 1e-9, 'which means +300%');
  ok(b.dmgCalc(r0, t2, 1, { kind: 'ult' }, false) > u0 * 1.5, 'ultimates hit harder');
  const hitBy = (rup, tt) => { b.pf.rupture = rup; b.actSerial++; return b.hit(r0, tt, 1, { kind: 'fusion' }); };
  const fu0 = hitBy(0, t2), fu1 = hitBy(10, t2);
  ok(fu1 > fu0 * 1.2, 'a fusion gets the bonus too: ' + fu0 + ' and ' + fu1);

  const old = mk();
  old.pf().plan[1] = { team: [team.slice(), []] };
  eq(old.pfCaco(1, 0).id, 'erupt', 'a plan without an effect gets the first one');
  old.pfSetCaco(1, 1, 2);
  eq(old.pfCaco(1, 1).id, 'rupture', 'each node keeps its own effect');
  eq(old.pfCaco(1, 0).id, 'erupt', 'the other node stays');
  eq(old.pfOpts(1, 1, team, 5).pf.caco, 'rupture', 'the fight takes the effect of its node');
  eq(old.pfOpts(1, 1, team, 5).pf.whim, 'shatter', 'and the rule of the season');
  const full = run(fx('excite', 21, 0.05));
  eq(old.pfReport(full).score, 40000, 'a clear with effects still pays exactly 40 000');
  eq(old.pfReport(full).caco, 'excite', 'the report names the effect');
}

{
  const r = (new H.Game({ seed: 1 })).rangeOrigin('pf_trotter');
  ok(/Чистый вымысел/.test(r.text), 'the Range knows where the trotter comes from: ' + r.text);
}

{
  const src = fs.readFileSync(path.join(DIR, 'hsr-hd-simver.js'), 'utf8');
  ok(src.length > 0, 'the network version file is in place');
  ok(!Object.keys(T).some(k => /^pf/i.test(k)), 'the mode keeps its numbers out of the shared tuning table');
  for (const f of ['hsr-pf-data.js', 'hsr-pf-battle.js', 'hsr-pf.js', 'hsr-pf-story.js', 'hsr-ui-pf.js', 'hsr-ui-pf-team.js', 'hsr-ui-pf-battle.js', 'hsr-pf-art.js']) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8');
    ok(!/—/.test(text), f + ' has no long dashes');
    ok(!/(^|\s)\/\/\s|\/\*/.test(text), f + ' has no comments');
  }
  for (const f of ['index.html', 'hsr98.html']) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of ['hsr-pf-data', 'hsr-pf-battle', 'hsr-pf', 'hsr-pf-story', 'hsr-pf-art', 'hsr-ui-pf', 'hsr-ui-pf-team', 'hsr-ui-pf-battle']) ok(text.includes('js/apps/hsr98/' + m + '.js'), f + ' loads ' + m);
  }
}

{
  const stageOf = (g, n, node, seed, patch) => { const o = g.pfOpts(n, node, team, seed); Object.assign(o, patch || {}); return new H.Battle(o); };
  const g = mk();
  eq(PF.SEASONS[0].stages.length, 4, 'the season has four stages');
  for (const st of PF.SEASONS[0].stages) {
    eq(st.nodes.length, 2, 'stage ' + st.n + ' has two nodes');
    eq(st.cycles, TUN.cycles[st.n - 1], 'stage ' + st.n + ' cycles');
    st.nodes.forEach((node, ni) => {
      for (const seed of [1, 2]) {
        const b = run(stageOf(g, st.n, ni, seed, { foeHp: 0.02, foeAtk: 0.01 }));
        const R = g.pfReport(b);
        eq(R.end, 'clear', 'stage ' + st.n + '.' + (ni + 1) + ' can be cleared, seed ' + seed);
        eq(R.score, 40000, 'stage ' + st.n + '.' + (ni + 1) + ' pays 40 000, seed ' + seed);
      }
    });
  }

  const boss = stageOf(g, 4, 1, 3, { foeHp: 200, foeAtk: 0.01 });
  boss.start();
  boss.drain();
  boss.wave = 2;
  boss.spawnWave(false);
  boss.drain();
  const lord = boss.enemies.find(u => u.data.boss), hero = boss.allies[0];
  eq(lord.id, 'svarog_b', 'the boss of the node stands in the wave');
  eq(lord.pfSlot, Math.floor(boss.opts.pf.waves[2].max / 2), 'in the middle slot');
  ok(lord.pfEloq, 'with Rhetoric');
  ok(lord.data.skills.filter(s => s.t === 'summon').every(s => s.max === -1), 'and no summons');
  ok(H.ENEMIES.svarog_b.skills.some(s => s.t === 'summon' && s.max !== -1), 'the table keeps them');
  boss.hit(hero, lord, 0, { raw: lord.maxHp * 3 });
  eq(lord.hp, 1, 'Rhetoric holds the boss at 1');
  ok(!lord.dead, 'the boss stands');
  eq(Math.round(lord.pfLeft), 0, 'the health part of the price is paid');
  const paid = boss.pf.score;
  boss.hit(hero, lord, 0, { raw: lord.maxHp * 3 });
  eq(boss.pf.score, paid, 'a held boss pays no more');
  const after = boss.drain();
  ok(after.some(e => e.t === 'pfhold' && e.u === lord), 'the screen learns about the hold');
  eq(boss.autoTarget(hero) === lord, false, 'the auto battle leaves a held boss');
  for (let i = 0; i < TUN.eloq - 1; i++) {
    const v = boss.living.find(u => !u.data.boss);
    boss.hit(hero, v, 0, { raw: v.maxHp * 2 });
    boss.cleanup();
  }
  ok(lord.pfEloq, 'eleven kills are not enough');
  const v12 = boss.living.find(u => !u.data.boss);
  boss.hit(hero, v12, 0, { raw: v12.maxHp * 2 });
  ok(!lord.pfEloq, 'the twelfth kill removes Rhetoric');
  eq(lord.buffs.find(b => b.name === 'Без Риторики').v, TUN.eloqVuln, 'and leaves the weakness');
  ok(boss.drain().some(e => e.t === 'pfeloq' && e.u === lord), 'the screen learns about it');
  const score0 = boss.pf.score;
  boss.hit(hero, lord, 0, { raw: 10 });
  ok(lord.dead, 'now the boss falls');
  ok(Math.abs(boss.pf.score - score0 - TUN.boss.k) < 1, 'and pays the rest of its price');

  const held = stageOf(g, 4, 0, 5, { foeHp: 400, foeAtk: 0.01, foeTurns: 0 });
  held.start();
  held.drain();
  held.wave = 2;
  held.spawnWave(false);
  held.drain();
  const summoned = held.enemies.length;
  for (let i = 0; i < 300 && !held.over; i++) { held.autoStep(); held.drain(); }
  ok(!held.enemies.some(u => u.pfExtra), 'no boss calls extra enemies');
  ok(held.living.length <= held.opts.pf.waves[2].max, 'the cap holds with a boss: ' + summoned);

  const f = mk(team.concat(['serval', 'bailu', 'kafka', 'pela']), 50), F = f.pf();
  f.state.party = team.slice();
  eq(f.pfOpen(1), true, 'stage 1 is open');
  eq(f.pfOpen(2), false, 'stage 2 waits');
  eq(f.pfOpen(5), false, 'there is no stage 5');
  eq(f.pfBegin(2), null, 'a closed stage does not start');
  const r1 = f.pfBegin(1);
  eq(r1.team[0].join(), team.join(), 'the run takes the teams of the plan');
  eq(r1.caco.join(), 'erupt,erupt', 'and their effects');
  ok(f.pfFight(9), 'the first node starts');
  eq(f.battle.opts.pf.node, 0, 'it is node 1');
  eq(F.run.seed, 9, 'the run keeps the seed for reports');
  f.pfDrop();
  r1.scores = [15000, 13000];
  let done = f.pfFinish();
  eq(done.total, 28000, 'the stage sums both nodes');
  eq(done.beat, true, 'the first result is a record');
  eq(done.clear, false, 'below the threshold');
  eq(f.pfOpen(2), false, 'stage 2 stays closed');
  eq(f.pfStars(1), 0, 'no stars below the threshold');
  eq(F.run, null, 'the run closes');
  f.pfBegin(1).scores = [22000, 20000];
  done = f.pfFinish();
  eq(done.clear, true, 'the threshold is passed');
  eq(done.opened, true, 'the next stage opens');
  eq(f.pfOpen(2), true, 'stage 2 is open');
  eq(f.pfTopStage(), 2, 'the top stage moves');
  eq(done.fresh.join(), 'true,false,false', 'one new star');
  eq(f.pfStars(1), 1, 'one star on the stage');
  const best = F.st[1].best, stars = F.st[1].stars.join();
  f.pfBegin(1).scores = [10000, 10000];
  done = f.pfFinish();
  eq(done.beat, false, 'a lower sum is no record');
  eq(F.st[1].best, best, 'the record stays');
  eq(F.st[1].stars.join(), stars, 'the stars stay');
  eq(done.best, best, 'the result names the record');
  ok(done.fresh.every(x => !x), 'no new star');
  eq(done.opened, false, 'nothing new opens');
  f.pfBegin(1).scores = [30000, 31000];
  done = f.pfFinish();
  eq(done.oldBest, best, 'the old record is known');
  eq(done.fresh.join(), 'false,true,true', 'two more stars');
  eq(F.st[1].team[0].join(), team.join(), 'the record keeps the team');
  eq(f.pfStarTotal(), 3, 'stars of the season');
  F.st[2] = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: [] };
  F.st[3] = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: [] };
  F.st[4] = { best: 60000, nodes: [30000, 30000], stars: [true, true, true], clear: true, team: [[], []], caco: [] };
  for (const n of [1, 2, 3, 4]) eq(f.pfStars(n), 3, 'three stars on stage 4 count for stage ' + n);
  eq(f.pfStarTotal(), 12, 'twelve stars in the season');

  const saved = mk(team.concat(['serval', 'bailu', 'kafka', 'pela']), 50);
  saved.state.party = team.slice();
  const left = saved.pfBegin(1);
  left.scores[0] = 21000;
  left.node = 1;
  const copy = JSON.parse(JSON.stringify(saved.serialize()));
  eq(copy.pf.run.scores[0], 21000, 'the run goes into the save');
  eq(copy.pf.run.node, 1, 'with its node');
  const loaded = mk();
  loaded.state.pf = { plan: { 1: { team: [team.slice(), []] } }, proto: { 1: { scores: [5000, 0] } } };
  const fixed = loaded.pf();
  ok(fixed.st && !fixed.proto && fixed.run === null, 'a save from the prototype gets the new record');
  eq(loaded.pfCaco(1, 0).id, 'erupt', 'and keeps working');

  const quit = mk(team.concat(['serval']), 50);
  quit.state.party = team.slice();
  quit.pfBegin(1).scores = [9000, 0];
  quit.pfLeave();
  eq(quit.pf().run, null, 'leaving drops the run');
  ok(!quit.pf().st[1], 'and writes nothing');
  const gone = mk(team.concat(['serval']), 50);
  gone.state.party = team.slice();
  const gr = gone.pfBegin(1);
  gr.node = 1;
  gr.team[1] = ['nobody'];
  eq(gone.pfFight(), null, 'a node without heroes does not start');
}

{
  const keys = team.concat(['serval', 'bailu', 'kafka', 'pela', 'sampo']);
  const g = mk(keys, 50);
  g.state.party = team.slice();
  const t0 = g.pfTeams(1);
  eq(t0[0].join(), team.join(), 'row 1 is the active team');
  eq(g.pfToggle(1, 0, team[0]).moved, null, 'a hero leaves its row');
  eq(g.pfTeams(1)[0].length, 3, 'the row has a free place');
  const second = g.pfTeams(1)[1][0];
  eq(g.pfToggle(1, 0, second).moved, 1, 'a hero of the other row moves and says from where');
  ok(g.pfTeams(1)[0].includes(second) && !g.pfTeams(1)[1].includes(second), 'one hero stands in one row');
  eq(g.pfToggle(1, 0, 'sampo'), false, 'a full row refuses');

  const flat = () => g.pfTeams(1).map(t => t.join()).join('|');
  const before = flat();
  g.pfSetCaco(1, 0, 2);
  g.pfSwapRows(1);
  eq(flat(), before.split('|').reverse().join('|'), 'rows change places');
  eq(g.pfCaco(1, 1).id, 'rupture', 'with their effects');
  eq(g.pfCaco(1, 0).id, 'erupt', 'on both sides');
  g.pfSwapRows(1);
  eq(flat(), before, 'and back');

  eq(g.pfLoadSquad(1, 0, 5), false, 'an empty template gives nothing');
  g.state.squads = [[], ['kafka', 'pela', 'serval', 'bailu', 'sampo']];
  ok(g.pfLoadSquad(1, 0, 1), 'a template goes into the row');
  eq(g.pfTeams(1)[0].join(), 'kafka,pela,serval,bailu', 'four heroes at most');
  ok(!g.pfTeams(1)[1].some(k => g.pfTeams(1)[0].includes(k)), 'the other row gives them up');
  g.state.roster.pela.guest = true;
  ok(g.pfLoadSquad(1, 1, 1), 'guests stay out of a template');
  ok(!g.pfTeams(1)[1].includes('pela'), 'and out of the row');
  delete g.state.roster.pela.guest;

  eq(g.pfLoadRecord(1), false, 'no record, nothing to load');
  g.pf().st[1] = { best: 41000, nodes: [21000, 20000], stars: [true, false, false], clear: true, quick: false, team: [['himeko', 'herta'], ['kafka', 'nobody']], caco: ['excite', 'rupture'] };
  ok(g.pfLoadRecord(1), 'the record loads');
  eq(g.pfTeams(1)[0].join(), 'himeko,herta', 'with its first team');
  eq(g.pfTeams(1)[1].join(), 'kafka', 'and the second, without lost heroes');
  eq(g.pfCaco(1, 0).id, 'excite', 'with its effect');
  eq(g.pfCaco(1, 1).id, 'rupture', 'in both rows');
  g.pf().st[1].team = [[], []];
  eq(g.pfLoadRecord(1), false, 'a record without a team gives nothing');

  g.pfClearRows(1);
  ok(g.pfTeams(1).every(t => !t.length), 'reset clears both rows');
  eq(g.pfCaco(1, 0).id, 'excite', 'and keeps the effects');
  eq(g.pfBegin(1), null, 'empty rows do not start');
  g.pfToggle(1, 0, 'himeko');
  eq(g.pfBegin(1), null, 'one empty row is enough to refuse');
  g.pfToggle(1, 1, 'kafka');
  ok(g.pfBegin(1), 'one hero in each row is enough');
  g.pfLeave();
}

{
  const S = PF.SEASONS[0], pages = PF.rulesPages(S), text = JSON.stringify(pages) + PF.QUOTE + PF.TUTORIAL.join(' ');
  eq(pages.length, 3, 'three rule tabs');
  eq(pages.map(p => p.tab).join('|'), 'Обзор|Нелепость и Какофония|Очки и разблокировка', 'the tabs of the plan');
  for (const v of [TUN.clear, ...TUN.stars, TUN.normal.d + TUN.normal.k, TUN.boss.d + TUN.boss.k]) ok(text.includes(H.fmt(v)), 'the rules take ' + v + ' from the numbers');
  ok(text.includes(Math.round(TUN.energyKill * 100) + '%'), 'the rules take the energy from the numbers');
  for (const st of S.stages) ok(text.includes('Этап ' + st.n + ': враги уровня ' + st.lvl + ', циклов на узел ' + st.cycles), 'the rules list stage ' + st.n);
  ok(text.includes(S.whim.text), 'the rules quote the season law');
  for (const it of S.caco) ok(text.includes(it.text), 'the rules quote ' + it.name);
  for (const bad of ['сверхспособн', 'Равновеси', 'Microsoft', 'Windows', '—']) ok(!text.includes(bad), 'the rules have no ' + bad);
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/hsr-pf/extract.json'), 'utf8'));
  const official = source.tutorials['Relentless Adversaries'].lines.map(l => l.ru);
  eq(PF.TUTORIAL.join('|'), official.join('|'), 'the lesson repeats the official lines');
  eq(PF.QUOTE, source.quote.ru, 'the quote is official');
  for (const line of ['Изменять членов отряда', 'Возвышать Световые конусы и Реликвии или повышать их уровни', 'Использовать любые расходные предметы в инвентаре', 'лишь 50% от энергии']) ok(source.rules.gen1.includes(line) && text.includes(line), 'official rule: ' + line);
}

{
  eq(PF.STAR_TIERS.length, 12, 'twelve star rewards');
  const sumOf = k => PF.STAR_TIERS.reduce((a, x) => a + x[k], 0);
  eq(sumOf('jade'), 800, 'the stars pay 800 jade');
  eq(sumOf('feather'), 600, 'the stars pay 600 feathers');
  eq(sumOf('credits'), 60000, 'the stars pay 60 000 credits');
  eq(PF.STAR_TIERS.map(x => x.need).join(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].join(), 'one reward for each star');
  const stages = PF.SEASONS[0].stages.length, F = PF.FICTION;
  eq(F.credits * stages, 30000, 'the stages pay 30 000 credits');
  eq(F.lucent * stages, 96, 'the stages pay 96 lucent');
  for (const id of ['exp3', 'exp2', 'aether3']) { eq(F[id] * stages, 12, 'the stages pay 12 of ' + id); ok(H.ITEMS[id], id + ' exists'); }
  for (const id of ['feather', 'lucent']) ok(H.ITEMS[id], id + ' exists');

  const g = mk();
  eq(g.pfFirstStage(), 1, 'the map starts on the first stage');
  g.pf().st[1] = { best: 41000, nodes: [21000, 20000], stars: [true, false, false], clear: true, quick: false, team: [[], []], caco: [] };
  eq(g.pfFirstStage(), 2, 'then on the first stage not cleared');
  g.pf().st[2] = { best: 28000, nodes: [14000, 14000], stars: [false, false, false], clear: false, quick: false, team: [[], []], caco: [] };
  eq(g.pfFirstStage(), 2, 'a low result does not count');
  g.pf().st[2].clear = true;
  g.pf().st[3] = { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, quick: false, team: [[], []], caco: [] };
  g.pf().st[4] = { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, quick: false, team: [[], []], caco: [] };
  eq(g.pfFirstStage(), 4, 'all cleared keeps the last');
  const info = g.pfMapInfo();
  eq(info.length, 4, 'the map knows four stages');
  eq(info[0].stars, 1, 'with stars');
  eq(info[0].best, 41000, 'and the record');
  ok(info.every(s => s.open && s.clear && !s.free), 'and the state');
  ok(g.pfDaysLeft() >= 1 && g.pfDaysLeft() <= TUN.days, 'days left stay inside the season: ' + g.pfDaysLeft());
  eq(g.pfDaysLeft(), g.fhShopLeft(), 'the season changes with the Jokes shop');
}

{
  const dn = H.FH.dayNum, day = 20790;
  eq(dn(atDay(day, 4)), day, 'a day starts at 04:00');
  eq(dn(atDay(day, 4) - 1), day - 1, 'and a moment earlier it is still the day before');
  eq(TUN.days, H.FH.TUN.shopDays, 'a season lasts as long as the Jokes shop');

  const base = 300 * TUN.days, g = mk();
  let now = atDay(base);
  g.clock = () => now;
  eq(g.pfPeriod(), 300, 'the period comes from the day');
  eq(g.pfDaysLeft(), TUN.days, 'a new season has all its days');
  now = atDay(base + TUN.days - 1);
  eq(g.pfDaysLeft(), 1, 'the last day is the last');
  eq(g.pfDaysLeft(), g.fhShopLeft(), 'and the shop counts the same');
  now = atDay(base + TUN.days, 4) - 1;
  eq(g.pfPeriod(), 300, 'the season still runs at 03:59');
  now = atDay(base + TUN.days, 4);
  eq(g.pfPeriod(), 301, 'and changes at 04:00');
  eq(g.pfDaysLeft(), 1, 'days left never reach zero before the sync');
}

{
  const heroes = team.concat(['serval', 'bailu', 'kafka', 'pela']);
  const first = 400;
  let now = atDay(first * TUN.days + 3);
  const g = mk(heroes);
  g.clock = () => now;
  const turn = periods => { now = atDay((g.pf().period + periods) * TUN.days + 1); };
  const play = (n, a, b) => { ok(g.pfBegin(n), 'stage ' + n + ' can start'); g.pf().run.scores = [a, b]; return g.pfFinish(); };
  const heard = () => { const out = g.events.filter(e => e.t === 'toast').map(e => e.text); g.events.length = 0; return out; };
  const purse = () => ({ jade: g.state.jade, credits: g.state.credits, feather: g.state.inv.items.feather || 0, lucent: g.state.inv.items.lucent || 0 });
  const spent = (was, key) => purse()[key] - was[key];
  const F = g.pf();

  eq(F.period, first, 'the first read stores the period');
  eq(g.pfSeason().id, 's1', 'an even period is the first season here');
  eq(g.pfSync(), false, 'the same period changes nothing');
  ok(!g.pfRefresh(), 'a closed mode does not refresh');
  ok(!g.pfAlert(), 'and has no mark');

  play(1, 31000, 31000);
  play(2, 30500, 30500);
  play(3, 25000, 20000);
  eq(g.pfStarTotal(), 7, 'seven stars before the first change');

  const w0 = purse();
  ok(g.pfClaimTier(1), 'the first star pays');
  eq(spent(w0, 'jade'), PF.STAR_TIERS[0].jade, 'in jade');
  eq(spent(w0, 'credits'), PF.STAR_TIERS[0].credits, 'and credits');
  eq(g.pfClaimTier(1), null, 'and only once');
  eq(g.pfClaimTier(8), null, 'a star not earned pays nothing');
  const w0b = purse();
  ok(g.pfClaimFiction(1), 'a cleared stage pays');
  eq(spent(w0b, 'credits'), PF.FICTION.credits, 'in credits');
  eq(spent(w0b, 'lucent'), PF.FICTION.lucent, 'and light');
  eq(g.pfClaimFiction(1), null, 'and only once');
  eq(g.pfClaimFiction(4), null, 'a stage not cleared pays nothing');

  g.state.flags.pf_open = true;
  F.seen[g.pfSeason().id] = true;
  ok(g.pfAlert(), 'rewards light the mark');
  heard();
  const w1 = purse();
  turn(1);
  ok(g.pfRefresh(), 'the first change arrives');
  eq(F.period, first + 1, 'with the new period');
  eq(g.pfSeason().id, 's2', 'and the next season');
  assert.deepEqual(F.hist, [{ period: first, season: 's1', stars: 7, best: [62000, 61000, 45000, 0] }]);
  eq(F.top3, 2, 'the highest stage with three stars is kept');
  const said1 = heard();
  ok(said1.includes('Чистый вымысел обновлён'), 'the change is announced');
  ok(said1.some(s => s.startsWith('Незабранные награды')), 'and so is the payout');
  eq(spent(w1, 'jade'), 6 * 60, 'unclaimed stars are paid in jade');
  eq(spent(w1, 'credits'), 6 * 5000 + 2 * PF.FICTION.credits, 'and credits');
  eq(spent(w1, 'feather'), PF.STAR_TIERS[6].feather, 'and feathers');
  eq(spent(w1, 'lucent'), 2 * PF.FICTION.lucent, 'and light');
  eq(F.got.length + F.fiction.length, 0, 'the claims start over');
  eq(Object.keys(F.seen).length, 0, 'the new splash is due');
  ok(g.pfAlert(), 'and the mark is on');
  ok(F.st[1].quick && F.st[2].quick && !F.st[3], 'stages up to the second pass by the last season');
  ok(F.free[1] && F.free[2] && !F.free[3], 'their parrots fly free');
  eq(g.pfStars(1), 3, 'a quick stage has three stars');
  eq(g.pfStarTotal(), 6, 'and they count');
  ok(g.pfOpen(3) && !g.pfOpen(4), 'the next stage is open');
  eq(g.pfDue(), 6 + 2, 'the quick stars and stages can be claimed');
  const map1 = g.pfMapInfo();
  ok(map1[0].quick && !map1[2].quick, 'the map knows quick stages');
  eq(g.pfLoadRecord(1), false, 'a quick stage has no team to load');
  eq(g.pfClaimTier(7), null, 'a seventh star is not there yet');
  ok(g.pfClaimTier(6), 'the sixth is');

  const low = play(1, 10000, 10000);
  ok(low.beat, 'a first real score counts');
  eq(F.st[1].best, 20000, 'and is the record');
  ok(!F.st[1].quick, 'the stage is no longer quick');
  eq(g.pfStars(1), 3, 'a weak run keeps the quick stars');
  ok(F.st[1].clear, 'and the pass');
  const lower = play(1, 5000, 5000);
  ok(!lower.beat, 'a lower sum is no record');
  eq(F.st[1].best, 20000, 'the record stays');
  eq(g.pfStars(1), 3, 'and the stars');
  play(3, 15000, 16000);
  play(4, 31000, 31000);
  eq(g.pfStarTotal(), 12, 'three stars on stage 4 count for all');

  ok(g.pfBegin(1), 'a run can start');
  F.run.scores[0] = 9000;
  heard();
  turn(1);
  ok(g.pfRefresh(), 'the second change arrives');
  eq(F.run, null, 'the unfinished run is gone');
  ok(heard().some(s => s.startsWith('Сезон сменился')), 'and the player hears about it');
  eq(F.hist[1].best[0], 20000, 'its points are not counted');
  eq(F.hist[1].stars, 12, 'the record has twelve stars');
  eq(F.top3, TUN.quickMax, 'quick unlock stops at the third stage');
  eq(g.pfSeason().id, 's1', 'the seasons go round');
  ok([1, 2, 3].every(n => F.st[n].quick) && !F.st[4], 'three stages pass');
  ok(g.pfOpen(4), 'the last one is open');
  eq(g.pfStarTotal(), 9, 'nine stars');

  const w3 = purse();
  turn(1);
  ok(g.pfRefresh(), 'the third change arrives');
  eq(spent(w3, 'jade'), 8 * 60 + 80, 'nine quick stars pay when left unclaimed');
  eq(spent(w3, 'credits'), 9 * 5000 + 3 * PF.FICTION.credits, 'and credits');
  eq(spent(w3, 'feather'), 3 * 100, 'and feathers');
  eq(F.hist.length, 3, 'three records');
  assert.deepEqual(F.hist[2].best, [0, 0, 0, 0]);
  eq(F.hist[2].stars, 9, 'a quick season is written as it was');
  eq(F.top3, TUN.quickMax, 'quick stages carry on');
  eq(g.pfSeason().id, 's2', 'the next season again');

  const held = F.period, heldSeason = g.pfSeason().id;
  now = atDay((held - 5) * TUN.days);
  eq(g.pfSync(), false, 'a clock moved back changes nothing');
  eq(F.period, held, 'the highest period stays');
  eq(g.pfSeason().id, heldSeason, 'and the season');
  ok(g.pfDaysLeft() > TUN.days, 'days left wait for the clock');
  now = atDay(held * TUN.days + 1);
  eq(g.pfSync(), false, 'the same period when the clock is right again');

  turn(3);
  ok(g.pfSync(), 'a long absence is one change');
  eq(F.period, held + 3, 'to the current period');
  eq(F.hist.length, 4, 'with one record');
  eq(g.pfSeason().id, PF.SEASONS[(held + 3) % 2].id, 'and the season of that period');

  for (let i = 0; i < TUN.histMax + 2; i++) { turn(1); g.pfSync(); }
  eq(F.hist.length, TUN.histMax, 'the history keeps its limit');
  eq(F.hist[F.hist.length - 1].period, F.period - 1, 'with the newest last');

  const nextMoment = moment => { now = moment; };
  const rich = mk(heroes);
  rich.clock = () => now;
  nextMoment(atDay(410 * TUN.days + 1));
  const richPlay = (n, a, b) => { rich.pfBegin(n); rich.pf().run.scores = [a, b]; rich.pfFinish(); };
  richPlay(1, 15000, 16000);
  richPlay(2, 15000, 16000);
  richPlay(3, 15000, 16000);
  richPlay(4, 31000, 31000);
  const richBefore = { jade: rich.state.jade, credits: rich.state.credits, feather: rich.state.inv.items.feather || 0 };
  ok(rich.pfClaimAll().length > 0, 'all rewards of a season come together');
  eq(rich.state.jade - richBefore.jade, 800, 'a season pays 800 jade');
  eq(rich.state.inv.items.feather - richBefore.feather, 600, 'and 600 feathers');
  eq(rich.state.credits - richBefore.credits, 12 * 5000 + 4 * PF.FICTION.credits, 'and its credits');
  assert.deepEqual(rich.pfClaimAll(), []);
  eq(rich.pfDue(), 0, 'nothing is due after that');
  rich.state.flags.pf_open = true;

  const savedState = JSON.parse(JSON.stringify(rich.serialize()));
  const loaded = new H.Game({ seed: 3, state: savedState, clock: () => atDay(411 * TUN.days + 1) });
  ok(loaded.state.pf.period === 411, 'a load in a new period changes the season');
  eq(loaded.state.pf.hist.length, 1, 'writes the history');
  eq(loaded.state.pf.top3, TUN.quickMax, 'keeps the best stage');
  eq(loaded.pfStarTotal(), 9, 'and sends the stars to the rewards');
  ok(loaded.events.some(e => e.t === 'toast' && e.text === 'Чистый вымысел обновлён'), 'with the notice');
  const again = new H.Game({ seed: 3, state: JSON.parse(JSON.stringify(rich.serialize())), clock: () => atDay(410 * TUN.days + 2) });
  ok(!again.events.some(e => e.t === 'toast' && e.text === 'Чистый вымысел обновлён'), 'a load in the same period says nothing');
  const shutState = JSON.parse(JSON.stringify(mk().serialize()));
  const shutLoad = new H.Game({ seed: 3, state: shutState, clock: () => atDay(411 * TUN.days + 1) });
  ok(!shutLoad.state.pf, 'a save that has not met the mode stays without it');

  let warNow = atDay(412 * TUN.days + 1);
  const war = mk(heroes);
  war.clock = () => warNow;
  war.state.flags.pf_open = true;
  war.pf();
  const fight = war.startBattle({ enemies: ['reaver:5'], lvl: 5, seed: 9 });
  run(fight);
  warNow = atDay(413 * TUN.days + 1);
  war.events.length = 0;
  war.endBattle();
  ok(war.events.some(e => e.t === 'toast' && e.text === 'Чистый вымысел обновлён'), 'leaving another battle in a new season brings the notice');
  eq(war.pf().period, 413, 'and the change');

  let lateNow = atDay(414 * TUN.days + 1);
  const late = mk(heroes);
  late.clock = () => lateNow;
  late.state.flags.pf_open = true;
  ok(late.pfBegin(1), 'a run starts in the old season');
  eq(late.pf().run.period, 414, 'and remembers its period');
  run(late.pfFight(77));
  const firstNode = late.endBattle();
  ok(!firstNode.pf.expired, 'a node inside the season is plain');
  eq(firstNode.pf.sum, firstNode.pf.score, 'and carries the sum of the stage');
  late.pf().run.node = 1;
  const lastFight = late.pfFight(78);
  run(lastFight);
  lateNow = atDay(415 * TUN.days + 1);
  late.events.length = 0;
  const lastNode = late.endBattle();
  ok(lastNode.pf.expired, 'a node that ends in a new season is written to the old one');
  eq(lastNode.pf.sum, firstNode.pf.score + lastNode.pf.score, 'with the whole sum');
  eq(late.pf().run, null, 'the run is over');
  eq(late.pf().period, 415, 'the new period is on');
  eq(late.pf().hist[0].best[0], lastNode.pf.sum, 'and the history has the score');
  ok(late.events.some(e => e.t === 'toast' && e.text === 'Чистый вымысел обновлён'), 'with the notice');
}

{
  const S2 = PF.seasonOf('s2'), heroes = team.concat(['kafka', 'sampo', 'guinaifen', 'huohuo']);
  const g = mk(heroes);
  g.clock = () => atDay(381 * TUN.days + 5);
  eq(PF.SEASONS.length, 2, 'two seasons take turns');
  eq(g.pfSeason().id, 's2', 'an odd period is the second season');
  eq(S2.hero, 'kafka', 'the second season has its own splash');
  eq(S2.caco.map(c => c.id).join(), 'slander,rumor,defame', 'and its own effects');
  const s2Text = JSON.stringify(S2);
  ok(!s2Text.includes('Выветривание'), 'the wind status has the name of this game');
  ok(!s2Text.includes('—'), 'the season has no long dashes');
  ok(!s2Text.includes('сверхспособност'), 'and uses the words of this game');
  ok(JSON.stringify(PF.rulesPages(S2)).includes(S2.whim.note), 'the rules explain how periodic damage grows');
  const wantRec = [['ice', 'wind'], ['elec', 'phys'], ['wind', 'elec'], ['fire', 'quant'], ['phys', 'wind'], ['fire', 'phys'], ['imag', 'elec'], ['fire', 'phys']];
  S2.stages.forEach((st, si) => st.nodes.forEach((node, ni) => assert.deepEqual(PF.recOf(node).sort(), wantRec[si * 2 + ni].slice().sort())));
  checks++;

  const stageOf = (n, node, seed, patch, keys = team) => { const o = g.pfOpts(n, node, keys, seed); Object.assign(o, patch || {}); return new H.Battle(o); };
  for (const st of S2.stages) {
    const opts = g.pfOpts(st.n, 0, team, 1);
    eq(opts.foeHp, TUN.sharpFoes.hp[st.n - 1], 'stage ' + st.n + ' has the health of the season');
    eq(opts.foeAtk, TUN.sharpFoes.atk[st.n - 1], 'and its attack');
    eq(opts.pf.season, 's2', 'and knows its season');
    eq(opts.pf.whim, 'sharp', 'and its rule');
    st.nodes.forEach((_, ni) => {
      const b = run(stageOf(st.n, ni, 3, { foeHp: 0.02, foeAtk: 0.01 }));
      eq(g.pfReport(b).score, 40000, 'second season ' + st.n + '.' + (ni + 1) + ' pays 40 000');
    });
  }
  eq(mk().pfOpts(1, 0, team, 1).foeHp, TUN.hp[0], 'the first season keeps its own health');

  const fight = (caco, patch) => { const o = g.pfOpts(1, 0, team, 9, caco); Object.assign(o, { foeAtk: 0.01, foeHp: 200 }, patch || {}); const b = new H.Battle(o); b.start(); b.drain(); return b; };
  const tick = { fixed: 1000, e: 'fire', isDot: true, dot: true };
  const smallTick = { fixed: 40, e: 'fire', isDot: true, dot: true };
  const burn = hero => ({ type: 'burn', dmg: 1, turns: 2, src: hero, stacks: 1 });
  const without = (b, fn) => { const fx = b.pf.fx; b.pf.fx = []; const v = fn(); b.pf.fx = fx; return v; };
  const near = (a, b, m) => ok(Math.abs(a / b - 1) < 0.01, m + ': ' + a + ' / ' + b);

  {
    const b = fight('defame'), foe = b.enemies[0], hero = b.allies[0];
    near(b.dmgCalc(hero, foe, 0, tick, false) / without(b, () => b.dmgCalc(hero, foe, 0, tick, false)), (1 + TUN.dotUp) * TUN.dotHp * 200, 'periodic damage grows by the rule and the health of the stage');
    const breakHit = { fixed: 1000, e: 'fire', isDot: true };
    eq(b.dmgCalc(hero, foe, 0, breakHit, false), without(b, () => b.dmgCalc(hero, foe, 0, breakHit, false)), 'other damage of that kind stays as it is');
    const strikeHit = {};
    eq(b.dmgCalc(hero, foe, 1, strikeHit, false), without(b, () => b.dmgCalc(hero, foe, 1, strikeHit, false)), 'and so does a plain attack');

    const hard = fight('defame', { foeAtk: 20 }), foe2 = hard.enemies[0], hero2 = hard.allies[0];
    foe2.dots = [];
    const clean0 = hard.dmgCalc(foe2, hero2, 1, {}, false);
    eq(clean0, without(hard, () => hard.dmgCalc(foe2, hero2, 1, {}, false)), 'a foe without periodic damage hits as usual');
    foe2.dots.push(burn(hero2));
    near(hard.dmgCalc(foe2, hero2, 1, {}, false), clean0 * (1 - TUN.dotFoeCut), 'a foe with it hits weaker');

    const c = fight('defame'), foe3 = c.enemies[1], hero3 = c.allies[0];
    foe3.dots = [];
    foe3.av = 5000;
    c.actSerial = 50;
    c.hit(hero3, foe3, 0.001, { kind: 'basic' });
    eq(foe3.av, 5000, 'a foe without periodic damage does not move when hit');
    foe3.dots.push(burn(hero3));
    c.actSerial++;
    c.hit(hero3, foe3, 0.001, { kind: 'basic' });
    const moved = foe3.av;
    ok(moved < 5000, 'a foe with it moves ahead');
    foe3.av = 5000;
    c.advance(foe3, TUN.dotAdv);
    eq(moved, foe3.av, 'by the share of the rule');
    foe3.av = 5000;
    c.hit(hero3, foe3, 0.001, { kind: 'basic' });
    eq(foe3.av, 5000, 'once in one action');
    c.actSerial++;
    c.hit(hero3, foe3, 0, smallTick);
    eq(foe3.av, 5000, 'and only when attacked');
    c.hit(foe3, hero3, 0.001, {});
    eq(foe3.av, 5000, 'not when it attacks');
  }

  {
    const b = fight('slander'), hero = b.allies[0], mid = b.enemies.find(u => u.pfSlot === 2), edge = b.enemies.find(u => u.pfSlot === 0);
    b.hit(hero, mid, 0, smallTick);
    let echoes = b.drain().filter(e => e.t === 'dmg' && e.label === 'Клевета');
    eq(echoes.length, 2, 'slander reaches both neighbours, and no further');
    ok(echoes.every(e => Math.abs(e.u.pfSlot - mid.pfSlot) === 1), 'the neighbours by slot');
    for (const e of echoes) eq(e.v, b.dmgCalc(hero, e.u, 0, { fixed: smallTick.fixed * TUN.slander, e: smallTick.e, isDot: true, dot: true }, false), 'with the share of the first damage');
    b.hit(hero, edge, 0, smallTick);
    echoes = b.drain().filter(e => e.t === 'dmg' && e.label === 'Клевета');
    eq(echoes.length, 1, 'a foe at the edge has one neighbour');
    b.hit(hero, mid, 0.001, { kind: 'basic' });
    eq(b.drain().filter(e => e.t === 'dmg' && e.label === 'Клевета').length, 0, 'a plain attack does not spread');
  }

  {
    const b = fight('rumor'), hero = b.allies[0], foe = b.enemies[1];
    foe.dots = [];
    foe.av = 5000;
    b.actSerial = 70;
    b.hit(hero, foe, 0.001, { kind: 'basic' });
    const d = foe.dots.find(x => x.type === 'shear');
    ok(d, 'rumors put the wind status on the target');
    eq(d.turns, TUN.rumorTurns, 'for its turns');
    near(d.dmg, TUN.rumor * T.enemyHp * H.grow(foe.lvl), 'with the power of the table');
    eq(foe.av, 5000, 'the first attack finds no status yet');
    d.turns = 1;
    b.hit(hero, foe, 0.001, { kind: 'basic' });
    eq(d.turns, 1, 'once in one action');
    b.actSerial++;
    b.hit(hero, foe, 0.001, { kind: 'basic' });
    eq(d.turns, TUN.rumorTurns, 'and again in the next');
    ok(foe.av < 5000, 'then the rule moves the foe ahead');
    foe.dots = [];
    b.actSerial++;
    b.hit(hero, foe, 0, smallTick);
    eq(foe.dots.length, 0, 'periodic damage does not spread the status');
  }

  {
    const b = fight('defame'), foe = b.enemies[0], [a0, a1] = b.allies;
    a0.hp = Math.round(a0.maxHp * 0.8);
    a1.hp = Math.round(a1.maxHp * 0.5);
    a1.av = 5000;
    const hp0 = a0.hp, hp1 = a1.hp;
    b.hit(a0, foe, 0, smallTick);
    eq(a0.hp, hp0, 'the rest of the team stays');
    near(a1.hp - hp1, a1.maxHp * TUN.defameHeal, 'the lowest hero heals');
    const moved = a1.av;
    ok(moved < 5000, 'and moves ahead');
    a1.av = 5000;
    b.advance(a1, TUN.defameAdv);
    eq(moved, a1.av, 'by the share of the table');
    const hp2 = a1.hp;
    b.hit(a0, foe, 0.001, { kind: 'basic' });
    eq(a1.hp, hp2, 'a plain attack does not heal');
  }

  const dots = ['kafka', 'sampo', 'guinaifen', 'huohuo'];
  for (const caco of ['slander', 'rumor', 'defame']) for (const node of [0, 1]) {
    const o = g.pfOpts(4, node, dots, 11 + node, caco), b = new H.Battle(o);
    run(b, x => { ok(!x.enemies.some(u => u.pfExtra), 'no summons in the second season'); });
    ok(b.over, caco + ' ends the fight on stage 4.' + (node + 1));
    ok(g.pfReport(b).score > 0, 'and pays');
  }

  const BOT = require(path.join(ROOT, 'tools/hsr-pf-bot.cjs'));
  const ALL = Object.keys(BOT.TEAMS).filter(k => k !== 'storm2');
  const clash = (a, b) => BOT.TEAMS[a].some(k => BOT.TEAMS[b].includes(k));
  const bestPair = (table, names) => {
    let top = null;
    names.forEach((a, i) => names.slice(i + 1).forEach(b => {
      if (clash(a, b)) return;
      const v = BOT.pairBest(table, a, b);
      if (!top || v > top.v) top = { v, a, b };
    }));
    return top;
  };
  const results = [0, 1].map(season => BOT.bands(season, 4, ALL));
  results.forEach((rows, season) => {
    const cells = rows.flatMap(r => r.ok);
    ok(cells.filter(Boolean).length >= 15, 'season ' + (season + 1) + ' stays in its bands: ' + cells.filter(Boolean).length + ' of ' + cells.length);
    for (const r of rows) r.ranks.forEach((rank, i) => ok(r.want[i].some(w => Math.abs(w - rank) <= 1), 'season ' + (season + 1) + ', stage ' + r.n + ', heroes ' + r.lvl + ', pair ' + i + ' is one step off at most: ' + Math.round(r.sums[i])));
  });
  const totals = rows => { const out = {}; for (const r of rows) for (const k of ALL) out[k] = (out[k] || 0) + r.table[k][0].score + r.table[k][1].score; return out; };
  const [t1, t2] = results.map(totals), share = o => o.dot / Math.max(...Object.values(o));
  ok(share(t1) < 0.7, 'periodic damage is far from the first place in the first season: ' + share(t1).toFixed(2));
  ok(share(t2) > 0.85, 'and close to it in the second: ' + share(t2).toFixed(2));
  const pairsOf = rows => rows.map(r => bestPair(r.table, ALL));
  const named = p => p.a + '+' + p.b, first = pairsOf(results[0]), second = pairsOf(results[1]);
  eq(first.filter(p => named(p) === 'aoe+jy').length, first.length, 'the first season has one best pair everywhere');
  ok(second.filter(p => p.a === 'dot' || p.b === 'dot').length >= 3, 'the second season needs periodic damage in its best pair: ' + second.map(named).join());
  ok(second.filter(p => named(p) === 'aoe+jy').length < first.length, 'so the best pair of the first season is not always best');
  const atSeventy = rows => rows.find(r => r.n === 4 && r.lvl === 70);
  ok(bestPair(atSeventy(results[0]).table, ALL.filter(k => !['aoe', 'jy', 'allin'].includes(k))).v < 60000, 'stage 4 at heroes 70 gives no three stars without the kind of the first season');
  ok(bestPair(atSeventy(results[1]).table, ALL.filter(k => k !== 'dot')).v < 60000, 'and none without the kind of the second');

  for (const season of [0, 1]) {
    const won = new Set();
    for (const row of [BOT.BANDS[0], BOT.BANDS[2], BOT.BANDS[5]]) BOT.tableOf(ALL, Object.assign({ season, seeds: 2, cone: 'std' }, row), (name, node, rows, top) => { if (rows.some(x => x.r.score < top.r.score)) won.add(top.id); });
    for (const c of PF.SEASONS[season].caco) ok(won.has(c.id), c.name + ' is the best choice for some team');
  }
}

{
  const keys = team.concat(['serval', 'bailu', 'kafka', 'pela']);
  const g = mk(keys, 40);
  g.state.party = team.slice();
  const drive = (picks = []) => {
    for (let i = 0; i < 3000; i++) {
      const q = g.pending;
      if (q) {
        if (q.type === 'ui') return q.ui;
        if (q.type === 'choice') {
          const want = picks.length ? picks.shift() : 0;
          const at = typeof want === 'string' ? q.options.findIndex(o => o[0].includes(want)) : want;
          ok(at >= 0, 'the choice offers ' + want);
          g.resume(at);
        } else g.resume();
        continue;
      }
      if (!g.script) return null;
      g.advanceScript();
    }
    ok(false, 'a script does not end');
    return null;
  };

  ok(!H.SCRIPTS.lab_term_pf && !H.MAPS.express_lab.marks.y, 'the temporary terminal is gone');
  ok(!H.MAPS.express_lab.rows.join('').includes('y'), 'and leaves no mark on the map');
  g.chatSync();
  ok(!g.chatThread('pf_call'), 'no letter before the Sanctum');
  eq(g.state.quests.pf_decor, undefined, 'and no mission');
  g.state.flags.lf_s_arrive = true;
  g.chatSync();
  ok(g.chatThread('pf_call'), 'the letter comes with the Sanctum');
  eq(g.chats().th.pf_call.done, undefined, 'and waits to be read');
  g.chatAuto('pf_call');
  eq(g.state.quests.pf_decor, 'talk', 'reading it starts the mission');

  g.loadMap('lf_sanctum', 'v');
  clean(g);
  const rows = H.MAPS.lf_sanctum.rows;
  ok(rows.every(r => r.length === rows[0].length), 'the map keeps its width');
  const seen = new Set(), queue = [[g.player.x, g.player.y]], D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  seen.add(queue[0].join());
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of D) { const k = (x + dx) + ',' + (y + dy); if (!seen.has(k) && !g.blocked(x + dx, y + dy)) { seen.add(k); queue.push([x + dx, y + dy]); } }
  }
  const at = ch => g.map.ents.find(e => e.ch === ch);
  const cage = at('М'), desk = at('Й'), keeper = at('И');
  ok(cage && desk && keeper, 'the shop has its people and things');
  ok(seen.has(cage.x + ',' + (cage.y + 1)), 'the cage can be reached from the pier');
  ok(seen.has(desk.x + ',' + (desk.y + 1)), 'and the counter');
  const anchor = g.map.ents.find(e => e.kind === 'anchor' && e.y === 34);
  ok(anchor && seen.has(anchor.x + ',' + (anchor.y + 1)), 'and the anchor of the courtyard');
  ok(seen.has('41,20'), 'and the east of the yard');
  ok(seen.has(at('Г').x + ',' + (at('Г').y + 1)), 'and the plaza');
  eq(keeper.x, desk.x, 'the keeper stands behind the counter');
  eq(keeper.y, desk.y - 1, 'right behind it');

  const face = (e, dir) => { g.placePlayer(e.x, e.y + 1); g.player.dir = dir || 'up'; };
  face(desk);
  ok(g.interact(), 'the counter answers');
  eq(drive(), null, 'the keeper talks and stops');
  ok(g.state.flags.pf_ys_met, 'the first meeting is noted');
  face(desk);
  ok(g.interact(), 'she talks again');
  ok(g.pending || g.script, 'with a short line');
  eq(drive(), null, 'and stops');

  eq(g.visible(cage), true, 'the cage stands from the start of the mission');
  face(cage);
  ok(g.interact(), 'the cage talks');
  eq(drive(['Ты рассказываешь', 'Мне нельзя', 'дела']), null, 'the first talk can end with other matters');
  eq(g.state.quests.pf_decor, 'talk', 'the step stays');
  ok(g.state.flags.pf_met && !g.state.flags.pf_open, 'the meeting is noted, the mode stays closed');
  ok(g.state.recaps.some(r => (r.title || r.id || r) === 'Новый питомец' || JSON.stringify(r).includes('Новый питомец')), 'the scene leaves a recap');
  face(cage);
  ok(g.interact(), 'the cage talks again');
  ok(g.pending && /давай я расскажу/.test(g.pending.text), 'with the short line');
  eq(drive(['Рассказывай']), 'pf', 'the answer opens the story');
  ok(g.state.flags.pf_open, 'the mode is open');
  eq(g.state.quests.pf_decor, 'listen', 'the step moves on');
  g.resume();
  eq(drive(), null, 'the scene ends');
  ok(g.navPoints('lf_sanctum').some(p => p.kind === 'pf' && p.name === 'Чистый вымысел'), 'the cage shows on the area map');
  ok(H.QUESTS.pf_decor.steps.talk.at === 'lf_sanctum:М' && H.QUESTS.pf_decor.steps.listen.at === 'lf_sanctum:М', 'the mission points at the cage');

  face(cage);
  ok(g.interact(), 'the cage talks while the story waits');
  eq(drive(), 'pf', 'and opens the story again');
  g.resume();
  drive();

  ok(g.pfAfterDue(1), 'the first end of stage 1 will close the mission');
  ok(!g.pfAfterDue(2), 'other stages do not');
  const credits = g.state.credits, feathers = g.state.inv.items.feather || 0;
  g.runScript('pf_after');
  eq(drive(['случилась']), null, 'the last scene plays');
  eq(g.state.quests.pf_decor, 'done', 'the mission closes');
  eq((g.state.inv.items.feather || 0) - feathers, 20, 'it pays 20 feathers');
  eq(g.state.credits - credits, 1250, 'and 1 250 credits');
  ok(!g.pfAfterDue(1), 'and does not come back');

  face(cage);
  ok(g.interact(), 'the cage opens its menu');
  eq(drive(['Хронику']), 'pf', 'the menu opens the story');
  g.resume();
  drive();
  face(cage);
  g.interact();
  eq(drive(['Бесценные']), 'fh_shop', 'the menu opens the shop');
  g.resume();
  drive();
  face(cage);
  g.interact();
  eq(drive(['другие дела']), null, 'the menu can end');
  const taleOf = () => {
    const sc = g.script;
    face(cage);
    g.interact();
    const lines = [];
    for (let i = 0; i < 400; i++) {
      const q = g.pending;
      if (q) { if (q.type === 'choice') g.resume(q.options.findIndex(o => o[0].includes('менее'))); else { if (q.text) lines.push(q.text); g.resume(); } continue; }
      if (!g.script) break;
      g.advanceScript();
    }
    return lines.join(' ') + (sc ? '' : '');
  };
  const t1 = taleOf(), t2 = taleOf(), t3 = taleOf();
  ok(t1.includes('Хук Великий Мрак'), 'the first tale');
  ok(t2.includes('судила Броню'), 'the second tale');
  ok(t3.includes('Хук Великий Мрак'), 'without Qingque the general waits and the first comes back');
  g.state.flags.lf_qingque = true;
  const t4 = taleOf(), t5 = taleOf();
  ok(t4.includes('судила Броню') || t4.includes('серый генерал'), 'the order goes on');
  ok((t4 + t5).includes('серый генерал'), 'after Qingque the general has a turn');
  const allTales = PF.TALES.map(x => x.lines.join(' ')).join(' ');
  for (const bad of ['сверхспособн', 'Microsoft', 'Windows', '—']) ok(!allTales.includes(bad), 'tales have no ' + bad);
  face(cage);
  g.interact();
  const answers = drive(['вопросов', 'на самом деле', 'хочешь', 'только со мной', 'больше нет', 'другие дела']);
  eq(answers, null, 'the questions go round and return to the menu');

  const feather = H.ITEMS.feather.text;
  ok(feather.includes('Фоменко') && feather.includes('Шутки сбываются') && !feather.includes('—'), 'the feather has its official story');
  for (const name of ['youci', 'yinshu', 'xiyan']) ok(H.SPEAKERS[name] && H.SPEAKERS[name].name && H.SPEAKERS[name].look, name + ' can speak');
  eq(H.CHAT.CONTACTS.xiyan.sign, 'Не растрачивай слова на тех, кто не понимает', 'the official signature');
  ok(H.MISSION_CHAPTERS.adv_luofu, 'the mission has a chapter');
  const scripts = ['pf_cage', 'pf_meet', 'pf_after', 'pf_menu', 'pf_tale', 'pf_ask', 'pf_yinshu'];
  for (const s of scripts) for (const st of H.SCRIPTS[s]) {
    const text = typeof st === 'string' ? st : JSON.stringify(st);
    ok(!text.includes('—') && !text.includes('сверхспособн'), s + ' keeps the terms');
    if (typeof st === 'string' && st[0] !== '#') ok(st.slice(st.indexOf('|') + 1).length <= 480, s + ' line fits');
  }
}

{
  const noop = () => { };
  const makeCanvas = (w = 300, h = 150) => {
    const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }) };
    const grad = () => ({ addColorStop: noop });
    const ctx = {
      canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: false, fillStyle: '#000', strokeStyle: '#000',
      save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, rect: noop, fill: noop, stroke: noop, clip: noop, ellipse: noop,
      fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
      measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
      getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
      createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
    };
    cv.getContext = () => ctx;
    return cv;
  };
  const store = new Map();
  Object.assign(globalThis, {
    document: { createElement: tag => (tag === 'canvas' ? makeCanvas() : { style: {}, appendChild: noop, addEventListener: noop }), querySelector: () => null, addEventListener: noop, removeEventListener: noop },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    requestAnimationFrame: () => 1, cancelAnimationFrame: noop
  });
  const listed = [...page.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  for (const f of listed.filter(x => x !== 'hsr-bug' && x !== 'hsr-ui-bug')) require(path.join(DIR, f + '.js'));

  const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
  const ui = new H.UI(root, { onExit: noop });
  const G = H.Gfx, nextTeam = ['serval', 'bailu', 'kafka', 'pela'];
  const g = mk([...team, ...nextTeam]);
  for (const k of [...team, ...nextTeam]) g.debugChar(k, 80, 6, 0);
  ui.game = g;
  ui.mode = 'field';
  g.loadMap('express_lab', 'v');
  clean(g);
  ui.options.ultCine = 'off';
  g.pf().plan[1] = { team: [team.slice(), nextTeam.slice()] };
  const W_RIGHT = H.UI_CONST.W;
  const pump = n => { for (let i = 0; i < n; i++) { ui.update(1 / 30); ui.render(); } };
  const press = (k, code) => ui.handleKey(k, code || null, {});
  const start = (node, seed) => { if (!g.pf().run) g.pfBegin(1); g.pf().run.node = node; g.pfFight(seed); ui.drainGameEvents(); pump(1); return ui.bt; };
  const until = (test, max = 12000) => { for (let i = 0; i < max && !test(); i++) pump(1); return test(); };
  const idle = () => { const b = g.battle; return b && b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur && !ui.bt.ult && ui.bt.intro <= 0; };

  const bg = G.bgCanvas('pf', 640, 480);
  eq(bg.width, 640, 'the terrace background fits the screen');
  ok(G.bgCanvas('pf', 640, 480) === bg, 'the terrace background is painted once');
  ok(G.bgCanvas('lf_night', 640, 480) !== bg, 'other backgrounds stay themselves');
  ok(G.bgCanvas('pf', 320, 240) !== bg, 'each size has its own canvas');
  const proto = new H.Audio();
  proto.ctx = null;
  for (const id of ['pfpage', 'pfstar', 'pfrun', 'pflast', 'pfchain']) proto.sfx(id);
  ok(true, 'the new sounds wait for the audio context');

  const fired = [];
  const toneRec = { ctx: { currentTime: 1 }, tone: (...a) => fired.push(['tone', a]), noise: (...a) => fired.push(['noise', a]) };
  for (const id of ['pfpage', 'pfstar', 'pfrun', 'pflast', 'pfchain']) {
    const n = fired.length;
    H.Audio.prototype.sfx.call(toneRec, id);
    ok(fired.length > n, id + ' makes a sound');
  }

  const normal = clean(new H.Game({ seed: 3 }));
  normal.startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, seed: 8 });
  ok(normal.battle.orderSnap(normal.battle.current).pfAv === undefined, 'an order snapshot outside the mode has no cycle mark');

  let bt = start(0, 12345);
  const fight = g.battle;
  eq(ui.mode, 'battle', 'the node opens the battle screen');
  eq(bt.bg, 'pf', 'the node uses the terrace background');
  ok(bt.order && bt.order.pfAv != null, 'the order snapshot carries the cycle mark');
  for (const u of fight.enemies) eq(!!u.data.pfGhost, !u.data.boss && !u.data.elite, u.id + ' ghost flag');
  for (const u of fight.enemies) eq(!!u.data.pfRim, !!(u.data.boss || u.data.elite), u.id + ' rim flag');
  ok(!H.ENEMIES[fight.enemies[0].id].pfGhost, 'the look flags stay on the copy of the table');

  const said = list => { const out = [], text0 = ui.text; ui.text = function (s, ...a) { out.push(String(s)); return text0.call(this, s, ...a); }; list(); delete ui.text; return out; };
  const first = said(() => pump(1));
  for (const line of ['СЧЁТ', 'Волна 1/3', 'Цикл 1/5', 'Узел 1', '×5']) ok(first.includes(line), 'the first frame shows ' + line);

  const slotAt = new Map();
  let jumped = 0, fitBad = 0, frames = 0, ahead = 0, featherMax = 0, sawKill = false, sawCyc = 0, banner = null, lastMsg = false, mark = 0;
  ui.applyEvent = function (e) {
    if (e.t === 'pfkill') sawKill = true;
    if (e.t === 'pfcycle') sawCyc++;
    const out = H.UI.prototype.applyEvent.call(this, e);
    if (e.t === 'wave' && ui.bt.big && !banner) banner = ui.bt.big.text;
    return out;
  };
  bt.auto = true;
  const runToEnd = () => until(() => {
    const cur = ui.bt;
    if (cur.result) return true;
    frames++;
    for (const [u, p] of ui.enemyLayout()) {
      const key = u.pfBossWave + '|' + u.pfMax + '|' + u.pfSlot;
      if (slotAt.has(key) && slotAt.get(key) !== p.x) jumped++;
      slotAt.set(key, p.x);
      if (cur.tagW && cur.tagW > (u.pfBossWave ? TUN.bossSide : TUN.pitch[u.pfMax])) fitBad++;
    }
    if (cur.pf) {
      if (cur.pf.score > g.battle.pf.score + 0.01) ahead++;
      featherMax = Math.max(featherMax, cur.pf.feathers.length);
    }
    if (cur.order && cur.order.pfAv != null) mark++;
    if (cur.msg === 'Последний цикл') lastMsg = true;
    return false;
  });
  ok(runToEnd(), 'the node reaches its result on screen');
  bt = ui.bt;
  ok(frames > 100, 'the fight plays over many frames');
  eq(jumped, 0, 'a slot never moves on screen');
  eq(fitBad, 0, 'status labels never reach the next slot');
  eq(ahead, 0, 'the panel never shows more than the engine has counted');
  ok(mark > 0, 'the cycle mark stays with the shown order');
  ok(sawKill, 'kills reach the screen');
  ok(featherMax > 0 && featherMax <= 48, 'feathers appear and stay under the cap');
  eq(sawCyc, fight.opts.pf.cycles - 1, 'each new cycle reaches the screen');
  ok(lastMsg, 'the last cycle is announced');
  eq(banner, 'ВОЛНА 2 / 3', 'the wave plate shows the number of waves');

  const report = bt.result.pf;
  ok(report, 'the result carries the report');
  eq(Math.round(bt.pf.score), report.score, 'the panel ends on the recorded score');
  eq(bt.pf.disp, bt.pf.score, 'the counter has settled');
  eq(g.pf().run.scores[0], report.score, 'the run keeps the node score');
  ok(!g.pf().st[1], 'the record waits for the end of the stage');
  pump(3);
  let acts = ui.pfResultActions(report);
  eq(acts.map(a => a.label).join('|'), 'Узел 2|Повторить узел|Покинуть', 'the result of node 1 offers the next node');
  press('right'); eq(bt.pfSel, 1, 'right moves to the next button');
  press('left'); eq(bt.pfSel, 0, 'left moves back');
  press('left'); eq(bt.pfSel, 2, 'buttons wrap around');
  press('right');
  delete ui.applyEvent;
  press('ok');
  eq(g.battle.opts.pf.node, 1, 'Enter on the main button starts node 2');
  bt = ui.bt;
  ok(bt.auto, 'the auto battle carries over to the next node');
  pump(1);
  ok(until(() => ui.bt.result), 'node 2 reaches its result');
  bt = ui.bt;
  acts = ui.pfResultActions(bt.result.pf);
  eq(acts.map(a => a.label).join('|'), 'Итог этапа|Повторить узел|Покинуть', 'the last node leads to the stage result');
  pump(2);
  press('back');
  eq(bt.sub && bt.sub.type, 'pfquit', 'Esc on the result asks first');
  eq(bt.sub.sel, 1, 'with the safe answer selected');
  ok(ui.subOptions()[1].label === 'Вернуться к итогу', 'the safe answer names the result');
  ok(said(() => pump(1)).some(s => /прошлого узла/.test(s)), 'the question warns about the first node');
  press('ok');
  eq(bt.sub, null, 'the safe answer closes the question');
  ok(bt.result && g.pf().run, 'the result and the run stay');
  const runTotal = g.pfRunTotal();
  ok(runTotal > 0, 'the run sums both nodes');
  bt.pfSel = 0;
  press('ok');
  eq(ui.mode, 'field', 'the stage result leaves the battle');
  ok(ui.top() && ui.top().stage, 'and opens its own screen');
  eq(g.pf().run, null, 'the run is over');
  eq(g.pf().st[1].best, runTotal, 'the stage has its record');
  const stageText = said(() => pump(40));
  ok(stageText.includes('Этап 1: итог') && stageText.includes(H.fmt(runTotal)), 'the screen shows the sum');
  press('back');
  ok(ui.top() && ui.top().map, 'Esc returns to the stage choice');
  ui.screens = ui.screens.filter(s => !s.pf);

  const saved = g.pf().st[1].best;
  bt = start(0, 777);
  bt.auto = false;
  ok(until(idle), 'the fight reaches player input');
  press(null, 'KeyZ');
  pump(1);
  eq(bt.sub && bt.sub.type, 'pflist', 'Z opens the enemy list at input');
  const rows = ui.pfListRows(g.battle), bagged = g.battle.pf.bag.length + g.battle.living.filter(u => u.pfVal).length;
  eq(rows.reduce((a, r) => a + r.left, 0), bagged, 'the list counts the bag and the field');
  eq(rows.reduce((a, r) => a + r.total, 0), PF.poolSize(g.battle.opts.pf.waves[g.battle.wave]), 'the list shows the whole wave');
  for (const r of rows) eq(r.price, g.battle.pf.vals[r.id].d + g.battle.pf.vals[r.id].k, r.id + ' price');
  pump(2);
  press(null, 'KeyZ');
  eq(bt.sub, null, 'Z closes the list');
  press(null, 'KeyZ'); pump(1);
  press('back');
  eq(bt.sub, null, 'Esc closes the list');
  press(null, 'KeyZ'); pump(1);
  press('ok');
  eq(bt.sub, null, 'Enter closes the list');

  bt.auto = true;
  pump(1);
  const hud = { x: H.UI_CONST.W - 108, y: 36 };
  ok(ui.hits.some(h => h.x === hud.x && h.y === hud.y), 'the panel is clickable');
  press(null, 'KeyZ');
  eq(bt.auto, false, 'Z during the auto battle holds it');
  ok(bt.pfResume, 'the auto battle will come back');
  ok(until(() => bt.sub && bt.sub.type === 'pflist', 2000), 'the list waits for a free moment');
  press(null, 'KeyZ');
  pump(1);
  eq(bt.auto, true, 'closing the list resumes the auto battle');
  bt.auto = false;
  ok(until(idle), 'the fight stops at input again');

  press('back', 'Escape');
  eq(bt.sub && bt.sub.type, 'pause', 'Esc opens the pause');
  pump(1);
  eq(ui.subOptions().map(o => o.label).join('|'), 'Продолжить бой|Список противников|Повторить узел|Покинуть', 'the pause of the mode');
  bt.sub.sel = 1;
  press('ok');
  pump(1);
  eq(bt.sub && bt.sub.type, 'pflist', 'the pause opens the enemy list');
  press('back');
  press('back', 'Escape');
  bt.sub.sel = 3;
  press('ok');
  eq(bt.sub && bt.sub.type, 'pfquit', 'leaving asks first');
  eq(bt.sub.sel, 1, 'the safe answer is selected');
  pump(1);
  press('ok');
  eq(bt.sub, null, 'the safe answer returns to the fight');
  ok(g.battle, 'the fight goes on');
  press('back', 'Escape');
  bt.sub.sel = 2;
  const same = g.battle;
  press('ok');
  ok(g.battle && g.battle !== same, 'the repeat starts a new fight');
  eq(g.pf().st[1].best, saved, 'the repeat writes no record');
  eq(g.pf().run.scores[0], 0, 'and clears only this node');
  bt = ui.bt;
  pump(1);
  bt.auto = false;
  ok(until(idle), 'the new fight reaches input');
  press('back', 'Escape');
  bt.sub.sel = 3;
  press('ok');
  bt.sub.sel = 0;
  press('ok');
  eq(g.battle, null, 'leaving drops the fight');
  eq(ui.mode, 'field', 'leaving returns to the map layer');
  ok(ui.top() && ui.top().pf, 'leaving returns to the team screen');
  eq(g.pf().st[1].best, saved, 'leaving writes no record');
  eq(g.pf().run, null, 'leaving ends the run');
  ui.screens = ui.screens.filter(s => !s.pf);

  const menuFight = (() => {
    ui.openPfMap(null, 1);
    ui.openPfTeam(1);
    pump(1);
    press(null, 'KeyC');
    pump(1);
    ok(ui.top() && ui.top().pick, 'C opens the effect menu');
    const lines = said(() => pump(1));
    ok(lines.some(s => s.startsWith('Нелепость: Словарный раскол')), 'the menu names the rule of the season');
    for (const it of PF.SEASONS[0].caco) ok(lines.includes(it.name), 'the menu lists ' + it.name);
    press('back');
    eq(g.pfCaco(1, 0).id, 'erupt', 'Esc changes nothing');
    press(null, 'KeyC');
    press('down');
    press('ok');
    eq(g.pfCaco(1, 0).id, 'excite', 'Enter sets the effect');
    ok(ui.top() && ui.top().toggle, 'and returns to the team screen');
    press(null, 'Tab');
    press(null, 'KeyC');
    press('up');
    press('ok');
    eq(g.pfCaco(1, 1).id, 'rupture', 'the second node has its own choice');
    press(null, 'Tab');
    press(null, 'KeyF');
    pump(1);
    return g.battle;
  })();
  eq(menuFight.opts.pf.caco, 'excite', 'the fight uses the chosen effect');
  ui.bt.auto = false;
  ok(until(idle), 'the fight with an effect reaches input');
  press(null, 'KeyZ');
  pump(1);
  ok(said(() => pump(1)).includes('Нелепость: Словарный раскол. Какофония: Воодушевление'), 'the enemy list names the effects');
  press('back');
  const marked = g.battle.living[0];
  ui.applyEvent({ t: 'pfshat', u: marked, n: 4 });
  eq(marked.dShat, 4, 'the screen follows the levels from events');
  ok(ui.bt.floats.some(f => f.text === 'Раскол ×4'), 'a new level floats over the enemy');
  ok(said(() => pump(1)).some(s => s.startsWith('Раскол ×4')), 'Shatter comes first in the status line');
  ui.mode = 'field';
  g.pfDrop();
  ui.screens = ui.screens.filter(s => !s.pf);

  g.pfBegin(1);
  const pigFight = g.pfFight(4242);
  ui.drainGameEvents();
  pump(1);
  const pig = pigFight.enemies[0];
  pig.id = 'pf_trotter';
  pig.turnsTaken = 1;
  ok(said(() => pump(1)).includes('Побег через 1'), 'the piggy bank counts its turns');
  pig.turnsTaken = TUN.trotterFlee;
  ok(said(() => pump(1)).includes('Сейчас сбежит'), 'the piggy bank warns before its last turn');
  ui.bt.queue.length = 0;
  ui.applyEvent({ t: 'flee', u: pig, text: pig.name + ' ускакал в варп!' });
  eq(ui.bt.msg, 'Свинка-копилка ускакала в варп!', 'the flight reads right');
  ok(ui.bt.floats.some(f => f.text === 'Ускакала: +0'), 'the flight shows the empty reward');
  ui.mode = 'field';
  g.pfDrop();
  g.pf().run.scores = [20000, 0];
  g.pf().run.node = 1;
  ui.openUi_pf();
  pump(1);
  ok(ui.top() && ui.top().sel === 0 && !ui.top().toggle, 'an unfinished run asks before the team screen');
  ok(said(() => pump(1)).some(s => s.includes('20 000')), 'and shows the score of the first node');
  press('ok');
  eq(g.battle.opts.pf.node, 1, 'continue starts the unfinished node');
  ui.mode = 'field';
  g.pfDrop();
  ui.screens = ui.screens.filter(s => !s.pf);
  ui.openUi_pf();
  pump(1);
  press('right');
  press('ok');
  eq(g.pf().run, null, 'starting over drops the run');
  ok(ui.top() && ui.top().toggle, 'and opens the team screen');
  ui.screens = ui.screens.filter(s => !s.pf);

  const fresh = mk([...team, ...nextTeam]);
  fresh.pf().st = {};
  fresh.state.party = team.slice();
  ui.game = fresh;
  ui.openPfMap();
  pump(1);
  const pick = ui.top();
  ok(pick.map, 'the stage choice opens');
  eq(pick.sel, 0, 'on the open stage');
  press('down');
  press('ok');
  eq(ui.top(), pick, 'a closed stage does not open');
  fresh.pf().st[1] = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, quick: false, team: [team.slice(), nextTeam.slice()], caco: ['excite', 'rupture'] };
  press('ok');
  ok(ui.top().team, 'clearing a stage opens the next');
  ui.pop();
  eq(ui.top(), pick, 'Esc from the team goes back to the choice');
  press('up');
  press('ok');
  const desk = ui.top();
  ok(desk.team, 'stage 1 opens');
  const click = (x, y) => { ui.render(); for (let i = ui.hits.length - 1; i >= 0; i--) { const h = ui.hits[i]; if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { h.fn(0, { x, y }); return true; } } return false; };
  const lines0 = said(() => pump(1));
  ok(lines0.includes('Крылатые слова Юцы (I)'), 'the desk names the season and stage');
  ok(lines0.some(s => s.startsWith('Очки 30 000')), 'and the record');
  ok(lines0.includes('Состав отряда'), 'and the rows');
  const firstRow = () => fresh.pfTeams(1)[0], secondRow = () => fresh.pfTeams(1)[1];
  fresh.pfClearRows(1);
  eq(desk.heroes()[0], fresh.pfHeroes()[0], 'the list starts with the top level');
  click(12 + 5, 72 + 5);
  eq(firstRow().join(), fresh.pfHeroes()[0], 'a click puts the hero into the row');
  click(12 + 44 + 5, 72 + 5);
  eq(firstRow().length, 2, 'the next click takes the next place');
  click(12 + 5, 72 + 5);
  eq(firstRow().length, 1, 'clicking a hero in the row takes it out');
  click(204 + 10, 284 + 10);
  eq(desk.node, 1, 'a click selects the second row');
  let lastToast = null;
  ui.toast = s => { lastToast = s; };
  click(12 + 44 + 5, 72 + 5);
  delete ui.toast;
  eq(lastToast, 'Перенесён из узла 1', 'the move is reported');
  ok(secondRow().length === 1 && !firstRow().includes(secondRow()[0]), 'and takes the hero from the first row');
  click(204 + 162 + 5, 284 + 8 + 5);
  eq(secondRow().length, 0, 'clicking a place in the row clears it');
  press(null, 'Tab');
  eq(desk.node, 0, 'Tab changes the row');
  fresh.pfTeams(1)[0] = [team[0]];
  fresh.pfTeams(1)[1] = [nextTeam[0]];
  click(450 + 5, 142 + 5);
  eq(firstRow().join(), nextTeam[0], 'the swap button changes the rows');
  press(null, 'KeyX');
  eq(firstRow().join(), team[0], 'X changes them back');
  click(462 + 5, 6 + 5);
  eq(firstRow().join(), team.join(), 'the record button loads the record');
  eq(fresh.pfCaco(1, 1).id, 'rupture', 'with its effects');
  click(554 + 5, 142 + 5);
  ok(ui.top() !== desk, 'reset asks first');
  press('ok');
  eq(ui.top(), desk, 'the safe answer returns');
  eq(firstRow().length, 4, 'and clears nothing');
  press(null, 'Delete');
  press('left');
  press('ok');
  ok(firstRow().length === 0 && secondRow().length === 0, 'the confirmed reset clears both rows');
  press(null, 'KeyF');
  ok(ui.top() === desk && !fresh.battle, 'empty rows do not start the story');
  press(null, 'KeyU');
  eq(firstRow().join(), team.join(), 'U loads the record too');
  click(204 + 8 + 5, 166 + 74 + 5);
  ok(ui.top() !== desk, 'the detail button opens the node');
  ok(said(() => pump(1)).some(s => s.startsWith('Волна 1: на поле до')), 'the panel lists the waves');
  press('back');
  eq(ui.top(), desk, 'and closes');
  press(null, 'KeyD');
  ok(said(() => pump(1)).some(s => s.startsWith('Свинка сбегает после')), 'D opens it too, with the note about the piggy bank');
  press('back');
  click(204 + 162 + 5, 166 + 74 + 5);
  ok(ui.top().pick, 'the effect button opens the menu');
  press('back');
  eq(ui.top(), desk, 'the menu closes');
  const filterOf = () => desk.heroes().length, all = filterOf();
  click(10 + 5, 384 + 5);
  eq(desk.filter, 1, 'the filter moves on');
  const elemOf = k => H.CHARS[fresh.kitOf(k)].elem, recOf = PF.recOf(fresh.pfStage(1).nodes[desk.node]);
  ok(desk.heroes().every(k => recOf.includes(elemOf(k))), 'to the recommended types');
  for (let i = 0; i < 20; i++) { pump(1); click(10 + 5, 384 + 5); if (desk.filter === 0) break; pump(1); ok(desk.heroes().length <= all, 'a filter narrows the list'); }
  eq(desk.filter, 0, 'and comes back to everyone');
  const topLevel = desk.heroes()[0];
  click(104 + 5, 384 + 5);
  ok(desk.asc && desk.heroes()[desk.heroes().length - 1] === topLevel, 'the order turns over');
  click(104 + 5, 384 + 5);
  desk.sel = 0;
  click(204 + 5, 416 + 5);
  ok(ui.top().k === topLevel, 'the description button opens the hero');
  ui.pop();
  eq(ui.top(), desk, 'and returns to the desk');
  press(null, 'KeyI');
  ok(ui.top().k === topLevel, 'I opens it too');
  ui.pop();
  fresh.state.squads = [[], ['kafka', 'pela']];
  click(102 + 5, 48 + 5);
  eq(desk.tab, 'squads', 'the templates tab opens');
  const squadText = said(() => pump(1));
  ok(squadText.includes('12'), 'all twelve templates are listed');
  click(10 + 5, 72 + 26 + 5);
  eq(fresh.pfTeams(1)[desk.node].join(), 'kafka,pela', 'a click lays the template into the selected row');
  click(10 + 5, 72 + 26 * 5 + 5);
  eq(fresh.pfTeams(1)[desk.node].join(), 'kafka,pela', 'an empty template changes nothing');
  press('down');
  press('up');
  press(null, 'KeyT');
  eq(desk.tab, 'list', 'T goes back to the list');
  click(W_RIGHT - 30 + 5, 6 + 5);
  eq(ui.top(), pick, 'the close button leaves the desk');
  ui.screens = ui.screens.filter(s => !s.pf);
  ui.game = g;

  fresh.pf().st = {};
  const low = fresh.pfBegin(1);
  low.scores = [12000, 9000];
  ui.game = fresh;
  const lowInfo = fresh.pfFinish();
  ui.openPfStage(lowInfo);
  const lowText = said(() => pump(4));
  ok(lowText.some(s => s.includes('Не хватило 9 000')), 'the result names the missing points');
  ok(!lowText.includes('Этап 2'), 'a closed stage is not offered');
  eq(ui.top().sel, 0, 'repeat comes first');
  ui.screens = ui.screens.filter(s => !s.pf);
  ui.game = g;

  const firstGame = mk([...team, ...nextTeam]);
  firstGame.state.party = team.slice();
  ui.game = firstGame;
  const FP = firstGame.pf();
  eq(FP.tut, false, 'the lesson waits');
  ok(!FP.seen.s1, 'the season was not seen');
  firstGame.pending = { type: 'ui' };
  ui.finishPending = () => { firstGame.pending = null; };
  ui.openUi_pf();
  pump(1);
  ok(ui.top().splash, 'the first visit opens the season page');
  ok(FP.seen.s1, 'the season is marked as seen');
  const splashText = said(() => pump(1));
  ok(splashText.includes('Крылатые слова Юцы') && splashText.includes('Какофония') && splashText.includes('Чистый вымысел'), 'the page names the season');
  ok(splashText.some(s => s.includes('Хелледон')), 'the first page carries the quote');
  ok(splashText.includes(PF.SEASONS[0].caco[0].name), 'and the first effect');
  press('right');
  ok(said(() => pump(1)).includes(PF.SEASONS[0].caco[1].name), 'arrows show the next effect');
  press('ok');
  ok(ui.top().lesson, 'closing the page opens the lesson');
  const lessonFirst = ui.top();
  for (let i = 0; i < PF.TUTORIAL.length; i++) {
    eq(lessonFirst.page, i, 'page ' + i);
    ok(said(() => pump(1)).some(s => PF.TUTORIAL[i].startsWith(s)), 'the page shows its official text');
    if (i < PF.TUTORIAL.length - 1) press('right');
  }
  press('left');
  eq(lessonFirst.page, PF.TUTORIAL.length - 2, 'left goes back');
  press('right');
  press('ok');
  ok(ui.top().map, 'the lesson ends on the stage choice');
  eq(FP.tut, true, 'the lesson is marked');
  ui.screens = ui.screens.filter(s => !s.pf);
  ui.openUi_pf();
  pump(1);
  ok(ui.top().map, 'the next visit goes straight to the stage choice');
  press(null, 'Tab');
  pump(1);
  ok(ui.top().splash && !said(() => pump(1)).some(s => s.includes('Хелледон')), 'Tab opens the page again, without the quote');
  press('back');
  ok(ui.top().map, 'and returns');
  press(null, 'KeyR');
  const rules = ui.top();
  ok(rules.rules, 'R opens the rules');
  for (let i = 0; i < 3; i++) {
    eq(rules.tab, i, 'tab ' + i);
    ok(said(() => pump(1)).some(s => s.startsWith('◆ ')), 'the tab has headings');
    press(null, 'Tab');
  }
  eq(rules.tab, 0, 'tabs go around');
  rules.tab = 2;
  pump(1);
  press('down');
  pump(1);
  ok(rules.sc.top > 0, 'a long tab scrolls');
  for (let i = 0; i < 40; i++) press('down');
  pump(1);
  ok(said(() => pump(1)).some(s => s.startsWith('В настоящее время такое быстрое')), 'down to the last line');
  for (let i = 0; i < 40; i++) press('up');
  pump(1);
  eq(rules.sc.top, 0, 'and back up');
  press(null, 'KeyT');
  ok(ui.top().lesson, 'T opens the lesson from the rules');
  press('back');
  eq(ui.top(), rules, 'and returns to the rules');
  press('back');
  ok(ui.top().map, 'Esc leaves the rules');
  ui.openPfTeam(1);
  pump(1);
  press(null, 'KeyC');
  const caco = ui.top();
  ok(caco.pick, 'the effect screen opens');
  const cacoText = said(() => pump(1));
  ok(cacoText.includes('Узел 1') && cacoText.includes('Выберите усиления и установите их в Какофонию') && cacoText.includes('Установить эффект'), 'with its official caption');
  ok(cacoText.includes('Установлено'), 'it marks the installed effect');
  const clickAt = (x, y) => { ui.render(); for (let i = ui.hits.length - 1; i >= 0; i--) { const h = ui.hits[i]; if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { h.fn(0, { x, y }); return; } } };
  eq(caco.sel, 0, 'the installed effect is selected');
  clickAt(300, 40 + 90);
  eq(caco.sel, 1, 'a click selects the next effect');
  eq(firstGame.pfCaco(1, 0).id, 'erupt', 'without installing it');
  clickAt(300, 40 + 90);
  eq(firstGame.pfCaco(1, 0).id, 'excite', 'the second click installs it');
  ok(ui.top().team, 'and returns to the desk');
  press(null, 'KeyC');
  press('down');
  clickAt(410, 415);
  eq(firstGame.pfCaco(1, 0).id, 'rupture', 'the button installs too');
  press(null, 'KeyC');
  press('up');
  press('back');
  eq(firstGame.pfCaco(1, 0).id, 'rupture', 'Esc changes nothing');
  ui.screens = ui.screens.filter(s => !s.pf);
  const list = H.Gfx.pfIconList();
  eq(list.length, 6, 'six effect icons');
  for (const it of PF.SEASONS[0].caco) ok(list.includes(it.id), it.name + ' has an icon');
  eq(new Set(list.map(id => H.Gfx.pfIconRows(id).join(''))).size, list.length, 'every icon is different');
  for (const id of list) {
    const rows = H.Gfx.pfIconRows(id);
    eq(rows.length, 16, id + ' has 16 rows');
    ok(rows.every(r => r.length === 16), id + ' has 16 columns');
  }
  for (const s of ['s1', 's2']) ok(H.Gfx.pfEmblemRows(s).every(r => r.length === 14), s + ' emblem has even rows');
  ok(H.Gfx.pfEmblemRows('s1').join('') !== H.Gfx.pfEmblemRows('s2').join(''), 'the emblems differ');
  delete ui.finishPending;
  ui.game = g;

  const mapGame = mk([...team, ...nextTeam]);
  mapGame.state.party = team.slice();
  const MF = mapGame.pf();
  MF.seen.s1 = true;
  MF.tut = true;
  ui.game = mapGame;
  ok(H.PFMap.cost() <= 300, 'the moving parrots stay cheap: ' + H.PFMap.cost());
  ui.openPfMap();
  pump(2);
  const scene = ui.top();
  ok(scene.map && scene.full, 'the map fills the screen');
  eq(scene.sel, 0, 'the first stage is selected');
  const mapText = said(() => pump(1));
  for (const line of ['Чистый вымысел', 'Крылатые слова Юцы ›', 'Правила', '01', '02', '03', '04', 'Нет результата', 'Пройдите этап 1', 'Пройдите этап 3', '0 / 12']) ok(mapText.includes(line), 'the map shows ' + line);
  ok(mapText.some(s => /^До смены сезона \d+ дн\.$/.test(s)), 'and the days left');
  const tap = (x, y) => { ui.render(); for (let i = ui.hits.length - 1; i >= 0; i--) { const h = ui.hits[i]; if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { h.fn(0, { x, y }); return; } } };
  const [p2x, p2y] = H.PFMap.placeOf(1), [p1x, p1y] = H.PFMap.placeOf(0);
  let mapToast = null;
  ui.toast = s => { mapToast = s; };
  tap(p2x, p2y);
  delete ui.toast;
  eq(mapToast, 'Пройдите этап 1', 'a closed parrot explains itself');
  eq(ui.top(), scene, 'and stays closed');
  tap(p1x, p1y);
  ok(ui.top().team, 'an open parrot opens the team');
  ui.pop();
  eq(ui.top(), scene, 'and returns to the map');
  press('left');
  eq(scene.sel, 3, 'arrows go around');
  press('right');
  eq(scene.sel, 0, 'both ways');
  press('ok');
  ok(ui.top().team, 'Enter opens the team');
  ui.pop();
  tap(72, 38);
  ok(ui.top().splash, 'the season name opens the season page');
  press('back');
  tap(H.UI_CONST.W - 138 + 5, 8 + 5);
  ok(ui.top().rules, 'the rules button works');
  press('back');
  tap(H.UI_CONST.W - 100, H.UI_CONST.HGT - 60);
  const prize = ui.top();
  ok(prize.rewards, 'the gift opens the rewards');
  const prizeText = said(() => pump(1));
  ok(prizeText.includes('Награды за истории') && prizeText.includes('Награды за вымысел'), 'with two tabs');
  press(null, 'Tab');
  eq(prize.tab, 1, 'Tab changes the tab');
  ok(said(() => pump(1)).includes('Этап 4'), 'the second tab lists the stages');
  press(null, 'KeyC');
  eq(mapGame.pfDue(), 0, 'C takes all that is ready');
  press('back');
  eq(ui.top(), scene, 'and goes back');
  press(null, 'KeyF');
  ok(ui.top().rewards, 'F opens the rewards too');
  press('back');
  press(null, 'KeyR');
  ok(ui.top().rules, 'R opens the rules');
  press('back');
  press(null, 'Tab');
  ok(ui.top().splash, 'Tab opens the season page');
  press('back');
  ok(!scene.breaking, 'no chain breaks yet');
  MF.st[1] = { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, quick: false, team: [[], []], caco: [] };
  ui.update(1 / 30);
  ok(scene.breaking && scene.breaking.n === 1, 'three stars break the chain');
  ok(!MF.free[1], 'the parrot is still held');
  pump(4);
  for (let i = 0; i < 60; i++) ui.update(1 / 30);
  ok(MF.free[1], 'after the break it flies free');
  ok(!scene.breaking, 'the break ends');
  pump(2);
  ui.update(1 / 30);
  ok(!scene.breaking, 'and does not repeat');
  MF.st[2] = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, quick: false, team: [[], []], caco: [] };
  MF.st[3] = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, quick: false, team: [[], []], caco: [] };
  MF.st[4] = { best: 60000, nodes: [30000, 30000], stars: [true, true, true], clear: true, quick: false, team: [[], []], caco: [] };
  for (let i = 0; i < 200; i++) ui.update(1 / 30);
  ok([1, 2, 3, 4].every(n => MF.free[n]), 'three stars on stage 4 free every parrot');
  ok(said(() => pump(1)).includes('12 / 12'), 'and fill the star count');
  press('back');
  ok(!ui.top() || !ui.top().map, 'Esc leaves the map');
  ui.screens = ui.screens.filter(s => !s.pf);
  ui.game = g;

  const storyGame = mk([...team, ...nextTeam]);
  storyGame.state.party = team.slice();
  storyGame.state.flags.lf_s_arrive = true;
  storyGame.state.flags.pf_open = true;
  storyGame.state.quests.pf_decor = 'listen';
  storyGame.pf().seen.s1 = true;
  storyGame.pf().tut = true;
  storyGame.loadMap('lf_sanctum', 'v');
  clean(storyGame);
  ui.game = storyGame;
  ui.mode = 'field';
  storyGame.pfBegin(1).scores = [9000, 8000];
  const storyInfo = storyGame.pfFinish();
  eq(storyInfo.clear, false, 'a low first result stays below the threshold');
  ui.openPfStage(storyInfo);
  pump(2);
  press('back');
  ok(!ui.screens.some(s => s.pf), 'closing the result leaves the screens');
  ok(storyGame.script && storyGame.script.name === 'pf_after', 'and plays the last scene of the mission');
  pump(2);
  ui.game = g;
  ok(said(() => pump(1)) !== null, 'the field draws through the scene');
  storyGame.script = null;
  storyGame.pending = null;
  ui.dlg = null;
  ui.screens = [];

  const G3 = H.Gfx, cageRows = G3.pfCageRows(), pinRows = G3.pfPinRows();
  ok(cageRows.every(r => r.length === 16) && cageRows.length === 26, 'the cage art keeps its size');
  ok(pinRows.every(r => r.length === 16) && pinRows.length === 16, 'the map pin keeps its size');
  for (const k of ['bookshop', 'redcloth', 'bookpile', 'bookvase']) ok(H.Luofu.DECOR[k], 'the shop has ' + k);
  ok(H.Luofu.LAYER.bookcarpet, 'and the carpet');
  ok(H.MAPS.lf_sanctum.decor.flat().some(x => Array.isArray(x) ? x[0] === 'bookshop' : x === 'bookshop'), 'the map uses them');
  const cageStub = makeCanvas(640, 480).getContext('2d');
  G3.drawObject(cageStub, 'pfcage', 100, 100, { phase: 1 }, 2);
  G3.drawBust(cageStub, H.SPEAKERS.youci.look, 0, 0, 2);
  G3.drawPortrait(cageStub, H.SPEAKERS.youci.look, 0, 0, 40);
  G3.mapIcon(cageStub, 'pf', 0, 0, 16);
  ok(true, 'the cage and the pin draw');

  const e2e = mk([...team, ...nextTeam]);
  e2e.state.party = team.slice();
  e2e.state.flags.lf_s_arrive = true;
  e2e.chatSync();
  e2e.chatAuto('pf_call');
  e2e.pf().seen.s1 = true;
  e2e.pf().tut = true;
  e2e.loadMap('lf_sanctum', 'v');
  clean(e2e);
  ui.game = e2e;
  ui.mode = 'field';
  ui.screens = [];
  const cageEnt = e2e.map.ents.find(e => e.ch === 'М');
  e2e.placePlayer(cageEnt.x, cageEnt.y + 1);
  e2e.player.dir = 'up';
  ok(e2e.interact(), 'the walk starts at the cage');
  const pressUntil = (test, max = 1500) => { for (let i = 0; i < max && !test(); i++) { pump(1); if (!test()) press('ok', 'Enter'); } return test(); };
  ok(pressUntil(() => ui.top() && ui.top().map), 'the first talk leads to the map of stages');
  eq(e2e.state.quests.pf_decor, 'listen', 'the mission waits for the story');
  press('ok');
  ok(ui.top().team, 'the map opens the team');
  press(null, 'KeyF');
  pump(1);
  ok(e2e.battle && e2e.pf().run, 'the team enters the story');
  eq(ui.mode, 'battle', 'the battle screen opens');
  e2e.battle.pfTick(1e6);
  ui.pullEvents();
  ok(until(() => ui.bt.result, 2000), 'the first node ends');
  press('ok');
  pump(1);
  ok(e2e.battle && e2e.battle.opts.pf.node === 1, 'the second node starts');
  e2e.battle.pfTick(1e6);
  ui.pullEvents();
  ok(until(() => ui.bt.result, 2000), 'the second node ends');
  press('ok');
  ok(ui.top() && ui.top().stage, 'the result of the stage opens');
  eq(ui.mode, 'field', 'over the field');
  press('back');
  ok(e2e.script && e2e.script.name === 'pf_after', 'closing it plays the last scene');
  const featherBefore = e2e.state.inv.items.feather || 0;
  ok(pressUntil(() => e2e.state.quests.pf_decor === 'done'), 'the scene closes the mission');
  eq((e2e.state.inv.items.feather || 0) - featherBefore, 20, 'with the feathers in the pocket');
  ok(pressUntil(() => !e2e.script && !e2e.pending), 'and ends');
  e2e.placePlayer(cageEnt.x, cageEnt.y + 1);
  e2e.player.dir = 'up';
  ok(e2e.interact(), 'the cage talks after the mission');
  ok(pressUntil(() => e2e.pending && e2e.pending.type === 'choice', 40), 'and offers its menu');
  eq(e2e.pending.options.length, 5, 'with five answers');
  ui.screens = [];
  e2e.script = null;
  e2e.pending = null;
  ui.dlg = null;
  ui.mode = 'field';
  ui.game = g;

  const sealed = { best: 30000, nodes: [15000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: [] };
  const bossGame = mk([...team, ...nextTeam]);
  bossGame.pf().st = { 1: sealed, 2: sealed, 3: sealed };
  bossGame.pf().plan[4] = { team: [team.slice(), nextTeam.slice()], caco: [0, 0] };
  ui.game = bossGame;
  bossGame.pfBegin(4);
  const bf = bossGame.pfFight(777);
  ui.drainGameEvents();
  pump(1);
  ui.bt.auto = false;
  ui.bt.queue.length = 0;
  bf.drain();
  bf.wave = 2;
  bf.spawnWave(false);
  ui.pullEvents();
  ok(until(() => ui.bt.foes.some(u => u.data.boss) && ui.bt.big && /ВОЛНА 3/.test(ui.bt.big.text), 200), 'the boss wave reaches the screen');
  const lord = bf.enemies.find(u => u.data.boss);
  ok(said(() => pump(1)).some(s => s.startsWith('Риторика: ещё ' + TUN.eloq)), 'the boss bar counts down Rhetoric');
  ok(ui.enemyLayout().get(lord).x === H.UI_CONST.W / 2 + 34, 'the boss stands in the middle');
  ui.applyEvent({ t: 'pfhold', u: lord });
  ok(/Риторика/.test(ui.bt.msg), 'the first hold explains itself');
  lord.pfEloq = false;
  ok(said(() => pump(1)).some(s => s.startsWith('Риторика: ещё')), 'the mark follows the screen, not the engine');
  ui.applyEvent({ t: 'pfeloq', u: lord });
  eq(ui.bt.big.text, 'РИТОРИКА СНЯТА', 'the end of Rhetoric is announced');
  ok(!said(() => pump(1)).some(s => s.startsWith('Риторика: ещё')), 'and the mark goes away');
  ui.mode = 'field';
  bossGame.pfDrop();
  ui.game = g;

  const seasonHeroes = [...team, ...nextTeam];
  const sg = mk(seasonHeroes);
  let sNow = atDay(420 * TUN.days + 2);
  sg.clock = () => sNow;
  sg.state.flags.pf_open = true;
  sg.pf().tut = true;
  sg.pf().seen[sg.pfSeason().id] = true;
  sg.loadMap('lf_sanctum', 'v');
  clean(sg);
  ui.game = sg;
  ui.mode = 'field';
  ui.screens = [];
  const sPlay = (n, a, b) => { sg.pfBegin(n); sg.pf().run.scores = [a, b]; sg.pfFinish(); };
  sPlay(1, 31000, 31000);
  sg.pf().free[1] = true;
  ui.openPfMap();
  let badges = 0;
  const badge0 = ui.badge;
  ui.badge = function (...a) { badges++; return badge0.apply(this, a); };
  pump(1);
  ok(badges > 0, 'the gift shows a mark when rewards wait');
  ui.openPfRewards();
  const jadeBefore = sg.state.jade;
  tap(70, 150);
  eq(sg.state.jade - jadeBefore, PF.STAR_TIERS[0].jade, 'a tap on a ready star pays');
  tap(70, 150);
  eq(sg.state.jade - jadeBefore, PF.STAR_TIERS[0].jade, 'a second tap pays nothing');
  ok(said(() => pump(1)).includes('Получено'), 'the star says it is paid');
  press(null, 'Tab');
  ok(said(() => pump(1)).includes('Забрать'), 'a stage row offers its reward');
  const creditsBefore = sg.state.credits;
  tap(46 + 12 + 412 + 10, 30 + 82 + 14 + 10);
  eq(sg.state.credits - creditsBefore, PF.FICTION.credits, 'the button of a cleared stage pays');
  ok(said(() => pump(1)).includes('Получено'), 'and changes its label');
  press(null, 'KeyC');
  eq(sg.pfDue(), 0, 'C takes the rest');
  sPlay(2, 31000, 31000);
  ok(sg.pfDue() > 0, 'a new result brings more');
  tap(46 + 548 - 144 + 10, 30 + 48 + 10);
  eq(sg.pfDue(), 0, 'the button takes them all, so a touch screen can do it');
  press('back');
  ok(ui.top().map, 'the panel closes to the map');
  badges = 0;
  pump(1);
  eq(badges, 0, 'and the mark goes out');
  delete ui.badge;

  sNow = atDay(421 * TUN.days + 2);
  ok(sg.pfSync(), 'the season turns under the map');
  ui.screens = [];
  ui.openPfMap();
  const mapLines = said(() => pump(1));
  eq(mapLines.filter(s => s === 'По прошлому сезону').length, 2, 'quick stages say where they come from');
  eq(ui.top().breaking, null, 'and their chains do not break again');
  ui.openPfTeam(1);
  ok(said(() => pump(1)).includes('Засчитан на 3★ по прошлому сезону'), 'the desk says the same');
  press(null, 'KeyF');
  pump(1);
  ok(sg.battle && sg.pf().run, 'a quick stage can be played');
  sg.pfLeave();
  sg.pfDrop();
  ui.mode = 'field';
  ui.lastBattle = null;
  clean(sg);

  ui.screens = [];
  ui.openPfMap();
  ui.openPfTeam(3);
  sNow = atDay(422 * TUN.days + 2);
  press(null, 'KeyF');
  pump(1);
  ok(!sg.battle, 'a season that turned does not start the old stage');
  ok(ui.top().splash, 'it opens the new splash');
  press('back');
  ok(ui.top().map && !ui.screens.some(s => s.team), 'over a new map');
  clean(sg);

  ui.screens = [];
  sg.pfBegin(1);
  sg.pfFight(77);
  ui.drainGameEvents();
  pump(1);
  eq(ui.mode, 'battle', 'a node starts');
  sg.battle.pfTick(1e6);
  ui.pullEvents();
  sNow = atDay(423 * TUN.days + 2);
  ok(until(() => ui.bt.result, 2000), 'and ends after the season turned');
  ok(ui.bt.result.pf.expired, 'the result knows');
  const lateLines = said(() => pump(1));
  ok(lateLines.includes('Сезон завершился, результат записан в прошлый.'), 'and says so');
  ok(lateLines.includes('К карте') && !lateLines.includes('Повторить узел'), 'with the map as the only way');
  press('ok');
  eq(ui.mode, 'field', 'the field comes back');
  ok(ui.top().splash, 'with the new splash');
  press('back');
  ok(ui.top().map, 'and the map');
  clean(sg);
  ui.screens = [];
  ui.toasts = [];

  sg.pfBegin(1);
  sNow = atDay(424 * TUN.days + 2);
  ui.openPfEntry(() => {});
  ok(!sg.pf().run, 'a run from the old season is dropped at the door');
  ok(ui.top().splash, 'and the question is not asked');
  pump(1);
  ok(ui.toasts.some(n => n.text.startsWith('Сезон сменился')), 'the player hears why');
  ui.screens = [];
  ui.toasts = [];
  clean(sg);

  const treasureTab = H.GUIDE_SECTIONS.find(s => s.id === 'treasure');
  const shut = mk();
  ok(treasureTab.open(shut), 'the tab is closed for a new player');
  shut.state.flags.pf_open = true;
  ok(!treasureTab.open(shut), 'the mission alone opens it');
  delete shut.state.flags.pf_open;
  const shutRow = shut.guidePf();
  ok(!shutRow.open && shutRow.why.includes('Мастерское приукрашивание Юцы'), 'the closed row names the mission');
  ok(!shut.state.pf, 'and writes nothing into the save');
  shut.state.flags.fh_met = true;
  shut.state.flags.express_intro = true;
  ui.game = shut;
  ui.openIpg('treasure');
  ok(said(() => pump(1)).includes('Чистый вымысел'), 'the guide has the second row');
  press('down');
  eq(ui.top().tsel, 1, 'the arrow selects it');
  ok(said(() => pump(1)).join(' ').includes('Мастерское приукрашивание Юцы'), 'the closed row explains itself');
  press('ok');
  ok(ui.top().tsel === 1, 'and does not open');
  ui.screens = [];
  ui.game = sg;

  sg.state.flags.fh_met = true;
  sg.state.flags.express_intro = true;
  const site = sg.guideSite('pf', 'pf');
  ok(site && H.MAPS[site.map].marks[site.ch].obj === 'pfcage', 'the guide leads to the cage');
  const cageSpot = sg.map.ents.find(e => e.ch === site.ch);
  sg.placePlayer(cageSpot.x, cageSpot.y + 1);
  sPlay(1, 31000, 31000);
  sg.pf().seen[sg.pfSeason().id] = true;
  ui.openIpg('treasure');
  press('down');
  const fictionLines = said(() => pump(1));
  ok(fictionLines.includes(sg.pfSeason().name), 'the row shows the season');
  ok(fictionLines.includes('Перейти к Чистому вымыслу'), 'and the way in');
  ok(fictionLines.includes('Можно забрать: ' + sg.pfDue()), 'and what waits');
  ok(sg.alerts().guide_treasure, 'rewards light the guide badge');
  const guideJade = sg.state.jade;
  press(null, 'KeyF');
  ok(sg.state.jade > guideJade, 'F takes the rewards of this row');
  eq(sg.pfDue(), 0, 'all of them');
  eq(sg.alerts().guide_treasure, !!sg.fhAlert(), 'the badge goes out');
  sg.pf().seen = {};
  ok(sg.alerts().guide_treasure, 'a season not seen lights it again');
  sg.pf().seen[sg.pfSeason().id] = true;
  press(null, 'KeyF');
  press('ok');
  ok(ui.top().map, 'Enter opens the map next to the cage');
  ui.screens = [];
  clean(sg);

  const soloParty = sg.state.party.slice();
  sg.state.guest = { party: soloParty, added: [] };
  sg.state.party = ['danheng'];
  const soloRow = sg.guidePf();
  ok(!soloRow.open && soloRow.why, 'a solo part of the story closes the mode');
  ui.guideEnter(soloRow);
  eq(ui.top(), undefined, 'the guide does not hop');
  let leftDoor = 0;
  ui.openPfEntry(() => { leftDoor++; });
  eq(leftDoor, 1, 'and the cage lets the script go on');
  eq(ui.top(), undefined, 'without a screen');
  delete sg.state.guest;
  sg.state.party = soloParty;
  ok(sg.guidePf().open, 'the mode opens again after the solo part');

  const meritOf = game => game.profileMerits().find(r => r.id === 'pf');
  eq(meritOf(shut).value, 'Не открыто', 'the profile says when the mode is closed');
  ok(!meritOf(shut).open, 'and the row is closed');
  eq(meritOf(sg).value, 'Звёзд в сезоне ' + sg.pfStarTotal() + ' / 12', 'it counts the stars of the season');
  ui.profileRowAct('pf');
  ok(ui.top().map, 'the row of the profile leads to the map');
  ui.screens = [];
  clean(sg);

  require(path.join(DIR, 'hsr-bug.js'));
  eq(ui.bugInfo().state.pf, undefined, 'a report without a run has no line');
  sg.pfBegin(1);
  const bugRun = ui.bugInfo().state.pf;
  eq(bugRun.n, 1, 'a report carries the stage of the run');
  eq(bugRun.period, sg.pf().period, 'and its period');
  sg.pfLeave();
  ui.game = g;

  const second = mk(seasonHeroes);
  second.clock = () => atDay(381 * TUN.days + 5);
  second.state.flags.pf_open = true;
  second.pf().tut = true;
  second.loadMap('lf_sanctum', 'v');
  clean(second);
  ui.game = second;
  ui.mode = 'field';
  ui.screens = [];
  ui.openPfEntry(() => {});
  ok(ui.top().splash, 'the second season opens with its splash');
  const splash2 = said(() => pump(1));
  ok(splash2.includes('Сказания о пойманной птице'), 'with its name');
  ok(splash2.includes('Нелепость: Слова острее ножа'), 'and its rule');
  ok(splash2.includes(PF.seasonOf('s2').caco[0].name), 'and its first effect');
  press('back');
  ok(ui.top().map, 'then the map');
  ok(said(() => pump(1)).includes('Сказания о пойманной птице ›'), 'of the same season');
  press(null, 'KeyR');
  press('right');
  ok(said(() => pump(1)).join(' ').includes('Слова острее ножа'), 'the rules read the season');
  press('back');
  ui.openPfTeam(1);
  ok(said(() => pump(1)).includes('Нелепость: Слова острее ножа'), 'the desk reads it too');
  press(null, 'KeyC');
  const pick2 = said(() => pump(1));
  for (const it of PF.seasonOf('s2').caco) ok(pick2.includes(it.name), 'the menu lists ' + it.name);
  press('back');
  press(null, 'KeyF');
  pump(1);
  ok(second.battle && second.battle.opts.pf.season === 's2', 'the fight is of the second season');
  ui.bt.auto = false;
  second.battle.pf.fx = ['sharp', 'slander'];
  second.battle.opts.pf.caco = 'slander';
  second.battle.pfTick(1e6);
  ui.pullEvents();
  ok(until(() => ui.bt.result, 2000), 'and ends');
  const result2 = said(() => pump(1));
  ok(result2.some(s => s.includes('Клевета')), 'the result names the effect of the season');
  ui.mode = 'field';
  ui.lastBattle = null;
  second.pfLeave();
  second.pfDrop();
  ui.screens = [];
  ui.toasts = [];
  clean(second);
  ui.game = g;

  const other = clean(new H.Game({ seed: 3 }));
  ui.game = other;
  other.loadMap('express_lab', 'v');
  clean(other);
  other.startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, seed: 8 });
  ui.drainGameEvents();
  pump(2);
  ok(ui.bt.tagW === undefined, 'a battle outside the mode has no label limit');
  const lay = [...ui.enemyLayout().values()];
  eq(lay.length, 2, 'a battle outside the mode keeps its layout');
  eq(Math.round(lay[0].x), Math.round(H.UI_CONST.W / 2 + 34 - (lay[0].s + lay[1].s) * 0.4 + lay[0].s * 0.4), 'a battle outside the mode keeps its positions');
}

console.log('hsr-pf test ok, checks: ' + checks);
