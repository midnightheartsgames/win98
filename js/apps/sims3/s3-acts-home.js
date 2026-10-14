(function (S) {
  'use strict';
  const { OBJECTS, defAct, seatSpots, bedSpots, frontTiles, adjTiles, localPos, RECIPES, SEAT_H, BED_H, clamp, TV_CHANNELS, SKILLS, SKILL_KEYS, BOOKS, MUSIC, OUTFIT_KINDS, BOOK_GENRES, GENRE_LVL, BOOK_TITLES } = S;
  const D = t => OBJECTS[t];
  const lvl = (sim, k) => sim.skillLevel(k);
  const notBroken = ob => !ob.broken || 'Сломано';
  const adultish = sim => S.ageIdx(sim.age) >= 3;
  const kidOk = sim => S.ageIdx(sim.age) >= 2;

  function* eatFood(a, sim, food) {
    const game = a.game, world = game.world;
    sim.prop = 'plate';
    const chair = game.findDiningSeat(sim);
    let plate = null;
    if (chair) {
      const spot = yield* a.sitOn(chair.ob, chair.spot);
      if (spot) {
        if (chair.table && !world.layer.surf[world.li(chair.table[0], chair.table[1], chair.ob.lv)]) {
          plate = world.placeObject('plate', chair.table[0], chair.table[1], chair.ob.r, { lot: world.lotAt(chair.table[0], chair.table[1]), lv: chair.ob.lv || 0, st: Object.assign({}, food, { eater: sim.id }) });
          game.dirtyObjs();
          sim.prop = 'fork';
        }
        a.anim('sit_eat', plate ? 'fork' : 'plate');
      }
    }
    if (!sim.seatOf) a.anim('eat_stand', 'plate');
    const R = RECIPES[food.recipe] || { hunger: 50, veg: true };
    const fill = (R.hunger || 50) * 1.6 * (food.snack ? 0.4 : 1);
    const dur = food.snack ? 5 : 22;
    let eaten = 0;
    yield* a.loop(dur, dt => {
      const g = fill * dt / dur;
      sim.addNeed('hunger', g); eaten += dt;
      if (Math.random() < dt * 0.05) a.say('m_food', 1.5);
    }, () => sim.needs.hunger >= 100 && eaten > 6);
    const q = food.q === undefined ? 2 : food.q;
    const spoiled = food.t !== undefined && game.t - food.t > 720;
    if (spoiled) sim.addMood('spoiled', game.t);
    else if (q <= 0) sim.addMood('awful_meal', game.t);
    else if (q === 1) sim.addMood('bad_meal', game.t);
    else if (q === 3) sim.addMood('good_meal', game.t);
    else if (q >= 4) sim.addMood('great_meal', game.t);
    if (food.recipe === sim.fav.food) sim.addMood('fav_food', game.t);
    if (sim.has('vegetarian') && RECIPES[food.recipe] && !RECIPES[food.recipe].veg) sim.addMood('ate_meat', game.t);
    if (food.recipe === 'ambrosia') game.ambrosia(sim);
    a.note({ k: 'eat', r: food.recipe, q });
    if (plate) {
      const id = plate.id, px = plate.x, py = plate.y, r = plate.r, pl = plate.lv || 0;
      world.removeObject(id);
      world.placeObject('dirty_plate', px, py, r, { lot: world.lotAt(px, py), lv: pl });
      game.dirtyObjs();
    } else if (!food.snack) {
      game.dropDirtyPlate(sim);
    }
    sim.prop = null;
    yield* a.standUp();
  }

  function mealQuality(game, sim, R, station) {
    const L = lvl(sim, 'cooking') + (sim.has('natural_cook') ? 1.5 : 0) + (station && D(station.t).stove === 2 ? 1 : 0);
    let q = 2 + (L - R.lvl) * 0.6 + (Math.random() - 0.5) * 1.6;
    if (sim.hasMood('fascinated')) q += 0.3;
    if (sim.mood > 40) q += 0.4; else if (sim.mood < -20) q -= 0.5;
    if (sim.stats.greatMeals >= 25) q = Math.max(q, 3);
    if (sim.has('perfectionist')) q += 0.4;
    return clamp(Math.round(q), 0, 5);
  }

  function* cookRecipe(a, sim, station, opt) {
    const game = a.game, world = game.world;
    const R = RECIPES[opt.recipe];
    const group = !!opt.group;
    const servings = group ? Math.max(2, Math.min(8, game.householdOnLot(sim).length + 1)) : 1;
    const cost = Math.round(R.cost * (group ? 1 + servings * 0.3 : 1));
    if (!game.spend(sim, cost, 'Продукты')) { a.think('m_money', 3); return; }
    for (const ing of R.ing) game.useIngredient(sim, ing);
    const fridge = station && D(station.t).fridge ? station : game.nearestObj(sim, o => D(o.t).fridge, 20);
    if (fridge) {
      if (!(yield* a.walkToObj(fridge, 'front'))) return;
      a.anim('fridge'); game.sound('fridge', sim);
      yield* a.wait(1.2);
    }
    const counter = game.nearestObj(sim, o => D(o.t).counter && !world.layer.surf[world.idx(o.x, o.y)], 15);
    const speed = sim.has('perfectionist') ? 1.3 : 1;
    if (counter && !a.cancelled) {
      if (yield* a.walkToObj(counter, 'front')) {
        a.anim('stand_chop', 'knife'); game.sound('chop', sim);
        yield* a.loop(R.prep * 0.35 * speed, dt => game.gainSkill(sim, 'cooking', 0.9 * dt));
      }
    }
    let stove = null;
    if (R.cook === 'stove') stove = game.nearestObj(sim, o => D(o.t).stove && !o.broken, 18);
    if (R.cook === 'grill') stove = station && D(station.t).grill ? station : game.nearestObj(sim, o => D(o.t).grill, 25);
    if (R.cook !== 'none') {
      if (!stove) { a.think('m_route', 3); return; }
      if (!(yield* a.walkToObj(stove, 'front'))) return;
      a.anim('stand_cook', 'pan'); game.sound('sizzle', sim);
      stove.st.cooking = true;
      let fire = false;
      const L = lvl(sim, 'cooking') + (sim.has('natural_cook') ? 2 : 0);
      let risk = Math.max(0, 0.0045 - L * 0.0008) * (D(stove.t).fire || 1) * (R.flambe ? 2.5 : 1);
      if (sim.has('unlucky')) risk *= 1.6;
      if (sim.has('lucky')) risk *= 0.5;
      if (R.flambe && L < 10) risk = Math.max(risk, 0.0012);
      yield* a.loop(R.prep * 0.65 * speed, dt => {
        game.gainSkill(sim, 'cooking', 1.3 * dt);
        if (!fire && Math.random() < risk * dt * (game.fireDisabled ? 0 : 1)) fire = true;
      }, () => fire);
      stove.st.cooking = false;
      if (fire) {
        game.startFire(stove.x, stove.y, sim, stove.lv || 0);
        return;
      }
      stove.dirt = Math.min(100, (stove.dirt || 0) + 12);
    }
    if (a.cancelled) return;
    const q = mealQuality(game, sim, R, stove);
    sim.stat('meals');
    if (q >= 4) sim.stat('greatMeals');
    sim.recipes[opt.recipe] = (sim.recipes[opt.recipe] || 0) + 1;
    if (sim.has('natural_cook')) sim.addMood('cooking_joy', game.t);
    if (sim.has('perfectionist') && q <= 2) sim.addMood('not_perfect', game.t);
    a.note({ k: 'cook', r: opt.recipe, q });
    game.fx('text', sim, S.QUALITY[q]);
    const near = stove || counter || sim;
    const nearLv = near.lv !== undefined ? near.lv : sim.lv || 0;
    const spot = game.freeSurfaceNear(near.x !== undefined ? near.x : Math.floor(sim.x), near.y !== undefined ? near.y : Math.floor(sim.y), 6, nearLv);
    const food = { recipe: opt.recipe, q, t: game.t, by: sim.id };
    if (group && spot) {
      const pl = world.placeObject('platter', spot[0], spot[1], 0, { lot: world.lotAt(spot[0], spot[1]), lv: nearLv, st: Object.assign({ servings }, food) });
      game.dirtyObjs();
      a.anim('idle', null);
      a.say('m_food', 2);
      game.callToMeal(sim, pl);
      yield* a.wait(0.5);
      pl.st.servings--;
      if (pl.st.servings <= 0) game.platterEmpty(pl);
    }
    yield* eatFood(a, sim, food);
  }

  defAct('sit', {
    name: 'Сесть', icon: 'b_seat', cat: 'sit', soft: true,
    test: (sim, ob) => sim.age !== 'baby' || 'Нельзя',
    ad: { energy: 3, fun: 1 },
    run: function* (a, sim, ob) {
      const spot = yield* a.sitOn(ob);
      if (!spot) return;
      const max = a.user ? 720 : 20 + Math.random() * 40;
      yield* a.loop(max, dt => { sim.addNeed('energy', 0.02 * dt * (D(ob.t).seat || 2)); });
      yield* a.standUp();
    }
  });

  defAct('nap', {
    name: 'Вздремнуть', icon: 'n_energy', cat: 'nap', soft: true,
    test: (sim, ob) => sim.age !== 'baby' || 'Нельзя',
    ad: { energy: 45 }, adFn: (sim) => sim.needs.energy < 20 ? 1 : 0.4,
    run: function* (a, sim, ob) {
      const d = D(ob.t);
      let spot;
      if (d.bed) {
        const spots = bedSpots(ob);
        spot = spots.find(s => a.reserve(ob, 'bed' + s.i));
        if (!spot) { a.ok = false; return; }
        if (!(yield* a.walkToObj(ob, 'adj'))) return;
        yield* a.glideIn(spot.pos[0], spot.pos[1], spot.face, 0.5);
        sim.seatOf = ob.id;
      } else {
        spot = yield* a.sitOn(ob);
        if (!spot) return;
      }
      sim.lieH = BED_H[ob.t] || 0.45;
      a.anim('lie');
      const rate = d.bed ? 0.22 + d.bed * 0.025 : 0.2;
      yield* a.loop(a.user ? 150 : 120, dt => { sim.addNeed('energy', rate * dt); if (Math.random() < dt * 0.1) a.think('m_zzz', 1); }, () => sim.needs.energy >= (a.user ? 100 : 80));
      if (!d.bed && sim.needs.energy < 50) sim.addMood('uncomfortable', a.game.t, { dur: 120 });
      sim.lieH = 0;
      a.note({ k: 'act', a: 'nap' });
      yield* a.standUp();
    }
  });

  defAct('relax', {
    name: 'Отдохнуть', icon: 'b_bed', cat: 'relax', soft: true,
    test: (sim) => sim.age !== 'baby' || 'Нельзя',
    ad: { fun: 5, energy: 5 },
    run: function* (a, sim, ob) {
      const spots = bedSpots(ob);
      const spot = spots.find(s => a.reserve(ob, 'bed' + s.i));
      if (!spot) { a.ok = false; return; }
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      yield* a.glideIn(spot.pos[0], spot.pos[1], spot.face, 0.5);
      sim.seatOf = ob.id;
      sim.lieH = BED_H[ob.t] || 0.5;
      a.anim('lie_awake');
      yield* a.loop(a.user ? 240 : 40, dt => { sim.addNeed('fun', 0.25 * dt); sim.addNeed('energy', 0.08 * dt); });
      yield* a.standUp();
    }
  });

  defAct('sleep', {
    name: 'Спать', icon: 'm_zzz', cat: 'sleep',
    test: (sim, ob) => sim.age === 'baby' ? 'Нельзя' : true,
    ad: { energy: 100 }, adFn: (sim, ob, game) => (sim.needs.energy < 10 || (game.isNight() && sim.needs.energy < 60)) ? 1.3 : sim.needs.energy > 60 ? 0.05 : 0.6,
    run: function* (a, sim, ob) {
      const game = a.game;
      const d = D(ob.t);
      const spots = bedSpots(ob);
      let spot = null;
      for (const s of spots) if (a.reserve(ob, 'bed' + s.i)) { spot = s; break; }
      if (!spot) { a.think('b_bed', 2); a.ok = false; return; }
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      if (sim.age !== 'toddler') {
        a.anim('spin'); sim.censor = true;
        yield* a.wait(0.6);
        sim.censor = false;
        sim.outfit = 'sleep';
      }
      yield* a.glideIn(spot.pos[0], spot.pos[1], spot.face, 0.6);
      sim.seatOf = ob.id;
      sim.lieH = BED_H[ob.t] || 0.5;
      a.anim('lie');
      sim.sleeping = true;
      const start = game.t;
      const rate = 0.28 + (d.bed || 4) * 0.03;
      let woken = false;
      yield* a.loop(a.user ? 900 : 900, dt => {
        sim.addNeed('energy', rate * dt * (sim.has('heavy_sleeper') ? 1.08 : 1));
        sim.addNeed('fun', 0.03 * dt);
        if (Math.random() < dt * 0.08) a.think('m_zzz', 1.2);
        if (sim.has('heavy_sleeper') && Math.random() < dt * 0.05) game.fx('snore', sim);
        if (sim.has('light_sleeper') && game.noiseAt(sim) > 0 && Math.random() < dt * 0.05) woken = true;
      }, () => woken || (sim.needs.energy >= 100 && game.t - start > 120) || game.shouldWake(sim));
      sim.sleeping = false;
      if (woken) { sim.addMood('woken', game.t); a.think('m_angry', 2); }
      else if (game.t - start >= 360 && sim.needs.energy >= 90) sim.addMood('well_rested', game.t);
      sim.lieH = 0;
      yield* a.standUp();
      if (sim.outfit === 'sleep') {
        a.anim('spin'); sim.censor = true;
        yield* a.wait(0.5);
        sim.censor = false;
        sim.outfit = 'everyday';
      }
      a.note({ k: 'act', a: 'sleep' });
    }
  });

  defAct('change_outfit', {
    name: 'Переодеться...', icon: 'm_shirt', cat: 'misc',
    test: (sim) => kidOk(sim) || 'Слишком мал',
    menu: (sim) => Object.keys(OUTFIT_KINDS).filter(k => k !== sim.outfit).map(k => ({ label: OUTFIT_KINDS[k], opt: { kind: k } })),
    run: function* (a, sim, ob, opt) {
      if (ob && ob.t) { if (!(yield* a.walkToObj(ob, 'front'))) return; }
      a.anim('spin'); sim.censor = true;
      yield* a.wait(0.6);
      sim.censor = false;
      sim.outfit = opt.kind || 'everyday';
    }
  });

  defAct('quick_meal', {
    name: 'Перекусить...', icon: 'm_food', cat: 'eat',
    test: (sim, ob) => sim.age === 'baby' || sim.age === 'toddler' ? 'Слишком мал' : true,
    menu: (sim, ob, game) => ['cereal', 'sandwich', 'salad'].map(k => ({ label: RECIPES[k].name + '  ' + S.fmtMoney(RECIPES[k].cost), opt: { recipe: k } })),
    ad: { hunger: 70 }, adFn: (sim) => sim.needs.hunger < 30 ? 1.2 : 0.6,
    autoOpt: (sim, ob, game) => ({ recipe: S.hourOf(game.t) < 11 ? 'cereal' : Math.random() < 0.5 ? 'sandwich' : 'salad' }),
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      const R = RECIPES[opt.recipe || 'sandwich'];
      if (!game.spend(sim, R.cost, 'Продукты')) { a.think('m_money', 3); return; }
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('fridge'); game.sound('fridge', sim);
      yield* a.wait(1.2);
      const counter = game.nearestObj(sim, o => D(o.t).counter, 8);
      if (counter && (yield* a.walkToObj(counter, 'front'))) {
        a.anim('stand_chop', 'knife');
        yield* a.wait(R.prep * 0.5);
        game.gainSkill(sim, 'cooking', R.prep * 0.3);
      }
      const q = clamp(mealQuality(game, sim, R, null), 1, 4);
      a.note({ k: 'cook', r: opt.recipe, q, quick: true });
      yield* eatFood(a, sim, { recipe: opt.recipe, q, t: game.t });
    }
  });

  defAct('cook', {
    name: 'Приготовить...', icon: 'sk_cooking', cat: 'cook',
    test: (sim, ob, game) => {
      if (!adultish(sim)) return 'Готовить могут только подростки и старше';
      if (!game.nearestObj(sim, o => D(o.t).stove && !o.broken, 25, ob)) return 'Нужна плита';
      return true;
    },
    menu: (sim, ob, game) => {
      const L = lvl(sim, 'cooking') + (sim.has('natural_cook') ? 1 : 0);
      const out = [];
      for (const k of Object.keys(RECIPES)) {
        const R = RECIPES[k];
        if (R.cook === 'grill' || R.cook === 'none' || R.lvl > L) continue;
        const missing = R.ing.filter(i => !game.hasIngredient(sim, i));
        out.push({ label: R.name, opt: { recipe: k, group: game.householdOnLot(sim).length > 1 }, disabled: missing.length ? 'Нужно: ' + missing.map(i => game.ingredientName(i)).join(', ') : null, sub: [
          { label: 'Для всех', opt: { recipe: k, group: true } }, { label: 'Для себя', opt: { recipe: k, group: false } }] });
      }
      return out;
    },
    ad: { hunger: 90 }, adFn: (sim, ob, game) => (sim.needs.hunger < 40 && lvl(sim, 'cooking') >= 1 ? 1 : 0.35) * (sim.has('natural_cook') ? 1.5 : 1),
    autoOpt: (sim, ob, game) => {
      const L = lvl(sim, 'cooking');
      const list = Object.keys(RECIPES).filter(k => RECIPES[k].cook === 'stove' && RECIPES[k].lvl <= L && !RECIPES[k].ing.length);
      const h = S.hourOf(game.t);
      const meal = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner';
      const pref = list.filter(k => RECIPES[k].meal === meal);
      const pick = (pref.length ? pref : list);
      return pick.length ? { recipe: pick[Math.floor(Math.random() * pick.length)], group: game.householdOnLot(sim).length > 1 } : null;
    },
    run: function* (a, sim, ob, opt) { yield* cookRecipe(a, sim, ob, opt); }
  });

  defAct('cook_grill', {
    name: 'Приготовить на гриле...', icon: 'sk_cooking', cat: 'cook',
    test: (sim) => adultish(sim) || 'Готовить могут только подростки и старше',
    menu: (sim, ob, game) => ['hotdogs', 'burgers'].filter(k => RECIPES[k].lvl <= lvl(sim, 'cooking') + 1).map(k => ({ label: RECIPES[k].name, opt: { recipe: k, group: true } })),
    ad: { hunger: 50, fun: 10 },
    autoOpt: () => ({ recipe: 'hotdogs', group: true }),
    run: function* (a, sim, ob, opt) { yield* cookRecipe(a, sim, ob, opt); }
  });

  defAct('leftovers', {
    name: 'Взять остатки', icon: 'm_food', cat: 'eat',
    test: (sim, ob) => (ob.st.left && ob.st.left.length) ? (sim.age === 'baby' || sim.age === 'toddler' ? 'Слишком мал' : true) : 'Нет остатков',
    ad: { hunger: 75 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('fridge');
      yield* a.wait(1);
      const food = ob.st.left.shift();
      if (!food) return;
      yield* eatFood(a, sim, food);
    }
  });

  defAct('snack', {
    name: 'Взять снек', icon: 'm_food', cat: 'eat',
    test: (sim) => sim.age === 'baby' || sim.age === 'toddler' ? 'Слишком мал' : true,
    ad: { hunger: 25, fun: 5 },
    run: function* (a, sim, ob) {
      if (!a.game.spend(sim, 2, 'Продукты')) return;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('fridge');
      yield* a.wait(0.8);
      a.anim('eat_stand', 'chips');
      yield* a.loop(4, dt => { sim.addNeed('hunger', 5 * dt); sim.addNeed('fun', 1 * dt); });
    }
  });

  defAct('make_coffee', {
    name: 'Сварить кофе', icon: 'm_coffee', cat: 'coffee',
    test: (sim) => adultish(sim) || 'Детям кофе нельзя',
    ad: { energy: 30 }, adFn: (sim, ob, game) => S.hourOf(game.t) > 5 && S.hourOf(game.t) < 12 ? 1 : 0.4,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('stand_wash'); a.game.sound('coffee', sim);
      yield* a.wait(1.5);
      a.anim('drink', 'cup');
      yield* a.loop(5, dt => { sim.addNeed('energy', 5 * dt); sim.addNeed('bladder', -2 * dt); });
      sim.addMood('caffeinated', a.game.t);
      a.note({ k: 'act', a: 'coffee' });
    }
  });

  defAct('use_toilet', {
    name: 'Воспользоваться', icon: 'n_bladder', cat: 'toilet',
    test: (sim, ob) => {
      if (ob.broken) return 'Засорился';
      if (sim.age === 'baby') return 'Нельзя';
      if (sim.age === 'toddler' && !(sim.tskills.potty >= 1)) return 'Малыш ещё не приучен к горшку';
      return true;
    },
    ad: { bladder: 100 }, adFn: (sim) => sim.needs.bladder < 30 ? 2 : sim.needs.bladder < 60 ? 0.8 : 0.05,
    run: function* (a, sim, ob) {
      if (!a.reserve(ob, 'use')) { a.think('n_bladder', 2); a.ok = false; return; }
      if (!(yield* a.intoObj(ob, 0, 0.05, S.dirAngle(ob.r)))) return;
      sim.sitH = SEAT_H[ob.t] || 0.42;
      a.anim('toilet'); sim.censor = true;
      yield* a.loop(15, dt => sim.addNeed('bladder', 14 * dt), () => sim.needs.bladder >= 100, { noCancel: true });
      sim.censor = false;
      a.game.sound('flush', sim);
      const d = D(ob.t);
      ob.dirt = Math.min(100, (ob.dirt || 0) + 6 * (d.dirt || 1));
      if (Math.random() < (d.breaks || 0) * (sim.has('unlucky') ? 1.6 : 1) * (ob.upg.unbreakable ? 0 : 1)) { ob.broken = true; a.game.onBroken(ob, sim); }
      sim.addNeed('hygiene', -3);
      yield* a.standUp();
      a.note({ k: 'act', a: 'toilet' });
      if (sim.has('neat') || Math.random() < 0.3) {
        const sink = a.game.nearestObj(sim, o => D(o.t).sink, 6);
        if (sink) a.game.queueFront(sim, 'wash_hands', sink, { quiet: true });
      }
    }
  });

  defAct('take_shower', {
    name: 'Принять душ', icon: 'n_hygiene', cat: 'shower',
    test: (sim, ob) => ob.broken ? 'Сломан' : S.ageIdx(sim.age) < 2 ? 'Слишком мал' : true,
    ad: { hygiene: 90 }, adFn: (sim) => sim.needs.hygiene < 40 ? 1.2 : sim.needs.hygiene > 80 ? 0.05 : 0.5,
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!a.reserve(ob, 'use')) { a.think('n_hygiene', 2); a.ok = false; return; }
      const d = D(ob.t);
      const u = d.tub ? 0.3 : 0, v = 0;
      if (!(yield* a.intoObj(ob, u, v, S.dirAngle(ob.r)))) return;
      a.changeOutfit('none', true);
      a.anim('shower'); sim.censor = true; ob.st.water = true;
      game.sound('shower', sim);
      const neat = sim.has('neat') ? 1.3 : 1;
      yield* a.loop(sim.has('perfectionist') ? 16 : 12, dt => { sim.addNeed('hygiene', 11 * neat * dt); }, () => sim.needs.hygiene >= 100);
      ob.st.water = false;
      sim.censor = false;
      sim.addMood('fresh', game.t);
      ob.dirt = Math.min(100, (ob.dirt || 0) + 8);
      if (Math.random() < (d.breaks || 0) * (ob.upg.unbreakable ? 0 : 1)) { ob.broken = true; game.onBroken(ob, sim); }
      a.anim('spin'); sim.censor = true;
      yield* a.wait(0.4);
      sim.censor = false;
      if (a.outfitBefore === 'sleep' || a.outfitBefore === 'none') a.outfitBefore = 'everyday';
      yield* a.standUp();
      a.note({ k: 'act', a: 'shower' });
    }
  });

  defAct('take_bath', {
    name: 'Принять ванну', icon: 'm_bath', cat: 'bath',
    test: (sim, ob) => ob.broken ? 'Сломана' : S.ageIdx(sim.age) < 2 ? 'Слишком мал' : true,
    ad: { hygiene: 80, fun: 15 }, adFn: (sim) => sim.needs.hygiene < 40 ? 1 : 0.2,
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!a.reserve(ob, 'use')) { a.ok = false; return; }
      if (!(yield* a.intoObj(ob, 0, 0, S.dirAngle((ob.r + 1) % 4)))) return;
      a.changeOutfit('none', true);
      sim.lieH = 0.25;
      a.anim('bath'); sim.censor = true; ob.st.water = true;
      game.sound('bath', sim);
      const t = yield* a.loop(60, dt => { sim.addNeed('hygiene', 5 * dt); sim.addNeed('fun', 0.4 * dt); sim.addNeed('energy', 0.05 * dt); }, t2 => sim.needs.hygiene >= 100 && t2 > 25 && !a.user);
      ob.st.water = false;
      sim.censor = false;
      if (t >= 20) sim.addMood('relaxing_bath', game.t);
      sim.addMood('fresh', game.t);
      sim.lieH = 0;
      yield* a.standUp();
      a.anim('spin'); sim.censor = true;
      yield* a.wait(0.4);
      sim.censor = false;
      if (a.outfitBefore === 'sleep' || a.outfitBefore === 'none') a.outfitBefore = 'everyday';
      a.note({ k: 'act', a: 'bath' });
    }
  });

  defAct('wash_hands', {
    name: 'Помыть руки', icon: 'n_hygiene', cat: 'hygiene',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { hygiene: 12 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('stand_wash');
      a.game.sound('water', sim);
      yield* a.loop(1.6, dt => sim.addNeed('hygiene', 5 * dt));
    }
  });

  defAct('brush_teeth', {
    name: 'Почистить зубы', icon: 'n_hygiene', cat: 'hygiene',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { hygiene: 15 }, adFn: (sim, ob, game) => { const h = S.hourOf(game.t); return h < 9 || h > 21 ? 1 : 0.2; },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('brush', 'brush');
      yield* a.loop(3, dt => sim.addNeed('hygiene', 5 * dt));
    }
  });

  defAct('practice_speech', {
    name: 'Репетировать речь', icon: 'sk_charisma', cat: 'skill_charisma',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { fun: 10 }, skill: 'charisma',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('mirror');
      const t = yield* a.loop(a.user ? 120 : 45, dt => { a.game.gainSkill(sim, 'charisma', 1.3 * dt); sim.addNeed('fun', 0.2 * dt); if (Math.random() < dt * 0.15) a.say(S.TOPICS[Math.floor(Math.random() * S.TOPICS.length)], 1); });
      if (t >= 20) a.note({ k: 'act', a: 'practice_speech' });
    }
  });

  defAct('admire', {
    name: 'Полюбоваться собой', icon: 'm_sparkle', cat: 'fun',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { fun: 8 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('mirror');
      yield* a.loop(6, dt => { sim.addNeed('fun', 1 * dt); a.game.gainSkill(sim, 'charisma', 0.4 * dt); });
    }
  });

  function tvSeat(game, sim, tv) {
    const world = game.world;
    const [tx, ty] = world.center(tv);
    const tl = tv.lv || 0;
    const room = world.roomAt(Math.floor(tx - 0.01), Math.floor(ty - 0.01), tl);
    let best = null, bd = 1e9;
    for (const ob of world.objectsNear(tx, ty, 7, o => D(o.t).seat && (o.lv || 0) === tl && o.t !== 'toilet' && o.t !== 'toilet_lux' && o.t !== 'chess')) {
      const [cx, cy] = world.center(ob);
      if (world.roomAt(Math.floor(cx - 0.01), Math.floor(cy - 0.01), tl) !== room) continue;
      const dx = tx - cx, dy = ty - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > 7 || dist < 1) continue;
      const fa = S.dirAngle(ob.r);
      const dot = (Math.cos(fa) * dx + Math.sin(fa) * dy) / dist;
      if (dot < 0.55) continue;
      const free = seatSpots(ob).findIndex(s => !ob.use['seat' + s.i] || ob.use['seat' + s.i] === sim.id);
      if (free < 0) continue;
      const score = dist - (D(ob.t).seat || 0) * 0.2;
      if (score < bd) { bd = score; best = ob; }
    }
    return best;
  }

  defAct('watch_tv', {
    name: 'Смотреть ТВ...', icon: 'm_tv', cat: 'tv', soft: true,
    test: (sim, ob) => ob.broken ? 'Сломан' : sim.age === 'baby' ? 'Нельзя' : true,
    menu: (sim) => TV_CHANNELS.map(c => ({ label: c.name, opt: { ch: c.k } })),
    ad: { fun: 60 }, adFn: (sim, ob) => (D(ob.t).tv || 3) / 6,
    autoOpt: (sim) => ({ ch: sim.isKid ? 'kids' : sim.has('natural_cook') ? 'cooking' : sim.has('athletic') && Math.random() < 0.4 ? 'workout' : sim.has('hopeless_romantic') ? 'romance' : Math.random() < 0.5 ? 'sports' : 'news' }),
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      const ch = TV_CHANNELS.find(c => c.k === (opt.ch || 'sports')) || TV_CHANNELS[4];
      if (ch.k === 'workout' && sim.age !== 'toddler') {
        const goals = S.frontTiles(game.world, ob);
        const far = [];
        for (const g of goals) { const x = g[0] + S.DX[ob.r], y = g[1] + S.DY[ob.r]; if (game.world.walkable(x, y, ob.lv)) far.push([x, y, ob.lv || 0]); }
        if (!(yield* a.walk(far.length ? far : goals))) return;
        a.faceObj(ob);
        ob.st.on = ch.k; game.dirtyObjs();
        a.changeOutfit('athletic', true);
        a.anim('workout');
        yield* a.loop(a.user ? 120 : 45, dt => {
          game.gainSkill(sim, 'athletic', 1.2 * dt); sim.addNeed('energy', -0.35 * dt); sim.addNeed('hygiene', -0.3 * dt);
          sim.addNeed('fun', (sim.has('athletic') ? 0.8 : 0.2) * dt);
        }, () => sim.needs.energy < -40);
        sim.stat('workoutMin', 30);
        game.workoutMoods(sim, 45);
        a.note({ k: 'act', a: 'workout' });
        return;
      }
      const seat = tvSeat(game, sim, ob);
      if (seat) { if (!(yield* a.sitOn(seat))) return; a.anim('sit_watch'); }
      else {
        const goals = S.frontTiles(game.world, ob);
        const far = [];
        for (const g of goals) for (let k = 1; k <= 2; k++) { const x = g[0] + S.DX[ob.r] * k, y = g[1] + S.DY[ob.r] * k; if (game.world.walkable(x, y, ob.lv)) far.push([x, y, ob.lv || 0]); }
        if (!(yield* a.walk(far.length ? far : goals))) return;
        a.faceObj(ob); a.anim('watch');
      }
      ob.st.on = ch.k; game.dirtyObjs();
      const q = D(ob.t).tv || 3;
      let mult = ch.fun * (sim.has('couch_potato') ? 1.4 : 1) * (sim.has('technophobe') ? 0.4 : 1) * (ch.age === 'child' && sim.isKid ? 1.4 : 1);
      if (sim.has('technophobe')) sim.addMood('techno_hate', game.t);
      if (sim.has('couch_potato')) sim.addMood('couch_bliss', game.t, { dur: 90 });
      const t = yield* a.loop(a.user ? 240 : 90, dt => {
        sim.addNeed('fun', (0.35 + q * 0.09) * mult * dt);
        if (ch.skill === 'cooking') game.gainSkill(sim, 'cooking', 0.5 * dt);
        if (ch.logic) game.gainSkill(sim, 'logic', 0.15 * dt);
        if (Math.random() < dt * 0.03) a.think(ch.romance ? 'm_heart' : ch.scary ? 'm_scared' : 'm_tv', 1.5);
      }, () => !a.user && sim.needs.fun >= 100);
      if (ch.romance && sim.isAdult && Math.random() < 0.5) sim.addMood('flirty', game.t);
      if (ch.scary && (sim.has('coward') || sim.isKid) && t > 20) sim.addMood('scared', game.t, { dur: 120 });
      if (t > 30 && sim.needs.fun > 70) sim.addMood('fun_time', game.t);
      a.note({ k: 'act', a: 'watch_tv' });
      if (!game.world.objects.has(ob.id)) return;
      const others = [...game.sims.values()].some(s => s !== sim && s.queue.length && s.queue[0].target === ob);
      if (!others && (a.user || Math.random() < 0.6)) { ob.st.on = null; game.dirtyObjs(); }
      yield* a.standUp();
    }
  });

  defAct('tv_off', {
    name: 'Выключить', icon: 'm_tv', cat: 'misc',
    test: (sim, ob) => (ob.st.on || ob.st.play) ? true : 'Не включено',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('reach'); yield* a.wait(0.3);
      ob.st.on = null; ob.st.play = null; a.game.dirtyObjs();
    }
  });
  defAct('stereo_off', { name: 'Выключить музыку', icon: 'm_note', cat: 'misc', test: (sim, ob) => ob.st.play ? true : 'Не включено', run: S.ACTS.tv_off.run });

  function computerSeat(game, ob) {
    const world = game.world;
    const base = world.surfaceBase(ob.x, ob.y, ob.lv);
    const r = base ? base.r : ob.r;
    const fx = ob.x + S.DX[r], fy = ob.y + S.DY[r];
    const chair = world.objAt(fx, fy, 'occ', ob.lv);
    if (chair && D(chair.t).seat && chair.t !== 'toilet') return chair;
    return null;
  }

  function* atComputer(a, sim, ob) {
    const game = a.game;
    if (ob.broken) return false;
    const chair = computerSeat(game, ob);
    if (!chair) { a.think('b_seat', 3); game.tip(sim, 'Поставьте стул перед столом с компьютером.'); return false; }
    if (!a.reserve(ob, 'use')) return false;
    const spot = yield* a.sitOn(chair);
    if (!spot) return false;
    a.faceObj(ob);
    a.anim('sit_type');
    ob.st.on = true; game.dirtyObjs();
    if (sim.has('technophobe')) sim.addMood('techno_hate', game.t);
    if (sim.has('computer_whiz')) sim.addMood('in_element', game.t);
    return true;
  }
  function* offComputer(a, sim, ob) {
    ob.st.on = false; a.game.dirtyObjs();
    if (Math.random() < (D(ob.t).breaks || 0) && !ob.upg.unbreakable) { ob.broken = true; a.game.onBroken(ob, sim); }
    yield* a.standUp();
  }

  const compTest = (sim, ob, game) => {
    if (ob.broken) return 'Сломан';
    if (S.ageIdx(sim.age) < 2) return 'Слишком мал';
    if (!computerSeat(game, ob)) return 'Нужен стул перед столом';
    return true;
  };

  defAct('play_games', {
    name: 'Играть в игры', icon: 'm_computer', cat: 'computer', soft: true, test: compTest,
    ad: { fun: 70 }, adFn: (sim, ob) => (D(ob.t).computer || 1) * 0.6,
    run: function* (a, sim, ob) {
      if (!(yield* atComputer(a, sim, ob))) return;
      const q = D(ob.t).computer || 1;
      yield* a.loop(a.user ? 240 : 80, dt => { sim.addNeed('fun', (0.8 + q * 0.3) * dt * (sim.has('computer_whiz') ? 1.3 : 1)); a.game.gainSkill(sim, 'logic', 0.08 * dt); }, () => !a.user && sim.needs.fun >= 100);
      a.note({ k: 'act', a: 'computer' });
      yield* offComputer(a, sim, ob);
    }
  });

  defAct('surf_web', {
    name: 'Бродить по Сети', icon: 'm_computer', cat: 'computer', soft: true, test: compTest,
    ad: { fun: 40 },
    run: function* (a, sim, ob) {
      if (!(yield* atComputer(a, sim, ob))) return;
      yield* a.loop(a.user ? 180 : 60, dt => { sim.addNeed('fun', 0.7 * dt); if (Math.random() < dt * 0.004) sim.addMood('fascinated', a.game.t); });
      yield* offComputer(a, sim, ob);
    }
  });

  defAct('chat_online', {
    name: 'Общаться в чате', icon: 'n_social', cat: 'computer', soft: true, test: compTest,
    ad: { social: 45, fun: 15 },
    run: function* (a, sim, ob) {
      if (!(yield* atComputer(a, sim, ob))) return;
      const game = a.game;
      yield* a.loop(a.user ? 180 : 60, dt => {
        sim.addNeed('social', 0.55 * dt); sim.addNeed('fun', 0.3 * dt);
        if (Math.random() < dt * 0.01) game.chatMeet(sim);
      }, () => !a.user && sim.needs.social >= 100);
      yield* offComputer(a, sim, ob);
    }
  });

  defAct('write_novel', {
    name: 'Писать книгу...', icon: 'sk_writing', cat: 'skill_writing',
    test: (sim, ob, game) => { const t = compTest(sim, ob, game); if (t !== true) return t; return S.ageIdx(sim.age) >= 3 || 'Только подростки и старше'; },
    menu: (sim) => {
      if (sim.flags.novel) return [{ label: 'Продолжить: «' + sim.flags.novel.title + '»', opt: { cont: true } }];
      const L = Math.max(1, lvl(sim, 'writing'));
      return BOOK_GENRES.map((g, i) => ({ label: g, opt: { genre: i }, disabled: GENRE_LVL[i] > L ? 'Нужно писательство ' + GENRE_LVL[i] : null }));
    },
    ad: { fun: 20 }, skill: 'writing',
    autoOpt: (sim) => ({ genre: 0, cont: !!sim.flags.novel }),
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!sim.flags.novel) {
        const title = BOOK_TITLES[Math.floor(Math.random() * BOOK_TITLES.length)];
        sim.flags.novel = { genre: opt.genre || 0, title, p: 0 };
      }
      if (!(yield* atComputer(a, sim, ob))) return;
      const nv = sim.flags.novel;
      const hours = Math.max(5, 15 - lvl(sim, 'writing')) * (D(ob.t).computer === 2 ? 0.8 : 1) * (sim.has('perfectionist') ? 1.2 : 1);
      yield* a.loop(a.user ? 300 : 90, dt => {
        nv.p += dt / (hours * 60);
        game.gainSkill(sim, 'writing', 1.3 * dt);
        sim.addNeed('fun', (sim.has('bookworm') || sim.has('artistic') ? 0.4 : 0.1) * dt);
      }, () => nv.p >= 1);
      if (nv.p >= 1) game.finishNovel(sim);
      yield* offComputer(a, sim, ob);
    }
  });

  defAct('find_job', {
    name: 'Искать работу', icon: 'm_briefcase', cat: 'misc',
    test: (sim, ob, game) => { const t = compTest(sim, ob, game); if (t !== true) return t; return S.ageIdx(sim.age) >= 3 || 'Только подростки и старше'; },
    run: function* (a, sim, ob) {
      if (!(yield* atComputer(a, sim, ob))) return;
      yield* a.wait(4);
      a.game.openJobs(sim);
      yield* offComputer(a, sim, ob);
    }
  });

  defAct('listen', {
    name: 'Слушать музыку...', icon: 'm_note', cat: 'music', soft: true,
    test: (sim) => sim.age !== 'baby' || 'Нельзя',
    menu: (sim) => MUSIC.map(g => ({ label: g, opt: { genre: g } })),
    ad: { fun: 40 },
    autoOpt: (sim) => ({ genre: sim.fav.music }),
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'near'))) return;
      ob.st.play = opt.genre || ob.st.play || sim.fav.music; game.dirtyObjs();
      a.anim('listen');
      const fav = ob.st.play === sim.fav.music ? 1.5 : 1;
      yield* a.loop(a.user ? 180 : 45, dt => sim.addNeed('fun', 0.7 * fav * (D(ob.t).stereo || 1) * dt * (sim.has('cant_stand_art') ? 0.5 : 1)), () => !a.user && sim.needs.fun >= 100);
      if (sim.has('virtuoso')) sim.addMood('music_ecstasy', game.t);
    }
  });

  defAct('dance', {
    name: 'Танцевать', icon: 'm_note', cat: 'dance', soft: true,
    test: (sim) => S.ageIdx(sim.age) >= 1 || 'Нельзя',
    ad: { fun: 55, social: 5 },
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'near'))) return;
      if (!ob.st.play) { ob.st.play = sim.fav.music; game.dirtyObjs(); }
      a.anim('dance');
      const fav = ob.st.play === sim.fav.music ? 1.4 : 1;
      yield* a.loop(a.user ? 120 : 40, dt => { sim.addNeed('fun', 1.1 * fav * dt); sim.addNeed('energy', -0.15 * dt); game.gainSkill(sim, 'athletic', 0.25 * dt); }, () => !a.user && sim.needs.fun >= 100);
      a.note({ k: 'act', a: 'dance' });
    }
  });

  defAct('lights', {
    name: (sim, ob) => ob && ob.st.off ? 'Включить свет' : 'Выключить свет', icon: 'b_lamp', cat: 'misc',
    test: () => true,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, ob.layer === 'ceil' ? 'near' : 'front'))) return;
      a.anim('reach'); yield* a.wait(0.3);
      ob.st.off = !ob.st.off; a.game.lightsChanged();
    }
  });

  defAct('read_book', {
    name: 'Почитать...', icon: 'm_book', cat: 'read', soft: true,
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Ещё не умеет читать',
    menu: () => Object.keys(BOOKS).filter(k => BOOKS[k].novel).map(k => ({ label: BOOKS[k].name, opt: { book: k } })),
    ad: { fun: 45 },
    autoOpt: () => { const l = Object.keys(BOOKS).filter(k => BOOKS[k].novel); return { book: l[Math.floor(Math.random() * l.length)] }; },
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('reach', 'book'); yield* a.wait(0.5);
      const seat = game.nearestObj(sim, o => D(o.t).seat && (o.t.startsWith('sofa') || o.t.startsWith('arm') || o.t === 'recliner' || o.t === 'loveseat' || o.t.startsWith('chair')) && seatSpots(o).some(s => !o.use['seat' + s.i]), 6);
      if (seat && (yield* a.sitOn(seat))) a.anim('sit_read', 'book');
      else a.anim('read_stand', 'book');
      const mult = sim.has('bookworm') ? 1.6 : sim.has('technophobe') ? 1.2 : 1;
      const t = yield* a.loop(a.user ? 180 : 70, dt => { sim.addNeed('fun', 0.6 * mult * dt); game.gainSkill(sim, 'writing', 0.08 * dt); }, () => !a.user && sim.needs.fun >= 100);
      if (t > 25) {
        if (sim.has('bookworm')) sim.addMood('bookworm_read', game.t);
        a.note({ k: 'act', a: 'read' });
        sim.stat('booksRead');
      }
      yield* a.standUp();
    }
  });

  defAct('study_skill', {
    name: 'Изучать навык...', icon: 'm_idea', cat: 'study',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Ещё не умеет читать',
    menu: (sim) => SKILL_KEYS.map(k => ({ label: SKILLS[k].name, opt: { skill: k }, disabled: lvl(sim, k) >= 5 ? 'Дальше только практика' : null })),
    ad: { fun: 10 },
    autoOpt: (sim) => { const l = SKILL_KEYS.filter(k => lvl(sim, k) < 5); return l.length ? { skill: l[Math.floor(Math.random() * l.length)] } : null; },
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('reach', 'book'); yield* a.wait(0.5);
      const seat = game.nearestObj(sim, o => D(o.t).seat && o.t !== 'toilet' && o.t !== 'toilet_lux' && o.t !== 'chess' && seatSpots(o).some(s => !o.use['seat' + s.i]), 6);
      if (seat && (yield* a.sitOn(seat))) a.anim('sit_read', 'book');
      else a.anim('read_stand', 'book');
      yield* a.loop(a.user ? 180 : 60, dt => { game.gainSkill(sim, opt.skill, 1.5 * dt); sim.addNeed('fun', (sim.has('bookworm') ? 0.3 : -0.05) * dt); }, () => lvl(sim, opt.skill) >= 5);
      if (Math.random() < 0.4) sim.addMood('fascinated', game.t);
      yield* a.standUp();
    }
  });

  defAct('view_art', {
    name: 'Полюбоваться', icon: 'm_palette', cat: 'art',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { fun: 12 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('look');
      const art = sim.has('artistic') ? 2 : sim.has('cant_stand_art') ? 0.2 : 1;
      yield* a.loop(8, dt => sim.addNeed('fun', 0.8 * art * dt));
      if (sim.has('artistic')) sim.addMood('inspired', a.game.t);
      if (sim.has('snob') && (D(ob.t).env || 0) >= 3) sim.addMood('snob_fancy', a.game.t, { dur: 120 });
    }
  });

  defAct('watch_fish', {
    name: 'Смотреть на рыбок', icon: 'm_fish', cat: 'art',
    test: (sim) => sim.age !== 'baby' || 'Нельзя',
    ad: { fun: 12 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('look');
      yield* a.loop(15, dt => sim.addNeed('fun', 0.7 * dt));
    }
  });

  defAct('wish_coin', {
    name: 'Бросить монетку', icon: 'm_money', cat: 'fun',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { fun: 8 },
    run: function* (a, sim, ob) {
      if (!a.game.spend(sim, 1, 'Монетка')) return;
      if (!(yield* a.walkToObj(ob, 'near'))) return;
      a.anim('throw'); yield* a.wait(1);
      const r = Math.random();
      if (r < 0.2) { sim.addMood('lucky_day', a.game.t); a.think('m_clover', 2); }
      else if (r < 0.25) { sim.addMood('unlucky_day', a.game.t); a.think('m_cloud', 2); }
      else a.think('m_star', 1.5);
    }
  });

  defAct('drink_water', {
    name: 'Попить воды', icon: 'n_hygiene', cat: 'drink',
    test: (sim) => S.ageIdx(sim.age) >= 2 || 'Слишком мал',
    ad: { hunger: 4 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('stand_wash'); yield* a.wait(1);
      sim.addNeed('bladder', -4); sim.addNeed('hunger', 2);
    }
  });

  Object.assign(S, { eatFood, mealQuality, cookRecipe, tvSeat, computerSeat });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
