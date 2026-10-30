(function (H) {
  'use strict';
  const row = (school, circle, id, name, mana, aim, o, about) => Object.assign({ id, school, circle, name, mana, aim, about }, o);

  const LIST = [
    row('yasna', 1, 'balm', 'Лунный бальзам', 5, 'own', { heal: [18, 15] }, 'Лечит свой отряд'),
    row('yasna', 1, 'clearshield', 'Ясный щит', 4, 'own', { fx: { closeIn: 0.2 } }, 'Свой отряд получает на 20 % меньше урона вплотную'),
    row('yasna', 2, 'blessing', 'Благословение', 8, 'own', { fx: { hit: 'max' } }, 'Свой отряд бьёт по верхней границе урона'),
    row('yasna', 2, 'cleanse', 'Очищение', 7, 'own', { cleanse: true }, 'Снимает с отряда все вредные эффекты'),
    row('yasna', 3, 'dawn', 'Свет зари', 14, 'owns', { heal: [14, 10], calm: true }, 'Лечит все свои отряды и снимает страх'),
    row('yasna', 3, 'mirrorarmor', 'Отражающий доспех', 12, 'own', { fx: { shotIn: 0.3 } }, 'Свой отряд получает на 30 % меньше урона от стрел'),
    row('yasna', 4, 'skyveil', 'Небесный покров', 18, 'owns', { fx: { allIn: 0.15 }, rounds: 2 }, 'Все свои получают на 15 % меньше урона 2 раунда'),
    row('yasna', 4, 'banish', 'Изгнание', 17, 'foe', { dmg: [90, 48], spiritOnly: 0.5 }, 'Большой урон духам, остальным вдвое меньше'),
    row('yasna', 5, 'resurrect', 'Воскрешение', 26, 'own', { raise: [90, 50] }, 'Поднимает павших в своём отряде; у мастера Ясны навсегда, иначе до конца боя'),
    row('yasna', 5, 'whitefull', 'Белое полнолуние', 28, 'owns', { fx: { atk: 2, def: 2, morale: 1 }, rounds: 2 }, 'Все свои +2 Натиск, +2 Стойкость, +1 мораль на 2 раунда'),

    row('zhar', 1, 'spark', 'Искра', 5, 'foe', { dmg: [15, 16] }, 'Небольшой урон огнём'),
    row('zhar', 1, 'rage', 'Ярость', 4, 'own', { fx: { dmgPct: 0.2, defPct: -0.1 } }, 'Свой отряд +20 % урона и −10 % Стойкости'),
    row('zhar', 2, 'firearrow', 'Огненная стрела', 8, 'foe', { dmg: [30, 24] }, 'Средний урон'),
    row('zhar', 2, 'hotwind', 'Жаркий ветер', 9, 'cell', { dmg: [24, 19], area: 'cone' }, 'Урон по конусу на 3 клетки'),
    row('zhar', 3, 'fireball', 'Огненный шар', 14, 'cell', { dmg: [36, 24], area: 'hex1' }, 'Урон по клетке и шести соседним, свои тоже горят'),
    row('zhar', 3, 'firewall', 'Стена огня', 12, 'line', { zone: [18, 13], rounds: 2 }, '3 клетки огня на 2 раунда'),
    row('zhar', 4, 'meteor', 'Метеор', 19, 'none', { dmg: [36, 22], strikes: 3 }, 'Три удара по случайным вражеским отрядам'),
    row('zhar', 4, 'firemadness', 'Огненное безумие', 17, 'foe', { fx: { mad: true }, rounds: 99 }, 'Вражеский отряд следующим ходом бьёт ближайший к нему отряд'),
    row('zhar', 5, 'starfall', 'Падение звезды', 30, 'cell', { dmg: [96, 48], area: 'hex2' }, 'Огромный урон по 19 клеткам, свои тоже'),
    row('zhar', 5, 'firerain', 'Огненный дождь', 26, 'foes', { dmg: [48, 29] }, 'Урон по всем вражеским отрядам'),

    row('glub', 1, 'chill', 'Холод', 4, 'foe', { fx: { initPct: -0.2 } }, '−20 % инициативы'),
    row('glub', 1, 'splash', 'Брызги', 5, 'foe', { dmg: [12, 13], ready: -10 }, 'Небольшой урон холодом и −10 готовности'),
    row('glub', 2, 'icearrow', 'Ледяная стрела', 8, 'foe', { dmg: [27, 19], fx: { initPct: -0.1 } }, 'Урон и −10 % инициативы'),
    row('glub', 2, 'sleep', 'Сон', 9, 'foe', { fx: { sleep: true }, control: true, limit: [150, 40], rounds: 99 }, 'Отряд спит, пока его не ударят; не берёт отряд с большим запасом здоровья'),
    row('glub', 3, 'icering', 'Ледяное кольцо', 13, 'cell', { dmg: [33, 22], area: 'ring' }, 'Урон по шести клеткам вокруг точки'),
    row('glub', 3, 'current', 'Течение', 11, 'push', { push: 3 }, 'Сдвигает любой отряд на 3 клетки'),
    row('glub', 4, 'numb', 'Оцепенение', 17, 'foe', { fx: { skip: true }, control: true, rounds: 99 }, 'Отряд пропускает следующий ход'),
    row('glub', 4, 'deepfog', 'Туман глубин', 16, 'owns', { fx: { shotIn: 0.4 }, rounds: 2 }, 'Свои получают на 40 % меньше урона от стрел 2 раунда'),
    row('glub', 5, 'icetomb', 'Ледяная гробница', 27, 'foe', { fx: { frozen: true, allIn: 0.5 }, control: true, rounds: 2 }, 'Отряд вмёрз на 2 раунда: не ходит, урон по нему вдвое меньше'),
    row('glub', 5, 'flood', 'Потоп', 25, 'foes', { ready: -30, fx: { initPct: -0.2 }, rounds: 2 }, 'Все враги −30 готовности и −20 % инициативы на 2 раунда'),

    row('rostan', 1, 'thorns', 'Колючки', 4, 'free', { bush: true, wound: 0.05 }, 'Колючий куст на клетке: препятствие, ранит соседей на 5 %'),
    row('rostan', 1, 'poisonspit', 'Ядовитый плевок', 5, 'foe', { poison: [6, 6], rounds: 3 }, 'Яд на 3 раунда'),
    row('rostan', 2, 'roots', 'Корни', 8, 'foe', { fx: { noMove: true }, control: true, rounds: 2 }, 'Отряд не ходит 2 раунда, бить может'),
    row('rostan', 2, 'stoneskin', 'Каменная кожа', 8, 'own', { fx: { defPct: 0.3 } }, 'Свой отряд +30 % Стойкости'),
    row('rostan', 3, 'packcall', 'Зов стаи', 14, 'none', { summon: 'wolves', count: [3, 1.5] }, 'Волки до конца боя, число по Чарам'),
    row('rostan', 3, 'stonewall', 'Каменная стена', 12, 'line', { wall: true }, 'Три препятствия в ряд'),
    row('rostan', 4, 'growth', 'Рост', 18, 'own', { heal: [27, 15], hpPct: 0.2 }, 'Свой отряд +20 % здоровья до конца боя и лечение'),
    row('rostan', 4, 'poisoncloud', 'Ядовитое облако', 17, 'cell', { poison: [9, 8], area: 'hex1', rounds: 3 }, 'Яд всем отрядам в 7 клетках'),
    row('rostan', 5, 'giantcall', 'Зов лесного великана', 30, 'none', { summon: 'forestgiant', count: [1, 1 / 6] }, 'Великан до конца боя'),
    row('rostan', 5, 'lifebloom', 'Цветение жизни', 24, 'owns', { fx: { regen: 0.1 }, rounds: 3 }, 'Все свои восстанавливают 10 % за раунд 3 раунда'),

    row('morok', 1, 'shadow', 'Тень', 4, 'own', { fx: { dodge: true }, rounds: 99 }, 'Следующий выстрел по отряду не попадает'),
    row('morok', 1, 'scare', 'Испуг', 5, 'foe', { fx: { morale: -1, fear: true }, rounds: 3 }, 'Отряд −1 мораль на 3 раунда'),
    row('morok', 2, 'blind', 'Ослепление', 9, 'foe', { fx: { blind: true }, control: true, rounds: 2 }, 'Отряд не действует и не отвечает, пока его не ударят, до 2 раундов'),
    row('morok', 2, 'phantom', 'Морок-двойник', 10, 'own', { clone: 0.3 }, 'Двойник своего отряда: 30 % существ, гибнет от любого урона'),
    row('morok', 3, 'invis', 'Невидимость', 13, 'own', { fx: { hidden: true }, rounds: 99 }, 'По отряду не стреляют и не колдуют, пока он сам не подействует'),
    row('morok', 3, 'fear', 'Страх', 12, 'foe', { flee: true }, 'Отряд отходит от ближайшего врага и пропускает ход'),
    row('morok', 4, 'swap', 'Подмена', 16, 'swap', { swap: true }, 'Меняет местами два отряда любых сторон'),
    row('morok', 4, 'terror', 'Ужас', 18, 'foes', { fx: { morale: -2, fear: true } }, 'Все враги −2 морали'),
    row('morok', 5, 'nightmare', 'Кошмар', 28, 'foe', { fx: { betray: true }, rounds: 99 }, 'Вражеский отряд один раз бьёт своих'),
    row('morok', 5, 'eclipse', 'Затмение', 26, 'foes', { ready: -40, noShoot: 1 }, 'Все враги −40 готовности, в следующем раунде никто из них не стреляет'),

    row('tlen', 1, 'hex', 'Порча', 5, 'foe', { fx: { atk: -2 }, rounds: 3 }, '−2 Натиска на 3 раунда'),
    row('tlen', 1, 'decay', 'Тлен', 4, 'foe', { dmg: [13, 14], pure: true }, 'Небольшой урон, Стойкость не помогает'),
    row('tlen', 2, 'weakness', 'Слабость', 8, 'foe', { fx: { hit: 'min' } }, 'Отряд бьёт по нижней границе урона'),
    row('tlen', 2, 'rot', 'Гниль', 9, 'foe', { fx: { noHeal: true }, hpPct: -0.1, rounds: 99 }, 'Отряд не лечится, здоровье −10 % до конца боя'),
    row('tlen', 3, 'drain', 'Высасывание', 14, 'foe', { dmg: [33, 22], drain: 0.5 }, 'Урон и лечение своего отряда на половину урона'),
    row('tlen', 3, 'kurgancurse', 'Проклятие кургана', 12, 'foe', { fx: { curse: true } }, 'Пока отряд теряет существ, его соседи теряют мораль'),
    row('tlen', 4, 'plague', 'Мор', 19, 'cell', { poison: [11, 8], area: 'hex1', rounds: 3 }, 'Яд всем в 7 клетках на 3 раунда'),
    row('tlen', 4, 'blackmark', 'Чёрная метка', 17, 'foe', { fx: { allIn: -0.3 }, rounds: 2 }, 'Отряд получает на 30 % больше урона 2 раунда'),
    row('tlen', 5, 'deathchill', 'Смертный холод', 26, 'foes', { dmg: [54, 32], noSpirit: true }, 'Урон всем вражеским отрядам, кроме духов и механизмов'),
    row('tlen', 5, 'harvest', 'Жатва', 30, 'foe', { dmg: [120, 64], pure: true }, 'Убивает существ отряда на сумму здоровья по Чарам'),

    row('mera', 1, 'haste', 'Ускорение', 5, 'own', { fx: { initPct: 0.2 }, time: true }, '+20 % инициативы'),
    row('mera', 1, 'glitch', 'Сбой', 4, 'foe', { ready: -20, time: true }, '−20 готовности'),
    row('mera', 2, 'measureshield', 'Щит меры', 8, 'own', { fx: { ward: 2 } }, 'Заклинания 1–2 кругов на отряд не действуют'),
    row('mera', 2, 'truestrike', 'Точный удар', 7, 'own', { fx: { sure: true }, rounds: 99 }, 'Следующий удар отряда по верхней границе, удача не срабатывает'),
    row('mera', 3, 'dispel', 'Развеять', 12, 'stack', { dispel: true }, 'Снимает с отряда все заклинания, свои и чужие'),
    row('mera', 3, 'repeat', 'Повтор', 13, 'own', { ready: 50, time: true }, 'Свой отряд +50 готовности'),
    row('mera', 4, 'masshaste', 'Общее ускорение', 18, 'owns', { fx: { initPct: 0.2 }, time: true }, 'Все свои +20 % инициативы'),
    row('mera', 4, 'rewind', 'Поворот часов', 17, 'stack', { rewind: true }, 'Отряд возвращается к числу существ и здоровью начала прошлого раунда'),
    row('mera', 5, 'timestop', 'Остановка времени', 28, 'none', { stop: 1, once: true }, 'Враги не набирают готовность 1 раунд; раз за бой'),
    row('mera', 5, 'order', 'Мир порядка', 24, 'none', { order: 3 }, '3 раунда никто не колдует заклинания 1–3 кругов, кроме Меры')
  ];

  const ROAD = [
    ['highview', 'Вид с высоты', 3, 6, 'Открывает круг 10 клеток'],
    ['moontrack', 'Лунный след', 5, 8, 'До конца дня видны все чужие герои'],
    ['tailwind', 'Попутный ветер', 6, 8, '+5 шагов сегодня'],
    ['callboat', 'Призвать лодку', 8, 10, 'Ближайшая своя лодка приплывает к берегу'],
    ['waterwalk', 'Хождение по воде', 10, 12, 'До конца дня вода стоит как луг'],
    ['return', 'Возвращение', 12, 15, 'Герой в ближайшем своём городе'],
    ['moongate', 'Лунные врата', 16, 20, 'Герой в любом своём городе, если он ещё не ходил в этот день'],
    ['flight', 'Полёт', 20, 25, 'До конца дня герой летит над водой и скалами']
  ].map(([id, name, level, mana, about]) => ({ id, name, school: 'road', circle: 0, level, mana, about, aim: 'road' }));

  H.SPELLS = Object.fromEntries([...LIST, ...ROAD].map(s => [s.id, s]));
  H.SCHOOLS = { yasna: 'Ясна', zhar: 'Жарь', glub: 'Глубь', rostan: 'Ростань', morok: 'Морок', tlen: 'Тлень', mera: 'Мера' };

  for (const s of LIST) {
    if (s.circle > 3) continue;
    H.ARTIFACTS['scroll-' + s.id] = { id: 'scroll-' + s.id, name: 'Свиток: ' + s.name, slot: 'scroll', rank: 'plain', fx: {}, about: 'Учит заклинание, если оно герою доступно', scroll: s.id };
  }
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
