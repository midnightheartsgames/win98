(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const WHITE = [255, 255, 255, 255];
  const IVORY = [246, 241, 228, 255];
  const OCHRE = [226, 182, 92, 255];
  const M = N.Props.M;
  const shade = (c, k) => [Math.min(255, c[0] * k) | 0, Math.min(255, c[1] * k) | 0, Math.min(255, c[2] * k) | 0, 255];

  const edge = (p, i) => {
    const j = (i + 2) % p.length;
    const ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1];
    const ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez) || 1;
    return { i, ax, az, bx, bz, L, ux: ex / L, uz: ez / L, nx: ez / L, nz: -ex / L, mx: (ax + bx) / 2, mz: (az + bz) / 2 };
  };
  const ep = (e, s, v) => [e.ax + e.ux * s + e.nx * v, e.az + e.uz * s + e.nz * v];
  const erect = (e, s0, s1, v0, v1) => {
    const p = [...ep(e, s0, v0), ...ep(e, s1, v0), ...ep(e, s1, v1), ...ep(e, s0, v1)];
    return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
  };
  const face = (mb, e, s0, s1, v, y0, y1, o) => {
    const a = ep(e, s0, v), b = ep(e, s1, v);
    const vs = o.fit ? (y1 - y0) / Math.max(1, Math.round((y1 - y0) / (o.vs || 1))) : o.vs || 1;
    mb.wall(b[0], b[1], a[0], a[1], y0, y1, Object.assign({}, o, { vs, v0: o.top !== undefined ? (o.top - y1) / vs : o.v0 }));
  };
  const ebox = (mb, e, s0, s1, v0, v1, y0, y1, o) => {
    const p = erect(e, s0, s1, v0, v1);
    mb.obox(p, y0, y1, o);
    if (o.under) mb.polyFlat(p, y0, { layer: o.under.layer !== undefined ? o.under.layer : o.layer, c: o.under.c || o.c, us: 2, down: true });
  };
  const edges = p => { const out = []; for (let i = 0; i < p.length; i += 2) { const e = edge(p, i); if (e.L > 0.05) out.push(e); } return out; };
  const frameOf = (b, i) => edge(b.poly, i);
  const local = (f, u, v) => { const x = u * f.ux + v * f.nx, z = u * f.uz + v * f.nz; return [f.mx + x, f.mz + z]; };
  const lrect = (f, u0, u1, v0, v1) => {
    const p = [...local(f, u0, v0), ...local(f, u1, v0), ...local(f, u1, v1), ...local(f, u0, v1)];
    return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
  };
  const lbox = (mb, f, u0, u1, v0, v1, y0, y1, o) => {
    const p = lrect(f, u0, u1, v0, v1);
    mb.obox(p, y0, y1, o);
    if (o.under) mb.polyFlat(p, y0, { layer: o.under.layer !== undefined ? o.under.layer : o.layer, c: o.under.c || o.c, us: 2, down: true });
  };
  const lface = (mb, f, u0, u1, v, y0, y1, o) => {
    const a = local(f, u0, v), b = local(f, u1, v);
    const vs = o.vs || 1;
    mb.wall(b[0], b[1], a[0], a[1], y0, y1, Object.assign({}, o, { v0: o.top !== undefined ? (o.top - y1) / vs : o.v0 }));
  };
  const lcyl = (mb, f, u, v, y0, y1, r0, r1, seg, o) => { const q = local(f, u, v); mb.cyl(q[0], q[1], y0, y1, r0, r1, seg, o); };

  const bays = (mb, e, y0, y1, o) => {
    const n = Math.max(1, Math.round(e.L / o.bay));
    face(mb, e, 0, e.L, 0, y0, y1, { layer: o.layer, kind: o.kind, us: e.L / n, vs: o.vs, fit: true, top: o.top !== undefined ? o.top : y1, c: o.c, cb: o.cb, ct: o.ct, u0: 0 });
    return n;
  };

  const pilasters = (mb, e, n, y0, y1, w, d, c, skipEnds) => {
    for (let k = skipEnds ? 1 : 0; k <= (skipEnds ? n - 1 : n); k++) {
      const s = k * e.L / n;
      ebox(mb, e, Math.max(0, s - w / 2), Math.min(e.L, s + w / 2), -0.02, d, y0, y1, { layer: T('stucco'), us: 1, vs: 3, c, noTop: true });
    }
  };

  const balustrade = (mb, e, y, h, inset, c) => {
    const o = { layer: T('balustrade'), kind: K.DECAL, us: 2.2, vs: h, v0: 0, c };
    face(mb, e, 0, e.L, -inset, y, y + h, o);
    const a = ep(e, 0, -inset - 0.04), b = ep(e, e.L, -inset - 0.04);
    mb.wall(a[0], a[1], b[0], b[1], y, y + h, o);
    const posts = Math.max(1, Math.round(e.L / 5.5));
    for (let k = 0; k <= posts; k++) {
      const s = k * e.L / posts;
      ebox(mb, e, Math.max(0, s - 0.22), Math.min(e.L, s + 0.22), -inset - 0.24, -inset + 0.2, y, y + h + 0.12, { layer: T('stucco'), us: 1, vs: 1, c });
    }
  };

  const cornice = (mb, e, y, d, h, c) => {
    ebox(mb, e, -d * 0.6, e.L + d * 0.6, -0.3, d, y, y + h, { layer: T('stucco'), us: 2, vs: 1, c, under: { c: shade(c, 0.86) } });
  };

  const roof = (mb, p, y, tex) => mb.polyFlat(p, y, { layer: T(tex || 'tar'), us: 6, c: [205, 205, 205, 255] });

  const inNotch = (f, e, pw, pd) => {
    const dx = e.mx - f.mx, dz = e.mz - f.mz;
    const v = dx * f.nx + dz * f.nz, u = dx * f.ux + dz * f.uz;
    return v < -0.05 && v > -pd - 0.1 && Math.abs(u) <= pw / 2 + 0.1;
  };

  const L = {};

  L.dk = (geo, mb, b) => {
    const lm = b.lm, f = frameOf(b, lm.wall), pw = lm.pw, pd = lm.pd;
    const H0 = 1.2, Ht = 15.0, Hc = 16.3, Hr = 12.6;
    const p = b.cpoly || b.poly;
    const depth = 36;
    const c0 = f.mx * f.nx + f.mz * f.nz - depth;
    const main = N.clipHalf(p, -f.nx, -f.nz, -c0) || p;
    const rear = N.clipHalf(p, f.nx, f.nz, c0);
    const plinth = { layer: T('redgranite'), us: 1.6, vs: 1.2, c: [150, 130, 124, 255] };
    const wallO = { layer: T('dkbay'), kind: K.FACADE, bay: 4.6, vs: 4.6 };
    for (const e of edges(main)) {
      if (inNotch(f, e, pw, pd)) continue;
      face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
      const n = bays(mb, e, H0, Ht, Object.assign({ top: Ht }, wallO));
      if (e.L > 7) pilasters(mb, e, n, H0, Ht, 0.78, 0.32, IVORY, true);
      ebox(mb, e, -0.1, e.L + 0.1, -0.2, 0.16, Ht, Ht + 0.8, { layer: T('stucco'), us: 2, vs: 1, c: IVORY, noTop: true });
      cornice(mb, e, Ht + 0.8, 0.85, Hc - Ht - 0.8, IVORY);
      balustrade(mb, e, Hc, 1.15, 0.2, IVORY);
    }
    roof(mb, main, Hc);
    if (rear) {
      for (const e of edges(rear)) {
        if ((f.mx - e.mx) * f.nx + (f.mz - e.mz) * f.nz < depth + 1) continue;
        face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
        const n = bays(mb, e, H0, Hr - 0.2, Object.assign({ top: Hr - 0.2 }, wallO));
        face(mb, e, 0, e.L, 0, Hr - 0.2, Hr, { layer: T('stucco'), us: 2, vs: 1, c: OCHRE });
        if (e.L > 7) pilasters(mb, e, n, H0, Hr, 0.7, 0.26, IVORY, true);
        cornice(mb, e, Hr, 0.6, 0.6, IVORY);
      }
      roof(mb, rear, Hr + 0.6);
    }
    for (const s of [-1, 1]) {
      const u0 = s < 0 ? -pw / 2 - 4.6 : pw / 2, u1 = s < 0 ? -pw / 2 : pw / 2 + 4.6;
      lbox(mb, f, u0, u1, -0.2, 0.62, H0, Ht + 0.8, { side: { layer: T('stucco'), us: 2, vs: 3, c: OCHRE }, top: { layer: T('stucco'), c: IVORY } });
      lbox(mb, f, u0 - 0.1, u1 + 0.1, -0.2, 0.72, 0, H0, { layer: T('redgranite'), us: 1.6, vs: 1.2, c: [150, 130, 124, 255] });
      lbox(mb, f, u0 + 1.2, u1 - 1.2, 0.6, 0.66, 4.2, 12.4, { layer: T('stucco'), us: 1, vs: 2, c: shade(OCHRE, 0.88) });
    }
    const half = f.L / 2;
    for (const s of [-1, 1]) {
      const u0 = s < 0 ? -half - 0.3 : half - 11.5, u1 = s < 0 ? -half + 11.5 : half + 0.3;
      const pv0 = -13, pv1 = 0.55, Hp = 18.6;
      const corners = lrect(f, u0, u1, pv0, pv1);
      for (const e of edges(corners)) {
        face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
        const n = bays(mb, e, H0, Ht, Object.assign({ top: Ht }, wallO));
        face(mb, e, 0, e.L, 0, Ht, Hp - 1.2, { layer: T('stucco'), us: 2, vs: 2, c: OCHRE });
        ebox(mb, e, -0.1, e.L + 0.1, -0.2, 0.16, Ht, Ht + 0.8, { layer: T('stucco'), us: 2, vs: 1, c: IVORY, noTop: true });
        pilasters(mb, e, n, H0, Hp - 1.2, 0.86, 0.34, IVORY, false);
        cornice(mb, e, Hp - 1.2, 0.85, 0.9, IVORY);
        balustrade(mb, e, Hp - 0.3, 1.15, 0.2, IVORY);
      }
      roof(mb, corners, Hp - 0.3);
    }
    lface(mb, f, -pw / 2, pw / 2, -pd, H0 - 0.2, 5.8, { layer: T('dkglass'), kind: K.FACADE, us: pw / 7, vs: 4.6, top: 5.8 });
    lface(mb, f, -pw / 2, pw / 2, -pd, 5.8, Ht, { layer: T('dkbay'), kind: K.FACADE, us: pw / 7, vs: 4.6, top: Ht });
    for (const s of [-1, 1]) {
      const u = s * pw / 2;
      const a = local(f, u, 0), c = local(f, u, -pd);
      if (s < 0) mb.wall(c[0], c[1], a[0], a[1], H0 - 0.2, Ht, { layer: T('stucco'), us: 2, vs: 3, c: OCHRE });
      else mb.wall(a[0], a[1], c[0], c[1], H0 - 0.2, Ht, { layer: T('stucco'), us: 2, vs: 3, c: OCHRE });
    }
    mb.polyFlat(lrect(f, -pw / 2, pw / 2, -pd, 0.2), Ht, { layer: T('stucco'), us: 2, c: IVORY, down: true });
    mb.polyFlat(lrect(f, -pw / 2, pw / 2, -pd, 0), 1.0, { layer: T('granite'), us: 2, c: [176, 166, 160, 255] });
    lbox(mb, f, -pw / 2, pw / 2, -pd, 0.18, Ht, Ht + 0.8, { side: { layer: T('stucco'), us: 2, vs: 1, c: IVORY }, top: { layer: T('tar') }, under: { c: IVORY } });
    lbox(mb, f, -pw / 2 - 0.4, pw / 2 + 0.4, -pd, 0.85, Ht + 0.8, Hc, { side: { layer: T('stucco'), us: 2, vs: 1, c: IVORY }, top: { layer: T('tar') }, under: { c: shade(IVORY, 0.86) } });
    for (let k = 0; k < 8; k++) {
      const u = -pw / 2 + 1.5 + k * (pw - 3) / 7;
      lbox(mb, f, u - 0.68, u + 0.68, -1.48, -0.12, 1.0, 1.36, { layer: T('stucco'), us: 1, vs: 1, c: IVORY });
      lcyl(mb, f, u, -0.8, 1.36, Ht - 0.55, 0.56, 0.5, 12, { layer: T('stucco'), us: 0.6, vs: 3, c: IVORY });
      lbox(mb, f, u - 0.7, u + 0.7, -1.5, -0.1, Ht - 0.55, Ht, { layer: T('stucco'), us: 1, vs: 1, c: IVORY });
    }
    for (let k = 0; k < 5; k++) {
      const v1 = 3.5 - k * 0.7;
      lbox(mb, f, -pw / 2 - 3, pw / 2 + 3, -0.1, v1, -0.2, 0.1 + (k + 1) * 0.18, { side: { layer: T('granite'), us: 1.5, vs: 1, c: [168, 158, 152, 255] }, top: { layer: T('granite'), us: 1.5, c: [182, 172, 166, 255] } });
    }
    const R = Math.min(5.4, pw * 0.18), RY = R * 0.66, seg = 14;
    const lun = (v, nz, col) => {
      mb.ensure(seg + 2, seg * 3);
      const c = local(f, 0, v);
      const base = mb.nv;
      mb.v(c[0], Hc, c[1], f.nx * nz, 0, f.nz * nz, 0.5, 1, col, T('stucco'), 0);
      for (let k = 0; k <= seg; k++) {
        const a = Math.PI * k / seg;
        const q = local(f, Math.cos(a) * R, v);
        mb.v(q[0], Hc + Math.sin(a) * RY, q[1], f.nx * nz, 0, f.nz * nz, 0.5 + Math.cos(a) * 0.5, 1 - Math.sin(a), col, T('stucco'), 0);
      }
      for (let k = 0; k < seg; k++) { if (nz > 0) mb.tri(base, base + k + 2, base + k + 1); else mb.tri(base, base + k + 1, base + k + 2); }
    };
    lun(0.05, 1, OCHRE);
    lun(-1.1, -1, OCHRE);
    for (let k = 0; k < seg; k++) {
      const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
      const q0 = local(f, Math.cos(a0) * (R + 0.25), 0.15), q1 = local(f, Math.cos(a1) * (R + 0.25), 0.15), r0 = local(f, Math.cos(a0) * (R + 0.25), -1.2), r1 = local(f, Math.cos(a1) * (R + 0.25), -1.2);
      const y0 = Hc + Math.sin(a0) * (RY + 0.25), y1 = Hc + Math.sin(a1) * (RY + 0.25);
      const am = (a0 + a1) / 2;
      const nx = Math.cos(am) * f.ux, nz = Math.cos(am) * f.uz;
      mb.quad([q0[0], y0, q0[1], q1[0], y1, q1[1], r1[0], y1, r1[1], r0[0], y0, r0[1]], [nx, Math.sin(am), nz], [0, 0, 1, 0, 1, 1, 0, 1], IVORY, T('stucco'), 0);
    }
    const fp = local(f, 0, -0.5);
    mb.box(fp[0] - 0.06, Hc + RY, fp[1] - 0.06, fp[0] + 0.06, Hc + RY + 5.5, fp[1] + 0.06, { layer: T('white'), c: [210, 210, 210, 255] });
    const cols = [[240, 240, 240, 255], [40, 70, 170, 255], [200, 40, 40, 255]];
    for (let i = 0; i < 3; i++) {
      const y = Hc + RY + 5.3 - i * 0.45;
      const a = local(f, 0.06, -0.5), c = local(f, 2.4, -0.5);
      mb.quad([a[0], y, a[1], c[0], y, c[1], c[0], y - 0.45, c[1], a[0], y - 0.45, a[1]], [f.nx, 0, f.nz], [0, 0, 1, 0, 1, 1, 0, 1], cols[i], T('white'), 0);
      mb.quad([c[0], y, c[1], a[0], y, a[1], a[0], y - 0.45, a[1], c[0], y - 0.45, c[1]], [-f.nx, 0, -f.nz], [0, 0, 1, 0, 1, 1, 0, 1], cols[i], T('white'), 0);
    }
    const tower = lrect(f, -13, 13, -31, -15);
    for (const e of edges(tower)) {
      face(mb, e, 0, e.L, 0, Hc - 0.5, 23.4, { layer: T('stucco'), us: 4, vs: 4, c: shade(OCHRE, 0.95) });
      cornice(mb, e, 23.4, 0.5, 0.5, IVORY);
    }
    roof(mb, tower, 23.9);
    geo.grow(geo.chunkAt(b.cx, b.cz), b.x0 - 6, b.z0 - 6, b.x1 + 6, b.z1 + 6, 32);
  };

  L.mir = (geo, mb, b) => {
    const lm = b.lm, f = frameOf(b, lm.front);
    const H0 = 0.9, Hf = 15.2, Hh = 17.5;
    const fxn = lm.fx, fzn = lm.fz, cut = lm.cut;
    const front = N.clipHalf(b.poly, -fxn, -fzn, -cut);
    const hall = N.clipHalf(b.poly, fxn, fzn, cut);
    const CREAM = [236, 228, 206, 255];
    const plinth = { layer: T('granite'), us: 1.6, vs: 1, c: [120, 116, 112, 255] };
    if (front) {
      for (const e of edges(front)) {
        const isFront = Math.abs(e.nx * f.nx + e.nz * f.nz) > 0.95 && (e.mx - f.mx) * f.nx + (e.mz - f.mz) * f.nz > -1;
        if (isFront) {
          const pw = 8.4, p0 = e.L / 2 - pw / 2 - 1.1, p1 = e.L / 2 + pw / 2 + 1.1;
          face(mb, e, 0, p0, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
          face(mb, e, p1, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
          const segs = [[0, e.L / 2 - pw / 2], [e.L / 2 + pw / 2, e.L]];
          for (const [s0, s1] of segs) if (s1 - s0 > 0.3) face(mb, e, s0, s1, 0, H0, Hf, { layer: T('creambay'), kind: K.FACADE, us: Math.max(2.8, (s1 - s0) / Math.max(1, Math.round((s1 - s0) / 3.6))), vs: 4.75, top: Hf, c: [255, 255, 250, 255] });
          face(mb, e, e.L / 2 - pw / 2, e.L / 2 + pw / 2, -0.4, 0.45, 6.4, { layer: T('dkglass'), kind: K.FACADE, us: pw / 3, vs: 5.95, top: 6.4 });
          face(mb, e, e.L / 2 - pw / 2, e.L / 2 + pw / 2, -0.4, 6.4, 11.6, { layer: T('tallwin'), kind: K.FACADE, us: pw / 3, vs: 5.2, top: 11.6 });
          face(mb, e, e.L / 2 - pw / 2, e.L / 2 + pw / 2, 0, 11.6, Hf, { layer: T('stucco'), us: 2, vs: 2, c: CREAM });
          const dark = { layer: T('granite'), us: 1, vs: 2, c: [70, 68, 70, 255] };
          ebox(mb, e, e.L / 2 - pw / 2 - 1.1, e.L / 2 - pw / 2, -0.4, 1.3, 0, 11.9, dark);
          ebox(mb, e, e.L / 2 + pw / 2, e.L / 2 + pw / 2 + 1.1, -0.4, 1.3, 0, 11.9, dark);
          ebox(mb, e, e.L / 2 - pw / 2 - 1.1, e.L / 2 + pw / 2 + 1.1, -0.4, 1.3, 11.0, 11.9, Object.assign({ under: { c: [60, 58, 60, 255] } }, dark));
          for (let k = 1; k < 4; k++) ebox(mb, e, e.L / 2 - pw / 2 - 0.9 + k * 0.05, e.L / 2 - pw / 2 - 0.85 + k * 0.05, -0.4, 1.3 - k * 0.3, 0, 11, dark);
          mb.polyFlat(erect(e, e.L / 2 - pw / 2, e.L / 2 + pw / 2, -0.4, 1.3), 6.4, { layer: T('stucco'), us: 2, c: [90, 88, 92, 255], down: true });
          for (let k = 0; k < 3; k++) ebox(mb, e, p0, p1, -0.4, 2.5 - k * 0.4, -0.2, 0.15 * (k + 1), { side: { layer: T('granite'), us: 1.5, vs: 1, c: [150, 146, 142, 255] }, top: { layer: T('granite'), us: 1.5, c: [168, 164, 160, 255] } });
        } else {
          face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
          bays(mb, e, H0, Hf, { layer: T('creambay'), kind: K.FACADE, bay: 3.6, vs: 4.75, top: Hf, c: [255, 255, 250, 255] });
        }
        cornice(mb, e, Hf, 0.55, 0.55, CREAM);
      }
      roof(mb, front, Hf + 0.55);
    }
    if (hall) {
      for (const e of edges(hall)) {
        const g = lm.galleries.find(q => { const w = edge(b.poly, q.i); return e.nx * w.nx + e.nz * w.nz > 0.99 && Math.abs((e.ax - w.ax) * w.nx + (e.az - w.az) * w.nz) < 0.3; });
        face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
        if (g) {
          face(mb, e, 0, e.L, 0, H0, 4.6, { layer: T('shopfront'), kind: K.FACADE, us: 4.2, vs: 3.7, top: 4.6 });
          const n = Math.max(1, Math.round(e.L / 4.2));
          face(mb, e, 0, e.L, 0, 4.6, Hh - 1.2, { layer: T('panelwall'), us: e.L / n, vs: Hh - 5.8, top: Hh - 1.2, c: CREAM });
          pilasters(mb, e, n, 5.2, Hh - 1.2, 0.7, 0.3, [242, 236, 218, 255], false);
          const w = edge(b.poly, g.i);
          const sOff = (e.ax - w.ax) * w.ux + (e.az - w.az) * w.uz;
          ebox(mb, e, -0.3, e.L + 0.3, 0, 3.25, 4.6, 5.25, { side: { layer: T('stucco'), us: 2, vs: 1, c: CREAM }, top: { layer: T('tar'), us: 3 }, under: { c: [214, 206, 186, 255] } });
          ebox(mb, e, -0.3, e.L + 0.3, 3.0, 3.25, 5.25, 5.6, { layer: T('stucco'), us: 2, vs: 1, c: CREAM });
          for (const u of g.us) {
            const s = u + w.L / 2 - sOff;
            if (s < -0.5 || s > e.L + 0.5) continue;
            ebox(mb, e, s - 0.36, s + 0.36, 2.5, 3.2, 0, 4.6, { layer: T('granite'), us: 0.8, vs: 2, c: [62, 60, 64, 255] });
          }
          const nb = g.us.length;
          for (let k = 0; k < nb - 1; k++) {
            const u = (g.us[k] + g.us[k + 1]) / 2;
            const s = u + w.L / 2 - sOff;
            if (s < 0 || s > e.L) continue;
            const q = ep(e, s, 2.5);
            if (k % 2 === 0) {
              const yaw = Math.atan2(e.nx, -e.nz);
              const st = statue(k + g.i);
              mb.append(st, q[0], 5.6, q[1], yaw, 1);
            } else {
              mb.box(q[0] - 0.22, 5.6, q[1] - 0.22, q[0] + 0.22, 6.2, q[1] + 0.22, { layer: T('stucco'), us: 1, vs: 1, c: [240, 236, 226, 255] });
              mb.cyl(q[0], q[1], 6.2, 6.62, 0.25, 0.25, 8, { layer: T('stucco'), us: 1, vs: 1, c: [222, 204, 150, 255], cap: true });
            }
          }
        } else {
          const n = Math.max(1, Math.round(e.L / 4.2));
          face(mb, e, 0, e.L, 0, H0, Hh - 1.2, { layer: T('panelwall'), us: e.L / n, vs: Hh - 2.1, top: Hh - 1.2, c: CREAM });
          if (e.L > 6) pilasters(mb, e, n, H0, Hh - 1.2, 0.7, 0.3, [242, 236, 218, 255], false);
        }
        cornice(mb, e, Hh - 1.2, 0.7, 0.75, CREAM);
        face(mb, e, 0, e.L, -0.25, Hh - 0.45, Hh, { layer: T('stucco'), us: 2, vs: 1, c: CREAM });
      }
      roof(mb, hall, Hh);
    }
    geo.grow(geo.chunkAt(b.cx, b.cz), b.x0 - 6, b.z0 - 6, b.x1 + 6, b.z1 + 6, Hh + 4);
  };

  L.um = (geo, mb, b) => {
    const lm = b.lm, d = lm.drum;
    const PEACH = [236, 204, 168, 255];
    const H0 = 0.8, Hw = 14, Hd = 17;
    const drumWalls = new Set(d ? d.walls : []);
    const plinth = { layer: T('granite'), us: 1.6, vs: 1, c: [128, 120, 112, 255] };
    for (const e of edges(b.poly)) {
      face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
      if (drumWalls.has(e.i)) {
        ebox(mb, e, -0.02, e.L + 0.02, 0, 1.2, -0.2, 0.15, { side: { layer: T('granite'), us: 1.5, vs: 1, c: [150, 146, 142, 255] }, top: { layer: T('granite'), us: 1.5, c: [168, 164, 160, 255] } });
        face(mb, e, 0, e.L, 0, H0, 4.4, { layer: T('glass'), kind: K.FACADE, us: e.L, vs: 3.6, top: 4.4 });
        ebox(mb, e, -0.05, e.L + 0.05, -0.1, 1.1, 4.4, 4.75, { layer: T('stucco'), us: 2, vs: 1, c: PEACH, under: { c: shade(PEACH, 0.8) } });
        face(mb, e, 0, e.L, 0, 4.75, 5.9, { layer: T('stucco'), us: 2, vs: 1, c: PEACH });
        ebox(mb, e, e.L * 0.3, e.L * 0.7, -0.05, 0.05, 5.0, 5.65, { layer: T('glass'), kind: K.FACADE, us: 1, vs: 1 });
        face(mb, e, 0.3, e.L - 0.3, -0.12, 5.9, 15.0, { layer: T('tallwin'), kind: K.FACADE, us: e.L - 0.6, vs: 9.1, top: 15.0 });
        ebox(mb, e, -0.12, 0.3, -0.12, 0.2, 5.9, 15.0, { layer: T('stucco'), us: 1, vs: 3, c: PEACH });
        ebox(mb, e, e.L - 0.3, e.L + 0.12, -0.12, 0.2, 5.9, 15.0, { layer: T('stucco'), us: 1, vs: 3, c: PEACH });
        ebox(mb, e, -0.15, e.L + 0.15, -0.2, 1.0, 15.0, 15.55, { layer: T('stucco'), us: 2, vs: 1, c: PEACH, under: { c: shade(PEACH, 0.82) } });
        face(mb, e, 0, e.L, -0.4, 15.55, Hd, { layer: T('stucco'), us: 2, vs: 1.5, c: PEACH });
        ebox(mb, e, -0.1, e.L + 0.1, -0.5, 0.0, Hd, Hd + 0.25, { layer: T('stucco'), us: 2, vs: 1, c: PEACH });
      } else {
        face(mb, e, 0, e.L, 0, H0, 4.2, { layer: T('shopfront'), kind: K.FACADE, us: e.L / Math.max(1, Math.round(e.L / 5)), vs: 3.4, top: 4.2 });
        face(mb, e, 0, e.L, 0, 4.2, 6.6, { layer: T('stucco'), us: 2.4, vs: 2.4, c: PEACH });
        face(mb, e, 0, e.L, 0, 6.6, 10.4, e.L > 6 ? { layer: T('glass'), kind: K.FACADE, us: e.L / Math.max(1, Math.round(e.L / 1.7)), vs: 3.8, top: 10.4 } : { layer: T('stucco'), us: 2.4, vs: 2.4, c: PEACH });
        if (e.L > 6) ebox(mb, e, 0, e.L, -0.05, 0.35, 10.4, 10.75, { layer: T('stucco'), us: 2, vs: 1, c: PEACH, under: { c: shade(PEACH, 0.8) } });
        face(mb, e, 0, e.L, 0, e.L > 6 ? 10.75 : 10.4, Hw, { layer: T('stucco'), us: 2.4, vs: 2.4, c: PEACH });
        ebox(mb, e, -0.4, e.L + 0.4, -0.2, 0.9, Hw, Hw + 0.45, { layer: T('stucco'), us: 2, vs: 1, c: PEACH, under: { c: shade(PEACH, 0.8) } });
      }
    }
    roof(mb, b.poly, Hw + 0.45);
    if (d) {
      const pts = d.pts, n = pts.length;
      mb.ensure(n + 1, n * 3);
      const base = mb.nv;
      mb.v(d.cx, Hd, d.cz, 0, 1, 0, d.cx / 6, d.cz / 6, [200, 200, 200, 255], T('tar'), 0);
      for (const q of pts) mb.v(q[0], Hd, q[1], 0, 1, 0, q[0] / 6, q[1] / 6, [200, 200, 200, 255], T('tar'), 0);
      for (let k = 0; k + 1 < n; k++) mb.tri(base, base + k + 2, base + k + 1);
      for (let k = 0; k + 1 < n; k++) mb.tri(base, base + k + 1, base + k + 2);
      for (const q of [pts[0], pts[n - 1]]) {
        mb.wall(d.cx, d.cz, q[0], q[1], Hw, Hd, { layer: T('stucco'), us: 2.4, vs: 2.4, c: PEACH });
        mb.wall(q[0], q[1], d.cx, d.cz, Hw, Hd, { layer: T('stucco'), us: 2.4, vs: 2.4, c: PEACH });
      }
      const Lt = d.letters, word = 9, R = Lt.R, step = Lt.step, mid = d.a0 + d.span / 2, dir = d.span > 0 ? 1 : -1;
      const yb = Lt.y - Lt.h / 2, yt = Lt.y + Lt.h / 2, steel = { layer: T('darkmetal'), c: [88, 90, 92, 255] };
      const ang = k => mid - dir * (k - (word - 1) / 2) * step;
      for (let k = 0; k < word; k++) {
        const a = ang(k), nx = Math.cos(a), nz = Math.sin(a), tx = -nz, tz = nx;
        for (const s of [-0.55, 0.55]) {
          const px = d.cx + nx * (R - 0.45) + tx * s, pz = d.cz + nz * (R - 0.45) + tz * s;
          mb.box(px - 0.05, Hd, pz - 0.05, px + 0.05, yt - 0.1, pz + 0.05, steel);
        }
        mb.obox(lrect({ ux: tx, uz: tz, nx, nz, mx: d.cx + nx * R, mz: d.cz + nz * R }, -0.78, 0.78, -0.3, -0.02), yb, yt, { layer: T('darkmetal'), c: [70, 70, 72, 255] });
      }
      for (const y of [yb + 0.3, yt - 0.35]) {
        for (let k = 0; k + 1 < word; k++) {
          const a0 = ang(k), a1 = ang(k + 1), am = (a0 + a1) / 2, rr = R - 0.45;
          const half = Math.abs(Math.sin((a1 - a0) / 2)) * rr + 0.6;
          mb.obox(lrect({ ux: -Math.sin(am), uz: Math.cos(am), nx: Math.cos(am), nz: Math.sin(am), mx: d.cx + Math.cos(am) * rr, mz: d.cz + Math.sin(am) * rr }, -half, half, -0.04, 0.04), y, y + 0.08, steel);
        }
      }
    }
    geo.grow(geo.chunkAt(b.cx, b.cz), b.x0 - 6, b.z0 - 6, b.x1 + 6, b.z1 + 6, 22);
  };

  L.gazadmin = (geo, mb, b) => {
    const lm = b.lm;
    const low = N.clipHalf(b.poly, 0, -1, -lm.cut) || b.poly;
    const YEL = [246, 222, 150, 255];
    const plinth = { layer: T('granite'), us: 1.6, vs: 1, c: [128, 120, 112, 255] };
    for (const e of edges(low)) {
      face(mb, e, 0, e.L, 0, -0.3, 0.8, Object.assign({ top: 0.8 }, plinth));
      face(mb, e, 0, e.L, 0, 0.8, 10.4, { layer: T('hotel'), kind: K.FACADE, us: e.L / Math.max(1, Math.round(e.L / 3.4)), vs: 3.2, fit: true, top: 10.4, c: YEL });
      cornice(mb, e, 10.4, 0.4, 0.8, [236, 230, 214, 255]);
    }
    roof(mb, low, 11.2);
    if (lm.tower) {
      const Ht = 44.2;
      for (const e of edges(lm.tower)) {
        face(mb, e, 0, e.L, 0, -0.3, 0.8, Object.assign({ top: 0.8 }, plinth));
        face(mb, e, 0, e.L, 0, 0.8, Ht, { layer: T('hotel'), kind: K.FACADE, us: e.L / Math.max(1, Math.round(e.L / 3.2)), vs: 3.4, fit: true, top: Ht, c: [250, 250, 246, 255] });
        face(mb, e, 0, e.L, 0, Ht, Ht + 1.8, { layer: T('stucco'), us: 3, vs: 2, c: [238, 236, 230, 255] });
      }
      roof(mb, lm.tower, Ht + 1.4);
      const tb = N.polyBounds(lm.tower);
      const cx = (tb.x0 + tb.x1) / 2, cz = (tb.z0 + tb.z1) / 2;
      mb.box(cx - 3, Ht + 1.4, cz - 3, cx + 3, Ht + 4.2, cz + 3, { side: { layer: T('stucco'), us: 2, vs: 2, c: [226, 224, 218, 255] }, top: { layer: T('tar') } });
      for (const k of [-2.6, 2.6]) mb.box(cx + lm.nz * k - 0.08 + lm.nx * 2, Ht + 1.4, cz - lm.nx * k - 0.08 + lm.nz * 2, cx + lm.nz * k + 0.08 + lm.nx * 2, Ht + 3.4, cz - lm.nx * k + 0.08 + lm.nz * 2, { layer: T('darkmetal'), c: [100, 100, 100, 255] });
    }
    geo.grow(geo.chunkAt(b.cx, b.cz), b.x0 - 6, b.z0 - 6, b.x1 + 6, b.z1 + 6, 56);
  };

  L.radius = (geo, mb, b) => {
    const front = new Set(b.lm.front);
    const H = b.h, H0 = 0.6, G = 4.2, top = H - 3.3;
    const CREAM = [255, 240, 206, 255], TERRA = [214, 140, 118, 255];
    const plinth = { layer: T('granite'), us: 1.6, vs: 1, c: [170, 120, 104, 255] };
    for (const e of edges(b.poly)) {
      const fr = front.has(e.i);
      const n = Math.max(1, Math.round(e.L / 3.6)), us = e.L / n;
      face(mb, e, 0, e.L, 0, -0.3, H0, Object.assign({ top: H0 }, plinth));
      face(mb, e, 0, e.L, 0, H0, G, fr ? { layer: T('shopfront'), kind: K.FACADE, us, vs: G - H0, top: G } : { layer: T('creambay'), kind: K.FACADE, us, vs: 3.4, fit: true, top: G, c: TERRA });
      face(mb, e, 0, e.L, 0, G, fr ? top : H, { layer: T('creambay'), kind: K.FACADE, us, vs: 3.05, fit: true, top: fr ? top : H, c: CREAM });
      ebox(mb, e, 0, e.L, 0, 0.25, G - 0.25, G, { layer: T('stucco'), us: 2, vs: 1, c: TERRA });
      if (fr) {
        face(mb, e, 0, e.L, -1.4, top, H, { layer: T('creambay'), kind: K.FACADE, us, vs: 3.3, fit: true, top: H, c: CREAM });
        mb.polyFlat(erect(e, 0, e.L, -1.4, 0), top, { layer: T('concrete'), us: 2, c: [210, 206, 196, 255] });
        for (let k = 0; k <= n; k++) {
          const q = ep(e, k * us, -0.3);
          mb.cyl(q[0], q[1], top, H - 0.35, 0.22, 0.2, 8, { layer: T('stucco'), us: 0.6, vs: 2, c: [248, 246, 240, 255] });
        }
        ebox(mb, e, -0.05, e.L + 0.05, -1.4, 0.05, top, top + 1.0, { layer: T('railing'), kind: K.DECAL, us: 0.7, vs: 1, c: [210, 210, 206, 255], noTop: true });
        const rows = Math.max(1, Math.round((top - G) / 3.05)), rh = (top - G) / rows;
        for (let f = 1; f < rows; f++) {
          const y = G + f * rh;
          for (let k = 0; k < n; k++) {
            if ((k + f) % 2) continue;
            const s0 = (k + 0.5) * us, c = ep(e, s0, 0);
            const seg = 8, r = 1.0;
            mb.ensure(seg + 2, seg * 3);
            const base = mb.v(c[0], y, c[1], 0, 1, 0, 0.5, 0.5, [236, 214, 170, 255], T('stucco'), 0);
            const ring = [];
            for (let i = 0; i <= seg; i++) {
              const a = Math.PI * i / seg;
              const px = c[0] + e.ux * Math.cos(a) * r + e.nx * Math.sin(a) * r, pz = c[1] + e.uz * Math.cos(a) * r + e.nz * Math.sin(a) * r;
              ring.push([px, pz, a]);
              mb.v(px, y, pz, 0, 1, 0, 0.5, 0.5, [236, 214, 170, 255], T('stucco'), 0);
            }
            for (let i = 0; i < seg; i++) { mb.tri(base, base + i + 2, base + i + 1); mb.tri(base, base + i + 1, base + i + 2); }
            for (let i = 0; i < seg; i++) {
              const [ax, az] = ring[i], [bx, bz] = ring[i + 1];
              mb.wall(bx, bz, ax, az, y - 0.32, y, { layer: T('stucco'), us: 1, vs: 1, c: [226, 196, 150, 255] });
              mb.wall(bx, bz, ax, az, y, y + 1.0, { layer: T('railing'), kind: K.DECAL, us: 0.7, vs: 1, v0: 0, c: [200, 200, 196, 255] });
              mb.wall(ax, az, bx, bz, y, y + 1.0, { layer: T('railing'), kind: K.DECAL, us: 0.7, vs: 1, v0: 0, c: [200, 200, 196, 255] });
            }
          }
        }
      }
      cornice(mb, e, H, 1.1, 0.5, CREAM);
    }
    roof(mb, b.poly, H + 0.5);
    geo.grow(geo.chunkAt(b.cx, b.cz), b.x0 - 4, b.z0 - 4, b.x1 + 4, b.z1 + 4, H + 3);
  };

  const limb = (mb, a, b, ra, rb, c, layer, seg) => {
    const n = seg || 6;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const ax = dx / L, ay = dy / L, az = dz / L;
    let px = -az, py = 0, pz = ax;
    if (Math.hypot(px, pz) < 0.2) { px = 1; py = 0; pz = 0; }
    const pl = Math.hypot(px, py, pz);
    px /= pl; py /= pl; pz /= pl;
    const qx = ay * pz - az * py, qy = az * px - ax * pz, qz = ax * py - ay * px;
    mb.ensure((n + 1) * 2 + 2, n * 12);
    const base = mb.nv;
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
      const nx = px * ct + qx * st, ny = py * ct + qy * st, nz = pz * ct + qz * st;
      mb.v(a[0] + nx * ra, a[1] + ny * ra, a[2] + nz * ra, nx, ny, nz, i / n, 1, c, layer, 0);
      mb.v(b[0] + nx * rb, b[1] + ny * rb, b[2] + nz * rb, nx, ny, nz, i / n, 0, c, layer, 0);
    }
    for (let i = 0; i < n; i++) { const k = base + i * 2; mb.tri(k, k + 2, k + 3); mb.tri(k, k + 3, k + 1); }
    const ca = mb.v(a[0], a[1], a[2], -ax, -ay, -az, 0.5, 0.5, c, layer, 0), cb = mb.v(b[0], b[1], b[2], ax, ay, az, 0.5, 0.5, c, layer, 0);
    for (let i = 0; i < n; i++) { const k = base + i * 2; mb.tri(ca, k + 2, k); mb.tri(cb, k + 1, k + 3); }
  };

  const head = (mb, x, y, z, r, c, layer) => {
    limb(mb, [x, y - r * 0.9, z], [x, y + r * 0.2, z], r * 0.62, r * 0.95, c, layer, 8);
    limb(mb, [x, y + r * 0.2, z], [x, y + r, z], r * 0.95, r * 0.35, c, layer, 8);
  };

  const lenin = (mb, c, lay) => {
    limb(mb, [0, 3.2, 0.05], [0, 5.25, 0], 0.62, 0.42, c, lay, 10);
    limb(mb, [-0.18, 3.2, 0], [-0.16, 4.2, 0], 0.17, 0.16, c, lay);
    limb(mb, [0.18, 3.2, 0.12], [0.16, 4.2, 0.05], 0.17, 0.16, c, lay);
    limb(mb, [0, 5.2, 0], [0, 6.05, -0.02], 0.44, 0.5, c, lay, 8);
    limb(mb, [-0.5, 5.9, 0], [0.5, 5.9, 0], 0.16, 0.16, c, lay);
    limb(mb, [0.46, 5.9, 0], [0.62, 6.3, -0.5], 0.13, 0.12, c, lay);
    limb(mb, [0.62, 6.3, -0.5], [0.78, 6.62, -1.05], 0.12, 0.1, c, lay);
    limb(mb, [-0.46, 5.9, 0], [-0.52, 5.25, 0.05], 0.13, 0.12, c, lay);
    limb(mb, [-0.52, 5.25, 0.05], [-0.42, 4.75, -0.18], 0.12, 0.1, c, lay);
    limb(mb, [0, 6.05, 0], [0, 6.25, 0], 0.11, 0.11, c, lay);
    head(mb, 0, 6.5, -0.02, 0.27, c, lay);
    limb(mb, [-0.27, 6.62, -0.02], [0.27, 6.62, -0.02], 0.2, 0.2, c, lay, 6);
  };

  const bust = (mb, c, lay) => {
    limb(mb, [0, 1.9, 0], [0, 2.42, 0], 0.46, 0.36, c, lay, 10);
    limb(mb, [-0.4, 2.3, 0], [0.4, 2.3, 0], 0.16, 0.16, c, lay);
    limb(mb, [0, 2.42, 0], [0, 2.6, 0], 0.12, 0.12, c, lay);
    head(mb, 0, 2.86, -0.02, 0.25, c, lay);
  };

  const monument0 = M.monument;
  M.monument = (mb, p) => {
    const bronze = [124, 108, 80, 255], lay = T('stucco');
    if (p.kind === 'lenin') {
      mb.box(-2.2, 0, -2.2, 2.2, 0.35, 2.2, { layer: T('granite'), us: 2, vs: 1, c: [170, 164, 158, 255] });
      mb.box(-1.4, 0.35, -1.4, 1.4, 3.2, 1.4, { layer: T('redgranite'), us: 1.4, vs: 1.4 });
      mb.box(-1.55, 3.0, -1.55, 1.55, 3.2, 1.55, { layer: T('redgranite'), us: 1.4, vs: 1.4, c: [210, 200, 196, 255] });
      lenin(mb, bronze, lay);
      return;
    }
    if (p.kind === 'bust') {
      mb.box(-0.62, 0, -0.62, 0.62, 0.3, 0.62, { layer: T('granite'), us: 1, vs: 1 });
      mb.box(-0.42, 0.3, -0.42, 0.42, 1.9, 0.42, { layer: T('redgranite'), us: 1, vs: 1 });
      bust(mb, bronze, lay);
      return;
    }
    monument0(mb, p);
  };

  const STATUES = new Map();
  function statue(seed) {
    const pose = seed % 4;
    if (STATUES.has(pose)) return STATUES.get(pose);
    const mb = new N.MB(256);
    const c = [244, 242, 236, 255], o = { layer: T('stucco'), us: 1, vs: 1, c };
    mb.box(-0.32, 0, -0.32, 0.32, 0.3, 0.32, o);
    mb.box(-0.2, 0.3, -0.12, -0.04, 1.2, 0.1, o);
    mb.box(0.04, 0.3, -0.12, 0.2, 1.2, 0.1, o);
    if (pose === 1) mb.box(-0.26, 0.4, -0.16, 0.26, 1.2, 0.14, o);
    mb.box(-0.24, 1.2, -0.14, 0.24, 1.82, 0.13, o);
    mb.box(-0.09, 1.82, -0.08, 0.09, 1.9, 0.08, o);
    mb.cyl(0, 0, 1.9, 2.16, 0.12, 0.1, 8, Object.assign({ cap: true }, o));
    if (pose === 0) { mb.box(0.24, 1.25, -0.06, 0.34, 1.8, 0.06, o); mb.box(-0.36, 1.78, -0.06, -0.26, 2.42, 0.06, o); }
    else if (pose === 1) { mb.box(0.24, 1.2, -0.06, 0.34, 1.8, 0.06, o); mb.box(-0.34, 1.5, -0.3, -0.24, 1.8, 0.04, o); mb.box(-0.34, 1.4, -0.42, -0.2, 1.62, -0.26, o); }
    else if (pose === 2) { mb.box(0.24, 1.2, -0.06, 0.34, 1.8, 0.06, o); mb.box(-0.34, 1.2, -0.06, -0.24, 1.8, 0.06, o); mb.box(-0.52, 1.1, -0.06, -0.3, 1.32, 0.06, o); }
    else { mb.box(0.24, 1.6, -0.36, 0.34, 1.8, 0.04, o); mb.box(-0.34, 1.2, -0.06, -0.24, 1.8, 0.06, o); mb.cyl(0, -0.48, 1.55, 1.85, 0.16, 0.16, 8, Object.assign({ cap: true }, o)); }
    STATUES.set(pose, mb);
    return mb;
  }

  M.parkgate = mb => {
    const Y = [232, 182, 70, 255], Wt = [244, 242, 234, 255], R = [150, 70, 50, 255], G = [222, 172, 46, 255];
    const diag = (us, vs) => ({ layer: T('diagboards'), us, vs, c: Y });
    const plinth = (u0, u1, d) => mb.box(u0, 0, -d, u1, 0.7, d, { layer: T('stucco'), us: 1, vs: 1, c: R });
    const leaf = (u, y, z, s) => {
      mb.quad([u, y - 0.55, z, u + 0.28 * s, y, z, u, y + 0.62, z, u - 0.28 * s, y, z], [0, 0, z < 0 ? -1 : 1], [0.5, 1, 1, 0.5, 0.5, 0, 0, 0.5], G, T('stucco'), 0);
      mb.quad([u, y - 0.2, z, u + 0.14 * s, y + 0.05, z, u, y + 0.35, z, u - 0.14 * s, y + 0.05, z], [0, 0, z < 0 ? -1 : 1], [0.5, 1, 1, 0.5, 0.5, 0, 0, 0.5], [246, 214, 120, 255], T('stucco'), 0);
    };
    const pier = (u, hw, h) => {
      plinth(u - hw - 0.1, u + hw + 0.1, 0.85);
      mb.box(u - hw, 0.7, -0.75, u + hw, h, 0.75, { side: { layer: T('boards'), us: 0.5, vs: 2, c: Y }, top: { layer: T('stucco'), c: Wt } });
      for (const x of [u - hw - 0.04, u + hw + 0.04]) mb.box(Math.min(x, x + Math.sign(x - u) * 0.06), 0.7, -0.42, Math.max(x, x + Math.sign(x - u) * 0.06), h - 1.9, 0.42, { layer: T('boards'), us: 0.3, vs: 2, c: Wt });
      for (const z of [-0.8, 0.8]) {
        const s = z < 0 ? -1 : 1;
        mb.box(u - hw * 0.58, 0.7, Math.min(z, z - s * 0.06), u + hw * 0.58, h - 1.9, Math.max(z, z - s * 0.06), { layer: T('boards'), us: 0.3, vs: 2, c: Wt });
        leaf(u, h - 1.3, z + s * 0.02, s);
        for (const side of [-1, 1]) for (let y = 1.3; y < h - 2.3; y += 0.62) {
          const x = u + side * hw * 0.8;
          mb.box(x - 0.07, y, Math.min(z, z - s * 0.06), x + 0.07, y + 0.32, Math.max(z, z - s * 0.06), { layer: T('stucco'), us: 1, vs: 1, c: Wt });
        }
      }
      mb.box(u - hw - 0.08, h - 2.2, -0.82, u + hw + 0.08, h - 1.9, 0.82, { layer: T('stucco'), us: 1, vs: 1, c: Y });
    };
    for (const [u, hw] of [[-15.2, 0.75], [-9.4, 0.75], [9.4, 0.75], [15.2, 0.75]]) pier(u, hw, 8.6);
    for (const s of [-1, 1]) {
      const u0 = s < 0 ? -4.45 : 2.35, u1 = s < 0 ? -2.35 : 4.45;
      plinth(u0 - 0.1, u1 + 0.1, 1.05);
      mb.box(u0, 0.7, -0.95, u1, 10.2, 0.95, { side: diag(8.9, 8.9), top: { layer: T('stucco'), c: Wt } });
      mb.box(s < 0 ? u1 - 0.1 : u0, 0.7, -0.97, s < 0 ? u1 : u0 + 0.1, 7.6, 0.97, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    }
    const arch = (u0, u1, yb, rise, d, col) => {
      const seg = 10, w = (u1 - u0) / 2, cu = (u0 + u1) / 2;
      for (let k = 0; k < seg; k++) {
        const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
        const x0 = cu - Math.cos(a0) * w, x1 = cu - Math.cos(a1) * w, y0 = yb + Math.sin(a0) * rise, y1 = yb + Math.sin(a1) * rise;
        mb.quad([x0, y0, -d, x1, y1, -d, x1, y1, d, x0, y0, d], [(Math.cos(a0) + Math.cos(a1)) / 2, -(Math.sin(a0) + Math.sin(a1)) / 2, 0], [0, 0, 1, 0, 1, 1, 0, 1], col, T('stucco'), 0);
      }
    };
    const trim = (u0, u1, yb, rise, z) => {
      const seg = 12, w = (u1 - u0) / 2, cu = (u0 + u1) / 2, sgn = z < 0 ? -1 : 1;
      for (let k = 0; k < seg; k++) {
        const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
        const p = (a, r) => [cu - Math.cos(a) * w * r, yb + Math.sin(a) * rise * r];
        const [ax, ay] = p(a0, 1), [bx, by] = p(a1, 1), [cx, cy] = p(a1, 1.09), [dx, dy] = p(a0, 1.09);
        const q = sgn < 0 ? [ax, ay, z, bx, by, z, cx, cy, z, dx, dy, z] : [bx, by, z, ax, ay, z, dx, dy, z, cx, cy, z];
        mb.quad(q, [0, 0, sgn], [0, 1, 1, 1, 1, 0, 0, 0], Wt, T('stucco'), 0);
      }
    };
    const span = (u0, u1, yb, top, rise, d, mat, uvs) => {
      const seg = 10, w = (u1 - u0) / 2, cu = (u0 + u1) / 2;
      for (const z of [-d, d]) {
        const sgn = z < 0 ? -1 : 1;
        for (let k = 0; k < seg; k++) {
          const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
          const x0 = cu - Math.cos(a0) * w, x1 = cu - Math.cos(a1) * w, y0 = yb + Math.sin(a0) * rise, y1 = yb + Math.sin(a1) * rise;
          const q = sgn < 0 ? [x0, y0, z, x1, y1, z, x1, top, z, x0, top, z] : [x1, y1, z, x0, y0, z, x0, top, z, x1, top, z];
          const uv = uvs ? (sgn < 0 ? [x0, y0, x1, y1, x1, top, x0, top] : [x1, y1, x0, y0, x0, top, x1, top]).map((v, i) => (i % 2 ? -v / uvs[1] : (v + uvs[0] / 2) / uvs[0])) : [0, 1, 1, 1, 1, 0, 0, 0];
          mb.quad(q, [0, 0, sgn], uv, Y, T(mat), 0);
        }
        trim(u0, u1, yb, rise, z * 1.01);
      }
      arch(u0, u1, yb, rise, d, Wt);
    };
    span(-14.45, -10.15, 6.4, 8.6, 2.0, 0.7, 'boards');
    span(-8.65, -4.45, 6.4, 8.6, 2.0, 0.7, 'boards');
    span(4.45, 8.65, 6.4, 8.6, 2.0, 0.7, 'boards');
    span(10.15, 14.45, 6.4, 8.6, 2.0, 0.7, 'boards');
    span(-2.35, 2.35, 7.6, 10.2, 2.35, 0.95, 'diagboards', [8.9, 8.9]);
    for (const u of [-14.45, -10.15, -8.65, -4.45, 4.45, 8.65, 10.15, 14.45]) {
      const s = u === -14.45 || u === -8.65 || u === 4.45 || u === 10.15 ? 1 : -1;
      for (const z of [-0.78, 0.78]) mb.box(Math.min(u, u + s * 0.45), 6.0, z - 0.06, Math.max(u, u + s * 0.45), 6.55, z + 0.06, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    }
    mb.box(-4.45, 10.2, -0.95, 4.45, 12.4, 0.95, { side: diag(8.9, 8.9), top: { layer: T('stucco'), c: Wt } });
    mb.box(-4.6, 12.3, -1.02, 4.6, 12.45, 1.02, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    mb.box(-3.6, 12.45, -0.9, 3.6, 12.95, 0.9, { side: diag(8.9, 8.9), top: { layer: T('stucco'), c: Wt } });
    mb.box(-3.7, 12.9, -0.96, 3.7, 13.02, 0.96, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    mb.box(-2.4, 13.02, -0.8, 2.4, 13.4, 0.8, { side: diag(8.9, 8.9), top: { layer: T('stucco'), c: Wt } });
    mb.box(-2.5, 13.36, -0.86, 2.5, 13.48, 0.86, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    const cy = 14.2, rr = 1.05;
    for (const z of [-0.12, 0.12]) {
      const sgn = z < 0 ? -1 : 1, nrm = [0, 0, sgn];
      for (let k = 0; k < 9; k++) {
        const a0 = Math.PI * k / 9, a1 = Math.PI * (k + 1) / 9, am = (a0 + a1) / 2;
        const p0 = [Math.cos(a0) * rr, cy + Math.sin(a0) * rr], p1 = [Math.cos(a1) * rr, cy + Math.sin(a1) * rr], pm = [Math.cos(am) * rr * 1.08, cy + Math.sin(am) * rr * 1.08];
        const col = k % 2 ? [236, 232, 220, 255] : [252, 250, 244, 255];
        const q = sgn < 0 ? [0, cy, z, p0[0], p0[1], z, pm[0], pm[1], z, p1[0], p1[1], z] : [0, cy, z, p1[0], p1[1], z, pm[0], pm[1], z, p0[0], p0[1], z];
        mb.quad(q, nrm, [0.5, 1, 0, 0, 0.5, 0, 1, 0], col, T('stucco'), 0);
      }
      for (const s of [-1, 1]) {
        const q = [s * rr, cy - 0.2, z, s * (rr + 0.45), cy - 0.75, z, s * (rr + 0.2), cy + 0.35, z, s * (rr - 0.05), cy + 0.2, z];
        mb.quad(sgn * s > 0 ? q : [q[9], q[10], q[11], q[6], q[7], q[8], q[3], q[4], q[5], q[0], q[1], q[2]], nrm, [0, 1, 1, 1, 1, 0, 0, 0], G, T('stucco'), 0);
      }
      mb.quad(sgn < 0 ? [-rr - 0.1, cy - 0.12, z, rr + 0.1, cy - 0.12, z, rr + 0.1, cy, z, -rr - 0.1, cy, z] : [rr + 0.1, cy - 0.12, z, -rr - 0.1, cy - 0.12, z, -rr - 0.1, cy, z, rr + 0.1, cy, z], nrm, [0, 1, 1, 1, 1, 0, 0, 0], G, T('stucco'), 0);
    }
    mb.box(-rr - 0.1, 13.48, -0.12, rr + 0.1, cy - 0.12, 0.12, { layer: T('stucco'), us: 1, vs: 1, c: G });
    mb.box(-0.05, cy + rr * 1.05, -0.05, 0.05, 17.6, 0.05, { layer: T('white'), c: [200, 200, 200, 255] });
    const cols = [[240, 240, 240, 255], [40, 70, 170, 255], [200, 40, 40, 255]];
    for (let i = 0; i < 3; i++) for (const z of [-0.01, 0.01]) mb.quad([0.05, 17.5 - i * 0.32, z, 1.6, 17.5 - i * 0.32, z, 1.6, 17.18 - i * 0.32, z, 0.05, 17.18 - i * 0.32, z], [0, 0, z < 0 ? -1 : 1], [0, 0, 1, 0, 1, 1, 0, 1], cols[i], T('white'), 0);
    for (const [u0, u1] of [[-15.95, -4.45], [4.45, 15.95]]) {
      mb.box(u0, 8.6, -0.85, u1, 9.0, 0.85, { side: { layer: T('stucco'), us: 1, vs: 1, c: Y }, top: { layer: T('stucco'), c: Wt } });
      mb.box(u0 - 0.05, 8.98, -0.9, u1 + 0.05, 9.08, 0.9, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
      for (const z of [-0.6, 0.6]) {
        const o = { layer: T('balustrade'), kind: K.DECAL, us: 2.2, vs: 1.0, v0: 0, c: Wt };
        mb.wall(u1, z - 0.02, u0, z - 0.02, 9.08, 10.0, o);
        mb.wall(u0, z + 0.02, u1, z + 0.02, 9.08, 10.0, o);
      }
      mb.box(u0, 9.95, -0.66, u1, 10.08, 0.66, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
      for (const u of [u0 + 0.3, (u0 + u1) / 2, u1 - 0.3]) mb.box(u - 0.3, 9.08, -0.75, u + 0.3, 10.25, 0.75, { side: { layer: T('boards'), us: 0.5, vs: 1, c: Y }, top: { layer: T('stucco'), c: Wt } });
    }
    const iron = { layer: T('metalfence'), kind: K.DECAL, us: 1.2, vs: 2.4, v0: 0, c: [40, 40, 42, 255] };
    const stars = (x0, z0, x1, z1, y) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.42));
      mb.wall(x1, z1, x0, z0, y - 0.18, y + 0.18, { layer: T('darkmetal'), c: [36, 36, 38, 255] });
      mb.wall(x0, z0, x1, z1, y - 0.18, y + 0.18, { layer: T('darkmetal'), c: [36, 36, 38, 255] });
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, ex = (x1 - x0) / L * 0.12, ez = (z1 - z0) / L * 0.12, nx = -(z1 - z0) / L * 0.012, nz = (x1 - x0) / L * 0.012;
        for (const s of [-1, 1]) mb.quad([x - ex + nx * s, y, z - ez + nz * s, x + nx * s, y - 0.13, z + nz * s, x + ex + nx * s, y, z + ez + nz * s, x + nx * s, y + 0.13, z + nz * s], [nx * s, 0, nz * s], [0, 0.5, 0.5, 1, 1, 0.5, 0.5, 0], G, T('chrome'), K.CHROME);
      }
    };
    for (const [u0, u1] of [[-14.45, -10.15], [-8.65, -4.45], [4.45, 8.65], [10.15, 14.45], [-2.35, 2.35]]) {
      const hw = (u1 - u0) / 2, open = 1.25;
      for (const [hu, s] of [[u0, 1], [u1, -1]]) {
        const ex = hu + s * Math.cos(open) * hw, ez = -0.3 - Math.sin(open) * hw;
        mb.wall(hu, -0.3, ex, ez, 0, 2.5, iron);
        mb.wall(ex, ez, hu, -0.3, 0, 2.5, iron);
        stars(hu, -0.3, ex, ez, 2.62);
      }
    }
    for (const u of [-15.2, -9.4, -3.4, 3.4, 9.4, 15.2]) {
      mb.cyl(u, -1.65, 0, 0.55, 0.3, 0.38, 10, { layer: T('stucco'), us: 1, vs: 1, c: Wt, cap: true, capLayer: T('flowers') });
      mb.cyl(u, -1.65, 0.55, 0.62, 0.42, 0.42, 10, { layer: T('stucco'), us: 1, vs: 1, c: Wt });
    }
  };

  M.gazportal = (mb, p) => {
    const D = p && p.d || 7;
    const RG = { layer: T('redgranite'), us: 1.4, vs: 1.4, c: WHITE };
    const RGd = { layer: T('redgranite'), us: 1.4, vs: 1.4, c: [200, 190, 188, 255] };
    const light = { layer: T('granite'), us: 1.6, vs: 1.6, c: [214, 208, 200, 255] };
    const iron = { layer: T('darkmetal'), c: [52, 54, 58, 255] };
    for (const s of [-1, 1]) {
      const u0 = s < 0 ? -14.4 : 10.4, u1 = s < 0 ? -10.4 : 14.4;
      mb.box(u0, 0, 0, u1, 11.6, D, RG);
      mb.box(u0 + 0.6, 1.2, -0.04, u1 - 0.6, 8.6, 0, light);
      mb.box(u0 + 0.6, 1.2, D, u1 - 0.6, 8.6, D + 0.04, light);
      for (let k = 0; k < 9; k++) mb.box(u0 + 1.0, 2.0 + k * 0.62, -0.07, u1 - 1.0, 2.2 + k * 0.62, -0.03, { layer: T('darkmetal'), c: [60, 56, 54, 255] });
      const ps = s < 0 ? -5.0 : 3.4;
      mb.box(ps, 0, 0.6, ps + 1.6, 9.2, D - 0.6, RG);
      const w0 = s < 0 ? -10.4 : 5.0, w1 = s < 0 ? -5.0 : 10.4, zc = D / 2;
      mb.box(w0, 0, zc - 0.05, w1, 0.12, zc + 0.05, iron);
      for (let x = w0 + 0.7; x < w1 - 0.5; x += 0.9) {
        mb.box(x - 0.12, 0, zc - 0.3, x + 0.12, 1.0, zc + 0.3, { layer: T('metal'), us: 1, vs: 1, c: [170, 172, 176, 255] });
        mb.box(x + 0.12, 0.85, zc - 0.02, x + 0.62, 0.9, zc + 0.02, { layer: T('chrome'), kind: K.CHROME, c: [210, 214, 220, 255] });
      }
      const bk = s < 0 ? w0 : w1 - 2.2;
      mb.box(bk, 0, zc + 1.2, bk + 2.2, 2.6, zc + 3.4, { side: { layer: T('glass'), kind: K.FACADE, us: 2.2, vs: 2.6 }, top: { layer: T('tar') } });
      mb.box(bk - 0.05, 2.6, zc + 1.15, bk + 2.25, 2.72, zc + 3.45, { layer: T('metal'), us: 1, vs: 1, c: [120, 122, 126, 255] });
    }
    mb.box(-14.4, 9.2, 0, 14.4, 11.6, D, Object.assign({ top: { layer: T('tar'), us: 4 } }, RG));
    mb.flat(-10.4, 0, 10.4, D, 9.18, { layer: T('redgranite'), us: 1.4, c: [150, 130, 126, 255], down: true });
    mb.flat(-10.4, 0, 10.4, D, 0.02, { layer: T('concrete'), us: 3 });
    for (let k = 1; k < Math.round(D / 3.5); k++) mb.box(-3.4, 8.6, k * D / Math.round(D / 3.5) - 0.06, 3.4, 9.18, k * D / Math.round(D / 3.5) + 0.06, RGd);
    for (const z of [0, D - 0.5]) {
      for (let k = 0; k <= 9; k++) {
        const u = -14.4 + k * 28.8 / 9;
        mb.box(Math.max(-14.4, u - 0.32), 11.6, z, Math.min(14.4, u + 0.32), 15.4, z + 0.5, RGd);
      }
      mb.box(-14.4, 15.0, z, 14.4, 15.4, z + 0.5, RGd);
      mb.box(-14.4, 11.6, z, 14.4, 12.0, z + 0.5, RGd);
    }
    for (const u of [-14.4, 13.9]) mb.box(u, 11.6, 0, u + 0.5, 15.4, D, RGd);
    const C = N.GAZ_CREST, cw = C.w / 2 + 0.3;
    mb.box(-cw, 15.4, 0, cw, C.y + C.h / 2 + 0.15, C.d, RG);
    mb.box(-4.6, 12.0, 0.05, 4.6, 15.0, 0.4, RG);
    const med = [[226, 182, 70, 255], [220, 60, 50, 255], [226, 182, 70, 255], [220, 60, 50, 255]];
    for (let k = 0; k < 4; k++) {
      const cx = -3.3 + k * 2.2, cy = 13.8, seg = 12;
      mb.ensure(seg + 2, seg * 3);
      const base = mb.v(cx, cy, -0.06, 0, 0, -1, 0.5, 0.5, med[k], T('chrome'), K.CHROME);
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; mb.v(cx + Math.cos(a) * 0.72, cy + Math.sin(a) * 0.72, -0.06, 0, 0, -1, 0.5 + Math.cos(a) * 0.5, 0.5 - Math.sin(a) * 0.5, med[k], T('chrome'), K.CHROME); }
      for (let i = 0; i < seg; i++) mb.tri(base, base + i + 2, base + i + 1);
    }
  };

  M.fountain = (mb, p) => {
    const r = p.r || 6;
    mb.cyl(0, 0, 0, 0.62, r, r, 24, { layer: T('granite'), us: 2, vs: 1, c: [196, 190, 182, 255] });
    mb.cyl(0, 0, 0.62, 0.72, r + 0.15, r + 0.15, 24, { layer: T('granite'), us: 2, vs: 1, c: [210, 204, 196, 255], cap: true, capLayer: T('granite') });
    mb.cyl(0, 0, 0.6, 0.73, r - 0.35, r - 0.35, 24, { layer: T('water'), kind: K.WATER, us: 4, vs: 1, cap: true, capLayer: T('water') });
    mb.cyl(0, 0, 0.7, 2.2, 0.55, 0.32, 12, { layer: T('granite'), us: 1, vs: 1, c: [200, 194, 186, 255] });
    mb.cyl(0, 0, 2.2, 2.55, 1.6, 1.9, 16, { layer: T('granite'), us: 1, vs: 1, c: [206, 200, 192, 255], cap: true, capLayer: T('water') });
    mb.cyl(0, 0, 2.55, 4.9, 0.14, 0.04, 8, { layer: T('white'), kind: K.EMIT, us: 1, vs: 1, c: [150, 170, 185, 255] });
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, x = Math.cos(a) * (r - 1.2), z = Math.sin(a) * (r - 1.2);
      mb.cyl(x, z, 0.72, 1.9, 0.07, 0.03, 6, { layer: T('white'), kind: K.EMIT, us: 1, vs: 1, c: [150, 170, 185, 255] });
    }
  };

  M.mosaicstand = mb => {
    mb.box(-3.7, 0, -0.4, 3.7, 0.9, 0.4, { layer: T('granite'), us: 1.5, vs: 1, c: [150, 146, 142, 255] });
    mb.box(-3.5, 0.9, -0.3, 3.5, 9.0, 0.3, { side: { layer: T('stucco'), us: 2, vs: 2, c: [236, 234, 228, 255] }, top: { layer: T('stucco'), c: [236, 234, 228, 255] } });
  };

  N.Landmarks = {
    L,
    statue,
    kit: { edge, edges, ep, erect, face, ebox, limb },
    build(geo, mb, b) {
      const fn = b.lm && L[b.lm.type];
      if (!fn) return false;
      fn(geo, mb, b);
      return true;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
