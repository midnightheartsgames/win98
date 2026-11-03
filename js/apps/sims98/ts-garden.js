(function (S) {
  'use strict';
  const DAY = 1440, DRY = 25, WATER_PER_DAY = 34, WEED_PER_DAY = 0.35, SICK_PER_DAY = 30, HEAL_PER_DAY = 15, REGROW = 0.5;
  const WEED_LEVEL = 2, FEED_LEVEL = 3, REVIVE_LEVEL = 6, MUDDY_CHANCE = 0.3, SEED_CHANCE = 0.25, GREEN_THUMB = 1.25, GREEN_HANDS = 1.5, FARM_PERK = 1.2;
  const COLORS = ['red', 'green', 'yellow', 'orange', 'purple', 'brown'];
  const JUICY = new Set(['apple', 'grapes', 'watermelon', 'lime', 'mango', 'lemon', 'strawberry', 'plum']);
  const RARITY = { common: 'Обычное', rare: 'Редкое', special: 'Особое' };

  const ROWS = [
    ['lettuce', 'Салат', 'Кочан салата', 'common', 0, 'green', 6, 2, 2],
    ['apple', 'Яблоня', 'Яблоко', 'common', 0, 'red', 8, 3, 4],
    ['grapes', 'Виноград', 'Гроздь винограда', 'common', 0, 'purple', 8, 3, 3],
    ['tomato', 'Томат', 'Помидор', 'common', 0, 'red', 7, 2, 3],
    ['onion', 'Лук', 'Луковица', 'common', 0, 'brown', 5, 2, 2],
    ['potato', 'Картофель', 'Картофелина', 'common', 0, 'brown', 5, 2, 3],
    ['carrot', 'Морковь', 'Морковка', 'common', 0, 'orange', 6, 2, 2],
    ['watermelon', 'Арбуз', 'Арбуз', 'common', 0, 'green', 14, 4, 1],
    ['lime', 'Лайм', 'Лайм', 'rare', 5, 'green', 24, 4, 3],
    ['lemon', 'Лимон', 'Лимон', 'rare', 5, 'yellow', 22, 4, 3],
    ['strawberry', 'Клубника', 'Клубника', 'rare', 5, 'red', 20, 3, 4],
    ['mango', 'Манго', 'Манго', 'rare', 7, 'orange', 28, 4, 2],
    ['plum', 'Слива', 'Слива', 'rare', 7, 'purple', 26, 4, 3],
    ['firepepper', 'Огненный перец', 'Огненный перец', 'special', 8, 'red', 60, 5, 2],
    ['cheese', 'Сырный куст', 'Головка сыра', 'special', 8, 'yellow', 40, 5, 2],
    ['meat', 'Мясной куст', 'Кусок мяса', 'special', 8, 'red', 45, 5, 2],
    ['omni', 'Всеядный куст', 'Всеядный плод', 'special', 9, 'green', 80, 6, 1],
    ['lifefruit', 'Плод долголетия', 'Плод долголетия', 'special', 10, 'yellow', 150, 7, 1],
    ['deathflower', 'Цветок отсрочки', 'Цветок отсрочки', 'special', 10, 'purple', 200, 7, 1]
  ];

  S.PLANTS = {};
  ROWS.forEach(([id, name, produce, rarity, level, color, value, days, crop], order) => {
    S.PLANTS[id] = { id, name, produce, rarity, level, color, value, days, crop, order, juicy: JUICY.has(id) };
  });

  const CARE = { pose: 'near', clip: 'dig', gain: { fun: 6, hygiene: -6 }, garden: true };
  S.ADS.garden_plant = { id: 'garden_plant', obj: 'garden', name: 'Посадить', icon: 'tree', age: 'teen', player: true, steps: [Object.assign({}, CARE, { mins: 15, care: 'plant' })] };
  S.ADS.garden_water = { id: 'garden_water', obj: 'garden', name: 'Полить', icon: 'tree', mood: 'gardening', age: 'teen', below: { fun: 85 }, when: 'thirsty', steps: [Object.assign({}, CARE, { clip: 'wash', mins: 8, care: 'water' })] };
  S.ADS.garden_weed = { id: 'garden_weed', obj: 'garden', name: 'Прополоть', icon: 'tree', age: 'teen', below: { fun: 85 }, when: 'weedy', steps: [Object.assign({}, CARE, { mins: 12, care: 'weed' })] };
  S.ADS.garden_feed = { id: 'garden_feed', obj: 'garden', name: 'Подкормить', icon: 'tree', age: 'teen', player: true, when: 'growing', steps: [Object.assign({}, CARE, { mins: 8, care: 'feed' })] };
  S.ADS.garden_harvest = { id: 'garden_harvest', obj: 'garden', name: 'Собрать урожай', icon: 'tree', mood: 'harvest', age: 'teen', below: { fun: 95 }, when: 'ripe', steps: [Object.assign({}, CARE, { clip: 'pick', mins: 10, care: 'harvest' })] };
  S.ADS.garden_revive = { id: 'garden_revive', obj: 'garden', name: 'Оживить', icon: 'tree', age: 'teen', player: true, when: 'dead', steps: [Object.assign({}, CARE, { mins: 30, care: 'revive' })] };
  S.ADS.garden_dig = { id: 'garden_dig', obj: 'garden', name: 'Выкопать', icon: 'tree', age: 'teen', player: true, when: 'planted', steps: [Object.assign({}, CARE, { mins: 10, care: 'dig' })] };
  S.OBJECTS.garden = { price: 60, env: 1, section: 'Сад', icon: 'tree', outdoor: true, ads: ['garden_water', 'garden_weed', 'garden_feed', 'garden_harvest', 'garden_revive', 'garden_dig'] };

  const now = world => world.day * DAY + world.clock;
  const indexOf = (lot, item) => lot.house.items.indexOf(item);
  const stateOf = lot => lot.garden || (lot.garden = {});
  const plantAt = (lot, item) => (lot.garden ? lot.garden[indexOf(lot, item)] || null : null);
  const pickKey = it => [it.k, it.id, it.q, it.at];
  const findPick = (sim, key) => S.Econ.index(sim, it => key && it.k === key[0] && it.id === key[1] && it.q === key[2] && it.at === key[3]);

  S.WHEN = S.WHEN || {};
  S.WHEN.thirsty = (world, lot, item) => {
    const p = plantAt(lot, item);
    return !!(p && !p.dead && p.water < 70);
  };
  S.WHEN.weedy = (world, lot, item) => {
    const p = plantAt(lot, item);
    return !!(p && !p.dead && p.weeds);
  };
  S.WHEN.growing = (world, lot, item) => {
    const p = plantAt(lot, item);
    return !!(p && !p.dead);
  };
  S.WHEN.ripe = (world, lot, item) => {
    const p = plantAt(lot, item);
    return !!(p && !p.dead && p.fruit);
  };
  S.WHEN.dead = (world, lot, item) => {
    const p = plantAt(lot, item);
    return !!(p && p.dead);
  };
  S.WHEN.planted = (world, lot, item) => !!plantAt(lot, item);

  S.Garden = {
    DAY, COLORS, RARITY, WEED_LEVEL, FEED_LEVEL, REVIVE_LEVEL,

    plantAt,

    kindFor(p) {
      if (!p) return 'm_garden';
      if (p.dead) return 'm_garden_dead';
      if (p.fruit) return 'm_garden_ripe_' + S.PLANTS[p.id].color;
      return p.grow < 0.35 ? 'm_garden_sprout' : 'm_garden_young';
    },

    dress(world, lot, item) {
      const kind = S.Garden.kindFor(plantAt(lot, item));
      if (item.kind === kind || S.KIND_ID[kind] === undefined) return;
      item.kind = kind;
      if (world.reskin) world.reskin.add(item);
    },

    level: sim => S.Skills.level(sim, 'gardening'),

    seedsOf(sim) {
      const seen = new Map();
      (sim.bag || []).forEach((it, index) => {
        if (it.k !== 'seed' && it.k !== 'produce') return;
        const key = it.k + it.id + it.q;
        if (!seen.has(key)) seen.set(key, index);
      });
      return [...seen.values()].map(index => sim.bag[index]);
    },

    why(sim, plant) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.teen) return 'Сажают с подросткового возраста';
      if (S.Garden.level(sim) < plant.level) return 'Нужен сад ' + plant.level;
      return null;
    },

    bedMenu(world, sim, lot, item) {
      const p = plantAt(lot, item);
      if (p) return [];
      const seeds = S.Garden.seedsOf(sim);
      if (!seeds.length) return [{ label: 'Посадить…', closed: 'Нужны семена или плод в инвентаре' }];
      return [{ label: 'Посадить…', section: seeds.map(it => ({ label: S.Econ.name(it).replace(/^Семена: /, '') + ' (' + S.Econ.QUALITY[it.q].toLowerCase() + ')', ad: 'garden_plant', lot, item, pick: pickKey(it), closed: S.Garden.why(sim, S.PLANTS[it.id]) })) }];
    },

    status(world, lot, item) {
      const p = plantAt(lot, item);
      if (!p) return 'Пустая грядка';
      const plant = S.PLANTS[p.id], parts = [plant.name];
      if (p.dead) return plant.name + ': засохло';
      parts.push(p.fruit ? 'урожай готов' : 'растёт ' + Math.floor(p.grow * 100) + ' %');
      if (p.water < DRY) parts.push('сохнет');
      if (p.weeds) parts.push('сорняки');
      return parts.join(', ');
    },

    itemMenu(world, sim, it, index) {
      const out = [], plant = S.PLANTS[it.id];
      if (it.k === 'produce') {
        out.push({ label: 'Съесть', bag: index, use: 'eat', closed: S.AGE_RANK[sim.age] < S.AGE_RANK.toddler ? 'Пока рано' : null });
        if (plant.juicy) out.push({ label: 'Выжать сок', bag: index, use: 'juice' });
      }
      const bed = sim.home.house.items.find(item => S.baseOf(item) === 'garden' && !plantAt(sim.home, item));
      out.push({ label: 'Посадить', bag: index, use: 'plant', closed: sim.lot !== sim.home ? 'Сажают дома' : !sim.home.house.items.some(item => S.baseOf(item) === 'garden') ? 'Дома нет грядок' : !bed ? 'Все грядки заняты' : S.Garden.why(sim, plant) });
      return out;
    },

    use(world, sim, index, use) {
      const it = sim.bag[index];
      if (use === 'plant') {
        const bed = sim.home.house.items.find(item => S.baseOf(item) === 'garden' && !plantAt(sim.home, item));
        return bed ? Object.assign(S.Acts.adAct('garden_plant', sim.home, bed), { pick: pickKey(it) }) : null;
      }
      if (use === 'eat' || use === 'juice') return Object.assign(S.Acts.adAct(use === 'eat' ? 'produce_eat' : 'produce_juice', sim.home, null), { pick: pickKey(it) });
      return null;
    },

    eat(world, sim, act, juice) {
      const at = findPick(sim, act.pick);
      if (at < 0) return false;
      const it = S.Econ.take(sim, at);
      act.gain = juice ? { hunger: 8, fun: 6 } : { hunger: 12 + it.q * 3, fun: 3 };
      act.food = { produce: it.id, q: it.q };
      return true;
    },

    eaten(world, sim, act) {
      if (!act.food || !act.food.produce || !sim.moods) return;
      S.Moods.add(sim, act.ad === 'produce_juice' ? 'freshJuice' : 'ownHarvest', 0, world);
    },

    care(world, sim, act, step) {
      const lot = world.lots[act.lot], item = lot.house.items[act.item], p = plantAt(lot, item), level = S.Garden.level(sim);
      if (step.care === 'plant') {
        const at = findPick(sim, act.pick);
        if (p || at < 0) return;
        const it = S.Econ.take(sim, at);
        stateOf(lot)[act.item] = { id: it.id, q: it.q, grow: 0, water: 80, weeds: false, fed: 0, health: 100, fruit: false, harvests: 0, dead: false, planted: now(world), by: sim.id };
        const planted = sim.skill.stats.planted || (sim.skill.stats.planted = []);
        if (!planted.includes(it.id)) planted.push(it.id);
        S.Skills.setStat(world, sim, 'plantedKinds', planted.length);
      } else if (p && step.care === 'water') {
        p.water = 100;
      } else if (p && step.care === 'weed') {
        if (level >= WEED_LEVEL) p.weeds = false;
        else world.events.push({ type: 'garden', sim: sim.id, text: sim.name + ': сорняки так просто не сдаются. Нужен сад ' + WEED_LEVEL });
      } else if (p && step.care === 'feed') {
        const at = S.Econ.index(sim, it => it.k === 'fish' || it.k === 'produce');
        if (level < FEED_LEVEL) world.events.push({ type: 'garden', sim: sim.id, text: sim.name + ': подкормка пока не даётся. Нужен сад ' + FEED_LEVEL });
        else if (at < 0) world.events.push({ type: 'garden', sim: sim.id, text: 'Для подкормки нужна рыба или урожай в инвентаре' });
        else {
          S.Econ.take(sim, at);
          p.fed = Math.min(2, p.fed + 1);
          p.health = 100;
        }
      } else if (p && step.care === 'harvest' && p.fruit) {
        S.Garden.harvest(world, sim, lot, item, p);
      } else if (p && step.care === 'revive' && p.dead) {
        if (level < REVIVE_LEVEL) world.events.push({ type: 'garden', sim: sim.id, text: sim.name + ': засохшее уже не спасти. Нужен сад ' + REVIVE_LEVEL });
        else Object.assign(p, { dead: false, health: 60, water: 80, grow: 0.4, fruit: false });
      } else if (p && step.care === 'dig') {
        delete stateOf(lot)[act.item];
      }
      if (sim.moods && S.roll(world.rng) < MUDDY_CHANCE && step.care !== 'water') S.Moods.add(sim, 'muddy', 0, world);
      S.Garden.dress(world, lot, item);
    },

    quality(world, sim, p) {
      const level = S.Garden.level(sim);
      let q = p.q * 0.35 + level * 0.25 + p.fed * 0.6 + (p.health - 60) / 40 + S.roll(world.rng) * 1.2 - 0.6;
      if (S.Traits.has(sim, 'greenThumb')) q += 0.5;
      if (S.Skills.has(sim, 'perfectHarvest')) q += 0.5;
      return Math.max(0, Math.min(S.Econ.PERFECT, Math.round(q)));
    },

    harvest(world, sim, lot, item, p) {
      const plant = S.PLANTS[p.id], level = S.Garden.level(sim), count = plant.crop + Math.floor(level / 4) + (S.Traits.has(sim, 'greenThumb') ? 1 : 0);
      let kept = 0, perfect = 0, q = 0;
      for (let i = 0; i < count; i++) {
        q = S.Garden.quality(world, sim, p);
        const value = Math.round(plant.value * S.Econ.QMULT[q] * (S.Skills.has(sim, 'farm') ? FARM_PERK : 1));
        if (S.Econ.give(world, sim, S.Econ.item('produce', plant.id, { q, v: value, at: now(world) }))) kept++;
        if (q === S.Econ.PERFECT) perfect++;
      }
      if (S.roll(world.rng) < SEED_CHANCE * (S.Skills.has(sim, 'plantedAll') ? 2 : 1)) S.Econ.give(world, sim, S.Econ.item('seed', plant.id, { q: Math.min(S.Econ.PERFECT, p.q + 1), v: Math.round(plant.value / 2), at: now(world) }));
      p.fruit = false;
      p.grow = REGROW;
      p.fed = Math.max(0, p.fed - 1);
      p.harvests++;
      S.Skills.stat(world, sim, 'harvests', 1);
      if (perfect) S.Skills.stat(world, sim, 'perfectCrop', perfect);
      const best = sim.skill.stats.perfectKinds || (sim.skill.stats.perfectKinds = []);
      if (perfect && !best.includes(plant.id)) best.push(plant.id);
      if (sim.wish) {
        S.Wishes.bump(sim, 'harvest');
        if (perfect && plant.id === 'tomato') S.Wishes.bump(sim, 'perfectTomato');
        if (plant.id === 'tomato' && q >= 3 && level >= 5) S.Wishes.bump(sim, 'bigTomato');
      }
      world.events.push({ type: 'garden', sim: sim.id, text: 'Урожай: ' + plant.produce.toLowerCase() + ' × ' + kept + (perfect ? ', безупречных ' + perfect : '') });
      if (S.Wishes) S.Wishes.checkDream(world, sim);
    },

    step(world, dt) {
      for (const lot of world.lots) {
        const garden = lot.garden;
        if (!garden) continue;
        const family = world.family.filter(s => s.home === lot), thumb = family.some(s => S.Traits.has(s, 'greenThumb')), hands = family.some(s => s.rewards && s.rewards.includes('greenHands'));
        for (const [index, p] of Object.entries(garden)) {
          if (p.dead) continue;
          const item = lot.house.items[index], days = dt / DAY, before = S.Garden.kindFor(p);
          p.water = Math.max(0, p.water - WATER_PER_DAY * days);
          if (!p.weeds && !hands && S.roll(world.rng) < WEED_PER_DAY * days) p.weeds = true;
          const bad = p.water < DRY || p.weeds;
          p.health = Math.max(0, Math.min(100, p.health + (bad && !hands ? -SICK_PER_DAY : HEAL_PER_DAY) * days));
          if (p.health <= 0) p.dead = true;
          if (!p.fruit && !p.dead) {
            const speed = (p.water < DRY ? 0.3 : 1) * (thumb ? GREEN_THUMB : 1) * (hands ? GREEN_HANDS : 1);
            p.grow = Math.min(1, p.grow + days / S.PLANTS[p.id].days * speed);
            if (p.grow >= 1) p.fruit = true;
          }
          if (S.Garden.kindFor(p) !== before) S.Garden.dress(world, lot, item);
        }
      }
    },

    heldMoods(world, sim) {
      const lot = sim.lot;
      if (!lot || lot !== sim.home || sim.inside || sim.floor > 0 || !lot.garden) return [];
      let near = 0;
      for (const [index, p] of Object.entries(lot.garden)) {
        if (p.dead || p.grow < 0.35) continue;
        const item = lot.house.items[index];
        if (Math.hypot(lot.x + item.x - sim.x, lot.z + item.z - sim.z) < 5) near++;
      }
      return near >= 3 ? ['garden'] : [];
    },

    pack(world) {
      const out = [];
      for (const lot of world.lots) {
        if (!lot.garden) continue;
        const rows = Object.entries(lot.garden).map(([i, p]) => [+i, p.id, p.q, p.grow, p.water, p.weeds ? 1 : 0, p.fed, p.health, p.fruit ? 1 : 0, p.harvests, p.dead ? 1 : 0, p.planted, p.by]);
        if (rows.length) out.push([lot.index, rows]);
      }
      return out;
    },

    unpack(world, list) {
      if (list === null || list === undefined) return [];
      if (!Array.isArray(list)) throw new Error('повреждён сад');
      return list.map(r => {
        if (!Array.isArray(r) || r.length !== 2 || !world.lots[r[0]] || !Array.isArray(r[1])) throw new Error('повреждён сад');
        const lot = world.lots[r[0]], garden = {};
        for (const p of r[1]) {
          if (!Array.isArray(p) || p.length !== 13 || !(p[0] >= 0 && p[0] < lot.house.items.length) || !S.PLANTS[p[1]] || ![p[2], p[3], p[4], p[6], p[7], p[9], p[11]].every(Number.isFinite)) throw new Error('неизвестное растение в файле');
          garden[p[0]] = { id: p[1], q: p[2], grow: p[3], water: p[4], weeds: !!p[5], fed: p[6], health: p[7], fruit: !!p[8], harvests: p[9], dead: !!p[10], planted: p[11], by: p[12] };
        }
        return { lot, garden };
      });
    },

    apply(world, rows) {
      for (const lot of world.lots) delete lot.garden;
      for (const row of rows) row.lot.garden = row.garden;
      for (const lot of world.lots) {
        for (const item of lot.house.items) if (S.baseOf(item) === 'garden') S.Garden.dress(world, lot, item);
      }
    }
  };

  S.ADS.produce_eat = { id: 'produce_eat', name: 'Съесть', icon: 'fruit', age: 'toddler', player: true, steps: [{ here: true, clip: 'eatStand', mins: 6, take: 'produce', food: true, gain: { hunger: 12 } }] };
  S.ADS.produce_juice = { id: 'produce_juice', name: 'Выжать сок', icon: 'fruit', age: 'child', player: true, steps: [{ here: true, clip: 'eatStand', mins: 5, take: 'juice', food: true, gain: { hunger: 8 } }] };
})(globalThis.Sims98 = globalThis.Sims98 || {});
