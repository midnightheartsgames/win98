(function (S) {
  'use strict';
  const D = S.DEG;

  const AMMO = {
    shells: { max: 100, name: { ru: 'Патроны', en: 'Shells' } },
    bullets: { max: 500, name: { ru: 'Пули', en: 'Bullets' } },
    rockets: { max: 50, name: { ru: 'Ракеты', en: 'Rockets' } },
    grenades: { max: 50, name: { ru: 'Гранаты', en: 'Grenades' } },
    cells: { max: 400, name: { ru: 'Заряды', en: 'Cells' } },
    balls: { max: 30, name: { ru: 'Ядра', en: 'Cannonballs' } }
  };

  const WEAPONS = {
    knife: { key: 1, name: { ru: 'Нож', en: 'Military Knife' }, melee: true, dmg: 60, range: 2.4, rate: 0.5, sound: 'knife' },
    colt: { key: 2, name: { ru: 'Револьвер Шофилда', en: 'Schofield .45' }, dmg: 20, rate: 0.3, clip: 6, reload: 1.2, spread: 0.4 * D, sound: 'colt' },
    shotgun: { key: 3, name: { ru: 'Помповое ружьё', en: '12 Gauge Pump-Action Shotgun' }, ammo: 'shells', use: 1, pellets: 7, dmg: 10, spread: 3.6 * D, rate: 0.75, sound: 'shotgun', give: 10 },
    dshotgun: { key: 4, name: { ru: 'Двустволка', en: 'Double Coach Gun' }, ammo: 'shells', use: 2, pellets: 14, dmg: 10, spread: 6.5 * D, rate: 1.25, sound: 'dshotgun', give: 20 },
    tommy: { key: 5, name: { ru: 'Автомат Томпсона', en: 'M1-A2 Thompson' }, ammo: 'bullets', use: 1, dmg: 10, rate: 0.1, spread: 1.0 * D, sound: 'tommy', give: 50 },
    minigun: { key: 6, name: { ru: 'Миниган', en: 'XM-214-A Minigun' }, ammo: 'bullets', use: 1, dmg: 10, rate: 0.05, spread: 1.6 * D, spinup: 0.45, sound: 'minigun', give: 100 },
    rocket: { key: 7, name: { ru: 'Ракетомёт', en: 'XPML21 Rocket Launcher' }, ammo: 'rockets', use: 1, proj: 'rocket', rate: 0.6, sound: 'rocket', give: 5 },
    grenade: { key: 8, name: { ru: 'Гранатомёт', en: 'MKIII Grenade Launcher' }, ammo: 'grenades', use: 1, proj: 'grenade', rate: 0.7, sound: 'grenade', give: 5 },
    laser: { key: 9, name: { ru: 'Лазер XL2', en: 'XL2 Lasergun' }, ammo: 'cells', use: 1, proj: 'laser', rate: 0.085, sound: 'laser', give: 50, barrels: [[0.05, 0.05], [-0.05, -0.04], [-0.05, 0.05], [0.05, -0.04]] },
    cannon: { key: 0, name: { ru: 'Пушка', en: 'SBC Cannon' }, ammo: 'balls', use: 1, proj: 'cannonball', rate: 1.2, charge: 1.2, sound: 'cannon', give: 3 }
  };
  const WEAPON_ORDER = ['knife', 'colt', 'shotgun', 'dshotgun', 'tommy', 'minigun', 'rocket', 'grenade', 'laser', 'cannon'];

  const PROJ = {
    rocket: { owner: 'p', speed: 45, dmg: 80, splash: 70, radius: 5, size: 0.25, light: [1, 0.7, 0.3], trail: 'smoke', model: 'rocket' },
    grenade: { owner: 'p', speed: 26, up: 4, gravity: 20, bounce: 0.45, fuse: 2.2, dmg: 0, splash: 110, radius: 6, size: 0.2, trail: 'smoke', contact: true, model: 'grenade' },
    laser: { owner: 'p', speed: 110, dmg: 20, size: 0.15, light: [0.3, 1, 0.3], sprite: [0.4, 1, 0.3], glow: 0.6 },
    cannonball: { owner: 'p', speed: 45, up: 2, gravity: 20, bounce: 0.25, roll: true, fuse: 3.5, dmg: 500, pierce: true, splash: 150, radius: 7, size: 0.5, model: 'ball' },
    e_rocket: { owner: 'e', speed: 18, dmg: 10, splash: 6, radius: 2, size: 0.2, light: [1, 0.6, 0.2], trail: 'smoke', model: 'rocket' },
    e_fire: { owner: 'e', speed: 20, dmg: 6, size: 0.2, sprite: [1, 0.55, 0.15], light: [1, 0.5, 0.2], glow: 0.5 },
    e_bone: { owner: 'e', speed: 22, dmg: 10, size: 0.25, sprite: [0.9, 0.85, 0.7], glow: 0.35, model: 'chainball' },
    e_bio: { owner: 'e', speed: 22, dmg: 25, splash: 15, radius: 3, homing: 0.6, size: 0.3, light: [1, 0.4, 0.2], trail: 'smoke', model: 'rocket' },
    e_fireball: { owner: 'e', speed: 17, dmg: 12, homing: 1.4, life: 5, size: 0.35, sprite: [0.4, 1, 0.3], light: [0.3, 1, 0.2], glow: 0.9 },
    e_lava: { owner: 'e', speed: 20, up: 7, gravity: 12, dmg: 30, splash: 30, radius: 4, size: 0.5, sprite: [1, 0.45, 0.1], light: [1, 0.4, 0.1], glow: 1.2, trail: 'fire' },
    e_harpy: { owner: 'e', speed: 25, dmg: 8, size: 0.2, sprite: [0.8, 0.3, 1], light: [0.7, 0.2, 1], glow: 0.5 },
    e_boss: { owner: 'e', speed: 26, dmg: 35, splash: 30, radius: 5, size: 0.9, sprite: [1, 0.35, 0.1], light: [1, 0.4, 0.1], glow: 2.5, trail: 'fire' },
    e_bossrock: { owner: 'e', speed: 28, dmg: 30, splash: 20, radius: 4, homing: 1.0, life: 6, size: 0.35, light: [1, 0.6, 0.2], trail: 'smoke', model: 'rocket' }
  };

  const ENEMIES = {
    kamikaze: { name: { ru: 'Безголовый камикадзе', en: 'Beheaded Kamikaze' }, hp: 10, speed: 9.2, r: 0.45, h: 1.8, ai: 'kamikaze', dmg: 35, blast: 4.5, score: 250, model: 'kamikaze', sounds: { alert: 'scream' },
      info: { ru: 'Безголовый солдат с двумя бомбами в руках. С воплем «А-а-а-а!» бежит прямо на вас и взрывается. Стреляйте издалека и не подпускайте их близко — взрыв задевает и других монстров.', en: 'A headless soldier holding two bombs. Screaming "AAAAAAA!" he runs straight at you and explodes. Shoot from afar — his blast also hurts other monsters.' } },
    rocketeer: { name: { ru: 'Безголовый ракетчик', en: 'Beheaded Rocketeer' }, hp: 20, speed: 4, r: 0.45, h: 1.8, ai: 'ranged', proj: 'e_rocket', shots: 1, cool: 2.4, range: 70, keep: 12, score: 100, model: 'rocketeer', sounds: { alert: 'grunt' },
      info: { ru: 'Безголовый пехотинец с ракетницей. Медленные снаряды легко обойти, но в толпе они опасны.', en: 'Headless infantry with a small rocket launcher. The slow rockets are easy to dodge, but dangerous in a crowd.' } },
    firecracker: { name: { ru: 'Безголовый шутник', en: 'Beheaded Firecracker' }, hp: 30, speed: 4, r: 0.45, h: 1.8, ai: 'ranged', proj: 'e_fire', shots: 5, fan: 9 * D, cool: 2.6, range: 60, keep: 12, score: 200, model: 'firecracker', sounds: { alert: 'grunt' },
      info: { ru: 'Стреляет веером из пяти огненных зарядов. Держите дистанцию и стрейфьте.', en: 'Fires a fan of five fire bolts. Keep your distance and circle-strafe.' } },
    gnaar: { name: { ru: 'Гнаар', en: 'Gnaar' }, hp: 40, speed: 6.5, r: 0.7, h: 1.6, ai: 'melee', dmg: 10, reach: 2.0, cool: 0.9, score: 150, model: 'gnaar', sounds: { alert: 'gnaar', attack: 'bite' },
      info: { ru: 'Одноглазая тварь с огромной пастью. Нападает стаями и кусается. Уязвима для дробовика.', en: 'A one-eyed creature with a huge mouth. Attacks in packs and bites. Vulnerable to shotguns.' } },
    kleer: { name: { ru: 'Клир-скелет', en: 'Kleer Skeleton' }, hp: 80, speed: 10.5, r: 0.7, h: 2.2, ai: 'kleer', dmg: 15, reach: 2.4, cool: 1.0, proj: 'e_bone', shots: 3, fan: 7 * D, rcool: 3.2, score: 400, model: 'kleer', sounds: { alert: 'kleer', attack: 'claw' },
      info: { ru: 'Скелет с Клира. Быстро скачет огромными прыжками, рвёт когтями и метает цепные ядра. Двустволка — лучший ответ.', en: 'A skeleton from Kleer. Gallops in huge leaps, slashes with claws and throws chainballs. The double shotgun is the best answer.' } },
    werebull: { name: { ru: 'Сирианский быкочеловек', en: 'Sirian Werebull' }, hp: 260, speed: 6, charge: 19, r: 1.2, h: 2.4, ai: 'charge', dmg: 30, knock: 18, reach: 2.4, cool: 1.5, score: 600, model: 'werebull', sounds: { alert: 'bull', attack: 'bullhit' },
      info: { ru: 'Огромный разъярённый бык. Разгоняется и таранит, подбрасывая жертву в воздух. Отпрыгивайте в сторону в последний момент.', en: 'A huge enraged bull. Charges and rams, tossing its victim into the air. Side-step at the last moment.' } },
    harpy: { name: { ru: 'Скифская гарпия', en: 'Scythian Witch-Harpy' }, hp: 30, speed: 9, r: 0.6, h: 1.4, ai: 'flyer', fly: 7, dmg: 10, reach: 2.0, cool: 1.2, proj: 'e_harpy', shots: 1, rcool: 2.2, score: 250, model: 'harpy', sounds: { alert: 'harpy', attack: 'claw' },
      info: { ru: 'Летающая ведьма. Кружит над головой, стреляет сгустками энергии и пикирует, чтобы ударить когтями.', en: 'A flying witch. Circles overhead, shoots energy bolts and dives in to slash.' } },
    hopper: { name: { ru: 'Болотный прыгун', en: 'Marsh Hopper' }, hp: 12, speed: 7, r: 0.4, h: 0.7, ai: 'hopper', dmg: 6, reach: 1.3, cool: 0.8, score: 50, model: 'hopper', sounds: { alert: 'hop' },
      info: { ru: 'Мелкая прыгучая тварь из болот. Слаба поодиночке, но приходит сотнями.', en: 'A small jumpy marsh creature. Weak alone, but comes by the hundreds.' } },
    reptiloid: { name: { ru: 'Рептилоид-горец', en: 'Reptiloid Highlander' }, hp: 120, speed: 5, r: 0.6, h: 2.2, ai: 'ranged', proj: 'e_fireball', shots: 2, fan: 12 * D, cool: 2.6, range: 60, keep: 14, score: 500, model: 'reptiloid', sounds: { alert: 'lizard' },
      info: { ru: 'Ящер-воин. Выпускает самонаводящиеся зелёные огненные шары — прячьтесь за колоннами.', en: 'A lizard warrior. Launches homing green fireballs — use pillars as cover.' } },
    arachnoid: { name: { ru: 'Молодой арахноид', en: 'Arachnoid Juvenile' }, hp: 160, speed: 3.5, r: 1.3, h: 2.0, ai: 'gunner', dmg: 3, burst: 12, cool: 3.0, range: 60, keep: 20, score: 600, model: 'arachnoid', sounds: { alert: 'arach' },
      info: { ru: 'Механический скорпион с пулемётом в хвосте. Ведёт очереди, пока вы на виду.', en: 'A mechanical scorpion with a machine gun in its tail. Fires bursts while you are in sight.' } },
    biomech: { name: { ru: 'Малый биомеханоид', en: 'Biomechanoid Minor' }, hp: 260, speed: 3, r: 1.1, h: 4.0, ai: 'ranged', proj: 'e_bio', shots: 2, fan: 6 * D, cool: 3.2, range: 90, keep: 25, score: 800, model: 'biomech', sounds: { alert: 'robot' },
      info: { ru: 'Кибернетический шагоход с двумя ракетными установками. Ракеты слегка доворачивают за целью.', en: 'A cybernetic walker with twin rocket launchers. Its rockets slightly track the target.' } },
    biomajor: { name: { ru: 'Большой биомеханоид', en: 'Biomechanoid Major' }, hp: 900, speed: 2.4, r: 1.8, h: 7.0, ai: 'ranged', proj: 'e_bio', shots: 6, fan: 5 * D, cool: 4.2, range: 110, keep: 30, score: 2500, model: 'biomajor', sounds: { alert: 'robot' },
      info: { ru: 'Гигантская версия биомеханоида: залп из шести ракет. Ракетомёт и пушка — ваши друзья.', en: 'A giant biomechanoid firing six-rocket salvos. Rockets and the cannon are your friends.' } },
    golem: { name: { ru: 'Лавовый голем', en: 'Lava Golem' }, hp: 320, speed: 3, r: 1.4, h: 4.2, ai: 'ranged', proj: 'e_lava', shots: 1, cool: 3.0, range: 70, keep: 18, score: 1000, model: 'golem', sounds: { alert: 'golem' },
      info: { ru: 'Каменный великан с раскалённой лавой внутри. Бросает по дуге шары лавы, которые взрываются.', en: 'A stone giant with molten lava inside. Lobs lava bombs that explode on impact.' } },
    ughzan: { name: { ru: 'Уг-Зан III', en: 'Ugh-Zan III' }, hp: 7000, speed: 4.2, r: 4.5, h: 22, ai: 'boss', dmg: 60, knock: 25, reach: 8, score: 50000, model: 'ughzan', boss: true, sounds: { alert: 'bossroar' },
      info: { ru: 'Уг-Зан Третий, личный страж Ментала. Двадцатиметровый гигант: огненные шары, ракеты и сокрушительные удары. Держитесь на расстоянии и стреляйте без остановки!', en: 'Ugh-Zan the Third, Mental\'s personal guardian. A twenty-metre giant: fireballs, rockets and crushing stomps. Keep your distance and never stop shooting!' } }
  };

  const ITEMS = {
    pill: { kind: 'health', amount: 1, max: 200, color: [0.3, 0.9, 1] },
    health_s: { kind: 'health', amount: 10, max: 100, color: [0.2, 0.9, 0.3] },
    health_m: { kind: 'health', amount: 25, max: 100, color: [0.2, 0.9, 0.3] },
    health_l: { kind: 'health', amount: 50, max: 100, color: [0.2, 0.9, 0.3] },
    health_x: { kind: 'health', amount: 100, max: 200, color: [1, 0.3, 0.3] },
    shard: { kind: 'armor', amount: 1, max: 200, color: [1, 0.9, 0.3] },
    armor_m: { kind: 'armor', amount: 25, max: 100, color: [1, 0.85, 0.2] },
    armor_l: { kind: 'armor', amount: 50, max: 100, color: [1, 0.75, 0.1] },
    armor_x: { kind: 'armor', amount: 100, max: 200, color: [1, 0.55, 0.1] },
    a_shells: { kind: 'ammo', ammo: 'shells', amount: 10 },
    a_bullets: { kind: 'ammo', ammo: 'bullets', amount: 50 },
    a_rockets: { kind: 'ammo', ammo: 'rockets', amount: 5 },
    a_grenades: { kind: 'ammo', ammo: 'grenades', amount: 5 },
    a_cells: { kind: 'ammo', ammo: 'cells', amount: 50 },
    a_balls: { kind: 'ammo', ammo: 'balls', amount: 4 },
    serious: { kind: 'power', power: 'damage', time: 25, color: [1, 0.2, 0.9] }
  };
  for (const w of WEAPON_ORDER) ITEMS['w_' + w] = { kind: 'weapon', weapon: w };

  const SKILLS = [
    { id: 'tourist', name: { ru: 'Турист', en: 'Tourist' }, count: 0.6, dmg: 0.5, ammo: 2 },
    { id: 'easy', name: { ru: 'Легко', en: 'Easy' }, count: 0.8, dmg: 0.75, ammo: 1.5 },
    { id: 'normal', name: { ru: 'Нормально', en: 'Normal' }, count: 1, dmg: 1, ammo: 1 },
    { id: 'hard', name: { ru: 'Сложно', en: 'Hard' }, count: 1.25, dmg: 1.25, ammo: 1 },
    { id: 'serious', name: { ru: 'Серьёзно', en: 'Serious' }, count: 1.5, dmg: 1.5, ammo: 1 }
  ];

  const STR = {
    ru: {
      title: 'SERIOUS SAM 98', subtitle: 'ПЕРВАЯ ВСТРЕЧА', newGame: 'НОВАЯ ИГРА', cont: 'ПРОДОЛЖИТЬ', resume: 'ВЕРНУТЬСЯ В ИГРУ', levelSelect: 'ВЫБОР УРОВНЯ', options: 'НАСТРОЙКИ',
      controls: 'УПРАВЛЕНИЕ', quit: 'ВЫХОД', back: 'НАЗАД', mainMenu: 'ГЛАВНОЕ МЕНЮ', restart: 'НАЧАТЬ УРОВЕНЬ ЗАНОВО', difficulty: 'СЛОЖНОСТЬ',
      sens: 'Чувствительность мыши', invert: 'Инвертировать мышь', fov: 'Поле зрения', sfx: 'Громкость звуков', music: 'Громкость музыки', quality: 'Качество графики', fps: 'Показывать FPS', bob: 'Покачивание оружия',
      on: 'ВКЛ', off: 'ВЫКЛ', low: 'НИЗКОЕ', med: 'СРЕДНЕЕ', high: 'ВЫСОКОЕ',
      clickToPlay: 'Щёлкните, чтобы захватить мышь', paused: 'ПАУЗА', youDied: 'ВЫ ПОГИБЛИ', pressFire: 'Щёлкните или нажмите Пробел, чтобы начать уровень заново',
      kills: 'Убито', secrets: 'Секреты', time: 'Время', score: 'Счёт', levelDone: 'УРОВЕНЬ ПРОЙДЕН', next: 'Щёлкните, чтобы продолжить', secretFound: 'Вы нашли секрет!',
      netricsa: 'НЕТРИКСА', report: 'СООБЩИТЬ ОБ ОШИБКЕ', newEnemy: 'Новый противник', ammoFull: '', loading: 'ЗАГРУЗКА...', boss: 'УГ-ЗАН III',
      fpsCap: 'Частота кадров', screenHz: 'КАК У ЭКРАНА', touchSens: 'Чувствительность пальца', aim: 'Помощь прицела', aimOff: 'ВЫКЛ', aimWeak: 'СЛАБАЯ', aimNormal: 'ОБЫЧНАЯ',
      pressFireTouch: 'Коснитесь экрана, чтобы начать уровень заново', nextTouch: 'Коснитесь экрана, чтобы продолжить', gfxReset: 'Графика сброшена, перезапуск...', hintTitle: 'Управление', fireBtn: 'ОГОНЬ', jumpBtn: 'ПРЫЖОК',
      helpTouch: [
        'Левая половина экрана — движение: стик появляется под пальцем, чем дальше палец, тем быстрее',
        'Правая половина — обзор: ведите пальцем',
        'ОГОНЬ — стрелять; не отпуская кнопку, ведите пальцем, чтобы целиться',
        'Пушка: держите ОГОНЬ для сильного выстрела',
        'Значок оружия вверху справа: касание — следующее, сдвиг — листать, долгое нажатие — список',
        'ПРЫЖОК — над кнопкой огня, R — перезарядка револьвера',
        'II вверху слева или «Назад» — пауза; НЕТРИКСА — в меню паузы'
      ],
      help: [
        'W A S D / стрелки — движение',
        'Мышь — обзор, ЛКМ — огонь',
        'Пробел — прыжок, Shift — шаг',
        '1…9, 0 / колесо — выбор оружия, Q — прошлое оружие',
        'R — перезарядка револьвера',
        'Tab — сообщения НЕТРИКСЫ',
        'Esc — пауза и меню',
        'Пушка: удерживайте ЛКМ для сильного выстрела',
        'Консоль: наберите в игре «please god», «please giveall», «please killall»',
        'F7 — меню отладки'
      ],
      victory: ['ПИРАМИДА ОТКРЫЛА СВОИ ТАЙНЫ.', 'Уг-Зан III повержен, а древний Путешественник во времени', 'уносит Сэма к звёздам — навстречу Менталу.', '', 'Серьёзный Сэм вернётся!'],
      cheatOn: 'Режим бога ВКЛЮЧЁН', cheatOff: 'Режим бога ВЫКЛЮЧЕН', cheatAll: 'Всё оружие и боеприпасы!', cheatKill: 'Все противники уничтожены',
      dbg: {
        title: 'ОТЛАДКА', keys: '↑↓ выбор   ←→ значение   Enter применить   F7 закрыть', paused: 'Игра на паузе',
        player: 'ИГРОК', move: 'ДВИЖЕНИЕ', arms: 'ОРУЖИЕ',
        god: 'Бессмертие', heal: 'Излечиться', armor: 'Выдать броню', noclip: 'Полёт сквозь стены', run: 'Быстрый бег', jump: 'Высокий прыжок', give: 'Выдать', all: 'Всё оружие и патроны', inf: 'Бесконечные патроны',
        hp: 'здоровье', ar: 'броня', owned: 'есть', normal: 'обычный',
        godOn: 'Бессмертие включено: урон не проходит', godOff: 'Бессмертие выключено',
        healed: 'Здоровье восстановлено до 100', revived: 'Сэм снова в строю', armored: 'Броня 200',
        flyOn: 'Полёт: мышь — направление, Пробел — вверх, C — вниз, Shift — медленно', flyOff: 'Полёт выключен, Сэм падает на землю',
        runSet: 'Скорость бега', jumpSet: 'Высота прыжка', given: 'Выдано', dual: 'ДВА РЕВОЛЬВЕРА', allGiven: 'Всё оружие и полный боезапас', infOn: 'Бесконечные патроны: выстрелы не тратят боезапас, револьвер не перезаряжается', infOff: 'Патроны снова расходуются'
      }
    },
    en: {
      title: 'SERIOUS SAM 98', subtitle: 'THE FIRST ENCOUNTER', newGame: 'NEW GAME', cont: 'CONTINUE', resume: 'RESUME GAME', levelSelect: 'SELECT LEVEL', options: 'OPTIONS',
      controls: 'CONTROLS', quit: 'QUIT', back: 'BACK', mainMenu: 'MAIN MENU', restart: 'RESTART LEVEL', difficulty: 'DIFFICULTY',
      sens: 'Mouse sensitivity', invert: 'Invert mouse', fov: 'Field of view', sfx: 'Sound volume', music: 'Music volume', quality: 'Graphics quality', fps: 'Show FPS', bob: 'Weapon bobbing',
      on: 'ON', off: 'OFF', low: 'LOW', med: 'MEDIUM', high: 'HIGH',
      clickToPlay: 'Click to capture the mouse', paused: 'PAUSED', youDied: 'YOU DIED', pressFire: 'Click or press Space to restart the level',
      kills: 'Kills', secrets: 'Secrets', time: 'Time', score: 'Score', levelDone: 'LEVEL COMPLETE', next: 'Click to continue', secretFound: 'You found a secret!',
      netricsa: 'NETRICSA', report: 'REPORT A BUG', newEnemy: 'New enemy', ammoFull: '', loading: 'LOADING...', boss: 'UGH-ZAN III',
      fpsCap: 'Frame rate', screenHz: 'LIKE THE SCREEN', touchSens: 'Finger sensitivity', aim: 'Aim assist', aimOff: 'OFF', aimWeak: 'WEAK', aimNormal: 'NORMAL',
      pressFireTouch: 'Tap the screen to restart the level', nextTouch: 'Tap the screen to continue', gfxReset: 'Graphics were reset, restarting...', hintTitle: 'Controls', fireBtn: 'FIRE', jumpBtn: 'JUMP',
      helpTouch: [
        'Left half of the screen — move: the stick appears under your finger, further is faster',
        'Right half — look: drag your finger',
        'FIRE — shoot; keep holding and drag to aim',
        'Cannon: hold FIRE for a stronger shot',
        'Weapon icon top right: tap — next, swipe — browse, long press — list',
        'JUMP — above the fire button, R — reload the revolver',
        'II top left or Back — pause; NETRICSA is in the pause menu'
      ],
      help: [
        'W A S D / arrows — move',
        'Mouse — look, LMB — fire',
        'Space — jump, Shift — walk',
        '1…9, 0 / wheel — weapons, Q — previous weapon',
        'R — reload the revolver',
        'Tab — NETRICSA messages',
        'Esc — pause and menu',
        'Cannon: hold LMB for a stronger shot',
        'Console: type "please god", "please giveall", "please killall" in game',
        'F7 — debug menu'
      ],
      victory: ['THE PYRAMID HAS REVEALED ITS SECRETS.', 'Ugh-Zan III has fallen, and the ancient Time-Lock', 'carries Sam to the stars — towards Mental.', '', 'Serious Sam will return!'],
      cheatOn: 'God mode ON', cheatOff: 'God mode OFF', cheatAll: 'All weapons and ammo!', cheatKill: 'All enemies destroyed',
      dbg: {
        title: 'DEBUG', keys: '↑↓ select   ←→ value   Enter apply   F7 close', paused: 'Game paused',
        player: 'PLAYER', move: 'MOVEMENT', arms: 'WEAPONS',
        god: 'Invulnerability', heal: 'Heal', armor: 'Give armor', noclip: 'Fly through walls', run: 'Fast run', jump: 'High jump', give: 'Give', all: 'All weapons and ammo', inf: 'Infinite ammo',
        hp: 'health', ar: 'armor', owned: 'owned', normal: 'normal',
        godOn: 'Invulnerability on: no damage taken', godOff: 'Invulnerability off',
        healed: 'Health restored to 100', revived: 'Sam is back on his feet', armored: 'Armor 200',
        flyOn: 'Flight: mouse aims, Space up, C down, Shift slow', flyOff: 'Flight off, Sam drops to the ground',
        runSet: 'Run speed', jumpSet: 'Jump height', given: 'Given', dual: 'DUAL REVOLVERS', allGiven: 'All weapons and full ammo', infOn: 'Infinite ammo: shots cost nothing, the revolver never reloads', infOff: 'Ammo is spent again'
      }
    }
  };

  S.DATA = { AMMO, WEAPONS, WEAPON_ORDER, PROJ, ENEMIES, ITEMS, SKILLS, STR };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
