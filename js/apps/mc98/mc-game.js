(function (M) {
  'use strict';
  const B = M.BLOCKS, I = M.ITEMS, K = M.ITEM_BY_KEY;
  const DT = 0.05, DAY = 24000;
  const DIFF_MULT = [0, 0.6, 1, 1.4];
  const ACHIEVEMENTS = {
    wood: { name: 'Заготовка дров', desc: 'Добыть бревно' }, workbench: { name: 'Верстак', desc: 'Скрафтить верстак' }, pickaxe: { name: 'Пора копать!', desc: 'Скрафтить кирку' },
    furnace: { name: 'Горячая тема', desc: 'Построить печь' }, iron: { name: 'Железный век', desc: 'Выплавить железо' }, iron_pickaxe: { name: 'Кирка получше', desc: 'Скрафтить железную кирку' },
    diamond: { name: 'Алмазы!', desc: 'Добыть алмаз' }, bed: { name: 'Спокойной ночи', desc: 'Переспать ночь в кровати' }, bow: { name: 'Стрелок', desc: 'Скрафтить лук' },
    cooked: { name: 'Вкусный стейк', desc: 'Пожарить мясо' }, night: { name: 'Первая ночь', desc: 'Пережить ночь' }, creeper: { name: 'Пшшш...', desc: 'Убить крипера' },
    obsidian: { name: 'Чёрный камень', desc: 'Получить обсидиан' }, gold: { name: 'Золотая лихорадка', desc: 'Выплавить золото' }, tnt: { name: 'Подрывник', desc: 'Взорвать динамит' }
  };
  const stackOf = (id, count = 1, dmg = 0) => ({ id, count, dmg });
  const magnetItem = (e, dx, dy, dz, d) => { const k = 9 / d; e.vx += dx * k * DT * 4; e.vy += dy * k * DT * 4; e.vz += dz * k * DT * 4; return true; };
  const floor = Math.floor;

  class Game {
    constructor(opts = {}) {
      this.seed = (opts.save ? opts.save.seed : opts.seed) >>> 0;
      this.name = opts.name || 'Новый мир';
      this.mode = opts.mode || 'survival';
      this.difficulty = opts.difficulty == null ? 2 : opts.difficulty;
      this.world = new M.World({ seed: this.seed });
      this.rng = M.makeRandom(this.seed ^ 0xabcdef);
      this.time = 0; this.tickCount = 0; this.renderDistance = opts.renderDistance || 4;
      this.player = { x: 0, y: 40, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, w: 0.3, h: 1.8, eye: 1.62, hp: 20, air: 300, dead: false, onGround: false, inWater: false, inLava: false, sneaking: false, sprinting: false, flying: false, fallStart: null, hurtT: 0, burning: 0, spawn: null, regenT: 0, swing: 0, lastY: 0, deaths: 0 };
      Object.setPrototypeOf(this.player, M.Entity.prototype);
      this.player.id = 0;
      this.inventory = new Array(36).fill(null);
      this.armor = new Array(4).fill(null);
      this.selected = 0; this.cursor = null;
      this.craft = new Array(9).fill(null); this.craftSize = 2; this.craftResult = null;
      this.container = null;
      this.entities = [];
      this.events = [];
      this.breaking = null;
      this.target = null;
      this.achievements = new Set();
      this.stats = { mined: 0, placed: 0, kills: 0, deaths: 0, days: 0, crafted: 0 };
      this.attackCd = 0; this.useCd = 0; this.eatT = 0; this.messageT = 0; this.spawnT = 0; this.nightSurvived = false; this.sleeping = 0;
      this.paused = false;
      if (opts.save) this.restore(opts.save);
      else {
        const sp = this.world.gen.spawnPoint();
        this.player.spawn = { x: sp.x, y: sp.y, z: sp.z };
        this.respawnAt(sp);
        this.time = 1000;
      }
      this.world.load(floor(this.player.x), floor(this.player.z), 2, 5000);
      this.settle();
    }
    settle() {
      const p = this.player, x = floor(p.x), z = floor(p.z);
      const top = this.world.topSolid(x, z);
      if (p.y < top + 1) p.y = top + 1;
    }
    respawnAt(sp) { const p = this.player; p.x = sp.x; p.y = sp.y + 0.1; p.z = sp.z; p.vx = p.vy = p.vz = 0; p.hp = 20; p.air = 300; p.dead = false; p.burning = 0; p.fallStart = null; p.hurtT = 0; }

    dayFactor() {
      const t = this.time % DAY;
      if (t < 12000) return 1; if (t < 13800) return 1 - (t - 12000) / 1800; if (t < 22200) return 0; return (t - 22200) / 1800;
    }
    isDay() { return this.dayFactor() > 0.5; }
    isNight() { const t = this.time % DAY; return t >= 12800 && t < 23200; }
    darkness() { return Math.round(11 * (1 - this.dayFactor())); }
    lightAt(x, y, z) { const w = this.world; return Math.max(w.getBlockLight(floor(x), floor(y), floor(z)), w.getSky(floor(x), floor(y), floor(z)) - this.darkness()); }
    biome() { return M.BIOMES[this.world.gen.biomeAt(floor(this.player.x), floor(this.player.z))].name; }

    sound(name, x, y, z) { this.events.push({ type: 'sound', name, x, y, z }); }
    message(text) { this.events.push({ type: 'message', text }); }
    achieve(key) { if (this.achievements.has(key)) return; this.achievements.add(key); this.events.push({ type: 'achievement', key, name: ACHIEVEMENTS[key].name, desc: ACHIEVEMENTS[key].desc }); }

    forward() { const p = this.player; return [-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)]; }
    eyePos() { const p = this.player; return [p.x, p.y + (p.sneaking ? p.eye - 0.3 : p.eye), p.z]; }
    reach() { return this.mode === 'creative' ? 6 : 4.5; }
    updateTarget() {
      const e = this.eyePos(), f = this.forward();
      const held = this.held();
      const liquids = !!(held && (held.id === K.bucket.id));
      const bh = this.world.raycast(e[0], e[1], e[2], f[0], f[1], f[2], this.reach(), liquids);
      const eh = this.hitEntityOnRay(e[0], e[1], e[2], f[0], f[1], f[2], bh ? Math.min(bh.t, 4) : 4, this.player);
      this.target = eh ? { entity: eh.entity, t: eh.t } : bh;
    }
    hitEntityOnRay(ox, oy, oz, dx, dy, dz, maxDist, exclude) {
      let best = null;
      for (const en of this.entities) {
        if (en === exclude || en.dead || en instanceof M.ItemEntity || en instanceof M.Arrow) continue;
        const a = en.aabb();
        const h = M.rayBox(ox, oy, oz, dx, dy, dz, a[0] - 0.1, a[1], a[2] - 0.1, a[3] + 0.1, a[4] + 0.1, a[5] + 0.1);
        if (h && h.t <= maxDist && (!best || h.t < best.t)) best = { entity: en, t: h.t };
      }
      return best;
    }
    hitEntityOnSegment(x0, y0, z0, x1, y1, z1, exclude) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz) || 1e-6;
      const list = this.entities.filter(e => !(e instanceof M.ItemEntity) && !(e instanceof M.Arrow));
      if (exclude !== this.player) list.push(this.player);
      let best = null;
      for (const en of list) {
        if (en === exclude || en.dead) continue;
        const a = en.aabb();
        const h = M.rayBox(x0, y0, z0, dx / len, dy / len, dz / len, a[0], a[1], a[2], a[3], a[4], a[5]);
        if (h && h.t <= len && (!best || h.t < best.t)) best = { entity: en, t: h.t };
      }
      return best ? best.entity : null;
    }
    canSee(x0, y0, z0, x1, y1, z1) { const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz); return !this.world.raycast(x0, y0, z0, dx / len, dy / len, dz / len, len); }

    held() { return this.inventory[this.selected]; }
    itemOf(stack) { return stack ? I[stack.id] : null; }
    addToInventory(stack) {
      if (!stack || stack.count <= 0) return null;
      const def = I[stack.id], max = def.stack || 64;
      let count = stack.count;
      const order = [];
      for (let i = 0; i < 36; i++) order.push(i);
      for (const i of order) { const s = this.inventory[i]; if (s && s.id === stack.id && (s.dmg || 0) === (stack.dmg || 0) && s.count < max) { const n = Math.min(max - s.count, count); s.count += n; count -= n; if (!count) return null; } }
      for (const i of order) { if (!this.inventory[i]) { const n = Math.min(max, count); this.inventory[i] = stackOf(stack.id, n, stack.dmg || 0); count -= n; if (!count) return null; } }
      return stackOf(stack.id, count, stack.dmg || 0);
    }
    countItem(id) { let n = 0; for (const s of this.inventory) if (s && s.id === id) n += s.count; return n; }
    hasItem(id) { return this.countItem(id) > 0; }
    consumeHeld(n = 1) { const s = this.inventory[this.selected]; if (!s) return; if (this.mode === 'creative') return; s.count -= n; if (s.count <= 0) this.inventory[this.selected] = null; }
    damageHeld(n = 1) {
      const s = this.inventory[this.selected]; if (!s || this.mode === 'creative') return;
      const def = I[s.id]; if (!def.durability) return;
      s.dmg = (s.dmg || 0) + n;
      if (s.dmg >= def.durability) { this.inventory[this.selected] = null; this.sound('break_tool', this.player.x, this.player.y, this.player.z); }
    }
    dropItem(x, y, z, stack, vx, vy, vz) {
      if (!stack || stack.count <= 0) return null;
      const e = new M.ItemEntity(x, y, z, stackOf(stack.id, stack.count, stack.dmg || 0));
      e.vx = vx != null ? vx : (this.rng() - 0.5) * 2; e.vy = vy != null ? vy : 3 + this.rng() * 2; e.vz = vz != null ? vz : (this.rng() - 0.5) * 2;
      this.entities.push(e);
      return e;
    }
    throwStack(stack) {
      if (!stack) return;
      const e = this.eyePos(), f = this.forward();
      this.dropItem(e[0] + f[0] * 0.5, e[1] - 0.3, e[2] + f[2] * 0.5, stack, f[0] * 6, f[1] * 6 + 1.5, f[2] * 6).pickupDelay = 1.5;
    }
    dropHeld(all) {
      const s = this.inventory[this.selected]; if (!s) return;
      const n = all ? s.count : 1;
      this.throwStack(stackOf(s.id, n, s.dmg || 0));
      s.count -= n; if (s.count <= 0) this.inventory[this.selected] = null;
    }

    slotArea(area) {
      if (area === 'inv') return this.inventory;
      if (area === 'armor') return this.armor;
      if (area === 'craft') return this.craft;
      if (area === 'chest') return this.container && this.container.be ? this.container.be.slots : null;
      if (area === 'furnace') return this.container && this.container.be ? this.container.be.slots : null;
      return null;
    }
    canPlaceIn(area, i, stack) {
      if (area === 'armor') { const d = I[stack.id]; return d.armor === i; }
      if (area === 'furnace') { if (i === 2) return false; if (i === 1) return !!M.FUEL[stack.id]; return true; }
      return true;
    }
    clickSlot(area, i, button, shift) {
      if (area === 'result') { this.takeResult(shift); return; }
      const arr = this.slotArea(area); if (!arr) return;
      if (area === 'craft') { const s = this.craftSize; i = floor(i / s) * 3 + (i % s); }
      const s = arr[i], c = this.cursor;
      if (shift && s) { const rest = this.quickMove(area, i, s); arr[i] = rest; this.afterSlotChange(area); return; }
      if (!c) {
        if (!s) return;
        if (button === 2) { const n = Math.ceil(s.count / 2); this.cursor = stackOf(s.id, n, s.dmg || 0); s.count -= n; if (!s.count) arr[i] = null; }
        else { this.cursor = s; arr[i] = null; }
      } else if (!s) {
        if (!this.canPlaceIn(area, i, c)) return;
        if (button === 2) { arr[i] = stackOf(c.id, 1, c.dmg || 0); c.count--; if (!c.count) this.cursor = null; }
        else { arr[i] = c; this.cursor = null; }
      } else if (s.id === c.id && (s.dmg || 0) === (c.dmg || 0) && (I[s.id].stack || 64) > 1) {
        if (area === 'furnace' && i === 2) { const n = s.count; c.count += n; arr[i] = null; }
        else { const max = I[s.id].stack || 64, n = button === 2 ? 1 : Math.min(max - s.count, c.count); s.count += n; c.count -= n; if (!c.count) this.cursor = null; }
      } else {
        if (!this.canPlaceIn(area, i, c)) return;
        arr[i] = c; this.cursor = s;
      }
      this.afterSlotChange(area);
    }
    quickMove(area, i, s) {
      let rest = s;
      const put = (from, to) => { for (let k = from; k < to && rest; k++) { const t = this.inventory[k]; if (t && t.id === rest.id && (t.dmg || 0) === (rest.dmg || 0)) { const max = I[t.id].stack || 64, n = Math.min(max - t.count, rest.count); t.count += n; rest.count -= n; if (!rest.count) rest = null; } } for (let k = from; k < to && rest; k++) if (!this.inventory[k]) { this.inventory[k] = rest; rest = null; } };
      if (area === 'inv') {
        if (this.container && this.container.type === 'chest') { const slots = this.container.be.slots; for (let k = 0; k < 27 && rest; k++) { const t = slots[k]; if (t && t.id === rest.id && (t.dmg || 0) === (rest.dmg || 0)) { const max = I[t.id].stack || 64, n = Math.min(max - t.count, rest.count); t.count += n; rest.count -= n; if (!rest.count) rest = null; } } for (let k = 0; k < 27 && rest; k++) if (!slots[k]) { slots[k] = rest; rest = null; } return rest; }
        if (this.container && this.container.type === 'furnace') { const slots = this.container.be.slots, k = M.SMELT[rest.id] ? 0 : M.FUEL[rest.id] ? 1 : -1; if (k >= 0) { if (!slots[k]) { slots[k] = rest; rest = null; } else if (slots[k].id === rest.id) { const max = I[rest.id].stack || 64, n = Math.min(max - slots[k].count, rest.count); slots[k].count += n; rest.count -= n; if (!rest.count) rest = null; } } return rest; }
        const d = I[rest.id];
        if (d.armor != null && !this.armor[d.armor]) { this.armor[d.armor] = rest; return null; }
        if (i < 9) put(9, 36); else put(0, 9);
        return rest;
      }
      put(0, 9); put(9, 36);
      return rest;
    }
    afterSlotChange(area) { if (area === 'craft') this.updateCraftResult(); }
    updateCraftResult() {
      const s = this.craftSize, cells = [];
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) cells.push(this.craft[y * 3 + x]);
      const r = M.matchRecipe(cells, s);
      this.craftResult = r ? stackOf(r.result, r.count) : null;
      this.craftRecipe = r;
    }
    takeResult(all) {
      this.updateCraftResult();
      if (!this.craftResult) return;
      let times = 0;
      while (this.craftResult) {
        const res = this.craftResult;
        if (all) { const left = this.addToInventory(stackOf(res.id, res.count)); if (left) break; }
        else {
          if (this.cursor && (this.cursor.id !== res.id || this.cursor.count + res.count > (I[res.id].stack || 64))) break;
          if (this.cursor) this.cursor.count += res.count; else this.cursor = stackOf(res.id, res.count);
        }
        for (let k = 0; k < 9; k++) { const c = this.craft[k]; if (!c) continue; c.count--; if (c.count <= 0) this.craft[k] = null; if (c.id === K.mushroom_stew.id) this.craft[k] = null; }
        if (res.id === K.mushroom_stew.id || res.id === K.bowl.id) {}
        this.stats.crafted++;
        this.onCrafted(res.id);
        this.updateCraftResult();
        times++;
        if (!all || times > 64) break;
      }
    }
    onCrafted(id) {
      if (id === K.crafting_table.id) this.achieve('workbench');
      if (I[id].tool === 'pickaxe') this.achieve('pickaxe');
      if (id === K.iron_pickaxe.id) this.achieve('iron_pickaxe');
      if (id === K.furnace.id) this.achieve('furnace');
      if (id === K.bow.id) this.achieve('bow');
    }
    returnCraftGrid() { for (let k = 0; k < 9; k++) { const c = this.craft[k]; if (c) { const left = this.addToInventory(c); if (left) this.throwStack(left); this.craft[k] = null; } } this.craftResult = null; }
    openInventory() { this.craftSize = 2; this.container = { type: 'inventory' }; this.returnCraftGrid(); }
    closeContainer() {
      this.returnCraftGrid();
      if (this.cursor) { const left = this.addToInventory(this.cursor); if (left) this.throwStack(left); this.cursor = null; }
      this.container = null; this.craftSize = 2;
    }
    creativeTake(id, button) {
      const d = I[id]; if (!d) return;
      if (button === 2) { this.cursor = null; return; }
      this.cursor = stackOf(id, d.stack === 1 ? 1 : 64);
    }
    armorPoints() { let a = 0; for (const s of this.armor) if (s) a += I[s.id].protection || 0; return a; }
    damageArmor(n) { for (let i = 0; i < 4; i++) { const s = this.armor[i]; if (!s) continue; s.dmg = (s.dmg || 0) + n; if (s.dmg >= I[s.id].durability) this.armor[i] = null; } }

    blockEntityAt(x, y, z, create) {
      const k = M.key3(x, y, z);
      let be = this.world.blockEntities.get(k);
      if (!be && create) {
        if (create === 'chest') be = { type: 'chest', slots: new Array(27).fill(null) };
        else if (create === 'furnace') be = { type: 'furnace', slots: new Array(3).fill(null), burn: 0, burnMax: 0, cook: 0 };
        if (be) this.world.blockEntities.set(k, be);
      }
      return be || null;
    }
    interactBlock(t) {
      const b = B[t.id], p = this.player, held = this.held(), hd = held ? I[held.id] : null;
      if (b.container === 'table') { this.returnCraftGrid(); this.craftSize = 3; this.container = { type: 'table', x: t.x, y: t.y, z: t.z }; return true; }
      if (b.container === 'chest') { const be = this.blockEntityAt(t.x, t.y, t.z, 'chest'); this.container = { type: 'chest', x: t.x, y: t.y, z: t.z, be }; this.sound('chest_open', t.x, t.y, t.z); return true; }
      if (b.container === 'furnace') { const be = this.blockEntityAt(t.x, t.y, t.z, 'furnace'); this.container = { type: 'furnace', x: t.x, y: t.y, z: t.z, be }; return true; }
      if (b.container === 'bed') { this.trySleep(t); return true; }
      if (t.id === K.tnt.id && hd && hd.id === K.flint_and_steel.id) { this.world.setBlock(t.x, t.y, t.z, 0); this.entities.push(new M.PrimedTnt(t.x, t.y, t.z)); this.damageHeld(1); this.sound('fuse', t.x, t.y, t.z); return true; }
      return false;
    }
    trySleep(t) {
      if (!this.isNight() && this.dayFactor() > 0.3) { this.message('Спать можно только ночью'); return; }
      const near = this.entities.some(e => e instanceof M.Mob && e.def.hostile && e.hp > 0 && Math.hypot(e.x - this.player.x, e.z - this.player.z) < 10);
      if (near) { this.message('Рядом монстры — не уснуть'); return; }
      this.player.spawn = { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 };
      this.sleeping = 1;
      this.message('Точка возрождения установлена');
    }
    placeBlock(t, held) {
      const d = I[held.id], p = this.player;
      let id = held.id, meta = 0;
      let px = t.x, py = t.y, pz = t.z;
      const tb = B[t.id];
      if (!tb.replaceable) { const n = M.FACE_NORMALS[t.face]; px += n[0]; py += n[1]; pz += n[2]; }
      if (py < 0 || py >= M.CH) return false;
      const cur = B[this.world.getBlock(px, py, pz)];
      if (cur.id !== 0 && !cur.replaceable) return false;
      const b = B[id];
      if (b.model === 'torch') {
        if (t.face === 2 || tb.replaceable) { const u = B[this.world.getBlock(px, py - 1, pz)]; if (!u.solid && u.model !== 'fence') return false; meta = 0; }
        else if (t.face === 3) return false;
        else { if (!tb.opaque) return false; meta = [2, 1, 0, 0, 4, 3][t.face]; }
      } else if (b.model === 'ladder') {
        if (t.face < 4 && t.face !== 2 && t.face !== 3 ? false : true) { if (t.face === 2 || t.face === 3 || tb.replaceable) { let found = -1; for (let f = 0; f < 4; f++) { const dd = M.FACING[f]; if (B[this.world.getBlock(px + dd[0], py, pz + dd[2])].opaque) { found = f; break; } } if (found < 0) return false; meta = found; } }
        if (t.face === 0) meta = 3; else if (t.face === 1) meta = 2; else if (t.face === 4) meta = 1; else if (t.face === 5) meta = 0;
        if (!tb.opaque && t.face < 4 && t.face > 1) return false;
      } else if (b.model === 'cross' || b.model === 'half') {
        const u = B[this.world.getBlock(px, py - 1, pz)];
        if (!u.solid) return false;
        if (b.id === K.sapling.id && u.id !== K.grass.id && u.id !== K.dirt.id && u.id !== K.snow_grass.id) return false;
      } else if (b.id === K.cactus.id) {
        const u = this.world.getBlock(px, py - 1, pz);
        if (u !== K.sand.id && u !== K.cactus.id) return false;
      }
      if (b.faces) { const f = this.forward(); meta = Math.abs(f[0]) > Math.abs(f[2]) ? (f[0] > 0 ? 3 : 2) : (f[2] > 0 ? 1 : 0); }
      if (b.solid) {
        const box = M.blockBox(b, meta);
        const bb = [px + box[0], py + box[1], pz + box[2], px + box[3], py + box[4], pz + box[5]];
        const overlaps = e => { const a = e.aabb(); return a[0] < bb[3] && a[3] > bb[0] && a[1] < bb[4] && a[4] > bb[1] && a[2] < bb[5] && a[5] > bb[2]; };
        if (overlaps(p)) return false;
        for (const e of this.entities) if (e instanceof M.Mob && overlaps(e)) return false;
      }
      this.world.setBlock(px, py, pz, id, meta);
      this.consumeHeld(1);
      this.stats.placed++;
      this.sound('place_' + b.sound, px, py, pz);
      this.player.swing = 0.3;
      return true;
    }
    useItem(t) {
      const held = this.held(); if (!held) return false;
      const d = I[held.id], p = this.player;
      if (d.food) {
        if (p.hp >= 20 && this.mode !== 'creative') return false;
        p.hp = Math.min(20, p.hp + d.food);
        this.consumeHeld(1);
        if (d.returns) { const left = this.addToInventory(stackOf(K[d.returns].id, 1)); if (left) this.throwStack(left); }
        this.sound('eat', p.x, p.y, p.z);
        return true;
      }
      if (held.id === K.bucket.id && t && !t.entity && B[t.id].liquid && (t.meta & 7) === 0) {
        this.world.setBlock(t.x, t.y, t.z, 0);
        const got = t.id === 8 ? K.water_bucket.id : K.lava_bucket.id;
        if (this.mode !== 'creative') { held.count--; if (held.count <= 0) this.inventory[this.selected] = null; const left = this.addToInventory(stackOf(got, 1)); if (left) this.throwStack(left); }
        this.sound('splash', t.x, t.y, t.z);
        return true;
      }
      if (d.places && t && !t.entity) {
        const n = M.FACE_NORMALS[t.face];
        const px = B[t.id].replaceable ? t.x : t.x + n[0], py = B[t.id].replaceable ? t.y : t.y + n[1], pz = B[t.id].replaceable ? t.z : t.z + n[2];
        const cur = B[this.world.getBlock(px, py, pz)];
        if (cur.id !== 0 && !cur.replaceable) return false;
        this.world.setBlock(px, py, pz, K[d.places].id, 0);
        if (this.mode !== 'creative') this.inventory[this.selected] = stackOf(K.bucket.id, 1);
        this.sound('splash', px, py, pz);
        return true;
      }
      if (held.id === K.bow.id) {
        if (this.mode !== 'creative' && !this.hasItem(K.arrow.id)) return false;
        if (this.useCd > 0) return false;
        const e = this.eyePos(), f = this.forward();
        const a = new M.Arrow(e[0] + f[0] * 0.5, e[1] - 0.1, e[2] + f[2] * 0.5, f[0] * 28, f[1] * 28, f[2] * 28, p);
        a.damage = 6;
        this.entities.push(a);
        if (this.mode !== 'creative') { for (let i = 0; i < 36; i++) { const s = this.inventory[i]; if (s && s.id === K.arrow.id) { s.count--; if (!s.count) this.inventory[i] = null; break; } } }
        this.damageHeld(1);
        this.useCd = 0.6;
        this.sound('bow', p.x, p.y, p.z);
        return true;
      }
      if (held.id === K.flint_and_steel.id && t && !t.entity && t.id === K.tnt.id) return this.interactBlock(t);
      if (held.id === K.egg.id) { this.consumeHeld(1); const e = this.eyePos(), f = this.forward(); if (this.rng() < 0.125) this.entities.push(new M.Mob('chicken', e[0] + f[0] * 2, e[1] - 1, e[2] + f[2] * 2)); return true; }
      return false;
    }
    use() {
      const t = this.target, p = this.player, held = this.held();
      this.player.swing = 0.3;
      if (t && t.entity) {
        if (held && held.id === K.wheat.id && t.entity instanceof M.Mob && !t.entity.def.hostile) { this.consumeHeld(1); this.entities.push(new M.Mob(t.entity.type, t.entity.x, t.entity.y, t.entity.z)); this.sound(t.entity.def.sound, t.entity.x, t.entity.y, t.entity.z); return; }
        return;
      }
      if (t && !p.sneaking && this.interactBlock(t)) return;
      if (this.useItem(t)) return;
      if (t && held && M.isBlockItem(held.id)) this.placeBlock(t, held);
    }
    attack() {
      const t = this.target, p = this.player;
      p.swing = 0.35;
      if (this.attackCd > 0.001) return;
      this.attackCd = 0.25;
      if (t && t.entity) {
        const held = this.held(), d = held ? I[held.id] : null;
        const dmg = d && d.damage ? d.damage : 1;
        const f = this.forward();
        this.hitEntity(t.entity, dmg, f, 'player');
        if (d && d.durability) this.damageHeld(d.tool === 'sword' ? 1 : 2);
      }
    }
    hitEntity(e, dmg, dir, source) {
      if (e instanceof M.Mob) { e.vx += dir[0] * 6; e.vz += dir[2] * 6; e.vy = Math.max(e.vy, 4); this.damageMob(e, dmg, source); }
    }
    damageMob(e, dmg, source) {
      if (e.hp <= 0) return;
      e.hp -= dmg; e.hurtT = 0.5;
      if (!e.def.hostile) e.fleeT = 3; else e.angry = true;
      this.sound(e.def.sound + '_hurt', e.x, e.y, e.z);
      if (e.hp <= 0) {
        e.hp = 0; e.deathT = 0;
        if (source === 'player' || source === 'arrow_player') { this.stats.kills++; if (e.type === 'creeper') this.achieve('creeper'); }
        for (const [k, a, b] of e.def.drops) { const n = a + this.rng.int(b - a + 1); if (n > 0) this.dropItem(e.x, e.y + 0.5, e.z, stackOf(K[k].id, n)); }
        this.sound(e.def.sound + '_death', e.x, e.y, e.z);
      }
    }
    damagePlayer(dmg, kind, src) {
      const p = this.player;
      if (p.dead || this.mode === 'creative') return;
      if (kind === 'mob' || kind === 'arrow' || kind === 'explosion') dmg = dmg * DIFF_MULT[this.difficulty];
      if (kind !== 'drown' && kind !== 'void' && kind !== 'starve') { const ap = this.armorPoints(); dmg *= 1 - ap * 0.04; if (ap) this.damageArmor(1); }
      dmg = Math.max(0, Math.round(dmg));
      if (dmg <= 0 || (p.hurtT > 0 && kind === 'mob')) return;
      p.hp -= dmg; p.hurtT = 0.5;
      this.sound('hurt', p.x, p.y, p.z);
      this.events.push({ type: 'hurt' });
      if (src && src.x != null) { const dx = p.x - src.x, dz = p.z - src.z, len = Math.hypot(dx, dz) || 1; p.vx += dx / len * 5; p.vz += dz / len * 5; p.vy = Math.max(p.vy, 4); }
      if (p.hp <= 0) this.die(kind);
    }
    die(kind) {
      const p = this.player;
      p.hp = 0; p.dead = true; this.stats.deaths++;
      const reasons = { mob: 'Вас убил монстр', arrow: 'Вас застрелили', fall: 'Вы разбились', lava: 'Вы сгорели в лаве', fire: 'Вы сгорели', drown: 'Вы утонули', explosion: 'Вас взорвали', void: 'Вы упали в бездну', cactus: 'Вас уколол кактус', suffocate: 'Вы задохнулись в стене' };
      this.deathReason = reasons[kind] || 'Вы умерли';
      for (let i = 0; i < 36; i++) if (this.inventory[i]) { this.dropItem(p.x, p.y + 1, p.z, this.inventory[i]); this.inventory[i] = null; }
      for (let i = 0; i < 4; i++) if (this.armor[i]) { this.dropItem(p.x, p.y + 1, p.z, this.armor[i]); this.armor[i] = null; }
      this.closeContainer();
      this.sound('death', p.x, p.y, p.z);
    }
    respawn() {
      const sp = this.player.spawn;
      const top = this.world.topSolid(floor(sp.x), floor(sp.z));
      this.respawnAt({ x: sp.x, y: Math.max(sp.y, top + 1), z: sp.z });
      this.world.load(floor(sp.x), floor(sp.z), 2, 5000);
      this.settle();
    }
    shootArrow(mob, target) {
      const dx = target.x - mob.x, dy = (target.y + 1) - (mob.y + 1.5), dz = target.z - mob.z, dist = Math.hypot(dx, dy, dz) || 1;
      const sp = 22, err = 0.08;
      const a = new M.Arrow(mob.x, mob.y + 1.5, mob.z, dx / dist * sp + (this.rng() - 0.5) * err * sp, dy / dist * sp + dist * 0.35 + (this.rng() - 0.5) * err * sp, dz / dist * sp + (this.rng() - 0.5) * err * sp, mob);
      this.entities.push(a);
      this.sound('bow', mob.x, mob.y, mob.z);
    }
    arrowHit(arrow, target) {
      const dir = [arrow.vx, arrow.vy, arrow.vz], len = Math.hypot(...dir) || 1;
      if (target === this.player) this.damagePlayer(arrow.damage, 'arrow', arrow.owner);
      else this.hitEntity(target, arrow.damage, [dir[0] / len, 0, dir[2] / len], arrow.owner === this.player ? 'arrow_player' : 'arrow');
    }
    explode(x, y, z, power, source) {
      const w = this.world, r = Math.ceil(power);
      this.sound('explosion', x, y, z);
      this.events.push({ type: 'explosion', x, y, z, power });
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
        const d = Math.hypot(dx, dy, dz); if (d > power) continue;
        const bx = floor(x) + dx, by = floor(y) + dy, bz = floor(z) + dz, id = w.getBlock(bx, by, bz);
        if (!id) continue;
        const b = B[id];
        if (b.hard < 0 || id === K.obsidian.id || b.liquid) continue;
        if (this.rng() < 0.15 + (d / power) * 0.5 && d > power * 0.5) continue;
        if (id === K.tnt.id) { w.setBlock(bx, by, bz, 0); const t = new M.PrimedTnt(bx, by, bz); t.fuse = 0.3 + this.rng() * 0.6; this.entities.push(t); continue; }
        w.setBlock(bx, by, bz, 0);
        if (this.rng() < 0.3) { const drop = w.dropFor(id, this.rng); if (drop) this.dropItem(bx + 0.5, by + 0.5, bz + 0.5, drop); }
      }
      const hurt = (e, isPlayer) => {
        const d = Math.hypot(e.x - x, (e.y + e.h / 2) - y, e.z - z);
        if (d > power * 2) return;
        const f = 1 - d / (power * 2), dmg = Math.round(f * f * power * 6 + 1);
        const dx = e.x - x, dz = e.z - z, len = Math.hypot(dx, dz) || 1;
        if (isPlayer) this.damagePlayer(dmg, 'explosion', { x, y, z });
        else this.hitEntity(e, dmg, [dx / len * f, 0, dz / len * f], 'explosion');
        e.vy += f * 8;
      };
      hurt(this.player, true);
      for (const e of this.entities) if (e instanceof M.Mob && e !== source) hurt(e, false);
      if (source == null) this.achieve('tnt');
    }

    breakTarget() {
      const t = this.target; if (!t || t.entity) return;
      const w = this.world, id = t.id, b = B[id];
      const held = this.held(), d = held ? I[held.id] : null;
      const be = w.blockEntities.get(M.key3(t.x, t.y, t.z));
      w.setBlock(t.x, t.y, t.z, 0);
      if (be && be.slots) { for (const s of be.slots) if (s) this.dropItem(t.x + 0.5, t.y + 0.5, t.z + 0.5, s); w.blockEntities.delete(M.key3(t.x, t.y, t.z)); }
      if (this.mode !== 'creative') {
        const tierOk = b.tier < 0 || (d && d.tool === b.tool && d.tier >= b.tier);
        if (tierOk) { const drop = w.dropFor(id, this.rng); if (drop) this.dropItem(t.x + 0.5, t.y + 0.3, t.z + 0.5, drop); }
        if (d && d.durability && d.tool && b.hard > 0) this.damageHeld(1);
      }
      this.stats.mined++;
      this.sound('break_' + b.sound, t.x, t.y, t.z);
      this.events.push({ type: 'blockbreak', x: t.x, y: t.y, z: t.z, id });
      if (id === K.diamond_ore.id) this.achieve('diamond');
      if (id === K.obsidian.id) this.achieve('obsidian');
    }
    breakSpeed(b) {
      const held = this.held(), d = held ? I[held.id] : null;
      if (b.hard < 0) return 0;
      if (b.hard === 0) return 1e9;
      let speed = 1;
      if (d && d.tool && d.tool === b.tool) speed = d.speed;
      else if (d && d.tool === 'sword' && (b.id === K.leaves.id || b.model === 'cross')) speed = 1.5;
      const correct = b.tier < 0 || (d && d.tool === b.tool && d.tier >= b.tier);
      const p = this.player;
      if (p.inWater) speed /= 5;
      if (!p.onGround && !p.flying) speed /= 5;
      return correct ? speed / (b.hard * 30) : 1 / (b.hard * 100);
    }
    updateBreaking(attackHeld) {
      const t = this.target;
      if (!attackHeld || !t || t.entity) { this.breaking = null; return; }
      if (this.mode === 'creative') { if (this.attackCd <= 0) { this.breakTarget(); this.attackCd = 0.25; this.player.swing = 0.3; } return; }
      const b = B[t.id];
      if (!this.breaking || this.breaking.x !== t.x || this.breaking.y !== t.y || this.breaking.z !== t.z) this.breaking = { x: t.x, y: t.y, z: t.z, progress: 0, id: t.id };
      const rate = this.breakSpeed(b);
      this.breaking.progress += rate;
      this.player.swing = 0.3;
      if (this.tickCount % 4 === 0 && rate > 0) this.sound('step_' + b.sound, t.x, t.y, t.z);
      if (this.breaking.progress >= 1) { this.breakTarget(); this.breaking = null; this.attackCd = 0.15; }
    }

    movePlayer(inp) {
      const p = this.player, w = this.world;
      if (p.dead) { p.vx = p.vz = 0; p.physics(w, DT, {}); return; }
      p.sneaking = !!inp.sneak && !p.flying;
      p.sprinting = !!inp.sprint && (inp.fwd || 0) > 0 && !p.sneaking;
      const climbable = B[w.getBlock(floor(p.x), floor(p.y + 0.3), floor(p.z))].climb || B[w.getBlock(floor(p.x), floor(p.y + 1.2), floor(p.z))].climb;
      const inLiquid = p.inWater || p.inLava;
      let speed = p.flying ? 10.5 : inLiquid ? 2.4 : p.sneaking ? 1.3 : p.sprinting ? 5.6 : 4.3;
      if (p.flying && inp.sprint) speed *= 2;
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
      const fwd = inp.fwd || 0, strafe = inp.strafe || 0;
      let mx = fx * fwd + rx * strafe, mz = fz * fwd + rz * strafe;
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      const control = p.flying ? 8 : p.onGround ? 12 : inLiquid ? 6 : 2.5;
      p.vx += (mx * speed - p.vx) * Math.min(1, DT * control);
      p.vz += (mz * speed - p.vz) * Math.min(1, DT * control);
      if (p.flying) { p.vy += ((inp.jump ? 8 : inp.sneak ? -8 : 0) - p.vy) * Math.min(1, DT * 10); if (inp.sprint) p.vy *= 1; }
      else if (inLiquid) { if (inp.jump) p.vy = Math.min(p.vy + 40 * DT, 3.2); }
      else if (climbable) { p.vy = inp.jump || (inp.fwd || 0) > 0 ? 2.4 : inp.sneak ? 0 : -1.6; if (inp.sneak && !inp.jump) p.vy = 0; }
      else if (inp.jump && p.onGround) { p.vy = 9.5; this.sound('jump', p.x, p.y, p.z); }
      const px = p.x, pz = p.z;
      p.physics(w, DT, { noGravity: p.flying, climb: true });
      if (p.sneaking && p.onGround === false && !inLiquid && !climbable && p.vy <= 0 && !p.flying) {
        const grounded = (x, z) => w.collidersIn(x - p.w, p.y - 0.05, z - p.w, x + p.w, p.y, z + p.w).length > 0;
        if (!grounded(p.x, p.z)) {
          if (grounded(px, p.z)) { p.x = px; p.vx = 0; } else if (grounded(p.x, pz)) { p.z = pz; p.vz = 0; } else if (grounded(px, pz)) { p.x = px; p.z = pz; p.vx = p.vz = 0; }
          p.onGround = grounded(p.x, p.z); if (p.onGround) p.vy = 0;
        }
      }
      if (p.flying && p.onGround && inp.sneak) p.flying = false;
      if (p.fallDamage) { this.damagePlayer(Math.round(p.fallDamage), 'fall'); this.sound('fall', p.x, p.y, p.z); p.fallDamage = 0; }
      if (p.onGround && Math.hypot(p.vx, p.vz) > 1 && this.tickCount % (p.sprinting ? 5 : 7) === 0) { const g = B[w.getBlock(floor(p.x), floor(p.y - 0.2), floor(p.z))]; if (g.id) this.sound('step_' + g.sound, p.x, p.y, p.z); }
      if (p.inWater && !this.wasInWater) this.sound('splash', p.x, p.y, p.z);
      this.wasInWater = p.inWater;
    }
    environment() {
      const p = this.player, w = this.world;
      if (p.dead) return;
      const headIn = w.liquidAt(p.x, p.y + p.eye, p.z);
      if (headIn === 8) { p.air--; if (p.air <= -20) { p.air = 0; this.damagePlayer(2, 'drown'); } } else p.air = Math.min(300, p.air + 4);
      if (p.inLava) { p.burning = 6; if (this.tickCount % 10 === 0) this.damagePlayer(4, 'lava'); }
      if (p.burning > 0) { p.burning -= DT; if (p.inWater) p.burning = 0; else if (this.tickCount % 20 === 0) this.damagePlayer(1, 'fire'); }
      const hb = B[w.getBlock(floor(p.x), floor(p.y + p.eye), floor(p.z))];
      if (hb.opaque && hb.model === 'cube' && this.tickCount % 10 === 0 && this.mode !== 'creative') this.damagePlayer(1, 'suffocate');
      if (p.y < -5 && this.tickCount % 10 === 0) this.damagePlayer(4, 'void');
      if (this.tickCount % 10 === 0) {
        const a = p.aabb();
        for (let x = floor(a[0] - 0.05); x <= floor(a[3] + 0.05); x++) for (let z = floor(a[2] - 0.05); z <= floor(a[5] + 0.05); z++) for (let y = floor(a[1]); y <= floor(a[4]); y++) if (B[w.getBlock(x, y, z)].hurts) { this.damagePlayer(1, 'cactus'); }
      }
      if (this.difficulty === 0 && p.hp < 20 && this.tickCount % 20 === 0) p.hp++;
      else if (p.hp < 20 && p.hp > 0 && this.mode !== 'creative' && this.tickCount % 400 === 0 && this.difficulty <= 1) p.hp++;
      p.hurtT = Math.max(0, p.hurtT - DT);
    }

    tickEntities() {
      const p = this.player;
      for (const e of this.entities) {
        if (e.dead) continue;
        if (e instanceof M.Mob) { if (!this.world.isLoaded(floor(e.x), floor(e.z))) continue; e.ai(this, DT); }
        else e.tick(this, DT);
        if (e instanceof M.ItemEntity && e.pickupDelay <= 0 && !p.dead) {
          const ddx = p.x - e.x, ddy = (p.y + 0.8) - e.y, ddz = p.z - e.z, dd = Math.hypot(ddx, ddy, ddz);
          if (dd < 2.6 && dd > 0.6 && magnetItem(e, ddx, ddy, ddz, dd)) {}
        }
        if (e instanceof M.ItemEntity && e.pickupDelay <= 0 && !p.dead && Math.abs(e.x - p.x) < 1.3 && Math.abs(e.z - p.z) < 1.3 && e.y > p.y - 1 && e.y < p.y + 2) {
          const left = this.addToInventory(e.stack);
          if (!left || left.count < e.stack.count) { this.sound('pop', p.x, p.y, p.z); this.events.push({ type: 'pickup', id: e.stack.id }); if (e.stack.id === K.log.id) this.achieve('wood'); }
          if (left) e.stack = left; else e.dead = true;
        }
      }
      for (let i = 0; i < this.entities.length; i++) {
        const a = this.entities[i]; if (a.dead || !(a instanceof M.ItemEntity)) continue;
        for (let j = i + 1; j < this.entities.length; j++) {
          const b = this.entities[j];
          if (b.dead || !(b instanceof M.ItemEntity) || b.stack.id !== a.stack.id || (b.stack.dmg || 0) !== (a.stack.dmg || 0)) continue;
          const max = I[a.stack.id].stack || 64;
          if (a.stack.count + b.stack.count <= max && Math.abs(a.x - b.x) < 0.8 && Math.abs(a.y - b.y) < 0.8 && Math.abs(a.z - b.z) < 0.8) { a.stack.count += b.stack.count; b.dead = true; }
        }
      }
      let write = 0;
      for (let i = 0; i < this.entities.length; i++) { const e = this.entities[i]; if (!e.dead) this.entities[write++] = e; }
      this.entities.length = write;
    }
    spawnMobs() {
      const p = this.player, w = this.world;
      let hostile = 0, passive = 0;
      for (const e of this.entities) if (e instanceof M.Mob) { if (e.def.hostile) hostile++; else passive++; }
      const hostileCap = this.difficulty === 0 ? 0 : 22, passiveCap = 14;
      for (let attempt = 0; attempt < 6; attempt++) {
        const x = floor(p.x) + this.rng.int(96) - 48, z = floor(p.z) + this.rng.int(96) - 48;
        if (!w.isLoaded(x, z)) continue;
        const wantHostile = this.rng() < 0.75;
        if (wantHostile && hostile >= hostileCap) continue;
        if (!wantHostile && passive >= passiveCap) continue;
        const y = wantHostile ? 1 + this.rng.int(M.CH - 2) : w.heightAt(x, z);
        const ground = B[w.getBlock(x, y - 1, z)];
        if (!ground.solid || ground.liquid || w.getBlock(x, y, z) !== 0 || w.getBlock(x, y + 1, z) !== 0) continue;
        const d = Math.hypot(x + 0.5 - p.x, y - p.y, z + 0.5 - p.z);
        if (d < (wantHostile ? 24 : 14) || d > 64) continue;
        let type;
        if (wantHostile) {
          if (this.lightAt(x, y, z) > 7) continue;
          type = this.rng.pick(['zombie', 'zombie', 'skeleton', 'creeper', 'spider']);
        } else {
          if (ground.id !== K.grass.id && ground.id !== K.snow_grass.id) continue;
          if (w.getSky(x, y, z) < 9) continue;
          type = this.rng.pick(['pig', 'cow', 'sheep', 'chicken']);
        }
        const n = wantHostile ? 1 + this.rng.int(2) : 2 + this.rng.int(3);
        for (let k = 0; k < n; k++) {
          const sx = x + 0.5 + (k ? this.rng.int(5) - 2 : 0), sz = z + 0.5 + (k ? this.rng.int(5) - 2 : 0);
          if (k && (w.getBlock(floor(sx), y, floor(sz)) !== 0 || !B[w.getBlock(floor(sx), y - 1, floor(sz))].solid)) continue;
          const m = new M.Mob(type, sx, y, sz);
          this.entities.push(m);
          if (wantHostile) hostile++; else passive++;
        }
      }
      for (const e of this.entities) {
        if (!(e instanceof M.Mob)) continue;
        const d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d > 80) e.dead = true;
        else if (e.def.hostile && d > 40 && this.rng() < 0.02) e.dead = true;
      }
    }
    tickBlockEntities() {
      const p = this.player;
      for (const [k, be] of this.world.blockEntities) {
        if (be.type === 'furnace') this.tickFurnace(k, be);
        else if (be.type === 'spawner') {
          be.cd = (be.cd || 0) - DT;
          if (be.cd > 0) continue;
          be.cd = 6 + this.rng() * 8;
          const [x, y, z] = k.split(',').map(Number);
          if (this.difficulty === 0 || Math.hypot(x - p.x, y - p.y, z - p.z) > 16) continue;
          let near = 0; for (const e of this.entities) if (e instanceof M.Mob && e.def.hostile && Math.hypot(e.x - x, e.z - z) < 8) near++;
          if (near >= 6) continue;
          for (let t = 0; t < 3; t++) {
            const sx = x + this.rng.int(7) - 3, sz = z + this.rng.int(7) - 3, sy = y + this.rng.int(3) - 1;
            if (this.world.getBlock(sx, sy, sz) === 0 && this.world.getBlock(sx, sy + 1, sz) === 0 && B[this.world.getBlock(sx, sy - 1, sz)].solid && this.lightAt(sx, sy, sz) < 9) { this.entities.push(new M.Mob(be.mob, sx + 0.5, sy, sz + 0.5)); break; }
          }
        }
      }
    }
    tickFurnace(k, be) {
      const s = be.slots, input = s[0], fuel = s[1], out = s[2];
      const result = input ? M.SMELT[input.id] : null;
      const canSmelt = result && (!out || (out.id === result && out.count < (I[result].stack || 64)));
      const wasLit = be.burn > 0;
      if (be.burn > 0) be.burn--;
      if (be.burn <= 0 && canSmelt && fuel && M.FUEL[fuel.id]) {
        be.burn = be.burnMax = M.FUEL[fuel.id] * 20;
        if (fuel.id === K.lava_bucket.id) s[1] = stackOf(K.bucket.id, 1); else { fuel.count--; if (!fuel.count) s[1] = null; }
      }
      if (be.burn > 0 && canSmelt) {
        be.cook++;
        if (be.cook >= 200) {
          be.cook = 0;
          if (out) out.count++; else s[2] = stackOf(result, 1);
          input.count--; if (!input.count) s[0] = null;
          if (result === K.iron_ingot.id) this.achieve('iron');
          if (result === K.gold_ingot.id) this.achieve('gold');
          if (result === K.cooked_porkchop.id || result === K.cooked_beef.id || result === K.cooked_chicken.id) this.achieve('cooked');
        }
      } else if (be.cook > 0) be.cook = Math.max(0, be.cook - 2);
      const lit = be.burn > 0;
      if (lit !== wasLit) {
        const [x, y, z] = k.split(',').map(Number);
        const cur = this.world.getBlock(x, y, z);
        if (cur === K.furnace.id || cur === K.furnace_lit.id) this.world.setBlock(x, y, z, lit ? K.furnace_lit.id : K.furnace.id, this.world.getMeta(x, y, z));
      }
    }
    processWorldEvents() {
      const w = this.world;
      for (const ev of w.events) {
        if (ev.type === 'fall') this.entities.push(new M.FallingBlock(ev.x, ev.y, ev.z, ev.id));
        else if (ev.type === 'break') { const drop = w.dropFor(ev.id, this.rng); if (drop) this.dropItem(ev.x + 0.5, ev.y + 0.3, ev.z + 0.5, drop); if (!ev.silent) this.sound('break_' + B[ev.id].sound, ev.x, ev.y, ev.z); }
      }
      w.events.length = 0;
    }

    tick(inp = {}) {
      const p = this.player;
      this.tickCount++; this.world.tickCount = this.tickCount;
      if (this.sleeping > 0) { this.sleeping += DT; if (this.sleeping > 1.5) { this.time = floor(this.time / DAY) * DAY + DAY; this.sleeping = 0; this.achieve('bed'); this.events.push({ type: 'wake' }); } }
      else this.time++;
      if (this.time % DAY === 0) this.stats.days++;
      if (this.time % DAY === 23300 && this.stats.days >= 0 && this.tickCount > 2000) this.achieve('night');
      if (inp.yaw != null) p.yaw = inp.yaw; if (inp.pitch != null) p.pitch = M.clamp(inp.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
      if (inp.select != null) this.selected = M.clamp(inp.select, 0, 8);
      if (inp.toggleFly && this.mode === 'creative') { p.flying = !p.flying; p.vy = 0; }
      this.attackCd = Math.max(0, this.attackCd - DT); this.useCd = Math.max(0, this.useCd - DT);
      p.swing = Math.max(0, p.swing - DT);
      this.world.load(floor(p.x), floor(p.z), this.renderDistance + 1, inp.loadBudget != null ? inp.loadBudget : 6);
      if (!this.world.isLoaded(floor(p.x), floor(p.z))) return;
      this.world.tickFluids();
      this.world.randomTicks(floor(p.x), floor(p.z), this.renderDistance + 1, this.rng);
      this.processWorldEvents();
      this.movePlayer(inp);
      this.environment();
      this.updateTarget();
      if (!this.container && !p.dead) {
        if (inp.attackClick) this.attack();
        this.updateBreaking(inp.attack);
        if (inp.use) this.use();
        if (inp.dropKey) this.dropHeld(!!inp.sneak);
      } else this.breaking = null;
      this.tickEntities();
      this.processWorldEvents();
      this.tickBlockEntities();
      if (this.tickCount % 20 === 0) this.spawnMobs();
    }

    serialize() {
      const p = this.player, w = this.world;
      const edits = {};
      for (const [k, m] of w.edits) { const arr = []; for (const [i, v] of m) arr.push(i, v); edits[k] = arr; }
      const be = [];
      for (const [k, v] of w.blockEntities) be.push([k, v]);
      const mobs = this.entities.filter(e => e instanceof M.Mob && e.hp > 0).map(e => ({ type: e.type, x: e.x, y: e.y, z: e.z, hp: e.hp }));
      const items = this.entities.filter(e => e instanceof M.ItemEntity).map(e => ({ x: e.x, y: e.y, z: e.z, stack: e.stack }));
      return {
        v: 1, seed: this.seed, name: this.name, mode: this.mode, difficulty: this.difficulty, time: this.time, tickCount: this.tickCount,
        player: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, hp: p.hp, air: p.air, spawn: p.spawn, flying: p.flying, dead: p.dead },
        inventory: this.inventory, armor: this.armor, selected: this.selected, edits, be, mobs, items, achievements: [...this.achievements], stats: this.stats, saved: Date.now()
      };
    }
    restore(s) {
      const p = this.player, w = this.world;
      this.name = s.name; this.mode = s.mode; this.difficulty = s.difficulty; this.time = s.time; this.tickCount = s.tickCount || 0;
      Object.assign(p, s.player); p.dead = false; if (s.player.dead) p.hp = 20;
      this.inventory = s.inventory.map(x => x ? Object.assign({}, x) : null); while (this.inventory.length < 36) this.inventory.push(null);
      this.armor = (s.armor || []).map(x => x ? Object.assign({}, x) : null); while (this.armor.length < 4) this.armor.push(null);
      this.selected = s.selected || 0;
      for (const k of Object.keys(s.edits || {})) { const arr = s.edits[k], m = new Map(); for (let i = 0; i < arr.length; i += 2) m.set(arr[i], arr[i + 1]); w.edits.set(k, m); }
      for (const [k, v] of (s.be || [])) w.blockEntities.set(k, v);
      for (const m of (s.mobs || [])) { const e = new M.Mob(m.type, m.x, m.y, m.z); e.hp = m.hp; this.entities.push(e); }
      for (const it of (s.items || [])) this.entities.push(new M.ItemEntity(it.x, it.y, it.z, it.stack));
      this.achievements = new Set(s.achievements || []);
      Object.assign(this.stats, s.stats || {});
      if (!p.spawn) p.spawn = { x: p.x, y: p.y, z: p.z };
    }
  }

  Object.assign(M, { Game, ACHIEVEMENTS, stackOf, DT, DAY });
})(globalThis.Mc98 = globalThis.Mc98 || {});
