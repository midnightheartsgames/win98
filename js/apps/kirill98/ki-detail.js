(function (K) {
  'use strict';

  const CELL = 8;
  const KINDS = Object.freeze([
    { id: 'grass', h: 0.3, w: 0.42 },
    { id: 'tall', h: 0.62, w: 0.55 },
    { id: 'clover', h: 0.14, w: 0.4 },
    { id: 'chamomile', h: 0.42, w: 0.45 },
    { id: 'cornflower', h: 0.5, w: 0.45 },
    { id: 'bluebell', h: 0.36, w: 0.4 },
    { id: 'poppy', h: 0.55, w: 0.45 },
    { id: 'rye', h: 1.05, w: 0.75 },
    { id: 'reed', h: 1.7, w: 0.6 },
    { id: 'sedge', h: 0.6, w: 0.7 },
    { id: 'blueberry', h: 0.3, w: 0.55 },
    { id: 'dry', h: 0.4, w: 0.6 }
  ]);
  const ID = Object.fromEntries(KINDS.map((k, i) => [k.id, i]));
  const LEVELS = Object.freeze([{ radius: 0, density: 0 }, { radius: 32, density: 0.5 }, { radius: 52, density: 1 }]);
  const NOT_GRASS = [3, 4, 5, 6, 8];

  const hash = (a, b, s) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function sampler(T) {
    const G = T.ground(), N = T.N, S = T.STEP;
    return (x, z) => {
      const i = Math.max(0, Math.min(N - 1, Math.round(x / S))), j = Math.max(0, Math.min(N - 1, Math.round(z / S))), k = j * N + i, o = k * G.M, w = [];
      for (let q = 0; q < G.M; q++) w.push(G.weights[o + q] / 255);
      return { w, shade: G.aux[k * 4] / 255, wet: G.aux[k * 4 + 1] / 255, n: G.aux[k * 4 + 2] / 255 };
    };
  }

  const pick = (list, r) => { let s = 0; for (const [, p] of list) s += p; let t = r * s; for (const [id, p] of list) { t -= p; if (t <= 0) return id; } return list[list.length - 1][0]; };

  function mix(g, z) {
    const w = g.w, out = [];
    const meadow = w[0], field = w[1], forest = w[2], scree = w[7], mud = w[9], sand = w[10], plough = w[11];
    if (meadow > 0.05) { out.push([ID.grass, meadow * 1.0], [ID.tall, meadow * 0.18 * (g.n > 0.55 ? 2 : 1)], [ID.clover, meadow * 0.12], [ID.chamomile, meadow * 0.07], [ID.bluebell, meadow * 0.03 * (z < 700 ? 2 : 1)], [ID.cornflower, meadow * 0.02]); }
    if (field > 0.05) {
      const rye = g.n < 0.42 ? field : 0;
      out.push([ID.rye, rye * 1.6], [ID.grass, (field - rye) * 0.9], [ID.tall, field * 0.12], [ID.poppy, field * 0.07 + rye * 0.06], [ID.cornflower, field * 0.06 + rye * 0.05], [ID.chamomile, field * 0.03]);
    }
    if (forest > 0.05) out.push([ID.grass, forest * 0.18 * (1 - g.shade * 0.5)], [ID.blueberry, forest * 0.22], [ID.dry, forest * 0.12]);
    if (scree > 0.05) out.push([ID.dry, scree * 0.2], [ID.grass, scree * 0.12]);
    if (plough > 0.05) out.push([ID.dry, plough * 0.06]);
    if (mud > 0.05) out.push([ID.sedge, mud * 0.9], [ID.reed, mud * 0.35]);
    if (g.wet > 0.25 && sand < 0.5) out.push([ID.reed, g.wet * 0.5], [ID.sedge, g.wet * 0.6]);
    return out;
  }

  function cell(T, cx, cz, at) {
    const S = at || sampler(T), out = [];
    const g0 = S(cx * CELL + CELL / 2, cz * CELL + CELL / 2), base = mix(g0, cz * CELL);
    const total = base.reduce((s, [, p]) => s + p, 0);
    const n = Math.round(Math.min(170, total * 95) * (0.75 + hash(cx, cz, 7) * 0.5));
    for (let q = 0; q < n; q++) {
      const x = cx * CELL + hash(cx * 131 + q, cz, 1) * CELL, z = cz * CELL + hash(cx, cz * 131 + q, 2) * CELL, g = S(x, z);
      if (NOT_GRASS.reduce((s, m) => s + g.w[m], 0) > 0.3) continue;
      const list = mix(g, z);
      if (!list.length) continue;
      const here = list.reduce((s, [, p]) => s + p, 0);
      if (hash(q, cx * 7 + cz, 3) > Math.min(1, here / Math.max(0.05, total))) continue;
      const y = T.meshHeightAt(x, z), water = T.waterAt(x, z);
      const kind = pick(list, hash(cx + q * 17, cz - q, 4));
      if (water > y - 0.05 && kind !== ID.reed && kind !== ID.sedge) continue;
      if (water > y + 0.6) continue;
      out.push({ x, y, z, kind, scale: 0.75 + hash(q, cx, 5) * 0.55, rot: hash(cz, q, 6) * Math.PI, tone: hash(q * 3, cz * 5, 8), shade: g.shade });
    }
    return out;
  }

  function ring(T, eye, level, at) {
    const L = LEVELS[level === undefined ? 2 : level];
    if (!L.radius) return [];
    const S = at || sampler(T), r = L.radius, out = [];
    const c0x = Math.floor((eye[0] - r) / CELL), c1x = Math.floor((eye[0] + r) / CELL), c0z = Math.floor((eye[2] - r) / CELL), c1z = Math.floor((eye[2] + r) / CELL);
    for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) {
      const mx = cx * CELL + CELL / 2, mz = cz * CELL + CELL / 2;
      if (Math.hypot(mx - eye[0], mz - eye[2]) > r + CELL) continue;
      if (mx < 0 || mz < 0 || mx > T.SIZE || mz > T.SIZE) continue;
      const list = cell(T, cx, cz, S);
      for (let q = 0; q < list.length; q++) if (L.density >= 1 || hash(q, cx + cz, 9) < L.density) out.push(list[q]);
    }
    return out;
  }

  const SMALL = Object.freeze(['pebble', 'stone', 'mushroom', 'branch', 'anthill', 'tussock']);
  const SID = Object.fromEntries(SMALL.map((k, i) => [k, i]));

  function small(T, cx, cz, at) {
    const S = at || sampler(T), out = [], g0 = S(cx * CELL + CELL / 2, cz * CELL + CELL / 2), w0 = g0.w;
    const sw = K.Places.SWAMP, want = w0[7] * 14 + w0[6] * 9 + w0[10] * 6 + w0[2] * 7 + w0[0] * 1.2 + w0[1] * 0.8 + w0[11] * 2 + w0[9] * 6;
    const n = Math.round(want * (0.6 + hash(cx, cz, 21) * 0.8));
    for (let q = 0; q < n; q++) {
      const x = cx * CELL + hash(cx * 97 + q, cz, 22) * CELL, z = cz * CELL + hash(cx, cz * 97 + q, 23) * CELL, g = S(x, z), w = g.w;
      if (w[3] + w[4] + w[5] + w[8] > 0.35 && w[9] < 0.3) continue;
      const y = T.meshHeightAt(x, z);
      if (T.waterAt(x, z) > y + 0.1) {
        if (Math.hypot(x - sw.at[0], z - sw.at[1]) < sw.r + sw.fall * 0.6 && hash(q, cz + cx, 28) < 0.7) out.push({ x, y, z, kind: SID.tussock, scale: 0.7 + hash(q, cz, 25) * 0.8, rot: hash(cx, q, 26) * Math.PI * 2, tone: hash(q * 5, cx, 27), moss: 0 });
        continue;
      }
      const r = hash(q, cx - cz, 24), forest = w[2], stony = w[7] + w[6] + w[10] * 0.6;
      let kind;
      if (stony > 0.4) kind = r < 0.55 ? SID.pebble : SID.stone;
      else if (forest > 0.4) kind = r < 0.35 ? SID.branch : r < 0.6 ? SID.mushroom : r < 0.66 ? SID.anthill : r < 0.85 ? SID.stone : SID.pebble;
      else kind = r < 0.7 ? SID.pebble : SID.stone;
      out.push({ x, y, z, kind, scale: 0.6 + hash(q, cz, 25) * 0.9, rot: hash(cx, q, 26) * Math.PI * 2, tone: hash(q * 5, cx, 27), moss: forest });
    }
    return out;
  }

  let PROPS = null;
  function props(T, F) {
    if (PROPS && PROPS.T === T) return PROPS.list;
    const P = K.Places, N = T.N, ST = T.STEP, at = sampler(T), list = [], RD = new Float32Array(N * N).fill(99);
    for (const r of P.ROADS) {
      const line = K.Terrain.polyline(r.pts), half = P.KINDS[r.kind].width / 2;
      for (const g of line.segs) {
        const reach = half + 12, i0 = Math.max(0, Math.floor((Math.min(g.ax, g.bx) - reach) / ST)), i1 = Math.min(N - 1, Math.ceil((Math.max(g.ax, g.bx) + reach) / ST)), j0 = Math.max(0, Math.floor((Math.min(g.az, g.bz) - reach) / ST)), j1 = Math.min(N - 1, Math.ceil((Math.max(g.az, g.bz) + reach) / ST));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = i * ST, z = j * ST; let s = (x - g.ax) * g.tx + (z - g.az) * g.tz; s = Math.max(0, Math.min(g.len, s)); const d = Math.hypot(x - g.ax - g.tx * s, z - g.az - g.tz * s) - half, k = j * N + i; if (d < RD[k]) RD[k] = d; }
      }
    }
    const roadD = (x, z) => RD[Math.max(0, Math.min(N - 1, Math.round(z / ST))) * N + Math.max(0, Math.min(N - 1, Math.round(x / ST)))];
    const walls = P.WALLS.flatMap(P.wallBoxes).map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, rot: 0 })), feet = P.footprints().concat(P.BOXES.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot || 0 })));
    const inFoot = (x, z, pad) => feet.some(f => { const r = (f.rot || 0) * Math.PI / 180, dx = x - f.x, dz = z - f.z, u = dx * Math.cos(r) + dz * Math.sin(r), v = -dx * Math.sin(r) + dz * Math.cos(r); return Math.abs(u) < f.w / 2 + pad && Math.abs(v) < f.d / 2 + pad; });
    const inWalls = (x, z, pad) => P.WALLS.some(w => x > w.rect[0] - pad && x < w.rect[2] + pad && z > w.rect[1] - pad && z < w.rect[3] + pad);
    const town = (x, z) => x > 770 && x < 1025 && z > 1225 && z < 1485;
    const settled = (x, z) => P.SPOTS.some(s => s.id !== 'pass' && s.id !== 'log' && s.id !== 'bear' && Math.hypot(x - s.at[0], z - s.at[1]) < Math.min(60, s.r || 30));
    const free = (x, z, size) => {
      if (roadD(x, z) < size + 3.4 || inFoot(x, z, size + 2) || inWalls(x, z, size + 5) || town(x, z) || settled(x, z)) return false;
      if (x < 12 || z < 12 || x > T.SIZE - 12 || z > T.SIZE - 12) return false;
      const y = T.heightAt(x, z);
      if (T.waterAt(x, z) > y - 0.4) return false;
      let tree = false;
      if (F && F.trunksNear) F.trunksNear(x, z, size + 0.6, () => { tree = true; });
      return !tree && !list.some(p => Math.hypot(p.x - x, p.z - z) < p.size + size + 1.2);
    };
    const hamlets = ['rakitny', 'klyuchi', 'mezha', 'vyselki', 'mill', 'tsarevo'].map(id => P.SPOTS.find(s => s.id === id)).filter(Boolean);
    const GRID = 6;
    for (let gz = 0; gz < T.SIZE / GRID; gz++) for (let gx = 0; gx < T.SIZE / GRID; gx++) {
      const x = (gx + hash(gx, gz, 31)) * GRID, z = (gz + hash(gz, gx, 32)) * GRID, g = at(x, z), w = g.w, r = hash(gx, gz, 33);
      const stony = w[7] + w[6] * 0.6, mountain = z < 360 ? 1 : 0;
      let kind = null, size = 1;
      if (r < 0.05 * stony + 0.006 * mountain * w[0] + 0.0025 * (w[0] + w[1]) + 0.004 * w[2]) { kind = 'boulder'; size = (stony > 0.3 ? 0.9 + hash(gx, gz, 34) * 1.5 : 0.55 + hash(gx, gz, 34) * 0.8); }
      else if (r > 0.97 && w[2] > 0.55) { kind = r > 0.988 ? 'log' : 'stump'; size = kind === 'log' ? 2.6 + hash(gx, gz, 35) * 1.6 : 0.35 + hash(gx, gz, 35) * 0.2; }
      else if (r > 0.988 && w[1] + w[0] > 0.6 && hamlets.some(h => Math.hypot(x - h.at[0], z - h.at[1]) < 170)) { kind = 'hay'; size = 1.2 + hash(gx, gz, 36) * 0.3; }
      if (!kind || !free(x, z, kind === 'log' ? 1.2 : size)) continue;
      list.push({ kind, x, z, y: T.heightAt(x, z), size, rot: hash(gx, gz, 37) * 360, moss: w[2] });
    }
    for (const B of P.BUILDINGS) {
      if (B.kind !== 'house' || B.palace || B.fort || B.korni || town(B.x, B.z)) continue;
      const back = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[B.door || 's'], r = (B.rot || 0) * Math.PI / 180;
      const bx = back[0] * Math.cos(r) - back[1] * Math.sin(r), bz = back[0] * Math.sin(r) + back[1] * Math.cos(r), off = (Math.abs(back[0]) ? B.w : B.d) / 2 + 0.75;
      const x = B.x + bx * off, z = B.z + bz * off;
      if (roadD(x, z) < 2 || walls.some(f => Math.abs(x - f.x) < f.w / 2 + 1.6 && Math.abs(z - f.z) < f.d / 2 + 1.6)) continue;
      list.push({ kind: 'woodpile', x, z, y: T.heightAt(x, z), size: 1.3, rot: (Math.atan2(bz, bx) * 180 / Math.PI) + 90, moss: 0 });
    }
    for (let z = 345; z < 1190; z += 6) for (let k = 0; k < 2; k++) {
      const x = 13 + hash(z, k, 41) * 14, zz = z + hash(k, z, 42) * 5;
      if (roadD(x, zz) < 3 || T.waterAt(x, zz) > T.heightAt(x, zz) - 0.3) continue;
      list.push({ kind: 'log', x, z: zz, y: T.heightAt(x, zz), size: 7 + hash(z, k, 43) * 5, rot: 50 + hash(k, z, 44) * 80, moss: 0.6, windfall: true });
    }
    for (const p of list) {
      const dims = { boulder: [p.size * 1.5, p.size * 1.3, p.size * 0.95], stump: [p.size * 1.6, p.size * 1.6, 0.55], log: [p.size, 0.55, 0.5], hay: [p.size * 1.7, p.size * 1.7, p.size * 1.6], woodpile: [2.6, 0.9, 1.3] }[p.kind];
      p.box = { x: p.x, z: p.z, w: dims[0], d: dims[1], h: dims[2], rot: p.rot, kind: p.kind === 'boulder' ? 'stone' : 'wood', id: 'prop-' + p.kind, hidden: true, prop: p.kind };
    }
    PROPS = { T, list };
    return list;
  }

  K.Detail = { CELL, KINDS, ID, LEVELS, SMALL, SID, sampler, cell, ring, mix, small, props };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
