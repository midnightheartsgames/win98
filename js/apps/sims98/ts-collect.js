(function (S) {
  'use strict';
  const DAY = 1440, WEEK = 7 * DAY, SPOT_STEP = 12, SPOT_LIMIT = 300, PICK_RANGE = 1.6, SET_BONUS = 1.25, SHARP_EYE = 0.25;
  const DAY_FROM = 360, DAY_TO = 1200, METEOR_CHANCE = 0.08;
  const SETS = {
    gems: { name: 'Камни', kind: 'gem', respawn: WEEK, verb: 'Подобрать' },
    metals: { name: 'Металлы', kind: 'metal', respawn: WEEK, verb: 'Подобрать' },
    space: { name: 'Космические камни', kind: 'space', respawn: WEEK, verb: 'Подобрать' },
    butterflies: { name: 'Бабочки', kind: 'butterfly', respawn: DAY, verb: 'Поймать' },
    bugs: { name: 'Жуки', kind: 'bug', respawn: DAY, verb: 'Поймать' },
    seeds: { name: 'Семена', kind: 'seed', respawn: DAY, verb: 'Подобрать' }
  };
  const PLACES = { rock: ['gems', 'metals'], forest: ['metals', 'bugs', 'butterflies'], meadow: ['butterflies', 'bugs', 'seeds'], park: ['butterflies', 'seeds', 'bugs'], hill: ['space', 'gems'] };

  const ROWS = [
    ['amethyst', 'gems', 'Аметист', 40, 3], ['turquoise', 'gems', 'Бирюза', 30, 3], ['emerald', 'gems', 'Изумруд', 120, 1], ['ruby', 'gems', 'Рубин', 140, 1],
    ['sapphire', 'gems', 'Сапфир', 130, 1], ['topaz', 'gems', 'Топаз', 50, 2], ['opal', 'gems', 'Опал', 70, 2], ['garnet', 'gems', 'Гранат', 35, 3],
    ['citrine', 'gems', 'Цитрин', 45, 2], ['diamond', 'gems', 'Алмаз', 300, 0.5], ['rosequartz', 'gems', 'Розовый кварц', 25, 4], ['moonstone', 'gems', 'Лунный камень', 90, 1],
    ['iron', 'metals', 'Железо', 10, 4], ['copper', 'metals', 'Медь', 15, 4], ['tin', 'metals', 'Олово', 18, 3], ['silver', 'metals', 'Серебро', 60, 2],
    ['gold', 'metals', 'Золото', 120, 1], ['platinum', 'metals', 'Платина', 160, 0.7], ['palladium', 'metals', 'Палладий', 140, 0.7], ['iridium', 'metals', 'Иридий', 200, 0.4],
    ['meteorSmall', 'space', 'Малый метеорит', 50, 3], ['meteorMedium', 'space', 'Средний метеорит', 150, 1.5], ['meteorLarge', 'space', 'Большой метеорит', 400, 0.5],
    ['cabbagewhite', 'butterflies', 'Капустница', 4, 4], ['brimstone', 'butterflies', 'Лимонница', 5, 4], ['tortoiseshell', 'butterflies', 'Крапивница', 6, 3], ['peacock', 'butterflies', 'Павлиний глаз', 12, 2],
    ['swallowtail', 'butterflies', 'Махаон', 25, 1.5], ['admiral', 'butterflies', 'Адмирал', 18, 2], ['blue', 'butterflies', 'Голубянка', 8, 3], ['mourning', 'butterflies', 'Траурница', 22, 1.5],
    ['sailor', 'butterflies', 'Парусник', 35, 1], ['fritillary', 'butterflies', 'Перламутровка', 15, 2], ['apollo', 'butterflies', 'Аполлон', 45, 0.7], ['morpho', 'butterflies', 'Морфо', 80, 0.4],
    ['ladybird', 'bugs', 'Божья коровка', 3, 4], ['maybug', 'bugs', 'Майский жук', 5, 4], ['stag', 'bugs', 'Жук-олень', 40, 1], ['rosechafer', 'bugs', 'Бронзовка', 12, 2],
    ['firefly', 'bugs', 'Светлячок', 15, 2, 'night'], ['cricket', 'bugs', 'Сверчок', 6, 3, 'night'], ['grasshopper', 'bugs', 'Кузнечик', 4, 4], ['groundbeetle', 'bugs', 'Жужелица', 8, 3],
    ['dungbeetle', 'bugs', 'Навозник', 6, 3], ['rhino', 'bugs', 'Жук-носорог', 30, 1, 'night'], ['scarab', 'bugs', 'Скарабей', 50, 0.7], ['hercules', 'bugs', 'Жук-геркулес', 90, 0.3, 'night']
  ];

  S.FINDS = {};
  ROWS.forEach(([id, set, name, value, weight, time], order) => { S.FINDS[id] = { id, set, kind: SETS[set].kind, name, value, weight, time: time || (set === 'butterflies' ? 'day' : 'any'), order }; });

  S.ADS.collect_pick = { id: 'collect_pick', name: 'Подобрать', icon: 'chance', age: 'child', player: true, steps: [{ spot: true, clip: 'pick', mins: 3, collect: true }] };

  const now = world => world.day * DAY + world.clock;
  const daytime = world => world.clock >= DAY_FROM && world.clock < DAY_TO;
  const hash = (x, z, salt) => {
    let h = Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(salt, 83492791);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const placeAt = (world, x, z) => {
    const t = world.terrain, paint = S.Terrain.paintAt(t, x, z), lot = world.ground.lotAt(x, z);
    if (lot && lot.kind !== 'park') return null;
    if (lot && lot.kind === 'park') return 'park';
    if (paint === S.PAINT.rock) return 'rock';
    if (paint === S.PAINT.forest) return 'forest';
    if (paint === S.PAINT.meadow) return 'meadow';
    if (paint === S.PAINT.grass && S.Terrain.heightAt(t, x, z) > 14) return 'hill';
    if (paint === S.PAINT.grass) return 'meadow';
    return null;
  };

  const visible = (world, find) => !find || find.time === 'any' || (find.time === 'day' ? daytime(world) : !daytime(world));

  S.Collect = {
    SETS, PLACES, SET_BONUS, PICK_RANGE,

    spots(world) {
      if (world.spots) return world.spots;
      const all = [], size = S.METRICS.town;
      for (let z = SPOT_STEP / 2; z < size; z += SPOT_STEP) {
        for (let x = SPOT_STEP / 2; x < size; x += SPOT_STEP) {
          const jx = Math.floor(x + (hash(x, z, 1) - 0.5) * SPOT_STEP * 0.8), jz = Math.floor(z + (hash(x, z, 2) - 0.5) * SPOT_STEP * 0.8);
          if (!world.ground.isFree(0, jx, jz)) continue;
          const place = placeAt(world, jx + 0.5, jz + 0.5);
          if (place) all.push({ x: jx + 0.5, z: jz + 0.5, place, find: '', next: 0 });
        }
      }
      const stride = Math.max(1, all.length / SPOT_LIMIT);
      world.spots = [];
      for (let i = 0; i < all.length && world.spots.length < SPOT_LIMIT; i += stride) world.spots.push(all[Math.floor(i)]);
      return world.spots;
    },

    roll(world, spot) {
      const salt = world.day * 24 + Math.floor(world.clock / 60), rng = { rs: Math.floor(hash(Math.floor(spot.x * 7), Math.floor(spot.z * 7), salt) * 4294967296) >>> 0 };
      const sets = PLACES[spot.place].filter(set => set !== 'space' || !daytime(world));
      const options = Object.values(S.FINDS).filter(f => f.set !== 'seeds' && sets.includes(f.set) && (f.set !== 'space' || S.roll(rng) < METEOR_CHANCE));
      if (sets.includes('seeds')) for (const plant of Object.values(S.PLANTS)) if (plant.rarity !== 'special' || S.roll(rng) < 0.05) options.push({ id: plant.id, set: 'seeds', kind: 'seed', weight: plant.rarity === 'common' ? 2 : 0.5 });
      if (!options.length) return '';
      let sum = 0;
      for (const f of options) sum += f.weight;
      let pick = S.roll(rng) * sum;
      for (const f of options) {
        pick -= f.weight;
        if (pick <= 0) return f.id;
      }
      return options[options.length - 1].id;
    },

    step(world) {
      const hour = world.day * 24 + Math.floor(world.clock / 60);
      if (world.spotHour === hour) return;
      world.spotHour = hour;
      const t = now(world);
      for (const spot of S.Collect.spots(world)) {
        if (spot.find || t < spot.next) continue;
        spot.find = S.Collect.roll(world, spot);
        spot.next = t + DAY;
      }
    },

    findOf(spot) {
      if (!spot.find) return null;
      return S.FINDS[spot.find] || (S.PLANTS[spot.find] ? { id: spot.find, set: 'seeds', kind: 'seed', name: 'Семена: ' + S.PLANTS[spot.find].name.toLowerCase(), value: Math.round(S.PLANTS[spot.find].value / 2), time: 'any' } : null);
    },

    shown(world) {
      return S.Collect.spots(world).filter(spot => spot.find && visible(world, S.Collect.findOf(spot)));
    },

    near(world, x, z) {
      let best = null, bestD = PICK_RANGE;
      for (const spot of S.Collect.shown(world)) {
        const d = Math.hypot(spot.x - x, spot.z - z);
        if (d < bestD) {
          bestD = d;
          best = spot;
        }
      }
      return best;
    },

    groundMenu(world, sim, x, z) {
      const spot = S.Collect.near(world, x, z);
      if (!spot) return [];
      const find = S.Collect.findOf(spot), set = SETS[find.set];
      return [{ label: set.verb + ': ' + find.name.toLowerCase(), ad: 'collect_pick', spot: { x: spot.x, z: spot.z, fx: spot.x, fz: spot.z + 1, find: world.spots.indexOf(spot) }, closed: S.AGE_RANK[sim.age] < S.AGE_RANK.child ? 'Собирают с детского возраста' : null }];
    },

    pick(world, sim, act) {
      const spot = world.spots && world.spots[act.spot && act.spot.find];
      const find = spot && S.Collect.findOf(spot);
      if (!find || !sim.bag) {
        world.events.push({ type: 'collect', sim: sim.id, text: sim.name + ': тут уже ничего нет' });
        return;
      }
      const it = find.set === 'seeds' ? S.Econ.item('seed', find.id, { q: 1, v: find.value, at: now(world) }) : S.Econ.item(find.kind, find.id, { v: find.value, at: now(world) });
      if (!S.Econ.give(world, sim, it)) return;
      spot.find = '';
      spot.next = now(world) + SETS[find.set].respawn;
      const found = sim.skill.stats.found || (sim.skill.stats.found = {}), fresh = !found[find.id];
      found[find.id] = (found[find.id] || 0) + 1;
      if (sim.rewards && sim.rewards.includes('sharpEye') && S.roll(world.rng) < SHARP_EYE) S.Econ.give(world, sim, Object.assign({}, it));
      const done = S.Collect.complete(sim, find.set);
      world.events.push({ type: 'collect', sim: sim.id, text: 'Находка: ' + find.name.toLowerCase() + (fresh ? ', новое в коллекции' : '') + (fresh && done ? '. Набор «' + SETS[find.set].name + '» собран полностью' : '') });
      if (sim.wish) {
        S.Wishes.bump(sim, 'found');
        if (fresh && done) S.Wishes.bump(sim, 'setDone');
      }
      if (fresh && sim.skill) S.Skills.setStat(world, sim, 'kindsFound', Object.keys(found).length);
    },

    members(set) {
      return set === 'seeds' ? Object.keys(S.PLANTS) : Object.values(S.FINDS).filter(f => f.set === set).map(f => f.id);
    },

    progress(sim, set) {
      const found = (sim.skill && sim.skill.stats.found) || {}, list = S.Collect.members(set);
      return [list.filter(id => found[id]).length, list.length];
    },

    complete(sim, set) {
      const [have, need] = S.Collect.progress(sim, set);
      return have >= need;
    },

    bonus(sim, set) {
      return sim && sim.skill && S.Collect.complete(sim, set) ? SET_BONUS : 1;
    },

    pack(world) {
      if (!world.spots) return null;
      return world.spots.map(s => [s.find, s.next]);
    },

    unpack(world, list) {
      if (list === null || list === undefined) return null;
      const spots = S.Collect.spots(world);
      if (!Array.isArray(list) || list.length !== spots.length) throw new Error('повреждены находки');
      return list.map(r => {
        if (!Array.isArray(r) || r.length !== 2 || typeof r[0] !== 'string' || !Number.isFinite(r[1]) || (r[0] && !S.FINDS[r[0]] && !S.PLANTS[r[0]])) throw new Error('неизвестная находка в файле');
        return r;
      });
    },

    apply(world, rows) {
      world.spotHour = -1;
      if (!rows) {
        delete world.spots;
        return;
      }
      S.Collect.spots(world).forEach((spot, i) => {
        spot.find = rows[i][0];
        spot.next = rows[i][1];
      });
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
