(function (S) {
  'use strict';
  const { OBJECTS, defAct, seatSpots, frontTiles, adjTiles, clamp, SKILLS, PLANTS, FISH, COLLECT, eatFood } = S;
  const D = t => OBJECTS[t];
  const lvl = (sim, k) => sim.skillLevel(k);
  const age = (sim, a) => S.ageIdx(sim.age) >= S.ageIdx(a);

  defAct('practice_chess', {
    name: 'Играть самому с собой', icon: 'm_chess', cat: 'chess', soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 25 }, skill: 'logic',
    run: function* (a, sim, ob) {
      const spot = yield* a.sitOn(ob);
      if (!spot) return;
      a.anim('chess');
      yield* a.loop(a.user ? 120 : 50, dt => { a.game.gainSkill(sim, 'logic', 1.2 * dt); sim.addNeed('fun', 0.5 * dt * (sim.has('genius') ? 1.5 : 1)); });
      yield* a.standUp();
    }
  });

  defAct('play_chess', {
    name: 'Сыграть в шахматы...', icon: 'm_chess', cat: 'chess',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    menu: (sim, ob, game) => {
      const out = game.simsNear(sim, 14).filter(s => age(s, 'child') && s.canAct && !s.sleeping).map(s => ({ label: 'С ' + s.first, opt: { with: s.id } }));
      out.push({ label: 'С кем угодно', opt: { with: 0 } });
      return out;
    },
    ad: { fun: 35, social: 15 }, skill: 'logic',
    autoOpt: (sim, ob, game) => { const c = game.simsNear(sim, 10).filter(s => age(s, 'child') && s.canAct && !s.sleeping && !s.queue.some(x => x.user)); return c.length ? { with: c[0].id } : null; },
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      let other = opt.with ? game.sims.get(opt.with) : null;
      if (!other) { const c = game.simsNear(sim, 12).filter(s => age(s, 'child') && s.canAct && !s.sleeping && !s.queue.some(x => x.user)); other = c[0] || null; }
      const spot = yield* a.sitOn(ob, 0);
      if (!spot) return;
      a.anim('chess');
      const match = { a: sim.id, b: other ? other.id : 0, seated: false, done: false };
      ob.st.match = match;
      if (other) game.queueFront(other, 'chess_join', ob, { match });
      let waited = 0;
      while (other && !match.seated && waited < 20 && !a.cancelled) { yield; waited += a.dt; }
      if (!other || !match.seated) {
        yield* a.loop(a.user ? 90 : 40, dt => { game.gainSkill(sim, 'logic', 1.2 * dt); sim.addNeed('fun', 0.5 * dt); });
      } else {
        yield* a.loop(40, dt => {
          game.gainSkill(sim, 'logic', 1.5 * dt); game.gainSkill(other, 'logic', 1.5 * dt);
          sim.addNeed('fun', 0.7 * dt); other.addNeed('fun', 0.7 * dt);
          sim.addNeed('social', 0.3 * dt); other.addNeed('social', 0.3 * dt);
        });
        const pa = lvl(sim, 'logic') + Math.random() * 4 + (sim.has('genius') ? 1 : 0);
        const pb = lvl(other, 'logic') + Math.random() * 4 + (other.has('genius') ? 1 : 0);
        const win = pa >= pb ? sim : other, lose = pa >= pb ? other : sim;
        win.addMood('chess_win', game.t); lose.addMood('chess_lose', game.t, lose.has('hot_headed') ? { v: -20 } : undefined);
        win.stat('chessWins');
        game.note(win, { k: 'chess', win: true }); game.note(lose, { k: 'chess', win: false });
        game.relAdd(sim, other, 4);
        game.fx('text', win, 'Шах и мат!');
      }
      match.done = true;
      ob.st.match = null;
      yield* a.standUp();
    }
  });

  defAct('chess_join', {
    name: 'Играть в шахматы', icon: 'm_chess', cat: 'chess', hidden: true,
    test: () => true,
    run: function* (a, sim, ob, opt) {
      const match = opt.match;
      const spot = yield* a.sitOn(ob, 1);
      if (!spot || !match) { if (match) match.done = true; return; }
      a.anim('chess');
      match.seated = true;
      while (!match.done && !a.cancelled) yield;
      yield* a.standUp();
    }
  });

  function paintStyle(L) { return L >= 10 ? 'Шедевр' : L >= 8 ? 'Портрет' : L >= 6 ? 'Абстракция' : L >= 4 ? 'Пейзаж' : L >= 2 ? 'Натюрморт' : 'Набросок'; }

  defAct('paint', {
    name: (sim, ob) => ob && ob.st.work ? 'Продолжить картину' : 'Нарисовать картину', icon: 'sk_painting', cat: 'skill_painting', soft: true,
    test: (sim, ob) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 30 }, skill: 'painting',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      if (!ob.st.work || ob.st.work.by !== sim.id) ob.st.work = { by: sim.id, p: 0, style: paintStyle(lvl(sim, 'painting')) };
      game.dirtyObjs();
      a.anim('paint', 'brush');
      const w = ob.st.work;
      const hours = Math.max(1.5, 4 - lvl(sim, 'painting') * 0.2) * (sim.has('perfectionist') ? 1.25 : 1);
      yield* a.loop(a.user ? 300 : 90, dt => {
        w.p += dt / (hours * 60);
        game.gainSkill(sim, 'painting', 1.4 * dt);
        sim.addNeed('fun', (sim.has('artistic') ? 0.8 : sim.has('cant_stand_art') ? -0.3 : 0.35) * dt);
      }, () => w.p >= 1);
      if (w.p >= 1) {
        const L = lvl(sim, 'painting');
        let q = clamp(Math.round(1.5 + L * 0.35 + (Math.random() - 0.5) * 2 + (sim.has('artistic') ? 0.6 : 0) + (sim.mood > 40 ? 0.4 : 0)), 0, 5);
        let value = Math.round((20 + L * L * 14) * (0.5 + q * 0.3) * (sim.has('artistic') ? 1.2 : 1) * (sim.stats.paintings >= 25 ? 1.2 : 1));
        const master = L >= 10 && Math.random() < 0.2;
        if (master) value *= 3;
        const title = master ? 'Шедевр «' + S.BOOK_TITLES[Math.floor(Math.random() * S.BOOK_TITLES.length)] + '»' : w.style + ' ' + (sim.stats.paintings + 1 || 1);
        sim.inv.push({ k: 'painting', name: title, q, value, by: sim.name, style: w.style, seed: Math.floor(Math.random() * 1e6) });
        sim.stat('paintings');
        ob.st.work = null; game.dirtyObjs();
        if (sim.has('artistic')) sim.addMood('inspired', game.t);
        if (sim.has('perfectionist') && q <= 2) sim.addMood('not_perfect', game.t);
        game.notify(sim.first + ' закончил' + S.genderize(sim, '', 'а') + ' картину «' + title + '». Качество: ' + S.QUALITY[q] + ', цена ' + S.fmtMoney(value) + '. Картина лежит в инвентаре.', { sim, icon: 'sk_painting' });
        a.note({ k: 'paint', q, v: value });
      }
    }
  });

  function* playGuitar(a, sim, ob, tips) {
    const game = a.game;
    if (ob && ob.t) { if (!(yield* a.walkToObj(ob, 'front'))) return; }
    a.anim('guitar', 'guitar');
    game.sound('guitar', sim);
    let earned = 0, t = 0;
    const L = lvl(sim, 'guitar');
    yield* a.loop(a.user ? 240 : 60, dt => {
      t += dt;
      game.gainSkill(sim, 'guitar', 1.4 * dt);
      sim.addNeed('fun', (sim.has('virtuoso') ? 1 : 0.5) * dt);
      if (tips && Math.random() < dt / 12) {
        const listeners = game.simsNear(sim, 9).filter(s => !s.dead && s.hh !== sim.hh).length;
        const lot = game.world.lots[sim.lot];
        const pub = lot && lot.kind !== 'home';
        if (pub || listeners) {
          let m = Math.round((2 + L * 3) * (0.5 + Math.random()) * (1 + listeners * 0.3) * (sim.stats.tips >= 1000 ? 1.5 : 1));
          if (L < 3) m = Math.round(m * 0.3);
          earned += m;
          game.earn(sim, m, 'Чаевые', true);
          game.fx('money', sim, m);
          sim.stat('tips', m);
        }
      }
      if (Math.random() < dt * 0.1) a.say('m_note', 1.2);
    });
    if (tips) game.note(sim, { k: 'guitar_public', m: earned });
    game.note(sim, { k: 'guitar_min', n: t });
    if (sim.has('virtuoso')) sim.addMood('music_ecstasy', game.t);
    a.note({ k: 'act', a: 'guitar' });
  }

  defAct('play_guitar', {
    name: 'Играть на гитаре', icon: 'sk_guitar', cat: 'skill_guitar', soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 30 }, skill: 'guitar',
    run: function* (a, sim, ob) { yield* playGuitar(a, sim, ob, false); }
  });
  defAct('play_tips', {
    name: 'Играть за чаевые', icon: 'm_money', cat: 'skill_guitar', soft: true,
    test: (sim) => age(sim, 'teen') ? (lvl(sim, 'guitar') >= 3 ? true : 'Нужен навык гитары 3') : 'Слишком мал',
    ad: { fun: 20 }, skill: 'guitar',
    run: function* (a, sim, ob) { yield* playGuitar(a, sim, ob, true); }
  });

  defAct('stargaze', {
    name: (sim, ob, game) => game && !game.isNight() ? 'Смотреть на облака' : 'Смотреть на звёзды', icon: 'm_star', cat: 'stargaze', soft: true,
    test: (sim, ob, game) => { if (!age(sim, 'child')) return 'Слишком мал'; if (game && game.isNight() && game.weather && game.weather.kind !== 'clear') return 'Небо затянуто тучами'; return true; },
    ad: { fun: 30 }, adFn: (sim, ob, game) => game.isNight() ? 1 : 0.2, skill: 'logic',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('telescope');
      const night = game.isNight();
      let found = false;
      const t = yield* a.loop(a.user ? 180 : 60, dt => {
        game.gainSkill(sim, 'logic', (night ? 1.4 : 0.5) * dt);
        sim.addNeed('fun', 0.55 * dt * (sim.has('genius') ? 1.4 : 1));
        if (night && !found && lvl(sim, 'logic') >= 3 && Math.random() < dt * 0.0015) found = true;
      });
      if (night && t > 20) { sim.addMood('stargazed', game.t); a.note({ k: 'act', a: 'stargaze' }); }
      if (found) {
        const reward = 150 + lvl(sim, 'logic') * 40;
        game.earn(sim, reward, 'Открытие');
        game.notify(sim.first + ' открыл' + S.genderize(sim, '', 'а') + ' новую комету! Обсерватория выплатила премию ' + S.fmtMoney(reward) + '.', { sim, icon: 'm_star' });
        sim.addMood('thrilled', game.t);
      }
    }
  });

  function workoutEnd(game, sim, minutes) {
    game.workoutMoods(sim, minutes);
    game.note(sim, { k: 'workout_min', n: minutes });
    game.note(sim, { k: 'act', a: 'workout' });
  }
  defAct('treadmill', {
    name: 'Бегать на дорожке', icon: 'sk_athletic', cat: 'workout', soft: true,
    test: (sim, ob) => ob.broken ? 'Сломана' : age(sim, 'child') || 'Слишком мал',
    ad: { fun: 15 }, adFn: (sim) => sim.has('couch_potato') ? 0.05 : sim.needs.energy < 0 ? 0.1 : 0.5, skill: 'athletic',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!a.reserve(ob, 'use')) { a.ok = false; return; }
      if (!(yield* a.intoObj(ob, 0, -0.1, S.dirAngle(ob.r)))) return;
      a.changeOutfit('athletic', true);
      a.anim('treadmill'); ob.st.on = true; game.dirtyObjs();
      const t = yield* a.loop(a.user ? 120 : 45, dt => {
        game.gainSkill(sim, 'athletic', 1.8 * dt); sim.addNeed('energy', -0.4 * dt); sim.addNeed('hygiene', -0.35 * dt);
        sim.addNeed('fun', (sim.has('athletic') ? 0.8 : 0.15) * dt);
      }, () => sim.needs.energy < -50);
      ob.st.on = false; game.dirtyObjs();
      sim.stat('workoutMin', t);
      workoutEnd(game, sim, t);
      if (Math.random() < (D(ob.t).breaks || 0) && !ob.upg.unbreakable) { ob.broken = true; game.onBroken(ob, sim); }
      yield* a.standUp();
    }
  });
  defAct('lift_weights', {
    name: 'Тренироваться', icon: 'sk_athletic', cat: 'workout', soft: true,
    test: (sim) => age(sim, 'teen') || 'Слишком мал',
    ad: { fun: 12 }, adFn: (sim) => sim.has('couch_potato') ? 0.05 : sim.needs.energy < 0 ? 0.1 : 0.45, skill: 'athletic',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!a.reserve(ob, 'use')) { a.ok = false; return; }
      if (!(yield* a.intoObj(ob, 0, 0.1, S.dirAngle(ob.r)))) return;
      a.changeOutfit('athletic', true);
      sim.lieH = 0.45;
      a.anim('bench');
      const t = yield* a.loop(a.user ? 120 : 40, dt => {
        game.gainSkill(sim, 'athletic', 1.6 * dt); sim.addNeed('energy', -0.35 * dt); sim.addNeed('hygiene', -0.3 * dt);
        sim.addNeed('fun', (sim.has('athletic') ? 0.7 : 0.1) * dt);
      }, () => sim.needs.energy < -50);
      sim.lieH = 0;
      sim.stat('workoutMin', t);
      workoutEnd(game, sim, t);
      yield* a.standUp();
    }
  });

  defAct('play_toys', {
    name: 'Играть с игрушками', icon: 'b_kids', cat: 'play', soft: true,
    test: (sim) => sim.age === 'baby' ? 'Нельзя' : true,
    ad: { fun: 50 }, adFn: (sim) => sim.isKid ? 1.4 : sim.has('childish') ? 1 : 0.05,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim(sim.age === 'toddler' ? 'toddler_play' : 'play_floor', 'toy');
      yield* a.loop(a.user ? 120 : 45, dt => { sim.addNeed('fun', (sim.isKid ? 1.3 : 0.5) * dt); if (sim.age === 'toddler') sim.addNeed('social', 0.1 * dt); }, () => !a.user && sim.needs.fun >= 100);
    }
  });
  defAct('swing', {
    name: 'Качаться на качелях', icon: 'b_kids', cat: 'play', soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 55 }, adFn: (sim) => sim.isKid ? 1.5 : sim.has('childish') ? 1 : 0.2,
    run: function* (a, sim, ob) {
      const spots = [-0.5, 0.5];
      let i = spots.findIndex((u, k) => a.reserve(ob, 'sw' + k));
      if (i < 0) { a.ok = false; return; }
      if (!(yield* a.intoObj(ob, spots[i], 0, S.dirAngle(ob.r)))) return;
      sim.sitH = 0.55;
      a.anim('swing');
      yield* a.loop(a.user ? 90 : 40, dt => sim.addNeed('fun', (sim.isKid ? 1.4 : 0.7) * dt), () => !a.user && sim.needs.fun >= 100);
      yield* a.standUp();
    }
  });
  defAct('play_climber', {
    name: 'Лазать', icon: 'b_kids', cat: 'play', soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 50 }, adFn: (sim) => sim.isKid ? 1.5 : 0.1,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('climb');
      yield* a.loop(a.user ? 90 : 35, dt => { sim.addNeed('fun', 1.3 * dt); sim.addNeed('energy', -0.1 * dt); a.game.gainSkill(sim, 'athletic', 0.3 * dt); });
    }
  });

  defAct('pay_bills', {
    name: 'Оплатить счета', icon: 'm_money', cat: 'bills',
    test: (sim, ob, game) => { const hh = game.hh(sim); if (!hh || hh.lot !== ob.lot) return 'Это не ваш почтовый ящик'; return game.unpaid(hh) > 0 ? true : 'Счетов нет'; },
    ad: { fun: 40, social: 10 }, adFn: (sim, ob, game) => !S.isAdultish(sim.age) ? 0 : game.overdue(game.hh(sim)) ? 4 : game.unpaid(game.hh(sim)) > 0 ? 0.5 : 0,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('reach'); yield* a.wait(1);
      a.game.payBills(sim);
    }
  });

  defAct('empty_trash', {
    name: 'Вынести мусор', icon: 'm_trash', cat: 'clean',
    test: (sim, ob) => (ob.st.fill || 0) >= 2 ? (age(sim, 'child') || 'Слишком мал') : 'Ещё не заполнено',
    ad: { fun: 2 }, adFn: (sim, ob) => (ob.st.fill || 0) >= 6 ? 1.5 : 0.3,
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('reach'); yield* a.wait(0.8);
      ob.st.fill = 0; game.dirtyObjs();
      sim.prop = 'bag';
      const bin = game.nearestObj(sim, o => D(o.t).bin && o.lot === ob.lot, 40);
      if (bin && (yield* a.walkToObj(bin, 'front'))) { a.anim('reach', 'bag'); yield* a.wait(0.8); }
      sim.prop = null;
      game.cleanedUp(sim);
    }
  });

  defAct('clean_up', {
    name: (sim, ob) => ob && ob.t === 'platter' && ob.st.servings > 0 ? 'Убрать в холодильник' : ob && ob.t === 'newspaper' ? 'Выбросить' : 'Убрать', icon: 'm_sparkle', cat: 'clean',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 1 }, adFn: (sim) => sim.has('neat') ? 3 : sim.has('slob') ? 0.02 : 0.4,
    run: function* (a, sim, ob) {
      const game = a.game, world = game.world;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      if (!world.objects.has(ob.id)) return;
      a.anim('reach'); yield* a.wait(0.5);
      const kind = ob.t, st = Object.assign({}, ob.st);
      world.removeObject(ob.id); game.dirtyObjs();
      sim.prop = kind === 'newspaper' ? 'paper' : kind === 'trash_pile' ? 'bag' : 'plate';
      if (kind === 'platter' && st.servings > 0) {
        const fridge = game.nearestObj(sim, o => D(o.t).fridge, 30);
        if (fridge && (yield* a.walkToObj(fridge, 'front'))) {
          a.anim('fridge'); yield* a.wait(0.8);
          fridge.st.left = fridge.st.left || [];
          for (let i = 0; i < st.servings && fridge.st.left.length < 12; i++) fridge.st.left.push({ recipe: st.recipe, q: st.q, t: st.t });
        }
      } else {
        const dest = kind === 'dirty_plate' ? game.nearestObj(sim, o => D(o.t).dishwasher || D(o.t).sink, 25) : null;
        const trash = dest || game.nearestObj(sim, o => D(o.t).trash || D(o.t).bin, 25);
        if (trash && (yield* a.walkToObj(trash, 'front'))) {
          a.anim(D(trash.t).sink ? 'stand_wash' : 'reach'); yield* a.wait(D(trash.t).sink ? 2 : 0.6);
          if (D(trash.t).trash) { trash.st.fill = (trash.st.fill || 0) + 1; game.dirtyObjs(); }
        }
      }
      sim.prop = null;
      game.cleanedUp(sim);
    }
  });

  defAct('mop', {
    name: 'Вытереть', icon: 'm_sparkle', cat: 'clean',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 1 }, adFn: (sim) => sim.has('neat') ? 3 : sim.has('slob') ? 0.02 : 0.5,
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('mop', 'mop'); yield* a.wait(3);
      a.game.world.removeObject(ob.id); a.game.dirtyObjs();
      a.game.cleanedUp(sim);
    }
  });

  defAct('clean_obj', {
    name: 'Почистить', icon: 'm_sparkle', cat: 'clean',
    test: (sim, ob) => (ob.dirt || 0) >= 25 ? (age(sim, 'child') || 'Слишком мал') : 'Уже чисто',
    ad: { fun: 1 }, adFn: (sim, ob) => ((ob.dirt || 0) / 50) * (sim.has('neat') ? 3 : sim.has('slob') ? 0.02 : 0.4),
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('clean', 'sponge');
      yield* a.loop(sim.has('neat') ? 3 : 5, () => {});
      ob.dirt = 0; a.game.dirtyObjs();
      a.game.cleanedUp(sim);
    }
  });

  defAct('repair', {
    name: 'Починить', icon: 'sk_handiness', cat: 'repair',
    test: (sim, ob) => ob.broken ? (age(sim, 'teen') || 'Слишком мал') : 'Не сломано',
    ad: { fun: 5 }, adFn: (sim, ob) => { const d = D(ob.t); let m = sim.has('handy') ? 3 : 1; if (d.toilet) m *= 1 + S.urgency(sim.needs.bladder) * 4; if (d.shower || d.tub) m *= 1 + S.urgency(sim.needs.hygiene) * 3; return S.ageIdx(sim.age) >= 3 ? m : 0; }, skill: 'handiness',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('repair', 'wrench');
      game.sound('repair', sim);
      const L = lvl(sim, 'handiness');
      const dur = Math.max(10, 60 - L * 4.5) * (sim.has('handy') ? 0.7 : 1) * (sim.stats.repairs >= 20 ? 0.5 : 1);
      const elec = !!(D(ob.t).tv || D(ob.t).computer || D(ob.t).stove || ob.t === 'treadmill' || ob.t === 'dishwasher');
      let shocked = false;
      yield* a.loop(dur, dt => {
        game.gainSkill(sim, 'handiness', 1.3 * dt);
        if (elec && !shocked && !sim.has('handy') && Math.random() < dt * Math.max(0, 0.004 - L * 0.0004)) shocked = true;
      }, () => shocked);
      if (shocked) {
        a.anim('shock'); game.fx('spark', sim); game.sound('zap', sim);
        yield* a.wait(1.5);
        sim.addNeed('energy', -30);
        sim.addMood('scared', game.t, { dur: 120 });
        return;
      }
      if (a.cancelled) return;
      ob.broken = false; game.dirtyObjs();
      sim.stat('repairs');
      a.note({ k: 'repair' });
      game.fx('text', sim, 'Починено!');
    }
  });

  const UPGRADES = {
    unbreakable: { name: 'Сделать неломающимся', lvl: 6, fits: o => D(o.t).breaks || D(o.t).toilet || D(o.t).shower || D(o.t).tub },
    efficient: { name: 'Повысить мощность', lvl: 4, fits: o => D(o.t).stove || D(o.t).shower || D(o.t).tv || D(o.t).computer || o.t === 'treadmill' },
    selfclean: { name: 'Самоочистка', lvl: 7, fits: o => D(o.t).toilet || D(o.t).shower || D(o.t).tub || D(o.t).stove }
  };
  defAct('upgrade', {
    name: 'Улучшить...', icon: 'sk_handiness', cat: 'repair',
    test: (sim, ob) => {
      if (!age(sim, 'teen')) return 'Слишком мал';
      if (ob.broken) return 'Сначала почините';
      return Object.keys(UPGRADES).some(k => UPGRADES[k].fits(ob) && !ob.upg[k]) ? true : 'Нечего улучшать';
    },
    menu: (sim, ob) => Object.keys(UPGRADES).filter(k => UPGRADES[k].fits(ob) && !ob.upg[k]).map(k => ({ label: UPGRADES[k].name, opt: { up: k }, disabled: lvl(sim, 'handiness') < UPGRADES[k].lvl ? 'Нужна механика ' + UPGRADES[k].lvl : null })),
    ad: { fun: 8 }, adFn: (sim) => sim.has('handy') && lvl(sim, 'handiness') >= 4 ? 0.6 : 0,
    autoOpt: (sim, ob) => { const k = Object.keys(UPGRADES).find(u => UPGRADES[u].fits(ob) && !ob.upg[u] && lvl(sim, 'handiness') >= UPGRADES[u].lvl); return k ? { up: k } : null; },
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('repair', 'wrench');
      const t = yield* a.loop(Math.max(30, 90 - lvl(sim, 'handiness') * 5), dt => game.gainSkill(sim, 'handiness', 1.4 * dt));
      if (a.cancelled) return;
      ob.upg[opt.up] = true;
      sim.stat('upgrades');
      a.note({ k: 'upgrade' });
      game.fx('text', sim, 'Улучшено!');
      game.notify(sim.first + ': ' + 'улучшение «' + UPGRADES[opt.up].name + '» для предмета «' + D(ob.t).name + '» готово.', { sim, icon: 'sk_handiness' });
    }
  });
  for (const k of Object.keys(OBJECTS)) {
    const d = OBJECTS[k];
    if (Object.keys(UPGRADES).some(u => UPGRADES[u].fits({ t: k })) && !d.acts.includes('upgrade') && !d.hidden) d.acts.push('upgrade');
  }

  defAct('water_plant', {
    name: 'Полить', icon: 'sk_gardening', cat: 'garden',
    test: (sim, ob) => ob.st.dead ? 'Растение погибло' : age(sim, 'child') || 'Слишком мал',
    ad: { fun: 6 }, adFn: (sim, ob) => ob.st.water < 50 ? (sim.has('green_thumb') ? 3 : 1) : 0.05, skill: 'gardening',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('water', 'can');
      yield* a.loop(3, dt => a.game.gainSkill(sim, 'gardening', 1 * dt));
      ob.st.water = 100; a.game.dirtyObjs();
      if (sim.has('green_thumb') || sim.has('loves_outdoors')) sim.addMood('plant_love', a.game.t);
    }
  });
  defAct('weed_plant', {
    name: 'Прополоть', icon: 'sk_gardening', cat: 'garden',
    test: (sim, ob) => ob.st.weeds >= 20 ? (age(sim, 'child') || 'Слишком мал') : 'Сорняков нет',
    ad: { fun: 5 }, adFn: (sim, ob) => ob.st.weeds > 40 ? (sim.has('green_thumb') ? 3 : 1) : 0.1, skill: 'gardening',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('garden');
      yield* a.loop(4, dt => a.game.gainSkill(sim, 'gardening', 1.2 * dt));
      ob.st.weeds = 0; a.game.dirtyObjs();
    }
  });
  defAct('harvest', {
    name: 'Собрать урожай', icon: 'sk_gardening', cat: 'garden',
    test: (sim, ob) => ob.st.growth >= 1 && !ob.st.dead ? (age(sim, 'child') || 'Слишком мал') : 'Ещё не созрело',
    ad: { fun: 12 }, adFn: (sim) => sim.has('green_thumb') ? 3 : 1.2, skill: 'gardening',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('garden');
      yield* a.loop(3, dt => game.gainSkill(sim, 'gardening', 1.5 * dt));
      game.harvestPlant(sim, ob);
    }
  });
  defAct('dispose_plant', {
    name: 'Выкопать', icon: 'm_trash', cat: 'garden',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('garden'); yield* a.wait(2);
      a.game.world.removeObject(ob.id); a.game.dirtyObjs();
    }
  });

  defAct('collect', {
    name: 'Подобрать', icon: 'm_gem', cat: 'collect',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 10 },
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('garden'); yield* a.wait(1.2);
      if (!game.world.objects.has(ob.id)) return;
      const c = ob.st.c;
      game.world.removeObject(ob.id); game.dirtyObjs();
      if (c && c.startsWith('seed:')) sim.inv.push({ k: 'seed', p: c.slice(5) });
      else sim.inv.push({ k: 'collect', c });
      const name = c && c.startsWith('seed:') ? 'семена: ' + (PLANTS[c.slice(5)] ? PLANTS[c.slice(5)].name.toLowerCase() : 'редкие') : COLLECT[c] ? COLLECT[c].name : 'находка';
      game.fx('text', sim, name);
      sim.stat('collected');
      a.note({ k: 'collect', c });
    }
  });

  defAct('mourn', {
    name: 'Скорбеть', icon: 'm_grave', cat: 'misc',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('cry');
      yield* a.loop(15, dt => sim.addNeed('social', 0.2 * dt));
      const m = sim.moods.find(x => x.k === 'mourning');
      if (m && m.until) m.until -= 600;
    }
  });
  defAct('read_epitaph', {
    name: 'Прочитать надпись', icon: 'm_book', cat: 'misc',
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('look'); yield* a.wait(1.5);
      const st = ob.st || {};
      a.game.notify('«Здесь покоится ' + (st.name || 'неизвестный житель') + (st.year ? ', ' + st.year + '–' + (st.year + 40 + (st.year % 37)) : '') + '. ' + (st.words || 'Спи спокойно.') + '»', { icon: 'm_grave' });
    }
  });
  defAct('explore_crypt', {
    name: 'Исследовать склеп', icon: 'm_ghost', cat: 'explore',
    test: (sim) => age(sim, 'teen') || 'Слишком мал',
    ad: { fun: 25 }, adFn: (sim) => sim.has('daredevil') || sim.has('brave') ? 1.2 : sim.has('coward') ? 0 : 0.2,
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      sim.hidden = true; sim.inside = ob.lot;
      yield* a.loop(60, dt => sim.addNeed('fun', 0.5 * dt), null, { noCancel: true });
      sim.hidden = false; sim.inside = null;
      const r = Math.random();
      if (r < 0.3) { const c = game.randomCollect(2); sim.inv.push({ k: 'collect', c }); game.notify(sim.first + ' нашёл' + S.genderize(sim, '', 'ла') + ' в склепе: ' + COLLECT[c].name + '.', { sim, icon: 'm_gem' }); }
      else if (r < 0.55) { sim.addMood(sim.has('brave') ? 'thrilled' : 'scared', game.t); game.notify(sim.first + ' встретил' + S.genderize(sim, '', 'а') + ' в склепе призрака и выскочил' + S.genderize(sim, '', 'а') + ' наружу быстрее ветра!', { sim, icon: 'm_ghost' }); }
      else if (r < 0.65) { const m = 50 + Math.floor(Math.random() * 250); game.earn(sim, m, 'Клад'); game.notify('В старом сундуке нашлись монеты: ' + S.fmtMoney(m) + '.', { sim, icon: 'm_money' }); }
      else { sim.addMood('fun_time', game.t); game.notify('Внутри только паутина и пыль. Зато было интересно.', { sim, icon: 'm_ghost' }); }
      a.note({ k: 'visit', lot: 'graveyard' });
    }
  });

  defAct('teleport', {
    name: 'Телепортироваться...', icon: 'm_sparkle', cat: 'misc',
    test: (sim) => age(sim, 'teen') || 'Слишком мал',
    menu: (sim, ob, game) => game.world.lots.filter(l => l.kind !== 'home' || l.id === game.hh(sim).lot).map(l => ({ label: l.name, opt: { lot: l.id } })),
    run: function* (a, sim, ob, opt) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      a.anim('spin'); game.fx('sparkle', sim); game.sound('teleport', sim);
      yield* a.wait(1);
      const lot = game.world.lots[opt.lot];
      const p = game.world.nearestWalkable(lot.entrance[0], lot.entrance[1], 6) || lot.curb;
      sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; sim.lot = game.world.lotAt(p[0], p[1]);
      game.fx('sparkle', sim);
      game.onArriveLot(sim, lot.id);
    }
  });

  defAct('read_paper', {
    name: 'Читать газету', icon: 'm_book', cat: 'read', soft: true,
    test: (sim) => age(sim, 'child') || 'Слишком мал',
    ad: { fun: 12 },
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('read_stand', 'paper');
      yield* a.loop(20, dt => { sim.addNeed('fun', 0.4 * dt); a.game.gainSkill(sim, 'logic', 0.05 * dt); });
    }
  });
  defAct('find_job_paper', {
    name: 'Искать работу', icon: 'm_briefcase', cat: 'misc',
    test: (sim) => age(sim, 'teen') || 'Слишком мал',
    run: function* (a, sim, ob) {
      if (!(yield* a.walkToObj(ob, 'adj'))) return;
      a.anim('read_stand', 'paper'); yield* a.wait(3);
      a.game.openJobs(sim);
    }
  });

  defAct('extinguish', {
    name: 'Тушить пожар', icon: 'm_fire', cat: 'fire',
    test: (sim) => age(sim, 'teen') || 'Слишком мал',
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'adj', { run: true }))) return;
      a.anim('panic');
      const risk = sim.has('brave') ? 0.01 : sim.has('clumsy') ? 0.06 : 0.03;
      let caught = false;
      yield* a.loop(4, dt => { if (Math.random() < risk * dt) caught = true; }, () => caught);
      if (caught) { game.setOnFire(sim); return; }
      if (game.world.objects.has(ob.id)) { game.world.removeObject(ob.id); game.dirtyObjs(); game.fireOut(); }
      if (sim.has('brave')) sim.addMood('thrilled', game.t);
    }
  });

  defAct('serve_plate', {
    name: 'Взять порцию', icon: 'm_food', cat: 'eat',
    test: (sim, ob) => ob.st.servings > 0 ? (sim.age === 'baby' || sim.age === 'toddler' ? 'Слишком мал' : true) : 'Пусто',
    ad: { hunger: 95 }, adFn: (sim) => sim.needs.hunger < 70 ? 1.4 : 0.2,
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      if (!game.world.objects.has(ob.id) || ob.st.servings <= 0) return;
      a.anim('reach'); yield* a.wait(0.5);
      ob.st.servings--;
      const food = { recipe: ob.st.recipe, q: ob.st.q, t: ob.st.t };
      if (ob.st.servings <= 0) game.platterEmpty(ob);
      yield* eatFood(a, sim, food);
    }
  });
  defAct('eat_plate', {
    name: 'Съесть', icon: 'm_food', cat: 'eat',
    test: (sim, ob) => (ob.st.eater && ob.st.eater !== sim.id) ? 'Это чужая тарелка' : (sim.age === 'baby' || sim.age === 'toddler' ? 'Слишком мал' : true),
    ad: { hunger: 90 },
    run: function* (a, sim, ob) {
      const game = a.game;
      if (!(yield* a.walkToObj(ob, 'front'))) return;
      if (!game.world.objects.has(ob.id)) return;
      const food = { recipe: ob.st.recipe, q: ob.st.q, t: ob.st.t };
      game.world.removeObject(ob.id); game.dirtyObjs();
      yield* eatFood(a, sim, food);
    }
  });

  Object.assign(S, { UPGRADES, paintStyle });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
