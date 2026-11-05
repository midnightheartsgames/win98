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
  const RELIC = {
    cost: 100, resinCost: 800, resinHour: 2, tl: 40, base: 10, perLvl: 4, credits: 150,
    salvageCap: 500, invCap: 3000, tplCap: 5,
    sorts: [
      { id: 'lvl', label: 'Уровень' },
      { id: 'set', label: 'Набор' },
      { id: 'got', label: 'Время получения' }
    ],
    tiers: [
      { id: 't0', label: '2★', title: '+0', min: 0, max: 0 },
      { id: 't1', label: '3★', title: '+1..+5', min: 1, max: 5 },
      { id: 't2', label: '4★', title: '+6..+10', min: 6, max: 10 },
      { id: 't3', label: '5★', title: '+11..+15', min: 11, max: 15 }
    ],
    quickTiers: [
      { id: 'q0', maxLvl: 0, label: '2★ и ниже' },
      { id: 'q5', maxLvl: 5, label: '3★ и ниже' },
      { id: 'q10', maxLvl: 10, label: '4★ и ниже' },
      { id: 'q15', maxLvl: 15, label: '5★ и ниже' }
    ],
    slotTabs: [
      { key: 'all', name: 'Все', full: 'Все слоты' },
      ...H.RELIC_SLOTS.map(s => ({ key: s.key, name: s.name, full: s.full || s.name }))
    ]
  };
  const HOUR = 3600000;

  function relicFix(rel) {
    if (!rel) return null;
    if (typeof rel.lock !== 'boolean') rel.lock = false;
    if (typeof rel.trash !== 'boolean') rel.trash = false;
    if (rel.lock && rel.trash) rel.trash = false;
    return rel;
  }

  function relicMakeFilter(raw = {}) {
    return {
      slot: raw.slot || 'all',
      sets: Array.isArray(raw.sets) ? [...raw.sets] : [],
      tiers: Array.isArray(raw.tiers) ? [...raw.tiers] : [],
      mains: Array.isArray(raw.mains) ? [...raw.mains] : [],
      subs: Array.isArray(raw.subs) ? [...raw.subs] : [],
      lock: raw.lock || 'all',
      trash: raw.trash || 'all',
      enh: raw.enh || 'all'
    };
  }

  function relicFilterEmpty(f) {
    if (!f) return true;
    return (!f.sets || !f.sets.length) &&
      (!f.tiers || !f.tiers.length) &&
      (!f.mains || !f.mains.length) &&
      (!f.subs || !f.subs.length) &&
      (!f.lock || f.lock === 'all') &&
      (!f.trash || f.trash === 'all') &&
      (!f.enh || f.enh === 'all');
  }

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

    ensureRelics() {
      const s = this.state;
      for (const r of s.inv.relics) relicFix(r);
      if (!Array.isArray(s.relicFilterTpls)) s.relicFilterTpls = [];
      return s.inv.relics;
    },

    relicOf(uid) {
      return relicFix(this.state.inv.relics.find(x => x.uid === uid));
    },

    toggleRelicLock(uid) {
      const rel = this.relicOf(uid);
      if (!rel) return false;
      rel.lock = !rel.lock;
      if (rel.lock) rel.trash = false;
      return rel.lock;
    },

    toggleRelicTrash(uid) {
      const rel = this.relicOf(uid);
      if (!rel) return false;
      rel.trash = !rel.trash;
      if (rel.trash) rel.lock = false;
      return rel.trash;
    },

    salvageValue(rel) { return RELIC.base + RELIC.perLvl * (rel.lvl || 0); },

    relicWorn(uid) { return Object.values(this.state.roster).some(r => Object.values(r.relics || {}).includes(uid)); },

    relicWornBy(uid) {
      const e = Object.entries(this.state.roster).find(([, r]) => Object.values(r.relics || {}).includes(uid));
      return e ? e[0] : null;
    },

    relicSalvageable(rel, opts = {}) {
      if (!rel || this.relicWorn(rel.uid)) return false;
      relicFix(rel);
      const incEnh = typeof opts === 'boolean' ? opts : !!(opts && opts.includeEnhanced);
      if (!incEnh && (rel.lvl || 0) > 0) return false;
      return true;
    },

    relicCanSalvage(rel, opts = {}) {
      return this.relicSalvageable(rel, opts) && !rel.lock;
    },

    relicSalvageableTotal(opts = {}) {
      this.ensureRelics();
      return this.state.inv.relics.filter(r => this.relicCanSalvage(r, opts)).length;
    },

    filterRelics(list, rawFilter = {}, slotOverride) {
      const f = relicMakeFilter(rawFilter);
      const slot = slotOverride || f.slot;
      return (list || []).filter(rel => {
        relicFix(rel);
        if (slot && slot !== 'all' && rel.slot !== slot) return false;
        if (f.sets.length && !f.sets.includes(rel.set)) return false;
        if (f.tiers.length) {
          const lv = rel.lvl || 0;
          const matchTier = f.tiers.some(tid => {
            const t = RELIC.tiers.find(x => x.id === tid);
            return t && lv >= t.min && lv <= t.max;
          });
          if (!matchTier) return false;
        }
        if (f.mains.length && !f.mains.includes(rel.main)) return false;
        if (f.subs.length && !f.subs.every(k => (rel.subs || []).some(([sk]) => sk === k))) return false;
        if (f.lock === 'locked' && !rel.lock) return false;
        if (f.lock === 'unlocked' && rel.lock) return false;
        if (f.trash === 'trash' && !rel.trash) return false;
        if (f.trash === 'notrash' && rel.trash) return false;
        if (f.enh === 'enh' && (rel.lvl || 0) <= 0) return false;
        if (f.enh === 'unenh' && (rel.lvl || 0) > 0) return false;
        return true;
      });
    },

    sortRelics(list, sortKey = 'lvl', dir = 1, opts = {}) {
      const d = dir === 'asc' || dir === -1 ? -1 : 1;
      const setKeys = Object.keys(H.RELIC_SETS);
      const slotKeys = H.RELIC_SLOTS.map(s => s.key);
      const baseIdx = new Map();
      this.state.inv.relics.forEach((r, idx) => baseIdx.set(r.uid, idx));
      const rows = (list || []).map((rel, i) => ({
        rel: relicFix(rel),
        idx: baseIdx.has(rel.uid) ? baseIdx.get(rel.uid) : i,
        setIdx: setKeys.indexOf(rel.set),
        slotIdx: slotKeys.indexOf(rel.slot),
        worn: opts.equippedFirst ? (this.relicWorn(rel.uid) ? 1 : 0) : 0
      }));
      rows.sort((a, b) => {
        if (opts.salvage && !!a.rel.lock !== !!b.rel.lock) return a.rel.lock ? 1 : -1;
        if (opts.salvage && opts.trashFirst && !a.rel.lock && !!a.rel.trash !== !!b.rel.trash) return a.rel.trash ? -1 : 1;
        if (opts.equippedFirst && a.worn !== b.worn) return b.worn - a.worn;
        if (sortKey === 'set') {
          if (a.setIdx !== b.setIdx) return (a.setIdx - b.setIdx) * d;
          if (a.slotIdx !== b.slotIdx) return (a.slotIdx - b.slotIdx) * d;
          if ((a.rel.lvl || 0) !== (b.rel.lvl || 0)) return ((b.rel.lvl || 0) - (a.rel.lvl || 0)) * d;
          return a.idx - b.idx;
        }
        if (sortKey === 'got') return (b.idx - a.idx) * d;
        if ((a.rel.lvl || 0) !== (b.rel.lvl || 0)) return ((b.rel.lvl || 0) - (a.rel.lvl || 0)) * d;
        if (a.setIdx !== b.setIdx) return a.setIdx - b.setIdx;
        if (a.slotIdx !== b.slotIdx) return a.slotIdx - b.slotIdx;
        return a.idx - b.idx;
      });
      return rows.map(x => x.rel);
    },

    relicSalvageList(opts = {}) {
      this.ensureRelics();
      const baseList = this.state.inv.relics.filter(r => this.relicSalvageable(r, { includeEnhanced: !!opts.includeEnhanced }));
      const filtered = opts.filter ? this.filterRelics(baseList, opts.filter) : baseList;
      return this.sortRelics(filtered, opts.sortKey || 'lvl', opts.sortDir || 1, { salvage: true, trashFirst: !!opts.trashFirst });
    },

    relicBatchFilterAction(list, mode) {
      let count = 0;
      for (const rel of (list || [])) {
        relicFix(rel);
        if (mode === 'lock') {
          if (!rel.lock) { rel.lock = true; rel.trash = false; count++; }
        } else if (mode === 'trash') {
          if (!rel.trash) { rel.trash = true; rel.lock = false; count++; }
        }
      }
      return count;
    },

    saveRelicFilterTpl(filter, name) {
      if (typeof filter === 'string') [filter, name] = [name, filter];
      this.ensureRelics();
      const tpls = this.state.relicFilterTpls;
      if (tpls.length >= RELIC.tplCap) return null;
      const clean = relicMakeFilter(filter);
      clean.slot = 'all';
      const entry = { id: 'rtpl_' + (this.state.uid++), name: name || ('Шаблон ' + (tpls.length + 1)), filter: clean };
      tpls.push(entry);
      return entry;
    },

    deleteRelicFilterTpl(id) {
      this.ensureRelics();
      const i = this.state.relicFilterTpls.findIndex(t => t.id === id);
      if (i < 0) return false;
      this.state.relicFilterTpls.splice(i, 1);
      return true;
    },

    relicSetRecs(setKey) {
      const subs = new Set();
      const mains = { head: new Set(['hpF']), hands: new Set(['atkF']), body: new Set(), feet: new Set(), sphere: new Set(), rope: new Set() };
      const addBuild = (b, elemKey) => {
        for (const s of (b.subs || [])) subs.add(s);
        for (const [sl, arr] of Object.entries(b.mains || {})) {
          if (!mains[sl]) continue;
          for (const m of arr) {
            if (m === 'elem') {
              if (elemKey) mains[sl].add(elemKey + 'P');
              else for (const em of H.ELEM_MAINS) mains[sl].add(em);
            } else mains[sl].add(m);
          }
        }
      };
      if (H.guideBuild) {
        for (const kit of Object.keys(H.CHARS || {})) {
          const b = H.guideBuild(kit);
          if (b.set === setKey || b.planar === setKey) addBuild(b, H.CHARS[kit].elem);
        }
      }
      if (!subs.size && H.GUIDE_PRESETS) {
        const def = H.RELIC_SETS[setKey] || {}, bon = def.bonus || {};
        const fallbackKey = bon.healP ? 'heal' : bon.defP ? 'shield' : bon.breakE ? 'brk' : bon.err ? 'amp' : 'crit';
        addBuild(H.GUIDE_PRESETS[fallbackKey] || H.GUIDE_PRESETS.crit, null);
      }
      return {
        subs: [...subs],
        mains: Object.fromEntries(Object.entries(mains).map(([k, v]) => [k, [...v]]))
      };
    },

    relicMainMatched(rel) {
      if (!rel || rel.slot === 'head' || rel.slot === 'hands') return true;
      const rec = this.relicSetRecs(rel.set);
      return (rec.mains[rel.slot] || []).includes(rel.main);
    },

    relicUsefulSubCount(rel) {
      if (!rel || !Array.isArray(rel.subs)) return 0;
      const rec = this.relicSetRecs(rel.set);
      return rel.subs.filter(([k]) => rec.subs.includes(k)).length;
    },

    relicProtectedFromDiscard(rel) {
      if (!rel || !Array.isArray(rel.subs)) return false;
      const hasCr = rel.subs.some(([k]) => k === 'critR');
      const hasCd = rel.subs.some(([k]) => k === 'critD');
      if (hasCr && hasCd) return true;
      if (['spd', 'err', 'critR', 'critD'].includes(rel.main)) {
        const topSubs = rel.subs.filter(([k]) => k === 'critR' || k === 'critD' || k === 'spd').length;
        if (topSubs >= 2) return true;
      }
      return false;
    },

    relicSmartDiscardCandidates(opts = {}) {
      const unmatchedMain = !!opts.unmatchedMain;
      const maxUsefulSubs = (opts.maxUsefulSubs === 0 || opts.maxUsefulSubs === 1) ? opts.maxUsefulSubs : null;
      const protect = opts.protect !== false;
      if (!unmatchedMain && maxUsefulSubs == null) return [];
      const pool = this.relicSalvageList({ includeEnhanced: !!opts.includeEnhanced });
      const out = [];
      for (const rel of pool) {
        if (rel.lock) continue;
        if (protect && this.relicProtectedFromDiscard(rel)) continue;
        const hitMain = unmatchedMain && !this.relicMainMatched(rel);
        const hitSubs = maxUsefulSubs != null && this.relicUsefulSubCount(rel) <= maxUsefulSubs;
        if (hitMain || hitSubs) {
          out.push(rel.uid);
          if (out.length >= RELIC.salvageCap) break;
        }
      }
      return out;
    },

    relicApplySmartDiscard(opts = {}) {
      const uids = this.relicSmartDiscardCandidates(opts);
      for (const uid of uids) {
        const rel = this.relicOf(uid);
        if (rel && !rel.lock) rel.trash = true;
      }
      return uids;
    },

    relicQuickPick(arg1 = {}, arg2 = {}) {
      const opts = Array.isArray(arg1) ? Object.assign({ list: arg1 }, arg2) : arg1;
      const pool = opts.list || this.relicSalvageList({ includeEnhanced: !!opts.includeEnhanced });
      const out = [], seen = new Set();
      if (opts.pickTrash || opts.trashOnly) {
        for (const r of pool) {
          if (!r.lock && r.trash && !seen.has(r.uid)) {
            out.push(r.uid);
            seen.add(r.uid);
            if (out.length >= RELIC.salvageCap) return out;
          }
        }
      }
      const tid = opts.tierId || (opts.maxTier === 2 ? 'q0' : opts.maxTier === 3 ? 'q5' : opts.maxTier === 4 ? 'q10' : opts.maxTier === 5 ? 'q15' : null);
      if (tid) {
        const tier = RELIC.quickTiers.find(t => t.id === tid);
        if (tier) {
          for (const r of pool) {
            if (!r.lock && !r.trash && !seen.has(r.uid) && (r.lvl || 0) <= tier.maxLvl) {
              out.push(r.uid);
              seen.add(r.uid);
              if (out.length >= RELIC.salvageCap) return out;
            }
          }
        }
      }
      return out;
    },

    relicSalvagePreview(uids) {
      this.ensureRelics();
      const seen = new Set(), list = [];
      for (const uid of (uids || [])) {
        if (seen.has(uid)) continue;
        const rel = this.relicOf(uid);
        if (!rel || !this.relicCanSalvage(rel, { includeEnhanced: true })) continue;
        seen.add(uid);
        list.push(rel);
        if (list.length >= RELIC.salvageCap) break;
      }
      const remains = list.reduce((a, r) => a + this.salvageValue(r), 0);
      const credits = list.length * RELIC.credits;
      const maxLvl = list.reduce((m, r) => Math.max(m, r.lvl || 0), 0);
      const hasTrash = list.some(r => !!r.trash);
      const items = list.length ? [
        { id: 'remains', name: H.ITEMS.remains.name, rar: 5, count: remains },
        { id: 'credits', name: 'Кредиты', rar: 3, count: credits }
      ] : [];
      return { count: list.length, list, remains, credits, items, hasEnhanced: maxLvl > 0, hasTrash, maxLvl };
    },

    relicSalvage(uids) {
      const prev = this.relicSalvagePreview(uids);
      if (!prev.count) return null;
      const drop = new Set(prev.list.map(r => r.uid));
      this.state.inv.relics = this.state.inv.relics.filter(r => !drop.has(r.uid));
      this.give({ items: { remains: prev.remains } });
      this.state.credits += prev.credits;
      return prev;
    },

    sellRelic(uid) {
      const rel = this.relicOf(uid);
      if (!rel || rel.lock || !base.sellRelic.call(this, uid)) return false;
      this.give({ items: { remains: this.salvageValue(rel) } });
      return true;
    },

    salvagePreview(maxLvl) {
      this.ensureRelics();
      const list = this.state.inv.relics.filter(r => r.lvl <= maxLvl && !r.lock && !this.relicWorn(r.uid));
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

  Object.assign(H, { RELIC_CRAFT: RELIC, SYN_MATS: Object.keys(SYN_MATS), RECIPES, RECIPE_BASE, RECIPE_SHOP, RECIPE_CHEST, RECIPE_BACK, recipeWhere, relicFix, relicMakeFilter, relicFilterEmpty });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
