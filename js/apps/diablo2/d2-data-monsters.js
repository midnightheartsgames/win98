(function (D) {
  'use strict';

  const R0 = [0, 0, 0];
  const MONSTERS = {
    zombie: { names: ['Зомби', 'Жаждущий плоти', 'Мертвец', 'Гниющий мертвец'], model: 'zombie', ai: 'melee', undead: true, hp: 1.15, dmg: 1.0, ar: 0.8, def: 0.8, xp: 1.1, speed: 1.1, r: 0.36, range: 1.1, atk: 1.0, hitAt: 0.55, pack: [3, 6], res: { p: [0, 20, 50], c: [0, 0, 25] }, tints: ['#6f7d52', '#7d6852', '#56707a', '#7a4f4f'] },
    fallen: { names: ['Падший', 'Резчик', 'Бесёнок', 'Тёмный'], model: 'fallen', ai: 'fallen', demon: true, hp: 0.55, dmg: 0.6, ar: 0.8, def: 0.6, xp: 0.6, speed: 3.0, r: 0.3, range: 0.95, atk: 0.62, hitAt: 0.5, pack: [4, 8], res: { f: [0, 0, 25] }, tints: ['#b03020', '#b06020', '#8030a0', '#303030'] },
    shaman: { names: ['Шаман падших', 'Шаман резчиков', 'Шаман бесов', 'Тёмный шаман'], model: 'shaman', ai: 'shaman', demon: true, hp: 0.75, dmg: 0.8, ar: 0.8, def: 0.6, xp: 1.2, speed: 2.4, r: 0.32, range: 7, atk: 0.9, hitAt: 0.55, missile: 'mfirebolt', el: 'fire', pack: [1, 2], res: { f: [25, 50, 100] }, tints: ['#b03020', '#b06020', '#8030a0', '#303030'] },
    quill_rat: { names: ['Иглокрыс', 'Колючий крыс', 'Шипастый крыс', 'Громовой крыс'], model: 'quillrat', ai: 'ranged', hp: 0.5, dmg: 0.55, ar: 0.9, def: 0.5, xp: 0.7, speed: 3.2, r: 0.3, range: 6, atk: 0.7, hitAt: 0.5, missile: 'quill', pack: [3, 6], res: { p: [0, 25, 50] }, tints: ['#6a5a48', '#5a4a3a', '#7a6a30', '#4a4a70'] },
    dark_hunter: { names: ['Тёмная охотница', 'Мерзкая охотница', 'Тёмная преследовательница', 'Чёрная убийца'], model: 'rogue_dark', ai: 'melee', hp: 1.0, dmg: 1.0, ar: 1.0, def: 1.0, xp: 1.1, speed: 2.8, r: 0.34, range: 1.1, atk: 0.75, hitAt: 0.5, weapon: 'sword', pack: [3, 5], res: { c: [0, 25, 50] }, tints: ['#5a3a5a', '#4a3a2a', '#2a3a5a', '#3a1a1a'] },
    dark_archer: { names: ['Тёмная лучница', 'Мерзкая лучница', 'Тёмная стрелица', 'Чёрная лучница'], model: 'rogue_dark', ai: 'ranged', hp: 0.8, dmg: 0.9, ar: 1.1, def: 0.8, xp: 1.2, speed: 2.6, r: 0.34, range: 8, atk: 0.9, hitAt: 0.6, missile: 'marrow', weapon: 'bow', pack: [2, 4], res: { f: [0, 25, 50] }, tints: ['#5a3a5a', '#4a3a2a', '#2a3a5a', '#3a1a1a'] },
    spearwoman: { names: ['Тёмная копейщица', 'Мерзкая копейщица', 'Тёмная воительница', 'Чёрная пиковая'], model: 'rogue_dark', ai: 'melee', hp: 1.2, dmg: 1.2, ar: 1.1, def: 1.0, xp: 1.3, speed: 2.6, r: 0.34, range: 1.8, atk: 0.9, hitAt: 0.55, weapon: 'spear', pack: [3, 5], res: { l: [0, 25, 50] }, tints: ['#5a3a5a', '#4a3a2a', '#2a3a5a', '#3a1a1a'] },
    beast: { names: ['Громадный зверь', 'Косматый зверь', 'Жуткий зверь', 'Чудовищный зверь'], model: 'beast', ai: 'melee', hp: 2.2, dmg: 1.6, ar: 1.0, def: 1.1, xp: 2.0, speed: 1.7, r: 0.6, range: 1.4, atk: 1.2, hitAt: 0.6, pack: [2, 4], res: { c: [0, 25, 50] }, tints: ['#6a5a40', '#5a4a3a', '#6a6a6a', '#3a2a2a'] },
    skeleton: { names: ['Скелет', 'Вернувшийся', 'Костяной воин', 'Ужас'], model: 'skeleton', ai: 'melee', undead: true, hp: 0.95, dmg: 1.0, ar: 1.0, def: 1.0, xp: 1.0, speed: 2.4, r: 0.32, range: 1.1, atk: 0.8, hitAt: 0.5, weapon: 'sword', shield: true, pack: [4, 7], res: { p: [50, 50, 75], c: [0, 25, 50] }, tints: ['#d8d0b8', '#c8c0a0', '#a8b0b8', '#b89888'] },
    skel_archer: { names: ['Скелет-лучник', 'Вернувшийся лучник', 'Костяной лучник', 'Лучник ужаса'], model: 'skeleton', ai: 'ranged', undead: true, hp: 0.8, dmg: 0.9, ar: 1.1, def: 0.9, xp: 1.1, speed: 2.2, r: 0.32, range: 8, atk: 1.0, hitAt: 0.6, missile: 'marrow', weapon: 'bow', pack: [2, 4], res: { p: [50, 50, 75], f: [0, 25, 50] }, tints: ['#d8d0b8', '#c8c0a0', '#a8b0b8', '#b89888'] },
    skel_mage: { names: ['Горящий мёртвый маг', 'Мёртвый маг-хранитель', 'Ужасный мёртвый маг', 'Мёртвый маг праха'], model: 'skelmage', ai: 'caster', undead: true, hp: 0.8, dmg: 0.9, ar: 1.0, def: 0.8, xp: 1.3, speed: 2.0, r: 0.32, range: 7, atk: 1.0, hitAt: 0.55, missile: 'mfirebolt', el: 'fire', pack: [1, 3], res: { p: [50, 50, 75], f: [50, 75, 100] }, tints: ['#d8d0b8', '#c8c0a0', '#a8b0b8', '#b89888'] },
    ghost: { names: ['Призрак', 'Дух', 'Фантом', 'Спектр'], model: 'ghost', ai: 'ghost', undead: true, float: true, hp: 1.0, dmg: 0.8, ar: 1.2, def: 1.3, xp: 1.4, speed: 2.0, r: 0.34, range: 1.1, atk: 0.9, hitAt: 0.5, el: 'cold', drain: true, pack: [3, 5], res: { ph: [50, 50, 50], c: [25, 50, 75], p: [100, 100, 100] }, tints: ['#9ab0d0', '#b0c0a0', '#c0a0d0', '#d0a0a0'] },
    goatman: { names: ['Козлоногий', 'Козлоногий Лунного клана', 'Козлоногий Ночного клана', 'Козлоногий Кровавого клана'], model: 'goatman', ai: 'melee', demon: true, hp: 1.3, dmg: 1.15, ar: 1.1, def: 1.1, xp: 1.4, speed: 2.8, r: 0.38, range: 1.3, atk: 0.8, hitAt: 0.5, weapon: 'axe', pack: [3, 6], res: { f: [0, 25, 50], l: [0, 25, 50] }, tints: ['#6a4a3a', '#5a5a6a', '#3a3a4a', '#6a2a2a'] },
    bat: { names: ['Летучая мышь', 'Гигантская мышь', 'Кровавая мышь', 'Мышь-вампир'], model: 'bat', ai: 'flyer', float: true, hp: 0.5, dmg: 0.6, ar: 1.2, def: 0.9, xp: 0.8, speed: 4.2, r: 0.3, range: 0.9, atk: 0.6, hitAt: 0.5, pack: [4, 8], res: { l: [0, 25, 50] }, tints: ['#3a2a2a', '#4a2a3a', '#6a1a1a', '#1a1a2a'] },
    yeti: { names: ['Громила', 'Йети', 'Сокрушитель', 'Воющий зверь'], model: 'yeti', ai: 'melee', hp: 1.9, dmg: 1.4, ar: 1.0, def: 1.1, xp: 1.8, speed: 2.0, r: 0.55, range: 1.4, atk: 1.1, hitAt: 0.55, pack: [2, 4], res: { c: [25, 50, 100] }, tints: ['#8a8a78', '#c8c8d0', '#9a8a70', '#6a7a8a'] },
    tainted: { names: ['Искажённая', 'Порченая', 'Проклятая', 'Мерзостная'], model: 'tainted', ai: 'caster', demon: true, hp: 1.0, dmg: 1.0, ar: 1.0, def: 0.9, xp: 1.5, speed: 2.2, r: 0.34, range: 7, atk: 1.0, hitAt: 0.55, missile: 'mlball', el: 'light', pack: [3, 5], res: { l: [25, 50, 100] }, tints: ['#8a6a8a', '#6a8a6a', '#8a8a4a', '#4a4a6a'] },
    blood_raven: { names: ['Кровавый Ворон'], model: 'blood_raven', ai: 'raven', boss: true, undead: true, hp: 7, dmg: 1.2, ar: 1.4, def: 1.2, xp: 10, speed: 3.0, r: 0.36, range: 8, atk: 0.75, hitAt: 0.55, missile: 'mfirearrow', weapon: 'bow', res: { f: [25, 40, 55], p: [25, 40, 55] }, tints: ['#8a1010'] },
    griswold: { names: ['Гризвольд'], model: 'griswold', ai: 'melee', boss: true, undead: true, hp: 14, dmg: 2.3, ar: 1.3, def: 1.4, xp: 45, speed: 1.6, r: 0.5, range: 1.4, atk: 1.2, hitAt: 0.6, weapon: 'hammer', res: { p: [25, 40, 60], c: [0, 25, 50] }, tints: ['#6a7a6a'] },
    countess: { names: ['Графиня'], model: 'countess', ai: 'countess', boss: true, demon: true, hp: 16, dmg: 1.8, ar: 1.3, def: 1.3, xp: 60, speed: 2.4, r: 0.38, range: 7, atk: 0.9, hitAt: 0.55, missile: 'mfirebolt', el: 'fire', res: { f: [40, 60, 75], c: [0, 25, 50] }, tints: ['#6a1020'] },
    smith: { names: ['Кузнец'], model: 'smith', ai: 'melee', boss: true, demon: true, hp: 18, dmg: 2.8, ar: 1.4, def: 1.5, xp: 60, speed: 1.9, r: 0.62, range: 1.6, atk: 1.2, hitAt: 0.6, weapon: 'hammer', res: { f: [25, 50, 75] }, tints: ['#7a5040'] },
    andariel: { names: ['Андариэль'], model: 'andariel', ai: 'andariel', boss: true, demon: true, hp: 26, dmg: 2.3, ar: 1.6, def: 1.5, xp: 170, speed: 2.4, r: 0.6, range: 1.6, atk: 0.9, hitAt: 0.5, el: 'poison', res: { f: [50, 50, 50], p: [90, 90, 90], c: [0, 25, 50], l: [0, 25, 50] }, tints: ['#a02040'] },
    carver_bait: { names: ['Крыса'], model: 'quillrat', ai: 'melee', hp: 0.2, dmg: 0.2, ar: 0.5, def: 0.5, xp: 0.1, speed: 2, r: 0.2, range: 0.8, atk: 0.8, hitAt: 0.5, res: {}, tints: ['#6a5a48'] }
  };
  for (const k in MONSTERS) { MONSTERS[k].id = k; MONSTERS[k].res = Object.assign({ f: R0, c: R0, l: R0, p: R0, ph: R0, m: R0 }, MONSTERS[k].res); }

  const ALLIES = {
    skeleton: { name: 'Скелет', model: 'skeleton', ai: 'minion', r: 0.32, speed: 3.2, range: 1.1, atk: 0.8, hitAt: 0.5, weapon: 'sword', shield: true, tint: '#e0d8c0' },
    skelmage: { name: 'Скелет-маг', model: 'skelmage', ai: 'minion_ranged', r: 0.32, speed: 3.0, range: 7, atk: 1.0, hitAt: 0.55, missiles: ['mfirebolt', 'micebolt', 'mlball', 'mpoison'], tint: '#e0d8c0' },
    claygolem: { name: 'Глиняный голем', model: 'golem_clay', ai: 'minion', r: 0.55, speed: 2.4, range: 1.4, atk: 1.1, hitAt: 0.55, slow: true, tint: '#8a6a4a' },
    bloodgolem: { name: 'Кровавый голем', model: 'golem_blood', ai: 'minion', r: 0.55, speed: 2.8, range: 1.4, atk: 1.0, hitAt: 0.55, lifeShare: true, tint: '#a01818' },
    firegolem: { name: 'Огненный голем', model: 'golem_fire', ai: 'minion', r: 0.6, speed: 2.6, range: 1.4, atk: 1.1, hitAt: 0.55, holyFire: true, tint: '#e06010' },
    valkyrie: { name: 'Валькирия', model: 'valkyrie', ai: 'minion', r: 0.36, speed: 3.6, range: 1.8, atk: 0.8, hitAt: 0.5, weapon: 'spear', shield: true, tint: '#c8d0f0' },
    decoy: { name: 'Приманка', model: 'amazon', ai: 'decoy', r: 0.34, speed: 0, range: 0, atk: 1, hitAt: 0.5, tint: '#9090c0' },
    shadow: { name: 'Воин тени', model: 'assassin', ai: 'minion', r: 0.34, speed: 3.8, range: 1.1, atk: 0.6, hitAt: 0.5, weapon: 'claw', shadow: true, tint: '#303048' },
    spiritwolf: { name: 'Волк-дух', model: 'wolf', ai: 'minion', r: 0.4, speed: 5.0, range: 1.1, atk: 0.7, hitAt: 0.5, tint: '#a0c8ff', glow: true },
    grizzly: { name: 'Гризли', model: 'bear', ai: 'minion', r: 0.62, speed: 3.2, range: 1.5, atk: 1.1, hitAt: 0.55, tint: '#5a3a20' },
    raven: { name: 'Ворон', model: 'raven', ai: 'raven_ally', float: true, r: 0.2, speed: 6.0, range: 0.9, atk: 0.6, hitAt: 0.4, tint: '#202028' },
    oaksage: { name: 'Дубовый мудрец', model: 'spirit', ai: 'spirit', float: true, r: 0.3, speed: 4.0, range: 0, atk: 1, hitAt: 0.5, tint: '#80e070' },
    wolverine: { name: 'Сердце росомахи', model: 'spirit', ai: 'spirit', float: true, r: 0.3, speed: 4.0, range: 0, atk: 1, hitAt: 0.5, tint: '#e07050' },
    cbsentry: { name: 'Страж заряженных стрел', model: 'sentry', ai: 'trap', r: 0.3, speed: 0, range: 9, atk: 0.9, hitAt: 0.3, tint: '#6080ff' },
    lsentry: { name: 'Страж молний', model: 'sentry', ai: 'trap', r: 0.3, speed: 0, range: 10, atk: 1.0, hitAt: 0.3, tint: '#c0e0ff' },
    volcano: { name: 'Вулкан', model: 'volcano', ai: 'volcano', r: 0.8, speed: 0, range: 5, atk: 0.35, hitAt: 0.3, tint: '#e04010' },
    merc: { name: 'Разбойница', model: 'rogue', ai: 'merc', r: 0.34, speed: 3.6, range: 8, atk: 0.8, hitAt: 0.55, weapon: 'bow', tint: '#6a8a4a' }
  };

  const MODS = {
    strong: { name: 'Необычайно сильный' },
    fast: { name: 'Необычайно быстрый' },
    cursed: { name: 'Проклятый' },
    mres: { name: 'Устойчивый к магии' },
    fireench: { name: 'Огненный' },
    lightench: { name: 'Молниеносный' },
    coldench: { name: 'Ледяной' },
    spectral: { name: 'Призрачный удар' },
    stoneskin: { name: 'Каменная кожа' },
    manaburn: { name: 'Выжигающий ману' },
    multishot: { name: 'Множественный выстрел' }
  };
  const MOD_LIST = Object.keys(MODS);
  const CHAMPION_KINDS = [['champion', 'Чемпион'], ['berserker', 'Берсерк'], ['fanatic', 'Фанатик'], ['ghostly', 'Призрачный']];

  const UNIQUE_NAME_A = ['Гнилой', 'Кровавый', 'Костяной', 'Чёрный', 'Мрачный', 'Проклятый', 'Жуткий', 'Смрадный', 'Скорбный', 'Огненный', 'Ледяной', 'Бледный', 'Древний', 'Злобный'];
  const UNIQUE_NAME_B = ['Коготь', 'Клык', 'Череп', 'Хребет', 'Глаз', 'Язык', 'Кулак', 'Рог', 'Мор', 'Шрам', 'Мрак', 'Прах', 'Вой', 'Страх'];
  const UNIQUE_NAME_C = ['Голодный', 'Безумный', 'Хладный', 'Неистовый', 'Нечестивый', 'Жестокий', 'Ненасытный', 'Слепой', 'Вечный', 'Одержимый'];

  const SUPERUNIQUES = {
    corpsefire: { name: 'Трупный Огонь', type: 'zombie', mods: ['spectral'], minions: [4, 5], lvl: 2 },
    bishibosh: { name: 'Бишибош', type: 'shaman', mods: ['fireench'], minions: [4, 6], minionType: 'fallen', lvl: 2 },
    blood_raven: { name: 'Кровавый Ворон', type: 'blood_raven', mods: [], minions: [0, 0], lvl: 2, quest: 'burial' },
    rakanishu: { name: 'Раканишу', type: 'fallen', mods: ['lightench', 'fast'], minions: [5, 7], lvl: 3 },
    treehead: { name: 'Древоголов Лесокулак', type: 'beast', mods: ['strong', 'fast'], minions: [2, 3], lvl: 3 },
    griswold: { name: 'Гризвольд', type: 'griswold', mods: ['cursed'], minions: [0, 0], lvl: 3 },
    countess: { name: 'Графиня', type: 'countess', mods: [], minions: [4, 6], minionType: 'ghost', lvl: 3, quest: 'tower' },
    smith: { name: 'Кузнец', type: 'smith', mods: [], minions: [0, 0], lvl: 3, quest: 'tools' },
    pitspawn: { name: 'Питспаун Фаулдог', type: 'tainted', mods: ['spectral', 'mres'], minions: [4, 5], lvl: 3 },
    bone_ash: { name: 'Костяной Пепел', type: 'skel_mage', mods: ['strong', 'coldench', 'mres'], minions: [3, 5], lvl: 3 },
    andariel: { name: 'Андариэль', type: 'andariel', mods: [], minions: [0, 0], lvl: 2, quest: 'andariel' }
  };

  function monHp(L) { return 6 + 4.6 * L + 0.2 * L * L; }
  function monDmg(L) { const a = 0.7 + 0.5 * L + 0.012 * L * L; return [a, a * 1.9 + 1]; }
  function monAr(L) { return 12 + 11 * L; }
  function monDef(L) { return 4 + 7 * L; }
  function monXp(L) { return 8 + 7 * L + 0.45 * L * L; }

  const DIFF_MUL = [
    { hp: 1, dmg: 1, xp: 1, ar: 1 },
    { hp: 1.35, dmg: 1.2, xp: 1.25, ar: 1.1 },
    { hp: 1.8, dmg: 1.35, xp: 1.6, ar: 1.2 }
  ];

  Object.assign(D, { MONSTERS, ALLIES, MODS, MOD_LIST, CHAMPION_KINDS, UNIQUE_NAME_A, UNIQUE_NAME_B, UNIQUE_NAME_C, SUPERUNIQUES, monHp, monDmg, monAr, monDef, monXp, DIFF_MUL });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
