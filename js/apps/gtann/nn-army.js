(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const WHITE = [255, 255, 255, 255];

  function hull(mb, secs, m) {
    const rings = secs.map(([z, pts]) => {
      const left = pts.map(([x, y]) => [-x, y]).reverse();
      return { z, pts: left.concat(pts.slice(1)) };
    });
    const np = rings[0].pts.length;
    const face = (a, b, c, d) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = -Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      mb.quad([...a, ...b, ...c, ...d], [nx, ny, nz], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    };
    for (let i = 0; i + 1 < rings.length; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let k = 0; k + 1 < np; k++) {
        const p0 = [A.pts[k][0], A.pts[k][1], A.z], p1 = [A.pts[k + 1][0], A.pts[k + 1][1], A.z], q1 = [B.pts[k + 1][0], B.pts[k + 1][1], B.z], q0 = [B.pts[k][0], B.pts[k][1], B.z];
        face(p0, q0, q1, p1);
      }
    }
    for (const [R, nz] of [[rings[0], -1], [rings[rings.length - 1], 1]]) {
      mb.ensure(np + 1, np * 3);
      const cy = R.pts.reduce((s, q) => s + q[1], 0) / np, c = mb.v(0, cy, R.z, 0, 0, nz, 0.5, 0.5, m.c, m.layer, m.kind);
      for (const q of R.pts) mb.v(q[0], q[1], R.z, 0, 0, nz, 0.5, 0.5, m.c, m.layer, m.kind);
      for (let k = 0; k + 1 < np; k++) mb.tri(c, c + 1 + k, c + 2 + k);
    }
  }

  const WHEELS = new Map();
  function roadWheel(kind, lod) {
    const key = kind + '|' + lod;
    if (WHEELS.has(key)) return WHEELS.get(key);
    const K0 = N.Cars.kit, mb = new N.MB(512), seg = [12, 8, 6][lod];
    const rub = { layer: T('tire'), kind: 0, c: [64, 62, 58, 255] }, steel = { layer: T('carbody'), kind: K.PAINT, c: WHITE }, dark = K0.mat('dark');
    const lathe = (prof, m) => {
      const np = prof.length, base = mb.nv;
      mb.ensure((seg + 1) * np, seg * (np - 1) * 6);
      const pn = prof.map((q, k) => {
        const a = prof[Math.max(0, k - 1)], b = prof[Math.min(np - 1, k + 1)], dx = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dx, dr) || 1;
        return [dr / l, -dx / l];
      });
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
        for (let k = 0; k < np; k++) mb.v(prof[k][0], ct * prof[k][1], st * prof[k][1], -pn[k][0], -pn[k][1] * ct, -pn[k][1] * st, i / seg * 4, k / (np - 1), m.c, m.layer, m.kind);
      }
      for (let i = 0; i < seg; i++) for (let k = 0; k + 1 < np; k++) { const a = base + i * np + k; mb.tri(a, a + np, a + np + 1); mb.tri(a, a + np + 1, a + 1); }
    };
    const disc = (x, r, m, nx) => {
      mb.ensure(seg + 2, seg * 3);
      const c = mb.v(x, 0, 0, nx, 0, 0, 0.5, 0.5, m.c, m.layer, m.kind);
      for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2; mb.v(x, Math.cos(t) * r, Math.sin(t) * r, nx, 0, 0, 0.5, 0.5, m.c, m.layer, m.kind); }
      for (let i = 0; i < seg; i++) mb.tri(c, c + 1 + i, c + 2 + i);
    };
    if (lod === 2) {
      const w = kind === 'road' ? 0.5 : kind === 'sprocket' ? 0.42 : 0.6;
      lathe([[w, 1], [-w, 1]], kind === 'road' ? rub : steel);
      disc(w + 0.02, 0.98, kind === 'road' ? rub : steel, 1);
      disc(w + 0.04, 0.82, steel, 1);
    } else if (kind === 'road') {
      for (const sd of [1, -1]) {
        lathe([[sd * 0.5, 0.86], [sd * 0.5, 1], [sd * 0.14, 1], [sd * 0.14, 0.86]], rub);
        lathe([[sd * 0.14, 0.86], [sd * 0.5, 0.86], [sd * 0.56, 0.6], [sd * 0.6, 0.3], [sd * 0.62, 0.0]], steel);
      }
      if (lod === 0) for (let k = 0; k < 6; k++) {
        const t = k / 6 * Math.PI * 2, cy = Math.cos(t) * 0.42, cz = Math.sin(t) * 0.42, r = 0.07, x = 0.585;
        mb.quad([x, cy - r, cz - r, x, cy + r, cz - r, x, cy + r, cz + r, x, cy - r, cz + r], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
      }
    } else if (kind === 'sprocket') {
      lathe([[-0.4, 0.82], [0.4, 0.82], [0.42, 0.5], [0.45, 0.0]], steel);
      const nt = lod ? 8 : 14;
      for (let k = 0; k < nt; k++) {
        const t = k / nt * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
        K0.obox(mb, [0, c * 0.9, s * 0.9], [1, 0, 0], [0, c, s], [0, -s, c], [0.3, 0.1, 0.07], dark);
      }
    } else {
      lathe([[-0.6, 0.92], [0.6, 0.92], [0.62, 0.6], [0.65, 0.0]], steel);
      lathe([[-0.6, 1.0], [0.6, 1.0], [0.6, 0.92], [-0.6, 0.92]], dark);
    }
    WHEELS.set(key, mb);
    return mb;
  }

  function trackLoop(mb, x, pts, m, w, th) {
    const n = pts.length, path = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const tz = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tz, ty) || 1;
      path.push({ p: [x, p[1], p[0]], o: [1, 0, 0], u: [0, tz / l, -ty / l] });
    }
    N.Cars.kit.sweep(mb, path, [[-w / 2, 0], [w / 2, 0], [w / 2, th], [-w / 2, th], [-w / 2, 0]], m);
  }

  function loopPoints(z0, z1, yb, rear, front, top, lod) {
    const pts = [], arc = (cz, cy, r, a0, a1, k) => { for (let i = 0; i <= k; i++) { const t = a0 + (a1 - a0) * i / k; pts.push([cz + Math.sin(t) * r, cy - Math.cos(t) * r]); } };
    const k = lod ? 4 : 8;
    pts.push([z0, yb]);
    pts.push([z1, yb]);
    arc(rear[0], rear[1], rear[2], 0.35, Math.PI, k);
    for (const q of top) pts.push(q);
    arc(front[0], front[1], front[2], Math.PI, Math.PI * 1.9, k);
    return pts;
  }

  function lathe(mb, ox, oy, oz, prof, m, seg) {
    const np = prof.length, base = mb.nv;
    mb.ensure((seg + 1) * np, seg * (np - 1) * 6);
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      for (let k = 0; k < np; k++) {
        const [r, y] = prof[k], a = prof[Math.max(0, k - 1)], b = prof[Math.min(np - 1, k + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1;
        mb.v(ox + c * r, oy + y, oz + s * r, c * dy / l, -dr / l, s * dy / l, i / seg, k / (np - 1), m.c, m.layer, m.kind);
      }
    }
    for (let i = 0; i < seg; i++) for (let k = 0; k + 1 < np; k++) { const a = base + i * np + k; mb.tri(a, a + np, a + np + 1); mb.tri(a, a + np + 1, a + 1); }
  }

  function brick(mb, x, y, z, yaw, tilt, w, h, d, m) {
    const c = Math.cos(yaw), s = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const ax = [c, 0, s], az = [-s * ct, st, c * ct], ay = [s * st, ct, -c * st];
    N.Cars.kit.obox(mb, [x, y, z], ax, ay, az, [w / 2, h / 2, d / 2], m);
  }

  function tank(spec, lod) {
    const K0 = N.Cars.kit, kit = N.CarKit, sh = spec.shape, T0 = spec.turret, hl = sh.L / 2;
    const mb = new N.MB(4096), gl = new N.MB(16), tm = new N.MB(2048), gm = new N.MB(512), parts = [];
    const paint = K0.mat('paint'), dark = K0.mat('dark'), black = K0.mat('black'), chassis = K0.mat('chassis');
    const era = { layer: T('carbody'), kind: K.PAINT, c: WHITE }, rub = { layer: T('tire'), kind: 0, c: [62, 60, 56, 255] };
    const hx = 1.12, tg = 1.395, tw = 0.58;
    const sec = (z, y0, y1, w) => [z, [[0, y0], [w, y0], [w, y1 - 0.07], [w - 0.07, y1], [0, y1]]];
    const gy = z => 1.05 + 0.4 * (z + hl);
    hull(mb, [sec(-hl, 0.95, 1.05, hx), sec(-2.95, 0.52, gy(-2.95), hx), sec(-2.1, 0.5, 1.6, hx), sec(3.25, 0.5, 1.6, hx), sec(hl, 0.72, 1.52, hx)], paint);
    for (const s of [-1, 1]) {
      K0.obox(mb, [s * 1.455, 1.445, 0.05], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.335, 0.025, 3.3], paint);
      brick(mb, s * 1.455, 1.37, -3.47, 0, 0.42, 0.67, 0.05, 0.5, paint);
      const segs = lod ? 1 : 6;
      for (let k = 0; k < segs; k++) {
        const z0 = -2.95 + k * 5.55 / segs, z1 = -2.95 + (k + 1) * 5.55 / segs - (lod ? 0 : 0.03);
        K0.obox(mb, [s * 1.775, 1.17, (z0 + z1) / 2], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.012, 0.27, (z1 - z0) / 2], paint);
      }
      const top = lod ? [[2.6, 0.88], [-2.6, 0.88]] : [[2.6, 0.9], [1.3, 0.86], [0, 0.85], [-1.3, 0.86], [-2.6, 0.9]];
      trackLoop(mb, s * tg, loopPoints(-2.45, 2.45, 0.02, [2.95, 0.55, 0.34], [-2.92, 0.5, 0.31], top, lod), rub, tw, 0.07);
    }
    if (lod < 2) {
      for (const s of [-1, 1]) {
        K0.obox(mb, [s * 1.04, 1.43, -2.72], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.07, 0.07, 0.06], black);
        kit.lampAt(mb, parts, [s * 1.04, 1.43, -2.785], [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.055, seg: 10 }, kit.LK.HEAD);
        kit.lampAt(mb, parts, [s * 1.0, 1.42, hl + 0.005], [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.08, h: 0.05 }, kit.LK.TAIL);
      }
      K0.obox(mb, [0, 1.62, -1.95], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.32, 0.03, 0.26], dark);
      K0.obox(mb, [0, 1.69, -2.12], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.13, 0.05, 0.05], black);
      for (const z of [1.5, 2.0, 2.5, 3.0]) K0.obox(mb, [0, 1.605, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.9, 0.006, 0.18], dark);
      for (const s of [-1, 1]) K0.tube(mb, [s * 0.12, 1.78, hl + 0.3], [s * 0.98, 1.78, hl + 0.3], 0.29, paint, lod ? 8 : 14);
      K0.obox(mb, [0, 2.15, hl + 0.26], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1.6, 0.11, 0.11], { layer: T('plank'), kind: 0, c: [120, 96, 70, 255] });
      K0.obox(mb, [-1.45, 1.55, 2.6], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.15, 0.08, 0.32], dark);
    }
    if (lod === 0) for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
      const x = -0.84 + k * 0.28 + (r % 2) * 0.06, z = -3.3 + r * 0.38;
      brick(mb, x, gy(z) + 0.037, z - 0.015, 0, 0.38, 0.25, 0.08, 0.36, era);
    }
    const tp = T0.pivot, ts = [[-1.45, 0.45, 0.0, 0.42, 0.18], [-1.28, 0.92, 0.0, 0.56, 0.26], [-0.7, 1.12, 0.0, 0.66, 0.3], [0.5, 1.1, 0.0, 0.66, 0.3], [1.1, 0.95, 0.02, 0.6, 0.26], [1.45, 0.6, 0.06, 0.5, 0.2]];
    K0.bikeKit(tm, 0, 0).shell(ts, paint);
    lathe(tm, 0, -0.06, 0, [[1.18, 0], [1.18, 0.07]], chassis, lod ? 10 : 18);
    if (lod < 2) {
      lathe(tm, 0.42, 0.62, 0.25, [[0.32, 0], [0.32, 0.12], [0.28, 0.16], [0, 0.17]], paint, 12);
      lathe(tm, -0.42, 0.63, 0.2, [[0.28, 0], [0.28, 0.06], [0, 0.07]], paint, 12);
      K0.obox(tm, [0.42, 0.93, 0.1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.05, 0.06, 0.35], black);
      K0.tube(tm, [0.42, 0.95, -0.2], [0.42, 0.95, -1.05], 0.022, black, 6);
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
        const z = -0.75 + k * 0.16;
        K0.tube(tm, [s * 1.02, 0.42, z], [s * 1.22, 0.62, z - 0.18], 0.04, dark, 6);
      }
      K0.obox(tm, [0.62, 0.42, -1.22], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.13, 0.13, 0.12], black);
      tm.quad([0.5, 0.31, -1.341, 0.74, 0.31, -1.341, 0.74, 0.53, -1.341, 0.5, 0.53, -1.341], [0, 0, -1], [0, 0, 1, 0, 1, 1, 0, 1], [40, 46, 52, 255], T('lamplens'), K.LENS);
      K0.obox(tm, [0, 0.36, 1.5], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.7, 0.18, 0.1], paint);
      K0.tube(tm, [-0.55, 0.62, 1.1], [0.55, 0.62, 1.1], 0.07, chassis, 8);
    }
    if (lod === 0) for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const x = s * (0.32 + k * 0.17 + r * 0.06), z = -1.2 + k * 0.13 + r * 0.24, y = 0.66 - r * 0.03;
      brick(tm, x, y + 0.04, z, s * -0.55, -0.12, 0.22, 0.07, 0.3, era);
    }
    const gp = T0.gun;
    K0.obox(gm, [0, 0, -0.72], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.27, 0.2, 0.2], paint);
    const bar = [[-0.9, -1.9, 0.12], [-1.9, -2.6, 0.1], [-2.6, -3.15, 0.15], [-3.15, -4.3, 0.1], [-4.3, -T0.len, 0.088]];
    for (const [z0, z1, r] of bar) K0.tube(gm, [0, 0, z0], [0, 0, z1], r, paint, lod ? 8 : 12);
    K0.tube(gm, [0.32, -0.03, -0.8], [0.32, -0.03, -1.08], 0.025, black, 6);
    const cab = N.cabin(spec), wheels = [];
    const rw = [-2.13, -1.29, -0.43, 0.43, 1.29, 2.13];
    for (const sx of [-1, 1]) {
      for (const z of rw) wheels.push({ x: sx * tg, y: 0.43, z, r: 0.375, front: false, sx });
      wheels.push({ x: sx * tg, y: 0.55, z: 2.95, r: 0.31, front: false, sx, kind: 'sprocket' });
      wheels.push({ x: sx * tg, y: 0.5, z: -2.92, r: 0.28, front: false, sx, kind: 'idler' });
    }
    return {
      mb, gl, wheels, wheel: roadWheel('road', lod), wheelKinds: { sprocket: roadWheel('sprocket', lod), idler: roadWheel('idler', lod) }, seat: cab.seat, H: sh.H, cab, lod, armor: true,
      doors: null, lamps: kit.lampAnchors(parts, 0.05), plates: [], cargo: null, beacon: null, rear: null,
      turret: { mb: tm, pivot: tp }, gun: { mb: gm, pivot: gp, len: T0.len }
    };
  }

  function btr(spec, lod) {
    const K0 = N.Cars.kit, kit = N.CarKit, sh = spec.shape, T0 = spec.turret, hl = sh.L / 2;
    const mb = new N.MB(4096), gl = new N.MB(64), tm = new N.MB(1024), gm = new N.MB(256), parts = [];
    const paint = K0.mat('paint'), dark = K0.mat('dark'), black = K0.mat('black'), chassis = K0.mat('chassis');
    const S = (z, yb, hb, ys, hw, ym, ht, yt) => [z, [[0, yb], [hb, yb], [hb + 0.05, ys], [hw, ym], [ht, yt], [0, yt]]];
    hull(mb, [S(-hl, 1.0, 0.8, 1.03, 0.92, 1.07, 0.8, 1.12), S(-3.2, 0.62, 0.9, 1.16, 1.38, 1.3, 1.0, 1.52), S(-2.35, 0.55, 0.9, 1.16, 1.45, 1.32, 1.02, 1.96), S(2.9, 0.55, 0.9, 1.16, 1.45, 1.32, 1.02, 1.99), S(3.55, 0.62, 0.9, 1.16, 1.42, 1.3, 1.0, 1.86), S(hl, 0.76, 0.85, 1.16, 1.3, 1.28, 0.95, 1.74)], paint);
    const gy = z => 1.52 + 0.44 * (z + 3.2) / 0.85;
    if (lod < 2) {
      for (const s of [-1, 1]) {
        const za = -2.76, zb = -2.48;
        gl.quad([s * 0.1, gy(za) + 0.006, za - 0.003, s * 0.62, gy(za) + 0.006, za - 0.003, s * 0.58, gy(zb) + 0.006, zb - 0.003, s * 0.1, gy(zb) + 0.006, zb - 0.003], [0, 0.888, -0.46], [0, 1, 1, 1, 1, 0, 0, 0], [70, 90, 100, 255], T('carglass'), K.GLASS);
        K0.obox(mb, [s * 0.35, gy(zb + 0.04) + 0.02, zb + 0.04], [1, 0, 0], [0, 0.888, -0.46], [0, 0.46, 0.888], [0.3, 0.02, 0.04], black);
        K0.obox(mb, [s * 0.86, 1.47, -3.1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.1, 0.1, 0.08], black);
        kit.lampAt(mb, parts, [s * 0.86, 1.47, -3.185], [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.075, seg: 10 }, kit.LK.HEAD);
        kit.lampAt(mb, parts, [s * 1.05, 1.45, hl + 0.005], [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.08, h: 0.05 }, kit.LK.TAIL);
        K0.obox(mb, [s * 1.27, 1.6, -0.02], [s * 0.83, 0.557, 0], [-s * 0.557, 0.83, 0], [0, 0, 1], [0.012, 0.24, 0.34], dark);
        for (const z of [-1.6, 1.4, 2.4]) K0.obox(mb, [s * 1.35, 1.52, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.06, 0.06, 0.06], black);
      }
      for (const [x, z] of [[-0.45, -1.8], [0.45, -1.8], [0, 1.2]]) lathe(mb, x, 1.97, z, [[0.3, 0], [0.3, 0.05], [0, 0.06]], paint, 10);
      for (const z of [1.9, 2.4, 2.9]) K0.obox(mb, [0, 1.995, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.7, 0.006, 0.16], dark);
      K0.obox(mb, [0, 1.385, -3.45], [1, 0, 0], [0, 0.84, -0.54], [0, 0.54, 0.84], [0.85, 0.02, 0.2], paint);
      K0.obox(mb, [1.2, 1.7, 3.3], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.12, 0.1, 0.25], chassis);
    }
    lathe(tm, 0, 0, 0, [[0.56, 0], [0.55, 0.18], [0.46, 0.36], [0.36, 0.42], [0, 0.43]], paint, lod ? 10 : 16);
    if (lod < 2) {
      K0.obox(tm, [0.04, 0.24, -0.5], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.24, 0.12, 0.1], paint);
      lathe(tm, -0.2, 0.42, 0.18, [[0.2, 0], [0.2, 0.04], [0, 0.05]], paint, 10);
      K0.obox(tm, [0.3, 0.45, -0.15], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.05, 0.05, 0.1], black);
    }
    const g = [[0, -0.95, 0.055], [-0.95, -T0.len, 0.04]];
    for (const [z0, z1, r] of g) K0.tube(gm, [0, 0, z0], [0, 0, z1], r, black, lod ? 6 : 10);
    K0.tube(gm, [0.22, -0.04, -0.05], [0.22, -0.04, -0.7], 0.024, black, 6);
    const cab = N.cabin(spec), wheels = [], track = 2.41, ax = -hl + sh.ax;
    for (const sx of [-1, 1]) for (const [i, a] of sh.axles.entries()) wheels.push({ x: sx * track / 2, y: sh.wr, z: ax + a, r: sh.wr, front: i < 2, sx });
    return {
      mb, gl, wheels, wheel: K0.wheelMesh('truck', 0.32, lod, 'rimdark'), seat: cab.seat, H: sh.H, cab, lod, armor: true,
      doors: null, lamps: kit.lampAnchors(parts, 0.05), plates: [], cargo: null, beacon: null, rear: null,
      turret: { mb: tm, pivot: T0.pivot }, gun: { mb: gm, pivot: T0.gun, len: T0.len }
    };
  }

  function star(mb, x, y, z, sd, r, c) {
    mb.ensure(11, 30);
    const base = mb.v(x, y, z, sd, 0, 0, 0.5, 0.5, c, T('white'), 0);
    for (let k = 0; k <= 10; k++) {
      const a = k / 10 * Math.PI * 2, q = k % 2 ? r * 0.4 : r;
      mb.v(x, y + Math.cos(a) * q, z + Math.sin(a) * q * sd, sd, 0, 0, 0.5, 0.5, c, T('white'), 0);
    }
    for (let k = 0; k < 10; k++) mb.tri(base, base + 1 + k, base + 2 + k);
  }

  let MI24 = null;
  function mi24() {
    if (MI24) return MI24;
    const K0 = N.Cars.kit, mb = new N.MB(4096), rotor = new N.MB(256), tail = new N.MB(96);
    const paint = K0.mat('paint'), dark = K0.mat('dark'), black = K0.mat('black'), frame = K0.mat('chassis');
    const glass = { layer: T('mirror'), kind: K.CHROME, c: [46, 58, 70, 255] }, blade = { layer: T('darkmetal'), kind: 0, c: [38, 40, 42, 255] };
    const pod = { layer: T('white'), kind: 0, c: [96, 102, 88, 255] };
    const { shell, box } = K0.bikeKit(mb, 0, 0);
    shell([[-8.95, 0.18, -0.85, -0.45, 0.12], [-8.7, 0.45, -1.0, -0.1, 0.22], [-8.2, 0.6, -1.05, 0.15, 0.28], [-7.5, 0.64, -1.05, 0.25, 0.3]], glass);
    shell([[-7.6, 0.66, -1.08, 0.2, 0.3], [-6.6, 0.82, -1.15, 0.35, 0.35], [-5.2, 0.92, -1.2, 0.48, 0.38], [-3.0, 0.96, -1.22, 0.55, 0.38], [0.6, 0.96, -1.12, 0.55, 0.36], [1.9, 0.7, -0.6, 0.5, 0.28], [2.7, 0.42, -0.05, 0.42, 0.18]], paint);
    shell([[-6.95, 0.42, 0.18, 0.5, 0.14], [-6.55, 0.6, 0.22, 0.98, 0.28], [-5.7, 0.64, 0.28, 1.05, 0.3], [-5.15, 0.58, 0.32, 0.92, 0.28]], glass);
    shell([[-5.1, 0.5, 0.4, 1.0, 0.25], [-4.3, 0.84, 0.42, 1.45, 0.38], [-0.6, 0.86, 0.42, 1.52, 0.38], [0.9, 0.62, 0.42, 1.25, 0.3], [1.9, 0.32, 0.42, 0.85, 0.14]], paint);
    for (const s of [-1, 1]) {
      K0.tube(mb, [s * 0.55, 0.98, -4.0], [s * 0.55, 0.98, -4.75], 0.27, paint, 10);
      N.CarKit.shapeAt(mb, [s * 0.55, 0.98, -4.752], [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.24, seg: 10 }, dark.c, dark.layer, dark.kind);
      K0.tube(mb, [s * 0.8, 1.05, -1.3], [s * 1.18, 0.95, -0.55], 0.2, dark, 8);
      const len = Math.hypot(2.4, 0.4), ax = [s * 2.4 / len, -0.4 / len, 0], ay = [s * 0.4 / len, 2.4 / len, 0];
      K0.obox(mb, [s * 2.1, -0.35, -1.3], ax, ay, [0, 0, 1], [len / 2, 0.06, 0.6], paint);
      K0.obox(mb, [s * 3.32, -0.78, -1.35], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.05, 0.26, 0.55], frame);
      for (const [x, y] of [[1.75, -0.68], [2.7, -0.82]]) {
        K0.tube(mb, [s * x, y, -2.25], [s * x, y, -0.35], 0.27, pod, 10);
        N.CarKit.shapeAt(mb, [s * x, y, -2.252], [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.24, seg: 10 }, black.c, black.layer, black.kind);
        K0.obox(mb, [s * x, y + 0.3, -1.3], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.05, 0.12, 0.35], frame);
      }
      star(mb, s * 0.375, 0.52, 5.2, s, 0.34, [236, 236, 230, 255]);
      star(mb, s * 0.38, 0.52, 5.2, s, 0.27, [196, 28, 26, 255]);
    }
    K0.tube(mb, [0, 0.3, 2.3], [0, 0.55, 5.6], 0.36, paint, 10);
    K0.tube(mb, [0, 0.55, 5.6], [0, 0.75, 8.7], 0.24, paint, 10);
    box(8.2, 0.6, 0.06, 9.1, 2.7, -0.06, paint);
    box(7.3, 0.62, -1.4, 7.9, 0.68, 1.4, paint);
    K0.tube(mb, [0, 1.5, -1.3], [0, 1.95, -1.3], 0.16, frame, 8);
    lathe(mb, 0, -1.38, -8.15, [[0, 0], [0.22, 0.04], [0.3, 0.18], [0.27, 0.32]], frame, 12);
    for (const [x, y] of [[-0.045, -1.17], [0.045, -1.17], [-0.045, -1.26], [0.045, -1.26]]) K0.tube(mb, [x, y, -8.2], [x, y, -9.3], 0.032, black, 5);
    K0.rotorBlades(rotor, 5, 8.65, 0.58, blade, frame);
    K0.tailBlades(tail, 3, 1.95, blade);
    MI24 = { mb, rotor, tail, hub: [0, 2.05, -1.3], tailAt: [-0.22, 2.3, 8.9], door: [-1.0, -0.3, -2.5], gearY: -1.4 };
    return MI24;
  }

  N.Army = {
    build: (spec, lod) => (spec.type === 'tank' ? tank(spec, lod) : btr(spec, lod)),
    roadWheel,
    mi24,
    clear() { WHEELS.clear(); MI24 = null; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
