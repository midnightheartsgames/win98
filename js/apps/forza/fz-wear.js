(function (F) {
  'use strict';

  const SLOTS = [['head', 'Головной убор'], ['eyes', 'Очки'], ['top', 'Верх'], ['outer', 'Куртка'], ['legs', 'Низ'], ['feet', 'Обувь'], ['hands', 'Перчатки'], ['neck', 'Шея'], ['wrist', 'Запястье']];
  const BAND_COLS = F.EV.BANDS.map(b => b.col);
  const it = (slot, id, name, price, kind, cols, o = {}) => Object.assign({ slot, id, name, price, kind, cols, band: 0, reward: null, print: null }, o);
  const ITEMS = [
    it('head', 'cap_horizon', 'Кепка Horizon Rīga', 1500, 'cap', ['#e6146e', '#1a1a1e', '#f4f4f0'], { print: 'HORIZON' }),
    it('head', 'cap_vetra', 'Кепка VĒTRA', 2500, 'cap', ['#1a1a1e'], { band: 1, print: 'VĒTRA' }),
    it('head', 'cap_riga800', 'Кепка «Rīgai 800»', 3000, 'cap', ['#8a1e2e', '#f0ead8'], { print: 'RĪGAI 800' }),
    it('head', 'beanie', 'Вязаная шапка', 1200, 'beanie', ['#2a2a30', '#8a1e2e', '#2a4a8a', '#c8b890', '#3a5a3a']),
    it('head', 'bandana', 'Бандана', 900, 'bandana', ['#b81e1e', '#1a2a6a', '#1a1a1e']),
    it('head', 'panama', 'Панама', 1800, 'panama', ['#e8e0c8', '#6a7a4a', '#2a3a5a']),
    it('head', 'helmet_open', 'Открытый шлем Horizon', null, 'helmetOpen', ['#f4f4f0'], { reward: 'band:3', print: 'HORIZON' }),
    it('head', 'helmet_full', 'Шлем-интеграл «Чемпион»', null, 'helmetFull', ['#ffc81e'], { reward: 'finale', print: 'ČEMPIONS' }),
    it('head', 'helmet_50s', 'Кожаный шлем 1950-х', null, 'leatherCap', ['#6a3e22'], { reward: 'barn:p356' }),
    it('head', 'cap_chauffeur', 'Кепка шофёра «Чайки»', null, 'peaked', ['#1c1e26'], { reward: 'barn:gaz14' }),
    it('eyes', 'drops', 'Капли', 2500, 'aviator', ['#c8a050', '#b8bcc0']),
    it('eyes', 'sport_zibens', 'Спортивные ZIBENS', 4000, 'sport', ['#ffd400'], { band: 2 }),
    it('eyes', 'round', 'Круглые', 2000, 'round', ['#1a1a1e', '#c8a050']),
    it('eyes', 'horn', 'Роговая оправа', 1500, 'horn', ['#3a2418', '#1a1a1e']),
    it('eyes', 'yellow', 'Жёлтые противотуманные', 3500, 'yellow', ['#1a1a1e']),
    it('eyes', 'mirror', 'Зеркальные', 6000, 'mirror', ['#b8bcc0', '#c8a050'], { band: 3 }),
    it('eyes', 'goggles50', 'Гоночные очки 1950-х', null, 'goggles', ['#6a3e22'], { reward: 'barn:m300sl' }),
    it('top', 'tee', 'Футболка', 0, 'tee', ['#f4f2ec', '#1a1a1e', '#3a5a9a', '#b81e1e', '#3a6a3a', '#e8c020']),
    it('top', 'tank', 'Майка', 0, 'tank', ['#f4f2ec', '#1a1a1e', '#8a8a8a']),
    it('top', 'polo', 'Поло', 1500, 'polo', ['#f4f2ec', '#1a2a5a', '#2a6a3a', '#e6146e']),
    it('top', 'plaid', 'Рубашка в клетку', 2000, 'plaid', ['#b81e1e', '#2a4a8a', '#3a5a3a']),
    it('top', 'jurmala', 'Рубашка «Юрмала» с пальмами', 3500, 'palms', ['#3aa0c8', '#e8c020', '#f4f2ec'], { band: 1 }),
    it('top', 'turtle', 'Водолазка', 2500, 'turtle', ['#1a1a1e', '#f0ead8', '#5a2a3a']),
    it('top', 'deer', 'Свитер с оленями', 3000, 'deer', ['#8a1e2e', '#1a2a5a', '#3a5a3a']),
    it('top', 'hoodie', 'Худи', 3000, 'hoodie', ['#8a8a8a', '#1a1a1e', '#2a4a8a', '#e6146e']),
    it('top', 'tee_cola', 'Футболка BALTIC COLA', 2000, 'tee', ['#c81e28'], { print: 'BALTIC COLA' }),
    it('top', 'tee_rigafm', 'Футболка RĪGA FM 101.5', 2000, 'tee', ['#1a1a1e'], { print: 'RĪGA FM' }),
    it('top', 'tee_ambernet', 'Футболка AMBERNET', 2500, 'tee', ['#e8a020'], { band: 2, print: 'AMBERNET' }),
    it('top', 'tee_band', 'Футболка браслета', null, 'tee', BAND_COLS, { reward: 'band', print: 'HORIZON' }),
    it('top', 'suit_vetra', 'Комбинезон VĒTRA', 60000, 'suit', ['#1a1a1e'], { band: 5, print: 'VĒTRA' }),
    it('top', 'suit_horizon', 'Комбинезон Horizon', null, 'suit', ['#e6146e'], { reward: 'stunts', print: 'HORIZON' }),
    it('top', 'suit_raf', 'Рабочий комбинезон РАФ', null, 'suit', ['#2a4a8a'], { reward: 'barn:raf2203', print: 'RAF' }),
    it('outer', 'olymp', 'Олимпийка с лампасами', 4000, 'olymp', ['#1a2a6a', '#b81e1e', '#1a1a1e']),
    it('outer', 'denim', 'Джинсовка', 5000, 'denim', ['#4a6a9a', '#2a3a5a']),
    it('outer', 'windbreaker', 'Ветровка', 3500, 'windbreaker', ['#6a2a8a', '#2a8a8a', '#e8c020']),
    it('outer', 'leather', 'Кожанка', 12000, 'leather', ['#1a1a1e', '#4a2a18'], { band: 2 }),
    it('outer', 'bomber', 'Бомбер', 9000, 'bomber', ['#3a4a2a', '#1a1a1e', '#1a2a4a'], { band: 1 }),
    it('outer', 'dzintars', 'Куртка DZINTARS MOBILE', 8000, 'windbreaker', ['#1a5ab0'], { band: 3, print: 'DZINTARS' }),
    it('outer', 'blazer', 'Малиновый пиджак', 45000, 'blazer', ['#b0103a'], { band: 4 }),
    it('outer', 'race_jacket', 'Гоночная куртка Horizon', 30000, 'racing', ['#1a1a1e', '#f4f4f0'], { band: 4, print: 'HORIZON' }),
    it('outer', 'photo_vest', 'Жилет фотографа', null, 'vest', ['#7a7050'], { reward: 'photo' }),
    it('outer', 'champ', 'Куртка «Чемпион Horizon Rīga»', null, 'racing', ['#ffc81e'], { reward: 'finale', print: 'ČEMPIONS' }),
    it('outer', 'gaz_leather', 'Кожаная куртка шофёра ГАЗ', null, 'leather', ['#3a2418'], { reward: 'barn:gaz21' }),
    it('legs', 'jeans', 'Джинсы', 0, 'jeans', ['#3a5478', '#1e2a3e', '#7a8ea8']),
    it('legs', 'track', 'Спортивные штаны с лампасами', 2000, 'track', ['#1a2a6a', '#1a1a1e']),
    it('legs', 'cargo', 'Карго', 2500, 'cargo', ['#6a6a4a', '#3a3a3a']),
    it('legs', 'shorts', 'Шорты', 1500, 'shorts', ['#c8b890', '#3a5478']),
    it('legs', 'trousers', 'Брюки', 3000, 'trousers', ['#2a2a30', '#5a4a3a', '#8a8a8a']),
    it('legs', 'skirt', 'Юбка', 2500, 'skirt', ['#1a1a1e', '#8a1e2e', '#3a5478']),
    it('legs', 'leather_pants', 'Кожаные брюки', 9000, 'leatherPants', ['#1a1a1e'], { band: 3 }),
    it('feet', 'kedy', 'Кеды', 0, 'kedy', ['#f4f2ec', '#1a1a1e', '#b81e1e']),
    it('feet', 'sneakers', 'Кроссовки', 2500, 'sneakers', ['#f4f2ec', '#2a4a8a']),
    it('feet', 'boots', 'Ботинки', 3500, 'boots', ['#3a2418', '#1a1a1e']),
    it('feet', 'moccasins', 'Мокасины для вождения', 5000, 'moccasins', ['#6a3e22', '#1a1a1e'], { band: 2 }),
    it('feet', 'race_boots', 'Гоночные ботинки', 12000, 'raceBoots', ['#1a1a1e', '#b81e1e'], { band: 4 }),
    it('hands', 'gloves_cut', 'Водительские с вырезами', 3000, 'cut', ['#6a3e22', '#1a1a1e']),
    it('hands', 'mitts', 'Митенки', 1500, 'mitts', ['#1a1a1e', '#8a8a8a']),
    it('hands', 'race_gloves', 'Гоночные', 10000, 'race', ['#1a1a1e', '#b81e1e'], { band: 3 }),
    it('hands', 'drift_gloves', 'Перчатки «Король дрифта»', null, 'race', ['#e6146e'], { reward: 'drift' }),
    it('neck', 'chain', 'Цепочка', 2000, 'chain', ['#d8b450', '#c8ccd0']),
    it('neck', 'tag', 'Жетон', 1500, 'tag', ['#c8ccd0']),
    it('neck', 'scarf', 'Шарф Horizon', 2500, 'scarf', ['#e6146e']),
    it('neck', 'amber', 'Янтарные бусы', 6000, 'beads', ['#e0901a']),
    it('neck', 'phones', 'Наушники плеера на шее', 3000, 'phones', ['#1a1a1e', '#c8ccd0'], { band: 1 }),
    it('neck', 'badge_pobeda', 'Значок «Победа»', null, 'pin', ['#b81e1e'], { reward: 'barn:gazm20' }),
    it('wrist', 'digital', 'Электронные часы', 1500, 'watch', ['#1a1a1e', '#c8ccd0']),
    it('wrist', 'steel', 'Стальные часы', 8000, 'watch', ['#c8ccd0', '#d8b450'], { band: 2 }),
    it('wrist', 'amber_bracelet', 'Янтарный браслет', 4000, 'bracelet', ['#e0901a']),
    it('band', 'band', 'Браслет фестиваля', 0, 'band', BAND_COLS)
  ];
  const ITEM = {};
  for (const x of ITEMS) ITEM[x.id] = x;
  const STARTER = ['tee', 'tank', 'jeans', 'kedy', 'band'];
  const DEFAULT_FIT = { top: ['tee', 0], legs: ['jeans', 0], feet: ['kedy', 0], band: true };
  function normFit(fit) {
    fit = fit || DEFAULT_FIT;
    const out = { band: fit.band !== false };
    for (const [slot] of SLOTS) {
      const v = fit[slot], x = Array.isArray(v) && ITEM[v[0]];
      out[slot] = x && x.slot === slot ? { item: x, ci: Number.isInteger(v[1]) && v[1] >= 0 && v[1] < x.cols.length ? v[1] : 0 } : null;
      if (out[slot]) out[slot].col = x.cols[out[slot].ci];
    }
    if (!out.top) out.top = { item: ITEM.tee, ci: 0, col: ITEM.tee.cols[0] };
    if (out.top.item.kind === 'suit') { out.outer = null; out.legs = null; }
    else if (!out.legs) out.legs = { item: ITEM.jeans, ci: 0, col: ITEM.jeans.cols[0] };
    if (!out.feet) out.feet = { item: ITEM.kedy, ci: 0, col: ITEM.kedy.cols[0] };
    if (out.head && out.head.item.kind === 'helmetFull') out.eyes = null;
    return out;
  }

  function fitList(fit) {
    const f = normFit(fit), out = {};
    for (const [slot] of SLOTS) out[slot] = f[slot] ? [f[slot].item.id, f[slot].ci] : null;
    out.band = f.band;
    return out;
  }
  const fitKey = fit => SLOTS.map(([s]) => (fit[s] ? fit[s].join(':') : '-')).join(',') + (fit.band ? '+' : '');

  const REWARD_TEXT = {
    band: 'Получите зелёный браслет', 'band:3': 'Получите оранжевый браслет', finale: 'Выиграйте финал Horizon Rīga',
    stunts: 'Все трюки PR на три звезды', drift: 'Все дрифт-зоны на три звезды', photo: 'Фотоохота: снимите все места'
  };

  function rewardText(reward) {
    if (REWARD_TEXT[reward]) return REWARD_TEXT[reward];
    const car = reward && reward.startsWith('barn:') && F.Cars.get(reward.slice(5));
    return car ? `Найдите ${car.make} ${car.model} в сарае` : '';
  }

  function earned(reward, p) {
    const E = F.EV;
    if (reward === 'band') return p.band >= 1;
    if (reward && reward.startsWith('band:')) return p.band >= +reward.slice(5);
    if (reward === 'finale') return !!p.finale;
    if (reward === 'photo') return !!p.photoAll;
    if (reward === 'stunts') return E.STUNTS.every(s => (p.stunts[s.id] || 0) >= s.stars[2]);
    if (reward === 'drift') return E.STUNTS.filter(s => s.kind === 'drift').every(s => (p.stunts[s.id] || 0) >= s.stars[2]);
    if (reward && reward.startsWith('barn:')) { const b = E.BARNS.find(x => x.car === reward.slice(5)); return !!b && p.barns.includes(b.id); }
    return false;
  }

  function colours(item, p) { return item.id === 'tee_band' ? Math.min(item.cols.length, (p.band | 0) + 1) : item.cols.length; }

  function shopState(item, p) {
    if (p.wardrobe.includes(item.id)) return 'owned';
    if (item.price === null) return 'reward';
    if (item.band > p.band) return 'locked';
    return p.credits < item.price ? 'poor' : 'ok';
  }

  function giftFor(p, seed) {
    const list = ITEMS.filter(x => x.price > 0 && x.band <= p.band && !p.wardrobe.includes(x.id));
    if (!list.length) return null;
    return list[F.rng(seed >>> 0)() * list.length | 0];
  }

  F.Wear = { SLOTS, BAND_COLS, ITEMS, ITEM, STARTER, DEFAULT_FIT, normFit, fitList, fitKey, rewardText, earned, colours, shopState, giftFor, GIFT_EVERY: 5 };
})(globalThis.Forza = globalThis.Forza || {});
