(function (H) {
  'use strict';

  const SPELL_LIST = [
    {
      id: 'magic_arrow',
      name: 'Волшебная стрела',
      level: 1,
      category: 'combat',
      kind: 'damage',
      target: 'enemy_unit',
      elemental: true,
      dmgPerPower: 10,
      desc: 'Поражает выбранный вражеский отряд сгустком энергии. Наносит 10 единиц урона за единицу Силы магии.'
    },
    {
      id: 'bless',
      name: 'Благословение',
      level: 1,
      category: 'combat',
      kind: 'buff',
      effect: 'bless',
      target: 'ally_unit',
      undeadImmune: true,
      durationPerPower: 1,
      desc: 'Воодушевляет дружественный отряд. Воины всегда наносят свой максимальный базовый урон.'
    },
    {
      id: 'curse',
      name: 'Проклятие',
      level: 1,
      category: 'combat',
      kind: 'debuff',
      effect: 'curse',
      target: 'enemy_unit',
      undeadImmune: true,
      durationPerPower: 1,
      desc: 'Ослабляет вражеский отряд. Проклятые бойцы наносят только минимальный базовый урон.'
    },
    {
      id: 'haste',
      name: 'Ускорение',
      level: 1,
      category: 'combat',
      kind: 'buff',
      effect: 'haste',
      target: 'ally_unit',
      durationPerPower: 1,
      desc: 'Повышает скорость и очерёдность хода дружественного отряда на одну ступень.'
    },
    {
      id: 'slow',
      name: 'Замедление',
      level: 1,
      category: 'combat',
      kind: 'debuff',
      effect: 'slow',
      target: 'enemy_unit',
      durationPerPower: 1,
      desc: 'Сковывает движения вражеского отряда и снижает его скорость на одну ступень.'
    },
    {
      id: 'shield',
      name: 'Щит',
      level: 1,
      category: 'combat',
      kind: 'buff',
      effect: 'shield',
      target: 'ally_unit',
      defBonus: 3,
      rangedShield: 0.5,
      durationPerPower: 1,
      desc: 'Окружает союзный отряд защитным полем: повышает Защиту на +3 и вдвое снижает урон от вражеских стрел.'
    },
    {
      id: 'cure',
      name: 'Исцеление',
      level: 1,
      category: 'combat',
      kind: 'heal',
      target: 'ally_unit',
      undeadImmune: true,
      healPerPower: 5,
      cleansesDebuffs: true,
      desc: 'Снимает все вражеские проклятия с дружественного отряда и восстанавливает 5 здоровья за единицу Силы магии.'
    },
    {
      id: 'view_mines',
      name: 'Показать шахты',
      level: 1,
      category: 'adventure',
      kind: 'view',
      viewType: 'mines',
      target: 'world',
      desc: 'Отмечает на миникарте расположение и владельцев всех шахт в королевстве.'
    },
    {
      id: 'view_resources',
      name: 'Показать ресурсы',
      level: 1,
      category: 'adventure',
      kind: 'view',
      viewType: 'resources',
      target: 'world',
      desc: 'Показывает на миникарте все бесхозные кучи золота, дерева, руды и самоцветов.'
    },
    {
      id: 'lightning_bolt',
      name: 'Молния',
      level: 2,
      category: 'combat',
      kind: 'damage',
      target: 'enemy_unit',
      elemental: true,
      dmgPerPower: 25,
      desc: 'Бьёт с небес разрядом молнии в один вражеский отряд. Наносит 25 единиц урона за единицу Силы магии.'
    },
    {
      id: 'stoneskin',
      name: 'Каменная кожа',
      level: 2,
      category: 'combat',
      kind: 'buff',
      effect: 'stoneskin',
      target: 'ally_unit',
      defBonus: 3,
      durationPerPower: 1,
      desc: 'Укрепляет броню дружественного отряда и повышает его Защиту на +3.'
    },
    {
      id: 'steelskin',
      name: 'Стальная кожа',
      level: 2,
      category: 'combat',
      kind: 'buff',
      effect: 'steelskin',
      target: 'ally_unit',
      defBonus: 5,
      durationPerPower: 1,
      desc: 'Закаляет доспехи союзного отряда подобно стали и повышает его Защиту на +5.'
    },
    {
      id: 'blind',
      name: 'Ослепление',
      level: 2,
      category: 'combat',
      kind: 'debuff',
      effect: 'blind',
      target: 'enemy_unit',
      undeadImmune: true,
      durationPerPower: 1,
      desc: 'Лишает вражеский отряд зрения: цель пропускает ходы и теряет ответный удар, пока её не атакуют.'
    },
    {
      id: 'dispel',
      name: 'Снятие чар',
      level: 2,
      category: 'combat',
      kind: 'dispel',
      target: 'any_unit',
      desc: 'Полностью рассеивает все благословения и проклятия с любого выбранного отряда на поле боя.'
    },
    {
      id: 'turn_undead',
      name: 'Изгнание нежити',
      level: 2,
      category: 'combat',
      kind: 'damage_undead',
      target: 'enemy_unit',
      dmgPerPower: 25,
      desc: 'Святым светом выжигает нежить (Призраков), нанося 25 единиц урона за единицу Силы магии.'
    },
    {
      id: 'summon_boat',
      name: 'Вызов корабля',
      level: 2,
      category: 'adventure',
      kind: 'adventure',
      target: 'world',
      baseChance: 0.50,
      bonusPerPower: 0.10,
      desc: 'Призывает свободную парусную лодку к береговой клетке рядом с героем.'
    },
    {
      id: 'view_artifacts',
      name: 'Показать артефакты',
      level: 2,
      category: 'adventure',
      kind: 'view',
      viewType: 'artifacts',
      target: 'world',
      desc: 'Показывает на миникарте местонахождение всех древних реликвий и артефактов.'
    },
    {
      id: 'view_towns',
      name: 'Показать города',
      level: 2,
      category: 'adventure',
      kind: 'view',
      viewType: 'towns',
      target: 'world',
      desc: 'Раскрывает расположение всех замков и нейтральных деревень на карте мира.'
    },
    {
      id: 'identify_hero',
      name: 'Разведка героя',
      level: 2,
      category: 'adventure',
      kind: 'view',
      viewType: 'identify_hero',
      target: 'world',
      desc: 'До конца дня позволяет видеть точное число воинов в армиях всех вражеских героев.'
    },
    {
      id: 'fireball',
      name: 'Огненный шар',
      level: 3,
      category: 'combat',
      kind: 'area_damage',
      target: 'cell',
      elemental: true,
      radius: 1,
      dmgPerPower: 10,
      desc: 'Взрывает квадрат 3×3 клетки огненным шаром. Каждому задетому отряду наносится 10 урона за Силу магии.'
    },
    {
      id: 'paralyze',
      name: 'Паралич',
      level: 3,
      category: 'combat',
      kind: 'debuff',
      effect: 'paralyze',
      target: 'enemy_unit',
      undeadImmune: true,
      durationPerPower: 1,
      desc: 'Обездвиживает вражеский отряд: цель пропускает ходы и не отвечает на первый удар.'
    },
    {
      id: 'antimagic',
      name: 'Антимагия',
      level: 3,
      category: 'combat',
      kind: 'buff',
      effect: 'antimagic',
      target: 'ally_unit',
      durationPerPower: 1,
      desc: 'Наделяет дружественный отряд полной неуязвимостью ко всем заклинаниям на время действия.'
    },
    {
      id: 'teleport',
      name: 'Телепорт',
      level: 3,
      category: 'combat',
      kind: 'teleport',
      target: 'ally_to_cell',
      desc: 'Мгновенно переносит выбранный союзный отряд на любую свободную клетку поля боя, включая двор за стенами замка.'
    },
    {
      id: 'resurrect',
      name: 'Воскрешение',
      level: 3,
      category: 'combat',
      kind: 'resurrect',
      temporary: true,
      target: 'ally_stack',
      undeadImmune: true,
      hpPerPower: 50,
      desc: 'Поднимает павших воинов в союзном отряде до конца текущего боя (50 здоровья за единицу Силы магии).'
    },
    {
      id: 'view_heroes',
      name: 'Показать героев',
      level: 3,
      category: 'adventure',
      kind: 'view',
      viewType: 'heroes',
      target: 'world',
      desc: 'Отмечает на миникарте текущие координаты всех вражеских полководцев.'
    },
    {
      id: 'meteor_shower',
      name: 'Метеоритный дождь',
      level: 4,
      category: 'combat',
      kind: 'area_damage',
      target: 'cell',
      elemental: true,
      radius: 1,
      dmgPerPower: 25,
      desc: 'Обрушивает камни с небес на область 3×3 клетки, нанося каждому отряду в зоне 25 урона за Силу магии.'
    },
    {
      id: 'elemental_storm',
      name: 'Буря стихий',
      level: 4,
      category: 'combat',
      kind: 'mass_damage',
      target: 'all_units',
      elemental: true,
      dmgPerPower: 25,
      desc: 'Накрывает всё поле боя вихрем огня и молний, нанося 25 урона за Силу магии каждому отряду без иммунитета.'
    },
    {
      id: 'armageddon',
      name: 'Армагеддон',
      level: 4,
      category: 'combat',
      kind: 'mass_damage',
      target: 'all_units',
      elemental: false,
      dmgPerPower: 50,
      desc: 'Выжигает всё поле боя адским пламенем: каждый отряд на поле получает 50 урона за Силу магии.'
    },
    {
      id: 'berserk',
      name: 'Берсерк',
      level: 4,
      category: 'combat',
      kind: 'debuff',
      effect: 'berserk',
      target: 'enemy_unit',
      undeadImmune: true,
      durationPerPower: 1,
      desc: 'Лишает вражеский отряд рассудка: в свой ход он бросается в атаку на ближайший отряд, будь то друг или враг.'
    },
    {
      id: 'resurrect_true',
      name: 'Истинное воскрешение',
      level: 4,
      category: 'combat',
      kind: 'resurrect',
      temporary: false,
      target: 'ally_stack',
      undeadImmune: true,
      hpPerPower: 50,
      desc: 'Навсегда возвращает к жизни павших бойцов союзного отряда (50 здоровья за единицу Силы магии).'
    },
    {
      id: 'town_gate',
      name: 'Городские врата',
      level: 4,
      category: 'adventure',
      kind: 'adventure',
      target: 'world',
      desc: 'Мгновенно переносит героя вместе с армией к воротам ближайшего дружественного города.'
    },
    {
      id: 'dimension_door',
      name: 'Дверь измерений',
      level: 4,
      category: 'adventure',
      kind: 'adventure',
      target: 'world_tile',
      range: 7,
      desc: 'Открывает пространственный портал и переносит героя на любую открытую проходимую клетку в радиусе 7 шагов.'
    },
    {
      id: 'view_all',
      name: 'Показать весь мир',
      level: 4,
      category: 'adventure',
      kind: 'view',
      viewType: 'all',
      target: 'world',
      desc: 'Полностью рассеивает туман войны над всей картой и открывает все города, героев и шахты.'
    }
  ];

  const SPELLS = {};
  for (const s of SPELL_LIST) SPELLS[s.id] = s;

  function spellsByLevel(level, category) {
    return SPELL_LIST.filter(s => s.level === level && (!category || s.category === category));
  }

  function spellEffectValue(spellId, power) {
    const s = SPELLS[spellId];
    const p = Math.max(1, power | 0);
    if (!s) return 0;
    if (s.dmgPerPower) return s.dmgPerPower * p;
    if (s.healPerPower) return s.healPerPower * p;
    if (s.hpPerPower) return s.hpPerPower * p;
    if (s.durationPerPower) return s.durationPerPower * p;
    return p;
  }

  function rollMageGuildSpells(rng) {
    const r = rng || new H.RNG(101);
    const guild = { 1: [], 2: [], 3: [], 4: [] };
    const counts = { 1: [2, 1], 2: [2, 1], 3: [1, 1], 4: [1, 1] };
    for (let lvl = 1; lvl <= 4; lvl++) {
      const combatPool = spellsByLevel(lvl, 'combat').map(s => s.id);
      const advPool = spellsByLevel(lvl, 'adventure').map(s => s.id);
      r.shuffle(combatPool);
      r.shuffle(advPool);
      const [cCount, aCount] = counts[lvl];
      for (let i = 0; i < cCount && i < combatPool.length; i++) guild[lvl].push(combatPool[i]);
      for (let i = 0; i < aCount && i < advPool.length; i++) guild[lvl].push(advPool[i]);
    }
    return guild;
  }

  function heroMaxSpellCharges(hero) {
    if (!hero) return 1;
    const baseK = Math.max(1, hero.knowledge || 1);
    const mult = hero.doubleSpellCharges ? 2 : 1;
    return baseK * mult;
  }

  function learnAndReplenishSpell(hero, spellId) {
    if (!hero || !hero.hasSpellbook || !SPELLS[spellId]) return false;
    if (!hero.spells) hero.spells = {};
    const maxCharges = heroMaxSpellCharges(hero);
    hero.spells[spellId] = Math.max(hero.spells[spellId] || 0, maxCharges);
    return true;
  }

  function visitTownMageGuild(hero, town) {
    if (!hero || !town || !hero.hasSpellbook) return 0;
    const maxLvl = H.townMageGuildLevel(town);
    if (maxLvl <= 0 || !town.guildSpells) return 0;
    let learned = 0;
    for (let lvl = 1; lvl <= maxLvl; lvl++) {
      for (const spId of town.guildSpells[lvl] || []) {
        learnAndReplenishSpell(hero, spId);
        learned++;
      }
    }
    return learned;
  }

  Object.assign(H, {
    SPELL_LIST,
    SPELLS,
    spellsByLevel,
    spellEffectValue,
    rollMageGuildSpells,
    heroMaxSpellCharges,
    learnAndReplenishSpell,
    visitTownMageGuild
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
