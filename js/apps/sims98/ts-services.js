(function (S) {
  'use strict';
  const DAY = 1440, PAPER_AT = 380, BILL_AT = 480, MAIL_AT = 510, COLLECT_AT = 600, MAID_AT = 600, BILL_DAYS = [1, 4], RED_DAYS = 3, COLLECT_EXTRA = 1.1;
  const BURGLAR_FIRST = [2, 5], BURGLAR_GAP = [9, 18], BURGLAR_HOURS = [20, 150], STEAL_MINS = 30, PATROL = 90, FALSE_ALARM = 500, RECOVER = 0.5, RECOVER_DAYS = [1, 3];
  const MAID_FEE = 50, MAID_TASK = 10, MAID_LEAVE = 780, REPAIR_FEE = 60, REPAIR_ITEM = 40, REPAIR_DELAY = [30, 90], REPAIR_MINS = 30;
  const NANNY_HOUR = 15, NANNY_FLOOR = 45, PIZZA_PRICE = 40, PIZZA_DELAY = [30, 50], PIZZA_LATE = 60, PIZZA_Q = 6;
  const ALONE_ASK = 10, ALONE_STRIKE = 180, STRIKES = 3, DUTY_LIMIT = 300, LETTER = 0.25, REFUND = [20, 80];
  const STEAL = ['computer', 'tv', 'stereo', 'easel', 'chess', 'lamp'], KEEP = new Set(['fridge', 'stove', 'counter', 'kitchen_sink', 'toilet', 'shower', 'bathtub', 'bath_sink', 'bed', 'small_bed', 'mailbox', 'trash', 'garden', 'pond', 'aquarium']);
  const ROLES = {
    mail: ['Почтальон', 'Почтальонша', 'adult'], paper: ['Разносчик газет', 'Разносчица газет', 'teen'], maid: ['Горничная', 'Горничная', 'adult'],
    repair: ['Мастер', 'Мастер', 'adult'], nanny: ['Няня', 'Няня', 'teen'], pizza: ['Разносчик пиццы', 'Разносчица пиццы', 'teen'],
    police: ['Полицейский', 'Полицейская', 'police'], fire: ['Пожарный', 'Пожарная', 'adult'], burglar: ['Вор', 'Воровка', 'crime'],
    collector: ['Коллектор', 'Коллектор', 'adult'], social: ['Сотрудник опеки', 'Сотрудница опеки', 'adult']
  };
  const RIDES = { police: 'police', fire: 'fire', pizza: 'pizza', repair: 'repair' };
  const PHONE = {
    pizza: 'Заказать пиццу', maid: 'Нанять горничную', maidOff: 'Отказаться от горничной', repair: 'Вызвать мастера', nanny: 'Вызвать няню',
    nannyOff: 'Отказаться от няни', police: 'Вызвать полицию', fire: 'Вызвать пожарных', report: 'Заявить о краже'
  };

  S.ADS.pay_bills = { id: 'pay_bills', obj: 'mailbox', name: 'Оплатить счета', icon: 'money', age: 'teen', player: true, steps: [{ pose: 'front', clip: 'use', mins: 3, pay: true }] };
  S.ADS.paper_read = { id: 'paper_read', obj: 'mailbox', name: 'Почитать газету', icon: 'scroll', age: 'child', player: true, steps: [{ pose: 'front', clip: 'use', mins: 2 }, { seat: 'any', clip: 'read', standClip: 'readStand', mins: 15, gain: { fun: 12 }, paper: true }] };
  S.ADS.mailbox_check.steps[0].mail = true;
  S.OBJECTS.mailbox.ads.push('pay_bills', 'paper_read');

  const now = world => world.day * DAY + world.clock;
  const weekday = day => (day - 1) % 7;
  const workday = day => weekday(day) >= 1 && weekday(day) <= 5;
  const span = (rng, [a, b]) => a + Math.floor(S.roll(rng) * (b - a + 1));
  const hashOf = text => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const home = world => world.family[0].home;
  const itemOf = (lot, base) => lot.house.items.find(i => S.baseOf(i) === base && !i.gone) || null;
  const roleName = (kind, sim) => ROLES[kind][sim.sex === 'f' ? 1 : 0];

  const fresh = seed => ({
    rng: { rs: (seed * 2654435761 + 97) >>> 0 }, mail: { bills: [], letters: [], fresh: 0 }, out: { bills: [], letters: [] }, paper: -1,
    burglar: -1, maid: 0, nanny: 0, pizza: [], repair: -1, stolen: [], strikes: 0, strikeDay: -1, alone: {}, asked: 0, police: -1, fire: -1, report: -1, done: {}
  });

  const svcOf = world => world.service || (world.service = fresh(world.seed || 1));

  const event = (world, text, extra) => world.events.push(Object.assign({ type: 'service', text }, extra || {}));

  const news = (world, text) => {
    if (S.News) S.News.add(world, text);
  };

  const caretakers = (world, lot) => world.family.filter(s => S.AGE_RANK[s.age] >= S.AGE_RANK.teen && s.lot === lot && !s.inside && !s.car && s.needs);

  const placeAt = (lot, item) => {
    const p = S.Sim.placesOf(lot, item, item.outdoor ? 'near' : 'front')[0];
    return { x: p.x, z: p.z, f: item.floor || 0, tx: lot.x + item.x, tz: lot.z + item.z };
  };

  const gate = lot => ({ x: lot.doorOut[0], z: lot.doorOut[1], f: 0, tx: lot.x + lot.w / 2, tz: lot.z + lot.d / 2 });

  const task = (e, place, mins, clip, a) => Object.assign({ e, m: mins, c: clip, a: a === undefined ? -1 : a }, place);

  S.Services = {
    ROLES, PHONE, PIZZA_PRICE, MAID_FEE, MAID_TASK, REPAIR_FEE, REPAIR_ITEM, NANNY_HOUR, FALSE_ALARM, RED_DAYS, BILL_DAYS,

    of: svcOf,

    init(world) {
      world.service = fresh(world.seed || 1);
      const s = world.service, lot = home(world);
      lot.house.alarm = true;
      lot.house.detector = true;
      s.burglar = (span(s.rng, BURGLAR_FIRST) + 1) * DAY + span(s.rng, BURGLAR_HOURS);
    },

    roleName,

    staff(world, kind, skip) {
      const want = ROLES[kind][2], pool = world.sims.filter(o => o.free && !o.duty && !o.visit && !world.family.includes(o) && !(skip || []).includes(o));
      const fits = o => (want === 'teen' ? o.age === 'teen' : want === 'police' ? o.age === 'adult' && o.work && o.work.id === 'police' : want === 'crime' ? o.age === 'adult' && o.work && o.work.id === 'crime' : o.age === 'adult' && !o.work);
      let list = pool.filter(fits);
      if (!list.length && want !== 'teen') list = pool.filter(o => o.age === 'adult' && !o.work);
      if (!list.length) return null;
      return list[hashOf(kind) % list.length];
    },

    onDuty: (world, kind) => world.sims.filter(o => o.duty && o.duty.kind === kind),

    dispatch(world, kind, tasks, opts) {
      const lot = home(world), sim = S.Services.staff(world, kind, opts && opts.skip);
      if (!sim) return null;
      if ((kind === 'police' || kind === 'fire') && !sim.live && !sim.car) S.Services.toPatrol(world, sim, lot);
      const door = lot.doorOut, t = now(world);
      sim.duty = { kind, lot: lot.index, phase: 'go', sent: 0, door: [door[0], door[1]], tasks, i: 0, wait: -1, moving: 0, until: t + DUTY_LIMIT + (opts && opts.long ? DUTY_LIMIT * 3 : 0), ride: RIDES[kind] || (sim.hasCar || kind === 'burglar' ? null : 'carpool'), paid: 0, by: opts && opts.by !== undefined ? opts.by : -1 };
      return sim;
    },

    step(world, dt) {
      const s = svcOf(world), t = now(world), lot = home(world), minute = world.clock, day = world.day;
      const once = (key, at) => {
        if (minute < at || s.done[key] === day) return false;
        s.done[key] = day;
        return true;
      };
      if (once('paper', PAPER_AT)) S.Services.dispatch(world, 'paper', [task('paper', placeAt(lot, itemOf(lot, 'mailbox')), 3, 'use')]);
      if (BILL_DAYS.includes(weekday(day)) && once('bill', BILL_AT)) s.out.bills.push({ amount: S.Econ.billAmount(world), day, red: 0 });
      if (workday(day) && once('mail', MAIL_AT)) {
        if (S.roll(s.rng) < LETTER) s.out.letters.push(S.roll(s.rng) < 0.5 ? { kind: 'coupon', id: Object.keys(S.Econ.COUPONS)[Math.floor(S.roll(s.rng) * Object.keys(S.Econ.COUPONS).length)] } : { kind: 'refund', amount: span(s.rng, REFUND) });
        if (s.out.bills.length || s.out.letters.length) S.Services.dispatch(world, 'mail', [task('mail', placeAt(lot, itemOf(lot, 'mailbox')), 3, 'use')]);
      }
      for (const bill of s.mail.bills) {
        if (!bill.red && t >= (bill.day + RED_DAYS) * DAY + MAIL_AT) {
          bill.red = 1;
          event(world, 'Счёт на §' + bill.amount + ' просрочен, письмо стало красным', { bad: true });
        }
        if (bill.red && !S.Services.onDuty(world, 'collector').length && t >= (bill.day + RED_DAYS + 1) * DAY + COLLECT_AT && t < (bill.day + RED_DAYS + 1) * DAY + COLLECT_AT + 120) S.Services.sendCollector(world);
      }
      if (s.maid && once('maid', MAID_AT) && S.Upkeep.tasks(world, lot).length) S.Services.sendMaid(world);
      if (s.burglar >= 0 && t >= s.burglar) {
        s.burglar = (day + span(s.rng, BURGLAR_GAP)) * DAY + span(s.rng, BURGLAR_HOURS);
        S.Services.sendBurglar(world);
      }
      if (s.repair >= 0 && t >= s.repair) {
        s.repair = -1;
        S.Services.sendRepair(world);
      }
      for (const order of s.pizza.filter(o => !o.sent && t >= o.at)) {
        order.sent = 1;
        S.Services.dispatch(world, 'pizza', [task('pizza', gate(lot), 2, 'use', order.made)]);
      }
      s.pizza = s.pizza.filter(o => !o.sent || S.Services.onDuty(world, 'pizza').length);
      if (s.report >= 0 && t >= s.report) {
        s.report = -1;
        S.Services.recover(world);
      }
      if (S.Food.burning(lot) && lot.house.detector && !S.Services.onDuty(world, 'fire').length) S.Services.sendFire(world);
      S.Services.watchKids(world, dt);
      for (const sim of world.sims) if (sim.duty) S.Services.stepDuty(world, sim, dt);
    },

    toPatrol(world, sim, lot) {
      const M = S.METRICS.town, side = lot.doorOut[0] < M / 2 ? 1 : -1, node = world.roads.nearest(lot.doorOut[0] + side * PATROL, lot.doorOut[1]);
      Object.assign(sim, { inside: null, trip: null, path: null, order: null, after: null, then: null, floor: 0, state: 'idle', x: node.x, z: node.z });
      sim.lot = world.ground.lotAt(sim.x, sim.z);
      sim.y = S.Sim.groundY(world, 0, sim.lot, sim.x, sim.z);
    },

    stepDuty(world, sim, dt) {
      const d = sim.duty, lot = world.lots[d.lot], t = now(world);
      if (t > d.until && d.phase !== 'leave') {
        S.Services.leave(world, sim);
        return;
      }
      if (d.phase === 'caught') return;
      if (d.phase === 'go') {
        if (!d.sent) {
          d.sent = 1;
          S.Sim.go(world, sim, { x: d.door[0], z: d.door[1], floor: 0, lot, ride: d.ride, car: d.ride || sim.hasCar ? undefined : false });
          return;
        }
        if (S.Sim.busy(sim)) return;
        d.phase = 'work';
        S.Services.arrived(world, sim);
        return;
      }
      if (d.phase === 'work') {
        const step = d.tasks[d.i];
        if (!step) {
          S.Services.leave(world, sim);
          return;
        }
        if (d.wait < 0) {
          if (!d.moving) {
            d.moving = 1;
            S.Sim.go(world, sim, { x: step.x, z: step.z, floor: step.f, lot, car: false });
            return;
          }
          if (S.Sim.busy(sim)) return;
          d.moving = 0;
          d.wait = step.m;
          sim.yaw = Math.atan2(step.tx - sim.x, step.tz - sim.z);
          S.Sim.hold(sim, step.m, step.c);
          return;
        }
        d.wait -= dt;
        if (d.wait > 0) return;
        d.wait = -1;
        S.Services.effect(world, sim, step);
        if (sim.duty === d) d.i++;
        return;
      }
      if (!d.sent) {
        d.sent = 1;
        const back = sim.home;
        S.Sim.go(world, sim, { x: back.doorOut[0], z: back.doorOut[1], floor: 0, lot: back, enter: back, ride: d.ride, car: d.ride || sim.hasCar ? undefined : false });
        return;
      }
      if (S.Sim.busy(sim)) return;
      sim.duty = null;
      sim.dayIndex = -1;
    },

    arrived(world, sim) {
      const d = sim.duty, lot = world.lots[d.lot];
      if (d.kind === 'burglar') S.Services.burglarInside(world, sim);
      if (d.kind === 'police') {
        const thief = S.Services.onDuty(world, 'burglar').find(o => o.duty.phase !== 'leave');
        if (thief) {
          d.tasks = [task('arrest', { x: thief.x + 1, z: thief.z, f: thief.floor, tx: thief.x, tz: thief.z }, 6, 'point', world.sims.indexOf(thief))];
          thief.duty.phase = 'caught';
          thief.duty.until = now(world) + DUTY_LIMIT;
          S.Sim.cancel(world, thief);
          S.Sim.hold(thief, 60, 'idle');
        } else if (d.by >= 0) {
          d.tasks = [task('falseAlarm', gate(lot), 3, 'talk')];
        }
      }
      if (d.kind === 'fire') d.tasks = S.Services.fireTasks(world, lot);
      if (d.kind === 'maid') d.tasks = S.Upkeep.tasks(world, lot).map(c => S.Services.cleanTask(lot, c));
      if (d.kind === 'repair') d.tasks = S.Upkeep.brokenItems(lot).map(item => task('fix', placeAt(lot, item), REPAIR_MINS, 'use', lot.house.items.indexOf(item)));
      if (d.kind !== 'burglar') event(world, roleName(d.kind, sim) + ' на месте: ' + sim.name, { quiet: d.kind === 'paper' || d.kind === 'mail' });
    },

    cleanTask(lot, chore) {
      if (chore.kind === 'puddle') {
        const p = chore.puddle, [x, z] = S.Upkeep.mopSpot(lot, p);
        return task('clean', { x, z, f: p[2], tx: p[0], tz: p[1] }, 6, 'wash', 'puddle:' + p[0] + ':' + p[1] + ':' + p[2]);
      }
      const mins = chore.kind === 'dishes' ? 15 : chore.kind === 'trash' ? 5 : 10;
      return task('clean', placeAt(lot, chore.item), mins, chore.kind === 'trash' ? 'use' : 'wash', chore.kind + ':' + lot.house.items.indexOf(chore.item));
    },

    fireTasks(world, lot) {
      const k = lot.kitchen;
      if (!k || !k.fires.length) return [];
      return k.fires.map(f => task('extinguish', placeAt(lot, lot.house.items[f.item]), 4, 'point', f.item));
    },

    effect(world, sim, step) {
      const d = sim.duty, lot = world.lots[d.lot], s = svcOf(world);
      if (step.e === 'paper') s.paper = world.day;
      if (step.e === 'mail') {
        s.mail.bills.push(...s.out.bills);
        s.mail.letters.push(...s.out.letters);
        s.mail.fresh = s.out.bills.length + s.out.letters.length;
        s.out = { bills: [], letters: [] };
        if (s.mail.fresh) event(world, 'Почта пришла: ' + S.Services.mailText(world), { mail: true });
      }
      if (step.e === 'clean') {
        const [kind, a, b, c] = String(step.a).split(':');
        if (kind === 'puddle') {
          const u = S.Upkeep.of(lot), p = u.puddles.find(q => q[0] === +a && q[1] === +b && q[2] === +c);
          if (p) S.Upkeep.clean(world, lot, { kind, puddle: p });
        } else S.Upkeep.clean(world, lot, { kind, item: lot.house.items[+a] });
        d.paid++;
      }
      if (step.e === 'fix') {
        if (S.Upkeep.fix(world, lot, lot.house.items[step.a])) d.paid++;
      }
      if (step.e === 'extinguish') {
        for (const fire of (lot.kitchen ? lot.kitchen.fires.slice() : [])) S.Food.putOut(world, lot, fire, null);
        if (!S.Food.burning(lot)) {
          event(world, roleName('fire', sim) + ' ' + sim.name + ': «Огонь потушен. Плиту без присмотра не оставляйте»');
          news(world, 'Пожарные потушили пожар в доме семьи ' + (world.family[0].surname || world.family[0].name) + '. Никто не пострадал.');
          d.tasks = d.tasks.slice(0, d.i + 1);
        }
      }
      if (step.e === 'steal') S.Services.steal(world, sim, lot.house.items[step.a]);
      if (step.e === 'take') S.Services.repo(world, sim, lot.house.items[step.a]);
      if (step.e === 'arrest') S.Services.arrest(world, sim, world.sims[step.a]);
      if (step.e === 'falseAlarm') {
        const fine = Math.min(world.funds, FALSE_ALARM);
        world.funds -= fine;
        event(world, 'Ложный вызов полиции: штраф §' + fine, { bad: true, amount: -fine });
      }
      if (step.e === 'pizza') S.Services.deliverPizza(world, sim, step);
      if (step.e === 'watch') S.Services.watch(world, sim, step);
      if (step.e === 'social') S.Services.takeChild(world, sim, world.sims[step.a]);
    },

    leave(world, sim) {
      const d = sim.duty;
      if (!d || d.phase === 'leave') return;
      const fee = d.kind === 'maid' ? MAID_FEE + d.paid * MAID_TASK : d.kind === 'repair' && d.paid ? Math.round((REPAIR_FEE + d.paid * REPAIR_ITEM) * (S.Econ.coupon(world, 'repair') || 1)) : d.kind === 'nanny' ? Math.max(1, Math.round((now(world) - (d.start || now(world))) / 60)) * NANNY_HOUR : 0;
      if (fee) S.Services.charge(world, fee, roleName(d.kind, sim) + ' ' + sim.name);
      if (d.kind === 'repair' && d.paid) for (const s of world.family) if (s.lot === world.lots[d.lot]) S.Moods.add(s, 'repairBill', 0, world);
      d.phase = 'leave';
      d.sent = 0;
      d.until = now(world) + DUTY_LIMIT;
    },

    charge(world, fee, who) {
      if (S.Econ.spend(world, fee)) {
        world.events.push({ type: 'money', amount: -fee, text: who + ': оплата −§' + fee });
        return true;
      }
      svcOf(world).mail.bills.push({ amount: fee, day: world.day, red: 0, from: who });
      world.events.push({ type: 'money', amount: 0, full: true, text: who + ': денег не хватило, пришлют счёт на §' + fee });
      return false;
    },

    mailText(world) {
      const m = svcOf(world).mail, bills = m.bills.filter(b => !b.paid), parts = [];
      if (bills.length) parts.push('счета на §' + bills.reduce((n, b) => n + b.amount, 0));
      if (m.letters.length) parts.push(m.letters.length === 1 ? 'письмо' : 'письма: ' + m.letters.length);
      return parts.join(', ') || 'пусто';
    },

    unpaid(world) {
      return svcOf(world).mail.bills.filter(b => !b.paid);
    },

    due(world) {
      return S.Services.unpaid(world).reduce((n, b) => n + b.amount, 0);
    },

    payBills(world, sim) {
      const list = S.Services.unpaid(world).sort((a, b) => a.day - b.day);
      let paid = 0, n = 0;
      for (const bill of list) {
        if (!S.Econ.spend(world, bill.amount)) break;
        bill.paid = 1;
        paid += bill.amount;
        n++;
      }
      const s = svcOf(world);
      s.mail.bills = s.mail.bills.filter(b => !b.paid);
      if (!n) {
        world.events.push({ type: 'money', amount: 0, full: true, text: list.length ? 'На счета не хватает денег' : 'Счетов нет' });
        return 0;
      }
      if (sim && sim.wish) S.Wishes.bump(sim, 'billsPaid');
      if (sim && sim.wish && !list.slice(0, n).some(b => b.red)) S.Wishes.bump(sim, 'billsOnTime');
      if (sim && sim.skill) S.Skills.stat(world, sim, 'billsPaid', n);
      world.events.push({ type: 'money', amount: -paid, sim: sim ? sim.id : null, text: 'Оплачено счетов: ' + n + ', −§' + paid + (s.mail.bills.length ? '. Остались ещё' : '') });
      return paid;
    },

    readMail(world, sim) {
      const s = svcOf(world), letters = s.mail.letters;
      s.mail.fresh = 0;
      for (const letter of letters) {
        if (letter.kind === 'refund') S.Econ.earn(world, letter.amount, 'Письмо: возврат переплаты +§' + letter.amount, sim);
        if (letter.kind === 'coupon') {
          S.Econ.keepCoupon(world, letter.id);
          if (sim.wish) S.Wishes.bump(sim, 'coupon');
          world.events.push({ type: 'money', amount: 0, sim: sim.id, text: 'Письмо с купоном: ' + S.Econ.COUPONS[letter.id][0].toLowerCase() });
        }
      }
      if (letters.length) S.Moods.add(sim, 'goodNews', 0, world);
      s.mail.letters = [];
      const due = S.Services.due(world);
      if (due) world.events.push({ type: 'money', amount: 0, sim: sim.id, full: true, text: 'Счета к оплате: §' + due + '. Оплатить можно у ящика или щелчком по деньгам' });
      else if (!letters.length) world.events.push({ type: 'money', amount: 0, sim: sim.id, text: 'Почтовый ящик пуст' });
    },

    paperRead(world, sim) {
      if (sim.wish) S.Wishes.bump(sim, 'readPaper');
      world.events.push({ type: 'news', open: true, sim: sim.id, text: sim.name + ' читает газету' });
    },

    mailboxMenu(world, sim, lot, item) {
      if (lot !== home(world)) return [];
      const s = svcOf(world), due = S.Services.due(world), out = [];
      if (due) out.push({ label: 'Оплатить счета (§' + due + ')', ad: 'pay_bills', lot, item, closed: world.funds < Math.min(...S.Services.unpaid(world).map(b => b.amount)) ? 'Денег не хватает даже на один счёт' : null });
      out.push({ label: 'Почитать газету', ad: 'paper_read', lot, item, closed: s.paper === world.day ? null : 'Свежей газеты нет, её приносят в 7:00' });
      return out;
    },

    sendBurglar(world) {
      const lot = home(world), target = lot.house.items.filter(i => STEAL.includes(S.baseOf(i)) && !i.gone).sort((a, b) => S.objectOf(b).price - S.objectOf(a).price)[0];
      if (!target) return null;
      return S.Services.dispatch(world, 'burglar', [task('steal', placeAt(lot, target), STEAL_MINS, 'use', lot.house.items.indexOf(target))]);
    },

    burglarInside(world, sim) {
      const lot = world.lots[sim.duty.lot], awake = world.family.filter(s => s.lot === lot && !s.inside && s.needs && !S.Acts.isAsleep(s));
      for (const s of world.family) if (s.lot === lot && s.needs) S.Moods.add(s, 'thiefSeen', 0, world);
      if (lot.house.alarm) {
        world.events.push({ type: 'sound', name: 'alarm', x: sim.x, z: sim.z });
        event(world, 'Сработала сигнализация! В доме вор, полиция уже едет', { bad: true });
        for (const s of world.family) if (s.lot === lot && S.Acts.isAsleep(s)) S.Acts.dropCurrent(world, s);
        if (!S.Services.onDuty(world, 'police').length) S.Services.dispatch(world, 'police', [], { long: true });
      }
      const hero = awake.find(s => S.Traits.has(s, 'brave') && S.AGE_RANK[s.age] >= S.AGE_RANK.teen);
      if (hero) S.Services.chase(world, sim, hero);
      for (const s of awake) if (S.Traits.has(s, 'coward')) S.Moods.add(s, 'fright', 0, world);
    },

    chase(world, thief, hero) {
      thief.duty.tasks = thief.duty.tasks.slice(0, thief.duty.i);
      thief.duty.wait = -1;
      S.Services.leave(world, thief);
      hero.yaw = Math.atan2(thief.x - hero.x, thief.z - hero.z);
      S.Sim.hold(hero, 5, 'point');
      if (hero.wish) {
        S.Wishes.bump(hero, 'catchThief');
        S.Wishes.bump(hero, 'daring');
      }
      event(world, hero.name + ' прогоняет вора: ' + thief.name, { hero: hero.id });
      news(world, 'Ночью в доме на краю города вора выгнали без полиции. Хозяева не испугались.');
    },

    steal(world, thief, item) {
      const lot = world.lots[thief.duty.lot];
      if (!item || item.gone) return;
      S.Upkeep.take(world, lot, item);
      svcOf(world).stolen.push({ item: lot.house.items.indexOf(item), day: world.day, by: world.sims.indexOf(thief) });
      for (const s of world.family) if (s.needs) S.Moods.add(s, 'robbed', 0, world);
      event(world, 'Украли: ' + S.modelName(S.baseOf(item)).toLowerCase() + '. Можно заявить о краже по телефону', { bad: true });
      news(world, 'Ночью из дома семьи ' + (world.family[0].surname || world.family[0].name) + ' вынесли ' + S.modelName(S.baseOf(item)).toLowerCase() + '. Полиция просит запирать двери.');
      thief.duty.run = 1;
    },

    arrest(world, cop, thief) {
      if (!thief || !thief.duty || thief.duty.kind !== 'burglar') return;
      const s = svcOf(world), lot = world.lots[thief.duty.lot];
      for (const theft of s.stolen.filter(x => x.by === world.sims.indexOf(thief) && x.day >= world.day - 1)) S.Upkeep.giveBack(world, lot, lot.house.items[theft.item]);
      s.stolen = s.stolen.filter(x => !(x.by === world.sims.indexOf(thief) && x.day >= world.day - 1));
      thief.duty.tasks = [];
      S.Services.leave(world, thief);
      thief.duty.jail = 1;
      event(world, roleName('police', cop) + ' ' + cop.name + ' задерживает вора: ' + thief.name, { arrest: true });
      news(world, 'Полиция задержала вора прямо в доме семьи ' + (world.family[0].surname || world.family[0].name) + '. Сигнализация сработала вовремя.');
    },

    recover(world) {
      const s = svcOf(world), lot = home(world), theft = s.stolen[0];
      if (!theft) return;
      if (S.roll(s.rng) < RECOVER) {
        S.Upkeep.giveBack(world, lot, lot.house.items[theft.item]);
        s.stolen.shift();
        event(world, 'Полиция нашла украденное: ' + S.modelName(S.baseOf(lot.house.items[theft.item])).toLowerCase() + ' снова дома');
        news(world, 'Полиция вернула хозяевам украденную вещь. Вора ищут.');
      } else {
        theft.lost = 1;
        event(world, 'Полиция ничего не нашла', { bad: true });
      }
    },

    sendCollector(world) {
      const lot = home(world), debt = Math.round(S.Services.unpaid(world).filter(b => b.red).reduce((n, b) => n + b.amount, 0) * COLLECT_EXTRA);
      if (!debt) return null;
      const items = lot.house.items.filter(i => S.objectOf(i) && !KEEP.has(S.baseOf(i)) && !i.seg).sort((a, b) => S.objectOf(b).price - S.objectOf(a).price), take = [];
      let sum = 0;
      for (const item of items) {
        if (sum >= debt) break;
        take.push(item);
        sum += S.objectOf(item).price;
      }
      return S.Services.dispatch(world, 'collector', take.map(item => task('take', placeAt(lot, item), 5, 'use', lot.house.items.indexOf(item))));
    },

    repo(world, sim, item) {
      const lot = world.lots[sim.duty.lot], s = svcOf(world);
      if (!item || item.gone) return;
      S.Upkeep.take(world, lot, item);
      if (sim.duty.i === sim.duty.tasks.length - 1) {
        for (const bill of s.mail.bills) if (bill.red) bill.paid = 1;
        s.mail.bills = s.mail.bills.filter(b => !b.paid);
        for (const f of world.family) if (f.needs) S.Moods.add(f, 'repo', 0, world);
        event(world, 'Коллектор забрал вещи за долги, красные счета закрыты', { bad: true });
        news(world, 'Коллектор вынес мебель из дома семьи ' + (world.family[0].surname || world.family[0].name) + '. Счета лучше платить вовремя.');
      }
    },

    sendMaid(world) {
      return S.Services.dispatch(world, 'maid', []);
    },

    sendRepair(world) {
      return S.Services.dispatch(world, 'repair', []);
    },

    sendFire(world) {
      const first = S.Services.dispatch(world, 'fire', []);
      if (first) S.Services.dispatch(world, 'fire', [], { skip: [first] });
      if (first) event(world, 'Датчик дыма сработал, пожарные выехали', { bad: true });
      return first;
    },

    deliverPizza(world, sim, step) {
      const lot = world.lots[sim.duty.lot], late = now(world) - step.a > PIZZA_LATE, price = Math.round(S.Econ.coupon(world, 'pizza') || PIZZA_PRICE);
      if (!late && !S.Econ.spend(world, price)) {
        event(world, 'Пицце нечем заплатить, ' + sim.name + ' уезжает', { bad: true });
        return;
      }
      const counter = itemOf(lot, 'counter'), k = lot.kitchen || (lot.kitchen = { meals: [], fridge: [], fires: [], last: null, cool: {} });
      k.meals.push({ recipe: 'pizza', quality: PIZZA_Q, left: world.family.filter(s => s.needs).length, made: now(world), item: counter ? lot.house.items.indexOf(counter) : -1, by: '', own: null });
      world.events.push({ type: 'money', amount: late ? 0 : -price, text: late ? 'Пицца опоздала, сегодня бесплатно' : 'Пицца приехала, −§' + price });
    },

    watchKids(world, dt) {
      const s = svcOf(world), lot = home(world), kids = world.family.filter(o => o.age === 'toddler' && o.lot === lot && o.needs);
      const nanny = S.Services.onDuty(world, 'nanny').find(o => o.duty.phase === 'work');
      const care = caretakers(world, lot).length > 0;
      if (!kids.length || care || nanny) {
        s.alone = {};
        s.asked = 0;
        if (care && nanny && nanny.duty.phase === 'work') S.Services.leave(world, nanny);
        if (nanny) for (const kid of kids) for (const need of ['hunger', 'hygiene', 'energy', 'social']) kid.needs[need] = Math.max(kid.needs[need], NANNY_FLOOR);
        return;
      }
      for (const kid of kids) {
        const key = world.sims.indexOf(kid), alone = (s.alone[key] || 0) + dt;
        s.alone[key] = alone;
        if (alone >= ALONE_ASK && !s.asked) {
          s.asked = 1;
          if (s.nanny && !S.Services.onDuty(world, 'nanny').length) S.Services.sendNanny(world);
          else world.events.push({ type: 'ask', kind: 'nanny', sim: kid.id, text: kid.name + ' остаётся без взрослых' });
        }
        if (alone >= ALONE_STRIKE && s.strikeDay !== world.day) {
          s.strikeDay = world.day;
          s.strikes++;
          event(world, 'Звонок из опеки: ' + kid.name + ' часами сидит дома одни. Предупреждение ' + s.strikes + ' из ' + STRIKES, { bad: true });
          if (s.strikes >= STRIKES && !S.Services.onDuty(world, 'social').length) S.Services.dispatch(world, 'social', [task('social', { x: kid.x + 1, z: kid.z, f: kid.floor, tx: kid.x, tz: kid.z }, 10, 'talk', key)]);
        }
      }
    },

    sendNanny(world) {
      const lot = home(world), kid = world.family.find(o => o.age === 'toddler' && o.lot === lot);
      if (!kid) return null;
      const sim = S.Services.dispatch(world, 'nanny', [task('watch', { x: kid.x + 1, z: kid.z, f: kid.floor, tx: kid.x, tz: kid.z }, 60, 'idle', world.sims.indexOf(kid))], { long: true });
      if (sim) sim.duty.start = now(world);
      return sim;
    },

    watch(world, sim, step) {
      const kid = world.sims[step.a], lot = world.lots[sim.duty.lot];
      if (!kid || caretakers(world, lot).length || kid.lot !== lot) {
        S.Services.leave(world, sim);
        return;
      }
      sim.duty.tasks.push(task('watch', { x: kid.x + 1, z: kid.z, f: kid.floor, tx: kid.x, tz: kid.z }, 60, S.roll(svcOf(world).rng) < 0.5 ? 'talk' : 'idle', step.a));
      sim.duty.until = now(world) + DUTY_LIMIT;
    },

    takeChild(world, worker, kid) {
      const s = svcOf(world);
      if (!kid || !world.family.includes(kid) || world.family.length < 2) return;
      kid.townHome = worker.home;
      kid.townDay = [[0, worker.home]];
      kid.townRest = null;
      S.Acts.dropCurrent(world, kid);
      kid.queue.length = 0;
      S.Social.leave(world, kid);
      s.strikes = 0;
      for (const f of world.family) if (f.needs) S.Moods.add(f, 'heartbreak', 0, world);
      event(world, 'Опека забрала ' + kid.name + ': малыша слишком часто оставляли одного', { bad: true });
      news(world, 'Служба опеки забрала малыша из семьи, где его подолгу оставляли одного.');
    },

    call(world, sim, kind) {
      const s = svcOf(world), lot = home(world);
      if (kind === 'pizza') s.pizza.push({ at: now(world) + span(s.rng, PIZZA_DELAY), made: now(world), by: world.sims.indexOf(sim), sent: 0 });
      if (kind === 'maid') {
        s.maid = 1;
        if (S.Upkeep.tasks(world, lot).length) S.Services.sendMaid(world);
      }
      if (kind === 'maidOff') s.maid = 0;
      if (kind === 'repair') s.repair = now(world) + span(s.rng, REPAIR_DELAY);
      if (kind === 'nanny') {
        s.nanny = 1;
        if (!S.Services.onDuty(world, 'nanny').length && !caretakers(world, lot).filter(o => o !== sim).length) S.Services.sendNanny(world);
      }
      if (kind === 'nannyOff') s.nanny = 0;
      if (kind === 'police' && !S.Services.onDuty(world, 'police').length) S.Services.dispatch(world, 'police', [], { by: world.sims.indexOf(sim), long: true });
      if (kind === 'fire' && S.Food.burning(lot) && !S.Services.onDuty(world, 'fire').length) S.Services.sendFire(world);
      if (kind === 'report' && s.stolen.some(x => !x.lost)) s.report = (world.day + span(s.rng, RECOVER_DAYS)) * DAY + 600;
      const text = { pizza: 'Пицца приедет через полчаса', maid: 'Горничная будет приходить каждый день в 10:00', maidOff: 'Горничная больше не придёт', repair: 'Мастер приедет в течение пары часов', nanny: 'Няня будет приходить, когда малыш остаётся один', nannyOff: 'Няня больше не придёт', police: 'Полиция выехала', fire: 'Пожарные выехали', report: 'Полиция займётся кражей' }[kind];
      if (text) event(world, text);
    },

    phoneMenu(world, sim) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.teen) return [];
      const s = svcOf(world), lot = home(world), broken = S.Upkeep.brokenItems(lot).length, toddler = world.family.some(o => o.age === 'toddler');
      const price = Math.round(S.Econ.coupon(world, 'pizza') || PIZZA_PRICE), fire = S.Food.burning(lot);
      const options = [
        { label: 'Заказать пиццу (§' + price + ')', phone: 'pizza', closed: s.pizza.length ? 'Пицца уже едет' : world.funds < price ? 'Не хватает денег' : null, tip: { title: 'Пицца', text: 'Привезут через полчаса. Опоздание больше часа: бесплатно.' } },
        s.maid ? { label: 'Отказаться от горничной', phone: 'maidOff' } : { label: 'Нанять горничную', phone: 'maid', tip: { title: 'Горничная', text: 'Приходит в 10:00, если есть что убрать. §' + MAID_FEE + ' за визит и §' + MAID_TASK + ' за каждое дело.' } },
        { label: 'Вызвать мастера', phone: 'repair', closed: !broken ? 'Ничего не сломано' : s.repair >= 0 || S.Services.onDuty(world, 'repair').length ? 'Мастер уже едет' : null, tip: { title: 'Мастер', text: '§' + REPAIR_FEE + ' за вызов и §' + REPAIR_ITEM + ' за каждую вещь.' } },
        toddler ? (s.nanny ? { label: 'Отказаться от няни', phone: 'nannyOff' } : { label: 'Вызвать няню', phone: 'nanny', tip: { title: 'Няня', text: 'Приходит, когда малыш остаётся без взрослых. §' + NANNY_HOUR + ' в час.' } }) : null,
        { label: 'Вызвать полицию', phone: 'police', closed: S.Services.onDuty(world, 'police').length ? 'Полиция уже едет' : null, tip: { title: 'Полиция', text: 'Если вора нет, штраф за ложный вызов §' + FALSE_ALARM + '.' } },
        { label: 'Вызвать пожарных', phone: 'fire', closed: fire ? (S.Services.onDuty(world, 'fire').length ? 'Пожарные уже едут' : null) : 'Ничего не горит' },
        s.stolen.some(x => !x.lost) ? { label: 'Заявить о краже', phone: 'report', closed: s.report >= 0 ? 'Полиция уже ищет' : null } : null
      ].filter(Boolean);
      return [{ label: 'Службы…', section: options }];
    },

    heldMoods(world, sim) {
      const out = [];
      if (!sim.needs || S.AGE_RANK[sim.age] < S.AGE_RANK.teen) return out;
      if (S.Services.unpaid(world).length) out.push('bills');
      if (world.funds < S.Econ.BROKE_AT) out.push('broke');
      return out;
    },

    pack(world) {
      const s = svcOf(world);
      return {
        rs: s.rng.rs, mail: JSON.parse(JSON.stringify(s.mail)), out: JSON.parse(JSON.stringify(s.out)), paper: s.paper, burglar: s.burglar, maid: s.maid, nanny: s.nanny,
        pizza: s.pizza.map(o => Object.assign({}, o)), repair: s.repair, stolen: s.stolen.map(x => Object.assign({}, x)), strikes: s.strikes, strikeDay: s.strikeDay,
        alone: Object.assign({}, s.alone), asked: s.asked, report: s.report, done: Object.assign({}, s.done), alarm: home(world).house.alarm ? 1 : 0, detector: home(world).house.detector ? 1 : 0,
        duties: world.sims.map((o, i) => (o.duty ? [i, JSON.parse(JSON.stringify(o.duty))] : null)).filter(Boolean)
      };
    },

    unpack(world, r) {
      if (r === null || r === undefined) return null;
      if (!r || typeof r !== 'object' || !r.mail || !Array.isArray(r.mail.bills) || !Array.isArray(r.duties) || !Number.isFinite(r.rs)) throw new Error('повреждены службы');
      for (const [i, d] of r.duties) if (!world.sims[i] || !d || !ROLES[d.kind] || !Array.isArray(d.tasks)) throw new Error('повреждена служба жителя');
      return r;
    },

    apply(world, r) {
      for (const sim of world.sims) sim.duty = null;
      if (!r) {
        S.Services.init(world);
        return;
      }
      const s = fresh(world.seed || 1);
      Object.assign(s, { mail: JSON.parse(JSON.stringify(r.mail)), out: JSON.parse(JSON.stringify(r.out)), paper: r.paper, burglar: r.burglar, maid: r.maid, nanny: r.nanny, pizza: r.pizza.map(o => Object.assign({}, o)), repair: r.repair, stolen: r.stolen.map(x => Object.assign({}, x)), strikes: r.strikes, strikeDay: r.strikeDay, alone: Object.assign({}, r.alone), asked: r.asked, report: r.report, done: Object.assign({}, r.done) });
      s.rng.rs = r.rs;
      world.service = s;
      home(world).house.alarm = !!r.alarm;
      home(world).house.detector = !!r.detector;
      for (const [i, d] of r.duties) world.sims[i].duty = JSON.parse(JSON.stringify(d));
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
