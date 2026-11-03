const os = require('os');
const path = require('path');
const { fork } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODULES = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-contracts', 'he-adventure', 'he-ai', 'he-script', 'he-mapfile', 'he-maps', 'he-rmg', 'he-campaign', 'he-camp1', 'he-camp2', 'he-camp3', 'he-camp4', 'he-camp5', 'he-camp6', 'he-modes'];
for (const m of MODULES) require(path.join(ROOT, 'js/apps/heroes98', m + '.js'));
const H = globalThis.Heroes98;
for (const rec of H.Maps.LIST) if (!rec.make) rec.doc = H.MapFile.read(require('fs').readFileSync(path.join(ROOT, 'content/heroes98/maps', rec.id + '.h98m'), 'utf8'));

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};
const SEEDS = +opt('seeds', 200);
const BUDGET = +opt('budget', 12000);
const pct = v => (v * 100).toFixed(0) + ' %';
const army = (id, i) => ({ unit: id, count: Math.max(1, Math.round(BUDGET * (0.6 + 0.8 * ((i || 0) * 0.618034 % 1)) / H.UNITS[id].cost)) });
const value = s => s.count * H.UNITS[s.unit].cost;

const duel = (a, b, scale) => {
  let wins = 0, rounds = 0, kept = 0;
  for (let i = 0; i < SEEDS; i++) {
    const swap = i % 2 === 1, mine = army(a, i >> 1), theirs = army(b, i >> 1);
    if (scale) theirs.count = Math.max(1, Math.round(theirs.count * scale));
    const B = H.Battle.create({ seed: 1000 + i, sides: (swap ? [theirs, mine] : [mine, theirs]).map(x => ({ stacks: [x] })) });
    H.BattleAI.play(B, 100);
    const me = swap ? 1 : 0, win = B.winner === me ? 1 : 0;
    wins += win;
    rounds += B.round;
    const side = B.stacks.filter(s => s.side === (win ? me : 1 - me));
    kept += side.reduce((t, s) => t + value(s), 0) / side.reduce((t, s) => t + s.start * H.UNITS[s.unit].cost, 0);
  }
  return { win: wins / SEEDS, rounds: rounds / SEEDS, kept: kept / SEEDS };
};

const byTier = f => (args.includes('--branches') ? H.FACTIONS[f].units.flat() : H.FACTIONS[f].units.map(row => row[0]));

const ECON_PLAN = ['dwell3', 'hall2', 'market', 'smith', 'guild1', 'dwell4', 'fort2', 'dwell5', 'guild2', 'store', 'hall3', 'special3', 'dwell6', 'dwell1u', 'dwell2u', 'dwell3u', 'special2', 'dwell4u', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special4', 'caravan', 'guild4', 'dwell7u', 'hall4', 'guild5'];
const ECON_MINES = {
  league: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['saltworks', 6], ['sulfurspring', 12]],
  barrows: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['saltworks', 6], ['saltworks', 12]],
  thicket: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['ambermine', 6], ['ambermine', 12]],
  tide: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['ambermine', 6], ['saltworks', 12]],
  forge: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['oremine', 6], ['sulfurspring', 12]],
  throne: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['moonrift', 6], ['moonrift', 12]]
};
const ECON_GOALS = [['week 1: dwellings 1-3, town hall, second hero', 7, ['dwell3', 'hall2', 'hero']], ['week 2: dwellings 4-5, guild 2, stone wall', 14, ['dwell4', 'dwell5', 'guild2', 'fort2']], ['weeks 3-4: dwelling 6, council hall, first upgrade', 28, ['dwell6', 'hall3', 'up']], ['weeks 5-6: dwelling 7', 42, ['dwell7']]];
const wk = d => (d ? 'w' + Math.ceil(d / 7) + ' d' + ((d - 1) % 7 + 1) : '-');
const ECON_FIGHTS = [2, 4, 6];
const ECON_SHARE = +opt('share', 0.5);

const fightNeutral = (S, hero, faction) => {
  const value = H.Adv.armyValue(hero.army), week = Math.ceil(S.day / 7), tiers = Object.values(H.FACTIONS).flatMap(f => f.units.map(row => row[0])).filter(id => H.UNITS[id].tier <= Math.min(7, 2 + week));
  const unit = tiers[Math.floor(H.roll(S) * tiers.length)], count = Math.max(1, Math.round(value * ECON_SHARE / H.UNITS[unit].cost));
  const slots = hero.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const B = H.Battle.create({ seed: Math.floor(H.roll(S) * 1e9), sides: [H.Hero.battleSide(hero, slots), { stacks: H.Adv.splitNeutral({ unit, count }) }] });
  H.BattleAI.play(B, 100);
  slots.forEach((slot, i) => { hero.army[slot] = H.Hero.afterFight(hero.army[slot], B.stacks[i]).stack; });
  if (!hero.army.some(Boolean)) hero.army[0] = { unit: H.FACTIONS[faction].units[0][0], count: 1 };
  if (B.winner === 0) H.Hero.addXp(hero, H.Battle.result(B).xp[0]);
  H.Hero.autoUp(S, hero);
  return B.winner === 0;
};

