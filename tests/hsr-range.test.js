const assert = require('node:assert/strict');
const path = require('path');
const DIR = path.join(__dirname, '../js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const GAME = ['hsr-data', 'hsr-battle', 'hsr-inaba', 'hsr-fours', 'hsr-conton', 'hsr-hares', 'hsr-fives', 'hsr-world', 'hsr-story', 'hsr-game', 'hsr-traces-data', 'hsr-ascend-data', 'hsr-traces', 'hsr-ascend', 'hsr-phone', 'hsr-phone-pix', 'hsr-synth', 'hsr-echoes', 'hsr-trace-fx', 'hsr-su-data', 'hsr-su-battle', 'hsr-su-story', 'hsr-su', 'hsr-chat', 'hsr-missions', 'hsr-shop', 'hsr-pets', 'hsr-pass', 'hsr-contracts', 'hsr-hook', 'hsr-section6', 'hsr-info', 'hsr-fours-info', 'hsr-conton-info', 'hsr-hares-info', 'hsr-fives-info', 'hsr-express', 'hsr-herta', 'hsr-herta-life', 'hsr-seclusion', 'hsr-jarilo-story', 'hsr-jarilo-life', 'hsr-museum', 'hsr-boulder', 'hsr-rivet', 'hsr-settle', 'hsr-restricted', 'hsr-corridor', 'hsr-hill', 'hsr-pillars', 'hsr-memory', 'hsr-elation', 'hsr-messenger', 'hsr-velvet', 'hsr-badge', 'hsr-axel-maps', 'hsr-axel-story', 'hsr-luofu-foes', 'hsr-luofu-field', 'hsr-luofu-maps', 'hsr-luofu-story', 'hsr-luofu-story2', 'hsr-luofu-life', 'hsr-conductor', 'hsr-guide-data', 'hsr-guide', 'hsr-domain', 'hsr-cw-data', 'hsr-cw', 'hsr-cw-battle', 'hsr-cw-bonds', 'hsr-cw-items', 'hsr-cw-kits', 'hsr-cw-special', 'hsr-cw-strats', 'hsr-cw-affixes', 'hsr-cw-envs', 'hsr-cw-foes', 'hsr-cw-meta', 'hsr-cw-perks', 'hsr-cw-goals', 'hsr-hd-data', 'hsr-hd-math', 'hsr-hd-arena', 'hsr-hd-heroes', 'hsr-hd-foes', 'hsr-hd-shop', 'hsr-hd', 'hsr-hd-net', 'hsr-hd-simver'];
for (const f of GAME) require(path.join(DIR, f + '.js'));

const plainFight = (seed) => {
  const g = new H.Game({ seed: 3 });
  const b = g.startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, seed });
  b.start();
  for (let i = 0; i < 500 && !b.over; i++) { b.autoStep(); b.drain(); }
  return [b.result.win, b.clock, b.allies.map(a => a.hp).join()].join('|');
};
const before = plainFight(42);
require(path.join(DIR, 'hsr-range.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };

eq(plainFight(42), before, 'a battle outside the Range is the same with the module loaded');

const clean = g => { g.script = null; g.pending = null; g.cg = null; g.events.length = 0; return g; };
const team = ['seele', 'bronya', 'natasha', 'gepard'];
const mk = () => {
  const g = clean(new H.Game({ seed: 11 }));
  for (const k of team) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.state.squads = []; g.state.squads[3] = team.slice();
  g.fhSpecs(team);
  g.guideTarget();
  return g;
};
const setup = (g, rows) => { g.state.range = { team: { squad: 3 }, waves: [rows] }; g.range(); };
const play = (g, limit) => { const b = g.rangeFight(); b.start(); for (let i = 0; i < (limit || 6000) && !b.over; i++) { b.autoStep(); b.drain(); } return b; };
const snap = g => { const s = JSON.parse(JSON.stringify(g.state)); delete s.time; delete s.range; return JSON.stringify(s); };

{
  const g = mk(), all = g.rangeFoes('all');
  eq(all.length, Object.keys(H.ENEMIES).length, 'the catalog lists every enemy');
  eq(new Set(all).size, all.length, 'no enemy is listed twice');
  eq(g.rangeFoes('normal').length + g.rangeFoes('elite').length + g.rangeFoes('boss').length, all.length, 'tiers add up to the whole catalog');
  ok(g.rangeFoes('boss').every(id => H.ENEMIES[id].boss), 'the boss tier holds only bosses');
}

{
  const g = mk(), foes = JSON.stringify(H.ENEMIES);
  for (const id of Object.keys(H.ENEMIES)) for (const lvl of [1, 40, 150]) {
    setup(g, [{ id, lvl }]);
    const b = play(g, id === 'ks_proto' ? 2000 : 6000);
    ok(b.over, id + ' at level ' + lvl + ' reaches an end of the fight');
    g.rangeEnd(b);
  }
  eq(JSON.stringify(H.ENEMIES), foes, 'fights leave H.ENEMIES untouched');
  setup(g, [{ id: 'ks_proto', lvl: 40 }]);
  const b = play(g);
  ok(b.result.win, 'the Prototype barrier is off in the Range, a team without Aqua can win');
}

{
  const g = mk();
  Object.assign(g.state, { nextAtk: 0.15, nextCrit: 0.12, pendingTechs: ['seele'] });
  g.state.flags.rumor_kind = true;
  const was = snap(g), tune = JSON.stringify(H.TUNING);
  const ends = [
    [[{ id: 'reaver', lvl: 1 }], 'win'],
    [[{ id: 'trotter', lvl: 1 }, { id: 'trotter', lvl: 150 }], 'left'],
    [[{ id: 'cocolia_x', lvl: 150 }, { id: 'doomsday', lvl: 150 }, { id: 'mimic', lvl: 150 }], 'lose']
  ];
  for (const [rows, kind] of ends) {
    setup(g, rows);
    const b = play(g), id = b.enemies[0].id, out = g.rangeEnd(b);
    if (kind !== 'left') eq(out.range.kind, kind, 'result of the fight with ' + id);
    ok(out.range.cycles >= 1 && out.range.total >= 0, 'report has numbers');
    ok(!g.battle && !g.battleCtx, 'the fight is closed');
    eq(snap(g), was, 'the save is the same after the fight with ' + id);
  }
  setup(g, [{ id: 'hound', lvl: 10 }, { id: 'reaver', lvl: 10 }]);
  const b = g.rangeFight();
  ok(g.events.some(e => e.t === 'battle' && e.bg && e.music), 'the fight asks the screen to open it');
  g.events.length = 0;
  b.start(); b.drain();
  b.flee(); b.drain();
  const out = g.endBattle();
  eq(out.range.kind, 'abort', 'leaving through the menu counts as aborted');
  eq(snap(g), was, 'the save is the same after an aborted fight, through the endBattle chain');
  eq(JSON.stringify(H.TUNING), tune, 'H.TUNING is untouched');
  eq(g.state.nextAtk, 0.15, 'food buff waits for a real fight');
  eq(g.state.pendingTechs.join(), 'seele', 'pending technique waits for a real fight');
}

{
  const g = mk();
  setup(g, [{ id: 'skaracabaz', lvl: 90 }]);
  const b = play(g);
  if (b.result.win && b.enemies.some(u => u.gone)) eq(g.rangeEnd(b).range.kind, 'left', 'clone lifespan ends as left');
  setup(g, [{ id: 'trotter', lvl: 90 }]);
  const t = g.rangeFight();
  t.start(); t.drain();
  t.enemies[0].hp = t.enemies[0].maxHp = 1e9;
  for (let i = 0; i < 4000 && !t.over; i++) { t.autoStep(); t.drain(); }
  eq(g.rangeEnd(t).range.kind, 'left', 'a fleeing pig ends as left');
}

{
  const g = mk();
  setup(g, [{ id: 'reaver', lvl: 1 }]);
  const b = g.rangeFight(9);
  b.start(); b.drain();
  b.opts.range.cycles = 2;
  b.enemies[0].hp = b.enemies[0].maxHp = 1e9;
  for (let i = 0; i < 2000 && !b.over; i++) { b.autoStep(); b.drain(); }
  const out = g.rangeEnd(b);
  eq(out.range.kind, 'limit', 'the cycle limit stops the fight');
  eq(out.range.cycles, 2, 'the report shows the limit, not the counter past it');
}

{
  const g = mk();
  const run = seed => { setup(g, [{ id: 'cocolia2', lvl: 60 }, { id: 'iceedge', lvl: 58 }]); const b = g.rangeFight(seed); b.start(); for (let i = 0; i < 3000 && !b.over; i++) { b.autoStep(); b.drain(); } return g.rangeEnd(b).range; };
  const a = run(77), c = run(77);
  eq(a.total, c.total, 'same seed and setup give the same damage');
  eq(a.cycles, c.cycles, 'same seed and setup give the same length');
  eq(a.seed, 77, 'the report keeps the seed');
}

{
  const g = mk();
  g.state.range = { v: 9, team: { squad: 99 }, waves: [[{ id: 'nope', lvl: 5 }, { id: 'reaver', lvl: 'x' }, { id: 'hound', lvl: 9999 }], 'bad', [null]], wave: 7, cond: 3 };
  const R = g.range();
  eq(R.waves[0].map(o => o.id).join(), 'reaver,hound', 'unknown enemies are removed');
  eq(R.waves[0][0].lvl, 1, 'bad level falls back to the minimum');
  eq(R.waves[0][1].lvl, 150, 'level is capped');
  eq(R.team.squad, 3, 'a broken squad falls back to the fullest one');
  ok(R.wave >= 0 && R.wave < R.waves.length, 'selected wave is in range');
  ok(R.cond.contact === true && R.cond.auto === false, 'conditions get defaults');
  const old = clean(new H.Game({ seed: 2 }));
  delete old.state.range;
  eq(old.range().waves[0][0].id, H.RANGE.TUN.foe, 'an old save opens with one default row');
  eq(old.rangeKeys().join(), 'trail', 'a solo save fights with the Trailblazer');
  g.state.range = { team: { own: true }, own: ['seele', 'nobody'], waves: [[{ id: 'reaver', lvl: 3 }]] };
  g.range();
  eq(g.rangeKeys().join(), 'seele', 'missing heroes leave the own team');
  g.state.range = { waves: [[{ id: 'hound', lvl: 3, hp: 7, atk: 2, def: 'x', spd: 9999, tough: -3, weak: ['ice', 'nope'], resist: ['fire'], hpStart: 500, res: -5, act: 'skill:99', immortal: 'yes', noFlee: true }]], cond: { hp: 'none', energy: 1, sp: 99, seed: -4, cycles: 7, bg: 'nope', music: 'boss' } };
  g.range();
  const o = g.rangeRows()[0], C = g.range().cond;
  ok(o.hp === undefined && o.atk === 2 && o.def === undefined, 'multipliers keep only allowed values');
  eq(o.spd, 300, 'speed is capped');
  eq(o.tough, 10, 'toughness has a floor');
  eq(o.weak.join(), 'ice', 'unknown elements are dropped');
  eq(o.hpStart, undefined, 'start HP capped at 100 equals the default');
  eq(o.res, 0, 'effect resistance has a floor');
  ok(o.act === undefined && o.immortal === undefined && o.noFlee === true, 'bad behaviour and flags are dropped');
  ok(C.hp === 'full' && C.energy === 1 && C.sp === 3 && C.seed === 0 && C.cycles === 0 && C.bg === 'auto' && C.music === 'boss', 'conditions keep only allowed values');
}

{
  const g = mk(), foes = JSON.stringify(H.ENEMIES);
  const unit = row => { setup(g, [row]); return new H.Battle(g.rangeOpts(5)).enemies[0]; };
  const plain = unit({ id: 'doomsday', lvl: 40 });
  const game = new H.Battle(Object.assign(g.rangeOpts(5), { range: undefined, waves: [['doomsday:40']] })).enemies[0];
  ok(plain.maxHp === game.maxHp && plain.base.atk === game.base.atk && plain.base.def === game.base.def && plain.base.spd === game.base.spd && plain.maxTough === game.maxTough && plain.data === H.ENEMIES.doomsday, 'a row without edits equals the enemy of the game');
  const t = unit({ id: 'doomsday', lvl: 40, hp: 10 });
  eq(t.maxHp, Math.round(plain.maxHp * 10), 'HP × changes max HP');
  eq(t.hp, t.maxHp, 'HP × fills the bar');
  eq(t.base.atk, plain.base.atk, 'HP × leaves attack alone');
  eq(unit({ id: 'doomsday', lvl: 40, atk: 2 }).base.atk, plain.base.atk * 2, 'ATK × changes attack');
  eq(unit({ id: 'doomsday', lvl: 40, def: 3 }).base.def, plain.base.def * 3, 'DEF × changes defence');
  eq(unit({ id: 'doomsday', lvl: 40, spd: 150 }).base.spd, 150, 'speed is set');
  const tough = unit({ id: 'doomsday', lvl: 40, tough: 300 });
  ok(tough.tough === 300 && tough.maxTough === 300, 'toughness is set');
  eq(unit({ id: 'doomsday', lvl: 40, res: 75 }).base.res, 0.75, 'effect resistance is set');
  eq(unit({ id: 'doomsday', lvl: 40, hpStart: 50 }).hp, Math.round(plain.maxHp / 2), 'start HP is set after the multiplier');
  const el = unit({ id: 'doomsday', lvl: 40, weak: ['wind'], resist: ['ice'] });
  ok(el.weak.join() === 'wind' && el.resist.join() === 'ice' && el.data.weak.join() === 'wind', 'weakness edits reach the unit and the data the screen reads');
  eq(H.ENEMIES.doomsday.weak.join(), 'phys,ice,fire', 'weakness edits leave the enemy table alone');
  eq(el.data.shape, H.ENEMIES.doomsday.shape, 'the copy keeps the art');
  eq(unit({ id: 'trotter', lvl: 40, noFlee: true }).data.flee, 0, 'flee can be turned off');
  eq(unit({ id: 'skaracabaz', lvl: 40, noLife: true }).data.lifespan, 0, 'lifespan can be turned off');
  ok(unit({ id: 'doomsday', lvl: 40, noSummon: true }).data.skills.find(s => s.t === 'summon').max === -1, 'summons can be turned off');
  eq(unit({ id: 'doomsday', lvl: 40, act: 'skill:3' }).data.pat.join(), '3', 'a single skill can be forced');
  eq(unit({ id: 'doomsday', lvl: 40, act: 'step:2' }).patIdx, 2, 'the pattern can start at a step');
  ok(unit({ id: 'ks_proto', lvl: 40, barrier: true }).flags.barrier !== false, 'the Prototype can keep its story barrier');

  setup(g, [{ id: 'reaver', lvl: 80, act: 'idle', immortal: true, hp: 100, atk: 0 }]);
  g.range().cond.cycles = 5;
  const d = g.rangeFight(5), acts = [];
  const push = d.push.bind(d);
  d.push = e => { if (e.t === 'act' && e.kind === 'enemy') acts.push(e.name); return push(e); };
  d.start(); d.drain();
  for (let i = 0; i < 3000 && !d.over; i++) { d.autoStep(); d.drain(); }
  eq(acts.length, 0, 'a dummy never acts');
  ok(!d.enemies[0].dead, 'an immortal row does not die');
  const stop = g.rangeEnd(d);
  ok(stop.range.kind === 'limit' && stop.range.cycles === 5 && stop.range.total > 0, 'the cycle limit from the conditions stops the fight');

  setup(g, [{ id: 'reaver', lvl: 20, immortal: true }]);
  const im = g.rangeFight(5);
  im.start(); im.drain();
  im.hit(im.allies[0], im.enemies[0], 0, { raw: 1e9 });
  ok(!im.enemies[0].dead && im.enemies[0].hp === 1, 'lethal damage leaves an immortal row at 1 HP');

  setup(g, [{ id: 'doomsday', lvl: 40, hp: 10, atk: 2 }]);
  const su = g.rangeFight(5);
  su.start(); su.drain();
  const boss = su.enemies[0], add = su.spawnFoe('reaver', 38, boss), ref = new H.Battle(Object.assign(g.rangeOpts(5), { range: undefined, waves: [['reaver:38']] })).enemies[0];
  eq(add.maxHp, Math.round(ref.maxHp * 10), 'a summon takes the HP multiplier of the summoner');
  eq(add.base.atk, ref.base.atk * 2, 'a summon takes the ATK multiplier of the summoner');
  setup(g, [{ id: 'doomsday', lvl: 40, noSummon: true, act: 'skill:1' }]);
  const ns = g.rangeFight(5), names = [];
  const nsPush = ns.push.bind(ns);
  ns.push = e => { if (e.t === 'summon') names.push(e.u.id); return nsPush(e); };
  ns.start(); ns.drain();
  for (let i = 0; i < 60 && !ns.over; i++) { ns.autoStep(); ns.drain(); }
  eq(names.length, 0, 'no summons when they are turned off');
  eq(JSON.stringify(H.ENEMIES), foes, 'tuned fights leave H.ENEMIES untouched');
}

{
  const g = mk();
  const rows = [{ id: 'doomsday', lvl: 40, hp: 2, atk: 3, def: 2, spd: 120, tough: 500, hpStart: 50, res: 40 }, { id: 'reaver', lvl: 12 }];
  g.state.range = { team: { squad: 3 }, waves: [rows, [], [{ id: 'cocolia2', lvl: 77, hp: 5 }]] };
  g.range();
  const pv = g.rangePreview(), b = new H.Battle(g.rangeOpts(3));
  const same = (u, p) => p.hp === u.maxHp && p.start === u.hp && p.atk === Math.round(u.base.atk) && p.def === Math.round(u.base.def) && p.spd === u.base.spd && p.tough === u.maxTough;
  ok(b.enemies.every((u, i) => same(u, pv[0][i])), 'the table numbers equal the first wave of the real fight');
  eq(pv[1].length, 0, 'an empty wave has no numbers');
  b.wave = 1; b.spawnWave(false); b.drain();
  ok(same(b.enemies[0], pv[2][0]), 'the table numbers equal a later wave of the real fight');
  eq(b.waves.length, 2, 'an empty wave is skipped on launch');
  const fresh = g.rangePreview();
  ok(fresh === pv, 'numbers are cached while nothing changes');
  g.rangeWave(0); g.rangeStep(0, 'hp', 1, false);
  ok(g.rangePreview() !== pv, 'numbers follow an edit');
  eq(g.rangePreview()[0][0].hp > pv[0][0].hp, true, 'a higher multiplier gives more HP');
}

{
  const g = mk();
  setup(g, [{ id: 'doomsday', lvl: 40 }]);
  const o = () => g.rangeRows()[0];
  g.rangeStep(0, 'hp', 1, false); eq(o().hp, 1.5, 'E walks the multiplier list');
  g.rangeStep(0, 'hp', -1, false); eq(o().hp, undefined, 'the default value leaves the row clean');
  for (let i = 0; i < 30; i++) g.rangeStep(0, 'hp', 1, false);
  eq(o().hp, 100, 'the list stops at its end');
  g.rangeClearField(0, 'hp');
  g.rangeStep(0, 'spd', 1, false); eq(o().spd, 95, 'speed starts from the enemy');
  g.rangeStep(0, 'spd', 1, true); eq(o().spd, 120, 'Shift gives the big step');
  for (let i = 0; i < 90; i++) g.rangeStep(0, 'tough', 1, true);
  eq(o().tough, H.RANGE.TUN.inf, 'toughness goes up to infinity');
  g.rangeStep(0, 'tough', -1, false); eq(o().tough, 990, 'and comes back');
  g.rangeElemStep(0, 'wind', 1);
  ok(o().weak.includes('wind') && g.rangeElem(o(), 'wind') === 'weak', 'a normal element becomes a weakness');
  g.rangeElemStep(0, 'wind', 1);
  ok(!o().weak.includes('wind') && o().resist.includes('wind'), 'then a resistance');
  g.rangeElemStep(0, 'wind', 1);
  ok(o().weak === undefined && o().resist === undefined, 'then back, and the row is clean again');
  g.rangeDummy(0); ok(o().act === 'idle' && o().immortal === true, 'dummy sets both fields');
  const lst = []; for (let i = 0; i < 20; i++) { g.rangeActStep(0, 1); lst.push(H.RANGE.actName(H.ENEMIES.doomsday, o().act)); }
  ok(lst.includes('Как в игре') && lst.some(t => t.startsWith('Только: ')) && lst.some(t => t.startsWith('С шага ')), 'behaviour walks all choices');
  ok(g.rangeCopy(0), 'a row can be copied');
  eq(JSON.stringify(g.rangeRows()[1]), JSON.stringify(g.rangeRows()[0]), 'the copy has the settings');
  g.rangeRows()[1].lvl = 9; ok(g.rangeRows()[0].lvl !== 9, 'the copy is independent');
  g.rangeCopy(0); ok(!g.rangeCopy(0), 'a copy past the stage width is refused');
  g.rangeRemove(2); g.rangeRemove(1);
  const was = JSON.stringify(o());
  g.rangeReset(0); eq(Object.keys(o()).join(), 'id,lvl', 'reset leaves only the enemy and level');
  ok(g.rangeUndo() && JSON.stringify(o()) === was, 'Z brings the row back');
  ok(g.rangeAddWave() && g.range().wave === 1 && !g.rangeRows().length, 'a new wave is empty and selected');
  for (let i = 0; i < 9; i++) g.rangeAddWave();
  eq(g.range().waves.length, H.RANGE.TUN.maxWaves, 'waves have a limit');
  ok(g.rangeDropWave(4) && g.range().wave < g.range().waves.length, 'a wave can be removed');
  while (g.range().waves.length > 1) g.rangeDropWave(1);
  ok(!g.rangeDropWave(0), 'the last wave stays');
  const j = JSON.parse(JSON.stringify(g.state.range));
  eq(j.waves.length, 1, 'the setup survives JSON');
}

{
  const g = mk(), kits = team.map(k => H.CHARS[g.kitOf(k)]);
  setup(g, [{ id: 'reaver', lvl: 10 }]);
  const C = g.range().cond;
  const allies = () => new H.Battle(g.rangeOpts(1)).allies;
  ok(allies().every((a, i) => a.energy === Math.round(kits[i].energy * 0.5)), 'energy starts at half by default');
  C.energy = 1; ok(allies().every((a, i) => a.energy === kits[i].energy), 'energy can start full');
  C.energy = 0; ok(allies().every(a => a.energy === 0), 'energy can start empty');
  C.hp = 'half'; ok(allies().every(a => a.hp === Math.round(a.maxHp * 0.5)), 'team HP can start at half');
  g.state.roster.seele.hp = 1; g.state.roster.seele.energy = 7;
  C.hp = 'save'; C.energy = 'save';
  ok(allies()[0].hp === 1 && allies()[0].energy === 7, 'team can start as in the save');
  for (const k of team) g.state.roster[k].hp = 0;
  ok(allies().every(a => a.hp === a.maxHp), 'a fallen team in the save starts full');
  for (const k of team) { g.state.roster[k].hp = null; g.state.roster[k].energy = 0; }
  C.hp = 'full'; C.energy = 0.5;
  C.sp = 0; eq(new H.Battle(g.rangeOpts(1)).sp, 0, 'skill points are set');
  C.sp = 3;
  C.techs = true; eq(g.rangeOpts(1).techs.length, 4, 'techniques can be on');
  C.techs = false; eq(g.rangeOpts(1).techs.length, 0, 'techniques are off by default');
  C.ambush = 'enemy';
  ok(new H.Battle(g.rangeOpts(1)).start().some(e => e.t === 'text' && /Засада/.test(e.text)), 'an enemy ambush reaches the fight');
  C.ambush = 'player';
  ok(new H.Battle(g.rangeOpts(1)).start().some(e => e.t === 'act' && e.kind === 'first'), 'a first strike reaches the fight');
  C.ambush = '';
  C.contact = false; eq(g.rangeOpts(1).noContact, true, 'Contact can be off');
  C.contact = true;
  C.bg = 'memory'; C.music = 'gepard';
  const l = g.rangeLook(['reaver'], false);
  ok(l.bg === 'memory' && l.music === 'gepard', 'background and music can be chosen');
  C.bg = 'auto'; C.music = 'auto';
  const look = g.rangeLook(['gepard_b'], true);
  ok(look.bg === 'snow' && look.music === 'gepard', 'auto takes them from the fight where the enemy lives');
  eq(g.rangeLook(['cocolia_x'], true).bg, 'sim', 'an enemy without a story fight uses the simulator');
  ok(H.RANGE.BG.every(([id]) => typeof id === 'string') && H.RANGE.COND.find(f => f.key === 'music').opts.length > 2, 'choices exist');
  C.seed = 123;
  const sb = g.rangeFight(); eq(sb.opts.seed, 123, 'a fixed seed is used');
  g.rangeDrop(); C.seed = 0;
  g.rangeFight(); ok(g.rangeLastSeed > 0, 'a random seed is remembered'); g.rangeDrop();
  g.events.length = 0;
  const squads = JSON.stringify(g.state.squads), party = g.state.party.join();
  ok(g.rangeOwnToggle('seele') && g.rangeOwnToggle('bronya') && g.rangeUseOwn(), 'an own team can be built');
  eq(g.rangeKeys().join(), 'seele,bronya', 'the own team fights');
  ok(g.rangeOwnToggle('natasha') && g.rangeOwnToggle('gepard') && !g.rangeOwnToggle('trail'), 'the own team has four places');
  ok(g.rangeOwnToggle('seele'), 'a hero can leave it');
  ok(!g.rangeUseSquad(7), 'an empty squad cannot be chosen');
  ok(g.rangeUseSquad(3) && g.rangeKeys().join() === team.join(), 'a saved squad can be chosen');
  ok(JSON.stringify(g.state.squads) === squads && g.state.party.join() === party, 'real squads and the party are untouched');
}

{
  const g = mk();
  setup(g, [{ id: 'doomsday', lvl: 10 }]);
  ok(g.rangePut('cocolia2', 1) && g.rangePut('mimic', 2), 'three bosses fit the stage');
  ok(!g.rangePut('grizzly', 3), 'a fourth boss does not fit');
  ok(!g.rangePut('trampler', 3), 'an elite after three bosses does not fit');
  ok(g.rangePut('reaver', 3), 'a normal enemy after three bosses fits');
  ok(!g.rangePut('trampler', 3), 'replacing a row is checked by width too');
  eq(g.rangeRows()[1].lvl, 10, 'a new row takes the level of the row above');
  g.rangeRemove(3);
  g.rangeRemove(2); g.rangeRemove(1); g.rangeRemove(0);
  ok(!g.rangeReady(), 'no enemies means nothing to launch');
  eq(g.rangeFight(), null, 'launch is refused without enemies');
  setup(g, [{ id: 'reaver', lvl: 10 }, { id: 'reaver', lvl: 10 }, { id: 'reaver', lvl: 10 }, { id: 'reaver', lvl: 10 }, { id: 'reaver', lvl: 10 }]);
  ok(!g.rangePut('hound', 5), 'five rows is the limit');
  g.rangeLevel(0, 999); eq(g.rangeRows()[0].lvl, 150, 'level is capped on edit');
  g.rangeLevel(0, 0); eq(g.rangeRows()[0].lvl, 1, 'level has a floor on edit');
  const squads = g.state.squads.slice(), party = g.state.party.slice();
  g.rangeSquadStep(1);
  eq(JSON.stringify(g.state.squads), JSON.stringify(squads), 'choosing a team does not change saved squads');
  eq(g.state.party.join(), party.join(), 'choosing a team does not change the party');
}

{
  const g = mk();
  for (const k of ['phrolova', 'himeko']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.fhSpecs(['phrolova', 'himeko']);
  g.state.squads[4] = ['phrolova', 'himeko', 'seele', 'natasha'];
  g.state.range = { team: { squad: 4 }, waves: [[{ id: 'doomsday', lvl: 60 }, { id: 'reaver', lvl: 58 }], [{ id: 'trampler', lvl: 60 }]], cond: { energy: 1, techs: true } };
  g.range();
  const b = g.rangeFight(21), ev = { all: 0, byHero: new Map(), hurt: 0, breaks: 0, down: 0, acts: 0, turns: 0 };
  const push = b.push.bind(b);
  b.push = e => {
    if (e.t === 'dmg' && e.src && e.src.side === 'ally' && e.u.side === 'enemy') { ev.all += e.v; const o = e.src.owner || e.src; ev.byHero.set(o.charId, (ev.byHero.get(o.charId) || 0) + e.v); }
    else if (e.t === 'dmg' && e.u.side === 'ally') ev.hurt += e.v;
    if (e.t === 'break') ev.breaks++;
    if (e.t === 'kill' && e.u.side === 'ally') ev.down++;
    if (e.t === 'act' && e.u.side === 'enemy') ev.acts++;
    if (e.t === 'turn' && e.u && e.u.side === 'ally') ev.turns++;
    return push(e);
  };
  b.start(); b.drain();
  for (let i = 0; i < 4000 && !b.over; i++) { b.autoStep(); b.drain(); }
  const R = g.rangeEnd(b).range;
  eq(R.total, Math.round(ev.all), 'the report total equals the sum of damage events');
  ok(Math.abs(R.heroes.reduce((a, o) => a + o.dmg, 0) - ev.all) < 1e-6, 'heroes add up to the total');
  ok(Math.abs(R.heroes.reduce((a, o) => a + Object.values(o.kinds).reduce((x, y) => x + y, 0), 0) - ev.all) < 1e-6, 'damage kinds add up to the total');
  ok(R.foes.reduce((a, o) => a + o.taken, 0) - ev.all < 1e-6, 'enemies add up to the total');
  eq(R.heroes.length, 4, 'only heroes of the team are listed, summons count for their owner');
  ok(R.heroes.every(o => H.CHARS[o.id]), 'every row is a real hero');
  for (const o of R.heroes) ok(Math.abs(o.dmg - (ev.byHero.get(o.id) || 0)) < 1e-6, 'hero sum equals events ' + o.id);
  eq(R.taken, Math.round(ev.hurt), 'damage taken equals events');
  eq(R.breaks, ev.breaks, 'breaks equal events');
  eq(R.downs, ev.down, 'losses equal events');
  eq(R.turns, ev.turns, 'turns equal events');
  eq(R.foes.reduce((a, o) => a + o.acts.length, 0), ev.acts, 'enemy actions equal events');
  ok(R.heroes.every((o, i) => !i || R.heroes[i - 1].dmg >= o.dmg), 'heroes are sorted by damage');
  ok(R.heroes.every(o => o.hits >= o.crits && o.max >= 0), 'hit counters are sane');
  ok(R.heroes.some(o => o.ults > 0), 'ultimates are counted');
  ok(R.heroes.some(o => o.kinds.ult > 0) && R.heroes.some(o => o.kinds.skill > 0 || o.kinds.basic > 0), 'kinds are told apart');
  ok(Object.keys(R.heroes.reduce((a, o) => Object.assign(a, o.kinds), {})).every(k => H.RANGE.DMG_KINDS.some(([id]) => id === k)), 'every kind has a label');
  ok(R.perCycle === Math.round(R.total / R.cycles), 'damage per cycle');
  eq(R.delta, null, 'nothing to compare the first run with');
  ok(JSON.stringify(g.state.range).length < 20000, 'the log stays small in the save');

  const run = () => { const f = g.rangeFight(21); f.start(); f.drain(); for (let i = 0; i < 4000 && !f.over; i++) { f.autoStep(); f.drain(); } return g.rangeEnd(f).range; };
  const same = run();
  ok(same.delta && same.delta.perCycle === 0 && same.delta.cycles === 0, 'the same setup and seed compare as equal');
  const r0 = g.state.roster.seele.lvl;
  g.state.roster.seele.lvl = 80;
  const up = run();
  ok(up.delta && up.delta.perCycle !== 0, 'a stronger hero shows a difference, the setup key stays');
  g.state.roster.seele.lvl = r0;
  g.rangeRows()[0].lvl = 61;
  eq(run().delta, null, 'another enemy level is another setup');
  g.rangeRows()[0].lvl = 60;
  g.range().team = { squad: 3 };
  eq(run().delta, null, 'another team is another setup');
  g.range().team = { squad: 4 };
  const a = g.rangeFight(22); a.start(); a.drain(); a.flee(); a.drain();
  const ab = g.rangeEnd(a).range;
  ok(ab.kind === 'abort' && ab.delta === null, 'an aborted run does not compare');
  const after = run();
  ok(after.delta && g.range().log.find(o => o.kind === 'abort'), 'an aborted run is logged but skipped when comparing');
  const e = g.rangeFight(21); e.start(); e.drain(); e.rangeStat.edited = true; for (let i = 0; i < 4000 && !e.over; i++) { e.autoStep(); e.drain(); }
  const ed = g.rangeEnd(e).range;
  ok(ed.edited && ed.delta === null, 'a run with edits does not compare');
  for (let i = 0; i < 12; i++) run();
  eq(g.range().log.length, H.RANGE.TUN.logMax, 'the log keeps ten runs');
  ok(g.range().log[0].label.includes('Зверь') || g.range().log[0].label.length > 0, 'a log row has a label');
  const keep = JSON.stringify(g.range().waves);
  g.rangeRows()[0].lvl = 5;
  ok(g.rangeLogLoad(0) && JSON.stringify(g.range().waves) === keep, 'a log row brings its setup back');
  ok(g.rangeUndo() && g.rangeRows()[0].lvl === 5, 'and Z takes it back');
  ok(!g.rangeLogLoad(99), 'a missing row is refused');
  ok(g.rangeSeedLock(21) === 21 && g.range().cond.seed === 21, 'the seed can be fixed from the report');
  eq(g.rangeSeedLock(21), 0, 'and released');
  g.state.range = { waves: [[{ id: 'reaver', lvl: 3 }]], log: [null, { key: 'x' }, { key: 'y', setup: {} }] };
  g.range();
  eq(g.range().log.length, 1, 'bad log rows are dropped');

  setup(g, [{ id: 'spider', lvl: 40 }]);
  const sp = g.rangeFight(3);
  sp.start(); sp.drain();
  const skill = H.ENEMIES.spider.skills.find(s => s.self === 'die');
  sp.enemies[0].hp = sp.enemies[0].maxHp = 1e9;
  for (let i = 0; i < 400 && !sp.over; i++) { sp.autoStep(); sp.drain(); }
  ok(skill && g.rangeEnd(sp).range.selfKills >= 1, 'a self-destruct is reported');
}

{
  const g = mk(), was = snap(g);
  const fight = (rows, hack, limit) => {
    g.state.range = { team: { squad: 3 }, waves: [rows], hack, cond: { energy: 0 } };
    g.range();
    const b = g.rangeFight(9);
    b.start(); b.drain();
    return b;
  };
  const b1 = fight([{ id: 'cocolia_x', lvl: 150 }, { id: 'doomsday', lvl: 150 }], { immortal: true });
  b1.opts.range.cycles = 15;
  for (let i = 0; i < 4000 && !b1.over; i++) { b1.autoStep(); b1.drain(); }
  ok(b1.allies.every(a => !a.dead && a.hp >= 1), 'an immortal team survives bosses of level 150');
  const r1 = g.rangeEnd(b1).range;
  ok(r1.kind === 'limit' && r1.downs === 0 && r1.hacked, 'the run is stamped as hacked');
  eq(g.range().log[0].hacked, true, 'the log row is stamped too');
  const again = fight([{ id: 'cocolia_x', lvl: 150 }, { id: 'doomsday', lvl: 150 }], {});
  again.opts.range.cycles = 2;
  for (let i = 0; i < 400 && !again.over; i++) { again.autoStep(); again.drain(); }
  eq(g.rangeEnd(again).range.delta, null, 'an honest run does not compare with a hacked one');
  const b2 = fight([{ id: 'reaver', lvl: 10, act: 'idle', immortal: true }], { sp: true, energy: true });
  b2.sp = 0; b2.allies.forEach(a => { a.energy = 0; });
  b2.opts.range.cycles = 3;
  b2.startTurn(b2.enemies[0]);
  ok(b2.sp === H.TUNING.spMax && b2.allies.every(a => a.energy === a.maxEnergy), 'skill points and energy refill at each turn');
  g.rangeDrop();
  const b3 = fight([{ id: 'doomsday', lvl: 40 }], { intent: true });
  ok(b3.intentOf(b3.enemies[0]), 'the next skill is known from the start');
  const plannedName = b3.intentOf(b3.enemies[0]).n, seen = [];
  const push3 = b3.push.bind(b3);
  b3.push = e => { if (e.t === 'act' && e.kind === 'enemy') seen.push(e.name); return push3(e); };
  for (let i = 0; i < 400 && !seen.length && !b3.over; i++) { b3.autoStep(); b3.drain(); }
  eq(seen[0], plannedName, 'the enemy uses the skill it showed');
  ok(!b3.analyzed(b3.enemies[0]), 'the hack does not mark targets as analyzed, so kits are untouched');
  g.rangeDrop();
  const off = fight([{ id: 'doomsday', lvl: 40 }], {});
  eq(off.intentOf(off.enemies[0]), null, 'without the hack the next skill stays hidden');
  g.rangeDrop();
  g.state.range = { waves: [[{ id: 'reaver', lvl: 3 }]], hack: { immortal: 'yes', sp: true, nope: true } };
  g.range();
  eq(JSON.stringify(g.range().hack), JSON.stringify({ immortal: false, sp: true, energy: false, intent: false }), 'hacks keep only known switches');

  const b = fight([{ id: 'doomsday', lvl: 40 }, { id: 'reaver', lvl: 40 }], {});
  const t = b.enemies[0];
  b.rangeEditHp(t, 0.5); b.drain();
  eq(t.hp, Math.max(1, Math.round(t.maxHp * 0.5)), 'the panel sets HP down');
  ok(b.rangeStat.edited && b.rangeStat.total === 0, 'a panel edit marks the run and does not count as damage');
  b.rangeEditHp(t, 0); b.drain();
  ok(t.hp === 1 && !t.dead, 'the panel leaves the target alive at 1 HP');
  b.rangeEditHp(t, 0.5); b.drain();
  eq(t.hp, Math.round(t.maxHp * 0.5), 'the panel can raise HP too');
  ok(b.rangeEditBreak(t) && t.broken, 'the panel breaks the target');
  ok(b.drain().some(e => e.t === 'break'), 'the break plays as an event');
  ok(!b.rangeEditBreak(t), 'a broken target cannot be broken again');
  const big = t.data.skills.findIndex(s => s.n === 'Неизбежная гибель');
  t.broken = false; t.frozen = 0; t.stun = 0;
  b.rangeEditSkill(t, big); b.rangeEditNow(t); b.drain();
  eq(t.planned.n, 'Неизбежная гибель', 'the panel sets the next skill');
  const hits = [];
  const pushB = b.push.bind(b);
  b.push = e => { if (e.t === 'act' && e.u === t) hits.push(e.name); return pushB(e); };
  for (let i = 0; i < 30 && !hits.length && !b.over; i++) { b.autoStep(); b.drain(); }
  eq(hits[0], 'Неизбежная гибель', 'the big attack comes on the next enemy turn');
  b.allies.forEach(a => { a.energy = 0; });
  b.rangeEditEnergy(); ok(b.allies.filter(a => !a.dead).every(a => a.energy === a.maxEnergy), 'the panel fills energy');
  b.sp = 0; b.rangeEditSp(); eq(b.sp, H.TUNING.spMax, 'the panel fills skill points');
  const low = b.allies[1]; low.dead = true; low.hp = 0; b.allies[2].hp = 1; b.allies[2].buffs.push({ s: 'atkP', v: -1, turns: 3, name: 'x', debuff: true });
  b.rangeEditHeal(); b.drain();
  ok(!low.dead && low.hp === low.maxHp, 'the panel revives');
  ok(b.allies[2].hp > 1 && !b.allies[2].buffs.some(x => x.debuff), 'the panel heals and cleans');
  b.rangeEditWave(); b.drain();
  ok(b.over && b.result.win, 'finishing the last wave ends the fight');
  const rep = g.rangeEnd(b).range;
  ok(rep.edited && rep.delta === null, 'an edited run does not compare');
  g.state.range = { team: { squad: 3 }, waves: [[{ id: 'reaver', lvl: 3 }], [{ id: 'hound', lvl: 3 }]] };
  g.range();
  const w = g.rangeFight(3); w.start(); w.drain();
  w.rangeEditWave(); w.drain();
  ok(!w.over && w.wave === 1 && w.enemies[0].id === 'hound', 'the panel moves to the next wave');
  g.rangeDrop();
  eq(snap(g), was, 'hacks and panel edits leave the save alone');
  ok(H.RANGE.HACKS.length === 4 && H.RANGE.HACKS.every(f => !/—/.test(f.label + f.text)), 'hack texts are clean');
}

{
  const g = mk(), was = snap(g);
  const rows = [{ id: 'cocolia2', lvl: 40 }, { id: 'iceedge', lvl: 38 }];
  setup(g, rows);
  const job = g.rangeBatchStart(12, 500);
  ok(!g.rangeBatchStep(job, 0.0001) && job.done === 1, 'a small budget still does one fight and stops');
  ok(g.rangeBatchStep(job) && job.done === 12, 'the batch finishes');
  const res = g.rangeBatchResult(job);
  eq(Object.values(res.kinds).reduce((a, b) => a + b, 0), 12, 'every fight has a result');
  let total = 0, cyc = 0, wins = 0;
  for (let i = 0; i < 12; i++) {
    setup(g, rows);
    const b = g.rangeFight(500 + i);
    b.start(); b.drain();
    for (let k = 0; k < H.RANGE.TUN.batchSteps && !b.over; k++) { b.autoStep(); b.drain(); }
    const r = g.rangeEnd(b).range;
    total += r.total; cyc += r.cycles; wins += r.kind === 'win' ? 1 : 0;
  }
  g.events.length = 0;
  eq(res.total, total, 'the batch damage equals the same fights one by one');
  eq(res.kinds.win, wins, 'the batch wins equal the same fights one by one');
  eq(res.cycles.avg, Math.round(10 * cyc / 12) / 10, 'the batch cycles equal the same fights one by one');
  ok(res.cycles.min <= res.cycles.avg && res.cycles.avg <= res.cycles.max, 'cycles are ordered');
  eq(res.heroes.length, 4, 'heroes are listed');
  ok(Math.abs(res.heroes.reduce((a, o) => a + o.share, 0) - 100) <= 4, 'shares add up');
  eq(res.delta, null, 'the first batch of a setup has nothing to compare with');
  setup(g, rows);
  const job2 = g.rangeBatchStart(4, 500); g.rangeBatchStep(job2);
  ok(g.rangeBatchResult(job2).delta, 'the next batch of the same setup compares');
  eq(snap(g), was, 'a batch leaves the save alone');
  eq(g.range().log.length, 0, 'a batch does not fill the log');
  setup(g, [{ id: 'ks_proto', lvl: 40, barrier: true }]);
  const stuck = g.rangeBatchStart(1, 1); g.rangeBatchStep(stuck);
  eq(stuck.kinds.limit, 1, 'a fight that cannot end counts as the limit');
  setup(g, []);
  g.state.range.waves = [[]];
  eq(g.rangeBatchStart(5), null, 'an empty table has no batch');

  const cp = require('child_process');
  setup(g, rows);
  g.state.range = { team: { own: true }, own: team, waves: [rows] };
  g.range();
  const job3 = g.rangeBatchStart(10, 40); g.rangeBatchStep(job3);
  const mine = g.rangeBatchResult(job3);
  const out = cp.execFileSync(process.execPath, [path.join(__dirname, '../tools/hsr-range-bot.cjs'), '--foe=cocolia2:40,iceedge:38', '--team=' + team.join(','), '--lvl=70', '--runs=10', '--seed=40', '--json'], { encoding: 'utf8' });
  const bot = JSON.parse(out);
  eq(bot.total, mine.total, 'the console bot gives the same damage for the same seeds');
  eq(JSON.stringify(bot.kinds), JSON.stringify(mine.kinds), 'the console bot gives the same results for the same seeds');

  g.state.range = { team: { squad: 3 }, waves: [rows], hack: { immortal: true } };
  g.range();
  const hj = g.rangeBatchStart(2, 1); hj.base.range.cycles = 3; g.rangeBatchStep(hj);
  ok(g.rangeBatchResult(hj).hacked, 'a batch with hacks is stamped');

  g.state.range = { team: { squad: 3 }, waves: [rows] };
  g.range();
  ok(g.rangeMarkSave(0), 'a setup can be bookmarked');
  ok(/Коколия|обмана/.test(g.range().marks[0].label) || g.range().marks[0].label.length > 0, 'a bookmark has a label');
  g.rangeRows()[0].lvl = 5;
  ok(g.rangeMarkLoad(0) && g.rangeRows()[0].lvl === 40, 'a bookmark brings the setup back');
  ok(g.rangeUndo() && g.rangeRows()[0].lvl === 5, 'Z takes it back');
  ok(!g.rangeMarkLoad(1) && !g.rangeMarkDrop(1), 'an empty bookmark does nothing');
  ok(!g.rangeMarkSave(99), 'a bookmark past the limit is refused');
  ok(g.rangeMarkDrop(0) && !g.range().marks[0], 'a bookmark can be removed');
  g.state.range = { waves: [rows], marks: [null, 'x', { label: 'a' }, { label: 'b', setup: { waves: [[{ id: 'reaver', lvl: 2 }]] } }] };
  g.range();
  eq(g.range().marks.filter(Boolean).length, 1, 'bad bookmarks are dropped');
  eq(g.range().marks.length, H.RANGE.TUN.marks, 'there are eight bookmark places');
  ok(g.rangeMarkLoad(3) && g.rangeRows()[0].id === 'reaver', 'a saved bookmark loads and passes the checks');

  const trials = g.rangeTrialIds();
  ok(trials.length > 10 && trials.every(id => H.CHARS[id] && !g.state.roster[id] && !id.startsWith('trail')), 'trial heroes are the ones the save does not own');
  g.state.range = { team: { own: true }, own: ['seele', 'trial:' + trials[0], 'trial:nobody'], trialLvl: 60, waves: [[{ id: 'reaver', lvl: 20 }]] };
  g.range();
  eq(g.rangeKeys().join(), 'seele,trial:' + trials[0], 'an unknown trial hero is dropped');
  const roster0 = JSON.stringify(g.state.roster);
  const tb = g.rangeFight(3), ally = tb.allies[1];
  ok(ally.trial && ally.charId === trials[0] && ally.lvl === 60 && !ally.cone && ally.eid === 0, 'a trial hero fights at the chosen level without gear');
  eq(tb.allies[0].trial, false, 'an owned hero stays himself');
  tb.start(); tb.drain();
  for (let i = 0; i < 2000 && !tb.over; i++) { tb.autoStep(); tb.drain(); }
  const tr = g.rangeEnd(tb).range;
  ok(tr.heroes.some(o => o.id === trials[0]), 'a trial hero is in the report');
  eq(JSON.stringify(g.state.roster), roster0, 'a trial hero does not enter the roster');
  eq(g.rangeHeroLvl('trial:' + trials[0]), 60, 'the level of trial heroes is shown');
  eq(g.rangeTrialLvl(1, true), 70, 'Shift raises the trial level by ten');
  for (let i = 0; i < 9; i++) g.rangeTrialLvl(1, true);
  eq(g.range().trialLvl, H.MAX_LVL, 'the trial level has the hero cap');
  g.state.range.cond.techs = true;
  ok(g.rangeOpts(1).techs.some(t => t.charId === trials[0]), 'a trial hero has a technique');
  g.state.range.cond.hp = 'save'; g.state.range.cond.energy = 'save';
  ok(new H.Battle(g.rangeOpts(1)).allies[1].hp > 0, 'a trial hero starts alive with the save setting');
}

{
  const g = mk(), lines = [...Object.values(H.RANGE.QUIPS).flat(), ...H.RANGE.TIPS.map(t => t[1])];
  ok(lines.length >= 10 && lines.every(t => !/—|Windows|Microsoft/.test(t) && t.length <= 100), 'Silver Wolf lines are clean and fit the screen');
  const fake = (kind, total, hacked, seed) => ({ kind, total, hacked, seed });
  for (const kind of Object.keys(H.RANGE.KINDS)) for (let seed = 1; seed < 8; seed++) ok(!/\{|\}|undefined/.test(g.rangeQuip(fake(kind, 100, false, seed))), 'a line is ready for the player ' + kind);
  ok(H.RANGE.QUIPS.zero.includes(g.rangeQuip(Object.assign(fake('win', 0, false, 1)))) || /0 урона/.test(g.rangeQuip(fake('win', 0, false, 1))), 'no damage has its own line');
  ok(/галочками/.test(g.rangeQuip(fake('win', 100, true, 1))), 'hacks have their own line');
  setup(g, [{ id: 'reaver', lvl: 10 }]);
  eq(g.rangeTip(), '', 'a plain row has no tip');
  setup(g, [{ id: 'reaver', lvl: 130 }]);
  ok(/уровень/.test(g.rangeTip()), 'a very high level has a tip');
  setup(g, [{ id: 'reaver', lvl: 10, act: 'idle' }]);
  ok(/Манекен/.test(g.rangeTip()), 'a dummy has a tip');
}

{
  const g = mk(), all = g.rangeSets();
  eq(all.length, Object.keys(H.ENCOUNTERS).length + H.CALYX.filter(c => c.boss).length, 'every story fight and every calyx boss is a ready encounter');
  eq(new Set(all.map(x => x.id)).size, all.length, 'encounter ids are unique');
  ok(H.RANGE.SET_GROUPS.reduce((a, [id]) => a + g.rangeSets(id).length, 0) === all.length, 'groups add up');
  for (const x of all) {
    ok(x.label && x.waves.length && x.waves.every(w => w.length && w.length <= H.RANGE.TUN.maxRows), 'encounter shape ' + x.id);
    ok(x.waves.length <= H.RANGE.TUN.maxWaves, 'encounter waves fit ' + x.id);
    ok(g.rangeLoadSet(x.id), 'encounter loads ' + x.id);
    const R = g.range();
    eq(JSON.stringify(R.waves.map(w => w.map(o => o.id + ':' + o.lvl))), JSON.stringify(x.waves), 'loaded rows equal the encounter ' + x.id);
    const b = g.rangeFight(7), o = b.opts;
    ok(o.endAt === 0 && !b.ward, 'story end and cage are gone ' + x.id);
    eq(o.party.every(p => !p.trial), true, 'no trial heroes ' + x.id);
    eq(o.field, x.field, 'field stays ' + x.id);
    eq(o.allyBuff, x.allyBuff, 'team buff stays ' + x.id);
    b.start(); b.drain();
    for (let i = 0; i < 60 && !b.over; i++) { b.autoStep(); b.drain(); }
    g.rangeDrop(); g.events.length = 0;
  }
  ok(g.rangeLoadSet('cx_echo_ochema') && g.range().waves.length === 2 && g.range().waves[1][0].id === 'phantylia2', 'the Echo of Immortality has two waves with the second form');
  eq(g.range().waves[0][0].lvl, 42, 'a calyx boss is two levels above its tier');
  ok(g.rangeLoadSet('svarog2') && g.range().waves[0][0].hpStart === 80, 'start HP of an encounter goes into its first row');
  ok(g.rangeExtra() && g.rangeExtra().allyBuff.length, 'the team buff of an encounter is kept as a condition');
  ok(g.rangeOpts(1).allyBuff === g.rangeExtra().allyBuff, 'the condition reaches the fight');
  ok(new H.Battle(g.rangeOpts(1)).start() && H.ENCOUNTERS.svarog2.allyBuff[0].turns === 999, 'the buff template stays untouched');
  ok(g.rangeLoadSet('dawn_waves') && g.rangeOpts(1).field === H.ENCOUNTERS.dawn_waves.field, 'the field of an encounter reaches the fight');
  g.range().extra = {};
  eq(g.rangeOpts(1).field, null, 'a condition can be removed');
  setup(g, [{ id: 'hound', lvl: 7 }]);
  g.range().cond.bg = 'memory';
  ok(g.rangeLoadSet('gepard'), 'load');
  ok(g.range().cond.bg === 'snow' && g.range().cond.music === 'gepard', 'an encounter brings its background and music');
  ok(g.rangeUndo() && g.rangeRows()[0].id === 'hound' && g.range().cond.bg === 'memory', 'Z brings back the table and its look');
  g.state.range = { waves: [[{ id: 'reaver', lvl: 3 }]], extra: { set: 'nope' } };
  g.range();
  eq(g.rangeExtra(), null, 'an unknown encounter condition is dropped');

  const seen = new Set();
  for (const id of Object.keys(H.ENEMIES)) {
    const d = g.rangeDossier(id, 40), e = H.ENEMIES[id], row = { id, lvl: 40 };
    setup(g, [row]);
    const u = new H.Battle(g.rangeOpts(1)).enemies[0];
    ok(d.hp === u.maxHp && d.atk === Math.round(u.base.atk) && d.def === Math.round(u.base.def) && d.spd === u.base.spd && d.tough === u.maxTough, 'dossier numbers equal the fight ' + id);
    eq(d.skills.length, (e.skills || []).length, 'dossier lists every skill ' + id);
    ok(d.skills.every(t => !/undefined|NaN|—/.test(t)), 'skill text is clean ' + id);
    ok(!/undefined|NaN|—/.test(d.order + d.notes.join() + d.origin) && d.origin.length > 0, 'dossier text is clean ' + id);
    ok(!e.pat || d.order.startsWith('Порядок: '), 'a fixed order is shown ' + id);
    if (d.origin === 'Только в Валютных войнах') seen.add(id);
  }
  eq([...seen].sort().join(), 'cocolia_x,phantylia_x,svarog_hand,timekiller,trotter_big', 'only Currency Wars enemies are marked so');
  ok(g.rangeDossier('ks_proto', 40).notes.some(t => /Аквы/.test(t)), 'the Prototype warns about Aqua');
  ok(g.rangeDossier('skaracabaz', 40).notes.some(t => /рассыпается/.test(t)), 'the clone warns about its lifespan');
  ok(g.rangeDossier('trotter', 40).notes.some(t => /убегает/.test(t)), 'the pig warns about fleeing');
  ok(g.rangeDossier('cocolia_x', 40).notes.some(t => /Валютных войнах/.test(t)), 'Currency Wars enemies warn about phases');
  ok(/Сюжетный бой/.test(g.rangeDossier('gepard_b', 40).origin), 'a story boss shows its origin');
  ok(/Снежные поля/.test(g.rangeDossier('frostspawn', 40).origin) || g.rangeOrigin('frostspawn').text.length > 0, 'a field enemy shows its map');
}

{
  const g = mk();
  g.loadMap('express_lab', 'v');
  clean(g);
  const term = g.map.ents.find(e => e.ch === 'p'), [tx, ty] = g.map.marks.p[0];
  eq(tx, 10, 'the Range terminal stands left of the others');
  eq(ty, 3, 'the Range terminal stands by the wall');
  g.placePlayer(term.x, term.y + 1); g.player.dir = 'up'; g.interact();
  ok(g.pending && g.pending.type === 'say' && /Leveling_Solo/.test(g.pending.text), 'the terminal shows its note on the first use');
  while (g.pending && g.pending.type === 'say') g.resume();
  eq(g.pending && g.pending.ui, 'range', 'the terminal opens the Range');
  g.resume();
  g.placePlayer(term.x, term.y + 1); g.player.dir = 'up'; g.interact();
  eq(g.pending && g.pending.ui, 'range', 'the note is skipped on the next use');
  g.resume();
  const pad = H.MAPS.express_lab.decor.find(d => d[0] === 'rangepad');
  ok(pad && pad[1] + 8 <= 10, 'the floor marking stands left of the terminal');
}

{
  const fs = require('fs');
  const noop = () => { };
  const makeCanvas = (w = 300, h = 150) => {
    const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }) };
    const grad = () => ({ addColorStop: noop });
    const ctx = {
      canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: false, fillStyle: '#000', strokeStyle: '#000',
      save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, rect: noop, fill: noop, stroke: noop, clip: noop, ellipse: noop,
      fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
      measureText: t => ({ width: String(t).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
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
  const page = fs.readFileSync(path.join(__dirname, '../hsr98.html'), 'utf8');
  const listed = [...page.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  ok(listed.includes('hsr-range') && listed.includes('hsr-ui-range') && listed.includes('hsr-ui-range-battle'), 'hsr98.html loads the Range modules');
  ok(listed.indexOf('hsr-ui-range-battle') < listed.indexOf('hsr-bug'), 'the Range screens load before the bug report wrappers');
  const main = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  ok(['hsr-range', 'hsr-ui-range', 'hsr-ui-range-battle'].every(f => main.includes('js/apps/hsr98/' + f + '.js')), 'index.html loads the Range modules');
  for (const f of listed.filter(x => x !== 'hsr-bug' && x !== 'hsr-ui-bug')) require(path.join(DIR, f + '.js'));

  const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
  const ui = new H.UI(root, { onExit: noop });
  const g = mk();
  ui.game = g;
  ui.mode = 'field';
  g.loadMap('express_lab', 'v');
  clean(g);
  const pump = n => { for (let i = 0; i < n; i++) { ui.update(1 / 30); ui.render(); } };
  const press = (k, code) => ui.handleKey(k, code || null, {});
  const sticky = ui.bt ? ui.bt.autoSticky : undefined;
  setup(g, [{ id: 'reaver', lvl: 1 }]);
  const term = g.map.ents.find(e => e.ch === 'p');
  g.state.flags.lab_range = true;
  g.placePlayer(term.x, term.y + 1); g.player.dir = 'up'; g.interact();
  pump(1);
  ok(ui.top() && ui.top().range, 'the ui step opens the table');
  const tb = ui.top();
  eq(tb.cur().id, 'c0_name', 'focus starts on the first enemy');
  press('right'); eq(tb.cur().id, 'c0_lvl', 'arrows reach the level cell');
  press(null, 'KeyE'); eq(g.rangeRows()[0].lvl, 2, 'E raises the level');
  ui.held = ['ShiftLeft']; press(null, 'KeyE'); ui.held = []; eq(g.rangeRows()[0].lvl, 12, 'Shift makes the step bigger');
  press(null, 'KeyQ'); eq(g.rangeRows()[0].lvl, 11, 'Q lowers the level');
  press(null, 'Digit4'); press(null, 'Digit5'); eq(g.rangeRows()[0].lvl, 45, 'digits type the level');
  press(null, 'Digit7'); eq(g.rangeRows()[0].lvl, 7, 'a digit past the cap starts a new number');
  press(null, 'Delete'); eq(g.rangeRows()[0].lvl, g.rangeTeamLvl(), 'Delete on a number resets it');
  press('left'); press('ok');
  ok(ui.top().name === 'range catalog', 'Enter on an enemy opens the catalog');
  const li = ui.top();
  press(null, 'KeyE'); press(null, 'KeyE'); press(null, 'KeyE');
  ok(li.ids().every(id => H.ENEMIES[id].boss), 'Q and E switch the tier');
  pump(1);
  li.sel = li.ids().indexOf('doomsday');
  pump(1);
  press('right'); ok(li.sel === 1, 'arrows walk the sheet');
  press('left'); press('ok');
  eq(g.rangeRows()[0].id, 'doomsday', 'Enter puts the enemy into the row');
  ok(ui.top() === tb, 'the catalog closes');
  press('down'); eq(tb.cur().id, 'add', 'the free row can be reached');
  press('ok'); pump(1); ui.top().setTab(1); ui.top().sel = 0; press('ok');
  eq(g.rangeRows().length, 2, 'Enter on the free row adds an enemy');
  eq(g.rangeRows()[1].lvl, g.rangeRows()[0].lvl, 'the new row takes the level above');
  tb.focus = 'c1_name'; press(null, 'Delete'); eq(g.rangeRows().length, 1, 'Delete on an enemy removes the row');
  g.rangeRows()[0] = { id: 'reaver', lvl: 1 };
  pump(1);

  const party0 = g.state.party.join(), was = snap(g), opts = JSON.stringify(ui.options);
  press('ok', 'Space');
  pump(2);
  eq(ui.mode, 'battle', 'Space launches the fight');
  ok(!ui.screens.some(s => s.range), 'the table leaves the screen stack');
  ok(!g.pending, 'the terminal step is finished');
  ok(g.battle.opts.range, 'the battle is a Range battle');
  ui.bt.auto = true;
  for (let i = 0; i < 4000 && !ui.bt.result; i++) { ui.update(1 / 10); if (i % 50 === 0) ui.render(); }
  ok(ui.bt.result && ui.bt.result.range, 'the fight ends with a Range result');
  eq(ui.bt.result.range.kind, 'win', 'the weak enemy is beaten');
  ui.render();
  ok(!ui.bt.result.lost, 'no retry dialog');
  ok(ui.bt.result.range.heroes.length >= 1, 'the report has heroes');
  const lock = ui.bt.result.range.seed;
  press(null, 'KeyF'); eq(g.range().cond.seed, lock, 'F fixes the seed of this run');
  ui.render();
  press(null, 'KeyF'); eq(g.range().cond.seed, 0, 'F releases it');
  press('ok');
  pump(1);
  ok(ui.mode === 'battle' && !ui.bt.result && g.battle, 'Enter on the report starts the next fight');
  eq(ui.bt.auto, true, 'auto carries over between Range fights');
  for (let i = 0; i < 4000 && !(ui.bt.result); i++) { ui.update(1 / 10); }
  press('back');
  pump(1);
  eq(ui.mode, 'field', 'Esc on the report leaves the fight');
  ok(ui.top() && ui.top().name === 'range table', 'Esc on the report returns to the table');
  ok(!ui.top().onClose, 'the reopened table has no finished script step to close');
  eq(ui.bt.autoSticky, sticky === undefined ? false : sticky, 'Range auto does not leak into normal fights');
  ok(g.range().cond.auto, 'Range auto is remembered in its own setting');
  eq(snap(g), was, 'the save is the same after fights through the screen');
  eq(g.state.party.join(), party0, 'the party is untouched');
  eq(JSON.stringify(ui.options), opts, 'options are untouched');

  {
    const t0 = ui.top();
    press(null, 'KeyL'); pump(1);
    ok(ui.top().name === 'range log' && g.range().log.length >= 2, 'L opens the log with the runs');
    press('ok');
    ok(ui.top() === t0, 'Enter on a run returns to the table');
    press(null, 'KeyL'); pump(1); press('back'); ok(ui.top() === t0, 'Esc leaves the log');
  }

  {
    const tb3 = ui.top();
    setup(g, [{ id: 'reaver', lvl: 10 }]);
    tb3.focus = 'c0_name'; press('ok'); pump(1);
    const cat = ui.top();
    eq(cat.name, 'range catalog', 'the catalog opens from the table');
    eq(cat.ids()[cat.sel], 'reaver', 'the catalog starts on the enemy of the row');
    eq(cat.ids().length, Object.keys(H.ENEMIES).length, 'the sheet shows everybody');
    const cellsOf = () => cat.sheet().cells;
    const sel0 = cat.sel, rowY = cellsOf()[sel0].y, inRow = cellsOf().filter(o => o.y === rowY);
    cat.sel = cat.ids().indexOf(inRow[0].id);
    press('left'); eq(cat.ids()[cat.sel], inRow[inRow.length - 1].id, 'left wraps around the row');
    press('right'); eq(cat.ids()[cat.sel], inRow[0].id, 'right wraps back');
    ui.held = ['ShiftLeft']; press('right'); ui.held = []; eq(cat.ids()[cat.sel], inRow[5].id, 'Shift walks five cells');
    const ring = n => { let worst = 0; for (let d = 0; d < n; d++) { let best = 99; for (let f = -4; f <= 4; f++) for (let o = -4; o <= 4; o++) if (((f * 5 + o) % n + n) % n === d) best = Math.min(best, Math.abs(f) + Math.abs(o)); worst = Math.max(worst, best); } return worst; };
    const rowsAll = new Set(cellsOf().map(o => o.y)).size;
    ok(ring(inRow.length) + Math.floor(rowsAll / 2) + 1 < 10, 'any enemy of the sheet is under ten presses away');
    const lastY = Math.max(...cellsOf().map(o => o.y));
    cat.sel = 0;
    press('up'); eq(cellsOf()[cat.sel].y, lastY, 'up from the first row wraps to the last one');
    press('down'); eq(cat.sel, 0, 'down from the last row wraps back');
    cat.sel = sel0;
    press(null, 'Space'); eq(g.rangeRows().length, 2, 'Space adds another one and stays');
    ok(ui.top() === cat, 'the catalog stays open after Space');
    for (let i = 0; i < 9; i++) press(null, 'Space');
    eq(g.rangeRows().length, 5, 'Space stops at five rows');
    press('back'); ok(ui.top() === tb3, 'Esc goes back to the table');
    setup(g, [{ id: 'reaver', lvl: 10 }]);
    tb3.focus = 'add'; press('ok'); pump(1);
    press(null, 'KeyQ'); eq(ui.top().tab, 4, 'Q reaches the encounters');
    pump(1);
    press('right'); eq(ui.top().group, 1, 'arrows switch the encounter group');
    press('left'); pump(1);
    const st = ui.top(), gi = st.sets().findIndex(x => x.id === 'gepard');
    st.setSel = gi; pump(1); press('ok');
    ok(ui.top() === tb3 && g.rangeRows()[0].id === 'gepard_b', 'Enter loads an encounter into the table');
    press(null, 'KeyZ'); eq(g.rangeRows()[0].id, 'reaver', 'Z takes it back');
    g.rangeLoadSet('dawn_waves'); tb3.tab = 'fight'; pump(1);
    ok(tb3.items().some(o => o.id === 'k_extra'), 'the fight tab shows the encounter condition');
    tb3.focus = 'k_extra'; press(null, 'Delete');
    eq(g.rangeExtra(), null, 'Delete removes the condition');
    tb3.tab = 'row'; tb3.focus = 'c0_name'; pump(1);
    g.range().cond.bg = 'auto'; g.range().cond.music = 'auto';
  }

  {
    const tb2 = ui.top(), find = id => tb2.items().find(o => o.id === id);
    setup(g, [{ id: 'doomsday', lvl: 40 }, { id: 'reaver', lvl: 38 }, { id: 'eliminator', lvl: 38 }]);
    pump(1);
    tb2.focus = 'c0_hp'; press(null, 'KeyE'); eq(g.rangeRows()[0].hp, 1.5, 'E changes a multiplier cell');
    press(null, 'Delete'); eq(g.rangeRows()[0].hp, undefined, 'Delete resets a cell');
    tb2.focus = 'c0_spd'; press(null, 'Digit1'); press(null, 'Digit5'); press(null, 'Digit0'); eq(g.rangeRows()[0].spd, 150, 'digits type speed');
    tb2.focus = 'c0_weak'; press('ok'); eq(tb2.focus, 'e_phys', 'Enter on the weakness cell goes to the editor');
    press('right'); eq(tb2.focus, 'e_fire', 'arrows walk the elements');
    tb2.focus = 'e_wind'; press(null, 'KeyE');
    ok(g.rangeRows()[0].weak.includes('wind'), 'E edits a weakness');
    pump(1);
    ui.hits.length = 0; ui.render();
    tb2.row = 1; tb2.focus = 'c1_name'; pump(1);
    ok(find('f_act') && find('a_dummy'), 'the row tab has fields and buttons');
    tb2.focus = 'a_dummy'; press('ok'); ok(g.rangeRows()[1].act === 'idle' && g.rangeRows()[1].immortal, 'the dummy button works');
    tb2.focus = 'a_copy'; press('ok'); eq(g.rangeRows().length, 4, 'the copy button works');
    tb2.focus = 'a_drop'; press('ok'); eq(g.rangeRows().length, 3, 'the remove button works');
    press(null, 'KeyZ'); eq(g.rangeRows().length, 4, 'Z restores the removed row');
    g.rangeRemove(3);
    tb2.focus = 'c0_name'; press(null, 'Tab'); eq(tb2.tab, 'fight', 'Tab switches to the fight tab');
    pump(1);
    tb2.focus = 'k_cycles'; press(null, 'KeyE'); eq(g.range().cond.cycles, 1, 'E changes a condition');
    press(null, 'KeyQ'); eq(g.range().cond.cycles, 0, 'Q changes it back');
    tb2.focus = 'k_seed'; press(null, 'Digit7'); eq(g.range().cond.seed, 7, 'digits type the seed');
    press(null, 'Delete'); eq(g.range().cond.seed, 0, 'Delete makes the seed random again');
    tb2.focus = 'team'; press('ok'); pump(1);
    ok(ui.top().name === 'range team', 'Enter on the team opens the choice');
    const tp = ui.top();
    tp.focus = 'edit'; press('ok'); pump(1);
    ok(ui.top().name === 'range own', 'the own team editor opens');
    ui.top().sel = ui.rosterKeys().indexOf('seele'); press('ok');
    ok(g.range().own.includes('seele'), 'Enter takes a hero into the own team');
    press('back'); pump(1);
    tp.focus = 'own'; press('ok');
    ok(g.range().team.own && ui.top() === tb2, 'the own team is chosen');
    g.rangeUseSquad(3);
    press(null, 'Tab');
    tb2.focus = 'w0'; press(null, 'KeyE'); eq(g.range().wave, 0, 'E has no wave to go to');
    tb2.focus = 'wadd'; press('ok'); eq(g.range().wave, 1, 'the plus adds a wave');
    pump(1);
    press('ok', 'Space'); pump(2);
    ok(ui.mode === 'battle' && g.battle.waves.length === 1, 'an empty wave is skipped on launch');
    for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
    press('back', 'Escape'); ui.bt.sub.sel = ui.subOptions().findIndex(o => /В таблицу/.test(o.label)); press('ok'); pump(1);
    g.range().wave = 1; ui.top().focus = 'w1'; press(null, 'Delete'); eq(g.range().waves.length, 1, 'Delete on a wave tab removes it');
    g.range().cond.cine = 'off';
    ok(typeof ui.ultCineOn === 'function', 'scene switches exist');
    setup(g, [{ id: 'reaver', lvl: 1 }]);
    g.range().cond.cine = 'off'; g.range().cond.auto = true;
    press('ok', 'Space'); pump(2);
    eq(ui.ultCineOn(g.battle.allies[0]), false, 'scenes can be off in the Range');
    ui.bt.auto = false;
    for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
    press('back', 'Escape'); ui.bt.sub.sel = ui.subOptions().findIndex(o => /В таблицу/.test(o.label)); press('ok'); pump(1);
    g.range().cond.cine = 'game';
    eq(snap(g), was, 'the save is the same after all table edits');
    const lay = H.RANGE.layout(['doomsday', 'trampler', 'reaver'], 640);
    const fake = [['doomsday'], ['trampler'], ['reaver']].map(([id]) => ({ appear: true, data: H.ENEMIES[id] }));
    const keepBt = ui.bt;
    ui.bt = { foes: fake, fade: new Map() };
    const real = [...ui.enemyLayout().values()];
    ui.bt = keepBt;
    ok(real.every((p, i) => Math.abs(p.x - lay[i].x) < 1e-6 && p.s === lay[i].s), 'the table scene uses the same layout as the battle');
  }

  {
    const t6 = ui.top();
    setup(g, [{ id: 'reaver', lvl: 5 }]);
    press(null, 'KeyR'); pump(1);
    const bj = ui.top();
    eq(bj.name, 'range batch', 'R opens the batch');
    for (let i = 0; i < 400 && !bj.result; i++) pump(1);
    ok(bj.result && bj.result.n === 100, 'the batch finishes in frames');
    ui.render();
    const seed1 = bj.job.seed0;
    press('ok'); ok(!bj.result && bj.job.seed0 === seed1 + 100, 'Enter runs the next seeds');
    ui.render();
    press('back'); ok(ui.top() === t6, 'Esc leaves the batch');
    t6.focus = 'b20'; press('ok'); ok(ui.top().name === 'range batch' && ui.top().job.n === 20, 'the button opens a small batch');
    press('back'); ok(ui.top() === t6, 'Esc cancels a batch');
    t6.focus = 'c0_name';
    press(null, 'KeyL'); pump(1);
    press(null, 'Tab'); pump(1);
    eq(ui.top().tab, 'marks', 'Tab opens the bookmarks');
    press('ok'); ok(g.range().marks[0], 'Enter on an empty place saves the setup');
    g.rangeRows()[0].lvl = 9;
    press('ok'); ok(ui.top() === t6 && g.rangeRows()[0].lvl === 5, 'Enter on a full place loads it');
    press(null, 'KeyL'); press(null, 'Tab'); press(null, 'Delete'); ok(!g.range().marks[0], 'Delete removes it');
    press('back');
    t6.tab = 'fight'; t6.focus = 'team'; press('ok'); pump(1);
    ui.top().focus = 'edit'; press('ok'); pump(1);
    const own = ui.top();
    press(null, 'Tab'); eq(own.trial, true, 'Tab shows trial heroes');
    pump(1);
    const tid = g.rangeTrialIds()[0];
    own.tsel = 0; press('ok');
    ok(g.range().own.includes('trial:' + tid), 'Enter takes a trial hero');
    press(null, 'KeyQ'); ok(g.range().trialLvl < H.RANGE.TUN.trialLvl, 'Q lowers their level');
    press('right'); eq(own.tsel, 1, 'arrows walk the trial grid');
    press('back'); pump(1);
    ui.top().focus = 'own'; press('ok');
    ok(ui.top() === t6 && g.range().team.own, 'the own team is taken');
    pump(1);
    press('ok', 'Space'); pump(2);
    ok(g.battle.allies.some(a => a.trial), 'a trial hero enters the fight through the screen');
    for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
    press('back', 'Escape'); ui.bt.sub.sel = ui.subOptions().findIndex(o => /В таблицу/.test(o.label)); press('ok'); pump(1);
    g.state.range.own = []; g.rangeUseSquad(3);
    ui.top().tab = 'row'; ui.top().focus = 'c0_name';
    eq(snap(g), was, 'the save is the same after batches, bookmarks and trial heroes');
  }

  {
    const t5 = ui.top();
    setup(g, [{ id: 'doomsday', lvl: 40, hp: 5 }]);
    press(null, 'Tab'); press(null, 'Tab');
    eq(t5.tab, 'hack', 'Tab reaches the hacks');
    pump(1);
    t5.focus = 'h_immortal'; press('ok'); eq(g.range().hack.immortal, true, 'Enter switches a hack on');
    pump(1);
    press(null, 'Tab'); eq(t5.tab, 'row', 'Tab goes around');
    t5.focus = 'c0_name';
    press('ok', 'Space'); pump(2);
    const wait = () => { for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10); };
    wait();
    press(null, 'Tab'); pump(2);
    eq(ui.bt.sub && ui.bt.sub.type, 'range', 'Tab opens the panel at the input moment');
    const items = ui.subOptions();
    ok(items.some(o => /пробить/.test(o.label)) && items.some(o => /Закрыть/.test(o.label)), 'the panel has its items');
    ui.render();
    const at = items.findIndex(o => o.skill);
    ui.bt.sub.sel = at;
    press(null, 'KeyE'); eq(ui.bt.sub.skill, 1, 'E walks the skills of the target');
    ui.render();
    press(null, 'KeyQ'); eq(ui.bt.sub.skill, 0, 'Q walks back');
    const big = g.battle.enemies[0].data.skills.findIndex(s => s.n === 'Неизбежная гибель');
    ui.bt.sub.skill = big; press('ok');
    ok(!ui.bt.sub && g.battle.enemies[0].planned.n === 'Неизбежная гибель', 'Enter sets the skill and closes the panel');
    ok(g.battle.rangeStat.edited, 'the fight is marked as edited');
    pump(2);
    ui.bt.auto = true;
    for (let i = 0; i < 12; i++) ui.update(1 / 10);
    press(null, 'Tab');
    ok(ui.bt.rangeWant === 'range' && !ui.bt.auto && ui.bt.rangeResume, 'Tab during auto waits for the input moment and pauses auto');
    wait(); for (let i = 0; i < 6 && !ui.bt.sub; i++) ui.update(1 / 10);
    eq(ui.bt.sub && ui.bt.sub.type, 'range', 'the panel opens as soon as the queue is empty');
    press(null, 'Tab'); ok(!ui.bt.sub, 'Tab closes the panel');
    ui.update(1 / 60);
    ok(ui.bt.auto && !ui.bt.rangeResume, 'auto comes back after the panel');
    ui.bt.auto = false;
    wait();
    press('back', 'Escape'); ui.render();
    const lastId = ui.subOptions().findIndex(o => /В таблицу/.test(o.label));
    ui.bt.sub.sel = lastId; press('ok'); pump(1);
    ok(ui.top().name === 'range table', 'the pause goes to the table');
    g.range().hack.immortal = false;
    g.range().cond.auto = false;
    eq(snap(g), was, 'the save is the same after hacks and the panel through the screen');
  }

  g.range().cond.auto = false;
  press('ok', 'Space'); pump(2);
  for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
  const seed = g.battle.opts.seed;
  press('back', 'Escape');
  eq(ui.bt.sub && ui.bt.sub.type, 'pause', 'Esc opens the pause');
  ui.bt.sub = null; ui.render(); ui.bt.sub = { type: 'pause', sel: 0 };
  pump(1);
  const pause = ui.subOptions().map(o => o.label);
  ok(pause.includes('Перезапустить') && pause.includes('В таблицу') && !pause.some(l => /Отступить/.test(l)), 'the pause has Range items and no retreat');
  ui.bt.sub.sel = 1; press('ok');
  pump(1);
  eq(g.battle.opts.seed, seed, 'restart keeps the seed');
  for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
  press('back', 'Escape'); ui.bt.sub.sel = 3; press('ok');
  for (let i = 0; i < 400 && !ui.bt.result; i++) ui.update(1 / 10);
  eq(ui.bt.result && ui.bt.result.range.kind, 'abort', 'finishing from the pause shows the result');
  ui.render();
  press('back'); pump(1);
  press('ok', 'Space'); pump(2);
  for (let i = 0; i < 400 && !(g.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 10);
  press('back', 'Escape'); ui.bt.sub.sel = ui.subOptions().findIndex(o => /В таблицу/.test(o.label)); press('ok');
  pump(1);
  ok(ui.mode === 'field' && !g.battle && ui.top().name === 'range table', 'the pause can go straight to the table');
  eq(snap(g), was, 'the save is the same after pause exits');
  press('back');
  ok(!ui.screens.length, 'Esc closes the terminal');
  g.rangeRows().length = 0;
  ui.openRangeTable(); pump(1);
  press('ok', 'Space');
  eq(ui.mode, 'field', 'an empty table refuses to launch');
}

console.log('hsr-range ok: ' + checks + ' checks');
