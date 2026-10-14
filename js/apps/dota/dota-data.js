(function (D) {
  'use strict';
  const TICK = 30, DT = 1 / TICK;
  const MAP = 12800, CELL = 64, GRID = MAP / CELL;
  const XP_TABLE = [0, 240, 640, 1160, 1760, 2440, 3200, 4000, 4900, 5900, 7000, 8200, 9500, 10900, 12400, 14000, 15700, 17500, 19400, 21400,
    23600, 26000, 28600, 31400, 34400, 38400, 43400, 49400, 56400, 63900];
  const MAX_LEVEL = 30;
  const NO_POINT = new Set([17, 19, 21, 22, 23, 24]);
  const TALENT_LEVELS = [10, 15, 20, 25];
  const RESPAWN = [6, 8, 10, 14, 16, 26, 28, 30, 32, 34, 36, 44, 46, 48, 50, 52, 54, 65, 70, 75, 80, 85, 90, 95, 100, 100, 100, 100, 100, 100];
  const ATTR = { hpPerStr: 20, hprPerStr: 0.1, mpPerInt: 12, mprPerInt: 0.05, armorPerAgi: 1 / 6, asPerAgi: 1, mrPerInt: 0.1, baseHp: 200, baseMp: 75, baseMr: 25 };
  const DAY_LEN = 300;
  const START_GOLD = 600, GOLD_PER_SEC = 1.5, PREGAME = 60;
  const BUYBACK_CD = 480;

  const T = (ru, en) => ({ ru, en });

  const HEROES = {
    techies: {
      name: T('Течис', 'Techies'), title: T('Сквии, Сплин и Спун', 'Squee, Spleen and Spoon'), attr: 'int', melee: false,
      str: [17, 2], agi: [14, 1.3], int: [22, 2.9], dmg: [7, 9], armor: 1, ms: 270, range: 700, bat: 1.7, ap: 0.5, proj: 900, turn: 0.5, hpr: 0.5,
      roles: ['support', 'off', 'mid'], scale: 0.9, color: '#c8a040',
      lore: T('Три гоблина-подрывника из Литтл-Фингерса, которых выгнали из всех рудников мира. Теперь их лаборатория — вся карта, а каждая тропа — место для очередной мины.',
        'Three goblin demolitionists from Little Fingers, banned from every mine in the world. Now the whole map is their laboratory and every path a place for one more mine.'),
      abilities: [
        { key: 'land_mines', placed: true, name: T('Мины', 'Land Mines'), tgt: 'point', range: 100, cp: 0.5, mana: [125, 150, 175, 205], cd: [25, 20, 15, 10],
          v: { dmg: [300, 400, 500, 600], partial: [150, 200, 250, 300], full: [200, 200, 200, 200], radius: [500, 500, 500, 500], arm: [1.75, 1.75, 1.75, 1.75], max: [20, 20, 20, 20] },
          desc: T('Ставит невидимую мину, которая взводится за {arm} с и взрывается, когда враг подходит ближе {full}: {dmg} смешанного урона в радиусе {full} и {partial} — до {radius}. Бьёт и по зданиям. Не больше {max} мин одновременно.',
            'Plants an invisible mine that arms after {arm}s and explodes when an enemy comes within {full}: {dmg} composite damage within {full} and {partial} out to {radius}. Damages buildings. Up to {max} mines at once.') },
        { key: 'stasis_trap', placed: true, name: T('Стазис-ловушка', 'Stasis Trap'), tgt: 'point', range: 150, cp: 0.5, mana: [80, 110, 140, 160], cd: [20, 16, 13, 10],
          v: { stun: [3, 4, 5, 6], trigger: [200, 200, 200, 200], radius: [450, 450, 450, 450], dur: [270, 300, 330, 360], arm: [2, 2, 2, 2], delay: [2, 2, 2, 2] },
          desc: T('Ставит невидимую ловушку на {dur} с. Через {arm} с она взводится; когда враг подходит ближе {trigger}, через {delay} с оглушает всех врагов в радиусе {radius} на {stun} с.',
            'Plants an invisible trap for {dur}s. It arms after {arm}s; when an enemy comes within {trigger}, after {delay}s it stuns every enemy within {radius} for {stun}s.') },
        { key: 'suicide_squad', name: T('Отряд самоубийц, в атаку!', 'Suicide Squad, Attack!'), tgt: 'point', range: 100, cp: 1, mana: [100, 125, 150, 175], cd: [180, 170, 160, 150],
          v: { dmg: [650, 850, 1150, 1550], partial: [350, 400, 450, 500], full: [200, 200, 200, 200], radius: [500, 500, 500, 500] },
          desc: T('Течис взрывает себя: {dmg} смешанного урона в радиусе {full} и {partial} — до {radius}. Течис погибает, но воскресает вдвое быстрее, а враги не получают награды за убийство.',
            'Techies blows himself up: {dmg} composite damage within {full} and {partial} out to {radius}. Techies dies, but respawns twice as fast and the enemy gets no kill bounty.') },
        { key: 'remote_mines', placed: true, name: T('Радиомины', 'Remote Mines'), tgt: 'point', range: 500, cp: 1, ult: true, mana: [200, 240, 300], cd: [10, 10, 10],
          v: { dmg: [300, 450, 600], radius: [400, 410, 425], dur: [480, 480, 480], vision: [900, 900, 900] },
          desc: T('Ставит невидимую радиомину на {dur} с с обзором {vision}. Сама она не взрывается: Течис подрывает её вручную «Направленным подрывом» — {dmg} маг. урона в радиусе {radius}. Здания не повреждает.',
            'Plants an invisible remote mine for {dur}s with {vision} vision. It never triggers on its own: Techies detonates it with Focused Detonate for {dmg} magical damage within {radius}. Does not damage buildings.') }
      ],
      extra: [
        { key: 'focused_detonate', name: T('Направленный подрыв', 'Focused Detonate'), tgt: 'point', range: 0, cp: 0, mana: [0], cd: [1], needs: 3,
          v: { radius: [700] },
          desc: T('Из любой точки карты подрывает все радиомины в радиусе {radius} от выбранного места.', 'From anywhere on the map, detonates every Remote Mine within {radius} of the target point.') },
        { key: 'minefield_sign', placed: true, name: T('Табличка «Мины»', 'Minefield Sign'), tgt: 'point', range: 100, cp: 0.3, mana: [0], cd: [120],
          v: { dur: [0] },
          desc: T('Ставит предупреждающую табличку «Мины!». Одновременно может стоять только одна.', 'Plants a warning sign reading "Mines!". Only one sign can exist at a time.') }
      ],
      scepterDesc: T('Радиомины: дальность установки 700 и урон 450/600/750.', 'Remote Mines: 700 cast range and 450/600/750 damage.'),
      talents: [
        [{ t: T('+25 к урону', '+25 Damage'), s: 'dmg', v: 25 }, { t: T('+100 к урону мин', '+100 Land Mines Damage'), ab: 0, k: 'dmg', v: 100 }],
        [{ t: T('+250 к здоровью', '+250 Health'), s: 'hp', v: 250 }, { t: T('+1 с оглушения ловушки', '+1s Stasis Trap Stun'), ab: 1, k: 'stun', v: 1 }],
        [{ t: T('−4 с перезарядки мин', '-4s Land Mines Cooldown'), ab: 0, k: 'cd', v: -4 }, { t: T('+150 к урону радиомин', '+150 Remote Mines Damage'), ab: 3, k: 'dmg', v: 150 }],
        [{ t: T('+400 к урону Отряда самоубийц', '+400 Suicide Squad Damage'), ab: 2, k: 'dmg', v: 400 }, { t: T('−60 с перезарядки Отряда самоубийц', '-60s Suicide Squad Cooldown'), ab: 2, k: 'cd', v: -60 }]
      ],
      skill: [0, 1, 0, 2, 0, 3, 0, 1, 1, 't', 1, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'clarity', 'branch', 'branch', 'ward_sentry', 'boots', 'magic_stick', 'soul_ring', 'arcane_boots', 'aghs', 'force_staff', 'euls', 'refresher', 'scythe'],
      ai: { aggro: 0.3, mines: true }
    },
    enigma: {
      name: T('Энигма', 'Enigma'), title: T('Дархроу', 'Darchrow'), attr: 'int', melee: true,
      str: [22, 2.5], agi: [10, 1], int: [19, 3.6], dmg: [17, 23], armor: 0, ms: 290, range: 150, bat: 1.7, ap: 0.4, turn: 0.5, hpr: 0.5,
      roles: ['off', 'support'], scale: 1.15, color: '#6a3aa8',
      lore: T('Древнее существо из пустоты между звёздами. Никто не знает, чего хочет Энигма, — известно лишь, что его гравитация перемалывает целые армии.',
        'An ancient being from the void between the stars. No one knows what Enigma wants — only that its gravity grinds whole armies to dust.'),
      abilities: [
        { key: 'malefice', name: T('Малефис', 'Malefice'), tgt: 'unit', range: 600, cp: 0.3, mana: [100, 120, 140, 160], cd: [14, 13, 12, 11],
          v: { dmg: [30, 45, 60, 75], stun: [0.4, 0.6, 0.8, 1], hits: [3, 3, 3, 3], interval: [2, 2, 2, 2] },
          desc: T('Сосредотачивает на враге космическую энергию: {hits} раза с интервалом {interval} с цель оглушается на {stun} с и получает {dmg} маг. урона.',
            'Focuses cosmic energy on an enemy: {hits} times, every {interval}s, the target is stunned for {stun}s and takes {dmg} magical damage.') },
        { key: 'demonic_conversion', name: T('Демоническое обращение', 'Demonic Conversion'), tgt: 'creep', range: 700, cp: 0.3, mana: [140, 150, 160, 170], cd: [35, 35, 35, 35],
          v: { count: [3, 3, 3, 3], hp: [180, 200, 220, 240], dmg: [20, 28, 36, 44], split: [6, 6, 6, 6], dur: [40, 40, 40, 40] },
          desc: T('Превращает крипа в {count} эйдолонов ({hp} здоровья, {dmg} урона) на {dur} с. После {split} атак эйдолон делится и восстанавливает здоровье.',
            'Turns a creep into {count} eidolons ({hp} health, {dmg} damage) for {dur}s. After {split} attacks an eidolon splits and restores its health.') },
        { key: 'midnight_pulse', name: T('Полночный пульс', 'Midnight Pulse'), tgt: 'point', range: 700, cp: 0.1, mana: [50, 70, 90, 110], cd: [50, 45, 40, 35],
          v: { pct: [3, 3.75, 4.5, 5.25], radius: [550, 550, 550, 550], dur: [11, 11, 11, 11] },
          desc: T('Пространство в радиусе {radius} становится средоточием тёмной силы на {dur} с: деревья исчезают, а враги теряют {pct}% макс. здоровья в секунду (чистый урон).',
            'Steeps an area of {radius} radius in dark resonance for {dur}s: trees are destroyed and enemies lose {pct}% of max health per second as pure damage.') },
        { key: 'black_hole', name: T('Чёрная дыра', 'Black Hole'), tgt: 'point', range: 275, cp: 0.3, ult: true, channel: 'dur', mana: [300, 400, 500], cd: [200, 180, 160],
          v: { dmg: [100, 150, 200], radius: [420, 420, 420], dur: [4, 4, 4] },
          desc: T('Призывает вихрь на {dur} с (поддерживаемое заклинание). Враги в радиусе {radius} притягиваются к центру, не могут действовать и получают {dmg} урона в секунду.',
            'Summons a vortex for {dur}s (channeled). Enemies within {radius} are pulled toward the center, disabled, and take {dmg} damage per second.') }
      ],
      scepterDesc: T('Внутри Чёрной дыры действует Полночный пульс.', 'Black Hole also applies Midnight Pulse in its area.'),
      shardDesc: T('Демоническое обращение можно применить на себя за 25% здоровья.', 'Demonic Conversion can target Enigma himself for 25% health.'),
      talents: [
        [{ t: T('+20 к урону эйдолонов', '+20 Eidolon Damage'), ab: 1, k: 'dmg', v: 20 }, { t: T('+200 к здоровью', '+200 Health'), s: 'hp', v: 200 }],
        [{ t: T('+1 эйдолон', '+1 Eidolon'), ab: 1, k: 'count', v: 1 }, { t: T('+0.4 с оглушения Малефиса', '+0.4s Malefice Stun'), ab: 0, k: 'stun', v: 0.4 }],
        [{ t: T('+1 удар Малефиса', '+1 Malefice Instance'), ab: 0, k: 'hits', v: 1 }, { t: T('+1% урона Пульса', '+1% Midnight Pulse Damage'), ab: 2, k: 'pct', v: 1 }],
        [{ t: T('+100 к урону Чёрной дыры', '+100 Black Hole DPS'), ab: 3, k: 'dmg', v: 100 }, { t: T('−60 с перезарядки Чёрной дыры', '-60s Black Hole Cooldown'), ab: 3, k: 'cd', v: -60 }]
      ],
      skill: [1, 0, 1, 0, 1, 3, 1, 0, 0, 't', 2, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'salve', 'branch', 'branch', 'boots', 'magic_stick', 'soul_ring', 'arcane_boots', 'blink', 'bkb', 'aghs', 'refresher', 'scythe'],
      ai: { aggro: 0.5 }
    },
    sven: {
      name: T('Свен', 'Sven'), title: T('Изгнанный рыцарь', 'The Rogue Knight'), attr: 'str', melee: true,
      str: [22, 3.2], agi: [21, 2], int: [16, 1.3], dmg: [39, 41], armor: 2, ms: 325, range: 150, bat: 1.8, ap: 0.4, turn: 0.6, hpr: 0.5,
      roles: ['carry'], scale: 1.1, color: '#4a6ac8',
      lore: T('Сын рыцаря Ванты и морской ведьмы, отвергнутый орденом. Свен носит Громовой меч и клянётся не служить никому, кроме собственного кодекса.',
        'Son of a Vigil Knight and a sea witch, cast out by the order. Sven wields the Outcast Blade and serves no code but his own.'),
      abilities: [
        { key: 'storm_hammer', name: T('Громовой молот', 'Storm Hammer'), tgt: 'unit', range: 600, cp: 0.3, mana: [110, 115, 120, 125], cd: [18, 16, 14, 12],
          v: { dmg: [80, 160, 240, 320], stun: [1.4, 1.6, 1.8, 2], radius: [255, 255, 255, 255] },
          desc: T('Бросает молот: {dmg} маг. урона и оглушение на {stun} с всем врагам в радиусе {radius} от цели.', 'Hurls his gauntlet: {dmg} magical damage and a {stun}s stun to enemies within {radius} of the target.') },
        { key: 'great_cleave', name: T('Великий рассекающий удар', 'Great Cleave'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { cleave: [25, 40, 55, 70], radius: [300, 300, 300, 300] },
          desc: T('Атаки Свена наносят {cleave}% урона врагам вокруг цели (радиус {radius}).', 'Sven\'s attacks deal {cleave}% of their damage to enemies around the target ({radius} radius).') },
        { key: 'warcry', name: T('Боевой клич', 'Warcry'), tgt: 'none', cp: 0, mana: [30, 35, 40, 45], cd: [36, 32, 28, 24],
          v: { armor: [6, 9, 12, 15], ms: [12, 12, 12, 12], dur: [8, 8, 8, 8], radius: [900, 900, 900, 900] },
          desc: T('Союзные герои в радиусе {radius} получают +{armor} брони и +{ms}% скорости на {dur} с.', 'Allied heroes within {radius} gain +{armor} armor and +{ms}% move speed for {dur}s.') },
        { key: 'gods_strength', name: T('Сила богов', 'God\'s Strength'), tgt: 'none', cp: 0.3, ult: true, mana: [100, 150, 200], cd: [110, 105, 100],
          v: { dmg: [100, 150, 200], dur: [25, 25, 25] },
          desc: T('Свен направляет свою силу: +{dmg}% базового урона на {dur} с.', 'Sven channels his rogue strength: +{dmg}% base damage for {dur}s.') }
      ],
      scepterDesc: T('Сила богов даёт +40 к силе.', 'God\'s Strength also grants +40 Strength.'),
      shardDesc: T('Боевой клич даёт щит на 300 урона.', 'Warcry also grants a 300 damage shield.'),
      talents: [
        [{ t: T('+25 к урону', '+25 Damage'), s: 'dmg', v: 25 }, { t: T('+200 к здоровью', '+200 Health'), s: 'hp', v: 200 }],
        [{ t: T('+4 брони Кличу', '+4 Warcry Armor'), ab: 2, k: 'armor', v: 4 }, { t: T('+30 к скорости атаки', '+30 Attack Speed'), s: 'as', v: 30 }],
        [{ t: T('+1 с оглушения Молота', '+1s Storm Hammer Stun'), ab: 0, k: 'stun', v: 1 }, { t: T('+25% рассекания', '+25% Cleave'), ab: 1, k: 'cleave', v: 25 }],
        [{ t: T('+60% Силы богов', '+60% God\'s Strength Damage'), ab: 3, k: 'dmg', v: 60 }, { t: T('+20 к силе', '+20 Strength'), s: 'str', v: 20 }]
      ],
      skill: [0, 1, 1, 2, 1, 3, 1, 0, 0, 't', 0, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'salve', 'quelling_blade', 'gauntlets', 'branch', 'boots', 'magic_stick', 'power_treads', 'mask_madness', 'bkb', 'daedalus', 'assault', 'aghs_shard', 'heart'],
      ai: { aggro: 0.7 }
    },
    crystal_maiden: {
      name: T('Кристал Мейден', 'Crystal Maiden'), title: T('Рилай', 'Rylai'), attr: 'int', melee: false,
      str: [18, 2.2], agi: [16, 1.6], int: [16, 3.3], dmg: [14, 20], armor: 0, ms: 280, range: 600, bat: 1.7, ap: 0.55, proj: 900, turn: 0.5, hpr: 0.5,
      roles: ['support'], scale: 0.95, color: '#6ac0f0',
      lore: T('Рилай с детства играла с холодом, пока случайно не заморозила полгорода. Родители отправили её на ледяной север — там она и стала повелительницей стужи.',
        'Rylai played with cold since childhood until she froze half a town. Her parents sent her to the icy north — where she became the mistress of frost.'),
      abilities: [
        { key: 'crystal_nova', name: T('Кристальная нова', 'Crystal Nova'), tgt: 'point', range: 700, cp: 0.3, mana: [115, 135, 155, 175], cd: [11, 10, 9, 8],
          v: { dmg: [130, 170, 210, 260], slow: [20, 25, 30, 35], radius: [425, 425, 425, 425], dur: [4.5, 4.5, 4.5, 4.5] },
          desc: T('Взрыв ледяной энергии в радиусе {radius}: {dmg} маг. урона и замедление передвижения и атаки на {slow}% на {dur} с.', 'A burst of ice in {radius} radius: {dmg} magical damage and a {slow}% move and attack slow for {dur}s.') },
        { key: 'frostbite', name: T('Обморожение', 'Frostbite'), tgt: 'unit', range: 550, cp: 0.3, mana: [140, 145, 150, 155], cd: [9, 8, 7, 6],
          v: { dur: [1.5, 2, 2.5, 3], dmg: [150, 200, 250, 300] },
          desc: T('Заковывает врага в лёд на {dur} с: он не может двигаться и атаковать, получая всего {dmg} маг. урона.', 'Encases an enemy in ice for {dur}s: it cannot move or attack and takes {dmg} magical damage in total.') },
        { key: 'arcane_aura', name: T('Аура волшебства', 'Arcane Aura'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { mpr: [0.5, 1, 1.5, 2], self: [3, 3, 3, 3] },
          desc: T('Все союзники на карте восстанавливают +{mpr} маны в секунду, сама Рилай — в {self} раза больше.', 'All allies on the map regenerate +{mpr} mana per second; Rylai herself gets {self} times as much.') },
        { key: 'freezing_field', name: T('Ледяное поле', 'Freezing Field'), tgt: 'none', cp: 0.3, ult: true, channel: 'dur', mana: [200, 400, 600], cd: [110, 100, 90],
          v: { dmg: [105, 170, 250], radius: [810, 810, 810], slow: [30, 30, 30], armor: [20, 20, 20], dur: [10, 10, 10] },
          desc: T('Вокруг Рилай {dur} с падают ледяные взрывы (радиус {radius}), каждый наносит {dmg} маг. урона. Враги замедлены на {slow}%, а сама она получает +{armor} брони.',
            'Icy explosions rain around Rylai for {dur}s ({radius} radius), each dealing {dmg} magical damage. Enemies are slowed by {slow}% and she gains +{armor} armor.') }
      ],
      scepterDesc: T('Во время Ледяного поля можно двигаться.', 'Rylai can move while channeling Freezing Field.'),
      shardDesc: T('Кристальная нова оставляет ледяную корку, замораживающую врагов на 1 с.', 'Crystal Nova also roots enemies for 1s.'),
      talents: [
        [{ t: T('+125 к здоровью', '+125 Health'), s: 'hp', v: 125 }, { t: T('+50 к урону Новы', '+50 Crystal Nova Damage'), ab: 0, k: 'dmg', v: 50 }],
        [{ t: T('+0.75 с Обморожения', '+0.75s Frostbite Duration'), ab: 1, k: 'dur', v: 0.75 }, { t: T('+100 к дальности заклинаний', '+100 Cast Range'), s: 'castRange', v: 100 }],
        [{ t: T('+1 маны Ауры', '+1 Arcane Aura Mana Regen'), ab: 2, k: 'mpr', v: 1 }, { t: T('+15% замедления Новы', '+15% Crystal Nova Slow'), ab: 0, k: 'slow', v: 15 }],
        [{ t: T('+90 к урону Ледяного поля', '+90 Freezing Field Damage'), ab: 3, k: 'dmg', v: 90 }, { t: T('+300 к здоровью', '+300 Health'), s: 'hp', v: 300 }]
      ],
      skill: [0, 1, 2, 0, 0, 3, 0, 1, 1, 't', 1, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'clarity', 'branch', 'ward_obs', 'ward_sentry', 'boots', 'magic_stick', 'tranquil_boots', 'force_staff', 'glimmer', 'bkb', 'aghs', 'aghs_shard', 'refresher'],
      ai: { aggro: 0.45, support: true }
    },
    sniper: {
      name: T('Снайпер', 'Sniper'), title: T('Кардель Остроглаз', 'Kardel Sharpeye'), attr: 'agi', melee: false,
      str: [19, 2], agi: [21, 3.4], int: [15, 2.6], dmg: [15, 21], armor: 0, ms: 285, range: 550, bat: 1.7, ap: 0.17, proj: 3000, turn: 0.7, hpr: 0.25,
      roles: ['mid', 'carry'], scale: 0.8, color: '#a88a4a',
      lore: T('Гном из Горных Кряжей, где каждый ребёнок учится стрелять раньше, чем ходить. Кардель попадает в пролетающую муху с двух миль.',
        'A keen-eyed dwarf from the Mountain Ridges, where children learn to shoot before they walk. Kardel hits a passing fly at two miles.'),
      abilities: [
        { key: 'shrapnel', name: T('Шрапнель', 'Shrapnel'), tgt: 'point', range: 1800, cp: 0.3, mana: [50, 50, 50, 50], cd: [0.5, 0.5, 0.5, 0.5], charges: 3, chargeT: 35,
          v: { dps: [20, 35, 50, 65], slow: [12, 18, 24, 30], radius: [450, 450, 450, 450], dur: [10, 10, 10, 10], delay: [1.2, 1.2, 1.2, 1.2] },
          desc: T('Через {delay} с на область радиусом {radius} обрушивается шрапнель: {dps} маг. урона в секунду и замедление на {slow}% в течение {dur} с. 3 заряда, по 35 с на восстановление.',
            'After {delay}s a rain of shrapnel covers {radius} radius: {dps} magical damage per second and a {slow}% slow for {dur}s. 3 charges, 35s each.') },
        { key: 'headshot', name: T('Выстрел в голову', 'Headshot'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { chance: [40, 40, 40, 40], dmg: [20, 50, 80, 110] },
          desc: T('С вероятностью {chance}% атака наносит +{dmg} урона и на миг останавливает цель.', 'Attacks have a {chance}% chance to deal +{dmg} damage and briefly halt the target.') },
        { key: 'take_aim', name: T('Прицеливание', 'Take Aim'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { range: [100, 200, 300, 400] },
          desc: T('Увеличивает дальность атаки на {range}.', 'Increases attack range by {range}.') },
        { key: 'assassinate', name: T('Убийство', 'Assassinate'), tgt: 'unit', range: 3000, cp: 2, ult: true, mana: [175, 225, 275], cd: [20, 15, 10],
          v: { dmg: [320, 485, 650] },
          desc: T('Две секунды прицеливания, затем выстрел: {dmg} маг. урона и мини-оглушение. Цель видна Снайперу во время прицеливания.', 'Two seconds of aiming, then a shot for {dmg} magical damage and a mini-stun. The target is revealed while aiming.') }
      ],
      scepterDesc: T('Убийство наносит критический урон атакой (280%).', 'Assassinate deals a 280% critical attack instead.'),
      shardDesc: T('Шрапнель получает +1 заряд.', 'Shrapnel gains +1 charge.'),
      talents: [
        [{ t: T('+15 к урону', '+15 Damage'), s: 'dmg', v: 15 }, { t: T('+20 к скорости атаки', '+20 Attack Speed'), s: 'as', v: 20 }],
        [{ t: T('+25 к урону Шрапнели', '+25 Shrapnel DPS'), ab: 0, k: 'dps', v: 25 }, { t: T('+250 к здоровью', '+250 Health'), s: 'hp', v: 250 }],
        [{ t: T('+100 к дальности атаки', '+100 Attack Range'), ab: 2, k: 'range', v: 100 }, { t: T('+40 к урону Выстрела в голову', '+40 Headshot Damage'), ab: 1, k: 'dmg', v: 40 }],
        [{ t: T('+400 к урону Убийства', '+400 Assassinate Damage'), ab: 3, k: 'dmg', v: 400 }, { t: T('+100 к скорости атаки', '+100 Attack Speed'), s: 'as', v: 100 }]
      ],
      skill: [1, 0, 2, 1, 1, 3, 1, 2, 2, 't', 2, 3, 0, 0, 't', 0, 3, 't', 't'],
      build: ['tango', 'salve', 'slippers', 'branch', 'branch', 'boots', 'wraith_band', 'power_treads', 'maelstrom', 'dragon_lance', 'mkb', 'daedalus', 'aghs_shard', 'butterfly'],
      ai: { aggro: 0.5, kite: true }
    },
    axe: {
      name: T('Акс', 'Axe'), title: T('Могул Хан', 'Mogul Khan'), attr: 'str', melee: true,
      str: [25, 2.8], agi: [20, 1.7], int: [18, 1.6], dmg: [27, 31], armor: -1, ms: 310, range: 150, bat: 1.7, ap: 0.5, turn: 0.6, hpr: 2.75,
      roles: ['off'], scale: 1.2, color: '#c83a2a',
      lore: T('Простой солдат Красного легиона, прорубивший себе путь в генералы. Когда от легиона остался один Акс, он просто стал легионом сам.',
        'A common soldier of the Red Mist who hacked his way to general. When Axe was all that remained of the army, he simply became the army.'),
      abilities: [
        { key: 'berserkers_call', name: T('Зов берсерка', 'Berserker\'s Call'), tgt: 'none', cp: 0.4, mana: [80, 90, 100, 110], cd: [17, 15, 13, 11],
          v: { dur: [2, 2.4, 2.8, 3.2], radius: [300, 300, 300, 300], armor: [30, 30, 30, 30] },
          desc: T('Враги в радиусе {radius} вынуждены атаковать Акса {dur} с, а он получает +{armor} брони.', 'Enemies within {radius} are forced to attack Axe for {dur}s while he gains +{armor} armor.') },
        { key: 'battle_hunger', name: T('Жажда битвы', 'Battle Hunger'), tgt: 'unit', range: 700, cp: 0.3, mana: [50, 60, 70, 80], cd: [20, 15, 10, 5],
          v: { dps: [16, 24, 32, 40], slow: [12, 12, 12, 12], dur: [12, 12, 12, 12] },
          desc: T('Враг получает {dps} маг. урона в секунду и замедлен на {slow}%, пока не убьёт кого-нибудь или не истечёт {dur} с.', 'The enemy takes {dps} magical damage per second and is slowed by {slow}% until it kills a unit or {dur}s pass.') },
        { key: 'counter_helix', name: T('Спиральный удар', 'Counter Helix'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { chance: [20, 20, 20, 20], dmg: [70, 100, 130, 160], radius: [275, 275, 275, 275] },
          desc: T('Когда Акса атакуют, с вероятностью {chance}% он раскручивает топор: {dmg} чистого урона в радиусе {radius}.', 'When attacked, Axe has a {chance}% chance to spin, dealing {dmg} pure damage within {radius}.') },
        { key: 'culling_blade', name: T('Казнь', 'Culling Blade'), tgt: 'unit', range: 150, cp: 0.3, ult: true, mana: [60, 120, 180], cd: [75, 65, 55],
          v: { threshold: [250, 350, 450], dmg: [150, 250, 300], ms: [30, 30, 30] },
          desc: T('Мгновенно убивает врага с запасом здоровья ниже {threshold}, иначе наносит {dmg} урона. При убийстве перезарядка сбрасывается, а союзники рядом ускоряются на {ms}%.',
            'Kills an enemy with less than {threshold} health outright, otherwise deals {dmg} damage. On a kill the cooldown resets and nearby allies gain {ms}% move speed.') }
      ],
      scepterDesc: T('Порог Казни +100.', 'Culling Blade threshold +100.'),
      shardDesc: T('Зов берсерка даёт +30% скорости атаки.', 'Berserker\'s Call grants +30% attack speed.'),
      talents: [
        [{ t: T('+8 к силе', '+8 Strength'), s: 'str', v: 8 }, { t: T('+12 к урону Жажды', '+12 Battle Hunger DPS'), ab: 1, k: 'dps', v: 12 }],
        [{ t: T('+30 к скорости передвижения', '+30 Movement Speed'), s: 'ms', v: 30 }, { t: T('+0.4 с Зова берсерка', '+0.4s Berserker\'s Call'), ab: 0, k: 'dur', v: 0.4 }],
        [{ t: T('+60 к урону Спирали', '+60 Counter Helix Damage'), ab: 2, k: 'dmg', v: 60 }, { t: T('+100 к радиусу Зова', '+100 Berserker\'s Call Radius'), ab: 0, k: 'radius', v: 100 }],
        [{ t: T('+15% шанса Спирали', '+15% Counter Helix Chance'), ab: 2, k: 'chance', v: 15 }, { t: T('+20 брони', '+20 Armor'), s: 'armor', v: 20 }]
      ],
      skill: [2, 0, 2, 1, 2, 3, 2, 0, 0, 't', 0, 3, 1, 1, 't', 1, 3, 't', 't'],
      build: ['tango', 'salve', 'ring_protection', 'branch', 'branch', 'boots', 'magic_stick', 'vanguard', 'phase_boots', 'blink', 'blade_mail', 'aghs_shard', 'heart', 'assault'],
      ai: { aggro: 0.8, initiator: true }
    },
    lina: {
      name: T('Лина', 'Lina'), title: T('Повелительница огня', 'The Slayer'), attr: 'int', melee: false,
      str: [20, 2.4], agi: [23, 1.8], int: [30, 3.7], dmg: [9, 25], armor: 0, ms: 290, range: 670, bat: 1.6, ap: 0.75, proj: 1000, turn: 0.5, hpr: 0.25,
      roles: ['mid', 'support'], scale: 0.95, color: '#f06020',
      lore: T('Младшая сестра Ледяной Ведьмы, которая в детстве сожгла родительский дом. Её вспыльчивость буквальна: Лина плавит камни, когда злится.',
        'Younger sister of a frost witch, she burned the family home as a child. Her temper is literal: Lina melts stone when angry.'),
      abilities: [
        { key: 'dragon_slave', name: T('Дыхание дракона', 'Dragon Slave'), tgt: 'point', range: 1075, cp: 0.45, mana: [90, 105, 125, 140], cd: [9, 8, 7, 6],
          v: { dmg: [85, 160, 235, 310], width: [275, 275, 275, 275], len: [1075, 1075, 1075, 1075] },
          desc: T('Выпускает волну огня длиной {len}: {dmg} маг. урона каждому врагу на пути.', 'Unleashes a wave of fire {len} long: {dmg} magical damage to each enemy in its path.') },
        { key: 'light_strike_array', name: T('Огненный столп', 'Light Strike Array'), tgt: 'point', range: 625, cp: 0.45, mana: [100, 110, 120, 130], cd: [12, 11, 10, 9],
          v: { dmg: [80, 120, 160, 200], stun: [1.6, 1.8, 2, 2.2], radius: [250, 250, 250, 250], delay: [0.5, 0.5, 0.5, 0.5] },
          desc: T('Через {delay} с из земли бьёт столп огня радиусом {radius}: {dmg} маг. урона и оглушение на {stun} с.', 'After {delay}s a column of fire erupts in {radius} radius: {dmg} magical damage and a {stun}s stun.') },
        { key: 'fiery_soul', name: T('Огненная душа', 'Fiery Soul'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { as: [40, 55, 70, 85], ms: [5, 6, 7, 8], stacks: [3, 3, 3, 3], dur: [12, 12, 12, 12] },
          desc: T('Каждое заклинание даёт заряд (до {stacks}) на {dur} с: +{as} к скорости атаки и +{ms}% к скорости за заряд.', 'Each spell grants a stack (up to {stacks}) for {dur}s: +{as} attack speed and +{ms}% move speed per stack.') },
        { key: 'laguna_blade', name: T('Клинок Лагуны', 'Laguna Blade'), tgt: 'unit', range: 600, cp: 0.45, ult: true, mana: [280, 420, 680], cd: [70, 60, 50],
          v: { dmg: [450, 675, 950], delay: [0.25, 0.25, 0.25] },
          desc: T('Разряд молнии в одного врага: {dmg} маг. урона через {delay} с.', 'A bolt of lightning at one enemy: {dmg} magical damage after {delay}s.') }
      ],
      scepterDesc: T('Клинок Лагуны наносит чистый урон и проходит сквозь невосприимчивость.', 'Laguna Blade deals pure damage and pierces spell immunity.'),
      shardDesc: T('Дыхание дракона оставляет огненный след на 4 с.', 'Dragon Slave leaves a burning trail for 4s.'),
      talents: [
        [{ t: T('+25 к урону', '+25 Damage'), s: 'dmg', v: 25 }, { t: T('+200 к здоровью', '+200 Health'), s: 'hp', v: 200 }],
        [{ t: T('+60 к урону Дыхания дракона', '+60 Dragon Slave Damage'), ab: 0, k: 'dmg', v: 60 }, { t: T('+15 к скорости атаки за заряд', '+15 Fiery Soul Attack Speed'), ab: 2, k: 'as', v: 15 }],
        [{ t: T('+150 к дальности заклинаний', '+150 Cast Range'), s: 'castRange', v: 150 }, { t: T('+0.5 с оглушения Столпа', '+0.5s Light Strike Array Stun'), ab: 1, k: 'stun', v: 0.5 }],
        [{ t: T('−15 с перезарядки Лагуны', '-15s Laguna Blade Cooldown'), ab: 3, k: 'cd', v: -15 }, { t: T('+2 заряда Огненной души', '+2 Fiery Soul Stacks'), ab: 2, k: 'stacks', v: 2 }]
      ],
      skill: [0, 2, 0, 1, 0, 3, 0, 1, 1, 't', 1, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'faerie_fire', 'mantle', 'branch', 'branch', 'bottle', 'boots', 'null_talisman', 'phase_boots', 'euls', 'bkb', 'aghs', 'daedalus', 'scythe'],
      ai: { aggro: 0.6, nuker: true }
    },
    juggernaut: {
      name: T('Джаггернаут', 'Juggernaut'), title: T('Юрнеро', 'Yurnero'), attr: 'agi', melee: true,
      str: [21, 2.2], agi: [34, 2.8], int: [14, 1.4], dmg: [20, 24], armor: 0, ms: 305, range: 150, bat: 1.4, ap: 0.33, turn: 0.6, hpr: 0.75,
      roles: ['carry'], scale: 1, color: '#e08a30',
      lore: T('Последний мастер клинка с Туманных островов. Он никогда не снимает маску: никто не видел его лица, но все видели его меч.',
        'The last blademaster of the Isle of Masks. He never removes his mask: no one has seen his face, but everyone has seen his sword.'),
      abilities: [
        { key: 'blade_fury', name: T('Вихрь клинков', 'Blade Fury'), tgt: 'none', cp: 0, mana: [120, 110, 100, 90], cd: [34, 32, 30, 28],
          v: { dps: [85, 110, 135, 160], radius: [260, 260, 260, 260], dur: [5, 5, 5, 5] },
          desc: T('Джаггернаут вращается {dur} с, становясь невосприимчивым к магии и нанося {dps} маг. урона в секунду в радиусе {radius}.', 'Juggernaut spins for {dur}s, becoming spell immune and dealing {dps} magical damage per second within {radius}.') },
        { key: 'healing_ward', placed: true, name: T('Лечащий тотем', 'Healing Ward'), tgt: 'point', range: 350, cp: 0.3, mana: [120, 125, 130, 135], cd: [60, 60, 60, 60],
          v: { pct: [2, 3, 4, 5], radius: [500, 500, 500, 500], dur: [25, 25, 25, 25] },
          desc: T('Ставит тотем на {dur} с, который лечит союзников в радиусе {radius} на {pct}% макс. здоровья в секунду.', 'Summons a ward for {dur}s that heals allies within {radius} for {pct}% of max health per second.') },
        { key: 'blade_dance', name: T('Танец клинков', 'Blade Dance'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { chance: [20, 25, 30, 35], crit: [180, 180, 180, 180] },
          desc: T('С вероятностью {chance}% атака наносит {crit}% урона.', 'Attacks have a {chance}% chance to deal {crit}% damage.') },
        { key: 'omnislash', name: T('Омнислэш', 'Omnislash'), tgt: 'unit', range: 350, cp: 0.3, ult: true, mana: [200, 275, 350], cd: [140, 120, 100],
          v: { jumps: [3, 6, 9], dmg: [0, 0, 0], radius: [425, 425, 425] },
          desc: T('Джаггернаут неуязвим и наносит {jumps} молниеносных удара по врагам в радиусе {radius}, перепрыгивая между ними.', 'Juggernaut becomes invulnerable and delivers {jumps} lightning-fast slashes to enemies within {radius}, leaping between them.') }
      ],
      scepterDesc: T('Омнислэш +3 удара.', 'Omnislash +3 slashes.'),
      shardDesc: T('Лечащий тотем получает +2 к здоровью и следует за Джаггернаутом.', 'Healing Ward follows Juggernaut.'),
      talents: [
        [{ t: T('+20 к урону', '+20 Damage'), s: 'dmg', v: 20 }, { t: T('+5 брони', '+5 Armor'), s: 'armor', v: 5 }],
        [{ t: T('+50 к урону Вихря', '+50 Blade Fury DPS'), ab: 0, k: 'dps', v: 50 }, { t: T('+1% лечения тотема', '+1% Healing Ward Heal'), ab: 1, k: 'pct', v: 1 }],
        [{ t: T('+1 с Вихря клинков', '+1s Blade Fury Duration'), ab: 0, k: 'dur', v: 1 }, { t: T('+20 к ловкости', '+20 Agility'), s: 'agi', v: 20 }],
        [{ t: T('+3 удара Омнислэша', '+3 Omnislash Slashes'), ab: 3, k: 'jumps', v: 3 }, { t: T('+10% шанса крита', '+10% Blade Dance Chance'), ab: 2, k: 'chance', v: 10 }]
      ],
      skill: [0, 2, 0, 1, 0, 3, 0, 2, 2, 't', 2, 3, 1, 1, 't', 1, 3, 't', 't'],
      build: ['tango', 'salve', 'quelling_blade', 'slippers', 'branch', 'boots', 'wraith_band', 'phase_boots', 'battle_fury', 'manta', 'bkb', 'aghs_shard', 'butterfly', 'abyssal'],
      ai: { aggro: 0.6 }
    },
    pudge: {
      name: T('Пудж', 'Pudge'), title: T('Мясник', 'The Butcher'), attr: 'str', melee: true,
      str: [25, 3.2], agi: [14, 1.4], int: [16, 1.8], dmg: [45, 51], armor: -1, ms: 280, range: 150, bat: 1.7, ap: 0.5, turn: 0.7, hpr: 2,
      roles: ['off', 'mid', 'support'], scale: 1.25, color: '#7a9a5a',
      lore: T('На полях Бесконечной резни, где павших не хоронят, бродит Мясник. Он собирает то, что осталось, и всегда голоден. Свежее мясо!',
        'On the Fields of Endless Carnage, where the fallen are never buried, the Butcher roams. He gathers what remains and is always hungry. Fresh meat!'),
      abilities: [
        { key: 'meat_hook', name: T('Мясной крюк', 'Meat Hook'), tgt: 'point', range: 1300, cp: 0.3, mana: [125, 130, 135, 140], cd: [14, 13, 12, 11],
          v: { dmg: [90, 180, 270, 360], len: [1100, 1175, 1250, 1325], width: [100, 100, 100, 100] },
          desc: T('Бросает крюк на {len}: первого пойманного он притягивает к Пуджу. Враги получают {dmg} чистого урона.', 'Launches a hook {len} long that drags the first unit it catches back to Pudge. Enemies take {dmg} pure damage.') },
        { key: 'rot', name: T('Гниль', 'Rot'), tgt: 'toggle', cp: 0, mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { dps: [30, 60, 90, 120], slow: [20, 22, 24, 26], radius: [250, 250, 250, 250] },
          desc: T('Облако гнили вокруг Пуджа: {dps} маг. урона в секунду врагам в радиусе {radius} (и самому Пуджу, не смертельно) и замедление на {slow}%.', 'A toxic cloud around Pudge: {dps} magical damage per second to enemies within {radius} (and to Pudge, non-lethal) and a {slow}% slow.') },
        { key: 'flesh_heap', name: T('Груда мяса', 'Flesh Heap'), tgt: 'passive', mana: [0, 0, 0, 0], cd: [0, 0, 0, 0],
          v: { mr: [8, 10, 12, 14], str: [1, 1.5, 2, 2.5], radius: [450, 450, 450, 450] },
          desc: T('+{mr}% сопротивления магии. Пудж получает {str} силы за каждого врага-героя, погибшего в радиусе {radius}.', '+{mr}% magic resistance. Pudge gains {str} Strength for each enemy hero that dies within {radius}.') },
        { key: 'dismember', name: T('Расчленение', 'Dismember'), tgt: 'unit', range: 160, cp: 0.3, ult: true, channel: 'dur', mana: [100, 130, 170], cd: [30, 25, 20],
          v: { dps: [80, 110, 140], strPct: [40, 40, 40], dur: [3, 3, 3] },
          desc: T('Пудж пожирает врага {dur} с: {dps} + {strPct}% силы маг. урона в секунду, лечится на столько же.', 'Pudge devours an enemy for {dur}s: {dps} + {strPct}% of Strength magical damage per second, healing himself for as much.') }
      ],
      scepterDesc: T('Расчленение +2 с и лечит больше.', 'Dismember lasts 2s longer.'),
      shardDesc: T('Можно проглотить союзника, спрятав его внутри.', 'Pudge can swallow an ally to hide it.'),
      talents: [
        [{ t: T('+5 брони', '+5 Armor'), s: 'armor', v: 5 }, { t: T('+30 к урону Гнили', '+30 Rot Damage'), ab: 1, k: 'dps', v: 30 }],
        [{ t: T('+10 к силе', '+10 Strength'), s: 'str', v: 10 }, { t: T('+150 к длине крюка', '+150 Hook Distance'), ab: 0, k: 'len', v: 150 }],
        [{ t: T('+20% сопротивления магии', '+20% Magic Resistance'), s: 'mr', v: 20 }, { t: T('+1 силы за стак', '+1 Flesh Heap Strength'), ab: 2, k: 'str', v: 1 }],
        [{ t: T('−4 с перезарядки крюка', '-4s Hook Cooldown'), ab: 0, k: 'cd', v: -4 }, { t: T('+50 к урону Расчленения', '+50 Dismember DPS'), ab: 3, k: 'dps', v: 50 }]
      ],
      skill: [0, 1, 1, 0, 1, 3, 1, 0, 0, 't', 2, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'salve', 'ward_obs', 'branch', 'branch', 'boots', 'magic_stick', 'tranquil_boots', 'blink', 'aghs', 'blade_mail', 'aghs_shard', 'heart', 'scythe'],
      ai: { aggro: 0.6, hooker: true }
    },
    lion: {
      name: T('Лион', 'Lion'), title: T('Демон-колдун', 'The Demon Witch'), attr: 'int', melee: false,
      str: [18, 3], agi: [15, 1.5], int: [18, 3.5], dmg: [11, 17], armor: 1, ms: 290, range: 600, bat: 1.7, ap: 0.43, proj: 1000, turn: 0.5, hpr: 0.5,
      roles: ['support'], scale: 1, color: '#c8342a',
      lore: T('Некогда великий маг Ордена, Лион заключил сделку с демоном — и проиграл. Теперь его рука сама тянется к чужой душе.',
        'Once a grandmaster of the Order, Lion made a pact with a demon — and lost. Now his hand reaches for other souls on its own.'),
      abilities: [
        { key: 'earth_spike', name: T('Земляной шип', 'Earth Spike'), tgt: 'point', range: 600, cp: 0.3, mana: [100, 120, 140, 160], cd: [12, 12, 12, 12],
          v: { dmg: [80, 140, 200, 260], stun: [1.2, 1.6, 2, 2.4], len: [825, 825, 825, 825], width: [125, 125, 125, 125] },
          desc: T('Ряд каменных шипов длиной {len}: враги подбрасываются, получают {dmg} маг. урона и оглушены на {stun} с.', 'A line of stone spikes {len} long: enemies are thrown up, take {dmg} magical damage and are stunned for {stun}s.') },
        { key: 'hex', name: T('Превращение', 'Hex'), tgt: 'unit', range: 500, cp: 0, mana: [110, 140, 170, 200], cd: [30, 24, 18, 12],
          v: { dur: [2.5, 3, 3.5, 4] },
          desc: T('Превращает врага в безобидную лягушку на {dur} с.', 'Turns an enemy into a harmless frog for {dur}s.') },
        { key: 'mana_drain', name: T('Похищение маны', 'Mana Drain'), tgt: 'unit', range: 850, cp: 0.3, channel: 'dur', mana: [10, 10, 10, 10], cd: [16, 12, 8, 4],
          v: { drain: [20, 40, 60, 80], slow: [20, 20, 20, 20], dur: [5, 5, 5, 5] },
          desc: T('До {dur} с высасывает из врага {drain} маны в секунду, замедляя его на {slow}%. Иллюзии уничтожает мгновенно.', 'Drains {drain} mana per second from an enemy for up to {dur}s, slowing it by {slow}%. Destroys illusions instantly.') },
        { key: 'finger_of_death', name: T('Перст смерти', 'Finger of Death'), tgt: 'unit', range: 900, cp: 0.3, ult: true, mana: [200, 420, 650], cd: [160, 100, 40],
          v: { dmg: [600, 725, 850], perKill: [40, 40, 40], delay: [0.25, 0.25, 0.25] },
          desc: T('Разрывает врага: {dmg} маг. урона через {delay} с. Каждый герой, убитый Перстом, навсегда добавляет +{perKill} урона.', 'Rips an enemy apart: {dmg} magical damage after {delay}s. Each hero it kills permanently adds +{perKill} damage.') }
      ],
      scepterDesc: T('Перст смерти бьёт всех врагов в радиусе 300 от цели.', 'Finger of Death hits all enemies within 300 of the target.'),
      shardDesc: T('Превращение действует по области 300.', 'Hex affects a 300 radius area.'),
      talents: [
        [{ t: T('+90 к урону', '+90 Damage'), s: 'dmg', v: 90 }, { t: T('+20% замедления Похищения', '+20% Mana Drain Slow'), ab: 2, k: 'slow', v: 20 }],
        [{ t: T('+75 к урону Шипа', '+75 Earth Spike Damage'), ab: 0, k: 'dmg', v: 75 }, { t: T('+250 к здоровью', '+250 Health'), s: 'hp', v: 250 }],
        [{ t: T('+1 с Превращения', '+1s Hex Duration'), ab: 1, k: 'dur', v: 1 }, { t: T('+120 к урону Перста', '+120 Finger of Death Damage'), ab: 3, k: 'dmg', v: 120 }],
        [{ t: T('−20 с перезарядки Перста', '-20s Finger Cooldown'), ab: 3, k: 'cd', v: -20 }, { t: T('+300 к дальности заклинаний', '+300 Cast Range'), s: 'castRange', v: 300 }]
      ],
      skill: [0, 2, 0, 1, 0, 3, 0, 1, 1, 't', 1, 3, 2, 2, 't', 2, 3, 't', 't'],
      build: ['tango', 'clarity', 'branch', 'ward_obs', 'ward_sentry', 'boots', 'magic_stick', 'tranquil_boots', 'blink', 'force_staff', 'aghs', 'glimmer', 'aghs_shard', 'refresher'],
      ai: { aggro: 0.55, support: true }
    }
  };
  const HERO_ORDER = ['techies', 'enigma', 'sven', 'crystal_maiden', 'sniper', 'axe', 'lina', 'juggernaut', 'pudge', 'lion'];

  const I = (o) => o;
  const ITEMS = {
    tango: I({ name: T('Танго', 'Tango'), cost: 90, cat: 'consumables', charges: 3, active: 'tango', cd: 0, range: 165, desc: T('Съесть дерево: 7 здоровья в секунду 16 с. 3 заряда.', 'Eat a tree: 7 health per second for 16s. 3 charges.') }),
    salve: I({ name: T('Лечебная мазь', 'Healing Salve'), cost: 110, cat: 'consumables', charges: 1, active: 'salve', desc: T('Восстанавливает 400 здоровья за 10 с. Прерывается уроном героев.', 'Restores 400 health over 10s. Interrupted by hero damage.') }),
    clarity: I({ name: T('Ясность', 'Clarity'), cost: 50, cat: 'consumables', charges: 1, active: 'clarity', desc: T('Восстанавливает 150 маны за 25 с. Прерывается уроном героев.', 'Restores 150 mana over 25s. Interrupted by hero damage.') }),
    faerie_fire: I({ name: T('Волшебный огонь', 'Faerie Fire'), cost: 70, cat: 'consumables', charges: 1, active: 'faerie', st: { dmg: 2 }, desc: T('Мгновенно восстанавливает 85 здоровья.', 'Instantly restores 85 health.') }),
    mango: I({ name: T('Волшебное манго', 'Enchanted Mango'), cost: 70, cat: 'consumables', charges: 1, active: 'mango', st: { hpr: 0.6 }, desc: T('Мгновенно восстанавливает 100 маны.', 'Instantly restores 100 mana.') }),
    tp: I({ name: T('Свиток телепортации', 'Town Portal Scroll'), cost: 100, cat: 'consumables', charges: 1, active: 'tp', cd: 80, desc: T('Через 3 с переносит героя к выбранному союзному зданию.', 'After 3s teleports the hero to the chosen allied building.') }),
    ward_obs: I({ name: T('Обсервер', 'Observer Ward'), cost: 0, cat: 'consumables', charges: 1, active: 'ward_obs', range: 500, stock: [2, 4, 135], desc: T('Невидимый глаз на 6 минут: обзор 1600 днём и 1000 ночью.', 'An invisible eye for 6 minutes: 1600 vision by day, 1000 at night.') }),
    ward_sentry: I({ name: T('Сентри', 'Sentry Ward'), cost: 50, cat: 'consumables', charges: 1, active: 'ward_sentry', range: 500, stock: [3, 10, 70], desc: T('Невидимый страж на 7 минут: истинное зрение в радиусе 900 (мины, невидимки).', 'An invisible guard for 7 minutes: True Sight in 900 radius (mines, invisible units).') }),
    dust: I({ name: T('Пыль видимости', 'Dust of Appearance'), cost: 80, cat: 'consumables', charges: 2, active: 'dust', cd: 30, desc: T('Раскрывает невидимых врагов в радиусе 1050 на 12 с.', 'Reveals invisible enemies within 1050 for 12s.') }),
    bottle: I({ name: T('Фляга', 'Bottle'), cost: 675, cat: 'consumables', active: 'bottle', cd: 0.5, bottle: true, desc: T('3 глотка по 110 здоровья и 60 маны. Наполняется у фонтана и при подборе руны.', '3 sips of 110 health and 60 mana. Refills at the fountain and when picking up a rune.') }),
    branch: I({ name: T('Железная ветвь', 'Iron Branch'), cost: 50, cat: 'attributes', st: { all: 1 } }),
    gauntlets: I({ name: T('Перчатки силы', 'Gauntlets of Strength'), cost: 140, cat: 'attributes', st: { str: 3 } }),
    slippers: I({ name: T('Туфли ловкости', 'Slippers of Agility'), cost: 140, cat: 'attributes', st: { agi: 3 } }),
    mantle: I({ name: T('Мантия интеллекта', 'Mantle of Intelligence'), cost: 140, cat: 'attributes', st: { int: 3 } }),
    circlet: I({ name: T('Обруч', 'Circlet'), cost: 155, cat: 'attributes', st: { all: 2 } }),
    belt: I({ name: T('Пояс силы', 'Belt of Strength'), cost: 450, cat: 'attributes', st: { str: 6 } }),
    band: I({ name: T('Эльфийская повязка', 'Band of Elvenskin'), cost: 450, cat: 'attributes', st: { agi: 6 } }),
    robe: I({ name: T('Мантия мага', 'Robe of the Magi'), cost: 450, cat: 'attributes', st: { int: 6 } }),
    ogre_axe: I({ name: T('Топор огра', 'Ogre Axe'), cost: 1000, cat: 'attributes', st: { str: 10 } }),
    blade_alacrity: I({ name: T('Клинок проворства', 'Blade of Alacrity'), cost: 1000, cat: 'attributes', st: { agi: 10 } }),
    staff_wizardry: I({ name: T('Посох волшебства', 'Staff of Wizardry'), cost: 1000, cat: 'attributes', st: { int: 10 } }),
    quelling_blade: I({ name: T('Топорик', 'Quelling Blade'), cost: 100, cat: 'equipment', active: 'chop', cd: 4, range: 350, quell: 8, desc: T('+8 урона по крипам (+4 у дальнего боя). Рубит деревья.', '+8 damage against creeps (+4 ranged). Cuts down trees.') }),
    ring_protection: I({ name: T('Кольцо защиты', 'Ring of Protection'), cost: 175, cat: 'equipment', st: { armor: 2 } }),
    blades_attack: I({ name: T('Клинки атаки', 'Blades of Attack'), cost: 450, cat: 'equipment', st: { dmg: 9 } }),
    chainmail: I({ name: T('Кольчуга', 'Chainmail'), cost: 550, cat: 'equipment', st: { armor: 4 } }),
    quarterstaff: I({ name: T('Боевой посох', 'Quarterstaff'), cost: 875, cat: 'equipment', st: { dmg: 10, as: 10 } }),
    helm_iron: I({ name: T('Шлем железной воли', 'Helm of Iron Will'), cost: 975, cat: 'equipment', st: { armor: 6, hpr: 2 } }),
    javelin: I({ name: T('Метательное копьё', 'Javelin'), cost: 900, cat: 'equipment', st: { dmg: 10 }, pierce: [25, 70], desc: T('25% шанс нанести +70 маг. урона, не промахиваясь.', '25% chance to deal +70 magical damage that never misses.') }),
    broadsword: I({ name: T('Палаш', 'Broadsword'), cost: 1000, cat: 'equipment', st: { dmg: 15 } }),
    claymore: I({ name: T('Клеймор', 'Claymore'), cost: 1350, cat: 'equipment', st: { dmg: 20 } }),
    mithril: I({ name: T('Мифриловый молот', 'Mithril Hammer'), cost: 1600, cat: 'equipment', st: { dmg: 24 } }),
    blight_stone: I({ name: T('Камень порчи', 'Blight Stone'), cost: 300, cat: 'equipment', corrupt: 2, desc: T('Атаки снижают броню цели на 2 на 8 с.', 'Attacks reduce the target\'s armor by 2 for 8s.') }),
    magic_stick: I({ name: T('Волшебная палочка', 'Magic Stick'), cost: 200, cat: 'misc', active: 'stick', cd: 13, stick: 10, desc: T('Копит заряды (до 10), когда враги рядом применяют заклинания. Каждый заряд — 15 здоровья и маны.', 'Gains charges (up to 10) when nearby enemies cast spells. Each charge restores 15 health and mana.') }),
    ring_regen: I({ name: T('Кольцо регенерации', 'Ring of Regen'), cost: 175, cat: 'misc', st: { hpr: 1.25 } }),
    sages_mask: I({ name: T('Маска мудреца', 'Sage\'s Mask'), cost: 175, cat: 'misc', st: { mpr: 0.7 } }),
    boots: I({ name: T('Сапоги скорости', 'Boots of Speed'), cost: 500, cat: 'misc', st: { ms: 45 }, boots: true }),
    gloves: I({ name: T('Перчатки быстроты', 'Gloves of Haste'), cost: 450, cat: 'misc', st: { as: 20 } }),
    cloak: I({ name: T('Плащ', 'Cloak'), cost: 500, cat: 'misc', st: { mr: 15 } }),
    ring_health: I({ name: T('Кольцо здоровья', 'Ring of Health'), cost: 700, cat: 'misc', st: { hpr: 6.5 } }),
    void_stone: I({ name: T('Камень пустоты', 'Void Stone'), cost: 825, cat: 'misc', st: { mpr: 2.25 } }),
    gem: I({ name: T('Камень истинного зрения', 'Gem of True Sight'), cost: 900, cat: 'misc', trueSight: 900, dropOnDeath: true, desc: T('Истинное зрение в радиусе 900. Выпадает при смерти.', 'True Sight within 900. Dropped on death.') }),
    morbid_mask: I({ name: T('Маска смерти', 'Morbid Mask'), cost: 900, cat: 'misc', st: { lifesteal: 15 } }),
    shadow_amulet: I({ name: T('Амулет тени', 'Shadow Amulet'), cost: 1000, cat: 'misc', st: { as: 20 } }),
    blink: I({ name: T('Кинжал перемещения', 'Blink Dagger'), cost: 2250, cat: 'misc', active: 'blink', cd: 15, range: 1200, desc: T('Мгновенно переносит героя на расстояние до 1200. Не работает 3 с после урона от героев.', 'Teleports up to 1200 away. Disabled for 3s after taking hero damage.') }),
    energy_booster: I({ name: T('Кристалл энергии', 'Energy Booster'), cost: 800, cat: 'secret', secret: true, st: { mp: 250 } }),
    vitality_booster: I({ name: T('Кристалл жизни', 'Vitality Booster'), cost: 1000, cat: 'secret', secret: true, st: { hp: 250 } }),
    point_booster: I({ name: T('Кристалл силы', 'Point Booster'), cost: 1200, cat: 'secret', secret: true, st: { hp: 175, mp: 175 } }),
    platemail: I({ name: T('Латы', 'Platemail'), cost: 1400, cat: 'secret', secret: true, st: { armor: 10 } }),
    talisman: I({ name: T('Талисман уклонения', 'Talisman of Evasion'), cost: 1300, cat: 'secret', secret: true, st: { evasion: 15 } }),
    hyperstone: I({ name: T('Гиперкамень', 'Hyperstone'), cost: 2000, cat: 'secret', secret: true, st: { as: 60 } }),
    ultimate_orb: I({ name: T('Сфера совершенства', 'Ultimate Orb'), cost: 2050, cat: 'secret', secret: true, st: { all: 10 } }),
    demon_edge: I({ name: T('Демонический клинок', 'Demon Edge'), cost: 2200, cat: 'secret', secret: true, st: { dmg: 40 } }),
    mystic_staff: I({ name: T('Мистический посох', 'Mystic Staff'), cost: 2800, cat: 'secret', secret: true, st: { int: 25 } }),
    reaver: I({ name: T('Разрушитель', 'Reaver'), cost: 2800, cat: 'secret', secret: true, st: { str: 25 } }),
    eaglesong: I({ name: T('Песнь орла', 'Eaglesong'), cost: 2800, cat: 'secret', secret: true, st: { agi: 25 } }),
    sacred_relic: I({ name: T('Священная реликвия', 'Sacred Relic'), cost: 3750, cat: 'secret', secret: true, st: { dmg: 60 } }),
    wraith_band: I({ name: T('Браслет призрака', 'Wraith Band'), cost: 505, cat: 'accessories', from: ['slippers', 'circlet'], st: { agi: 5, str: 2, int: 2, as: 5 } }),
    bracer: I({ name: T('Наруч', 'Bracer'), cost: 505, cat: 'accessories', from: ['gauntlets', 'circlet'], st: { str: 5, agi: 2, int: 2, hp: 50 } }),
    null_talisman: I({ name: T('Нуль-талисман', 'Null Talisman'), cost: 505, cat: 'accessories', from: ['mantle', 'circlet'], st: { int: 5, str: 2, agi: 2, mpr: 0.6 } }),
    magic_wand: I({ name: T('Волшебный жезл', 'Magic Wand'), cost: 450, cat: 'accessories', from: ['magic_stick', 'branch', 'branch'], st: { all: 3 }, active: 'stick', cd: 13, stick: 20, desc: T('До 20 зарядов от чужих заклинаний. Каждый заряд — 15 здоровья и маны.', 'Up to 20 charges from enemy spells. Each charge restores 15 health and mana.') }),
    soul_ring: I({ name: T('Кольцо души', 'Soul Ring'), cost: 805, cat: 'accessories', from: ['gauntlets', 'ring_protection'], st: { str: 6, armor: 2 }, active: 'soul_ring', cd: 25, desc: T('Жертвует 170 здоровья ради 170 маны.', 'Sacrifices 170 health for 170 mana.') }),
    phase_boots: I({ name: T('Фазовые сапоги', 'Phase Boots'), cost: 1500, cat: 'accessories', from: ['boots', 'blades_attack', 'chainmail'], st: { ms: 45, dmg: 18, armor: 4 }, boots: true, active: 'phase', cd: 8, desc: T('Фаза: +20% скорости на 3 с и проход сквозь существ.', 'Phase: +20% move speed for 3s and moving through units.') }),
    power_treads: I({ name: T('Сапоги силы', 'Power Treads'), cost: 1400, cat: 'accessories', from: ['boots', 'gloves', 'belt'], st: { ms: 45, as: 25 }, treads: 10, boots: true, active: 'treads', cd: 0, desc: T('+10 к выбранному атрибуту (переключается).', '+10 to the selected attribute (toggle).') }),
    arcane_boots: I({ name: T('Волшебные сапоги', 'Arcane Boots'), cost: 1300, cat: 'accessories', from: ['boots', 'energy_booster'], st: { ms: 45, mp: 250 }, boots: true, active: 'arcane', cd: 55, desc: T('Восстанавливает 175 маны союзникам в радиусе 1200.', 'Restores 175 mana to allies within 1200.') }),
    tranquil_boots: I({ name: T('Сапоги спокойствия', 'Tranquil Boots'), cost: 925, cat: 'accessories', from: ['boots', 'ring_regen'], st: { ms: 65, hpr: 14 }, boots: true, tranquil: true, desc: T('Регенерация и скорость пропадают на 13 с после атаки или урона.', 'Regeneration and speed are lost for 13s after attacking or taking damage.') }),
    hand_midas: I({ name: T('Рука Мидаса', 'Hand of Midas'), cost: 2200, cat: 'accessories', from: ['gloves'], st: { as: 30 }, active: 'midas', cd: 90, range: 600, desc: T('Превращает крипа в золото: +160 золота и 2.1× опыта.', 'Turns a creep into gold: +160 gold and 2.1× its experience.') }),
    mekansm: I({ name: T('Мекансм', 'Mekansm'), cost: 1775, cat: 'support', from: ['chainmail', 'ring_regen', 'circlet'], st: { armor: 4, hpr: 2, all: 2 }, active: 'mek', cd: 65, mana: 100, desc: T('Лечит союзников в радиусе 1200 на 275 здоровья.', 'Heals allies within 1200 for 275 health.') }),
    glimmer: I({ name: T('Мерцающий плащ', 'Glimmer Cape'), cost: 2150, cat: 'support', from: ['cloak', 'shadow_amulet'], st: { mr: 15, as: 20 }, active: 'glimmer', cd: 14, range: 800, mana: 90, desc: T('Союзник становится невидимым на 5 с и получает 45% сопротивления магии.', 'An ally turns invisible for 5s and gains 45% magic resistance.') }),
    force_staff: I({ name: T('Посох силы', 'Force Staff'), cost: 2200, cat: 'support', from: ['staff_wizardry', 'ring_regen'], st: { int: 10, hpr: 2 }, active: 'force', cd: 19, range: 550, mana: 25, desc: T('Толкает цель на 600 вперёд.', 'Pushes the target 600 units forward.') }),
    vanguard: I({ name: T('Авангард', 'Vanguard'), cost: 1825, cat: 'armor', from: ['vitality_booster', 'ring_health'], st: { hp: 250, hpr: 7 }, block: [64, 32, 50], desc: T('50% шанс заблокировать 64 урона (32 у дальнего боя).', '50% chance to block 64 damage (32 ranged).') }),
    blade_mail: I({ name: T('Клинковый доспех', 'Blade Mail'), cost: 2100, cat: 'armor', from: ['broadsword', 'chainmail'], st: { dmg: 28, armor: 6 }, active: 'blade_mail', cd: 25, mana: 25, desc: T('4.5 с возвращает атакующим 85% полученного урона.', 'For 4.5s returns 85% of damage taken to attackers.') }),
    perseverance: I({ name: T('Упорство', 'Perseverance'), cost: 1700, cat: 'misc2', from: ['ring_health', 'void_stone'], st: { hpr: 6.5, mpr: 2.25 } }),
    euls: I({ name: T('Скипетр Эула', 'Eul\'s Scepter of Divinity'), cost: 2625, cat: 'magical', from: ['staff_wizardry', 'void_stone'], st: { int: 10, mpr: 2.5, ms: 20 }, active: 'euls', cd: 23, range: 575, mana: 175, desc: T('Смерч подбрасывает цель на 2.5 с.', 'A cyclone lifts the target for 2.5s.') }),
    dagon: I({ name: T('Дагон', 'Dagon'), cost: 2850, cat: 'magical', from: ['staff_wizardry', 'circlet'], st: { int: 14, str: 7, agi: 7 }, active: 'dagon', cd: 35, range: 700, mana: 120, desc: T('Энергетический разряд: 400 маг. урона.', 'A burst of energy: 400 magical damage.') }),
    aghs: I({ name: T('Скипетр Аганима', 'Aghanim\'s Scepter'), cost: 4200, cat: 'magical', from: ['point_booster', 'ogre_axe', 'blade_alacrity', 'staff_wizardry'], st: { all: 10, hp: 175, mp: 175 }, scepter: true, desc: T('Улучшает ультимейт героя.', 'Upgrades the hero\'s ultimate.') }),
    aghs_shard: I({ name: T('Осколок Аганима', 'Aghanim\'s Shard'), cost: 1400, cat: 'magical', shard: true, after: 15 * 60, desc: T('Навсегда улучшает способность героя. Продаётся с 15:00.', 'Permanently upgrades a hero ability. Available from 15:00.') }),
    scythe: I({ name: T('Коса Вайса', 'Scythe of Vyse'), cost: 5675, cat: 'magical', from: ['mystic_staff', 'ultimate_orb', 'void_stone'], st: { str: 10, agi: 10, int: 35, mpr: 3 }, active: 'hex', cd: 20, range: 800, mana: 250, desc: T('Превращает врага в свинью на 3.5 с.', 'Turns an enemy into a pig for 3.5s.') }),
    refresher: I({ name: T('Сфера обновления', 'Refresher Orb'), cost: 5000, cat: 'magical', from: ['perseverance', 'perseverance'], st: { hpr: 13, mpr: 5 }, active: 'refresher', cd: 180, mana: 350, desc: T('Сбрасывает перезарядку всех способностей и предметов.', 'Resets the cooldowns of all abilities and items.') }),
    bkb: I({ name: T('Black King Bar', 'Black King Bar'), cost: 4050, cat: 'armor', from: ['ogre_axe', 'mithril'], st: { str: 10, dmg: 24 }, active: 'bkb', cd: 70, desc: T('Невосприимчивость к магии на 9 с.', 'Spell immunity for 9s.') }),
    heart: I({ name: T('Сердце Тарраска', 'Heart of Tarrasque'), cost: 5000, cat: 'armor', from: ['vitality_booster', 'reaver'], st: { str: 45, hp: 250 }, heart: true, desc: T('Восстанавливает 1.6% здоровья в секунду.', 'Regenerates 1.6% health per second.') }),
    assault: I({ name: T('Кираса штурмовика', 'Assault Cuirass'), cost: 5125, cat: 'armor', from: ['platemail', 'hyperstone', 'chainmail'], st: { armor: 10, as: 30 }, aura: 'assault', desc: T('Аура: союзники +5 брони и +30 к скорости атаки, враги −5 брони (радиус 900).', 'Aura: allies +5 armor and +30 attack speed, enemies -5 armor (900 radius).') }),
    manta: I({ name: T('Манта', 'Manta Style'), cost: 4650, cat: 'armor', from: ['yasha', 'ultimate_orb'], st: { str: 10, agi: 26, int: 10, as: 12, msPct: 8 }, active: 'manta', cd: 45, mana: 125, desc: T('Создаёт 2 иллюзии на 20 с и снимает отрицательные эффекты.', 'Creates 2 illusions for 20s and dispels debuffs.') }),
    crystalys: I({ name: T('Кристаллис', 'Crystalys'), cost: 2000, cat: 'weapons', from: ['broadsword', 'blades_attack'], st: { dmg: 32 }, crit: [30, 150] }),
    daedalus: I({ name: T('Даедалус', 'Daedalus'), cost: 5150, cat: 'weapons', from: ['crystalys', 'demon_edge'], st: { dmg: 88 }, crit: [30, 225], desc: T('30% шанс критического удара на 225%.', '30% chance for a 225% critical strike.') }),
    mkb: I({ name: T('Monkey King Bar', 'Monkey King Bar'), cost: 4975, cat: 'weapons', from: ['demon_edge', 'javelin', 'quarterstaff'], st: { dmg: 50, as: 45 }, pierce: [80, 70], trueStrike: true, desc: T('Атаки не промахиваются; 80% шанс +70 маг. урона.', 'Attacks never miss; 80% chance for +70 magical damage.') }),
    battle_fury: I({ name: T('Боевое неистовство', 'Battle Fury'), cost: 4100, cat: 'weapons', from: ['broadsword', 'claymore', 'perseverance'], st: { dmg: 50, hpr: 7.5, mpr: 2.75 }, cleave: 60, quell: 12, active: 'chop', cd: 4, range: 350, desc: T('Рассечение 60% в радиусе 360 (ближний бой). Рубит деревья.', '60% cleave in 360 radius (melee). Cuts down trees.') }),
    desolator: I({ name: T('Десолятор', 'Desolator'), cost: 3500, cat: 'weapons', from: ['mithril', 'mithril', 'blight_stone'], st: { dmg: 50 }, corrupt: 6, desc: T('Атаки снижают броню цели на 6 на 7 с.', 'Attacks reduce the target\'s armor by 6 for 7s.') }),
    rapier: I({ name: T('Божественная рапира', 'Divine Rapier'), cost: 5950, cat: 'weapons', from: ['sacred_relic', 'demon_edge'], st: { dmg: 330 }, dropOnDeath: true, desc: T('+330 урона. Выпадает при смерти владельца!', '+330 damage. Dropped when the owner dies!') }),
    radiance: I({ name: T('Сияние', 'Radiance'), cost: 5150, cat: 'weapons', from: ['sacred_relic'], st: { dmg: 60 }, aura: 'radiance', desc: T('Жжёт врагов в радиусе 700: 60 маг. урона в секунду.', 'Burns enemies within 700 for 60 magical damage per second.') }),
    basher: I({ name: T('Дробитель черепов', 'Skull Basher'), cost: 2875, cat: 'weapons', from: ['mithril', 'belt'], st: { dmg: 25, str: 10 }, bash: [25, 1.5, 100], desc: T('25% шанс оглушить цель на 1.5 с (10% у дальнего боя).', '25% chance to stun for 1.5s (10% ranged).') }),
    abyssal: I({ name: T('Клинок бездны', 'Abyssal Blade'), cost: 6250, cat: 'weapons', from: ['basher', 'vanguard'], st: { dmg: 25, str: 10, hp: 250, hpr: 7 }, bash: [25, 1.5, 100], block: [70, 35, 50], active: 'abyssal', cd: 35, range: 150, mana: 75, desc: T('Оглушает врага на 2 с сквозь невосприимчивость.', 'Stuns an enemy for 2s through spell immunity.') }),
    maelstrom: I({ name: T('Маэлстром', 'Maelstrom'), cost: 2700, cat: 'artifacts', from: ['mithril', 'gloves'], st: { dmg: 24, as: 20 }, chain: [25, 120, 4], desc: T('25% шанс выпустить цепную молнию: 120 маг. урона 4 целям.', '25% chance to release chain lightning: 120 magical damage to 4 targets.') }),
    mjollnir: I({ name: T('Мьёльнир', 'Mjollnir'), cost: 5600, cat: 'artifacts', from: ['maelstrom', 'hyperstone'], st: { dmg: 24, as: 80 }, chain: [30, 170, 8], desc: T('30% шанс цепной молнии: 170 маг. урона 8 целям.', '30% chance for chain lightning: 170 magical damage to 8 targets.') }),
    mask_madness: I({ name: T('Маска безумия', 'Mask of Madness'), cost: 1775, cat: 'artifacts', from: ['morbid_mask', 'quarterstaff'], st: { dmg: 10, as: 10, lifesteal: 15 }, active: 'madness', cd: 16, desc: T('Берсерк: +110 к скорости атаки и +30 к скорости на 6 с, но −8 брони и немота.', 'Berserk: +110 attack speed and +30 move speed for 6s, but -8 armor and silence.') }),
    dragon_lance: I({ name: T('Драконье копьё', 'Dragon Lance'), cost: 1900, cat: 'artifacts', from: ['band', 'ogre_axe'], st: { agi: 12, str: 13, range: 150 }, desc: T('+150 к дальности атаки (дальний бой).', '+150 attack range (ranged).') }),
    butterfly: I({ name: T('Бабочка', 'Butterfly'), cost: 4975, cat: 'artifacts', from: ['eaglesong', 'talisman', 'quarterstaff'], st: { agi: 35, evasion: 35, as: 30, dmg: 25 } }),
    sange: I({ name: T('Санге', 'Sange'), cost: 2050, cat: 'artifacts', from: ['belt', 'ogre_axe'], st: { str: 16, hpr: 3 } }),
    yasha: I({ name: T('Яша', 'Yasha'), cost: 2050, cat: 'artifacts', from: ['band', 'blade_alacrity'], st: { agi: 16, as: 12, msPct: 8 } }),
    sange_yasha: I({ name: T('Санге и Яша', 'Sange and Yasha'), cost: 4100, cat: 'artifacts', from: ['sange', 'yasha'], st: { str: 16, agi: 16, as: 12, msPct: 12, hpr: 3 } }),
    shadow_blade: I({ name: T('Клинок тени', 'Shadow Blade'), cost: 3000, cat: 'artifacts', from: ['shadow_amulet', 'claymore'], st: { dmg: 25, as: 20 }, active: 'shadow', cd: 28, mana: 75, desc: T('Невидимость на 14 с; первая атака из невидимости +175 урона.', 'Invisibility for 14s; the first attack from it deals +175 damage.') }),
    aegis: I({ name: T('Аегис Бессмертного', 'Aegis of the Immortal'), cost: 0, cat: 'drop', aegis: true, noSell: true, desc: T('Воскрешает владельца через 5 с после смерти. Пропадает через 5 минут.', 'Revives its owner 5s after death. Expires after 5 minutes.') }),
    cheese: I({ name: T('Сыр', 'Cheese'), cost: 0, cat: 'drop', active: 'cheese', noSell: true, desc: T('Мгновенно восстанавливает 2500 здоровья и 1500 маны.', 'Instantly restores 2500 health and 1500 mana.') })
  };
  for (const k in ITEMS) { const it = ITEMS[k]; it.id = k; if (it.from) it.recipe = it.cost - it.from.reduce((s, f) => s + ITEMS[f].cost, 0); }
  const SHOP_TABS = [
    { id: 'basics', name: T('Основное', 'Basics'), cols: ['consumables', 'attributes', 'equipment', 'misc', 'secret'] },
    { id: 'upgrades', name: T('Улучшения', 'Upgrades'), cols: ['accessories', 'support', 'magical', 'armor', 'weapons', 'artifacts'] }
  ];
  const CAT_NAMES = {
    consumables: T('Расходники', 'Consumables'), attributes: T('Атрибуты', 'Attributes'), equipment: T('Снаряжение', 'Equipment'), misc: T('Разное', 'Misc'), secret: T('Тайная лавка', 'Secret Shop'),
    accessories: T('Аксессуары', 'Accessories'), support: T('Поддержка', 'Support'), magical: T('Магия', 'Magical'), armor: T('Броня', 'Armor'), weapons: T('Оружие', 'Weapons'), artifacts: T('Артефакты', 'Artifacts'), misc2: T('Разное', 'Misc'), drop: T('Трофеи', 'Drops')
  };
  ITEMS.perseverance.cat = 'misc';

  const CREEPS = {
    melee: { hp: 550, dmg: [19, 23], armor: 2, ms: 325, range: 100, bat: 1, ap: 0.467, gold: [34, 39], xp: 57, r: 16, mr: 0 },
    ranged: { hp: 300, mp: 500, dmg: [21, 26], armor: 0, ms: 325, range: 500, bat: 1, ap: 0.5, proj: 900, gold: [41, 49], xp: 69, r: 16, mr: 0 },
    siege: { hp: 935, dmg: [35, 46], armor: 0, ms: 325, range: 690, bat: 2.7, ap: 0.7, proj: 1100, gold: [66, 80], xp: 88, r: 22, mr: 80, siege: true },
    melee_super: { hp: 700, dmg: [36, 44], armor: 3, ms: 325, range: 100, bat: 1, ap: 0.467, gold: [19, 25], xp: 25, r: 17, mr: 0 },
    ranged_super: { hp: 475, dmg: [41, 46], armor: 1, ms: 325, range: 500, bat: 1, ap: 0.5, proj: 900, gold: [18, 26], xp: 25, r: 17, mr: 0 },
    melee_mega: { hp: 1270, dmg: [100, 110], armor: 3, ms: 325, range: 100, bat: 1, ap: 0.467, gold: [19, 25], xp: 25, r: 18, mr: 0 },
    ranged_mega: { hp: 1015, dmg: [107, 112], armor: 1, ms: 325, range: 500, bat: 1, ap: 0.5, proj: 900, gold: [18, 26], xp: 25, r: 18, mr: 0 }
  };
  const TOWERS = {
    1: { hp: 1800, armor: 12, dmg: [100, 120], bounty: 100, team: 90 },
    2: { hp: 2500, armor: 16, dmg: [120, 140], bounty: 120, team: 110 },
    3: { hp: 2500, armor: 16, dmg: [140, 160], bounty: 140, team: 125 },
    4: { hp: 2600, armor: 21, dmg: [150, 170], bounty: 140, team: 125 }
  };
  const TOWER_RANGE = 700, TOWER_BAT = 1, TOWER_AP = 0.1;
  const BARRACKS = { melee: { hp: 2200, armor: 15, team: 150 }, ranged: { hp: 1300, armor: 10, team: 100 } };
  const ANCIENT_HP = 4500;
  const NEUTRALS = {
    kobold: { name: T('Кобольд', 'Kobold'), hp: 240, dmg: [10, 13], armor: 0, ms: 270, range: 100, bat: 1.35, gold: [14, 20], xp: 25, r: 14 },
    kobold_foreman: { name: T('Бригадир кобольдов', 'Kobold Foreman'), hp: 400, dmg: [22, 24], armor: 1, ms: 300, range: 100, bat: 1.25, gold: [24, 30], xp: 40, r: 16 },
    troll: { name: T('Горный тролль', 'Hill Troll'), hp: 500, dmg: [29, 33], armor: 1, ms: 290, range: 500, bat: 1.6, proj: 1200, gold: [27, 33], xp: 45, r: 16 },
    wolf: { name: T('Гигантский волк', 'Giant Wolf'), hp: 500, dmg: [23, 26], armor: 2, ms: 350, range: 100, bat: 1.1, gold: [26, 32], xp: 50, r: 17 },
    alpha_wolf: { name: T('Вожак стаи', 'Alpha Wolf'), hp: 750, dmg: [30, 33], armor: 4, ms: 350, range: 100, bat: 1.1, gold: [38, 46], xp: 70, r: 19 },
    satyr: { name: T('Сатир-вор', 'Satyr Banisher'), hp: 400, dmg: [21, 25], armor: 0, ms: 300, range: 300, bat: 1.8, proj: 900, gold: [15, 21], xp: 30, r: 15 },
    satyr_big: { name: T('Сатир-мучитель', 'Satyr Tormenter'), hp: 1100, dmg: [48, 62], armor: 2, ms: 330, range: 300, bat: 1.8, proj: 1500, gold: [60, 76], xp: 110, r: 20 },
    centaur: { name: T('Кентавр-гонец', 'Centaur Courser'), hp: 450, dmg: [16, 22], armor: 1, ms: 350, range: 100, bat: 1.35, gold: [16, 22], xp: 30, r: 17 },
    centaur_big: { name: T('Кентавр-завоеватель', 'Centaur Conqueror'), hp: 1100, dmg: [50, 65], armor: 4, ms: 350, range: 100, bat: 1.35, gold: [60, 76], xp: 110, r: 22, stomp: true },
    hellbear: { name: T('Адский медведь', 'Hellbear Smasher'), hp: 1100, dmg: [55, 70], armor: 3, ms: 350, range: 100, bat: 1.35, gold: [60, 76], xp: 110, r: 23 },
    golem: { name: T('Гранитный голем', 'Granite Golem'), hp: 1700, dmg: [70, 80], armor: 8, ms: 270, range: 100, bat: 1.6, gold: [85, 100], xp: 150, r: 26, ancient: true },
    drake: { name: T('Чёрный дрейк', 'Black Drake'), hp: 950, dmg: [30, 36], armor: 2, ms: 310, range: 300, bat: 2, proj: 900, gold: [35, 45], xp: 60, r: 18, ancient: true },
    dragon: { name: T('Чёрный дракон', 'Black Dragon'), hp: 2000, dmg: [85, 95], armor: 6, ms: 300, range: 300, bat: 2, proj: 900, gold: [100, 120], xp: 180, r: 28, ancient: true }
  };
  const CAMP_TYPES = {
    small_kobold: ['kobold', 'kobold', 'kobold', 'kobold_foreman'],
    small_troll: ['troll', 'troll', 'kobold'],
    medium_wolf: ['wolf', 'wolf', 'alpha_wolf'],
    medium_satyr: ['satyr', 'satyr', 'satyr_big'],
    large_centaur: ['centaur', 'centaur', 'centaur_big'],
    large_hellbear: ['hellbear', 'hellbear'],
    ancient_golem: ['golem', 'golem'],
    ancient_dragon: ['dragon', 'drake', 'drake']
  };
  const ROSHAN = { name: T('Рошан', 'Roshan'), hp: 6000, hpPerMin: 115, dmg: [65, 65], dmgPerMin: 6, armor: 20, mr: 55, ms: 270, range: 150, bat: 1, r: 34, gold: [150, 400], xp: 400, respawn: [480, 660] };
  const RUNES = {
    dd: { name: T('Двойной урон', 'Double Damage'), dur: 45, color: '#4a8aff' },
    haste: { name: T('Ускорение', 'Haste'), dur: 22, color: '#ff3a2a' },
    illusion: { name: T('Иллюзии', 'Illusion'), dur: 75, color: '#e8d040' },
    invis: { name: T('Невидимость', 'Invisibility'), dur: 45, color: '#a060e0' },
    regen: { name: T('Регенерация', 'Regeneration'), dur: 30, color: '#40e060' },
    arcane: { name: T('Волшебство', 'Arcane'), dur: 50, color: '#e040c0' },
    bounty: { name: T('Богатство', 'Bounty'), dur: 0, color: '#f0c030' },
    water: { name: T('Вода', 'Water'), dur: 0, color: '#40a0ff' }
  };
  const POWER_RUNES = ['dd', 'haste', 'illusion', 'invis', 'regen', 'arcane'];

  const BOT_NAMES = ['Merlini', 'Loda', 'Puppey', 'Dendi', 'XBOCT', 'Funn1k', 'LighTofHeaveN', 'ArtStyle', 'Vigoss', 'Solo', 'Maelk', 'KuroKy', 'ComeWithMe', 'Mag', 'NS',
    'Goblak', 'Pgg', 'Sylar', 'Ferrari_430', 'Yao', 'Zhou', 'Hao', 'Mushi', 'Ohaiyo', 'Akke', 'EGM', 'Admiral', 'Bulldog', 's4', 'Fear', 'Arteezy', 'Universe'];
  const BOT_CHAT = {
    ru: { gg: ['gg', 'gg wp', 'хорошая игра'], kill: ['ez', 'изи', 'кек', ':)'], death: ['лаг', 'ну и ну', 'как так', '...'], mines: ['МИНЫ!!!', 'тут мины', 'опять течис'], bh: ['ЧЁРНАЯ ДЫРА', 'бх!'], rosh: ['идём на рошана', 'рошан'], hi: ['glhf', 'удачи', 'gl hf'] },
    en: { gg: ['gg', 'gg wp', 'good game'], kill: ['ez', 'noob', ':)', '?'], death: ['lag', 'wtf', 'omg', '...'], mines: ['MINES!!!', 'mines here', 'techies again'], bh: ['BLACK HOLE', 'bh!'], rosh: ['rosh?', 'going rosh'], hi: ['glhf', 'gl hf', 'have fun'] }
  };

  const STR = {
    ru: {
      title: 'DOTA 98', subtitle: 'Defense of the Ancients', play: 'Играть с ботами', heroes: 'Герои', options: 'Настройки', help: 'Как играть', exit: 'Выход',
      lobby: 'Настройки лобби', team: 'Сторона', radiant: 'Силы Света', dire: 'Силы Тьмы', difficulty: 'Сложность ботов', diff: ['Лёгкие', 'Средние', 'Сложные', 'Нечестные'],
      mode: 'Режим', modes: ['All Pick', 'Случайный герой', 'Наблюдатель'], cheats: 'Читы (-gold, -lvlup…)', start: 'Начать', back: 'Назад', yes: 'Да', no: 'Нет',
      pick: 'Выбор героя', pickHero: 'Выбрать', random: 'Случайный', lockIn: 'Выбран', loading: 'Загрузка...', vs: 'против', strength: 'Сила', agility: 'Ловкость', intelligence: 'Интеллект',
      melee: 'Ближний бой', ranged: 'Дальний бой', roles: { carry: 'Керри', mid: 'Мидер', off: 'Хардлейнер', support: 'Поддержка' },
      day: 'День', night: 'Ночь', gold: 'Золото', level: 'Уровень', dead: 'Воскрешение через', buyback: 'Выкуп', shop: 'Лавка', stash: 'Тайник', courier: 'Курьер', deliver: 'Доставить',
      glyph: 'Глиф', scan: 'Скан', talents: 'Таланты', learn: 'Изучить', quickbuy: 'Быстрая покупка', secretOnly: 'Продаётся в тайной лавке', notEnoughGold: 'Недостаточно золота',
      notEnoughMana: 'Недостаточно маны', cooldown: 'Перезарядка', silenced: 'Немота', outOfRange: 'Слишком далеко', invalid: 'Неверная цель', inventoryFull: 'Инвентарь полон', noShop: 'Нет лавки рядом — куплено в тайник',
      shardLocked: 'Продаётся с 15:00', bought: 'Куплено', sold: 'Продано', sell: 'Продать', recommended: 'Рекомендуемые', components: 'Состоит из', recipe: 'Рецепт', builds: 'Входит в',
      victory: 'ПОБЕДА', defeat: 'ПОРАЖЕНИЕ', radiantWin: 'Силы Света победили!', direWin: 'Силы Тьмы победили!', continue: 'Продолжить', toMenu: 'В главное меню', resume: 'Продолжить игру', quit: 'Покинуть игру',
      paused: 'ПАУЗА', menu: 'Меню', kda: 'У/С/П', lhdn: 'Добито/Денай', nw: 'Ценность', gpm: 'З/мин', xpm: 'О/мин', dmg: 'Урон', items: 'Предметы', hero: 'Герой', player: 'Игрок',
      scoreboard: 'Таблица', networth: 'Преимущество по ценности', firstBlood: 'Первая кровь!', killed: 'убил', denied: 'добил своего', towerFell: 'Башня разрушена', raxFell: 'Казармы разрушены',
      roshanKilled: 'Рошан повержен', aegisTaken: 'подобрал Аегис', aegisReborn: 'возродился с Аегисом', runeTaken: 'подобрал руну', glyphUsed: 'Глиф активирован', courierDead: 'Курьер убит',
      horn: 'Бой начался!', min: 'мин', sec: 'с', mana: 'Мана', cd: 'Перезарядка', dmgPhys: 'физ.', dmgMag: 'маг.', dmgPure: 'чист.', passive: 'Пассивная', ult: 'Ультимейт',
      scepter: 'Скипетр Аганима', shard: 'Осколок Аганима', armor: 'Броня', damage: 'Урон', ms: 'Скорость', attackSpeed: 'Скор. атаки', range: 'Дальность', mr: 'Сопр. магии',
      optSfx: 'Громкость эффектов', optMusic: 'Громкость музыки', optEdge: 'Прокрутка у края', optNums: 'Числа урона', optQuick: 'Быстрое применение', optHp: 'Полоски здоровья крипов', optFps: 'Показывать FPS',
      cheatsOn: 'Читы включены', unfair: 'Нечестные боты получают +25% золота и опыта', spectate: 'Наблюдение за ботами', chatHint: 'Enter — чат',
      armory: 'Коллекция', collected: 'Собрано', ownedShort: 'получено', chests: 'Сундуки', chestHintOpen: 'В каждом — облик для одного из героев.', chestHintEmpty: 'Сундук выдаётся в конце каждого матча.', collectionDone: 'Коллекция собрана полностью.',
      openChest: 'Открыть сундук', chestOf: 'Сундук героя', clickToSkip: 'Щёлкните, чтобы открыть сразу', equip: 'Надеть', equipped: 'Надето', openNext: 'Открыть ещё', done: 'Готово', reward: 'Награда за матч',
      chestGot: 'Получен сундук', chestDebug: 'Сундук выдан (отладка, F7)', itemLocked: 'Выпадает из сундуков', clickEquip: 'Щёлкните, чтобы надеть',
      helpLines: [
        'ПКМ — идти/атаковать, A + ЛКМ — атака с передвижением, S — стоп, H — стоять.',
        'Q W E R (D) — способности, Ctrl + клавиша — изучить, U — таланты. Z X C V B N — предметы, T — свиток телепортации.',
        'Добивайте вражеских крипов последним ударом ради золота. Своих крипов с <50% здоровья можно добить (денай), чтобы враг не получил опыт.',
        'F4 — лавка, F3 — курьер доставит покупки из тайника. Предметы из тайной лавки покупаются только рядом с ней.',
        'Tab — таблица, Пробел — к герою, стрелки/край экрана — камера, клик по миникарте — переместить камеру.',
        'Руны появляются в реке каждые 2 минуты с 6:00, руны богатства — каждые 3 минуты. Рошан в логове у верхней реки роняет Аегис.',
        'Ночью обзор меньше. Из низины не видно возвышенность, из-за деревьев — ничего. Атаки снизу вверх промахиваются в 25% случаев.',
        'Цель — разрушить Древнего противника. Башни падают по порядку: T1 → T2 → T3 → T4 → Древний. Глиф делает здания неуязвимыми на 5 с.',
        'Enter — чат. Читы лобби: -gold 5000, -lvlup 5, -refresh, -wtf, -unwtf, -respawn, -startgame.'
      ]
    },
    en: {
      title: 'DOTA 98', subtitle: 'Defense of the Ancients', play: 'Play vs Bots', heroes: 'Heroes', options: 'Options', help: 'How to Play', exit: 'Exit',
      lobby: 'Lobby Settings', team: 'Team', radiant: 'The Radiant', dire: 'The Dire', difficulty: 'Bot Difficulty', diff: ['Easy', 'Medium', 'Hard', 'Unfair'],
      mode: 'Mode', modes: ['All Pick', 'All Random', 'Spectator'], cheats: 'Cheats (-gold, -lvlup…)', start: 'Start', back: 'Back', yes: 'Yes', no: 'No',
      pick: 'Hero Selection', pickHero: 'Pick', random: 'Random', lockIn: 'Locked', loading: 'Loading...', vs: 'vs', strength: 'Strength', agility: 'Agility', intelligence: 'Intelligence',
      melee: 'Melee', ranged: 'Ranged', roles: { carry: 'Carry', mid: 'Mid', off: 'Offlane', support: 'Support' },
      day: 'Day', night: 'Night', gold: 'Gold', level: 'Level', dead: 'Respawn in', buyback: 'Buyback', shop: 'Shop', stash: 'Stash', courier: 'Courier', deliver: 'Deliver',
      glyph: 'Glyph', scan: 'Scan', talents: 'Talents', learn: 'Learn', quickbuy: 'Quick Buy', secretOnly: 'Sold at the Secret Shop', notEnoughGold: 'Not enough gold',
      notEnoughMana: 'Not enough mana', cooldown: 'On cooldown', silenced: 'Silenced', outOfRange: 'Out of range', invalid: 'Invalid target', inventoryFull: 'Inventory full', noShop: 'No shop nearby — sent to stash',
      shardLocked: 'Available from 15:00', bought: 'Bought', sold: 'Sold', sell: 'Sell', recommended: 'Recommended', components: 'Components', recipe: 'Recipe', builds: 'Builds into',
      victory: 'VICTORY', defeat: 'DEFEAT', radiantWin: 'The Radiant are victorious!', direWin: 'The Dire are victorious!', continue: 'Continue', toMenu: 'Main Menu', resume: 'Resume', quit: 'Leave Game',
      paused: 'PAUSED', menu: 'Menu', kda: 'K/D/A', lhdn: 'LH/DN', nw: 'Net Worth', gpm: 'GPM', xpm: 'XPM', dmg: 'Damage', items: 'Items', hero: 'Hero', player: 'Player',
      scoreboard: 'Scoreboard', networth: 'Net worth advantage', firstBlood: 'First Blood!', killed: 'killed', denied: 'denied', towerFell: 'Tower destroyed', raxFell: 'Barracks destroyed',
      roshanKilled: 'Roshan has been slain', aegisTaken: 'picked up the Aegis', aegisReborn: 'reincarnated with the Aegis', runeTaken: 'picked up a rune', glyphUsed: 'Glyph activated', courierDead: 'Courier killed',
      horn: 'The battle begins!', min: 'min', sec: 's', mana: 'Mana', cd: 'Cooldown', dmgPhys: 'phys.', dmgMag: 'mag.', dmgPure: 'pure', passive: 'Passive', ult: 'Ultimate',
      scepter: 'Aghanim\'s Scepter', shard: 'Aghanim\'s Shard', armor: 'Armor', damage: 'Damage', ms: 'Speed', attackSpeed: 'Attack Speed', range: 'Range', mr: 'Magic Res.',
      optSfx: 'Effects volume', optMusic: 'Music volume', optEdge: 'Edge panning', optNums: 'Damage numbers', optQuick: 'Quick cast', optHp: 'Creep health bars', optFps: 'Show FPS',
      cheatsOn: 'Cheats enabled', unfair: 'Unfair bots get +25% gold and XP', spectate: 'Spectating bots', chatHint: 'Enter — chat',
      armory: 'Collection', collected: 'Collected', ownedShort: 'owned', chests: 'Chests', chestHintOpen: 'Each one holds a look for one of the heroes.', chestHintEmpty: 'You get a chest at the end of every match.', collectionDone: 'Your collection is complete.',
      openChest: 'Open chest', chestOf: 'Hero chest', clickToSkip: 'Click to open now', equip: 'Equip', equipped: 'Equipped', openNext: 'Open another', done: 'Done', reward: 'Match reward',
      chestGot: 'Chest received', chestDebug: 'Chest granted (debug, F7)', itemLocked: 'Drops from chests', clickEquip: 'Click to equip',
      helpLines: [
        'Right click — move/attack, A + left click — attack-move, S — stop, H — hold.',
        'Q W E R (D) — abilities, Ctrl + key — learn, U — talents. Z X C V B N — items, T — Town Portal Scroll.',
        'Land the last hit on enemy creeps for gold. Your own creeps below 50% health can be denied so the enemy gets less XP.',
        'F4 — shop, F3 — the courier delivers purchases from your stash. Secret Shop items can only be bought next to it.',
        'Tab — scoreboard, Space — center on hero, arrows/screen edge — camera, click the minimap to move the camera.',
        'Power runes appear in the river every 2 minutes from 6:00, bounty runes every 3 minutes. Roshan in his pit by the top river drops the Aegis.',
        'Vision is shorter at night. Low ground cannot see high ground, and nobody sees through trees. Attacks uphill miss 25% of the time.',
        'Destroy the enemy Ancient. Towers fall in order: T1 → T2 → T3 → T4 → Ancient. The Glyph makes your buildings invulnerable for 5s.',
        'Enter — chat. Lobby cheats: -gold 5000, -lvlup 5, -refresh, -wtf, -unwtf, -respawn, -startgame.'
      ]
    }
  };

  D.DATA = {
    TICK, DT, MAP, CELL, GRID, XP_TABLE, MAX_LEVEL, NO_POINT, TALENT_LEVELS, RESPAWN, ATTR, DAY_LEN, START_GOLD, GOLD_PER_SEC, PREGAME, BUYBACK_CD,
    HEROES, HERO_ORDER, ITEMS, SHOP_TABS, CAT_NAMES, CREEPS, TOWERS, TOWER_RANGE, TOWER_BAT, TOWER_AP, BARRACKS, ANCIENT_HP, NEUTRALS, CAMP_TYPES, ROSHAN, RUNES, POWER_RUNES,
    BOT_NAMES, BOT_CHAT, STR
  };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