const econRun = (faction, weeks) => {
  const MD = H.MapData, TW = H.Town, F = H.FACTIONS[faction], M = MD.create(40, 40, ['meadow']);
  MD.add(M, { t: 'town', c: 10, r: 10, owner: 0, faction, name: 'Бот', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'] });
  const cls = Object.keys(H.CLASSES).find(c => H.CLASSES[c].faction === faction);
  const S = H.Adv.create(M, { seed: 7, players: [{ name: 'Бот', color: 0, faction, human: false }], heroes: [{ owner: 0, name: 'Бот', cls, faction, c: 12, r: 12, army: [{ unit: F.units[0][0], count: 20 }] }] });
  const o = TW.list(S)[0], res = S.players[0].res, when = {}, army = [], levels = [], hero = S.heroes[0];
  hero.c = 12;
  hero.r = 12;
  let won = 0, fights = 0;
  for (let day = 1; day <= weeks * 7; day++) {
    ECON_MINES[faction].forEach(([t, d], i) => { if (d === day) MD.add(M, { t, c: 2 + i * 5, r: 30, owner: 0, l: 0 }); });
    if ((day - 1) % 7 === 0) {
      res.gold += 1500;
      res.wood += 4;
      res.ore += 4;
      res[F.rare[0]] += 2;
    }
    if (!when.hero && day >= 2 && TW.hire(S, o, 0).ok) when.hero = day;
    let next = null;
    for (const id of ECON_PLAN) {
      const st = TW.state(S, o, id);
      if (st.s === 'ok') {
        next = id;
        break;
      }
      if (st.s === 'money' && Object.keys(st.miss).join() === 'gold') break;
    }
    if (next && TW.build(S, o, next, 'a').ok) when[next] = day;
    if (!when.up && next && F.building[next].upgrade) when.up = day;
    if ((day - 1) % 7 === 0 || (next && F.building[next].dwelling)) {
      const want = ECON_PLAN.find(id => ['ok', 'money', 'today'].includes(TW.state(S, o, id).s)), held = {};
      for (const [k, v] of Object.entries(want ? F.building[want].cost : {})) {
        held[k] = Math.min(res[k], v);
        res[k] -= held[k];
      }
      TW.recruitAll(S, o);
      for (const [k, v] of Object.entries(held)) res[k] += v;
    }
    for (const g of o.garrison.map((s, i) => (s ? i : -1)).filter(i => i >= 0)) {
      const to = H.Hero.slotFor(hero.army, o.garrison[g].unit);
      if (to >= 0) H.Hero.moveStack(o.garrison, g, hero.army, to);
    }
    if (ECON_FIGHTS.includes((day - 1) % 7 + 1)) {
      fights++;
      if (fightNeutral(S, hero, faction)) won++;
    }
    if (day % 7 === 0) {
      army.push(H.Adv.armyValue(hero.army) + H.Adv.armyValue(o.garrison));
      levels.push(hero.level);
    }
    H.Adv.endDay(S);
  }
  console.log(`\n${faction}: ` + ECON_PLAN.filter(id => when[id]).map(id => id + ' ' + wk(when[id])).join(', '));
  for (const [name, limit, ids] of ECON_GOALS) {
    const d = ids.every(id => when[id]) ? Math.max(...ids.map(id => when[id])) : 0;
    console.log(`  ${name}: ${wk(d)} ${d && d <= limit ? 'on time' : d && d <= limit + 7 ? 'late, within a week' : 'LATE'}`);
  }
  console.log('  army value at week ends: ' + army.join(', '));
  console.log('  hero level at week ends: ' + levels.join(', ') + ` (fights won ${won} of ${fights}, target: week 4 level 8-10, week 10 level 15-18, week 16 level 20+)`);
  console.log('  left: ' + H.RESOURCES.map(([k]) => k + ' ' + res[k]).join(', '));
};

const magicHero = (cls, level, seed) => {
  const S = { rs: seed >>> 0, ver: 0 }, faction = H.CLASSES[cls].faction;
  const h = H.Hero.init({ hid: null, cls, faction, level: 1, xp: H.XP_TABLE[level], army: [] }, {});
  H.Hero.autoUp(S, h);
  const own = H.FACTIONS[faction].schools, pool = Object.values(H.SPELLS).filter(sp => sp.school !== 'road' && H.Hero.canLearn(h, sp.id));
  const want = H.CLASSES[cls].mage ? 2 + level : Math.ceil(level / 3);
  for (let i = 0; i < 400 && h.spells.length < want && pool.length; i++) {
    const sp = pool[Math.floor(H.roll(S) * pool.length)];
    if (own.includes(sp.school) || H.roll(S) < 0.3) H.Hero.learn(h, sp.id);
  }
  h.mana = H.Hero.maxMana(h);
  return h;
};
const magicArmy = (faction, level) => {
  const top = Math.min(7, 1 + Math.floor(level / 3)), budget = 4000 + level * 1500, rows = H.FACTIONS[faction].units.slice(0, top);
  return rows.map(row => ({ unit: row[0], count: Math.max(1, Math.round(budget / top / H.UNITS[row[0]].cost)) }));
};
const magicDuel = (first, second, level) => {
  const pf = H.CLASSES[first].faction, qf = H.CLASSES[second].faction;
  let wins = 0, rounds = 0, casts = 0;
  for (let i = 0; i < SEEDS; i++) {
    const swap = i % 2 === 1, p = H.Hero.battleHero(magicHero(first, level, 100 + i)), q = H.Hero.battleHero(magicHero(second, level, 900 + i));
    const mine = { stacks: magicArmy(pf, level), hero: p }, theirs = { stacks: magicArmy(qf, level), hero: q };
    const B = H.Battle.create({ seed: 5000 + i, sides: swap ? [theirs, mine] : [mine, theirs] });
    while (B.winner < 0 && B.round <= 100) {
      for (const e of H.Battle.act(B, H.BattleAI.choose(B))) if (e.t === 'cast') casts++;
    }
    if (B.winner === (swap ? 1 : 0)) wins++;
    rounds += B.round;
  }
  return { win: wins / SEEDS, rounds: rounds / SEEDS, casts: casts / SEEDS };
};
const MAGIC_LEVELS = [3, 6, 10, 15, 20, 25];

const ARMY_OPEN = [1, 1, 1, 2, 2, 3, 5];
const ARMY_LEVELS = { 2: 4, 4: 9, 8: 15 };
const armyAt = (faction, week, scale) => H.FACTIONS[faction].units.map((row, i) => {
  const weeks = Math.max(0, week - ARMY_OPEN[i] + 1);
  return { unit: row[0], count: Math.round(H.UNITS[row[0]].growth * weeks * (scale || 1)) };
}).filter(s => s.count > 0);
const armyValue = stacks => stacks.reduce((t, s) => t + s.count * H.UNITS[s.unit].cost, 0);
const armySide = (faction, week, scale, seed) => {
  const cls = Object.keys(H.CLASSES).find(c => H.CLASSES[c].faction === faction && !H.CLASSES[c].mage);
  return { stacks: armyAt(faction, week, scale), hero: H.Hero.battleHero(magicHero(cls, ARMY_LEVELS[week], seed)) };
};
const armiesField = (a, b, week) => {
  let wins = 0, rounds = 0;
  for (let i = 0; i < SEEDS; i++) {
    const swap = i % 2 === 1, mine = armySide(a, week, 1, 100 + i), theirs = armySide(b, week, 1, 700 + i);
    const B = H.Battle.create({ seed: 3000 + i, sides: swap ? [theirs, mine] : [mine, theirs] });
    H.BattleAI.play(B, 100);
    if (B.winner === (swap ? 1 : 0)) wins++;
    rounds += B.round;
  }
  return { win: wins / SEEDS, rounds: rounds / SEEDS };
};
const siegeWins = (attacker, defender, week, fort, withHero, scale) => {
  let wins = 0, rounds = 0;
  for (let i = 0; i < SEEDS; i++) {
    const near = armySide(attacker, week, scale, 100 + i), far = armySide(defender, week, 1, 700 + i);
    if (!withHero) delete far.hero;
    const held = armyValue(far.stacks), siege = fort ? H.Adv.siegeOf({ built: ['fort' + fort], faction: defender }, held) : null;
    const B = H.Battle.create({ seed: 4000 + i, siege, sides: [near, far] });
    H.BattleAI.play(B, 100);
    if (B.winner === 0) wins++;
    rounds += B.round;
  }
  return { win: wins / SEEDS, rounds: rounds / SEEDS };
};
const siegeEven = (attacker, defender, week, fort, withHero) => {
  let lo = 0.5, hi = 4;
  for (let k = 0; k < 7; k++) {
    const mid = (lo + hi) / 2;
    if (siegeWins(attacker, defender, week, fort, withHero, mid).win >= 0.5) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};

const dressedSide = (faction, week, scale, seed, items) => {
  const cls = Object.keys(H.CLASSES).find(c => H.CLASSES[c].faction === faction && !H.CLASSES[c].mage), h = magicHero(cls, ARMY_LEVELS[week], seed);
  for (const id of items) {
    const slot = H.ART_SLOTS.map(x => x[0]).find(x => H.Hero.fits(id, x) && !h.arts[x]);
    h.arts[slot] = id;
  }
  return { stacks: armyAt(faction, week, scale), hero: H.Hero.battleHero(h), morale: H.Hero.morale(h), luck: H.Hero.luck(h) };
};
const itemWin = (faction, week, items, scale) => {
  let wins = 0;
  for (let i = 0; i < SEEDS; i++) {
    const swap = i % 2 === 1, mine = dressedSide(faction, week, 1, 100 + i, items), theirs = dressedSide(faction, week, scale, 100 + i, []);
    const B = H.Battle.create({ seed: 6000 + i, sides: swap ? [theirs, mine] : [mine, theirs] });
    H.BattleAI.play(B, 100);
    if (B.winner === (swap ? 1 : 0)) wins++;
  }
  return wins / SEEDS;
};
const itemWorth = (faction, week, items) => {
  let lo = 0.8, hi = 2.2;
  for (let k = 0; k < 6; k++) {
    const mid = (lo + hi) / 2;
    if (itemWin(faction, week, items, mid) >= 0.5) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

const AI_LINEUPS = { ford: [['league', 'barrows'], ['barrows', 'league'], ['league', 'league'], ['barrows', 'barrows']], mesha: [['league', 'barrows', 'barrows', 'league'], ['league', 'barrows', null, null], ['league', null, null, 'barrows'], ['barrows', 'league', 'league', 'barrows']], chasha: [['league', 'barrows', 'barrows', 'league'], ['league', 'barrows', null, null], ['barrows', null, null, 'league'], ['barrows', 'league', 'league', 'barrows']] };
const L6 = ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne'];
Object.assign(AI_LINEUPS, {
  salt: [['league', 'barrows'], ['barrows', 'league'], ['thicket', 'forge'], ['tide', 'throne']],
  seven: [[...L6, 'league'], [...L6].reverse().concat(['barrows'])],
  crown: [[...L6, 'league', 'barrows'], [...L6].reverse().concat(['forge', 'tide'])],
  horn: [['forge', 'league', 'barrows'], ['thicket', 'forge', 'tide'], ['throne', 'barrows', 'forge'], ['league', 'tide', 'thicket']],
  ruins: [['throne', 'league', 'thicket', 'barrows'], ['league', 'throne', 'barrows', 'tide'], ['forge', 'tide', 'throne', 'league'], ['barrows', 'thicket', 'forge', 'throne']],
  border: [['league', 'barrows', 'thicket', 'tide'], ['forge', 'throne', 'league', 'barrows'], ['tide', 'thicket', 'forge', 'throne'], ['barrows', 'league', 'tide', 'forge']],
  conv: [L6, [...L6].reverse()],
  dark: [[...L6, 'league', 'barrows'], [...L6].reverse().concat(['forge', 'tide'])],
  isles: [['tide', 'league'], ['league', 'tide'], ['barrows', 'thicket'], ['forge', 'throne']],
  seals: [['league', 'thicket', 'forge', 'throne'], ['barrows', 'tide', 'league', 'forge'], ['throne', 'league', 'thicket', 'barrows'], ['tide', 'forge', 'throne', 'thicket']],
  three: [['league', 'barrows'], ['barrows', 'league'], ['thicket', 'forge'], ['throne', 'tide']],
  union: [['league', 'thicket', 'barrows', 'forge'], ['barrows', 'forge', 'league', 'thicket'], ['tide', 'throne', 'forge', 'league'], ['throne', 'tide', 'thicket', 'barrows']]
});
const AI_LINEUPS_THICKET = { ford: [['thicket', 'league'], ['barrows', 'thicket'], ['league', 'thicket'], ['thicket', 'barrows']], mesha: [['thicket', 'league', 'barrows', 'thicket'], ['thicket', 'barrows', null, null], ['league', null, null, 'thicket'], ['barrows', 'thicket', 'league', 'thicket']], chasha: [['thicket', 'barrows', 'league', 'thicket'], ['thicket', 'league', null, null], ['barrows', null, null, 'thicket'], ['league', 'thicket', 'thicket', 'barrows']] };
if (args.includes('--thicket')) Object.assign(AI_LINEUPS, AI_LINEUPS_THICKET);
const AI_LINEUPS_TIDE = { ford: [['tide', 'league'], ['barrows', 'tide'], ['thicket', 'tide'], ['tide', 'barrows']], mesha: [['tide', 'league', 'barrows', 'thicket'], ['tide', 'thicket', null, null], ['league', null, null, 'tide'], ['barrows', 'tide', 'thicket', 'league']], chasha: [['tide', 'barrows', 'league', 'thicket'], ['tide', 'league', null, null], ['thicket', null, null, 'tide'], ['league', 'tide', 'thicket', 'barrows']] };
if (args.includes('--tide')) Object.assign(AI_LINEUPS, AI_LINEUPS_TIDE);
const AI_LINEUPS_FORGE = { ford: [['forge', 'league'], ['tide', 'forge'], ['thicket', 'forge'], ['forge', 'barrows']], mesha: [['forge', 'league', 'barrows', 'tide'], ['forge', 'thicket', null, null], ['tide', null, null, 'forge'], ['barrows', 'forge', 'thicket', 'league']], chasha: [['forge', 'barrows', 'league', 'tide'], ['forge', 'thicket', null, null], ['tide', null, null, 'forge'], ['league', 'forge', 'thicket', 'barrows']] };
if (args.includes('--forge')) Object.assign(AI_LINEUPS, AI_LINEUPS_FORGE);
const AI_LINEUPS_THRONE = { ford: [['throne', 'league'], ['forge', 'throne'], ['thicket', 'throne'], ['throne', 'barrows']], mesha: [['throne', 'league', 'barrows', 'tide'], ['throne', 'forge', null, null], ['tide', null, null, 'throne'], ['barrows', 'throne', 'thicket', 'forge']], chasha: [['throne', 'barrows', 'league', 'forge'], ['throne', 'tide', null, null], ['thicket', null, null, 'throne'], ['league', 'throne', 'forge', 'barrows']] };
if (args.includes('--throne')) Object.assign(AI_LINEUPS, AI_LINEUPS_THRONE);
const rmgLineup = (id, seed) => {
  const [, template, w, count] = id.split(':'), n = +count || H.Rmg.playersFor(template, +w)[0], flip = seed % 2;
  return Array.from({ length: n }, (_, i) => ((i + flip) % 2 ? 'barrows' : 'league'));
};
const defOf = (id, seed, lineup, difficulty) => {
  const slots = lineup.map(f => (f ? { faction: f } : null));
  if (!id.startsWith('rmg:')) return H.Maps.build(id, { seed, slots, difficulty });
  const [, template, w] = id.split(':'), r = H.Rmg.make({ template, w: +w, levels: 1, water: H.Rmg.TEMPLATES[template].sea ? 'many' : 'none', neutrals: 'normal', seed, players: lineup.map(faction => ({ faction })) });
  if (!r.doc) throw new Error('rmg failed: ' + JSON.stringify(r.log[r.log.length - 1]));
  return H.Maps.play(r.doc, { seed: r.seed, slots, difficulty });
};
const aiGame = (id, seed, lineup, dayCap, difficulty) => {
  const slots = lineup.map(f => (f ? { faction: f } : null)), def = defOf(id, seed, lineup, difficulty);
  const S = H.Adv.create(def.map, def.setup), out = { id, seed, lineup: lineup.join(), winner: null, faction: null, days: 0, slowest: 0, total: 0, turns: 0, built: [], heroes: [], towns: 0, error: null, sieges: 0, fortFalls: 0, fled: 0, visits: {}, why: null, heartFound: false };
  const counted = new Set();
  const visitOf = Object.fromEntries(Object.entries(H.OBJ_VISIT).map(([k, fn]) => [k, fn]));
  for (const [k, fn] of Object.entries(visitOf)) {
    H.OBJ_VISIT[k] = (st, hero, o, ev, from) => {
      if (!counted.has(hero.owner + ':' + o.id + ':' + st.day)) {
        counted.add(hero.owner + ':' + o.id + ':' + st.day);
        out.visits[o.t] = (out.visits[o.t] || 0) + 1;
      }
      return fn(st, hero, o, ev, from);
    };
  }
  const makeWater = H.Battle.create;
  H.Battle.create = o => {
    if (o.siege) out.sieges++;
    if (o.deck) out.decks = (out.decks || 0) + 1;
    return makeWater(o);
  };
  const walked = new Set(), stepOf = H.Adv.step;
  H.Adv.step = (st, hero, c, r) => {
    const res = stepOf(st, hero, c, r);
    walked.add(hero.l * 1e6 + hero.r * st.map.w + hero.c);
    return res;
  };
  const doneBattle = H.Adv.battleDone;
  H.Adv.battleDone = (st, B) => {
    if (B.siege && B.winner === 0) out.fortFalls++;
    if (B.fled) out.fled++;
    return doneBattle(st, B);
  };
  try {
    while (!S.over && S.day <= dayCap) {
      const t0 = process.hrtime.bigint();
      H.AI.turn(S);
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      if (ms > out.slowest) {
        out.slowest = ms;
        out.slowDay = S.day;
        out.slowPlayer = S.turn;
      }
      out.total += ms;
      out.turns++;
      H.Adv.endTurn(S);
    }
  } catch (e) {
    out.error = (e && e.stack || String(e)).split('\n').slice(0, 4).join(' | ');
  }
  out.days = S.day;
  if (S.over && S.over.winner >= 0) {
    out.winner = S.over.winner;
    out.faction = S.players[S.over.winner].faction;
    out.why = S.over.why;
  }
  out.heartFound = !!(S.map.heart && S.map.heart.taken);
  out.walked = walked.size;
  out.open = 0;
  for (let l = 0; l < S.map.levels; l++) for (let i = 0; i < S.map.w * S.map.h; i++) if (H.MapData.groundCost(S.map, l, i % S.map.w, (i / S.map.w) | 0)) out.open++;
  out.boats = S.heroes.filter(h => h.boat).length;
  out.built = S.map.objs.filter(o => o.t === 'town' && o.owner >= 0).map(o => o.built.length);
  out.heroes = S.heroes.filter(h => h.alive).map(h => h.level);
  out.alive = S.players.filter(p => !p.out).length;
  out.caravans = S.nextCaravan - 1;
  out.deals = S.players.reduce((t, p) => t + p.dealsDone, 0);
  out.machines = S.heroes.filter(h => h.machines.length).length;
  return out;
};

const estimateCheck = () => {
  const armyOf = (faction, budget, top) => H.FACTIONS[faction].units.slice(0, top).map(row => ({ unit: row[0], count: Math.max(1, Math.round(budget / top / H.UNITS[row[0]].cost)) }));
  const rows = [];
  for (const faction of ['league', 'barrows', 'thicket', 'tide']) {
    for (const share of [0.25, 0.5, 0.75, 1, 1.5]) {
      for (const top of [2, 4, 6]) {
        const foe = faction === 'league' ? 'thicket' : 'league', mine = armyOf(faction, 12000, top), theirs = armyOf(foe, 12000 * share, top);
        const est = H.BattleAI.estimate([{ stacks: mine }, { stacks: theirs }], null);
        let wins = 0, lost = 0;
        for (let i = 0; i < SEEDS; i++) {
          const B = H.Battle.create({ seed: 200 + i, sides: [{ stacks: mine }, { stacks: theirs }] });
          H.BattleAI.play(B, 100);
          const side = B.stacks.filter(s => s.side === 0);
          if (B.winner === 0) wins++;
          lost += 1 - side.reduce((t, s) => t + value(s), 0) / side.reduce((t, s) => t + s.start * H.UNITS[s.unit].cost, 0);
        }
        rows.push({ faction, share, top, est: est.lost[0], estWin: est.win, real: lost / SEEDS, win: wins / SEEDS });
      }
    }
  }
  return rows;
};

const branchArmy = (faction, week, tier, pick, scale) => armyAt(faction, week).map(s => {
  if (H.UNITS[s.unit].tier !== tier + 1) return s;
  const up = H.FACTIONS[faction].units[tier][pick];
  return { unit: up, count: Math.max(1, Math.round(s.count * H.UNITS[s.unit].cost / H.UNITS[up].cost * (scale || 1))) };
});
const branchFight = (faction, week, tier, a, b, scale) => {
  let wins = 0;
  for (let i = 0; i < SEEDS; i++) {
    const swap = i % 2 === 1, cls = Object.keys(H.CLASSES).find(c => H.CLASSES[c].faction === faction && !H.CLASSES[c].mage), hero = H.Hero.battleHero(magicHero(cls, ARMY_LEVELS[week], 100 + i));
    const mine = { stacks: branchArmy(faction, week, tier, a, scale), hero }, theirs = { stacks: branchArmy(faction, week, tier, b), hero };
    const B = H.Battle.create({ seed: 7000 + i, sides: swap ? [theirs, mine] : [mine, theirs] });
    H.BattleAI.play(B, 100);
    if (B.winner === (swap ? 1 : 0)) wins++;
  }
  return wins / SEEDS;
};
const missionList = () => {
  const fs = require('fs'), out = [];
  for (const camp of [H.Campaign.get('nabat'), H.Campaign.get('sol'), H.Campaign.get('zapoved'), H.Campaign.get('chasha'), H.Campaign.get('zhar'), H.Campaign.get('tysyacha')]) {
    camp.missions.forEach((m, index) => {
      if (!m.doc) H.Campaign.attach(m, fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8'));
      out.push({ camp: camp.id, index, m });
    });
  }
  return out;
};
const carryFor = (camp, index, seed) => {
  const mission = H.Campaign.get(camp).missions[Math.max(0, index - 1)], levels = index ? mission.levelCap : 1, hid = H.Campaign.get(camp).hero, rec = H.HEROES.find(x => x.id === hid), S = { rs: seed >>> 0, ver: 0 }, h = H.Hero.init({ hid, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, level: 1, xp: H.XP_TABLE[levels], army: [], c: 0, r: 0, l: 0 }, {});
  H.Hero.autoUp(S, h);
  return index ? H.Campaign.carryOf(h, []) : null;
};
const playMission = (t, watch) => {
  const { m, camp, index } = missionList().find(x => x.m.id === t.id), started = process.hrtime.bigint();
  H.Campaign.reset();
  const run = H.Campaign.begin(camp, t.difficulty);
  run.hero = carryFor(camp, index, t.seed);
  const def = H.Campaign.setup(camp, index, { seed: t.seed, bonus: t.seed % 3 }), S = H.Adv.create(def.map, def.setup), out = { id: t.id, seed: t.seed, won: false, why: null, days: 0, slowest: 0, deals: 0, level: 0, error: null };
  try {
    H.Script.opening(S);
    let guard = 0;
    while (!S.over && S.day <= t.cap && guard++ < 2000000) {
      if (S.scene) {
        H.Script.advance(S, 0);
        continue;
      }
      const T = H.AI.begin(S, S.turn), t0 = process.hrtime.bigint();
      for (let i = 0; i < 40000; i++) {
        if (S.scene) {
          H.Script.advance(S, 0);
          continue;
        }
        const r = H.AI.step(S, T);
        if (watch) watch(S, r);
        if (r.battle) {
          const setup = r.battle === true ? H.Adv.battleSetup(S) : r.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          H.Adv.battleDone(S, B);
        }
        if (r.done || S.over) break;
      }
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      if (ms > out.slowest) out.slowest = ms;
      if (!S.over) H.Adv.endTurn(S);
    }
  } catch (e) {
    out.error = (e && e.stack || String(e)).split('\n').slice(0, 4).join(' | ');
  }
  out.won = !!S.over && S.over.winner === 0;
  out.why = S.over ? S.over.why : 'cap';
  out.days = S.day;
  const h = S.heroes.find(x => x.hid === H.Campaign.get(camp).hero);
  out.level = h ? h.level : 0;
  out.deals = S.players[0].dealsDone;
  out.goals = S.script.goals.map(g => g.id + ':' + g.state).join(' ');
  out.ms = Number(process.hrtime.bigint() - started) / 1e6;
  return out;
};
const NEUTRAL_POOL = week => Object.values(H.UNITS).filter(u => u.faction === 'neutral' && u.tier <= Math.min(7, 2 + week)).map(u => Object.keys(H.UNITS).find(k => H.UNITS[k] === u));
const guardFight = (faction, week, seed) => {
  const mine = armySide(faction, week, 1, 100 + seed), pool = NEUTRAL_POOL(week), unit = pool[seed % pool.length], count = Math.max(1, Math.round(armyValue(mine.stacks) / 2 / H.UNITS[unit].cost));
  const B = H.Battle.create({ seed: 8000 + seed, sides: [mine, { stacks: H.Adv.splitNeutral({ unit, count }) }] });
  let turns = 0;
  while (B.winner < 0 && B.round <= 100) {
    if (B.stacks[B.active].side === 0) turns++;
    H.Battle.act(B, H.BattleAI.choose(B));
  }
  const left = B.stacks.filter(s => s.side === 0).reduce((t, s) => t + s.count * H.UNITS[s.unit].cost, 0);
  return { win: B.winner === 0, rounds: B.round, turns, lost: 1 - left / armyValue(mine.stacks) };
};
const modes = {
  mission() {
    const pick = args[args.indexOf('mission') + 1], jobs = +opt('jobs', 3), seeds = +opt('seeds', 20), cap = +opt('days', 200), difficulty = opt('difficulty', 'easy');
    const list = missionList().map(x => x.m.id).filter(id => !pick || pick === 'all' || pick.startsWith('--') || id === pick), tasks = [];
    for (const id of list) for (let i = 0; i < seeds; i++) tasks.push({ id, seed: 2000 + i, cap, difficulty });
    console.log(`mission: AI plays the human slot, ${difficulty}, ${seeds} seeds, ${jobs} processes, day cap ${cap}; target: at least 15 of 20`);
    const rows = [];
    return new Promise(done => {
      let next = 0, running = 0;
      const launch = () => {
        while (running < jobs && next < tasks.length) {
          const child = fork(__filename, ['missionworker', JSON.stringify(tasks[next++])]);
          running++;
          child.on('message', m => rows.push(m));
          child.on('exit', () => {
            running--;
            if (next < tasks.length || running) return launch();
            for (const id of list) {
              const r = rows.filter(x => x.id === id), won = r.filter(x => x.won), days = r.map(x => x.days).sort((a, b) => a - b), why = {};
              for (const x of r) why[x.why] = (why[x.why] || 0) + 1;
              console.log(`${id}: won ${won.length}/${r.length}, days median ${days[days.length >> 1]} min ${days[0]} max ${days[days.length - 1]}, level ${(r.reduce((t, x) => t + x.level, 0) / r.length).toFixed(1)}, contracts ${(r.reduce((t, x) => t + x.deals, 0) / r.length).toFixed(1)}, slowest ${Math.max(...r.map(x => x.slowest)).toFixed(0)} ms; ends ${JSON.stringify(why)}`);
              for (const x of r.filter(q => q.error).slice(0, 3)) console.log('  ERROR seed ' + x.seed + ': ' + x.error);
              for (const x of r.filter(q => !q.won).slice(0, 4)) console.log(`  LOST seed ${x.seed}: day ${x.days}, ${x.why}, goals ${x.goals}`);
            }
            done();
          });
        }
      };
      launch();
    });
  },
  missionworker() {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const t = JSON.parse(args[args.indexOf('missionworker') + 1]), cells = new Set(), used = new Set();
    for (const [k, fn] of Object.entries(H.OBJ_VISIT)) {
      H.OBJ_VISIT[k] = (st, hero, o, ev, from) => {
        if (hero.owner === 0) used.add(o.id);
        return fn(st, hero, o, ev, from);
      };
    }
    const rec = playMission(t, S => {
      for (const h of S.heroes) if (h.alive && h.owner === 0) cells.add(h.l * S.map.w * S.map.h + h.r * S.map.w + h.c);
      for (const o of S.map.objs) if (o.gone && o.t === 'monster') used.add(o.id);
    });
    rec.cells = [...cells];
    rec.used = [...used];
    process.send(rec);
    process.disconnect();
  },
  heat() {
    const pick = args[args.indexOf('heat') + 1], jobs = +opt('jobs', 3), seeds = +opt('seeds', 20), difficulty = opt('difficulty', 'easy');
    const list = missionList().filter(x => !pick || pick === 'all' || pick.startsWith('--') || x.m.id === pick), tasks = [];
    for (const x of list) for (let i = 0; i < seeds; i++) tasks.push({ id: x.m.id, seed: 2000 + i, cap: 200, difficulty });
    console.log(`heat: objects and cells the player's heroes never reach in ${seeds} AI games, ${difficulty}`);
    const rows = [];
    return new Promise(done => {
      let next = 0, running = 0;
      const launch = () => {
        while (running < jobs && next < tasks.length) {
          const child = fork(__filename, ['missionworker', JSON.stringify(tasks[next++])]);
          running++;
          child.on('message', m => rows.push(m));
          child.on('exit', () => {
            running--;
            if (next < tasks.length || running) return launch();
            for (const x of list) {
              const r = rows.filter(q => q.id === x.m.id), cells = new Set(r.flatMap(q => q.cells)), used = new Set(r.flatMap(q => q.used)), M = x.m.doc.map;
              const wet = x.m.doc.players[0].factions.length > 0 && x.m.doc.players[0].factions.every(f => f === 'tide');
              const open = (() => { let n = 0; for (let l = 0; l < M.levels; l++) for (let c = 0; c < M.w; c++) for (let y = 0; y < M.h; y++) if (H.MapData.groundCost(M, l, c, y) || (wet && H.MapData.isWater(M, l, c, y))) n++; return n; })();
              const cold = M.objs.filter(o => H.OBJ[o.t].kind !== 'decor' && !used.has(o.id) && o.t !== 'town');
              console.log(`${x.m.id}: cells walked ${cells.size} of ${open} (${pct(cells.size / open)}), objects never used ${cold.length} of ${M.objs.filter(o => H.OBJ[o.t].kind !== 'decor').length}: ` + cold.map(o => H.OBJ[o.t].name + (o.unit ? ' ' + H.UNITS[o.unit].name : '') + ' ' + o.c + ',' + o.r).join('; '));
            }
            done();
          });
        }
      };
      launch();
    });
  },
  guards() {
    console.log(`guards: a week army with a warrior hero against a neutral guard of half its value, ${SEEDS} seeds; target: 3-8 turns of the player, losses up to 15 %`);
    for (const f of Object.keys(H.FACTIONS)) {
      for (const week of [2, 4, 8]) {
        const rows = Array.from({ length: SEEDS }, (_, i) => guardFight(f, week, i)), mean = k => rows.reduce((t, r) => t + r[k], 0) / rows.length, worst = rows.map(r => r.lost).sort((a, b) => a - b)[Math.floor(rows.length * 0.9)];
        console.log(`${f} week ${week}: wins ${pct(rows.filter(r => r.win).length / rows.length)}, rounds ${mean('rounds').toFixed(1)}, turns ${mean('turns').toFixed(1)}, losses ${pct(mean('lost'))}, worst tenth ${pct(worst)}`);
      }
    }
  },
  branches() {
    const faction = opt('faction', 'league'), week = +opt('week', 8);
    console.log(`branches: army of week ${week} of ${faction}, one row swapped for equal gold, ${SEEDS} seeds; target: the two branches 40-60 %; base against a branch at equal count is the strength of a branch`);
    H.FACTIONS[faction].units.forEach((row, t) => {
      if (!armyAt(faction, week).some(s => H.UNITS[s.unit].tier === t + 1)) return;
      const ab = branchFight(faction, week, t, 1, 2), a0 = branchFight(faction, week, t, 1, 0), b0 = branchFight(faction, week, t, 2, 0);
      console.log(`T${t + 1} ${H.UNITS[row[1]].name} against ${H.UNITS[row[2]].name}: ${pct(ab)}; equal gold against ${H.UNITS[row[0]].name}: ${pct(a0)} and ${pct(b0)}`);
    });
  },
  duelmode() {
    const D = H.Duel, n = D.HEROES.length, wins = Array(n).fill(0), games = Array(n).fill(0), cells = [];
    let rounds = 0, battles = 0, unfinished = 0;
    console.log(`duelmode: ${n} duel heroes, every pair, ${SEEDS} seeds per pair with sides swapped`);
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        let won = 0;
        for (let i = 0; i < SEEDS; i++) {
          const swap = i % 2 === 1, first = swap ? b : a, second = swap ? a : b, r = D.battle(D.HEROES[first], D.HEROES[second], { seed: 7000 + i });
          H.BattleAI.play(r.B, 100);
          if (r.B.winner < 0) unfinished++;
          if ((r.B.winner === 0 ? first : second) === a) won++;
          rounds += r.B.round;
          battles++;
        }
        wins[a] += won;
        wins[b] += SEEDS - won;
        games[a] += SEEDS;
        games[b] += SEEDS;
        cells.push([a, b, won / SEEDS]);
      }
    }
    D.HEROES.forEach((d, i) => {
      const worst = cells.filter(c => c[0] === i || c[1] === i).map(c => (c[0] === i ? c[2] : 1 - c[2])).sort((x, y) => x - y);
      console.log(`${D.recordOf(d).name.padEnd(16)} ${pct(wins[i] / games[i]).padStart(5)}, worst pair ${pct(worst[0])}, best pair ${pct(worst[worst.length - 1])}`);
    });
    if (args.includes('--pairs')) for (const [a, b, w] of cells) console.log(`  ${D.recordOf(D.HEROES[a]).name} against ${D.recordOf(D.HEROES[b]).name}: ${pct(w)}`);
    console.log(`mean rounds ${(rounds / battles).toFixed(1)}, unfinished ${unfinished}; target: every hero 40-60 % against the field`);
  },
  armies() {
    const list = ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne'], NAME = { league: 'Лига', barrows: 'Курганы', thicket: 'Чаща', tide: 'Прилив', forge: 'Горнила', throne: 'Престол' };
    console.log(`armies: week armies with a warrior hero, ${SEEDS} seeds`);
    for (const [a, b] of [['league', 'barrows'], ['thicket', 'league'], ['thicket', 'barrows'], ['tide', 'league'], ['tide', 'barrows'], ['tide', 'thicket'], ['forge', 'league'], ['forge', 'barrows'], ['forge', 'thicket'], ['forge', 'tide'], ['throne', 'league'], ['throne', 'barrows'], ['throne', 'thicket'], ['throne', 'tide'], ['throne', 'forge']]) {
      for (const week of [2, 4, 8]) {
        const r = armiesField(a, b, week);
        console.log(`field, week ${week}: ${NAME[a]} ${pct(r.win)} against ${NAME[b]}, rounds ${r.rounds.toFixed(1)}, value ${armyValue(armyAt(a, week))} and ${armyValue(armyAt(b, week))}`);
      }
    }
    if (args.includes('--field')) return;
    for (const week of [4, 8]) {
      for (const a of list) {
        const d = a === 'league' ? 'barrows' : a === 'barrows' ? 'thicket' : a === 'thicket' ? 'tide' : a === 'tide' ? 'forge' : a === 'forge' ? 'throne' : 'league', cells = [];
        for (const fort of [0, 1, 2, 3]) {
          const same = siegeWins(a, d, week, fort, true, 1), k = siegeEven(a, d, week, fort, true);
          cells.push(`${fort ? 'fort ' + fort : 'no wall'}: equal army wins ${pct(same.win)} in ${same.rounds.toFixed(0)} rounds, even at ×${k.toFixed(2)}`);
        }
        console.log(`siege, week ${week}, ${a} attacks ${d} with a hero: ` + cells.join('; '));
      }
    }
    console.log('target: a fortress with a hero needs an army 1.5 times dearer');
  },
  sets() {
    const week = +opt('week', 4);
    console.log(`sets: the same hero and army with and without items, week ${week}, ${SEEDS} seeds; ×k means the bare side needs an army k times larger to win half`);
    const line = (name, items) => {
      const cells = ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne'].map(f => {
        const k = itemWorth(f, week, items);
        return { f, k };
      });
      console.log(`${name.padEnd(28)} ${cells.map(c => c.f + ' ×' + c.k.toFixed(2)).join(', ')}`);
      return Math.max(...cells.map(c => c.k));
    };
    let worst = 0;
    for (const set of Object.values(H.ART_SETS)) worst = Math.max(worst, line(set.name, set.items));
    console.log(`largest set: ×${worst.toFixed(2)}`);
    let relic = 0;
    for (const a of Object.values(H.ARTIFACTS).filter(x => x.rank === 'relic')) relic = Math.max(relic, line(a.name, [a.id]));
    console.log(`largest relic: ×${relic.toFixed(2)}`);
  },
  estimate() {
    const rows = estimateCheck();
    let err = 0, wrong = 0;
    for (const r of rows) {
      const d = Math.abs(r.est - r.real);
      err += d;
      if (r.estWin !== (r.win >= 0.5)) wrong++;
      console.log(`${r.faction.padEnd(8)} foe ×${String(r.share).padEnd(4)} tiers ${r.top}: estimate loss ${pct(r.est)} ${r.estWin ? 'win ' : 'lose'}, full battle loss ${pct(r.real)}, wins ${pct(r.win)}, error ${pct(d)}`);
    }
    console.log(`mean loss error ${pct(err / rows.length)}, wrong winner ${wrong} of ${rows.length}`);
  },
  ai() {
    const list = (opt('map', 'ford,mesha,chasha')).split(','), jobs = +opt('jobs', 3), cap = +opt('days', 200), difficulty = opt('difficulty', 'normal');
    const tasks = [];
    for (const id of list) {
      const lines = AI_LINEUPS[id];
      for (let i = 0; i < SEEDS; i++) tasks.push({ id, seed: 1000 + i, lineup: id.startsWith('rmg:') ? rmgLineup(id, 1000 + i) : lines[i % lines.length], cap, difficulty });
    }
    console.log(`ai: ${tasks.length} games, ${jobs} processes, day cap ${cap}`);
    const results = [];
    let next = 0, running = 0;
    const report = () => {
      for (const id of list) {
        const rows = results.filter(r => r.id === id), done = rows.filter(r => r.winner != null), err = rows.filter(r => r.error);
        const by = f => done.filter(r => r.faction === f).length, days = done.map(r => r.days).sort((a, b) => a - b);
        const turn = rows.reduce((t, r) => t + r.total, 0) / Math.max(1, rows.reduce((t, r) => t + r.turns, 0));
        console.log(`${id}: ${rows.length} games, finished ${done.length}, errors ${err.length}, stalled ${rows.length - done.length - err.length}; wins Лига ${by('league')}, Курганы ${by('barrows')}, Чаща ${by('thicket')}, Прилив ${by('tide')}, Горнила ${by('forge')}, Престол ${by('throne')}; days median ${days[days.length >> 1] || 0}, min ${days[0] || 0}, max ${days[days.length - 1] || 0}; turn mean ${turn.toFixed(1)} ms, slowest ${Math.max(0, ...rows.map(r => r.slowest)).toFixed(0)} ms`);
        const sum = k => rows.reduce((t, r) => t + (r[k] || 0), 0), slow = rows.reduce((a, b) => (b.slowest > a.slowest ? b : a), rows[0]);
        console.log(`  slowest turn: seed ${slow.seed} ${slow.lineup}, day ${slow.slowDay}, player ${slow.slowPlayer}, ${slow.slowest.toFixed(0)} ms`);
        if (rows.length && rows[0].open) console.log(`  cells walked per game: ${pct(rows.reduce((t, r) => t + r.walked / r.open, 0) / rows.length)} of open ground`);
        console.log(`  per game: contracts ${(sum('deals') / rows.length).toFixed(1)}, sieges ${(sum('sieges') / rows.length).toFixed(1)}, walls taken ${(sum('fortFalls') / rows.length).toFixed(1)}, caravans ${(sum('caravans') / rows.length).toFixed(1)}, heroes with machines ${(sum('machines') / rows.length).toFixed(1)}, retreats ${(sum('fled') / rows.length).toFixed(1)}, water battles ${(sum('decks') / rows.length).toFixed(1)}`);
        const visits = {};
        for (const r of rows) for (const [k, v] of Object.entries(r.visits)) visits[k] = (visits[k] || 0) + v;
        const placed = new Set(defOf(id, 1000, id.startsWith('rmg:') ? rmgLineup(id, 1000) : AI_LINEUPS[id][0]).map.objs.map(o => o.t));
        const unused = [...placed].filter(k => H.OBJ_VISIT[H.OBJ[k].kind] && !H.OBJ[k].gate && H.OBJ[k].kind !== 'lore' && !visits[k]);
        console.log(`  kinds placed ${placed.size}, used by the AI ${Object.keys(visits).length}; never used: ${unused.join(' ') || 'none'}; heart found ${rows.filter(r => r.heartFound).length}, won by the heart ${rows.filter(r => r.why === 'heart').length}`);
        if (args.includes('--visits')) console.log('  visits per game: ' + Object.entries(visits).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (v / rows.length).toFixed(1)).join(', '));
        for (const r of err.slice(0, 5)) console.log('  ERROR seed ' + r.seed + ': ' + r.error);
        for (const r of rows.filter(q => q.winner == null && !q.error).slice(0, 5)) console.log(`  STALL seed ${r.seed} ${r.lineup}: day ${r.days}, players left ${r.alive}, buildings ${r.built.join('/')}, hero levels ${r.heroes.join(',')}`);
      }
    };
    return new Promise(done => {
      const launch = () => {
        while (running < jobs && next < tasks.length) {
          const t = tasks[next++], child = fork(__filename, ['aiworker', JSON.stringify(t)]);
          running++;
          child.on('message', m => results.push(m));
          child.on('exit', () => {
            running--;
            if (next >= tasks.length && !running) {
              report();
              done();
            } else launch();
          });
        }
      };
      launch();
    });
  },
  rmg() {
    const sizes = opt('sizes', '48,80,112,144').split(',').map(Number), list = opt('templates', Object.keys(H.Rmg.TEMPLATES).join()).split(','), jobs = +opt('jobs', 3), seeds = +opt('seeds', 1000);
    const tasks = [];
    for (const template of list) for (const w of sizes) if (H.Rmg.playersFor(template, w).length) tasks.push({ template, w, seeds });
    console.log(`rmg: ${tasks.length} template and size pairs, ${seeds} maps each, ${jobs} processes`);
    const rows = [];
    return new Promise(done => {
      let next = 0, running = 0;
      const launch = () => {
        while (running < jobs && next < tasks.length) {
          const child = fork(__filename, ['rmgworker', JSON.stringify(tasks[next++])]);
          running++;
          child.on('message', m => {
            rows.push(m);
            const reasons = Object.entries(m.reasons).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => v + ' ' + k).join('; ');
            console.log(`${m.template} ${m.w}: passed ${m.passed}/${m.seeds}, first try ${m.first}, most tries ${m.triesMax}, ms mean ${m.mean.toFixed(0)} max ${m.slowest.toFixed(0)}, objects ${m.objects.toFixed(0)}, zones ${m.zones.toFixed(1)}, days to nearest start min ${m.daysMin.toFixed(1)} mean ${m.daysMean.toFixed(1)}${reasons ? ' | ' + reasons : ''}`);
            for (const s of m.failed.slice(0, 3)) console.log('  FAILED seed ' + s);
          });
          child.on('exit', () => {
            running--;
            if (next >= tasks.length && !running) {
              const all = rows.reduce((t, r) => t + r.passed, 0), of = rows.reduce((t, r) => t + r.seeds, 0), first = rows.reduce((t, r) => t + r.first, 0);
              console.log(`total: passed ${all}/${of}, first try ${first}, slowest ${Math.max(...rows.map(r => r.slowest)).toFixed(0)} ms`);
              done();
            } else launch();
          });
        }
      };
      launch();
    });
  },
  rmgworker() {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const t = JSON.parse(args[args.indexOf('rmgworker') + 1]), counts = H.Rmg.playersFor(t.template, t.w), T = H.Rmg.TEMPLATES[t.template];
    const out = { template: t.template, w: t.w, seeds: t.seeds, passed: 0, first: 0, triesMax: 0, mean: 0, slowest: 0, objects: 0, zones: 0, daysMin: Infinity, daysMean: 0, reasons: {}, failed: [] };
    let daysSum = 0, daysCount = 0;
    for (let k = 0; k < t.seeds; k++) {
      const n = counts[k % counts.length], factions = ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'random'];
      const o = { template: t.template, w: t.w, levels: k % 3 === 2 ? 2 : 1, water: T.sea ? 'many' : ['none', 'few', 'many'][k % 3], neutrals: Object.keys(H.Rmg.STRENGTH)[k % 4], seed: 1000 + k * 7919, players: Array.from({ length: n }, (_, i) => ({ faction: factions[(i + k) % 3] })) };
      const t0 = process.hrtime.bigint(), r = H.Rmg.make(o), ms = Number(process.hrtime.bigint() - t0) / 1e6;
      out.mean += ms / t.seeds;
      out.slowest = Math.max(out.slowest, ms);
      out.triesMax = Math.max(out.triesMax, r.tries);
      for (const l of r.log) {
        const key = l.why.replace(/\d+/g, '#').slice(0, 44);
        out.reasons[key] = (out.reasons[key] || 0) + 1;
      }
      if (!r.doc) {
        out.failed.push(o.seed);
        continue;
      }
      out.passed++;
      if (r.tries === 1) out.first++;
      out.objects += r.doc.map.objs.length / t.seeds;
      out.zones += r.meta.zones / t.seeds;
      if (T.sea || T.under) continue;
      for (const d of H.Rmg.startDays(r.doc, r.meta)) {
        out.daysMin = Math.min(out.daysMin, d);
        daysSum += d;
        daysCount++;
      }
    }
    if (daysCount) out.daysMean = daysSum / daysCount;
    else out.daysMin = 0;
    process.send(out);
    process.disconnect();
  },
  aiworker() {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const t = JSON.parse(args[args.indexOf('aiworker') + 1]);
    process.send(aiGame(t.id, t.seed, t.lineup, t.cap, t.difficulty));
    process.disconnect();
  },
  magic() {
    console.log(`magic: heroes of the same level with equal armies of different peoples, ${SEEDS} seeds, sides swapped every other seed`);
    for (const [first, second] of [['captain', 'noyon'], ['magister', 'noyon'], ['shaman', 'captain'], ['magister', 'shaman']]) {
      const cells = MAGIC_LEVELS.map(level => {
        const r = magicDuel(first, second, level);
        return `${level}: ${pct(r.win)} (${r.rounds.toFixed(0)} rounds, ${r.casts.toFixed(0)} casts)`;
      });
      console.log(`${first} against ${second}: ` + cells.join(', '));
    }
  },
  even() {
    const L = byTier(opt('a', 'league')), K = byTier(opt('b', 'barrows'));
    console.log(`even: how many of the second people (share of equal cost) win half the duels, ${SEEDS} seeds per step`);
    for (let i = 0; i < Math.min(L.length, K.length); i++) {
      let lo = 0.4, hi = 2.5;
      for (let k = 0; k < 9; k++) {
        const mid = (lo + hi) / 2;
        if (duel(L[i], K[i], mid).win > 0.5) lo = mid;
        else hi = mid;
      }
      const m = (lo + hi) / 2, cost = H.UNITS[K[i]].cost;
      console.log(`T${H.UNITS[L[i]].tier} ${L[i]} vs ${K[i]}: equal at ×${m.toFixed(2)}, fair cost of ${K[i]} ≈ ${Math.round(cost / m)} (now ${cost})`);
    }
  },
  econ() {
    const weeks = +opt('weeks', 8);
    console.log(`econ: one town, no enemies, ${weeks} weeks; mines: sawmill and ore mine day 1, gold mine day 3, rare mines days 6 and 12; finds a week: 1500 gold, 4 wood, 4 ore, 2 of the first rare`);
    for (const f of ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne']) econRun(f, weeks);
  },
  duel() {
    const L = byTier('league'), K = byTier('barrows'), NAME = { league: 'Лига', barrows: 'Курганы', thicket: 'Чаща', tide: 'Прилив', forge: 'Горнила', throne: 'Престол' };
    console.log(`duel: equal cost ${BUDGET * 0.6}–${BUDGET * 1.4} gold, ${SEEDS} seeds per pair, sides swapped every other seed`);
    for (const [fa, fb] of [['league', 'barrows'], ['thicket', 'league'], ['thicket', 'barrows'], ['tide', 'league'], ['tide', 'barrows'], ['tide', 'thicket'], ['forge', 'league'], ['forge', 'barrows'], ['forge', 'thicket'], ['forge', 'tide'], ['throne', 'league'], ['throne', 'barrows'], ['throne', 'thicket'], ['throne', 'tide'], ['throne', 'forge']]) for (let i = 0; i < 7; i++) {
      const A = byTier(fa), Z = byTier(fb), a = Math.round(BUDGET / H.UNITS[A[i]].cost), b = Math.round(BUDGET / H.UNITS[Z[i]].cost), r = duel(A[i], Z[i]);
      console.log(`T${H.UNITS[A[i]].tier} ${H.UNITS[A[i]].name} ×${a} vs ${H.UNITS[Z[i]].name} ×${b}: ${NAME[fa]} ${pct(r.win)}, раундов ${r.rounds.toFixed(1)}, у победителя осталось ${pct(r.kept)}`);
    }
    if (args.includes('--all')) {
      const ids = [...L, ...K];
      console.log('\nmatrix (row wins vs column):');
      console.log(''.padEnd(16) + ids.map(id => id.slice(0, 7).padStart(8)).join(''));
      for (const a of ids) console.log(a.padEnd(16) + ids.map(b => (a === b ? '-' : pct(duel(a, b).win)).padStart(8)).join(''));
    }
  }
};

const mode = args.find(a => modes[a]) || 'duel';
const t0 = Date.now();
Promise.resolve(modes[mode]()).then(() => {
  if (!mode.endsWith('worker')) console.log(`time ${((Date.now() - t0) / 1000).toFixed(1)} s`);
});
