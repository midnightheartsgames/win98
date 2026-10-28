(function (K) {
  'use strict';

  const STOCKS = ['food', 'cloth', 'iron', 'medicine'];
  const LIMIT = Object.freeze({ low: 0.4, high: 1.6, cheap: 0.7, dear: 2 });
  const SELL = 0.5, FRIEND_OFF = 0.9, HOSTILE = -50, FRIENDLY = 50, START_SILVER = 40;
  const DOCTOR = Object.freeze({ stop: 20, stump: 40, wounds: 10, lifePerHour: 25 });
  const FIT_HOURS = 1, OWN_SHARE = 0.25, ROOM = 6, MERC = Object.freeze({ hire: 20, day: 8, most: 3 });
  const WAIT_MOST = 4, WAKE = 6, SAFE = 30;

  const GOODS = Object.freeze({
    knife: [8, 'iron'], sickle: [14, 'iron'], sword: [60, 'iron'], axe: [40, 'iron'], mace: [45, 'iron'], spear: [35, 'iron'], bardiche: [90, 'iron'],
    bow: [50, null], crossbow: [80, 'iron'], javelin: [6, 'iron'], throwingAxe: [10, 'iron'], arrow: [1, null, 3], bolt: [1, 'iron', 3], whetstone: [3, null],
    shield: [25, 'iron'], helmCrest: [40, 'iron'], helmNasal: [55, 'iron'], helmClosed: [90, 'iron'], mail: [150, 'iron'], plate: [300, 'iron'], bracers: [30, 'iron'], greaves: [30, 'iron'], collar: [35, 'iron'],
    bandage: [4, 'medicine'], tincture: [12, 'medicine'], herbs: [6, 'medicine'], bread: [2, 'food'], meat: [3, 'food'], bearFat: [10, null], flint: [3, null], torch: [3, 'cloth'],
    crutch: [15, null], wheelchair: [140, null],
    hook: [60, 'iron'], carvedArm: [150, null], ironArm: [220, 'iron'], hingeArm: [400, 'iron'],
    peg: [50, null], willowLeg: [160, null], ironLeg: [220, 'iron'], hingeLeg: [380, 'iron'],
    baleBread: [6, 'food'], baleGrain: [5, 'food'], baleCloth: [14, 'cloth'], baleWine: [12, 'food'], baleMedicine: [20, 'medicine'], baleOre: [8, 'iron'], baleIron: [14, 'iron'],
    patch: [5, 'cloth'], glassEye: [120, null], resinEye: [90, null], rubyEye: [200, null], stakes: [4, null], snare: [3, 'cloth']
  });

  const SHOPS = Object.freeze({
    arms: { name: 'Оружейник', keeper: 'оружейник Демьян', stall: 'stall-arms', sells: ['knife', 'sickle', 'sword', 'axe', 'mace', 'spear', 'bardiche', 'bow', 'crossbow', 'javelin', 'throwingAxe', 'arrow', 'bolt', 'whetstone'], buys: ['weapon', 'ranged', 'ammo'] },
    armor: { name: 'Бронник', keeper: 'бронник Евстигней', stall: 'stall-armor', sells: ['shield', 'helmCrest', 'helmNasal', 'helmClosed', 'mail', 'plate', 'bracers', 'greaves', 'collar'], buys: ['armor'] },
    goods: { name: 'Лавка разного', keeper: 'лавочница Лукерья', stall: 'stall-goods', sells: ['bandage', 'bread', 'flint', 'torch', 'crutch', 'patch'], buys: ['goods', 'food', 'aid', 'cargo'] },
    herbs: { name: 'Травник', keeper: 'травница Аграфена', stall: 'stall-herbs', sells: ['bandage', 'tincture', 'herbs'], buys: ['goods'] },
    hides: { name: 'Скупщик шкур', keeper: 'скупщик Мокей', stall: 'stall-hides', sells: [], buys: ['hide', 'food'], full: true },
    sharnir: { name: 'Мастерская Шарнира', keeper: 'мастер Шарнир', sells: ['hook', 'hingeArm', 'glassEye', 'patch', 'peg', 'hingeLeg', 'crutch', 'wheelchair'], buys: ['prosthesis', 'aid'] },
    yasen: { name: 'Мастерская Ясеня', keeper: 'резчик Ясень', sells: ['carvedArm', 'willowLeg', 'peg', 'crutch'], buys: [] },
    ryabina: { name: 'Избушка Рябины', keeper: 'травница Рябина', sells: ['resinEye', 'patch', 'bandage', 'tincture'], buys: ['goods'] }
  });

  const PROS = Object.freeze({
    hook: { part: 'fore', kind: 'hook', gives: 'держит щит или факел; F: зацеп, отводит щит врага; лезть по верёвочной лестнице', lacks: 'оружие в этой руке' },
    carvedArm: { part: 'fore', kind: 'carved', gives: 'держит лук, лук снова доступен', lacks: 'меч и щит в этой руке' },
    ironArm: { part: 'fore', kind: 'iron', gives: 'одноручное оружие (замах на 15 % медленнее), блок клинка как малым щитом, кулак вдвое сильнее', lacks: 'плавание' },
    hingeArm: { part: 'fore', kind: 'hinge', gives: 'всё, что умеет живая рука', lacks: 'прочность: сильный рубящий удар сбивает её' },
    peg: { part: 'shin', kind: 'peg', gives: 'ходьба как у здорового, бег 3,2 м/с, прыжок 0,4 м', lacks: 'рывок; шаги громкие' },
    willowLeg: { part: 'shin', kind: 'willow', gives: 'бег как у здорового, прыжок 1,1 м, шаги тихие', lacks: 'прочность: дробящий удар ломает её' },
    ironLeg: { part: 'shin', kind: 'iron', gives: 'бег 4,2 м/с, пинок сбивает с ног', lacks: 'плавание; шаги громкие' },
    hingeLeg: { part: 'shin', kind: 'hinge', gives: 'всё, что умеет живая нога', lacks: 'ничего не отнимает' },
    patch: { part: 'eye', kind: 'patch', gives: 'закрывает пустую глазницу', lacks: 'половина экрана остаётся тёмной' },
    glassEye: { part: 'eye', kind: 'glass', gives: 'возвращает половину экрана, слегка размытую и бледную', lacks: 'чёткость' },
    resinEye: { part: 'eye', kind: 'resin', gives: 'возвращает половину экрана в янтарном оттенке, ночью светлее', lacks: 'настоящие цвета' },
    rubyEye: { part: 'eye', kind: 'ruby', gives: 'возвращает половину экрана в красном оттенке, живые на ней светятся', lacks: 'настоящие цвета' }
  });

  const SIDE_PROS = Object.freeze({
    elf: { stat: 'respect', need: 40, items: ['carvedArm', 'willowLeg', 'resinEye'], share: 0, master: 'Ясень и Рябина в Корнях' },
    guard: { stat: 'service', need: 6, items: ['hingeArm', 'hingeLeg'], share: 0.5, master: 'Шарнир по казённой грамоте' },
    villain: { stat: 'loyalty', need: 0, items: ['ironArm', 'ironLeg'], share: 0, master: 'Молот в форте' }
  });

  const ARMOR_ON = Object.freeze({ helmCrest: ['head', 'crest'], helmNasal: ['head', 'nasal'], helmClosed: ['head', 'closed'], mail: ['armor', 'mail'], plate: ['armor', 'plate'], bracers: ['armor', 'bracers'], greaves: ['armor', 'greaves'], collar: ['armor', 'collar'] });

  const state = S => {
    if (!S.econ) S.econ = { stock: { food: 1, cloth: 1, iron: 1, medicine: 1 }, homes: [], rent: null, chests: {}, ledger: { spent: 0, earned: 0 } };
    return S.econ;
  };

  const purse = bag => (bag || []).reduce((n, s) => n + (s.id === 'silver' ? s.n : 0), 0);
  const stash = (bag, id, n) => { const s = bag.find(x => x.id === id); if (s) s.n += n; else bag.push({ id, n }); };
  const drop = (bag, id, n) => {
    const stacks = bag.filter(x => x.id === id);
    if (stacks.reduce((m, s) => m + s.n, 0) < n) return false;
    let left = n;
    for (const s of stacks) {
      const k = Math.min(left, s.n);
      s.n -= k;
      left -= k;
      if (!s.n) bag.splice(bag.indexOf(s), 1);
      if (!left) break;
    }
    return true;
  };
  const pay = (S, bag, n) => { if (n <= 0) return true; if (purse(bag) < n || !drop(bag, 'silver', n)) return false; state(S).ledger.spent += n; return true; };
  const earn = (S, bag, n) => { if (n > 0) { stash(bag, 'silver', n); state(S).ledger.earned += n; } };

  const relation = S => (S.relations && S.relations.town) || 0;
  const refuses = S => relation(S) < HOSTILE;
  const factorOf = (S, stock) => !stock ? 1 : K.clamp(1 / K.clamp(state(S).stock[stock], LIMIT.low, LIMIT.high), LIMIT.cheap, LIMIT.dear);
  const factor = (S, id) => factorOf(S, GOODS[id] ? GOODS[id][1] : null);
  const round = v => Math.max(1, Math.round(v));
  const baseOf = id => GOODS[id] ? GOODS[id][0] : (K.Data.ITEMS[id] && K.Data.ITEMS[id].cost) || 0;
  const lotOf = id => GOODS[id] && GOODS[id][2] || 1;

  function price(S, id, how) {
    const base = baseOf(id);
    if (!base) return 0;
    const f = factor(S, id);
    if (how === 'sell') return round(base * f * SELL);
    if (how === 'full') return round(base * f);
    return round(base * f * (relation(S) > FRIENDLY ? FRIEND_OFF : 1));
  }

  function stockNote(S, stock) {
    const f = factorOf(S, stock);
    if (!stock || Math.abs(f - 1) < 0.1) return '';
    const x = f.toFixed(1).replace('.', ',');
    return f > 1 ? `корованы не дошли: цена ×${x}` : `запасов много: цена ×${x}`;
  }

  const buysKind = (shop, id) => { const it = K.Data.ITEMS[id]; return !!it && SHOPS[shop].buys.includes(it.kind) && id !== 'silver'; };
  const sellPrice = (S, shop, id) => SHOPS[shop].full && (K.Data.ITEMS[id].kind === 'hide' || id === 'bearFat' || id === 'meat') ? price(S, id, 'full') : price(S, id, 'sell');

  function buy(S, bag, shop, id) {
    const sh = SHOPS[shop];
    if (!sh || !sh.sells.includes(id)) return { ok: false, why: 'Здесь этого не продают' };
    if (refuses(S)) return { ok: false, why: 'С вами здесь не торгуют' };
    const cost = price(S, id, 'buy');
    if (!pay(S, bag, cost)) return { ok: false, why: `Не хватает серебра: нужно ${cost}`, price: cost };
    stash(bag, id, lotOf(id));
    return { ok: true, price: cost, n: lotOf(id) };
  }

  function sell(S, bag, shop, id) {
    if (!SHOPS[shop] || !buysKind(shop, id)) return { ok: false, why: 'Это здесь не берут' };
    if (refuses(S)) return { ok: false, why: 'С вами здесь не торгуют' };
    const lot = Math.min(lotOf(id), (bag.find(s => s.id === id) || { n: 0 }).n);
    if (!lot || !drop(bag, id, lot)) return { ok: false, why: 'Нечего продать' };
    const got = Math.max(1, Math.round(sellPrice(S, shop, id) * lot / lotOf(id)));
    earn(S, bag, got);
    return { ok: true, price: got, n: lot };
  }

  const offers = (S, bag, shop) => {
    const sh = SHOPS[shop];
    return {
      sells: sh.sells.map(id => ({ id, price: price(S, id, 'buy'), lot: lotOf(id), stock: GOODS[id] ? GOODS[id][1] : null })),
      buys: (bag || []).filter(s => buysKind(shop, s.id)).map(s => ({ id: s.id, n: s.n, price: sellPrice(S, shop, s.id), lot: lotOf(s.id) }))
    };
  };

  const LIMB_PARTS = ['lFore', 'rFore', 'lShin', 'rShin', 'lArm', 'rArm', 'lThigh', 'rThigh'];
  const stumps = kit => LIMB_PARTS.filter(p => (kit.cut || {})[p] === 'fresh' || (kit.cut || {})[p] === 'bandaged');

  function doctor(S, P, who) {
    const F = P.fight, out = [], herbs = who === 'ryabina', savva = who === 'savva', frol = who === 'frol', gone = herbs ? P.team !== 'elf' : savva ? P.team !== 'guard' : frol ? P.team !== 'villain' : refuses(S), free = herbs && P.team === 'elf' || savva && ((S.standing || {}).service || 0) >= 0;
    const bleeding = K.Wounds.bleeding(F), sore = stumps(P.kit), hurt = Math.max(0, 100 - Math.max(0, F.life));
    const hours = Math.ceil(hurt / DOCTOR.lifePerHour);
    out.push({ id: 'stop', name: 'Остановить кровь', price: round(DOCTOR.stop * factorOf(S, 'medicine')), hours: 0, can: bleeding, why: bleeding ? '' : 'кровь не идёт' });
    out.push({ id: 'stump', name: sore.length > 1 ? `Вылечить культи (${sore.length})` : 'Вылечить культю', price: round(DOCTOR.stump * sore.length * factorOf(S, 'medicine')), hours: sore.length, can: sore.length > 0, why: sore.length ? '' : 'культей для лечения нет' });
    out.push({ id: 'wounds', name: hours ? `Лечить раны (${hours} ч)` : 'Лечить раны', price: round(DOCTOR.wounds * Math.max(1, hours) * factorOf(S, 'medicine')), hours, can: hours > 0, why: hours ? '' : 'ран нет' });
    if (free) for (const o of out) o.price = 0;
    if (gone) for (const o of out) { o.can = false; o.why = herbs ? 'Рябина лечит только своих' : savva ? 'Савва лечит только стражу' : frol ? 'Фрол лечит только людей форта' : 'Аким не лечит врагов города'; }
    return out;
  }

  function treat(S, P, id, ctx, who) {
    const opt = doctor(S, P, who).find(o => o.id === id);
    if (!opt) return { ok: false, why: 'Нет такого лечения' };
    if (!opt.can) return { ok: false, why: opt.why };
    if (!pay(S, P.bag, opt.price)) return { ok: false, why: `Не хватает серебра: нужно ${opt.price}`, price: opt.price };
    const F = P.fight;
    if (id === 'stop') { F.bleed = K.Wounds.bleed(); F.stable = false; }
    if (id === 'stump') {
      const cut = Object.assign({}, P.kit.cut);
      for (const p of stumps(P.kit)) cut[p] = 'healed';
      P.kit.cut = cut;
      F.bleed = K.Wounds.bleed();
    }
    if (id === 'wounds') F.life = 100;
    pass(S, opt.hours, ctx);
    return { ok: true, price: opt.price, hours: opt.hours };
  }

  const partOf = (kit, place) => {
    if (place.startsWith('eye.')) {
      const s = place.slice(4), v = (kit.eyes || {})[s];
      return v ? { place, eye: s, kind: 'eye', free: v === true || v === 'patch', worn: v === true ? null : v } : null;
    }
    const cut = kit.cut || {}, pros = kit.pros || {}, cat = place.endsWith('Fore') ? 'fore' : place.endsWith('Shin') ? 'shin' : null;
    if (!cat) return null;
    const upper = (place[0]) + (cat === 'fore' ? 'Arm' : 'Thigh');
    if (cut[upper]) return { place, kind: cat, free: false, why: cat === 'fore' ? 'рука отнята по плечо: протез не держится' : 'нога отнята по бедро: протез не держится' };
    if (!cut[place]) return null;
    if (pros[place]) return { place, kind: cat, free: false, worn: pros[place], why: 'протез уже стоит' };
    if (cut[place] !== 'healed') return { place, kind: cat, free: false, why: 'культю сначала лечит лекарь' };
    return { place, kind: cat, free: true };
  };

  const PLACES = ['lFore', 'rFore', 'lShin', 'rShin', 'eye.l', 'eye.r'];
  const PLACE_NAME = { lFore: 'Левая рука', rFore: 'Правая рука', lShin: 'Левая нога', rShin: 'Правая нога', 'eye.l': 'Левый глаз', 'eye.r': 'Правый глаз' };
  const losses = kit => PLACES.map(p => partOf(kit, p)).filter(Boolean);

  function sideOffer(S, P, id) {
    const R = SIDE_PROS[P.team], st = S.standing || {}, built = P.team === 'elf' && S.village && S.village.upgrades.workshop;
    if (!R || !R.items.includes(id) || ((st[R.stat] || 0) < R.need && !built)) return null;
    if (P.team === 'guard' && !(P.bag || []).some(s => s.id === 'gramota')) return null;
    return { price: R.share ? round(baseOf(id) * R.share) : 0, master: R.master };
  }

  function fitOptions(S, P, place, shop) {
    const at = partOf(P.kit, place);
    if (!at) return [];
    const sold = shop ? SHOPS[shop].sells : [];
    return Object.entries(PROS).filter(([, d]) => d.part === at.kind).map(([id, d]) => {
      const own = (P.bag || []).some(s => s.id === id && s.n > 0), side = sideOffer(S, P, id), here = sold.includes(id);
      const how = own ? 'own' : side ? 'side' : here ? 'buy' : null;
      const cost = how === 'own' ? round(baseOf(id) * OWN_SHARE) : how === 'side' ? side.price : how === 'buy' ? price(S, id, 'buy') : 0;
      return { id, name: K.Data.ITEMS[id].name, gives: d.gives, lacks: d.lacks, how, price: cost, hours: d.part === 'eye' && id === 'patch' ? 0 : FIT_HOURS, can: !!how && at.free, why: !at.free ? at.why : !how ? 'у Шарнира нет' : '' };
    });
  }

  function fit(S, P, place, id, how, ctx) {
    const at = partOf(P.kit, place), d = PROS[id];
    if (!at || !d || d.part !== at.kind) return { ok: false, why: 'Этот протез сюда не подходит' };
    if (!at.free) return { ok: false, why: at.why || 'Сюда протез не поставить' };
    if (refuses(S) && how !== 'side') return { ok: false, why: 'Мастер не работает с врагами города' };
    let cost;
    if (how === 'own') { if (!(P.bag || []).some(s => s.id === id && s.n > 0)) return { ok: false, why: 'Протеза нет в суме' }; cost = round(baseOf(id) * OWN_SHARE); }
    else if (how === 'side') { const o = sideOffer(S, P, id); if (!o) return { ok: false, why: 'Своя сторона этот протез не даёт' }; cost = o.price; }
    else cost = price(S, id, 'buy');
    if (!pay(S, P.bag, cost)) return { ok: false, why: `Не хватает серебра: нужно ${cost}`, price: cost };
    if (how === 'own') drop(P.bag, id, 1);
    wear(P.kit, at, d.kind);
    const hours = d.part === 'eye' && id === 'patch' ? 0 : FIT_HOURS;
    pass(S, hours, ctx);
    return { ok: true, price: cost, hours, how };
  }

  function wear(kit, at, kind) {
    if (at.eye) kit.eyes = Object.assign({}, kit.eyes, { [at.eye]: kind });
    else {
      kit.pros = Object.assign({}, kit.pros, { [at.place]: kind });
      kit.cut = Object.assign({}, kit.cut, { [at.place]: 'healed' });
    }
  }

  function grant(S, P, place, id) {
    return fit(S, P, place, id, 'side');
  }

  function selfFit(P, id, place) {
    const d = PROS[id], at = place && partOf(P.kit, place);
    if (!d || !at || !at.free || d.part !== at.kind || d.part === 'eye' && id !== 'patch') return false;
    if (!drop(P.bag, id, 1)) return false;
    wear(P.kit, at, d.kind);
    return true;
  }

  const freeFor = (P, id) => {
    const d = PROS[id];
    if (!d) return null;
    return PLACES.find(p => { const at = partOf(P.kit, p); return at && at.free && at.kind === d.part; }) || null;
  };

  function equip(P, id) {
    const k = P.kit, F = P.fight, on = ARMOR_ON[id];
    if (on && on[0] === 'head') {
      if (!drop(P.bag, id, 1)) return null;
      const old = k.head && K.Data.HELMS[k.head];
      if (old) stash(P.bag, old, 1);
      k.head = on[1];
      return 'надето: ' + K.Data.ITEMS[id].name.toLowerCase();
    }
    if (on) {
      if (k.armor.includes(on[1])) return null;
      if (!drop(P.bag, id, 1)) return null;
      const clash = on[1] === 'mail' ? 'plate' : on[1] === 'plate' ? 'mail' : null;
      if (clash && k.armor.includes(clash)) { k.armor = k.armor.filter(a => a !== clash); stash(P.bag, clash, 1); }
      k.armor = [...k.armor, on[1]];
      return 'надето: ' + K.Data.ITEMS[id].name.toLowerCase();
    }
    const c = K.Wounds.caps(k), W = K.Data.WEAPONS[id];
    if (W && F && !F.weapon && c.weapon && (W.hands === 1 || c.twoHanded || id === 'spear')) {
      if (!drop(P.bag, id, 1)) return null;
      F.weapon = id;
      F.hand = K.Wounds.handFor(k, F.hand) || 'r';
      return 'в руке: ' + K.Data.ITEMS[id].name.toLowerCase();
    }
    if (id === 'shield' && F && !F.shield && c.shield && (!F.weapon || K.Data.WEAPONS[F.weapon].hands === 1 || F.weapon === 'spear')) {
      if (!drop(P.bag, id, 1)) return null;
      F.shield = true;
      return 'щит в руке';
    }
    return null;
  }

  function pass(S, hours, ctx) {
    if (!hours) return 0;
    const day0 = S.day || 1;
    if (ctx && ctx.W && K.World) K.World.skip(S, ctx.W, hours, ctx.rnd || Math.random);
    else {
      S.hour = (S.hour || 0) + hours;
      while (S.hour >= 24) { S.hour -= 24; S.day = (S.day || 1) + 1; }
    }
    S.version = (S.version || 0) + 1;
    return (S.day || 1) - day0;
  }

  const untilMorning = hour => { const h = WAKE - hour; return h > 0 ? h : h + 24; };

  function safe(S, P, r) {
    const R = r || SAFE;
    for (const q of S.people) {
      if (!q.fight || q.fight.down || K.AI.captive(q)) continue;
      const d = Math.hypot(q.mv.pos[0] - P.mv.pos[0], q.mv.pos[2] - P.mv.pos[2]);
      if (d < R && (q.fight.hostile === P || K.AI.enemies(q.team, P.team) && !K.Places.inTown(q.mv.pos[0], q.mv.pos[2]))) return false;
    }
    for (const b of S.beasts || []) if (b.fight && !b.fight.down && b.brain && (b.brain.state === 'hunt' || b.brain.state === 'attack') && Math.hypot(b.mv.pos[0] - P.mv.pos[0], b.mv.pos[2] - P.mv.pos[2]) < R) return false;
    return true;
  }

  function bedOf(S, bed) {
    const E = state(S);
    if (!bed) return { ok: false, why: 'Кровати нет' };
    if (bed.id === 'home') return E.homes.includes(bed.building) ? { ok: true } : { ok: false, why: 'Это не ваш дом' };
    if (bed.id === 'korni-hero') return S.player && S.player.team === 'elf' ? { ok: true } : { ok: false, why: 'Это чужой сруб' };
    if (bed.id === 'palace-hero') return S.player && S.player.team === 'guard' ? { ok: true } : { ok: false, why: 'Это койка стражника' };
    if (bed.id === 'villain-hero') return S.player && S.player.team === 'villain' ? { ok: true } : { ok: false, why: 'Это ложе хозяина форта' };
    if (bed.building === 'inn') return E.rent && E.rent.bed === bed.id && E.rent.until > S.day + S.hour / 24 ? { ok: true } : { ok: false, why: 'Комнату снимают у хозяина «Колеса»: 6 сер.' };
    return { ok: false, why: 'Это чужая кровать' };
  }

  function sleep(S, P, bed, ctx) {
    const may = bedOf(S, bed);
    if (!may.ok) return may;
    if (!safe(S, P)) return { ok: false, why: 'Рядом враги, уснуть нельзя' };
    if (K.Wounds.bleeding(P.fight)) return { ok: false, why: 'Сначала остановите кровь' };
    const hours = untilMorning(S.hour);
    pass(S, hours, ctx);
    P.fight.life = 100;
    if (P.mv.stamina !== undefined) P.mv.stamina = 100;
    return { ok: true, hours };
  }

  function wait(S, P, hours, ctx) {
    const h = K.clamp(Math.round(hours), 1, WAIT_MOST);
    if (!safe(S, P)) return { ok: false, why: 'Рядом враги, ждать нельзя' };
    pass(S, h, ctx);
    return { ok: true, hours: h };
  }

  function rent(S, bag, beds) {
    const E = state(S), now = S.day + S.hour / 24;
    if (refuses(S)) return { ok: false, why: 'Хозяин не пускает врагов города' };
    if (E.rent && E.rent.until > now) return { ok: false, why: 'Комната уже снята' };
    const bed = beds.find(b => b.building === 'inn');
    if (!bed) return { ok: false, why: 'Свободных комнат нет' };
    if (!pay(S, bag, ROOM)) return { ok: false, why: `Не хватает серебра: нужно ${ROOM}` };
    E.rent = { bed: bed.id, until: Math.floor(now) + 1 + 12 / 24 };
    return { ok: true, price: ROOM, bed };
  }

  function buyHome(S, bag, id) {
    const E = state(S), B = K.Places.BUILDINGS.find(b => b.id === id);
    if (!B || !B.price) return { ok: false, why: 'Этот дом не продаётся' };
    if (E.homes.includes(id)) return { ok: false, why: 'Дом уже ваш' };
    if (refuses(S)) return { ok: false, why: 'Город не продаёт дом врагу' };
    if (!pay(S, bag, B.price)) return { ok: false, why: `Не хватает серебра: нужно ${B.price}` };
    E.homes.push(id);
    E.chests[id] = E.chests[id] || [];
    return { ok: true, price: B.price, name: B.name };
  }

  const chestOf = (S, id) => { const E = state(S); return E.chests[id] || (E.chests[id] = []); };
  function move(from, to, id, n) {
    const s = from.find(x => x.id === id);
    if (!s) return 0;
    const k = Math.min(n || s.n, s.n);
    drop(from, id, k);
    stash(to, id, k);
    return k;
  }

  const hirePrice = S => S.world && K.World && S.player ? Math.round(MERC.hire * K.World.mercFactor(S, S.player.team)) : MERC.hire;
  const mercs = S => S.people.filter(q => q.merc && !q.merc.left);
  function hire(S, bag) {
    if (refuses(S)) return { ok: false, why: 'В «Колесе» с вами не говорят' };
    if (mercs(S).length >= MERC.most) return { ok: false, why: `Больше ${MERC.most} наёмников не нанять` };
    const cost = hirePrice(S);
    if (!pay(S, bag, cost)) return { ok: false, why: `Не хватает серебра: нужно ${cost}` };
    return { ok: true, price: cost };
  }

  function daily(S, bag) {
    const out = [];
    for (const m of mercs(S)) {
      if (m.merc.paid === undefined) m.merc.paid = m.merc.since || S.day;
      while (!m.merc.left && m.merc.paid < (S.day || 1)) {
        m.merc.paid++;
        if (pay(S, bag, MERC.day)) out.push({ kind: 'paid', who: m, price: MERC.day });
        else { m.merc.left = true; out.push({ kind: 'left', who: m }); }
      }
    }
    return out;
  }

  function setStock(S, key, v) {
    if (!STOCKS.includes(key)) return;
    state(S).stock[key] = K.clamp(v, LIMIT.low, LIMIT.high);
  }

  K.Econ = {
    STOCKS, LIMIT, GOODS, SHOPS, PROS, SIDE_PROS, DOCTOR, ROOM, MERC, FIT_HOURS, OWN_SHARE, START_SILVER, WAIT_MOST, PLACES, PLACE_NAME,
    state, purse, pay, earn, price, factor, factorOf, stockNote, buy, sell, offers, refuses, relation,
    doctor, treat, stumps, partOf, losses, fitOptions, fit, grant, sideOffer, selfFit, freeFor, equip,
    pass, untilMorning, safe, bedOf, sleep, wait, rent, buyHome, chestOf, move, mercs, hire, hirePrice, daily, setStock
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
