(function (L) {
  'use strict';
  const TICK = 30, DT = 1 / TICK;
  const MAP = 14000, CELL = 100, GRID = MAP / CELL;

  const XP_TABLE = [0, 280, 660, 1140, 1720, 2400, 3180, 4060, 5040, 6120, 7300, 8580, 9960, 11440, 13020, 14700, 16480, 18360];

  const CHAMPS = {
    lulu: {
      name: 'Lulu', title: { ru: 'Фея-волшебница', en: 'the Fae Sorceress' }, roles: ['support', 'mid'], ranged: true,
      color: '#a060e0', proj: { color: '#e0a0ff', speed: 1450 },
      stats: { hp: 525, hpG: 74, mp: 350, mpG: 55, ad: 46, adG: 2.6, as: 0.625, asG: 2.25, armor: 19, armorG: 3.7, mr: 30, mrG: 0, ms: 325, range: 550, hpReg: 1.2, hpRegG: 0.12, mpReg: 2.2, mpRegG: 0.12 },
      lore: { ru: 'Йордл-волшебница из Бандл-сити. Вместе с феей Пикс превращает врагов в милых зверушек, а союзников — в великанов.', en: 'A yordle enchantress who, together with the fae Pix, turns enemies into cute critters and allies into giants.' },
      passive: { name: { ru: 'Пикс, фея-спутница', en: 'Pix, Faerie Companion' }, desc: { ru: 'Пикс летает рядом с Лулу и при каждой её автоатаке выпускает три стрелы, наносящие дополнительный магический урон.', en: 'Pix fires three bolts with each of Lulu\'s basic attacks, dealing bonus magic damage.' } },
      abilities: [
        { key: 'Q', target: 'dir', range: 925, cost: [60, 65, 70, 75, 80], cd: [7, 7, 7, 7, 7], v: { d: [80, 125, 170, 215, 260], ap: 0.5, slow: 0.8 },
          name: { ru: 'Сверкающее копьё', en: 'Glitterlance' }, desc: { ru: 'Лулу и Пикс выпускают копьё, пронзающее врагов: {d} (+{ap} СУ) магического урона и замедление на 80%, ослабевающее за 2 с.', en: 'Fires a piercing bolt: {d} (+{ap} AP) magic damage and an 80% slow decaying over 2 s.' } },
        { key: 'W', target: 'unit', range: 650, cost: [65, 70, 75, 80, 85], cd: [16, 15, 14, 13, 12], v: { t: [2.5, 3, 3.5, 4, 4.5], poly: [1.25, 1.5, 1.75, 2, 2.25] },
          name: { ru: 'Причуда', en: 'Whimsy' }, desc: { ru: 'Союзник получает +30% скорости и +25 СУ на {t} с. Враг превращается в зверька на {poly} с: не может атаковать и применять умения, замедлен.', en: 'An ally gains 30% move speed and 25 AP for {t} s. An enemy is polymorphed for {poly} s: cannot attack or cast, and is slowed.' } },
        { key: 'E', target: 'unit', range: 650, cost: [60, 65, 70, 75, 80], cd: [10, 10, 10, 10, 10], v: { d: [80, 120, 160, 200, 240], ap: 0.6 },
          name: { ru: 'Помоги, Пикс!', en: 'Help, Pix!' }, desc: { ru: 'На союзника: щит {d} (+{ap} СУ) на 6 с. На врага: {d} (+{ap} СУ) магического урона и обзор цели.', en: 'Ally: a {d} (+{ap} AP) shield for 6 s. Enemy: {d} (+{ap} AP) magic damage and reveals the target.' } },
        { key: 'R', target: 'ally', range: 900, cost: [150, 150, 150], cd: [110, 95, 80], v: { hp: [300, 450, 600] },
          name: { ru: 'Буйный рост', en: 'Wild Growth' }, desc: { ru: 'Союзник (или сама Лулу) вырастает на 7 с: +{hp} здоровья, подбрасывает врагов рядом и замедляет всех вокруг на 30%.', en: 'An ally (or Lulu) grows for 7 s: +{hp} health, knocks nearby enemies up and slows everyone around by 30%.' } }
      ],
      skill: [0, 2, 1, 0, 0, 3, 0, 2, 0, 2, 3, 2, 2, 1, 1, 3, 1, 1],
      build: ['doranRing', 'hpPot', 'ward', 'boots', 'sapphire', 'ionian', 'tome', 'rylai', 'ward', 'blastingWand', 'archangel', 'frozenHeart', 'deathcap', 'zhonya'],
      scale: 0.85
    },
    jinx: {
      name: 'Jinx', title: { ru: 'Сорвиголова', en: 'the Loose Cannon' }, roles: ['adc'], ranged: true,
      color: '#40a0ff', proj: { color: '#ffe060', speed: 2000 },
      stats: { hp: 610, hpG: 86, mp: 245, mpG: 45, ad: 57, adG: 3.4, as: 0.625, asG: 1, armor: 28, armorG: 3.5, mr: 30, mrG: 0, ms: 325, range: 525, hpReg: 0.75, hpRegG: 0.1, mpReg: 1.3, mpRegG: 0.1 },
      lore: { ru: 'Неуравновешенная преступница из Зауна. Больше всего на свете любит громкие взрывы, свою пулемётку Пыщ-Пыщ и ракетницу Рыбоголовку.', en: 'A manic criminal from Zaun who loves loud explosions, her minigun Pow-Pow and her rocket launcher Fishbones.' },
      passive: { name: { ru: 'Разошлась!', en: 'Get Excited!' }, desc: { ru: 'Если враждебный чемпион, которому Джинкс нанесла урон, погибает или рушится башня, она получает +60% скорости передвижения и +50% скорости атаки на 4 с.', en: 'When a champion Jinx damaged dies or a tower falls, she gains 60% move speed and 50% attack speed for 4 s.' } },
      abilities: [
        { key: 'Q', target: 'toggle', range: 0, cost: [0, 0, 0, 0, 0], cd: [0.9, 0.9, 0.9, 0.9, 0.9], v: { as: [0.1, 0.17, 0.24, 0.31, 0.38], rng: [75, 100, 125, 150, 175] },
          name: { ru: 'Смена оружия!', en: 'Switcheroo!' }, desc: { ru: 'Пыщ-Пыщ: каждая атака даёт +{as} скорости атаки (до 3 раз). Рыбоголовка: +{rng} к дальности, ракеты бьют по площади на 110% урона, но стоят 20 маны.', en: 'Pow-Pow: each attack grants {as} attack speed (stacks 3 times). Fishbones: +{rng} range, rockets deal 110% damage in an area but cost 20 mana.' } },
        { key: 'W', target: 'dir', range: 1450, cost: [50, 60, 70, 80, 90], cd: [8, 7, 6, 5, 4], v: { d: [10, 60, 110, 160, 210], adr: 1.4, slow: [0.3, 0.4, 0.5, 0.6, 0.7] },
          name: { ru: 'Бз-з-з!', en: 'Zap!' }, desc: { ru: 'После короткой подготовки стреляет электрическим разрядом: {d} (+{adr} СА) физического урона первому врагу и замедление на {slow} на 2 с.', en: 'After a short wind-up, fires a shock blast: {d} (+{adr} AD) physical damage to the first enemy and a {slow} slow for 2 s.' } },
        { key: 'E', target: 'point', range: 900, cost: [70, 70, 70, 70, 70], cd: [24, 20.5, 17, 13.5, 10], v: { d: [70, 120, 170, 220, 270], ap: 1 },
          name: { ru: 'Огнекусы!', en: 'Flame Chompers!' }, desc: { ru: 'Разбрасывает три капкана. Наступивший вражеский чемпион обездвижен на 1,5 с, а капканы взрываются: {d} (+{ap} СУ) магического урона.', en: 'Throws three chompers. An enemy champion stepping on one is rooted for 1.5 s and they explode for {d} (+{ap} AP) magic damage.' } },
        { key: 'R', target: 'dir', range: 30000, cost: [100, 100, 100], cd: [90, 75, 60], v: { d: [250, 350, 450], bad: 1.5, miss: [0.25, 0.3, 0.35] },
          name: { ru: 'Супермегасмертельная ракета!', en: 'Super Mega Death Rocket!' }, desc: { ru: 'Запускает ракету через всю карту. Она взрывается о первого чемпиона: до {d} (+{bad} доп. СА) + {miss} недостающего здоровья. Чем дальше летела, тем больнее.', en: 'Fires a map-wide rocket that explodes on the first champion: up to {d} (+{bad} bonus AD) + {miss} of missing health. Deals more damage the farther it flies.' } }
      ],
      skill: [0, 1, 2, 1, 1, 3, 1, 0, 1, 0, 3, 0, 0, 2, 2, 3, 2, 2],
      build: ['doranBlade', 'hpPot', 'boots', 'brawler', 'dagger', 'berserkers', 'zeal', 'bfSword', 'pickaxe', 'infinityEdge', 'phantomDancer', 'vampScepter', 'bloodthirster', 'guardianAngel'],
      scale: 1
    },
    garen: {
      name: 'Garen', title: { ru: 'Мощь Демасии', en: 'the Might of Demacia' }, roles: ['top'], ranged: false, manaless: true,
      color: '#4070d0',
      stats: { hp: 620, hpG: 84, mp: 0, mpG: 0, ad: 66, adG: 4.5, as: 0.625, asG: 3.65, armor: 36, armorG: 3, mr: 32, mrG: 1.25, ms: 340, range: 175, hpReg: 1.6, hpRegG: 0.1, mpReg: 0, mpRegG: 0 },
      lore: { ru: 'Гордый воин Демасии в сияющих латах. Не пользуется маной — только сталью и решимостью.', en: 'A proud warrior of Demacia in shining plate. He uses no mana, only steel and resolve.' },
      passive: { name: { ru: 'Стойкость', en: 'Perseverance' }, desc: { ru: 'Если Гарен 8 с не получал урона от чемпионов и башен, он восстанавливает 2% максимального здоровья в секунду.', en: 'If Garen has not taken damage from champions or towers for 8 s, he regenerates 2% of his maximum health per second.' } },
      abilities: [
        { key: 'Q', target: 'self', range: 0, cost: [0, 0, 0, 0, 0], cd: [8, 8, 8, 8, 8], v: { d: [30, 60, 90, 120, 150], adr: 1.4, t: [1.5, 2, 2.5, 3, 3.5] },
          name: { ru: 'Решающий удар', en: 'Decisive Strike' }, desc: { ru: 'Снимает замедления и даёт +30% скорости на {t} с. Следующая атака наносит {d} (+{adr} СА) физического урона и безмолвие на 1,5 с.', en: 'Removes slows and grants 30% move speed for {t} s. The next attack deals {d} (+{adr} AD) physical damage and silences for 1.5 s.' } },
        { key: 'W', target: 'self', range: 0, cost: [0, 0, 0, 0, 0], cd: [23, 21, 19, 17, 15], v: { t: [2, 2.5, 3, 3.5, 4] },
          name: { ru: 'Отвага', en: 'Courage' }, desc: { ru: 'На {t} с Гарен получает на 30% меньше урона и на 30% меньше длительность контроля.', en: 'For {t} s Garen takes 30% less damage and has 30% tenacity.' } },
        { key: 'E', target: 'self', range: 0, cost: [0, 0, 0, 0, 0], cd: [9, 9, 9, 9, 9], v: { d: [14, 18, 22, 26, 30], adr: 0.36 },
          name: { ru: 'Правосудие', en: 'Judgment' }, desc: { ru: 'Вращается с мечом 3 с, нанося {d} (+{adr} СА) физического урона всем врагам вокруг каждые 0,5 с. Во время вращения не может атаковать.', en: 'Spins for 3 s, dealing {d} (+{adr} AD) physical damage to nearby enemies every 0.5 s. Cannot attack while spinning.' } },
        { key: 'R', target: 'enemy', range: 400, cost: [0, 0, 0], cd: [120, 100, 80], v: { d: [150, 300, 450], miss: [0.25, 0.3, 0.35] },
          name: { ru: 'Правосудие Демасии', en: 'Demacian Justice' }, desc: { ru: 'Обрушивает на врага огромный меч: {d} + {miss} недостающего здоровья цели чистого урона.', en: 'Calls down a giant sword: {d} + {miss} of the target\'s missing health as true damage.' } }
      ],
      skill: [0, 2, 1, 2, 2, 3, 2, 0, 2, 0, 3, 0, 0, 1, 1, 3, 1, 1],
      build: ['doranShield', 'hpPot', 'boots', 'clothArmor', 'tabi', 'longSword', 'ruby', 'phage', 'giantsBelt', 'frozenMallet', 'chainVest', 'sunfire', 'warmog', 'guardianAngel'],
      scale: 1.1
    },
    annie: {
      name: 'Annie', title: { ru: 'Дитя тьмы', en: 'the Dark Child' }, roles: ['mid', 'support'], ranged: true,
      color: '#e04030', proj: { color: '#ff9030', speed: 1200 },
      stats: { hp: 524, hpG: 88, mp: 418, mpG: 25, ad: 50, adG: 2.6, as: 0.579, asG: 1.36, armor: 19, armorG: 4, mr: 30, mrG: 0, ms: 335, range: 625, hpReg: 1.1, hpRegG: 0.11, mpReg: 1.6, mpRegG: 0.16 },
      lore: { ru: 'Маленькая девочка с огромной силой огня и плюшевым мишкой Тибберсом, который иногда становится очень большим.', en: 'A little girl with tremendous fire magic and a teddy bear named Tibbers who sometimes becomes very, very big.' },
      passive: { name: { ru: 'Пиромания', en: 'Pyromania' }, desc: { ru: 'Каждое четвёртое умение Энни оглушает все поражённые цели на 1,5 с.', en: 'Every fourth spell Annie casts stuns all targets hit for 1.5 s.' } },
      abilities: [
        { key: 'Q', target: 'enemy', range: 625, cost: [60, 65, 70, 75, 80], cd: [4, 4, 4, 4, 4], v: { d: [80, 115, 150, 185, 220], ap: 0.8 },
          name: { ru: 'Испепеление', en: 'Disintegrate' }, desc: { ru: 'Бросает огненный шар: {d} (+{ap} СУ) магического урона. Если цель погибает, мана возвращается.', en: 'Hurls a fireball: {d} (+{ap} AP) magic damage. Refunds the mana if it kills.' } },
        { key: 'W', target: 'dir', range: 600, cost: [70, 80, 90, 100, 110], cd: [8, 8, 8, 8, 8], v: { d: [70, 115, 160, 205, 250], ap: 0.85 },
          name: { ru: 'Поджог', en: 'Incinerate' }, desc: { ru: 'Выпускает конус пламени: {d} (+{ap} СУ) магического урона всем врагам в нём.', en: 'Casts a cone of fire: {d} (+{ap} AP) magic damage to all enemies in it.' } },
        { key: 'E', target: 'self', range: 0, cost: [40, 40, 40, 40, 40], cd: [14, 14, 14, 14, 14], v: { s: [40, 90, 140, 190, 240], ap: 0.4, ret: [20, 30, 40, 50, 60] },
          name: { ru: 'Огненный щит', en: 'Molten Shield' }, desc: { ru: 'Окружает Энни пламенем на 3 с: щит {s} (+{ap} СУ), атакующие её получают {ret} магического урона.', en: 'Surrounds Annie with flame for 3 s: a {s} (+{ap} AP) shield, and attackers take {ret} magic damage.' } },
        { key: 'R', target: 'point', range: 600, cost: [100, 100, 100], cd: [120, 100, 80], v: { d: [150, 275, 400], ap: 0.75, hp: [1200, 2100, 3000] },
          name: { ru: 'Призыв: Тибберс', en: 'Summon: Tibbers' }, desc: { ru: 'Призывает огромного Тибберса: {d} (+{ap} СУ) магического урона по области. Медведь ({hp} здоровья) 45 с сражается рядом и жжёт врагов вокруг.', en: 'Summons giant Tibbers: {d} (+{ap} AP) magic damage in an area. The bear ({hp} health) fights for 45 s and burns nearby enemies.' } }
      ],
      skill: [0, 1, 0, 2, 0, 3, 0, 1, 0, 1, 3, 1, 1, 2, 2, 3, 2, 2],
      build: ['doranRing', 'hpPot', 'boots', 'tome', 'sorcShoes', 'blastingWand', 'rod', 'deathcap', 'giantsBelt', 'rylai', 'chainVest', 'zhonya', 'lichBane', 'banshee'],
      scale: 0.8
    },
    ashe: {
      name: 'Ashe', title: { ru: 'Ледяная лучница', en: 'the Frost Archer' }, roles: ['adc'], ranged: true,
      color: '#80c8ff', proj: { color: '#c0f0ff', speed: 2000 },
      stats: { hp: 570, hpG: 87, mp: 280, mpG: 32, ad: 59, adG: 2.95, as: 0.658, asG: 3.33, armor: 26, armorG: 3.4, mr: 30, mrG: 0, ms: 325, range: 600, hpReg: 0.7, hpRegG: 0.11, mpReg: 1.4, mpRegG: 0.1 },
      lore: { ru: 'Королева Фрельйорда. Её ледяные стрелы замедляют каждого, в кого попадают.', en: 'Queen of the Freljord, whose frost arrows slow everything they strike.' },
      passive: { name: { ru: 'Ледяной выстрел', en: 'Frost Shot' }, desc: { ru: 'Автоатаки Эш замедляют цель на 15–30% (от уровня) на 2 с.', en: 'Ashe\'s basic attacks slow the target by 15–30% (by level) for 2 s.' } },
      abilities: [
        { key: 'Q', target: 'self', range: 0, cost: [50, 50, 50, 50, 50], cd: [12, 12, 12, 12, 12], v: { as: [0.25, 0.3, 0.35, 0.4, 0.45] },
          name: { ru: 'Сосредоточенность', en: 'Ranger\'s Focus' }, desc: { ru: 'На 4 с скорость атаки увеличивается на {as}, а автоатаки выпускают залп из пяти стрел (+10% урона).', en: 'For 4 s gains {as} attack speed, and attacks fire a flurry of five arrows (+10% damage).' } },
        { key: 'W', target: 'dir', range: 1200, cost: [75, 70, 65, 60, 55], cd: [16, 13, 10, 7, 5], v: { d: [20, 35, 50, 65, 80], adr: 1, slow: [0.25, 0.3, 0.35, 0.4, 0.45] },
          name: { ru: 'Залп', en: 'Volley' }, desc: { ru: 'Выпускает веер из 9 стрел: {d} (+{adr} СА) физического урона каждому поражённому врагу и замедление на {slow} на 2 с.', en: 'Fires 9 arrows in a cone: {d} (+{adr} AD) physical damage to each enemy hit and a {slow} slow for 2 s.' } },
        { key: 'E', target: 'point', range: 5000, cost: [0, 0, 0, 0, 0], cd: [90, 80, 70, 60, 50], v: { r: [1000, 1000, 1000, 1000, 1000] },
          name: { ru: 'Ястреб', en: 'Hawkshot' }, desc: { ru: 'Посылает ястреба-разведчика: он открывает обзор в радиусе 1000 на 5 с.', en: 'Sends a hawk that reveals a 1000-radius area for 5 s.' } },
        { key: 'R', target: 'dir', range: 30000, cost: [100, 100, 100], cd: [100, 80, 60], v: { d: [200, 400, 600], ap: 1 },
          name: { ru: 'Кристальная стрела', en: 'Enchanted Crystal Arrow' }, desc: { ru: 'Выпускает огромную ледяную стрелу через всю карту: первый вражеский чемпион получает {d} (+{ap} СУ) магического урона и оглушение на 1–3,5 с (чем дальше, тем дольше).', en: 'Fires a huge ice arrow across the map: the first enemy champion takes {d} (+{ap} AP) magic damage and is stunned for 1–3.5 s (longer at range).' } }
      ],
      skill: [1, 0, 1, 2, 1, 3, 1, 0, 1, 0, 3, 0, 0, 2, 2, 3, 2, 2],
      build: ['doranBlade', 'hpPot', 'boots', 'dagger', 'berserkers', 'brawler', 'zeal', 'bfSword', 'pickaxe', 'infinityEdge', 'phantomDancer', 'vampScepter', 'bloodthirster', 'banshee'],
      scale: 1
    },
    masteryi: {
      name: 'Master Yi', title: { ru: 'Мастер Вуджу', en: 'the Wuju Bladesman' }, roles: ['jungle', 'top'], ranged: false,
      color: '#70d040',
      stats: { hp: 599, hpG: 92, mp: 251, mpG: 42, ad: 65, adG: 2.2, as: 0.679, asG: 2, armor: 33, armorG: 3, mr: 32, mrG: 1.25, ms: 355, range: 125, hpReg: 1.5, hpRegG: 0.13, mpReg: 1.5, mpRegG: 0.09 },
      lore: { ru: 'Последний мастер искусства Вуджу. Его клинок настолько быстр, что противники не успевают заметить удар.', en: 'The last master of Wuju, whose blade is so fast that foes never see the strike.' },
      passive: { name: { ru: 'Двойной удар', en: 'Double Strike' }, desc: { ru: 'Каждая четвёртая автоатака Мастера Йи бьёт дважды (второй удар — 50% урона).', en: 'Every fourth basic attack strikes twice (the second hit deals 50% damage).' } },
      abilities: [
        { key: 'Q', target: 'enemy', range: 600, cost: [50, 60, 70, 80, 90], cd: [18, 17, 16, 15, 14], v: { d: [25, 60, 95, 130, 165], adr: 0.9, mb: [75, 100, 125, 150, 175] },
          name: { ru: 'Альфа-удар', en: 'Alpha Strike' }, desc: { ru: 'Становится неуязвимым и молниеносно бьёт до 4 врагов: {d} (+{adr} СА) физического урона (+{mb} по миньонам и монстрам). Каждая автоатака сокращает перезарядку на 1 с.', en: 'Becomes untargetable and strikes up to 4 enemies: {d} (+{adr} AD) physical damage (+{mb} to minions and monsters). Each basic attack lowers the cooldown by 1 s.' } },
        { key: 'W', target: 'self', range: 0, cost: [50, 50, 50, 50, 50], cd: [28, 28, 28, 28, 28], v: { h: [30, 50, 70, 90, 110], ap: 0.5, red: [0.45, 0.5, 0.55, 0.6, 0.65] },
          name: { ru: 'Медитация', en: 'Meditate' }, desc: { ru: 'До 4 с медитирует: восстанавливает {h} (+{ap} СУ) здоровья каждые 0,5 с и получает на {red} меньше урона. Прерывается движением.', en: 'Channels for up to 4 s: restores {h} (+{ap} AP) health every 0.5 s and takes {red} less damage. Moving interrupts it.' } },
        { key: 'E', target: 'self', range: 0, cost: [0, 0, 0, 0, 0], cd: [14, 13, 12, 11, 10], v: { d: [30, 38, 46, 54, 62], badr: 0.3 },
          name: { ru: 'Стиль Вуджу', en: 'Wuju Style' }, desc: { ru: 'На 5 с автоатаки наносят {d} (+{badr} доп. СА) дополнительного чистого урона.', en: 'For 5 s basic attacks deal {d} (+{badr} bonus AD) bonus true damage.' } },
        { key: 'R', target: 'self', range: 0, cost: [100, 100, 100], cd: [85, 85, 85], v: { ms: [0.25, 0.35, 0.45], as: [0.3, 0.55, 0.8] },
          name: { ru: 'Горец', en: 'Highlander' }, desc: { ru: 'На 10 с: +{ms} скорости передвижения, +{as} скорости атаки, невосприимчивость к замедлениям. Убийства и помощь сокращают перезарядки других умений на 70%.', en: 'For 10 s: {ms} move speed, {as} attack speed and slow immunity. Takedowns reduce his other cooldowns by 70%.' } }
      ],
      skill: [0, 2, 0, 1, 0, 3, 0, 2, 0, 2, 3, 2, 2, 1, 1, 3, 1, 1],
      build: ['doranBlade', 'hpPot', 'longSword', 'boots', 'dagger', 'berserkers', 'vampScepter', 'bfSword', 'bloodthirster', 'zeal', 'phantomDancer', 'pickaxe', 'infinityEdge', 'guardianAngel'],
      scale: 1
    },
    malphite: {
      name: 'Malphite', title: { ru: 'Осколок монолита', en: 'Shard of the Monolith' }, roles: ['top', 'support'], ranged: false,
      color: '#b08050',
      stats: { hp: 574, hpG: 90, mp: 282, mpG: 40, ad: 62, adG: 4, as: 0.736, asG: 3, armor: 37, armorG: 3.75, mr: 32, mrG: 1.25, ms: 335, range: 125, hpReg: 1.4, hpRegG: 0.11, mpReg: 1.4, mpRegG: 0.11 },
      lore: { ru: 'Живая скала, осколок древнего монолита. Медленный, но неудержимый, когда разгонится.', en: 'A living rock, shard of an ancient monolith. Slow, yet unstoppable once he gets going.' },
      passive: { name: { ru: 'Гранитный щит', en: 'Granite Shield' }, desc: { ru: 'Если Мальфит 10 с не получал урона, его окутывает щит в 10% максимального здоровья.', en: 'After 10 s without taking damage, Malphite gains a shield worth 10% of his maximum health.' } },
      abilities: [
        { key: 'Q', target: 'enemy', range: 625, cost: [70, 75, 80, 85, 90], cd: [8, 8, 8, 8, 8], v: { d: [70, 120, 170, 220, 270], ap: 0.6, steal: [0.2, 0.25, 0.3, 0.35, 0.4] },
          name: { ru: 'Сейсмический осколок', en: 'Seismic Shard' }, desc: { ru: 'Бросает осколок земли: {d} (+{ap} СУ) магического урона и крадёт {steal} скорости передвижения на 4 с.', en: 'Flings a shard of earth: {d} (+{ap} AP) magic damage and steals {steal} move speed for 4 s.' } },
        { key: 'W', target: 'self', range: 0, cost: [25, 25, 25, 25, 25], cd: [10, 10, 10, 10, 10], v: { d: [30, 45, 60, 75, 90], ap: 0.2 },
          name: { ru: 'Громовой хлопок', en: 'Thunderclap' }, desc: { ru: 'На 6 с автоатаки наносят {d} (+{ap} СУ, +10% брони) доп. физического урона по цели и всем врагам рядом с ней.', en: 'For 6 s basic attacks deal {d} (+{ap} AP, +10% armor) bonus physical damage to the target and enemies around it.' } },
        { key: 'E', target: 'self', range: 0, cost: [50, 55, 60, 65, 70], cd: [7, 7, 7, 7, 7], v: { d: [60, 95, 130, 165, 200], ap: 0.4, slow: [0.3, 0.35, 0.4, 0.45, 0.5] },
          name: { ru: 'Удар о землю', en: 'Ground Slam' }, desc: { ru: 'Бьёт по земле: {d} (+{ap} СУ, +30% брони) магического урона врагам вокруг и снижение их скорости атаки на {slow} на 3 с.', en: 'Slams the ground: {d} (+{ap} AP, +30% armor) magic damage to nearby enemies and reduces their attack speed by {slow} for 3 s.' } },
        { key: 'R', target: 'point', range: 1000, cost: [100, 100, 100], cd: [130, 105, 80], v: { d: [200, 300, 400], ap: 0.8 },
          name: { ru: 'Неудержимая сила', en: 'Unstoppable Force' }, desc: { ru: 'Проносится к точке и врезается во врагов: {d} (+{ap} СУ) магического урона и подбрасывание на 1,5 с в радиусе 300.', en: 'Charges to a location, dealing {d} (+{ap} AP) magic damage and knocking enemies up for 1.5 s in a 300 radius.' } }
      ],
      skill: [0, 2, 0, 1, 0, 3, 0, 2, 0, 2, 3, 2, 2, 1, 1, 3, 1, 1],
      build: ['doranShield', 'hpPot', 'boots', 'clothArmor', 'tabi', 'chainVest', 'sapphire', 'frozenHeart', 'ruby', 'giantsBelt', 'sunfire', 'thornmail', 'banshee', 'warmog'],
      scale: 1.25
    },
    teemo: {
      name: 'Teemo', title: { ru: 'Проворный разведчик', en: 'the Swift Scout' }, roles: ['top', 'mid'], ranged: true,
      color: '#c0a040', proj: { color: '#a0ff40', speed: 1300 },
      stats: { hp: 598, hpG: 104, mp: 334, mpG: 25, ad: 54, adG: 3, as: 0.69, asG: 3.38, armor: 24, armorG: 3.75, mr: 30, mrG: 0, ms: 330, range: 500, hpReg: 1.1, hpRegG: 0.13, mpReg: 1.9, mpRegG: 0.09 },
      lore: { ru: 'Отважный йордл-скаут. Расставляет ядовитые грибы по всему Ущелью и хихикает из кустов.', en: 'A brave yordle scout who litters the Rift with poisonous mushrooms and giggles from the brush.' },
      passive: { name: { ru: 'Партизанская война', en: 'Guerrilla Warfare' }, desc: { ru: 'Если Тимо стоит неподвижно 1,5 с, он становится невидимым. Выйдя из невидимости, получает +40% скорости атаки на 3 с.', en: 'Standing still for 1.5 s makes Teemo invisible. Leaving stealth grants 40% attack speed for 3 s.' } },
      abilities: [
        { key: 'Q', target: 'enemy', range: 680, cost: [70, 75, 80, 85, 90], cd: [8, 8, 8, 8, 8], v: { d: [80, 125, 170, 215, 260], ap: 0.8, t: [1.5, 1.75, 2, 2.25, 2.5] },
          name: { ru: 'Ослепляющий дротик', en: 'Blinding Dart' }, desc: { ru: 'Плюёт ядовитым дротиком: {d} (+{ap} СУ) магического урона и ослепление на {t} с — атаки цели промахиваются.', en: 'Fires a toxic dart: {d} (+{ap} AP) magic damage and blinds for {t} s, making the target\'s attacks miss.' } },
        { key: 'W', target: 'self', range: 0, cost: [40, 40, 40, 40, 40], cd: [17, 17, 17, 17, 17], v: { ms: [0.1, 0.14, 0.18, 0.22, 0.26] },
          name: { ru: 'Быстрый шаг', en: 'Move Quick' }, desc: { ru: 'Пассивно: +{ms} скорости передвижения, пока Тимо не получает урон. Активно: удваивает бонус на 3 с.', en: 'Passive: {ms} move speed while not taking damage. Active: doubles the bonus for 3 s.' } },
        { key: 'E', target: 'passive', range: 0, cost: [0, 0, 0, 0, 0], cd: [0, 0, 0, 0, 0], v: { d: [14, 25, 36, 47, 58], ap: 0.3, dot: [6, 12, 18, 24, 30] },
          name: { ru: 'Ядовитый выстрел', en: 'Toxic Shot' }, desc: { ru: 'Пассивно: автоатаки наносят {d} (+{ap} СУ) магического урона и отравляют цель ещё на {dot} урона в секунду в течение 4 с.', en: 'Passive: basic attacks deal {d} (+{ap} AP) magic damage and poison the target for {dot} damage per second over 4 s.' } },
        { key: 'R', target: 'point', range: 400, cost: [75, 75, 75], cd: [1, 1, 1], v: { d: [200, 325, 450], ap: 0.5, charges: [3, 4, 5], rech: [35, 31, 27] },
          name: { ru: 'Ядовитая ловушка', en: 'Noxious Trap' }, desc: { ru: 'Ставит невидимый гриб (до {charges} зарядов, новый каждые {rech} с). Наступивший враг взрывает его: {d} (+{ap} СУ) магического урона за 4 с и замедление на 40% всем рядом.', en: 'Places an invisible mushroom (up to {charges} charges, one every {rech} s). An enemy stepping on it takes {d} (+{ap} AP) magic damage over 4 s and nearby enemies are slowed by 40%.' } }
      ],
      skill: [2, 0, 1, 2, 2, 3, 2, 0, 2, 0, 3, 0, 0, 1, 1, 3, 1, 1],
      build: ['doranRing', 'hpPot', 'boots', 'dagger', 'berserkers', 'tome', 'blastingWand', 'lichBane', 'zeal', 'phantomDancer', 'rod', 'deathcap', 'zhonya', 'rylai'],
      scale: 0.78
    },
    ryze: {
      name: 'Ryze', title: { ru: 'Маг-изгнанник', en: 'the Rogue Mage' }, roles: ['mid', 'top'], ranged: true,
      color: '#3080ff', proj: { color: '#60c0ff', speed: 1400 },
      stats: { hp: 575, hpG: 86, mp: 400, mpG: 55, ad: 58, adG: 3, as: 0.625, asG: 2.1, armor: 22, armorG: 3.9, mr: 30, mrG: 0, ms: 340, range: 550, hpReg: 1.6, hpRegG: 0.1, mpReg: 1.8, mpRegG: 0.16 },
      lore: { ru: 'Старый синекожий маг со свитком за спиной. Сила его заклинаний растёт вместе с запасом маны.', en: 'An ancient blue-skinned mage with a scroll on his back. His spells grow stronger with his mana.' },
      passive: { name: { ru: 'Магическое мастерство', en: 'Arcane Mastery' }, desc: { ru: 'Каждое применённое умение сокращает перезарядку остальных умений Райза на 1 с.', en: 'Each spell Ryze casts reduces the cooldown of his other spells by 1 s.' } },
      abilities: [
        { key: 'Q', target: 'enemy', range: 650, cost: [30, 35, 40, 45, 50], cd: [3.5, 3.5, 3.5, 3.5, 3.5], v: { d: [60, 85, 110, 135, 160], ap: 0.4, mana: 0.065 },
          name: { ru: 'Перегрузка', en: 'Overload' }, desc: { ru: 'Метает сгусток энергии: {d} (+{ap} СУ, +6,5% макс. маны) магического урона.', en: 'Throws a charge of energy: {d} (+{ap} AP, +6.5% max mana) magic damage.' } },
        { key: 'W', target: 'enemy', range: 600, cost: [80, 90, 100, 110, 120], cd: [14, 14, 14, 14, 14], v: { d: [60, 95, 130, 165, 200], ap: 0.6, mana: 0.045, t: [0.75, 1, 1.25, 1.5, 1.75] },
          name: { ru: 'Рунная тюрьма', en: 'Rune Prison' }, desc: { ru: 'Обездвиживает врага на {t} с и наносит {d} (+{ap} СУ, +4,5% макс. маны) магического урона.', en: 'Roots an enemy for {t} s and deals {d} (+{ap} AP, +4.5% max mana) magic damage.' } },
        { key: 'E', target: 'enemy', range: 675, cost: [60, 70, 80, 90, 100], cd: [14, 14, 14, 14, 14], v: { d: [50, 70, 90, 110, 130], ap: 0.35, mana: 0.01 },
          name: { ru: 'Поток заклинаний', en: 'Spell Flux' }, desc: { ru: 'Выпускает сферу, прыгающую между врагами до 5 раз: {d} (+{ap} СУ, +1% маны) магического урона и −15 к сопротивлению магии.', en: 'Unleashes an orb that bounces up to 5 times: {d} (+{ap} AP, +1% mana) magic damage and −15 magic resist.' } },
        { key: 'R', target: 'self', range: 0, cost: [0, 0, 0], cd: [70, 60, 50], v: { t: [6, 7, 8], sv: [0.15, 0.2, 0.25], ms: [35, 45, 55] },
          name: { ru: 'Отчаянная сила', en: 'Desperate Power' }, desc: { ru: 'На {t} с Райз получает +{ms} скорости передвижения и {sv} вампиризма заклинаний, а его умения поражают всех врагов вокруг цели (50% урона).', en: 'For {t} s Ryze gains {ms} move speed and {sv} spell vamp, and his spells splash to enemies around the target (50% damage).' } }
      ],
      skill: [0, 1, 2, 0, 0, 3, 0, 1, 0, 1, 3, 1, 1, 2, 2, 3, 2, 2],
      build: ['sapphire', 'hpPot', 'boots', 'tome', 'ionian', 'blastingWand', 'archangel', 'giantsBelt', 'rylai', 'frozenHeart', 'rod', 'deathcap', 'banshee', 'zhonya'],
      scale: 1
    },
    alistar: {
      name: 'Alistar', title: { ru: 'Минотавр', en: 'the Minotaur' }, roles: ['support', 'top'], ranged: false,
      color: '#8060a0',
      stats: { hp: 613, hpG: 106, mp: 350, mpG: 40, ad: 62, adG: 3.6, as: 0.625, asG: 2.1, armor: 44, armorG: 3.5, mr: 32, mrG: 1.25, ms: 330, range: 125, hpReg: 1.7, hpRegG: 0.17, mpReg: 1.7, mpRegG: 0.16 },
      lore: { ru: 'Могучий минотавр, вырвавшийся из цепей. Подбрасывает врагов рогами и лечит друзей боевым рёвом.', en: 'A mighty minotaur who broke his chains, tossing foes with his horns and healing friends with a war roar.' },
      passive: { name: { ru: 'Топот', en: 'Trample' }, desc: { ru: 'После применения умения Алистар 3 с топчет землю, нанося врагам рядом с собой магический урон каждые 0,25 с.', en: 'After casting a spell, Alistar tramples for 3 s, dealing magic damage to nearby enemies every 0.25 s.' } },
      abilities: [
        { key: 'Q', target: 'self', range: 365, cost: [65, 70, 75, 80, 85], cd: [17, 16, 15, 14, 13], v: { d: [60, 105, 150, 195, 240], ap: 0.5 },
          name: { ru: 'Сокрушение', en: 'Pulverize' }, desc: { ru: 'Бьёт по земле: {d} (+{ap} СУ) магического урона и подбрасывание на 1 с всех врагов вокруг.', en: 'Smashes the ground: {d} (+{ap} AP) magic damage and knocks nearby enemies up for 1 s.' } },
        { key: 'W', target: 'enemy', range: 650, cost: [70, 75, 80, 85, 90], cd: [14, 13, 12, 11, 10], v: { d: [55, 110, 165, 220, 275], ap: 0.7 },
          name: { ru: 'Удар головой', en: 'Headbutt' }, desc: { ru: 'Бросается на врага: {d} (+{ap} СУ) магического урона и отбрасывание на 650 единиц.', en: 'Rams an enemy: {d} (+{ap} AP) magic damage and knocks it back 650 units.' } },
        { key: 'E', target: 'self', range: 575, cost: [40, 50, 60, 70, 80], cd: [12, 12, 12, 12, 12], v: { h: [60, 90, 120, 150, 180], ap: 0.2 },
          name: { ru: 'Победный рёв', en: 'Triumphant Roar' }, desc: { ru: 'Ревёт, восстанавливая себе {h} (+{ap} СУ) здоровья, а союзникам рядом — половину этого.', en: 'Roars, restoring {h} (+{ap} AP) health to himself and half as much to nearby allies.' } },
        { key: 'R', target: 'self', range: 0, cost: [100, 100, 100], cd: [120, 100, 80], v: { ad: [60, 70, 80] },
          name: { ru: 'Несокрушимая воля', en: 'Unbreakable Will' }, desc: { ru: 'Снимает весь контроль. На 7 с Алистар получает +{ad} силы атаки и на 70% меньше урона.', en: 'Removes all crowd control. For 7 s Alistar gains {ad} attack damage and takes 70% less damage.' } }
      ],
      skill: [0, 1, 2, 0, 2, 3, 0, 2, 0, 2, 3, 0, 2, 1, 1, 3, 1, 1],
      build: ['doranShield', 'hpPot', 'ward', 'boots', 'ruby', 'mercs', 'ward', 'sapphire', 'frozenHeart', 'giantsBelt', 'sunfire', 'banshee', 'thornmail', 'warmog'],
      scale: 1.3
    }
  };
  const CHAMP_ORDER = ['lulu', 'jinx', 'garen', 'annie', 'ashe', 'masteryi', 'malphite', 'teemo', 'ryze', 'alistar'];

  const ITEMS = {
    hpPot: { cost: 35, cat: 'cons', stack: 5, use: 'hpPot', name: { ru: 'Зелье здоровья', en: 'Health Potion' }, desc: { ru: 'Использовать: восстанавливает 150 здоровья за 15 с.', en: 'Use: restores 150 health over 15 s.' } },
    manaPot: { cost: 35, cat: 'cons', stack: 5, use: 'manaPot', name: { ru: 'Зелье маны', en: 'Mana Potion' }, desc: { ru: 'Использовать: восстанавливает 100 маны за 15 с.', en: 'Use: restores 100 mana over 15 s.' } },
    ward: { cost: 75, cat: 'cons', stack: 3, use: 'ward', name: { ru: 'Тотем обзора', en: 'Sight Ward' }, desc: { ru: 'Использовать: ставит невидимый тотем, дающий обзор в радиусе 1100 на 3 минуты.', en: 'Use: places an invisible ward that grants 1100 vision for 3 minutes.' } },
    visionWard: { cost: 125, cat: 'cons', stack: 2, use: 'visionWard', name: { ru: 'Тотем истинного зрения', en: 'Vision Ward' }, desc: { ru: 'Использовать: ставит тотем на 3 минуты, который видит невидимых врагов, ловушки и тотемы.', en: 'Use: places a ward for 3 minutes that reveals stealthed enemies, traps and wards.' } },
    doranBlade: { cost: 475, cat: 'start', stats: { ad: 10, hp: 80, ls: 0.03 }, name: { ru: 'Клинок Дорана', en: 'Doran\'s Blade' } },
    doranRing: { cost: 475, cat: 'start', stats: { ap: 15, hp: 80, mpReg: 1 }, name: { ru: 'Кольцо Дорана', en: 'Doran\'s Ring' } },
    doranShield: { cost: 475, cat: 'start', stats: { hp: 120, armor: 10, hpReg: 1.6 }, name: { ru: 'Щит Дорана', en: 'Doran\'s Shield' } },
    longSword: { cost: 400, cat: 'basic', stats: { ad: 10 }, name: { ru: 'Длинный меч', en: 'Long Sword' } },
    tome: { cost: 435, cat: 'basic', stats: { ap: 20 }, name: { ru: 'Магический фолиант', en: 'Amplifying Tome' } },
    clothArmor: { cost: 300, cat: 'basic', stats: { armor: 15 }, name: { ru: 'Тканевый доспех', en: 'Cloth Armor' } },
    nullMantle: { cost: 400, cat: 'basic', stats: { mr: 20 }, name: { ru: 'Антимагический плащ', en: 'Null-Magic Mantle' } },
    ruby: { cost: 475, cat: 'basic', stats: { hp: 180 }, name: { ru: 'Рубиновый кристалл', en: 'Ruby Crystal' } },
    sapphire: { cost: 400, cat: 'basic', stats: { mp: 200 }, name: { ru: 'Сапфировый кристалл', en: 'Sapphire Crystal' } },
    dagger: { cost: 400, cat: 'basic', stats: { asp: 0.15 }, name: { ru: 'Кинжал', en: 'Dagger' } },
    brawler: { cost: 400, cat: 'basic', stats: { crit: 0.08 }, name: { ru: 'Перчатки драчуна', en: 'Brawler\'s Gloves' } },
    boots: { cost: 350, cat: 'boots', boots: true, stats: { msFlat: 25 }, name: { ru: 'Сапоги скорости', en: 'Boots of Speed' } },
    bfSword: { cost: 1550, cat: 'attack', stats: { ad: 45 }, name: { ru: 'Большой меч', en: 'B. F. Sword' } },
    pickaxe: { cost: 875, cat: 'attack', stats: { ad: 25 }, name: { ru: 'Кирка', en: 'Pickaxe' } },
    rod: { cost: 1600, cat: 'magic', stats: { ap: 60 }, name: { ru: 'Слишком большой жезл', en: 'Needlessly Large Rod' } },
    blastingWand: { cost: 860, cat: 'magic', stats: { ap: 40 }, name: { ru: 'Взрывной жезл', en: 'Blasting Wand' } },
    chainVest: { cost: 800, cat: 'defense', from: ['clothArmor'], stats: { armor: 40 }, name: { ru: 'Кольчуга', en: 'Chain Vest' } },
    giantsBelt: { cost: 1000, cat: 'defense', from: ['ruby'], stats: { hp: 380 }, name: { ru: 'Пояс великана', en: 'Giant\'s Belt' } },
    vampScepter: { cost: 900, cat: 'attack', from: ['longSword'], stats: { ad: 15, ls: 0.1 }, name: { ru: 'Вампирский скипетр', en: 'Vampiric Scepter' } },
    sheen: { cost: 1000, cat: 'magic', from: ['sapphire'], stats: { mp: 200, ap: 20 }, passive: 'spellblade1', name: { ru: 'Сияние', en: 'Sheen' }, desc: { ru: 'После применения умения следующая атака наносит +100% базовой силы атаки.', en: 'After casting a spell, the next attack deals +100% base AD.' } },
    phage: { cost: 1250, cat: 'attack', from: ['ruby', 'longSword'], stats: { hp: 200, ad: 15 }, passive: 'icy', name: { ru: 'Фаг', en: 'Phage' }, desc: { ru: 'Атаки замедляют цель на 20% на 1,5 с.', en: 'Attacks slow the target by 20% for 1.5 s.' } },
    zeal: { cost: 1150, cat: 'attack', from: ['brawler', 'dagger'], stats: { asp: 0.18, crit: 0.1, msPct: 0.05 }, name: { ru: 'Рвение', en: 'Zeal' } },
    berserkers: { cost: 1000, cat: 'boots', from: ['boots', 'dagger'], stats: { asp: 0.25, msFlat: 45 }, boots: true, name: { ru: 'Сапоги берсерка', en: 'Berserker\'s Greaves' } },
    sorcShoes: { cost: 1000, cat: 'boots', from: ['boots'], stats: { mpen: 15, msFlat: 45 }, boots: true, name: { ru: 'Сапоги чародея', en: 'Sorcerer\'s Shoes' } },
    tabi: { cost: 1000, cat: 'boots', from: ['boots', 'clothArmor'], stats: { armor: 25, msFlat: 45 }, boots: true, name: { ru: 'Сапоги ниндзя', en: 'Ninja Tabi' }, desc: { ru: 'Снижает урон от автоатак на 10%.', en: 'Reduces damage from basic attacks by 10%.' }, passive: 'tabi' },
    mercs: { cost: 1100, cat: 'boots', from: ['boots', 'nullMantle'], stats: { mr: 25, msFlat: 45, ten: 0.35 }, boots: true, name: { ru: 'Ртутные сапоги', en: 'Mercury\'s Treads' }, desc: { ru: 'Сокращает длительность контроля на 35%.', en: 'Reduces the duration of crowd control by 35%.' } },
    ionian: { cost: 1000, cat: 'boots', from: ['boots'], stats: { cdr: 0.15, msFlat: 45 }, boots: true, name: { ru: 'Ионийские сапоги', en: 'Ionian Boots of Lucidity' } },
    infinityEdge: { cost: 3400, cat: 'attack', from: ['bfSword', 'pickaxe', 'brawler'], stats: { ad: 70, crit: 0.25 }, passive: 'ie', name: { ru: 'Грань бесконечности', en: 'Infinity Edge' }, desc: { ru: 'Критические удары наносят 250% урона вместо 200%.', en: 'Critical strikes deal 250% damage instead of 200%.' } },
    bloodthirster: { cost: 3200, cat: 'attack', from: ['bfSword', 'vampScepter'], stats: { ad: 75, ls: 0.2 }, name: { ru: 'Кровопийца', en: 'The Bloodthirster' } },
    phantomDancer: { cost: 2800, cat: 'attack', from: ['zeal', 'dagger'], stats: { asp: 0.5, crit: 0.3, msPct: 0.07 }, name: { ru: 'Призрачный танцор', en: 'Phantom Dancer' } },
    trinity: { cost: 3800, cat: 'attack', from: ['sheen', 'phage', 'zeal'], stats: { ad: 30, ap: 30, asp: 0.3, crit: 0.12, hp: 250, mp: 250, msPct: 0.08 }, passive: 'spellblade2', name: { ru: 'Трикратная сила', en: 'Trinity Force' }, desc: { ru: 'После умения следующая атака наносит +150% базовой силы атаки. Атаки замедляют.', en: 'After a spell, the next attack deals +150% base AD. Attacks slow.' } },
    frozenMallet: { cost: 3000, cat: 'attack', from: ['phage', 'giantsBelt'], stats: { hp: 700, ad: 30 }, passive: 'icy2', name: { ru: 'Ледяной молот', en: 'Frozen Mallet' }, desc: { ru: 'Атаки замедляют цель на 40% на 1,5 с.', en: 'Attacks slow the target by 40% for 1.5 s.' } },
    deathcap: { cost: 3600, cat: 'magic', from: ['rod', 'blastingWand'], stats: { ap: 120 }, passive: 'deathcap', name: { ru: 'Смертельная шляпа Рабадона', en: 'Rabadon\'s Deathcap' }, desc: { ru: 'Увеличивает силу умений на 30%.', en: 'Increases ability power by 30%.' } },
    zhonya: { cost: 3200, cat: 'magic', from: ['rod', 'chainVest'], stats: { ap: 100, armor: 50 }, active: 'stasis', activeCd: 90, name: { ru: 'Песочные часы Жони', en: 'Zhonya\'s Hourglass' }, desc: { ru: 'Использовать: на 2,5 с вы становитесь неуязвимым, но не можете действовать.', en: 'Use: become invulnerable but unable to act for 2.5 s.' } },
    archangel: { cost: 2700, cat: 'magic', from: ['sapphire', 'blastingWand'], stats: { mp: 500, ap: 50, mpReg: 2 }, passive: 'archangel', name: { ru: 'Посох архангела', en: 'Archangel\'s Staff' }, desc: { ru: 'Даёт силу умений в размере 3% максимальной маны.', en: 'Grants ability power equal to 3% of maximum mana.' } },
    lichBane: { cost: 3000, cat: 'magic', from: ['sheen', 'blastingWand'], stats: { ap: 80, mp: 250, msPct: 0.05 }, passive: 'lich', name: { ru: 'Проклятие лича', en: 'Lich Bane' }, desc: { ru: 'После умения следующая атака наносит +75% СУ магического урона.', en: 'After a spell, the next attack deals +75% AP magic damage.' } },
    rylai: { cost: 3100, cat: 'magic', from: ['blastingWand', 'giantsBelt'], stats: { ap: 80, hp: 500 }, passive: 'rylai', name: { ru: 'Кристальный скипетр Рилай', en: 'Rylai\'s Crystal Scepter' }, desc: { ru: 'Урон от умений замедляет врагов на 15% на 1,5 с.', en: 'Damaging spells slow enemies by 15% for 1.5 s.' } },
    sunfire: { cost: 2600, cat: 'defense', from: ['chainVest', 'giantsBelt'], stats: { hp: 450, armor: 35 }, passive: 'sunfire', name: { ru: 'Плащ Солнечного пламени', en: 'Sunfire Cape' }, desc: { ru: 'Обжигает врагов рядом: 30 магического урона в секунду.', en: 'Burns nearby enemies for 30 magic damage per second.' } },
    thornmail: { cost: 2300, cat: 'defense', from: ['chainVest', 'clothArmor'], stats: { armor: 100 }, passive: 'thorns', name: { ru: 'Терновый жилет', en: 'Thornmail' }, desc: { ru: 'Возвращает атакующим 30% урона от их автоатак в виде магического урона.', en: 'Returns 30% of basic attack damage taken as magic damage.' } },
    warmog: { cost: 2800, cat: 'defense', from: ['giantsBelt', 'ruby'], stats: { hp: 850, hpReg: 4 }, name: { ru: 'Доспех Вармога', en: 'Warmog\'s Armor' } },
    banshee: { cost: 2600, cat: 'defense', from: ['giantsBelt', 'nullMantle'], stats: { hp: 400, mr: 55, mp: 250 }, passive: 'spellshield', name: { ru: 'Покров банши', en: 'Banshee\'s Veil' }, desc: { ru: 'Раз в 45 с блокирует одно вражеское умение.', en: 'Blocks one enemy ability every 45 s.' } },
    frozenHeart: { cost: 2800, cat: 'defense', from: ['chainVest', 'sapphire'], stats: { armor: 90, mp: 400, cdr: 0.2 }, passive: 'frozenHeart', name: { ru: 'Ледяное сердце', en: 'Frozen Heart' }, desc: { ru: 'Снижает скорость атаки врагов рядом на 20%.', en: 'Reduces the attack speed of nearby enemies by 20%.' } },
    guardianAngel: { cost: 2800, cat: 'defense', from: ['chainVest', 'nullMantle'], stats: { armor: 50, mr: 40 }, passive: 'revive', name: { ru: 'Ангел-хранитель', en: 'Guardian Angel' }, desc: { ru: 'Раз в 5 минут после гибели воскрешает вас через 4 с с 30% здоровья.', en: 'Once every 5 minutes, revives you 4 s after death with 30% health.' } }
  };
  const SHOP_TABS = [
    { id: 'rec', name: { ru: 'Совет', en: 'Advice' } },
    { id: 'cons', name: { ru: 'Расходуемые', en: 'Consumables' } },
    { id: 'attack', name: { ru: 'Атака', en: 'Attack' }, cats: ['start', 'basic', 'attack'], filter: s => s.ad || s.asp || s.crit || s.ls },
    { id: 'magic', name: { ru: 'Магия', en: 'Magic' }, cats: ['start', 'basic', 'magic'], filter: s => s.ap || s.mp || s.mpReg || s.cdr },
    { id: 'defense', name: { ru: 'Защита', en: 'Defense' }, cats: ['start', 'basic', 'defense'], filter: s => s.hp || s.armor || s.mr || s.hpReg },
    { id: 'boots', name: { ru: 'Сапоги', en: 'Boots' }, cats: ['boots'] }
  ];
  const STAT_NAMES = {
    ad: { ru: 'Сила атаки', en: 'Attack Damage' }, ap: { ru: 'Сила умений', en: 'Ability Power' }, hp: { ru: 'Здоровье', en: 'Health' }, mp: { ru: 'Мана', en: 'Mana' },
    armor: { ru: 'Броня', en: 'Armor' }, mr: { ru: 'Сопр. магии', en: 'Magic Resist' }, asp: { ru: 'Скорость атаки', en: 'Attack Speed' }, crit: { ru: 'Шанс крита', en: 'Critical Chance' },
    ls: { ru: 'Вампиризм', en: 'Life Steal' }, msFlat: { ru: 'Скорость', en: 'Move Speed' }, msPct: { ru: 'Скорость', en: 'Move Speed' }, hpReg: { ru: 'Восст. здоровья/с', en: 'Health Regen/s' },
    mpReg: { ru: 'Восст. маны/с', en: 'Mana Regen/s' }, cdr: { ru: 'Сокр. перезарядки', en: 'Cooldown Reduction' }, mpen: { ru: 'Магич. пробивание', en: 'Magic Pen.' }, ten: { ru: 'Стойкость', en: 'Tenacity' }
  };
  const PCT_STATS = new Set(['asp', 'crit', 'ls', 'msPct', 'cdr', 'ten']);

  const SPELLS = {
    flash: { cd: 255, target: 'point', range: 425, color: '#ffe060', name: { ru: 'Скачок', en: 'Flash' }, desc: { ru: 'Мгновенно переносит чемпиона на небольшое расстояние к курсору.', en: 'Teleports your champion a short distance toward the cursor.' } },
    heal: { cd: 240, target: 'self', color: '#60ff60', name: { ru: 'Исцеление', en: 'Heal' }, desc: { ru: 'Восстанавливает 90 + 15 за уровень здоровья вам и ближайшему союзнику, ускоряет на 30% на 1 с.', en: 'Restores 90 + 15 per level health to you and the nearest ally and grants 30% speed for 1 s.' } },
    ignite: { cd: 180, target: 'enemy', range: 600, color: '#ff6020', name: { ru: 'Воспламенение', en: 'Ignite' }, desc: { ru: 'Поджигает вражеского чемпиона: 50 + 20 за уровень чистого урона за 5 с и снижение лечения.', en: 'Ignites an enemy champion: 50 + 20 per level true damage over 5 s and reduced healing.' } },
    ghost: { cd: 210, target: 'self', color: '#a0e0ff', name: { ru: 'Призрак', en: 'Ghost' }, desc: { ru: '+30% скорости передвижения на 10 с, можно проходить сквозь существ.', en: '+30% move speed for 10 s and you can pass through units.' } },
    exhaust: { cd: 210, target: 'enemy', range: 650, color: '#ffa040', name: { ru: 'Изнурение', en: 'Exhaust' }, desc: { ru: 'На 2,5 с замедляет врага на 30% и снижает наносимый им урон на 40%.', en: 'Slows an enemy by 30% and reduces its damage dealt by 40% for 2.5 s.' } },
    barrier: { cd: 210, target: 'self', color: '#ffff80', name: { ru: 'Барьер', en: 'Barrier' }, desc: { ru: 'Щит на 115 + 20 за уровень на 2 с.', en: 'A 115 + 20 per level shield for 2 s.' } },
    smite: { cd: 75, target: 'enemy', range: 550, color: '#ffd040', name: { ru: 'Кара', en: 'Smite' }, desc: { ru: 'Наносит 390 + 20 за уровень чистого урона монстру или миньону.', en: 'Deals 390 + 20 per level true damage to a monster or minion.' } }
  };
  const SPELL_ORDER = ['flash', 'heal', 'ignite', 'ghost', 'exhaust', 'barrier', 'smite'];

  const MINIONS = {
    melee: { hp: 455, hpG: 20, ad: 12, adG: 0.5, as: 1.25, range: 110, armor: 0, mr: 0, ms: 325, r: 48, gold: 20, xp: 59, towerPct: 0.45 },
    caster: { hp: 290, hpG: 12, ad: 23, adG: 1, as: 0.667, range: 550, armor: 0, mr: 0, ms: 325, r: 48, gold: 15, xp: 29, towerPct: 0.7, proj: 650 },
    siege: { hp: 850, hpG: 30, ad: 40, adG: 1.5, as: 1, range: 300, armor: 15, mr: 0, ms: 325, r: 65, gold: 45, xp: 92, towerPct: 0.14, proj: 1200 },
    super: { hp: 1500, hpG: 100, ad: 190, adG: 5, as: 0.85, range: 170, armor: 30, mr: -30, ms: 325, r: 70, gold: 40, xp: 97, towerPct: 0.07 }
  };
  const TOWER = { range: 775, ad: 152, adG: 4, as: 0.83, armor: 60, mr: 60, r: 88 };
  const TOWER_HP = { outer: 2800, inner: 3000, inhib: 3300, nexus: 2800 };
  const MONSTERS = {
    wolf: { hp: 820, ad: 20, as: 0.625, armor: 9, mr: 0, r: 60, gold: 55, xp: 110, size: 1 },
    wolfling: { hp: 260, ad: 9, as: 0.625, armor: 6, mr: 0, r: 40, gold: 8, xp: 24, size: 0.7 },
    raptor: { hp: 560, ad: 13, as: 0.7, armor: 15, mr: 0, r: 55, gold: 35, xp: 50, size: 1 },
    raptorling: { hp: 170, ad: 7, as: 0.7, armor: 0, mr: 0, r: 35, gold: 8, xp: 18, size: 0.65 },
    krug: { hp: 900, ad: 26, as: 0.6, armor: 12, mr: 0, r: 75, gold: 70, xp: 135, size: 1 },
    gromp: { hp: 1050, ad: 32, as: 0.5, armor: 0, mr: -10, r: 80, gold: 85, xp: 135, size: 1 },
    blue: { hp: 1400, ad: 36, as: 0.5, armor: 10, mr: -15, r: 95, gold: 100, xp: 200, size: 1, buff: 'blue' },
    red: { hp: 1400, ad: 36, as: 0.5, armor: 10, mr: -15, r: 95, gold: 100, xp: 200, size: 1, buff: 'red' },
    dragon: { hp: 3500, ad: 95, as: 0.5, armor: 21, mr: 30, r: 130, gold: 50, xp: 300, size: 1, teamGold: 150, ranged: true },
    baron: { hp: 8800, ad: 170, as: 0.75, armor: 80, mr: 70, r: 170, gold: 25, xp: 600, size: 1, teamGold: 300, ranged: true }
  };
  const BOT_NAMES = ['xXDarkLordXx', 'Neo_1999', 'Pr0Gam3r', 'Vasya_RU', 'Morpheus', 'l33t_h4x0r', 'SiLeNt_BoB', 'Dr.Evil', 'ZeroCool', 'AcidBurn', 'Nagibator98', 'DiaLUp_KiNg', 'Y2K_Bug', 'CrazyIvan', 'Floppy_Disk', 'N00bSlayer', 'Pentium_II', 'Winamp_Llama', 'Kasparov', 'MrAnderson'];
  const BOT_CHAT = {
    start: ['gl hf', 'glhf all', 'удачи', 'hi all', 'поехали!', 'gl'],
    kill: ['lol', 'ez', 'hehe', 'изи', 'nice', ':)', 'owned'],
    death: ['lag!!!', 'omg', 'нуб', 'wtf', 'ks...', 'grr', 'мой модем...'],
    ally: ['gj', 'nice', 'wp', 'красавчик'],
    win: ['gg', 'gg wp', 'ggwp', 'гг'],
    lose: ['gg', 'gg wp', 'ff next time', 'гг, лаги'],
    mia: ['mia', 'ss', 'mid mia', 'осторожно, пропал']
  };

  const STR = {
    ru: {
      title: 'League of Legends 98', subtitle: 'Ущелье призывателей', play: 'Играть против ботов', options: 'Настройки', help: 'Справка', exit: 'Выход', resume: 'Продолжить',
      surrender: 'Сдаться', quitGame: 'Выйти в меню', back: 'Назад', start: 'В бой!', lockIn: 'Зафиксировать', champSelect: 'Выбор чемпиона', difficulty: 'Сложность ботов',
      diff: ['Новичок', 'Любитель', 'Профи'], side: 'Сторона', blue: 'Синие', red: 'Красные', role: 'Позиция', roles: { top: 'Верх', jungle: 'Лес', mid: 'Центр', adc: 'Низ (стрелок)', support: 'Низ (поддержка)', any: 'Любая' },
      spells: 'Заклинания призывателя', loading: 'Загрузка...', victory: 'ПОБЕДА', defeat: 'ПОРАЖЕНИЕ', continue: 'Щёлкните, чтобы продолжить', gameTime: 'Время',
      welcome: 'Добро пожаловать в Ущелье призывателей!', minions30: 'До появления миньонов 30 секунд', minionsSpawned: 'Миньоны появились!', firstBlood: 'Первая кровь!',
      youSlain: 'Вы убили вражеского чемпиона!', youDied: 'Вас убили!', allySlain: 'Союзник убит', enemySlain: 'Враг убит', multi: ['', '', 'Двойное убийство!', 'Тройное убийство!', 'Четверное убийство!', 'ПЕНТАКИЛЛ!'],
      spree: { 3: 'Серия убийств!', 4: 'Буйство!', 5: 'Неудержим!', 6: 'Доминирует!', 7: 'Божественно!', 8: 'Легендарно!' }, shutdown: 'Остановлен!', ace: 'Команда уничтожена!',
      towerAlly: 'Ваша башня разрушена', towerEnemy: 'Вражеская башня разрушена', inhibAlly: 'Ваш ингибитор разрушен', inhibEnemy: 'Вражеский ингибитор разрушен', inhibRespawn: 'Ингибитор восстановлен',
      dragonAlly: 'Ваша команда убила дракона', dragonEnemy: 'Вражеская команда убила дракона', baronAlly: 'Ваша команда убила Барона Нашора', baronEnemy: 'Вражеская команда убила Барона Нашора',
      respawnIn: 'Возрождение через', recall: 'Возвращение', shop: 'Магазин', buy: 'Купить', sell: 'Продать', undo: 'Отмена', gold: 'Золото', notInShop: 'Покупать можно только на базе',
      notEnoughGold: 'Недостаточно золота', invFull: 'Инвентарь полон', notEnoughMana: 'Недостаточно маны', onCooldown: 'Умение перезаряжается', level: 'Ур.', cs: 'Миньоны',
      scoreboard: 'Счёт', kda: 'У/С/П', recommended: 'Рекомендуемые', buildsInto: 'Улучшается в', recipe: 'Рецепт', cost: 'Цена', passive: 'Пассивное умение',
      rank: 'Уровень умения', cooldown: 'Перезарядка', manaCost: 'Мана', range: 'Дальность', levelUp: 'Новый уровень! Изучите умение (Ctrl+Q/W/E/R или +)',
      sfx: 'Звуки', music: 'Музыка', announcer: 'Голос диктора', quickcast: 'Быстрое применение умений', camlock: 'Камера следует за чемпионом', dmgnums: 'Цифры урона', fps: 'Показывать FPS', edge: 'Прокрутка у края экрана',
      on: 'Вкл', off: 'Выкл', surrenderVote: 'Голосование за сдачу', surrenderFail: 'Команда не согласилась сдаться', surrenderEarly: 'Сдаться можно после 15-й минуты',
      profile: 'Призыватель', wins: 'Победы', losses: 'Поражения', chatHint: 'Enter — чат', paused: 'ПАУЗА', inhib: 'Ингибитор', nexus: 'Нексус', tower: 'Башня',
      clickRole: 'Вы играете за', youAre: 'Вы', allies: 'Союзники', enemies: 'Противники', noChamp: 'Выберите чемпиона', stats: 'Статистика матча', damage: 'Урон по чемпионам', goldEarned: 'Золото',
      collection: 'Коллекция', skins: 'Образы', skin: 'Образ', chests: 'Сундуки', chestName: 'Хекстековый сундук', openChest: 'Открыть сундук', close: 'Закрыть', done: 'Готово',
      chestInside: 'Внутри — случайный образ чемпиона', chestFromMatch: 'Хекстековый сундук выдаётся за каждый завершённый матч — и за победу, и за поражение.', chestDebug: 'F7 — выдать сундук для отладки', debugChest: 'Получен сундук (F7)',
      noChests: 'Сундуков нет', allOwned: 'Все образы уже в коллекции!', newSkin: 'Новый образ!', openMore: 'Ещё', equip: 'Выбрать образ', equipped: 'Выбран', skinSelected: 'Образ выбран',
      locked: 'Образ не получен', getInChest: 'Выпадает из хекстекового сундука', reward: 'Награда за матч', chestReward: 'Хекстековый сундук', noRewardSpectate: 'В режиме наблюдения награды не выдаются', dragonShort: 'Драконы', baronShort: 'Бароны',
      patching: 'Проверка обновлений...', patchDone: 'Клиент обновлён. Версия 0.9.8 beta', connecting: 'Подключение к PVP.net 98 (модем 56k)...',
      helpText: [
        'ПКМ по земле — идти, ПКМ по врагу — атаковать. A + ЛКМ — атаковать ближайшего врага у курсора. S — стоп.',
        'Q W E R — умения (ЛКМ — применить, ПКМ — отмена). Ctrl + Q/W/E/R — изучить умение.',
        'D и F — заклинания призывателя. 1–6 — предметы. 4-й слот и тотемы — клавиша предмета.',
        'B — возвращение на базу (8 с). P — магазин (покупать можно только на базе).',
        'Y — закрепить камеру, Пробел — к чемпиону, стрелки/край экрана — прокрутка, щелчок по миникарте — камера.',
        'Tab — таблица счёта, Enter — чат (/gold 1000, /level, /ff), Esc — меню и пауза, F12 — FPS.',
        'Цель: уничтожить вражеский нексус. Башни идут по порядку: внешняя → внутренняя → у ингибитора → у нексуса.',
        'Каждый завершённый матч приносит хекстековый сундук со случайным образом. Образы смотрите в «Коллекции», выбирайте на экране выбора чемпиона.'
      ]
    },
    en: {
      title: 'League of Legends 98', subtitle: 'Summoner\'s Rift', play: 'Play vs Bots', options: 'Options', help: 'Help', exit: 'Exit', resume: 'Resume',
      surrender: 'Surrender', quitGame: 'Quit to Menu', back: 'Back', start: 'Fight!', lockIn: 'Lock In', champSelect: 'Champion Select', difficulty: 'Bot Difficulty',
      diff: ['Beginner', 'Intermediate', 'Expert'], side: 'Side', blue: 'Blue', red: 'Red', role: 'Position', roles: { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'Bot (Carry)', support: 'Bot (Support)', any: 'Any' },
      spells: 'Summoner Spells', loading: 'Loading...', victory: 'VICTORY', defeat: 'DEFEAT', continue: 'Click to continue', gameTime: 'Time',
      welcome: 'Welcome to Summoner\'s Rift!', minions30: 'Thirty seconds until minions spawn', minionsSpawned: 'Minions have spawned!', firstBlood: 'First Blood!',
      youSlain: 'You have slain an enemy!', youDied: 'You have been slain!', allySlain: 'An ally has been slain', enemySlain: 'An enemy has been slain', multi: ['', '', 'Double Kill!', 'Triple Kill!', 'Quadra Kill!', 'PENTAKILL!'],
      spree: { 3: 'Killing Spree!', 4: 'Rampage!', 5: 'Unstoppable!', 6: 'Dominating!', 7: 'Godlike!', 8: 'Legendary!' }, shutdown: 'Shut Down!', ace: 'Ace!',
      towerAlly: 'Your turret has been destroyed', towerEnemy: 'Enemy turret destroyed', inhibAlly: 'Your inhibitor has been destroyed', inhibEnemy: 'Enemy inhibitor destroyed', inhibRespawn: 'Inhibitor has respawned',
      dragonAlly: 'Your team has slain the dragon', dragonEnemy: 'The enemy team has slain the dragon', baronAlly: 'Your team has slain Baron Nashor', baronEnemy: 'The enemy team has slain Baron Nashor',
      respawnIn: 'Respawn in', recall: 'Recall', shop: 'Shop', buy: 'Buy', sell: 'Sell', undo: 'Undo', gold: 'Gold', notInShop: 'You can only buy at your base',
      notEnoughGold: 'Not enough gold', invFull: 'Inventory full', notEnoughMana: 'Not enough mana', onCooldown: 'Ability on cooldown', level: 'Lv', cs: 'CS',
      scoreboard: 'Scoreboard', kda: 'K/D/A', recommended: 'Recommended', buildsInto: 'Builds into', recipe: 'Recipe', cost: 'Cost', passive: 'Passive',
      rank: 'Rank', cooldown: 'Cooldown', manaCost: 'Mana', range: 'Range', levelUp: 'Level up! Learn a skill (Ctrl+Q/W/E/R or +)',
      sfx: 'Sound', music: 'Music', announcer: 'Announcer voice', quickcast: 'Quick cast abilities', camlock: 'Camera follows champion', dmgnums: 'Damage numbers', fps: 'Show FPS', edge: 'Edge scrolling',
      on: 'On', off: 'Off', surrenderVote: 'Surrender vote', surrenderFail: 'Your team declined to surrender', surrenderEarly: 'You can surrender after 15 minutes',
      profile: 'Summoner', wins: 'Wins', losses: 'Losses', chatHint: 'Enter — chat', paused: 'PAUSED', inhib: 'Inhibitor', nexus: 'Nexus', tower: 'Turret',
      clickRole: 'You play', youAre: 'You', allies: 'Allies', enemies: 'Enemies', noChamp: 'Pick a champion', stats: 'Match statistics', damage: 'Champion damage', goldEarned: 'Gold',
      collection: 'Collection', skins: 'Skins', skin: 'Skin', chests: 'Chests', chestName: 'Hextech Chest', openChest: 'Open chest', close: 'Close', done: 'Done',
      chestInside: 'Contains a random champion skin', chestFromMatch: 'You earn a Hextech Chest for every finished match, win or lose.', chestDebug: 'F7 grants a chest for debugging', debugChest: 'Chest granted (F7)',
      noChests: 'No chests', allOwned: 'You already own every skin!', newSkin: 'New skin!', openMore: 'Next', equip: 'Select skin', equipped: 'Selected', skinSelected: 'Skin selected',
      locked: 'Skin not owned', getInChest: 'Drops from Hextech Chests', reward: 'Match reward', chestReward: 'Hextech Chest', noRewardSpectate: 'No rewards while spectating', dragonShort: 'Dragons', baronShort: 'Barons',
      patching: 'Checking for updates...', patchDone: 'Client up to date. Version 0.9.8 beta', connecting: 'Connecting to PVP.net 98 (56k modem)...',
      helpText: [
        'RMB on ground — move, RMB on enemy — attack. A + LMB — attack the enemy nearest the cursor. S — stop.',
        'Q W E R — abilities (LMB casts, RMB cancels). Ctrl + Q/W/E/R — learn an ability.',
        'D and F — summoner spells. 1–6 — items (wards and potions are used with their slot key).',
        'B — recall to base (8 s). P — shop (you can only buy at your base).',
        'Y — lock camera, Space — center on champion, arrows/screen edge — scroll, click the minimap to move the camera.',
        'Tab — scoreboard, Enter — chat (/gold 1000, /level, /ff), Esc — menu and pause, F12 — FPS.',
        'Goal: destroy the enemy Nexus. Turrets fall in order: outer → inner → inhibitor → nexus.',
        'Every finished match grants a Hextech Chest with a random skin. Browse skins in the Collection and pick one in champion select.'
      ]
    }
  };

  L.DATA = { TICK, DT, MAP, CELL, GRID, XP_TABLE, CHAMPS, CHAMP_ORDER, ITEMS, SHOP_TABS, STAT_NAMES, PCT_STATS, SPELLS, SPELL_ORDER, MINIONS, TOWER, TOWER_HP, MONSTERS, BOT_NAMES, BOT_CHAT, STR };
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
