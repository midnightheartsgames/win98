(function (H) {
  'use strict';
  const T = () => H.TUNING;

  const SYN_MATS = {
    metal: ['Металл', 2, 20, 'Обрезок обшивки станции. Материал для синтеза.', 'Разрушаемые объекты станции «Герта» и Экспресса, Буфет Пом-Пом.'],
    basic: ['Основной ингредиент', 2, 20, 'Мука, соль и сухое молоко из камбуза. Материал для синтеза.', 'Разрушаемые объекты станции «Герта» и Экспресса, Буфет Пом-Пом.'],
    phlog: ['Флогистон', 2, 20, 'Горючая пыль в запаянной колбе. Материал для синтеза.', 'Разрушаемые объекты станции «Герта», враги Сточного прохода, Магазин Подземья.'],
    seed: ['Семена', 2, 20, 'Горсть семян из оранжереи Белобога. Материал для синтеза.', 'Разрушаемые объекты Ярило-VI, магазин в Административном районе.'],
    water: ['Твёрдая вода', 2, 20, 'Лёд Ярило-VI, который не тает в тепле. Материал для синтеза.', 'Разрушаемые объекты Ярило-VI, враги Зоны хранения, магазин в Административном районе.'],
    gas: ['Газообразная жидкость', 2, 20, 'Жидкость, которая течёт вверх. Материал для синтеза.', 'Разрушаемые объекты Ярило-VI, золотые чашелисты, Магазин Подземья.'],
    mech: ['Механические детали', 3, 60, 'Шестерни и пружины из разобранных автоматонов. Материал для синтеза.', 'Враги Поселения роботов, Магазин Подземья.'],
    rice: ['Белковый рис', 3, 60, 'Паёк из раздатчика станции. Материал для синтеза.', 'Враги Зоны хранения, Кулинарный гений № 123.'],
    particle: ['Мнимые частицы', 3, 60, 'Частицы из ловушки Зоны хранения. Материал для синтеза.', 'Враги Зоны хранения.'],
    herbs: ['Экстракт из лечебных трав', 3, 60, 'Настой из аптеки Белобога. Материал для синтеза.', 'Магазин в Административном районе.']
  };
  for (const [id, [name, rar, price, text, src]] of Object.entries(SYN_MATS)) H.ITEMS[id] = { name, kind: 'synmat', mat: 'syn', rar, price, text, src };

  const RECIPES = {
    medkit: { herbs: 1, water: 2 },
    soup: { rice: 1, water: 2, seed: 1 },
    pie: { rice: 2, basic: 2, seed: 2 },
    revive: { herbs: 2, particle: 2, metal: 2 },
    suncake: { basic: 2, seed: 1 },
    coffee: { seed: 2, water: 1 },
    hotpot: { rice: 1, phlog: 2 },
    lunch: { rice: 1, basic: 2 },
    friedrice: { rice: 2, gas: 2 },
    thermos: { water: 2, phlog: 1 },
    sbiten: { seed: 2, phlog: 2, gas: 1 },
    spark: { mech: 2, phlog: 3, metal: 2 }
  };
  const RECIPE_BASE = ['medkit', 'soup'];
  const RECIPE_SHOP = { express: ['coffee', 'revive'], belobog: ['suncake'], boulder: ['pie', 'hotpot'], robot: ['friedrice', 'lunch'] };
  const RECIPE_CHEST = { thermos: 'лежит в сундуке в Пригородных снежных полях', sbiten: 'лежит в сундуке в Большой шахте', spark: 'лежит в сундуке в Большой шахте' };
  const RECIPE_PRICE = { 2: 600, 3: 1200, 4: 2400 };
  const RECIPE_BACK = 300;
  for (const id of Object.keys(RECIPES)) {
    const dish = H.ITEMS[id];
    H.ITEMS['rcp_' + id] = { name: 'Рецепт: ' + dish.name, kind: 'recipe', dish: id, rar: dish.rar, price: RECIPE_PRICE[dish.rar], text: 'Учит готовить «' + dish.name + '» в Синтезе. Изучается сразу.' };
  }
  const SYN_SHOP = { express: ['basic', 'metal'], belobog: ['seed', 'water', 'herbs'], boulder: ['gas', 'phlog', 'mech'], robot: ['rice'] };
  for (const [shop, ids] of Object.entries(SYN_SHOP)) H.SHOPS[shop].items.push(...ids);
  for (const [shop, ids] of Object.entries(RECIPE_SHOP)) H.SHOPS[shop].items.push(...ids.map(id => 'rcp_' + id));

  H.ITEMS.remains = { name: 'Обломки Реликвии', kind: 'key', rar: 5, price: 0, text: 'Остатки расщеплённых реликвий. 100 Обломков в Синтезе дают реликвию выбранного набора и слота, 800 дают Самомоделирующуюся смолу.' };
  const RELIC = { cost: 100, resinCost: 800, resinHour: 2, tl: 40, base: 10, perLvl: 4, credits: 150 };
  const HOUR = 3600000;

  const DESTR_MATS = { station: ['metal', 'basic', 'phlog'], jarilo: ['seed', 'water', 'gas'] };
  const FOE_MATS = { hs_storage: ['rice', 'particle', 'water'], hs_storage2: ['rice', 'particle', 'water'], u_settle1: ['mech'], u_settle2: ['mech'], j_backwater: ['phlog'] };
  const GOLDEN = ['cx_exp', 'cx_aether', 'cx_credits'];
  Object.assign(H.TUNING, { synDestr: 0.6, synDestr2: 0.2, synFoe: 0.5 });

  const destrWorld = mapId => /^(j_|u_|ax_)/.test(mapId) ? 'jarilo' : 'station';

  const recipeWhere = id => {
    if (RECIPE_BASE.includes(id)) return 'Известен с начала.';
    const shop = Object.keys(RECIPE_SHOP).find(k => RECIPE_SHOP[k].includes(id));
    const from = shop ? 'продаётся: ' + H.SHOPS[shop].name : RECIPE_CHEST[id] || '';
    return 'Рецепт ' + from + '. Или получите само блюдо.';
  };

  const base = {
    give: H.Game.prototype.give,
    buy: H.Game.prototype.buy,
    shopList: H.Game.prototype.shopList,
    traceBattleLoot: H.Game.prototype.traceBattleLoot,
    traceCalyx: H.Game.prototype.traceCalyx,
    sellRelic: H.Game.prototype.sellRelic
  };

  Object.assign(H.Game.prototype, {
    recipeSync() {
      const s = this.state, inv = s.inv.items, known = s.recipes || (s.recipes = {});
      for (const id of RECIPE_BASE) known[id] = true;
      const learned = [];
      for (const id of Object.keys(inv)) {
        const it = H.ITEMS[id];
        if (it && it.kind === 'recipe') {
          let n = inv[id];
          delete inv[id];
          if (!known[it.dish]) { known[it.dish] = true; learned.push(it.dish); n--; }
          if (n > 0) { s.credits += n * RECIPE_BACK; this.emit({ t: 'toast', text: 'Рецепт уже изучен: +' + H.fmt(n * RECIPE_BACK) + ' кредитов' }); }
        } else if (RECIPES[id] && !known[id]) { known[id] = true; learned.push(id); }
      }
      if (learned.length) this.emit({ t: 'toast', text: learned.length > 3 ? 'Изучено рецептов: ' + learned.length + '. Блюда из инвентаря теперь можно готовить в Синтезе.' : (learned.length > 1 ? 'Изучены рецепты: ' : 'Изучен рецепт: ') + learned.map(id => H.ITEMS[id].name).join(', ') });
      return learned;
    },

    recipeKnown(id) { return !!(this.state.recipes || {})[id] || RECIPE_BASE.includes(id); },

    cookMax(id) {
      const r = RECIPES[id], inv = this.state.inv.items;
      if (!r || !this.recipeKnown(id)) return 0;
      return Math.min(...Object.entries(r).map(([m, n]) => Math.floor((inv[m] || 0) / n)));
    },

    cook(id, times) {
      const k = Math.max(1, times || 1), r = RECIPES[id], inv = this.state.inv.items;
      if (!r || this.cookMax(id) < k) return false;
      for (const [m, n] of Object.entries(r)) { inv[m] -= n * k; if (!inv[m]) delete inv[m]; }
      inv[id] = (inv[id] || 0) + k;
      return true;
    },

    synDestr() {
      if (this.rng() >= T().synDestr) return '';
      const pool = DESTR_MATS[destrWorld(this.map ? this.map.id : '')], items = {};
      for (let i = 0; i < (this.rng() < T().synDestr2 ? 2 : 1); i++) { const id = pool[this.rng.int(pool.length)]; items[id] = (items[id] || 0) + 1; }
      return this.give({ items }).join(', ');
    },

    give(g) {
      const out = base.give.call(this, g);
      if (g && g.items) this.recipeSync();
      return out;
    },

    buy(shopId, idx, n = 1) {
      const ok = base.buy.call(this, shopId, idx, n);
      if (ok) this.recipeSync();
      return ok;
    },

    shopList(id) {
      return base.shopList.call(this, id).filter(e => !(e.kind === 'item' && H.ITEMS[e.id].kind === 'recipe' && this.recipeKnown(H.ITEMS[e.id].dish)));
    },

    traceBattleLoot(b, ctx) {
      const out = base.traceBattleLoot.call(this, b, ctx);
      const pool = this.map && FOE_MATS[this.map.id], rw = b.result && b.result.reward;
      if (!pool || !rw || ctx.calyx || b.opts.su || b.opts.fh || this.rng() >= T().synFoe) return out;
      const items = {}, n = 1 + ((rw.foes || []).some(f => f.elite) ? 1 : 0);
      for (let i = 0; i < n; i++) { const id = pool[this.rng.int(pool.length)]; items[id] = (items[id] || 0) + 1; }
      return out.concat(this.give({ items }));
    },

    relicCraftOpen() { return this.state.tl.lvl >= RELIC.tl || !!this.state.flags.fh_met; },

    salvageValue(rel) { return RELIC.base + RELIC.perLvl * (rel.lvl || 0); },

    relicWorn(uid) { return Object.values(this.state.roster).some(r => Object.values(r.relics || {}).includes(uid)); },

    sellRelic(uid) {
      const rel = this.state.inv.relics.find(x => x.uid === uid);
      if (!rel || !base.sellRelic.call(this, uid)) return false;
      this.give({ items: { remains: this.salvageValue(rel) } });
      return true;
    },

    salvagePreview(maxLvl) {
      const list = this.state.inv.relics.filter(r => r.lvl <= maxLvl && !this.relicWorn(r.uid));
      return { list, credits: list.length * RELIC.credits, remains: list.reduce((a, r) => a + this.salvageValue(r), 0) };
    },

    salvageMany(maxLvl) {
      const p = this.salvagePreview(maxLvl);
      for (const r of p.list) this.sellRelic(r.uid);
      return p;
    },

    craftRelic(set, slotKey, main) {
      const s = this.state, inv = s.inv.items, def = H.RELIC_SETS[set];
      const slots = def && def.planar ? H.PLANAR_SLOTS : H.CAVERN_SLOTS, slot = slots.find(x => x.key === slotKey);
      if (!def || !slot || !this.relicCraftOpen() || (inv.remains || 0) < RELIC.cost) return null;
      if (main && (!(inv.resin > 0) || !slot.mains.includes(main))) return null;
      this.take({ items: main ? { remains: RELIC.cost, resin: 1 } : { remains: RELIC.cost } });
      const rl = Math.min(15, Math.floor(this.avgLevel() / 3));
      const rel = this.makeRelic(set, slot, rl, this.avgLevel());
      if (main && rel.main !== main) {
        rel.subs = rel.subs.filter(([k]) => k !== main);
        rel.main = main;
        rel.mv = this.relicMain(main, rl);
      }
      return rel;
    },

    resinLeft() {
      const s = this.state, h = Math.floor(this.now() / HOUR), rb = s.resinBuy || (s.resinBuy = { hour: h, n: 0 });
      if (rb.hour !== h) { rb.hour = h; rb.n = 0; }
      return RELIC.resinHour - rb.n;
    },

    resinFromRemains() {
      if (this.resinLeft() <= 0 || (this.state.inv.items.remains || 0) < RELIC.resinCost) return false;
      this.take({ items: { remains: RELIC.resinCost } });
      this.state.resinBuy.n++;
      this.give({ items: { resin: 1 } });
      return true;
    },

    traceCalyx(c, tier) {
      const out = base.traceCalyx.call(this, c, tier);
      return GOLDEN.includes(c.id) ? out.concat(this.give({ items: { gas: 1 + tier } })) : out;
    }
  });

  Object.assign(H, { RELIC_CRAFT: RELIC, SYN_MATS: Object.keys(SYN_MATS), RECIPES, RECIPE_BASE, RECIPE_SHOP, RECIPE_CHEST, RECIPE_BACK, recipeWhere });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
