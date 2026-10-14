(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const M = N.Props.M;
  const TAU = Math.PI * 2;
  const W1 = [255, 255, 255, 255];
  const WHITE = [244, 242, 236, 255];
  const BLUE = [56, 108, 188, 255];
  const YEL = [236, 196, 58, 255];
  const RED = [200, 52, 40, 255];
  const GREEN = [70, 128, 76, 255];
  const IRON = [42, 44, 46, 255];
  const STEEL = [176, 180, 184, 255];
  const JET = [176, 204, 222, 255];
  const CABIN_C = [[200, 56, 42, 255], [232, 194, 58, 255], [42, 104, 200, 255], [58, 154, 90, 255]];

  const lay = n => T(n);
  const col = (c, k) => [Math.min(255, c[0] * k) | 0, Math.min(255, c[1] * k) | 0, Math.min(255, c[2] * k) | 0, 255];

  const tube = (mb, a, b, ra, rb, c, layer, seg, kind) => {
    const n = seg || 6;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const ax = dx / L, ay = dy / L, az = dz / L;
    let px = -az, py = 0, pz = ax;
    if (Math.hypot(px, pz) < 0.2) { px = 1; py = 0; pz = 0; }
    const pl = Math.hypot(px, py, pz);
    px /= pl; py /= pl; pz /= pl;
    const qx = ay * pz - az * py, qy = az * px - ax * pz, qz = ax * py - ay * px;
    mb.ensure((n + 1) * 2, n * 6);
    const base = mb.nv, L8 = layer === undefined ? lay('white') : layer;
    for (let i = 0; i <= n; i++) {
      const t = i / n * TAU, ct = Math.cos(t), st = Math.sin(t);
      const nx = px * ct + qx * st, ny = py * ct + qy * st, nz = pz * ct + qz * st;
      mb.v(a[0] + nx * ra, a[1] + ny * ra, a[2] + nz * ra, nx, ny, nz, i / n, 1, c, L8, kind || 0);
      mb.v(b[0] + nx * rb, b[1] + ny * rb, b[2] + nz * rb, nx, ny, nz, i / n, 0, c, L8, kind || 0);
    }
    for (let i = 0; i < n; i++) { const k = base + i * 2; mb.tri(k, k + 2, k + 3); mb.tri(k, k + 3, k + 1); }
  };

  const sphere = (mb, x, y, z, r, c, layer, kind, seg) => {
    const s = seg || 8, rg = Math.max(3, s >> 1);
    mb.ensure((s + 1) * (rg + 1), s * rg * 6);
    const base = mb.nv;
    for (let j = 0; j <= rg; j++) {
      const t = j / rg * Math.PI, sy = Math.cos(t), sr = Math.sin(t);
      for (let i = 0; i <= s; i++) { const a = i / s * TAU, nx = Math.cos(a) * sr, nz = Math.sin(a) * sr; mb.v(x + nx * r, y + sy * r, z + nz * r, nx, sy, nz, i / s, j / rg, c, layer === undefined ? lay('white') : layer, kind || 0); }
    }
    for (let j = 0; j < rg; j++) for (let i = 0; i < s; i++) { const a = base + j * (s + 1) + i, b = a + s + 1; mb.tri(a, b, a + 1); mb.tri(a + 1, b, b + 1); }
  };

  const shape = (mb, pts, z0, z1, c, back, layer) => {
    const flat = [];
    for (const p of pts) flat.push(p[0], p[1]);
    const ccw = N.polyArea(flat) > 0;
    const P = ccw ? pts : pts.slice().reverse();
    const fl = [];
    for (const p of P) fl.push(p[0], p[1]);
    const tri = N.triangulate(fl);
    const L8 = layer === undefined ? lay('white') : layer;
    for (const [z, nz, cc] of [[z0, -1, c], [z1, 1, back || c]]) {
      mb.ensure(P.length, tri.length);
      const base = mb.nv;
      for (const p of P) mb.v(p[0], p[1], z, 0, 0, nz, 0.5, 0.5, cc, L8, 0);
      for (let i = 0; i < tri.length; i += 3) { if (nz < 0) mb.tri(base + tri[i], base + tri[i + 2], base + tri[i + 1]); else mb.tri(base + tri[i], base + tri[i + 1], base + tri[i + 2]); }
    }
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1;
      mb.quad([a[0], a[1], z0, b[0], b[1], z0, b[0], b[1], z1, a[0], a[1], z1], [ey / L, -ex / L, 0], [0, 0, 1, 0, 1, 1, 0, 1], col(c, 0.8), L8, 0);
    }
  };

  const disc = (mb, x, y, z, r, c, nz, kind, seg) => {
    const s = seg || 14;
    mb.ensure(s + 2, s * 3);
    const base = mb.v(x, y, z, 0, 0, nz, 0.5, 0.5, c, lay('white'), kind || 0);
    for (let i = 0; i <= s; i++) { const a = i / s * TAU; mb.v(x + Math.cos(a) * r, y + Math.sin(a) * r, z, 0, 0, nz, 0.5, 0.5, c, lay('white'), kind || 0); }
    for (let i = 0; i < s; i++) { if (nz < 0) mb.tri(base, base + i + 2, base + i + 1); else mb.tri(base, base + i + 1, base + i + 2); }
  };

  const appendRot = (mb, src, R, tx, ty, tz) => {
    mb.ensure(src.nv, src.ni);
    const base = mb.nv, F = mb.f, I8 = mb.i8, U8 = mb.u8, SF = src.f, SI = src.i8, SU = src.u8;
    for (let i = 0; i < src.nv; i++) {
      const o = i * 8, b = i * 32, d = (base + i) * 8, db = d * 4;
      const x = SF[o], y = SF[o + 1], z = SF[o + 2];
      F[d] = R[0] * x + R[1] * y + R[2] * z + tx; F[d + 1] = R[3] * x + R[4] * y + R[5] * z + ty; F[d + 2] = R[6] * x + R[7] * y + R[8] * z + tz;
      const nx = SI[b + 12], ny = SI[b + 13], nz = SI[b + 14];
      I8[db + 12] = R[0] * nx + R[1] * ny + R[2] * nz; I8[db + 13] = R[3] * nx + R[4] * ny + R[5] * nz; I8[db + 14] = R[6] * nx + R[7] * ny + R[8] * nz; I8[db + 15] = 0;
      F[d + 4] = SF[o + 4]; F[d + 5] = SF[o + 5];
      for (let k = 24; k < 32; k++) U8[db + k] = SU[b + k];
    }
    for (let i = 0; i < src.ni; i++) mb.idx[mb.ni + i] = src.idx[i] + base;
    mb.ni += src.ni;
    mb.nv += src.nv;
  };

  const target = (mb, x, y, z, r) => {
    disc(mb, x, y, z - 0.004, r, [246, 244, 238, 255], -1);
    disc(mb, x, y, z - 0.008, r * 0.66, [206, 36, 30, 255], -1);
    disc(mb, x, y, z - 0.012, r * 0.3, [246, 244, 238, 255], -1);
  };

  const basin = (mb, r, h, seg) => {
    mb.cyl(0, 0, 0, h, r, r, seg, { layer: lay('stucco'), us: 1, vs: 1, c: BLUE });
    mb.cyl(0, 0, h - 0.02, h + 0.1, r + 0.12, r + 0.12, seg, { layer: lay('stucco'), us: 1, vs: 1, c: WHITE });
    mb.cyl(0, 0, h - 0.1, h + 0.1, r - 0.16, r - 0.16, seg, { layer: lay('stucco'), us: 1, vs: 1, c: WHITE });
    const top = { layer: lay('stucco'), c: WHITE };
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      const p = (a, rr) => [Math.cos(a) * rr, Math.sin(a) * rr];
      const [x0, z0] = p(a0, r - 0.16), [x1, z1] = p(a1, r - 0.16), [x2, z2] = p(a1, r + 0.12), [x3, z3] = p(a0, r + 0.12);
      mb.quad([x0, h + 0.1, z0, x3, h + 0.1, z3, x2, h + 0.1, z2, x1, h + 0.1, z1], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], top.c, top.layer, 0);
    }
    mb.cyl(0, 0, h - 0.15, h - 0.12, r - 0.17, r - 0.17, seg, { layer: lay('water'), kind: K.WATER, us: 4, vs: 1, cap: true, capLayer: lay('water'), c: [110, 150, 170, 255] });
  };

  const jetArc = (mb, x0, y0, z0, x1, y1, z1, peak, w) => {
    const n = 7;
    let prev = [x0, y0, z0];
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = y0 + (y1 - y0) * t + peak * 4 * t * (1 - t);
      tube(mb, prev, [x, y, z], w, w * 0.9, JET, lay('white'), 4, K.EMIT);
      prev = [x, y, z];
    }
  };

  const fountain0 = M.fountain;
  M.fountain = (mb, p) => {
    if (p.kind === 'tiers') {
      const r = p.r || 11;
      basin(mb, r, 0.62, 40);
      const st = { layer: lay('stucco'), us: 1, vs: 1, c: WHITE };
      mb.cyl(0, 0, 0.4, 0.75, 1.9, 1.75, 16, st);
      mb.cyl(0, 0, 0.75, 1.0, 1.35, 1.2, 16, Object.assign({ cap: true }, st));
      mb.cyl(0, 0, 1.0, 2.25, 0.5, 0.34, 12, st);
      const bowl = (y, r0, r1, h) => {
        mb.cyl(0, 0, y, y + h, r0, r1, 18, st);
        mb.cyl(0, 0, y + h, y + h + 0.12, r1, r1, 18, st);
        mb.cyl(0, 0, y + h + 0.06, y + h + 0.08, r1 - 0.12, r1 - 0.12, 18, { layer: lay('water'), kind: K.WATER, us: 2, vs: 1, cap: true, capLayer: lay('water'), c: [120, 160, 180, 255] });
      };
      bowl(2.25, 0.4, 2.5, 0.45);
      mb.cyl(0, 0, 2.8, 3.75, 0.26, 0.2, 10, st);
      bowl(3.75, 0.25, 1.55, 0.32);
      mb.cyl(0, 0, 4.2, 4.9, 0.17, 0.13, 8, st);
      bowl(4.9, 0.15, 0.8, 0.22);
      mb.cyl(0, 0, 5.2, 5.75, 0.1, 0.03, 8, st);
      tube(mb, [0, 5.6, 0], [0, 8.4, 0], 0.09, 0.03, JET, lay('white'), 6, K.EMIT);
      for (const [y, rr, drop, n] of [[2.82, 2.55, 2.2, 22], [4.22, 1.6, 1.4, 16], [5.26, 0.85, 1.0, 12]]) for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, c = Math.cos(a), s = Math.sin(a); tube(mb, [c * (rr + 0.04), y, s * (rr + 0.04)], [c * (rr + 0.22), y - drop, s * (rr + 0.22)], 0.022, 0.03, JET, lay('white'), 4, K.EMIT); }
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
        jetArc(mb, c * (r - 0.4), 0.78, s * (r - 0.4), c * (r * 0.42), 0.5, s * (r * 0.42), 3.6, 0.035);
      }
      return;
    }
    if (p.kind === 'cup') {
      const r = p.r || 2.2, k = p.big ? 1.35 : 1;
      basin(mb, r, 0.48, 24);
      const st = { layer: lay('stucco'), us: 1, vs: 1, c: WHITE };
      mb.box(-0.45 * k, 0.3, -0.45 * k, 0.45 * k, 1.05 * k, 0.45 * k, st);
      for (const s of [-1, 1]) {
        mb.box(-0.28 * k, 0.32, s * 0.45 * k - 0.005 * s, 0.28 * k, 0.78 * k, s * 0.45 * k + 0.005 * s, { layer: lay('stucco'), c: BLUE });
        mb.box(s * 0.45 * k - 0.005 * s, 0.32, -0.28 * k, s * 0.45 * k + 0.005 * s, 0.78 * k, 0.28 * k, { layer: lay('stucco'), c: BLUE });
      }
      mb.cyl(0, 0, 1.05 * k, 1.55 * k, 0.12 * k, 0.12 * k, 8, st);
      mb.cyl(0, 0, 1.55 * k, 1.92 * k, 0.14 * k, 0.88 * k, 8, st);
      mb.cyl(0, 0, 1.92 * k, 1.98 * k, 0.88 * k, 0.88 * k, 8, st);
      mb.cyl(0, 0, 1.94 * k, 1.96 * k, 0.8 * k, 0.8 * k, 8, { layer: lay('water'), kind: K.WATER, cap: true, capLayer: lay('water'), c: [120, 160, 180, 255] });
      mb.cyl(0, 0, 1.96 * k, 2.25 * k, 0.32 * k, 0.02, 8, st);
      for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * TAU, c = Math.cos(a), s = Math.sin(a); tube(mb, [c * 0.9 * k, 1.95 * k, s * 0.9 * k], [c * (0.9 * k + 0.25), 0.4, s * (0.9 * k + 0.25)], 0.018, 0.026, JET, lay('white'), 4, K.EMIT); }
      tube(mb, [0, 2.2 * k, 0], [0, 3.3 * k, 0], 0.05, 0.02, JET, lay('white'), 5, K.EMIT);
      return;
    }
    if (p.kind === 'pool') {
      const l = p.l || 28, w = p.w || 5, h = 0.55;
      mb.box(-w / 2, 0, -l / 2, w / 2, h, l / 2, { side: { layer: lay('stucco'), us: 1, vs: 1, c: BLUE }, top: { layer: lay('stucco'), c: WHITE }, noTop: true });
      for (const [x0, z0, x1, z1] of [[-w / 2 - 0.12, -l / 2 - 0.12, w / 2 + 0.12, -l / 2 + 0.16], [-w / 2 - 0.12, l / 2 - 0.16, w / 2 + 0.12, l / 2 + 0.12], [-w / 2 - 0.12, -l / 2, -w / 2 + 0.16, l / 2], [w / 2 - 0.16, -l / 2, w / 2 + 0.12, l / 2]]) mb.box(x0, h - 0.02, z0, x1, h + 0.1, z1, { layer: lay('stucco'), us: 1, vs: 1, c: WHITE });
      mb.flat(-w / 2 + 0.16, -l / 2 + 0.16, w / 2 - 0.16, l / 2 - 0.16, h - 0.12, { layer: lay('water'), kind: K.WATER, us: 4, c: [110, 150, 170, 255] });
      for (let i = 0; i < 9; i++) {
        const z = -l / 2 + 1.8 + i * (l - 3.6) / 8;
        mb.cyl(0, z, h - 0.12, h + 0.12, 0.16, 0.12, 8, { layer: lay('stucco'), c: WHITE, cap: true });
        tube(mb, [0, h + 0.1, z], [0, h + 2.2 + (i % 2) * 0.6, z], 0.06, 0.02, JET, lay('white'), 5, K.EMIT);
      }
      for (let i = 0; i < 12; i++) {
        const z = -l / 2 + 1.2 + i * (l - 2.4) / 11;
        for (const s of [-1, 1]) jetArc(mb, s * (w / 2 - 0.25), h + 0.1, z, s * 0.6, h - 0.1, z, 1.1, 0.025);
      }
      return;
    }
    fountain0(mb, p);
  };

  M.flowerbed = (mb, p) => {
    const r = p.r || 3;
    mb.cyl(0, 0, 0, 0.42, r, r, 16, { layer: lay('granite'), us: 2, vs: 1, cap: true, capLayer: lay('flowers') });
  };

  M.parkstatue = mb => {
    mb.box(-0.75, 0, -0.75, 0.75, 0.35, 0.75, { layer: lay('stucco'), us: 1, vs: 1, c: [226, 224, 216, 255] });
    mb.box(-0.55, 0.35, -0.55, 0.55, 1.75, 0.55, { layer: lay('stucco'), us: 1, vs: 1, c: WHITE });
    mb.box(-0.65, 1.7, -0.65, 0.65, 1.85, 0.65, { layer: lay('stucco'), us: 1, vs: 1, c: [236, 234, 226, 255] });
    if (N.Landmarks && N.Landmarks.statue) mb.append(N.Landmarks.statue(1), 0, 1.85, 0, 0, 1.1);
  };

  M.posterstand = mb => {
    const wood = { layer: lay('plank'), us: 1, vs: 1, c: [120, 84, 52, 255] };
    for (const x of [-1.05, 1.05]) mb.box(x - 0.06, 0, -0.06, x + 0.06, 2.65, 0.06, wood);
    mb.box(-1.12, 0.62, 0.02, 1.12, 2.62, 0.1, { layer: lay('plank'), us: 1, vs: 1, c: [96, 66, 42, 255] });
    mb.box(-1.2, 2.62, -0.2, 1.2, 2.72, 0.16, wood);
  };

  M.infoboard = mb => {
    const y = [214, 170, 56, 255];
    for (const x of [-1.15, 1.15]) mb.box(x - 0.08, 0, -0.08, x + 0.08, 2.35, 0.08, { layer: lay('boards'), us: 0.5, vs: 2, c: y });
    mb.box(-1.25, 0.8, 0.0, 1.25, 2.3, 0.1, { layer: lay('boards'), us: 0.5, vs: 1, c: y });
    mb.box(-1.35, 2.3, -0.12, 1.35, 2.42, 0.18, { layer: lay('stucco'), c: WHITE });
  };

  M.dancefloor = (mb, p) => {
    const r = p.r || 9.4, door = p.door || 0, n = 26;
    mb.cyl(0, 0, -0.1, 0.06, r - 0.05, r - 0.05, 32, { layer: lay('deck'), us: 2, vs: 1, c: [196, 170, 132, 255], cap: true, capLayer: lay('deck') });
    const lat = { layer: lay('railing'), kind: K.DECAL, us: 0.7, vs: 1, v0: 0, c: [74, 120, 82, 255] };
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, am = (a0 + a1) / 2;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r, x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      tube(mb, [x0, 0, z0], [x0, 2.45, z0], 0.06, 0.06, [60, 100, 70, 255], lay('white'), 5);
      sphere(mb, x0, 2.55, z0, 0.1, k % 3 === 0 ? [230, 70, 60, 255] : k % 3 === 1 ? [240, 210, 70, 255] : [80, 150, 230, 255], lay('white'), K.NIGHT, 6);
      if (Math.abs(N.wrap(am - door)) < 0.2 || Math.abs(N.wrap(am + Math.PI / 2)) < 0.42) continue;
      mb.wall(x1, z1, x0, z0, 0.1, 2.3, lat);
      mb.wall(x0, z0, x1, z1, 0.1, 2.3, lat);
      tube(mb, [x0, 2.3, z0], [x1, 2.3, z1], 0.035, 0.035, [60, 100, 70, 255], lay('white'), 4);
    }
    const sz = -r + 2.2;
    mb.box(-4.2, 0, sz - 2.2, 4.2, 0.9, sz + 2.0, { side: { layer: lay('stucco'), us: 2, vs: 1, c: WHITE }, top: { layer: lay('deck'), us: 2 } });
    const seg = 12;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg;
      const p0 = [-Math.cos(a0) * 4.4, Math.sin(a0) * 5.2], p1 = [-Math.cos(a1) * 4.4, Math.sin(a1) * 5.2];
      for (const [sgn, zz] of [[1, sz - 2.25], [-1, sz - 2.15]]) mb.quad([p0[0], 0.9 + p0[1] * (sgn > 0 ? 1 : 0.98), zz, p1[0], 0.9 + p1[1] * (sgn > 0 ? 1 : 0.98), zz, p1[0] * 0.55, 0.9 + p1[1] * 0.75, sz - 0.2, p0[0] * 0.55, 0.9 + p0[1] * 0.75, sz - 0.2], [0, 0.2 * sgn, 1 * sgn], [0, 0, 1, 0, 1, 1, 0, 1], sgn > 0 ? WHITE : [210, 214, 222, 255], lay('stucco'), 0);
    }
    for (const s of [-1, 1]) {
      tube(mb, [s * 5.2, 0, sz], [s * 5.2, 4.4, sz], 0.06, 0.05, IRON, lay('darkmetal'), 5);
      mb.box(s * 5.2 - 0.35, 3.9, sz - 0.3, s * 5.2 + 0.35, 4.7, sz + 0.25, { layer: lay('darkmetal'), c: [28, 28, 30, 255] });
    }
    const top = [0, 5.6, sz - 1.6];
    for (let k = 0; k < 5; k++) {
      const a = Math.PI * (0.18 + k * 0.16), end = [Math.cos(a) * (r - 0.1), 2.5, Math.sin(a) * (r - 0.1)];
      tube(mb, top, end, 0.012, 0.012, IRON, lay('darkmetal'), 3);
      for (let i = 1; i < 7; i++) {
        const t = i / 7, x = N.lerp(top[0], end[0], t), z = N.lerp(top[2], end[2], t), y = N.lerp(top[1], end[1], t) - Math.sin(Math.PI * t) * 0.35;
        sphere(mb, x, y - 0.06, z, 0.07, (i + k) % 3 === 0 ? [250, 220, 140, 255] : (i + k) % 3 === 1 ? [240, 110, 110, 255] : [130, 200, 250, 255], lay('white'), K.NIGHT, 5);
      }
    }
  };

  M.pkoarch = mb => {
    const st = { layer: lay('stucco'), us: 1, vs: 1, c: WHITE };
    for (const s of [-1, 1]) {
      const x = s * 2.55;
      mb.box(x - 0.45, 0, -0.45, x + 0.45, 0.35, 0.45, { layer: lay('stucco'), c: [44, 44, 46, 255] });
      mb.box(x - 0.42, 0.35, -0.42, x + 0.42, 2.45, 0.42, st);
      mb.box(x - 0.5, 2.45, -0.5, x + 0.5, 2.62, 0.5, st);
      mb.cyl(x, 0, 2.62, 2.78, 0.16, 0.12, 10, st);
      mb.cyl(x, 0, 2.78, 3.25, 0.12, 0.42, 10, Object.assign({ cap: true, capLayer: lay('flowers') }, st));
      for (const s2 of [-1, 1]) {
        const x0 = s * 3.0, x1 = s * 6.2;
        mb.box(Math.min(x0, x1), 0, -0.22, Math.max(x0, x1), 0.3, 0.22, { layer: lay('stucco'), c: [44, 44, 46, 255] });
        mb.box(Math.min(x0, x1), 0.3, -0.18, Math.max(x0, x1), 2.05, 0.18, st);
        mb.box(Math.min(x0, x1) - 0.04, 2.05, -0.24, Math.max(x0, x1) + 0.04, 2.15, 0.24, st);
        if (s2 > 0) for (const xx of [s * 4.6]) mb.box(xx - 0.62, 0.7, -0.19, xx + 0.62, 1.75, -0.18, { layer: lay('stucco'), c: [226, 224, 216, 255] });
      }
      mb.box(s * 6.2 - 0.32, 0, -0.32, s * 6.2 + 0.32, 2.4, 0.32, st);
      mb.cyl(s * 6.2, 0, 2.4, 2.85, 0.1, 0.34, 10, Object.assign({ cap: true, capLayer: lay('flowers') }, st));
    }
    const seg = 14, rr = 2.4, cy = 2.62;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg;
      for (const k of [1, 0.9]) tube(mb, [-Math.cos(a0) * rr * k, cy + Math.sin(a0) * rr * k, 0], [-Math.cos(a1) * rr * k, cy + Math.sin(a1) * rr * k, 0], 0.035, 0.035, IRON, lay('darkmetal'), 4);
    }
    for (let i = 1; i < 9; i++) { const a = Math.PI * i / 9; tube(mb, [0, cy + 0.3, 0], [-Math.cos(a) * rr * 0.9, cy + Math.sin(a) * rr * 0.9, 0], 0.02, 0.02, IRON, lay('darkmetal'), 3); }
    sphere(mb, 0, cy + 0.3, 0, 0.12, IRON, lay('darkmetal'), 0, 6);
    const glyph = (cx, cy0, segs) => { for (const [x0, y0, x1, y1] of segs) tube(mb, [cx + x0, cy0 + y0, -0.02], [cx + x1, cy0 + y1, -0.02], 0.045, 0.045, [236, 234, 228, 255], lay('white'), 4); };
    glyph(-1.15, cy + 1.75, [[-0.24, -0.32, -0.24, 0.32], [-0.24, 0.32, 0.24, 0.32], [0.24, 0.32, 0.24, -0.32]]);
    glyph(0, cy + 2.15, [[-0.22, -0.32, -0.22, 0.32], [-0.22, 0, 0.22, 0.32], [-0.22, 0, 0.22, -0.32]]);
    const o = [];
    for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU, a1 = (i + 1) / 12 * TAU; o.push([Math.cos(a0) * 0.24, Math.sin(a0) * 0.32, Math.cos(a1) * 0.24, Math.sin(a1) * 0.32]); }
    glyph(1.15, cy + 1.75, o);
    const gate = { layer: lay('metalfence'), kind: K.DECAL, us: 1.2, vs: 2.1, v0: 0, c: [40, 40, 42, 255] };
    for (const s of [-1, 1]) {
      const hx = s * 2.1, ex = hx - s * Math.cos(1.2) * 2.0, ez = -0.2 - Math.sin(1.2) * 2.0;
      mb.wall(hx, -0.2, ex, ez, 0, 2.1, gate);
      mb.wall(ex, ez, hx, -0.2, 0, 2.1, gate);
    }
  };

  M.attrgate = mb => {
    for (const s of [-1, 1]) {
      const x = s * 3.15;
      for (let k = 0; k < 11; k++) mb.cyl(x, 0, k * 0.55, (k + 1) * 0.55, 0.3, 0.3, 10, { layer: lay('white'), c: k % 2 ? [244, 240, 232, 255] : [210, 44, 38, 255] });
      mb.cyl(x, 0, 6.05, 6.5, 0.36, 0.05, 10, { layer: lay('white'), c: [236, 196, 58, 255] });
      sphere(mb, x, 6.55, 0, 0.14, YEL, lay('white'), 0, 6);
    }
    mb.box(-3.6, 4.6, -0.12, 3.6, 5.75, 0.12, { layer: lay('boards'), us: 1, vs: 1, c: [62, 110, 70, 255] });
    mb.box(-3.75, 5.75, -0.18, 3.75, 5.9, 0.18, { layer: lay('stucco'), c: YEL });
    mb.box(-3.75, 4.45, -0.18, 3.75, 4.6, 0.18, { layer: lay('stucco'), c: YEL });
    const flags = [[210, 44, 38, 255], [236, 196, 58, 255], [42, 104, 200, 255], [58, 154, 90, 255]];
    for (let k = 0; k < 12; k++) {
      const x = -3.3 + k * 0.6, c = flags[k % 4];
      mb.quad([x - 0.2, 5.9, 0, x + 0.2, 5.9, 0, x, 5.45, 0, x, 5.45, 0], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('white'), 0);
      mb.quad([x + 0.2, 5.9, 0.01, x - 0.2, 5.9, 0.01, x, 5.45, 0.01, x, 5.45, 0.01], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('white'), 0);
    }
  };

  M.ferrisbase = (mb, p) => {
    const hub = p.hub || 16.25;
    const conc = { layer: lay('concrete'), us: 2, vs: 1, c: [196, 192, 184, 255] };
    mb.box(-3.4, 0, -2.6, 3.4, 0.6, 2.6, { side: conc, top: { layer: lay('plaza'), us: 3, c: [206, 202, 194, 255] } });
    mb.box(-3.45, 0.55, -2.65, 3.45, 0.62, 2.65, { layer: lay('white'), c: YEL, noTop: true });
    for (let k = 0; k < 3; k++) mb.box(-2.2, 0, 2.6 + k * 0.5, 2.2, 0.6 - (k + 1) * 0.15, 2.6 + (k + 1) * 0.5, { layer: lay('concrete'), us: 1, vs: 1, c: [186, 182, 174, 255] });
    const legC = [52, 96, 188, 255];
    for (const z of [-1.85, 1.85]) {
      for (const x of [-7.2, 7.2]) {
        tube(mb, [x, 0, z * 1.05], [0, hub, z], 0.32, 0.22, legC, lay('white'), 8);
        mb.box(x - 0.7, 0, z * 1.05 - 0.7, x + 0.7, 0.35, z * 1.05 + 0.7, conc);
      }
      for (const [y, k] of [[4.5, 0.72], [9.2, 0.43]]) tube(mb, [-7.2 * k, y, z * (1.02)], [7.2 * k, y, z * 1.02], 0.14, 0.14, legC, lay('white'), 6);
      tube(mb, [-7.2 * 0.72, 4.5, z * 1.02], [7.2 * 0.43, 9.2, z * 1.02], 0.1, 0.1, legC, lay('white'), 5);
      tube(mb, [7.2 * 0.72, 4.5, z * 1.02], [-7.2 * 0.43, 9.2, z * 1.02], 0.1, 0.1, legC, lay('white'), 5);
      mb.cyl(0, z, hub - 0.55, hub + 0.55, 0.5, 0.5, 10, { layer: lay('darkmetal'), c: [80, 84, 92, 255] });
    }
    tube(mb, [0, hub, -2.2], [0, hub, 2.2], 0.32, 0.32, [90, 94, 100, 255], lay('darkmetal'), 10);
    const fenceC = [232, 190, 40, 255];
    const rail = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2));
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; tube(mb, [x, 0, z], [x, 1.02, z], 0.035, 0.035, fenceC, lay('white'), 5); }
      for (const y of [0.5, 1.0]) tube(mb, [x0, y, z0], [x1, y, z1], 0.03, 0.03, fenceC, lay('white'), 4);
    };
    rail(-9, -3.2, 9, -3.2);
    rail(-9, -3.2, -9, 3.2);
    rail(9, -3.2, 9, 3.2);
    rail(-9, 3.2, -2.6, 3.2);
    rail(2.6, 3.2, 9, 3.2);
    const bx = -6.2, bz = 4.4;
    mb.box(bx - 1.1, 0, bz - 1.1, bx + 1.1, 2.3, bz + 1.1, { side: { layer: lay('booth'), us: 2.2, vs: 2.3, c: [232, 228, 214, 255] }, top: { layer: lay('stucco'), c: WHITE } });
    const roofC = [62, 140, 96, 255];
    for (const [a, b, c, n] of [[[-1.35, 2.3, -1.35], [1.35, 2.3, -1.35], [0, 3.35, 0], [0, 0.6, -0.8]], [[1.35, 2.3, -1.35], [1.35, 2.3, 1.35], [0, 3.35, 0], [0.8, 0.6, 0]], [[1.35, 2.3, 1.35], [-1.35, 2.3, 1.35], [0, 3.35, 0], [0, 0.6, 0.8]], [[-1.35, 2.3, 1.35], [-1.35, 2.3, -1.35], [0, 3.35, 0], [-0.8, 0.6, 0]]]) {
      mb.quad([bx + a[0], a[1], bz + a[2], bx + b[0], b[1], bz + b[2], bx + c[0], c[1], bz + c[2], bx + c[0], c[1], bz + c[2]], n, [0, 1, 1, 1, 0.5, 0, 0.5, 0], roofC, lay('roofmetal'), 0);
    }
    mb.box(bx - 0.7, 1.0, bz + 1.105, bx + 0.7, 1.9, bz + 1.12, { layer: lay('glass'), kind: K.FACADE, us: 1.4, vs: 0.9 });
  };

  M.autodrom = (mb, p) => {
    const hl = p.hl || 10, hw = p.hw || 8, H = 4.3;
    mb.box(-hw + 0.4, -0.1, -hl + 0.4, hw - 0.4, 0.12, hl - 0.4, { side: { layer: lay('darkmetal'), c: [70, 72, 76, 255] }, top: { layer: lay('metal'), us: 2, c: [120, 124, 130, 255] } });
    const tyre = { layer: lay('tire'), us: 1, vs: 1, c: [40, 40, 40, 255] };
    for (const side of [-1, 1]) {
      mb.box(-hw + 0.3, 0, side * (hl - 0.6) - 0.3, hw - 0.3, 0.6, side * (hl - 0.6) + 0.3, tyre);
      for (const [a, b] of [[-hl + 0.6, -2], [2, hl - 0.6]]) mb.box(side * (hw - 0.6) - 0.3, 0, a, side * (hw - 0.6) + 0.3, 0.6, b, tyre);
    }
    for (const [x, z] of [[-hw, -hl], [hw, -hl], [-hw, hl], [hw, hl]]) for (let k = 0; k < 8; k++) mb.box(x - 0.16, k * 0.55, z - 0.16, x + 0.16, (k + 1) * 0.55, z + 0.16, { layer: lay('white'), c: k % 2 ? WHITE : RED });
    mb.box(-hw - 0.4, H, -hl - 0.4, hw + 0.4, H + 0.5, hl + 0.4, { side: { layer: lay('stucco'), us: 2, vs: 1, c: [64, 112, 190, 255] }, top: { layer: lay('roofmetal'), us: 3, c: [190, 196, 200, 255] } });
    mb.flat(-hw - 0.4, -hl - 0.4, hw + 0.4, hl + 0.4, H - 0.01, { layer: lay('metalfence'), us: 1.5, c: [110, 112, 116, 255], down: true });
    for (let k = 0; k < 28; k++) {
      const t = k / 28;
      const x = -hw - 0.4 + (2 * hw + 0.8) * t;
      for (const z of [-hl - 0.42, hl + 0.42]) mb.quad([x, H, z, x + (2 * hw + 0.8) / 28, H, z, x + (2 * hw + 0.8) / 56, H - 0.45, z, x + (2 * hw + 0.8) / 56, H - 0.45, z], [0, 0, Math.sign(z)], [0, 0, 1, 0, 1, 1, 0, 1], k % 2 ? YEL : RED, lay('white'), 0);
    }
  };

  M.swings = (mb, p) => {
    const r = p.r || 8.4, fr = r + 1.2;
    mb.cyl(0, 0, 0, 0.35, 2.2, 2.2, 16, { layer: lay('concrete'), us: 2, vs: 1, c: [190, 186, 178, 255], cap: true });
    mb.cyl(0, 0, 0.35, 7.6, 0.5, 0.42, 12, { layer: lay('white'), c: [52, 100, 180, 255] });
    ringFence(mb, fr, Math.max(12, Math.round(fr * 2.2)));
  };

  M.waltz = (mb, p) => {
    const r = p.r || 6.4, fr = r + 1.2;
    mb.cyl(0, 0, 0, 0.3, r + 0.3, r + 0.3, 24, { layer: lay('concrete'), us: 2, vs: 1, c: [186, 182, 176, 255], cap: true });
    ringFence(mb, fr, Math.max(12, Math.round(fr * 2.2)));
  };

  const carousel0 = M.carousel;
  M.carousel = (mb, p) => {
    if (!p.r) { carousel0(mb, p); return; }
    const r = p.r, fr = r + 1.2;
    mb.cyl(0, 0, 0, 0.3, r + 0.2, r + 0.2, 24, { layer: lay('concrete'), us: 2, vs: 1, c: [186, 182, 176, 255], cap: true });
    ringFence(mb, fr, Math.max(12, Math.round(fr * 2.2)));
  };

  function ringFence(mb, fr, n) {
    const c = [236, 196, 58, 255];
    for (let k = 1; k < n; k++) {
      const a0 = k / n * TAU, a1 = (k + 1) / n * TAU;
      const x0 = Math.cos(a0) * fr, z0 = Math.sin(a0) * fr, x1 = Math.cos(a1) * fr, z1 = Math.sin(a1) * fr;
      tube(mb, [x0, 0, z0], [x0, 1.0, z0], 0.03, 0.03, c, lay('white'), 4);
      for (const y of [0.5, 0.98]) tube(mb, [x0, y, z0], [x1, y, z1], 0.025, 0.025, c, lay('white'), 4);
    }
    tube(mb, [fr, 0, 0], [fr, 1.0, 0], 0.03, 0.03, c, lay('white'), 4);
  }

  M.tir = (mb, p) => {
    const w = p.w || 8, D = p.d || 6.6, hw = w / 2, H = 3.4;
    const out = { layer: lay('boards'), us: 0.5, vs: 1.5, c: [96, 150, 104, 255] };
    const inn = { layer: lay('boards'), us: 0.5, vs: 1.5, c: [52, 70, 96, 255] };
    for (const s of [-1, 1]) {
      mb.wall(s * hw, s > 0 ? D : 0, s * hw, s > 0 ? 0 : D, 0, H, out);
      mb.wall(s * (hw - 0.12), s > 0 ? 0 : D, s * (hw - 0.12), s > 0 ? D : 0, 0, H, inn);
    }
    mb.wall(-hw, D, hw, D, 0, H, out);
    mb.wall(hw, D - 0.12, -hw, D - 0.12, 0, H, inn);
    mb.box(-hw - 0.3, H, -1.2, hw + 0.3, H + 0.22, D + 0.3, { side: { layer: lay('boards'), us: 1, vs: 0.5, c: [190, 60, 48, 255] }, top: { layer: lay('roofmetal'), us: 3, c: [150, 150, 150, 255] } });
    mb.flat(-hw - 0.3, -1.2, hw + 0.3, D + 0.3, H - 0.005, { layer: lay('plank'), us: 1.5, c: [70, 60, 50, 255], down: true });
    mb.box(-hw, 2.55, -0.02, hw, H, 0.1, { side: { layer: lay('boards'), us: 0.5, vs: 1, c: [236, 220, 170, 255] }, top: { layer: lay('boards'), c: [236, 220, 170, 255] } });
    for (const s of [-1, 1]) mb.box(s * hw - 0.12, 0, -0.02, s * hw + 0.12, 2.6, 0.12, { layer: lay('boards'), us: 0.5, vs: 1, c: [236, 220, 170, 255] });
    mb.box(-hw + 0.3, 0, 0.05, hw - 0.3, 1.0, 0.55, { side: { layer: lay('boards'), us: 0.5, vs: 1, c: [150, 92, 54, 255] }, top: { layer: lay('plank'), us: 1, c: [170, 120, 74, 255] } });
    mb.box(-hw + 0.25, 1.0, -0.05, hw - 0.25, 1.06, 0.62, { layer: lay('plank'), us: 1, c: [128, 84, 50, 255] });
    mb.flat(-hw + 0.12, 0.55, hw - 0.12, D - 0.12, 0.02, { layer: lay('plank'), us: 2, c: [92, 74, 58, 255] });
    const sky = [120, 170, 214, 255], hill = [96, 150, 84, 255], far = [70, 118, 70, 255];
    mb.quad([-hw + 0.13, 1.85, D - 0.14, hw - 0.13, 1.85, D - 0.14, hw - 0.13, H - 0.05, D - 0.14, -hw + 0.13, H - 0.05, D - 0.14], [0, 0, -1], [0, 1, 1, 1, 1, 0, 0, 0], sky, lay('white'), 0);
    mb.quad([-hw + 0.13, 0.3, D - 0.14, hw - 0.13, 0.3, D - 0.14, hw - 0.13, 1.85, D - 0.14, -hw + 0.13, 1.85, D - 0.14], [0, 0, -1], [0, 1, 1, 1, 1, 0, 0, 0], hill, lay('white'), 0);
    for (let i = 0; i < 9; i++) {
      const x = -hw + 0.6 + i * (w - 1.2) / 8, h = 0.5 + (i % 3) * 0.2;
      mb.quad([x - 0.35, 1.85, D - 0.145, x + 0.35, 1.85, D - 0.145, x, 1.85 + h, D - 0.145, x, 1.85 + h, D - 0.145], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], far, lay('white'), 0);
    }
    disc(mb, hw - 1.1, 2.85, D - 0.145, 0.32, [250, 236, 150, 255], -1);
    mb.box(-hw + 0.13, 2.18, D - 0.5, hw - 0.13, 2.24, D - 0.14, { layer: lay('darkmetal'), c: [60, 60, 64, 255] });
    mb.box(-hw + 0.13, 1.42, D - 0.45, hw - 0.13, 1.47, D - 0.14, { layer: lay('darkmetal'), c: [60, 60, 64, 255] });
    mb.box(-hw + 0.13, 0.82, D - 0.45, hw - 0.13, 0.87, D - 0.14, { layer: lay('darkmetal'), c: [60, 60, 64, 255] });
    for (const s of [-1, 1]) mb.box(s * (hw - 0.5) - 0.32, 2.05, D - 0.6, s * (hw - 0.5) + 0.32, 2.6, D - 0.14, { layer: lay('darkmetal'), c: [44, 46, 52, 255] });
    for (let i = 0; i < 5; i++) {
      const x = -hw + 1 + i * (w - 2) / 4;
      mb.box(x - 0.12, H - 0.35, 0.8, x + 0.12, H - 0.25, 1.0, { layer: lay('darkmetal'), c: [40, 40, 40, 255] });
      sphere(mb, x, H - 0.45, 0.9, 0.09, [255, 240, 200, 255], lay('lampglow'), K.EMIT, 6);
    }
    const toyC = [[200, 120, 60, 255], [230, 210, 90, 255], [240, 150, 180, 255], [140, 190, 240, 255]];
    for (let i = 0; i < 4; i++) {
      const x = -hw + 0.55, z = 1.6 + i * 0.9;
      mb.box(x - 0.3, 1.6, z - 0.4, x + 0.3, 1.66, z + 0.4, { layer: lay('plank'), c: [120, 84, 52, 255] });
      sphere(mb, x, 1.86, z, 0.2, toyC[i], lay('white'), 0, 8);
      sphere(mb, x, 2.14, z, 0.13, toyC[i], lay('white'), 0, 8);
      sphere(mb, x - 0.07, 2.25, z - 0.08, 0.05, toyC[i], lay('white'), 0, 5);
      sphere(mb, x - 0.07, 2.25, z + 0.08, 0.05, toyC[i], lay('white'), 0, 5);
    }
    if (N.Models && N.Models.weapon) {
      const gun = N.Models.weapon('izh38');
      for (const x of [-2.3, 2.5]) {
        appendRot(mb, gun, [0, -1, 0, -1, 0, 0, 0, 0, -1], x, 1.085, 0.32);
        tube(mb, [x - 0.04, 1.07, 0.1], [x - 0.3, 1.06, 0.04], 0.008, 0.008, STEEL, lay('metal'), 3);
      }
    }
    mb.box(hw + 0.02, 1.3, 1.0, hw + 0.08, 2.4, 3.2, { layer: lay('boards'), c: [30, 30, 30, 255] });
  };

  M.shawarma = mb => {
    const hw = 1.6, hl = 1.35, H = 2.55, f = -hl;
    const wall = { layer: lay('booth'), us: 1, vs: 1, c: [236, 230, 214, 255] };
    const inner = { layer: lay('stucco'), us: 1, vs: 1, c: [214, 206, 190, 255] };
    mb.wall(-hw, hl, hw, hl, 0, H, wall);
    mb.wall(hw, hl - 0.06, -hw, hl - 0.06, 0, H, inner);
    for (const s of [-1, 1]) {
      mb.wall(s * hw, s > 0 ? hl : f, s * hw, s > 0 ? f : hl, 0, H, wall);
      mb.wall(s * (hw - 0.06), s > 0 ? f : hl, s * (hw - 0.06), s > 0 ? hl : f, 0, H, inner);
      mb.box(s * hw - (s > 0 ? 0.42 : 0), 0.95, f, s * hw + (s < 0 ? 0.42 : 0), 2.2, f + 0.08, wall);
    }
    mb.box(-hw, 0, f, hw, 0.95, f + 0.1, wall);
    mb.box(-hw, 2.2, f, hw, H, f + 0.1, wall);
    mb.flat(-hw, f, hw, hl, 0.02, { layer: lay('lino'), us: 1, c: [150, 120, 90, 255] });
    mb.box(-hw, 0.26, f - 0.01, hw, 0.42, f + 0.01, { layer: lay('white'), c: [200, 40, 34, 255] });
    mb.box(-hw - 0.05, 0.92, f - 0.25, hw + 0.05, 0.99, f + 0.35, { layer: lay('metal'), us: 1, c: [196, 198, 200, 255] });
    mb.box(-hw - 0.1, H, f - 0.1, hw + 0.1, H + 0.18, hl + 0.1, { side: { layer: lay('metal'), c: [180, 40, 34, 255] }, top: { layer: lay('roofmetal'), us: 2 } });
    for (let k = 0; k < 8; k++) {
      const x0 = -hw - 0.05 + k * (2 * hw + 0.1) / 8, x1 = x0 + (2 * hw + 0.1) / 8, c = k % 2 ? [244, 240, 232, 255] : [200, 40, 34, 255];
      mb.quad([x0, 2.3, f - 0.95, x1, 2.3, f - 0.95, x1, 2.6, f + 0.02, x0, 2.6, f + 0.02], [0, 0.95, -0.3], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('fabric'), 0);
      mb.quad([x0, 2.1, f - 0.96, x1, 2.1, f - 0.96, x1, 2.3, f - 0.96, x0, 2.3, f - 0.96], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('fabric'), 0);
    }
    mb.flat(-hw + 0.06, f + 0.1, hw - 0.06, hl - 0.06, 2.5, { layer: lay('lampglow'), kind: K.EMIT, c: [255, 236, 200, 255], down: true });
    mb.box(0.5, 0.95, f + 0.55, 1.25, 1.85, f + 1.15, { layer: lay('metal'), us: 1, c: [200, 202, 206, 255] });
    mb.box(0.58, 1.05, f + 0.52, 1.17, 1.75, f + 0.55, { layer: lay('white'), kind: K.EMIT, c: [255, 130, 50, 255] });
    mb.cyl(0.88, f + 0.85, 1.0, 1.85, 0.2, 0.12, 10, { layer: lay('white'), c: [150, 92, 48, 255], cap: true });
    tube(mb, [0.88, 0.95, f + 0.85], [0.88, 2.0, f + 0.85], 0.015, 0.015, STEEL, lay('metal'), 4);
    mb.box(-1.45, 0.95, f + 0.4, -0.35, 1.0, f + 0.95, { layer: lay('white'), c: [230, 226, 214, 255] });
    for (let k = 0; k < 3; k++) mb.cyl(-1.25 + k * 0.32, f + 0.65, 1.0, 1.07, 0.12, 0.12, 8, { layer: lay('white'), c: [[220, 190, 120, 255], [120, 160, 60, 255], [200, 60, 40, 255]][k], cap: true });
    mb.box(-hw + 0.1, 0, f + 1.2, hw - 0.1, 0.95, f + 1.6, { layer: lay('metal'), us: 1, c: [170, 172, 176, 255] });
    mb.cyl(hw + 0.35, 0.6, 0, 0.95, 0.17, 0.17, 10, { layer: lay('metal'), c: [200, 40, 34, 255], cap: true });
    mb.box(-hw - 0.5, 0, 0.3, -hw - 0.05, 0.36, 0.9, { layer: lay('plank'), us: 0.5, vs: 0.5, c: [214, 176, 120, 255] });
    for (let k = 0; k < 6; k++) mb.cyl(-hw - 0.42 + (k % 3) * 0.14, 0.42 + Math.floor(k / 3) * 0.24, 0.36, 0.62, 0.05, 0.05, 6, { layer: lay('white'), c: [70, 110, 60, 255], cap: true });
  };

  M.cafetable = (mb, p) => {
    const um = [[[42, 92, 170, 255], [240, 240, 236, 255]], [[200, 40, 34, 255], [240, 240, 236, 255]], [[58, 130, 80, 255], [236, 196, 58, 255]]][p.tone || 0];
    const pl = { layer: lay('white'), c: [236, 236, 232, 255] };
    mb.cyl(0, 0, 0.7, 0.74, 0.45, 0.45, 12, Object.assign({ cap: true }, pl));
    tube(mb, [0, 0, 0], [0, 0.72, 0], 0.03, 0.03, pl.c, lay('white'), 5);
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + 0.4, x = Math.cos(a) * 0.75, z = Math.sin(a) * 0.75;
      mb.box(x - 0.22, 0.42, z - 0.22, x + 0.22, 0.46, z + 0.22, pl);
      const bx = Math.cos(a) * 0.98, bz = Math.sin(a) * 0.98;
      tube(mb, [bx, 0.44, bz], [bx * 1.04, 0.86, bz * 1.04], 0.12, 0.12, pl.c, lay('white'), 4);
      for (const s of [-1, 1]) tube(mb, [x + Math.sin(a) * s * 0.18, 0, z - Math.cos(a) * s * 0.18], [x + Math.sin(a) * s * 0.18, 0.43, z - Math.cos(a) * s * 0.18], 0.02, 0.02, pl.c, lay('white'), 3);
    }
    tube(mb, [0, 0.74, 0], [0, 2.3, 0], 0.025, 0.025, STEEL, lay('metal'), 4);
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU;
      mb.quad([0, 2.45, 0, Math.cos(a0) * 1.3, 2.1, Math.sin(a0) * 1.3, Math.cos(a1) * 1.3, 2.1, Math.sin(a1) * 1.3, 0, 2.45, 0], [0, 1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], um[k % 2], lay('fabric'), 0);
      mb.quad([0, 2.44, 0, Math.cos(a1) * 1.3, 2.09, Math.sin(a1) * 1.3, Math.cos(a0) * 1.3, 2.09, Math.sin(a0) * 1.3, 0, 2.44, 0], [0, -1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], col(um[k % 2], 0.7), lay('fabric'), 0);
    }
  };

  N.EXTRA_SIGNS.push({ style: 'shop', text: 'КАССА', w: 3.0, h: 0.54 });

  N.Landmarks.L.rodina = (geo, mb, b) => {
    const L = b.lm, ax = L.ax, az = L.az, rx = az, rz = -ax, hl = L.hl, hw = L.hw;
    const P = (u, v) => [L.cx + ax * u + rx * v, L.cz + az * u + rz * v];
    const wallC = [226, 210, 156, 255], trim = [246, 244, 236, 255], roofC = [118, 140, 132, 255], dark = [64, 74, 70, 255];
    const W = (u0, v0, u1, v1, y0, y1, o) => { const a = P(u0, v0), c = P(u1, v1); mb.wall(a[0], a[1], c[0], c[1], y0, y1, o); };
    const Q = (pts, n, c, layer, kind) => { const q = []; for (const [u, v, y] of pts) { const p = P(u, v); q.push(p[0], y, p[1]); } const nn = [ax * n[0] + rx * n[2], n[1], az * n[0] + rz * n[2]]; mb.quad(q, nn, [0, 1, 1, 1, 1, 0, 0, 0], c, layer, kind || 0); };
    const bx = (u0, v0, u1, v1, y0, y1, c, layer) => {
      W(u0, v0, u1, v0, y0, y1, { layer, us: 1, vs: 1, c });
      W(u1, v1, u0, v1, y0, y1, { layer, us: 1, vs: 1, c });
      W(u0, v1, u0, v0, y0, y1, { layer, us: 1, vs: 1, c });
      W(u1, v0, u1, v1, y0, y1, { layer, us: 1, vs: 1, c });
      Q([[u0, v0, y1], [u1, v0, y1], [u1, v1, y1], [u0, v1, y1]], [0, 1, 0], c, layer);
    };
    const g = 2.4, iw = hw - g, H = 7.2, ridge = 10.4, f0 = -hl + 3;
    const boards = { layer: lay('boards'), us: 0.5, vs: 1.4, c: wallC };
    W(f0, -iw, hl, -iw, 0, H, boards);
    W(hl, iw, f0, iw, 0, H, boards);
    W(hl, -iw, hl, iw, 0, H, boards);
    W(f0, iw, f0, -iw, 0, H, boards);
    Q([[hl, -iw, H], [hl, iw, H], [hl, 0, ridge], [hl, 0, ridge]], [1, 0, 0], wallC, lay('boards'));
    Q([[f0, iw, H], [f0, -iw, H], [f0, 0, ridge], [f0, 0, ridge]], [-1, 0, 0], wallC, lay('boards'));
    Q([[f0 - 0.05, iw + 0.3, H - 0.1], [f0 - 0.05, -iw - 0.3, H - 0.1], [f0 - 0.05, -iw - 0.3, H + 0.15], [f0 - 0.05, iw + 0.3, H + 0.15]], [-1, 0, 0], trim, lay('stucco'));
    for (let k = 0; k < 8; k++) {
      const u = f0 + 2 + k * (hl - f0 - 3) / 7;
      for (const s of [-1, 1]) Q([[u - 0.75, s * (iw + 0.02), 1.2], [u + 0.75, s * (iw + 0.02), 1.2], [u + 0.75, s * (iw + 0.02), 4.4], [u - 0.75, s * (iw + 0.02), 4.4]], [0, 0, s], [44, 56, 66, 255], lay('glass'), K.FACADE);
    }
    for (const s of [-1, 1]) {
      const v = s * hw, n = 9;
      for (let k = 0; k <= n; k++) { const u = f0 + k * (hl - f0) / n; bx(u - 0.24, v - 0.24, u + 0.24, v + 0.24, 0, 4.6, trim, lay('stucco')); }
      for (let k = 0; k < n; k++) {
        const u0 = f0 + k * (hl - f0) / n + 0.24, u1 = f0 + (k + 1) * (hl - f0) / n - 0.24, cu = (u0 + u1) / 2, rw = (u1 - u0) / 2;
        for (let i = 0; i < 6; i++) {
          const a0 = Math.PI * i / 6, a1 = Math.PI * (i + 1) / 6;
          Q([[cu - Math.cos(a0) * rw, v + s * 0.25, 3.7 + Math.sin(a0) * 0.75], [cu - Math.cos(a1) * rw, v + s * 0.25, 3.7 + Math.sin(a1) * 0.75], [cu - Math.cos(a1) * rw, v + s * 0.25, 4.6], [cu - Math.cos(a0) * rw, v + s * 0.25, 4.6]], [0, 0, s], trim, lay('stucco'));
        }
      }
      Q([[f0, v + s * 0.26, 4.6], [hl, v + s * 0.26, 4.6], [hl, v + s * 0.26, 5.2], [f0, v + s * 0.26, 5.2]], [0, 0, s], trim, lay('stucco'));
      Q([[f0, v + s * 0.32, 5.2], [hl, v + s * 0.32, 5.2], [hl, iw * s, H], [f0, iw * s, H]], [0, 0.6, s * 0.8], roofC, lay('roofmetal'));
      Q([[f0, v - s * 0.2, 4.6], [hl, v - s * 0.2, 4.6], [hl, iw * s, 4.6], [f0, iw * s, 4.6]], [0, -1, 0], [120, 100, 80, 255], lay('plank'));
      Q([[f0 - 0.3, iw * s, H], [hl + 0.3, iw * s, H], [hl + 0.3, 0, ridge], [f0 - 0.3, 0, ridge]], [0, 0.7, s * 0.7], roofC, lay('roofmetal'));
      Q([[f0, v, 0.03], [hl, v, 0.03], [hl, iw * s, 0.03], [f0, iw * s, 0.03]], [0, 1, 0], [170, 160, 146, 255], lay('plank'));
    }
    for (let k = 0; k < 3; k++) {
      const v = (k - 1) * 2.8;
      Q([[f0 - 0.03, v + 0.7, 0.45], [f0 - 0.03, v - 0.7, 0.45], [f0 - 0.03, v - 0.7, 2.9], [f0 - 0.03, v + 0.7, 2.9]], [-1, 0, 0], [96, 62, 38, 255], lay('plank'));
      Q([[f0 - 0.035, v + 0.7, 3.35], [f0 - 0.035, v - 0.7, 3.35], [f0 - 0.035, v - 0.7, 5.3], [f0 - 0.035, v + 0.7, 5.3]], [-1, 0, 0], [52, 66, 78, 255], lay('glass'), K.FACADE);
    }
    const fu = -hl, pw = iw + 0.5;
    bx(fu - 0.2, -pw - 0.2, f0, pw + 0.2, 0, 0.45, [200, 196, 188, 255], lay('granite'));
    for (let k = 0; k < 3; k++) bx(fu - 0.8 + k * 0.2, -3.2, fu - 0.6 + k * 0.2, 3.2, 0, 0.15 * (k + 1), [196, 192, 184, 255], lay('granite'));
    const cols = 6;
    for (let k = 0; k < cols; k++) {
      const v = -pw + 0.45 + k * (2 * pw - 0.9) / (cols - 1);
      bx(fu + 0.05, v - 0.32, fu + 0.69, v + 0.32, 0.45, 0.75, trim, lay('stucco'));
      bx(fu + 0.12, v - 0.24, fu + 0.62, v + 0.24, 0.75, 5.4, wallC, lay('boards'));
      bx(fu + 0.05, v - 0.32, fu + 0.69, v + 0.32, 5.4, 5.62, trim, lay('stucco'));
    }
    bx(fu - 0.05, -pw - 0.25, f0, pw + 0.25, 5.62, 6.45, trim, lay('stucco'));
    Q([[fu - 0.06, pw + 0.25, 5.62], [fu - 0.06, -pw - 0.25, 5.62], [fu - 0.06, -pw - 0.25, 6.45], [fu - 0.06, pw + 0.25, 6.45]], [-1, 0, 0], trim, lay('stucco'));
    Q([[fu - 0.05, -pw - 0.25, 6.45], [f0, -pw - 0.25, 6.45], [f0, pw + 0.25, 6.45], [fu - 0.05, pw + 0.25, 6.45]], [0, 1, 0], roofC, lay('roofmetal'));
    Q([[fu - 0.07, 4.2, 6.45], [fu - 0.07, -4.2, 6.45], [fu - 0.07, 0, 8.3], [fu - 0.07, 0, 8.3]], [-1, 0, 0], trim, lay('stucco'));
    Q([[fu - 0.05, -4.2, 6.45], [f0, -4.2, 6.45], [f0, 0, 8.3], [fu - 0.05, 0, 8.3]], [0, 0.8, -0.6], roofC, lay('roofmetal'));
    Q([[fu - 0.05, 0, 8.3], [f0, 0, 8.3], [f0, 4.2, 6.45], [fu - 0.05, 4.2, 6.45]], [0, 0.8, 0.6], roofC, lay('roofmetal'));
    const star = P(fu - 0.09, 0);
    mb.ensure(12, 30);
    const c0 = mb.v(star[0], 7.15, star[1], -ax, 0, -az, 0.5, 0.5, [210, 40, 34, 255], lay('white'), 0);
    for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.2 : 0.46, q = P(fu - 0.09, Math.cos(a) * r); mb.v(q[0], 7.15 + Math.sin(a) * r, q[1], -ax, 0, -az, 0.5, 0.5, [210, 40, 34, 255], lay('white'), 0); }
    for (let i = 0; i < 10; i++) mb.tri(c0, c0 + i + 1, c0 + i + 2);
    const p0 = P(f0 + 0.2, 0);
    mb.box(p0[0] - 0.05, ridge, p0[1] - 0.05, p0[0] + 0.05, ridge + 2.2, p0[1] + 0.05, { layer: lay('white'), c: [200, 200, 200, 255] });
    for (let i = 0; i < 3; i++) {
      const c = [[240, 240, 240, 255], [40, 70, 170, 255], [200, 40, 40, 255]][i], y1 = ridge + 2.1 - i * 0.3;
      const a = P(f0 + 0.2, 0.05), e = P(f0 + 0.2, 1.4);
      mb.quad([a[0], y1, a[1], e[0], y1, e[1], e[0], y1 - 0.3, e[1], a[0], y1 - 0.3, a[1]], [ax, 0, az], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('white'), 0);
      mb.quad([e[0], y1, e[1], a[0], y1, a[1], a[0], y1 - 0.3, a[1], e[0], y1 - 0.3, e[1]], [-ax, 0, -az], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('white'), 0);
    }
    for (const s of [-1, 1]) {
      const q = P(fu + 0.4, s * (pw + 1.4));
      mb.cyl(q[0], q[1], 0, 0.5, 0.36, 0.5, 10, { layer: lay('stucco'), us: 1, vs: 1, c: trim, cap: true, capLayer: lay('flowers') });
    }
    geo.grow(geo.chunkAt(L.cx, L.cz), b.x0 - 4, b.z0 - 4, b.x1 + 4, b.z1 + 4, ridge + 4);
  };

  const MESH = {};
  const cached = (key, build) => MESH[key] || (MESH[key] = build(new N.MB(512)));

  const wheelMesh = W => cached('wheel', mb => {
    const R = W.r, n = W.n, rimC = [244, 244, 240, 255], spokeC = [226, 228, 232, 255];
    const seg = n * 2;
    const P = (a, r, z) => [-Math.sin(a) * r, -Math.cos(a) * r, z];
    for (const z of [-0.9, 0.9]) {
      for (let i = 0; i < seg; i++) tube(mb, P(i / seg * TAU, R, z), P((i + 1) / seg * TAU, R, z), 0.11, 0.11, rimC, lay('white'), 6);
      for (let i = 0; i < seg; i++) tube(mb, P((i + 0.5) / seg * TAU, R - 0.9, z), P((i + 1.5) / seg * TAU, R - 0.9, z), 0.05, 0.05, rimC, lay('white'), 4);
      for (let i = 0; i < n; i++) {
        const a = (i + 0.5) / n * TAU;
        tube(mb, P(a - 0.03, 1.0, z * 0.9), P(a, R - 0.05, z), 0.035, 0.03, spokeC, lay('white'), 4);
        tube(mb, P(a + 0.03, 1.0, z * 0.9), P(a - TAU / n * 0.5, R - 0.9, z), 0.025, 0.025, spokeC, lay('white'), 3);
      }
      for (let i = 0; i < seg * 2; i++) { const p = P((i + 0.25) / (seg * 2) * TAU, R + 0.13, z); sphere(mb, p[0], p[1], p[2], 0.07, i % 3 === 0 ? [255, 120, 110, 255] : i % 3 === 1 ? [255, 236, 150, 255] : [140, 210, 255, 255], lay('white'), K.NIGHT, 4); }
    }
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      tube(mb, P(a, R, -0.95), P(a, R, 0.95), 0.06, 0.06, [200, 202, 206, 255], lay('metal'), 5);
      tube(mb, P(a, R, -0.9), P(a + TAU / n, R - 0.9, 0.9), 0.025, 0.025, spokeC, lay('white'), 3);
    }
    const ring = [[220, 60, 50, 255], [240, 200, 60, 255], [70, 170, 90, 255], [60, 120, 210, 255]];
    for (const z of [-0.95, 0.95]) {
      for (let i = 0; i < 24; i++) {
        const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU, c = ring[i % 4];
        const q = [...P(a0, 4.2, z), ...P(a1, 4.2, z), ...P(a1, 5.6, z), ...P(a0, 5.6, z)];
        mb.quad(q, [0, 0, Math.sign(z)], [0, 0, 1, 0, 1, 1, 0, 1], c, lay('white'), 0);
        mb.quad([q[9], q[10], q[11], q[6], q[7], q[8], q[3], q[4], q[5], q[0], q[1], q[2]], [0, 0, -Math.sign(z)], [0, 0, 1, 0, 1, 1, 0, 1], col(c, 0.8), lay('white'), 0);
      }
    }
    tube(mb, [0, 0, -1.2], [0, 0, 1.2], 0.95, 0.95, [92, 120, 180, 255], lay('darkmetal'), 12);
    for (const z of [-1.2, 1.2]) disc(mb, 0, 0, z, 0.95, [220, 220, 224, 255], Math.sign(z), 0, 14);
    return mb;
  });

  const cabinMesh = k => cached('cabin' + k, mb => {
    const c = CABIN_C[k % 4], hang = 1.65;
    const y0 = -hang;
    mb.cyl(0, 0, y0, y0 + 0.08, 0.62, 0.66, 12, { layer: lay('metal'), c: [150, 152, 156, 255], cap: true });
    mb.cyl(0, 0, y0 + 0.08, y0 + 0.92, 0.66, 0.74, 12, { layer: lay('white'), c });
    mb.cyl(0, 0, y0 + 0.9, y0 + 0.97, 0.76, 0.76, 12, { layer: lay('white'), c: [236, 236, 230, 255] });
    for (const s of [-1, 1]) mb.box(s * 0.55 - 0.12, y0 + 0.08, -0.45, s * 0.55 + 0.12, y0 + 0.44, 0.45, { layer: lay('plank'), us: 1, c: [170, 120, 74, 255] });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; tube(mb, [Math.cos(a) * 0.72, y0 + 0.95, Math.sin(a) * 0.72], [0, -0.05, 0], 0.02, 0.02, STEEL, lay('metal'), 3); }
    tube(mb, [0, -0.1, 0], [0, 0.05, 0], 0.05, 0.05, STEEL, lay('metal'), 5);
    for (let i = 0; i < 10; i++) {
      const a0 = i / 10 * TAU, a1 = (i + 1) / 10 * TAU, cc = i % 2 ? c : [244, 240, 232, 255];
      mb.quad([0, y0 + 2.05, 0, Math.cos(a0) * 0.95, y0 + 1.72, Math.sin(a0) * 0.95, Math.cos(a1) * 0.95, y0 + 1.72, Math.sin(a1) * 0.95, 0, y0 + 2.05, 0], [0, 1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], cc, lay('fabric'), 0);
      mb.quad([0, y0 + 2.04, 0, Math.cos(a1) * 0.95, y0 + 1.71, Math.sin(a1) * 0.95, Math.cos(a0) * 0.95, y0 + 1.71, Math.sin(a0) * 0.95, 0, y0 + 2.04, 0], [0, -1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], col(cc, 0.75), lay('fabric'), 0);
    }
    return mb;
  });

  const swingTop = () => cached('swingtop', mb => {
    for (let i = 0; i < 16; i++) {
      const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, c = i % 2 ? [236, 196, 58, 255] : [52, 100, 180, 255];
      mb.quad([0, 9.2, 0, Math.cos(a0) * 4.6, 7.6, Math.sin(a0) * 4.6, Math.cos(a1) * 4.6, 7.6, Math.sin(a1) * 4.6, 0, 9.2, 0], [0, 1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], c, lay('fabric'), 0);
      mb.quad([0, 9.18, 0, Math.cos(a1) * 4.6, 7.58, Math.sin(a1) * 4.6, Math.cos(a0) * 4.6, 7.58, Math.sin(a0) * 4.6, 0, 9.18, 0], [0, -1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], col(c, 0.7), lay('fabric'), 0);
      mb.quad([Math.cos(a0) * 4.6, 7.6, Math.sin(a0) * 4.6, Math.cos(a1) * 4.6, 7.6, Math.sin(a1) * 4.6, Math.cos(a1) * 4.6, 7.2, Math.sin(a1) * 4.6, Math.cos(a0) * 4.6, 7.2, Math.sin(a0) * 4.6], [Math.cos(a0), 0, Math.sin(a0)], [0, 0, 1, 0, 1, 1, 0, 1], i % 2 ? [244, 240, 232, 255] : [200, 44, 38, 255], lay('fabric'), 0);
      sphere(mb, Math.cos(a0) * 4.62, 7.25, Math.sin(a0) * 4.62, 0.08, [255, 236, 150, 255], lay('white'), K.NIGHT, 4);
    }
    tube(mb, [0, 7.0, 0], [0, 9.4, 0], 0.28, 0.12, [52, 100, 180, 255], lay('white'), 8);
    return mb;
  });

  const swingSeat = () => cached('swingseat', mb => {
    tube(mb, [-0.18, 0, 0], [-0.18, -4.4, 0], 0.012, 0.012, STEEL, lay('metal'), 3);
    tube(mb, [0.18, 0, 0], [0.18, -4.4, 0], 0.012, 0.012, STEEL, lay('metal'), 3);
    mb.box(-0.25, -4.55, -0.22, 0.25, -4.45, 0.22, { layer: lay('white'), c: [200, 44, 38, 255] });
    mb.box(-0.25, -4.45, 0.18, 0.25, -4.05, 0.22, { layer: lay('white'), c: [200, 44, 38, 255] });
    return mb;
  });

  const waltzDeck = r => cached('waltz', mb => {
    mb.cyl(0, 0, 0.3, 0.55, r, r, 28, { layer: lay('deck'), us: 2, vs: 1, c: [180, 70, 160, 255], cap: true, capLayer: lay('deck') });
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; sphere(mb, Math.cos(a) * r, 0.58, Math.sin(a) * r, 0.07, [255, 236, 150, 255], lay('white'), K.NIGHT, 4); }
    tube(mb, [0, 0.55, 0], [0, 3.4, 0], 0.22, 0.16, [236, 196, 58, 255], lay('white'), 8);
    for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU; mb.quad([0, 3.8, 0, Math.cos(a0) * 1.6, 3.3, Math.sin(a0) * 1.6, Math.cos(a1) * 1.6, 3.3, Math.sin(a1) * 1.6, 0, 3.8, 0], [0, 1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], i % 2 ? [236, 196, 58, 255] : [200, 44, 38, 255], lay('fabric'), 0); }
    return mb;
  });

  const waltzCup = k => cached('cup' + k, mb => {
    const c = CABIN_C[k % 4];
    mb.cyl(0, 0, 0, 0.15, 0.55, 0.85, 14, { layer: lay('white'), c, cap: false });
    mb.cyl(0, 0, 0.15, 0.95, 0.85, 1.0, 14, { layer: lay('white'), c });
    mb.cyl(0, 0, 0.92, 1.0, 1.02, 1.02, 14, { layer: lay('white'), c: [244, 240, 232, 255] });
    mb.cyl(0, 0, 0.1, 0.42, 0.75, 0.75, 14, { layer: lay('plank'), c: [170, 120, 74, 255], cap: true });
    tube(mb, [0, 0.42, 0], [0, 0.9, 0], 0.04, 0.04, STEEL, lay('metal'), 5);
    mb.cyl(0, 0, 0.88, 0.94, 0.22, 0.22, 10, { layer: lay('metal'), c: STEEL, cap: true });
    return mb;
  });

  const carouselTop = r => cached('carousel', mb => {
    mb.cyl(0, 0, 0.3, 0.55, r, r, 24, { layer: lay('deck'), us: 2, c: [196, 160, 120, 255], cap: true, capLayer: lay('deck') });
    tube(mb, [0, 0.55, 0], [0, 4.0, 0], 0.3, 0.3, [236, 196, 58, 255], lay('white'), 10);
    for (let i = 0; i < 16; i++) {
      const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, c = i % 2 ? [244, 240, 232, 255] : [200, 44, 38, 255];
      mb.quad([0, 5.4, 0, Math.cos(a0) * (r + 0.3), 3.9, Math.sin(a0) * (r + 0.3), Math.cos(a1) * (r + 0.3), 3.9, Math.sin(a1) * (r + 0.3), 0, 5.4, 0], [0, 1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], c, lay('fabric'), 0);
      mb.quad([0, 5.38, 0, Math.cos(a1) * (r + 0.3), 3.88, Math.sin(a1) * (r + 0.3), Math.cos(a0) * (r + 0.3), 3.88, Math.sin(a0) * (r + 0.3), 0, 5.38, 0], [0, -1, 0], [0.5, 0, 0, 1, 1, 1, 0.5, 0], col(c, 0.7), lay('fabric'), 0);
      mb.quad([Math.cos(a0) * (r + 0.3), 3.9, Math.sin(a0) * (r + 0.3), Math.cos(a1) * (r + 0.3), 3.9, Math.sin(a1) * (r + 0.3), Math.cos(a1) * (r + 0.3), 3.45, Math.sin(a1) * (r + 0.3), Math.cos(a0) * (r + 0.3), 3.45, Math.sin(a0) * (r + 0.3)], [Math.cos(a0), 0, Math.sin(a0)], [0, 0, 1, 0, 1, 1, 0, 1], i % 2 ? [236, 196, 58, 255] : [42, 104, 200, 255], lay('fabric'), 0);
      sphere(mb, Math.cos(a0) * (r + 0.32), 3.5, Math.sin(a0) * (r + 0.32), 0.07, [255, 236, 150, 255], lay('white'), K.NIGHT, 4);
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU, x = Math.cos(a) * (r - 1.1), z = Math.sin(a) * (r - 1.1);
      tube(mb, [x, 0.55, z], [x, 3.9, z], 0.035, 0.035, [220, 200, 120, 255], lay('chrome'), 5, K.CHROME);
    }
    return mb;
  });

  const horse = k => cached('horse' + k, mb => {
    const c = [[244, 240, 232, 255], [150, 100, 60, 255], [60, 50, 46, 255]][k % 3], sad = CABIN_C[k % 4];
    tube(mb, [-0.45, 0, 0], [0.4, 0.05, 0], 0.2, 0.18, c, lay('white'), 8);
    tube(mb, [0.35, 0.05, 0], [0.62, 0.42, 0], 0.11, 0.08, c, lay('white'), 6);
    tube(mb, [0.6, 0.42, 0], [0.82, 0.32, 0], 0.09, 0.06, c, lay('white'), 6);
    for (const [x, z] of [[-0.35, -0.1], [-0.35, 0.1], [0.3, -0.1], [0.3, 0.1]]) tube(mb, [x, -0.05, z], [x + 0.08, -0.6, z], 0.045, 0.035, c, lay('white'), 4);
    mb.box(-0.2, 0.15, -0.16, 0.12, 0.24, 0.16, { layer: lay('white'), c: sad });
    return mb;
  });

  const bumperCar = k => cached('bumper' + k, mb => {
    const c = CABIN_C[k % 4];
    mb.box(-0.7, 0.1, -1.0, 0.7, 0.5, 1.0, { layer: lay('white'), c });
    mb.box(-0.78, 0.08, -1.08, 0.78, 0.22, 1.08, { layer: lay('tire'), c: [30, 30, 30, 255] });
    mb.box(-0.55, 0.5, -0.1, 0.55, 0.85, 0.75, { layer: lay('white'), c: col(c, 0.85) });
    mb.box(-0.5, 0.5, -0.6, 0.5, 0.56, -0.1, { layer: lay('white'), c: [40, 40, 40, 255] });
    tube(mb, [0, 0.8, 0.85], [0, 4.25, 0.85], 0.025, 0.025, STEEL, lay('metal'), 4);
    sphere(mb, 0, 4.25, 0.85, 0.06, [255, 230, 170, 255], lay('white'), K.EMIT, 4);
    tube(mb, [0, 0.62, -0.5], [0, 0.8, -0.35], 0.012, 0.012, IRON, lay('darkmetal'), 3);
    return mb;
  });

  const OUTLINE = {
    duck: [[-0.11, 0], [0.08, 0], [0.11, 0.03], [0.1, 0.06], [0.06, 0.075], [0.075, 0.1], [0.095, 0.13], [0.135, 0.13], [0.09, 0.155], [0.06, 0.17], [0.035, 0.15], [0.025, 0.12], [0.04, 0.09], [-0.06, 0.085], [-0.12, 0.06]],
    bear: [[-0.08, 0], [-0.025, 0], [-0.02, 0.07], [0.02, 0.07], [0.025, 0], [0.08, 0], [0.09, 0.12], [0.13, 0.19], [0.09, 0.22], [0.07, 0.25], [0.08, 0.3], [0.045, 0.32], [0, 0.31], [-0.045, 0.32], [-0.08, 0.3], [-0.07, 0.25], [-0.09, 0.22], [-0.13, 0.19], [-0.09, 0.12]],
    hare: [[-0.07, 0], [0.07, 0], [0.085, 0.08], [0.055, 0.13], [0.065, 0.21], [0.06, 0.3], [0.035, 0.21], [0.01, 0.2], [-0.005, 0.31], [-0.03, 0.2], [-0.06, 0.14], [-0.085, 0.06]],
    wolf: [[-0.15, 0], [-0.11, 0], [-0.1, 0.06], [0.08, 0.06], [0.09, 0], [0.13, 0], [0.14, 0.1], [0.19, 0.12], [0.2, 0.16], [0.14, 0.19], [0.12, 0.23], [0.1, 0.18], [-0.1, 0.16], [-0.19, 0.19], [-0.15, 0.11]],
    fox: [[-0.11, 0], [-0.08, 0], [-0.07, 0.05], [0.06, 0.05], [0.07, 0], [0.1, 0], [0.11, 0.08], [0.16, 0.1], [0.17, 0.13], [0.12, 0.16], [0.105, 0.2], [0.085, 0.15], [-0.08, 0.13], [-0.2, 0.17], [-0.22, 0.1], [-0.12, 0.08]],
    boar: [[-0.13, 0], [-0.09, 0], [-0.08, 0.05], [0.07, 0.05], [0.08, 0], [0.12, 0], [0.13, 0.08], [0.18, 0.09], [0.19, 0.12], [0.13, 0.15], [0.0, 0.17], [-0.12, 0.15], [-0.15, 0.09]],
    plane: [[-0.18, 0.04], [0.12, 0.04], [0.16, 0.06], [0.12, 0.08], [0.02, 0.08], [-0.03, 0.17], [-0.07, 0.17], [-0.05, 0.08], [-0.14, 0.08], [-0.17, 0.13], [-0.19, 0.13]]
  };
  const PAINT = { duck: [236, 200, 60, 255], bear: [150, 96, 54, 255], hare: [200, 200, 196, 255], wolf: [120, 120, 126, 255], fox: [220, 120, 50, 255], boar: [92, 70, 56, 255], plane: [70, 120, 190, 255] };
  const ANCHOR = { duck: [0.02, 0.09], bear: [0, 0.22], hare: [0.0, 0.1], wolf: [0.13, 0.15], fox: [0.11, 0.13], boar: [0.13, 0.12], plane: [0.05, 0.06] };

  const figMesh = (kind, r) => cached('fig' + kind, mb => {
    const pts = OUTLINE[kind], a = ANCHOR[kind];
    shape(mb, pts.map(p => [p[0] - a[0], p[1] - a[1]]), -0.008, 0.008, PAINT[kind], col(PAINT[kind], 0.6));
    if (kind === 'duck') disc(mb, 0.06 - a[0], 0.14 - a[1], -0.01, 0.012, [20, 20, 20, 255], -1, 0, 6);
    target(mb, 0, 0, -0.008, r);
    if (kind !== 'duck' && kind !== 'plane') mb.box(-0.1, -a[1] - 0.03, -0.03, 0.1, -a[1], 0.03, { layer: lay('darkmetal'), c: [70, 70, 74, 255] });
    return mb;
  });

  const millMesh = () => cached('mill', mb => {
    mb.box(-0.1, -0.36, -0.03, 0.1, 0.0, 0.03, { layer: lay('white'), c: [200, 170, 120, 255] });
    mb.quad([-0.12, 0, -0.035, 0.12, 0, -0.035, 0, 0.12, -0.035, 0, 0.12, -0.035], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], [170, 60, 50, 255], lay('white'), 0);
    target(mb, 0, 0, -0.04, 0.055);
    return mb;
  });
  const sailsMesh = () => cached('sails', mb => {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU, c = Math.cos(a), s = Math.sin(a);
      mb.quad([c * 0.07 - s * 0.03, s * 0.07 + c * 0.03, -0.05, c * 0.26 - s * 0.03, s * 0.26 + c * 0.03, -0.05, c * 0.26 + s * 0.04, s * 0.26 - c * 0.04, -0.05, c * 0.07 + s * 0.04, s * 0.07 - c * 0.04, -0.05], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], [236, 230, 210, 255], lay('white'), 0);
    }
    return mb;
  });
  const bellMesh = () => cached('bell', mb => {
    mb.cyl(0, 0, -0.16, -0.02, 0.09, 0.05, 12, { layer: lay('chrome'), kind: K.CHROME, c: [214, 170, 70, 255] });
    mb.cyl(0, 0, -0.02, 0.0, 0.05, 0.02, 12, { layer: lay('chrome'), kind: K.CHROME, c: [214, 170, 70, 255], cap: true });
    tube(mb, [0, 0, 0], [0, 0.12, 0], 0.008, 0.008, IRON, lay('darkmetal'), 3);
    return mb;
  });
  const plateMesh = r => cached('plate', mb => { mb.box(-0.09, -0.09, -0.006, 0.09, 0.09, 0.006, { layer: lay('darkmetal'), c: [60, 60, 64, 255] }); target(mb, 0, 0, -0.006, r); return mb; });
  const propMesh = () => cached('prop', mb => { mb.box(-0.004, -0.08, -0.01, 0.004, 0.08, 0.0, { layer: lay('white'), c: [40, 40, 40, 255] }); return mb; });

  N.Models.food = id => cached('food' + id, mb => {
    if (id === 'kvass') {
      mb.cyl(0, 0, -0.06, 0.07, 0.042, 0.046, 10, { layer: lay('glass'), c: [200, 220, 220, 255] });
      mb.cyl(0, 0, -0.055, 0.05, 0.04, 0.044, 10, { layer: lay('white'), c: [120, 70, 30, 255], cap: true, capC: [230, 220, 190, 255] });
      tube(mb, [0.045, 0.03, 0], [0.07, 0.0, 0], 0.01, 0.01, [200, 220, 220, 255], lay('glass'), 4);
      return mb;
    }
    const k = id === 'double' ? 1.25 : 1;
    mb.cyl(0, 0, -0.1 * k, 0.07 * k, 0.034 * k, 0.04 * k, 10, { layer: lay('white'), c: [232, 210, 160, 255] });
    mb.cyl(0, 0, 0.07 * k, 0.1 * k, 0.04 * k, 0.03 * k, 10, { layer: lay('white'), c: [150, 96, 50, 255], cap: true, capC: [120, 160, 70, 255] });
    mb.cyl(0, 0, -0.1 * k, -0.02 * k, 0.042 * k, 0.044 * k, 10, { layer: lay('white'), c: [236, 236, 230, 255] });
    return mb;
  });

  const RIDERS = [];
  const riderOf = (key, kindIdx) => {
    let r = RIDERS[key];
    if (!r) {
      const kinds = ['girl', 'student', 'woman', 'worker', 'pensioner', 'girl', 'student', 'muzhik'];
      const rng = N.rng(key * 977 + 13), kind = kinds[(kindIdx + key) % kinds.length];
      r = RIDERS[key] = { id: 900000 + key, kind: 'ped', type: kind, look: N.makeLook(kind, rng), x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, vy: 0, onGround: true, weapon: 'fists', state: 'idle', anim: { phase: 0, sit: 1, aim: 0, fall: 0, dance: 0 } };
    }
    return r;
  };

  const PD = { ang: {}, lastT: null };
  const RIM_BULBS = [[255, 130, 110], [255, 232, 150], [150, 210, 255]];
  const FLOOR_BULBS = [[255, 90, 70], [255, 220, 90], [100, 170, 255]];
  const DISCO = [[1.7, 0.35, 0.9], [0.35, 1.1, 1.7], [1.6, 1.25, 0.3]];

  const rideCycle = (t, period, up, run, down) => {
    const u = ((t % period) + period) % period;
    if (u < up) return N.smooth(0, up, u);
    if (u < up + run) return 1;
    if (u < up + run + down) return 1 - N.smooth(up + run, up + run + down, u);
    return 0;
  };

  PD.fill = (sc, f, lights, Rv, Uv, vis, t) => {
    const W = f.world, city = sc.city, D = city.parkData, R = sc.r, M3 = N.M3, cam = f.cam;
    if (!D || !D.wheel) return;
    const park = W.park;
    const dt = PD.lastT === null ? 0 : N.clamp(t - PD.lastT, 0, 0.1);
    PD.lastT = t;
    const night = f.env.night || 0;
    const hour = W.clock / 60, open = hour > 9.5 && hour < 23.5;
    const far = (f.env.fogFar || 600) + 60;
    const Wh = D.wheel, dW = Math.hypot(Wh.x - cam.x, Wh.z - cam.z);
    if (dW < far && (dW < 80 || vis(Wh.x, Wh.z, 30))) {
      const yaw = N.yawOf(Wh.nx, Wh.nz), ang = park ? park.wheelAng() : N.wheelAngle(Wh, W.t);
      const WM = M3.euler(0, -yaw, -ang, Wh.x, Wh.hub, Wh.z);
      R.dyn.add(wheelMesh(Wh), WM, null, null, null, null, 1);
      if (night > 0.2) {
        const m = 48, rr = Wh.r + 0.13, a8 = 235 * night;
        for (let i = 0; i < m; i++) {
          const a = (i + 0.5) / m * TAU, lx = -Math.sin(a) * rr, ly = -Math.cos(a) * rr, c = RIM_BULBS[i % 3], k = 0.72 + 0.28 * Math.sin(t * 2.2 - i * 0.52);
          R.addSprites.bill(WM[0] * lx + WM[1] * ly + WM[9], WM[3] * lx + WM[4] * ly + WM[10], WM[6] * lx + WM[7] * ly + WM[11], 1.1, 0, [c[0], c[1], c[2], Math.round(a8 * k)], Rv, Uv);
        }
      }
      const pose = {};
      const lap = Math.floor((park ? park.wt : W.t) / Wh.period);
      for (let i = 0; i < Wh.n; i++) {
        N.wheelPose(Wh, ang, i, pose);
        const sway = 0.04 * Math.sin(t * 1.1 + i * 1.7);
        R.dyn.add(cabinMesh(i), M3.euler(0, -yaw, sway, pose.px, pose.py, pose.pz), null, null, null, null, 1);
        if (dW > 110 || !open) continue;
        const pl = W.player, mine = pl.ride && pl.ride.i === i;
        const nr = mine ? 0 : Math.floor(N.hash2(i, lap, 41) * 3.2) - (night > 0.5 ? 1 : 0);
        for (let k = 0; k < nr; k++) {
          const rd = riderOf(i * 4 + k, k), s = k === 0 ? 1 : -1, tall = (rd.look && rd.look.tall) || 1;
          const lx = s * 0.52, x = pose.px + Math.cos(yaw) * lx, z = pose.pz + Math.sin(yaw) * lx;
          rd.x = x; rd.z = z; rd.y = pose.y; rd.yaw = yaw + (s > 0 ? -Math.PI / 2 : Math.PI / 2);
          sc.addPed(rd, M3.euler(0, -rd.yaw, 0, x, pose.y + 0.44 + N.SIT_HIP - N.PELVIS_Y * tall, z), t, { dist: dW, sit: 1, bench: true });
        }
      }
      if (night > 0.2 && dW < 400 && lights.length < N.MAX_LIGHTS - 1) lights.push({ x: Wh.x, y: Wh.hub, z: Wh.z, r: 26, c: [1.4 * night, 1.2 * night, 1.0 * night] });
    }
    const Dn = D.dance;
    if (Dn && night > 0.15) {
      const dd = Math.hypot(Dn.x - cam.x, Dn.z - cam.z);
      if (dd < 240 && (dd < 30 || vis(Dn.x, Dn.z, 12))) {
        const gy = city.groundY(Dn.x, Dn.z), a8 = Math.round(225 * night);
        for (let i = 0; i < 26; i++) {
          const a = i / 26 * TAU, c = FLOOR_BULBS[i % 3];
          R.addSprites.bill(Dn.x + Math.cos(a) * Dn.r, gy + 2.55, Dn.z + Math.sin(a) * Dn.r, 0.65, 0, [c[0], c[1], c[2], a8], Rv, Uv);
        }
        if (hour >= 19 && hour < 23.6 && dd < 160) {
          if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x: Dn.x, y: gy + 4.4, z: Dn.z - Dn.r + 3.6, r: 12, c: [1.5 * night, 1.15 * night, 0.75 * night] });
          for (let i = 0; i < 3; i++) {
            const a = t * (0.45 + i * 0.13) + i * 2.1, x = Dn.x + Math.cos(a) * 4.6, z = Dn.z + 1 + Math.sin(a * 1.3) * 3.8, c = DISCO[i];
            if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x, y: gy + 3.4, z, r: 8, c: [c[0] * night, c[1] * night, c[2] * night] });
            R.addSprites.ground(x, gy + 0.09, z, 2.6, 2.6, 0, 0, [c[0] * 90 | 0, c[1] * 90 | 0, c[2] * 90 | 0, Math.round(255 * night)]);
          }
        }
      }
    }
    for (const r of D.rides) {
      const d = Math.hypot(r.x - cam.x, r.z - cam.z);
      if (d > 260 || !(d < 30 || vis(r.x, r.z, 12))) continue;
      const key = r.type + r.x;
      if (r.type === 'swings') {
        const k = open ? rideCycle(t + 13, 90, 8, 42, 8) : 0, om = 1.3 * k;
        PD.ang[key] = (PD.ang[key] || 0) + om * dt;
        const th = PD.ang[key], tilt = Math.atan(om * om * 6.2 / 9.81);
        R.dyn.add(swingTop(), M3.euler(0, th, 0, r.x, 0, r.z), null, null, null, null, 1);
        for (let i = 0; i < 16; i++) {
          const a = th + i / 16 * TAU, px = r.x + Math.cos(-a) * 3.9, pz = r.z + Math.sin(-a) * 3.9;
          const M = M3.euler(0, a, tilt, px, 7.3, pz);
          R.dyn.add(swingSeat(), M, null, null, null, null, 1);
          if (open && d < 90 && N.hash2(i, Math.floor((t + 13) / 90), 7) < 0.45) {
            const rd = riderOf(200 + i, i), tall = (rd.look && rd.look.tall) || 1;
            const seat = [M[1] * -4.5 + M[9], M[4] * -4.5 + M[10], M[7] * -4.5 + M[11]];
            rd.yaw = a;
            sc.addPed(rd, M3.mul(M, M3.euler(0, 0, 0, 0, -4.45 + N.SIT_HIP - N.PELVIS_Y * tall, 0.04)), t, { dist: d, sit: 1, bench: true });
            rd.x = seat[0]; rd.z = seat[2];
          }
        }
      } else if (r.type === 'waltz') {
        const k = open ? rideCycle(t + 41, 80, 6, 38, 6) : 0;
        PD.ang[key] = (PD.ang[key] || 0) + 0.55 * k * dt;
        PD.ang[key + 'c'] = (PD.ang[key + 'c'] || 0) + 1.7 * k * dt;
        const th = PD.ang[key];
        R.dyn.add(waltzDeck(r.r), M3.euler(0, th, 0, r.x, 0, r.z), null, null, null, null, 1);
        for (let i = 0; i < 6; i++) {
          const a = th + i / 6 * TAU, cx = r.x + Math.cos(-a) * (r.r - 1.6), cz = r.z + Math.sin(-a) * (r.r - 1.6);
          R.dyn.add(waltzCup(i), M3.euler(0, PD.ang[key + 'c'] * (i % 2 ? 1 : -1.3), 0, cx, 0.55, cz), null, null, null, null, 1);
        }
      } else if (r.type === 'carousel') {
        const k = open ? rideCycle(t + 7, 70, 5, 34, 5) : 0;
        PD.ang[key] = (PD.ang[key] || 0) + 0.5 * k * dt;
        const th = PD.ang[key];
        R.dyn.add(carouselTop(r.r), M3.euler(0, th, 0, r.x, 0, r.z), null, null, null, null, 1);
        for (let i = 0; i < 8; i++) {
          const a = th + i / 8 * TAU, hx = r.x + Math.cos(-a) * (r.r - 1.1), hz = r.z + Math.sin(-a) * (r.r - 1.1);
          R.dyn.add(horse(i), M3.euler(0, a - Math.PI / 2, 0, hx, 1.5 + 0.25 * Math.sin(PD.ang[key] * 3 + i), hz), null, null, null, null, 1);
        }
      } else if (r.type === 'autodrom') {
        const c = Math.cos(r.rot), s = Math.sin(r.rot), run = open ? 1 : 0;
        for (let i = 0; i < 6; i++) {
          const ph = t * 0.35 * run + i * 1.37, lx = Math.sin(ph * 1.3 + i) * (r.hw - 1.9), lz = Math.sin(ph * 0.9 + i * 2.1) * (r.hl - 2.2);
          const vx = Math.cos(ph * 1.3 + i) * 1.3 * (r.hw - 1.9), vz = Math.cos(ph * 0.9 + i * 2.1) * 0.9 * (r.hl - 2.2);
          const wx = r.x + lx * c - lz * s, wz = r.z + lx * s + lz * c;
          const yaw = N.yawOf(vx * c - vz * s, vx * s + vz * c) + (run ? 0 : i);
          R.dyn.add(bumperCar(i), M3.euler(0, -yaw, 0, wx, 0.12, wz), null, null, null, null, 1);
        }
      }
    }
    const tir = park && park.tir, TT = D.tir;
    if (TT && Math.hypot(TT.x - cam.x, TT.z - cam.z) < 45) {
      const base = M3.euler(0, -TT.rot, 0, TT.x, 0, TT.z), P = N.PARK.tir;
      const list = tir ? tir.figures : P.figures.map(q => Object.assign({ down: 0, spin: 0, swing: 0 }, q));
      for (const q of list) {
        if (q.kind === 'mill') {
          R.dyn.add(millMesh(), M3.mul(base, M3.euler(0, 0, 0, q.u, q.y, q.z)), null, null, null, null, 1);
          PD.ang.mill = (PD.ang.mill || 0) + (q.spin || 0) * dt + 0.05 * dt;
          R.dyn.add(sailsMesh(), M3.mul(base, M3.euler(0, 0, PD.ang.mill, q.u, q.y + 0.02, q.z - 0.02)), null, null, null, null, 1);
        } else if (q.kind === 'bell') {
          R.dyn.add(plateMesh(q.r), M3.mul(base, M3.euler(0, 0, 0, q.u, q.y, q.z)), null, null, null, null, 1);
          const sw = (q.swing || 0) * 0.5 * Math.sin(t * 9);
          R.dyn.add(bellMesh(), M3.mul(base, M3.euler(sw, 0, 0, q.u, q.y + 0.42, q.z)), null, null, null, null, 1);
        } else if (q.kind === 'plane') {
          const fall = (q.down || 0) * 1.4;
          R.dyn.add(figMesh('plane', q.r), M3.mul(base, M3.euler(fall, 0, 0, q.u, q.y, q.z)), null, null, null, null, 1);
          PD.ang.plane = (PD.ang.plane || 0) + (q.spin || 0) * dt;
          R.dyn.add(propMesh(), M3.mul(base, M3.euler(fall, 0, PD.ang.plane, q.u + 0.17, q.y - 0.01, q.z - 0.012)), null, null, null, null, 1);
        } else {
          const fall = (q.down || 0) * 1.45, a = ANCHOR[q.kind], by = q.y - a[1];
          const M = M3.mul(base, M3.euler(fall, 0, 0, q.u, by, q.z));
          R.dyn.add(figMesh(q.kind, q.r), M3.mul(M, M3.euler(0, 0, 0, 0, a[1], 0)), null, null, null, null, 1);
        }
      }
      const wt = park ? park.wt : W.t;
      const ducks = tir ? tir.ducks : Array.from({ length: P.ducks.n }, (v, i) => ({ i, down: 0 }));
      for (const dk of ducks) {
        const gap = P.ducks.span / P.ducks.n, raw = dk.i * gap + P.ducks.speed * wt, u = raw - Math.floor(raw / P.ducks.span) * P.ducks.span - P.ducks.span / 2;
        if (Math.abs(u) > 3.25) continue;
        const a = ANCHOR.duck, fall = (dk.down || 0) * 1.5;
        const M = M3.mul(base, M3.euler(fall, 0, 0, u, P.ducks.y - a[1], P.ducks.z));
        R.dyn.add(figMesh('duck', P.ducks.r), M3.mul(M, M3.euler(0, 0, 0, 0, a[1], 0)), null, null, null, null, 1);
      }
      if (tir && tir.dents.length) for (const d of tir.dents) R.sprites.bill(d[0], d[1], d[2], 0.016, 11, [30, 30, 30, 230], Rv, Uv);
      if (lights.length < N.MAX_LIGHTS - 1 && Math.hypot(TT.wall.x - cam.x, TT.wall.z - cam.z) < 30) lights.push({ x: (TT.wall.x + TT.front.x) / 2, y: 3.0, z: (TT.wall.z + TT.front.z) / 2, r: 7, c: [1.3, 1.2, 1.0] });
    }
    for (const fo of D.fountains) {
      const d = Math.hypot(fo.x - cam.x, fo.z - cam.z);
      if (d > 55 || !f.fx) continue;
      const rate = fo.kind === 'tiers' ? 7 : fo.kind === 'pool' ? 4 : 1.5;
      const n = Math.floor(rate * dt * 60 * (d < 25 ? 1 : 0.5) + Math.random());
      for (let i = 0; i < n; i++) {
        let x = fo.x, y = 0.9, z = fo.z, vx = 0, vy = 0, vz = 0;
        if (fo.kind === 'tiers') {
          if (Math.random() < 0.35) { y = 8.3; vx = (Math.random() - 0.5) * 1.6; vy = 0.5 + Math.random(); vz = (Math.random() - 0.5) * 1.6; }
          else { const a = Math.random() * TAU, rr = fo.r * 0.68; x += Math.cos(a) * rr; z += Math.sin(a) * rr; y = 3.6 + Math.random() * 0.5; vx = -Math.cos(a) * 1.5; vz = -Math.sin(a) * 1.5; vy = -0.5; }
        } else if (fo.kind === 'pool') {
          const ux = Math.cos(N.PARK.pool.a), uz = Math.sin(N.PARK.pool.a), s = (Math.random() - 0.5) * (fo.l - 3.6);
          x += ux * s; z += uz * s; y = 2.5; vx = (Math.random() - 0.5) * 0.8; vy = 0.3; vz = (Math.random() - 0.5) * 0.8;
        } else { y = (fo.big ? 1.35 : 1) * 3.2; vx = (Math.random() - 0.5) * 0.8; vy = 0.3; vz = (Math.random() - 0.5) * 0.8; }
        f.fx.add({ x, y, z, vx, vy, vz, t: 0, life: 0.9 + Math.random() * 0.5, s0: 0.06, s1: 0.14, cell: 11, col: [214, 230, 242], a: 0.5, grav: true, lit: true, floor: 0.55 });
      }
    }
  };

  N.ParkDraw = PD;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
