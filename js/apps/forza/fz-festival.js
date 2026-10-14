(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const TAU = Math.PI * 2;
  const FS = F.MAP.FEST;
  const OX = FS.lm[0], OZ = FS.lm[1];
  const L = (x, z) => [x - OX, z - OZ];
  const lane = z => 860 + (-1598 - z) * 0.098;
  const PINK = C('#e6146e'), ORANGE = C('#ff7a1a'), YELLOW = C('#ffc81e'), CYAN = C('#30b4ff'), WHITE = C('#f4f4f0'), BLACK = C('#1a1a1e'), STEEL = C('#8c9096'), DARK = C('#2a2c30');
  const SPONSOR = { cola: [C('#d0141e'), C('#ffffff')], fm: [C('#12305a'), C('#ffd23a')], mobile: [C('#1a7a3a'), C('#ffffff')], kafija: [C('#6a2a14'), C('#f4e6c8')], zibens: [C('#101010'), C('#c8ff3a')] };

  function withM(b, x, z, yaw, fn) {
    const m = b.m;
    const px = m ? m[0] * x + m[6] * z + m[9] : x, py = m ? m[1] * x + m[7] * z + m[10] : 0, pz = m ? m[2] * x + m[8] * z + m[11] : z;
    b.setM(px, py, pz, (m ? -Math.atan2(m[13], m[12]) : 0) + yaw);
    fn();
    b.m = m;
  }

  function plate(b, a, c, y0, y1, n, col, mat = 0) {
    const rx = n[2], rz = -n[0];
    let P = a, Q = c;
    if ((c[0] - a[0]) * rx + (c[1] - a[1]) * rz < 0) { P = c; Q = a; }
    b.quad([P[0], y0, P[1]], [Q[0], y0, Q[1]], [Q[0], y1, Q[1]], [P[0], y1, P[1]], col, mat, null, n);
  }

  function truss(b, x, z, y0, y1, w, col) {
    const h = w / 2, c = [[-h, -h], [h, -h], [h, h], [-h, h]];
    for (const [dx, dz] of c) b.beam([x + dx, y0, z + dz], [x + dx, y1, z + dz], 0.06, col, 0);
    const n = Math.max(2, Math.round((y1 - y0) / 1.2));
    for (let k = 0; k < n; k++) {
      const ya = y0 + (y1 - y0) * k / n, yb = y0 + (y1 - y0) * (k + 1) / n;
      for (let i = 0; i < 4; i++) {
        const p = c[i], q = c[(i + 1) % 4];
        b.beam([x + p[0], ya, z + p[1]], [x + q[0], yb, z + q[1]], 0.025, col, 0);
      }
    }
  }

  function beamTruss(b, p0, p1, w, col) {
    const dx = p1[0] - p0[0], dz = p1[2] - p0[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
    for (const [s, t] of [[-1, 0], [1, 0], [0, 1]]) {
      const o = [nx * s, t * w * 0.8, nz * s];
      b.beam([p0[0] + o[0], p0[1] + o[1], p0[2] + o[2]], [p1[0] + o[0], p1[1] + o[1], p1[2] + o[2]], 0.05, col, 0);
    }
    const n = Math.max(2, Math.round(l / 1.2));
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, s = k % 2 ? 1 : -1;
      b.beam([p0[0] + dx * t0 + nx * s, p0[1], p0[2] + dz * t0 + nz * s], [p0[0] + dx * t1 - nx * s, p0[1] + w * 0.8, p0[2] + dz * t1 - nz * s], 0.022, col, 0);
    }
  }

  function tentRoof(b, cx, cz, hx, hz, y, h, col, col2) {
    const cs = [[cx - hx, cz - hz], [cx + hx, cz - hz], [cx + hx, cz + hz], [cx - hx, cz + hz]], top = [cx, y + h, cz];
    for (let i = 0; i < 4; i++) {
      const a = cs[i], c = cs[(i + 1) % 4];
      b.triangle([c[0], y, c[1]], [a[0], y, a[1]], top, i % 2 ? col : col2, 0);
    }
  }

  function booth(b, k) {
    const [c1, c2] = SPONSOR[k];
    b.box(0, 1.1, 0, 3, 1.1, 3.8, c1, 0);
    b.box(-0.2, 1.25, 0, 2.9, 0.08, 3.9, c2, 0);
    for (const [x, z] of [[-3, -3.8], [3, -3.8], [-3, 3.8], [3, 3.8]]) b.box(x, 2.9, z, 0.08, 0.7, 0.08, WHITE, 0);
    tentRoof(b, 0, 0, 3.4, 4.2, 3.6, 1.8, c1, c2);
    b.box(3.05, 4.4, 0, 0.1, 0.5, 3.6, DARK, 0);
    if (k === 'cola') {
      const bx = -1.2, bz = 0, base = 5.4;
      b.cyl(bx, base, bz, 1.1, 3.2, 10, C('#3a1208'), 0);
      b.cyl(bx, base + 3.2, bz, 1.1, 1.2, 10, C('#3a1208'), 0, { r2: 0.4 });
      b.cyl(bx, base + 4.4, bz, 0.4, 1.2, 8, C('#3a1208'), 0);
      b.cyl(bx, base + 1.2, bz, 1.13, 1, 10, C('#e0141c'), 0);
      b.cyl(bx, base + 5.6, bz, 0.44, 0.3, 8, C('#c8c8c8'), 0);
      b.box(bx, base - 0.4, bz, 1.3, 0.4, 1.3, c2, 0);
    } else if (k === 'fm') {
      for (const s of [-1, 1]) b.beam([-1.5, 5.4, s * 1.2], [-1.5, 12, 0], 0.07, C('#d02020'), 0);
      b.beam([-1.5, 5.4, 0], [-1.5, 13, 0], 0.05, WHITE, 0);
      b.box(-1.5, 13.1, 0, 0.25, 0.25, 0.25, C('#ff3030'), MAT.LAMP);
      for (const z of [-2.6, 2.6]) b.box(2.4, 0.9, z, 0.5, 0.9, 0.55, BLACK, 0);
      b.box(1.8, 1.05, 0, 0.6, 0.05, 1.2, C('#303036'), 0);
    } else if (k === 'mobile') {
      b.box(-1.2, 8.4, 0, 0.45, 3, 1.3, C('#2a2e34'), 0);
      b.box(-0.73, 9.6, 0, 0.03, 0.9, 1, C('#a8d890'), MAT.LAMP);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) b.box(-0.73, 8.2 - r * 0.5, -0.6 + c * 0.6, 0.03, 0.16, 0.2, C('#e8e8e8'), 0);
      b.box(-1.2, 11.9, 0.7, 0.12, 0.6, 0.12, BLACK, 0);
    } else if (k === 'kafija') {
      b.cyl(-1.2, 5.6, 0, 1.4, 2.4, 12, WHITE, 0, { r2: 1.8 });
      b.cyl(-1.2, 7.9, 0, 1.72, 0.12, 12, C('#3a1a0a'), 0);
      b.cyl(-1.2, 5.4, 0, 2.3, 0.2, 12, WHITE, 0);
      b.beam([-1.2, 6.2, 1.6], [-1.2, 7.4, 2.4], 0.16, WHITE, 0);
    }
  }

  function truck(b, k) {
    const [c1, c2] = SPONSOR[k];
    b.box(0, 1.55, 0.6, 1.2, 1.25, 2.4, c1, 0, { top: WHITE });
    b.box(0, 1.1, -2.35, 1.15, 0.8, 0.6, c2, 0);
    b.box(0, 2.05, -2.1, 1.1, 0.3, 0.35, C('#34444e'), MAT.WINDOWS);
    b.box(-1.21, 1.9, 0.6, 0.02, 0.55, 1.5, C('#1c1c20'), 0);
    b.box(-1.9, 2.55, 0.6, 0.7, 0.04, 1.8, c2, 0);
    for (const z of [-1.8, 1.9]) for (const x of [-1.1, 1.1]) b.cyl(x, 0.02, z, 0.36, 0.3, 8, BLACK, 0);
    b.box(-1.55, 1.05, 0.6, 0.35, 0.05, 1.4, C('#b8b4ac'), 0);
  }

  function table(b, seed) {
    b.box(0, 0.72, 0, 0.9, 0.04, 0.45, C('#9a6a42'), 0);
    for (const z of [-0.75, 0.75]) b.box(0, 0.42, z, 0.9, 0.03, 0.16, C('#8a5a30'), 0);
    for (const x of [-0.7, 0.7]) b.box(x, 0.36, 0, 0.05, 0.36, 0.7, C('#5a3c24'), 0);
    b.cyl(0, 0.7, 0, 0.04, 1.8, 4, WHITE, 0);
    b.cone(0, 2.1, 0, 1.6, 0.5, 8, [PINK, ORANGE, YELLOW, CYAN][seed % 4], 0);
  }

  const GLYPH = {
    H: ['1..1', '1..1', '1111', '1..1', '1..1'], O: ['1111', '1..1', '1..1', '1..1', '1111'], R: ['111.', '1..1', '111.', '1.1.', '1..1'],
    I: ['111', '.1.', '.1.', '.1.', '111'], Z: ['1111', '..1.', '.1..', '1...', '1111'], N: ['1..1', '11.1', '1.11', '1..1', '1..1']
  };

  function letters(b, word, x0, y0, z0, cell, depth) {
    const cols = [PINK, C('#f0306a'), C('#ff5a3a'), ORANGE, C('#ff9a1e'), C('#ffb41e'), YELLOW];
    let x = x0;
    [...word].forEach((ch, li) => {
      const g = GLYPH[ch], col = cols[li % cols.length];
      for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== '1') continue;
        b.box(-(x + (c + 0.5) * cell), y0 + (g.length - r - 0.5) * cell, z0, cell / 2, cell / 2, depth / 2, col, 0, { top: WHITE });
      }
      x += (g[0].length + 1) * cell;
    });
    return x - x0 - cell;
  }

  function wordWidth(word, cell) { return [...word].reduce((a, ch) => a + (GLYPH[ch][0].length + 1) * cell, 0) - cell; }

  function buildLM(b) {
    const st = FS.stage, [sx, sz] = L(st.x, st.z), hw = st.w / 2, hd = st.d / 2;
    b.box(sx, 0.9, sz, hw, 0.9, hd, C('#2c2c34'), 0, { top: C('#3a3a44') });
    b.box(sx, 0.45, sz + hd + 0.05, hw, 0.45, 0.05, BLACK, 0);
    for (const [dx, dz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) truss(b, sx + dx, sz + dz, 1.8, 16.5, 1, STEEL);
    for (const [a, c] of [[[-hw, hd], [hw, hd]], [[-hw, -hd], [hw, -hd]], [[-hw, -hd], [-hw, hd]], [[hw, -hd], [hw, hd]], [[0, -hd], [0, hd]]]) beamTruss(b, [sx + a[0], 16.5, sz + a[1]], [sx + c[0], 16.5, sz + c[1]], 1, STEEL);
    for (let i = 0; i < 6; i++) {
      const z0 = sz - hd - 0.5 + i * (st.d + 1) / 6, z1 = z0 + (st.d + 1) / 6, ya = 17.4 + Math.sin(i / 6 * Math.PI) * 1.6, yb = 17.4 + Math.sin((i + 1) / 6 * Math.PI) * 1.6;
      b.quad([sx - hw - 0.5, ya, z0], [sx - hw - 0.5, yb, z1], [sx + hw + 0.5, yb, z1], [sx + hw + 0.5, ya, z0], C('#202024'), 0);
      b.quad([sx + hw + 0.5, ya - 0.05, z0], [sx + hw + 0.5, yb - 0.05, z1], [sx - hw - 0.5, yb - 0.05, z1], [sx - hw - 0.5, ya - 0.05, z0], C('#101012'), 0);
    }
    plate(b, [sx - hw, sz - hd + 0.4], [sx + hw, sz - hd + 0.4], 1.8, 16.4, [0, 0, 1], C('#0c0c10'));
    b.box(sx, 8.6, sz - hd + 0.9, 14.6, 4.9, 0.3, BLACK, 0);
    for (const s of [-1, 1]) {
      const wx = sx + s * (hw + 5);
      b.box(wx, 1.2, sz + 2, 4.5, 1.2, 5, C('#2c2c34'), 0);
      truss(b, wx - 2.6, sz + 5, 2.4, 13.5, 0.7, STEEL);
      truss(b, wx + 2.6, sz + 5, 2.4, 13.5, 0.7, STEEL);
      beamTruss(b, [wx - 2.6, 13.5, sz + 5], [wx + 2.6, 13.5, sz + 5], 0.7, STEEL);
      b.box(wx, 8, sz + 4.9, 3.1, 4.3, 0.2, BLACK, 0);
      const ax = sx + s * (hw - 3);
      for (let k = 0; k < 6; k++) b.box(ax, 14.6 - k * 0.72, sz + hd - 1 + k * 0.05, 0.7, 0.34, 0.5, C('#1c1c1e'), 0);
      for (let k = 0; k < 3; k++) b.box(sx + s * (hw - 2), 2.4 + k * 0.9, sz + hd - 1.4, 1.1, 0.44, 0.7, C('#161618'), 0);
    }
    for (let i = 0; i < 12; i++) {
      const x = sx - hw + 2 + i * (st.w - 4) / 11, cols = [PINK, CYAN, YELLOW, ORANGE];
      b.box(x, 15.9, sz + hd + 0.3, 0.28, 0.28, 0.32, cols[i % 4], MAT.LAMP);
    }
    for (let k = 0; k < 5; k++) b.box(sx + hw + 1.2 - k * 0, 0.3 + k * 0.36, sz - hd + 2 + k * 0.7, 1, 0.18, 0.35, C('#5a5a60'), 0);
    const pit = FS.pit, [px0, pz1] = L(pit.x0, pit.z1), [px1, pz0] = L(pit.x1, pit.z0);
    const barrier = (a, c) => {
      const n = Math.max(1, Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / 2.2));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, p = [a[0] + (c[0] - a[0]) * t0, a[1] + (c[1] - a[1]) * t0], q = [a[0] + (c[0] - a[0]) * t1, a[1] + (c[1] - a[1]) * t1];
        b.beam([p[0], 1.15, p[1]], [q[0], 1.15, q[1]], 0.04, STEEL, 0);
        b.beam([p[0], 0.25, p[1]], [q[0], 0.25, q[1]], 0.03, STEEL, 0);
        b.beam([p[0], 0, p[1]], [p[0], 1.15, p[1]], 0.035, STEEL, 0);
        for (let k = 1; k < 7; k++) { const t = k / 7; b.beam([p[0] + (q[0] - p[0]) * t, 0.25, p[1] + (q[1] - p[1]) * t], [p[0] + (q[0] - p[0]) * t, 1.15, p[1] + (q[1] - p[1]) * t], 0.012, STEEL, 0); }
      }
    };
    barrier([px0, pz1], [px1, pz1]);
    barrier([px0, pz1], [px0, pz0]);
    barrier([px1, pz1], [px1, pz0]);
    for (const zn of FS.zones) {
      const [a0, b0] = L(zn.x0, zn.z0), [a1, b1] = L(zn.x1, zn.z1);
      barrier([a0, b0], [a1, b0]); barrier([a1, b0], [a1, b1]); barrier([a1, b1], [a0, b1]); barrier([a0, b1], [a0, b0]);
    }
    const [fx, fz] = L(FS.foh.x, FS.foh.z);
    b.box(fx, 0.15, fz, 2.6, 0.15, 2.1, C('#3a3a40'), 0);
    for (const [dx, dz] of [[-2.4, -1.9], [2.4, -1.9], [-2.4, 1.9], [2.4, 1.9]]) b.box(fx + dx, 1.5, fz + dz, 0.06, 1.35, 0.06, WHITE, 0);
    tentRoof(b, fx, fz, 2.7, 2.2, 2.85, 1.1, WHITE, C('#e8e8e8'));
    b.box(fx, 0.95, fz, 1.6, 0.05, 0.7, BLACK, 0);
    b.box(fx, 0.5, fz, 1.5, 0.45, 0.6, C('#2a2a30'), 0);
    for (const sc of FS.showcase) {
      const [x, z] = L(sc.x, sc.z);
      b.cyl(x, 0, z, 4.6, 0.32, 20, C('#202026'), 0, { topCol: C('#2c2c34') });
      b.cyl(x, 0.02, z, 4.75, 0.08, 20, PINK, 0);
      for (const s of [-1, 1]) {
        b.cyl(x + s * 3.8, 0, z + 3.4, 0.07, 3.2, 4, STEEL, 0);
        b.box(x + s * 3.8, 3.3, z + 3.35, 0.25, 0.2, 0.3, C('#fff4d0'), MAT.LAMP);
      }
    }
    const bd = FS.backdrop, [bx, bz] = L(bd.x, bd.z);
    b.box(bx, 3.6, bz - 0.6, bd.w / 2 + 0.6, 3.6, 0.4, C('#1c1c22'), 0);
    b.box(bx, 7.5, bz - 0.6, bd.w / 2 + 0.8, 0.3, 0.5, PINK, 0);
    for (const k of [-1, 0, 1]) truss(b, bx + k * (bd.w / 2 + 0.2) * (k ? 1 : 0), bz - 1.3, 0, 7.6, 0.5, STEEL);
    for (const bo of FS.booths) { const [x, z] = L(bo.x, bo.z); withM(b, x, z, Math.PI / 2, () => booth(b, bo.k)); }
    const [tx, tz] = L(FS.store.x, FS.store.z);
    b.box(tx, 1.3, tz, 4, 1.3, 5, WHITE, 0);
    b.box(tx - 4.02, 1.3, tz, 0.02, 0.9, 4, C('#2a2a30'), 0);
    tentRoof(b, tx, tz, 4.4, 5.4, 2.6, 2.2, PINK, WHITE);
    for (const t of FS.trucks) { const [x, z] = L(t.x, t.z); withM(b, x, z, Math.PI / 2, () => truck(b, t.k)); }
    FS.tables.forEach((t, i) => { const [x, z] = L(t[0], t[1]); withM(b, x, z, (i % 3) * 0.35, () => table(b, i)); });
    const lt = FS.letters, [lx, lz] = L(lt.x, lt.z), cell = 0.9, wd = wordWidth('HORIZON', cell);
    withM(b, lx, lz, lt.yaw, () => {
      letters(b, 'HORIZON', -wd / 2, 0.4, 0, cell, 1.2);
      b.box(0, 0.2, 0, wd / 2 + 1, 0.2, 1.2, C('#d8d4cc'), 0);
    });
    for (const t of FS.towers) {
      const [x, z] = L(t[0], t[1]);
      truss(b, x, z, 0, 17, 1.1, STEEL);
      b.box(x, 17.2, z, 1.6, 0.15, 1.2, DARK, 0);
      for (let k = 0; k < 6; k++) b.box(x - 1.2 + (k % 3) * 1.2, 17.7 + Math.floor(k / 3) * 0.7, z, 0.3, 0.28, 0.3, C('#fff4d0'), MAT.LAMP);
    }
    const az = FS.arch, ac = lane(az);
    for (const s of [-1, 1]) {
      const [x, z] = L(ac + s * 12.5, az);
      truss(b, x, z, 0, 10, 1.4, C('#e0e0e4'));
      b.box(x, 0.3, z, 1.1, 0.3, 1.1, PINK, 0);
    }
    beamTruss(b, [L(ac - 12.5, az)[0], 9.4, L(ac - 12.5, az)[1]], [L(ac + 12.5, az)[0], 9.4, L(ac + 12.5, az)[1]], 1.3, C('#e0e0e4'));
    for (const zz of FS.festoons) {
      const c = lane(zz), [x0, z0] = L(c - 11.5, zz), [x1, z1] = L(c + 11.5, zz);
      for (const [x, z] of [[x0, z0], [x1, z1]]) b.cyl(x, 0, z, 0.12, 8, 6, C('#6a5a48'), 0);
      let prev = null;
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = 7.8 - Math.sin(t * Math.PI) * 1.4;
        if (prev) b.beam(prev, [x, y, z], 0.012, BLACK, 0);
        if (k && k < 10) b.box(x, y - 0.12, z, 0.07, 0.09, 0.07, [PINK, YELLOW, CYAN, ORANGE, WHITE][k % 5], MAT.LAMP);
        prev = [x, y, z];
      }
    }
    for (let k = 0; k < 5; k++) {
      const [x, z] = L(802, -1660 - k * 2.2);
      b.box(x, 1.2, z, 0.6, 1.2, 1, C('#2a62b8'), 0, { top: C('#e8e8e8') });
      b.box(x + 0.61, 1, z, 0.02, 0.9, 0.4, C('#1a4a98'), 0);
    }
    const [kx, kz] = L(lane(-1614) + 16, -1614);
    b.box(kx, 1.3, kz, 1.4, 1.3, 1.2, PINK, 0);
    b.box(kx, 2.7, kz, 1.7, 0.1, 1.5, WHITE, 0);
    b.box(kx - 1.41, 1.5, kz, 0.02, 0.5, 0.8, C('#34444e'), MAT.WINDOWS);
    return 22;
  }

  F.Models.LM.festival = b => buildLM(b);

  F.Tex.register('festfloor', () => {
    const c = F.Tex.canvas(128, 128), x = c.getContext('2d');
    F.Tex.tileNoise(x, 128, 128, [214, 210, 204], 16, 61, 8);
    x.fillStyle = 'rgba(70,60,56,0.35)';
    for (let i = 0; i <= 128; i += 32) { x.fillRect(i, 0, 2, 128); x.fillRect(0, i, 128, 2); }
    x.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 128; i += 32) for (let j = 0; j < 128; j += 32) if ((i + j) % 64 === 0) x.fillRect(i + 2, j + 2, 30, 30);
    return c;
  });
  F.Tex.register('festpaint', () => {
    const c = F.Tex.canvas(1024, 512), x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 512);
    x.fillStyle = '#a8a4a0'; x.fillRect(512, 0, 512, 512);
    x.translate(768, 256);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, 250, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e6146e'; x.beginPath(); x.arc(0, 0, 238, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(0, 0, 196, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffc81e'; x.beginPath(); x.arc(0, 0, 156, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1a0a14'; x.font = "italic 900 118px 'Arial Black', Arial"; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save(); x.scale(0.52, 1); x.fillText('HORIZON', 0, -8); x.restore();
    x.font = "italic 900 44px 'Arial Black', Arial"; x.fillStyle = '#ffffff'; x.fillText('RĪGA 2001', 0, 96);
    return c;
  }, { clamp: true });

  function crowdGroup(seed, area, n, facing) {
    const b = new F.Batch(4096), rng = F.rng(seed);
    const shirts = ['#e6146e', '#ff7a1a', '#ffc81e', '#30b4ff', '#f4f4f0', '#3a8a4a', '#1a1a1e', '#8a3ab0', '#c8302a', '#2a62b8'].map(h => C(h));
    const skins = ['#e8c0a0', '#d8a882', '#f0d0b8', '#b88a68'].map(h => C(h));
    const pants = ['#2a3a5a', '#1e1e22', '#5a4a3a', '#3a4a5a'].map(h => C(h));
    for (let i = 0; i < n; i++) {
      const x = F.lerp(area[0], area[2], rng()), z = F.lerp(area[1], area[3], rng()), s = 0.92 + rng() * 0.16, yaw = facing + (rng() - 0.5) * 0.9;
      b.setM(x, 0, z, yaw, s);
      const sh = shirts[Math.floor(rng() * shirts.length)], sk = skins[Math.floor(rng() * skins.length)], pa = pants[Math.floor(rng() * pants.length)];
      b.box(-0.1, 0.42, 0, 0.08, 0.42, 0.09, pa, 0);
      b.box(0.1, 0.42, 0, 0.08, 0.42, 0.09, pa, 0);
      b.box(0, 1.15, 0, 0.21, 0.31, 0.12, sh, 0);
      b.box(0, 1.6, 0, 0.1, 0.12, 0.1, sk, 0);
      b.box(0, 1.73, 0.02, 0.11, 0.04, 0.11, [C('#2a1a10'), C('#c8a060'), C('#6a3a1a'), C('#1a1a1a')][Math.floor(rng() * 4)], 0);
      if (rng() < 0.45) {
        for (const sd of [-1, 1]) b.beam([sd * 0.25, 1.4, 0], [sd * (0.3 + rng() * 0.12), 1.95 + rng() * 0.2, -0.05], 0.045, sk, 0);
      } else for (const sd of [-1, 1]) b.beam([sd * 0.26, 1.42, 0], [sd * 0.3, 0.9, 0.02], 0.045, sh, 0);
      b.clearM();
    }
    return b;
  }

  function crowds() {
    const pit = FS.pit, groups = [];
    const w = (pit.x1 - pit.x0) / 3;
    for (let k = 0; k < 3; k++) groups.push({ batch: crowdGroup(91 + k, [pit.x0 + 1 + k * w, pit.z0 + 3, pit.x0 + (k + 1) * w - 1, pit.z1 - 1.5], 70, Math.PI), phase: k * 2.1 });
    const [fz, vz] = [FS.zones[1], FS.zones[0]];
    groups.push({ batch: crowdGroup(97, [fz.x0 + 2, fz.z0 + 2, fz.x1 - 2, fz.z1 - 9], 34, 0), phase: 0.4, slow: true });
    groups.push({ batch: crowdGroup(99, [vz.x0 + 16, vz.z0 + 2, vz.x1 - 2, vz.z1 - 2], 30, Math.PI / 2), phase: 2.2, slow: true });
    return groups;
  }

  function turntable() {
    const b = new F.Batch(256);
    b.cyl(0, 0.32, 0, 4.2, 0.12, 24, C('#38383e'), 0, { topCol: C('#46464e') });
    for (let i = 0; i < 24; i += 2) {
      const a = i / 24 * TAU;
      b.box(Math.cos(a) * 3.9, 0.46, Math.sin(a) * 3.9, 0.12, 0.02, 0.12, C('#fff4d0'), MAT.LAMP);
    }
    return b;
  }

  function balloon() {
    const b = new F.Batch(1024), n = 16, rows = 9, R = 7.5;
    const prof = t => [Math.sin(t * Math.PI * 0.94) * R * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.9), (1 - Math.cos(t * Math.PI)) * 0.5 * R * 2.4];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, col = [PINK, ORANGE, YELLOW, WHITE][i % 4];
      for (let r = 0; r < rows; r++) {
        const p = prof(1 - r / rows), q = prof(1 - (r + 1) / rows);
        b.quad([Math.cos(a0) * p[0], p[1], Math.sin(a0) * p[0]], [Math.cos(a0) * q[0], q[1], Math.sin(a0) * q[0]], [Math.cos(a1) * q[0], q[1], Math.sin(a1) * q[0]], [Math.cos(a1) * p[0], p[1], Math.sin(a1) * p[0]], col, 0);
      }
    }
    b.box(0, -2.2, 0, 0.8, 0.5, 0.8, C('#8a6a44'), 0);
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) b.beam([x, -1.7, z], [x * 2.2, 0.8, z * 2.2], 0.02, BLACK, 0);
    return b;
  }

  function screenQuad(w, h) {
    const b = new F.Batch(8);
    b.quad([w / 2, 0, 0], [-w / 2, 0, 0], [-w / 2, h, 0], [w / 2, h, 0], C('#ffffff'), 0, [0, 1, 1, 1, 1, 0, 0, 0], [0, 0, -1]);
    return b;
  }

  function paintScreen(cv, info, t) {
    const x = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1a0a24'); g.addColorStop(0.5, '#3a0a3a'); g.addColorStop(1, '#0a1a3a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const page = Math.floor(t / 5) % 3, k = (t % 5) / 5;
    x.save();
    x.globalAlpha = 0.35;
    for (let i = 0; i < 9; i++) {
      x.fillStyle = ['#e6146e', '#ff7a1a', '#ffc81e'][i % 3];
      const yy = ((i * 37 + t * 60) % (H + 40)) - 20;
      x.fillRect(0, yy, W, 3);
    }
    x.restore();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const big = s => `italic 900 ${Math.round(H * s)}px 'Arial Black', Arial`;
    x.fillStyle = '#fff';
    if (page === 0) {
      x.font = big(0.3); x.fillText('HORIZON', W / 2, H * 0.4);
      x.font = `italic 700 ${Math.round(H * 0.12)}px Arial`; x.fillStyle = '#ffc81e'; x.fillText('RĪGA 2001', W / 2, H * 0.68);
    } else if (page === 1) {
      x.font = `italic 700 ${Math.round(H * 0.11)}px Arial`; x.fillStyle = '#ffc81e'; x.fillText('ГОНЩИК ФЕСТИВАЛЯ', W / 2, H * 0.2);
      x.font = big(0.2); x.fillStyle = '#fff'; x.fillText(info.name, W / 2, H * 0.45, W * 0.9);
      x.font = `italic 700 ${Math.round(H * 0.1)}px Arial`; x.fillText(`УРОВЕНЬ ${info.level} · ${info.band}`, W / 2, H * 0.72, W * 0.9);
    } else {
      x.font = `italic 700 ${Math.round(H * 0.11)}px Arial`; x.fillStyle = '#30b4ff'; x.fillText('ПОГОДА НАД МЕЖАПАРКСОМ', W / 2, H * 0.2, W * 0.92);
      x.font = big(0.2); x.fillStyle = '#fff'; x.fillText(info.weather, W / 2, H * 0.47, W * 0.9);
      x.font = `italic 700 ${Math.round(H * 0.11)}px Arial`; x.fillText(info.time, W / 2, H * 0.74);
    }
    x.fillStyle = 'rgba(0,0,0,0.25)';
    for (let yy = 0; yy < H; yy += 3) x.fillRect(0, yy, W, 1);
    x.fillStyle = `rgba(255,255,255,${(1 - k) * 0.06})`; x.fillRect(0, 0, W, H);
  }

  function decorate(scene) {
    const w = scene.w, y = w.festY === undefined ? 0 : w.festY, A = F.Ads;
    const ch = (x, z) => scene.chunkAt(x, z);
    for (const pd of w.festPads.list) {
      const src = FS.pads[w.festPads.list.indexOf(pd)], key = src.k === 'floor' ? 'festfloor' : src.k;
      const c = scene.chunkAt(F.polyBox(pd.poly).x0 * 0.5 + F.polyBox(pd.poly).x1 * 0.5, F.polyBox(pd.poly).z0 * 0.5 + F.polyBox(pd.poly).z1 * 0.5);
      const b = scene.g(c, key), col = C(src.col || '#ffffff'), poly = pd.poly;
      let cx = 0, cz = 0;
      for (const p of poly) { cx += p[0]; cz += p[1]; }
      cx /= poly.length; cz /= poly.length;
      const s = key === 'festfloor' ? 1 / 3 : 1 / 8;
      b.need(poly.length + 1, poly.length * 3);
      const ci = b.v(cx, y + 0.04, cz, cx * s, cz * s, 0, 1, 0, col, 0), first = b.n;
      for (const p of poly) b.v(p[0], y + 0.04, p[1], p[0] * s, p[1] * s, 0, 1, 0, col, 0);
      let area = 0;
      for (let i = 0; i < poly.length; i++) { const a = poly[i], q = poly[(i + 1) % poly.length]; area += a[0] * q[1] - q[0] * a[1]; }
      for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; if (area > 0) b.tri(ci, first + j, first + i); else b.tri(ci, first + i, first + j); }
      scene.grow(c, y - 1, y + 1);
    }
    const pk = FS.parking, pb = scene.g(ch(pk.x0, pk.rows[0]), 'festpaint'), line = C('#f4f4f0');
    for (const rz of pk.rows) for (let x = pk.x0 - 1.7; x <= pk.x1 + 1.8; x += 3.4) pb.quad([x - 0.06, y + 0.06, rz + 2.6], [x + 0.06, y + 0.06, rz + 2.6], [x + 0.06, y + 0.06, rz - 2.6], [x - 0.06, y + 0.06, rz - 2.6], line, 0, null, [0, 1, 0]);
    const lg = scene.g(ch(911, -1626), 'festpaint');
    lg.quad([903, y + 0.06, -1617], [921, y + 0.06, -1617], [921, y + 0.06, -1635], [903, y + 0.06, -1635], C('#ffffff'), 0, [0.5, 1, 1, 1, 1, 0, 0.5, 0], [0, 1, 0]);
    const ad = (fx, fz) => [scene.g(ch(fx, fz), 'adatlas')];
    const st = FS.stage;
    {
      const [fb] = ad(st.x, st.z);
      A.adQuad(fb, [st.x - st.w / 2 + 1, st.z + st.d / 2 + 0.62], [st.x + st.w / 2 - 1, st.z + st.d / 2 + 0.62], y + 14.2, y + 15.6, [0, 0, 1], 'b_hz', 0.8);
    }
    const az = FS.arch, ac = lane(az);
    {
      const [fb] = ad(ac, az);
      A.adQuad(fb, [ac - 11.6, az + 0.72], [ac + 11.6, az + 0.72], y + 8.2, y + 9.9, [0, 0, 1], 'b_hz', 0.8);
      A.adQuad(fb, [ac - 11.6, az - 0.72], [ac + 11.6, az - 0.72], y + 8.2, y + 9.9, [0, 0, -1], 'b_welcome', 0.8);
    }
    const pit = FS.pit, hz = ['h_cola', 'h_vetra', 'h_hz', 'h_mobile', 'h_fm', 'h_zibens'];
    {
      const [fb] = ad(pit.x0, pit.z1);
      const n = 5, len = (pit.x1 - pit.x0) / n;
      for (let i = 0; i < n; i++) A.adQuad(fb, [pit.x0 + i * len + 0.2, pit.z1 + 0.06], [pit.x0 + (i + 1) * len - 0.2, pit.z1 + 0.06], y + 0.3, y + 1.1, [0, 0, 1], hz[i % hz.length], 0.35);
      for (const [x, s] of [[pit.x0, -1], [pit.x1, 1]]) for (let i = 0; i < 3; i++) {
        const z0 = pit.z1 - i * 8.6 - 0.3, z1 = z0 - 8;
        A.adQuad(fb, [x + s * 0.06, z0], [x + s * 0.06, z1], y + 0.3, y + 1.1, [s, 0, 0], hz[(i + 2 + (s > 0 ? 3 : 0)) % hz.length], 0.35);
      }
    }
    const bd = FS.backdrop;
    {
      const [fb] = ad(bd.x, bd.z);
      const designs = ['cola', 'hz', 'vetra'], pw = (bd.w - 1) / 3;
      designs.forEach((d, i) => { const x0 = bd.x - bd.w / 2 + 0.5 + i * pw; A.adQuad(fb, [x0 + 0.2, bd.z - 0.15], [x0 + pw - 0.2, bd.z - 0.15], y + 0.6, y + 0.6 + (pw - 0.4) / 2, [0, 0, 1], d, 0.9); });
    }
    const SIGN = { cola: 'h_cola', fm: 'h_fm', mobile: 'h_mobile', kafija: 'r_kafija', zibens: 'h_zibens' };
    for (const bo of FS.booths) {
      const [fb] = ad(bo.x, bo.z);
      A.adQuad(fb, [bo.x + 3.17, bo.z - 3.5], [bo.x + 3.17, bo.z + 3.5], y + 3.95, y + 4.85, [1, 0, 0], SIGN[bo.k], 0.9);
    }
    for (const t of FS.trucks) {
      const [fb] = ad(t.x, t.z);
      A.adQuad(fb, [t.x - 2.8, t.z - 1.22], [t.x + 1.6, t.z - 1.22], y + 2.1, y + 2.62, [0, 0, -1], SIGN[t.k], 0.8);
    }
    {
      const s = FS.store, [fb] = ad(s.x, s.z);
      A.adQuad(fb, [s.x - 4.05, s.z - 4.6], [s.x - 4.05, s.z + 4.6], y + 2.1, y + 2.9, [-1, 0, 0], 'b_hz', 0.7);
    }
    scene.festScreens = [
      { x: st.x, z: st.z - st.d / 2 + 1.25, y: y + 4.1, yaw: Math.PI, w: 28.6, h: 9.3 },
      { x: st.x - st.w / 2 - 5, z: st.z + 5.2, y: y + 4.1, yaw: Math.PI, w: 6, h: 8.2 },
      { x: st.x + st.w / 2 + 5, z: st.z + 5.2, y: y + 4.1, yaw: Math.PI, w: 6, h: 8.2 }
    ];
    scene.festLights = [];
    for (const t of FS.towers) scene.festLights.push({ x: t[0], y: y + 17.9, z: t[1], kind: 'tower' });
    for (const zz of FS.festoons) {
      const c = lane(zz);
      for (let k = 1; k < 10; k++) { const t = k / 10; scene.festLights.push({ x: c - 11.5 + 23 * t, y: y + 7.8 - Math.sin(t * Math.PI) * 1.4 - 0.12, z: zz, kind: 'bulb', col: k % 5 }); }
    }
    for (let i = 0; i < 12; i++) scene.festLights.push({ x: st.x - st.w / 2 + 2 + i * (st.w - 4) / 11, y: y + 15.9, z: st.z + st.d / 2 + 0.3, kind: 'stage', col: i % 4 });
  }

  F.Fest = { FS, lane, buildLM, crowds, turntable, balloon, screenQuad, paintScreen, decorate, GLYPH, wordWidth };
})(globalThis.Forza = globalThis.Forza || {});
