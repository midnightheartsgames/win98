(function (C) {
  'use strict';

  const WEAPONS = {
    knife: { name: 'Нож', slot: 'knife', melee: true, dmg: 34, rpm: 90, range: 1.8, weight: 0.3, price: 150, model: 'knife', npc: 'none', desc: 'Армейский нож. Надёжен, как рукопожатие старого друга.' },
    pm: { name: 'ПМ', slot: 'pistol', ammo: ['9x18'], mag: 8, dmg: 21, rpm: 300, spread: 0.018, recoil: 0.018, range: 40, weight: 0.73, price: 700, model: 'pm', npc: 'pistol', modes: ['single'], reload: 1.6, sound: 'pistol', desc: 'Пистолет Макарова. Старый, простой и безотказный.' },
    fort: { name: 'Форт-12', slot: 'pistol', ammo: ['9x18'], mag: 12, dmg: 23, rpm: 320, spread: 0.015, recoil: 0.016, range: 45, weight: 0.9, price: 1600, model: 'fort', npc: 'pistol', modes: ['single'], reload: 1.7, sound: 'pistol', desc: 'Украинский пистолет с магазином на 12 патронов.' },
    pb: { name: 'ПБ «Бесшумный»', slot: 'pistol', ammo: ['9x18'], mag: 8, dmg: 22, rpm: 280, spread: 0.017, recoil: 0.014, range: 38, weight: 0.97, price: 2600, model: 'pb', npc: 'pistol', modes: ['single'], reload: 1.8, silent: true, sound: 'silenced', desc: 'Пистолет с интегрированным глушителем. Выбор тех, кто не любит шума.' },
    toz: { name: 'ТОЗ-34', slot: 'rifle', ammo: ['12x70', '12x76'], mag: 2, dmg: 13, pellets: 8, rpm: 240, spread: 0.06, recoil: 0.06, range: 30, weight: 3.2, price: 2200, model: 'toz', npc: 'shotgun', modes: ['single'], reload: 2.2, sound: 'shotgun', desc: 'Двустволка вертикалка. Страшна вблизи, беспомощна вдали.' },
    chaser: { name: 'Чейзер-13', slot: 'rifle', ammo: ['12x70', '12x76'], mag: 6, dmg: 14, pellets: 8, rpm: 75, spread: 0.05, recoil: 0.055, range: 34, weight: 3.4, price: 6800, model: 'chaser', npc: 'shotgun', modes: ['single'], reload: 3.2, shellReload: true, sound: 'shotgun', desc: 'Помповое ружьё. Шесть зарядов — шесть аргументов.' },
    aksu: { name: 'АКМ-74/2У', slot: 'rifle', ammo: ['5.45'], mag: 30, dmg: 25, rpm: 650, spread: 0.022, recoil: 0.026, range: 70, weight: 2.7, price: 4500, model: 'aksu', npc: 'rifle', modes: ['auto', 'single'], reload: 2.4, sound: 'ak', desc: 'Укороченный автомат. Любимец новичков и бандитов.' },
    ak: { name: 'АКМ-74/2', slot: 'rifle', ammo: ['5.45'], mag: 30, dmg: 29, rpm: 600, spread: 0.014, recoil: 0.022, range: 110, weight: 3.6, price: 7200, model: 'ak', npc: 'rifle', modes: ['auto', 'single'], reload: 2.5, sound: 'ak', desc: 'Автомат Калашникова. Рабочая лошадка Зоны.' },
    trs: { name: 'ТРс-301', slot: 'rifle', ammo: ['5.56'], mag: 30, dmg: 31, rpm: 700, spread: 0.011, recoil: 0.018, range: 130, weight: 3.3, price: 12500, model: 'trs', npc: 'rifle', modes: ['auto', 'single'], reload: 2.3, sound: 'rifle', desc: 'Западная штурмовая винтовка. Точная и лёгкая.' },
    vintorez: { name: 'ВСС «Винторез»', slot: 'rifle', ammo: ['9x39'], mag: 10, dmg: 46, rpm: 500, spread: 0.009, recoil: 0.02, range: 140, weight: 2.6, price: 18000, model: 'vintorez', npc: 'rifle', modes: ['single', 'auto'], reload: 2.3, silent: true, zoom: 2.8, sound: 'silenced', desc: 'Бесшумная снайперская винтовка спецназа. Мечта любого сталкера.' },
    svd: { name: 'СВД', slot: 'rifle', ammo: ['7.62x54'], mag: 10, dmg: 95, rpm: 70, spread: 0.004, recoil: 0.06, range: 260, weight: 4.3, price: 16000, model: 'svd', npc: 'sniper', modes: ['single'], reload: 2.8, zoom: 4, sound: 'sniper', desc: 'Снайперская винтовка Драгунова. Бьёт насквозь, как правда.' }
  };

  const AMMO = {
    '9x18': { name: '9x18 мм', box: 20, price: 70, weight: 0.012, dmg: 1, pierce: 0.2 },
    '12x70': { name: '12x70 дробь', box: 10, price: 120, weight: 0.04, dmg: 1, pierce: 0.05 },
    '12x76': { name: '12x76 жакан', box: 10, price: 220, weight: 0.045, dmg: 6.2, pierce: 0.5, slug: true },
    '5.45': { name: '5.45x39 мм', box: 30, price: 240, weight: 0.011, dmg: 1, pierce: 0.4 },
    '5.56': { name: '5.56x45 мм', box: 30, price: 330, weight: 0.012, dmg: 1, pierce: 0.5 },
    '9x39': { name: '9x39 мм СП-5', box: 20, price: 480, weight: 0.023, dmg: 1, pierce: 0.7 },
    '7.62x54': { name: '7.62x54 мм', box: 10, price: 420, weight: 0.022, dmg: 1, pierce: 0.8 }
  };

  const OUTFITS = {
    none: { name: 'Без защиты', armor: 0, burn: 0, shock: 0, chem: 0, rad: 0, belt: 1, carry: 0, weight: 0, price: 0, sleeve: 0x4a4a40 },
    jacket: { name: 'Кожаная куртка', armor: 0.1, burn: 0.1, shock: 0.05, chem: 0.05, rad: 0.05, belt: 1, carry: 0, weight: 3, price: 1500, sleeve: 0x2a2624, desc: 'Бандитская классика. Защищает скорее от ветра, чем от пули.' },
    zarya: { name: 'Комбинезон «Заря»', armor: 0.25, burn: 0.2, shock: 0.2, chem: 0.2, rad: 0.3, belt: 2, carry: 0, weight: 5, price: 8000, sleeve: 0x5c6444, desc: 'Универсальный комбинезон сталкера. Кевларовые вставки, прорезиненная ткань.' },
    merc: { name: 'Комбинезон наёмника', armor: 0.34, burn: 0.2, shock: 0.15, chem: 0.15, rad: 0.2, belt: 2, carry: 0, weight: 6, price: 12000, sleeve: 0x48586a, desc: 'Иностранная разработка. Хорошо держит пулю, плохо — радиацию.' },
    berill: { name: 'Бронекостюм «Берилл-5М»', armor: 0.45, burn: 0.15, shock: 0.25, chem: 0.1, rad: 0.15, belt: 1, carry: 0, weight: 8, price: 19000, sleeve: 0x4e5a38, desc: 'Армейский бронекостюм. Для войны, а не для прогулок по аномалиям.' },
    seva: { name: 'Комбинезон «СЕВА»', armor: 0.3, burn: 0.5, shock: 0.5, chem: 0.6, rad: 0.75, belt: 3, carry: 0, weight: 7, price: 27000, sleeve: 0x5a6a50, desc: 'Научный комбинезон с замкнутым дыханием. Аномалии и радиация ему почти не страшны.' },
    exo: { name: 'Экзоскелет', armor: 0.62, burn: 0.3, shock: 0.3, chem: 0.3, rad: 0.3, belt: 3, carry: 40, weight: 16, price: 62000, noSprint: true, sleeve: 0x3a3e3a, desc: 'Сервоприводы и броня. Бегать в нём нельзя, зато унести можно полЗоны.' }
  };

  const DETECTORS = {
    otklik: { name: 'Детектор «Отклик»', range: 18, reveal: 4, arrow: false, map: false, price: 1200, weight: 0.3, model: 'detector_otklik', desc: 'Простейший детектор. Пищит чаще, когда артефакт рядом.' },
    medved: { name: 'Детектор «Медведь»', range: 24, reveal: 7, arrow: true, map: false, price: 6000, weight: 0.5, model: 'detector_medved', desc: 'Показывает направление на ближайший артефакт.' },
    veles: { name: 'Детектор «Велес»', range: 32, reveal: 11, arrow: true, map: true, price: 16000, weight: 0.5, model: 'detector_veles', desc: 'Научный детектор. Отображает артефакты на экране.' }
  };

  const ARTIFACTS = {
    medusa: { name: 'Медуза', price: 2400, rad: 0.25, fx: { carry: 5 }, type: 'gravity', desc: 'Образуется в гравитационных аномалиях. Облегчает ношу.' },
    stoneflower: { name: 'Каменный цветок', price: 3600, rad: 0.3, fx: { armor: 0.05, carry: 3 }, type: 'gravity', desc: 'Причудливый сросток камня. Слегка отклоняет пули.' },
    nightstar: { name: 'Ночная звезда', price: 6200, rad: 0.5, fx: { carry: 10 }, type: 'gravity', desc: 'Светится в темноте. Гравитационный артефакт высокого класса.' },
    goldfish: { name: 'Золотая рыбка', price: 11000, rad: 0.8, fx: { carry: 16 }, type: 'gravity', desc: 'Редчайший гравитационный артефакт. Мечта любого носильщика.' },
    flash: { name: 'Вспышка', price: 2300, rad: 0.25, fx: { stamina: 0.5, shock: 0.1 }, type: 'electro', desc: 'Разряжается через тело носителя, придавая сил.' },
    battery: { name: 'Батарейка', price: 3800, rad: 0.3, fx: { stamina: 0.9 }, type: 'electro', desc: 'Электростатический артефакт. Выносливость растёт на глазах.' },
    moonlight: { name: 'Лунный свет', price: 5600, rad: 0.3, fx: { shock: 0.3, stamina: 0.4 }, type: 'electro', desc: 'Мерцает голубым. Защищает от электричества.' },
    firefly: { name: 'Светляк', price: 2600, rad: 0.3, fx: { bleedHeal: 0.4, health: 0.1 }, type: 'fire', desc: 'Тёплый на ощупь. Раны под ним затягиваются.' },
    soul: { name: 'Душа', price: 9000, rad: 0.5, fx: { health: 0.6 }, type: 'fire', desc: 'Легендарный артефакт. Раны заживают почти мгновенно.' },
    meatchunk: { name: 'Ломоть мяса', price: 2200, rad: 0.25, fx: { chem: 0.2 }, type: 'chem', desc: 'Выглядит отвратительно. Защищает от химических ожогов.' },
    stoneblood: { name: 'Кровь камня', price: 2600, rad: 0.25, fx: { bleedHeal: 0.35 }, type: 'chem', desc: 'Красноватая масса. Останавливает кровотечение.' },
    bubble: { name: 'Пузырь', price: 5200, rad: -1.2, fx: {}, type: 'chem', desc: 'Выводит радиацию из организма. Бесценен в Зоне.' },
    kolobok: { name: 'Колобок', price: 7800, rad: 0.4, fx: { bleedHeal: 1.0, health: 0.25 }, type: 'chem', desc: 'Шарик из переплетённых волокон. Сильнейший кровоостанавливающий артефакт.' },
    compass: { name: 'Компас', price: 20000, rad: 0.2, fx: { compass: 1, carry: 4 }, type: 'gravity', unique: true, desc: 'Уникальный артефакт. Указывает безопасный путь сквозь аномалии.' }
  };

  const ARTIFACT_POOLS = {
    gravity: [['medusa', 10], ['stoneflower', 5], ['nightstar', 2], ['goldfish', 0.6]],
    electro: [['flash', 10], ['battery', 4], ['moonlight', 2]],
    fire: [['firefly', 10], ['soul', 1]],
    chem: [['meatchunk', 8], ['stoneblood', 8], ['bubble', 3], ['kolobok', 1]]
  };

  const CONSUMABLES = {
    medkit: { name: 'Аптечка', price: 450, weight: 0.25, icon: 'medkit', use: { health: 40, bleed: -0.6 }, desc: 'Обычная армейская аптечка. Бинт, обезболивающее, кровоостанавливающее.' },
    medkit_army: { name: 'Армейская аптечка', price: 900, weight: 0.3, icon: 'medkit2', use: { health: 65, bleed: -1 }, desc: 'Военная аптечка. Поднимет на ноги почти мертвеца.' },
    medkit_sci: { name: 'Научная аптечка', price: 1100, weight: 0.3, icon: 'medkit3', use: { health: 45, rad: -120 }, desc: 'Аптечка экологов. Лечит и выводит радионуклиды.' },
    bandage: { name: 'Бинт', price: 150, weight: 0.05, icon: 'bandage', use: { bleed: -1, health: 5 }, desc: 'Останавливает кровотечение.' },
    antirad: { name: 'Антирад', price: 380, weight: 0.05, icon: 'antirad', use: { rad: -260 }, desc: 'Препарат для вывода радиации из организма.' },
    vodka: { name: 'Водка «Казаки»', price: 120, weight: 0.5, icon: 'vodka', use: { rad: -70, drunk: 25, food: 3 }, desc: 'Народное средство от радиации. Мутит голову, но работает.' },
    bread: { name: 'Батон', price: 60, weight: 0.3, icon: 'bread', use: { food: 30 }, desc: 'Хлеб. Чёрствый, но съедобный.' },
    sausage: { name: 'Колбаса «Докторская»', price: 90, weight: 0.4, icon: 'sausage', use: { food: 35, health: 2 }, desc: 'Из чего сделана — лучше не знать.' },
    conserva: { name: 'Тушёнка', price: 140, weight: 0.4, icon: 'conserva', use: { food: 55 }, desc: 'Армейская тушёнка. Сытно.' },
    energy: { name: 'Энергетик «Нон-стоп»', price: 180, weight: 0.3, icon: 'energy', use: { stamina: 100, food: 5 }, desc: 'Бодрит. Сердце потом скажет своё слово.' }
  };

  const PARTS = {
    dog_tail: { name: 'Хвост слепого пса', price: 250, weight: 0.3 },
    flesh_eye: { name: 'Глаз плоти', price: 320, weight: 0.2 },
    boar_hoof: { name: 'Копыто кабана', price: 480, weight: 0.8 },
    bs_tentacle: { name: 'Щупальца кровососа', price: 1300, weight: 0.4 },
    chimera_claw: { name: 'Коготь химеры', price: 4200, weight: 0.8 }
  };

  const QUEST_ITEMS = {
    skat2_log: { name: 'Бортовой журнал «Скат-2»', icon: 'docs', desc: 'Обгоревший журнал бортинженера. Последние записи — о разрядах по обшивке.' },
    blackbox: { name: 'Бортовой самописец «Скат-3»', icon: 'blackbox', desc: 'Оранжевый контейнер с записями полёта. Нужен тот, кто сумеет его разговорить.' },
    tools_rough: { name: 'Инструменты для грубой работы', icon: 'tools', desc: 'Ящик с ключами, съёмниками и кувалдой. Кардан будет счастлив.' },
    tools_fine: { name: 'Инструменты для тонкой работы', icon: 'tools2', desc: 'Прецизионный набор: микрометры, паяльник, лупы.' },
    accum: { name: 'Аккумулятор', icon: 'battery', desc: 'Тяжёлая армейская батарея. Хватит, чтобы запустить передатчик.' },
    nimble_case: { name: 'Кейс Шустрого', icon: 'stash', desc: 'Запертый кейс. Внутри что-то позвякивает.' },
    looter_pda: { name: 'КПК мародёра', icon: 'pda', desc: 'КПК с последней записью: «Ящик с вертушки загнали Тесаку».' },
    noah_letter: { name: 'Записка Ноя', icon: 'docs', desc: 'Каракули отшельника. Похоже на схему безопасного прохода.' }
  };

  const GRENADES = { f1: { name: 'Граната Ф-1', price: 350, weight: 0.6, icon: 'grenade', dmg: 150, radius: 8, desc: 'Оборонительная граната. Бросайте из-за укрытия.' } };

  const ITEMS = {};
  for (const [id, w] of Object.entries(WEAPONS)) ITEMS[id] = { id, type: 'weapon', name: w.name, price: w.price, weight: w.weight, icon: w.slot === 'pistol' ? 'pistol' : (w.npc === 'shotgun' ? 'shotgun' : 'rifle'), desc: w.desc };
  for (const [id, a] of Object.entries(AMMO)) ITEMS['ammo_' + id] = { id: 'ammo_' + id, type: 'ammo', caliber: id, name: 'Патроны ' + a.name, price: a.price, weight: a.weight * a.box, icon: id.startsWith('12') ? 'ammo_shot' : 'ammo', box: a.box, desc: `Коробка на ${a.box} шт.` };
  for (const [id, o] of Object.entries(OUTFITS)) if (id !== 'none') ITEMS[id] = { id, type: 'outfit', name: o.name, price: o.price, weight: o.weight, icon: 'outfit', desc: o.desc };
  for (const [id, d] of Object.entries(DETECTORS)) ITEMS[id] = { id, type: 'detector', name: d.name, price: d.price, weight: d.weight, icon: 'detector', desc: d.desc };
  for (const [id, a] of Object.entries(ARTIFACTS)) ITEMS[id] = { id, type: 'artifact', name: a.name, price: a.price, weight: 0.5, icon: 'art_' + id, desc: a.desc };
  for (const [id, c] of Object.entries(CONSUMABLES)) ITEMS[id] = Object.assign({ id, type: 'consumable' }, c);
  for (const [id, p] of Object.entries(PARTS)) ITEMS[id] = { id, type: 'part', name: p.name, price: p.price, weight: p.weight, icon: 'part', desc: 'Часть мутанта. Учёные и торговцы платят за такие.' };
  for (const [id, q] of Object.entries(QUEST_ITEMS)) ITEMS[id] = Object.assign({ id, type: 'quest', price: 0, weight: id === 'accum' ? 6 : 0.4 }, q);
  for (const [id, g] of Object.entries(GRENADES)) ITEMS[id] = Object.assign({ id, type: 'grenade' }, g);

  const FACTIONS = {
    player: { name: 'Дегтярёв' },
    stalker: { name: 'Одиночки', color: '#d8c890' },
    bandit: { name: 'Бандиты', color: '#c09070' },
    merc: { name: 'Наёмники', color: '#90a8c8' },
    zombie: { name: 'Зомбированные', color: '#a0a080' },
    monster: { name: 'Мутанты', color: '#c07060' }
  };
  const RELATIONS = {
    stalker: { stalker: 100, bandit: 0, merc: -60, zombie: -100, monster: -100, player: 20 },
    bandit: { stalker: 0, bandit: 100, merc: 0, zombie: -100, monster: -100, player: 0 },
    merc: { stalker: -60, bandit: 0, merc: 100, zombie: -100, monster: -100, player: 0 },
    zombie: { stalker: -100, bandit: -100, merc: -100, zombie: 100, monster: 0, player: -100 },
    monster: { stalker: -100, bandit: -100, merc: -100, zombie: 0, monster: 100, player: -100 }
  };

  const NPC_TYPES = {
    novice: { title: 'Новичок', kind: 'human', faction: 'stalker', hp: 90, looks: ['loner', 'loner2'], guns: ['pm', 'toz', 'aksu'], skill: 0.35, names: 'stalker' },
    stalker: { title: 'Сталкер', kind: 'human', faction: 'stalker', hp: 110, looks: ['zarya', 'loner', 'loner2'], guns: ['aksu', 'ak', 'chaser', 'fort'], skill: 0.55, armor: 0.2, names: 'stalker' },
    veteran: { title: 'Ветеран', kind: 'human', faction: 'stalker', hp: 130, looks: ['zarya'], guns: ['ak', 'trs', 'vintorez'], skill: 0.75, armor: 0.3, names: 'stalker' },
    bandit: { title: 'Бандит', kind: 'human', faction: 'bandit', hp: 90, looks: ['bandit', 'bandit2'], guns: ['pm', 'toz', 'aksu', 'fort'], skill: 0.4, armor: 0.1, names: 'bandit' },
    merc: { title: 'Наёмник', kind: 'human', faction: 'merc', hp: 130, looks: ['merc'], guns: ['trs', 'ak', 'trs'], skill: 0.72, armor: 0.32, names: 'merc' },
    zombie: { title: 'Зомбированный', kind: 'human', faction: 'zombie', hp: 120, looks: ['zombie'], guns: ['aksu', 'pm', 'toz'], skill: 0.22, armor: 0.15, zombie: true, names: 'zombie' },
    dog: { title: 'Слепой пёс', kind: 'dog', faction: 'monster', hp: 42, speed: 6.8, melee: 9, reach: 1.4, sight: 38, part: 'dog_tail', names: 'Слепой пёс' },
    flesh: { title: 'Плоть', kind: 'flesh', faction: 'monster', hp: 80, speed: 4.2, melee: 11, reach: 1.6, sight: 26, part: 'flesh_eye', names: 'Плоть' },
    boar: { title: 'Кабан', kind: 'boar', faction: 'monster', hp: 150, speed: 7.2, melee: 22, reach: 1.9, sight: 36, part: 'boar_hoof', charge: true, names: 'Кабан' },
    bloodsucker: { title: 'Кровосос', kind: 'bloodsucker', faction: 'monster', hp: 280, speed: 6.6, melee: 17, reach: 1.7, sight: 34, part: 'bs_tentacle', invisible: true, names: 'Кровосос' },
    chimera: { title: 'Химера', kind: 'chimera', faction: 'monster', hp: 760, speed: 8.6, melee: 36, reach: 2.8, sight: 50, part: 'chimera_claw', leap: true, names: 'Химера' }
  };

  const NAMES = {
    first: ['Серёга', 'Толик', 'Витёк', 'Макс', 'Санёк', 'Лёха', 'Женя', 'Гриша', 'Вадик', 'Костя', 'Юрка', 'Паша', 'Димон', 'Стас', 'Боря', 'Игорь', 'Олег', 'Федя', 'Миша', 'Ваня'],
    last: ['Пономарь', 'Шмель', 'Лис', 'Молот', 'Сыпуха', 'Клёпа', 'Бобёр', 'Ржавый', 'Тихоня', 'Весло', 'Кнут', 'Сивый', 'Бекас', 'Шкет', 'Дрозд', 'Карась', 'Химик', 'Сом', 'Фикса', 'Клещ', 'Балагур', 'Удав', 'Сухарь'],
    bandit: ['Косой', 'Штырь', 'Жмых', 'Хмурый', 'Бес', 'Гвоздь', 'Хорёк', 'Кабан', 'Рябой', 'Мятый', 'Цыган', 'Тюбик'],
    merc: ['Бейкер', 'Хант', 'Волк', 'Спектр', 'Фантом', 'Кобра', 'Рейн', 'Гюрза', 'Шрам', 'Бинокль'],
    zombie: ['Зомбированный']
  };

  const ANOMALY_TYPES = {
    zharka: { name: 'Жарка', radius: 1.7, trigger: 1.8, dmg: 55, hit: 'burn', active: 1.3, cool: 2.8, sound: 'fire', artifacts: 'fire' },
    electra: { name: 'Электра', radius: 2.3, trigger: 2.4, dmg: 48, hit: 'shock', active: 0.5, cool: 2.4, sound: 'electro', artifacts: 'electro' },
    vortex: { name: 'Воронка', radius: 1.4, trigger: 5.0, dmg: 300, hit: 'gravity', active: 2.2, cool: 5, pull: 9, sound: 'vortex', artifacts: 'gravity' },
    springboard: { name: 'Трамплин', radius: 2.0, trigger: 2.1, dmg: 24, hit: 'gravity', active: 0.6, cool: 3, sound: 'spring', artifacts: 'gravity' },
    carousel: { name: 'Карусель', radius: 2.6, trigger: 2.8, dmg: 70, hit: 'gravity', active: 1.8, cool: 4, sound: 'vortex', artifacts: 'gravity' },
    kisel: { name: 'Кисель', radius: 2.2, trigger: 2.3, dmg: 18, hit: 'chem', continuous: true, active: 0, cool: 0, sound: 'acid', artifacts: 'chem' },
    fuzz: { name: 'Жгучий пух', radius: 2.4, trigger: 2.6, dmg: 12, hit: 'burn', continuous: true, active: 0, cool: 0, sound: 'fuzz', artifacts: 'fire' }
  };

  const FIELDS = [
    { id: 'tutorial', poi: null, x: 905, y: 690, r: 7, list: [['zharka', 1]], arts: 1, pool: 'fire', fixed: [[905, 690]], artifactAt: [897, 700], artifact: 'firefly', noRespawn: true },
    { id: 'kotel', x: 845, y: 898, r: 22, list: [['zharka', 7]], arts: 2, pool: 'fire' },
    { id: 'claw', x: 428, y: 368, r: 16, list: [['springboard', 4], ['vortex', 1], ['carousel', 1]], arts: 3, pool: 'gravity' },
    { id: 'circus', x: 522, y: 192, r: 16, list: [['carousel', 1], ['zharka', 6]], arts: 2, pool: 'fire', fixed: [[522, 192]] },
    { id: 'farmstead', x: 482, y: 812, r: 26, list: [['zharka', 7]], arts: 2, pool: 'fire', clear: [[509, 791, 7], [496, 800, 7]] },
    { id: 'scar', x: 757, y: 312, r: 10, list: [['electra', 3]], arts: 1, pool: 'electro', fixed: [[743, 272], [751, 293], [764, 328]] },
    { id: 'oakpine', x: 250, y: 393, r: 11, list: [['kisel', 6]], arts: 1, pool: 'chem', artifactAt: [251, 396], artifact: 'stoneblood' },
    { id: 'swamp', x: 150, y: 672, r: 40, list: [['kisel', 6], ['springboard', 3], ['vortex', 1]], arts: 3, pool: 'chem', clear: [[152, 690, 9]] },
    { id: 'ironforest', x: 192, y: 226, r: 34, list: [['electra', 9]], arts: 3, pool: 'electro', clear: [[154, 194, 8], [166, 246, 9], [206, 192, 7], [194, 186, 5]] },
    { id: 'plateau', x: 612, y: 158, r: 26, list: [['electra', 3], ['fuzz', 4]], arts: 2, pool: 'electro', clear: [[632, 152, 8], [586, 184, 6], [566, 128, 7]] },
    { id: 'bridge', x: 880, y: 360, r: 4, z: 8, list: [['springboard', 5], ['carousel', 1]], arts: 0, pool: 'gravity', fixed: [[881, 300], [880.6, 330], [881, 365], [880.6, 398], [881, 425], [878.6, 356]], noRespawn: true },
    { id: 'dredge', x: 866, y: 695, r: 8, list: [['springboard', 4]], arts: 2, pool: 'gravity' },
    { id: 'shevchenko', x: 562, y: 556, r: 6, list: [['zharka', 1]], arts: 1, pool: 'fire', fixedMarker: 'shev_zharka' },
    { id: 'gallery', x: 102, y: 106, r: 9, list: [['electra', 2]], arts: 1, pool: 'electro' },
    { id: 'road1', x: 233, y: 752, r: 6, list: [['electra', 1]], arts: 0, pool: 'electro' },
    { id: 'road2', x: 470, y: 272, r: 5, list: [['zharka', 1]], arts: 0, pool: 'fire' },
    { id: 'road3', x: 512, y: 360, r: 8, list: [['springboard', 2]], arts: 1, pool: 'gravity' }
  ];

  const UPGRADES = {
    weapon: [
      { id: 'w_recoil', tier: 1, name: 'Облегчённый затвор', desc: 'Отдача −25%', price: 1500, fx: { recoil: 0.75 } },
      { id: 'w_sight', tier: 1, name: 'Регулируемый целик', desc: 'Разброс −20%', price: 1800, fx: { spread: 0.8 } },
      { id: 'w_mag', tier: 2, name: 'Увеличенный магазин', desc: 'Ёмкость магазина +50%', price: 3200, fx: { mag: 1.5 } },
      { id: 'w_barrel', tier: 2, name: 'Хромированный ствол', desc: 'Урон +15%', price: 3600, fx: { dmg: 1.15 } },
      { id: 'w_rate', tier: 3, name: 'Доработка УСМ', desc: 'Скорострельность +20%', price: 4200, fx: { rpm: 1.2 } },
      { id: 'w_reliable', tier: 3, name: 'Полировка механизма', desc: 'Износ −50%, без клинов', price: 3000, fx: { wear: 0.5 } }
    ],
    outfit: [
      { id: 'o_light', tier: 1, name: 'Облегчённые вставки', desc: 'Вес −2 кг', price: 1500, fx: { weight: -2 } },
      { id: 'o_plates', tier: 1, name: 'Бронепластины', desc: 'Защита от пуль +8%', price: 2600, fx: { armor: 0.08 } },
      { id: 'o_belt', tier: 2, name: 'Контейнер для артефакта', desc: 'Слот пояса +1', price: 4000, fx: { belt: 1 } },
      { id: 'o_chem', tier: 2, name: 'Химзащитная пропитка', desc: 'Химзащита и радиозащита +15%', price: 3000, fx: { chem: 0.15, rad: 0.15 } },
      { id: 'o_carry', tier: 3, name: 'Разгрузочная система', desc: 'Переносимый вес +10 кг', price: 5000, fx: { carry: 10 } },
      { id: 'o_belt2', tier: 3, name: 'Второй контейнер', desc: 'Слот пояса +1', price: 6000, fx: { belt: 1 } }
    ]
  };

  const TRADERS = {
    beard: { name: 'Борода', buyK: 0.7, artifactK: 0.95, sellK: 1.0, stock: [['medkit', 6], ['bandage', 8], ['antirad', 6], ['vodka', 8], ['bread', 6], ['sausage', 6], ['conserva', 5], ['energy', 3], ['ammo_9x18', 8], ['ammo_12x70', 6], ['ammo_12x76', 4], ['ammo_5.45', 8], ['ammo_5.56', 3], ['f1', 4], ['otklik', 1], ['medved', 1]], buys: ['artifact', 'part', 'weapon', 'outfit', 'ammo', 'consumable', 'detector', 'grenade'] },
    owl: { name: 'Сыч', buyK: 0.55, artifactK: 1.1, sellK: 1.25, stock: [['medkit_army', 3], ['medkit_sci', 3], ['antirad', 4], ['ammo_9x39', 3], ['ammo_7.62x54', 3], ['veles', 1], ['pb', 1], ['seva', 1]], buys: ['artifact', 'part'] },
    nimble: { name: 'Шустрый', buyK: 0.6, artifactK: 0.8, sellK: 1.1, stock: [['fort', 1], ['chaser', 1], ['ak', 1], ['trs', 1], ['svd', 1], ['vintorez', 1], ['berill', 1], ['ammo_5.45', 10], ['ammo_5.56', 8], ['ammo_12x70', 6], ['ammo_12x76', 6], ['ammo_9x39', 4], ['ammo_7.62x54', 4], ['f1', 6]], buys: ['weapon', 'outfit', 'ammo'] },
    sultan: { name: 'Султан', buyK: 0.45, artifactK: 0.6, sellK: 0.9, stock: [['pm', 2], ['toz', 1], ['aksu', 1], ['jacket', 1], ['ammo_9x18', 6], ['ammo_12x70', 4], ['ammo_5.45', 5], ['vodka', 6], ['bread', 4]], buys: ['weapon', 'outfit', 'ammo', 'artifact', 'part', 'consumable', 'detector'] },
    noah: { name: 'Ной', buyK: 0.5, artifactK: 0.7, sellK: 1.0, stock: [['medkit', 3], ['bandage', 5], ['antirad', 3], ['bread', 3], ['conserva', 2]], buys: ['consumable', 'part'] }
  };

  const STASHES = [
    { id: 'st_tower', marker: 'tower_stash', name: 'Тайник у водонапорной башни', items: [['antirad', 2], ['ammo_5.45', 1], ['conserva', 1]], money: 600 },
    { id: 'st_bridge', marker: 'stash_bridge', name: 'Тайник на мостике «Скадовска»', items: [['medkit', 1], ['ammo_12x76', 1]], money: 300 },
    { id: 'st_saw', marker: 'saw_stash', name: 'Аптечки в тракторе на лесопилке', items: [['medkit', 2], ['bandage', 3], ['antirad', 1]], money: 300 },
    { id: 'st_sawoffice', marker: 'saw_office_stash', name: 'Тайник на чердаке конторы', items: [['fort', 1], ['ammo_9x18', 2], ['f1', 1], ['vodka', 1]], money: 800 },
    { id: 'st_shev', marker: 'shev_stash', name: 'Тайник в рубке «Шевченко»', items: [['medkit_army', 1], ['ammo_5.56', 2], ['stoneblood', 1]], money: 1200 },
    { id: 'st_farm', marker: 'farm_attic', name: 'Тайник на чердаке сгоревшего дома', items: [['ammo_9x39', 2], ['medkit', 1], ['vodka', 1]], money: 700 },
    { id: 'st_port', marker: 'port_stash', name: 'Тайник в домике у кранов', items: [['ammo_5.45', 2], ['medkit', 2], ['energy', 1]], money: 900 },
    { id: 'st_lair', marker: 'lair_stash', name: 'Рюкзак в логове кровососов', items: [['vintorez', 1], ['ammo_9x39', 2], ['medkit_army', 1]], money: 2500 },
    { id: 'st_noah', marker: 'noah_stash', name: 'Сундук Ноя', items: [['bread', 2], ['kolobok', 1]], money: 0, locked: 'noah_gift' },
    { id: 'st_crane', marker: 'crane_artifact', name: 'Схрон в кабине крана', items: [['nightstar', 1], ['ammo_7.62x54', 2], ['svd', 1]], money: 1500 },
    { id: 'st_forestry', marker: 'forestry_stash', name: 'Тайник «Монолита» в лесничестве', items: [['medkit_army', 2], ['ammo_5.56', 2]], money: 600 },
    { id: 'st_fuel', marker: 'fuel_roof', name: 'Тайник на крыше заправки', items: [['zarya', 1], ['vodka', 2]], money: 200 },
    { id: 'st_razlom', marker: 'razlom_stash', name: 'Тайник Коряги в разломе', items: [['antirad', 2], ['medkit', 1], ['ammo_5.45', 2]], money: 500 },
    { id: 'st_izum', marker: 'izum_stash', name: 'Тайник в столовой Изумрудного', items: [['ammo_5.56', 2], ['bandage', 3], ['bread', 1]], money: 600 },
    { id: 'st_cellar', marker: 'cellar_stash', name: 'Полки в погребе у хутора', items: [['medkit_sci', 1], ['medkit', 2], ['antirad', 2]], money: 300 },
    { id: 'st_wps', marker: 'wps_stash', name: 'Тайник в фильтровальном корпусе', items: [['ammo_7.62x54', 2], ['medkit', 1]], money: 700 },
    { id: 'st_plateau', marker: 'plateau_stash', name: 'Рюкзак в пещере на плато', items: [['ammo_5.45', 3], ['medkit_army', 1], ['f1', 2]], money: 1000 },
    { id: 'st_beton', marker: 'beton_stash', name: 'Тайник на бетонном узле', items: [['conserva', 2], ['ammo_12x76', 2]], money: 400 }
  ];

  const DIFFICULTY = [
    { name: 'Новичок', dmgTaken: 0.55, npcAcc: 0.7, prices: 0.8, emissionLethal: false },
    { name: 'Сталкер', dmgTaken: 0.85, npcAcc: 0.9, prices: 1.0, emissionLethal: true },
    { name: 'Ветеран', dmgTaken: 1.1, npcAcc: 1.05, prices: 1.2, emissionLethal: true },
    { name: 'Мастер', dmgTaken: 1.4, npcAcc: 1.2, prices: 1.4, emissionLethal: true }
  ];

  C.DATA = { WEAPONS, AMMO, OUTFITS, DETECTORS, ARTIFACTS, ARTIFACT_POOLS, CONSUMABLES, PARTS, QUEST_ITEMS, GRENADES, ITEMS, FACTIONS, RELATIONS, NPC_TYPES, NAMES, ANOMALY_TYPES, FIELDS, UPGRADES, TRADERS, STASHES, DIFFICULTY };
})(globalThis.Cop98 = globalThis.Cop98 || {});
