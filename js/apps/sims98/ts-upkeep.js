(function (S) {
  'use strict';
  const BREAK_BASE = 0.004, BREAK_PRICE = 600, CLUMSY_BREAK = 2, TRASH_FULL = 6, SNACK_TRASH = 0.5, TOILET_DIRTY = 8, DISHES_DIRTY = 3;
  const DIRTY_AT = 6, FILTHY_AT = 14, PUDDLE_SCORE = 4, TRASH_SCORE = 4, TOILET_SCORE = 2, BROKEN_MANY = 3, PUDDLES_MAX = 12;
  const LEAK_EVERY = 90, LEAK_MAX = 3, SHOCK_BASE = 0.3, SHOCK_LEVEL = 0.03, SHOCK_FLOOR = 0.02, REPAIR_LEVEL = 0.06, REPAIR_FLOOR = 0.35;
  const URGE_NEAT = 0.8, URGE_OTHER = 0.2, MOP_REACH = 0.8;
  const BREAKS = { toilet: 'clog', shower: 'cold', bathtub: 'cold', kitchen_sink: 'leak', bath_sink: 'leak', stove: 'dead', tv: 'dead', computer: 'dead', stereo: 'dead' };
  const BROKEN_TEXT = { clog: 'Засор', cold: 'Нет горячей воды', leak: 'Течёт', dead: 'Не включается' };
  const ELECTRIC = new Set(['tv', 'computer', 'stereo', 'stove']);
  const SNACKS = new Set(['fridge_snack', 'fridge_cold', 'sneak_snack', 'veggie_snack']);
  const MEALS = new Set(['eat_meal', 'eat_leftovers']);
  const DUTY = { wash_dishes: 4, trash_out: 6, scrub_toilet: 5, repair: 4 };
  const CHORES = new Set(['wash_dishes', 'trash_out', 'scrub_toilet', 'mop']);
  const BREAKABLE = Object.keys(BREAKS);

  S.ADS.repair = { id: 'repair', objs: BREAKABLE, name: 'Починить', icon: 'skills', age: 'teen', when: 'broken', wants: { fun: 3 }, steps: [{ pose: 'front', clip: 'use', mins: 50, repair: true }] };
  S.ADS.wash_dishes = { id: 'wash_dishes', obj: 'kitchen_sink', name: 'Помыть посуду', icon: 'wash', age: 'child', when: 'dishes', wants: { fun: 2 }, steps: [{ pose: 'front', clip: 'wash', mins: 12, loop: 'water', chore: 'dishes' }] };
  S.ADS.trash_out = { id: 'trash_out', obj: 'trash', name: 'Вынести мусор', icon: 'cook', age: 'child', when: 'trashFull', wants: { fun: 2 }, steps: [{ pose: 'front', clip: 'use', mins: 4, chore: 'trash' }] };
  S.ADS.scrub_toilet = { id: 'scrub_toilet', obj: 'toilet', name: 'Вымыть унитаз', icon: 'wash', age: 'child', when: 'dirtyToilet', wants: { fun: 2 }, steps: [{ pose: 'front', clip: 'wash', mins: 10, chore: 'toilet' }] };
  S.ADS.mop = { id: 'mop', name: 'Вытереть лужу', icon: 'wash', age: 'child', player: true, steps: [{ spot: true, clip: 'wash', mins: 8, chore: 'puddle' }] };
  S.OBJECTS.kitchen_sink.ads.push('wash_dishes');
  S.OBJECTS.trash.ads.push('trash_out');
  S.OBJECTS.toilet.ads.push('scrub_toilet');
  for (const model of BREAKABLE) S.OBJECTS[model].ads.push('repair');
  S.Skills.SOURCES.repair = ['handiness', 1.5, 0];
  S.UPGRADES.unbreakable = { id: 'unbreakable', name: 'Неломающийся', models: BREAKABLE, level: 3, cost: 70, electric: false, text: 'Эта вещь больше не ломается.', order: 8 };
  S.UPGRADES.selfClean = { id: 'selfClean', name: 'Самоочищающийся', models: ['toilet', 'shower', 'bathtub'], level: 5, cost: 110, electric: true, text: 'Грязь больше не копится.', order: 9 };

  const upkeepOf = lot => lot.upkeep || (lot.upkeep = { dishes: 0, trash: 0, dirt: {}, puddles: [], broken: {}, leaks: {}, gone: [] });
  const indexOf = (lot, item) => lot.house.items.indexOf(item);
  const hasUp = (item, id) => !!(item && item.up && item.up.includes(id));
  const atHome = sim => !!sim.home && sim.lot === sim.home && !sim.inside && !sim.car;
  const MOP_STEPS = [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [0, 0]];
  const freeAt = (lot, floor, x, z) => lot.nav.isFree(floor, Math.floor(x - lot.x), Math.floor(z - lot.z));
  const now = world => world.day * 1440 + world.clock;
  const reflag = (world, item) => {
    if (world.reflag) world.reflag.add(item);
  };

  S.WHEN = S.WHEN || {};
  S.WHEN.broken = (world, lot, item) => !!(lot.upkeep && lot.upkeep.broken[indexOf(lot, item)]);
  S.WHEN.dishes = (world, lot) => !!(lot.upkeep && lot.upkeep.dishes >= 1);
  S.WHEN.trashFull = (world, lot) => !!(lot.upkeep && lot.upkeep.trash >= TRASH_FULL / 2);
  S.WHEN.dirtyToilet = (world, lot, item) => !!(lot.upkeep && (lot.upkeep.dirt[indexOf(lot, item)] || 0) >= TOILET_DIRTY / 2);

  S.Upkeep = {
    BREAKS, BROKEN_TEXT, ELECTRIC, TRASH_FULL, TOILET_DIRTY, DIRTY_AT, FILTHY_AT, BREAKABLE, CHORES,

    of: upkeepOf,

    brokenKind(lot, item) {
      return lot.upkeep ? lot.upkeep.broken[indexOf(lot, item)] || null : null;
    },

    blocks(lot, item, ad) {
      if (item.gone) return true;
      const kind = S.Upkeep.brokenKind(lot, item);
      return (kind === 'dead' || kind === 'clog') && ad.id !== 'repair';
    },

    breakChance(world, sim, lot, item) {
      const model = S.baseOf(item), object = S.objectOf(item);
      if (!BREAKS[model] || !object || hasUp(item, 'unbreakable')) return 0;
      return BREAK_BASE * Math.sqrt(BREAK_PRICE / Math.max(100, object.price)) * (sim && S.Traits.has(sim, 'clumsy') ? CLUMSY_BREAK : 1);
    },

    breakItem(world, lot, item, why) {
      const model = S.baseOf(item), kind = BREAKS[model], u = upkeepOf(lot), index = indexOf(lot, item);
      if (!kind || u.broken[index] || item.gone) return false;
      u.broken[index] = kind;
      if (kind === 'leak') u.leaks[index] = now(world) + LEAK_EVERY;
      world.events.push({ type: 'upkeep', lot: lot.index, broke: true, text: 'Сломалось: ' + S.modelName(model).toLowerCase() + ' (' + BROKEN_TEXT[kind].toLowerCase() + ')' + (why ? ', ' + why : '') });
      return true;
    },

    fix(world, lot, item) {
      const u = upkeepOf(lot), index = indexOf(lot, item);
      if (!u.broken[index]) return false;
      delete u.broken[index];
      delete u.leaks[index];
      return true;
    },

    brokenItems(lot) {
      const u = lot.upkeep;
      if (!u) return [];
      return Object.keys(u.broken).map(i => lot.house.items[+i]).filter(item => item && !item.gone);
    },

    take(world, lot, item) {
      if (item.gone) return false;
      const u = upkeepOf(lot), index = indexOf(lot, item);
      item.gone = true;
      if (!u.gone.includes(index)) u.gone.push(index);
      delete u.broken[index];
      delete u.leaks[index];
      reflag(world, item);
      return true;
    },

    giveBack(world, lot, item) {
      if (!item.gone) return false;
      const u = upkeepOf(lot), index = indexOf(lot, item);
      item.gone = false;
      u.gone = u.gone.filter(i => i !== index);
      reflag(world, item);
      return true;
    },

    actDone(world, sim, act) {
      if (!act.ad || act.listen || act.lot < 0) return;
      const lot = world.lots[act.lot], item = act.item >= 0 ? lot.house.items[act.item] : null, u = upkeepOf(lot), model = item ? S.baseOf(item) : null;
      if (act.ad === 'toilet_use' && item && !hasUp(item, 'selfClean')) u.dirt[act.item] = (u.dirt[act.item] || 0) + 1;
      if (act.ad === 'cook_meal' || act.ad === 'grill_cook') u.trash = Math.min(TRASH_FULL * 2, u.trash + 1);
      if (SNACKS.has(act.ad)) u.trash = Math.min(TRASH_FULL * 2, u.trash + SNACK_TRASH);
      if (MEALS.has(act.ad) && act.food) u.dishes++;
      if (!item || !BREAKS[model] || act.failed) return;
      if (u.broken[act.item] === 'cold' && (act.ad === 'shower_take' || act.ad === 'bath_take')) S.Moods.add(sim, 'coldShower', 0, world);
      if (act.ad === 'repair' || u.broken[act.item]) return;
      if (S.roll(world.rng) < S.Upkeep.breakChance(world, sim, lot, item)) S.Upkeep.breakItem(world, lot, item, S.Traits.has(sim, 'clumsy') ? sim.name + ' неловко задели' : '');
    },

    accident(world, sim) {
      if (!atHome(sim)) return;
      S.Upkeep.addPuddle(world, sim.home, sim.x, sim.z, sim.floor, -1);
    },

    addPuddle(world, lot, x, z, floor, from) {
      const u = upkeepOf(lot);
      if (u.puddles.length >= PUDDLES_MAX) return false;
      u.puddles.push([Math.round(x * 4) / 4, Math.round(z * 4) / 4, floor, from]);
      return true;
    },

    puddleNear(lot, x, z, floor) {
      const u = lot.upkeep;
      if (!u) return -1;
      let best = -1, bestD = MOP_REACH;
      u.puddles.forEach((p, i) => {
        const d = Math.hypot(p[0] - x, p[1] - z);
        if (p[2] === floor && d < bestD) {
          best = i;
          bestD = d;
        }
      });
      return best;
    },

    groundMenu(world, sim, lot, x, z, floor) {
      if (!lot || !lot.upkeep) return [];
      const i = S.Upkeep.puddleNear(lot, x, z, floor);
      if (i < 0) return [];
      return [S.Upkeep.mopOption(sim, lot, i)];
    },

    mopSpot(lot, p) {
      return MOP_STEPS.map(([dx, dz]) => [p[0] + dx, p[1] + dz]).find(([x, z]) => freeAt(lot, p[2], x, z)) || [p[0], p[1]];
    },

    mopOption(sim, lot, i) {
      const p = lot.upkeep.puddles[i], [x, z] = S.Upkeep.mopSpot(lot, p);
      return { label: 'Вытереть лужу', ad: 'mop', lot, spot: { x, z, floor: p[2], fx: p[0], fz: p[1], puddle: i, px: p[0], pz: p[1] }, closed: S.AGE_RANK[sim.age] < S.AGE_RANK.child ? 'Убирают с детского возраста' : null };
    },

    choreDone(world, sim, act, step) {
      const lot = world.lots[act.lot] || sim.home, u = upkeepOf(lot);
      if (step.chore === 'dishes') u.dishes = 0;
      if (step.chore === 'trash') u.trash = 0;
      if (step.chore === 'toilet' && act.item >= 0) u.dirt[act.item] = 0;
      if (step.chore === 'puddle' && act.spot) {
        const i = u.puddles.findIndex(p => p[0] === act.spot.px && p[1] === act.spot.pz && p[2] === (act.spot.floor || 0));
        if (i >= 0) u.puddles.splice(i, 1);
      }
      if (sim.wish) {
        S.Wishes.bump(sim, 'chores');
        S.Wishes.mark(sim, 'chore');
      }
      if (sim.skill) S.Skills.stat(world, sim, 'chores', 1);
    },

    repairMins(sim) {
      const level = S.Skills.level(sim, 'handiness');
      return Math.max(REPAIR_FLOOR, 1 - level * REPAIR_LEVEL) * (S.Traits.has(sim, 'handy') ? 0.75 : 1);
    },

    cleanMins(sim) {
      return (sim.rewards && sim.rewards.includes('quickClean') ? 0.5 : 1) * (S.Traits.has(sim, 'neat') ? 0.8 : 1);
    },

    shockChance(sim, model) {
      if (!ELECTRIC.has(model)) return 0;
      const level = S.Skills.level(sim, 'handiness');
      return Math.max(SHOCK_FLOOR, SHOCK_BASE - level * SHOCK_LEVEL) * (S.Traits.has(sim, 'handy') ? 0.3 : 1) * (S.Traits.has(sim, 'technophobe') ? 1.5 : 1);
    },

    repairDone(world, sim, act) {
      const lot = world.lots[act.lot], item = lot.house.items[act.item], model = S.baseOf(item);
      if (!S.Upkeep.brokenKind(lot, item)) return;
      if (S.roll(world.rng) < S.Upkeep.shockChance(sim, model)) {
        S.Moods.add(sim, 'shock', 0, world);
        sim.needs.hygiene = Math.max(0, sim.needs.hygiene - 15);
        act.failed = true;
        world.events.push({ type: 'upkeep', sim: sim.id, text: 'Ударило током: ' + sim.name + ' (' + S.modelName(model).toLowerCase() + ')' });
        return;
      }
      S.Upkeep.fix(world, lot, item);
      S.Moods.add(sim, 'fixedIt', 0, world);
      if (sim.skill) S.Skills.stat(world, sim, 'repairs', 1);
      if (sim.wish) S.Wishes.bump(sim, 'fix');
      if (sim.wish && ELECTRIC.has(model)) S.Wishes.bump(sim, 'daring');
      world.events.push({ type: 'upkeep', sim: sim.id, fixed: true, text: 'Починено: ' + S.modelName(model).toLowerCase() + ' (' + sim.name + ')' });
    },

    brokenMenu(world, sim, lot, item) {
      const kind = S.Upkeep.brokenKind(lot, item);
      if (kind !== 'dead' && kind !== 'clog') return null;
      const young = S.AGE_RANK[sim.age] < S.AGE_RANK.teen ? 'Чинят подростки и взрослые' : null;
      return [{ label: 'Починить', ad: 'repair', lot, item, closed: young, tip: { title: 'Починить', text: 'Около ' + Math.round(50 * S.Upkeep.repairMins(sim)) + ' мин.' + (ELECTRIC.has(S.baseOf(item)) ? ' Новичка может ударить током.' : ''), line: 'Ремонт: ' + S.Skills.level(sim, 'handiness') } }, { label: S.modelName(S.baseOf(item)), closed: 'Сломано: ' + BROKEN_TEXT[kind].toLowerCase() }];
    },

    score(lot) {
      const u = lot.upkeep;
      if (!u) return 0;
      let s = u.dishes + u.puddles.length * PUDDLE_SCORE + (u.trash >= TRASH_FULL ? TRASH_SCORE : 0);
      for (const v of Object.values(u.dirt)) if (v >= TOILET_DIRTY) s += TOILET_SCORE;
      return s;
    },

    heldMoods(world, sim) {
      const out = [], lot = sim.home;
      if (!lot || !atHome(sim) || !lot.upkeep) return out;
      const u = lot.upkeep, score = S.Upkeep.score(lot);
      if (score >= FILTHY_AT) out.push('filthy');
      else if (score >= DIRTY_AT) out.push('dirty');
      if (u.trash >= TRASH_FULL) out.push('trashSmell');
      if (Object.values(u.dirt).some(v => v >= TOILET_DIRTY)) out.push('dirtyToilet');
      if (Object.values(u.broken).includes('clog')) {
        const toilets = lot.house.items.filter(i => S.baseOf(i) === 'toilet' && !i.gone);
        if (toilets.length && toilets.every(i => u.broken[indexOf(lot, i)] === 'clog')) out.push('brokenToilet');
      }
      if (S.Upkeep.brokenItems(lot).length >= BROKEN_MANY) out.push('brokenThings');
      if (u.puddles.some(p => p[3] >= 0)) out.push('flood');
      return out;
    },

    duty(world, sim, lot, item, ad) {
      const base = DUTY[ad.id];
      if (!base || !lot || lot !== sim.home) return 0;
      const u = lot.upkeep;
      if (!u) return 0;
      const k = (S.Traits.has(sim, 'neat') ? 2 : 1) * (S.Traits.has(sim, 'slob') ? 0.1 : 1);
      if (ad.id === 'wash_dishes') return u.dishes >= DISHES_DIRTY ? (base + u.dishes / 2) * k : 0;
      if (ad.id === 'trash_out') return u.trash >= TRASH_FULL ? base * k : 0;
      if (ad.id === 'scrub_toilet') return (u.dirt[indexOf(lot, item)] || 0) >= TOILET_DIRTY ? base * k : 0;
      if (ad.id === 'repair') return u.broken[indexOf(lot, item)] ? base * (S.Traits.has(sim, 'handy') ? 2 : 1) : 0;
      return 0;
    },

    urge(world, sim) {
      const lot = sim.home, u = lot && lot.upkeep;
      if (!u || !u.puddles.length || !atHome(sim) || S.AGE_RANK[sim.age] < S.AGE_RANK.child || S.Traits.has(sim, 'slob')) return null;
      if (S.roll(world.rng) >= (S.Traits.has(sim, 'neat') ? URGE_NEAT : URGE_OTHER)) return null;
      let best = -1, bestD = Infinity;
      u.puddles.forEach((p, i) => {
        const d = Math.hypot(p[0] - sim.x, p[1] - sim.z) + Math.abs(p[2] - sim.floor) * 6;
        if (d < bestD) {
          best = i;
          bestD = d;
        }
      });
      const option = S.Upkeep.mopOption(sim, lot, best);
      return { ad: 'mop', lot: lot.index, item: -1, step: 0, phase: 'start', left: 0, auto: true, spot: option.spot };
    },

    tasks(world, lot) {
      const u = lot.upkeep, out = [];
      if (!u) return out;
      const items = lot.house.items;
      if (u.dishes >= 1) {
        const sink = items.find(i => S.baseOf(i) === 'kitchen_sink' && !i.gone);
        if (sink) out.push({ kind: 'dishes', item: sink });
      }
      if (u.trash >= 1) {
        const can = items.find(i => S.baseOf(i) === 'trash' && !i.gone);
        if (can) out.push({ kind: 'trash', item: can });
      }
      for (const [i, v] of Object.entries(u.dirt)) if (v >= 1 && items[+i] && !items[+i].gone) out.push({ kind: 'toilet', item: items[+i] });
      u.puddles.forEach(p => out.push({ kind: 'puddle', puddle: p }));
      return out;
    },

    clean(world, lot, task) {
      const u = upkeepOf(lot);
      if (task.kind === 'dishes') u.dishes = 0;
      if (task.kind === 'trash') u.trash = 0;
      if (task.kind === 'toilet') u.dirt[indexOf(lot, task.item)] = 0;
      if (task.kind === 'puddle') u.puddles = u.puddles.filter(p => p !== task.puddle);
    },

    step(world) {
      const t = now(world);
      for (const lot of world.lots) {
        const u = lot.upkeep;
        if (!u) continue;
        for (const [i, at] of Object.entries(u.leaks)) {
          if (t < at) continue;
          u.leaks[i] = t + LEAK_EVERY;
          const item = lot.house.items[+i];
          if (u.puddles.filter(p => p[3] === +i).length >= LEAK_MAX || !item) continue;
          const spot = S.Sim.placesOf(lot, item, 'front')[0], side = spot.x + (u.puddles.length % 2) * 0.5;
          S.Upkeep.addPuddle(world, lot, freeAt(lot, item.floor || 0, side, spot.z) ? side : spot.x, spot.z, item.floor || 0, +i);
        }
      }
    },

    pack(world) {
      const out = [];
      for (const lot of world.lots) {
        const u = lot.upkeep;
        if (!u) continue;
        out.push([lot.index, u.dishes, u.trash, Object.entries(u.dirt).map(([i, v]) => [+i, v]), u.puddles.map(p => p.slice()), Object.entries(u.broken).map(([i, k]) => [+i, k]), Object.entries(u.leaks).map(([i, t]) => [+i, t]), u.gone.slice()]);
      }
      return out;
    },

    unpack(world, list) {
      if (list === null || list === undefined) return null;
      if (!Array.isArray(list)) throw new Error('повреждено хозяйство');
      return list.map(r => {
        if (!Array.isArray(r) || r.length !== 8 || !world.lots[r[0]] || ![r[1], r[2]].every(Number.isFinite)) throw new Error('повреждено хозяйство участка');
        const items = world.lots[r[0]].house.items;
        for (const [i, k] of r[5]) if (!items[i] || !BROKEN_TEXT[k]) throw new Error('неизвестная поломка в файле');
        for (const i of r[7]) if (!items[i]) throw new Error('неизвестная вещь в файле');
        return r;
      });
    },

    apply(world, rows) {
      for (const lot of world.lots) {
        for (const item of lot.house.items) {
          if (item.gone) reflag(world, item);
          item.gone = false;
        }
        lot.upkeep = null;
      }
      for (const [index, dishes, trash, dirt, puddles, broken, leaks, gone] of rows || []) {
        const lot = world.lots[index], u = upkeepOf(lot);
        u.dishes = dishes;
        u.trash = trash;
        for (const [i, v] of dirt) u.dirt[i] = v;
        u.puddles = puddles.map(p => p.slice());
        for (const [i, k] of broken) u.broken[i] = k;
        for (const [i, t] of leaks) u.leaks[i] = t;
        u.gone = gone.slice();
        for (const i of gone) {
          lot.house.items[i].gone = true;
          reflag(world, lot.house.items[i]);
        }
      }
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
