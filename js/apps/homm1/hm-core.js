(function (H) {
  'use strict';

  const W = 640, H_SCR = 480;
  const VIEW_X = 16, VIEW_Y = 16, VIEW_W = 448, VIEW_H = 448;
  const TILE_SIZE = 32, VIEW_TILES = 14;
  const MINIMAP_X = 480, MINIMAP_Y = 16, MINIMAP_SIZE = 144;
  const BF_COLS = 7, BF_ROWS = 5, BF_CELL_W = 64, BF_CELL_H = 56, BF_X = 96, BF_Y = 104;
  const ARMY_SLOTS = 5, ARTIFACT_SLOTS = 14, MAX_ACTIVE_HEROES = 8, MAX_MAGE_GUILD = 4;
  const DAYS_PER_WEEK = 7, WEEKS_PER_MONTH = 4, MAX_DAYS_WITHOUT_TOWN = 7;
  const HERO_HIRE_COST = 2500, SPELLBOOK_COST = 500;
  const BOAT_COST = { gold: 1000, wood: 10 };

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const smooth = t => t * t * (3 - 2 * t);

  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = (n + (n << 3)) | 0;
    n ^= n >>> 4;
    n = Math.imul(n, 0x27d4eb2d);
    n ^= n >>> 15;
    return n >>> 0;
  }

  function hash2(x, y, s) {
    return hash(Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1274126177)) / 4294967296;
  }

  function strHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  class RNG {
    constructor(seed) {
      this.s = (seed >>> 0) || 0x9e3779b9;
    }
    next() {
      let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(a, b) {
      return a + Math.floor(this.next() * (b - a + 1));
    }
    range(a, b) {
      return a + this.next() * (b - a);
    }
    chance(p) {
      return this.next() < p;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    }
    weighted(list, wf) {
      let total = 0;
      for (const x of list) total += wf(x);
      if (total <= 0) return list[0];
      let r = this.next() * total;
      for (const x of list) {
        r -= wf(x);
        if (r <= 0) return x;
      }
      return list[list.length - 1];
    }
  }

  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function rgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function shade(hex, k) {
    const [r, g, b] = rgb(hex);
    const f = c => Math.round(clamp(k >= 0 ? c + (255 - c) * k : c * (1 + k), 0, 255));
    return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  function mix(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2);
    const f = i => Math.round(lerp(a[i], b[i], t));
    return '#' + ((1 << 24) | (f(0) << 16) | (f(1) << 8) | f(2)).toString(16).slice(1);
  }

  const RES_ORDER = ['wood', 'mercury', 'ore', 'sulfur', 'crystal', 'gems', 'gold'];

  const RESOURCES = {
    wood: { id: 'wood', name: 'Дерево', short: 'Дер.', mineName: 'Лесопилка', daily: 2, pileRange: [5, 10], color: '#8b5a2b' },
    mercury: { id: 'mercury', name: 'Ртуть', short: 'Рт.', mineName: 'Лаборатория алхимика', daily: 1, pileRange: [3, 6], color: '#c8d6e5' },
    ore: { id: 'ore', name: 'Руда', short: 'Руда', mineName: 'Каменоломня', daily: 2, pileRange: [5, 10], color: '#7f8c8d' },
    sulfur: { id: 'sulfur', name: 'Сера', short: 'Сера', mineName: 'Серная пещера', daily: 1, pileRange: [3, 6], color: '#f1c40f' },
    crystal: { id: 'crystal', name: 'Кристаллы', short: 'Крист.', mineName: 'Кристальная шахта', daily: 1, pileRange: [3, 6], color: '#e74c3c' },
    gems: { id: 'gems', name: 'Самоцветы', short: 'Сам.', mineName: 'Копь самоцветов', daily: 1, pileRange: [3, 6], color: '#2ecc71' },
    gold: { id: 'gold', name: 'Золото', short: 'Зол.', mineName: 'Золотая шахта', daily: 1000, pileRange: [500, 1000], color: '#ffd700' }
  };

  function emptyResources(mult) {
    const k = mult === undefined ? 0 : mult;
    return { wood: 20 * k, mercury: 10 * k, ore: 20 * k, sulfur: 10 * k, crystal: 10 * k, gems: 10 * k, gold: 7500 * k };
  }

  function canAfford(pool, cost) {
    if (!cost) return true;
    for (const k of RES_ORDER) {
      if ((cost[k] || 0) > (pool[k] || 0)) return false;
    }
    return true;
  }

  function spendResources(pool, cost) {
    if (!canAfford(pool, cost)) return false;
    for (const k of RES_ORDER) {
      if (cost && cost[k]) pool[k] -= cost[k];
    }
    return true;
  }

  function addResources(pool, gain) {
    if (!gain) return pool;
    for (const k of RES_ORDER) {
      if (gain[k]) pool[k] = (pool[k] || 0) + gain[k];
    }
    return pool;
  }

  function scaleCost(cost, mult) {
    const out = {};
    if (!cost) return out;
    const m = Math.max(0, mult | 0);
    for (const k of Object.keys(cost)) {
      if (cost[k]) out[k] = cost[k] * m;
    }
    return out;
  }

  const PLAYER_COLORS = [
    { id: 'blue', name: 'Синий', hex: '#2868d8', light: '#64a0ff', dark: '#14387c' },
    { id: 'green', name: 'Зелёный', hex: '#289838', light: '#68d878', dark: '#14521e' },
    { id: 'red', name: 'Красный', hex: '#c82828', light: '#ff6868', dark: '#6e1414' },
    { id: 'yellow', name: 'Жёлтый', hex: '#d8b020', light: '#ffe058', dark: '#786010' }
  ];

  const TERRAINS = {
    water: { id: 'water', name: 'Вода', moveCost: 100, naval: true, rough: false, color: '#1b4f9c' },
    grass: { id: 'grass', name: 'Трава', moveCost: 100, naval: false, rough: false, color: '#387c2b' },
    dirt: { id: 'dirt', name: 'Грязь', moveCost: 100, naval: false, rough: false, color: '#7a5835' },
    road: { id: 'road', name: 'Дорога', moveCost: 75, naval: false, rough: false, color: '#b59a6a' },
    lava: { id: 'lava', name: 'Лава', moveCost: 125, naval: false, rough: true, color: '#4a2820' },
    desert: { id: 'desert', name: 'Пустыня', moveCost: 150, naval: false, rough: true, color: '#d4af5a' },
    snow: { id: 'snow', name: 'Снег', moveCost: 150, naval: false, rough: true, color: '#dce6f0' },
    swamp: { id: 'swamp', name: 'Болото', moveCost: 175, naval: false, rough: true, color: '#2d523a' }
  };

  const SPEED_ORDER = ['very_slow', 'slow', 'average', 'fast', 'very_fast'];
  const SPEED_LABELS = {
    very_slow: 'Оч. низкая',
    slow: 'Низкая',
    average: 'Средняя',
    fast: 'Высокая',
    very_fast: 'Оч. высокая'
  };
  const SPEED_MOVE_POINTS = {
    very_slow: 900,
    slow: 1000,
    average: 1200,
    fast: 1500,
    very_fast: 1500
  };
  const SPEED_COMBAT_RANGE = {
    very_slow: 2,
    slow: 3,
    average: 4,
    fast: 5,
    very_fast: 6
  };

  function shiftSpeed(speed, delta) {
    const idx = SPEED_ORDER.indexOf(speed);
    if (idx < 0) return 'average';
    return SPEED_ORDER[clamp(idx + delta, 0, SPEED_ORDER.length - 1)];
  }

  const LEVEL_XP = [
    0, 1000, 2000, 3200, 4600, 6200, 8000, 10000, 12200, 14700,
    17500, 20600, 24320, 28784, 34140, 40567, 48279, 57533, 68637, 81961
  ];

  function levelForXp(xp) {
    let lvl = 1;
    for (let i = 1; i < LEVEL_XP.length; i++) {
      if (xp >= LEVEL_XP[i]) lvl = i + 1;
      else break;
    }
    return lvl;
  }

  const TROOP_SIZES = [
    { min: 1, max: 4, name: 'Мало' },
    { min: 5, max: 9, name: 'Несколько' },
    { min: 10, max: 19, name: 'Отряд' },
    { min: 20, max: 49, name: 'Много' },
    { min: 50, max: 99, name: 'Орда' },
    { min: 100, max: 249, name: 'Толпа' },
    { min: 250, max: 499, name: 'Туча' },
    { min: 500, max: 999, name: 'Тьма' },
    { min: 1000, max: 999999, name: 'Легион' }
  ];

  function troopSizeLabel(count) {
    const n = Math.max(1, count | 0);
    for (const s of TROOP_SIZES) {
      if (n >= s.min && n <= s.max) return s.name;
    }
    return 'Легион';
  }

  const DIFFICULTIES = [
    { id: 'easy', name: 'Лёгкая', ratingMult: 0.7, startGold: 10000, aiMult: 0.8 },
    { id: 'normal', name: 'Обычная', ratingMult: 1.0, startGold: 7500, aiMult: 1.0 },
    { id: 'hard', name: 'Сложная', ratingMult: 1.3, startGold: 5000, aiMult: 1.2 },
    { id: 'impossible', name: 'Невозможная', ratingMult: 1.6, startGold: 2500, aiMult: 1.5 }
  ];

  function makePalette() {
    const pal = new Array(256);
    const bases = [
      '#000000', '#14141c', '#262632', '#3a3a4a', '#525264', '#6e6e82', '#8e8ea2', '#b4b4c6', '#dcdce8', '#ffffff',
      '#2c1c12', '#442c1c', '#5e3e28', '#7a5236', '#986a46', '#b6845a', '#d2a274', '#eac296', '#f6dfc0', '#fff2dc',
      '#142c14', '#1e421e', '#2b5c28', '#387834', '#489642', '#5cb454', '#76ce6c', '#96e48c', '#bcf4b4', '#e0fce0',
      '#102448', '#183668', '#224c8c', '#2e64b4', '#4080dc', '#5ca0f4', '#80bcff', '#a8d4ff', '#d0e8ff', '#eef6ff',
      '#481010', '#681818', '#8c2222', '#b42e2e', '#dc4242', '#f46262', '#ff8888', '#ffb0b0', '#ffd4d4', '#fff0f0',
      '#48360c', '#684e12', '#8c6a1a', '#b48822', '#dca82e', '#f4c842', '#ffe066', '#ffec94', '#fff6c4', '#fffce6',
      '#2c1444', '#421e64', '#5a2a88', '#7438ac', '#904cd0', '#ac68ec', '#c68cff', '#deb4ff', '#eed8ff', '#f8eeff',
      '#143838', '#1e5252', '#2a6e6e', '#388c8c', '#48acac', '#60c8c8', '#80e0e0', '#a6f0f0', '#ccf8f8', '#eafcfc'
    ];
    for (let i = 0; i < 256; i++) {
      if (i < bases.length) {
        pal[i] = bases[i];
      } else {
        const g = (i - bases.length) / (256 - bases.length);
        const h1 = bases[i % bases.length];
        const h2 = bases[(i * 7 + 13) % bases.length];
        pal[i] = mix(h1, h2, clamp(g, 0.15, 0.85));
      }
    }
    return pal;
  }

  const PALETTE = makePalette();

  Object.assign(H, {
    W, H: H_SCR, VIEW_X, VIEW_Y, VIEW_W, VIEW_H, TILE_SIZE, VIEW_TILES,
    MINIMAP_X, MINIMAP_Y, MINIMAP_SIZE,
    BF_COLS, BF_ROWS, BF_CELL_W, BF_CELL_H, BF_X, BF_Y,
    ARMY_SLOTS, ARTIFACT_SLOTS, MAX_ACTIVE_HEROES, MAX_MAGE_GUILD,
    DAYS_PER_WEEK, WEEKS_PER_MONTH, MAX_DAYS_WITHOUT_TOWN,
    HERO_HIRE_COST, SPELLBOOK_COST, BOAT_COST,
    clamp, lerp, dist, smooth, hash, hash2, strHash, RNG, plural, rgb, shade, mix,
    RES_ORDER, RESOURCES, emptyResources, canAfford, spendResources, addResources, scaleCost,
    PLAYER_COLORS, TERRAINS,
    SPEED_ORDER, SPEED_LABELS, SPEED_MOVE_POINTS, SPEED_COMBAT_RANGE, shiftSpeed,
    LEVEL_XP, levelForXp, TROOP_SIZES, troopSizeLabel, DIFFICULTIES, PALETTE
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
