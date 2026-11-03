(function (S) {
  'use strict';
  const M = S.METRICS;
  const LOTS = 96, LOT_SIZE = 30, LOT_ITEMS = 150, HOUSE_W = 12, HOUSE_D = 10;
  const FENCES = 3600, TREES = 7000, WALKERS = 100;
  const YARD = ['chair', 'chair', 'table', 'sofa', 'bed', 'fridge', 'counter', 'counter', 'shelf', 'lamp', 'bench', 'hedge', 'bush', 'bush', 'car'];
  const HEADINGS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

  const landAround = (t, x, z, size) => {
    for (let dz = 0; dz <= size; dz += 3) {
      for (let dx = 0; dx <= size; dx += 3) {
        if (!S.Terrain.isOpenLand(t, x + dx, z + dz)) return false;
      }
    }
    return true;
  };

  const placeLots = t => {
    const lots = [];
    const free = (x, z) => x >= 8 && z >= 8 && x + LOT_SIZE <= M.town - 8 && z + LOT_SIZE <= M.town - 8
      && landAround(t, x, z, LOT_SIZE)
      && lots.every(l => Math.abs(l.x - x) >= LOT_SIZE + 2 || Math.abs(l.z - z) >= LOT_SIZE + 2);
    const roads = S.Terrain.ROADS.filter(r => r[0] === r[2] || r[1] === r[3]);
    for (let row = 0; row < 4 && lots.length < LOTS; row++) {
      const away = 5 + row * (LOT_SIZE + 3);
      for (const [x0, z0, x1, z1] of roads) {
        const flat = z0 === z1, from = flat ? Math.min(x0, x1) : Math.min(z0, z1), to = flat ? Math.max(x0, x1) : Math.max(z0, z1);
        for (let p = from; p < to && lots.length < LOTS; p += LOT_SIZE + 3) {
          for (const side of [-1, 1]) {
            if (lots.length >= LOTS) break;
            const off = side < 0 ? -away - LOT_SIZE : away;
            const x = flat ? p : x0 + off, z = flat ? z0 + off : p;
            if (free(x, z)) lots.push({ x, z, size: LOT_SIZE });
          }
        }
      }
    }
    return lots;
  };

  const addHouse = (items, lot) => {
    const hx = lot.x + 9, hz = lot.z + 10;
    for (let i = 0; i < HOUSE_W; i++) {
      items.push(['wall', hx + i + 0.5, hz, 0]);
      items.push(['wall', hx + i + 0.5, hz + HOUSE_D, 0]);
    }
    for (let j = 0; j < HOUSE_D; j++) {
      items.push(['wall', hx, hz + j + 0.5, 1]);
      items.push(['wall', hx + HOUSE_W, hz + j + 0.5, 1]);
    }
  };

  S.Dummy = {
    LOTS, LOT_ITEMS, FENCES, TREES, WALKERS,
    TOTAL: LOTS * LOT_ITEMS + FENCES + TREES,

    create(seed) {
      const terrain = S.Terrain.create(seed), rng = { rs: seed >>> 0 };
      const lots = placeLots(terrain), items = [];
      lots.forEach(lot => {
        addHouse(items, lot);
        for (let i = 2 * (HOUSE_W + HOUSE_D); i < LOT_ITEMS; i++) {
          const x = lot.x + 1 + Math.floor(S.roll(rng) * (lot.size - 2)), z = lot.z + 1 + Math.floor(S.roll(rng) * (lot.size - 2));
          items.push([YARD[Math.floor(S.roll(rng) * YARD.length)], x + 0.5, z + 0.5, Math.floor(S.roll(rng) * 4)]);
        }
      });
      lots.forEach((lot, i) => {
        const count = i % 2 ? 38 : 37;
        for (let k = 0; k < count; k++) {
          if (k < lot.size) items.push(['fence', lot.x + k + 0.5, lot.z, 0]);
          else items.push(['fence', lot.x, lot.z + (k - lot.size) + 0.5, 1]);
        }
      });
      for (let placed = 0, tries = 0; placed < TREES && tries < TREES * 200; tries++) {
        const x = 8 + Math.floor(S.roll(rng) * (M.town - 16)), z = 8 + Math.floor(S.roll(rng) * (M.town - 16));
        if (!S.Terrain.isOpenLand(terrain, x, z)) continue;
        const forest = S.Terrain.paintAt(terrain, x, z) === S.PAINT.forest;
        if (!forest && S.roll(rng) > 0.12) continue;
        items.push([S.roll(rng) < 0.5 ? 'tree' : 'pine', x + 0.5, z + 0.5, Math.floor(S.roll(rng) * 4)]);
        placed++;
      }
      return S.Dummy.pack(terrain, lots, items, rng);
    },

    pack(terrain, lots, items, rng) {
      const n = M.town / M.chunk, count = items.length;
      const chunkOf = it => S.clamp(Math.floor(it[1] / M.chunk), 0, n - 1) + S.clamp(Math.floor(it[2] / M.chunk), 0, n - 1) * n;
      const order = items.map((it, i) => [chunkOf(it), i]).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const pos = new Float32Array(count * 3), kind = new Uint16Array(count), facing = new Uint8Array(count);
      const chunkStart = new Int32Array(n * n + 1);
      order.forEach(([chunk, i], o) => {
        const it = items[i];
        pos[o * 3] = it[1];
        pos[o * 3 + 1] = it[4] === undefined ? S.Terrain.heightAt(terrain, it[1], it[2]) : it[4];
        pos[o * 3 + 2] = it[2];
        kind[o] = S.KIND_ID[it[0]];
        facing[o] = it[3];
        if (it[5]) it[5].index = o;
        chunkStart[chunk + 1]++;
      });
      for (let i = 0; i < n * n; i++) chunkStart[i + 1] += chunkStart[i];
      const walkers = [];
      while (walkers.length < WALKERS) {
        const x = 40 + S.roll(rng) * (M.town - 80), z = 40 + S.roll(rng) * (M.town - 80);
        if (S.Terrain.heightAt(terrain, x, z) < 0.6) continue;
        const r = walkers.length / WALKERS;
        walkers.push({ x, z, y: 0, heading: Math.floor(S.roll(rng) * 8), speed: r < 0.7 ? M.walk : r < 0.9 ? M.bike : M.car, tone: S.roll(rng), left: 1 + S.roll(rng) * 5 });
      }
      return { terrain, lots, count, pos, kind, facing, chunkStart, walkers, rng };
    },

    step(scene, dt) {
      const t = scene.terrain, rng = scene.rng;
      for (const w of scene.walkers) {
        w.left -= dt;
        const dir = HEADINGS[w.heading], len = dir[0] && dir[1] ? Math.SQRT1_2 : 1;
        const nx = w.x + dir[0] * len * w.speed * dt, nz = w.z + dir[1] * len * w.speed * dt;
        const blocked = nx < 16 || nz < 16 || nx > M.town - 16 || nz > M.town - 16 || S.Terrain.heightAt(t, nx, nz) < 0.4;
        if (blocked || w.left <= 0) {
          w.heading = Math.floor(S.roll(rng) * 8);
          w.left = 1 + S.roll(rng) * 5;
        }
        if (!blocked) {
          w.x = nx;
          w.z = nz;
        }
        w.y = S.Terrain.heightAt(t, w.x, w.z);
      }
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
