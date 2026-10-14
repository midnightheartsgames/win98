(function (N) {
  'use strict';

  N.TICK = 1 / 60;
  N.G = 9.81;
  N.CELL = 2;

  N.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  N.lerp = (a, b, t) => a + (b - a) * t;
  N.smooth = (a, b, t) => {
    const x = N.clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  };
  N.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  N.wrap = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  N.angTo = (a, b) => N.wrap(b - a);
  N.turnTo = (a, b, step) => {
    const d = N.wrap(b - a);
    return Math.abs(d) <= step ? b : N.wrap(a + Math.sign(d) * step);
  };
  N.yawOf = (dx, dz) => Math.atan2(dx, -dz);
  N.fx = yaw => Math.sin(yaw);
  N.fz = yaw => -Math.cos(yaw);
  N.dist = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
  N.dist2 = (ax, az, bx, bz) => (bx - ax) * (bx - ax) + (bz - az) * (bz - az);

  N.rng = seed => {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (lo, hi) => lo + (hi - lo) * next();
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    next.pick = arr => arr[Math.floor(next() * arr.length)];
    next.chance = p => next() < p;
    next.weighted = list => {
      let sum = 0;
      for (const it of list) sum += it[1];
      let r = next() * sum;
      for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; }
      return list[list.length - 1][0];
    };
    return next;
  };

  N.hash2 = (x, y, s = 0) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  N.noise2 = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = N.hash2(xi, yi, s), b = N.hash2(xi + 1, yi, s), c = N.hash2(xi, yi + 1, s), d = N.hash2(xi + 1, yi + 1, s);
    return N.lerp(N.lerp(a, b, u), N.lerp(c, d, u), v);
  };

  N.fbm = (x, y, oct, s = 0) => {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < oct; i++) {
      sum += N.noise2(x * f, y * f, s + i * 17) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };

  N.obb = (x, z, yaw, hl, hw) => {
    const fx = Math.sin(yaw), fz = -Math.cos(yaw);
    return { x, z, fx, fz, rx: -fz, rz: fx, hl, hw };
  };

  N.obbCorners = o => [
    [o.x + o.fx * o.hl + o.rx * o.hw, o.z + o.fz * o.hl + o.rz * o.hw],
    [o.x + o.fx * o.hl - o.rx * o.hw, o.z + o.fz * o.hl - o.rz * o.hw],
    [o.x - o.fx * o.hl - o.rx * o.hw, o.z - o.fz * o.hl - o.rz * o.hw],
    [o.x - o.fx * o.hl + o.rx * o.hw, o.z - o.fz * o.hl + o.rz * o.hw]
  ];

  N.boxObb = b => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, fx: 0, fz: -1, rx: 1, rz: 0, hl: (b.z1 - b.z0) / 2, hw: (b.x1 - b.x0) / 2 });

  function project(o, ax, az) {
    const c = o.x * ax + o.z * az;
    const r = Math.abs(o.hl * (o.fx * ax + o.fz * az)) + Math.abs(o.hw * (o.rx * ax + o.rz * az));
    return [c - r, c + r];
  }

  N.satObb = (a, b) => {
    const axes = [[a.fx, a.fz], [a.rx, a.rz], [b.fx, b.fz], [b.rx, b.rz]];
    let best = Infinity, nx = 0, nz = 0;
    for (const [ax, az] of axes) {
      const pa = project(a, ax, az), pb = project(b, ax, az);
      const o = Math.min(pa[1], pb[1]) - Math.max(pa[0], pb[0]);
      if (o <= 0) return null;
      if (o < best) {
        best = o;
        const d = (b.x - a.x) * ax + (b.z - a.z) * az;
        nx = d > 0 ? -ax : ax;
        nz = d > 0 ? -az : az;
      }
    }
    return { depth: best, nx, nz };
  };

  N.contactPoint = (a, b, nx, nz) => {
    let best = -Infinity, px = a.x, pz = a.z;
    for (const [cx, cz] of N.obbCorners(a)) {
      const d = -(cx * nx + cz * nz);
      if (d > best) { best = d; px = cx; pz = cz; }
    }
    let best2 = -Infinity, qx = b.x, qz = b.z;
    for (const [cx, cz] of N.obbCorners(b)) {
      const d = cx * nx + cz * nz;
      if (d > best2) { best2 = d; qx = cx; qz = cz; }
    }
    const inA = N.pointInObb(a, qx, qz), inB = N.pointInObb(b, px, pz);
    if (inB && !inA) return [px, pz];
    if (inA && !inB) return [qx, qz];
    return [(px + qx) / 2, (pz + qz) / 2];
  };

  N.pointInObb = (o, x, z) => {
    const dx = x - o.x, dz = z - o.z;
    return Math.abs(dx * o.fx + dz * o.fz) <= o.hl + 0.01 && Math.abs(dx * o.rx + dz * o.rz) <= o.hw + 0.01;
  };

  N.circleObb = (cx, cz, r, o) => {
    const dx = cx - o.x, dz = cz - o.z;
    const lf = dx * o.fx + dz * o.fz, lr = dx * o.rx + dz * o.rz;
    const qf = N.clamp(lf, -o.hl, o.hl), qr = N.clamp(lr, -o.hw, o.hw);
    const px = o.x + o.fx * qf + o.rx * qr, pz = o.z + o.fz * qf + o.rz * qr;
    let ex = cx - px, ez = cz - pz;
    const d = Math.hypot(ex, ez);
    if (d >= r) return null;
    if (d > 1e-5) return { depth: r - d, nx: ex / d, nz: ez / d, px, pz };
    const pf = o.hl - Math.abs(lf), pr = o.hw - Math.abs(lr);
    if (pf < pr) { const s = Math.sign(lf) || 1; return { depth: pf + r, nx: o.fx * s, nz: o.fz * s, px, pz }; }
    const s = Math.sign(lr) || 1;
    return { depth: pr + r, nx: o.rx * s, nz: o.rz * s, px, pz };
  };

  N.circleBox = (cx, cz, r, b) => {
    const px = N.clamp(cx, b.x0, b.x1), pz = N.clamp(cz, b.z0, b.z1);
    const ex = cx - px, ez = cz - pz;
    const d2 = ex * ex + ez * ez;
    if (d2 >= r * r) return null;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); return { depth: r - d, nx: ex / d, nz: ez / d }; }
    const l = cx - b.x0, rr = b.x1 - cx, t = cz - b.z0, bb = b.z1 - cz;
    const m = Math.min(l, rr, t, bb);
    if (m === l) return { depth: l + r, nx: -1, nz: 0 };
    if (m === rr) return { depth: rr + r, nx: 1, nz: 0 };
    if (m === t) return { depth: t + r, nx: 0, nz: -1 };
    return { depth: bb + r, nx: 0, nz: 1 };
  };

  N.rayBox = (ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1, tmax) => {
    let tmin = 0, tm = tmax;
    const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) {
        if (o[i] < lo[i] || o[i] > hi[i]) return -1;
      } else {
        let t1 = (lo[i] - o[i]) / d[i], t2 = (hi[i] - o[i]) / d[i];
        if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
        if (t1 > tmin) tmin = t1;
        if (t2 < tm) tm = t2;
        if (tmin > tm) return -1;
      }
    }
    return tmin;
  };

  N.rayObb3 = (ox, oy, oz, dx, dy, dz, o, y0, y1, tmax) => {
    const lx = ox - o.x, lz = oz - o.z;
    const lox = lx * o.rx + lz * o.rz, loz = lx * o.fx + lz * o.fz;
    const ldx = dx * o.rx + dz * o.rz, ldz = dx * o.fx + dz * o.fz;
    return N.rayBox(lox, oy, loz, ldx, dy, ldz, -o.hw, y0, -o.hl, o.hw, y1, o.hl, tmax);
  };

  N.rayCylinder = (ox, oy, oz, dx, dy, dz, cx, cz, r, y0, y1, tmax) => {
    const px = ox - cx, pz = oz - cz;
    const a = dx * dx + dz * dz;
    if (a < 1e-9) return -1;
    const b = px * dx + pz * dz, c = px * px + pz * pz - r * r;
    const disc = b * b - a * c;
    if (disc < 0) return -1;
    const sq = Math.sqrt(disc);
    let t = (-b - sq) / a;
    if (t < 0) t = (-b + sq) / a;
    if (t < 0 || t > tmax) return -1;
    const y = oy + dy * t;
    if (y < y0 || y > y1) return -1;
    return t;
  };

  N.polyArea = p => {
    let a = 0;
    for (let i = 0, n = p.length; i < n; i += 2) { const j = (i + 2) % n; a += p[i] * p[j + 1] - p[j] * p[i + 1]; }
    return a / 2;
  };

  N.pointInPoly = (p, x, z) => {
    let c = false;
    for (let i = 0, n = p.length, j = n - 2; i < n; j = i, i += 2) {
      const ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1];
      if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) c = !c;
    }
    return c;
  };

  N.polyBounds = p => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < z0) z0 = p[i + 1]; if (p[i + 1] > z1) z1 = p[i + 1]; }
    return { x0, z0, x1, z1 };
  };

  N.segDist2 = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    let t = L2 > 1e-12 ? ((px - ax) * dx + (pz - az) * dz) / L2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const x = ax + dx * t - px, z = az + dz * t - pz;
    return [x * x + z * z, t];
  };

  N.segSegDist = (ax, az, bx, bz, cx, cz, dx, dz) => {
    const s1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), s2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
    const s3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), s4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
    if (s1 * s2 < 0 && s3 * s4 < 0) return 0;
    return Math.sqrt(Math.min(N.segDist2(ax, az, cx, cz, dx, dz)[0], N.segDist2(bx, bz, cx, cz, dx, dz)[0], N.segDist2(cx, cz, ax, az, bx, bz)[0], N.segDist2(dx, dz, ax, az, bx, bz)[0]));
  };

  N.circlePoly = (cx, cz, r, p) => {
    const n = p.length;
    let inside = true, best = Infinity, bnx = 0, bnz = 0, cd2 = Infinity, qx = 0, qz = 0;
    for (let i = 0; i < n; i += 2) {
      const j = (i + 2) % n;
      const ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1];
      const ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez) || 1;
      const nx = ez / L, nz = -ex / L;
      const s = (cx - ax) * nx + (cz - az) * nz;
      if (s > 0) inside = false;
      if (-s < best) { best = -s; bnx = nx; bnz = nz; }
      const [d2, t] = N.segDist2(cx, cz, ax, az, bx, bz);
      if (d2 < cd2) { cd2 = d2; qx = ax + ex * t; qz = az + ez * t; }
    }
    if (inside) return { depth: best + r, nx: bnx, nz: bnz, px: qx, pz: qz };
    if (cd2 >= r * r) return null;
    const d = Math.sqrt(cd2) || 1e-6;
    return { depth: r - d, nx: (cx - qx) / d, nz: (cz - qz) / d, px: qx, pz: qz };
  };

  function projPoly(p, ax, az) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.length; i += 2) { const v = p[i] * ax + p[i + 1] * az; if (v < lo) lo = v; if (v > hi) hi = v; }
    return [lo, hi];
  }

  N.satObbPoly = (o, p) => {
    const axes = [o.fx, o.fz, o.rx, o.rz];
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n;
      const ex = p[j] - p[i], ez = p[j + 1] - p[i + 1], L = Math.hypot(ex, ez);
      if (L > 1e-6) axes.push(ez / L, -ex / L);
    }
    let pcx = 0, pcz = 0;
    for (let i = 0; i < p.length; i += 2) { pcx += p[i]; pcz += p[i + 1]; }
    pcx /= p.length / 2; pcz /= p.length / 2;
    let best = Infinity, nx = 0, nz = 0;
    for (let k = 0; k < axes.length; k += 2) {
      const ax = axes[k], az = axes[k + 1];
      const pa = project(o, ax, az), pb = projPoly(p, ax, az);
      const ov = Math.min(pa[1], pb[1]) - Math.max(pa[0], pb[0]);
      if (ov <= 0) return null;
      if (ov < best) {
        best = ov;
        const d = (o.x - pcx) * ax + (o.z - pcz) * az;
        nx = d >= 0 ? ax : -ax;
        nz = d >= 0 ? az : -az;
      }
    }
    return { depth: best, nx, nz };
  };

  N.contactObbPoly = (o, p, nx, nz) => {
    let best = Infinity, px = o.x, pz = o.z;
    for (const [cx, cz] of N.obbCorners(o)) {
      const d = cx * nx + cz * nz;
      if (d < best && N.pointInPoly(p, cx, cz)) { best = d; px = cx; pz = cz; }
    }
    if (best < Infinity) return [px, pz];
    let bd = -Infinity;
    for (let i = 0; i < p.length; i += 2) {
      const d = -(p[i] * nx + p[i + 1] * nz);
      if (d > bd && N.pointInObb(o, p[i], p[i + 1])) { bd = d; px = p[i]; pz = p[i + 1]; }
    }
    return [px, pz];
  };

  N.rayPoly = (ox, oy, oz, dx, dy, dz, p, y0, y1, tmax) => {
    let t0 = 0, t1 = tmax;
    if (Math.abs(dy) < 1e-9) { if (oy < y0 || oy > y1) return -1; }
    else {
      let a = (y0 - oy) / dy, b = (y1 - oy) / dy;
      if (a > b) { const s = a; a = b; b = s; }
      if (a > t0) t0 = a;
      if (b < t1) t1 = b;
      if (t0 > t1) return -1;
    }
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n;
      const ex = p[j] - p[i], ez = p[j + 1] - p[i + 1];
      const nx = ez, nz = -ex;
      const num = (p[i] - ox) * nx + (p[i + 1] - oz) * nz;
      const den = dx * nx + dz * nz;
      if (Math.abs(den) < 1e-12) { if (num < 0) return -1; continue; }
      const t = num / den;
      if (den < 0) { if (t > t0) t0 = t; } else if (t < t1) t1 = t;
      if (t0 > t1) return -1;
    }
    return t0;
  };

  N.triangulate = p => {
    const n = p.length / 2;
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    const out = [];
    const sign = N.polyArea(p) >= 0 ? 1 : -1;
    const X = i => p[i * 2], Z = i => p[i * 2 + 1];
    const cross = (a, b, c) => ((X(b) - X(a)) * (Z(c) - Z(a)) - (Z(b) - Z(a)) * (X(c) - X(a))) * sign;
    const inTri = (a, b, c, q) => cross(a, b, q) >= -1e-9 && cross(b, c, q) >= -1e-9 && cross(c, a, q) >= -1e-9;
    let guard = 0;
    while (idx.length > 3 && guard++ < n * n + 10) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const a = idx[(k + idx.length - 1) % idx.length], b = idx[k], c = idx[(k + 1) % idx.length];
        if (cross(a, b, c) <= 1e-9) continue;
        let ok = true;
        for (const q of idx) { if (q === a || q === b || q === c) continue; if (inTri(a, b, c, q)) { ok = false; break; } }
        if (!ok) continue;
        out.push(a, b, c);
        idx.splice(k, 1);
        cut = true;
        break;
      }
      if (!cut) { const a = idx[0]; for (let k = 1; k + 1 < idx.length; k++) out.push(a, idx[k], idx[k + 1]); idx.length = 0; break; }
    }
    if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
    return out;
  };

  N.convexParts = p => {
    const tri = N.triangulate(p);
    let parts = [];
    for (let i = 0; i < tri.length; i += 3) parts.push([tri[i], tri[i + 1], tri[i + 2]]);
    const convex = poly => {
      let s = 0;
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length], c = poly[(k + 2) % poly.length];
        const cr = (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
        if (Math.abs(cr) < 1e-9) continue;
        const sg = cr > 0 ? 1 : -1;
        if (s === 0) s = sg; else if (sg !== s) return false;
      }
      return true;
    };
    let merged = true;
    while (merged && parts.length > 1) {
      merged = false;
      outer: for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const A = parts[i], B = parts[j];
          for (let a = 0; a < A.length; a++) {
            const u = A[a], v = A[(a + 1) % A.length];
            const b = B.findIndex((w, k) => w === v && B[(k + 1) % B.length] === u);
            if (b < 0) continue;
            const joined = [];
            for (let k = 0; k < A.length; k++) { joined.push(A[(a + 1 + k) % A.length]); }
            joined.pop();
            for (let k = 0; k < B.length - 1; k++) joined.push(B[(b + 1 + k) % B.length]);
            if (!convex(joined)) continue;
            parts[i] = joined;
            parts.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
    return parts.map(q => { const o = []; for (const k of q) o.push(p[k * 2], p[k * 2 + 1]); return N.polyArea(o) < 0 ? N.reversePoly(o) : o; });
  };

  N.reversePoly = p => { const o = []; for (let i = p.length - 2; i >= 0; i -= 2) o.push(p[i], p[i + 1]); return o; };

  N.clipHalf = (p, nx, nz, c) => {
    const out = [];
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n;
      const px = p[i], pz = p[i + 1], qx = p[j], qz = p[j + 1];
      const dp = c - (nx * px + nz * pz), dq = c - (nx * qx + nz * qz);
      if (dp >= 0) out.push(px, pz);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push(px + (qx - px) * t, pz + (qz - pz) * t); }
    }
    return out.length >= 6 && Math.abs(N.polyArea(out)) > 0.5 ? out : null;
  };

  N.rayPolyDist = (p, x, z, dx, dz) => {
    let best = Infinity;
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n;
      const ex = p[j] - p[i], ez = p[j + 1] - p[i + 1];
      const den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-12) continue;
      const wx = p[i] - x, wz = p[i + 1] - z;
      const t = (wx * ez - wz * ex) / den, s = (wx * dz - wz * dx) / den;
      if (t > 0 && s >= 0 && s <= 1 && t < best) best = t;
    }
    return best;
  };

  N.cumLen = pts => {
    const n = pts.length / 2, c = new Float64Array(n);
    for (let i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
    return c;
  };

  N.plineAt = (pts, cum, s) => {
    const n = cum.length;
    if (n < 2) return { x: pts[0], z: pts[1], dx: 1, dz: 0 };
    s = s < 0 ? 0 : s > cum[n - 1] ? cum[n - 1] : s;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const L = cum[hi] - cum[lo];
    const t = L > 1e-9 ? (s - cum[lo]) / L : 0;
    const ax = pts[lo * 2], az = pts[lo * 2 + 1], bx = pts[hi * 2], bz = pts[hi * 2 + 1];
    const dx = bx - ax, dz = bz - az, dl = Math.hypot(dx, dz) || 1;
    return { x: ax + dx * t, z: az + dz * t, dx: dx / dl, dz: dz / dl, i: lo };
  };

  N.trimPline = (pts, s0, s1) => {
    const cum = N.cumLen(pts);
    const L = cum[cum.length - 1];
    s0 = N.clamp(s0, 0, L); s1 = N.clamp(s1, 0, L);
    if (s1 - s0 < 0.05) { const p = N.plineAt(pts, cum, (s0 + s1) / 2); return [p.x - p.dx * 0.025, p.z - p.dz * 0.025, p.x + p.dx * 0.025, p.z + p.dz * 0.025]; }
    const a = N.plineAt(pts, cum, s0), b = N.plineAt(pts, cum, s1);
    const out = [a.x, a.z];
    for (let i = 1; i < cum.length - 1; i++) if (cum[i] > s0 + 0.01 && cum[i] < s1 - 0.01) out.push(pts[i * 2], pts[i * 2 + 1]);
    out.push(b.x, b.z);
    return out;
  };

  N.offsetPline = (pts, off) => {
    const n = pts.length / 2;
    const out = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      let nx = 0, nz = 0, cnt = 0;
      const seg = (a, b) => { const dx = pts[b * 2] - pts[a * 2], dz = pts[b * 2 + 1] - pts[a * 2 + 1], L = Math.hypot(dx, dz); return L > 1e-9 ? [-dz / L, dx / L] : null; };
      const s0 = i > 0 ? seg(i - 1, i) : null, s1 = i < n - 1 ? seg(i, i + 1) : null;
      if (s0) { nx += s0[0]; nz += s0[1]; cnt++; }
      if (s1) { nx += s1[0]; nz += s1[1]; cnt++; }
      const L = Math.hypot(nx, nz) || 1;
      nx /= L; nz /= L;
      let k = 1;
      if (s0 && s1) { const c = nx * s0[0] + nz * s0[1]; k = c > 0.35 ? 1 / c : 1 / 0.35; }
      out[i * 2] = pts[i * 2] + nx * off * k;
      out[i * 2 + 1] = pts[i * 2 + 1] + nz * off * k;
    }
    return out;
  };

  class SpatialHash {
    constructor(cell) {
      this.cell = cell;
      this.map = new Map();
      this.stamp = 1;
    }
    key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
    insert(item) {
      const c = this.cell;
      const ix0 = Math.floor(item.x0 / c), ix1 = Math.floor(item.x1 / c);
      const iz0 = Math.floor(item.z0 / c), iz1 = Math.floor(item.z1 / c);
      item._q = 0;
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          const k = this.key(ix, iz);
          let arr = this.map.get(k);
          if (!arr) { arr = []; this.map.set(k, arr); }
          arr.push(item);
        }
      }
    }
    remove(item) {
      const c = this.cell;
      const ix0 = Math.floor(item.x0 / c), ix1 = Math.floor(item.x1 / c);
      const iz0 = Math.floor(item.z0 / c), iz1 = Math.floor(item.z1 / c);
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          const arr = this.map.get(this.key(ix, iz));
          if (!arr) continue;
          const i = arr.indexOf(item);
          if (i >= 0) arr.splice(i, 1);
        }
      }
    }
    query(x0, z0, x1, z1, fn) {
      const c = this.cell;
      const s = ++this.stamp;
      const ix0 = Math.floor(x0 / c), ix1 = Math.floor(x1 / c);
      const iz0 = Math.floor(z0 / c), iz1 = Math.floor(z1 / c);
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          const arr = this.map.get(this.key(ix, iz));
          if (!arr) continue;
          for (let i = 0; i < arr.length; i++) {
            const it = arr[i];
            if (it._q === s) continue;
            it._q = s;
            if (it.x1 < x0 || it.x0 > x1 || it.z1 < z0 || it.z0 > z1) continue;
            if (fn(it) === true) return true;
          }
        }
      }
      return false;
    }
  }
  N.SpatialHash = SpatialHash;

  N.money = v => {
    const s = String(Math.max(0, Math.floor(Math.abs(v))));
    return (v < 0 ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' р.';
  };
  N.pad = (v, n) => String(Math.max(0, Math.floor(v))).padStart(n, '0');
  N.clock = mins => {
    const m = ((Math.floor(mins) % 1440) + 1440) % 1440;
    return N.pad(m / 60, 2) + ':' + N.pad(m % 60, 2);
  };

  N.plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
