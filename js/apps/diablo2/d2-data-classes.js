(function (D) {
  'use strict';

  const CLASSES = {
    amazon: {
      id: 'amazon', name: 'Амазонка', gen: 'f', str: 20, dex: 25, vit: 20, ene: 15, life: 50, mana: 15, stamina: 84,
      lvlLife: 2, lvlMana: 1.5, lvlStam: 1, vitLife: 3, eneMana: 1.5, vitStam: 1, arBonus: 5, cast: 0.76, fhr: 0.44, block: 0.4,
      trees: ['Лук и арбалет', 'Пассивные и магия', 'Копья и дротики'],
      start: [['javelin', { qty: 40 }], ['buckler', {}]],
      desc: 'Воительница с островов Скованного моря. Лук, копьё и дротики в её руках одинаково смертоносны, а врождённое чутьё позволяет уклоняться от ударов и призывать валькирий.'
    },
    assassin: {
      id: 'assassin', name: 'Ассасин', gen: 'f', str: 20, dex: 20, vit: 20, ene: 25, life: 50, mana: 25, stamina: 95,
      lvlLife: 2, lvlMana: 1.5, lvlStam: 1.25, vitLife: 3, eneMana: 1.75, vitStam: 1.25, arBonus: 15, cast: 0.64, fhr: 0.36, block: 0.28,
      trees: ['Боевые искусства', 'Теневые дисциплины', 'Ловушки'],
      start: [['katar', {}], ['buckler', {}]],
      desc: 'Охотница на отступников-магов из ордена Виз-Джей. Бьёт когтями, копит силу приёмами и завершает бой одним ударом, расставляя ловушки на пути врагов.'
    },
    necromancer: {
      id: 'necromancer', name: 'Некромант', gen: 'm', str: 15, dex: 25, vit: 15, ene: 25, life: 45, mana: 25, stamina: 79,
      lvlLife: 1.5, lvlMana: 2, lvlStam: 1, vitLife: 2, eneMana: 2, vitStam: 1, arBonus: -10, cast: 0.6, fhr: 0.36, block: 0.4,
      trees: ['Призывание', 'Яды и кости', 'Проклятия'],
      start: [['wand', {}]],
      desc: 'Жрец Ратмы из джунглей Кеджистана. Поднимает мёртвых себе в услужение, насылает проклятия и повелевает ядом и костью.'
    },
    barbarian: {
      id: 'barbarian', name: 'Варвар', gen: 'm', str: 30, dex: 20, vit: 25, ene: 10, life: 55, mana: 10, stamina: 92,
      lvlLife: 2, lvlMana: 1, lvlStam: 1, vitLife: 4, eneMana: 1, vitStam: 1, arBonus: 20, cast: 0.72, fhr: 0.4, block: 0.28,
      trees: ['Боевые навыки', 'Боевые мастерства', 'Боевые кличи'],
      start: [['hand_axe', {}], ['buckler', {}]],
      desc: 'Сын северных степей у горы Арреат. Мастер любого оружия ближнего боя, прыгает на врагов, кружится в вихре стали и поднимает дух соратников боевыми кличами.'
    },
    paladin: {
      id: 'paladin', name: 'Паладин', gen: 'm', str: 25, dex: 20, vit: 25, ene: 15, life: 55, mana: 15, stamina: 89,
      lvlLife: 2, lvlMana: 1.5, lvlStam: 1, vitLife: 3, eneMana: 1.5, vitStam: 1, arBonus: 20, cast: 0.64, fhr: 0.36, block: 0.2,
      trees: ['Боевые навыки', 'Боевые ауры', 'Защитные ауры'],
      start: [['short_sword', {}], ['buckler', {}]],
      desc: 'Воин Света из Вестмарша. Сражается мечом и щитом под защитой священных аур, которые укрепляют его самого и всех, кто рядом.'
    },
    sorceress: {
      id: 'sorceress', name: 'Волшебница', gen: 'f', str: 10, dex: 25, vit: 10, ene: 35, life: 40, mana: 35, stamina: 74,
      lvlLife: 1, lvlMana: 2, lvlStam: 1, vitLife: 2, eneMana: 2, vitStam: 1, arBonus: -15, cast: 0.52, fhr: 0.6, block: 0.4,
      trees: ['Огонь', 'Молния', 'Холод'],
      start: [['short_staff', {}]],
      desc: 'Отступница из восточных кланов магов. Повелевает огнём, молнией и холодом, телепортируется сквозь стены и испепеляет врагов издалека.'
    },
    druid: {
      id: 'druid', name: 'Друид', gen: 'm', str: 15, dex: 20, vit: 25, ene: 20, life: 55, mana: 20, stamina: 84,
      lvlLife: 1.5, lvlMana: 2, lvlStam: 1, vitLife: 2, eneMana: 2, vitStam: 1, arBonus: 5, cast: 0.72, fhr: 0.52, block: 0.28,
      trees: ['Стихии', 'Оборотничество', 'Призывание'],
      start: [['club', {}], ['buckler', {}]],
      desc: 'Хранитель лесов Скосглена. Вызывает бури и вулканы, призывает волков, воронов и духов, а в бою оборачивается волком или медведем.'
    }
  };

  const CLASS_ORDER = ['amazon', 'assassin', 'necromancer', 'barbarian', 'paladin', 'sorceress', 'druid'];

  const S = [];
  const sk = (cls, tree, row, col, req, id, name, kind, o) => S.push(Object.assign({ id, cls, tree, row, col, req, name, kind, pre: [] }, o));

  sk('amazon', 0, 0, 1, 1, 'magic_arrow', 'Волшебная стрела', 'shot', { icon: 'arrow', el: 'magic', mana: [1.5, 0], m: 'magicarrow', noAmmo: true, add: { magic: [1, 1, 1, 1] }, ar: [10, 4], weapon: 'bow', desc: 'Стрела из чистой магии. Не расходует стрелы и добавляет магический урон.' });
  sk('amazon', 0, 1, 0, 6, 'multiple_shot', 'Множественный выстрел', 'shot', { icon: 'arrows', el: 'phys', mana: [4, 0.5], m: 'arrow', count: [2, 1], caps: { count: 12 }, spread: 0.13, dmgMul: 0.75, weapon: 'bow', pre: ['magic_arrow'], desc: 'Веер стрел по всем врагам впереди.' });
  sk('amazon', 0, 2, 2, 12, 'exploding_arrow', 'Взрывная стрела', 'shot', { icon: 'firearrow', el: 'fire', mana: [5, 0.5], m: 'firearrow', explode: { r: 2, fire: [2, 4, 3, 4] }, ar: [10, 8], weapon: 'bow', pre: ['magic_arrow'], desc: 'Стрела взрывается огнём при попадании.' });
  sk('amazon', 0, 3, 1, 18, 'guided_arrow', 'Направленная стрела', 'shot', { icon: 'guided', el: 'magic', mana: [8, -0.25], m: 'guided', homing: true, ed: [50, 5], weapon: 'bow', pre: ['multiple_shot'], desc: 'Стрела сама находит цель и никогда не промахивается.' });
  sk('amazon', 0, 4, 0, 24, 'strafe', 'Обстрел', 'shot', { icon: 'strafe', el: 'phys', mana: [11, 0], m: 'arrow', strafe: [5, 0.5], caps: { strafe: 10 }, ed: [5, 5], weapon: 'bow', pre: ['guided_arrow'], desc: 'Град стрел по всем врагам вокруг, по одной на цель.' });

  sk('amazon', 1, 0, 0, 1, 'inner_sight', 'Внутреннее зрение', 'curse', { icon: 'eye', el: 'magic', mana: [5, 0], sub: 'inner_sight', r: [5.3, 0], dur: [8, 4], val: [40, 25], target: 'point', desc: 'Подсвечивает врагов и снижает их защиту.' });
  sk('amazon', 1, 0, 2, 1, 'critical_strike', 'Критический удар', 'passive', { icon: 'crit', el: 'phys', fx: { crit: { dim: [16, 75] } }, weaponAny: true, desc: 'Шанс нанести двойной физический урон.' });
  sk('amazon', 1, 1, 1, 6, 'dodge', 'Уклонение', 'passive', { icon: 'dodge', el: 'phys', fx: { dodge: { dim: [18, 65] } }, desc: 'Шанс увернуться от удара в ближнем бою.' });
  sk('amazon', 1, 2, 2, 12, 'penetrate', 'Проникновение', 'passive', { icon: 'pierce', el: 'phys', fx: { arPct: [35, 10] }, pre: ['critical_strike'], desc: 'Повышает рейтинг атаки.' });
  sk('amazon', 1, 3, 0, 18, 'decoy', 'Приманка', 'summon', { icon: 'decoy', el: 'magic', mana: [19, -0.75], unit: 'decoy', max: [1, 0], dur: [10, 5], target: 'point', pre: ['inner_sight'], desc: 'Двойник, отвлекающий врагов на себя.' });
  sk('amazon', 1, 4, 1, 24, 'valkyrie', 'Валькирия', 'summon', { icon: 'valkyrie', el: 'magic', mana: [25, 1], unit: 'valkyrie', max: [1, 0], target: 'point', pre: ['decoy', 'dodge'], desc: 'Призывает воительницу-валькирию.' });

  sk('amazon', 2, 0, 0, 1, 'jab', 'Укол', 'strike', { icon: 'jab', el: 'phys', mana: [2, 0.1], hits: [3, 0], ed: [-15, 5], ar: [10, 8], weapon: 'spear', desc: 'Серия быстрых уколов копьём или дротиком.' });
  sk('amazon', 2, 1, 1, 6, 'power_strike', 'Мощный удар', 'strike', { icon: 'bolt', el: 'light', mana: [2, 0.25], add: { light: [1, 15, 5, 10] }, ar: [20, 12], weapon: 'spear', pre: ['jab'], desc: 'Удар копьём, заряженный молнией.' });
  sk('amazon', 2, 1, 2, 6, 'poison_javelin', 'Отравленный дротик', 'shot', { icon: 'poison', el: 'poison', mana: [4, 0.25], m: 'javelin', trail: 'poison', trailDmg: [12, 18, 10, 12], weapon: 'throw', desc: 'Дротик оставляет за собой облако яда.' });
  sk('amazon', 2, 3, 1, 18, 'charged_strike', 'Заряженный удар', 'strike', { icon: 'cbolt', el: 'light', mana: [4, 0.5], bolts: [3, 0.34], caps: { bolts: 8 }, boltDmg: [1, 30, 6, 9], ar: [20, 10], weapon: 'spear', pre: ['power_strike'], desc: 'При попадании выпускает разряды молний.' });
  sk('amazon', 2, 4, 2, 24, 'lightning_fury', 'Ярость молнии', 'shot', { icon: 'lfury', el: 'light', mana: [10, 0.5], m: 'lightjav', convert: 'light', conv: [1, 40, 10, 12], split: [2, 1], caps: { split: 12 }, weapon: 'throw', pre: ['poison_javelin', 'charged_strike'], desc: 'Дротик-молния раскалывается на разряды при попадании.' });

  sk('assassin', 0, 0, 0, 1, 'tiger_strike', 'Удар тигра', 'strike', { icon: 'tiger', el: 'phys', mana: [1, 0], charge: 'tiger', chargeEd: [100, 20], weapon: 'melee', desc: 'Копит силу. Завершающий удар получает бонус к урону за каждый заряд.' });
  sk('assassin', 0, 0, 2, 1, 'dragon_talon', 'Коготь дракона', 'strike', { icon: 'kick', el: 'phys', mana: [2, 0], kick: true, hits: [1, 0.17], caps: { hits: 5 }, ed: [5, 8], ar: [15, 10], finisher: true, anim: 'kick', desc: 'Серия ударов ногами. Завершает накопленные приёмы.' });
  sk('assassin', 0, 1, 1, 6, 'fists_of_fire', 'Огненные кулаки', 'strike', { icon: 'fist', el: 'fire', mana: [2, 0], charge: 'fire', chargeDmg: [4, 8, 2, 3], weapon: 'melee', pre: ['tiger_strike'], desc: 'Копит огонь. Завершающий удар взрывается пламенем.' });
  sk('assassin', 0, 3, 1, 18, 'claws_of_thunder', 'Когти грома', 'strike', { icon: 'thunder', el: 'light', mana: [2, 0], charge: 'thunder', chargeDmg: [1, 40, 6, 12], weapon: 'melee', pre: ['fists_of_fire'], desc: 'Копит молнию. Завершающий удар выпускает кольцо разрядов.' });
  sk('assassin', 0, 4, 1, 24, 'phoenix_strike', 'Удар феникса', 'strike', { icon: 'phoenix', el: 'fire', mana: [2, 0], charge: 'phoenix', chargeDmg: [20, 40, 8, 12], weapon: 'melee', pre: ['claws_of_thunder'], desc: 'Копит силу стихий: метеор, цепная молния и ледяные стрелы.' });

  sk('assassin', 1, 0, 1, 1, 'claw_mastery', 'Мастерство когтей', 'passive', { icon: 'claw', el: 'phys', fx: { ar: [35, 12], ed: [15, 5], crit: { dim: [3, 30] } }, weapons: ['claw'], desc: 'Повышает урон и точность когтей.' });
  sk('assassin', 1, 1, 0, 6, 'burst_of_speed', 'Ускорение', 'buff', { icon: 'speed', el: 'shadow', mana: [10, -0.5], sub: 'burst', dur: [120, 12], ias: { dim: [15, 60] }, frw: { dim: [15, 70] }, target: 'self', pre: ['claw_mastery'], desc: 'Повышает скорость атаки и бега.' });
  sk('assassin', 1, 2, 2, 12, 'weapon_block', 'Блок оружием', 'passive', { icon: 'wblock', el: 'phys', fx: { clawBlock: { dim: [12, 60] } }, weapons: ['claw'], pre: ['claw_mastery'], desc: 'Шанс отразить удар когтями.' });
  sk('assassin', 1, 3, 0, 18, 'fade', 'Тень', 'buff', { icon: 'fade', el: 'shadow', mana: [10, 0], sub: 'fade', dur: [108, 12], resAll: { dim: [15, 75] }, target: 'self', pre: ['burst_of_speed'], desc: 'Повышает сопротивление всем стихиям.' });
  sk('assassin', 1, 4, 1, 24, 'shadow_warrior', 'Воин тени', 'summon', { icon: 'shadow', el: 'shadow', mana: [32, 0], unit: 'shadow', max: [1, 0], target: 'point', pre: ['fade', 'weapon_block'], desc: 'Призывает теневого двойника, повторяющего ваши приёмы.' });

  sk('assassin', 2, 0, 1, 1, 'fire_blast', 'Огненный взрыв', 'bolt', { icon: 'bomb', el: 'fire', mana: [2, 0.25], m: 'bomb', dmg: { fire: [3, 6, 3, 4] }, explode: 2.2, target: 'point', desc: 'Бросает бомбу, взрывающуюся огнём.' });
  sk('assassin', 2, 1, 0, 6, 'shock_web', 'Паутина молний', 'bolt', { icon: 'web', el: 'light', mana: [6, 0.25], m: 'web', count: [3, 0.34], caps: { count: 8 }, spread: 0.45, dmg: { light: [2, 10, 2, 4] }, target: 'point', pre: ['fire_blast'], desc: 'Разбрасывает сеть разрядов, бьющих врагов на земле.' });
  sk('assassin', 2, 1, 2, 6, 'blade_sentinel', 'Страж-клинок', 'bolt', { icon: 'blade', el: 'phys', mana: [7, 0], m: 'sentinel', dmg: { phys: [4, 8, 3, 4] }, target: 'point', desc: 'Вращающийся клинок, режущий всех на своём пути.' });
  sk('assassin', 2, 3, 0, 18, 'charged_bolt_sentry', 'Страж заряженных стрел', 'trap', { icon: 'sentry', el: 'light', mana: [13, 0], unit: 'cbsentry', max: [5, 0], shots: 5, boltCount: [5, 0.25], dmg: { light: [2, 12, 5, 7] }, target: 'point', pre: ['shock_web'], desc: 'Ловушка стреляет заряженными молниями.' });
  sk('assassin', 2, 4, 1, 24, 'lightning_sentry', 'Страж молний', 'trap', { icon: 'lsentry', el: 'light', mana: [20, 0], unit: 'lsentry', max: [5, 0], shots: 10, dmg: { light: [1, 80, 10, 14] }, target: 'point', pre: ['charged_bolt_sentry', 'blade_sentinel'], desc: 'Ловушка бьёт молниями по ближайшим врагам.' });

  sk('necromancer', 0, 0, 0, 1, 'raise_skeleton', 'Поднять скелета', 'summon', { icon: 'skeleton', el: 'bone', mana: [6, 1], unit: 'skeleton', max: 'raise', corpse: true, target: 'corpse', desc: 'Поднимает скелета-воина из трупа.' });
  sk('necromancer', 0, 0, 2, 1, 'skeleton_mastery', 'Мастерство скелетов', 'passive', { icon: 'skull', el: 'bone', fx: { skelLife: [8, 8], skelDmg: [2, 2] }, desc: 'Усиливает скелетов: больше жизни и урона.' });
  sk('necromancer', 0, 1, 1, 6, 'clay_golem', 'Глиняный голем', 'summon', { icon: 'golem', el: 'nature', mana: [15, 3], unit: 'claygolem', max: [1, 0], golem: true, target: 'point', desc: 'Медлительный голем из глины, замедляющий врагов.' });
  sk('necromancer', 0, 2, 0, 12, 'raise_skeletal_mage', 'Поднять скелета-мага', 'summon', { icon: 'skelmage', el: 'bone', mana: [8, 1], unit: 'skelmage', max: 'raise', corpse: true, target: 'corpse', pre: ['raise_skeleton'], desc: 'Поднимает скелета-мага, бьющего стихиями.' });
  sk('necromancer', 0, 3, 1, 18, 'blood_golem', 'Кровавый голем', 'summon', { icon: 'bgolem', el: 'fire', mana: [25, 4], unit: 'bloodgolem', max: [1, 0], golem: true, target: 'point', pre: ['clay_golem'], desc: 'Голем, делящий с хозяином выпитую жизнь.' });
  sk('necromancer', 0, 4, 1, 24, 'fire_golem', 'Огненный голем', 'summon', { icon: 'fgolem', el: 'fire', mana: [50, 10], unit: 'firegolem', max: [1, 0], golem: true, target: 'point', pre: ['blood_golem'], desc: 'Пылающий голем с аурой священного огня.' });

  sk('necromancer', 1, 0, 1, 1, 'teeth', 'Зубы', 'bolt', { icon: 'teeth', el: 'magic', mana: [3, 0.5], m: 'tooth', count: [2, 1], caps: { count: 24 }, spread: 0.2, dmg: { magic: [2, 4, 1, 1] }, target: 'point', syn: [['bone_spear', 15], ['corpse_explosion', 10]], desc: 'Веер магических зубов.' });
  sk('necromancer', 1, 1, 0, 6, 'bone_armor', 'Костяная броня', 'buff', { icon: 'bonearmor', el: 'bone', mana: [11, 1], sub: 'bone_armor', absorb: [20, 10], target: 'self', desc: 'Костяной панцирь поглощает физический урон.' });
  sk('necromancer', 1, 1, 2, 6, 'corpse_explosion', 'Взрыв трупа', 'corpse', { icon: 'cexplode', el: 'fire', mana: [15, 1], sub: 'explode', r: [2.6, 0.33], caps: { r: 6 }, pct: [60, 100], target: 'corpse', pre: ['teeth'], desc: 'Взрывает труп, раня всех вокруг.' });
  sk('necromancer', 1, 3, 1, 18, 'bone_spear', 'Костяное копьё', 'bolt', { icon: 'bonespear', el: 'magic', mana: [7, 0.5], m: 'bonespear', dmg: { magic: [16, 24, 8, 8] }, pierce: true, target: 'point', syn: [['teeth', 7]], pre: ['corpse_explosion'], desc: 'Копьё из кости пронзает всех врагов на пути.' });
  sk('necromancer', 1, 4, 2, 24, 'poison_nova', 'Ядовитая звезда', 'nova', { icon: 'pnova', el: 'poison', mana: [20, 2], dmg: { poison: [60, 80, 25, 30] }, pdur: 2, pre: ['corpse_explosion'], desc: 'Кольцо яда расходится во все стороны.' });

  sk('necromancer', 2, 0, 0, 1, 'amplify_damage', 'Усиление урона', 'curse', { icon: 'amplify', el: 'shadow', mana: [4, 0], sub: 'amplify', r: [1.3, 0.66], caps: { r: 6 }, dur: [8, 3], target: 'point', desc: 'Проклятые враги получают двойной физический урон.' });
  sk('necromancer', 2, 1, 1, 6, 'weaken', 'Ослабление', 'curse', { icon: 'weaken', el: 'shadow', mana: [4, 0], sub: 'weaken', r: [2.6, 0.66], caps: { r: 7 }, dur: [14, 2], target: 'point', pre: ['amplify_damage'], desc: 'Проклятые враги наносят на треть меньше урона.' });
  sk('necromancer', 2, 2, 0, 12, 'iron_maiden', 'Железная дева', 'curse', { icon: 'maiden', el: 'shadow', mana: [5, 0], sub: 'iron_maiden', r: [2, 0.3], caps: { r: 5 }, dur: [12, 2.4], val: [200, 25], target: 'point', pre: ['amplify_damage'], desc: 'Враг получает урон от собственных ударов.' });
  sk('necromancer', 2, 3, 1, 18, 'life_tap', 'Отбор жизни', 'curse', { icon: 'lifetap', el: 'shadow', mana: [9, 0], sub: 'life_tap', r: [1.3, 0.66], caps: { r: 6 }, dur: [13, 2], target: 'point', pre: ['iron_maiden', 'weaken'], desc: 'Удары по проклятым врагам лечат атакующего.' });
  sk('necromancer', 2, 4, 1, 24, 'decrepify', 'Дряхлость', 'curse', { icon: 'decrepify', el: 'shadow', mana: [11, 0], sub: 'decrepify', r: [4, 0], dur: [4, 0.6], target: 'point', pre: ['life_tap'], desc: 'Враги замедляются и слабеют.' });

  sk('barbarian', 0, 0, 0, 1, 'bash', 'Мощный удар', 'strike', { icon: 'bash', el: 'phys', mana: [2, 0], knock: true, ed: [50, 5], ar: [20, 5], weapon: 'melee', desc: 'Сокрушительный удар, отбрасывающий врага.' });
  sk('barbarian', 0, 1, 2, 6, 'double_swing', 'Двойной взмах', 'strike', { icon: 'double', el: 'phys', mana: [2, 0], hits: [2, 0], ar: [15, 5], ed: [0, 3], weapon: 'melee', desc: 'Два быстрых удара подряд.' });
  sk('barbarian', 0, 2, 0, 12, 'stun', 'Оглушение', 'strike', { icon: 'stun', el: 'phys', mana: [2, 0], stun: [1, 0.2], caps: { stun: 5 }, ar: [15, 5], weapon: 'melee', pre: ['bash'], desc: 'Оглушает врага на несколько секунд.' });
  sk('barbarian', 0, 3, 1, 18, 'leap_attack', 'Атака в прыжке', 'strike', { icon: 'leap', el: 'phys', mana: [9, 0.5], leap: true, ed: [100, 30], ar: [50, 15], weapon: 'melee', pre: ['stun'], desc: 'Прыжок к врагу с могучим ударом.' });
  sk('barbarian', 0, 4, 1, 24, 'whirlwind', 'Вихрь', 'strike', { icon: 'whirl', el: 'phys', mana: [25, 0], whirl: true, ed: [0, 5], ar: [0, 5], weapon: 'melee', target: 'point', pre: ['leap_attack', 'double_swing'], desc: 'Проносится сквозь врагов, разя всех вокруг.' });

  sk('barbarian', 1, 0, 0, 1, 'sword_mastery', 'Мастерство мечей', 'passive', { icon: 'sword', el: 'phys', fx: { ar: [28, 8], ed: [28, 5], crit: { dim: [3, 30] } }, weapons: ['sword', 'dagger'], desc: 'Повышает урон и точность мечей и кинжалов.' });
  sk('barbarian', 1, 0, 1, 1, 'axe_mastery', 'Мастерство топоров', 'passive', { icon: 'axe', el: 'phys', fx: { ar: [28, 8], ed: [28, 5], crit: { dim: [3, 30] } }, weapons: ['axe'], desc: 'Повышает урон и точность топоров.' });
  sk('barbarian', 1, 0, 2, 1, 'mace_mastery', 'Мастерство дробящего', 'passive', { icon: 'mace', el: 'phys', fx: { ar: [28, 8], ed: [28, 5], crit: { dim: [3, 30] } }, weapons: ['mace', 'club', 'hammer', 'scepter'], desc: 'Повышает урон и точность булав, дубин и молотов.' });
  sk('barbarian', 1, 2, 1, 12, 'iron_skin', 'Железная кожа', 'passive', { icon: 'skin', el: 'phys', fx: { edef: [30, 10] }, desc: 'Повышает защиту.' });
  sk('barbarian', 1, 4, 1, 24, 'natural_resistance', 'Природная стойкость', 'passive', { icon: 'natres', el: 'nature', fx: { resAll: { dim: [12, 80] } }, pre: ['iron_skin'], desc: 'Повышает сопротивление всем стихиям.' });

  sk('barbarian', 2, 0, 0, 1, 'howl', 'Вой', 'warcry', { icon: 'howl', el: 'shadow', mana: [4, 0], sub: 'howl', r: [4, 1.3], caps: { r: 16 }, dur: [3, 1], desc: 'Враги в ужасе разбегаются.' });
  sk('barbarian', 2, 0, 2, 1, 'find_potion', 'Найти зелье', 'corpse', { icon: 'potion', el: 'nature', mana: [2, 0], sub: 'potion', chance: { dim: [15, 65] }, target: 'corpse', desc: 'Обыскивает труп в поисках зелья.' });
  sk('barbarian', 2, 1, 0, 6, 'shout', 'Крик', 'warcry', { icon: 'shout', el: 'phys', mana: [6, 0], sub: 'shout', r: [8, 0], dur: [16, 2], val: [100, 10], pre: ['howl'], desc: 'Повышает защиту вашу и союзников.' });
  sk('barbarian', 2, 3, 1, 18, 'battle_cry', 'Боевой клич', 'warcry', { icon: 'bcry', el: 'shadow', mana: [5, 0.5], sub: 'battle_cry', r: [4.6, 0.6], caps: { r: 12 }, dur: [12, 1.2], val: [50, 2], pre: ['shout'], desc: 'Ослабляет защиту и урон врагов вокруг.' });
  sk('barbarian', 2, 4, 0, 24, 'battle_orders', 'Боевые приказы', 'warcry', { icon: 'borders', el: 'phys', mana: [7, 0], sub: 'battle_orders', r: [8, 0], dur: [30, 6], val: [35, 3], pre: ['shout'], desc: 'Повышает запас жизни, маны и выносливости отряда.' });

  sk('paladin', 0, 0, 0, 1, 'sacrifice', 'Жертва', 'strike', { icon: 'sacrifice', el: 'holy', mana: [0, 0], sacrifice: 8, ed: [180, 15], ar: [20, 6], weapon: 'melee', desc: 'Удар огромной силы ценой части собственной жизни.' });
  sk('paladin', 0, 1, 2, 6, 'holy_bolt', 'Священная стрела', 'bolt', { icon: 'holybolt', el: 'holy', mana: [4, 0.25], m: 'holybolt', dmg: { magic: [8, 16, 6, 6] }, undeadOnly: true, heal: [1, 6, 1, 2], target: 'point', desc: 'Жжёт нежить и лечит союзников.' });
  sk('paladin', 0, 2, 0, 12, 'zeal', 'Рвение', 'strike', { icon: 'zeal', el: 'phys', mana: [2, 0], hits: [2, 1], caps: { hits: 5 }, ar: [10, 5], ed: [0, 6], weapon: 'melee', pre: ['sacrifice'], desc: 'Серия молниеносных ударов.' });
  sk('paladin', 0, 3, 1, 18, 'blessed_hammer', 'Благословенный молот', 'bolt', { icon: 'hammer', el: 'holy', mana: [5, 0.25], m: 'hammer', dmg: { magic: [12, 16, 8, 10] }, undeadBonus: 1.5, target: 'point', pre: ['holy_bolt'], desc: 'Молот света кружит по спирали вокруг паладина.' });
  sk('paladin', 0, 4, 2, 24, 'holy_shield', 'Святой щит', 'buff', { icon: 'hshield', el: 'holy', mana: [35, 0], sub: 'holy_shield', dur: [30, 25], edef: [25, 15], block: [15, 1], target: 'self', needShield: true, pre: ['blessed_hammer'], desc: 'Освящает щит: больше защиты и блоков.' });

  sk('paladin', 1, 0, 0, 1, 'might', 'Мощь', 'aura', { icon: 'might', el: 'phys', sub: 'might', r: [7.3, 0.6], ed: [40, 10], desc: 'Аура: вы и союзники наносите больше урона.' });
  sk('paladin', 1, 1, 1, 6, 'holy_fire', 'Священный огонь', 'aura', { icon: 'holyfire', el: 'fire', sub: 'holy_fire', r: [4, 0.4], dps: [2, 5, 2, 3], add: { fire: [3, 8, 2, 3] }, pre: ['might'], desc: 'Аура: огонь обжигает врагов вокруг и ваше оружие.' });
  sk('paladin', 1, 1, 2, 6, 'thorns', 'Шипы', 'aura', { icon: 'thorns', el: 'phys', sub: 'thorns', r: [4, 0], val: [250, 40], pre: ['might'], desc: 'Аура: враги ранят сами себя, нанося удары.' });
  sk('paladin', 1, 3, 1, 18, 'holy_freeze', 'Священный холод', 'aura', { icon: 'holyfreeze', el: 'cold', sub: 'holy_freeze', r: [4, 0.4], dps: [3, 6, 2, 3], slow: { dim: [25, 60] }, pre: ['holy_fire'], desc: 'Аура: холод замедляет и ранит врагов вокруг.' });
  sk('paladin', 1, 4, 0, 24, 'fanaticism', 'Фанатизм', 'aura', { icon: 'fanat', el: 'phys', sub: 'fanaticism', r: [7.3, 0.6], ed: [50, 10], ias: { dim: [10, 40] }, arPct: [40, 5], pre: ['might'], desc: 'Аура: больше урона, точности и скорости атаки.' });

  sk('paladin', 2, 0, 0, 1, 'prayer', 'Молитва', 'aura', { icon: 'prayer', el: 'holy', sub: 'prayer', r: [7.3, 0.6], heal: [1.5, 0.8], desc: 'Аура: постоянно исцеляет вас и союзников.' });
  sk('paladin', 2, 1, 1, 6, 'defiance', 'Непокорность', 'aura', { icon: 'defiance', el: 'phys', sub: 'defiance', r: [7.3, 0.6], edef: [70, 10], desc: 'Аура: повышает защиту отряда.' });
  sk('paladin', 2, 2, 0, 12, 'cleansing', 'Очищение', 'aura', { icon: 'cleansing', el: 'holy', sub: 'cleansing', r: [7.3, 0.6], cut: { dim: [30, 85] }, pre: ['prayer'], desc: 'Аура: сокращает яд и проклятия на союзниках.' });
  sk('paladin', 2, 3, 1, 18, 'vigor', 'Бодрость', 'aura', { icon: 'vigor', el: 'phys', sub: 'vigor', r: [7.3, 0.6], frw: { dim: [13, 70] }, pre: ['defiance', 'cleansing'], desc: 'Аура: быстрее бег и восстановление выносливости.' });
  sk('paladin', 2, 4, 0, 24, 'meditation', 'Медитация', 'aura', { icon: 'meditation', el: 'holy', sub: 'meditation', r: [7.3, 0.6], regen: [65, 10], pre: ['cleansing'], desc: 'Аура: ускоряет восстановление маны.' });

  sk('sorceress', 0, 0, 1, 1, 'fire_bolt', 'Огненная стрела', 'bolt', { icon: 'firebolt', el: 'fire', mana: [2.5, 0], m: 'firebolt', dmg: { fire: [3, 6, 3, 4] }, target: 'point', syn: [['fire_ball', 16], ['meteor', 16]], desc: 'Выпускает сгусток пламени.' });
  sk('sorceress', 0, 1, 0, 6, 'inferno', 'Инферно', 'stream', { icon: 'inferno', el: 'fire', mana: [7, 1], el2: 'fire', dmg: [8, 16, 5, 8], range: [3.4, 0.35], caps: { range: 9 }, target: 'point', desc: 'Струя огня, пока удерживается кнопка.' });
  sk('sorceress', 0, 2, 1, 12, 'fire_ball', 'Огненный шар', 'bolt', { icon: 'fireball', el: 'fire', mana: [5, 0.5], m: 'fireball', dmg: { fire: [8, 16, 8, 10] }, explode: 2, target: 'point', syn: [['fire_bolt', 14], ['meteor', 14]], pre: ['fire_bolt'], desc: 'Взрывающийся шар огня.' });
  sk('sorceress', 0, 3, 0, 18, 'fire_wall', 'Стена огня', 'firewall', { icon: 'firewall', el: 'fire', mana: [22, 1], cd: 1.4, dmg: [16, 20, 8, 9], len: [5, 0.5], caps: { len: 12 }, dur: 3.6, target: 'point', syn: [['inferno', 4]], pre: ['inferno'], desc: 'Стена пламени поперёк пути врагов.' });
  sk('sorceress', 0, 4, 1, 24, 'meteor', 'Метеор', 'meteor', { icon: 'meteor', el: 'fire', mana: [17, 1], cd: 1.2, dmg: { fire: [45, 60, 14, 16] }, burn: [8, 12, 3, 4], r: 3, target: 'point', syn: [['fire_bolt', 5], ['fire_ball', 5]], pre: ['fire_ball', 'fire_wall'], desc: 'С неба падает пылающий метеор.' });

  sk('sorceress', 1, 0, 1, 1, 'charged_bolt', 'Заряженная стрела', 'bolt', { icon: 'cbolt', el: 'light', mana: [3, 0.5], m: 'cbolt', count: [3, 1], caps: { count: 24 }, spread: 0.9, dmg: { light: [2, 5, 1, 1] }, target: 'point', desc: 'Россыпь блуждающих разрядов.' });
  sk('sorceress', 1, 1, 0, 6, 'static_field', 'Статическое поле', 'static', { icon: 'static', el: 'light', mana: [9, 0], pct: 25, r: [3.7, 0.66], caps: { r: 12 }, desc: 'Отнимает четверть текущей жизни у врагов вокруг.' });
  sk('sorceress', 1, 2, 1, 12, 'nova', 'Звезда', 'nova', { icon: 'nova', el: 'light', mana: [15, 1], dmg: { light: [1, 20, 8, 9] }, pre: ['static_field'], desc: 'Кольцо молний вокруг волшебницы.' });
  sk('sorceress', 1, 3, 0, 18, 'teleport', 'Телепортация', 'teleport', { icon: 'teleport', el: 'magic', mana: [24, -1], target: 'point', pre: ['static_field'], desc: 'Мгновенный перенос к указанной точке.' });
  sk('sorceress', 1, 4, 1, 24, 'chain_lightning', 'Цепная молния', 'chain', { icon: 'chain', el: 'light', mana: [9, 0.5], dmg: { light: [1, 50, 12, 14] }, jumps: [4, 0.25], caps: { jumps: 12 }, target: 'point', syn: [['charged_bolt', 6], ['nova', 6]], pre: ['nova'], desc: 'Молния перескакивает с врага на врага.' });

  sk('sorceress', 2, 0, 0, 1, 'ice_bolt', 'Ледяная стрела', 'bolt', { icon: 'icebolt', el: 'cold', mana: [3, 0], m: 'icebolt', dmg: { cold: [4, 7, 3, 4] }, chill: [6, 1.4], target: 'point', syn: [['frozen_orb', 15], ['blizzard', 15]], desc: 'Ледяной снаряд, замедляющий врага.' });
  sk('sorceress', 2, 0, 2, 1, 'frozen_armor', 'Ледяная броня', 'buff', { icon: 'farmor', el: 'cold', mana: [7, 0], sub: 'frozen_armor', dur: [120, 12], edef: [30, 5], freeze: [1.2, 0.1], target: 'self', desc: 'Защита и заморозка тех, кто бьёт вас вблизи.' });
  sk('sorceress', 2, 1, 1, 6, 'frost_nova', 'Морозная звезда', 'nova', { icon: 'fnova', el: 'cold', mana: [9, 2], dmg: { cold: [3, 6, 4, 5] }, chill: [8, 1], desc: 'Кольцо холода замедляет всех вокруг.' });
  sk('sorceress', 2, 3, 0, 18, 'blizzard', 'Метель', 'blizzard', { icon: 'blizzard', el: 'cold', mana: [23, 1], cd: 1.8, dmg: { cold: [16, 24, 9, 11] }, r: 3.2, dur: 4, target: 'point', syn: [['ice_bolt', 5]], pre: ['frost_nova', 'ice_bolt'], desc: 'Ледяной град обрушивается на область.' });
  sk('sorceress', 2, 4, 1, 24, 'frozen_orb', 'Ледяная сфера', 'bolt', { icon: 'forb', el: 'cold', mana: [25, 1], cd: 1, m: 'frozenorb', dmg: { cold: [18, 24, 8, 9] }, target: 'point', syn: [['ice_bolt', 5]], pre: ['blizzard'], desc: 'Сфера разбрасывает ледяные осколки во все стороны.' });

  sk('druid', 0, 0, 0, 1, 'firestorm', 'Огненная буря', 'bolt', { icon: 'firestorm', el: 'fire', mana: [4, 0.25], m: 'firestorm', count: [3, 0], spread: 0.35, dmg: { fire: [4, 8, 2, 4] }, target: 'point', syn: [['molten_boulder', 20]], desc: 'Три огненные дорожки ползут к врагам.' });
  sk('druid', 0, 1, 2, 6, 'arctic_blast', 'Арктический поток', 'stream', { icon: 'arctic', el: 'cold', mana: [6, 0.5], el2: 'cold', dmg: [6, 12, 3, 5], range: [3.4, 0.3], caps: { range: 8 }, target: 'point', desc: 'Струя ледяного ветра.' });
  sk('druid', 0, 2, 0, 12, 'molten_boulder', 'Расплавленный валун', 'bolt', { icon: 'boulder', el: 'fire', mana: [10, 1], m: 'boulder', dmg: { phys: [10, 16, 6, 7], fire: [6, 10, 4, 5] }, pierce: true, knock: true, target: 'point', syn: [['firestorm', 10]], pre: ['firestorm'], desc: 'Катящийся раскалённый валун.' });
  sk('druid', 0, 3, 1, 18, 'tornado', 'Торнадо', 'bolt', { icon: 'tornado', el: 'phys', mana: [10, 0], m: 'tornado', dmg: { phys: [25, 35, 9, 11] }, pierce: true, target: 'point', pre: ['arctic_blast'], desc: 'Смерч, петляя, разрывает врагов.' });
  sk('druid', 0, 4, 0, 24, 'volcano', 'Вулкан', 'summon', { icon: 'volcano', el: 'fire', mana: [25, 1], unit: 'volcano', max: [1, 0], dur: [8, 0], target: 'point', dmg: { phys: [8, 12, 3, 4], fire: [10, 16, 4, 5] }, pre: ['molten_boulder'], desc: 'Из земли вырывается вулкан, извергая камни.' });

  sk('druid', 1, 0, 0, 1, 'werewolf', 'Волк-оборотень', 'form', { icon: 'wolf', el: 'nature', mana: [15, 0], form: 'wolf', ias: { dim: [20, 60] }, ar: [50, 15], target: 'self', desc: 'Превращение в волка: быстрые атаки и точность.' });
  sk('druid', 1, 0, 1, 1, 'lycanthropy', 'Ликантропия', 'passive', { icon: 'lycan', el: 'nature', fx: { formLife: [20, 5] }, desc: 'В облике зверя больше жизни.' });
  sk('druid', 1, 1, 1, 6, 'werebear', 'Медведь-оборотень', 'form', { icon: 'bear', el: 'nature', mana: [15, 0], form: 'bear', ed: [25, 10], edef: [25, 10], lifePct: [50, 5], target: 'self', desc: 'Превращение в медведя: сила и живучесть.' });
  sk('druid', 1, 2, 1, 12, 'maul', 'Удар лапой', 'strike', { icon: 'maul', el: 'phys', mana: [3, 0], form: 'bear', ed: [20, 15], stun: [0.6, 0.05], caps: { stun: 2 }, pre: ['werebear'], desc: 'Медвежий удар оглушает врага.' });
  sk('druid', 1, 4, 0, 24, 'fury', 'Неистовство', 'strike', { icon: 'fury', el: 'phys', mana: [4, 0], form: 'wolf', hits: [2, 0.25], caps: { hits: 5 }, ed: [100, 15], ar: [50, 7], pre: ['werewolf'], desc: 'Волк атакует серией укусов.' });

  sk('druid', 2, 0, 0, 1, 'raven', 'Вороны', 'summon', { icon: 'raven', el: 'nature', mana: [6, 0], unit: 'raven', max: [1, 1], caps: { max: 5 }, target: 'point', desc: 'Стая воронов клюёт и ослепляет врагов.' });
  sk('druid', 2, 1, 0, 6, 'spirit_wolf', 'Волк-дух', 'summon', { icon: 'swolf', el: 'nature', mana: [15, 1], unit: 'spiritwolf', max: [1, 1], caps: { max: 5 }, target: 'point', pre: ['raven'], desc: 'Призывает стремительных волков-духов.' });
  sk('druid', 2, 1, 1, 6, 'oak_sage', 'Дубовый мудрец', 'summon', { icon: 'oak', el: 'nature', mana: [15, 1], unit: 'oaksage', max: [1, 0], spirit: true, target: 'point', desc: 'Дух, увеличивающий жизнь отряда.' });
  sk('druid', 2, 3, 1, 18, 'heart_of_wolverine', 'Сердце росомахи', 'summon', { icon: 'wolverine', el: 'nature', mana: [20, 1], unit: 'wolverine', max: [1, 0], spirit: true, target: 'point', pre: ['oak_sage'], desc: 'Дух, усиливающий урон и точность отряда.' });
  sk('druid', 2, 4, 0, 24, 'grizzly', 'Гризли', 'summon', { icon: 'grizzly', el: 'nature', mana: [40, 2], unit: 'grizzly', max: [1, 0], target: 'point', pre: ['spirit_wolf'], desc: 'Призывает огромного медведя-гризли.' });

  const SKILLS = {};
  for (const s of S) SKILLS[s.id] = s;

  const BASIC = {
    attack: { id: 'attack', name: 'Атака', kind: 'basic', icon: 'attack', el: 'phys', desc: 'Обычная атака оружием.' },
    throw: { id: 'throw', name: 'Бросок', kind: 'throw', icon: 'throw', el: 'phys', desc: 'Бросить метательное оружие.' },
    tp: { id: 'tp', name: 'Книга портала', kind: 'tome', icon: 'tp', el: 'magic', desc: 'Открыть портал в город.' },
    id: { id: 'id', name: 'Книга опознания', kind: 'tome', icon: 'idtome', el: 'magic', desc: 'Опознать предмет.' }
  };

  function dim(a, b, L) { return L <= 0 ? 0 : a + (b - a) * Math.floor(110 * L / (L + 6)) / 100; }

  function val(p, L, cap) {
    let v;
    if (p === undefined || p === null) return 0;
    if (typeof p === 'number') v = p;
    else if (Array.isArray(p) && p.length === 2) v = p[0] + p[1] * (L - 1);
    else if (Array.isArray(p) && p.length === 4) {
      let mn = p[0] + p[2] * (L - 1), mx = p[1] + p[3] * (L - 1);
      return [Math.floor(mn), Math.floor(Math.max(mn, mx))];
    } else if (p.dim) v = dim(p.dim[0], p.dim[1], L);
    else v = 0;
    if (cap !== undefined) v = Math.min(v, cap);
    return v;
  }

  function sval(skill, key, L) {
    return val(skill[key], L, skill.caps ? skill.caps[key] : undefined);
  }

  function manaCost(skill, L) {
    if (!skill.mana) return 0;
    return Math.max(skill.id === 'teleport' ? 10 : 0.5, skill.mana[0] + skill.mana[1] * (L - 1));
  }

  function raiseMax(L) { return L < 4 ? L : 2 + Math.floor(L / 3); }

  function classSkills(cls) { return S.filter(s => s.cls === cls); }

  Object.assign(D, { CLASSES, CLASS_ORDER, SKILLS, SKILL_LIST: S, BASIC, dim, val, sval, manaCost, raiseMax, classSkills });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
