(function (S) {
  'use strict';
  const { OBJECTS, defAct, ACTS, adjTiles, clamp, SKILLS, PLANTS, FISH, COLLECT, BOOKS, OUTFIT_KINDS, CAREERS, PART_TIME, RH, TER } = S;
  const D = t => OBJECTS[t];
  const lvl = (sim, k) => sim.skillLevel(k);
  const age = (sim, a) => S.ageIdx(sim.age) >= S.ageIdx(a);

  defAct('go_here', {
    name: 'Идти сюда', icon: 'm_walk', cat: 'move', ground: true,
    test: (sim) => sim.age === 'baby' ? 'Нельзя' : true,
    run: function* (a, sim, tile) {
      const w = a.game.world;
      const tl = tile[2] || 0;
      const goal = w.walkable(tile[0], tile[1], tl) ? [tile[0], tile[1], tl] : w.nearestWalkable(tile[0], tile[1], 3, null, tl);
      if (!goal) { a.think('m_route', 2); return; }
      yield* a.walk([goal], { run: a.opt.run, visit: true });
      a.game.onArriveLot(sim, w.lotAt(goal[0], goal[1]));
    }
  });
  defAct('run_here', Object.assign({}, ACTS.go_here, { key: 'run_here', name: 'Бежать сюда', run: function* (a, sim, tile) { a.opt.run = true; yield* ACTS.go_here.run(a, sim, tile); } }));

  function shoreTiles(world, tx, ty) {
    const out = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = tx + dx, y = ty + dy;
      if (!world.walkable(x, y)) continue;
      for (let k = 0; k < 4; k++) if (world.isWater(x + S.DX[k], y + S.DY[k])) { out.push([x, y, k]); break; }
    }
    return out;
  }

  defAct('fish_here', {
    name: 'Рыбачить здесь', icon: 'sk_fishing', cat: 'fish', ground: true, soft: true,
    test: (sim, tile, game) => {
      if (!age(sim, 'child')) return 'Слишком мал';
      return shoreTiles(game.world, tile[0], tile[1]).length ? true : 'Нужна вода рядом';
    },
    ad: { fun: 30 }, adFn: () => 0.4, skill: 'fishing',
    run: function* (a, sim, tile) {
      const game = a.game, world = game.world;
      const spots = shoreTiles(world, tile[0], tile[1]);
      if (!spots.length) return;
      if (!(yield* a.walk(spots.map(s => [s[0], s[1]])))) return;
      const here = spots.find(s => s[0] === Math.floor(sim.x) && s[1] === Math.floor(sim.y)) || spots[0];
      const k = here[2];
      const wx = here[0] + S.DX[k], wy = here[1] + S.DY[k];
      a.face(wx + 0.5, wy + 0.5);
      const kind = world.waterKind(wx, wy) || 'pond';
      a.anim('fish', 'rod');
      let next = 0;
      const L = () => lvl(sim, 'fishing');
      const interval = () => Math.max(6, 26 - L() * 1.8) * (sim.has('angler') ? 0.7 : 1) * (sim.stats.fishCaught >= 50 ? 0.75 : 1) * (game.isRaining && game.isRaining() ? 0.8 : 1);
      next = interval() * (0.5 + Math.random());
      let t = 0;
      yield* a.loop(a.user ? 360 : 70, dt => {
        t += dt; next -= dt;
        game.gainSkill(sim, 'fishing', 1.1 * dt);
        sim.addNeed('fun', (sim.has('angler') ? 0.8 : 0.3) * dt);
        if (next <= 0) {
          next = interval() * (0.6 + Math.random() * 0.8);
          game.catchFish(sim, kind);
        }
      });
      if (sim.has('loves_outdoors')) sim.addMood('outdoors_fresh', game.t);
    }
  });

  defAct('plant_seed', {
    name: 'Посадить...', icon: 'sk_gardening', cat: 'garden', ground: true,
    test: (sim, tile, game) => {
      if (!age(sim, 'child')) return 'Слишком мал';
      if (!sim.inv.some(i => i.k === 'seed')) return 'Нет семян';
      if (tile[2]) return 'Только на улице';
      const w = game.world;
      const t = w.ter(tile[0], tile[1]);
      if (!(t === TER.grass || t === TER.grass2 || t === TER.dirt || t === TER.flowers)) return 'Сажать можно только в землю';
      if (w.indoor(tile[0], tile[1]) || w.floorAt(tile[0], tile[1])) return 'Только на улице';
      const hh = game.hh(sim);
      if (!hh || w.lotAt(tile[0], tile[1]) !== hh.lot) return 'Только на своём участке';
      if (!w.walkable(tile[0], tile[1])) return 'Место занято';
      return true;
    },
    menu: (sim) => {
      const seen = {};
      return sim.inv.filter(i => i.k === 'seed').filter(i => { if (seen[i.p]) return false; seen[i.p] = 1; return true; }).map(i => ({ label: 'Семена: ' + (PLANTS[i.p] ? PLANTS[i.p].name : i.p === 'common' ? 'обычные' : i.p === 'uncommon' ? 'редкие' : 'особые'), opt: { seed: i.p } }));
    },
    run: function* (a, sim, tile, opt) {
      const game = a.game;
      const goals = [[tile[0] + 1, tile[1]], [tile[0] - 1, tile[1]], [tile[0], tile[1] + 1], [tile[0], tile[1] - 1]].filter(g => game.world.walkable(g[0], g[1]));
      if (!(yield* a.walk(goals))) return;
      a.face(tile[0] + 0.5, tile[1] + 0.5);
      a.anim('garden');
      yield* a.loop(4, dt => game.gainSkill(sim, 'gardening', 1.2 * dt));
      const idx = sim.inv.findIndex(i => i.k === 'seed' && i.p === opt.seed);
      if (idx < 0 || !game.world.walkable(tile[0], tile[1])) return;
      sim.inv.splice(idx, 1);
      game.plantSeed(sim, tile[0], tile[1], opt.seed);
    }
  });

  defAct('self_outfit', Object.assign({}, ACTS.change_outfit, { key: 'self_outfit', self: true, name: 'Переодеться...', run: function* (a, sim, t, opt) {
    a.anim('spin'); sim.censor = true;
    yield* a.wait(0.6);
    sim.censor = false;
    sim.outfit = opt.kind || 'everyday';
  } }));

  defAct('jog', {
    name: 'Бег трусцой', icon: 'sk_athletic', cat: 'jog', self: true, soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 20 }, adFn: (sim) => sim.has('couch_potato') ? 0.02 : sim.needs.energy < 10 ? 0.05 : 0.35, skill: 'athletic',
    run: function* (a, sim) {
      const game = a.game, world = game.world;
      a.changeOutfit('athletic', true);
      const t0 = game.t;
      const total = a.user ? 120 : 60;
      const origin = [Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0];
      const startLot = world.lotAt(origin[0], origin[1]);
      let legs = 0;
      while (game.t - t0 < total && !a.cancelled) {
        const back = legs >= 3 || game.t - t0 > total * 0.7;
        const p = back ? origin : world.nearestWalkable(origin[0] + (Math.random() - 0.5) * 24, origin[1] + (Math.random() - 0.5) * 24, 8, (x, y) => { const l = world.lotAt(x, y); return !world.indoor(x, y) && (l === -1 || l === startLot); });
        legs++;
        if (!p) break;
        const before = game.t;
        const ok = yield* a.walk([p], { run: true, noCar: true });
        const dt = game.t - before;
        game.gainSkill(sim, 'athletic', 1.3 * dt); sim.addNeed('energy', -0.3 * dt); sim.addNeed('hygiene', -0.35 * dt);
        sim.addNeed('fun', (sim.has('athletic') ? 0.8 : 0.2) * dt);
        sim.stat('jogMin', dt);
        game.note(sim, { k: 'jog_min', n: dt });
        if (!ok || back) break;
        if (sim.needs.energy < (a.user ? -50 : -15) || sim.needs.hygiene < (a.user ? -80 : -30)) break;
      }
      game.workoutMoods(sim, game.t - t0);
      a.note({ k: 'act', a: 'jog' });
      if (sim.has('loves_outdoors')) sim.addMood('outdoors_fresh', game.t);
    }
  });

  defAct('talk_self', {
    name: 'Поговорить с собой', icon: 'm_swirl', cat: 'insane', self: true,
    test: (sim) => sim.has('insane') || 'Только для сумасшедших',
    ad: { fun: 20, social: 15 },
    run: function* (a, sim) {
      a.anim('talk');
      yield* a.loop(12, dt => { sim.addNeed('social', 0.8 * dt); sim.addNeed('fun', 0.6 * dt); if (Math.random() < dt * 0.3) a.say(S.TOPICS[Math.floor(Math.random() * S.TOPICS.length)], 1); });
      sim.addMood('voices', a.game.t);
    }
  });
  defAct('evil_laugh', {
    name: 'Злобно расхохотаться', icon: 'm_horns', cat: 'mean', self: true,
    test: (sim) => sim.has('evil') || 'Только для злых',
    ad: { fun: 15 }, adFn: (sim, t, game) => game.t - ((sim.lastActs || {}).evil_laugh || -1e9) > 240 ? 0.6 : 0,
    run: function* (a, sim) {
      a.anim('evil_laugh'); a.say('m_horns', 2);
      yield* a.wait(2);
      sim.addNeed('fun', 12);
      sim.addMood('evil_joy', a.game.t, { dur: 120 });
    }
  });

  defAct('read_inv', {
    name: 'Читать...', icon: 'm_book', cat: 'read', self: true, soft: true,
    test: (sim) => sim.inv.some(i => i.k === 'book') ? (age(sim, 'child') || 'Слишком мал') : 'Нет книг',
    menu: (sim) => sim.inv.map((it, i) => it.k === 'book' ? { label: BOOKS[it.b].name + (it.read ? ' (' + Math.round(it.read * 100) + '%)' : ''), opt: { i } } : null).filter(Boolean),
    run: function* (a, sim, t, opt) {
      const game = a.game;
      const it = sim.inv[opt.i];
      if (!it || it.k !== 'book') return;
      const B = BOOKS[it.b];
      const seat = game.nearestObj(sim, o => D(o.t).seat && o.t !== 'toilet' && o.t !== 'toilet_lux' && S.seatSpots(o).some(s => !o.use['seat' + s.i]), 8);
      if (seat && (yield* a.sitOn(seat))) a.anim('sit_read', 'book'); else a.anim('read_stand', 'book');
      const mins = B.pages * 0.5;
      yield* a.loop(a.user ? 240 : 60, dt => {
        it.read = Math.min(1, (it.read || 0) + dt / mins);
        if (B.skill) {
          const L = lvl(sim, B.skill);
          if (L >= B.from && L < B.to + 1) game.gainSkill(sim, B.skill, 2.2 * dt);
        } else sim.addNeed('fun', 0.7 * dt * (sim.has('bookworm') ? 1.6 : 1));
      }, () => it.read >= 1);
      if (it.read >= 1) {
        game.note(sim, { k: 'act', a: 'read' });
        sim.stat('booksRead');
        if (sim.has('bookworm')) sim.addMood('bookworm_read', game.t);
        if (!B.skill) it.read = 0;
      }
      yield* a.standUp();
    }
  });

  defAct('guitar_inv', {
    name: 'Играть на гитаре', icon: 'sk_guitar', cat: 'skill_guitar', self: true, soft: true,
    test: (sim) => sim.inv.some(i => i.k === 'obj' && i.t === 'guitar') ? (age(sim, 'child') || 'Слишком мал') : 'Нет гитары',
    ad: { fun: 25 }, skill: 'guitar',
    run: function* (a, sim) { yield* ACTS.play_guitar.run(a, sim, null); }
  });
  defAct('tips_inv', {
    name: 'Играть за чаевые', icon: 'm_money', cat: 'skill_guitar', self: true, soft: true,
    test: (sim, t, game) => {
      if (!sim.inv.some(i => i.k === 'obj' && i.t === 'guitar')) return 'Нет гитары';
      if (lvl(sim, 'guitar') < 3) return 'Нужен навык гитары 3';
      return true;
    },
    run: function* (a, sim) { yield* ACTS.play_tips.run(a, sim, null); }
  });

  defAct('do_homework', {
    name: 'Сделать уроки', icon: 'm_book', cat: 'homework', self: true,
    test: (sim) => sim.school && sim.inv.some(i => i.k === 'homework') ? true : 'Нет домашнего задания',
    ad: { fun: 5 }, adFn: (sim, t, game) => { const h = S.hourOf(game.t); return h > 15 && h < 21 ? 1.5 : 0.3; },
    run: function* (a, sim) {
      const game = a.game;
      const seat = game.nearestObj(sim, o => (o.t === 'chair_office' || o.t.startsWith('chair') || o.t.startsWith('sofa') || o.t === 'loveseat') && S.seatSpots(o).some(s => !o.use['seat' + s.i]), 12);
      if (seat && (yield* a.sitOn(seat))) a.anim('sit_write', 'book'); else a.anim('read_stand', 'book');
      const hw = sim.inv.find(i => i.k === 'homework');
      if (!hw) return;
      const need = sim.has('genius') || sim.has('bookworm') ? 35 : 55;
      yield* a.loop(need * 1.5, dt => { hw.p = (hw.p || 0) + dt / need; sim.addNeed('fun', (sim.has('bookworm') ? 0.1 : -0.25) * dt); game.gainSkill(sim, 'logic', 0.2 * dt); }, () => hw.p >= 1);
      if (hw.p >= 1) {
        sim.inv.splice(sim.inv.indexOf(hw), 1);
        sim.school.perf = clamp(sim.school.perf + 12, -100, 100);
        sim.school.hwDone = game.day;
        sim.addMood('homework_done', game.t);
        game.note(sim, { k: 'homework' });
        game.fx('text', sim, 'Уроки сделаны!');
      }
      yield* a.standUp();
    }
  });

  defAct('go_home', {
    name: 'Пойти домой', icon: 'm_house', cat: 'move', self: true,
    test: (sim, t, game) => { const hh = game.hh(sim); return hh && hh.lot >= 0 && sim.lot !== hh.lot ? true : 'Уже дома'; },
    run: function* (a, sim) {
      const game = a.game, world = game.world;
      const lot = world.lots[game.hh(sim).lot];
      const goal = lot.doorIn && world.walkable(lot.doorIn[0], lot.doorIn[1]) ? lot.doorIn : world.nearestWalkable(lot.entrance[0], lot.entrance[1], 5);
      if (!goal) return;
      a.opt.visit = true;
      yield* a.walk([goal]);
      game.onArriveLot(sim, lot.id);
    }
  });

  defAct('visit_lot', {
    name: 'Пойти сюда', icon: 'm_map', cat: 'move', lotAct: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    run: function* (a, sim, lot) {
      const game = a.game, world = game.world;
      if (typeof lot === 'number') lot = world.lots[lot];
      const ent = lot.entrance || lot.curb;
      const goal = world.walkable(ent[0], ent[1]) ? ent : world.nearestWalkable(ent[0], ent[1], 6);
      if (!goal) return;
      a.opt.visit = true;
      const ok = yield* a.walk([goal]);
      if (ok) { game.onArriveLot(sim, lot.id); game.note(sim, { k: 'visit', lot: lot.key }); }
    }
  });

  function* rabbitVisit(a, sim, lot, mins, perMin, opt) {
    const game = a.game, world = game.world;
    opt = opt || {};
    const ent = lot.entrance;
    const goal = world.walkable(ent[0], ent[1]) ? ent : world.nearestWalkable(ent[0], ent[1], 4);
    if (!goal) return false;
    a.opt.carKind = opt.car;
    if (!(yield* a.walk([goal]))) return false;
    if (opt.until && game.t >= opt.until) return false;
    sim.hidden = true; sim.inside = lot.id; sim.insideWhat = opt.what || lot.name;
    game.onArriveLot(sim, lot.id);
    if (opt.onEnter) opt.onEnter();
    let t = 0;
    while ((opt.until ? game.t < opt.until : t < mins) && !(a.cancelled && !opt.noCancel)) {
      yield;
      t += a.dt;
      if (perMin) perMin(a.dt, t);
    }
    sim.hidden = false; sim.inside = null; sim.insideWhat = null;
    const out = world.nearestWalkable(ent[0], ent[1], 4) || ent;
    sim.x = out[0] + 0.5; sim.y = out[1] + 0.5; sim.lv = 0;
    return true;
  }

  const CLASSES = { bistro: ['cooking'], theater: ['guitar', 'painting'], cityhall: ['charisma'], science: ['logic', 'gardening'], military: ['handiness', 'athletic'], newspaper: ['writing'], stadium: ['athletic'], spa: [] };

  function rhMenu(sim, ob, game) {
    const lot = game.world.lots[ob.lot];
    const rh = lot.rh;
    const out = [];
    const job = sim.job;
    const jd = job ? (CAREERS[job.c] || PART_TIME[job.c]) : null;
    if (job && jd && jd.place === rh) out.push({ label: 'Пойти на работу', opt: { what: 'work' }, disabled: game.canGoWork(sim) ? null : 'Сейчас не рабочее время' });
    if (!job && S.isAdultish(sim.age)) for (const c of S.CAREER_KEYS) if (CAREERS[c].place === rh) out.push({ label: 'Устроиться: ' + CAREERS[c].name, opt: { what: 'join', c } });
    if ((sim.age === 'teen' || sim.age === 'elder') && !job) for (const c of Object.keys(PART_TIME)) if (PART_TIME[c].place === rh) out.push({ label: 'Подработка: ' + PART_TIME[c].name, opt: { what: 'join', c } });
    if (rh === 'school' && sim.school) out.push({ label: 'Пойти в школу', opt: { what: 'school' }, disabled: game.canGoSchool(sim) ? null : 'Уроки уже закончились' });
    if (rh === 'bistro') out.push({ label: 'Поужинать  ' + S.fmtMoney(30), opt: { what: 'eat' } });
    if (rh === 'theater') out.push({ label: 'Посмотреть спектакль  ' + S.fmtMoney(40), opt: { what: 'show' } });
    if (rh === 'stadium') out.push({ label: 'Посмотреть матч  ' + S.fmtMoney(25), opt: { what: 'game' } });
    if (rh === 'spa') { out.push({ label: 'Массаж  ' + S.fmtMoney(150), opt: { what: 'massage' } }); out.push({ label: 'Спа-процедуры  ' + S.fmtMoney(90), opt: { what: 'spa' } }); }
    if (rh === 'cityhall') out.push({ label: 'Экскурсия по ратуше', opt: { what: 'tour' } });
    if (rh === 'grocery') { out.push({ label: 'Купить продукты и семена', opt: { what: 'shop_grocery' } }); out.push({ label: 'Продать урожай и рыбу', opt: { what: 'sell_food' }, disabled: sim.inv.some(i => i.k === 'produce' || i.k === 'fish') ? null : 'Нечего продавать' }); }
    if (rh === 'bookstore') out.push({ label: 'Купить книги', opt: { what: 'shop_books' } });
    if (rh === 'science') out.push({ label: 'Продать самоцветы и металлы', opt: { what: 'sell_collect' }, disabled: sim.inv.some(i => i.k === 'collect') ? null : 'Нечего продавать' });
    if (rh === 'hospital' && sim.preg && sim.preg.labor) out.push({ label: 'Родить в больнице', opt: { what: 'birth' } });
    if (rh === 'cityhall') out.push({ label: 'Продать картины', opt: { what: 'sell_art' }, disabled: sim.inv.some(i => i.k === 'painting') ? null : 'Нет картин' });
    for (const sk of (CLASSES[rh] || [])) {
      const L = lvl(sim, sk);
      const price = 150 + L * 100;
      out.push({ label: 'Урок: ' + SKILLS[sk].name + '  ' + S.fmtMoney(price), opt: { what: 'class', sk, price }, disabled: L >= 5 ? 'Дальше только практика' : !age(sim, 'teen') ? 'Только подросткам и старше' : null });
    }
    return out;
  }

  defAct('rh', {
    name: 'Действия...', icon: 'm_map', cat: 'rabbit',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    menu: rhMenu,
    run: function* (a, sim, ob, opt) {
      const game = a.game, world = game.world;
      const lot = world.lots[ob.lot];
      const what = opt.what;
      if (what === 'work') { yield* ACTS.go_work.run(a, sim, null, {}); return; }
      if (what === 'school') { yield* ACTS.go_school.run(a, sim, null, {}); return; }
      if (what === 'join') {
        if (!(yield* rabbitVisit(a, sim, lot, 30, null, { what: 'Собеседование' }))) return;
        game.joinCareer(sim, opt.c);
        return;
      }
      const PRICES = { eat: 30, show: 40, game: 25, massage: 150, spa: 90, class: opt.price || 0 };
      if (PRICES[what] && !game.spend(sim, PRICES[what], lot.name)) { a.think('m_money', 3); game.tip(sim, 'Не хватает денег.'); return; }
      if (what === 'eat') { if (yield* rabbitVisit(a, sim, lot, 60, dt => { sim.addNeed('hunger', 3 * dt); sim.addNeed('social', 0.3 * dt); }, { what: 'Ужин' })) { sim.addMood('bistro_dinner', game.t); game.note(sim, { k: 'eat', r: 'bistro', q: 4 }); game.note(sim, { k: 'visit', lot: lot.key }); } return; }
      if (what === 'show') { if (yield* rabbitVisit(a, sim, lot, 150, dt => { sim.addNeed('fun', 0.8 * dt); sim.addNeed('social', 0.2 * dt); }, { what: 'Спектакль' })) { sim.addMood('theater_show', game.t); game.note(sim, { k: 'visit', lot: lot.key }); } return; }
      if (what === 'game') { if (yield* rabbitVisit(a, sim, lot, 150, dt => { sim.addNeed('fun', 0.8 * dt); sim.addNeed('social', 0.3 * dt); }, { what: 'Матч' })) { sim.addMood('game_fan', game.t); game.note(sim, { k: 'visit', lot: lot.key }); } return; }
      if (what === 'massage') { if (yield* rabbitVisit(a, sim, lot, 120, dt => { sim.addNeed('energy', 0.3 * dt); sim.addNeed('fun', 0.3 * dt); sim.addNeed('hygiene', 0.3 * dt); }, { what: 'Массаж' })) { sim.addMood('spa_day', game.t); game.note(sim, { k: 'visit', lot: lot.key }); } return; }
      if (what === 'spa') { if (yield* rabbitVisit(a, sim, lot, 60, dt => { sim.addNeed('hygiene', 3 * dt); sim.addNeed('fun', 0.4 * dt); }, { what: 'Спа' })) { sim.addMood('fresh', game.t); game.note(sim, { k: 'visit', lot: lot.key }); } return; }
      if (what === 'tour') { if (yield* rabbitVisit(a, sim, lot, 90, dt => { sim.addNeed('fun', 0.5 * dt); game.gainSkill(sim, 'charisma', 0.3 * dt); }, { what: 'Экскурсия' })) game.note(sim, { k: 'visit', lot: lot.key }); return; }
      if (what === 'class') {
        if (yield* rabbitVisit(a, sim, lot, 120, dt => { sim.addNeed('fun', -0.1 * dt); }, { what: 'Урок' })) {
          const L = lvl(sim, opt.sk);
          const need = S.SKILL_XP[Math.min(10, L + 1)] - (sim.skills[opt.sk] || 0);
          game.gainSkill(sim, opt.sk, need / sim.skillMult(opt.sk) + 1);
          sim.addMood('fascinated', game.t);
        }
        return;
      }
      if (what === 'shop_grocery' || what === 'shop_books') {
        if (yield* rabbitVisit(a, sim, lot, 20, null, { what: 'Покупки' })) game.openShop(sim, what === 'shop_books' ? 'books' : 'grocery');
        return;
      }
      if (what === 'sell_food' || what === 'sell_collect' || what === 'sell_art') {
        if (yield* rabbitVisit(a, sim, lot, 15, null, { what: 'Продажа' })) game.sellItems(sim, what === 'sell_food' ? ['produce', 'fish'] : what === 'sell_art' ? ['painting'] : ['collect']);
        return;
      }
      if (what === 'birth') {
        if (yield* rabbitVisit(a, sim, lot, 120, null, { what: 'Роды', noCancel: true })) game.giveBirth(sim, true);
        return;
      }
    }
  });

  defAct('go_work', {
    name: 'Пойти на работу', icon: 'm_briefcase', cat: 'work', self: true,
    test: (sim, t, game) => sim.job ? (game.canGoWork(sim) ? true : 'Сейчас не рабочее время') : 'Нет работы',
    run: function* (a, sim) {
      const game = a.game, world = game.world;
      const shift = game.currentShift(sim);
      if (!shift) return;
      const lot = world.lots[world.lotByKey[shift.place].id];
      if (sim.outfit !== 'everyday' && sim.outfit !== 'work') sim.outfit = 'everyday';
      sim.outfit = 'work';
      const arrive = yield* rabbitVisit(a, sim, lot, 0, (dt) => game.workTick(sim, dt), { until: shift.end, what: 'Работа', car: 'carpool', noCancel: false, onEnter: () => game.startShift(sim, shift) });
      if (arrive) game.endShift(sim, shift, a.cancelled && game.t < shift.end - 1);
      sim.outfit = 'everyday';
      const home = game.hh(sim) ? world.lots[game.hh(sim).lot] : null;
      if (home && sim.lot !== home.id && !a.cancelled) {
        a.opt.carKind = 'carpool';
        const goal = home.doorIn && world.walkable(home.doorIn[0], home.doorIn[1]) ? home.doorIn : world.nearestWalkable(home.entrance[0], home.entrance[1], 5);
        if (goal) { yield* a.walk([goal]); game.onArriveLot(sim, home.id); }
      }
    }
  });

  defAct('go_school', {
    name: 'Пойти в школу', icon: 'm_book', cat: 'work', self: true,
    test: (sim, t, game) => sim.school ? (game.canGoSchool(sim) ? true : 'Уроки уже закончились') : 'Не учится',
    run: function* (a, sim) {
      const game = a.game, world = game.world;
      const sh = game.schoolShift(sim);
      if (!sh) return;
      const lot = world.lotByKey.school;
      const arrive = yield* rabbitVisit(a, sim, lot, 0, dt => game.schoolTick(sim, dt), { until: sh.end, what: 'Школа', car: 'bus' });
      if (arrive) game.endSchool(sim, a.cancelled && game.t < sh.end - 1);
      const home = game.hh(sim) ? world.lots[game.hh(sim).lot] : null;
      if (home && sim.lot !== home.id && !a.cancelled) {
        a.opt.carKind = 'bus';
        const goal = home.doorIn && world.walkable(home.doorIn[0], home.doorIn[1]) ? home.doorIn : world.nearestWalkable(home.entrance[0], home.entrance[1], 5);
        if (goal) { yield* a.walk([goal]); game.onArriveLot(sim, home.id); }
      }
    }
  });

  defAct('skip_work', {
    name: 'Взять отгул', icon: 'm_briefcase', cat: 'work', self: true,
    test: (sim, t, game) => sim.job && game.canGoWork(sim) && !sim.flags.skip ? true : 'Сейчас нельзя',
    run: function* (a, sim) {
      a.anim('phone', 'phone');
      yield* a.wait(2);
      a.game.skipWork(sim);
    }
  });

  defAct('phone', {
    name: 'Телефон...', icon: 'm_phone', cat: 'phone', self: true,
    test: (sim) => age(sim, 'teen') || 'Слишком мал для телефона',
    menu: (sim, t, game) => game.phoneMenu(sim),
    run: function* (a, sim, t, opt) {
      const game = a.game;
      a.anim('phone', 'phone');
      game.sound('dial', sim);
      if (opt.call === 'chat') {
        const other = game.sims.get(opt.who);
        yield* a.loop(12, dt => { sim.addNeed('social', 1.2 * dt); sim.addNeed('fun', 0.2 * dt); if (Math.random() < dt * 0.25) a.say(S.TOPICS[Math.floor(Math.random() * S.TOPICS.length)], 1); });
        if (other) { game.relAdd(sim, other, 4); other.addNeed('social', 10); }
        return;
      }
      yield* a.wait(2);
      game.phoneAction(sim, opt);
    }
  });

  defAct('pick_up', {
    name: 'Взять на руки', icon: 'm_baby', cat: 'care', care: true,
    test: (sim, t) => sim.carry ? 'Руки заняты' : (age(sim, 'teen') ? (t.carriedBy ? 'Уже на руках' : true) : 'Слишком мал'),
    run: function* (a, sim, t) {
      if (!(yield* a.walk(S.adjTilesSim(a.game, t)))) return;
      a.face(t.x, t.y);
      a.anim('reach'); yield* a.wait(0.4);
      a.game.pickUp(sim, t);
    }
  });
  defAct('put_down', {
    name: 'Поставить на пол', icon: 'm_baby', cat: 'care', care: true,
    test: (sim, t) => sim.carry === t.id && t.age === 'toddler' ? true : 'Нельзя',
    run: function* (a, sim, t) { a.anim('reach'); yield* a.wait(0.4); a.game.putDown(sim); }
  });
  defAct('feed_baby', {
    name: 'Покормить', icon: 'n_hunger', cat: 'care', care: true,
    test: (sim, t) => age(sim, 'teen') ? true : 'Слишком мал',
    ad: { social: 5 },
    run: function* (a, sim, t) {
      const game = a.game;
      if (sim.carry !== t.id) {
        if (!(yield* a.walk(S.adjTilesSim(game, t)))) return;
        a.face(t.x, t.y);
        game.pickUp(sim, t);
      }
      a.anim('feed', 'bottle');
      yield* a.loop(10, dt => { t.addNeed('hunger', 10 * dt); t.addNeed('social', 1 * dt); }, () => t.needs.hunger >= 100);
      game.relAdd(sim, t, 3);
      game.note(sim, { k: 'act', a: 'care' });
    }
  });
  defAct('change', {
    name: 'Сменить подгузник', icon: 'n_bladder', cat: 'care', care: true,
    test: (sim, t) => age(sim, 'teen') ? true : 'Слишком мал',
    run: function* (a, sim, t) {
      const game = a.game;
      if (sim.carry !== t.id) {
        if (!(yield* a.walk(S.adjTilesSim(game, t)))) return;
        a.face(t.x, t.y);
        game.pickUp(sim, t);
      }
      a.anim('feed', 'diaper'); t.censor = true;
      yield* a.wait(3);
      t.censor = false;
      t.needs.bladder = 100; t.addNeed('hygiene', 40);
      sim.addNeed('hygiene', -5);
      game.relAdd(sim, t, 2);
    }
  });
  defAct('cuddle', {
    name: 'Понянчить', icon: 'm_heart', cat: 'care', care: true,
    test: (sim, t) => age(sim, 'child') ? true : 'Слишком мал',
    run: function* (a, sim, t) {
      const game = a.game;
      if (sim.carry !== t.id) {
        if (!age(sim, 'teen')) return;
        if (!(yield* a.walk(S.adjTilesSim(game, t)))) return;
        game.pickUp(sim, t);
      }
      a.anim('rock', 'baby');
      yield* a.loop(12, dt => { t.addNeed('social', 4 * dt); t.addNeed('fun', 3 * dt); sim.addNeed('social', 0.6 * dt); });
      game.relAdd(sim, t, 5);
    }
  });
  defAct('to_crib', {
    name: 'Уложить спать', icon: 'm_zzz', cat: 'care', care: true,
    test: (sim, t, game) => age(sim, 'teen') ? (game.nearestObj(sim, o => D(o.t).crib && !o.use.baby, 30) ? true : 'Нужна детская кроватка') : 'Слишком мал',
    run: function* (a, sim, t) {
      const game = a.game;
      const crib = game.nearestObj(sim, o => D(o.t).crib && !o.use.baby, 30);
      if (!crib) return;
      if (sim.carry !== t.id) {
        if (!(yield* a.walk(S.adjTilesSim(game, t)))) return;
        game.pickUp(sim, t);
      }
      if (!(yield* a.walkToObj(crib, 'front'))) return;
      a.anim('reach'); yield* a.wait(0.5);
      game.putInCrib(sim, t, crib);
    }
  });

  S.adjTilesSim = function (game, t) {
    const w = game.world;
    const x = Math.floor(t.x), y = Math.floor(t.y), lv = t.lv || 0;
    const out = [];
    for (let k = 0; k < 4; k++) { const nx = x + S.DX[k], ny = y + S.DY[k]; if (w.walkable(nx, ny, lv) && w.edgeOpen(x, y, nx, ny, lv)) out.push([nx, ny, lv]); }
    if (!out.length && w.walkable(x, y, lv)) out.push([x, y, lv]);
    if (!out.length) { const p = w.nearestWalkable(x, y, 3, null, lv); if (p) out.push([p[0], p[1], lv]); }
    return out;
  };

  function poolArea(world, tx, ty) {
    const out = [], seen = new Set([tx + ',' + ty]), q = [[tx, ty]];
    while (q.length && out.length < 400) {
      const [x, y] = q.pop();
      if (!world.isPool(x, y)) continue;
      out.push([x, y]);
      for (let k = 0; k < 4; k++) {
        const nx = x + S.DX[k], ny = y + S.DY[k], key = nx + ',' + ny;
        if (!seen.has(key) && world.isPool(nx, ny)) { seen.add(key); q.push([nx, ny]); }
      }
    }
    return out;
  }

  function ladderEntries(world, area) {
    const out = [];
    for (const ob of world.poolLadders(area)) {
      const lx = ob.x - S.DX[ob.r], ly = ob.y - S.DY[ob.r];
      if (world.walkable(lx, ly)) out.push({ ob, land: [lx, ly, 0] });
    }
    return out;
  }

  defAct('swim', {
    name: 'Поплавать', icon: 'n_hygiene', cat: 'jog', ground: true, soft: true,
    test: (sim, tile, game) => {
      if (!tile || tile[2] || !game.world.isPool(tile[0], tile[1])) return null;
      if (!age(sim, 'child')) return 'Слишком мал';
      if (sim.needs.energy < -50) return 'Нет сил';
      if (!ladderEntries(game.world, poolArea(game.world, tile[0], tile[1])).length) return 'У бассейна нет лестницы';
      return true;
    },
    ad: { fun: 30, hygiene: 10 }, adFn: (sim) => sim.has('couch_potato') ? 0.1 : sim.needs.energy < 0 ? 0.2 : 0.8, skill: 'athletic',
    run: function* (a, sim, tile) {
      const game = a.game, world = game.world;
      const area = poolArea(world, tile[0], tile[1]);
      const entries = ladderEntries(world, area);
      if (!entries.length) return;
      if (!(yield* a.walk(entries.map(e => e.land), { noCar: true }))) return;
      const fx = Math.floor(sim.x), fy = Math.floor(sim.y);
      const here = entries.find(e => e.land[0] === fx && e.land[1] === fy) || entries[0];
      a.opt.exit = here.land.slice(0, 2);
      a.changeOutfit('swim', true);
      a.face(here.ob.x + 0.5, here.ob.y + 0.5);
      yield* a.wait(0.6);
      a.anim('swim');
      game.sound('splash', sim);
      {
        const sx = sim.x, sy = sim.y, tx = here.ob.x + 0.5, ty = here.ob.y + 0.5;
        let t = 0;
        while (t < 1) { yield; t += a.dt; const k = Math.min(1, t); sim.x = sx + (tx - sx) * k; sim.y = sy + (ty - sy) * k; sim.swimZ = -0.95 * k; }
        sim.swimZ = -0.95;
      }
      const total = a.user ? 90 : 45;
      let t = 0;
      while (t < total && !a.cancelled) {
        const dest = area[Math.floor(Math.random() * area.length)];
        const dx = dest[0] + 0.5 - sim.x, dy = dest[1] + 0.5 - sim.y;
        const dur = Math.max(1.5, Math.hypot(dx, dy) / 0.9);
        if (Math.hypot(dx, dy) > 0.1) sim.face = Math.atan2(dy, dx);
        yield* a.glide(dest[0] + 0.5, dest[1] + 0.5, sim.face, dur);
        t += dur;
        game.gainSkill(sim, 'athletic', 0.9 * dur);
        sim.addNeed('fun', (sim.has('athletic') || sim.has('loves_outdoors') ? 0.75 : 0.45) * dur);
        sim.addNeed('hygiene', 0.25 * dur);
        sim.addNeed('energy', -0.2 * dur);
        sim.stat('swimMin', dur);
      }
      const outs = ladderEntries(world, area);
      const out = outs.sort((p, q) => Math.hypot(p.ob.x + 0.5 - sim.x, p.ob.y + 0.5 - sim.y) - Math.hypot(q.ob.x + 0.5 - sim.x, q.ob.y + 0.5 - sim.y))[0];
      if (out) {
        a.opt.exit = out.land.slice(0, 2);
        const lx = out.ob.x + 0.5, ly = out.ob.y + 0.5;
        const dur = Math.max(0.8, Math.hypot(lx - sim.x, ly - sim.y) / 0.9);
        sim.face = Math.atan2(ly - sim.y, lx - sim.x);
        yield* a.glide(lx, ly, sim.face, dur);
      }
      const ex = a.opt.exit;
      {
        const sx = sim.x, sy = sim.y, tx = ex[0] + 0.5, ty = ex[1] + 0.5;
        sim.face = Math.atan2(ty - sy, tx - sx);
        let t2 = 0;
        while (t2 < 1) { yield; t2 += a.dt; const k = Math.min(1, t2); sim.x = sx + (tx - sx) * k; sim.y = sy + (ty - sy) * k; sim.swimZ = -0.95 * (1 - k); }
      }
      sim.swimZ = 0;
      a.anim('idle');
      if (t >= 20) sim.addMood('refreshing_swim', game.t);
    },
    end: (a, sim) => {
      if (!sim.swimZ) return;
      sim.swimZ = 0;
      const ex = a.opt.exit;
      if (ex && a.game.world.isPool(Math.floor(sim.x), Math.floor(sim.y))) { sim.x = ex[0] + 0.5; sim.y = ex[1] + 0.5; }
    }
  });

  Object.assign(S, { rhMenu, rabbitVisit, shoreTiles, CLASSES, poolArea });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
