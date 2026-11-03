(function (F) {
  'use strict';

  const { Batch, shade, C } = F.Models;
  const MAT = F.MAT;

  function stations(sh) {
    const S = [];
    const add = (f, top, w, cabin) => {
      if (S.length && f <= S[S.length - 1].f + 0.004) return;
      S.push({ f, top, w, cabin });
    };
    add(0, sh.nose * 0.86, 0.9, false);
    add(0.035, sh.nose, 0.97, false);
    if (sh.ws > 0.17) add(0.13, sh.nose + (sh.hood - sh.nose) * 0.62, 1, false);
    add(sh.ws, sh.hood, 1, false);
    add(sh.wt, sh.hgt, sh.tum, true);
    add(sh.rt, sh.hgt * 0.995, sh.tum, true);
    add(sh.rb, sh.deck, 0.99, false);
    if (sh.rb < 0.93) add(0.965, sh.tail + (sh.deck - sh.tail) * 0.6, 0.97, false);
    add(1, sh.tail * 0.9, 0.9, false);
    for (const s of S) {
      const t = F.clamp((s.f - sh.ws) / Math.max(0.05, sh.rb - sh.ws), 0, 1);
      const belt = F.lerp(sh.hood, Math.min(sh.deck, sh.hood + 0.2), t) + 0.02;
      s.belt = s.cabin ? belt : s.top - (s.f === 0 ? 0.08 : 0.035);
      if (s.belt > s.top - 0.02) s.belt = s.top - 0.02;
    }
    return S;
  }

  const DARK = C('#141416'), GLASS = C('#2a3440'), UNDER = C('#202022'), CHROME = C('#d8dade'), BLACK = C('#1c1c1e'), HEAD = C('#eef2f6'), TAILC = C('#c01818'), AMBER = C('#f0a020'), GRILL = C('#101012');
  const PAINT = C('#ffffff'), GRILLT = C('#4a4a50'), REVC = C('#e8ecf0');
  const ROUNDEL = [C('#1e62b6'), C('#f2f2f0')], ROUNDEL_RING = C('#141416');
  const TIRE = C('#1c1c1e'), WALL = C('#262629'), BARREL = C('#3a3b3e'), HOLE = C('#141416'), ALLOY = C('#c8ccd2'), STEEL = C('#9ea2a6'), DISC = C('#8a8c90'), CALIPER = C('#3a3c40'), CALIPER_RED = C('#c81e1e');

  const LODS = [
    { step: 22, ends: [0.006, 0.016, 0.032], arch: 8, pts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], arc: 4, deco: 2 },
    { step: 7, ends: [], arch: 3, pts: [0, 2, 3, 4, 6, 7, 9, 10], arc: 1, deco: 1 },
    { step: 0, ends: [], arch: 0, pts: [0, 2, 4, 7, 9, 10], arc: 0, deco: 0 }
  ];
  const BUMPERS = {
    body: { h: 0.19, p: 0.03, d: 0.07, y: 0.115, ext: 0.05 },
    chrome: { h: 0.1, p: 0.08, d: 0.05, y: 0.1, ext: 0.12 },
    black: { h: 0.14, p: 0.06, d: 0.07, y: 0.1, ext: 0.08 },
    alu: { h: 0.11, p: 0.065, d: 0.05, y: 0.1, ext: 0.08 }
  };

  function polyline(pts) {
    return f => {
      if (f <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        if (f <= pts[i][0]) {
          const a = pts[i - 1], c = pts[i];
          return a[1] + (c[1] - a[1]) * (f - a[0]) / Math.max(1e-6, c[0] - a[0]);
        }
      }
      return pts[pts.length - 1][1];
    };
  }

  function rounded(fn, d) {
    return f => {
      let s = 0, n = 0;
      for (let j = -3; j <= 3; j++) {
        const k = 1 - Math.abs(j) / 4;
        s += fn(F.clamp(f + j * d / 3, 0, 1)) * k;
        n += k;
      }
      return s / n;
    };
  }

  function bpProfiles(car, blue, lod) {
    const sh = car.sh, L = sh.len, W = sh.wid / 2, boxy = !!(sh.suv || sh.van);
    const d = (blue.smooth === undefined ? 0.06 : blue.smooth) / L * (lod.step ? 1 : 0);
    const at = pts => { const fn = F.Blueprints.line(pts); return f => fn(f * L); };
    const top = at(blue.side.top), belt = at(blue.side.belt), plan = at(blue.plan), roof = at(blue.roof), sill = blue.side.sill ? at(blue.side.sill) : null;
    const sec = Object.assign({ tuck: boxy ? 0.03 : 0.1, flank: boxy ? 0.01 : 0.03, shoulder: boxy ? 0.9 : 0.75, crown: (sh.round ? 1.25 : 1) * (boxy ? 0.6 : 1), dome: boxy ? 0.45 : 0.6, pane: null }, blue.sec);
    const cabAt = f => F.smooth(sh.ws - 0.01, sh.ws + 0.02, f) * (1 - F.smooth(sh.rb - 0.02, sh.rb + 0.01, f));
    const knob = v => (Array.isArray(v) ? at(v) : () => v), crownK = knob(sec.crown);
    const crownAt = f => F.lerp(0.025, 0.04, cabAt(f)) * crownK(f);
    const topAt = rounded(f => top(f) - crownAt(f), d), beltAt = rounded(belt, d), wideAt = rounded(f => plan(f) / W, d), edgeAt = rounded(roof, d);
    const tol = lod.deco === 2 ? 0.006 : lod.deco === 1 ? 0.08 : 0.15;
    const keys = new Set([0, 1, sh.ws, sh.wt, sh.rt, sh.rb]);
    if (lod.deco === 2 && blue.glass && blue.glass.rake) keys.add(F.clamp(blue.glass.end / L, 0, 1));
    const lines = lod.deco === 2 ? [blue.side.top, blue.side.belt, blue.plan, blue.roof].concat(blue.side.sill ? [blue.side.sill] : []) : [blue.side.top];
    for (const pts of lines) for (const p of F.Blueprints.simplify(pts, tol)) keys.add(F.clamp(p[0] / L, 0, 1));
    const S = [...keys].sort((a, c) => a - c).map(f => ({ f, top: topAt(f), w: wideAt(f), cabin: f > sh.ws && f < sh.rb, belt: beltAt(f) }));
    return { S, topAt, beltAt, wideAt, edgeAt, sec, sillAt: sill && rounded(sill, d), waistAt: sec.waist ? at(sec.waist) : null, crownK, domeK: knob(sec.dome), shoulderK: knob(sec.shoulder) };
  }

  function wallTop(topAt, f0, dir, stop, L) {
    let f = f0, y = topAt(f0);
    while (dir > 0 ? f < stop : f > stop) {
      const g = f + dir * 0.0025, y2 = topAt(g);
      if (y2 - y < 0.0025 * L) break;
      f = g;
      y = y2;
    }
    return y;
  }

  function newell(p) {
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], c = p[(i + 1) % p.length];
      x += (a[1] - c[1]) * (a[2] + c[2]);
      y += (a[2] - c[2]) * (a[0] + c[0]);
      z += (a[0] - c[0]) * (a[1] + c[1]);
    }
    return [x, y, z];
  }

  const unit = v => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return l > 1e-12 ? [v[0] / l, v[1] / l, v[2] / l] : null;
  };
  const mirrorX = p => [-p[0], p[1], p[2]];

  function emitFace(b, P, N, col, mat, UV) {
    b.need(P.length, P.length === 4 ? 6 : 3);
    const ids = P.map((q, j) => b.v(q[0], q[1], q[2], UV ? UV[j][0] : b.uvw[0], UV ? UV[j][1] : b.uvw[1], N[j][0], N[j][1], N[j][2], col, mat));
    if (P.length === 4) b.quadIdx(ids[0], ids[1], ids[2], ids[3]); else b.tri(ids[0], ids[1], ids[2]);
  }

  function orientedFace(b, P, N, col, mat, UV) {
    const g = newell(P);
    if (Math.hypot(g[0], g[1], g[2]) < 1e-9) return;
    const s = N.reduce((a, n) => [a[0] + n[0], a[1] + n[1], a[2] + n[2]], [0, 0, 0]);
    if (g[0] * s[0] + g[1] * s[1] + g[2] * s[2] < 0) emitFace(b, P.slice().reverse(), N.slice().reverse(), col, mat, UV && UV.slice().reverse());
    else emitFace(b, P, N, col, mat, UV);
  }

  function flatFace(b, P, want, col, mat) {
    const n = unit(newell(P));
    if (!n) return;
    const flip = n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0;
    const m = flip ? [-n[0], -n[1], -n[2]] : n;
    emitFace(b, flip ? P.slice().reverse() : P, P.map(() => m), col, mat);
  }

  function roundel(b, c, u, v, r, n = 12) {
    const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const at = (a, k) => [0, 1, 2].map(i => c[i] + (u[i] * Math.cos(a) + v[i] * Math.sin(a)) * r * k);
    const mid = [0, 1, 2].map(i => c[i] + w[i] * r * 0.04);
    for (let j = 0; j < n; j++) {
      const a0 = j / n * Math.PI * 2, a1 = (j + 1) / n * Math.PI * 2;
      flatFace(b, [at(a0, 1), at(a1, 1), at(a1, 0.7), at(a0, 0.7)], w, ROUNDEL_RING, MAT.TRIM);
      flatFace(b, [mid, at(a0, 0.7), at(a1, 0.7)], w, ROUNDEL[Math.floor(j * 4 / n) % 2], 0);
    }
  }

  const RIMS = {
    steel: { dish: 0.025, cover: 0.9 },
    retro: { dish: 0.02, cover: 0.96 },
    mesh: { dish: 0.03, cover: 0.62 },
    five: { dish: 0.04, cover: 0.45 },
    multi: { dish: 0.035, cover: 0.55 },
    pepper: { dish: 0.03, cover: 0.85 },
    dish: { dish: 0.03, cover: 0.78 },
    cover: { dish: 0.022, cover: 0.92 },
    cap: { dish: 0.026, cover: 0.9 },
    hubcap: { dish: 0.024, cover: 0.92 },
    speedline: { dish: 0.03, cover: 0.8 },
    aerodisc: { dish: 0.022, cover: 0.94 },
    cross: { dish: 0.03, cover: 0.66 },
    hollow: { dish: 0.04, cover: 0.45 }
  };
  const SKIN = F.Tex.SKIN, CELL = 32 / SKIN.size;
  const WHITE_UV = [(SKIN.white[0] + SKIN.white[2] / 2) / SKIN.size, (SKIN.white[1] + SKIN.white[3] / 2) / SKIN.size];
  const treadAt = i => [(SKIN.tread[0] + i * 32) / SKIN.size, SKIN.tread[1] / SKIN.size];
  const TREAD_UV = { road: treadAt(0), sport: treadAt(1), rally: treadAt(2), terrain: treadAt(2), offroad: treadAt(3) };

  function treadOf(car, tires) {
    const t = tires | 0;
    if (!t) return car.sh.suv || car.sh.van ? 'terrain' : 'road';
    return ['road', 'sport', 'slick', 'rally', 'offroad'][t] || 'road';
  }

  function wheelDims(car, tread, rear) {
    const sh = car.sh, style = RIMS[sh.rims] ? sh.rims : 'five';
    const blue = F.Blueprints.of(car), R = sh.wr, tw = blue && blue.tyre, w = tw ? (Array.isArray(tw) ? tw[rear ? 1 : 0] : tw) : 0.2 + (sh.wid - 1.55) * 0.15;
    const base = sh.suv || sh.van ? 0.6 : car.year < 1975 ? 0.56 : car.country === 'su' || car.country === 'lv' ? 0.6 : car.cla ? 0.7 : 0.64;
    const rr = R * F.clamp(base + (tread === 'sport' || tread === 'slick' ? 0.03 : tread === 'rally' || tread === 'offroad' ? -0.03 : 0), 0.5, 0.76);
    return { style, R, w, rr, rb: rr * 0.93, xf: w / 2 - RIMS[style].dish };
  }

  const EYE_GAP = 0.24, EYE_SHIFT = 0.15;

  function cabinAt(car) {
    const sh = car.sh, L = sh.len, Z = f => -L / 2 + f * L;
    let ez = Math.min(Z(sh.wt) + 0.62, Z(sh.rt) - 0.2) + (sh.van ? 0.25 : 0), bz = null, cz = null;
    const blue = F.Blueprints.of(car), gl = blue && blue.glass, posts = gl ? gl.pillars.filter(p => !p[2]) : [];
    if (posts.length && !sh.van && sh.seats !== 2) {
      bz = -L / 2 + posts[0][0];
      cz = posts[1] ? -L / 2 + posts[1][0] : null;
      ez = Math.min(ez, bz - EYE_GAP);
    } else if (!sh.van && sh.seats !== 2) {
      const b0 = Z(sh.ws) + ((sh.doors || 4) <= 3 ? 1.15 : 0.95);
      ez -= F.clamp(ez - (b0 - EYE_GAP), 0, EYE_SHIFT);
      bz = Math.max(b0, ez + EYE_GAP);
      cz = Math.max(b0 + 0.9, bz + 0.45);
    }
    const at = blue && blue.cabin && blue.cabin.eye;
    return { eye: [sh.seat === 'center' ? 0 : null, at ? at[1] : Math.max(sh.hood + 0.2, sh.hgt - 0.33), at ? -L / 2 + at[0] : ez], bz, cz };
  }

  function greenhouse(car) {
    const sh = car.sh, L = sh.len, doors = sh.doors || 4, boxy = !!(sh.suv || sh.van), cab = cabinAt(car);
    const blue = F.Blueprints.of(car), gl = blue && blue.glass;
    const end = gl && gl.end !== undefined ? gl.end / L : sh.glassTo || (boxy ? sh.rb - 0.025 : sh.seats !== 2 && doors % 2 ? sh.rt + (sh.rb - sh.rt) * 0.45 : sh.rt + 0.02);
    if (gl) return { end, start: gl.start ? gl.start / L : 0, rearFrame: !!gl.rearFrame, flush: !!gl.flush, pillars: gl.pillars.map(p => ({ f: p[0] / L, hw: p[1] / 2 / L, dark: p[2] === 'dark', chrome: p[2] === 'chrome' })), tent: !!gl.tent, black: car.year >= 1978 && car.country !== 'su' && car.country !== 'lv' };
    const cuts = [];
    if (sh.van) {
      const n = Math.max(2, Math.round((end - sh.ws) * L / 0.95));
      for (let k = 1; k < n; k++) cuts.push(sh.ws + (end - sh.ws) * k / n);
    } else if (sh.seats !== 2) {
      const room = end - 0.3 / L;
      let f = (cab.bz + L / 2) / L;
      if (f < room) cuts.push(f);
      f = (cab.cz + L / 2) / L;
      if ((doors === 5 || (doors === 4 && boxy)) && f < room) cuts.push(f);
    }
    return { end, pillars: cuts.map(f => ({ f, hw: 0.045 / L })), black: car.year >= 1978 && car.country !== 'su' && car.country !== 'lv' };
  }

  function prismX(b, sec, x, col, mat, ox = 0) {
    const cz = sec.reduce((a, p) => a + p[0], 0) / sec.length, cy = sec.reduce((a, p) => a + p[1], 0) / sec.length;
    for (let i = 0; i < sec.length; i++) {
      const p = sec[i], q = sec[(i + 1) % sec.length];
      flatFace(b, [[ox - x, p[1], p[0]], [ox + x, p[1], p[0]], [ox + x, q[1], q[0]], [ox - x, q[1], q[0]]], [0, (p[1] + q[1]) / 2 - cy, (p[0] + q[0]) / 2 - cz], col, mat);
    }
    for (const s of [-1, 1]) for (let i = 0; i < sec.length; i++) {
      const p = sec[i], q = sec[(i + 1) % sec.length];
      flatFace(b, [[ox + s * x, cy, cz], [ox + s * x, p[1], p[0]], [ox + s * x, q[1], q[0]]], [s, 0, 0], col, mat);
    }
  }

  function tiltedRing(b, c, alpha, R, r, col, mat) {
    const U = [0, Math.cos(alpha), -Math.sin(alpha)], V = [0, Math.sin(alpha), Math.cos(alpha)];
    const at = (u, v, rad, off) => {
      const a = rad + r * Math.cos(v), x = a * Math.cos(u), y = a * Math.sin(u), z = r * Math.sin(v);
      return [off[0] + x, off[1] + U[1] * y + V[1] * z, off[2] + U[2] * y + V[2] * z];
    };
    const nu = 10, nv = 3, zero = [0, 0, 0];
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const u0 = i / nu * Math.PI * 2, u1 = (i + 1) / nu * Math.PI * 2, v0 = j / nv * Math.PI * 2, v1 = (j + 1) / nv * Math.PI * 2;
        const n = (u, v) => { const q = at(u, v, 0, zero), l = Math.hypot(q[0], q[1], q[2]) || 1; return [q[0] / l, q[1] / l, q[2] / l]; };
        orientedFace(b, [at(u0, v0, R, c), at(u1, v0, R, c), at(u1, v1, R, c), at(u0, v1, R, c)], [n(u0, v0), n(u1, v0), n(u1, v1), n(u0, v1)], col, mat);
      }
    }
  }

  function interior(car, k, b) {
    const sh = car.sh, L = sh.len, Z = k.Z, st = cockOf(car), cover = coverOf(car);
    const fOf = z => F.clamp((z + L / 2) / L, 0, 1);
    const paint = st.dash === 'paint';
    const dashCol = paint ? PAINT : C(st.dash), dashMat = paint ? MAT.PAINT : MAT.INTERIOR, IN = MAT.INTERIOR;
    const trim = shade(C(st.trim), 1.3), seatCol = C(st.seat), floorCol = C(st.floor), liner = C(st.roof);
    const [ex, ey, ez] = k.eye;
    const boxy = !!(sh.suv || sh.van), two = sh.seats === 2;
    const zA = Z(sh.ws), zB = Z(sh.rb);
    const yF = k.floor || k.yb + 0.08, Wi = k.cabinW || k.W * 0.9, ledge = k.cabinW ? k.cabinW + 0.01 : k.W * 0.975;
    const roofAt = z => k.topAt(fOf(z)) - 0.04;
    const zFront = zA + 0.06, zEnd = boxy ? Z(1) - 0.1 : Math.min(zB + 0.1, Z(1) - 0.1);
    flatFace(b, [[-Wi, yF, zFront], [Wi, yF, zFront], [Wi, yF, zEnd], [-Wi, yF, zEnd]], [0, 1, 0], floorCol, IN);
    const n = 4;
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const za = zFront + (zEnd - zFront) * i / n, zb = zFront + (zEnd - zFront) * (i + 1) / n;
        const beltIn = f => (k.cabinW ? Math.min(k.beltAt(f), k.topAt(f) - 0.03) : k.beltAt(f));
        const ya = beltIn(fOf(za)) - 0.015, yb = beltIn(fOf(zb)) - 0.015;
        flatFace(b, [[s * Wi, yF, za], [s * Wi, yF, zb], [s * Wi, yb, zb], [s * Wi, ya, za]], [-s, 0, 0], trim, IN);
        flatFace(b, [[s * Wi, ya, za], [s * Wi, yb, zb], [s * ledge, yb + 0.006, zb], [s * ledge, ya + 0.006, za]], [0, 1, 0], shade(trim, 0.8), IN);
      }
    }
    const R = st.wheel.r, alpha = boxy ? 0.62 : R > 0.2 ? 0.36 : 0.42;
    const wc = [ex, ey - (boxy ? 0.32 : 0.28), ez - 0.42];
    const zDr = wc[2] - 0.17, yDt = Math.max(sh.hood + 0.04, ey - 0.45);
    let zT = zA;
    while (zT < zDr - 0.05 && k.topAt(fOf(zT)) < yDt + 0.02) zT += 0.01;
    prismX(b, [[zA + 0.01, sh.hood - 0.03], [zT, yDt], [zDr, yDt], [zDr, yF + 0.22], [zA + 0.01, yF + 0.22]], Wi, dashCol, dashMat);
    tiltedRing(b, wc, alpha, R, st.wheel.tube + 0.004, C(st.wheel.rim), IN);
    const seat = (x, zc, w) => {
      const top = Math.min(ey + 0.05, roofAt(zc + 0.3) - 0.18), h = (top - yF - 0.26) / 2, t = 0.26;
      b.box(x, yF + 0.2, zc, w, 0.06, 0.25, seatCol, IN);
      slab(b, [x, yF + 0.26 + h * Math.cos(t), zc + 0.27 + h * Math.sin(t)], [w, 0, 0], [0, h * Math.cos(t), h * Math.sin(t)], [0, -0.06 * Math.sin(t), 0.06 * Math.cos(t)], seatCol, IN);
      b.box(x, top + 0.08, zc + 0.3 + 2 * h * Math.sin(t), w * 0.55, 0.07, 0.05, shade(seatCol, 0.9), IN);
    };
    if (sh.seat === 'center') {
      seat(0, ez + 0.05, 0.22);
      for (const s of [-1, 1]) seat(s * k.W * 0.52, ez + 0.3, 0.18);
    } else for (const x of [ex, -ex]) seat(x, ez + 0.05, 0.24);
    if (cover) b.box(0, yF + cover.h / 2, zDr + cover.len / 2, cover.w / 2, cover.h / 2, cover.len / 2, C(cover.col), IN);
    const bcb = F.Blueprints.of(car) && F.Blueprints.of(car).cabin;
    const zr = bcb && bcb.rear ? Z(bcb.rear / L) : ez + 0.9, bench = !two && zr + 0.4 < zB;
    if (bcb && bcb.jump) for (const x of [ex, -ex]) {
      const zj = Z(bcb.jump / L);
      b.box(x, yF + 0.2, zj, 0.2, 0.05, 0.17, seatCol, IN);
      slab(b, [x, yF + 0.45, zj + 0.19], [0.2, 0, 0], [0, 0.2, 0.03], [0, 0, 0.04], seatCol, IN);
    }
    if (bench) {
      b.box(0, yF + 0.2, zr, Wi - 0.12, 0.06, 0.24, seatCol, IN);
      const yTop = Math.min(k.beltAt(fOf(zr + 0.3)) + 0.08, roofAt(zr + 0.3) - 0.2);
      slab(b, [0, (yF + 0.26 + yTop) / 2, zr + 0.3], [Wi - 0.12, 0, 0], [0, (yTop - yF - 0.26) / 2, 0.04], [0, 0, 0.06], seatCol, IN);
    }
    const glassTop = f => {
      const t = k.topAt(f), belt = Math.min(k.beltAt(f), t - 0.02), x4 = k.cabinW ? k.cabinW + 0.03 : k.W * 0.985, rw = Math.min(k.edgeAt(f), k.W * 0.97);
      return [x4 + (rw - x4) * 0.9 - 0.02, belt + (Math.max(t, belt + 0.025) - belt) * 0.88 - 0.01];
    };
    const nh = 3;
    for (let i = 0; i < nh; i++) {
      const f0 = sh.wt + (sh.rt - sh.wt) * i / nh, f1 = sh.wt + (sh.rt - sh.wt) * (i + 1) / nh;
      const y0 = k.topAt(f0) - 0.04, y1 = k.topAt(f1) - 0.04, w0 = k.edgeAt(f0) * 0.94, w1 = k.edgeAt(f1) * 0.94;
      flatFace(b, [[-w0, y0, Z(f0)], [w0, y0, Z(f0)], [w1, y1, Z(f1)], [-w1, y1, Z(f1)]], [0, -1, 0], liner, IN);
      const g0 = glassTop(f0), g1 = glassTop(f1);
      for (const s of [-1, 1]) flatFace(b, [[s * w0, y0, Z(f0)], [s * w1, y1, Z(f1)], [s * g1[0], g1[1], Z(f1)], [s * g0[0], g0[1], Z(f0)]], [-s, -0.4, 0], shade(liner, 0.85), IN);
    }
    if (boxy) {
      const yW = k.beltAt(0.97) - 0.02;
      flatFace(b, [[-Wi, yF, zEnd], [Wi, yF, zEnd], [Wi, yW, zEnd], [-Wi, yW, zEnd]], [0, 0, -1], trim, IN);
      return;
    }
    const zs0 = bench ? zr + 0.34 : Math.min(ez + 0.55, zB - 0.02), ys = k.beltAt(sh.rb) - 0.01;
    flatFace(b, [[-Wi, ys, zs0], [Wi, ys, zs0], [Wi, ys, zEnd], [-Wi, ys, zEnd]], [0, 1, 0], two ? DARK : shade(trim, 0.85), IN);
    if (!bench) {
      const yTop = roofAt(zs0) - 0.02;
      flatFace(b, [[-Wi, yF, zs0], [Wi, yF, zs0], [Wi, yTop, zs0], [-Wi, yTop, zs0]], [0, 0, -1], trim, IN);
    }
  }

  function appendBatch(dst, src) {
    const parts = src.parts.map(p => [p.data, p.idx, p.nv, p.ni]).concat(src.n ? [[src.u8.subarray(0, src.n * F.STRIDE), src.idx.subarray(0, src.ni), src.n, src.ni]] : []);
    for (const [data, idx, nv, ni] of parts) {
      dst.need(nv, ni);
      const base = dst.n;
      dst.u8.set(data.subarray(0, nv * F.STRIDE), base * F.STRIDE);
      for (let i = 0; i < ni; i++) dst.idx[dst.ni + i] = idx[i] + base;
      dst.n += nv;
      dst.ni += ni;
    }
  }

  function bakeAO(b, g) {
    const chunks = b.parts.map(p => p.data).concat([b.u8.subarray(0, b.n * F.STRIDE)]);
    const skip = new Set([MAT.GLASS, MAT.HEAD, MAT.TAIL, MAT.LENS, MAT.REVERSE]);
    for (const u8 of chunks) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      for (let o = 0; o + F.STRIDE <= u8.byteLength; o += F.STRIDE) {
        const mat = dv.getInt8(o + 23);
        if (skip.has(mat)) continue;
        const x = dv.getFloat32(o, true), y = dv.getFloat32(o + 4, true), z = dv.getFloat32(o + 8, true), ny = dv.getInt8(o + 21) / 127;
        let ao = (0.72 + 0.28 * F.clamp(ny * 0.6 + 0.75, 0, 1)) * F.clamp(0.82 + (y - g.yb) * 1.5, 0.82, 1);
        if (Math.abs(x) > g.W * 0.6) for (const a of g.arches) { const d = Math.hypot(z - a.z, y - g.wr); if (d < g.Ra + 0.16) ao *= 0.74 + 0.26 * F.clamp((d - g.Ra + 0.02) / 0.18, 0, 1); }
        for (let c = 24; c < 27; c++) u8[o + c] = Math.min(255, Math.round(u8[o + c] * ao));
      }
    }
  }

  function buildCar(car, o = {}) {
    const sh = car.sh, lod = LODS[o.lod | 0] || LODS[0];
    const b = new Batch(lod.deco === 2 ? 4096 : 1024);
    b.uvw = [0.2, 0.2];
    const L = sh.len, W = sh.wid / 2;
    const yb = sh.clr + 0.07;
    const blue = F.Blueprints.of(car), prof = blue ? bpProfiles(car, blue, lod) : null, sec = prof && prof.sec;
    const S = prof ? prof.S : stations(sh);
    const Z = f => -L / 2 + f * L;
    const roofCol = sh.roof ? C(sh.roof) : null;
    const round = sh.round ? 0.94 : 1;
    const boxy = !!(sh.suv || sh.van);
    const wr = sh.wr;
    const wheelW = blue && blue.tyre ? (Array.isArray(blue.tyre) ? Math.max(...blue.tyre) : blue.tyre) : 0.2 + (sh.wid - 1.55) * 0.15;
    const trackOf = fl => W * (1 + fl) * 0.995 - wheelW / 2;
    const halfTrack = (i, fl) => (blue && blue.track ? blue.track[i] / 2 : trackOf(fl));
    const zF = blue ? Z(0) + blue.fo : Z(0) + (L - sh.wb) * 0.47, zR = zF + sh.wb;
    const Ra = wr * 1.12 + 0.025;
    const flare = Array.isArray(sh.flare) ? sh.flare : [sh.flare || 0, sh.flare || 0];
    const arches = [{ z: zF, flare: flare[0] }, { z: zR, flare: flare[1] }];
    const soft = lod.step ? 1 : 0;
    const topAt = prof ? prof.topAt : rounded(polyline(S.map(s => [s.f, s.top])), (sh.round ? 0.045 : 0.03) * soft);
    const beltAt = prof ? prof.beltAt : rounded(polyline(S.map(s => [s.f, s.belt])), 0.03 * soft);
    const wideAt = prof ? prof.wideAt : rounded(polyline(S.map(s => [s.f, s.cabin ? 1 : s.w])), 0.025 * soft);
    const edgeAt = prof ? prof.edgeAt : rounded(polyline(S.map(s => [s.f, s.cabin ? W * sh.tum : W * s.w * 0.9 * round])), 0.03 * soft);
    const cabAt = f => F.smooth(sh.ws - 0.01, sh.ws + 0.02, f) * (1 - F.smooth(sh.rb - 0.02, sh.rb + 0.01, f));
    const crownAt = sec ? f => F.lerp(0.025, 0.04, cabAt(f)) * prof.crownK(f) : f => F.lerp(0.025, 0.04, cabAt(f)) * (sh.round ? 1.25 : 1) * (boxy ? 0.6 : 1);
    const skinAt = f => topAt(f) + crownAt(f) * 0.93;
    const flareAt = z => arches.reduce((a, r) => a + r.flare * (0.5 + 0.5 * Math.cos(Math.PI * F.clamp(Math.abs(z - r.z) / (Ra * 1.7), 0, 1))), 0);
    const TX = F.Tex.SKIN, TS = TX.size;
    const yLo = yb - 0.03, yHi = sh.hgt + 0.03, Wt = W * 1.12, yHiE = Math.max(S[0].top, S[S.length - 1].top) + 0.08;
    const yHiF = blue ? wallTop(topAt, 0, 1, sh.ws, L) + 0.04 : yHiE, yHiB = blue ? wallTop(topAt, 1, -1, sh.rb, L) + 0.04 : yHiE;
    const inner = (r, m) => [r[0] + m, r[1] + m, r[2] - 2 * m, r[3] - 2 * m];
    const RG = { L: inner(TX.left, 3), R: inner(TX.right, 3), T: inner(TX.top, 3), F: inner(TX.front, 2), B: inner(TX.rear, 2) };
    const c01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const fOfZ = z => (z + L / 2) / L;
    const lowAt = f => (prof && prof.sillAt ? Math.max(yb, prof.sillAt(f)) : yb);
    const skinPx = (where, p, q) => {
      const r = RG[where[0]];
      if (where === 'L' || where === 'R') return [r[0] + (where === 'L' ? c01(p) : 1 - c01(p)) * r[2], r[1] + c01((yHi - q) / (yHi - yLo)) * r[3]];
      if (where[0] === 'T') return [r[0] + c01(p) * r[2], r[1] + c01((Wt - q) / (2 * Wt)) * r[3]];
      const yh = where === 'F' ? yHiF : yHiB;
      return [r[0] + c01((where === 'F' ? Wt - p : Wt + p) / (2 * Wt)) * r[2], r[1] + c01((yh - q) / (yh - yLo)) * r[3]];
    };
    const skinFrame = (where, p, q) => {
      const o = skinPx(where, p, q), r = RG[where[0]];
      if (where === 'L' || where === 'R') return [r[2] / (L * 100), 0, 0, r[3] / ((yHi - yLo) * 100), o[0], o[1]];
      const top = where[0] === 'T', yh = where === 'F' ? yHiF : yHiB;
      const ku = r[2] / (top ? L * 100 : 2 * Wt * 100), kv = r[3] / (top ? 2 * Wt * 100 : (yh - yLo) * 100);
      return where === 'T' ? [0, kv, -ku, 0, o[0], o[1]] : [ku, 0, 0, kv, o[0], o[1]];
    };
    const skinUV = (where, p, q) => { const o = skinPx(where, p, q); return [o[0] / TS, o[1] / TS]; };
    const loftUV = (p, top) => (top ? skinUV('T', fOfZ(p[2]), p[0]) : skinUV(p[0] < 0 ? 'L' : 'R', fOfZ(p[2]), p[1]));
    const cellUV = r => { const u0 = (r[0] + 0.5) / TS, v0 = (r[1] + 0.5) / TS, u1 = (r[0] + r[2] - 0.5) / TS, v1 = (r[1] + r[3] - 0.5) / TS; return [u1, v1, u1, v0, u0, v0, u0, v1]; };
    b.uvw = [(TX.white[0] + TX.white[2] / 2) / TS, (TX.white[1] + TX.white[3] / 2) / TS];
    const recEnd = Math.min(0.698, (zR - Ra - 0.06 + L / 2) / L);
    const intake = !!sh.intakes && lod.deco > 0 && recEnd > 0.63;
    const recessed = f => intake && f > 0.582 && f < recEnd;

    const faceN = (P, N, col, mat) => orientedFace(b, P, N, col, mat);
    const face = (P, want, col, mat) => flatFace(b, P, want, col, mat);
    const both = (P, want, col, mat) => {
      face(P, want, col, mat);
      face(P.map(mirrorX), mirrorX(want), col, mat);
    };
    const prism = (sec, x, col, mat, ox) => prismX(b, sec, x, col, mat, ox);
    const PT = F.DMG.PART, tags = [], gtags = [];
    const mark = (part, v0, out = b) => { if (out.n > v0) (out === b ? tags : gtags).push([part, v0, out.n]); };
    const sided = (v0, ni0, left, right, mats) => {
      const f = b.f, I = b.idx, own = new Map();
      for (let k = ni0; k + 2 < b.ni; k += 3) {
        let lo = Infinity, hi = -Infinity, ok = true;
        for (let j = 0; j < 3; j++) {
          const vi = I[k + j];
          if (vi < v0) { ok = false; break; }
          const x = f[vi * 7];
          lo = Math.min(lo, x); hi = Math.max(hi, x);
          if (mats && !mats.has(b.i8[vi * 28 + 23])) ok = false;
        }
        if (!ok || (lo < -0.02 && hi > 0.02)) continue;
        const part = lo + hi < 0 ? left : right;
        for (let j = 0; j < 3; j++) { const vi = I[k + j]; own.set(vi, own.has(vi) && own.get(vi) !== part ? 0 : part); }
      }
      for (const [vi, part] of own) if (part) tags.push([part, vi, vi + 1]);
    };
    const gh = greenhouse(car);
    const cuts = lod.step ? [gh.end].concat(gh.start ? [gh.start] : [], ...gh.pillars.filter(p => lod.deco === 2 || !(p.dark || p.chrome)).map(p => [p.f - p.hw, p.f + p.hw])) : [];

    const list = [];
    const inSpan = f => lod.arch > 0 && arches.some(a => Math.abs(Z(f) - a.z) < Ra + 0.02);
    const add = (f, edge, key) => list.push({ f, edge, key });
    for (const s of S) add(s.f, 0, s.f);
    for (const f of cuts) add(f, 0, f);
    for (let i = 1; i < lod.step; i++) {
      const f = i / lod.step;
      if (!inSpan(f) && !cuts.some(c => Math.abs(c - f) < 0.012) && !(blue && (lod.deco < 2 || S.some(s => Math.abs(s.f - f) < 0.9 / lod.step)))) add(f, 0, f);
    }
    for (const e of lod.ends) { add(e, 0, e); add(1 - e, 0, 1 - e); }
    if (intake) for (const f of [0.58, 0.585, recEnd - 0.003, recEnd + 0.002]) if (!inSpan(f)) add(f, 0, f);
    if (lod.arch) {
      for (const a of arches) {
        const f0 = (a.z - Ra + L / 2) / L, f1 = (a.z + Ra + L / 2) / L;
        add(f0, -1, f0 - 1e-5); add(f0, 1, f0 + 1e-5);
        for (let j = 1; j < lod.arch; j++) { const f = (a.z - Ra * Math.cos(Math.PI * j / lod.arch) + L / 2) / L; add(f, 0, f); }
        add(f1, 1, f1 - 1e-5); add(f1, -1, f1 + 1e-5);
      }
    }
    list.sort((p, q) => p.key - q.key);
    const st = [];
    for (const s of list) {
      const prev = st[st.length - 1];
      if (prev && !s.edge && !prev.edge && Math.abs(s.f - prev.f) < 1e-4) continue;
      st.push(s);
    }

    const bottomOf = s => {
      if (!lod.arch || s.edge < 0) return yb;
      const z = Z(s.f);
      let y = yb;
      for (const a of arches) {
        const dz = Math.abs(z - a.z);
        if (dz < Ra + 1e-6) y = Math.max(y, wr + Math.sqrt(Math.max(0, Ra * Ra - dz * dz)));
      }
      return y;
    };
    const sectionOf = s => {
      const f = s.f, z = Z(f), t = topAt(f), c = cabAt(f), cr = crownAt(f);
      const y0 = prof && prof.sillAt ? Math.max(bottomOf(s), prof.sillAt(f)) : bottomOf(s);
      const belt = Math.max(Math.min(beltAt(f), t - 0.02), y0 + 0.07);
      const edge = Math.max(t, belt + 0.025);
      const w = W * wideAt(f) * (1 + flareAt(z));
      const rw = Math.min(edgeAt(f), w * 0.97);
      const hu = edge - belt;
      const rec = recessed(f) ? 0.9 : 1;
      const lift = (k, t0) => Math.max(yb + (belt - yb) * t0, y0 + k * 0.004);
      const x4 = prof && prof.waistAt ? w * prof.waistAt(f) : w * 0.985;
      const P = [
        [w * (sec ? 1 - sec.tuck : boxy ? 0.97 : 0.9 * round), y0],
        [w * (sec ? 1 - sec.flank : boxy ? 0.99 : 0.97), lift(1, 0.07)],
        [w * 0.995 * rec, lift(2, 0.3)],
        [w * rec, lift(3, sec && sec.side ? sec.side : 0.62)],
        [x4, belt],
        [F.lerp(x4, rw, F.lerp(0.35, 0.06, c)), belt + hu * F.lerp(0.5, 0.08, c)],
        [F.lerp(x4, rw, F.lerp(0.8, 0.9, c)), belt + hu * (sec && sec.pane ? F.lerp(0.9, sec.pane, c) : F.lerp(0.9, 0.88, c))],
        [rw, edge - cr * 0.05],
        [rw * (sec ? prof.shoulderK(f) : boxy ? 0.9 : 0.75), t + cr * (sec ? prof.domeK(f) : boxy ? 0.45 : 0.6)],
        [Math.min(0.24, rw * 0.4), t + cr * 0.93],
        [0, t + cr]
      ];
      return { f, z, P: lod.pts.map(i => P[i]), rec: rec < 1, arch: y0 > yb + 1e-6 };
    };
    const secs = st.map(sectionOf);
    const surfY = (f, x) => {
      const P = sectionOf({ f, edge: 0 }).P.filter((_, j) => lod.pts[j] >= 7);
      if (x >= P[0][0]) return P[0][1];
      for (let j = 0; j + 1 < P.length; j++) {
        const a = P[j], c = P[j + 1];
        if (x >= c[0]) return a[1] + (c[1] - a[1]) * (a[0] - x) / Math.max(1e-6, a[0] - c[0]);
      }
      return P[P.length - 1][1];
    };
    const sideX = f => W * wideAt(f) * (1 + flareAt(Z(f))) * 0.99;
    const NS = lod.pts.length - 1;
    const kindOf = s => { const lo = lod.pts[s]; return lo >= 7 ? 'top' : lo >= 6 ? 'edge' : lo >= 4 ? 'window' : 'side'; };
    const groupOf = s => (lod.pts[s + 1] <= 4 ? 0 : 1);
    const pillarAt = f => lod.step > 0 && gh.pillars.some(p => (lod.deco === 2 || !(p.dark || p.chrome)) && Math.abs(f - p.f) < p.hw);
    const darkAt = f => gh.pillars.some(p => p.dark && Math.abs(f - p.f) < p.hw);
    const chromeAt = f => gh.pillars.some(p => p.chrome && Math.abs(f - p.f) < p.hw);
    const matOf = (s, fm, rec) => {
      const kind = kindOf(s), lo = lod.pts[s], up = lod.pts[s + 1];
      let col = PAINT, mat = MAT.PAINT;
      if (kind === 'window' && fm > sh.ws && fm < gh.end && !(gh.start && fm < gh.start)) {
        if (!pillarAt(fm)) { col = GLASS; mat = MAT.GLASS; }
        else if (gh.black || darkAt(fm)) { col = BLACK; mat = MAT.TRIM; }
        else if (chromeAt(fm)) { col = CHROME; mat = MAT.CHROME; }
      }
      if (kind === 'window' && (sh.glassTo || gh.tent) && roofCol && fm >= gh.end && fm < sh.rb) { col = roofCol; mat = MAT.NONE; }
      if (kind === 'top' && ((fm > sh.ws && fm < sh.wt) || (fm > sh.rt && fm < sh.rb && !(gh.rearFrame && lo === 7 && lod.deco === 2)))) { col = GLASS; mat = MAT.GLASS; }
      if ((kind === 'top' || kind === 'edge') && roofCol && fm > sh.wt && fm < sh.rt) { col = roofCol; mat = MAT.NONE; }
      if (rec && lo >= 2 && up <= 3) { col = DARK; mat = MAT.NONE; }
      if (mat === MAT.PAINT && sh.skirts && up <= 1) col = shade(PAINT, 0.9);
      return { col, mat };
    };
    const fn = [];
    for (let i = 0; i + 1 < secs.length; i++) {
      const A = secs[i].P, B = secs[i + 1].P, za = secs[i].z, zb = secs[i + 1].z;
      const row = [];
      for (let s = 0; s < NS; s++) row.push(newell([[A[s][0], A[s][1], za], [A[s + 1][0], A[s + 1][1], za], [B[s + 1][0], B[s + 1][1], zb], [B[s][0], B[s][1], zb]]));
      fn.push(row);
    }
    const thin = i => secs[i + 1].z - secs[i].z < 1e-4;
    const vnorm = (i, q, g) => {
      const acc = [0, 0, 0];
      for (const seg of [i - 1, i]) {
        if (seg < 0 || seg >= fn.length || thin(seg)) continue;
        for (const s of [q - 1, q]) {
          if (s < 0 || s >= NS || groupOf(s) !== g) continue;
          const n = fn[seg][s];
          acc[0] += n[0]; acc[1] += n[1]; acc[2] += n[2];
        }
      }
      return unit(acc);
    };
    const xin = Math.min(halfTrack(0, flare[0]), halfTrack(1, flare[1])) - wheelW / 2 - 0.02;
    const hasHood = sh.ws > 0.12, hasTrunk = !boxy && sh.rb < 0.9, door = blue && blue.rearDoor ? blue.rearDoor.hinge / L : 0;
    const partOf = (s, fm, mat) => {
      const kind = kindOf(s);
      if (door && fm > door && kind === 'top') return [PT.trunk, PT.trunk];
      if (mat === MAT.GLASS) {
        if (kind === 'top') return fm < sh.wt ? [PT.glassF, PT.glassF] : [PT.glassB, PT.glassB];
        return [PT.glassR, PT.glassL];
      }
      if (kind !== 'top') return null;
      if (hasHood && fm > 0.035 && fm < sh.ws - 0.004) return [PT.hood, PT.hood];
      if (hasTrunk && fm > sh.rb + 0.008 && fm < 0.975) return [PT.trunk, PT.trunk];
      return null;
    };
    const gb = lod.step ? new Batch(lod.deco === 2 ? 1024 : 384) : null;
    if (gb) gb.uvw = WHITE_UV;
    const glassAt = secs.slice(1).map((B, i) => {
      const A = secs[i], fm = (A.f + B.f) / 2;
      return lod.pts.slice(1).map((_, s) => !!gb && (!!blue || !thin(i)) && matOf(s, fm, A.rec || B.rec).mat === MAT.GLASS);
    });
    const isGlass = (i, s) => i >= 0 && i < glassAt.length && s >= 0 && glassAt[i][Math.min(s, NS - 1)];
    const chromeTrim = (blue ? blue.trim === 'chrome' : sh.bump === 'chrome') && !boxy;
    const trimCol = chromeTrim ? CHROME : BLACK, trimMat = chromeTrim ? MAT.CHROME : MAT.TRIM;
    const lip = (e0, e1, q0, q1, n, bw) => {
      const k0 = Math.min(0.45, bw / (Math.hypot(q0[0] - e0[0], q0[1] - e0[1], q0[2] - e0[2]) || 1));
      const k1 = Math.min(0.45, bw / (Math.hypot(q1[0] - e1[0], q1[1] - e1[1], q1[2] - e1[2]) || 1));
      const at = (e, q, k) => [0, 1, 2].map(j => e[j] + (q[j] - e[j]) * k + n[j] * 0.003);
      both([at(e0, q0, 0), at(e1, q1, 0), at(e1, q1, k1), at(e0, q0, k0)], n, trimCol, trimMat);
    };
    for (let i = 0; i + 1 < secs.length; i++) {
      const A = secs[i], B = secs[i + 1], za = A.z, zb = B.z;
      const fm = (A.f + B.f) / 2, rec = A.rec || B.rec;
      for (let s = 0; s < NS; s++) {
        const own = unit(fn[i][s]);
        if (!own) continue;
        const { col, mat } = matOf(s, fm, rec);
        const g = groupOf(s);
        const flat = thin(i) || mat === MAT.GLASS || A.rec !== B.rec;
        const N = flat ? [own, own, own, own] : [vnorm(i, s, g), vnorm(i, s + 1, g), vnorm(i + 1, s + 1, g), vnorm(i + 1, s, g)].map(n => n || own);
        const P = [[A.P[s][0], A.P[s][1], za], [A.P[s + 1][0], A.P[s + 1][1], za], [B.P[s + 1][0], B.P[s + 1][1], zb], [B.P[s][0], B.P[s][1], zb]];
        const out = isGlass(i, s) ? gb : b, Pm = P.map(mirrorX).reverse(), top = kindOf(s) === 'top';
        const skinned = out === b && mat !== MAT.GLASS;
        const endUV = blue && skinned ? (own[2] < -0.7 ? 'F' : own[2] > 0.7 ? 'B' : null) : null;
        const uvOf = p => (endUV ? skinUV(endUV, p[0], p[1]) : loftUV(p, top));
        const pr = partOf(s, fm, mat), v0 = out.n;
        emitFace(out, P, N, col, mat, skinned && P.map(uvOf));
        const v1 = out.n;
        emitFace(out, Pm, N.map(mirrorX).reverse(), col, mat, skinned && Pm.map(uvOf));
        if (pr) (out === b ? tags : gtags).push([pr[0], v0, v1], [pr[1], v1, out.n]);
        if (out === gb && lod.deco > 1) {
          const bw = gh.flush ? 0.012 : kindOf(s) === 'top' ? 0.035 : 0.022;
          if (!isGlass(i, s - 1)) lip(P[0], P[3], P[1], P[2], own, bw);
          if (!isGlass(i, s + 1)) lip(P[1], P[2], P[0], P[3], own, bw);
          if (!isGlass(i - 1, s)) lip(P[0], P[1], P[3], P[2], own, bw);
          if (!isGlass(i + 1, s)) lip(P[3], P[2], P[0], P[1], own, bw);
        }
      }
      if (!thin(i) && lod.deco) {
        const ua = A.arch ? xin : A.P[0][0], ub = B.arch ? xin : B.P[0][0];
        const ya = lowAt(A.f), yz = lowAt(B.f);
        b.quad([ua, ya, za], [ub, yz, zb], [-ub, yz, zb], [-ua, ya, za], UNDER, 0);
      }
    }
    const cap = (sec, dir) => {
      const P = sec.P, n = P.length, z = sec.z;
      const cy = (P[0][1] + P[n - 1][1]) / 2, end = dir < 0 ? 'F' : 'B';
      const ring = P.slice();
      for (let k = n - 2; k >= 0; k--) ring.push([-P[k][0], P[k][1]]);
      const uv = (...pts) => [].concat(...pts.map(p => skinUV(end, p[0], p[1])));
      const cross = (a, p, q) => (p[0] - a[0]) * (q[1] - a[1]) - (p[1] - a[1]) * (q[0] - a[0]);
      if (ring.some((p, k) => cross([0, cy], p, ring[(k + 1) % ring.length]) < -1e-9)) {
        const idx = ring.map((_, k) => k);
        const inside = (a, p, q, r) => cross(a, p, r) > 0 && cross(p, q, r) > 0 && cross(q, a, r) > 0;
        while (idx.length > 3) {
          const m = idx.length, k = idx.findIndex((_, i) => {
            const a = ring[idx[(i + m - 1) % m]], p = ring[idx[i]], q = ring[idx[(i + 1) % m]];
            return Math.abs(cross(a, p, q)) < 1e-12 || (cross(a, p, q) > 0 && !idx.some(j => j !== idx[i] && j !== idx[(i + m - 1) % m] && j !== idx[(i + 1) % m] && inside(a, p, q, ring[j])));
          });
          if (k < 0) break;
          const a = ring[idx[(k + m - 1) % m]], p = ring[idx[k]], q = ring[idx[(k + 1) % m]];
          if (Math.abs(cross(a, p, q)) >= 1e-12) {
            if (dir < 0) b.triangle([a[0], a[1], z], [q[0], q[1], z], [p[0], p[1], z], PAINT, MAT.PAINT, uv(a, q, p));
            else b.triangle([a[0], a[1], z], [p[0], p[1], z], [q[0], q[1], z], PAINT, MAT.PAINT, uv(a, p, q));
          }
          idx.splice(k, 1);
        }
        const [a, p, q] = idx.map(j => ring[j]);
        if (idx.length === 3 && dir < 0) b.triangle([a[0], a[1], z], [q[0], q[1], z], [p[0], p[1], z], PAINT, MAT.PAINT, uv(a, q, p));
        else if (idx.length === 3) b.triangle([a[0], a[1], z], [p[0], p[1], z], [q[0], q[1], z], PAINT, MAT.PAINT, uv(a, p, q));
        return;
      }
      for (let k = 0; k < ring.length; k++) {
        const p = ring[k], q = ring[(k + 1) % ring.length], c = [0, cy];
        if (dir < 0) b.triangle([0, cy, z], [q[0], q[1], z], [p[0], p[1], z], PAINT, MAT.PAINT, uv(c, q, p));
        else b.triangle([0, cy, z], [p[0], p[1], z], [q[0], q[1], z], PAINT, MAT.PAINT, uv(c, p, q));
      }
    };
    cap(secs[0], -1);
    const vDoor = b.n;
    cap(secs[secs.length - 1], 1);
    if (door) mark(PT.trunk, vDoor);
    for (const fd of (blue && blue.parts && blue.parts.fenders) || []) {
      const st = lod.deco === 2 ? fd : lod.deco === 1 ? fd.filter((_, i) => i % 4 === 0 || i === fd.length - 1) : [fd[0], fd[fd.length >> 1], fd[fd.length - 1]];
      const keep = lod.deco === 2 ? [0, 1, 2, 3, 4, 5, 6, 7] : lod.deco === 1 ? [0, 3, 6, 7] : [0, 4, 7];
      const rings = st.map(([x, yt, yb, xo, xi]) => {
        const w = xo - xi, D = yt - yb;
        const R = [[xi, yt - 0.015], [xi + w * 0.4, yt], [xi + w * 0.78, yt - Math.min(0.02, D * 0.1)], [xo - 0.02, yt - Math.min(0.07, D * 0.3)], [xo, yt - Math.min(0.15, D * 0.55)], [xo - 0.005, yb + Math.min(0.03, D * 0.12)], [xo - 0.012, yb], [xi, yb]];
        return { z: Z(x / L), P: keep.map(k => R[k]), c: [xi + w * 0.5, (yt + yb) / 2] };
      });
      const n = keep.length;
      for (let i = 0; i + 1 < rings.length; i++) {
        const A = rings[i], B = rings[i + 1], cx = (A.c[0] + B.c[0]) / 2, cy = (A.c[1] + B.c[1]) / 2;
        for (let k = 0; k < n; k++) {
          const a = A.P[k], a1 = A.P[(k + 1) % n], c = B.P[k], c1 = B.P[(k + 1) % n], well = keep[k] === 6;
          if (lod.deco < 2 && keep[k] === 7) continue;
          both([[a[0], a[1], A.z], [a1[0], a1[1], A.z], [c1[0], c1[1], B.z], [c[0], c[1], B.z]], [(a[0] + a1[0] + c[0] + c1[0]) / 4 - cx, (a[1] + a1[1] + c[1] + c1[1]) / 4 - cy, 0], well ? DARK : PAINT, well ? 0 : MAT.PAINT);
        }
      }
      for (const [rg, dir] of lod.deco ? [[rings[0], -1], [rings[rings.length - 1], 1]] : []) for (let k = 0; k < n; k++) {
        const p = rg.P[k], q = rg.P[(k + 1) % n];
        both([[rg.c[0], rg.c[1], rg.z], [p[0], p[1], rg.z], [q[0], q[1], rg.z]], [0, 0, dir], PAINT, MAT.PAINT);
      }
    }
    const bd = blue && blue.parts && blue.parts.boards;
    if (bd && lod.deco) for (const s of [-1, 1]) {
      const z0 = Z(bd.x0 / L), z1 = Z(bd.x1 / L);
      b.box(s * (bd.xi + bd.xo) / 2, bd.y, (z0 + z1) / 2, (bd.xo - bd.xi) / 2, bd.h / 2, (z1 - z0) / 2, BLACK, MAT.TRIM);
      if (lod.deco > 1) b.box(s * (bd.xo + 0.004), bd.y + bd.h * 0.2, (z0 + z1) / 2, 0.006, bd.h * 0.35, (z1 - z0) / 2, CHROME, MAT.CHROME);
    }
    for (const pd of (lod.deco && blue && blue.parts && blue.parts.pods) || []) for (const s of [-1, 1]) b.box(s * pd.s, pd.y, Z(pd.x / L), pd.r, pd.r * 0.8, pd.len / 2, AMBER, MAT.LENS);

    if (lod.arch) {
      for (const a of arches) {
        const mid = secs.reduce((best, s) => (Math.abs(s.z - a.z) < Math.abs(best.z - a.z) ? s : best), secs[0]);
        const xout = Math.max(xin + 0.02, mid.P[0][0] - 0.012);
        const path = [[a.z - Ra, lowAt(fOfZ(a.z - Ra))]];
        for (let j = 0; j <= lod.arch; j++) { const th = Math.PI * j / lod.arch; path.push([a.z - Ra * Math.cos(th), wr + Ra * Math.sin(th)]); }
        path.push([a.z + Ra, lowAt(fOfZ(a.z + Ra))]);
        for (let j = 0; j + 1 < path.length; j++) {
          const p = path[j], q = path[j + 1];
          both([[xout, p[1], p[0]], [xout, q[1], q[0]], [xin, q[1], q[0]], [xin, p[1], p[0]]], [0, wr - (p[1] + q[1]) / 2, a.z - (p[0] + q[0]) / 2], UNDER, 0);
          both([[xin, yb, a.z], [xin, p[1], p[0]], [xin, q[1], q[0]]], [1, 0, 0], UNDER, 0);
        }
      }
    }

    const bp = BUMPERS[sh.bump] || BUMPERS.black;
    const bcol = sh.bump === 'chrome' || sh.bump === 'alu' ? CHROME : sh.bump === 'body' ? PAINT : BLACK;
    const bmat = sh.bump === 'chrome' || sh.bump === 'alu' ? MAT.CHROME : sh.bump === 'body' ? MAT.PAINT : MAT.TRIM;
    const xEnd = W * (wideAt(0.045) + 0.01) + bp.p * 0.4;
    const barPath = (zc, dir, ext, xe = xEnd, rc = 0.14) => {
      const xs = Math.max(0.2, xe - rc);
      const half = [[0, zc], [xs, zc]];
      for (let j = 1; j <= lod.arc; j++) { const ph = Math.PI / 2 * j / lod.arc; half.push([xs + rc * Math.sin(ph), zc - dir * rc * (1 - Math.cos(ph))]); }
      if (lod.arc) half.push([xs + rc, zc - dir * (rc + ext)]);
      else half[1] = [xe, zc];
      return half.slice(1).reverse().map(p => [-p[0], p[1]]).concat(half);
    };
    const bar = (path, yc, h, d, col, mat) => {
      const n = path.length, y0 = yc - h / 2, y1 = yc + h / 2;
      const segN = [];
      for (let i = 0; i + 1 < n; i++) {
        const a = path[i], c = path[i + 1];
        let nx = c[1] - a[1], nz = a[0] - c[0];
        if (nx * (a[0] + c[0]) + nz * (a[1] + c[1]) < 0) { nx = -nx; nz = -nz; }
        const l = Math.hypot(nx, nz) || 1;
        segN.push([nx / l, nz / l]);
      }
      const out = [], back = [];
      path.forEach((p, i) => {
        const a = segN[Math.max(0, i - 1)], c = segN[Math.min(n - 2, i)];
        const l = Math.hypot(a[0] + c[0], a[1] + c[1]) || 1;
        const mx = (a[0] + c[0]) / l, mz = (a[1] + c[1]) / l;
        const k = Math.max(0.35, mx * c[0] + mz * c[1]);
        out.push([mx, 0, mz]);
        back.push([p[0] - mx / k * d, p[1] - mz / k * d]);
      });
      const V = (p, y) => [p[0], y, p[1]];
      for (let i = 0; i + 1 < n; i++) {
        faceN([V(path[i], y0), V(path[i + 1], y0), V(path[i + 1], y1), V(path[i], y1)], [out[i], out[i + 1], out[i + 1], out[i]], col, mat);
        face([V(path[i], y1), V(path[i + 1], y1), V(back[i + 1], y1), V(back[i], y1)], [0, 1, 0], col, mat);
        if (!lod.deco) continue;
        face([V(path[i], y0), V(path[i + 1], y0), V(back[i + 1], y0), V(back[i], y0)], [0, -1, 0], col, mat);
        face([V(back[i], y0), V(back[i + 1], y0), V(back[i + 1], y1), V(back[i], y1)], [-out[i][0], 0, -out[i][2]], col, mat);
      }
      if (lod.deco) for (const [i, j] of [[0, 1], [n - 1, n - 2]]) face([V(path[i], y0), V(path[i], y1), V(back[i], y1), V(back[i], y0)], [path[i][0] - path[j][0], 0, path[i][1] - path[j][1]], col, mat);
    };
    const blueBar = (e, zc, dir) => {
      const metal = e.kind === 'chrome' || e.kind === 'alu';
      const col = metal ? CHROME : e.kind === 'body' ? PAINT : BLACK, mat = metal ? MAT.CHROME : e.kind === 'body' ? MAT.PAINT : MAT.TRIM;
      const xe = e.half || W * wideAt(dir < 0 ? 0.04 : 0.96) * 0.99 + e.out * 0.4, rc = e.rc === undefined ? 0.14 : e.rc, ext = e.wrap === undefined ? 0.08 : e.wrap;
      const v0 = b.n;
      bar(barPath(zc, dir, ext, xe, rc), e.y, e.h, e.d || 0.06, col, mat);
      if ((e.strip || e.kind === 'alu') && lod.deco > 1) bar(barPath(zc + dir * 0.012, dir, ext, xe, rc), e.y + (e.stripY || 0), e.strip || 0.032, 0.03, e.stripMetal ? CHROME : BLACK, e.stripMetal ? MAT.CHROME : MAT.TRIM);
      const d = e.d || 0.06;
      for (const fg of lod.deco ? [].concat(e.fangs || []) : []) for (const s of [-1, 1]) b.box(s * fg.s, fg.y, zc + dir * (fg.out - d) / 2, fg.w / 2, fg.h / 2, (fg.out + d) / 2, fg.black ? BLACK : col, fg.black ? MAT.TRIM : mat, { bottom: true });
      const sk = e.skirt;
      if (sk && lod.deco) bar(barPath(zc - dir * (e.out - sk.out), dir, ext, xe, rc), sk.y, sk.h, sk.d || 0.05, BLACK, MAT.TRIM);
      mark(dir < 0 ? PT.bumperF : PT.bumperR, v0);
      return xe;
    };
    const bf = blue && blue.bump.f, br = blue && blue.bump.r;
    const zcF = bf ? Z(0) - bf.out : Z(0) - bp.p, zcR = br ? Z(1) + br.out : Z(1) + bp.p, yBar = bf ? bf.y : yb + bp.y, yBarR = br ? br.y : yBar;
    let vb = b.n;
    const xeF = bf ? blueBar(bf, zcF, -1) : xEnd, xeR = br ? blueBar(br, zcR, 1) : xEnd;
    if (!blue) {
      bar(barPath(zcF, -1, bp.ext), yBar, bp.h, bp.d, bcol, bmat);
      mark(PT.bumperF, vb); vb = b.n;
      bar(barPath(zcR, 1, bp.ext), yBar, bp.h, bp.d, bcol, bmat);
      mark(PT.bumperR, vb);
    }
    if (!blue && sh.bump === 'alu' && lod.deco > 1) {
      vb = b.n;
      bar(barPath(zcF - 0.012, -1, bp.ext), yBar, 0.032, 0.03, BLACK, MAT.TRIM);
      mark(PT.bumperF, vb); vb = b.n;
      bar(barPath(zcR + 0.012, 1, bp.ext), yBar, 0.032, 0.03, BLACK, MAT.TRIM);
      mark(PT.bumperR, vb);
    }

    const zf = Z(0) - 0.012, zr = Z(1) + 0.012, zBar = zcF - 0.004;
    const frontTop = S[0].top, rearTop = S[S.length - 1].top;
    const lightY = Math.max(yb + 0.22, frontTop - 0.13);
    const fquad = (x, y, w, h, col, mat, z = zf, uv = null) => b.quad([x - w, y - h, z], [x - w, y + h, z], [x + w, y + h, z], [x + w, y - h, z], col, mat, uv, [0, 0, -1]);
    const rquad = (x, y, w, h, col, mat, z = zr, uv = null) => b.quad([x + w, y - h, z], [x + w, y + h, z], [x - w, y + h, z], [x - w, y - h, z], col, mat, uv, [0, 0, 1]);
    const seg = lod.deco ? 8 : 6;
    const ringUV = (r, a, sx) => [(r[0] + r[2] / 2 + sx * Math.cos(a) * (r[2] / 2 - 1)) / TS, (r[1] + r[3] / 2 - (sx ? Math.sin(a) : 0) * (r[3] / 2 - 1)) / TS];
    const fcirc = (x, y, r, col, mat, ry = r, z = zf, cell = null) => {
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        b.triangle([x, y, z], [x + Math.cos(a1) * r, y + Math.sin(a1) * ry, z], [x + Math.cos(a0) * r, y + Math.sin(a0) * ry, z], col, mat, cell && [].concat(ringUV(cell, 0, 0), ringUV(cell, a1, -1), ringUV(cell, a0, -1)));
      }
    };
    const rcirc = (x, y, r, col, mat, cell = null) => {
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        b.triangle([x, y, zr], [x + Math.cos(a0) * r, y + Math.sin(a0) * r, zr], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, zr], col, mat, cell && [].concat(ringUV(cell, 0, 0), ringUV(cell, a0, 1), ringUV(cell, a1, 1)));
      }
    };
    const GT = cellUV(TX.grille), HT = cellUV(TX.head), TT = cellUV(TX.tail);
    const lightsF = [], lightsR = [], lightsB = [];
    const reverse = (x, y, w, h) => { rquad(x, y, w, h, REVC, MAT.REVERSE); lightsB.push([x, y, zr]); };
    const gw = W * 0.36;
    const fasciaPaint = [];
    const reach = (end, test) => {
      for (let k = 0; k <= 75; k++) { const f = end < 0 ? k * 0.002 : 1 - k * 0.002; if (test(f)) return f; }
      return end < 0 ? 0.15 : 0.85;
    };
    const surfZ = (end, x, y) => {
      const fs = reach(end, f => sideX(f) >= Math.abs(x)), ft = reach(end, f => topAt(f) >= y);
      return Z(end < 0 ? Math.max(fs, ft) : Math.min(fs, ft));
    };
    const uvFace = (P, want, col, mat, UV) => {
      const n = unit(newell(P));
      if (!n) return;
      const flip = n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0;
      emitFace(b, flip ? P.slice().reverse() : P, P.map(() => (flip ? [-n[0], -n[1], -n[2]] : n)), col, mat, flip ? UV.slice().reverse() : UV);
    };
    const outlineOf = (e, n) => {
      if (e.shape === 'round') {
        const rx = e.r || e.w / 2, ry = e.r || e.h / 2;
        return Array.from({ length: n }, (_, i) => [Math.cos(i / n * Math.PI * 2) * rx, Math.sin(i / n * Math.PI * 2) * ry]);
      }
      if (e.shape === 'poly') return e.pts;
      const hw = e.w / 2, hh = e.h / 2, rc = (e.rc || 0) >= 0.02 ? Math.min(e.rc, hw, hh) : 0, k = rc > 0 ? Math.max(1, n >> 3) : 0, out = [];
      for (const [cx, cy, a0] of [[hw - rc, hh - rc, 0], [rc - hw, hh - rc, Math.PI / 2], [rc - hw, rc - hh, Math.PI], [hw - rc, rc - hh, Math.PI * 1.5]]) {
        for (let j = 0; j <= k; j++) { const a = a0 + Math.PI / 2 * (k ? j / k : 0.5); out.push([cx + Math.cos(a) * rc, cy + Math.sin(a) * rc]); }
      }
      return out;
    };
    const grow = (pts, d) => pts.map((p, i) => {
      const a = pts[(i + pts.length - 1) % pts.length], c = pts[(i + 1) % pts.length];
      const n1 = unit([p[1] - a[1], a[0] - p[0], 0]) || [0, 0, 0], n2 = unit([c[1] - p[1], p[0] - c[0], 0]) || [0, 0, 0];
      const m = unit([n1[0] + n2[0], n1[1] + n2[1], 0]) || [0, 0, 0];
      return [p[0] + m[0] * d, p[1] + m[1] * d];
    });
    const DECOR = { chrome: [CHROME, MAT.CHROME], black: [BLACK, MAT.TRIM], paint: [PAINT, MAT.PAINT], dark: [DARK, 0] };
    const LAMPS = { head: [HEAD, MAT.HEAD, 'fresnel'], fog: [HEAD, MAT.HEAD, 'fresnel'], ind: [AMBER, MAT.LENS, 'ribs'], side: [AMBER, MAT.LENS, 'ribs'], tail: [TAILC, MAT.TAIL, 'cells'], stop: [TAILC, MAT.TAIL, 'cells'], rfog: [TAILC, MAT.LENS, 'cells'], rev: [REVC, MAT.REVERSE, 'clear'], refl: [C('#7a1a1a'), MAT.LENS, 'dots'] };
    const element = (e, x0, end) => {
      const where = end < 0 ? 'F' : 'B', sg = e.s && x0 < 0 ? -1 : 1, n = lod.deco === 2 ? 16 : lod.deco === 1 ? 10 : 6;
      let loc = outlineOf(e, n);
      if (newell(loc.map(p => [p[0], p[1], 0]))[2] < 0) loc = loc.slice().reverse();
      const deco = e.bezel && lod.deco === 2 ? DECOR[e.bezel] : null;
      const wp = p => [x0 + sg * p[0], e.y + p[1]];
      const pts = loc.map(wp), rim = (deco ? grow(loc, e.bw || 0.012) : loc).map(wp);
      const zs = e.at !== undefined ? rim.map(() => Z(e.at / L)) : rim.map(p => surfZ(end, p[0], p[1])), lift = e.out === undefined ? 0.01 : e.out;
      const zFace = end < 0 ? Math.min(...zs) - lift : Math.max(...zs) + lift, zLens = deco ? zFace - end * 0.004 : zFace;
      const lamp = e.k === 'lamp' ? LAMPS[e.use] : null, mark = e.k === 'mark';
      const col = e.col ? C(e.col) : lamp ? lamp[0] : GRILLT, mat = lamp ? lamp[1] : mark ? 0 : e.mat === 'chrome' ? MAT.CHROME : MAT.TRIM, out = [0, 0, end];
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      for (let k = 0; e.col !== 'none' && k < pts.length; k++) {
        const p = pts[k], q = pts[(k + 1) % pts.length], P = [[cx, cy, zLens], [p[0], p[1], zLens], [q[0], q[1], zLens]];
        uvFace(P, out, col, mat, P.map(v => (mark ? WHITE_UV : skinUV(where, v[0], v[1]))));
      }
      for (let i = 0; e.rings && lod.deco === 2 && i < e.rings; i++) {
        const r = e.h * 0.42, t = r * 0.2, gap = r * 1.45, rx = cx + (i - (e.rings - 1) / 2) * gap * sg, zr = zLens - end * 0.002, n = 12;
        for (let k = 0; k < n; k++) {
          const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          face([[rx + c0 * r, cy + s0 * r, zr], [rx + c1 * r, cy + s1 * r, zr], [rx + c1 * (r - t), cy + s1 * (r - t), zr], [rx + c0 * (r - t), cy + s0 * (r - t), zr]], out, CHROME, MAT.CHROME);
        }
      }
      if (e.roundel && lod.deco === 2) roundel(b, [cx, cy, zLens - end * 0.002], [end > 0 ? 1 : -1, 0, 0], [0, 1, 0], e.r || e.w / 2);
      for (let k = 0; e.star && lod.deco === 2 && k < 3; k++) {
        const t = (90 + k * 120) * Math.PI / 180, ux = Math.cos(t) * sg, uy = Math.sin(t), r = (e.r || e.w / 2) * 0.86, w = 0.005, zs = zLens - end * 0.0015;
        face([[cx - uy * w, cy + ux * w, zs], [cx + ux * r - uy * w * 0.3, cy + uy * r + ux * w * 0.3, zs], [cx + ux * r + uy * w * 0.3, cy + uy * r - ux * w * 0.3, zs], [cx + uy * w, cy - ux * w, zs]], out, CHROME, MAT.CHROME);
      }
      for (let k = 0; deco && k < pts.length; k++) {
        const k1 = (k + 1) % pts.length;
        face([[pts[k][0], pts[k][1], zFace], [pts[k1][0], pts[k1][1], zFace], [rim[k1][0], rim[k1][1], zFace], [rim[k][0], rim[k][1], zFace]], out, deco[0], deco[1]);
      }
      const wall = deco || DECOR[e.wall || 'dark'], bumpy = Math.max(...zs) - Math.min(...zs) > 0.003;
      for (let k = 0; lod.deco === 2 && (deco || bumpy) && k < rim.length; k++) {
        const k1 = (k + 1) % rim.length, p = rim[k], q = rim[k1], z0 = zs[k] - end * 0.004, z1 = zs[k1] - end * 0.004;
        if ((z0 - zFace) * -end < 0.002 && (z1 - zFace) * -end < 0.002) continue;
        face([[p[0], p[1], zFace], [q[0], q[1], zFace], [q[0], q[1], z1], [p[0], p[1], z0]], [(p[0] + q[0]) / 2 - cx, (p[1] + q[1]) / 2 - cy, 0], wall[0], wall[1]);
      }
      if (lod.deco === 2 && !mark) fasciaPaint.push({ where, pts, fill: e.fill || (lamp ? lamp[2] : 'hbars'), grid: e.grid });
      if (e.use === 'head') lightsF.push([cx, cy, zFace]);
      if (e.use === 'tail') lightsR.push([cx, cy, zFace]);
      if (e.use === 'rev') lightsB.push([cx, cy, zFace]);
    };
    const fascia = (list, end) => {
      for (const it of F.Blueprints.pairs(list.filter(e => e.k === 'lamp' || e.k === 'grille' || e.k === 'mark'))) if (lod.deco || it.e.use === (end < 0 ? 'head' : 'tail')) element(it.e, it.x, end);
    };
    if (lod.deco) {
      switch (sh.grille) {
        case 'kidney':
          fquad(-0.09, lightY - 0.01, 0.07, 0.06, CHROME, MAT.CHROME); fquad(0.09, lightY - 0.01, 0.07, 0.06, CHROME, MAT.CHROME);
          fquad(-0.09, lightY - 0.01, 0.055, 0.047, GRILLT, MAT.TRIM, zf - 0.002, GT); fquad(0.09, lightY - 0.01, 0.055, 0.047, GRILLT, MAT.TRIM, zf - 0.002, GT);
          break;
        case 'merc': case 'audi':
          fquad(0, lightY - 0.01, gw * 0.62, 0.075, CHROME, MAT.CHROME); fquad(0, lightY - 0.01, gw * 0.55, 0.06, GRILLT, MAT.TRIM, zf - 0.002, GT);
          break;
        case 'lada': fquad(0, lightY, gw * 1.2, 0.07, GRILLT, MAT.TRIM, zf, GT); fquad(0, lightY, gw * 1.2, 0.012, CHROME, MAT.CHROME, zf - 0.002); break;
        case 'shark': fquad(0, lightY - 0.04, gw * 1.3, 0.09, CHROME, MAT.CHROME); for (let i = -4; i <= 4; i++) fquad(i * gw * 0.28, lightY - 0.04, 0.012, 0.08, GRILL, 0, zf - 0.002); break;
        case 'gti': fquad(0, lightY, gw * 1.15, 0.06, GRILLT, MAT.TRIM, zf, GT); fquad(0, lightY - 0.045, gw * 1.15, 0.008, C('#c81818'), 0, zf - 0.002); break;
        case 'bars': fquad(0, lightY, gw * 0.9, 0.1, GRILLT, MAT.TRIM, zf, GT); for (let i = -3; i <= 3; i++) fquad(i * gw * 0.25, lightY, 0.015, 0.09, C('#6a6a6a'), 0, zf - 0.002); break;
        case 'full': fquad(0, lightY, W * 0.9, 0.09, GRILLT, MAT.TRIM, zf, GT); fquad(0, lightY, W * 0.92, 0.01, CHROME, MAT.CHROME, zf - 0.002); break;
        case 'evo': fquad(0, lightY - 0.03, gw * 0.9, 0.06, GRILLT, MAT.TRIM, zf, GT); fquad(0, yBar - 0.01, W * 0.5, 0.05, GRILLT, MAT.TRIM, zBar, GT); break;
        case 'star': fquad(0, lightY - 0.03, gw * 1.1, 0.08, GRILLT, MAT.TRIM, zf, GT); fquad(0, lightY - 0.03, gw * 1.1, 0.012, CHROME, MAT.CHROME, zf - 0.002); break;
        case 'slot': fquad(0, lightY - 0.03, gw * 0.9, 0.025, GRILLT, MAT.TRIM, zf, GT); break;
        case 'mazda': {
          const ye = lightY + 0.02;
          fquad(0, ye, W * 0.22, 0.026, GRILLT, MAT.TRIM, zf, GT);
          fcirc(0, ye, 0.05, CHROME, MAT.CHROME, 0.034, zf - 0.003);
          fcirc(0, ye, 0.04, GRILL, 0, 0.025, zf - 0.004);
          b.triangle([0, ye + 0.02, zf - 0.005], [0.017, ye, zf - 0.005], [0, ye - 0.02, zf - 0.005], CHROME, MAT.CHROME);
          b.triangle([0, ye + 0.02, zf - 0.005], [0, ye - 0.02, zf - 0.005], [-0.017, ye, zf - 0.005], CHROME, MAT.CHROME);
          break;
        }
        default: break;
      }
    }
    const lx = W * 0.64, hv0 = b.n, hn0 = b.ni;
    switch (sh.lights) {
      case 'rect': for (const s of [-1, 1]) { fquad(s * lx, lightY, 0.15, 0.06, HEAD, MAT.HEAD, zf, HT); lightsF.push([s * lx, lightY, zf]); } break;
      case 'round2': for (const s of [-1, 1]) { fcirc(s * lx, lightY, 0.09, HEAD, MAT.HEAD, 0.09, zf, TX.head); if (lod.deco) fcirc(s * lx, lightY, 0.105, CHROME, MAT.CHROME, 0.105, zf + 0.004); lightsF.push([s * lx, lightY, zf]); } break;
      case 'round4': for (const s of [-1, 1]) { fcirc(s * W * 0.52, lightY, 0.07, HEAD, MAT.HEAD, 0.07, zf, TX.head); fcirc(s * W * 0.74, lightY, 0.07, HEAD, MAT.HEAD, 0.07, zf, TX.head); lightsF.push([s * W * 0.63, lightY, zf]); } break;
      case 'slim': for (const s of [-1, 1]) { fquad(s * lx, lightY + 0.02, 0.17, 0.035, HEAD, MAT.HEAD, zf, HT); lightsF.push([s * lx, lightY, zf]); } break;
      case 'wide': for (const s of [-1, 1]) { fquad(s * W * 0.56, lightY + 0.02, W * 0.26, 0.054, HEAD, MAT.HEAD, zf, HT); lightsF.push([s * W * 0.56, lightY + 0.02, zf]); } break;
      case 'popup': for (const s of [-1, 1]) fquad(s * W * 0.72, yBar, 0.06, 0.03, HEAD, MAT.HEAD, zBar); break;
      case 'oval': for (const s of [-1, 1]) { fcirc(s * lx, lightY + 0.02, 0.1, HEAD, MAT.HEAD, 0.13, zf, TX.head); lightsF.push([s * lx, lightY, zf]); } break;
      default: break;
    }
    sided(hv0, hn0, PT.headL, PT.headR, new Set([MAT.HEAD]));
    if (blue) {
      const v0 = b.n, n0 = b.ni;
      fascia(blue.front, -1);
      sided(v0, n0, PT.headL, PT.headR, new Set([MAT.HEAD, MAT.LENS]));
    }
    const lb = lod.deco > 1 && (sh.lights === 'popup' || sh.lights === 'hidden') ? new Batch(256) : null;
    if (lb) lb.uvw = WHITE_UV;
    let lamp = null;
    if (sh.lights === 'popup') {
      const f0 = 0.06, zp0 = Z(f0), zp1 = zp0 + 0.24, f1 = f0 + 0.24 / L;
      const yh = surfY(f1, lx), yT = yh + 0.06, yB = surfY(f0, lx) - 0.06, yl = yT - 0.034;
      for (const s of [-1, 1]) {
        const cx = s * lx;
        lightsF.push([cx, yl, zp0]);
        if (!lod.deco) continue;
        if (lb) {
          lb.box(cx, (yT + yB) / 2, (zp0 + zp1) / 2, 0.14, (yT - yB) / 2, 0.12, PAINT, MAT.PAINT);
          lb.quad([cx - 0.12, yl - 0.024, zp0 - 0.003], [cx - 0.12, yl + 0.024, zp0 - 0.003], [cx + 0.12, yl + 0.024, zp0 - 0.003], [cx + 0.12, yl - 0.024, zp0 - 0.003], HEAD, MAT.HEAD, null, [0, 0, -1]);
        }
        const e = 0.005, xs = [cx - 0.145, cx, cx + 0.145], lift = 0.004;
        for (const [f, z] of [[f0, zp0], [f1, zp1]]) {
          for (let j = 0; j < 2; j++) {
            const xa = xs[j], xb = xs[j + 1], ya = surfY(f, Math.abs(xa)) + lift, yb2 = surfY(f, Math.abs(xb)) + lift;
            face([[xa, ya, z - e], [xb, yb2, z - e], [xb, yb2, z + e], [xa, ya, z + e]], [0, 1, 0], DARK, 0);
          }
        }
        for (const x of [xs[0], xs[2]]) {
          const ya = surfY(f0, Math.abs(x)) + lift, yb2 = surfY(f1, Math.abs(x)) + lift;
          face([[x - e, ya, zp0], [x + e, ya, zp0], [x + e, yb2, zp1], [x - e, yb2, zp1]], [0, 1, 0], DARK, 0);
        }
      }
      if (lb) lamp = { batch: lb, hinge: [yh, zp1], shut: -0.9 };
    } else if (sh.lights === 'hidden') {
      const disc = (x, r, col, mat, z) => {
        for (let i = 0; i < 10; i++) {
          const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2;
          lb.triangle([x, lightY, z], [x + Math.cos(a1) * r, lightY + Math.sin(a1) * r, z], [x + Math.cos(a0) * r, lightY + Math.sin(a0) * r, z], col, mat);
        }
      };
      for (const s of [-1, 1]) {
        if (lb) for (const x of [W * 0.52, W * 0.74]) { disc(s * x, 0.086, CHROME, MAT.CHROME, zf - 0.004); disc(s * x, 0.07, HEAD, MAT.HEAD, zf - 0.006); }
        lightsF.push([s * W * 0.63, lightY, zf]);
      }
      if (lb) lamp = { batch: lb, hinge: null, shut: 0 };
    }
    const tailY = Math.max(yb + 0.2, rearTop - 0.12), tv0 = b.n, tn0 = b.ni;
    let band = null;
    if (blue) fascia(blue.rear, 1);
    else if (sh.tailRound) {
      for (const s of [-1, 1]) { rcirc(s * W * 0.55, tailY, 0.075, TAILC, MAT.TAIL, TX.tail); rcirc(s * W * 0.78, tailY, 0.075, TAILC, MAT.TAIL, TX.tail); lightsR.push([s * W * 0.66, tailY, zr]); if (lod.deco) reverse(s * W * 0.55, tailY - 0.11, 0.04, 0.022); }
    } else if (sh.van || sh.suv) {
      for (const s of [-1, 1]) { rquad(s * W * 0.84, tailY - 0.05, 0.07, 0.12, TAILC, MAT.TAIL, zr, TT); lightsR.push([s * W * 0.84, tailY, zr]); if (lod.deco) reverse(s * W * 0.84, tailY - 0.2, 0.07, 0.025); }
    } else if (car.country === 'us' && car.year < 1975) {
      rquad(0, tailY, W * 0.86, 0.05, TAILC, MAT.TAIL, zr, TT);
      for (const s of [-1, 1]) { lightsR.push([s * W * 0.6, tailY, zr]); if (lod.deco) reverse(s * 0.2, tailY - 0.09, 0.06, 0.022); }
    } else if (sh.tailBand) {
      const P1 = sectionOf({ f: 1, edge: 0 }).P;
      const sideAt = (f, y) => {
        const P = f === 1 ? P1 : sectionOf({ f, edge: 0 }).P;
        for (let j = 0; j + 1 < P.length; j++) if (y <= P[j + 1][1]) return P[j][0] + (P[j + 1][0] - P[j][0]) * F.clamp((y - P[j][1]) / Math.max(1e-6, P[j + 1][1] - P[j][1]), 0, 1);
        return P[P.length - 1][0];
      };
      const yT = Math.min(beltAt(1), rearTop) - 0.012, yM = yT - 0.15, yB = yM - 0.085, xo = 0.5;
      band = { yT, yM, yB };
      const SMOKE = C('#2a2426'), REVLENS = C('#5e5458');
      const edge = y => sideAt(1, y) - 0.004, at = v => () => v;
      const strip = (xl, xr, y0, y1, col, mat, z = zr) => b.quad([xr(y0), y0, z], [xr(y1), y1, z], [xl(y1), y1, z], [xl(y0), y0, z], col, mat, null, [0, 0, 1]);
      const oval = (x, y, rx, ry, col, mat, z) => {
        for (let i = 0; i < seg; i++) {
          const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
          b.triangle([x, y, z], [x + Math.cos(a0) * rx, y + Math.sin(a0) * ry, z], [x + Math.cos(a1) * rx, y + Math.sin(a1) * ry, z], col, mat);
        }
      };
      if (lod.deco) strip(y => -edge(y), edge, yB - 0.008, yT + 0.006, BLACK, MAT.TRIM, zr - 0.003);
      strip(at(0.008 - xo), at(xo - 0.008), yM, yT, TAILC, MAT.LENS);
      strip(at(0.008 - xo), at(xo - 0.008), yB, yM, SMOKE, MAT.LENS);
      for (const s of [-1, 1]) {
        const inner = at(s * xo), outer = y => s * edge(y);
        const [xl, xr] = s > 0 ? [inner, outer] : [outer, inner];
        strip(xl, xr, yM, yT, TAILC, MAT.TAIL);
        strip(xl, xr, yB, yM, lod.deco ? REVLENS : SMOKE, lod.deco ? MAT.REVERSE : MAT.LENS);
        lightsR.push([s * (xo + edge(yT)) / 2, (yM + yT) / 2, zr]);
        if (lod.deco) lightsB.push([s * (xo + edge(yB)) / 2, (yB + yM) / 2, zr]);
        if (lod.deco < 2) continue;
        const out = (f, y) => [s * (sideAt(f, y) + 0.004), y, f === 1 ? Z(1) + 0.004 : Z(f)];
        const fs = [1, 0.994, 0.984];
        for (const [y0, y1, col, mat] of [[yB, yM, REVLENS, MAT.REVERSE], [yM, yT, TAILC, MAT.TAIL]]) {
          face([[s * edge(y0), y0, zr], [s * edge(y1), y1, zr], out(1, y1), out(1, y0)], [s, 0, 1], col, mat);
          for (let j = 0; j + 1 < fs.length; j++) face([out(fs[j], y0), out(fs[j], y1), out(fs[j + 1], y1), out(fs[j + 1], y0)], [s, 0, 0], col, mat);
        }
      }
      if (lod.deco) {
        const ye = yM + 0.09, ze = zr + 0.002;
        oval(0, ye, 0.036, 0.024, CHROME, MAT.CHROME, ze);
        oval(0, ye, 0.027, 0.016, GRILL, 0, ze + 0.001);
        b.triangle([0, ye + 0.013, ze + 0.002], [-0.011, ye, ze + 0.002], [0, ye - 0.013, ze + 0.002], CHROME, MAT.CHROME);
        b.triangle([0, ye + 0.013, ze + 0.002], [0, ye - 0.013, ze + 0.002], [0.011, ye, ze + 0.002], CHROME, MAT.CHROME);
        oval(0.34, (yB + yM) / 2, 0.022, 0.022, C('#5a2226'), MAT.LENS, ze);
      }
    } else {
      for (const s of [-1, 1]) {
        rquad(s * W * 0.66, tailY, 0.17, 0.06, TAILC, MAT.TAIL, zr, TT);
        if (lod.deco) { rquad(s * W * 0.43, tailY + 0.03, 0.05, 0.03, AMBER, MAT.LENS); reverse(s * W * 0.43, tailY - 0.03, 0.05, 0.03); }
        lightsR.push([s * W * 0.66, tailY, zr]);
      }
    }
    sided(tv0, tn0, PT.tailL, PT.tailR, new Set([MAT.TAIL, MAT.LENS, MAT.REVERSE]));
    if (lod.deco && blue) {
      const pe = F.Blueprints.items(blue, 'front', 'plate')[0], re = F.Blueprints.items(blue, 'rear', 'plate')[0], uv = cellUV(TX.plate);
      const fy = pe ? pe.y : yBar + 0.01, ry = re ? re.y : yBarR + br.h / 2 + 0.065;
      const fz = Math.abs(fy - yBar) <= bf.h / 2 ? zBar - 0.002 : surfZ(-1, 0.27, fy) - 0.006;
      const rz = Math.abs(ry - yBarR) <= br.h / 2 ? zcR + 0.004 : (re && re.stand ? Math.max(surfZ(1, 0.27, ry - 0.055), surfZ(1, 0.27, ry + 0.055)) : surfZ(1, 0.27, ry)) + 0.006;
      vb = b.n;
      b.quad([-0.26, fy - 0.055, fz], [-0.26, fy + 0.055, fz], [0.26, fy + 0.055, fz], [0.26, fy - 0.055, fz], C('#ffffff'), 0, uv, [0, 0, -1]);
      if (lod.deco > 1) fquad(0, fy, 0.275, 0.068, trimCol, trimMat, fz + 0.001);
      mark(PT.bumperF, vb);
      const vPlate = b.n;
      b.quad([0.26, ry - 0.055, rz], [0.26, ry + 0.055, rz], [-0.26, ry + 0.055, rz], [-0.26, ry - 0.055, rz], C('#ffffff'), 0, uv, [0, 0, 1]);
      if (lod.deco > 1) rquad(0, ry, 0.275, 0.068, trimCol, trimMat, rz - 0.002);
      if (door && Math.abs(ry - yBarR) > br.h / 2) mark(PT.trunk, vPlate);
    }
    if (lod.deco) {
      const plateUV = cellUV(TX.plate);
      const py = yBar + 0.01;
      vb = b.n;
      if (!blue) {
        b.quad([-0.26, py - 0.055, zBar - 0.002], [-0.26, py + 0.055, zBar - 0.002], [0.26, py + 0.055, zBar - 0.002], [0.26, py - 0.055, zBar - 0.002], C('#ffffff'), 0, plateUV, [0, 0, -1]);
        mark(PT.bumperF, vb);
        const ry = sh.van || sh.suv ? yb + 0.35 : band ? band.yM - 0.03 : Math.max(yBar + bp.h / 2 + 0.065, tailY - 0.24);
        b.quad([0.26, ry - 0.055, zr + 0.004], [0.26, ry + 0.055, zr + 0.004], [-0.26, ry + 0.055, zr + 0.004], [-0.26, ry - 0.055, zr + 0.004], C('#ffffff'), 0, plateUV, [0, 0, 1]);
        if (lod.deco > 1) {
          vb = b.n;
          fquad(0, py, 0.275, 0.068, trimCol, trimMat, zBar - 0.001);
          mark(PT.bumperF, vb);
          rquad(0, ry, 0.275, 0.068, trimCol, trimMat, zr + 0.002);
        }
      }
      vb = b.n;
      if (sh.fog) for (const s of [-1, 1]) fquad(s * W * 0.6, yBar, 0.065, 0.03, HEAD, MAT.HEAD, zBar - 0.002);
      mark(PT.bumperF, vb);
      const mo = blue && blue.parts && blue.parts.mirror;
      const fmir = mo ? mo.x / L : sh.ws + 0.12 / L, xm = sideX(fmir), ym = mo ? mo.y : beltAt(fmir) + 0.1, zm = Z(fmir);
      const bodyShell = car.year >= 1990 && sh.bump === 'body';
      for (const s of [-1, 1]) {
        if (mo && mo.side && (s < 0) !== (mo.side === 'L')) continue;
        const cx = s * (xm + (mo ? mo.arm : 0.1)), vm = b.n;
        if (mo && mo.shape === 'round') {
          const n = lod.deco >= 2 ? 10 : 6, r = mo.r, z0 = zm - 0.012, z1 = zm + 0.018;
          const ring = k => [cx + Math.cos(k / n * Math.PI * 2) * r, ym + Math.sin(k / n * Math.PI * 2) * r];
          for (let k = 0; k < n; k++) {
            const p = ring(k), q = ring(k + 1), am = (k + 0.5) / n * Math.PI * 2;
            face([[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], [Math.cos(am), Math.sin(am), 0], CHROME, MAT.CHROME);
            face([[cx, ym, z0 - 0.008], [p[0], p[1], z0], [q[0], q[1], z0]], [0, 0, -1], CHROME, MAT.CHROME);
            face([[cx, ym, z1], [q[0], q[1], z1], [p[0], p[1], z1]], [0, 0, 1], C('#aab2ba'), MAT.CHROME);
          }
          if (mo.wing) b.beam([cx, surfY(fmir, Math.abs(cx)) - 0.005, zm], [cx, ym - r * 0.9, zm], 0.009, CHROME, MAT.CHROME);
          else b.beam([s * (xm - 0.01), ym - 0.09, zm], [cx - s * r * 0.3, ym - r * 0.6, zm], 0.009, CHROME, MAT.CHROME);
          mark(s < 0 ? PT.mirrorL : PT.mirrorR, vm);
          continue;
        }
        if (mo) {
          const mc = mo.chrome ? CHROME : mo.paint ? PAINT : BLACK, mm = mo.chrome ? MAT.CHROME : mo.paint ? MAT.PAINT : MAT.TRIM;
          b.box(cx, ym, zm, mo.w / 2, mo.h / 2, 0.022, mc, mm);
          b.beam([s * (xm - 0.02), ym - mo.h * 0.3, zm - 0.01], [cx, ym - mo.h * 0.3, zm], 0.011, mc, mm);
          b.beam([s * (xm - 0.02), ym + mo.h * 0.3, zm - 0.01], [cx, ym + mo.h * 0.3, zm], 0.011, mc, mm);
          if (lod.deco >= 2) face([[cx - mo.w / 2 + 0.012, ym - mo.h / 2 + 0.012, zm + 0.023], [cx + mo.w / 2 - 0.012, ym - mo.h / 2 + 0.012, zm + 0.023], [cx + mo.w / 2 - 0.012, ym + mo.h / 2 - 0.012, zm + 0.023], [cx - mo.w / 2 + 0.012, ym + mo.h / 2 - 0.012, zm + 0.023]], [0, 0, 1], mo.chrome ? C('#aab2ba') : CHROME, MAT.CHROME);
          mark(s < 0 ? PT.mirrorL : PT.mirrorR, vm);
          continue;
        }
        b.box(cx, ym, zm, 0.085, 0.05, 0.035, bodyShell ? PAINT : trimCol, bodyShell ? MAT.PAINT : trimMat);
        if (lod.deco >= 2) {
          b.beam([s * (xm - 0.02), ym - 0.035, zm - 0.01], [s * (xm + 0.03), ym - 0.03, zm], 0.012, trimCol, trimMat);
          face([[cx - 0.07, ym - 0.037, zm + 0.037], [cx + 0.07, ym - 0.037, zm + 0.037], [cx + 0.07, ym + 0.037, zm + 0.037], [cx - 0.07, ym + 0.037, zm + 0.037]], [0, 0, 1], CHROME, MAT.CHROME);
        }
        mark(s < 0 ? PT.mirrorL : PT.mirrorR, vm);
      }
    }
    let wiper = null;
    const tips = { dual: [-W * 0.55, W * 0.55], quad: [-W * 0.62, -W * 0.47, W * 0.47, W * 0.62], center: [-0.075, 0.075], left: [-W * 0.55], twin: [-W * 0.65, -W * 0.56] }[sh.exh] || [W * 0.55];
    const tipR = sh.exh === 'center' ? 0.042 : sh.exh === 'quad' ? 0.03 : 0.034, tipY = yb + 0.035, tipZ = blue ? Z(1) + 0.03 : zcR + 0.025;
    if (lod.deco > 1) {
      const ends = gh.pillars.map(p => p.f - p.hw);
      if (sh.van) ends.length = Math.min(1, ends.length);
      else if (!ends.length || ((sh.doors || 4) >= 4 && ends.length < 2)) ends.push(gh.end);
      const sideAtY = (f, y) => {
        const P = sectionOf({ f, edge: 0 }).P;
        for (let j = 0; j + 1 < P.length; j++) if (y <= P[j + 1][1]) return P[j][0] + (P[j + 1][0] - P[j][0]) * F.clamp((y - P[j][1]) / Math.max(1e-6, P[j + 1][1] - P[j][1]), 0, 1);
        return P[P.length - 1][0];
      };
      const hug = blue && blue.parts && blue.parts.hug;
      const grips = blue && blue.parts && blue.parts.handles ? blue.parts.handles.map(h => [h[0] / L, h[1], h[2] || 0]) : ends.map(fe => [fe - 0.1 / L, null, 0]);
      for (const [f, hy, only] of grips) {
        const gp = blue && blue.parts && blue.parts.grip;
        for (const s of only ? [only] : [-1, 1]) b.box(s * ((hug ? sideAtY(f, hy) + 0.008 : sideX(f)) + 0.002), hy === null ? beltAt(f) - 0.07 : hy, Z(f), 0.01, gp ? gp[0] : 0.011, gp ? gp[1] : 0.05, trimCol, trimMat);
      }
      for (const pn of (blue && blue.parts && blue.parts.panes) || []) for (const s of [-1, 1]) {
        const at = (x, y, d) => [s * (sideAtY(x / L, y) + d), y, Z(x / L)], e = 0.02;
        face([at(pn.x0 - e, pn.y0 - e, 0.004), at(pn.x1 + e, pn.y0 - e, 0.004), at(pn.x1 + e, pn.y1 + e, 0.004), at(pn.x0 - e, pn.y1 + e, 0.004)], [s, 0, 0], BLACK, MAT.TRIM);
        face([at(pn.x0, pn.y0, 0.007), at(pn.x1, pn.y0, 0.007), at(pn.x1, pn.y1, 0.007), at(pn.x0, pn.y1, 0.007)], [s, 0, 0], GLASS, MAT.GLASS);
      }
      const hg = blue && blue.parts && blue.parts.hinges;
      for (const [hx, hy] of (hg && hg.pts) || []) for (const s of [-1, 1]) b.box(s * (sideAtY(hx / L, hy) + 0.006), hy, Z(hx / L), 0.008, hg.h / 2, hg.len / 2, CHROME, MAT.CHROME);
      const cp = blue && blue.parts && blue.parts.caps;
      if (cp) for (const s of [-1, 1]) {
        const f = cp.x / L, z = Z(f), x0 = s * (sideAtY(f, cp.y) - 0.002), x1 = s * (sideAtY(f, cp.y) + 0.014), n = 10;
        const at = (x, a) => [x, cp.y + Math.sin(a) * cp.r, z + Math.cos(a) * cp.r];
        for (let k = 0; k < n; k++) {
          const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
          face([[x1, cp.y, z], at(x1, a0), at(x1, a1)], [s, 0, 0], CHROME, MAT.CHROME);
          face([at(x0, a0), at(x0, a1), at(x1, a1), at(x1, a0)], [0, Math.sin(am), Math.cos(am)], CHROME, MAT.CHROME);
        }
      }
      for (const seam of (blue && blue.parts && blue.parts.seams) || []) for (const s of [-1, 1]) {
        const sm = seam.pts || seam, sc = seam.roof && roofCol ? roofCol : PAINT, smat = seam.roof && roofCol ? MAT.NONE : MAT.PAINT;
        for (let j = 0; j + 1 < sm.length; j++) {
          const p = sm[j], q = sm[j + 1], tl = Math.hypot(q[1] - p[1], q[0] - p[0]) || 1, flip = q[0] - p[0] < 0 ? -1 : 1;
          const ny = (q[0] - p[0]) / tl * flip, nz = -(q[1] - p[1]) / tl * flip;
          const at = (v, dx, k) => [s * (sideAtY(v[0] / L, v[1] + k * ny) + dx), v[1] + k * ny, Z(v[0] / L) + k * nz];
          face([at(p, 0.008, -0.006), at(q, 0.008, -0.006), at(q, 0.008, 0.006), at(p, 0.008, 0.006)], [s, 0, 0], sc, smat);
          face([at(p, -0.002, 0.006), at(p, 0.008, 0.006), at(q, 0.008, 0.006), at(q, -0.002, 0.006)], [0, ny, nz], sc, smat);
        }
      }
      const rk = blue && blue.glass && blue.glass.rake;
      if (rk && lod.deco === 2) {
        const [[xt, yt], [xb, yd]] = rk, xe = blue.glass.end + 0.02, m = 6;
        const low = x => (x <= xb ? yt + (yd - yt) * (x - xt) / (xb - xt) : yd), high = x => Math.max(low(x), sectionOf({ f: x / L, edge: 0 }).P[6][1]);
        const at = (s, x, y) => [s * (sideAtY(x / L, y) + 0.004), y, Z(x / L)];
        for (const s of [-1, 1]) for (let i = 0; i < m; i++) {
          const x0 = xt + (xe - xt) * i / m, x1 = xt + (xe - xt) * (i + 1) / m;
          face([at(s, x0, low(x0)), at(s, x1, low(x1)), at(s, x1, high(x1)), at(s, x0, high(x0))], [s, 0, 0], PAINT, MAT.PAINT);
        }
      }
      const bars = blue && blue.parts && blue.parts.bars;
      for (const bar of bars || []) {
        const half = bar.pts.filter((p, i) => i === 0 || i === bar.pts.length - 1 || lod.deco > 1), line = half.slice(1).reverse().map(p => [-p[0], p[1]]).concat(half);
        const at = p => [p[0], p[1], surfZ(-1, Math.abs(p[0]), p[1]) - bar.out];
        for (let j = 0; j + 1 < line.length; j++) b.beam(at(line[j]), at(line[j + 1]), bar.r, CHROME, MAT.CHROME);
      }
      if (blue && blue.glass && blue.glass.split) {
        const f0 = sh.ws + 0.006, f1 = sh.wt - 0.004;
        b.beam([0, surfY(f0, 0) + 0.004, Z(f0)], [0, surfY(f1, 0) + 0.004, Z(f1)], 0.01, trimCol, trimMat);
      }
      const rw2 = blue && blue.parts && blue.parts.roofWing;
      if (rw2) {
        const vr = b.n, z0 = Z(rw2.x0 / L), z1 = Z(rw2.x1 / L);
        prism([[z0, rw2.y0], [z1, rw2.y1], [z1, rw2.y1 + rw2.t * 0.5], [z0 + 0.05, rw2.y0 + rw2.t], [z0, rw2.y0 + rw2.t * 0.6]], rw2.hw, PAINT, MAT.PAINT);
        for (const s of [-1, 1]) prism([[z0 + 0.06, rw2.y0 - 0.05], [z1 - 0.04, rw2.y1 - 0.06], [z1 - 0.04, rw2.y1], [z0 + 0.06, rw2.y0]], 0.005, PAINT, MAT.PAINT, s * (rw2.hw - 0.03));
        if (door) mark(PT.trunk, vr);
      }
      const lv = blue && blue.parts && blue.parts.louvres;
      for (let k = 0; lv && k < lv.n; k++) {
        const x = lv.x0 + (lv.x1 - lv.x0) * (k + 0.5) / lv.n, fa = x / L, fb = (x - lv.lean) / L, ya = beltAt(fa) + 0.03, yb = topAt(fb) - 0.05;
        for (const s of [-1, 1]) b.beam([s * (sideAtY(fa, ya) + 0.004), ya, Z(fa)], [s * (sideAtY(fb, yb) + 0.004), yb, Z(fb)], 0.006, C('#3a3a3e'), MAT.TRIM);
      }
      const rwp = blue && blue.parts && blue.parts.rearWiper;
      if (rwp) {
        const vw = b.n, at = (s, y) => [s, y, surfZ(1, Math.abs(s), y) + 0.014];
        b.beam(at(rwp.s0, rwp.y0), at(rwp.s1, rwp.y1), 0.007, BLACK, MAT.TRIM);
        if (door) mark(PT.trunk, vw);
      }
      for (const rp of [].concat((blue && blue.parts && blue.parts.repeaters) || [])) {
        const f = rp.x / L, z = Z(f), xr = sideAtY(f, rp.y), rc = rp.col ? C(rp.col) : AMBER;
        for (const s of [-1, 1]) for (let k = 0; k < 8; k++) {
          const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2, x = s * (xr + 0.003);
          face([[x, rp.y, z], [x, rp.y + Math.sin(a0) * (rp.ry || rp.r), z + Math.cos(a0) * rp.r], [x, rp.y + Math.sin(a1) * (rp.ry || rp.r), z + Math.cos(a1) * rp.r]], [s, 0, 0], rc, MAT.LENS);
        }
      }
      const fw = sh.ws + (sh.wt - sh.ws) * 0.2, zw = Z(fw), rw = Math.min(edgeAt(fw), W * wideAt(fw) * 0.97);
      const wy = x => surfY(fw, Math.abs(x)) + 0.012;
      const up = unit([0, sh.hgt - sh.hood, (sh.wt - sh.ws) * L]), len = Math.min(rw * 0.66, (sh.hgt - wy(0)) / up[1] * 0.9);
      const rest = new Batch(64), blade = new Batch(32);
      rest.uvw = blade.uvw = WHITE_UV;
      const pivots = [-rw * 0.8, -rw * 0.08].map(x0 => [x0, wy(x0), zw]);
      for (const p of pivots) rest.beam(p, [p[0] + len, wy(p[0] + len), zw - 0.01], 0.007, trimCol, trimMat);
      blade.beam([0, 0, 0], [len, 0, 0], 0.007, trimCol, trimMat);
      wiper = { rest, blade, pivots, up, n: [0, up[2], -up[1]], len, sweep: 1.75, zTop: Z(sh.wt) + 0.05, xMax: rw * 0.97 };
      const orn = blue && blue.parts && blue.parts.ornament;
      if (orn) {
        const fo = orn.x / L, z = Z(fo), y0 = surfY(fo, 0), cy = y0 + orn.stem + orn.r, n = 10, t = 0.0035, vo = b.n;
        const at = a => [Math.cos(a) * orn.r, cy + Math.sin(a) * orn.r, z];
        b.beam([0, y0 - 0.005, z], [0, cy - orn.r, z], 0.005, CHROME, MAT.CHROME);
        for (let k = 0; k < n; k++) b.beam(at(k / n * Math.PI * 2), at((k + 1) / n * Math.PI * 2), t, CHROME, MAT.CHROME);
        for (const a of [90, 210, 330]) b.beam([0, cy, z], at(a * Math.PI / 180), t, CHROME, MAT.CHROME);
        if (hasHood) mark(PT.hood, vo);
      }
      const rd = blue && blue.parts && blue.parts.roundel;
      if (rd && lod.deco === 2) {
        const f = rd.x / L, d = 0.02 / L, dy = surfY(f + d, 0) - surfY(f - d, 0), dz = Z(f + d) - Z(f - d), l = Math.hypot(dy, dz), vr = b.n;
        roundel(b, [0, surfY(f, 0) + 0.004, Z(f)], [-1, 0, 0], [0, dy / l, dz / l], rd.r);
        if (hasHood) mark(PT.hood, vr);
      }
      const ant = blue && blue.parts && blue.parts.antenna;
      if (ant) {
        const fa = ant.x / L, xa = ant.s, ya = surfY(fa, Math.abs(xa));
        b.beam([xa, ya - 0.01, Z(fa)], [xa, ya + ant.len, Z(fa) + ant.len * 0.08], 0.004, BLACK, MAT.TRIM);
      } else if (ant !== false && (car.country === 'su' || car.country === 'lv' || car.year < 1990)) {
        const fa = Math.max(0.1, sh.ws - 0.06), xa = W * wideAt(fa) * 0.8, ya = surfY(fa, xa);
        b.beam([xa, ya - 0.01, Z(fa)], [xa, ya + 0.6, Z(fa) + 0.12], 0.004, BLACK, MAT.TRIM);
      } else if (ant !== false && sh.seats !== 2 && !sh.suv) {
        const fa = sh.rt - 0.03, ya = surfY(fa, 0);
        b.beam([0, ya - 0.01, Z(fa)], [0, ya + 0.16, Z(fa) + 0.06], 0.006, BLACK, MAT.TRIM);
      }
      for (const x of tips) {
        const p = (a, r, z) => [x + Math.cos(a) * r, tipY + Math.sin(a) * r, z];
        for (let k = 0; k < 6; k++) {
          const a0 = (k + 0.5) / 6 * Math.PI * 2, a1 = (k + 1.5) / 6 * Math.PI * 2, am = (a0 + a1) / 2;
          face([p(a0, tipR, Z(1) - 0.1), p(a1, tipR, Z(1) - 0.1), p(a1, tipR, tipZ), p(a0, tipR, tipZ)], [Math.cos(am), Math.sin(am), 0], CHROME, MAT.CHROME);
          face([p(a0, tipR, tipZ), p(a1, tipR, tipZ), p(a1, tipR * 0.72, tipZ), p(a0, tipR * 0.72, tipZ)], [0, 0, 1], CHROME, MAT.CHROME);
          face([[x, tipY, tipZ - 0.004], p(a0, tipR * 0.72, tipZ - 0.004), p(a1, tipR * 0.72, tipZ - 0.004)], [0, 0, 1], DARK, 0);
        }
      }
    }

    const wing = o.wing !== undefined ? o.wing : sh.wing;
    const zt = Z(0.975), deckY = skinAt(0.975), wv0 = b.n;
    if (wing === 'lip' && lod.deco) {
      const z0 = Z(0.93), z1 = Z(0.985), y0 = skinAt(0.93), y1 = skinAt(0.985);
      prism([[z0, y0 - 0.01], [z1, y1 - 0.01], [z1 + 0.012, y1 + 0.05], [z0 + 0.03, y0 + 0.006]], W * 0.8, PAINT, MAT.PAINT);
    } else if (wing === 'high' || wing === 'hoop') {
      const h = wing === 'hoop' ? 0.3 : 0.22, y = deckY + h;
      if (!lod.deco) b.box(0, y, zt, W * 0.9, 0.02, 0.13, wing === 'hoop' ? PAINT : BLACK, wing === 'hoop' ? MAT.PAINT : MAT.TRIM);
      else if (wing === 'high') {
        prism([[zt - 0.14, y], [zt - 0.1, y + 0.026], [zt + 0.14, y + 0.012], [zt + 0.14, y - 0.002], [zt - 0.1, y - 0.012]], W * 0.9, BLACK, MAT.TRIM);
        for (const s of [-1, 1]) {
          b.box(s * W * 0.62, deckY + h / 2, zt, 0.02, h / 2, 0.045, BLACK, MAT.TRIM);
          b.box(s * (W * 0.9 + 0.012), y + 0.01, zt, 0.012, 0.065, 0.17, BLACK, MAT.TRIM);
        }
      } else {
        const path = [[-W * 0.86, deckY - 0.02], [-W * 0.86, deckY + h * 0.55], [-W * 0.8, deckY + h * 0.9], [-W * 0.66, deckY + h], [W * 0.66, deckY + h], [W * 0.8, deckY + h * 0.9], [W * 0.86, deckY + h * 0.55], [W * 0.86, deckY - 0.02]];
        const t = 0.018, ch = 0.11;
        const nrm = path.map((p, i) => {
          const a = path[Math.max(0, i - 1)], c = path[Math.min(path.length - 1, i + 1)];
          let nx = -(c[1] - a[1]), ny = c[0] - a[0];
          if (ny < 0 || (Math.abs(ny) < 1e-6 && nx * p[0] < 0)) { nx = -nx; ny = -ny; }
          const l = Math.hypot(nx, ny) || 1;
          return [nx / l, ny / l];
        });
        const V = (i, s, dz) => [path[i][0] + nrm[i][0] * t * s, path[i][1] + nrm[i][1] * t * s, zt + dz];
        for (let i = 0; i + 1 < path.length; i++) {
          const up = [nrm[i][0] + nrm[i + 1][0], nrm[i][1] + nrm[i + 1][1], 0];
          face([V(i, 1, -ch), V(i + 1, 1, -ch), V(i + 1, 1, ch), V(i, 1, ch)], up, PAINT, MAT.PAINT);
          face([V(i, -1, -ch), V(i + 1, -1, -ch), V(i + 1, -1, ch), V(i, -1, ch)], [-up[0], -up[1], 0], PAINT, MAT.PAINT);
          face([V(i, 1, -ch), V(i + 1, 1, -ch), V(i + 1, -1, -ch), V(i, -1, -ch)], [0, 0, -1], PAINT, MAT.PAINT);
          face([V(i, 1, ch), V(i + 1, 1, ch), V(i + 1, -1, ch), V(i, -1, ch)], [0, 0, 1], PAINT, MAT.PAINT);
        }
      }
    } else if (wing === 'whale') {
      const zw = Z(0.9), yw = skinAt(0.9);
      b.box(0, yw + 0.07, zw, W * 0.86, 0.03, 0.18, PAINT, MAT.PAINT);
      if (lod.deco) {
        for (const s of [-1, 1]) b.box(s * W * 0.84, yw + 0.045, zw, 0.03, 0.045, 0.16, PAINT, MAT.PAINT);
        b.box(0, yw + 0.105, zw + 0.172, W * 0.86, 0.012, 0.012, BLACK, MAT.TRIM);
      }
    }
    const scoop = (f0, f1, hw, hgt, lipCol) => {
      const z0 = Z(f0), z1 = Z(f1), y0 = skinAt(f0) - 0.01, y1 = skinAt(f1) - 0.01;
      prism([[z0, y0], [z1 + 0.1, y1], [z1, y1 + hgt], [z0, y0 + hgt]], hw, PAINT, MAT.PAINT);
      if (lod.deco > 1) b.quad([-hw * 0.85, y0 + 0.012, z0 - 0.003], [-hw * 0.85, y0 + hgt - 0.01, z0 - 0.003], [hw * 0.85, y0 + hgt - 0.01, z0 - 0.003], [hw * 0.85, y0 + 0.012, z0 - 0.003], lipCol, 0, null, [0, 0, -1]);
    };
    mark(PT.wing, wv0);
    vb = b.n;
    if (sh.scoop && lod.deco) scoop(sh.ws * 0.42, sh.ws * 0.78, 0.22, 0.055, DARK);
    if (hasHood) mark(PT.hood, vb);
    if (sh.snorkel && lod.deco) scoop(sh.rt - 0.06, sh.rt + 0.06, 0.12, 0.13, DARK);
    if (sh.ears && lod.deco) for (const s of [-1, 1]) b.box(s * (W * wideAt(0.8) * 0.99 + 0.045), sh.deck - 0.04, Z(0.8), 0.05, 0.08, 0.18, PAINT, MAT.PAINT);
    const spB = blue && blue.parts && blue.parts.spare;
    if ((sh.spare || spB) && lod.deco) {
      const r = wr * 0.95, cy = spB ? spB.y : yb + 0.6, z0 = zr + 0.02, z1 = zr + 0.22, n = lod.deco > 1 ? 14 : 8, X = v => (spB ? spB.s + v : v), vs = b.n;
      const cover = sh.spare === 'cover';
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        face([[X(c0 * r), cy + s0 * r, z0], [X(c1 * r), cy + s1 * r, z0], [X(c1 * r), cy + s1 * r, z1], [X(c0 * r), cy + s0 * r, z1]], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], cover ? PAINT : DARK, cover ? MAT.PAINT : 0);
        if (cover) face([[X(0), cy, z1], [X(c0 * r), cy + s0 * r, z1], [X(c1 * r), cy + s1 * r, z1]], [0, 0, 1], PAINT, MAT.PAINT);
        else {
          const k = 0.62;
          face([[X(c0 * r * k), cy + s0 * r * k, z1], [X(c1 * r * k), cy + s1 * r * k, z1], [X(c1 * r), cy + s1 * r, z1], [X(c0 * r), cy + s0 * r, z1]], [0, 0, 1], shade(DARK, 1.6), 0);
          face([[X(0), cy, z1 - 0.03], [X(c0 * r * k), cy + s0 * r * k, z1], [X(c1 * r * k), cy + s1 * r * k, z1]], [0, 0, 1], spB ? shade(PAINT, 0.55) : C('#5c6254'), spB ? MAT.PAINT : 0);
        }
      }
      if (spB) mark(PT.bumperR, vs);
    }
    if (hasHood && lod.step) {
      const f0 = 0.06, f1 = sh.ws - 0.01, bw = Math.min(edgeAt(f0), edgeAt(f1), W * wideAt(f0)) * 0.8;
      const sink = prof ? Math.min(0, crownAt(f0) * prof.domeK(f0), crownAt(f1) * prof.domeK(f1)) : 0;
      const yTop = (sink < 0 ? Math.min(topAt(f0), topAt(f1)) + sink : Math.min(skinAt(f0), skinAt(f1))) - 0.07, z0 = Z(f0), z1 = Z(f1);
      face([[-bw, yTop, z0], [bw, yTop, z0], [bw, yTop, z1], [-bw, yTop, z1]], [0, 1, 0], C('#1e1f22'), 0);
      if (lod.deco) {
        const zc = (z0 + z1) / 2, hz = (z1 - z0) * 0.28;
        b.box(-bw * 0.1, yTop + 0.03, zc + hz * 0.3, bw * 0.42, 0.03, hz, C('#4a4c50'), MAT.TRIM);
        b.box(bw * 0.55, yTop + 0.025, zc - hz * 0.4, 0.09, 0.025, 0.12, C('#2a2c30'), MAT.TRIM);
        face([[-bw * 0.9, yTop, z0 + 0.04], [bw * 0.9, yTop, z0 + 0.04], [bw * 0.9, yTop + 0.06, z0 + 0.04], [-bw * 0.9, yTop + 0.06, z0 + 0.04]], [0, 0, 1], C('#3a3a3c'), MAT.TRIM);
      }
    }
    const cab = cabinAt(car), eye = [cab.eye[0] === null ? -W * 0.4 : cab.eye[0], cab.eye[1], cab.eye[2]];
    const cabin = lod.deco > 1 ? new Batch(1024) : null;
    if (cabin) cabin.uvw = WHITE_UV;
    const floor = blue && blue.cabin && blue.cabin.floor;
    const cabinW = prof && (prof.waistAt || blue.parts && blue.parts.fenders) ? Math.min(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const f = sh.ws + (sh.rb + 0.1 / L - sh.ws) * i / 8; return prof.waistAt ? W * wideAt(f) * prof.waistAt(f) : W * wideAt(f); })) - 0.03 : null;
    if (cabin) interior(car, { Z, W, yb, eye, topAt, beltAt, edgeAt, floor, cabinW }, cabin);
    const wheels = [
      { x: -halfTrack(0, flare[0]), y: wr, z: zF, r: wr, front: true }, { x: halfTrack(0, flare[0]), y: wr, z: zF, r: wr, front: true },
      { x: -halfTrack(1, flare[1]), y: wr, z: zR, r: wr, front: false }, { x: halfTrack(1, flare[1]), y: wr, z: zR, r: wr, front: false }
    ];
    let skin = null;
    if (lod.deco > 1) {
      const aF = arches.map(a => ({ f0: fOfZ(a.z - Ra), f1: fOfZ(a.z + Ra), top: wr + Ra }));
      const beltY = f => Math.max(Math.min(beltAt(f), topAt(f) - 0.02), yb + 0.07);
      const sill = yb + 0.035, rA = aF[1].f0 - 0.012, fd0 = Math.max(sh.ws - 0.004, aF[0].f1 + 0.012);
      const ends = sh.van ? [fd0 + 0.95 / L] : gh.pillars.map(p => p.f);
      if (!sh.van && (!ends.length || ((sh.doors || 4) >= 4 && ends.length < 2))) ends.push(gh.end);
      const edgeLine = f => (f > rA ? [[rA, sill + 0.01], [rA, Math.min(beltY(f) - 0.03, aF[1].top + 0.03)], [f, beltY(f) - 0.004]] : [[f, sill + 0.01], [f, beltY(f) - 0.004]]);
      const last = ends[ends.length - 1];
      const gaps = [[[fd0, sill + 0.01], [fd0, beltY(fd0) - 0.004]], [[fd0, sill + 0.01], [Math.min(last, rA), sill + 0.01]]].concat(ends.map(edgeLine));
      const hx = f => Math.min(edgeAt(f), W * wideAt(f) * 0.97) * 0.86;
      const run = (f0, f1) => { const out = []; for (let f = f0; f < f1; f += 0.02) out.push(f); out.push(f1); return out; };
      const hood1 = sh.ws - 0.008;
      const seams = [-1, 1].map(sg => run(0.04, hood1).map(f => [f, sg * hx(f)]));
      seams.push([[hood1, -hx(hood1)], [hood1, hx(hood1)]]);
      if (!boxy && sh.rb < 0.9) {
        const t0 = sh.rb + 0.01;
        for (const sg of [-1, 1]) seams.push(run(t0, 0.975).map(f => [f, sg * hx(f)]));
        seams.push([[t0, -hx(t0)], [t0, hx(t0)]]);
      }
      const d1 = ends[0], pf = (fd0 + d1) / 2, pb = beltY(pf);
      const q1 = Math.min(ends.length > 1 ? ends[1] : rA, rA), qf = (d1 + q1) / 2;
      const ff = (aF[1].f0 + aF[1].f1) / 2, fy = beltY(ff) - 0.1, df = 0.055 / L;
      const hm = (0.04 + hood1) / 2, rm = (sh.wt + sh.rt) / 2;
      let h = 0;
      for (const ch of car.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const AB = 'ABCDEFGHJKLMNOPRSTUVZ';
      const words = String(car.model).split(' ').filter(w => w[0] !== '(');
      skin = {
        px: skinPx, frame: skinFrame, L, W, yb, hgt: sh.hgt, yLo, yHiE, belt: beltY, gaps, seams, grille: sh.grille,
        molding: boxy || sh.seats === 2 || car.cla ? null : { y: sill + (pb - sill) * 0.42, f0: aF[0].f1 + 0.008, f1: rA + 0.004, col: chromeTrim ? '#cfd3d8' : '#1b1b1d' },
        fuel: fy - 0.055 > aF[1].top + 0.02 ? [[ff - df, fy - 0.055], [ff + df, fy - 0.055], [ff + df, fy + 0.055], [ff - df, fy + 0.055]] : null,
        badge: [car.make.split('-')[0].toUpperCase(), words[0].length <= 2 && words[1] ? words[0] + ' ' + words[1] : words[0]],
        badgeY: band ? band.yB - 0.05 : Math.min(tailY - 0.1, rearTop - 0.06),
        badgeX: sh.modelBadge === 'left' ? [W * 0.55, -W * 0.55] : [-W * 0.55, W * 0.55],
        plate: AB[h % AB.length] + AB[(h >>> 5) % AB.length] + '-' + (100 + (h >>> 10) % 9900),
        number: 2 + (h >>> 3) % 97,
        panel: { f: pf, y: sill + (pb - sill) * 0.5, w: (d1 - fd0) * L * 100 - 14, h: (pb - sill) * 100 - 12 },
        panel2: (q1 - d1) * L > 0.72 ? { f: qf, y: sill + (beltY(qf) - sill) * 0.55 } : null,
        hood: (hood1 - 0.04) * L > 0.4 ? { f: hm, f0: 0.04, f1: hood1, len: (hood1 - 0.04) * L * 100, w: 2 * hx(hm) * 100, hw: hx(hm) } : null,
        roof: { f: rm, f0: sh.wt + 0.01, f1: sh.rt - 0.01, hw: edgeAt(rm) * 0.85 },
        swoosh: [[aF[0].f1 + 0.01, sill + 0.04], [rA, beltY(rA) - 0.16], [rA, beltY(rA) - 0.07], [aF[0].f1 + 0.01, sill + 0.13]]
      };
      if (blue) {
        const marks = F.Blueprints.items(blue, 'rear', 'badge');
        skin.car = car.id;
        skin.yHiE = Math.max(yHiF, yHiB);
        skin.fascia = fasciaPaint;
        if (marks.length) { skin.badgeY = marks[0].y; skin.badgeX = [marks[0].x, marks[1] ? marks[1].x : null]; }
        if (marks.length && marks[0].text) Object.assign(skin, { badge: [marks[0].text, marks[1] && marks[1].text ? marks[1].text : skin.badge[1]], badgeStyle: marks[0].style, badgeSize: marks[0].size, badgeW: marks[0].w });
        if (marks[1] && marks[1].text) Object.assign(skin, { badgeStyle2: marks[1].style, badgeSize2: marks[1].size, badgeW2: marks[1].w });
        const mos = [].concat(blue.molding || []).map(mo => ({ y: mo.y, y0: mo.y0, y1: mo.y1, f0: mo.x0 / L, f1: mo.x1 / L, col: mo.col || (chromeTrim ? '#cfd3d8' : '#1b1b1d'), w: mo.w, edge: mo.edge, edgeY: mo.edgeY }));
        if (mos.length || blue.molding) skin.molding = mos[0] || null;
        if (mos.length > 1) skin.trims = mos.slice(1);
        if (blue.taxi) { const tx = blue.taxi; skin.taxi = { f0: tx.x0 / L, f1: tx.x1 / L, y0: tx.y0, sq: tx.sq, text: tx.text / L, textY: tx.textY }; }
        if (blue.fuel === false) skin.fuel = null;
        if (blue.fuel) {
          const q = blue.fuel, f0 = (q.x - q.w / 2) / L, f1 = (q.x + q.w / 2) / L, y0 = q.y - q.h / 2, y1 = q.y + q.h / 2;
          skin.fuel = [[f0, y0], [f1, y0], [f1, y1], [f0, y1]];
          if (q.side) skin.fuelSide = q.side;
          if (q.round) skin.fuelRound = true;
        }
        if (blue.vents) skin.vents = blue.vents.map(v => Object.assign({ where: v.where, p: v.x / L, q: v.where === 'S' ? v.y : v.s, w: v.w * 100, h: v.h * 100, n: v.n }, v.across ? { across: true } : {}, v.bg ? { bg: v.bg, col: v.col } : {}));
        if (blue.doors) {
          const rect = (dr, side) => { const k = side ? 1 / L : 1; if (dr.pts) return dr.pts.map(q => [q[0] * k, q[1]]); const a = dr.x[0] * k, c = dr.x[1] * k; return [[a, dr.y[0]], [c, dr.y[0]], [c, dr.y[1]], [a, dr.y[1]], [a, dr.y[0]]]; };
          skin.gaps = blue.doors.filter(dr => dr.side === 'both').map(dr => rect(dr, true));
          skin.lines = blue.doors.filter(dr => dr.side !== 'both').map(dr => ({ where: dr.side, pts: rect(dr, dr.side !== 'B') }));
        }
        if (blue.panel) {
          const pp = blue.panel;
          skin.panel = { f: pp.x / L, y: pp.y, w: pp.w * 100 - 14, h: pp.h * 100 - 12 };
          skin.panel2 = blue.panel2 ? { f: blue.panel2.x / L, y: blue.panel2.y } : null;
        }
        if (blue.band) skin.band = { lo: blue.band.lo, hi: blue.band.hi, nose: blue.band.nose, ws: sh.ws, text: blue.band.text / L, textW: blue.band.textW * 100, cross: blue.band.cross / L, door: blue.band.door / L };
        skin.texts = (blue.texts || []).map(t => ({ where: t.where, p: t.where === 'F' || t.where === 'B' ? t.s : t.x / L, q: t.where === 'T' ? t.s : t.y, text: t.text, size: t.size, col: t.col, style: t.style, maxW: t.maxW }));
      }
    }
    bakeAO(b, { yb, W, wr, Ra, arches });
    let cut = null, gOff = 0;
    if (gb) {
      const base = b.ni;
      if (cabin && wiper) {
        appendBatch(b, cabin);
        const cEnd = b.ni;
        appendBatch(b, wiper.rest);
        const wEnd = b.ni;
        gOff = b.n;
        appendBatch(b, gb);
        const idx = b.idx, wip = idx.slice(cEnd, wEnd), body = idx.slice(0, base), cab = idx.slice(base, cEnd);
        idx.set(wip, 0);
        idx.set(body, wip.length);
        idx.set(cab, wip.length + body.length);
        cut = { w: wip.length, b: wip.length + body.length, c: wEnd, g: b.ni };
      } else {
        gOff = b.n;
        appendBatch(b, gb);
        cut = { w: 0, b: base, c: base, g: b.ni };
      }
    }
    const tagArr = new Uint8Array(b.n);
    for (const [p, v0, v1] of tags) tagArr.fill(p, v0, v1);
    for (const [p, v0, v1] of gtags) tagArr.fill(p, v0 + gOff, v1 + gOff);
    const dmgInfo = {
      hood: hasHood ? { y: skinAt(sh.ws), z: Z(sh.ws) } : null,
      trunk: door ? { y: skinAt(door), z: Z(door) } : hasTrunk ? { y: skinAt(sh.rb), z: Z(sh.rb) } : null,
      bumperF: { x: xeF, y: yBar, z: zcF }, bumperR: { x: xeR, y: yBarR, z: zcR },
      screen: { x: Math.min(edgeAt((sh.ws + sh.wt) / 2), W) * 0.9, y0: skinAt(sh.ws), z0: Z(sh.ws), y1: skinAt(sh.wt), z1: Z(sh.wt) }
    };
    return { batch: b, glass: gb, cabin, cut, lamp, skin, wiper, wheels, lightsF, lightsR, lightsB, eye, len: L, wid: sh.wid, hgt: sh.hgt, S, Z, W, yb, exhaust: [tips[0], tipY, tipZ], shape: { topAt, beltAt, wideAt, edgeAt }, tags: tagArr, dmgInfo, floor, cabinW };
  }

  function buildWheel(car, o = {}) {
    const kind = o.kind || 'sharp';
    const tread = o.tread || treadOf(car, 0);
    const d = wheelDims(car, tread, o.rear), rim = RIMS[d.style];
    const { R, w, rr, rb, xf } = d;
    const far = kind === 'far', sharp = kind === 'sharp';
    const n = far ? 10 : 16;
    const b = new Batch(far ? 128 : 640);
    b.uvw = WHITE_UV;
    const retro = d.style === 'retro', steel = d.style === 'steel' || d.style === 'cap' || d.style === 'hubcap';
    const faceCol = retro ? PAINT : car.rim ? C(car.rim) : steel ? STEEL : ALLOY;
    const faceMat = retro ? MAT.PAINT : 0;
    const plainLip = steel || retro || d.style === 'cover';
    const lipCol = plainLip ? faceCol : CHROME, lipMat = plainLip ? faceMat : MAT.CHROME;
    const pt = (x, r, a) => [x, Math.cos(a) * r, Math.sin(a) * r];
    const nr = (nx, nq, a) => { const l = Math.hypot(nx, nq) || 1; return [nx / l, Math.cos(a) * nq / l, Math.sin(a) * nq / l]; };
    const band = (p0, p1, n0, n1, col, mat, uv) => {
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
        orientedFace(b, [pt(p0[0], p0[1], a0), pt(p1[0], p1[1], a0), pt(p1[0], p1[1], a1), pt(p0[0], p0[1], a1)],
          [nr(n0[0], n0[1], a0), nr(n1[0], n1[1], a0), nr(n1[0], n1[1], a1), nr(n0[0], n0[1], a1)], col, mat,
          uv && [[uv[0], uv[1]], [uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]]]);
      }
    };
    const fan = (x, r, sgn, col, mat, segs = n) => {
      for (let i = 0; i < segs; i++) {
        const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2;
        flatFace(b, [[x, 0, 0], pt(x, r, a0), pt(x, r, a1)], [sgn, 0, 0], col, mat);
      }
    };
    const hole = (x, rho, a, r, col) => {
      const cy = Math.cos(a) * rho, cz = Math.sin(a) * rho;
      for (let i = 0; i < 6; i++) {
        const t0 = i / 6 * Math.PI * 2, t1 = (i + 1) / 6 * Math.PI * 2;
        flatFace(b, [[x, cy, cz], [x, cy + Math.cos(t0) * r, cz + Math.sin(t0) * r], [x, cy + Math.cos(t1) * r, cz + Math.sin(t1) * r]], [1, 0, 0], col, 0);
      }
    };
    const dome = (x, r, h, col, mat) => {
      band([x, r], [x + h, r * 0.55], [0.35, 1], [0.9, 0.45], col, mat);
      fan(x + h, r * 0.55, 1, col, mat, 10);
    };
    const spoke = (a, tw, r0, r1, h0, h1, x0, x1, col, mat) => {
      const A = pt(x0, r0, a - h0), B = pt(x0, r0, a + h0), Q = pt(x1, r1, a + tw + h1), D = pt(x1, r1, a + tw - h1);
      const back = p => [p[0] - 0.016, p[1], p[2]];
      const m0 = a + tw / 2 - (h0 + h1) / 2, m1 = a + tw / 2 + (h0 + h1) / 2;
      flatFace(b, [A, B, Q, D], [1, 0, 0], col, mat);
      flatFace(b, [A, D, back(D), back(A)], [0, Math.sin(m0), -Math.cos(m0)], col, mat);
      flatFace(b, [B, Q, back(Q), back(B)], [0, -Math.sin(m1), Math.cos(m1)], col, mat);
    };
    const s = Math.min(0.035, w * 0.16);
    const cell = TREAD_UV[tread];
    const e = 0.5 / SKIN.size, tuv = sharp && cell ? [cell[0] + e, cell[1] + e, cell[0] + CELL - e, cell[1] + CELL - e] : null;
    const mix = k => [0, 1, 2].map(i => k > 1 ? faceCol[i] : Math.round(faceCol[i] * k + (DISC[i] + HOLE[i]) / 2 * (1 - k))).concat([255]);
    const blurFace = x => {
      if (far) band([x, rb], [x - 0.004, rb * 0.32], [1, 0], [1, 0], mix(rim.cover + 0.1), faceMat);
      else {
        band([x, rb], [x - 0.002, rb * 0.68], [1, 0], [1, 0], mix(rim.cover), faceMat);
        band([x - 0.002, rb * 0.68], [x - 0.004, rb * 0.32], [1, 0], [1, 0], mix(Math.min(1, rim.cover + 0.25)), faceMat);
      }
      fan(x - 0.004, rb * 0.32, 1, retro || steel ? CHROME : faceCol, retro || steel ? MAT.CHROME : faceMat, 10);
    };
    band([-w / 2 + s, R], [w / 2 - s, R], [0, 1], [0, 1], TIRE, 0, tuv);
    if (far) {
      band([w / 2 - s, R], [w / 2 - 0.01, rb], [1, 0.3], [1, 0], WALL, 0);
      blurFace(w / 2 - 0.012);
      fan(-w / 2 + s, R, -1, WALL, 0);
      return b;
    }
    band([w / 2 - s, R], [w / 2, R - s], [0, 1], [1, 0.25], TIRE, 0);
    band([-w / 2 + s, R], [-w / 2, R - s], [0, 1], [-1, 0.25], TIRE, 0);
    band([w / 2, R - s], [w / 2 + 0.008, (R - s + rr) / 2], [1, 0.3], [1, 0], WALL, 0);
    band([w / 2 + 0.008, (R - s + rr) / 2], [w / 2 - 0.004, rr], [1, 0], [1, -0.2], WALL, 0);
    fan(-w / 2, R - s, -1, WALL, 0, 10);
    band([w / 2 - 0.004, rr], [w / 2 - 0.012, rb], [0.6, 1], [1, -0.3], lipCol, lipMat);
    if (!sharp) {
      band([w / 2 - 0.012, rb], [xf, rb], [0, -1], [0, -1], BARREL, 0);
      blurFace(xf);
      return b;
    }
    band([w / 2 - 0.012, rb], [xf - 0.075, rb], [0, -1], [0, -1], BARREL, 0);
    fan(xf - 0.075, rb, 1, HOLE, 0, 10);
    const hub = (r, x = xf - 0.01) => {
      fan(x, r, 1, faceCol, faceMat, 10);
      fan(x + 0.004, r * 0.42, 1, CHROME, MAT.CHROME, 8);
    };
    switch (d.style) {
      case 'five':
        for (let k = 0; k < 5; k++) spoke(k * Math.PI * 2 / 5, 0, rb * 0.26, rb * 0.98, 0.4, 0.15, xf - 0.012, xf, faceCol, faceMat);
        hub(rb * 0.3);
        break;
      case 'multi':
        for (let k = 0; k < 6; k++) for (const sg of [-1, 1]) spoke(k * Math.PI / 3 + sg * 0.11, 0, rb * 0.28, rb * 0.98, 0.07, 0.045, xf - 0.012, xf, faceCol, faceMat);
        hub(rb * 0.32);
        break;
      case 'mesh':
        for (let k = 0; k < 6; k++) {
          spoke(k * Math.PI / 3, 0.52, rb * 0.3, rb * 0.95, 0.05, 0.03, xf - 0.008, xf - 0.002, faceCol, faceMat);
          spoke(k * Math.PI / 3 + Math.PI / 6, -0.52, rb * 0.3, rb * 0.95, 0.05, 0.03, xf - 0.012, xf - 0.006, faceCol, faceMat);
        }
        band([xf, rb * 0.99], [xf, rb * 0.87], [1, 0], [1, 0], faceCol, faceMat);
        hub(rb * 0.34, xf - 0.006);
        break;
      case 'pepper': case 'dish': {
        const holes = d.style === 'pepper' ? [10, 0.62, 0.085] : [5, 0.57, 0.16];
        band([xf, rb], [xf - 0.006, rb * 0.24], [1, 0], [1, 0], faceCol, faceMat);
        for (let k = 0; k < holes[0]; k++) hole(xf + 0.002, rb * holes[1], k * Math.PI * 2 / holes[0], rb * holes[2], HOLE);
        hub(rb * 0.24, xf - 0.004);
        break;
      }
      case 'steel':
        band([xf, rb], [xf, rb * 0.7], [1, 0], [1, 0], faceCol, faceMat);
        band([xf, rb * 0.7], [xf + 0.012, rb * 0.36], [1, 0.4], [1, 0.1], faceCol, faceMat);
        for (let k = 0; k < 6; k++) hole(xf + 0.009, rb * 0.52, k * Math.PI / 3 + Math.PI / 6, rb * 0.06, HOLE);
        dome(xf + 0.012, rb * 0.36, 0.014, CHROME, MAT.CHROME);
        break;
      case 'cap':
        band([xf, rb], [xf, rb * 0.84], [1, 0], [1, 0], faceCol, faceMat);
        band([xf, rb * 0.84], [xf + 0.01, rb * 0.66], [1, 0.4], [1, 0.1], faceCol, faceMat);
        dome(xf + 0.01, rb * 0.66, 0.034, CHROME, MAT.CHROME);
        break;
      case 'aerodisc':
        band([xf, rb], [xf + 0.006, rb * 0.9], [1, 0.3], [1, 0.1], faceCol, faceMat);
        band([xf + 0.006, rb * 0.9], [xf + 0.01, rb * 0.25], [1, 0.1], [1, 0.05], faceCol, faceMat);
        for (let k = 0; k < 12; k++) hole(xf + 0.0095, rb * 0.8, k * Math.PI / 6, rb * 0.055, HOLE);
        fan(xf + 0.01, rb * 0.25, 1, shade(faceCol, 0.85), faceMat, 10);
        break;
      case 'speedline':
        band([xf, rb], [xf - 0.004, rb * 0.3], [1, 0], [1, 0], faceCol, faceMat);
        for (let k = 0; k < 16; k++) hole(xf + 0.002, rb * 0.68, k * Math.PI / 8, rb * 0.075, HOLE);
        hub(rb * 0.22, xf - 0.002);
        break;
      case 'hubcap':
        band([xf, rb], [xf, rb * 0.9], [1, 0], [1, 0], faceCol, faceMat);
        band([xf, rb * 0.9], [xf + 0.014, rb * 0.6], [1, 0.45], [1, 0.15], CHROME, MAT.CHROME);
        dome(xf + 0.014, rb * 0.6, 0.026, CHROME, MAT.CHROME);
        break;
      case 'hollow':
        for (let k = 0; k < 5; k++) {
          spoke(k * Math.PI * 2 / 5, 0, rb * 0.28, rb * 0.98, 0.36, 0.14, xf - 0.012, xf, faceCol, faceMat);
          spoke(k * Math.PI * 2 / 5, 0, rb * 0.42, rb * 0.9, 0.07, 0.03, xf + 0.001, xf + 0.001, shade(faceCol, 0.55), faceMat);
        }
        hub(rb * 0.3);
        dome(xf + 0.004, rb * 0.12, 0.02, CHROME, MAT.CHROME);
        break;
      case 'cross':
        for (let k = 0; k < 10; k++) {
          spoke(k * Math.PI / 5, 0.62, rb * 0.36, rb * 0.93, 0.036, 0.02, xf - 0.008, xf - 0.002, faceCol, faceMat);
          spoke(k * Math.PI / 5 + Math.PI / 10, -0.62, rb * 0.36, rb * 0.93, 0.036, 0.02, xf - 0.012, xf - 0.006, faceCol, faceMat);
        }
        fan(xf - 0.004, rb * 0.38, 1, faceCol, faceMat, 8);
        roundel(b, [xf, 0, 0], [0, 0, -1], [0, 1, 0], rb * 0.2, 8);
        break;
      case 'cover':
        band([xf, rb], [xf + 0.008, rb * 0.8], [1, 0.3], [1, 0.1], faceCol, faceMat);
        band([xf + 0.008, rb * 0.8], [xf + 0.016, rb * 0.3], [1, 0.2], [1, 0.05], faceCol, faceMat);
        for (let k = 0; k < 8; k++) hole(xf + 0.0145, rb * 0.58, k * Math.PI / 4 + Math.PI / 8, rb * 0.1, HOLE);
        fan(xf + 0.016, rb * 0.3, 1, faceCol, faceMat, 10);
        fan(xf + 0.018, rb * 0.13, 1, shade(faceCol, 0.8), faceMat, 8);
        break;
      default:
        band([xf, rb], [xf, rb * 0.6], [1, 0], [1, 0], faceCol, faceMat);
        band([xf + 0.002, rb * 0.97], [xf + 0.002, rb * 0.86], [1, 0], [1, 0], CHROME, MAT.CHROME);
        dome(xf, rb * 0.62, 0.04, CHROME, MAT.CHROME);
        break;
    }
    return b;
  }

  function buildBrake(car, red) {
    const { rb, xf } = wheelDims(car, treadOf(car, 0));
    const b = new Batch(128);
    b.uvw = WHITE_UV;
    const n = 16, pt = (x, r, a) => [x, Math.cos(a) * r, Math.sin(a) * r];
    const xd = xf - 0.05;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      flatFace(b, [pt(xd, rb * 0.3, a0), pt(xd, rb * 0.84, a0), pt(xd, rb * 0.84, a1), pt(xd, rb * 0.3, a1)], [1, 0, 0], DISC, 0);
    }
    const col = red ? CALIPER_RED : CALIPER;
    const x0 = xf - 0.02, x1 = xf - 0.07, r0 = rb * 0.62, r1 = rb * 0.97, segs = 4, span = 0.5;
    for (let i = 0; i < segs; i++) {
      const a0 = -span + i / segs * span * 2, a1 = -span + (i + 1) / segs * span * 2, am = (a0 + a1) / 2;
      flatFace(b, [pt(x0, r0, a0), pt(x0, r1, a0), pt(x0, r1, a1), pt(x0, r0, a1)], [1, 0, 0], col, 0);
      flatFace(b, [pt(x0, r1, a0), pt(x1, r1, a0), pt(x1, r1, a1), pt(x0, r1, a1)], [0, Math.cos(am), Math.sin(am)], col, 0);
      flatFace(b, [pt(x0, r0, a0), pt(x1, r0, a0), pt(x1, r0, a1), pt(x0, r0, a1)], [0, -Math.cos(am), -Math.sin(am)], col, 0);
    }
    for (const a of [-span, span]) flatFace(b, [pt(x0, r0, a), pt(x0, r1, a), pt(x1, r1, a), pt(x1, r0, a)], [0, -Math.sin(a) * Math.sign(a), Math.cos(a) * Math.sign(a)], col, 0);
    return b;
  }

  const COCK = {
    su: { dash: '#3a2e28', trim: '#241c18', roof: '#a49c8c', face: 'su', form: 'flat', floor: '#2a2420', seat: '#4e3c30', wheel: { r: 0.2, tube: 0.016, spokes: [-15, 195], pad: 0.045, rim: '#171615' } },
    eu: { dash: '#1e1e20', trim: '#141416', roof: '#7a7874', face: 'eu', form: 'wrap', floor: '#1a1a1c', seat: '#2c2c30', wheel: { r: 0.19, tube: 0.018, spokes: [-30, 210, 5, 175], pad: 0.07, rim: '#141414' } },
    jp: { dash: '#26282c', trim: '#1a1c1e', roof: '#94948e', face: 'jp', form: 'visor', floor: '#1e1f22', seat: '#303238', wheel: { r: 0.185, tube: 0.017, spokes: [0, 180, 270], pad: 0.065, rim: '#151515' } },
    us: { dash: '#2c2420', trim: '#1c1614', roof: '#968a78', face: 'us', form: 'wide', floor: '#2a221e', seat: '#3c2c24', wheel: { r: 0.21, tube: 0.012, spokes: [0, 180, 270], pad: 0.04, rim: '#6a3c1c', ring: true } },
    it: { dash: '#161616', trim: '#0e0e0e', roof: '#44403c', face: 'it', form: 'low', floor: '#141414', seat: '#1e1e1e', wheel: { r: 0.175, tube: 0.019, spokes: [0, 180, 270], pad: 0.055, rim: '#121212' } },
    retro: { dash: 'paint', trim: '#2a2420', roof: '#bcb4a2', face: 'retro', form: 'metal', floor: '#2e2620', seat: '#5a3a2a', wheel: { r: 0.22, tube: 0.011, spokes: [-12, 192], pad: 0.035, rim: '#e8dcc0', ring: true } }
  };
  F.COCK = COCK;

  function cockOf(car) {
    const base = COCK[car.cock] || COCK.eu, blue = F.Blueprints.of(car), c = blue && blue.cabin;
    if (!c || !c.style) return base;
    return Object.assign({}, base, c.style, { wheel: Object.assign({}, base.wheel, c.style.wheel) });
  }

  function coverOf(car) {
    const blue = F.Blueprints.of(car);
    return (blue && blue.cabin && blue.cabin.cover) || null;
  }

  const v3 = {
    add: (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
    sub: (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2],
    cross: (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]]
  };

  function slab(b, c, ax, ay, az, col, mat = 0) {
    const A = [ax, ay, az];
    const P = s => [0, 1, 2].map(i => c[i] + ax[i] * s[0] + ay[i] * s[1] + az[i] * s[2]);
    for (let k = 0; k < 3; k++) {
      const i = (k + 1) % 3, j = (k + 2) % 3;
      for (const sg of [-1, 1]) {
        const corner = (u, w) => { const s = [0, 0, 0]; s[k] = sg; s[i] = u; s[j] = w; return P(s); };
        flatFace(b, [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)], v3.mul(A[k], sg), col, mat);
      }
    }
  }

  function torus(b, R, r, nu, nv, col, mat, z0 = 0, from = 0, to = Math.PI * 2) {
    const P = (u, v) => [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), z0 + r * Math.sin(v)];
    const N = (u, v) => [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)];
    for (let i = 0; i < nu; i++) {
      const u0 = from + (to - from) * i / nu, u1 = from + (to - from) * (i + 1) / nu;
      for (let j = 0; j < nv; j++) {
        const w0 = j / nv * Math.PI * 2, w1 = (j + 1) / nv * Math.PI * 2;
        orientedFace(b, [P(u0, w0), P(u1, w0), P(u1, w1), P(u0, w1)], [N(u0, w0), N(u1, w0), N(u1, w1), N(u0, w1)], col, mat);
      }
    }
  }

  function buildCockpit(car, geo) {
    const sh = car.sh, W = geo.W, Z = geo.Z, S = geo.shape, L = sh.len;
    const st = cockOf(car), cover = coverOf(car);
    const b = new Batch(2048);
    b.uvw = [0.2, 0.2];
    const paint = st.dash === 'paint';
    const dashCol = paint ? PAINT : C(st.dash), dashMat = paint ? MAT.PAINT : 0;
    const trim = C(st.trim), floorCol = C(st.floor), seatCol = C(st.seat), roofCol = C(st.roof);
    const eye = geo.eye, ex = eye[0], ey = eye[1], ez = eye[2];
    const fOf = z => F.clamp((z + L / 2) / L, 0, 1);
    const zA = Z(sh.ws), zH = Z(sh.wt), zC = Z(sh.rt), zB = Z(sh.rb);
    const yF = geo.floor ? geo.floor - 0.02 : geo.yb + 0.06, Wi = geo.cabinW || W * 0.9, center = sh.seat === 'center';
    const sw = st.wheel, R = sw.r, van = !!(sh.van || sh.suv);
    const alpha = van ? 0.62 : R > 0.2 ? 0.36 : 0.42;
    const wc = [ex, ey - (van ? 0.32 : 0.28), ez - 0.42];
    const uw = [0, Math.cos(alpha), -Math.sin(alpha)];
    const yDt = Math.max(sh.hood + 0.04, ey - 0.45) - (st.form === 'low' ? 0.03 : 0);
    const zDr = wc[2] - 0.17;
    const yK = Math.max(yF + 0.25, wc[1] - 0.24);
    const Wd = Wi + 0.02;

    const prof = {
      flat: [[zA + 0.02, yDt - 0.015], [zDr - 0.025, yDt], [zDr, yDt - 0.025], [zDr, yK + 0.03], [zDr - 0.03, yK], [zDr - 0.28, yF + 0.12], [zA + 0.12, yF]],
      wrap: [[zA + 0.02, yDt - 0.015], [zDr - 0.12, yDt + 0.005], [zDr - 0.04, yDt - 0.015], [zDr, yDt - 0.06], [zDr + 0.012, yK + 0.09], [zDr - 0.03, yK], [zDr - 0.3, yF + 0.1], [zA + 0.12, yF]],
      visor: [[zA + 0.02, yDt - 0.015], [zDr - 0.03, yDt], [zDr, yDt - 0.03], [zDr + 0.008, yK + 0.06], [zDr - 0.03, yK], [zDr - 0.28, yF + 0.12], [zA + 0.12, yF]],
      wide: [[zA + 0.02, yDt - 0.015], [zDr - 0.02, yDt + 0.01], [zDr, yDt - 0.02], [zDr, yK + 0.03], [zDr - 0.02, yK], [zDr - 0.26, yF + 0.12], [zA + 0.12, yF]],
      low: [[zA + 0.02, yDt - 0.015], [zDr - 0.1, yDt], [zDr - 0.03, yDt - 0.02], [zDr, yDt - 0.06], [zDr + 0.01, yK + 0.07], [zDr - 0.04, yK], [zDr - 0.3, yF + 0.1], [zA + 0.12, yF]],
      metal: [[zA + 0.02, yDt - 0.015], [zDr - 0.012, yDt], [zDr, yDt - 0.012], [zDr, yK + 0.02], [zDr - 0.02, yK], [zDr - 0.24, yF + 0.14], [zA + 0.12, yF]]
    }[st.form] || [];
    for (let i = 0; i + 1 < prof.length; i++) {
      const p = prof[i], q = prof[i + 1];
      const lower = i >= prof.length - 3;
      flatFace(b, [[-Wd, p[1], p[0]], [Wd, p[1], p[0]], [Wd, q[1], q[0]], [-Wd, q[1], q[0]]], [0, q[0] - p[0], -(q[1] - p[1])], lower ? shade(dashCol, 0.62) : dashCol, dashMat);
    }
    if (st.form === 'wide') flatFace(b, [[-Wd, yDt - 0.1, zDr + 0.003], [Wd, yDt - 0.1, zDr + 0.003], [Wd, yDt - 0.13, zDr + 0.003], [-Wd, yDt - 0.13, zDr + 0.003]], [0, 0, 1], C('#7a4a26'), 0);
    if (st.form === 'metal') flatFace(b, [[-Wd, yDt - 0.028, zDr + 0.004], [Wd, yDt - 0.028, zDr + 0.004], [Wd, yDt - 0.042, zDr + 0.004], [-Wd, yDt - 0.042, zDr + 0.004]], [0, 0, 1], CHROME, MAT.CHROME);
    if (st.strip) flatFace(b, [[-Wd, yDt + st.strip[0], zDr + 0.004], [Wd, yDt + st.strip[0], zDr + 0.004], [Wd, yDt + st.strip[1], zDr + 0.004], [-Wd, yDt + st.strip[1], zDr + 0.004]], [0, 0, 1], CHROME, MAT.CHROME);

    const onWheel = (du, dx) => [wc[0] + dx, wc[1] + uw[1] * du, wc[2] + uw[2] * du];
    const hit = (target, q, n) => { const d = v3.sub(target, eye); return v3.add(eye, v3.mul(d, v3.dot(v3.sub(q, eye), n) / v3.dot(d, n))); };
    const rho = R - sw.tube - 0.006, u0 = Math.max(0.25 * R, sw.pad * 0.8 + 0.012);
    let bb = 0.01;
    for (let t = 0.01; t < R; t += 0.002) {
      const uc = u0 + t;
      let fits = true;
      for (let k = 0; k < 24 && fits; k++) {
        const th = k / 24 * Math.PI * 2;
        if ((2 * t * Math.cos(th)) ** 2 + (uc + t * Math.sin(th)) ** 2 > rho * rho) fits = false;
      }
      if (!fits) break;
      bb = t;
    }
    const ucen = u0 + bb, zG = zDr + 0.04, central = st.cluster === 'center';
    const mid = central ? [0, yDt - 0.055, zDr + 0.03] : hit(onWheel(ucen, 0), [0, 0, zG], [0, 0, 1]);
    const nf = unit(v3.sub(eye, mid));
    const rf = unit([nf[2], 0, -nf[0]]);
    const uf = v3.cross(nf, rf);
    const proj = p => hit(p, mid, nf);
    const top = proj(onWheel(ucen + bb, 0)), bot = proj(onWheel(ucen - bb, 0));
    const hh = central ? 0.052 : v3.dot(v3.sub(top, bot), uf) / 2;
    const hw = central ? 0.103 : v3.dot(v3.sub(proj(onWheel(ucen, 2 * bb)), proj(onWheel(ucen, -2 * bb))), rf) / 2;
    const gc = central ? mid : v3.add(mid, v3.mul(uf, (v3.dot(v3.sub(top, mid), uf) + v3.dot(v3.sub(bot, mid), uf)) / 2));
    const at = (x, y, z = 0) => v3.add(v3.add(v3.add(gc, v3.mul(rf, x)), v3.mul(uf, y)), v3.mul(nf, z));
    const shiny = st.form === 'metal' || st.bezel === 'chrome', bezel = shiny ? CHROME : shade(trim, 0.9), bezelMat = shiny ? MAT.CHROME : 0;
    const fx = hw + 0.022, fy = hh + 0.018;
    for (const [a0, a1, c0, c1] of [[-fx, fx, hh, fy], [-fx, fx, -fy, -hh], [-fx, -hw, -hh, hh], [hw, fx, -hh, hh]]) {
      flatFace(b, [at(a0, c0, -0.002), at(a1, c0, -0.002), at(a1, c1, -0.002), at(a0, c1, -0.002)], nf, bezel, bezelMat);
    }
    if (st.form !== 'metal' && !central) {
      const deep = st.form === 'visor' ? 0.11 : 0.07;
      slab(b, at(0, fy + 0.01, deep / 2 - 0.02), v3.mul(rf, fx + 0.012), v3.mul(uf, 0.012), v3.mul(nf, deep / 2 + 0.02), trim);
      for (const sg of [-1, 1]) slab(b, at(sg * (fx + 0.004), 0.005, deep / 2 - 0.02), v3.mul(rf, 0.01), v3.mul(uf, fy + 0.008), v3.mul(nf, deep / 2 + 0.02), trim);
    }
    slab(b, at(0, 0, -0.06), v3.mul(rf, fx + 0.01), v3.mul(uf, fy + 0.012), v3.mul(nf, 0.055), shade(dashCol, 0.8), dashMat);
    b.beam([ex, wc[1] - 0.05, zDr - 0.02], [ex, wc[1] - 0.012, wc[2] - 0.05], 0.03, trim, 0);

    const tunnelH = st.form === 'low' ? 0.3 : 0.17;
    if (!center) {
      if (!central) {
        const sy = (yDt - 0.05 + yK) / 2, sh2 = (yDt - 0.05 - yK) / 2;
        slab(b, [0, sy, zDr + 0.02], [0.14, 0, 0], [0, sh2, 0], [0, 0, 0.03], shade(dashCol, 0.85), dashMat);
        for (const sg of [-1, 1]) flatFace(b, [[sg * 0.02, yDt - 0.1, zDr + 0.052], [sg * 0.12, yDt - 0.1, zDr + 0.052], [sg * 0.12, yDt - 0.06, zDr + 0.052], [sg * 0.02, yDt - 0.06, zDr + 0.052]], [0, 0, 1], DARK, 0);
        flatFace(b, [[-0.1, yDt - 0.2, zDr + 0.052], [0.1, yDt - 0.2, zDr + 0.052], [0.1, yDt - 0.14, zDr + 0.052], [-0.1, yDt - 0.14, zDr + 0.052]], [0, 0, 1], GRILL, 0);
      }
      if (cover) b.box(0, yF + cover.h / 2, zDr + cover.len / 2, cover.w / 2, cover.h / 2, cover.len / 2, C(cover.col), 0);
      else slab(b, [0, yF + tunnelH / 2, (zDr + ez) / 2 + 0.1], [0.12, 0, 0], [0, tunnelH / 2, 0], [0, 0, (ez - zDr) / 2 + 0.25], shade(floorCol, 1.25));
    }
    flatFace(b, [[-Wi, yF, zA + 0.08], [Wi, yF, zA + 0.08], [Wi, yF, ez + 1.3], [-Wi, yF, ez + 1.3]], [0, 1, 0], floorCol, 0);

    const zs = [zA - 0.05, (zA + ez) / 2, ez, (ez + zB) / 2, zB - 0.05];
    for (const s of [-1, 1]) {
      for (let i = 0; i + 1 < zs.length; i++) {
        const za = zs[i], zb2 = zs[i + 1];
        const ya = S.beltAt(fOf(za)) - 0.012, yb2 = S.beltAt(fOf(zb2)) - 0.012;
        const ma = yF + (ya - yF) * 0.45, mb = yF + (yb2 - yF) * 0.45;
        flatFace(b, [[s * Wi, yF, za], [s * Wi, yF, zb2], [s * Wi, mb, zb2], [s * Wi, ma, za]], [-s, 0, 0], shade(trim, 1.05), 0);
        flatFace(b, [[s * Wi, ma, za], [s * Wi, mb, zb2], [s * Wi, yb2, zb2], [s * Wi, ya, za]], [-s, 0, 0], shade(trim, 1.4), 0);
        flatFace(b, [[s * Wi, ya, za], [s * Wi, yb2, zb2], [s * (Wi - 0.05), yb2 + 0.01, zb2], [s * (Wi - 0.05), ya + 0.01, za]], [0, 1, 0], trim, 0);
      }
      const xs = s * (Wi - 0.035);
      b.box(xs, ey - 0.4, ez - 0.2, 0.035, 0.028, 0.24, shade(trim, 1.25), 0);
      b.box(s * (Wi - 0.014), ey - 0.3, ez - 0.46, 0.012, 0.012, 0.04, C('#7c7e82'), 0);
      for (let i = 0; i < 8; i++) {
        const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2, cy = yF + 0.19, cz = zA + 0.38;
        flatFace(b, [[s * (Wi - 0.002), cy, cz], [s * (Wi - 0.002), cy + Math.cos(a0) * 0.07, cz + Math.sin(a0) * 0.07], [s * (Wi - 0.002), cy + Math.cos(a1) * 0.07, cz + Math.sin(a1) * 0.07]], [-s, 0, 0], GRILL, 0);
      }
      b.beam([s * W * S.wideAt(sh.ws) * 0.92, S.beltAt(sh.ws) + 0.02, zA + 0.05], [s * S.edgeAt(sh.wt) * 0.93, S.topAt(sh.wt) - 0.04, zH + 0.02], 0.028, trim, 0);
      const zBp = Math.min(ez + 0.3, zC - 0.03), fB = fOf(zBp);
      b.beam([s * Wi, S.beltAt(fB), zBp], [s * S.edgeAt(fB) * 0.95, S.topAt(fB) - 0.04, zBp], 0.03, trim, 0);
      b.beam([s * Wi, S.beltAt(sh.rb) + 0.01, zB - 0.06], [s * S.edgeAt(sh.rt) * 0.95, S.topAt(sh.rt) - 0.04, zC + 0.02], 0.04, trim, 0);
    }

    const yH = S.topAt(sh.wt) - 0.045, eH = S.edgeAt(sh.wt) * 0.95;
    b.beam([-eH, yH, zH + 0.03], [eH, yH, zH + 0.03], 0.03, shade(roofCol, 0.9), 0);
    for (let k = 0; k < 4; k++) {
      const f0 = sh.wt + (sh.rt - sh.wt) * k / 4, f1 = sh.wt + (sh.rt - sh.wt) * (k + 1) / 4;
      const z0 = Z(f0), z1 = Z(f1), y0 = S.topAt(f0) - 0.03, y1 = S.topAt(f1) - 0.03, w0 = S.edgeAt(f0) * 0.96, w1 = S.edgeAt(f1) * 0.96;
      for (const s of [-1, 1]) flatFace(b, [[s * w0, y0, z0], [0, y0 + 0.012, z0], [0, y1 + 0.012, z1], [s * w1, y1, z1]], [0, -1, 0], roofCol, 0);
    }
    for (const x of center ? [-0.34, 0.34] : [ex, -ex]) b.box(x, yH - 0.035, zH + 0.12, 0.17, 0.01, 0.08, shade(roofCol, 0.92), 0);
    b.box(0, S.topAt(fOf(zH + 0.3)) - 0.045, zH + 0.3, 0.06, 0.012, 0.035, C('#e8e4d8'), 0);

    const seat = (x, zc, w) => {
      b.box(x, yF + 0.2, zc, w, 0.06, 0.25, seatCol, 0);
      const h = (ey + 0.05 - yF - 0.26) / 2, k = 0.26;
      slab(b, [x, yF + 0.26 + h * Math.cos(k), zc + 0.27 + h * Math.sin(k)], [w, 0, 0], [0, h * Math.cos(k), h * Math.sin(k)], [0, -0.06 * Math.sin(k), 0.06 * Math.cos(k)], seatCol);
      b.box(x, ey + 0.13, zc + 0.3 + 2 * h * Math.sin(k), w * 0.55, 0.08, 0.05, shade(seatCol, 0.9), 0);
    };
    if (!center) seat(-ex, ez + 0.05, 0.24);
    const bcb = F.Blueprints.of(car) && F.Blueprints.of(car).cabin;
    const zr = bcb && bcb.rear ? Z(bcb.rear / L) : ez + 0.9;
    if (bcb && bcb.jump) for (const x of [ex, -ex]) {
      const zj = Z(bcb.jump / L);
      b.box(x, yF + 0.2, zj, 0.2, 0.05, 0.17, seatCol, 0);
      slab(b, [x, yF + 0.45, zj + 0.19], [0.2, 0, 0], [0, 0.2, 0.03], [0, 0, 0.04], seatCol);
    }
    if (sh.seats !== 2 && zr + 0.4 < zB) {
      b.box(0, yF + 0.2, zr, Wi - 0.12, 0.06, 0.24, seatCol, 0);
      const yTop = S.beltAt(fOf(zr + 0.3)) + 0.05;
      slab(b, [0, (yF + 0.26 + yTop) / 2, zr + 0.3], [Wi - 0.12, 0, 0], [0, (yTop - yF - 0.26) / 2, 0.04], [0, 0, 0.06], seatCol);
      const ys = S.beltAt(sh.rb) - 0.02;
      flatFace(b, [[-Wi, ys, zr + 0.36], [Wi, ys, zr + 0.36], [Wi, ys, zB], [-Wi, ys, zB]], [0, 1, 0], shade(trim, 1.2), 0);
    } else {
      const zb3 = Math.min(ez + 0.55, zB - 0.02), fb = fOf(zb3);
      const yb4 = S.beltAt(fb) + 0.12, yt = Math.max(yb4 + 0.06, S.topAt(fb) - 0.12), xw = W * 0.3, yr = S.topAt(fb) - 0.03;
      for (const q of [[-Wi, yF, Wi, yb4], [-Wi, yt, Wi, yr], [-Wi, yb4, -xw, yt], [xw, yb4, Wi, yt]]) {
        flatFace(b, [[q[0], q[1], zb3], [q[2], q[1], zb3], [q[2], q[3], zb3], [q[0], q[3], zb3]], [0, 0, -1], shade(trim, 1.15), 0);
      }
    }

    const wheel = new Batch(1024);
    wheel.uvw = [0.2, 0.2];
    torus(wheel, R, sw.tube, 24, 6, C(sw.rim), 0);
    if (sw.ring) torus(wheel, R * 0.62, 0.0045, 10, 4, CHROME, MAT.CHROME, 0.012, Math.PI * 1.08, Math.PI * 1.92);
    for (const deg of sw.spokes) {
      const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), r0 = sw.pad * 0.8, r1 = R - sw.tube * 0.6;
      slab(wheel, [ca * (r0 + r1) / 2, sa * (r0 + r1) / 2, -0.01], [ca * (r1 - r0) / 2, sa * (r1 - r0) / 2, 0.008], [-sa * 0.018, ca * 0.018, 0], [0, 0, 0.006], C(st.form === 'metal' || sw.ring ? '#b8b6b0' : '#1c1c1e'), 0);
    }
    slab(wheel, [0, 0, -0.018], [sw.pad, 0, 0], [0, sw.pad * 0.8, 0], [0, 0, 0.022], C(sw.ring ? '#c8c6c0' : '#1a1a1c'), sw.ring ? MAT.CHROME : 0);

    const gauge = new Batch(16);
    const g0 = at(hw, -hh), g1 = at(hw, hh), g2 = at(-hw, hh), g3 = at(-hw, -hh);
    gauge.quad(g0, g1, g2, g3, C('#ffffff'), MAT.DIAL, [1, 1, 1, 0, 0, 0, 0, 1], nf);
    const radio = center || central ? null : [[-0.075, yDt - 0.184, zDr + 0.054], [0.075, yDt - 0.184, zDr + 0.054], [0.075, yDt - 0.156, zDr + 0.054], [-0.075, yDt - 0.156, zDr + 0.054]];
    return { batch: b, wheel, wheelPos: wc, tilt: -alpha, gauge, face: Object.assign({ c: gc, r: rf, u: uf, n: nf, hw, hh, fx, fy }, central ? { central } : {}), radio, wheelR: R, tube: sw.tube, pad: sw.pad, spokes: sw.spokes };
  }

  const carCache = new Map();
  function carGeo(id, wing) {
    const key = id + '|' + (wing || '');
    let g = carCache.get(key);
    if (!g) {
      const car = F.Cars.get(id);
      g = buildCar(car, { wing });
      const mid = buildCar(car, { wing, lod: 1 }), low = buildCar(car, { wing, lod: 2 });
      g.lods = [g.batch, mid.batch, low.batch];
      g.cuts = [g.cut, mid.cut, null];
      g.tagLods = [g.tags, mid.tags, low.tags];
      g.cockpit = buildCockpit(car, g);
      carCache.set(key, g);
    }
    return g;
  }

  Object.assign(F.Models, { buildCar, buildWheel, buildBrake, buildCockpit, carGeo, treadOf, cabinAt });
})(globalThis.Forza = globalThis.Forza || {});
