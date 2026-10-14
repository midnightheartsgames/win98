(function (D) {
  'use strict';
  const T = (ru, en) => ({ ru, en });
  const SLOT_ORDER = ['weapon', 'head', 'back'];
  const RARITY = {
    common: { name: T('Обычный', 'Common'), color: '#b9ad94', weight: 55 },
    rare: { name: T('Редкий', 'Rare'), color: '#5b8fe0', weight: 30 },
    mythical: { name: T('Мифический', 'Mythical'), color: '#b36ae8', weight: 12 },
    legendary: { name: T('Легендарный', 'Legendary'), color: '#f2a93b', weight: 3 }
  };
  const RARITY_ORDER = ['common', 'rare', 'mythical', 'legendary'];
  const HERO_BIAS = 0.65;
  const DEFAULT_NAME = T('Стандартный облик', 'Default look');

  const SLOTS = {
    techies: { weapon: T('Снаряжение Спуна', 'Spoon\'s Gear'), head: T('Шапки', 'Hats'), back: T('Груз', 'Cargo') },
    enigma: { weapon: T('Руки', 'Hands'), head: T('Рога', 'Horns'), back: T('Аура', 'Aura') },
    sven: { weapon: T('Меч', 'Sword'), head: T('Шлем', 'Helm'), back: T('Плащ', 'Cape') },
    crystal_maiden: { weapon: T('Посох', 'Staff'), head: T('Капюшон', 'Hood'), back: T('Накидка', 'Cape') },
    sniper: { weapon: T('Ружьё', 'Rifle'), head: T('Шапка', 'Hat'), back: T('Рюкзак', 'Pack') },
    axe: { weapon: T('Топор', 'Axe'), head: T('Голова', 'Head'), back: T('Наплечники', 'Shoulders') },
    lina: { weapon: T('Руки', 'Hands'), head: T('Причёска', 'Hair'), back: T('Платье', 'Dress') },
    juggernaut: { weapon: T('Меч', 'Sword'), head: T('Маска', 'Mask'), back: T('Спина', 'Back') },
    pudge: { weapon: T('Крюк', 'Hook'), head: T('Голова', 'Head'), back: T('Спина', 'Back') },
    lion: { weapon: T('Посох', 'Staff'), head: T('Рога', 'Horns'), back: T('Плащ', 'Cloak') }
  };

  const LIST = [
    ['techies', 'weapon', 'dynamite', 'common', 'Связка динамита', 'Dynamite Bundle'],
    ['techies', 'weapon', 'wrench', 'rare', 'Гаечный ключ Сквии', 'Squee\'s Wrench'],
    ['techies', 'weapon', 'launcher', 'legendary', 'Ракетомёт «Большой бум»', 'Big Boom Launcher'],
    ['techies', 'head', 'miner', 'common', 'Шахтёрские каски', 'Miner Helmets'],
    ['techies', 'head', 'tophat', 'rare', 'Цилиндры подрывников', 'Demolition Top Hats'],
    ['techies', 'head', 'pirate', 'mythical', 'Пиратские треуголки', 'Pirate Tricorns'],
    ['techies', 'back', 'crates', 'common', 'Ящики со взрывчаткой', 'Explosive Crates'],
    ['techies', 'back', 'bigbomb', 'rare', 'Бомба-переросток', 'Oversized Bomb'],
    ['techies', 'back', 'cannon', 'mythical', 'Походная пушка', 'Field Cannon'],
    ['enigma', 'weapon', 'shards', 'common', 'Осколки пустоты', 'Void Shards'],
    ['enigma', 'weapon', 'claws', 'rare', 'Когти бездны', 'Abyssal Claws'],
    ['enigma', 'weapon', 'singularity', 'legendary', 'Сингулярность', 'Singularity'],
    ['enigma', 'head', 'crown', 'common', 'Кристальная корона', 'Crystal Crown'],
    ['enigma', 'head', 'split', 'rare', 'Расколотые рога', 'Split Horns'],
    ['enigma', 'head', 'halo', 'mythical', 'Нимб горизонта событий', 'Event Horizon Halo'],
    ['enigma', 'back', 'rocks', 'common', 'Парящие обломки', 'Floating Debris'],
    ['enigma', 'back', 'nebula', 'rare', 'Мантия туманности', 'Nebula Mantle'],
    ['enigma', 'back', 'rings', 'mythical', 'Орбиты', 'Orbital Rings'],
    ['sven', 'weapon', 'gilded', 'common', 'Позолоченный клинок', 'Gilded Blade'],
    ['sven', 'weapon', 'frost', 'rare', 'Клинок северной стужи', 'Blade of the North Frost'],
    ['sven', 'weapon', 'dragonbone', 'legendary', 'Меч из драконьей кости', 'Dragonbone Greatsword'],
    ['sven', 'head', 'winged', 'common', 'Крылатый шлем', 'Winged Helm'],
    ['sven', 'head', 'skull', 'rare', 'Шлем-череп', 'Skull Helm'],
    ['sven', 'head', 'crown', 'mythical', 'Корона изгоя', 'Rogue Crown'],
    ['sven', 'back', 'crimson', 'common', 'Багряный плащ', 'Crimson Cape'],
    ['sven', 'back', 'fur', 'rare', 'Меховая мантия', 'Fur Mantle'],
    ['sven', 'back', 'banner', 'mythical', 'Знамя рыцарей-изгоев', 'Rogue Knight Banner'],
    ['crystal_maiden', 'weapon', 'lantern', 'common', 'Посох с фонарём', 'Lantern Staff'],
    ['crystal_maiden', 'weapon', 'snowflake', 'rare', 'Скипетр снежинки', 'Snowflake Scepter'],
    ['crystal_maiden', 'weapon', 'glacier', 'legendary', 'Посох вечного ледника', 'Staff of the Eternal Glacier'],
    ['crystal_maiden', 'head', 'furhat', 'common', 'Меховая шапка', 'Fur Hat'],
    ['crystal_maiden', 'head', 'tiara', 'rare', 'Ледяная диадема', 'Ice Tiara'],
    ['crystal_maiden', 'head', 'cowl', 'mythical', 'Капюшон метели', 'Blizzard Cowl'],
    ['crystal_maiden', 'back', 'mantle', 'common', 'Снежная пелерина', 'Snow Mantle'],
    ['crystal_maiden', 'back', 'royal', 'rare', 'Королевская мантия', 'Royal Cape'],
    ['crystal_maiden', 'back', 'wings', 'mythical', 'Кристальные крылья', 'Crystal Wings'],
    ['sniper', 'weapon', 'blunderbuss', 'common', 'Мушкетон', 'Blunderbuss'],
    ['sniper', 'weapon', 'brass', 'rare', 'Латунная винтовка', 'Brass Longrifle'],
    ['sniper', 'weapon', 'dragon', 'legendary', 'Драконья пасть', 'Dragon\'s Maw'],
    ['sniper', 'head', 'aviator', 'common', 'Шлем авиатора', 'Aviator Cap'],
    ['sniper', 'head', 'horned', 'rare', 'Рогатый шлем', 'Horned Helm'],
    ['sniper', 'head', 'tricorn', 'mythical', 'Треуголка с пером', 'Plumed Tricorn'],
    ['sniper', 'back', 'keg', 'common', 'Бочонок эля', 'Ale Keg'],
    ['sniper', 'back', 'bedroll', 'rare', 'Походная скатка', 'Traveler\'s Bedroll'],
    ['sniper', 'back', 'flag', 'mythical', 'Флаг горного клана', 'Mountain Clan Flag'],
    ['axe', 'weapon', 'double', 'common', 'Двусторонняя секира', 'Double Bit Axe'],
    ['axe', 'weapon', 'bone', 'rare', 'Костяной топор', 'Bone Axe'],
    ['axe', 'weapon', 'inferno', 'legendary', 'Топор преисподней', 'Inferno Axe'],
    ['axe', 'head', 'horned', 'common', 'Рогатый шлем', 'Horned Helm'],
    ['axe', 'head', 'warcrown', 'rare', 'Боевая корона', 'War Crown'],
    ['axe', 'head', 'mask', 'mythical', 'Маска красного тумана', 'Red Mist Mask'],
    ['axe', 'back', 'spiked', 'common', 'Шипастые наплечники', 'Spiked Pauldrons'],
    ['axe', 'back', 'fur', 'rare', 'Шкура вожака', 'Warlord Pelt'],
    ['axe', 'back', 'banners', 'mythical', 'Боевые знамёна', 'War Banners'],
    ['lina', 'weapon', 'fans', 'common', 'Огненные веера', 'Flame Fans'],
    ['lina', 'weapon', 'sun', 'rare', 'Солнечный диск', 'Sun Disc'],
    ['lina', 'weapon', 'dragon', 'legendary', 'Пламенный дракон', 'Flame Dragon'],
    ['lina', 'head', 'braid', 'common', 'Огненная коса', 'Fire Braid'],
    ['lina', 'head', 'crown', 'rare', 'Рубиновый венец', 'Ruby Circlet'],
    ['lina', 'head', 'phoenix', 'mythical', 'Гребень феникса', 'Phoenix Crest'],
    ['lina', 'back', 'sash', 'common', 'Золотой кушак', 'Golden Sash'],
    ['lina', 'back', 'cloak', 'rare', 'Плащ пепла', 'Ashen Cloak'],
    ['lina', 'back', 'wings', 'mythical', 'Крылья пламени', 'Wings of Flame'],
    ['juggernaut', 'weapon', 'jade', 'common', 'Нефритовый клинок', 'Jade Blade'],
    ['juggernaut', 'weapon', 'dragon', 'rare', 'Меч дракона', 'Dragon Sword'],
    ['juggernaut', 'weapon', 'sunfire', 'legendary', 'Клинок солнечного огня', 'Sunfire Blade'],
    ['juggernaut', 'head', 'oni', 'common', 'Маска они', 'Oni Mask'],
    ['juggernaut', 'head', 'gold', 'rare', 'Золотая маска', 'Golden Mask'],
    ['juggernaut', 'head', 'bamboo', 'mythical', 'Соломенная шляпа', 'Straw Hat'],
    ['juggernaut', 'back', 'banner', 'common', 'Походный стяг', 'Travel Banner'],
    ['juggernaut', 'back', 'scabbards', 'rare', 'Ножны странника', 'Wanderer\'s Scabbards'],
    ['juggernaut', 'back', 'shoulder', 'mythical', 'Наплечник с кистями', 'Tasseled Pauldron'],
    ['pudge', 'weapon', 'anchor', 'common', 'Якорный крюк', 'Anchor Hook'],
    ['pudge', 'weapon', 'bone', 'rare', 'Костяной крюк', 'Bone Hook'],
    ['pudge', 'weapon', 'dragon', 'legendary', 'Золотой драконий крюк', 'Golden Dragon Hook'],
    ['pudge', 'head', 'cap', 'common', 'Колпак мясника', 'Butcher\'s Cap'],
    ['pudge', 'head', 'helm', 'rare', 'Шлем-котелок', 'Pot Helm'],
    ['pudge', 'head', 'horned', 'mythical', 'Маска палача', 'Executioner Mask'],
    ['pudge', 'back', 'fish', 'common', 'Рыба на верёвке', 'Fish on a String'],
    ['pudge', 'back', 'spikes', 'rare', 'Шипы на спине', 'Back Spikes'],
    ['pudge', 'back', 'rack', 'mythical', 'Мясная стойка', 'Meat Rack'],
    ['lion', 'weapon', 'bone', 'common', 'Костяной посох', 'Bone Staff'],
    ['lion', 'weapon', 'twisted', 'rare', 'Кручёный жезл', 'Twisted Rod'],
    ['lion', 'weapon', 'demonhand', 'legendary', 'Длань демона', 'Demon Hand'],
    ['lion', 'head', 'curled', 'common', 'Бараньи рога', 'Ram Horns'],
    ['lion', 'head', 'crown', 'rare', 'Костяная корона', 'Bone Crown'],
    ['lion', 'head', 'skull', 'mythical', 'Маска-череп', 'Skull Mask'],
    ['lion', 'back', 'tattered', 'common', 'Рваный плащ', 'Tattered Cloak'],
    ['lion', 'back', 'spikes', 'rare', 'Костяной хребет', 'Spine Ridge'],
    ['lion', 'back', 'wings', 'mythical', 'Крылья демона', 'Demon Wings']
  ];
  const ITEMS = LIST.map(([hero, slot, style, rarity, ru, en]) => ({ id: hero + '.' + slot + '.' + style, hero, slot, style, rarity, name: T(ru, en) }));
  const BY_ID = {};
  for (const it of ITEMS) BY_ID[it.id] = it;

  function fresh() { return { owned: [], equipped: {}, chests: [], opened: 0 }; }
  function normalize(raw) {
    const c = fresh();
    if (!raw || typeof raw !== 'object') return c;
    if (Array.isArray(raw.owned)) c.owned = [...new Set(raw.owned.filter(id => BY_ID[id]))];
    if (Array.isArray(raw.chests)) c.chests = raw.chests.filter(ch => ch && SLOTS[ch.hero]).map(ch => ({ hero: ch.hero, src: ch.src === 'debug' ? 'debug' : 'match' }));
    if (raw.equipped && typeof raw.equipped === 'object') for (const hid in raw.equipped) {
      if (!SLOTS[hid]) continue;
      for (const slot of SLOT_ORDER) { const id = raw.equipped[hid] && raw.equipped[hid][slot]; if (id && c.owned.includes(id) && BY_ID[id].hero === hid && BY_ID[id].slot === slot) (c.equipped[hid] = c.equipped[hid] || {})[slot] = id; }
    }
    c.opened = Number.isFinite(raw.opened) ? raw.opened : c.owned.length;
    return c;
  }
  const owns = (col, id) => col.owned.includes(id);
  const unowned = (col, hero) => ITEMS.filter(it => !owns(col, it.id) && (!hero || it.hero === hero));
  const canGrant = (col) => unowned(col).length > col.chests.length;
  function grantChest(col, hero, src) {
    if (!SLOTS[hero] || !canGrant(col)) return false;
    col.chests.push({ hero, src: src === 'debug' ? 'debug' : 'match' });
    return true;
  }
  function pickRarity(pool, rnd) {
    const present = RARITY_ORDER.filter(r => pool.some(it => it.rarity === r));
    const total = present.reduce((s, r) => s + RARITY[r].weight, 0);
    let x = rnd() * total;
    for (const r of present) { x -= RARITY[r].weight; if (x < 0) return r; }
    return present[present.length - 1];
  }
  function rollItem(col, hero, rnd) {
    const all = unowned(col); if (!all.length) return null;
    const mine = all.filter(it => it.hero === hero);
    const pool = mine.length && rnd() < HERO_BIAS ? mine : all;
    const rarity = pickRarity(pool, rnd), of = pool.filter(it => it.rarity === rarity);
    return of[Math.min(of.length - 1, Math.floor(rnd() * of.length))];
  }
  function openChest(col, rnd, index = 0) {
    const chest = col.chests[index]; if (!chest) return null;
    const item = rollItem(col, chest.hero, rnd); if (!item) return null;
    col.chests.splice(index, 1); col.owned.push(item.id); col.opened++;
    return { chest, item };
  }
  function equip(col, id) {
    const it = BY_ID[id]; if (!it || !owns(col, id)) return false;
    (col.equipped[it.hero] = col.equipped[it.hero] || {})[it.slot] = id;
    return true;
  }
  function unequip(col, hero, slot) { if (col.equipped[hero]) delete col.equipped[hero][slot]; }
  const equippedId = (col, hero, slot) => (col.equipped[hero] && col.equipped[hero][slot]) || null;
  function look(col, hero) {
    const out = {};
    for (const slot of SLOT_ORDER) { const id = equippedId(col, hero, slot); if (id) out[slot] = BY_ID[id].style; }
    return out;
  }
  function randomLook(hero, rnd) {
    const out = {};
    for (const slot of SLOT_ORDER) if (rnd() < 0.45) { const of = ITEMS.filter(it => it.hero === hero && it.slot === slot); out[slot] = of[Math.floor(rnd() * of.length)].style; }
    return out;
  }
  const itemsFor = (hero, slot) => ITEMS.filter(it => it.hero === hero && (!slot || it.slot === slot));

  D.Cosmetics = { SLOT_ORDER, SLOTS, RARITY, RARITY_ORDER, ITEMS, BY_ID, DEFAULT_NAME, HERO_BIAS, fresh, normalize, owns, unowned, canGrant, grantChest, rollItem, openChest, equip, unequip, equippedId, look, randomLook, itemsFor };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
