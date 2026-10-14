(function (M) {
  'use strict';
  const BLOCKS = [];
  const BY_KEY = {};
  const ITEMS = [];
  const ITEM_BY_KEY = {};

  function block(id, key, name, en, o) {
    const b = Object.assign({
      id, key, name, en, tex: key, model: 'cube', opaque: true, solid: true, hard: 1, tool: null, tier: -1, drop: null, light: 0, opacity: 15,
      replaceable: false, randomTick: false, stack: 64, sound: 'stone', selectable: true, cutout: false, liquid: false, climb: false, faces: false
    }, o || {});
    if (!b.opaque && b.opacity === 15) b.opacity = 0;
    BLOCKS[id] = b; BY_KEY[key] = b; ITEMS[id] = b; ITEM_BY_KEY[key] = b;
    return b;
  }
  function item(id, key, name, en, o) {
    const it = Object.assign({ id, key, name, en, tex: key, stack: 64, isItem: true }, o || {});
    ITEMS[id] = it; ITEM_BY_KEY[key] = it;
    return it;
  }

  block(0, 'air', 'Воздух', 'Air', { opaque: false, solid: false, replaceable: true, selectable: false, opacity: 0 });
  block(1, 'stone', 'Камень', 'Stone', { hard: 1.5, tool: 'pickaxe', tier: 0, drop: 'cobblestone' });
  block(2, 'grass', 'Дёрн', 'Grass', { tex: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }, hard: 0.6, tool: 'shovel', drop: 'dirt', randomTick: true, sound: 'grass' });
  block(3, 'dirt', 'Земля', 'Dirt', { hard: 0.5, tool: 'shovel', sound: 'gravel' });
  block(4, 'cobblestone', 'Булыжник', 'Cobblestone', { hard: 2, tool: 'pickaxe', tier: 0 });
  block(5, 'planks', 'Доски', 'Planks', { hard: 2, tool: 'axe', sound: 'wood' });
  block(6, 'sapling', 'Саженец', 'Sapling', { model: 'cross', opaque: false, solid: false, hard: 0, randomTick: true, sound: 'grass', cutout: true });
  block(7, 'bedrock', 'Коренная порода', 'Bedrock', { hard: -1 });
  block(8, 'water', 'Вода', 'Water', { model: 'liquid', opaque: false, solid: false, hard: 100, replaceable: true, selectable: false, opacity: 2, liquid: true, drop: 'none', tick: 5 });
  block(9, 'lava', 'Лава', 'Lava', { model: 'liquid', opaque: false, solid: false, hard: 100, replaceable: true, selectable: false, light: 15, opacity: 0, liquid: true, drop: 'none', tick: 30 });
  block(10, 'sand', 'Песок', 'Sand', { hard: 0.5, tool: 'shovel', sound: 'sand', falls: true });
  block(11, 'gravel', 'Гравий', 'Gravel', { hard: 0.6, tool: 'shovel', sound: 'gravel', falls: true, drop: r => (r() < 0.1 ? 'flint' : 'gravel') });
  block(12, 'gold_ore', 'Золотая руда', 'Gold ore', { hard: 3, tool: 'pickaxe', tier: 2 });
  block(13, 'iron_ore', 'Железная руда', 'Iron ore', { hard: 3, tool: 'pickaxe', tier: 1 });
  block(14, 'coal_ore', 'Угольная руда', 'Coal ore', { hard: 3, tool: 'pickaxe', tier: 0, drop: 'coal' });
  block(15, 'log', 'Бревно', 'Log', { tex: { top: 'log_top', bottom: 'log_top', side: 'log' }, hard: 2, tool: 'axe', sound: 'wood' });
  block(16, 'leaves', 'Листва', 'Leaves', { opaque: false, opacity: 1, hard: 0.2, cutout: true, sound: 'grass', drop: r => (r() < 0.05 ? 'sapling' : r() < 0.005 ? 'apple' : 'none') });
  block(17, 'glass', 'Стекло', 'Glass', { opaque: false, hard: 0.3, cutout: true, sound: 'glass', drop: 'none' });
  block(18, 'wool', 'Шерсть', 'Wool', { hard: 0.8, sound: 'cloth' });
  block(19, 'flower_yellow', 'Одуванчик', 'Dandelion', { model: 'cross', opaque: false, solid: false, hard: 0, replaceable: true, sound: 'grass', cutout: true });
  block(20, 'flower_red', 'Роза', 'Rose', { model: 'cross', opaque: false, solid: false, hard: 0, replaceable: true, sound: 'grass', cutout: true });
  block(21, 'mushroom_brown', 'Гриб', 'Brown mushroom', { model: 'cross', opaque: false, solid: false, hard: 0, replaceable: true, sound: 'grass', cutout: true, light: 1 });
  block(22, 'mushroom_red', 'Мухомор', 'Red mushroom', { model: 'cross', opaque: false, solid: false, hard: 0, replaceable: true, sound: 'grass', cutout: true });
  block(23, 'gold_block', 'Золотой блок', 'Gold block', { hard: 3, tool: 'pickaxe', tier: 2, sound: 'metal' });
  block(24, 'iron_block', 'Железный блок', 'Iron block', { hard: 5, tool: 'pickaxe', tier: 1, sound: 'metal' });
  block(25, 'diamond_block', 'Алмазный блок', 'Diamond block', { hard: 5, tool: 'pickaxe', tier: 2, sound: 'metal' });
  block(26, 'brick', 'Кирпич', 'Bricks', { hard: 2, tool: 'pickaxe', tier: 0 });
  block(27, 'tnt', 'Динамит', 'TNT', { tex: { top: 'tnt_top', bottom: 'tnt_bottom', side: 'tnt' }, hard: 0, sound: 'grass' });
  block(28, 'mossy_cobblestone', 'Замшелый булыжник', 'Mossy cobblestone', { hard: 2, tool: 'pickaxe', tier: 0 });
  block(29, 'obsidian', 'Обсидиан', 'Obsidian', { hard: 50, tool: 'pickaxe', tier: 3 });
  block(30, 'torch', 'Факел', 'Torch', { model: 'torch', opaque: false, solid: false, hard: 0, light: 14, sound: 'wood', cutout: true, attach: true });
  block(31, 'chest', 'Сундук', 'Chest', { tex: { top: 'chest_top', bottom: 'chest_top', side: 'chest_side', front: 'chest_front' }, hard: 2.5, tool: 'axe', sound: 'wood', container: 'chest', faces: true });
  block(32, 'diamond_ore', 'Алмазная руда', 'Diamond ore', { hard: 3, tool: 'pickaxe', tier: 2, drop: 'diamond' });
  block(33, 'crafting_table', 'Верстак', 'Crafting table', { tex: { top: 'table_top', bottom: 'planks', side: 'table_side', front: 'table_front' }, hard: 2.5, tool: 'axe', sound: 'wood', container: 'table', faces: true });
  block(34, 'furnace', 'Печь', 'Furnace', { tex: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_front' }, hard: 3.5, tool: 'pickaxe', tier: 0, container: 'furnace', faces: true });
  block(35, 'furnace_lit', 'Печь', 'Furnace', { tex: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_lit' }, hard: 3.5, tool: 'pickaxe', tier: 0, drop: 'furnace', light: 13, container: 'furnace', faces: true });
  block(36, 'ladder', 'Лестница', 'Ladder', { model: 'ladder', opaque: false, solid: false, hard: 0.4, tool: 'axe', sound: 'wood', cutout: true, climb: true, attach: true, faces: true });
  block(37, 'snow_grass', 'Снежный дёрн', 'Snowy grass', { tex: { top: 'snow', bottom: 'dirt', side: 'snow_side' }, hard: 0.6, tool: 'shovel', drop: 'dirt', sound: 'snow' });
  block(38, 'ice', 'Лёд', 'Ice', { opaque: false, opacity: 2, hard: 0.5, tool: 'pickaxe', drop: 'none', sound: 'glass', cutout: true, slippery: true });
  block(39, 'cactus', 'Кактус', 'Cactus', { tex: { top: 'cactus_top', bottom: 'cactus_top', side: 'cactus' }, model: 'cactus', opaque: false, hard: 0.4, sound: 'cloth', cutout: true, hurts: true });
  block(40, 'clay', 'Глина', 'Clay', { hard: 0.6, tool: 'shovel', sound: 'gravel', drop: r => ({ id: 'clay_ball', count: 4 }) });
  block(41, 'bed', 'Кровать', 'Bed', { tex: { top: 'bed_top', bottom: 'planks', side: 'bed_side' }, model: 'half', opaque: false, hard: 0.2, sound: 'wood', container: 'bed' });
  block(42, 'spawner', 'Генератор монстров', 'Monster spawner', { opaque: false, hard: 5, tool: 'pickaxe', tier: 0, drop: 'none', cutout: true, sound: 'metal' });
  block(43, 'tall_grass', 'Трава', 'Tall grass', { model: 'cross', opaque: false, solid: false, hard: 0, replaceable: true, sound: 'grass', cutout: true, drop: 'none' });
  block(44, 'sandstone', 'Песчаник', 'Sandstone', { tex: { top: 'sandstone_top', bottom: 'sandstone_top', side: 'sandstone' }, hard: 0.8, tool: 'pickaxe', tier: 0 });
  block(45, 'snow', 'Снег', 'Snow', { hard: 0.2, tool: 'shovel', sound: 'snow', drop: 'none' });
  block(46, 'fence', 'Забор', 'Fence', { tex: 'planks', model: 'fence', opaque: false, hard: 2, tool: 'axe', sound: 'wood', cutout: true, tall: true });
  block(47, 'glowstone', 'Светокамень', 'Glowstone', { hard: 0.3, light: 15, sound: 'glass' });

  item(256, 'stick', 'Палка', 'Stick');
  item(257, 'coal', 'Уголь', 'Coal', { fuel: 80 });
  item(258, 'iron_ingot', 'Железный слиток', 'Iron ingot');
  item(259, 'gold_ingot', 'Золотой слиток', 'Gold ingot');
  item(260, 'diamond', 'Алмаз', 'Diamond');
  item(261, 'apple', 'Яблоко', 'Apple', { food: 4 });
  item(262, 'porkchop', 'Сырая свинина', 'Raw porkchop', { food: 3 });
  item(263, 'cooked_porkchop', 'Жареная свинина', 'Cooked porkchop', { food: 8 });
  item(264, 'beef', 'Сырая говядина', 'Raw beef', { food: 3 });
  item(265, 'cooked_beef', 'Стейк', 'Steak', { food: 8 });
  item(266, 'chicken', 'Сырая курятина', 'Raw chicken', { food: 2 });
  item(267, 'cooked_chicken', 'Жареная курица', 'Cooked chicken', { food: 6 });
  item(268, 'string', 'Нить', 'String');
  item(269, 'feather', 'Перо', 'Feather');
  item(270, 'leather', 'Кожа', 'Leather');
  item(271, 'bone', 'Кость', 'Bone');
  item(272, 'gunpowder', 'Порох', 'Gunpowder');
  item(273, 'arrow', 'Стрела', 'Arrow');
  item(274, 'bow', 'Лук', 'Bow', { stack: 1, durability: 384, fuel: 15 });
  item(275, 'bucket', 'Ведро', 'Bucket', { stack: 1 });
  item(276, 'water_bucket', 'Ведро воды', 'Water bucket', { stack: 1, places: 'water' });
  item(277, 'lava_bucket', 'Ведро лавы', 'Lava bucket', { stack: 1, places: 'lava', fuel: 1000 });
  item(278, 'flint', 'Кремень', 'Flint');
  item(279, 'brick_item', 'Кирпич', 'Brick', { tex: 'brick_item' });
  item(280, 'clay_ball', 'Глина', 'Clay ball');
  item(281, 'mushroom_stew', 'Грибной суп', 'Mushroom stew', { food: 10, stack: 1, returns: 'bowl' });
  item(282, 'bowl', 'Миска', 'Bowl');
  item(283, 'flint_and_steel', 'Огниво', 'Flint and steel', { stack: 1, durability: 64 });
  item(284, 'wheat', 'Пшеница', 'Wheat');
  item(285, 'bread', 'Хлеб', 'Bread', { food: 5 });
  item(286, 'egg', 'Яйцо', 'Egg', { stack: 16 });
  item(287, 'paper', 'Бумага', 'Paper');
  item(288, 'book', 'Книга', 'Book');

  const TOOL_MATS = [
    { key: 'wood', name: 'Деревянн', en: 'Wooden', tier: 0, speed: 2, dur: 59, dmg: 4, fuel: 10 },
    { key: 'stone', name: 'Каменн', en: 'Stone', tier: 1, speed: 4, dur: 131, dmg: 5 },
    { key: 'iron', name: 'Железн', en: 'Iron', tier: 2, speed: 6, dur: 250, dmg: 6 },
    { key: 'gold', name: 'Золот', en: 'Golden', tier: 0, speed: 12, dur: 32, dmg: 4 },
    { key: 'diamond', name: 'Алмазн', en: 'Diamond', tier: 3, speed: 8, dur: 1561, dmg: 7 }
  ];
  const TOOL_KINDS = [
    { key: 'pickaxe', name: 'ая кирка', en: ' pickaxe', dmgOff: -2 },
    { key: 'axe', name: 'ый топор', en: ' axe', dmgOff: -1 },
    { key: 'shovel', name: 'ая лопата', en: ' shovel', dmgOff: -3 },
    { key: 'sword', name: 'ый меч', en: ' sword', dmgOff: 0 }
  ];
  TOOL_MATS.forEach((m, mi) => TOOL_KINDS.forEach((k, ki) => {
    item(300 + mi * 4 + ki, m.key + '_' + k.key, m.name + k.name, m.en + k.en, {
      stack: 1, tool: k.key, tier: m.tier, speed: m.speed, durability: m.dur, damage: Math.max(2, m.dmg + k.dmgOff), material: m.key, fuel: m.fuel || 0
    });
  }));
  const ARMOR_MATS = [
    { key: 'leather', name: 'Кожан', en: 'Leather', base: 5, pts: [1, 3, 2, 1] },
    { key: 'iron', name: 'Железн', en: 'Iron', base: 15, pts: [2, 6, 5, 2] },
    { key: 'gold', name: 'Золот', en: 'Golden', base: 7, pts: [2, 5, 3, 1] },
    { key: 'diamond', name: 'Алмазн', en: 'Diamond', base: 33, pts: [3, 8, 6, 3] }
  ];
  const ARMOR_SLOTS = [
    { key: 'helmet', name: 'ый шлем', en: ' helmet', mul: 11 },
    { key: 'chestplate', name: 'ая кираса', en: ' chestplate', mul: 16 },
    { key: 'leggings', name: 'ые поножи', en: ' leggings', mul: 15 },
    { key: 'boots', name: 'ые ботинки', en: ' boots', mul: 13 }
  ];
  ARMOR_MATS.forEach((m, mi) => ARMOR_SLOTS.forEach((s, si) => {
    item(340 + mi * 4 + si, m.key + '_' + s.key, m.name + s.name, m.en + s.en, { stack: 1, armor: si, protection: m.pts[si], durability: m.base * s.mul, material: m.key });
  }));

  for (const b of BLOCKS) {
    if (!b) continue;
    if (typeof b.drop === 'string') { const k = b.drop; b.dropFn = k === 'none' ? () => null : () => ({ id: ITEM_BY_KEY[k].id, count: 1 }); }
    else if (typeof b.drop === 'function') { const f = b.drop; b.dropFn = r => { const d = f(r); if (!d || d === 'none') return null; if (typeof d === 'string') return { id: ITEM_BY_KEY[d].id, count: 1 }; return { id: ITEM_BY_KEY[d.id].id, count: d.count }; }; }
    else b.dropFn = () => ({ id: b.id, count: 1 });
  }

  const id = k => { const it = ITEM_BY_KEY[k]; if (!it) throw new Error('unknown item ' + k); return it.id; };

  const RECIPES = [];
  function shaped(result, count, rows, keys) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const grid = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = rows[y][x] || ' '; grid.push(c === ' ' ? 0 : id(keys[c])); }
    RECIPES.push({ result: id(result), count, w, h, grid, shaped: true });
  }
  function shapeless(result, count, list) { RECIPES.push({ result: id(result), count, items: list.map(id).sort((a, b) => a - b), shaped: false }); }

  shapeless('planks', 4, ['log']);
  shaped('stick', 4, ['P', 'P'], { P: 'planks' });
  shaped('crafting_table', 1, ['PP', 'PP'], { P: 'planks' });
  shaped('torch', 4, ['C', 'S'], { C: 'coal', S: 'stick' });
  shaped('furnace', 1, ['CCC', 'C C', 'CCC'], { C: 'cobblestone' });
  shaped('chest', 1, ['PPP', 'P P', 'PPP'], { P: 'planks' });
  shaped('ladder', 3, ['S S', 'SSS', 'S S'], { S: 'stick' });
  shaped('fence', 2, ['SSS', 'SSS'], { S: 'stick' });
  shaped('bed', 1, ['WWW', 'PPP'], { W: 'wool', P: 'planks' });
  shaped('bow', 1, [' ST', 'S T', ' ST'], { S: 'stick', T: 'string' });
  shaped('arrow', 4, ['F', 'S', 'E'], { F: 'flint', S: 'stick', E: 'feather' });
  shaped('bucket', 1, ['I I', ' I '], { I: 'iron_ingot' });
  shaped('brick', 1, ['BB', 'BB'], { B: 'brick_item' });
  shaped('sandstone', 1, ['SS', 'SS'], { S: 'sand' });
  shaped('snow', 1, ['SS', 'SS'], { S: 'snow' });
  shaped('bowl', 4, ['P P', ' P '], { P: 'planks' });
  shaped('tnt', 1, ['GSG', 'SGS', 'GSG'], { G: 'gunpowder', S: 'sand' });
  shaped('gold_block', 1, ['GGG', 'GGG', 'GGG'], { G: 'gold_ingot' });
  shaped('iron_block', 1, ['III', 'III', 'III'], { I: 'iron_ingot' });
  shaped('diamond_block', 1, ['DDD', 'DDD', 'DDD'], { D: 'diamond' });
  shaped('bread', 1, ['WWW'], { W: 'wheat' });
  shaped('paper', 3, ['WWW'], { W: 'wheat' });
  shaped('book', 1, ['P', 'P', 'P'], { P: 'paper' });
  shaped('glowstone', 1, ['GG', 'GG'], { G: 'gold_ingot' });
  shapeless('gold_ingot', 9, ['gold_block']);
  shapeless('iron_ingot', 9, ['iron_block']);
  shapeless('diamond', 9, ['diamond_block']);
  shapeless('mushroom_stew', 1, ['mushroom_brown', 'mushroom_red', 'bowl']);
  shapeless('flint_and_steel', 1, ['iron_ingot', 'flint']);
  shapeless('wool', 1, ['string', 'string', 'string', 'string']);
  const matItem = { wood: 'planks', stone: 'cobblestone', iron: 'iron_ingot', gold: 'gold_ingot', diamond: 'diamond' };
  for (const m of TOOL_MATS) {
    const K = { M: matItem[m.key], S: 'stick' };
    shaped(m.key + '_pickaxe', 1, ['MMM', ' S ', ' S '], K);
    shaped(m.key + '_axe', 1, ['MM', 'MS', ' S'], K);
    shaped(m.key + '_axe', 1, ['MM', 'SM', 'S '], K);
    shaped(m.key + '_shovel', 1, ['M', 'S', 'S'], K);
    shaped(m.key + '_sword', 1, ['M', 'M', 'S'], K);
  }
  const armorItem = { leather: 'leather', iron: 'iron_ingot', gold: 'gold_ingot', diamond: 'diamond' };
  for (const m of ARMOR_MATS) {
    const K = { M: armorItem[m.key] };
    shaped(m.key + '_helmet', 1, ['MMM', 'M M'], K);
    shaped(m.key + '_chestplate', 1, ['M M', 'MMM', 'MMM'], K);
    shaped(m.key + '_leggings', 1, ['MMM', 'M M', 'M M'], K);
    shaped(m.key + '_boots', 1, ['M M', 'M M'], K);
  }

  const SMELT = {};
  const smelt = (a, b) => { SMELT[id(a)] = id(b); };
  smelt('iron_ore', 'iron_ingot'); smelt('gold_ore', 'gold_ingot'); smelt('sand', 'glass'); smelt('cobblestone', 'stone'); smelt('log', 'coal');
  smelt('porkchop', 'cooked_porkchop'); smelt('beef', 'cooked_beef'); smelt('chicken', 'cooked_chicken'); smelt('clay_ball', 'brick_item'); smelt('cactus', 'wool');
  const FUEL = {};
  for (const it of ITEMS) if (it && it.fuel) FUEL[it.id] = it.fuel;
  for (const k of ['planks', 'log', 'crafting_table', 'chest', 'ladder', 'fence', 'bookshelf']) if (ITEM_BY_KEY[k]) FUEL[id(k)] = 15;
  FUEL[id('stick')] = 5; FUEL[id('sapling')] = 5; FUEL[id('bowl')] = 5;

  function normalizeGrid(cells, size) {
    let minX = size, minY = size, maxX = -1, maxY = -1;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (cells[y * size + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    if (maxX < 0) return null;
    const w = maxX - minX + 1, h = maxY - minY + 1, grid = [];
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) grid.push(cells[y * size + x]);
    return { w, h, grid };
  }
  function matchRecipe(stacks, size) {
    const cells = stacks.map(s => (s ? s.id : 0));
    const norm = normalizeGrid(cells, size);
    if (!norm) return null;
    const list = cells.filter(Boolean).sort((a, b) => a - b);
    for (const r of RECIPES) {
      if (r.shaped) {
        if (r.w !== norm.w || r.h !== norm.h) continue;
        let okk = true;
        for (let i = 0; i < r.grid.length; i++) if (r.grid[i] !== norm.grid[i]) { okk = false; break; }
        if (okk) return r;
      } else {
        if (r.items.length !== list.length) continue;
        let okk = true;
        for (let i = 0; i < list.length; i++) if (r.items[i] !== list[i]) { okk = false; break; }
        if (okk) return r;
      }
    }
    return null;
  }

  const TIER_NAMES = ['wood', 'stone', 'iron', 'diamond'];
  const itemInfo = i => ITEMS[i] || null;
  const isBlockItem = i => i > 0 && i < 256 && !!BLOCKS[i];

  Object.assign(M, { BLOCKS, BY_KEY, ITEMS, ITEM_BY_KEY, RECIPES, SMELT, FUEL, TOOL_MATS, TOOL_KINDS, ARMOR_MATS, ARMOR_SLOTS, TIER_NAMES, matchRecipe, itemInfo, isBlockItem, itemId: id });
})(globalThis.Mc98 = globalThis.Mc98 || {});
