(function (S) {
  'use strict';
  const { OBJECTS, defAct, RECIPES } = S;
  const D = t => OBJECTS[t];
  const G = S.Game.prototype;

  RECIPES.pizza = { name: 'Пицца', lvl: 99, meal: 'any', cost: 0, prep: 0, hunger: 80, cook: 'none', veg: false, ing: [], hidden: true };
  RECIPES.fruitcake = { name: 'Фруктовый пирог', lvl: 99, meal: 'dessert', cost: 0, prep: 0, hunger: 40, cook: 'none', veg: true, ing: [], hidden: true };

  const CAR = { firefighter: 'firetruck', police: 'police', pizza: 'pizza', repairman: 'van', repo: 'van', social: 'car', maid: 'car', burglar: 'car' };

  function* arrive(a, sim, lot, goals) {
    const game = a.game;
    a.opt.carKind = CAR[sim.svc] || 'car';
    if (sim.svc === 'reaper') return true;
    const ok = yield* a.walk(goals && goals.length ? goals : [lot.doorIn || lot.entrance], {});
    return ok;
  }
  function* depart(a, sim) {
    const game = a.game, world = game.world;
    if (sim.svc === 'reaper') { game.fx('sparkle', sim); game.removeSim(sim); return; }
    const lot = world.lots[sim.lot];
    const curb = lot ? lot.curb : world.nearestWalkable(sim.x, sim.y, 20, (x, y) => world.ter(x, y) === S.TER.walk);
    if (curb) yield* a.walk([world.walkable(curb[0], curb[1]) ? curb : world.nearestWalkable(curb[0], curb[1], 4) || curb], { noCar: true });
    const far = game.roadTile([Math.floor(sim.x) + (Math.random() < 0.5 ? -40 : 40), Math.floor(sim.y) + (Math.random() < 0.5 ? -40 : 40)]);
    const car = lot && far ? game.spawnCar(sim, lot.lane, far, CAR[sim.svc] || 'car') : null;
    if (car) {
      let t = 0;
      while (!car.boarded && t < 40) { yield; t += a.dt; }
      car.leave = true;
    }
    game.removeSim(sim);
  }

  defAct('svc_leave', { name: 'Уйти', icon: 'm_walk', hidden: true, test: () => true, run: function* (a, sim) { yield* depart(a, sim); } });

  defAct('svc_reaper', {
    name: 'Забрать душу', icon: 'm_grave', hidden: true, test: () => true,
    run: function* (a, sim, dead, opt) {
      const game = a.game, world = game.world;
      game.fx('sparkle', sim);
      game.sound('reaper', sim);
      if (dead) {
        const goals = S.adjTilesSim(game, dead);
        yield* a.walk(goals, { noCar: true });
        a.face(dead.x, dead.y);
      }
      a.anim('reap', 'scythe');
      yield* a.wait(8);
      if (dead) {
        dead.hidden = true;
        const hh = game.hh(dead);
        let lot = hh && hh.lot >= 0 ? game.lots[hh.lot] : null;
        let spot = null;
        if (lot && dead.lot === lot.id) spot = world.nearestWalkable(dead.x, dead.y, 4, (x, y) => !world.indoor(x, y) && world.lotAt(x, y) === lot.id) || world.nearestWalkable(dead.x, dead.y, 3);
        if (!spot && lot) spot = world.nearestWalkable(lot.x + 2, lot.y + 2, 10, (x, y) => world.lotAt(x, y) === lot.id && !world.indoor(x, y));
        if (!spot) { const gy = world.lotByKey.graveyard; spot = world.nearestWalkable(gy.x + 14, gy.y + 14, 10, (x, y) => world.lotAt(x, y) === gy.id); }
        if (spot) {
          const year = 2000 - Math.round((S.ageIdx(dead.age) * 12) + 10);
          world.placeObject('tombstone', spot[0], spot[1], 2, { lot: world.lotAt(spot[0], spot[1]), st: { name: dead.first + ' ' + dead.last, year, words: opt.svc.words, sim: dead.id } });
          const tombLot = game.lots[world.lotAt(spot[0], spot[1])];
          if (tombLot) tombLot.dirty = true;
          game.dirtyObjs();
        }
        game.afterDeath(dead);
      }
      yield* depart(a, sim);
    }
  });

  G.afterDeath = function (dead) {
    const hh = this.hh(dead);
    for (const s of this.sims.values()) if (s.carry === dead.id) s.carry = null;
    if (hh && hh.id === this.activeHH) {
      const alive = this.members(hh);
      if (!alive.length) { if (this.hooks.dialog) this.hooks.dialog('gameover', { hh }); }
      else if (this.sel === dead.id) this.sel = alive[0].id;
    }
    if (hh && hh.id !== this.activeHH && !this.members(hh).length) {
      const lot = this.lots[hh.lot];
      if (lot) { lot.hh = null; lot.sale = true; }
    }
  };

  defAct('svc_firefighter', {
    name: 'Тушить пожар', icon: 'm_fire', hidden: true, test: () => true,
    run: function* (a, sim, lot) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.frontDoor || lot.entrance].filter(Boolean));
      let guard = 0;
      while (game.fires.some(f => f.lot === lot.id) && guard++ < 30) {
        const f = game.fires.filter(q => q.lot === lot.id).sort((p, q) => Math.hypot(p.x - sim.x, p.y - sim.y) - Math.hypot(q.x - sim.x, q.y - sim.y))[0];
        const goals = [];
        for (let k = 0; k < 4; k++) { const nx = f.x + S.DX[k], ny = f.y + S.DY[k]; if (world.walkable(nx, ny, f.lv || 0)) goals.push([nx, ny, f.lv || 0]); }
        if (goals.length) yield* a.walk(goals, { run: true, noCar: true });
        a.face(f.x + 0.5, f.y + 0.5);
        a.anim('extinguish', 'hose');
        yield* a.wait(2.5);
        if (world.objects.has(f.id)) world.removeObject(f.id);
        game.fireOut(); game.dirtyObjs();
      }
      for (const s of game.sims.values()) if (s.burning) { s.burning = 0; s.addMood('scared', game.t); }
      if (game.isActive(game.selected() || sim)) game.notify('Пожарные потушили огонь.', { icon: 'm_fire', force: true, minor: true });
      yield* depart(a, sim);
    }
  });

  defAct('svc_burglar', {
    name: 'Красть', icon: 'm_hand', hidden: true, test: () => true,
    run: function* (a, sim, lot, opt) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.doorIn || lot.entrance].filter(Boolean));
      const loot = world.objectsInLot(lot.id, o => !D(o.t).hidden && D(o.t).price >= 150 && D(o.t).size[0] * D(o.t).size[1] <= 2 && o.layer !== 'wall' && !D(o.t).lotItem).sort((p, q) => D(q.t).price - D(p.t).price)[0];
      const alarm = world.objectsInLot(lot.id, o => D(o.t).burglar).length > 0;
      if (loot && (yield* a.walkToObj(loot, 'front'))) {
        a.anim('steal');
        if (alarm) {
          game.sound('burglar_alarm', sim);
          game.notify('Сработала охранная сигнализация! Полиция уже в пути.', { icon: 'm_hand', force: true });
          game.services.push({ kind: 'police', at: game.t + 6, lot: lot.id, burglar: sim.id });
          opt.svc.caught = false;
          let t = 0;
          while (t < 25 && !opt.svc.caught) { yield; t += a.dt; }
          if (opt.svc.caught) { game.notify('Полиция задержала грабителя! Город выплатил награду ' + S.fmtMoney(500) + '.', { icon: 'm_star', force: true }); const hh = game.households.get(lot.hh); if (hh) hh.funds += 500; game.removeSim(sim); return; }
        } else yield* a.wait(4);
        if (world.objects.has(loot.id)) {
          const name = D(loot.t).name;
          world.removeObject(loot.id); game.dirtyObjs();
          game.notify('Ночью в дом забрался грабитель и унёс: ' + name + '.', { icon: 'm_hand', force: true });
        }
      }
      yield* depart(a, sim);
    }
  });

  defAct('svc_police', {
    name: 'Задержать', icon: 'm_fist', hidden: true, test: () => true,
    run: function* (a, sim, lot, opt) {
      const game = a.game;
      yield* arrive(a, sim, lot, [lot.doorIn || lot.entrance].filter(Boolean));
      const b = game.sims.get(opt.svc.burglar);
      if (b && !b.dead && game.sims.has(b.id)) {
        yield* a.walk(S.adjTilesSim(game, b), { run: true, noCar: true });
        a.anim('fight'); b.anim = 'fight'; game.fx('dust', sim);
        yield* a.wait(4);
        const bs = game.services.find(s => s.kind === 'burglar' && !s.done);
        if (bs) bs.caught = true;
      }
      yield* depart(a, sim);
    }
  });

  defAct('svc_repairman', {
    name: 'Ремонтировать', icon: 'sk_handiness', hidden: true, test: () => true,
    run: function* (a, sim, lot) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.doorIn || lot.entrance].filter(Boolean));
      const hh = game.households.get(lot.hh);
      for (const ob of world.objectsInLot(lot.id, o => o.broken)) {
        if (!(yield* a.walkToObj(ob, 'front'))) continue;
        a.anim('repair', 'wrench');
        yield* a.wait(12);
        ob.broken = false; game.dirtyObjs();
        if (hh) hh.funds -= 50;
      }
      game.notify('Мастер всё починил.', { icon: 'sk_handiness', force: true, minor: true });
      yield* depart(a, sim);
    }
  });

  defAct('svc_maid', {
    name: 'Убирать', icon: 'm_sparkle', hidden: true, test: () => true,
    run: function* (a, sim, lot) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.doorIn || lot.entrance].filter(Boolean));
      const dirty = world.objectsInLot(lot.id, o => D(o.t).dirtyDish || D(o.t).puddle || D(o.t).pile || o.t === 'newspaper' || (o.dirt || 0) > 25 || (D(o.t).trash && o.st.fill >= 2));
      for (const ob of dirty.slice(0, 20)) {
        if (!world.objects.has(ob.id)) continue;
        if (!(yield* a.walkToObj(ob, D(ob.t).place === 'rug' ? 'adj' : 'front'))) continue;
        a.anim(D(ob.t).puddle ? 'mop' : 'clean', D(ob.t).puddle ? 'mop' : 'sponge');
        yield* a.wait(2);
        if (D(ob.t).dirtyDish || D(ob.t).puddle || D(ob.t).pile || ob.t === 'newspaper') world.removeObject(ob.id);
        else { ob.dirt = 0; if (D(ob.t).trash) ob.st.fill = 0; }
        game.dirtyObjs();
      }
      yield* depart(a, sim);
    }
  });

  defAct('svc_pizza', {
    name: 'Доставить пиццу', icon: 'm_food', hidden: true, test: () => true,
    run: function* (a, sim, lot) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.frontDoor || lot.entrance].filter(Boolean));
      a.anim('wave', 'pizza'); game.sound('doorbell', sim);
      yield* a.wait(1.5);
      const p = game.freeSurfaceNear((lot.doorIn || lot.entrance)[0], (lot.doorIn || lot.entrance)[1], 8);
      if (p) {
        world.placeObject('platter', p[0], p[1], 0, { lot: lot.id, st: { recipe: 'pizza', q: 3, t: game.t, servings: 6 } });
        game.dirtyObjs();
        game.notify('Пицца доставлена! Коробка ждёт на столе.', { icon: 'm_food', force: true, minor: true });
      } else {
        const hh = game.households.get(lot.hh);
        const any = hh ? game.members(hh)[0] : null;
        if (any) any.inv.push({ k: 'food', recipe: 'pizza', q: 3 });
        game.notify('Пиццу некуда поставить. Курьер оставил её в инвентаре.', { icon: 'm_food', force: true, minor: true });
      }
      yield* depart(a, sim);
    }
  });

  defAct('svc_social', {
    name: 'Привезти ребёнка', icon: 'm_baby', hidden: true, test: () => true,
    run: function* (a, sim, lot, opt) {
      const game = a.game;
      yield* arrive(a, sim, lot, [lot.frontDoor || lot.entrance].filter(Boolean));
      a.anim('wave'); game.sound('doorbell', sim);
      yield* a.wait(2);
      const hh = game.households.get(lot.hh);
      if (opt.svc.take) {
        const kid = game.sims.get(opt.svc.take);
        if (kid && !kid.dead) {
          if (hh) hh.members = hh.members.filter(id => id !== kid.id);
          game.removeSim(kid);
          game.notify('Социальный работник забрал ' + kid.first + ' из семьи: о малыше совсем не заботились.', { icon: 'm_baby', force: true });
          for (const s of game.members(hh)) s.addMood('sad', game.t, { dur: 2880 });
        }
        yield* depart(a, sim);
        return;
      }
      if (hh && opt.svc.age) {
        const age = opt.svc.age;
        const gender = game.rng.chance(0.5) ? 'm' : 'f';
        const kid = S.randomSim(game.rng, { gender, age, last: hh.name });
        kid.npc = false;
        game.addSim(kid, hh);
        kid.ageDays = 0;
        const by = game.sims.get(opt.svc.by);
        const parents = game.members(hh).filter(s => S.isAdultish(s.age));
        kid.parents = parents.slice(0, 2).map(p => p.id);
        for (const p of parents) { const r = game.rel(p, kid); r.met = true; r.v = 40; }
        const p = game.world.nearestWalkable(sim.x, sim.y, 3, null, sim.lv || 0);
        if (p) { kid.x = p[0] + 0.5; kid.y = p[1] + 0.5; kid.lv = sim.lv || 0; kid.lot = lot.id; }
        if (kid.isBaby && by) game.pickUp(by, kid);
        game.notify('В семье пополнение: ' + kid.first + ' теперь с вами!', { icon: 'm_baby', force: true });
        for (const s of game.members(hh)) if (!s.isBaby) s.addMood('new_baby', game.t);
        if (by) game.note(by, { k: 'baby' });
        if (game.hooks.dialog) game.hooks.dialog('name', { sim: kid });
      }
      yield* depart(a, sim);
    }
  });

  defAct('svc_repo', {
    name: 'Описать имущество', icon: 'm_money', hidden: true, test: () => true,
    run: function* (a, sim, lot, opt) {
      const game = a.game, world = game.world;
      yield* arrive(a, sim, lot, [lot.doorIn || lot.entrance].filter(Boolean));
      let need = opt.svc.amount;
      const essential = o => { const d = D(o.t); return d.fridge || d.stove || d.toilet || d.shower || d.tub || d.bed || d.crib; };
      const list = world.objectsInLot(lot.id, o => !D(o.t).hidden && !D(o.t).lotItem && D(o.t).price > 0).sort((p, q) => (essential(p) ? 1 : 0) - (essential(q) ? 1 : 0) || D(q.t).price - D(p.t).price);
      const taken = [];
      for (const ob of list) {
        if (need <= 0) break;
        if (!(yield* a.walkToObj(ob, ob.layer === 'wall' ? 'front' : 'front'))) continue;
        a.anim('steal'); yield* a.wait(1.5);
        if (!world.objects.has(ob.id)) continue;
        world.removeObject(ob.id); game.dirtyObjs();
        taken.push(D(ob.t).name);
        need -= Math.round(D(ob.t).price * 0.8);
      }
      const hh = game.households.get(lot.hh);
      if (hh) { hh.bills = []; for (const s of game.members(hh)) s.addMood('repo', game.t); }
      game.notify('Судебный пристав забрал за долги: ' + (taken.join(', ') || 'ничего') + '.', { icon: 'm_money', force: true });
      yield* depart(a, sim);
    }
  });

  G.onArriveLotBase = G.onArriveLot;
  G.onArriveLot = function (sim, lotId) {
    this.onArriveLotBase(sim, lotId);
    const v = sim.visitor;
    if (v && v.waiting && lotId === v.lot && !v.rang) {
      v.rang = true; v.waitSince = this.t;
      this.sound('doorbell', sim);
      const hh = this.households.get(this.lots[lotId].hh);
      if (hh && hh.id === this.activeHH) this.notify(sim.first + ' ' + sim.last + ' стоит у двери. Щёлкните по гостю и выберите «Пригласить в дом».', { icon: 'm_house', force: true, minor: true });
      if (v.wagon && this.flags.wagonCake) {
        this.flags.wagonCake = false;
        const lot = this.lots[lotId];
        const p = lot.doorIn ? this.freeSurfaceNear(lot.doorIn[0], lot.doorIn[1], 8) : null;
        if (p) { this.world.placeObject('platter', p[0], p[1], 0, { lot: lotId, st: { recipe: 'fruitcake', q: 3, t: this.t, servings: 4 } }); this.dirtyObjs(); }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
