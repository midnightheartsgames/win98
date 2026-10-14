(function (N) {
  'use strict';

  const GT = N.GT;
  const B = (x0, y0, z0, x1, y1, z1, m, o) => Object.assign({ x0, y0, z0, x1, y1, z1, m }, o || {});

  const MAT = {
    wood: { e: 0.22, mu: 0.6 },
    metal: { e: 0.3, mu: 0.42 },
    concrete: { e: 0.1, mu: 0.75 },
    glass: { e: 0.2, mu: 0.5 }
  };

  const lampBoxes = p => {
    if (p.park) return [B(-0.07, 0, -0.07, 0.07, 3.6, 0.07, 40), B(-0.26, 3.6, -0.26, 0.26, 4.1, 0.26, 5, { cyl: true })];
    const out = [B(-0.13, 0, -0.13, 0.13, 8.4, 0.13, 360)];
    for (const a of p.median ? [1, -1] : [1]) {
      const z = a > 0 ? -2.3 : 2.3;
      out.push(B(-0.06, 8.2, a > 0 ? -2.2 : 0, 0.06, 8.32, a > 0 ? 0 : 2.2, 15), B(-0.22, 7.95, z - 0.45, 0.22, 8.25, z + 0.45, 15));
    }
    return out;
  };

  const octants = (r, h, m) => {
    const out = [];
    for (const [x0, x1] of [[-r, -0.01], [0.01, r]]) for (const [z0, z1] of [[-r, -0.01], [0.01, r]]) for (const [y0, y1] of [[0, h * 0.5 - 0.01], [h * 0.5 + 0.01, h]]) out.push({ boxes: [B(x0, y0, z0, x1, y1, z1, m / 8)], mesh: 'box' });
    return out;
  };

  const BREAK = {
    bench: {
      name: 'Скамейка', mat: 'wood', anchor: 1500, shatter: 3200, hp: 70,
      whole: () => [B(-0.85, 0.4, -0.22, 0.85, 0.47, 0.2, 12), B(-0.85, 0.52, 0.17, 0.85, 0.92, 0.24, 8), B(-0.75, 0, -0.22, -0.69, 0.9, 0.24, 11), B(0.69, 0, -0.22, 0.75, 0.9, 0.24, 11)],
      pieces: p => BREAK.bench.whole(p).map(b => ({ boxes: [b], mesh: 'clip' }))
    },
    urn: {
      name: 'Урна', mat: 'concrete', anchor: 0, shatter: 5000,
      whole: () => [B(-0.26, 0, -0.26, 0.26, 0.7, 0.26, 70, { cyl: true })],
      pieces: () => octants(0.26, 0.7, 70)
    },
    bin: {
      name: 'Мусорный контейнер', mat: 'metal', anchor: 0, shatter: 3000,
      whole: () => [B(-0.62, 0, -0.42, 0.62, 1.1, 0.42, 70), B(-0.48, 0.95, -0.32, -0.06, 1.32, 0.1, 3), B(0, 0.95, -0.08, 0.42, 1.27, 0.32, 3)],
      pieces: p => BREAK.bin.whole(p).map(b => ({ boxes: [b], mesh: 'clip' }))
    },
    crate: {
      name: 'Ящик', mat: 'wood', anchor: 0, shatter: 100, hp: 18, foot: true,
      whole: () => [B(-0.3, 0, -0.2, 0.3, 0.3, 0.2, 6)],
      pieces: () => [
        B(-0.3, 0.03, -0.2, 0.3, 0.3, -0.18, 1.2), B(-0.3, 0.03, 0.18, 0.3, 0.3, 0.2, 1.2),
        B(-0.3, 0, -0.18, -0.28, 0.3, 0.18, 1.2), B(0.28, 0, -0.18, 0.3, 0.3, 0.18, 1.2), B(-0.28, 0, -0.18, 0.28, 0.025, 0.18, 1.2)
      ].map(b => ({ boxes: [b], mesh: 'box' }))
    },
    barrel: {
      name: 'Бочка', mat: 'metal', anchor: 0, foot: true,
      whole: () => [B(-0.29, 0, -0.29, 0.29, 0.88, 0.29, 25, { cyl: true })]
    },
    fence: {
      name: 'Секция забора', mat: 'metal', anchor: 3500,
      whole: p => { const w = p.w / 2, h = p.h; return [B(-w, 0.04, -0.025, w, h, 0.025, 9 * p.w), B(-w - 0.04, 0, -0.04, -w + 0.04, h + 0.06, 0.04, 6)]; }
    },
    picket: {
      name: 'Штакетник', mat: 'wood', anchor: 900, shatter: 700, hp: 50,
      whole: p => { const w = p.w / 2, h = p.h || 1.25; return [B(-w, 0.05, -0.035, 0, h, 0.035, 3.5 * p.w), B(0, 0.05, -0.035, w, h, 0.035, 3.5 * p.w), B(-w - 0.05, 0, -0.05, -w + 0.05, h + 0.06, 0.05, 4)]; },
      pieces: p => { const b = BREAK.picket.whole(p); return [{ boxes: [b[0], b[2]], mesh: 'clip' }, { boxes: [b[1]], mesh: 'clip' }]; }
    },
    rail: {
      name: 'Ограждение', mat: 'metal', anchor: 2600,
      whole: p => { const w = p.w / 2; return [B(-w, 0.18, -0.03, w, 1.0, 0.03, 13 * p.w), B(-w - 0.035, 0, -0.035, -w + 0.035, 1.06, 0.035, 4)]; }
    },
    sign: {
      name: 'Дорожный знак', mat: 'metal', anchor: 1800, tip: true, fly: 3,
      whole: () => [B(-0.035, 0, -0.035, 0.035, 2.6, 0.035, 9), B(-0.36, 1.92, -0.06, 0.36, 2.66, -0.02, 4)]
    },
    lamp: {
      name: 'Фонарь', mat: 'concrete', anchor: 13000, glass: true, tip: true,
      anchorOf: p => (p.park ? 3000 : 13000), matOf: p => (p.park ? 'metal' : 'concrete'), flyOf: p => (p.park ? 6 : 11),
      whole: lampBoxes
    },
    globelamp: {
      name: 'Фонарь', mat: 'metal', anchor: 6500, glass: true, tip: true, fly: 7,
      whole: () => [B(-0.2, 0, -0.2, 0.2, 0.55, 0.2, 60, { cyl: true }), B(-0.075, 0.55, -0.075, 0.075, 3.95, 0.075, 40), B(-0.64, 3.9, -0.035, 0.64, 3.97, 0.035, 6), B(-0.85, 4.04, -0.25, -0.35, 4.54, 0.25, 3, { cyl: true }), B(0.35, 4.04, -0.25, 0.85, 4.54, 0.25, 3, { cyl: true })]
    },
    trafficlight: {
      name: 'Светофор', mat: 'metal', anchor: 5000, glass: true, tip: true, fly: 5,
      whole: () => [B(-0.07, 0, -0.07, 0.07, 3.3, 0.07, 40), B(-0.18, 2.5, -0.18, 0.18, 3.6, 0.18, 25)]
    },
    phone: {
      name: 'Таксофон', mat: 'glass', anchor: 7000, glass: true,
      whole: () => [B(-0.5, 0, -0.5, 0.5, 2.42, 0.5, 150)]
    }
  };

  const shapeKey = (p, part) => [p.type, p.w ? p.w.toFixed(2) : '', p.h ? p.h.toFixed(2) : '', p.park ? 1 : 0, p.median ? 1 : 0, part].join('|');
  const SHAPES = new Map();

  const inertiaOf = (boxes, com) => {
    const I = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const b of boxes) {
      const a = b.x1 - b.x0, h = b.y1 - b.y0, c = b.z1 - b.z0, m = b.m;
      let ix, iy, iz;
      if (b.cyl) { const r = Math.max(a, c) / 2; ix = iz = m * (3 * r * r + h * h) / 12; iy = m * r * r / 2; }
      else { ix = m * (h * h + c * c) / 12; iy = m * (a * a + c * c) / 12; iz = m * (a * a + h * h) / 12; }
      const dx = (b.x0 + b.x1) / 2 - com[0], dy = (b.y0 + b.y1) / 2 - com[1], dz = (b.z0 + b.z1) / 2 - com[2];
      const d2 = dx * dx + dy * dy + dz * dz;
      I[0] += ix + m * (d2 - dx * dx); I[4] += iy + m * (d2 - dy * dy); I[8] += iz + m * (d2 - dz * dz);
      I[1] -= m * dx * dy; I[2] -= m * dx * dz; I[5] -= m * dy * dz;
    }
    I[3] = I[1]; I[6] = I[2]; I[7] = I[5];
    return I;
  };

  const inv3 = m => {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, Bc = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * Bc + c * C || 1e-9;
    return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, Bc / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  };

  const pointsOf = (boxes, com) => {
    const out = [];
    const add = (x, y, z) => out.push(x - com[0], y - com[1], z - com[2]);
    for (const b of boxes) {
      if (b.cyl) {
        const r = Math.max(b.x1 - b.x0, b.z1 - b.z0) / 2, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
        const rings = Math.max(2, Math.ceil((b.y1 - b.y0) / 0.6) + 1);
        for (let j = 0; j < rings; j++) {
          const y = b.y0 + (b.y1 - b.y0) * j / (rings - 1);
          for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; add(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); }
        }
        continue;
      }
      const lo = [b.x0, b.y0, b.z0], hi = [b.x1, b.y1, b.z1];
      for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) add(x, y, z);
      for (let ax = 0; ax < 3; ax++) {
        const u = (ax + 1) % 3, v = (ax + 2) % 3, rod = hi[u] - lo[u] < 0.35 && hi[v] - lo[v] < 0.35;
        const n = Math.ceil((hi[ax] - lo[ax]) / (rod ? 0.9 : 0.6));
        if (n < 2) continue;
        const ends = rod ? [[lo[u], lo[v]], [hi[u], hi[v]]] : [[lo[u], lo[v]], [hi[u], lo[v]], [lo[u], hi[v]], [hi[u], hi[v]]];
        for (const [eu, ev] of ends) for (let k = 1; k < n; k++) {
          const P = [0, 0, 0];
          P[ax] = lo[ax] + (hi[ax] - lo[ax]) * k / n; P[u] = eu; P[v] = ev;
          add(P[0], P[1], P[2]);
        }
      }
      for (let ax = 0; ax < 3; ax++) {
        const u = (ax + 1) % 3, v = (ax + 2) % 3;
        const nu = Math.ceil((hi[u] - lo[u]) / 0.6), nv = Math.ceil((hi[v] - lo[v]) / 0.6);
        if (nu < 2 || nv < 2) continue;
        for (const f of [lo[ax], hi[ax]]) for (let i = 1; i < nu; i++) for (let j = 1; j < nv; j++) {
          const P = [0, 0, 0];
          P[ax] = f; P[u] = lo[u] + (hi[u] - lo[u]) * i / nu; P[v] = lo[v] + (hi[v] - lo[v]) * j / nv;
          add(P[0], P[1], P[2]);
        }
      }
    }
    return new Float32Array(out);
  };

  const shapeOf = (boxes, key) => {
    if (key && SHAPES.has(key)) return SHAPES.get(key);
    let m = 0;
    const com = [0, 0, 0];
    for (const b of boxes) { m += b.m; com[0] += (b.x0 + b.x1) / 2 * b.m; com[1] += (b.y0 + b.y1) / 2 * b.m; com[2] += (b.z0 + b.z1) / 2 * b.m; }
    com[0] /= m; com[1] /= m; com[2] /= m;
    const I = inertiaOf(boxes, com);
    const pts = pointsOf(boxes, com);
    let r = 0;
    for (let i = 0; i < pts.length; i += 3) r = Math.max(r, Math.hypot(pts[i], pts[i + 1], pts[i + 2]));
    const local = boxes.map(b => ({ x0: b.x0 - com[0], y0: b.y0 - com[1], z0: b.z0 - com[2], x1: b.x1 - com[0], y1: b.y1 - com[1], z1: b.z1 - com[2] }));
    const sh = { m, im: 1 / m, com, Ib: inv3(I), pts, r, boxes, local };
    if (key) SHAPES.set(key, sh);
    return sh;
  };

  const HIT = { depth: 0, nx: 0, nz: 0 };
  const inside = (x, z, p) => {
    let best = Infinity, bx = 0, bz = 0;
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = i + 2 < n ? i + 2 : 0;
      const ex = p[j] - p[i], ez = p[j + 1] - p[i + 1], L = Math.sqrt(ex * ex + ez * ez) || 1;
      const nx = ez / L, nz = -ex / L, d = -((x - p[i]) * nx + (z - p[i + 1]) * nz);
      if (d < 0) return null;
      if (d < best) { best = d; bx = nx; bz = nz; }
    }
    HIT.depth = best; HIT.nx = bx; HIT.nz = bz;
    return HIT;
  };

  const yawQuat = rot => [Math.cos(-rot / 2), 0, Math.sin(-rot / 2), 0];

  const quatR = (q, R) => {
    const w = q[0], x = q[1], y = q[2], z = q[3];
    R[0] = 1 - 2 * (y * y + z * z); R[1] = 2 * (x * y - w * z); R[2] = 2 * (x * z + w * y);
    R[3] = 2 * (x * y + w * z); R[4] = 1 - 2 * (x * x + z * z); R[5] = 2 * (y * z - w * x);
    R[6] = 2 * (x * z - w * y); R[7] = 2 * (y * z + w * x); R[8] = 1 - 2 * (x * x + y * y);
    return R;
  };

  const worldInv = (R, Ib, o) => {
    const T = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T[i * 3 + j] = R[i * 3] * Ib[j] + R[i * 3 + 1] * Ib[3 + j] + R[i * 3 + 2] * Ib[6 + j];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = T[i * 3] * R[j * 3] + T[i * 3 + 1] * R[j * 3 + 1] + T[i * 3 + 2] * R[j * 3 + 2];
    return o;
  };

  const defOf = rec => BREAK[rec.kind];
  const anchorOf = rec => { const d = defOf(rec); return d.anchorOf ? d.anchorOf(rec.p) : d.anchor; };
  const matOf = rec => { const d = defOf(rec); return d.matOf ? d.matOf(rec.p) : d.mat; };
  const massOf = rec => shapeOf(defOf(rec).whole(rec.p), shapeKey(rec.p, -1)).m;
  const flyOf = rec => { const d = defOf(rec); return d.flyOf ? d.flyOf(rec.p) : d.fly || 0; };
  const DENT = { metal: 1, glass: 0.6, wood: 0.15, concrete: 0.2 };

  const CAP = 768;
  const C = {
    n: 0,
    rx: new Float64Array(CAP), ry: new Float64Array(CAP), rz: new Float64Array(CAP),
    nx: new Float64Array(CAP), ny: new Float64Array(CAP), nz: new Float64Array(CAP),
    d: new Float64Array(CAP), e: new Float64Array(CAP), mu: new Float64Array(CAP),
    vx: new Float64Array(CAP), vy: new Float64Array(CAP), vz: new Float64Array(CAP),
    k: new Float64Array(CAP), acc: new Float64Array(CAP), tgt: new Float64Array(CAP),
    car: new Array(CAP), kind: new Uint8Array(CAP)
  };
  const IW = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const HARD = { acc: 0, kind: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0 };
  const STAT = [];

  const Debris = {
    BREAK, MAT, DENT, shapeKey, shapeOf, anchorOf, matOf, massOf, flyOf,

    dent(b, wx, wy, wz, dx, dy, dz, depth, r) {
      if (!(depth > 0.008)) return;
      const R = b.R, c = b.sh.com, ex = wx - b.x, ey = wy - b.y, ez = wz - b.z;
      const lx = R[0] * ex + R[3] * ey + R[6] * ez + c[0], ly = R[1] * ex + R[4] * ey + R[7] * ez + c[1], lz = R[2] * ex + R[5] * ey + R[8] * ez + c[2];
      let ux = R[0] * dx + R[3] * dy + R[6] * dz, uy = R[1] * dx + R[4] * dy + R[7] * dz, uz = R[2] * dx + R[5] * dy + R[8] * dz;
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul; uy /= ul; uz /= ul;
      const D = b.dents || (b.dents = []);
      b.dentVer = (b.dentVer || 0) + 1;
      for (const q of D) {
        if ((q.x - lx) ** 2 + (q.y - ly) ** 2 + (q.z - lz) ** 2 > (Math.max(q.r, r) * 0.6) ** 2) continue;
        const a = q.d / (q.d + depth);
        q.dx = q.dx * a + ux * (1 - a); q.dy = q.dy * a + uy * (1 - a); q.dz = q.dz * a + uz * (1 - a);
        const ql = Math.hypot(q.dx, q.dy, q.dz) || 1;
        q.dx /= ql; q.dy /= ql; q.dz /= ql;
        q.d = Math.min(0.22, q.d + depth * 0.5);
        q.r = Math.min(0.8, Math.max(q.r, r));
        return;
      }
      if (D.length >= 10) D.shift();
      D.push({ x: lx, y: ly, z: lz, dx: ux, dy: uy, dz: uz, r, d: Math.min(0.22, depth) });
    },

    impactDent(b, wx, wy, wz, dx, dy, dz, speed, scale) {
      const k = DENT[b.mat] || 0.5, depth = Math.min(0.2, speed * 0.011 * k * (scale || 1));
      this.dent(b, wx, wy, wz, dx, dy, dz, depth, Math.min(0.7, 0.2 + depth * 2.4));
    },

    facing(b, dx, dz, y) {
      const P = b.sh.pts, R = b.R;
      let best = null, bs = Infinity;
      for (let i = 0; i < P.length; i += 3) {
        const px = b.x + R[0] * P[i] + R[1] * P[i + 1] + R[2] * P[i + 2], py = b.y + R[3] * P[i] + R[4] * P[i + 1] + R[5] * P[i + 2], pz = b.z + R[6] * P[i] + R[7] * P[i + 1] + R[8] * P[i + 2];
        const sc = px * dx + pz * dz + Math.abs(py - y) * 0.6;
        if (sc < bs) { bs = sc; best = [px, py, pz]; }
      }
      return best;
    },

    piecesOf(rec) {
      const d = defOf(rec);
      return d.pieces ? d.pieces(rec.p) : null;
    },

    spawn(w, rec, boxes, part, mesh, o) {
      const p = rec.p, key = shapeKey(p, part);
      const sh = shapeOf(boxes, key);
      const q = o.q ? o.q.slice() : yawQuat(rec.rot);
      const R = quatR(q, new Float64Array(9));
      const oy = this.yOf(w.city, rec) + (p.lift || 0);
      const ox = o.origin ? o.origin[0] : rec.x, oyy = o.origin ? o.origin[1] : oy, oz = o.origin ? o.origin[2] : rec.z;
      const c = sh.com;
      const b = {
        id: w.nextId++, rec, kind: rec.kind, part, key, mesh, sh, mat: o.mat || matOf(rec),
        x: ox + R[0] * c[0] + R[1] * c[1] + R[2] * c[2], y: oyy + R[3] * c[0] + R[4] * c[1] + R[5] * c[2], z: oz + R[6] * c[0] + R[7] * c[1] + R[8] * c[2],
        q, R, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0,
        sleep: false, restT: 0, t0: w.t, hitT: -9, by: o.by || null, hp: o.hp !== undefined ? o.hp : (defOf(rec).hp || 0), wet: false, hurt: new Set()
      };
      if (o.v) { b.vx = o.v[0]; b.vy = o.v[1]; b.vz = o.v[2]; }
      if (o.w) { b.wx = o.w[0]; b.wy = o.w[1]; b.wz = o.w[2]; }
      w.debris.push(b);
      return b;
    },

    yOf(city, rec) {
      if (rec.y === undefined) rec.y = city.groundY(rec.x, rec.z);
      return rec.y;
    },

    pointVel(b, x, y, z) {
      const rx = x - b.x, ry = y - b.y, rz = z - b.z;
      return [b.vx + b.wy * rz - b.wz * ry, b.vy + b.wz * rx - b.wx * rz, b.vz + b.wx * ry - b.wy * rx];
    },

    impulse(b, jx, jy, jz, px, py, pz) {
      const im = b.sh.im;
      b.vx += jx * im; b.vy += jy * im; b.vz += jz * im;
      const rx = px - b.x, ry = py - b.y, rz = pz - b.z;
      const tx = ry * jz - rz * jy, ty = rz * jx - rx * jz, tz = rx * jy - ry * jx;
      worldInv(b.R, b.sh.Ib, IW);
      b.wx += IW[0] * tx + IW[1] * ty + IW[2] * tz;
      b.wy += IW[3] * tx + IW[4] * ty + IW[5] * tz;
      b.wz += IW[6] * tx + IW[7] * ty + IW[8] * tz;
      b.sleep = false;
      b.restT = 0;
    },

    capSpeed(b, max) {
      const s = Math.hypot(b.vx, b.vy, b.vz);
      if (s > max) { const k = max / s; b.vx *= k; b.vy *= k; b.vz *= k; }
      const a = Math.hypot(b.wx, b.wy, b.wz), am = 28 / Math.max(0.3, b.sh.r);
      if (a > am) { const k = am / a; b.wx *= k; b.wy *= k; b.wz *= k; }
    },

    matrix(b, out) {
      const R = b.R, c = b.sh.com;
      out[0] = R[0]; out[1] = R[1]; out[2] = R[2];
      out[3] = R[3]; out[4] = R[4]; out[5] = R[5];
      out[6] = R[6]; out[7] = R[7]; out[8] = R[8];
      out[9] = b.x - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]);
      out[10] = b.y - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]);
      out[11] = b.z - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2]);
      return out;
    },

    ground(w, x, z) {
      const key = Math.round(x * 2) * 131072 + Math.round(z * 2);
      let y = w.gyCache.get(key);
      if (y === undefined) { y = w.city.groundY(x, z); w.gyCache.set(key, y); }
      return y;
    },

    statics(w, b) {
      STAT.length = 0;
      const r = b.sh.r + 0.2, lo = b.y - b.sh.r;
      w.city.hash.query(b.x - r, b.z - r, b.x + r, b.z + r, it => {
        if (it.y1 < lo) return;
        if (it.brk && w.broken.has(it.brk)) return;
        if (it.walkRoof && b.y - b.sh.r > it.y1 - 0.3) return;
        STAT.push(it);
      });
      return STAT;
    },

    addContact(b, rx, ry, rz, nx, ny, nz, d, e, mu, car, kind) {
      if (C.n >= CAP) return;
      const i = C.n++;
      C.rx[i] = rx; C.ry[i] = ry; C.rz[i] = rz;
      C.nx[i] = nx; C.ny[i] = ny; C.nz[i] = nz;
      C.d[i] = d; C.e[i] = e; C.mu[i] = mu;
      C.car[i] = car;
      C.kind[i] = kind;
      if (car) {
        const wz = car.wz || 0, cx = rx + b.x - car.x, cz = rz + b.z - car.z;
        C.vx[i] = car.vx - wz * cz; C.vy[i] = car.ai && car.ai.mode === 'lane' ? 0 : car.vy || 0; C.vz[i] = car.vz + wz * cx;
      } else { C.vx[i] = 0; C.vy[i] = 0; C.vz[i] = 0; }
      const tx = ry * nz - rz * ny, ty = rz * nx - rx * nz, tz = rx * ny - ry * nx;
      const ax = IW[0] * tx + IW[1] * ty + IW[2] * tz, ay = IW[3] * tx + IW[4] * ty + IW[5] * tz, az = IW[6] * tx + IW[7] * ty + IW[8] * tz;
      const kx = ay * rz - az * ry, ky = az * rx - ax * rz, kz = ax * ry - ay * rx;
      C.k[i] = 1 / (b.sh.im + kx * nx + ky * ny + kz * nz);
      C.acc[i] = 0;
      const rvx = b.vx + b.wy * rz - b.wz * ry - C.vx[i], rvy = b.vy + b.wz * rx - b.wx * rz - C.vy[i], rvz = b.vz + b.wx * ry - b.wy * rx - C.vz[i];
      const vn = rvx * nx + rvy * ny + rvz * nz;
      C.tgt[i] = vn < -1.4 ? -e * vn : 0;
    },

    gather(w, b, cars) {
      C.n = 0;
      const sh = b.sh, P = sh.pts, R = b.R, M = MAT[b.mat] || MAT.metal;
      const stat = this.statics(w, b);
      let wet = null;
      for (let i = 0; i < P.length; i += 3) {
        const lx = P[i], ly = P[i + 1], lz = P[i + 2];
        const rx = R[0] * lx + R[1] * ly + R[2] * lz, ry = R[3] * lx + R[4] * ly + R[5] * lz, rz = R[6] * lx + R[7] * ly + R[8] * lz;
        const px = b.x + rx, py = b.y + ry, pz = b.z + rz;
        const gy = this.ground(w, px, pz);
        if (gy < -0.05 && wet === null) wet = w.city.ground(px, pz) === GT.WATER ? w.city.waterAt(px, pz) : false;
        const dg = gy - py;
        if (dg > -0.004 && !(b.pin && ly + sh.com[1] < 0.4)) this.addContact(b, rx, ry, rz, 0, 1, 0, dg, M.e, M.mu, null, 0);
        for (let s = 0; s < stat.length; s++) {
          const it = stat[s];
          if (px < it.x0 || px > it.x1 || pz < it.z0 || pz > it.z1 || py > it.y1 || py < (it.y0 || 0) - 0.3) continue;
          let c = null;
          if (it.circle) {
            const dx = px - it.x, dz = pz - it.z, d = Math.hypot(dx, dz);
            if (d < it.r && d > 1e-5) c = { depth: it.r - d, nx: dx / d, nz: dz / d };
          } else if (it.poly) c = inside(px, pz, it.poly);
          else c = N.circleBox(px, pz, 0.001, it);
          if (c && c.depth > 0.0015) this.addContact(b, rx, ry, rz, c.nx, 0, c.nz, Math.min(c.depth, 0.6), 0.15, 0.4, null, 1);
        }
        for (let k = 0; k < cars.length; k++) {
          const v = cars[k], o = v.o;
          if (b.pin && b.pin.car === v.v || b.skipCar && b.skipCar.car === v.v && w.t < b.skipCar.until) continue;
          if (py > v.y1 || py < v.y0) continue;
          const dx = px - o.x, dz = pz - o.z;
          const lf = dx * o.fx + dz * o.fz, lr = dx * o.rx + dz * o.rz;
          const pf = o.hl - Math.abs(lf), pr = o.hw - Math.abs(lr);
          if (pf <= 0 || pr <= 0) continue;
          const pt = v.y1 - py;
          if (pt < pf && pt < pr) this.addContact(b, rx, ry, rz, 0, 1, 0, Math.min(pt, 0.5), 0, 0.25, v.v, 2);
          else if (pf < pr) { const s = lf < 0 ? -1 : 1; this.addContact(b, rx, ry, rz, o.fx * s, 0, o.fz * s, Math.min(pf, 0.5), 0.35, 0.3, v.v, 2); }
          else { const s = lr < 0 ? -1 : 1; this.addContact(b, rx, ry, rz, o.rx * s, 0, o.rz * s, Math.min(pr, 0.5), 0.35, 0.3, v.v, 2); }
        }
      }
      return wet;
    },

    pinStep(b, h) {
      const P = b.pin, R = b.R, im = b.sh.im;
      const rx = R[0] * P.lx + R[1] * P.ly + R[2] * P.lz, ry = R[3] * P.lx + R[4] * P.ly + R[5] * P.lz, rz = R[6] * P.lx + R[7] * P.ly + R[8] * P.lz;
      const ex = b.x + rx - P.x, ey = b.y + ry - P.y, ez = b.z + rz - P.z;
      for (let a = 0; a < 3; a++) {
        const nx = a === 0 ? 1 : 0, ny = a === 1 ? 1 : 0, nz = a === 2 ? 1 : 0;
        const vn = (b.vx + b.wy * rz - b.wz * ry) * nx + (b.vy + b.wz * rx - b.wx * rz) * ny + (b.vz + b.wx * ry - b.wy * rx) * nz;
        const err = ex * nx + ey * ny + ez * nz;
        const tx = ry * nz - rz * ny, ty = rz * nx - rx * nz, tz = rx * ny - ry * nx;
        const ax = IW[0] * tx + IW[1] * ty + IW[2] * tz, ay = IW[3] * tx + IW[4] * ty + IW[5] * tz, az = IW[6] * tx + IW[7] * ty + IW[8] * tz;
        const k = 1 / (im + (ay * rz - az * ry) * nx + (az * rx - ax * rz) * ny + (ax * ry - ay * rx) * nz);
        const dj = (-err * 0.25 / h - vn) * k;
        b.vx += nx * dj * im; b.vy += ny * dj * im; b.vz += nz * dj * im;
        b.wx += ax * dj; b.wy += ay * dj; b.wz += az * dj;
      }
    },

    solve(w, b, iters, h) {
      const n = C.n;
      this.carJ = 0;
      if (!n) { if (b.pin) for (let it = 0; it < iters; it++) this.pinStep(b, h); return 0; }
      let ground = 0;
      const im = b.sh.im;
      for (let it = 0; it < iters; it++) {
        if (b.pin) this.pinStep(b, h);
        for (let i = 0; i < n; i++) {
          const rx = C.rx[i], ry = C.ry[i], rz = C.rz[i], nx = C.nx[i], ny = C.ny[i], nz = C.nz[i];
          let rvx = b.vx + b.wy * rz - b.wz * ry - C.vx[i], rvy = b.vy + b.wz * rx - b.wx * rz - C.vy[i], rvz = b.vz + b.wx * ry - b.wy * rx - C.vz[i];
          const vn = rvx * nx + rvy * ny + rvz * nz;
          let dj = (C.tgt[i] - vn) * C.k[i];
          const acc = Math.max(0, C.acc[i] + dj);
          dj = acc - C.acc[i];
          C.acc[i] = acc;
          if (dj !== 0) this.apply(b, nx * dj, ny * dj, nz * dj, rx, ry, rz, i);
          rvx = b.vx + b.wy * rz - b.wz * ry - C.vx[i]; rvy = b.vy + b.wz * rx - b.wx * rz - C.vy[i]; rvz = b.vz + b.wx * ry - b.wy * rx - C.vz[i];
          const vn2 = rvx * nx + rvy * ny + rvz * nz;
          const tx = rvx - nx * vn2, ty = rvy - ny * vn2, tz = rvz - nz * vn2;
          const vt = Math.hypot(tx, ty, tz);
          if (vt < 1e-5 || acc <= 0) continue;
          const ux = tx / vt, uy = ty / vt, uz = tz / vt;
          const cx = ry * uz - rz * uy, cy = rz * ux - rx * uz, cz = rx * uy - ry * ux;
          const ax = IW[0] * cx + IW[1] * cy + IW[2] * cz, ay = IW[3] * cx + IW[4] * cy + IW[5] * cz, az = IW[6] * cx + IW[7] * cy + IW[8] * cz;
          const kt = 1 / (im + (ay * rz - az * ry) * ux + (az * rx - ax * rz) * uy + (ax * ry - ay * rx) * uz);
          const jt = Math.min(vt * kt, C.mu[i] * acc / iters * 1.5);
          this.apply(b, -ux * jt, -uy * jt, -uz * jt, rx, ry, rz, i);
        }
      }
      this.carJ = 0;
      for (let i = 0; i < n; i++) {
        if (C.kind[i] === 0) ground += C.acc[i];
        else if (C.kind[i] === 2) this.carJ += C.acc[i];
      }
      return ground;
    },

    apply(b, jx, jy, jz, rx, ry, rz, i) {
      const im = b.sh.im;
      b.vx += jx * im; b.vy += jy * im; b.vz += jz * im;
      const tx = ry * jz - rz * jy, ty = rz * jx - rx * jz, tz = rx * jy - ry * jx;
      b.wx += IW[0] * tx + IW[1] * ty + IW[2] * tz;
      b.wy += IW[3] * tx + IW[4] * ty + IW[5] * tz;
      b.wz += IW[6] * tx + IW[7] * ty + IW[8] * tz;
      const v = C.car[i];
      if (v && !(v.ai && v.ai.mode === 'lane')) {
        const m = v.spec.mass;
        v.vx -= jx / m; v.vz -= jz / m;
        const dv = Math.hypot(jx, jz) / m;
        if (dv > 0.4 && b.sh.m > 60) { v.hitDv = Math.max(v.hitDv || 0, dv * 4); v.parked = false; }
      }
    },

    separate(b) {
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < C.n; i++) {
        const d = C.d[i] - 0.003;
        if (d <= 0) continue;
        const nx = C.nx[i], ny = C.ny[i], nz = C.nz[i];
        const need = d - (cx * nx + cy * ny + cz * nz);
        if (need > 0) { const k = C.kind[i] === 2 ? 0.9 : 0.8; cx += nx * need * k; cy += ny * need * k; cz += nz * need * k; }
      }
      b.x += cx; b.y += cy; b.z += cz;
    },

    integrate(b, h) {
      b.vy -= N.G * h;
      const air = Math.max(0, 1 - 0.05 * h);
      b.vx *= air; b.vy *= air; b.vz *= air;
      b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      const q = b.q, ox = b.wx, oy = b.wy, oz = b.wz;
      const qw = q[0], qx = q[1], qy = q[2], qz = q[3];
      q[0] = qw + 0.5 * h * (-ox * qx - oy * qy - oz * qz);
      q[1] = qx + 0.5 * h * (ox * qw + oy * qz - oz * qy);
      q[2] = qy + 0.5 * h * (oy * qw + oz * qx - ox * qz);
      q[3] = qz + 0.5 * h * (oz * qw + ox * qy - oy * qx);
      const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
      q[0] /= l; q[1] /= l; q[2] /= l; q[3] /= l;
      quatR(q, b.R);
    },

    nearCars(w, b) {
      const out = [];
      for (const v of w.vehs) {
        if (v.sink > 1) continue;
        const r = b.sh.r + Math.max(v.spec.hl, v.spec.hw) + 0.5;
        if (Math.abs(v.x - b.x) > r || Math.abs(v.z - b.z) > r) continue;
        const H = v.spec.shape.H, y0 = v.y + v.spec.shape.clr * 0.55;
        if (b.y - b.sh.r > v.y + H || b.y + b.sh.r < y0) continue;
        out.push({ v, o: N.Phys.obbOf(v), y0, y1: v.y + H });
      }
      return out;
    },

    stepBody(w, b, dt) {
      const cars = this.nearCars(w, b);
      const moving = cars.some(c => Math.abs(c.v.vx) + Math.abs(c.v.vz) + Math.abs(c.v.wz || 0) > 0.3);
      if (b.sleep) {
        if (!moving) return;
        b.sleep = false;
        b.restT = 0;
      }
      const sp = Math.hypot(b.vx, b.vy, b.vz) + Math.hypot(b.wx, b.wy, b.wz) * b.sh.r;
      const sub = sp > 14 || cars.length ? 4 : 2, h = dt / sub;
      let ground = 0, carJ = 0, touched = false, carTouch = false, wet = null;
      const hard = HARD;
      hard.acc = 0;
      for (let s = 0; s < sub; s++) {
        this.integrate(b, h);
        worldInv(b.R, b.sh.Ib, IW);
        wet = this.gather(w, b, cars);
        if (b.pin && (w.t > b.pin.until || b.R[4] < 0.82)) b.pin = null;
        ground += this.solve(w, b, 4, h);
        carJ += this.carJ;
        for (let i = 0; i < C.n; i++) {
          if (C.kind[i] === 1 || C.acc[i] <= hard.acc) continue;
          hard.acc = C.acc[i]; hard.kind = C.kind[i];
          hard.x = b.x + C.rx[i]; hard.y = b.y + C.ry[i]; hard.z = b.z + C.rz[i];
          hard.nx = C.nx[i]; hard.ny = C.ny[i]; hard.nz = C.nz[i];
        }
        this.separate(b);
        let touch = false;
        for (let i = 0; i < C.n; i++) {
          if (C.kind[i] === 0 || C.kind[i] === 1 && C.ny[i] > 0.5) touch = true;
          else if (C.kind[i] === 2) { carTouch = true; if (!moving) touch = true; }
        }
        if (touch) {
          touched = true;
          const k = Math.max(0, 1 - 1.4 * h);
          b.wx *= k; b.wy *= k; b.wz *= k;
          const kv = Math.max(0, 1 - 0.3 * h);
          b.vx *= kv; b.vz *= kv;
        }
      }
      const rest = touched && !(carTouch && moving);
      this.capSpeed(b, 30);
      const bd = defOf(b.rec);
      if (b.part === -1 && bd.shatter !== undefined && bd.pieces && (carJ * carJ * b.sh.im * 0.5 > bd.shatter || ground * ground * b.sh.im * 0.5 > bd.shatter * 3)) b.burst = true;
      if (wet && b.y < wet.level) this.water(w, b, wet, dt);
      const imp = ground * b.sh.im, cimp = carJ * b.sh.im;
      if (hard.acc > 0 && (imp > 6 || cimp > 5) && w.t - (b.dentT || -9) > 0.25) {
        b.dentT = w.t;
        this.impactDent(b, hard.x, hard.y, hard.z, hard.nx, hard.ny, hard.nz, Math.max(imp - 4, cimp - 3), hard.kind === 2 ? 0.8 : 0.5);
      }
      if (imp > 2.4 && w.t - b.hitT > 0.16) {
        b.hitT = w.t;
        w.emit({ t: 'phit', kind: b.kind, mat: b.mat, x: b.x, y: b.y, z: b.z, f: imp, m: b.sh.m });
      }
      const v2 = b.vx * b.vx + b.vy * b.vy + b.vz * b.vz, w2 = (b.wx * b.wx + b.wy * b.wy + b.wz * b.wz) * b.sh.r * b.sh.r;
      if (rest && v2 < 0.03 && w2 < 0.04) {
        b.restT += dt;
        if (b.restT > 0.45) { b.sleep = true; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; }
      } else b.restT = 0;
      if (b.y < -40 || !isFinite(b.x + b.y + b.z + b.vx + b.vy + b.vz + b.wx + b.wy + b.wz)) b.gone = true;
    },

    water(w, b, wa, dt) {
      if (!b.wet) { b.wet = true; w.emit({ t: 'splash', x: b.x, y: wa.level, z: b.z, big: b.sh.m > 40 }); }
      const k = Math.max(0, 1 - 3 * dt);
      b.vx *= k; b.vz *= k; b.wx *= k; b.wy *= k; b.wz *= k;
      if (b.mat === 'wood') b.vy += (N.G * 1.5 + (wa.level - b.y) * 8) * dt;
      b.vy = Math.max(b.vy * k, -1.2);
      b.sleep = false;
      b.restT = 0;
      if (b.mat !== 'wood' && b.y < wa.bed + 0.4) b.gone = true;
    },

    hitPeds(w, b) {
      const sp = Math.hypot(b.vx, b.vy, b.vz);
      const light = b.sh.m <= 30;
      if (sp < 3.5 && !light) return;
      const r = b.sh.r + 0.4;
      w.near(b.x, b.z, r + 1, e => {
        if (e.kind !== 'ped' || e.veh || e.dead || e.swim) return;
        if (b.y - b.sh.r > e.y + 1.8 || b.y + b.sh.r < e.y) return;
        const P = b.sh.pts, R = b.R;
        let hit = null;
        for (let i = 0; i < P.length; i += 3) {
          const px = b.x + R[0] * P[i] + R[1] * P[i + 1] + R[2] * P[i + 2], py = b.y + R[3] * P[i] + R[4] * P[i + 1] + R[5] * P[i + 2], pz = b.z + R[6] * P[i] + R[7] * P[i + 1] + R[8] * P[i + 2];
          if (py < e.y - 0.05 || py > e.y + 1.75) continue;
          const dx = px - e.x, dz = pz - e.z;
          if (dx * dx + dz * dz < 0.36 * 0.36) { hit = [px, py, pz]; break; }
        }
        if (!hit) return;
        const pv = this.pointVel(b, hit[0], hit[1], hit[2]);
        const rvx = pv[0] - e.vx, rvz = pv[2] - e.vz, rel = Math.hypot(rvx, rvz);
        if (rel > 4 && b.sh.m >= 5 && !b.hurt.has(e)) {
          b.hurt.add(e);
          const mom = b.sh.m * rel;
          const dmg = Math.min(80, b.sh.m * rel * rel / 90);
          if (dmg > 4) w.damagePed(e, dmg, b.by, 'debris', [rvx / rel, rvz / rel]);
          if (mom > 90 && !e.dead) w.knockDown(e, 1.4, rvx * 0.45, rvz * 0.45, 2);
          const k = Math.min(1, 75 / (b.sh.m + 75));
          this.impulse(b, -rvx * b.sh.m * k * 0.6, 0, -rvz * b.sh.m * k * 0.6, hit[0], hit[1], hit[2]);
          return;
        }
        if (!light || e.state === 'down') return;
        const ps = Math.hypot(e.vx, e.vz);
        if (ps < 0.6) return;
        let nx = hit[0] - e.x, nz = hit[2] - e.z;
        const nl = Math.hypot(nx, nz) || 1;
        nx /= nl; nz /= nl;
        const along = (e.vx * nx + e.vz * nz);
        const pvn = pv[0] * nx + pv[2] * nz;
        if (along <= 0 || pvn >= along * 1.2) return;
        const want = along * 1.1 - pvn;
        const j = want * b.sh.m * 0.6;
        this.impulse(b, nx * j, j * 0.12, nz * j, hit[0], (hit[1] + b.y) / 2, hit[2]);
        if (w.t - b.hitT > 0.2) { b.hitT = w.t; w.emit({ t: 'phit', kind: b.kind, mat: b.mat, x: hit[0], y: hit[1], z: hit[2], f: 3, m: b.sh.m }); }
      });
    },

    step(w, dt) {
      w.gyCache.clear();
      const L = w.debris;
      for (let i = 0; i < L.length; i++) {
        const b = L[i];
        this.stepBody(w, b, dt);
        if (!b.sleep || b.sh.m <= 30) this.hitPeds(w, b);
      }
      for (const b of L.filter(o => o.burst && !o.gone)) { b.burst = false; this.shatterBody(w, b); }
      for (let i = L.length - 1; i >= 0; i--) if (L[i].gone) { const b = L[i]; L.splice(i, 1); const st = w.broken.get(b.rec); if (st) st.bodies = st.bodies.filter(o => o !== b); }
      w.debrisT = (w.debrisT || 0) + dt;
      if (w.debrisT > 1) { w.debrisT = 0; this.tidy(w); }
    },

    tidy(w) {
      const pl = w.player, far = (x, z, d) => Math.abs(x - pl.x) > d || Math.abs(z - pl.z) > d;
      for (const [rec, st] of w.broken) {
        if (rec.base && w.broken.has(rec.base)) continue;
        if (w.t - st.t < 20 || !far(rec.x, rec.z, 110)) continue;
        const group = [rec].concat(rec.stack || []);
        let ok = true;
        for (const r of group) {
          const s2 = w.broken.get(r);
          if (!s2) continue;
          if (w.t - s2.t < 20 || !far(r.x, r.z, 110) || s2.bodies.some(b => !far(b.x, b.z, 110))) { ok = false; break; }
        }
        if (ok) for (const r of group) if (w.broken.has(r)) this.restore(w, r);
      }
      const L = w.debris;
      if (L.length > 220) {
        const old = L.filter(b => b.sleep && far(b.x, b.z, 45)).sort((a, b) => a.t0 - b.t0);
        for (const b of old.slice(0, L.length - 200)) this.remove(w, b);
      }
      for (const b of L.slice()) if (b.sleep && far(b.x, b.z, 320)) this.remove(w, b);
    },

    remove(w, b) {
      const i = w.debris.indexOf(b);
      if (i >= 0) w.debris.splice(i, 1);
      const st = w.broken.get(b.rec);
      if (st) st.bodies = st.bodies.filter(o => o !== b);
    },

    restore(w, rec) {
      const st = w.broken.get(rec);
      if (!st) return;
      for (const b of st.bodies) { const i = w.debris.indexOf(b); if (i >= 0) w.debris.splice(i, 1); }
      w.broken.delete(rec);
      rec.hp = defOf(rec).hp || 0;
      w.brkVer++;
    },

    ray(b, ox, oy, oz, dx, dy, dz, tmax) {
      const R = b.R, ex = ox - b.x, ey = oy - b.y, ez = oz - b.z;
      const lx = R[0] * ex + R[3] * ey + R[6] * ez, ly = R[1] * ex + R[4] * ey + R[7] * ez, lz = R[2] * ex + R[5] * ey + R[8] * ez;
      const ux = R[0] * dx + R[3] * dy + R[6] * dz, uy = R[1] * dx + R[4] * dy + R[7] * dz, uz = R[2] * dx + R[5] * dy + R[8] * dz;
      let best = -1;
      for (const q of b.sh.local) {
        const t = N.rayBox(lx, ly, lz, ux, uy, uz, q.x0, q.y0, q.z0, q.x1, q.y1, q.z1, best >= 0 ? best : tmax);
        if (t >= 0 && (best < 0 || t < best)) best = t;
      }
      return best;
    },

    shatterBody(w, b) {
      const pieces = this.piecesOf(b.rec);
      if (!pieces || b.part !== -1 || b.gone) return null;
      const R = b.R, c = b.sh.com;
      const origin = [b.x - (R[0] * c[0] + R[1] * c[1] + R[2] * c[2]), b.y - (R[3] * c[0] + R[4] * c[1] + R[5] * c[2]), b.z - (R[6] * c[0] + R[7] * c[1] + R[8] * c[2])];
      const st = w.broken.get(b.rec);
      this.remove(w, b);
      b.gone = true;
      const out = pieces.map((pc, k) => {
        const nb = this.spawn(w, b.rec, pc.boxes, k, pc.mesh, { by: b.by, q: b.q, origin });
        const v = this.pointVel(b, nb.x, nb.y, nb.z);
        nb.vx = v[0] + (w.rng() - 0.5) * 1.6; nb.vy = v[1] + w.rng() * 1.2; nb.vz = v[2] + (w.rng() - 0.5) * 1.6;
        nb.wx = b.wx + (w.rng() - 0.5) * 5; nb.wy = b.wy + (w.rng() - 0.5) * 5; nb.wz = b.wz + (w.rng() - 0.5) * 5;
        if (st) st.bodies.push(nb);
        return nb;
      });
      w.emit({ t: 'pbreak', kind: b.kind, mat: b.mat, x: b.x, y: b.y, z: b.z, glass: null, pieces: pieces.length, fruit: b.rec.p.fruit || null, e: 0 });
      return out;
    },

    shootProp(w, rec, dmg, hx, hy, hz, dx, dy, dz, by) {
      const d = defOf(rec), J = dmg * 0.35;
      w.emit({ t: 'pshot', kind: rec.kind, mat: matOf(rec), x: hx, y: hy, z: hz });
      if (d.hp) {
        rec.hp -= dmg;
        if (rec.hp <= 0) return w.dislodge(rec, { by, shatter: true, impulse: [dx * J * 2, J * 0.4, dz * J * 2], at: [hx, hy, hz], energy: dmg * 20 });
      }
      if (anchorOf(rec) === 0 && massOf(rec) <= 30) return w.dislodge(rec, { by, impulse: [dx * J, dy * J + J * 0.25, dz * J], at: [hx, hy, hz] });
      return null;
    },

    shootBody(w, b, dmg, hx, hy, hz, dx, dy, dz, by) {
      const J = Math.min(dmg * 0.35 * (b.sh.m < 30 ? 2 : 1), b.sh.m * 3.5);
      if (by) b.by = by;
      this.impulse(b, dx * J, dy * J + J * 0.2, dz * J, hx, hy, hz);
      this.capSpeed(b, 20);
      const k = DENT[b.mat] || 0.5;
      this.dent(b, hx, hy, hz, dx, dy, dz, Math.min(0.05, dmg * 0.0012 * k), 0.09);
      w.emit({ t: 'pshot', kind: b.kind, mat: b.mat, x: hx, y: hy, z: hz });
      if (b.hp > 0) { b.hp -= dmg; if (b.hp <= 0) this.shatterBody(w, b); }
    },

    blast(w, x, y, z, radius, dmg, by) {
      const P = dmg * 200;
      w.city.brkHash.query(x - radius, z - radius, x + radius, z + radius, rec => {
        if (w.broken.has(rec)) return;
        const d = Math.hypot(rec.x - x, this.yOf(w.city, rec) + 0.6 - y, rec.z - z);
        if (d > radius) return;
        const k = 1 - d / radius, E = P * k * k;
        if (E < anchorOf(rec)) return;
        const m = massOf(rec), J = Math.min(m * 15, Math.sqrt(2 * m * E) * 0.22);
        let ax = rec.x - x, az = rec.z - z;
        const L = Math.hypot(ax, az) || 1;
        ax /= L; az /= L;
        const bd = defOf(rec);
        const bodies = w.dislodge(rec, { by, energy: E, shatter: bd.shatter !== undefined && E * 0.3 > bd.shatter, impulse: [ax * J, J * 0.55, az * J], spread: 4 });
        if (bodies) for (const b of bodies) { b.wx += (w.rng() - 0.5) * 3; b.wz += (w.rng() - 0.5) * 3; }
      });
      for (const b of w.debris.slice()) {
        const d = Math.hypot(b.x - x, b.y - y, b.z - z);
        if (d > radius) continue;
        const k = 1 - d / radius, E = P * k * k, m = b.sh.m;
        const J = Math.min(m * 15, Math.sqrt(2 * m * E) * 0.22);
        const ax = (b.x - x) / (d || 1), az = (b.z - z) / (d || 1);
        if (by) b.by = by;
        this.impulse(b, ax * J, J * 0.55, az * J, b.x, b.y + b.sh.r * 0.3, b.z);
        this.capSpeed(b, 24);
        const bd = defOf(b.rec);
        if (bd.shatter !== undefined && E * 0.3 > bd.shatter) this.shatterBody(w, b);
      }
    },

    launch(w, b, rec, o) {
      const v = o.car, dx = o.dir[0], dz = o.dir[1], u = o.u, M = v.spec.mass, y0 = this.yOf(w.city, rec);
      const bump = Math.min(0.6, v.spec.shape.H * 0.36), light = b.sh.m < 60;
      const hy = y0 + (light ? Math.max(bump, b.sh.com[1] * 0.75) : bump);
      const rx = rec.x - b.x, ry = hy - b.y, rz = rec.z - b.z;
      worldInv(b.R, b.sh.Ib, IW);
      const tx = ry * dz, ty = rz * dx - rx * dz, tz = -ry * dx;
      const ax = IW[0] * tx + IW[1] * ty + IW[2] * tz, ay = IW[3] * tx + IW[4] * ty + IW[5] * tz, az = IW[6] * tx + IW[7] * ty + IW[8] * tz;
      const meff = 1 / (b.sh.im + (ay * rz - az * ry) * dx + (ax * ry - ay * rx) * dz);
      const J = 1.2 * u * M / (M + meff) * meff;
      const side = (rec.x - v.x) * -dz + (rec.z - v.z) * dx, sk = N.clamp(side / Math.max(0.3, v.spec.hw), -1, 1) * 0.3;
      this.impulse(b, (dx - dz * sk) * J, J * (light ? 0.22 : 0.1), (dz + dx * sk) * J, rec.x, hy, rec.z);
      b.wy += (w.rng() - 0.5) * 2.4;
      if (!(v.ai && v.ai.mode === 'lane')) { v.vx -= dx * J / M; v.vz -= dz * J / M; }
      this.capSpeed(b, 30);
      b.flown = true;
      b.skipCar = { car: v, until: w.t + 0.25 };
    },

    tip(w, b, rec, o) {
      const c = b.sh.com, dx = o.dir[0], dz = o.dir[1], w0 = N.clamp((o.u || 0) * 0.11, 0.7, 2.0);
      b.pin = { x: rec.x, y: this.yOf(w.city, rec), z: rec.z, lx: -c[0], ly: -c[1], lz: -c[2], until: w.t + 0.7, car: o.car };
      b.wx = dz * w0; b.wy = 0; b.wz = -dx * w0;
      b.vx = dx * w0 * c[1]; b.vy = 0; b.vz = dz * w0 * c[1];
    },

    dislodge(w, rec, o) {
      if (w.broken.has(rec)) return null;
      const d = defOf(rec);
      const st = { t: w.t, bodies: [] };
      w.broken.set(rec, st);
      w.brkVer++;
      const by = o.by || null;
      const pieces = o.shatter && d.pieces ? d.pieces(rec.p) : null;
      if (pieces) {
        pieces.forEach((pc, k) => st.bodies.push(this.spawn(w, rec, pc.boxes, k, pc.mesh, { by })));
      } else st.bodies.push(this.spawn(w, rec, d.whole(rec.p), -1, 'whole', { by }));
      const J = o.impulse, at = o.at;
      if (J) {
        const m = st.bodies.reduce((a, b) => a + b.sh.m, 0);
        for (const b of st.bodies) {
          const k = b.sh.m / m;
          const ax = at ? at[0] : b.x, ay = at ? at[1] : b.y, az = at ? at[2] : b.z;
          this.impulse(b, J[0] * k, J[1] * k, J[2] * k, pieces ? b.x + (ax - b.x) * 0.3 : ax, pieces ? b.y + (ay - b.y) * 0.3 : ay, pieces ? b.z + (az - b.z) * 0.3 : az);
        }
      }
      if (pieces) {
        for (const b of st.bodies) {
          const s = o.spread || 1.6;
          b.vx += (w.rng() - 0.5) * s; b.vy += w.rng() * s * 0.8; b.vz += (w.rng() - 0.5) * s;
          b.wx += (w.rng() - 0.5) * 6; b.wy += (w.rng() - 0.5) * 6; b.wz += (w.rng() - 0.5) * 6;
        }
      }
      for (const b of st.bodies) this.capSpeed(b, 24);
      if (o.car && d.tip && !pieces) {
        if (o.u >= flyOf(rec)) this.launch(w, st.bodies[0], rec, o);
        else this.tip(w, st.bodies[0], rec, o);
      }
      if (o.car) {
        const hy = this.yOf(w.city, rec) + Math.min(0.6, o.car.spec.shape.H * 0.36), dx = o.dir[0], dz = o.dir[1];
        for (const b of st.bodies) {
          const at = d.tip ? [rec.x - dx * 0.06, hy, rec.z - dz * 0.06] : this.facing(b, dx, dz, hy);
          if (at) this.impactDent(b, at[0], at[1], at[2], dx, 0, dz, o.u || 0, d.tip ? 1.1 : 1);
        }
      }
      let gx = null;
      if (d.glass) {
        const bb = d.whole(rec.p);
        const top = bb.reduce((a, b) => (b.y1 > a.y1 ? b : a), bb[0]);
        const R = st.bodies[0].R, lx = (top.x0 + top.x1) / 2, ly = (top.y0 + top.y1) / 2, lz = (top.z0 + top.z1) / 2;
        gx = [rec.x + R[0] * lx + R[2] * lz, this.yOf(w.city, rec) + ly, rec.z + R[6] * lx + R[8] * lz];
      }
      const c = st.bodies[0];
      w.emit({ t: 'pbreak', kind: rec.kind, mat: matOf(rec), x: c.x, y: c.y, z: c.z, glass: gx, pieces: pieces ? pieces.length : 1, fruit: rec.p.fruit || null, e: o.energy || 0 });
      for (const up of rec.stack || []) if (!w.broken.has(up)) this.dislodge(w, up, { by, impulse: J ? [J[0] * 0.05, 0, J[2] * 0.05] : null });
      return st.bodies;
    }
  };

  N.BREAK = BREAK;
  N.Debris = Debris;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
