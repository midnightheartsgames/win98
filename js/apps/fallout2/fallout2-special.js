/**
 * Fallout 2 S.P.E.C.I.A.L. Character System, Skills, VATS & Inventory Data
 */

const VATS_TARGETS = {
  eyes: { name: 'Глаза', hitMod: -60, critMod: 40, dmgMod: 1.8, desc: 'Критический урон, ослепление' },
  head: { name: 'Голова', hitMod: -40, critMod: 25, dmgMod: 1.5, desc: 'Нокдаун, потеря сознания' },
  torso: { name: 'Торс', hitMod: 0, critMod: 0, dmgMod: 1.0, desc: 'Надежное попадание в центр массы' },
  groin: { name: 'Пах', hitMod: -30, critMod: 20, dmgMod: 1.4, desc: 'Сбивание с ног, тяжелый шок' },
  armLeft: { name: 'Левая лапа/рука', hitMod: -30, critMod: 10, dmgMod: 1.1, desc: 'Повреждение конечности' },
  armRight: { name: 'Правая лапа/рука', hitMod: -30, critMod: 10, dmgMod: 1.1, desc: 'Снижение урона врага' },
  legLeft: { name: 'Левая нога', hitMod: -20, critMod: 10, dmgMod: 1.1, desc: 'Замедление, потеря ОД' },
  legRight: { name: 'Правая нога', hitMod: -20, critMod: 10, dmgMod: 1.1, desc: 'Замедление, потеря ОД' }
};

const ITEMS_DB = {
  spear: {
    id: 'spear',
    name: 'Копье (Spear)',
    type: 'weapon',
    subtype: 'melee',
    icon: 'spear',
    minDmg: 3,
    maxDmg: 10,
    apCost: 4,
    reach: 2, // 2-hex attack distance
    weight: 4,
    desc: 'Традиционное охотничье копье племени Арройо с заточенным кремниевым наконечником. Бьет на дистанцию 2 гекса.'
  },
  unarmed_punch: {
    id: 'unarmed_punch',
    name: 'Удар кулаком',
    type: 'weapon',
    subtype: 'unarmed',
    icon: 'fist',
    minDmg: 1,
    maxDmg: 4,
    apCost: 3,
    reach: 1,
    weight: 0,
    desc: 'Прямой удар кулаком. Быстро и эффективно.'
  },
  unarmed_kick: {
    id: 'unarmed_kick',
    name: 'Удар ногой',
    type: 'weapon',
    subtype: 'unarmed',
    icon: 'boot',
    minDmg: 2,
    maxDmg: 6,
    apCost: 4,
    reach: 1,
    weight: 0,
    desc: 'Мощный удар ногой с размаху.'
  },
  healing_powder: {
    id: 'healing_powder',
    name: 'Целебный порошок',
    type: 'consumable',
    icon: 'powder',
    apCost: 2,
    weight: 1,
    count: 2,
    desc: 'Смесь цветка Брока и корня Ксандер. Восстанавливает 8-16 HP, но временно дурманит разум (-1 к Восприятию).',
    use: (char, log) => {
      const heal = Math.floor(Math.random() * 9) + 8;
      const prev = char.hp;
      char.hp = Math.min(char.maxHp, char.hp + heal);
      char.poison = Math.max(0, char.poison - 2);
      if (log) log(`Вы приняли целебный порошок: +${char.hp - prev} ОЗ. Разум слегка затуманился.`);
      return true;
    }
  },
  dynamite: {
    id: 'dynamite',
    name: 'Пластиковая взрывчатка (C4 / Динамит)',
    type: 'explosive',
    icon: 'dynamite',
    weight: 5,
    count: 1,
    desc: 'Бризантная взрывчатка с часовым взрывателем. Идеально подходит для сноса монолитных каменных дверей Храма.'
  },
  dart: {
    id: 'dart',
    name: 'Дротик из ловушки',
    type: 'misc',
    icon: 'dart',
    weight: 0.1,
    count: 0,
    desc: 'Острый металлический дротик, извлеченный из разминированной нажимной плиты.'
  },
  lockpick: {
    id: 'lockpick',
    name: 'Самодельные отмычки',
    type: 'tool',
    icon: 'lockpicks',
    weight: 1,
    count: 1,
    desc: 'Набор отмычек. Дает +20% к шансу взлома замков.'
  },
  temple_key: {
    id: 'temple_key',
    name: 'Ключ Святилища Камерона',
    type: 'quest',
    icon: 'key',
    weight: 0,
    count: 1,
    desc: 'Массивный ритуальный ключ, отпирающий последнюю дверь Храма Испытаний на путь к Арройо.'
  }
};

class FalloutCharacter {
  constructor() {
    this.name = 'Избранный';
    this.title = 'The Chosen One';
    this.level = 1;
    this.xp = 0;
    this.nextLevelXp = 1000;

    // S.P.E.C.I.A.L. (Balanced Arroyo Trial Build)
    this.special = {
      strength: 6,
      perception: 7,
      endurance: 6,
      charisma: 4,
      intelligence: 6,
      agility: 8,
      luck: 5
    };

    // Temporary stat modifiers (e.g. powder debuff)
    this.tempModifiers = {
      perception: 0
    };

    // Skills (%)
    this.skills = {
      unarmed: 65,      // Tagged
      melee: 65,        // Tagged
      smallGuns: 35,
      lockpick: 45,     // Tagged
      traps: 40,
      steal: 35,
      speech: 45,
      firstAid: 30,
      doctor: 20,
      science: 25,
      repair: 20
    };

    // Inventory
    this.inventory = [
      { ...ITEMS_DB.spear },
      { ...ITEMS_DB.healing_powder, count: 2 },
      { ...ITEMS_DB.lockpick, count: 1 }
    ];

    // Equipped dual active item slots (Fallout 2 Item 1 & Item 2)
    this.slot1 = 'spear';
    this.slot2 = 'unarmed_punch';
    this.activeSlotIndex = 1; // 1 or 2
    this.targetedMode = false; // VATS targeted attack toggle

    // Derived Stats
    this.maxHp = this.calculateMaxHp();
    this.hp = this.maxHp;
    this.ap = this.calculateMaxAp();
    this.currentAp = this.ap;
    this.poison = 0;

    // Position in dungeon (hex coord)
    this.x = 8;
    this.y = 3;
    this.facing = 2; // 0..5 hex directions
  }

