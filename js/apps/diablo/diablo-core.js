/**
 * Diablo 98 — simulation core. No DOM access: runs in the browser and in Node tests.
 * Grid-based world (tile = 1 unit), fixed-step update, events queue for UI/audio.
 */
(function (D) {
  'use strict';
  if (!D.DATA && typeof require !== 'undefined') require('./diablo-data.js');
  const { CLASSES, XP, BASE, BASES, PREFIXES, SUFFIXES, UNIQUES, SPELLS, SKILLS, MONSTERS, BOSSES, ELITE_NAMES, THEMES, NPCS, SHRINES } = D.DATA;
  if (!BASE.gold) BASE.gold = { id: 'gold', name: 'Золото', g: 'n', cls: 'gold', w: 1, h: 1, value: 1, qlvl: 1 };

  const XP_MULT = 1.5, MAX_SPELL = 15, INV_W = 10, INV_H = 4;
  const T = { ROCK: 0, FLOOR: 1, WALL: 2, DOOR: 3, DOOR_OPEN: 4, UP: 5, DOWN: 6, LAVA: 7, GRASS: 8, DIRT: 9, HOUSE: 10, TREE: 11, WATER: 12, BRIDGE: 13 };
  const WALKABLE = new Set([T.FLOOR, T.DOOR_OPEN, T.GRASS, T.DIRT, T.BRIDGE]);
  const OPAQUE = new Set([T.ROCK, T.WALL, T.DOOR, T.HOUSE, T.TREE]);
  const DIRS8 = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cheb = (a, b) => Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
  const sign = v => (v > 0) - (v < 0);

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
    next() { let t = (this.s = (this.s + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    weighted(list) { let sum = 0; for (const [, w] of list) sum += w; let r = this.next() * sum; for (const [v, w] of list) { if ((r -= w) < 0) return v; } return list[list.length - 1][0]; }
  }
  const hashSeed = (a, b) => { let h = (a ^ Math.imul(b + 0x9e37, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0; return (h ^ (h >>> 16)) >>> 0; };

  class Heap {
    constructor() { this.k = []; this.p = []; }
    get size() { return this.k.length; }
    push(k, p) { const K = this.k, P = this.p; let i = K.length; K.push(k); P.push(p); while (i > 0) { const j = (i - 1) >> 1; if (P[j] <= p) break; K[i] = K[j]; P[i] = P[j]; i = j; } K[i] = k; P[i] = p; }
    pop() {
      const K = this.k, P = this.p, top = K[0], lk = K.pop(), lp = P.pop(), n = K.length;
      if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && P[c + 1] < P[c]) c++; if (P[c] >= lp) break; K[i] = K[c]; P[i] = P[c]; i = c; } K[i] = lk; P[i] = lp; }
      return top;
    }
  }

  // ===================================================================================== ITEMS
  const itemKind = b => ({ sword: 'w', axe: 'w', mace: 'w', bow: 'w', staff: 's', shield: 'a', helm: 'a', armor: 'a', ring: 'j', amulet: 'j' })[b.cls] || null;
  const slotFor = b => ({ sword: 'weapon', axe: 'weapon', mace: 'weapon', bow: 'weapon', staff: 'weapon', shield: 'shield', helm: 'head', armor: 'body', ring: 'ring', amulet: 'amulet' })[b.cls] || null;
  const PROP_COST = { acFlat: 20 };
  for (const a of [...PREFIXES, ...SUFFIXES]) if (!(a.prop in PROP_COST)) PROP_COST[a.prop] = a.cost;

  function baseOf(item) { return BASE[item.base]; }
  function isEquip(item) { return !!slotFor(baseOf(item)); }

  function propsOf(item) {
    if (item.quality === 'unique') return UNIQUES.find(u => u.id === item.unique).props;
    const p = {};
    for (const a of item.affixes || []) p[a.prop] = (p[a.prop] || 0) + a.value;
    return p;
  }
  function itemAC(item) {
    if (item.acBase == null) return 0;
    const p = propsOf(item);
    return Math.floor(item.acBase * (1 + (p.acPct || 0) / 100)) + (p.acFlat || 0);
  }
  function itemValue(item) {
    const b = baseOf(item);
    if (item.base === 'book') return SPELLS[item.spell].bookValue;
    if (item.base === 'gold') return item.qty;
    let v = b.value;
    const p = item.quality === 'normal' ? {} : propsOf(item);
    for (const k in p) v += (PROP_COST[k] || 50) * p[k] * 10;
    if (item.staffSpell) v += SPELLS[item.staffSpell].bookValue / 4 + item.charges * 20;
    if (item.quality === 'unique') v = Math.max(v, b.value * 3);
    return Math.max(1, Math.round(v));
  }

  function itemName(item, forceTrue) {
    const b = baseOf(item);
    if (item.base === 'gold') return `${item.qty} ${plural(item.qty, 'золотой', 'золотых', 'золотых')}`;
    if (item.base === 'book') return `Книга: ${SPELLS[item.spell].name}`;
    const known = item.identified || forceTrue;
    if (item.quality === 'unique' && known) return UNIQUES.find(u => u.id === item.unique).name;
    let name = b.name;
    if (item.quality === 'magic' && known) {
      const pre = item.affixes.find(a => a.slot === 'pre'), suf = item.affixes.find(a => a.slot === 'suf');
      if (pre) name = PREFIXES[pre.i].word[b.g] + ' ' + name.charAt(0).toLowerCase() + name.slice(1);
      if (suf) name += ' ' + SUFFIXES[suf.i].word;
    }
    if (item.staffSpell && (known || item.quality === 'normal')) name += ` (${SPELLS[item.staffSpell].name})`;
    return name;
  }
  function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many; }

  const PROP_TEXT = {
    tohit: v => `${v > 0 ? '+' : ''}${v}% к точности`, dmgPct: v => `+${v}% к урону`, dmgFlat: v => `+${v} к урону`, acPct: v => `+${v}% к защите`, acFlat: v => `+${v} к защите`,
    str: v => `${v > 0 ? '+' : ''}${v} к силе`, mag: v => `${v > 0 ? '+' : ''}${v} к магии`, dex: v => `${v > 0 ? '+' : ''}${v} к ловкости`, vit: v => `${v > 0 ? '+' : ''}${v} к живучести`,
    all: v => `+${v} ко всем характеристикам`, life: v => `${v > 0 ? '+' : ''}${v} к здоровью`, mana: v => `${v > 0 ? '+' : ''}${v} к мане`,
    resF: v => `Сопротивление огню: +${v}%`, resL: v => `Сопротивление молнии: +${v}%`, resM: v => `Сопротивление магии: +${v}%`, resAll: v => `Сопротивление всему: +${v}%`,
    spells: v => `+${v} к уровню заклинаний`, light: v => `+${v * 10}% к радиусу света`, speed: v => ['', 'Быстрая атака', 'Очень быстрая атака', 'Стремительная атака', 'Молниеносная атака'][v] || 'Быстрая атака',
    leech: v => `Похищает ${v}% здоровья`, thorns: v => `Атакующий получает 1-${v * 3} урона`, fireDmg: v => `Огненный урон: 1-${v}`, lightDmg: v => `Урон молнией: 1-${v}`,
    dmgTaken: v => `-${v} к получаемому урону`, knockback: () => 'Отбрасывает противника', indestructible: () => 'Неразрушимый', durPct: () => null, charges: () => null
  };

  function describeItem(item, hero, opts = {}) {
    const b = baseOf(item), lines = [];
    const known = item.identified || opts.reveal;
    if (item.base === 'gold') return lines;
    if (item.dmg) lines.push({ text: `Урон: ${item.dmg[0]}-${item.dmg[1]}` });
    if (item.acBase != null) lines.push({ text: `Защита: ${itemAC(item)}` });
    if (item.maxDur) lines.push({ text: item.indestructible ? 'Неразрушимый' : `Прочность: ${item.dur}/${item.maxDur}`, color: item.dur === 0 ? '#ff4040' : null });
    if (item.staffSpell) lines.push({ text: `${SPELLS[item.staffSpell].name}: ${item.charges}/${item.maxCharges} зарядов` });
    if (item.quality !== 'normal') {
      if (!known) lines.push({ text: 'Не опознан', color: '#ff6060' });
      else { const p = propsOf(item); for (const k in p) { const f = PROP_TEXT[k]; const t = f && f(p[k]); if (t) lines.push({ text: t, color: '#8080ff' }); } }
    }
    if (b.use) lines.push({ text: ({ heal: 'Восстанавливает здоровье', fullheal: 'Полностью восстанавливает здоровье', mana: 'Восстанавливает ману', fullmana: 'Полностью восстанавливает ману', rejuv: 'Восстанавливает здоровье и ману', fullrejuv: 'Полностью восстанавливает здоровье и ману', str: 'Навсегда +1 к силе', mag: 'Навсегда +1 к магии', dex: 'Навсегда +1 к ловкости', vit: 'Навсегда +1 к живучести' })[b.use] });
    if (b.spell) lines.push({ text: `Правый клик: ${SPELLS[b.spell].name}` });
    if (item.base === 'book') {
      const cur = hero ? hero.spells[item.spell] || 0 : 0, req = bookReq(item.spell, cur);
      lines.push({ text: cur ? `Изучено: уровень ${cur}` : 'Правый клик: изучить' });
      lines.push({ text: `Требуется магия: ${req}`, color: hero && heroStat(hero, 'mag') < req ? '#ff4040' : null });
    }
    if (b.quest) lines.push({ text: 'Предмет задания', color: '#e0c060' });
    const req = b.req || {}, names = { str: 'Сила', mag: 'Магия', dex: 'Ловкость' };
    for (const k of ['str', 'mag', 'dex']) if (req[k]) lines.push({ text: `Требуется: ${names[k]} ${req[k]}`, color: hero && heroStat(hero, k) < req[k] ? '#ff4040' : null });
    if (item.quality === 'unique' && known) { const u = UNIQUES.find(x => x.id === item.unique); if (u.flavor) lines.push({ text: u.flavor, color: '#b0a070' }); }
    return lines;
  }
  function itemColor(item, hero) {
    if (hero && !meetsReq(hero, item)) return '#ff4040';
    if (item.base === 'gold' || item.base === 'book') return '#ffffff';
    return item.quality === 'unique' ? '#d8b860' : item.quality === 'magic' ? '#8080ff' : '#ffffff';
  }
  function meetsReq(hero, item) {
    const req = baseOf(item).req || {};
    return !['str', 'mag', 'dex'].some(k => req[k] && heroStat(hero, k) < req[k]);
  }
  function heroStat(hero, k) { return hero.stats ? hero.stats[k] : hero.base[k]; }
  function bookReq(spell, cur) { return Math.round(SPELLS[spell].magReq * (1 + 0.2 * cur)); }

  // ===================================================================================== HERO STATS
  function equippedItems(hero) { return Object.values(hero.equip).filter(Boolean); }
  function computeStats(hero) {
    const cls = CLASSES[hero.cls];
    let active = equippedItems(hero).filter(it => !it.maxDur || it.dur > 0 || it.indestructible);
    let p;
    for (let pass = 0; pass < 4; pass++) {
      p = {};
      for (const it of active) { const pp = propsOf(it); for (const k in pp) p[k] = (p[k] || 0) + pp[k]; }
      const cur = k => hero.base[k] + (p[k] || 0) + (p.all || 0);
      const ok = active.filter(it => { const r = baseOf(it).req || {}; return !['str', 'mag', 'dex'].some(k => r[k] && cur(k) < r[k]); });
      if (ok.length === active.length) break;
      active = ok;
    }
    const g = k => p[k] || 0;
    const s = {};
    for (const k of ['str', 'mag', 'dex', 'vit']) s[k] = Math.max(0, hero.base[k] + g(k) + g('all'));
    s.active = new Set(active.map(i => i.uid));
    s.maxLife = Math.max(1, Math.floor(cls.life(s, hero.level)) + g('life'));
    s.maxMana = Math.max(0, Math.floor(cls.mana(s, hero.level)) + g('mana'));
    s.ac = Math.floor(s.dex / 5) + active.reduce((a, it) => a + itemAC(it), 0);
    const weapon = hero.equip.weapon && s.active.has(hero.equip.weapon.uid) ? hero.equip.weapon : null;
    const shield = hero.equip.shield && s.active.has(hero.equip.shield.uid) ? hero.equip.shield : null;
    s.ranged = !!(weapon && baseOf(weapon).ranged);
    const wd = weapon ? weapon.dmg : shield ? [1, 3] : [1, 1];
    const mult = 1 + g('dmgPct') / 100;
    let bonus;
    if (s.ranged) bonus = hero.cls === 'rogue' ? (s.str + s.dex) * hero.level / 200 : s.str * hero.level / 200;
    else bonus = hero.cls === 'rogue' ? (s.str + s.dex) * hero.level / 200 : s.str * hero.level / 100;
    s.dmgMin = Math.max(1, Math.floor(wd[0] * mult + g('dmgFlat') + bonus));
    s.dmgMax = Math.max(s.dmgMin, Math.floor(wd[1] * mult + g('dmgFlat') + bonus));
    s.toHit = 50 + Math.floor(s.dex / 2) + hero.level + g('tohit') + (hero.cls === 'warrior' && !s.ranged ? 20 : 0) + (hero.cls === 'rogue' && s.ranged ? 20 : 0);
    s.resF = clamp(g('resF') + g('resAll'), 0, 75); s.resL = clamp(g('resL') + g('resAll'), 0, 75); s.resM = clamp(g('resM') + g('resAll'), 0, 75);
    s.light = clamp(7 + g('light'), 4, 12);
    s.attackTime = (s.ranged ? cls.bowSpeed : cls.meleeSpeed) * (1 - 0.07 * g('speed'));
    s.castTime = cls.castSpeed;
    s.block = shield ? clamp(s.dex + cls.block, 0, 75) : 0;
    s.spellBonus = g('spells'); s.leech = g('leech'); s.thorns = g('thorns'); s.fireDmg = g('fireDmg'); s.lightDmg = g('lightDmg');
    s.dmgTaken = g('dmgTaken'); s.knockback = g('knockback') > 0;
    return s;
  }

  // ===================================================================================== LEVEL
  class Level {
    constructor(index, w, h, seed) {
      this.index = index; this.w = w; this.h = h; this.seed = seed;
      this.theme = THEMES[index === 0 ? 0 : Math.min(4, Math.ceil(index / 4))];
      this.tiles = new Uint8Array(w * h).fill(T.ROCK);
      this.explored = new Uint8Array(w * h); this.visible = new Uint8Array(w * h);
      this.occ = new Array(w * h).fill(null); this.objMap = new Map();
      this.monsters = []; this.objects = []; this.items = []; this.projectiles = []; this.effects = []; this.corpses = []; this.npcs = [];
      this.rooms = []; this.deadSids = new Set(); this.heights = null; this.lit = index === 0;
    }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { return this.inb(x, y) ? this.tiles[y * this.w + x] : T.ROCK; }
    set(x, y, t) { if (this.inb(x, y)) this.tiles[y * this.w + x] = t; }
    walkable(x, y) { return WALKABLE.has(this.get(x, y)); }
    opaque(x, y) { return OPAQUE.has(this.get(x, y)); }
    objAt(x, y) { return this.objMap.get(y * this.w + x) || null; }
    actorAt(x, y) { return this.inb(x, y) ? this.occ[y * this.w + x] : null; }
    itemAt(x, y) { return this.items.find(f => f.x === x && f.y === y) || null; }
    blocked(x, y, hero) {
      const t = this.get(x, y);
      if (!(WALKABLE.has(t) || (hero && t === T.DOOR))) return true;
      const o = this.objAt(x, y); return !!(o && o.solid);
    }
    free(x, y, hero) { return !this.blocked(x, y, hero) && !this.occ[y * this.w + x]; }
    cornerOk(x, y, dx, dy) { return !(dx && dy) || (this.walkable(x + dx, y) || this.get(x + dx, y) === T.DOOR_OPEN) && (this.walkable(x, y + dy) || this.get(x, y + dy) === T.DOOR_OPEN); }
    addObject(o) { o.idx = this.objects.length; this.objects.push(o); this.objMap.set(o.y * this.w + o.x, o); return o; }
    removeObject(o) { this.objects = this.objects.filter(x => x !== o); if (this.objMap.get(o.y * this.w + o.x) === o) this.objMap.delete(o.y * this.w + o.x); }
    place(a, x, y) { a.tx = a.fx = x; a.ty = a.fy = y; a.x = x; a.y = y; a.moving = false; a.moveT = 1; this.occ[y * this.w + x] = a; }
    unplace(a) { const i = a.ty * this.w + a.tx; if (this.occ[i] === a) this.occ[i] = null; }
    // nearest tile passing pred, spiral search
    near(x, y, pred, maxR = 6) {
      for (let r = 0; r <= maxR; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (pred(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
      return null;
    }
  }

  // FOV: recursive shadowcasting
  const MULT = [[1, 0, 0, -1, -1, 0, 0, 1], [0, 1, -1, 0, 0, -1, 1, 0], [0, 1, 1, 0, 0, -1, -1, 0], [1, 0, 0, 1, -1, 0, 0, -1]];
  function computeFOV(L, ox, oy, radius) {
    L.visible.fill(0);
    const mark = (x, y) => { if (L.inb(x, y)) { const i = y * L.w + x; L.visible[i] = 1; L.explored[i] = 1; } };
    if (L.lit) { L.visible.fill(1); L.explored.fill(1); return; }
    mark(ox, oy);
    const cast = (row, start, end, xx, xy, yx, yy) => {
      if (start < end) return;
      const r2 = radius * radius; let newStart = 0;
      for (let j = row; j <= radius; j++) {
        let dx = -j - 1; const dy = -j; let blocked = false;
        while (dx <= 0) {
          dx++;
          const X = ox + dx * xx + dy * xy, Y = oy + dx * yx + dy * yy;
          const l = (dx - 0.5) / (dy + 0.5), r = (dx + 0.5) / (dy - 0.5);
          if (start < r) continue; else if (end > l) break;
          if (dx * dx + dy * dy < r2) mark(X, Y);
          if (blocked) { if (L.opaque(X, Y)) { newStart = r; continue; } blocked = false; start = newStart; }
          else if (L.opaque(X, Y) && j < radius) { blocked = true; cast(j + 1, start, l, xx, xy, yx, yy); newStart = r; }
        }
        if (blocked) break;
      }
    };
    for (let o = 0; o < 8; o++) cast(1, 1, 0, MULT[0][o], MULT[1][o], MULT[2][o], MULT[3][o]);
  }
  function lineClear(L, x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, x = x0, y = y0;
    for (;;) {
      if (x === x1 && y === y1) return true;
      if ((x !== x0 || y !== y0) && L.opaque(x, y)) return false;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  function findPath(L, sx, sy, isGoal, hx, hy, pass, maxNodes = 3000, partial = false) {
    const W = L.w, start = sy * W + sx;
    const h = (x, y) => { const dx = Math.abs(x - hx), dy = Math.abs(y - hy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const g = new Map([[start, 0]]), came = new Map(), open = new Heap(), closed = new Set();
    open.push(start, h(sx, sy));
    let best = start, bestH = h(sx, sy), n = 0, found = -1;
    while (open.size) {
      const cur = open.pop(); if (closed.has(cur)) continue; closed.add(cur);
      const cx = cur % W, cy = (cur / W) | 0;
      if (cur !== start && isGoal(cx, cy)) { found = cur; break; }
      const hh = h(cx, cy); if (hh < bestH) { bestH = hh; best = cur; }
      if (++n > maxNodes) break;
      for (const [dx, dy] of DIRS8) {
        const nx = cx + dx, ny = cy + dy; if (!L.inb(nx, ny)) continue;
        const ni = ny * W + nx; if (closed.has(ni)) continue;
        if (!pass(nx, ny) && !(isGoal(nx, ny) && pass(nx, ny, true))) continue;
        if (!L.cornerOk(cx, cy, dx, dy)) continue;
        const cost = g.get(cur) + (dx && dy ? 1.414 : 1);
        if (g.has(ni) && g.get(ni) <= cost) continue;
        g.set(ni, cost); came.set(ni, cur); open.push(ni, cost + h(nx, ny));
      }
    }
    let end = found; if (end < 0) { if (!partial || best === start) return null; end = best; }
    const path = []; for (let c = end; c !== start; c = came.get(c)) path.push([c % W, (c / W) | 0]);
    return path.reverse();
  }

  // ===================================================================================== GENERATION
  function carve(L, x, y, w, h, t = T.FLOOR) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) L.set(i, j, t); }
  function corridor(L, a, b, rng, wide) {
    let x = a.cx, y = a.cy; const horizFirst = rng.chance(0.5);
    const dig = () => { L.set(x, y, T.FLOOR); if (wide) { L.set(x + 1, y, T.FLOOR); L.set(x, y + 1, T.FLOOR); } };
    const walkX = () => { while (x !== b.cx) { x += sign(b.cx - x); dig(); } };
    const walkY = () => { while (y !== b.cy) { y += sign(b.cy - y); dig(); } };
    if (horizFirst) { walkX(); walkY(); } else { walkY(); walkX(); }
  }
  function genRooms(L, rng, opts) {
    const rooms = [];
    if (opts.center) { const w = 13, h = 13, x = (L.w - w) >> 1, y = (L.h - h) >> 1; rooms.push({ x, y, w, h, cx: x + 6, cy: y + 6, big: true }); }
    for (let a = 0; a < 600 && rooms.length < opts.count; a++) {
      const w = rng.int(opts.min, opts.max), h = rng.int(opts.min, opts.max);
      const x = rng.int(2, L.w - w - 3), y = rng.int(2, L.h - h - 3);
      if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    if (opts.center) { const c = rooms.shift(); rooms.push(c); }
    for (const r of rooms) carve(L, r.x, r.y, r.w, r.h);
    const done = [rooms[0]];
    for (let i = 1; i < rooms.length; i++) {
      let best = done[0], bd = Infinity;
      for (const c of done) { const d = Math.abs(c.cx - rooms[i].cx) + Math.abs(c.cy - rooms[i].cy); if (d < bd) { bd = d; best = c; } }
      corridor(L, rooms[i], best, rng, opts.wide && rng.chance(0.4)); done.push(rooms[i]);
    }
    for (let k = 0; k < opts.loops; k++) { const a = rng.pick(rooms), b = rng.pick(rooms); if (a !== b) corridor(L, a, b, rng, false); }
    if (opts.doors) {
      for (const r of rooms) {
        const ring = [];
        for (let i = r.x; i < r.x + r.w; i++) ring.push([i, r.y - 1, 1, 0], [i, r.y + r.h, 1, 0]);
        for (let j = r.y; j < r.y + r.h; j++) ring.push([r.x - 1, j, 0, 1], [r.x + r.w, j, 0, 1]);
        for (const [x, y, dx, dy] of ring) {
          if (L.get(x, y) !== T.FLOOR) continue;
          if (L.get(x - dx, y - dy) === T.ROCK && L.get(x + dx, y + dy) === T.ROCK && rng.chance(0.75)) L.set(x, y, T.DOOR);
        }
      }
    }
    if (opts.pillars) for (const r of rooms) {
      if (r.w < 7 || r.h < 7 || r.big || !rng.chance(0.45)) continue;
      for (let j = r.y + 2; j < r.y + r.h - 2; j += 3) for (let i = r.x + 2; i < r.x + r.w - 2; i += 3) {
        if ([...DIRS8].every(([dx, dy]) => L.get(i + dx, j + dy) === T.FLOOR)) { L.set(i, j, T.WALL); r.pillars = true; }
      }
    }
    return rooms;
  }
  function genCaves(L, rng) {
    for (let tries = 0; tries < 20; tries++) {
      L.tiles.fill(T.ROCK);
      let open = new Uint8Array(L.w * L.h);
      for (let y = 2; y < L.h - 2; y++) for (let x = 2; x < L.w - 2; x++) open[y * L.w + x] = rng.chance(0.56) ? 1 : 0;
      for (let it = 0; it < 5; it++) {
        const nx = new Uint8Array(L.w * L.h);
        for (let y = 2; y < L.h - 2; y++) for (let x = 2; x < L.w - 2; x++) {
          let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += open[(y + dy) * L.w + x + dx];
          nx[y * L.w + x] = c >= 5 ? 1 : 0;
        }
        open = nx;
      }
      // keep largest region
      const region = new Int32Array(L.w * L.h).fill(-1); let bestId = -1, bestSize = 0, id = 0;
      for (let i = 0; i < open.length; i++) {
        if (!open[i] || region[i] >= 0) continue;
        const stack = [i]; region[i] = id; let size = 0;
        while (stack.length) { const c = stack.pop(); size++; const cx = c % L.w, cy = (c / L.w) | 0; for (const [dx, dy] of DIRS8.slice(0, 4)) { const n = (cy + dy) * L.w + cx + dx; if (open[n] && region[n] < 0) { region[n] = id; stack.push(n); } } }
        if (size > bestSize) { bestSize = size; bestId = id; } id++;
      }
      if (bestSize < 650) continue;
      for (let i = 0; i < open.length; i++) if (region[i] === bestId) L.tiles[i] = T.FLOOR;
      const rooms = [];
      for (let a = 0; a < 400 && rooms.length < 14; a++) {
        const x = rng.int(3, L.w - 4), y = rng.int(3, L.h - 4);
        if (!DIRS8.every(([dx, dy]) => L.get(x + dx, y + dy) === T.FLOOR) || L.get(x, y) !== T.FLOOR) continue;
        if (rooms.some(r => Math.abs(r.cx - x) + Math.abs(r.cy - y) < 8)) continue;
        rooms.push({ x: x - 2, y: y - 2, w: 5, h: 5, cx: x, cy: y, cave: true });
      }
      if (rooms.length >= 6) return rooms;
    }
    // fallback — plain rooms
    L.tiles.fill(T.ROCK);
    return genRooms(L, rng, { count: 10, min: 4, max: 9, loops: 2 });
  }
  function addWalls(L) {
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      if (L.get(x, y) !== T.ROCK) continue;
      if (DIRS8.some(([dx, dy]) => { const t = L.get(x + dx, y + dy); return t !== T.ROCK && t !== T.WALL; })) L.set(x, y, T.WALL);
    }
  }
  function bfsDist(L, sx, sy) {
    const dist = new Int32Array(L.w * L.h).fill(-1), q = [sy * L.w + sx]; dist[q[0]] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % L.w, cy = (c / L.w) | 0;
      for (const [dx, dy] of DIRS8) {
        const nx = cx + dx, ny = cy + dy, t = L.get(nx, ny), n = ny * L.w + nx;
        if (dist[n] >= 0 || !L.inb(nx, ny)) continue;
        if (!(WALKABLE.has(t) || t === T.DOOR || t === T.UP || t === T.DOWN)) continue;
        if (!L.cornerOk(cx, cy, dx, dy)) continue;
        dist[n] = dist[c] + 1; q.push(n);
      }
    }
    return dist;
  }
  const openAround = (L, x, y) => DIRS8.every(([dx, dy]) => L.get(x + dx, y + dy) === T.FLOOR) && L.get(x, y) === T.FLOOR;

  function genDungeon(game, n) {
    const seed = hashSeed(game.seed, n), rng = new RNG(seed), L = new Level(n, 48, 48, seed), th = L.theme;
    L.rooms = th.gen === 'caves' ? genCaves(L, rng) : genRooms(L, rng, {
      count: th.id === 'catacombs' ? 15 : n === 16 ? 9 : 11, min: 4, max: th.id === 'hell' ? 10 : 9,
      loops: 3, doors: !!th.doors, wide: th.id === 'cathedral', pillars: th.id === 'cathedral' || th.id === 'hell', center: n === 16
    });
    const rooms = L.rooms;
    // stairs: up in first room, down in farthest
    const spot = r => L.near(r.cx, r.cy, (x, y) => openAround(L, x, y), 3) || { x: r.cx, y: r.cy };
    const upR = rooms[0], up = spot(upR);
    L.set(up.x, up.y, T.UP); L.up = up;
    let dist = bfsDist(L, up.x, up.y);
    const others = rooms.slice(1).filter(r => !r.big);
    others.sort((a, b) => dist[b.cy * L.w + b.cx] - dist[a.cy * L.w + a.cx]);
    const far = others[0] || rooms[rooms.length - 1];
    if (n < 16) { const d = spot(far); L.set(d.x, d.y, T.DOWN); L.down = d; far.stairs = true; }
    upR.stairs = true;
    if (th.lava) for (const r of rooms) {
      if (r.stairs || r.big || r.pillars || r.w < 8 || r.h < 8 || !rng.chance(0.5)) continue;
      carve(L, r.x + 2, r.y + 2, r.w - 4, r.h - 4, T.LAVA); r.lava = true;
    }
    addWalls(L);
    dist = bfsDist(L, up.x, up.y);
    L.dist = dist;
    // special rooms
    const pickRoom = (minDist) => others.find(r => !r.used && !r.lava && dist[r.cy * L.w + r.cx] >= minDist) || others.find(r => !r.used && !r.lava) || far;
    const specials = [];
    if (n === 2) { const r = pickRoom(15); r.used = true; specials.push({ boss: 'butcher', r }); }
    if (n === 3) { const r = far; r.used = true; specials.push({ boss: 'leoric', r, pack: ['skeleton', 4] }); }
    if (n === 5) { const r = pickRoom(12); r.used = true; specials.push({ pedestal: 'magicrock', r }); }
    if (n === 10) { const r = pickRoom(12); r.used = true; specials.push({ pedestal: 'anvil', r }); }
    if (n === 15) { const r = far; specials.push({ boss: 'lazarus', r, pack: ['succubus', 3] }); L.sealed = true; }
    if (n === 16) { const r = rooms.find(x => x.big); r.used = true; specials.push({ boss: 'diablo', r, pack: ['advocate', 2] }); }
    // objects
    const objSpot = (r) => {
      for (let a = 0; a < 40; a++) {
        const x = r ? rng.int(r.x, r.x + r.w - 1) : rng.int(2, L.w - 3), y = r ? rng.int(r.y, r.y + r.h - 1) : rng.int(2, L.h - 3);
        if (!openAround(L, x, y) || dist[y * L.w + x] < 3) continue;
        if (DIRS8.some(([dx, dy]) => L.objAt(x + dx, y + dy)) || L.objAt(x, y)) continue;
        return { x, y };
      }
      return null;
    };
    const addObj = (type, r, extra) => { const p = objSpot(r); if (p) return L.addObject(Object.assign({ type, x: p.x, y: p.y, used: false, solid: true }, extra)); return null; };
    for (const s of specials) {
      if (s.pedestal) { const p = L.near(s.r.cx, s.r.cy, (x, y) => openAround(L, x, y) && !L.objAt(x, y), 3); if (p) L.addObject({ type: 'pedestal', x: p.x, y: p.y, used: false, solid: true, quest: s.pedestal }); }
      if (s.boss === 'butcher') for (let k = 0; k < 6; k++) { const p = objSpot(s.r); if (p) L.addObject({ type: 'corpse', x: p.x, y: p.y, used: true, solid: false }); }
    }
    const pickR = () => rng.pick(rooms);
    const barrels = th.id === 'caves' ? rng.int(3, 6) : rng.int(7, 13);
    for (let i = 0; i < barrels; i++) addObj('barrel', pickR(), { explosive: th.id === 'hell' && rng.chance(0.2) });
    for (let i = rng.int(2, 4); i > 0; i--) addObj(rng.chance(0.25) ? 'bigchest' : 'chest', pickR(), { trap: n >= 2 && rng.chance(0.2) });
    for (let i = rng.int(1, 2); i > 0; i--) addObj('shrine', pickR(), { shrine: rng.pick(SHRINES) });
    if (th.id === 'cathedral') for (let i = rng.int(2, 4); i > 0; i--) addObj('sarcophagus', pickR());
    if (rng.chance(0.35)) addObj(rng.chance(0.5) ? 'rack' : 'bookcase', pickR());
    if (rng.chance(0.3)) addObj(rng.chance(0.6) ? 'fountain_blood' : 'fountain_mana', pickR());
    L.genObjects = L.objects.length;
    // monsters
    let sid = 0;
    const pool = MONSTERS.filter(m => n >= m.lvl[0] && n <= m.lvl[1]);
    const types = []; const shuffled = pool.slice().sort(() => rng.next() - 0.5);
    for (const m of shuffled) if (types.length < 4) types.push(m);
    const freeSpot = (cx, cy, r = 3) => L.near(cx, cy, (x, y) => L.free(x, y) && dist[y * L.w + x] >= 0, r);
    const spawnAt = (def, x, y, extra) => { const m = createMonster(game, def, n, rng, extra); m.sid = sid++; L.place(m, x, y); m.spawnX = x; m.spawnY = y; L.monsters.push(m); return m; };
    let packId = 1;
    const target = Math.min(55, 20 + n * 2);
    let guard = 0;
    while (L.monsters.length < target && guard++ < 300) {
      const def = rng.pick(types);
      const x0 = rng.int(2, L.w - 3), y0 = rng.int(2, L.h - 3);
      if (!L.free(x0, y0) || dist[y0 * L.w + x0] < 10) continue;
      const size = rng.int(def.pack[0], def.pack[1]), pid = packId++;
      for (let k = 0; k < size; k++) { const p = freeSpot(x0, y0); if (p) spawnAt(def, p.x, p.y, { pack: pid }); }
    }
    // elites
    const elites = n >= 2 ? (n >= 6 ? 2 : 1) : 0;
    for (let e = 0; e < elites; e++) {
      for (let a = 0; a < 50; a++) {
        const r = pickR(); if (r.stairs && r === upR) continue;
        const p = freeSpot(r.cx, r.cy); if (!p || dist[p.y * L.w + p.x] < 12) continue;
        const def = rng.pick(types), pid = packId++;
        spawnAt(def, p.x, p.y, { pack: pid, elite: true });
        for (let k = rng.int(2, 4); k > 0; k--) { const q = freeSpot(p.x, p.y); if (q) spawnAt(def, q.x, q.y, { pack: pid }); }
        break;
      }
    }
    for (const s of specials) if (s.boss) {
      const p = freeSpot(s.r.cx, s.r.cy, 4) || freeSpot(s.r.cx, s.r.cy, 8); if (!p) continue;
      const pid = packId++, boss = spawnAt(BOSSES[s.boss], p.x, p.y, { pack: pid, boss: s.boss });
      if (s.pack) { const def = MONSTERS.find(m => m.id === s.pack[0]); for (let k = 0; k < s.pack[1]; k++) { const q = freeSpot(p.x, p.y, 4); if (q) spawnAt(def, q.x, q.y, { pack: pid }); } }
      L.bossRoom = s.r; boss.room = s.r;
    }
    return L;
  }

  function genTown(game) {
    const L = new Level(0, 44, 44, 777); const rng = new RNG(777);
    L.tiles.fill(T.GRASS);
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      if (x < 2 || y < 2 || x > 41 || y > 41) L.set(x, y, T.TREE);
      else if ((x < 5 || y < 4 || x > 39 || y > 39) && rng.chance(0.35)) L.set(x, y, T.TREE);
    }
    for (let y = 2; y < 42; y++) { L.set(37, y, T.WATER); L.set(38, y, T.WATER); }
    const road = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) L.set(x, y, T.DIRT); };
    road(12, 8, 13, 21); road(6, 20, 36, 21); road(21, 8, 22, 36); road(12, 8, 22, 9); road(14, 27, 34, 28); road(30, 21, 31, 32);
    for (let y = 20; y <= 21; y++) { L.set(37, y, T.BRIDGE); L.set(38, y, T.BRIDGE); L.set(39, y, T.DIRT); L.set(40, y, T.DIRT); }
    L.buildings = [];
    const house = (x, y, w, h, kind, roof) => { carve(L, x, y, w, h, T.HOUSE); L.buildings.push({ x, y, w, h, kind, roof }); };
    house(8, 2, 9, 5, 'cathedral', '#5a5a66');
    house(14, 11, 5, 4, 'tavern', '#7a3a28');
    house(24, 12, 5, 4, 'smithy', '#4a4a4a');
    house(12, 23, 5, 3, 'healer', '#6a5a2a');
    house(31, 29, 4, 3, 'witch', '#3a4a2a');
    house(5, 30, 4, 3, 'hut', '#6a4028');
    house(25, 33, 5, 3, 'hut', '#5a3a28');
    house(26, 5, 4, 3, 'hut', '#704830');
    L.heights = new Float32Array(L.w * L.h);
    for (const b of L.buildings) for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) {
      const ridge = (b.h - 1) / 2, d = Math.abs(j - b.y - ridge) / Math.max(1, ridge + 0.5);
      L.heights[j * L.w + i] = (b.kind === 'cathedral' ? 70 : 42) + (1 - d) * (b.kind === 'cathedral' ? 40 : 22);
    }
    for (let k = 0; k < 40; k++) { const x = rng.int(3, 36), y = rng.int(3, 40); if (L.get(x, y) === T.GRASS && !DIRS8.some(([dx, dy]) => L.get(x + dx, y + dy) === T.DIRT || L.get(x + dx, y + dy) === T.HOUSE)) L.set(x, y, T.TREE); }
    L.set(12, 7, T.DOWN); L.set(13, 7, T.DIRT); L.down = { x: 12, y: 7 }; L.up = null;
    L.addObject({ type: 'well', x: 24, y: 19, used: true, solid: true });
    L.start = { x: 21, y: 19 }; L.portalSpot = { x: 18, y: 22 };
    for (const d of NPCS) {
      const npc = { kind: 'npc', id: d.id, name: d.name, title: d.title, look: d.look, dirX: 1, dirY: 1, talkIdx: 0 };
      if (L.get(d.x, d.y) === T.TREE || L.get(d.x, d.y) === T.HOUSE) L.set(d.x, d.y, T.GRASS);
      L.place(npc, d.x, d.y); L.npcs.push(npc);
    }
    return L;
  }

  // ===================================================================================== MONSTERS
  function createMonster(game, def, dlvl, rng, extra = {}) {
    const hp = rng.int(def.hp[0], def.hp[1]);
    const m = {
      kind: 'monster', def, id: def.id, name: def.name, look: def.look, color: def.color, hp, maxHp: hp, dmg: def.dmg.slice(), ac: def.ac, toHit: def.toHit,
      mlvl: def.mlvl, xp: def.xp, resist: Object.assign({}, def.resist), speed: def.speed, atkTime: def.atk, ai: def.ai, range: def.range || 0, proj: def.proj,
      active: false, dirX: 1, dirY: 1, think: rng.next(), cool: 0.5 + rng.next(), fear: 0, stoneT: 0, pack: extra.pack || 0, boss: extra.boss || null, elite: !!extra.elite, uidm: game.uid++
    };
    if (m.boss) m.name = def.name;
    if (extra.elite) {
      const mod = rng.pick(['fast', 'fire', 'tough', 'magic']);
      m.name = `${rng.pick(ELITE_NAMES.first)} ${rng.pick(ELITE_NAMES.title)}`;
      m.hp = m.maxHp = Math.round(def.hp[1] * 3 + 10 * (mod === 'tough' ? 2 : 1));
      m.dmg = [Math.round(def.dmg[0] * 1.6), Math.round(def.dmg[1] * 1.6)];
      m.ac += 20; m.toHit += 20; m.xp *= 2; m.mlvl += 4; m.mod = mod;
      if (mod === 'fast') { m.speed *= 1.4; m.atkTime *= 0.7; }
      if (mod === 'fire') m.resist.fire = 75;
      if (mod === 'magic') m.resist.magic = 75;
    }
    return m;
  }

  // ===================================================================================== GAME
  class Game {
    constructor(opts = {}) {
      this.seed = (opts.seed != null ? opts.seed : Math.floor(Math.random() * 2 ** 31)) >>> 0;
      this.rng = new RNG(hashSeed(this.seed, 99991));
      this.uid = 1; this.events = []; this.time = 0; this.levels = new Map(); this.levelStates = {};
      this.quests = { butcher: 0, leoric: 0, magicrock: 0, anvil: 0, lazarus: 0, diablo: 0 };
      this.portal = null; this.maxDepth = 0; this.needRestock = false; this.victory = false; this.timers = [];
      this.shops = { griswold: [], premium: [], pepin: [], adria: [], wirt: null, wirtSeen: false };
      if (opts.restore) return;
      this.hero = this.createHero(opts.cls || 'warrior', opts.name || 'Герой');
      this.restock();
      this.enterLevel(0, 'start');
      this.message(`Добро пожаловать в Тристрам, ${this.hero.name}.`);
    }
    emit(t, data = {}) { data.t = t; this.events.push(data); if (this.events.length > 300) this.events.shift(); }
    sfx(id, extra) { this.emit('sfx', Object.assign({ id }, extra)); }
    message(text) { this.emit('msg', { text }); }
    drainEvents() { const e = this.events; this.events = []; return e; }
    later(delay, fn) { this.timers.push({ at: this.time + delay, fn }); }

    // ---------------------------------------------------------------- items
    newItem(baseId, opts = {}) {
      const b = BASE[baseId], rng = opts.rng || this.rng;
      const it = { uid: this.uid++, base: baseId, quality: 'normal', identified: true, affixes: [] };
      if (b.dmg) it.dmg = b.dmg.slice();
      if (b.ac) it.acBase = rng.int(b.ac[0], b.ac[1]);
      if (b.dur) { it.maxDur = b.dur; it.dur = b.dur; }
      if (baseId === 'book') it.spell = opts.spell;
      if (baseId === 'gold') it.qty = opts.qty || 1;
      if (b.cls === 'staff' && (opts.staffSpell || (opts.ilvl && rng.chance(0.5)))) {
        const cands = Object.values(SPELLS).filter(s => !s.scrollOnly && s.id !== 'townportal' && s.qlvl <= (opts.ilvl || 1));
        const sp = opts.staffSpell || rng.pick(cands).id;
        it.staffSpell = sp; it.maxCharges = it.charges = opts.charges || rng.int(8, 24);
      }
      return it;
    }
    makeMagic(it, ilvl, rng = this.rng) {
      const b = baseOf(it), kind = itemKind(b); if (!kind) return it;
      const pick = list => {
        const all = list.filter(a => a.on.includes(kind) && a.qlvl <= Math.max(1, ilvl));
        const top = all.filter(a => a.qlvl >= Math.floor(ilvl / 2.5));
        const src = top.length ? top : all; return src.length ? src[Math.floor(rng.next() * src.length)] : null;
      };
      let wantPre = rng.chance(0.6), wantSuf = rng.chance(0.6); if (!wantPre && !wantSuf) (rng.chance(0.5) ? wantPre = true : wantSuf = true);
      it.affixes = [];
      if (wantPre) { const a = pick(PREFIXES); if (a) it.affixes.push({ slot: 'pre', i: PREFIXES.indexOf(a), prop: a.prop, value: rng.int(a.min, a.max) }); }
      if (wantSuf) { const a = pick(SUFFIXES); if (a) it.affixes.push({ slot: 'suf', i: SUFFIXES.indexOf(a), prop: a.prop, value: rng.int(a.min, a.max) }); }
      if (!it.affixes.length) return it;
      it.quality = 'magic'; it.identified = false;
      const p = propsOf(it);
      if (it.maxDur && p.durPct) { it.maxDur = Math.round(it.maxDur * (1 + p.durPct / 100)); it.dur = it.maxDur; }
      if (p.indestructible) it.indestructible = true;
      if (it.staffSpell && p.charges) { it.maxCharges *= p.charges; it.charges = it.maxCharges; }
      return it;
    }
    makeUnique(uid) {
      const u = UNIQUES.find(x => x.id === uid), it = this.newItem(u.base);
      it.quality = 'unique'; it.unique = u.id; it.identified = false; it.affixes = [];
      if (u.dmg) it.dmg = u.dmg.slice();
      if (BASE[u.base].ac) it.acBase = BASE[u.base].ac[1];
      return it;
    }
    randomItem(ilvl, opts = {}) {
      const rng = this.rng;
      if (opts.consumable || (!opts.equip && rng.chance(0.45))) return this.randomConsumable(ilvl);
      if (rng.chance(opts.uniqueChance != null ? opts.uniqueChance : 0.012 + ilvl * 0.0015)) {
        const us = UNIQUES.filter(u => u.qlvl <= ilvl);
        if (us.length) { const it = this.makeUnique(rng.pick(us).id); if (opts.identify) it.identified = true; return it; }
      }
      const cands = BASES.filter(b => slotFor(b) && b.qlvl <= Math.max(1, ilvl) && (!opts.cls || opts.cls.includes(b.cls)));
      const b = rng.pick(cands), it = this.newItem(b.id, { ilvl });
      const magicChance = b.jewel ? 1 : Math.min(0.9, 0.12 + ilvl * 0.025 + (opts.magicBonus || 0));
      if (rng.chance(magicChance)) this.makeMagic(it, ilvl);
      if (opts.identify) it.identified = true;
      return it;
    }
    randomConsumable(ilvl) {
      const rng = this.rng;
      const list = [['potion_heal', 40], ['potion_mana', 30], ['scroll_identify', 8], ['scroll_portal', 6], ['scroll_heal', 4]];
      if (ilvl >= 3) list.push(['potion_rejuv', 8]);
      if (ilvl >= 6) list.push(['potion_fullheal', 6], ['potion_fullmana', 5]);
      for (const b of BASES) if (b.cls === 'scroll' && b.qlvl > 1 && b.qlvl <= ilvl) list.push([b.id, 3]);
      if (ilvl >= 15) list.push(['elixir_str', 1], ['elixir_mag', 1], ['elixir_dex', 1], ['elixir_vit', 0.5]);
      const spells = Object.values(SPELLS).filter(s => !s.scrollOnly && s.qlvl <= ilvl);
      if (spells.length) list.push(['book', 3]);
      const id = rng.weighted(list);
      return this.newItem(id, { spell: id === 'book' ? rng.pick(spells).id : undefined });
    }
    dropItem(L, item, x, y) {
      const p = L.near(x, y, (i, j) => !L.blocked(i, j) && !L.itemAt(i, j), 5) || L.near(x, y, (i, j) => !L.blocked(i, j), 8);
      if (!p) return null;
      const f = { item, x: p.x, y: p.y, t: 0 }; L.items.push(f); this.sfx(item.base === 'gold' ? 'golddrop' : 'itemdrop'); return f;
    }
    dropGold(L, amount, x, y) { return this.dropItem(L, this.newItem('gold', { qty: Math.max(1, Math.round(amount)) }), x, y); }

    // ---------------------------------------------------------------- hero
    createHero(cls, name) {
      const c = CLASSES[cls];
      const h = {
        kind: 'hero', name: String(name).slice(0, 15) || 'Герой', cls, level: 1, xp: 0, base: Object.assign({}, c.base), points: 0, gold: 100, life: 1, mana: 1,
        inv: [], equip: { head: null, amulet: null, body: null, weapon: null, shield: null, ring1: null, ring2: null }, belt: new Array(8).fill(null),
        spells: {}, cur: { id: c.skill, src: 'skill' }, hot: [null, null, null, null], cursor: null, mode: null, manaShield: false,
        dirX: 1, dirY: 1, path: null, order: null, action: null, dead: false, kills: 0
      };
      this.hero = h;
      if (cls === 'warrior') { h.equip.weapon = this.newItem('shortsword'); h.equip.shield = this.newItem('buckler'); this.invAdd(this.newItem('club')); }
      if (cls === 'rogue') { h.equip.weapon = this.newItem('shortbow'); }
      if (cls === 'sorcerer') { h.equip.weapon = this.newItem('shortstaff', { staffSpell: 'lightning', charges: 20 }); h.spells.firebolt = 2; h.cur = { id: 'firebolt', src: 'spell' }; }
      h.belt[0] = this.newItem('potion_heal'); h.belt[1] = this.newItem('potion_heal');
      if (cls === 'sorcerer') { h.belt[2] = this.newItem('potion_mana'); h.belt[3] = this.newItem('potion_mana'); }
      this.recalc(); h.life = h.stats.maxLife; h.mana = h.stats.maxMana;
      return h;
    }
    recalc() {
      const h = this.hero; h.stats = computeStats(h);
      h.life = Math.min(h.life, h.stats.maxLife); h.mana = Math.min(h.mana, h.stats.maxMana);
    }
    spellLevel(id) { const h = this.hero; const base = h.spells[id] || 0; return base ? Math.max(1, base + (h.stats.spellBonus || 0)) : 0; }
    manaCost(id) { const sp = SPELLS[id], l = Math.max(1, this.spellLevel(id)); return Math.max(Math.ceil(sp.mana / 2), sp.mana - (l - 1)); }
    // inventory -------------------------------------------------------------
    invCells() { const g = new Array(INV_W * INV_H).fill(null); for (const e of this.hero.inv) { const b = baseOf(e.item); for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) g[(e.y + j) * INV_W + e.x + i] = e; } return g; }
    invAt(x, y) { if (x < 0 || y < 0 || x >= INV_W || y >= INV_H) return null; return this.invCells()[y * INV_W + x]; }
    invFits(item, x, y, ignore) {
      const b = baseOf(item); if (x < 0 || y < 0 || x + b.w > INV_W || y + b.h > INV_H) return false;
      const g = this.invCells();
      for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const e = g[(y + j) * INV_W + x + i]; if (e && e !== ignore) return false; }
      return true;
    }
    invAdd(item) {
      const b = baseOf(item);
      for (let x = 0; x <= INV_W - b.w; x++) for (let y = 0; y <= INV_H - b.h; y++) if (this.invFits(item, x, y)) { this.hero.inv.push({ item, x, y }); return true; }
      return false;
    }
    invRemove(item) { const h = this.hero; const i = h.inv.findIndex(e => e.item === item); if (i >= 0) { h.inv.splice(i, 1); return true; } const bi = h.belt.indexOf(item); if (bi >= 0) { h.belt[bi] = null; return true; } return false; }
    giveItem(item) {
      if (item.base === 'gold') { this.hero.gold += item.qty; return true; }
      const b = baseOf(item);
      if (b.belt) { const i = this.hero.belt.indexOf(null); if (i >= 0) { this.hero.belt[i] = item; return true; } }
      return this.invAdd(item);
    }
    hasItem(pred) { const h = this.hero; return h.inv.map(e => e.item).concat(h.belt.filter(Boolean), Object.values(h.equip).filter(Boolean), h.cursor ? [h.cursor] : []).find(pred) || null; }
    // clicking the inventory grid with/without a held item
    invClick(cx, cy) {
      const h = this.hero;
      if (!h.cursor) { const e = this.invAt(cx, cy); if (!e) return false; h.inv.splice(h.inv.indexOf(e), 1); h.cursor = e.item; this.sfx('pickup'); return true; }
      const b = baseOf(h.cursor);
      const x = clamp(cx - ((b.w - 1) >> 1), 0, INV_W - b.w), y = clamp(cy - ((b.h - 1) >> 1), 0, INV_H - b.h);
      const g = this.invCells(), under = new Set();
      for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const e = g[(y + j) * INV_W + x + i]; if (e) under.add(e); }
      if (under.size > 1) return false;
      const swap = under.size ? [...under][0] : null;
      if (swap) h.inv.splice(h.inv.indexOf(swap), 1);
      h.inv.push({ item: h.cursor, x, y }); h.cursor = swap ? swap.item : null; this.sfx('place');
      return true;
    }
    canEquip(item, slot) {
      const b = baseOf(item), s = slotFor(b);
      if (!s) return false;
      if (s === 'ring' ? !(slot === 'ring1' || slot === 'ring2') : s !== slot) return false;
      return true;
    }
    equipClick(slot) {
      const h = this.hero;
      if (!h.cursor) { const it = h.equip[slot]; if (!it) return false; h.equip[slot] = null; h.cursor = it; this.recalc(); this.sfx('pickup'); return true; }
      if (!this.canEquip(h.cursor, slot)) return false;
      if (!meetsReq(h, h.cursor)) { this.message('Мне не хватает характеристик, чтобы это использовать.'); this.sfx('cant'); return false; }
      const it = h.cursor, b = baseOf(it);
      if (slot === 'shield' && h.equip.weapon && baseOf(h.equip.weapon).two) {
        if (!this.invAdd(h.equip.weapon)) { this.message('Нет места, чтобы убрать двуручное оружие.'); return false; }
        h.equip.weapon = null;
      }
      if (slot === 'weapon' && b.two && h.equip.shield) {
        if (!this.invAdd(h.equip.shield)) { this.message('Нет места, чтобы убрать щит.'); return false; }
        h.equip.shield = null;
      }
      h.cursor = h.equip[slot]; h.equip[slot] = it; this.recalc(); this.sfx('equip');
      return true;
    }
    autoEquip(item) { // right-click in inventory
      const b = baseOf(item), s = slotFor(b); if (!s) return false;
      const slot = s === 'ring' ? (this.hero.equip.ring1 ? (this.hero.equip.ring2 ? 'ring1' : 'ring2') : 'ring1') : s;
      if (!meetsReq(this.hero, item)) { this.message('Мне не хватает характеристик, чтобы это использовать.'); this.sfx('cant'); return false; }
      const h = this.hero, keep = h.cursor; h.cursor = null;
      this.invRemove(item); h.cursor = item;
      const ok = this.equipClick(slot);
      if (h.cursor) { if (!this.invAdd(h.cursor)) this.dropItem(this.level, h.cursor, h.tx, h.ty); h.cursor = null; }
      h.cursor = keep;
      if (!ok) this.invAdd(item);
      return ok;
    }
    beltClick(i) {
      const h = this.hero;
      if (!h.cursor) { if (!h.belt[i]) return false; h.cursor = h.belt[i]; h.belt[i] = null; this.sfx('pickup'); return true; }
      if (!baseOf(h.cursor).belt) return false;
      const prev = h.belt[i]; h.belt[i] = h.cursor; h.cursor = prev; this.sfx('place'); return true;
    }
    dropCursor() {
      const h = this.hero; if (!h.cursor) return false;
      const f = this.dropItem(this.level, h.cursor, h.tx, h.ty); if (!f) return false;
      h.cursor = null; return true;
    }
    stashCursor() { const h = this.hero; if (h.cursor && (this.giveItem(h.cursor) || this.dropItem(this.level, h.cursor, h.tx, h.ty))) h.cursor = null; }
    // use items -------------------------------------------------------------
    useItem(item) {
      const h = this.hero, b = baseOf(item); if (h.dead) return false;
      if (b.use) {
        const s = h.stats, cls = CLASSES[h.cls];
        switch (b.use) {
          case 'heal': h.life = Math.min(s.maxLife, h.life + Math.round(s.maxLife * (0.3 + this.rng.next() * 0.25)) + (h.cls === 'warrior' ? 5 : 0)); break;
          case 'fullheal': h.life = s.maxLife; break;
          case 'mana': h.mana = Math.min(s.maxMana, h.mana + Math.round(s.maxMana * (0.3 + this.rng.next() * 0.25)) + (h.cls === 'sorcerer' ? 5 : 0)); break;
          case 'fullmana': h.mana = s.maxMana; break;
          case 'rejuv': h.life = Math.min(s.maxLife, h.life + Math.round(s.maxLife / 3)); h.mana = Math.min(s.maxMana, h.mana + Math.round(s.maxMana / 3)); break;
          case 'fullrejuv': h.life = s.maxLife; h.mana = s.maxMana; break;
          default: {
            const k = b.use; if (h.base[k] >= cls.max[k]) { this.message('Это больше не поможет.'); return false; }
            h.base[k]++; this.recalc(); this.message(`Характеристика увеличена навсегда!`);
          }
        }
        this.invRemove(item); this.sfx('drink'); return true;
      }
      if (b.spell) {
        if (b.spell === 'identify') { h.mode = 'identify'; h.modeItem = item; this.emit('mode', { mode: 'identify' }); return true; }
        return this.beginCast(b.spell, 'scroll', null, item);
      }
      if (item.base === 'book') {
        const cur = h.spells[item.spell] || 0, req = bookReq(item.spell, cur);
        if (cur >= MAX_SPELL) { this.message('Я уже знаю это заклинание в совершенстве.'); return false; }
        if (h.stats.mag < req) { this.message(`Нужно ${req} магии, чтобы изучить это.`); this.sfx('cant'); return false; }
        h.spells[item.spell] = cur + 1; this.invRemove(item); this.sfx('learn');
        this.message(`${SPELLS[item.spell].name}: уровень ${cur + 1}.`);
        if (!h.cur.id || h.cur.src === 'skill') h.cur = { id: item.spell, src: 'spell' };
        return true;
      }
      if (isEquip(item)) return this.autoEquip(item);
      return false;
    }
    useBelt(i) { const it = this.hero.belt[i]; if (it) return this.useItem(it); return false; }
    // modes: identify / repair / recharge applied to an item
    applyMode(item) {
      const h = this.hero, mode = h.mode; if (!mode || !item) return false;
      if (mode === 'identify') {
        if (item.identified) { this.message('Этот предмет уже опознан.'); return false; }
        item.identified = true; if (h.modeItem) this.invRemove(h.modeItem); this.sfx('learn');
        this.message(`Это ${itemName(item)}.`);
      } else if (mode === 'repair') {
        if (!item.maxDur || item.indestructible || item.dur === item.maxDur) { this.message('Это не нуждается в ремонте.'); h.mode = null; return false; }
        item.maxDur = Math.max(1, item.maxDur - Math.max(1, Math.round((item.maxDur - item.dur) / 10))); item.dur = item.maxDur; this.sfx('repair');
      } else if (mode === 'recharge') {
        if (!item.staffSpell) { this.message('Перезарядить можно только посох.'); h.mode = null; return false; }
        item.maxCharges = Math.max(1, item.maxCharges - 1); item.charges = item.maxCharges; this.sfx('learn');
      } else return false;
      h.mode = null; h.modeItem = null; this.recalc(); return true;
    }
    allItems() { const h = this.hero; return [...h.inv.map(e => e.item), ...h.belt.filter(Boolean), ...Object.values(h.equip).filter(Boolean)]; }

    // ---------------------------------------------------------------- levels
    getLevel(n) {
      let L = this.levels.get(n);
      if (!L) {
        L = n === 0 ? genTown(this) : genDungeon(this, n);
        if (this.levelStates[n]) this.applyLevelState(L, this.levelStates[n]);
        this.levels.set(n, L);
      }
      return L;
    }
    enterLevel(n, how) {
      const h = this.hero, prev = this.level;
      if (prev) { prev.unplace(h); prev.projectiles = []; prev.effects = []; if (prev.index > 0 && n === 0) this.needRestock = true; }
      const L = this.getLevel(n);
      this.level = L; this.syncPortal(L);
      if (n === 0) this.syncTown(L);
      const want = how === 'start' ? L.start : how === 'down' ? L.up : how === 'up' ? L.down : how === 'portal' ? L.portalSpot : how === 'portalBack' ? this.portal : how === 'town' ? L.down : L.start;
      const p = L.near(want.x, want.y, (x, y) => L.free(x, y) && !(x === want.x && y === want.y && L.objAt(x, y)), 8) || L.start || want;
      L.place(h, p.x, p.y);
      h.path = null; h.order = null; h.action = null;
      if (how === 'portalBack') { this.portal = null; this.syncPortal(L); }
      if (n > this.maxDepth) this.maxDepth = n;
      if (n === 0 && this.needRestock) { this.restock(); this.needRestock = false; }
      if (n >= 16 && this.quests.diablo === 0) this.quests.diablo = 1;
      this.updateFOV(true);
      this.emit('level', { n, name: n === 0 ? 'Тристрам' : `${L.theme.name}: уровень ${n}` });
      this.emit('autosave');
    }
    travel(n) { this.enterLevel(n, 'down'); this.sfx('stairs'); }
    syncPortal(L) {
      for (const o of L.objects.filter(o => o.type === 'portal')) L.removeObject(o);
      if (!this.portal) return;
      if (L.index === 0) { const p = L.near(L.portalSpot.x, L.portalSpot.y, (x, y) => !L.blocked(x, y) && !L.actorAt(x, y), 3); if (p) L.addObject({ type: 'portal', x: p.x, y: p.y, solid: false, used: false }); }
      else if (L.index === this.portal.level) L.addObject({ type: 'portal', x: this.portal.x, y: this.portal.y, solid: false, used: false });
    }
    syncTown(L) {
      const t = L.npcs.find(n => n.id === 'townsman');
      if (t && this.quests.butcher > 0) t.dead = true;
    }
    updateFOV(force) {
      const h = this.hero, L = this.level;
      if (!force && h.fovX === h.tx && h.fovY === h.ty) return;
      h.fovX = h.tx; h.fovY = h.ty; computeFOV(L, h.tx, h.ty, h.stats.light + 1);
    }
    levelState(L) {
      let rle = [], cur = 0, run = 0;
      for (let i = 0; i < L.explored.length; i++) { if (L.explored[i] === cur) run++; else { rle.push(run); cur = L.explored[i]; run = 1; } }
      rle.push(run);
      return {
        explored: rle.join(','), dead: [...L.deadSids], items: L.items.map(f => ({ item: f.item, x: f.x, y: f.y })),
        objects: L.objects.filter(o => o.idx < (L.genObjects || 0)).map(o => [o.idx, o.used ? 1 : 0, o.trap ? 1 : 0]),
        doors: [...L.tiles].reduce((a, t, i) => (t === T.DOOR_OPEN && a.push(i), a), []), corpses: L.corpses.slice(-40)
      };
    }
    applyLevelState(L, s) {
      let i = 0, v = 0; for (const run of String(s.explored || '').split(',').map(Number)) { for (let k = 0; k < run && i < L.explored.length; k++) L.explored[i++] = v; v ^= 1; }
      const dead = new Set(s.dead || []); L.deadSids = dead;
      L.monsters = L.monsters.filter(m => { if (dead.has(m.sid)) { L.unplace(m); return false; } return true; });
      L.items = (s.items || []).map(f => ({ item: f.item, x: f.x, y: f.y, t: 1 }));
      for (const [idx, used, trap] of s.objects || []) { const o = L.objects.find(x => x.idx === idx); if (!o) continue; o.used = !!used; o.trap = !!trap; if (o.used && o.type === 'barrel') o.solid = false; }
      for (const d of s.doors || []) if (L.tiles[d] === T.DOOR) L.tiles[d] = T.DOOR_OPEN;
      L.corpses = s.corpses || [];
      if (L.index === 15 && this.quests.lazarus === 2) L.sealed = false;
    }

    // ---------------------------------------------------------------- commands
    heroBusy() { const h = this.hero; return h.dead || !!h.action; }
    cmdMove(x, y) { const h = this.hero; if (h.dead) return; h.order = { type: 'move', x, y }; h.path = null; }
    cmdAttack(target) { const h = this.hero; if (h.dead || !target) return; h.order = { type: 'attack', target }; h.path = null; }
    cmdAttackAt(x, y) { const h = this.hero; if (h.dead || h.action) return; this.startAttack(x, y, null); h.order = null; h.path = null; }
    cmdPickup(f) { const h = this.hero; if (h.dead) return; h.order = { type: 'pickup', target: f }; h.path = null; }
    cmdInteract(o) { const h = this.hero; if (h.dead) return; h.order = { type: 'interact', target: o }; h.path = null; }
    cmdTalk(npc) { const h = this.hero; if (h.dead || npc.dead) return; h.order = { type: 'talk', target: npc }; h.path = null; }
    cmdStairs(x, y) { const h = this.hero; if (h.dead) return; h.order = { type: 'stairs', target: { x, y } }; h.path = null; }
    cmdStop() { const h = this.hero; h.order = null; h.path = null; }
    cmdCast(x, y, target) { return this.beginCast(this.hero.cur.id, this.hero.cur.src, { x, y, target }); }
    setSpell(id, src) { this.hero.cur = { id, src }; }
    availableSpells() {
      const h = this.hero, list = [{ id: CLASSES[h.cls].skill, src: 'skill', name: SKILLS[CLASSES[h.cls].skill].name }];
      for (const id in h.spells) list.push({ id, src: 'spell', name: SPELLS[id].name, level: this.spellLevel(id), mana: this.manaCost(id) });
      const scrolls = {};
      for (const it of [...h.inv.map(e => e.item), ...h.belt.filter(Boolean)]) { const sp = baseOf(it).spell; if (sp && sp !== 'identify') scrolls[sp] = (scrolls[sp] || 0) + 1; }
      for (const id in scrolls) list.push({ id, src: 'scroll', name: SPELLS[id].name, count: scrolls[id] });
      const w = h.equip.weapon; if (w && w.staffSpell) list.push({ id: w.staffSpell, src: 'staff', name: SPELLS[w.staffSpell].name, count: w.charges });
      return list;
    }

    // ---------------------------------------------------------------- update
    update(dt) {
      dt = Math.min(dt, 0.1); this.time += dt;
      const L = this.level, h = this.hero;
      for (let i = this.timers.length - 1; i >= 0; i--) if (this.time >= this.timers[i].at) { const t = this.timers.splice(i, 1)[0]; t.fn(); }
      this.updateHero(dt);
      for (const m of L.monsters.slice()) if (!m.dead) this.updateMonster(m, dt);
      this.updateProjectiles(dt);
      for (let i = L.effects.length - 1; i >= 0; i--) { const e = L.effects[i]; e.t += dt; if (e.t >= e.dur) { L.effects.splice(i, 1); if (e.onEnd) e.onEnd(); } }
      for (const f of L.items) if (f.t < 1) f.t = Math.min(1, f.t + dt * 2.5);
      if (this.level === L) this.updateFOV(false);
      if (!h.dead && L.index > 0) { const regen = h.cls === 'sorcerer' ? 0.25 : h.cls === 'rogue' ? 0.12 : 0.06; h.mana = Math.min(h.stats.maxMana, h.mana + dt * regen * (1 + h.level / 10)); }
    }
    advanceMove(a, dt) {
      if (!a.moving) return;
      const diag = a.tx !== a.fx && a.ty !== a.fy;
      a.moveT += dt * a.speedNow / (diag ? 1.2 : 1);
      if (a.moveT >= 1) { a.moveT = 1; a.moving = false; a.x = a.tx; a.y = a.ty; }
      else { a.x = a.fx + (a.tx - a.fx) * a.moveT; a.y = a.fy + (a.ty - a.fy) * a.moveT; }
    }
    beginStep(a, nx, ny, speed) {
      const L = this.level; L.unplace(a);
      a.fx = a.tx; a.fy = a.ty; a.tx = nx; a.ty = ny; a.moveT = 0; a.moving = true; a.speedNow = speed;
      a.dirX = nx - a.fx; a.dirY = ny - a.fy; L.occ[ny * L.w + nx] = a;
    }
    face(a, x, y) { const dx = x - a.tx, dy = y - a.ty; if (dx || dy) { const l = Math.hypot(dx, dy); a.dirX = dx / l; a.dirY = dy / l; } }
    tickAction(a, dt) {
      const act = a.action; act.t += dt;
      if (!act.fired && act.t >= act.dur * act.hitAt) { act.fired = true; if (act.fn) act.fn(); }
      if (act.t >= act.dur && a.action === act) a.action = null;
    }
    heroSpeed() { return this.level.index === 0 ? 4.2 : 3.6; }
    updateHero(dt) {
      const h = this.hero, L = this.level;
      if (h.dead) return;
      if (h.action) { this.tickAction(h, dt); return; }
      if (h.moving) { this.advanceMove(h, dt); if (h.moving) return; this.onHeroTile(); }
      const o = h.order; if (!o) return;
      const adj = (tx, ty, melee) => Math.max(Math.abs(tx - h.tx), Math.abs(ty - h.ty)) <= 1 && (!melee || L.cornerOk(h.tx, h.ty, tx - h.tx, ty - h.ty));
      switch (o.type) {
        case 'move':
          if (h.tx === o.x && h.ty === o.y) { h.order = null; return; }
          this.followPath(o.x, o.y, (x, y) => x === o.x && y === o.y, true); return;
        case 'attack': {
          const t = o.target;
          if (t.kind === 'monster') {
            if (t.dead || !L.monsters.includes(t)) { h.order = null; return; }
            if (h.stats.ranged) {
              if (lineClear(L, h.tx, h.ty, t.tx, t.ty) && cheb(h, t) <= 12) { this.startAttack(t.tx, t.ty, t); if (!o.hold) h.order = null; return; }
            } else if (adj(t.tx, t.ty, true)) { this.startAttack(t.tx, t.ty, t); if (!o.hold) h.order = null; return; }
            this.followPath(t.tx, t.ty, (x, y) => Math.max(Math.abs(x - t.tx), Math.abs(y - t.ty)) <= 1 && L.cornerOk(x, y, t.tx - x, t.ty - y), false);
          }
          return;
        }
        case 'pickup': {
          const f = o.target; if (!L.items.includes(f)) { h.order = null; return; }
          if (adj(f.x, f.y)) { h.order = null; this.pickUp(f); return; }
          this.followPath(f.x, f.y, (x, y) => (x === f.x && y === f.y) || (Math.max(Math.abs(x - f.x), Math.abs(y - f.y)) <= 1 && L.free(f.x, f.y) === false), true); return;
        }
        case 'interact': case 'talk': case 'stairs': {
          const t = o.target, tx = t.tx != null ? t.tx : t.x, ty = t.ty != null ? t.ty : t.y;
          if (adj(tx, ty)) { h.order = null; this.face(h, tx, ty); if (o.type === 'interact') this.interact(t); else if (o.type === 'talk') { this.emit('talk', { npc: t.id }); this.sfx('talk'); } else this.useStairs(tx, ty); return; }
          this.followPath(tx, ty, (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty)) <= 1, false); return;
        }
      }
    }
    followPath(gx, gy, isGoal, partial) {
      const h = this.hero, L = this.level;
      const pass = (x, y) => L.free(x, y, true);
      if (!h.path || !h.path.length || h.pathGoal !== gx + ',' + gy) {
        h.path = findPath(L, h.tx, h.ty, isGoal, gx, gy, pass, 4000, partial); h.pathGoal = gx + ',' + gy;
        if (!h.path || !h.path.length) { h.path = null; h.order = null; return; }
      }
      const [nx, ny] = h.path[0];
      if (L.get(nx, ny) === T.DOOR) { L.set(nx, ny, T.DOOR_OPEN); this.sfx('door'); this.updateFOV(true); }
      if (!L.free(nx, ny, true)) { h.path = null; h.blockedTries = (h.blockedTries || 0) + 1; if (h.blockedTries > 3) { h.order = null; h.blockedTries = 0; } return; }
      h.blockedTries = 0; h.path.shift(); this.beginStep(h, nx, ny, this.heroSpeed());
      if (h.order && h.order.type === 'attack') h.path = null; // re-plan every tile when chasing
    }
    onHeroTile() { this.updateFOV(true); }
    startAttack(tx, ty, target) {
      const h = this.hero, s = h.stats, L = this.level;
      if (L.index === 0) { h.order = null; return; }
      this.face(h, tx, ty);
      if (s.ranged) {
        h.action = { kind: 'attack', t: 0, dur: s.attackTime, hitAt: 0.55, fn: () => { this.spawnProj('arrow', h.tx, h.ty, tx, ty, 'hero', { dmg: [s.dmgMin, s.dmgMax], toHit: s.toHit, fire: s.fireDmg, light: s.lightDmg }); this.sfx('bow'); this.wear('weapon', 40); } };
      } else {
        h.action = { kind: 'attack', t: 0, dur: s.attackTime, hitAt: 0.55, fn: () => {
          this.sfx('swing');
          const t = target && !target.dead && cheb(h, target) <= 1 ? target : L.actorAt(h.tx + sign(Math.round(h.dirX * 1.4)), h.ty + sign(Math.round(h.dirY * 1.4)));
          if (t && t.kind === 'monster' && !t.dead) this.heroMelee(t);
          const o = L.objAt(h.tx + sign(Math.round(h.dirX * 1.4)), h.ty + sign(Math.round(h.dirY * 1.4)));
          if (!t && o && o.type === 'barrel' && !o.used) this.breakBarrel(o);
        } };
      }
      this.wakeNear(h.tx, h.ty, 5);
    }
    heroMelee(m) {
      const h = this.hero, s = h.stats, rng = this.rng;
      const chance = clamp(s.toHit - m.ac + (m.stoneT > 0 ? 50 : 0), 5, 95);
      if (rng.int(0, 99) >= chance) { this.sfx('miss'); return; }
      let dmg = rng.int(s.dmgMin, s.dmgMax);
      if (h.cls === 'warrior' && rng.int(0, 99) < h.level) { dmg *= 2; this.emit('crit', { x: m.tx, y: m.ty }); }
      this.sfx('hit');
      this.damageMonster(m, dmg, 'phys', { hero: true, knockback: s.knockback });
      if (s.fireDmg && !m.dead) this.damageMonster(m, rng.int(1, s.fireDmg), 'fire', { hero: true, quiet: true });
      if (s.lightDmg && !m.dead) this.damageMonster(m, rng.int(1, s.lightDmg), 'light', { hero: true, quiet: true });
      this.wear('weapon', 25);
    }
    wear(slot, oneIn) {
      const it = this.hero.equip[slot];
      if (!it || !it.maxDur || it.indestructible || it.dur <= 0 || this.rng.int(1, oneIn) !== 1) return;
      it.dur--; if (it.dur === 0) { this.message(`${itemName(it)} сломан!`); this.recalc(); this.sfx('break'); }
      else if (it.dur === 3) this.message(`${itemName(it)}: предмет почти сломан!`);
    }
    pickUp(f) {
      const L = this.level, h = this.hero;
      if (f.item.base !== 'gold' && !this.giveItem(f.item)) { this.message('Мне некуда это положить.'); this.sfx('cant'); return false; }
      if (f.item.base === 'gold') h.gold += f.item.qty;
      L.items.splice(L.items.indexOf(f), 1); this.sfx(f.item.base === 'gold' ? 'gold' : 'pickup');
      if (f.item.base === 'magicrock' && this.quests.magicrock === 0) this.quests.magicrock = 1;
      if (f.item.base === 'anvil' && this.quests.anvil === 0) this.quests.anvil = 1;
      this.emit('pickup', { item: f.item });
      return true;
    }
    useStairs(x, y) {
      const L = this.level, t = L.get(x, y);
      if (t === T.DOWN) {
        if (L.index === 0) { if (this.maxDepth >= 5) { this.emit('stairsMenu', { levels: [1, 5, 9, 13].filter(n => n <= this.maxDepth) }); return; } this.travel(1); return; }
        if (L.sealed) { this.message('Проход запечатан тёмной магией. Сначала нужно одолеть Лазаря.'); this.sfx('cant'); return; }
        this.enterLevel(L.index + 1, 'down'); this.sfx('stairs');
      } else if (t === T.UP) { this.enterLevel(L.index - 1 === 0 ? 0 : L.index - 1, L.index - 1 === 0 ? 'town' : 'up'); this.sfx('stairs'); }
    }

    // ---------------------------------------------------------------- objects
    interact(o) {
      const L = this.level, h = this.hero, rng = this.rng, dl = Math.max(1, L.index);
      if (o.type === 'portal') { this.usePortal(); return; }
      if (h.mode === 'disarm') { this.disarm(o); return; }
      if (o.used && !o.type.startsWith('fountain')) return;
      switch (o.type) {
        case 'barrel': h.action = { kind: 'attack', t: 0, dur: h.stats.attackTime, hitAt: 0.55, fn: () => { this.sfx('swing'); this.breakBarrel(o); } }; this.face(h, o.x, o.y); break;
        case 'chest': case 'bigchest': case 'sarcophagus': {
          o.used = true; this.sfx(o.type === 'sarcophagus' ? 'stone' : 'chest');
          if (o.trap) { o.trap = false; this.trapFire(o, dl); }
          if (o.type === 'sarcophagus' && rng.chance(0.3)) { this.summonAt(MONSTERS.find(m => m.id === 'skeleton'), o.x, o.y); return; }
          const n = o.type === 'bigchest' ? rng.int(2, 3) : 1;
          for (let i = 0; i < n; i++) { if (rng.chance(0.35)) this.dropGold(L, rng.int(dl * 10, dl * 40 + 20), o.x, o.y); else this.dropItem(L, this.randomItem(dl + 1, { magicBonus: o.type === 'bigchest' ? 0.15 : 0 }), o.x, o.y); }
          break;
        }
        case 'rack': o.used = true; this.sfx('chest'); this.dropItem(L, this.randomItem(dl + 2, { equip: true, cls: ['sword', 'axe', 'mace', 'bow', 'staff'], magicBonus: 0.3 }), o.x, o.y); break;
        case 'bookcase': o.used = true; this.sfx('chest'); this.dropItem(L, this.randomConsumable(dl + 3), o.x, o.y); if (rng.chance(0.5)) this.dropItem(L, this.newItem('book', { spell: rng.pick(Object.values(SPELLS).filter(s => !s.scrollOnly && s.qlvl <= dl + 2)).id }), o.x, o.y); break;
        case 'shrine': o.used = true; this.shrine(o.shrine); break;
        case 'fountain_blood': h.life = Math.min(h.stats.maxLife, h.life + Math.max(1, Math.round(h.stats.maxLife * 0.1))); this.sfx('drink'); break;
        case 'fountain_mana': h.mana = Math.min(h.stats.maxMana, h.mana + Math.max(1, Math.round(h.stats.maxMana * 0.1))); this.sfx('drink'); break;
        case 'pedestal': {
          if ((o.quest === 'magicrock' && this.quests.magicrock === 2) || (o.quest === 'anvil' && this.quests.anvil === 2)) { o.used = true; return; }
          o.used = true; const it = this.newItem(o.quest);
          if (!this.giveItem(it)) this.dropItem(L, it, o.x, o.y); else this.sfx('pickup');
          if (this.quests[o.quest] === 0) this.quests[o.quest] = 1;
          this.message(`Найден предмет: ${itemName(it)}.`); break;
        }
      }
    }
    breakBarrel(o) {
      const L = this.level, rng = this.rng, dl = Math.max(1, L.index);
      if (o.used) return; o.used = true; o.solid = false; this.sfx('barrel');
      if (o.explosive) { this.explode(o.x, o.y, 1, [dl * 2, dl * 4], 'fire', 'trap'); return; }
      const r = rng.next();
      if (r < 0.3) this.dropGold(L, rng.int(dl * 4, dl * 15 + 5), o.x, o.y);
      else if (r < 0.45) this.dropItem(L, this.randomConsumable(dl), o.x, o.y);
      else if (r < 0.52) this.dropItem(L, this.randomItem(dl, { equip: true }), o.x, o.y);
      else if (r < 0.57 && L.theme.id === 'cathedral') this.summonAt(MONSTERS.find(m => m.id === 'skeleton'), o.x, o.y);
    }
    trapFire(o, dl) {
      const h = this.hero;
      this.message('Ловушка!'); this.emit('fx', { kind: 'trap', x: o.x, y: o.y });
      this.level.effects.push({ kind: 'explosion', x: h.tx, y: h.ty, t: 0, dur: 0.5, color: '#ff6020' });
      this.damageHero(this.rng.int(dl * 2, dl * 5 + 4), 'fire', null);
    }
    disarm(o) {
      const h = this.hero; h.mode = null;
      if (!o.trap) { this.message('Ловушки здесь нет.'); return; }
      const chance = clamp(h.stats.dex * 2 + 20 - this.level.index * 5, 5, 95);
      if (this.rng.int(0, 99) < chance) { o.trap = false; this.message('Ловушка обезврежена.'); this.sfx('learn'); }
      else { o.trap = false; this.trapFire(o, this.level.index); }
    }
    shrine(kind) {
      const h = this.hero, rng = this.rng, cls = CLASSES[h.cls], stats = ['str', 'mag', 'dex', 'vit'];
      const bump = (k, v) => { h.base[k] = clamp(h.base[k] + v, 1, cls.max[k]); };
      const msgs = {
        mysterious: 'Иногда на пути к цели приходится идти на жертвы.', divine: 'Пей и освежись.', eerie: 'Ты знаешь, что ты не одинок.', glimmering: 'Тайны раскрываются в свете разума.',
        religious: 'Время не властно над праведными.', enchanted: 'Магия приходит к тем, кто готов платить.', cryptic: 'Сила по праву, но не без цены.', spooky: 'Мёртвые не видят того, кто живёт.',
        abandoned: 'Ты чувствуешь себя ловчее.', creepy: 'Ты чувствуешь себя сильнее.', quiet: 'Ты чувствуешь себя выносливее.', magical: 'Тебя окутывает магическая завеса.'
      };
      switch (kind) {
        case 'mysterious': { const k = rng.pick(stats); for (const s of stats) bump(s, s === k ? 5 : -1); break; }
        case 'divine': h.life = h.stats.maxLife; h.mana = h.stats.maxMana; this.dropItem(this.level, this.newItem('potion_fullheal'), h.tx, h.ty); this.dropItem(this.level, this.newItem('potion_fullmana'), h.tx, h.ty); break;
        case 'eerie': bump('mag', 2); break;
        case 'glimmering': for (const it of this.allItems()) it.identified = true; break;
        case 'religious': for (const it of this.allItems()) if (it.maxDur) it.dur = it.maxDur; break;
        case 'enchanted': { const ks = Object.keys(h.spells); if (ks.length) { const up = rng.pick(ks); h.spells[up] = Math.min(MAX_SPELL, h.spells[up] + 1); const down = ks.filter(k => k !== up && h.spells[k] > 1); if (down.length) h.spells[rng.pick(down)]--; } else bump('mag', 1); break; }
        case 'cryptic': h.mana = h.stats.maxMana; this.castNova(Math.max(1, this.spellLevel('nova')), true); break;
        case 'spooky': h.life = h.stats.maxLife; break;
        case 'abandoned': bump('dex', 2); break;
        case 'creepy': bump('str', 2); break;
        case 'quiet': bump('vit', 2); break;
        case 'magical': h.manaShield = true; break;
      }
      this.recalc(); this.sfx('shrine'); this.message(msgs[kind]);
    }
    usePortal() {
      const L = this.level;
      if (!this.portal) return;
      if (L.index === 0) { this.enterLevel(this.portal.level, 'portalBack'); }
      else this.enterLevel(0, 'portal');
      this.sfx('portal');
    }

    // ---------------------------------------------------------------- combat
    damageMonster(m, amount, element, opts = {}) {
      if (m.dead) return 0;
      const L = this.level, h = this.hero, key = { phys: null, fire: 'fire', light: 'light', magic: 'magic' }[element];
      if (key) { const r = m.resist[key] || 0; if (r >= 100) { if (!opts.quiet) this.emit('immune', { x: m.tx, y: m.ty }); return 0; } amount = Math.floor(amount * (1 - r / 100)); }
      amount = Math.max(element === 'phys' ? 1 : 0, Math.round(amount)); if (!amount) return 0;
      m.hp -= amount; this.wake(m);
      this.emit('dmg', { x: m.x, y: m.y, v: amount, el: element });
      if (opts.hero && element === 'phys' && h.stats.leech) h.life = Math.min(h.stats.maxLife, h.life + amount * h.stats.leech / 100);
      if (m.hp <= 0) { this.killMonster(m); return amount; }
      const bossImmune = m.boss && m.boss !== 'butcher';
      if (!bossImmune && m.stoneT <= 0 && amount >= Math.max(2, m.mlvl + 2) && !(m.action && m.action.kind === 'hit')) {
        m.action = { kind: 'hit', t: 0, dur: 0.28, hitAt: 1 };
        if (opts.knockback && !m.moving) { const dx = sign(m.tx - h.tx), dy = sign(m.ty - h.ty), nx = m.tx + dx, ny = m.ty + dy; if (L.free(nx, ny) && L.cornerOk(m.tx, m.ty, dx, dy)) { L.unplace(m); L.place(m, nx, ny); } }
      }
      return amount;
    }
    killMonster(m) {
      const L = this.level, h = this.hero, rng = this.rng;
      m.dead = true; m.hp = 0; L.unplace(m); L.monsters.splice(L.monsters.indexOf(m), 1);
      if (m.sid != null && m.sid >= 0) L.deadSids.add(m.sid);
      L.corpses.push({ x: m.tx, y: m.ty, look: m.look, color: m.color, t: 0, big: !!m.boss });
      if (L.corpses.length > 60) L.corpses.shift();
      h.kills++;
      this.sfx('mdeath', { look: m.look, boss: m.boss });
      let xp = m.xp * (1 + 0.1 * (m.mlvl - h.level)); xp = Math.max(0, Math.floor(xp * XP_MULT));
      this.gainXP(xp);
      // drops
      const il = Math.max(L.index, m.mlvl);
      if (m.def.drop) this.dropItem(L, this.makeUnique(m.def.drop), m.tx, m.ty);
      if (m.boss === 'lazarus' || m.boss === 'diablo') { for (let i = 0; i < 3; i++) this.dropItem(L, this.randomItem(il, { equip: true, magicBonus: 1, uniqueChance: 0.25 }), m.tx, m.ty); this.dropGold(L, rng.int(500, 1500), m.tx, m.ty); }
      else if (m.boss) this.dropGold(L, rng.int(150, 400), m.tx, m.ty);
      else if (m.elite) { this.dropItem(L, this.randomItem(il + 2, { equip: true, magicBonus: 1 }), m.tx, m.ty); this.dropGold(L, rng.int(il * 10, il * 40), m.tx, m.ty); }
      else {
        const r = rng.next();
        if (r < 0.22) this.dropGold(L, rng.int(il * 3, il * 12 + 8), m.tx, m.ty);
        else if (r < 0.34) this.dropItem(L, this.randomConsumable(il), m.tx, m.ty);
        else if (r < 0.43) this.dropItem(L, this.randomItem(il, { equip: true }), m.tx, m.ty);
      }
      // fallen flee when a pack mate dies
      if (m.ai === 'fallen') for (const o of L.monsters) if (o.ai === 'fallen' && o.pack === m.pack && cheb(o, m) < 8) o.fear = 1.5 + rng.next();
      // quests
      if (m.boss === 'butcher') { this.quests.butcher = 2; this.message('Мясник повержен!'); }
      if (m.boss === 'leoric') { this.quests.leoric = 2; this.message('Король Леорик обрёл покой.'); for (const o of L.monsters.filter(x => x.summoned)) this.killMonster(o); }
      if (m.boss === 'lazarus') { this.quests.lazarus = 2; this.quests.diablo = Math.max(1, this.quests.diablo); L.sealed = false; this.message('Лазарь мёртв. Путь в глубины открыт!'); }
      if (m.boss === 'diablo') {
        this.quests.diablo = 2; this.victory = true; this.message('Диабло повержен!');
        L.effects.push({ kind: 'nova', x: m.tx, y: m.ty, t: 0, dur: 2.5, color: '#ff2020' });
        this.later(3.5, () => this.emit('victory'));
      }
    }
    gainXP(xp) {
      const h = this.hero; if (!xp) return;
      h.xp += xp; this.emit('xp', { v: xp });
      while (h.level < 50 && h.xp >= XP[h.level]) {
        h.level++; h.points += 5; this.recalc(); h.life = h.stats.maxLife; h.mana = h.stats.maxMana;
        this.sfx('levelup'); this.emit('levelup', { level: h.level }); this.level.effects.push({ kind: 'levelup', x: h.tx, y: h.ty, t: 0, dur: 1.2 });
      }
    }
    spendPoint(stat) {
      const h = this.hero; if (!h.points || h.base[stat] >= CLASSES[h.cls].max[stat]) return false;
      h.base[stat]++; h.points--; const before = h.stats.maxLife, beforeM = h.stats.maxMana; this.recalc();
      h.life += h.stats.maxLife - before; h.mana += h.stats.maxMana - beforeM; return true;
    }
    damageHero(amount, element, src) {
      const h = this.hero, s = h.stats; if (h.dead) return 0;
      const res = { fire: s.resF, light: s.resL, magic: s.resM }[element] || 0;
      amount = amount * (1 - res / 100) - s.dmgTaken;
      amount = Math.max(1, Math.round(amount));
      if (h.manaShield && h.mana > 0) { const a = Math.min(h.mana, amount); h.mana -= a; amount -= a; if (h.mana < 1) { h.manaShield = false; this.message('Щит маны исчез.'); } }
      if (amount <= 0) { this.sfx('shieldhit'); return 0; }
      h.life -= amount; this.emit('herohit', { v: amount });
      if (this.rng.int(1, 3) === 1) this.wear(this.rng.pick(['head', 'body', 'body', 'shield']), 12);
      if (h.life <= 0.5) { this.heroDie(); return amount; }
      if (amount >= h.level && (!h.action || h.action.kind !== 'block')) { h.action = { kind: 'hit', t: 0, dur: h.cls === 'warrior' ? 0.15 : 0.25, hitAt: 1 }; this.sfx('herohurt', { cls: h.cls }); }
      return amount;
    }
    heroDie() {
      const h = this.hero; h.life = 0; h.dead = true; h.action = null; h.order = null; h.path = null; h.manaShield = false;
      this.sfx('herodeath', { cls: h.cls }); this.emit('death');
    }
    respawn() {
      const h = this.hero; h.dead = false; h.life = h.stats.maxLife; h.mana = h.stats.maxMana;
      const lost = Math.floor(h.gold / 2); h.gold -= lost;
      this.enterLevel(0, 'start');
      this.message(lost ? `Ты очнулся в Тристраме. Потеряно ${lost} золота.` : 'Ты очнулся в Тристраме.');
    }
    monsterHitHero(m, projectile) {
      const h = this.hero, s = h.stats, rng = this.rng;
      const chance = clamp(30 + m.toHit + 2 * (m.mlvl - h.level) - s.ac, 15, 95);
      if (rng.int(0, 99) >= chance) { this.sfx('miss'); return; }
      if (s.block && (!h.action || h.action.kind === 'block') && !h.moving) {
        const bc = clamp(s.block + 2 * (h.level - m.mlvl), 0, 75);
        if (rng.int(0, 99) < bc) { h.action = { kind: 'block', t: 0, dur: 0.2, hitAt: 1 }; this.face(h, m.tx, m.ty); this.sfx('block'); this.wear('shield', 10); return; }
      }
      this.damageHero(rng.int(m.dmg[0], m.dmg[1]), 'phys', m);
      if (m.mod === 'fire') this.damageHero(rng.int(1, Math.max(2, m.mlvl)), 'fire', m);
      if (!projectile && s.thorns && !m.dead) this.damageMonster(m, rng.int(1, s.thorns * 3), 'phys', {});
    }
    wake(m) {
      if (m.active) return; m.active = true;
      if (m.def.bark) { this.emit('bark', { text: m.def.bark, name: m.name, boss: m.boss }); this.sfx('bark', { boss: m.boss }); }
      for (const o of this.level.monsters) if (!o.active && o.pack && o.pack === m.pack && cheb(o, m) <= 10) this.wake(o);
    }
    wakeNear(x, y, r) { for (const m of this.level.monsters) if (!m.active && Math.max(Math.abs(m.tx - x), Math.abs(m.ty - y)) <= r) this.wake(m); }
    summonAt(def, x, y) {
      const L = this.level, p = L.near(x, y, (i, j) => L.free(i, j), 3); if (!p) return null;
      const m = createMonster(this, def, L.index, this.rng, {}); m.sid = -1; m.summoned = true; m.active = true; L.place(m, p.x, p.y); L.monsters.push(m);
      L.effects.push({ kind: 'summon', x: p.x, y: p.y, t: 0, dur: 0.6 }); return m;
    }

    // ---------------------------------------------------------------- monster AI
    updateMonster(m, dt) {
      const L = this.level, h = this.hero, rng = this.rng;
      if (m.stoneT > 0) { m.stoneT -= dt; return; }
      if (m.action) { this.tickAction(m, dt); return; }
      if (m.moving) { this.advanceMove(m, dt); if (m.moving) return; }
      m.think -= dt; m.cool -= dt; if (m.retreat > 0) m.retreat -= dt; if (m.chargeT > 0) m.chargeT -= dt;
      if (h.dead || L.index === 0) return;
      const d = cheb(m, h);
      if (!m.active) { if (d <= 7 && L.visible[m.ty * L.w + m.tx]) this.wake(m); else return; }
      if (d > 25) return;
      m.invisible = m.ai === 'hidden' && d > 2;
      if (m.fear > 0) { m.fear -= dt; this.stepAway(m, h); return; }
      if (m.boss === 'leoric' && m.cool <= 0 && L.monsters.filter(x => x.summoned).length < 5) {
        m.cool = 6; m.action = { kind: 'cast', t: 0, dur: 0.8, hitAt: 0.7, fn: () => { for (let i = 0; i < 2; i++) this.summonAt(MONSTERS.find(x => x.id === 'skeleton'), m.tx, m.ty); this.sfx('summon'); } };
        return;
      }
      const meleeOk = d === 1 && L.cornerOk(m.tx, m.ty, h.tx - m.tx, h.ty - m.ty);
      const los = () => lineClear(L, m.tx, m.ty, h.tx, h.ty);
      const ranged = m.ai === 'ranged' || m.ai === 'caster';
      if (ranged) {
        if (m.ai === 'caster' && meleeOk && m.boss !== 'diablo' && rng.chance(0.5) && m.cool <= 0.5) { this.teleportMonster(m); return; }
        if (meleeOk && (m.boss === 'diablo' || rng.chance(0.4) || !this.stepAway(m, h))) { this.monsterMelee(m); return; }
        if (d <= m.range && m.cool <= 0 && los()) { this.monsterShoot(m); return; }
        if (d > m.range - 2 || !los()) this.chase(m, dt); else if (rng.chance(0.02)) this.randomStep(m);
        return;
      }
      if (m.ai === 'bat' && m.retreat > 0) { this.stepAway(m, h); return; }
      if (m.ai === 'charge' && d >= 3 && d <= 6 && m.cool <= 0 && los()) { m.chargeT = 1.2; m.cool = 4; this.sfx('charge'); }
      if (meleeOk) { this.monsterMelee(m); return; }
      this.chase(m, dt);
    }
    monsterMelee(m) {
      const h = this.hero; this.face(m, h.tx, h.ty);
      m.action = { kind: 'attack', t: 0, dur: m.atkTime, hitAt: 0.6, fn: () => {
        if (this.hero.dead) return;
        if (cheb(m, this.hero) <= 1) { this.monsterHitHero(m); this.sfx('mattack', { look: m.look }); }
        if (m.ai === 'bat') m.retreat = 0.7;
      } };
    }
    monsterShoot(m) {
      const h = this.hero; this.face(m, h.tx, h.ty);
      const kind = m.proj;
      m.cool = (kind === 'apocalypse' ? 2.4 : 1.1) + this.rng.next() * 1.4;
      m.action = { kind: kind === 'arrow' ? 'attack' : 'cast', t: 0, dur: m.atkTime + 0.2, hitAt: 0.6, fn: () => {
        if (this.hero.dead) return;
        const hh = this.hero;
        if (kind === 'apocalypse') {
          for (const off of [-0.35, 0, 0.35]) { const a = Math.atan2(hh.ty - m.ty, hh.tx - m.tx) + off; this.spawnProj('bloodstar', m.tx, m.ty, m.tx + Math.cos(a) * 5, m.ty + Math.sin(a) * 5, 'monster', { src: m, dmg: [20, 40], element: 'magic' }); }
          const x = hh.tx, y = hh.ty; this.level.effects.push({ kind: 'warning', x, y, t: 0, dur: 0.9, onEnd: () => this.explode(x, y, 1, m.dmg, 'fire', 'monster', m) });
          this.sfx('apocalypse'); return;
        }
        const el = { arrow: 'phys', acid: 'magic', magma: 'fire', bolt: 'light', bloodstar: 'magic', fireball: 'fire' }[kind];
        this.spawnProj(kind, m.tx, m.ty, hh.tx, hh.ty, 'monster', { src: m, dmg: m.dmg, element: el });
        this.sfx(kind === 'arrow' ? 'bow' : kind === 'bolt' ? 'lightning' : 'firecast');
      } };
    }
    teleportMonster(m) {
      const L = this.level, h = this.hero;
      for (let a = 0; a < 30; a++) {
        const x = h.tx + this.rng.int(-6, 6), y = h.ty + this.rng.int(-6, 6);
        if (Math.max(Math.abs(x - h.tx), Math.abs(y - h.ty)) < 3 || !L.free(x, y) || !lineClear(L, x, y, h.tx, h.ty)) continue;
        L.effects.push({ kind: 'teleport', x: m.tx, y: m.ty, t: 0, dur: 0.4 });
        L.unplace(m); L.place(m, x, y); m.cool = 1; m.path = null; this.sfx('teleport'); return true;
      }
      this.monsterMelee(m); return false;
    }
    chase(m, dt) {
      const L = this.level, h = this.hero;
      const speed = m.speed * (m.chargeT > 0 ? 3 : 1);
      if (!m.path || !m.path.length || m.think <= 0) {
        m.think = 0.45 + this.rng.next() * 0.35;
        m.path = findPath(L, m.tx, m.ty, (x, y) => Math.max(Math.abs(x - h.tx), Math.abs(y - h.ty)) <= 1 && L.cornerOk(x, y, h.tx - x, h.ty - y), h.tx, h.ty, (x, y) => L.free(x, y), 350, true);
      }
      if (m.path && m.path.length) {
        const [nx, ny] = m.path[0];
        if (L.free(nx, ny) && L.cornerOk(m.tx, m.ty, nx - m.tx, ny - m.ty)) { m.path.shift(); this.beginStep(m, nx, ny, speed); return; }
        m.path = null;
      }
      // greedy fallback
      const opts = DIRS8.map(([dx, dy]) => [m.tx + dx, m.ty + dy]).filter(([x, y]) => L.free(x, y) && L.cornerOk(m.tx, m.ty, x - m.tx, y - m.ty))
        .sort((a, b) => Math.hypot(a[0] - h.tx, a[1] - h.ty) - Math.hypot(b[0] - h.tx, b[1] - h.ty));
      if (opts.length && Math.hypot(opts[0][0] - h.tx, opts[0][1] - h.ty) < Math.hypot(m.tx - h.tx, m.ty - h.ty)) this.beginStep(m, opts[0][0], opts[0][1], speed);
    }
    stepAway(m, from) {
      const L = this.level;
      const opts = DIRS8.map(([dx, dy]) => [m.tx + dx, m.ty + dy]).filter(([x, y]) => L.free(x, y) && L.cornerOk(m.tx, m.ty, x - m.tx, y - m.ty))
        .sort((a, b) => Math.hypot(b[0] - from.tx, b[1] - from.ty) - Math.hypot(a[0] - from.tx, a[1] - from.ty));
      if (opts.length && Math.hypot(opts[0][0] - from.tx, opts[0][1] - from.ty) > Math.hypot(m.tx - from.tx, m.ty - from.ty)) { this.beginStep(m, opts[0][0], opts[0][1], m.speed); return true; }
      return false;
    }
    randomStep(m) { const L = this.level, [dx, dy] = this.rng.pick(DIRS8); if (L.free(m.tx + dx, m.ty + dy) && L.cornerOk(m.tx, m.ty, dx, dy)) this.beginStep(m, m.tx + dx, m.ty + dy, m.speed * 0.6); }

    // ---------------------------------------------------------------- projectiles
    spawnProj(kind, x, y, tx, ty, owner, o = {}) {
      const speed = { arrow: 12, firebolt: 11, fireball: 9, lightning: 22, nova: 9, acid: 8, magma: 8, bolt: 16, bloodstar: 8 }[kind] || 10;
      let dx = tx - x, dy = ty - y, len = Math.hypot(dx, dy); if (len < 0.01) { dx = this.hero.dirX; dy = this.hero.dirY; len = Math.hypot(dx, dy) || 1; }
      const p = Object.assign({ kind, x, y, ox: x, oy: y, vx: dx / len * speed, vy: dy / len * speed, owner, dist: 0, range: o.range || 14, hits: new Set(), t: 0 }, o);
      this.level.projectiles.push(p); return p;
    }
    updateProjectiles(dt) {
      const L = this.level, h = this.hero;
      for (let i = L.projectiles.length - 1; i >= 0; i--) {
        const p = L.projectiles[i]; p.t += dt;
        const sp = Math.hypot(p.vx, p.vy), steps = Math.max(1, Math.ceil(sp * dt / 0.2));
        let dead = false;
        for (let s = 0; s < steps && !dead; s++) {
          p.x += p.vx * dt / steps; p.y += p.vy * dt / steps; p.dist += sp * dt / steps;
          const tx = Math.round(p.x), ty = Math.round(p.y);
          if (p.dist > p.range) { dead = true; if (p.kind === 'fireball') this.explode(p.x, p.y, 1, p.dmg, 'fire', p.owner, p.src); break; }
          const o = L.objAt(tx, ty);
          if (L.opaque(tx, ty) || (o && o.solid && !(tx === Math.round(p.ox) && ty === Math.round(p.oy)))) {
            dead = true; if (p.kind === 'fireball') this.explode(p.x - p.vx * dt / steps, p.y - p.vy * dt / steps, 1, p.dmg, 'fire', p.owner, p.src);
            if (o && o.type === 'barrel' && p.owner === 'hero') this.breakBarrel(o);
            break;
          }
          const a = L.actorAt(tx, ty); if (!a || p.hits.has(a)) continue;
          if (p.owner === 'hero' && a.kind === 'monster' && !a.dead) {
            p.hits.add(a); const pierce = p.kind === 'lightning' || p.kind === 'nova';
            if (p.kind === 'fireball') { this.explode(p.x, p.y, 1, p.dmg, 'fire', 'hero'); dead = true; break; }
            if (p.kind === 'arrow') {
              const chance = clamp(p.toHit - a.ac - Math.round(p.dist), 5, 95);
              if (this.rng.int(0, 99) < chance) {
                this.sfx('arrowhit'); this.damageMonster(a, this.rng.int(p.dmg[0], p.dmg[1]), 'phys', { hero: true, knockback: h.stats.knockback });
                if (p.fire && !a.dead) this.damageMonster(a, this.rng.int(1, p.fire), 'fire', { hero: true, quiet: true });
                if (p.light && !a.dead) this.damageMonster(a, this.rng.int(1, p.light), 'light', { hero: true, quiet: true });
              }
            } else this.damageMonster(a, this.rng.int(p.dmg[0], p.dmg[1]), p.element, { hero: true });
            if (!pierce) { dead = true; break; }
          } else if (p.owner === 'monster' && a === h) {
            p.hits.add(a); dead = true;
            if (p.kind === 'arrow') this.monsterHitHero(p.src, true);
            else if (p.kind === 'fireball') this.explode(p.x, p.y, 1, p.dmg, 'fire', 'monster', p.src);
            else this.damageHero(this.rng.int(p.dmg[0], p.dmg[1]), p.element, p.src);
            break;
          }
        }
        if (dead) { L.projectiles.splice(i, 1); if (p.kind !== 'arrow' && p.kind !== 'lightning') L.effects.push({ kind: 'burst', x: p.x, y: p.y, t: 0, dur: 0.3, color: p.kind === 'acid' ? '#80ff40' : p.kind === 'bloodstar' ? '#ff2060' : p.kind === 'bolt' || p.kind === 'nova' ? '#a0c0ff' : '#ff8020' }); }
      }
    }
    explode(x, y, r, dmg, element, owner, src) {
      const L = this.level, h = this.hero, cx = Math.round(x), cy = Math.round(y);
      L.effects.push({ kind: 'explosion', x: cx, y: cy, t: 0, dur: 0.55, color: element === 'fire' ? '#ff7020' : '#a0c0ff' }); this.sfx('explode');
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        const a = L.actorAt(cx + i, cy + j); if (!a) continue;
        if (a.kind === 'monster' && owner !== 'monster') this.damageMonster(a, this.rng.int(dmg[0], dmg[1]), element, { hero: owner === 'hero' });
        if (a === h && owner !== 'hero') this.damageHero(this.rng.int(dmg[0], dmg[1]), element, src);
      }
    }

    // ---------------------------------------------------------------- spells
    spellDamage(id, slvl) {
      const h = this.hero, s = h.stats, l = h.level;
      switch (id) {
        case 'firebolt': { const b = Math.floor(s.mag / 8); return [b + slvl + 1, b + slvl + 10]; }
        case 'lightning': return [2 + slvl, l + 4 + slvl * 2];
        case 'fireball': { const k = 1 + (slvl - 1) * 0.125; return [Math.round((2 * l + 4) * k), Math.round((2 * l + 40) * k)]; }
        case 'flash': return [l + slvl * 2, 2 * l + slvl * 4 + Math.floor(s.mag / 4)];
        case 'chainlightning': return [4 + slvl, 4 + 2 * l + slvl * 2];
        case 'nova': return [5 + l, 3 * l + slvl * 5 + 10];
        default: return [0, 0];
      }
    }
    beginCast(id, src, target, scrollItem) {
      const h = this.hero, L = this.level; if (!id || h.dead) return false;
      target = target || { x: h.tx + Math.round(h.dirX * 3), y: h.ty + Math.round(h.dirY * 3) };
      if (src === 'skill') { h.mode = id; this.emit('mode', { mode: id }); return true; }
      if (h.action) return false;
      const sp = SPELLS[id]; if (!sp) return false;
      if (L.index === 0 && !sp.town) { this.message('В городе это не сработает.'); this.sfx('cant'); return false; }
      let slvl = Math.max(1, this.spellLevel(id));
      if (src === 'spell') {
        if (!h.spells[id]) return false;
        const cost = this.manaCost(id); if (h.mana < cost) { this.message('Не хватает маны.'); this.sfx('nomana', { cls: h.cls }); return false; }
        h.mana -= cost;
      } else if (src === 'scroll') {
        const it = scrollItem || [...h.belt.filter(Boolean), ...h.inv.map(e => e.item)].find(i => baseOf(i).spell === id);
        if (!it) { this.message('Свитков больше нет.'); h.cur = { id: CLASSES[h.cls].skill, src: 'skill' }; return false; }
        this.invRemove(it);
      } else if (src === 'staff') {
        const w = h.equip.weapon; if (!w || w.staffSpell !== id || w.charges <= 0) { this.message('В посохе нет зарядов.'); this.sfx('cant'); return false; }
        w.charges--;
      }
      this.face(h, target.x, target.y);
      h.order = null; h.path = null;
      h.action = { kind: 'cast', spell: id, t: 0, dur: h.stats.castTime, hitAt: 0.6, fn: () => this.spellEffect(id, slvl, target) };
      this.sfx('cast', { spell: id });
      return true;
    }
    spellEffect(id, slvl, tg) {
      const h = this.hero, L = this.level, rng = this.rng;
      const tx = tg.target ? tg.target.tx : tg.x, ty = tg.target ? tg.target.ty : tg.y;
      const dmg = this.spellDamage(id, slvl);
      switch (id) {
        case 'firebolt': this.spawnProj('firebolt', h.tx, h.ty, tx, ty, 'hero', { dmg, element: 'fire' }); this.sfx('firecast'); break;
        case 'fireball': this.spawnProj('fireball', h.tx, h.ty, tx, ty, 'hero', { dmg, element: 'fire' }); this.sfx('firecast'); break;
        case 'lightning': this.spawnProj('lightning', h.tx, h.ty, tx, ty, 'hero', { dmg, element: 'light', range: 12 }); this.sfx('lightning'); break;
        case 'heal': {
          let amt = rng.int(1, 10) + h.level + slvl * rng.int(1, 6) + Math.round(h.stats.maxLife * 0.1);
          if (h.cls === 'warrior') amt *= 2; else if (h.cls === 'rogue') amt = Math.round(amt * 1.5);
          h.life = Math.min(h.stats.maxLife, h.life + amt); L.effects.push({ kind: 'heal', x: h.tx, y: h.ty, t: 0, dur: 0.8 }); this.sfx('heal'); break;
        }
        case 'flash':
          L.effects.push({ kind: 'flash', x: h.tx, y: h.ty, t: 0, dur: 0.5 }); this.sfx('flash');
          for (const m of L.monsters.slice()) if (cheb(m, h) <= 1 || (cheb(m, h) === 2 && lineClear(L, h.tx, h.ty, m.tx, m.ty))) this.damageMonster(m, rng.int(dmg[0], dmg[1]), 'magic', { hero: true });
          break;
        case 'chainlightning': {
          const n = 2 + Math.floor(slvl / 2);
          const targets = L.monsters.filter(m => !m.dead && cheb(m, h) <= 8 && L.visible[m.ty * L.w + m.tx] && lineClear(L, h.tx, h.ty, m.tx, m.ty)).sort((a, b) => cheb(a, h) - cheb(b, h)).slice(0, n);
          let from = { x: h.tx, y: h.ty };
          for (const m of targets) { L.effects.push({ kind: 'bolt', x: from.x, y: from.y, x2: m.tx, y2: m.ty, t: 0, dur: 0.35 }); this.damageMonster(m, rng.int(dmg[0], dmg[1]), 'light', { hero: true }); from = { x: m.tx, y: m.ty }; }
          if (!targets.length) this.spawnProj('lightning', h.tx, h.ty, tx, ty, 'hero', { dmg, element: 'light', range: 10 });
          this.sfx('lightning'); break;
        }
        case 'nova': this.castNova(slvl); break;
        case 'manashield': h.manaShield = true; L.effects.push({ kind: 'shield', x: h.tx, y: h.ty, t: 0, dur: 0.8 }); this.sfx('manashield'); break;
        case 'stonecurse': {
          const m = L.monsters.filter(m => Math.max(Math.abs(m.tx - tx), Math.abs(m.ty - ty)) <= 1).sort((a, b) => Math.hypot(a.tx - tx, a.ty - ty) - Math.hypot(b.tx - tx, b.ty - ty))[0];
          if (!m) { this.message('Нет цели.'); break; }
          if (m.boss === 'diablo' || m.boss === 'lazarus') { this.emit('immune', { x: m.tx, y: m.ty }); break; }
          m.stoneT = Math.min(12, 5 + slvl); m.action = null; this.wake(m); this.sfx('stone'); break;
        }
        case 'teleport': {
          const p = L.near(tx, ty, (x, y) => L.free(x, y) && L.visible[y * L.w + x], 2);
          if (!p) { this.message('Туда нельзя переместиться.'); break; }
          L.effects.push({ kind: 'teleport', x: h.tx, y: h.ty, t: 0, dur: 0.4 }); L.unplace(h); L.place(h, p.x, p.y); this.updateFOV(true); this.sfx('teleport'); break;
        }
        case 'townportal': {
          if (L.index === 0) break;
          const p = L.near(h.tx + Math.round(h.dirX), h.ty + Math.round(h.dirY), (x, y) => !L.blocked(x, y) && !L.actorAt(x, y) && !L.objAt(x, y), 3);
          if (!p) break;
          this.portal = { level: L.index, x: p.x, y: p.y }; this.syncPortal(L); this.sfx('portal'); this.message('Портал в Тристрам открыт.'); break;
        }
      }
    }
    castNova(slvl, free) {
      const h = this.hero, dmg = this.spellDamage('nova', slvl);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.spawnProj('nova', h.tx, h.ty, h.tx + Math.cos(a) * 6, h.ty + Math.sin(a) * 6, 'hero', { dmg, element: 'light', range: 6 }); }
      this.sfx('nova');
    }

    // ---------------------------------------------------------------- town: shops, dialogs, quests
    restock() {
      const h = this.hero, lvl = h.level, rng = this.rng;
      const pick = (n, pred, ilvl, magic) => { const out = [], seen = {}; for (let i = 0; i < n * 8 && out.length < n; i++) { const it = this.randomItem(ilvl, { equip: true, uniqueChance: 0, identify: true, magicBonus: magic ? 1 : -1 }); if (!pred(it) || (magic ? it.quality !== 'magic' : it.quality !== 'normal')) continue; if ((seen[it.base] || 0) >= (magic ? 2 : 1) && i < n * 6) continue; seen[it.base] = (seen[it.base] || 0) + 1; out.push(it); } return out; };
      this.shops.griswold = pick(14, it => !baseOf(it).jewel && baseOf(it).cls !== 'staff', Math.max(2, Math.min(25, lvl + 2)), false).sort((a, b) => itemValue(a) - itemValue(b));
      this.shops.premium = pick(6, it => baseOf(it).cls !== 'staff', Math.min(30, lvl + 3), true).sort((a, b) => itemValue(a) - itemValue(b));
      const inf = id => Object.assign(this.newItem(id), { infinite: true });
      this.shops.pepin = [inf('potion_heal'), inf('potion_fullheal'), inf('scroll_heal')];
      if (lvl >= 6) this.shops.pepin.push(inf('potion_rejuv'));
      const adria = [inf('potion_mana'), inf('potion_fullmana'), inf('scroll_identify'), inf('scroll_portal')];
      const scrolls = BASES.filter(b => b.cls === 'scroll' && b.qlvl > 1 && b.qlvl <= lvl + 2);
      for (let i = 0; i < 3 && scrolls.length; i++) adria.push(this.newItem(rng.pick(scrolls).id));
      const spells = Object.values(SPELLS).filter(s => !s.scrollOnly && s.qlvl <= Math.max(2, lvl));
      for (let i = 0; i < 3; i++) adria.push(this.newItem('book', { spell: rng.pick(spells).id }));
      for (let i = 0; i < 2; i++) { const st = this.newItem(rng.pick(BASES.filter(b => b.cls === 'staff' && b.qlvl <= lvl + 2)).id, { staffSpell: rng.pick(spells).id }); if (rng.chance(0.5)) this.makeMagic(st, lvl + 2); st.identified = true; adria.push(st); }
      if (lvl >= 3) adria.push(this.newItem('potion_rejuv'));
      this.shops.adria = adria;
      let w; for (let i = 0; i < 20; i++) { w = this.randomItem(Math.min(30, lvl + 6), { equip: true, uniqueChance: 0, identify: true, magicBonus: 1 }); if (w.quality === 'magic') break; }
      this.shops.wirt = w; this.shops.wirtSeen = false;
    }
    buyPrice(item, shop) { return Math.round(itemValue(item) * (shop === 'wirt' ? 1.5 : 1)); }
    sellPrice(item) {
      const b = baseOf(item);
      let v = item.quality !== 'normal' && !item.identified ? b.value : itemValue(item);
      if (item.maxDur && !item.indestructible) v *= 0.3 + 0.7 * item.dur / item.maxDur;
      return Math.max(1, Math.floor(v / 4));
    }
    shopBuys(npc, item) {
      const b = baseOf(item); if (b.quest || item.base === 'gold') return false;
      if (npc === 'griswold') return ['sword', 'axe', 'mace', 'bow', 'shield', 'helm', 'armor'].includes(b.cls);
      if (npc === 'adria') return ['staff', 'scroll', 'book', 'potion', 'ring', 'amulet'].includes(b.cls);
      return false;
    }
    buy(shop, index) {
      const h = this.hero; const list = shop === 'wirt' ? [this.shops.wirt] : this.shops[shop];
      const item = list && list[index]; if (!item) return false;
      const price = this.buyPrice(item, shop);
      if (h.gold < price) { this.message('У тебя недостаточно золота.'); this.sfx('cant'); return false; }
      const it = item.infinite ? Object.assign(JSON.parse(JSON.stringify(item)), { uid: this.uid++, infinite: undefined }) : item;
      delete it.infinite;
      if (!this.giveItem(it)) { this.message('У тебя нет места для этого.'); this.sfx('cant'); return false; }
      h.gold -= price;
      if (!item.infinite) { if (shop === 'wirt') this.shops.wirt = null; else list.splice(index, 1); }
      this.sfx('gold'); return true;
    }
    sell(npc, item) {
      if (!this.shopBuys(npc, item)) return false;
      const price = this.sellPrice(item); if (!this.invRemove(item)) return false;
      this.hero.gold += price; this.sfx('gold'); return price;
    }
    repairCost(item) { if (!item.maxDur || item.indestructible || item.dur >= item.maxDur) return 0; return Math.max(1, Math.ceil((item.maxDur - item.dur) / item.maxDur * itemValue(item) * 0.3)); }
    repair(item) { const c = this.repairCost(item); if (!c) return false; if (this.hero.gold < c) { this.message('У тебя недостаточно золота.'); return false; } this.hero.gold -= c; item.dur = item.maxDur; this.recalc(); this.sfx('repair'); return true; }
    rechargeCost(item) { if (!item.staffSpell || item.charges >= item.maxCharges) return 0; return Math.max(1, Math.ceil((item.maxCharges - item.charges) * SPELLS[item.staffSpell].bookValue / 40)); }
    recharge(item) { const c = this.rechargeCost(item); if (!c) return false; if (this.hero.gold < c) { this.message('У тебя недостаточно золота.'); return false; } this.hero.gold -= c; item.charges = item.maxCharges; this.sfx('learn'); return true; }
    identify(item) { if (item.identified) return false; if (this.hero.gold < 100) { this.message('У тебя недостаточно золота.'); return false; } this.hero.gold -= 100; item.identified = true; this.sfx('learn'); return true; }
    healAtPepin() { const h = this.hero; h.life = h.stats.maxLife; this.sfx('heal'); }
    peekWirt() { if (this.shops.wirtSeen) return true; if (this.hero.gold < 50) { this.message('Эй, без полтинника даже не показываю.'); return false; } this.hero.gold -= 50; this.shops.wirtSeen = true; this.sfx('gold'); return true; }

    // talk: returns text; may advance quests
    talk(npcId) {
      const q = this.quests, h = this.hero, depth = this.maxDepth;
      const npc = this.level.npcs && this.level.npcs.find(n => n.id === npcId);
      const cycle = lines => { if (!npc) return lines[0]; const t = lines[npc.talkIdx % lines.length]; npc.talkIdx++; return t; };
      switch (npcId) {
        case 'townsman':
          if (q.butcher === 0) { q.butcher = 1; if (npc) npc.dead = true; this.emit('quest', { id: 'butcher' }); return 'Помоги... умоляю... Там, в соборе... демон с тесаком... Он зарубил всех, кто был со мной... Их тела развешаны в его логове, на втором уровне... Мясник... Отомсти за них... а-ах...'; }
          return '…';
        case 'ogden':
          if (q.leoric === 0) { q.leoric = 1; this.emit('quest', { id: 'leoric' }); return 'Хочу рассказать тебе о короле Леорике. Когда-то он был добрым правителем, но тьма свела его с ума. Он казнил верных рыцарей, а после смерти восстал из гробницы под собором. Говорят, его неупокоенный дух бродит на третьем уровне. Прекрати его мучения, прошу.'; }
          if (q.leoric === 2 && !this.ogdenThanks) { this.ogdenThanks = true; return 'Ты упокоил короля! Весь Тристрам у тебя в долгу. Кружка эля в «Восходящем солнце» для тебя всегда бесплатно.'; }
          return cycle(['Добро пожаловать в таверну «Восходящее солнце»! Жаль, гостей сейчас мало — все боятся того, что творится в соборе.', 'Моя жена Гарда и я держим эту таверну уже много лет. Раньше здесь было шумно и весело...', 'Джиллиан — хорошая девушка. Присматривает за своей бабушкой и помогает мне здесь.', 'Грисвольд — лучший кузнец в округе. Если нужно оружие — иди к нему.']);
        case 'griswold':
          if (this.hasItem(i => i.base === 'magicrock') && q.magicrock < 2) return 'Ого! Магический камень! Дай-ка его сюда — выберешь «Отдать камень», и я сделаю тебе кое-что особенное.';
          if (this.hasItem(i => i.base === 'anvil') && q.anvil < 2) return 'Наковальня Ярости! Отдай её мне, и я выкую клинок, равного которому нет.';
          if (q.magicrock === 0 && depth >= 4) { q.magicrock = 1; this.emit('quest', { id: 'magicrock' }); return 'Слушай, у меня есть к тебе дело. Караван вёз мне редкий камень — он светился изнутри, как звезда. Караван разграбили, а камень утащили в катакомбы, на пятый уровень. Принеси его — не пожалеешь.'; }
          if (q.anvil === 0 && depth >= 9) { q.anvil = 1; this.emit('quest', { id: 'anvil' }); return 'Ходят слухи, что в пещерах, на десятом уровне, лежит Наковальня Ярости — кузня самого ада. Принеси её мне, и я выкую тебе оружие, достойное героя.'; }
          return cycle(['Что тебе нужно? Оружие? Броня? У меня лучшее в Тристраме — да и во всём Хандарасе, если на то пошло.', 'Раньше я ходил с отрядом в собор. Вернулся один, с покалеченной ногой. Будь осторожен там, внизу.', 'Не забывай чинить снаряжение. Сломанный меч в бою хуже, чем никакого.']);
        case 'pepin':
          return cycle(['Я вижу, ты ранен. Позволь мне помочь — лечение я провожу бесплатно.', 'Раны, нанесённые демонами, заживают медленно. Держи при себе побольше зелий лечения.', 'В соборе творится что-то страшное. Каждый день ко мне приносят новых раненых.']);
        case 'adria':
          return cycle(['Я чувствую в тебе силу, странник. Магия может стать твоим оружием — если ты сумеешь её постичь.', 'Книги заклинаний откроют тебе новые пути. Но помни: магия требует крепкого разума.', 'Тьма под собором древнее, чем думают люди. Она ждала очень, очень долго.']);
        case 'cain':
          if (q.lazarus === 0 && depth >= 8) { q.lazarus = 1; this.emit('quest', { id: 'lazarus' }); return 'Пора открыть тебе правду. Архиепископ Лазарь, советник короля Леорика, — предатель. Это он похитил принца Альбрехта и увёл его в подземелья, чтобы принести в жертву Диабло. Лазарь скрывается глубоко внизу, на пятнадцатом уровне. Останови его, пока не поздно!'; }
          if (q.lazarus === 2 && q.diablo < 2) return 'Лазарь мёртв, но Диабло пробуждается. Спустись на шестнадцатый уровень и уничтожь Повелителя Ужаса. Да хранит тебя Свет.';
          if (q.diablo === 2) return 'Ты сделал невозможное. Диабло повержен... но камень души теперь с тобой. Будь бдителен — зло никогда не умирает до конца.';
          if (q.butcher === 1) return 'Мясник... Ужасное создание. Говорят, он был воплощён из самой жестокости. Он силён и быстр — держи наготове зелья лечения.';
          if (q.leoric === 1) return 'Король Леорик был одержим Диабло. Его тело восстало после смерти. Скелеты служат ему — уничтожь его, и они рассыплются в прах.';
          return cycle(['Здравствуй, друг мой. Посиди, послушай старика. Много веков назад Первичное Зло — Диабло, Мефисто и Баал — было изгнано в наш мир...', 'Горадрим заточили Диабло в камень души и похоронили глубоко под землёй. На этом месте позже построили собор.', 'Я могу опознать твои находки. За скромную плату, разумеется, — даже старикам нужно на что-то жить.']);
        case 'gillian':
          return cycle(['Здравствуй. Бабушке снова снятся кошмары про собор... Будь осторожен там.', 'Огден — добрый человек. Без него я не знаю, что бы мы делали.', 'Иногда ночью из собора доносятся ужасные звуки. Я не могу спать.']);
        case 'farnham':
          return cycle(['Ик... Я был там! Внизу! Я видел... демона с огромным тесаком... Ик...', 'Лазарь... он повёл нас вниз, обещал спасти принца... А потом... все погибли. Все! Ик.', 'Выпей со мной, друг... пока ещё есть с кем пить...']);
        case 'wirt':
          return cycle(['Эй, ты! Хочешь что-то особенное? У меня кое-что есть. Но за посмотреть — пятьдесят золотых.', 'Демоны оттяпали мне ногу. Зато теперь у меня отличная деревянная — и никаких мозолей.', 'Не спрашивай, откуда товар. Просто плати.']);
      }
      return '…';
    }
    giveQuestItem(kind) {
      const q = this.quests;
      if (kind === 'magicrock') { const it = this.hasItem(i => i.base === 'magicrock'); if (!it) return false; this.invRemove(it); if (this.hero.cursor === it) this.hero.cursor = null; q.magicrock = 2; const r = this.makeUnique('empyrean'); r.identified = true; if (!this.giveItem(r)) this.dropItem(this.level, r, this.hero.tx, this.hero.ty); this.message('Грисвольд вручает тебе Небесную Ленту.'); this.sfx('quest'); return true; }
      if (kind === 'anvil') { const it = this.hasItem(i => i.base === 'anvil'); if (!it) return false; this.invRemove(it); if (this.hero.cursor === it) this.hero.cursor = null; q.anvil = 2; const r = this.makeUnique('griswoldedge'); r.identified = true; if (!this.giveItem(r)) this.dropItem(this.level, r, this.hero.tx, this.hero.ty); this.message('Грисвольд вручает тебе Клинок Грисвольда.'); this.sfx('quest'); return true; }
      return false;
    }
    questLog() {
      const q = this.quests;
      const Q = [
        ['butcher', 'Мясник', ['', 'Раненый горожанин рассказал о демоне-Мяснике, устроившем бойню на 2-м уровне собора.', 'Мясник мёртв. Горожане отомщены.']],
        ['leoric', 'Проклятие короля Леорика', ['', 'Огден рассказал о безумном короле Леорике. Его неупокоенный дух бродит по 3-му уровню собора.', 'Король-скелет повержен и обрёл покой.']],
        ['magicrock', 'Магический камень', ['', 'Грисвольд просит найти Магический камень, похищенный с каравана. Его унесли в катакомбы (уровень 5).', 'Грисвольд сделал из камня кольцо.']],
        ['anvil', 'Наковальня Ярости', ['', 'Грисвольд просит принести Наковальню Ярости из пещер (уровень 10).', 'Грисвольд выковал легендарный клинок.']],
        ['lazarus', 'Архиепископ Лазарь', ['', 'Каин раскрыл предательство Лазаря. Найди его на 15-м уровне и отомсти за принца Альбрехта.', 'Лазарь мёртв. Путь в логово Диабло открыт.']],
        ['diablo', 'Повелитель Ужаса', ['', 'Спустись на 16-й уровень и уничтожь Диабло.', 'Диабло повержен!']]
      ];
      return Q.filter(([id]) => q[id] > 0).map(([id, name, d]) => ({ id, name, state: q[id], text: d[q[id]] }));
    }

    // ---------------------------------------------------------------- save / load
    serialize() {
      const h = this.hero;
      if (this.level) this.levelStates[this.level.index] = this.levelState(this.level);
      for (const [n, L] of this.levels) this.levelStates[n] = this.levelState(L);
      const hero = {};
      for (const k of ['name', 'cls', 'level', 'xp', 'base', 'points', 'gold', 'life', 'mana', 'inv', 'equip', 'belt', 'spells', 'cur', 'hot', 'manaShield', 'kills']) hero[k] = h[k];
      if (h.cursor) hero.pending = h.cursor;
      return JSON.parse(JSON.stringify({
        v: 1, seed: this.seed, rng: this.rng.s, uid: this.uid, time: this.time, hero, quests: this.quests, levels: this.levelStates, cur: this.level.index,
        pos: { x: h.tx, y: h.ty }, portal: this.portal, maxDepth: this.maxDepth, shops: this.shops, victory: this.victory, ogdenThanks: !!this.ogdenThanks, needRestock: this.needRestock
      }));
    }
    static load(data) {
      if (!data || data.v !== 1) throw new Error('Несовместимое сохранение');
      const g = new Game({ restore: true, seed: data.seed });
      g.rng.s = data.rng; g.uid = data.uid; g.time = data.time || 0; g.quests = Object.assign(g.quests, data.quests); g.levelStates = data.levels || {};
      g.portal = data.portal; g.maxDepth = data.maxDepth || 0; g.shops = data.shops; g.victory = !!data.victory; g.ogdenThanks = data.ogdenThanks; g.needRestock = !!data.needRestock;
      const c = CLASSES[data.hero.cls]; if (!c) throw new Error('Неизвестный класс');
      const h = Object.assign({ kind: 'hero', dirX: 1, dirY: 1, path: null, order: null, action: null, dead: false, cursor: null, mode: null }, data.hero);
      g.hero = h; h.inv = h.inv || []; h.belt = h.belt || new Array(8).fill(null);
      g.recalc();
      if (h.pending) { const p = h.pending; delete h.pending; if (!g.giveItem(p)) h.cursor = p; }
      const L = g.getLevel(data.cur); g.level = L; g.syncPortal(L); if (L.index === 0) g.syncTown(L);
      const p = L.near(data.pos.x, data.pos.y, (x, y) => L.free(x, y), 8) || L.start || L.up;
      L.place(h, p.x, p.y);
      if (h.life <= 0) h.life = 1;
      g.updateFOV(true);
      return g;
    }
  }

  D.T = T; D.RNG = RNG; D.Level = Level; D.Game = Game; D.findPath = findPath; D.lineClear = lineClear; D.computeFOV = computeFOV; D.bfsDist = bfsDist;
  D.itemName = itemName; D.itemColor = itemColor; D.describeItem = describeItem; D.itemValue = itemValue; D.itemAC = itemAC; D.baseOf = baseOf; D.slotFor = slotFor; D.meetsReq = meetsReq;
  D.computeStats = computeStats; D.genDungeon = genDungeon; D.genTown = genTown; D.INV_W = INV_W; D.INV_H = INV_H; D.WALKABLE = WALKABLE; D.OPAQUE = OPAQUE; D.bookReq = bookReq;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
