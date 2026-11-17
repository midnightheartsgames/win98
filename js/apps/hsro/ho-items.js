(function (HO) {
  'use strict';
  const I = o => Object.assign({ stack: 1, price: 0, sell: 0, q: 1 }, o);

  HO.BAG_SIZE = 16;
  HO.BAG_MAX = 24;
  HO.GEAR_SLOTS = ['cone', 'head', 'hands', 'body', 'feet'];
  HO.GEAR_NAMES = { cone: 'Световой конус', head: 'Голова', hands: 'Руки', body: 'Тело', feet: 'Ноги' };
  HO.QUALITY = { 1: { name: 'Хлам', col: '#9a9a9a' }, 2: { name: '2★', col: '#40d060' }, 3: { name: '3★', col: '#4a8aff' }, 4: { name: '4★', col: '#b060ff' } };
  HO.STAT_NAMES = { hp: 'НР', atk: 'Атака', def: 'Защита', crit: 'Шанс крит.' };

  HO.ITEMS = {
    medkit: I({ name: 'Аптечка', kind: 'potion', stack: 5, price: 25, sell: 6, use: { heal: 0.35, cd: 120 }, text: 'Восстанавливает 35% НР. Работает и в бою. Перезарядка 2 мин.' }),
    lunch: I({ name: 'Бизнес-ланч космической станции', kind: 'food', stack: 10, price: 12, sell: 3, use: { food: 1, dur: 18 }, text: 'Сидя восстанавливает всё НР за 18 с.' }),
    coffee: I({ name: 'Кофе', kind: 'drink', stack: 10, price: 12, sell: 3, use: { drink: 1, dur: 18 }, text: 'Сидя восстанавливает всю Силу Пути за 18 с.' }),
    scrap: I({ name: 'Обрывок обшивки', kind: 'junk', stack: 10, sell: 4, text: 'Хлам. Торговец купит.' }),
    crystal: I({ name: 'Потускневший кристалл', kind: 'junk', stack: 10, sell: 6, text: 'Хлам. Торговец купит.' }),
    fuse: I({ name: 'Сгоревший предохранитель', kind: 'junk', stack: 10, sell: 5, text: 'Хлам. Торговец купит.' }),
    shard: I({ name: 'Осколок антиматерии', kind: 'quest', stack: 10, text: 'Звенит, если поднести к уху.' }),
    pass: I({ name: 'Допуск на склад', kind: 'quest', text: 'Подпись Адлера и печать станции. Открывает люк Склада запчастей.' }),
    cargo: I({ name: 'Ящик груза судна', kind: 'quest', stack: 10, text: 'Маркировка Комиссии по облачным переправам.' }),
    head2: I({ name: 'Шлем добровольца', kind: 'gear', slot: 'head', q: 2, sell: 10, stats: { hp: 14 }, text: 'Выдаётся добровольцам станции.' }),
    hands2: I({ name: 'Перчатки добровольца', kind: 'gear', slot: 'hands', q: 2, sell: 10, stats: { atk: 3 } }),
    body2: I({ name: 'Куртка добровольца', kind: 'gear', slot: 'body', q: 2, sell: 10, stats: { def: 14, hp: 6 } }),
    feet2: I({ name: 'Ботинки добровольца', kind: 'gear', slot: 'feet', q: 2, sell: 10, stats: { def: 8, hp: 6 } }),
    cone_d2: I({ name: 'Учебный конус: Бита на удачу', kind: 'gear', slot: 'cone', path: 'destruction', q: 2, sell: 12, stats: { atk: 3, hp: 8 } }),
    cone_a2: I({ name: 'Учебный конус: Первая помощь', kind: 'gear', slot: 'cone', path: 'abundance', q: 2, sell: 12, stats: { atk: 3, hp: 8 } }),
    cone_e2: I({ name: 'Учебный конус: Черновик расчёта', kind: 'gear', slot: 'cone', path: 'erudition', q: 2, sell: 12, stats: { atk: 4 } }),
    rice: I({ name: 'Космический жареный рис', kind: 'food', stack: 10, price: 20, sell: 5, use: { food: 1, dur: 12 }, text: 'Сидя восстанавливает всё НР за 12 с.' }),
    bagx: I({ name: 'Расширение рюкзака', kind: 'key', price: 250, sell: 0, use: { bag: 8 }, text: 'Добавляет рюкзаку 8 ячеек. Действует один раз.' }),
    pocket_anchor: I({ name: 'Карманный якорь', kind: 'key', use: { recall: 1800 }, text: 'Возвращает к Якорю пространства, к которому привязан. Перезарядка 30 мин.' }),
    shift_coffee: I({ name: 'Кофе для смены', kind: 'quest', stack: 10, text: 'Ещё горячий. Эмили просила не пить по дороге.' }),
    thread: I({ name: 'Нить мнимой материи', kind: 'quest', stack: 10, text: 'Светится и не рвётся.' }),
    cipher_key: I({ name: 'Ключ шифрования', kind: 'quest', text: 'Открывает лифт на второй этаж Зоны хранения.' }),
    pistol: I({ name: 'Оценивающий пистолет', kind: 'quest', use: { scan: 30 }, text: 'Наведите на врага и нажмите: пистолет запишет, кто это.' }),
    letter: I({ name: 'Письмо Герты', kind: 'quest', text: 'Короткое. Подпись больше текста.' }),
    head3: I({ name: 'Шлем охраны станции', kind: 'gear', slot: 'head', q: 3, sell: 30, stats: { hp: 40 } }),
    hands3: I({ name: 'Перчатки охраны станции', kind: 'gear', slot: 'hands', q: 3, sell: 30, stats: { atk: 8 } }),
    body3: I({ name: 'Куртка охраны станции', kind: 'gear', slot: 'body', q: 3, sell: 30, stats: { def: 40, hp: 16 } }),
    feet3: I({ name: 'Ботинки охраны станции', kind: 'gear', slot: 'feet', q: 3, sell: 30, stats: { def: 24, hp: 16 } }),
    cone_d3: I({ name: 'Падение небес', kind: 'gear', slot: 'cone', path: 'destruction', q: 3, sell: 40, stats: { atk: 8, hp: 20 }, text: 'Световой конус 3★ Пути Разрушения.' }),
    cone_a3: I({ name: 'Рог изобилия', kind: 'gear', slot: 'cone', path: 'abundance', q: 3, sell: 40, stats: { atk: 7, hp: 28 }, text: 'Световой конус 3★ Пути Изобилия.' }),
    cone_e3: I({ name: 'База данных', kind: 'gear', slot: 'cone', path: 'erudition', q: 3, sell: 40, stats: { atk: 10 }, text: 'Световой конус 3★ Пути Эрудиции.' }),
    sample: I({ name: 'Образец питательной среды', kind: 'quest', stack: 10, text: 'Тёплый. Слегка шевелится, если долго смотреть.' }),
    serum: I({ name: 'Сыворотка из Фармацевтического кабинета', kind: 'quest', stack: 10, text: 'На этикетке почерк Жуань Мэй. Аккуратный.' }),
    record: I({ name: 'Запись Жуань Мэй', kind: 'quest', stack: 10, text: 'Кристалл с данными. Подписан цветком.' }),
    head3s: I({ name: 'Маска лаборатории Жуань Мэй', kind: 'gear', slot: 'head', q: 3, sell: 36, stats: { hp: 52 } }),
    hands3s: I({ name: 'Перчатки лаборатории Жуань Мэй', kind: 'gear', slot: 'hands', q: 3, sell: 36, stats: { atk: 11 } }),
    body3s: I({ name: 'Халат лаборатории Жуань Мэй', kind: 'gear', slot: 'body', q: 3, sell: 36, stats: { def: 52, hp: 22 } }),
    feet3s: I({ name: 'Ботинки лаборатории Жуань Мэй', kind: 'gear', slot: 'feet', q: 3, sell: 36, stats: { def: 32, hp: 22 } }),
    rel3_head: I({ name: 'Фетровая шляпа стрелка с колоском пшеницы', kind: 'gear', slot: 'head', set: 'musketeer', q: 3, sell: 40, stats: { hp: 56 } }),
    rel3_hands: I({ name: 'Перчатки стрелка из грубой кожи', kind: 'gear', slot: 'hands', set: 'musketeer', q: 3, sell: 40, stats: { atk: 12 } }),
    rel3_body: I({ name: 'Ветрозащитная накидка стрелка', kind: 'gear', slot: 'body', set: 'musketeer', q: 3, sell: 40, stats: { def: 54, hp: 24 } }),
    rel3_feet: I({ name: 'Сапоги стрелка с заклёпками', kind: 'gear', slot: 'feet', set: 'musketeer', q: 3, sell: 40, stats: { def: 34, hp: 24 } }),
    rel4_head: I({ name: 'Фетровая шляпа стрелка с колоском пшеницы', kind: 'gear', slot: 'head', set: 'musketeer', q: 4, sell: 70, stats: { hp: 72 } }),
    rel4_hands: I({ name: 'Перчатки стрелка из грубой кожи', kind: 'gear', slot: 'hands', set: 'musketeer', q: 4, sell: 70, stats: { atk: 15 } }),
    rel4_body: I({ name: 'Ветрозащитная накидка стрелка', kind: 'gear', slot: 'body', set: 'musketeer', q: 4, sell: 70, stats: { def: 66, hp: 30 } }),
    rel4_feet: I({ name: 'Сапоги стрелка с заклёпками', kind: 'gear', slot: 'feet', set: 'musketeer', q: 4, sell: 70, stats: { def: 42, hp: 30 } }),
    cone_d4: I({ name: 'Под голубым небом', kind: 'gear', slot: 'cone', path: 'destruction', q: 4, sell: 80, stats: { atk: 13, hp: 30 }, text: 'Световой конус 4★ Пути Разрушения.' }),
    cone_a4: I({ name: 'Беседа после операции', kind: 'gear', slot: 'cone', path: 'abundance', q: 4, sell: 80, stats: { atk: 11, hp: 42 }, text: 'Световой конус 4★ Пути Изобилия.' }),
    cone_e4: I({ name: 'Отдых гениев', kind: 'gear', slot: 'cone', path: 'erudition', q: 4, sell: 80, stats: { atk: 16 }, text: 'Световой конус 4★ Пути Эрудиции.' })
  };
  HO.SETS = { musketeer: { name: 'Стрелок дикой пшеницы', two: { atkP: 0.12 }, text: '2 предмета: Атака +12%' } };
  HO.setBonus = function (sheet, key) {
    let v = 0;
    for (const id of Object.keys(HO.SETS)) {
      const n = HO.GEAR_SLOTS.filter(s => sheet.gear[s] && sheet.gear[s].dur !== 0 && HO.ITEMS[sheet.gear[s].id].set === id).length;
      if (n >= 2) v += HO.SETS[id].two[key] || 0;
    }
    return v;
  };
  HO.ITEM_IDS = Object.keys(HO.ITEMS);
  HO.PATH_CONE = { destruction: 'cone_d2', abundance: 'cone_a2', erudition: 'cone_e2' };
  HO.PATH_CONE3 = { destruction: 'cone_d3', abundance: 'cone_a3', erudition: 'cone_e3' };
  HO.PATH_CONE4 = { destruction: 'cone_d4', abundance: 'cone_a4', erudition: 'cone_e4' };
  HO.REPAIR_BASE = q => 8 * q;
  HO.repairCost = function (sheet) {
    let c = 0;
    for (const slot of HO.GEAR_SLOTS) {
      const g = sheet.gear[slot];
      if (g && g.dur < 100) c += Math.ceil((100 - g.dur) / 100 * HO.REPAIR_BASE(HO.ITEMS[g.id].q));
    }
    return c;
  };

  HO.LOOT = {
    baryon: { credits: 1, junk: [['scrap', 0.45], ['crystal', 0.2]] },
    antibaryon: { credits: 1, junk: [['crystal', 0.35], ['fuse', 0.3]], quest: [['shard', 0.6]] },
    reaver: { credits: 1.2, junk: [['scrap', 0.5], ['fuse', 0.3]] },
    eliminator: { credits: 1.2, junk: [['fuse', 0.5]] },
    distorter: { credits: 1.2, junk: [['crystal', 0.5]] },
    weaver: { credits: 1.2, junk: [['crystal', 0.5]], quest: [['thread', 0.7]] },
    trampler: { credits: 1, junk: [['scrap', 1], ['crystal', 0.6]], gear: [['head2', 0.2], ['feet2', 0.2]] },
    flamespawn: { credits: 1, junk: [['fuse', 0.45]] },
    trotter: { credits: 8, junk: [] },
    juvsting: { credits: 1.2, junk: [['crystal', 0.45], ['fuse', 0.25]] },
    gnawsting: { credits: 1.3, junk: [['crystal', 0.5], ['scrap', 0.3]], quest: [['sample', 0.6]] },
    gnawsting_e: { credits: 1.5, junk: [['crystal', 1], ['scrap', 0.6]], gear: [['rel3_hands', 0.25], ['rel3_feet', 0.25]] },
    warden: { credits: 1.5, junk: [['fuse', 1]], gear: [['rel3_head', 0.5], ['rel3_body', 0.5]] },
    culture: { credits: 1.5, junk: [['crystal', 1]], gear: [['rel3_hands', 0.5], ['rel3_feet', 0.5]] },
    doomsday: { credits: 2, junk: [] },
    skaracabaz: { credits: 2, junk: [], gear: [['rel4_head', 0.25], ['rel4_hands', 0.25], ['rel4_body', 0.25], ['rel4_feet', 0.25]], pathGear: [['cone4', 0.5]] }
  };

  HO.buyPrice = (sheet, id) => Math.max(1, Math.round(HO.ITEMS[id].price * (sheet.race === 'human' ? 0.9 : 1)));
  HO.sellPrice = id => HO.ITEMS[id].sell || 0;

  HO.bagCount = (sheet, id) => sheet.bag.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0);
  HO.bagFree = sheet => sheet.bag.filter(s => !s).length;

  HO.bagAdd = function (sheet, id, n) {
    const it = HO.ITEMS[id];
    let left = n;
    for (const s of sheet.bag) {
      if (!left) break;
      if (s && s.id === id && s.n < it.stack) { const k = Math.min(left, it.stack - s.n); s.n += k; left -= k; }
    }
    for (let i = 0; i < sheet.bag.length && left; i++) {
      if (sheet.bag[i]) continue;
      const k = Math.min(left, it.stack);
      sheet.bag[i] = it.kind === 'gear' ? { id, n: k, dur: 100 } : { id, n: k };
      left -= k;
    }
    return n - left;
  };

  HO.bagRemove = function (sheet, id, n) {
    let left = n;
    for (let i = sheet.bag.length - 1; i >= 0 && left; i--) {
      const s = sheet.bag[i];
      if (!s || s.id !== id) continue;
      const k = Math.min(left, s.n);
      s.n -= k;
      left -= k;
      if (!s.n) sheet.bag[i] = null;
    }
    return n - left;
  };

  HO.gearStat = function (sheet, key) {
    let v = 0;
    for (const slot of HO.GEAR_SLOTS) {
      const g = sheet.gear[slot];
      if (g && g.dur !== 0 && HO.ITEMS[g.id].stats[key]) v += HO.ITEMS[g.id].stats[key];
    }
    return v;
  };

  HO.canEquip = (sheet, id) => {
    const it = HO.ITEMS[id];
    return !!it && it.kind === 'gear' && (!it.path || it.path === sheet.path);
  };

  HO.normSheet = function (s) {
    s.bagSize = s.bagSize === HO.BAG_MAX ? s.bagSize : HO.BAG_SIZE;
    if (!Array.isArray(s.bag) || s.bag.length !== s.bagSize) s.bag = Array.from({ length: s.bagSize }, (_, i) => (Array.isArray(s.bag) && s.bag[i]) || null);
    s.bag = s.bag.map(x => (x && HO.ITEMS[x.id] && x.n > 0 ? x : null));
    s.gear = s.gear && typeof s.gear === 'object' ? s.gear : {};
    for (const slot of HO.GEAR_SLOTS) {
      if (!s.gear[slot] || !HO.ITEMS[s.gear[slot].id]) s.gear[slot] = null;
      else if (!(s.gear[slot].dur >= 0)) s.gear[slot].dur = 100;
    }
    s.quests = s.quests && typeof s.quests === 'object' ? s.quests : {};
    s.done = s.done && typeof s.done === 'object' ? s.done : {};
    s.buyback = Array.isArray(s.buyback) ? s.buyback.filter(x => x && HO.ITEMS[x.id]) : [];
    s.at = s.at && HO.ZONES[s.at.zone] ? s.at : null;
    s.cds = s.cds && typeof s.cds === 'object' ? s.cds : {};
    s.anchors = s.anchors && typeof s.anchors === 'object' ? s.anchors : {};
    s.bind = s.bind && HO.ANCHORS && HO.ANCHORS[s.bind] ? s.bind : null;
    s.clock = s.clock >= 0 ? s.clock : 0;
    s.recallAt = s.recallAt >= 0 ? s.recallAt : 0;
    s.rested = s.rested >= 0 ? s.rested : 0;
    s.chestDay = Number.isInteger(s.chestDay) ? s.chestDay : -1;
    s.echoDay = Number.isInteger(s.echoDay) ? s.echoDay : -1;
    s.echoWin = s.echoWin ? 1 : 0;
    s.title = typeof s.title === 'string' ? s.title.slice(0, 40) : '';
    s.trace = HO.TRACES && HO.TRACES[s.path] && HO.TRACES[s.path].some(t => t.id === s.trace) ? s.trace : '';
    return s;
  };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
