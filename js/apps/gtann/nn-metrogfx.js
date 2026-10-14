(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const MT = N.METRO, P = MT.P, TR = MT.TR, OZ = MT.OZ;
  const C = (c, a) => [c[0], c[1], c[2], a === undefined ? 255 : a];

  const LOOK = {
    pk: { floor: ['mgranite', [150, 146, 140]], edge: [206, 202, 194], wall: ['marble', [238, 230, 212]], low: [92, 88, 82], lamp: [255, 176, 92] },
    kir: { floor: ['marble', [224, 206, 172]], band: [126, 126, 130], edge: [200, 198, 194], wall: ['marble', [74, 66, 64]], frame: [242, 238, 230], col: [244, 242, 236], colIn: [148, 148, 152], low: [60, 58, 56], panel: 'mosaic', lamp: [255, 246, 226] },
    kom: { floor: ['mgranite', [88, 88, 92]], web: [236, 234, 230], edge: [196, 194, 190], base: ['mgranite', [74, 74, 78]], wall: ['redgranite', [214, 158, 160]], col: [242, 240, 236], low: [58, 58, 62], lamp: [255, 244, 228] },
    avt: { floor: ['mgranite', [144, 144, 146]], inlay: [30, 30, 32], edge: [204, 202, 198], wall: ['marble', [226, 218, 200]], col: [168, 168, 172], low: [70, 68, 66], panel: 'auto', lamp: [255, 248, 232] }
  };
  const VEST_LAMP = { lamp: [255, 248, 232] };

  const xwall = (mb, x0, x1, z, y0, y1, o, face) => mb.wall(face > 0 ? Math.min(x0, x1) : Math.max(x0, x1), z, face > 0 ? Math.max(x0, x1) : Math.min(x0, x1), z, y0, y1, o);
  const zwall = (mb, z0, z1, x, y0, y1, o, face) => mb.wall(x, face > 0 ? Math.max(z0, z1) : Math.min(z0, z1), x, face > 0 ? Math.min(z0, z1) : Math.max(z0, z1), y0, y1, o);
  const bx = (mb, x0, y0, z0, x1, y1, z1, o) => mb.box(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), o);

  function bar(mb, ax, az, bx2, bz, w, y0, y1, side, top) {
    const dx = bx2 - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2;
    mb.quad([ax + nx, y1, az + nz, bx2 + nx, y1, bz + nz, bx2 - nx, y1, bz - nz, ax - nx, y1, az - nz], [0, 1, 0], [0, 0, L, 0, L, 1, 0, 1], top.c, top.layer, top.kind || 0);
    for (const s of [1, -1]) mb.quad([ax + nx * s, y0, az + nz * s, bx2 + nx * s, y0, bz + nz * s, bx2 + nx * s, y1, bz + nz * s, ax + nx * s, y1, az + nz * s], [-dz / L * s, 0, dx / L * s], [0, 1, L, 1, L, 0, 0, 0], side.c, side.layer, side.kind || 0);
  }

  const RAIL_SIDE = { layer: 0, c: [92, 72, 58, 255] }, RAIL_TOP = { layer: 0, c: [196, 196, 200, 255] };
  function rails(mb, xa, za, xb, zb, outer, light) {
    RAIL_SIDE.layer = T('darkmetal');
    RAIL_TOP.layer = T('metal');
    const dx = xb - xa, dz = zb - za, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, hw = 1.3, y = P.bed + 0.02, a = light || 150;
    mb.quad([xa + nx * hw, y, za + nz * hw, xb + nx * hw, y, zb + nz * hw, xb - nx * hw, y, zb - nz * hw, xa - nx * hw, y, za - nz * hw], [0, 1, 0], [1, 0, 1, L / 3.3, 0, L / 3.3, 0, 0], [150, 150, 150, a], T('sleepers'), 0);
    for (const s of [-0.762, 0.762]) bar(mb, xa + nx * s, za + nz * s, xb + nx * s, zb + nz * s, 0.075, P.bed + 0.04, P.rail, RAIL_SIDE, RAIL_TOP);
    if (outer) {
      const o = outer * 1.45;
      bar(mb, xa + nx * o, za + nz * o, xb + nx * o, zb + nz * o, 0.09, P.bed + 0.12, P.bed + 0.33, RAIL_SIDE, RAIL_SIDE);
      bar(mb, xa + nx * (o + outer * 0.04), za + nz * (o + outer * 0.04), xb + nx * (o + outer * 0.04), zb + nz * (o + outer * 0.04), 0.34, P.bed + 0.42, P.bed + 0.46, { layer: T('plank'), c: [96, 70, 48, a] }, { layer: T('plank'), c: [110, 82, 56, a] });
    }
  }

  function stairs(mb, xa, xb, z0, z1, ya, yb, n, o, nose) {
    const s = Math.sign(xb - xa);
    for (let k = 0; k < n; k++) {
      const u0 = xa + (xb - xa) * k / n, u1 = xa + (xb - xa) * (k + 1) / n, y0 = ya + (yb - ya) * k / n, y1 = ya + (yb - ya) * (k + 1) / n;
      const un = nose ? u0 + s * 0.05 : u0;
      mb.flat(Math.min(un, u1), z0, Math.max(un, u1), z1, y1, o);
      zwall(mb, z0, z1, u0, y0, y1, o, -s);
      if (nose) mb.flat(Math.min(u0, un), z0, Math.max(u0, un), z1, y1, nose);
    }
  }

  function sign(mb, A, key, x, y, z, nx, nz, w, h, kind, back) {
    const uv = A[key];
    if (!uv) return;
    N.signFace(mb, x + nx * 0.03, y, z + nz * 0.03, nx, nz, w, h, uv, kind, back);
  }

  function signW(A, key, h) { const uv = A[key]; return uv ? h * uv[4] : 0; }

  function lampStrip(mb, x0, x1, z0, z1, y, look) {
    mb.flat(Math.min(x0, x1) - 0.05, Math.min(z0, z1) - 0.05, Math.max(x0, x1) + 0.05, Math.max(z0, z1) + 0.05, y - 0.015, { layer: T('darkmetal'), c: [180, 180, 180, 255], down: true });
    mb.flat(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y - 0.035, { layer: T('white'), kind: K.EMIT, c: C(look.lamp), down: true });
  }

  function station(G, q, A, city) {
    const mb = new N.MB(65536);
    const L = LOOK[q.id], X = q.x, x0 = X - P.end, x1 = X + P.end;
    const flo = { layer: T(L.floor[0]), us: 2, c: C(L.floor[1]) };
    mb.flat(x0, OZ - P.edge, x1, OZ + P.edge, 0, flo);
    const deco = (a0, b0, a1, b1, c, layer) => mb.flat(Math.min(a0, a1), Math.min(b0, b1), Math.max(a0, a1), Math.max(b0, b1), 0.016, { layer: T(layer || 'mgranite'), us: 1, c: C(c) });
    for (const sd of [-1, 1]) {
      deco(x0, OZ + sd * (P.edge - 0.5), x1, OZ + sd * P.edge, L.edge);
      deco(x0, OZ + sd * (P.edge - 0.56), x1, OZ + sd * (P.edge - 0.502), [60, 58, 56]);
      xwall(mb, x0, x1, OZ + sd * P.edge, P.bed, 0, { layer: T('concrete'), us: 3, vs: 1.25, c: [96, 94, 90, 190] }, sd);
      mb.flat(x0, OZ + sd * P.edge, x1, OZ + sd * P.wall, P.bed, { layer: T('concrete'), us: 3, c: [86, 84, 80, 170] });
      rails(mb, x0, OZ + sd * P.track, x1, OZ + sd * P.track, sd, 170);
    }
    if (L.band) for (const sd of [-1, 1]) deco(x0 + 1, OZ + sd * 2.55, x1 - 1, OZ + sd * 3.35, L.band);
    if (L.band) for (let u = -36; u <= 36; u += 6) deco(X + u - 0.25, OZ - 2.55, X + u + 0.25, OZ + 2.55, L.band);
    if (L.inlay) {
      for (let u = -36; u <= 36; u += 6) deco(X + u - 0.18, OZ - 4.24, X + u + 0.18, OZ + 4.24, L.inlay, 'marble');
      for (const sd of [-1, 1]) deco(x0 + 1, OZ + sd * 4.25, x1 - 1, OZ + sd * 4.4, L.inlay, 'marble');
    }
    if (L.web) {
      for (const dir of [1, -1]) for (let u0 = -62; u0 <= 52; u0 += 3) {
        let ua = u0, va = -4.4, ub = u0 + 8.8, vb = 4.4;
        if (dir < 0) { va = 4.4; vb = -4.4; }
        if (ua < -50) { const k = (-50 - ua) / (ub - ua); ua = -50; va = va + (vb - va) * k; }
        if (ub > 50) { const k = (ub - 50) / (ub - ua); ub = 50; vb = vb - (vb - va) * k; }
        if (ub - ua < 0.5) continue;
        const ax = X + ua, az = OZ + va, bx2 = X + ub, bz2 = OZ + vb, dx = bx2 - ax, dz = bz2 - az, l = Math.hypot(dx, dz), nx = -dz / l * 0.035, nz = dx / l * 0.035;
        const wy = dir > 0 ? 0.035 : 0.055;
        mb.quad([ax + nx, wy, az + nz, bx2 + nx, wy, bz2 + nz, bx2 - nx, wy, bz2 - nz, ax - nx, wy, az - nz], [0, 1, 0], [0, 0, l, 0, l, 0.1, 0, 0.1], C(L.web), T('marble'), 0);
      }
    }
    const wallTop = q.vault ? 3.4 : P.ceil;
    for (const sd of [-1, 1]) {
      const z = OZ + sd * P.wall, f = -sd;
      xwall(mb, x0, x1, z, P.bed, 0.05, { layer: T('concrete'), us: 3, vs: 1.3, c: C(L.low, 210) }, f);
      if (L.base) {
        xwall(mb, x0, x1, z, 0.05, 1.2, { layer: T(L.base[0]), us: 1.5, vs: 1.5, c: C(L.base[1]) }, f);
        xwall(mb, x0, x1, z + f * 0.016, 1.18, 1.24, { layer: T('marble'), us: 2, vs: 1, c: [236, 234, 230, 255] }, f);
        xwall(mb, x0, x1, z, 1.2, wallTop, { layer: T(L.wall[0]), us: 1.6, vs: 1.6, c: C(L.wall[1]) }, f);
      } else xwall(mb, x0, x1, z, 0.05, wallTop, { layer: T(L.wall[0]), us: 2, vs: 2, c: C(L.wall[1]) }, f);
      if (L.frame) {
        xwall(mb, x0, x1, z + f * 0.02, 0.05, 0.38, { layer: T('marble'), us: 2, vs: 2, c: C(L.frame) }, f);
        xwall(mb, x0, x1, z + f * 0.02, wallTop - 0.42, wallTop, { layer: T('marble'), us: 2, vs: 2, c: C(L.frame) }, f);
      }
      const nameKey = 'mname|' + q.name.toUpperCase(), nh = q.vault ? 0.62 : 0.56, nw = signW(A, nameKey, nh);
      for (const u of [-39, -13, 13, 39]) {
        if (L.panel === 'auto' && (u === -13 || u === 13)) {
          xwall(mb, X + u - 1.6, X + u + 1.6, z + f * 0.02, 0.9, 3.5, { layer: T('autopanel'), us: 3.2, vs: 2.6, v0: 0, c: [255, 255, 255, 255] }, f);
          continue;
        }
        if (L.frame) xwall(mb, X + u - nw / 2 - 0.25, X + u + nw / 2 + 0.25, z + f * 0.03, 2.2 - 0.12, 2.2 + nh + 0.12, { layer: T('marble'), us: 2, vs: 2, c: C(L.frame) }, f);
        sign(mb, A, nameKey, X + u, (q.vault ? 2.3 : 2.2) + nh / 2, z + f * 0.02, 0, f, nw + 0.01, nh, K.ATLAS);
      }
    }
    if (q.vault) {
      const seg = 18, hy = 3.6;
      for (let i = 0; i < seg; i++) {
        const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg;
        const va = -Math.cos(a0) * P.wall, vb = -Math.cos(a1) * P.wall, ya = 3.4 + Math.sin(a0) * hy, yb = 3.4 + Math.sin(a1) * hy;
        const am = (a0 + a1) / 2, ny = -Math.sin(am), nz = Math.cos(am);
        mb.quad([x0, ya, OZ + va, x1, ya, OZ + va, x1, yb, OZ + vb, x0, yb, OZ + vb], [0, ny, nz], [0, va / 3, 104 / 3, va / 3, 104 / 3, vb / 3, 0, vb / 3], [240, 236, 226, 255], T('plaster'), 0);
      }
      for (const u of [-39, -26, -13, 0, 13, 26, 39]) chandelier(G, mb, X + u, OZ, L);
    } else {
      const ends = [-1, 1].map(e => q.ends[e] ? X + e * 38 : X + e * P.end);
      mb.flat(ends[0], OZ - P.wall, ends[1], OZ + P.wall, P.ceil, { layer: T('white'), us: 4, c: [222, 222, 216, 255], down: true });
      for (let u = -36; u <= 36; u += P.colStep) bx(mb, X + u - 0.3, P.ceil - 0.36, OZ - P.wall + 0.03, X + u + 0.3, P.ceil - 0.03, OZ + P.wall - 0.03, { noTop: true, layer: T('white'), us: 2, vs: 1, c: [214, 214, 208, 255] });
      for (let u = -33; u <= 33; u += P.colStep) {
        for (const v of [-1.5, 1.5]) lampStrip(mb, X + u - 1.9, X + u + 1.9, OZ + v - 0.16, OZ + v + 0.16, P.ceil, L);
        for (const v of [-5.6, 5.6]) lampStrip(mb, X + u - 1.6, X + u + 1.6, OZ + v - 0.12, OZ + v + 0.12, P.ceil, L);
      }
      for (const sd of [-1, 1]) for (let u = -P.colU; u <= P.colU + 0.01; u += P.colStep) column(mb, X + u, OZ + sd * P.colV, L);
    }
    for (const u of q.benches) {
      const tmp = new N.MB(256);
      N.Props.M.bench(tmp);
      mb.append(tmp, X + u, 0, OZ - 0.26, 0);
      mb.append(tmp, X + u, 0, OZ + 0.26, Math.PI);
    }
    for (const e of [-1, 1]) endWall(G, mb, q, e, A, L, city);
    G.segs.push(seg(mb, X - P.land - 2, X + P.land + 2, OZ - 15, OZ + 15, P.bed - 1, 11));
  }

  function chandelier(G, mb, x, z, L) {
    const brass = { layer: T('metal'), c: [214, 178, 98, 255] };
    mb.box(x - 0.04, 4.75, z - 0.04, x + 0.04, 7.0, z + 0.04, brass);
    mb.cyl(x, z, 4.62, 4.75, 1.15, 1.15, 16, Object.assign({ cap: true }, brass));
    mb.cyl(x, z, 4.1, 4.62, 0.35, 0.95, 16, { layer: T('metal'), c: [190, 150, 80, 255] });
    mb.cyl(x, z, 4.08, 4.1, 0.34, 0.34, 12, { layer: T('white'), kind: K.EMIT, c: C(L.lamp), cap: true });
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, lx = x + Math.cos(a) * 1.15, lz = z + Math.sin(a) * 1.15;
      mb.box(lx - 0.02, 4.75, lz - 0.02, lx + 0.02, 4.92, lz + 0.02, brass);
      mb.box(lx - 0.1, 4.92, lz - 0.1, lx + 0.1, 5.16, lz + 0.1, { layer: T('white'), kind: K.EMIT, c: C(L.lamp) });
    }
    G.glows.push({ x, y: 4.95, z, s: 2.4, c: [255, 170, 80, 120] });
  }

  function column(mb, x, z, L) {
    const m = { layer: T('marble'), us: 1.4, vs: 1.4, c: C(L.col) };
    mb.box(x - 0.42, 0, z - 0.42, x + 0.42, 0.16, z + 0.42, { layer: T('mgranite'), us: 1, vs: 1, c: [80, 80, 84, 255] });
    mb.box(x - 0.35, 0.16, z - 0.35, x + 0.35, P.ceil - 0.62, z + 0.35, Object.assign({ noTop: true }, m));
    mb.box(x - 0.43, P.ceil - 0.62, z - 0.43, x + 0.43, P.ceil - 0.38, z + 0.43, m);
    if (L.colIn) {
      const c = C(L.colIn), o = 0.366;
      xwall(mb, x - 0.08, x + 0.08, z + o, 0.7, 3.0, { layer: T('marble'), us: 0.5, vs: 1, c }, 1);
      xwall(mb, x - 0.08, x + 0.08, z - o, 0.7, 3.0, { layer: T('marble'), us: 0.5, vs: 1, c }, -1);
      zwall(mb, z - 0.08, z + 0.08, x + o, 0.7, 3.0, { layer: T('marble'), us: 0.5, vs: 1, c }, 1);
      zwall(mb, z - 0.08, z + 0.08, x - o, 0.7, 3.0, { layer: T('marble'), us: 0.5, vs: 1, c }, -1);
    }
  }

  function endWall(G, mb, q, e, A, L, city) {
    const X = q.x, E = q.ends[e], xe = X + e * P.end, f = -e;
    const U = u => X + e * u;
    const top = q.vault ? 3.4 : E ? P.high : P.ceil;
    const wm = { layer: T(L.wall[0] === 'redgranite' ? 'marble' : L.wall[0]), us: 2, vs: 2, c: C(L.base ? [214, 206, 200] : L.wall[1]) };
    for (const sd of [-1, 1]) {
      const zi = OZ + sd * (P.track - P.tun), zo = OZ + sd * P.wall;
      zwall(mb, zi, zo, xe, P.tunTop, top, wm, f);
      mb.flat(Math.min(xe, xe + e * 0.6), Math.min(zi, zo), Math.max(xe, xe + e * 0.6), Math.max(zi, zo), P.tunTop, { layer: T('concrete'), us: 2, c: [70, 68, 64, 110], down: true });
      zwall(mb, OZ + sd * (E ? 3 : 0), zi, xe, 0, top, wm, f);
      xwall(mb, xe, xe + e * 0.6, zi, P.bed, P.tunTop, { layer: T('concrete'), us: 2, vs: 2, c: [70, 68, 64, 120] }, sd);
      const dep = sd > 0 ? e > 0 : e < 0;
      if (dep) {
        const cz = OZ + sd * P.track, cy = P.tunTop + 0.45, cx = xe + f * 0.16;
        bx(mb, xe + f * 0.03, cy - 0.32, cz - 1.0, cx, cy + 0.32, cz + 1.0, { layer: T('darkmetal'), c: [40, 40, 42, 255] });
        G.clocks.push({ st: q.i, track: sd > 0 ? 0 : 1, x: cx + f * 0.035, y: cy, z: cz, nx: f });
        G.signals.push({ st: q.i, track: sd > 0 ? 0 : 1, x: xe + e * 1.2, y: 1.2, z: OZ + sd * (P.track + 2.0) });
      }
      const gx = U(P.half) + e * 0.5;
      bx(mb, gx - 0.03, 0, OZ + sd * (P.track - P.tun), gx + 0.03, 1.1, OZ + sd * P.edge, { layer: T('darkmetal'), c: [60, 64, 70, 255] });
      for (const y of [0.45, 1.05]) bx(mb, gx - 0.045, y, OZ + sd * (P.track - P.tun + 0.03), gx + 0.045, y + 0.04, OZ + sd * (P.edge - 0.03), { layer: T('metal'), c: [200, 60, 50, 255] });
    }
    if (!E) {
      if (q.vault) vaultCap(mb, xe, f, 0);
      return;
    }
    if (q.vault) vaultCap(mb, xe, f, 3);
    else {
      zwall(mb, OZ - 3, OZ + 3, xe, P.vestTop, top, wm, f);
      const xs = U(38);
      zwall(mb, OZ - P.wall, OZ + P.wall, xs, P.ceil, top, wm, -f);
      mb.flat(Math.min(xs, xe), OZ - P.wall, Math.max(xs, xe), OZ + P.wall, top, { layer: T('white'), us: 4, c: [222, 222, 216, 255], down: true });
      lampStrip(mb, U(42), U(49), OZ - 4.2, OZ - 3.9, top, L);
      lampStrip(mb, U(42), U(49), OZ + 3.9, OZ + 4.2, top, L);
      for (const sd of [-1, 1]) xwall(mb, xs, xe, OZ + sd * P.wall, P.ceil, top, { layer: T(L.wall[0]), us: 2, vs: 2, c: C(L.wall[1]) }, -sd);
      if (L.panel === 'mosaic') zwall(mb, OZ - 4.2, OZ + 4.2, xs - f * 0.03, 5.0, 8.4, { layer: T('mosaic'), us: 16.8, vs: 3.4, v0: 0, u0: 0.5, c: [255, 255, 255, 255] }, -f);
      else if (L.panel === 'auto') zwall(mb, OZ - 3.2, OZ + 3.2, xs - f * 0.03, 5.0, 8.2, { layer: T('autopanel'), us: 6.4, vs: 3.2, v0: 0, c: [255, 255, 255, 255] }, -f);
      else { const key = 'mname|' + q.name.toUpperCase(); sign(mb, A, key, xs, 6.6, OZ, -f, 0, signW(A, key, 0.9), 0.9, K.ATLAS); }
    }
    stairs(mb, U(P.s0), U(P.s1), OZ - 2.86, OZ + 2.86, 0, P.top, 30, { layer: T('mgranite'), us: 1, c: [176, 172, 166, 255] }, { layer: T('mgranite'), us: 1, c: [214, 212, 206, 255] });
    for (const sd of [-1, 1]) parapet(mb, X, e, OZ + sd * 3, L);
    if (!E.open) closedEnd(mb, q, e, A);
    else vestibule(G, mb, q, E, A, L, city);
  }

  function vaultCap(mb, xe, f, hole) {
    const seg = 18, pts = [];
    for (let i = 0; i <= seg; i++) { const a = Math.PI * i / seg; pts.push([-Math.cos(a) * P.wall, 3.4 + Math.sin(a) * 3.6]); }
    const c = [236, 230, 216, 255];
    for (let i = 0; i < seg; i++) {
      const [va, ya] = pts[i], [vb, yb] = pts[i + 1];
      const lo = Math.abs((va + vb) / 2) < hole ? 6.8 : 3.4;
      if (Math.min(ya, yb) <= lo) continue;
      mb.quad([xe, lo, OZ + va, xe, lo, OZ + vb, xe, yb, OZ + vb, xe, ya, OZ + va], [f, 0, 0], [0, 1, 1, 1, 1, 0, 0, 0], c, T('plaster'), 0);
    }
  }

  function parapet(mb, X, e, z, L) {
    const m = { layer: T('marble'), us: 1, vs: 1, c: C(L.col || [230, 226, 216]) };
    const xa = X + e * (P.s0 - 1.5), xb = X + e * P.s0, xc = X + e * P.s1;
    bx(mb, xa, 0, z - 0.13, xb, 1.0, z + 0.13, m);
    for (const s of [-1, 1]) {
      const zz = z + s * 0.13;
      mb.quad([xb, 0, zz, xc, 0, zz, xc, P.top + 1.0, zz, xb, 1.0, zz], [0, 0, s], [0, 1, 4, 1, 4, 0, 0, 0], m.c, m.layer, 0);
    }
    mb.quad([xb, 1.0, z - 0.13, xc, P.top + 1.0, z - 0.13, xc, P.top + 1.0, z + 0.13, xb, 1.0, z + 0.13], [0, 1, 0], [0, 0, 4, 0, 4, 0.2, 0, 0.2], m.c, m.layer, 0);
  }

  function closedEnd(mb, q, e, A) {
    const X = q.x, U = u => X + e * u, f = -e;
    mb.flat(Math.min(U(P.s1), U(P.end + 2)), OZ - 3, Math.max(U(P.s1), U(P.end + 2)), OZ + 3, P.top, { layer: T('mgranite'), us: 1, c: [170, 166, 160, 255] });
    for (const sd of [-1, 1]) xwall(mb, U(P.end), U(P.end + 2.2), OZ + sd * 3, P.top, P.vestTop, { layer: T('marble'), us: 2, vs: 2, c: [210, 204, 196, 255] }, -sd);
    mb.flat(Math.min(U(P.end), U(P.end + 2.2)), OZ - 3, Math.max(U(P.end), U(P.end + 2.2)), OZ + 3, P.vestTop, { layer: T('plaster'), us: 2, c: [200, 198, 192, 255], down: true });
    zwall(mb, OZ - 3, OZ + 3, U(P.end + 2.2), P.top, P.vestTop, { layer: T('tar'), us: 2, vs: 2, c: [30, 30, 32, 255] }, f);
    const gx = U(P.end + 1.6);
    for (let v = -2.87; v <= 2.88; v += 0.14) bx(mb, gx - 0.015, P.top, OZ + v - 0.015, gx + 0.015, P.vestTop - 0.2, OZ + v + 0.015, { layer: T('darkmetal'), c: [52, 54, 58, 255] });
    for (const y of [P.top + 0.1, P.top + 1.2, P.vestTop - 0.3]) bx(mb, gx - 0.03, y, OZ - 2.97, gx + 0.03, y + 0.08, OZ + 2.97, { layer: T('darkmetal'), c: [52, 54, 58, 255] });
    sign(mb, A, 'msign|ПРОХОДА НЕТ', gx + f * 0.1, P.top + 2.4, OZ, f, 0, 2.6, 0.42, K.SIGN, [50, 50, 54, 255]);
  }

  function vestibule(G, mb, q, E, A, L, city) {
    const X = q.x, e = E.e, f = -e, U = u => X + e * u, hw = E.W / 2, y0 = P.top, y1 = P.vestTop;
    const wall = { layer: T('marble'), us: 2, vs: 2, c: q.id === 'kom' ? [224, 196, 194, 255] : q.id === 'kir' ? [232, 226, 214, 255] : [234, 228, 212, 255] };
    const skirt = { layer: T('mgranite'), us: 1, vs: 1, c: [86, 84, 82, 255] };
    mb.flat(Math.min(U(P.s1), U(P.vest)), OZ - hw, Math.max(U(P.s1), U(P.vest)), OZ + hw, y0, { layer: T('mgranite'), us: 2, c: [182, 176, 166, 255] });
    for (const sd of [-1, 1]) mb.flat(Math.min(U(P.end), U(P.vest)), OZ + sd * (hw - 0.5), Math.max(U(P.end), U(P.vest)), OZ + sd * hw, y0 + 0.016, { layer: T('mgranite'), us: 1, c: [96, 94, 92, 255] });
    mb.flat(Math.min(U(P.end), U(P.vest)), OZ - hw, Math.max(U(P.end), U(P.vest)), OZ + hw, y1, { layer: T('white'), us: 3, c: [222, 222, 216, 255], down: true });
    for (let u = 55; u <= 78; u += 4.5) for (let v = -hw + 2.2; v <= hw - 2; v += 4.4) lampStrip(mb, U(u) - 0.55, U(u) + 0.55, OZ + v - 0.55, OZ + v + 0.55, y1, VEST_LAMP);
    for (const sd of [-1, 1]) {
      const z = OZ + sd * hw;
      xwall(mb, U(P.end), U(P.vest), z, y0, y0 + 0.3, skirt, -sd);
      xwall(mb, U(P.end), U(P.vest), z, y0 + 0.3, y1, wall, -sd);
      zwall(mb, OZ + sd * 3, z, U(P.end + 0.3), y0, y1, wall, e);
      xwall(mb, U(P.end), U(P.end + 0.3), OZ + sd * 3, y0, y1, wall, -sd);
    }
    zwall(mb, OZ - 3, OZ + 3, U(P.end + 0.3), y1 - 0.4, y1, wall, e);
    let last = -hw;
    const outer = U(P.vest);
    for (const g of E.exits) {
      zwall(mb, OZ + last, OZ + g.v - 1.6, outer, y0, y1, wall, f);
      zwall(mb, OZ + g.v - 1.6, OZ + g.v + 1.6, outer, P.exitTop, y1, wall, f);
      last = g.v + 1.6;
      exitStair(G, mb, q, E, g, A, L);
    }
    zwall(mb, OZ + last, OZ + hw, outer, y0, y1, wall, f);
    const tx0 = U(P.cab), tx1 = U(P.cab + 1.4);
    const steel = { layer: T('white'), us: 1, vs: 1, c: [150, 160, 170, 255] };
    for (const v of MT.LANES) {
      bx(mb, tx0, y0, OZ + v - 0.13, tx1, y0 + 0.95, OZ + v + 0.13, steel);
      bx(mb, tx0, y0 + 0.95, OZ + v - 0.15, tx1, y0 + 1.0, OZ + v + 0.15, { layer: T('darkmetal'), c: [48, 50, 54, 255] });
      zwall(mb, OZ + v - 0.09, OZ + v + 0.09, tx1 + e * 0.014, y0 + 0.7, y0 + 0.88, { layer: T('white'), kind: K.EMIT, c: [80, 255, 120, 255] }, e);
      zwall(mb, OZ + v - 0.09, OZ + v + 0.09, tx0 - e * 0.014, y0 + 0.7, y0 + 0.88, { layer: T('white'), kind: K.EMIT, c: [255, 60, 40, 255] }, f);
    }
    const glassPane = (va0, vb0) => {
      const va = va0 + 0.03, vb = vb0 - 0.06;
      if (vb - va < 0.1) return;
      const gx = U(P.turn);
      bx(mb, gx - 0.12, y0, OZ + va, gx + 0.12, y0 + 0.9, OZ + vb, { side: { layer: T('marble'), us: 1, vs: 1, c: [196, 188, 176, 255] }, top: { layer: T('mgranite'), us: 1, c: [90, 88, 86, 255] } });
      for (let v = va; v <= vb + 0.01; v += Math.max(0.12, (vb - va) / Math.ceil((vb - va) / 0.14))) bx(mb, gx - 0.012, y0 + 0.9, OZ + v - 0.012, gx + 0.012, y0 + 2.14, OZ + v + 0.012, { layer: T('darkmetal'), c: [96, 100, 106, 255] });
      bx(mb, gx - 0.04, y0 + 2.14, OZ + va, gx + 0.04, y0 + 2.22, OZ + vb, { layer: T('darkmetal'), c: [96, 100, 106, 255] });
    };
    glassPane(-hw, MT.LANES[0] - 0.13);
    glassPane(MT.BOOTH[1], hw);
    bx(mb, U(P.cab - 1.3), y0, OZ + MT.BOOTH[0], U(P.cab + 1.4), y0 + 2.3, OZ + MT.BOOTH[1], { side: { layer: T('booth'), us: 2.7, vs: 2.3, c: [230, 230, 226, 255] }, top: { layer: T('tar'), us: 2 } });
    bx(mb, U(P.cab - 1.4), y0 + 2.3, OZ + MT.BOOTH[0] - 0.1, U(P.cab + 1.5), y0 + 2.42, OZ + MT.BOOTH[1] + 0.1, { layer: T('darkmetal'), c: [60, 80, 120, 255] });
    const hang = (key, u, v, w, h, face) => {
      const uv = A[key];
      if (!uv) return;
      const x = U(u);
      for (const d of [-w * 0.35, w * 0.35]) bx(mb, x - 0.01, y1 - 0.5, OZ + v + d - 0.01, x + 0.01, y1 - 0.05, OZ + v + d + 0.01, { layer: T('darkmetal'), c: [80, 80, 84, 255] });
      bx(mb, x - 0.05, y1 - 0.5 - h - 0.06, OZ + v - w / 2 - 0.06, x + 0.05, y1 - 0.5, OZ + v + w / 2 + 0.06, { layer: T('darkmetal'), c: [60, 60, 64, 255] });
      N.signFace(mb, x + face * 0.08, y1 - 0.5 - h / 2 - 0.03, OZ + v, face, 0, w, h, uv, K.SIGN);
    };
    hang('msign|ВХОД', P.cab + 2.2, -2.1, 1.3, 0.34, e);
    hang('msign|ВЫХОД', P.cab - 1.4, MT.EXIT_V, 1.3, 0.34, f);
    hang('msign|К ПОЕЗДАМ', P.cab + 5, -1.0, 2.6, 0.42, e);
    hang('msign|ВЫХОД В ГОРОД', P.s1 + 3.6, 0.8, 3.1, 0.42, f);
    const kz = OZ - hw + 0.01;
    for (const u of [67, 70.5]) {
      xwall(mb, U(u) - 0.65, U(u) + 0.65, kz + 0.025, y0 + 1.15, y0 + 2.05, { layer: T('glass'), us: 1.3, vs: 0.9, v0: 0, c: [255, 236, 190, 255], kind: K.EMIT }, 1);
      xwall(mb, U(u) - 0.75, U(u) + 0.75, kz, y0 + 1.05, y0 + 2.15, { layer: T('darkmetal'), c: [60, 50, 40, 255] }, 1);
      sign(mb, A, 'msign|КАССА', U(u), y0 + 2.45, kz + 0.02, 0, 1, 1.4, 0.36, K.SIGN);
    }
    bx(mb, U(66), y0, OZ - hw + 0.03, U(72), y0 + 1.1, OZ - hw + 0.6, { side: { layer: T('marble'), us: 1, vs: 1, c: [150, 120, 100, 255] }, top: { layer: T('mgranite'), us: 1, c: [70, 66, 62, 255] } });
    sign(mb, A, 'msign|ПРОДАЖА ЖЕТОНОВ', U(68.75), y0 + 3.05, kz + 0.02, 0, 1, 2.6, 0.36, K.SIGN);
    sign(mb, A, 'msign|СТОИМОСТЬ ПРОЕЗДА 5 РУБ.', U(63.5), y0 + 2.3, kz + 0.02, 0, 1, 3.4, 0.4, K.SIGN);
    const pz = OZ + hw - 0.01;
    xwall(mb, U(64) - 0.55, U(64) + 0.55, pz - 0.02, y0, y0 + 2.1, { layer: T('booth'), us: 1.1, vs: 2.1, v0: 0, c: [120, 110, 100, 255] }, -1);
    sign(mb, A, 'msign|МИЛИЦИЯ', U(64), y0 + 2.45, pz - 0.02, 0, -1, 1.8, 0.36, K.SIGN);
    xwall(mb, U(76.5) - 1.3, U(76.5) + 1.3, pz - 0.025, y0 + 1.1, y0 + 2.5, { layer: T('metromap'), us: 2.6, vs: 1.4, v0: 0, c: [255, 255, 255, 255] }, -1);
    const ads = Object.keys(A).filter(k => k.startsWith('billboard|'));
    if (ads.length) sign(mb, A, ads[(q.i * 2 + (e > 0 ? 1 : 0)) % ads.length], U(75.5), y0 + 1.9, kz + 0.06, 0, 1, 3.6, 1.35, K.SIGN, [40, 40, 44, 255]);
    if (q.vault) zwall(mb, OZ - hw + 1, OZ - 3.6, U(P.end) + e * 0.02, y0 + 0.8, y0 + 3.4, { layer: T('mosaic'), us: (hw - 4.6) * 2, vs: 2.6, v0: 0, u0: e < 0 ? 0 : 0.5, c: [255, 255, 255, 255] }, e);
    const tmp = new N.MB(512);
    N.Props.M.kiosk(tmp, { text: 'СОЮЗПЕЧАТЬ' }, { map: A });
    mb.append(tmp, E.kiosk.x, y0, E.kiosk.z, E.kiosk.rot);
    if (E.bust) {
      const b = new N.MB(2048);
      N.Props.M.monument(b, { kind: 'bust' }, { map: A });
      mb.append(b, E.bust.x, y0, E.bust.z, e > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }

  function exitStair(G, mb, q, E, g, A, L) {
    const X = q.x, e = E.e, f = -e, U = u => X + e * u, va = OZ + g.v - 1.6, vb = OZ + g.v + 1.6;
    const wall = { layer: T('marble'), us: 2, vs: 2, c: [226, 222, 212, 255] };
    stairs(mb, U(P.vest), U(P.exitEnd), va, vb, P.top, P.exitTop, 18, { layer: T('mgranite'), us: 1, c: [170, 166, 160, 255] }, { layer: T('mgranite'), us: 1, c: [212, 208, 200, 255] });
    mb.flat(Math.min(U(P.exitEnd), U(P.land)), va, Math.max(U(P.exitEnd), U(P.land)), vb, P.exitTop, { layer: T('mgranite'), us: 1, c: [176, 172, 166, 255] });
    for (const s of [-1, 1]) {
      const z = s < 0 ? va : vb;
      mb.quad([U(P.vest), P.top, z, U(P.exitEnd), P.exitTop, z, U(P.exitEnd), P.exitTop + 2.8, z, U(P.vest), P.top + 2.8, z], [0, 0, -s], [0, 1, 3.5, 1, 3.5, 0, 0, 0], wall.c, wall.layer, 0);
      xwall(mb, U(P.exitEnd), U(P.land), z, P.exitTop, P.exitTop + 2.8, wall, -s);
      const hz = z - s * 0.05;
      mb.quad([U(P.vest), P.top + 0.86, hz, U(P.exitEnd), P.exitTop + 0.86, hz, U(P.exitEnd), P.exitTop + 0.92, hz, U(P.vest), P.top + 0.92, hz], [0, 0, -s], [0, 1, 4, 1, 4, 0, 0, 0], [92, 70, 48, 255], T('plank'), 0);
      mb.quad([U(P.vest), P.top + 0.92, hz, U(P.exitEnd), P.exitTop + 0.92, hz, U(P.exitEnd), P.exitTop + 0.92, hz + s * 0.05, U(P.vest), P.top + 0.92, hz + s * 0.05], [0, 1, 0], [0, 1, 4, 1, 4, 0, 0, 0], [110, 84, 58, 255], T('plank'), 0);
    }
    mb.quad([U(P.vest), P.top + 2.8, va, U(P.exitEnd), P.exitTop + 2.8, va, U(P.exitEnd), P.exitTop + 2.8, vb, U(P.vest), P.top + 2.8, vb], [0, -1, 0], [0, 0, 3.5, 0, 3.5, 1.6, 0, 1.6], [222, 222, 216, 255], T('white'), 0);
    mb.flat(Math.min(U(P.exitEnd), U(P.land)), va, Math.max(U(P.exitEnd), U(P.land)), vb, P.exitTop + 2.8, { layer: T('white'), us: 2, c: [222, 222, 216, 255], down: true });
    lampStrip(mb, U(P.exitEnd) + e * 0.3, U(P.land) - e * 0.3, OZ + g.v - 0.3, OZ + g.v + 0.3, P.exitTop + 2.8, VEST_LAMP);
    zwall(mb, va, vb, U(P.land), P.exitTop, P.exitTop + 2.8, wall, f);
    bx(mb, U(P.land) - e * 0.02, P.exitTop, OZ + g.v - 1.25, U(P.land) - e * 0.12, P.exitTop + 2.5, OZ + g.v + 1.25, { layer: T('darkmetal'), c: [70, 70, 74, 255] });
    G.exits.push({ x: U(P.land) - e * 0.13, y: P.exitTop + 1.2, z: OZ + g.v, nx: f, w: 2.3, h: 2.35 });
    sign(mb, A, 'msign|' + g.sign, U(P.vest), P.exitTop + 0.62, OZ + g.v, f, 0, 3.2, 0.42, K.SIGN);
    if (g.sub) sign(mb, A, 'msign|' + g.sub, U(P.vest), P.exitTop + 0.2, OZ + g.v, f, 0, 3.0, 0.28, K.SIGN);
  }

  function tunnel(G, t) {
    const len = t.xb - t.xa, n = Math.max(1, Math.ceil(len / 160));
    for (let i = 0; i < n; i++) {
      const xa = t.xa + len * i / n, xb = t.xa + len * (i + 1) / n;
      const mb = new N.MB(8192);
      const wallC = [134, 132, 126, 120], ceilC = [116, 114, 110, 92], floorC = [100, 98, 94, 120];
      const tubes = t.wide ? [[OZ - P.wall - 0.4, OZ + P.wall + 0.4]] : [-1, 1].map(sd => [OZ + Math.min(sd * (P.track - P.tun), sd * (P.track + P.tun)), OZ + Math.max(sd * (P.track - P.tun), sd * (P.track + P.tun))]);
      for (const [za, zb] of tubes) {
        mb.flat(xa, za, xb, zb, P.bed, { layer: T('concrete'), us: 3, c: floorC });
        mb.flat(xa, za, xb, zb, P.tunTop, { layer: T('concrete'), us: 3, c: ceilC, down: true });
        xwall(mb, xa, xb, za, P.bed, P.tunTop, { layer: T('concrete'), us: 3, vs: 2.4, c: wallC }, 1);
        xwall(mb, xa, xb, zb, P.bed, P.tunTop, { layer: T('concrete'), us: 3, vs: 2.4, c: wallC }, -1);
      }
      for (const sd of [-1, 1]) {
        const zc = OZ + sd * P.track, zo = OZ + sd * (t.wide ? P.wall + 0.4 : P.track + P.tun);
        rails(mb, xa, zc, xb, zc, sd, 90);
        for (const [k, y] of [[0, 0.32], [1, 0.48], [2, 0.64], [3, 1.6]]) bx(mb, xa, y, zo - sd * (0.05 + k * 0.012), xb, y + (k === 3 ? 0.05 : 0.07), zo - sd * (0.12 + k * 0.012), { layer: T('darkmetal'), c: [26, 26, 26, 160] });
        for (let x = Math.ceil(xa / 25) * 25; x < xb; x += 25) {
          bx(mb, x - 0.16, 2.42, zo - sd * 0.02, x + 0.16, 2.64, zo - sd * 0.16, { layer: T('darkmetal'), c: [50, 50, 50, 200] });
          xwall(mb, x - 0.12, x + 0.12, zo - sd * 0.185, 2.46, 2.6, { layer: T('white'), kind: K.EMIT, c: [255, 236, 196, 255] }, -sd);
          G.tlamps.push({ x, y: 2.5, z: zo - sd * 0.4 });
        }
        for (let x = Math.ceil(xa / 200) * 200 + 100; x < xb; x += 200) {
          bx(mb, x - 0.12, 1.3, zo - sd * 0.02, x + 0.12, 1.85, zo - sd * 0.2, { layer: T('darkmetal'), c: [30, 30, 30, 220] });
          G.signals.push({ x, y: 1.72, z: zo - sd * 0.22, line: true, track: sd > 0 ? 0 : 1 });
        }
      }
      G.segs.push(seg(mb, xa - 1, xb + 1, OZ - 10, OZ + 10, P.bed - 1, P.tunTop + 1));
    }
  }

  function deadEnds(G, L, A) {
    const mb = new N.MB(8192);
    const [A0, B0] = [L.st[0].x, L.st[L.st.length - 1].x];
    rails(mb, A0 - TR.cross[1], L.zW, A0 - TR.cross[0], L.zE, 0, 90);
    rails(mb, B0 + TR.cross[1], L.zE, B0 + TR.cross[0], L.zW, 0, 90);
    for (const [x, f, text] of [[L.deadW - 12, 1, 'msign|ПРОХОД ЗАПРЕЩЁН'], [L.deadE + 12, -1, 'msign|РЕМОНТНЫЕ РАБОТЫ']]) {
      zwall(mb, OZ - P.wall - 0.4, OZ + P.wall + 0.4, x, P.bed, P.tunTop, { layer: T(f > 0 ? 'concrete' : 'brick5'), us: 2, vs: 1.5, c: [150, 140, 130, 90] }, f);
      for (const sd of [-1, 1]) {
        const z = OZ + sd * P.track;
        bx(mb, x + f * 0.03, P.bed, z - 1.2, x + f * 0.3, P.bed + 1.0, z + 1.2, { layer: T('barrier'), us: 2.4, vs: 1, c: [255, 255, 255, 120] });
        for (const d of [-0.9, 0.9]) {
          bx(mb, x + f * 0.32, 0.9, z + d - 0.1, x + f * 0.36, 1.1, z + d + 0.1, { layer: T('white'), kind: K.EMIT, c: [255, 40, 30, 255] });
          G.glows.push({ x: x + f * 0.4, y: 1.0, z: z + d, s: 0.7, c: [255, 40, 30, 200] });
        }
        sign(mb, A, text, x + f * 0.02, 2.4, z, f, 0, 3.0, 0.4, K.SIGN);
      }
    }
    G.segs.push(seg(mb, L.deadW - 20, L.deadE + 20, OZ - 10, OZ + 10, P.bed - 1, P.tunTop + 1));
  }

  function localUV(mb) {
    const n = mb.nv, par = new Int32Array(n), F = mb.f;
    for (let i = 0; i < n; i++) par[i] = i;
    const root = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    for (let i = 0; i < mb.ni; i += 3) { const a = root(mb.idx[i]); par[root(mb.idx[i + 1])] = a; par[root(mb.idx[i + 2])] = a; }
    const mu = new Float64Array(n).fill(Infinity), mv = new Float64Array(n).fill(Infinity);
    for (let i = 0; i < n; i++) { const r = root(i); if (F[i * 8 + 4] < mu[r]) mu[r] = F[i * 8 + 4]; if (F[i * 8 + 5] < mv[r]) mv[r] = F[i * 8 + 5]; }
    for (let i = 0; i < n; i++) { const r = root(i); F[i * 8 + 4] -= Math.floor(mu[r]); F[i * 8 + 5] -= Math.floor(mv[r]); }
    return mb;
  }
  N.metroLocalUV = localUV;

  function seg(mb, x0, x1, z0, z1, y0, y1) { return { mb: localUV(mb), x0, x1, z0, z1, y0, y1 }; }

  N.MetroGeo = {
    build(geo) {
      const city = geo.city, L = city.metroLine;
      if (!L) return null;
      const A = geo.atlas.map;
      const G = { segs: [], tlamps: [], clocks: [], signals: [], exits: [], glows: [] };
      for (const q of L.st) station(G, q, A, city);
      for (const t of L.tunnels) tunnel(G, t);
      deadEnds(G, L, A);
      return G;
    }
  };

  const CARS = {};
  const PAINT = { blue: [46, 88, 164, 255], light: [146, 186, 222, 255], stripe: [236, 238, 236, 255], roof: [132, 136, 140, 255], skirt: [36, 60, 112, 255], under: [36, 36, 38, 255], frame: [30, 30, 32, 255] };

  function holes(list, a, b) {
    const out = [];
    let cur = a;
    for (const [h0, h1] of list.slice().sort((p, q) => p[0] - q[0])) {
      if (h1 <= cur || h0 >= b) continue;
      if (h0 > cur) out.push([cur, h0]);
      cur = Math.max(cur, h1);
    }
    if (cur < b) out.push([cur, b]);
    return out;
  }

  function windowsOf(cab) {
    const out = [];
    for (const [a, b] of [[-9.35, -7.52], [-6.28, -2.92], [-1.68, 1.68], [2.92, 6.28], [7.52, 9.35]]) {
      if (cab && a < -TR.cab + 0.2) continue;
      if (b - a < 2.5) out.push([a + 0.28, b - 0.28]);
      else { const m = (a + b) / 2; out.push([a + 0.2, m - 0.08], [m + 0.08, b - 0.2]); }
    }
    if (cab) out.push([-9.25, -8.15]);
    return out;
  }

  function carMesh(cab) {
    if (CARS[cab]) return CARS[cab];
    const body = new N.MB(8192), gl = new N.MB(1024), ins = new N.MB(16384), HL = TR.hl, HW = TR.hw;
    const lay = T('white');
    const doors = TR.doors.map(d => [d - TR.dw, d + TR.dw]);
    const wins = windowsOf(cab);
    const side = (s, x, y0, y1, hl, c, layer, kind) => {
      for (const [a, b] of hl) zwallC(body, a, b, x, y0, y1, c, layer, kind, s);
    };
    function zwallC(mb, a, b, x, y0, y1, c, layer, kind, s) { zwall(mb, a, b, x, y0, y1, { layer, us: 1, vs: 1, c, kind: kind || 0 }, s); }
    for (const s of [-1, 1]) {
      const x = s * HW;
      side(s, x, -0.55, -0.05, [[-HL, HL]], PAINT.skirt, lay);
      side(s, x, -0.05, 0.9, holes(doors, -HL, HL), PAINT.blue, lay);
      side(s, x, 0.9, 0.97, holes(doors, -HL, HL), PAINT.stripe, lay);
      side(s, x, 0.97, 1.85, holes(doors.concat(wins), -HL, HL), PAINT.light, lay);
      side(s, x, 1.85, 1.92, holes(doors, -HL, HL), PAINT.light, lay);
      side(s, x, 1.92, 2.15, [[-HL, HL]], PAINT.light, lay);
      for (const [a, b] of wins) {
        zwall(gl, a, b, x + s * 0.03, 0.97, 1.85, { layer: T('carglass'), kind: K.GLASS, c: [208, 218, 224, 255] }, s);
        zwall(body, a - 0.03, b + 0.03, x + s * 0.018, 0.94, 0.97, { layer: T('trim'), c: PAINT.frame, kind: K.TRIM }, s);
        zwall(body, a - 0.03, b + 0.03, x + s * 0.018, 1.85, 1.88, { layer: T('trim'), c: PAINT.frame, kind: K.TRIM }, s);
      }
      for (const [a, b] of doors) {
        mb3(body, s * (HW - 0.06), -0.05, a, s * HW, 0, b, PAINT.under);
        mb3(body, s * (HW - 0.08), 1.92, a, s * (HW + 0.02), 1.96, b, PAINT.frame);
      }
    }
    const roof = 8;
    for (let i = 0; i < roof; i++) {
      const a0 = Math.PI * i / roof, a1 = Math.PI * (i + 1) / roof;
      const xa = -Math.cos(a0) * HW, xb = -Math.cos(a1) * HW, ya = 2.15 + Math.sin(a0) * 0.45, yb = 2.15 + Math.sin(a1) * 0.45;
      const am = (a0 + a1) / 2;
      body.quad([xa, ya, -HL, xa, ya, HL, xb, yb, HL, xb, yb, -HL], [-Math.cos(am) * 0.5, Math.sin(am), 0], [0, 0, 6, 0, 6, 0.3, 0, 0.3], PAINT.roof, lay, 0);
      ins.quad([xa * 0.94, ya - 0.06, -HL + 0.1, xa * 0.94, ya - 0.06, HL - 0.1, xb * 0.94, yb - 0.06, HL - 0.1, xb * 0.94, yb - 0.06, -HL + 0.1], [Math.cos(am) * 0.5, -Math.sin(am), 0], [0, 0, 6, 0, 6, 0.3, 0, 0.3], [236, 236, 230, 255], T('white'), 0);
    }
    for (const z of [-HL, HL]) {
      const f = z < 0 ? -1 : 1;
      const front = cab && z < 0;
      endFace(body, gl, z, f, front);
    }
    mb3(body, -1.1, -0.95, -7.6, 1.1, -0.6, -5.0, PAINT.under);
    mb3(body, -1.1, -0.95, 5.0, 1.1, -0.6, 7.6, PAINT.under);
    mb3(body, -1.0, -0.85, -4.6, 1.0, -0.12, 4.6, [48, 48, 50, 255]);
    for (const bz of [-6.3, 6.3]) for (const dz of [-1.05, 1.05]) for (const s of [-1, 1]) disc(body, s * 0.79, -0.71, bz + dz, 0.39, s);
    const lamps = [];
    if (cab) {
      for (const s of [-1, 1]) {
        for (const lx of [0.62, 0.86]) { lens(body, s * lx, 0.66, -HL - 0.035, 0.085, 20); lamps.push({ k: 'head', p: [s * lx, 0.66, -HL - 0.05], n: [0, 0, -1], side: s }); }
        lens(body, s * 1.12, 0.66, -HL - 0.035, 0.06, 21);
        lamps.push({ k: 'tail', p: [s * 1.12, 0.66, -HL - 0.05], n: [0, 0, -1], side: s });
      }
    }
    interior(ins, cab, wins, doors);
    const leaf = new N.MB(256), lg = new N.MB(64);
    zwall(leaf, -0.31, 0.31, 0, -0.04, 0.9, { layer: lay, c: PAINT.blue }, 1);
    zwall(leaf, -0.31, 0.31, 0, 0.9, 0.97, { layer: lay, c: PAINT.stripe }, 1);
    zwall(leaf, -0.31, -0.22, 0, 0.97, 1.92, { layer: lay, c: PAINT.light }, 1);
    zwall(leaf, 0.22, 0.31, 0, 0.97, 1.92, { layer: lay, c: PAINT.light }, 1);
    zwall(leaf, -0.22, 0.22, 0, 0.97, 1.08, { layer: lay, c: PAINT.light }, 1);
    zwall(leaf, -0.22, 0.22, 0, 1.8, 1.92, { layer: lay, c: PAINT.light }, 1);
    zwall(leaf, -0.31, 0.31, -0.03, -0.04, 1.92, { layer: T('white'), c: [176, 172, 160, 255] }, -1);
    zwall(lg, -0.22, 0.22, 0.01, 1.08, 1.8, { layer: T('carglass'), kind: K.GLASS, c: [208, 218, 224, 255] }, 1);
    CARS[cab] = { body, gl, ins, leaf, lg, lamps };
    return CARS[cab];
  }

  function mb3(mb, x0, y0, z0, x1, y1, z1, c) { bx(mb, x0, y0, z0, x1, y1, z1, { layer: T('darkmetal'), c }); }

  function disc(mb, x, y, z, r, s) {
    const n = 10, base = mb.nv;
    mb.ensure(n + 1, n * 3);
    mb.v(x, y, z, s, 0, 0, 0.5, 0.5, [70, 70, 72, 255], T('metal'), 0);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; mb.v(x, y + Math.cos(a) * r, z + Math.sin(a) * r, s, 0, 0, 0.5, 0.5, [60, 60, 62, 255], T('darkmetal'), 0); }
    for (let i = 0; i < n; i++) mb.tri(base, base + 1 + i, base + 1 + (i + 1) % n);
  }

  function lens(mb, x, y, z, r, kind) {
    mb.quad([x - r, y - r, z, x + r, y - r, z, x + r, y + r, z, x - r, y + r, z], [0, 0, -1], [0, 1, 1, 1, 1, 0, 0, 0], kind === 20 ? [250, 248, 230, 255] : [255, 40, 30, 255], T('lamplens'), kind);
  }

  function endFace(body, gl, z, f, front) {
    const HW = TR.hw, lay = T('white');
    const face = (x0, x1, y0, y1, c) => xwall(body, x0, x1, z, y0, y1, { layer: lay, us: 1, vs: 1, c }, f);
    face(-HW, HW, -0.55, -0.05, PAINT.skirt);
    face(-HW, HW, -0.05, 0.9, PAINT.blue);
    face(-HW, HW, 0.9, 0.97, PAINT.stripe);
    const top = 2.15, seg = 8;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg;
      const xa = -Math.cos(a0) * HW, xb = -Math.cos(a1) * HW, ya = top + Math.sin(a0) * 0.45, yb = top + Math.sin(a1) * 0.45;
      body.quad([xa, top, z, xb, top, z, xb, yb, z, xa, ya, z], [0, 0, f], [0, 1, 1, 1, 1, 0, 0, 0], PAINT.light, lay, 0);
    }
    if (front) {
      face(-HW, -1.18, 0.97, 1.88, PAINT.light);
      face(1.18, HW, 0.97, 1.88, PAINT.light);
      face(-0.07, 0.07, 0.97, 1.88, PAINT.light);
      face(-HW, HW, 1.88, top, PAINT.light);
      for (const [a, b] of [[-1.18, -0.07], [0.07, 1.18]]) xwall(gl, a, b, z + f * 0.014, 0.97, 1.88, { layer: T('carglass'), kind: K.GLASS, c: [200, 212, 220, 255] }, f);
      bx(body, -0.3, 1.94, z + f * 0.015, 0.3, 2.12, z + f * 0.05, { layer: T('darkmetal'), c: [24, 24, 26, 255] });
      xwall(body, -0.22, 0.22, z + f * 0.065, 1.97, 2.09, { layer: T('white'), kind: K.EMIT, c: [240, 236, 220, 255] }, f);
      bx(body, -0.12, -0.45, z + f * 0.02, 0.12, -0.25, z + f * 0.45, { layer: T('darkmetal'), c: [40, 40, 42, 255] });
      for (const s of [-1, 1]) bx(body, s * 0.5, 0.52, z + f * 0.01, s * 1.25, 0.8, z + f * 0.025, { layer: T('trim'), kind: K.TRIM, c: [26, 26, 28, 255] });
    } else {
      face(-HW, -0.5, 0.97, top, PAINT.light);
      face(0.5, HW, 0.97, top, PAINT.light);
      face(-0.5, 0.5, 1.95, top, PAINT.light);
      xwall(body, -0.5, 0.5, z + f * 0.015, -0.05, 1.95, { layer: T('darkmetal'), c: [70, 76, 86, 255] }, f);
      xwall(gl, -0.3, 0.3, z + f * 0.014, 1.15, 1.75, { layer: T('carglass'), kind: K.GLASS, c: [200, 212, 220, 255] }, f);
      bx(body, -0.1, -0.45, z + f * 0.02, 0.1, -0.28, z + f * 0.2, { layer: T('darkmetal'), c: [40, 40, 42, 255] });
    }
  }

  function interior(ins, cab, wins, doors) {
    const HL = 9.5, IW = 1.27, z0 = cab ? -TR.cab : -HL, cream = [226, 218, 196, 255];
    ins.flat(-IW, z0, IW, HL, 0.01, { layer: T('lino'), us: 1.2, c: [255, 255, 255, 255] });
    for (const s of [-1, 1]) {
      const x = s * IW, f = -s;
      for (const [a, b] of holes(doors, z0, HL)) zwall(ins, a, b, x, 0, 0.97, { layer: T('white'), us: 1, vs: 1, c: [178, 168, 148, 255] }, f);
      for (const [a, b] of holes(doors.concat(wins), z0, HL)) zwall(ins, a, b, x, 0.97, 1.85, { layer: T('white'), us: 1, vs: 1, c: cream }, f);
      for (const [a, b] of holes(doors, z0, HL)) zwall(ins, a, b, x, 1.85, 2.12, { layer: T('white'), us: 1, vs: 1, c: cream }, f);
      for (const [a, b] of doors) {
        zwall(ins, a, b, x, 1.92, 2.12, { layer: T('metromap'), us: 1.24, vs: 0.8, v0: 0.5, c: [255, 255, 255, 255] }, f);
        for (const z of [a - 0.08, b + 0.08]) ins.cyl(s * 0.98, z, 0, 2.12, 0.022, 0.022, 6, { layer: T('chrome'), kind: K.CHROME, c: [220, 220, 224, 255] });
      }
    }
    for (const [a, b] of [[-9.3, -7.52], [-6.28, -2.92], [-1.68, 1.68], [2.92, 6.28], [7.52, 9.3]]) {
      if (cab && a < -TR.cab + 0.2) continue;
      for (const s of [-1, 1]) {
        const xi = s * 0.76, xo = s * 1.25;
        bx(ins, xi, 0, a, xo, 0.4, b, { layer: T('white'), us: 1, vs: 1, c: [92, 78, 64, 255] });
        bx(ins, xi - s * 0.02, 0.4, a + 0.02, xo, 0.5, b - 0.02, { layer: T('leather'), us: 0.6, vs: 0.6, c: [134, 82, 50, 255] });
        ins.quad([xo, 0.5, a + 0.02, xo, 0.5, b - 0.02, s * 1.2, 0.98, b - 0.02, s * 1.2, 0.98, a + 0.02], [-s, 0.1, 0], [0, 1, 3, 1, 3, 0, 0, 0], [128, 78, 48, 255], T('leather'), 0);
        for (const z of [a, b]) bx(ins, xi, 0.5, z - 0.015, s * 1.2, 0.72, z + 0.015, { layer: T('chrome'), kind: K.CHROME, c: [220, 220, 224, 255] });
      }
    }
    for (const s of [-1, 1]) bx(ins, s * 0.6, 1.84, z0 + 0.2, s * 0.64, 1.87, HL - 0.2, { layer: T('chrome'), kind: K.CHROME, c: [220, 220, 224, 255] });
    for (let z = z0 + 0.6; z < HL - 0.5; z += 1.55) for (const s of [-1, 1]) ins.flat(s * 0.38, z, s * 0.56, z + 1.15, 2.5, { layer: T('white'), kind: K.EMIT, c: [255, 250, 232, 255], down: true });
    for (const z of [cab ? -TR.cab : -HL, HL]) {
      const f = z < 0 ? 1 : -1;
      xwall(ins, -IW, IW, z, 0, 2.2, { layer: T('white'), us: 1, vs: 1, c: cream }, f);
      xwall(ins, -0.45, 0.45, z + f * 0.016, 0, 1.95, { layer: T('booth'), us: 0.9, vs: 1.95, v0: 0, c: [150, 140, 126, 255] }, f);
    }
  }

  const MD = { carMesh };
  const LM = [];
  const DIG = {};
  function digit(A, ch) {
    if (DIG[ch] !== undefined) return DIG[ch];
    const uv = A['mled|' + ch];
    if (!uv) return (DIG[ch] = null);
    const mb = new N.MB(8);
    mb.quad([-0.075, -0.15, 0, 0.075, -0.15, 0, 0.075, 0.15, 0, -0.075, 0.15, 0], [0, 0, 1], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], [255, 255, 255, 255], 0, K.NEON);
    return (DIG[ch] = mb);
  }
  let QUAD = null;
  const quadMesh = () => {
    if (QUAD) return QUAD;
    QUAD = new N.MB(8);
    QUAD.quad([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], [0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], [255, 246, 226, 255], T('white'), K.EMIT);
    return QUAD;
  };

  MD.fill = (sc, f, lights, Rv, Uv, vis, t) => {
    const W = f.world, Mt = W.metro, R = sc.r, city = sc.city, L = city.metroLine, G = sc.geo.metro;
    if (!Mt || !L || !G) return;
    const M3 = N.M3, cam = f.cam, eye = [cam.x, cam.y, cam.z], k = f.env.metroK || 1, A = N.ATLAS_MAP || {};
    const mine = Mt.player.aboard ? Mt.player.aboard.tr : null;
    const glow = sc.glowOut || (sc.glowOut = {});
    for (const tr of Mt.trains) {
      if (Math.abs(tr.x - cam.x) > 320 || Math.abs(tr.z - cam.z) > 30) continue;
      for (const c of tr.cars) {
        if (!vis(c.x, c.z, 11)) continue;
        const m = carMesh(c.cab ? 1 : 0);
        const M = M3.euler(0, -c.yaw, 0, c.x, 0, c.z);
        const d = Math.hypot(c.x - cam.x, c.z - cam.z);
        const lead = (c.cab > 0) === (tr.dir > 0);
        const lamp = c.cab ? [lead ? 2.6 : 0, lead ? 0 : 1.8, 0, 0, 0, 0, 0, 0, 0, 0] : null;
        const dim = Math.min(1, L.light(c.x, c.z, 0) / k + (tr === mine ? 1 : 0));
        R.dyn.add(m.body, M, null, null, null, lamp, Math.max(0.3, dim));
        if (d < 70 || tr === mine) R.dyn.add(m.ins, M, null, null, null, null, 1);
        R.glass.add(m.gl, M, null, null, null, null, 1);
        const sideM = c.side * (c.cab < 0 ? -1 : 1);
        for (const dz of TR.doors) for (const s of [-1, 1]) {
          const o = s === sideM ? tr.doors : 0;
          for (const h of [-1, 1]) {
            const LMx = M3.mul(M, M3.euler(0, s > 0 ? 0 : Math.PI, 0, s * (TR.hw + 0.012), 0, dz + h * (0.31 + o * 0.6)));
            R.dyn.add(m.leaf, LMx, null, null, null, null, Math.max(0.3, dim));
            R.glass.add(m.lg, LMx, null, null, null, null, 1);
          }
        }
        if (c.cab) {
          for (const a of m.lamps) {
            if (a.k === 'head' ? !lead : lead) continue;
            N.lampGlow(M, a, eye, glow);
            if (glow.k < 0.01) continue;
            const cc = a.k === 'head' ? [255, 246, 220, 200] : [255, 40, 30, 170];
            R.addSprites.bill(glow.gx, glow.gy, glow.gz, (a.k === 'head' ? 1.6 : 0.6) * glow.gs, 0, [cc[0], cc[1], cc[2], Math.round(cc[3] * glow.k)], Rv, Uv);
          }
          const hk = N.smooth(240, 170, d);
          if (lead && hk > 0 && lights.length < N.MAX_LIGHTS - 2) {
            const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw);
            lights.push({ x: c.x + fx * (TR.hl + 0.3), y: 0.7, z: c.z + fz * (TR.hl + 0.3), r: 60, c: [2.8 * hk, 2.7 * hk, 2.4 * hk], d: [fx * 0.995, -0.05, fz * 0.995], cos: 0.86 });
          }
        }
        const ik = tr === mine ? 1 : N.smooth(18, 11, d);
        if (ik > 0 && lights.length < N.MAX_LIGHTS - 1) lights.push({ x: c.x, y: 2.0, z: c.z, r: 9, c: [1.3 * ik, 1.26 * ik, 1.15 * ik] });
      }
    }
    LM.length = 0;
    for (const l of G.tlamps) {
      if (Math.abs(l.z - cam.z) > 3.2) continue;
      const d = Math.abs(l.x - cam.x), k = N.smooth(34, 20, d);
      if (k > 0) LM.push([d, l, k]);
    }
    LM.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < LM.length && i < 3 && lights.length < N.MAX_LIGHTS - 2; i++) { const [, l, k] = LM[i]; lights.push({ x: l.x, y: l.y, z: l.z, r: 15, c: [1.4 * k, 1.2 * k, 0.9 * k] }); }
    for (const g of G.glows) if (Math.abs(g.x - cam.x) < 120 && vis(g.x, g.z, 2)) R.addSprites.bill(g.x, g.y, g.z, g.s, 0, g.c, Rv, Uv);
    for (const l of G.tlamps) if (Math.abs(l.x - cam.x) < 200 && Math.abs(l.z - cam.z) < 12 && vis(l.x, l.z, 1)) R.addSprites.bill(l.x, l.y, l.z, 0.8, 0, [255, 220, 170, 190], Rv, Uv);
    const day = N.clamp(1 - W.darkness(), 0.12, 1);
    const Q = quadMesh();
    for (const x of G.exits) {
      if (Math.abs(x.x - cam.x) > 90 || !vis(x.x, x.z, 3)) continue;
      const S = new Float32Array(12);
      const Mq = M3.euler(0, x.nx > 0 ? Math.PI / 2 : -Math.PI / 2, 0, x.x, x.y, x.z);
      S[0] = x.w; S[4] = x.h; S[8] = 1;
      R.dyn.add(Q, M3.mul(Mq, S), null, null, null, null, day);
      R.addSprites.bill(x.x + x.nx * 0.6, x.y, x.z, 2.6, 0, [255, 246, 220, Math.round(90 * day)], Rv, Uv);
    }
    for (const c of G.clocks) {
      if (Math.abs(c.x - cam.x) > 110 || !vis(c.x, c.z, 2)) continue;
      const S = Mt.S[c.st], since = Math.max(0, Mt.now() - S.lastDep[c.track]);
      const mm = Math.min(99, Math.floor(since / 60)), ss = Math.floor(since % 60);
      const hh = Math.floor(W.clock / 60) % 24, mi = Math.floor(W.clock % 60);
      const txt = String(hh).padStart(2, '0') + ':' + String(mi).padStart(2, '0') + ' ' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
      const yaw = c.nx > 0 ? Math.PI / 2 : -Math.PI / 2;
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i];
        if (ch === ' ') continue;
        const dm = digit(A, ch);
        if (!dm) continue;
        const off = (i - (txt.length - 1) / 2) * 0.17;
        R.dyn.add(dm, M3.euler(0, yaw, 0, c.x, c.y, c.z - c.nx * off), null);
      }
    }
    for (const s of G.signals) {
      if (Math.abs(s.x - cam.x) > 160 || !vis(s.x, s.z, 1)) continue;
      let green = true;
      if (!s.line) {
        const tr = Mt.trains.find(q => q.stop === s.st && q.track === s.track);
        green = !!tr && tr.doors < 0.5 && tr.kind !== 'unload';
      } else {
        for (const q of Mt.trains) if (q.track === s.track && Math.abs(q.x - s.x) < 220 && (s.x - q.x) * q.dir > -TR.span) green = false;
      }
      R.addSprites.bill(s.x, s.y, s.z, 0.32, 0, green ? [60, 255, 120, 255] : [255, 40, 30, 255], Rv, Uv);
    }
  };

  N.MetroDraw = MD;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
