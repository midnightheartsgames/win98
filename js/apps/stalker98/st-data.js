/**
 * S.T.A.L.K.E.R. 98 — static tables: items (weapons, ammo, meds, food, suits, artifacts, mutant parts, quest items),
 * factions and relations, human and mutant archetypes, anomalies, difficulty, ranks, names and interface strings.
 */
(function (S) {
  'use strict';
  const T = (ru, en) => ({ ru, en: en || ru });

  // ---------------------------------------------------------------- items
  // kind: weapon | ammo | grenade | med | food | suit | art | part | quest | misc
  const ITEMS = {
    // --- weapons. dmg per bullet (hp), rpm, spread/aim in degrees, recoil in degrees per shot, wear per shot
    knife: { kind: 'weapon', slot: 'knife', name: T('Нож', 'Knife'), desc: T('Обычный армейский нож. Выручит, когда кончатся патроны, и пригодится, чтобы отрезать хвост у слепого пса.', 'A plain army knife. Handy when the ammo runs out, and for cutting the tail off a blind dog.'), w: 0.5, cost: 100, dmg: 30, rate: 0.55, range: 1.9, icon: 'knife', sound: 'knife' },
    pm: { kind: 'weapon', slot: 'pistol', name: T('ПМм', 'PMm pistol'), desc: T('Модернизированный пистолет Макарова. Дешёвый и надёжный, но слабый против брони.', 'Upgraded Makarov pistol. Cheap and reliable, weak against armour.'), w: 0.8, cost: 800, ammo: ['9x18'], mag: 8, dmg: 26, rpm: 320, spread: 2.2, aim: 0.8, recoil: 1.6, wear: 0.0012, reload: 1.7, modes: ['1'], icon: 'pistol', sound: 'pm', view: 'pm', hit: 1 },
    fort: { kind: 'weapon', slot: 'pistol', name: T('Форт-12', 'Fort-12'), desc: T('Украинский служебный пистолет с магазином на 12 патронов 9х18.', 'Ukrainian service pistol, 12 rounds of 9x18.'), w: 0.9, cost: 1500, ammo: ['9x18'], mag: 12, dmg: 28, rpm: 340, spread: 1.9, aim: 0.6, recoil: 1.4, wear: 0.001, reload: 1.8, modes: ['1'], icon: 'pistol2', sound: 'pm', view: 'fort', hit: 1 },
    obrez: { kind: 'weapon', slot: 'rifle', name: T('Обрез БМ-16', 'BM-16 sawn-off'), desc: T('Двустволка с отпиленными стволами. На короткой дистанции разносит всё.', 'A double-barrel with the barrels cut off. Devastating up close.'), w: 2.2, cost: 1100, ammo: ['12x70'], mag: 2, dmg: 13, pellets: 9, rpm: 300, spread: 6, aim: 4.5, recoil: 4.5, wear: 0.004, reload: 2.4, modes: ['1'], icon: 'sawnoff', sound: 'shotgun', view: 'obrez', hit: 2 },
    toz: { kind: 'weapon', slot: 'rifle', name: T('ТОЗ-34', 'TOZ-34'), desc: T('Охотничье двуствольное ружьё. Кучнее обреза, бьёт дальше.', 'Hunting double-barrel shotgun. Tighter than the sawn-off.'), w: 3.4, cost: 2400, ammo: ['12x70'], mag: 2, dmg: 14, pellets: 9, rpm: 280, spread: 3.6, aim: 2.4, recoil: 4, wear: 0.003, reload: 2.6, modes: ['1'], icon: 'shotgun', sound: 'shotgun', view: 'toz', hit: 2 },
    mp5: { kind: 'weapon', slot: 'rifle', name: T('Гадюка-5', 'Viper 5'), desc: T('Пистолет-пулемёт под 9х19 Para. Высокий темп огня, слабая пробиваемость.', '9x19 submachine gun. High rate of fire, weak penetration.'), w: 2.6, cost: 4200, ammo: ['9x19'], mag: 30, dmg: 24, rpm: 800, spread: 2.4, aim: 1.1, recoil: 0.9, wear: 0.0009, reload: 2.2, modes: ['a', '1'], icon: 'smg', sound: 'mp5', view: 'mp5', hit: 1 },
    aks74u: { kind: 'weapon', slot: 'rifle', name: T('АКС-74У', 'AKS-74U'), desc: T('Укороченный автомат Калашникова. Любимое оружие бандитов и сталкеров-одиночек.', 'Shortened Kalashnikov. Loved by bandits and lone stalkers alike.'), w: 2.7, cost: 3600, ammo: ['545', '545bp'], mag: 30, dmg: 32, rpm: 650, spread: 2.8, aim: 1.0, recoil: 1.7, wear: 0.0011, reload: 2.4, modes: ['a', '1'], icon: 'aksu', sound: 'ak', view: 'aks74u', hit: 1 },
    ak74: { kind: 'weapon', slot: 'rifle', name: T('АК-74', 'AK-74'), desc: T('Автомат Калашникова. Точный и надёжный, стоит на вооружении у военных.', 'Kalashnikov assault rifle. Accurate and reliable; standard army issue.'), w: 3.6, cost: 5800, ammo: ['545', '545bp'], mag: 30, dmg: 37, rpm: 600, spread: 2.1, aim: 0.55, recoil: 1.45, wear: 0.0008, reload: 2.5, modes: ['a', '1'], icon: 'ak', sound: 'ak', view: 'ak74', hit: 1 },
    // --- ammo: n = rounds in one box; w/cost per box
    '9x18': { kind: 'ammo', box: 20, name: T('9х18 мм', '9x18mm'), desc: T('Пистолетные патроны 9х18. Коробка на 20 штук.', '9x18 pistol rounds, box of 20.'), w: 0.25, cost: 60, icon: 'ammo', col: '#b89a50', label: '9x18', dmg: 1, pierce: 0 },
    '9x19': { kind: 'ammo', box: 30, name: T('9х19 Para', '9x19 Para'), desc: T('Патроны 9х19 для «Гадюки». Коробка на 30 штук.', '9x19 rounds for the Viper, box of 30.'), w: 0.3, cost: 110, icon: 'ammo', col: '#8a9a60', label: '9x19', dmg: 1, pierce: 0.05 },
    '12x70': { kind: 'ammo', box: 10, name: T('12х70 дробь', '12x70 buckshot'), desc: T('Патроны с картечью. Коробка на 10 штук.', 'Buckshot shells, box of 10.'), w: 0.4, cost: 90, icon: 'shells', col: '#b03020', label: '12x70', dmg: 1, pierce: 0 },
    '545': { kind: 'ammo', box: 30, name: T('5,45х39 мм', '5.45x39mm'), desc: T('Автоматные патроны. Коробка на 30 штук.', 'Assault rifle rounds, box of 30.'), w: 0.35, cost: 150, icon: 'ammo', col: '#6a8a40', label: '5.45', dmg: 1, pierce: 0.1 },
    '545bp': { kind: 'ammo', box: 30, name: T('5,45х39 БП', '5.45x39 AP'), desc: T('Бронебойные патроны 5,45. Хорошо пробивают армейские комбинезоны.', 'Armour-piercing 5.45 rounds. Punch through army suits.'), w: 0.35, cost: 320, icon: 'ammo', col: '#303030', label: '5.45 БП', dmg: 1.08, pierce: 0.35 },
    // --- grenades
    f1: { kind: 'grenade', slot: 'grenade', name: T('Граната Ф-1', 'F-1 grenade'), desc: T('Оборонительная граната. Радиус разлёта осколков — до двухсот метров, так что прячьтесь.', 'Defensive grenade with a huge shrapnel radius. Take cover.'), w: 0.6, cost: 400, icon: 'f1', radius: 9, dmg: 120, fuse: 3.4 },
    rgd5: { kind: 'grenade', slot: 'grenade', name: T('Граната РГД-5', 'RGD-5 grenade'), desc: T('Наступательная граната: меньше радиус, меньше риск задеть себя.', 'Offensive grenade: smaller radius, safer for the thrower.'), w: 0.4, cost: 300, icon: 'rgd5', radius: 6.5, dmg: 90, fuse: 3.2 },
    // --- medicine & food (instant effects; bleed = bleeding reduced per use, rad = dose removed)
    medkit: { kind: 'med', name: T('Аптечка', 'Medkit'), desc: T('Обычная аптечка: восстанавливает здоровье и немного останавливает кровотечение.', 'Standard medkit: restores health, slows bleeding.'), w: 0.5, cost: 300, icon: 'medkit', col: '#d02020', eff: { hp: 35, bleed: 1 }, quick: 1 },
    medkit_army: { kind: 'med', name: T('Армейская аптечка', 'Army medkit'), desc: T('Военная аптечка: быстро восстанавливает здоровье и полностью останавливает кровотечение.', 'Military medkit: big heal, stops bleeding.'), w: 0.5, cost: 600, icon: 'medkit', col: '#407030', eff: { hp: 60, bleed: 9 }, quick: 1 },
    bandage: { kind: 'med', name: T('Бинт', 'Bandage'), desc: T('Стерильный бинт. Останавливает кровотечение.', 'Sterile bandage. Stops bleeding.'), w: 0.1, cost: 120, icon: 'bandage', eff: { bleed: 9, hp: 3 }, quick: 2 },
    antirad: { kind: 'med', name: T('Антирад', 'Anti-rad'), desc: T('Препарат, выводящий радиацию из организма.', 'Drug that flushes radiation from the body.'), w: 0.1, cost: 350, icon: 'antirad', eff: { rad: 0.75 }, quick: 3 },
    vodka: { kind: 'food', name: T('Водка «Казаки»', 'Kazaki vodka'), desc: T('Лучшее средство от радиации по мнению сталкеров. Слегка выводит радиацию, но картинка плывёт.', 'The stalkers\' favourite radiation cure. Removes a little radiation, blurs your vision.'), w: 0.5, cost: 100, icon: 'vodka', eff: { rad: 0.2, drunk: 25, food: 0.05 } },
    bread: { kind: 'food', name: T('Батон', 'Bread'), desc: T('Буханка хлеба. Утоляет голод.', 'A loaf of bread. Satisfies hunger.'), w: 0.3, cost: 40, icon: 'bread', eff: { food: 0.35, hp: 2 }, quick: 4 },
    sausage: { kind: 'food', name: T('Колбаса «Диетическая»', 'Diet sausage'), desc: T('Колбаса неизвестного происхождения. Сытная.', 'Sausage of unknown origin. Filling.'), w: 0.3, cost: 60, icon: 'sausage', eff: { food: 0.4, hp: 3 }, quick: 4 },
    tourist: { kind: 'food', name: T('«Завтрак туриста»', 'Tourist\'s Delight'), desc: T('Консервы. Долго не портятся, хорошо насыщают.', 'Canned food. Keeps forever, very filling.'), w: 0.4, cost: 90, icon: 'can', eff: { food: 0.6, hp: 4 }, quick: 4 },
    energy: { kind: 'food', name: T('Энергетик «Non-Stop»', 'Non-Stop energy drink'), desc: T('Полностью восстанавливает выносливость.', 'Fully restores stamina.'), w: 0.3, cost: 150, icon: 'energy', eff: { stamina: 100, food: 0.05 } },
    // --- suits: protection fractions
    jacket: { kind: 'suit', name: T('Кожаная куртка', 'Leather jacket'), desc: T('Потёртая куртка новичка. Защищает разве что от холода.', 'A rookie\'s worn jacket. Protects mostly from the cold.'), w: 3, cost: 700, icon: 'suit', col: '#5a4028', prot: { bullet: 0.1, tear: 0.15, burn: 0.05, shock: 0.05, chem: 0.05, rad: 0.05 } },
    bandit_jacket: { kind: 'suit', name: T('Бандитская куртка', 'Bandit jacket'), desc: T('Кожанка с подкладкой из кевларовых пластин. Фирменный стиль бандитов.', 'Leather jacket with kevlar plates. Bandit fashion.'), w: 3, cost: 900, icon: 'suit', col: '#1e1e1e', prot: { bullet: 0.13, tear: 0.2, burn: 0.05, shock: 0.05, chem: 0.05, rad: 0.05 } },
    bandit_coat: { kind: 'suit', name: T('Бандитский плащ', 'Bandit coat'), desc: T('Длинный кожаный плащ главаря. Под ним — бронежилет.', 'A boss\'s long leather coat over a flak vest.'), w: 5, cost: 2500, icon: 'suit', col: '#2a2018', prot: { bullet: 0.22, tear: 0.25, burn: 0.1, shock: 0.1, chem: 0.1, rad: 0.1 } },
    stalker_suit: { kind: 'suit', name: T('Комбинезон сталкера', 'Stalker suit'), desc: T('Кустарный комбинезон «Заря»: бронежилет, противогаз и защита от аномалий.', 'The home-made "Zarya" suit: armour vest, gas mask and anomaly protection.'), w: 7, cost: 8000, icon: 'suit', col: '#4a5a30', prot: { bullet: 0.3, tear: 0.35, burn: 0.3, shock: 0.3, chem: 0.3, rad: 0.4 } },
    military_suit: { kind: 'suit', name: T('Берилл-5М', 'Berill-5M'), desc: T('Армейский бронекомбинезон спецподразделений. Отлично держит пули.', 'Army special forces armour suit. Stops bullets well.'), w: 9, cost: 11000, icon: 'suit', col: '#6a6a40', prot: { bullet: 0.45, tear: 0.45, burn: 0.2, shock: 0.2, chem: 0.15, rad: 0.2 } },
    // --- artifacts: effects while on the belt (per second or absolute)
    medusa: { kind: 'art', name: T('Медуза', 'Jellyfish'), desc: T('Образуется в гравитационных аномалиях. Слегка отклоняет пули, немного фонит.', 'Forms in gravity anomalies. Slightly deflects bullets; mildly radioactive.'), w: 0.5, cost: 2500, icon: 'art', col: '#d0a060', glow: [1, 0.75, 0.4], eff: { bullet: 0.08, rad: 0.0008 } },
    stoneblood: { kind: 'art', name: T('Кровь камня', 'Stone Blood'), desc: T('Спекшаяся масса из аномалии «Жарка». Ускоряет свёртываемость крови.', 'A fused lump from a Burner. Speeds up blood clotting.'), w: 0.5, cost: 2200, icon: 'art', col: '#a02010', glow: [1, 0.3, 0.2], eff: { bleed: 0.25, hp: 0.08, rad: 0.0005 } },
    kolobok: { kind: 'art', name: T('Колобок', 'Kolobok'), desc: T('Редкий артефакт. Заметно ускоряет заживление ран, но радиоактивен.', 'Rare artifact. Noticeably speeds up healing; radioactive.'), w: 0.5, cost: 4500, icon: 'art', col: '#70a040', glow: [0.6, 1, 0.4], eff: { hp: 0.3, rad: 0.0012 } },
    flash: { kind: 'art', name: T('Вспышка', 'Flash'), desc: T('Рождается в «Электре». Восстанавливает силы и защищает от электричества.', 'Born in an Electro. Restores stamina and shields from electricity.'), w: 0.5, cost: 3500, icon: 'art', col: '#a0c0ff', glow: [0.6, 0.8, 1.4], eff: { stamina: 0.6, shock: 0.25, rad: 0.0008 } },
    nightstar: { kind: 'art', name: T('Ночная звезда', 'Night Star'), desc: T('Светящийся артефакт гравитационного происхождения. Облегчает груз на плечах.', 'Glowing gravitational artifact. Lightens the load on your back.'), w: 0.5, cost: 5000, icon: 'art', col: '#e0f0a0', glow: [1, 1, 0.6], eff: { weight: 8, rad: 0.0012 } },
    vyvert: { kind: 'art', name: T('Выверт', 'Wrenched'), desc: T('Выводит радиацию из организма, но мешает свёртываемости крови.', 'Flushes radiation, but hinders blood clotting.'), w: 0.5, cost: 3000, icon: 'art', col: '#8060a0', glow: [0.8, 0.5, 1], eff: { rad: -0.0016, bleed: -0.06 } },
    droplets: { kind: 'art', name: T('Капли', 'Droplets'), desc: T('Похожи на застывшие капли стекла. Повышают выносливость и защищают от ожогов.', 'Like frozen glass droplets. Boost stamina, protect from burns.'), w: 0.5, cost: 2200, icon: 'art', col: '#50a0a0', glow: [0.4, 1, 1], eff: { stamina: 0.4, burn: 0.15, rad: 0.0006 } },
    // --- mutant parts
    tail_dog: { kind: 'part', name: T('Хвост слепого пса', 'Blind dog tail'), desc: T('Учёные дают за них неплохие деньги.', 'Scientists pay decent money for these.'), w: 0.3, cost: 250, icon: 'tail', col: '#7a5a40' },
    eye_flesh: { kind: 'part', name: T('Глаз плоти', 'Flesh eye'), desc: T('Отвратительный, но ценный трофей.', 'Disgusting but valuable trophy.'), w: 0.2, cost: 400, icon: 'eye', col: '#c0a080' },
    hoof_boar: { kind: 'part', name: T('Копыто кабана', 'Boar hoof'), desc: T('Мутировавшее копыто кабана.', 'Mutated boar hoof.'), w: 0.5, cost: 600, icon: 'hoof', col: '#403028' },
    tail_pseudo: { kind: 'part', name: T('Хвост псевдособаки', 'Pseudodog tail'), desc: T('Трофей с псевдособаки.', 'Trophy from a pseudodog.'), w: 0.4, cost: 900, icon: 'tail', col: '#a08050' },
    tentacles: { kind: 'part', name: T('Щупальца кровососа', 'Bloodsucker tentacles'), desc: T('Редчайший трофей. Мало кто может похвастаться, что добыл его.', 'An extremely rare trophy.'), w: 0.5, cost: 3000, icon: 'tentacle', col: '#806060' },
    // --- quest & misc
    flash_nimble: { kind: 'quest', name: T('Флешка Шустрого', 'Nimble\'s flash drive'), desc: T('Флешка с данными для Сидоровича. Шустрый чуть не отдал за неё жизнь.', 'A flash drive for Sidorovich. Nimble nearly died for it.'), w: 0.05, cost: 0, icon: 'flashdrive' },
    pda_digger: { kind: 'quest', name: T('КПК Копателя', 'Digger\'s PDA'), desc: T('Разбитый КПК из группы Стрелка. В памяти — маршрут к Агропрому и запись «Стрелок идёт к центру Зоны».', 'A cracked PDA from Strelok\'s group. Holds a route to Agroprom and the note "Strelok is heading to the centre of the Zone".'), w: 0.2, cost: 0, icon: 'pda' },
    pda: { kind: 'misc', name: T('Чужой КПК', 'Someone\'s PDA'), desc: T('КПК убитого сталкера. Иногда в них остаются координаты тайников.', 'A dead stalker\'s PDA. Sometimes holds stash coordinates.'), w: 0.2, cost: 150, icon: 'pda' },
    detector: { kind: 'misc', name: T('Детектор «Отклик»', 'Echo detector'), desc: T('Пищит рядом с аномалиями и артефактами. Чем чаще писк — тем ближе.', 'Beeps near anomalies and artifacts. Faster beeps mean closer.'), w: 0.3, cost: 500, icon: 'detector', noDrop: true },
    binoc: { kind: 'misc', slot: 'binoc', name: T('Бинокль', 'Binoculars'), desc: T('Армейский бинокль с увеличением. Выбирается клавишей 5.', 'Army binoculars. Select with key 5.'), w: 0.8, cost: 400, icon: 'binoc' },
    bolt: { kind: 'misc', name: T('Болты', 'Bolts'), desc: T('Главный инструмент сталкера. Бросьте болт в подозрительное место — аномалия себя выдаст. Клавиша 6.', 'A stalker\'s main tool. Throw one where it looks suspicious and the anomaly will give itself away. Key 6.'), w: 0, cost: 0, icon: 'bolt', noDrop: true },
    guitar: { kind: 'misc', name: T('Гитара', 'Guitar'), desc: T('Старая гитара с костра новичков.', 'An old guitar from the rookies\' campfire.'), w: 2, cost: 300, icon: 'guitar' },
    harmonica: { kind: 'misc', name: T('Губная гармошка', 'Harmonica'), desc: T('Губная гармошка. Вещь бесполезная, но душевная.', 'A harmonica. Useless, but good for the soul.'), w: 0.1, cost: 200, icon: 'harmonica' }
  };
  for (const k in ITEMS) ITEMS[k].id = k;
  const WEAPON_SLOTS = ['knife', 'pistol', 'rifle', 'grenade', 'binoc', 'bolt'];

  // ---------------------------------------------------------------- factions
  const FACTIONS = {
    stalker: { name: T('Одиночки', 'Loners'), col: '#e0c070' },
    bandit: { name: T('Бандиты', 'Bandits'), col: '#b0b0b0' },
    military: { name: T('Военные', 'Military'), col: '#90a060' },
    duty: { name: T('Долг', 'Duty'), col: '#d04030' },
    monster: { name: T('Мутанты', 'Mutants'), col: '#c06040' },
    trader: { name: T('Торговцы', 'Traders'), col: '#e0c070' }
  };
  // faction-to-faction attitude (-1 enemy, 0 neutral, 1 friend)
  const REL = {
    stalker: { stalker: 1, bandit: -1, military: -1, duty: 0, monster: -1, trader: 1 },
    bandit: { stalker: -1, bandit: 1, military: -1, duty: -1, monster: -1, trader: 0 },
    military: { stalker: -1, bandit: -1, military: 1, duty: 0, monster: -1, trader: 0 },
    duty: { stalker: 0, bandit: -1, military: 0, duty: 1, monster: -1, trader: 0 },
    monster: { stalker: -1, bandit: -1, military: -1, duty: -1, monster: 1, trader: -1 },
    trader: { stalker: 1, bandit: 0, military: 0, duty: 0, monster: -1, trader: 1 }
  };
  // player's starting goodwill with each faction (-1000..1000)
  const GOODWILL = { stalker: 400, bandit: -1000, military: -1000, duty: 200, monster: -1000, trader: 1000 };

  // ---------------------------------------------------------------- humans
  // acc: aiming skill 0..1; gear: weapons chosen at random; loot: extra items with chance
  const HUMANS = {
    rookie: { faction: 'stalker', hp: 100, suit: 'jacket', weapons: ['pm', 'obrez', 'pm', 'fort', 'obrez'], acc: 0.42, look: 'rookie', loot: [['bread', 0.5], ['bandage', 0.4], ['vodka', 0.3], ['medkit', 0.2]], money: [50, 250], rank: 0 },
    loner: { faction: 'stalker', hp: 110, suit: 'jacket', weapons: ['aks74u', 'toz', 'mp5', 'obrez'], acc: 0.55, look: 'loner', loot: [['sausage', 0.4], ['medkit', 0.35], ['bandage', 0.5], ['antirad', 0.3]], money: [150, 500], rank: 1 },
    veteran: { faction: 'stalker', hp: 130, suit: 'stalker_suit', weapons: ['ak74', 'aks74u'], acc: 0.72, look: 'veteran', loot: [['medkit', 0.6], ['antirad', 0.5]], money: [300, 900], rank: 2 },
    bandit: { faction: 'bandit', hp: 100, suit: 'bandit_jacket', weapons: ['pm', 'obrez', 'mp5', 'aks74u', 'pm', 'toz'], acc: 0.46, look: 'bandit', loot: [['vodka', 0.5], ['bread', 0.3], ['medkit', 0.2], ['bandage', 0.3]], money: [80, 400], rank: 0 },
    bandit_boss: { faction: 'bandit', hp: 150, suit: 'bandit_coat', weapons: ['aks74u', 'ak74'], acc: 0.6, look: 'boss', loot: [['medkit', 0.8], ['vodka', 0.8], ['f1', 0.5]], money: [500, 1200], rank: 1 },
    soldier: { faction: 'military', hp: 120, suit: 'military_suit', weapons: ['ak74', 'aks74u', 'ak74'], acc: 0.62, look: 'military', loot: [['medkit_army', 0.4], ['tourist', 0.5], ['rgd5', 0.4]], money: [50, 300], rank: 1 },
    officer: { faction: 'military', hp: 120, suit: 'military_suit', weapons: ['ak74'], acc: 0.66, look: 'officer', loot: [['medkit_army', 0.8], ['f1', 0.6]], money: [400, 900], rank: 2 },
    duty: { faction: 'duty', hp: 140, suit: 'military_suit', weapons: ['ak74'], acc: 0.7, look: 'duty', loot: [['medkit', 0.6], ['tourist', 0.4]], money: [100, 500], rank: 2 },
    hostage: { faction: 'stalker', hp: 100, suit: 'jacket', weapons: [], acc: 0.4, look: 'hostage', loot: [['bread', 0.3]], money: [0, 60], rank: 0 },
    trader: { faction: 'trader', hp: 1000, suit: null, weapons: [], acc: 0, look: 'trader', loot: [], money: [0, 0], rank: 3 }
  };

  // ---------------------------------------------------------------- mutants
  // speed m/s; dmg per bite; bleed added per bite; sight m; part = trophy item; pack: prefers to circle and bite by turns
  const MUTANTS = {
    dog: { name: T('Слепой пёс', 'Blind dog'), hp: 32, r: 0.45, h: 0.8, speed: 7.2, walk: 2.2, dmg: 6, bleed: 0.25, rate: 1.0, reach: 1.5, sight: 45, part: 'tail_dog', pack: true, flee: 0.35, model: 'dog', xp: 10 },
    pseudodog: { name: T('Псевдособака', 'Pseudodog'), hp: 95, r: 0.6, h: 1.0, speed: 7.8, walk: 2.4, dmg: 16, bleed: 0.4, rate: 1.3, reach: 1.9, leap: true, sight: 50, part: 'tail_pseudo', pack: true, flee: 0.2, model: 'pseudodog', xp: 30 },
    flesh: { name: T('Плоть', 'Flesh'), hp: 70, r: 0.7, h: 1.1, speed: 4.6, walk: 1.2, dmg: 12, bleed: 0.1, rate: 1.4, reach: 1.8, sight: 30, part: 'eye_flesh', pack: false, flee: 0.3, model: 'flesh', xp: 15 },
    boar: { name: T('Кабан', 'Boar'), hp: 140, r: 0.8, h: 1.2, speed: 7.5, walk: 1.6, dmg: 24, bleed: 0.2, rate: 1.8, reach: 2.0, charge: true, sight: 40, part: 'hoof_boar', pack: false, flee: 0, model: 'boar', xp: 35 },
    bloodsucker: { name: T('Кровосос', 'Bloodsucker'), hp: 260, r: 0.5, h: 1.9, speed: 7.8, walk: 1.8, dmg: 22, bleed: 0.6, rate: 1.1, reach: 1.8, invis: true, sight: 40, part: 'tentacles', pack: false, flee: 0, model: 'bloodsucker', xp: 120 }
  };

  // ---------------------------------------------------------------- anomalies
  // r = trigger radius; kind of damage; cd = recharge; arts = artifacts that grow there
  const ANOMALIES = {
    springboard: { name: T('Трамплин', 'Springboard'), r: 2.2, dmg: 32, type: 'strike', cd: 3.0, delay: 0.2, arts: ['medusa', 'nightstar'] },
    whirligig: { name: T('Карусель', 'Whirligig'), r: 3.0, dmg: 85, type: 'strike', cd: 5.0, delay: 1.1, arts: ['nightstar', 'medusa'] },
    burner: { name: T('Жарка', 'Burner'), r: 1.6, dmg: 55, type: 'burn', cd: 2.4, delay: 0.15, arts: ['stoneblood', 'droplets'] },
    electro: { name: T('Электра', 'Electro'), r: 3.0, dmg: 42, type: 'shock', cd: 2.0, delay: 0.1, arts: ['flash'] },
    acid: { name: T('Кисель', 'Fruit Punch'), r: 2.4, dmg: 14, type: 'chem', cd: 0, delay: 0, arts: ['kolobok', 'vyvert'] }
  };

  // ---------------------------------------------------------------- difficulty & ranks
  const SKILLS = [
    { name: T('Новичок', 'Novice'), dmgIn: 0.5, acc: 0.7, loot: 1.3 },
    { name: T('Сталкер', 'Stalker'), dmgIn: 0.8, acc: 0.85, loot: 1.1 },
    { name: T('Ветеран', 'Veteran'), dmgIn: 1.1, acc: 1.0, loot: 1 },
    { name: T('Мастер', 'Master'), dmgIn: 1.5, acc: 1.12, loot: 0.9 }
  ];
  const RANKS = [
    { at: 0, name: T('Новичок', 'Novice') },
    { at: 250, name: T('Опытный', 'Experienced') },
    { at: 800, name: T('Ветеран', 'Veteran') },
    { at: 1800, name: T('Мастер', 'Master') }
  ];

  // ---------------------------------------------------------------- names
  const NAMES = {
    first: ['Андрей', 'Серёга', 'Витёк', 'Толян', 'Макс', 'Димон', 'Олег', 'Саня', 'Костя', 'Гриша', 'Паша', 'Юрка', 'Лёха', 'Женя', 'Коля', 'Стас', 'Игорь', 'Миша', 'Вова', 'Федя'],
    firstEn: ['Andrey', 'Seryoga', 'Vitek', 'Tolyan', 'Max', 'Dimon', 'Oleg', 'Sanya', 'Kostya', 'Grisha', 'Pasha', 'Yurka', 'Lyokha', 'Zhenya', 'Kolya', 'Stas', 'Igor', 'Misha', 'Vova', 'Fedya'],
    nick: ['Бывалый', 'Косой', 'Сыч', 'Хмурый', 'Тихий', 'Батон', 'Крот', 'Лысый', 'Шрам', 'Жмых', 'Рябой', 'Гвоздь', 'Барсук', 'Чиж', 'Пузо', 'Кнут', 'Сивый', 'Бульба', 'Фантом', 'Дед'],
    nickEn: ['Seasoned', 'Squint', 'Owl', 'Gloomy', 'Quiet', 'Loaf', 'Mole', 'Baldy', 'Scar', 'Husk', 'Pocky', 'Nail', 'Badger', 'Finch', 'Belly', 'Whip', 'Grey', 'Spud', 'Phantom', 'Gramps'],
    soldier: ['Иванов', 'Петренко', 'Сидоренко', 'Коваль', 'Бондарь', 'Ткаченко', 'Мельник', 'Шевчук', 'Кравец', 'Руденко'],
    soldierEn: ['Ivanov', 'Petrenko', 'Sidorenko', 'Koval', 'Bondar', 'Tkachenko', 'Melnyk', 'Shevchuk', 'Kravets', 'Rudenko']
  };

  // ---------------------------------------------------------------- interface strings
  const STR = {
    ru: {
      title: 'S.T.A.L.K.E.R.', subtitle: 'ТЕНЬ ЧЕРНОБЫЛЯ', edition: 'издание 98 года',
      newGame: 'Новая игра', cont: 'Продолжить', load: 'Загрузить', save: 'Сохранить', options: 'Настройки', controls: 'Управление', credits: 'Авторы', quit: 'Выход', resume: 'Вернуться в игру', mainMenu: 'Главное меню', back: 'Назад',
      skill: 'Сложность', loading: 'Загрузка', empty: 'пусто', quickSave: 'Быстрое сохранение', autoSave: 'Автосохранение', slot: 'Слот',
      saved: 'Игра сохранена', loaded: 'Игра загружена', noSave: 'Нет сохранения', saveFail: 'Не удалось сохранить (хранилище недоступно)',
      sens: 'Чувствительность мыши', invert: 'Инверсия мыши', fov: 'Поле зрения', sfx: 'Громкость звука', music: 'Громкость музыки', res: 'Разрешение', resLow: '320×240', resMed: '640×480', resHigh: '800×600', resFull: 'Полное', grass: 'Трава', bob: 'Покачивание', fps: 'Счётчик FPS', on: 'Вкл', off: 'Выкл', lang: 'Язык',
      youDied: 'ВЫ ПОГИБЛИ', deadHint: 'Зона не прощает ошибок.', loadLast: 'Загрузить последнее сохранение', toMenu: 'В главное меню',
      use: 'Использовать', drop: 'Выбросить', equip: 'Экипировать', unequip: 'Снять', toBelt: 'На пояс', fromBelt: 'С пояса', unload: 'Разрядить', eat: 'Съесть', drink: 'Выпить',
      inventory: 'Инвентарь', weight: 'Вес', money: 'Деньги', rub: 'RU', belt: 'Пояс', outfit: 'Костюм', slots: 'Оружие', close: 'Закрыть', takeAll: 'Взять всё', take: 'Взять', search: 'Обыскать',
      trade: 'Торговля', buy: 'Купить', sell: 'Продать', price: 'Цена', traderMoney: 'Деньги торговца', notEnough: 'Не хватает денег', traderPoor: 'У торговца нет таких денег', tooHeavy: 'Слишком тяжело',
      pda: 'КПК', tasks: 'Задания', map: 'Карта', contacts: 'Контакты', diary: 'Дневник', stats: 'Статистика', active: 'Активные', done: 'Выполненные', failed: 'Проваленные', noTasks: 'Нет заданий',
      rank: 'Ранг', rating: 'Рейтинг', reputation: 'Репутация', kills: 'Убито', mutants: 'Мутантов', humans: 'Людей', artifacts: 'Найдено артефактов', stashes: 'Тайников', days: 'Дней в Зоне', time: 'Время',
      talk: 'Говорить', pressF: 'F', talkTo: 'Говорить', searchBody: 'Обыскать', pickUp: 'Подобрать', open: 'Открыть', helpWounded: 'Помочь (аптечка)', travel: 'Перейти',
      newTask: 'Новое задание', taskDone: 'Задание выполнено', taskFailed: 'Задание провалено', taskUpd: 'Задание обновлено', gotItem: 'Получено', lostItem: 'Отдано', gotMoney: 'Получено', stashInfo: 'Информация о тайнике', newsFrom: 'Сообщение',
      jam: 'Оружие заклинило! (R)', noAmmo: 'Нет патронов', overweight: 'Перегрузка! Вы не можете бежать', cantMove: 'Слишком тяжело, чтобы идти', hungry: 'Вы проголодались', rad: 'Радиация!', bleeding: 'Кровотечение!',
      friend: 'друг', enemy: 'враг', neutral: 'нейтрал', wounded: 'ранен', dead: 'мёртв',
      noBridge: 'Проход через насыпь', leaveLevel: 'Перейти на уровень', toCordon: 'На Кордон', toGarbage: 'На Свалку', toAgroprom: 'На Агропром', toBar: 'В Бар',
      intro: 'ВВЕДЕНИЕ', skip: 'Пробел — пропустить', theEnd: 'КОНЕЦ', continueFree: 'Продолжить свободную игру', endHint: 'Спасибо, что играли в S.T.A.L.K.E.R. 98',
      help: [
        'W A S D — движение, Пробел — прыжок', 'Shift — бег (тратит выносливость), Ctrl — присесть', 'Q / E — выглянуть из-за угла',
        'ЛКМ — огонь, ПКМ — прицелиться, R — перезарядка', '1 нож, 2 пистолет, 3 автомат/ружьё, 4 граната, 5 бинокль, 6 болт', 'B — режим огня, колесо мыши — смена оружия',
        'F — говорить / обыскать / подобрать', 'I — инвентарь, P или Tab — КПК, M — карта', 'L — фонарик', 'F1 аптечка, F2 бинт, F3 антирад, F4 еда', 'F6 — быстрое сохранение, F7 — быстрая загрузка', 'Esc — меню'
      ]
    },
    en: {
      title: 'S.T.A.L.K.E.R.', subtitle: 'SHADOW OF CHERNOBYL', edition: '1998 edition',
      newGame: 'New game', cont: 'Continue', load: 'Load game', save: 'Save game', options: 'Options', controls: 'Controls', credits: 'Credits', quit: 'Quit', resume: 'Resume', mainMenu: 'Main menu', back: 'Back',
      skill: 'Difficulty', loading: 'Loading', empty: 'empty', quickSave: 'Quick save', autoSave: 'Autosave', slot: 'Slot',
      saved: 'Game saved', loaded: 'Game loaded', noSave: 'No saved game', saveFail: 'Could not save (storage unavailable)',
      sens: 'Mouse sensitivity', invert: 'Invert mouse', fov: 'Field of view', sfx: 'Sound volume', music: 'Music volume', res: 'Resolution', resLow: '320×240', resMed: '640×480', resHigh: '800×600', resFull: 'Full', grass: 'Grass', bob: 'View bob', fps: 'FPS counter', on: 'On', off: 'Off', lang: 'Language',
      youDied: 'YOU ARE DEAD', deadHint: 'The Zone does not forgive mistakes.', loadLast: 'Load last save', toMenu: 'Main menu',
      use: 'Use', drop: 'Drop', equip: 'Equip', unequip: 'Unequip', toBelt: 'To belt', fromBelt: 'From belt', unload: 'Unload', eat: 'Eat', drink: 'Drink',
      inventory: 'Inventory', weight: 'Weight', money: 'Money', rub: 'RU', belt: 'Belt', outfit: 'Outfit', slots: 'Weapons', close: 'Close', takeAll: 'Take all', take: 'Take', search: 'Search',
      trade: 'Trade', buy: 'Buy', sell: 'Sell', price: 'Price', traderMoney: 'Trader\'s money', notEnough: 'Not enough money', traderPoor: 'The trader cannot afford it', tooHeavy: 'Too heavy',
      pda: 'PDA', tasks: 'Tasks', map: 'Map', contacts: 'Contacts', diary: 'Diary', stats: 'Statistics', active: 'Active', done: 'Completed', failed: 'Failed', noTasks: 'No tasks',
      rank: 'Rank', rating: 'Rating', reputation: 'Reputation', kills: 'Kills', mutants: 'Mutants', humans: 'Humans', artifacts: 'Artifacts found', stashes: 'Stashes', days: 'Days in the Zone', time: 'Time',
      talk: 'Talk', pressF: 'F', talkTo: 'Talk to', searchBody: 'Search', pickUp: 'Pick up', open: 'Open', helpWounded: 'Help (medkit)', travel: 'Travel',
      newTask: 'New task', taskDone: 'Task completed', taskFailed: 'Task failed', taskUpd: 'Task updated', gotItem: 'Received', lostItem: 'Given', gotMoney: 'Received', stashInfo: 'Stash info', newsFrom: 'Message',
      jam: 'Weapon jammed! (R)', noAmmo: 'No ammo', overweight: 'Overloaded! You cannot run', cantMove: 'Too heavy to walk', hungry: 'You are hungry', rad: 'Radiation!', bleeding: 'Bleeding!',
      friend: 'friend', enemy: 'enemy', neutral: 'neutral', wounded: 'wounded', dead: 'dead',
      noBridge: 'Crossing the embankment', leaveLevel: 'Travel to', toCordon: 'To Cordon', toGarbage: 'To Garbage', toAgroprom: 'To Agroprom', toBar: 'To the Bar',
      intro: 'INTRO', skip: 'Space — skip', theEnd: 'THE END', continueFree: 'Keep exploring', endHint: 'Thanks for playing S.T.A.L.K.E.R. 98',
      help: [
        'W A S D — move, Space — jump', 'Shift — sprint (uses stamina), Ctrl — crouch', 'Q / E — lean',
        'LMB — fire, RMB — aim, R — reload', '1 knife, 2 pistol, 3 rifle/shotgun, 4 grenade, 5 binoculars, 6 bolt', 'B — fire mode, mouse wheel — switch weapon',
        'F — talk / search / pick up', 'I — inventory, P or Tab — PDA, M — map', 'L — flashlight', 'F1 medkit, F2 bandage, F3 anti-rad, F4 food', 'F6 — quick save, F7 — quick load', 'Esc — menu'
      ]
    }
  };

  S.DATA = { T, ITEMS, WEAPON_SLOTS, FACTIONS, REL, GOODWILL, HUMANS, MUTANTS, ANOMALIES, SKILLS, RANKS, NAMES, STR };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
