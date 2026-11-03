(function (S) {
  'use strict';
  const BAG_SIZE = 40;
  const QUALITY = ['Плохое', 'Обычное', 'Хорошее', 'Отличное', 'Безупречное'];
  const PERFECT = QUALITY.length - 1, QMULT = [0.6, 1, 1.3, 1.7, 2.5];
  const KINDS = {
    fish: { name: 'Рыба', icon: 'fish', shop: true },
    produce: { name: 'Урожай', icon: 'fruit', shop: true },
    seed: { name: 'Семена', icon: 'seed', shop: true },
    gem: { name: 'Камень', icon: 'gem', shop: true, set: 'gems' },
    metal: { name: 'Металл', icon: 'rock', shop: true, set: 'metals' },
    space: { name: 'Космический камень', icon: 'rock', shop: true, set: 'space' },
    butterfly: { name: 'Бабочка', icon: 'butterfly', shop: true, set: 'butterflies' },
    bug: { name: 'Жук', icon: 'bug', shop: true, set: 'bugs' },
    oddity: { name: 'Находка', icon: 'mask', shop: true },
    painting: { name: 'Картина', icon: 'paint' },
    manuscript: { name: 'Рукопись', icon: 'scroll' },
    book: { name: 'Книга', icon: 'book' },
    guitar: { name: 'Гитара', icon: 'guitar' },
    cert: { name: 'Сертификат мастера', icon: 'scroll', shop: true }
  };
  const ODDITIES = {
    boot: ['Старый сапог', 1, 'Кто-то потерял его давно и далеко отсюда.'],
    bottle: ['Бутылка с запиской', 15, 'Внутри свёрнутая записка, чернила почти смыло.'],
    key: ['Ржавый ключ', 5, 'Неизвестно от чего, но выбросить жалко.'],
    trinket: ['Безделушка', 8, 'Маленькая и блестящая. Чья она, лучше не спрашивать.']
  };
  const ITEM_FIELDS = 8, SEED_PACK = 3, SEED_PRICE = 0.8, SHOP_RATE = 0.85, FAMILY_BAG = 100, CERT_VALUE = 400;
  const LAND_TILE = 5, FLOOR_TILE = 14, WALL_SEG = 9, BILL_RATE = 0.012, CASH_RATE = 0.004, CASH_FREE = 20000, BILL_MIN = 40, BILL_CAP = 0.025, BROKE_AT = 100;
  const SERVING = 4, DRINK_COST = 2, FRUGAL = 0.8, COUPON_DAYS = 3;
  const COUPONS = {
    seeds: ['Семена на четверть дешевле', 0.75], sale: ['Магазин платит на десятую больше', 1.1], pizza: ['Пицца за §25 вместо §40', 25],
    repair: ['Вызов мастера на треть дешевле', 0.7], groceries: ['Продукты на пятую дешевле', 0.8]
  };

  const keyOf = it => it.k + ':' + it.id + ':' + it.q;

  S.Econ = {
    BAG_SIZE, QUALITY, PERFECT, QMULT, KINDS, ODDITIES, FAMILY_BAG, SHOP_RATE, BROKE_AT, COUPONS, COUPON_DAYS,

    item: (k, id, opts) => Object.assign({ k, id, q: 1, w: 0, v: 0, n: '', at: 0, x: null }, opts),

    earn(world, sum, text, sim) {
      const amount = Math.round(sum);
      if (!amount) return 0;
      world.funds += amount;
      world.events.push({ type: 'money', amount, sim: sim ? sim.id : null, text });
      return amount;
    },

    spend(world, sum) {
      if (world.funds < sum) return false;
      world.funds -= sum;
      return true;
    },

    give(world, sim, it) {
      if (!sim.bag) return false;
      if (sim.bag.length >= BAG_SIZE) {
        if (world.family.includes(sim)) world.events.push({ type: 'money', amount: 0, sim: sim.id, full: true, text: sim.name + ': инвентарь полон, «' + S.Econ.name(it) + '» пришлось оставить' });
        return false;
      }
      sim.bag.push(it);
      return true;
    },

    count(sim, test) {
      return sim.bag ? sim.bag.filter(test).length : 0;
    },

    index(sim, test) {
      return sim.bag ? sim.bag.findIndex(test) : -1;
    },

    take(sim, index) {
      return sim.bag && sim.bag[index] ? sim.bag.splice(index, 1)[0] : null;
    },

    name(it) {
      if (it.k === 'fish') return S.FISH[it.id] ? S.FISH[it.id].name : 'Рыба';
      if (it.k === 'produce') return S.PLANTS[it.id] ? S.PLANTS[it.id].produce : 'Урожай';
      if (it.k === 'seed') return S.PLANTS[it.id] ? 'Семена: ' + S.PLANTS[it.id].name.toLowerCase() : 'Семена';
      if (it.k === 'oddity') return ODDITIES[it.id] ? ODDITIES[it.id][0] : 'Находка';
      if (it.k === 'guitar') return 'Гитара';
      if (it.k === 'cert' && S.SKILLS[it.id]) return 'Сертификат: ' + S.SKILLS[it.id].name.toLowerCase();
      if (S.FINDS && S.FINDS[it.id]) return S.FINDS[it.id].name;
      return it.n || KINDS[it.k].name;
    },

    line(world, sim, it) {
      const parts = [];
      if (it.k === 'fish') parts.push(it.w.toFixed(1).replace('.', ',') + ' кг');
      if (it.k === 'fish' || it.k === 'produce' || it.k === 'seed') parts.push(QUALITY[it.q].toLowerCase());
      if (it.k === 'painting' && S.Art) parts.push(S.Art.paintingLine(it));
      if ((it.k === 'manuscript' || it.k === 'book') && S.Art) parts.push(S.Art.bookLine(it));
      const v = S.Econ.value(world, sim, it);
      if (v) parts.push('§' + v);
      return parts.join(', ');
    },

    value(world, sim, it) {
      const set = KINDS[it.k] && KINDS[it.k].set;
      return Math.round(it.v * (set && S.Collect ? S.Collect.bonus(sim, set) : 1));
    },

    sellable: it => !!(KINDS[it.k] && KINDS[it.k].shop),

    sellAll(world, sim) {
      if (!sim.bag) return 0;
      let total = 0, n = 0;
      for (let i = sim.bag.length - 1; i >= 0; i--) {
        const it = sim.bag[i];
        if (!S.Econ.sellable(it)) continue;
        total += Math.round(S.Econ.value(world, sim, it) * S.Econ.shopRate(world, sim));
        n++;
        sim.bag.splice(i, 1);
      }
      if (!n) {
        world.events.push({ type: 'money', amount: 0, sim: sim.id, text: sim.name + ': сдать в магазин нечего' });
        return 0;
      }
      if (sim.skill) S.Skills.stat(world, sim, 'shopSales', total);
      return S.Econ.earn(world, total, sim.name + ' сдаёт в магазин ' + n + ' ' + S.Econ.things(n) + ': +§' + total, sim);
    },

    shopRate(world, sim) {
      return (sim.rewards && sim.rewards.includes('fastTrade') ? 1 : SHOP_RATE) * (S.Econ.coupon(world, 'sale') || 1);
    },

    coupon(world, id) {
      const c = (world.coupons || []).find(x => x.id === id && x.until > world.day * 1440 + world.clock);
      return c ? COUPONS[id][1] : null;
    },

    keepCoupon(world, id) {
      if (!COUPONS[id]) return false;
      world.coupons = (world.coupons || []).filter(x => x.id !== id && x.until > world.day * 1440 + world.clock);
      world.coupons.push({ id, until: (world.day + COUPON_DAYS) * 1440 + world.clock });
      return true;
    },

    houseParts(world, lot) {
      const h = lot.house;
      let floor = 0, walls = 0, objects = 0;
      h.floors.forEach((f, k) => {
        walls += f.walls.size;
        for (const room of S.House.rooms(h, k).slice(1)) floor += room.area;
      });
      for (const item of h.items) {
        const o = S.objectOf(item);
        if (o) objects += o.price;
      }
      return { land: lot.w * lot.d * LAND_TILE, structure: Math.round(floor * FLOOR_TILE + walls * WALL_SEG), objects };
    },

    houseValue(world, lot) {
      const p = S.Econ.houseParts(world, lot);
      return p.land + p.structure + p.objects;
    },

    wealth(world) {
      return world.funds + S.Econ.houseValue(world, world.family[0].home);
    },

    billAmount(world) {
      const value = S.Econ.houseValue(world, world.family[0].home), raw = value * BILL_RATE + Math.max(0, world.funds - CASH_FREE) * CASH_RATE;
      return Math.round(Math.max(BILL_MIN, Math.min(raw, value * BILL_CAP)));
    },

    mealCost(world, sim, recipe, servings) {
      const base = recipe.kind === 'drink' ? DRINK_COST : (SERVING + recipe.level) * servings;
      return Math.max(1, Math.round(base * (S.Traits.has(sim, 'frugal') ? FRUGAL : 1) * (S.Econ.coupon(world, 'groceries') || 1)));
    },

    payGroceries(world, sim, recipe, servings) {
      const cost = S.Econ.mealCost(world, sim, recipe, servings);
      if (!S.Econ.spend(world, cost)) {
        S.Moods.add(sim, 'emptyFridge', 0, world);
        return false;
      }
      return true;
    },

    certificate(world, sim, skill) {
      return S.Econ.give(world, sim, S.Econ.item('cert', skill, { v: CERT_VALUE, at: world.day * 1440 + world.clock }));
    },

    familyBag: world => world.familyBag || (world.familyBag = []),

    store(world, sim, index) {
      const bag = S.Econ.familyBag(world), it = sim.bag && sim.bag[index];
      if (!it || bag.length >= FAMILY_BAG) return false;
      bag.push(S.Econ.take(sim, index));
      return true;
    },

    fetch(world, sim, index) {
      const bag = S.Econ.familyBag(world), it = bag[index];
      if (!it || !sim.bag || sim.bag.length >= BAG_SIZE) return false;
      sim.bag.push(bag.splice(index, 1)[0]);
      return true;
    },

    familyStacks(world) {
      return S.Econ.stacks({ bag: S.Econ.familyBag(world) });
    },

    things: n => (n % 10 === 1 && n % 100 !== 11 ? 'вещь' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'вещи' : 'вещей'),

    seedPrice: (plant, world) => Math.max(3, Math.round(plant.value * SEED_PRICE * ((world && S.Econ.coupon(world, 'seeds')) || 1))),

    shopMenu(world, sim, goal) {
      const out = [{ label: 'Сдать улов, урожай и находки', go: goal, sell: true, closed: sim.bag && sim.bag.some(S.Econ.sellable) ? null : 'Сдавать нечего' }];
      if (S.PLANTS) {
        out.push({
          label: 'Купить семена…',
          section: Object.values(S.PLANTS).filter(p => p.rarity === 'common').map(p => ({ label: p.name + ', ' + SEED_PACK + ' шт. (§' + S.Econ.seedPrice(p, world) + ')', go: goal, buy: p.id, closed: world.funds < S.Econ.seedPrice(p, world) ? 'Не хватает денег' : null }))
        });
      }
      return out;
    },

    buySeeds(world, sim, id) {
      const plant = S.PLANTS[id], price = plant && S.Econ.seedPrice(plant, world);
      if (!plant || !S.Econ.spend(world, price)) return false;
      let got = 0;
      for (let i = 0; i < SEED_PACK; i++) if (S.Econ.give(world, sim, S.Econ.item('seed', id, { q: 1, v: Math.round(plant.value / 2), at: world.day * 1440 + world.clock }))) got++;
      world.events.push({ type: 'money', amount: -price, sim: sim.id, text: sim.name + ' покупает семена: ' + plant.name.toLowerCase() + ' × ' + got + ', −§' + price });
      return true;
    },

    stacks(sim) {
      const out = [], seen = new Map();
      (sim.bag || []).forEach((it, index) => {
        const stackable = it.k !== 'painting' && it.k !== 'manuscript' && it.k !== 'book' && it.k !== 'fish';
        const key = stackable ? keyOf(it) : 'i' + index;
        if (seen.has(key)) {
          out[seen.get(key)].indexes.push(index);
          return;
        }
        seen.set(key, out.length);
        out.push({ item: it, indexes: [index] });
      });
      return out;
    },

    menu(world, sim, index) {
      const it = sim.bag && sim.bag[index];
      if (!it) return [];
      let out = [];
      if (it.k === 'fish' && S.Fish) out = S.Fish.itemMenu(world, sim, it, index);
      else if ((it.k === 'produce' || it.k === 'seed') && S.Garden) out = S.Garden.itemMenu(world, sim, it, index);
      else if ((it.k === 'painting' || it.k === 'manuscript' || it.k === 'book' || it.k === 'guitar') && S.Art) out = S.Art.itemMenu(world, sim, it, index);
      if (S.Opps) out.push(...S.Opps.itemMenu(world, sim, it, index));
      if (S.Econ.sellable(it)) out.push({ label: 'Сдать в магазин', closed: 'Сдают в магазине: щёлкните по зданию магазина' });
      const mates = world.family.filter(o => o !== sim && o.bag && o.lot && o.lot === sim.lot && !o.inside);
      if (world.family.includes(sim)) out.push({ label: 'В семейный инвентарь', bag: index, use: 'store', closed: S.Econ.familyBag(world).length >= FAMILY_BAG ? 'Семейный инвентарь полон' : null });
      if (mates.length) out.push({ label: 'Передать…', section: mates.map(o => ({ label: o.name, bag: index, use: 'pass', to: world.sims.indexOf(o), closed: o.bag.length >= BAG_SIZE ? 'Инвентарь полон' : null })) });
      return out;
    },

    use(world, sim, index, use, option) {
      const it = sim.bag && sim.bag[index];
      if (!it) return null;
      if (use === 'store') {
        if (S.Econ.store(world, sim, index)) world.events.push({ type: 'money', amount: 0, sim: sim.id, text: '«' + S.Econ.name(it) + '» теперь в семейном инвентаре' });
        return null;
      }
      if (use === 'pass') {
        const to = world.sims[option.to];
        if (!to || !to.bag || to.bag.length >= BAG_SIZE) return null;
        to.bag.push(S.Econ.take(sim, index));
        world.events.push({ type: 'money', amount: 0, sim: sim.id, text: sim.name + ' передаёт: «' + S.Econ.name(it) + '» (' + to.name + ')' });
        return null;
      }
      if (it.k === 'fish' && S.Fish) return S.Fish.use(world, sim, index, use, option);
      if ((it.k === 'produce' || it.k === 'seed') && S.Garden) return S.Garden.use(world, sim, index, use, option);
      if (S.Art) return S.Art.use(world, sim, index, use, option);
      return null;
    },

    pack(sim) {
      return sim.bag ? sim.bag.map(it => [it.k, it.id, it.q, it.w, it.v, it.n, it.at, it.x]) : null;
    },

    packWorld(world) {
      return [S.Econ.pack({ bag: S.Econ.familyBag(world) }), (world.coupons || []).map(c => [c.id, c.until])];
    },

    unpackWorld(r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r) || r.length !== 2 || !Array.isArray(r[1])) throw new Error('повреждён семейный инвентарь');
      for (const c of r[1]) if (!Array.isArray(c) || !COUPONS[c[0]] || !Number.isFinite(c[1])) throw new Error('неизвестный купон в файле');
      return { bag: S.Econ.unpack(r[0]) || [], coupons: r[1].map(([id, until]) => ({ id, until })) };
    },

    unpack(r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r)) throw new Error('повреждён инвентарь жителя');
      return r.map(f => {
        if (!Array.isArray(f) || f.length !== ITEM_FIELDS || !KINDS[f[0]] || typeof f[1] !== 'string' || ![f[2], f[3], f[4], f[6]].every(Number.isFinite)) throw new Error('неизвестная вещь в инвентаре');
        return { k: f[0], id: f[1], q: f[2], w: f[3], v: f[4], n: typeof f[5] === 'string' ? f[5] : '', at: f[6], x: f[7] && typeof f[7] === 'object' ? Object.assign({}, f[7]) : null };
      });
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
