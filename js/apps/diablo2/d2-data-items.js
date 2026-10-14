(function (D) {
  'use strict';

  const BASES = {};
  const BASE_LIST = [];
  const add = b => { BASES[b.id] = b; BASE_LIST.push(b); return b; };

  const ATK = { sword: 0.6, axe: 0.64, mace: 0.64, club: 0.6, hammer: 0.7, scepter: 0.6, dagger: 0.5, spear: 0.72, polearm: 0.8, staff: 0.72, wand: 0.6, claw: 0.5, orb: 0.62, javelin: 0.62, bow: 0.56, xbow: 0.84 };
  const MELEE = ['sword', 'axe', 'mace', 'club', 'hammer', 'scepter', 'dagger', 'spear', 'polearm', 'staff', 'wand', 'claw', 'orb', 'javelin'];
  const RANGED = ['bow', 'xbow'];
  const ARMOR = ['helm', 'circlet', 'body', 'shield', 'gloves', 'boots', 'belt'];
  const CLASS_ONLY = { claw: 'assassin', orb: 'sorceress' };

  function tierOf(q) { return q >= 55 ? 2 : q >= 28 ? 1 : 0; }

  function W(id, name, g, type, hands, min, max, str, dex, qlvl, w, h, wsm, dur, sock, extra) {
    return add(Object.assign({ id, name, g, cat: 'weapon', type, hands, dmg: [min, max], str, dex, qlvl, w, h, wsm, dur, sock, tier: tierOf(qlvl), cls: CLASS_ONLY[type] || null }, extra || {}));
  }

  function A(id, name, g, type, dmin, dmax, str, qlvl, w, h, dur, sock, extra) {
    return add(Object.assign({ id, name, g, cat: 'armor', type, def: [dmin, dmax], str, dex: 0, qlvl, w, h, dur, sock, tier: tierOf(qlvl) }, extra || {}));
  }

  W('short_sword', 'Короткий меч', 'm', 'sword', 1, 2, 7, 0, 0, 1, 1, 3, 0, 24, 2);
  W('scimitar', 'Ятаган', 'm', 'sword', 1, 2, 6, 0, 21, 2, 1, 3, -20, 22, 2);
  W('sabre', 'Сабля', 'f', 'sword', 1, 3, 8, 25, 25, 4, 1, 3, -10, 32, 2);
  W('falchion', 'Фальшион', 'm', 'sword', 1, 9, 17, 33, 0, 11, 1, 3, 0, 32, 2);
  W('crystal_sword', 'Хрустальный меч', 'm', 'sword', 1, 5, 15, 43, 0, 11, 2, 3, 0, 20, 6);
  W('broad_sword', 'Палаш', 'm', 'sword', 1, 7, 14, 48, 0, 15, 2, 3, 0, 32, 4);
  W('long_sword', 'Длинный меч', 'm', 'sword', 1, 3, 19, 55, 39, 20, 2, 3, -10, 44, 4);
  W('war_sword', 'Боевой меч', 'm', 'sword', 1, 8, 20, 71, 45, 27, 1, 3, 0, 44, 3);
  W('two_handed_sword', 'Двуручный меч', 'm', 'sword', 2, 8, 17, 35, 27, 10, 2, 4, 0, 44, 3);
  W('claymore', 'Клеймор', 'm', 'sword', 2, 13, 30, 47, 0, 17, 2, 4, 10, 50, 4);
  W('bastard_sword', 'Бастард', 'm', 'sword', 2, 20, 28, 62, 0, 24, 2, 4, 10, 40, 4);
  W('great_sword', 'Большой меч', 'm', 'sword', 2, 25, 42, 100, 60, 33, 2, 4, 10, 50, 6);
  W('gladius', 'Гладиус', 'm', 'sword', 1, 8, 22, 25, 0, 30, 1, 3, 0, 24, 2);
  W('cutlass', 'Абордажная сабля', 'f', 'sword', 1, 8, 21, 25, 52, 33, 1, 3, -30, 22, 2);
  W('tulwar', 'Тульвар', 'm', 'sword', 1, 16, 35, 70, 42, 37, 2, 3, 0, 32, 2);
  W('battle_sword', 'Батальный меч', 'm', 'sword', 1, 16, 34, 92, 43, 40, 2, 3, 0, 32, 4);
  W('rune_sword', 'Рунный меч', 'm', 'sword', 1, 10, 42, 103, 79, 44, 2, 3, -10, 44, 4);
  W('espandon', 'Эспадон', 'm', 'sword', 2, 18, 40, 73, 61, 37, 2, 4, 0, 44, 3);
  W('zweihander', 'Цвайхендер', 'm', 'sword', 2, 29, 54, 125, 94, 48, 2, 4, 10, 50, 5);
  W('phase_blade', 'Фазовый клинок', 'm', 'sword', 1, 31, 35, 25, 136, 73, 2, 3, -30, 250, 6);
  W('cryptic_sword', 'Таинственный меч', 'm', 'sword', 1, 5, 77, 99, 109, 82, 2, 4, -10, 44, 4);
  W('colossus_blade', 'Клинок колосса', 'm', 'sword', 2, 58, 115, 189, 110, 85, 2, 4, 5, 50, 6);

  W('hand_axe', 'Топорик', 'm', 'axe', 1, 3, 6, 0, 0, 3, 1, 3, 0, 28, 2);
  W('axe', 'Топор', 'm', 'axe', 1, 4, 11, 32, 0, 7, 2, 3, 10, 24, 4);
  W('double_axe', 'Двойной топор', 'm', 'axe', 1, 5, 13, 43, 0, 13, 2, 3, 10, 24, 5);
  W('military_pick', 'Военная кирка', 'f', 'axe', 1, 7, 11, 49, 33, 19, 2, 3, -10, 26, 6);
  W('war_axe', 'Боевой топор', 'm', 'axe', 1, 10, 18, 67, 0, 25, 2, 3, 0, 26, 6);
  W('large_axe', 'Большой топор', 'm', 'axe', 2, 6, 13, 35, 0, 6, 2, 3, -10, 30, 4);
  W('broad_axe', 'Широкий топор', 'm', 'axe', 2, 10, 18, 48, 0, 12, 2, 3, 0, 35, 5);
  W('battle_axe', 'Секира', 'f', 'axe', 2, 12, 32, 54, 0, 17, 2, 3, 10, 40, 5);
  W('great_axe', 'Большая секира', 'f', 'axe', 2, 9, 30, 63, 39, 23, 2, 4, -10, 50, 6);
  W('cleaver', 'Колун', 'm', 'axe', 1, 10, 33, 68, 0, 34, 2, 3, 0, 24, 4);
  W('crowbill', 'Клюв ворона', 'm', 'axe', 1, 14, 34, 94, 70, 42, 2, 3, -10, 26, 6);
  W('tabar', 'Табар', 'm', 'axe', 2, 24, 77, 101, 0, 42, 2, 3, 10, 40, 5);
  W('ancient_axe', 'Древняя секира', 'f', 'axe', 2, 43, 85, 125, 0, 52, 2, 4, 10, 50, 6);
  W('berserker_axe', 'Топор берсерка', 'm', 'axe', 1, 24, 71, 138, 59, 64, 2, 3, 0, 26, 6);

  W('club', 'Дубина', 'f', 'club', 1, 1, 6, 0, 0, 1, 1, 3, -10, 24, 2);
  W('spiked_club', 'Шипастая дубина', 'f', 'club', 1, 5, 8, 0, 0, 4, 1, 3, 0, 36, 2);
  W('mace', 'Булава', 'f', 'mace', 1, 3, 10, 27, 0, 3, 1, 3, 0, 60, 2);
  W('morning_star', 'Моргенштерн', 'm', 'mace', 1, 7, 16, 36, 0, 10, 2, 3, 0, 72, 3);
  W('flail', 'Цеп', 'm', 'mace', 1, 1, 24, 41, 35, 19, 2, 3, -10, 30, 5);
  W('war_hammer', 'Боевой молот', 'm', 'hammer', 1, 19, 29, 53, 0, 25, 2, 3, 20, 55, 4);
  W('maul', 'Кувалда', 'f', 'hammer', 2, 30, 43, 69, 0, 21, 2, 4, 10, 60, 6);
  W('barbed_club', 'Колючая дубина', 'f', 'club', 1, 13, 25, 30, 0, 32, 1, 3, 0, 36, 3);
  W('flanged_mace', 'Шестопёр', 'm', 'mace', 1, 15, 23, 61, 0, 35, 1, 3, 0, 60, 2);
  W('jagged_star', 'Зубчатая звезда', 'f', 'mace', 1, 20, 31, 74, 0, 39, 2, 3, 10, 72, 3);
  W('battle_hammer', 'Батальный молот', 'm', 'hammer', 1, 35, 58, 100, 0, 48, 2, 3, 20, 55, 4);
  W('martel', 'Мартель', 'm', 'hammer', 2, 61, 99, 169, 0, 53, 2, 4, 20, 60, 6);
  W('tyrant_club', 'Дубина тирана', 'f', 'club', 1, 32, 58, 133, 0, 57, 1, 3, 0, 50, 3);
  W('scourge', 'Бич', 'm', 'mace', 1, 3, 80, 125, 77, 76, 2, 3, -10, 65, 5);

  W('scepter', 'Скипетр', 'm', 'scepter', 1, 6, 11, 25, 0, 3, 1, 3, 0, 50, 2);
  W('grand_scepter', 'Великий скипетр', 'm', 'scepter', 1, 8, 18, 37, 0, 15, 1, 3, 10, 60, 3);
  W('war_scepter', 'Боевой скипетр', 'm', 'scepter', 1, 10, 17, 55, 0, 21, 2, 3, -10, 70, 5);
  W('rune_scepter', 'Рунный скипетр', 'm', 'scepter', 1, 13, 24, 58, 0, 31, 1, 3, 0, 50, 2);
  W('divine_scepter', 'Божественный скипетр', 'm', 'scepter', 1, 16, 38, 103, 0, 45, 2, 3, -10, 70, 5);

  W('dagger', 'Кинжал', 'm', 'dagger', 1, 1, 4, 0, 0, 3, 1, 2, -20, 16, 1);
  W('dirk', 'Нож', 'm', 'dagger', 1, 3, 9, 0, 25, 9, 1, 2, 0, 20, 1);
  W('kris', 'Крис', 'm', 'dagger', 1, 2, 11, 0, 45, 17, 1, 3, -20, 24, 3);
  W('blade', 'Клинок', 'm', 'dagger', 1, 4, 15, 35, 51, 23, 1, 3, -10, 24, 2);
  W('rondel', 'Рондель', 'm', 'dagger', 1, 10, 26, 25, 58, 34, 1, 2, 0, 20, 1);
  W('stiletto', 'Стилет', 'm', 'dagger', 1, 19, 36, 47, 97, 46, 1, 3, -10, 24, 2);

  W('javelin', 'Дротик', 'm', 'javelin', 1, 1, 5, 0, 0, 1, 1, 3, -10, 0, 0, { tdmg: [6, 14], qty: 60, throwable: true });
  W('pilum', 'Пилум', 'm', 'javelin', 1, 4, 9, 0, 45, 10, 1, 3, 0, 0, 0, { tdmg: [7, 20], qty: 50, throwable: true });
  W('short_spear', 'Короткое копьё', 'n', 'javelin', 1, 2, 13, 40, 40, 15, 1, 3, 10, 0, 0, { tdmg: [10, 22], qty: 40, throwable: true });
  W('glaive', 'Глефа', 'f', 'javelin', 1, 5, 17, 52, 35, 23, 1, 4, 20, 0, 0, { tdmg: [16, 22], qty: 25, throwable: true });
  W('war_javelin', 'Боевой дротик', 'm', 'javelin', 1, 6, 19, 25, 25, 30, 1, 3, -10, 0, 0, { tdmg: [14, 32], qty: 60, throwable: true });
  W('great_pilum', 'Большой пилум', 'm', 'javelin', 1, 11, 26, 25, 65, 37, 1, 3, 0, 0, 0, { tdmg: [16, 42], qty: 50, throwable: true });
  W('harpoon', 'Гарпун', 'm', 'javelin', 1, 13, 35, 25, 118, 50, 1, 4, 20, 0, 0, { tdmg: [18, 54], qty: 40, throwable: true });
  W('hyperion_javelin', 'Дротик Гипериона', 'm', 'javelin', 1, 21, 57, 98, 123, 69, 1, 3, -10, 0, 0, { tdmg: [28, 55], qty: 60, throwable: true });

  W('spear', 'Копьё', 'n', 'spear', 2, 3, 15, 0, 20, 5, 2, 4, -10, 30, 3);
  W('trident', 'Трезубец', 'm', 'spear', 2, 9, 15, 38, 24, 17, 2, 4, 0, 35, 4);
  W('spetum', 'Спетум', 'm', 'spear', 2, 15, 23, 54, 35, 28, 2, 4, 0, 28, 4);
  W('pike', 'Пика', 'f', 'spear', 2, 14, 63, 60, 45, 31, 2, 4, 20, 25, 6);
  W('war_spear', 'Боевое копьё', 'n', 'spear', 2, 10, 37, 25, 25, 33, 2, 4, -10, 30, 3);
  W('fuscina', 'Фусцина', 'f', 'spear', 2, 19, 37, 77, 25, 42, 2, 4, 0, 35, 4);
  W('lance', 'Турнирное копьё', 'n', 'spear', 2, 27, 114, 110, 88, 53, 2, 4, 20, 25, 6);
  W('bardiche', 'Бердыш', 'm', 'polearm', 2, 1, 27, 40, 0, 5, 2, 4, 10, 50, 3);
  W('voulge', 'Совня', 'f', 'polearm', 2, 6, 21, 50, 0, 11, 2, 4, 0, 50, 4);
  W('poleaxe', 'Протазан', 'm', 'polearm', 2, 18, 39, 62, 0, 21, 2, 4, 10, 65, 5);
  W('halberd', 'Алебарда', 'f', 'polearm', 2, 12, 45, 75, 47, 29, 2, 4, 0, 55, 6);
  W('war_scythe', 'Боевая коса', 'f', 'polearm', 2, 15, 36, 80, 80, 34, 2, 4, -10, 55, 6);
  W('partizan', 'Партизан', 'm', 'polearm', 2, 34, 75, 113, 67, 35, 2, 4, 10, 65, 5);
  W('grim_scythe', 'Мрачная коса', 'f', 'polearm', 2, 30, 70, 140, 140, 55, 2, 4, -10, 55, 6);
  W('thresher', 'Молотилка', 'f', 'polearm', 2, 12, 141, 152, 118, 71, 2, 4, -10, 65, 5);

  W('short_staff', 'Короткий посох', 'm', 'staff', 2, 1, 5, 0, 0, 1, 1, 3, -10, 20, 2);
  W('long_staff', 'Длинный посох', 'm', 'staff', 2, 2, 8, 0, 0, 8, 1, 4, 0, 30, 3);
  W('gnarled_staff', 'Корявый посох', 'm', 'staff', 2, 4, 12, 0, 0, 12, 1, 4, 10, 35, 4);
  W('battle_staff', 'Боевой посох', 'm', 'staff', 2, 6, 13, 0, 0, 17, 1, 4, 0, 40, 4);
  W('war_staff', 'Военный посох', 'm', 'staff', 2, 12, 28, 0, 0, 24, 2, 4, 20, 50, 6);
  W('cedar_staff', 'Кедровый посох', 'm', 'staff', 2, 11, 32, 0, 0, 38, 1, 4, 10, 35, 4);
  W('rune_staff', 'Рунный посох', 'm', 'staff', 2, 24, 58, 0, 0, 47, 2, 4, 20, 50, 6);
  W('elder_staff', 'Посох старейшины', 'm', 'staff', 2, 80, 93, 44, 0, 74, 1, 4, 0, 35, 4);

  W('wand', 'Жезл', 'm', 'wand', 1, 2, 4, 0, 0, 2, 1, 2, 0, 15, 1);
  W('yew_wand', 'Тисовый жезл', 'm', 'wand', 1, 2, 8, 0, 0, 12, 1, 2, 10, 15, 1);
  W('bone_wand', 'Костяной жезл', 'm', 'wand', 1, 3, 7, 0, 0, 18, 1, 2, -20, 15, 2);
  W('grim_wand', 'Мрачный жезл', 'm', 'wand', 1, 5, 11, 0, 0, 26, 1, 2, 0, 15, 2);
  W('tomb_wand', 'Жезл гробницы', 'm', 'wand', 1, 10, 22, 0, 0, 43, 1, 2, -20, 15, 2);
  W('lich_wand', 'Жезл лича', 'm', 'wand', 1, 10, 31, 0, 0, 63, 1, 2, -20, 17, 2);

  W('katar', 'Катар', 'm', 'claw', 1, 4, 7, 20, 20, 1, 1, 3, -10, 48, 2);
  W('wrist_blade', 'Наручный клинок', 'm', 'claw', 1, 5, 9, 33, 33, 9, 1, 3, 0, 52, 2);
  W('cestus', 'Цестус', 'm', 'claw', 1, 7, 15, 42, 42, 15, 1, 3, 0, 72, 2);
  W('claws', 'Когти', 'pl', 'claw', 1, 8, 15, 46, 46, 18, 1, 3, -10, 54, 3);
  W('scissors_katar', 'Катар-ножницы', 'm', 'claw', 1, 9, 17, 55, 55, 24, 1, 3, -10, 68, 3);
  W('quhab', 'Кухаб', 'm', 'claw', 1, 11, 24, 57, 57, 28, 1, 3, 0, 48, 2);
  W('greater_claws', 'Большие когти', 'pl', 'claw', 1, 18, 37, 87, 87, 45, 1, 3, -20, 54, 3);
  W('runic_talons', 'Рунические когти', 'pl', 'claw', 1, 24, 44, 115, 115, 72, 1, 3, -30, 69, 3);

  W('eagle_orb', 'Орлиная сфера', 'f', 'orb', 1, 2, 5, 0, 0, 1, 1, 2, -10, 20, 2);
  W('sacred_globe', 'Священный шар', 'm', 'orb', 1, 3, 8, 0, 0, 8, 1, 2, -10, 30, 2);
  W('smoked_sphere', 'Дымчатая сфера', 'f', 'orb', 1, 4, 10, 0, 0, 12, 1, 2, 0, 35, 2);
  W('clasped_orb', 'Сжатая сфера', 'f', 'orb', 1, 5, 12, 0, 0, 17, 1, 2, 0, 40, 2);
  W('jareds_stone', 'Камень Джареда', 'm', 'orb', 1, 3, 16, 0, 0, 24, 1, 2, 10, 50, 3);
  W('glowing_orb', 'Светящаяся сфера', 'f', 'orb', 1, 8, 21, 0, 0, 32, 1, 2, -10, 20, 2);
  W('swirling_crystal', 'Вихревой кристалл', 'm', 'orb', 1, 18, 42, 0, 0, 50, 1, 2, 10, 50, 3);
  W('eldritch_orb', 'Сверхъестественная сфера', 'f', 'orb', 1, 18, 50, 0, 0, 67, 1, 2, -10, 30, 2);

  W('short_bow', 'Короткий лук', 'm', 'bow', 2, 1, 4, 0, 15, 1, 2, 3, 5, 0, 3);
  W('hunters_bow', 'Охотничий лук', 'm', 'bow', 2, 2, 6, 0, 28, 3, 2, 3, -10, 0, 4);
  W('long_bow', 'Длинный лук', 'm', 'bow', 2, 3, 10, 22, 19, 5, 2, 4, 0, 0, 5);
  W('composite_bow', 'Составной лук', 'm', 'bow', 2, 4, 8, 25, 35, 12, 2, 3, -10, 0, 4);
  W('short_battle_bow', 'Короткий боевой лук', 'm', 'bow', 2, 3, 18, 30, 40, 18, 2, 3, 0, 0, 5);
  W('long_battle_bow', 'Длинный боевой лук', 'm', 'bow', 2, 3, 19, 40, 50, 23, 2, 4, 10, 0, 6);
  W('long_war_bow', 'Длинный военный лук', 'm', 'bow', 2, 3, 23, 50, 65, 31, 2, 4, 10, 0, 6);
  W('cedar_bow', 'Кедровый лук', 'm', 'bow', 2, 10, 29, 53, 49, 35, 2, 4, 0, 0, 5);
  W('double_bow', 'Двойной лук', 'm', 'bow', 2, 11, 26, 58, 73, 39, 2, 3, -10, 0, 4);
  W('rune_bow', 'Рунный лук', 'm', 'bow', 2, 14, 35, 73, 103, 49, 2, 4, 0, 0, 5);
  W('gothic_bow', 'Готический лук', 'm', 'bow', 2, 10, 50, 70, 95, 52, 2, 4, 10, 0, 6);
  W('matriarchal_bow', 'Лук матриарха', 'm', 'bow', 2, 20, 47, 87, 187, 70, 2, 4, -10, 0, 5);
  W('light_crossbow', 'Лёгкий арбалет', 'm', 'xbow', 2, 6, 9, 21, 27, 6, 2, 3, -10, 0, 3);
  W('crossbow', 'Арбалет', 'm', 'xbow', 2, 9, 20, 40, 33, 15, 2, 3, 0, 0, 4);
  W('heavy_crossbow', 'Тяжёлый арбалет', 'm', 'xbow', 2, 14, 26, 60, 40, 24, 2, 4, 10, 0, 6);
  W('arbalest', 'Аркбаллиста', 'f', 'xbow', 2, 14, 27, 52, 61, 34, 2, 3, -10, 0, 3);
  W('ballista', 'Баллиста', 'f', 'xbow', 2, 33, 55, 110, 80, 47, 2, 4, 10, 0, 6);
  W('colossus_crossbow', 'Арбалет колосса', 'm', 'xbow', 2, 32, 91, 163, 77, 75, 2, 4, 10, 0, 6);

  A('quilted_armor', 'Стёганая броня', 'f', 'body', 8, 11, 12, 1, 2, 3, 20, 2);
  A('leather_armor', 'Кожаный доспех', 'm', 'body', 14, 17, 15, 3, 2, 3, 24, 2);
  A('hard_leather', 'Дублёная кожа', 'f', 'body', 21, 24, 20, 5, 2, 3, 28, 2);
  A('studded_leather', 'Клёпаная кожа', 'f', 'body', 32, 35, 27, 8, 2, 3, 32, 2);
  A('ring_mail', 'Кольчатая броня', 'f', 'body', 45, 48, 36, 11, 2, 3, 26, 3);
  A('scale_mail', 'Чешуйчатая броня', 'f', 'body', 57, 60, 44, 13, 2, 3, 36, 2);
  A('chain_mail', 'Кольчуга', 'f', 'body', 72, 75, 48, 15, 2, 3, 45, 2);
  A('breast_plate', 'Кираса', 'f', 'body', 65, 68, 30, 18, 2, 3, 50, 3);
  A('splint_mail', 'Наборный доспех', 'm', 'body', 90, 95, 51, 20, 2, 3, 30, 2);
  A('plate_mail', 'Латный доспех', 'm', 'body', 108, 116, 65, 24, 2, 3, 60, 2);
  A('field_plate', 'Полевой доспех', 'm', 'body', 101, 105, 55, 28, 2, 3, 48, 2);
  A('light_plate', 'Лёгкие латы', 'pl', 'body', 90, 107, 41, 35, 2, 3, 60, 3);
  A('gothic_plate', 'Готические латы', 'pl', 'body', 128, 135, 70, 32, 2, 4, 55, 4);
  A('full_plate', 'Полный латный доспех', 'm', 'body', 150, 161, 80, 37, 2, 3, 70, 4);
  A('ancient_armor', 'Древний доспех', 'm', 'body', 218, 233, 100, 40, 2, 3, 60, 4);
  A('ghost_armor', 'Призрачная броня', 'f', 'body', 102, 117, 38, 34, 2, 3, 20, 2);
  A('demonhide_armor', 'Броня из демонической кожи', 'f', 'body', 122, 136, 50, 37, 2, 3, 28, 2);
  A('linked_mail', 'Звеньевая кольчуга', 'f', 'body', 158, 172, 74, 42, 2, 3, 26, 3);
  A('cuirass', 'Кирасир', 'm', 'body', 188, 202, 65, 47, 2, 3, 50, 3);
  A('mage_plate', 'Латы мага', 'pl', 'body', 225, 261, 55, 60, 2, 3, 60, 3);
  A('chaos_armor', 'Броня хаоса', 'f', 'body', 315, 342, 140, 61, 2, 3, 70, 4);
  A('ornate_plate', 'Узорчатые латы', 'pl', 'body', 417, 450, 170, 64, 2, 3, 60, 4);
  A('dusk_shroud', 'Сумеречный саван', 'm', 'body', 361, 467, 77, 65, 2, 3, 20, 4);
  A('wyrmhide', 'Кожа змея', 'f', 'body', 364, 470, 84, 67, 2, 3, 24, 4);
  A('archon_plate', 'Латы архонта', 'pl', 'body', 410, 524, 103, 84, 2, 3, 60, 4);
  A('sacred_armor', 'Священная броня', 'f', 'body', 487, 600, 232, 85, 2, 3, 60, 4);

  A('cap', 'Шапка', 'f', 'helm', 3, 5, 0, 1, 2, 2, 12, 2);
  A('skull_cap', 'Шапель', 'f', 'helm', 8, 11, 15, 5, 2, 2, 18, 2);
  A('helm', 'Шлем', 'm', 'helm', 15, 18, 26, 11, 2, 2, 24, 2);
  A('full_helm', 'Полный шлем', 'm', 'helm', 23, 26, 41, 15, 2, 2, 30, 2);
  A('mask', 'Маска', 'f', 'helm', 9, 27, 23, 19, 2, 2, 20, 3);
  A('bone_helm', 'Костяной шлем', 'm', 'helm', 33, 36, 25, 22, 2, 2, 40, 2);
  A('great_helm', 'Большой шлем', 'm', 'helm', 30, 35, 63, 23, 2, 2, 40, 3);
  A('crown', 'Корона', 'f', 'helm', 25, 45, 55, 29, 2, 2, 50, 3);
  A('war_hat', 'Военная шляпа', 'f', 'helm', 45, 53, 20, 34, 2, 2, 12, 2);
  A('sallet', 'Салад', 'm', 'helm', 52, 62, 43, 37, 2, 2, 18, 2);
  A('casque', 'Каска', 'f', 'helm', 63, 72, 59, 42, 2, 2, 24, 2);
  A('death_mask', 'Маска смерти', 'f', 'helm', 54, 86, 55, 48, 2, 2, 20, 3);
  A('winged_helm', 'Крылатый шлем', 'm', 'helm', 85, 98, 115, 51, 2, 2, 40, 3);
  A('grand_crown', 'Великая корона', 'f', 'helm', 78, 113, 103, 55, 2, 2, 50, 3);
  A('shako', 'Кивер', 'm', 'helm', 98, 141, 50, 58, 2, 2, 12, 2);
  A('armet', 'Армет', 'm', 'helm', 105, 149, 109, 68, 2, 2, 24, 2);
  A('spired_helm', 'Остроконечный шлем', 'm', 'helm', 114, 159, 192, 79, 2, 2, 40, 3);
  A('circlet', 'Обруч', 'm', 'circlet', 20, 30, 0, 24, 2, 2, 35, 2);
  A('coronet', 'Венец', 'm', 'circlet', 30, 40, 0, 52, 2, 2, 30, 2);
  A('tiara', 'Тиара', 'f', 'circlet', 40, 50, 0, 70, 2, 2, 25, 3);

  A('buckler', 'Баклер', 'm', 'shield', 4, 6, 12, 1, 2, 2, 12, 1, { block: 20 });
  A('small_shield', 'Малый щит', 'm', 'shield', 8, 10, 22, 5, 2, 2, 16, 2, { block: 25 });
  A('large_shield', 'Большой щит', 'm', 'shield', 12, 14, 34, 11, 2, 3, 24, 3, { block: 32 });
  A('spiked_shield', 'Шипастый щит', 'm', 'shield', 15, 25, 30, 11, 2, 3, 40, 2, { block: 30 });
  A('kite_shield', 'Каплевидный щит', 'm', 'shield', 16, 18, 47, 15, 2, 3, 30, 3, { block: 30 });
  A('bone_shield', 'Костяной щит', 'm', 'shield', 10, 30, 25, 19, 2, 3, 40, 2, { block: 30 });
  A('tower_shield', 'Башенный щит', 'm', 'shield', 22, 25, 75, 22, 2, 3, 60, 3, { block: 34 });
  A('gothic_shield', 'Готический щит', 'm', 'shield', 30, 35, 60, 30, 2, 4, 40, 3, { block: 36 });
  A('defender', 'Защитник', 'm', 'shield', 41, 49, 38, 34, 2, 2, 68, 1, { block: 20 });
  A('round_shield', 'Круглый щит', 'm', 'shield', 47, 55, 53, 37, 2, 2, 64, 2, { block: 25 });
  A('scutum', 'Скутум', 'm', 'shield', 53, 61, 71, 42, 2, 3, 62, 3, { block: 32 });
  A('dragon_shield', 'Драконий щит', 'm', 'shield', 59, 67, 91, 45, 2, 3, 76, 3, { block: 30 });
  A('pavise', 'Павеза', 'f', 'shield', 68, 78, 133, 50, 2, 3, 72, 3, { block: 34 });
  A('ancient_shield', 'Древний щит', 'm', 'shield', 80, 93, 110, 56, 2, 4, 80, 3, { block: 36 });
  A('heater', 'Треугольный щит', 'm', 'shield', 95, 110, 77, 58, 2, 2, 88, 2, { block: 25 });
  A('monarch', 'Монарх', 'm', 'shield', 133, 148, 156, 72, 2, 4, 86, 4, { block: 32 });
  A('aegis', 'Эгида', 'f', 'shield', 145, 161, 219, 79, 2, 4, 92, 4, { block: 36 });

  A('leather_gloves', 'Кожаные перчатки', 'pl', 'gloves', 2, 3, 0, 3, 2, 2, 12, 0);
  A('heavy_gloves', 'Тяжёлые перчатки', 'pl', 'gloves', 5, 6, 0, 7, 2, 2, 14, 0);
  A('chain_gloves', 'Кольчужные перчатки', 'pl', 'gloves', 8, 9, 25, 12, 2, 2, 16, 0);
  A('light_gauntlets', 'Лёгкие латные рукавицы', 'pl', 'gloves', 9, 11, 45, 20, 2, 2, 18, 0);
  A('gauntlets', 'Латные рукавицы', 'pl', 'gloves', 12, 15, 60, 27, 2, 2, 24, 0);
  A('demonhide_gloves', 'Перчатки из демонической кожи', 'pl', 'gloves', 28, 35, 20, 33, 2, 2, 12, 0);
  A('heavy_bracers', 'Тяжёлые наручи', 'pl', 'gloves', 37, 44, 58, 43, 2, 2, 16, 0);
  A('war_gauntlets', 'Боевые рукавицы', 'pl', 'gloves', 43, 53, 110, 54, 2, 2, 24, 0);
  A('vambraces', 'Налокотники', 'pl', 'gloves', 59, 67, 106, 63, 2, 2, 16, 0);
  A('ogre_gauntlets', 'Рукавицы огра', 'pl', 'gloves', 62, 71, 185, 85, 2, 2, 24, 0);

  A('boots', 'Сапоги', 'pl', 'boots', 2, 3, 0, 3, 2, 2, 12, 0);
  A('heavy_boots', 'Тяжёлые сапоги', 'pl', 'boots', 5, 6, 18, 7, 2, 2, 14, 0);
  A('chain_boots', 'Кольчужные сапоги', 'pl', 'boots', 8, 9, 30, 12, 2, 2, 16, 0);
  A('light_plated_boots', 'Лёгкие латные сапоги', 'pl', 'boots', 9, 11, 50, 20, 2, 2, 18, 0);
  A('greaves', 'Поножи', 'pl', 'boots', 12, 15, 70, 27, 2, 2, 24, 0);
  A('demonhide_boots', 'Сапоги из демонической кожи', 'pl', 'boots', 28, 35, 20, 36, 2, 2, 12, 0);
  A('mesh_boots', 'Сетчатые сапоги', 'pl', 'boots', 37, 44, 65, 43, 2, 2, 16, 0);
  A('war_boots', 'Боевые сапоги', 'pl', 'boots', 43, 53, 125, 54, 2, 2, 24, 0);
  A('scarabshell_boots', 'Сапоги из панциря скарабея', 'pl', 'boots', 56, 65, 91, 66, 2, 2, 14, 0);
  A('myrmidon_greaves', 'Поножи мирмидонца', 'pl', 'boots', 62, 71, 208, 85, 2, 2, 24, 0);

  A('sash', 'Кушак', 'm', 'belt', 2, 2, 0, 3, 2, 1, 12, 0, { rows: 3 });
  A('light_belt', 'Лёгкий пояс', 'm', 'belt', 3, 3, 0, 7, 2, 1, 14, 0, { rows: 3 });
  A('belt', 'Пояс', 'm', 'belt', 5, 5, 25, 12, 2, 1, 16, 0, { rows: 4 });
  A('heavy_belt', 'Тяжёлый пояс', 'm', 'belt', 6, 6, 45, 20, 2, 1, 18, 0, { rows: 4 });
  A('plated_belt', 'Латный пояс', 'm', 'belt', 8, 11, 60, 27, 2, 1, 24, 0, { rows: 4 });
  A('demonhide_sash', 'Кушак из демонической кожи', 'm', 'belt', 29, 34, 20, 36, 2, 1, 12, 0, { rows: 4 });
  A('mesh_belt', 'Сетчатый пояс', 'm', 'belt', 35, 40, 58, 43, 2, 1, 16, 0, { rows: 4 });
  A('war_belt', 'Боевой пояс', 'm', 'belt', 41, 52, 110, 54, 2, 1, 24, 0, { rows: 4 });
  A('vampirefang_belt', 'Пояс из клыков вампира', 'm', 'belt', 56, 63, 50, 68, 2, 1, 14, 0, { rows: 4 });
  A('colossus_girdle', 'Кушак колосса', 'm', 'belt', 61, 71, 185, 85, 2, 1, 24, 0, { rows: 4 });

  add({ id: 'ring', name: 'Кольцо', g: 'n', cat: 'jewel', type: 'ring', qlvl: 1, w: 1, h: 1, str: 0, dex: 0, tier: 0 });
  add({ id: 'amulet', name: 'Амулет', g: 'm', cat: 'jewel', type: 'amulet', qlvl: 1, w: 1, h: 1, str: 0, dex: 0, tier: 0 });
  add({ id: 'small_charm', name: 'Малый талисман', g: 'm', cat: 'charm', type: 'charm', qlvl: 1, w: 1, h: 1, str: 0, dex: 0, tier: 0, charm: 0.4 });
  add({ id: 'large_charm', name: 'Большой талисман', g: 'm', cat: 'charm', type: 'charm', qlvl: 14, w: 1, h: 2, str: 0, dex: 0, tier: 0, charm: 0.7 });
  add({ id: 'grand_charm', name: 'Великий талисман', g: 'm', cat: 'charm', type: 'charm', qlvl: 42, w: 1, h: 3, str: 0, dex: 0, tier: 0, charm: 1 });

  const M = (id, name, type, o) => add(Object.assign({ id, name, cat: 'misc', type, g: 'n', qlvl: 1, w: 1, h: 1, str: 0, dex: 0, tier: 0 }, o));
  M('hp1', 'Малое зелье лечения', 'hpot', { heal: 30, qlvl: 1, cost: 30 });
  M('hp2', 'Лёгкое зелье лечения', 'hpot', { heal: 60, qlvl: 5, cost: 70 });
  M('hp3', 'Зелье лечения', 'hpot', { heal: 110, qlvl: 13, cost: 130 });
  M('hp4', 'Большое зелье лечения', 'hpot', { heal: 200, qlvl: 25, cost: 250 });
  M('hp5', 'Сильное зелье лечения', 'hpot', { heal: 340, qlvl: 40, cost: 450 });
  M('mp1', 'Малое зелье маны', 'mpot', { mana: 20, qlvl: 1, cost: 30 });
  M('mp2', 'Лёгкое зелье маны', 'mpot', { mana: 40, qlvl: 5, cost: 70 });
  M('mp3', 'Зелье маны', 'mpot', { mana: 80, qlvl: 13, cost: 130 });
  M('mp4', 'Большое зелье маны', 'mpot', { mana: 150, qlvl: 25, cost: 250 });
  M('mp5', 'Сильное зелье маны', 'mpot', { mana: 250, qlvl: 40, cost: 450 });
  M('rv1', 'Зелье омоложения', 'rpot', { rejuv: 0.35, qlvl: 8, cost: 450 });
  M('rv2', 'Полное зелье омоложения', 'rpot', { rejuv: 1, qlvl: 30, cost: 1200 });
  M('tp_scroll', 'Свиток городского портала', 'scroll', { spell: 'tp', cost: 100 });
  M('id_scroll', 'Свиток опознания', 'scroll', { spell: 'id', cost: 80 });
  M('tp_tome', 'Книга городского портала', 'tome', { spell: 'tp', w: 1, h: 2, maxQty: 20, cost: 450 });
  M('id_tome', 'Книга опознания', 'tome', { spell: 'id', w: 1, h: 2, maxQty: 20, cost: 280 });
  M('key', 'Ключ', 'key', { maxQty: 12, cost: 12 });
  M('arrows', 'Колчан стрел', 'quiver', { w: 1, h: 3, maxQty: 350, ammo: 'bow', cost: 60 });
  M('bolts', 'Колчан болтов', 'quiver', { w: 1, h: 3, maxQty: 250, ammo: 'xbow', cost: 60 });
  M('q_scroll', 'Свиток Инифуса', 'quest', { quest: 'cain', w: 2, h: 2 });
  M('q_scroll2', 'Расшифрованный свиток Инифуса', 'quest', { quest: 'cain', w: 2, h: 2 });
  M('q_tome', 'Заплесневелый фолиант', 'quest', { quest: 'tower', w: 2, h: 2 });
  M('q_malus', 'Молот Хорадрима', 'quest', { quest: 'tools', w: 1, h: 2, dmg: [6, 15] });
  M('wirts_leg', 'Нога Вирта', 'questweapon', { w: 1, h: 3 });

  const GEM_TYPES = [
    { id: 'amethyst', name: 'аметист', color: '#b050f0', w: { ar: [40, 60, 80, 100, 150] }, a: { str: [3, 4, 6, 8, 10] }, s: { def: [8, 12, 18, 24, 30] } },
    { id: 'topaz', name: 'топаз', color: '#f0d030', w: { lightDmg: [[1, 8], [1, 14], [1, 22], [1, 30], [1, 40]] }, a: { mf: [9, 13, 16, 20, 24] }, s: { resL: [12, 16, 22, 30, 40] } },
    { id: 'sapphire', name: 'сапфир', color: '#3060f0', w: { coldDmg: [[1, 3], [3, 5], [4, 7], [6, 10], [10, 14]] }, a: { mana: [10, 17, 24, 31, 38] }, s: { resC: [12, 16, 22, 30, 40] } },
    { id: 'emerald', name: 'изумруд', color: '#20c040', w: { poisonDmg: [10, 20, 30, 40, 60] }, a: { dex: [3, 4, 6, 8, 10] }, s: { resP: [12, 16, 22, 30, 40] } },
    { id: 'ruby', name: 'рубин', color: '#e02020', w: { fireDmg: [[3, 4], [5, 8], [8, 12], [10, 16], [15, 20]] }, a: { life: [10, 17, 24, 31, 38] }, s: { resF: [12, 16, 22, 30, 40] } },
    { id: 'diamond', name: 'алмаз', color: '#f0f0ff', w: { undead: [28, 34, 44, 54, 64] }, a: { ar: [20, 40, 60, 80, 100] }, s: { resAll: [6, 8, 11, 14, 19] } },
    { id: 'skull', name: 'череп', color: '#d8d0c0', w: { ll: [2, 2, 3, 3, 4], ml: [1, 2, 2, 3, 3] }, a: { regen: [2, 3, 3, 4, 5], manaRegen: [8, 8, 12, 12, 19] }, s: { thorns: [4, 8, 12, 16, 20] } }
  ];
  const GEM_GRADES = [['Надколотый', 1], ['Мутный', 5], ['', 12], ['Безупречный', 18], ['Идеальный', 26]];
  const GEMS = {};
  for (const t of GEM_TYPES) {
    GEM_GRADES.forEach(([gn, lvl], gi) => {
      const pick = src => { const o = {}; for (const k in src) o[k] = src[k][gi]; return o; };
      const nm = gn ? gn + ' ' + t.name : t.name[0].toUpperCase() + t.name.slice(1);
      const g = M(t.id + gi, nm, 'gem', { qlvl: lvl, gem: t.id, grade: gi, color: t.color, sw: pick(t.w), sa: pick(t.a), ss: pick(t.s), cost: 50 * (gi + 1) * (gi + 1) });
      GEMS[g.id] = g;
    });
  }

  const RUNES = [
    ['el', 'Эл', 11, { ar: 50, lr: 1 }, { def: 15, lr: 1 }, { def: 15, lr: 1 }],
    ['eld', 'Элд', 11, { undead: 75, ar: 30 }, { regen: 2 }, { block: 7 }],
    ['tir', 'Тир', 13, { mak: 2 }, { mak: 2 }, { mak: 2 }],
    ['nef', 'Неф', 13, { kb: 1 }, { def: 30 }, { def: 30 }],
    ['eth', 'Эт', 15, { itdPct: 25 }, { manaRegen: 15 }, { manaRegen: 15 }],
    ['ith', 'Ит', 15, { maxdmg: 9 }, { mana: 15 }, { mana: 15 }],
    ['tal', 'Тал', 17, { poisonDmg: 75 }, { resP: 30 }, { resP: 35 }],
    ['ral', 'Рал', 19, { fireDmg: [5, 30] }, { resF: 30 }, { resF: 35 }],
    ['ort', 'Орт', 21, { lightDmg: [1, 50] }, { resL: 30 }, { resL: 35 }],
    ['thul', 'Тул', 23, { coldDmg: [3, 14] }, { resC: 30 }, { resC: 35 }],
    ['amn', 'Амн', 25, { ll: 7 }, { thorns: 14 }, { thorns: 14 }],
    ['sol', 'Сол', 27, { mindmg: 9 }, { dr: 7 }, { dr: 7 }],
    ['shael', 'Шаэль', 29, { ias: 20 }, { fhr: 20 }, { block: 10 }],
    ['dol', 'Дол', 31, { flee: 25 }, { regen: 7 }, { regen: 7 }],
    ['hel', 'Хел', 33, { reqPct: -20 }, { reqPct: -15 }, { reqPct: -15 }],
    ['io', 'Ио', 35, { vit: 10 }, { vit: 10 }, { vit: 10 }],
    ['lum', 'Лум', 37, { ene: 10 }, { ene: 10 }, { ene: 10 }],
    ['ko', 'Ко', 39, { dex: 10 }, { dex: 10 }, { dex: 10 }],
    ['fal', 'Фал', 41, { str: 10 }, { str: 10 }, { str: 10 }],
    ['lem', 'Лем', 43, { gf: 75 }, { gf: 50 }, { gf: 50 }],
    ['pul', 'Пул', 45, { undead: 75, ar: 100 }, { edef: 30 }, { edef: 30 }],
    ['um', 'Ум', 47, { ow: 25 }, { resAll: 15 }, { resAll: 22 }],
    ['mal', 'Мал', 49, { mdr: 7 }, { mdr: 7 }, { mdr: 7 }],
    ['ist', 'Ист', 51, { mf: 30 }, { mf: 25 }, { mf: 25 }],
    ['gul', 'Гул', 53, { arPct: 20 }, { resP: 30 }, { resP: 30 }]
  ];
  const RUNE_IDS = [];
  RUNES.forEach(([id, nm, lvl, w, a, s], i) => {
    M('r_' + id, 'Руна ' + nm, 'rune', { qlvl: lvl, rune: id, runeName: nm, rank: i, sw: w, sa: a, ss: s, cost: 100 + i * i * 40 });
    RUNE_IDS.push('r_' + id);
  });

  const RUNEWORDS = [
    { id: 'steel', name: 'Сталь', runes: ['tir', 'el'], types: ['sword', 'axe', 'mace'], stats: { ias: 25, ed: 20, mindmg: 3, maxdmg: 3, ar: 50, ow: 50, lr: 1 } },
    { id: 'nadir', name: 'Надир', runes: ['nef', 'tir'], types: ['helm'], stats: { edef: 50, def: 10, str: 5, gf: -33, lr: -3 } },
    { id: 'malice', name: 'Злоба', runes: ['ith', 'el', 'eth'], types: MELEE, stats: { ed: 33, ow: 100, regen: -5, lr: -1 } },
    { id: 'stealth', name: 'Скрытность', runes: ['tal', 'eth'], types: ['body'], stats: { frw: 25, fcr: 25, fhr: 25, dex: 6, mdr: 3, stamina: 15 } },
    { id: 'leaf', name: 'Лист', runes: ['tir', 'ral'], types: ['staff'], stats: { 'tree:sorceress:0': 3, 'sk:fire_bolt': 3, 'sk:inferno': 3, resC: 33, def: 20 } },
    { id: 'ancients_pledge', name: 'Клятва древних', runes: ['ral', 'ort', 'tal'], types: ['shield'], stats: { edef: 50, resC: 43, resAll: 13, dr: 3 } },
    { id: 'strength', name: 'Сила', runes: ['amn', 'tir'], types: MELEE, stats: { ed: 35, cb: 25, str: 20, vit: 10 } },
    { id: 'zephyr', name: 'Зефир', runes: ['ort', 'eth'], types: ['bow', 'xbow'], stats: { ed: 33, ar: 66, frw: 25, ias: 25, def: 25 } },
    { id: 'lore', name: 'Знание', runes: ['ort', 'sol'], types: ['helm', 'circlet'], stats: { allSkills: 1, ene: 10, lr: 2 } },
    { id: 'rhyme', name: 'Рифма', runes: ['shael', 'eth'], types: ['shield'], stats: { resAll: 25, cbf: 1, gf: 50, mf: 25 } },
    { id: 'white', name: 'Белизна', runes: ['dol', 'io'], types: ['wand'], stats: { 'tree:necromancer:1': 3, fcr: 20, 'sk:bone_armor': 3, 'sk:bone_spear': 2, mana: 13 } },
    { id: 'smoke', name: 'Дым', runes: ['nef', 'lum'], types: ['body'], stats: { fhr: 20, edef: 75, resAll: 50, lr: -1 } },
    { id: 'kings_grace', name: 'Королевская милость', runes: ['amn', 'ral', 'thul'], types: ['sword', 'scepter'], stats: { ed: 100, ar: 150, undead: 100 } },
    { id: 'black', name: 'Чернота', runes: ['thul', 'io', 'nef'], types: ['club', 'hammer', 'mace'], stats: { ed: 120, cb: 40, ar: 200, ias: 15 } },
    { id: 'insight', name: 'Прозрение', runes: ['ral', 'tir', 'tal', 'sol'], types: ['polearm', 'staff'], stats: { ed: 230, arPct: 200, 'sk:critical_strike': 5, mf: 23, str: 3, dex: 3, vit: 3, ene: 3, aura: 'meditation', auraLvl: 14 } },
    { id: 'spirit', name: 'Дух', runes: ['tal', 'thul', 'ort', 'amn'], types: ['sword', 'shield'], stats: { allSkills: 2, fcr: 30, fhr: 55, vit: 22, mana: 100, mdr: 5 } },
    { id: 'lawbringer', name: 'Законник', runes: ['amn', 'lem', 'ko'], types: ['sword', 'hammer', 'scepter'], stats: { ed: 70, dex: 10, ar: 150, gf: 75, aura: 'might', auraLvl: 12 } },
    { id: 'honor', name: 'Честь', runes: ['amn', 'el', 'ith', 'tir', 'sol'], types: MELEE, stats: { allSkills: 1, ed: 160, ar: 250, str: 10, regen: 10, lr: 1, dstrike: 25 } }
  ];

  const A4 = (s, t) => {
    if (t === 'o') return [s + 'ой', s + 'ая', s + 'ое', s + 'ые'];
    if (t === 'k') return [s + 'ий', s + 'ая', s + 'ое', s + 'ие'];
    if (t === 'ch') return [s + 'ий', s + 'ая', s + 'ее', s + 'ие'];
    if (t === 'n') return [s + 'ий', s + 'яя', s + 'ее', s + 'ие'];
    if (t === 'p') return [s + 'ий', s + 'ья', s + 'ье', s + 'ьи'];
    return [s + 'ый', s + 'ая', s + 'ое', s + 'ые'];
  };

  const AFFIXES = [];
  const WEAP = ['weapon'];
  const ARMS = ['armor'];
  const JEW = ['ring', 'amulet'];
  const ALLA = ['armor', 'ring', 'amulet', 'charm'];
  const pre = (stem, t, lvl, types, stats, group) => AFFIXES.push({ kind: 'pre', names: A4(stem, t), lvl, types, stats, group: group || Object.keys(stats).join('+') });
  const suf = (name, lvl, types, stats, group) => AFFIXES.push({ kind: 'suf', name, lvl, types, stats, group: group || Object.keys(stats).join('+') });

  pre('Зазубренн', 'y', 1, WEAP, { ed: [10, 20] }, 'ed');
  pre('Смертоносн', 'y', 5, WEAP, { ed: [21, 30] }, 'ed');
  pre('Лют', 'y', 12, WEAP, { ed: [31, 40] }, 'ed');
  pre('Жесток', 'k', 18, WEAP, { ed: [41, 50] }, 'ed');
  pre('Массивн', 'y', 25, WEAP, { ed: [51, 65] }, 'ed');
  pre('Свиреп', 'y', 35, WEAP, { ed: [66, 80] }, 'ed');
  pre('Беспощадн', 'y', 45, WEAP, { ed: [81, 100] }, 'ed');
  pre('Кровожадн', 'y', 58, WEAP, { ed: [101, 150] }, 'ed');
  pre('Бронзов', 'y', 1, WEAP.concat(['ring', 'charm']), { ar: [10, 20] }, 'ar');
  pre('Железн', 'y', 6, WEAP.concat(['ring', 'charm']), { ar: [21, 40] }, 'ar');
  pre('Стальн', 'o', 12, WEAP.concat(['ring', 'charm']), { ar: [41, 60] }, 'ar');
  pre('Серебрян', 'y', 18, WEAP.concat(['ring']), { ar: [61, 80] }, 'ar');
  pre('Золот', 'o', 25, WEAP.concat(['ring']), { ar: [81, 100] }, 'ar');
  pre('Платинов', 'y', 35, WEAP, { ar: [101, 120] }, 'ar');
  pre('Метеоритн', 'y', 48, WEAP, { ar: [121, 150] }, 'ar');
  pre('Остр', 'y', 3, WEAP, { ed: [10, 20], ar: [10, 20] }, 'edar');
  pre('Воинск', 'k', 11, WEAP, { ed: [21, 30], ar: [21, 40] }, 'edar');
  pre('Солдатск', 'k', 20, WEAP, { ed: [31, 40], ar: [41, 60] }, 'edar');
  pre('Рыцарск', 'k', 30, WEAP, { ed: [41, 50], ar: [61, 80] }, 'edar');
  pre('Королевск', 'k', 45, WEAP, { ed: [51, 65], ar: [81, 100] }, 'edar');
  pre('Прочн', 'y', 1, ARMS, { edef: [10, 20] }, 'edef');
  pre('Крепк', 'k', 6, ARMS, { edef: [21, 30] }, 'edef');
  pre('Славн', 'y', 14, ARMS, { edef: [31, 40] }, 'edef');
  pre('Благословенн', 'y', 18, ARMS, { edef: [41, 50] }, 'edef');
  pre('Свят', 'o', 25, ARMS, { edef: [51, 65] }, 'edef');
  pre('Священн', 'y', 35, ARMS, { edef: [66, 80] }, 'edef');
  pre('Божественн', 'y', 50, ARMS, { edef: [81, 100] }, 'edef');
  pre('Лазурн', 'y', 1, ALLA, { resC: [5, 10] }, 'resC');
  pre('Лазуритов', 'y', 12, ALLA, { resC: [11, 20] }, 'resC');
  pre('Кобальтов', 'y', 26, ['armor', 'amulet'], { resC: [21, 30] }, 'resC');
  pre('Сапфиров', 'y', 38, ['shield', 'amulet'], { resC: [31, 40] }, 'resC');
  pre('Красноват', 'y', 1, ALLA, { resF: [5, 10] }, 'resF');
  pre('Гранатов', 'y', 12, ALLA, { resF: [11, 20] }, 'resF');
  pre('Багров', 'y', 26, ['armor', 'amulet'], { resF: [21, 30] }, 'resF');
  pre('Рубинов', 'y', 38, ['shield', 'amulet'], { resF: [31, 40] }, 'resF');
  pre('Охрян', 'y', 1, ALLA, { resL: [5, 10] }, 'resL');
  pre('Кораллов', 'y', 12, ALLA, { resL: [11, 20] }, 'resL');
  pre('Янтарн', 'y', 26, ['armor', 'amulet'], { resL: [21, 30] }, 'resL');
  pre('Топазов', 'y', 38, ['shield', 'amulet'], { resL: [31, 40] }, 'resL');
  pre('Нефритов', 'y', 1, ALLA, { resP: [5, 10] }, 'resP');
  pre('Малахитов', 'y', 12, ALLA, { resP: [11, 20] }, 'resP');
  pre('Изумрудн', 'y', 26, ['armor', 'amulet'], { resP: [21, 30] }, 'resP');
  pre('Змеевиков', 'y', 38, ['shield', 'amulet'], { resP: [31, 40] }, 'resP');
  pre('Мерцающ', 'ch', 5, ['armor', 'ring', 'amulet', 'charm'], { resAll: [5, 10] }, 'resAll');
  pre('Радужн', 'y', 18, ['armor', 'ring', 'amulet'], { resAll: [11, 15] }, 'resAll');
  pre('Сверкающ', 'ch', 30, ['shield', 'amulet'], { resAll: [16, 20] }, 'resAll');
  pre('Призматическ', 'k', 48, ['shield', 'amulet'], { resAll: [21, 30] }, 'resAll');
  pre('Ящерн', 'y', 1, ['ring', 'amulet', 'helm', 'circlet', 'orb', 'wand', 'staff', 'charm'], { mana: [1, 5] }, 'mana');
  pre('Змеин', 'y', 5, ['ring', 'amulet', 'helm', 'circlet', 'orb', 'wand', 'staff', 'charm'], { mana: [6, 10] }, 'mana');
  pre('Аспидн', 'y', 13, ['ring', 'amulet', 'helm', 'circlet', 'orb', 'wand', 'staff'], { mana: [11, 20] }, 'mana');
  pre('Дракон', 'p', 25, ['ring', 'amulet', 'circlet', 'orb', 'staff'], { mana: [21, 30] }, 'mana');
  pre('Виверн', 'p', 40, ['amulet', 'circlet', 'orb'], { mana: [31, 40] }, 'mana');
  pre('Тяжёл', 'y', 1, WEAP.concat(['charm']), { maxdmg: [1, 3] }, 'maxdmg');
  pre('Колюч', 'ch', 10, WEAP.concat(['charm']), { maxdmg: [4, 8] }, 'maxdmg');
  pre('Удачлив', 'y', 10, ['armor', 'ring', 'amulet', 'charm'], { mf: [5, 10] }, 'mfpre');
  pre('Сияющ', 'ch', 6, ['armor', 'ring', 'amulet', 'weapon'], { lr: [1, 1], ar: [5, 15] }, 'lr');
  const CLS_PRE = { amazon: ['Девич', 'p', 'Валькир', 'p'], assassin: ['Тенев', 'o', 'Призрачн', 'y'], necromancer: ['Жреческ', 'k', 'Могильн', 'y'], barbarian: ['Дикарск', 'k', 'Буйн', 'y'], paladin: ['Иноческ', 'k', 'Ангельск', 'k'], sorceress: ['Чародейск', 'k', 'Колдовск', 'o'], druid: ['Лесн', 'o', 'Друидическ', 'k'] };
  for (const cls in CLS_PRE) {
    const [a, at, b, bt] = CLS_PRE[cls];
    AFFIXES.push({ kind: 'pre', names: A4(a, at), lvl: 12, types: ['amulet', 'circlet', 'orb', 'wand', 'staff', 'claw'], stats: { ['cls:' + cls]: [1, 1] }, group: 'cls' });
    AFFIXES.push({ kind: 'pre', names: A4(b, bt), lvl: 42, types: ['amulet', 'circlet', 'orb', 'wand', 'claw'], stats: { ['cls:' + cls]: [2, 2] }, group: 'cls' });
  }

  suf('силы', 1, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { str: [1, 2] }, 'str');
  suf('мощи', 6, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { str: [3, 5] }, 'str');
  suf('гиганта', 17, ['weapon', 'armor', 'ring', 'amulet'], { str: [6, 9] }, 'str');
  suf('титана', 30, ['weapon', 'gloves', 'belt', 'ring', 'amulet'], { str: [10, 15] }, 'str');
  suf('атланта', 50, ['weapon', 'amulet', 'ring'], { str: [16, 20] }, 'str');
  suf('ловкости', 1, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { dex: [1, 2] }, 'dex');
  suf('сноровки', 6, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { dex: [3, 5] }, 'dex');
  suf('точности', 17, ['weapon', 'armor', 'ring', 'amulet'], { dex: [6, 9] }, 'dex');
  suf('мастерства', 30, ['weapon', 'gloves', 'boots', 'ring', 'amulet'], { dex: [10, 15] }, 'dex');
  suf('совершенства', 50, ['weapon', 'amulet', 'ring'], { dex: [16, 20] }, 'dex');
  suf('здоровья', 1, ['armor', 'ring', 'amulet', 'charm'], { vit: [1, 2] }, 'vit');
  suf('стойкости', 6, ['armor', 'ring', 'amulet', 'charm'], { vit: [3, 5] }, 'vit');
  suf('выносливости', 17, ['armor', 'ring', 'amulet'], { vit: [6, 9] }, 'vit');
  suf('крепости', 30, ['body', 'belt', 'ring', 'amulet', 'shield'], { vit: [10, 15] }, 'vit');
  suf('бессмертия', 50, ['body', 'amulet', 'ring'], { vit: [16, 20] }, 'vit');
  suf('разума', 1, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { ene: [1, 2] }, 'ene');
  suf('мысли', 6, ['weapon', 'armor', 'ring', 'amulet', 'charm'], { ene: [3, 5] }, 'ene');
  suf('мудрости', 17, ['orb', 'wand', 'staff', 'helm', 'circlet', 'ring', 'amulet'], { ene: [6, 9] }, 'ene');
  suf('знания', 30, ['orb', 'wand', 'staff', 'circlet', 'ring', 'amulet'], { ene: [10, 15] }, 'ene');
  suf('просветления', 50, ['orb', 'staff', 'amulet', 'ring'], { ene: [16, 20] }, 'ene');
  suf('шакала', 1, ['armor', 'ring', 'amulet', 'charm'], { life: [1, 5] }, 'life');
  suf('лисицы', 6, ['armor', 'ring', 'amulet', 'charm'], { life: [6, 10] }, 'life');
  suf('волка', 12, ['armor', 'ring', 'amulet', 'charm'], { life: [11, 20] }, 'life');
  suf('тигра', 20, ['armor', 'amulet', 'ring'], { life: [21, 30] }, 'life');
  suf('мамонта', 30, ['body', 'shield', 'belt', 'amulet'], { life: [31, 40] }, 'life');
  suf('колосса', 50, ['body', 'shield', 'belt', 'amulet'], { life: [41, 60] }, 'life');
  suf('пиявки', 10, ['weapon', 'gloves', 'ring', 'amulet'], { ll: [3, 5] }, 'll');
  suf('миноги', 28, ['weapon', 'ring', 'amulet'], { ll: [6, 7] }, 'll');
  suf('саранчи', 45, ['weapon'], { ll: [8, 9] }, 'll');
  suf('летучей мыши', 10, ['weapon', 'gloves', 'ring', 'amulet'], { ml: [3, 5] }, 'ml');
  suf('вампира', 30, ['weapon', 'ring', 'amulet'], { ml: [6, 8] }, 'ml');
  suf('проворства', 9, ['weapon', 'gloves'], { ias: [10, 10] }, 'ias');
  suf('расторопности', 18, ['weapon', 'gloves'], { ias: [20, 20] }, 'ias');
  suf('быстроты', 34, ['weapon'], { ias: [30, 30] }, 'ias');
  suf('ходьбы', 3, ['boots', 'charm'], { frw: [5, 10] }, 'frw');
  suf('странствий', 12, ['boots'], { frw: [15, 20] }, 'frw');
  suf('скорости', 25, ['boots'], { frw: [25, 30] }, 'frw');
  suf('ветра', 45, ['boots'], { frw: [35, 40] }, 'frw');
  suf('равновесия', 5, ['armor', 'amulet', 'charm'], { fhr: [10, 10] }, 'fhr');
  suf('устойчивости', 15, ['body', 'belt', 'amulet'], { fhr: [17, 17] }, 'fhr');
  suf('стабильности', 30, ['body', 'belt'], { fhr: [24, 24] }, 'fhr');
  suf('подмастерья', 8, ['amulet', 'ring', 'orb', 'wand', 'staff', 'circlet'], { fcr: [10, 10] }, 'fcr');
  suf('чародея', 22, ['amulet', 'orb', 'wand', 'staff', 'circlet'], { fcr: [20, 20] }, 'fcr');
  suf('удачи', 5, ['armor', 'ring', 'amulet', 'weapon'], { mf: [5, 10] }, 'mf');
  suf('фортуны', 15, ['armor', 'ring', 'amulet'], { mf: [11, 25] }, 'mf');
  suf('жадности', 1, ['armor', 'ring', 'amulet', 'weapon', 'charm'], { gf: [25, 40] }, 'gf');
  suf('алчности', 20, ['armor', 'ring', 'amulet', 'weapon'], { gf: [41, 80] }, 'gf');
  suf('регенерации', 1, ['armor', 'ring', 'amulet'], { regen: [3, 3] }, 'regen');
  suf('восстановления', 20, ['armor', 'ring', 'amulet'], { regen: [5, 8] }, 'regen');
  suf('дыхания', 8, ['amulet', 'ring', 'orb', 'staff', 'helm', 'circlet'], { manaRegen: [15, 30] }, 'mregen');
  suf('шипов', 3, ['armor'], { thorns: [1, 3] }, 'thorns');
  suf('колючек', 12, ['body', 'shield', 'gloves'], { thorns: [4, 8] }, 'thorns');
  suf('лезвий', 25, ['body', 'shield'], { thorns: [9, 20] }, 'thorns');
  suf('отражения', 3, ['shield'], { block: [10, 10] }, 'block');
  suf('парирования', 20, ['shield'], { block: [20, 20] }, 'block');
  suf('защиты', 3, ['armor'], { dr: [1, 1] }, 'dr');
  suf('стражи', 14, ['armor'], { dr: [2, 3] }, 'dr');
  suf('бастиона', 30, ['body', 'shield'], { dr: [4, 6] }, 'dr');
  suf('света', 1, ['weapon', 'armor', 'ring', 'amulet'], { lr: [1, 1] }, 'lrs');
  suf('пламени', 1, WEAP.concat(['charm']), { fireDmg: [[1, 2], [3, 4]] }, 'fire');
  suf('огня', 12, WEAP, { fireDmg: [[4, 7], [8, 14]] }, 'fire');
  suf('пожара', 28, WEAP, { fireDmg: [[10, 18], [20, 34]] }, 'fire');
  suf('сожжения', 50, WEAP, { fireDmg: [[20, 35], [40, 70]] }, 'fire');
  suf('инея', 1, WEAP.concat(['charm']), { coldDmg: [[1, 1], [2, 3]] }, 'cold');
  suf('мороза', 12, WEAP, { coldDmg: [[3, 5], [6, 10]] }, 'cold');
  suf('льда', 28, WEAP, { coldDmg: [[7, 12], [14, 24]] }, 'cold');
  suf('стужи', 50, WEAP, { coldDmg: [[15, 25], [30, 50]] }, 'cold');
  suf('искр', 1, WEAP.concat(['charm']), { lightDmg: [[1, 1], [6, 10]] }, 'light');
  suf('молнии', 12, WEAP, { lightDmg: [[1, 1], [16, 25]] }, 'light');
  suf('грома', 28, WEAP, { lightDmg: [[1, 3], [35, 55]] }, 'light');
  suf('бури', 50, WEAP, { lightDmg: [[1, 5], [70, 110]] }, 'light');
  suf('яда', 1, WEAP.concat(['charm']), { poisonDmg: [10, 16] }, 'poison');
  suf('отравы', 12, WEAP, { poisonDmg: [24, 36] }, 'poison');
  suf('чумы', 28, WEAP, { poisonDmg: [50, 75] }, 'poison');
  suf('мора', 50, WEAP, { poisonDmg: [100, 150] }, 'poison');
  suf('увечья', 1, WEAP.concat(['charm']), { maxdmg: [1, 3] }, 'smax');
  suf('резни', 15, WEAP, { maxdmg: [4, 8] }, 'smax');
  suf('отбрасывания', 5, ['weapon'], { kb: [1, 1] }, 'kb');
  suf('сокрушения', 22, ['weapon'], { cb: [10, 20] }, 'cb');
  suf('кровопускания', 14, ['weapon'], { ow: [10, 25] }, 'ow');
  suf('поглощения', 10, ['weapon', 'ring', 'amulet'], { mak: [1, 3] }, 'mak');
  suf('жатвы', 18, ['weapon', 'ring', 'amulet'], { lak: [2, 6] }, 'lak');
  suf('нежити', 8, ['weapon'], { undead: [30, 60] }, 'undead');

  const U = (id, name, base, lvl, req, stats) => ({ id, name, base, lvl, req, stats });
  const UNIQUES = [
    U('rixots_keen', 'Острота Рикзота', 'short_sword', 3, 2, { ed: 100, mindmg: 5, dstrike: 25, def: 25, lr: 2 }),
    U('blood_crescent', 'Кровавый полумесяц', 'scimitar', 7, 7, { ias: 15, ed: [60, 80], ll: 15, life: 15, resAll: 15, lr: 4 }),
    U('krintiz', 'Вертел Кринтиза', 'sabre', 10, 10, { ed: 50, mindmg: 3, maxdmg: 7, str: 10, dex: 10, ll: 7, ml: 7, itd: 1 }),
    U('gleamscythe', 'Сверкающая коса', 'falchion', 13, 13, { ed: [60, 100], ias: 20, def: 20, mana: 30, coldDmg: [3, 5], lr: 1 }),
    U('griswolds_edge', 'Клинок Гризвольда', 'broad_sword', 17, 17, { ed: [80, 120], ar: 100, fireDmg: [10, 12], str: 12, kb: 1, ias: 10 }),
    U('hellplague', 'Адская чума', 'long_sword', 22, 22, { ed: [70, 80], 'tree:sorceress:0': 2, fireDmg: [25, 75], poisonDmg: 70, ll: 6, ml: 6 }),
    U('culwens_point', 'Острие Калвена', 'war_sword', 29, 29, { ed: [70, 80], allSkills: 1, ias: 20, fhr: 20, ar: 60, resP: 50 }),
    U('shadowfang', 'Клык тени', 'two_handed_sword', 12, 12, { ed: 90, coldDmg: [10, 30], ll: 9, ml: 9, resC: 20, lr: -2 }),
    U('soulflay', 'Бичеватель душ', 'claymore', 19, 19, { ed: [70, 100], ll: [4, 10], ml: [4, 10], ias: 35, resAll: 5 }),
    U('the_gnasher', 'Грызун', 'hand_axe', 7, 5, { ed: [60, 70], cb: 50, ow: 50, str: 8 }),
    U('deathspade', 'Лопата смерти', 'axe', 12, 9, { ed: [60, 70], mindmg: 8, ar: 15, mak: 4, flee: 25 }),
    U('bladebone', 'Костяной клинок', 'double_axe', 20, 15, { ed: [30, 50], def: 20, fireDmg: [8, 12], undead: 100, fhr: 20 }),
    U('skull_splitter', 'Раскалыватель черепов', 'military_pick', 28, 21, { ed: [60, 100], ow: 15, ar: [50, 100], lightDmg: [1, 12], manaRegen: 20 }),
    U('axe_of_fechmar', 'Топор Фехмара', 'large_axe', 12, 8, { ed: [70, 90], freeze: 3, resC: 50, lr: 2 }),
    U('goreshovel', 'Кровавая лопата', 'broad_axe', 19, 14, { ed: [40, 50], maxdmg: 9, ias: 30, str: 25, ow: 60 }),
    U('the_chieftain', 'Вождь', 'battle_axe', 26, 19, { ed: 100, lightDmg: [1, 40], resAll: [10, 20], ias: 20, manaRegen: 10 }),
    U('felloak', 'Павший дуб', 'club', 4, 3, { ed: [70, 80], fireDmg: [6, 8], kb: 1, resL: 60, resF: 20 }),
    U('stoutnail', 'Крепкий гвоздь', 'spiked_club', 7, 5, { ed: 100, vit: 7, thorns: [3, 10], mdr: 2 }),
    U('crushflange', 'Крушитель', 'mace', 12, 9, { ed: [50, 60], cb: 33, str: 15, resF: 50, kb: 1, lr: 2 }),
    U('bloodrise', 'Кровавый восход', 'morning_star', 20, 15, { ed: 120, ll: 10, ar: 50, ow: 25, 'sk:sacrifice': 2, lr: 2 }),
    U('tan_do_li_ga', 'Тан-До-Ли-Га генерала', 'flail', 28, 21, { ed: [50, 60], mindmg: 1, maxdmg: 20, ml: 5, def: 25, ias: 20 }),
    U('ironstone', 'Железный камень', 'war_hammer', 36, 28, { ed: [100, 150], ar: [100, 150], lightDmg: [1, 10], str: 10 }),
    U('knell_striker', 'Похоронный набат', 'scepter', 7, 5, { ed: [70, 80], ar: 35, cb: 25, resF: 20, resP: 20, mana: 15 }),
    U('rusthandle', 'Ржавая рукоять', 'grand_scepter', 23, 18, { ed: [50, 60], undead: 100, ll: 8, maxdmg: 3, 'tree:paladin:1': 1, thorns: 3 }),
    U('gull', 'Чайка', 'dagger', 6, 4, { mindmg: 1, maxdmg: 15, mf: 100, mana: -5 }),
    U('the_diggler', 'Копатель', 'dirk', 15, 11, { ed: 50, ias: 30, dex: 10, itd: 1, resC: 25, resF: 25 }),
    U('jade_tan_do', 'Нефритовый Тан До', 'kris', 24, 19, { ar: [100, 150], poisonDmg: 180, resP: 50, cbf: 1 }),
    U('dragon_chang', 'Драконий Чанг', 'spear', 11, 8, { mindmg: 10, ar: 35, fireDmg: [3, 6], undead: 100, lr: 2 }),
    U('razortine', 'Бритвенный зубец', 'trident', 16, 12, { ed: [30, 50], str: 15, dex: 8, ias: 30, itdPct: 50 }),
    U('bane_ash', 'Ясеневая погибель', 'short_staff', 7, 5, { ed: [50, 60], ias: 20, resF: 50, 'sk:fire_bolt': 5, mana: 30 }),
    U('serpent_lord', 'Властелин змей', 'long_staff', 12, 9, { ed: [30, 40], mana: 10, poisonDmg: 12, ml: 100, resP: 50, lr: -1 }),
    U('lazarus_spire', 'Шпиль Лазаря', 'gnarled_staff', 24, 18, { 'cls:sorceress': 1, 'sk:chain_lightning': 3, 'sk:static_field': 1, ene: 15, vit: 10, resL: 75, dr: 5 }),
    U('the_salamander', 'Саламандра', 'battle_staff', 28, 21, { 'tree:sorceress:0': 2, 'sk:fire_wall': 3, 'sk:fire_ball': 2, resF: 30, fireDmg: [15, 32] }),
    U('torch_of_iro', 'Факел Иро', 'wand', 7, 5, { 'cls:necromancer': 2, lak: 3, ene: 10, ll: 6, fireDmg: [5, 9], lr: 1 }),
    U('maelstrom', 'Водоворот', 'yew_wand', 19, 14, { 'cls:necromancer': 2, 'sk:iron_maiden': 3, 'sk:amplify_damage': 3, mana: 13, lightDmg: [1, 9], fcr: 30 }),
    U('gravenspine', 'Могильный хребет', 'bone_wand', 27, 20, { 'cls:necromancer': 2, str: 10, dex: 10, coldDmg: [4, 8], mana: [25, 50], ml: 5 }),
    U('umes_lament', 'Плач Уме', 'grim_wand', 38, 28, { 'cls:necromancer': 2, 'sk:decrepify': 2, 'sk:life_tap': 2, fcr: 20, mana: 40 }),
    U('shadow_claw', 'Коготь тени', 'katar', 5, 3, { ed: [40, 60], ias: 15, dex: 10, ll: 5 }),
    U('bartucs_cut', 'Горло Бартука', 'greater_claws', 50, 42, { 'cls:assassin': 2, 'tree:assassin:0': 1, ed: [150, 200], str: 20, dex: 20, ll: 9, fhr: 30 }),
    U('the_oculus', 'Окулус', 'swirling_crystal', 51, 42, { 'cls:sorceress': 3, fcr: 30, def: 20, vit: 20, ene: 20, resAll: 20, mf: 50, mak: 5 }),
    U('eagle_eye', 'Орлиный глаз', 'eagle_orb', 6, 4, { 'cls:sorceress': 1, mana: 20, fcr: 10, resL: 20 }),
    U('pluckeye', 'Ослепитель', 'short_bow', 9, 7, { ed: 100, ar: 28, life: 10, lr: 2, ml: 3, mak: 2 }),
    U('witherstring', 'Увядающая тетива', 'hunters_bow', 17, 13, { ed: [40, 50], fireDmg: [1, 3], ias: 30, ar: 50, maxdmg: 5 }),
    U('raven_claw', 'Коготь ворона', 'long_bow', 20, 15, { ed: [60, 70], arPct: 50, str: 3, dex: 3, 'sk:exploding_arrow': 3 }),
    U('rogues_bow', 'Лук разбойницы', 'composite_bow', 27, 20, { ed: [40, 60], undead: 100, ar: 60, resAll: 10, dstrike: 30, ias: 50 }),
    U('leadcrow', 'Свинцовый ворон', 'light_crossbow', 12, 9, { ed: 70, dstrike: 25, dex: 10, ar: 40, resP: 30, life: 10 }),
    U('ichorsting', 'Жало ихора', 'crossbow', 24, 18, { ar: 50, poisonDmg: 50, dex: 20, pierce: 50, ias: 20 }),
    U('titans_revenge', 'Месть титана', 'hyperion_javelin', 70, 42, { ed: [150, 200], 'cls:amazon': 2, 'tree:amazon:2': 2, str: 20, dex: 20, ll: 9, repl: 1 }),
    U('biggins_bonnet', 'Чепец Биггина', 'cap', 4, 3, { def: 14, life: 15, mana: 15, ar: 30, ed: 0 }),
    U('tarnhelm', 'Шлем-невидимка', 'skull_cap', 20, 15, { allSkills: 1, mf: [25, 50], gf: 75 }),
    U('coif_of_glory', 'Шлем славы', 'helm', 19, 14, { def: 10, resL: 15, thorns: 7, fhr: 20 }),
    U('duskdeep', 'Глубокие сумерки', 'full_helm', 23, 17, { edef: [30, 50], def: 10, resAll: 15, dr: 7, maxdmg: 8, lr: -2 }),
    U('face_of_horror', 'Лик ужаса', 'mask', 26, 20, { def: 25, str: 20, resAll: 10, undead: 50, flee: 50 }),
    U('wormskull', 'Червивый череп', 'bone_helm', 28, 21, { 'cls:necromancer': 1, 'tree:necromancer:1': 2, ll: 5, resP: 25, mana: 10 }),
    U('howltusk', 'Клык воя', 'great_helm', 30, 25, { edef: 80, mdr: 2, kb: 1, thorns: 3, fhr: 15 }),
    U('undead_crown', 'Корона нежити', 'crown', 39, 29, { edef: [30, 60], def: 30, undead: 50, ll: 5, resP: 50 }),
    U('harlequin_crest', 'Гребень арлекина', 'shako', 69, 62, { allSkills: 2, str: 2, dex: 2, vit: 2, ene: 2, life: 100, mana: 100, mf: 50, dr: 10 }),
    U('greyform', 'Серая форма', 'quilted_armor', 7, 7, { def: 20, dex: 10, mdr: 3, resC: 20, resF: 20 }),
    U('blinkbats_form', 'Облик Блинкбата', 'leather_armor', 16, 12, { def: 25, frw: 10, fhr: 40, fireDmg: [1, 6] }),
    U('the_centurion', 'Центурион', 'hard_leather', 19, 14, { def: 30, ar: 50, life: 15, mana: 15, fhr: 25, dr: 2 }),
    U('twitchthroe', 'Судорога', 'studded_leather', 22, 16, { edef: 25, str: 10, dex: 10, fhr: 20, ias: 20, block: 25 }),
    U('darkglow', 'Тёмное сияние', 'ring_mail', 19, 14, { edef: [70, 100], ar: 50, lr: 1, resAll: [5, 10] }),
    U('hawkmail', 'Ястребиная кольчуга', 'scale_mail', 20, 15, { edef: [80, 100], resC: 15, cbf: 1, frw: 10 }),
    U('sparking_mail', 'Искрящаяся кольчуга', 'chain_mail', 22, 17, { edef: [75, 85], resL: 30, thorns: 12, lightDmg: [1, 20] }),
    U('venom_ward', 'Защита от яда', 'breast_plate', 27, 20, { edef: [60, 100], resP: 90, lr: 2 }),
    U('iceblink', 'Ледяной отблеск', 'splint_mail', 28, 22, { edef: [70, 80], freeze: 1, resC: 30, lr: 4, mdr: 1 }),
    U('goldskin', 'Золотая кожа', 'plate_mail', 36, 28, { edef: [100, 150], resAll: 35, gf: 100, lr: 2, thorns: 10 }),
    U('rockfleece', 'Каменное руно', 'field_plate', 38, 29, { edef: [100, 130], str: 5, dr: 5, mdr: 2 }),
    U('heavenly_garb', 'Небесное одеяние', 'light_plate', 36, 29, { edef: 100, undead: 50, manaRegen: 25, ene: 15, resAll: 10 }),
    U('rattlecage', 'Гремящая клеть', 'gothic_plate', 38, 32, { def: 200, cb: 25, ar: 45, kb: 1 }),
    U('corpsemourn', 'Плач по трупу', 'full_plate', 42, 37, { edef: [150, 180], str: 8, vit: 10, resC: 35, fireDmg: [12, 36] }),
    U('silks_victor', 'Шелка победителя', 'ancient_armor', 51, 43, { edef: [100, 120], allSkills: 1, ml: 5, lr: 2 }),
    U('skin_of_vipermagi', 'Кожа гадюки-мага', 'wyrmhide', 36, 29, { allSkills: 1, fcr: 30, resAll: [20, 35], edef: [80, 120], mdr: 13 }),
    U('pelta_lunata', 'Пельта Луната', 'buckler', 3, 2, { edef: [30, 40], str: 2, vit: 10, ene: 10, block: 20 }),
    U('umbral_disk', 'Теневой диск', 'small_shield', 12, 9, { edef: [40, 50], def: 30, dex: 10, life: 20, lr: -2 }),
    U('stormguild', 'Гильдия бурь', 'large_shield', 18, 13, { edef: [50, 60], def: 30, resL: 25, thorns: 3, lightDmg: [1, 6] }),
    U('steelclash', 'Звон стали', 'kite_shield', 23, 17, { edef: [60, 100], def: 20, 'cls:paladin': 1, resAll: 15, block: 25, lr: 3 }),
    U('swordback_hold', 'Хребет-меч', 'spiked_shield', 20, 15, { edef: [30, 60], def: 10, ow: 50, thorns: 10, block: 20 }),
    U('wall_eyeless', 'Стена безглазых', 'bone_shield', 27, 20, { edef: [30, 40], ml: 3, fcr: 20, mak: 5, resC: 20, resF: 20 }),
    U('bverrit_keep', 'Твердыня Бверрита', 'tower_shield', 25, 19, { edef: [80, 120], str: 5, resF: 75, dr: 5 }),
    U('the_ward', 'Оберег', 'gothic_shield', 34, 26, { edef: [40, 60], resAll: [30, 50], str: 10, mdr: 2 }),
    U('hand_of_broc', 'Рука Брока', 'leather_gloves', 7, 5, { edef: [10, 20], def: 10, ll: 3, ml: 3, mana: 20, resP: 10 }),
    U('bloodfist', 'Кровавый кулак', 'heavy_gloves', 12, 9, { edef: [10, 20], def: 10, ias: 10, fhr: 30, mindmg: 5, life: 40 }),
    U('chance_guards', 'Перчатки удачи', 'chain_gloves', 19, 15, { edef: [20, 30], def: 15, ar: 25, gf: 200, mf: [25, 40], lr: 2 }),
    U('magefist', 'Кулак мага', 'light_gauntlets', 31, 23, { 'tree:sorceress:0': 1, fcr: 20, manaRegen: 25, fireDmg: [1, 6], edef: [20, 30] }),
    U('frostburn', 'Ожог мороза', 'gauntlets', 38, 29, { edef: [10, 20], def: 30, manaPct: 40, coldDmg: [1, 6] }),
    U('hotspur', 'Горячая шпора', 'boots', 7, 5, { edef: [10, 20], def: 6, resF: 45, fireDmg: [3, 6], life: 15 }),
    U('gorefoot', 'Кровавая стопа', 'heavy_boots', 12, 9, { edef: [20, 30], frw: 20, ml: 2, thorns: 12, 'sk:leap_attack': 2 }),
    U('treads_cthon', 'Поступь Ктона', 'chain_boots', 20, 15, { edef: [30, 40], frw: 30, life: 10, hfd: 1 }),
    U('goblin_toe', 'Гоблинский палец', 'light_plated_boots', 30, 22, { edef: [50, 60], cb: 25, lr: 1, dr: 1, mdr: 1 }),
    U('tearhaunch', 'Рвущий окорок', 'greaves', 37, 29, { edef: [60, 80], str: 5, dex: 5, frw: 20, resAll: 10, 'sk:vigor': 2 }),
    U('war_travelers', 'Боевые странники', 'war_boots', 50, 42, { edef: [150, 190], frw: 25, str: 10, vit: 10, mf: [30, 50], mindmg: 15, maxdmg: 25 }),
    U('lenymo', 'Ленимо', 'sash', 10, 7, { lr: 1, resAll: 5, mana: 15, manaRegen: 30 }),
    U('snakecord', 'Змеиный шнур', 'light_belt', 17, 12, { edef: [20, 30], def: 10, resP: 30, regen: 5 }),
    U('nightsmoke', 'Ночной дым', 'belt', 27, 20, { edef: [30, 50], def: 15, dr: 2, resAll: 10, mana: 20 }),
    U('goldwrap', 'Золотая обёртка', 'heavy_belt', 36, 27, { edef: [40, 60], def: 25, ias: 10, gf: [50, 80], mf: 30, lr: 2 }),
    U('bladebuckle', 'Пряжка-клинок', 'plated_belt', 39, 29, { edef: [80, 100], def: 30, str: 5, dex: 10, fhr: 30, thorns: 8, dr: 3 }),
    U('nagelring', 'Нагельринг', 'ring', 10, 7, { ar: [50, 75], mf: [15, 30], thorns: 3, mdr: 3 }),
    U('manald_heal', 'Исцеление Маналда', 'ring', 20, 15, { ml: [4, 7], regen: [5, 8], manaRegen: 20, life: 20 }),
    U('stone_of_jordan', 'Камень Джордана', 'ring', 39, 29, { allSkills: 1, mana: 20, manaPct: 25, lightDmg: [1, 12] }),
    U('dwarf_star', 'Звезда гномов', 'ring', 53, 45, { life: 40, gf: 100, mdr: [12, 15], resF: 15 }),
    U('raven_frost', 'Ледяной ворон', 'ring', 53, 45, { ar: [150, 250], dex: [15, 20], mana: 40, cbf: 1, coldDmg: [15, 45] }),
    U('bul_kathos_band', 'Обручальное кольцо Бул-Катоса', 'ring', 66, 58, { allSkills: 1, ll: [3, 5], life: 50, stamina: 50 }),
    U('nokozan_relic', 'Реликвия Нокозана', 'amulet', 14, 10, { fhr: 20, resF: 50, fireDmg: [3, 6], lr: 3 }),
    U('eye_of_etlich', 'Глаз Этлиха', 'amulet', 20, 15, { allSkills: 1, lr: [1, 5], ll: [3, 7], coldDmg: [1, 2] }),
    U('mahim_oak', 'Реликвия Махим-Оука', 'amulet', 34, 25, { str: 10, dex: 10, vit: 10, ene: 10, resAll: 10, def: 10, arPct: 10 }),
    U('saracens_chance', 'Шанс Сарацина', 'amulet', 55, 47, { str: 12, dex: 12, vit: 12, ene: 12, resAll: [15, 25] }),
    U('cats_eye', 'Кошачий глаз', 'amulet', 58, 50, { frw: 30, ias: 20, dex: 25, def: 100 }),
    U('maras_kaleidoscope', 'Калейдоскоп Мары', 'amulet', 75, 67, { allSkills: 2, str: 5, dex: 5, vit: 5, ene: 5, resAll: [20, 30] }),
    U('gheeds_fortune', 'Удача Гида', 'grand_charm', 70, 62, { gf: [80, 160], mf: [20, 40], vendor: [10, 15] })
  ];

  const SETS = [
    {
      id: 'sigon', name: 'Полная сталь Сигона', bonus: { 2: { ll: 10 }, 3: { def: 100 }, 4: { mana: 20 }, 5: { thorns: 12 }, 6: { resAll: 12, dr: 7, ar: 100 } },
      items: [
        { id: 'sigon_visor', name: 'Забрало Сигона', base: 'great_helm', lvl: 9, req: 6, stats: { def: 25, mana: 30, ar: 35 }, part: { 2: { def: 40 } } },
        { id: 'sigon_shelter', name: 'Укрытие Сигона', base: 'gothic_plate', lvl: 9, req: 6, stats: { edef: 25, resL: 30 }, part: { 2: { thorns: 20 } } },
        { id: 'sigon_gage', name: 'Рукавицы Сигона', base: 'gauntlets', lvl: 9, req: 6, stats: { str: 10, ar: 20 }, part: { 2: { ias: 30 } } },
        { id: 'sigon_sabot', name: 'Сабатоны Сигона', base: 'greaves', lvl: 9, req: 6, stats: { frw: 20, resC: 40 }, part: { 2: { ar: 50 } } },
        { id: 'sigon_wrap', name: 'Пояс Сигона', base: 'plated_belt', lvl: 9, req: 6, stats: { life: 20, resF: 20 }, part: { 2: { def: 30 } } },
        { id: 'sigon_guard', name: 'Страж Сигона', base: 'tower_shield', lvl: 9, req: 6, stats: { allSkills: 1, block: 20 }, part: {} }
      ]
    },
    {
      id: 'arctic', name: 'Арктическое снаряжение', bonus: { 2: { str: 5 }, 3: { coldDmg: [6, 14] }, 4: { life: 50, cbf: 1, ar: 40 } },
      items: [
        { id: 'arctic_horn', name: 'Арктический рог', base: 'long_war_bow', lvl: 4, req: 3, stats: { ed: 50, ar: 50 }, part: { 2: { ll: 5 } } },
        { id: 'arctic_furs', name: 'Арктические меха', base: 'quilted_armor', lvl: 4, req: 2, stats: { edef: [275, 325], resAll: 10 }, part: { 2: { def: 40 } } },
        { id: 'arctic_binding', name: 'Арктическая перевязь', base: 'light_belt', lvl: 4, req: 2, stats: { def: 30, resC: 40 }, part: { 2: { def: 40 } } },
        { id: 'arctic_mitts', name: 'Арктические рукавицы', base: 'light_gauntlets', lvl: 4, req: 2, stats: { life: 20, ias: 10 }, part: { 2: { dex: 10, ar: 50 } } }
      ]
    },
    {
      id: 'berserker', name: 'Одеяния берсерка', bonus: { 2: { def: 75 }, 3: { allSkills: 1, ll: 5, resP: 50 } },
      items: [
        { id: 'berserker_head', name: 'Шлем берсерка', base: 'helm', lvl: 5, req: 3, stats: { def: 15, resP: 25 }, part: { 2: { ar: 50 } } },
        { id: 'berserker_hauberk', name: 'Хауберк берсерка', base: 'splint_mail', lvl: 5, req: 3, stats: { 'cls:barbarian': 1, mdr: 2 }, part: { 2: { def: 60 } } },
        { id: 'berserker_hatchet', name: 'Секира берсерка', base: 'double_axe', lvl: 5, req: 3, stats: { ias: 30, ml: 5, arPct: 60 }, part: { 2: { ed: 50 } } }
      ]
    },
    {
      id: 'death', name: 'Облачение смерти', bonus: { 2: { mindmg: 8, ll: 8 }, 3: { ar: 40, resAll: 25, cbf: 1 } },
      items: [
        { id: 'death_hand', name: 'Рука смерти', base: 'leather_gloves', lvl: 8, req: 6, stats: { resP: 50, ias: 30 }, part: { 2: { cb: 15 } } },
        { id: 'death_guard', name: 'Стража смерти', base: 'sash', lvl: 8, req: 6, stats: { cbf: 1, resAll: 15 }, part: { 2: { lr: 1 } } },
        { id: 'death_touch', name: 'Касание смерти', base: 'war_sword', lvl: 8, req: 6, stats: { ed: 25, ll: 4, coldDmg: [25, 75] }, part: { 2: { ar: 50 } } }
      ]
    },
    {
      id: 'angelic', name: 'Ангельское облачение', bonus: { 2: { regen: 6 }, 3: { resAll: 25, mf: 40 }, 4: { ar: 100, life: 50 } },
      items: [
        { id: 'angelic_sickle', name: 'Ангельский серп', base: 'sabre', lvl: 17, req: 12, stats: { ed: 75, undead: 250, ar: 50 }, part: { 2: { ias: 30 } } },
        { id: 'angelic_mantle', name: 'Ангельская мантия', base: 'ring_mail', lvl: 17, req: 12, stats: { edef: [40, 50], dr: 3, resF: 50 }, part: { 2: { edef: 50 } } },
        { id: 'angelic_halo', name: 'Ангельский нимб', base: 'ring', lvl: 17, req: 12, stats: { life: 20, regen: 6, ar: 75 }, part: { 2: { ar: 100 } } },
        { id: 'angelic_wings', name: 'Ангельские крылья', base: 'amulet', lvl: 17, req: 12, stats: { dr: 20, lr: 3, thorns: 20 }, part: { 2: { resAll: 25 } } }
      ]
    }
  ];
  const SET_ITEMS = {};
  for (const s of SETS) for (const it of s.items) { it.set = s.id; SET_ITEMS[it.id] = it; }
  const UNIQUE_MAP = {};
  for (const u of UNIQUES) UNIQUE_MAP[u.id] = u;

  const RARE_A = {
    weapon: ['Коготь', 'Клык', 'Жало', 'Укус', 'Разрез', 'Шип', 'Язык', 'Плеть', 'Удар', 'Гнев'],
    armor: ['Панцирь', 'Покров', 'Оплот', 'Кожа', 'Щит', 'Бастион', 'Покрывало', 'Облик'],
    helm: ['Венец', 'Взор', 'Лик', 'Шлем', 'Гребень', 'Разум'],
    gloves: ['Хватка', 'Длань', 'Касание', 'Кулак', 'Рука'],
    boots: ['Поступь', 'Шаг', 'Путь', 'Бег', 'След'],
    belt: ['Узы', 'Опора', 'Застёжка', 'Обхват', 'Петля'],
    ring: ['Виток', 'Круг', 'Узел', 'Обод', 'Печать'],
    amulet: ['Талисман', 'Око', 'Знак', 'Оберег', 'Медальон'],
    charm: ['Камень', 'Знак', 'Амулет']
  };
  const RARE_B = ['Бури', 'Тьмы', 'Змея', 'Крови', 'Смерти', 'Ворона', 'Черепа', 'Демона', 'Пламени', 'Скорби', 'Звезды', 'Бездны', 'Гибели', 'Рока', 'Мороза', 'Грома', 'Зверя', 'Орла', 'Волка', 'Чумы', 'Тени', 'Луны', 'Солнца', 'Бога', 'Духа', 'Призрака', 'Ярости'];

  const QUALITY_COLOR = { normal: D.COL.white, superior: D.COL.white, socketed: D.COL.gray, magic: D.COL.blue, rare: D.COL.yellow, set: D.COL.green, unique: D.COL.gold, runeword: D.COL.gold, crafted: D.COL.orange };

  Object.assign(D, {
    BASES, BASE_LIST, ATK, MELEE, RANGED, ARMOR, AFFIXES, UNIQUES, UNIQUE_MAP, SETS, SET_ITEMS, GEMS, GEM_TYPES, RUNES, RUNE_IDS, RUNEWORDS,
    RARE_A, RARE_B, QUALITY_COLOR, adjForms: A4
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
