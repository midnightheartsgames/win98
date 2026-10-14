(function (S) {
  'use strict';
  const { OBJECTS, NEED_KEYS, MOODLETS, TRAITS, SKILLS, SKILL_KEYS, CAREERS, PART_TIME, SCHOOL, WORK_TONES, WISHES, LTW, REWARDS, RECIPES, FISH, PLANTS, COLLECT, clamp, DX, DY, AGE_INFO, SKILL_CHALLENGES, OPPORTUNITIES } = S;
  const D = t => OBJECTS[t];
  const G = S.Game.prototype;
  const g = (sim, m, f) => S.genderize(sim, m, f);

  G.needsTick = function (sim, dt) {
    const atWork = sim.inside && (sim.insideWhat === 'Работа' || sim.insideWhat === 'Школа');
    const tone = atWork && sim.job ? WORK_TONES[sim.job.tone || 'normal'] : null;
    for (const n of NEED_KEYS) {
      let d = sim.decay(n);
      if (sim.sleeping) { if (n === 'hunger' || n === 'bladder') d *= 0.45; if (n === 'social' || n === 'fun') d *= 0.3; }
      if (atWork) {
        if (n === 'hunger') d *= 0.45;
        if (n === 'bladder' || n === 'hygiene') d *= 0.35;
        if (n === 'social') d *= tone && tone.social ? -2 : 0.3;
        if (n === 'fun') d *= tone ? tone.fun : 1;
        if (n === 'energy') d *= tone ? tone.energy : 1;
      } else if (sim.inside) { if (n !== 'energy') d *= 0.3; }
      if (sim.engage || sim.anim === 'talk' || sim.anim.endsWith('_a')) { if (n === 'social') d *= -0.5; }
      if (d) sim.needs[n] = clamp(sim.needs[n] - d * dt, -100, 100);
    }
    if (sim.isBaby && (sim.needs.hunger < 0 || sim.needs.bladder < 0 || sim.needs.energy < -20 || sim.needs.social < -20)) sim.crying = true; else sim.crying = false;
    if (sim.needs.bladder <= -100 && !sim.inside) this.bladderFail(sim);
    if (sim.needs.energy <= -100 && !sim.sleeping && !sim.inside && !sim.isBaby && !sim.passedOut) this.passOut(sim);
    if ((sim.isBaby || sim.isToddler) && !this.isActive(sim)) {
      for (const n of ['hunger', 'bladder', 'hygiene', 'social', 'fun']) if (sim.needs[n] < 10) sim.needs[n] = 60;
      if (sim.needs.energy < -30) sim.needs.energy = 40;
    }
    if (sim.needs.hunger <= -100 && !sim.inside && (sim.isBaby || sim.isToddler)) {
      sim.starveT = (sim.starveT || 0) + dt;
      if (sim.starveT > 480 && !sim.flags.swWarn) { sim.flags.swWarn = true; this.notify(sim.first + ' голодает! Если никто не позаботится о малыше, приедет социальный работник.', { sim, icon: 'm_baby' }); }
      if (sim.starveT > 900) { sim.starveT = 0; this.services.push({ kind: 'social', at: this.t, lot: this.hh(sim) ? this.hh(sim).lot : -1, take: sim.id }); }
    } else if (sim.needs.hunger <= -100 && !sim.inside) {
      sim.starveT = (sim.starveT || 0) + dt;
      if (sim.starveT > 1440) this.die(sim, 'starve');
      else if (sim.starveT > 720 && !sim.flags.starveWarn) { sim.flags.starveWarn = true; this.notify(sim.first + ' умирает от голода! Срочно накормите!', { sim, icon: 'n_hunger' }); }
    } else { sim.starveT = 0; sim.flags.starveWarn = false; }
    sim.moodT = (sim.moodT || 0) + dt;
    if (sim.moodT >= 1) { sim.moodT = 0; this.moodTick(sim); }
  };

  G.bladderFail = function (sim) {
    sim.needs.bladder = 100;
    if (sim.isBaby || sim.isToddler) { sim.addNeed('hygiene', -40); return; }
    const w = this.world;
    const x = Math.floor(sim.x), y = Math.floor(sim.y), lv = sim.lv || 0;
    if (w.inb(x, y) && !w.layer.ground[w.li(x, y, lv)] && w.hasFloor(x, y, lv)) { w.placeObject('puddle', x, y, 0, { lot: w.lotAt(x, y), lv }); this.dirtyObjs(); }
    sim.addNeed('hygiene', -60);
    sim.addMood('embarrassed', this.t);
    for (const s of this.simsNear(sim, 8)) if (!s.dead) s.addNeed('fun', 3);
    this.notify(sim.first + ' не успел' + g(sim, '', 'а') + ' добежать до туалета...', { sim, icon: 'n_bladder', minor: true });
  };

  G.passOut = function (sim) {
    this.hardStop(sim);
    sim.passedOut = true;
    this.queue(sim, 'pass_out', sim, {});
    this.notify(sim.first + ' валится с ног от усталости и засыпает прямо на полу.', { sim, icon: 'n_energy', minor: true });
  };

  S.defAct('pass_out', {
    name: 'Без сил', icon: 'n_energy', cat: 'sleep', hidden: true,
    test: () => true,
    run: function* (a, sim) {
      a.anim('pass_out');
      sim.lieH = 0.02;
      yield* a.loop(240, dt => { sim.addNeed('energy', 0.35 * dt); if (Math.random() < dt * 0.1) a.think('m_zzz', 1); }, () => sim.needs.energy >= 60, { noCancel: true });
      sim.lieH = 0;
      sim.passedOut = false;
      sim.addMood('uncomfortable', a.game.t);
    }
  });

  G.moodTick = function (sim) {
    const t = this.t;
    sim.moods = sim.moods.filter(m => !m.until || m.until > t);
    const need = (k, cond) => { if (cond) { if (!sim.hasMood(k)) sim.addMood(k, t); } else sim.removeMood(k); };
    const n = sim.needs;
    need('starving', n.hunger < -70); need('hungry', n.hunger < -25 && n.hunger >= -70);
    need('bursting', n.bladder < -70); need('need_bladder', n.bladder < -30 && n.bladder >= -70);
    need('exhausted', n.energy < -70); need('tired', n.energy < -30 && n.energy >= -70);
    need('very_lonely', n.social < -80); need('lonely', n.social < -40 && n.social >= -80);
    need('very_bored', n.fun < -75); need('bored', n.fun < -30 && n.fun >= -75);
    need('stinky', n.hygiene < -70); need('smelly', n.hygiene < -30 && n.hygiene >= -70);
    need('pregnant', !!sim.preg);
    if (sim.hidden || sim.inside) { for (const k of ['decor_ok', 'decor_good', 'decor_great', 'dirty', 'neat_clean', 'neat_mess', 'snob_fancy', 'snob_tacky']) sim.removeMood(k); return; }
    const w = this.world;
    const room = w.roomAt(Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0);
    const env = room > 0 ? w.roomEnv(room) : null;
    const sc = env ? env.score : 0;
    need('decor_great', sc >= 18); need('decor_good', sc >= 11 && sc < 18); need('decor_ok', sc >= 5 && sc < 11);
    need('dirty', !!env && env.dirt >= 3 && !sim.has('slob'));
    need('neat_mess', sim.has('neat') && !!env && env.dirt >= 1);
    need('neat_clean', sim.has('neat') && !!env && env.dirt === 0 && room > 0);
    need('snob_fancy', sim.has('snob') && !!env && env.lux >= 2);
    need('snob_tacky', sim.has('snob') && !!env && env.lux === 0 && sc < 3 && room > 0);
    const near = this.simsNear(sim, 6).filter(s => !s.isBaby);
    need('loner_crowd', sim.has('loner') && near.length >= 4);
    need('loner_alone', sim.has('loner') && near.length === 0 && room > 0);
    need('party_crowd', sim.has('party_animal') && near.length >= 4);
    need('shy_crowd', sim.has('shy') && near.filter(s => !this.rel(sim, s).met).length >= 3);
    need('noisy_kids', sim.has('dislikes_children') && near.some(s => s.isKid && !s.sleeping));
    need('crying_baby', near.some(s => s.isBaby && s.crying) || this.simsNear(sim, 8).some(s => s.isBaby && s.crying));
    need('fire_near', this.fires.some(f => Math.hypot(f.x + 0.5 - sim.x, f.y + 0.5 - sim.y) < 6));
    if (sim.has('loves_outdoors')) {
      if (room > 0) sim.flags.indoorT = (sim.flags.indoorT || 0) + 1; else sim.flags.indoorT = 0;
      need('cooped_up', sim.flags.indoorT > 1200 && !sim.sleeping);
    }
    if (sim.has('athletic')) need('restless', t - (sim.flags.lastWorkout || 0) > 2880 && t > 2880);
    if (sim.has('hopeless_romantic') && sim.isAdult) need('romance_craving', !this.partnerOf(sim) && (this.day % 3 === 1));
    if (sim.has('workaholic') && sim.job) { const jd = this.jobDef(sim); need('workaholic_idle', jd && !jd.days[S.dowOf(t)] && room > 0); }
    const hh = this.hh(sim);
    need('debts', !!hh && this.isActive(sim) && this.overdue(hh));
  };

  G.onHour = function (h) {
    const hour = ((h % 24) + 24) % 24;
    const dow = Math.floor(h / 24) % 7;
    if (hour === 0) this.onDay(Math.floor(h / 24));
    if (this.weatherHour) this.weatherHour();
    for (const sim of this.sims.values()) {
      if (sim.dead) continue;
      if (sim.mood > 0 && this.isActive(sim) && !sim.isBaby) {
        const gain = Math.round(sim.mood * 0.9);
        sim.lh += gain; sim.lhTotal += gain;
      }
      if (this.isActive(sim) && this.opts.wishes && !sim.isBaby && S.ageIdx(sim.age) >= 1 && hour % 2 === 0 && hour > 6) this.offerWishes(sim);
      if (this.isActive(sim) && hour >= 9 && hour <= 19 && this.rng.chance(0.06)) this.offerOpportunity(sim);
      this.scheduleWork(sim, hour);
      if (sim.preg) this.pregHour(sim, hour);
      if (sim.offers && sim.offers.length) sim.offers = sim.offers.filter(o => o.until > this.t);
      if (sim.opps && sim.opps.length) this.oppExpire(sim);
    }
    if (hour === 9 && (dow === 0 || dow === 3)) this.sendBills();
    for (const ob of this.world.objects.values()) {
      if (!ob.broken) continue;
      if (!ob.brokenT) ob.brokenT = this.t;
      const lot = this.lots[ob.lot];
      if ((!lot || lot.hh !== this.activeHH) && this.t - ob.brokenT > 150) { ob.broken = false; ob.brokenT = 0; this.dirtyObjs(); }
    }
    if (hour === 6) this.deliverPaper();
    if (hour === 16 && dow === 4) this.reportCards();
    if (hour === 17) this.welcomeWagon();
    if (hour >= 1 && hour <= 4) this.nightEvents(hour);
    if (hour >= 10 && hour <= 20 && this.rng.chance(0.25)) this.walkby();
    for (const svc of this.services) if (svc.at && svc.at <= this.t && !svc.started) this.startService(svc);
  };

  G.onDay = function (day) {
    const dow = day % 7;
    for (const sim of this.sims.values()) {
      if (sim.dead) continue;
      if (this.opts.aging && !(sim.hasReward && sim.flags.noAge)) {
        sim.ageDays++;
        if (sim.ageDays === sim.ageLen - 1 && this.isActive(sim) && AGE_INFO[sim.age].next) this.notify('Завтра у ' + sim.first + ' день рождения! Не забудьте купить торт.', { sim, icon: 'm_cake', minor: true });
        if (sim.ageDays >= sim.ageLen) {
          if (sim.age === 'elder') { if (!sim.flags.ambrosia) this.die(sim, 'old'); else { sim.flags.ambrosia = false; sim.ageDays = 0; } }
          else this.ageUp(sim);
        }
      }
      if (sim.school) {
        const sd = S.dowOf(this.t - 60);
        if (SCHOOL.days[sd] && sim.school.day !== day - 1 && S.ageIdx(sim.age) >= 2 && !sim.flags.newSchool) sim.school.perf = clamp(sim.school.perf - 15, -100, 100);
        const hw = sim.inv.find(i => i.k === 'homework');
        if (hw && hw.day < day - 1) { sim.school.perf = clamp(sim.school.perf - 8, -100, 100); sim.inv.splice(sim.inv.indexOf(hw), 1); }
        sim.flags.newSchool = false;
      }
      sim.flags.skip = null;
    }
    this.relDecay();
    this.plantsDaily();
    if (dow === 0) this.spawnCollectibles();
    if (dow === 6) this.payRoyalties();
    if (this.opts.story) this.storyProgress();
    for (const hh of this.households.values()) {
      const lot = this.lots[hh.lot];
      if (!lot || hh.id === this.activeHH) continue;
      if (hh.bills.length) hh.bills = [];
    }
  };

  G.relDecay = function () {
    for (const [k, r] of this.rels) {
      if (!r.met || this.t - r.last < 2880) continue;
      const [a, b] = k.split(':').map(Number);
      const sa = this.sims.get(a), sb = this.sims.get(b);
      if (!sa || !sb) continue;
      if (sa.hh === sb.hh) continue;
      if (sa.hasReward('long_distance') || sb.hasReward('long_distance')) continue;
      const rate = (sa.has('friendly') || sb.has('friendly')) ? 0.5 : 1;
      if (r.v > 20) r.v -= 1.5 * rate; else if (r.v < -20) r.v += 1;
    }
  };

  G.jobDef = function (sim) { return sim.job ? (CAREERS[sim.job.c] || PART_TIME[sim.job.c]) : null; };
  G.jobLevel = function (sim) {
    const jd = this.jobDef(sim);
    if (!jd) return null;
    const lv = sim.job.lvl;
    if (jd.branchAt && lv >= jd.branchAt && sim.job.branch && jd.branches[sim.job.branch]) return jd.branches[sim.job.branch].levels[lv - jd.branchAt];
    return jd.levels[Math.min(lv, jd.levels.length) - 1];
  };
  G.jobTitle = function (sim) { const l = this.jobLevel(sim); return l ? l.t : ''; };
  G.maxLevel = function (jd) { return jd.branchAt ? jd.branchAt - 1 + 5 : jd.levels.length; };

  G.currentShift = function (sim) {
    const jd = this.jobDef(sim);
    const L = this.jobLevel(sim);
    if (!jd || !L) return null;
    const day = this.day;
    const dayStart = day * 1440;
    const dow = S.dowOf(this.t);
    let start = dayStart + L.start * 60;
    let end = start + L.hours * 60;
    if (!jd.days[dow]) {
      if (L.start + L.hours > 24 && jd.days[(dow + 6) % 7]) { start -= 1440; end -= 1440; }
      else return null;
    }
    if (this.t > end) return null;
    if (sim.job.doneDay === Math.floor(start / 1440)) return null;
    if (sim.flags.skip === Math.floor(start / 1440)) return null;
    return { place: jd.place, start, end, day: Math.floor(start / 1440), hours: L.hours, pay: L.pay };
  };
  G.canGoWork = function (sim) {
    const s = this.currentShift(sim);
    return !!s && this.t >= s.start - 150 && this.t <= s.end - 20 && !sim.inside;
  };
  G.scheduleWork = function (sim, hour) {
    if (sim.dead || sim.isBaby) return;
    const busyWith = k => sim.queue.some(q => q.key === k);
    if (sim.job && !busyWith('go_work') && !sim.inside) {
      const s = this.currentShift(sim);
      if (s && this.t >= s.start - 70 && this.t < s.end - 60) {
        if (sim.sleeping && sim.queue[0]) sim.queue[0].cancel();
        if (sim.queue[0] && !sim.queue[0].user) sim.queue[0].cancel();
        const act = this.urgent(sim, 'go_work');
        if (act && this.isActive(sim)) this.notify('За ' + sim.first + ' приехала машина. Пора на работу.', { sim, icon: 'm_car', minor: true });
      }
    }
    if (sim.school && !busyWith('go_school') && !sim.inside) {
      const sh = this.schoolShift(sim);
      if (sh && this.t >= sh.start - 70 && this.t < sh.end - 60) {
        const act = this.urgent(sim, 'go_school');
        if (act && this.isActive(sim)) this.notify('Школьный автобус ждёт ' + sim.first + '.', { sim, icon: 'm_car', minor: true });
      }
    }
  };
  G.urgent = function (sim, key) {
    const A = S.ACTS[key];
    if (A.test && A.test(sim, sim, this) !== true) return null;
    const act = new S.Action(this, sim, A, sim, {});
    const cur = sim.queue[0];
    sim.queue = sim.queue.filter((q, i) => i === 0 || q.user);
    if (!cur) { sim.queue.push(act); return act; }
    if (cur.auto || cur.def.soft || cur.key === 'sleep' || cur.key === 'nap') cur.cancel();
    sim.queue.splice(1, 0, act);
    return act;
  };
  G.shouldWake = function (sim) {
    const s = sim.job ? this.currentShift(sim) : null;
    if (s && this.t >= s.start - 90 && this.t < s.end) return true;
    const sh = sim.school ? this.schoolShift(sim) : null;
    if (sh && this.t >= sh.start - 90 && this.t < sh.end) return true;
    return false;
  };
  G.startShift = function (sim, shift) {
    sim.job.inShift = true;
    sim.job.startT = this.t;
    sim.job.perfStart = sim.job.perf;
    if (this.t > shift.start + 15) {
      sim.job.perf = clamp(sim.job.perf - 8, -100, 100);
      sim.addMood('late_work', this.t);
      if (this.isActive(sim)) this.notify(sim.first + ' опоздал' + g(sim, '', 'а') + ' на работу. Начальник недоволен.', { sim, icon: 'm_clock', minor: true });
    }
  };
  G.workTick = function (sim, dt) {
    if (!sim.job || this.t < (this.currentShift(sim) || { start: 0 }).start) return;
    const job = sim.job;
    const tone = WORK_TONES[job.tone || 'normal'];
    const m = sim.mood;
    let rate = m >= 60 ? 4 : m >= 25 ? 3 : m >= 0 ? 1.5 : m >= -35 ? -1 : -3;
    let tm = tone.perf;
    if (job.tone === 'easy' && sim.hasReward('slacker')) tm = 1;
    rate *= tm;
    for (const t of sim.traits) if (TRAITS[t].work) rate *= TRAITS[t].work;
    const jd = this.jobDef(sim);
    const next = this.nextLevelDef(sim);
    if (next && Object.keys(next.req).every(k => sim.skillLevel(k) >= next.req[k])) rate += 0.8;
    if ((job.boss || 0) >= 50) rate += 0.5;
    job.perf = clamp(job.perf + rate * dt / 60, -100, 100);
    if (tone.skill && jd.tone) this.gainSkill(sim, jd.tone.skill, 0.9 * dt);
    if (tone.boss) job.boss = clamp((job.boss || 0) + (0.2 + sim.skillLevel('charisma') * 0.03) * dt, -100, 100);
    if (tone.social) job.coworkers = clamp((job.coworkers || 0) + 0.25 * dt, -100, 100);
    if (tone.social) sim.addNeed('social', 0.3 * dt);
    if (this.isActive(sim) && this.rng.chance(dt / 900)) this.workEvent(sim);
  };
  G.workEvent = function (sim) {
    const job = sim.job;
    const opts = [
      { text: 'Начальник просит ' + sim.first + ' задержаться и помочь с отчётом. Согласиться?', yes: () => { job.perf = clamp(job.perf + 15, -100, 100); sim.addNeed('energy', -20); }, no: () => { job.perf = clamp(job.perf - 5, -100, 100); } },
      { text: 'Коллеги зовут ' + sim.first + ' на обед в кафе за углом. Пойти?', yes: () => { sim.addNeed('hunger', 40); sim.addNeed('social', 25); job.coworkers = (job.coworkers || 0) + 10; this.spend(sim, 15, 'Обед'); }, no: () => { job.perf = clamp(job.perf + 5, -100, 100); } },
      { text: 'На столе ' + sim.first + ' лежит чужая премия. Взять?', yes: () => { if (this.rng.chance(0.5)) { this.earn(sim, 200, 'Премия', true); if (sim.has('evil')) sim.addMood('evil_joy', this.t); } else { job.perf = clamp(job.perf - 30, -100, 100); this.notify('Кража раскрылась. Начальник в ярости.', { sim, icon: 'm_angry' }); } }, no: () => { if (sim.has('good')) sim.addMood('good_deed', this.t); job.boss = (job.boss || 0) + 5; } }
    ];
    const e = this.rng.pick(opts);
    this.notify(e.text, { sim, icon: 'm_briefcase', actions: [{ label: 'Да', fn: e.yes }, { label: 'Нет', fn: e.no }] });
  };
  G.nextLevelDef = function (sim) {
    const jd = this.jobDef(sim);
    if (!jd) return null;
    const lv = sim.job.lvl + 1;
    if (lv > this.maxLevel(jd)) return null;
    if (jd.branchAt && lv >= jd.branchAt) {
      const br = sim.job.branch || Object.keys(jd.branches)[0];
      return jd.branches[br].levels[lv - jd.branchAt];
    }
    return jd.levels[lv - 1];
  };
  G.endShift = function (sim, shift, early) {
    const job = sim.job;
    if (!job) return;
    job.inShift = false;
    job.doneDay = shift.day;
    job.days = (job.days || 0) + 1;
    const worked = Math.max(0, Math.min(shift.end, this.t) - Math.max(shift.start, job.startT || shift.start)) / 60;
    const pay = Math.round(shift.pay * Math.min(worked, shift.hours));
    if (early) job.perf = clamp(job.perf - 15, -100, 100);
    this.earn(sim, pay, 'Зарплата', true);
    const delta = job.perf - (job.perfStart || 0);
    if (delta > 8) sim.addMood('great_day_work', this.t); else if (delta < -5) sim.addMood('bad_day_work', this.t);
    if (this.isActive(sim)) this.notify(sim.first + ' вернул' + g(sim, 'ся', 'ась') + ' с работы. Заработано: ' + S.fmtMoney(pay) + '.', { sim, icon: 'm_money', minor: true });
    if (job.perf >= 100) this.tryPromote(sim);
    else if (job.perf <= -100) this.fireSim(sim);
  };
  G.tryPromote = function (sim) {
    const jd = this.jobDef(sim);
    const job = sim.job;
    if (job.lvl >= this.maxLevel(jd)) { job.perf = 100; return; }
    if (jd.branchAt && job.lvl + 1 === jd.branchAt && !job.branch) {
      const keys = Object.keys(jd.branches);
      if (this.isActive(sim)) {
        this.notify(sim.first + ' может получить повышение. Какой путь выбрать?', { sim, icon: 'm_star', actions: keys.map(k => ({ label: jd.branches[k].name, fn: () => { job.branch = k; this.tryPromote(sim); } })) });
        return;
      }
      job.branch = this.rng.pick(keys);
    }
    const next = this.nextLevelDef(sim);
    const miss = Object.keys(next.req).filter(k => sim.skillLevel(k) < next.req[k]);
    if (miss.length) {
      job.perf = 100;
      if (this.isActive(sim) && !job.warned) { job.warned = true; this.notify('Для повышения ' + sim.first + ' нужно: ' + miss.map(k => SKILLS[k].name + ' ' + next.req[k]).join(', ') + '.', { sim, icon: 'm_briefcase' }); }
      return;
    }
    job.lvl++;
    job.perf = 15;
    job.warned = false;
    sim.addMood('promoted', this.t);
    const L = this.jobLevel(sim);
    this.earn(sim, L.pay * 5, 'Премия', true);
    this.note(sim, { k: 'career', ev: 'promote', c: job.c, lvl: job.lvl });
    if (this.isActive(sim)) this.notify(sim.first + ' получил' + g(sim, '', 'а') + ' повышение! Новая должность: ' + L.t + '. Зарплата ' + S.fmtMoney(L.pay) + ' в час, премия ' + S.fmtMoney(L.pay * 5) + '.', { sim, icon: 'm_star', kind: 'promo' });
    this.checkLTW(sim);
  };
  G.fireSim = function (sim) {
    const title = this.jobTitle(sim);
    sim.job = null;
    sim.addMood('fired', this.t);
    this.note(sim, { k: 'career', ev: 'fired' });
    if (this.isActive(sim)) this.notify(sim.first + ' уволен' + g(sim, '', 'а') + ' с должности «' + title + '». Работу придётся искать заново.', { sim, icon: 'm_sad' });
  };
  G.skipWork = function (sim) {
    const s = this.currentShift(sim);
    if (!s) return;
    sim.flags.skip = s.day;
    sim.job.perf = clamp(sim.job.perf - 20, -100, 100);
    for (const q of sim.queue) if (q.key === 'go_work') q.cancel();
    this.notify(sim.first + ' взял' + g(sim, '', 'а') + ' отгул. Начальству это не понравилось.', { sim, icon: 'm_briefcase', minor: true });
  };
  G.joinCareer = function (sim, c) {
    const jd = CAREERS[c] || PART_TIME[c];
    if (!jd) return;
    if (PART_TIME[c] && !(sim.age === 'teen' || sim.age === 'elder' || S.isAdultish(sim.age))) return;
    if (CAREERS[c] && !S.isAdultish(sim.age)) { this.tip(sim, 'Полная занятость только с молодого возраста. Подросткам доступна подработка.'); return; }
    sim.job = { c, lvl: 1, branch: null, perf: 0, days: 0, tone: 'normal', boss: 0, coworkers: 0 };
    sim.addMood('new_job', this.t);
    this.note(sim, { k: 'career', ev: 'join', c });
    const L = jd.levels[0];
    const days = jd.days.map((v, i) => v ? S.DAY_SHORT[i] : null).filter(Boolean).join(', ');
    if (this.isActive(sim)) this.notify(sim.first + ' теперь работает: ' + L.t + ' (' + jd.name + '). График: ' + days + ', с ' + L.start + ':00 до ' + ((L.start + L.hours) % 24) + ':00. Оплата ' + S.fmtMoney(L.pay) + ' в час.', { sim, icon: jd.icon, kind: 'job' });
  };
  G.quitJob = function (sim) {
    if (!sim.job) return;
    const t = this.jobTitle(sim);
    sim.job = null;
    this.notify(sim.first + ' уволил' + g(sim, 'ся', 'ась') + ' по собственному желанию (' + t + ').', { sim, icon: 'm_briefcase', minor: true });
  };
  G.openJobs = function (sim) { if (this.hooks.dialog) this.hooks.dialog('jobs', { sim }); };
  G.openShop = function (sim, kind) { if (this.hooks.dialog) this.hooks.dialog('shop', { sim, kind }); };

  G.schoolShift = function (sim) {
    if (!sim.school) return null;
    const dow = S.dowOf(this.t);
    if (!SCHOOL.days[dow]) return null;
    const info = SCHOOL[sim.age] || SCHOOL.child;
    const start = this.day * 1440 + info.start * 60, end = start + info.hours * 60;
    if (this.t > end || sim.school.day === this.day) return null;
    return { start, end };
  };
  G.canGoSchool = function (sim) { const s = this.schoolShift(sim); return !!s && this.t >= s.start - 120 && this.t <= s.end - 20 && !sim.inside; };
  G.schoolTick = function (sim, dt) {
    const sh = this.schoolShift(sim);
    if (!sh || this.t < sh.start) return;
    const m = sim.mood;
    const rate = m >= 40 ? 2 : m >= 0 ? 1 : m >= -35 ? -1 : -2.5;
    sim.school.perf = clamp(sim.school.perf + rate * dt / 60 * 2, -100, 100);
    this.gainSkill(sim, 'logic', 0.1 * dt);
    sim.addNeed('social', 0.2 * dt);
  };
  G.endSchool = function (sim, early) {
    sim.school.day = this.day;
    if (early) sim.school.perf = clamp(sim.school.perf - 10, -100, 100);
    if (!sim.inv.some(i => i.k === 'homework')) sim.inv.push({ k: 'homework', p: 0, day: this.day });
    if (this.isActive(sim)) this.notify(sim.first + ' вернул' + g(sim, 'ся', 'ась') + ' из школы. Не забудьте сделать уроки!', { sim, icon: 'm_book', minor: true });
  };
  G.gradeOf = function (sim) {
    const p = sim.school ? sim.school.perf : 0;
    return p >= 80 ? 'A+' : p >= 50 ? 'A' : p >= 20 ? 'B' : p >= -20 ? 'C' : p >= -60 ? 'D' : 'F';
  };
  G.reportCards = function () {
    for (const sim of this.sims.values()) {
      if (sim.dead || !sim.school) continue;
      const gr = this.gradeOf(sim);
      sim.school.grade = gr;
      if (gr === 'A' || gr === 'A+') sim.addMood('report_a', this.t);
      if (gr === 'F') sim.addMood('report_f', this.t);
      this.note(sim, { k: 'grade', g: gr });
      if (this.isActive(sim)) this.notify(sim.first + ' получил' + g(sim, '', 'а') + ' табель. Оценка за неделю: ' + gr + '.', { sim, icon: 'm_book' });
    }
  };

  G.billAmount = function (hh) {
    const lot = this.lots[hh.lot];
    if (!lot) return 0;
    let val = lot.land || 0;
    for (const ob of this.world.objects.values()) if (ob.lot === lot.id && !D(ob.t).hidden) val += D(ob.t).price;
    let amt = Math.round(val * 0.012 + 40);
    const mem = this.members(hh);
    if (mem.some(s => s.has('frugal'))) amt = Math.round(amt * 0.85);
    return amt;
  };
  G.sendBills = function () {
    const hh = this.active();
    if (!hh || hh.lot < 0) return;
    const amt = this.billAmount(hh);
    hh.bills.push({ amount: amt, t: this.t, paid: false });
    const mb = this.world.objectsInLot(hh.lot, o => o.t === 'mailbox')[0];
    if (mb) { mb.st.mail = true; this.dirtyObjs(); }
    this.notify('Пришли счета на ' + S.fmtMoney(amt) + '. Оплатите их у почтового ящика в течение трёх дней.', { icon: 'm_money', force: true });
  };
  G.unpaid = function (hh) { return hh ? hh.bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0) : 0; };
  G.overdue = function (hh) { return !!hh && hh.bills.some(b => !b.paid && this.t - b.t > 4320); };
  G.payBills = function (sim) {
    const hh = this.hh(sim);
    const sum = this.unpaid(hh);
    if (!sum) return;
    if (hh.funds < sum) { this.notify('Не хватает денег, чтобы оплатить счета (' + S.fmtMoney(sum) + ').', { sim, icon: 'm_money' }); return; }
    hh.funds -= sum;
    for (const b of hh.bills) b.paid = true;
    hh.bills = [];
    const mb = this.world.objectsInLot(hh.lot, o => o.t === 'mailbox')[0];
    if (mb) { mb.st.mail = false; this.dirtyObjs(); }
    this.fx('money', sim, -sum);
    this.notify('Счета оплачены: ' + S.fmtMoney(sum) + '.', { sim, icon: 'm_money', minor: true });
  };
  G.repoCheck = function () {
    const hh = this.active();
    if (!hh) return;
    const late = hh.bills.filter(b => !b.paid && this.t - b.t > 7200);
    if (!late.length || this.services.some(s => s.kind === 'repo' && !s.done)) return;
    this.services.push({ kind: 'repo', at: this.t, lot: hh.lot, amount: late.reduce((s, b) => s + b.amount, 0) });
  };

  G.deliverPaper = function () {
    const hh = this.active();
    if (!hh || hh.lot < 0) return;
    const w = this.world;
    if (w.objectsInLot(hh.lot, o => o.t === 'newspaper').length >= 2) return;
    const mb = w.objectsInLot(hh.lot, o => o.t === 'mailbox')[0];
    const p = mb ? w.nearestWalkable(mb.x, mb.y, 3, (x, y) => !w.layer.ground[w.idx(x, y)] && w.lotAt(x, y) === hh.lot) : null;
    if (p) { w.placeObject('newspaper', p[0], p[1], 0, { lot: hh.lot }); this.dirtyObjs(); }
  };

  G.gainSkill = function (sim, k, xp) {
    if (!SKILLS[k] || xp <= 0 || sim.isBaby || sim.isToddler) return;
    const r = sim.addXP(k, xp);
    if (r === -1) {
      this.note(sim, { k: 'skill', s: k, lvl: 0, learn: true });
      if (this.isActive(sim)) this.notify(sim.first + ' начинает осваивать навык «' + SKILLS[k].name + '».', { sim, icon: SKILLS[k].icon, minor: true });
    } else if (r > 0) {
      this.note(sim, { k: 'skill', s: k, lvl: r });
      if (this.isActive(sim)) {
        const un = SKILLS[k].unlock[r];
        this.notify(sim.first + ': навык «' + SKILLS[k].name + '» повышен до уровня ' + r + '.' + (un ? ' Открыто: ' + un + '.' : ''), { sim, icon: SKILLS[k].icon, kind: 'skill' });
        this.fx('skill', sim, r);
        this.sound('skillup', sim);
      }
      this.checkLTW(sim);
    }
  };

  G.checkChallenges = function (sim) {
    for (const k of Object.keys(SKILL_CHALLENGES)) {
      const c = SKILL_CHALLENGES[k];
      if ((sim.stats[c.stat] || 0) >= c.goal && !sim.flags['ch_' + k]) {
        sim.flags['ch_' + k] = true;
        if (this.isActive(sim)) this.notify(sim.first + ' выполняет испытание навыка «' + c.name + '». Награда: ' + c.reward.toLowerCase() + '.', { sim, icon: SKILLS[k].icon });
      }
    }
  };

  function wishText(w) {
    const def = WISHES[w.k];
    return S.fillText(def.text, w.p || {});
  }
  G.wishText = function (w) { return wishText(w); };

  G.offerWishes = function (sim) {
    sim.offers = sim.offers || [];
    if (sim.offers.length >= 3) return;
    const cand = this.wishCandidates(sim);
    this.rng.shuffle(cand);
    cand.sort((a, b) => b.w - a.w);
    for (const c of cand) {
      if (sim.offers.length >= 3) break;
      const key = c.k + JSON.stringify(c.p || {});
      if (sim.offers.some(o => o.key === key) || sim.wishes.some(o => o.key === key)) continue;
      if (this.rng.next() > Math.min(0.95, c.w / 3)) continue;
      sim.offers.push({ k: c.k, p: c.p || {}, key, until: this.t + 480, lh: WISHES[c.k].lh + (c.bonus || 0) });
    }
  };

  G.wishCandidates = function (sim) {
    const out = [];
    const add = (k, w, p, bonus) => { if (WISHES[k] && w > 0) out.push({ k, w, p, bonus }); };
    const tags = new Set();
    for (const t of sim.traits) for (const x of TRAITS[t].wishes) tags.add(x);
    const T = k => tags.has(k) ? 2.5 : 1;
    const n = sim.needs;
    if (n.hygiene < 0) add(this.rng.chance(0.5) ? 'shower' : 'bath', 1.5);
    if (n.hunger < 20) add('eat_good', 1.5);
    if (n.energy < 0) add('nap', 1);
    for (const sk of SKILL_KEYS) {
      const L = sim.skillLevel(sk);
      if (sim.knowsSkill(sk) && L < 10) add('skill_up', (tags.has('skill_' + sk) ? 3 : 1) * (L >= 1 ? 1.2 : 0.6), { skill: SKILLS[sk].name, sk, lvl: L + 1 }, L * 60);
      else if (!sim.knowsSkill(sk) && S.ageIdx(sim.age) >= 2) add('learn_skill', 0.3, { skill: SKILLS[sk].name, sk });
    }
    const rels = [...this.rels.entries()].filter(([k]) => k.split(':').map(Number).includes(sim.id)).map(([k, r]) => {
      const [a, b] = k.split(':').map(Number);
      const other = this.sims.get(a === sim.id ? b : a);
      return { r, other };
    }).filter(x => x.other && !x.other.dead && x.r.met && !x.other.isBaby);
    if (rels.length < 8 || tags.has('meet_new')) add('meet_new', 1.2 * T('meet_new'));
    for (const { r, other } of rels.slice(0, 12)) {
      const p = { sim: other.first, sid: other.id };
      if (r.v >= 10 && r.v < 35 && other.hh !== sim.hh) add('befriend', 1.1 * T('befriend'), p);
      if (r.v >= 70 && !r.flags.bff && !this.isFamily(sim, other)) add('bff', 0.5, p);
      if (r.v >= 20) add('chat', 0.6 * T('chat'), p);
      if (r.v >= 40) add('hug', 0.5 * T('hug'), p);
      if (S.romanticAges(sim, other) && !this.isFamily(sim, other)) {
        if (r.flags.romance && !r.flags.steady) add('go_steady', 1.3 * T('go_steady'), p);
        if (r.flags.romance || r.flags.crush) add('kiss', 1 * T('kiss'), p);
        if (r.flags.steady && !r.flags.engaged && sim.isAdult) add('propose', 1 * T('propose'), p);
        if (r.flags.engaged) add('marry', 2, p);
        if ((r.flags.steady || r.flags.married) && sim.isAdult) add('woohoo', 0.8 * T('woohoo'), p);
      }
      if (r.v < -10 && (sim.has('evil') || sim.has('mean_spirited') || sim.has('hot_headed') || sim.has('grumpy'))) add('mean', 1.2, p);
      if (r.v < -40 && (sim.has('hot_headed') || sim.has('daredevil'))) add('fight', 0.8, p);
      if (other.hh !== sim.hh && r.v >= 30 && sim.isAdult) add('invite', 0.5 * T('invite'), p);
    }
    const spouse = this.spouseOf(sim);
    if (spouse && sim.isAdult && sim.age !== 'elder' && this.householdSize(sim) < 7 && (sim.has('family_oriented') || this.rng.chance(0.3))) add('baby', 0.7 * T('baby'));
    if (S.ageIdx(sim.age) >= 3) {
      if (!sim.job && S.isAdultish(sim.age)) { const c = this.rng.pick(S.CAREER_KEYS); add('job', 1.5, { career: CAREERS[c].name, c }); }
      if (sim.job) { add('promote', 1 * T('promote')); add('reach_level', 0.4 * T('reach_level'), { lvl: sim.job.lvl + 2 }); }
    }
    const hh = this.hh(sim);
    if (hh && S.ageIdx(sim.age) >= 3) {
      const target = Math.ceil((hh.funds + 3000) / 5000) * 5000;
      add('money', 0.4 * T('money'), { amount: S.fmtMoney(target), n: target });
      const shop = S.OBJECT_KEYS.filter(k => !OBJECTS[k].hidden && !OBJECTS[k].reward && OBJECTS[k].price > 300 && OBJECTS[k].price < hh.funds * 0.8);
      if (shop.length) { const o = this.rng.pick(shop); add('buy_obj', 0.6 * T('buy_obj'), { obj: OBJECTS[o].name, o }, Math.round(OBJECTS[o].price / 5)); }
    }
    const vis = ['park', 'beach', 'library', 'gym', 'bistro', 'theater', 'spa', 'stadium', 'pier', 'lighthouse'];
    const v = this.rng.pick(vis);
    add('visit', 0.5 * T('visit'), { place: this.world.lotByKey[v].name, lot: v });
    if (sim.knowsSkill('cooking') || tags.has('cook')) {
      const L = sim.skillLevel('cooking');
      const rs = Object.keys(RECIPES).filter(k => RECIPES[k].lvl <= L && RECIPES[k].cook !== 'none' && !RECIPES[k].ing.length);
      if (rs.length && S.ageIdx(sim.age) >= 3) { const r = this.rng.pick(rs); add('cook', 0.6 * T('cook'), { recipe: RECIPES[r].name, r }); }
    }
    for (const k of ['read_book', 'fish_any', 'plant', 'harvest', 'paint', 'write', 'chess_win', 'play_guitar', 'workout', 'jog', 'watch_tv', 'clean', 'repair', 'upgrade', 'party', 'stargaze', 'swipe', 'dance', 'collect', 'joke', 'guitar_tips', 'sell_paint', 'harvest_q']) {
      let w = tags.has(k) ? 1.4 : 0.12;
      if (k === 'swipe' && !sim.has('kleptomaniac')) w = 0;
      if (k === 'party' && !S.isAdultish(sim.age)) w = 0;
      if ((k === 'harvest' || k === 'harvest_q') && !this.world.objectsInLot(hh ? hh.lot : -9, o => o.t === 'plant_garden').length) w = 0;
      if (k === 'sell_paint' && !sim.inv.some(i => i.k === 'painting')) w = 0;
      if (k === 'guitar_tips' && sim.skillLevel('guitar') < 3) w = 0;
      if (k === 'write' && sim.skillLevel('writing') < 1 && !tags.has('write')) w *= 0.3;
      if (k === 'upgrade' && sim.skillLevel('handiness') < 4) w = 0;
      if (['paint', 'write', 'guitar_tips', 'swipe', 'party', 'repair', 'upgrade', 'clean', 'stargaze'].includes(k) && S.ageIdx(sim.age) < 2) w = 0;
      add(k, w);
    }
    if (this.world.objectsInLot(hh ? hh.lot : -9, o => o.t === 'plant_garden').length) add('harvest', 0.5);
    if (sim.school) { add('homework', sim.inv.some(i => i.k === 'homework') ? 1.5 : 0); add('grade_a', 0.3); }
    if (sim.isAdult && hh && this.members(hh).some(s => s.isToddler)) add('teach_toddler', 1);
    if (sim.opps && sim.opps.length) add('opp', 0.8);
    if (sim.isToddler) { out.length = 0; add('eat_good', 1); add('watch_tv', 0.5); add('meet_new', 0.5); }
    return out;
  };

  G.promiseWish = function (sim, i) {
    const o = sim.offers[i];
    if (!o || sim.wishes.length >= 4) return false;
    sim.offers.splice(i, 1);
    sim.wishes.push(o);
    return true;
  };
  G.cancelWish = function (sim, i) { sim.wishes.splice(i, 1); };

  function wishMatch(game, w, ev, sim) {
    const p = w.p || {};
    switch (w.k) {
      case 'skill_up': return ev.k === 'skill' && ev.s === p.sk && ev.lvl >= p.lvl;
      case 'learn_skill': return ev.k === 'skill' && ev.s === p.sk;
      case 'read_book': return ev.k === 'act' && ev.a === 'read';
      case 'shower': return ev.k === 'act' && (ev.a === 'shower' || ev.a === 'bath');
      case 'bath': return ev.k === 'act' && ev.a === 'bath';
      case 'eat_good': return ev.k === 'eat' && ev.q >= 3;
      case 'nap': return ev.k === 'act' && (ev.a === 'nap' || ev.a === 'sleep');
      case 'cook': return ev.k === 'cook' && ev.r === p.r;
      case 'meet_new': return ev.k === 'meet';
      case 'chat': return ev.k === 'social' && ev.ok && ev.t === p.sid && ev.cat === 'friendly';
      case 'befriend': return ev.k === 'rel' && ev.t === p.sid && (ev.st === 'friend' || ev.st === 'good_friend' || ev.st === 'bff');
      case 'bff': return ev.k === 'rel' && ev.t === p.sid && ev.st === 'bff';
      case 'hug': return ev.k === 'social' && ev.ok && ev.t === p.sid && (ev.s === 'friendly_hug' || ev.s === 'romantic_hug');
      case 'kiss': return ev.k === 'social' && ev.ok && ev.t === p.sid && (ev.s === 'kiss' || ev.s === 'make_out');
      case 'go_steady': return ev.k === 'rel' && ev.t === p.sid && ev.st === 'steady';
      case 'propose': return ev.k === 'rel' && ev.t === p.sid && ev.st === 'engaged';
      case 'marry': return ev.k === 'married' && ev.t === p.sid;
      case 'woohoo': return ev.k === 'woohoo' && ev.t === p.sid;
      case 'baby': return ev.k === 'baby';
      case 'joke': return ev.k === 'social' && ev.ok && ev.s === 'joke';
      case 'mean': return ev.k === 'social' && ev.ok && ev.cat === 'mean' && ev.t === p.sid;
      case 'fight': return ev.k === 'social' && ev.s === 'fight' && ev.t === p.sid;
      case 'job': return ev.k === 'career' && ev.ev === 'join';
      case 'promote': return ev.k === 'career' && ev.ev === 'promote';
      case 'reach_level': return ev.k === 'career' && ev.ev === 'promote' && ev.lvl >= p.lvl;
      case 'buy_obj': return ev.k === 'buy' && ev.o === p.o;
      case 'money': return ev.k === 'money' && ev.total >= p.n;
      case 'visit': return ev.k === 'visit' && ev.lot === p.lot;
      case 'fish_any': return ev.k === 'fish';
      case 'fish_kind': return ev.k === 'fish' && ev.f === p.f;
      case 'plant': return ev.k === 'plant';
      case 'harvest': return ev.k === 'harvest';
      case 'harvest_q': return ev.k === 'harvest' && ev.q >= 4;
      case 'paint': return ev.k === 'paint';
      case 'sell_paint': return ev.k === 'sell' && ev.what === 'painting';
      case 'write': return ev.k === 'write';
      case 'chess_win': return ev.k === 'chess' && ev.win;
      case 'play_guitar': return ev.k === 'act' && ev.a === 'guitar';
      case 'guitar_tips': return ev.k === 'guitar_public' && ev.m > 0;
      case 'workout': return ev.k === 'act' && (ev.a === 'workout' || ev.a === 'jog');
      case 'jog': return ev.k === 'act' && ev.a === 'jog';
      case 'watch_tv': return ev.k === 'act' && ev.a === 'watch_tv';
      case 'clean': return ev.k === 'clean';
      case 'repair': return ev.k === 'repair';
      case 'upgrade': return ev.k === 'upgrade';
      case 'party': return ev.k === 'party';
      case 'invite': return ev.k === 'invite' && ev.t === p.sid;
      case 'stargaze': return ev.k === 'act' && ev.a === 'stargaze';
      case 'swipe': return ev.k === 'act' && ev.a === 'swipe';
      case 'homework': return ev.k === 'homework';
      case 'grade_a': return ev.k === 'grade' && (ev.g === 'A' || ev.g === 'A+');
      case 'teach_toddler': return ev.k === 'teach';
      case 'collect': return ev.k === 'collect';
      case 'dance': return ev.k === 'act' && ev.a === 'dance';
      case 'opp': return ev.k === 'opp_done';
    }
    return false;
  }

  G.note = function (sim, ev) {
    if (!sim || sim.dead) return;
    if (this.isActive(sim)) {
      for (let i = sim.wishes.length - 1; i >= 0; i--) {
        const w = sim.wishes[i];
        if (wishMatch(this, w, ev, sim)) {
          sim.wishes.splice(i, 1);
          sim.lh += w.lh; sim.lhTotal += w.lh;
          sim.addMood('wish_fulfilled', this.t);
          this.notify(sim.first + ': желание исполнено! «' + wishText(w) + '». +' + S.fmtNum(w.lh) + ' очков счастья.', { sim, icon: WISHES[w.k].icon, kind: 'wish' });
          this.fx('wish', sim, w.lh);
          this.sound('wish', sim);
        }
      }
      for (let i = sim.offers.length - 1; i >= 0; i--) {
        const w = sim.offers[i];
        if (wishMatch(this, w, ev, sim)) { sim.offers.splice(i, 1); const half = Math.round(w.lh / 2); sim.lh += half; sim.lhTotal += half; }
      }
      if (sim.opps && sim.opps.length) this.oppProgress(sim, ev);
    }
    if (ev.k === 'clean' || ev.k === 'repair' || ev.k === 'fish' || ev.k === 'harvest' || ev.k === 'cook' || ev.k === 'chess' || ev.k === 'meet' || ev.k === 'guitar_public' || ev.k === 'paint' || ev.k === 'write') this.checkChallenges(sim);
    if (ev.k === 'fish' || ev.k === 'harvest' || ev.k === 'money' || ev.k === 'rel' || ev.k === 'baby' || ev.k === 'cook' || ev.k === 'write' || ev.k === 'sell' || ev.k === 'upgrade' || ev.k === 'chess') this.checkLTW(sim);
  };

  G.ltwProgress = function (sim) {
    const L = LTW[sim.ltw];
    if (!L) return 0;
    if (L.career) {
      if (!sim.job || sim.job.c !== L.career[0]) return 0;
      if (L.career[2] && sim.job.branch && sim.job.branch !== L.career[2]) return 0;
      return clamp(sim.job.lvl / L.career[1], 0, 1);
    }
    if (L.skillsMax) return clamp(SKILL_KEYS.filter(k => sim.skillLevel(k) >= 10).length / L.skillsMax, 0, 1);
    if (L.allSkills) return SKILL_KEYS.reduce((s, k) => s + Math.min(1, sim.skillLevel(k) / L.allSkills), 0) / SKILL_KEYS.length;
    if (L.skill) {
      const a = Math.min(1, sim.skillLevel(L.skill[0]) / L.skill[1]);
      const b = L.stat ? Math.min(1, (sim.stats[L.stat[0]] || 0) / L.stat[1]) : 1;
      return (a + b) / 2;
    }
    if (L.allFish) return Object.keys(sim.fishSeen).length / Object.keys(FISH).length;
    if (L.allRecipes) { const all = Object.keys(RECIPES).filter(k => !RECIPES[k].hidden); return all.filter(k => sim.recipes[k]).length / all.length; }
    if (L.funds) { const hh = this.hh(sim); return hh ? clamp(hh.funds / L.funds, 0, 1) : 0; }
    if (L.friends) { let n = 0; for (const [k, r] of this.rels) if (r.v >= 35 && k.split(':').map(Number).includes(sim.id)) n++; return clamp(n / L.friends, 0, 1); }
    if (L.kids) return clamp([...this.sims.values()].filter(s => (s.parents || []).includes(sim.id) && S.ageIdx(s.age) >= 3).length / L.kids, 0, 1);
    if (L.romances) { let n = 0; for (const [k, r] of this.rels) if (r.flags.romance && k.split(':').map(Number).includes(sim.id)) n++; return clamp(Math.max(n, sim.stats.romances || 0) / L.romances, 0, 1); }
    return 0;
  };
  G.checkLTW = function (sim) {
    if (!sim.ltw || sim.flags.ltwDone || !this.isActive(sim)) return;
    if (this.ltwProgress(sim) >= 1) {
      sim.flags.ltwDone = true;
      sim.lh += 20000; sim.lhTotal += 20000;
      sim.addMood('ltw_done', this.t);
      this.notify(sim.first + ' исполняет мечту всей жизни: «' + LTW[sim.ltw].name + '»! +20 000 очков счастья.', { sim, icon: 'm_star', kind: 'ltw' });
      this.sound('ltw', sim);
    }
  };

  G.buyReward = function (sim, key) {
    const R = REWARDS[key];
    if (!R || sim.lh < R.cost) return false;
    if (!R.item && !R.obj && sim.rewards.includes(key)) return false;
    sim.lh -= R.cost;
    if (R.item) sim.inv.push(R.item === 'elixir' ? { k: 'elixir' } : { k: 'seed', p: R.item.split(':')[1] });
    else if (R.obj) sim.inv.push({ k: 'obj', t: R.obj });
    else if (key !== 'midlife_crisis') sim.rewards.push(key);
    if (key === 'midlife_crisis' && this.hooks.dialog) this.hooks.dialog('midlife', { sim });
    this.notify(sim.first + ' получает награду «' + R.name + '».', { sim, icon: R.icon, minor: true });
    return true;
  };

  G.offerOpportunity = function (sim) {
    sim.opps = sim.opps || [];
    if (sim.opps.length >= 3 || S.ageIdx(sim.age) < 3) return;
    sim.flags.oppSeen = sim.flags.oppSeen || {};
    const keys = Object.keys(OPPORTUNITIES).filter(k => {
      const o = OPPORTUNITIES[k];
      if (sim.opps.some(x => x.k === k)) return false;
      if (this.t - (sim.flags.oppSeen[k] || -1e9) < 2880) return false;
      if (o.src.career) return sim.job && sim.job.c === o.src.career && sim.job.lvl >= (o.src.level || 1);
      if (o.src.skill) return sim.skillLevel(o.src.skill) >= o.src.level;
      return false;
    });
    if (!keys.length) return;
    const k = this.rng.pick(keys);
    sim.flags.oppSeen[k] = this.t;
    const o = OPPORTUNITIES[k];
    this.notify('Возможность: «' + o.name + '». ' + o.desc + ' Награда: ' + [o.reward.money ? S.fmtMoney(o.reward.money) : null, o.reward.perf ? 'успехи на работе' : null].filter(Boolean).join(' и ') + '.', {
      sim, icon: 'm_star', kind: 'opp',
      actions: [{ label: 'Принять', fn: () => { sim.opps.push({ k, until: this.t + o.hours * 60, n: 0, lots: [] }); } }, { label: 'Отказаться', fn: () => {} }]
    });
  };
  G.oppProgress = function (sim, ev) {
    for (let i = sim.opps.length - 1; i >= 0; i--) {
      const op = sim.opps[i];
      const o = OPPORTUNITIES[op.k];
      const gl = o.goal;
      let hit = false, amount = 1;
      if (gl.k === 'cook' && ev.k === 'cook' && !ev.quick && ev.q >= gl.q) hit = true;
      if (gl.k === 'fish' && ev.k === 'fish' && (!gl.f || ev.f === gl.f)) hit = true;
      if (gl.k === 'harvest' && ev.k === 'harvest') hit = true;
      if (gl.k === 'meet' && ev.k === 'meet') hit = true;
      if (gl.k === 'act' && ev.k === 'act' && ev.a === gl.a) hit = true;
      if (gl.k === 'social' && ev.k === 'social' && ev.ok && ev.cat === gl.cat) hit = true;
      if (gl.k === 'guitar_public' && ev.k === 'guitar_public') hit = true;
      if (gl.k === 'jog_min' && ev.k === 'jog_min') { hit = true; amount = ev.n; }
      if (gl.k === 'workout_min' && (ev.k === 'workout_min')) { hit = true; amount = ev.n; }
      if (gl.k === 'guitar_min' && ev.k === 'guitar_min') { hit = true; amount = ev.n; }
      if (gl.k === 'paint' && ev.k === 'paint' && ev.q >= gl.q) hit = true;
      if (gl.k === 'write' && ev.k === 'write') hit = true;
      if (gl.k === 'chess' && ev.k === 'chess' && ev.win) hit = true;
      if (gl.k === 'repair' && ev.k === 'repair') hit = true;
      if (gl.k === 'visit_set' && ev.k === 'visit' && gl.lots.includes(ev.lot) && !op.lots.includes(ev.lot)) { op.lots.push(ev.lot); hit = true; }
      if (!hit) continue;
      op.n += amount;
      const need = gl.k === 'visit_set' ? gl.lots.length : gl.n || 1;
      if (op.n >= need) {
        sim.opps.splice(i, 1);
        if (o.reward.money) this.earn(sim, o.reward.money, 'Возможность');
        if (o.reward.perf && sim.job) sim.job.perf = clamp(sim.job.perf + o.reward.perf, -100, 100);
        this.notify(sim.first + ' выполняет «' + o.name + '»!' + (o.reward.money ? ' Получено ' + S.fmtMoney(o.reward.money) + '.' : ''), { sim, icon: 'm_star', kind: 'opp' });
        this.note(sim, { k: 'opp_done' });
      }
    }
  };
  G.oppExpire = function (sim) {
    for (let i = sim.opps.length - 1; i >= 0; i--) {
      if (sim.opps[i].until > this.t) continue;
      const o = OPPORTUNITIES[sim.opps[i].k];
      sim.opps.splice(i, 1);
      if (o.src.career && sim.job) sim.job.perf = clamp(sim.job.perf - 10, -100, 100);
      this.notify('Время на «' + o.name + '» вышло.', { sim, icon: 'm_clock', minor: true });
    }
  };

  G.ageUp = function (sim) {
    const next = AGE_INFO[sim.age].next;
    if (!next) return;
    const prev = sim.age;
    sim.age = next;
    sim.ageDays = 0;
    sim.ageLen = this.stageLength(next);
    sim.addMood('birthday', this.t);
    const look = sim.look;
    const fresh = S.makeLook(this.rng, sim.gender, next, { skin: look.skin, hairC: look.hairC, eyes: look.eyes });
    if (next === 'child' || next === 'toddler' || next === 'teen' || next === 'ya') look.outfits = fresh.outfits;
    if (prev === 'toddler' || prev === 'baby') look.hair = fresh.hair;
    if (next === 'elder') { look.hairC = fresh.hairC; sim.addMood('elder_blues', this.t); }
    if (next === 'child') { sim.school = { perf: 10, grade: 'C' }; sim.flags.newSchool = true; }
    if (next === 'ya') { sim.school = null; sim.inv = sim.inv.filter(i => i.k !== 'homework'); if (sim.job && PART_TIME[sim.job.c]) sim.job = null; }
    if (next === 'toddler') { sim.carriedBy = null; sim.inCrib = null; for (const ob of this.world.objects.values()) if (ob.use.baby === sim.id) delete ob.use.baby; }
    const want = AGE_INFO[next].traits;
    const add = Math.max(0, want - sim.traits.length);
    if (add > 0) {
      const pick = S.pickTraits(this.rng, next, sim.traits.length + add, sim.traits);
      const newOnes = pick.slice(sim.traits.length);
      if (this.isActive(sim) && this.hooks.dialog && newOnes.length) this.hooks.dialog('trait', { sim, suggest: newOnes, count: newOnes.length });
      else sim.traits = pick;
    }
    if (!sim.ltw && (next === 'teen' || next === 'ya')) {
      const opts = S.ltwOptions(sim.traits, this.rng, 5);
      if (this.isActive(sim) && this.hooks.dialog) this.hooks.dialog('ltw', { sim, opts });
      else sim.ltw = opts[0];
    }
    this.note(sim, { k: 'age', a: next });
    if (this.isActive(sim)) { this.notify('С днём рождения! ' + sim.first + ' теперь ' + AGE_INFO[next].name.toLowerCase() + '.', { sim, icon: 'm_cake', kind: 'birthday' }); this.fx('sparkle', sim); this.sound('birthday', sim); }
  };

  G.tryForBaby = function (a, b) {
    const f = a.gender === 'f' ? a : b.gender === 'f' ? b : null;
    const m = f === a ? b : a;
    if (!f || f.preg || f.age === 'elder' || m.age === 'elder' || f.age === 'teen') return false;
    const chance = 0.55 + (f.hasReward('fertility') || m.hasReward('fertility') ? 0.3 : 0);
    if (!this.rng.chance(chance)) return false;
    f.preg = { father: m.id, t: this.t, days: 0, labor: false, twins: this.rng.chance(f.hasReward('fertility') || m.hasReward('fertility') ? 0.35 : 0.1) };
    if (this.isActive(f) || this.isActive(m)) this.sound('chime', f);
    return true;
  };
  G.pregHour = function (sim, hour) {
    const p = sim.preg;
    const age = (this.t - p.t) / 1440;
    if (age >= 0.4 && !p.told) {
      p.told = true;
      sim.addMood('nauseous', this.t);
      if (this.isActive(sim)) this.notify(sim.first + ' чувствует себя странно по утрам... Похоже, в семье скоро будет пополнение!', { sim, icon: 'm_baby', kind: 'preg' });
    }
    p.days = Math.floor(age);
    if (age >= 3 && !p.labor) {
      p.labor = true; p.laborT = this.t;
      this.hardStop(sim);
      if (this.isActive(sim)) this.notify('У ' + sim.first + ' начались схватки! Можно поехать в больницу или рожать дома.', { sim, icon: 'm_baby', actions: [{ label: 'В больницу', fn: () => { const hb = this.world.objects.get(this.world.lotByKey.hospital.building); if (hb) this.queue(sim, 'rh', hb, { what: 'birth', user: true }); } }, { label: 'Дома', fn: () => this.giveBirth(sim, false) }] });
    }
    if (p.labor && this.t - p.laborT > 150 && sim.preg && !sim.inside) this.giveBirth(sim, false);
  };
  G.giveBirth = function (mother, hospital) {
    if (!mother.preg) return;
    const father = this.sims.get(mother.preg.father);
    const n = mother.preg.twins ? 2 : 1;
    mother.preg = null;
    mother.removeMood('pregnant');
    const hh = this.hh(mother);
    const born = [];
    for (let i = 0; i < n; i++) {
      if (hh && this.householdSize(mother) >= 8) break;
      const gender = this.rng.chance(0.5) ? 'm' : 'f';
      const look = S.makeLook(this.rng, gender, 'baby', { skin: this.rng.chance(0.5) || !father ? mother.look.skin : father.look.skin, hairC: this.rng.chance(0.5) || !father ? mother.look.hairC : father.look.hairC, eyes: this.rng.chance(0.5) || !father ? mother.look.eyes : father.look.eyes });
      const baby = S.randomSim(this.rng, { gender, age: 'baby', last: mother.last, look });
      baby.traits = S.pickTraits(this.rng, 'toddler', 2, []);
      baby.npc = mother.npc;
      this.addSim(baby, hh);
      baby.ageDays = 0;
      baby.parents = [mother.id].concat(father ? [father.id] : []);
      baby.x = mother.x; baby.y = mother.y; baby.lot = mother.lot;
      for (const p of [mother, father]) if (p) { const r = this.rel(p, baby); r.met = true; r.v = 50; }
      born.push(baby);
    }
    for (const s of this.members(hh)) if (!s.isBaby) s.addMood('new_baby', this.t);
    const crib = this.world.objectsInLot(hh ? hh.lot : -9, o => D(o.t).crib && !o.use.baby)[0];
    for (const b of born) {
      const c = this.world.objectsInLot(hh ? hh.lot : -9, o => D(o.t).crib && !o.use.baby)[0];
      if (c && !hospital) this.putInCrib(null, b, c);
      else if (!hospital && !mother.carry) this.pickUp(mother, b);
    }
    if (hospital) {
      for (const b of born) { const c = this.world.objectsInLot(hh ? hh.lot : -9, o => D(o.t).crib && !o.use.baby)[0]; if (c) this.putInCrib(null, b, c); else this.pickUp(mother, b); }
    }
    this.note(mother, { k: 'baby' }); if (father) this.note(father, { k: 'baby' });
    if (this.isActive(mother)) {
      const who = born.length > 1 ? 'Родились близнецы' : born[0].gender === 'f' ? 'Родилась девочка' : 'Родился мальчик';
      this.notify(who + '! Добро пожаловать в семью, ' + born.map(b => b.first).join(' и ') + '!', { sim: mother, icon: 'm_baby', kind: 'baby' });
      if (!crib) this.notify('Купите детскую кроватку, чтобы малыш мог спать.', { sim: mother, icon: 'b_bed', minor: true });
      if (this.hooks.dialog) for (const b of born) this.hooks.dialog('name', { sim: b });
    }
  };
  G.pickUp = function (carrier, baby) {
    if (!carrier || carrier.carry) return;
    if (baby.inCrib) { const c = this.world.objects.get(baby.inCrib); if (c) delete c.use.baby; baby.inCrib = null; }
    carrier.carry = baby.id; baby.carriedBy = carrier.id; carrier.prop = 'baby';
    this.hardStop(baby);
  };
  G.putDown = function (carrier) {
    const b = this.sims.get(carrier.carry);
    carrier.carry = null; carrier.prop = null;
    if (!b) return;
    b.carriedBy = null;
    const p = this.world.nearestWalkable(carrier.x, carrier.y, 3, null, carrier.lv || 0) || [Math.floor(carrier.x), Math.floor(carrier.y)];
    b.x = p[0] + 0.5; b.y = p[1] + 0.5; b.lv = carrier.lv || 0;
  };
  G.putInCrib = function (carrier, baby, crib) {
    if (carrier) { carrier.carry = null; carrier.prop = null; }
    baby.carriedBy = null;
    const c = this.world.center(crib);
    baby.x = c[0]; baby.y = c[1]; baby.lv = crib.lv || 0; baby.face = S.dirAngle(crib.r);
    baby.inCrib = crib.id; crib.use.baby = baby.id;
    baby.lieH = S.BED_H.crib;
    this.hardStop(baby);
    if (baby.isToddler) this.queue(baby, 'crib_sleep', crib, {});
  };
  S.defAct('crib_sleep', {
    name: 'Спать в кроватке', icon: 'm_zzz', cat: 'sleep', hidden: true,
    test: () => true,
    run: function* (a, sim, crib) {
      sim.lieH = S.BED_H.crib; a.anim('lie'); sim.sleeping = true;
      yield* a.loop(600, dt => { sim.addNeed('energy', 0.5 * dt); if (Math.random() < dt * 0.1) a.think('m_zzz', 1); }, () => sim.needs.energy >= 100);
      sim.sleeping = false; sim.lieH = 0;
      if (crib.use.baby === sim.id) delete crib.use.baby;
      sim.inCrib = null;
      const p = a.game.world.nearestWalkable(sim.x, sim.y, 3, null, sim.lv || 0);
      if (p) { sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; }
    }
  });

  G.ambrosia = function (sim) {
    if (sim.age === 'elder') sim.flags.ambrosia = true;
    sim.ageDays = 0;
    for (const n of NEED_KEYS) sim.needs[n] = 100;
    this.notify(sim.first + ' отведал' + g(sim, '', 'а') + ' амброзии. Годы будто отступили!', { sim, icon: 'm_sparkle' });
  };

  G.die = function (sim, cause) {
    if (sim.dead) return;
    const flower = sim.inv.findIndex(it => it.k === 'produce' && it.p === 'deathflower');
    if (flower >= 0) {
      sim.inv.splice(flower, 1);
      if (cause === 'old') sim.ageDays = Math.max(0, sim.ageLen - 3);
      sim.starveT = 0; sim.needs.hunger = Math.max(sim.needs.hunger, 0);
      this.notify('Смерть пришла за ' + sim.first + ', но цветок смерти в кармане заставил её уйти ни с чем.', { sim, icon: 'm_grave' });
      return;
    }
    this.hardStop(sim);
    if (sim.carry) this.putDown(sim);
    sim.dead = true; sim.deathCause = cause; sim.anim = 'dead'; sim.lieH = 0.02;
    if (this.hh(sim) && sim.inv.length) { this.famInv(this.hh(sim)).push(...sim.inv.filter(it => it.k !== 'homework')); sim.inv = []; }
    const words = { old: 'Прожил' + g(sim, '', 'а') + ' долгую жизнь', starve: 'Забыл' + g(sim, '', 'а') + ' поесть', fire: 'Слишком близко к огню' }[cause] || 'Покойся с миром';
    this.services.push({ kind: 'reaper', at: this.t, sim: sim.id, x: sim.x, y: sim.y, lv: sim.lv || 0, lot: sim.lot, words });
    const hh = this.hh(sim);
    for (const s of this.sims.values()) {
      if (s.dead || s === sim) continue;
      const r = this.peekRel(s, sim);
      const fam = this.isFamily(s, sim) || (r && r.flags.married);
      if (fam) s.addMood('mourning', this.t);
      else if (r && r.v >= 35) s.addMood('sad', this.t, { dur: 1440 });
      if (Math.hypot(s.x - sim.x, s.y - sim.y) < 10 && !s.hidden) s.addMood('saw_reaper', this.t);
    }
    if (hh && this.isActive(sim)) this.notify(sim.first + ' ' + sim.last + ' ' + ({ old: 'умер' + g(sim, '', 'ла') + ' от старости', starve: 'умер' + g(sim, '', 'ла') + ' от голода', fire: 'погиб' + g(sim, '', 'ла') + ' при пожаре' }[cause] || 'умер' + g(sim, '', 'ла')) + '.', { sim, icon: 'm_grave', kind: 'death', force: true });
    const spouse = this.spouseOf(sim);
    if (spouse) { const r = this.rel(sim, spouse); delete r.flags.married; r.flags.widow = true; }
  };

  G.startService = function (svc) {
    svc.started = true;
    const w = this.world;
    const lot = this.lots[svc.lot];
    if (svc.kind === 'reaper') {
      const r = this.makeServiceSim('reaper', svc);
      const p = w.nearestWalkable(svc.x, svc.y, 3, null, svc.lv || 0) || [Math.floor(svc.x), Math.floor(svc.y)];
      r.x = p[0] + 0.5; r.y = p[1] + 0.5; r.lv = svc.lv || 0; r.lot = w.lotAt(p[0], p[1]);
      this.queue(r, 'svc_reaper', this.sims.get(svc.sim), { svc });
      return;
    }
    if (!lot) { svc.done = true; return; }
    const s = this.makeServiceSim(svc.kind, svc);
    const dir = this.rng.chance(0.5) ? -1 : 1;
    const start = w.nearestWalkable(lot.curb[0] + dir * 52, lot.curb[1] + this.rng.int(-10, 10), 14, (x, y) => w.ter(x, y) === S.TER.walk) || w.nearestWalkable(lot.curb[0], lot.curb[1], 5) || lot.curb;
    s.x = start[0] + 0.5; s.y = start[1] + 0.5; s.lot = w.lotAt(start[0], start[1]);
    this.queue(s, 'svc_' + svc.kind, lot, { svc });
  };

  G.makeServiceSim = function (kind, svc) {
    const rng = this.rng;
    const g2 = kind === 'reaper' ? 'm' : rng.chance(0.5) ? 'm' : 'f';
    const names = { reaper: ['Смерть', ''], firefighter: [null, 'Пожарный'], police: [null, 'Полицейский'], burglar: ['Грабитель', ''], repairman: [null, 'Мастер'], pizza: [null, 'Курьер'], social: [null, 'Соцработник'], repo: [null, 'Пристав'], maid: [null, 'Горничная'] };
    const s = S.randomSim(rng, { gender: g2, age: kind === 'pizza' ? 'ya' : 'adult' });
    if (names[kind] && names[kind][0]) { s.first = names[kind][0]; s.last = names[kind][1]; }
    else if (names[kind]) s.last = names[kind][1];
    s.svc = kind; s.npc = true; s.traits = [];
    const U = { firefighter: ['#e8c832', '#c83a2a'], police: ['#2a3c7a', '#1c2448'], burglar: ['#1c1c20', '#e8e8e8'], repairman: ['#3a5a8a', '#3a5a8a'], pizza: ['#c83a2a', '#2a2a30'], social: ['#8a8c90', '#4a4e5a'], repo: ['#3a3e4a', '#2a2a30'], maid: ['#2a2a30', '#2a2a30'], reaper: ['#141418', '#141418'] }[kind];
    if (U) s.look.outfits.everyday = { top: kind === 'reaper' ? 'robe' : 'shirt', tc: U[0], bottom: 'pants', bc: U[1], shoes: '#1c1c20', sleeves: 1, uniform: kind };
    this.addSim(s, null);
    for (const n of NEED_KEYS) s.needs[n] = 100;
    return s;
  };
  G.removeSim = function (sim) {
    this.hardStop(sim);
    this.sims.delete(sim.id);
    for (const k of [...this.rels.keys()]) if (k.split(':').map(Number).includes(sim.id)) this.rels.delete(k);
    for (const c of this.vehicles) if (c.sim === sim.id) c.leave = true;
  };

  G.plantSeed = function (sim, x, y, seed) {
    let p = seed;
    if (seed === 'common') p = this.rng.pick(['tomato', 'lettuce', 'apple']);
    if (seed === 'uncommon') p = this.rng.pick(['potato', 'onion', 'grapes', 'garlic', 'watermelon']);
    if (!PLANTS[p]) p = 'tomato';
    const L = sim.skillLevel('gardening');
    this.world.placeObject('plant_garden', x, y, 0, { lot: this.world.lotAt(x, y), st: { p, growth: 0, water: 100, weeds: 0, dry: 0, care: L, gt: sim.has('green_thumb') ? 1 : 0, dead: false } });
    this.dirtyObjs();
    this.note(sim, { k: 'plant', p });
    if (this.isActive(sim)) this.fx('text', sim, PLANTS[p].name);
  };
  G.plantsDaily = function () {
    for (const ob of this.world.objects.values()) {
      if (ob.t !== 'plant_garden' || ob.st.dead) continue;
      const st = ob.st, P = PLANTS[st.p] || PLANTS.tomato;
      st.water = Math.max(0, st.water - 40);
      st.weeds = Math.min(100, st.weeds + 15);
      if (st.water <= 0) st.dry++; else st.dry = 0;
      if (st.dry >= 3) { st.dead = true; continue; }
      if (st.growth < 1) st.growth = Math.min(1, st.growth + (1 / P.days) * (st.water > 25 ? 1 : 0.35) * (st.weeds < 50 ? 1 : 0.6) * (st.gt ? 1.25 : 1));
    }
    this.dirtyObjs();
  };
  G.harvestPlant = function (sim, ob) {
    const st = ob.st, P = PLANTS[st.p] || PLANTS.tomato;
    const L = sim.skillLevel('gardening');
    const q = clamp(Math.round(1 + L * 0.3 + (st.care || 0) * 0.1 + (st.weeds < 30 ? 0.5 : -0.5) + (sim.has('green_thumb') ? 0.8 : 0) + (this.rng.next() - 0.5)), 0, 5);
    const n = 1 + Math.floor(L / 4) + (sim.has('green_thumb') ? 1 : 0);
    if (st.p === 'moneytree') {
      const m = n * this.rng.int(40, 120);
      this.earn(sim, m, 'Денежное дерево');
      this.notify('С денежного дерева собрано ' + S.fmtMoney(m) + '.', { sim, icon: 'm_money', minor: true });
    } else {
      for (let i = 0; i < n; i++) sim.inv.push({ k: 'produce', p: st.p, q, value: Math.round(P.value * (0.6 + q * 0.25)) });
      if (this.isActive(sim)) this.fx('text', sim, P.name + ' ×' + n);
    }
    st.growth = 0.45;
    sim.stat('harvests');
    if (q >= 5) sim.stat('perfectHarvests');
    this.note(sim, { k: 'harvest', p: st.p, q });
    if (sim.has('green_thumb')) sim.addMood('plant_love', this.t);
    this.dirtyObjs();
  };

  G.catchFish = function (sim, kind) {
    const L = sim.skillLevel('fishing');
    const night = this.isNight();
    const pool = [];
    for (const k of Object.keys(FISH)) {
      const f = FISH[k];
      if (!f.where.includes(kind) && !(kind === 'grave' && f.where.includes('pond') && f.lvl <= 3)) continue;
      if (k === 'deathfish' && !night) continue;
      if (f.lvl > L + 1) continue;
      const w = f.lvl <= L ? 1 + f.lvl * 0.25 : 0.2;
      pool.push([k, w]);
    }
    if (!pool.length) pool.push([kind === 'sea' ? 'anchovy' : 'minnow', 1]);
    const k = this.rng.weighted(pool);
    const f = FISH[k];
    const w = Math.round((f.w[0] + (f.w[1] - f.w[0]) * this.rng.next() * (0.5 + L / 20)) * 100) / 100;
    const value = Math.round(f.value * (0.8 + (w - f.w[0]) / Math.max(0.01, f.w[1] - f.w[0]) * 0.6));
    sim.inv.push({ k: 'fish', f: k, w, value });
    const first = !sim.fishSeen[k];
    sim.fishSeen[k] = 1;
    sim.stat('fishCaught');
    this.gainSkill(sim, 'fishing', 8);
    if (sim.has('angler')) sim.addMood('good_catch', this.t);
    this.note(sim, { k: 'fish', f: k });
    if (this.isActive(sim)) {
      this.fx('text', sim, f.name + ' ' + w + ' кг');
      if (first) this.notify(sim.first + ' впервые поймал' + g(sim, '', 'а') + ' рыбу «' + f.name + '» (' + w + ' кг).', { sim, icon: 'm_fish', minor: true });
      this.sound('splash', sim);
    }
  };

  G.randomCollect = function (rare) {
    const list = Object.keys(COLLECT).map(k => [k, Math.max(0.2, 5 - COLLECT[k].rare * 1.1 + (rare || 0) * COLLECT[k].rare * 0.4)]);
    return this.rng.weighted(list);
  };
  G.spawnCollectibles = function () {
    const w = this.world;
    for (const sp of w.spawns || []) {
      const i = w.idx(sp.x, sp.y);
      if (w.layer.ground[i] || w.layer.occ[i]) continue;
      if (!this.rng.chance(0.55)) continue;
      const seed = this.rng.chance(0.2);
      const c = seed ? 'seed:' + this.rng.weighted([['common', 5], ['uncommon', 3], ['lifefruit', 0.6], ['deathflower', 0.4]]) : this.randomCollect(sp.lot >= 0 ? 1 : 0);
      w.placeObject('collectible', sp.x, sp.y, 0, { lot: sp.lot, st: { c } });
    }
    this.dirtyObjs();
  };

  G.finishNovel = function (sim) {
    const nv = sim.flags.novel;
    sim.flags.novel = null;
    if (!nv) return;
    const L = sim.skillLevel('writing');
    const q = clamp(Math.round(1 + L * 0.35 + (sim.has('artistic') || sim.has('bookworm') ? 0.5 : 0) + (this.rng.next() - 0.5) * 1.5), 0, 5);
    const weekly = Math.round((25 + L * L * 9) * (0.5 + q * 0.25) * (sim.stats.books >= 10 ? 1.25 : 1));
    const hh = this.hh(sim);
    if (hh) hh.royalties.push({ sim: sim.id, title: nv.title, weekly, weeks: 8 });
    this.earn(sim, weekly, 'Аванс');
    sim.stat('books');
    this.note(sim, { k: 'write', g: nv.genre });
    this.notify(sim.first + ' дописал' + g(sim, '', 'а') + ' книгу «' + nv.title + '» (' + S.BOOK_GENRES[nv.genre].toLowerCase() + '). Качество: ' + S.QUALITY[q] + '. Гонорар: ' + S.fmtMoney(weekly) + ' в неделю в течение двух месяцев.', { sim, icon: 'sk_writing' });
  };
  G.payRoyalties = function () {
    for (const hh of this.households.values()) {
      let sum = 0;
      for (const r of hh.royalties) if (r.weeks > 0) { sum += r.weekly; r.weeks--; }
      hh.royalties = hh.royalties.filter(r => r.weeks > 0);
      if (sum > 0) { hh.funds += sum; if (hh.id === this.activeHH) this.notify('Пришли гонорары за книги: ' + S.fmtMoney(sum) + '.', { icon: 'sk_writing', force: true, minor: true }); }
    }
  };

  G.sellItems = function (sim, kinds) {
    let sum = 0, n = 0;
    const keep = [];
    for (const it of sim.inv) {
      if (kinds.includes(it.k) && it.value) { sum += it.value; n++; if (it.k === 'painting') { sim.stat('paintingsSold'); this.note(sim, { k: 'sell', what: 'painting', v: it.value }); } }
      else if (kinds.includes('collect') && it.k === 'collect') { const v = COLLECT[it.c] ? COLLECT[it.c].value : 10; sum += v; n++; }
      else keep.push(it);
    }
    sim.inv = keep;
    if (sum > 0) { this.earn(sim, sum, 'Продажа'); this.notify(sim.first + ' продаёт ' + n + ' ' + S.plural(n, ['вещь', 'вещи', 'вещей']) + ' за ' + S.fmtMoney(sum) + '.', { sim, icon: 'm_money', minor: true }); }
  };
  G.buyItem = function (sim, item, price) {
    if (!this.spend(sim, price, 'Покупка')) return false;
    sim.inv.push(item);
    return true;
  };

  G.chatMeet = function (sim) {
    const list = [...this.sims.values()].filter(s => !s.dead && !s.svc && s !== sim && !s.isKid && s.hh !== sim.hh && !this.rel(sim, s).met);
    if (!list.length) return;
    const o = this.rng.pick(list);
    this.meet(sim, o);
    this.relAdd(sim, o, 10);
    if (this.isActive(sim)) this.notify(sim.first + ' познакомил' + g(sim, 'ся', 'ась') + ' в чате с ' + o.first + ' ' + o.last + '.', { sim, icon: 'm_computer', minor: true });
  };
  G.cleanedUp = function (sim) {
    this.note(sim, { k: 'clean' });
    sim.stat('cleaned');
    if (sim.has('neat')) sim.addNeed('fun', 4);
  };
  G.onBroken = function (ob, sim) {
    this.dirtyObjs();
    if (this.isActive(sim)) this.notify(D(ob.t).name + ' сломал' + (D(ob.t).name.endsWith('а') ? 'ась' : 'ся') + '. Почините сами или вызовите мастера по телефону.', { sim, icon: 'sk_handiness', minor: true });
  };

  G.findBedFor = function (a, b) {
    const lot = a.lot;
    let best = null;
    for (const ob of this.world.objects.values()) {
      if (ob.lot !== lot || !D(ob.t).bed || ob.t === 'crib') continue;
      if (!D(ob.t).double) continue;
      if (Object.keys(ob.use).some(k => ob.use[k] !== a.id && ob.use[k] !== b.id)) continue;
      if (!best || Math.hypot(ob.x - a.x, ob.y - a.y) < Math.hypot(best.x - a.x, best.y - a.y)) best = ob;
    }
    return best;
  };

  G.noteRomance = function (a, b) {
    for (const [x, y] of [[a, b], [b, a]]) {
      x.flags.romanced = x.flags.romanced || {};
      if (!x.flags.romanced[y.id]) { x.flags.romanced[y.id] = 1; x.stat('romances'); }
    }
  };
  G.marry = function (a, b) {
    const r = this.rel(a, b);
    delete r.flags.engaged; r.flags.married = true; r.flags.romance = true; r.flags.steady = true;
    a.addMood('just_married', this.t); b.addMood('just_married', this.t);
    this.note(a, { k: 'married', t: b.id }); this.note(b, { k: 'married', t: a.id });
    if (a.hh !== b.hh) this.moveIn(this.isActive(a) ? a : b, this.isActive(a) ? b : a, true);
    const wife = a.gender === 'f' ? a : b.gender === 'f' ? b : null, husband = wife === a ? b : a;
    if (wife && husband && wife.gender !== husband.gender && wife.hh === husband.hh) wife.last = husband.last;
    this.notify(a.first + ' и ' + b.first + ' поженились! Горько!', { sim: this.isActive(a) ? a : b, icon: 'm_ring', kind: 'wedding' });
    this.fx('sparkle', a); this.fx('sparkle', b);
    this.sound('wedding', a);
  };
  G.moveIn = function (host, guest, quiet) {
    const hh = this.hh(host);
    if (!hh || this.householdSize(host) >= 8 || guest.hh === host.hh) return;
    const old = this.hh(guest);
    if (old) {
      old.members = old.members.filter(id => id !== guest.id);
      const kids = this.members(old).filter(s => (s.parents || []).includes(guest.id) && S.ageIdx(s.age) <= 2);
      for (const k of kids) if (this.householdSize(host) < 8) { old.members = old.members.filter(id => id !== k.id); hh.members.push(k.id); k.hh = hh.id; k.npc = host.npc; }
      if (!this.members(old).length) { const lot = this.lots[old.lot]; if (lot) { lot.hh = null; lot.sale = true; } this.households.delete(old.id); }
      else hh.funds += Math.round(old.funds * 0.3), old.funds = Math.round(old.funds * 0.7);
    }
    hh.members.push(guest.id);
    guest.hh = hh.id;
    guest.npc = host.npc;
    guest.visitor = null;
    this.hardStop(guest);
    if (!quiet) this.notify(guest.first + ' переезжает к ' + host.first + '.', { sim: host, icon: 'm_house' });
    if (this.isActive(host)) { this.queue(guest, 'go_home', guest, {}); }
  };
  G.divorce = function (a, b) {
    const r = this.rel(a, b);
    for (const f of ['married', 'romance', 'steady', 'engaged', 'crush']) delete r.flags[f];
    r.flags.ex = true;
    a.addMood('divorced', this.t); b.addMood('divorced', this.t);
    this.notify(a.first + ' и ' + b.first + ' развелись.', { sim: this.isActive(a) ? a : b, icon: 'm_broken' });
  };

  G.sendHome = function (sim) {
    this.hardStop(sim);
    sim.visitor = null;
    if (this.hh(sim)) this.queue(sim, 'go_home', sim, {});
    else if (sim.svc) this.queue(sim, 'svc_leave', sim, {});
  };
  G.greet = function (host, v) {
    if (!v.visitor) v.visitor = { lot: host.lot, until: this.t + 240 };
    v.visitor.waiting = false;
    v.visitor.until = Math.max(v.visitor.until, this.t + 180);
    const lot = this.lots[host.lot];
    if (lot && lot.doorIn) this.queue(v, 'go_here', lot.doorIn, {});
  };
  G.inviteOver = function (host, guest) {
    const hh = this.hh(host);
    if (!hh) return false;
    const r = this.rel(host, guest);
    const ok = guest.canAct && !guest.sleeping && !guest.job?.inShift && this.rng.next() * 100 < 55 + r.v * 0.4;
    if (!ok) { this.notify(guest.first + ' не может прийти сегодня.', { sim: host, icon: 'm_phone', minor: true }); return false; }
    this.hardStop(guest);
    guest.visitor = { lot: hh.lot, until: this.t + 300, waiting: false, invited: true };
    const lot = this.lots[hh.lot];
    const goal = lot.doorIn || lot.entrance;
    this.queue(guest, 'go_here', goal, {});
    this.notify(guest.first + ' принимает приглашение и скоро придёт.', { sim: host, icon: 'm_house', minor: true });
    this.note(host, { k: 'invite', t: guest.id });
    return true;
  };

  G.planNpc = function (sim) {
    if (sim.svc) return false;
    const h = this.hour;
    const hh = this.hh(sim);
    if (sim.visitor) {
      if (this.t > sim.visitor.until || (h >= 23 || h < 6)) { this.sendHome(sim); return true; }
      return false;
    }
    if (!hh || S.ageIdx(sim.age) < 2) return false;
    const home = this.lots[hh.lot];
    if (!home) return false;
    if (!sim.npc) {
      if (sim.lot !== home.id && !sim.flags.userAway && (sim.needs.hunger < -10 || sim.needs.energy < -10 || sim.needs.bladder < -40 || sim.needs.hygiene < -40)) { this.queue(sim, 'go_home', sim, {}); return true; }
      return false;
    }
    const atHome = sim.lot === home.id;
    if (!atHome) {
      sim.flags.outT = (sim.flags.outT || 0);
      if (h >= 22 || h < 6 || sim.needs.energy < -20 || sim.needs.hunger < -30 || sim.needs.bladder < -40 || (sim.flags.leaveAt && this.t > sim.flags.leaveAt)) {
        sim.flags.leaveAt = 0;
        this.queue(sim, 'go_home', sim, {});
        return true;
      }
      return false;
    }
    if (h >= 9 && h <= 20 && S.ageIdx(sim.age) >= 2 && sim.needs.energy > 0 && sim.needs.hunger > -10 && this.rng.chance(0.012)) {
      const pref = [];
      const add = (k, w) => { if (this.world.lotByKey[k]) pref.push([k, w]); };
      add('park', 3 + (sim.has('loves_outdoors') ? 4 : 0) + (sim.isKid ? 3 : 0));
      add('gym', sim.has('athletic') ? 5 : 0.5);
      add('library', sim.has('bookworm') || sim.has('genius') ? 4 : 0.5);
      add('beach', 1.5 + (sim.has('loves_outdoors') ? 2 : 0));
      add('pier', sim.has('angler') ? 5 : 0.5);
      add('lighthouse', 0.6);
      add('graveyard', sim.has('insane') || sim.has('evil') ? 2 : 0.2);
      for (const k of ['bistro', 'theater', 'stadium', 'spa']) add(k, S.isAdultish(sim.age) ? 0.7 : 0.2);
      const k = this.rng.weighted(pref);
      const lot = this.world.lotByKey[k];
      if (lot.kind === 'rabbit') {
        const b = this.world.objects.get(lot.building);
        const what = { bistro: 'eat', theater: 'show', stadium: 'game', spa: 'spa' }[k];
        if (b && what && this.hh(sim).funds > 200) { this.queue(sim, 'rh', b, { what }); return true; }
        return false;
      }
      sim.flags.leaveAt = this.t + this.rng.range(90, 240);
      this.queue(sim, 'visit_lot', lot, {});
      return true;
    }
    return false;
  };

  G.welcomeWagon = function () {
    const hh = this.active();
    if (!hh || !hh.movedIn || hh.welcomed || this.t - hh.movedIn < 600) return;
    hh.welcomed = true;
    const lot = this.lots[hh.lot];
    const cands = [...this.sims.values()].filter(s => !s.dead && !s.svc && s.hh !== hh.id && S.isAdultish(s.age) && !s.inside && !(s.job && s.job.inShift));
    this.rng.shuffle(cands);
    for (const s of cands.slice(0, 3)) {
      this.hardStop(s);
      s.visitor = { lot: hh.lot, until: this.t + 240, waiting: true, wagon: true };
      this.queue(s, 'go_here', lot.frontDoor || lot.curb, {});
    }
    this.notify('Соседи идут знакомиться! Поприветствуйте их у двери, чтобы пригласить в дом.', { icon: 'm_house', force: true });
    this.flags.wagonCake = true;
  };
  G.walkby = function () {
    const hh = this.active();
    if (!hh || hh.lot < 0) return;
    if (this.isRaining && this.isRaining() && this.rng.chance(0.75)) return;
    const lot = this.lots[hh.lot];
    const near = [...this.sims.values()].filter(s => !s.dead && !s.svc && s.hh !== hh.id && s.npc && !s.inside && !s.visitor && S.ageIdx(s.age) >= 2 && !s.queue.length && s.lot !== hh.lot && Math.hypot(s.x - lot.curb[0], s.y - lot.curb[1]) < 60);
    if (!near.length || !this.rng.chance(0.4)) return;
    const s = this.rng.pick(near);
    const sw = this.world.nearestWalkable(lot.curb[0] + this.rng.int(-6, 6), lot.curb[1] + this.rng.int(-6, 6), 4, (x, y) => this.world.ter(x, y) === S.TER.walk);
    if (sw) this.queue(s, 'go_here', sw, {});
  };

  G.nightEvents = function (hour) {
    const hh = this.active();
    if (!hh || hh.lot < 0) return;
    if (hour === 2 && this.rng.chance(0.06) && !this.services.some(s => s.kind === 'burglar' && !s.done)) {
      const awake = this.members(hh).some(s => !s.sleeping && !s.inside && s.lot === hh.lot && !s.isKid);
      if (!awake) this.services.push({ kind: 'burglar', at: this.t, lot: hh.lot });
    }
    if (hour === 1) {
      for (const tomb of this.world.objectsInLot(hh.lot, o => o.t === 'tombstone' && o.st.sim)) {
        const ghost = this.sims.get(tomb.st.sim);
        if (ghost && ghost.dead && this.rng.chance(0.25)) { ghost.ghost = true; ghost.hidden = false; ghost.anim = 'ghost'; const c = this.world.center(tomb); ghost.x = c[0] + 0.3; ghost.y = c[1] + 0.8; ghost.lot = hh.lot; ghost.ghostUntil = this.t + 180; }
      }
    }
    this.repoCheck();
  };

  G.phoneMenu = function (sim) {
    const known = [];
    for (const [k, r] of this.rels) {
      if (!r.met) continue;
      const ids = k.split(':').map(Number);
      if (!ids.includes(sim.id)) continue;
      const o = this.sims.get(ids[0] === sim.id ? ids[1] : ids[0]);
      if (!o || o.dead || o.svc || o.isBaby || o.hh === sim.hh) continue;
      known.push([o, r.v]);
    }
    known.sort((a, b) => b[1] - a[1]);
    const list = known.slice(0, 14);
    const out = [];
    if (list.length) {
      out.push({ label: 'Поболтать с...', sub: list.map(([o]) => ({ label: o.first + ' ' + o.last, opt: { call: 'chat', who: o.id } })) });
      if (S.isAdultish(sim.age) || sim.isTeen) out.push({ label: 'Пригласить в гости...', sub: list.filter(([o]) => !o.isKid || sim.isKid).map(([o]) => ({ label: o.first + ' ' + o.last, opt: { call: 'invite', who: o.id } })) });
    }
    out.push({ label: 'Заказать пиццу  ' + S.fmtMoney(40), opt: { call: 'pizza' } });
    if (S.isAdultish(sim.age)) out.push({ label: 'Устроить вечеринку', opt: { call: 'party' }, disabled: list.length >= 3 ? null : 'Нужно больше знакомых' });
    const hh = this.hh(sim);
    const broken = hh ? this.world.objectsInLot(hh.lot, o => o.broken).length : 0;
    out.push({ label: 'Вызвать мастера', opt: { call: 'repair' }, disabled: broken ? null : 'Всё исправно' });
    out.push({ label: 'Вызвать горничную  ' + S.fmtMoney(60), opt: { call: 'maid' } });
    if (S.isAdultish(sim.age)) out.push({ label: 'Усыновить ребёнка...', sub: [['baby', 'Младенца'], ['toddler', 'Малыша'], ['child', 'Ребёнка']].map(([a, l]) => ({ label: l, opt: { call: 'adopt', age: a } })), disabled: S.isAdultish(sim.age) && this.householdSize(sim) < 8 ? null : 'Нельзя' });
    if (sim.job) out.push({ label: 'Уволиться с работы', opt: { call: 'quit' } });
    out.push({ label: 'Найти работу', opt: { call: 'jobs' }, disabled: S.ageIdx(sim.age) >= 3 ? null : 'Слишком мал' });
    return out.filter(e => !(e.sub && !e.sub.length));
  };
  G.phoneAction = function (sim, opt) {
    const hh = this.hh(sim);
    if (!hh) return;
    const lot = this.lots[hh.lot];
    if (opt.call === 'invite') { const o = this.sims.get(opt.who); if (o) this.inviteOver(sim, o); return; }
    if (opt.call === 'pizza') {
      if (!this.spend(sim, 40, 'Пицца')) { this.tip(sim, 'Не хватает денег.'); return; }
      this.services.push({ kind: 'pizza', at: this.t + 40, lot: hh.lot, by: sim.id });
      this.notify('Пиццу привезут минут через сорок.', { sim, icon: 'm_food', minor: true });
      return;
    }
    if (opt.call === 'repair') { this.services.push({ kind: 'repairman', at: this.t + 60, lot: hh.lot, by: sim.id }); this.notify('Мастер приедет через час. Каждый ремонт стоит ' + S.fmtMoney(50) + '.', { sim, icon: 'sk_handiness', minor: true }); return; }
    if (opt.call === 'maid') {
      if (!this.spend(sim, 60, 'Горничная')) { this.tip(sim, 'Не хватает денег.'); return; }
      this.services.push({ kind: 'maid', at: this.t + 60, lot: hh.lot, by: sim.id });
      this.notify('Горничная приедет через час.', { sim, icon: 'm_sparkle', minor: true });
      return;
    }
    if (opt.call === 'party') {
      const list = [];
      for (const [k, r] of this.rels) {
        if (!r.met || r.v < 5) continue;
        const ids = k.split(':').map(Number);
        if (!ids.includes(sim.id)) continue;
        const o = this.sims.get(ids[0] === sim.id ? ids[1] : ids[0]);
        if (o && !o.dead && !o.svc && !o.isKid && o.hh !== sim.hh) list.push(o);
      }
      this.rng.shuffle(list);
      let n = 0;
      for (const o of list.slice(0, 7)) {
        if (o.job && o.job.inShift) continue;
        this.hardStop(o);
        o.visitor = { lot: hh.lot, until: this.t + 360, waiting: false, party: true };
        this.queue(o, 'go_here', lot.doorIn || lot.entrance, {});
        n++;
      }
      hh.party = { t: this.t, guests: n, host: sim.id, funStart: 0 };
      this.notify('Вечеринка начинается! Гостей приглашено: ' + n + '. Приготовьте угощение и включите музыку.', { sim, icon: 'm_party' });
      return;
    }
    if (opt.call === 'adopt') {
      this.services.push({ kind: 'social', at: this.t + 90, lot: hh.lot, by: sim.id, age: opt.age });
      this.notify('Социальный работник привезёт ребёнка через полтора часа.', { sim, icon: 'm_baby', minor: true });
      return;
    }
    if (opt.call === 'quit') { this.quitJob(sim); return; }
    if (opt.call === 'jobs') { this.openJobs(sim); return; }
  };

  G.partyCheck = function () {
    const hh = this.active();
    if (!hh || !hh.party) return;
    const p = hh.party;
    if (this.t - p.t < 300) return;
    const guests = this.simsOnLot(hh.lot).filter(s => s.visitor && s.visitor.party);
    const avg = guests.length ? guests.reduce((s, x) => s + x.needs.fun + x.needs.social, 0) / guests.length / 2 : 0;
    const good = guests.length >= 3 && avg > 30;
    for (const s of this.members(hh)) if (s.lot === hh.lot) s.addMood(good ? 'party' : 'lame_party', this.t);
    const host = this.sims.get(p.host);
    if (host) this.note(host, { k: 'party' });
    this.notify(good ? 'Вечеринка удалась! Гости в восторге.' : 'Вечеринка вышла скучной.', { icon: 'm_party', force: true });
    for (const g3 of guests) this.sendHome(g3);
    hh.party = null;
  };

  G.startFire = function (x, y, sim, lv) {
    const w = this.world;
    lv = lv || 0;
    if (this.fires.some(f => f.x === x && f.y === y && (f.lv || 0) === lv)) return;
    const ob = w.placeObject('fire', x, y, 0, { lot: w.lotAt(x, y), lv });
    const f = { x, y, lv, t: this.t, id: ob.id, lot: ob.lot, alarmed: false };
    this.fires.push(f);
    this.dirtyObjs();
    if (sim) { sim.addMood('scared', this.t); this.hardStop(sim); this.queue(sim, 'panic', sim, {}); }
    const hh = this.active();
    if (hh && f.lot === hh.lot) { this.notify('Пожар! Уведите симов подальше от огня.', { icon: 'm_fire', force: true, kind: 'fire' }); this.sound('fire_alarm', sim); }
  };
  S.defAct('panic', {
    name: 'Паника', icon: 'm_fire', cat: 'fire', hidden: true, test: () => true,
    run: function* (a, sim) {
      const game = a.game, w = game.world;
      a.anim('panic'); a.think('m_fire', 5);
      yield* a.wait(3);
      for (const f of game.fires) {
        if ((f.lv || 0) === (sim.lv || 0) && Math.hypot(f.x + 0.5 - sim.x, f.y + 0.5 - sim.y) < 4) {
          const p = w.nearestWalkable(sim.x + (sim.x - f.x) * 3, sim.y + (sim.y - f.y) * 3, 5, null, sim.lv || 0);
          if (p) yield* a.walk([p], { run: true, noCar: true });
          break;
        }
      }
      a.anim('panic');
      yield* a.wait(4);
    }
  });
  G.setOnFire = function (sim) {
    if (sim.burning) return;
    sim.burning = this.t;
    this.hardStop(sim);
    this.queue(sim, 'panic', sim, {});
    this.notify(sim.first + ' горит!', { sim, icon: 'm_fire' });
  };
  G.fireTick = function (dt) {
    const w = this.world;
    for (const f of this.fires.slice()) {
      if (!w.objects.has(f.id)) { this.fires.splice(this.fires.indexOf(f), 1); continue; }
      const fl = f.lv || 0;
      const room = w.roomAt(f.x, f.y, fl);
      if (!f.alarmed) {
        const alarm = [...w.objects.values()].find(o => o.t === 'alarm_smoke' && (o.lv || 0) === fl && w.roomAt(o.x, o.y, fl) === room && room > 0);
        if (alarm) { f.alarmed = true; this.sound('fire_alarm', null); if (!this.services.some(s => s.kind === 'firefighter' && !s.done)) this.services.push({ kind: 'firefighter', at: this.t + 15, lot: f.lot }); }
      }
      if (this.t - f.t > 80 + (f.id % 60)) {
        const burnt = w.objAt(f.x, f.y, 'occ', fl);
        if (burnt && !D(burnt.t).hidden && D(burnt.t).price && !D(burnt.t).stairs && !D(burnt.t).elevator) { w.removeObject(burnt.id); w.placeObject('trash_pile', f.x, f.y, 0, { lot: w.lotAt(f.x, f.y), lv: fl }); }
        w.removeObject(f.id); this.fires.splice(this.fires.indexOf(f), 1); this.dirtyObjs(); continue;
      }
      if (this.rng.chance(dt * 0.012)) {
        const k = this.rng.int(0, 3);
        const nx = f.x + DX[k], ny = f.y + DY[k];
        const target = w.objAt(nx, ny, 'occ', fl);
        if (target && !D(target.t).hidden && !D(target.t).stairs && !D(target.t).elevator && !['toilet', 'shower', 'sink_bath', 'sink_kitchen', 'bathtub', 'fridge', 'fridge_lux'].includes(target.t) && w.edgeOpen(f.x, f.y, nx, ny, fl) && !this.fires.some(q => q.x === nx && q.y === ny && (q.lv || 0) === fl)) this.startFire(nx, ny, null, fl);
      }
      for (const s of this.sims.values()) {
        if (s.dead || s.hidden || s.svc === 'firefighter' || (s.lv || 0) !== fl) continue;
        const d = Math.hypot(f.x + 0.5 - s.x, f.y + 0.5 - s.y);
        if (d < 0.9 && !s.burning && this.rng.chance(dt * 0.2)) this.setOnFire(s);
        else if (d < 4 && !s.queue.some(q => q.key === 'panic' || q.key === 'extinguish') && !s.isBaby && this.rng.chance(dt * 0.3)) { if (s.queue[0]) s.queue[0].cancel(); this.queue(s, 'panic', s, {}); }
      }
    }
    for (const s of this.sims.values()) {
      if (!s.burning || s.dead) continue;
      if (this.t - s.burning > 12) {
        s.burning = 0;
        if (this.rng.chance(s.has('brave') ? 0.15 : s.has('lucky') ? 0.1 : 0.35)) this.die(s, 'fire');
        else { s.addMood('scared', this.t); s.addNeed('hygiene', -60); }
      }
    }
  };
  G.fireOut = function () { this.fires = this.fires.filter(f => this.world.objects.has(f.id)); };

  G.storyProgress = function () {
    const npcs = [...this.sims.values()].filter(s => !s.dead && !s.svc && s.npc && !this.isActive(s));
    for (const s of npcs) {
      if (!s.isAdult || s.age === 'elder') continue;
      const partner = this.partnerOf(s);
      if (!partner && this.rng.chance(0.03)) {
        const cand = npcs.filter(o => o !== s && o.isAdult && o.age !== 'elder' && o.gender !== s.gender && !this.partnerOf(o) && !this.isFamily(s, o));
        if (cand.length) { const o = this.rng.pick(cand); const r = this.rel(s, o); r.met = true; r.v = Math.max(r.v, 55); r.flags.romance = true; r.flags.steady = true; }
      }
      const sp = this.spouseOf(s);
      if (partner && !sp && this.rng.chance(0.02)) { const o = this.sims.get(partner); if (o && o.npc && !this.isActive(o)) { const r = this.rel(s, o); r.flags.married = true; if (s.hh !== o.hh) this.moveIn(s, o, true); } }
      if (sp && s.gender === 'f' && !s.preg && this.householdSize(s) < 5 && sp.hh === s.hh && this.rng.chance(0.012)) this.tryForBaby(s, sp);
    }
  };

  G.lifeTick = function (dt) {
    if (this.fires.length) this.fireTick(dt);
    if (this.weatherTick) this.weatherTick(dt);
    this.partyCheck();
    for (const s of this.sims.values()) {
      if (s.ghost && this.t > (s.ghostUntil || 0)) { s.ghost = false; s.hidden = true; }
      if (s.ghost) {
        s.animT += dt;
        for (const o of this.simsNear(s, 5)) if (!o.dead && !o.hasMood('ghost_seen') && !o.sleeping) { o.addMood(o.has('brave') ? 'thrilled' : 'ghost_seen', this.t); if (o.has('coward')) o.addMood('trembling', this.t); }
      }
      if (s.visitor && s.visitor.waiting && this.t > (s.visitor.waitSince || (s.visitor.waitSince = this.t)) + 90) { this.sendHome(s); }
    }
    this.services = this.services.filter(s => !s.done);
  };

  Object.assign(S, { wishMatch });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
