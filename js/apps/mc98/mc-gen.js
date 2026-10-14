(function (M) {
  'use strict';
  const B = M.BY_KEY;
  const CH = 64, SEA = 28;
  const floor = Math.floor;

  const BIOMES = {
    plains: { name: 'Равнины', top: 'grass', trees: [0, 2], flowers: 6, grass: 12, treeKind: 'oak' },
    forest: { name: 'Лес', top: 'grass', trees: [6, 10], flowers: 2, grass: 8, treeKind: 'oak', mushrooms: 2 },
    desert: { name: 'Пустыня', top: 'sand', trees: [0, 0], flowers: 0, grass: 0, cactus: [2, 6] },
    snow: { name: 'Тундра', top: 'snow_grass', trees: [2, 5], flowers: 0, grass: 2, treeKind: 'spruce', snow: true },
    mountain: { name: 'Горы', top: 'grass', trees: [0, 1], flowers: 1, grass: 3, treeKind: 'oak' },
    swamp: { name: 'Болото', top: 'grass', trees: [2, 4], flowers: 1, grass: 10, treeKind: 'oak', mushrooms: 4 }
  };

  class Generator {
    constructor(seed) {
      this.seed = seed;
      this.pCont = new M.Perlin(seed + 1);
      this.pRidge = new M.Perlin(seed + 2);
      this.pTemp = new M.Perlin(seed + 3);
      this.pHum = new M.Perlin(seed + 4);
      this.pCave1 = new M.Perlin(seed + 5);
      this.pCave2 = new M.Perlin(seed + 6);
      this.pCavern = new M.Perlin(seed + 7);
      this.pDetail = new M.Perlin(seed + 8);
      this.hCache = new Map();
    }
    heightAt(x, z) {
      const k = x + ',' + z;
      const c = this.hCache.get(k);
      if (c !== undefined) return c;
      const cont = this.pCont.fbm2(x / 190, z / 190, 4);
      const ridge = this.pRidge.ridged2(x / 260 + 7.3, z / 260 - 2.1, 3);
      const mount = M.smoothstep(0.55, 0.9, ridge);
      const detail = this.pDetail.fbm2(x / 38, z / 38, 3);
      let h = 30 + cont * 11 + detail * 4 + mount * 26 + Math.max(0, cont) * mount * 6;
      const temp = this.pTemp.fbm2(x / 420 + 11, z / 420 - 5, 2);
      const hum = this.pHum.fbm2(x / 380 - 3, z / 380 + 9, 2);
      if (temp > 0.3 && hum < -0.1) h = 30 + cont * 5 + detail * 2 + mount * 20;
      if (hum > 0.3 && Math.abs(temp) < 0.2 && mount < 0.1) h = Math.min(h, SEA + 1 + detail * 1.5);
      h = M.clamp(floor(h), 6, CH - 3);
      if (this.hCache.size > 20000) this.hCache.clear();
      this.hCache.set(k, h);
      return h;
    }
    biomeAt(x, z) {
      const temp = this.pTemp.fbm2(x / 420 + 11, z / 420 - 5, 2);
      const hum = this.pHum.fbm2(x / 380 - 3, z / 380 + 9, 2);
      if (this.heightAt(x, z) > 46) return 'mountain';
      if (temp < -0.28) return 'snow';
      if (temp > 0.3 && hum < -0.1) return 'desert';
      if (hum > 0.3 && Math.abs(temp) < 0.2) return 'swamp';
      if (hum > 0.08) return 'forest';
      return 'plains';
    }
    isSnowy(x, z) { return this.biomeAt(x, z) === 'snow'; }
    isCave(x, y, z, h) {
      if (y < 2) return false;
      const n1 = this.pCave1.noise3(x / 34, y / 22, z / 34), n2 = this.pCave2.noise3(x / 34 + 50, y / 22, z / 34 - 50);
      const w = 0.075 + (y < 14 ? 0.03 : 0);
      if (Math.abs(n1) < w && Math.abs(n2) < w) return y < h - 1 || (Math.abs(n1) < w * 0.5 && Math.abs(n2) < w * 0.5);
      if (y < 26 && this.pCavern.noise3(x / 60, y / 30, z / 60) > 0.58) return true;
      return false;
    }
    terrain(c) {
      const bx = c.cx * 16, bz = c.cz * 16, blocks = c.blocks, meta = c.meta;
      const stone = B.stone.id, dirt = B.dirt.id, sand = B.sand.id, water = B.water.id, lava = B.lava.id, bedrock = B.bedrock.id, sandstone = B.sandstone.id, clay = B.clay.id, grass = B.grass.id, snowGrass = B.snow_grass.id, gravel = B.gravel.id, snowBlock = B.snow.id, ice = B.ice.id;
      for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
        const x = bx + lx, z = bz + lz, h = this.heightAt(x, z), biome = this.biomeAt(x, z);
        const beach = h <= SEA + 2 && biome !== 'snow' && biome !== 'swamp';
        const desert = biome === 'desert';
        const col = (lx << 10) | (lz << 6);
        for (let y = 0; y < CH; y++) {
          let id = 0;
          if (y === 0 || (y === 1 && M.hash01(x, y, z, this.seed) < 0.5)) id = bedrock;
          else if (y < h) {
            if (y < h - 4) id = stone;
            else if (y < h - 1) id = desert ? (y < h - 3 ? sandstone : sand) : beach ? sand : dirt;
            else id = desert ? sand : beach ? sand : biome === 'snow' ? snowGrass : biome === 'mountain' && h > 52 ? (h > 56 ? snowBlock : stone) : grass;
            if (id !== bedrock && this.isCave(x, y, z, h)) id = y < 9 ? lava : 0;
            if (id === 0 && y >= h - 1 && y >= SEA - 1 && y <= SEA) id = y === h - 1 ? (beach ? sand : dirt) : id;
          } else if (y < SEA) id = water;
          if (id === water && y === SEA - 1 && biome === 'snow') id = ice;
          if (id === water && y < h + 1 && h < SEA - 2 && y === h && M.hash01(x, 0, z, this.seed + 9) < 0.35) { blocks[col | (y - 1)] = clay; }
          if (id === water && y === SEA - 1 && h >= SEA - 6 && h < SEA && M.hash01(x, 3, z, this.seed + 11) < 0.15) blocks[col | (h - 1)] = gravel;
          blocks[col | y] = id;
          if (id === water || id === lava) meta[col | y] = 0;
        }
        if (biome === 'snow' && h >= SEA && blocks[col | (h - 1)] !== 0 && blocks[col | h] === 0) blocks[col | h] = snowBlock;
        if (biome === 'mountain' && h > 56 && blocks[col | (h - 1)] === stone && blocks[col | h] === 0) blocks[col | h] = snowBlock;
      }
      this.placeOres(c);
    }
    placeOres(c) {
      const rnd = M.makeRandom(M.hashInt(c.cx, c.cz, 3, this.seed));
      const stone = B.stone.id;
      const veins = [[B.coal_ore.id, 14, 6, 56, 10], [B.iron_ore.id, 9, 2, 42, 7], [B.gold_ore.id, 2, 2, 26, 6], [B.diamond_ore.id, 1, 2, 13, 5], [B.gravel.id, 5, 4, 50, 14], [B.dirt.id, 6, 4, 50, 14], [B.glowstone.id, 0.25, 4, 14, 3]];
      for (const [id, count, y0, y1, size] of veins) {
        const n = floor(count) + (rnd() < count % 1 ? 1 : 0);
        for (let v = 0; v < n; v++) {
          let x = rnd.int(16), y = y0 + rnd.int(y1 - y0), z = rnd.int(16);
          for (let s = 0; s < size; s++) {
            if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < CH) { const i = (x << 10) | (z << 6) | y; if (c.blocks[i] === stone) c.blocks[i] = id; }
            const d = rnd.int(6); x += d === 0 ? 1 : d === 1 ? -1 : 0; y += d === 2 ? 1 : d === 3 ? -1 : 0; z += d === 4 ? 1 : d === 5 ? -1 : 0;
          }
        }
      }
    }

    decorate(world, c) {
      const self = this;
      const put = (x, y, z, id, meta, force) => {
        if (y < 0 || y >= CH) return;
        const lx = x - c.cx * 16, lz = z - c.cz * 16;
        if (lx < 0 || lx >= 16 || lz < 0 || lz >= 16) return;
        const i = (lx << 10) | (lz << 6) | y;
        if (!force && c.blocks[i] !== 0 && c.blocks[i] !== B.snow.id) return;
        c.blocks[i] = id; c.meta[i] = meta || 0;
      };
      const get = (x, y, z) => { const ch = world.chunkAt(x, z); return ch && y >= 0 && y < CH ? ch.blocks[((x & 15) << 10) | ((z & 15) << 6) | y] : 0; };
      for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
        const cx = c.cx + ox, cz = c.cz + oz;
        const rnd = M.makeRandom(M.hashInt(cx, cz, 5, this.seed));
        const bx = cx * 16, bz = cz * 16;
        const biome = BIOMES[this.biomeAt(bx + 8, bz + 8)];
        const surface = (x, z) => { const h = this.heightAt(x, z); const top = get(x, h - 1, z); if (top === 0 || top === B.water.id) return -1; if (top === B.snow.id) return h - 1; return h; };
        const trees = biome.trees[0] + rnd.int(biome.trees[1] - biome.trees[0] + 1);
        for (let t = 0; t < trees; t++) {
          const x = bx + 2 + rnd.int(12), z = bz + 2 + rnd.int(12), y = surface(x, z);
          if (y < 0) continue;
          const ground = get(x, y - 1, z);
          if (ground !== B.grass.id && ground !== B.snow_grass.id && ground !== B.dirt.id) continue;
          this.treeShape(biome.treeKind === 'spruce' ? 'spruce' : rnd() < 0.15 ? 'birch' : 'oak', x, y, z, rnd, put, get);
        }
        if (biome.cactus) {
          const n = biome.cactus[0] + rnd.int(biome.cactus[1] - biome.cactus[0] + 1);
          for (let t = 0; t < n; t++) {
            const x = bx + rnd.int(16), z = bz + rnd.int(16), y = surface(x, z);
            if (y < 0 || get(x, y - 1, z) !== B.sand.id) continue;
            let free = true;
            for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + d[0], y, z + d[1]) !== 0) free = false;
            if (!free) continue;
            const hgt = 1 + rnd.int(3);
            for (let i = 0; i < hgt; i++) put(x, y + i, z, B.cactus.id);
          }
        }
        for (let f = 0; f < biome.flowers; f++) {
          const x = bx + rnd.int(16), z = bz + rnd.int(16), y = surface(x, z);
          if (y >= 0 && get(x, y - 1, z) === B.grass.id) put(x, y, z, rnd() < 0.6 ? B.flower_yellow.id : B.flower_red.id);
        }
        for (let g = 0; g < biome.grass; g++) {
          const x = bx + rnd.int(16), z = bz + rnd.int(16), y = surface(x, z);
          if (y >= 0 && get(x, y - 1, z) === B.grass.id) put(x, y, z, B.tall_grass.id);
        }
        if (biome.mushrooms) for (let m = 0; m < biome.mushrooms; m++) {
          const x = bx + rnd.int(16), z = bz + rnd.int(16), y = surface(x, z);
          if (y >= 0 && rnd() < 0.5) put(x, y, z, rnd() < 0.5 ? B.mushroom_brown.id : B.mushroom_red.id);
        }
        if (rnd() < 0.09) this.dungeon(world, c, bx + 3 + rnd.int(10), 6 + rnd.int(22), bz + 3 + rnd.int(10), rnd, put, get);
        if (biome.snow) {
          for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
            const x = bx + lx, z = bz + lz;
            if (x < c.cx * 16 || x >= c.cx * 16 + 16 || z < c.cz * 16 || z >= c.cz * 16 + 16) continue;
            for (let y = CH - 2; y > SEA; y--) { const b = get(x, y - 1, z); if (b === B.leaves.id) { put(x, y, z, B.snow.id); break; } if (b !== 0) break; }
          }
        }
      }
    }
    treeShape(kind, x, y, z, rnd, put, get) {
      const log = B.log.id, leaves = B.leaves.id;
      if (kind === 'spruce') {
        const h = 6 + rnd.int(4);
        for (let i = 0; i < h; i++) put(x, y + i, z, log, 0, true);
        for (let i = 2; i < h + 1; i++) {
          const r = (i === h) ? 0 : ((h - i) % 2 === 0 ? 1 : 2);
          for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (Math.abs(dx) + Math.abs(dz) <= r + (r === 2 ? 1 : 0) && !(dx === 0 && dz === 0 && i < h)) put(x + dx, y + i, z + dz, leaves);
        }
        put(x, y + h, z, leaves);
        return;
      }
      const h = kind === 'birch' ? 5 + rnd.int(2) : 4 + rnd.int(3);
      for (let i = 0; i < h; i++) put(x, y + i, z, log, kind === 'birch' ? 1 : 0, true);
      for (let dy = h - 3; dy <= h; dy++) {
        const r = dy >= h - 1 ? 1 : 2;
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && (dy === h || rnd() < 0.4)) continue;
          if (dx === 0 && dz === 0 && dy < h) continue;
          put(x + dx, y + dy, z + dz, leaves);
        }
      }
    }
    growTree(world, x, y, z, rnd, fromSapling) {
      const kind = this.biomeAt(x, z) === 'snow' ? 'spruce' : rnd() < 0.15 ? 'birch' : 'oak';
      for (let i = 1; i < 6; i++) if (M.BLOCKS[world.getBlock(x, y + i, z)].opaque) return false;
      const put = (px, py, pz, id, meta, force) => { const cur = world.getBlock(px, py, pz); if (!force && cur !== 0 && cur !== B.snow.id && cur !== B.sapling.id) return; world.setBlock(px, py, pz, id, meta || 0, { update: false }); };
      this.treeShape(kind, x, y, z, rnd, put, (a, b, c) => world.getBlock(a, b, c));
      return true;
    }
    dungeon(world, c, x, y, z, rnd, put, get) {
      const cob = B.cobblestone.id, moss = B.mossy_cobblestone.id;
      for (let dy = -1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        if (get(x + dx, y + dy, z + dz) === 0 && dy > -1 && dy < 4) return;
      }
      for (let dy = -1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        const wall = dy === -1 || dy === 4 || Math.abs(dx) === 3 || Math.abs(dz) === 3;
        put(x + dx, y + dy, z + dz, wall ? (dy === -1 && rnd() < 0.4 ? moss : cob) : 0, 0, true);
      }
      put(x, y, z, B.spawner.id, 0, true);
      const key = M.key3(x, y, z);
      const inChunk = (px, pz) => px >= c.cx * 16 && px < c.cx * 16 + 16 && pz >= c.cz * 16 && pz < c.cz * 16 + 16;
      if (inChunk(x, z) && !world.blockEntities.has(key)) world.blockEntities.set(key, { type: 'spawner', mob: rnd.pick(['zombie', 'zombie', 'skeleton', 'spider']), cd: 0 });
      const chests = 1 + rnd.int(2);
      for (let i = 0; i < chests; i++) {
        const cx = x + (rnd() < 0.5 ? -2 : 2), cz = z + rnd.int(5) - 2;
        put(cx, y, cz, B.chest.id, rnd.int(4), true);
        const ck = M.key3(cx, y, cz);
        if (inChunk(cx, cz) && !world.blockEntities.has(ck) && !(world.edits.get(c.key) || new Map()).has(((cx & 15) << 10) | ((cz & 15) << 6) | y)) {
          const slots = new Array(27).fill(null);
          const loot = [['iron_ingot', 1, 4, 0.6], ['gold_ingot', 1, 3, 0.35], ['diamond', 1, 2, 0.12], ['bread', 1, 3, 0.7], ['string', 1, 6, 0.5], ['gunpowder', 1, 5, 0.5], ['bucket', 1, 1, 0.3], ['coal', 3, 9, 0.6], ['apple', 1, 3, 0.5], ['arrow', 4, 12, 0.5], ['bow', 1, 1, 0.2], ['iron_pickaxe', 1, 1, 0.15], ['book', 1, 2, 0.3], ['wheat', 1, 4, 0.5]];
          for (const [k, a, b, p] of loot) if (rnd() < p) { let s = rnd.int(27); for (let tries = 0; tries < 27 && slots[s]; tries++) s = (s + 1) % 27; if (!slots[s]) slots[s] = { id: M.ITEM_BY_KEY[k].id, count: a + rnd.int(b - a + 1) }; }
          world.blockEntities.set(ck, { type: 'chest', slots });
        }
      }
    }
    spawnPoint() {
      for (let r = 0; r < 200; r += 4) for (let a = 0; a < 16; a++) {
        const x = floor(Math.cos(a / 16 * M.TAU) * r), z = floor(Math.sin(a / 16 * M.TAU) * r);
        const h = this.heightAt(x, z), b = this.biomeAt(x, z);
        if (h > SEA + 1 && (b === 'plains' || b === 'forest')) return { x: x + 0.5, y: h, z: z + 0.5 };
      }
      return { x: 0.5, y: this.heightAt(0, 0), z: 0.5 };
    }
  }

  Object.assign(M, { Generator, BIOMES });
})(globalThis.Mc98 = globalThis.Mc98 || {});
