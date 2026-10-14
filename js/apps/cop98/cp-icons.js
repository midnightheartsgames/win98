(function (C) {
  'use strict';
  const { clamp, Mat, valueNoise } = C;
  const HALF = Math.PI / 2;
  const X = [0, HALF, 0], Y = [HALF, 0, 0];

  const MATS = {
    plain: { spec: 0.12, shin: 14 },
    gunmetal: { spec: 0.42, shin: 26 },
    metal: { spec: 0.6, shin: 34 },
    chrome: { spec: 0.9, shin: 60 },
    brass: { spec: 0.75, shin: 40 },
    wood: { spec: 0.22, shin: 18 },
    bakelite: { spec: 0.35, shin: 24 },
    plastic: { spec: 0.28, shin: 18 },
    rubber: { spec: 0.1, shin: 10 },
    cloth: { spec: 0.03, shin: 6 },
    leather: { spec: 0.3, shin: 16 },
    paper: { spec: 0.05, shin: 8 },
    glass: { spec: 1.1, shin: 90 },
    crystal: { spec: 0.9, shin: 50 },
    organic: { spec: 0.45, shin: 28 },
    fur: { spec: 0.05, shin: 6 }
  };

  function prepare(spec) {
    return spec.map(([shape, size, pos, color, rot, extra]) => {
      const r = rot || [0, 0, 0];
      const m = Mat.fromEuler(r[0], r[1], r[2], pos[0], pos[1], pos[2]);
      const o = typeof extra === 'string' ? { mat: extra } : (extra || {});
      return { shape, size, color, m, inv: Mat.invert(m), c: pos, r: Math.hypot(size[0], size[1], size[2]), mat: o.mat || 'plain', o };
    });
  }

  function camera(view) {
    const az = view.az || 0, el = view.el || 0;
    const v = [Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), -Math.sin(el)];
    const r = [Math.cos(az), -Math.sin(az), 0];
    const u = [r[1] * v[2] - r[2] * v[1], r[2] * v[0] - r[0] * v[2], r[0] * v[1] - r[1] * v[0]];
    const roll = view.roll || 0;
    if (!roll) return { v, r, u };
    const cr = Math.cos(roll), sr = Math.sin(roll);
    return { v, r: [r[0] * cr + u[0] * sr, r[1] * cr + u[1] * sr, r[2] * cr + u[2] * sr], u: [u[0] * cr - r[0] * sr, u[1] * cr - r[1] * sr, u[2] * cr - r[2] * sr] };
  }

  function bounds(parts, cam) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const ext = (p, d) => {
      const m = p.m, s = p.size;
      const a = d[0] * m[0] + d[1] * m[1] + d[2] * m[2], b = d[0] * m[3] + d[1] * m[4] + d[2] * m[5], c = d[0] * m[6] + d[1] * m[7] + d[2] * m[8];
      if (p.shape === 'box') return Math.abs(a) * s[0] + Math.abs(b) * s[1] + Math.abs(c) * s[2];
      if (p.shape === 'ell') return Math.hypot(a * s[0], b * s[1], c * s[2]);
      return Math.hypot(a * s[0], b * s[1]) + Math.abs(c) * s[2];
    };
    for (const p of parts) {
      const cx = p.c[0] * cam.r[0] + p.c[1] * cam.r[1] + p.c[2] * cam.r[2], cy = p.c[0] * cam.u[0] + p.c[1] * cam.u[1] + p.c[2] * cam.u[2];
      const ex = ext(p, cam.r), ey = ext(p, cam.u);
      x0 = Math.min(x0, cx - ex); x1 = Math.max(x1, cx + ex); y0 = Math.min(y0, cy - ey); y1 = Math.max(y1, cy + ey);
    }
    return { x0, x1, y0, y1 };
  }

  const col3 = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];

  function texture(p, lx, ly, lz, base) {
    const o = p.o;
    let k = 1;
    switch (p.mat) {
      case 'wood': {
        const g = Math.sin((lx * 70 + valueNoise(lx * 10, lz * 50 + ly * 30, 7) * 3) * 1.3);
        k = 0.9 + 0.06 * g + (valueNoise(lx * 260, lz * 160, 3) - 0.5) * 0.08 + (valueNoise(lx * 18, lz * 18, 4) - 0.5) * 0.12; break;
      }
      case 'gunmetal': case 'metal': case 'chrome':
        k = 0.92 + (valueNoise(lx * 900 + lz * 40, ly * 60 + lz * 900, 5) - 0.5) * 0.14 + (valueNoise(lx * 40, lz * 40, 9) - 0.5) * 0.08; break;
      case 'cloth': k = 0.9 + (valueNoise(lx * 700, lz * 700 + ly * 300, 11) - 0.5) * 0.16 + (valueNoise(lx * 30, lz * 30 + ly * 20, 13) - 0.5) * 0.14; break;
      case 'leather': k = 0.88 + (valueNoise(lx * 90 + ly * 50, lz * 90, 21) - 0.5) * 0.26; break;
      case 'fur': k = 0.75 + valueNoise(lx * 60, lz * 400 + ly * 300, 23) * 0.45; break;
      case 'organic': k = 0.8 + valueNoise(lx * 120 + lz * 40, ly * 120 + lz * 90, 25) * 0.35; break;
      case 'paper': k = 0.95 + (valueNoise(lx * 500, ly * 500 + lz * 300, 27) - 0.5) * 0.08; break;
      default: k = 0.97 + (valueNoise(lx * 400, ly * 400 + lz * 250, 29) - 0.5) * 0.06;
    }
    let c = base;
    if (o.camo) {
      const n1 = valueNoise(lx * 26 + lz * 9, ly * 26 + lz * 17, 31), n2 = valueNoise(lx * 34 - lz * 11 + 5, ly * 34 + lz * 13, 37);
      if (n1 > 0.6) c = col3(o.camo[0]);
      if (n2 > 0.64) c = col3(o.camo[1]);
    }
    if (o.stripes) { const t = Math.sin((o.stripes[1] === 'y' ? ly : o.stripes[1] === 'z' ? lz : lx) * o.stripes[0]); if (t > 0.55) k *= 0.62; }
    if (o.grid) { const a = Math.sin(lx * o.grid) , b = Math.sin((lz + ly) * o.grid); if (Math.abs(a) > 0.86 || Math.abs(b) > 0.86) k *= 0.55; }
    return [c[0] * k, c[1] * k, c[2] * k];
  }

  function trace(parts, ox, oy, oz, dx, dy, dz) {
    let best = 1e9, hp = null, hn = null, hl = null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const cx = p.c[0] - ox, cy = p.c[1] - oy, cz = p.c[2] - oz;
      const tc = cx * dx + cy * dy + cz * dz, d2 = cx * cx + cy * cy + cz * cz - tc * tc;
      if (d2 > p.r * p.r) continue;
      const iv = p.inv;
      const lox = iv[0] * ox + iv[3] * oy + iv[6] * oz + iv[9], loy = iv[1] * ox + iv[4] * oy + iv[7] * oz + iv[10], loz = iv[2] * ox + iv[5] * oy + iv[8] * oz + iv[11];
      const ldx = iv[0] * dx + iv[3] * dy + iv[6] * dz, ldy = iv[1] * dx + iv[4] * dy + iv[7] * dz, ldz = iv[2] * dx + iv[5] * dy + iv[8] * dz;
      const h = C.shapeHit(p.shape, p.size, lox, loy, loz, ldx, ldy, ldz);
      if (h && h.t > 0 && h.t < best) { best = h.t; hp = p; hn = h.n; hl = [lox + ldx * h.t, loy + ldy * h.t, loz + ldz * h.t]; }
    }
    return hp ? { p: hp, t: best, n: hn, l: hl } : null;
  }

  function shade(hit, cam, L) {
    const p = hit.p, m = p.m, n0 = hit.n;
    let nx = m[0] * n0[0] + m[3] * n0[1] + m[6] * n0[2], ny = m[1] * n0[0] + m[4] * n0[1] + m[7] * n0[2], nz = m[2] * n0[0] + m[5] * n0[1] + m[8] * n0[2];
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const v = cam.v;
    if (nx * v[0] + ny * v[1] + nz * v[2] > 0) { nx = -nx; ny = -ny; nz = -nz; }
    if (p.shape === 'box') {
      const sz = p.size, bev = Math.min(sz[0], sz[1], sz[2]) * 0.35, l = hit.l;
      const qx = Math.max(0, Math.abs(l[0]) - (sz[0] - bev)) * Math.sign(l[0]), qy = Math.max(0, Math.abs(l[1]) - (sz[1] - bev)) * Math.sign(l[1]), qz = Math.max(0, Math.abs(l[2]) - (sz[2] - bev)) * Math.sign(l[2]);
      const ql = Math.hypot(qx, qy, qz);
      if (ql > 1e-9 && (qx !== 0) + (qy !== 0) + (qz !== 0) > 1) {
        const bx = m[0] * qx + m[3] * qy + m[6] * qz, by = m[1] * qx + m[4] * qy + m[7] * qz, bz = m[2] * qx + m[5] * qy + m[8] * qz, bl = Math.hypot(bx, by, bz);
        nx = nx * 0.35 + bx / bl * 0.65; ny = ny * 0.35 + by / bl * 0.65; nz = nz * 0.35 + bz / bl * 0.65;
        const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
      }
    }
    const M = MATS[p.mat] || MATS.plain;
    const base = texture(p, hit.l[0], hit.l[1], hit.l[2], col3(p.color));
    const key = Math.max(0, nx * L.key[0] + ny * L.key[1] + nz * L.key[2]);
    const fill = Math.max(0, nx * L.fill[0] + ny * L.fill[1] + nz * L.fill[2]);
    const up = 0.5 + 0.5 * (nx * cam.u[0] + ny * cam.u[1] + nz * cam.u[2]);
    const vdn = -(nx * v[0] + ny * v[1] + nz * v[2]);
    const rim = Math.pow(1 - clamp(vdn, 0, 1), 3) * 0.35;
    const dif = key * 0.95 + fill * 0.32 + 0.16 + up * 0.14;
    const hx = L.key[0] - v[0], hy = L.key[1] - v[1], hz = L.key[2] - v[2], hlen = Math.hypot(hx, hy, hz);
    const spec = (p.o.spec != null ? p.o.spec : M.spec) * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hlen), p.o.shin || M.shin);
    const glow = p.o.glow || 0;
    let r = base[0] * (dif + glow) + spec + rim * 0.5, g = base[1] * (dif + glow) + spec + rim * 0.52, b = base[2] * (dif + glow) + spec + rim * 0.58;
    if (p.mat === 'glass' || p.mat === 'crystal') { const fr = Math.pow(1 - clamp(vdn, 0, 1), 2.5) * 0.5; r += fr * 0.7; g += fr * 0.8; b += fr * 0.9; }
    return [r, g, b];
  }

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function renderSpec(spec, view, w, h, opts = {}) {
    const out = {};
    for (const _ of specRows(spec, view, w, h, opts, out)) void _;
    return out.img;
  }

  function* specRows(spec, view, w, h, opts, out) {
    const parts = prepare(spec), cam = camera(view);
    const bb = bounds(parts, cam), margin = opts.margin != null ? opts.margin : Math.max(2, Math.round(Math.min(w, h) * 0.07));
    const sc = Math.min((w - margin * 2) / Math.max(1e-6, bb.x1 - bb.x0), (h - margin * 2) / Math.max(1e-6, bb.y1 - bb.y0));
    const mx = (bb.x0 + bb.x1) / 2, my = (bb.y0 + bb.y1) / 2;
    const L = { key: norm(add3(mul3(cam.r, -0.55), mul3(cam.u, 0.75), mul3(cam.v, -0.55))), fill: norm(add3(mul3(cam.r, 0.8), mul3(cam.u, 0.1), mul3(cam.v, -0.45))) };
    const ss = w * h > 16000 ? 2 : 3, inv = 1 / (ss * ss);
    const rgba = new Float32Array(w * h * 4);
    const v = cam.v;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const u = (px + (sx + 0.5) / ss - w / 2) / sc + mx, t = (h / 2 - (py + (sy + 0.5) / ss)) / sc + my;
        const ox = cam.r[0] * u + cam.u[0] * t - v[0] * 10, oy = cam.r[1] * u + cam.u[1] * t - v[1] * 10, oz = cam.r[2] * u + cam.u[2] * t - v[2] * 10;
        const hit = trace(parts, ox, oy, oz, v[0], v[1], v[2]);
        if (!hit) continue;
        const c = shade(hit, cam, L);
        r += c[0]; g += c[1]; b += c[2]; a += 1;
      }
      const i = (py * w + px) * 4;
      rgba[i] = r * inv; rgba[i + 1] = g * inv; rgba[i + 2] = b * inv; rgba[i + 3] = a * inv;
      if (px === w - 1) yield;
    }
    out.img = finish(rgba, w, h, opts);
  }

  function finish(rgba, w, h, opts) {
    const out = new Uint32Array(w * h), sh = new Float32Array(w * h);
    const off = Math.max(1, Math.round(Math.min(w, h) / 30)), rad = Math.max(1, off);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let yy = -rad; yy <= rad; yy++) for (let xx = -rad; xx <= rad; xx++) {
        const X = x - off + xx, Y = y - off + yy;
        if (X >= 0 && Y >= 0 && X < w && Y < h) s += rgba[(Y * w + X) * 4 + 3];
        n++;
      }
      sh[y * w + x] = s / n * (opts.shadow == null ? 0.55 : opts.shadow);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = rgba[i * 4 + 3];
      const d = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5);
      if (a <= 0.001) { const sa = sh[i]; out[i] = sa > 0.02 ? ((Math.round(sa * 255) << 24) >>> 0) : 0; continue; }
      const fr = clamp(rgba[i * 4] / a * 255 + d * 8, 0, 255), fg = clamp(rgba[i * 4 + 1] / a * 255 + d * 4, 0, 255), fb = clamp(rgba[i * 4 + 2] / a * 255 + d * 8, 0, 255);
      const qr = Math.round(fr / 8.2258) * 8.2258, qg = Math.round(fg / 4.0476) * 4.0476, qb = Math.round(fb / 8.2258) * 8.2258;
      const sa = sh[i] * (1 - a), oa = a + sa;
      const k = a / oa;
      out[i] = ((Math.round(oa * 255) << 24) | (clamp(qb * k, 0, 255) << 16) | (clamp(qg * k, 0, 255) << 8) | clamp(qr * k, 0, 255)) >>> 0;
    }
    return { w, h, data: out };
  }

  const add3 = (...vs) => vs.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  const SIDE = { az: 0, el: 0.14 };
  const ISO = { az: 0.62, el: 0.52 };
  const FRONT = { az: 0.18, el: 0.12 };
  const TOP = { az: 0.35, el: 0.95 };

  const WEAPON_RIGS = Object.fromEntries(['knife', 'pm', 'fort', 'pb', 'toz', 'chaser', 'aksu', 'ak', 'trs', 'vintorez', 'svd'].map(k => [k, () => C.GUN_MODELS[k]]));

  const CARD = 0x8a7a5a;
  const cart = (x, y, z, caseC, tipC, len = 0.012, r = 0.0045, lying = false) => {
    const rot = lying ? X : 0;
    const off = (d) => lying ? [x + d, y, z] : [x, y, z + d];
    return [
      ['cyl', [r, r, len * 0.55], off(0), caseC, rot, 'brass'],
      ['cyl', [r * 0.72, r * 0.72, len * 0.22], off(len * 0.72), tipC, rot, 'metal'],
      ['ell', [r * 0.72, r * 0.72, len * 0.3], off(len * 0.92), tipC, rot, 'metal']
    ];
  };
  const shell = (x, y, z, hullC) => [
    ['cyl', [0.0095, 0.0095, 0.016], [x, y, z], hullC, 0, { mat: 'plastic', stripes: [1400, 'z'] }],
    ['cyl', [0.0098, 0.0098, 0.004], [x, y, z - 0.017], 0xb89a4a, 0, 'brass']
  ];
  const ammoBox = (boxC, labelC, extra) => [
    ['box', [0.03, 0.022, 0.016], [0, 0.008, 0.016], boxC, 0, 'paper'],
    ['box', [0.0305, 0.0225, 0.006], [0, 0.008, 0.019], labelC, 0, 'paper'],
    ['box', [0.02, 0.0226, 0.002], [0.004, 0.008, 0.019], 0x1c1c1a, 0, { mat: 'paper', stripes: [600, 'x'] }]
  ].concat(extra);

  const AMMO_RIGS = {
    ammo_9x18: () => ammoBox(0x6e7a4a, 0xd8c070, cart(0.012, -0.028, 0.009, 0xb0903c, 0x6a6a60, 0.014, 0.0058).concat(cart(0.03, -0.024, 0.009, 0xb0903c, 0x6a6a60, 0.014, 0.0058))),
    'ammo_12x70': () => ammoBox(0x8a2a22, 0xe0d0a0, shell(0.012, -0.03, 0.021, 0xa02820).concat(shell(0.034, -0.027, 0.021, 0xa02820))),
    'ammo_12x76': () => ammoBox(0x2a4a7a, 0xe0d0a0, shell(0.012, -0.03, 0.021, 0x2a5a2a).concat(shell(0.034, -0.027, 0.021, 0x2a5a2a))),
    'ammo_5.45': () => ammoBox(0x5a6a3a, 0xc8b878, cart(0.01, -0.028, 0.011, 0x7a8a50, 0x5a5a50, 0.022, 0.005).concat(cart(0.026, -0.025, 0.011, 0x7a8a50, 0x5a5a50, 0.022, 0.005))),
    'ammo_5.56': () => ammoBox(0xa89868, 0x2a3a2a, cart(0.01, -0.028, 0.011, 0xc0a04a, 0xb06a3a, 0.022, 0.005).concat(cart(0.026, -0.025, 0.011, 0xc0a04a, 0xb06a3a, 0.022, 0.005))),
    'ammo_9x39': () => ammoBox(0x3a4a34, 0xd0c080, cart(0.01, -0.028, 0.011, 0x7a7a50, 0x2a2a2a, 0.022, 0.0062).concat(cart(0.028, -0.025, 0.011, 0x7a7a50, 0x2a2a2a, 0.022, 0.0062))),
    'ammo_7.62x54': () => ammoBox(0x6a5438, 0xd8c890, cart(0.01, -0.028, 0.014, 0xb89a44, 0x9a5a34, 0.03, 0.0058).concat(cart(0.027, -0.025, 0.014, 0xb89a44, 0x9a5a34, 0.03, 0.0058)))
  };

  function suit(o) {
    const J = o.color, P = o.pants || J, ex = o.camo ? { mat: 'cloth', camo: o.camo } : { mat: o.mat || 'cloth' };
    const parts = [
      ['ell', [0.165, 0.1, 0.25], [0, 0, 0.26], J, 0, ex],
      ['ell', [0.07, 0.07, 0.07], [0.155, 0, 0.44], J, 0, ex],
      ['ell', [0.07, 0.07, 0.07], [-0.155, 0, 0.44], J, 0, ex],
      ['cyl', [0.05, 0.05, 0.2], [0.215, 0, 0.27], J, [0, -0.12, 0], ex],
      ['cyl', [0.05, 0.05, 0.2], [-0.215, 0, 0.27], J, [0, 0.12, 0], ex],
      ['cyl', [0.066, 0.066, 0.29], [0.075, 0, -0.2], P, 0, o.camo ? ex : { mat: o.pantsMat || 'cloth' }],
      ['cyl', [0.066, 0.066, 0.29], [-0.075, 0, -0.2], P, 0, o.camo ? ex : { mat: o.pantsMat || 'cloth' }],
      ['box', [0.15, 0.1, 0.02], [0, 0, 0.02], o.belt || 0x3a3228, 0, 'leather'],
      ['box', [0.08, 0.075, 0.015], [0.075, 0, -0.5], o.boots || 0x2a2622, 0, 'leather'],
      ['box', [0.08, 0.075, 0.015], [-0.075, 0, -0.5], o.boots || 0x2a2622, 0, 'leather'],
      ['cyl', [0.07, 0.065, 0.03], [0, 0, 0.5], J, 0, ex]
    ];
    if (o.hood) parts.push(['ell', [0.105, 0.1, 0.12], [0, -0.02, 0.63], o.hood, 0, ex], ['ell', [0.066, 0.02, 0.08], [0, -0.1, 0.62], 0x121210, 0, 'plain']);
    if (o.helmet) parts.push(['ell', [0.11, 0.11, 0.12], [0, 0, 0.64], o.helmet, 0, { mat: 'plastic' }], ['ell', [0.075, 0.03, 0.06], [0, -0.09, 0.63], o.visor || 0x1e2a26, 0, 'glass']);
    if (o.plates) parts.push(['box', [0.07, 0.03, 0.09], [0.075, -0.09, 0.32], o.plates, [0, 0, -0.2], { mat: o.plateMat || 'cloth', camo: o.camo }], ['box', [0.07, 0.03, 0.09], [-0.075, -0.09, 0.32], o.plates, [0, 0, 0.2], { mat: o.plateMat || 'cloth', camo: o.camo }]);
    if (o.vest) parts.push(['box', [0.15, 0.11, 0.15], [0, 0, 0.3], o.vest, 0, 'cloth'], ['box', [0.035, 0.02, 0.04], [0.07, -0.11, 0.24], o.vest, 0, 'cloth'], ['box', [0.035, 0.02, 0.04], [-0.07, -0.11, 0.24], o.vest, 0, 'cloth']);
    if (o.knees) parts.push(['ell', [0.05, 0.03, 0.05], [0.075, -0.06, -0.24], o.knees, 0, 'plastic'], ['ell', [0.05, 0.03, 0.05], [-0.075, -0.06, -0.24], o.knees, 0, 'plastic']);
    if (o.zip) parts.push(['box', [0.004, 0.005, 0.2], [0, -0.1, 0.3], 0x2a2a26, 0, 'metal']);
    if (o.collar) parts.push(['box', [0.06, 0.03, 0.03], [0.05, -0.07, 0.5], J, [0, 0.4, -0.5], ex], ['box', [0.06, 0.03, 0.03], [-0.05, -0.07, 0.5], J, [0, -0.4, 0.5], ex]);
    if (o.exo) {
      for (const s of [1, -1]) parts.push(['cyl', [0.012, 0.012, 0.28], [s * 0.1, 0.05, -0.2], 0x3a3a36, 0, 'metal'], ['cyl', [0.012, 0.012, 0.18], [s * 0.24, 0.04, 0.27], 0x3a3a36, [0, -s * 0.12, 0], 'metal'], ['box', [0.06, 0.03, 0.12], [s * 0.075, -0.06, -0.12], o.plates || J, 0, 'plastic'], ['box', [0.055, 0.03, 0.12], [s * 0.075, -0.06, -0.38], o.plates || J, 0, 'plastic'], ['ell', [0.085, 0.08, 0.07], [s * 0.16, 0, 0.45], o.plates || J, 0, 'plastic']);
      parts.push(['box', [0.16, 0.11, 0.2], [0, 0, 0.3], o.plates || J, 0, { mat: 'plastic', stripes: [90, 'z'] }]);
    }
    return parts;
  }

  const OUTFIT_RIGS = {
    jacket: () => suit({ color: 0x5a4430, mat: 'leather', pants: 0x3a4a60, collar: true, zip: true }),
    zarya: () => suit({ color: 0x66664a, camo: [0x4e4a34, 0x7e7252], hood: 0x66664a, plates: 0x5c5c44, knees: 0x3a3a30, zip: true }),
    merc: () => suit({ color: 0x4c5868, camo: [0x363e4a, 0x6a7482], vest: 0x2a3038, zip: true }),
    berill: () => suit({ color: 0x4e5a38, camo: [0x3a4428, 0x6a6a44], vest: 0x3e4a30, helmet: 0x4a5434, visor: 0x1a2622, knees: 0x2e3424 }),
    seva: () => suit({ color: 0x8a8a4a, pants: 0x7a7a42, helmet: 0x8a8a4a, visor: 0x30443c, plates: 0x6a6a3a, plateMat: 'plastic', knees: 0x4a4a30, zip: true }),
    exo: () => suit({ color: 0x5a5448, pants: 0x4a463c, plates: 0x6a6252, exo: true })
  };

  const DETECTOR_RIGS = { otklik: () => C.GUN_MODELS.detector_otklik, medved: () => C.GUN_MODELS.detector_medved, veles: () => C.GUN_MODELS.detector_veles };

  const glowMat = (g, m = 'crystal') => ({ mat: m, glow: g });
  const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i / n * Math.PI * 2, i));
  const ART_RIGS = {
    medusa: () => [['ell', [0.03, 0.03, 0.024], [0, 0, 0.04], 0xb8c860, 0, glowMat(0.5)]].concat(ring(8, a => ['ell', [0.007, 0.007, 0.024], [Math.cos(a) * 0.024, Math.sin(a) * 0.024, 0.018], 0x9aa84a, [Math.sin(a) * 0.5, -Math.cos(a) * 0.5, 0], glowMat(0.3, 'organic')])),
    stoneflower: () => [['ell', [0.012, 0.012, 0.012], [0, 0, 0.03], 0xe07098, 0, glowMat(0.6)]].concat(ring(6, a => ['ell', [0.024, 0.009, 0.006], [Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0.03], 0xc05080, [0, -0.45, a], glowMat(0.35)])),
    nightstar: () => [['ell', [0.012, 0.012, 0.012], [0, 0, 0.04], 0x90b8f0, 0, glowMat(0.7)]].concat(ring(6, a => ['ell', [0.028, 0.006, 0.006], [Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0.04], 0x4a78c8, [0, 0, a], glowMat(0.45)]), [['ell', [0.006, 0.006, 0.026], [0, 0, 0.04], 0x4a78c8, 0, glowMat(0.45)]]),
    goldfish: () => [
      ['ell', [0.036, 0.013, 0.018], [0, 0, 0.03], 0xf0c040, 0, { mat: 'metal', glow: 0.35 }],
      ['ell', [0.016, 0.004, 0.018], [-0.042, 0, 0.034], 0xe0a030, [0, 0.5, 0], { mat: 'metal', glow: 0.3 }],
      ['ell', [0.016, 0.004, 0.018], [-0.042, 0, 0.022], 0xe0a030, [0, -0.5, 0], { mat: 'metal', glow: 0.3 }],
      ['ell', [0.012, 0.003, 0.01], [0.004, 0, 0.05], 0xe0a030, [0, 0.4, 0], { mat: 'metal', glow: 0.3 }],
      ['ell', [0.0035, 0.0035, 0.0035], [0.026, -0.009, 0.034], 0x101010, 0, 'glass']
    ],
    flash: () => [['ell', [0.016, 0.016, 0.016], [0, 0, 0.04], 0xc8d8ff, 0, glowMat(0.7)]].concat(ring(8, a => ['ell', [0.03, 0.0035, 0.0035], [Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0.04 + Math.sin(a * 3) * 0.008], 0x7890d0, [0, Math.sin(a * 2) * 0.4, a], glowMat(0.55)])),
    battery: () => [
      ['box', [0.012, 0.012, 0.03], [0, 0, 0.03], 0x60a0f0, [0.1, 0.1, 0.3], glowMat(0.6)],
      ['box', [0.009, 0.009, 0.022], [0.016, 0.006, 0.022], 0x70b0ff, [0.2, -0.35, 0.8], glowMat(0.6)],
      ['box', [0.009, 0.009, 0.02], [-0.014, -0.008, 0.02], 0x5090e0, [-0.3, 0.3, 0.2], glowMat(0.6)],
      ['box', [0.007, 0.007, 0.016], [0.004, -0.016, 0.018], 0x80c0ff, [0.4, 0.1, 1.2], glowMat(0.7)]
    ],
    moonlight: () => [
      ['ell', [0.024, 0.024, 0.024], [0, 0, 0.036], 0xb0c8e8, 0, glowMat(0.7)],
      ['cyl', [0.036, 0.036, 0.0015], [0, 0, 0.036], 0x8aa8d8, [0.5, 0.2, 0], glowMat(0.5)],
      ['cyl', [0.032, 0.032, 0.0015], [0, 0, 0.036], 0x8aa8d8, [-0.4, 0.5, 0], glowMat(0.5)]
    ],
    firefly: () => [['ell', [0.016, 0.016, 0.016], [0, 0, 0.03], 0xf8f070, 0, glowMat(1.3)], ['ell', [0.007, 0.007, 0.007], [0.022, 0.01, 0.046], 0xf0e060, 0, glowMat(1.2)], ['ell', [0.006, 0.006, 0.006], [-0.02, -0.012, 0.05], 0xf0e060, 0, glowMat(1.2)], ['ell', [0.005, 0.005, 0.005], [0.006, 0.02, 0.014], 0xf0e060, 0, glowMat(1.2)]],
    soul: () => ring(3, a => ['ell', [0.012, 0.012, 0.036], [Math.cos(a) * 0.009, Math.sin(a) * 0.009, 0.036], 0xe08a50, [Math.cos(a) * 0.5, Math.sin(a) * 0.5, a], glowMat(0.45, 'organic')]).concat([['ell', [0.012, 0.012, 0.012], [0, 0, 0.07], 0xf0a060, 0, glowMat(0.5, 'organic')]]),
    meatchunk: () => [['ell', [0.03, 0.022, 0.018], [0, 0, 0.022], 0xa04a3a, 0, glowMat(0.15, 'organic')], ['ell', [0.018, 0.016, 0.014], [0.018, 0.01, 0.034], 0xb85a48, [0.3, 0, 0.5], glowMat(0.15, 'organic')], ['ell', [0.014, 0.012, 0.012], [-0.02, -0.008, 0.032], 0x8a3a2e, [0, 0.4, 0], glowMat(0.15, 'organic')], ['ell', [0.008, 0.02, 0.006], [0.0, -0.012, 0.038], 0xd8c0a0, [0.4, 0, 0.3], 'organic']],
    stoneblood: () => [['box', [0.026, 0.02, 0.016], [0, 0, 0.018], 0x7a1a18, [0.2, 0.1, 0.5], { mat: 'crystal', glow: 0.2 }], ['box', [0.016, 0.014, 0.014], [0.018, 0.008, 0.03], 0x902420, [0.5, -0.3, 0.2], { mat: 'crystal', glow: 0.25 }], ['box', [0.012, 0.012, 0.01], [-0.02, -0.006, 0.028], 0x6a1614, [0, 0.6, 1], { mat: 'crystal', glow: 0.2 }]],
    bubble: () => [['ell', [0.02, 0.02, 0.02], [0, 0, 0.026], 0x80d0a0, 0, glowMat(0.4, 'glass')], ['ell', [0.014, 0.014, 0.014], [0.022, 0.006, 0.036], 0x90e0b0, 0, glowMat(0.4, 'glass')], ['ell', [0.012, 0.012, 0.012], [-0.02, -0.004, 0.04], 0x70c090, 0, glowMat(0.4, 'glass')], ['ell', [0.01, 0.01, 0.01], [0.006, -0.018, 0.048], 0x90e0b0, 0, glowMat(0.4, 'glass')], ['ell', [0.008, 0.008, 0.008], [-0.008, 0.016, 0.052], 0xa0f0c0, 0, glowMat(0.4, 'glass')]],
    kolobok: () => [['ell', [0.026, 0.026, 0.026], [0, 0, 0.03], 0x708050, 0, { mat: 'fur', glow: 0.15 }]].concat(ring(7, (a, i) => ['cyl', [0.003, 0.003, 0.03], [Math.cos(a) * 0.01, Math.sin(a) * 0.01, 0.03], 0x8a9a60, [a, a * 1.7, i], { mat: 'organic', glow: 0.2 }])),
    compass: () => [['cyl', [0.034, 0.034, 0.005], [0, 0, 0.02], 0x60e0e0, 0, glowMat(0.6)], ['ell', [0.01, 0.01, 0.01], [0, 0, 0.028], 0xc0ffff, 0, glowMat(1.2)]].concat(ring(3, a => ['ell', [0.03, 0.008, 0.004], [Math.cos(a) * 0.016, Math.sin(a) * 0.016, 0.027], 0x40c0c0, [0, 0, a + 0.6], glowMat(0.7)]))
  };

  const CONS_RIGS = {
    medkit: () => [['box', [0.042, 0.03, 0.018], [0, 0, 0.018], 0xd8d4c8, 0, 'plastic'], ['box', [0.0425, 0.0305, 0.005], [0, 0, 0.022], 0xb02020, 0, 'plastic'], ['box', [0.024, 0.007, 0.0012], [0, 0, 0.0366], 0xb02020, 0, 'plain'], ['box', [0.007, 0.018, 0.0012], [0, 0, 0.0366], 0xb02020, 0, 'plain']],
    medkit_army: () => [['box', [0.044, 0.032, 0.02], [0, 0, 0.02], 0x3a5a8a, 0, 'plastic'], ['box', [0.026, 0.008, 0.0012], [0, 0, 0.0406], 0xe8e8e0, 0, 'plain'], ['box', [0.008, 0.02, 0.0012], [0, 0, 0.0406], 0xe8e8e0, 0, 'plain'], ['box', [0.0445, 0.0325, 0.004], [0, 0, 0.008], 0x2a3a5a, 0, 'plastic']],
    medkit_sci: () => [['box', [0.044, 0.032, 0.02], [0, 0, 0.02], 0xd0a830, 0, 'plastic'], ['cyl', [0.012, 0.012, 0.0012], [0, 0, 0.0406], 0x1a1a1a, 0, 'plain'], ['cyl', [0.004, 0.004, 0.0014], [0, 0, 0.041], 0xd0a830, 0, 'plain'], ['box', [0.0445, 0.0325, 0.004], [0, 0, 0.008], 0x2a5aa0, 0, 'plastic']],
    bandage: () => [['cyl', [0.022, 0.022, 0.028], [0, 0, 0.022], 0xe8e4d8, Y, { mat: 'cloth', stripes: [900, 'y'] }], ['cyl', [0.007, 0.007, 0.0285], [0, 0, 0.022], 0xa8a498, Y, 'cloth'], ['box', [0.02, 0.026, 0.0015], [0.03, 0, 0.0015], 0xe8e4d8, 0, 'cloth']],
    antirad: () => [['box', [0.034, 0.022, 0.011], [0, 0, 0.011], 0xe8e8e8, 0, 'plastic'], ['box', [0.0342, 0.0222, 0.004], [0, 0, 0.012], 0x2a60c0, 0, 'plastic'], ['cyl', [0.005, 0.005, 0.02], [0.02, -0.03, 0.006], 0xd8e8f0, X, 'glass'], ['cyl', [0.0025, 0.0025, 0.006], [0.044, -0.03, 0.006], 0xd8e8f0, X, 'glass']],
    vodka: () => [['cyl', [0.028, 0.028, 0.07], [0, 0, 0.07], 0xc8dcd4, 0, { mat: 'glass', spec: 0.9 }], ['ell', [0.028, 0.028, 0.022], [0, 0, 0.14], 0xc8dcd4, 0, { mat: 'glass', spec: 0.9 }], ['cyl', [0.011, 0.011, 0.035], [0, 0, 0.18], 0xc8dcd4, 0, { mat: 'glass', spec: 0.9 }], ['cyl', [0.0125, 0.0125, 0.012], [0, 0, 0.22], 0xb82020, 0, 'metal'], ['cyl', [0.0285, 0.0285, 0.028], [0, 0, 0.07], 0xe8e0d0, 0, 'paper'], ['cyl', [0.0288, 0.0288, 0.008], [0, 0, 0.07], 0xb82020, 0, 'paper']],
    bread: () => [['ell', [0.12, 0.034, 0.03], [0, 0, 0.03], 0xb8844a, 0, { mat: 'paper', spec: 0.2 }]].concat([-0.06, -0.02, 0.02, 0.06].map(x => ['box', [0.012, 0.022, 0.004], [x, 0, 0.056], 0xe0c080, [0, 0, 0.5], 'paper'])),
    sausage: () => [['cyl', [0.02, 0.02, 0.1], [0, 0, 0.02], 0x8a3a2a, X, { mat: 'organic', spec: 0.35 }], ['ell', [0.02, 0.02, 0.012], [0.1, 0, 0.02], 0x8a3a2a, X, 'organic'], ['ell', [0.02, 0.02, 0.012], [-0.1, 0, 0.02], 0x8a3a2a, X, 'organic'], ['cyl', [0.006, 0.006, 0.006], [0.116, 0, 0.02], 0x9a9a90, X, 'metal'], ['cyl', [0.006, 0.006, 0.006], [-0.116, 0, 0.02], 0x9a9a90, X, 'metal']],
    conserva: () => [['cyl', [0.034, 0.034, 0.03], [0, 0, 0.03], 0xa8acb0, 0, 'metal'], ['cyl', [0.0345, 0.0345, 0.018], [0, 0, 0.03], 0x3a6a3a, 0, 'paper'], ['cyl', [0.035, 0.035, 0.002], [0, 0, 0.06], 0x8a8e92, 0, 'metal'], ['box', [0.03, 0.008, 0.001], [0, 0, 0.021], 0xe0d8b0, 0, 'paper']],
    energy: () => [['cyl', [0.022, 0.022, 0.048], [0, 0, 0.048], 0x2050c0, 0, 'metal'], ['cyl', [0.0222, 0.0222, 0.01], [0, 0, 0.058], 0xe0e020, 0, 'metal'], ['cyl', [0.018, 0.018, 0.003], [0, 0, 0.098], 0xb0b0b0, 0, 'chrome']],
    f1: () => C.GUN_MODELS.grenade
  };

  const PART_RIGS = {
    dog_tail: () => [0, 1, 2, 3, 4, 5].map(i => ['ell', [0.024 - i * 0.0025, 0.014 - i * 0.0018, 0.014 - i * 0.0018], [-0.07 + i * 0.03, 0, 0.02 + Math.sin(i * 0.7) * 0.012], i ? 0x7a5a48 : 0x5a3a2e, [0, -0.3 + i * 0.12, 0], 'fur']),
    flesh_eye: () => [['ell', [0.025, 0.025, 0.025], [0, 0, 0.026], 0xe0d8b0, 0, { mat: 'organic', spec: 0.7 }], ['cyl', [0.011, 0.011, 0.002], [0, -0.024, 0.03], 0x6a8a3a, Y, 'glass'], ['cyl', [0.005, 0.005, 0.0022], [0, -0.025, 0.03], 0x101010, Y, 'glass'], ['cyl', [0.008, 0.008, 0.02], [0.02, 0.012, 0.012], 0x9a4a3a, [0.3, 1.2, 0], 'organic']],
    boar_hoof: () => [['cyl', [0.024, 0.024, 0.03], [0, 0, 0.05], 0x4a3a2e, 0, 'fur'], ['ell', [0.016, 0.012, 0.022], [0.008, 0.012, 0.018], 0x2a2420, [0.2, 0, 0], { mat: 'plastic', spec: 0.4 }], ['ell', [0.016, 0.012, 0.022], [0.008, -0.012, 0.018], 0x2a2420, [-0.2, 0, 0], { mat: 'plastic', spec: 0.4 }]],
    bs_tentacle: () => [0, 1, 2].flatMap(k => [0, 1, 2, 3].map(i => ['ell', [0.02 - i * 0.003, 0.007 - i * 0.001, 0.007 - i * 0.001], [-0.06 + i * 0.035, (k - 1) * 0.018 + Math.sin(i + k) * 0.006, 0.012], 0x9a7068, [0, 0, Math.sin(i * 1.3 + k) * 0.4], { mat: 'organic', spec: 0.5 }])),
    chimera_claw: () => [['ell', [0.02, 0.016, 0.02], [0, 0, 0.018], 0x4a4440, 0, 'fur']].concat([0, 1, 2, 3].map(i => ['ell', [0.009 - i * 0.0015, 0.008 - i * 0.0015, 0.018], [0.012 + i * 0.012, 0, 0.03 + i * 0.01 - i * i * 0.004], 0xd8d0b8, [0, 0.9 + i * 0.3, 0], { mat: 'plastic', spec: 0.5 }]))
  };

  const QUEST_RIGS = {
    skat2_log: () => [['box', [0.036, 0.028, 0.009], [0, 0, 0.009], 0x2a3448, [0, 0, 0.1], 'leather'], ['box', [0.034, 0.026, 0.006], [0.002, 0, 0.009], 0xd8d0b0, [0, 0, 0.1], { mat: 'paper', stripes: [2400, 'z'] }], ['ell', [0.014, 0.012, 0.003], [0.024, 0.016, 0.018], 0x1a1612, 0, 'plain'], ['ell', [0.01, 0.014, 0.003], [-0.022, -0.012, 0.018], 0x1e1814, 0, 'plain']],
    blackbox: () => [['box', [0.075, 0.045, 0.055], [0, 0, 0.055], 0xe07020, 0, 'plastic'], ['box', [0.0755, 0.0455, 0.01], [0, 0, 0.07], 0x1a1a1a, 0, { mat: 'plastic', stripes: [300, 'x'] }], ['box', [0.03, 0.006, 0.006], [0, 0, 0.116], 0x3a3a3a, 0, 'metal'], ['box', [0.004, 0.006, 0.012], [0.03, 0, 0.108], 0x3a3a3a, 0, 'metal'], ['box', [0.004, 0.006, 0.012], [-0.03, 0, 0.108], 0x3a3a3a, 0, 'metal'], ['cyl', [0.01, 0.01, 0.006], [0.05, -0.046, 0.03], 0x6a6a60, Y, 'metal']],
    tools: () => [['box', [0.085, 0.042, 0.04], [0, 0, 0.04], 0xa02a20, 0, 'metal'], ['box', [0.0855, 0.0425, 0.004], [0, 0, 0.078], 0x7a1a14, 0, 'metal'], ['box', [0.035, 0.006, 0.006], [0, 0, 0.1], 0x2a2a2a, 0, 'metal'], ['box', [0.004, 0.006, 0.014], [0.034, 0, 0.09], 0x2a2a2a, 0, 'metal'], ['box', [0.004, 0.006, 0.014], [-0.034, 0, 0.09], 0x2a2a2a, 0, 'metal'], ['box', [0.06, 0.006, 0.0035], [0.02, -0.02, 0.086], 0x9a9ca0, [0, 0, 0.3], 'chrome'], ['cyl', [0.009, 0.009, 0.0035], [0.075, -0.004, 0.086], 0x9a9ca0, 0, 'chrome']],
    tools2: () => [['box', [0.09, 0.03, 0.018], [0, 0, 0.018], 0x3a5a8a, 0, 'plastic'], ['box', [0.0905, 0.0305, 0.003], [0, 0, 0.02], 0x2a3a5a, 0, 'plastic'], ['box', [0.008, 0.004, 0.006], [0.05, -0.031, 0.024], 0x9a9ca0, 0, 'chrome'], ['box', [0.008, 0.004, 0.006], [-0.05, -0.031, 0.024], 0x9a9ca0, 0, 'chrome'], ['box', [0.025, 0.006, 0.006], [0, -0.034, 0.024], 0x1a1a1a, 0, 'plastic']],
    battery: () => [['box', [0.075, 0.045, 0.055], [0, 0, 0.055], 0x2a2a2a, 0, 'plastic'], ['box', [0.0755, 0.0455, 0.012], [0, 0, 0.05], 0x3a5a3a, 0, 'paper'], ['cyl', [0.009, 0.009, 0.008], [0.045, 0.02, 0.118], 0xc03020, 0, 'metal'], ['cyl', [0.009, 0.009, 0.008], [-0.045, 0.02, 0.118], 0x303030, 0, 'metal'], ['box', [0.03, 0.006, 0.005], [0, 0, 0.112], 0x1a1a1a, 0, 'plastic']],
    stash: () => [['box', [0.085, 0.02, 0.058], [0, 0, 0.058], 0xa8acb0, 0, { mat: 'metal', stripes: [220, 'z'] }], ['box', [0.0855, 0.0205, 0.004], [0, 0, 0.058], 0x6a6e72, 0, 'metal'], ['box', [0.025, 0.007, 0.007], [0, 0, 0.124], 0x1a1a1a, 0, 'plastic'], ['box', [0.006, 0.004, 0.008], [0.05, -0.021, 0.1], 0x9a9ca0, 0, 'chrome'], ['box', [0.006, 0.004, 0.008], [-0.05, -0.021, 0.1], 0x9a9ca0, 0, 'chrome']],
    pda: () => [['box', [0.028, 0.006, 0.044], [0, 0, 0.044], 0x2a2a28, 0, 'plastic'], ['box', [0.021, 0.002, 0.026], [0, -0.0062, 0.056], 0x3a8a4a, 0, { mat: 'glass', glow: 0.7, stripes: [900, 'z'] }], ['box', [0.004, 0.002, 0.004], [-0.01, -0.0062, 0.02], 0x6a6a64, 0, 'metal'], ['box', [0.004, 0.002, 0.004], [0.01, -0.0062, 0.02], 0x6a6a64, 0, 'metal'], ['cyl', [0.002, 0.002, 0.014], [0.022, 0, 0.1], 0x1a1a1a, 0, 'rubber']],
    docs: () => [['box', [0.04, 0.03, 0.0015], [0, 0, 0.004], 0xe0d8b8, [0, 0, 0.15], { mat: 'paper', stripes: [1800, 'y'] }], ['box', [0.036, 0.028, 0.0015], [0.012, 0.004, 0.0075], 0xd8d0b0, [0.12, 0, -0.1], { mat: 'paper', stripes: [1800, 'y'] }]]
  };

  const ITEM_VIEW = {}, RIGS = {};
  const DET = { az: -1.2, el: 0.26 }, ART = { az: 0.55, el: 0.42 };
  const reg = (map, view, names) => { for (const [k, f] of Object.entries(map)) { const id = (names && names[k]) || k; RIGS[id] = f; ITEM_VIEW[id] = view; } };
  reg(WEAPON_RIGS, SIDE);
  reg(AMMO_RIGS, ISO);
  reg(OUTFIT_RIGS, FRONT);
  reg(DETECTOR_RIGS, DET);
  reg(ART_RIGS, ART);
  reg(CONS_RIGS, ISO);
  reg(PART_RIGS, ISO);
  reg(QUEST_RIGS, ISO, { tools: 'tools_rough', tools2: 'tools_fine', battery: 'accum', stash: 'nimble_case', pda: 'looter_pda', docs: 'noah_letter' });
  RIGS.skat2_log = QUEST_RIGS.skat2_log;
  ITEM_VIEW.vodka = { az: 0.5, el: 0.25 };
  ITEM_VIEW.f1 = { az: 0.5, el: 0.3 };
  ITEM_VIEW.nimble_case = { az: 0.22, el: 0.3 };

  const FOOT = {
    knife: [2, 1], pm: [2, 2], fort: [2, 2], pb: [3, 2], toz: [5, 2], chaser: [5, 2], aksu: [4, 2], ak: [5, 2], trs: [5, 2], vintorez: [5, 2], svd: [6, 2],
    jacket: [2, 3], zarya: [2, 3], merc: [2, 3], berill: [2, 3], seva: [2, 3], exo: [2, 3],
    otklik: [1, 2], medved: [1, 2], veles: [1, 2],
    vodka: [1, 2], bread: [2, 1], sausage: [2, 1], dog_tail: [2, 1], bs_tentacle: [2, 1],
    blackbox: [2, 2], tools_rough: [2, 2], tools_fine: [2, 1], accum: [2, 2], nimble_case: [2, 1]
  };

  function footprint(id) { return FOOT[id] || [1, 1]; }

  function pack(list, cols) {
    const occ = [];
    const free = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (occ[yy] && occ[yy][xx]) return false; return true; };
    const out = [];
    let rows = 0;
    for (const it of list) {
      const f = footprint(it.id), w = Math.min(cols, f[0]), h = f[1];
      for (let y = 0, done = false; !done; y++) for (let x = 0; x + w <= cols; x++) {
        if (!free(x, y, w, h)) continue;
        for (let yy = y; yy < y + h; yy++) { occ[yy] = occ[yy] || new Uint8Array(cols); for (let xx = x; xx < x + w; xx++) occ[yy][xx] = 1; }
        out.push({ it, x, y, w, h }); rows = Math.max(rows, y + h); done = true; break;
      }
    }
    return { cells: out, rows };
  }
  const cache = new Map();
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const blank = (w, h) => ({ w, h, data: new Uint32Array(w * h) });

  function render(id, cell) {
    const key = id + '@' + cell;
    let img = cache.get(key);
    if (img) return img;
    const f = footprint(id), rig = RIGS[id];
    img = rig ? renderSpec(rig(), ITEM_VIEW[id] || ISO, f[0] * cell, f[1] * cell) : blank(f[0] * cell, f[1] * cell);
    cache.set(key, img);
    return img;
  }

  function world(id) {
    const rig = RIGS[id];
    if (!rig) return null;
    const spec = rig(), v = ITEM_VIEW[id] || ISO, view = footprint(id)[1] >= 3 ? { az: 0.1, el: 1.3 } : { az: v.az + 0.25, el: Math.max(v.el, 0.5) };
    const bb = bounds(prepare(spec), camera(view)), ex = bb.x1 - bb.x0, ey = bb.y1 - bb.y0;
    const ppm = Math.min(420, 44 / Math.max(ex, ey));
    const w = Math.max(6, Math.ceil(ex * ppm) + 4), h = Math.max(6, Math.ceil(ey * ppm) + 4);
    const img = renderSpec(spec, view, w, h, { margin: 2, shadow: 0 });
    const k = Math.min((w - 4) / ex, (h - 4) / ey);
    return { w, h, data: img.data, ppm: k, ax: w / 2, ay: h - 2 - (h - 4 - ey * k) / 2 };
  }

  function job(id, cell) {
    const key = id + '@' + cell, f = footprint(id), out = {};
    let it = null;
    return {
      key,
      step(ms) {
        if (cache.has(key)) return cache.get(key);
        if (!RIGS[id]) { cache.set(key, blank(f[0] * cell, f[1] * cell)); return cache.get(key); }
        const t0 = now();
        if (!it) it = specRows(RIGS[id](), ITEM_VIEW[id] || ISO, f[0] * cell, f[1] * cell, {}, out);
        while (now() - t0 < ms) if (it.next().done) { cache.set(key, out.img); return out.img; }
        return null;
      }
    };
  }

  C.Icons = { render, job, pack, world, cached: (id, cell) => cache.get(id + '@' + cell) || null, footprint, renderSpec, RIGS, FOOT, VIEWS: { SIDE, ISO, FRONT, TOP }, has: id => !!RIGS[id] };
})(globalThis.Cop98 = globalThis.Cop98 || {});
