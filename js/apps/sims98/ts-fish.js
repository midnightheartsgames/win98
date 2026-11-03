(function (S) {
  'use strict';
  const WATERS = { sea: 'море', lake: 'озеро', river: 'река' };
  const NIGHT_FROM = 1200, NIGHT_TO = 300;
  const BITE_BASE = 1, BITE_PER_LEVEL = 0.15, JUNK = 0.05, BIG_FISH = 10, ARM_FISH = 2, RARE_LEVEL = 6;
  const SCAN_LEVEL = 1, BAIT_LEVEL = 3, LIVE_BAIT_LEVEL = 5, BAIT_PULL = 6, BAIT_BITE = 1.2, ANGLER_BITE = 1.25, CATCH_PERK = 1.2, WEIGHT_PERK = 1.2;
  const JUNKS = ['boot', 'bottle', 'key'];

  const ROWS = [
    ['perch', 'Окунь', 'lake', 0, 9, 0.2, 1.4],
    ['crucian', 'Карась', 'lake', 0, 8, 0.2, 1.1],
    ['roach', 'Плотва', 'lake', 2, 14, 0.1, 0.7],
    ['bream', 'Лещ', 'lake', 4, 27, 0.8, 3.5],
    ['catfish', 'Сом', 'lake', 6, 68, 3, 28, { night: true }],
    ['koi', 'Карп кои', 'lake', 8, 135, 1, 6, { bait: 'grapes' }],
    ['goldfish', 'Золотая рыбка', 'lake', 10, 330, 0.1, 0.4, { bait: 'strawberry' }],
    ['gudgeon', 'Пескарь', 'river', 0, 8, 0.05, 0.3],
    ['trout', 'Форель', 'river', 2, 21, 0.4, 2.5],
    ['grayling', 'Хариус', 'river', 4, 36, 0.3, 1.8],
    ['pike', 'Щука', 'river', 6, 75, 1, 12, { bait: 'roach' }],
    ['sturgeon', 'Осётр', 'river', 8, 165, 4, 40, { night: true }],
    ['taimen', 'Таймень', 'river', 10, 270, 3, 30, { bait: 'grayling' }],
    ['sprat', 'Килька', 'sea', 0, 6, 0.02, 0.1],
    ['horsemackerel', 'Ставрида', 'sea', 2, 15, 0.2, 1],
    ['flounder', 'Камбала', 'sea', 4, 30, 0.5, 3],
    ['mackerel', 'Скумбрия', 'sea', 4, 33, 0.3, 1.6],
    ['seabass', 'Морской окунь', 'sea', 6, 72, 1, 9, { night: true }],
    ['tuna', 'Тунец', 'sea', 8, 180, 8, 60, { bait: 'mackerel' }],
    ['swordfish', 'Рыба-меч', 'sea', 10, 360, 20, 120, { night: true }]
  ];

  S.FISH = {};
  ROWS.forEach(([id, name, water, level, value, wMin, wMax, extra], order) => {
    S.FISH[id] = Object.assign({ id, name, water, level, value, wMin, wMax, order, night: false, bait: null }, extra);
  });

  const FISH_STEP = { clip: 'fish', mins: 60, gain: { fun: 20 }, fish: true, rounds: true };
  S.ADS.fish_here = { id: 'fish_here', name: 'Рыбачить здесь', icon: 'fish', age: 'child', player: true, steps: [Object.assign({ spot: true }, FISH_STEP)] };
  S.ADS.fish_pond = { id: 'fish_pond', objs: ['pond', 'creek'], name: 'Рыбачить', icon: 'fish', age: 'child', below: { fun: 70 }, steps: [Object.assign({ pose: 'near' }, FISH_STEP)] };
  S.ADS.fish_scan = { id: 'fish_scan', objs: ['pond', 'creek'], name: 'Рассмотреть воду', icon: 'fish', age: 'child', player: true, steps: [{ pose: 'near', clip: 'think', mins: 5, scan: true }] };
  S.ADS.pond_stock = { id: 'pond_stock', obj: 'pond', name: 'Запустить рыбу', icon: 'fish', age: 'child', player: true, steps: [{ pose: 'near', clip: 'pick', mins: 3, stock: true }] };
  S.ADS.tank_put = { id: 'tank_put', obj: 'aquarium', name: 'Запустить рыбу', icon: 'fish', age: 'child', player: true, steps: [{ pose: 'front', clip: 'use', mins: 3, tank: 'put' }] };
  S.ADS.tank_take = { id: 'tank_take', obj: 'aquarium', name: 'Забрать рыбу', icon: 'fish', age: 'child', player: true, when: 'tank', steps: [{ pose: 'front', clip: 'use', mins: 3, tank: 'take' }] };
  S.ADS.tank_watch = { id: 'tank_watch', obj: 'aquarium', name: 'Смотреть на рыбку', icon: 'fish', age: 'toddler', below: { fun: 70 }, when: 'tank', steps: [{ pose: 'front', clip: 'think', mins: 30, gain: { fun: 24 } }] };
  S.OBJECTS.pond = { price: 900, env: 2, section: 'Сад', icon: 'fish', outdoor: true, ads: ['fish_pond', 'fish_scan', 'pond_stock'] };
  S.OBJECTS.creek = { price: 1200, env: 2, section: 'Сад', icon: 'fish', outdoor: true, town: true, ads: ['fish_pond', 'fish_scan'] };
  S.OBJECTS.aquarium = { price: 350, env: 0, section: 'Гостиная', icon: 'fish', ads: ['tank_watch', 'tank_take'] };
  S.WHEN = S.WHEN || {};
  S.WHEN.tank = (world, lot, item) => !!S.Fish.tankOf(lot, item);

  const now = world => world.day * 1440 + world.clock;
  const night = world => world.clock >= NIGHT_FROM || world.clock < NIGHT_TO;
  const modelOf = item => (S.KINDS[S.KIND_ID[item.kind]] || {}).model;
  const pickKey = it => [it.k, it.id, it.w, it.at];
  const findPick = (sim, key) => S.Econ.index(sim, it => key && it.k === key[0] && it.id === key[1] && it.w === key[2] && it.at === key[3]);
  const fishState = lot => lot.fish || (lot.fish = { tanks: {}, ponds: {} });

  S.Fish = {
    WATERS, SCAN_LEVEL, BAIT_LEVEL, LIVE_BAIT_LEVEL, BIG_FISH, RARE_LEVEL, night,

    waterOf(world, act) {
      if (act.water) return act.water;
      if (act.item >= 0 && world.lots[act.lot]) return modelOf(world.lots[act.lot].house.items[act.item]) === 'creek' ? 'river' : 'lake';
      return 'sea';
    },

    seaAt(world, x, z) {
      return S.Terrain.paintAt(world.terrain, x, z) === S.PAINT.seabed;
    },

    shoreSpot(world, x, z) {
      const g = world.ground;
      let best = null, bestD = Infinity;
      for (let r = 1; r <= 4; r++) {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            const tx = Math.floor(x) + dx, tz = Math.floor(z) + dz;
            if (!g.isFree(0, tx, tz) || S.Fish.seaAt(world, tx + 0.5, tz + 0.5)) continue;
            const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([ox, oz]) => S.Fish.seaAt(world, tx + ox + 0.5, tz + oz + 0.5));
            if (!wet) continue;
            const d = Math.hypot(tx + 0.5 - x, tz + 0.5 - z);
            if (d < bestD) {
              bestD = d;
              best = { x: tx + 0.5, z: tz + 0.5, fx: tx + 0.5 + wet[0] * 2, fz: tz + 0.5 + wet[1] * 2 };
            }
          }
        }
        if (best) return best;
      }
      return null;
    },

    groundMenu(world, sim, x, z) {
      if (!S.Fish.seaAt(world, x, z)) return [];
      const spot = S.Fish.shoreSpot(world, x, z), why = S.Fish.why(sim);
      if (!spot) return [{ label: 'Рыбачить здесь', closed: 'До берега отсюда не дойти' }];
      const out = [{ label: 'Рыбачить здесь', ad: 'fish_here', spot, closed: why }];
      const baits = S.Fish.baitOptions(sim, { ad: 'fish_here', spot });
      if (baits) out.push(baits);
      return out;
    },

    why(sim) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.child) return 'Рыбачат с детского возраста';
      return null;
    },

    baitOptions(sim, base) {
      const level = S.Skills.level(sim, 'fishing');
      if (level < BAIT_LEVEL) return { label: 'С наживкой…', closed: 'Нужна рыбалка ' + BAIT_LEVEL };
      const seen = new Set(), section = [];
      for (const it of sim.bag || []) {
        if (seen.has(it.k + it.id) || !(it.k === 'produce' || (it.k === 'fish' && level >= LIVE_BAIT_LEVEL))) continue;
        seen.add(it.k + it.id);
        section.push(Object.assign({ label: S.Econ.name(it), bait: it.id }, base));
      }
      if (!section.length) return { label: 'С наживкой…', closed: level >= LIVE_BAIT_LEVEL ? 'Наживка: урожай или мелкая рыба в инвентаре' : 'Наживка: урожай в инвентаре. Живая с рыбалки ' + LIVE_BAIT_LEVEL };
      return { label: 'С наживкой…', section };
    },

    itemMenu(world, sim, it, index) {
      const out = [], home = sim.home, here = sim.lot === home && !sim.inside;
      const tank = home.house.items.find(item => modelOf(item) === 'aquarium' && !S.Fish.tankOf(home, item));
      out.push({ label: 'Запустить в аквариум', bag: index, use: 'tank', closed: !here ? 'Аквариум дома' : tank ? null : home.house.items.some(item => modelOf(item) === 'aquarium') ? 'Все аквариумы заняты' : 'Дома нет аквариума' });
      const pond = home.house.items.find(item => modelOf(item) === 'pond');
      out.push({ label: 'Запустить в пруд', bag: index, use: 'pond', closed: !here ? 'Пруд у дома' : pond ? null : 'У дома нет пруда' });
      out.push({ label: 'Отпустить', bag: index, use: 'free' });
      return out;
    },

    use(world, sim, index, use) {
      const it = sim.bag[index], home = sim.home;
      if (use === 'free') {
        S.Econ.take(sim, index);
        world.events.push({ type: 'catch', sim: sim.id, text: sim.name + ' отпускает рыбу: ' + S.Econ.name(it) });
        return null;
      }
      if (use === 'tank') {
        const tank = home.house.items.find(item => modelOf(item) === 'aquarium' && !S.Fish.tankOf(home, item));
        return tank ? Object.assign(S.Acts.adAct('tank_put', home, tank), { pick: pickKey(it) }) : null;
      }
      if (use === 'pond') {
        const pond = home.house.items.find(item => modelOf(item) === 'pond');
        return pond ? Object.assign(S.Acts.adAct('pond_stock', home, pond), { pick: pickKey(it) }) : null;
      }
      return null;
    },

    tankOf(lot, item) {
      const tanks = lot.fish && lot.fish.tanks;
      return tanks ? tanks[lot.house.items.indexOf(item)] || null : null;
    },

    stockOf(lot, item) {
      const ponds = lot.fish && lot.fish.ponds;
      return ponds ? ponds[lot.house.items.indexOf(item)] || [] : [];
    },

    begin(world, sim, act) {
      act.water = S.Fish.waterOf(world, act);
      if (act.bait && !S.Econ.count(sim, it => it.id === act.bait)) act.bait = null;
    },

    tick(world, sim, act, dt) {
      const level = S.Skills.level(sim, 'fishing');
      let rate = (BITE_BASE + BITE_PER_LEVEL * level) / 60 * dt;
      if (S.Traits.has(sim, 'angler')) rate *= ANGLER_BITE;
      if (S.Skills.has(sim, 'bigCatch')) rate *= CATCH_PERK;
      if (act.bait) rate *= BAIT_BITE;
      if (S.roll(world.rng) < rate) S.Fish.hook(world, sim, act);
    },

    candidates(world, sim, act) {
      const level = S.Skills.level(sim, 'fishing'), water = S.Fish.waterOf(world, act), dark = night(world);
      const lot = act.item >= 0 ? world.lots[act.lot] : null, stock = lot ? S.Fish.stockOf(lot, lot.house.items[act.item]) : [];
      return Object.values(S.FISH).filter(f => (f.water === water || stock.includes(f.id)) && f.level <= level && (!f.night || dark) && (!f.bait || f.bait === act.bait));
    },

    hook(world, sim, act) {
      if (!sim.skill) return;
      if (S.roll(world.rng) < JUNK) {
        const id = JUNKS[Math.floor(S.roll(world.rng) * JUNKS.length)], junk = S.Econ.item('oddity', id, { v: S.Econ.ODDITIES[id][1], at: now(world) });
        if (S.Econ.give(world, sim, junk)) world.events.push({ type: 'catch', sim: sim.id, text: 'Улов: ' + S.Econ.ODDITIES[id][0].toLowerCase() + '. Тоже добыча' });
        if (id === 'key' && sim.wish) S.Wishes.bump(sim, 'foundKey');
        return;
      }
      const list = S.Fish.candidates(world, sim, act);
      if (!list.length) return;
      let sum = 0;
      const weights = list.map(f => {
        const w = (1 + f.level / 3) * (act.bait && f.bait === act.bait ? BAIT_PULL : 1) * (act.bait && f.id !== act.bait && f.bait === null && f.level >= 4 ? 1.5 : 1);
        sum += w;
        return w;
      });
      let pick = S.roll(world.rng) * sum, f = list[list.length - 1];
      for (let i = 0; i < list.length; i++) {
        pick -= weights[i];
        if (pick <= 0) {
          f = list[i];
          break;
        }
      }
      const level = S.Skills.level(sim, 'fishing'), r = S.roll(world.rng);
      const weight = Math.round(Math.min(f.wMax * WEIGHT_PERK, (f.wMin + (f.wMax - f.wMin) * r * r) * (S.Skills.has(sim, 'fishExpert') ? WEIGHT_PERK : 1)) * 100) / 100;
      const q = Math.max(0, Math.min(S.Econ.PERFECT, Math.round(level / 3 + S.roll(world.rng) * 2 - 0.6 + (act.bait ? 0.3 : 0) + (S.Skills.has(sim, 'trophy') ? 0.4 : 0))));
      const value = Math.max(1, Math.round(f.value * (0.7 + 0.6 * Math.min(1, (weight - f.wMin) / (f.wMax - f.wMin))) * S.Econ.QMULT[q]));
      const it = S.Econ.item('fish', f.id, { q, w: weight, v: value, at: now(world) });
      const kept = S.Econ.give(world, sim, it);
      if (act.bait && f.bait === act.bait) {
        const bait = S.Econ.index(sim, b => b.id === act.bait && b !== it);
        if (bait >= 0) S.Econ.take(sim, bait);
        if (!S.Econ.count(sim, b => b.id === act.bait)) act.bait = null;
      }
      const stats = sim.skill.stats, records = stats.fishRecords || (stats.fishRecords = {}), record = !records[f.id] || weight > records[f.id];
      if (record) records[f.id] = weight;
      S.Skills.setStat(world, sim, 'fishKinds', Object.keys(records).length);
      S.Skills.stat(world, sim, 'fishCaught', 1);
      if (weight >= BIG_FISH) S.Skills.stat(world, sim, 'bigFish', 1);
      S.Moods.add(sim, 'fishing', 0, world);
      if (weight >= BIG_FISH) S.Moods.add(sim, 'bigFish', 0, world);
      if (sim.wish) {
        S.Wishes.bump(sim, 'fishCaught');
        if (f.level >= RARE_LEVEL) S.Wishes.bump(sim, 'rareFish');
        if (weight >= ARM_FISH) S.Wishes.bump(sim, 'armFish');
      }
      const text = 'Улов: ' + f.name.toLowerCase() + ', ' + String(weight).replace('.', ',') + ' кг, ' + S.Econ.QUALITY[q].toLowerCase() + (record && Object.keys(records).length > 1 ? '. Рекорд' : '') + (kept ? '' : '. Инвентарь полон, рыбу отпустили');
      world.events.push({ type: 'catch', sim: sim.id, fish: f.id, text });
      if (S.Wishes) S.Wishes.checkDream(world, sim);
    },

    scan(world, sim, act) {
      const water = S.Fish.waterOf(world, act), level = S.Skills.level(sim, 'fishing');
      if (level < SCAN_LEVEL) {
        world.events.push({ type: 'catch', sim: sim.id, text: sim.name + ': пока ничего не разглядеть. Нужна рыбалка ' + SCAN_LEVEL });
        return;
      }
      const lot = world.lots[act.lot], stock = lot ? S.Fish.stockOf(lot, lot.house.items[act.item]) : [];
      const here = Object.values(S.FISH).filter(f => f.water === water || stock.includes(f.id));
      const seen = sim.skill.stats.waters || (sim.skill.stats.waters = {});
      seen[water] = true;
      world.events.push({ type: 'catch', sim: sim.id, text: 'Здесь водятся: ' + here.map(f => f.name.toLowerCase() + (f.night ? ' (ночью)' : f.bait ? ' (на наживку)' : '')).join(', ') });
    },

    tankAct(world, sim, act, step) {
      const lot = world.lots[act.lot], item = lot.house.items[act.item], state = fishState(lot), index = act.item;
      if (step.tank === 'put') {
        const at = findPick(sim, act.pick);
        if (at < 0 || state.tanks[index]) return;
        state.tanks[index] = S.Econ.take(sim, at);
        S.Fish.dressTank(world, lot, item);
        if (S.Wishes) S.Wishes.checkDream(world, sim);
      } else if (step.tank === 'take') {
        const fish = state.tanks[index];
        if (!fish || !S.Econ.give(world, sim, fish)) return;
        delete state.tanks[index];
        S.Fish.dressTank(world, lot, item);
      }
    },

    stock(world, sim, act) {
      const lot = world.lots[act.lot], at = findPick(sim, act.pick);
      if (at < 0) return;
      const fish = S.Econ.take(sim, at), list = fishState(lot).ponds[act.item] || (fishState(lot).ponds[act.item] = []);
      if (!list.includes(fish.id)) list.push(fish.id);
      world.events.push({ type: 'catch', sim: sim.id, text: 'В пруду теперь водится: ' + S.FISH[fish.id].name.toLowerCase() });
    },

    dressTank(world, lot, item) {
      const kind = S.Fish.tankOf(lot, item) ? 'm_aquarium_fish' : 'm_aquarium';
      if (item.kind === kind || S.KIND_ID[kind] === undefined) return;
      item.kind = kind;
      if (world.reskin) world.reskin.add(item);
    },

    perfectTanks(world, sim) {
      const kinds = new Set();
      const lot = sim.home;
      for (const fish of Object.values((lot.fish && lot.fish.tanks) || {})) if (fish && fish.q === S.Econ.PERFECT) kinds.add(fish.id);
      return kinds.size;
    },

    pack(world) {
      const out = [];
      for (const lot of world.lots) {
        if (!lot.fish) continue;
        const tanks = Object.entries(lot.fish.tanks).filter(([, f]) => f).map(([i, f]) => [+i, S.Econ.pack({ bag: [f] })[0]]);
        const ponds = Object.entries(lot.fish.ponds).map(([i, list]) => [+i, list.slice()]);
        if (tanks.length || ponds.length) out.push([lot.index, tanks, ponds]);
      }
      return out;
    },

    unpack(world, list) {
      if (list === null || list === undefined) return [];
      if (!Array.isArray(list)) throw new Error('повреждены аквариумы');
      return list.map(r => {
        if (!Array.isArray(r) || r.length !== 3 || !world.lots[r[0]] || !Array.isArray(r[1]) || !Array.isArray(r[2])) throw new Error('повреждены аквариумы');
        const lot = world.lots[r[0]], items = lot.house.items.length, tanks = {}, ponds = {};
        for (const [i, f] of r[1]) {
          if (!(i >= 0 && i < items)) throw new Error('повреждены аквариумы');
          tanks[i] = S.Econ.unpack([f])[0];
        }
        for (const [i, ids] of r[2]) {
          if (!(i >= 0 && i < items) || !Array.isArray(ids) || !ids.every(id => S.FISH[id])) throw new Error('повреждён пруд');
          ponds[i] = ids.slice();
        }
        return { lot, tanks, ponds };
      });
    },

    apply(world, rows) {
      for (const lot of world.lots) {
        delete lot.fish;
        for (const item of lot.house.items) if (modelOf(item) === 'aquarium') S.Fish.dressTank(world, lot, item);
      }
      for (const row of rows) {
        row.lot.fish = { tanks: row.tanks, ponds: row.ponds };
        for (const item of row.lot.house.items) if (modelOf(item) === 'aquarium') S.Fish.dressTank(world, row.lot, item);
      }
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
