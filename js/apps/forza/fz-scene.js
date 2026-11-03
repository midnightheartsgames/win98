(function (F) {
  'use strict';

  const CH = 250;
  const C = F.col;
  const MAT = F.MAT;
  const Batch = F.Batch;

  const BIOME_COL = [
    [70, 86, 70], [214, 200, 160], [112, 146, 70], [104, 150, 72], [74, 96, 52], [150, 146, 134], [138, 132, 118], [128, 150, 96], [168, 164, 156], [122, 124, 106]
  ];
  const TEXLEN = { road4: 24, road2: 20, lane: 12, cobble: 4, gravel: 14, dirt: 14, sandtrack: 16, grasstrack: 16, track: 10, runway: 40, rail: 4 };
  const USCALE = { cobble: 0.25 };
  const TC = 125;
  const GC = 50;
  const SOFT_COVER = { daisy: 0.5, yellow: 0.5, lupin: 0.5, dry: 0.3, dune: 0.3, reed: 0.3, berry: 0.35, fern: 0.6 };

  function upTri(b, o, io, p, ip, q, iq) {
    if ((p.z - o.z) * (q.x - o.x) - (p.x - o.x) * (q.z - o.z) >= 0) b.tri(io, ip, iq);
    else b.tri(io, iq, ip);
  }

  const shade3 = (c, k) => [F.clamp(Math.round(c[0] * k), 0, 255), F.clamp(Math.round(c[1] * k), 0, 255), F.clamp(Math.round(c[2] * k), 0, 255), c[3]];
  const mixCol = (a, c, t) => [0, 1, 2, 3].map(k => Math.round(a[k] + (c[k] - a[k]) * F.clamp(t, 0, 1)));
  const lerp2 = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
  const UNIT_FALLBACK = { shop: ['win'], shop2: ['win'], cafe: ['shop2', 'win'], gate: ['door', 'win'], door: ['win'], win: [] };

  function faceDot(q0, q1, q3, n) {
    const ax = q1[0] - q0[0], ay = q1[1] - q0[1], az = q1[2] - q0[2], bx = q3[0] - q0[0], by = q3[1] - q0[1], bz = q3[2] - q0[2];
    return (ay * bz - az * by) * n[0] + (az * bx - ax * bz) * n[1] + (ax * by - ay * bx) * n[2];
  }

  function oq(b, q0, q1, q2, q3, col, mat, uv, n) {
    if (faceDot(q0, q1, q3, n) >= 0) b.quad(q0, q1, q2, q3, col, mat, uv, n);
    else b.quad(q0, q3, q2, q1, col, mat, uv ? [uv[0], uv[1], uv[6], uv[7], uv[4], uv[5], uv[2], uv[3]] : null, n);
  }

  function ot(b, q0, q1, q2, col, mat, uv, n) {
    if (faceDot(q0, q1, q2, n) >= 0) b.triangle(q0, q1, q2, col, mat, uv);
    else b.triangle(q0, q2, q1, col, mat, uv ? [uv[0], uv[1], uv[4], uv[5], uv[2], uv[3]] : null);
  }

  function normPoly(bd) {
    let p = bd.poly.map(q => q.slice()), faces = bd.faces.slice(), party = bd.party ? bd.party.slice() : faces.map(() => null);
    const n = p.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const a = p[i], c = p[(i + 1) % n]; area += a[0] * c[1] - c[0] * a[1]; }
    const corner = bd.corner ? bd.poly[0] : null;
    if (area < 0) {
      p = p.reverse();
      faces = faces.map((f, i) => bd.faces[(2 * n - 2 - i) % n]);
      party = party.map((f, i) => { const r = bd.party && bd.party[(2 * n - 2 - i) % n]; return r && r.map(([t0, t1, top]) => [1 - t1, 1 - t0, top]).reverse(); });
    }
    let front = -1, best = -1;
    for (let i = 0; i < n; i++) {
      const L = Math.hypot(p[(i + 1) % n][0] - p[i][0], p[(i + 1) % n][1] - p[i][1]);
      if (faces[i] === 's' && L > best) { best = L; front = i; }
    }
    if (front < 0) front = 0;
    let cornerIn = null;
    if (corner) {
      const cx = p.reduce((s, q) => s + q[0], 0) / n - corner[0], cz = p.reduce((s, q) => s + q[1], 0) / n - corner[1];
      const l = Math.hypot(cx, cz) || 1;
      cornerIn = [cx / l, cz / l];
    }
    return { p, faces, party, front, corner, cornerIn };
  }

  function inset(p, d) {
    const n = p.length, lines = [];
    for (let i = 0; i < n; i++) {
      const a = p[i], c = p[(i + 1) % n];
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l, nz = dx / l;
      lines.push([a[0] + nx * d, a[1] + nz * d, dx / l, dz / l]);
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const L0 = lines[(i + n - 1) % n], L1 = lines[i];
      const den = L0[2] * L1[3] - L0[3] * L1[2];
      if (Math.abs(den) < 1e-6) return null;
      const t = ((L1[0] - L0[0]) * L1[3] - (L1[1] - L0[1]) * L1[2]) / den;
      out.push([L0[0] + L0[2] * t, L0[1] + L0[3] * t]);
    }
    let area = 0;
    for (let i = 0; i < n; i++) { const a = out[i], c = out[(i + 1) % n]; area += a[0] * c[1] - c[0] * a[1]; }
    if (area <= 0) return null;
    for (let i = 0; i < n; i++) {
      const a = p[i], c = p[(i + 1) % n], q = out[i], r = out[(i + 1) % n];
      if ((c[0] - a[0]) * (r[0] - q[0]) + (c[1] - a[1]) * (r[1] - q[1]) <= 0) return null;
    }
    return out;
  }

  class Scene {
    constructor(world, opts = {}) {
      this.w = world;
      this.nx = Math.ceil((world.b.x1 - world.b.x0) / CH);
      this.nz = Math.ceil((world.b.z1 - world.b.z0) / CH);
      this.chunks = [];
      for (let iz = 0; iz < this.nz; iz++) {
        for (let ix = 0; ix < this.nx; ix++) {
          const x0 = world.b.x0 + ix * CH, z0 = world.b.z0 + iz * CH;
          this.chunks.push({ ix, iz, x0, z0, x1: x0 + CH, z1: z0 + CH, y0: -6, y1: 10, groups: {}, props: [], gpu: null, dirtyProps: true });
        }
      }
      this.landmarks = [];
      this.rng = F.rng(world.seed + 77);
      this.steps = [
        ['Земля', () => this.buildTerrain()],
        ['Вода', () => this.buildWater()],
        ['Асфальт', () => this.buildRoads()],
        ['Площади и парковки', () => { F.Street.decorate(this); F.Airport.decorate(this); F.Market.decorate(this); F.Bis.decorate(this); }],
        ['Мосты', () => this.buildBridges()],
        ['Дома', () => this.buildBuildings()],
        ['Лес', () => this.buildTrees()],
        ['Рельсы', () => this.buildRail()],
        ['Реклама', () => this.buildAds()],
        ['Памятники', () => this.buildLandmarks()],
        ['Детали', () => this.assignProps()],
        ['Окрестности', () => F.Backdrop.build(this)]
      ];
      this.step = 0;
      if (!opts.lazy) while (this.step < this.steps.length) this.stepBuild();
    }

    stepBuild() { this.steps[this.step++][1](); return this.step >= this.steps.length; }
    get ready() { return this.step >= this.steps.length; }

    chunkAt(x, z) {
      const fx = Math.floor((x - this.w.b.x0) / CH), fz = Math.floor((z - this.w.b.z0) / CH);
      if (this.outer && (fx < 0 || fz < 0 || fx >= this.nx || fz >= this.nz)) {
        const ch = this.outer.get(fx * 4096 + fz);
        if (ch) return ch;
      }
      return this.chunks[F.clamp(fz, 0, this.nz - 1) * this.nx + F.clamp(fx, 0, this.nx - 1)];
    }

    g(ch, key) {
      let b = ch.groups[key];
      if (!b) { b = ch.groups[key] = new Batch(1024); b.uvw = [0.2, 0.2]; }
      return b;
    }

    grow(ch, y0, y1) {
      if (y0 < ch.y0) ch.y0 = y0;
      if (y1 > ch.y1) ch.y1 = y1;
    }

    buildTerrain() {
      const w = this.w;
      const cells = CH / 10;
      const H = w.h, B = w.biome, W = w.water;
      const colAt = (i, x, z) => {
        const bc = BIOME_COL[B[i]] || BIOME_COL[2];
        const n = (F.noise2(x / 60, z / 60, 4) - 0.5) * 0.25 + (F.hash2(Math.round(x), Math.round(z), 2) - 0.5) * 0.06;
        return [F.clamp(bc[0] * (1 + n), 0, 255) | 0, F.clamp(bc[1] * (1 + n), 0, 255) | 0, F.clamp(bc[2] * (1 + n * 0.8), 0, 255) | 0, 255];
      };
      for (const ch of this.chunks) {
        const b = this.g(ch, 'ground');
        const ix0 = Math.round((ch.x0 - w.b.x0) / 10), iz0 = Math.round((ch.z0 - w.b.z0) / 10);
        const n1 = cells + 1;
        const ids = new Int32Array(n1 * n1).fill(-1);
        let any = false;
        for (let a = 0; a < cells; a++) {
          for (let c = 0; c < cells; c++) {
            const gx = ix0 + c, gz = iz0 + a;
            if (gx + 1 >= w.nx || gz + 1 >= w.nz) continue;
            const i00 = gz * w.nx + gx;
            const deep = W[i00] && W[i00 + 1] && W[i00 + w.nx] && W[i00 + w.nx + 1] && w.shoreDist[i00] > 2 && w.shoreDist[i00 + w.nx + 1] > 2;
            if (deep) continue;
            any = true;
            const corners = [[a, c], [a, c + 1], [a + 1, c + 1], [a + 1, c]];
            const vi = corners.map(([ra, rc]) => {
              const k = ra * n1 + rc;
              if (ids[k] >= 0) return ids[k];
              const gxx = ix0 + rc, gzz = iz0 + ra;
              const gi = gzz * w.nx + gxx;
              const x = w.b.x0 + gxx * 10, z = w.b.z0 + gzz * 10;
              const hL = H[gzz * w.nx + Math.max(0, gxx - 1)], hR = H[gzz * w.nx + Math.min(w.nx - 1, gxx + 1)];
              const hU = H[Math.max(0, gzz - 1) * w.nx + gxx], hD = H[Math.min(w.nz - 1, gzz + 1) * w.nx + gxx];
              let nx = hL - hR, nz = hU - hD, ny = 20;
              const l = Math.hypot(nx, ny, nz);
              b.need(1, 0);
              const y = H[gi];
              this.grow(ch, y, y);
              ids[k] = b.v(x, y, z, x / 8, z / 8, nx / l, ny / l, nz / l, colAt(gi, x, z), 0);
              return ids[k];
            });
            b.need(0, 6);
            b.tri(vi[0], vi[2], vi[1]);
            b.tri(vi[0], vi[3], vi[2]);
          }
        }
        void any;
      }
    }

    buildWater() {
      const w = this.w;
      for (const ch of this.chunks) {
        const cells = CH / 10;
        let b = null;
        for (let a = 0; a < cells; a++) {
          let run = -1;
          const flush = (end) => {
            if (run < 0) return;
            if (!b) b = this.g(ch, 'water');
            const z0 = ch.z0 + a * 10 - 5, z1 = z0 + 10, x0 = ch.x0 + run * 10 - 5, x1 = ch.x0 + end * 10 - 5;
            const y = F.WATER_Y;
            b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], C('#ffffff'), MAT.WATER, [x0 / 30, z1 / 30, x1 / 30, z1 / 30, x1 / 30, z0 / 30, x0 / 30, z0 / 30], [0, 1, 0]);
            run = -1;
          };
          for (let c = 0; c <= cells; c++) {
            const x = ch.x0 + c * 10, z = ch.z0 + a * 10;
            const wet = c < cells && x <= w.b.x1 && z <= w.b.z1 && w.water[w.gi(x, z)];
            if (wet && run < 0) run = c;
            if (!wet) flush(c);
          }
        }
      }
    }

    ribbon(ch, key, pts, ys, hl, hr, yoff, texLen, sOff, col = C('#ffffff'), mat = 0, vflip = false) {
      const b = this.g(ch, key);
      const uMax = USCALE[key] ? (hl + hr) * USCALE[key] : 1;
      const n = pts.length;
      b.need(n * 2, (n - 1) * 6);
      const base = b.n;
      let s = sOff;
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
        let tx = c[0] - a[0], tz = c[1] - a[1];
        const l = Math.hypot(tx, tz) || 1;
        tx /= l; tz /= l;
        const rx = -tz, rz = tx;
        if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
        const y = ys[i] + yoff;
        this.grow(ch, y - 1, y + 1);
        const v = vflip ? -s / texLen : s / texLen;
        b.v(p[0] - rx * hl, y, p[1] - rz * hl, 0, v, 0, 1, 0, col, mat);
        b.v(p[0] + rx * hr, y, p[1] + rz * hr, uMax, v, 0, 1, 0, col, mat);
      }
      for (let i = 0; i + 1 < n; i++) {
        const a = base + i * 2;
        b.tri(a, a + 1, a + 3);
        b.tri(a, a + 3, a + 2);
      }
      return s;
    }

    wall(ch, key, pts, ys, off, h0, h1, col, texLen = 4) {
      const b = this.g(ch, key);
      const n = pts.length;
      let s = 0;
      for (let i = 0; i + 1 < n; i++) {
        const p = pts[i], q = pts[i + 1];
        const dx = q[0] - p[0], dz = q[1] - p[1];
        const l = Math.hypot(dx, dz) || 1;
        const rx = -dz / l * off, rz = dx / l * off;
        const a = [p[0] + rx, ys[i] + h0, p[1] + rz], bq = [q[0] + rx, ys[i + 1] + h0, q[1] + rz];
        const c = [q[0] + rx, ys[i + 1] + h1, q[1] + rz], d = [p[0] + rx, ys[i] + h1, p[1] + rz];
        const uv = [s / texLen, (h1 - h0) / texLen, (s + l) / texLen, (h1 - h0) / texLen, (s + l) / texLen, 0, s / texLen, 0];
        if (off > 0) b.quad(a, d, c, bq, col, 0, [uv[0], uv[1], uv[6], uv[7], uv[4], uv[5], uv[2], uv[3]]);
        else b.quad(a, bq, c, d, col, 0, uv);
        s += l;
      }
    }

    wallEnd(b, p, q, y, hw, s, col) {
      const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
      const rx = -dz / l * s, rz = dx / l * s, i0 = hw + 0.1, i1 = (hw + 0.5) * 1.03;
      const f = [[p[0] + rx * i0, y - 1.4, p[1] + rz * i0], [p[0] + rx * i1, y - 1.4, p[1] + rz * i1], [p[0] + rx * i1, y + 1.1, p[1] + rz * i1], [p[0] + rx * i0, y + 1.1, p[1] + rz * i0]];
      if (s < 0) b.quad(f[1], f[0], f[3], f[2], col, 0, null, [-dx / l, 0, -dz / l]);
      else b.quad(f[0], f[1], f[2], f[3], col, 0, null, [-dx / l, 0, -dz / l]);
    }

    buildRoads() {
      const w = this.w;
      for (const e of w.edges) this.roadMesh(e);
      for (const nd of w.nodes) this.junction(nd);
    }

    roadMesh(e, sOff = 0, vflip = false) {
      const tex = e.k.tex;
      const segN = e.pts.length;
      let start = 0;
      let sAcc = sOff;
      while (start < segN - 1) {
        const mid = e.pts[start];
        const ch = this.chunkAt(mid[0], mid[1]);
        let end = start + 1;
        while (end < segN - 1 && this.chunkAt(e.pts[end][0], e.pts[end][1]) === ch && end - start < 60) end++;
        const pts = e.pts.slice(start, end + 1), ys = e.y.slice(start, end + 1);
        sAcc = this.ribbon(ch, tex, pts, ys, e.hw, e.hw, 0.02, TEXLEN[tex] || 12, sAcc, C('#ffffff'), 0, vflip);
        start = end;
      }
      if (e.walks && !e.bridge) for (const lat of [-1, 1]) for (const run of e.walks[lat]) this.sidewalk(e, lat, run);
    }

    sidewalk(e, lat, run) {
      const w = this.w, hw = e.hw, side = e.k.side;
      const rows = [];
      const endRow = (end, sign) => {
        const pi = w.edgeAt(e, end.sIn), po = w.edgeAt(e, end.sOut);
        return { p: pi, rx: pi.rx * lat, rz: pi.rz * lat, o: po, orx: po.rx * lat, orz: po.rz * lat, sIn: end.sIn, sOut: end.sOut, cap: end.cap ? sign : 0 };
      };
      rows.push(endRow(run.a, -1));
      const lo = Math.max(run.a.sIn, run.a.sOut) + 0.3, hi = Math.min(run.b.sIn, run.b.sOut) - 0.3;
      const n = e.pts.length;
      for (let i = 1; i + 1 < n; i++) {
        if (e.s[i] <= lo || e.s[i] >= hi) continue;
        const a = e.pts[i - 1], c = e.pts[i + 1];
        let tx = c[0] - a[0], tz = c[1] - a[1];
        const l = Math.hypot(tx, tz) || 1;
        tx /= l; tz /= l;
        const p = { x: e.pts[i][0], z: e.pts[i][1], y: e.y[i], tx, tz };
        rows.push({ p, rx: -tz * lat, rz: tx * lat, o: p, orx: -tz * lat, orz: tx * lat, sIn: e.s[i], sOut: e.s[i], cap: 0 });
      }
      rows.push(endRow(run.b, 1));
      const cw = C('#ffffff'), cc = C('#c8c4bc');
      let g0 = 0;
      while (g0 < rows.length - 1) {
        const ch = this.chunkAt(rows[g0].p.x, rows[g0].p.z);
        let g1 = g0 + 1;
        while (g1 < rows.length - 1 && g1 - g0 < 60 && this.chunkAt(rows[g1].p.x, rows[g1].p.z) === ch) g1++;
        const b = this.g(ch, 'pave');
        b.need((g1 - g0 + 1) * 4 + 8, (g1 - g0) * 12 + 12);
        const base = b.n;
        for (let i = g0; i <= g1; i++) {
          const r = rows[i], p = r.p, o = r.o;
          this.grow(ch, p.y - 1, p.y + 1);
          b.v(p.x + r.rx * hw, p.y + 0.02, p.z + r.rz * hw, r.sIn / 4, 0, -r.rx, 0.2, -r.rz, cc, 0);
          b.v(p.x + r.rx * hw, p.y + 0.16, p.z + r.rz * hw, r.sIn / 4, 0.1, -r.rx, 0.2, -r.rz, cc, 0);
          b.v(p.x + r.rx * (hw + 0.02), p.y + 0.16, p.z + r.rz * (hw + 0.02), r.sIn / 4, 0, 0, 1, 0, cw, 0);
          b.v(o.x + r.orx * (hw + side), o.y + 0.16, o.z + r.orz * (hw + side), r.sOut / 4, side / 4, 0, 1, 0, cw, 0);
        }
        for (let i = 0; i < g1 - g0; i++) {
          const a = base + i * 4, c2 = a + 4;
          if (lat > 0) {
            b.tri(a, a + 1, c2 + 1); b.tri(a, c2 + 1, c2);
            b.tri(a + 2, a + 3, c2 + 3); b.tri(a + 2, c2 + 3, c2 + 2);
          } else {
            b.tri(a, c2 + 1, a + 1); b.tri(a, c2, c2 + 1);
            b.tri(a + 2, c2 + 3, a + 3); b.tri(a + 2, c2 + 2, c2 + 3);
          }
        }
        for (const i of [g0, g1]) {
          const r = rows[i];
          if (!r.cap || (i === g0 && i !== 0) || (i === g1 && i !== rows.length - 1)) continue;
          const p = r.p, nx = p.tx * r.cap, nz = p.tz * r.cap;
          const ib = [p.x + r.rx * hw, p.y + 0.02, p.z + r.rz * hw], it = [ib[0], p.y + 0.16, ib[2]];
          const ob = [p.x + r.rx * (hw + side), p.y + 0.02, p.z + r.rz * (hw + side)], ot = [ob[0], p.y + 0.16, ob[2]];
          if (lat * r.cap < 0) b.quad(ib, ob, ot, it, cc, 0, [0, 0, side / 4, 0, side / 4, 0.1, 0, 0.1], [nx, 0.2, nz]);
          else b.quad(ob, ib, it, ot, cc, 0, [side / 4, 0, 0, 0, 0, 0.1, side / 4, 0.1], [nx, 0.2, nz]);
        }
        g0 = g1;
      }
    }

    junction(nd) {
      const arms = nd.arms;
      if (!arms || !arms.length) return;
      const kinds = ['cobble', 'dirt', 'gravel', 'sandtrack', 'grasstrack'];
      let tex = 'asph';
      for (const kk of kinds) if (arms.every(A => A.e.k.tex === kk)) tex = kk;
      const ch = this.chunkAt(nd.x, nd.z);
      const b = this.g(ch, tex);
      if (arms.length === 1) {
        if (!(this.w.out && this.w.out.exits.has(nd.id))) b.disc(nd.x, nd.y + 0.05, nd.z, nd.r, 16, C('#ffffff'), 0, (x, z) => [x / 8, z / 8]);
        return;
      }
      const straight = arms.length === 2 && arms[0].e.kind === arms[1].e.kind && Math.abs(arms[0].hw - arms[1].hw) < 0.5 && arms.every(A => A.mouth < 1);
      if (!straight) this.junctionFloor(nd, ch, b);
      for (const c of nd.corners) if (c.type === 'fillet' && (c.A.side || c.B.side)) this.cornerWalk(ch, c);
    }

    junctionFloor(nd, ch, b) {
      const w = this.w, loop = [];
      const curb = (A, l, s0, s1) => {
        loop.push(w.armAt(A, s0, l));
        const e = A.e;
        const inner = [];
        for (let i = 1; i + 1 < e.pts.length; i++) {
          const s = A.end ? e.len - e.s[i] : e.s[i];
          if (s > Math.min(s0, s1) + 0.5 && s < Math.max(s0, s1) - 0.5) inner.push(s);
        }
        inner.sort((p, q) => (s1 > s0 ? p - q : q - p));
        for (const s of inner) loop.push(w.armAt(A, s, l));
        loop.push(w.armAt(A, s1, l));
      };
      nd.arms.forEach((A, k) => {
        curb(A, -A.hw, Math.max(0, A.cw.sIn), A.mouth);
        curb(A, A.hw, A.mouth, Math.max(0, A.ccw.sIn));
        const c = nd.corners[k];
        if (c.type === 'fillet') for (let i = 1; i + 1 < c.arc.length; i++) loop.push(c.arc[i]);
        else if (c.type === 'join' && c.i) loop.push(c.i);
      });
      const n = loop.length, white = C('#ffffff');
      b.need(n + 1, n * 3);
      const ci = b.v(nd.x, nd.y + 0.05, nd.z, nd.x / 8, nd.z / 8, 0, 1, 0, white, 0);
      const first = b.n;
      for (const p of loop) {
        this.grow(ch, p.y - 1, p.y + 1);
        b.v(p.x, p.y + 0.05, p.z, p.x / 8, p.z / 8, 0, 1, 0, white, 0);
      }
      for (let i = 0; i < n; i++) upTri(b, nd, ci, loop[(i + 1) % n], first + (i + 1) % n, loop[i], first + i);
    }

    cornerWalk(ch, c) {
      const w = this.w, b = this.g(ch, 'pave');
      const arc = c.arc, n = arc.length, R = c.R;
      const cw = C('#ffffff'), cc = C('#c8c4bc');
      const k = (R - 0.02) / R;
      b.need(n + 1, (n - 1) * 3);
      const ci = b.v(c.x, c.y + 0.16, c.z, c.x / 4, c.z / 4, 0, 1, 0, cw, 0);
      const first = b.n;
      for (const p of arc) {
        const x = c.x + (p.x - c.x) * k, z = c.z + (p.z - c.z) * k;
        b.v(x, p.y + 0.16, z, x / 4, z / 4, 0, 1, 0, cw, 0);
      }
      for (let i = 0; i + 1 < n; i++) upTri(b, c, ci, arc[i], first + i, arc[i + 1], first + i + 1);
      b.need(n * 2, (n - 1) * 6);
      const base = b.n;
      let u = 0;
      for (let i = 0; i < n; i++) {
        const p = arc[i];
        if (i) u += Math.hypot(p.x - arc[i - 1].x, p.z - arc[i - 1].z);
        const nx = (p.x - c.x) / R, nz = (p.z - c.z) / R;
        b.v(p.x, p.y + 0.02, p.z, u / 4, 0, nx, 0.2, nz, cc, 0);
        b.v(p.x, p.y + 0.16, p.z, u / 4, 0.1, nx, 0.2, nz, cc, 0);
      }
      const cwArc = (arc[0].z - c.z) * (arc[n - 1].x - c.x) - (arc[0].x - c.x) * (arc[n - 1].z - c.z) > 0;
      for (let i = 0; i + 1 < n; i++) {
        const a = base + i * 2;
        if (cwArc) { b.tri(a, a + 3, a + 1); b.tri(a, a + 2, a + 3); }
        else { b.tri(a, a + 1, a + 3); b.tri(a, a + 3, a + 2); }
      }
      for (const [A, t, s, flip] of [[c.A, arc[0], c.a.sIn, true], [c.B, arc[n - 1], c.b.sIn, false]]) {
        if (A.side >= R - 0.05) continue;
        const f = A.side / R, p0 = [t.x + (c.x - t.x) * f, t.y + 0.02, t.z + (c.z - t.z) * f];
        const d = w.edgeAt(A.e, A.end ? A.e.len - s : s), dir = A.end ? -1 : 1, nrm = [d.tx * dir, 0.2, d.tz * dir];
        const q = [[p0[0], p0[1], p0[2]], [c.x, c.y + 0.02, c.z], [c.x, c.y + 0.16, c.z], [p0[0], t.y + 0.16, p0[2]]];
        if (flip) b.quad(q[1], q[0], q[3], q[2], cc, 0, [R / 4, 0, 0, 0, 0, 0.1, R / 4, 0.1], nrm);
        else b.quad(q[0], q[1], q[2], q[3], cc, 0, [0, 0, R / 4, 0, R / 4, 0.1, 0, 0.1], nrm);
      }
    }

    buildBridges() {
      const w = this.w;
      const conc = C('#c4c0b8'), dark = C('#8a8680');
      for (const e of w.edges) {
        if (!e.bridge) continue;
        const n = e.pts.length;
        for (let start = 0; start < n - 1; start += 20) {
          const end = Math.min(n - 1, start + 20);
          const pts = e.pts.slice(start, end + 1), ys = e.y.slice(start, end + 1);
          const mid = pts[pts.length >> 1];
          const b = this.g(this.chunkAt(mid[0], mid[1]), 'concrete');
          for (let i = 0; i + 1 < pts.length; i++) {
            const p = pts[i], q = pts[i + 1];
            const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
            const rx = -dz / l * (e.hw + 0.5), rz = dx / l * (e.hw + 0.5);
            b.quad([p[0] + rx, ys[i] - 1.4, p[1] + rz], [q[0] + rx, ys[i + 1] - 1.4, q[1] + rz], [q[0] - rx, ys[i + 1] - 1.4, q[1] - rz], [p[0] - rx, ys[i] - 1.4, p[1] - rz], dark, 0);
          }
        }
        for (const lat of [-1, 1]) {
          for (const run of e.walks[lat]) {
            const path = w.slicePath(e,Math.max(run.a.sIn, run.a.sOut), Math.min(run.b.sIn, run.b.sOut));
            for (let start = 0; start < path.pts.length - 1; start += 20) {
              const end = Math.min(path.pts.length - 1, start + 20);
              const pts = path.pts.slice(start, end + 1), ys = path.ys.slice(start, end + 1);
              const mid = pts[pts.length >> 1];
              const ch = this.chunkAt(mid[0], mid[1]);
              this.wall(ch, 'concrete', pts, ys, lat * (e.hw + 0.5), -1.4, 1.1, conc, 4);
              this.wall(ch, 'concrete', pts, ys, lat * (e.hw + 0.1), 0.02, 1.1, dark, 4);
              const b = this.g(ch, 'concrete');
              for (let i = 0; i + 1 < pts.length; i++) {
                const p = pts[i], q = pts[i + 1];
                const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
                const rx = -dz / l * (e.hw + 0.5), rz = dx / l * (e.hw + 0.5);
                const [k0, k1] = lat > 0 ? [1.03, 0.97] : [-0.97, -1.03];
                b.quad([p[0] + rx * k0, ys[i] + 1.1, p[1] + rz * k0], [q[0] + rx * k0, ys[i + 1] + 1.1, q[1] + rz * k0], [q[0] + rx * k1, ys[i + 1] + 1.1, q[1] + rz * k1], [p[0] + rx * k1, ys[i] + 1.1, p[1] + rz * k1], conc, 0);
              }
              if (start === 0) this.wallEnd(b, pts[0], pts[1], ys[0], e.hw, lat, conc);
              if (end === path.pts.length - 1) this.wallEnd(b, pts[pts.length - 1], pts[pts.length - 2], ys[ys.length - 1], e.hw, -lat, conc);
            }
          }
        }
        for (let s = 30; s < e.len - 20; s += 42) {
          const p = w.edgePoint(e, s);
          if (p.y < 3) continue;
          const ground = w.terrainH(p.x, p.z);
          const ch = this.chunkAt(p.x, p.z);
          const b = this.g(ch, 'concrete');
          const top = p.y - 1.4, bot = Math.min(ground, F.WATER_Y) - 2;
          b.setM(p.x, (top + bot) / 2, p.z, Math.atan2(p.tx, -p.tz));
          b.box(0, 0, 0, e.hw * 0.7, (top - bot) / 2, 1.2, conc, 0);
          b.clearM();
          this.grow(ch, bot, top);
        }
      }
      const vansu = (w.roadIds.vansu || []).map(id => w.edges[id]).sort((a, b) => b.len - a.len)[0];
      if (vansu) {
        const b = new Batch(512);
        b.uvw = F.Landmarks.WHITE;
        const pyl = C('#e8e4dc'), cab = C('#f4f4f4');
        const at = w.edgePoint(vansu, vansu.len * 0.3);
        const H = 72;
        const top = [at.x - at.tx * 12, at.y + H, at.z - at.tz * 12];
        for (const s of [-1, 1]) b.beam([at.x + at.rx * (vansu.hw + 1.5) * s, at.y - 3, at.z + at.rz * (vansu.hw + 1.5) * s], top, 1.4, pyl, 0);
        for (let k = 1; k <= 9; k++) {
          for (const dir of [1, -1]) {
            const s = vansu.len * 0.3 + dir * k * 16;
            if (s < 5 || s > vansu.len - 5) continue;
            const p = w.edgePoint(vansu, s);
            if (p.y < 2) continue;
            for (const side of [-1, 1]) b.beam([top[0], top[1] - k * 3.5, top[2]], [p.x + p.rx * vansu.hw * side, p.y + 0.8, p.z + p.rz * vansu.hw * side], 0.12, cab, 0);
          }
        }
        this.landmarks.push({ type: 'vansu_pylon', name: 'Вантовый мост', x: at.x, z: at.z, y: at.y, h: H, batch: b });
      }
    }

    buildBuildings() {
      for (const bd of this.w.buildings) this.building(bd, this.rng);
    }

    building(bd, rng) {
      const ch = this.chunkAt(bd.x, bd.z);
      const st = F.STYLES[bd.style];
      const fac = F.FAC[bd.fac] || F.FAC.panel9;
      const floorH = st.floorH || 3.2;
      const y0 = bd.y, yTop = bd.y + bd.h;
      this.grow(ch, y0, yTop + 14);
      const tint = C(bd.col);
      const lit = Math.floor(rng.range(0.2, 0.85) * 255);
      const colTop = [F.clamp(Math.round(tint[0] * 0.55 + 115), 0, 255), F.clamp(Math.round(tint[1] * 0.55 + 115), 0, 255), F.clamp(Math.round(tint[2] * 0.55 + 115), 0, 255), lit];
      const colBot = [Math.round(colTop[0] * 0.7), Math.round(colTop[1] * 0.7), Math.round(colTop[2] * 0.7), lit];
      const B = normPoly(bd);
      const block = (bd.style === 'hansa' || bd.style === 'jugend') && bd.gy !== undefined;
      const fb = this.g(ch, bd.fac);
      const r2 = F.rng(bd.seed || bd.id * 7919 + 1);
      const gy = block ? bd.gy : y0, yb = block ? gy + st.ground : y0, ya = block ? yTop - st.attic : yTop;
      const colMid = mixCol(colBot, colTop, block ? (yb - y0) / (yTop - y0) : 0);
      for (let i = 0; i < 4; i++) {
        const a = B.p[i], c = B.p[(i + 1) % 4], face = B.faces[i];
        const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
        if (face === 'p') {
          const runs = B.party[i] || [[0, 1, -1e9]];
          runs.forEach(([t0, t1, top], k) => {
            const yc = Math.max(y0, top - 0.2), seg = len * (t1 - t0);
            if (yTop - yc <= 0.3 || seg < 0.05) return;
            const p0 = lerp2(a, c, t0), p1 = lerp2(a, c, t1);
            this.wallQuad(this.g(ch, 'side'), p0, p1, yc, yTop, len * t0 / 4, len * t1 / 4, (yTop - yc) / 4, 0, colBot, colTop);
            if (yTop - yc > 11 && seg > 8 && F.hash2(bd.id, i * 8 + k, 29) < (bd.style === 'jugend' ? 0.05 : 0.025)) this.mural(ch, p0, p1, seg, yc, yTop, bd.id * 4 + i);
          });
          continue;
        }
        if (face === 'b' && block) {
          this.wallQuad(this.g(ch, 'back'), a, c, y0, yTop, 0, Math.max(1, Math.round(len / 3.4)), (yTop - y0) / floorH, 0, colBot, colTop);
          continue;
        }
        const bays = Math.max(1, Math.round(len / fac.bay));
        if (block && face === 's') {
          this.groundFloor(ch, bd, st, a, c, len, bays, y0, gy, colBot, colMid, i === B.front, F.rng((bd.seed || bd.id) * 4 + i + 1));
          this.wallQuad(fb, a, c, yb, ya, 0, bays, (ya - yb) / floorH, 0, colMid, colTop);
          this.wallQuad(fb, a, c, ya, yTop, 0, bays, 0.045, 0, colTop, colTop);
          this.cornice(ch, a, c, yb + 0.24, 0.22, colMid);
          this.cornice(ch, a, c, yTop, bd.style === 'jugend' ? 0.7 : 0.45, colTop);
          continue;
        }
        this.wallQuad(fb, a, c, y0, yTop, 0, bays, (yTop - y0) / floorH, 0, colBot, colTop);
      }
      if (block) this.blockRoof(ch, bd, B, yTop, fb, colTop, r2);
      else {
        const tx = bd.tx, tz = bd.tz, hw = bd.w / 2, hd = bd.d / 2, nx = -tz, nz = tx;
        const P = (a, c) => [bd.x + tx * a + nx * c, bd.z + tz * a + nz * c];
        this.roof(ch, bd, [P(-hw, -hd), P(hw, -hd), P(hw, hd), P(-hw, hd)], yTop, tx, tz, hw, hd, fb);
        if (bd.roof === 'flat') this.flatDetails(ch, bd, B.p, yTop, colTop, r2);
        if (bd.jv) this.resortDetails(ch, bd, B, y0, yTop, fb, colBot, colTop);
      }
    }

    groundFloor(ch, bd, st, a, c, len, bays, y0, gy, colBot, colMid, main, r) {
      const kit = F.GFLOOR, set = kit[bd.style], G = st.ground, k = G / 4;
      const b = this.g(ch, 'gfloor'), xb = this.g(ch, 'x_gfloor');
      const U = u => u / kit.W, V = v => v / kit.H;
      const dx = (c[0] - a[0]) / len, dz = (c[1] - a[1]) / len, n = [dz, 0, -dx];
      const at = s => [a[0] + dx * s, a[1] + dz * s];
      const width = t => set[t].w / kit.M;
      const bw = len / bays, room = bw - 0.3;
      const plan = new Array(bays).fill(bd.shop ? 'shop' : 'win');
      if (!bd.shop && bays > 1 && r() < 0.3) plan[r.int(0, bays - 1)] = 'shop';
      if (!bd.corner && bays >= 4 && r() < (bd.style === 'jugend' ? 0.5 : 0.35)) plan[r.int(1, bays - 2)] = 'gate';
      if (main || bays >= 3) {
        const free = plan.map((t, i) => i).filter(i => plan[i] !== 'gate');
        plan[free[r.int(0, free.length - 1)]] = 'door';
      }
      for (let i = 0; i < bays; i++) if (plan[i] === 'shop') plan[i] = r() < 0.22 ? 'cafe' : r() < 0.4 ? 'shop2' : 'shop';
      const units = [];
      for (let i = 0; i < bays; i++) {
        const t = [plan[i], ...UNIT_FALLBACK[plan[i]]].find(o => width(o) * 0.85 <= room);
        if (!t) continue;
        const w = Math.min(width(t), room), m = (i + 0.5) * bw;
        units.push({ t, s0: m - w / 2, s1: m + w / 2, m, w });
      }
      const yt = gy + G, lit = col => [col[0], col[1], col[2], 235];
      const cell = (t, s0, s1, u0, u1, colA, colB) => {
        const q = set[t];
        this.wallQuad(b, at(s0), at(s1), gy, yt, U(q.x + u1), U(q.x + u0), V(q.y + kit.ROW - 0.5), V(q.y + 0.5), colA, colB);
      };
      const pier = (s0, s1) => {
        const n0 = Math.ceil((s1 - s0) / 2 - 1e-6);
        for (let j = 0; j < n0; j++) cell('pier', s0 + (s1 - s0) * j / n0, s0 + (s1 - s0) * (j + 1) / n0, 3, set.pier.w - 3, colBot, colMid);
      };
      if (gy - y0 > 0.02) {
        const [sx, sy, sw, sh] = kit.stone, vb = V(sy + Math.min(sh, (gy - y0) / 2 * sh));
        for (let s = 0; s < len - 1e-3; s += 2) {
          const e = Math.min(len, s + 2);
          this.wallQuad(b, at(s), at(e), y0, gy, U(sx + (e - s) / 2 * sw), U(sx), vb, V(sy), shade3(colBot, 0.85), colBot);
        }
      }
      let cur = 0;
      for (const u of units) {
        if (u.s0 - cur > 0.01) pier(cur, u.s0);
        const shop = u.t === 'shop' || u.t === 'shop2' || u.t === 'cafe';
        cell(u.t, u.s0, u.s1, 0.5, set[u.t].w - 0.5, shop ? lit(colBot) : colBot, shop ? lit(colMid) : colMid);
        cur = u.s1;
        const q = set[u.t];
        if (q.sign) {
          const pool = kit.signs.filter(sg => sg.cafe === (u.t === 'cafe')), sg = pool[r.int(0, pool.length - 1)];
          const h0 = gy + q.sign[0] * k, h1 = gy + q.sign[1] * k, sw = Math.min(u.w * 0.84, (h1 - h0) * 6.2);
          this.signBoard(xb, at(u.m - sw / 2), at(u.m + sw / 2), h0, h1, n, [dx, 0, dz], sg);
        }
        if (q.awn) this.awning(xb, at(u.m - u.w / 2 + 0.1), at(u.m + u.w / 2 - 0.1), gy + q.awn * k, n, [dx, 0, dz], kit.awn[r.int(0, kit.awn.length - 1)]);
      }
      if (len - cur > 0.01) pier(cur, len);
    }

    signBoard(b, A, Cq, y0, y1, n, t, sg) {
      const kit = F.GFLOOR, U = u => u / kit.W, V = v => v / kit.H, out = 0.14;
      const o = q => [q[0] + n[0] * 0.02, q[1] + n[2] * 0.02], f = q => [q[0] + n[0] * out, q[1] + n[2] * out];
      const a0 = o(A), c0 = o(Cq), a1 = f(A), c1 = f(Cq);
      const face = [255, 255, 255, 150], side = [255, 255, 255, 0];
      const [dx, dy, dw, dh] = kit.dark, du = U(dx + dw / 2), dv = V(dy + dh / 2), dark = [du, dv, du, dv, du, dv, du, dv];
      oq(b, [a1[0], y0, a1[1]], [c1[0], y0, c1[1]], [c1[0], y1, c1[1]], [a1[0], y1, a1[1]], face, MAT.AD, [U(sg.x + kit.SW), V(sg.y + kit.SH), U(sg.x), V(sg.y + kit.SH), U(sg.x), V(sg.y), U(sg.x + kit.SW), V(sg.y)], n);
      oq(b, [a0[0], y1, a0[1]], [c0[0], y1, c0[1]], [c1[0], y1, c1[1]], [a1[0], y1, a1[1]], side, 0, dark, [0, 1, 0]);
      oq(b, [a0[0], y0, a0[1]], [a1[0], y0, a1[1]], [c1[0], y0, c1[1]], [c0[0], y0, c0[1]], side, 0, dark, [0, -1, 0]);
      oq(b, [a0[0], y0, a0[1]], [a1[0], y0, a1[1]], [a1[0], y1, a1[1]], [a0[0], y1, a0[1]], side, 0, dark, [-t[0], 0, -t[2]]);
      oq(b, [c0[0], y0, c0[1]], [c1[0], y0, c1[1]], [c1[0], y1, c1[1]], [c0[0], y1, c0[1]], side, 0, dark, t);
    }

    awning(b, A, Cq, y, n, t, [ax, ay]) {
      const kit = F.GFLOOR, U = u => u / kit.W, V = v => v / kit.H, depth = 1.25, drop = 0.5, val = 0.24;
      const P = (q, d, h) => [q[0] + n[0] * d, h, q[1] + n[2] * d];
      const w0 = P(A, 0.02, y), w1 = P(Cq, 0.02, y), f0 = P(A, depth, y - drop), f1 = P(Cq, depth, y - drop), g0 = P(A, depth, y - drop - val), g1 = P(Cq, depth, y - drop - val);
      const l = Math.hypot(depth, drop), up = [n[0] * drop / l, depth / l, n[2] * drop / l], white = [255, 255, 255, 0], under = [150, 146, 140, 0];
      const uR = U(ax + 64), uL = U(ax), v0 = V(ay), v1 = V(ay + 64), v2 = V(ay + 96), mid = [U(ax + 4), V(ay + 32)];
      oq(b, w0, w1, f1, f0, white, 0, [uR, v0, uL, v0, uL, v1, uR, v1], up);
      oq(b, w0, f0, f1, w1, under, 0, [uR, v0, uR, v1, uL, v1, uL, v0], [-up[0], -up[1], -up[2]]);
      oq(b, g0, g1, f1, f0, white, 0, [uR, v2, uL, v2, uL, v1, uR, v1], n);
      oq(b, g0, f0, f1, g1, under, 0, [uR, v2, uR, v1, uL, v1, uL, v2], [-n[0], 0, -n[2]]);
      for (const [w, f, g, s] of [[w0, f0, g0, -1], [w1, f1, g1, 1]]) {
        const sn = [t[0] * s, 0, t[2] * s];
        ot(b, w, f, g, white, 0, [mid[0], mid[1], mid[0], mid[1], mid[0], mid[1]], sn);
        ot(b, w, g, f, under, 0, [mid[0], mid[1], mid[0], mid[1], mid[0], mid[1]], [-sn[0], 0, -sn[2]]);
      }
    }

    resortDetails(ch, bd, B, y0, yTop, fb, colBot, colTop) {
      const jv = bd.jv, p = B.p;
      let fi = 0, best = -2;
      for (let i = 0; i < 4; i++) {
        const a = p[i], c = p[(i + 1) % 4], l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
        const dot = ((c[1] - a[1]) / l) * jv.fx - ((c[0] - a[0]) / l) * jv.fz;
        if (dot > best) { best = dot; fi = i; }
      }
      const a = p[fi], c = p[(fi + 1) % 4];
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]), dx = (c[0] - a[0]) / L, dz = (c[1] - a[1]) / L, nx = dz, nz = -dx;
      const at = (s, o) => [a[0] + dx * s + nx * o, a[1] + dz * s + nz * o];
      const P3 = (q, y) => [q[0], y, q[1]];
      const white = C('#f4f2ea'), wb = this.g(ch, 'x_white'), rb = this.g(ch, 'roof_tin'), rc = C(jv.roof);
      const seed = Math.abs(Math.round(bd.x * 3.7 + bd.z * 5.3));
      if (jv.veranda) {
        const vw = Math.min(L - 1.6, Math.max(4.5, L * 0.66)), s0 = (L - vw) / 2, s1 = s0 + vw, dv = 2.8, yr = y0 + 3.1;
        const vb = this.g(ch, 'villa2'), bays = Math.max(1, Math.round(vw / F.FAC.villa2.bay));
        this.wallQuad(vb, at(s0, dv), at(s1, dv), y0, yr, 0, bays, 1, 0, colBot, colTop);
        this.wallQuad(vb, at(s0, 0), at(s0, dv), y0, yr, 0, 1, 1, 0, colBot, colTop);
        this.wallQuad(vb, at(s1, dv), at(s1, 0), y0, yr, 0, 1, 1, 0, colBot, colTop);
        const q = [at(s0 - 0.15, 0), at(s1 + 0.15, 0), at(s1 + 0.15, dv + 0.15), at(s0 - 0.15, dv + 0.15)];
        oq(wb, P3(q[0], yr + 0.18), P3(q[3], yr + 0.18), P3(q[2], yr + 0.18), P3(q[1], yr + 0.18), white, 0, null, [0, 1, 0]);
        oq(wb, P3(q[3], yr), P3(q[2], yr), P3(q[2], yr + 0.18), P3(q[3], yr + 0.18), white, 0, null, [nx, 0, nz]);
        oq(wb, P3(q[0], yr), P3(q[3], yr), P3(q[3], yr + 0.18), P3(q[0], yr + 0.18), white, 0, null, [-dx, 0, -dz]);
        oq(wb, P3(q[2], yr), P3(q[1], yr), P3(q[1], yr + 0.18), P3(q[2], yr + 0.18), white, 0, null, [dx, 0, dz]);
        const rail = [at(s0 - 0.05, 0.1), at(s0 - 0.05, dv + 0.05), at(s1 + 0.05, dv + 0.05), at(s1 + 0.05, 0.1)];
        for (let k = 0; k < 3; k++) {
          const r0 = rail[k], r1 = rail[k + 1], n = Math.max(1, Math.round(Math.hypot(r1[0] - r0[0], r1[1] - r0[1]) / 0.9));
          wb.beam(P3(r0, yr + 1.12), P3(r1, yr + 1.12), 0.05, white, 0);
          for (let j = 0; j <= n; j++) { const m = [r0[0] + (r1[0] - r0[0]) * j / n, r0[1] + (r1[1] - r0[1]) * j / n]; wb.beam(P3(m, yr + 0.18), P3(m, yr + 1.1), 0.035, white, 0); }
        }
      }
      if (jv.turret) {
        const s = seed % 2 ? 0.3 : L - 0.3, cc = at(s, 0.6), r = 1.9, yT = yTop + 2.6, n = 8;
        const ring = [];
        for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; ring.push([cc[0] + Math.cos(t) * r, cc[1] + Math.sin(t) * r]); }
        for (let i = 0; i < n; i++) this.wallQuad(fb, ring[i], ring[i + 1], y0, yT, 0, 1, (yT - y0) / F.STYLES[bd.style].floorH, 0, colBot, colTop);
        const apex = [cc[0], yT + 4.4, cc[1]];
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n * Math.PI * 2, e0 = [cc[0] + (ring[i][0] - cc[0]) * 1.15, cc[1] + (ring[i][1] - cc[1]) * 1.15], e1 = [cc[0] + (ring[i + 1][0] - cc[0]) * 1.15, cc[1] + (ring[i + 1][1] - cc[1]) * 1.15];
          ot(rb, P3(e0, yT), P3(e1, yT), apex, rc, 0, [0, 0, 0.6, 0, 0.3, 1.1], [Math.cos(t), 0.5, Math.sin(t)]);
          oq(wb, P3(ring[i], yT - 0.25), P3(ring[i + 1], yT - 0.25), P3(e1, yT + 0.02), P3(e0, yT + 0.02), white, 0, null, [Math.cos(t), -0.3, Math.sin(t)]);
        }
        wb.beam(apex, [apex[0], apex[1] + 1.2, apex[2]], 0.05, white, 0);
      }
      if (jv.gable && L > 7) {
        const m = L / 2, gw = Math.min(3.2, L * 0.28), gh = 3.1, o = 0.05;
        const g0 = P3(at(m - gw, o), yTop), g1 = P3(at(m + gw, o), yTop), gt = P3(at(m, o), yTop + gh);
        ot(fb, g0, g1, gt, colTop, MAT.WINDOWS, [0.25, 1, 1.25, 1, 0.75, 0.05], [nx, 0, nz]);
        const back = 4.2, b0 = P3(at(m - gw, -back), yTop), b1 = P3(at(m + gw, -back), yTop), bt = P3(at(m, -back), yTop + gh);
        const ex = [nx * 0.35, 0, nz * 0.35];
        const add = (q, k) => [q[0] + ex[0] * k, q[1], q[2] + ex[2] * k];
        oq(rb, add(g0, 1), add(gt, 1), bt, b0, rc, 0, [0, 0, 0, 1, 1, 1, 1, 0], [-dx, 0.8, -dz]);
        oq(rb, add(gt, 1), add(g1, 1), b1, bt, rc, 0, [0, 1, 0, 0, 1, 0, 1, 1], [dx, 0.8, dz]);
        wb.beam(add(g0, 0.6), add(gt, 0.6), 0.07, white, 0);
        wb.beam(add(gt, 0.6), add(g1, 0.6), 0.07, white, 0);
      }
    }

    mural(ch, a, c, len, y0, y1, seed) {
      const dx = (c[0] - a[0]) / len, dz = (c[1] - a[1]) / len, n = [dz, 0, -dx];
      const mw = Math.min(len * 0.84, (y1 - y0 - 2) / 1.5), mh = mw * 1.5, top = y1 - 0.8, m = len / 2;
      const P = s => [a[0] + dx * s + n[0] * 0.06, a[1] + dz * s + n[2] * 0.06];
      F.Ads.adQuad(this.g(ch, 'adatlas'), P(m - mw / 2), P(m + mw / 2), top - mh, top, n, F.Ads.pick('wall', 'any', seed), 0.05);
      (this.murals || (this.murals = [])).push({ x: a[0] + dx * m, z: a[1] + dz * m, y: top - mh / 2 });
    }

    flatDetails(ch, bd, p, y, col, rng) {
      const b = this.g(ch, 'x_white');
      const par = shade3(col, 0.9);
      for (let i = 0; i < 4; i++) {
        const a = p[i], c = p[(i + 1) % 4];
        const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
        const nx = dz / l, nz = -dx / l;
        oq(b, [a[0], y, a[1]], [c[0], y, c[1]], [c[0], y + 0.9, c[1]], [a[0], y + 0.9, a[1]], par, 0, null, [nx, 0, nz]);
        oq(b, [a[0] - nx * 0.3, y + 0.9, a[1] - nz * 0.3], [c[0] - nx * 0.3, y + 0.9, c[1] - nz * 0.3], [c[0] - nx * 0.3, y, c[1] - nz * 0.3], [a[0] - nx * 0.3, y, a[1] - nz * 0.3], shade3(par, 0.8), 0, null, [-nx, 0, -nz]);
        oq(b, [a[0], y + 0.9, a[1]], [c[0], y + 0.9, c[1]], [c[0] - nx * 0.3, y + 0.9, c[1] - nz * 0.3], [a[0] - nx * 0.3, y + 0.9, a[1] - nz * 0.3], shade3(par, 1.1), 0, null, [0, 1, 0]);
      }
      const soviet = bd.style === 'soviet' || bd.style === 'khrush';
      if (!soviet) return;
      const cx = bd.x, cz = bd.z, tx = bd.tx, tz = bd.tz, nx = -bd.tz, nz = bd.tx;
      if (bd.floors >= 9) {
        const n = bd.w > 40 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const off = n === 1 ? 0 : (k ? 0.25 : -0.25) * bd.w;
          b.setM(cx + tx * off, y, cz + tz * off, Math.atan2(tz, tx));
          b.box(0, 1.4, 0, 3, 1.4, 2.2, C('#b8b4ac'), 0, { top: C('#6a6862') });
          b.clearM();
        }
      }
      const side = rng() < 0.5 ? -1 : 1;
      const doors = Math.max(1, Math.floor(bd.w / 18));
      const dark = C('#3a3430'), slab = C('#c8c4bc');
      for (let k = 0; k < doors; k++) {
        const s = (k + 0.5) / doors - 0.5;
        const px = cx + tx * s * bd.w + nx * side * (bd.d / 2), pz = cz + tz * s * bd.w + nz * side * (bd.d / 2);
        const ox = nx * side, oz = nz * side;
        const w0 = [px - tx * 0.8 + ox * 0.03, bd.y + 0.3, pz - tz * 0.8 + oz * 0.03], w1 = [px + tx * 0.8 + ox * 0.03, bd.y + 0.3, pz + tz * 0.8 + oz * 0.03];
        oq(b, w0, w1, [w1[0], bd.y + 2.4, w1[2]], [w0[0], bd.y + 2.4, w0[2]], dark, 0, null, [ox, 0, oz]);
        b.setM(px + ox * 0.7, bd.y + 2.7, pz + oz * 0.7, Math.atan2(tz, tx));
        b.box(0, 0, 0, 1.4, 0.1, 0.75, slab, 0);
        b.clearM();
      }
    }

    cornice(ch, a, c, y, out, col) {
      const b = this.g(ch, 'x_white');
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nx = dz / l * out, nz = -dx / l * out;
      const tc = [F.clamp(col[0] + 30, 0, 255), F.clamp(col[1] + 30, 0, 255), F.clamp(col[2] + 30, 0, 255), 255];
      const h = out * 1.1;
      const A = [a[0] + nx, y - h, a[1] + nz], Cc = [c[0] + nx, y - h, c[1] + nz], A2 = [a[0] + nx, y, a[1] + nz], C2 = [c[0] + nx, y, c[1] + nz];
      oq(b, A, Cc, C2, A2, tc, 0, null, [dz / l, 0, -dx / l]);
      oq(b, [a[0], y - h, a[1]], [c[0], y - h, c[1]], Cc, A, shade3(tc, 0.62), 0, null, [0, -1, 0]);
      oq(b, A2, C2, [c[0], y, c[1]], [a[0], y, a[1]], tc, 0, null, [0, 1, 0]);
    }

    blockRoof(ch, bd, B, y, fb, col, rng) {
      const p = B.p, white = C('#ffffff');
      const f = B.front;
      const A = p[f], Bp = p[(f + 1) % 4], Cq = p[(f + 2) % 4], D = p[(f + 3) % 4];
      const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
      const len = (u, v) => Math.hypot(v[0] - u[0], v[1] - u[1]);
      const hansa = bd.style === 'hansa';
      const tile = this.g(ch, hansa ? 'roof_tile' : bd.seed % 3 === 0 ? 'roof_tile' : 'roof_slate');
      const P3 = (q, h) => [q[0], y + h, q[1]];
      const uvw = q => [q[0] / 4, q[2] / 4];
      const quadR = (b, q0, q1, q2, q3) => { const u0 = uvw(q0), u1 = uvw(q1), u2 = uvw(q2), u3 = uvw(q3); b.quad(q0, q1, q2, q3, white, 0, [u0[0], u0[1], u1[0], u1[1], u2[0], u2[1], u3[0], u3[1]]); };
      const triR = (b, q0, q1, q2) => { const u0 = uvw(q0), u1 = uvw(q1), u2 = uvw(q2); b.triangle(q0, q1, q2, white, 0, [u0[0], u0[1], u1[0], u1[1], u2[0], u2[1]]); };
      const wF = len(A, Bp), dSide = len(Bp, Cq);
      const gableWall = (a, c, h, prof, key) => {
        const b = this.g(ch, key);
        const n = prof.length - 1;
        const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
        const nrm = [dz / l, 0, -dx / l];
        const fh = F.STYLES[bd.style].floorH;
        for (let k = 0; k < n; k++) {
          const t0 = k / n, t1 = (k + 1) / n;
          const q0 = [a[0] + dx * t0, y, a[1] + dz * t0], q1 = [a[0] + dx * t1, y, a[1] + dz * t1];
          const h0 = prof[k] * h, h1 = prof[k + 1] * h;
          if (h0 < 0.01 && h1 < 0.01) continue;
          const u0 = t0 * l / 3.5, u1 = t1 * l / 3.5;
          b.quad(q0, q1, [q1[0], y + h1, q1[2]], [q0[0], y + h0, q0[2]], col, MAT.WINDOWS, [u0, 0, u1, 0, u1, -h1 / fh, u0, -h0 / fh], nrm);
          b.quad(q1, q0, [q0[0], y + h0, q0[2]], [q1[0], y + h1, q1[2]], shade3(col, 0.8), 0, [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [-nrm[0], 0, -nrm[2]]);
        }
      };
      if (bd.roof === 'front' && !bd.corner) {
        const rh = Math.min(wF * 0.95, 11);
        const F0 = mid(A, Bp), F1 = mid(Cq, D);
        quadR(tile, P3(D, 0), P3(A, 0), P3(F0, rh), P3(F1, rh));
        quadR(tile, P3(Bp, 0), P3(Cq, 0), P3(F1, rh), P3(F0, rh));
        const prof = [];
        const n = 12;
        for (let k = 0; k <= n; k++) {
          const t = k / n, tri = 1 - Math.abs(2 * t - 1);
          if (bd.gable === 'step') prof.push(Math.min(1, (Math.floor(tri * 5 + 0.0001) + 1) / 5.2) * (k === 0 || k === n ? 0.18 : 1));
          else if (bd.gable === 'curve') prof.push(Math.min(1, tri < 0.5 ? 0.62 * Math.sin(tri / 0.5 * Math.PI / 2) : 0.62 + 0.38 * Math.pow((tri - 0.5) / 0.5, 0.7)) * (k === 0 || k === n ? 0.25 : 1));
          else prof.push(tri);
        }
        gableWall(A, Bp, rh, prof, bd.fac);
        gableWall(Cq, D, rh, prof.map((v, k) => 1 - Math.abs(2 * k / n - 1)), 'back');
        if (bd.gable === 'curve') {
          const b = this.g(ch, 'x_white');
          const top = [F0[0], y + rh, F0[1]];
          b.box(top[0], top[1] + 0.5, top[2], 0.35, 0.5, 0.35, shade3(col, 1.1), 0);
        }
        this.chimneys(ch, [mid(F0, F1)], y + rh * 0.7, rng);
        return;
      }
      if (bd.roof === 'mansard' || bd.corner) {
        const ins = inset(p, bd.style === 'jugend' ? 1.5 : 1.2);
        const h1 = bd.style === 'jugend' ? 3.4 : 2.8;
        if (!ins) return;
        for (let i = 0; i < 4; i++) quadR(tile, P3(p[i], 0), P3(p[(i + 1) % 4], 0), P3(ins[(i + 1) % 4], h1), P3(ins[i], h1));
        const ins2 = inset(ins, 2.2);
        if (ins2) {
          const h2 = h1 + 1.6;
          const top = this.g(ch, 'roof_slate');
          for (let i = 0; i < 4; i++) quadR(top, P3(ins[i], h1), P3(ins[(i + 1) % 4], h1), P3(ins2[(i + 1) % 4], h2), P3(ins2[i], h2));
          quadR(this.g(ch, 'roof_flat'), P3(ins2[0], h2), P3(ins2[1], h2), P3(ins2[2], h2), P3(ins2[3], h2));
        } else quadR(this.g(ch, 'roof_flat'), P3(ins[0], h1), P3(ins[1], h1), P3(ins[2], h1), P3(ins[3], h1));
        for (let i = 0; i < 4; i++) if (B.faces[i] === 's') this.dormers(ch, p[i], p[(i + 1) % 4], ins[i], ins[(i + 1) % 4], y, h1, col, rng);
        if (bd.tower && B.corner) this.turret(ch, B.corner, B.cornerIn, y, bd, col);
        this.chimneys(ch, [mid(ins[0], ins[2])], y + h1 + 0.6, rng);
        return;
      }
      const rh = Math.min(dSide / 2, 7) * (hansa ? 1.1 : 0.72);
      const M1 = mid(D, A), M2 = mid(Bp, Cq);
      if (bd.roof === 'hip') {
        const r = Math.min(wF * 0.3, dSide * 0.45);
        const ux = (M2[0] - M1[0]) / (len(M1, M2) || 1), uz = (M2[1] - M1[1]) / (len(M1, M2) || 1);
        const R1 = [M1[0] + ux * r, M1[1] + uz * r], R2 = [M2[0] - ux * r, M2[1] - uz * r];
        quadR(tile, P3(A, 0), P3(Bp, 0), P3(R2, rh), P3(R1, rh));
        quadR(tile, P3(Cq, 0), P3(D, 0), P3(R1, rh), P3(R2, rh));
        triR(tile, P3(Bp, 0), P3(Cq, 0), P3(R2, rh));
        triR(tile, P3(D, 0), P3(A, 0), P3(R1, rh));
        this.dormers(ch, A, Bp, R1, R2, y, rh * 0.5, col, rng);
        this.chimneys(ch, [R1, R2], y + rh, rng);
        return;
      }
      quadR(tile, P3(A, 0), P3(Bp, 0), P3(M2, rh), P3(M1, rh));
      quadR(tile, P3(Cq, 0), P3(D, 0), P3(M1, rh), P3(M2, rh));
      gableWall(Bp, Cq, rh, [0, 1, 0], 'side');
      gableWall(D, A, rh, [0, 1, 0], 'side');
      this.dormers(ch, A, Bp, M1, M2, y, rh * 0.5, col, rng);
      this.chimneys(ch, [mid(M1, M2)], y + rh, rng);
    }

    dormers(ch, a, c, ia, ic, y, hMax, col, rng) {
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const n = Math.floor(L / 4.6);
      if (n < 1 || rng() < 0.3) return;
      const b = this.g(ch, 'x_back'), rb = this.g(ch, 'x_roof_slate');
      const dx = (c[0] - a[0]) / L, dz = (c[1] - a[1]) / L, nx = dz, nz = -dx;
      const inx = (ia[0] + ic[0]) / 2 - (a[0] + c[0]) / 2, inz = (ia[1] + ic[1]) / 2 - (a[1] + c[1]) / 2;
      const inl = Math.hypot(inx, inz) || 1;
      const sl = inl / Math.max(hMax, 0.1);
      const h0 = Math.min(1.1, hMax * 0.35);
      for (let k = 0; k < n; k++) {
        const s = (k + 0.5) * L / n;
        const cx = a[0] + dx * s + (inx / inl) * h0 * sl, cz = a[1] + dz * s + (inz / inl) * h0 * sl;
        const hw = 0.8, hh = 1.7, dp = 1.4;
        const fy = y + h0;
        const f0 = [cx - dx * hw, fy, cz - dz * hw], f1 = [cx + dx * hw, fy, cz + dz * hw];
        oq(b, f0, f1, [f1[0], fy + hh, f1[2]], [f0[0], fy + hh, f0[2]], col, MAT.WINDOWS, [0.3, 0.95, 0.7, 0.95, 0.7, 0.25, 0.3, 0.25], [nx, 0, nz]);
        const bx = -(inx / inl) * -dp, bz = -(inz / inl) * -dp;
        for (const sgn of [-1, 1]) {
          const e0 = sgn < 0 ? f0 : f1;
          const e1 = [e0[0] + bx, fy + hh * 0.2, e0[2] + bz];
          const sn = [dx * sgn, 0, dz * sgn];
          ot(b, e0, [e0[0], fy + hh, e0[2]], [e1[0], fy + hh, e1[2]], shade3(col, 0.85), 0, [0.05, 0.05, 0.05, 0.05, 0.05, 0.05], sn);
          ot(b, e0, [e1[0], fy + hh, e1[2]], e1, shade3(col, 0.85), 0, [0.05, 0.05, 0.05, 0.05, 0.05, 0.05], sn);
        }
        const top = [cx, fy + hh + 0.6, cz];
        rb.quad([f0[0], fy + hh, f0[2]], [f0[0] + bx, fy + hh, f0[2] + bz], [top[0] + bx, top[1], top[2] + bz], top, C('#ffffff'), 0, [0, 0, 0.5, 0, 0.5, 0.3, 0, 0.3]);
        rb.quad(top, [top[0] + bx, top[1], top[2] + bz], [f1[0] + bx, fy + hh, f1[2] + bz], [f1[0], fy + hh, f1[2]], C('#ffffff'), 0, [0, 0, 0.5, 0, 0.5, 0.3, 0, 0.3]);
      }
    }

    chimneys(ch, pts, y, rng) {
      const b = this.g(ch, 'x_white');
      for (const q of pts) {
        if (rng() < 0.35) continue;
        const brick = rng() < 0.6 ? C('#8a4a38') : C('#9a948c');
        b.box(q[0] + (rng() - 0.5) * 2, y + 0.9, q[1] + (rng() - 0.5) * 2, 0.4, 1.2, 0.35, brick, 0, { top: C('#3a3432') });
      }
    }

    turret(ch, c, inward, y, bd, col) {
      const b = this.g(ch, bd.fac), rb = this.g(ch, 'x_roof_slate'), wb = this.g(ch, 'x_white');
      const r = 2.7, cx = c[0] + inward[0] * 0.9, cz = c[1] + inward[1] * 0.9;
      const fh = F.STYLES[bd.style].floorH;
      const y0 = bd.gy + F.STYLES[bd.style].ground + fh * 2, y1 = y + 4.6;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        const q0 = [cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], q1 = [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r];
        const nm = [(Math.cos(a0) + Math.cos(a1)) / 2, 0, (Math.sin(a0) + Math.sin(a1)) / 2];
        b.quad([q1[0], y0, q1[1]], [q0[0], y0, q0[1]], [q0[0], y1, q0[1]], [q1[0], y1, q1[1]], col, MAT.WINDOWS, [0, (y1 - y0) / fh, 0.5, (y1 - y0) / fh, 0.5, 0, 0, 0], nm);
        ot(wb, [q0[0], y0, q0[1]], [q1[0], y0, q1[1]], [cx, y0 - 2.2, cz], shade3(col, 0.8), 0, null, [nm[0], -0.8, nm[2]]);
        const d0 = [cx + Math.cos(a0) * r * 1.08, y1, cz + Math.sin(a0) * r * 1.08], d1 = [cx + Math.cos(a1) * r * 1.08, y1, cz + Math.sin(a1) * r * 1.08];
        const m0 = [cx + Math.cos(a0) * r * 0.95, y1 + 2.4, cz + Math.sin(a0) * r * 0.95], m1 = [cx + Math.cos(a1) * r * 0.95, y1 + 2.4, cz + Math.sin(a1) * r * 0.95];
        rb.quad(d1, d0, m0, m1, C('#ffffff'), 0, [0, 0, 0.4, 0, 0.4, 0.4, 0, 0.4]);
        rb.triangle(m1, m0, [cx, y1 + 5.4, cz], C('#ffffff'), 0, [0, 0, 0.4, 0, 0.2, 0.5]);
      }
      wb.box(cx, y1 + 6.6, cz, 0.08, 1.2, 0.08, C('#d8c060'), MAT.CHROME);
    }

    wallQuad(b, a, c, y0, y1, u0, u1, v0, v1, colB, colT) {
      b.need(4, 6);
      const dx = c[0] - a[0], dz = c[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      const nx = dz / l, nz = -dx / l;
      const i0 = b.v(a[0], y0, a[1], u0, v0, nx, 0, nz, colB, MAT.WINDOWS);
      const i1 = b.v(c[0], y0, c[1], u1, v0, nx, 0, nz, colB, MAT.WINDOWS);
      const i2 = b.v(c[0], y1, c[1], u1, v1, nx, 0, nz, colT, MAT.WINDOWS);
      const i3 = b.v(a[0], y1, a[1], u0, v1, nx, 0, nz, colT, MAT.WINDOWS);
      b.tri(i0, i2, i1);
      b.tri(i0, i3, i2);
    }

    roof(ch, bd, corners, y, tx, tz, hw, hd, fb) {
      const white = C('#ffffff');
      const nx = -tz, nz = tx;
      const P = (a, c, h) => [bd.x + tx * a + nx * c, y + h, bd.z + tz * a + nz * c];
      const uvw = (p) => [p[0] / 4, p[2] / 4];
      const quadUV = (b, p0, p1, p2, p3, col) => {
        const u0 = uvw(p0), u1 = uvw(p1), u2 = uvw(p2), u3 = uvw(p3);
        b.quad(p0, p1, p2, p3, col, 0, [u0[0], u0[1], u1[0], u1[1], u2[0], u2[1], u3[0], u3[1]]);
      };
      const triUV = (b, p0, p1, p2, col) => {
        const u0 = uvw(p0), u1 = uvw(p1), u2 = uvw(p2);
        b.triangle(p0, p1, p2, col, 0, [u0[0], u0[1], u1[0], u1[1], u2[0], u2[1]]);
      };
      const e = 0.35;
      if (bd.roof === 'flat') {
        const b = this.g(ch, 'roof_flat');
        quadUV(b, P(-hw, hd, 0), P(hw, hd, 0), P(hw, -hd, 0), P(-hw, -hd, 0), white);
        return;
      }
      if (bd.roof === 'mansard') {
        const b = this.g(ch, 'roof_slate');
        const inset = 1.6, h = 3.2;
        quadUV(b, P(-hw, hd, 0), P(hw, hd, 0), P(hw - inset, hd - inset, h), P(-hw + inset, hd - inset, h), white);
        quadUV(b, P(hw, -hd, 0), P(-hw, -hd, 0), P(-hw + inset, -hd + inset, h), P(hw - inset, -hd + inset, h), white);
        quadUV(b, P(hw, hd, 0), P(hw, -hd, 0), P(hw - inset, -hd + inset, h), P(hw - inset, hd - inset, h), white);
        quadUV(b, P(-hw, -hd, 0), P(-hw, hd, 0), P(-hw + inset, hd - inset, h), P(-hw + inset, -hd + inset, h), white);
        const fl = this.g(ch, 'roof_flat');
        quadUV(fl, P(-hw + inset, hd - inset, h), P(hw - inset, hd - inset, h), P(hw - inset, -hd + inset, h), P(-hw + inset, -hd + inset, h), white);
        return;
      }
      const tex = bd.style === 'wood' || bd.style === 'khrush' || bd.jv ? 'roof_tin' : 'roof_tile';
      const b = this.g(ch, tex);
      const rc = bd.jv ? C(bd.jv.roof) : white;
      const along = hw >= hd;
      const rh = Math.min(along ? hd : hw, 7) * (bd.style === 'hansa' ? 1.25 : 0.75);
      if (bd.roof === 'hip') {
        const r = Math.min(hw, hd) * 0.8;
        if (along) {
          const a = P(-hw + r, 0, rh), c = P(hw - r, 0, rh);
          quadUV(b, P(-hw - e, hd + e, 0), P(hw + e, hd + e, 0), c, a, rc);
          quadUV(b, P(hw + e, -hd - e, 0), P(-hw - e, -hd - e, 0), a, c, rc);
          triUV(b, P(hw + e, hd + e, 0), P(hw + e, -hd - e, 0), c, rc);
          triUV(b, P(-hw - e, -hd - e, 0), P(-hw - e, hd + e, 0), a, rc);
        } else {
          const a = P(0, -hd + r, rh), c = P(0, hd - r, rh);
          quadUV(b, P(hw + e, hd + e, 0), P(hw + e, -hd - e, 0), a, c, rc);
          quadUV(b, P(-hw - e, -hd - e, 0), P(-hw - e, hd + e, 0), c, a, rc);
          triUV(b, P(-hw - e, hd + e, 0), P(hw + e, hd + e, 0), c, rc);
          triUV(b, P(hw + e, -hd - e, 0), P(-hw - e, -hd - e, 0), a, rc);
        }
        return;
      }
      const gcol = C('#ffffff');
      const guv = [0.08, 0.08, 0.1, 0.08, 0.09, 0.06];
      if (along) {
        const a = P(-hw - e, 0, rh), c = P(hw + e, 0, rh);
        quadUV(b, P(-hw - e, hd + e, 0), P(hw + e, hd + e, 0), c, a, white);
        quadUV(b, P(hw + e, -hd - e, 0), P(-hw - e, -hd - e, 0), a, c, white);
        fb.triangle(P(hw, hd, 0), P(hw, -hd, 0), P(hw, 0, rh), gcol, MAT.WINDOWS, guv);
        fb.triangle(P(-hw, -hd, 0), P(-hw, hd, 0), P(-hw, 0, rh), gcol, MAT.WINDOWS, guv);
      } else {
        const a = P(0, -hd - e, rh), c = P(0, hd + e, rh);
        quadUV(b, P(hw + e, hd + e, 0), P(hw + e, -hd - e, 0), a, c, white);
        quadUV(b, P(-hw - e, -hd - e, 0), P(-hw - e, hd + e, 0), c, a, white);
        fb.triangle(P(-hw, hd, 0), P(hw, hd, 0), P(0, hd, rh), gcol, MAT.WINDOWS, guv);
        fb.triangle(P(hw, -hd, 0), P(-hw, -hd, 0), P(0, -hd, rh), gcol, MAT.WINDOWS, guv);
      }
    }

    buildTrees() {
      const w = this.w, T = F.Trees;
      this.cells = new Map();
      for (const t of w.trees) {
        const ch = this.chunkAt(t.x, t.z);
        const h = T.treeFar(this.g(ch, 'trees'), t);
        this.grow(ch, t.y, t.y + h);
        this.cellAt(t.x, t.z).trees.push(t);
      }
      for (const f of w.flora || []) {
        const ch = this.chunkAt(f.x, f.z);
        if (f.type === 'bush' && f.kind !== 'ant') {
          T.bushFar(this.g(ch, 'shrubs'), f);
          this.cellAt(f.x, f.z).bushes.push(f);
        } else if (f.type === 'rock' && f.kind === 'stone') this.cellAt(f.x, f.z).small.push(f);
        else T.decor(this.g(ch, 'rocks'), f, w);
        this.grow(ch, f.y - 1, f.y + (f.h || 2) + 1);
      }
    }

    cellAt(x, z) {
      const ix = Math.floor(x / TC), iz = Math.floor(z / TC), key = ix * 4096 + iz;
      let c = this.cells.get(key);
      if (!c) this.cells.set(key, c = { key, ix, iz, x0: ix * TC, z0: iz * TC, size: TC, trees: [], bushes: [], small: [] });
      return c;
    }

    treeTile(c) {
      const b = new Batch(4096), T = F.Trees;
      b.uvw = T.WHITE;
      for (const t of c.trees) T.treeNear(b, t);
      for (const f of c.bushes) T.bushNear(b, f);
      for (const f of c.small) T.decor(b, f, this.w);
      return b;
    }

    groundCol(x, z) {
      const w = this.w, fx = (x - w.b.x0) / 10, fz = (z - w.b.z0) / 10;
      const ix = F.clamp(Math.floor(fx), 0, w.nx - 2), iz = F.clamp(Math.floor(fz), 0, w.nz - 2), tx = F.clamp(fx - ix, 0, 1), tz = F.clamp(fz - iz, 0, 1);
      const at = (gx, gz) => {
        const bc = BIOME_COL[w.biome[gz * w.nx + gx]] || BIOME_COL[2], X = w.b.x0 + gx * 10, Z = w.b.z0 + gz * 10;
        const n = (F.noise2(X / 60, Z / 60, 4) - 0.5) * 0.25 + (F.hash2(Math.round(X), Math.round(Z), 2) - 0.5) * 0.06;
        return [bc[0] * (1 + n), bc[1] * (1 + n), bc[2] * (1 + n * 0.8)];
      };
      const a = at(ix, iz), c = at(ix + 1, iz), d = at(ix, iz + 1), e = at(ix + 1, iz + 1);
      return [0, 1, 2].map(k => (a[k] * (1 - tx) + c[k] * tx) * (1 - tz) + (d[k] * (1 - tx) + e[k] * tx) * tz);
    }

    grassTile(ix, iz, dens) {
      const w = this.w, T = F.Trees, b = new Batch(2048), ref = BIOME_COL[2];
      b.uvw = T.WHITE;
      const step = 1.15 / Math.sqrt(Math.max(0.2, dens)), x0 = ix * GC, z0 = iz * GC;
      for (let z = z0; z < z0 + GC; z += step) {
        for (let x = x0; x < x0 + GC; x += step) {
          const qx = Math.round(x * 8), qz = Math.round(z * 8);
          const px = x + F.hash2(qx, qz, 41) * step, pz = z + F.hash2(qx, qz, 43) * step;
          const v = w.coverAt(px, pz);
          if (!v) continue;
          if (F.hash2(qx, qz, 47) * 16 >= (v & 15)) continue;
          const kind = T.COVER[(v >> 4) - 1], g = this.groundCol(px, pz), soft = SOFT_COVER[kind] || 0;
          const tint = [0, 1, 2].map(k => 255 * F.clamp((g[k] / ref[k]) * (1 - soft) + soft, 0.55, 1.35));
          T.tuft(b, px, w.terrainH(px, pz), pz, kind, 1, tint);
        }
      }
      return b;
    }

    buildRail() {
      const w = this.w;
      const r = w.rail;
      if (!r) return;
      const n = r.pts.length;
      for (let start = 0; start < n - 1; start += 25) {
        const end = Math.min(n - 1, start + 25);
        const pts = r.pts.slice(start, end + 1), ys = r.y.slice(start, end + 1);
        const mid = pts[pts.length >> 1];
        const ch = this.chunkAt(mid[0], mid[1]);
        this.ribbon(ch, 'rail', pts, ys, 2.2, 2.2, 0.05, 4, r.s[start]);
        if (ys.some(y => y > 1.5)) {
          const b = this.g(ch, 'white');
          const steel = C('#5a6a78');
          for (let i = 0; i + 1 < pts.length; i++) {
            if (ys[i] < 1.5 && ys[i + 1] < 1.5) continue;
            const p = pts[i], q = pts[i + 1];
            const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
            const rx = -dz / l * 2.8, rz = dx / l * 2.8;
            for (const s of [-1, 1]) {
              b.beam([p[0] + rx * s, ys[i] + 5, p[1] + rz * s], [q[0] + rx * s, ys[i + 1] + 5, q[1] + rz * s], 0.25, steel, 0);
              b.beam([p[0] + rx * s, ys[i], p[1] + rz * s], [q[0] + rx * s, ys[i + 1] + 5, q[1] + rz * s], 0.18, steel, 0);
            }
            b.quad([p[0] + rx, ys[i] - 0.3, p[1] + rz], [q[0] + rx, ys[i + 1] - 0.3, q[1] + rz], [q[0] - rx, ys[i + 1] - 0.3, q[1] - rz], [p[0] - rx, ys[i] - 0.3, p[1] - rz], C('#6a6a6a'), 0);
            if (i % 5 === 0 && ys[i] > 2.5) b.box(p[0], (ys[i] + F.WATER_Y - 3) / 2, p[1], 1.5, (ys[i] - F.WATER_Y + 3) / 2, 1.5, C('#9a968e'), 0);
          }
        }
      }
    }

    buildAds() {
      const w = this.w, A = F.Ads, hub = w.map.HUB;
      this.tris = [];
      this.adLamps = [];
      const toWorld = (s, q) => { const c = Math.cos(s.yaw), n = Math.sin(s.yaw); return [s.x + c * q[0] - n * q[2], s.y + q[1], s.z + n * q[0] + c * q[2]]; };
      for (const s of w.ads || []) {
        if (s.kind === 'citylight') continue;
        const ch = this.chunkAt(s.x, s.z);
        const far = s.kind === 'bill' || s.kind === 'roof' || s.kind === 'span';
        const st = this.g(ch, far ? 'white' : 'x_white'), fb = this.g(ch, far ? 'adatlas' : 'x_adatlas');
        st.setM(s.x, s.y, s.z, s.yaw); fb.setM(s.x, s.y, s.z, s.yaw);
        const pick = (fmt, k) => A.pick(fmt, s.theme, s.seed + k * 101);
        if (s.kind === 'bill') {
          const ads = [0, 1].map(k => {
            const sg = k ? 1 : -1, nx = -sg * 0.426, nz = -0.905, c = Math.cos(s.yaw), n = Math.sin(s.yaw);
            const wx = c * nx - n * nz, wz = n * nx + c * nz, dh = Math.hypot(hub.x - s.x, hub.z - s.z);
            if (dh < 2600 && dh > 300 && F.hash2(s.seed, k, 41) < (s.theme === 'fest' ? 0.8 : 0.45)) return (hub.x - s.x) * wz - (hub.z - s.z) * wx > 0 ? 'hz_r' : 'hz_l';
            return pick('bb', k);
          });
          for (const l of A.vboard(st, fb, s, ads)) this.adLamps.push(toWorld(s, l));
        } else if (s.kind === 'tri') {
          const ads = [0, 1, 2].map(k => pick('bb', k));
          if (ads[1] === ads[0]) ads[1] = ads[0] === 'cola' ? 'kino' : 'cola';
          if (ads[2] === ads[0] || ads[2] === ads[1]) ads[2] = ads.includes('mobile') ? 'fm' : 'mobile';
          const t = A.trivision(ads);
          this.tris.push({ x: s.x, y: s.y, z: s.z, yaw: s.yaw, batch: t.batch, mesh: null });
          for (const l of t.lamps) this.adLamps.push(toWorld(s, l));
        } else if (s.kind === 'shelter') A.shelter(st, fb, pick('cl', 0));
        else if (s.kind === 'column') A.column(st, fb, [0, 1, 2].map(k => pick('col', k)));
        else if (s.kind === 'span') A.span(st, fb, s, pick('ban', 0));
        else if (s.kind === 'hoard') A.hoarding(st, fb, pick('hoard', 0), pick('hoard', 3));
        else if (s.kind === 'roof') A.roofSign(st, fb, s, pick('roof', 0));
        st.clearM(); fb.clearM();
        this.grow(ch, s.y - 1, s.y + (s.kind === 'roof' ? 8 : 14));
      }
      if (w.festPads) F.Fest.decorate(this);
    }

    buildLandmarks() {
      const w = this.w;
      const rng = F.rng(w.seed + 9);
      for (const lm of w.landmarks) {
        const fn = F.Models.LM[lm.type];
        if (!fn) continue;
        const b = new Batch(1024);
        b.uvw = F.Landmarks.WHITE;
        b.setM(lm.x, lm.y, lm.z, lm.yaw || 0);
        const h = fn(b, rng, lm) || 30;
        b.clearM();
        this.landmarks.push({ type: lm.type, name: lm.name, x: lm.x, z: lm.z, y: lm.y, h, batch: b, src: lm });
      }
    }

    assignProps() {
      for (const p of this.w.props) {
        const ch = this.chunkAt(p.x, p.z);
        ch.props.push(p);
        this.grow(ch, p.y, p.y + 9);
      }
    }

    propBatches(ch) {
      const b = new Batch(512), sg = new Batch(64), ab = new Batch(64), A = F.Ads;
      b.uvw = [0.2, 0.2];
      sg.uvw = F.Street.WHITE_UV;
      const rng = F.rng(ch.ix * 31 + ch.iz * 17);
      for (const p of ch.props) {
        if (p.col_ && p.col_.broken) continue;
        b.setM(p.x, p.y, p.z, p.yaw || 0);
        sg.setM(p.x, p.y, p.z, p.yaw || 0);
        if (p.type === 'citylight') {
          ab.setM(p.x, p.y, p.z, p.yaw || 0);
          A.citylight(b, ab, A.pick('cl', p.theme, p.ad), A.pick('cl', p.theme, p.ad + 7));
          ab.clearM();
        } else F.Models.buildProp(b, p, rng, sg);
        if (p.banner) {
          ab.setM(p.x, p.y, p.z, p.yaw || 0);
          A.flagBrackets(b);
          A.flagPair(ab, A.pick('flag', p.banner.theme, p.banner.k));
          ab.clearM();
        }
        b.clearM();
        sg.clearM();
      }
      ch.dirtyProps = false;
      return { props: b, street: sg, ads: ab };
    }
  }

  F.Scene = Scene;
  F.BIOME_COL = BIOME_COL;
  F.CHUNK = CH;
  F.TILES = { tree: TC, grass: GC };
})(globalThis.Forza = globalThis.Forza || {});
