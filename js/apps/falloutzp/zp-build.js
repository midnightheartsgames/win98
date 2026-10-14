(function (Z) {
  'use strict';

  const FACB = 64;
  const LEAFB = 128;
  const ROAD_Y = { P: 0.07, S: 0.066, T: 0.062, R: 0.058, W: 0.055, V: 0.05 };

  const fac = k => FACB + Z.FAC[k];
  const mat = k => Z.MAT[k];

  function wallsOf(mb, poly, y0, y1, opts) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (L < 0.05) continue;
      mb.setMat(opts.mat, opts.seed || 0, opts.dmg || 0);
      const us = opts.uvs || 0.25;
      mb.wall(p[0], p[1], q[0], q[1], y0, y1, 0, L * us, y0 * us, y1 * us, opts.two);
    }
  }

  function facadeWall(mb, b, p, q, y0, y1, v0, v1, facKey, plainKey, two) {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L < 0.05) return;
    const S = b.S;
    if (!facKey || L < S.mod * 0.55) {
      mb.setMat(mat(plainKey), b.seed, 0);
      mb.wall(p[0], p[1], q[0], q[1], y0, y1, 0, L * 0.25, y0 * 0.25, y1 * 0.25, two);
      return;
    }
    const n = Math.max(1, Math.round(L / S.mod));
    mb.setMat(fac(facKey), b.seed, Math.round(b.damage * 255));
    mb.wall(p[0], p[1], q[0], q[1], y0, y1, 0, n, v0, v1, two);
  }

  function roofGable(mb, b, top, matKey) {
    const o = b.obb;
    const eave = 0.45;
    const hl = o.len / 2 + eave, hw = o.wid / 2 + eave;
    const rh = Math.min(4.2, o.wid * 0.42);
    const ax = o.ax, az = o.az, bx = -az, bz = ax;
    const P = (a, w, y) => [o.cx + ax * a + bx * w, y, o.cz + az * a + bz * w];
    const yE = top - 0.15;
    mb.setMat(mat(matKey), b.seed, 0);
    const sideA = [P(-hl, hw, yE), P(-hl, 0, top + rh), P(hl, 0, top + rh), P(hl, hw, yE)];
    const triN = (A, B, C) => { const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
    const emit = (Q, uvs) => {
      const g = triN(Q[0], Q[1], Q[2]);
      const nn = Math.hypot(...g) || 1;
      const nrm = [g[0] / nn, g[1] / nn, g[2] / nn];
      if (nrm[1] < 0) { mb.quad([Q[3], Q[2], Q[1], Q[0]], nrm.map(v => -v), [uvs[3], uvs[2], uvs[1], uvs[0]]); }
      else mb.quad(Q, nrm, uvs);
    };
    emit(sideA, [[0, 0], [0, hw * 0.5], [hl, hw * 0.5], [hl, 0]]);
    const sideB = [P(hl, -hw, yE), P(hl, 0, top + rh), P(-hl, 0, top + rh), P(-hl, -hw, yE)];
    emit(sideB, [[0, 0], [0, hw * 0.5], [hl, hw * 0.5], [hl, 0]]);
    mb.setMat(mat(b.S.plain), b.seed, 0);
    const gl = o.len / 2;
    for (const s of [-1, 1]) {
      const A = P(s * gl, -o.wid / 2, top), B = P(s * gl, o.wid / 2, top), C = P(s * gl, 0, top + rh * (o.wid / 2) / hw);
      const g = triN(A, B, C);
      const out = [ax * s, 0, az * s];
      const flip = g[0] * out[0] + g[2] * out[2] < 0;
      const tri = flip ? [A, C, B] : [A, B, C];
      const i0 = mb.v(tri[0][0], tri[0][1], tri[0][2], out[0], 0, out[2], 0, 0);
      const i1 = mb.v(tri[1][0], tri[1][1], tri[1][2], out[0], 0, out[2], 1, 0);
      const i2 = mb.v(tri[2][0], tri[2][1], tri[2][2], out[0], 0, out[2], 0.5, 0.6);
      mb.tri(i0, i1, i2);
    }
  }

  function parapet(mb, b, poly, top, h, plainKey) {
    const inner = Z.offsetPoly(poly, -0.28);
    mb.setMat(mat(plainKey), b.seed, 0);
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      mb.wall(p[0], p[1], q[0], q[1], top, top + h, 0, L * 0.25, 0, h * 0.25);
      const a = inner[i], c = inner[(i + 1) % poly.length];
      mb.wall(c[0], c[1], a[0], a[1], top, top + h, 0, L * 0.25, 0, h * 0.25);
      mb.quad([[a[0], top + h, a[1]], [p[0], top + h, p[1]], [q[0], top + h, q[1]], [c[0], top + h, c[1]]], [0, 1, 0], [[0, 0], [0, 0.1], [L * 0.25, 0.1], [L * 0.25, 0]]);
    }
  }

  function cornice(mb, b, poly, y, h, d) {
    const out = Z.offsetPoly(poly, d);
    mb.setMat(mat(b.S.plain), b.seed, 0);
    for (let i = 0; i < poly.length; i++) {
      const p = out[i], q = out[(i + 1) % out.length];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      mb.wall(p[0], p[1], q[0], q[1], y, y + h, 0, L * 0.25, 0, h * 0.25);
      const a = poly[i], c = poly[(i + 1) % poly.length];
      mb.quad([[a[0], y + h, a[1]], [p[0], y + h, p[1]], [q[0], y + h, q[1]], [c[0], y + h, c[1]]], [0, 1, 0], [[0, 0], [0, 0.1], [L * 0.25, 0.1], [L * 0.25, 0]]);
      mb.quad([[c[0], y, c[1]], [q[0], y, q[1]], [p[0], y, p[1]], [a[0], y, a[1]]], [0, -1, 0], [[0, 0], [0, 0.1], [L * 0.25, 0.1], [L * 0.25, 0]]);
    }
  }

  function rubble(mb, x, y, z, r, R) {
    mb.setMat(mat('debris'), 0, 0);
    const n = 3 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.7;
      const s = 0.6 + R() * r * 0.5;
      mb.box(x + Math.cos(a) * d, y - 0.2, z + Math.sin(a) * d, s * (0.6 + R()), 0.3 + R() * s * 0.6, s * (0.6 + R()), R() * 3);
    }
  }

  function entrances(mb, b, R) {
    if (!(b.style === 'khrushRed' || b.style === 'khrushWhite' || b.style === 'khrushPanel' || b.style === 'panel') || !b.obb) return;
    const o = b.obb;
    let best = -1, bl = 0;
    for (let i = 0; i < b.poly.length; i++) {
      const p = b.poly[i], q = b.poly[(i + 1) % b.poly.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (L > bl) { bl = L; best = i; }
    }
    if (best < 0 || bl < 14) return;
    const sideSign = R() < 0.5 ? 0 : 1;
    let i = best;
    if (sideSign) {
      let opp = -1, od = 0;
      for (let k = 0; k < b.poly.length; k++) {
        const p = b.poly[k], q = b.poly[(k + 1) % b.poly.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
        const dot = Math.abs(((q[0] - p[0]) * o.ax + (q[1] - p[1]) * o.az) / (L || 1));
        if (k !== best && L > od && dot > 0.9) { od = L; opp = k; }
      }
      if (opp >= 0 && od > 14) i = opp;
    }
    const p = b.poly[i], q = b.poly[(i + 1) % b.poly.length];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L, nx = uz, nz = -ux;
    const n = Math.max(1, Math.floor(L / 16));
    for (let k = 0; k < n; k++) {
      const s = L * (k + 0.5) / n;
      const cx = p[0] + ux * s + nx * 0.03, cz = p[1] + uz * s + nz * 0.03;
      const y = b.base;
      mb.setMat(mat('wood'), 0, 0);
      mb.setTint(70, 60, 54);
      mb.quad([[cx - ux * 0.75, y, cz - uz * 0.75], [cx - ux * 0.75, y + 2.2, cz - uz * 0.75], [cx + ux * 0.75, y + 2.2, cz + uz * 0.75], [cx + ux * 0.75, y, cz + uz * 0.75]], [nx, 0, nz], [[0, 0], [0, 1], [0.5, 1], [0.5, 0]]);
      mb.setTint(128, 128, 128);
      mb.setMat(mat('concrete'), 0, 0);
      mb.box(cx + nx * 0.7, y + 2.5, cz + nz * 0.7, 2.2, 0.14, 1.4, Math.atan2(uz, ux), 0.25);
      mb.box(cx + nx * 0.8, y - 0.3, cz + nz * 0.8, 2.0, 0.42, 1.6, Math.atan2(uz, ux), 0.25);
    }
  }

  Z.Build = {
    building(mb, b) {
      const R = Z.rng(b.osm % 1000003 + 17);
      const S = b.S, poly = b.poly, base = b.base;
      mb.setTint(b.tint[0], b.tint[1], b.tint[2], 255);
      const plinthTop = base + 0.45;
      wallsOf(mb, Z.offsetPoly(poly, 0.06), base - 2.5, plinthTop, { mat: mat(b.style === 'stalin' ? 'granite' : 'concrete'), uvs: 0.3 });
      if (b.style === 'garage') {
        wallsOf(mb, poly, plinthTop, base + b.height, { mat: mat('concrete'), uvs: 0.25 });
        let li = 0, ll = 0;
        for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L > ll) { ll = L; li = i; } }
        const p = poly[li], q = poly[(li + 1) % poly.length], ux = (q[0] - p[0]) / ll, uz = (q[1] - p[1]) / ll, nx = uz, nz = -ux;
        const n = Math.max(1, Math.floor(ll / 3.4));
        for (let k = 0; k < n; k++) {
          const s0 = ll * k / n + 0.35, s1 = ll * (k + 1) / n - 0.35;
          mb.setMat(mat(R() < 0.5 ? 'rust' : 'paintGreen'), 0, 0);
          const a = [p[0] + ux * s0 + nx * 0.02, p[1] + uz * s0 + nz * 0.02], c = [p[0] + ux * s1 + nx * 0.02, p[1] + uz * s1 + nz * 0.02];
          mb.wall(a[0], a[1], c[0], c[1], base + 0.1, base + 2.2, 0, 1, 0, 1);
        }
        mb.setMat(mat('roofFelt'), 0, 0);
        mb.flatPoly(poly, base + b.height, 0.25);
        return;
      }
      const top = base + b.height;
      const gF = b.floorH;
      if (b.ruin) {
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i], q = poly[(i + 1) % poly.length];
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (L < 0.05) continue;
          const segs = Math.max(1, Math.min(5, Math.round(L / 9)));
          for (let s = 0; s < segs; s++) {
            const t0 = s / segs, t1 = (s + 1) / segs;
            const a = [Z.lerp(p[0], q[0], t0), Z.lerp(p[1], q[1], t0)], c = [Z.lerp(p[0], q[0], t1), Z.lerp(p[1], q[1], t1)];
            const keep = Math.max(1, b.floors - Math.floor(R() * Math.max(2, b.floors * 0.7)));
            const yTop = base + keep * gF;
            facadeWall(mb, b, a, c, plinthTop, base + gF, 0.1, 1, S.ground, S.plain, true);
            if (keep > 1) facadeWall(mb, b, a, c, base + gF, yTop, 1, keep, S.fac, S.plain, true);
          }
        }
        mb.setMat(mat('concrete'), 0, 0);
        mb.setTint(90, 88, 86);
        mb.flatPoly(Z.offsetPoly(poly, -0.2), base + gF, 0.25);
        mb.setTint(128, 128, 128);
        const c = b.c;
        rubble(mb, c[0], base, c[1], Math.min(8, Math.sqrt(b.area) * 0.35), R);
        for (let k = 0; k < 2; k++) { const i = Math.floor(R() * poly.length), p = poly[i]; rubble(mb, p[0], base, p[1], 3, R); }
        return;
      }
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length];
        facadeWall(mb, b, p, q, plinthTop, base + gF, 0.1, 1, b.shop ? S.ground : S.fac, S.plain);
        if (b.floors > 1) facadeWall(mb, b, p, q, base + gF, top, 1, b.floors, S.fac, S.plain);
      }
      if (b.gable) {
        roofGable(mb, b, top, b.style === 'house' ? (R() < 0.6 ? 'roofSlate' : 'roofTin') : (R() < 0.5 ? 'roofTin' : 'roofSlate'));
      } else {
        if (S.cornice) cornice(mb, b, poly, top - 0.55, 0.55, 0.38);
        mb.setMat(mat('roofFelt'), 0, 0);
        mb.flatPoly(poly, top, 0.25);
        if (S.parapet > 0) parapet(mb, b, poly, top, S.parapet, S.plain);
        if (b.style === 'panel' && b.obb) {
          mb.setMat(mat(S.plain), b.seed, 0);
          mb.box(b.obb.cx, top, b.obb.cz, 4, 2.6, 4, b.obb.yaw, 0.25);
        }
        if (b.style === 'industrial' && b.area > 500 && R() < 0.35) {
          mb.setMat(mat('brickRed'), 0, 0);
          const p = poly[Math.floor(R() * poly.length)];
          mb.cyl(Z.lerp(p[0], b.c[0], 0.3), base, Z.lerp(p[1], b.c[1], 0.3), 1.6, 1.0, b.height + 16 + R() * 18, 10, 0.25);
        }
      }
      if (b.style === 'house') {
        mb.setMat(mat('brickRed'), 0, 0);
        mb.box(b.c[0] + (R() - 0.5) * 2, top + 1.2, b.c[1] + (R() - 0.5) * 2, 0.55, 2.4, 0.55, R() * 3, 0.25);
      }
      entrances(mb, b, R);
    },

    roads(map, add) {
      for (const r of map.roads) {
        if (r.bridge || !ROAD_Y[r.k] || !r.hs) continue;
        const pts = r.pts, L = r.len, n = r.hs.length - 1;
        const half = r.w / 2, yo = ROAD_Y[r.k];
        const mid = pts[Math.floor(pts.length / 2)];
        const city = [Z.COVER.urban, Z.COVER.industrial, Z.COVER.park, Z.COVER.pitch].includes(map.coverAt(mid[0], mid[1])) && r.k !== 'V';
        const steps = Math.max(2, Math.ceil(L / 3));
        let prev = null;
        for (let i = 0; i <= steps; i++) {
          const s = L * i / steps;
          const p = Z.alongPoly(pts, s);
          const fi = Z.clamp(s / L * n, 0, n), i0 = Math.floor(fi), i1 = Math.min(n, i0 + 1);
          const h = Z.lerp(r.hs[i0], r.hs[i1], fi - i0);
          let dx = p.dx, dz = p.dz;
          if (i > 0 && i < steps) {
            const pa = Z.alongPoly(pts, Math.max(0, s - 2)), pb = Z.alongPoly(pts, Math.min(L, s + 2));
            const tx = pb.x - pa.x, tz = pb.z - pa.z, tl = Math.hypot(tx, tz) || 1;
            dx = tx / tl; dz = tz / tl;
          }
          const nx = -dz, nz = dx;
          const row = { x: p.x, z: p.z, nx, nz, h, s };
          if (prev) add(p.x, p.z, mb => {
            const A = prev, B = row;
            const lA = [A.x + A.nx * half, A.z + A.nz * half], rA = [A.x - A.nx * half, A.z - A.nz * half];
            const lB = [B.x + B.nx * half, B.z + B.nz * half], rB = [B.x - B.nx * half, B.z - B.nz * half];
            const yl = (pp, hh) => Math.max(hh, map.groundH(pp[0], pp[1])) + yo;
            mb.setTint(128, 128, 128);
            mb.setMat(mat(r.k === 'V' && !city ? 'gravel' : 'asphalt'), 0, 0);
            const v0 = A.s / 4, v1 = B.s / 4;
            mb.quad([[lA[0], yl(lA, A.h), lA[1]], [lB[0], yl(lB, B.h), lB[1]], [rB[0], yl(rB, B.h), rB[1]], [rA[0], yl(rA, A.h), rA[1]]].map(v => v), [0, 1, 0], [[0, v0], [0, v1], [r.w / 4, v1], [r.w / 4, v0]]);
            if (city && r.k !== 'W') {
              const sw = r.k === 'P' ? 3.2 : 2.4;
              for (const side of [1, -1]) {
                const o0 = half * side, o1 = (half + sw) * side;
                const a0 = [A.x + A.nx * o0, A.z + A.nz * o0], b0 = [B.x + B.nx * o0, B.z + B.nz * o0];
                const a1 = [A.x + A.nx * o1, A.z + A.nz * o1], b1 = [B.x + B.nx * o1, B.z + B.nz * o1];
                const ya = Math.max(A.h, map.groundH(a1[0], a1[1])) + 0.16, yb = Math.max(B.h, map.groundH(b1[0], b1[1])) + 0.16;
                mb.setMat(mat('sidewalk'), 0, 0);
                if (side > 0) mb.quad([[a1[0], ya, a1[1]], [b1[0], yb, b1[1]], [b0[0], yb, b0[1]], [a0[0], ya, a0[1]]], [0, 1, 0], [[0, v0], [0, v1], [sw / 3, v1], [sw / 3, v0]]);
                else mb.quad([[a0[0], ya, a0[1]], [b0[0], yb, b0[1]], [b1[0], yb, b1[1]], [a1[0], ya, a1[1]]], [0, 1, 0], [[0, v0], [0, v1], [sw / 3, v1], [sw / 3, v0]]);
                mb.setMat(mat('granite'), 0, 0);
                const ra = Math.max(A.h, map.groundH(a0[0], a0[1])) + yo, rb = Math.max(B.h, map.groundH(b0[0], b0[1])) + yo;
                if (side > 0) mb.wall(a0[0], a0[1], b0[0], b0[1], Math.min(ra, rb) - 0.05, Math.max(ya, yb), 0, 1, 0, 0.1);
                else mb.wall(b0[0], b0[1], a0[0], a0[1], Math.min(ra, rb) - 0.05, Math.max(ya, yb), 0, 1, 0, 0.1);
              }
            }
          });
          prev = row;
        }
      }
    }
  };

  Z.Build.treeTemplates = () => {
    const out = {};
    const leaf = (mb, cx, cy, cz, w, h, yaw, tilt, li) => {
      mb.setMat(LEAFB + li, 0, 0);
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const ux = c * w / 2, uz = s * w / 2;
      const tx = -s * Math.sin(tilt) * h / 2, ty = Math.cos(tilt) * h / 2, tz = c * Math.sin(tilt) * h / 2;
      const P = [[cx - ux - tx, cy - ty, cz - uz - tz], [cx - ux + tx, cy + ty, cz - uz + tz], [cx + ux + tx, cy + ty, cz + uz + tz], [cx + ux - tx, cy - ty, cz + uz - tz]];
      const nrm = [-s * 0.3, 0.9, c * 0.3];
      mb.quad(P, nrm, [[0, 1], [0, 0], [1, 0], [1, 1]]);
      mb.quad([P[3], P[2], P[1], P[0]], [s * 0.3, 0.9, -c * 0.3], [[1, 1], [1, 0], [0, 0], [0, 1]]);
    };
    const crown = (mb, R, li, cy, rx, ry, n, size) => {
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, e = (R() - 0.3) * 1.2;
        const x = Math.cos(a) * rx * (0.3 + R() * 0.7), z = Math.sin(a) * rx * (0.3 + R() * 0.7), y = cy + Math.sin(e) * ry;
        leaf(mb, x, y, z, size * (0.8 + R() * 0.4), size * (0.8 + R() * 0.4), R() * Math.PI, (R() - 0.5) * 0.8, li);
      }
    };
    const trunk = (mb, h, r, R) => {
      mb.setMat(Z.MAT.bark, 0, 0);
      mb.setTint(128, 128, 128);
      mb.cyl(0, -0.3, 0, r, r * 0.55, h + 0.3, 6, 0.6, false);
      for (let i = 0; i < 3; i++) {
        const a = R() * Math.PI * 2, y = h * (0.6 + R() * 0.3);
        const m0 = mb.n;
        mb.cyl(0, 0, 0, r * 0.28, r * 0.08, h * 0.3, 5, 0.6, false);
        const M = Z.M4.mul(Z.M4.trs(0, y, 0, a, 0, 0), Z.M4.trs(0, 0, 0, 0, 0, -0.5 - R() * 0.35));
        mb.transformFrom(m0, M);
      }
    };
    const L = Z.FOLIAGE;
    const make = (name, fn) => { const mb = new Z.MeshBuilder(); fn(mb, Z.rng(Z.hashStr(name))); out[name] = mb; };
    make('oak', (mb, R) => { trunk(mb, 6, 0.38, R); crown(mb, R, L.oak, 8.2, 3.8, 2.4, 16, 3.8); });
    make('maple', (mb, R) => { trunk(mb, 6.5, 0.3, R); crown(mb, R, L.oak, 8.6, 3.0, 2.6, 13, 3.4); });
    make('chestnut', (mb, R) => { trunk(mb, 5.5, 0.34, R); crown(mb, R, L.oak, 7.8, 3.4, 2.8, 15, 3.6); });
    make('acacia', (mb, R) => { trunk(mb, 5, 0.26, R); crown(mb, R, L.acacia, 7, 3.2, 1.8, 13, 3.2); });
    make('apricot', (mb, R) => { trunk(mb, 2.4, 0.2, R); crown(mb, R, L.acacia, 3.6, 2.4, 1.2, 10, 2.6); });
    make('poplar', (mb, R) => {
      trunk(mb, 4, 0.36, R);
      for (let i = 0; i < 7; i++) leaf(mb, (R() - 0.5) * 0.6, 9 + R() * 3, (R() - 0.5) * 0.6, 3.6, 15 + R() * 3, i / 7 * Math.PI, (R() - 0.5) * 0.15, L.poplar);
    });
    make('willow', (mb, R) => { trunk(mb, 3.2, 0.42, R); crown(mb, R, L.willow, 5, 3.8, 1.6, 14, 4.2); });
    make('pine', (mb, R) => {
      trunk(mb, 10, 0.3, R);
      for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) leaf(mb, (R() - 0.5) * 1.2, 9.5 + k * 1.4 + R(), (R() - 0.5) * 1.2, 3.4 - k * 0.5, 1.8, R() * Math.PI, 1.2 + (R() - 0.5) * 0.4, L.pine);
    });
    make('dead', (mb, R) => {
      trunk(mb, 6, 0.3, R);
      mb.setMat(Z.MAT.bark, 0, 0);
      for (let i = 0; i < 5; i++) {
        const m0 = mb.n;
        mb.cyl(0, 0, 0, 0.12, 0.03, 2.4 + R() * 1.8, 4, 0.6, false);
        mb.transformFrom(m0, Z.M4.mul(Z.M4.trs(0, 3 + R() * 3, 0, R() * 6.28, 0, 0), Z.M4.trs(0, 0, 0, 0, 0, -0.6 - R() * 0.6)));
      }
      crown(mb, R, L.dry, 7.5, 2.4, 1.6, 4, 2.4);
    });
    return out;
  };
  Z.LEAF_BASE = LEAFB;
  Z.FACADE_BASE = FACB;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
