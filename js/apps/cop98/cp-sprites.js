(function (C) {
  'use strict';
  const { clamp, lerp, hash01, fbm, valueNoise, Mat } = C;

  class Raster {
    constructor(w, h) { this.w = w; this.h = h; this.data = new Uint32Array(w * h); }
    px(x, y, r, g, b, a = 255) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.data[y * this.w + x] = ((a << 24) | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255)) >>> 0;
    }
    disc(cx, cy, rad, col, jitter = 0, seed = 0) {
      for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > rad) continue;
        const k = 1 + (hash01(x, y, seed) - 0.5) * jitter;
        this.px(x, y, col[0] * k, col[1] * k, col[2] * k);
      }
    }
    line(x0, y0, x1, y1, wid, col, jitter = 0, seed = 0) {
      const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(len * 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, w = typeof wid === 'function' ? wid(t) : wid;
        this.disc(lerp(x0, x1, t), lerp(y0, y1, t), Math.max(0.5, w / 2), col, jitter, seed);
      }
    }
    sprite(ppm, ax, ay) { return { w: this.w, h: this.h, data: this.data, ppm, ax: ax == null ? this.w / 2 : ax, ay: ay == null ? this.h : ay }; }
  }

  function outline(img, darken = 0.35) {
    const { w, h, data } = img, out = new Uint32Array(data);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if ((data[i] >>> 24) > 100) continue;
      let src = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const c = data[yy * w + xx];
        if ((c >>> 24) > 100) { src = c; break; }
      }
      if (src) out[i] = (0xff000000 | (((((src >>> 16) & 255) * darken) | 0) << 16) | (((((src >>> 8) & 255) * darken) | 0) << 8) | (((src & 255) * darken) | 0)) >>> 0;
    }
    img.data = out;
    return img;
  }

  function treeSprite(kind, seed) {
    const rnd = C.makeRandom(seed);
    if (kind === 'pine') {
      const r = new Raster(56, 136);
      const trunkTop = 18, base = 134;
      r.line(28, base, 28, trunkTop, t => lerp(5, 1.5, t), [70, 52, 38], 0.3, seed);
      const layers = 11;
      for (let l = 0; l < layers; l++) {
        const t = l / (layers - 1), y = lerp(112, 14, t), wid = lerp(25, 4, Math.pow(t, 0.9)) * (0.85 + rnd() * 0.3);
        for (let k = 0; k < 90; k++) {
          const a = rnd(), side = rnd() < 0.5 ? -1 : 1, dx = side * wid * Math.sqrt(a), dy = (1 - Math.sqrt(a)) * 8 * (0.5 + rnd()) + rnd() * 5;
          const g = 0.75 + rnd() * 0.45 - t * 0.05;
          r.disc(28 + dx, y + dy - 4, 1.4 + rnd() * 1.4, [38 * g, 56 * g, 34 * g], 0.3, seed + l);
        }
      }
      r.disc(28, 12, 2.5, [36, 54, 32]);
      return outline(r).sprite(8, 28, 134);
    }
    if (kind === 'birch') {
      const r = new Raster(48, 104);
      r.line(24, 102, 23, 20, t => lerp(4, 1.5, t), [196, 190, 172], 0.2, seed);
      for (let y = 30; y < 100; y += 4 + (rnd() * 5 | 0)) r.line(22.5, y, 25.5, y + 0.5, 1, [40, 36, 30]);
      for (let k = 0; k < 7; k++) { const y = 28 + rnd() * 40, s = rnd() < 0.5 ? -1 : 1; r.line(24, y, 24 + s * (8 + rnd() * 9), y - 6 - rnd() * 8, 1.2, [120, 110, 96]); }
      for (let k = 0; k < 220; k++) {
        const a = rnd() * C.TAU, rr = Math.sqrt(rnd()), x = 24 + Math.cos(a) * rr * 19, y = 38 + Math.sin(a) * rr * 28 - 6;
        const yellow = rnd() < 0.55, g = 0.8 + rnd() * 0.4;
        r.disc(x, y, 1.2 + rnd() * 1.3, yellow ? [168 * g, 140 * g, 50 * g] : [96 * g, 110 * g, 50 * g], 0.2, seed + k);
      }
      return outline(r).sprite(8, 24, 102);
    }
    if (kind === 'dead') {
      const r = new Raster(56, 84);
      const branch = (x, y, a, len, w, depth) => {
        const x1 = x + Math.cos(a) * len, y1 = y - Math.sin(a) * len;
        r.line(x, y, x1, y1, t => lerp(w, w * 0.6, t), [72, 64, 56], 0.3, seed + depth);
        if (depth > 0) for (let k = 0; k < 2 + (rnd() < 0.4 ? 1 : 0); k++) branch(x1, y1, a + (rnd() - 0.5) * 1.4, len * (0.55 + rnd() * 0.2), w * 0.62, depth - 1);
      };
      branch(28, 83, Math.PI / 2 + (rnd() - 0.5) * 0.2, 30, 4.5, 3);
      return outline(r).sprite(8, 28, 83);
    }
    if (kind === 'irontree') {
      const r = new Raster(40, 96);
      r.line(20, 95, 20, 8, 2.4, [96, 64, 44], 0.3, seed);
      for (let y = 16; y < 80; y += 14 + (rnd() * 6 | 0)) { r.line(10, y, 30, y, 1.2, [110, 72, 50]); r.line(20, y, 12 + rnd() * 16, y + 8, 0.9, [90, 60, 44]); }
      return outline(r).sprite(8, 20, 95);
    }
    if (kind === 'willow') {
      const r = new Raster(64, 64);
      r.line(32, 63, 30, 34, 4, [72, 58, 44]);
      for (let k = 0; k < 380; k++) {
        const a = rnd() * Math.PI, rr = Math.sqrt(rnd()), x = 32 + Math.cos(a) * rr * 30, y = 36 - Math.sin(a) * rr * 26 + rnd() * 20;
        const g = 0.7 + rnd() * 0.45;
        r.disc(x, y, 1 + rnd() * 1.2, [84 * g, 96 * g, 48 * g], 0.2, seed + k);
      }
      return outline(r).sprite(8, 32, 63);
    }
    if (kind === 'bush') {
      const r = new Raster(32, 24);
      for (let k = 0; k < 160; k++) {
        const a = rnd() * Math.PI, rr = Math.sqrt(rnd()), x = 16 + Math.cos(a) * rr * 15, y = 23 - Math.sin(a) * rr * 20;
        const g = 0.7 + rnd() * 0.45, autumn = rnd() < 0.35;
        r.disc(x, y, 0.9 + rnd(), autumn ? [140 * g, 90 * g, 40 * g] : [80 * g, 92 * g, 44 * g], 0.2, seed + k);
      }
      return outline(r, 0.5).sprite(10, 16, 23);
    }
    return null;
  }

  function grassSprite(kind, seed) {
    const rnd = C.makeRandom(seed);
    if (kind === 'reed') {
      const r = new Raster(24, 64);
      for (let k = 0; k < 16; k++) {
        const x0 = 12 + (rnd() - 0.5) * 12, lean = (rnd() - 0.5) * 8, h = 36 + rnd() * 26;
        const g = 0.7 + rnd() * 0.4;
        r.line(x0, 63, x0 + lean, 63 - h, 0.9, [120 * g, 112 * g, 70 * g]);
        if (rnd() < 0.5) r.line(x0 + lean, 63 - h, x0 + lean * 1.1, 63 - h - 5, 2.4, [88 * g, 64 * g, 40 * g]);
      }
      return r.sprite(24, 12, 63);
    }
    const r = new Raster(20, 14);
    for (let k = 0; k < 14; k++) {
      const x0 = 10 + (rnd() - 0.5) * 12, lean = (rnd() - 0.5) * 8, h = 6 + rnd() * 7, dry = rnd() < (kind === 'dry' ? 0.8 : 0.3);
      const g = 0.7 + rnd() * 0.45;
      r.line(x0, 13, x0 + lean, 13 - h, 0.8, dry ? [150 * g, 130 * g, 74 * g] : [90 * g, 104 * g, 48 * g]);
    }
    return r.sprite(28, 10, 13);
  }

  function shapeHit(shape, size, ox, oy, oz, dx, dy, dz) {
    if (shape === 'box') {
      let t0 = -1e9, t1 = 1e9, axis = -1, sign = 0;
      const o = [ox, oy, oz], d = [dx, dy, dz];
      for (let a = 0; a < 3; a++) {
        if (Math.abs(d[a]) < 1e-9) { if (o[a] < -size[a] || o[a] > size[a]) return null; continue; }
        let ta = (-size[a] - o[a]) / d[a], tb = (size[a] - o[a]) / d[a], s = -1;
        if (ta > tb) { const q = ta; ta = tb; tb = q; s = 1; }
        if (ta > t0) { t0 = ta; axis = a; sign = s; }
        if (tb < t1) t1 = tb;
        if (t0 > t1) return null;
      }
      if (t1 < 0) return null;
      const n = [0, 0, 0]; n[axis] = sign;
      return { t: t0, n };
    }
    if (shape === 'cyl') {
      const sx = ox / size[0], sy = oy / size[1], ex = dx / size[0], ey = dy / size[1];
      const a = ex * ex + ey * ey, b = 2 * (sx * ex + sy * ey), c = sx * sx + sy * sy - 1;
      let best = null;
      if (a > 1e-12) {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          const t = (-b - Math.sqrt(disc)) / (2 * a), z = oz + dz * t;
          if (Math.abs(z) <= size[2]) best = { t, n: [(ox + dx * t) / (size[0] * size[0]), (oy + dy * t) / (size[1] * size[1]), 0] };
        }
      }
      if (Math.abs(dz) > 1e-9) for (const s of [-1, 1]) {
        const t = (s * size[2] - oz) / dz, x = (ox + dx * t) / size[0], y = (oy + dy * t) / size[1];
        if (x * x + y * y <= 1 && (!best || t < best.t)) best = { t, n: [0, 0, s] };
      }
      return best;
    }
    const sx = ox / size[0], sy = oy / size[1], sz = oz / size[2], ex = dx / size[0], ey = dy / size[1], ez = dz / size[2];
    const a = ex * ex + ey * ey + ez * ez, b = 2 * (sx * ex + sy * ey + sz * ez), c = sx * sx + sy * sy + sz * sz - 1;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
    return { t, n: [px / (size[0] * size[0]), py / (size[1] * size[1]), pz / (size[2] * size[2])] };
  }

  function solveRig(rig, pose) {
    const mats = {};
    const root = pose.root || [0, 0, 0, 0, 0, 0];
    for (const p of rig.parts) {
      const rot = (pose.rot && pose.rot[p.name]) || p.rot || [0, 0, 0];
      const local = Mat.fromEuler(rot[0], rot[1], rot[2], p.joint[0], p.joint[1], p.joint[2]);
      const parent = p.parent ? mats[p.parent] : Mat.fromEuler(root[3], root[4], root[5], root[0], root[1], root[2]);
      mats[p.name] = Mat.mul(parent, local);
    }
    const out = [];
    for (const p of rig.parts) {
      if (pose.hide && pose.hide.includes(p.name)) continue;
      const m = Mat.mul(mats[p.name], Mat.fromEuler(p.srot ? p.srot[0] : 0, p.srot ? p.srot[1] : 0, p.srot ? p.srot[2] : 0, p.offset[0], p.offset[1], p.offset[2]));
      const inv = Mat.invert(m);
      const c = Mat.apply(m, 0, 0, 0);
      out.push({ p, m, inv, c, r: Math.hypot(p.size[0], p.size[1], p.size[2]) });
    }
    return out;
  }

  function renderRig(rig, pose, opts) {
    const w = opts.w, h = opts.h, ppm = opts.ppm, ax = opts.ax, ay = opts.ay, levels = opts.levels || 7;
    const phi = opts.azimuth, el = opts.elevation == null ? 0.2 : opts.elevation;
    const vx = -Math.cos(phi) * Math.cos(el), vy = -Math.sin(phi) * Math.cos(el), vz = -Math.sin(el);
    const rx = -Math.sin(phi), ry = Math.cos(phi), rz = 0;
    const ux = ry * vz - rz * vy, uy = rz * vx - rx * vz, uz = rx * vy - ry * vx;
    const upx = ux, upy = uy, upz = uz;
    const lx0 = -rx * 0.45 + upx * 0.75 - vx * 0.55, ly0 = -ry * 0.45 + upy * 0.75 - vy * 0.55, lz0 = -rz * 0.45 + upz * 0.75 - vz * 0.55;
    const ll = Math.hypot(lx0, ly0, lz0), Lx = lx0 / ll, Ly = ly0 / ll, Lz = lz0 / ll;
    const parts = solveRig(rig, pose);
    const img = { w, h, ppm, ax, ay, data: new Uint32Array(w * h) };
    const focus = opts.center || [0, 0, 0];
    const persp = opts.perspective;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const sx = (px + 0.5 - ax) / ppm, sy = (ay - py - 0.5) / ppm;
      let ox, oy, oz, dx = vx, dy = vy, dz = vz;
      if (persp) {
        ox = focus[0] - vx * persp; oy = focus[1] - vy * persp; oz = focus[2] - vz * persp;
        dx = vx * persp + rx * sx + upx * sy; dy = vy * persp + ry * sx + upy * sy; dz = vz * persp + rz * sx + upz * sy;
        const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      } else {
        ox = focus[0] + rx * sx + upx * sy - vx * 8; oy = focus[1] + ry * sx + upy * sy - vy * 8; oz = focus[2] + rz * sx + upz * sy - vz * 8;
      }
      let best = 1e9, hit = null, hp = null;
      for (const q of parts) {
        const cx = q.c[0] - ox, cy = q.c[1] - oy, cz = q.c[2] - oz;
        const tc = cx * dx + cy * dy + cz * dz;
        const d2 = cx * cx + cy * cy + cz * cz - tc * tc;
        if (d2 > q.r * q.r) continue;
        const inv = q.inv;
        const lox = inv[0] * ox + inv[3] * oy + inv[6] * oz + inv[9], loy = inv[1] * ox + inv[4] * oy + inv[7] * oz + inv[10], loz = inv[2] * ox + inv[5] * oy + inv[8] * oz + inv[11];
        const ldx = inv[0] * dx + inv[3] * dy + inv[6] * dz, ldy = inv[1] * dx + inv[4] * dy + inv[7] * dz, ldz = inv[2] * dx + inv[5] * dy + inv[8] * dz;
        const r = shapeHit(q.p.shape, q.p.size, lox, loy, loz, ldx, ldy, ldz);
        if (r && r.t > 0 && r.t < best) { best = r.t; hit = q; hp = r; }
      }
      if (!hit) continue;
      const m = hit.m, n = hp.n;
      let nx = m[0] * n[0] + m[3] * n[1] + m[6] * n[2], ny = m[1] * n[0] + m[4] * n[1] + m[7] * n[2], nz = m[2] * n[0] + m[5] * n[1] + m[8] * n[2];
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      let k = 0.34 + 0.8 * Math.max(0, nx * Lx + ny * Ly + nz * Lz) + 0.12 * Math.max(0, -(nx * vx + ny * vy + nz * vz)) * 0.5;
      k = Math.round(k * levels) / levels;
      let col = hit.p.color;
      const wx = ox + dx * best, wy = oy + dy * best, wz = oz + dz * best;
      if (hit.p.camo) {
        const iv = hit.inv, lx = iv[0] * wx + iv[3] * wy + iv[6] * wz + iv[9], ly = iv[1] * wx + iv[4] * wy + iv[7] * wz + iv[10], lz = iv[2] * wx + iv[5] * wy + iv[8] * wz + iv[11];
        if (valueNoise(lx * 11 + lz * 6.1, ly * 11 - lz * 3.7, 17) > 0.6) col = hit.p.camo[0];
        if (valueNoise(lx * 14 - lz * 4.3 + 5, ly * 14 + lz * 5.9, 29) > 0.64) col = hit.p.camo[1];
      }
      if (hit.p.spec) {
        const hx = Lx - dx, hy = Ly - dy, hz = Lz - dz, hl = Math.hypot(hx, hy, hz) || 1;
        k += hit.p.spec * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 18);
      }
      const grain = 1 + (valueNoise(wx * 40 + wy * 13, wz * 40, 5) - 0.5) * (hit.p.grain == null ? 0.18 : hit.p.grain);
      const glow = hit.p.glow || 0;
      const kk = k * grain;
      const r = (col >> 16 & 255) * (kk + glow), g = (col >> 8 & 255) * (kk + glow), b = (col & 255) * (kk + glow);
      img.data[py * w + px] = ((255 << 24) | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255)) >>> 0;
    }
    if (opts.outline !== false) outline(img, opts.outlineK || 0.3);
    return img;
  }

  const part = (name, parent, joint, shape, size, offset, color, extra = {}) => Object.assign({ name, parent, joint, shape, size, offset, color }, extra);

  const LOOKS = {
    loner: { skin: 0xc49474, hair: 0x3a2c20, hairStyle: 'short', facial: 'stubble', stubble: 0.35, eyes: 0x4a3a28, head: 'hood', mask: 'bandana', maskColor: 0x34402e, outfit: 'leather', jacket: 0x7c6446, hood: 0x7c6446, inner: 0x3a3a34, pants: 0x3c4a5c, boots: 0x2a2620, pack: 0x4a4030, straps: 0x2a2a26, jaw: 0.5, nose: 0.3, turn: 0.3 },
    loner2: { skin: 0xc09070, hair: 0x2e241a, hairStyle: 'buzz', facial: 'stubble', stubble: 0.5, eyes: 0x3e5a6a, head: 'hoodDown', outfit: 'leather', jacket: 0x5e4a34, inner: 0x3e4232, pants: 0x3a3a30, boots: 0x2a2620, pack: 0x4a4a36, faceW: -0.5, cheek: -0.5, nose: 0.6, squint: 0.5, turn: -0.25 },
    zarya: { skin: 0xb88a68, hair: 0x2a2018, hairStyle: 'short', facial: 'stubble', stubble: 0.3, eyes: 0x4a3a2a, head: 'hood', outfit: 'zarya', jacket: 0x66664a, camo: [0x4e4a34, 0x7a6e50], hood: 0x66664a, pants: 0x55553e, boots: 0x262420, pack: 0x4a4030, plates: 0x5a5a42, jaw: 1, chin: 0.5, turn: 0.22 },
    bandit: { skin: 0xc49474, hair: 0x2a2018, hairStyle: 'buzz', facial: 'stubble', stubble: 0.6, eyes: 0x3a3024, head: 'none', outfit: 'bandit', jacket: 0x262322, inner: 0x3a3a3e, pants: 0x34363e, boots: 0x201c18, faceW: 0.4, jaw: 1, nose: 0.8, brows: 1, squint: 1, turn: -0.3 },
    bandit2: { skin: 0xc09070, hair: 0x1e1a16, hairStyle: 'short', facial: 'stubble', stubble: 0.55, eyes: 0x4a3a28, head: 'beanie', hat: 0x1c1c1c, outfit: 'bandit', jacket: 0x3a2c22, inner: 0x2e2e30, pants: 0x2c2c30, boots: 0x201c18, faceW: 0.2, lips: 0.5, turn: 0.25 },
    merc: { skin: 0xb08868, hair: 0x2a2018, hairStyle: 'buzz', facial: 'none', eyes: 0x5a6a70, head: 'balaclava', hat: 0x1c1e22, outfit: 'merc', jacket: 0x4c5868, camo: [0x363e4a, 0x6a7482], vest: 0x2a3038, pants: 0x3e4a58, boots: 0x1c1c1c, pack: 0x2e3440, gloves: 0x1e1e20, turn: 0.2 },
    military: { skin: 0xb08868, hair: 0x2a2018, hairStyle: 'buzz', facial: 'stubble', stubble: 0.3, eyes: 0x4a4030, head: 'helmet', hat: 0x4a5434, outfit: 'military', jacket: 0x4e5a38, camo: [0x3a4428, 0x6a6a44], vest: 0x3a4430, pants: 0x4e5a38, boots: 0x1c1c1c, pack: 0x3e4a2c, gloves: 0x2a2a24, jaw: 1, chin: 1, turn: -0.2 },
    zombie: { skin: 0x9a9478, pale: 0.8, hair: 0x3a3a34, hairStyle: 'messy', facial: 'scruffy', facialColor: 0x3e3a32, eyes: 0x8a8a7a, head: 'none', outfit: 'rags', jacket: 0x4a4636, pants: 0x3a382e, boots: 0x2a2620, faceW: -0.8, cheek: -1, eyeOpen: 1, turn: 0.4, tilt: 0.12 },
    beard: { skin: 0xbc9478, hair: 0x2e2218, hairStyle: 'bald', facial: 'full', facialColor: 0x3a2818, brow: 0x2a1e14, eyes: 0x4a3222, head: 'none', outfit: 'exoArmor', jacket: 0x7c7c76, sleeve: 0x4e5436, pants: 0x3a3a34, boots: 0x2a2620, gloves: 0x1c1c1a, build: 'heavy', faceW: 0.8, cheek: 1, nose: 0.8, brows: 1, age: 0.5, turn: -0.32 },
    owl: { skin: 0xc4a080, hair: 0x3a3228, hairStyle: 'bald', facial: 'stubble', stubble: 0.3, brow: 0x3a3024, eyes: 0x6a7a80, head: 'none', outfit: 'coat', jacket: 0x8a6a44, inner: 0x4a4436, pants: 0x2e2e2c, boots: 0x201c18, faceW: 0.2, jaw: 0.6, chin: 0.3, lips: -0.5, brows: 0.5, squint: 1, age: 0.6, turn: 0.18 },
    cardan: { skin: 0xc49a7a, hair: 0x4a3a28, hairStyle: 'short', facial: 'moustache', stubble: 0.7, facialColor: 0x6a4a30, brow: 0x4a3420, eyes: 0x6a8090, head: 'beanie', hat: 0x2a2a28, outfit: 'zarya', jacket: 0x6a6a52, camo: [0x4e4c3a, 0x827a5c], plates: 0x5e5e48, pants: 0x55553e, boots: 0x2a2620, build: 'heavy', faceW: 0.8, cheek: 0.8, nose: 1, brows: 1, age: 0.6, turn: -0.22 },
    sultan: { skin: 0xb88a68, hair: 0x201a14, hairStyle: 'bald', facial: 'moustache', stubble: 0.55, facialColor: 0x241c14, brow: 0x201810, eyes: 0x3a2a1c, head: 'none', outfit: 'coat', jacket: 0x4e3a26, inner: 0x3a3a2c, pants: 0x2a2a30, boots: 0x181614, gloves: 0x1e1a18, build: 'heavy', faceW: 1.2, cheek: 1.5, jaw: 1, nose: 0.8, lips: 0.8, squint: 1, droop: 0.006, age: 0.55, turn: 0.3 },
    noah: { skin: 0xc49a7a, hair: 0x8a6a44, hairStyle: 'receding', facial: 'scruffy', facialColor: 0x7a5030, brow: 0x6a4a2c, eyes: 0x7a9ab0, head: 'none', outfit: 'coat', jacket: 0x7a6444, inner: 0x3e4230, pants: 0x4a4436, boots: 0x2a2620, faceW: -0.3, nose: 0.4, eyeOpen: 1.5, age: 0.4, turn: -0.12 },
    nimble: { skin: 0xc49a7a, hair: 0x3a2a1c, hairStyle: 'short', facial: 'none', brow: 0x2a1e14, eyes: 0x4a3a28, head: 'hood', mask: 'bandana', maskColor: 0x2e3a2a, outfit: 'leather', jacket: 0x9a8a6a, hood: 0x9a8a6a, inner: 0x2a2a28, pants: 0x3a4a66, boots: 0x201c18, straps: 0x1e1e1c, gloves: 0x2a2622, faceW: -0.2, jaw: -0.3, turn: 0.26 },
    tesak: { skin: 0xb08868, hair: 0x2a2018, hairStyle: 'bald', facial: 'none', eyes: 0x4a4030, head: 'gasmask', hat: 0x7a6a52, filter: 0x4e5238, outfit: 'exo', jacket: 0x8a7a60, sleeve: 0x6a5a44, camo: [0x6a5a44, 0x9a8a6c], pants: 0x6a5a44, boots: 0x2a2620, gloves: 0x2a2620, turn: 0.15 },
    degtyarev: { skin: 0xb88a68, hair: 0x2e241c, hairStyle: 'short', facial: 'stubble', stubble: 0.3, brow: 0x241a12, eyes: 0x3a2a1c, head: 'hoodDown', outfit: 'zarya', jacket: 0x6a6448, camo: [0x4e4632, 0x827456], rig: 0x4a4632, pants: 0x55503a, boots: 0x262420, pack: 0x4a4030, gloves: 0x2a2824, faceW: -0.1, cheek: -0.4, jaw: 0.8, chin: 0.6, nose: 0.2, brows: 0.6, squint: 0.3, turn: 0.38 },
    zveroboy: { skin: 0xc4a080, hair: 0x2a2420, hairStyle: 'short', facial: 'none', stubble: 0.15, brow: 0x241c16, eyes: 0x4a3a2a, head: 'none', outfit: 'zarya', jacket: 0x6a6a58, camo: [0x52524a, 0x807c66], plates: 0x62625a, pants: 0x55553e, boots: 0x262420, cheek: -0.2, jaw: 0.6, chin: 0.4, nose: 0.4, turn: -0.2 },
    lotsman: { skin: 0xc49a7a, hair: 0x33291f, hairStyle: 'buzz', facial: 'stubble', stubble: 0.35, brow: 0x2a2018, eyes: 0x6a7a8a, head: 'none', outfit: 'zarya', jacket: 0x6e6a4c, camo: [0x524c34, 0x867a58], pants: 0x55553e, boots: 0x262420, pack: 0x4a4030, faceW: -0.2, cheek: -0.3, jaw: 0.4, squint: 0.5, turn: 0.3 }
  };


  function humanRig(look, weapon = 'rifle') {
    const L = LOOKS[look] || LOOKS.loner;
    const heavy = L.build === 'heavy' ? 1 : 0, o = L.outfit || 'zarya';
    const camo = L.camo ? { camo: L.camo } : {};
    const leather = o === 'leather' || o === 'coat' || o === 'bandit' ? { spec: 0.28 } : {};
    const coatC = L.jacket, sleeve = L.sleeve || L.jacket, hand = L.gloves || L.skin;
    const covered = L.head === 'balaclava' || L.head === 'gasmask';
    const headC = L.head === 'balaclava' ? L.hat : L.skin;
    const jacketX = Object.assign({}, camo, leather);
    const W = 1 + heavy * 0.12;
    const parts = [
      part('pelvis', null, [0, 0, 0.95], 'box', [0.1, 0.16 * W, 0.09], [0, 0, 0], L.pants, Object.assign({}, o === 'exo' ? camo : {})),
      part('torso', 'pelvis', [0, 0, 0.06], 'ell', [0.13 * W, 0.18 * W, 0.24], [0, 0, 0.22], o === 'exoArmor' ? sleeve : coatC, jacketX),
      part('chest', 'torso', [0.02, 0, 0.36], 'ell', [0.125 * W, 0.185 * W, 0.13], [0, 0, 0], o === 'exoArmor' || o === 'exo' ? L.jacket : coatC, o === 'exoArmor' ? { spec: 0.3 } : jacketX),
      part('deltL', 'torso', [0, 0.19 * W, 0.44], 'ell', [0.068, 0.07, 0.068], [0, 0, 0], o === 'exoArmor' || o === 'exo' ? L.jacket : sleeve, o === 'exoArmor' ? { spec: 0.3 } : jacketX),
      part('deltR', 'torso', [0, -0.19 * W, 0.44], 'ell', [0.068, 0.07, 0.068], [0, 0, 0], o === 'exoArmor' || o === 'exo' ? L.jacket : sleeve, o === 'exoArmor' ? { spec: 0.3 } : jacketX),
      part('neck', 'torso', [0, 0, 0.5], 'cyl', [0.052, 0.052, 0.05], [0, 0, 0.03], L.head === 'balaclava' ? L.hat : L.skin),
      part('head', 'torso', [0, 0, 0.55], 'ell', [0.1, 0.09, 0.115], [0.005, 0, 0.11], headC),
      part('jaw', 'head', [0, 0, 0], 'ell', [0.075, 0.075, 0.06], [0.04, 0, 0.045], headC),
      part('thighL', 'pelvis', [0, 0.095 * W, -0.03], 'cyl', [0.07, 0.07, 0.21], [0, 0, -0.2], L.pants, o === 'exo' || o === 'zarya' || o === 'merc' || o === 'military' ? camo : {}),
      part('shinL', 'thighL', [0, 0, -0.42], 'cyl', [0.055, 0.055, 0.21], [0, 0, -0.21], L.pants, o === 'exo' || o === 'zarya' || o === 'merc' || o === 'military' ? camo : {}),
      part('bootL', 'shinL', [0, 0, -0.42], 'box', [0.12, 0.055, 0.05], [0.04, 0, -0.03], L.boots),
      part('thighR', 'pelvis', [0, -0.095 * W, -0.03], 'cyl', [0.07, 0.07, 0.21], [0, 0, -0.2], L.pants, o === 'exo' || o === 'zarya' || o === 'merc' || o === 'military' ? camo : {}),
      part('shinR', 'thighR', [0, 0, -0.42], 'cyl', [0.055, 0.055, 0.21], [0, 0, -0.21], L.pants, o === 'exo' || o === 'zarya' || o === 'merc' || o === 'military' ? camo : {}),
      part('bootR', 'shinR', [0, 0, -0.42], 'box', [0.12, 0.055, 0.05], [0.04, 0, -0.03], L.boots),
      part('armL', 'torso', [0, 0.215 * W, 0.44], 'cyl', [0.055, 0.055, 0.15], [0, 0, -0.14], sleeve, o === 'exoArmor' ? {} : jacketX),
      part('foreL', 'armL', [0, 0, -0.29], 'cyl', [0.048, 0.048, 0.13], [0, 0, -0.13], sleeve, o === 'exoArmor' ? {} : jacketX),
      part('handL', 'foreL', [0, 0, -0.27], 'ell', [0.045, 0.035, 0.05], [0, 0, -0.03], hand),
      part('armR', 'torso', [0, -0.215 * W, 0.44], 'cyl', [0.055, 0.055, 0.15], [0, 0, -0.14], sleeve, o === 'exoArmor' ? {} : jacketX),
      part('foreR', 'armR', [0, 0, -0.29], 'cyl', [0.048, 0.048, 0.13], [0, 0, -0.13], sleeve, o === 'exoArmor' ? {} : jacketX),
      part('handR', 'foreR', [0, 0, -0.27], 'ell', [0.045, 0.035, 0.05], [0, 0, -0.03], hand)
    ];
    const H = 'head', add = (...a) => parts.push(part(...a));
    if (!covered) {
      add('nose', H, [0, 0, 0], 'ell', [0.02, 0.014, 0.026], [0.108, 0, 0.085], L.skin);
      add('eyeL', H, [0, 0, 0], 'ell', [0.012, 0.016, 0.009], [0.095, 0.034, 0.118], 0x1a1612, { grain: 0 });
      add('eyeR', H, [0, 0, 0], 'ell', [0.012, 0.016, 0.009], [0.095, -0.034, 0.118], 0x1a1612, { grain: 0 });
      add('browL', H, [0, 0, 0], 'box', [0.012, 0.024, 0.006], [0.1, 0.035, 0.137], L.brow || L.hair || 0x2a2018, { grain: 0 });
      add('browR', H, [0, 0, 0], 'box', [0.012, 0.024, 0.006], [0.1, -0.035, 0.137], L.brow || L.hair || 0x2a2018, { grain: 0 });
      add('earL', H, [0, 0, 0], 'ell', [0.018, 0.012, 0.03], [-0.005, 0.098, 0.1], L.skin);
      add('earR', H, [0, 0, 0], 'ell', [0.018, 0.012, 0.03], [-0.005, -0.098, 0.1], L.skin);
    }
    const hs = L.hairStyle || 'short';
    if (!covered && L.head !== 'hood' && L.head !== 'helmet' && L.head !== 'beanie' && hs !== 'bald') {
      const hz = hs === 'receding' ? [0.098, 0.094, 0.05, -0.028] : hs === 'buzz' ? [0.104, 0.095, 0.056, -0.014] : hs === 'messy' ? [0.114, 0.103, 0.072, -0.01] : [0.107, 0.097, 0.064, -0.012];
      add('hair', H, [0, 0, 0], 'ell', [hz[0], hz[1], hz[2]], [hz[3], 0, 0.168], L.hair, { grain: hs === 'messy' ? 0.5 : 0.3 });
    }
    if (!covered && L.facial === 'full') add('beard', H, [0, 0, 0], 'ell', [0.068, 0.08, 0.07], [0.064, 0, 0.0], L.facialColor || L.hair, { grain: 0.4 });
    if (!covered && L.facial === 'scruffy') add('beard', H, [0, 0, 0], 'ell', [0.058, 0.072, 0.056], [0.066, 0, 0.005], L.facialColor || L.hair, { grain: 0.45 });
    if (!covered && (L.facial === 'full' || L.facial === 'scruffy' || L.facial === 'moustache')) add('moustache', H, [0, 0, 0], 'box', [0.012, 0.042, 0.009], [0.104, 0, 0.052], L.facialColor || L.hair, { grain: 0.3 });
    if (L.head === 'hood') {
      add('hood', H, [0, 0, 0], 'ell', [0.124, 0.114, 0.134], [-0.022, 0, 0.1], L.hood || L.jacket, Object.assign({}, camo));
      add('face', H, [0, 0, 0], 'ell', [0.03, 0.068, 0.074], [0.086, 0, 0.09], L.skin, { grain: 0.05 });
      add('hoodDrape', 'torso', [-0.03, 0, 0.5], 'ell', [0.1, 0.15, 0.08], [0, 0, 0], L.hood || L.jacket, Object.assign({}, camo));
    }
    if (L.head === 'hoodDown') add('hoodRoll', 'torso', [-0.08, 0, 0.5], 'ell', [0.055, 0.12, 0.05], [0, 0, 0], L.jacket, Object.assign({}, camo));
    if (L.head === 'beanie') { add('beanie', H, [0, 0, 0], 'ell', [0.11, 0.1, 0.075], [-0.005, 0, 0.18], L.hat, { grain: 0.35 }); add('beanieRim', H, [0, 0, 0], 'cyl', [0.108, 0.098, 0.018], [-0.005, 0, 0.14], L.hat, { grain: 0.35 }); }
    if (L.head === 'helmet' || (L.head === 'gasmask' && L.hat)) { add('helmet', H, [0, 0, 0], 'ell', [0.127, 0.117, 0.085], [0, 0, 0.175], L.hat, { spec: 0.25 }); add('helmetRim', H, [0, 0, 0], 'cyl', [0.13, 0.12, 0.012], [0, 0, 0.13], L.hat); }
    if (L.head === 'gasmask') {
      add('mask', H, [0, 0, 0], 'ell', [0.07, 0.092, 0.095], [0.062, 0, 0.07], 0x2c2e2a, { spec: 0.25 });
      add('lensL', H, [0, 0, 0], 'ell', [0.012, 0.022, 0.022], [0.12, 0.036, 0.118], 0x607868, { glow: 0.25, spec: 1 });
      add('lensR', H, [0, 0, 0], 'ell', [0.012, 0.022, 0.022], [0.12, -0.036, 0.118], 0x607868, { glow: 0.25, spec: 1 });
      add('filter', H, [0, 0, 0], 'cyl', [0.03, 0.03, 0.03], [0.14, 0, 0.03], L.filter || 0x4e5238, { srot: [0, 1.2, 0] });
    }
    if (L.head === 'balaclava') add('eyeband', H, [0, 0, 0], 'box', [0.012, 0.066, 0.013], [0.098, 0, 0.12], L.skin, { grain: 0.05 });
    if (L.mask === 'bandana') add('bandana', H, [0, 0, 0], 'ell', [0.064, 0.086, 0.058], [0.05, 0, 0.035], L.maskColor || 0x2e3a2a, { grain: 0.3 });
    if (o === 'coat') {
      add('coatBack', 'pelvis', [0, 0, 0], 'box', [0.05, 0.17 * W, 0.26], [-0.075, 0, -0.2], coatC, leather);
      add('coatL', 'thighL', [0, 0, 0], 'box', [0.095, 0.088, 0.2], [0.02, 0.02, -0.17], coatC, leather);
      add('coatR', 'thighR', [0, 0, 0], 'box', [0.095, 0.088, 0.2], [0.02, -0.02, -0.17], coatC, leather);
      add('collar', 'torso', [0, 0, 0.5], 'cyl', [0.085, 0.09, 0.035], [0, 0, 0.02], coatC, leather);
      if (L.inner != null) add('inner', 'torso', [0.1, 0, 0.36], 'box', [0.03, 0.05, 0.1], [0, 0, 0], L.inner, { grain: 0.3 });
    }
    if (o === 'leather' || o === 'bandit') {
      add('collar', 'torso', [0, 0, 0.5], 'cyl', [0.075, 0.08, 0.025], [0, 0, 0.0], coatC, leather);
      if (L.inner != null) add('inner', 'torso', [0.105, 0, 0.38], 'box', [0.025, 0.04, 0.08], [0, 0, 0], L.inner, { grain: 0.3 });
    }
    if (o === 'zarya' || o === 'merc' || o === 'military' || o === 'rags') add('collar', 'torso', [0, 0, 0.5], 'cyl', [0.072, 0.078, 0.035], [0, 0, 0.01], coatC, camo);
    if (o === 'zarya') {
      add('kneeL', 'shinL', [0.05, 0, -0.02], 'ell', [0.035, 0.05, 0.055], [0, 0, 0], L.plates || L.pants);
      add('kneeR', 'shinR', [0.05, 0, -0.02], 'ell', [0.035, 0.05, 0.055], [0, 0, 0], L.plates || L.pants);
      if (L.plates) add('plates', 'chest', [0.1, 0, -0.02], 'box', [0.035, 0.15 * W, 0.1], [0, 0, 0], L.plates, camo);
    }
    if (o === 'merc' || o === 'military') {
      add('vest', 'chest', [0.03, 0, -0.03], 'box', [0.12 * W, 0.17 * W, 0.14], [0, 0, 0], L.vest);
      add('pouches', 'chest', [0.15 * W, 0, -0.1], 'box', [0.03, 0.12, 0.045], [0, 0, 0], L.vest);
    }
    if (o === 'exoArmor' || o === 'exo') {
      add('plates', 'chest', [0.06, 0, -0.03], 'box', [0.1 * W, 0.17 * W, 0.15], [0, 0, 0], L.jacket, { spec: 0.3 });
      add('belly', 'torso', [0.09, 0, 0.12], 'box', [0.05, 0.13 * W, 0.1], [0, 0, 0], L.jacket, { spec: 0.3 });
      add('collar', 'torso', [0, 0, 0.5], 'cyl', [0.078, 0.082, 0.035], [0, 0, 0.01], o === 'exo' ? L.jacket : sleeve, o === 'exo' ? camo : {});
    }
    if (o === 'exo') {
      for (const s of ['L', 'R']) {
        add('thighPlate' + s, 'thigh' + s, [0.06, 0, -0.18], 'box', [0.035, 0.07, 0.15], [0, 0, 0], L.jacket, { spec: 0.3 });
        add('shinPlate' + s, 'shin' + s, [0.055, 0, -0.18], 'box', [0.032, 0.06, 0.16], [0, 0, 0], L.jacket, { spec: 0.3 });
        add('armTube' + s, 'arm' + s, [-0.05, 0, -0.14], 'cyl', [0.012, 0.012, 0.14], [0, 0, 0], 0x3a3a36, { spec: 0.4 });
        add('legTube' + s, 'thigh' + s, [-0.06, 0, -0.2], 'cyl', [0.013, 0.013, 0.2], [0, 0, 0], 0x3a3a36, { spec: 0.4 });
      }
      add('exoPack', 'torso', [-0.17, 0, 0.3], 'box', [0.06, 0.13, 0.16], [0, 0, 0], 0x4a4a42, { spec: 0.3 });
    }
    if (o === 'rags') { add('rag', 'torso', [0.1, 0.08, 0.05], 'box', [0.03, 0.08, 0.1], [0, 0, 0], 0x5a3a2a); add('rag2', 'torso', [0.08, -0.1, -0.02], 'box', [0.03, 0.06, 0.07], [0, 0, 0], 0x3e3a2e); }
    if (L.pack) parts.push(part('pack', 'torso', [-0.17, 0, 0.3], 'box', [0.08, 0.15, 0.17], [0, 0, 0], L.pack), part('roll', 'torso', [-0.16, 0, 0.5], 'cyl', [0.05, 0.05, 0.16], [0, 0, 0], 0x4a4a3a, { srot: [Math.PI / 2, 0, 0] }));
    if (L.straps || L.pack) for (const s of [1, -1]) add('strap' + (s > 0 ? 'L' : 'R'), 'chest', [0.12, s * 0.09 * W, 0.02], 'box', [0.012, 0.022, 0.14], [0, 0, 0], L.straps || 0x2a2a26, { srot: [0, -0.2, 0] });
    if (L.rig) for (const s of [1, -1]) add('rig' + (s > 0 ? 'L' : 'R'), 'chest', [0.14, s * 0.07, -0.08], 'box', [0.03, 0.045, 0.05], [0, 0, 0], L.rig);
    if (weapon === 'rifle' || weapon === 'shotgun' || weapon === 'sniper') {
      const len = weapon === 'sniper' ? 0.62 : weapon === 'shotgun' ? 0.5 : 0.44;
      parts.push(part('gun', 'torso', [0.2, -0.06, 0.32], 'box', [len, 0.025, 0.04], [len * 0.5, 0, 0], 0x2e2e2e, { srot: [0, 0, 0], spec: 0.3 }));
      if (weapon === 'rifle') parts.push(part('mag', 'gun', [0.12, 0, -0.04], 'box', [0.03, 0.018, 0.07], [0, 0, -0.03], 0x3a3230, { srot: [0, -0.3, 0] }));
      if (weapon === 'sniper') parts.push(part('scope', 'gun', [0.1, 0, 0.055], 'cyl', [0.02, 0.02, 0.09], [0, 0, 0], 0x1a1a1a, { srot: [0, Math.PI / 2, 0], spec: 0.4 }));
      parts.push(part('stock', 'gun', [-0.1, 0, -0.02], 'box', [0.13, 0.022, 0.045], [0, 0, 0], weapon === 'rifle' ? 0x6a4428 : 0x5a3a20));
    } else if (weapon === 'pistol') {
      parts.push(part('gun', 'handR', [0.02, 0, -0.04], 'box', [0.08, 0.018, 0.03], [0.06, 0, 0], 0x2a2a2a, { spec: 0.3 }));
    }
    return { parts, height: 1.8 };
  }

  function humanPose(anim, frame, weapon) {
    const rot = {};
    const root = [0, 0, 0, 0, 0, 0];
    const armed = weapon === 'rifle' || weapon === 'shotgun' || weapon === 'sniper';
    const hold = () => {
      if (armed) {
        rot.armR = [0.3, -1.05, -0.35]; rot.foreR = [0, -0.55, 0];
        rot.armL = [-0.35, -1.25, 0.35]; rot.foreL = [0, -0.35, 0.15];
      } else if (weapon === 'pistol') {
        rot.armR = [0.2, -1.35, 0]; rot.foreR = [0, -0.1, 0];
        rot.armL = [-0.3, -1.1, 0.4]; rot.foreL = [0, -0.4, 0];
      }
    };
    if (anim === 'walk' || anim === 'run') {
      const run = anim === 'run' ? 1.45 : 1;
      const ph = frame / 4 * C.TAU, s = Math.sin(ph) * 0.5 * run, c = Math.cos(ph);
      rot.thighL = [0, -s, 0]; rot.thighR = [0, s, 0];
      rot.shinL = [0, Math.max(0, -c) * 0.7 * run, 0]; rot.shinR = [0, Math.max(0, c) * 0.7 * run, 0];
      if (weapon === 'none' || weapon === 'unarmed') { rot.armL = [0, s * 0.8, 0]; rot.armR = [0, -s * 0.8, 0]; rot.foreL = [0, -0.3, 0]; rot.foreR = [0, -0.3, 0]; }
      else hold();
      root[2] = Math.abs(c) * 0.03 * run;
      if (anim === 'run') { rot.torso = [0, 0.18, 0]; }
    } else if (anim === 'aim' || anim === 'fire') {
      hold();
      if (armed) { rot.torso = [0, 0.05, 0]; rot.armR = [0.25, -1.3, -0.25]; rot.foreR = [0, -0.5, 0]; rot.armL = [-0.4, -1.45, 0.3]; rot.foreL = [0, -0.2, 0.1]; }
      if (anim === 'fire') { rot.torso = [0, -0.06, 0]; root[0] = -0.02; }
      rot.thighL = [0, -0.15, 0]; rot.thighR = [0, 0.12, 0]; rot.shinR = [0, 0.1, 0];
    } else if (anim === 'hit') {
      hold(); rot.torso = [0.1, -0.3, 0]; root[0] = -0.05;
    } else if (anim === 'die') {
      const t = (frame + 1) / 4;
      root[4] = -t * 1.5; root[2] = t * 0.13;
      rot.armL = [0.4 * t, 0.9 * t, 0]; rot.armR = [-0.4 * t, 0.7 * t, 0];
      rot.thighL = [0, -0.3 * t, 0]; rot.shinL = [0, 0.6 * t, 0];
    } else if (anim === 'sit') {
      root[2] = -0.5;
      rot.thighL = [0, -1.5, 0.1]; rot.thighR = [0, -1.5, -0.1]; rot.shinL = [0, 1.5, 0]; rot.shinR = [0, 1.5, 0];
      rot.armL = [0, -0.6, 0.2]; rot.foreL = [0, -0.9, 0]; rot.armR = [0, -0.6, -0.2]; rot.foreR = [0, -0.9, 0];
      rot.torso = [0, 0.15, 0];
    } else if (anim === 'talk') {
      rot.armR = [0.2, -0.7 - Math.sin(frame * 1.7) * 0.25, -0.1]; rot.foreR = [0, -0.9, 0];
      rot.armL = [0, 0.05, 0.08];
    } else if (anim === 'guitar') {
      root[2] = -0.5;
      rot.thighL = [0, -1.5, 0.1]; rot.thighR = [0, -1.5, -0.1]; rot.shinL = [0, 1.5, 0]; rot.shinR = [0, 1.5, 0];
      rot.armL = [-0.5, -0.9, 0.3]; rot.foreL = [0, -0.6, 0.6]; rot.armR = [0.4, -0.4 - (frame % 2) * 0.15, -0.3]; rot.foreR = [0, -1.0, -0.4];
    } else if (anim === 'zombie') {
      const ph = frame / 4 * C.TAU, s = Math.sin(ph) * 0.3;
      rot.thighL = [0, -s, 0]; rot.thighR = [0, s, 0]; rot.shinL = [0, 0.2, 0]; rot.shinR = [0, 0.2, 0];
      rot.torso = [0.15, 0.3, 0]; rot.head = [0.35, 0.3, 0];
      hold(); rot.armR = [0.4, -0.5, -0.2]; rot.armL = [-0.2, -0.3, 0.3];
    } else {
      if (armed) { rot.armR = [0.2, -0.45, -0.2]; rot.foreR = [0, -0.9, 0]; rot.armL = [-0.2, -0.7, 0.4]; rot.foreL = [0, -0.7, 0.3]; }
      else if (weapon === 'pistol') { rot.armR = [0.05, -0.1, 0]; rot.foreR = [0, -0.2, 0]; }
      else { rot.armL = [0, 0.02, 0.06]; rot.armR = [0, 0.02, -0.06]; }
    }
    if (armed && anim !== 'die') rot.gun = [0, anim === 'idle' ? 0.55 : anim === 'walk' || anim === 'run' ? 0.35 : 0, anim === 'idle' ? 0.5 : 0];
    return { rot, root };
  }

  const MUTANT_RIGS = {
    dog() {
      const skin = 0x7a6454, dark = 0x4e3a2e, pale = 0x8e7662, X = { camo: [0x5a4436, 0x94785e], grain: 0.35 };
      const parts = [
        part('body', null, [0, 0, 0.5], 'ell', [0.3, 0.115, 0.125], [0, 0, 0], skin, X),
        part('chest', 'body', [0.2, 0, -0.01], 'ell', [0.2, 0.135, 0.2], [0, 0, 0], skin, X),
        part('hips', 'body', [-0.24, 0, 0.04], 'ell', [0.15, 0.115, 0.13], [0, 0, 0], skin, X),
        part('spine', 'body', [0, 0, 0.1], 'ell', [0.38, 0.04, 0.045], [0, 0, 0], dark, { grain: 0.5 }),
        part('wound', 'chest', [0.1, 0.125, 0.04], 'ell', [0.035, 0.015, 0.04], [0, 0, 0], 0x4a1a14, { spec: 0.3 }),
        part('neck', 'chest', [0.14, 0, 0.1], 'cyl', [0.068, 0.06, 0.1], [0.07, 0, 0.03], skin, Object.assign({ srot: [0, 0.95, 0] }, X)),
        part('head', 'chest', [0.33, 0, 0.21], 'ell', [0.11, 0.072, 0.078], [0, 0, 0], skin, X),
        part('brow', 'head', [0.03, 0, 0.045], 'ell', [0.065, 0.06, 0.03], [0, 0, 0], dark),
        part('snout', 'head', [0.1, 0, -0.02], 'ell', [0.11, 0.042, 0.038], [0.02, 0, 0], dark, { grain: 0.3 }),
        part('mouth', 'head', [0.1, 0, -0.046], 'ell', [0.085, 0.032, 0.012], [0.01, 0, 0], 0x6a1814, { spec: 0.4 }),
        part('teeth', 'head', [0.12, 0, -0.052], 'box', [0.06, 0.029, 0.007], [0, 0, 0], 0xd8d0b8),
        part('jaw', 'head', [0.07, 0, -0.07], 'ell', [0.1, 0.034, 0.017], [0.02, 0, 0], 0x6a4a3e, { srot: [0, 0.22, 0] }),
        part('earL', 'head', [-0.04, 0.05, 0.05], 'ell', [0.035, 0.012, 0.04], [0, 0, 0.02], dark, { srot: [0.4, -0.5, 0] }),
        part('earR', 'head', [-0.04, -0.05, 0.05], 'ell', [0.035, 0.012, 0.04], [0, 0, 0.02], dark, { srot: [-0.4, -0.5, 0] }),
        part('tail', 'hips', [-0.12, 0, 0.04], 'cyl', [0.018, 0.012, 0.16], [0, 0, -0.14], dark, { srot: [0, 0.6, 0] })
      ];
      for (let i = 0; i < 3; i++) for (const s of [1, -1]) parts.push(part('rib' + i + (s > 0 ? 'L' : 'R'), 'chest', [-0.03 - i * 0.07, s * 0.115, -0.03], 'ell', [0.013, 0.024, 0.1], [0, 0, 0], pale, { grain: 0.2, srot: [s * 0.2, 0, 0] }));
      for (const [n, x, y] of [['fl', 0.24, 0.08], ['fr', 0.24, -0.08], ['bl', -0.26, 0.075], ['br', -0.26, -0.075]]) {
        const hind = n[0] === 'b';
        parts.push(
          part('leg' + n, 'body', [x, y, -0.03], hind ? 'ell' : 'cyl', hind ? [0.07, 0.045, 0.13] : [0.034, 0.032, 0.12], [0, 0, -0.12], skin, X),
          part('paw' + n, 'leg' + n, [0, 0, -0.24], 'cyl', [0.022, 0.018, 0.11], [0, 0, -0.11], dark),
          part('foot' + n, 'paw' + n, [0, 0, -0.22], 'ell', [0.036, 0.022, 0.016], [0.015, 0, 0], dark));
      }
      return { parts, height: 0.8 };
    },
    flesh() {
      const skin = 0x7a5040, dark = 0x4e2e24, X = { camo: [0x5a3428, 0x96644e], grain: 0.35, spec: 0.14 };
      const parts = [
        part('body', null, [0, 0, 0.56], 'ell', [0.44, 0.37, 0.34], [0, 0, 0], skin, X),
        part('hump', 'body', [-0.08, 0, 0.2], 'ell', [0.36, 0.32, 0.22], [0, 0, 0], skin, X),
        part('lump1', 'body', [0.05, 0.26, 0.14], 'ell', [0.13, 0.11, 0.11], [0, 0, 0], 0x6a4234, X),
        part('lump2', 'body', [-0.2, -0.25, 0.18], 'ell', [0.11, 0.1, 0.1], [0, 0, 0], 0x6a4234, X),
        part('head', 'body', [0.36, 0, -0.02], 'ell', [0.18, 0.21, 0.19], [0.05, 0, 0], skin, X),
        part('lip', 'head', [0.18, 0, -0.035], 'ell', [0.04, 0.11, 0.02], [0, 0, 0], dark),
        part('mouth', 'head', [0.19, 0, -0.075], 'ell', [0.05, 0.1, 0.035], [0, 0, 0], 0x3a1210, { spec: 0.4 })
      ];
      for (const [n, x, y, z] of [['A', 0.16, 0.085, 0.07], ['B', 0.175, 0.015, 0.1], ['C', 0.15, -0.095, 0.05]]) parts.push(
        part('eye' + n, 'head', [x, y, z], 'ell', [0.036, 0.036, 0.036], [0, 0, 0], 0xd8c080, { glow: 0.35, spec: 0.8 }),
        part('iris' + n, 'eye' + n, [0.03, 0, 0], 'ell', [0.01, 0.02, 0.02], [0, 0, 0], 0xa02010, { glow: 0.5 }));
      for (const [n, x, y] of [['fl', 0.28, 0.2], ['fr', 0.28, -0.2]]) parts.push(
        part('leg' + n, 'body', [x, y, -0.14], 'cyl', [0.034, 0.03, 0.1], [0, 0, -0.1], dark, { srot: [0, -0.2, 0] }),
        part('paw' + n, 'leg' + n, [0, 0, -0.2], 'box', [0.024, 0.012, 0.11], [0.03, 0, -0.1], 0x8a7058, { srot: [0, -0.35, 0], grain: 0.3 }),
        part('saw' + n, 'paw' + n, [0.04, 0, -0.1], 'box', [0.008, 0.013, 0.1], [0, 0, 0], 0x2e1c14, { srot: [0, -0.35, 0] }));
      for (const [n, x, y] of [['bl', -0.24, 0.18], ['br', -0.24, -0.18]]) parts.push(
        part('leg' + n, 'body', [x, y, -0.14], 'cyl', [0.08, 0.075, 0.12], [0, 0, -0.12], skin, X),
        part('paw' + n, 'leg' + n, [0, 0, -0.24], 'cyl', [0.055, 0.05, 0.07], [0, 0, -0.07], dark),
        part('hoof' + n, 'paw' + n, [0, 0, -0.14], 'box', [0.05, 0.045, 0.02], [0.01, 0, 0], 0x2a1e18));
      return { parts, height: 1.0 };
    },
    boar() {
      const skin = 0x3e3632, dark = 0x221c18, X = { camo: [0x2a2420, 0x564c44], grain: 0.45 };
      const parts = [
        part('body', null, [0, 0, 0.78], 'ell', [0.62, 0.3, 0.33], [0, 0, 0], skin, X),
        part('hump', 'body', [0.28, 0, 0.18], 'ell', [0.36, 0.28, 0.27], [0, 0, 0], 0x342e2a, { camo: [0x221c18, 0x4a423c], grain: 0.55 }),
        part('mane', 'body', [0.1, 0, 0.3], 'ell', [0.42, 0.045, 0.06], [0, 0, 0], 0x16120e, { grain: 0.7 }),
        part('belly', 'body', [0.05, 0, -0.18], 'ell', [0.45, 0.24, 0.16], [0, 0, 0], 0x4e4640, X),
        part('head', 'body', [0.66, 0, -0.06], 'ell', [0.28, 0.2, 0.22], [0.08, 0, -0.04], skin, X),
        part('brow', 'head', [0.12, 0, 0.1], 'ell', [0.16, 0.17, 0.08], [0, 0, 0], dark),
        part('snout', 'head', [0.34, 0, -0.1], 'cyl', [0.08, 0.1, 0.07], [0, 0, 0], 0x5a4a44, { srot: [0, 1.57, 0] }),
        part('nose', 'head', [0.41, 0, -0.1], 'cyl', [0.075, 0.095, 0.01], [0, 0, 0], 0x9a6a62, { srot: [0, 1.57, 0], spec: 0.3 }),
        part('mouth', 'head', [0.28, 0, -0.19], 'ell', [0.1, 0.1, 0.025], [0, 0, 0], 0x5a1a14, { spec: 0.3 }),
        part('eyeL', 'head', [0.2, 0.13, 0.04], 'ell', [0.016, 0.016, 0.016], [0, 0, 0], 0xc02010, { glow: 0.6 }),
        part('eyeR', 'head', [0.2, -0.13, 0.04], 'ell', [0.016, 0.016, 0.016], [0, 0, 0], 0xc02010, { glow: 0.6 }),
        part('earL', 'head', [0.02, 0.14, 0.14], 'ell', [0.05, 0.02, 0.07], [0, 0, 0.03], dark, { srot: [0.5, -0.3, 0] }),
        part('earR', 'head', [0.02, -0.14, 0.14], 'ell', [0.05, 0.02, 0.07], [0, 0, 0.03], dark, { srot: [-0.5, -0.3, 0] })
      ];
      for (const s of [1, -1]) {
        const sd = s > 0 ? 'L' : 'R';
        parts.push(part('tusk' + sd, 'head', [0.3, s * 0.1, -0.16], 'cyl', [0.02, 0.018, 0.07], [0, 0, 0.05], 0xe4dcc0, { srot: [s * 0.3, -0.5, 0], spec: 0.4 }),
          part('tip' + sd, 'tusk' + sd, [0, 0, 0.1], 'cyl', [0.014, 0.008, 0.04], [0, 0, 0.03], 0xe4dcc0, { rot: [s * 0.4, -0.3, 0], spec: 0.4 }));
      }
      for (const [n, x, y] of [['fl', 0.42, 0.17], ['fr', 0.42, -0.17], ['bl', -0.44, 0.16], ['br', -0.44, -0.16]]) parts.push(
        part('leg' + n, 'body', [x, y, -0.2], 'cyl', [0.08, 0.075, 0.17], [0, 0, -0.17], skin, X),
        part('paw' + n, 'leg' + n, [0, 0, -0.34], 'cyl', [0.05, 0.045, 0.1], [0, 0, -0.1], dark),
        part('hoof' + n, 'paw' + n, [0, 0, -0.2], 'box', [0.055, 0.045, 0.03], [0.015, 0, -0.01], 0x141010, { spec: 0.3 }));
      return { parts, height: 1.2 };
    },
    bloodsucker() {
      const skin = 0x5e6056, dark = 0x3e4038, X = { camo: [0x444a40, 0x7c7c6a], grain: 0.25, spec: 0.15 };
      const parts = [
        part('pelvis', null, [0, 0, 0.98], 'box', [0.1, 0.17, 0.1], [0, 0, 0], dark, X),
        part('torso', 'pelvis', [0, 0, 0.06], 'ell', [0.15, 0.21, 0.28], [0, 0, 0.26], skin, X),
        part('chest', 'torso', [0.03, 0, 0.4], 'ell', [0.15, 0.25, 0.15], [0, 0, 0], skin, X),
        part('deltL', 'torso', [0, 0.25, 0.48], 'ell', [0.09, 0.09, 0.09], [0, 0, 0], skin, X),
        part('deltR', 'torso', [0, -0.25, 0.48], 'ell', [0.09, 0.09, 0.09], [0, 0, 0], skin, X),
        part('blood', 'chest', [0.12, 0.05, -0.02], 'ell', [0.035, 0.08, 0.07], [0, 0, 0], 0x4a1410, { spec: 0.3 }),
        part('rag', 'pelvis', [0.02, 0, -0.07], 'box', [0.115, 0.185, 0.07], [0, 0, 0], 0x4a3a28, { grain: 0.4 }),
        part('neck', 'torso', [0.02, 0, 0.55], 'cyl', [0.06, 0.06, 0.05], [0.02, 0, 0.03], skin),
        part('head', 'torso', [0.04, 0, 0.6], 'ell', [0.11, 0.09, 0.14], [0.03, 0, 0.12], skin, X),
        part('brow', 'head', [0, 0, 0], 'ell', [0.05, 0.085, 0.03], [0.1, 0, 0.16], dark),
        part('eyeL', 'head', [0, 0, 0], 'ell', [0.012, 0.016, 0.01], [0.118, 0.035, 0.13], 0xc8a030, { glow: 0.45 }),
        part('eyeR', 'head', [0, 0, 0], 'ell', [0.012, 0.016, 0.01], [0.118, -0.035, 0.13], 0xc8a030, { glow: 0.45 })
      ];
      [[0.035, 0.07, 0.35], [0.012, 0.055, 0.15], [-0.012, 0.055, -0.15], [-0.035, 0.07, -0.35]].forEach(([y, z, a], i) => parts.push(
        part('tent' + i, 'head', [0.13, y, z], 'cyl', [0.016, 0.013, 0.06], [0, 0, -0.06], 0x9a4a42, { rot: [a, 0.35, 0], spec: 0.35 }),
        part('tentTip' + i, 'tent' + i, [0, 0, -0.12], 'cyl', [0.012, 0.007, 0.05], [0, 0, -0.05], 0x8a3a34, { rot: [a * 0.6, 0.25, 0], spec: 0.35 })));
      for (const s of [1, -1]) {
        const sd = s > 0 ? 'L' : 'R';
        parts.push(
          part('arm' + sd, 'torso', [0, s * 0.25, 0.46], 'cyl', [0.07, 0.07, 0.17], [0, 0, -0.16], skin, X),
          part('fore' + sd, 'arm' + sd, [0, 0, -0.33], 'cyl', [0.06, 0.05, 0.17], [0, 0, -0.16], skin, X),
          part('hand' + sd, 'fore' + sd, [0, 0, -0.33], 'ell', [0.05, 0.04, 0.06], [0, 0, -0.03], skin),
          part('thigh' + sd, 'pelvis', [0, s * 0.1, -0.03], 'cyl', [0.08, 0.075, 0.22], [0, 0, -0.21], skin, X),
          part('shin' + sd, 'thigh' + sd, [0, 0, -0.43], 'cyl', [0.06, 0.05, 0.22], [0, 0, -0.21], skin, X),
          part('boot' + sd, 'shin' + sd, [0, 0, -0.43], 'box', [0.12, 0.055, 0.04], [0.05, 0, -0.02], dark));
        for (let k = 0; k < 3; k++) parts.push(part('claw' + sd + k, 'hand' + sd, [0.02, (k - 1) * 0.022, -0.07], 'cyl', [0.009, 0.004, 0.035], [0, 0, -0.03], 0xd8ccb0, { rot: [0, 0.4, 0] }));
      }
      return { parts, height: 2.0 };
    },
    chimera() {
      const skin = 0x6a625a, dark = 0x3a3632, X = { camo: [0x524a44, 0x847a70], grain: 0.3, spec: 0.1 };
      const parts = [
        part('body', null, [0, 0, 1.0], 'ell', [0.85, 0.36, 0.38], [0, 0, 0], skin, X),
        part('chest', 'body', [0.55, 0, 0.04], 'ell', [0.5, 0.46, 0.5], [0, 0, 0], skin, X),
        part('shoulders', 'body', [0.4, 0, 0.36], 'ell', [0.38, 0.43, 0.3], [0, 0, 0], skin, X),
        part('hind', 'body', [-0.62, 0, 0.02], 'ell', [0.4, 0.38, 0.38], [0, 0, 0], skin, X),
        part('spine', 'body', [0, 0, 0.37], 'ell', [0.8, 0.08, 0.06], [0, 0, 0], dark, { grain: 0.4 }),
        part('neck', 'chest', [0.36, 0.05, -0.16], 'ell', [0.26, 0.2, 0.22], [0, 0, 0], skin, X),
        part('head', 'body', [1.08, 0.14, -0.3], 'ell', [0.26, 0.19, 0.2], [0.1, 0, 0], 0x7c726a, X),
        part('jaw', 'head', [0.2, 0, -0.12], 'ell', [0.18, 0.14, 0.07], [0.06, 0, 0], dark),
        part('fangs', 'head', [0.3, 0, -0.1], 'box', [0.06, 0.1, 0.03], [0, 0, 0], 0xd8d0b8, { spec: 0.3 }),
        part('head2', 'body', [0.95, -0.27, -0.16], 'ell', [0.19, 0.14, 0.15], [0.06, 0, 0], 0x5a524c, X),
        part('jaw2', 'head2', [0.14, 0, -0.08], 'ell', [0.11, 0.09, 0.05], [0.03, 0, 0], 0x2e2a26),
        part('eyeA', 'head', [0.24, 0.08, 0.08], 'ell', [0.025, 0.025, 0.02], [0, 0, 0], 0xe06020, { glow: 0.8 }),
        part('eyeC', 'head', [0.24, -0.08, 0.08], 'ell', [0.022, 0.022, 0.018], [0, 0, 0], 0xe06020, { glow: 0.8 }),
        part('eyeB', 'head2', [0.2, 0.06, 0.06], 'ell', [0.02, 0.02, 0.02], [0, 0, 0], 0xe06020, { glow: 0.8 }),
        part('tail', 'hind', [-0.35, 0, 0.1], 'cyl', [0.05, 0.03, 0.42], [0, 0, -0.38], dark, { srot: [0, 0.9, 0] })
      ];
      for (const [n, x, y, f] of [['fl', 0.62, 0.3, 1], ['fr', 0.62, -0.3, 1], ['bl', -0.66, 0.28, 0], ['br', -0.66, -0.28, 0]]) {
        parts.push(
          part('leg' + n, 'body', [x, y, f ? -0.25 : -0.2], 'cyl', [f ? 0.13 : 0.11, f ? 0.12 : 0.1, f ? 0.2 : 0.22], [0, 0, f ? -0.2 : -0.22], skin, X),
          part('paw' + n, 'leg' + n, [0, 0, f ? -0.4 : -0.44], 'cyl', [f ? 0.09 : 0.08, f ? 0.085 : 0.075, f ? 0.17 : 0.18], [0.03, 0, f ? -0.16 : -0.17], dark, X),
          part('foot' + n, 'paw' + n, [0, 0, f ? -0.33 : -0.35], 'ell', [0.12, 0.09, 0.04], [0.05, 0, 0.0], dark));
        if (f) for (let k = 0; k < 3; k++) parts.push(part('claw' + n + k, 'foot' + n, [0.16, (k - 1) * 0.045, -0.01], 'cyl', [0.014, 0.006, 0.05], [0, 0, 0], 0xd8ccb0, { srot: [0, 1.9, 0] }));
      }
      return { parts, height: 1.7 };
    }
  };

  const LEG_BEND = { dog: [-0.35, 0.6], boar: [-0.15, 0.3], chimera: [-0.25, 0.45] };

  function quadPose(kind, anim, frame) {
    const rot = {}, root = [0, 0, 0, 0, 0, 0];
    const legs = ['fl', 'fr', 'bl', 'br'];
    if (anim === 'walk' || anim === 'run') {
      const ph = frame / 4 * C.TAU, amp = anim === 'run' ? 0.7 : 0.4;
      legs.forEach((l, i) => {
        const off = (l === 'fl' || l === 'br') ? 0 : Math.PI;
        const s = Math.sin(ph + off) * amp;
        rot['leg' + l] = [0, s, 0];
        rot['paw' + l] = [0, Math.max(0, Math.cos(ph + off)) * amp, 0];
      });
      root[2] = Math.abs(Math.sin(ph * 2)) * 0.04;
      if (anim === 'run') rot.head = [0, -0.15, 0];
    } else if (anim === 'attack' || anim === 'fire') {
      const t = frame % 2;
      root[4] = t ? -0.25 : 0.15; root[0] = t ? 0.18 : 0;
      rot.head = [0, t ? 0.35 : -0.2, 0];
      if (kind === 'chimera') rot.head2 = [0, t ? 0.4 : -0.1, 0];
      rot.legfl = [0, -0.6, 0]; rot.legfr = [0, -0.5, 0];
    } else if (anim === 'die') {
      const t = (frame + 1) / 4;
      root[3] = t * 1.5; root[2] = -t * 0.25;
      legs.forEach(l => { rot['leg' + l] = [0.2 * t, -0.3 * t, 0]; });
    } else if (anim === 'hit') {
      root[4] = 0.2; rot.head = [0.3, 0.2, 0];
    } else {
      rot.head = [0, 0.05, 0];
    }
    if (kind === 'flesh') delete rot.head;
    const bend = LEG_BEND[kind];
    if (bend && anim !== 'die') for (const l of ['bl', 'br']) {
      const a = rot['leg' + l] || [0, 0, 0], b = rot['paw' + l] || [0, 0, 0];
      rot['leg' + l] = [a[0], a[1] + bend[0], a[2]]; rot['paw' + l] = [b[0], b[1] + bend[1], b[2]];
    }
    return { rot, root };
  }

  const KIND_INFO = {
    human: { w: 64, h: 96, ppm: 44, ay: 92 },
    dog: { w: 84, h: 60, ppm: 52, ay: 57 },
    flesh: { w: 88, h: 64, ppm: 50, ay: 61 },
    boar: { w: 116, h: 84, ppm: 50, ay: 81 },
    bloodsucker: { w: 72, h: 104, ppm: 46, ay: 100 },
    chimera: { w: 150, h: 104, ppm: 44, ay: 100 }
  };
  const ANIM_FRAMES = { idle: 1, walk: 4, run: 4, aim: 1, fire: 1, hit: 1, die: 4, sit: 1, talk: 2, guitar: 2, zombie: 4, attack: 2 };

  class SpriteBank {
    constructor() {
      this.cache = new Map();
      this.rigs = new Map();
      this.trees = {};
      this.grass = {};
      this.misc = {};
      this.generateStatic();
    }
    generateStatic() {
      const kinds = ['pine', 'birch', 'dead', 'irontree', 'willow', 'bush'];
      for (const k of kinds) this.trees[k] = [0, 1, 2].map(v => treeSprite(k, 1000 + v * 17 + k.length * 131));
      for (const k of ['grass', 'dry', 'reed']) this.grass[k] = [0, 1, 2].map(v => grassSprite(k, 500 + v * 23 + k.length * 7));
      this.misc = buildMiscSprites();
    }
    rig(kind, look, weapon) {
      const key = kind + '|' + look + '|' + weapon;
      let r = this.rigs.get(key);
      if (!r) { r = kind === 'human' ? humanRig(look, weapon) : MUTANT_RIGS[kind](); this.rigs.set(key, r); }
      return r;
    }
    actor(kind, look, weapon, anim, frame, dir, hi = false) {
      const frames = ANIM_FRAMES[anim] || 1;
      frame = ((frame % frames) + frames) % frames;
      dir = ((dir % 8) + 8) % 8;
      const key = kind + '|' + look + '|' + weapon + '|' + anim + '|' + frame + '|' + dir + (hi ? '|hi' : '');
      let img = this.cache.get(key);
      if (img) return img;
      const info = KIND_INFO[kind] || KIND_INFO.human;
      const rig = this.rig(kind, look, weapon);
      const pose = kind === 'human' || kind === 'bloodsucker' ? humanPose(anim === 'attack' ? 'aim' : anim, frame, kind === 'bloodsucker' ? 'none' : weapon) : quadPose(kind, anim, frame);
      if (kind === 'bloodsucker' && anim === 'attack') { pose.rot.armL = [-0.3, -1.4, 0.3]; pose.rot.armR = [0.3, -1.4 - frame * 0.3, -0.3]; pose.rot.torso = [0, 0.35, 0]; }
      if (kind === 'bloodsucker' && (anim === 'walk' || anim === 'run' || anim === 'idle')) { pose.rot.torso = [0, 0.35, 0]; pose.rot.head = [0, -0.25, 0]; pose.rot.armL = [0, -0.2, 0.15]; pose.rot.armR = [0, -0.2, -0.15]; }
      const k = hi ? 2 : 1, w = (anim === 'die' && (kind === 'human' || kind === 'bloodsucker') ? 184 : info.w) * k, ax = w / 2;
      img = renderRig(rig, pose, { w, h: info.h * k, ppm: info.ppm * k, ax, ay: info.ay * k, azimuth: dir * Math.PI / 4, elevation: 0.16, levels: hi ? 12 : 7, outlineK: hi ? 0.4 : 0.3 });
      this.cache.set(key, img);
      return img;
    }
    portrait(look) {
      const id = C.Portraits.has(look) ? look : 'loner', key = 'portrait|' + id;
      let img = this.cache.get(key);
      if (!img) { img = C.Portraits.render(id); this.cache.set(key, img); }
      return img;
    }
    ground(id) {
      const key = 'ground|' + id;
      let img = this.cache.get(key);
      if (img === undefined) { img = C.Icons.world(id) || null; this.cache.set(key, img); }
      return img;
    }
    hasPortrait(look) { return this.cache.has('portrait|' + (C.Portraits.has(look) ? look : 'loner')); }
  }

  function itemRig(kind) {
    let n = 0;
    const P = (shape, size, pos, color, rot, extra = {}) => part('p' + (n++), null, pos, shape, size, [0, 0, 0], color, Object.assign({ rot: rot || [0, 0, 0] }, extra));
    switch (kind) {
      case 'medkit': return [P('box', [0.1, 0.07, 0.04], [0, 0, 0.04], 0xc8c0b0), P('box', [0.03, 0.071, 0.01], [0, 0, 0.081], 0xb02020), P('box', [0.011, 0.03, 0.041], [0, 0, 0.04], 0xb02020)];
      case 'medkit2': return [P('box', [0.1, 0.07, 0.04], [0, 0, 0.04], 0x3a6ab0), P('box', [0.03, 0.071, 0.01], [0, 0, 0.081], 0xe0e0e0)];
      case 'medkit3': return [P('box', [0.1, 0.07, 0.04], [0, 0, 0.04], 0xc8a030), P('box', [0.03, 0.071, 0.01], [0, 0, 0.081], 0x2a2a2a)];
      case 'bandage': return [P('cyl', [0.04, 0.04, 0.05], [0, 0, 0.04], 0xe8e4d8, [Math.PI / 2, 0, 0])];
      case 'antirad': return [P('box', [0.07, 0.04, 0.02], [0, 0, 0.02], 0xe0e0e0), P('box', [0.02, 0.041, 0.021], [0.03, 0, 0.02], 0x2a60c0)];
      case 'bread': return [P('ell', [0.13, 0.07, 0.05], [0, 0, 0.05], 0xa87a40)];
      case 'sausage': return [P('cyl', [0.03, 0.03, 0.12], [0, 0, 0.03], 0x8a3a2a, [0, Math.PI / 2, 0])];
      case 'conserva': return [P('cyl', [0.045, 0.045, 0.05], [0, 0, 0.05], 0xa0a4a8), P('box', [0.046, 0.046, 0.02], [0, 0, 0.05], 0x3a6a3a, [0, 0, 0.78])];
      case 'vodka': return [P('cyl', [0.04, 0.04, 0.1], [0, 0, 0.1], 0xd0e0d8, [0, 0, 0], { glow: 0.2 }), P('cyl', [0.015, 0.015, 0.04], [0, 0, 0.24], 0xd0e0d8), P('box', [0.041, 0.041, 0.035], [0, 0, 0.1], 0xc02020)];
      case 'energy': return [P('cyl', [0.03, 0.03, 0.07], [0, 0, 0.07], 0x2050c0), P('cyl', [0.031, 0.031, 0.02], [0, 0, 0.09], 0xe0e020)];
      case 'ammo': return [P('box', [0.08, 0.05, 0.04], [0, 0, 0.04], 0x5a6a3a), P('box', [0.06, 0.051, 0.01], [0, 0, 0.05], 0xc0b070)];
      case 'ammo_shot': return [P('box', [0.08, 0.05, 0.04], [0, 0, 0.04], 0x8a2a20), P('box', [0.06, 0.051, 0.01], [0, 0, 0.05], 0xd0c080)];
      case 'rifle': return [P('box', [0.45, 0.03, 0.04], [0, 0, 0.05], 0x2e2e2e), P('box', [0.14, 0.025, 0.05], [-0.4, 0, 0.05], 0x6a4428), P('box', [0.03, 0.02, 0.07], [0.05, 0.05, 0.04], 0x3a3230, [0.3, 0, 0])];
      case 'pistol': return [P('box', [0.09, 0.02, 0.025], [0, 0, 0.03], 0x2a2a2a), P('box', [0.025, 0.018, 0.05], [-0.05, 0.03, 0.02], 0x3a2a20, [1.2, 0, 0])];
      case 'shotgun': return [P('box', [0.5, 0.03, 0.035], [0, 0, 0.04], 0x2a2a2a), P('box', [0.15, 0.03, 0.05], [-0.5, 0, 0.04], 0x5a3a20)];
      case 'outfit': return [P('box', [0.22, 0.16, 0.05], [0, 0, 0.05], 0x5c6444), P('box', [0.06, 0.1, 0.03], [0.2, 0, 0.06], 0x4a5236)];
      case 'pda': return [P('box', [0.07, 0.045, 0.012], [0, 0, 0.012], 0x2a2a2a), P('box', [0.045, 0.035, 0.002], [0.01, 0, 0.025], 0x40a060, [0, 0, 0], { glow: 0.5 })];
      case 'docs': return [P('box', [0.12, 0.09, 0.015], [0, 0, 0.015], 0xd8d0b0), P('box', [0.121, 0.02, 0.016], [0, 0.04, 0.015], 0x8a2a20)];
      case 'blackbox': return [P('box', [0.14, 0.09, 0.08], [0, 0, 0.08], 0xd87020), P('box', [0.141, 0.02, 0.081], [0, 0.03, 0.08], 0x2a2a2a)];
      case 'tools': return [P('box', [0.18, 0.08, 0.07], [0, 0, 0.07], 0xa02a20), P('box', [0.06, 0.02, 0.03], [0, 0, 0.16], 0x2a2a2a)];
      case 'tools2': return [P('box', [0.16, 0.1, 0.06], [0, 0, 0.06], 0x3a5a8a), P('box', [0.06, 0.02, 0.03], [0, 0, 0.14], 0x2a2a2a)];
      case 'battery': return [P('box', [0.16, 0.1, 0.1], [0, 0, 0.1], 0x2a2a2a), P('cyl', [0.02, 0.02, 0.02], [0.08, 0.04, 0.21], 0xc03020), P('cyl', [0.02, 0.02, 0.02], [0.08, -0.04, 0.21], 0x303030)];
      case 'stash': return [P('box', [0.22, 0.16, 0.18], [0, 0, 0.18], 0x4a4a30), P('box', [0.1, 0.12, 0.05], [0.14, 0, 0.2], 0x3a3a26)];
      case 'part': return [P('ell', [0.1, 0.05, 0.04], [0, 0, 0.04], 0x8a5a4a)];
      case 'grenade': return [P('ell', [0.035, 0.035, 0.045], [0, 0, 0.045], 0x3a4a2a), P('cyl', [0.012, 0.012, 0.02], [0, 0, 0.1], 0x8a8a80)];
      case 'bolt': return [P('cyl', [0.012, 0.012, 0.05], [0, 0, 0.03], 0x8a8a84, [0, Math.PI / 2, 0]), P('cyl', [0.02, 0.02, 0.01], [0.05, 0, 0.03], 0x7a7a74, [0, Math.PI / 2, 0])];
      case 'detector': return [P('box', [0.06, 0.035, 0.02], [0, 0, 0.02], 0x3a3a34), P('ell', [0.01, 0.01, 0.01], [0.03, 0, 0.042], 0x40e040, [0, 0, 0], { glow: 0.8 })];
      default: return [P('box', [0.08, 0.08, 0.08], [0, 0, 0.08], 0x808080)];
    }
  }

  const ARTIFACT_LOOKS = {
    medusa: [0xb0c060, 'ell', [0.07, 0.07, 0.06]],
    stoneflower: [0xc05080, 'ell', [0.08, 0.08, 0.05]],
    nightstar: [0x80c0ff, 'ell', [0.06, 0.06, 0.08]],
    stoneblood: [0x902020, 'box', [0.06, 0.06, 0.05]],
    soul: [0xe0a060, 'ell', [0.08, 0.06, 0.07]],
    bubble: [0x80d0a0, 'ell', [0.09, 0.09, 0.09]],
    flash: [0xe0e0ff, 'ell', [0.05, 0.05, 0.09]],
    moonlight: [0xa0c0e0, 'ell', [0.07, 0.07, 0.07]],
    meatchunk: [0xa05040, 'ell', [0.08, 0.06, 0.05]],
    goldfish: [0xf0c040, 'ell', [0.09, 0.04, 0.05]],
    compass: [0x60e0e0, 'ell', [0.08, 0.08, 0.03]],
    battery: [0x60a0f0, 'box', [0.05, 0.05, 0.07]],
    firefly: [0xf0f060, 'ell', [0.05, 0.05, 0.05]],
    kolobok: [0x708050, 'ell', [0.08, 0.08, 0.08]]
  };

  function buildMiscSprites() {
    const out = {};
    const itemKinds = ['medkit', 'medkit2', 'medkit3', 'bandage', 'antirad', 'bread', 'sausage', 'conserva', 'vodka', 'energy', 'ammo', 'ammo_shot', 'rifle', 'pistol', 'shotgun', 'outfit', 'pda', 'docs', 'blackbox', 'tools', 'tools2', 'battery', 'stash', 'part', 'grenade', 'bolt', 'detector'];
    for (const k of itemKinds) {
      const parts = itemRig(k);
      const big = k === 'rifle' || k === 'shotgun';
      out['item_' + k] = renderRig({ parts }, {}, { w: big ? 64 : 32, h: big ? 24 : 24, ppm: big ? 56 : 120, ax: big ? 32 : 16, ay: 21, azimuth: 0.8, elevation: 0.6 });
    }
    for (const k in ARTIFACT_LOOKS) {
      const [col, shape, size] = ARTIFACT_LOOKS[k];
      const parts = [part('core', null, [0, 0, 0.1], shape, size, [0, 0, 0], col, { glow: 0.45 }), part('spike', null, [0.03, 0.02, 0.1], 'ell', [size[0] * 0.5, size[1] * 0.4, size[2] * 1.3], [0, 0, 0], col, { glow: 0.3, rot: [0.4, 0.6, 0] })];
      out['art_' + k] = renderRig({ parts }, {}, { w: 24, h: 24, ppm: 110, ax: 12, ay: 22, azimuth: 0.5, elevation: 0.3 });
    }
    const glowDisc = (size, col, soft = 1) => {
      const r = new Raster(size, size);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
        if (d >= 1) continue;
        const k = Math.pow(1 - d, soft);
        r.px(x, y, col[0], col[1], col[2], Math.max(25, (k * 255) | 0));
      }
      return r;
    };
    out.fx_fire = glowDisc(32, [255, 150, 50], 1.4).sprite(20, 16, 16);
    out.fx_spark = glowDisc(16, [160, 200, 255], 1.2).sprite(24, 8, 8);
    out.fx_glow = glowDisc(32, [255, 240, 200], 2).sprite(16, 16, 16);
    out.fx_green = glowDisc(32, [120, 255, 120], 1.5).sprite(18, 16, 16);
    out.fx_smoke = (() => { const r = new Raster(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 16, y - 16) / 16 + (valueNoise(x / 4, y / 4, 3) - 0.5) * 0.5; if (d < 1) r.px(x, y, 110, 106, 100, ((1 - d) * 200) | 0); } return r.sprite(14, 16, 16); })();
    out.fx_blood = (() => { const r = new Raster(16, 16); for (let k = 0; k < 18; k++) r.disc(8 + (hash01(k, 1, 4) - 0.5) * 10, 8 + (hash01(k, 2, 4) - 0.5) * 10, 1 + hash01(k, 3, 4) * 2, [120, 20, 16]); return r.sprite(20, 8, 8); })();
    out.fx_campfire = (() => {
      const frames = [];
      for (let f = 0; f < 4; f++) {
        const r = new Raster(32, 40), rnd = C.makeRandom(90 + f);
        for (let k = 0; k < 5; k++) r.line(6 + k * 5, 39, 26 - k * 4, 34, 2.2, [70, 50, 36]);
        for (let k = 0; k < 60; k++) { const x = 16 + (rnd() - 0.5) * 16 * (1 - k / 80), y = 36 - rnd() * 28 * (0.4 + k / 90); const t = (36 - y) / 30; r.disc(x, y, 1.6 + rnd() * 1.8 * (1 - t), [255, lerp(210, 70, t), lerp(80, 20, t)]); }
        frames.push(r.sprite(24, 16, 39));
      }
      return frames;
    })();
    out.crow = [0, 1].map(f => { const r = new Raster(16, 10); r.disc(8, 5, 2.2, [26, 24, 24]); r.line(8, 5, 1, f ? 1 : 7, 1.4, [30, 28, 28]); r.line(8, 5, 15, f ? 1 : 7, 1.4, [30, 28, 28]); return r.sprite(20, 8, 5); });
    return out;
  }

  const GX = [0, Math.PI / 2, 0];
  const GUN = 0x363a40, GUN2 = 0x464a50, WOOD = 0x7a4a26, WOOD2 = 0x5e3a1e, PLUM = 0x6e3424;
  const tube = (r, half, pos, color, extra = 'gunmetal') => ['cyl', [r, r, half], pos, color, GX, extra];
  const role = (r, mat, more) => Object.assign({ mat, role: r }, more || {});
  const shift = (list, dx, dz) => list.map(([sh, sz, p, c, r, e]) => [sh, sz, [p[0] + dx, p[1], p[2] + dz], c, r, e]);
  const rivets = (pts, y) => pts.flatMap(([x, z]) => [['cyl', [0.0032, 0.0032, 0.0012], [x, y, z], 0x5a5e64, [Math.PI / 2, 0, 0], 'metal'], ['cyl', [0.0032, 0.0032, 0.0012], [x, -y, z], 0x5a5e64, [Math.PI / 2, 0, 0], 'metal']]);

  function akBody(o) {
    const L = o.long || 0;
    return [
      ['box', [0.13, 0.018, 0.031], [0, 0, 0], GUN, 0, 'gunmetal'],
      ['box', [0.118, 0.017, 0.012], [-0.004, 0, 0.034], GUN2, 0, 'gunmetal'],
      ['box', [0.024, 0.016, 0.012], [0.132, 0, 0.037], GUN, 0, 'gunmetal'],
      ['box', [0.03, 0.005, 0.004], [0.14, 0, 0.052], GUN, 0, 'gunmetal'],
      ['box', [0.004, 0.014, 0.024], [-0.036, 0, -0.043], GUN, 0, 'gunmetal'],
      ['box', [0.035, 0.012, 0.003], [-0.018, 0, -0.064], GUN, 0, 'gunmetal'],
      ['box', [0.003, 0.004, 0.012], [-0.028, 0, -0.04], GUN2, 0, 'metal'],
      ['box', [0.019, 0.017, 0.052], [-0.085, 0, -0.066], o.grip || PLUM, [0, 0.32, 0], role('grip', 'bakelite')],
      ['box', [0.03, 0.013, 0.035], [0.062, 0, -0.058], o.mag || PLUM, [0, -0.16, 0], role('mag', 'bakelite')],
      ['box', [0.028, 0.013, 0.033], [0.081, 0, -0.118], o.mag || PLUM, [0, -0.36, 0], role('mag', 'bakelite')],
      ['box', [0.026, 0.013, 0.03], [0.11, 0, -0.167], o.mag || PLUM, [0, -0.56, 0], role('mag', 'bakelite')],
      ['box', [0.004, 0.014, 0.028], [0.034, 0, -0.056], GUN, [0, -0.16, 0], 'metal'],
      ['box', [0.08 + L * 0.02, 0.021, 0.012], [0.22 + L * 0.02, 0, 0.042], o.wood || WOOD, 0, 'wood'],
      ['box', [0.086 + L * 0.02, 0.023, 0.02], [0.215 + L * 0.02, 0, 0.012], o.wood || WOOD, 0, role('fore', 'wood', { stripes: [260, 'x'] })]
    ].concat(rivets([[0.03, -0.014], [0.1, -0.02], [-0.05, 0.004], [-0.012, -0.022]], 0.0186));
  }

  const F1 = [
    ['ell', [0.027, 0.027, 0.034], [0, 0, 0.034], 0x4e5a34, 0, { mat: 'metal', spec: 0.25, grid: 180 }],
    ['cyl', [0.009, 0.009, 0.008], [0, 0, 0.074], 0x7a7c70, 0, 'metal'],
    ['cyl', [0.006, 0.006, 0.01], [0, 0, 0.088], 0x7a7c70, 0, 'metal'],
    ['box', [0.004, 0.007, 0.03], [0.014, 0, 0.066], 0x8a8c80, [0, 0.35, 0], 'metal'],
    ['cyl', [0.013, 0.013, 0.0016], [-0.012, 0.01, 0.086], 0x9a9c94, [0.3, 0.9, 0], 'metal'],
    ['cyl', [0.009, 0.009, 0.0018], [-0.012, 0.01, 0.086], 0x2a2a28, [0.3, 0.9, 0], 'plain']
  ];

  const GUN_MODELS = {
    knife: shift([
      ['box', [0.078, 0.0028, 0.015], [0.078, 0, 0.002], 0xb4b6bc, 0, 'chrome'],
      ['box', [0.03, 0.0026, 0.011], [0.156, 0, 0.006], 0xb4b6bc, [0, 0.28, 0], 'chrome'],
      ['box', [0.06, 0.0029, 0.003], [0.06, 0, 0.016], 0x8a8c92, 0, 'metal'],
      ['box', [0.005, 0.012, 0.026], [-0.004, 0, 0], 0x3a3a3c, 0, 'metal'],
      ['box', [0.052, 0.013, 0.015], [-0.062, 0, -0.002], 0x242220, 0, role('grip', 'rubber', { stripes: [340, 'x'] })],
      ['ell', [0.012, 0.014, 0.017], [-0.116, 0, -0.002], 0x3a3a3c, 0, 'metal']
    ], 0.062, 0),
    pm: [
      ['box', [0.078, 0.013, 0.018], [0.022, 0, 0.026], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.07, 0.012, 0.012], [0.014, 0, 0.002], 0x34363a, 0, 'gunmetal'],
      ['box', [0.024, 0.0135, 0.047], [-0.044, 0, -0.036], 0x5a2a1c, [0, 0.2, 0], role('grip', 'bakelite')],
      ['box', [0.027, 0.011, 0.05], [-0.046, 0, -0.034], 0x2e3034, [0, 0.2, 0], 'gunmetal'],
      ['box', [0.03, 0.006, 0.003], [0.02, 0, -0.03], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.003, 0.006, 0.016], [0.048, 0, -0.016], 0x2e3034, 0, 'gunmetal'],
      tube(0.0065, 0.004, [0.1, 0, 0.028], 0x121212),
      ['box', [0.006, 0.008, 0.008], [-0.058, 0, 0.042], 0x2e3034, [0, 0.5, 0], 'gunmetal'],
      ['box', [0.002, 0.004, 0.012], [0.012, 0, -0.018], 0x4a4c50, 0, 'metal'],
      ['box', [0.004, 0.004, 0.004], [0.094, 0, 0.047], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.004, 0.009, 0.004], [-0.05, 0, 0.047], 0x2e3034, 0, 'gunmetal']
    ],
    fort: [
      ['box', [0.088, 0.0135, 0.019], [0.026, 0, 0.027], 0x222326, 0, { mat: 'gunmetal', stripes: [900, 'x'] }],
      ['box', [0.08, 0.0125, 0.013], [0.018, 0, 0.002], 0x26272a, 0, 'gunmetal'],
      ['box', [0.027, 0.014, 0.052], [-0.048, 0, -0.038], 0x18181a, [0, 0.22, 0], role('grip', 'plastic', { grid: 900 })],
      ['box', [0.032, 0.006, 0.003], [0.024, 0, -0.032], 0x26272a, 0, 'gunmetal'],
      ['box', [0.003, 0.006, 0.017], [0.054, 0, -0.017], 0x26272a, 0, 'gunmetal'],
      tube(0.0068, 0.004, [0.114, 0, 0.029], 0x101010),
      ['box', [0.002, 0.004, 0.012], [0.014, 0, -0.019], 0x4a4c50, 0, 'metal'],
      ['box', [0.004, 0.004, 0.004], [0.106, 0, 0.049], 0x222326, 0, 'gunmetal'],
      ['box', [0.004, 0.01, 0.004], [-0.055, 0, 0.049], 0x222326, 0, 'gunmetal']
    ],
    pb: [
      ['box', [0.06, 0.013, 0.018], [0.012, 0, 0.026], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.066, 0.012, 0.012], [0.012, 0, 0.002], 0x34363a, 0, 'gunmetal'],
      tube(0.017, 0.075, [0.14, 0, 0.022], 0x242628),
      tube(0.0172, 0.004, [0.064, 0, 0.022], 0x3a3c40, 'metal'),
      ['box', [0.024, 0.0135, 0.047], [-0.044, 0, -0.036], 0x5a2a1c, [0, 0.2, 0], role('grip', 'bakelite')],
      ['box', [0.027, 0.011, 0.05], [-0.046, 0, -0.034], 0x2e3034, [0, 0.2, 0], 'gunmetal'],
      ['box', [0.03, 0.006, 0.003], [0.02, 0, -0.03], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.003, 0.006, 0.016], [0.048, 0, -0.016], 0x2e3034, 0, 'gunmetal'],
      ['box', [0.004, 0.009, 0.004], [-0.042, 0, 0.047], 0x2e3034, 0, 'gunmetal']
    ],
    toz: [
      tube(0.013, 0.33, [0.3, 0, 0.037], 0x2a2b2e),
      tube(0.013, 0.33, [0.3, 0, 0.011], 0x2a2b2e),
      ['box', [0.33, 0.004, 0.003], [0.3, 0, 0.051], 0x3a3c40, 0, 'metal'],
      ['box', [0.055, 0.02, 0.034], [-0.03, 0, 0.012], 0x8a8a86, 0, { mat: 'metal', grid: 700 }],
      ['box', [0.12, 0.02, 0.016], [0.16, 0, -0.008], WOOD, 0, role('fore', 'wood')],
      ['box', [0.03, 0.006, 0.003], [-0.03, 0, -0.03], 0x2a2b2e, 0, 'gunmetal'],
      ['box', [0.003, 0.004, 0.012], [-0.04, 0, -0.022], 0x9a9a96, 0, 'metal'],
      ['box', [0.05, 0.019, 0.028], [-0.12, 0, -0.018], WOOD, [0, 0.35, 0], role('grip', 'wood')],
      ['box', [0.13, 0.021, 0.036], [-0.25, 0, -0.035], WOOD, [0, -0.14, 0], role('stock', 'wood')],
      ['box', [0.009, 0.022, 0.046], [-0.378, 0, -0.052], 0x1e1c1a, [0, -0.14, 0], role('stock', 'rubber')],
      ['box', [0.006, 0.005, 0.004], [0.62, 0, 0.054], 0xc8c0a0, 0, 'metal'],
      ['box', [0.006, 0.012, 0.004], [-0.052, 0, 0.034], 0x8a8a86, [0, -0.5, 0], 'metal']
    ],
    chaser: [
      tube(0.012, 0.3, [0.3, 0, 0.034], 0x202124),
      tube(0.011, 0.24, [0.24, 0, 0.008], 0x26272a),
      ['cyl', [0.017, 0.016, 0.07], [0.2, 0, 0.012], 0x1c1c1e, GX, role('fore', 'plastic', { stripes: [420, 'z'] })],
      ['box', [0.08, 0.019, 0.032], [-0.02, 0, 0.018], 0x232427, 0, 'gunmetal'],
      ['box', [0.008, 0.006, 0.005], [0.575, 0, 0.049], 0x8a8a86, 0, 'metal'],
      ['box', [0.028, 0.006, 0.003], [-0.03, 0, -0.022], 0x232427, 0, 'gunmetal'],
      ['box', [0.019, 0.017, 0.048], [-0.09, 0, -0.045], 0x18181a, [0, 0.32, 0], role('grip', 'plastic', { grid: 700 })],
      ['box', [0.12, 0.007, 0.006], [-0.21, 0, 0.022], 0x1c1c1e, 0, role('stock', 'gunmetal')],
      ['box', [0.12, 0.007, 0.006], [-0.21, 0, -0.03], 0x1c1c1e, [0, -0.1, 0], role('stock', 'gunmetal')],
      ['box', [0.01, 0.02, 0.046], [-0.33, 0, -0.01], 0x141414, 0, role('stock', 'rubber')],
      ['box', [0.03, 0.0195, 0.004], [-0.012, 0, 0.012], 0x3a3c40, 0, 'metal']
    ],
    aksu: akBody({}).slice(0, 12).concat(rivets([[0.03, -0.014], [0.1, -0.02], [-0.05, 0.004]], 0.0186), [
      ['box', [0.05, 0.021, 0.012], [0.19, 0, 0.042], WOOD, 0, 'wood'],
      ['box', [0.055, 0.023, 0.02], [0.185, 0, 0.012], WOOD, 0, role('fore', 'wood', { stripes: [260, 'x'] })],
      tube(0.009, 0.05, [0.28, 0, 0.018], GUN),
      tube(0.018, 0.035, [0.34, 0, 0.018], 0x26282a),
      ['box', [0.014, 0.013, 0.02], [0.26, 0, 0.038], GUN, 0, 'gunmetal'],
      ['box', [0.12, 0.008, 0.006], [-0.235, 0, 0.012], GUN, 0, role('stock', 'gunmetal')],
      ['box', [0.12, 0.008, 0.006], [-0.228, 0, -0.038], GUN, [0, -0.18, 0], role('stock', 'gunmetal')],
      ['box', [0.01, 0.02, 0.045], [-0.355, 0, -0.018], GUN, 0, role('stock', 'gunmetal')]
    ]),
    ak: akBody({}).concat([
      tube(0.011, 0.1, [0.25, 0, 0.042], GUN),
      tube(0.009, 0.17, [0.38, 0, 0.018], GUN),
      ['box', [0.015, 0.014, 0.022], [0.385, 0, 0.03], GUN, 0, 'gunmetal'],
      ['box', [0.011, 0.012, 0.021], [0.44, 0, 0.03], GUN, 0, 'gunmetal'],
      ['box', [0.003, 0.003, 0.012], [0.44, 0, 0.058], GUN, 0, 'gunmetal'],
      tube(0.0125, 0.03, [0.575, 0, 0.018], 0x26282a),
      ['box', [0.13, 0.02, 0.034], [-0.255, 0, -0.03], WOOD, [0, -0.13, 0], role('stock', 'wood')],
      ['box', [0.06, 0.018, 0.022], [-0.17, 0, 0.002], WOOD, [0, 0.08, 0], role('stock', 'wood')],
      ['box', [0.008, 0.021, 0.053], [-0.386, 0, -0.047], 0x2a2826, [0, -0.13, 0], role('stock', 'rubber')]
    ]),
    trs: [
      ['box', [0.12, 0.019, 0.03], [0, 0, 0], 0x202124, 0, 'gunmetal'],
      ['box', [0.12, 0.018, 0.011], [0, 0, 0.037], 0x26272a, 0, 'gunmetal'],
      ['box', [0.02, 0.012, 0.018], [-0.08, 0, 0.058], 0x1c1c1e, 0, 'gunmetal'],
      ['box', [0.095, 0.024, 0.026], [0.21, 0, 0.022], 0x19191b, 0, role('fore', 'plastic', { stripes: [320, 'x'] })],
      tube(0.009, 0.14, [0.35, 0, 0.022], 0x202124),
      ['box', [0.01, 0.01, 0.03], [0.39, 0, 0.05], 0x202124, 0, 'gunmetal'],
      tube(0.013, 0.03, [0.505, 0, 0.022], 0x18181a),
      ['box', [0.024, 0.013, 0.075], [0.07, 0, -0.08], 0x2a2a2c, [0, -0.08, 0], role('mag', 'metal', { stripes: [260, 'z'] })],
      ['box', [0.004, 0.014, 0.024], [-0.03, 0, -0.043], 0x202124, 0, 'gunmetal'],
      ['box', [0.033, 0.012, 0.003], [-0.012, 0, -0.064], 0x202124, 0, 'gunmetal'],
      ['box', [0.019, 0.017, 0.05], [-0.08, 0, -0.064], 0x141416, [0, 0.3, 0], role('grip', 'plastic', { grid: 700 })],
      tube(0.008, 0.12, [-0.24, 0, 0.014], 0x1c1c1e, role('stock', 'gunmetal')),
      ['cyl', [0.008, 0.008, 0.12], [-0.23, 0, -0.034], 0x1c1c1e, [0, Math.PI / 2 + 0.2, 0], role('stock', 'gunmetal')],
      ['box', [0.012, 0.02, 0.05], [-0.36, 0, -0.012], 0x141414, 0, role('stock', 'rubber')],
      ['box', [0.012, 0.0195, 0.006], [0.04, 0, 0.018], 0x3a3c40, 0, 'metal']
    ],
    vintorez: [
      ['box', [0.12, 0.018, 0.03], [0, 0, 0], GUN, 0, 'gunmetal'],
      ['box', [0.11, 0.017, 0.011], [0, 0, 0.035], GUN2, 0, 'gunmetal'],
      tube(0.023, 0.21, [0.33, 0, 0.018], 0x232527),
      ['cyl', [0.0232, 0.0232, 0.006], [0.2, 0, 0.018], 0x3a3c40, GX, 'metal'],
      ['box', [0.075, 0.024, 0.026], [0.17, 0, 0.02], WOOD, 0, role('fore', 'wood')],
      ['box', [0.024, 0.013, 0.048], [0.06, 0, -0.06], 0x2a2a2c, [0, -0.06, 0], role('mag', 'gunmetal')],
      ['box', [0.004, 0.014, 0.024], [-0.03, 0, -0.043], GUN, 0, 'gunmetal'],
      ['box', [0.033, 0.012, 0.003], [-0.012, 0, -0.064], GUN, 0, 'gunmetal'],
      ['box', [0.12, 0.018, 0.018], [-0.23, 0, 0.004], WOOD, [0, 0.03, 0], role('stock', 'wood')],
      ['box', [0.11, 0.018, 0.016], [-0.25, 0, -0.085], WOOD, [0, -0.08, 0], role('stock', 'wood')],
      ['box', [0.018, 0.018, 0.048], [-0.12, 0, -0.05], WOOD, [0, 0.35, 0], role('grip', 'wood')],
      ['box', [0.016, 0.02, 0.065], [-0.355, 0, -0.04], WOOD2, 0, role('stock', 'wood')],
      tube(0.015, 0.1, [0.0, 0, 0.082], 0x1a1a1c),
      tube(0.019, 0.025, [0.11, 0, 0.082], 0x1a1a1c),
      tube(0.017, 0.026, [-0.115, 0, 0.082], 0x0e0e0e, 'rubber'),
      ['box', [0.012, 0.012, 0.012], [0.0, 0, 0.1], 0x1a1a1c, 0, 'gunmetal'],
      ['box', [0.05, 0.014, 0.012], [0, 0, 0.056], 0x1a1a1c, 0, 'gunmetal']
    ],
    svd: [
      ['box', [0.14, 0.018, 0.03], [0, 0, 0], GUN, 0, 'gunmetal'],
      ['box', [0.13, 0.017, 0.011], [0, 0, 0.035], GUN2, 0, 'gunmetal'],
      tube(0.009, 0.3, [0.5, 0, 0.02], GUN),
      tube(0.013, 0.045, [0.84, 0, 0.02], 0x26282a),
      ['box', [0.16, 0.024, 0.026], [0.3, 0, 0.022], WOOD, 0, role('fore', 'wood', { stripes: [180, 'x'] })],
      tube(0.011, 0.14, [0.3, 0, 0.05], GUN),
      ['box', [0.03, 0.012, 0.045], [0.06, 0, -0.064], 0x2a2a2c, [0, -0.1, 0], role('mag', 'gunmetal', { stripes: [300, 'z'] })],
      ['box', [0.004, 0.014, 0.024], [-0.05, 0, -0.043], GUN, 0, 'gunmetal'],
      ['box', [0.033, 0.012, 0.003], [-0.03, 0, -0.064], GUN, 0, 'gunmetal'],
      ['box', [0.14, 0.02, 0.02], [-0.27, 0, 0.004], WOOD, [0, 0.03, 0], role('stock', 'wood')],
      ['box', [0.12, 0.02, 0.018], [-0.3, 0, -0.1], WOOD, [0, -0.08, 0], role('stock', 'wood')],
      ['box', [0.018, 0.019, 0.05], [-0.15, 0, -0.055], WOOD, [0, 0.38, 0], role('grip', 'wood')],
      ['box', [0.018, 0.021, 0.075], [-0.43, 0, -0.048], WOOD2, 0, role('stock', 'wood')],
      ['box', [0.07, 0.016, 0.012], [-0.3, 0, 0.03], WOOD2, 0, role('stock', 'wood')],
      tube(0.016, 0.12, [0.02, 0, 0.09], 0x1a1a1c),
      tube(0.02, 0.028, [0.15, 0, 0.09], 0x1a1a1c),
      tube(0.018, 0.028, [-0.12, 0, 0.09], 0x0e0e0e, 'rubber'),
      ['box', [0.012, 0.012, 0.012], [0.02, 0, 0.11], 0x1a1a1c, 0, 'gunmetal'],
      ['box', [0.06, 0.014, 0.014], [0.02, 0, 0.06], 0x1a1a1c, 0, 'gunmetal']
    ],
    bolt: [['cyl', [0.012, 0.012, 0.05], [0.03, 0, 0], 0x8a8a84, [0, Math.PI / 2, 0]], ['cyl', [0.022, 0.022, 0.012], [0.08, 0, 0], 0x7a7a74, [0, Math.PI / 2, 0]]],
    grenade: shift(F1, 0.02, -0.034),
    detector_otklik: [
      ['box', [0.02, 0.04, 0.075], [0, 0, 0], 0x34342e, 0, 'plastic'],
      ['box', [0.021, 0.041, 0.007], [0, 0, 0.07], 0x24241f, 0, 'plastic'],
      ['ell', [0.007, 0.007, 0.007], [0.02, 0, 0.054], 0x40e040, 0, { mat: 'glass', glow: 1.1 }],
      ['box', [0.0015, 0.03, 0.022], [0.0205, 0, -0.03], 0x1a1a18, 0, { mat: 'plastic', grid: 1200 }],
      ['cyl', [0.005, 0.005, 0.002], [0.0205, 0.026, 0.03], 0x7a7a70, [0, Math.PI / 2, 0], 'metal'],
      ['cyl', [0.005, 0.005, 0.002], [0.0205, -0.026, 0.03], 0x7a7a70, [0, Math.PI / 2, 0], 'metal'],
      ['box', [0.003, 0.016, 0.03], [-0.023, 0, 0.02], 0x5a5a56, 0, 'metal'],
      ['cyl', [0.004, 0.004, 0.012], [0, 0.03, 0.088], 0x1a1a1a, 0, 'rubber']
    ],
    detector_medved: [
      ['box', [0.024, 0.05, 0.09], [0, 0, 0], 0x5e5a3e, 0, 'plastic'],
      ['cyl', [0.037, 0.037, 0.002], [0.0235, 0, 0.011], 0x3a3a30, [0, Math.PI / 2, 0], 'metal'],
      ['cyl', [0.033, 0.033, 0.003], [0.025, 0, 0.011], 0xc8ccb8, [0, Math.PI / 2, 0], { mat: 'glass', glow: 0.25 }],
      ['ell', [0.006, 0.006, 0.006], [0.025, 0, 0.066], 0xe04040, 0, { mat: 'glass', glow: 0.9 }],
      ['box', [0.004, 0.012, 0.006], [0.025, -0.03, -0.062], 0x2a2a26, 0, 'plastic'],
      ['box', [0.004, 0.012, 0.006], [0.025, 0.03, -0.062], 0x2a2a26, 0, 'plastic'],
      ['box', [0.026, 0.052, 0.006], [0, 0, 0.086], 0x4a4630, 0, 'plastic']
    ],
    detector_veles: [
      ['box', [0.022, 0.05, 0.1], [0, 0, 0], 0x2a2c30, 0, 'plastic'],
      ['box', [0.002, 0.043, 0.045], [0.0215, 0, 0], 0x18181a, 0, 'plastic'],
      ['box', [0.003, 0.038, 0.04], [0.022, 0, 0], 0x1e5a34, 0, { mat: 'glass', glow: 0.7, grid: 600 }],
      ['ell', [0.005, 0.005, 0.005], [0.023, 0, 0.072], 0x40e040, 0, { mat: 'glass', glow: 1 }],
      ['box', [0.004, 0.007, 0.006], [0.023, -0.024, -0.064], 0x6a6a64, 0, 'metal'],
      ['box', [0.004, 0.007, 0.006], [0.023, 0, -0.064], 0x6a6a64, 0, 'metal'],
      ['box', [0.004, 0.007, 0.006], [0.023, 0.024, -0.064], 0xa02a20, 0, 'plastic'],
      ['cyl', [0.004, 0.004, 0.03], [0, 0.036, 0.13], 0x1a1a1a, 0, 'rubber']
    ]
  };

  C.Raster = Raster;
  C.SpriteBank = SpriteBank;
  C.renderRig = renderRig;
  C.shapeHit = shapeHit;
  C.LOOKS = LOOKS;
  C.KIND_INFO = KIND_INFO;
  C.ANIM_FRAMES = ANIM_FRAMES;
  C.GUN_MODELS = GUN_MODELS;
  C.ARTIFACT_LOOKS = ARTIFACT_LOOKS;
})(globalThis.Cop98 = globalThis.Cop98 || {});
