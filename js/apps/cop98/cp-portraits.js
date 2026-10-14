(function (C) {
  'use strict';
  const { clamp, lerp, smoothstep } = C;

  const hash3 = (x, y, z) => {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, yi, zi), b = hash3(xi + 1, yi, zi), c = hash3(xi, yi + 1, zi), d = hash3(xi + 1, yi + 1, zi);
    const e = hash3(xi, yi, zi + 1), f = hash3(xi + 1, yi, zi + 1), g = hash3(xi, yi + 1, zi + 1), h = hash3(xi + 1, yi + 1, zi + 1);
    const x0 = a + (b - a) * u, x1 = c + (d - c) * u, x2 = e + (f - e) * u, x3 = g + (h - g) * u;
    const y0 = x0 + (x1 - x0) * v, y1 = x2 + (x3 - x2) * v;
    return y0 + (y1 - y0) * w;
  }
  const fbm3 = (x, y, z, oct) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { s += a * noise3(x, y, z); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; } return s / n; };

  const smin = (a, b, k) => { if (k <= 0) return a < b ? a : b; const h = Math.max(k - Math.abs(a - b), 0) / k; return (a < b ? a : b) - h * h * k * 0.25; };
  const smax = (a, b, k) => -smin(-a, -b, k);
  const gauss = (d, r) => Math.exp(-(d * d) / (r * r));
  const d3 = (x, y, z, c) => Math.hypot(x - c[0], y - c[1], z - c[2]);
  const col = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  function rotM(rx, ry, rz) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    return [
      cy * cz, -cy * sz, sy,
      sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy,
      -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy
    ];
  }
  const tr = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

  const SPH = 0, ELL = 1, CAP = 2, BOX = 3, TOR = 4, CYL = 5, LID = 6;
  const sph = (c, r) => ({ t: SPH, cx: c[0], cy: c[1], cz: c[2], r, bc: c, br: r });
  const ell = (c, r, rot) => ({ t: ELL, cx: c[0], cy: c[1], cz: c[2], rx: r[0], ry: r[1], rz: r[2], m: rot ? tr(rotM(rot[0], rot[1], rot[2])) : null, bc: c, br: Math.max(r[0], r[1], r[2]) });
  function cap(a, b, ra, rb = ra) {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb;
    return { t: CAP, ax: a[0], ay: a[1], az: a[2], bax, bay, baz, l2, rr, a2: l2 - rr * rr, il2: 1 / l2, ra, rb, bc: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], br: Math.sqrt(l2) / 2 + Math.max(ra, rb) };
  }
  const box = (c, h, r, rot) => ({ t: BOX, cx: c[0], cy: c[1], cz: c[2], hx: h[0], hy: h[1], hz: h[2], r, m: rot ? tr(rotM(rot[0], rot[1], rot[2])) : null, bc: c, br: Math.hypot(h[0], h[1], h[2]) });
  const tor = (c, R, r, rot) => ({ t: TOR, cx: c[0], cy: c[1], cz: c[2], R, r, m: rot ? tr(rotM(rot[0], rot[1], rot[2])) : null, bc: c, br: R + r });
  const cyl = (c, r, h, rot, round = 0) => ({ t: CYL, cx: c[0], cy: c[1], cz: c[2], r, h, rd: round, m: rot ? tr(rotM(rot[0], rot[1], rot[2])) : null, bc: c, br: Math.hypot(r, h) });
  const cut = (solid, hole) => ({ t: LID, solid, hole, bc: solid.bc, br: solid.br });

  function primDist(p, x, y, z) {
    if (p.t === LID) return Math.max(primDist(p.solid, x, y, z), -primDist(p.hole, x, y, z));
    if (p.t === CAP) {
      const pax = x - p.ax, pay = y - p.ay, paz = z - p.az;
      const yy = pax * p.bax + pay * p.bay + paz * p.baz, zz = yy - p.l2;
      const qx = pax * p.l2 - p.bax * yy, qy = pay * p.l2 - p.bay * yy, qz = paz * p.l2 - p.baz * yy;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * p.l2, z2 = zz * zz * p.l2;
      const k = Math.sign(p.rr) * p.rr * p.rr * x2;
      if (Math.sign(zz) * p.a2 * z2 > k) return Math.sqrt(x2 + z2) * p.il2 - p.rb;
      if (Math.sign(yy) * p.a2 * y2 < k) return Math.sqrt(x2 + y2) * p.il2 - p.ra;
      return (Math.sqrt(x2 * p.a2 * p.il2) + yy * p.rr) * p.il2 - p.ra;
    }
    let dx = x - p.cx, dy = y - p.cy, dz = z - p.cz;
    if (p.t === SPH) return Math.sqrt(dx * dx + dy * dy + dz * dz) - p.r;
    const m = p.m;
    if (m) { const lx = m[0] * dx + m[1] * dy + m[2] * dz, ly = m[3] * dx + m[4] * dy + m[5] * dz, lz = m[6] * dx + m[7] * dy + m[8] * dz; dx = lx; dy = ly; dz = lz; }
    if (p.t === ELL) {
      const ax = dx / p.rx, ay = dy / p.ry, az = dz / p.rz, bx = ax / p.rx, by = ay / p.ry, bz = az / p.rz;
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az), k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      return k1 < 1e-9 ? -Math.min(p.rx, p.ry, p.rz) : k0 * (k0 - 1) / k1;
    }
    if (p.t === BOX) {
      const qx = Math.abs(dx) - p.hx + p.r, qy = Math.abs(dy) - p.hy + p.r, qz = Math.abs(dz) - p.hz + p.r;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - p.r;
    }
    if (p.t === TOR) { const qx = Math.hypot(dx, dz) - p.R; return Math.hypot(qx, dy) - p.r; }
    const ex = Math.hypot(dx, dz) - p.r + p.rd, ey = Math.abs(dy) - p.h + p.rd;
    return Math.min(Math.max(ex, ey), 0) + Math.hypot(Math.max(ex, 0), Math.max(ey, 0)) - p.rd;
  }

  class Body {
    constructor(frame, mat, name) { this.frame = frame; this.mat = mat; this.name = name; this.parts = []; this.clips = []; this.dispAmp = 0; this.relax = 1; this.base = null; this.offset = 0; }
    shell(of, offset) { this.base = of; this.offset = offset; return this; }
    add(p, k = 0, mir = false) { this.parts.push({ p, k, mir, sub: false }); return this; }
    sub(p, k = 0, mir = false) { this.parts.push({ p, k, mir, sub: true }); return this; }
    clip(fn) { this.clips.push(fn); return this; }
    disp(amp, freq, seed = 1, oct = 2) { this.dispAmp = amp; this.dispFreq = freq; this.dispSeed = seed; this.dispOct = oct; this.relax = 0.7; return this; }
    finish() {
      let cx = 0, cy = 0, cz = 0, n = 0;
      const ctrs = [];
      for (const q of this.parts) if (!q.sub) { ctrs.push([q.p.bc, q.p.br]); if (q.mir) ctrs.push([[-q.p.bc[0], q.p.bc[1], q.p.bc[2]], q.p.br]); }
      if (this.base) { const b = this.base; ctrs.push([[(b.lo[0] + b.hi[0]) / 2, (b.lo[1] + b.hi[1]) / 2, (b.lo[2] + b.hi[2]) / 2], Math.hypot(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]) / 2 + this.offset]); }
      for (const [c] of ctrs) { cx += c[0]; cy += c[1]; cz += c[2]; n++; }
      cx /= n; cy /= n; cz /= n;
      let r = 0;
      const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], pad = this.dispAmp * 1.5 + 0.004;
      for (const [c, br] of ctrs) {
        r = Math.max(r, Math.hypot(c[0] - cx, c[1] - cy, c[2] - cz) + br);
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], c[k] - br - pad); hi[k] = Math.max(hi[k], c[k] + br + pad); }
      }
      this.bc = [cx, cy, cz]; this.br = r + pad; this.lo = lo; this.hi = hi;
      return this;
    }
    dist(x, y, z) {
      let d = this.base ? this.base.dist(x, y, z) - this.offset : 1e9;
      const ps = this.parts, ax = x < 0 ? -x : x;
      for (let i = 0; i < ps.length; i++) {
        const q = ps[i], p = q.p, xx = q.mir ? ax : x;
        const bx = xx - p.bc[0], by = y - p.bc[1], bz = z - p.bc[2];
        const lb = Math.sqrt(bx * bx + by * by + bz * bz) - p.br;
        if (q.sub) { if (lb > q.k) continue; const e = primDist(p, xx, y, z); d = q.k > 0 ? smax(d, -e, q.k) : Math.max(d, -e); }
        else { if (lb > d + q.k) continue; d = smin(d, primDist(p, xx, y, z), q.k); }
      }
      for (let i = 0; i < this.clips.length; i++) d = Math.max(d, this.clips[i](x, y, z));
      if (this.dispAmp && d < this.dispAmp * 3) d += this.dispAmp * (fbm3(x * this.dispFreq, y * this.dispFreq, z * this.dispFreq + this.dispSeed, this.dispOct) - 0.5) * 2;
      return d;
    }
  }

  class Frame {
    constructor(rx, ry, rz, t) { this.m = rotM(rx, ry, rz); this.t = t; }
    toLocal(x, y, z, out) {
      const m = this.m, dx = x - this.t[0], dy = y - this.t[1], dz = z - this.t[2];
      out[0] = m[0] * dx + m[3] * dy + m[6] * dz; out[1] = m[1] * dx + m[4] * dy + m[7] * dz; out[2] = m[2] * dx + m[5] * dy + m[8] * dz;
    }
    toWorld(v) { const m = this.m; return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + this.t[0], m[3] * v[0] + m[4] * v[1] + m[5] * v[2] + this.t[1], m[6] * v[0] + m[7] * v[1] + m[8] * v[2] + this.t[2]]; }
    dirToLocal(v) { const m = this.m; return [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]]; }
  }

  class Scene {
    constructor() { this.frames = []; this.bodies = []; this.loc = []; this.bd = null; this.done = null; }
    frame(rx, ry, rz, t) { const f = new Frame(rx, ry, rz, t); f.i = this.frames.length; this.frames.push(f); this.loc.push([0, 0, 0]); return f; }
    body(frame, mat, name) { const b = new Body(frame, mat, name); this.bodies.push(b); return b; }
    finish() { this.bodies = this.bodies.filter(b => b.parts.length || b.base); for (const b of this.bodies) { b.finish(); b.wc = b.frame.toWorld(b.bc); } this.bd = new Float64Array(this.bodies.length); this.done = new Uint8Array(this.bodies.length); return this; }
    locals(x, y, z) { for (let i = 0; i < this.frames.length; i++) this.frames[i].toLocal(x, y, z, this.loc[i]); }
    dist(x, y, z) {
      this.locals(x, y, z);
      const bs = this.bodies, n = bs.length, bd = this.bd, done = this.done;
      for (let i = 0; i < n; i++) {
        const b = bs[i], L = this.loc[b.frame.i], lo = b.lo, hi = b.hi;
        const dx = Math.max(lo[0] - L[0], 0, L[0] - hi[0]), dy = Math.max(lo[1] - L[1], 0, L[1] - hi[1]), dz = Math.max(lo[2] - L[2], 0, L[2] - hi[2]);
        bd[i] = Math.sqrt(dx * dx + dy * dy + dz * dz); done[i] = 0;
      }
      let best = 1e9;
      for (;;) {
        let k = -1, m = 1e9;
        for (let i = 0; i < n; i++) if (!done[i] && bd[i] < m) { m = bd[i]; k = i; }
        if (k < 0 || m > best) break;
        done[k] = 1;
        const b = bs[k], L = this.loc[b.frame.i];
        const d = b.dist(L[0], L[1], L[2]) * b.relax;
        if (d < best) best = d;
      }
      return best;
    }
    nearest(x, y, z) {
      this.locals(x, y, z);
      let best = 1e9, hit = null;
      for (const b of this.bodies) { const L = this.loc[b.frame.i]; const d = b.dist(L[0], L[1], L[2]); if (d < best) { best = d; hit = b; } }
      return hit;
    }
  }

  const skinTone = L => { const c = col(L.skin || 0xc49474), l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return mix3(c, [l, l, l], 0.2); };
  const HAIR_SPEC = { spec: 0.18, shin: 26 };

  function skinMat(L, head) {
    const base = skinTone(L), hair = col(L.facialColor || L.hair || 0x2a2018), stub = L.stubble == null ? 0.25 : L.stubble;
    const bald = L.hairStyle === 'bald', scalpTint = mix3(base, mul3(hair, 0.9), 0.35);
    const pale = L.pale || 0;
    return (lx, ly, lz) => {
      let c = base;
      const ax = Math.abs(lx);
      const red = gauss(d3(ax, ly, lz, [0, -0.027, 0.1]), 0.016) * 0.4 + gauss(d3(ax, ly, lz, [0.046, -0.03, 0.058]), 0.024) * 0.25 + gauss(d3(ax, ly, lz, [0.077, -0.008, -0.01]), 0.02) * 0.35 + gauss(d3(ax, ly, lz, [0.012, -0.055, 0.088]), 0.011) * 0.55;
      c = mix3(c, [c[0] * 1.05, c[1] * 0.8, c[2] * 0.76], clamp(red, 0, 1) * (1 - pale));
      const sock = gauss(d3(ax, ly, lz, [0.031, 0.006, 0.07]), 0.018);
      c = mix3(c, [c[0] * 0.8, c[1] * 0.74, c[2] * 0.76], sock * 0.5);
      if (stub > 0) {
        const jaw = smoothstep(-0.012, -0.03, ly + 0.16 * ax) * smoothstep(-0.03, 0.01, lz) * (1 - smoothstep(-0.105, -0.13, ly));
        const lip = smoothstep(0.03, 0.02, ax) * smoothstep(-0.052, -0.046, ly) * smoothstep(-0.034, -0.04, ly) * smoothstep(0.06, 0.08, lz);
        const lips = gauss(d3(ax, ly, lz, [0.01, -0.055, 0.088]), 0.012);
        const k = clamp(Math.max(jaw, lip) - lips * 1.4, 0, 1) * stub * (0.55 + 0.45 * noise3(lx * 1400, ly * 1400, lz * 1400));
        c = mix3(c, mix3(hair, [0.18, 0.2, 0.24], 0.35), k * 0.7);
      }
      if (bald) {
        const sc = smoothstep(0.045, 0.075, ly - 0.25 * Math.max(0, lz - 0.02)) * (0.6 + 0.4 * noise3(lx * 1600, ly * 1600, lz * 1600));
        c = mix3(c, scalpTint, sc * 0.35);
      }
      const n = 0.95 + 0.1 * noise3(lx * 700, ly * 700, lz * 700) + 0.05 * noise3(lx * 90, ly * 90, lz * 90);
      const shine = bald ? smoothstep(0.05, 0.1, ly) * 0.25 : 0;
      return { c: mul3(c, n), spec: 0.12 + shine + gauss(d3(ax, ly, lz, [0, -0.02, 0.1]), 0.02) * 0.2, shin: 24, sss: 1 };
    };
  }

  function eyeMat(L, gaze) {
    const iris = col(L.eyes || 0x5a4630);
    return (lx, ly, lz) => {
      const s = lx < 0 ? -1 : 1, cx = 0.031 * s;
      const vx = lx - cx, vy = ly - 0.011, vz = lz - 0.066, vl = Math.hypot(vx, vy, vz) || 1;
      const cosA = (vx * gaze[0] + vy * gaze[1] + vz * gaze[2]) / vl;
      if (cosA > 0.93) {
        if (cosA > 0.985) return { c: [0.03, 0.025, 0.02], spec: 1.2, shin: 120 };
        const rad = (1 - cosA) / 0.07, ring = smoothstep(0.7, 1, rad);
        const ang = Math.atan2(vy, vx);
        const fib = 0.8 + 0.35 * noise3(Math.cos(ang) * 6, Math.sin(ang) * 6, rad * 3);
        return { c: mul3(mix3(mul3(iris, 1.25), mul3(iris, 0.45), ring), fib), spec: 1.2, shin: 120 };
      }
      const corner = smoothstep(0.55, 0.2, cosA);
      return { c: mix3([0.84, 0.8, 0.74], [0.72, 0.5, 0.46], corner * 0.6), spec: 1.0, shin: 110 };
    };
  }

  function hairMat(color, scale = 1, len = 1) {
    const base = col(color);
    return (lx, ly, lz) => {
      const n = noise3(lx * 3200 * scale, ly * 3200 * scale, lz * 700 * scale / len), m = noise3(lx * 260, ly * 260, lz * 260);
      return { c: mul3(base, 0.72 + 0.42 * n * (0.7 + 0.5 * m)), spec: HAIR_SPEC.spec, shin: 14 };
    };
  }

  function fabricMat(o) {
    const base = col(o.color), c2 = o.camo ? col(o.camo[0]) : null, c3 = o.camo ? col(o.camo[1]) : null, sweater = o.knit;
    return (lx, ly, lz) => {
      let c = base;
      if (c2) {
        const n1 = fbm3(lx * 16 + 3, ly * 16, lz * 16, 3), n2 = fbm3(lx * 22 + 9, ly * 22 + 4, lz * 22, 3);
        if (n1 > 0.56) c = c2;
        if (n2 > 0.6) c = c3;
      }
      if (sweater) { const rib = 0.5 + 0.5 * Math.sin(Math.atan2(lx, lz) * (o.ribs || 70)); c = mul3(c, 0.72 + 0.34 * rib); }
      const weave = 0.93 + 0.1 * noise3(lx * 1500, ly * 1500, lz * 1500);
      const fold = o.folds ? 0.86 + 0.28 * fbm3(lx * 40, ly * 12, lz * 40, 2) : 1;
      return { c: mul3(c, weave * fold), spec: o.spec || 0.04, shin: 8 };
    };
  }

  function leatherMat(color, wear = 0.5) {
    const base = col(color);
    return (lx, ly, lz) => {
      const cr = fbm3(lx * 22, ly * 22, lz * 22, 2), fine = noise3(lx * 500, ly * 500, lz * 500);
      const worn = smoothstep(0.55, 0.75, fbm3(lx * 11 + 5, ly * 11, lz * 11, 2)) * wear;
      const c = mix3(mul3(base, 0.8 + 0.3 * cr), mul3(base, 1.3), worn * 0.45);
      return { c: mul3(c, 0.97 + 0.05 * fine), spec: 0.3, shin: 16 };
    };
  }

  function plateMat(color, grooves = 0) {
    const base = col(color);
    return (lx, ly, lz) => {
      const g = grooves ? smoothstep(0.82, 0.95, Math.abs(Math.sin(ly * grooves))) : 0;
      const sc = noise3(lx * 400, ly * 60, lz * 400), dirt = fbm3(lx * 30, ly * 30, lz * 30, 2);
      return { c: mul3(base, (0.85 + 0.25 * dirt) * (1 - g * 0.45) * (0.95 + sc * 0.1)), spec: 0.3, shin: 30 };
    };
  }

  const solidMat = (color, spec = 0.1, shin = 12) => { const c = col(color); return () => ({ c, spec, shin }); };
  const glassMat = () => (lx, ly, lz) => ({ c: [0.05, 0.08, 0.07], spec: 1.4, shin: 140, glass: 1 });

  function hideMat(o) {
    const base = col(o.color), dark = col(o.dark), light = col(o.light || o.color);
    return (lx, ly, lz) => {
      const m = fbm3(lx * (o.patch || 18) + 3, ly * (o.patch || 18), lz * (o.patch || 18), 3);
      let c = mix3(base, m > 0.55 ? dark : light, Math.abs(m - 0.5) * 1.6);
      const fold = o.folds ? Math.abs(Math.sin(ly * o.folds + noise3(lx * 40, ly * 40, lz * 40) * 3)) : 1;
      c = mul3(c, (o.folds ? 0.72 + 0.28 * Math.pow(fold, 0.35) : 1) * (0.92 + 0.14 * noise3(lx * 500, ly * 500, lz * 500)));
      if (o.blood) { const b = smoothstep(0.62, 0.7, fbm3(lx * 30 + 9, ly * 30, lz * 30, 2)) * o.blood; c = mix3(c, [0.28, 0.05, 0.04], b); }
      if (o.veins) { const v = smoothstep(0.93, 0.99, 1 - Math.abs(noise3(lx * 60, ly * 60, lz * 60) * 2 - 1)); c = mix3(c, col(o.veins), v * 0.7); }
      return { c, spec: o.spec == null ? 0.22 : o.spec, shin: 20, sss: o.sss ? 1 : 0 };
    };
  }
  const emitMat = (color, glow) => { const c = col(color); return () => ({ c, spec: 1, shin: 80, emit: mul3(c, glow) }); };
  const toothMat = (tone = [0.84, 0.8, 0.68]) => (lx, ly, lz) => ({ c: mul3(tone, 0.8 + 0.28 * noise3(lx * 300, ly * 300, lz * 300)), spec: 0.6, shin: 40 });
  const wetMat = color => { const c = col(color); return (lx, ly, lz) => ({ c: mul3(c, 0.8 + 0.3 * noise3(lx * 200, ly * 200, lz * 200)), spec: 0.9, shin: 50 }); };
  const teeth = (b, a, bb, n, r, len, up) => { for (let i = 0; i < n; i++) { const t = i / (n - 1), x = a[0] + (bb[0] - a[0]) * t, y = a[1] + (bb[1] - a[1]) * t, z = a[2] + (bb[2] - a[2]) * t; b.add(cap([x, y, z], [x, y + up * len * (0.7 + 0.3 * Math.sin(i * 2.3)), z + 0.004], r, 0.0015)); } };

  const MUTANT_BUSTS = {
    dog() {
      const S = new Scene();
      const H = S.frame(0.1, 1.08, 0.06, [0.035, 0.03, 0]);
      const T = S.frame(0.05, 0.75, 0, [0.02, -0.15, -0.1]);
      const hide = hideMat({ color: 0x6a5444, dark: 0x2e2218, light: 0x86705a, folds: 120, blood: 0.22, patch: 14 });
      const skin = S.body(H, hide, 'skull');
      skin.add(ell([0, 0.01, -0.025], [0.07, 0.066, 0.095]));
      skin.add(cap([0, 0.0, 0.035], [0, -0.022, 0.17], 0.048, 0.028), 0.03);
      skin.add(ell([0, 0.04, 0.035], [0.056, 0.025, 0.055]), 0.02);
      skin.sub(sph([0.04, 0.022, 0.055], 0.015), 0.012, true);
      skin.add(ell([0.056, 0.045, -0.06], [0.013, 0.05, 0.034], [0.3, 0, -0.5]), 0.01, true);
      skin.sub(cap([0.036, -0.04, 0.03], [0.018, -0.05, 0.14], 0.012), 0.01, true);
      skin.disp(0.0022, 80, 3, 2);
      const jaw = S.body(H, hide, 'jaw');
      jaw.add(cap([0, -0.05, 0.025], [0, -0.108, 0.14], 0.03, 0.017));
      jaw.disp(0.0015, 110, 5, 1);
      const nose = S.body(H, wetMat(0x1c1512), 'nose');
      nose.add(ell([0, -0.018, 0.192], [0.025, 0.02, 0.016]));
      const mouth = S.body(H, wetMat(0x2a0806), 'mouth');
      mouth.add(ell([0, -0.064, 0.085], [0.018, 0.022, 0.062]));
      const tt = S.body(H, toothMat(), 'teeth');
      for (const s of [1, -1]) {
        teeth(tt, [s * 0.026, -0.04, 0.045], [s * 0.014, -0.034, 0.16], 7, 0.0042, 0.016, -1);
        teeth(tt, [s * 0.024, -0.074, 0.05], [s * 0.012, -0.09, 0.13], 6, 0.004, 0.014, 1);
      }
      const neck = S.body(T, hide, 'neck');
      neck.add(cap([0, 0.14, 0.03], [0, -0.05, -0.05], 0.085, 0.11));
      neck.add(ell([0, -0.15, 0.02], [0.16, 0.11, 0.13]), 0.06);
      neck.disp(0.005, 38, 7, 2);
      return { scene: S.finish(), L: { bg: 0x2a2018 } };
    },
    flesh() {
      const S = new Scene();
      const H = S.frame(0.08, -0.3, 0.04, [0, -0.015, 0]);
      const hide = hideMat({ color: 0x643a2a, dark: 0x2e140e, light: 0x8a5440, veins: 0x220806, folds: 70, blood: 0.28, patch: 12 });
      const EY = [[0.06, 0.06, 0.1, 0.024], [0.014, 0.082, 0.104, 0.02], [-0.064, 0.024, 0.098, 0.022]];
      const b = S.body(H, hide, 'face');
      b.add(ell([0, 0, -0.02], [0.17, 0.15, 0.13]));
      b.add(ell([0.07, 0.08, 0.02], [0.09, 0.07, 0.08]), 0.04);
      b.add(ell([-0.09, -0.05, 0.02], [0.08, 0.08, 0.08]), 0.04);
      b.add(ell([-0.1, 0.1, -0.02], [0.07, 0.06, 0.07]), 0.05);
      b.add(ell([0.12, -0.04, -0.02], [0.06, 0.07, 0.07]), 0.05);
      b.add(ell([0, -0.15, -0.04], [0.21, 0.08, 0.14]), 0.06);
      for (const [x, y, z, r] of EY) b.add(tor([x, y, z - 0.004], r * 0.95, r * 0.42, [Math.PI / 2, 0, 0]), 0.012);
      for (const [x, y, z, r] of EY) b.sub(sph([x, y, z + 0.008], r * 0.9), 0.006);
      b.sub(ell([0.005, -0.055, 0.12], [0.085, 0.038, 0.07]), 0.012);
      b.add(ell([0.005, -0.1, 0.1], [0.07, 0.025, 0.035]), 0.02);
      b.add(ell([-0.13, -0.12, 0.02], [0.06, 0.08, 0.07]), 0.05);
      b.add(ell([0.1, 0.12, -0.04], [0.07, 0.05, 0.06]), 0.05);
      b.disp(0.012, 11, 9, 3);
      const eyes = S.body(H, (lx, ly) => {
        let best = 1, e = EY[0];
        for (const q of EY) { const d = Math.hypot(lx - q[0], ly - q[1]) / q[3]; if (d < best) { best = d; e = q; } }
        return best < 0.35 ? { c: [0.02, 0.01, 0.01], spec: 1, shin: 90 } : best < 0.62 ? { c: [0.5, 0.1, 0.05], spec: 1, shin: 90, emit: [0.1, 0.015, 0.008] } : { c: [0.7, 0.58, 0.4], spec: 1, shin: 90 };
      }, 'eyes');
      for (const [x, y, z, r] of EY) eyes.add(sph([x, y, z - 0.002], r * 0.78));
      const mouth = S.body(H, wetMat(0x240806), 'mouth');
      mouth.add(ell([0.005, -0.058, 0.095], [0.075, 0.03, 0.03]));
      const tt = S.body(H, toothMat([0.66, 0.58, 0.38]), 'teeth');
      teeth(tt, [-0.06, -0.028, 0.118], [0.065, -0.034, 0.116], 7, 0.0055, 0.018, -1);
      teeth(tt, [-0.05, -0.084, 0.11], [0.055, -0.08, 0.112], 5, 0.005, 0.014, 1);
      return { scene: S.finish(), L: { bg: 0x2c1810 } };
    },
    boar() {
      const S = new Scene();
      const H = S.frame(0.16, 0.8, 0.02, [-0.03, 0.02, -0.03]);
      const hide = hideMat({ color: 0x3a3430, dark: 0x16120e, light: 0x5a524a, folds: 140, patch: 16, spec: 0.18 });
      const b = S.body(H, hide, 'head');
      b.add(ell([0, 0.02, -0.04], [0.11, 0.105, 0.14]));
      b.add(cap([0, -0.02, 0.03], [0, -0.04, 0.13], 0.072, 0.06), 0.04);
      b.add(ell([0, 0.08, -0.02], [0.085, 0.042, 0.1]), 0.03);
      b.add(ell([0.066, 0.085, -0.08], [0.022, 0.065, 0.038], [0.4, 0, -0.5]), 0.012, true);
      b.sub(sph([0.064, 0.036, 0.035], 0.019), 0.01, true);
      b.disp(0.0035, 65, 11, 2);
      const mane = S.body(H, hideMat({ color: 0x1c1816, dark: 0x0e0c0a, light: 0x2e2824, patch: 40 }), 'mane');
      mane.add(ell([0, 0.11, -0.1], [0.065, 0.065, 0.15]));
      mane.disp(0.011, 170, 13, 2);
      const nose = S.body(H, hideMat({ color: 0x9a6a62, dark: 0x5a3430, light: 0xb08078, patch: 30, spec: 0.5 }), 'nose');
      nose.add(cyl([0, -0.04, 0.182], 0.047, 0.013, [Math.PI / 2, 0, 0], 0.007));
      nose.sub(ell([0.017, -0.042, 0.195], [0.009, 0.013, 0.012]), 0.004, true);
      const eye = S.body(H, emitMat(0xb02010, 0.45), 'eye');
      eye.add(sph([0.064, 0.036, 0.038], 0.01), 0, true);
      const tusk = S.body(H, toothMat(), 'tusks');
      for (const s of [1, -1]) { tusk.add(cap([s * 0.052, -0.08, 0.1], [s * 0.085, -0.045, 0.135], 0.013, 0.01)); tusk.add(cap([s * 0.085, -0.045, 0.135], [s * 0.095, 0.02, 0.13], 0.01, 0.002)); }
      const mouth = S.body(H, wetMat(0x4a1410), 'mouth');
      mouth.add(ell([0, -0.08, 0.075], [0.055, 0.016, 0.06]));
      const T = S.frame(0, 0.4, 0, [-0.1, -0.21, -0.18]);
      const body = S.body(T, hide, 'shoulder');
      body.add(ell([0, 0, 0], [0.22, 0.12, 0.14]));
      body.disp(0.004, 50, 15, 2);
      return { scene: S.finish(), L: { bg: 0x22201c } };
    },
    bloodsucker() {
      const S = new Scene();
      const H = S.frame(0.12, 0.3, 0, [0, 0.01, 0]);
      const T = S.frame(0, 0.12, 0, [0, -0.2, -0.04]);
      const hide = hideMat({ color: 0x5c6054, dark: 0x2e3228, light: 0x7a7c68, veins: 0x3a2a30, blood: 0.3, patch: 16, sss: true });
      const b = S.body(H, hide, 'skull');
      b.add(ell([0, 0.03, -0.01], [0.072, 0.1, 0.088]));
      b.add(ell([0, -0.04, 0.03], [0.058, 0.06, 0.06]), 0.03);
      b.add(cap([0.012, 0.032, 0.078], [0.048, 0.03, 0.062], 0.014), 0.02, true);
      b.sub(sph([0.03, 0.012, 0.086], 0.017), 0.01, true);
      b.sub(ell([0.006, -0.02, 0.09], [0.003, 0.008, 0.01]), 0.003, true);
      b.add(cap([0, -0.06, -0.015], [0, -0.25, -0.03], 0.058), 0.03);
      b.disp(0.0015, 110, 17, 2);
      const eyes = S.body(H, emitMat(0x9a7a20, 0.25), 'eyes');
      eyes.add(sph([0.03, 0.012, 0.072], 0.0085), 0, true);
      const tent = S.body(H, hideMat({ color: 0x8a3e38, dark: 0x4e1a16, light: 0xa85a50, patch: 50, spec: 0.7 }), 'tentacles');
      [[0.028, 0.35], [0.01, 0.12], [-0.01, -0.12], [-0.028, -0.35]].forEach(([x, a]) => {
        const p0 = [x, -0.055, 0.075], p1 = [x * 1.6 + Math.sin(a) * 0.012, -0.1, 0.095], p2 = [x * 2 + Math.sin(a * 2) * 0.02, -0.15, 0.085], p3 = [x * 2.2 + Math.sin(a * 3) * 0.02, -0.19, 0.07];
        tent.add(cap(p0, p1, 0.011, 0.009), 0.006); tent.add(cap(p1, p2, 0.009, 0.007), 0.005); tent.add(cap(p2, p3, 0.007, 0.004), 0.004);
      });
      tent.disp(0.0012, 200, 19, 1);
      const body = S.body(T, hide, 'shoulders');
      body.add(ell([0, -0.1, 0.0], [0.2, 0.14, 0.11]));
      body.add(ell([0.15, -0.05, -0.02], [0.08, 0.07, 0.08]), 0.05, true);
      body.disp(0.003, 45, 21, 2);
      return { scene: S.finish(), L: { bg: 0x1e2018 } };
    },
    chimera() {
      const S = new Scene();
      const H = S.frame(0.3, 0.55, 0.06, [0.055, -0.055, 0]);
      const H2 = S.frame(0.14, 0.45, -0.16, [-0.105, -0.03, 0.03]);
      const T = S.frame(0.2, 0.3, 0, [0, 0.07, -0.22]);
      const hide = hideMat({ color: 0x6a625a, dark: 0x302a26, light: 0x8a8076, folds: 95, veins: 0x4a2a24, patch: 14 });
      const b = S.body(H, hide, 'head');
      b.add(ell([0, 0.02, -0.02], [0.075, 0.064, 0.085]));
      b.add(cap([0, -0.01, 0.035], [0, -0.032, 0.11], 0.052, 0.04), 0.03);
      b.add(cap([0.012, 0.042, 0.055], [0.055, 0.036, 0.036], 0.016), 0.02, true);
      b.sub(sph([0.042, 0.025, 0.075], 0.015), 0.01, true);
      b.disp(0.004, 70, 23, 2);
      const jaw = S.body(H, hide, 'jaw');
      jaw.add(cap([0, -0.062, 0.0], [0, -0.108, 0.105], 0.04, 0.028));
      jaw.disp(0.003, 80, 29, 1);
      const mouth = S.body(H, wetMat(0x4a100c), 'mouth');
      mouth.add(ell([0, -0.068, 0.068], [0.042, 0.03, 0.058]));
      const tt = S.body(H, toothMat(), 'fangs');
      for (const s of [1, -1]) { tt.add(cap([s * 0.03, -0.042, 0.098], [s * 0.032, -0.085, 0.104], 0.0075, 0.0015)); tt.add(cap([s * 0.028, -0.096, 0.09], [s * 0.029, -0.062, 0.095], 0.006, 0.0012)); }
      teeth(tt, [-0.022, -0.045, 0.112], [0.022, -0.045, 0.112], 5, 0.0032, 0.012, -1);
      const eyes = S.body(H, emitMat(0xe06020, 0.6), 'eyes');
      eyes.add(sph([0.042, 0.025, 0.066], 0.009), 0, true);
      const h2 = S.body(H2, hide, 'head2');
      h2.add(ell([0, 0, 0], [0.062, 0.052, 0.068]));
      h2.add(cap([0, -0.02, 0.03], [0, -0.035, 0.085], 0.037, 0.027), 0.02);
      h2.add(cap([0, -0.05, 0.02], [0, -0.07, 0.07], 0.022, 0.016), 0.015);
      h2.disp(0.003, 80, 25, 2);
      const e2 = S.body(H2, emitMat(0xc04818, 0.5), 'eyes2');
      e2.add(sph([0.026, 0.012, 0.052], 0.0065), 0, true);
      const body = S.body(T, hide, 'shoulders');
      body.add(ell([0, 0, 0], [0.27, 0.15, 0.2]));
      body.add(ell([0.05, -0.16, 0.05], [0.2, 0.1, 0.13]), 0.06);
      body.disp(0.005, 38, 27, 2);
      return { scene: S.finish(), L: { bg: 0x241c18 } };
    }
  };

  function buildBust(look) {
    if (MUTANT_BUSTS[look]) return MUTANT_BUSTS[look]();
    const L = C.LOOKS[look] || C.LOOKS.loner;
    const S = new Scene();
    const turn = L.turn == null ? 0.28 : L.turn;
    const heavy = L.build === 'heavy' ? 1 : 0, slim = L.build === 'slim' ? 1 : 0;
    const W = 1 + heavy * 0.08 - slim * 0.04;
    const H = S.frame(0.04 + (L.tilt || 0), turn, 0, [0, 0, 0]);
    const T = S.frame(0, turn * 0.35, 0, [0, -0.2, -0.035]);
    const camDir = norm([0 - 0, 0.03 - 0, 0.95]);
    const gaze = norm(H.dirToLocal(camDir));
    const covered = L.head === 'gasmask' || L.head === 'balaclava';

    const skin = S.body(H, skinMat(L), 'skin');
    const jw = L.jaw || 0, ch = L.chin || 0, ns = L.nose || 0, fw = W * (1 + (L.faceW || 0) * 0.05), cheek = L.cheek || 0, lips = L.lips || 0;
    skin.add(ell([0, 0.035, -0.015], [0.075 * W, 0.085, 0.095]));
    skin.add(ell([0, -0.03, 0.03], [0.06 * fw, 0.075, 0.064]), 0.035);
    skin.add(cap([(0.055 + jw * 0.006) * W, -0.058, -0.005], [0.02 + ch * 0.004, -0.1, 0.055], 0.017 + heavy * 0.006, 0.015), 0.03, true);
    skin.add(ell([0, -0.098, 0.058 + ch * 0.004], [0.024 + ch * 0.006, 0.016, 0.018]), 0.02);
    skin.add(ell([0.04 * fw, -0.036, 0.048], [0.022 + cheek * 0.006, 0.026, 0.022 + cheek * 0.004]), 0.042, true);
    skin.add(ell([0.048 * fw, -0.004, 0.052], [0.022, 0.014, 0.02]), 0.02, true);
    skin.add(cap([0.008, 0.03, 0.084], [0.05, 0.028, 0.068], 0.0115 + (L.brows || 0) * 0.002), 0.02, true);
    skin.sub(sph([0.031, 0.012, 0.088], 0.017), 0.012, true);
    skin.add(cut(ell([0.031, 0.011, 0.066], [0.0146, 0.0139, 0.0136]), ell([0.031, 0.0096 - (L.squint || 0) * 0.001, 0.08], [0.0132, 0.0034 + (L.eyeOpen || 0) * 0.0013 - (L.squint || 0) * 0.0005, 0.03], [0, 0, L.lidTilt || 0.06])), 0.004, true);
    skin.add(cap([0, 0.02, 0.084], [0, -0.018, 0.102 + ns * 0.003], 0.0072, 0.0092), 0.01);
    skin.add(ell([0, -0.026, 0.102 + ns * 0.003], [0.0105 + ns * 0.001, 0.0098, 0.0105]), 0.008);
    skin.add(sph([0.0122, -0.031, 0.092], 0.0076), 0.008, true);
    skin.sub(sph([0.0074, -0.0357, 0.0965], 0.0033), 0.003, true);
    skin.add(cap([0, -0.0502, 0.0918], [0.0245, -0.0545, 0.0828], 0.0048 + lips * 0.001, 0.0032), 0.006, true);
    skin.add(cap([0, -0.0598, 0.0898], [0.0212, -0.0585, 0.0818], 0.0058 + lips * 0.0012, 0.0038), 0.006, true);
    skin.sub(cap([-0.0265, -0.0551, 0.0955], [0.0265, -0.0551, 0.0955], 0.0014), 0.002);
    if (!covered) { skin.add(ell([0.076 * W, -0.008, -0.01], [0.0105, 0.03, 0.019], [0, 0.4, -0.1]), 0.006, true); skin.sub(sph([0.0845 * W, -0.006, -0.004], 0.0075), 0.003, true); }
    S.body(H, skinMat(L), 'neck').add(cap([0, -0.05, -0.018], [0, -0.24, -0.026], 0.051 + heavy * 0.01));
    if (heavy) skin.add(ell([0.04 * W, -0.074, 0.03], [0.032, 0.03, 0.032]), 0.03, true);
    if ((L.age || 0) > 0.4) skin.sub(cap([0.019, -0.032, 0.092], [0.031, -0.064, 0.079], 0.0018), 0.005, true);

    if (!covered) {
      const eyes = S.body(H, eyeMat(L, gaze), 'eyes');
      eyes.add(sph([0.031, 0.011, 0.066], 0.0122), 0, true);
      const brows = S.body(H, hairMat(L.brow || L.hair || 0x2a2018, 1.4), 'brows');
      brows.add(cap([0.009, 0.0285 - (L.squint || 0) * 0.0015, 0.0948], [0.052, 0.0298, 0.0785], 0.0052 + (L.brows || 0) * 0.0012, 0.0034), 0, true).disp(0.0011, 900, 3, 1);
    }

    hair(S, H, L, W);
    facial(S, H, L, W);
    headgear(S, H, L, W);
    torso(S, T, L, W);
    return { scene: S.finish(), L };
  }

  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  function hairline(L) {
    const front = L.hairStyle === 'receding' ? 0.07 : 0.056, temple = L.hairStyle === 'receding' ? 0.03 : 0.012;
    return (x, y, z) => {
      const ax = Math.abs(x);
      const fz = smoothstep(0.0, 0.07, z), side = smoothstep(0.045, 0.07, ax);
      let t = lerp(-0.07, front, fz) - (1 - fz) * 0.02;
      t = lerp(t, Math.max(temple - smoothstep(0.02, -0.06, z) * 0.1, -0.085), side * (1 - fz * 0.5));
      if (ax > 0.06 && y < 0.03 && z > -0.045 && z < 0.03) t = Math.max(t, 0.028);
      return t - y;
    };
  }

  function hair(S, H, L, W) {
    const style = L.hairStyle || 'short';
    if (style === 'bald' || L.head === 'hood' || L.head === 'gasmask' || L.head === 'balaclava' || L.head === 'helmet' || L.head === 'beanie') {
      if ((L.head === 'hood') && style !== 'bald') {
        const fringe = S.body(H, hairMat(L.hair), 'fringe');
        fringe.add(ell([0, 0.04, -0.012], [0.078 * W, 0.088, 0.099])).clip((x, y, z) => 0.05 - y + smoothstep(0.06, 0.02, z) * 0.1).disp(0.0015, 500, 7, 1);
      }
      return;
    }
    const thick = style === 'buzz' ? 0.003 : style === 'messy' ? 0.011 : 0.0055;
    const line = hairline(L), skinC = mul3(col(L.skin || 0xc49474), 0.85), strands = hairMat(L.hair || 0x2a2018, 1, style === 'buzz' ? 0.5 : 1);
    const b = S.body(H, (lx, ly, lz) => {
      const m = strands(lx, ly, lz), e = smoothstep(-0.014, 0, line(lx, ly, lz));
      return e > 0 ? { c: mix3(m.c, skinC, e * (style === 'buzz' ? 0.75 : 0.55)), spec: m.spec, shin: m.shin } : m;
    }, 'hair');
    b.add(ell([0, 0.035 + thick * 0.5, -0.015], [0.075 * W + thick * 0.55, 0.085 + thick * 1.15, 0.095 + thick * 0.8]));
    if (style === 'short') b.add(ell([0, 0.078, 0.01], [0.058 * W, 0.036, 0.07]), 0.018);
    if (style === 'messy') b.add(ell([0, 0.075, 0.012], [0.064 * W, 0.044, 0.076]), 0.02);
    b.clip(line);
    if (style === 'messy') b.disp(0.003, 110, 5, 2);
  }

  function facial(S, H, L, W) {
    const f = L.facial || 'none';
    if (f === 'none' || f === 'stubble' || L.head === 'gasmask' || L.head === 'balaclava' || L.mask === 'bandana') return;
    const m = hairMat(L.facialColor || L.hair || 0x2a2018, 1.2);
    const b = S.body(H, m, 'beard');
    if (f === 'full' || f === 'scruffy') {
      const t = f === 'full' ? 1 : 0.55;
      b.add(ell([0, -0.08, 0.044], [0.06 * W, 0.05 + t * 0.012, 0.052]));
      b.add(ell([0.046 * W, -0.05, 0.022], [0.025, 0.042, 0.04]), 0.03, true);
      b.add(ell([0, -0.1 - t * 0.012, 0.05], [0.036, 0.03 + t * 0.012, 0.038]), 0.025);
      b.sub(ell([0, -0.056, 0.098], [0.021, 0.0095, 0.022]), 0.004);
      b.clip((x, y, z) => y + 0.02 + 0.28 * Math.max(0, 0.06 - Math.abs(x)) - (z < 0.02 ? 0.03 : 0));
      b.disp(f === 'full' ? 0.0042 : 0.0034, f === 'full' ? 230 : 300, 11, 2);
    }
    if (f === 'full' || f === 'scruffy' || f === 'moustache') {
      const mo = f === 'moustache' ? 1.15 : 1;
      b.add(cap([0.002, -0.0445, 0.097], [0.024, -0.05, 0.086], 0.0058 * mo, 0.0048 * mo), 0.006, true);
      b.add(cap([0.024, -0.05, 0.086], [0.027, -0.062 - (L.droop || 0), 0.08], 0.0045 * mo, 0.0035), 0.004, true);
      if (f === 'moustache') b.disp(0.0012, 700, 13, 2);
    }
  }

  function headgear(S, H, L, W) {
    const g = L.head || 'none';
    if (L.mask === 'bandana') {
      const b = S.body(H, fabricMat({ color: L.maskColor || 0x2e3a2a, folds: true }), 'bandana').shell(S.bodies[0], 0.0045);
      b.add(ell([0, -0.02, 0.07], [0.052, 0.05, 0.05]), 0.02);
      b.add(ell([0, -0.1, 0.035], [0.06, 0.05, 0.06]), 0.03);
      b.clip((x, y, z) => Math.max(y + 0.004 + Math.abs(x) * 0.18, -0.03 - z));
      b.disp(0.0014, 160, 6, 1);
    }
    if (g === 'hood' || g === 'hoodDown') return;
    if (g === 'beanie') {
      const knit = fabricMat({ color: L.hat || 0x2a2a28, knit: true, ribs: 90 });
      const b = S.body(H, knit, 'beanie');
      b.add(ell([0, 0.04, -0.012], [0.08 * W, 0.094, 0.101])).clip((x, y, z) => 0.03 - y + smoothstep(0.0, 0.08, z) * 0.012);
      b.disp(0.0012, 350, 2);
      const brim = S.body(H, fabricMat({ color: L.hat || 0x2a2a28, knit: true, ribs: 120 }), 'brim');
      brim.add(ell([0, 0.03, -0.012], [0.083 * W, 0.092, 0.104])).clip((x, y, z) => Math.max(0.018 + smoothstep(0.0, 0.08, z) * 0.012 - y, y - 0.044 - smoothstep(0.0, 0.08, z) * 0.012));
    }
    if (g === 'helmet') {
      const b = S.body(H, plateMat(L.hat || 0x5a5a3e), 'helmet');
      b.add(ell([0, 0.05, -0.012], [0.094 * W, 0.098, 0.11])).clip((x, y, z) => 0.018 - y + smoothstep(0.02, 0.1, z) * 0.02);
      b.add(box([0, 0.022, 0.09], [0.07, 0.006, 0.02], 0.004, [0.3, 0, 0]), 0.01);
    }
    if (g === 'cap') {
      const b = S.body(H, fabricMat({ color: L.hat || 0x3a3a30 }), 'cap');
      b.add(ell([0, 0.05, -0.012], [0.08 * W, 0.075, 0.1])).clip((x, y, z) => 0.035 - y);
      b.add(box([0, 0.04, 0.11], [0.055, 0.004, 0.035], 0.003, [0.2, 0, 0]), 0.006);
    }
    if (g === 'balaclava') {
      const b = S.body(H, fabricMat({ color: L.hat || 0x1e2024, knit: true, ribs: 160 }), 'balaclava').shell(S.bodies[0], 0.0035);
      b.add(ell([0, 0.035, -0.015], [0.08 * W, 0.09, 0.1]), 0.012);
      b.add(ell([0.074 * W, -0.01, -0.012], [0.014, 0.034, 0.024]), 0.01, true);
      b.sub(box([0, 0.012, 0.1], [0.05, 0.0118, 0.06], 0.008), 0.005);
      b.disp(0.0008, 300, 4, 1);
      const eyes = S.body(H, eyeMat(L, norm(H.dirToLocal(norm([0, 0.03, 0.95])))), 'eyes');
      eyes.add(sph([0.031, 0.011, 0.066], 0.0122), 0, true);
    }
    if (g === 'gasmask') {
      const rub = solidMat(0x2c2e2a, 0.28, 14);
      const m = S.body(H, rub, 'mask').shell(S.bodies[0], 0.008);
      m.add(ell([0, 0.035, -0.015], [0.083 * W, 0.093, 0.103]), 0.015);
      m.add(ell([0, -0.035, 0.05], [0.068 * W, 0.085, 0.074]), 0.03);
      m.add(ell([0.074 * W, -0.01, -0.012], [0.016, 0.036, 0.026]), 0.01, true);
      m.add(cyl([0.034, 0.012, 0.1], 0.024, 0.012, [Math.PI / 2 - 0.1, 0, 0], 0.004), 0.008, true);
      m.add(cyl([0, -0.068, 0.108], 0.02, 0.018, [Math.PI / 2 + 0.55, 0, 0], 0.004), 0.01);
      const lens = S.body(H, glassMat(), 'lens');
      lens.add(cyl([0.034, 0.012, 0.112], 0.0185, 0.002, [Math.PI / 2 - 0.1, 0, 0]), 0, true);
      const rim = S.body(H, solidMat(0x6a6a60, 0.5, 40), 'rim');
      rim.add(tor([0.034, 0.012, 0.113], 0.0195, 0.0032, [Math.PI / 2 - 0.1, 0, 0]), 0, true);
      const filt = S.body(H, plateMat(L.filter || 0x5a6048), 'filter');
      filt.add(cyl([0, -0.09, 0.134], 0.028, 0.02, [Math.PI / 2 + 0.55, 0, 0], 0.004));
      filt.add(cyl([0, -0.1, 0.15], 0.022, 0.006, [Math.PI / 2 + 0.55, 0, 0], 0.002), 0.004);
      if (L.hat) {
        const h = S.body(H, plateMat(L.hat), 'helmet');
        h.add(ell([0, 0.05, -0.014], [0.095 * W, 0.1, 0.112])).clip((x, y, z) => 0.03 - y + smoothstep(0.02, 0.1, z) * 0.02);
        h.add(box([0.09, 0.03, -0.01], [0.012, 0.03, 0.03], 0.006), 0.006, true);
      }
    }
  }

  const withInner = (outer, inner, depth, top) => (lx, ly, lz) => (lz > 0.02 && ly < top && ly > top - depth && Math.abs(lx) < 0.008 + (top - ly) * 0.34) ? inner(lx, ly, lz) : outer(lx, ly, lz);

  function band(S, T, mat, name, y0, y1, ro, ri, open) {
    const b = S.body(T, mat, name);
    b.add(cut(ell([0, (y0 + y1) / 2, -0.006], [ro, (y1 - y0) / 2 + 0.03, ro * 0.96]), ell([0, (y0 + y1) / 2, -0.006], [ri, y1 - y0 + 0.04, ri * 0.96])));
    b.clip((x, y, z) => Math.max(y0 - y, y - y1 - Math.max(0, -z) * 0.25));
    if (open) b.clip((x, y, z) => Math.min(z - 0.02, open - Math.abs(x)));
    return b;
  }

  function torso(S, T, L, W) {
    const o = L.outfit || 'zarya', heavy = L.build === 'heavy' ? 1 : 0;
    const X = W * (1 + heavy * 0.06);
    const soft = o === 'coat' || o === 'leather' || o === 'bandit';
    const cloth = soft ? leatherMat(L.jacket, o === 'coat' ? 0.6 : 0.4) : fabricMat({ color: (o === 'exoArmor' || o === 'exo') ? (L.sleeve || L.jacket) : L.jacket, camo: L.camo, folds: true });
    const inner = L.inner != null ? fabricMat({ color: L.inner, knit: true, ribs: 120 }) : null;
    const mat = inner && soft ? withInner(cloth, inner, o === 'coat' ? 0.16 : 0.1, 0.03) : cloth;
    const t = S.body(T, mat, 'torso');
    t.add(ell([0, -0.14, 0.004], [0.168 * X, 0.16, 0.108]));
    t.add(ell([0, -0.045, -0.02], [0.182 * X, 0.075, 0.1]), 0.05);
    t.add(ell([0.152 * X, -0.05, -0.016], [0.078, 0.064, 0.08]), 0.04, true);
    t.add(cap([0.19 * X, -0.07, -0.012], [0.205 * X, -0.33, 0.0], 0.06, 0.053), 0.03, true);
    t.add(cap([0.02, 0.03, -0.035], [0.12 * X, -0.02, -0.022], 0.03), 0.05, true);
    if (soft) t.disp(0.0035, 16, 8, 1); else t.disp(0.0022, 34, 8, 1);

    if (o === 'coat') {
      band(S, T, leatherMat(L.jacket, 0.7), 'collar', -0.02, 0.05, 0.08, 0.066, 0.034).disp(0.0015, 60, 9, 1);
      const lap = S.body(T, leatherMat(L.jacket, 0.7), 'lapels');
      lap.add(box([0.047, -0.055, 0.094], [0.028, 0.072, 0.006], 0.005, [-0.32, 0.3, 0.34]), 0, true);
    } else if (o === 'leather' || o === 'bandit') {
      band(S, T, leatherMat(L.jacket, 0.5), 'collar', -0.015, 0.028, 0.074, 0.062, 0.03);
      const lap = S.body(T, leatherMat(L.jacket, 0.5), 'lapels');
      lap.add(box([0.04, -0.035, 0.088], [0.022, 0.05, 0.005], 0.004, [-0.3, 0.28, 0.4]), 0, true);
    } else if (o === 'exoArmor') {
      const pl = S.body(T, plateMat(L.jacket), 'plates');
      for (let i = 0; i < 3; i++) pl.add(box([0, -0.078 - i * 0.05, 0.086 + i * 0.004], [0.128 * X - i * 0.008, 0.022, 0.03], 0.013, [0.1 + i * 0.06, 0, 0]), 0.003);
      pl.add(ell([0.158 * X, -0.035, -0.012], [0.086, 0.06, 0.09]), 0.006, true);
      pl.add(ell([0.18 * X, -0.085, -0.004], [0.07, 0.034, 0.078]), 0.004, true);
      band(S, T, fabricMat({ color: L.sleeve || 0x4e5436, folds: true }), 'collar', -0.02, 0.04, 0.074, 0.06, 0);
    } else {
      band(S, T, cloth, 'collar', -0.02, L.head === 'hood' ? 0.03 : 0.045, 0.072, 0.059, 0).disp(0.0012, 70, 9, 1);
      const zip = S.body(T, solidMat(0x2a2a26, 0.3, 30), 'zip');
      zip.add(box([0, -0.03, 0.078], [0.0035, 0.07, 0.004], 0.002, [-0.28, 0, 0]));
      if (o === 'zarya' && L.plates) {
        const pl = S.body(T, fabricMat({ color: L.plates, camo: L.camo }), 'plates');
        pl.add(box([0.064, -0.14, 0.094], [0.056, 0.066, 0.014], 0.012, [0.15, 0.25, 0]), 0, true);
      }
      if (o === 'exo') {
        const pl = S.body(T, plateMat(L.jacket), 'plates');
        for (let i = 0; i < 3; i++) pl.add(box([0, -0.08 - i * 0.05, 0.088 + i * 0.004], [0.13 * X - i * 0.008, 0.022, 0.032], 0.013, [0.1 + i * 0.06, 0, 0]), 0.003);
        pl.add(ell([0.16 * X, -0.03, -0.012], [0.09, 0.066, 0.095]), 0.006, true);
        const tubes = S.body(T, solidMat(0x3a3a36, 0.5, 40), 'tubes');
        tubes.add(cap([0.07, 0.06, -0.08], [0.2 * X, -0.1, -0.07], 0.011), 0, true);
        tubes.add(cap([0.09, 0.04, -0.05], [0.21 * X, -0.16, -0.03], 0.008), 0, true);
      }
      if (o === 'merc' || o === 'military') {
        const v = S.body(T, fabricMat({ color: L.vest || 0x2e3440, folds: true }), 'vest');
        v.add(box([0, -0.15, 0.08], [0.15 * X, 0.1, 0.035], 0.025, [0.12, 0, 0]));
        v.add(box([0.06, -0.18, 0.12], [0.028, 0.035, 0.016], 0.008), 0.004, true);
      }
    }
    if (L.head === 'hoodDown') {
      const h = S.body(T, cloth, 'hood');
      h.add(ell([0, 0.035, -0.088], [0.1, 0.055, 0.05]));
      h.add(ell([0.06, 0.02, -0.05], [0.04, 0.035, 0.05]), 0.02, true);
      h.clip((x, y, z) => z - 0.01).disp(0.003, 80, 12, 1);
    }
    if (L.head === 'hood') hood(S, L, soft ? fabricMat({ color: L.hood || L.jacket, folds: true }) : cloth);
    if (L.rig) {
      const r = S.body(T, fabricMat({ color: L.rig, folds: true }), 'rig');
      r.add(cap([0.1 * X, 0.005, 0.0], [0.075, -0.2, 0.108], 0.012), 0, true);
      r.add(box([0.052, -0.2, 0.11], [0.03, 0.036, 0.02], 0.008), 0.004, true);
      r.add(box([0.12 * X, -0.19, 0.092], [0.028, 0.036, 0.02], 0.008, [0, 0.4, 0]), 0.004, true);
    }
    if (L.straps) {
      const s = S.body(T, fabricMat({ color: L.straps }), 'straps');
      s.add(cap([0.085 * X, 0.012, -0.03], [0.1 * X, -0.22, 0.1], 0.013), 0, true);
    }
  }

  function hood(S, L, mat) {
    const hd = S.body(S.frames[0], mat, 'hood');
    hd.add(ell([0, 0.03, -0.022], [0.098, 0.112, 0.116]));
    hd.add(ell([0, -0.075, -0.034], [0.112, 0.105, 0.108]), 0.05);
    hd.sub(ell([0, 0.026, -0.016], [0.085, 0.099, 0.103]), 0.01);
    hd.sub(ell([0, -0.07, -0.022], [0.092, 0.1, 0.092]), 0.01);
    hd.sub(ell([0, -0.028, 0.105], [0.064, 0.098, 0.075]), 0.014);
    hd.clip((x, y, z) => -0.17 - y);
    hd.disp(0.0035, 55, 21, 1);
  }

  const LIGHTS = {
    key: norm([-0.55, 0.62, 0.62]), keyC: [1.12, 1.05, 0.96],
    fill: norm([0.7, 0.1, 0.5]), fillC: [0.15, 0.18, 0.22],
    rim: norm([0.6, 0.35, -0.75]), rimC: [0.55, 0.6, 0.7]
  };

  function shadowRay(S, ox, oy, oz, L) {
    let res = 1, t = 0.004;
    for (let i = 0; i < 18 && t < 0.22; i++) {
      const h = S.dist(ox + L[0] * t, oy + L[1] * t, oz + L[2] * t);
      if (h < 0.0004) return 0;
      res = Math.min(res, 10 * h / t);
      t += clamp(h, 0.004, 0.035);
    }
    return clamp(res, 0, 1);
  }

  function ao(S, px, py, pz, nx, ny, nz) {
    let occ = 0, sca = 1;
    for (let i = 0; i < 4; i++) {
      const h = 0.003 + 0.013 * i, d = S.dist(px + nx * h, py + ny * h, pz + nz * h);
      occ += (h - d) * sca; sca *= 0.72;
    }
    return clamp(1 - 9 * occ, 0, 1);
  }

  function shadePixel(S, o, d, bg) {
    let tmin = 1e9, tmax = -1e9;
    for (const b of S.bodies) {
      const ox = o[0] - b.wc[0], oy = o[1] - b.wc[1], oz = o[2] - b.wc[2];
      const bb = ox * d[0] + oy * d[1] + oz * d[2], cc = ox * ox + oy * oy + oz * oz - b.br * b.br, disc = bb * bb - cc;
      if (disc < 0) continue;
      const sq = Math.sqrt(disc);
      tmin = Math.min(tmin, -bb - sq); tmax = Math.max(tmax, -bb + sq);
    }
    if (tmax < 0) return [bg[0], bg[1], bg[2], null];
    let t = Math.max(0, tmin), hit = false;
    for (let i = 0; i < 160 && t < tmax; i++) {
      const h = S.dist(o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t);
      if (h < 0.00018) { hit = true; break; }
      t += h * 0.9;
    }
    if (!hit) return [bg[0], bg[1], bg[2], null];
    const px = o[0] + d[0] * t, py = o[1] + d[1] * t, pz = o[2] + d[2] * t, e = 0.0004;
    const a = S.dist(px + e, py - e, pz - e), b = S.dist(px - e, py - e, pz + e), c = S.dist(px - e, py + e, pz - e), f = S.dist(px + e, py + e, pz + e);
    let nx = a - b - c + f, ny = -a - b + c + f, nz = -a + b - c + f;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const body = S.nearest(px, py, pz);
    const Lc = S.loc[body.frame.i];
    const m = body.mat(Lc[0], Lc[1], Lc[2]);
    const K = LIGHTS.key, F = LIGHTS.fill, R = LIGHTS.rim;
    const occ = ao(S, px, py, pz, nx, ny, nz);
    const ndk = nx * K[0] + ny * K[1] + nz * K[2];
    const wrap = m.sss ? 0.35 : 0.1;
    let dk = Math.max(0, (ndk + wrap) / (1 + wrap));
    const sh = dk > 0 ? shadowRay(S, px + nx * 0.0015, py + ny * 0.0015, pz + nz * 0.0015, K) : 0;
    dk *= lerp(0.18, 1, sh);
    const df = Math.max(0, nx * F[0] + ny * F[1] + nz * F[2]);
    const vdn = -(nx * d[0] + ny * d[1] + nz * d[2]);
    const rim = Math.pow(clamp(1 - vdn, 0, 1), 2.6) * Math.max(0, nx * R[0] + ny * R[1] + nz * R[2] + 0.4);
    const amb = (0.13 + 0.07 * ny) * occ;
    let r = m.c[0] * (LIGHTS.keyC[0] * dk + LIGHTS.fillC[0] * df * occ + amb);
    let g = m.c[1] * (LIGHTS.keyC[1] * dk + LIGHTS.fillC[1] * df * occ + amb);
    let bl = m.c[2] * (LIGHTS.keyC[2] * dk + LIGHTS.fillC[2] * df * occ + amb);
    if (m.sss) { const term = Math.max(0, 1 - Math.abs(ndk + 0.1) * 3) * 0.12 * sh; r += term * 0.9; g += term * 0.3; bl += term * 0.15; }
    const hx = K[0] - d[0], hy = K[1] - d[1], hz = K[2] - d[2], hl = Math.hypot(hx, hy, hz);
    const spec = m.spec * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), m.shin) * sh * (m.shin > 60 ? 1 : occ);
    r += spec * LIGHTS.keyC[0] + rim * LIGHTS.rimC[0] * 0.5 * occ; g += spec * LIGHTS.keyC[1] + rim * LIGHTS.rimC[1] * 0.5 * occ; bl += spec * LIGHTS.keyC[2] + rim * LIGHTS.rimC[2] * 0.5 * occ;
    if (m.glass) { const fr = Math.pow(1 - clamp(vdn, 0, 1), 3); r += 0.1 + fr * 0.3; g += 0.12 + fr * 0.32; bl += 0.12 + fr * 0.34; }
    if (m.emit) { r += m.emit[0]; g += m.emit[1]; bl += m.emit[2]; }
    return [r, g, bl, body];
  }

  function background(x, y, w, h, tone) {
    const u = x / w - 0.35, v = y / h - 0.3;
    const glow = Math.exp(-(u * u * 2.2 + v * v * 3));
    const n = 0.9 + 0.2 * noise3(x * 0.08, y * 0.08, 7);
    return [(tone[0] * 0.35 + glow * tone[0] * 0.7) * n, (tone[1] * 0.35 + glow * tone[1] * 0.7) * n, (tone[2] * 0.35 + glow * tone[2] * 0.7) * n];
  }

  const SIZE = [128, 112];
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function renderBust(look, w = SIZE[0], h = SIZE[1]) { return renderScene(buildBust(look), w, h); }

  function renderScene(built, w, h) {
    const out = {};
    for (const _ of renderRows(built, w, h, out)) void _;
    return out.img;
  }

  function job(look, w = SIZE[0], h = SIZE[1]) {
    let it = null;
    const out = {};
    return {
      look,
      step(ms) {
        const t0 = now();
        if (!it) it = renderRows(buildBust(look), w, h, out);
        while (now() - t0 < ms) if (it.next().done) return out.img;
        return null;
      }
    };
  }

  function* renderRows({ scene: S, L }, w, h, out) {
    const tone = col(L.bg || 0x3a3a30);
    const cam = [0, 0.004, 0.92], tgt = [0, -0.044, 0], fovH = 0.207;
    const fw = norm([tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]]);
    const right = norm([-fw[2], 0, fw[0]]);
    const upv = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
    const aspect = w / h;
    const ray = (sx, sy) => {
      const u = (sx / w * 2 - 1) * fovH * aspect, v = (1 - sy / h * 2) * fovH;
      return norm([fw[0] + right[0] * u + upv[0] * v, fw[1] + right[1] * u + upv[1] * v, fw[2] + right[2] * u + upv[2] * v]);
    };
    const buf = new Float32Array(w * h * 3), ids = new Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const bg = background(x, y, w, h, tone);
      const s = shadePixel(S, cam, ray(x + 0.5, y + 0.5), bg);
      const i = y * w + x;
      buf[i * 3] = s[0]; buf[i * 3 + 1] = s[1]; buf[i * 3 + 2] = s[2]; ids[i] = s[3];
      if (x === w - 1) yield;
    }
    const lum = i => buf[i * 3] * 0.3 + buf[i * 3 + 1] * 0.55 + buf[i * 3 + 2] * 0.15;
    const edge = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, l = lum(i);
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (ids[j] !== ids[i] && (ids[j] === null || ids[i] === null || Math.abs(lum(j) - l) > 0.06)) { edge[i] = 1; break; }
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!edge[i]) { if (x === w - 1) yield; continue; }
      let r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
      for (const [ox, oy] of [[0.2, 0.3], [0.8, 0.7]]) {
        const s = shadePixel(S, cam, ray(x + ox, y + oy), background(x, y, w, h, tone));
        r += s[0]; g += s[1]; b += s[2];
      }
      buf[i * 3] = r / 3; buf[i * 3 + 1] = g / 3; buf[i * 3 + 2] = b / 3;
      if (x === w - 1) yield;
    }
    const data = new Uint32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const u = x / w - 0.5, v = y / h - 0.5, vig = 1 - (u * u + v * v) * 0.9;
      const scan = y % 2 ? 0.84 : 1.02, grain = 0.96 + 0.08 * hash3(x, y, 99);
      const k = vig * scan * grain * 255;
      const tone2 = [buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]].map(c => c / (1 + c * 0.25));
      data[i] = (255 << 24 | clamp(tone2[2] * k * 1.1, 0, 255) << 16 | clamp(tone2[1] * k * 1.1, 0, 255) << 8 | clamp(tone2[0] * k * 1.1, 0, 255)) >>> 0;
    }
    out.img = { w, h, data };
  }

  C.Portraits = { render: renderBust, build: buildBust, renderScene, job, SIZE, noise3, MUTANTS: Object.keys(MUTANT_BUSTS), has: look => !!(C.LOOKS[look] || MUTANT_BUSTS[look]) };
})(globalThis.Cop98 = globalThis.Cop98 || {});
