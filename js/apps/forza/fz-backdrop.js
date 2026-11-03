(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const FINE = 10;
  const COARSE = 25;
  const TILES = 320;
  const SEAM = 40;
  const CROPS = [[196, 178, 96], [150, 122, 84], [118, 150, 74], [170, 168, 90], [134, 158, 80], [182, 150, 96]];

  function ring(sc, fx, fz) {
    const dx = fx < 0 ? -fx : fx >= sc.nx ? fx - sc.nx + 1 : 0, dz = fz < 0 ? -fz : fz >= sc.nz ? fz - sc.nz + 1 : 0;
    return Math.max(dx, dz);
  }

  function chunks(sc) {
    const w = sc.w, b = w.b, o = w.out, CH = F.CHUNK;
    sc.outer = new Map();
    const fx0 = Math.floor((o.x0 - b.x0) / CH), fx1 = Math.ceil((o.x1 - b.x0) / CH) - 1;
    const fz0 = Math.floor((o.z0 - b.z0) / CH), fz1 = Math.ceil((o.z1 - b.z0) / CH) - 1;
    for (let fz = fz0; fz <= fz1; fz++) {
      for (let fx = fx0; fx <= fx1; fx++) {
        if (!ring(sc, fx, fz)) continue;
        const x0 = b.x0 + fx * CH, z0 = b.z0 + fz * CH;
        const ch = { ix: fx, iz: fz, x0, z0, x1: x0 + CH, z1: z0 + CH, y0: -6, y1: 10, groups: {}, props: [], gpu: null, dirtyProps: true, outer: true };
        sc.outer.set(fx * 4096 + fz, ch);
        sc.chunks.push(ch);
      }
    }
  }

  function colorAt(w, x, z) {
    const BC = F.BIOME_COL, b = w.b, cx = F.clamp(x, b.x0, b.x1), cz = F.clamp(z, b.z0, b.z1), d = Math.hypot(x - cx, z - cz);
    const n = (F.noise2(x / 60, z / 60, 4) - 0.5) * 0.25 + (F.hash2(Math.round(x), Math.round(z), 2) - 0.5) * 0.06;
    const inner = BC[w.biome[w.gi(cx, cz)]] || BC[2], t = F.smooth(0, 70, d);
    let out = inner;
    if (t > 0) {
      const kind = w.outKind(x, z) || (() => { const sd = w.outWater(x, z); return sd < 0 ? null : w.outZone(x, z, sd); })();
      out = kind ? BC[F.OUT.BIOME[kind]] : BC[0];
      if (kind === 'fields') {
        const u = x * 0.94 + z * 0.34, v = -x * 0.34 + z * 0.94, crop = CROPS[Math.floor(F.hash2(Math.floor(u / 150), Math.floor(v / 64), 419) * CROPS.length)];
        const k = 0.55 + 0.25 * F.noise2(x / 40, z / 40, 421);
        out = [out[0] + (crop[0] - out[0]) * k, out[1] + (crop[1] - out[1]) * k, out[2] + (crop[2] - out[2]) * k];
      }
    }
    const mix = i => inner[i] + (out[i] - inner[i]) * t;
    return [F.clamp(mix(0) * (1 + n), 0, 255) | 0, F.clamp(mix(1) * (1 + n), 0, 255) | 0, F.clamp(mix(2) * (1 + n * 0.8), 0, 255) | 0, 255];
  }

  function ground(sc, ch, cs, coarseSides) {
    const w = sc.w, b = w.b, n = Math.round(F.CHUNK / cs), m = n + 3;
    const H = new Float32Array(m * m);
    for (let a = 0; a < m; a++) for (let c = 0; c < m; c++) H[a * m + c] = w.terrainH(ch.x0 + (c - 1) * cs, ch.z0 + (a - 1) * cs);
    for (const side of coarseSides) {
      for (let k = 0; k <= n; k++) {
        const t = k * cs, k0 = Math.floor(t / COARSE) * COARSE, f = (t - k0) / COARSE;
        if (f < 1e-6) continue;
        const P = q => (side === 'n' ? [ch.x0 + q, ch.z0] : side === 's' ? [ch.x0 + q, ch.z1] : side === 'w' ? [ch.x0, ch.z0 + q] : [ch.x1, ch.z0 + q]);
        const pa = P(k0), pb = P(k0 + COARSE), h = w.terrainH(pa[0], pa[1]) * (1 - f) + w.terrainH(pb[0], pb[1]) * f;
        const a = side === 'n' ? 0 : side === 's' ? n : k, c = side === 'w' ? 0 : side === 'e' ? n : k;
        H[(a + 1) * m + c + 1] = h;
      }
    }
    const bt = sc.g(ch, 'ground'), ids = new Int32Array((n + 1) * (n + 1)).fill(-1), deep = F.WATER_Y - 3.2;
    const vert = (a, c) => {
      const k = a * (n + 1) + c;
      if (ids[k] >= 0) return ids[k];
      const x = ch.x0 + c * cs, z = ch.z0 + a * cs, y = H[(a + 1) * m + c + 1];
      const nx = H[(a + 1) * m + c] - H[(a + 1) * m + c + 2], nz = H[a * m + c + 1] - H[(a + 2) * m + c + 1], ny = 2 * cs, l = Math.hypot(nx, ny, nz);
      bt.need(1, 0);
      sc.grow(ch, y, y);
      ids[k] = bt.v(x, y, z, x / 8, z / 8, nx / l, ny / l, nz / l, colorAt(w, x, z), 0);
      return ids[k];
    };
    for (let a = 0; a < n; a++) {
      for (let c = 0; c < n; c++) {
        const x = ch.x0 + c * cs, z = ch.z0 + a * cs;
        if (x >= b.x0 && x + cs <= b.x1 && z >= b.z0 && z + cs <= b.z1) continue;
        const h0 = H[(a + 1) * m + c + 1], h1 = H[(a + 1) * m + c + 2], h2 = H[(a + 2) * m + c + 2], h3 = H[(a + 2) * m + c + 1];
        if (h0 < deep && h1 < deep && h2 < deep && h3 < deep) continue;
        const v0 = vert(a, c), v1 = vert(a, c + 1), v2 = vert(a + 1, c + 1), v3 = vert(a + 1, c);
        bt.need(0, 6);
        bt.tri(v0, v2, v1);
        bt.tri(v0, v3, v2);
      }
    }
  }

  function waterQuad(bt, x0, z0, x1, z1) {
    const y = F.WATER_Y;
    bt.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], C('#ffffff'), MAT.WATER, [x0 / 30, z1 / 30, x1 / 30, z1 / 30, x1 / 30, z0 / 30, x0 / 30, z0 / 30], [0, 1, 0]);
  }

  function water(sc, ch, cs) {
    const w = sc.w, b = w.b, n = Math.round(F.CHUNK / cs);
    for (let a = 0; a < n; a++) {
      const z0 = ch.z0 - 5 + a * cs, z1 = z0 + cs;
      let run = -1;
      const flush = end => {
        if (run < 0) return;
        waterQuad(sc.g(ch, 'water'), ch.x0 - 5 + run * cs, z0, ch.x0 - 5 + end * cs, z1);
        run = -1;
      };
      for (let c = 0; c <= n; c++) {
        const x0 = ch.x0 - 5 + c * cs, x1 = x0 + cs;
        const inner = x0 >= b.x0 - 5.01 && x1 <= b.x1 + 5.01 && z0 >= b.z0 - 5.01 && z1 <= b.z1 + 5.01, mx = x0 + cs / 2, mz = z0 + cs / 2;
        const wet = c < n && !inner && (w.outWater(mx, mz) < cs * 0.75 || (w.edgeDist(mx, mz) < SEAM && w.water[w.gi(mx, mz)]));
        if (wet && run < 0) run = c;
        if (!wet) flush(c);
      }
    }
  }

  function land(sc) {
    const w = sc.w, b = w.b;
    for (const ch of sc.chunks) {
      if (ch.x1 <= b.x1 && ch.z1 <= b.z1 && ch.x0 >= b.x0 && ch.z0 >= b.z0) continue;
      const rd = ring(sc, ch.ix, ch.iz);
      if (rd >= 2 && w.outWater((ch.x0 + ch.x1) / 2, (ch.z0 + ch.z1) / 2) < -F.CHUNK * 0.75) { waterQuad(sc.g(ch, 'water'), ch.x0 - 5, ch.z0 - 5, ch.x1 - 5, ch.z1 - 5); continue; }
      const coarse = [];
      if (rd <= 1) for (const [side, dx, dz] of [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]]) if (ring(sc, ch.ix + dx, ch.iz + dz) >= 2) coarse.push(side);
      ground(sc, ch, rd <= 1 ? FINE : COARSE, coarse);
      water(sc, ch, rd <= 1 ? FINE : COARSE);
    }
  }

  function roads(sc) {
    const o = sc.w.out, rail = o.rail;
    for (const r of o.roads) {
      const A = r.arm;
      sc.roadMesh(r, A && A.end === 1 ? A.e.len : 0, !!A && A.end === 0);
    }
    if (!rail) return;
    for (let start = 0; start < rail.pts.length - 1; start += 25) {
      const end = Math.min(rail.pts.length - 1, start + 25), pts = rail.pts.slice(start, end + 1), mid = pts[pts.length >> 1];
      sc.ribbon(sc.chunkAt(mid[0], mid[1]), 'rail', pts, rail.y.slice(start, end + 1), 2.2, 2.2, 0.05, 4, rail.s0 + rail.s[start]);
    }
  }

  function homes(sc) {
    const w = sc.w, rng = F.rng(w.seed + 409);
    for (const bd of w.out.buildings) sc.building(bd, rng);
  }

  function woods(sc) {
    const w = sc.w, o = w.out, T = F.Trees;
    for (const t of o.trees) {
      const ch = sc.chunkAt(t.x, t.z);
      const h = T.treeFar(sc.g(ch, 'trees'), t);
      sc.grow(ch, t.y, t.y + h);
      if (w.edgeDist(t.x, t.z) < TILES) sc.cellAt(t.x, t.z).trees.push(t);
    }
    for (const l of o.lamps) {
      const ch = sc.chunkAt(l.x, l.z);
      ch.props.push(l);
      sc.grow(ch, l.y, l.y + 9);
    }
  }

  F.Backdrop = {
    build(sc) {
      if (!sc.w.out) return;
      chunks(sc);
      land(sc);
      roads(sc);
      homes(sc);
      woods(sc);
    }
  };
})(globalThis.Forza = globalThis.Forza || {});
