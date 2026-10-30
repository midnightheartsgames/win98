const path = require('path');
const { fork } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODULES = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-adventure', 'he-ai', 'he-maps'];
for (const m of MODULES) require(path.join(ROOT, 'js/apps/heroes98', m + '.js'));
const H = globalThis.Heroes98;

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
  barrows: [['sawmill', 1], ['oremine', 1], ['goldmine', 3], ['saltworks', 6], ['saltworks', 12]]
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

const AI_LINEUPS = { ford: [['league', 'barrows'], ['barrows', 'league'], ['league', 'league'], ['barrows', 'barrows']], mesha: [['league', 'barrows', 'barrows', 'league'], ['league', 'barrows', null, null], ['league', null, null, 'barrows'], ['barrows', 'league', 'league', 'barrows']] };
const aiGame = (id, seed, lineup, dayCap, difficulty) => {
  const slots = lineup.map(f => (f ? { faction: f } : null)), def = H.Maps.build(id, { seed, slots, difficulty });
  const S = H.Adv.create(def.map, def.setup), out = { id, seed, lineup: lineup.join(), winner: null, faction: null, days: 0, slowest: 0, total: 0, turns: 0, built: [], heroes: [], towns: 0, error: null };
  try {
    while (!S.over && S.day <= dayCap) {
      const t0 = process.hrtime.bigint();
      H.AI.turn(S);
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      out.slowest = Math.max(out.slowest, ms);
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
  }
  out.built = S.map.objs.filter(o => o.t === 'town' && o.owner >= 0).map(o => o.built.length);
  out.heroes = S.heroes.filter(h => h.alive).map(h => h.level);
  out.alive = S.players.filter(p => !p.out).length;
  return out;
};

const estimateCheck = () => {
  const armyOf = (faction, budget, top) => H.FACTIONS[faction].units.slice(0, top).map(row => ({ unit: row[0], count: Math.max(1, Math.round(budget / top / H.UNITS[row[0]].cost)) }));
  const rows = [];
  for (const faction of ['league', 'barrows']) {
    for (const share of [0.25, 0.5, 0.75, 1, 1.5]) {
      for (const top of [2, 4, 6]) {
        const foe = faction === 'league' ? 'barrows' : 'league', mine = armyOf(faction, 12000, top), theirs = armyOf(foe, 12000 * share, top);
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

const modes = {
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
    const list = (opt('map', 'ford,mesha')).split(','), jobs = +opt('jobs', 20), cap = +opt('days', 200), difficulty = opt('difficulty', 'normal');
    const tasks = [];
    for (const id of list) {
      const lines = AI_LINEUPS[id];
      for (let i = 0; i < SEEDS; i++) tasks.push({ id, seed: 1000 + i, lineup: lines[i % lines.length], cap, difficulty });
    }
    console.log(`ai: ${tasks.length} games, ${jobs} processes, day cap ${cap}`);
    const results = [];
    let next = 0, running = 0;
    const report = () => {
      for (const id of list) {
        const rows = results.filter(r => r.id === id), done = rows.filter(r => r.winner != null), err = rows.filter(r => r.error);
        const by = f => done.filter(r => r.faction === f).length, days = done.map(r => r.days).sort((a, b) => a - b);
        const turn = rows.reduce((t, r) => t + r.total, 0) / Math.max(1, rows.reduce((t, r) => t + r.turns, 0));
        console.log(`${id}: ${rows.length} games, finished ${done.length}, errors ${err.length}, stalled ${rows.length - done.length - err.length}; wins Лига ${by('league')}, Курганы ${by('barrows')}; days median ${days[days.length >> 1] || 0}, min ${days[0] || 0}, max ${days[days.length - 1] || 0}; turn mean ${turn.toFixed(1)} ms, slowest ${Math.max(0, ...rows.map(r => r.slowest)).toFixed(0)} ms`);
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
  aiworker() {
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
    const L = byTier('league'), K = byTier('barrows');
    console.log(`even: how many Курганы (share of equal cost) win half the duels, ${SEEDS} seeds per step`);
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
    for (const f of ['league', 'barrows']) econRun(f, weeks);
  },
  duel() {
    const L = byTier('league'), K = byTier('barrows');
    console.log(`duel: equal cost ${BUDGET * 0.6}–${BUDGET * 1.4} gold, ${SEEDS} seeds per pair, sides swapped every other seed`);
    for (let i = 0; i < Math.min(L.length, K.length); i++) {
      const a = Math.round(BUDGET / H.UNITS[L[i]].cost), b = Math.round(BUDGET / H.UNITS[K[i]].cost), r = duel(L[i], K[i]);
      console.log(`T${H.UNITS[L[i]].tier} ${H.UNITS[L[i]].name} ×${a} vs ${H.UNITS[K[i]].name} ×${b}: Лига ${pct(r.win)}, раундов ${r.rounds.toFixed(1)}, у победителя осталось ${pct(r.kept)}`);
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
  if (mode !== 'aiworker') console.log(`time ${((Date.now() - t0) / 1000).toFixed(1)} s`);
});