  calculateMaxHp() {
    return 15 + this.special.strength + (this.special.endurance * 2);
  }

  calculateMaxAp() {
    return 5 + Math.floor(this.special.agility / 2);
  }

  getEffectiveStat(stat) {
    const base = this.special[stat] || 5;
    const mod = this.tempModifiers[stat] || 0;
    return Math.max(1, Math.min(10, base + mod));
  }

  getArmorClass() {
    return this.special.agility; // Without armor
  }

  getMeleeDamage() {
    return Math.max(1, this.special.strength - 5) + 1;
  }

  getSequence() {
    return 2 * this.getEffectiveStat('perception');
  }

  getCriticalChance() {
    return this.special.luck;
  }

  getCarryWeight() {
    return 25 + (this.special.strength * 25);
  }

  getCurrentWeight() {
    return this.inventory.reduce((sum, item) => sum + ((item.weight || 0) * (item.count || 1)), 0);
  }

  addXp(amount, log) {
    this.xp += amount;
    if (log) log(`Получено ${amount} опыта (XP)!`);
    if (this.xp >= this.nextLevelXp) {
      this.levelUp(log);
    }
  }

  levelUp(log) {
    this.level += 1;
    this.nextLevelXp += this.level * 1000;
    const hpGain = Math.floor(this.special.endurance / 2) + 2;
    this.maxHp += hpGain;
    this.hp = Math.min(this.maxHp, this.hp + hpGain);
    if (log) log(`*** НОВЫЙ УРОВЕНЬ: ${this.level}! Здоровье увеличено на +${hpGain} ОЗ. ***`);
  }

  get activeHand() {
    return this.activeSlotIndex === 1 ? this.slot1 : this.slot2;
  }

  set activeHand(val) {
    if (this.activeSlotIndex === 1) {
      this.slot1 = val;
    } else {
      this.slot2 = val;
    }
  }

  swapActiveSlot() {
    this.activeSlotIndex = (this.activeSlotIndex === 1 ? 2 : 1);
    return this.getActiveWeapon();
  }

  equipToSlot(itemId, slotNum = 1) {
    if (slotNum === 1) {
      this.slot1 = itemId;
    } else {
      this.slot2 = itemId;
    }
  }

  getActiveWeapon() {
    const currentId = this.activeHand;
    if (currentId === 'spear') {
      const hasSpear = this.inventory.some(i => i.id === 'spear' && (i.count === undefined || i.count > 0));
      if (hasSpear) return ITEMS_DB.spear;
    }
    if (currentId === 'unarmed_kick') {
      return ITEMS_DB.unarmed_kick;
    }
    if (currentId === 'unarmed_punch') {
      return ITEMS_DB.unarmed_punch;
    }
    // Check if item is in inventory (e.g. healing powder, dynamite)
    const invItem = this.inventory.find(i => i.id === currentId && (i.count === undefined || i.count > 0));
    if (invItem) return invItem;
    if (ITEMS_DB[currentId]) return ITEMS_DB[currentId];

    // Consumed or removed: reset to unarmed
    if (this.activeSlotIndex === 1) this.slot1 = 'unarmed_punch';
    else this.slot2 = 'unarmed_punch';

    return ITEMS_DB.unarmed_punch;
  }

  cycleActiveWeapon() {
    const currentId = this.activeHand;
    if (currentId === 'unarmed_punch') {
      this.activeHand = 'unarmed_kick';
    } else if (currentId === 'unarmed_kick') {
      this.activeHand = 'unarmed_punch';
    } else if (currentId === 'spear') {
      // Toggle to unarmed in this slot or keep spear
      this.activeHand = 'unarmed_punch';
    } else if (currentId === 'healing_powder') {
      this.activeHand = 'unarmed_punch';
    } else {
      const hasSpear = this.inventory.some(i => i.id === 'spear');
      this.activeHand = hasSpear ? 'spear' : 'unarmed_punch';
    }
    return this.getActiveWeapon();
  }

  toggleTargetedMode() {
    this.targetedMode = !this.targetedMode;
    return this.targetedMode;
  }

  addItem(itemId, count = 1) {
    const base = ITEMS_DB[itemId];
    if (!base) return;
    const existing = this.inventory.find(i => i.id === itemId);
    if (existing && existing.type !== 'weapon') {
      existing.count = (existing.count || 1) + count;
    } else {
      this.inventory.push({ ...base, count });
    }
  }

  removeItem(itemId, count = 1) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx >= 0) {
      const item = this.inventory[idx];
      if (item.count && item.count > count) {
        item.count -= count;
      } else {
        this.inventory.splice(idx, 1);
        if (this.slot1 === itemId) this.slot1 = 'unarmed_punch';
        if (this.slot2 === itemId) this.slot2 = 'unarmed_punch';
      }
      return true;
    }
    return false;
  }

  hasItem(itemId) {
    return this.inventory.some(i => i.id === itemId && (i.count === undefined || i.count > 0));
  }
}

window.FalloutCharacter = FalloutCharacter;
window.VATS_TARGETS = VATS_TARGETS;
window.ITEMS_DB = ITEMS_DB;

