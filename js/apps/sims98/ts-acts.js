(function (S) {
  'use strict';
  const QUEUE_LIMIT = 8, THINK_EVERY = 2, TOP_CHOICES = 3, DISTANCE_SOFTEN = 25, SHRUG_MINUTES = 1.5, BUSY_WAIT = 10;
  const WANT_FLOOR = [99, 6, 3, 2], CRITICAL = { bladder: 12, hunger: 12, energy: 8 }, LISTEN_FLOOR = { bladder: 25, hunger: 22, energy: 15 };
  const STROLL_CHANCE = 0.25, STROLL_RANGE = 5, FULL_AT = 99.5, SOCIAL_BASE = 2.4;
  const PASTIME_REST = 120, PASTIME_CHANCE = 0.7, WEAK_WANT = 8, PASTIME_INSTEAD = 0.35, TOWN_TALK = 12, WAIT_FOR_TALK = 15, ADULT_IN_KID_BED = 0.4, TALK_GAP = 1.2, GAP_SLACK = 0.35;
  const HOBBY_NEEDS = new Set(['fun', 'social', 'energy']);
  const NIGHT_FROM = 21 * 60, MORNING = 6 * 60, BEDTIME = 18 * 60, NIGHT_STEP = 30, DAY = 1440;
  const night = clock => clock >= NIGHT_FROM || clock < MORNING;
  const sleepsTillMorning = (world, sim, act, step, full) => {
    if (!step.rests || !step.fill || !step.fill.energy || !(full || act.left <= 0) || !night(world.clock)) return false;
    const wake = world.clock < MORNING ? S.Jobs.wakeAt(world, sim) : null;
    if (wake !== null && world.clock >= wake) return false;
    const began = ((world.clock - (step.mins - act.left)) % DAY + DAY) % DAY;
    if (began < BEDTIME && began >= MORNING) return false;
    act.left = Math.max(act.left, NIGHT_STEP);
    return true;
  };
  const WORKOUTS = new Set(['punchbag_hit', 'exercise', 'tv_workout']), JOG_RATE = 1.2, KEEP_ROUNDS = 6, KEEP_NEEDS = 30, SPOT_REACH = 1.5;
  const SPOT_TURNS = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * 3 / 4, -Math.PI * 3 / 4, Math.PI];
  let personAds = null;
  const PERSON_ADS = () => personAds || (personAds = Object.values(S.ADS).filter(ad => ad.person));

  const SKILL_GATES = { fish_scan: ['fishing', 1], garden_weed: ['gardening', 2], garden_feed: ['gardening', 3], garden_revive: ['gardening', 6], solve_problems: ['logic', 3] };

  const lotOf = (world, index) => world.lots[index];

  const itemOfAct = (world, act) => lotOf(world, act.lot).house.items[act.item];

  const kindName = item => S.baseOf(item);

  const adFits = (ad, name) => ad.obj === name || (ad.objs && ad.objs.includes(name));

  const freeSpot = (lot, item, pose) => S.Sim.placesOf(lot, item, pose).some((_, slot) => !(item.takers && item.takers[slot]));

  const poseOf = ad => {
    const first = ad.steps.find(step => step.pose && !step.obj);
    return first ? first.pose : ad.steps[0].pose;
  };

  const usable = (lot, item, ad) => {
    if (S.Upkeep.blocks(lot, item, ad) || !S.Food.ready(null, lot, item, ad)) return false;
    const pose = poseOf(ad);
    return !pose || freeSpot(lot, item, pose);
  };

  const nearest = (lot, sim, test) => {
    let best = null, bestD = Infinity;
    for (const item of lot.house.items) {
      if (item.outdoor && !S.objectOf(item)) continue;
      if (!test(item)) continue;
      const d = Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) + Math.abs(item.floor - sim.floor) * 6;
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    }
    return best;
  };

  const seatFor = (lot, sim, prefer) => {
    const free = (item, name) => {
      const object = S.objectOf(item);
      return object && object.rest && (!name || kindName(item) === name) && item.floor === sim.floor && freeSpot(lot, item, 'sit');
    };
    if (prefer === 'chair') {
      const chair = nearest(lot, sim, item => free(item, 'chair'));
      if (chair) return chair;
    }
    return nearest(lot, sim, item => free(item));
  };

  const fail = (world, sim, text) => {
    if (!sim.act || !sim.act.auto) {
      world.events.push({ type: 'fail', sim: sim.id, name: sim.name, text });
      sim.failText = text;
      sim.failLeft = SHRUG_MINUTES;
    }
    S.Acts.release(sim);
    sim.act = null;
    sim.useClip = null;
    S.Traits.onFail(world, sim);
  };

  const runs = sim => S.Traits.any(sim, 'runs');

  const freeAt = (world, lot, floor, x, z) => (lot ? lot.nav.isFree(floor, Math.floor(x - lot.x), Math.floor(z - lot.z)) : world.ground.isFree(floor, Math.floor(x), Math.floor(z)));

  const talkSpot = (world, other, angle, gap) => {
    for (const turn of SPOT_TURNS) {
      const a = angle + turn, x = other.x + Math.sin(a) * gap, z = other.z + Math.cos(a) * gap;
      if (freeAt(world, other.lot, other.floor, x, z)) return [x, z];
    }
    return [other.x + Math.sin(angle) * gap, other.z + Math.cos(angle) * gap];
  };

  const takeFor = (world, sim, act, step) => {
    if (step.take === 'produce' || step.take === 'juice') return S.Garden.eat(world, sim, act, step.take === 'juice');
    return S.Food.take(world, sim, act, step.take);
  };

  const keepGoing = (sim, act) => {
    if (act.auto || act.finished || !sim.needs) return false;
    act.rounds = (act.rounds || 0) + 1;
    return act.rounds < KEEP_ROUNDS && ['hunger', 'bladder', 'energy', 'hygiene'].every(n => sim.needs[n] >= KEEP_NEEDS);
  };

  const beginStep = (world, sim, act, dt) => {
    const ad = S.ADS[act.ad], step = ad.steps[act.step], lot = lotOf(world, act.lot);
    sim.useClip = step.clip;
    sim.note = '';
    act.left = step.mins * stepFactor(world, sim, step);
    if (act.step === 0 && ad.bubble) S.Traits.bubble(sim, ad.bubble);
    if (step.fish) S.Fish.begin(world, sim, act);
    if (step.here) {
      if (step.take && !takeFor(world, sim, act, step)) {
        fail(world, sim, 'Нечего взять');
        return;
      }
      S.Sim.useHere(sim);
      act.phase = 'run';
      return;
    }
    if (step.spot) {
      const spot = act.spot;
      if (!spot) {
        fail(world, sim, 'Некуда идти');
        return;
      }
      S.Sim.order(world, sim, Object.assign(S.Town.goalAt(world, spot.x, spot.z, spot.floor || 0, runs(sim)), { car: Math.hypot(spot.x - sim.x, spot.z - sim.z) > 40 ? undefined : false }));
      act.phase = 'go';
      return;
    }
    if (step.talk) {
      const other = world.sims[act.with];
      if (!other || other.inside || other.car) {
        fail(world, sim, other ? other.name + ' сейчас не здесь' : 'Некому ответить');
        return;
      }
      const dx = sim.x - other.x, dz = sim.z - other.z, len = Math.hypot(dx, dz) || 1, gap = step.near || TALK_GAP;
      if (!other.needs && other.hold < WAIT_FOR_TALK) S.Sim.hold(other, WAIT_FOR_TALK, 'idle');
      if (Math.abs(len - gap) < GAP_SLACK && other.floor === sim.floor && other.lot === sim.lot) {
        sim.yaw = Math.atan2(other.x - sim.x, other.z - sim.z);
        act.phase = 'walk';
        return;
      }
      const spot = talkSpot(world, other, Math.atan2(dx / len, dz / len), gap);
      S.Sim.order(world, sim, { x: spot[0], z: spot[1], floor: other.floor, lot: other.lot, car: false, run: runs(sim) });
      act.phase = 'walk';
      return;
    }
    if (step.seat) {
      const item = seatFor(lot, sim, step.seat);
      if (item) {
        S.Sim.order(world, sim, { item, lot, pose: 'sit', car: false, run: runs(sim) });
        act.phase = 'go';
        return;
      }
      sim.useClip = step.standClip || 'idle';
      S.Sim.useHere(sim);
      act.phase = 'run';
      act.stood = true;
      return;
    }
    const target = step.obj ? nearest(lot, sim, item => kindName(item) === step.obj && freeSpot(lot, item, step.pose) && S.Food.ready(null, lot, item, {})) : lot.house.items[act.item];
    if (!target) {
      act.waited = (act.waited || 0) + dt;
      if (act.waited > BUSY_WAIT) fail(world, sim, 'Занято: ' + S.modelName(step.obj));
      return;
    }
    if (!freeSpot(lot, target, step.pose)) {
      fail(world, sim, 'Занято: ' + S.modelName(kindName(target)));
      return;
    }
    act.at = lot.house.items.indexOf(target);
    S.Sim.order(world, sim, { item: target, lot, pose: step.pose, car: false, run: runs(sim) });
    act.phase = 'go';
  };

  const gainRate = (sim, step, need, act, world) => {
    let k = world && act ? S.Art.boost(world, act, need) : 1;
    if (need === 'social') k *= S.Traits.product(sim, 'social');
    if (need === 'energy' && step.rests) k *= S.Traits.product(sim, 'sleep');
    return k;
  };

  const applyGain = (sim, step, dt, act, world) => {
    const gain = step.food && act && act.gain ? act.gain : step.gain;
    if (gain) {
      for (const [need, value] of Object.entries(gain)) sim.needs[need] = S.clamp(sim.needs[need] + value / step.mins * dt * (value > 0 ? gainRate(sim, step, need, act, world) : need === 'energy' && WORKOUTS.has(act && act.ad) && S.Skills.has(sim, 'endurance') ? 0.5 : 1), 0, 100);
    }
    if (step.fill) {
      for (const [need, value] of Object.entries(step.fill)) sim.needs[need] = S.clamp(sim.needs[need] + value / step.mins * dt * gainRate(sim, step, need, act, world), 0, 100);
    }
  };

  const stepFactor = (world, sim, step) => S.Traits.product(sim, 'slow') * (step.upgrade ? S.Art.upgradeMins(sim) : 1) * (step.homework ? S.Jobs.homeworkMins(world, sim) : 1) * (step.repair ? S.Upkeep.repairMins(sim) : 1) * (step.chore ? S.Upkeep.cleanMins(sim) : 1);

  const endAct = sim => {
    sim.act = null;
    sim.useClip = null;
  };

  const runAct = (world, sim, dt) => {
    const act = sim.act;
    if (act.go) {
      if (act.phase === 'start') {
        const g = act.go;
        S.Sim.order(world, sim, { x: g.x, z: g.z, floor: g.floor, lot: g.lot < 0 ? null : lotOf(world, g.lot), enter: g.enter < 0 ? null : lotOf(world, g.enter), run: g.run || (act.auto && runs(sim)), car: g.car ? undefined : false, ride: g.ride || null });
        act.phase = 'walk';
        if (act.bubble) S.Traits.bubble(sim, act.bubble);
        return;
      }
      if (act.mood === 'jog' && sim.run && S.Sim.moving(sim)) {
        S.Skills.practice(world, sim, 'athletic', JOG_RATE * (S.Skills.has(sim, 'halfTown') ? 1.3 : 1), dt);
        if (act.lastX !== undefined) S.Skills.stat(world, sim, 'jogTiles', Math.hypot(sim.x - act.lastX, sim.z - act.lastZ));
        act.lastX = sim.x;
        act.lastZ = sim.z;
      }
      if (!S.Sim.busy(sim)) {
        if (sim.note) {
          fail(world, sim, sim.note);
        } else if (act.back && !act.returning) {
          act.returning = true;
          S.Sim.order(world, sim, { x: act.back[0], z: act.back[1], floor: 0, lot: sim.home, run: act.go.run, car: false });
        } else {
          S.Moods.actDone(world, sim, act);
          endAct(sim);
        }
      }
      return;
    }
    const ad = S.ADS[act.ad], step = ad.steps[act.step];
    if (act.phase === 'start') {
      if (S.Sim.busy(sim)) return;
      if (act.step === 0 && !act.started) {
        act.started = true;
        S.Traits.onStart(world, sim, act);
        if (sim.act !== act) return;
      }
      beginStep(world, sim, act, dt);
      return;
    }
    if (act.phase === 'go') {
      if (step.spot) {
        if (S.Sim.busy(sim)) return;
        if (sim.note || Math.hypot(sim.x - act.spot.x, sim.z - act.spot.z) > SPOT_REACH) {
          fail(world, sim, sim.note || 'Не дойти');
          return;
        }
        sim.yaw = Math.atan2(act.spot.fx - sim.x, act.spot.fz - sim.z);
        S.Sim.useHere(sim);
        act.phase = 'run';
        return;
      }
      if (sim.state === 'use' || sim.state === 'sit') {
        const lot = lotOf(world, act.lot), at = lot.house.items[act.at !== undefined && act.at >= 0 ? act.at : act.item];
        const cooking = step.cook ? S.Food.startCooking(world, sim, act, lot, at) : true;
        if (cooking !== true) {
          fail(world, sim, cooking);
          return;
        }
        if (step.take && !takeFor(world, sim, act, step)) {
          fail(world, sim, step.take === 'fridge' ? 'Остатков нет' : 'Порций не осталось');
          return;
        }
        if (step.cook) act.left = S.RECIPES[act.recipe].mins * S.Traits.product(sim, 'slow');
        act.phase = 'run';
        if (step.sound) world.events.push({ type: 'sound', name: step.sound, x: sim.x, z: sim.z });
        return;
      }
      if (!S.Sim.busy(sim)) fail(world, sim, sim.note || 'Не получилось');
      return;
    }
    if (act.phase === 'walk') {
      const other = world.sims[act.with];
      if (S.Sim.busy(sim)) {
        if (other && !other.needs && !other.inside && !other.car && other.hold < 1) S.Sim.hold(other, 1, 'idle');
        return;
      }
      if (sim.note || !other || Math.hypot(sim.x - other.x, sim.z - other.z) > 3) {
        fail(world, sim, sim.note || 'Разговор не вышел');
        return;
      }
      sim.yaw = Math.atan2(other.x - sim.x, other.z - sim.z);
      S.Sim.useHere(sim);
      S.Social.begin(world, sim, other, act);
      act.phase = 'run';
      return;
    }
    if (act.phase === 'leave') {
      if (S.Sim.busy(sim)) return;
      if (act.step + 1 < ad.steps.length) {
        act.step++;
        act.phase = 'start';
        return;
      }
      S.Moods.actDone(world, sim, act);
      endAct(sim);
      return;
    }
    if (step.beat) {
      const lot = lotOf(world, act.lot);
      if (!S.Food.fireAt(lot, lot.house.items[act.item])) {
        S.Acts.release(sim);
        act.phase = 'leave';
        return;
      }
    }
    act.left -= dt;
    applyGain(sim, step, dt, act, world);
    practice(world, sim, act, ad, dt);
    if (step.fish) S.Fish.tick(world, sim, act, dt);
    if (step.paint && S.Art.paintTick(world, sim, act, dt)) {
      act.left = 0;
      act.finished = true;
    }
    if (step.write && S.Art.writeTick(world, sim, act, dt)) {
      act.left = 0;
      act.finished = true;
    }
    if (step.guitar) S.Art.guitarTick(world, sim, act, step, dt);
    const full = step.fill && Object.entries(step.fill).every(([need]) => sim.needs[need] >= FULL_AT);
    if (sleepsTillMorning(world, sim, act, step, full)) return;
    if (act.left > 0 && !full) return;
    if (step.rounds && keepGoing(sim, act)) {
      act.left = step.mins;
      return;
    }
    if (step.beat) {
      const lot = lotOf(world, act.lot);
      S.Food.beat(world, sim, act);
      if (S.Food.fireAt(lot, lot.house.items[act.item])) {
        act.left = step.mins;
        return;
      }
    }
    if (step.clean) S.Food.clean(world, sim, act);
    if (step.scan) S.Fish.scan(world, sim, act);
    if (step.stock) S.Fish.stock(world, sim, act);
    if (step.tank) S.Fish.tankAct(world, sim, act, step);
    if (step.care) S.Garden.care(world, sim, act, step);
    if (step.collect) S.Collect.pick(world, sim, act);
    if (step.scrap) S.Art.scrap(world, sim, act);
    if (step.upgrade) S.Art.upgradeDone(world, sim, act);
    if (step.homework) S.Jobs.homeworkDone(world, sim);
    if (step.jobFind && act.job) S.Jobs.join(world, sim, act.job);
    if (step.homeShift) S.Jobs.homeShift(world, sim);
    if (step.repair) S.Upkeep.repairDone(world, sim, act);
    if (step.chore) S.Upkeep.choreDone(world, sim, act, step);
    if (step.pay) S.Services.payBills(world, sim);
    if (step.mail) S.Services.readMail(world, sim);
    if (step.paper) S.Services.paperRead(world, sim);
    if (step.career || step.earn || step.problem || step.study) S.Opps.careerDone(world, sim, act, step);
    if (step.end) world.events.push({ type: 'sound', name: step.end, x: sim.x, z: sim.z });
    const next = ad.steps[act.step + 1];
    if (next && next.here) {
      act.step++;
      act.phase = 'start';
      S.Acts.release(sim);
      return;
    }
    S.Acts.release(sim);
    act.phase = 'leave';
  };

  const practice = (world, sim, act, ad, dt) => {
    const src = S.Skills.SOURCES[act.ad];
    if (src && act.step === src[2]) S.Skills.practice(world, sim, src[0], src[1], dt, S.SKILL_BOOKS[act.ad] ? S.Skills.BOOK_CAP : undefined);
    if (WORKOUTS.has(act.ad) && sim.skill) {
      S.Skills.stat(world, sim, 'workoutMins', dt);
      if (act.ad === 'punchbag_hit') S.Skills.stat(world, sim, 'punchMins', dt);
    }
    if (act.ad === 'mirror_speech' && sim.skill) S.Skills.stat(world, sim, 'mirrorMins', dt);
    if ((act.ad === 'tinker' || act.ad === 'upgrade') && sim.skill) S.Skills.stat(world, sim, 'tinkerMins', dt);
    if (ad.person && !act.listen) S.Skills.social(world, sim, ad.soc, dt);
  };

  const decay = (sim, dt) => {
    const needs = sim.needs, act = sim.act, step = act && act.ad && act.phase === 'run' ? S.ADS[act.ad].steps[act.step] : null;
    for (const need of S.NEED_ORDER) {
      if (need === 'energy' && step && step.rests) continue;
      needs[need] = S.clamp(needs[need] - dt * 100 / (S.NEED_HOURS[need] * 60) * S.Traits.needRate(sim, need) * S.Wishes.needRate(sim, need), 0, 100);
    }
  };

  const crisis = (world, sim) => {
    const needs = sim.needs;
    if (needs.bladder <= 0) {
      needs.bladder = 100;
      needs.hygiene = Math.max(0, needs.hygiene - 40);
      world.events.push({ type: 'fail', sim: sim.id, name: sim.name, text: (sim.sex === 'f' ? 'не успела' : 'не успел') + ' дойти до туалета' });
      S.Moods.add(sim, 'accident', 0, world);
      S.Upkeep.accident(world, sim);
      if (sim.act && sim.act.ad === 'toilet_use') S.Acts.dropCurrent(world, sim);
    }
    if (needs.energy <= 0 && !(sim.act && sim.act.ad === 'floor_sleep') && !(sim.act && S.ADS[sim.act.ad] && S.ADS[sim.act.ad].steps.some(step => step.rests)) && !sim.car && !sim.inside) {
      S.Acts.dropCurrent(world, sim);
      sim.queue.length = 0;
      S.Sim.cancel(world, sim);
      sim.act = { ad: 'floor_sleep', lot: sim.home.index, item: -1, step: 0, phase: 'start', left: 0, auto: true };
    }
  };

  const scoreAd = (world, sim, ad, lot, item, level, extra, factor) => {
    const needs = sim.needs;
    if (ad.player || !S.adAllowed(ad, sim.age, sim)) return 0;
    if (ad.below) {
      for (const [need, limit] of Object.entries(ad.below)) {
        if (needs[need] >= limit) return 0;
      }
    }
    if (item && !usable(lot, item, ad)) return 0;
    let score = 0;
    for (const [need, value] of Object.entries(S.adGains(ad))) {
      if (value <= 0) continue;
      const k = (100 - needs[need]) / 100;
      score += k * k * k * value;
    }
    if (ad === S.ADS.bed_sleep) {
      const hour = world.clock / 60;
      score *= hour >= 21 || hour < 6 ? 2.2 : 0.8;
    }
    if (item) score /= 1 + Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) / DISTANCE_SOFTEN;
    score = score * S.Traits.adFactor(sim, ad.id) * S.Food.factor(world, lot, ad) * S.Jobs.factor(world, sim, ad) + S.Jobs.duty(world, sim, ad) + S.Upkeep.duty(world, sim, lot, item, ad);
    if (item && S.objectOf(item).kidSize && sim.age === 'adult') score *= ADULT_IN_KID_BED;
    if (extra) score = (score + extra * (0.3 + 0.7 * (100 - needs.social) / 100) * Math.min(1, S.Traits.adFactor(sim, ad.id))) * factor;
    return score >= WANT_FLOOR[level] ? score : 0;
  };

  const choices = (world, sim, level) => {
    const lot = sim.home, list = [];
    for (let index = 0; index < lot.house.items.length; index++) {
      const item = lot.house.items[index], object = S.objectOf(item);
      if (!object) continue;
      for (const id of object.ads) {
        const score = scoreAd(world, sim, S.ADS[id], lot, item, level);
        if (score > 0) list.push({ id, item: index, score });
      }
    }
    const me = world.sims.indexOf(sim);
    for (const other of world.sims) {
      if (sim.inside || other === sim || !other.live || other.inside || other.car || other.floor !== sim.floor || other.lot !== sim.lot) continue;
      const index = world.sims.indexOf(other), chatting = sim.chatWith === index && sim.chatLeft > 0, distance = Math.hypot(other.x - sim.x, other.z - sim.z);
      if (S.Acts.isAsleep(other) || (other.act && other.act.with !== undefined && other.act.with !== me)) continue;
      if (!chatting && ((other.act && !other.act.auto) || other.hold > 0 || other.line)) continue;
      if (!S.Acts.canListen(other)) continue;
      if (other.free && distance > TOWN_TALK) continue;
      const near = 1 + distance / DISTANCE_SOFTEN;
      for (const ad of PERSON_ADS()) {
        const w = S.Social.weight(world, sim, other, ad.soc);
        if (w <= 0) continue;
        const score = scoreAd(world, sim, ad, lot, null, level, SOCIAL_BASE, w / near);
        if (score > 0) list.push({ id: ad.id, with: index, score });
      }
    }
    return list.sort((a, b) => b.score - a.score).slice(0, TOP_CHOICES);
  };

  const stroll = (world, sim) => {
    const lot = sim.home;
    if (sim.lot !== lot || sim.floor > 0 || S.Traits.has(sim, 'agoraphobic')) return;
    const rng = world.rng, x = sim.x + (S.roll(rng) * 2 - 1) * STROLL_RANGE, z = sim.z + (S.roll(rng) * 2 - 1) * STROLL_RANGE;
    if (world.ground.lotAt(x, z) !== lot || !world.ground.isFree(0, Math.floor(x), Math.floor(z))) return;
    sim.act = { go: { x: Math.floor(x) + 0.5, z: Math.floor(z) + 0.5, floor: 0, lot: lot.index, enter: -1, run: false, car: false }, phase: 'start', auto: true };
  };

  const walkAct = (world, sim, kind) => {
    const def = S.Traits.PASTIME_GO[kind], home = sim.home, rng = world.rng, door = home.doorOut;
    if (sim.lot !== home || sim.floor > 0 || sim.inside) return null;
    if (S.Traits.nightNow(world) && !S.Traits.any(sim, 'nightOut')) return null;
    for (let tries = 0; tries < 6; tries++) {
      const angle = S.roll(rng) * Math.PI * 2, r = def.range[0] + S.roll(rng) * (def.range[1] - def.range[0]);
      const x = Math.floor(door[0] + Math.cos(angle) * r), z = Math.floor(door[1] + Math.sin(angle) * r);
      if (!world.ground.isFree(0, x, z)) continue;
      const at = world.ground.lotAt(x + 0.5, z + 0.5);
      if (at && at !== home && (at.closed || at.house.floors.length)) continue;
      return { go: { x: x + 0.5, z: z + 0.5, floor: 0, lot: at ? at.index : -1, enter: -1, run: def.run, car: false }, phase: 'start', auto: true, mood: def.mood, back: [door[0], door[1]], bubble: S.Traits.any(sim, 'bubble') ? S.TRAITS[S.Traits.of(sim).find(id => S.TRAITS[id].bubble)].bubble : def.bubble };
    }
    return null;
  };

  const pastimeAct = (world, sim, id) => {
    if (sim.inside || sim.car || S.Traits.adFactor(sim, id) <= 0 || !S.Traits.ready(world, sim, 'p:' + id)) return null;
    if (S.Traits.PASTIME_GO[id]) return walkAct(world, sim, id);
    const ad = S.ADS[id];
    if (!ad || !S.adAllowed(ad, sim.age, sim)) return null;
    if (ad.below) {
      for (const [need, limit] of Object.entries(ad.below)) if (!HOBBY_NEEDS.has(need) && sim.needs[need] >= limit) return null;
    }
    const lot = sim.home;
    if (!ad.obj && !ad.objs) return Object.assign(S.Acts.adAct(id, lot, null), { auto: true });
    const item = nearest(lot, sim, it => adFits(ad, kindName(it)) && usable(lot, it, ad));
    return item ? Object.assign(S.Acts.adAct(id, lot, item), { auto: true }) : null;
  };

  const pastime = (world, sim) => {
    const options = S.Traits.pastimes(sim);
    while (options.length) {
      let sum = 0;
      for (const [, weight] of options) sum += weight;
      let pick = S.roll(world.rng) * sum, index = options.length - 1;
      for (let i = 0; i < options.length; i++) {
        pick -= options[i][1];
        if (pick <= 0) {
          index = i;
          break;
        }
      }
      const act = pastimeAct(world, sim, options[index][0]);
      if (act) {
        S.Traits.rest(world, sim, 'p:' + options[index][0], PASTIME_REST);
        sim.act = act;
        return true;
      }
      options.splice(index, 1);
    }
    return false;
  };

  const think = (world, sim, level) => {
    const fire = S.Food.urge(world, sim);
    if (fire) {
      sim.act = fire;
      return;
    }
    const urge = level > 0 ? S.Traits.urge(world, sim) || S.Upkeep.urge(world, sim) : null;
    if (urge) {
      sim.act = urge;
      return;
    }
    const list = choices(world, sim, level);
    if (level > 0 && list.length && list[0].score < WEAK_WANT && S.roll(world.rng) < PASTIME_INSTEAD && pastime(world, sim)) return;
    if (!list.length) {
      if (level > 0 && S.roll(world.rng) < PASTIME_CHANCE && pastime(world, sim)) return;
      if (level > 0 && S.roll(world.rng) < STROLL_CHANCE) stroll(world, sim);
      return;
    }
    let sum = 0;
    for (const entry of list) sum += entry.score;
    let pick = S.roll(world.rng) * sum, chosen = list[0];
    for (const entry of list) {
      pick -= entry.score;
      if (pick <= 0) {
        chosen = entry;
        break;
      }
    }
    sim.act = { ad: chosen.id, lot: sim.home.index, item: chosen.item === undefined ? -1 : chosen.item, step: 0, phase: 'start', left: 0, auto: true };
    if (chosen.with !== undefined) sim.act.with = chosen.with;
  };

  const urgentNow = (world, sim) => {
    const act = sim.act;
    if (!act || !act.auto || act.ad === 'floor_sleep' || !sim.needs) return false;
    if (sim.lot && !sim.inside && S.Food.burning(sim.lot) && act.ad !== 'extinguish' && !act.flee) return true;
    const ad = act.ad ? S.ADS[act.ad] : null;
    for (const [need, limit] of Object.entries(CRITICAL)) {
      if (sim.needs[need] >= limit) continue;
      const gains = ad ? S.adGains(ad) : {};
      if (!gains[need] || gains[need] <= 0) return true;
    }
    return false;
  };

  S.modelName = id => {
    const kind = S.KINDS[S.KIND_ID['m_' + id]];
    return kind ? kind.name : id;
  };

  S.Acts = {
    QUEUE_LIMIT,

    newNeeds: () => ({ hunger: 80, social: 70, bladder: 75, hygiene: 85, energy: 90, fun: 70 }),

    isAsleep(sim) {
      const act = sim.act;
      return !!(act && act.ad && S.ADS[act.ad].steps[act.step] && S.ADS[act.ad].steps[act.step].rests);
    },

    busy: sim => !!sim.act || sim.queue.length > 0 || S.Sim.busy(sim),

    list: sim => (sim.act ? [sim.act, ...sim.queue] : sim.queue.slice()),

    label(act, sim, world) {
      if (act.go && sim && sim.car && sim.act === act) return 'Ехать';
      if (act.go) return act.go.enter >= 0 ? 'Зайти внутрь' : act.go.run ? 'Бежать' : 'Идти';
      const ad = S.ADS[act.ad], other = world && act.with !== undefined && act.with >= 0 ? world.sims[act.with] : null;
      if (ad.phone) return (S.Social.PHONE_WHY[act.phone] || ad.name) + (other ? ': ' + other.name : '');
      if (act.listen && other) return 'Слушает: ' + other.name;
      return ad.name + (ad.person && other ? ': ' + other.name : '');
    },

    icon(act, sim) {
      if (act.go) return sim && sim.car ? 'car' : 'walk';
      return S.ADS[act.ad].icon;
    },

    release(sim) {
      S.Sim.getUp(sim);
    },

    dropCurrent(world, sim) {
      if (!sim.act) return;
      S.Moods.actDropped(world, sim, sim.act);
      sim.act = null;
      sim.useClip = null;
      S.Sim.cancel(world, sim);
    },

    add(world, sim, act, first) {
      if (sim.act && sim.act.auto) S.Acts.dropCurrent(world, sim);
      if (S.Acts.list(sim).length >= QUEUE_LIMIT) return false;
      if (first) {
        if (sim.act) S.Acts.dropCurrent(world, sim);
        sim.queue.unshift(act);
      } else {
        sim.queue.push(act);
      }
      return true;
    },

    cancel(world, sim, index) {
      const list = S.Acts.list(sim), act = list[index];
      if (!act) return;
      if (act === sim.act) S.Acts.dropCurrent(world, sim);
      else sim.queue.splice(sim.queue.indexOf(act), 1);
    },

    goAct: (goal, car) => ({
      go: { x: goal.x, z: goal.z, floor: goal.floor || 0, lot: goal.lot ? goal.lot.index : -1, enter: goal.enter ? goal.enter.index : -1, run: !!goal.run, car: !!car },
      phase: 'start'
    }),

    adAct: (id, lot, item) => ({ ad: id, lot: lot.index, item: item ? lot.house.items.indexOf(item) : -1, step: 0, phase: 'start', left: 0 }),

    canListen(sim) {
      if (!sim.needs) return true;
      for (const [need, limit] of Object.entries(LISTEN_FLOOR)) if (sim.needs[need] < limit) return false;
      const act = sim.act;
      if (!act || act.listen) return true;
      if (act.ad && S.ADS[act.ad].urgent) return false;
      return act.phase === 'start' || !!act.go;
    },

    listen(world, sim, speaker, mins, react) {
      if (!sim.needs) {
        if (sim.inside || sim.car) return;
        sim.yaw = Math.atan2(speaker.x - sim.x, speaker.z - sim.z);
        S.Sim.hold(sim, mins + 0.2, react || 'idle');
        return;
      }
      if ((sim.act && !sim.act.auto) || !S.Acts.canListen(sim)) return;
      const speech = speaker.act && !speaker.act.listen ? speaker.act : speaker.line;
      if (sim.act) S.Acts.dropCurrent(world, sim);
      sim.act = { ad: speech ? speech.ad : 'sim_chat', lot: sim.home.index, item: -1, step: 0, phase: 'run', left: mins, mins, auto: true, with: world.sims.indexOf(speaker), listen: true, react: react || 'talk' };
    },

    menu(world, sim, target) {
      const out = [];
      if (target.type === 'bag') return S.Econ.menu(world, sim, target.index);
      if (target.type === 'ground') {
        const goal = S.Town.goalAt(world, target.x, target.z, target.floor || 0), far = S.Sim.wantsCar(world, sim, goal);
        out.push(...S.Upkeep.groundMenu(world, sim, sim.home, target.x, target.z, target.floor || 0));
        if (!target.floor) out.push(...S.Collect.groundMenu(world, sim, target.x, target.z), ...S.Fish.groundMenu(world, sim, target.x, target.z));
        if (goal.enter && goal.enter.kind === 'shop') out.push(...S.Econ.shopMenu(world, sim, goal));
        if (goal.enter) out.push(...S.Jobs.lotMenu(world, sim, goal), ...S.Opps.lotMenu(world, sim, goal));
        if (goal.enter) out.push({ label: 'Зайти внутрь', go: goal });
        else out.push({ label: 'Идти сюда', go: goal });
        out.push({ label: 'Бежать сюда', go: Object.assign({}, goal, { run: true }) });
        if (far) out.push({ label: 'Ехать сюда', go: goal, car: true, closed: sim.hasCar ? null : 'Машины водят взрослые' });
        return out;
      }
      if (target.type === 'sim') {
        const other = target.sim;
        if (other === sim) return S.Social.phoneMenu(world, sim).concat(S.Services.phoneMenu(world, sim), S.Opps.selfMenu(world, sim), S.Art.selfMenu(world, sim));
        if (!other.free && other !== sim) out.push({ label: 'Управлять: ' + other.name, select: other });
        const asleep = S.Acts.isAsleep(other), closed = asleep ? other.name + ' спит' : other.inside ? other.name + ' внутри' : other.car ? other.name + ' за рулём' : null;
        for (const section of S.Social.menu(world, sim, other)) {
          if (closed) {
            out.push({ label: section.label, closed });
            continue;
          }
          out.push(section);
        }
        return out;
      }
      const object = S.objectOf(target.item), lot = target.lot, item = target.item, young = S.AGE_RANK[sim.age] < S.AGE_RANK.teen ? 'Это делают подростки и взрослые' : null;
      if (!object) return out;
      if (S.Food.fireAt(lot, item)) return [{ label: 'Потушить', ad: 'extinguish', lot, item, closed: young }];
      if (item.burnt) return [{ label: 'Отчистить от копоти', ad: 'clean_soot', lot, item, closed: young }, { label: S.modelName(kindName(item)), closed: 'Сгорело. Сначала отчистить от копоти' }];
      const model = kindName(item), broken = S.Upkeep.brokenMenu(world, sim, lot, item);
      if (broken) return broken;
      if (model === 'mailbox') out.push(...S.Services.mailboxMenu(world, sim, lot, item));
      if (model === 'garden') out.push(...S.Garden.bedMenu(world, sim, lot, item));
      if (model === 'easel') out.push(...S.Art.easelMenu(world, sim, lot, item));
      if (model === 'computer') out.push(...S.Art.computerMenu(world, sim, lot, item), ...S.Jobs.computerMenu(world, sim, lot, item));
      for (const id of object.ads) {
        const ad = S.ADS[id];
        if (!S.adAllowed(ad, sim.age, sim) || id === 'write_novel' || id === 'pond_stock' || id === 'job_find' || id === 'job_home' || id === 'pay_bills' || id === 'paper_read') continue;
        if (id === 'cook_meal') {
          out.push(S.Food.menu(world, sim, lot, item));
          continue;
        }
        if (ad.when && !S.Food.ready(world, lot, item, ad)) continue;
        const capped = ad.book && S.Skills.level(sim, S.SKILL_BOOKS[id].skill) >= S.Skills.BOOK_CAP;
        out.push({ label: ad.name, ad: id, lot, item, closed: capped ? 'Уже знакомо. Книги посложнее будут в книжной на этапе 19' : S.Acts.skillClosed(sim, id) || (usable(lot, item, ad) ? null : 'Сейчас занято') });
        if (id === 'fish_pond') out.push(S.Fish.baitOptions(sim, { ad: 'fish_pond', lot, item }));
      }
      out.push(...S.Art.upgradeMenu(world, sim, lot, item));
      return out;
    },

    skillClosed(sim, id) {
      const need = SKILL_GATES[id];
      return need && S.Skills.level(sim, need[0]) < need[1] ? 'Нужен ' + S.SKILLS[need[0]].name.toLowerCase() + ' ' + need[1] : null;
    },

    forNeed(world, sim, need) {
      const lot = sim.home;
      let best = null, bestScore = 0;
      for (const item of lot.house.items) {
        const object = S.objectOf(item);
        if (!object) continue;
        for (const id of object.ads) {
          const ad = S.ADS[id], gain = S.adGains(ad)[need];
          if (!gain || gain <= 0 || !S.adAllowed(ad, sim.age, sim) || ad.player || ad.traits || !usable(lot, item, ad)) continue;
          const score = gain / (1 + Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) / DISTANCE_SOFTEN);
          if (score > bestScore) {
            bestScore = score;
            best = [id, item];
          }
        }
      }
      if (!best) return false;
      return S.Acts.add(world, sim, S.Acts.adAct(best[0], lot, best[1]));
    },

    stepSim(world, sim, dt, freeWill) {
      if (!sim.needs) return;
      if (!sim.inside) decay(sim, dt);
      else decay(sim, dt * 0.5);
      crisis(world, sim);
      S.Moods.step(world, sim, dt);
      S.Traits.step(world, sim, dt);
      S.Wishes.step(world, sim, dt);
      if (sim.failLeft > 0) {
        sim.failLeft -= dt;
        if (sim.failLeft <= 0) sim.failText = '';
      }
      if (sim.act) {
        if (sim.act.listen) {
          const partner = world.sims[sim.act.with];
          sim.act.left -= dt;
          S.Social.listenGain(sim, sim.act, dt);
          if (sim.act.left <= 0 || !partner || !S.Social.talking(world, partner, sim)) {
            S.Moods.listened(world, sim, sim.act);
            sim.act = null;
            sim.useClip = null;
            S.Sim.getUp(sim);
          } else if ((sim.state === 'idle' || (sim.state === 'use' && sim.useClip !== sim.act.react)) && !S.Sim.busy(sim)) {
            sim.yaw = Math.atan2(partner.x - sim.x, partner.z - sim.z);
            sim.useClip = sim.act.react || 'talk';
            S.Sim.useHere(sim);
          }
        } else {
          runAct(world, sim, dt);
        }
      }
      if (!sim.act && !S.Sim.busy(sim)) {
        if (sim.queue.length) {
          sim.act = sim.queue.shift();
          return;
        }
      }
      if (S.Jobs.busyInside(world, sim) || S.Opps.busyInside(world, sim)) return;
      sim.thinkLeft -= dt;
      if (sim.thinkLeft > 0) return;
      sim.thinkLeft = THINK_EVERY;
      if (sim.act && urgentNow(world, sim)) S.Acts.dropCurrent(world, sim);
      if (!sim.act && !S.Sim.busy(sim) && !sim.queue.length) think(world, sim, freeWill);
    },

    stepAll(world, dt, freeWill) {
      for (const sim of world.family) S.Acts.stepSim(world, sim, dt, freeWill);
    },

    choices,
    scoreAd,
    itemOfAct
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
