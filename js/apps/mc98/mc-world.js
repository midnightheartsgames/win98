(function (M) {
  'use strict';
  const CW = 16, CH = 64, SEA = 28;
  const B = M.BLOCKS;
  const floor = Math.floor;
  const idx = (x, y, z) => (x << 10) | (z << 6) | y;
  const ckey = (cx, cz) => cx + ',' + cz;
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  class Chunk {
    constructor(cx, cz) {
      this.cx = cx; this.cz = cz; this.key = ckey(cx, cz);
      this.blocks = new Uint8Array(CW * CW * CH);
      this.meta = new Uint8Array(CW * CW * CH);
      this.light = new Uint8Array(CW * CW * CH);
      this.stage = 0; this.dirty = true; this.mesh = null; this.heights = new Uint8Array(CW * CW);
    }
  }

  const MODEL_BOX = {
    cube: [0, 0, 0, 1, 1, 1], liquid: [0, 0, 0, 1, 0.875, 1], half: [0, 0, 0, 1, 0.5, 1], cross: [0.2, 0, 0.2, 0.8, 0.8, 0.8],
    cactus: [0.0625, 0, 0.0625, 0.9375, 1, 0.9375], fence: [0.375, 0, 0.375, 0.625, 1.5, 0.625]
  };
  function blockBox(b, meta) {
    if (b.model === 'torch') {
      const f = meta & 7;
      if (f === 0) return [0.375, 0, 0.375, 0.625, 0.6, 0.625];
      const off = [[0, 0], [-0.35, 0], [0.35, 0], [0, -0.35], [0, 0.35]][f];
      return [0.375 + off[0], 0.2, 0.375 + off[1], 0.625 + off[0], 0.8, 0.625 + off[1]];
    }
    if (b.model === 'ladder') {
      const f = meta & 3;
      return [[0, 0, 0.875, 1, 1, 1], [0, 0, 0, 1, 1, 0.125], [0.875, 0, 0, 1, 1, 1], [0, 0, 0, 0.125, 1, 1]][f];
    }
    return MODEL_BOX[b.model] || MODEL_BOX.cube;
  }

  class World {
    constructor(opts = {}) {
      this.seed = opts.seed >>> 0;
      this.chunks = new Map();
      this.edits = new Map();
      this.blockEntities = new Map();
      this.gen = new M.Generator(this.seed);
      this.fluidQueue = new Map();
      this.events = [];
      this.tickCount = 0;
      this.rng = M.makeRandom(this.seed ^ 0x5bd1e995);
      this.lastChunk = null;
      this.dirtyCount = 0;
    }
    chunkAt(x, z) {
      const cx = x >> 4, cz = z >> 4, lc = this.lastChunk;
      if (lc && lc.cx === cx && lc.cz === cz) return lc;
      const c = this.chunks.get(ckey(cx, cz));
      if (c) this.lastChunk = c;
      return c || null;
    }
    getBlock(x, y, z) {
      if (y < 0 || y >= CH) return 0;
      const c = this.chunkAt(x, z);
      return c ? c.blocks[idx(x & 15, y, z & 15)] : 0;
    }
    getMeta(x, y, z) {
      if (y < 0 || y >= CH) return 0;
      const c = this.chunkAt(x, z);
      return c ? c.meta[idx(x & 15, y, z & 15)] : 0;
    }
    getSky(x, y, z) { if (y >= CH) return 15; if (y < 0) return 0; const c = this.chunkAt(x, z); return c ? c.light[idx(x & 15, y, z & 15)] >> 4 : 15; }
    getBlockLight(x, y, z) { if (y < 0 || y >= CH) return 0; const c = this.chunkAt(x, z); return c ? c.light[idx(x & 15, y, z & 15)] & 15 : 0; }
    setSky(x, y, z, v) { const c = this.chunkAt(x, z); if (!c || y < 0 || y >= CH) return; const i = idx(x & 15, y, z & 15); c.light[i] = (c.light[i] & 15) | (v << 4); this.markDirty(c, x, z); }
    setBlockLight(x, y, z, v) { const c = this.chunkAt(x, z); if (!c || y < 0 || y >= CH) return; const i = idx(x & 15, y, z & 15); c.light[i] = (c.light[i] & 0xf0) | v; this.markDirty(c, x, z); }
    markDirty(c, x, z) {
      if (!c.dirty) { c.dirty = true; this.dirtyCount++; }
      const lx = x & 15, lz = z & 15;
      if (lx === 0) this.markChunkDirty(c.cx - 1, c.cz); else if (lx === 15) this.markChunkDirty(c.cx + 1, c.cz);
      if (lz === 0) this.markChunkDirty(c.cx, c.cz - 1); else if (lz === 15) this.markChunkDirty(c.cx, c.cz + 1);
    }
    markChunkDirty(cx, cz) { const c = this.chunks.get(ckey(cx, cz)); if (c && !c.dirty) { c.dirty = true; this.dirtyCount++; } }
    isLoaded(x, z) { const c = this.chunkAt(x, z); return !!c && c.stage >= 2; }
    opacityAt(x, y, z) { return B[this.getBlock(x, y, z)].opacity; }

    setBlock(x, y, z, id, meta = 0, o = {}) {
      if (y < 0 || y >= CH) return false;
      const c = this.chunkAt(x, z);
      if (!c) return false;
      const i = idx(x & 15, y, z & 15);
      const old = c.blocks[i], oldMeta = c.meta[i];
      if (old === id && oldMeta === meta) return true;
      c.blocks[i] = id; c.meta[i] = meta;
      const lx = x & 15, lz = z & 15;
      if (id !== 0 && y >= c.heights[lx * 16 + lz]) c.heights[lx * 16 + lz] = y + 1;
      else if (id === 0 && y === c.heights[lx * 16 + lz] - 1) { let h = y; while (h > 0 && c.blocks[idx(lx, h - 1, lz)] === 0) h--; c.heights[lx * 16 + lz] = h; }
      if (o.record !== false) {
        let e = this.edits.get(c.key);
        if (!e) { e = new Map(); this.edits.set(c.key, e); }
        e.set(i, id | (meta << 8));
      }
      if (c.stage >= 2 && o.light !== false) this.relight(x, y, z, old, id);
      else this.markDirty(c, x, z);
      if (old !== id && B[old].container && this.blockEntities.has(M.key3(x, y, z)) && !B[id].container) this.blockEntities.delete(M.key3(x, y, z));
      if (o.update !== false) {
        this.updateNeighbors(x, y, z);
        if (B[id].liquid || B[old].liquid) this.scheduleFluid(x, y, z, B[id].liquid ? B[id].tick : 5);
      }
      return true;
    }

    relight(x, y, z, oldId, newId) {
      const ob = B[oldId], nb = B[newId];
      if (ob.opacity !== nb.opacity || ob.light !== nb.light) {
        const skyQ = [], blkQ = [];
        if (nb.opacity > ob.opacity || nb.light < ob.light) {
          if (this.getSky(x, y, z) > 0) this.removeLight(x, y, z, 'sky', skyQ);
          if (this.getBlockLight(x, y, z) > 0) this.removeLight(x, y, z, 'block', blkQ);
        }
        if (nb.light > 0) { this.setBlockLight(x, y, z, nb.light); blkQ.push(x, y, z); }
        for (const d of DIRS) { skyQ.push(x + d[0], y + d[1], z + d[2]); blkQ.push(x + d[0], y + d[1], z + d[2]); }
        this.propagate(skyQ, 'sky'); this.propagate(blkQ, 'block');
      } else this.markDirty(this.chunkAt(x, z), x, z);
    }
    propagate(q, kind) {
      const sky = kind === 'sky';
      const get = sky ? this.getSky.bind(this) : this.getBlockLight.bind(this);
      const set = sky ? this.setSky.bind(this) : this.setBlockLight.bind(this);
      let head = 0;
      while (head < q.length) {
        const x = q[head], y = q[head + 1], z = q[head + 2]; head += 3;
        if (y < 0 || y >= CH) continue;
        const lv = get(x, y, z);
        if (lv <= 1) continue;
        for (const d of DIRS) {
          const nx = x + d[0], ny = y + d[1], nz = z + d[2];
          if (ny < 0 || ny >= CH) continue;
          const c = this.chunkAt(nx, nz);
          if (!c || c.stage < 2) continue;
          const op = B[c.blocks[idx(nx & 15, ny, nz & 15)]].opacity;
          let nl = (sky && lv === 15 && d[1] === -1 && op === 0) ? 15 : lv - Math.max(1, op);
          if (op >= 15) nl = 0;
          if (nl > get(nx, ny, nz)) { set(nx, ny, nz, nl); q.push(nx, ny, nz); }
        }
      }
    }
    removeLight(x, y, z, kind, reQ) {
      const sky = kind === 'sky';
      const get = sky ? this.getSky.bind(this) : this.getBlockLight.bind(this);
      const set = sky ? this.setSky.bind(this) : this.setBlockLight.bind(this);
      const q = [x, y, z, get(x, y, z)];
      set(x, y, z, 0);
      let head = 0;
      while (head < q.length) {
        const qx = q[head], qy = q[head + 1], qz = q[head + 2], lv = q[head + 3]; head += 4;
        for (const d of DIRS) {
          const nx = qx + d[0], ny = qy + d[1], nz = qz + d[2];
          if (ny < 0 || ny >= CH) continue;
          const c = this.chunkAt(nx, nz);
          if (!c || c.stage < 2) continue;
          const nl = get(nx, ny, nz);
          if (nl === 0) continue;
          if (nl < lv || (sky && d[1] === -1 && nl === 15 && lv === 15)) { set(nx, ny, nz, 0); q.push(nx, ny, nz, nl); }
          else reQ.push(nx, ny, nz);
        }
      }
    }
    lightChunk(c) {
      const skyQ = [], blkQ = [];
      const bx = c.cx * 16, bz = c.cz * 16;
      for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
        let lv = 15;
        for (let y = CH - 1; y >= 0; y--) {
          const i = idx(lx, y, lz), b = B[c.blocks[i]];
          if (b.opacity > 0) lv = Math.max(0, lv - Math.max(1, b.opacity)), lv = b.opacity >= 15 ? 0 : lv;
          c.light[i] = (lv << 4) | (b.light);
          if (lv > 0) skyQ.push(bx + lx, y, bz + lz);
          if (b.light > 0) blkQ.push(bx + lx, y, bz + lz);
        }
      }
      c.stage = 2;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = this.chunks.get(ckey(c.cx + dx, c.cz + dz));
        if (!n || n.stage < 2) continue;
        const nbx = n.cx * 16, nbz = n.cz * 16;
        for (let i = 0; i < 16; i++) for (let y = 0; y < CH; y++) {
          const lx = dx === 1 ? 0 : dx === -1 ? 15 : i, lz = dz === 1 ? 0 : dz === -1 ? 15 : i;
          const l = n.light[idx(lx, y, lz)];
          if (l >> 4 > 1) skyQ.push(nbx + lx, y, nbz + lz);
          if ((l & 15) > 1) blkQ.push(nbx + lx, y, nbz + lz);
        }
      }
      this.propagate(skyQ, 'sky'); this.propagate(blkQ, 'block');
      if (!c.dirty) { c.dirty = true; this.dirtyCount++; }
    }

    ensureChunk(cx, cz) {
      const k = ckey(cx, cz);
      let c = this.chunks.get(k);
      if (c) return c;
      c = new Chunk(cx, cz);
      this.gen.terrain(c);
      this.chunks.set(k, c);
      return c;
    }
    decorateChunk(c) {
      if (c.stage >= 1) return;
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.ensureChunk(c.cx + dx, c.cz + dz);
      this.gen.decorate(this, c);
      c.stage = 1;
      const e = this.edits.get(c.key);
      if (e) for (const [i, v] of e) { c.blocks[i] = v & 255; c.meta[i] = v >> 8; }
      for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) { let h = CH; while (h > 0 && c.blocks[idx(lx, h - 1, lz)] === 0) h--; c.heights[lx * 16 + lz] = h; }
    }
    load(px, pz, radius, budgetMs = 8) {
      const t0 = Date.now();
      const pcx = px >> 4, pcz = pz >> 4;
      const order = [];
      for (let dx = -radius - 1; dx <= radius + 1; dx++) for (let dz = -radius - 1; dz <= radius + 1; dz++) order.push([dx * dx + dz * dz, pcx + dx, pcz + dz]);
      order.sort((a, b) => a[0] - b[0]);
      let work = 0;
      for (const [d2, cx, cz] of order) {
        const c = this.chunks.get(ckey(cx, cz));
        if (c && c.stage >= 2) continue;
        if (d2 > (radius + 1) * (radius + 1)) continue;
        if (c && d2 > radius * radius) continue;
        const ch = this.ensureChunk(cx, cz);
        if (d2 <= radius * radius) {
          this.decorateChunk(ch);
          for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.decorateChunk(this.ensureChunk(cx + dx, cz + dz));
          this.lightChunk(ch);
        }
        work++;
        if (Date.now() - t0 > budgetMs) return work;
      }
      for (const c of this.chunks.values()) {
        const dx = c.cx - pcx, dz = c.cz - pcz;
        if (dx * dx + dz * dz > (radius + 4) * (radius + 4)) { if (c.mesh && this.onUnload) this.onUnload(c); this.chunks.delete(c.key); if (this.lastChunk === c) this.lastChunk = null; }
      }
      return work;
    }
    readyChunks(px, pz, radius) {
      const out = [];
      const pcx = px >> 4, pcz = pz >> 4;
      for (const c of this.chunks.values()) { const dx = c.cx - pcx, dz = c.cz - pcz; if (c.stage >= 2 && dx * dx + dz * dz <= radius * radius) out.push(c); }
      return out;
    }
    heightAt(x, z) {
      const c = this.chunkAt(x, z);
      if (!c) return this.gen.heightAt(x, z);
      return c.heights[(x & 15) * 16 + (z & 15)];
    }
    topSolid(x, z) {
      for (let y = CH - 1; y >= 0; y--) { const b = B[this.getBlock(x, y, z)]; if (b.solid && !b.liquid) return y; }
      return 0;
    }

    updateNeighbors(x, y, z) {
      for (const d of DIRS) {
        const nx = x + d[0], ny = y + d[1], nz = z + d[2];
        const id = this.getBlock(nx, ny, nz), b = B[id];
        if (id === 0) continue;
        if (b.liquid) this.scheduleFluid(nx, ny, nz, b.tick);
        else if (b.falls && d[1] === 1 && this.canFallInto(x, y, z)) this.startFall(nx, ny, nz);
        else if (b.attach && !this.attachmentValid(nx, ny, nz, id, this.getMeta(nx, ny, nz))) this.breakBlock(nx, ny, nz);
        else if ((b.model === 'cross' || b.model === 'half') && d[1] === 1 && !B[this.getBlock(x, y, z)].solid) this.breakBlock(nx, ny, nz);
      }
    }
    canFallInto(x, y, z) { const b = B[this.getBlock(x, y, z)]; return y >= 0 && (b.id === 0 || b.liquid || b.model === 'cross'); }
    startFall(x, y, z) { const id = this.getBlock(x, y, z); this.setBlock(x, y, z, 0, 0, { update: false }); this.events.push({ type: 'fall', x, y, z, id }); this.updateNeighbors(x, y, z); }
    attachmentValid(x, y, z, id, meta) {
      const b = B[id];
      if (b.model === 'torch') {
        const f = meta & 7;
        if (f === 0) { const u = B[this.getBlock(x, y - 1, z)]; return u.solid || u.model === 'fence'; }
        const d = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]][f];
        return B[this.getBlock(x + d[0], y, z + d[1])].opaque;
      }
      if (b.model === 'ladder') { const d = [[0, 1], [0, -1], [1, 0], [-1, 0]][meta & 3]; return B[this.getBlock(x + d[0], y, z + d[1])].opaque; }
      return true;
    }
    breakBlock(x, y, z, silent) {
      const id = this.getBlock(x, y, z);
      if (!id) return;
      const meta = this.getMeta(x, y, z);
      this.setBlock(x, y, z, 0, 0);
      this.events.push({ type: 'break', x, y, z, id, meta, silent: !!silent });
    }
    dropFor(id, rng) { return B[id].dropFn(rng || this.rng); }

    scheduleFluid(x, y, z, delay) { const k = M.key3(x, y, z); if (!this.fluidQueue.has(k)) this.fluidQueue.set(k, { x, y, z, at: this.tickCount + (delay || 5) }); }
    tickFluids() {
      if (!this.fluidQueue.size) return;
      const due = [];
      for (const [k, f] of this.fluidQueue) if (f.at <= this.tickCount) { due.push(f); this.fluidQueue.delete(k); }
      for (const f of due) this.updateFluid(f.x, f.y, f.z);
    }
    updateFluid(x, y, z) {
      const id = this.getBlock(x, y, z), b = B[id];
      if (!b.liquid) return;
      const meta = this.getMeta(x, y, z), level = meta & 7, source = level === 0, falling = !!(meta & 8);
      const maxSpread = id === 8 ? 7 : 3;
      if (!source) {
        let best = 99, sources = 0;
        const above = this.getBlock(x, y + 1, z);
        if (above === id) best = 0;
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = this.getBlock(x + d[0], y, z + d[1]);
          if (n === id) { const nl = this.getMeta(x + d[0], y, z + d[1]) & 7; if (nl === 0) sources++; if (nl + 1 < best) best = nl + 1; }
        }
        if (id === 8 && sources >= 2 && B[this.getBlock(x, y - 1, z)].solid) { this.setBlock(x, y, z, 8, 0); return; }
        const want = above === id ? 1 : best;
        if (want > maxSpread) { this.setBlock(x, y, z, 0, 0); return; }
        if (want !== level || falling !== (above === id)) { this.setBlock(x, y, z, id, want | (above === id ? 8 : 0)); return; }
      }
      const below = this.getBlock(x, y - 1, z), bb = B[below];
      if (y > 0 && (below === 0 || bb.model === 'cross' || (bb.liquid && below !== id))) {
        if (bb.liquid && below !== id) { this.setBlock(x, y - 1, z, this.mixResult(id, below, this.getMeta(x, y - 1, z))); }
        else { if (bb.model === 'cross') this.events.push({ type: 'break', x, y: y - 1, z, id: below, meta: 0, silent: true }); this.setBlock(x, y - 1, z, id, 1 | 8); }
        return;
      }
      if (bb.liquid && below === id && (this.getMeta(x, y - 1, z) & 7) !== 0 && !falling) { this.setBlock(x, y - 1, z, id, 1 | 8); }
      if (level >= maxSpread) return;
      if (!bb.solid) return;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + d[0], nz = z + d[1], n = this.getBlock(nx, y, nz), nb = B[n];
        if (n === 0 || nb.model === 'cross') {
          if (nb.model === 'cross') this.events.push({ type: 'break', x: nx, y, z: nz, id: n, meta: 0, silent: true });
          this.setBlock(nx, y, nz, id, level + 1);
        } else if (nb.liquid && n !== id) this.setBlock(nx, y, nz, this.mixResult(id, n, this.getMeta(nx, y, nz)));
        else if (n === id && (this.getMeta(nx, y, nz) & 7) > level + 1) this.setBlock(nx, y, nz, id, level + 1);
      }
    }
    mixResult(flowing, target, targetMeta) {
      if (target === 9) return (targetMeta & 7) === 0 ? 29 : 4;
      return 1;
    }

    randomTicks(px, pz, radius, rng) {
      const pcx = px >> 4, pcz = pz >> 4;
      for (const c of this.chunks.values()) {
        const dx = c.cx - pcx, dz = c.cz - pcz;
        if (c.stage < 2 || dx * dx + dz * dz > radius * radius) continue;
        for (let n = 0; n < 3; n++) {
          const i = rng.int(CW * CW * CH), id = c.blocks[i];
          if (!id || !B[id].randomTick) continue;
          const x = c.cx * 16 + (i >> 10), z = c.cz * 16 + ((i >> 6) & 15), y = i & 63;
          this.randomTick(x, y, z, id, rng);
        }
      }
    }
    randomTick(x, y, z, id, rng) {
      if (id === 2) {
        const up = B[this.getBlock(x, y + 1, z)];
        if (up.opacity >= 2 && !up.liquid && up.id !== 45) { if (this.getSky(x, y + 1, z) < 4 && this.getBlockLight(x, y + 1, z) < 4) this.setBlock(x, y, z, 3); return; }
        if (this.getSky(x, y + 1, z) >= 9 || this.getBlockLight(x, y + 1, z) >= 9) {
          const tx = x + rng.int(3) - 1, ty = y + rng.int(3) - 1, tz = z + rng.int(3) - 1;
          if (this.getBlock(tx, ty, tz) === 3 && B[this.getBlock(tx, ty + 1, tz)].opacity < 2) this.setBlock(tx, ty, tz, this.gen.isSnowy(tx, tz) ? 37 : 2);
        }
      } else if (id === 6) {
        if (rng() < 0.25 && (this.getSky(x, y, z) >= 9 || this.getBlockLight(x, y, z) >= 9)) this.gen.growTree(this, x, y, z, rng, true);
      }
    }

    blockBox(x, y, z) { const id = this.getBlock(x, y, z); return id ? blockBox(B[id], this.getMeta(x, y, z)) : null; }
    collidersIn(minX, minY, minZ, maxX, maxY, maxZ, out = []) {
      for (let x = floor(minX); x < Math.ceil(maxX); x++) for (let z = floor(minZ); z < Math.ceil(maxZ); z++) for (let y = Math.max(0, floor(minY) - 1); y < Math.min(CH, Math.ceil(maxY)); y++) {
        const id = this.getBlock(x, y, z);
        if (!id) continue;
        const b = B[id];
        if (!b.solid) continue;
        const box = blockBox(b, this.getMeta(x, y, z));
        if (b.model === 'fence') {
          out.push([x + 0.375, y, z + 0.375, x + 0.625, y + 1.5, z + 0.625]);
          for (const [dx, dz, bx] of [[1, 0, [0.625, 0.4375, 1, 0.5625]], [-1, 0, [0, 0.4375, 0.375, 0.5625]], [0, 1, [0.4375, 0.625, 0.5625, 1]], [0, -1, [0.4375, 0, 0.5625, 0.375]]]) {
            const n = B[this.getBlock(x + dx, y, z + dz)];
            if (n.model === 'fence' || n.opaque) out.push([x + bx[0], y, z + bx[1], x + bx[2], y + 1.5, z + bx[3]]);
          }
          continue;
        }
        out.push([x + box[0], y + box[1], z + box[2], x + box[3], y + box[4], z + box[5]]);
      }
      return out;
    }
    raycast(ox, oy, oz, dx, dy, dz, maxDist, liquids = false) {
      let x = floor(ox), y = floor(oy), z = floor(oz);
      const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
      const tdx = Math.abs(1 / (dx || 1e-9)), tdy = Math.abs(1 / (dy || 1e-9)), tdz = Math.abs(1 / (dz || 1e-9));
      let tmx = (dx > 0 ? (x + 1 - ox) : (ox - x)) * tdx, tmy = (dy > 0 ? (y + 1 - oy) : (oy - y)) * tdy, tmz = (dz > 0 ? (z + 1 - oz) : (oz - z)) * tdz;
      let face = null, t = 0;
      for (let n = 0; n < 200; n++) {
        const id = this.getBlock(x, y, z);
        if (id) {
          const b = B[id];
          if (b.selectable || (liquids && b.liquid && (this.getMeta(x, y, z) & 7) === 0)) {
            const box = blockBox(b, this.getMeta(x, y, z));
            const hit = rayBox(ox, oy, oz, dx, dy, dz, x + box[0], y + box[1], z + box[2], x + box[3], y + box[4], z + box[5]);
            if (hit && hit.t <= maxDist) return { x, y, z, id, meta: this.getMeta(x, y, z), face: hit.face, t: hit.t, px: ox + dx * hit.t, py: oy + dy * hit.t, pz: oz + dz * hit.t };
          }
        }
        if (tmx < tmy && tmx < tmz) { x += stepX; t = tmx; tmx += tdx; face = stepX > 0 ? 1 : 0; }
        else if (tmy < tmz) { y += stepY; t = tmy; tmy += tdy; face = stepY > 0 ? 3 : 2; }
        else { z += stepZ; t = tmz; tmz += tdz; face = stepZ > 0 ? 5 : 4; }
        if (t > maxDist) return null;
        if (y < 0 || y >= CH) return null;
      }
      return null;
    }
    isSolidAt(x, y, z) { const b = B[this.getBlock(floor(x), floor(y), floor(z))]; return b.solid; }
    liquidAt(x, y, z) { const id = this.getBlock(floor(x), floor(y), floor(z)); return B[id].liquid ? id : 0; }
  }

  function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1) {
    let tmin = -Infinity, tmax = Infinity, face = -1;
    const axes = [[ox, dx, x0, x1, 0, 1], [oy, dy, y0, y1, 2, 3], [oz, dz, z0, z1, 4, 5]];
    for (const [o, d, a, b, fNeg, fPos] of axes) {
      if (Math.abs(d) < 1e-9) { if (o < a || o > b) return null; continue; }
      let t1 = (a - o) / d, t2 = (b - o) / d, f = d > 0 ? fNeg : fPos;
      if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
      if (t1 > tmin) { tmin = t1; face = f; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
    if (tmax < 0) return null;
    return { t: Math.max(0, tmin), face };
  }
  const FACE_NORMALS = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];

  Object.assign(M, { World, Chunk, CW, CH, SEA, idx, ckey, blockBox, rayBox, FACE_NORMALS, DIRS });
})(globalThis.Mc98 = globalThis.Mc98 || {});
