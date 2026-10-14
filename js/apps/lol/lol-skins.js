(function (L) {
  'use strict';
  const RARITY = {
    base: { order: 0, weight: 0, color: '#b8b4a8', name: { ru: 'Классический', en: 'Classic' } },
    common: { order: 1, weight: 60, color: '#6cb4f0', name: { ru: 'Обычный', en: 'Standard' } },
    epic: { order: 2, weight: 30, color: '#c07cff', name: { ru: 'Эпический', en: 'Epic' } },
    legendary: { order: 3, weight: 10, color: '#ffb03a', name: { ru: 'Легендарный', en: 'Legendary' } }
  };

  const SKINS = {
    lulu: [
      { key: 'classic', rarity: 'base', name: { ru: 'Лулу', en: 'Lulu' }, scene: 'rift',
        pal: { skin: '#b8a4ec', hair: '#f6eeff', cloth: '#6a2ab8', cloth2: '#e05090', hat: '#5a1a98', hat2: '#e05090', acc: '#ffd040', staff: '#8a5a30', eye: '#7a3ad8' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'bittersweet', rarity: 'common', name: { ru: 'Горько-сладкая Лулу', en: 'Bittersweet Lulu' }, scene: 'candy',
        pal: { hair: '#fff4e8', cloth: '#ff6fa8', cloth2: '#fff0e0', hat: '#ff8ac0', hat2: '#fff4f8', acc: '#ff4a8a', staff: '#f0e8f0', eye: '#d0306a' },
        parts: { hat: 'candy', staff: 'lollipop', pix: 'candy' }, fx: { proj: '#ff8ad0', aura: null } },
      { key: 'wicked', rarity: 'epic', name: { ru: 'Злая Лулу', en: 'Wicked Lulu' }, scene: 'swamp',
        pal: { skin: '#b8b0c8', hair: '#2a2438', cloth: '#2a2438', cloth2: '#5ad060', hat: '#1e1828', hat2: '#5ad060', acc: '#7aff70', staff: '#3a3040', eye: '#7aff70' },
        parts: { hat: 'wicked', staff: 'thorn', pix: 'wicked' }, fx: { proj: '#8aff60', aura: null } },
      { key: 'winter', rarity: 'legendary', name: { ru: 'Лулу — Зимнее чудо', en: 'Winter Wonder Lulu' }, scene: 'snow',
        pal: { hair: '#ffffff', cloth: '#4a8ae8', cloth2: '#f4faff', hat: '#f4faff', hat2: '#4a8ae8', acc: '#bff0ff', staff: '#e8f6ff', eye: '#3a7ae0' },
        parts: { hat: 'winter', staff: 'snowflake', pix: 'snow' }, fx: { proj: '#c8f0ff', aura: 'snow' } }
    ],
    jinx: [
      { key: 'classic', rarity: 'base', name: { ru: 'Джинкс', en: 'Jinx' }, scene: 'rift',
        pal: { skin: '#f6dccc', hair: '#3a78e0', hair2: '#2656b8', cloth: '#2a2a38', cloth2: '#e04a8a', acc: '#6ad0ff', stock: '#1e1a24', stock2: '#e04a8a', boot: '#2a2230', belt: '#8a5a2a', eye: '#ff4aa8', gun: '#e060a8', gun2: '#34343e', gunAcc: '#6ad0ff', launcher: '#7888a0', launcher2: '#d8dde6', hat: '#1e1a24' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'mafia', rarity: 'common', name: { ru: 'Джинкс-мафиози', en: 'Mafia Jinx' }, scene: 'city',
        pal: { cloth: '#4a2a5a', cloth2: '#e8e0f0', acc: '#e04a8a', stock2: '#8a6ab0', hat: '#1e1a24', gun: '#7a4a24', gun2: '#1e1c22', gunAcc: '#d0a040' },
        parts: { hat: 'fedora', gun: 'tommy', launcher: 'case' }, fx: { proj: '#ffd070', aura: null } },
      { key: 'firecracker', rarity: 'epic', name: { ru: 'Джинкс-хлопушка', en: 'Firecracker Jinx' }, scene: 'lanterns',
        pal: { hair: '#2a1a2e', hair2: '#e03040', cloth: '#c8202a', cloth2: '#ffd040', acc: '#ffd040', gun: '#c8202a', gun2: '#6a1010', gunAcc: '#ffd040', eye: '#e03040' },
        parts: { gun: 'dragon', launcher: 'dragon', hat: 'hairpins' }, fx: { proj: '#ffb030', aura: null } },
      { key: 'starguardian', rarity: 'legendary', name: { ru: 'Джинкс — Звёздная защитница', en: 'Star Guardian Jinx' }, scene: 'stars',
        pal: { hair: '#e070d8', hair2: '#6ab0ff', cloth: '#fff4fc', cloth2: '#6a5ae8', acc: '#ffe060', gun: '#fff0fa', gun2: '#e060c0', gunAcc: '#ffe060', eye: '#6ab0ff' },
        parts: { gun: 'star', launcher: 'star', hat: 'star' }, fx: { proj: '#ffa8f0', aura: 'stars' } }
    ],
    garen: [
      { key: 'classic', rarity: 'base', name: { ru: 'Гарен', en: 'Garen' }, scene: 'rift',
        pal: { skin: '#eec39c', hair: '#6a4424', armor: '#c8d0dc', armor2: '#8a94a8', cloth2: '#2a58c8', cape: '#2a4aa8', trim: '#e8c050', blade: '#e4ecf8', edge: '#ffffff', hilt: '#5a3a20', eye: '#3a5a9a', band: '#2a3a20' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'sanguine', rarity: 'common', name: { ru: 'Кровавый Гарен', en: 'Sanguine Garen' }, scene: 'dusk',
        pal: { armor: '#8a2a2a', armor2: '#5a1818', cloth2: '#2a1a1a', cape: '#6a1010', trim: '#c89040', hair: '#2a1a14', blade: '#e8c8c0', edge: '#c02020' },
        parts: {}, fx: { proj: null, aura: null } },
      { key: 'commando', rarity: 'epic', name: { ru: 'Гарен-коммандос', en: 'Commando Garen' }, scene: 'jungle',
        pal: { armor: '#6a7a48', armor2: '#4a5634', cloth2: '#8a7a50', cape: null, trim: '#3a3a30', hair: '#3a2a1a', blade: '#a8b0b8', edge: '#e0e8f0', band: '#2a3a20' },
        parts: { head: 'beret', blade: 'knife', body: 'vest' }, fx: { proj: null, aura: null } },
      { key: 'dreadknight', rarity: 'legendary', name: { ru: 'Гарен — Рыцарь ужаса', en: 'Dreadknight Garen' }, scene: 'castle',
        pal: { armor: '#2e2838', armor2: '#16121e', cloth2: '#3a2a48', cape: '#1a1024', trim: '#8a60c0', hair: '#1a1420', blade: '#3a3448', edge: '#b070ff', eye: '#ff3040' },
        parts: { head: 'helm', blade: 'dread', body: 'spikes' }, fx: { proj: null, aura: 'embers' } }
    ],
    annie: [
      { key: 'classic', rarity: 'base', name: { ru: 'Энни', en: 'Annie' }, scene: 'rift',
        pal: { skin: '#f8dcc4', hair: '#e0482a', cloth: '#e04a78', cloth2: '#fff0f4', bow: '#8a3aa8', legs: '#f4e4e8', shoes: '#8a2a3a', eye: '#3a9a6a', bag: '#8a3aa8', hood: '#c8202a', bear: '#7a5030', bear2: '#e0c090', fire: '#ff7a20' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'goth', rarity: 'common', name: { ru: 'Готическая Энни', en: 'Goth Annie' }, scene: 'graveyard',
        pal: { skin: '#f4e4e8', hair: '#1e1a24', cloth: '#3a2448', cloth2: '#1e1a24', bow: '#8a2a8a', legs: '#1e1a24', shoes: '#1e1a24', bag: '#1e1a24', eye: '#8a3aa8', bear: '#2a2430', bear2: '#8a3a8a', fire: '#c070ff' },
        parts: { bear: 'goth' }, fx: { proj: '#c070ff', aura: null } },
      { key: 'redriding', rarity: 'epic', name: { ru: 'Красная Шапочка Энни', en: 'Red Riding Annie' }, scene: 'woods',
        pal: { hair: '#c8402a', cloth: '#3a6ac8', cloth2: '#f4f0e8', bow: '#c8202a', hood: '#c8202a', legs: '#f4f0e8', shoes: '#5a3a1e', bear: '#6a6a78', bear2: '#e8e0d0' },
        parts: { hood: true, bear: 'wolf' }, fx: { proj: '#ff7030', aura: null } },
      { key: 'frostfire', rarity: 'legendary', name: { ru: 'Энни — Лёд и пламя', en: 'Frostfire Annie' }, scene: 'ice',
        pal: { skin: '#f4ecf4', hair: '#e8f4ff', cloth: '#4a9ae0', cloth2: '#e8f8ff', bow: '#80e0ff', legs: '#2a5aa8', shoes: '#1e3a78', bag: '#3a8ad0', eye: '#3ab0ff', bear: '#bfe8ff', bear2: '#3a8ad0', fire: '#60c8ff' },
        parts: { bear: 'ice', tiara: true }, fx: { proj: '#80d8ff', aura: 'snow' } }
    ],
    ashe: [
      { key: 'classic', rarity: 'base', name: { ru: 'Эш', en: 'Ashe' }, scene: 'rift',
        pal: { skin: '#f4dcc8', hair: '#eef2ff', cloth: '#3a6ac8', cloth2: '#e8f0ff', hood: '#2a4a98', hood2: '#1e3874', legs: '#28325a', boots: '#4a3a30', eye: '#4a8ae0', bow: '#9ad4f4', string: '#ffffff', acc: '#c8f0ff', acc2: '#b0b8c8', grip: '#4a3a30', arrow: '#c8f0ff', arrowGlow: '#a0e8ff', fur: '#f4f0e8' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'sherwood', rarity: 'common', name: { ru: 'Эш из Шервудского леса', en: 'Sherwood Forest Ashe' }, scene: 'forest',
        pal: { hair: '#e8c890', cloth: '#3a7a2a', cloth2: '#8a5a30', hood: '#2a6020', hood2: '#1a4a18', legs: '#4a3a24', bow: '#7a4a20', string: '#e0d8b0', acc: '#c0a040', arrow: '#e0d0a8', arrowGlow: '#fff0b0' },
        parts: { bow: 'longbow' }, fx: { proj: '#d0e8a0', aura: null } },
      { key: 'freljord', rarity: 'epic', name: { ru: 'Эш из Фрельйорда', en: 'Freljord Ashe' }, scene: 'snow',
        pal: { cloth: '#6a8ab0', cloth2: '#e8e4dc', hood: '#d8d0c4', hood2: '#a89a88', legs: '#4a4a58', bow: '#8a6a4a', string: '#ffffff', acc: '#a0e0ff', fur: '#f4f0e8' },
        parts: { fur: true, bow: 'longbow' }, fx: { proj: '#d0f4ff', aura: null } },
      { key: 'queen', rarity: 'legendary', name: { ru: 'Королева Эш', en: 'Queen Ashe' }, scene: 'throne',
        pal: { cloth: '#5a2a8a', cloth2: '#f0d060', hood: '#3a1a6a', hood2: '#281050', legs: '#2a1a40', bow: '#e8c050', string: '#fff8e0', acc: '#ffe070', arrow: '#fff0c0', arrowGlow: '#ffe890' },
        parts: { crown: true, bow: 'royal' }, fx: { proj: '#ffe890', aura: 'sparkle' } }
    ],
    masteryi: [
      { key: 'classic', rarity: 'base', name: { ru: 'Мастер Йи', en: 'Master Yi' }, scene: 'rift',
        pal: { skin: '#e8c090', hair: '#1e1e22', cloth: '#d8b050', cloth2: '#6a3a1e', sash: '#4a2a18', lens: '#80ff60', frame: '#4a4a3a', blade: '#e4eef4', hilt: '#3a2a1a', guard: '#8a6a3a', guard2: '#c8a040', boot: '#2a2018' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'assassin', rarity: 'common', name: { ru: 'Мастер Йи — Убийца', en: 'Assassin Master Yi' }, scene: 'dojo',
        pal: { cloth: '#2a2228', cloth2: '#8a1a1a', sash: '#c02020', lens: '#ff3a30', frame: '#3a3a40', blade: '#e0e8f0' },
        parts: { mask: true }, fx: { proj: null, aura: null } },
      { key: 'headhunter', rarity: 'epic', name: { ru: 'Мастер Йи — Охотник за головами', en: 'Headhunter Master Yi' }, scene: 'ruins',
        pal: { skin: '#b07a50', cloth: '#6a4a2a', cloth2: '#3a2a1a', sash: '#c86a20', lens: '#ffa030', frame: '#e8e0c8', blade: '#d8d0b8', hair: '#1a1410' },
        parts: { goggles: 'skull', blade: 'bone' }, fx: { proj: null, aura: null } },
      { key: 'project', rarity: 'legendary', name: { ru: 'ПРОЕКТ: Йи', en: 'PROJECT: Yi' }, scene: 'neon',
        pal: { cloth: '#26262e', cloth2: '#d8dce4', sash: '#ff3040', lens: '#ff3a4a', frame: '#e8ecf4', blade: '#ff4a5a', hair: '#e8ecf4' },
        parts: { goggles: 'visor', blade: 'energy', body: 'armor' }, fx: { proj: null, aura: 'sparks' } }
    ],
    malphite: [
      { key: 'classic', rarity: 'base', name: { ru: 'Мальфит', en: 'Malphite' }, scene: 'rift',
        pal: { rock: '#a08260', rock2: '#c4a47c', glow: '#8ae0ff', moss: '#5a4430' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'shamrock', rarity: 'common', name: { ru: 'Мальфит-трилистник', en: 'Shamrock Malphite' }, scene: 'meadow',
        pal: { rock: '#4a8a3a', rock2: '#6aa84a', glow: '#ffe060', moss: '#b0e070' },
        parts: { clover: true }, fx: { proj: null, aura: null } },
      { key: 'glacial', rarity: 'epic', name: { ru: 'Ледниковый Мальфит', en: 'Glacial Malphite' }, scene: 'ice',
        pal: { rock: '#8ab8d8', rock2: '#c8e4f4', glow: '#ffffff', moss: '#e8f8ff' },
        parts: { spikes: 'ice' }, fx: { proj: null, aura: 'snow' } },
      { key: 'mecha', rarity: 'legendary', name: { ru: 'Меха-Мальфит', en: 'Mecha Malphite' }, scene: 'factory',
        pal: { rock: '#7a8290', rock2: '#e07a28', glow: '#40f0ff', moss: '#2a2e36' },
        parts: { mecha: true }, fx: { proj: null, aura: 'sparks' } }
    ],
    teemo: [
      { key: 'classic', rarity: 'base', name: { ru: 'Тимо', en: 'Teemo' }, scene: 'rift',
        pal: { skin: '#e0b478', skin2: '#f4e2c0', cloth: '#5a7a34', cloth2: '#8a5a2a', boot: '#5a3a1e', eye: '#2a1a14', hat: '#4a6a2a', hat2: '#5a7a34', acc: '#d83a2a', lens: '#80e0ff', gun: '#a07a40' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'recon', rarity: 'common', name: { ru: 'Тимо-разведчик', en: 'Recon Teemo' }, scene: 'jungle',
        pal: { cloth: '#5a6a3a', cloth2: '#8a7a4a', hat: '#4a5a30', hat2: '#6a7a44', acc: '#2a2a20', lens: '#ffb040' },
        parts: { hat: 'helmet' }, fx: { proj: '#c0d060', aura: null } },
      { key: 'badger', rarity: 'epic', name: { ru: 'Тимо-барсук', en: 'Badger Teemo' }, scene: 'woods',
        pal: { cloth: '#6a6a70', cloth2: '#2a2a2e', hat: '#2a2a2e', hat2: '#f0f0f0', acc: '#f0f0f0' },
        parts: { hat: 'badger' }, fx: { proj: '#e0e0e0', aura: null } },
      { key: 'astronaut', rarity: 'legendary', name: { ru: 'Тимо-астронавт', en: 'Astronaut Teemo' }, scene: 'space',
        pal: { cloth: '#f0f0f4', cloth2: '#e07a28', hat: '#f0f0f4', hat2: '#e07a28', acc: '#40a0ff', gun: '#b0b8c8' },
        parts: { hat: 'bubble', gun: 'ray' }, fx: { proj: '#60e0ff', aura: 'stars' } }
    ],
    ryze: [
      { key: 'classic', rarity: 'base', name: { ru: 'Райз', en: 'Ryze' }, scene: 'rift',
        pal: { skin: '#6aa0e8', cloth: '#6a3a24', cloth2: '#c89a5a', trim: '#e0c070', scroll: '#e8dcb0', rune: '#40ffff', eye: '#e8ffff', legs: '#3a2a20', boots: '#2a1e16', beard: '#f4f4f4', hat: '#f4f0e8', hat2: '#c8202a' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'uncle', rarity: 'common', name: { ru: 'Дядюшка Райз', en: 'Uncle Ryze' }, scene: 'parade',
        pal: { cloth: '#2a3a8a', cloth2: '#f4f0e8', trim: '#c8202a', beard: '#f4f4f4', hat: '#f4f0e8', hat2: '#c8202a', legs: '#f4f0e8', boots: '#1e1a1a' },
        parts: { hat: 'tophat', beard: true }, fx: { proj: '#ff6060', aura: null } },
      { key: 'pirate', rarity: 'epic', name: { ru: 'Райз-пират', en: 'Pirate Ryze' }, scene: 'sea',
        pal: { cloth: '#8a1a1a', cloth2: '#3a2a1a', trim: '#e0b040', hat: '#1e1a1a', hat2: '#e0b040', scroll: '#d8c090', legs: '#2a2020', boots: '#1e1a1a' },
        parts: { hat: 'tricorn', patch: true, scroll: 'map' }, fx: { proj: '#60d0ff', aura: null } },
      { key: 'zombie', rarity: 'legendary', name: { ru: 'Райз-зомби', en: 'Zombie Ryze' }, scene: 'graveyard',
        pal: { skin: '#7aa870', cloth: '#4a3a5a', cloth2: '#2a2230', trim: '#8ae060', rune: '#8aff60', scroll: '#a8a088', eye: '#c8ff60' },
        parts: { rot: true, scroll: 'torn' }, fx: { proj: '#8aff60', aura: 'embers' } }
    ],
    alistar: [
      { key: 'classic', rarity: 'base', name: { ru: 'Алистар', en: 'Alistar' }, scene: 'rift',
        pal: { fur: '#7a5a8e', fur2: '#a88ab8', horn: '#f0e8d8', ring: '#ffd040', cloth: '#6a3a28', cloth2: '#d0b060', eye: '#ffe070', hoof: '#2a2020' }, parts: {}, fx: { proj: null, aura: null } },
      { key: 'black', rarity: 'common', name: { ru: 'Чёрный Алистар', en: 'Black Alistar' }, scene: 'storm',
        pal: { fur: '#2e2a30', fur2: '#4a444c', horn: '#d8d4c8', ring: '#c8c8d0', cloth: '#3a2020', eye: '#ff3020' },
        parts: { glowEyes: true }, fx: { proj: null, aura: null } },
      { key: 'matador', rarity: 'epic', name: { ru: 'Алистар-матадор', en: 'Matador Alistar' }, scene: 'arena',
        pal: { fur: '#8a5a3a', fur2: '#a87a5a', cloth: '#c8202a', cloth2: '#ffd040', ring: '#ffd040' },
        parts: { jacket: true, hat: 'montera' }, fx: { proj: null, aura: null } },
      { key: 'infernal', rarity: 'legendary', name: { ru: 'Адский Алистар', en: 'Infernal Alistar' }, scene: 'volcano',
        pal: { fur: '#2a1a1a', fur2: '#ff6a20', horn: '#ffb040', ring: '#ff8020', cloth: '#1a1010', eye: '#ffd040' },
        parts: { lava: true }, fx: { proj: null, aura: 'embers' } }
    ]
  };

  const BY_ID = {};
  const LIST = [];
  for (const cid in SKINS) for (const def of SKINS[cid]) {
    const id = cid + '.' + def.key;
    const s = { id, cid, key: def.key, def };
    BY_ID[id] = s; LIST.push(s);
  }
  const baseId = cid => cid + '.classic';
  const get = id => BY_ID[id] || null;
  const unlockable = () => LIST.filter(s => s.def.rarity !== 'base');

  function pickWeighted(list, rng) {
    let total = 0; for (const s of list) total += RARITY[s.def.rarity].weight || 1;
    let r = rng() * total;
    for (const s of list) { r -= RARITY[s.def.rarity].weight || 1; if (r < 0) return s; }
    return list[list.length - 1];
  }

  function randomLook(cid, rng) {
    const list = SKINS[cid] || [];
    if (!list.length || rng() < 0.35) return baseId(cid);
    return pickWeighted(list.filter(s => s.rarity !== 'base').map(d => BY_ID[cid + '.' + d.key]), rng).id;
  }

  const MAX_CHESTS = 99;
  class Collection {
    constructor(raw) {
      const n = Collection.normalize(raw);
      this.owned = new Set(n.owned); this.chests = n.chests; this.selected = n.selected; this.opened = n.opened; this.last = n.last;
    }
    static normalize(raw) {
      const r = raw && typeof raw === 'object' ? raw : {};
      const owned = [...new Set(Array.isArray(r.owned) ? r.owned : [])].filter(id => BY_ID[id] && BY_ID[id].def.rarity !== 'base');
      const chests = (Array.isArray(r.chests) ? r.chests : []).slice(0, MAX_CHESTS).map(c => ({ champ: c && SKINS[c.champ] ? c.champ : null }));
      const selected = {};
      if (r.selected && typeof r.selected === 'object') for (const cid in SKINS) { const id = r.selected[cid]; if (BY_ID[id] && BY_ID[id].cid === cid && (owned.includes(id) || BY_ID[id].def.rarity === 'base')) selected[cid] = id; }
      const opened = Number.isFinite(r.opened) && r.opened > 0 ? Math.floor(r.opened) : 0;
      const last = BY_ID[r.last] ? r.last : null;
      return { owned, chests, selected, opened, last };
    }
    owns(id) { const s = BY_ID[id]; return !!s && (s.def.rarity === 'base' || this.owned.has(id)); }
    lookFor(cid) { const id = this.selected[cid]; return id && this.owns(id) ? id : baseId(cid); }
    select(id) { if (!this.owns(id)) return false; this.selected[BY_ID[id].cid] = id; return true; }
    ownedCount() { return this.owned.size; }
    total() { return unlockable().length; }
    complete() { return this.owned.size >= this.total(); }
    addChest(champ) { if (this.chests.length >= MAX_CHESTS) return false; this.chests.push({ champ: SKINS[champ] ? champ : null }); return true; }
    open(rng = Math.random) {
      if (!this.chests.length) return null;
      const pool = unlockable().filter(s => !this.owned.has(s.id));
      if (!pool.length) return null;
      const chest = this.chests.shift();
      let cand = pool;
      if (chest.champ && rng() < 0.4) { const mine = pool.filter(s => s.cid === chest.champ); if (mine.length) cand = mine; }
      const got = pickWeighted(cand, rng);
      this.owned.add(got.id); this.opened++; this.last = got.id;
      return got;
    }
    toJSON() { return { v: 1, owned: [...this.owned], chests: this.chests, selected: this.selected, opened: this.opened, last: this.last }; }
  }

  L.SKINS = { RARITY, SKINS, LIST, get, baseId, unlockable, randomLook, Collection, MAX_CHESTS, STORE_KEY: 'lol98-collection' };
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
